/* Mother Earth — the Animals tab: its own globe, one journey at a time (animals-tab-rc, stage 1, 20 Nov 2026;
 * docs/concepts/ANIMALS-BIRD-BUILD-PROPOSAL.md rev 3.1, Part A: criteria T1–T18 with the §A7 clarifications).
 * The REAL page files in Chromium, served by this suite's own server, with the committed journey list, manifests and display
 * files (assets/animals/). Expected values (which fix is last at a time, how many joins) are worked out here from the files,
 * separately from the page's code. This suite replaces phase1/animals-journey-ui.test.cjs, which tested the replay on Earth now.
 * What it does NOT prove: performance; a real phone; a screen reader (roles, names, states and focus are read from the page, not
 * heard); real NASA imagery (a small stand-in picture is served); a real lost graphics context on real hardware (the browser's
 * own lose-context extension is used); the full-source build checks (the source files are not in the repository).
 * The line-rule and bad-content fixtures are served with their own journey-list checksum pinned in place of the real one: a
 * harness substitution, stated here.
 * Sections 16 and 17 and checks 12h to 12m were added after GPT's Stage 1 review (phone reveal; the list Retry's lifecycle; the
 * sampled bar-text sweep carried over from the old suite).
 * Sections 18 and 19 are stage 2: the waved albatross (withheld fixes, the recording-period replay, the tag's accuracy estimate).
 * Breaks: BREAK=<name> edits one served file; the suite must then FAIL at the check named in EXPECT ("BREAK CAUGHT"), or it
 * prints BREAK MISSED. SECTIONS=1,4 runs parts.
 * Needs the npm packages playwright (with its Chromium), pngjs and globe.gl@2.45.0, found through NODE_PATH (or ME_GLOBE_JS for
 * the library file). Section 13 compares with main: from Git when the tree is a clone, or from BASE_DIR=<folder holding main's
 * files at BASE_MAIN>; with neither, its file comparisons are reported NOT RUN and the suite exits non-zero.
 * Run: NODE_PATH=<node_modules with playwright, pngjs, globe.gl> node --no-warnings phase1/animals-tab-ui.test.cjs */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto'), cp = require('child_process');
const { PNG } = require('pngjs');
const ROOT = path.join(__dirname, '..'), HUB = 'mother-earth.chadoberholzer.workers.dev';
// the globe library is served from a local copy in place of unpkg: ME_GLOBE_JS=<path to globe.gl.min.js>, or the globe.gl package
// found through NODE_PATH. It must be the version the page pins (2.45.0); check 1k reads the version from the file's own banner.
const GLOBE_PATH = process.env.ME_GLOBE_JS || (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(d => path.join(d, 'globe.gl', 'dist', 'globe.gl.min.js')).find(f => fs.existsSync(f));
if (!GLOBE_PATH) { console.log('FAIL  globe.gl@2.45.0 not found: set ME_GLOBE_JS or put the package on NODE_PATH'); process.exit(1); }
const GLOBE_JS = fs.readFileSync(GLOBE_PATH, 'utf8'), GLOBE_VER = (/Version (\d+\.\d+\.\d+) globe\.gl/.exec(GLOBE_JS.slice(0, 400)) || [])[1] || (() => { try { return require(path.join(path.dirname(GLOBE_PATH), '..', 'package.json')).version; } catch (_) { return null; } })();
const BASE_MAIN = process.env.BASE_MAIN || '0e620831b83b2ae7eed11a932edfd902d933f195';   // the exact main commit merged into this branch (T13 baseline)
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const BREAK = process.env.BREAK || '', EDIT = process.env.EDIT || '';
const ONLY = (process.env.SECTIONS || '').split(',').filter(Boolean).map(Number), want = n => !ONLY.length || ONLY.includes(n);
let pass = 0, fail = 0; const failed = [];
const ok = (n, c, got) => { if (c) pass++; else { fail++; failed.push(n); console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 1600)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 20 min'); process.exit(1); }, 20 * 60e3);

const JS = 'animals-journey.js', GJS = 'animals-globe.js';
const BREAKS = {
  'not-exclusive': [JS, "const prev = st.choice; if (prev) off();", "const prev = null;"],
  // with the request no longer aborted AND the generation check gone, a superseded answer would draw
  'late-answer-draws': [JS, "const abortLoad = () => { const c = st.abort; st.abort = null; if (c) try { c.abort(); } catch (_) { } };", "const abortLoad = () => { st.abort = null; };", "const jr = verify(man, d, ce.animal); if (gen !== st.gen) return;", "const jr = verify(man, d, ce.animal);",
    "const db = await get(J.BASE + ent.file); if (gen !== st.gen) return;", "const db = await get(J.BASE + ent.file);", "if (db.byteLength !== ent.bytes || await hex(db) !== ent.sha256) throw new Unverified('the display file does not match the manifest checksum'); if (gen !== st.gen) return;", "if (db.byteLength !== ent.bytes || await hex(db) !== ent.sha256) throw new Unverified('the display file does not match the manifest checksum');"],
  'off-no-cancel': [JS, "function off() { st.on = false; st.gen++; abortLoad();", "function off() { st.on = false; abortLoad();"],
  'off-no-abort': [JS, "function off() { st.on = false; st.gen++; abortLoad();", "function off() { st.on = false; st.gen++;"],
  'load-on-open': [JS, "  window.addEventListener('hashchange', reveal);\n  paint();", "  window.addEventListener('hashchange', reveal);\n  paint(); select(switches[0].dataset.journey);"],
  'deep-link-switches-on': [JS, "b.focus({ preventScroll: true }); }", "b.focus({ preventScroll: true }); b.click(); }"],
  'fail-stays-on': [JS, "      off(); st.choice = null;\n      if (shared)", "      off();\n      if (shared)"],
  'list-error-local': [JS, "      if (shared) { st.catErr = unv ? J.T.catUnverified : J.T.catFailed;", "      if (false) { st.catErr = unv ? J.T.catUnverified : J.T.catFailed;"],
  'no-catalogue-check': [JS, "if (await hex(cb) !== J.CATALOG_SHA256) throw new Unverified('the journey list does not match its pinned checksum');", ''],
  'no-manifest-check': [JS, "if (await hex(mb) !== ce.manifest_sha256) throw new Unverified('the manifest does not match the checksum in the journey list');", ''],
  'no-display-check': [JS, "if (db.byteLength !== ent.bytes || await hex(db) !== ent.sha256) throw new Unverified('the display file does not match the manifest checksum');", ''],
  'no-content-check': [JS, "if (!Number.isInteger(t) || (i && t <= d.t[i - 1])) throw new Unverified('fix times are not whole seconds in increasing order');", ''],
  'marker-next-fix': [JS, 'if (t[mid] <= s) lo = mid; else hi = mid - 1; } return lo; }', 'if (t[mid] <= s) lo = mid; else hi = mid - 1; } return Math.min(t.length - 1, lo + 1); }'],
  'future-fixes-drawn': [JS, 'o.fixes.geometry.setDrawRange(0, i >= 0 ? (i + 1) * 3 : 0);', 'o.fixes.geometry.setDrawRange(0, st.d.t.length * 3);'],
  'join-over-rule': [JS, "const joins = (d, rule, i) => d.t[i] - d.t[i - 1] <= rule && (!d.j || d.j[i] === 1);", "const joins = (d, rule, i) => d.t[i] - d.t[i - 1] <= rule + 1 && (!d.j || d.j[i] === 1);"],
  'ignore-join-flags': [JS, "const joins = (d, rule, i) => d.t[i] - d.t[i - 1] <= rule && (!d.j || d.j[i] === 1);", "const joins = (d, rule, i) => d.t[i] - d.t[i - 1] <= rule;"],
  'autoplay': [JS, "seek(d.t[0], true); goArea();", "seek(d.t[0], true); goArea(); play();"],
  'announce-per-frame': [JS, "st.rtExact = next; st.rt = Math.floor(next);", "announce('t ' + next); st.rtExact = next; st.rt = Math.floor(next);"],
  // both guards removed (the switch's own and select()'s): a switch marked unavailable would then start a load
  'disabled-still-loads': [JS, "    if (why) { st.choice = null; if (!quiet) announce(`${nameOf(id)} cannot be shown. ${why}`); return paint(); }\n", '', "    if (b.getAttribute('aria-disabled') === 'true') return announce(`${nameOf(id)} cannot be shown. ${blocked()}`);\n", ''],
  'no-pagehide-reset': [JS, "window.addEventListener('pagehide', () => { cancelList(); if (st.choice) select(null, true); else paint(); });", "window.addEventListener('pagehide', () => { cancelList(); paint(); });"],
  'hidden-keeps-playing': [JS, "document.addEventListener('visibilitychange', () => { if (document.hidden && st.playing) pause(false); });", ''],
  'date-kept-on-fallback': [GJS, "st.backdrop === 'plain' ? (st.coast === 'failed' ? G.T.plainNoCoast : G.T.plain) : G.T.loading", "st.backdrop === 'plain' ? G.T.imagery : G.T.loading"],
  'auto-rotate': [GJS, "globe.controls().autoRotate = false;\n      st.globe = 'ok';", "globe.controls().autoRotate = true;\n      st.globe = 'ok';"],
  'coast-always-fetched': [GJS, "      size(); loadBackdrop();", "      size(); loadBackdrop(); loadCoast();"],
  'filtered-says-recorded': [JS, "const F = !!st.man.card;", "const F = false;"],
  'no-phone-scroll': [JS, "function showGlobe() { const box = $('an-globe-box'), panel = $('an-panel'); if (!box || !panel) return;", "function showGlobe() { const box = $('an-globe-box'), panel = $('an-panel'); return;"],
  'scroll-on-answer': [JS, "seek(d.t[0], true); goArea();", "seek(d.t[0], true); goArea(); showGlobe();"],
  'scroll-on-off': [JS, "if (turnOn && st.choice === id) showGlobe(); });", "showGlobe(); });"],
  'scroll-ignores-reduced-motion': [JS, "const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),", "const reduce = false,"],
  'deep-link-scrolls-to-globe': [JS, "b.focus({ preventScroll: true }); }", "b.focus({ preventScroll: true }); showGlobe(); }"],
  'no-status-by-globe': [JS, "ns.textContent = t; ns.hidden = !t; }", "ns.textContent = ''; ns.hidden = true; }"],
  'selection-keeps-list-retry': [JS, "    cancelList(); st.note = '';\n", "    st.note = '';\n"],
  'list-retry-no-token': [JS, "} catch (e) { if (tok !== st.listTok) return; err = J.T.catFailed;", "} catch (e) { err = J.T.catFailed;"],
  'list-retry-late-success': [JS, "const h = await hex(b); if (tok !== st.listTok) return;", "const h = await hex(b);", "const b = await r.arrayBuffer(); if (tok !== st.listTok) return;", "const b = await r.arrayBuffer();", "const r = await fetch(J.CATALOG, { cache: 'no-store', signal: c.signal }); if (tok !== st.listTok) return;", "const r = await fetch(J.CATALOG, { cache: 'no-store' });"],
  'list-retry-no-time-limit': [JS, "L = { c, timer: setTimeout(() => c.abort(), J.WAIT_MS) }; st.list = L; paint();", "L = { c, timer: 0 }; st.list = L; paint();"],
  'pagehide-keeps-list-retry': [JS, "window.addEventListener('pagehide', () => { cancelList(); if", "window.addEventListener('pagehide', () => { if"],
  // stage 2: the bird
  'marker-in-withheld': [JS, "o.marker.visible = vis && i >= 0 && !st.hid;", "o.marker.visible = vis && i >= 0;"],
  'hidden-ends-at-last-withheld': [JS, "for (const h of H) if (s >= h.from && s < h.to) return h; return null; };", "for (const h of H) if (s >= h.from && s <= h.p[1]) return h; return null; };"],
  'tried-before-reached': [JS, "if (x > t[i] && x < next && x <= st.rt) f = x;", "if (x > t[i] && x < next) f = x;"],
  'accuracy-in-withheld': [JS, "are not shown. No marker is shown` +", "are not shown. No marker is shown · Tag's accuracy estimate ${i >= 0 ? d.acc[i] : 0} m` +"],
  'replay-starts-at-first-fix': [JS, "setBarFrame(); paint(); seek(st.R0, true); goArea();", "setBarFrame(); paint(); seek(d.t[0], true); goArea();"],
  'replay-ends-at-last-fix': [JS, "    const end = st.R1, next = st.rtExact + dt * st.speed;", "    const end = st.d.t[st.d.t.length - 1], next = st.rtExact + dt * st.speed;"],
  'bird-says-not-displayed': [JS, "      if (st.man.kind === 'gps-filtered') {", "      if (false) {"],
  'new-fields-optional': [JS, "if (!Array.isArray(d[f])) throw new Unverified(`the display file lacks \"${f}\", which this journey requires`);", ""],
  'no-acc-check': [JS, "if (!Array.isArray(d.acc) || d.acc.length !== n || d.acc.some(x => typeof x !== 'number' || !Number.isFinite(x) || x < 0)) throw new Unverified('the accuracy estimates are missing or malformed'); }", "}"],
  'no-inside-period-check': [JS, "if (lo < n && d.t[lo] <= l) throw new Unverified('a displayed fix lies inside a withheld period');", ""],
  'join-across-withheld-accepted': [JS, "if (lo > 0 && lo < n && (!d.j || d.j[lo] !== 0)) throw new Unverified('a step is joined across a withheld period');", ""],
  'no-failed-check': [JS, "|| ts.has(x) || W.some(p => x >= p[0] && x <= p[1])) throw", ") throw"],
  'stops-skip-withheld-starts': [JS, "[...new Set([st.R0, ...d.t, ...W.map(p => p[0]), st.R1])]", "[...new Set([st.R0, ...d.t, st.R1])]"],
  'chooser-back': ['animals.html', '<div class="vh" id="an-say" aria-live="polite"></div>', '<select id="journey-choose"><option>x</option></select><div class="vh" id="an-say" aria-live="polite"></div>'],
  'switch-unlabelled': ['animals.html', '<span class="t">White shark, tag 118845 (2012–2013)</span>', '<span class="t"></span>'],
};
// EDIT=no-abort is not a break: requests are no longer aborted, and section 5 must STILL pass apart from the two checks that the
// request itself was aborted (5b, 5g). It shows the generation check alone refuses a superseded answer.
const EDITS = { 'no-abort': [JS, "const abortLoad = () => { const c = st.abort; st.abort = null; if (c) try { c.abort(); } catch (_) { } };", "const abortLoad = () => { st.abort = null; };"] };
const EXPECT = { 'not-exclusive': '3b', 'late-answer-draws': '5a', 'off-no-cancel': '5c', 'off-no-abort': '5g', 'load-on-open': '1b', 'deep-link-switches-on': '8a', 'fail-stays-on': '6a', 'list-error-local': '6h',
  'no-catalogue-check': '6h', 'no-manifest-check': '6f', 'no-display-check': '6e', 'no-content-check': '6g', 'marker-next-fix': '2d', 'future-fixes-drawn': '2e', 'join-over-rule': '12a', 'ignore-join-flags': '12c',
  'autoplay': '2b', 'announce-per-frame': '7e', 'disabled-still-loads': '11b', 'no-pagehide-reset': '9a', 'hidden-keeps-playing': '9c', 'date-kept-on-fallback': '10b', 'auto-rotate': '1g', 'coast-always-fetched': '1f',
  'chooser-back': '1d', 'switch-unlabelled': '1c', 'filtered-says-recorded': '12h', 'no-phone-scroll': '16b', 'scroll-on-answer': '16c', 'scroll-on-off': '16e', 'scroll-ignores-reduced-motion': '16b',
  'deep-link-scrolls-to-globe': '16j', 'no-status-by-globe': '16b', 'selection-keeps-list-retry': '17a', 'list-retry-no-token': '17a', 'list-retry-late-success': '17c', 'list-retry-no-time-limit': '17h', 'pagehide-keeps-list-retry': '17f',
  'marker-in-withheld': '18c', 'hidden-ends-at-last-withheld': '18c', 'tried-before-reached': '18e', 'accuracy-in-withheld': '18a', 'replay-starts-at-first-fix': '18a', 'replay-ends-at-last-fix': '18m',
  'bird-says-not-displayed': '18f', 'new-fields-optional': '19a', 'no-acc-check': '19b', 'no-inside-period-check': '19d', 'join-across-withheld-accepted': '19c', 'no-failed-check': '19e', 'stops-skip-withheld-starts': '18i' };
if (BREAK && !(BREAKS[BREAK] && EXPECT[BREAK])) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }

// ---------- files
const real = name => fs.readFileSync(path.join(ROOT, 'assets/animals', name));
const CAT = real('journeys-R1.catalog.json'), CATJ = JSON.parse(CAT), CAT_PIN = sha(CAT);
const JOUR = Object.fromEntries(CATJ.journeys.map(e => { const m = JSON.parse(real(e.manifest)), j = m.journeys.find(x => x.animal === e.animal); return [e.id, { e, m, j, d: JSON.parse(real(j.file)) }]; }));
const Z = 'zebra-botswana-Z3866', SH = 'white-shark-sa-118845', W = 'false-killer-whale-hawaii-98364', BIRD = 'waved-albatross-galapagos-3275-30662', IDS = [Z, SH, W, BIRD];
const NAME = { [Z]: 'Plains zebra', [SH]: 'White shark', [W]: 'False killer whale', [BIRD]: 'Waved albatross' };
/** where a journey's replay starts: the start of the recording (the bird's is before its first displayed fix) */
const startOf = id => Number.isInteger(JOUR[id].j.record_first_s) ? JOUR[id].j.record_first_s : JOUR[id].d.t[0];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const utc = s => { const x = new Date(s * 1000).toISOString(); return `${+x.slice(8, 10)} ${MON[+x.slice(5, 7) - 1]} ${x.slice(0, 4)} ${x.slice(11, 19)} UTC`; };
const lastAt = (t, s) => { let k = -1; for (let i = 0; i < t.length && t[i] <= s; i++) k = i; return k; };                 // plain scan, not the page's search
const joinsTo = (d, rule, i) => { let k = 0; for (let j = 1; j <= i; j++) if (d.t[j] - d.t[j - 1] <= rule && (!d.j || d.j[j] === 1)) k++; return k; };
const BACKDROP = (() => { const p = new PNG({ width: 64, height: 32 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = 10; p.data[i + 1] = 30; p.data[i + 2] = 60; p.data[i + 3] = 255; } return PNG.sync.write(p); })();
/** a fixture for one journey: its display file and manifest replaced, the journey list re-pinned (harness substitution) */
function fixture(id, mutate) { const T = JOUR[id], d = JSON.parse(JSON.stringify(T.d)), m = JSON.parse(JSON.stringify(T.m)); const jr = m.journeys.find(x => x.animal === T.e.animal);
  mutate(d, m, jr); const db = Buffer.from(JSON.stringify(d)); jr.file = 'fx-' + id + '.json'; jr.bytes = db.length; jr.sha256 = sha(db);
  const mb = Buffer.from(JSON.stringify(m)), cat = Buffer.from(JSON.stringify({ ...CATJ, journeys: CATJ.journeys.map(e => e.id === id ? { ...e, manifest_sha256: sha(mb) } : e) }));
  return { id, display: db, manifest: mb, cat, file: jr.file, d, m, jr }; }

// ---------- server. S.over[file name] = { status, body, hold } overrides one asset; S.cat = bytes for the journey list; S.fx = a fixture
const S = { over: {}, q: {}, cat: null, fx: null, log: [], keepable: false };   // S.q[file name] = one-off answers, used in order before S.over
const reset = () => Object.assign(S, { over: {}, q: {}, cat: null, fx: null, log: [], keepable: false });
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.bin': 'application/octet-stream' };
function served(f) { let t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const E of [BREAK && BREAKS[BREAK], EDIT && EDITS[EDIT]]) if (E && E[0] === f) for (let k = 1; k < E.length; k += 2) { const a = E[k], b = E[k + 1]; if (t.split(a).length !== 2) { console.log('FAIL  edit did not apply: ' + (BREAK || EDIT)); process.exit(1); } t = t.replace(a, b); }
  if (S.fx && (f === JS || f === 'animals.js')) { if (t.split(CAT_PIN).length !== 2) { console.log('FAIL  pinned checksum not found in ' + f); process.exit(1); } t = t.replace(CAT_PIN, sha(S.fx.cat)); }
  return t; }
const srv = http.createServer(async (q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0]), f = p.replace(/^\//, '') || 'index.html';
  const send = (code, type, body) => { s.writeHead(code, { 'content-type': type, 'cache-control': S.keepable ? 'no-cache' : 'no-store' }); s.end(body); };
  if (p.startsWith('/assets/animals/')) { const name = p.split('/').pop(); S.log.push(name); const o = S.q[name] && S.q[name].length ? S.q[name].shift() : S.over[name];
    if (o && o.hold) await o.hold;
    if (o && o.status && o.status !== 200) return send(o.status, 'text/plain', 'no');
    if (o && o.body) return send(200, 'application/json', o.body);
    if (name.endsWith('.catalog.json')) return send(200, 'application/json', S.cat || (S.fx ? S.fx.cat : CAT));
    if (S.fx && name === JOUR[S.fx.id].e.manifest) return send(200, 'application/json', S.fx.manifest);
    if (S.fx && name === S.fx.file) return send(200, 'application/json', S.fx.display);
    return fs.existsSync(path.join(ROOT, 'assets/animals', name)) ? send(200, 'application/json', real(name)) : send(404, 'text/plain', ''); }
  if (p === '/assets/coast-50m.bin') S.log.push('coast-50m.bin');
  if (!fs.existsSync(path.join(ROOT, f)) || fs.statSync(path.join(ROOT, f)).isDirectory()) return send(404, 'text/plain', '');
  const ext = path.extname(f); if (TYPES[ext] && ext !== '.json' && ext !== '.bin') return send(200, TYPES[ext], served(f));
  send(200, TYPES[ext] || 'application/octet-stream', fs.readFileSync(path.join(ROOT, f)));
});
let BASE;
/** opts: img 'ok' | 'fail' | 'xml' | 'hang' ; lib false = the globe library is blocked */
async function ctxFor(browser, vp, opts = {}) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce', ...(opts.extra || {}) }); ctx._img = [];
  await ctx.route('**/unpkg.com/**', r => opts.lib === false ? r.abort() : r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => { ctx._img.push(r.request().url()); const m = opts.img || 'ok';
    if (m === 'fail') return r.abort(); if (m === 'hang') return;                                                        // 'hang': never answered
    if (m === 'xml') return r.fulfill({ status: 200, contentType: 'application/xml', headers: { 'access-control-allow-origin': '*' }, body: '<ServiceExceptionReport/>' });
    return r.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: BACKDROP }); });
  return ctx;
}
async function open(browser, vp = { width: 1280, height: 860 }, hash = '', opts = {}) {
  const ctx = await ctxFor(browser, vp, opts); if (opts.pre) await opts.pre(ctx);
  const page = await ctx.newPage(), errs = [], reqs = [], failedReqs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('request', r => reqs.push(r.url())); page.on('requestfailed', r => failedReqs.push([r.url().split('/').pop().split('?')[0], (r.failure() || {}).errorText || '']));
  await page.goto(BASE + '/animals.html' + hash, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.journey && ME.animalsGlobe && ME.animalsPage, null, { timeout: 30000 });
  if (!opts.noWait) await page.waitForFunction(() => { const g = ME.animalsGlobe.state(); return g.globe !== 'ok' || (g.backdrop === 'imagery') || (g.backdrop === 'plain' && g.coast !== 'loading' && g.coast !== 'idle'); }, null, { timeout: 30000 });
  await page.waitForFunction(() => [...document.querySelectorAll('.an-study [data-f="state"]')].every(e => !/Checking/.test(e.textContent)), null, { timeout: 30000 });
  await page.waitForTimeout(400);
  return { ctx, page, errs, reqs, failedReqs };
}
const state = page => page.evaluate(() => ({ ...ME.journey.state(), scene: ME.journey.sceneCount(), g: ME.animalsGlobe.state(), barHidden: document.getElementById('replay').hidden,
  say: document.getElementById('an-say').textContent, play: document.getElementById('replay-play').textContent, note: document.getElementById('replay-note').textContent, rule: document.getElementById('replay-rule').textContent,
  range: document.getElementById('replay-range').value, y: Math.round(scrollY), vh: innerHeight,
  box: (() => { const r = document.getElementById('an-globe-box').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; })(),
  beside: (() => { const e = document.getElementById('an-status'), r = e.getBoundingClientRect(); return e.hidden ? null : { text: e.textContent, inView: r.top >= 0 && r.bottom <= innerHeight }; })(),
  barTop: (() => { const e = document.getElementById('replay'); return e.hidden ? null : Math.round(e.getBoundingClientRect().top); })(),
  retryBtn: (() => { const e = document.getElementById('an-integrity-retry'); return [e.textContent, e.getAttribute('aria-busy')]; })(), focus: document.activeElement ? document.activeElement.id : null, integrity: document.getElementById('an-integrity').hidden ? null : document.getElementById('an-integrity-text').textContent }));
