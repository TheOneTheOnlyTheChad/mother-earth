/* Mother Earth — the Key counts and names every layer that is drawn (smoke-key-hint-rc, 18 Nov 2026;
 * docs/concepts/SMOKE-KEY-HINT-PROPOSAL.md rev 2, part 2).
 * The REAL page files in Chromium, served by this suite's own server; the hub is a fixture (aircraft counts and positions,
 * a wind run, a Dust RGB frame, the orbital file). What it proves:
 *   - aircraft counts, aircraft positions, wind and Dust RGB each count as one Key layer, and have a one-line Key entry, while
 *     their own picture is on the globe, and only then: still loading, failed with nothing drawn, a snapshot with nothing in it,
 *     expired, cleared or off do not count; a refresh that fails while the earlier picture stays drawn still counts;
 *   - the empty sentence ("No layer data is drawn on the globe right now.") shows only when no layer at all is drawn, so it is
 *     also gone with day/night alone or one orbital group alone;
 *   - each layer repaints the Key itself: every step is checked with no other map render in between (the page's own render
 *     count is read before and after), so an unrelated render cannot hide a missing repaint;
 *   - ME.paintKeyExternal repaints the count, the entries and the sentence together.
 * What it does NOT prove: Ocean Heat and Night lights are not switched on with their real pictures here (their own suites do
 * that); their callers are covered through the ME.paintKeyExternal check only. No real phone, no screen reader.
 * Run: NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules node --no-warnings phase1/key-drawn-ui.test.cjs
 *      (needs /home/claude/fixtures/orbital.csv + orbital-meta.json from phase1/orbital-fixture.build.mjs)
 * Breaks (each must fail): BREAK=drop-aircraft|drop-airdots|drop-wind|drop-dustrgb|old-none-rule|count-only-repaint|
 *   no-repaint-air|no-repaint-dots|no-repaint-wind|no-repaint-dust|failed-refresh-uncounted|zero-counts|on-means-drawn|night-count-only|orb-count-only */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto');
const { PNG } = require('pngjs');
const ROOT = path.join(__dirname, '..'), HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const SATJS = fs.readFileSync('/home/claude/spike/node_modules/satellite.js/dist/satellite.min.js', 'utf8');
const CSV = fs.readFileSync('/home/claude/fixtures/orbital.csv', 'utf8'), META = JSON.parse(fs.readFileSync('/home/claude/fixtures/orbital-meta.json', 'utf8'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 12 min'); process.exit(1); }, 12 * 60e3);

const KR = '    keyRepaint();\n';
const BREAKS = {
  'drop-aircraft': ['index.html', "['aircraft', () => ME.aircraft && ME.aircraft.drawn()]", "['aircraft', () => false]"],
  'drop-airdots': ['index.html', "['airdots', () => ME.aircraft && ME.aircraft.dots.drawn()]", "['airdots', () => false]"],
  'drop-wind': ['index.html', "['wind', () => ME.wind && ME.wind.drawn()]", "['wind', () => false]"],
  'drop-dustrgb': ['index.html', "['dustrgb', () => ME.dustRgb && ME.dustRgb.drawn()]", "['dustrgb', () => false]"],
  'old-none-rule': ['index.html', "$('leg-none').hidden = d.length > 0;", "$('leg-none').hidden = ['usgs', 'firms', 'ships', 'drifters', 'plastic', 'forest'].some(k => !$('leg-' + k).hidden);"],   // main's rule: only the six data layers
  'count-only-repaint': ['index.html', 'ME.paintKeyExternal = () => { try { paintLegend(); paintKey(); } catch (_) { } };', 'ME.paintKeyExternal = () => { try { paintKey(); } catch (_) { } };'],   // main's repaint
  'no-repaint-air': ['aircraft.js', "  function paint() {\n" + KR, "  function paint() {\n"],
  'no-repaint-dots': ['aircraft.js', "  function dotsPaint() {\n" + KR, "  function dotsPaint() {\n"],
  'no-repaint-wind': ['wind.js', "  function paint() {\n" + KR, "  function paint() {\n"],
  'no-repaint-dust': ['dustrgb.js', "  function paint() {\n" + KR, "  function paint() {\n"],
  'failed-refresh-uncounted': ['aircraft.js', "(st.meshes[0].material.map.image.__air || {}).drawn > 0)", "(st.meshes[0].material.map.image.__air || {}).drawn > 0 && !st.refreshFailed)"],
  'zero-counts': ['aircraft.js', "(st.meshes[0].material.map.image.__air || {}).drawn > 0)", "true)"],
  'on-means-drawn': ['wind.js', "drawn: () => st.meshes.some(m => m.parent),", "drawn: () => st.on,"],
  'night-count-only': ['index.html', "  if (!show && night.why) { t.hidden = false; t.innerHTML = `<b>${esc(night.why)}</b>`; }\n  paintLegend(); paintKey();", "  if (!show && night.why) { t.hidden = false; t.innerHTML = `<b>${esc(night.why)}</b>`; }\n  paintKey();"],
  'orb-count-only': ['index.html', "  if (!lg.hidden) lg.innerHTML = ME.orbLegend(drawnOn, orb.at);\n  paintLegend(); paintKey();", "  if (!lg.hidden) lg.innerHTML = ME.orbLegend(drawnOn, orb.at);\n  paintKey();"],
};
if (BREAK && !BREAKS[BREAK]) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); }
const served = f => { let t = fs.readFileSync(path.join(ROOT, f), 'utf8'); if (BREAK && BREAKS[BREAK][0] === f) { const [, a, b] = BREAKS[BREAK]; if (t.split(a).length !== 2) { console.log('FAIL  break did not apply: ' + BREAK); process.exit(1); } t = t.replace(a, b); } return t; };

