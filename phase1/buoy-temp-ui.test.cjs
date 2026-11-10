/* Mother Earth — buoy water-temperature colours in the page (BUOY-TEMPERATURE-PROPOSAL rev 2).
 * Real globe.gl (SwiftShader), hub routed to fixtures. Checks what the page HANDS THE RENDERER (each drifter point's
 * colour against an expectation written out here by hand), what is RENDERED (keys visible with real size; pixels
 * sampled at the projected dot positions), the off path, both ocean layers on together (buoys + day/night), and
 * phone width.
 * Run: node phase1/buoy-temp-ui.test.cjs   (needs `python3 -m http.server 8899 --bind 127.0.0.1` in the repo and
 *      /home/claude/spike with globe.gl@2.45.0 + pngjs, as the other suites)
 * Breaks: BREAK=fixed-yellow|key-always|null-zero node phase1/buoy-temp-ui.test.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const { PNG } = require('/home/claude/spike/node_modules/pngjs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
// Stand-in backdrop: uniform dark ocean (#10233a), so the globe builds (it waits for its image) and the pixel check
// measures each dot against the colour it has to stand out from.
const ocean = new PNG({ width: 64, height: 32 });
for (let i = 0; i < ocean.data.length; i += 4) { ocean.data[i] = 16; ocean.data[i + 1] = 35; ocean.data[i + 2] = 58; ocean.data[i + 3] = 255; }
const OCEAN_PNG = PNG.sync.write(ocean);
const RUN = new Date(Date.now() - 60e3).toISOString(), DRUN = new Date(Date.now() - 120e3).toISOString();
const FIX = new Date(Date.now() - 3 * 3600e3).toISOString();
// id, lat, lng, fix, sst_c, type, country — temperatures chosen at and beside the class edges
const BUOYS = [
  ['B-NEG', -60.0, 20.0, FIX, -1.2, 'DRIFTING BUOYS', 'X'], ['B-ZERO', -58.0, 22.0, FIX, 0, 'DRIFTING BUOYS', 'X'],
  ['B-499', -50.0, 10.0, FIX, 4.99, 'DRIFTING BUOYS', 'X'], ['B-500', -49.0, 11.0, FIX, 5.0, 'DRIFTING BUOYS', 'X'],
  ['B-1748', -33.26, -0.29, FIX, 17.48, 'DRIFTING BUOYS', 'X'], ['B-2999', 5.0, -30.0, FIX, 29.99, 'DRIFTING BUOYS', 'X'],
  ['B-3000', 6.0, -29.0, FIX, 30.0, 'DRIFTING BUOYS', 'X'], ['B-NULL', 19.41, -87.52, FIX, null, 'DRIFTING BUOYS', 'X'],
  // three close together for the pixel check (cold, warm, unavailable), on the side the camera is turned to below
  ['P-COLD', -2.0, 0.0, FIX, -1.5, 'DRIFTING BUOYS', 'X'], ['P-WARM', 0.0, 2.0, FIX, 33.0, 'DRIFTING BUOYS', 'X'], ['P-NONE', 2.0, 0.0, FIX, null, 'DRIFTING BUOYS', 'X'],
];
// expected colour per buoy, written out by hand (viridis classes; grey #54545a for none)
const WANT = { 'B-NEG': '#3b528b', 'B-ZERO': '#2e6e8e', 'B-499': '#2e6e8e', 'B-500': '#24878e', 'B-1748': '#3aba76', 'B-2999': '#b8de29',
  'B-3000': '#fde725', 'B-NULL': '#54545a', 'P-COLD': '#3b528b', 'P-WARM': '#fde725', 'P-NONE': '#54545a' };
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const dCells = {}; for (const b of BUOYS) { const k = cellOf(b[1], b[2]); (dCells[k] = dCells[k] || { count: 0, coverage: { grade: 'partial', evidence: 'buoy_positions_only', observed_fraction: null } }).count++; }
const dEnv = rec => ({ layer: 'drifters', retrieved_at: DRUN, window_start: FIX, window_end: FIX, stale_after_s: 14400, source_status: 'ok', quantity: 'drifting buoys with a reported fix in the last 24 h (latest fix per buoy)', cells: dCells, refused: { future: 0, bad_time: 0, bad_position: 0, field_count: 0, duplicate: 0, too_old: 0 },
  ...(rec ? { record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'], records: BUOYS } : {}) });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 600)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 6 min — failure, not a hang'); process.exit(1); }, 6 * 60e3);

// Breaks are applied to the served page source (routed), so each changes what the browser runs.
const breakPage = (path, body) => {
  if (BREAK === 'fixed-yellow' && path.endsWith('/index.html')) return body.replace("col: ME.sstColour(d.sst_c)", "col: '#ffd86b'");
  if (BREAK === 'key-always' && path.endsWith('/index.html')) return body.replace("$('sstkey-drifters').hidden = !on.drifters;", "$('sstkey-drifters').hidden = false;");
  if (BREAK === 'null-zero' && path.endsWith('/app.js')) return body.replace("if (t === null || t === undefined || t === '' || typeof t === 'boolean') return -1;", "if (t === undefined || t === '' || typeof t === 'boolean') return -1;");
  return body;
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const run = async (viewport) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const hits = [];
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.fulfill({ status: 200, contentType: 'image/png', body: OCEAN_PNG }));
    await ctx.route(BASE + '/**', async route => {
      const u = new URL(route.request().url()); const p = u.pathname;
      if (BREAK && /\/(index\.html|app\.js)$/.test(p)) {
        const body = fs.readFileSync(__dirname + '/..' + p, 'utf8');
        return route.fulfill({ status: 200, contentType: p.endsWith('.js') ? 'application/javascript' : 'text/html', body: breakPage(p, body) });
      }
      route.continue();
    });
    await ctx.route(HUB + '/**', route => {
      const p = new URL(route.request().url()).pathname; hits.push(p);
      if (p === '/cells/drifters') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dEnv(false)) });
      if (p === '/snapshot/drifters') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(dEnv(true)) });
      const body = p === '/snapshot/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: [['q1', 40, 140, 10, 5.1, 'mb', RUN, 't', '']] }
        : p === '/cells/usgs' ? { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', cells: { [cellOf(40, 140)]: { count: 1, coverage: { grade: 'adequate', evidence: 'e', observed_fraction: 1 } } } }
        : p.startsWith('/snapshot/orbital') || p.startsWith('/elements') ? null
        : { layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null };
      if (!body) return route.fulfill({ status: 404, body: '{}' });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.renderState && ME.renderState(), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    return { ctx, page, hits, perr };
  };
  const vis = (page, id) => page.evaluate(i => { const e = document.getElementById(i); if (!e) return { exists: false }; const r = e.getBoundingClientRect();
    return { exists: true, hidden: e.hidden, shown: !!e.offsetParent && r.width > 0 && r.height > 0, w: Math.round(r.width), h: Math.round(r.height), text: e.innerText.slice(0, 200), html: e.innerHTML.slice(0, 400) }; }, id);
  const drawn = page => page.evaluate(() => ME.globe().pointsData().filter(p => p.buoy !== undefined).map(p => [p.buoy, String(p.col).toLowerCase(), p.sst_c]));
  const on = async page => { await page.click('[data-layer="drifters"]'); await page.waitForFunction(() => !document.getElementById('s-drifters').textContent.match(/off|loading/), null, { timeout: 15000 }); await page.waitForTimeout(400); };

  // ---------------- desktop
  let { ctx, page, hits, perr } = await run({ width: 1280, height: 860 });
  let k = await vis(page, 'sstkey-drifters'), m = await vis(page, 'leg-drifters');
  ok('1 fresh load: card key and main-key entry not shown while drifters are off', !k.shown && !m.shown, { k, m });
  ok('1 fresh load: no drifter request', !hits.some(h => /drifters/.test(h)), hits);

  await on(page);
  const pts = await drawn(page);
  ok('2 every fixture buoy drawn', pts.length === BUOYS.length, pts.length);
  for (const [id, col, t] of pts) ok(`2 ${id} (${t === null ? 'null' : t + ' °C'}) drawn ${WANT[id]}`, col === WANT[id], col);
  ok('2 exactly 0 °C drawn as a class colour, not grey', (pts.find(p => p[0] === 'B-ZERO') || [])[1] === '#2e6e8e');
  ok('2 no drifter dot keeps the old fixed yellow', !pts.some(p => p[1] === '#ffd86b'), pts.map(p => p[1]));

  k = await vis(page, 'sstkey-drifters'); m = await vis(page, 'leg-drifters');
  ok('3 card key shown with real size while on', k.shown && k.h > 10, k);
  ok('3 card key: GPT wording, fix times vary, not compared with normal, grey = Temperature unavailable',
    /Water temperature at each buoy's latest reported fix \(°C\)\. Fix times vary\./.test(k.text) && /Not compared with normal/.test(k.text) && /Temperature unavailable/.test(k.text), k.text);
  ok('3 card key: eight class dots + one grey dot, actually rendered', await page.evaluate(() => { const ds = [...document.querySelectorAll('#sstkey-drifters .dot')];
    return ds.length === 9 && ds.every(d => d.offsetParent && d.getBoundingClientRect().width > 0); }));
  ok('3 main key: buoy entry shown, says coloured by water temperature, no fixed yellow dot', m.shown && /coloured by water temperature/.test(m.text) && !/ffd86b|--drift\)/.test(m.html), m);
  ok('3 main key: swatch shows the 8 scale colours', await page.evaluate(() => document.querySelectorAll('#leg-drifters-sw .dot').length === 8));

  // inspector unchanged: Observed label and the fix time stay; missing SST not shown as 0
  await page.evaluate(k => ME.openCell('drifters', k), cellOf(19.41, -87.52)); await page.waitForTimeout(200);
  await page.click('#insp-dl .reclink'); await page.waitForTimeout(200);
  const insp = await page.evaluate(() => document.getElementById('insp-dl').innerText);
  ok('4 inspector: Observed, fix time, missing SST "not provided" (never 0)', /Observed/.test(insp) && /Sea-surface temperature\s*not provided/i.test(insp) && !/0\.00 °C/.test(insp), insp.slice(0, 400));
  await page.keyboard.press('Escape');

  // rendered pixels at the projected positions of a cold, a warm and an unavailable dot (close-up so dots are pixels wide)
  await page.evaluate(() => { const g = ME.globe(); g.controls().autoRotate = false; g.pointOfView({ lat: 0, lng: 1, altitude: 0.08 }, 0); });
  await page.waitForTimeout(1500);
  const at = await page.evaluate(() => { const g = ME.globe(), el = document.getElementById('globe').getBoundingClientRect();
    return Object.fromEntries(g.pointsData().filter(p => /^P-/.test(p.buoy)).map(p => { const s = g.getScreenCoords(p.lat, p.lng, p.alt); return [p.buoy, { x: Math.round(s.x), y: Math.round(s.y), w: Math.round(el.width), h: Math.round(el.height) }]; })); });
  const shot = PNG.sync.read(await page.locator('#globe').screenshot());
  const px = ({ x, y }) => { // mean of a 3×3 patch at the dot centre
    let r = 0, g = 0, b = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = ((y + dy) * shot.width + (x + dx)) * 4; r += shot.data[i]; g += shot.data[i + 1]; b += shot.data[i + 2]; n++; }
    return [r / n, g / n, b / n].map(Math.round); };
  const cold = px(at['P-COLD']), warm = px(at['P-WARM']), none = px(at['P-NONE']);
  const sat = c => Math.max(...c) - Math.min(...c);
  ok('5 rendered: cold dot is blue-dominant (B > R)', cold[2] > cold[0] + 15, { cold, at: at['P-COLD'] });
  ok('5 rendered: warm dot is yellow (R and G well above B)', warm[0] > warm[2] + 60 && warm[1] > warm[2] + 60, { warm, at: at['P-WARM'] });
  const oc = px({ x: Math.round((at['P-COLD'].x + at['P-WARM'].x) / 2) + 40, y: Math.round((at['P-COLD'].y + at['P-WARM'].y) / 2) - 40 });   // open water between the dots
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  ok('5 rendered: unavailable dot is grey (low saturation) and distinct from both', sat(none) < 25 && dist(none, cold) > 30 && dist(none, warm) > 60, { none, cold, warm });
  ok('5 rendered: all three dots stand out from the surrounding ocean', dist(cold, oc) > 30 && dist(warm, oc) > 60 && dist(none, oc) > 30, { cold, warm, none, oc });
  fs.writeFileSync('/tmp/claude-0/-home-claude/32477202-b637-51bb-86c4-956cd7b98c69/scratchpad/buoy-closeup.png', PNG.sync.write(shot));

  // both "ocean" layers on together: buoys + day/night (Ocean Heat does not exist on any branch yet)
  await page.evaluate(() => ME.globe().pointOfView({ lat: -10, lng: 25, altitude: 2.2 }, 0));
  await page.click('#tgl-night'); await page.waitForTimeout(800);
  k = await vis(page, 'sstkey-drifters'); m = await vis(page, 'leg-drifters'); const nl = await vis(page, 'night-legend');
  ok('6 drifters + day/night on: card key, main-key buoy entry and the night legend all shown', k.shown && m.shown && nl.shown, { k: k.shown, m: m.shown, nl });
  ok('6 drifters + day/night on: buoy colours unchanged by the overlay', JSON.stringify(await drawn(page)) === JSON.stringify(pts));
  await page.click('#tgl-night'); await page.waitForTimeout(300);

  // off
  await page.click('[data-layer="drifters"]'); await page.waitForTimeout(400);
  k = await vis(page, 'sstkey-drifters'); m = await vis(page, 'leg-drifters');
  ok('7 off: no drifter dots, card key and main-key entry hidden', (await drawn(page)).length === 0 && !k.shown && !m.shown, { k: k.shown, m: m.shown });
  ok('8 no page errors', perr.length === 0, perr);
  await ctx.close();

  // ---------------- phone 390 × 844
  ({ ctx, page, hits, perr } = await run({ width: 390, height: 844 }));
  await page.evaluate(() => { const b = document.querySelector('[data-layer="drifters"]'); b.scrollIntoView(); });
  await on(page);
  k = await vis(page, 'sstkey-drifters');
  ok('9 phone: card key rendered with real size', k.shown && k.w > 100 && k.h > 10, k);
  ok('9 phone: card key fits the viewport width (no horizontal scroll)', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 &&
    document.getElementById('sstkey-drifters').getBoundingClientRect().right <= window.innerWidth + 1));
  ok('9 phone: no page errors', perr.length === 0, perr);
  await page.locator('#card-drifters').screenshot({ path: '/tmp/claude-0/-home-claude/32477202-b637-51bb-86c4-956cd7b98c69/scratchpad/buoy-card-phone.png' });
  await ctx.close();

  await browser.close(); clearTimeout(wd);
  console.log(`\n${pass} passed, ${fail} failed${BREAK ? `  (BREAK=${BREAK})` : ''}`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  harness error: ' + e.stack); process.exit(1); });
