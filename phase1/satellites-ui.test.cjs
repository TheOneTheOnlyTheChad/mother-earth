/* Mother Earth — satellites overlay: bounded browser suite (thread 7, 3 Nov 2026).
 *
 * Real globe.gl 2.45.0 and real satellite.js 6.0.2 (served from node_modules at the pinned versions), real SwiftShader
 * WebGL, real timers. The hub is routed: other layers get small fixtures; satellites get the FROZEN CelesTrak active file
 * (2 Nov 2026, 16,847 rows, sha256 2c5c78ab…) and a meta envelope shaped exactly like collector 0.2.2 writes it.
 * This tests the page's behaviour and failure paths, not CelesTrak and not the live hub.
 *
 * Needs:  python3 -m http.server 8899 --bind 127.0.0.1   in the clone
 *         cd /home/claude/spike && npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs
 * Run:    node phase1/satellites-ui.test.cjs <path to frozen celestrak-active-gp.csv>
 */
const { chromium } = require('playwright');
const fs = require('fs');
const crypto = require('crypto');
const satellite = require('/home/claude/spike/node_modules/satellite.js');
const BASE = 'http://127.0.0.1:8899';
const HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const SATJS = fs.readFileSync('/home/claude/spike/node_modules/satellite.js/dist/satellite.min.js', 'utf8');
const SATJS_VER = JSON.parse(fs.readFileSync('/home/claude/spike/node_modules/satellite.js/package.json', 'utf8')).version;
const GLOBE_VER = JSON.parse(fs.readFileSync('/home/claude/spike/node_modules/globe.gl/package.json', 'utf8')).version;
const INDEX = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const APP = fs.readFileSync(__dirname + '/../app.js', 'utf8');
const D = JSON.parse(fs.readFileSync(__dirname + '/realdata/live-sample.json', 'utf8'));
const CSV = fs.readFileSync(process.argv[2], 'utf8');
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
const ROWS = CSV.split('\n').length - 2;
const HEADER = CSV.slice(0, CSV.indexOf('\n')).replace(/\r$/, '');
const meta = (csv, o = {}) => ({ schema_version: 1, collector_version: '0.2.2', layer: 'satellites', tier: 'model', retrieved_at: '2026-11-02T14:26:53.100Z', source_stamp: '2026-11-02T14:24:24.000Z', source_status: 'ok', stale_after_s: 93600,
  elements: { path: '/elements/satellites', format: 'OMM-keyword CSV (CelesTrak GP)', rows: csv.split('\n').length - 2, bytes: Buffer.byteLength(csv), sha256: sha(csv), header: HEADER }, ...o });

const BUDGET_MS = 9 * 60e3;
const watchdog = setTimeout(() => { console.log(`\nFAIL  suite exceeded its ${BUDGET_MS / 1000}s budget — treated as a failure, not a hang`); process.exit(1); }, BUDGET_MS);
let pass = 0, fail = 0;
const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 600)}` : ''}`); } };
const T0 = Date.now(); const mark = t => console.log(`   [${((Date.now() - T0) / 1000).toFixed(0)}s] ${t}`);
const RUN = '2026-11-03T05:50:00Z';

