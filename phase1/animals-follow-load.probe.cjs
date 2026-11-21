/* Mother Earth — a timing probe, not a test suite (animals-tab-rc, Stage 4 r2; GPT's Stage 4 review, section 4).
 * Question: the Stage 4 packet reported a 32 to 36 s page load, on the software-renderer test machine, for a page opened
 * straight after one that had shown a journey and the corridor. Is that the page, or the machine tearing the previous page down?
 * Method: open animals.html, put it in one of four states (nothing on; a journey; the corridor; both), leave it STATE_MS,
 * then open the next page one of four ways, and time the next page to: DOMContentLoaded, load, the corridor record checked,
 * and the globe ready. Nothing is asserted. It prints one line per run and a table; exit code 0 unless it could not run.
 * Run: NODE_PATH=<node_modules with playwright and globe.gl@2.45.0> node --no-warnings phase1/animals-follow-load.probe.cjs
 *      REPS=2 (default) STATE_MS=1500 GL=swiftshader|default  ONLY=state:way,... to run parts. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
const GLOBE_PATH = process.env.ME_GLOBE_JS || (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(d => path.join(d, 'globe.gl', 'dist', 'globe.gl.min.js')).find(f => fs.existsSync(f));
if (!GLOBE_PATH) { console.log('globe.gl@2.45.0 not found: set ME_GLOBE_JS or put the package on NODE_PATH'); process.exit(1); }
const GLOBE_JS = fs.readFileSync(GLOBE_PATH, 'utf8'), REPS = +(process.env.REPS || 2), STATE_MS = +(process.env.STATE_MS || 1500), ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const f = decodeURIComponent(q.url.split('?')[0]).replace(/^\//, '') || 'index.html', full = path.join(ROOT, f);
  if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); s.end(fs.readFileSync(full)); });
const STATES = ['nothing on', 'journey', 'corridor', 'corridor and journey'], WAYS = ['reload', 'same tab, navigate again', 'new tab, old tab left open', 'old context closed, new context'];
const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.floor((b.length - 1) / 2)] : null; };

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const BASE = 'http://127.0.0.1:' + srv.address().port + '/animals.html';
  const args = process.env.GL === 'default' ? [] : ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  const browser = await chromium.launch({ args });
  const newCtx = async () => { const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS })); await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' })); await ctx.route('**/*.nasa.gov/**', r => r.abort()); return ctx; };
  /** time one page from the start of the navigation; `go` performs it */
  const timed = async (page, go) => { const t0 = Date.now(), out = {}; const dcl = page.waitForEvent('domcontentloaded', { timeout: 180000 }).then(() => { out.dcl = Date.now() - t0; }), ld = page.waitForEvent('load', { timeout: 180000 }).then(() => { out.load = Date.now() - t0; });
    await go(); await dcl; await page.waitForFunction(() => window.ME && ME.corridor && ME.corridor.state().facts !== 'loading', null, { timeout: 180000 }); out.record = Date.now() - t0;
    await page.waitForFunction(() => window.ME && ME.globe && ME.globe(), null, { timeout: 180000 }).then(() => { out.globe = Date.now() - t0; }, () => { out.globe = null; }); await ld.catch(() => { }); return out; };
  const put = async (page, state) => { if (state.includes('journey')) { await page.click('#tgl-zebra-botswana-Z3866'); await page.waitForFunction(() => ME.journey.state().status === 'ready', null, { timeout: 120000 }); }
    if (state.includes('corridor')) { await page.click('#cor-tgl'); await page.waitForFunction(() => ME.corridor.state().status === 'shown', null, { timeout: 120000 }); } await page.waitForTimeout(STATE_MS); };
  const rows = [];
  for (const way of WAYS) for (const state of STATES) { if (ONLY.length && !ONLY.includes(`${STATES.indexOf(state)}:${WAYS.indexOf(way)}`)) continue;
    for (let rep = 0; rep < REPS; rep++) { let ctx = await newCtx(), page = await ctx.newPage(); const first = await timed(page, () => page.goto(BASE, { waitUntil: 'commit', timeout: 180000 })); await put(page, state); let next;
      if (way === 'reload') next = await timed(page, () => page.reload({ waitUntil: 'commit', timeout: 180000 }));
      else if (way === 'same tab, navigate again') next = await timed(page, () => page.goto(BASE + '?again=' + rep, { waitUntil: 'commit', timeout: 180000 }));
      else if (way === 'new tab, old tab left open') { const p2 = await ctx.newPage(); next = await timed(p2, () => p2.goto(BASE, { waitUntil: 'commit', timeout: 180000 })); }
      else { const t = Date.now(); await ctx.close(); const closeMs = Date.now() - t; ctx = await newCtx(); page = await ctx.newPage(); next = await timed(page, () => page.goto(BASE, { waitUntil: 'commit', timeout: 180000 })); next.close = closeMs; }
      rows.push({ way, state, rep, first, next }); console.log(JSON.stringify({ way, state, rep, first, next })); await ctx.close(); } }
  await browser.close(); srv.close();
  console.log('\nmedian ms over ' + REPS + ' runs: the following page (and, for comparison, the first page of the same run)');
  console.log(['way', 'state before', 'DOM ready', 'load', 'record checked', 'globe ready', 'first page: globe ready'].join(' | '));
  for (const way of WAYS) for (const state of STATES) { const r = rows.filter(x => x.way === way && x.state === state); if (!r.length) continue; const m = k => med(r.map(x => x.next[k]).filter(v => v != null));
    console.log([way, state, m('dcl'), m('load'), m('record'), m('globe'), med(r.map(x => x.first.globe).filter(v => v != null))].join(' | ')); }
  process.exit(0);
})().catch(e => { console.log('probe could not run: ' + (e && e.stack || e)); process.exit(1); });
