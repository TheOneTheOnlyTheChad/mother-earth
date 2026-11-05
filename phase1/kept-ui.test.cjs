/* "What Mother Earth keeps" follows what the hub REPORTS (GET / → history: {collecting, retained:{exists, first, last, layers}}).
 * Two separate facts: collecting now, and history already retained. Collection off never reads as "deleted" or "no history";
 * an unreadable hub reads as unknown, never "none". States: off+none · on · off-after-trial (retained) · unreadable; and the
 * transitions on → off and on → unreadable inside one open page (GPT re-check, 5 Nov). Sources & Details and World View.
 * Run: node --no-warnings phase1/kept-ui.test.cjs   (8899 server + /home/claude/spike, as the other suites) */
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 600)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 5 min'); process.exit(1); }, 5 * 60e3);
const RUN = new Date(Date.now() - 60e3).toISOString();
const usgs = { layer: 'usgs', retrieved_at: RUN, source_generated_at: RUN, source_age_s: 1, stale_after_s: 900, quantity: 'q', record_format: 'rows', record_fields: ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], records: [['q1', -33.9, 18.4, 10, 3.1, 'ml', RUN, 'M 3.1', '']], cells: { '14_49': { count: 1, coverage: { grade: 'partial', evidence: 'e', observed_fraction: 1 } } } };
const LAYERS = { usgs: { first: '2026-11-06T08:00:00.000Z', last: '2026-11-09T07:00:00.000Z' }, firms: { first: '2026-11-06', last: '2026-11-08' }, drifters: { first: '2026-11-06T08:07:00Z', last: '2026-11-09T07:07:00Z' }, seaice: null, orbital: null, co2: { first: '2026-11-06T09:07:00Z', last: '2026-11-09T07:07:00Z' }, plastic: null };
const S = {
  offNone: { collecting: false, retained: { exists: false } },
  on: { collecting: true, retained: { exists: true, first: '2026-11-06T08:00:00.000Z', last: '2026-11-09T07:07:00Z', layers: LAYERS } },
  offRetained: { collecting: false, retained: { exists: true, first: '2026-11-06T08:00:00.000Z', last: '2026-11-09T07:07:00Z', layers: LAYERS } },
  dbUnreadable: { collecting: true, retained: { exists: null, problem: 'history records unreadable' } },
};
let mode = 'offNone';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async path => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(HUB + '/**', route => { const p = new URL(route.request().url()).pathname;
      if (p === '/') return mode === 'down' ? route.fulfill({ status: 503, body: '{}' }) : route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ name: 'x', history: S[mode] }) });
      if (p === '/snapshot/usgs' || p === '/cells/usgs') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(usgs) });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ layer: p.split('/').pop(), retrieved_at: RUN, stale_after_s: 10800, cells: {}, quantity: 'i', sweep: { answered: 0, cells_total: 559, oldest_queried_at: RUN }, index: null }) }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' }); return { ctx, page, perr };
  };
  const read = page => page.evaluate(() => ({ state: document.getElementById('kept-state').textContent, rows: [...document.querySelectorAll('#t-kept .hist-row')].filter(x => !x.hidden).map(x => x.dataset.hl + ' → ' + x.querySelector('.hk').textContent),
    table: document.getElementById('t-kept').textContent, intro: document.querySelector('#kept + p').textContent, cmp: document.getElementById('t-cmp').textContent }));
  const settle = page => page.waitForFunction(() => !/reading the hub/.test(document.getElementById('kept-state').textContent), null, { timeout: 20000 });

  // ---- Sources & Details, one page through the transitions
  mode = 'offNone'; const { ctx, page, perr } = await open('/sources.html'); await settle(page);
  let r = await read(page);
  ok('static: no "None of it is shown" sentence; the place-view exception is stated', !/None of it is shown/.test(r.intro) && /One exception: the place view/.test(r.intro), r.intro);
  ok('static: the Oceaneye row no longer says the samples are not kept', !/not kept beyond the current file/.test(r.table), r.table.slice(0, 200));
  ok('static: no absolute "no history" claim anywhere in the table', !/no history/i.test(r.table), r.table);
  // Every layer that reaches a Comparison line (Sources t-cmp: ME.LAYERS; inspector: map + optional layers) has a kept statement,
  // and no page text falls back to an absolute "no history kept" (fallback removed 5 Nov, thread 15).
  const keptAll = await page.evaluate(() => [...ME.LAYERS, 'drifters', 'plastic'].map(l => [l, !!ME.kept(l)]));
  ok('every layer with a Comparison line has a kept statement', keptAll.every(([, v]) => v), keptAll);
  ok('no "no history kept" text in the comparison table', !/no history kept/.test(r.cmp), r.cmp.slice(0, 300));
  ok('off + none: "History collection now: off … Retained history: none."; no history row', /History collection now: off .* Retained history: none\./.test(r.state) && r.rows.length === 0, r);
  ok('off + none: comparison lines say "no further history collected" (not "no history kept")', /no further history collected/.test(r.cmp) && !/no history kept/.test(r.cmp), r.cmp.slice(0, 300));
  mode = 'on'; await page.evaluate(() => ME.sourcesTick()); r = await read(page);
  ok('on: collection on + retained range; rows shown for layers collecting (6 rows)', /collection now: on .* Retained history: from 2026-11-06 08:00 UTC/.test(r.state) && r.rows.length === 6, r);
  ok('on: a row with retained data says "collecting; retained since"; one without says "nothing retained yet"', r.rows.some(x => /^usgs → no end date set \(collecting; retained since 2026-11-06\)/.test(x)) && r.rows.some(x => /^seaice → no end date set \(collecting; nothing retained yet\)/.test(x)), r.rows);
  mode = 'offRetained'; await page.evaluate(() => ME.sourcesTick()); r = await read(page);
  ok('on → off: collection off, retained history still listed with its range and "not deleted"; nothing says "no history"', /collection now: off .* Retained history: from 2026-11-06/.test(r.state) && r.rows.some(x => /^usgs → retained for 2026-11-06 to 2026-11-09; collection off — not deleted/.test(x)) && !/no history/i.test(r.table), r);
  ok('on → off: layers with nothing retained are not listed as retained', !r.rows.some(x => /^seaice /.test(x)) && !r.rows.some(x => /^orbital /.test(x)), r.rows);
  ok('on → off: comparison lines keep the retained history, marked collection off', /retained for 2026-11-06 to 2026-11-09; collection is off now — retained history is not deleted/.test(r.cmp), r.cmp.slice(0, 500));
  mode = 'on'; await page.evaluate(() => ME.sourcesTick()); mode = 'down'; await page.evaluate(() => ME.sourcesTick()); r = await read(page);
  ok('on → unreadable hub: state UNKNOWN, no history row asserted, nothing claims "none"', /could not be read just now .* unknown/.test(r.state) && r.rows.length === 0 && !/Retained history: none/.test(r.state), r);
  ok('on → unreadable hub: comparison lines say it could not be read — not "no history"', /whether further history is kept could not be read just now/.test(r.cmp) && !/no further history collected/.test(r.cmp), r.cmp.slice(0, 300));
  mode = 'dbUnreadable'; await page.evaluate(() => ME.sourcesTick()); r = await read(page);
  ok('hub readable but history records unreadable → unknown as well', /could not be read just now/.test(r.state) && r.rows.length === 0, r);
  const counts = await page.evaluate(() => [...document.querySelectorAll('table')].filter(t => t.id).map(t => t.id + ':' + t.querySelectorAll('tr').length));
  for (let i = 0; i < 3; i++) await page.evaluate(() => ME.sourcesTick());
  const after = await page.evaluate(() => [...document.querySelectorAll('table')].filter(t => t.id).map(t => t.id + ':' + t.querySelectorAll('tr').length));
  ok('refreshing does not grow any table (fill() removes every row after the header; one stale row per refresh before, found 5 Nov)', JSON.stringify(counts) === JSON.stringify(after), { counts, after });
  ok('sources: no page errors', perr.length === 0, perr); await ctx.close();

  // ---- World View: a cell's Comparison row through on → off → unreadable
  mode = 'on'; const w = await open('/index.html');
  await w.page.waitForFunction(() => window.ME && ME.pairState && ME.pairState('usgs').usgs.usable && ME.HISTORY, null, { timeout: 30000 });
  const cmp = async () => { await w.page.evaluate(() => ME.openCell('usgs', '14_49')); await w.page.waitForTimeout(150); const t = await w.page.evaluate(() => { const dt = [...document.querySelectorAll('#insp-dl dt')].find(d => d.textContent === 'Comparison'); return dt ? dt.nextElementSibling.textContent : null; }); await w.page.keyboard.press('Escape'); return t; };
  let c = await cmp(); ok('World View on: "collecting; retained since 2026-11-06"', /every revision of every event we receive.*\(collecting; retained since 2026-11-06\)/.test(c || ''), c);
  mode = 'offRetained'; await w.page.evaluate(() => ME.loadHistory()); c = await cmp(); ok('World View on → off: retained range kept, "collection is off now — retained history is not deleted"', /retained for 2026-11-06 to 2026-11-09; collection is off now — retained history is not deleted/.test(c || ''), c);
  mode = 'down'; await w.page.evaluate(() => ME.loadHistory()); c = await cmp(); ok('World View → unreadable: "could not be read just now", never "no history"', /whether further history is kept could not be read just now/.test(c || '') && !/no history|no further history/.test(c || ''), c);
  ok('World View: no page errors', w.perr.length === 0, w.perr); await w.ctx.close();
  await browser.close(); clearTimeout(wd); console.log(`\nkept-ui: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.log('FAIL  crashed:', e); process.exit(1); });
