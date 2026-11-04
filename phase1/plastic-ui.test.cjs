/* Mother Earth — Microplastic samples toggle (thread 12, 4 Nov 2026). Off on a fresh load with zero plastic requests;
 * on → records + counts as one validated pair; non-zero samples as uniform markers, reported zeros as hollow rings,
 * cells as outlines only (no fill); every sample in a cell listed (collocated ones included, more than 8); each status's
 * inspector wording; text escaped; off → nothing kept or fetched; failure path; reload → off; phone width.
 * Hub routed to fixtures shaped like hub 0.4.0's envelope; real globe.gl 2.45.0 (SwiftShader).
 * Run: node phase1/plastic-ui.test.cjs   (needs the 8899 server in the repo and /home/claude/spike, as the other suites)
 */
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const D = JSON.parse(fs.readFileSync(__dirname + '/realdata/live-sample.json', 'utf8'));
const RUN = new Date(Date.now() - 60e3).toISOString(), PRUN = new Date(Date.now() - 600e3).toISOString();
const orig = (o) => ({ sample: 'OE_1', file: 'OceanEye_MedSea.txt', also_in_file: null, method_note: null, cruise: 'OceanEye', start: '2011-08-31T07:52', end: '2011-08-31T09:22', start_pos: [42.7533, 4.13], end_pos: [42.6717, 4.11],
  distance_m: 9223, distance_method: 'GPS', net_width_m: 0.6, depth_m: 0.15, mesh_um: 330, size_class: '0.3-5 mm', count: 419, count_5_25mm: 7, computed: 0.5047767, checked_against: { date: '2011-08-31', lat: 42.753333, lng: 4.13, value: 0.504779 }, tolerance: 0.005, ...o });
