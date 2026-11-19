/* Mother Earth — Animal journey private preview (animals-zebra-preview-rc, 19 Nov 2026; docs/concepts/ANIMALS-PROPOSAL.md rev 2.2).
 * The REAL page files in Chromium, served by this suite's own server, with the committed manifest and display file
 * (assets/animals/). The hub is an empty fixture. Expected values (which fix is the last at a time, how many joins) are
 * worked out here from the display file, separately from the page's code.
 * What it proves:
 *   off on load, nothing requested until the switch; after the switch only the manifest and the display file are fetched;
 *   the marker is exactly on the last recorded fix at or before the replay time, never between fixes, never on a later one;
 *   only the past is drawn, and scrubbing back removes it; the fix time and its age are printed to the second in UTC
 *   whatever the visitor's time zone; the line rule (joined at exactly 3 h, not joined at 3 h 1 s) with a small fixture file,
 *   and the gap sentence; play advances, stops at the last fix and says the record ends; replay does not touch the header
 *   clock, the imagery label or request anything; off clears every object, the bar and the Key; off while loading draws
 *   nothing late; rapid on/off/on leaves one set of objects; a changed display file or manifest, or a file whose contents
 *   break the checks, draws nothing and says so; a failed load offers Retry and Retry works; the Sky zoom-out view pauses and
 *   hides and restores at the same replay time; a hidden tab pauses and keeps the replay; a reload starts bare; leaving the
 *   page by a real link and coming Back starts bare (ready, and while loading), and so do the page-keeping events sent to
 *   the page (the suite prints whether this browser really restored a kept page); off aborts the request itself, and an
 *   answer that still arrives is refused; with other layers on, journey on/off leaves their switches, Key entries and drawings
 *   as they were (open inspector and search state are NOT covered); ages are exact to the second across minute, hour, midnight and day; keyboard:
 *   arrows step fix to fix, Home/End, Space/Enter on Play and on the switch; the Key and "Key · N layers" follow what is drawn;
 *   the Layers panel row; the deep link shows the switch and switches nothing on; the bar covers no other control and nothing
 *   overflows at five widths; the Animals page: details from the verified manifest, fixed "Not available yet" states, the
 *   sample-size sentence, no figure when the manifest fails; the Animals tab on every page, one row at 360/390/430 px.
 * What it does NOT prove: performance (J12: unmeasured here, needs foreground Chrome on a real machine); a real phone; a
 *   screen reader; real imagery behind the journey; the full-source build check (needs the 15.7 MB source file). The Sky view
 *   is entered by setting the page's own body class, not through the Sky controls (sky-zoom-ui covers those).
 *   The line-rule fixture is served with its own checksum pinned in place of the real one: a harness substitution, stated here.
 * Each break names the check that must catch it (EXPECT below); under a break the suite prints BREAK CAUGHT only if
 *   that check failed, otherwise BREAK MISSED. SECTIONS=n,n runs parts of the suite.
 * Run: NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/animals-journey-ui.test.cjs
 * Breaks (each must fail): BREAK=marker-next-fix|marker-interpolated|future-fixes-drawn|future-line-drawn|join-over-rule|
 *   exact-rule-not-joined|no-manifest-check|no-display-check|no-content-check|off-no-cancel|off-no-abort|age-drops-seconds|no-pagehide-reset|no-pageshow-reset|off-keeps-objects|on-means-drawn|
 *   drop-key|drop-layers-row|sky-keeps-drawn|sky-keeps-playing|hidden-keeps-playing|local-time|no-stop-at-end|deep-link-switches-on|
 *   retry-hidden|load-on-open|population-substituted|page-unverified-figures|tab-missing|replay-moves-clock */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const { PNG } = require('pngjs');
const ROOT = path.join(__dirname, '..'), HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const BREAK = process.env.BREAK || '';
const ONLY = (process.env.SECTIONS || '').split(',').filter(Boolean).map(Number), want = n => !ONLY.length || ONLY.includes(n);   // SECTIONS=1,4 runs those parts only (used for the breaks)
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; failed.push(n); console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 2400)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 14 min'); process.exit(1); }, 14 * 60e3);

const JS = 'animals-journey.js';
const BREAKS = {
  'marker-next-fix': [JS, 'if (t[mid] <= s) lo = mid; else hi = mid - 1; } return lo; }', 'if (t[mid] <= s) lo = mid; else hi = mid - 1; } return Math.min(t.length - 1, lo + 1); }'],
  'marker-interpolated': [JS, "if (i >= 0) { o.marker.position.set(o.P[i * 3], o.P[i * 3 + 1], o.P[i * 3 + 2]); sizeMarker(); }",
    "if (i >= 0) { const j = Math.min(st.d.t.length - 1, i + 1), f = j > i ? Math.min(1, (st.rt - st.d.t[i]) / (st.d.t[j] - st.d.t[i])) : 0; o.marker.position.set(o.P[i * 3] + (o.P[j * 3] - o.P[i * 3]) * f, o.P[i * 3 + 1] + (o.P[j * 3 + 1] - o.P[i * 3 + 1]) * f, o.P[i * 3 + 2] + (o.P[j * 3 + 2] - o.P[i * 3 + 2]) * f); sizeMarker(); }"],
  'future-fixes-drawn': [JS, 'o.fixes.geometry.setDrawRange(0, i >= 0 ? (i + 1) * 3 : 0);', 'o.fixes.geometry.setDrawRange(0, st.d.t.length * 3);'],
  'future-line-drawn': [JS, 'o.line.geometry.setDrawRange(0, i > 0 ? st.seg[i] * 3 : 0);', 'o.line.geometry.setDrawRange(0, o.segs * 3);'],
  'join-over-rule': [JS, 'for (let i = 1; i < n; i++) if (d.t[i] - d.t[i - 1] <= rule) {', 'for (let i = 1; i < n; i++) if (d.t[i] - d.t[i - 1] <= rule + 1) {'],
  'exact-rule-not-joined': [JS, 'for (let i = 1; i < n; i++) if (d.t[i] - d.t[i - 1] <= rule) {', 'for (let i = 1; i < n; i++) if (d.t[i] - d.t[i - 1] < rule) {'],
  'no-manifest-check': [JS, "if (await hex(mb) !== J.MANIFEST_SHA256) throw new Unverified('the manifest does not match its pinned checksum');", ''],
  'no-display-check': [JS, "if (db.byteLength !== ent.bytes || await hex(db) !== ent.sha256) throw new Unverified('the display file does not match the manifest checksum');", ''],
  'no-content-check': [JS, "if (!Number.isInteger(t) || (i && t <= d.t[i - 1])) throw new Unverified('fix times are not whole seconds in increasing order');", ''],
  'off-no-cancel': [JS, "if (!on) { st.on = false; st.gen++; abortLoad(); pause(false); clearObjs();", "if (!on) { st.on = false; abortLoad(); pause(false); clearObjs();"],
  'off-no-abort': [JS, "if (!on) { st.on = false; st.gen++; abortLoad(); pause(false); clearObjs();", "if (!on) { st.on = false; st.gen++; pause(false); clearObjs();"],
  'age-drops-seconds': [JS, "return d ? `${d} d ${h} h ${m} min ${x} s` : h ? `${h} h ${m} min ${x} s` :", "return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` :"],
  'no-pagehide-reset': [JS, "window.addEventListener('pagehide', () => { if (st.on) setOn(false); });", ''],
  'no-pageshow-reset': [JS, "window.addEventListener('pageshow', e => { if (e.persisted && st.on) setOn(false); });", ''],
  'off-keeps-objects': [JS, "st.gen++; abortLoad(); pause(false); clearObjs(); st.d = null;", "st.gen++; abortLoad(); pause(false); st.d = null;"],
  'on-means-drawn': [JS, 'const drawn = () => !!(st.objs && st.objs.line.parent && st.objs.line.visible);', 'const drawn = () => st.on;'],
  'drop-key': ['index.html', "['journey', () => ME.journey && ME.journey.drawn()]", "['journey', () => false]"],
  'drop-layers-row': ['layers.js', ", ['Animal journey — dated replay', '#tgl-journey']", ''],
  'sky-keeps-drawn': [JS, 'const i = st.i, vis = !st.sky;', 'const i = st.i, vis = true;'],
  'sky-keeps-playing': [JS, 'st.sky = sky; if (sky) pause(false);', 'st.sky = sky;'],
  'hidden-keeps-playing': [JS, 'if (document.hidden && st.playing) pause(false);', ''],
  'local-time': [JS, '${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} UTC`; };\n  const utcDay', '${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())} UTC`; };\n  const utcDay'],
  'no-stop-at-end': [JS, 'if (next >= end) { st.playing = false; seek(end, false); paintCtl(); return; }', 'if (next >= end) { seek(st.d.t[0], true); st.raf = requestAnimationFrame(tick); return; }'],
  'deep-link-switches-on': [JS, "if (row) row.focus(); const c = $('journey-chosen');", "if (row) row.focus(); setOn(true); const c = $('journey-chosen');"],
  'retry-hidden': [JS, "retry.hidden = !(st.on && st.status === 'failed');", 'retry.hidden = true;'],
  'load-on-open': [JS, "  tgl.addEventListener('click', () => setOn(!st.on));", "  tgl.addEventListener('click', () => setOn(!st.on)); fetch(J.MANIFEST).catch(() => { });"],
  'population-substituted': ['animals.html', '<p class="an-na" id="an-pop">Not available yet. No population series has been reviewed.</p>', '<p class="an-na" id="an-pop">Population: 7 tracked animals.</p>'],
  'page-unverified-figures': ['animals.js', 'if (sha !== A.MANIFEST_SHA256) throw 0; ', ''],
  'tab-missing': ['moon.html', '    <a href="animals.html" data-view="animals">Animals</a>\n', ''],
  'replay-moves-clock': [JS, 'st.rt = s; st.rtExact = s; st.i = fixAt(s); show(); paintBar(quiet); }', "st.rt = s; st.rtExact = s; st.i = fixAt(s); show(); paintBar(quiet); const c = $('clock'); if (c) c.firstChild.textContent = '00:00:00'; }"],
};
const EXPECT = { 'marker-next-fix': '2a between', 'marker-interpolated': '2a between', 'future-fixes-drawn': '2b between', 'future-line-drawn': '2b between', 'join-over-rule': '12a', 'exact-rule-not-joined': '12a',
  'no-manifest-check': '10 a manifest that differs', 'no-display-check': '10 a display file with one digit', 'no-content-check': '10 a file with matching checksums whose fix times', 'off-no-cancel': '9e', 'off-no-abort': '9b off', 'age-drops-seconds': '2c 1 h 1 min 1 s', 'no-pagehide-reset': '18c', 'no-pageshow-reset': '18d', 'off-keeps-objects': '8a',
  'on-means-drawn': '6a', 'drop-key': '1h', 'drop-layers-row': '1c', 'sky-keeps-drawn': '6a', 'sky-keeps-playing': '6a', 'hidden-keeps-playing': '7a', 'local-time': '13 visitor in Pacific/Auckland', 'no-stop-at-end': '5c',
  'deep-link-switches-on': '14b', 'retry-hidden': '11a', 'load-on-open': '1b', 'population-substituted': '16c', 'page-unverified-figures': '16h', 'tab-missing': '17a moon.html at 390', 'replay-moves-clock': '3a' };
