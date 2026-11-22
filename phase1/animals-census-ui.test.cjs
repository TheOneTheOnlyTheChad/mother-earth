/* Mother Earth — Animals page, population counts: the African penguin colony census (animals-tab-rc, stage 3;
 * docs/concepts/ANIMALS-PENGUIN-CHART-PROPOSAL.md rev 1.1, criteria P8 to P26 with GPT's refinements).
 * The REAL page files in Chromium, served by this suite's own server, with the committed census list, manifest and display file.
 * Expected dots, lines, scales, table cells and summaries are worked out HERE from the display file, by this file's own code,
 * separately from the page's.
 * Fixtures: a changed display file or manifest is re-pinned (manifest, list and the list's checksum in the served script), so
 * the page's STRUCTURE check is what refuses it, not a checksum; that substitution is the harness's, stated here.
 * What it does NOT prove: a real phone; a screen reader (roles, names, focus and table structure are read from the page, not
 * heard); performance; print. The journeys are covered by phase1/animals-tab-ui.test.cjs, which is rerun on the same tree.
 * Breaks: BREAK=<name> edits one served file; the suite must then FAIL at the check named in EXPECT ("BREAK CAUGHT").
 * Needs npm playwright (with Chromium) and globe.gl@2.45.0 through NODE_PATH (or ME_GLOBE_JS for the library file).
 * Run: NODE_PATH=<node_modules> node --no-warnings phase1/animals-census-ui.test.cjs      SECTIONS=2,4 runs parts. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const GLOBE_PATH = process.env.ME_GLOBE_JS || (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(d => path.join(d, 'globe.gl', 'dist', 'globe.gl.min.js')).find(f => fs.existsSync(f));
if (!GLOBE_PATH) { console.log('FAIL  globe.gl@2.45.0 not found: set ME_GLOBE_JS or put the package on NODE_PATH'); process.exit(1); }
const GLOBE_JS = fs.readFileSync(GLOBE_PATH, 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const BREAK = process.env.BREAK || '';
const ONLY = (process.env.SECTIONS || '').split(',').filter(Boolean).map(Number), want = n => !ONLY.length || ONLY.includes(n);
let pass = 0, fail = 0; const failed = [];
const ok = (n, c, got) => { if (c) pass++; else { fail++; failed.push(n); console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 1500)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 20 min'); process.exit(1); }, 20 * 60e3);

const JS = 'animals-census.js';
const BREAKS = {
  'no-list-check': [JS, "if (await hex(cb) !== C.CATALOG_SHA256) throw new Unverified('the population list does not match its pinned checksum');", ''],
  'no-manifest-check': [JS, "if (await hex(mb) !== ce.manifest_sha256) throw new Unverified('the manifest does not match the checksum in the population list');", ''],
  'no-display-check': [JS, "if (db.byteLength !== disp.bytes || await hex(db) !== disp.sha256) throw new Unverified('the display file does not match the manifest checksum');", ''],
  'no-structure-check': [JS, "const d = J(db); validate(man, d);", "const d = J(db);"],
  'no-summary-check': [JS, "if (s[f] !== mc[f]) throw new Unverified(`a colony's summary does not match its entries (${f})`);", ''],
  'marker-drawn': [JS, "years.forEach((y, i) => { if (Number.isInteger(v[i])) s.append(sv('circle',", "years.forEach((y, i) => { if (Number.isInteger(v[i]) || v[i] === 'm') s.append(sv('circle',"],
  'bridge-gaps': [JS, "years.forEach((y, i) => { if (Number.isInteger(v[i])) run.push([y, v[i]]); else flush(); }); flush();", "years.forEach((y, i) => { if (Number.isInteger(v[i])) run.push([y, v[i]]); }); flush();"],
  'scale-not-as-printed': [JS, "Y = n => y0 - n / top * (y0 - yTop);", "Y = n => y0 - n / max * (y0 - yTop);"],
  'not-from-zero': [JS, "Y = n => y0 - n / top * (y0 - yTop);", "Y = n => y0 - (n - max / 4) / (top - max / 4) * (y0 - yTop);"],
  'marker-as-number': [JS, "v === null ? W.no_count : v === 'm' ? W.marker : nf(v)); cell.dataset.state", "v === null ? W.no_count : v === 'm' ? '0.1' : nf(v)); cell.dataset.state"],
  'missing-as-zero': [JS, "v === null ? W.no_count : v === 'm' ? W.marker : nf(v)); cell.dataset.state", "v === null ? '0' : v === 'm' ? W.marker : nf(v)); cell.dataset.state"],
  'later-line-everywhere': [JS, "if (mc.later_file_differing_years > 0) notes.append(", "if (true) notes.append("],
  'adds-a-total': [JS, "p('cen-scales', W.scales);", "p('cen-scales', W.scales); p('cen-sumline', 'All colonies, 2019: ' + nf(st.d.colonies.reduce((a, c) => a + (Number.isInteger(c.v[40]) ? c.v[40] : 0), 0)) + ' occupied nest sites.');"],
  'says-current': [JS, "p('cen-archive', W.archive);", "p('cen-archive', 'These counts are current and updated every year.');"],
  // requests no longer aborted AND the token check gone: a superseded answer would then change the card
  'stale-answer-wins': [JS, "      if (tok !== st.tok) return;                                                    // superseded: say and change nothing\n", '', "function cancel() { const r = st.req; st.req = null; st.tok++; if (r) { clearTimeout(r.timer); try { r.c.abort(); } catch (_) { } } }", "function cancel() { const r = st.req; st.req = null; st.tok++; if (r) { clearTimeout(r.timer); } }"],
  'stale-success-wins': [JS, "const db = await get(C.BASE + disp.file); if (tok !== st.tok) return;", "const db = await get(C.BASE + disp.file);", "if (db.byteLength !== disp.bytes || await hex(db) !== disp.sha256) throw new Unverified('the display file does not match the manifest checksum'); if (tok !== st.tok) return;", "if (db.byteLength !== disp.bytes || await hex(db) !== disp.sha256) throw new Unverified('the display file does not match the manifest checksum');",
    "function cancel() { const r = st.req; st.req = null; st.tok++; if (r) { clearTimeout(r.timer); try { r.c.abort(); } catch (_) { } } }", "function cancel() { const r = st.req; st.req = null; st.tok++; if (r) { clearTimeout(r.timer); } }"],
  'no-time-limit': [JS, "R = { c, timer: setTimeout(() => c.abort(), C.WAIT_MS) }; st.req = R;", "R = { c, timer: 0 }; st.req = R;"],
  'focus-not-returned': [JS, "if (b) { b.setAttribute('aria-expanded', 'false'); if (refocus) b.focus(); }", "if (b) { b.setAttribute('aria-expanded', 'false'); }"],
  'no-refit': [JS, "if (typeof ResizeObserver === 'function') new ResizeObserver(fitDetail).observe($('cen-detail')); else window.addEventListener('resize', fitDetail);", ""],
  'refit-one-way': [JS, "if (narrow === st.narrow) return;", "if (narrow === st.narrow || !narrow) return;"],
  'refit-announces': [JS, "st.narrow = narrow; old.replaceWith(st.draw(narrow)); }", "st.narrow = narrow; old.replaceWith(st.draw(narrow)); announce('Chart redrawn.'); }"],
  'refit-reopens': [JS, "st.narrow = narrow; old.replaceWith(st.draw(narrow)); }", "st.narrow = narrow; openDetail(st.open); }"],
  'refit-scrolls': [JS, "st.narrow = narrow; old.replaceWith(st.draw(narrow)); }", "st.narrow = narrow; old.replaceWith(st.draw(narrow)); box.scrollIntoView(); }"],
  'pagehide-keeps-loading': [JS, "window.addEventListener('pagehide', () => { if (st.req) { cancel();", "window.addEventListener('pagehide', () => { if (false) { cancel();"],
};
// EDIT=no-abort is not a break: requests are no longer aborted, and section 5 must still pass apart from the checks that a
// request itself was aborted (5b, 5d). It shows the token alone refuses a superseded answer.
const EDIT = process.env.EDIT || '', EDITS = { 'no-abort': [JS, "function cancel() { const r = st.req; st.req = null; st.tok++; if (r) { clearTimeout(r.timer); try { r.c.abort(); } catch (_) { } } }", "function cancel() { const r = st.req; st.req = null; st.tok++; if (r) { clearTimeout(r.timer); } }"] };
const EXPECT = { 'no-list-check': '4a', 'no-manifest-check': '4a', 'no-display-check': '4a', 'no-structure-check': '4c', 'no-summary-check': '4c', 'marker-drawn': '2b', 'bridge-gaps': '2c', 'scale-not-as-printed': '2d', 'not-from-zero': '2d',
  'marker-as-number': '3b', 'missing-as-zero': '3b', 'later-line-everywhere': '3d', 'adds-a-total': '7a', 'says-current': '7b', 'stale-answer-wins': '5b', 'stale-success-wins': '5c', 'no-time-limit': '5f', 'focus-not-returned': '3e', 'pagehide-keeps-loading': '5d', 'no-refit': '9d', 'refit-one-way': '9d', 'refit-announces': '9e', 'refit-reopens': '9e', 'refit-scrolls': '9e' };
if (BREAK && !(BREAKS[BREAK] && EXPECT[BREAK])) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }

// ---------- the committed files
const real = name => fs.readFileSync(path.join(ROOT, 'assets/animals', name));
const CATN = 'populations-R1.catalog.json', CAT = real(CATN), CATJ = JSON.parse(CAT), CAT_PIN = sha(CAT), CE = CATJ.populations[0];
const MANN = CE.manifest, MAN = JSON.parse(real(MANN)), DISN = MAN.display.file, DIS = JSON.parse(real(DISN)), YEARS = DIS.years, W = MAN.wording;
const nf = x => Number(x).toLocaleString('en-GB');
/** this file's own summary of a colony (not the page's code) */
function summ(v) { const cs = YEARS.map((y, i) => [y, v[i]]).filter(x => Number.isInteger(x[1])); let hi = cs[0]; for (const c of cs) if (c[1] > hi[1]) hi = c;
  return { counted_years: cs.length, first_year: cs[0][0], first_value: cs[0][1], last_year: cs[cs.length - 1][0], last_value: cs[cs.length - 1][1], highest_value: hi[1], highest_year: hi[0], lowest_value: Math.min(...cs.map(c => c[1])),
    gaps_inside: YEARS.filter((y, i) => v[i] === null && y > cs[0][0] && y < cs[cs.length - 1][0]).length, joined_pairs: cs.filter((c, i) => i && c[0] - cs[i - 1][0] === 1).length, marker_years: YEARS.filter((y, i) => v[i] === 'm') }; }