const REC = [
  ['0276422-0000001', 42.753333, 4.13, '2011-08-31', 0.504779, 'reproduced', orig({}), 'Manta net', 0.33, 0],
  ['0276422-0000002', 40.1, 5.2, '2012-05-01', 0, 'reproduced', orig({ sample: 'OE_2', count: 0, computed: 0, checked_against: { date: '2012-05-01', lat: 40.1, lng: 5.2, value: 0 } }), 'Manta net', 0.33, 0],
  ['0276422-0000099', 43.078167, 5.1725, '2014-04-06', 0.368834, 'possible_date_conflict', orig({ sample: 'OE_108', start: '2013-04-06T11:54', end: '2014-04-06T12:40', end_date_matches_noaa: true, checked_against: { date: '2014-04-06', lat: 43.078167, lng: 5.1725, value: 0.368834 } }), 'Manta net', 0.33, 0],
  ['0276422-0000560', 67.456083, 13.457433, '2019-08-01', 0.022234, 'not_reproduced', orig({ sample: 'TMF_2019_11', file: 'Swiss<b>Sailing</b>.txt', distance_m: 0, count: 4, count_5_25mm: 1, computed: null, end: null, checked_against: { date: '2019-08-01', lat: 67.456083, lng: 13.457433, value: 0.022234 } }), 'Manta net', 0.33, 0],
  ['0276422-0001000', -20.5, 57.5, '2023-06-30', 0, 'no_original', null, 'Manta net', 0.33, 0],
];
for (let i = 0; i < 12; i++) REC.push(['0276422-000' + (2000 + i), 36.5, -5.5, '2022-0' + (1 + i % 9) + '-1' + (i % 9), 0.1 + i / 100, 'no_original', null, 'Manta net', 0.33, 0]);   // 12 collocated samples
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const pCells = {}; for (const r of REC) { const k = cellOf(r[1], r[2]); (pCells[k] = pCells[k] || { count: 0, coverage: { grade: 'partial', evidence: 'dated_samples;one_programme_routes;not_current;tow_start_positions', observed_fraction: null } }).count++; }
const NZERO = REC.filter(r => r[4] === 0).length, NPTS = REC.length - NZERO;
let mode = 'ok';
const pEnv = rec => ({ layer: 'plastic', retrieved_at: PRUN, window_start: '2011-08-31', window_end: '2023-06-30', stale_after_s: 259200, source_status: 'ok', quantity: 'dated surface microplastic samples', cells: pCells,
  verification: { status: 'checked', counts: { reproduced: 2, not_reproduced: 1, possible_date_conflict: 1, ambiguous: 0, no_original: 13 } },
  ...(rec ? { record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m'], records: REC } : {}) });
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 600)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 5 min — failure, not a hang'); process.exit(1); }, 5 * 60e3);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const run = async (viewport) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const hits = []; const count = re => hits.filter(p => re.test(p)).length;
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route('**/arcgis.com/**', r => { hits.push('DIRECT-ARCGIS'); r.abort(); });
    await ctx.route('**/seanoe.org/**', r => { hits.push('DIRECT-SEANOE'); r.abort(); });
    await ctx.route(HUB + '/**', route => {
      const p = new URL(route.request().url()).pathname; hits.push(p);
      if (p === '/cells/plastic') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pEnv(false)) });
      if (p === '/snapshot/plastic') return mode === 'snap500' ? route.fulfill({ status: 500, body: '{}' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pEnv(true)) });
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
  const R = page => page.evaluate(() => {
    const c = ME.renderState(); const polys = window.__polys ? window.__polys() : null;
    return { r: c, p: ME.pairState('plastic').plastic, usgs: ME.pairState('usgs').usgs, leg: !document.getElementById('leg-plastic').hidden,
      st: document.getElementById('s-plastic').textContent, pressed: document.querySelector('[data-layer="plastic"]').getAttribute('aria-pressed'),
      v: document.getElementById('v-plastic').textContent, o: document.getElementById('o-plastic').textContent, note: document.getElementById('n-plastic').textContent, polys };
  });
  const toggle = async page => { await page.click('[data-layer="plastic"]'); await page.waitForTimeout(400); };
  const on = async page => { await page.click('[data-layer="plastic"]'); await page.waitForFunction(() => !document.getElementById('s-plastic').textContent.match(/^(off|loading)$/), null, { timeout: 15000 }); await page.waitForTimeout(400); };
  const openRec = async (page, lat, lng, date) => {
    await page.keyboard.press('Escape'); await page.evaluate(k => ME.openCell('plastic', k), cellOf(lat, lng)); await page.waitForTimeout(150);
    const i = await page.evaluate(d => [...document.querySelectorAll('#insp-dl .reclink')].findIndex(b => b.textContent.startsWith(d)), date);
    if (i < 0) return { h: '', html: '', text: 'no button for ' + date };
    await (await page.$$('#insp-dl .reclink'))[i].click(); await page.waitForTimeout(150);
    return page.evaluate(() => ({ h: document.getElementById('insp-h').textContent, html: document.getElementById('insp-dl').innerHTML + document.getElementById('insp-more').innerHTML, text: document.getElementById('insp-dl').innerText }));
  };

  // --- desktop
  let { ctx, page, hits, count, perr } = await run({ width: 1280, height: 860 });
  await page.evaluate(() => { const g = window.ME && ME; });
  let x = await R(page); const basePts = x.r.points;
  ok('1 fresh load: plastic off (aria-pressed false, card says off)', x.pressed === 'false' && x.st === 'off' && !x.r.on.plastic, x);
  ok('1 fresh load: no plastic markers, rings, cells or legend entry', x.r.plasticPoints === 0 && x.r.plasticRings === 0 && x.r.plasticCells === 0 && !x.leg, x.r);
  ok('1 fresh load: ZERO plastic requests; NOAA/SEANOE never contacted from the browser', count(/plastic|DIRECT/) === 0, hits.filter(h => /plastic|DIRECT/.test(h)));
  ok('1 card wording (GPT, 4 Nov): published by NOAA NCEI, tow-start, not current position, missing marker ≠ plastic-free', /published by NOAA NCEI/.test(x.note) && /tow-start locations/.test(x.note) && /not plastic's current position/.test(x.note) && /A missing marker does not establish plastic-free water/.test(x.note), x.note);

  await on(page); x = await R(page);
  ok('2 on: one validated pair (records + counts from the same run)', x.p.usable && x.p.points === REC.length, x.p);
  ok('2 on: non-zero samples drawn as markers, reported zeros as hollow rings (not markers)', x.r.plasticPoints === NPTS && x.r.plasticRings === NZERO, { pts: x.r.plasticPoints, rings: x.r.plasticRings, NPTS, NZERO });
  const cellFill = await page.evaluate(() => ME.cellPolys ? ME.cellPolys('plastic') : null);
  ok('2 on: cells outlined, never filled', x.r.plasticCells === Object.keys(pCells).length && cellFill && cellFill.every(c => c.fill === 'rgba(0,0,0,0)'), { cells: x.r.plasticCells, cellFill });
  ok('2 on: legend line says dated, tow-start, hollow ring = reported zero', x.leg && await page.evaluate(() => /2011–2024 · tow-start locations · dated observations/.test(document.getElementById('leg-plastic').textContent) && /hollow ring = source reports zero/.test(document.getElementById('leg-plastic').textContent)), x.leg);
  ok('2 on: state badge says "loaded", never "current" (GPT review 4 Nov)', x.st === 'loaded', x.st);
  ok('2 on: card count + date range + reproduced count', x.v === String(REC.length) && /2011-08-31 to 2023-06-30/.test(x.o) && /2 reproduced/.test(x.o), x);
  ok('2 on: other layers unchanged (earthquake markers still drawn)', x.r.points === basePts + NPTS && x.usgs.usable, x.r);
  ok('2 on: exactly one /cells + one /snapshot plastic request', count(/^\/cells\/plastic$/) === 1 && count(/^\/snapshot\/plastic$/) === 1, hits.filter(h => /plastic/.test(h)));

  // every collocated sample reachable — 12 at one point, more than the 8 other layers list
  await page.evaluate(k => ME.openCell('plastic', k), cellOf(36.5, -5.5)); await page.waitForTimeout(200);
  const listed = await page.evaluate(() => ({ n: document.querySelectorAll('#insp-dl .reclink').length, text: document.getElementById('insp-dl').innerText }));
  ok('3 cell lists ALL 12 collocated samples, each its own button; no "more … not listed"', listed.n === 12 && !/more in this cell, not listed/.test(listed.text), listed);
  ok('3 cell caveat: dated tow-start samples, missing marker ≠ plastic-free', /not current positions; a missing marker does not establish plastic-free water/.test(listed.text), listed.text.slice(0, 400));
  const ids = await page.evaluate(async () => { const out = []; const n = document.querySelectorAll('#insp-dl .reclink').length; for (let i = 0; i < n; i++) { ME.openCell('plastic', '31_43'); await new Promise(r => setTimeout(r, 30)); document.querySelectorAll('#insp-dl .reclink')[i].click(); await new Promise(r => setTimeout(r, 30)); out.push((document.getElementById('insp-dl').innerText.match(/0276422-\d+/) || [''])[0]); } return out; });
  ok('3 each collocated sample opens its own record (12 distinct ids)', new Set(ids).size === 12 && ids.every(Boolean), ids);

  // statuses
  let rec = await openRec(page, 42.753333, 4.13, '2011-08-31');
  ok('4 reproduced: value published by NOAA NCEI; calculation in metres; within 0.5 %; not a quality grade', /0\.504779 pieces\/m³ — published by NOAA NCEI/.test(rec.text) && /419 ÷ \(9,223 m × 0\.6 m × 0\.15 m\) = 0\.504777 pieces\/m³ — within 0\.5 % of the published 0\.504779/.test(rec.text) && /not a quality grade/.test(rec.text), rec.text.slice(0, 900));
  ok('4 reproduced: tow distance method and the excluded 5–25 mm pieces shown', /distance by GPS/.test(rec.text) && /7 pieces 5–25 mm not included/.test(rec.text), rec.text.slice(0, 900));
  rec = await openRec(page, 40.1, 5.2, '2012-05-01');
  ok('5 reproduced zero: "0 pieces/m³ — published by NOAA NCEI; Oceaneye\'s record counts no pieces"; zero explained as size range + method', /0 pieces\/m³ — published by NOAA NCEI; Oceaneye's record counts no pieces < 5 mm/.test(rec.text) && /not that the water held no plastic/.test(rec.text), rec.text.slice(0, 600));
  rec = await openRec(page, -20.5, 57.5, '2023-06-30');
  ok('5 unverified zero: "NOAA NCEI reports zero concentration for this sample" — never "zero pieces counted"', /NOAA NCEI reports zero concentration for this sample/.test(rec.text) && !/counts no pieces/.test(rec.text) && /Original count\/method detail not available in the inspected source file/.test(rec.text), rec.text.slice(0, 600));
  rec = await openRec(page, 43.078167, 5.1725, '2014-04-06');
  ok('6 date conflict: "possible corresponding record … different date"; NOAA\'s date attributed; correctness not established', /Possible corresponding record in Oceaneye's original file has a different date/.test(rec.text) && /NOAA NCEI dates this sample 2014-04-06/.test(rec.text) && /starting 2013-04-06 and ending 2014-04-06 — its end date equals NOAA's date/.test(rec.text) && /Which date is correct is not established/.test(rec.text), rec.text.slice(0, 900));
  ok('6 date conflict: no calculation claimed', !/Calculation/.test(rec.text), rec.text.slice(0, 600));
  rec = await openRec(page, 67.456083, 13.457433, '2019-08-01');
  ok('7 not reproduced: kept visible with its reason (tow distance 0 m), cause not established; "1 piece" singular', /could not be reproduced/.test(rec.text) && /1 piece 5–25 mm/.test(rec.text) && /tow distance of 0 m/.test(rec.text) && /not established/.test(rec.text), rec.text.slice(0, 700));
  ok('7 source text escaped (file name with markup)', !/<b>Sailing<\/b>/.test(rec.html) && /Swiss&lt;b&gt;Sailing/.test(rec.html), rec.html.slice(0, 200));
  await page.keyboard.press('Escape');

  // off: nothing kept, nothing fetched
  await toggle(page); x = await R(page); const before = hits.length;
  ok('8 off: markers, rings, cells and legend cleared; card off; records dropped', x.r.plasticPoints === 0 && x.r.plasticRings === 0 && x.r.plasticCells === 0 && !x.leg && x.st === 'off' && x.p.points === 0, x);
  await page.evaluate(() => ME.REFRESH_MS && window.dispatchEvent(new Event('focus'))); await page.waitForTimeout(1200);
  ok('8 off: no further plastic requests', hits.slice(before).filter(h => /plastic/.test(h)).length === 0, hits.slice(before));
  ok('9 no page errors', perr.length === 0, perr);
  await ctx.close();

  // failure: record file 500 → counts only, records withheld, nothing drawn as markers
  mode = 'snap500';
  ({ ctx, page, hits, count, perr } = await run({ width: 1280, height: 860 }));
  await on(page); x = await R(page);
  ok('10 record file fails: no markers or rings drawn; records withheld with the reason', x.r.plasticPoints === 0 && x.r.plasticRings === 0 && !x.p.usable, x);
  await ctx.close(); mode = 'ok';

  // reload → off; phone width
  ({ ctx, page, hits, count, perr } = await run({ width: 390, height: 844 }));
  x = await R(page);
  ok('11 reload: off again, zero plastic requests', x.st === 'off' && count(/plastic/) === 0, x);
  await page.evaluate(() => { const s = document.querySelector('.sheet, #readings'); if (s && s.tagName === 'DETAILS') s.open = true; });
  await page.evaluate(() => document.querySelector('[data-layer="plastic"]').scrollIntoView());
  await on(page); x = await R(page);
  const tb = await page.evaluate(() => { const b = document.querySelector('[data-layer="plastic"]').getBoundingClientRect(); const leg = document.getElementById('leg-plastic'); return { h: b.height, legVisible: leg.offsetParent !== null && getComputedStyle(leg).display !== 'none', scroll: document.documentElement.scrollWidth - innerWidth > 1 }; });
  ok('12 phone: toggle ≥ 44 px, legend line visible while on, no horizontal scroll beyond main\'s pre-existing 1 px', tb.h >= 44 && tb.legVisible && !tb.scroll, tb);
  await ctx.close();

  await browser.close(); clearTimeout(wd);
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  ' + e.stack); process.exit(1); });