// ---------- fixtures
const EMPTY = 'No layer data is drawn on the globe right now.';
const ENT = { aircraft: 'Aircraft counts per area — scale on its card', airdots: 'Aircraft positions — plain dots — snapshot details on its card', wind: 'Wind by height — scale on its card', dustrgb: 'Dust RGB — false-colour imagery — explanation on its card' };
const BACKDROP = (() => { const p = new PNG({ width: 64, height: 32 }); for (let i = 0; i < p.data.length; i += 4) { p.data[i] = 10; p.data[i + 1] = 30; p.data[i + 2] = 60; p.data[i + 3] = 255; } return PNG.sync.write(p); })();
// aircraft: one snapshot, twenty minutes before the page's aircraft clock
const AT = '2026-11-17T12:00:00.000Z', ANOW = Date.parse(AT) + 20 * 60e3;
const airBase = { layer: 'opensky', schema_version: 1, source_status: 'ok', retrieved_at: AT, window_end: AT, position_age_cutoff_s: 300, stale_after_s: 10800, position_precision_deg: 0.01 };
const AIR = { ...airBase, cells: { '30_50': { count: 12 }, '31_50': { count: 3 }, '14_49': { count: 1 } }, record_fields: [], records: [] };
const AIR_NEWER = { ...AIR, window_end: '2026-11-17T12:10:00.000Z', retrieved_at: '2026-11-17T12:10:00.000Z' };
const AIR_ZERO = { ...airBase, cells: {}, record_fields: [], records: [] };
const DOTS = { ...airBase, cells: AIR.cells, record_fields: ['lat', 'lng'], records: [[51.5, -0.1], [-33.9, 18.4], [40.7, -74]] };
const DOTS_ZERO = { ...airBase, cells: {}, record_fields: ['lat', 'lng'], records: [] };
// wind: one run, 18 km/h from the west everywhere
const GRID = (() => { const b = Buffer.alloc(360 * 181 * 4); for (let k = 0; k < 360 * 181; k++) { b.writeInt16LE(50, k * 4); b.writeInt16LE(0, k * 4 + 2); } return b; })();
const WT = '2026-11-16T00:00:00Z', WNOW = Date.parse(WT) + 3600e3;
const WREV = { run: '2026111600', run_time: WT, valid_time: WT, forecast_hour: 0, times: { index_first_seen: WT, fields_fetched: WT, published: WT }, source: { credit: 'NOAA/NCEP GFS' },
  levels: ['near-ground', '250hPa', '10hPa'].map(id => ({ id, file: sha(GRID) + '.i16', path: `/snapshot/wind/grid/${sha(GRID)}.i16`, bytes: GRID.length, sha256: sha(GRID) })) };