/** the printed scale top this suite expects: the highest count rounded up to 1, 2, 2.5 or 5 times a power of ten */
function niceTop(max) { let p = 1; while (p * 10 <= max) p *= 10; for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p; }
/** maximal runs of consecutive counted years, length two or more */
function runs(v) { const out = []; let cur = []; YEARS.forEach((y, i) => { if (Number.isInteger(v[i])) cur.push(y); else { if (cur.length > 1) out.push(cur); cur = []; } }); if (cur.length > 1) out.push(cur); return out; }
const sumText = (v) => { const s = summ(v); return `${s.counted_years} of ${YEARS.length} years have a count. First count ${s.first_year}: ${nf(s.first_value)}. Last count ${s.last_year}: ${nf(s.last_value)}. Highest ${s.highest_year}: ${nf(s.highest_value)}.`; };
/** a fixture: display and manifest changed, then manifest, list and script pin recomputed (harness substitution) */
function fixture(mutate, fixSummaries) { const d = JSON.parse(JSON.stringify(DIS)), m = JSON.parse(JSON.stringify(MAN)); mutate(d, m);
  if (fixSummaries) { let c = 0, n = 0, k = 0; m.colonies = d.colonies.map((col, i) => { const s = summYears(d.years, col.v); for (const x of col.v) { if (x === null) n++; else if (x === 'm') k++; else c++; } return Object.assign({}, m.colonies[i] || { country: 'South Africa', later_file_differing_years: 0 }, { name: col.name }, s); });
    m.totals = { ...m.totals, counts: c, no_count: n, markers: k, cells: c + n + k, colonies: d.colonies.length }; m.period = { first_year: d.years[0], last_year: d.years[d.years.length - 1], years: d.years.length }; }
  const db = Buffer.from(JSON.stringify(d)); m.display = { file: 'fx-display.json', bytes: db.length, sha256: sha(db) };
  const mb = Buffer.from(JSON.stringify(m)), cat = Buffer.from(JSON.stringify({ ...CATJ, populations: [{ ...CE, manifest: 'fx-manifest.json', manifest_sha256: sha(mb) }] }));
  return { display: db, manifest: mb, cat, d, m }; }
function summYears(years, v) { const cs = years.map((y, i) => [y, v[i]]).filter(x => Number.isInteger(x[1])); let hi = cs[0]; for (const c of cs) if (c[1] > hi[1]) hi = c;
  return { counted_years: cs.length, first_year: cs[0][0], first_value: cs[0][1], last_year: cs[cs.length - 1][0], last_value: cs[cs.length - 1][1], highest_value: hi[1], highest_year: hi[0], lowest_value: Math.min(...cs.map(c => c[1])),
    gaps_inside: years.filter((y, i) => v[i] === null && y > cs[0][0] && y < cs[cs.length - 1][0]).length, joined_pairs: cs.filter((c, i) => i && c[0] - cs[i - 1][0] === 1).length, marker_years: years.filter((y, i) => v[i] === 'm') }; }

// ---------- server. S.q[name] = one-off answers ({ hold, status, body }), used in order; S.fx = a fixture
const S = { q: {}, over: {}, fx: null, log: [] };
const reset = () => Object.assign(S, { q: {}, over: {}, fx: null, log: [] });
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.bin': 'application/octet-stream' };
function served(f) { let t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const E of [BREAK && BREAKS[BREAK], EDIT && EDITS[EDIT]]) if (E && E[0] === f) { for (let k = 1; k < E.length; k += 2) { if (t.split(E[k]).length !== 2) { console.log('FAIL  edit did not apply: ' + BREAK + ' #' + k); process.exit(1); } t = t.replace(E[k], E[k + 1]); } }
  if (S.fx && f === JS) { if (t.split(CAT_PIN).length !== 2) { console.log('FAIL  pinned checksum not found in ' + f); process.exit(1); } t = t.replace(CAT_PIN, sha(S.fx.cat)); }
  return t; }