if (BREAK && !(BREAKS[BREAK] && EXPECT[BREAK])) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
const failed = [];

// ---------- files and fixtures
const MAN = fs.readFileSync(path.join(ROOT, 'assets/animals/zebra-botswana-R1.manifest.json')), MANJ = JSON.parse(MAN);
const DISP = fs.readFileSync(path.join(ROOT, 'assets/animals/' + MANJ.journeys[0].file)), D = JSON.parse(DISP);
const PIN = sha(MAN), RULE = MANJ.gap_rule.max_join_seconds, N = D.t.length;
const lastAt = s => { let k = -1; for (let i = 0; i < N && D.t[i] <= s; i++) k = i; return k; };                      // plain scan, not the page's search
const joinsTo = (t, i) => { let k = 0; for (let j = 1; j <= i; j++) if (t[j] - t[j - 1] <= RULE) k++; return k; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const utc = s => { const x = new Date(s * 1000).toISOString(); return `${+x.slice(8, 10)} ${MON[+x.slice(5, 7) - 1]} ${x.slice(0, 4)} ${x.slice(11, 19)} UTC`; };
/** a length of time in words, exact to the second — written apart from the page's code (peel the units off one at a time) */
const ageWords = sec => { const out = []; let rest = sec; for (const [unit, size] of [['d', 86400], ['h', 3600], ['min', 60]]) { let k = 0; while (rest >= size) { rest -= size; k++; } if (k || out.length) out.push(`${k} ${unit}`); } out.push(`${rest} s`); return out.join(' '); };
/** a small made-up file for the line rule: gaps of 1 h, exactly 3 h, 3 h 1 s, 1 h, 5 h */
function fixture(times) {
  const t0 = 1193299200, t = times || [0, 3600, 3600 + 10800, 3600 + 10800 + 10801, 3600 + 10800 + 10801 + 3600, 3600 + 10800 + 10801 + 3600 + 18000].map(x => t0 + x);
  const d = { schema: 1, id: 'fx', study: 'zebra-botswana', animal: 'Z3866', n: t.length, t, lat: t.map((_, i) => -20 + i * 0.01), lon: t.map((_, i) => 24 + i * 0.01) };
  const db = Buffer.from(JSON.stringify(d));
  const m = { ...MANJ, journeys: [{ ...MANJ.journeys[0], file: 'fx.json', bytes: db.length, sha256: sha(db), fixes: t.length, first_fix_s: t[0], last_fix_s: t[t.length - 1] }] };
  return { manifest: Buffer.from(JSON.stringify(m)), display: db, d };
}
const BACKDROP = (() => { const p = new PNG({ width: 64, height: 32 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = 10; p.data[i + 1] = 30; p.data[i + 2] = 60; p.data[i + 3] = 255; } return PNG.sync.write(p); })();

// ---------- server: the real files; S lets one step swap or fail the two animal files
const S = { fx: null, manifest: null, display: null, manifestStatus: 200, displayStatus: 200, hold: null, holdManifest: null, keepable: false, log: [] };
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
function served(f) { let t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (BREAK && BREAKS[BREAK][0] === f) { const [, a, b] = BREAKS[BREAK]; if (t.split(a).length !== 2) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } t = t.replace(a, b); }
  if (S.fx && (f === JS || f === 'animals.js')) { if (t.split(PIN).length !== 2) { console.log('FAIL  pinned checksum not found in ' + f); process.exit(1); } t = t.replace(PIN, sha(S.fx.manifest)); }
  return t; }
const srv = http.createServer(async (q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0]), f = p.replace(/^\//, '') || 'index.html';
  const send = (code, type, body) => { s.writeHead(code, { 'content-type': type, 'cache-control': S.keepable ? 'no-cache' : 'no-store' }); s.end(body); };   // keepable: lets the browser keep a page for Back (section 10)
  if (p.startsWith('/assets/animals/')) { S.log.push(p);
    if (p.endsWith('.manifest.json')) { if (S.holdManifest) await S.holdManifest; if (S.manifestStatus !== 200) return send(S.manifestStatus, 'text/plain', 'no'); return send(200, 'application/json', S.fx ? S.fx.manifest : S.manifest || MAN); }
    if (S.hold) await S.hold; if (S.displayStatus !== 200) return send(S.displayStatus, 'text/plain', 'no');
    return send(200, 'application/json', S.fx ? S.fx.display : S.display || DISP); }
  if (!fs.existsSync(path.join(ROOT, f))) return send(404, 'text/plain', '');
  const ext = path.extname(f); if (TYPES[ext] && ext !== '.json') return send(200, TYPES[ext], served(f));
  send(200, TYPES[ext] || 'application/octet-stream', fs.readFileSync(path.join(ROOT, f)));
});
const reset = () => Object.assign(S, { fx: null, manifest: null, display: null, manifestStatus: 200, displayStatus: 200, hold: null, holdManifest: null, keepable: false, log: [] });

