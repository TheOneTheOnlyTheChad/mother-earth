/* The legend and "Key · N layers" show what is drawn (15 Nov 2026, branch legend-active-rc;
 * docs/concepts/LEGEND-ACTIVE-PROPOSAL.md rev 2, §6 governing).
 * For the six data layers (earthquakes, fires, ships, forest, drifting buoys, microplastic) the legend line and the count are read
 * from the tally of what the last render handed to the globe:
 *   symbols drawn                         → the layer's entry, counts one
 *   usable count cells, no symbols        → "<Layer>: cell outlines only", no dot, counts one; " (records withheld)" is added
 *                                           only while the records are not usable (round 2: a same-run empty records file is not withheld)
 *   forest cell reporting zero alerts     → the cell is drawn, so the swatch entry shows and the layer counts (round 2)
 *   valid zero (nothing drawn)            → no entry, no count
 *   stale / unknown outlines only         → no entry, no count (the coverage key covers them)
 *   off, down, loading, unavailable       → no entry, no count
 *   nothing from the six                  → "No data symbols or count cells are drawn right now."
 * Day/night, ocean heat and orbital keep their own lines and counting.
 * Every check compares the legend and the count with what the globe was given (ME.renderState, ME.cellPolys), not with a second rule.
 * One case runs on the production `lines/1` records file written by the hub's own pipeline.
 * Run: 8899 static server on the repo root, then
 *      NODE_PATH=/home/claude/spike/node_modules node --no-warnings phase1/legend-active-ui.test.cjs
 * BREAK=always-show | mismatch-as-symbols | count-old-rule | count-unknown-cells | no-hollow-rings | no-empty-line | always-withheld | never-withheld   each must fail. */
const { chromium } = require('playwright');
const coreOn = h => { if (!h.includes("const START_ON = [];")) throw new Error('index.html: START_ON = [] not found'); return h.replace("const START_ON = [];", "const START_ON = ['usgs', 'firms', 'ships', 'forest'];"); };   // this suite was written for the page with the four core layers on at load; the bare default is tested in bare-earth-ui.test.cjs
const fs = require('fs'); const path = require('path'); const { pathToFileURL } = require('url'); const { DatabaseSync } = require('node:sqlite');
const ROOT = path.join(__dirname, '..');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const { PNG } = require('pngjs'); const EARTH_PNG = (() => { const e = new PNG({ width: 64, height: 32 }); for (let i = 0; i < e.data.length; i += 4) { e.data[i] = 30; e.data[i + 1] = 60; e.data[i + 2] = 90; e.data[i + 3] = 255; } return PNG.sync.write(e); })();   // a plain Earth image: day/night harvests three.js from the globe's textured mesh
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 900)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 14 min'); process.exit(1); }, 14 * 60e3);
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const RealDate = Date; const iso = ms => new RealDate(ms).toISOString(); const n0 = RealDate.now();
const EMPTY = 'No data symbols or count cells are drawn right now.';
const E = { usgs: 'earthquake', firms: 'fire detection (per pass)', ships: 'vessel (last sample)', drifters: 'drifting buoy · coloured by water temperature (see card)', plastic: 'microplastic samples · 2011–2024 · tow-start locations · dated observations (hollow ring = source reports zero)', forest: 'forest-disturbance alert pixels, last 7 days (tropics only; deeper green = more, log scale)' };
const CNT = { usgs: 'Earthquakes: cell outlines only (records withheld)', firms: 'Fire detections: cell outlines only (records withheld)', ships: 'Ships: cell outlines only (records withheld)', drifters: 'Drifting buoys: cell outlines only (records withheld)' };
const ONLY = Object.fromEntries(Object.entries(CNT).map(([k, v]) => [k, v.replace(' (records withheld)', '')]));   // a usable pair that draws cells and no symbols
const line = (...parts) => parts.join(' · ');