async function harness(browser, o = {}) {
  const { viewport = { width: 1280, height: 860 }, isMobile = false, noWebGL = false, sat = {} } = o;
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, reducedMotion: 'reduce' });
  const hits = { meta: 0, csv: 0, satjs: 0, celestrak: 0 };
  const cur = { csv: sat.csv || CSV, meta: sat.meta || null, metaStatus: sat.metaStatus || 200, csvBody: sat.csvBody || null, blockSatjs: !!sat.blockSatjs };
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/cdn.jsdelivr.net/npm/satellite.js@6.0.2/**', r => { hits.satjs++; return cur.blockSatjs ? r.abort() : r.fulfill({ status: 200, contentType: 'application/javascript', body: SATJS, headers: { 'Access-Control-Allow-Origin': '*' } }); });
  await ctx.route('**/celestrak.org/**', r => { hits.celestrak++; return r.abort(); });
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
  await ctx.route(HUB + '/**', route => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/snapshot/satellites') { hits.meta++; return cur.metaStatus !== 200 ? route.fulfill({ status: cur.metaStatus, contentType: 'application/json', body: '{"error":"no snapshot yet"}' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cur.meta || meta(cur.csv)) }); }
    if (p === '/elements/satellites') { hits.csv++; return route.fulfill({ status: 200, contentType: 'text/csv', body: cur.csvBody || cur.csv }); }
    const body = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: D.usgs.map(([lat, lng, mag, t, ob]) => ['x', lat, lng, 10, mag, 'mb', ob, t, '']) }
      : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { '14_49': { count: 50, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } }
      : { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  if (noWebGL) await ctx.addInitScript(() => { const r = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : r.call(this, t, ...a); }; });
  const page = await ctx.newPage();
  const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.satState && ME.pairState, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  return { ctx, page, perr, hits, cur };
}
const st = page => page.evaluate(() => ME.satState());
const openExplore = async page => { if (await page.locator('#exp-btn').getAttribute('aria-expanded') !== 'true') await page.click('#exp-btn'); };
async function enable(page, timeout = 60000) {
  await openExplore(page); await page.click('#tgl-sat');
  await page.waitForFunction(() => { const s = ME.satState(); return (s.on && s.last) || (!s.on && !s.busy && s.why); }, null, { timeout });
  return st(page);
}

// Independent reference, in Node: what the page should report for ONE pass at time `at`.
function reference(csv, at) {
  const L = csv.trim().split(/\r?\n/); const h = L[0].split(','); const NUM = new Set(['MEAN_MOTION', 'ECCENTRICITY', 'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'MEAN_ANOMALY', 'EPHEMERIS_TYPE', 'NORAD_CAT_ID', 'ELEMENT_SET_NO', 'REV_AT_EPOCH', 'BSTAR', 'MEAN_MOTION_DOT', 'MEAN_MOTION_DDOT']);
  const t = Date.parse(at), d = new Date(t), gm = satellite.gstime(d); let stale = 0, drawn = 0, beyond = 0; const first = [];
  for (let i = 1; i < L.length; i++) {
    const c = L[i].split(','); const o = {}; h.forEach((k, j) => o[k] = NUM.has(k) ? +c[j] : c[j]);
    if (t - Date.parse(o.EPOCH + 'Z') > 3 * 86400e3) stale++;
    const s = satellite.json2satrec(o); const pv = satellite.propagate(s, d); const p = pv && pv.position;
    if (!p || !isFinite(p.x)) continue;
    const g = satellite.eciToGeodetic(p, gm); drawn++; if (g.height > 35786) beyond++;
    if (first.length < 3) first.push({ lat: g.latitude * 180 / Math.PI, lng: g.longitude * 180 / Math.PI, alt: g.height / 6371 });
  }
  return { stale, drawn, beyond, first };
}

(async () => {
  // ---------------------------------------------------------------- pins
  const pageGlobe = (INDEX.match(/globe\.gl@([\d.]+)/) || [])[1];
  const pageSatjs = (APP.match(/satellite\.js@([\d.]+)/) || [])[1];
  ok('globe.gl: page pin = served = 2.45.0', pageGlobe === GLOBE_VER && GLOBE_VER === '2.45.0', { pageGlobe, GLOBE_VER });
  ok('satellite.js: page pin = served = 6.0.2', pageSatjs === SATJS_VER && SATJS_VER === '6.0.2', { pageSatjs, SATJS_VER });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

  // ---------------------------------------------------------------- A. the normal path
  {
    const { ctx, page, perr, hits } = await harness(browser);
    let s = await st(page);
    ok('A1 off on load: no layer, no worker, no timers', !s.on && !s.hasLayer && !s.worker && !s.timer && !s.metaTimer, s);
    ok('A1 off on load: the hub is not asked for satellites at all', hits.meta === 0 && hits.csv === 0 && hits.satjs === 0, hits);
    ok('A1 off on load: no satellite lines or legend', await page.locator('#sat-lines').isHidden() && await page.locator('#sat-legend').isHidden());
    const pairBefore = await page.evaluate(() => JSON.stringify(ME.pairState()));
    s = await enable(page); mark('enabled');
    ok('A2 enables: on, layer visible, timers running', s.on && s.layerVisible && s.timer && s.metaTimer, s);
    ok('A2 one meta + one CSV read from the hub; CelesTrak never contacted', hits.meta === 1 && hits.csv === 1 && hits.celestrak === 0, hits);
    ok('A2 file checksum recorded = published checksum', s.fileSha === sha(CSV), s.fileSha);
    ok('A2 exactly one particle object, visible', s.particleObjects.n === 1 && s.particleObjects.v === 1, s.particleObjects);
    ok('A2 rows in the file = 16,847 (frozen set)', s.last.rows === ROWS && ROWS === 16847, s.last);
    ok('A2 buffer capacity has headroom, draw range = drawn', s.capacity >= Math.ceil(ROWS * 1.25) && s.drawRange === s.last.drawn, s);
    // independent reference for the SAME pass time
    const ref = reference(CSV, s.last.at);
    ok('A3 drawn count matches an independent Node propagation at the same time', s.last.drawn === ref.drawn, { page: s.last.drawn, ref: ref.drawn });
    ok('A3 stale (> 3 days) count matches the reference at the same time', s.last.stale === ref.stale, { page: s.last.stale, ref: ref.stale });
    ok('A3 beyond-GEO count matches the reference', s.last.beyondGeo === ref.beyond, { page: s.last.beyondGeo, ref: ref.beyond });
    // placement: buffer vertex 0 (read atomically with its pass time) equals globe.gl's own placement of object 0,
    // propagated independently in Node at that same instant
    const snap = await page.evaluate(() => ({ at: ME.satState().last.at, v: ME.satVertex(0) }));
    const r0 = reference(CSV.split('\n').slice(0, 2).join('\n') + '\n', snap.at).first[0];
    const g0 = await page.evaluate(q => ME.coordsAt(q.lat, q.lng, q.alt), r0);
    const dmax = Math.max(Math.abs(g0.x - snap.v[0]), Math.abs(g0.y - snap.v[1]), Math.abs(g0.z - snap.v[2]));
    ok('A3 placement: vertex 0 = globe.gl placement of the reference position (< 1e-3 globe units)', dmax < 1e-3, { dmax, g0, v: snap.v });
    const lines = await page.locator('#sat-lines').innerText();
    ok('A4 marker warning always visible while on (exact text)', lines.includes('Markers enlarged for visibility; not to physical scale.'), lines);
    ok('A4 scope line states file / drawn / not drawn counts', lines.includes(`${ROWS.toLocaleString('en-US')} in the file`) && lines.includes(`${s.last.drawn.toLocaleString('en-US')} drawn`), lines);
    ok('A4 propagation time shown, equal to the pass time', lines.includes('Positions propagated for ' + s.last.at.replace('T', ' ').slice(0, 19) + ' UTC'), lines);
    ok('A4 stale line uses the dynamic count', s.last.stale ? lines.includes(`${s.last.stale.toLocaleString('en-US')} object`) && lines.includes('older than 3 days') : lines.includes('No object uses element sets older than 3 days'), lines);
    ok('A4 element file + CelesTrak data times shown', lines.includes('element file retrieved 2026-11-02 14:26 UTC') && lines.includes('as of 2026-11-02 14:24 UTC'), lines);
    ok('A4 legend line visible with Explore collapsed', await (async () => { await page.click('#exp-btn'); const v = await page.locator('#sat-legend').isVisible(); await page.click('#exp-btn'); return v; })());
    // updates repeat every ~2 s with real timers
    const seq0 = (await st(page)).seq; await page.waitForTimeout(6500); s = await st(page);
    ok('A5 propagation repeats while on (real timers, ~2 s cadence)', s.seq - seq0 >= 2 && s.seq - seq0 <= 5, { seq0, seq: s.seq });
    ok('A5 main-thread apply stays small (< 20 ms in SwiftShader)', s.applyMs !== null && s.applyMs < 20, s.applyMs);
    ok('A6 observation layers untouched by turning satellites on', await page.evaluate(() => JSON.stringify(ME.pairState())) === pairBefore);
    // off: stops updates, hides, keeps the single object
    await openExplore(page); await page.click('#tgl-sat'); await page.waitForTimeout(300);
    const off = await st(page); await page.waitForTimeout(5000); const off2 = await st(page);
    ok('A7 off: timers stopped, layer hidden, object kept (create once)', !off.on && !off.timer && !off.metaTimer && off.hasLayer && off.layerVisible === false && off.particleObjects.n === 1 && off.particleObjects.v === 0, off);
    ok('A7 off: no further propagation requests', off2.seq === off.seq, { before: off.seq, after: off2.seq });
    ok('A7 off: legend and lines cleared', await page.locator('#sat-legend').isHidden() && await page.locator('#sat-lines').isHidden());
    // 20 toggles: never a second object, never left visible when off, no re-download of an unchanged file
    for (let i = 0; i < 20; i++) { await page.click('#tgl-sat'); await page.waitForFunction(() => ME.satState().on && !ME.satState().busy, null, { timeout: 20000 }); await page.waitForTimeout(150); await page.click('#tgl-sat'); await page.waitForTimeout(150); }
    s = await st(page);
    ok('A8 20 toggles: one particle object, 0 visible when off, no timers left', s.particleObjects.n === 1 && s.particleObjects.v === 0 && !s.timer && !s.metaTimer, s);
    ok('A8 20 toggles: the unchanged CSV was not downloaded again', hits.csv === 1, hits);
    // hidden tab: no work
    await page.click('#tgl-sat'); await page.waitForFunction(() => ME.satState().on && !ME.satState().busy, null, { timeout: 20000 });
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(1500); const h0 = await st(page); await page.waitForTimeout(4500); const h1 = await st(page);
    ok('A9 hidden tab: no propagation while hidden', h1.seq === h0.seq && h1.hiddenSkips > h0.hiddenSkips, { h0: h0.seq, h1: h1.seq, skips: h1.hiddenSkips });
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(800); const h2 = await st(page);
    ok('A9 back in view: recomputes immediately', h2.seq > h1.seq, { h1: h1.seq, h2: h2.seq });
    // picking: a coverage cell under the satellites still opens the inspector
    const cxy = await page.evaluate(() => ME.screenAt(-32 + 2, 18 + 2, 0.006)); // inside cell 14_49
    let picked = false;
    for (let i = 0; i < 3 && !picked && cxy; i++) { const box = await page.locator('#globe').boundingBox(); await page.mouse.click(box.x + cxy.x, box.y + cxy.y); await page.waitForTimeout(500); picked = await page.locator('#insp.show').count() === 1; }
    ok('A10 coverage cells stay clickable through the satellite layer', picked);
    ok('A11 no page errors on the normal path', perr.length === 0, perr);
    await ctx.close(); mark('A done');
  }

  // ---------------------------------------------------------------- B. the element file changes while on
  {
    const { ctx, page, perr, hits, cur } = await harness(browser);
    await page.evaluate(() => { ME.SAT.META_RECHECK_MS = 3000; });
    let s = await enable(page);
    const sha1 = s.fileSha;
    const lines = CSV.split('\n'); const csv2 = lines.slice(0, 1).concat(lines.slice(2)).join('\n');   // one object fewer, new checksum
    cur.csv = csv2;
    await page.waitForFunction(old => ME.satState().fileSha !== old && ME.satState().last && ME.satState().last.rows === ME.satState().last.rows, sha1, { timeout: 30000 });
    await page.waitForTimeout(2500); s = await st(page);
    ok('B1 a changed hub file is picked up while on (new checksum)', s.fileSha === sha(csv2), s.fileSha);
    ok('B1 passes from the new file only (rows = 16,846)', s.last.rows === ROWS - 1, s.last);
    ok('B1 still one particle object (written in place, no rebuild)', s.particleObjects.n === 1 && s.particleObjects.v === 1, s.particleObjects);
    ok('B1 two CSV downloads in total (old, new)', hits.csv === 2, hits);
    ok('B2 no page errors', perr.length === 0, perr);
    await ctx.close(); mark('B done');
  }

  // ---------------------------------------------------------------- C. failure paths: refuse, explain, touch nothing else
  const failCase = async (name, opts, expect) => {
    const { ctx, page, perr } = await harness(browser, opts);
    const pairBefore = await page.evaluate(() => JSON.stringify(ME.pairState()));
    const s = await enable(page);
    const lines = await page.locator('#sat-lines').innerText().catch(() => '');
    ok(`${name}: refused, toggle off, nothing drawn, no timers`, !s.on && !s.timer && !s.metaTimer && (!s.particleObjects || s.particleObjects.v === 0) && (await page.locator('#tgl-sat').getAttribute('aria-checked')) === 'false', s);
    ok(`${name}: plain reason shown`, expect.test(lines) && /Satellites not shown/.test(lines), lines);
    ok(`${name}: observation layers untouched`, await page.evaluate(() => JSON.stringify(ME.pairState())) === pairBefore);
    ok(`${name}: no uncaught page errors`, perr.length === 0, perr);
    await ctx.close();
  };
  await failCase('C1 hub has no element file (404)', { sat: { metaStatus: 404 } }, /no satellite element file yet/);
  await failCase('C2 hub reports the file down', { sat: { meta: meta(CSV, { source_status: 'down' }) } }, /reports the element file as down/);
  await failCase('C3 CSV does not match its checksum (truncated)', { sat: { csvBody: CSV.slice(0, Math.floor(CSV.length * 0.9)) } }, /does not match its published checksum/);
  await failCase('C4 CSV header wrong (HTML error page)', { sat: { csvBody: '<html>maintenance</html>\n' } }, /unexpected header/);
  await failCase('C5 orbit library blocked', { sat: { blockSatjs: true } }, /orbit library/);
  await failCase('C6 no WebGL', { noWebGL: true }, /globe is unavailable/);
  mark('C done');

  // ---------------------------------------------------------------- D. phone width
  {
    const { ctx, page, perr } = await harness(browser, { viewport: { width: 390, height: 844 }, isMobile: true });
    const s = await enable(page);
    ok('D1 phone: enables', s.on && s.last, s);
    await page.click('#exp-btn');
    ok('D1 phone: legend line visible with Explore collapsed', await page.locator('#sat-legend').isVisible());
    ok('D1 phone: no horizontal scroll', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ok('D2 phone: no page errors', perr.length === 0, perr);
    await ctx.close(); mark('D done');
  }

  await browser.close(); clearTimeout(watchdog);
  console.log(`\n${pass} passed, ${fail} failed (${((Date.now() - T0) / 1000).toFixed(0)} s)`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
