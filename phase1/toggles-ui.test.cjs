/* Mother Earth — independent optional layers: Aircraft and Satellites (thread 7, 3 Nov 2026).
 * Both OFF on a fresh load; each on by itself; both on; both off again. Each toggle may change only its own layer,
 * and an optional layer makes no request while off. Hub routed to fixtures; real globe.gl + satellite.js; real timers.
 * Run: node phase1/toggles-ui.test.cjs <frozen celestrak csv>     (needs the 8899 server and /home/claude/spike, as the other suites)
 */
const { chromium } = require('playwright');
const fs = require('fs'); const crypto = require('crypto');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const SATJS = fs.readFileSync('/home/claude/spike/node_modules/satellite.js/dist/satellite.min.js', 'utf8');
const D = JSON.parse(fs.readFileSync(__dirname + '/realdata/live-sample.json', 'utf8'));
const FULL = fs.readFileSync(process.argv[2], 'utf8'); const CSV = FULL.split('\n').slice(0, 2001).join('\n') + '\n';   // 2,000 objects: this suite tests independence, not scale
const sha = crypto.createHash('sha256').update(CSV, 'utf8').digest('hex'); const HEADER = CSV.slice(0, CSV.indexOf('\n')).replace(/\r$/, '');
const RUN = new Date(Date.now() - 60e3).toISOString(), AIR_RUN = new Date(Date.now() - 90e3).toISOString();
const AIR = [['abc123', -33.97, 18.6, AIR_RUN, AIR_RUN, 'SAA321', 'South Africa', 10668, false, 230, 87, 0, 0], ['def456', -26.1, 28.2, AIR_RUN, AIR_RUN, 'BAW55', 'United Kingdom', 11277, false, 245, 10, 0, 0], ['aaa111', 51.47, -0.45, AIR_RUN, AIR_RUN, '', 'United Kingdom', null, true, 0, 0, 0, 0]];
const airCells = { '14_49': { count: 1, coverage: { grade: 'partial', evidence: 'receiver_network_coverage_not_mapped', observed_fraction: 1 } }, '15_52': { count: 1, coverage: { grade: 'partial', evidence: 'x', observed_fraction: 1 } }, '35_44': { count: 1, coverage: { grade: 'partial', evidence: 'x', observed_fraction: 1 } } };
const airEnv = rec => ({ layer: 'opensky', retrieved_at: AIR_RUN, window_end: AIR_RUN, stale_after_s: 3600, source_status: 'ok', quantity: 'aircraft', cells: airCells, ...(rec ? { record_format: 'rows', record_fields: ['icao24', 'lat', 'lng', 'observed_at', 'last_contact', 'callsign', 'origin_country', 'baro_alt_m', 'on_ground', 'velocity_ms', 'track_deg', 'position_source', 'category'], records: AIR } : {}) });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 6 min — failure, not a hang'); process.exit(1); }, 6 * 60e3);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
  const hits = []; const count = re => hits.filter(p => re.test(p)).length;
  await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
  await ctx.route('**/cdn.jsdelivr.net/npm/satellite.js@6.0.2/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: SATJS, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
  await ctx.route('**/opensky-network.org/**', r => { hits.push('DIRECT-OPENSKY'); r.abort(); });
  await ctx.route(HUB + '/**', route => {
    const p = new URL(route.request().url()).pathname; hits.push(p);
    if (p === '/snapshot/satellites') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ layer: 'satellites', tier: 'model', source_status: 'ok', retrieved_at: RUN, source_stamp: RUN, elements: { rows: 2000, sha256: sha, header: HEADER } }) });
    if (p === '/elements/satellites') return route.fulfill({ status: 200, contentType: 'text/csv', body: CSV });
    if (p === '/cells/opensky') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(airEnv(false)) });
    if (p === '/snapshot/opensky') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(airEnv(true)) });
    const body = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: D.usgs.map(([lat, lng, mag, t, ob]) => ['x', lat, lng, 10, mag, 'mb', ob, t, '']) }
      : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { '14_49': { count: 50, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } }
      : { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
  await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.renderState, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const R = () => page.evaluate(() => ({ r: ME.renderState(), s: ME.satState(), air: ME.pairState('opensky').opensky, legAir: !document.getElementById('leg-opensky').hidden, legSat: !document.getElementById('sat-legend').hidden, airState: document.getElementById('s-opensky').textContent, airPressed: document.querySelector('[data-layer="opensky"]').getAttribute('aria-pressed'), satChecked: document.getElementById('tgl-sat').getAttribute('aria-checked') }));
  const airOn = async () => { await page.click('[data-layer="opensky"]'); await page.waitForFunction(() => ME.pairState('opensky').opensky.usable, null, { timeout: 15000 }); await page.waitForTimeout(300); };
  const airOff = async () => { await page.click('[data-layer="opensky"]'); await page.waitForTimeout(300); };
  const openExp = async () => { if (await page.locator('#exp-btn').getAttribute('aria-expanded') !== 'true') await page.click('#exp-btn'); };
  const satOn = async () => { await openExp(); await page.click('#tgl-sat'); await page.waitForFunction(() => ME.satState().on && ME.satState().last, null, { timeout: 30000 }); };
  const satOff = async () => { await openExp(); await page.click('#tgl-sat'); await page.waitForTimeout(300); };

  // 1. both off on a fresh load
  let x = await R(); const base = x.r.points;
  ok('1 fresh load: aircraft off (aria-pressed false, card says off)', x.airPressed === 'false' && x.airState === 'off' && !x.r.on.opensky, x);
  ok('1 fresh load: satellites off', x.satChecked === 'false' && !x.s.on && !x.s.hasLayer, x.s);
  ok('1 fresh load: no aircraft points or cells, no legend entries', x.r.aircraftPoints === 0 && x.r.aircraftCells === 0 && !x.legAir && !x.legSat, x);
  ok('1 fresh load: no request for aircraft or satellites at all', count(/opensky|satellites/) === 0, hits.filter(h => /opensky|satellites/.test(h)));
  ok('1 the always-on layers rendered (earthquake points present)', base > 0, base);

  // 2. aircraft only
  await airOn(); x = await R();
  ok('2 aircraft only: 3 aircraft points + 3 aircraft cells drawn', x.r.aircraftPoints === 3 && x.r.aircraftCells === 3, x.r);
  ok('2 aircraft only: other points unchanged', x.r.points - x.r.aircraftPoints === base, x.r);
  ok('2 aircraft only: satellites untouched (off, no layer, never requested)', !x.s.on && !x.s.hasLayer && count(/satellites/) === 0, x.s);
  ok('2 aircraft only: aircraft legend entry shown; card shows a value', x.legAir && !x.legSat && /current|degraded/.test(x.airState), x);
  ok('2 aircraft read from the hub only, never from OpenSky directly', count(/^DIRECT-OPENSKY$/) === 0 && count(/^\/cells\/opensky$/) === 1 && count(/^\/snapshot\/opensky$/) === 1, hits.filter(h => /opensky/i.test(h)));

  // 3. satellites only
  await airOff(); x = await R();
  ok('3 aircraft off: its points, cells and legend entry removed; others unchanged', x.r.aircraftPoints === 0 && x.r.aircraftCells === 0 && !x.legAir && x.r.points === base, x);
  ok('3 aircraft off: nothing of it kept', x.air.points === 0 && !x.air.usable, x.air);
  await satOn(); x = await R();
  ok('3 satellites only: on, one visible particle object', x.s.on && x.s.particleObjects.n === 1 && x.s.particleObjects.v === 1 && x.legSat, x.s);
  ok('3 satellites only: aircraft still off and not requested again', !x.r.on.opensky && x.r.aircraftPoints === 0 && count(/opensky/) === 2, x.r);
  ok('3 satellites only: observation points unchanged', x.r.points === base, x.r);

  // 4. both on
  await airOn(); x = await R();
  ok('4 both on: aircraft drawn AND satellites visible', x.r.aircraftPoints === 3 && x.s.on && x.s.particleObjects.v === 1, x);
  ok('4 both on: other points unchanged', x.r.points - x.r.aircraftPoints === base, x.r);
  // satellites toggled while aircraft on: aircraft unaffected
  await satOff(); x = await R();
  ok('4b satellites off while aircraft on: aircraft unaffected', x.r.aircraftPoints === 3 && !x.s.on && x.s.particleObjects.v === 0 && !x.legSat && x.legAir, x);
  await satOn(); x = await R();
  ok('4c satellites back on while aircraft on: both present', x.r.aircraftPoints === 3 && x.s.on && x.s.particleObjects.v === 1, x);
  // aircraft toggled while satellites on: satellites unaffected (still propagating)
  const seq0 = x.s.seq; await airOff(); await page.waitForTimeout(4500); x = await R();
  ok('4d aircraft off while satellites on: satellites unaffected and still updating', x.s.on && x.s.particleObjects.v === 1 && x.s.seq > seq0 && x.r.aircraftPoints === 0, { seq0, s: x.s });

  // 5. both off
  await satOff(); const seqOff = (await R()).s.seq; await page.waitForTimeout(4500); x = await R();
  ok('5 both off: no aircraft, satellites hidden, timers stopped, no further propagation', x.r.aircraftPoints === 0 && x.r.aircraftCells === 0 && !x.s.on && x.s.particleObjects.v === 0 && !x.s.timer && x.s.seq === seqOff, x);
  ok('5 both off: legend entries gone; observation points unchanged', !x.legAir && !x.legSat && x.r.points === base, x);
  const before = hits.length; await page.waitForTimeout(3000);
  ok('5 both off: no optional-layer requests while off', hits.slice(before).filter(h => /opensky|satellites/.test(h)).length === 0, hits.slice(before));

  // 6. a fresh reload starts with both off again (no persisted state)
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.ME && ME.renderState && ME.pairState('usgs').usgs.usable, null, { timeout: 30000 }); await page.waitForTimeout(800);
  x = await R();
  ok('6 reload: both off again', !x.r.on.opensky && !x.s.on && x.r.aircraftPoints === 0 && !x.s.hasLayer && x.airPressed === 'false' && x.satChecked === 'false', x);
  ok('7 no page errors', perr.length === 0, perr);
  await browser.close(); clearTimeout(wd);
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