// Dust RGB: one frame (the dust suite's own picture and a disc-shaped mask)
const PIC = fs.readFileSync(path.join(__dirname, 'dustrgb-fixtures/picture-a.jpg'));
const MASK = (() => { const p = new PNG({ width: 160, height: 160 }); for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) { const i = (y * 160 + x) * 4, inside = Math.hypot(x - 79.5, y - 79.5) <= 72; p.data[i] = 90; p.data[i + 1] = 90; p.data[i + 2] = 200; p.data[i + 3] = inside ? 255 : 0; } return PNG.sync.write(p); })();
const DT_ = '2026-11-12T16:50:00Z', DNOW = Date.parse(DT_) + 3600e3;
const DID = DT_.replace(/[-:]/g, '').replace(/00Z$/, 'Z') + '-' + sha(Buffer.from(sha(PIC) + ':' + sha(MASK))).slice(0, 16);
const DFRAME = { id: DID, requested_time: DT_, served_time: null, served_time_source: null, time_basis: 'requested time only', fetched_at: DT_, box: { south: -80, west: -80, north: 80, east: 80 }, crs: 'EPSG:4326',
  picture: { file: 'picture.jpg', path: `/snapshot/dustrgb/${DID}/picture.jpg`, type: 'image/jpeg', bytes: PIC.length, sha256: sha(PIC), w: 2048, h: 2048 },
  mask: { file: 'mask.png', path: `/snapshot/dustrgb/${DID}/mask.png`, type: 'image/png', bytes: MASK.length, sha256: sha(MASK), w: 160, h: 160 } };
const newHub = () => ({ air: AIR, dots: DOTS, airStatus: 200, dotsStatus: 200, windStatus: 200, dustStatus: 200, hold: null });

