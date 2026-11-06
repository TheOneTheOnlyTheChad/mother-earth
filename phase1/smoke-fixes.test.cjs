/* GPT live smoke review, 6 Nov 2026 — guards for the four findings (branch smoke-fixes).
 *  1. FRP is shown as delivered (≤ 2 dp): a positive value never reads as 0; a reported 0 and a missing value stay distinct.
 *     Covers every FRP surface: record title (cell record list, record header, Highest FRP note, search results),
 *     the record's FRP row, and the place view line.
 *  2. Sources & Details at 360 px: no page-level horizontal overflow with the real long evidence codes; labels never split
 *     inside a word; codes still shown in full (break hints only).
 *  3. Place view ("Everything here") at 1280×900: label stacked above description; description width ≥ 300 px.
 *  4. Buoy collection paragraph: no "keeps one current snapshot only"; it points to What Mother Earth keeps.
 * Run: NODE_PATH=$(npm root -g) node --no-warnings phase1/smoke-fixes.test.cjs   (8899 static server on the repo root) */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 700)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 5 min'); process.exit(1); }, 5 * 60e3);

// ---- 1a. the formatter itself (app.js loaded without a DOM, as place-rows.test does)
globalThis.window = globalThis; globalThis.document = {}; new Function(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'))();
const F = globalThis.ME.frp;
const cases = [[5.8, '5.8 MW'], [2.33, '2.33 MW'], [0.4, '0.4 MW'], [0.04, '0.04 MW'], [746.34, '746.34 MW'], [12, '12 MW'],
  [0, '0 MW (source-reported zero)'], [null, 'not provided'], [undefined, 'not provided'], ['', 'not provided'], [0.004, '< 0.01 MW']];
for (const [x, want] of cases) ok(`ME.frp(${JSON.stringify(x)}) = "${want}"`, F(x) === want, F(x));
ok('no positive value formats as a bare zero', [0.4, 0.04, 0.004, 0.009, 0.0049].every(x => !/^0 MW$|^0\.0+ MW$/.test(F(x))), [0.4, 0.04, 0.004, 0.009, 0.0049].map(F));

// ---- 1b. place view line (pure; same fixture shape as place-rows.test)
const RUN = new Date(Date.now() - 60e3).toISOString(), OBS = new Date(Date.now() - 3600e3).toISOString().slice(0, 17) + '00Z';
const FIELDS = ['lat', 'lng', 'frp_mw', 'confidence', 'daynight', 'satellite', 'observed_at'];
const FRPS = [5.8, 2.33, 0.8, 0.4, 0, null];
const RECS = FRPS.map((f, i) => [-33.80 - i * 0.01, 18.60, f, 'n', 'D', 'N20', OBS]);
const placeBase = layers => ({ cell: { id: '14_49', ref: 'g4:14_49', west: 16, south: -36, east: 20, north: -32, area_km2: 160000 }, statement: 'Listed together because they share this 4° cell. Nothing here states a connection between them.', layers });
const placeFirms = { firms: { layer: 'firms', state: 'ok', retrieved_at: RUN, stale_after_s: 1800, records_total: RECS.length, record_fields: FIELDS, records: RECS } };
const ptext = ME.placeRows(placeBase(placeFirms), Date.now()).map(r => r[0] + ': ' + String(r[1]).replace(/<[^>]+>/g, '')).join('\n');
for (const s of ['FRP 5.8 MW', 'FRP 2.33 MW', 'FRP 0.8 MW', 'FRP 0.4 MW', 'FRP 0 MW (source-reported zero)', 'FRP not provided'])
  ok(`place view shows "${s}"`, ptext.includes(s), ptext.slice(0, 600));
ok('place view: no "FRP 0.0 MW"', !/FRP 0\.0 MW/.test(ptext), ptext.slice(0, 400));
delete globalThis.ME;

// ---- browser parts
const LONG = 'messages_flowing_inferred_from_arrival_gaps;not_a_measure_of_reception;not_geographic_coverage;receipt_history_pending;terrestrial_ais_only';
const fireSnap = { layer: 'firms', retrieved_at: RUN, stale_after_s: 1800, raw_bytes: 5000, scope: 'world', quantity: 'one VIIRS detection per pass', record_format: 'rows', record_fields: FIELDS, records: RECS,
  coverage_default: { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections' } };
const fireCells = { layer: 'firms', retrieved_at: RUN, stale_after_s: 1800, quantity: 'one VIIRS detection per pass', record_format: 'rows', record_fields: FIELDS,
  coverage_default: { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections' },
  cells: { '14_49': { count: RECS.length, coverage: { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections' } } } };
const generic = l => ({ layer: l, retrieved_at: RUN, stale_after_s: 10800, quantity: 'q', record_format: 'rows', record_fields: ['lat', 'lng', 'observed_at'], records: [], cells: {},
  coverage_default: { grade: 'partial', evidence: l === 'ships' ? LONG : l === 'usgs' ? 'feed_fresh;m2.5_completeness_map_pending;m4.5_global_complete' : 'source_documented' },
  sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null });
const PLACE = placeBase({ ...placeFirms, usgs: { layer: 'usgs', state: 'no_records', count: 0, retrieved_at: RUN, stale_after_s: 900 },
  ships: { layer: 'ships', state: 'no_records', count: 0, retrieved_at: RUN, stale_after_s: 10800 }, drifters: { layer: 'drifters', state: 'no_records', count: 0, retrieved_at: RUN } });
// globe.gl stand-in that keeps the data it is given, so ME.openCell (which reads polygonsData back) takes the click path
const GLOBE = () => { const store = {}; const g = new Proxy(function () { return g; }, { get: (_, k) => {
  if (k === 'controls') return () => ({ autoRotate: false, autoRotateSpeed: 0, addEventListener() { } });
  if (/Data$/.test(k)) return (...a) => { if (a.length) { store[k] = a[0]; return g; } return store[k] || []; };
  if (k === 'scene') return () => ({ traverse() { }, add() { }, remove() { } });
  return () => g; }, apply: () => g }); window.Globe = () => g; };

(async () => {
  const browser = await chromium.launch();
  const open = async (p, viewport) => {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* globe double installed by init script */' }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', route => { const q = new URL(route.request().url()).pathname;
      const body = q === '/' ? { name: 'x', history: { collecting: true, retained: { exists: true, first: '2026-11-05', last: RUN, layers: { drifters: { first: '2026-11-05T11:08:11Z', last: RUN } } } } }
        : q === '/snapshot/firms' ? fireSnap : q === '/cells/firms' ? fireCells : q.startsWith('/place/') ? PLACE : generic(q.split('/').pop());
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }); });
    await ctx.addInitScript(GLOBE);
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' }); return { ctx, page, perr };
  };

  // ---- 1c. World View: cell record list, record detail, Highest FRP
  {
    const { ctx, page, perr } = await open('/index.html', { width: 1280, height: 900 });
    await page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('firms').firms.usable, null, { timeout: 20000 });
    await page.evaluate(() => ME.openCell('firms', '14_49')); await page.waitForTimeout(250);
    const list = await page.evaluate(() => [...document.querySelectorAll('#insp-dl dt')].map(d => d.textContent));
    for (const s of ['5.8 MW', '2.33 MW', '0.8 MW', '0.4 MW', '0 MW (source-reported zero)', 'not provided'])
      ok(`cell record list shows "${s}"`, list.includes(s), list);
    ok('cell record list: exactly one zero, and it is labelled as the source\'s', list.filter(t => /^0(\.0+)? MW/.test(t)).length === 1 && list.includes('0 MW (source-reported zero)'), list);
    // the 0.4 MW record's own detail
    const clicked = await page.evaluate(() => { const dt = [...document.querySelectorAll('#insp-dl dt')].find(d => d.textContent === '0.4 MW');
      const b = dt && dt.nextElementSibling.querySelector('.reclink'); if (b) b.click(); return !!b; });
    ok('the 0.4 MW row has a record link', clicked); await page.waitForTimeout(200);
    const det = await page.evaluate(() => ({ h: document.getElementById('insp-h').textContent, rows: [...document.querySelectorAll('#insp-dl dt')].map(d => [d.textContent, d.nextElementSibling.textContent]) }));
    const frpRow = (det.rows.find(r => r[0] === 'Fire radiative power') || [])[1];
    ok('record detail: FRP row reads "0.4 MW"', frpRow === '0.4 MW', det);
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.getElementById('find-firms').click()); await page.waitForTimeout(150);
    const note = await page.evaluate(() => (document.getElementById('find-note') || {}).textContent || '');
    ok('Highest FRP note: "5.8 MW"', /5\.8 MW/.test(note), note.slice(0, 200));
    ok('World View: no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ---- 3. place view at 1280×900: stacked, description width
  {
    const { ctx, page, perr } = await open('/index.html', { width: 1280, height: 900 });
    await page.waitForFunction(() => window.ME && ME.openPlace, null, { timeout: 20000 });
    await page.evaluate(() => ME.openPlace('14_49'));
    await page.waitForFunction(() => /Everything here/.test(document.getElementById('insp-h').textContent) && document.querySelectorAll('#insp-dl dd').length > 3, null, { timeout: 10000 });
    const m = await page.evaluate(() => { const dl = document.getElementById('insp-dl'), dd = [...dl.querySelectorAll('dd')], dt = [...dl.querySelectorAll('dt')];
      return { panel: Math.round(document.getElementById('insp').getBoundingClientRect().width), ddMin: Math.round(Math.min(...dd.map(e => e.getBoundingClientRect().width))),
        stacked: dt.every((t, i) => dd[i] && dd[i].getBoundingClientRect().top >= t.getBoundingClientRect().bottom - 1), scroll: document.documentElement.scrollWidth, w: innerWidth }; });
    ok('place view 1280: every description at least 300 px wide (was ~131)', m.ddMin >= 300, m);
    ok('place view 1280: each label sits above its description', m.stacked, m);
    ok('place view 1280: no page overflow', m.scroll <= m.w, m);
    // a record panel keeps the two-column layout
    await page.keyboard.press('Escape'); await page.evaluate(() => ME.openCell('firms', '14_49')); await page.waitForTimeout(200);
    const two = await page.evaluate(() => { const dt = [...document.querySelectorAll('#insp-dl dt')].find(d => d.textContent === 'Quantity'), dd = dt && dt.nextElementSibling;
      return { cls: document.getElementById('insp').className, dtL: dt && dt.getBoundingClientRect().left, ddL: dd && dd.getBoundingClientRect().left, ddT: dd && dd.getBoundingClientRect().top, dtT: dt && dt.getBoundingClientRect().top }; });
    ok('cell panel keeps label and value side by side', two.ddL > two.dtL + 20 && Math.abs(two.ddT - two.dtT) < 4, two);
    ok('place view: no page errors', perr.length === 0, perr);
    await ctx.close();
  }

  // ---- 2 + 4. Sources & Details at 360 px (and 1280 unchanged in kind)
  for (const vp of [{ width: 360, height: 780 }, { width: 1280, height: 900 }]) {
    const { ctx, page, perr } = await open('/sources.html', vp);
    await page.waitForFunction(() => /terrestrial_ais_only/.test(document.getElementById('t-coverage').textContent), null, { timeout: 20000 });
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const W = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth;
      const tables = [...document.querySelectorAll('table')].map(t => Math.round(t.getBoundingClientRect().right));
      // a first-column label must never wrap inside a word: each word's text must be laid out on one line
      const split = [];
      for (const td of document.querySelectorAll('table tr td:first-child')) {
        if (!td.getBoundingClientRect().width || td.textContent.trim().split(/\s+/).length > 4) continue;   // visible labels only (t-kept's first column is prose)
        const tn = [...td.childNodes].find(n => n.nodeType === 3); if (!tn) continue;
        const text = tn.textContent; let i = 0;
        for (const w of text.split(/(\s+)/)) { if (w.trim()) { const r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + w.length); if (r.getClientRects().length > 1) split.push(w); } i += w.length; }
      }
      const cov = document.getElementById('t-coverage').textContent;
      const para = [...document.querySelectorAll('p')].find(p => /makes one request each hour/.test(p.textContent));
      return { W, sw, maxRight: Math.max(...tables), split: [...new Set(split)], codeIntact: cov.includes('messages_flowing_inferred_from_arrival_gaps;not_a_measure_of_reception;not_geographic_coverage;receipt_history_pending;terrestrial_ais_only'),
        para: para ? para.innerHTML : null, wbr: document.querySelectorAll('#t-coverage wbr').length };
    });
    const tag = `Sources ${vp.width}`;
    ok(`${tag}: no page-level horizontal overflow`, m.sw <= m.W, m);
    ok(`${tag}: every table inside the page width`, m.maxRight <= m.W, m);
    ok(`${tag}: no label split inside a word`, m.split.length === 0, m.split);
    ok(`${tag}: the long evidence code is shown in full (text unchanged)`, m.codeIntact);
    ok(`${tag}: break hints placed in the evidence codes`, m.wbr > 5, m.wbr);
    ok(`${tag}: buoy paragraph no longer says "keeps one current snapshot only"`, m.para && !/keeps one current snapshot only/.test(m.para), m.para && m.para.slice(0, 300));
    ok(`${tag}: buoy paragraph points to What Mother Earth keeps`, m.para && /href="#kept"/.test(m.para), m.para && m.para.slice(0, 300));
    ok(`${tag}: no page errors`, perr.length === 0, perr);
    await ctx.close();
  }

  await browser.close(); clearTimeout(wd);
  console.log(`\nsmoke-fixes: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  harness: ' + (e && e.stack || e)); process.exit(1); });