const srv = http.createServer(async (q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0]), f = p.replace(/^\//, '') || 'index.html';
  const send = (code, type, body) => { s.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); s.end(body); };
  if (p.startsWith('/assets/animals/')) { const name = p.split('/').pop(); S.log.push(name); const o = S.q[name] && S.q[name].length ? S.q[name].shift() : S.over[name];
    if (o && o.hold) await o.hold;
    if (o && o.status && o.status !== 200) return send(o.status, 'text/plain', 'no');
    if (o && o.body) return send(200, 'application/json', o.body);
    if (S.fx && name === CATN) return send(200, 'application/json', S.fx.cat);
    if (S.fx && name === 'fx-manifest.json') return send(200, 'application/json', S.fx.manifest);
    if (S.fx && name === 'fx-display.json') return send(200, 'application/json', S.fx.display);
    return fs.existsSync(path.join(ROOT, 'assets/animals', name)) ? send(200, 'application/json', real(name)) : send(404, 'text/plain', ''); }
  if (!fs.existsSync(path.join(ROOT, f)) || fs.statSync(path.join(ROOT, f)).isDirectory()) return send(404, 'text/plain', '');
  const ext = path.extname(f); if (TYPES[ext] && ext !== '.json' && ext !== '.bin') return send(200, TYPES[ext], served(f));
  send(200, TYPES[ext] || 'application/octet-stream', fs.readFileSync(path.join(ROOT, f)));
});
let BASE;
async function open(browser, vp = { width: 1280, height: 860 }, opts = {}) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.route('**/unpkg.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => r.abort());
  if (opts.pre) await opts.pre(ctx);
  const page = await ctx.newPage(), errs = [], reqs = [], failedReqs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('request', r => reqs.push(r.url())); page.on('requestfailed', r => failedReqs.push([r.url().split('/').pop().split('?')[0], (r.failure() || {}).errorText || '']));
  await page.goto(BASE + '/animals.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.census, null, { timeout: 30000 });
  if (!opts.noWait) await page.waitForFunction(() => ME.census.state().status !== 'loading', null, { timeout: 30000 });
  await page.waitForTimeout(150);
  return { ctx, page, errs, reqs, failedReqs };
}
const state = page => page.evaluate(() => ({ ...ME.census.state(), stateText: document.getElementById('cen-state').textContent, retryHidden: document.getElementById('cen-retry').hidden, bodyHidden: document.getElementById('cen-body').hidden,
  svgs: document.querySelectorAll('#an-census svg').length, cards: document.querySelectorAll('#an-census .cen-card').length, say: document.getElementById('cen-say').textContent, focus: document.activeElement ? document.activeElement.id : null,
  text: document.getElementById('an-census').innerText, detailHidden: document.getElementById('cen-detail').hidden, busyAttr: document.getElementById('an-census').getAttribute('aria-busy') }));
const done = page => page.waitForFunction(() => ME.census.state().status !== 'loading', null, { timeout: 30000 }).then(() => page.waitForTimeout(150));
/** wait until the server has received `n` requests for an asset since the log was last cleared (so a held answer is really in flight) */
const arrived = async (name, n = 1) => { for (let i = 0; i < 200; i++) { if (S.log.filter(x => x === name).length >= n) return true; await new Promise(r => setTimeout(r, 25)); } throw new Error('request for ' + name + ' never arrived'); };
const gate = () => { let go; const p = new Promise(r => { go = r; }); return { p, go }; };
/** everything drawn in one svg, read from the page */
const readSvg = (page, sel) => page.evaluate(q => { const s = document.querySelector(q); if (!s) return null; const n = k => +s.getAttribute(k);
  return { top: n('data-top'), x0: n('data-x0'), x1: n('data-x1'), y0: n('data-y0'), ytop: n('data-ytop'), first: n('data-first'), last: n('data-last'),
    dots: [...s.querySelectorAll('circle.cen-dot')].map(c => ({ year: +c.dataset.year, v: +c.dataset.v, cx: +c.getAttribute('cx'), cy: +c.getAttribute('cy') })),
    lines: [...s.querySelectorAll('polyline.cen-line')].map(l => ({ years: l.dataset.years.split(',').map(Number), pts: l.getAttribute('points').split(' ').map(p => p.split(',').map(Number)) })),
    texts: [...s.querySelectorAll('text')].map(t => t.textContent), circles: s.querySelectorAll('circle').length, shapes: [...s.children].map(c => c.tagName).join(','), role: s.getAttribute('role'), label: s.getAttribute('aria-label'), hidden: s.getAttribute('aria-hidden') }; }, sel);
/** compare one drawn chart with what the entries say; returns a list of problems */
function checkChart(g, v, years = YEARS) { const bad = [], want = years.map((y, i) => [y, v[i]]).filter(x => Number.isInteger(x[1])), max = Math.max(...want.map(x => x[1])), top = niceTop(max);
  if (g.top !== top) bad.push(['top', g.top, top]);
  if (g.first !== years[0] || g.last !== years[years.length - 1]) bad.push(['x span', g.first, g.last]);
  if (g.dots.length !== want.length || g.circles !== want.length) bad.push(['dots', g.dots.length, want.length]);
  g.dots.forEach((d, k) => { const w = want[k]; if (!w || d.year !== w[0] || d.v !== w[1]) return bad.push(['dot', d, w]);
    const backV = (g.y0 - d.cy) / (g.y0 - g.ytop) * g.top, backY = years[0] + (d.cx - g.x0) / (g.x1 - g.x0) * (years[years.length - 1] - years[0]);
    if (Math.abs(backV - w[1]) > g.top / (g.y0 - g.ytop) * 0.6) bad.push(['height', d.year, backV, w[1]]); if (Math.abs(backY - w[0]) > 0.05) bad.push(['x', d.year, backY]); });
  const wr = (() => { const out = []; let cur = []; years.forEach((y, i) => { if (Number.isInteger(v[i])) cur.push(y); else { if (cur.length > 1) out.push(cur); cur = []; } }); if (cur.length > 1) out.push(cur); return out; })();
  if (JSON.stringify(g.lines.map(l => l.years)) !== JSON.stringify(wr)) bad.push(['lines', g.lines.map(l => l.years).slice(0, 3), wr.slice(0, 3)]);
  g.lines.forEach(l => l.pts.forEach((p, k) => { const d = g.dots.find(x => x.year === l.years[k]); if (!d || Math.abs(d.cx - p[0]) > 0.02 || Math.abs(d.cy - p[1]) > 0.02) bad.push(['line point', l.years[k]]); }));
  if (!g.texts.includes(`${nf(top)} occupied nest sites`) || !g.texts.includes('0') || !g.texts.includes(String(years[0])) || !g.texts.includes(String(years[years.length - 1]))) bad.push(['printed', g.texts]);
  return bad; }

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
  // ===== 1. Loaded and verified; what the card says (P14)
  if (want(1)) { reset(); const { ctx, page, errs, reqs } = await open(browser); const s = await state(page);
    ok('1a the census loads and verifies: 22 colony charts, no page error, the section no longer busy', s.status === 'ready' && s.cards === 22 && s.svgs === 22 && errs.length === 0 && s.busyAttr === 'false' && s.retryHidden && !s.bodyHidden && s.stateText === 'Census file verified. 22 colonies, 1979 to 2019.', [s.status, s.cards, errs, s.stateText]);
    const cen = S.log.filter(n => [CATN, MANN, DISN].includes(n)), allowed = u => u.startsWith(BASE) || /^https:\/\/unpkg\.com\/globe\.gl@2\.45\.0\//.test(u) || /^https:\/\/fonts\.googleapis\.com\//.test(u) || /^https:\/\/gibs\.earthdata\.nasa\.gov\//.test(u) || u.startsWith('blob:') || u.startsWith('data:');
    ok('1b its three files are requested once each, in order (list, manifest, display file); no request leaves the allowed origins; no journey coordinate file is requested (the page\'s separate assessment record, assessments-R1.json, is not a coordinate file and is allowed)', cen.join() === [CATN, MANN, DISN].join() && reqs.every(allowed) && !S.log.some(n => /-R1\.json$/.test(n) && n !== DISN && n !== 'assessments-R1.json'), [cen, S.log]);
    const t = await page.evaluate(() => ({ title: document.getElementById('cen-title').textContent, intro: [...document.querySelectorAll('#cen-intro p')].map(p => [p.className, p.textContent]), dates: [...document.querySelectorAll('#cen-dates dt, #cen-dates dd')].map(e => e.textContent),
      src: [...document.querySelectorAll('#cen-source p')].map(p => p.textContent), links: [...document.querySelectorAll('#cen-source a')].map(a => [a.textContent, a.href]), h: [...document.querySelectorAll('#an-census h2, #an-census h3, #an-census h4.cen-country')].map(h => h.textContent), badge: document.querySelector('.cen-card-head').textContent.trim() }));
    const I = Object.fromEntries(t.intro);
    ok('1c P14 the unit sentence, the version note and the "no total" sentence are on the card word for word, with the statement that a value is the year\'s highest count and not a count of birds', I['cen-unit'] === W.unit + ' ' + W.unit_detail && I['cen-version'] === W.version_note && I['cen-total'] === W.one_colony + ' ' + W.no_total && W.unit === 'Annual colony census: occupied nest sites (used as a breeding-pair proxy).' &&
      /highest count available for that colony in that year/.test(I['cen-unit']) && /not a count of individual birds/.test(I['cen-unit']) && W.no_total.startsWith('No total is shown because the colonies counted vary between years;'), t.intro);
    ok('1d the card says scales differ, explains "No count in this file" in general terms only, and says it is a dated record', I['cen-scales'] === W.scales && I['cen-nocount'] === `“${W.no_count}”: ${W.no_count_general}` && /does not give a reason for any single missing entry/.test(I['cen-nocount']) && /says nothing here about whether a colony exists today/.test(I['cen-nocount']) && I['cen-archive'] === W.archive, [I['cen-scales'], I['cen-nocount']]);
    ok('1e three separate dates: period covered, the deposit\'s version, and when Mother Earth last checked the record', t.dates.join('|') === ['Period covered', '1979 to 2019', 'Version of the deposit', MAN.record.deposit_version_as_given, 'Record last checked by Mother Earth', MAN.record.checked].join('|'), t.dates);
    ok('1f source: both citations as the record gives them, the licence as given with its link, and the record\'s DOI', t.src[0].includes(MAN.record.dataset_citation_as_given) && t.src[1].includes(MAN.record.paper_citation_as_given) && t.links.some(l => l[0] === 'Public domain' && l[1] === 'https://creativecommons.org/publicdomain/zero/1.0/') && t.links.some(l => l[1] === 'https://doi.org/10.5061/dryad.vx0k6djp7') && /It is not used here\. 23 entries differ/.test(t.src[4]), [t.src, t.links]);
    ok('1g headings: Population counts; the card\'s title from the manifest; South Africa (18 colonies) then Namibia (4 colonies); evidence type census counts, group Sea', t.h.join('|') === ['Population counts', MAN.label, 'South Africa (18 colonies)', 'Namibia (4 colonies)'].join('|') && MAN.label === 'African penguin: colony census, 1979 to 2019' && /Census counts\s+Sea/i.test(t.badge), [t.h, t.badge]);
    await ctx.close(); }

  // ===== 2. Every colony's chart (P9, P11, P21)
  if (want(2)) { reset(); const { ctx, page } = await open(browser); const all = [], names = [];
    for (let k = 0; k < 22; k++) { const g = await readSvg(page, `#cen-card-${k} svg`), card = await page.evaluate(i => { const b = document.getElementById('cen-card-' + i); return { name: b.querySelector('.cen-name').textContent, sum: b.querySelector('.cen-sum').textContent, open: b.querySelector('.cen-open').textContent, tag: b.tagName, type: b.type, exp: b.getAttribute('aria-expanded'), ctl: b.getAttribute('aria-controls'), h: b.getBoundingClientRect().height }; }, k); all.push({ g, card, v: DIS.colonies[k].v }); names.push(card.name); }
    ok('2a 22 charts in the file\'s own order, each a button named by its colony, with its summary in words', names.join('|') === DIS.colonies.map(c => c.name).join('|') && all.every(a => a.card.tag === 'BUTTON' && a.card.type === 'button' && a.card.exp === 'false' && a.card.ctl === 'cen-detail' && a.card.h >= 44 && a.g.hidden === 'true'), names);
    const b1 = all.map((a, k) => [DIS.colonies[k].name, a.g.dots.filter(d => !Number.isInteger(a.v[YEARS.indexOf(d.year)])).length, a.g.circles - a.v.filter(Number.isInteger).length]).filter(x => x[1] || x[2]);
    ok('2b P9 one dot per count and no other mark: no dot in a year with no count, and none for the four model markers (all 22 charts, 600 dots)', b1.length === 0 && all.reduce((n, a) => n + a.g.dots.length, 0) === 600 && all.every(a => a.g.shapes.replace(/line|text|polyline|circle|,/g, '') === ''), b1);
    const b2 = all.map((a, k) => [DIS.colonies[k].name, JSON.stringify(a.g.lines.map(l => l.years)) === JSON.stringify(runs(a.v))]).filter(x => !x[1]);
    ok('2c P9 a line joins counts only in consecutive years: each chart\'s lines are exactly the runs of consecutive counted years, never across a gap or a marker', b2.length === 0 && all.reduce((n, a) => n + a.g.lines.reduce((m, l) => m + l.years.length - 1, 0), 0) === MAN.colonies.reduce((n, c) => n + c.joined_pairs, 0), b2);
    const b3 = all.map((a, k) => [DIS.colonies[k].name, checkChart(a.g, a.v)]).filter(x => x[1].length);
    ok('2d P21 every dot is at its year and at its value on the PRINTED scale (from zero to the printed top), in all 22 charts; each chart prints its scale top and unit, a zero, and 1979 and 2019', b3.length === 0, b3.slice(0, 2));
    ok('2e the year span and the plot width are the same in every chart', new Set(all.map(a => [a.g.x0, a.g.x1, a.g.first, a.g.last].join())).size === 1 && all[0].g.first === 1979 && all[0].g.last === 2019, all[0].g);
    const b4 = all.map((a, k) => [DIS.colonies[k].name, a.card.sum, sumText(a.v)]).filter(x => x[1] !== x[2]);
    ok('2f P11 each chart\'s words (years counted, first, last, highest) equal this suite\'s own summary of the entries and the manifest\'s', b4.length === 0 && MAN.colonies.every((c, k) => { const s = summ(DIS.colonies[k].v); return Object.keys(s).every(f => JSON.stringify(s[f]) === JSON.stringify(c[f])); }), b4.slice(0, 2));
    ok('2g scale tops are "round" and at or above each colony\'s highest count; they differ between colonies (own scales)', all.every((a, k) => a.g.top >= MAN.colonies[k].highest_value && a.g.top === niceTop(MAN.colonies[k].highest_value)) && new Set(all.map(a => a.g.top)).size > 4, all.map(a => a.g.top));
    await ctx.close(); }

  // ===== 3. The detail view and its table, for all 22 colonies (P12, P13, P22, P24)
  if (want(3)) { reset(); const { ctx, page, errs } = await open(browser); const bad = [], laterBad = [], markBad = [], chartBad = []; let cells = 0;
    for (let k = 0; k < 22; k++) { const c = DIS.colonies[k], mc = MAN.colonies[k]; await page.click('#cen-card-' + k);
      const d = await page.evaluate(() => { const box = document.getElementById('cen-detail'), t = box.querySelector('table');
        return { hidden: box.hidden, focus: document.activeElement.id, h: box.querySelector('#cen-dh').textContent, cap: t.caption.textContent, head: [...t.tHead.rows[0].cells].map(x => [x.tagName, x.scope, x.textContent]),
          rows: [...t.tBodies[0].rows].map(r => [r.cells[0].tagName, r.cells[0].scope, r.cells[0].textContent, r.cells[1].textContent, r.cells[1].dataset.state]), notes: [...box.querySelectorAll('.cen-notes p')].map(p => [p.className, p.textContent]), scale: box.querySelector('#cen-scaleline').textContent,
          expanded: [...document.querySelectorAll('.cen-card[aria-expanded="true"]')].map(b => b.id), say: document.getElementById('cen-say').textContent, region: [box.getAttribute('role'), box.getAttribute('aria-labelledby')], tb: (() => { const b = box.querySelector('.cen-tablebox'); return [b.tabIndex, b.getAttribute('role'), b.getAttribute('aria-label')]; })() }; });
      const g = await readSvg(page, '#cen-detail svg');
      const wantRows = YEARS.map((y, i) => ['TH', 'row', String(y), c.v[i] === null ? 'No count in this file' : c.v[i] === 'm' ? 'Not a count: model marker, left out' : nf(c.v[i]), c.v[i] === null ? 'none' : c.v[i] === 'm' ? 'marker' : 'count']); cells += d.rows.length;
      if (JSON.stringify(d.rows) !== JSON.stringify(wantRows) || d.hidden || d.focus !== 'cen-dh' || d.h !== `${c.name}: yearly entries, 1979 to 2019` || d.expanded.join() !== 'cen-card-' + k || d.say !== `${c.name}: larger chart and table opened.` || !d.cap.startsWith(`${c.name}: one row per year.`) ||
        JSON.stringify(d.head) !== JSON.stringify([['TH', 'col', 'Year'], ['TH', 'col', 'Entry in the file']]) || d.region.join() !== 'region,cen-dh' || d.tb[0] !== 0 || d.tb[1] !== 'region' || !d.tb[2].startsWith(c.name)) bad.push([c.name, d.focus, d.h, d.rows.find((r, i) => JSON.stringify(r) !== JSON.stringify(wantRows[i]))]);
      const later = d.notes.filter(n => n[0] === 'cen-later').map(n => n[1]), wantLater = mc.later_file_differing_years ? [`The authors' later file has different entries for this colony in ${mc.later_file_differing_years} of the shared years. Its values are not shown here.`] : [];
      if (JSON.stringify(later) !== JSON.stringify(wantLater)) laterBad.push([c.name, later]);
      const marks = d.notes.filter(n => n[0] === 'cen-marknote').map(n => n[1]); if (marks.length !== mc.marker_years.length || marks.some((m, i) => !m.startsWith(`The file holds a 0.1 marker at ${mc.marker_years[i]}. The record's usage notes say`))) markBad.push([c.name, marks]);
      const cb = checkChart(g, c.v); if (cb.length || g.role !== 'img' || !g.label.startsWith(c.name + '. ') || d.scale !== `Chart scale: 0 to ${nf(niceTop(mc.highest_value))} occupied nest sites. Years 1979 to 2019. A dot is one count; a line joins counts in consecutive years only.`) chartBad.push([c.name, cb.slice(0, 2), d.scale]); }
    ok('3a P24 every colony\'s detail opens in the page as a labelled region with focus on its heading, one button marked expanded, one announcement; the table has a caption, column headers and a row header per year, in a focusable scrolling box', bad.length === 0, bad.slice(0, 2));
    ok(`3b P12/P22 all 902 states read back from the 22 tables (${cells} rows): a count as its number, "No count in this file", or "Not a count: model marker, left out"; never 0 or 0.1`, bad.length === 0 && cells === 902);
    ok('3c the four markers are identified in their colonies\' notes with the record\'s explanation, attributed; no other colony has such a note', markBad.length === 0, markBad);
    ok('3d P13 the ten colonies the later file differs on carry their line with the right number; the other twelve carry none; no later-file value is shown', laterBad.length === 0 && MAN.colonies.filter(c => c.later_file_differing_years).length === 10, laterBad);
    ok('3e2 the larger chart obeys the same rules as the small one and states its scale in words too (all 22)', chartBad.length === 0, chartBad.slice(0, 2));
    // closing and replacing
    await page.click('#cen-close'); let s = await state(page); const f1 = s.focus === 'cen-card-21' && s.detailHidden && s.say === 'Possession: larger chart and table closed.';
    await page.focus('#cen-card-6'); await page.keyboard.press('Enter'); await page.waitForTimeout(80); const order = []; for (let i = 0; i < 2; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => document.activeElement.id || document.activeElement.className)); }
    await page.keyboard.press('Escape'); s = await state(page); const f2 = s.focus === 'cen-card-6' && s.detailHidden && s.open === -1;
    await page.click('#cen-card-2'); await page.click('#cen-card-9'); const rep = await page.evaluate(() => [[...document.querySelectorAll('.cen-card[aria-expanded="true"]')].map(b => b.id).join(), document.getElementById('cen-dh').textContent, document.querySelectorAll('#cen-detail table').length]);
    ok('3e P24 Close returns focus to the colony\'s button and says so; Escape does the same; opening another colony replaces the first; Tab from the heading reaches Close and then the table box', f1 && f2 && rep[0] === 'cen-card-9' && rep[1].startsWith('Stony Point') && rep[2] === 1 && order[0] === 'cen-close' && order[1] === 'cen-tablebox', [f1, f2, rep, order]);
    const scroll = await page.evaluate(() => { const b = document.querySelector('.cen-tablebox'); b.focus(); const a = b.scrollTop; b.scrollTop = 200; return [a, b.scrollTop, b.scrollHeight > b.clientHeight, document.activeElement === b]; });
    ok('3f the table box takes focus and scrolls inside itself', scroll[1] > scroll[0] && scroll[2] && scroll[3], scroll); ok('3g no page error', errs.length === 0, errs); await ctx.close(); }

  // ===== 4. Nothing is drawn from a file that does not verify (P8, P18)
  if (want(4)) { const UNV = 'The census file could not be verified. Nothing is shown.', FAILED = 'The census file could not be loaded. Nothing is shown.';
    const nothing = s => s.svgs === 0 && s.cards === 0 && s.bodyHidden && !s.retryHidden && !/\d{2,}/.test(s.text.replace(/1979|2019/g, '')) && s.busyAttr === 'false';
    const res = []; for (const [what, name, re] of [['the list', CATN, /population list does not match/], ['the manifest', MANN, /manifest does not match/], ['the display file', DISN, /display file does not match/]]) { reset(); const b = Buffer.from(real(name)); const i = b.indexOf(Buffer.from('19')); b[i + 1] = 0x38; S.over[name] = { body: b };
      const o = await open(browser), s = await state(o.page); res.push([what, s.status === 'unverified' && s.stateText === UNV && nothing(s) && re.test(s.detail) && s.say === UNV, s.detail, s.svgs]); await o.ctx.close(); }
    ok('4a P8 one changed digit in the list, in the manifest or in the display file: the stated message, a Retry, no chart and no number', res.every(r => r[1]), res);
    reset(); S.over[DISN] = { status: 500 }; { const o = await open(browser), s = await state(o.page); ok('4b a file that cannot be loaded: the "could not be loaded" message, a Retry, nothing shown', s.status === 'failed' && s.stateText === FAILED && nothing(s), [s.status, s.stateText]); await o.ctx.close(); }
    // structure: re-pinned fixtures, so the checksums pass and the structure check is what refuses
    const cases = [['an entry of zero', (d) => { d.colonies[3].v[5] = 0; }, /not a count, no count, or the marker/], ['an entry of 0.1 as a number', d => { d.colonies[6].v[0] = 0.1; }, /not a count, no count, or the marker/], ['a negative entry', d => { d.colonies[3].v[5] = -3; }, /not a count/],
      ['a count changed (summary no longer matches)', d => { const c = d.colonies[5]; c.v[c.v.findIndex(Number.isInteger)] += 1; }, /summary does not match|totals/], ['a count removed', d => { const c = d.colonies[5]; c.v[c.v.findIndex(Number.isInteger)] = null; }, /summary does not match|totals/],
      ['a marker moved to another year', d => { const c = d.colonies[6]; c.v[0] = null; c.v[1] = 'm'; }, /marker is not where the manifest says/], ['a marker added', d => { d.colonies[1].v[d.colonies[1].v.indexOf(null)] = 'm'; }, /marker is not where|summary/],
      ['two colonies swapped', d => { const x = d.colonies[2]; d.colonies[2] = d.colonies[3]; d.colonies[3] = x; }, /missing, out of order/], ['a colony dropped', d => { d.colonies.pop(); }, /number of colonies/], ['a short series', d => { d.colonies[4].v.pop(); }, /wrong number of entries/],
      ['a year missing', d => { d.years.splice(10, 1); }, /years are not the manifest/], ['years shifted', d => { d.years = d.years.map(y => y + 1); }, /years are not the manifest/],
      ['a sentence missing from the manifest', (d, m) => { delete m.wording.no_total; }, /sentence the card needs/], ['the record block missing a citation', (d, m) => { delete m.record.dataset_citation_as_given; }, /record details are missing/], ['a manifest summary changed', (d, m) => { m.colonies[0].highest_value += 1; }, /summary does not match/], ['manifest totals changed', (d, m) => { m.totals.counts += 1; }, /totals of the three states/]];
    const out = []; for (const [what, mu, re] of cases) { reset(); S.fx = fixture(mu); const o = await open(browser), s = await state(o.page); out.push([what, s.status === 'unverified' && nothing(s) && re.test(s.detail), s.detail]); await o.ctx.close(); }
    ok(`4c P18 a file whose checksums all match but whose structure is wrong is refused with nothing drawn (${cases.length} cases: ${cases.map(c => c[0]).join('; ')})`, out.every(r => r[1]), out.filter(r => !r[1]));
    reset(); S.fx = fixture(() => { }); { const o = await open(browser), s = await state(o.page); ok('4d an unchanged copy re-pinned the same way still loads (the harness is not what refuses)', s.status === 'ready' && s.cards === 22, s.status); await o.ctx.close(); } }

  // ===== 5. Loading is bounded and Retry is protected against stale answers (P23)
  if (want(5)) { const UNV = 'The census file could not be verified. Nothing is shown.', FAILED = 'The census file could not be loaded. Nothing is shown.', bad = (() => { const b = Buffer.from(real(MANN)); const i = b.indexOf(Buffer.from('19')); b[i + 1] = 0x38; return b; })();
    const failedOpen = async () => { reset(); S.q[MANN] = [{ status: 500 }]; const o = await open(browser), s = await state(o.page); if (s.status !== 'failed') throw new Error('5 setup: ' + s.status); return o; };
    const aborted = (o, n) => o.failedReqs.filter(f => f[0] === n && /ERR_ABORTED/.test(f[1])).length;
    { const o = await failedOpen(); await o.page.click('#cen-retry'); await done(o.page); const s = await state(o.page);
      ok('5a Retry after a failure loads and verifies the census; the announcement says so', s.status === 'ready' && s.cards === 22 && s.retryHidden && s.say === 'Census file verified.', [s.status, s.say]); await o.ctx.close(); }
    { const o = await failedOpen(), g = gate(); S.q[MANN] = [{ hold: g.p, status: 500 }]; S.log = []; await o.page.click('#cen-retry'); await arrived(MANN); const mid = await state(o.page);
      await o.page.click('#cen-retry', { force: true }).catch(() => { }); await o.page.evaluate(() => ME.census.load(true)); await done(o.page); const before = await state(o.page); g.go(); await o.page.waitForTimeout(600); const s = await state(o.page);
      ok('5b an older load that fails late, after a newer load has succeeded, changes and says nothing: the charts stay', mid.status === 'loading' && mid.busyAttr === 'true' && before.status === 'ready' && s.status === 'ready' && s.cards === 22 && s.say === before.say && s.say === 'Census file verified.' && aborted(o, MANN) >= 1, [mid.status, before.status, s.status, s.say, o.failedReqs]); await o.ctx.close(); }
    { const o = await failedOpen(), g = gate(); S.q[DISN] = [{ hold: g.p }]; S.q[MANN] = [{}, { body: bad }]; S.log = []; await o.page.click('#cen-retry'); await arrived(DISN); await o.page.evaluate(() => ME.census.load(true)); await done(o.page); const before = await state(o.page); g.go(); await o.page.waitForTimeout(600); const s = await state(o.page);
      ok('5c an older load that succeeds late, after a newer load has failed, does not draw and does not say "verified"', before.status === 'unverified' && s.status === 'unverified' && s.svgs === 0 && s.cards === 0 && s.say === UNV && s.stateText === UNV, [before.status, s.status, s.svgs, s.say]); await o.ctx.close(); }
    { const o = await failedOpen(), g = gate(); S.q[CATN] = [{ hold: g.p }]; S.log = []; await o.page.click('#cen-retry'); await arrived(CATN); const sayBefore = (await state(o.page)).say;
      await o.page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))); await o.page.waitForTimeout(150); const mid = await state(o.page); g.go(); await o.page.waitForTimeout(600); const s = await state(o.page);
      ok('5d leaving the page cancels a running load: its request is aborted, the section is not left busy, and its late answer draws and says nothing', mid.busy === false && mid.status === 'failed' && mid.busyAttr === 'false' && !mid.retryHidden && s.status === 'failed' && s.svgs === 0 && s.say === sayBefore && aborted(o, CATN) >= 1, [mid, s.status, s.say]);
      await o.page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))); await done(o.page); const back = await state(o.page);
      ok('5e a page restored from the browser\'s kept copy loads the census again', back.status === 'ready' && back.cards === 22, back.status); await o.ctx.close(); }
    { const o = await failedOpen(), never = new Promise(() => { }); const limit = await o.page.evaluate(() => { const w = ME.census.C.WAIT_MS; ME.census.C.WAIT_MS = 900; return w; }); S.q[CATN] = [{ hold: never }]; S.log = []; const t0 = Date.now(); await o.page.click('#cen-retry'); await arrived(CATN);
      const ended = await o.page.waitForFunction(() => ME.census.state().status !== 'loading', null, { timeout: 6000 }).then(() => true, () => false); const s = await state(o.page);
      ok(`5f a request that never answers ends at the time limit (the page's own limit is ${limit} ms; 900 ms set for this check): "could not be loaded", Retry offered, not left busy`, ended && Date.now() - t0 < 5000 && limit >= 5000 && s.status === 'failed' && s.stateText === FAILED && !s.retryHidden && s.busyAttr === 'false' && s.busy === false, [ended, s.status]);
      await o.page.evaluate(w => { ME.census.C.WAIT_MS = w; }, limit); await o.page.click('#cen-retry'); await done(o.page); const s2 = await state(o.page); ok('5g after that, with the page\'s own limit restored, a Retry that is answered loads the census', s2.status === 'ready' && o.errs.length === 0, [s2.status, o.errs]); await o.ctx.close(); } }

  // ===== 6. Drawing rules on made-up series (P20). The fixture's summaries are recomputed by this suite.
  if (want(6)) { reset(); const N = null, Y = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010];
    const SER = { 'Isolated dot': [N, N, 40, N, N, 60, 70, N, N, N], 'Leading gap': [N, N, N, 5, 6, 7, 8, 9, 10, 11], 'Trailing gap': [300, 280, 260, N, N, N, N, N, N, N], 'One counted year': [N, N, N, N, 12, N, N, N, N, N], 'One year apart': [N, 100, 200, N, N, N, N, N, N, N], 'Two years apart': [N, 100, N, 200, N, N, N, N, N, N], 'Marker then counts': ['m', N, 3, 4, N, N, N, N, N, 9] };
    S.fx = fixture((d, m) => { d.years = Y; d.colonies = Object.entries(SER).map(([name, v]) => ({ name, v })); m.colonies = []; }, true);
    const o = await open(browser), s = await state(o.page), R = {}; let k = 0; for (const name of Object.keys(SER)) { R[name] = await readSvg(o.page, `#cen-card-${k++} svg`); }
    const L = n => R[n].lines.map(l => l.years), Dn = n => R[n].dots.map(d => d.year), bad = Object.keys(SER).map(n => [n, checkChart(R[n], SER[n], Y)]).filter(x => x[1].length);
    ok('6a the made-up census loads (its structure is consistent)', s.status === 'ready' && s.cards === 7, [s.status, s.detail]);
    ok('6b P20 an isolated count is a single dot with no line; counts in consecutive years are joined', JSON.stringify(Dn('Isolated dot')) === '[2003,2006,2007]' && JSON.stringify(L('Isolated dot')) === '[[2006,2007]]', [Dn('Isolated dot'), L('Isolated dot')]);
    ok('6c P20 a leading gap and a trailing gap draw nothing where there is no count; the year span stays the whole period', JSON.stringify(L('Leading gap')) === '[[2004,2005,2006,2007,2008,2009,2010]]' && JSON.stringify(L('Trailing gap')) === '[[2001,2002,2003]]' && Dn('Trailing gap').length === 3 && R['Trailing gap'].first === 2001 && R['Trailing gap'].last === 2010 && R['Leading gap'].dots[0].cx > R['Leading gap'].x0 + 50, [L('Leading gap'), L('Trailing gap')]);
    ok('6d P20 a single counted year is one dot and no line', Dn('One counted year').join() === '2005' && L('One counted year').length === 0, R['One counted year'].dots);
    ok('6e P20 two counts one year apart are joined; two counts two years apart are NOT joined', JSON.stringify(L('One year apart')) === '[[2002,2003]]' && L('Two years apart').length === 0 && Dn('Two years apart').join() === '2002,2004', [L('One year apart'), L('Two years apart')]);
    ok('6f a marker draws nothing and never joins to a count', Dn('Marker then counts').join() === '2003,2004,2010' && JSON.stringify(L('Marker then counts')) === '[[2003,2004]]', [Dn('Marker then counts'), L('Marker then counts')]);
    ok('6g every made-up chart has its dots at the printed scale and the right x', bad.length === 0, bad.slice(0, 2)); await o.ctx.close(); }

  // ===== 7. Unsupported claims are absent (P10, P25): claims, not a bare word list
  if (want(7)) { reset(); const { ctx, page } = await open(browser); await page.click('#cen-card-5'); const s = await state(page), text = s.text;
    const svgText = await page.evaluate(() => [...document.querySelectorAll('#an-census svg text')].map(t => t.textContent).join(' | ')); const all = text + ' | ' + svgText;
    // every sum this page could have shown: per year over the colonies with a count, per country, of last values, of highest values, of all counts
    const sums = new Set(); YEARS.forEach((y, i) => { for (const set of [DIS.colonies, DIS.colonies.slice(0, 18), DIS.colonies.slice(18)]) { const xs = set.map(c => c.v[i]).filter(Number.isInteger); if (xs.length > 1) sums.add(xs.reduce((a, b) => a + b, 0)); } });
    for (const f of ['last_value', 'highest_value', 'first_value']) for (const set of [MAN.colonies, MAN.colonies.slice(0, 18), MAN.colonies.slice(18)]) sums.add(set.reduce((a, c) => a + c[f], 0)); sums.add(DIS.colonies.reduce((a, c) => a + c.v.filter(Number.isInteger).reduce((x, y) => x + y, 0), 0));
    const cellVals = new Set(DIS.colonies.flatMap(c => c.v.filter(Number.isInteger))), tops = new Set(MAN.colonies.map(c => niceTop(c.highest_value)));
    const shown = [...sums].filter(n => !cellVals.has(n) && !tops.has(n) && n > 41 && new RegExp('(^|[^\\d,])' + nf(n).replace(/,/g, ',?') + '($|[^\\d,])').test(all));
    ok(`7a P10 no figure on the card is a sum across colonies (${sums.size} possible sums checked: every year, each country, last, first and highest values, and all counts), and no percentage sign appears`, shown.length === 0 && !/%/.test(all) && sums.size > 100, shown);
    const claims = [[/\b(is|are|stay|kept)\s+(live|current|up to date|updated)\b/i, 'says the counts are current'], [/\bupdated (every|each|daily|yearly|annually)\b/i, 'says it is updated on a schedule'], [/\blatest (count|counts|data|figures|census)\b/i, 'calls the data the latest'], [/\b(critically\s+)?endangered\b|\bvulnerable\b|\bred list\b|\bIUCN\b/i, 'gives a conservation category'],
      [/\bextinct/i, 'speaks of extinction'], [/\b(declin|decreas|increas|fell|rose|grew|dropp)\w*\s+(by|of)\s+[\d.]+/i, 'states a change by an amount'], [/\b(trend|slope|rate of (decline|change))\b/i, 'states a trend'], [/\b(in total|a total of|total (of|population|number)|altogether|overall there)\b/i, 'presents a total'],
      [/\bpopulation (of|is|was|stands)\b/i, 'states a population figure'], [/\b(will|by 20\d\d|projected|forecast)\b/i, 'projects forward'], [/\bcorrect(ed|ion|ions)?\b/i, 'calls the later file a correction'], [/\bnest(s)? (was|were|are|is) (empty|abandoned)\b/i, 'explains a missing entry']];
    const hit = claims.filter(([re]) => re.test(all)).map(c => [c[1], (all.match(c[0]) || [])[0]]);
    ok('7b P25 the card makes none of these claims: current or updated; latest; a conservation category; extinction; a change by an amount; a trend; a total; a population figure; a projection; a correction; a reason for one missing entry', hit.length === 0, hit);
    ok('7c P25 the card\'s own negative statements are present and are not treated as claims: "Not a live feed and not updated."; "No total is shown …"; "does not show recovery of the species"', /Not a live feed and not updated\./.test(text) && /No total is shown because/.test(text) && /does not show recovery of the species/.test(text) && /Its values are not shown here\./.test(MAN.later_file.sentence));
    await ctx.close(); }

  // ===== 8. Independent of the journeys and of the globe (P17, P26)
  if (want(8)) { reset(); const noGL = ctx => ctx.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; });
    { const o = await open(browser, undefined, { pre: noGL }), s = await state(o.page), g = await o.page.evaluate(() => ME.animalsGlobe.state().globe); ok('8a P17 with no usable globe the census still loads and draws', g === 'failed' && s.status === 'ready' && s.cards === 22 && o.errs.length === 0, [g, s.status, o.errs]); await o.ctx.close(); }
    { reset(); S.over[DISN] = { status: 500 }; const o = await open(browser); const Z = 'zebra-botswana-Z3866'; await o.page.waitForFunction(() => { const g = ME.animalsGlobe.state(); return g.backdrop !== 'loading' && g.coast !== 'loading'; }, null, { timeout: 30000 }); await o.page.click('#tgl-' + Z); await o.page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 30000 });
      const s = await state(o.page), j = await o.page.evaluate(() => ({ scene: ME.journey.sceneCount(), err: ME.journey.state().catErr })); ok('8b P17 a census that fails leaves the journeys usable: the zebra is shown; the journeys report no error', s.status === 'failed' && j.scene === 3 && j.err === '', [s.status, j]); await o.ctx.close(); }
    { reset(); const b = Buffer.from(real('journeys-R1.catalog.json').toString().replace('"schema": 1', '"schema": 1 ')); S.over['journeys-R1.catalog.json'] = { body: b }; const o = await open(browser); await o.page.waitForTimeout(600); await o.page.click('#tgl-zebra-botswana-Z3866'); await o.page.waitForFunction(() => ME.journey.state().status !== 'loading', null, { timeout: 30000 });
      const s = await state(o.page), j = await o.page.evaluate(() => ME.journey.state().catErr); ok('8c P17 a journey list that fails leaves the census shown', s.status === 'ready' && s.cards === 22 && /could not be verified/.test(j), [s.status, j]); await o.ctx.close(); }
    { reset(); const o = await open(browser, { width: 390, height: 740 }); const L = await o.page.evaluate(() => { const R = e => { const r = e.getBoundingClientRect(); return [Math.round(r.top + scrollY), Math.round(r.bottom + scrollY)]; }; return { stage: R(document.getElementById('an-stage')), cen: R(document.getElementById('an-census')), doc: R(document.querySelector('.an-doc')), canvasInCensus: document.querySelectorAll('#an-census canvas').length, globeInCensus: !!document.querySelector('#an-census #an-globe') }; });
      ok('8d P26 the census sits below the globe and the switches and above the study cards; it holds no canvas and does not contain the globe', L.cen[0] >= L.stage[1] && L.doc[0] >= L.cen[1] && L.canvasInCensus === 0 && !L.globeInCensus, L);
      await o.page.evaluate(() => document.getElementById('tgl-white-shark-sa-118845').scrollIntoView({ block: 'center' })); await o.page.click('#tgl-white-shark-sa-118845'); await o.page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 30000 }); const box = await o.page.evaluate(() => { const r = document.getElementById('an-globe-box').getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom), innerHeight]; });
      ok('8e P26 on a phone, with the census on the page, switching a journey on still brings the whole globe into view', box[0] >= 0 && box[0] <= 12 && box[1] <= box[2], box); await o.ctx.close(); } }

  // ===== 9. Layout and keyboard (P15)
  if (want(9)) for (const [w, h] of [[360, 740], [390, 844], [720, 900], [900, 760], [1100, 800], [1280, 860], [1470, 745]]) { reset(); const { ctx, page } = await open(browser, { width: w, height: h });
    await page.click('#cen-card-5'); const m = await page.evaluate(() => { const hs = [...document.querySelectorAll('.cen-card')].map(b => b.getBoundingClientRect()), c = document.getElementById('cen-close').getBoundingClientRect(), sec = document.getElementById('an-census').getBoundingClientRect(), big = document.querySelector('#cen-detail svg').getBoundingClientRect(), tb = document.querySelector('.cen-tablebox');
      return { over: document.documentElement.scrollWidth - document.documentElement.clientWidth, minH: Math.min(...hs.map(r => r.height)), minW: Math.min(...hs.map(r => r.width)), cols: new Set(hs.map(r => Math.round(r.left))).size, close: [c.width, c.height], secW: sec.width, bigW: big.width, inside: hs.every(r => r.left >= sec.left - 1 && r.right <= sec.right + 1), tbOver: tb.scrollWidth - tb.clientWidth, font: parseFloat(getComputedStyle(document.querySelector('#cen-detail svg text')).fontSize) * big.width / document.querySelector('#cen-detail svg').viewBox.baseVal.width }; });
    ok(`9a ${w} px: nothing overflows sideways; the grid has ${m.cols} column${m.cols > 1 ? 's' : ''}; every chart button is at least 44 px high and 200 px wide; Close is at least 44 px`, m.over <= 0 && m.inside && m.minH >= 44 && m.minW >= 200 && m.close[0] >= 44 && m.close[1] >= 44 && (w < 520 ? m.cols === 1 : m.cols >= 2) && m.tbOver <= 0, m);
    ok(`9b ${w} px: the larger chart fits its box and its printed scale is legible (text at least 9 px as drawn)`, m.bigW <= m.secW && m.font >= 9, [m.bigW, m.secW, m.font]);
    if (w === 390 || w === 1280) { await page.keyboard.press('Escape'); await page.focus('#cen-retry').catch(() => { }); await page.evaluate(() => document.getElementById('cen-title').scrollIntoView()); await page.focus('#cen-card-0'); const seq = []; for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); seq.push(await page.evaluate(() => document.activeElement.id)); }
      await page.keyboard.press('Space'); const s = await state(page); ok(`9c ${w} px: Tab moves from one chart button to the next in order, and Space opens the focused one`, seq.join() === 'cen-card-1,cen-card-2,cen-card-3,cen-card-4' && s.open === 4 && s.focus === 'cen-dh', [seq, s.open]); }
    await ctx.close(); }
  // ===== 9d-9f. The OPEN larger chart follows its box when the window is resized (GPT's Stage 3 hold)
  if (want(9)) { const K = 5, H = 860;
    const snap = page => page.evaluate(() => { const box = document.getElementById('cen-detail'), svgs = box.querySelectorAll('svg'), s = svgs[0], r = s.getBoundingClientRect(), tb = box.querySelector('.cen-tablebox'), vb = s.viewBox.baseVal.width;
      return { n: svgs.length, vb, w: Math.round(r.width), font: Math.min(...[...s.querySelectorAll('text')].map(t => parseFloat(getComputedStyle(t).fontSize) * r.width / vb)), html: s.outerHTML, top: s.dataset.top, dots: s.querySelectorAll('circle.cen-dot').length,
        open: ME.census.state().open, narrow: ME.census.state().narrow, exp: document.getElementById('cen-card-5').getAttribute('aria-expanded'), others: [...document.querySelectorAll('.cen-card[aria-expanded="true"]')].length, hidden: box.hidden, scaleline: document.getElementById('cen-scaleline').textContent,
        tbTop: tb.scrollTop, row: (() => { const t = tb.getBoundingClientRect().top; const r = [...tb.querySelectorAll('tbody tr')].find(r => r.getBoundingClientRect().bottom > t + 1); return r ? r.querySelector('th').textContent + ':' + Math.round(r.getBoundingClientRect().top - t) : null; })(), rows: tb.querySelectorAll('tbody tr').length, tbSame: tb === window.__tb, hSame: document.getElementById('cen-dh') === window.__h, focus: document.activeElement === tb ? 'table' : (document.activeElement && document.activeElement.id) || document.activeElement.tagName, say: document.getElementById('cen-say').textContent, spy: { ...window.__spy }, over: document.documentElement.scrollWidth - document.documentElement.clientWidth, boxW: box.clientWidth }; });
    const arm = page => page.evaluate(() => { const box = document.getElementById('cen-detail'), tb = box.querySelector('.cen-tablebox'); window.__tb = tb; window.__h = document.getElementById('cen-dh'); tb.focus({ preventScroll: true }); tb.scrollTop = 180;
      window.__spy = { say: 0, focus: 0, into: 0, scrollTo: 0 }; new MutationObserver(() => window.__spy.say++).observe(document.getElementById('cen-say'), { childList: true, characterData: true, subtree: true });
      const f = HTMLElement.prototype.focus; HTMLElement.prototype.focus = function () { window.__spy.focus++; return f.apply(this, arguments); }; const sf = SVGElement.prototype.focus; if (sf) SVGElement.prototype.focus = function () { window.__spy.focus++; return sf.apply(this, arguments); };
      const iv = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function () { window.__spy.into++; return iv.apply(this, arguments); }; for (const n of ['scrollTo', 'scrollBy', 'scroll']) { const o = window[n]; window[n] = function () { window.__spy.scrollTo++; return o.apply(this, arguments); }; } });
    const sameRow = (a, b) => !!a && !!b && a.split(':')[0] === b.split(':')[0] && Math.abs(a.split(':')[1] - b.split(':')[1]) <= 2; // same year at the box's top edge, within 2 px (sub-pixel rounding)
    const settle = async (page, w) => { await page.setViewportSize({ width: w, height: H }); await page.waitForFunction(w => innerWidth === w, w); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120))))); };
    // what a fresh open at each width draws (the reference a resized chart must equal)
    const fresh = {}; for (const w of [1280, 390, 360]) { reset(); const { ctx, page } = await open(browser, { width: w, height: H }); await page.click('#cen-card-' + K); fresh[w] = await snap(page); await ctx.close(); }
    ok('9d reference: opened fresh, the larger chart uses the wide drawing at 1280 px and the narrow drawing at 390 and 360 px, and the two drawings differ', fresh[1280].vb === 720 && fresh[390].vb === 360 && fresh[360].vb === 360 && fresh[1280].html !== fresh[390].html && fresh[390].font >= 9 && fresh[360].font >= 9 && fresh[1280].font >= 9, [fresh[1280].vb, fresh[390].vb, fresh[360].vb, fresh[390].font, fresh[360].font]);
    for (const [name, start, steps] of [['wide first', 1280, [390, 360, 1280]], ['narrow first', 390, [360, 1280, 390]]]) { reset(); const { ctx, page, errs } = await open(browser, { width: start, height: H }); await page.click('#cen-card-' + K); await arm(page); const s0 = await snap(page); const seq = [], bad = [], kept = [];
      for (const w of steps) { await settle(page, w); const s = await snap(page); seq.push(`${w}:${s.vb}/${s.font.toFixed(1)}`);
        if (!(s.n === 1 && s.vb === fresh[w].vb && s.html === fresh[w].html && s.font >= 9 && s.w <= s.boxW + 1 && s.over <= 0)) bad.push([w, s.n, s.vb, +s.font.toFixed(2), s.w, s.boxW, s.over, s.html === fresh[w].html]);
        if (!(s.open === K && s.exp === 'true' && s.others === 1 && !s.hidden && s.top === s0.top && s.dots === s0.dots && s.scaleline === s0.scaleline && s.rows === s0.rows && s.tbSame && s.hSame && sameRow(s.row, s0.row) && s.tbTop > 0 && s.focus === 'table' && s.say === s0.say && s.spy.say === 0 && s.spy.focus === 0 && s.spy.into === 0 && s.spy.scrollTo === 0)) kept.push([w, s.open, s.exp, s.others, s.top, s.dots, s.rows, s.tbSame, s.hSame, s.tbTop, s.row, s0.row, s.focus, s.say, s.spy]); }
      const tag = name === 'wide first' ? ['9d', '9e'] : ['9f', '9f'];
      ok(`${tag[0]} ${name} (${start} → ${steps.join(' → ')} px, chart left open): at every width there is one larger chart, it is exactly the drawing a fresh open gives at that width, its smallest text is at least 9 px as drawn, and nothing overflows`, bad.length === 0 && errs.length === 0 && s0.html === fresh[start].html, [seq.join(' '), bad, errs]);
      ok(`${tag[1]} ${name}: across those resizes the selection, the expanded button, the scale, the same table element scrolled to the same row (the same year at the box's top edge, within 2 px: ${s0.row}; the caption re-wraps, so the raw scroll offset may differ) and the keyboard focus on it are all kept; nothing is announced, nothing is focused and nothing is scrolled by the page`, kept.length === 0 && s0.tbTop > 0 && !!s0.row, kept);
      await page.keyboard.press('Escape'); const e = await state(page); ok(`${tag[1]} ${name}: after the resizes Escape still closes the chart and returns focus to its button`, e.open === -1 && e.focus === 'cen-card-' + K && e.detailHidden, [e.open, e.focus]);
      await ctx.close(); } }
  } catch (e) { fail++; console.log('FAIL  suite error: ' + (e && e.stack || e).toString().slice(0, 900)); }
  await browser.close(); srv.close(); clearTimeout(wd);
  if (BREAK) { const hit = failed.some(n => n.startsWith(EXPECT[BREAK])); console.log(hit ? `BREAK CAUGHT  ${BREAK} (at "${EXPECT[BREAK]}"; ${fail} checks failed)` : `BREAK MISSED  ${BREAK}: expected a failure at "${EXPECT[BREAK]}"; failed: ${failed.slice(0, 6).join(' | ') || 'none'}`); process.exit(hit ? 0 : 1); }
  console.log(`\nanimals-census-ui: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