let BASE;
async function setup(browser, hub, vp = { width: 1280, height: 860 }) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/cdn.jsdelivr.net/npm/satellite.js@6.0.2/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: SATJS, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/*.nasa.gov/**', r => r.abort());
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: BACKDROP }));
  const NOW = new Date().toISOString();
  await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const H = { 'access-control-allow-origin': '*' };
    const j = (b, s = 200) => route.fulfill({ status: s, contentType: 'application/json', headers: H, body: JSON.stringify(b) });
    if (p === '/cells/opensky') { if (hub.hold) await hub.hold; return hub.airStatus === 200 ? j(hub.air) : j({ status: 'unavailable' }, hub.airStatus); }
    if (p === '/snapshot/opensky') return hub.dotsStatus === 200 ? j(hub.dots) : j({ status: 'unavailable' }, hub.dotsStatus);
    if (p === '/snapshot/wind/meta') return hub.windStatus === 200 ? j({ schema: 1, layer: 'wind', current: WREV, previous: null, last_attempt: null, source: { credit: 'NOAA/NCEP GFS' }, now: NOW }) : j({ status: 'unavailable' }, hub.windStatus);
    if (p.startsWith('/snapshot/wind/grid/')) return route.fulfill({ status: 200, contentType: 'application/octet-stream', headers: H, body: GRID });
    if (p === '/snapshot/dustrgb/meta') return hub.dustStatus === 200 ? j({ schema: 1, layer: 'dustrgb', frame: DFRAME, previous: null, last_attempt: null, cadence: { runs_utc: [6, 18] }, now: NOW }) : j({ status: 'unavailable' }, hub.dustStatus);
    if (p.startsWith('/snapshot/dustrgb/')) return route.fulfill({ status: 200, contentType: p.endsWith('.jpg') ? 'image/jpeg' : 'image/png', headers: H, body: p.endsWith('.jpg') ? PIC : MASK });
    if (p === '/snapshot/orbital') return j(META);
    if (p === '/elements/orbital') return route.fulfill({ status: 200, contentType: 'text/csv', body: CSV, headers: { ...H, 'X-Elements-SHA256': META.elements.sha256, 'Access-Control-Expose-Headers': 'X-Elements-SHA256' } });
    if (p === '/status') return j({ last_runs: [{ layer: 'orbital', started_at: new Date(Date.now() - 1800e3).toISOString(), status: 'ok' }] });
    if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } });
    j({ layer: p.split('/').pop(), retrieved_at: NOW, stale_after_s: 10800, source_status: 'ok', cells: {}, record_format: 'rows', record_fields: [], records: [], quantity: 'q', sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW }, index: null }); });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.loadedAt && ME.wind && ME.aircraft && ME.dustRgb, null, { timeout: 30000 });
  await page.waitForFunction(() => { const g = ME.globe && ME.globe(); if (!g) return false; let ok = false; g.scene().traverse(o => { if (o.isMesh && o.material === g.globeMaterial() && o.material.map) ok = true; }); return ok; }, null, { timeout: 30000 });
  // the page's own map renders are counted: render() hands the cells to polygonsData once each time it runs
  await page.evaluate(([a, w, d]) => { const g = ME.globe(), real = g.polygonsData.bind(g); window.__renders = 0; g.polygonsData = function (...x) { if (x.length) window.__renders++; return real(...x); };
    ME.aircraft.opts.now = a; ME.wind.opts.now = () => w; ME.dustRgb.opts.now = () => d; }, [ANOW, WNOW, DNOW]);
  // the first reads of the core layers have settled: no map render for two seconds running (not a fixed wait, so a slow machine cannot leave one for a later step)
  for (let last = -1, t0 = Date.now(); Date.now() - t0 < 60000;) { const n = await page.evaluate(() => window.__renders); if (n === last) break; last = n; await page.waitForTimeout(2000); }
  return { ctx, page, errs };
}
/** What a reader sees in the Key, and what the page says is drawn. */
const read = page => page.evaluate(() => ({ n: document.getElementById('key-n').textContent, drawn: ME.keyState().drawn, line: ME.legendState().line, empty: ME.legendState().empty, renders: window.__renders }));
const airIdle = page => page.waitForFunction(() => !ME.aircraft.state().loading && !ME.aircraft.dots.state().loading, null, { timeout: 20000 });
const windIdle = page => page.waitForFunction(() => !ME.wind.state().loading && ME.wind.state().status !== 'loading', null, { timeout: 20000 });
const dustIdle = page => page.waitForFunction(() => !ME.dustRgb.state().loading && ME.dustRgb.state().status !== 'loading', null, { timeout: 20000 });
const one = k => r => r.n === '1 layer' && r.drawn.join() === k && r.line === ENT[k] && !r.empty;
const none = r => r.n === '0 layers' && r.drawn.length === 0 && r.line === EMPTY && r.empty;