const checked = s => IDS.filter(id => s.switches[id].checked === 'true');
const tgl = id => '#tgl-' + id;
const settle = (page, id, st = 'ready') => page.waitForFunction(([i, w]) => { const s = ME.journey.state(); return w === 'off' ? s.status === 'off' : (s.choice === i && s.status === w); }, [id, st], { timeout: 30000 });
const on = async (page, id, st = 'ready') => { await page.click(tgl(id)); await settle(page, id, st); };
const coordsOf = (page, lat, lon) => page.evaluate(([la, lo, alt]) => { const c = ME.animalsGlobe.raw().getCoords(la, lo, alt); return [c.x, c.y, c.z]; }, [lat, lon, 0.004]);
const near = (a, b) => a && b && a.every((v, i) => Math.abs(v - b[i]) < 1e-3);
/** wait until no load is in flight, whatever its outcome (the checks then say what the outcome must be) */
const done = page => page.waitForFunction(() => ME.journey.state().status !== 'loading', null, { timeout: 30000 }).then(() => page.waitForTimeout(200));
const gate = () => { let go; const p = new Promise(r => { go = r; }); return { p, go }; };

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
  // ===== 1. At load (T1, T2, T3, T12, T15)
  if (want(1)) { reset(); const { ctx, page, errs, reqs } = await open(browser); const s = await state(page);
    ok('1a no page error at load', errs.length === 0, errs);
    ok('1b nothing is on at load: every switch reads off, nothing is drawn, the replay bar is hidden', checked(s).length === 0 && s.choice === null && s.scene === 0 && s.barHidden && IDS.every(id => s.switches[id].state === 'off'), s.switches);
    const dom = await page.evaluate(() => ({ sw: [...document.querySelectorAll('#an-panel button.an-tgl')].map(b => ({ id: b.dataset.journey, role: b.getAttribute('role'), checked: b.getAttribute('aria-checked'), label: b.textContent.trim(), acc: b.getAttribute('aria-label'),
        desc: (document.getElementById(b.getAttribute('aria-describedby')) || {}).textContent || '', h: b.getBoundingClientRect().height })),
      group: (() => { const g = document.getElementById('an-panel'); return { role: g.getAttribute('role'), name: (document.getElementById(g.getAttribute('aria-labelledby')) || {}).textContent, desc: (document.getElementById(g.getAttribute('aria-describedby')) || {}).textContent }; })(),
      groups: [...document.querySelectorAll('#an-panel h3.an-grp')].map(h => h.textContent.trim()), selects: [...document.querySelectorAll('select')].map(x => x.id), radios: document.querySelectorAll('[role="radio"],[role="radiogroup"],input[type="radio"]').length,
      tabs: [...document.querySelectorAll('nav.tabs a')].map(a => [a.textContent.trim(), a.getAttribute('aria-current')]) }));
    ok('1c each animal has one labelled switch: role="switch", unchecked, a visible label that begins with the journey list\'s label and carries the years, described by its evidence line, at least 44 px high',
      dom.sw.length === IDS.length && dom.sw.every(b => b.role === 'switch' && b.checked === 'false' && !b.acc && b.label.startsWith(JOUR[b.id].e.label) && /\(\d{4}(–\d{4})?\)$/.test(b.label) && /dated record, not current/.test(b.desc) && b.h >= 44), dom.sw);
    ok('1d no chooser: the only select on the page is the replay speed; no radio semantics', dom.selects.join() === 'replay-speed' && dom.radios === 0, [dom.selects, dom.radios]);
    ok('1e the switches are one labelled group that says "one at a time"; groups are Land, Sea and Air', dom.group.role === 'group' && /one at a time/i.test(dom.group.name) && /Switching another on switches the first off/.test(dom.group.desc) && /Nothing is on when the page opens/.test(dom.group.desc) && dom.groups.join() === 'Land,Sea,Air', dom);
    const assets = S.log.slice(), allowed = u => u.startsWith(BASE) || /^https:\/\/unpkg\.com\/globe\.gl@2\.45\.0\//.test(u) || /^https:\/\/fonts\.googleapis\.com\//.test(u) || /^https:\/\/gibs\.earthdata\.nasa\.gov\//.test(u) || u.startsWith('blob:') || u.startsWith('data:');
    ok('1f network at load: the journey list and one manifest per card; NO journey display file; no coastline file while imagery is shown; one imagery request; no hub request; only the allowed origins',
      assets.filter(n => /catalog/.test(n)).length >= 1 && assets.filter(n => /manifest/.test(n)).length === IDS.length && !assets.some(n => IDS.some(id => n === JOUR[id].j.file)) && !assets.includes('coast-50m.bin') && ctx._img.length === 1 && !reqs.some(u => u.includes(HUB)) && reqs.every(allowed), { assets, img: ctx._img.length, other: reqs.filter(u => !allowed(u)) });
    ok('1g the globe is ready, still (no auto-rotation), showing the whole Earth; the backdrop line gives the picture\'s own date and says it is not the journey dates',
      s.g.globe === 'ok' && s.g.autoRotate === false && Math.abs(s.g.view.altitude - 2.2) < 0.01 && s.g.backdrop === 'imagery' && /^Backdrop: NASA satellite imagery for \d{2} [A-Z][a-z]{2} \d{4} \(NASA GIBS, VIIRS NOAA-21\), not the journey dates\./.test(s.g.note) && /Dark areas/.test(s.g.note), s.g);
    ok('1h the header has the five tabs with Animals current', dom.tabs.map(t => t[0]).join() === 'Earth now,Timeline,Moon,Sun,Animals' && dom.tabs[4][1] === 'page' && dom.tabs.slice(0, 4).every(t => !t[1]), dom.tabs);
    const img = await page.evaluate(() => ({ url: ME.animalsGlobe.IMG_URL, day: ME.animalsGlobe.IMG_DAY, G: ME.animalsGlobe.G }));
    const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'), idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const wantDay = new Date(Date.now() - 36 * 3600e3).toISOString().slice(0, 10);
    const PREFIX = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/jpeg&WIDTH=2048&HEIGHT=1024&CRS=EPSG:4326&BBOX=-90,-180,90,180&TIME=';
    ok('1i the backdrop uses Earth now\'s own selection rule: the same 36-hour date offset and layer as app.js, and the same address as index.html builds',
      app.includes('new Date(Date.now() - 36 * 3600e3).toISOString().slice(0, 10)') && app.includes(`id: '${img.G.IMG_LAYER}', sat: '${img.G.IMG_SAT}'`) && img.G.IMG_OFFSET_H === 36 && img.day === wantDay &&
      idx.includes("const gibs = '" + PREFIX + "' + IMG_DAY + '&LAYERS=' + IMG_LAYER.id;") && img.url === PREFIX + wantDay + '&LAYERS=' + img.G.IMG_LAYER && ctx._img[0] === img.url, [img.url, ctx._img]);
    ok('1k the globe library served by this suite is the version the page pins (2.45.0)', GLOBE_VER === '2.45.0' && /unpkg\.com\/globe\.gl@2\.45\.0\//.test(fs.readFileSync(path.join(ROOT, 'animals.html'), 'utf8')), GLOBE_VER);
    // the tabs on every page
    for (const pg of ['index.html', 'timeline.html', 'moon.html', 'sun.html', 'sources.html']) { const p2 = await ctx.newPage(); await p2.goto(BASE + '/' + pg, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(300);
      const t = await p2.evaluate(() => [...document.querySelectorAll('nav.tabs a')].map(a => a.getAttribute('href'))); ok(`1j ${pg}: one Animals tab, last, beside Moon and Sun`, t.join() === 'index.html,timeline.html,moon.html,sun.html,animals.html', t); await p2.close(); }
    await ctx.close(); }

  // ===== 2. One journey on (T4, T18): the zebra
  if (want(2)) { reset(); const g = gate(); S.over[JOUR[Z].j.file] = { hold: g.p }; const { ctx, page, errs } = await open(browser); const T = JOUR[Z], D = T.d, RULE = T.m.gap_rule.max_join_seconds, N = D.t.length;
    S.log = []; await page.focus(tgl(Z)); await page.keyboard.press('Space'); await settle(page, Z, 'loading'); let s = await state(page);
    ok('2a while it loads the switch reads on and busy, its row says loading, nothing is drawn yet, focus stays on the switch', s.switches[Z].checked === 'true' && s.switches[Z].busy === 'true' && s.switches[Z].state === 'loading' && s.scene === 0 && s.barHidden && s.focus === 'tgl-' + Z && /Plains zebra loading\.$/.test(s.say), s);
    g.go(); delete S.over[JOUR[Z].j.file]; await settle(page, Z, 'ready'); await page.waitForTimeout(300); s = await state(page);
    ok('2b shown: three objects on the globe, the bar is visible, replay is paused at the first recorded fix, the journey is announced once, focus is still on the switch',
      s.scene === 3 && !s.barHidden && s.playing === false && s.i === 0 && s.rt === D.t[0] && s.switches[Z].checked === 'true' && s.switches[Z].busy === null && s.switches[Z].state === 'replay' && s.say === 'Plains zebra shown. Replay is at the first recorded fix.' && s.focus === 'tgl-' + Z && new RegExp('First recorded fix ' + utc(D.t[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(s.bar), s);
    ok('2c only now was the journey\'s display file requested, once', S.log.filter(n => n === T.j.file).length === 1 && !S.log.some(n => n === JOUR[SH].j.file || n === JOUR[W].j.file), S.log);
    const bb = T.j.bbox; ok('2c2 the globe turned to the journey area (no animation), and still does not rotate', Math.abs(s.g.view.lat - (bb.south + bb.north) / 2) < 0.5 && Math.abs(s.g.view.lng - (bb.west + bb.east) / 2) < 0.5 && s.g.autoRotate === false, s.g.view);
    // the marker is on the last recorded fix at or before the replay time; only the past is drawn
    for (const [tag, at] of [['on a fix', D.t[500]], ['between fixes', D.t[500] + Math.floor((D.t[501] - D.t[500]) / 2)], ['one second before the next fix', D.t[501] - 1], ['the last fix', D.t[N - 1]]]) {
      await page.evaluate(x => ME.journey.seek(x), at); s = await state(page); const k = lastAt(D.t, at), xyz = await coordsOf(page, D.lat[k], D.lon[k]);
      ok(`2d ${tag}: the marker is exactly on the last recorded fix at or before the replay time`, s.i === k && s.fixTime === D.t[k] && near(s.objects.marker, xyz) && near(s.objects.fixXYZ, xyz), { i: s.i, k });
      ok(`2e ${tag}: only the past is drawn (fix marks to this fix; line segments joined so far)`, s.objects.fixesShown === k + 1 && s.objects.lineShown === joinsTo(D, RULE, k), [s.objects.fixesShown, k + 1, s.objects.lineShown, joinsTo(D, RULE, k)]); }
    await page.evaluate(x => ME.journey.seek(x), D.t[10] + 3661); s = await state(page); const k10 = lastAt(D.t, D.t[10] + 3661), age = D.t[10] + 3661 - D.t[k10];
    ok('2f the bar gives the replay time, the fix time and its age to the second, in UTC', s.bar.includes(`Replay time (recorded) ${utc(D.t[10] + 3661)}`) && s.bar.includes(`Last recorded fix ${utc(D.t[k10])}`) && /\d+ (min|s|h)/.test(s.bar) && s.objects.fixesShown === k10 + 1, [s.bar, age]);
    ok('2g the bar\'s note speaks of the backdrop, not of other layers; the line rule is stated as Mother Earth\'s', /The backdrop keeps its own date; it is not matched to this journey\./.test(s.note) && !/Other layers/.test(s.note) && /This is a display rule, not part of the study\./.test(s.rule), [s.note, s.rule]);
    // keyboard on the slider
    await page.evaluate(x => ME.journey.seek(x), D.t[100]); await page.focus('#replay-range'); await page.keyboard.press('ArrowRight'); s = await state(page); const a1 = s.i; await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); s = await state(page); const a2 = s.i;
    await page.keyboard.press('End'); s = await state(page); const a3 = s.i; await page.keyboard.press('Home'); s = await state(page);
    ok('2h keyboard on the slider: arrows step from fix to fix, End and Home go to the last and first fix', a1 === 101 && a2 === 99 && a3 === N - 1 && s.i === 0, [a1, a2, a3, s.i]);
    // playback
    await page.evaluate(x => { ME.journey.setSpeed(604800 * 8); ME.journey.seek(x); }, D.t[N - 1] - 86400 * 3); await page.click('#replay-play'); await page.waitForFunction(() => !ME.journey.state().playing, null, { timeout: 30000 }); s = await state(page);
    ok('2i play runs to the last recorded fix, stops there and says the record ends', s.i === N - 1 && s.rt === D.t[N - 1] && s.play === 'Play' && /Last recorded fix: tracking record ends here/.test(s.bar), s.bar);
    ok('2j no page error', errs.length === 0, errs);
    // ===== off (T7)
    await page.click(tgl(Z)); await settle(page, null, 'off'); s = await state(page);
    ok('4a switching the shown journey off: every switch off, nothing on the globe, the bar hidden, announced', checked(s).length === 0 && s.scene === 0 && s.barHidden && s.objects === null && s.say === 'Plains zebra switched off.' && s.switches[Z].state === 'off' && s.focus === 'tgl-' + Z, s);
    await on(page, SH); s = await state(page);
    ok('4b the next journey starts at its own first fix: no replay time is carried over', s.rt === JOUR[SH].d.t[0] && s.i === 0 && s.playing === false, [s.rt, JOUR[SH].d.t[0]]);
    await ctx.close(); }

  // ===== 3. Exclusivity for every ordered pair (T5)
  if (want(3)) { reset(); const { ctx, page, errs } = await open(browser);
    for (const A of IDS) for (const B of IDS) { if (A === B) continue; const s0 = await state(page); if (s0.choice !== A) { await page.click(tgl(A)); await settle(page, A); }
      await page.evaluate(() => { ME.journey.setSpeed(3600); ME.journey.play(); }); await page.focus(tgl(B)); await page.keyboard.press('Enter');
      const mid = await state(page);                                                 // straight after the press, before B has loaded
      await settle(page, B); await page.waitForTimeout(150); const s = await state(page), tag = `${NAME[A]} → ${NAME[B]}`;
      ok(`3a ${tag}: exactly one switch is on (the new one); the old journey's objects are gone and the new one's are there`, checked(s).join() === B && s.scene === 3 && s.n === JOUR[B].d.t.length && s.switches[A].state === 'off' && s.switches[A].checked === 'false', { ck: checked(s), scene: s.scene, n: s.n });
      ok(`3b ${tag}: straight after the press the old switch already reads off and the new one on, the old journey's objects are already gone and its replay has stopped`, mid.switches[A].checked === 'false' && mid.switches[B].checked === 'true' && checked(mid).length === 1 && (mid.status === 'ready' ? mid.n === JOUR[B].d.t.length : mid.scene === 0) && mid.playing === false, { sw: mid.switches, scene: mid.scene, status: mid.status, playing: mid.playing });
      ok(`3c ${tag}: the old replay stopped; the new one is paused at its own start; focus stayed on the pressed switch`, s.playing === false && s.rt === startOf(B) && s.focus === 'tgl-' + B, [s.playing, s.rt, s.focus]);
      ok(`3d ${tag}: announced once as a change and once as shown`, new RegExp(`^${NAME[B]} shown\\.`).test(s.say) && (mid.say === `${NAME[A]} switched off. ${NAME[B]} loading.` || new RegExp(`^${NAME[B]} shown\\.`).test(mid.say)), [mid.say, s.say]); }
    ok('3e no page error', errs.length === 0, errs); await ctx.close(); }

  // ===== 5. Races (T6)
  if (want(5)) { reset(); const { ctx, page, errs, failedReqs } = await open(browser);
    // A loading (held) → B: A's answer arrives late
    let g = gate(); S.over[JOUR[Z].j.file] = { hold: g.p }; await page.click(tgl(Z)); await settle(page, Z, 'loading'); await page.waitForFunction(f => true, null); await page.waitForTimeout(300);
    await page.click(tgl(SH)); await settle(page, SH); const before = await state(page); g.go(); delete S.over[JOUR[Z].j.file]; await page.waitForTimeout(700); let s = await state(page);
    ok('5a a superseded answer draws nothing: the first journey\'s late answer changes nothing (still only the second, three objects)', checked(s).join() === SH && s.scene === 3 && s.n === JOUR[SH].d.t.length && before.scene === 3 && s.choice === SH, { scene: s.scene, n: s.n, choice: s.choice });
    ok('5b the superseded request itself was aborted', failedReqs.some(f => f[0] === JOUR[Z].j.file && /ERR_ABORTED/.test(f[1])), failedReqs);
    await page.click(tgl(SH)); await settle(page, null, 'off');
    // on then off while loading
    g = gate(); S.over[JOUR[W].j.file] = { hold: g.p }; await page.click(tgl(W)); await settle(page, W, 'loading'); await page.waitForTimeout(300); await page.click(tgl(W)); await settle(page, null, 'off'); await page.waitForTimeout(300); const abortedW = failedReqs.some(f => f[0] === JOUR[W].j.file && /ERR_ABORTED/.test(f[1]));
    g.go(); delete S.over[JOUR[W].j.file]; await page.waitForTimeout(700); s = await state(page);
    ok('5c on then off while loading: nothing is drawn when the answer arrives; every switch is off; switching off is not reported as a failure', checked(s).length === 0 && s.scene === 0 && s.barHidden && s.choice === null && Object.keys(s.err).length === 0 && s.switches[W].state === 'off' && s.switches[W].retry === false && s.say === 'False killer whale switched off.', { scene: s.scene, ck: checked(s), err: s.err, say: s.say });
    ok('5g switching off while loading aborts the request itself, before the server answers', abortedW, failedReqs);
    // A → B → A
    await page.click(tgl(Z)); await page.click(tgl(SH)); await page.click(tgl(Z)); await settle(page, Z); await page.waitForTimeout(400); s = await state(page);
    ok('5d A, B, A in quick succession: the last pressed (A) is the one shown, once', checked(s).join() === Z && s.scene === 3 && s.n === JOUR[Z].d.t.length, { ck: checked(s), scene: s.scene, n: s.n });
    await page.click(tgl(Z)); await settle(page, null, 'off');
    // three in a row on a slowed network, checking the switches after each press
    const TRIO = [Z, SH, BIRD], gs = TRIO.map(() => gate()); TRIO.forEach((id, i) => { S.over[JOUR[id].j.file] = { hold: gs[i].p }; }); const after = [];
    for (const id of TRIO) { await page.click(tgl(id)); after.push(checked(await state(page))); }
    gs[0].go(); await page.waitForTimeout(300); gs[1].go(); await page.waitForTimeout(300); const midScene = (await state(page)).scene; gs[2].go(); TRIO.forEach(id => delete S.over[JOUR[id].j.file]); await settle(page, BIRD); await page.waitForTimeout(300); s = await state(page);
    ok('5e three pressed in a row on a slow connection: exactly one switch on after each press; only the last is ever drawn', after.every((c, i) => c.join() === TRIO[i]) && midScene === 0 && checked(s).join() === BIRD && s.scene === 3 && s.n === JOUR[BIRD].d.t.length, { after, midScene, scene: s.scene });
    ok('5f after the races: no replay is running and no page error', s.playing === false && errs.length === 0, errs);
    await ctx.close(); }

  // ===== 6. Failure (T8 with §A7): local to a journey, or global for the shared list
  if (want(6)) { reset(); const { ctx, page, errs } = await open(browser); const UNV = 'Journey file could not be verified. Nothing is drawn.', FAILED = 'The journey file could not be loaded. Nothing is drawn.';
    await on(page, Z); S.over[JOUR[SH].j.file] = { status: 500 }; await page.focus(tgl(SH)); await page.keyboard.press('Space'); await done(page); await page.waitForTimeout(200); let s = await state(page);
    ok('6a a journey that fails to load returns to off; its error and Retry are on its own row; the earlier journey is NOT brought back', checked(s).length === 0 && s.scene === 0 && s.barHidden && s.switches[SH].state === 'not shown' && s.switches[SH].obs === FAILED && s.switches[SH].retry === true && s.switches[Z].retry === false && s.switches[Z].state === 'off' && s.switches[W].retry === false && s.integrity === null, s.switches);
    ok('6b the failure is announced once and focus stays on the pressed switch', s.say === `White shark could not be shown. ${FAILED}` && s.focus === 'tgl-' + SH, [s.say, s.focus]);
    await on(page, W); s = await state(page);
    ok('6c another verified journey can still be shown; the failed one keeps its error and Retry', checked(s).join() === W && s.scene === 3 && s.switches[SH].state === 'not shown' && s.switches[SH].retry === true, s.switches);
    delete S.over[JOUR[SH].j.file]; await page.click(`.an-sw[data-journey="${SH}"] [data-f="sw-retry"]`); await settle(page, SH); s = await state(page);
    ok('6d Retry selects that journey through the same path: the other is switched off, this one is shown, its error is cleared', checked(s).join() === SH && s.scene === 3 && s.n === JOUR[SH].d.t.length && s.switches[SH].retry === false && s.switches[W].state === 'off' && Object.keys(s.err).length === 0, s.switches);
    await page.click(tgl(SH)); await done(page);
    // a display file with one digit changed
    const bad = Buffer.from(real(JOUR[Z].j.file)); bad[bad.length - 40] = bad[bad.length - 40] === 0x31 ? 0x32 : 0x31; S.over[JOUR[Z].j.file] = { body: bad }; await page.click(tgl(Z)); await done(page); s = await state(page);
    ok('6e a display file with one digit changed: not verified, nothing drawn, said on that row only', s.scene === 0 && checked(s).length === 0 && s.switches[Z].obs === UNV && s.switches[Z].state === 'not shown' && s.integrity === null && /display file does not match/.test(s.err[Z].detail), s.err);
    delete S.over[JOUR[Z].j.file];
    // a manifest that differs from the list's checksum
    const mb = Buffer.from(JSON.stringify({ ...JOUR[SH].m, title: 'changed' })); S.over[JOUR[SH].e.manifest] = { body: mb }; S.log = []; await page.click(tgl(SH)); await done(page); s = await state(page);
    ok('6f a manifest that differs from the journey list: not verified, nothing drawn, its display file is never requested, said on that row only', s.scene === 0 && s.switches[SH].obs === UNV && !S.log.includes(JOUR[SH].j.file) && s.integrity === null && /manifest does not match/.test(s.err[SH].detail), [s.err, S.log]);
    delete S.over[JOUR[SH].e.manifest]; await ctx.close();
    // a file whose checksums all match but whose fix times are out of order (fixture with its own pinned list)
    reset(); S.fx = fixture(Z, d => { const x = d.t[5]; d.t[5] = d.t[6]; d.t[6] = x; }); { const o = await open(browser); await o.page.click(tgl(Z)); await done(o.page); const s2 = await state(o.page);
      ok('6g a file with matching checksums whose fix times are out of order: refused, nothing drawn', s2.scene === 0 && s2.switches[Z].obs === UNV && /whole seconds in increasing order/.test(s2.err[Z].detail), s2.err); await o.ctx.close(); }
    // the shared journey list
    reset(); { const o = await open(browser); await on(o.page, Z); const badCat = Buffer.from(CAT.toString().replace('"schema": 1', '"schema": 1 ')); S.cat = badCat; S.log = []; await o.page.click(tgl(W)); await done(o.page); await o.page.waitForTimeout(200); let s3 = await state(o.page);
      ok('6h a journey list that does not verify is ONE error for the whole group: no row carries it, every switch is off, nothing is drawn, no manifest or display file is requested after it', s3.integrity === 'The list of journeys could not be verified. No journey can be shown until it verifies.' && IDS.every(id => s3.switches[id].state === 'off' && s3.switches[id].retry === false) && checked(s3).length === 0 && s3.scene === 0 && Object.keys(s3.err).length === 0 && S.log.every(n => /catalog/.test(n)), [s3.integrity, s3.switches, S.log]);
      const cards = await o.page.evaluate(() => [...document.querySelectorAll('.an-study')].map(c => !c.querySelector('[data-f="facts"]').hidden && c.querySelector('[data-f="title"]').textContent.length > 5));
      ok('6i the study cards stay readable under the list error', cards.length === IDS.length && cards.every(Boolean), cards);
      await o.page.click(tgl(SH)); await done(o.page); s3 = await state(o.page);
      ok('6j while the list does not verify, no journey can be switched on (the check is not bypassed)', s3.scene === 0 && checked(s3).length === 0 && s3.integrity !== null, s3.integrity);
      await o.page.click('#an-integrity-retry'); await o.page.waitForTimeout(500); s3 = await state(o.page); const still = s3.integrity !== null;
      S.cat = null; await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => document.getElementById('an-integrity').hidden, null, { timeout: 15000 }); s3 = await state(o.page);
      ok('6k the group\'s Retry checks the list alone: still failing while it is bad; cleared once a valid list is served; it switches nothing on', still && s3.integrity === null && checked(s3).length === 0 && s3.scene === 0, [still, s3.integrity]);
      await on(o.page, SH); s3 = await state(o.page); ok('6l after the list verifies, a journey can be shown', checked(s3).join() === SH && s3.scene === 3, s3.switches);
      ok('6m no page error in the failure paths', o.errs.length === 0 && errs.length === 0, [o.errs, errs]); await o.ctx.close(); } }

  // ===== 7. Keyboard, focus and announcements (T9, T10)
  if (want(7)) { reset(); const { ctx, page } = await open(browser);
    await page.focus('#an-panel'); await page.evaluate(() => document.querySelector('.an-preview').closest('p').querySelector('a').focus()); const order = [];
    for (let i = 0; i < 60 && order.filter(x => /^tgl-/.test(x)).length < IDS.length; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.id || document.activeElement.tagName)); }
    ok('7a Tab reaches each switch, in the order shown', order.filter(x => /^tgl-/.test(x)).join() === IDS.map(id => 'tgl-' + id).join(), order);
    await page.focus(tgl(Z)); await page.keyboard.press('Space'); await settle(page, Z); let s = await state(page); const a = s.focus === 'tgl-' + Z && checked(s).join() === Z;
    await page.focus(tgl(SH)); await page.keyboard.press('Enter'); await settle(page, SH); s = await state(page); const b = s.focus === 'tgl-' + SH && checked(s).join() === SH;
    await page.keyboard.press('Space'); await settle(page, null, 'off'); s = await state(page);
    ok('7b Space and Enter operate a switch; focus stays on it through loading, and when it switched another off; Space switches it off again', a && b && s.focus === 'tgl-' + SH && checked(s).length === 0, [a, b, s.focus]);
    const arrows = await page.evaluate(async () => { const el = document.activeElement.id; document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); return [el, document.activeElement.id, ME.journey.state().choice]; });
    ok('7c arrow keys do not move between switches or change them (no radio behaviour)', arrows[0] === arrows[1] && arrows[2] === null, arrows);
    const live = await page.evaluate(() => ({ say: document.getElementById('an-say').getAttribute('aria-live'), obsLive: [...document.querySelectorAll('.an-sw [data-f="sw-obs"]')].map(e => e.getAttribute('aria-live')), integ: document.getElementById('an-integrity').getAttribute('role') }));
    ok('7d one polite live region carries the announcements; the rows themselves are not live (no duplicate speech)', live.say === 'polite' && live.obsLive.every(x => x === null) && live.integ === null, live);
    await on(page, Z); const said = (await state(page)).say; await page.evaluate(() => { ME.journey.setSpeed(3600); ME.journey.play(); }); await page.waitForTimeout(700); s = await state(page);
    ok('7e playback does not announce on every frame: the announcement is unchanged while the replay runs', s.playing === true && s.say === said && s.rt > JOUR[Z].d.t[0], [s.say, s.rt]);
    const names = await page.evaluate(() => [...document.querySelectorAll('button.an-tgl')].map(b => b.textContent.trim())); await page.click(tgl(Z)); await settle(page, null, 'off'); const names2 = await page.evaluate(() => [...document.querySelectorAll('button.an-tgl')].map(b => b.textContent.trim()));
    ok('7f a switch\'s label never changes with its state', names.join('|') === names2.join('|') && names.length === IDS.length, [names, names2]);
    await ctx.close(); }

  // ===== 8. Links to one journey (T11)
  if (want(8)) { reset(); S.log = []; const { ctx, page } = await open(browser, undefined, '#journey=' + SH); await page.waitForTimeout(500); let s = await state(page);
    ok('8a animals.html#journey=<id> focuses that journey\'s switch and switches nothing on; no display file is requested', s.focus === 'tgl-' + SH && checked(s).length === 0 && s.scene === 0 && s.choice === null && !S.log.some(n => IDS.some(id => n === JOUR[id].j.file)), [s.focus, checked(s), S.log]);
    await page.click(`#${W} a.an-go`); await page.waitForTimeout(400); s = await state(page);
    ok('8b a study card\'s link moves focus to that journey\'s switch and switches nothing on', s.focus === 'tgl-' + W && checked(s).length === 0 && s.scene === 0, [s.focus, checked(s)]);
    const inView = await page.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }, 'tgl-' + W); ok('8c the switch is brought into view', inView);
    await ctx.close(); const o = await open(browser, undefined, '#journey=no-such-animal'); s = await state(o.page);
    ok('8d an unknown id does nothing', !/^tgl-/.test(s.focus || '') && checked(s).length === 0 && s.scene === 0, s.focus);
    const links = await o.page.evaluate(() => [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(h => /index\.html#journey/.test(h || ''))); ok('8e no link points at the retired index.html#journey address', links.length === 0, links);
    await o.ctx.close(); }

  // ===== 9. Leaving, returning, hidden tab, resize (T14)
  if (want(9)) { reset(); const { ctx, page } = await open(browser); await on(page, Z); await page.evaluate(() => { ME.journey.setSpeed(3600); ME.journey.play(); });
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); await page.waitForTimeout(200); let s = await state(page);
    ok('9a leaving the page (pagehide): the journey is switched off, nothing is drawn, no replay runs', s.choice === null && s.scene === 0 && s.playing === false && checked(s).length === 0, s.switches);
    await on(page, SH); await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await page.waitForTimeout(200); s = await state(page);
    ok('9b a page restored from the browser\'s kept copy (pageshow, persisted) comes back with nothing on', s.choice === null && s.scene === 0 && checked(s).length === 0, s.switches);
    await on(page, Z); await page.evaluate(() => { ME.journey.setSpeed(3600); ME.journey.play(); }); await page.waitForTimeout(200);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }); await page.waitForTimeout(200); s = await state(page);
    ok('9c a hidden tab pauses playback and keeps the journey', s.playing === false && s.choice === Z && s.scene === 3, [s.playing, s.choice]);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.setViewportSize({ width: 800, height: 700 }); await page.waitForTimeout(600); const r1 = await page.evaluate(() => { const b = document.getElementById('an-globe').getBoundingClientRect(), g = ME.animalsGlobe.state().size; return [Math.round(b.width), Math.round(b.height), g[0], g[1]]; });
    await page.setViewportSize({ width: 700, height: 1000 }); await page.waitForTimeout(600); const r2 = await page.evaluate(() => { const b = document.getElementById('an-globe').getBoundingClientRect(), g = ME.animalsGlobe.state().size; return [Math.round(b.width), Math.round(b.height), g[0], g[1]]; }); s = await state(page);
    ok('9d resize and a turn to portrait: the globe follows its box, the journey stays shown, the controls still work', Math.abs(r1[0] - r1[2]) <= 1 && Math.abs(r1[1] - r1[3]) <= 1 && Math.abs(r2[0] - r2[2]) <= 1 && Math.abs(r2[1] - r2[3]) <= 1 && s.scene === 3 && s.choice === Z, [r1, r2]);
    await page.click('#replay-play'); await page.waitForTimeout(300); s = await state(page); ok('9e after the resize Play still starts the replay', s.playing === true, s.playing);
    await ctx.close(); }

  // ===== 10. The backdrop and its fallback (T15 with §A7)
  if (want(10)) { for (const mode of ['fail', 'xml']) { reset(); const { ctx, page, errs } = await open(browser, undefined, '', { img: mode }); let s = await state(page);
      ok(`10a imagery ${mode === 'fail' ? 'request fails' : 'answers with something that is not a picture'}: a plain globe with the coastline outline; the coastline file is requested now`, s.g.globe === 'ok' && s.g.backdrop === 'plain' && s.g.coast === 'ready' && s.g.coastInScene && s.g.coastSegs > 1000 && S.log.includes('coast-50m.bin'), s.g);
      ok(`10b ${mode}: the line says the satellite backdrop is unavailable and never names a picture date`, /^Satellite backdrop unavailable\./.test(s.g.note) && !/satellite imagery for/.test(s.g.note) && !/\d{2} [A-Z][a-z]{2} \d{4}/.test(s.g.note), s.g.note);
      await on(page, Z); s = await state(page); ok(`10c ${mode}: journeys stay usable on the plain globe`, s.scene === 3 && checked(s).join() === Z && errs.length === 0, [s.scene, errs]); await ctx.close(); }
    reset(); const o = await open(browser, undefined, '', { img: 'hang', noWait: true }); await o.page.waitForTimeout(600); let s = await state(o.page);
    ok('10d while the picture is still on its way the line says loading, and a journey can already be shown', s.g.backdrop === 'loading' && /^Backdrop: loading/.test(s.g.note), s.g.note); await on(o.page, SH); s = await state(o.page); ok('10e journey shown while the backdrop is still loading', s.scene === 3 && checked(s).join() === SH, s.scene);
    await o.ctx.close();
    reset(); const c = await open(browser, undefined, '', { img: 'fail', pre: ctx => ctx.route('**/assets/coast-50m.bin*', r => r.abort()) }); await c.page.waitForFunction(() => ME.animalsGlobe.state().coast === 'failed', null, { timeout: 15000 }); s = await state(c.page);
    ok('10f picture and coastline both unavailable: a plain globe, said so, journeys still offered', s.g.backdrop === 'plain' && /coastline outline could not be loaded either/.test(s.g.note) && s.switches[Z].disabled === null, s.g.note); await c.ctx.close(); }

  // ===== 11. No usable globe (T17 with §A7)
  if (want(11)) { reset(); const noGL = ctx => ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
    const o = await open(browser, undefined, '', { pre: noGL }); let s = await state(o.page);
    const box = await o.page.evaluate(() => document.getElementById('an-globe').textContent);
    ok('11a no WebGL: the globe box says so in plain words; every switch is marked unavailable and its row says why; nothing is on', s.g.globe === 'failed' && /The globe needs 3-D graphics/.test(box) && /study details, sources and licences below remain available/.test(box) && IDS.every(id => s.switches[id].disabled === 'true' && /needs the 3-D globe/.test(s.switches[id].obs)) && checked(s).length === 0 && s.g.noteHidden === true, [box, s.switches]);
    S.log = []; await o.page.click(tgl(Z), { force: true }); await o.page.waitForTimeout(400); s = await state(o.page);
    ok('11b pressing an unavailable switch switches nothing on, requests nothing and says why', checked(s).length === 0 && s.choice === null && S.log.length === 0 && /Plains zebra cannot be shown\. The journey needs the 3-D globe/.test(s.say) && s.focus === 'tgl-' + Z, [s.say, S.log]);
    const cards = await o.page.evaluate(() => [...document.querySelectorAll('.an-study')].map(c => [c.querySelector('[data-f="state"]').textContent, !c.querySelector('[data-f="facts"]').hidden, c.querySelector('[data-f="lic"]').textContent.length > 3]));
    ok('11c the study cards, sources and licences are still shown', cards.length === IDS.length && cards.every(c => /verified/.test(c[0]) && c[1] && c[2]), cards); ok('11d no page error without WebGL', o.errs.length === 0, o.errs); await o.ctx.close();
    reset(); const l = await open(browser, undefined, '', { lib: false }); s = await state(l.page); const box2 = await l.page.evaluate(() => document.getElementById('an-globe').textContent);
    ok('11e the globe library failed to load: the same plain message with a Diagnostics note; switches unavailable; cards readable', s.g.globe === 'failed' && /could not start in this browser/.test(box2) && /Diagnostics/.test(box2) && IDS.every(id => s.switches[id].disabled === 'true') && checked(s).length === 0, [box2, s.g]); await l.ctx.close();
    reset(); const k = await open(browser); await on(k.page, Z); await k.page.evaluate(() => { ME.journey.setSpeed(3600); ME.journey.play(); });
    const lost = await k.page.evaluate(() => { const cv = document.querySelector('#an-globe canvas'), gl = cv.getContext('webgl2') || cv.getContext('webgl'), ext = gl && gl.getExtension('WEBGL_lose_context'); if (ext) { ext.loseContext(); return 'ext'; } cv.dispatchEvent(new Event('webglcontextlost', { cancelable: true })); return 'event'; });
    await k.page.waitForFunction(() => ME.animalsGlobe.state().globe === 'lost', null, { timeout: 15000 }); await k.page.waitForTimeout(300); s = await state(k.page);
    ok(`11f graphics context lost after load (${lost}): the journey is switched off, the replay stops, the switches say the globe stopped, the line under the globe says so`, s.choice === null && s.playing === false && checked(s).length === 0 && IDS.every(id => s.switches[id].disabled === 'true' && /lost its graphics context/.test(s.switches[id].obs)) && /lost its graphics context/.test(s.g.note) && /Plains zebra switched off\./.test(s.say), [s.say, s.g.note, s.switches]);
    await k.ctx.close(); }

  // ===== 12. The old journeys' observable behaviour (T18): line rule, Argos classes and join flags, time zone
  if (want(12)) { reset(); const t0 = 1193299200, times = [0, 3600, 3600 + 10800, 3600 + 10800 + 10801, 3600 + 10800 + 10801 + 3600].map(x => t0 + x);
    S.fx = fixture(Z, (d, m, jr) => { d.n = times.length; d.t = times; d.lat = times.map((_, i) => -20 + i * 0.01); d.lon = times.map((_, i) => 24 + i * 0.01); d.id = 'fx'; jr.fixes = times.length; jr.first_fix_s = times[0]; jr.last_fix_s = times[times.length - 1]; jr.bbox = { south: -21, north: -19, west: 23, east: 25 }; });
    { const o = await open(browser); await on(o.page, Z); await o.page.evaluate(x => ME.journey.seek(x), times[times.length - 1]); let s = await state(o.page);
      ok('12a line rule (fixture): fixes exactly 3 h apart are joined; 3 h 1 s apart are not', s.objects.segments === 3 && s.objects.lineShown === 3 && s.n === 5, s.objects);
      await o.page.evaluate(x => ME.journey.seek(x), times[2] + 60); s = await state(o.page); ok('12b the gap is said on the bar: no fix was recorded for 3 h 0 min 1 s after it', /No fix was recorded for 3 h 0 min 1 s after it/.test(s.bar), s.bar); await o.ctx.close(); }
    reset(); const o = await open(browser);
    for (const id of [SH, W]) { const T = JOUR[id], D = T.d, RULE = T.m.gap_rule.max_join_seconds; await on(o.page, id); await o.page.evaluate(x => ME.journey.seek(x), D.t[D.t.length - 1]); let s = await state(o.page);
      const flagged = D.j.reduce((a, b) => a + b, 0), byTime = D.t.filter((t, i) => i && t - D.t[i - 1] <= RULE).length;
      ok(`12c ${NAME[id]}: the line has exactly the steps the build allowed (join flags)${id === SH ? ', fewer than time alone would join' : ''}`, s.objects.segments === flagged && flagged === T.j.steps_joined && (id === SH ? flagged < byTime : flagged <= byTime), [s.objects.segments, flagged, byTime]);
      ok(`12d ${NAME[id]}: the bar gives the Argos class of the fix and speaks of displayed fixes`, /Argos class [0-3AB] \(/.test(s.bar) && /Last displayed fix: displayed record ends here/.test(s.bar) && !/recorded fix/i.test(s.bar.replace('Replay time (recorded)', '')), s.bar);
      const k = Math.floor(D.t.length / 2), xyz = await coordsOf(o.page, D.lat[k], D.lon[k]); await o.page.evaluate(x => ME.journey.seek(x), D.t[k]); s = await state(o.page);
      ok(`12e ${NAME[id]}: the marker is on the displayed fix; its class is the file's`, near(s.objects.marker, xyz) && s.cls === D.lc[k] && s.objects.fixesShown === k + 1 && s.objects.lineShown === joinsTo(D, RULE, k), [s.cls, D.lc[k]]);
      ok(`12f ${NAME[id]}: the row carries the manifest's own sentences`, s.switches[id].obs.includes(T.m.card.shown) && s.switches[id].obs.includes(T.m.card.not_route), s.switches[id].obs.slice(0, 200));
      const n = D.t.length, clsWords = c => T.m.class_meanings[c] === 'no estimate' ? 'no error estimate' : 'nominal error ' + T.m.class_meanings[c];
      const words = [], sample = [...Array(n).keys()].filter(q => q % 9 === 0 || q === n - 1 || (q < n - 1 && D.t[q + 1] - D.t[q] > RULE)).slice(0, 220);
      for (const i of sample) { await o.page.evaluate(x => ME.journey.seek(x), D.t[i] + (i < n - 1 ? 1 : 0)); const bt = (await state(o.page)).bar; if (/was recorded|tracking record|recorded fix\b/i.test(bt.replace('Replay time (recorded)', ''))) words.push([i, bt]); }
      ok(`12h ${NAME[id]}: at ${sample.length} sampled fixes, every ninth and every gap, the bar never says a fix "was recorded", "recorded fix" or "tracking record" (it says displayed)`, words.length === 0 && sample.length > 20, words.slice(0, 2));
      const refused = []; for (let q = 1; q < n; q++) if (D.t[q] - D.t[q - 1] <= RULE && D.j[q] === 0) refused.push(q);
      const picks = [1, 2, Math.floor(n / 3), Math.floor(n / 2), n - 2, n - 1].concat(refused.slice(0, 2)), bad = [];
      for (const i of picks) { await o.page.evaluate(x => ME.journey.seek(x), D.t[i]); const q = await state(o.page);
        if (q.i !== i || q.objects.fixesShown !== i + 1 || q.objects.lineShown !== joinsTo(D, RULE, i) || q.cls !== D.lc[i] || !q.bar.includes(`Argos class ${D.lc[i]} (${clsWords(D.lc[i])})`) || !near(q.objects.marker, q.objects.fixXYZ)) bad.push([i, q.i, q.objects.lineShown, joinsTo(D, RULE, i), q.cls]); }
      ok(`12i ${NAME[id]}: at ${picks.length} replay times the marker is on the right fix, the class shown is that fix's, and exactly the build's joined steps up to then are drawn`, bad.length === 0, bad);
      ok(`12j ${NAME[id]}: steps within the time limit that the build refused for land: ${refused.length}, as the manifest says`, refused.length === T.j.steps_refused_for_land, [refused.length, T.j.steps_refused_for_land]);
      await o.page.evaluate(x => ME.journey.seek(x), D.t[n - 1]); const endBar = (await state(o.page)).bar;
      ok(`12k ${NAME[id]}: at the last displayed fix the bar says the DISPLAYED record ends here`, endBar === `Replay time (recorded) ${utc(D.t[n - 1])} · Last displayed fix: displayed record ends here, ${utc(D.t[n - 1])} · Argos class ${D.lc[n - 1]} (${clsWords(D.lc[n - 1])})`, endBar);
      if (id === SH) { await o.page.evaluate(x => ME.journey.seek(x), D.t[24]); const g24 = (await state(o.page)).bar;
        ok("12l GPT's earlier case, shark index 24: the bar says no fix is DISPLAYED for 18 h 43 min 44 s", utc(D.t[24]) === '17 May 2012 08:09:01 UTC' && utc(D.t[25]) === '18 May 2012 02:52:45 UTC' && g24 === `Replay time (recorded) 17 May 2012 08:09:01 UTC · Last displayed fix 17 May 2012 08:09:01 UTC, at this time · Argos class ${D.lc[24]} (${clsWords(D.lc[24])}) · No fix is displayed for 18 h 43 min 44 s after it`, g24); }
      if (id === W) ok("12m GPT's earlier case, whale end: the displayed record ends 12 Feb 2014 14:51:34 UTC and the bar does not call it the end of the tracking record", /Last displayed fix: displayed record ends here, 12 Feb 2014 14:51:34 UTC/.test(endBar) && !/tracking record/.test(endBar), endBar); }
    await o.ctx.close();
    for (const tz of ['Pacific/Auckland', 'America/Los_Angeles']) { reset(); const z = await open(browser, undefined, '', { extra: { timezoneId: tz, locale: 'en-US' } }); await on(z.page, Z); const s = await state(z.page);
      ok(`12g visitor in ${tz}: times are printed in UTC from the source's seconds`, s.bar.includes(utc(JOUR[Z].d.t[0])), s.bar); await z.ctx.close(); } }

  // ===== 13. Earth now is clean (T13 with §A7): baseline = the exact main commit merged into this branch
  if (want(13)) { reset(); const git = a => cp.execFileSync('git', a, { cwd: ROOT, maxBuffer: 64e6, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const BASE_DIR = process.env.BASE_DIR || ''; let how = '';
    if (BASE_DIR && fs.existsSync(path.join(BASE_DIR, 'index.html'))) how = 'dir'; else { try { git(['cat-file', '-e', BASE_MAIN + '^{commit}']); how = 'git'; } catch (_) { } }
    const mainFile = f => how === 'dir' ? fs.readFileSync(path.join(BASE_DIR, f), 'utf8') : git(['show', BASE_MAIN + ':' + f]);
    if (!how) { fail++; failed.push('13a'); console.log(`NOT RUN  13a–13e: main ${BASE_MAIN.slice(0, 7)} is not available (no Git metadata here and no BASE_DIR). The comparisons with main were not made.`); }
    else { ok(`13a the baseline is main ${BASE_MAIN.slice(0, 7)} (read from ${how === 'dir' ? 'BASE_DIR' : 'Git'})`, true);
      const mainIdx = mainFile('index.html'), idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
      const strip = t => t.replace('    <a href="animals.html" data-view="animals">Animals</a>\n', '').replace('      <li role="none"><a role="menuitem" href="animals.html" data-page="animals">Animals</a></li>\n', '').replace(/style\.css\?v=\d+/, 'style.css?v=X');
      ok('13b index.html equals main\'s except the Animals tab link, the Animals menu link and the stylesheet version', strip(idx) === mainIdx.replace(/style\.css\?v=\d+/, 'style.css?v=X') && idx !== mainIdx);
      const same = ['layers.js', 'app.js', 'aircraft.js', 'wind.js', 'nightlights.js', 'dustrgb.js', 'oceanheat.js', 'sky.js', 'skyscene.js', 'arts.js', 'craft.js', 'moonglobe.js', 'moonlight.js', 'sunglobe.js', 'timeline.js', 'phase1/worker.js', 'phase1/collector-mac.mjs', 'phase1/bare-earth-ui.test.cjs'];
      const diff = same.filter(f => { try { return mainFile(f) !== fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return true; } });
      ok('13c Earth now\'s scripts, the Layers panel, the hub, the collector and the Bare Earth suite are byte-identical to main', diff.length === 0, diff);
      const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8'), mainCss = mainFile('style.css').split('\n'), cur = new Set(css.split('\n'));
      const gone = mainCss.filter(l => !cur.has(l)); ok('13d the shared stylesheet is NOT identical to main: every main line is kept except the header rules changed for five tabs (at most 4 lines, listed on failure); the Animals rules are added', gone.length <= 4 && gone.every(l => /\.top \.promise|\.tabs a|\.top\{padding/.test(l)) && css.length > mainCss.join('\n').length, gone);
      for (const pg of ['moon.html', 'sun.html', 'timeline.html', 'sources.html']) { const a = mainFile(pg), b = fs.readFileSync(path.join(ROOT, pg), 'utf8'); ok(`13e ${pg} equals main's except the Animals links and the stylesheet version`, strip(b) === a.replace(/style\.css\?v=\d+/, 'style.css?v=X')); } }
    const ctx = await ctxFor(browser, { width: 1280, height: 860 }); await ctx.route('**/' + HUB + '/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ layer: 'x', retrieved_at: new Date().toISOString(), stale_after_s: 10800, source_status: 'ok', cells: {}, record_format: 'rows', record_fields: [], records: [] }) }));
    const page = await ctx.newPage(), reqs = []; page.on('request', r => reqs.push(r.url())); await page.goto(BASE + '/index.html#journey=' + Z, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.ME && ME.layers, null, { timeout: 30000 }); await page.waitForTimeout(1500);
    const e = await page.evaluate(() => ({ ids: ['tgl-journey', 'journey-choose', 'card-journey', 'replay', 'leg-journey', 'an-globe'].filter(i => document.getElementById(i)), journey: typeof ME.journey, rows: ME.layers.rows.length, rowTxt: ME.layers.rows.map(r => r[0]).filter(t => /animal|journey/i.test(t)), scripts: [...document.scripts].map(x => x.getAttribute('src') || '').filter(x => /animals/.test(x)),
      txt: /Animal journey/.test(document.body.textContent), panel: document.getElementById('layers-panel').hidden }));
    ok('13f Earth now carries no journey card, switch, chooser, replay bar, Key entry or Layers row, loads no Animals script, and the old link opens nothing', e.ids.length === 0 && e.journey === 'undefined' && e.rows === 16 && e.rowTxt.length === 0 && e.scripts.length === 0 && !e.txt && e.panel === true && !reqs.some(u => /assets\/animals\//.test(u)), e);
    await ctx.close(); }

  // ===== 14. Layout (T16 with §A7): the stated target is NO overlap of the globe at any width (bar and switches are in the page flow)
  if (want(14)) for (const [w, h] of [[360, 740], [390, 844], [720, 900], [900, 760], [1100, 800], [1280, 860], [1470, 745]]) { reset(); const { ctx, page } = await open(browser, { width: w, height: h }); await on(page, SH);
    const m = await page.evaluate(() => { const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top + scrollY, r: r.right, b: r.bottom + scrollY, w: r.width, h: r.height }; }, hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      const g = R(document.getElementById('an-globe-box')), bar = R(document.getElementById('replay')), panel = R(document.getElementById('an-panel')), sw = [...document.querySelectorAll('button.an-tgl')].map(R), ctl = [...document.querySelectorAll('#replay button,#replay select,#replay input')].map(R);
      return { over: document.documentElement.scrollWidth - document.documentElement.clientWidth, g, barHit: hit(g, bar), panelHit: hit(g, panel), swMin: Math.min(...sw.map(x => x.h)), ctlMin: Math.min(...ctl.map(x => x.h)), order: g.t < bar.t && (innerWidth <= 900 ? bar.b <= panel.t + 1 : true), side: panel.l >= g.r - 1 }; });
    ok(`14a ${w} px: nothing overflows sideways`, m.over <= 0, m.over);
    ok(`14b ${w} px: the replay bar and the switch panel cover none of the globe (target: no overlap)`, !m.barHit && !m.panelHit && m.g.w >= 300 && m.g.h >= 240, m);
    ok(`14c ${w} px: ${w <= 900 ? 'globe, then the bar, then the switches' : 'the switches sit beside the globe, the bar under it'}; every switch and bar control is at least 44 px high`, m.order && (w <= 900 || m.side) && m.swMin >= 44 && m.ctlMin >= 44, m);
    let reach = true; for (const id of IDS) { await page.locator(tgl(id)).scrollIntoViewIfNeeded(); const top = await page.evaluate(i => { const b = document.getElementById(i), r = b.getBoundingClientRect(), e = document.elementFromPoint(r.left + 20, r.top + r.height / 2); return !!e && (e === b || b.contains(e)); }, 'tgl-' + id); reach = reach && top; }
    ok(`14d ${w} px: the page scrolls to every switch and each can be pressed (nothing lies over it)`, reach);
    await page.click(tgl(Z)); await settle(page, Z); const s = await state(page); ok(`14e ${w} px: a switch pressed at this width works`, checked(s).join() === Z && s.scene === 3, checked(s));
    await ctx.close(); }

  // ===== 15. The study cards
  if (want(15)) { reset(); const { ctx, page } = await open(browser);
    const c = await page.evaluate(() => [...document.querySelectorAll('.an-study')].map(s => ({ id: s.dataset.journey, state: s.querySelector('[data-f="state"]').textContent, title: s.querySelector('[data-f="title"]').textContent, lic: s.querySelector('[data-f="lic"]').textContent, cons: s.querySelector('[data-f="cons"]').textContent, pop: s.querySelector('[data-f="pop"]').textContent, sample: s.querySelector('[data-f="sample"]').textContent, go: s.querySelector('a.an-go').getAttribute('href') })));
    ok('15a each card is filled from its verified manifest, links to its own switch, and keeps the fixed "Not available yet" states and the sample-size sentence', c.length === IDS.length && c.every(x => x.title === JOUR[x.id].m.title && /verified/.test(x.state) && x.lic.includes(JOUR[x.id].m.licence) && /^Not available yet\./.test(x.cons) && /^Not available yet\./.test(x.pop) && /not a population estimate/.test(x.sample) && x.go === '#journey=' + x.id), c);
    const txt = await page.evaluate(() => document.querySelector('main').textContent);
    ok('15b the page says the globe shows no current observations and that the backdrop is not from a journey\'s dates; it does not send the reader to Earth now for the replay', /shows no current observations/.test(txt) && /not from a journey's dates/.test(txt) && !/Choose this journey on Earth now/.test(txt) && /Private preview/.test(txt), null);
    const air = await page.evaluate(() => [...document.querySelectorAll('.an-doc h3')].map(h => h.textContent)); ok('15c the cards are grouped Land, Sea, Air', air.join() === 'Land,Sea,Air', air);
    await ctx.close(); reset(); S.over[JOUR[W].e.manifest] = { body: Buffer.from('{"x":1}') }; const o = await open(browser);
    const bad = await o.page.evaluate(id => { const s = document.getElementById(id); return [s.querySelector('[data-f="state"]').textContent, s.querySelector('[data-f="facts"]').hidden]; }, W);
    ok('15d a card whose manifest does not verify says so and shows no figure', /could not be verified/.test(bad[0]) && bad[1] === true, bad); await o.ctx.close(); }

  // ===== 16. Phone: a press that switches a journey on brings the globe into view (GPT's Stage 1 review, finding 2)
  if (want(16)) { const FAILED = 'The journey file could not be loaded. Nothing is drawn.';
    const toSwitch = async (page, id) => { await page.evaluate(i => document.getElementById('tgl-' + i).scrollIntoView({ block: 'center' }), id); await page.waitForTimeout(80); };
    const seen = s => s.box.top >= 0 && s.box.top <= 12 && s.box.bottom <= s.vh;
    // where a thing sits on the screen: the browser keeps what is on screen in place when content above it changes height, so 'the page did not move' is checked on an element in view, not on the scroll offset
    const topOf = (page, sel) => page.evaluate(q => Math.round(document.querySelector(q).getBoundingClientRect().top), sel);
    for (const [w, h] of [[390, 740], [360, 560], [390, 844]]) { reset(); const { ctx, page, errs } = await open(browser, { width: w, height: h }); const tag = `${w}×${h}`; let s = await state(page);
      ok(`16a ${tag}: nothing scrolls at page load`, s.y === 0 && s.scroll === null, [s.y, s.scroll]);
      const g = gate(); S.over[JOUR[SH].j.file] = { hold: g.p }; await toSwitch(page, SH); const y0 = (await state(page)).y; await page.focus(tgl(SH)); await page.keyboard.press('Space'); await settle(page, SH, 'loading'); await page.waitForTimeout(150); s = await state(page);
      ok(`16b ${tag}: at the press itself, before the journey has loaded, the globe is brought to the top of the screen, whole; one scroll, without animation under reduced motion; the loading line is beside the globe and in view; focus stays on the switch`,
        y0 > 100 && seen(s) && s.scroll && s.scroll.n === 1 && s.scroll.behavior === 'auto' && s.beside && s.beside.text === 'White shark loading…' && s.beside.inView && s.focus === 'tgl-' + SH, { y0, y: s.y, box: s.box, scroll: s.scroll, beside: s.beside, focus: s.focus });
      const CARD = '#' + W; await page.evaluate(q => document.querySelector(q).scrollIntoView({ block: 'start' }), CARD); await page.waitForTimeout(100); const yDown = (await state(page)).y, c0 = await topOf(page, CARD); g.go(); delete S.over[JOUR[SH].j.file]; await settle(page, SH); await page.waitForTimeout(400); s = await state(page); const c1 = await topOf(page, CARD);
      ok(`16c ${tag}: the visitor scrolled away while it loaded; the late answer does NOT pull the page back`, yDown > 200 && Math.abs(c1 - c0) <= 2 && s.box.bottom < 0 && s.scroll.n === 1 && s.scene === 3, { yDown, c0, c1, box: s.box, n: s.scroll.n });
      await page.evaluate(() => { ME.journey.setSpeed(3600); ME.journey.play(); }); await page.waitForTimeout(600); s = await state(page); const c2 = await topOf(page, CARD);
      ok(`16d ${tag}: playback never scrolls the page`, s.playing === true && Math.abs(c2 - c1) <= 2 && s.scroll.n === 1, [c1, c2]);
      await toSwitch(page, SH); const t1 = await topOf(page, tgl(SH)); await page.focus(tgl(SH)); await page.keyboard.press('Space'); await settle(page, null, 'off'); await page.waitForTimeout(150); s = await state(page); const t2 = await topOf(page, tgl(SH));
      ok(`16e ${tag}: switching off does not take the page to the globe: the switch stays where it was on screen`, Math.abs(t2 - t1) <= 2 && s.box.bottom < 0 && s.scroll.n === 1 && checked(s).length === 0, [t1, t2, s.scroll]);
      // a journey that loads at once: the globe and the top of the replay bar are on screen
      await toSwitch(page, Z); await page.click(tgl(Z)); await settle(page, Z); await page.waitForTimeout(200); s = await state(page);
      ok(`16f ${tag}: once shown, the whole globe and the start of the replay bar are on screen`, seen(s) && s.barTop !== null && s.barTop < s.vh && s.scroll.n === 2 && s.beside === null, { box: s.box, barTop: s.barTop, vh: s.vh });
      const link = await page.evaluate(() => { const a = document.querySelector('.an-toswitches a'), r = a.getBoundingClientRect(); return { shown: getComputedStyle(a.parentElement).display !== 'none', h: r.height, inView: r.top >= 0 && r.bottom <= innerHeight, href: a.getAttribute('href') }; });
      await page.click('.an-toswitches a'); await page.waitForTimeout(200); const back = await page.evaluate(() => { const r = document.getElementById('an-panel').getBoundingClientRect(); return r.top >= -1 && r.top < innerHeight; }); s = await state(page);
      ok(`16g ${tag}: a link beside the globe goes back to the switches (at least 44 px high, on screen with the globe); it switches nothing and does not count as a reveal`, link.shown && link.h >= 44 && link.inView && link.href === '#an-panel' && back && s.choice === Z && s.scroll.n === 2, [link, back]);
      // rapid switching, and off while loading
      const g2 = gate(); S.over[JOUR[W].j.file] = { hold: g2.p }; await toSwitch(page, W); await page.click(tgl(W)); await page.waitForTimeout(100); const a1 = await state(page); await toSwitch(page, SH); await page.click(tgl(SH)); await settle(page, SH); await page.waitForTimeout(150); const a2 = await state(page); g2.go(); delete S.over[JOUR[W].j.file]; await page.waitForTimeout(400); s = await state(page);
      ok(`16h ${tag}: two presses in a row: each press reveals the globe once; the superseded answer scrolls nothing and draws nothing`, seen(a1) && a1.scroll.n === 3 && seen(a2) && a2.scroll.n === 4 && s.scroll.n === 4 && s.y === a2.y && checked(s).join() === SH && s.n === JOUR[SH].d.t.length, [a1.scroll, a2.scroll, s.scroll]);
      await page.click(tgl(SH), { force: true }).catch(() => {}); await page.evaluate(() => { if (ME.journey.state().choice) ME.journey.select(null); }); await page.waitForTimeout(100);
      // failure: the message is beside the globe, on screen; the row's Retry reveals the globe again
      S.over[JOUR[SH].j.file] = { status: 500 }; await toSwitch(page, SH); await page.click(tgl(SH)); await done(page); s = await state(page); const nFail = s.scroll.n;
      ok(`16i ${tag}: a journey that fails after the reveal: its message is beside the globe and on screen (not only on its row below); no further scroll`, seen(s) && s.beside && s.beside.text === `White shark could not be shown. ${FAILED}` && s.beside.inView && nFail === 5 && s.switches[SH].retry === true && checked(s).length === 0, { beside: s.beside, box: s.box, n: nFail });
      delete S.over[JOUR[SH].j.file]; await page.evaluate(i => document.querySelector(`.an-sw[data-journey="${i}"] [data-f="sw-retry"]`).scrollIntoView({ block: 'center' }), SH); await page.waitForTimeout(80); await page.click(`.an-sw[data-journey="${SH}"] [data-f="sw-retry"]`); await settle(page, SH); await page.waitForTimeout(150); s = await state(page);
      ok(`16i2 ${tag}: the row's Retry reveals the globe again, once, and the journey is shown`, seen(s) && s.scroll.n === 6 && s.scene === 3 && s.beside === null, [s.scroll, s.box]);
      ok(`16i3 ${tag}: no page error`, errs.length === 0, errs); await ctx.close(); }
    { reset(); const { ctx, page } = await open(browser, { width: 390, height: 740 }, '#journey=' + W); await page.waitForTimeout(400); const s = await state(page);
      const inView = await page.evaluate(i => { const r = document.getElementById(i).getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }, 'tgl-' + W);
      ok('16j phone, a link to one switch: the switch is on screen and focused; the page is not taken to the globe; nothing is on', s.focus === 'tgl-' + W && inView && s.scroll === null && s.y > 100 && checked(s).length === 0, [s.y, s.scroll, inView]); await ctx.close(); }
    { reset(); const { ctx, page } = await open(browser, { width: 390, height: 740 }, '', { extra: { reducedMotion: 'no-preference' } }); await toSwitch(page, Z); await page.click(tgl(Z)); await settle(page, Z); await page.waitForFunction(() => { const r = document.getElementById('an-globe-box').getBoundingClientRect(); return r.top >= 0 && r.top <= 12; }, null, { timeout: 8000 }).catch(() => {}); const s = await state(page);
      ok('16k phone without the reduced-motion setting: the reveal is a smooth scroll and ends with the globe on screen', s.scroll && s.scroll.behavior === 'smooth' && s.scroll.n === 1 && seen(s), [s.scroll, s.box]); await ctx.close(); }
    { reset(); const { ctx, page } = await open(browser, { width: 1280, height: 600 }); await page.evaluate(i => document.getElementById('tgl-' + i).scrollIntoView({ block: 'center' }), W); const y0 = (await state(page)).y; await page.click(tgl(W)); await settle(page, W); const s = await state(page);
      ok('16l desktop (switches beside the globe): a press does not scroll the page', s.scroll === null && s.y === y0, [s.y, y0, s.scroll]); await ctx.close(); }
    { reset(); const noGL = ctx => ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
      const { ctx, page } = await open(browser, { width: 390, height: 740 }, '', { pre: noGL }); await toSwitch(page, Z); const y0 = (await state(page)).y; await page.click(tgl(Z), { force: true }); await page.waitForTimeout(300); const s = await state(page);
      ok('16m phone with no usable globe: a press on an unavailable switch does not scroll', s.scroll === null && s.y === y0 && checked(s).length === 0, [s.y, y0]); await ctx.close(); } }

  // ===== 17. The shared list's Retry has its own bounded request (GPT's Stage 1 review, finding 1)
  if (want(17)) { const CATN = 'journeys-R1.catalog.json', LIST_BAD = 'The list of journeys could not be verified. No journey can be shown until it verifies.', badCat = Buffer.from(CAT.toString().replace('"schema": 1', '"schema": 1 '));
    const listError = async (browser, vp) => { reset(); const o = await open(browser, vp); S.q[CATN] = [{ body: badCat }]; await o.page.click(tgl(W)); await done(o.page); const s = await state(o.page); if (s.integrity !== LIST_BAD) throw new Error('17 setup: list error not reached: ' + s.integrity); S.log = []; return o; };
    const aborted = o => o.failedReqs.filter(f => f[0] === CATN && /ERR_ABORTED/.test(f[1])).length;
    { // an old Retry FAILS after a newer journey has verified and loaded
      const o = await listError(browser), g = gate(); S.q[CATN] = [{ hold: g.p, status: 500 }]; await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => ME.journey.state().listBusy, null, { timeout: 5000 }); const busy = await state(o.page);
      await o.page.click(tgl(Z)); await settle(o.page, Z); const before = await state(o.page); g.go(); await o.page.waitForTimeout(700); const s = await state(o.page);
      ok('17a an old Retry that fails after a newer journey has verified and loaded changes nothing: no list error, nothing said, the journey still shown', s.integrity === null && s.catErr === '' && s.globeNote === '' && s.say === before.say && /^Plains zebra shown\./.test(s.say) && s.choice === Z && s.status === 'ready' && s.scene === 3 && s.listBusy === false, { integrity: s.integrity, say: s.say, bsay: before.say, note: s.globeNote, catErr: s.catErr, choice: s.choice, status: s.status, scene: s.scene, busy: s.listBusy });
      ok('17b while the Retry runs its button says Checking and is marked busy; the later selection aborts the Retry\'s own request', busy.retryBtn[0] === 'Checking…' && busy.retryBtn[1] === 'true' && aborted(o) >= 1, [busy.retryBtn, o.failedReqs]); await o.ctx.close(); }
    { // an old Retry SUCCEEDS after a newer failure of the list
      const o = await listError(browser), g = gate(); S.q[CATN] = [{ hold: g.p }, { body: badCat }]; await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => ME.journey.state().listBusy, null, { timeout: 5000 });
      await o.page.click(tgl(Z)); await done(o.page); const before = await state(o.page); g.go(); await o.page.waitForTimeout(700); const s = await state(o.page);
      ok('17c an old Retry that succeeds late does not clear a newer list error or say the list verified', before.integrity === LIST_BAD && s.integrity === LIST_BAD && s.say === before.say && /^Plains zebra could not be shown\./.test(s.say) && !/verified\. Journeys can/.test(s.say) && checked(s).length === 0 && s.scene === 0, [before.say, s.say, s.integrity]); await o.ctx.close(); }
    { // Retry, then Retry
      const o = await listError(browser), g = gate(); S.q[CATN] = [{ hold: g.p, status: 500 }, {}]; await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => ME.journey.state().listBusy, null, { timeout: 5000 }); await o.page.click('#an-integrity-retry');
      await o.page.waitForFunction(() => document.getElementById('an-integrity').hidden, null, { timeout: 10000 }); const before = await state(o.page); g.go(); await o.page.waitForTimeout(700); const s = await state(o.page);
      ok('17d Retry pressed twice: the newer Retry decides; the older one\'s late failure changes and says nothing; its request was aborted', before.integrity === null && before.say === 'The list of journeys verified. Journeys can be switched on.' && s.integrity === null && s.say === before.say && s.listBusy === false && s.retryBtn[0] === 'Retry' && aborted(o) >= 1, [before.say, s.say, s.integrity]);
      ok('17e a Retry of the list switches nothing on, draws nothing, and requests only the list', checked(s).length === 0 && s.scene === 0 && s.choice === null && s.scroll === null && S.log.length === 2 && S.log.every(n => n === CATN), S.log); await o.ctx.close(); }
    { // Retry, then leaving the page
      const o = await listError(browser), g = gate(); S.q[CATN] = [{ hold: g.p }]; await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => ME.journey.state().listBusy, null, { timeout: 5000 }); const before = await state(o.page);
      await o.page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); await o.page.waitForTimeout(150); const mid = await state(o.page); g.go(); await o.page.waitForTimeout(700); const s = await state(o.page);
      ok('17f leaving the page cancels a running Retry: its request is aborted, the button is back to Retry, and its late answer changes and says nothing', mid.listBusy === false && mid.retryBtn[0] === 'Retry' && mid.retryBtn[1] === null && aborted(o) >= 1 && s.integrity === LIST_BAD && s.say === before.say && s.listBusy === false, [mid.retryBtn, s.say, s.integrity]); await o.ctx.close(); }
    { // the globe stops while a Retry runs
      const o = await listError(browser), g = gate(); S.q[CATN] = [{ hold: g.p }]; await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => ME.journey.state().listBusy, null, { timeout: 5000 });
      await o.page.evaluate(() => { const cv = document.querySelector('#an-globe canvas'), gl = cv.getContext('webgl2') || cv.getContext('webgl'), ext = gl && gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); else cv.dispatchEvent(new Event('webglcontextlost', { cancelable: true })); });
      await o.page.waitForFunction(() => ME.animalsGlobe.state().globe === 'lost', null, { timeout: 15000 }); await o.page.waitForTimeout(200); const mid = await state(o.page); g.go(); await o.page.waitForTimeout(600); const s = await state(o.page);
      ok('17g the globe stops while a Retry runs: the Retry is cancelled and its late answer changes nothing', mid.listBusy === false && s.integrity === LIST_BAD && !/verified\. Journeys can/.test(s.say) && s.listBusy === false, [mid.listBusy, s.say]); await o.ctx.close(); }
    { // a request that never answers
      const o = await listError(browser), never = new Promise(() => {}); const limit = await o.page.evaluate(() => { const w = ME.journey.J.WAIT_MS; ME.journey.J.WAIT_MS = 900; return w; });
      S.q[CATN] = [{ hold: never }]; const t0 = Date.now(); await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => ME.journey.state().listBusy, null, { timeout: 5000 });
      const ended = await o.page.waitForFunction(() => !ME.journey.state().listBusy, null, { timeout: 6000 }).then(() => true, () => false); const s = await state(o.page);
      ok('17h a Retry whose request never answers ends at the time limit (the page\'s own limit is ' + limit + ' ms; 900 ms set for this check): the list error is said as a failure to load, the button is back to Retry, nothing is drawn', ended && Date.now() - t0 < 5000 && limit >= 5000 && s.integrity === 'The list of journeys could not be loaded. No journey can be shown until it loads.' && s.say === s.integrity && s.retryBtn[0] === 'Retry' && s.scene === 0 && checked(s).length === 0, [ended, s.integrity, s.say, limit]);
      await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => document.getElementById('an-integrity').hidden, null, { timeout: 10000 }).catch(() => {}); await on(o.page, SH); const s2 = await state(o.page);
      ok('17i after that, a Retry that is answered verifies the list and a journey can be shown; a journey load is not disturbed by the Retry\'s controller', s2.integrity === null && checked(s2).join() === SH && s2.scene === 3 && o.errs.length === 0, [s2.integrity, o.errs]); await o.ctx.close(); }
    {
      const o = await listError(browser, { width: 390, height: 740 }); await o.page.evaluate(() => document.getElementById('an-integrity-retry').scrollIntoView({ block: 'center' })); const s0 = await state(o.page); await o.page.click('#an-integrity-retry'); await o.page.waitForFunction(() => document.getElementById('an-integrity').hidden, null, { timeout: 10000 }); const s = await state(o.page);
      ok('17j phone: the list\'s Retry does not scroll the page to the globe', s.scroll.n === s0.scroll.n && s.box.bottom < 0 && s.integrity === null, [s.y, s0.y, s.scroll]); await o.ctx.close(); } }

  // ===== 18. The bird (stage 2; Part B: B8, B9, B12, B13, B16 and §11a). Expected states are worked out here from the display file.
  if (want(18)) { reset(); const T = JOUR[BIRD], D = T.d, J = T.j, n = D.t.length, RULE = T.m.gap_rule.max_join_seconds, P = D.withheld, R0 = J.record_first_s, R1 = J.record_last_s;
    const nextFix = s => { for (let i = 0; i < n; i++) if (D.t[i] > s) return D.t[i]; return Infinity; };
    const H = P.map(p => ({ from: p[0], to: nextFix(p[1]), p })), hidAt = s => H.find(h => s >= h.from && s < h.to) || null;
    const at = (page, times) => page.evaluate(ts => ts.map(x => { ME.journey.seek(x); const s = ME.journey.state(); return { t: x, rt: s.rt, i: s.i, hidden: s.hidden, bar: s.bar, mv: s.objects.markerVisible, fx: s.objects.fixesShown, ln: s.objects.lineShown, range: +document.getElementById('replay-range').value, text: document.getElementById('replay').textContent }; }), times);
    const { ctx, page, errs } = await open(browser); S.log = []; await page.focus(tgl(BIRD)); await page.keyboard.press('Space'); await settle(page, BIRD); await page.waitForTimeout(300); let s = await state(page);
    ok('18a the bird opens at the start of the recording, inside the first withheld period: no marker, no accuracy, nothing drawn yet; the bar and the announcement say fixes are withheld; three objects on the globe; its own files requested once',
      s.rt === R0 && s.hidden === true && s.objects.markerVisible === false && s.objects.fixesShown === 0 && s.objects.lineShown === 0 && s.scene === 3 && s.playing === false && !/accuracy/i.test(s.bar) && !/displayed fix 2/.test(s.bar.split(' · ')[1]) &&
      s.bar === `Replay time (recorded) ${utc(R0)} · Fixes near the tagging site are withheld: 86 fixes between 23 Jun 2008 17:58:44 UTC and 29 Jun 2008 00:01:14 UTC, within 5 km of the tagging-site reference point, are not shown. No marker is shown · Next displayed fix 29 Jun 2008 01:30:54 UTC` &&
      s.say === 'Waved albatross shown. Replay is at the start of the recording. The first fixes are withheld, so no marker is shown yet.' && s.note.startsWith('Replay: recorded 23 Jun 2008 to 15 Sep 2008.') && S.log.filter(x => x === T.j.file).length === 1, { bar: s.bar, say: s.say, obj: s.objects, rt: s.rt });
    ok('18b the row carries the manifest\'s sentences and the tag\'s accuracy statement; the switch\'s line is the accepted label, as the manifest has it', s.switches[BIRD].obs.includes(T.m.card.shown) && s.switches[BIRD].obs.includes(T.m.card.accuracy) && s.switches[BIRD].obs.includes(T.m.card.done) &&
      (await page.evaluate(id => document.querySelector(`.an-sw[data-journey="${id}"] [data-f="sw-label"]`).textContent, BIRD)) === T.m.label_line && T.m.label_line === 'Recorded movements of one breeding adult, 23 June to 15 September 2008.', s.switches[BIRD].obs.slice(0, 160));
    // every withheld period: at its start, just before the next displayed fix, exactly at it, and just before the period
    const times = []; for (const h of H) { times.push(h.from, h.p[1], h.to - 1); if (h.to !== Infinity) times.push(h.to); if (h.from - 1 >= R0) times.push(h.from - 1); }
    let r = await at(page, times), bad = [];
    for (const x of r) { const h = hidAt(x.t), i = lastAt(D.t, x.t);
      const want = h ? { hidden: true, mv: false, acc: false } : { hidden: false, mv: i >= 0, acc: i >= 0 };
      const acc = / · Tag's accuracy estimate ([\d.]+) m/.exec(x.bar);
      if (x.hidden !== want.hidden || x.mv !== want.mv || !!acc !== want.acc || (acc && +acc[1] !== D.acc[i]) || x.i !== i || x.fx !== i + 1 || x.ln !== joinsTo(D, RULE, i) || (h && (!x.bar.includes(`${h.p[2]} fixes between ${utc(h.p[0])} and ${utc(h.p[1])}`) || /Last displayed fix|tried/.test(x.bar))) || (!h && /withheld/.test(x.bar))) bad.push([x.t, x.hidden, x.mv, x.bar.slice(0, 200)]); }
    ok(`18c all ${H.length} withheld periods, at ${r.length} times: hidden from the first withheld time (inclusive) to the next displayed fix (exclusive); the marker and its accuracy are absent throughout and return exactly at that fix; track drawn before the period stays; no line into or out of it`, bad.length === 0 && r.length >= 4 * H.length, bad.slice(0, 3));
    // the failed attempt that lies inside a hidden span (after a period's last withheld fix, before the next displayed fix)
    const fin = D.failed_t.filter(f => hidAt(f)); r = await at(page, fin.concat(fin.map(f => f + 1)));
    ok('18d the one failed attempt inside a hidden span: withholding takes precedence; no "tried" wording, no marker, no accuracy', fin.length === 1 && r.every(x => x.hidden && !x.mv && !/tried|accuracy/i.test(x.bar) && /are withheld/.test(x.bar)), r.map(x => x.bar.slice(0, 160)));
    // a failed attempt in a visible joined step: said only once replay time reaches it
    const fv = D.failed_t.filter(f => !hidAt(f)), f0 = fv[0], i0 = lastAt(D.t, f0); r = await at(page, [f0 - 1, f0, f0 + 60, D.t[i0 + 1]]);
    ok('18e a failed attempt in a displayed, joined step: nothing before it; from the attempt on, "The tag tried for a position at … and got none", with the marker still on the earlier fix, named as the last displayed fix with its accuracy; gone at the next fix',
      fv.length === 10 && D.j[i0 + 1] === 1 && !/tried/.test(r[0].bar) && r[1].bar.includes(`The tag tried for a position at ${utc(f0)} and got none`) && r[2].bar.includes(`The tag tried for a position at ${utc(f0)} and got none`) && r[1].i === i0 && r[1].mv && r[1].bar.includes(`Last displayed fix ${utc(D.t[i0])}`) && r[1].bar.includes(`Tag's accuracy estimate ${D.acc[i0]} m`) && !/tried/.test(r[3].bar) && r[3].i === i0 + 1, r.map(x => x.bar));
    // the long step with no row of any kind in the source
    const longs = []; for (let i = 0; i < n - 1; i++) if (D.t[i + 1] - D.t[i] > RULE && !H.some(h => h.from > D.t[i] && h.from < D.t[i + 1])) longs.push(i);
    r = await at(page, longs.map(i => D.t[i] + 60));
    ok('18f the 9-hour step: "No position and no attempt is in the source for 9 h 0 min 14 s after it"; the marker stays on the earlier fix; the step is not drawn', longs.length === 1 && D.t[longs[0] + 1] - D.t[longs[0]] === 32414 && r[0].bar.includes('No position and no attempt is in the source for 9 h 0 min 14 s after it') && r[0].mv && r[0].i === longs[0] && D.j[longs[0] + 1] === 0, r.map(x => x.bar));
    // every stop of the slider, and one second after each: the three wordings each in their own state only; never the older journeys' wording
    const stops = [...new Set([R0, ...D.t, ...P.map(p => p[0]), R1])].sort((a, b) => a - b), sweep = stops.concat(stops.filter(x => x < R1).map(x => x + 1), D.failed_t, D.failed_t.map(x => x + 1)); r = await at(page, sweep); bad = []; let nHid = 0, nTried = 0, nLong = 0;
    for (const x of r) { const h = hidAt(x.t), i = lastAt(D.t, x.t), next = i < n - 1 ? D.t[i + 1] : Infinity, tried = !h && D.failed_t.some(f => f > D.t[i] && f < next && f <= x.t), long = !h && i >= 0 && i < n - 1 && next - D.t[i] > RULE && !H.some(q => q.from > D.t[i] && q.from < next);
      nHid += h ? 1 : 0; nTried += tried ? 1 : 0; nLong += long ? 1 : 0;
      if (/was recorded|No fix is displayed|tracking record|recorded fix\b/i.test(x.bar.replace('Replay time (recorded)', '')) || /are withheld/.test(x.bar) !== !!h || /tried for a position/.test(x.bar) !== tried || /is in the source for/.test(x.bar) !== long || x.mv !== (!h && i >= 0) || x.hidden !== !!h || x.fx !== i + 1 || x.ln !== joinsTo(D, RULE, i) ||
        /migrat|foraging trip|incubat|at the colony|at the nest/i.test(x.text)) bad.push([x.t, x.bar.slice(0, 220)]); }
    ok(`18g B12 at all ${stops.length} slider stops, every listed failed attempt, and one second after each (${r.length} times): withheld, failed-attempt and long-gap wording each appear only in their own state (${nHid}, ${nTried}, ${nLong} times); "No fix was recorded" and the older wordings never appear; marker, fix marks and line are as the file says; none of the not-said words is on the bar`, bad.length === 0 && nHid >= 2 * P.length && nTried === 20 && nLong === 2, bad.slice(0, 3));
    // B9: hidden after a seek, a speed change and a pause
    const mid = P[0][0] + 86400; await page.evaluate(x => { ME.journey.seek(x); ME.journey.setSpeed(3600); ME.journey.play(); }, mid); await page.waitForTimeout(500); const playing = await state(page);
    await page.evaluate(() => ME.journey.pause()); const paused = await state(page), barText = await page.evaluate(() => document.getElementById('replay').textContent + document.getElementById('an-status').textContent);
    ok('18h B9 inside a withheld period after a seek, a speed change, while playing and after a pause: no marker and no accuracy text anywhere on the bar', playing.playing === true && playing.hidden && !playing.objects.markerVisible && paused.playing === false && paused.hidden && !paused.objects.markerVisible && paused.rt > mid && !/accuracy estimate/i.test(barText), [playing.bar, paused.bar]);
    // the slider
    await page.evaluate(x => ME.journey.seek(x), D.t[0]); await page.focus('#replay-range'); await page.keyboard.press('Home'); const k0 = await state(page); await page.keyboard.press('ArrowRight'); const k1 = await state(page);
    const iB = lastAt(D.t, P[1][0]); await page.evaluate(x => ME.journey.seek(x), D.t[iB]); await page.keyboard.press('ArrowRight'); const k2 = await state(page); await page.keyboard.press('ArrowRight'); const k3 = await state(page); await page.keyboard.press('End'); const k4 = await state(page);
    const rng = await page.evaluate(() => { const r = document.getElementById('replay-range'); return [r.max, document.querySelector('label[for="replay-range"]').textContent, r.getAttribute('aria-valuetext')]; });
    ok('18i the slider\'s stops are the displayed fixes and the start of each withheld period: Home is the start of the recording (withheld); the next stop is the first displayed fix; from the fix before a period the next stop is the period\'s start (withheld), then the next displayed fix; End is the end of the recording',
      k0.rt === R0 && k0.hidden && k1.rt === D.t[0] && !k1.hidden && k1.i === 0 && k2.rt === P[1][0] && k2.hidden && k3.rt === H[1].to && !k3.hidden && k4.rt === R1 && +rng[0] === stops.length - 1 && stops.length === n + P.length && /start of each withheld period/.test(rng[1]) && rng[2] === k4.bar, [k0.rt, k1.rt, k2.rt, k3.rt, k4.rt, rng[0], stops.length]);
    ok('18j at the last displayed fix, which is also the last source row, the bar says the displayed record ends here, with that fix\'s accuracy', k4.i === n - 1 && k4.bar === `Replay time (recorded) ${utc(R1)} · Last displayed fix: displayed record ends here, ${utc(D.t[n - 1])} · Tag's accuracy estimate ${D.acc[n - 1]} m`, k4.bar);
    // play to the end, and again
    await page.evaluate(x => { ME.journey.setSpeed(604800 * 8); ME.journey.seek(x); }, R1 - 86400 * 2); await page.click('#replay-play'); await page.waitForFunction(() => !ME.journey.state().playing, null, { timeout: 30000 }); const e1 = await state(page);
    await page.click('#replay-play'); await page.waitForTimeout(60); await page.evaluate(() => ME.journey.pause()); const e2 = await state(page);
    ok('18k Play runs to the end of the recording and stops; Play again starts from the start of the recording', e1.rt === R1 && e1.i === n - 1 && e1.play === 'Play' && e2.rt >= R0 && e2.rt < D.t[0] + 86400 * 30, [e1.rt, e2.rt]);
    // B16: the view holds the displayed journey
    const inView = async pg => pg.evaluate(([la, lo]) => { ME.journey.goArea(); const g = ME.animalsGlobe.raw(), cv = document.querySelector('#an-globe canvas').getBoundingClientRect(); let out = 0;
      for (let i = 0; i < la.length; i += 5) { const c = g.getScreenCoords(la[i], lo[i], 0.004); if (!(c.x >= 0 && c.x <= cv.width && c.y >= 0 && c.y <= cv.height)) out++; } return [out, Math.round(cv.width), Math.round(cv.height)]; }, [D.lat, D.lon]);
    const v1 = await inView(page);
    ok('18l B16 desktop: "Journey area" puts every sampled displayed fix inside the globe\'s box', v1[0] === 0, v1);
    ok('18l2 the card under the globe: the label, the counts and the withholding statement come from the manifest; the recording period and the displayed fixes are stated apart; no land-map row',
      await page.evaluate(([id, m]) => { const c = document.getElementById(id), f = k => c.querySelector(`[data-f="${k}"]`).textContent; return c.querySelector('h4').textContent === m.label && f('shown') === m.label_line + ' ' + m.card.shown && f('notdrawn') === m.card.done + ' ' + m.withholding.statement && /^Recording: 23 Jun 2008 17:58:44 UTC to 15 Sep 2008 13:30:18 UTC; the replay covers all of it\. First displayed fix 29 Jun 2008 01:30:54 UTC\. Last displayed fix 15 Sep 2008 13:30:18 UTC\.$/.test(f('period')) && f('unc').startsWith(m.accuracy_note) && f('place').includes('Punta Cevallos') && f('place').includes('Nest stage: egg') && c.querySelector('[data-f="land"]').closest('tr').hidden && !/migrat|foraging trip|incubat|at the colony|at the nest/i.test(c.textContent) && /nine were used in the paper's analysis/.test(c.textContent); }, [BIRD, T.m]));
    // back to an older journey: nothing of the bird's wording or frame is left
    await page.click(tgl(Z)); await settle(page, Z); const z = await state(page), zr = await page.evaluate(() => [document.getElementById('replay-range').max, document.querySelector('label[for="replay-range"]').textContent]);
    ok('18n after the bird, the zebra is as before: its own stops (one per fix), its own label on the slider, no accuracy or withheld wording, no hidden state', +zr[0] === JOUR[Z].d.t.length - 1 && zr[1] === 'Recorded fix (arrow keys step from fix to fix)' && z.hidden === false && !/accuracy|withheld/.test(z.bar) && z.bar.includes('First recorded fix') && z.scene === 3 && z.n === JOUR[Z].d.t.length, [zr, z.bar]);
    ok('18o no page error', errs.length === 0, errs); await ctx.close();
    { reset(); const o = await open(browser, { width: 390, height: 740 }); await o.page.evaluate(i => document.getElementById('tgl-' + i).scrollIntoView({ block: 'center' }), BIRD); await o.page.click(tgl(BIRD)); await settle(o.page, BIRD); await o.page.waitForTimeout(300); const v = await inView(o.page), s2 = await state(o.page);
      ok('18p B16 at 390 px: every sampled displayed fix is inside the globe\'s box; the press brought the globe into view although no marker is shown', v[0] === 0 && s2.box.top >= 0 && s2.box.top <= 12 && s2.box.bottom <= s2.vh && s2.hidden === true && s2.scroll && s2.scroll.n === 1, [v, s2.box]); await o.ctx.close(); }
    // B8: a trailing withheld period (fixture: the last three displayed fixes become a withheld period)
    { reset(); S.fx = fixture(BIRD, (d, m, jr) => { const k = d.n - 3, a = d.t[k], b = d.t[d.n - 1]; for (const f of ['t', 'lat', 'lon', 'acc', 'j']) d[f] = d[f].slice(0, k); d.n = k; d.withheld.push([a, b, 3]);
        const keep = d.failed_t.filter(x => x < a || x > b); d.failed_t = keep; jr.failed_listed = keep.length; jr.fixes = k; jr.last_fix_s = d.t[k - 1]; jr.fixes_withheld += 3; jr.withheld_periods += 1; jr.steps_joined = d.j.reduce((x, y) => x + y, 0); });
      const o = await open(browser), fd = S.fx.d, last = fd.withheld[fd.withheld.length - 1]; await on(o.page, BIRD);
      const rr = await at(o.page, [last[0] - 1, last[0], last[1], R1 - 1, R1]); await o.page.focus('#replay-range'); await o.page.keyboard.press('End'); const kEnd = await state(o.page);
      await o.page.evaluate(x => { ME.journey.setSpeed(604800 * 8); ME.journey.seek(x); }, fd.t[fd.n - 1] - 86400); await o.page.click('#replay-play'); await o.page.waitForFunction(() => !ME.journey.state().playing, null, { timeout: 30000 }); const pEnd = await state(o.page);
      ok('18m B8 a trailing withheld period (fixture): the hidden state runs through the end of the recording, inclusive; the slider\'s End and Play both reach that end; no marker and no accuracy there; the bar says the recording ends in the period',
        !rr[0].hidden && rr[0].mv && rr.slice(1).every(x => x.hidden && !x.mv && !/accuracy/.test(x.bar) && /The recording ends in this withheld period/.test(x.bar)) && kEnd.rt === R1 && kEnd.hidden && pEnd.rt === R1 && pEnd.hidden && !pEnd.objects.markerVisible && pEnd.objects.fixesShown === fd.n, [rr.map(x => [x.hidden, x.mv]), kEnd.rt, pEnd.rt, R1]); await o.ctx.close(); } }

  // ===== 19. The bird's file is verified before anything is drawn (B11, B14, §11a structure checks). Fixtures are re-pinned (harness).
  if (want(19)) { const UNV = 'Journey file could not be verified. Nothing is drawn.';
    const refused = async (id, mutate, re) => { reset(); S.fx = fixture(id, mutate); const o = await open(browser); await o.page.click(tgl(id)); await done(o.page); const s = await state(o.page); await o.ctx.close();
      return { ok: s.scene === 0 && checked(s).length === 0 && s.switches[id].obs === UNV && s.err[id] && re.test(s.err[id].detail), detail: s.err[id] && s.err[id].detail, scene: s.scene }; };
    const loads = async (id, mutate) => { reset(); S.fx = fixture(id, mutate); const o = await open(browser); await o.page.click(tgl(id)); await done(o.page); const s = await state(o.page); await o.ctx.close(); return s.scene === 3 && s.status === 'ready'; };
    let res = []; for (const f of ['acc', 'j', 'withheld', 'failed_t']) res.push([f, await refused(BIRD, d => { delete d[f]; }, new RegExp(`lacks "${f}"`))]);
    ok('19a §11a the bird requires its new fields: a display file without acc, j, withheld or failed_t is refused, never read as an older journey', res.every(x => x[1].ok), res.filter(x => !x[1].ok));
    res = [['short', d => { d.acc = d.acc.slice(1); }], ['negative', d => { d.acc[7] = -1; }], ['text', d => { d.acc[7] = '4.2'; }], ['null', d => { d.acc[7] = null; }]]; const rb = []; for (const [nm, mu] of res) rb.push([nm, await refused(BIRD, mu, /accuracy estimates/)]);
    ok('19b B11 accuracy: a wrong length, a negative, a non-number and a missing entry are each refused', rb.every(x => x[1].ok), rb.filter(x => !x[1].ok));
    const D = JOUR[BIRD].d, kP = (() => { for (let i = 1; i < D.n; i++) if (D.withheld.some(p => p[0] > D.t[i - 1] && p[0] < D.t[i])) return i; })();
    // a step that IS within the time rule and is flagged joined, with a withheld period placed between its two fixes
    const kJ = (() => { for (let i = 5; i < D.n; i++) if (D.j[i] === 1 && D.t[i] - D.t[i - 1] > 100 && !D.failed_t.some(f => f > D.t[i - 1] && f < D.t[i])) return i; })();
    const c1 = await refused(BIRD, (d, m, jr) => { d.withheld.push([d.t[kJ - 1] + 10, d.t[kJ - 1] + 20, 2]); d.withheld.sort((x, y) => x[0] - y[0]); jr.fixes_withheld += 2; jr.withheld_periods += 1; }, /joined across a withheld period/);
    const c1b = await refused(BIRD, (d, m, jr) => { d.j[kP] = 1; jr.steps_joined += 1; }, /further apart than the rule/);
    const c2 = await refused(BIRD, (d, m, jr) => { const i = d.j.indexOf(1); d.j[i] = 0; }, /number of joined steps/);
    const c3 = await refused(BIRD, d => { d.j[0] = 1; }, /join flags are missing or malformed/);
    ok('19c join flags: a join across a withheld period although the two fixes are within the time rule; a join over the time rule; a count that differs from the manifest; and a malformed array are each refused', c1.ok && c1b.ok && c2.ok && c3.ok, [c1, c1b, c2, c3]);
    const w = [['a displayed fix inside a period', (d) => { d.withheld[1][1] = d.t[kP]; }, /inside a withheld period/], ['periods out of order', d => { const x = d.withheld[2]; d.withheld[2] = d.withheld[3]; d.withheld[3] = x; }, /out of order, overlap/],
      ['a count that differs', d => { d.withheld[1][2] += 1; }, /withheld counts do not match/], ['a period before the recording', d => { d.withheld[0][0] -= 10; }, /out of order, overlap or lie outside/], ['a coordinate smuggled into a period', d => { d.withheld[1].push(-1.39); }, /withheld period is malformed/],
      ['a non-integer time', d => { d.withheld[1][0] += 0.5; }, /withheld period is malformed/]]; const rw = []; for (const [nm, mu, re] of w) rw.push([nm, await refused(BIRD, mu, re)]);
    ok('19d withheld periods: a displayed fix inside one, periods out of order, a wrong count, a period outside the recording, an extra value in a period and a non-integer time are each refused', rw.every(x => x[1].ok), rw.filter(x => !x[1].ok));
    const fl = [['at a fix', d => { d.failed_t[0] = d.t[lastAt(d.t, d.failed_t[0])]; }], ['inside a period', d => { d.failed_t[0] = d.withheld[0][0] + 5; }], ['not increasing', d => { d.failed_t[1] = d.failed_t[0]; }], ['one missing', d => { d.failed_t.pop(); }], ['outside the recording', d => { d.failed_t[d.failed_t.length - 1] = 2e9; }]]; const rf = [];
    for (const [nm, mu] of fl) rf.push([nm, await refused(BIRD, mu, /failed-attempt time/)]);
    ok('19e failed attempts: a time at a fix, inside a stored period, out of order, missing, or outside the recording is each refused', rf.every(x => x[1].ok), rf.filter(x => !x[1].ok));
    const m1 = await refused(BIRD, (d, m, jr) => { delete jr.record_first_s; }, /recording period in the manifest/), m2 = await refused(BIRD, (d, m, jr) => { jr.record_last_s = d.t[d.n - 1] - 1; }, /recording period in the manifest/);
    ok('19f a manifest without a usable recording period is refused', m1.ok && m2.ok, [m1, m2]);
    // the older journeys verify exactly as before
    const a1 = await refused(SH, d => { delete d.lc; }, /quality classes/), a2 = await refused(SH, d => { delete d.j; }, /join flags are missing/), a3 = await refused(Z, d => { d.j = d.t.map(() => 0); }, /quality classes/), a4 = await refused(W, d => { d.lc = d.lc.slice(1); }, /quality classes/);
    ok('19g the older journeys verify as before: an Argos file without its classes or its join flags is refused; an older-schema file that gains join flags without classes is refused', a1.ok && a2.ok && a3.ok && a4.ok, [a1, a2, a3, a4]);
    ok('19h an unchanged copy of each file, re-pinned the same way, still loads (the harness is not what refuses)', (await loads(BIRD, () => { })) && (await loads(SH, () => { })) && (await loads(Z, () => { })));
    // B14 for the bird: a changed display file and a changed manifest (real pins)
    reset(); { const o = await open(browser); const bad = Buffer.from(real(JOUR[BIRD].j.file)); bad[bad.length - 40] = bad[bad.length - 40] === 0x31 ? 0x32 : 0x31; S.over[JOUR[BIRD].j.file] = { body: bad }; await o.page.click(tgl(BIRD)); await done(o.page); let s = await state(o.page); const e1 = s.scene === 0 && s.switches[BIRD].obs === UNV && /display file does not match/.test(s.err[BIRD].detail);
      delete S.over[JOUR[BIRD].j.file]; S.over[JOUR[BIRD].e.manifest] = { body: Buffer.from(JSON.stringify({ ...JOUR[BIRD].m, label: 'x' })) }; S.log = []; await o.page.click(`.an-sw[data-journey="${BIRD}"] [data-f="sw-retry"]`); await done(o.page); s = await state(o.page);
      ok('19i B14 the bird\'s display file with one digit changed, and its manifest changed, are each refused with nothing drawn; with a bad manifest the display file is never requested', e1 && s.scene === 0 && /manifest does not match/.test(s.err[BIRD].detail) && !S.log.includes(JOUR[BIRD].j.file), [e1, s.err]); await o.ctx.close(); } }
  } catch (e) { fail++; console.log('FAIL  suite error: ' + (e && e.stack || e).toString().slice(0, 900)); }
  await browser.close(); srv.close(); clearTimeout(wd);
  if (BREAK) { const hit = failed.some(n => n.startsWith(EXPECT[BREAK])); console.log(hit ? `BREAK CAUGHT  ${BREAK} (at "${EXPECT[BREAK]}"; ${fail} checks failed)` : `BREAK MISSED  ${BREAK}: expected a failure at "${EXPECT[BREAK]}"; failed: ${failed.slice(0, 6).join(' | ') || 'none'}`); process.exit(hit ? 0 : 1); }
  console.log(`\nanimals-tab-ui: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
