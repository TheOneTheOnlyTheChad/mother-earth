/* Mother Earth — Place view v1 (thread 14, 5 Nov 2026). End to end with the REAL hub code: the page's /place requests are
 * answered by worker.js's own fetch() over an in-memory R2 + a real SQLite D1 (node:sqlite) seeded with fixtures, and the
 * page's /cells + /snapshot reads come from the same store, so page and place agree. Real globe.gl (SwiftShader).
 * Checks: open from a cell and from ANY globe point (incl. empty ocean); every layer listed with its own wording; the fixed
 * statement; collection evidence labelled; off layers: no request until "Load", then panel only (globe + toggle unchanged);
 * an ON optional layer is included automatically; hub failure → unknown, never zero; late response after close ignored;
 * keyboard; phone.  Run: node --no-warnings phase1/place-ui.test.cjs   (8899 server + /home/claude/spike, as the other suites)
 */
const { chromium } = require('playwright');
const fs = require('fs'); const { pathToFileURL } = require('url'); const { DatabaseSync } = require('node:sqlite');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 600)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 6 min — failure, not a hang'); process.exit(1); }, 6 * 60e3);
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;

(async () => {
  const W = await import(pathToFileURL(__dirname + '/worker.js').href);
  const RUN = new Date(Date.now() - 60e3).toISOString(), FIX = new Date(Date.now() - 3 * 3600e3).toISOString();
  const env0 = (layer, extra) => ({ layer, collector_version: '0.5.0', retrieved_at: RUN, source_status: 'ok', stale_after_s: 10800, window_start: FIX, window_end: RUN, quantity: 'q', ...extra });
  const recLayer = (layer, fields, recs, latI = fields.indexOf('lat'), lngI = fields.indexOf('lng')) => {
    const cells = {}; for (const r of recs) { const k = cellOf(r[latI], r[lngI]); (cells[k] = cells[k] || { count: 0, coverage: { grade: 'partial', evidence: 'e', observed_fraction: 1 } }).count++; }
    return { snap: env0(layer, { record_format: 'rows', record_fields: fields, records: recs, cells }), cells: env0(layer, { cells }) };
  };
  const L = {
    usgs: recLayer('usgs', ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], [['q1', -33.9, 18.4, 10, 3.1, 'ml', FIX, 'M 3.1 - off <b>Cape</b> Town', ''], ['q2', 35.6, 139.7, 30, 4.8, 'mb', FIX, 'M 4.8 - Japan', '']]),
    firms: recLayer('firms', ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'], [[-33.5, 18.9, FIX, 'n', null, 'N20', 'N'], [-12.3, 30.2, FIX, 'h', 41.2, 'N20', 'D']]),
    ships: recLayer('ships', ['mmsi', 'name', 'lat', 'lng', 'sog_kn', 'class', 'observed_at', 'received_at'], [['601000001', 'TEST <i>VESSEL</i>', -33.8, 18.5, 9.1, 'A', FIX, RUN]]),
    drifters: recLayer('drifters', ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'], [['1501695', -33.26, 17.71, FIX, 17.48, 'DRIFTING BUOYS', 'UK']]),
    plastic: recLayer('plastic', ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m'], [['0276422-0000001', -33.1, 19.2, '2015-02-03', 0, 'reproduced', 0, 'manta', 0.33, 0.15], ['0276422-0000002', -33.3, 19.4, '2016-02-03', 1.25, 'not_reproduced', 1.3, 'manta', 0.33, 0.15]]),
  };
  const store = new Map();
  for (const [l, v] of Object.entries(L)) { store.set(`latest/${l}.json`, JSON.stringify(v.snap)); store.set(`latest-cells/${l}.json`, JSON.stringify(v.cells)); }
  store.set('latest-cells/forest.json', JSON.stringify(env0('forest', { cells: { '22_46': { count: 12, confidence: { nominal: 9, high: 3, highest: 0 }, since: '2026-10-29', queried_at: RUN, version: 'v1', coverage: { grade: 'partial', evidence: 'e' } } }, sweep: { answered: 1, cells_total: 559, oldest_queried_at: RUN } })));
  let etag = 0;
  const R2 = { async get(k) { const b = store.get(k); if (b === undefined) return null; return { body: b, httpEtag: '"' + k + (etag) + '"', async json() { return JSON.parse(b); }, async text() { return b; } }; }, async head(k) { const b = store.get(k); if (b === undefined) return null; return { key: k, size: new TextEncoder().encode(b).length, etag: k + (etag), httpEtag: '"' + k + (etag) + '"', uploaded: new Date(), customMetadata: undefined }; },   // hub >= 0.6.0 reads head() before the place firms section; fixtures are legacy format (no lines/1 metadata)
    async put(k, b) { store.set(k, String(b)); }, async delete(k) { store.delete(k); }, async list() { return { objects: [] }; } };
  const db = new DatabaseSync(':memory:'); db.exec(fs.readFileSync(__dirname + '/schema.sql', 'utf8'));
  const now = Date.now();
  const lh = db.prepare('INSERT INTO layer_hourly (layer, hour_utc, snapshots_expected, snapshots_ok, source_status, adequate_cells, updated_at) VALUES (?,?,?,?,?,?,?)');
  for (let h = 1; h <= 30; h++) { const k = new Date(now - h * 3600e3).toISOString().slice(0, 13); lh.run('ships', k, 2, h % 4 ? 2 : 0, h % 4 ? 'ok' : 'absent', 'none', 'x'); lh.run('usgs', k, 12, 12, 'ok', 'all', 'x'); lh.run('firms', k, 4, 4, 'ok', 'none', 'x'); }
  const ch = db.prepare('INSERT INTO cell_hourly (layer, cell_id, hour_utc, count, coverage, observed_fraction, updated_at) VALUES (?,?,?,?,?,?,?)');
  ch.run('ships', '14_49', new Date(now - 3 * 3600e3).toISOString().slice(0, 13), 2, 'partial', 1, 'x'); ch.run('ships', '30_0', new Date(now - 90 * 3600e3).toISOString().slice(0, 13), 1, 'partial', 1, 'x');
  const D1 = { prepare(sql) { const mk = a => ({ sql, async all() { return { results: db.prepare(sql).all(...a) }; }, async first() { return db.prepare(sql).get(...a) ?? null; }, async run() { db.prepare(sql).run(...a); return {}; } }); return { bind: (...a) => mk(a), ...mk([]) }; },
    async batch(st) { return Promise.all(st.map(s => /^\s*SELECT/i.test(s.sql) ? s.all() : s.run())); } };
  const HENV = { R2, DB: D1 };
  let placeMode = 'ok', placeDelay = 0;

  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const run = async (viewport) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const hits = [];
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', async route => {
      const u = new URL(route.request().url()); const p = u.pathname; hits.push(p + u.search);
      if (p.startsWith('/place/')) {
        if (placeDelay) await new Promise(r => setTimeout(r, placeDelay));
        if (placeMode === '500') return route.fulfill({ status: 500, body: '{}' });
        const res = await W.default.fetch(new Request(HUB + p + u.search), HENV);
        return route.fulfill({ status: res.status, contentType: 'application/json', body: await res.text() });
      }
      const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p);
      if (m) { const k = (m[1] === 'cells' ? 'latest-cells/' : 'latest/') + m[2] + '.json'; const b = store.get(k) || store.get('latest-cells/' + m[2] + '.json');
        if (b) return route.fulfill({ status: 200, contentType: 'application/json', body: b });
        if (/^(swpc|co2|seaice)$/.test(m[2])) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(env0(m[2], { cells: {}, index: null })) }); }
      route.fulfill({ status: 404, body: '{}' });
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.renderState && ME.renderState(), null, { timeout: 30000 });
    await page.waitForTimeout(600);
    return { ctx, page, hits, perr };
  };
  const panel = page => page.evaluate(() => ({ open: document.getElementById('insp').classList.contains('show'), h: document.getElementById('insp-h').textContent,
    rows: [...document.querySelectorAll('#insp-dl dt')].map(dt => [dt.textContent, dt.nextElementSibling.textContent]), more: document.getElementById('insp-more').textContent,
    html: document.getElementById('insp-dl').innerHTML, place: ME.placeState(), render: ME.renderState(), plasticCard: document.getElementById('s-plastic') && document.getElementById('s-plastic').textContent,
    pressed: document.querySelector('[data-layer="plastic"]') && document.querySelector('[data-layer="plastic"]').getAttribute('aria-pressed') }));
  const row = (P, k) => (P.rows.find(r => r[0] === k) || [null, null])[1];
  const waitPlace = page => page.waitForFunction(() => !/Loading/.test(document.querySelector('#insp-dl dt') ? document.querySelector('#insp-dl dt').textContent : 'Loading'), null, { timeout: 15000 });

  // --- desktop
  let { ctx, page, hits, perr } = await run({ width: 1280, height: 860 });
  const before = await page.evaluate(() => ME.renderState());
  // 1. from a cell's inspector → "Everything here"
  await page.evaluate(id => ME.openCell('usgs', id), '14_49'); await page.waitForTimeout(200);
  ok('1 cell inspector offers "Everything here"', await page.$('#insp-dl button.placelink') !== null);
  await page.click('#insp-dl button.placelink'); await waitPlace(page);
  let P = await panel(page);
  ok('1 place panel open for the same cell', P.open && P.h === 'Everything here · cell 14_49' && P.place.id === '14_49', P.h);
  ok('1 fixed statement shown', row(P, 'Read this first') === 'Listed together because they share this 4° cell. Nothing here states a connection between them.', row(P, 'Read this first'));
  ok('1 every layer has its own row', ['Earthquakes', 'Fire detections', 'Ships', 'Forest disturbance', 'Drifting buoys', 'Microplastic samples'].every(k => row(P, k) !== null), P.rows.map(r => r[0]));
  ok('1 quake listed with its own time, text escaped (no markup from the source)', /1 event in the feed window/.test(row(P, 'Earthquakes')) && /M3\.1 · .* · M 3\.1 - off <b>Cape<\/b> Town/.test(row(P, 'Earthquakes')) && !/<b>Cape/.test(P.html.replace(/&lt;b&gt;Cape/g, '')), row(P, 'Earthquakes'));
  ok('1 fire with a MISSING FRP says "not provided", never 0 MW', /FRP not provided/.test(row(P, 'Fire detections')) && !/FRP 0/.test(row(P, 'Fire detections')), row(P, 'Fire detections'));
  ok('1 ship heard, coverage stated', /1 vessel heard in the latest sample/.test(row(P, 'Ships')) && /coverage partial/.test(row(P, 'Ships')), row(P, 'Ships'));
  ok('1 forest outside the sweep says not covered (not zero)', /^not covered — outside the swept tropical land cells/.test(row(P, 'Forest disturbance')), row(P, 'Forest disturbance'));
  ok('1 off optional layers: "layer off" with a Load button each', /layer off · Load this layer's data for this place/.test(row(P, 'Drifting buoys')) && /layer off/.test(row(P, 'Microplastic samples')), [row(P, 'Drifting buoys'), row(P, 'Microplastic samples')]);
  ok('1 NO request for an off layer: /place without ?layers=, no /cells|/snapshot for plastic or drifters', hits.filter(h => h.startsWith('/place/')).every(h => !h.includes('layers')) && !hits.some(h => /(plastic|drifters)/.test(h)), hits.filter(h => /place|plastic|drifters/.test(h)));
  ok('1 collection evidence labelled: collector ran vs records here vs retention vs first report; "Neither is the source\'s geographic coverage."',
    /our collector produced a usable sample in \d+ of \d+ aggregated hours? .*over the last 24 h/.test(row(P, 'Collection · Ships')) && /records for this cell reached us in 1 h of the last 24 h/.test(row(P, 'Collection · Ships')) && /Retained since \d{4}-\d\d-\d\dT\d\d; first retained report here: \d{4}/.test(row(P, 'Collection · Ships')) && /Neither is the source's geographic coverage\./.test(row(P, 'Collection · Ships')), row(P, 'Collection · Ships'));
  ok('1 not-place-based layers listed with reasons (behind the disclosure)', /Kp index: one planetary index/.test(P.more) && /CO₂: one station/.test(P.more), P.more.slice(0, 300));
  // 2. Load plastic for this place only
  await page.click('#insp-dl button.placeload[data-place-layer="plastic"]'); await page.waitForFunction(() => /dated sample/.test(document.getElementById('insp-dl').textContent), null, { timeout: 15000 });
  P = await panel(page);
  ok('2 Load → one request with ?layers=plastic, still no /snapshot|/cells for plastic', hits.filter(h => h.startsWith('/place/')).at(-1) === '/place/g4/14_49?layers=plastic' && !hits.some(h => /^\/(snapshot|cells)\/plastic/.test(h)), hits.slice(-3));
  ok('2 plastic samples listed: reported zero shown as such; check named', /2 dated samples \(2011–2024 programme; not current water\)/.test(row(P, 'Microplastic samples')) && /reported zero/.test(row(P, 'Microplastic samples')) && /check: not reproduced/.test(row(P, 'Microplastic samples')), row(P, 'Microplastic samples'));
  ok('2 globe and toggle unchanged: plastic still OFF, no plastic markers/cells, same points as before', P.render.on.plastic === false && P.render.plasticPoints === 0 && P.render.plasticCells === 0 && P.render.points === before.points && P.pressed === 'false', { r: P.render, pressed: P.pressed });
  ok('2 drifters still off and unrequested', /layer off/.test(row(P, 'Drifting buoys')) && !hits.some(h => h.includes('drifters')), row(P, 'Drifting buoys'));
  // 3. Escape closes and returns focus; late response after close is ignored
  await page.keyboard.press('Escape'); P = await panel(page);
  ok('3 Escape closes; place context cleared', !P.open && P.place === null, P.place);
  placeDelay = 1500; await page.evaluate(() => ME.openPlace('20_0')); await page.waitForTimeout(150); await page.keyboard.press('Escape'); await page.waitForTimeout(1800); placeDelay = 0;
  P = await panel(page);
  ok('3 a response arriving after close does not reopen or repaint the panel', !P.open, P.h);
  // 4. any place: click the bare globe surface (mid-Pacific, no records)
  await page.evaluate(() => ME.pointView(-38, -138));   // centre the camera on an empty ocean point, then click the canvas centre
  let surf = null;
  if (await page.evaluate(() => typeof ME.pointView === 'function')) {
    await page.waitForTimeout(600); const box = await page.locator('#globe canvas').boundingBox();
    for (let i = 0; i < 2 && !surf; i++) { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(400); surf = await page.evaluate(() => ME.placeState()); }
  }
  ok('4 clicking the bare globe surface opens the place view for THAT cell (any place selectable)', surf && surf.id === cellOf(-38, -138), surf);
  await waitPlace(page); P = await panel(page);
  ok('4 empty-ocean cell: "none … not a statement that none occurred", fires not "no fires", ships not "empty sea"', /not a statement that none occurred/.test(row(P, 'Earthquakes') || '') && /not “no fires”/.test(row(P, 'Fire detections') || '') && /not an empty sea/.test(row(P, 'Ships') || ''), P.rows.slice(2, 6));
  ok('4 no zero claims anywhere in the panel ("0 events", "0 fires", "0 vessels")', !/\b0 (event|detection|vessel|fire|buoy|sample)/.test(P.rows.map(r => r[1]).join(' ')), P.rows.map(r => r[1]).join(' | ').slice(0, 400));
  await page.keyboard.press('Escape');
  // 5. an optional layer that is ON is included automatically
  await page.click('[data-layer="drifters"]'); await page.waitForFunction(() => !/off|loading/.test(document.getElementById('s-drifters').textContent), null, { timeout: 15000 });
  await page.evaluate(() => ME.openPlace('14_49')); await waitPlace(page); P = await panel(page);
  ok('5 drifters ON → /place request carries ?layers=drifters; buoy listed with its own fix time', hits.filter(h => h.startsWith('/place/')).at(-1) === '/place/g4/14_49?layers=drifters' && /Buoy 1501695 · fix .* · SST 17\.48 °C/.test(row(P, 'Drifting buoys')), [hits.filter(h => h.startsWith('/place/')).at(-1), row(P, 'Drifting buoys')]);
  ok('5 plastic (off) still needs its own press — the earlier press was for the earlier panel only', /layer off/.test(row(P, 'Microplastic samples')), row(P, 'Microplastic samples'));
  await page.keyboard.press('Escape');
  // 6. hub failure → unknown, never zero
  placeMode = '500'; await page.evaluate(() => ME.openPlace('14_49')); await waitPlace(page); P = await panel(page); placeMode = 'ok';
  ok('6 hub failure → "Unknown — the hub could not be read … nothing is shown rather than a guess"', P.rows.length === 1 && /could not be read/.test(row(P, 'Unknown')), P.rows);
  await page.keyboard.press('Escape');
  // 7. keyboard: reach the Load button with Tab and press Enter
  await page.evaluate(() => ME.openPlace('14_49')); await waitPlace(page);
  let reached = false; for (let i = 0; i < 25 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement && document.activeElement.matches('button.placeload')); }
  ok('7 keyboard reaches a Load button', reached);
  if (reached) { const which = await page.evaluate(() => document.activeElement.dataset.placeLayer); await page.keyboard.press('Enter'); await page.waitForTimeout(800);
    ok('7 Enter on Load requests that layer for this place', hits.filter(h => h.startsWith('/place/')).at(-1).includes(which), hits.slice(-2)); }
  ok('desktop: no page errors', perr.length === 0, perr);
  await ctx.close();

  // --- phone
  ({ ctx, page, hits, perr } = await run({ width: 390, height: 844 }));
  await page.evaluate(() => ME.openPlace('14_49')); await waitPlace(page);
  const ph = await page.evaluate(() => { const i = document.getElementById('insp').getBoundingClientRect(), b = document.querySelector('#insp-dl button.placeload').getBoundingClientRect(), s = document.getElementById('sheet') ? document.getElementById('sheet').getBoundingClientRect() : { top: innerHeight };
    return { hscroll: document.documentElement.scrollWidth > innerWidth, btnH: b.height, inspBottom: i.bottom, sheetTop: s.top, scrolls: getComputedStyle(document.getElementById('insp')).overflowY }; });
  ok('phone: no sideways scroll; Load button ≥ 44 px tall', !ph.hscroll && ph.btnH >= 44, ph);
  ok('phone: the panel ends above the Readings sheet and scrolls inside itself', ph.inspBottom <= ph.sheetTop + 1 && /auto|scroll/.test(ph.scrolls), ph);
  ok('phone: no page errors', perr.length === 0, perr);
  await ctx.close(); await browser.close(); clearTimeout(wd);
  console.log(`\nplace-ui: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  crashed:', e); process.exit(1); });