(async () => {
  const srv = http.createServer((q, r) => { const f = decodeURIComponent(q.url.split('?')[0]).replace(/^\//, '') || 'index.html'; const full = path.join(ROOT, f);
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) { r.writeHead(404); return r.end(); }
    const type = { html: 'text/html', js: 'application/javascript', css: 'text/css', json: 'application/json', png: 'image/png', jpg: 'image/jpeg' }[f.split('.').pop()] || 'application/octet-stream';
    r.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); r.end(/\.(js|html|css)$/.test(f) ? served(f) : fs.readFileSync(full)); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); BASE = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  /** Runs one step and checks that the page made no map render of its own during it, so the Key change seen is the layer's own repaint. */
  const step = async (page, name, act) => { const r0 = (await read(page)).renders; await act(); const r = await read(page); ok(`${name}: no other map render happened during this step`, r.renders === r0, [r0, r.renders]); return r; };

  // ===== A. aircraft counts and positions
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub); let r = await read(page);
    ok('A bare page: nothing counted, the sentence is shown and is the new wording', none(r), r);
    let release; hub.hold = new Promise(f => { release = f; });
    r = await step(page, 'A counts loading', async () => { await page.click('#tgl-air'); await page.waitForFunction(() => ME.aircraft.state().loading, null, { timeout: 5000 }); });
    ok('A counts switched on and still loading: not counted, no entry, the sentence stays', none(r) && (await page.evaluate(() => ME.aircraft.state().on)), r);
    r = await step(page, 'A counts drawn', async () => { release(); hub.hold = null; await airIdle(page); });
    ok('A counts drawn: 1 layer, its entry, no sentence', one('aircraft')(r) && (await page.evaluate(() => ME.aircraft.state().inScene)) === 1, r);
    hub.airStatus = 503;
    r = await step(page, 'A counts refresh failed', async () => { await page.evaluate(() => ME.aircraft.refresh()); await airIdle(page); });
    const fs1 = await page.evaluate(() => ME.aircraft.state());
    ok('A a refresh that fails keeps the earlier picture on the globe and says so', fs1.refreshFailed === true && fs1.inScene === 1 && /Refresh unavailable\./.test(fs1.extra || ''), fs1);
    ok('A …and the layer is still counted, with its entry', one('aircraft')(r), r);
    hub.airStatus = 200;
    r = await step(page, 'A counts → positions', async () => { await page.click('#tgl-airdots'); await airIdle(page); });
    ok('A counts → positions: still 1 layer, the positions entry replaces the counts entry', one('airdots')(r) && (await page.evaluate(() => ME.aircraft.state().on)) === false, r);
    r = await step(page, 'A positions → counts', async () => { await page.click('#tgl-air'); await airIdle(page); });
    ok('A positions → counts: still 1 layer, the counts entry is back', one('aircraft')(r), r);
    r = await step(page, 'A counts expire', async () => { await page.evaluate(t => { ME.aircraft.opts.now = t; ME.aircraft.ageTick(); }, ANOW + 7 * 3600e3); });
    ok('A the counts expire (six hours) and are cleared: not counted, the sentence is back', none(r) && (await page.evaluate(() => ME.aircraft.state().inScene)) === 0, r);
    await page.evaluate(t => { ME.aircraft.opts.now = t; }, ANOW);
    r = await step(page, 'A counts off', async () => { await page.click('#tgl-air'); });
    ok('A counts off: nothing counted', none(r), r);
    r = await step(page, 'A positions on', async () => { await page.click('#tgl-airdots'); await airIdle(page); });
    ok('A positions drawn alone: 1 layer, its entry', one('airdots')(r), r);
    r = await step(page, 'A positions expire', async () => { await page.evaluate(t => { ME.aircraft.opts.now = t; ME.aircraft.dots.ageTick(); }, ANOW + 4 * 3600e3); });
    ok('A the positions expire (three hours) and are cleared: not counted, the sentence is back', none(r) && (await page.evaluate(() => ME.aircraft.dots.state().inScene)) === 0, r);
    await page.evaluate(t => { ME.aircraft.opts.now = t; }, ANOW);
    await page.click('#tgl-airdots'); r = await read(page); ok('A positions off: nothing counted', none(r), r);
    // first load fails: nothing was ever drawn
    hub.airStatus = 503;
    r = await step(page, 'A counts first load fails', async () => { await page.click('#tgl-air'); await airIdle(page); });
    ok('A counts switched on, first load failed: on, nothing drawn, not counted, the sentence stays', none(r) && (await page.evaluate(() => { const s = ME.aircraft.state(); return s.on && s.inScene === 0 && s.stateWord === 'unknown'; })), r);
    await page.click('#tgl-air'); hub.airStatus = 200;
    hub.dotsStatus = 503;
    r = await step(page, 'A positions first load fails', async () => { await page.click('#tgl-airdots'); await airIdle(page); });
    ok('A positions switched on, first load failed: not counted, the sentence stays', none(r) && (await page.evaluate(() => ME.aircraft.dots.state().on)), r);
    await page.click('#tgl-airdots'); hub.dotsStatus = 200;
    // a valid snapshot with no aircraft in it
    hub.air = AIR_ZERO;
    r = await step(page, 'A zero aircraft', async () => { await page.click('#tgl-air'); await airIdle(page); });
    const z = await page.evaluate(() => ME.aircraft.state());
    ok('A a valid snapshot with no aircraft: loaded, nothing coloured', z.total === 0 && z.stateWord === 'loaded' && (!z.drawn || z.drawn.drawn === 0), z);
    ok('A …so it is not counted and the sentence stays', none(r), r);
    hub.air = AIR_NEWER;
    r = await step(page, 'A zero → aircraft', async () => { await page.evaluate(() => ME.aircraft.refresh()); await airIdle(page); });
    ok('A the next snapshot has aircraft: counted from that refresh on', one('aircraft')(r), r);
    await page.click('#tgl-air'); hub.dots = DOTS_ZERO;
    r = await step(page, 'A zero positions', async () => { await page.click('#tgl-airdots'); await airIdle(page); });
    ok('A a positions file with no positions in it: not counted, the sentence stays', none(r), r);
    ok('A no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== B. wind
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub);
    let r = await step(page, 'B wind on', async () => { await page.click('#tgl-wind'); await windIdle(page); });
    ok('B wind drawn: 1 layer, its entry, no sentence', one('wind')(r) && (await page.evaluate(() => ME.wind.state().inScene)) === 1, r);
    hub.windStatus = 503;
    r = await step(page, 'B wind refresh failed', async () => { await page.evaluate(() => ME.wind.refresh()); await windIdle(page); });
    const s = await page.evaluate(() => ME.wind.state());
    ok('B a refresh that fails keeps the field on the globe; wind is still counted, with its entry', s.refreshFailed === true && s.inScene === 1 && one('wind')(r), [s.refreshFailed, s.inScene, r]);
    r = await step(page, 'B wind off', async () => { await page.click('#tgl-wind'); });
    ok('B wind off: nothing counted, the sentence is back', none(r), r);
    r = await step(page, 'B wind first load fails', async () => { await page.click('#tgl-wind'); await windIdle(page); });
    ok('B wind switched on, first load failed: on, nothing drawn, not counted, the sentence stays', none(r) && (await page.evaluate(() => { const s = ME.wind.state(); return s.on && s.inScene === 0; })), r);
    hub.windStatus = 200;
    r = await step(page, 'B wind recovers', async () => { await page.evaluate(() => ME.wind.refresh()); await windIdle(page); await page.waitForFunction(() => ME.wind.state().inScene === 1, null, { timeout: 20000 }); });
    ok('B the next refresh draws the field: counted from then on', one('wind')(r), r);
    r = await step(page, 'B wind expires', async () => { await page.evaluate(t => { ME.wind.opts.now = () => t; ME.wind.ageTick(); }, WNOW + 30 * 3600e3); });
    ok('B the field expires and is cleared: not counted, the sentence is back', none(r), r);
    ok('B no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== C. Dust RGB
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub);
    let r = await step(page, 'C dust on', async () => { await page.click('#tgl-dustrgb'); await dustIdle(page); });
    ok('C Dust RGB drawn: 1 layer, its entry, no sentence', one('dustrgb')(r) && (await page.evaluate(() => ME.dustRgb.state().inScene)) === 1, r);
    hub.dustStatus = 503;
    r = await step(page, 'C dust refresh failed', async () => { await page.evaluate(() => ME.dustRgb.refresh()); await dustIdle(page); });
    const s = await page.evaluate(() => ME.dustRgb.state());
    ok('C a refresh that fails keeps the frame on the globe; Dust RGB is still counted, with its entry', s.refreshFailed === true && s.inScene === 1 && one('dustrgb')(r), [s.refreshFailed, s.inScene, r]);
    r = await step(page, 'C dust expires', async () => { await page.evaluate(t => { ME.dustRgb.opts.now = () => t; ME.dustRgb.ageTick(); }, DNOW + 200 * 3600e3); });
    ok('C the frame expires and is cleared: not counted, the sentence is back', none(r) && (await page.evaluate(() => ME.dustRgb.state().inScene)) === 0, r);
    await page.evaluate(t => { ME.dustRgb.opts.now = () => t; }, DNOW);
    await page.click('#tgl-dustrgb');
    r = await step(page, 'C dust first load fails', async () => { await page.click('#tgl-dustrgb'); await dustIdle(page); });
    ok('C Dust RGB switched on, first load failed: on, nothing drawn, not counted, the sentence stays', none(r) && (await page.evaluate(() => { const s = ME.dustRgb.state(); return s.on && s.inScene === 0; })), r);
    ok('C no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== D. several at once, "Switch everything off", and the full repaint
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub);
    await page.click('#tgl-air'); await airIdle(page); await page.click('#tgl-wind'); await windIdle(page); await page.click('#tgl-dustrgb'); await dustIdle(page);
    let r = await read(page);
    ok('D counts + wind + Dust RGB: 3 layers, three entries joined in one line, no sentence', r.n === '3 layers' && r.drawn.join() === 'aircraft,wind,dustrgb' && r.line === [ENT.aircraft, ENT.wind, ENT.dustrgb].join(' · ') && !r.empty, r);
    // ME.paintKeyExternal repaints count, entries and sentence: spoil all three by hand, then call it as Ocean Heat and Night lights do
    await page.evaluate(() => { document.getElementById('key-n').textContent = '9 layers'; document.getElementById('leg-wind').hidden = true; document.getElementById('leg-none').hidden = false; });
    r = await step(page, 'D paintKeyExternal', async () => { await page.evaluate(() => ME.paintKeyExternal()); });
    ok('D ME.paintKeyExternal puts the count, the entries and the sentence right together', r.n === '3 layers' && r.line === [ENT.aircraft, ENT.wind, ENT.dustrgb].join(' · ') && !r.empty, r);
    await page.click('#layers-btn'); await page.click('#layers-off'); await page.waitForTimeout(300); r = await read(page);
    ok('D "Switch everything off": nothing counted, the sentence is back', none(r) && (await page.evaluate(() => !ME.aircraft.state().on && !ME.wind.state().on && !ME.dustRgb.state().on)), r);
    ok('D no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== E. the sentence with an existing overlay alone, and with one orbital group alone
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub);
    let r = await step(page, 'E day/night on', async () => { await page.click('#tgl-night'); await page.waitForFunction(() => !document.getElementById('night-legend').hidden, null, { timeout: 15000 }); });
    ok('E day/night alone: 1 layer, no entry in the data line, and the sentence is NOT shown', r.n === '1 layer' && r.drawn.join() === 'daynight' && r.line === '' && !r.empty, r);
    r = await step(page, 'E day/night off', async () => { await page.click('#tgl-night'); });
    ok('E day/night off: the sentence is back', none(r), r);
    await page.waitForFunction(() => [...document.querySelectorAll('#orb-tgls [data-g]')].every(b => b.getAttribute('aria-busy') !== 'true'), null, { timeout: 60000 });
    await page.click('#orb-tgls [data-g="debris"]');
    await page.waitForFunction(() => ME.keyState().drawn.includes('orbital:debris'), null, { timeout: 90000 }).catch(() => { });
    await page.waitForTimeout(300); r = await read(page);
    ok('E one orbital group alone: 1 layer and the sentence is NOT shown', r.n === '1 layer' && r.drawn.join() === 'orbital:debris' && r.line === '' && !r.empty, r);
    await page.click('#orb-tgls [data-g="debris"]'); await page.waitForFunction(() => ME.keyState().drawn.length === 0, null, { timeout: 15000 }).catch(() => { }); r = await read(page);
    ok('E orbital off: the sentence is back', none(r), r);
    ok('E no page errors', errs.length === 0, errs); await ctx.close(); }

  // ===== F. phone width: the Key button counts the same layers
  { const hub = newHub(); const { ctx, page, errs } = await setup(browser, hub, { width: 390, height: 844 });
    ok('F 390 px bare: "Key · 0 layers"', (await page.evaluate(() => ME.keyState().label)) === 'Key · 0 layers');
    await page.evaluate(() => document.getElementById('tgl-airdots').click()); await airIdle(page);
    ok('F 390 px, positions drawn: "Key · 1 layer" while Layers says 1 on', (await page.evaluate(() => [ME.keyState().label, document.getElementById('layers-n').textContent])).join('|') === 'Key · 1 layer|1 on', await page.evaluate(() => [ME.keyState().label, document.getElementById('layers-n').textContent]));
    ok('F no page errors', errs.length === 0, errs); await ctx.close(); }

  await browser.close(); srv.close(); clearTimeout(wd);
  console.log(`\nkey-drawn-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  suite threw: ' + (e && e.stack || e)); process.exit(1); });