let BASE;
async function ctxFor(browser, vp, extra = {}) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce', ...extra });
  await ctx.route('**/unpkg.com/**', r => /globe\.gl/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }) : r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await ctx.route('**/cdn.jsdelivr.net/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: BACKDROP }));
  const NOW = new Date().toISOString();
  await ctx.route(HUB + '/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ layer: 'x', retrieved_at: NOW, stale_after_s: 10800, source_status: 'ok', cells: {}, record_format: 'rows', record_fields: [], records: [], history: { collecting: false, retained: { exists: false } } }) }));
  return ctx;
}
async function open(browser, vp = { width: 1280, height: 860 }, hash = '', extra = {}, pre = null) {
  const ctx = await ctxFor(browser, vp, extra); if (pre) await pre(ctx); const page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  const reqs = []; page.on('request', r => reqs.push(r.url()));
  await page.goto(BASE + '/index.html' + hash, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.journey && ME.globe && ME.globe(), null, { timeout: 30000 });
  await page.waitForFunction(() => { const g = ME.globe(); let ok = false; g.scene().traverse(o => { if (o.isMesh && o.material === g.globeMaterial() && o.material.map) ok = true; }); return ok; }, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  return { ctx, page, errs, reqs };
}
const state = page => page.evaluate(() => ({ ...ME.journey.state(), scene: ME.journey.sceneCount(), sw: document.getElementById('tgl-journey').getAttribute('aria-checked'), card: document.getElementById('o-journey').textContent,
  chip: document.getElementById('s-journey').textContent, keyN: document.getElementById('key-n').textContent, leg: !document.getElementById('leg-journey').hidden, none: !document.getElementById('leg-none').hidden,
  barHidden: document.getElementById('replay').hidden, retry: !document.getElementById('journey-retry').hidden, hint: document.getElementById('bare-hint').hidden, play: document.getElementById('replay-play').textContent,
  note: document.getElementById('replay-note').textContent, rule: document.getElementById('replay-rule').textContent, range: document.getElementById('replay-range').value, say: document.getElementById('replay-say').textContent }));
const switchOn = async (page, want = 'ready') => { await page.click('#tgl-journey'); await page.waitForFunction(w => ME.journey.state().status === w, want, { timeout: 30000 }); };
const coordsOf = (page, lat, lon) => page.evaluate(([la, lo, alt]) => { const c = ME.globe().getCoords(la, lo, alt); return [c.x, c.y, c.z]; }, [lat, lon, 0.004]);
const near = (a, b) => a && b && a.every((v, i) => Math.abs(v - b[i]) < 1e-3);

(async () => {
  await new Promise(r => srv.listen(0, r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const EMPTY = 'No layer data is drawn on the globe right now.';
  const NOTE = 'Replay: recorded 25 Oct 2007 to 22 Oct 2008. Other layers on the globe retain their own dates and times; they are not matched to this journey.';

  // ===== 1. off on load; the switch; what is drawn and said =====
  if (want(1)) { reset(); const { ctx, page, errs, reqs } = await open(browser);
    let s = await state(page);
    ok('1a off on load: switch off, nothing in the scene, no bar, not in the Key', s.sw === 'false' && !s.on && s.scene === 0 && s.barHidden && !s.leg && s.keyN === '0 layers' && s.chip === 'off' && !s.hint, s);
    ok('1b nothing from assets/animals is requested before the switch', S.log.length === 0 && !reqs.some(u => u.includes('/assets/animals/')), S.log);
    ok('1c the Layers panel lists the journey as a dated replay', await page.evaluate(() => [...document.querySelectorAll('#layers-list [data-for]')].some(r => r.dataset.for === '#tgl-journey' && r.textContent.trim() === 'Animal journey — dated replay')));
    const before = reqs.length;
    await switchOn(page); s = await state(page);
    ok('1d the switch fetches the manifest and the display file, once each, and nothing else', S.log.length === 2 && S.log[0].endsWith('zebra-botswana-R1.manifest.json') && S.log[1].endsWith(MANJ.journeys[0].file) && reqs.slice(before).filter(u => !u.startsWith(HUB) && !/nasa\.gov/.test(u)).every(u => u.includes('/assets/animals/')), [S.log, reqs.slice(before)]);
    ok('1e ready: three objects, every fix loaded, marker on the first recorded fix, no line yet', s.status === 'ready' && s.scene === 3 && s.n === N && s.i === 0 && s.objects.fixesShown === 1 && s.objects.lineShown === 0 && s.objects.markerVisible && near(s.objects.marker, await coordsOf(page, D.lat[0], D.lon[0])), s);
    ok('1f the bar gives the replay time and the first recorded fix, to the second, in UTC', s.bar === `Replay time (recorded) ${utc(D.t[0])} · First recorded fix ${utc(D.t[0])}` && /25 Oct 2007 08:01:53 UTC/.test(s.bar), s.bar);
    ok('1g the replay line says other layers are not matched; the rule line states the join rule and whose rule it is', s.note === NOTE && s.rule === 'The line joins recorded fixes. The path between fixes was not recorded. Mother Earth does not join fixes more than 3 hours apart. This is a display rule, not part of the study.', [s.note, s.rule]);
    ok('1h in the Key: one layer, its entry shown, the empty sentence gone; the first-view line gone', s.keyN === '1 layer' && s.leg && !s.none && s.hint && s.sw === 'true' && s.chip === 'replay', s);
    ok('1i the card states the counts, the sample of seven and that uncertainty is not supplied', /13,045 recorded fixes of one animal \(Z3866\), 25 Oct 2007 to 22 Oct 2008\. 7 animals were tracked in this study; 1 is shown\. Not drawn for this animal: 3 fix attempts without a position, 0 flagged by the source\. Location uncertainty: not supplied by the dataset\./.test(s.card), s.card);

    // ----- the marker is on the last recorded fix; only the past is drawn
    const G = D.t.findIndex((v, k) => k && v - D.t[k - 1] === Math.max(...D.t.slice(1).map((x, q) => x - D.t[q])));               // the fix after the longest gap in the record
    for (const [name, tt] of [['between two fixes', D.t[2940] + 1153], ['one second before a fix', D.t[5000] - 1], ['exactly on a fix', D.t[5000]], ['late in the record', D.t[N - 2] + 5],
      ['1 h 1 min 1 s after fix 63, across midnight (GPT\'s case)', D.t[63] + 3661], ['59 s after a fix', D.t[700] + 59], ['exactly 1 min after a fix', D.t[700] + 60], ['one second before the next fix, in the longest gap', D.t[G] - 1], ['exactly 1 h after the fix before the longest gap', D.t[G - 1] + 3600], ['1 h 0 min 1 s into the longest gap', D.t[G - 1] + 3601]]) {
      await page.evaluate(x => ME.journey.seek(x), tt); s = await state(page); const i = lastAt(tt), age = tt - D.t[i];
      ok(`2a ${name}: the marker is on fix ${i}, the last at or before the replay time`, s.i === i && s.fixTime === D.t[i] && near(s.objects.marker, await coordsOf(page, D.lat[i], D.lon[i])) && near(s.objects.marker, s.objects.fixXYZ), [s.i, i, s.objects.marker]);
      ok(`2b ${name}: exactly ${i + 1} fixes and ${joinsTo(D.t, i)} joins are drawn — nothing later`, s.objects.fixesShown === i + 1 && s.objects.lineShown === joinsTo(D.t, i), s.objects);
      const want = `Replay time (recorded) ${utc(tt)} · Last recorded fix ${utc(D.t[i])}` + (age ? `, ${ageWords(age)} earlier` : ', at this time');
      ok(`2c ${name}: the bar is exactly the replay time, the fix time and the age to the second (${age ? ageWords(age) : 'at this time'})`, s.bar === want, [s.bar, want]); }
    ok('2c2 the cases really cross an hour and midnight: fix 63 is 27 Oct 2007 23:00:18 UTC and its case reads 1 h 1 min 1 s; the longest gap is over 2 h', utc(D.t[63]) === '27 Oct 2007 23:00:18 UTC' && utc(D.t[63] + 3661) === '28 Oct 2007 00:01:19 UTC' && ageWords(3661) === '1 h 1 min 1 s' && ageWords(60) === '1 min 0 s' && ageWords(3600) === '1 h 0 min 0 s' && ageWords(176703) === '2 d 1 h 5 min 3 s' && D.t[G] - D.t[G - 1] === 7225, [utc(D.t[63]), D.t[G] - D.t[G - 1]]);
    await page.evaluate(x => ME.journey.seek(x), D.t[100] + 10); s = await state(page);
    ok('2d scrubbing back removes what is now in the future', s.i === 100 && s.objects.fixesShown === 101 && s.objects.lineShown === joinsTo(D.t, 100), s.objects);
    ok('2e the visitor moving the replay is announced once (polite), with the same words as the bar', s.say === s.bar && s.say.length > 20, [s.say, s.bar]);

    // ----- replay does not touch the globe's own time, and asks for nothing
    const head = () => page.evaluate(() => ({ clock: document.getElementById('clock').firstChild.textContent, img: (document.querySelector('.stage').innerText.match(/Imagery[^\n]*/) || [''])[0] }));
    const h0 = await head(), r0 = reqs.length; await page.evaluate(x => ME.journey.seek(x), D.t[9000]); const h1 = await head(), now = new Date().toISOString().slice(11, 19); await page.waitForTimeout(1200); h1.img = (await head()).img;
    ok('3a seeking a year changes neither the header clock (still the real UTC time) nor the imagery label', h1.img === h0.img && /Imagery/.test(h1.img) && Math.abs(Date.parse('2026-01-01T' + h1.clock + 'Z') - Date.parse('2026-01-01T' + now + 'Z')) % 86400e3 <= 3000, [h0, h1, now]);
    ok('3b replay asks the network for nothing', reqs.slice(r0).filter(u => !u.startsWith(HUB)).length === 0, reqs.slice(r0));

    // ----- keyboard
    await page.evaluate(x => ME.journey.seek(x), D.t[200]); await page.focus('#replay-range');
    await page.keyboard.press('ArrowRight'); s = await state(page); ok('4a ArrowRight steps to the next recorded fix exactly', s.i === 201 && s.rt === D.t[201] && s.range === '201', [s.i, s.rt]);
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); s = await state(page); ok('4b ArrowLeft steps back fix by fix', s.i === 199 && s.rt === D.t[199], [s.i, s.rt]);
    await page.keyboard.press('End'); s = await state(page); ok('4c End: the last recorded fix, and the bar says the record ends here', s.i === N - 1 && s.bar === `Replay time (recorded) ${utc(D.t[N - 1])} · Last recorded fix: tracking record ends here, ${utc(D.t[N - 1])}` && s.objects.fixesShown === N && s.objects.lineShown === joinsTo(D.t, N - 1), s.bar);
    await page.keyboard.press('Home'); s = await state(page); ok('4d Home: the first recorded fix', s.i === 0 && s.rt === D.t[0], [s.i]);
    await page.focus('#replay-play'); await page.keyboard.press('Space'); await page.waitForTimeout(700); s = await state(page);
    ok('4e Space on Play starts playback; the button reads Pause and is pressed', s.playing && s.play === 'Pause' && await page.getAttribute('#replay-play', 'aria-pressed') === 'true' && s.rt > D.t[0], s);
    await page.keyboard.press('Enter'); const p1 = await state(page); await page.waitForTimeout(500); s = await state(page);
    ok('4f Enter pauses; the replay time stays where it stopped', !s.playing && s.play === 'Play' && s.rt === p1.rt && s.i === lastAt(s.rt), [p1.rt, s.rt]);

    // ----- playback: marker only ever on a recorded fix; stops at the last fix
    await page.evaluate(() => { window.__bad = 0; window.__seen = 0; const tick = () => { const s = ME.journey.state(); if (s.objects && s.objects.markerVisible) { window.__seen++; const a = s.objects.marker, b = s.objects.fixXYZ; if (s.i !== ME.journey.fixAt(s.rt) || a.some((v, k) => Math.abs(v - b[k]) > 1e-4)) window.__bad++; } window.__raf = requestAnimationFrame(tick); }; tick(); });
    await page.evaluate(x => { ME.journey.seek(x); ME.journey.setSpeed(86400); ME.journey.play(); }, D.t[3000]); await page.waitForTimeout(3000); s = await state(page);
    const adv = (s.rt - D.t[3000]) / 86400;
    ok('5a at 1 day a second, three seconds of playback advance the replay about three days', s.playing && adv > 1.5 && adv < 3.6, adv);
    ok('5b during playback the marker was on the last recorded fix in every frame sampled', (await page.evaluate(() => [window.__bad, window.__seen])).every((v, k) => k ? v > 5 : v === 0), await page.evaluate(() => [window.__bad, window.__seen]));
    await page.evaluate(x => { ME.journey.pause(); ME.journey.seek(x); ME.journey.setSpeed(604800); ME.journey.play(); }, D.t[N - 1] - 3 * 86400);
    await page.waitForFunction(() => !ME.journey.state().playing, null, { timeout: 15000 }).catch(() => { }); await page.waitForTimeout(600); s = await state(page);
    ok('5c playback stops at the last recorded fix: paused, marker there, the bar says the record ends', !s.playing && s.play === 'Play' && s.rt === D.t[N - 1] && s.i === N - 1 && /tracking record ends here/.test(s.bar) && /tracking record ends here/.test(s.say), s);
    await page.evaluate(() => cancelAnimationFrame(window.__raf));

    // ----- the Sky zoom-out view
    await page.evaluate(x => { ME.journey.seek(x); ME.journey.play(); }, D.t[4000]); await page.waitForTimeout(300);
    await page.evaluate(() => document.body.classList.add('sky-zoom')); await page.waitForTimeout(400); s = await state(page); const skyRt = s.rt;
    ok('6a Sky view: playback pauses, the journey is hidden, the bar is hidden, it leaves the Key, the card says so', !s.playing && !s.drawn && !s.objects.markerVisible && s.barHidden && !s.leg && s.keyN === '0 layers' && /Hidden while the zoom-out view is open\. Paused at the same replay time\./.test(s.card) && s.sw === 'true', s);
    await page.waitForTimeout(600); ok('6b the replay time does not move while hidden', (await state(page)).rt === skyRt);
    await page.evaluate(() => document.body.classList.remove('sky-zoom')); await page.waitForTimeout(400); s = await state(page);
    ok('6c leaving Sky view restores it, paused, at the same replay time, back in the Key', !s.playing && s.drawn && s.rt === skyRt && s.i === lastAt(skyRt) && !s.barHidden && s.leg && s.keyN === '1 layer' && s.objects.fixesShown === s.i + 1, s);

    // ----- a hidden browser tab
    await page.evaluate(() => ME.journey.play()); await page.waitForTimeout(300);
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }); s = await state(page); const hidRt = s.rt;
    await page.waitForTimeout(500); const s2 = await state(page);
    ok('7a a hidden tab pauses playback and keeps the replay as it was', !s.playing && s2.rt === hidRt && s2.scene === 3 && s2.on, [s, s2.rt]);
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); }); await page.waitForTimeout(300); s = await state(page);
    ok('7b coming back does not start playback by itself', !s.playing && s.rt === hidRt, s);

    // ----- off
    await page.evaluate(() => ME.journey.play()); await page.waitForTimeout(200); await page.click('#tgl-journey'); await page.waitForTimeout(300); s = await state(page);
    ok('8a off: playback stopped, every object removed, the bar gone, out of the Key, the first-view line back', !s.on && !s.playing && s.scene === 0 && s.objects === null && s.barHidden && !s.leg && s.keyN === '0 layers' && !s.none === false && !s.hint && s.sw === 'false' && s.chip === 'off' && s.card === 'Off. Switch on to load the recorded journey.', s);
    ok('8b no page error in the whole run', errs.length === 0, errs);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.ME && ME.journey); await page.waitForTimeout(1500); s = await state(page);
    ok('8c a reload starts bare: the journey is off and nothing is drawn', !s.on && s.scene === 0 && s.sw === 'false' && s.barHidden, s);
    // on, reload while on
    await switchOn(page); await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.ME && ME.journey); await page.waitForTimeout(1500); s = await state(page);
    ok('8d a reload while it was on also starts bare', !s.on && s.scene === 0 && s.sw === 'false', s);
    // switch by keyboard
    await page.focus('#tgl-journey'); await page.keyboard.press('Enter'); await page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 30000 });
    ok('8e the switch works from the keyboard', (await state(page)).sw === 'true');
    await ctx.close(); }

  // ===== 2. off while loading; rapid switching =====
  if (want(2)) { reset(); const { ctx, page } = await open(browser);
    const aborted = []; page.on('requestfailed', r => { if (r.url().includes('/assets/animals/')) aborted.push([r.url().split('/').pop(), r.failure() && r.failure().errorText]); });
    let release; S.hold = new Promise(r => { release = r; });
    await page.click('#tgl-journey'); await page.waitForFunction(() => ME.journey.state().status === 'loading'); await page.waitForFunction(() => true); while (S.log.length < 2) await page.waitForTimeout(50); let s = await state(page);
    ok('9a while loading: busy, nothing drawn, not in the Key', s.status === 'loading' && s.scene === 0 && !s.leg && s.card === 'Loading the journey file…' && await page.getAttribute('#tgl-journey', 'aria-busy') === 'true', s);
    await page.click('#tgl-journey'); await page.waitForTimeout(600);
    ok('9b off while the display file is on its way: the request itself is aborted (before the server answers)', aborted.length === 1 && aborted[0][0] === MANJ.journeys[0].file && /ERR_ABORTED/.test(aborted[0][1]), aborted);
    release(); S.hold = null; await page.waitForTimeout(1200); s = await state(page);
    ok('9b2 and nothing is drawn afterwards', !s.on && s.scene === 0 && s.barHidden && !s.leg && s.status === 'off', s);
    // the same while the manifest is on its way
    aborted.length = 0; S.log = []; let rel2; S.holdManifest = new Promise(r => { rel2 = r; }); await page.click('#tgl-journey'); while (S.log.length < 1) await page.waitForTimeout(50); await page.click('#tgl-journey'); await page.waitForTimeout(600);
    ok('9b3 off while the manifest is on its way: that request is aborted, and the display file is never asked for', aborted.length === 1 && /manifest\.json$/.test(aborted[0][0]) && /ERR_ABORTED/.test(aborted[0][1]) && S.log.length === 1, [aborted, S.log]);
    rel2(); S.holdManifest = null; await page.waitForTimeout(800); s = await state(page); ok('9b4 and nothing is drawn afterwards', !s.on && s.scene === 0 && S.log.length === 1, [s, S.log]);
    // a newer load aborts the older one's request: on (held), off, on again
    aborted.length = 0; S.log = []; let rel3; S.hold = new Promise(r => { rel3 = r; }); await page.click('#tgl-journey'); while (S.log.length < 2) await page.waitForTimeout(50); await page.click('#tgl-journey'); S.hold = null; await page.click('#tgl-journey');
    await page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 30000 }); rel3(); await page.waitForTimeout(800); s = await state(page);
    ok('9b5 on again straight away: the first request was aborted, the second load drew one set of objects', aborted.length === 1 && s.scene === 3 && s.on && s.i === 0, [aborted, s.scene]);
    await page.click('#tgl-journey'); await page.waitForTimeout(300);
    // an answer that arrives although the request was told to stop (here: a fetch that ignores the stop signal) is refused
    await page.evaluate(() => { const f = window.fetch; window.__late = 0; window.fetch = (u, o) => f(u, { ...o, signal: undefined }).then(r => { if (String(u).includes('assets/animals/') && !String(u).includes('manifest')) window.__late++; return r; }); });
    S.log = []; let rel4; S.hold = new Promise(r => { rel4 = r; }); await page.click('#tgl-journey'); while (S.log.length < 2) await page.waitForTimeout(50); await page.click('#tgl-journey'); rel4(); S.hold = null;
    await page.waitForFunction(() => window.__late === 1, null, { timeout: 15000 }).catch(() => { }); await page.waitForTimeout(1200); s = await state(page);
    ok('9e the display file arrives after off (the answer really came back) and is refused: nothing drawn, still off', await page.evaluate(() => window.__late) === 1 && !s.on && s.scene === 0 && s.barHidden && !s.leg && s.status === 'off', [await page.evaluate(() => window.__late), s]);
    await page.evaluate(() => location.reload()); await page.waitForFunction(() => window.ME && ME.journey && ME.globe && ME.globe() && window.__late === undefined, null, { timeout: 30000 }); await page.waitForTimeout(1500); reset();
    await page.click('#tgl-journey'); await page.click('#tgl-journey'); await page.click('#tgl-journey'); await page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 30000 }); await page.waitForTimeout(800); s = await state(page);
    ok('9c on, off, on in quick succession: on, one set of three objects', s.on && s.scene === 3 && s.status === 'ready' && s.i === 0, s);
    await page.click('#tgl-journey'); await page.click('#tgl-journey'); await page.click('#tgl-journey'); await page.waitForTimeout(1500); s = await state(page);
    ok('9d ending on off after quick switching leaves nothing', !s.on && s.scene === 0 && s.barHidden, s);
    await ctx.close(); }

  // ===== 3. files that cannot be verified; failed loads =====
  if (want(3)) { const UNV = 'Journey file could not be verified. Nothing is drawn.';
    const cases = [
      ['a display file with one digit changed', () => { const b = Buffer.from(DISP); const k = b.indexOf(Buffer.from('"lat":[')) + 12; b[k] = b[k] === 0x31 ? 0x32 : 0x31; S.display = b; }],
      ['a display file cut short', () => { S.display = DISP.subarray(0, DISP.length - 500); }],
      ['a manifest that differs from the pinned one', () => { S.manifest = Buffer.from(MAN.toString().replace('"animals_sampled": 7', '"animals_sampled": 8').replace('"animals_sampled":7', '"animals_sampled":8')); }],
      ['a file with matching checksums whose fix times go backwards', () => { const t0 = 1193299200; S.fx = fixture([t0, t0 + 3600, t0 + 1800, t0 + 7200]); }],
      ['a file with matching checksums and a coordinate outside the study area', () => { const f = fixture(); const d = { ...f.d, lat: f.d.lat.map((v, i) => i === 2 ? 51.5 : v) }; const db = Buffer.from(JSON.stringify(d)); const m = JSON.parse(f.manifest); m.journeys[0].bytes = db.length; m.journeys[0].sha256 = sha(db); S.fx = { manifest: Buffer.from(JSON.stringify(m)), display: db }; }],
      ['a file with matching checksums and fewer fixes than the manifest says', () => { const f = fixture(); const m = JSON.parse(f.manifest); m.journeys[0].fixes = 7; S.fx = { manifest: Buffer.from(JSON.stringify(m)), display: f.display }; }],
    ];
    for (const [name, prep] of cases) { reset(); prep(); if (S.manifest && sha(S.manifest) === PIN) { ok('10 fixture really differs: ' + name, false); continue; }
      const { ctx, page } = await open(browser); await page.click('#tgl-journey'); await page.waitForFunction(() => ['unverified', 'failed', 'ready'].includes(ME.journey.state().status), null, { timeout: 30000 }); await page.waitForTimeout(300); const s = await state(page);
      ok(`10 ${name}: nothing is drawn and the card says it could not be verified`, s.status === 'unverified' && s.card === UNV && s.scene === 0 && s.barHidden && !s.leg && s.keyN === '0 layers' && !s.retry && s.chip === 'not drawn' && s.sw === 'true', s); await ctx.close(); }
    reset(); S.displayStatus = 503; const { ctx, page } = await open(browser); await page.click('#tgl-journey'); await page.waitForFunction(() => ME.journey.state().status === 'failed', null, { timeout: 30000 }); let s = await state(page);
    ok('11a a failed load: nothing drawn, says so, offers Retry', s.card === 'The journey file could not be loaded. Nothing is drawn.' && s.scene === 0 && s.retry && s.barHidden && !s.leg, s);
    await page.click('#journey-retry', { timeout: 3000 }).catch(() => { }); await page.waitForTimeout(800); s = await state(page); ok('11b Retry while it still fails: the same state, Retry still offered', s.status === 'failed' && s.retry && s.scene === 0, s);
    S.displayStatus = 200; await page.focus('#journey-retry'); await page.keyboard.press('Enter'); await page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 10000 }).catch(() => { }); s = await state(page);
    ok('11c Retry (from the keyboard) once the file is back: drawn, bar shown, Retry gone', s.scene === 3 && !s.retry && !s.barHidden && s.leg && s.i === 0 && s.note === NOTE, s);
    await ctx.close();
    reset(); S.manifestStatus = 404; { const { ctx, page } = await open(browser); await page.click('#tgl-journey'); await page.waitForFunction(() => ME.journey.state().status !== 'loading', null, { timeout: 30000 }); const s = await state(page);
      ok('11d a missing manifest: failed, nothing drawn, Retry offered', s.status === 'failed' && s.scene === 0 && s.retry, s); await ctx.close(); } }

  // ===== 4. the line rule (made-up file; its checksum pinned in place of the real one for this step only) =====
  if (want(4)) { reset(); S.fx = fixture(); const T = S.fx.d.t; const { ctx, page } = await open(browser); await switchOn(page); await page.evaluate(x => ME.journey.seek(x), T[T.length - 1]); let s = await state(page);
    ok('12a gaps of 1 h, exactly 3 h, 3 h 1 s, 1 h, 5 h: three joins — exactly 3 h is joined, 3 h 1 s and 5 h are not', s.objects.segments === 3 && s.objects.lineShown === 3 && s.objects.fixesShown === 6, s.objects);
    await page.evaluate(x => ME.journey.seek(x), T[2] + 60); s = await state(page);
    ok('12b before the 3 h 1 s gap closes: two joins drawn, and the bar says no fix was recorded for that long', s.objects.lineShown === 2 && s.i === 2 && s.bar.endsWith(', 1 min 0 s earlier · No fix was recorded for 3 h 0 min 1 s after it'), [s.objects, s.bar]);
    await page.evaluate(x => ME.journey.seek(x), T[3]); s = await state(page);
    ok('12c on the fix after the gap: the fix is drawn, still two joins (no line across the gap)', s.i === 3 && s.objects.fixesShown === 4 && s.objects.lineShown === 2 && !/No fix was recorded/.test(s.bar), [s.objects, s.bar]);
    await page.evaluate(x => ME.journey.seek(x), T[4] + 9000); s = await state(page);
    ok('12d inside the 5 h gap: marker stays on the last recorded fix, its age grows, the gap is stated', s.i === 4 && s.objects.lineShown === 3 && s.bar.endsWith(', 2 h 30 min 0 s earlier · No fix was recorded for 5 h 0 min 0 s after it') && near(s.objects.marker, s.objects.fixXYZ), s.bar);
    await ctx.close();
    // ages and gaps longer than a day (made-up file: 1 h, then 2 d 1 h 5 min 3 s)
    reset(); const t0 = 1193299200; S.fx = fixture([t0, t0 + 3600, t0 + 3600 + 176703]); const c2 = await open(browser); await switchOn(c2.page);
    for (const [age, name] of [[86399, 'one second short of a day'], [86400, 'exactly a day'], [90061, 'a day, an hour, a minute and a second'], [176702, 'one second before the next fix']]) { await c2.page.evaluate(x => ME.journey.seek(x), t0 + 3600 + age); const b = (await state(c2.page)).bar;
      const want = `Replay time (recorded) ${utc(t0 + 3600 + age)} · Last recorded fix ${utc(t0 + 3600)}, ${ageWords(age)} earlier · No fix was recorded for 2 d 1 h 5 min 3 s after it`;
      ok(`12e ${name}: the age is exact to the second (${ageWords(age)}) and the gap is stated to the second`, b === want, [b, want]); }
    ok('12f the day cases read as intended', ageWords(86399) === '23 h 59 min 59 s' && ageWords(86400) === '1 d 0 h 0 min 0 s' && ageWords(90061) === '1 d 1 h 1 min 1 s');
    await c2.ctx.close(); }

  // ===== 5. UTC whatever the visitor's zone =====
  if (want(5)) for (const tz of ['Pacific/Auckland', 'America/Los_Angeles']) { reset(); const { ctx, page } = await open(browser, undefined, '', { timezoneId: tz, locale: 'en-US' }); await switchOn(page); await page.evaluate(x => ME.journey.seek(x), D.t[2940] + 1153); const s = await state(page);
    ok(`13 visitor in ${tz}: the same UTC times are printed`, s.bar === `Replay time (recorded) ${utc(D.t[2940] + 1153)} · Last recorded fix ${utc(D.t[2940])}, 19 min 13 s earlier` && s.note === NOTE, s.bar); await ctx.close(); }

  // ===== 6. the deep link from the Animals page =====
  if (want(6)) { reset(); const { ctx, page } = await open(browser, undefined, '#journey=zebra-botswana-Z3866'); await page.waitForTimeout(800);
    const r = await page.evaluate(() => ({ panel: !document.getElementById('layers-panel').hidden, focus: document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.for : null, chosen: !document.getElementById('journey-chosen').hidden, s: ME.journey.state(), scene: ME.journey.sceneCount(), sw: document.getElementById('tgl-journey').getAttribute('aria-checked') }));
    ok('14a the link opens Layers with the journey row focused and a note on its card', r.panel && r.focus === '#tgl-journey' && r.chosen, r);
    ok('14b the link switches nothing on and requests no journey file', !r.s.on && r.scene === 0 && r.sw === 'false' && S.log.length === 0, [r, S.log]);
    await page.keyboard.press('Enter'); await page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 10000 }).catch(() => { }); ok('14c pressing Enter on the focused row switches it on', (await state(page)).scene === 3);
    await ctx.close();
    reset(); const o = await open(browser); const r2 = await o.page.evaluate(() => ({ panel: !document.getElementById('layers-panel').hidden, chosen: !document.getElementById('journey-chosen').hidden })); ok('14d without the link: Layers stays closed, no note', !r2.panel && !r2.chosen, r2); await o.ctx.close(); }

  // ===== 7. layout: the bar covers no other control; nothing overflows; targets 44 px =====
  if (want(7)) for (const [w, h] of [[1280, 860], [1150, 800], [900, 760], [430, 900], [390, 844], [360, 740]]) { reset(); const { ctx, page } = await open(browser, { width: w, height: h }); await switchOn(page); await page.click('#replay-goto'); await page.evaluate(x => ME.journey.seek(x), D.t[N - 1]); await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const R = e => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, b: b.bottom, w: b.width, h: b.height }; }, vis = e => e && !e.hidden && e.offsetParent !== null && e.getBoundingClientRect().width > 0;
      const bar = R(document.getElementById('replay')), hit = (a, b) => a.x < b.r - 0.5 && b.x < a.r - 0.5 && a.y < b.b - 0.5 && b.y < a.b - 0.5;
      const others = ['layers-btn', 'key-btn', 'legend', 'persist', 'zoom-ui'].map(id => [id, document.getElementById(id)]).concat([['imagery label', document.querySelector('.imglabel, .img-label, #imagery-label')]]).filter(([, e]) => vis(e)).map(([id, e]) => [id, hit(bar, R(e))]);
      const ctl = [...document.querySelectorAll('#replay button, #replay select, #replay input')].map(e => R(e));
      const cv = R(ME.globe().renderer().domElement), free = bar.y - cv.y >= cv.b - bar.b ? [cv.y, bar.y] : [bar.b, cv.b];
      let mk = null; ME.globe().scene().traverse(o => { if (o.__journey === 'marker') mk = o; }); const q = mk.position.clone(); mk.parent.localToWorld(q); q.project(ME.globe().camera());
      const sc = { x: cv.x + (q.x + 1) / 2 * cv.w, y: cv.y + (1 - q.y) / 2 * cv.h };
      return { bar, others, ctlMin: Math.min(...ctl.map(c => c.h)), ctlIn: ctl.every(c => c.x >= bar.x - 0.5 && c.r <= bar.r + 0.5), ov: document.documentElement.scrollWidth - innerWidth, inView: bar.x >= 0 && bar.r <= innerWidth + 0.5, free, sc, text: document.getElementById('replay-now').scrollWidth <= document.getElementById('replay-now').clientWidth + 1 }; });
    ok(`15a ${w} px: the bar is on screen, inside the page width, with no horizontal overflow`, r.inView && r.ov <= 0 && r.bar.w > 200 && r.text, r);
    ok(`15b ${w} px: the bar covers no other control (${r.others.map(o => o[0]).join(', ')})`, r.others.length >= 2 && r.others.every(o => !o[1]), r.others);
    ok(`15c ${w} px: every bar control is at least 44 px high and inside the bar`, r.ctlMin >= 44 && r.ctlIn, r);
    ok(`15d ${w} px: after "Journey area" the marker is on screen in the part of the globe the bar leaves free`, r.sc.y > r.free[0] && r.sc.y < r.free[1] && r.sc.x > 0 && r.sc.x < w, [r.sc, r.free]);
    await ctx.close(); }

  // ===== 8. the Animals page and the tab on every page =====
  if (want(8)) { reset(); const ctx = await ctxFor(browser, { width: 1280, height: 860 }), page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/animals.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => !document.getElementById('an-facts').hidden, null, { timeout: 15000 });
    const r = await page.evaluate(() => { const t = id => document.getElementById(id).textContent; return { state: t('an-state'), animals: t('an-animals'), shown: t('an-shown'), period: t('an-period'), notdrawn: t('an-notdrawn'), unc: t('an-unc'), rule: t('an-rule'), doi: document.querySelector('#an-doi a').href, lic: t('an-lic'), cite: t('an-cite'), cons: t('an-cons'), pop: t('an-pop'), sample: t('an-sample'), go: document.getElementById('an-go').getAttribute('href'), goText: t('an-go'),
      tab: document.querySelector('nav.tabs a[aria-current="page"]').textContent, head: document.querySelector('.top .promise').textContent, title: document.title, menu: document.querySelector('#menu-list a[aria-current="page"]').textContent, all: document.querySelector('main').innerText, scripts: [...document.scripts].map(s => s.src.split('/').pop().split('?')[0]) }; });
    ok('16a the study card is filled from the verified manifest: animals, shown, period, not drawn', r.state === 'Study file verified against its checksum.' && r.animals === '7 animals were tracked in this study. This is a sample size, not a population estimate.' && r.shown === '1 animal: Z3866, 13,045 recorded fixes.' && r.period === 'First recorded fix 25 Oct 2007 08:01:53 UTC. Last recorded fix 22 Oct 2008 23:00:45 UTC: the tracking record ends there.' && r.notdrawn === 'For this animal: 3 fix attempts without a position and 0 fixes flagged by the source. In the whole study: 17 and 1.', r);
    ok('16b uncertainty, line rule, dataset link, licence and the citation as the repository gives it', r.unc === 'Location uncertainty: not supplied by the dataset.' && /Mother Earth does not join fixes more than 3 hours apart\. This is a display rule, not part of the study\. Gaps longer than the rule for this animal: 0\./.test(r.rule) && r.doi === 'https://doi.org/10.5441/001/1.f3550b4f' && /^CC0 1\.0 Universal/.test(r.lic) && r.cite === MANJ.citation_as_given, r);
    ok('16c conservation and population are "Not available yet"; the tag count is called a sample size', r.cons === 'Not available yet. No assessment source has been reviewed for display on Mother Earth.' && r.pop === 'Not available yet. No population series has been reviewed.' && r.sample === '7 animals were tracked in this study. This is a sample size, not a population estimate.', [r.cons, r.pop, r.sample]);
    ok('16d nothing on the page offers a population figure, a trend or a status', !/population (of|is|trend|size:)|\bincreasing\b|\bdecreasing\b|\bendangered\b|\bvulnerable\b|\bleast concern\b|Population: \d/i.test(r.all), r.all.match(/.{0,40}(population (of|is|trend)|Population: \d).{0,40}/i));
    ok('16e the link is "Choose this journey on Earth now" and points at the switch, not at a drawn journey', r.goText === 'Choose this journey on Earth now' && r.go === 'index.html#journey=zebra-botswana-Z3866', [r.goText, r.go]);
    ok('16f the Animals tab and Menu entry are marked current; the page loads neither the globe nor the journey file', r.tab === 'Animals' && r.menu === 'Animals' && r.head === 'Animals — recorded journeys' && r.title === 'Mother Earth — Animals' && r.scripts.join() === 'animals.js' && S.log.length === 1 && S.log[0].endsWith('.manifest.json') && errs.length === 0, [r.tab, r.menu, r.scripts, S.log, errs]);
    await page.click('#an-go'); await page.waitForFunction(() => window.ME && ME.journey && !document.getElementById('layers-panel').hidden, null, { timeout: 30000 }).catch(() => { });
    ok('16g following the link lands on Earth now with the switch shown and off', await page.evaluate(() => location.pathname.endsWith('index.html') && !document.getElementById('layers-panel').hidden && document.getElementById('tgl-journey').getAttribute('aria-checked') === 'false' && ME.journey.sceneCount() === 0));
    await ctx.close();
    // a manifest that fails its checksum: no figure
    reset(); S.manifest = Buffer.from(MAN.toString().replace(/"animals_sampled": ?7/, m => m.replace('7', '70')));
    const c2 = await ctxFor(browser, { width: 1280, height: 860 }), p2 = await c2.newPage(); await p2.goto(BASE + '/animals.html', { waitUntil: 'domcontentloaded' }); await p2.waitForFunction(() => document.getElementById('an-state').textContent !== 'Checking the study file…', null, { timeout: 15000 });
    const b = await p2.evaluate(() => ({ state: document.getElementById('an-state').textContent, hidden: document.getElementById('an-facts').hidden, text: document.querySelector('main').innerText }));
    ok('16h a manifest that fails its checksum: "could not be verified", the table stays hidden, no changed figure appears', sha(S.manifest) !== PIN && b.state === 'Study details could not be verified. No figure is shown.' && b.hidden && !/\b70\b/.test(b.text), b.state);
    S.manifest = null; S.manifestStatus = 500; await p2.reload({ waitUntil: 'domcontentloaded' }); await p2.waitForFunction(() => document.getElementById('an-state').textContent !== 'Checking the study file…', null, { timeout: 15000 });
    ok('16i a manifest that cannot be loaded: says so, the table stays hidden', await p2.evaluate(() => document.getElementById('an-state').textContent === 'Study details could not be loaded. No figure is shown.' && document.getElementById('an-facts').hidden));
    await c2.close(); }
  // tabs and overflow on every page at phone and desktop widths
  if (want(9)) for (const w of [360, 390, 430, 480, 481, 721, 760, 761, 768, 1140, 1280]) { reset(); const ctx = await ctxFor(browser, { width: w, height: 800 });
    for (const pg of ['index.html', 'timeline.html', 'moon.html', 'sun.html', 'animals.html', 'sources.html']) { const page = await ctx.newPage(); await page.goto(BASE + '/' + pg, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(pg === 'animals.html' ? 900 : 1800);
      const r = await page.evaluate(() => { const tabs = [...document.querySelectorAll('nav.tabs a')].map(a => { const b = a.getBoundingClientRect(); return { t: a.textContent, x: b.x, y: Math.round(b.y), r: b.right, h: b.height, clip: a.scrollWidth > a.clientWidth + 1 }; });
        return { tabs, names: tabs.map(t => t.t).join('|'), rows: new Set(tabs.map(t => t.y)).size, minH: Math.min(...tabs.map(t => t.h)), inside: tabs.every(t => t.x >= -0.5 && t.r <= innerWidth + 0.5), clip: tabs.some(t => t.clip), ov: document.documentElement.scrollWidth - innerWidth,
          menu: [...document.querySelectorAll('#menu-list a')].map(a => a.textContent).join('|'), href: document.querySelector('nav.tabs a[data-view="animals"]') && document.querySelector('nav.tabs a[data-view="animals"]').getAttribute('href') }; });
      ok(`17a ${pg} at ${w} px: five tabs with Animals last, in one row, on screen, not clipped, ${w <= 720 ? 44 : 36} px high`, r.names === 'Earth now|Timeline|Moon|Sun|Animals' && r.rows === 1 && r.inside && !r.clip && r.minH >= (w <= 720 ? 44 : 36) && r.href === 'animals.html', r);
      ok(`17b ${pg} at ${w} px: Animals is in the Menu and the page has no horizontal overflow`, /\|Sun\|Animals\|Sources & Details$/.test(r.menu) && r.ov <= 0, [r.menu, r.ov]);
      await page.close(); }
    await ctx.close(); }

  // ===== 11. other layers are left as they were (J8d) =====
  if (want(11)) { reset(); const AT = new Date(Date.now() - 20 * 60e3).toISOString(), H = { 'access-control-allow-origin': '*' };
    const OCSV = fs.readFileSync('/home/claude/fixtures/orbital.csv', 'utf8'), OMETA = JSON.parse(fs.readFileSync('/home/claude/fixtures/orbital-meta.json', 'utf8'));
    const { ctx, page } = await open(browser, undefined, '', {}, async c => {   // two layers that really draw: aircraft counts (in the Key) and satellites
      await c.route(HUB + '/cells/opensky', r => r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify({ layer: 'opensky', schema_version: 1, source_status: 'ok', retrieved_at: AT, window_end: AT, position_age_cutoff_s: 300, stale_after_s: 10800, position_precision_deg: 0.01, cells: { '30_50': { count: 12 }, '31_50': { count: 3 }, '14_49': { count: 1 } }, record_fields: [], records: [] }) }));
      await c.route(HUB + '/snapshot/orbital', r => r.fulfill({ status: 200, contentType: 'application/json', headers: H, body: JSON.stringify(OMETA) }));
      await c.route(HUB + '/elements/orbital', r => r.fulfill({ status: 200, contentType: 'text/csv', body: OCSV, headers: { ...H, 'X-Elements-SHA256': OMETA.elements.sha256, 'Access-Control-Expose-Headers': 'X-Elements-SHA256' } })); });
    for (const id of ['#tgl-air', '#orb-tgls [data-g="payload"]', '#tgl-night']) { await page.evaluate(q => { const e = document.querySelector(q); if (e) e.click(); }, id); await page.waitForTimeout(2500); }
    await page.evaluate(() => { const b = document.getElementById('key-btn'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await page.waitForTimeout(300);
    const snap = () => page.evaluate(() => { let n = 0; ME.globe().scene().traverse(o => { if (!o.__journey) n++; });
      return { sw: [...document.querySelectorAll('[role="switch"]')].filter(e => e.id !== 'tgl-journey' && e.dataset.for !== '#tgl-journey').map(e => (e.id || e.dataset.g || e.dataset.for || '') + '=' + e.getAttribute('aria-checked')).join(' '),
        key: [...document.querySelectorAll('#leg-line .lg')].filter(e => e.id !== 'leg-journey').map(e => e.id + (e.hidden ? ':hidden' : ':shown')).join(' '), keyOpen: document.getElementById('key-btn').getAttribute('aria-expanded'),
        drawn: 'aircraft=' + !!(ME.aircraft && ME.aircraft.drawn && ME.aircraft.drawn()), scene: n, layersOpen: !document.getElementById('layers-panel').hidden, clock: document.getElementById('clock').firstChild.textContent.length, img: (document.querySelector('.stage').innerText.match(/Imagery[^\n]*/) || [''])[0] }; });
    const a0 = await snap(), n0 = (a0.sw.match(/=true/g) || []).length, k0 = await page.evaluate(() => document.getElementById('key-n').textContent);
    ok('19a set-up: other layers are switched on, one is drawn and shown in the Key, before the journey is touched', n0 >= 2 && /leg-aircraft:shown/.test(a0.key) && /aircraft=true/.test(a0.drawn) && parseInt(k0, 10) >= 1, [a0.sw, a0.key, a0.drawn, k0]);
    await switchOn(page); await page.evaluate(x => { ME.journey.seek(x); ME.journey.play(); }, D.t[3000]); await page.waitForTimeout(800); const a1 = await snap(), k1 = await page.evaluate(() => document.getElementById('key-n').textContent);
    ok('19b journey on and playing: every other switch, Key entry, drawing, the open Key and the imagery label are as they were; the Key count is one higher', JSON.stringify(a1) === JSON.stringify(a0) && parseInt(k1, 10) === parseInt(k0, 10) + 1, [a0, a1, k0, k1]);
    await page.click('#tgl-journey'); await page.waitForTimeout(500); const a2 = await snap(), k2 = await page.evaluate(() => document.getElementById('key-n').textContent);
    ok('19c journey off: the same again, and the Key count is back', JSON.stringify(a2) === JSON.stringify(a0) && k2 === k0, [a0, a2, k0, k2]);
    await ctx.close(); }

  // ===== 10. leaving the page and coming Back (real navigation; a browser allowed to keep pages for Back) =====
  if (want(10)) { const b2 = await chromium.launch({ ignoreDefaultArgs: ['--disable-back-forward-cache'], args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-features=BackForwardCache'] });
    const why = []; const fresh = async () => { reset(); S.keepable = true; const o = await open(b2); const cdp = await o.ctx.newCDPSession(o.page); await cdp.send('Page.enable'); cdp.on('Page.backForwardCacheNotUsed', e => why.push(...(e.notRestoredExplanations || []).map(x => x.reason))); await o.page.evaluate(() => { window.__shows = []; window.__mark = Math.random(); window.addEventListener('pageshow', e => window.__shows.push(e.persisted)); }); return o; };
    const back = async page => { await page.goBack({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.ME && ME.journey && ME.globe && ME.globe(), null, { timeout: 30000 }); await page.waitForTimeout(1500);
      return page.evaluate(() => ({ kept: window.__mark !== undefined && Array.isArray(window.__shows) && window.__shows.includes(true), sameDoc: window.__mark !== undefined })); };
    const bare = s => !s.on && s.status === 'off' && s.scene === 0 && s.sw === 'false' && s.barHidden && !s.leg && s.keyN === '0 layers' && !s.playing;
    // a) journey ready and playing; follow the Animals tab; Back
    { const { ctx, page } = await fresh(); await switchOn(page); await page.evaluate(x => { ME.journey.seek(x); ME.journey.play(); }, D.t[3000]); await page.waitForTimeout(300);
      await page.click('nav.tabs a[data-view="animals"]'); await page.waitForURL(/animals\.html/); await page.waitForTimeout(800);
      const how = await back(page), s = await state(page); console.log(`      note 18a: Back ${how.kept ? 'RESTORED THE KEPT PAGE (back/forward cache; pageshow persisted = true)' : how.sameDoc ? 'kept the document without a persisted pageshow' : 'loaded the page afresh (the browser did not keep it)'}${why.length ? '; the browser\'s stated reasons: ' + [...new Set(why)].join(', ') : ''}`);
      ok(`18a journey playing → Animals tab → Back: the page is bare (${how.kept ? 'restored from the back/forward cache' : 'fresh load'})`, bare(s), s);
      // forward to Animals and Back again
      await page.goForward({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(600); const how2 = await back(page); ok(`18a2 forward and Back again: still bare (${how2.kept ? 'restored' : 'fresh load'})`, bare(await state(page)));
      // switching on after coming back works
      await switchOn(page); ok('18a3 after coming back the switch still works: one set of objects', (await state(page)).scene === 3);
      await ctx.close(); }
    // b) while loading
    { const { ctx, page } = await fresh(); const aborted = []; page.on('requestfailed', r => { if (r.url().includes('/assets/animals/')) aborted.push(r.url().split('/').pop()); });
      let release; S.hold = new Promise(r => { release = r; }); await page.click('#tgl-journey'); while (S.log.length < 2) await page.waitForTimeout(50);
      await page.click('nav.tabs a[data-view="animals"]'); await page.waitForURL(/animals\.html/); await page.waitForTimeout(600); release(); S.hold = null;
      const how = await back(page), s = await state(page); console.log(`      note 18b: Back ${how.kept ? 'RESTORED THE KEPT PAGE' : 'loaded the page afresh'}`);
      ok(`18b journey loading → Animals tab → Back: bare (${how.kept ? 'restored' : 'fresh load'})`, bare(s), [s, aborted]);
      await ctx.close(); }
    // c, d) the page-keeping events themselves, sent to the page (this is the code path a kept page takes, whether or not this browser kept it above)
    { const { ctx, page } = await fresh(); await switchOn(page); await page.evaluate(x => { ME.journey.seek(x); ME.journey.play(); }, D.t[3000]); await page.waitForTimeout(200);
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); let s = await state(page);
      ok('18c the page is put away for Back (pagehide, persisted): the journey is switched off there and then', bare(s), s);
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); ok('18c2 and it is bare when shown again', bare(await state(page)));
      await switchOn(page); await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); s = await state(page);
      ok('18d a kept page shown again without having seen pagehide (pageshow, persisted): switched off', bare(s), s);
      if (!(await state(page)).on) await switchOn(page); await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }))); s = await state(page);
      ok('18e an ordinary pageshow (not a kept page) changes nothing', s.on && s.scene === 3, s);
      const ab = []; page.on('requestfailed', r => { if (r.url().includes('/assets/animals/')) ab.push(r.failure() && r.failure().errorText); });
      let release; await page.click('#tgl-journey'); S.log = []; S.hold = new Promise(r => { release = r; }); await page.click('#tgl-journey'); while (S.log.length < 2) await page.waitForTimeout(50);
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); await page.waitForTimeout(500); const abN = ab.length; release(); S.hold = null; await page.waitForTimeout(1200); s = await state(page);
      ok('18f put away while loading: the request is aborted, the journey is off, and nothing is drawn later', bare(s) && abN === 1 && /ERR_ABORTED/.test(ab[0]), [s, ab]);
      await ctx.close(); }
    await b2.close(); }

  await browser.close(); srv.close(); clearTimeout(wd);
  if (BREAK) { const hit = failed.some(n => n.startsWith(EXPECT[BREAK])); console.log(`\n${hit ? 'BREAK CAUGHT' : 'BREAK MISSED'}  ${BREAK}: expected check "${EXPECT[BREAK]}" ${hit ? 'failed' : 'did NOT fail'}; ${fail} checks failed in all: ${failed.map(n => n.split(' ')[0]).join(' ')}`); process.exit(1); }
  console.log(`\n${fail ? 'FAILED' : 'PASSED'}  ${pass} passed, ${fail} failed${ONLY.length ? '  (SECTIONS=' + ONLY.join(',') + ')' : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  suite error: ' + (e && e.stack || e)); process.exit(1); });
