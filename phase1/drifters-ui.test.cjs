/* Mother Earth — Drifting buoys toggle (thread 10, 3 Nov 2026). OFF on a fresh load with zero drifter requests; on →
 * records + counts as one validated pair, drawn; off → nothing kept, nothing fetched; the other layers untouched;
 * failure paths; reload → off; phone width. Hub routed to fixtures; real globe.gl (SwiftShader).
 * Run: node phase1/drifters-ui.test.cjs   (needs the 8899 server in the repo and /home/claude/spike, as the other suites)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const D = JSON.parse(fs.readFileSync(__dirname + '/realdata/live-sample.json', 'utf8'));
const RUN = new Date(Date.now() - 60e3).toISOString(), DRUN = new Date(Date.now() - 120e3).toISOString();
const FIX = new Date(Date.now() - 3 * 3600e3).toISOString();
const BUOYS = [['1101570', 50.3989, -173.6824, FIX, 8.24, 'DRIFTING BUOYS', 'EUROPEAN UNION'], ['1101577', 19.4062, -87.5175, FIX, null, 'DRIFTING BUOYS', 'EUROPEAN UNION'],
  ['21730', 16.72, 131.24, FIX, 28.9, 'DRIFTING BUOYS (GENERIC)', 'KOREA, REPUBLIC OF'], ['<b>x</b>', -33.2648, -0.2878, FIX, 17.48, 'DRIFTING BUOYS', 'UNITED <i>KINGDOM</i>']];
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const dCells = {}; for (const b of BUOYS) { const k = cellOf(b[1], b[2]); (dCells[k] = dCells[k] || { count: 0, coverage: { grade: 'partial', evidence: 'buoy_positions_only', observed_fraction: null } }).count++; }
let driftMode = 'ok';
const dEnv = rec => ({ layer: 'drifters', retrieved_at: driftMode === 'mismatch' && rec ? new Date(Date.now() - 30e3).toISOString() : DRUN, window_start: FIX, window_end: FIX, stale_after_s: 14400, source_status: 'ok', quantity: 'drifting buoys with a reported fix in the last 24 h (latest fix per buoy)', cells: dCells, refused: { future: 10, bad_time: 0, bad_position: 0, field_count: 0, duplicate: 0, too_old: 0 },
  ...(rec ? { record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'], records: BUOYS } : {}) });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 500)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 5 min — failure, not a hang'); process.exit(1); }, 5 * 60e3);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const run = async (viewport) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const hits = []; const count = re => hits.filter(p => re.test(p)).length;
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route('**/osmc.noaa.gov/**', r => { hits.push('DIRECT-OSMC'); r.abort(); });
    await ctx.route(HUB + '/**', route => {
      const p = new URL(route.request().url()).pathname; hits.push(p);
      if (p === '/cells/drifters') return driftMode === 'cells404' ? route.fulfill({ status: 404, body: '{}' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dEnv(false)) });
      if (p === '/snapshot/drifters') return driftMode === 'snap500' ? route.fulfill({ status: 500, body: '{}' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dEnv(true)) });
      const body = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: D.usgs.map(([lat, lng, mag, t, ob]) => ['x', lat, lng, 10, mag, 'mb', ob, t, '']) }
        : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { '14_49': { count: 50, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } }
        : p.startsWith('/snapshot/orbital') || p.startsWith('/elements') ? null
        : { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
      if (!body) return route.fulfill({ status: 404, body: '{}' });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.renderState && ME.renderState(), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    return { ctx, page, hits, count, perr };
  };
  const R = page => page.evaluate(() => ({ r: ME.renderState(), d: ME.pairState('drifters').drifters, usgs: ME.pairState('usgs').usgs, leg: !document.getElementById('leg-drifters').hidden,
    st: document.getElementById('s-drifters').textContent, pressed: document.querySelector('[data-layer="drifters"]').getAttribute('aria-pressed'), v: document.getElementById('v-drifters').textContent, o: document.getElementById('o-drifters').textContent, pair: document.getElementById('p-drifters').hidden ? '' : document.getElementById('p-drifters').textContent }));
  const on = async page => { await page.click('[data-layer="drifters"]'); await page.waitForFunction(() => !document.getElementById('s-drifters').textContent.match(/off|loading/), null, { timeout: 15000 }); await page.waitForTimeout(300); };
  const off = async page => { await page.click('[data-layer="drifters"]'); await page.waitForTimeout(300); };

  // --- desktop
  let { ctx, page, hits, count, perr } = await run({ width: 1280, height: 860 });
  let x = await R(page); const basePts = x.r.points;
  ok('1 fresh load: drifters off (aria-pressed false, card says off)', x.pressed === 'false' && x.st === 'off' && !x.r.on.drifters, x);
  ok('1 fresh load: no drifter points, cells or legend entry', x.r.driftPoints === 0 && x.r.driftCells === 0 && !x.leg, x);
  ok('1 fresh load: ZERO drifter requests, never OSMC directly', count(/drifters|OSMC/) === 0, hits.filter(h => /drifters|OSMC/.test(h)));
  ok('1 always-on layers rendered', basePts > 0, basePts);

  await on(page); x = await R(page);
  ok('2 on: one validated pair (records + counts from the same run)', x.d.usable && x.d.points === 4, x.d);
  ok('2 on: all 4 buoys drawn, cells outlined, legend entry shown', x.r.driftPoints === 4 && x.r.driftCells === Object.keys(dCells).length && x.leg, x.r);
  ok('2 on: card shows the count and that refused reports are not drawn', x.v === '4' && /10 reports refused/.test(x.o) && /own last fix/.test(x.o), x);
  ok('2 on: other layers unchanged (earthquake points still drawn)', x.r.points === basePts + 4 && x.usgs.usable, x.r);
  ok('2 on: exactly one /cells + one /snapshot drifters request', count(/^\/cells\/drifters$/) === 1 && count(/^\/snapshot\/drifters$/) === 1, hits.filter(h => /drifters/.test(h)));

  // inspector: open the cell holding the markup-bearing buoy (same path as a click), then its record
  const ck = cellOf(-33.2648, -0.2878);
  ok('3 cell opens through the click path', await page.evaluate(k => ME.openCell('drifters', k), ck));
  await page.waitForTimeout(200);
  await page.click('#insp-dl .reclink'); await page.waitForTimeout(200);
  const rec = await page.evaluate(() => ({ h: document.getElementById('insp-h').textContent, html: document.getElementById('insp-dl').innerHTML, text: document.getElementById('insp-dl').innerText }));
  ok('3 record view: buoy id and country escaped (no markup injected)', !/<b>x<\/b>|<i>KINGDOM/.test(rec.html) && /&lt;b&gt;x/.test(rec.html), rec.html.slice(0, 300));
  ok('3 record view: its own fix time, SST, caveat that where it is now is unknown', /Observed/.test(rec.text) && /17\.48/.test(rec.text) && /where it is now is unknown/.test(rec.text), rec.text.slice(0, 600));
  await page.keyboard.press('Escape');
  const nk = cellOf(19.4062, -87.5175);
  await page.evaluate(k => ME.openCell('drifters', k), nk); await page.waitForTimeout(200); await page.click('#insp-dl .reclink'); await page.waitForTimeout(200);
  const nan = await page.evaluate(() => document.getElementById('insp-dl').innerText);
  ok('3 missing SST shown as not provided, never 0', /Sea-surface temperature\s*not provided/i.test(nan) && !/0\.00 °C/.test(nan), nan.slice(0, 400));
  await page.keyboard.press('Escape');

  await off(page); const nReq = count(/drifters/); x = await R(page);
  ok('4 off: no points, no cells, no legend, card says off, records cleared', x.r.driftPoints === 0 && x.r.driftCells === 0 && !x.leg && x.st === 'off' && x.d.points === 0, x);
  ok('4 off: other layers unchanged', x.r.points === basePts, x.r);
  await page.evaluate(() => ME.REFRESH_MS);   // no-op read
  await page.evaluate(async () => { await new Promise(r => setTimeout(r, 50)); });
  ok('4 off: no further drifter requests', count(/drifters/) === nReq, hits.filter(h => /drifters/.test(h)));

  for (let i = 0; i < 10; i++) await page.click('[data-layer="drifters"]');
  await page.waitForTimeout(2500); x = await R(page);
  ok('5 ten rapid toggles end OFF with nothing drawn or kept', x.st === 'off' && x.r.driftPoints === 0 && x.d.points === 0, x);

  // failure paths: each leaves the toggle on but draws nothing it cannot pair, and says why
  driftMode = 'snap500'; await on(page); x = await R(page);
  ok('6 record file 500: counts shown alone, records withheld with the reason, nothing drawn', x.r.driftPoints === 0 && /could not be read/.test(x.pair), x);
  await off(page);
  driftMode = 'mismatch'; await on(page); x = await R(page);
  ok('6 records from a different run: withheld, nothing drawn', x.r.driftPoints === 0 && /different collector run/.test(x.pair), x);
  await off(page);
  driftMode = 'cells404'; await page.click('[data-layer="drifters"]'); await page.waitForTimeout(1500); x = await R(page);
  ok('6 counts unreadable: Unknown, nothing drawn', x.r.driftPoints === 0 && /unknown/i.test(x.st), x);
  await off(page); driftMode = 'ok';
  ok('6 failure paths left the other layers alone', (await R(page)).r.points === basePts);

  await on(page); await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.ME && ME.renderState && ME.renderState(), null, { timeout: 30000 }); await page.waitForTimeout(800);
  x = await R(page); ok('7 reload → off again, nothing drawn', x.st === 'off' && x.r.driftPoints === 0, x);
  ok('8 no page errors', perr.length === 0, perr);
  await ctx.close();

  // --- phone
  ({ ctx, page, hits, count, perr } = await run({ width: 390, height: 844 }));
  const btnH = await page.evaluate(() => document.querySelector('[data-layer="drifters"]').getBoundingClientRect().height);
  const hs = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  ok('10 phone 390 px: toggle ≥ 44 px tall, no horizontal scroll', btnH >= 44 && hs, { btnH, hs });
  await ctx.close();

  await browser.close(); clearTimeout(wd);
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  harness error: ' + e.stack); process.exit(1); });