// ---- page under test (optionally weakened)
let INDEX = coreOn(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
{ const rep = (a, b) => { const before = INDEX; INDEX = INDEX.replace(a, b); if (INDEX === before) { console.log('FAIL  break did not apply'); process.exit(1); } };
  if (BREAK === 'always-show') rep("e.hidden = !(sym || cnt); if (e.hidden) continue;", "e.hidden = false; if (!(sym || cnt)) { e.querySelector('.lsym').hidden = false; e.querySelector('.lsep').hidden = first; first = false; any = true; continue; }");   // main's behaviour: every entry, always
  if (BREAK === 'mismatch-as-symbols') rep("sym = k === 'forest' ? g.cells > 0 : g.symbols > 0", "sym = g.cells > 0 || g.symbols > 0");                      // counts-only shown with the dot entry
  if (BREAK === 'count-old-rule') rep("for (const k of DATA_LAYERS) if (drawnGeom[k].symbols > 0 || drawnGeom[k].cells > 0) out.push(k);", "for (const k of DATA_LAYERS) { if (!on[k] || !state[k] || ME.freshness(k).grade === 'unknown') continue; out.push(k); }");   // main's count: a zero layer counts
  if (BREAK === 'count-unknown-cells') rep("if (layer !== 'plastic' && grade !== 'unknown' && tally[layer]) tally[layer].cells++;", "if (layer !== 'plastic' && tally[layer]) tally[layer].cells++;");
  if (BREAK === 'no-hollow-rings') rep(" tally.plastic.symbols += hollow.length;", '');
  if (BREAK === 'always-withheld') rep("c.querySelector('.lwh').hidden = usable(k);", "c.querySelector('.lwh').hidden = false;");   // round 1's behaviour
  if (BREAK === 'never-withheld') rep("c.querySelector('.lwh').hidden = usable(k);", "c.querySelector('.lwh').hidden = true;");
  if (BREAK === 'no-empty-line') rep("$('leg-none').hidden = any;", "$('leg-none').hidden = true;"); }
const FAST_APP = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8').replace('5 * 60e3', '4e3');   // transition case only: poll every 4 s

// ---- fixtures (legacy `rows`)
const GOOD = iso(n0 - 3 * 3600e3), NOW = iso(n0 - 60e3), NEWER = iso(n0 - 20e3), OLD1 = iso(n0 - 3 * 3600e3), OLD2 = iso(n0 - 2 * 3600e3);
const cov = { grade: 'partial', evidence: 'e', observed_fraction: 1 };
const env0 = (layer, extra) => ({ layer, schema_version: 1, collector_version: '0.6.14', retrieved_at: NOW, source_status: 'ok', stale_after_s: 10800, window_start: GOOD, window_end: NOW, quantity: 'q', record_format: 'rows', ...extra });
const mk = (layer, fields, recs, extra = {}, at = NOW) => { const cells = {}; const iLat = fields.indexOf('lat'), iLng = fields.indexOf('lng'); for (const r of recs) { const k = cellOf(r[iLat], r[iLng]); (cells[k] = cells[k] || { count: 0, coverage: cov }).count++; }
  return { snap: env0(layer, { record_fields: fields, records: recs, cells, ...extra, retrieved_at: at }), cells: env0(layer, { cells, ...extra, retrieved_at: at }) }; };
const FF = ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'], FR = [[-33.5, 18.9, GOOD, 'n', 5.8, 'N20', 'D'], [-12.3, 30.2, GOOD, 'h', 41.2, 'N20', 'D']];
const fires = (at = NOW) => mk('firms', FF, FR, { scope: 'world', raw_bytes: 5000, stale_after_s: 2400 }, at);
const firesZero = () => mk('firms', FF, [], { scope: 'world', raw_bytes: 5000, stale_after_s: 2400 });
const firesDown = () => ({ ...fires().cells, retrieved_at: iso(n0 - 30e3), source_status: 'down', cells: {}, note: 'TypeError: fetch failed' });
const DF = ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'], PF = ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m'];
const BASEL = () => ({
  usgs: mk('usgs', ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], [['q1', -33.9, 18.4, 10, 3.1, 'ml', GOOD, 'M 3.1 - off Cape Town', '']], { source_generated_at: NOW, source_age_s: 40 }),
  firms: fires(),
  ships: mk('ships', ['mmsi', 'name', 'lat', 'lng', 'sog_kn', 'class', 'observed_at', 'received_at'], [['601000001', 'TEST VESSEL', -33.8, 18.5, 9.1, 'A', GOOD, NOW]], { window_s: 60, class_a: 1, class_b: 0, socket_connected_s: 60, collected_by: 'mac' }),
  forest: { cells: env0('forest', { cells: { '22_46': { count: 12, confidence: { nominal: 9, high: 3, highest: 0 }, since: '2026-11-08', queried_at: NOW, version: 'v1', coverage: cov } }, sweep: { answered: 559, cells_total: 559, oldest_queried_at: GOOD } }) },
  drifters: mk('drifters', DF, [['1501695', -33.26, 17.71, GOOD, 17.48, 'DRIFTING BUOYS', 'UK'], ['1501696', 10.2, -30.1, GOOD, 26.1, 'DRIFTING BUOYS', 'US']], { stale_after_s: 14400 }),
  plastic: mk('plastic', PF, [['0276422-0000001', -33.1, 19.2, '2015-02-03', 0, 'reproduced', 0, 'manta', 0.33, 0.15], ['0276422-0000002', -33.3, 19.4, '2016-02-03', 1.25, 'not_reproduced', 1.3, 'manta', 0.33, 0.15]], { stale_after_s: 259200, window_start: '2011-01-01', window_end: '2024-10-31' }),
});

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  /** L = layer fixtures (mutable: the hub answers from it at request time). opt.delay = {layer: ms}, opt.fail = Set of 'cells/x' | 'snapshot/x'. */
  const open = async (L, opt = {}) => {
    const ctx = await browser.newContext({ viewport: opt.viewport || { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: EARTH_PNG }));
    await ctx.route(BASE + '/index.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: INDEX }));
    if (opt.fast) await ctx.route(BASE + '/app.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: FAST_APP }));
    await ctx.route(HUB + '/**', async route => { const u = new URL(route.request().url()), p = u.pathname; const j = (b, st = 200) => route.fulfill({ status: st, contentType: 'application/json', body: typeof b === 'string' ? b : JSON.stringify(b) });
      if (opt.hub) { const a = await opt.hub(p, u.search); return j(a.body, a.status); }
      const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p);
      if (m) { if (opt.delay && opt.delay[m[2]]) await new Promise(r => setTimeout(r, opt.delay[m[2]]));
        if (opt.fail && opt.fail.has(m[1] + '/' + m[2])) return j('{}', 500);
        const f = L[m[2]]; if (f) { const b = m[1] === 'cells' ? f.cells : f.snap; if (b) return j(b); return j('{}', 500); }
        return j(env0(m[2], { cells: {}, index: null, record_fields: [], records: [] })); }
      if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } });
      j('{}', 404); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    // settled = every record layer this fixture serves has committed its counts (refreshPair) and the render after it has run
    await page.waitForFunction(ls => window.ME && ME.legendState && ME.renderState && ME.renderState() && ls.every(k => ME.pairState(k)[k].cells), opt.wait || ['usgs', 'firms', 'ships'], { timeout: 40000 });
    await page.waitForTimeout(900);
    return { ctx, page, perr };
  };
  const read = page => page.evaluate(() => { const st = ME.legendState(), k = ME.keyState(), rs = ME.renderState();
    const polys = l => (ME.cellPolys(l) || []).map(p => p.stroke);
    const dotsVisible = id => [...document.querySelectorAll('#' + id + ' .dot, #' + id + ' .sw')].filter(e => { let a = e; while (a && a.id !== 'leg-line') { if (a.hidden) return false; a = a.parentElement; } return true; }).length;
    return { line: st.line, empty: st.empty, geom: st.geom, usable: Object.fromEntries(Object.entries(ME.pairState()).map(([k, v]) => [k, v.usable])), n: k.label.replace(/\s+/g, ' '), drawn: k.drawn, points: rs.points, plasticRings: rs.plasticRings, plasticPoints: rs.plasticPoints, driftPoints: rs.driftPoints,
      polys: { usgs: polys('usgs'), firms: polys('firms'), ships: polys('ships'), forest: polys('forest'), drifters: polys('drifters'), plastic: polys('plastic') },
      fireDot: dotsVisible('leg-firms'), nightLegend: (e => e.hidden ? null : e.textContent)(document.getElementById('night-legend')), keydef: document.getElementById('key-def').textContent,
      legendVisibleText: (e => getComputedStyle(e).display === 'none' ? null : e.innerText)(document.getElementById('legend')) }; });
  const tgl = (page, layer) => page.evaluate(l => document.querySelector(`button.tgl[data-layer="${l}"]`).click(), layer);
  const UNKNOWN = 'rgba(255,90,60,.95)';
  /** legend and count agree with the globe, whatever the state */
  const agree = (tag, r) => {
    for (const k of ['usgs', 'firms', 'ships', 'drifters', 'plastic', 'forest']) { const g = r.geom[k], counted = r.drawn.includes(k), usablePolys = k === 'plastic' ? 0 : r.polys[k].filter(s => s !== UNKNOWN).length;
      ok(`${tag}: ${k} tally of count cells = usable cells on the globe`, g.cells === usablePolys, { g, polys: r.polys[k] });
      ok(`${tag}: ${k} counted in the Key exactly when it has symbols or count cells`, counted === (g.symbols > 0 || g.cells > 0), { g, counted });
      const entry = k === 'forest' ? g.cells > 0 : g.symbols > 0, cnt = !entry && CNT[k] && g.cells > 0;
      ok(`${tag}: ${k} legend entry ${entry ? 'present' : cnt ? 'counts-only' : 'absent'}`, r.line.includes(E[k]) === !!entry && (!CNT[k] || r.line.includes(ONLY[k]) === !!cnt), r.line);
      if (cnt) ok(`${tag}: ${k} says "(records withheld)" exactly when its records are not usable`, r.line.includes(CNT[k]) === !r.usable[k], { line: r.line, usable: r.usable[k] }); }
    ok(`${tag}: dots handed to the globe = sum of the symbol tallies less hollow rings`, r.points === r.geom.usgs.symbols + r.geom.firms.symbols + r.geom.ships.symbols + r.geom.drifters.symbols + r.geom.plastic.symbols - r.plasticRings, { points: r.points, geom: r.geom, rings: r.plasticRings });
    ok(`${tag}: the line has no leading, trailing or doubled separator`, !/^ ?·|· ?$|· ?·/.test(r.line.replace(/· \d{4}–\d{4} ·|· coloured|· tow-start|· dated/g, 'x')), r.line);
    ok(`${tag}: the empty sentence shows exactly when no data layer is drawn`, r.empty === ['usgs', 'firms', 'ships', 'drifters', 'plastic', 'forest'].every(k => !r.drawn.includes(k)) && (r.line === EMPTY) === r.empty, { line: r.line, empty: r.empty, drawn: r.drawn });
  };
  const N = n => `Key · ${n} layer${n === 1 ? '' : 's'}`;

  // ---- 1. matched: four core entries, count 4; switch fires off and on
  { const L = BASEL(); const { ctx, page, perr } = await open(L); let r = await read(page); agree('1 matched', r);
    ok('1 matched: line is the four core entries in order', r.line === line(E.usgs, E.firms, E.ships, E.forest), r.line);
    ok('1 matched: Key · 4 layers', r.n === N(4), r.n);
    ok('1 the key definition says what counts: a symbol or a usable count cell; a layer that draws nothing does not', /each data layer that draws a symbol or a usable count cell/.test(r.keydef) && /a layer that draws nothing, and cells outlined as unknown are not counted/.test(r.keydef) && !/count is zero/.test(r.keydef), r.keydef);
    await tgl(page, 'firms'); await page.waitForTimeout(300); r = await read(page); agree('1 fires off', r);
    ok('1 fires off: the fire entry is gone, the others stay, count 3', r.line === line(E.usgs, E.ships, E.forest) && r.n === N(3), [r.line, r.n]);
    await tgl(page, 'firms'); await page.waitForTimeout(300); r = await read(page);
    ok('1 fires on again: entry and count return', r.line === line(E.usgs, E.firms, E.ships, E.forest) && r.n === N(4), [r.line, r.n]);
    // ---- 7. everything off: the empty sentence; one layer back replaces it
    for (const l of ['usgs', 'firms', 'ships', 'forest']) await tgl(page, l); await page.waitForTimeout(300); r = await read(page); agree('7 all off', r);
    ok('7 all data layers off: the line is exactly the empty sentence, Key · 0 layers', r.line === EMPTY && r.n === N(0) && r.points === 0, [r.line, r.n, r.points]);
    // ---- 8. an overlay on its own keeps its own line; the sentence still describes the six data layers
    await page.evaluate(() => document.getElementById('tgl-night').click()); await page.waitForFunction(() => !document.getElementById('night-legend').hidden, null, { timeout: 15000 }).catch(() => { }); r = await read(page); agree('8 overlay alone', r);
    ok('8 day/night alone: its own legend line shows', /Day\/night now/.test(r.nightLegend || ''), r.nightLegend);
    ok('8 day/night alone: the data line is still the empty sentence, and the count is 1 (day/night)', r.line === EMPTY && r.n === N(1) && r.drawn.join() === 'daynight', [r.line, r.n, r.drawn]);
    await page.evaluate(() => document.getElementById('tgl-night').click()); await tgl(page, 'usgs'); await page.waitForTimeout(400); r = await read(page);
    ok('7 earthquakes back on: the sentence is replaced by the entry', r.line === E.usgs && !r.empty && r.n === N(1), [r.line, r.n]);
    ok('1/7/8: no page error', !perr.length, perr); await ctx.close(); }

  // ---- 3. fires down; 5. valid zero; 6. stale-only; 4. counts-only (legacy)
  for (const [tag, mut, exp] of [
    ['3 fires down', L => { L.firms = { cells: firesDown(), snap: fires(GOOD).snap }; }, { line: line(E.usgs, E.ships, E.forest), n: 3, firePolys: 0 }],
    ['5 valid zero', L => { L.firms = firesZero(); }, { line: line(E.usgs, E.ships, E.forest), n: 3, firePolys: 0 }],
    ['6 stale-only', L => { L.firms = { cells: fires(OLD2).cells, snap: fires(OLD1).snap }; }, { line: line(E.usgs, E.ships, E.forest), n: 3, firePolys: 2, unknownOnly: true }],
    ['4 counts-only (rows)', L => { L.firms = { cells: fires(NEWER).cells, snap: fires(GOOD).snap }; }, { line: line(E.usgs, CNT.firms, E.ships, E.forest), n: 4, firePolys: 2, countsOnly: true }],
    ['4 counts-only, records unreadable', L => { L.firms = { cells: fires(NOW).cells, snap: null }; }, { line: line(E.usgs, CNT.firms, E.ships, E.forest), n: 4, firePolys: 2, countsOnly: true }],
  ]) { const L = BASEL(); mut(L); const { ctx, page, perr } = await open(L); const r = await read(page); agree(tag, r);
    ok(`${tag}: line`, r.line === exp.line, r.line); ok(`${tag}: ${N(exp.n)}`, r.n === N(exp.n), r.n);
    ok(`${tag}: fire cells on the globe = ${exp.firePolys}, fire dots = 0`, r.polys.firms.length === exp.firePolys && r.geom.firms.symbols === 0, [r.polys.firms, r.geom.firms]);
    if (exp.unknownOnly) ok(`${tag}: the cells are outlined as unknown, add no entry and are not counted`, r.polys.firms.every(s => s === UNKNOWN) && r.geom.firms.cells === 0 && !r.drawn.includes('firms') && !r.line.includes('ire'), [r.polys.firms, r.line]);
    if (exp.countsOnly) { ok(`${tag}: the cells are usable count cells`, r.polys.firms.every(s => s !== UNKNOWN) && r.geom.firms.cells === exp.firePolys, r.polys.firms); ok(`${tag}: the fire entry carries no dot`, r.fireDot === 0, r.fireDot); }
    ok(`${tag}: no page error`, !perr.length, perr); await ctx.close(); }

  // ---- 3b. forest: sweep not started (unknown) → no swatch entry
  { const L = BASEL(); L.forest = { cells: env0('forest', { cells: {}, sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW } }) }; const { ctx, page } = await open(L); const r = await read(page); agree('3b forest not started', r);
    ok('3b forest with no answered cell: no swatch entry, not counted', r.line === line(E.usgs, E.firms, E.ships) && r.n === N(3), [r.line, r.n]); await ctx.close(); }

  // ---- 3c (round 2). forest: one answered cell reporting ZERO alerts → the cell is drawn, the swatch shows, the layer counts
  { const L = BASEL(); L.forest = { cells: env0('forest', { cells: { '22_46': { count: 0, confidence: { nominal: 0, high: 0, highest: 0 }, since: '2026-11-08', queried_at: NOW, version: 'v1', coverage: cov } }, sweep: { answered: 559, cells_total: 559, oldest_queried_at: GOOD } }) };
    L.firms = firesZero(); const { ctx, page } = await open(L); const r = await read(page); agree('3c forest zero alerts', r);
    ok('3c forest cell with zero alerts: a usable cell is drawn, so the swatch entry shows and forest counts', r.polys.forest.length === 1 && r.polys.forest[0] !== UNKNOWN && r.geom.forest.cells === 1 && r.line.includes(E.forest) && r.drawn.includes('forest'), [r.polys.forest, r.geom.forest, r.line, r.drawn]);
    ok('3c beside it, zero fires draw nothing: no fire entry, not counted; Key · 3 layers', !r.line.includes('ire') && !r.drawn.includes('firms') && r.polys.firms.length === 0 && r.n === N(3), [r.line, r.drawn, r.n]); await ctx.close(); }
  // ---- 4c (round 2). same run, counts present, records file empty: the pair is usable, so nothing is "withheld"
  { const L = BASEL(); const f = fires(); L.firms = { cells: f.cells, snap: { ...f.snap, records: [] } }; const { ctx, page } = await open(L); const r = await read(page); agree('4c usable pair, cells only', r);
    ok('4c same-run empty records with count cells: the page accepted the pair', r.usable.firms === true && r.geom.firms.symbols === 0 && r.geom.firms.cells === 2, [r.usable.firms, r.geom.firms]);
    ok('4c the entry reads "Fire detections: cell outlines only" with no "(records withheld)", no dot, counted as one', r.line === line(E.usgs, ONLY.firms, E.ships, E.forest) && !r.line.includes('withheld') && r.fireDot === 0 && r.n === N(4), [r.line, r.fireDot, r.n]); await ctx.close(); }

  // ---- 9–11. optional layers
  { const L = BASEL(); const { ctx, page, perr } = await open(L, { delay: { drifters: 2500 } }); let r = await read(page);
    ok('9 optional layers off on load: no entry', !r.line.includes('buoy') && !r.line.includes('microplastic') && r.n === N(4), [r.line, r.n]);
    await tgl(page, 'drifters'); await page.waitForTimeout(600); r = await read(page); agree('9 buoys loading', r);
    ok('9 buoys still loading: no entry, no count', !r.line.includes('buoy') && !r.drawn.includes('drifters') && r.n === N(4), [r.line, r.n]);
    await page.waitForFunction(() => ME.renderState().driftPoints > 0, null, { timeout: 20000 }).catch(() => { }); r = await read(page); agree('9 buoys loaded', r);
    ok('9 buoys loaded: entry after the three dot entries, count 5', r.line === line(E.usgs, E.firms, E.ships, E.drifters, E.forest) && r.n === N(5) && r.driftPoints === 2, [r.line, r.n, r.driftPoints]);
    await tgl(page, 'plastic'); await page.waitForFunction(() => ME.renderState().plasticRings + ME.renderState().plasticPoints > 0, null, { timeout: 20000 }).catch(() => { }); r = await read(page); agree('10 microplastic on', r);
    ok('10 microplastic (one value, one zero): entry present, count 6', r.line === line(E.usgs, E.firms, E.ships, E.drifters, E.plastic, E.forest) && r.n === N(6) && r.plasticRings === 1 && r.plasticPoints === 1, [r.line, r.n, r.plasticRings, r.plasticPoints]);
    ok('9/10: no page error', !perr.length, perr); await ctx.close(); }
  { const L = BASEL(); const { ctx, page } = await open(L, { fail: new Set(['cells/drifters', 'snapshot/drifters']) }); await tgl(page, 'drifters'); await page.waitForTimeout(1500); const r = await read(page); agree('9 buoys unavailable', r);
    ok('9 buoys unavailable: no entry, no count', !r.line.includes('buoy') && !r.line.includes('Drifting') && r.n === N(4), [r.line, r.n]); await ctx.close(); }
  { const L = BASEL(); L.plastic = mk('plastic', PF, [['0276422-0000001', -33.1, 19.2, '2015-02-03', 0, 'reproduced', 0, 'manta', 0.33, 0.15], ['0276422-0000003', 5.1, 100.2, '2017-05-01', 0, 'reproduced', 0, 'manta', 0.33, 0.15]], { stale_after_s: 259200, window_start: '2011-01-01', window_end: '2024-10-31' });
    const { ctx, page } = await open(L); await tgl(page, 'plastic'); await page.waitForFunction(() => ME.renderState().plasticRings > 0, null, { timeout: 20000 }).catch(() => { }); const r = await read(page); agree('10 hollow rings only', r);
    ok('10 microplastic with hollow rings only: no dots, two rings, entry present and counted as one', r.plasticPoints === 0 && r.plasticRings === 2 && r.line.includes(E.plastic) && r.drawn.includes('plastic') && r.n === N(5), [r.plasticPoints, r.plasticRings, r.line, r.n]); await ctx.close(); }
  { const L = BASEL(); L.plastic = { cells: { ...L.plastic.cells, retrieved_at: NEWER }, snap: { ...L.plastic.snap, retrieved_at: GOOD } };
    const { ctx, page } = await open(L); await tgl(page, 'plastic'); await page.waitForTimeout(1500); const r = await read(page); agree('10 microplastic records withheld', r);
    ok('10 microplastic with records withheld: its faint cells carry no value, so no entry and no count', !r.line.includes('icroplastic') && !r.drawn.includes('plastic') && r.n === N(4) && r.plasticRings + r.plasticPoints === 0, [r.line, r.n, r.polys.plastic.length]); await ctx.close(); }
  { const L = BASEL(); L.drifters = { cells: { ...L.drifters.cells, retrieved_at: NEWER }, snap: { ...L.drifters.snap, retrieved_at: GOOD } };
    const { ctx, page } = await open(L); await tgl(page, 'drifters'); await page.waitForTimeout(1500); const r = await read(page); agree('11 buoys counts-only', r);
    ok('11 buoys with records withheld: counts-only wording, counted as one, no buoy dots', r.line === line(E.usgs, E.firms, E.ships, CNT.drifters, E.forest) && r.n === N(5) && r.driftPoints === 0 && r.polys.drifters.length === 2, [r.line, r.n, r.driftPoints, r.polys.drifters]); await ctx.close(); }

  // ---- 12. phone 390 px: same line for the same state, behind the Key
  { const L = BASEL(); L.firms = { cells: fires(NEWER).cells, snap: fires(GOOD).snap }; const d = await open(L), m = await open(L, { viewport: { width: 390, height: 844 } });
    const rd = await read(d.page); let rm = await read(m.page); agree('12 phone', rm);
    ok('12 phone, Key closed: legend not shown, button reads the same count as desktop', rm.legendVisibleText === null && rm.n === rd.n && rm.n === N(4), [rm.legendVisibleText, rm.n, rd.n]);
    await m.page.evaluate(() => document.getElementById('key-btn').click()); await m.page.waitForTimeout(300); rm = await read(m.page);
    ok('12 phone, Key open: the same line as desktop', rm.line === rd.line && rm.line === line(E.usgs, CNT.firms, E.ships, E.forest) && (rm.legendVisibleText || '').includes(CNT.firms), [rm.line, rd.line]);
    ok('12 phone: no page error', !m.perr.length && !d.perr.length, [m.perr, d.perr]); await d.ctx.close(); await m.ctx.close(); }

  // ---- 13. one page session: matched → down → matched
  { const L = BASEL(); const { ctx, page, perr } = await open(L, { fast: true }); let r = await read(page);
    ok('13 starts matched', r.line === line(E.usgs, E.firms, E.ships, E.forest) && r.n === N(4), [r.line, r.n]);
    L.firms = { cells: firesDown(), snap: fires(GOOD).snap };
    await page.waitForFunction(e => !ME.legendState().line.includes(e), E.firms, { timeout: 20000 }).catch(() => { }); r = await read(page); agree('13 down', r);
    ok('13 feed goes down: the entry leaves on the next refresh, count 3', r.line === line(E.usgs, E.ships, E.forest) && r.n === N(3), [r.line, r.n]);
    L.firms = fires(iso(RealDate.now() - 5e3));
    await page.waitForFunction(e => ME.legendState().line.includes(e), E.firms, { timeout: 20000 }).catch(() => { }); r = await read(page); agree('13 back', r);
    ok('13 feed returns: the entry and the count return', r.line === line(E.usgs, E.firms, E.ships, E.forest) && r.n === N(4), [r.line, r.n]);
    ok('13: no page error', !perr.length, perr); await ctx.close(); }

  // ---- 4b. counts-only on the production `lines/1` records file, written by the hub's own v2 pipeline
  { const makeD1 = () => { const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys = ON;'); db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
      const exec = (sql, args) => { if (/^\s*SELECT/i.test(sql)) return { results: db.prepare(sql).all(...args), meta: { changes: 0 } }; const r = db.prepare(sql).run(...args); return { results: [], meta: { changes: Number(r.changes) } }; };
      const prep = sql => { const mkk = args => ({ sql, args, async run() { return exec(sql, args); }, async all() { return exec(sql, args); }, async first() { return exec(sql, args).results[0] ?? null; } }); return { bind: (...a) => mkk(a.map(v => v === undefined ? null : v)), ...mkk([]) }; };
      return { prepare: prep, async batch(st) { db.exec('BEGIN'); try { const out = st.map(s => exec(s.sql, s.args)); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } } }; };
    const m = new Map(), enc = new TextEncoder(), dec = new TextDecoder(); let seq = 0;
    const bytesOf = async v => v == null ? new Uint8Array(0) : typeof v === 'string' ? enc.encode(v) : v instanceof Uint8Array ? new Uint8Array(v) : v instanceof ArrayBuffer ? new Uint8Array(v.slice(0)) : new Uint8Array(await new Response(v).arrayBuffer());
    const obj = (k, v, body) => ({ key: k, size: v.bytes.length, etag: v.etag, httpEtag: '"' + v.etag + '"', uploaded: new RealDate(v.uploaded), customMetadata: { ...(v.customMetadata || {}) }, httpMetadata: v.httpMetadata || {}, writeHttpMetadata() { }, ...(body || {}) });
    const R2 = { async put(k, value, o = {}) { const cur = m.get(k), c = o.onlyIf; if (c && c.etagDoesNotMatch === '*' && cur) return null; if (c && c.etagMatches && (!cur || cur.etag !== c.etagMatches)) return null; const v = { bytes: await bytesOf(value), etag: 'e' + (++seq), uploaded: Date.now(), customMetadata: o.customMetadata, httpMetadata: o.httpMetadata }; m.set(k, v); return obj(k, v); },
      async head(k) { const v = m.get(k); return v ? obj(k, v) : null; },
      async get(k, o = {}) { const v = m.get(k); if (!v) return null; let b = v.bytes; if (o.range) b = b.subarray(o.range.offset || 0, (o.range.offset || 0) + (o.range.length ?? b.length)); return obj(k, v, { body: new Blob([b]).stream(), async text() { return dec.decode(b); }, async json() { return JSON.parse(dec.decode(b)); }, async arrayBuffer() { return b.slice().buffer; } }); },
      async delete(k) { m.delete(k); }, async list({ prefix } = {}) { return { objects: [...m.keys()].filter(k => !prefix || k.startsWith(prefix)).sort().map(k => ({ key: k, size: m.get(k).bytes.length, uploaded: new RealDate(m.get(k).uploaded) })), truncated: false }; },
      async createMultipartUpload(k, o = {}) { const parts = new Map(); return { key: k, async uploadPart(n, data) { parts.set(n, await bytesOf(data)); return { partNumber: n, etag: 'p' + n }; },
        async complete(list) { const ps = list.map(p => parts.get(p.partNumber)); const all = new Uint8Array(ps.reduce((a, b) => a + b.length, 0)); let off = 0; for (const b of ps) { all.set(b, off); off += b.length; } const v = { bytes: all, etag: 'e' + (++seq), uploaded: Date.now(), customMetadata: o.customMetadata, httpMetadata: o.httpMetadata }; m.set(k, v); return obj(k, v); }, async abort() { } }; } };
    let CLOCK = 0; class HubDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(CLOCK); } static now() { return CLOCK; } }
    const hubAt = async (ms, fn) => { CLOCK = ms; globalThis.Date = HubDate; const log = console.log; console.log = () => { }; try { return await fn(); } finally { globalThis.Date = RealDate; console.log = log; } };
    const HEAD = 'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n';
    const row = (lat, lng, d, t, frp) => `${lat},${lng},316.31,0.61,0.71,${d},${t},N20,VIIRS,n,2.0NRT,284.7,${frp},D`;
    let BODY = HEAD;
    globalThis.fetch = async url => { url = String(url); if (url.includes('firms.modaps')) return new Response(BODY, { status: 200 });
      if (url.includes('earthquake.usgs.gov')) return new Response(JSON.stringify({ metadata: { generated: CLOCK - 60e3 }, features: [{ id: 'q1', properties: { mag: 3.1, magType: 'ml', time: CLOCK - 3600e3, title: 'M 3.1 - off Cape Town', url: '' }, geometry: { coordinates: [18.4, -33.9, 10] } }] }), { status: 200 });
      return new Response('stub', { status: 503 }); };
    const W = (await import(pathToFileURL(path.join(__dirname, 'worker.js')).href + '?la=1')).default, env = { R2, DB: makeD1(), ADMIN_KEY: 'k', FIRMS_MAP_KEY: 'MAPKEY0123456789abcdef', HISTORY_ENABLED: '1', FIRMS_PIPELINE: 'v2', FIRMS_CREATE_ONLY: 'verified' };
    const Q = 15 * 60e3, run = async (endMs, body) => { BODY = body; await hubAt(endMs, () => W.scheduled({ cron: '*/15 * * * *', scheduledTime: Math.floor(endMs / Q) * Q }, env, { waitUntil() { } })); };
    const d = iso(n0).slice(0, 10);
    await run(n0 - 17 * 60e3, HEAD + [row(-33.8, 18.6, d, '1300', '5.8'), row(-33.81, 18.61, d, '1310', '2.3')].join('\n') + '\n'); const keep = m.get('latest/firms.json');
    await run(n0 - 60e3, HEAD + [row(-33.8, 18.6, d, '1300', '5.8'), row(-33.81, 18.61, d, '1310', '2.3'), row(10, 10, d, '1320', '9.9')].join('\n') + '\n'); m.set('latest/firms.json', keep);   // counts from the second run, records still the first run's
    const head = await R2.head('latest/firms.json');
    ok('4b the hub published a lines/1 records file and a counts file with a run id', head.customMetadata.format === 'lines/1' && !!JSON.parse(dec.decode(m.get('latest-cells/firms.json').bytes)).run_id);
    const { ctx, page, perr } = await open({}, { wait: ['firms'], hub: async (p, q) => { const res = await W.fetch(new Request(HUB + p + q), env); return { status: res.status, body: await res.text() }; } });
    const r = await read(page); agree('4b counts-only (lines/1)', r);
    ok('4b lines/1 run mismatch: counts-only wording for fires, no fire dot, usable fire cells drawn, counted as one', r.line.includes(CNT.firms) && !r.line.includes(E.firms) && r.fireDot === 0 && r.geom.firms.symbols === 0 && r.geom.firms.cells === 2 && r.drawn.includes('firms'), [r.line, r.geom.firms, r.polys.firms, r.drawn]);
    ok('4b: no page error', !perr.length, perr); await ctx.close(); }

  await browser.close(); clearTimeout(wd);
  console.log(`legend-active-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('ERR', e); process.exit(1); });
