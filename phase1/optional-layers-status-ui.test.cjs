/* Buoys and microplastic cards: the withheld line; run times with dates on all five record layers (15 Nov 2026, branch
 * optional-layers-status-rc; docs/concepts/OPTIONAL-LAYERS-WITHHELD-LINE-PROPOSAL.md rev 2, §5 governing).
 *   P1  "Records withheld … counts shown alone" shows only beside the count the card renders, for buoys and microplastic as for
 *       the other three. Named case: the buoy last_attempt fallback with unusable records shows a dash while the kept counts are
 *       still inside their limit, so a freshness-only gate would leave the line up.
 *   P2  a down buoy / microplastic run: "no buoy data from the latest run" / "no microplastic data from the latest run";
 *       no snapshot at all keeps "no snapshot from the hub".
 *   P3  run times in the line carry their UTC date when the runs fall on different UTC days, the year when they fall in different
 *       years; an unreadable run time reads "unknown". All five record layers. Same day: unchanged.
 * Real page; the hub's answers are fixtures shaped as the hub publishes them.
 * Run: 8899 static server on the repo root, then
 *      NODE_PATH=/home/claude/spike/node_modules:/home/claude/node_modules node --no-warnings phase1/optional-layers-status-ui.test.cjs
 * BREAK=no-gate | freshness-gate | old-wording | no-dates | no-year | no-validate | lenient-day | stale-key   each must fail. */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 900)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 14 min'); process.exit(1); }, 14 * 60e3);
const ALONE = 'counts shown alone', DIFF = 'records are from a different collector run';
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const n0 = Date.now(), iso = ms => new Date(n0 - ms).toISOString(), H = 3600e3, DAY = 86400e3;
const NOW = iso(60e3), NEWER = iso(20e3), DAYS3 = iso(3 * DAY), LASTYEAR = iso(400 * DAY);
// On-the-day pair for "same day": both inside the current UTC day (skipped in the first two minutes of a UTC day).
const SAME_A = iso(50e3), SAME_B = iso(20e3), sameDayOk = SAME_A.slice(0, 10) === SAME_B.slice(0, 10);

// ---- the expected wording, worked out here independently of the page's function
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const hm = s => s.slice(11, 16) + ' UTC', dm = s => `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]}`, yr = s => s.slice(0, 4);
const realDay = v => { const m = /^(\d{4})-(\d\d)-(\d\d)T/.exec(v); if (!m) return false; const y = +m[1], mo = +m[2], da = +m[3], dim = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; return mo >= 1 && mo <= 12 && da >= 1 && da <= dim[mo - 1]; };
const expectTimes = (r, c) => { const good = v => typeof v === 'string' && Number.isFinite(Date.parse(v)) && realDay(v);
  if (!good(r) || !good(c)) { const f = v => good(v) ? `${dm(v)} ${yr(v)} ${hm(v)}` : 'unknown'; return `records ${f(r)}, counts ${f(c)}`; }
  if (yr(r) !== yr(c)) return `records ${dm(r)} ${yr(r)} ${hm(r)}, counts ${dm(c)} ${yr(c)} ${hm(c)}`;
  if (r.slice(0, 10) !== c.slice(0, 10)) return `records ${dm(r)} ${hm(r)}, counts ${dm(c)} ${hm(c)}`;
  return `records ${hm(r)}, counts ${hm(c)}`; };

const served = { index: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), app: fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'), sources: fs.readFileSync(path.join(ROOT, 'sources.html'), 'utf8') };
{ const rep = (k, a, b) => { const before = served[k]; served[k] = served[k].split(a).join(b); if (served[k] === before) { console.log('FAIL  break did not apply'); process.exit(1); } };
  if (BREAK === 'no-gate') rep('index', "const noCount = layer in cardCount && cardCount[layer] === null;", "const noCount = ['usgs', 'firms', 'ships'].includes(layer) && cardCount[layer] === null;");   // main's behaviour for the optional cards
  if (BREAK === 'freshness-gate') rep('index', "showCount('drifters', f.grade !== 'unknown' && s && !noRecords ? ME.total(s) : null);", "showCount('drifters', f.grade !== 'unknown' && s && !noRecords ? ME.total(s) : null); cardCount.drifters = f.grade !== 'unknown' && s ? ME.total(s) : null;");   // gate on freshness, not on what the card renders
  if (BREAK === 'old-wording') { rep('index', "down ? 'no buoy data from the latest run' : ", ''); rep('index', "s && s.source_status === 'down' ? 'no microplastic data from the latest run' : ", ''); }
  if (BREAK === 'no-dates') rep('app', "const day = !both || year || r.getUTCMonth() !== c.getUTCMonth() || r.getUTCDate() !== c.getUTCDate();", "const day = false;");                                    // hours and minutes only, as on main
  if (BREAK === 'no-year') rep('app', "year = !both || r.getUTCFullYear() !== c.getUTCFullYear();", "year = false;");
  if (BREAK === 'no-validate') rep('app', "const ok = v => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(Date.parse(v)).toISOString().slice(0, 10) === v.slice(0, 10), d =", "const ok = v => true, d =");
  if (BREAK === 'lenient-day') rep('app', " && new Date(Date.parse(v)).toISOString().slice(0, 10) === v.slice(0, 10), d =", ', d =');
  if (BREAK === 'stale-key') rep('sources', /app\.js\?v=\d+/.exec(served.sources)[0], 'app.js?v=202612021000'); }

const cov = { grade: 'partial', evidence: 'e', observed_fraction: 1 };
const env0 = (layer, extra) => ({ layer, schema_version: 1, collector_version: '0.6.14', retrieved_at: NOW, source_status: 'ok', stale_after_s: 10800, window_start: iso(3 * H), window_end: NOW, quantity: 'q', record_format: 'rows', ...extra });
const mk = (layer, fields, recs, extra, at) => { const cells = {}; const a = fields.indexOf('lat'), b = fields.indexOf('lng'); for (const r of recs) { const k = cellOf(r[a], r[b]); (cells[k] = cells[k] || { count: 0, coverage: cov }).count++; }
  return { snap: env0(layer, { record_fields: fields, records: recs, cells, ...extra, retrieved_at: at }), cells: env0(layer, { cells, ...extra, retrieved_at: at }) }; };
const UF = ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], SF = ['mmsi', 'name', 'lat', 'lng', 'sog_kn', 'class', 'observed_at', 'received_at'],
  FF = ['lat', 'lng', 'frp_mw', 'confidence', 'daynight', 'satellite', 'observed_at'], DF = ['id', 'lat', 'lng', 'observed_at', 'sst_c', 'platform_type', 'country'],
  PF = ['id', 'lat', 'lng', 'sampled_on', 'pieces_m3', 'check', 'original', 'method', 'mesh_mm', 'depth_m'];
const U = (at, recs = [['q1', -33.9, 18.4, 10, 3.1, 'ml', iso(3 * H), 'M 3.1 - off Cape Town', '']]) => mk('usgs', UF, recs, { source_generated_at: NOW, source_age_s: 40, stale_after_s: 900 }, at);
const S = (at, recs = [['601000001', 'TEST VESSEL', -33.8, 18.5, 9.1, 'A', iso(3 * H), NOW], ['601000002', 'TEST TWO', -33.7, 18.4, 3, 'B', iso(3 * H), NOW]]) => mk('ships', SF, recs, { window_s: 60, class_a: 1, class_b: 1, socket_connected_s: 60, collected_by: 'mac', stale_after_s: 10800, window_end: at }, at);
const F = (at, recs = [[-33.5, 19.1, 12.4, 'n', 'D', 'N20', iso(2 * H)], [-12.2, 28.6, 60.1, 'h', 'N', 'N20', iso(2 * H)]]) => mk('firms', FF, recs, { stale_after_s: 2400, raw_bytes: 5000, scope: 'world' }, at);
const D = (at, recs = [['1301', -34.2, 17.1, iso(2 * H), 16.4, 'DRIFTING BUOYS (GENERIC)', 'ZA'], ['1302', -10.1, -20.3, iso(1 * H), 25.1, 'DRIFTING BUOYS (GENERIC)', 'US']], extra = {}) => mk('drifters', DF, recs, { stale_after_s: 4 * 3600, window_end: iso(1 * H), ...extra }, at);
const P = (at, recs = [['OE-1', 43.2, 7.4, '2023-06-02', 0.41, 'reproduced', null, 'manta', 0.33, 0], ['OE-2', 28.1, -15.5, '2024-10-23', 0, 'reproduced', null, 'manta', 0.33, 0]]) => mk('plastic', PF, recs, { stale_after_s: 72 * 3600, window_start: '2011-05-01', window_end: '2024-10-23' }, at);
const down = (layer, note, stale) => ({ schema_version: 1, collector_version: '0.6.14', layer, window_start: null, window_end: null, retrieved_at: iso(30e3), scheduled_for: iso(30e3), source_status: 'down', interruptions: [], stale_after_s: stale, cells: {}, record_format: 'rows', record_fields: [], note });   // writeDown's envelope, records removed
const withLA = (cells, failedMs) => ({ ...cells, last_attempt: { failed_at: iso(failedMs), run: iso(failedMs + 60e3), reason: 'http 522' } });
const NONE = 'none';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (L, opt = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(BASE + '/index.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: served.index }));
    await ctx.route(BASE + '/sources.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: served.sources }));
    await ctx.route(BASE + '/app.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: served.app }));
    await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const j = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
      const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p); if (m && L[m[2]] === NONE) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"no snapshot yet"}' });
      if (m && L[m[2]]) return j(m[1] === 'cells' ? L[m[2]].cells : L[m[2]].snap);
      if (m) return j(env0(m[2], { cells: {}, index: null, record_fields: [], records: [], sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW } }));
      if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } }); route.fulfill({ status: 404, body: '{}' }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/' + (opt.page || 'index.html'), { waitUntil: 'domcontentloaded' });
    if (!opt.page) { await page.waitForFunction(() => window.ME && ME.pairState && ['usgs', 'ships', 'firms'].every(k => ME.pairState(k)[k].cells), null, { timeout: 40000 }).catch(() => { });   // a page that never settles is reported by the checks below
      for (const k of opt.on || []) { await page.evaluate(k => document.querySelector(`button.tgl[data-layer="${k}"]`).click(), k);
        await page.waitForFunction(k => !['off', 'loading'].includes(document.getElementById('s-' + k).textContent), k, { timeout: 20000 }).catch(() => { }); }
      await page.waitForTimeout(900); }
    return { ctx, page, perr };
  };
  const read = page => page.evaluate(() => { const g = id => document.getElementById(id); const c = k => ({ state: g('s-' + k).textContent, count: g('v-' + k).textContent, lineShown: !g('p-' + k).hidden, line: g('p-' + k).textContent, obs: g('o-' + k).textContent, src: g('m-' + k).textContent });
    const o = {}; for (const k of ['usgs', 'firms', 'ships', 'drifters', 'plastic']) o[k] = c(k); o.visible = document.body.innerText; o.pair = ME.pairState(); return o; });
  const base = () => ({ usgs: U(NOW), ships: S(NOW), firms: F(NOW) });

  // ---- P3 as a function: every shape, straight from the served app.js
  { const { ctx, page, perr } = await open(base());
    const T = [['2026-11-15T10:50:00.000Z', '2026-11-15T10:55:00.000Z'], ['2026-11-10T10:50:00.000Z', '2026-11-14T10:50:00.000Z'], ['2026-10-31T23:59:00.000Z', '2026-11-01T00:01:00.000Z'],
      ['2026-12-31T23:50:00.000Z', '2027-01-01T00:10:00.000Z'], ['2025-11-15T10:50:00.000Z', '2026-11-15T10:50:00.000Z'], ['n/a', '2026-11-15T10:50:00.000Z'], ['2026-11-15T10:50:00.000Z', null],
      [{}, '2026-11-15T10:50:00.000Z'], [1763203800000, '2026-11-15T10:50:00.000Z'], ['2026-02-31T10:50:00Z', undefined], ['', ''], ['2026-11-15T23:59:59.000Z', '2026-11-16T00:00:00.000Z']];
    const got = await page.evaluate(T => T.map(([r, c]) => { try { return ME.runTimes(r, c); } catch (e) { return 'THREW ' + String(e && e.message); } }), T.map(([r, c]) => [r === undefined ? null : r, c === undefined ? null : c]));
    T.forEach(([r, c], i) => { const want = expectTimes(r, c); ok(`runTimes ${JSON.stringify(r)} / ${JSON.stringify(c)} → "${want}"`, got[i] === want && !/NaN|undefined|Invalid|null|\[object/.test(got[i]), got[i]); });
    ok('runTimes: the exact example from the proposal', got[1] === 'records 10 Nov 10:50 UTC, counts 14 Nov 10:50 UTC', got[1]);
    ok('runTimes: one minute either side of a year end shows both years', got[3] === 'records 31 Dec 2026 23:50 UTC, counts 1 Jan 2027 00:10 UTC', got[3]);
    ok('runTimes: an impossible calendar day (31 February) reads unknown, not 3 March', got[9] === 'records unknown, counts unknown', got[9]);
    ok('runTimes: same day stays times only', got[0] === 'records 10:50 UTC, counts 10:55 UTC', got[0]);
    ok('runTimes: no page error', !perr.length, perr); await ctx.close(); }

  const CASES = [
    // ---- buoys (P1, P2)
    ['B1 buoys down, last good records', { drifters: { cells: down('drifters', 'http 522', 14400), snap: D(iso(2 * H)).snap } }, 'drifters', { state: 'unknown', count: '–', line: false, obs: 'no buoy data from the latest run', src: /collector reported down: http 522/ }],
    ['B2 buoys stale (5 h), mismatched records', { drifters: { cells: D(iso(5 * H)).cells, snap: D(iso(6 * H)).snap } }, 'drifters', { state: 'unknown', count: '–', line: false }],
    ['B3 buoys mismatch, valid count', { drifters: { cells: D(SAME_B).cells, snap: D(SAME_A).snap } }, 'drifters', { state: 'current', count: '2', line: [SAME_A, SAME_B] }],
    ['B4 buoys kept run after a failed update (last_attempt), counts inside their limit, records from another run', { drifters: { cells: withLA(D(iso(1 * H)).cells, 10 * 60e3), snap: D(iso(2 * H)).snap } }, 'drifters', { state: 'unknown', count: '–', line: false, obs: 'buoy positions not shown', fresh: true }],
    ['B5 buoys kept run after a failed update, records paired', { drifters: (x => ({ cells: withLA(x.cells, 10 * 60e3), snap: x.snap }))(D(iso(1 * H))) }, 'drifters', { state: 'degraded', count: '2', line: false }],
    ['B6 buoys: no snapshot at all', { drifters: NONE }, 'drifters', { state: 'unknown', count: '–', line: false, obs: 'no snapshot from the hub' }],
    ['B7 buoys valid zero, mismatched records', { drifters: { cells: D(NEWER, []).cells, snap: D(iso(2 * H)).snap } }, 'drifters', { state: 'current', count: '0', line: [iso(2 * H), NEWER] }],
    ['B8 buoys runs three days apart, count visible', { drifters: { cells: D(NEWER).cells, snap: D(DAYS3).snap } }, 'drifters', { state: 'current', count: '2', line: [DAYS3, NEWER], dated: true }],
    ['B9 buoys matched', { drifters: D(NOW) }, 'drifters', { state: 'current', count: '2', line: false }],
    // ---- microplastic (P1, P2)
    ['M1 microplastic down, last good records', { plastic: { cells: down('plastic', 'http 503', 259200), snap: P(iso(2 * H)).snap } }, 'plastic', { state: 'unknown', count: '–', line: false, obs: 'no microplastic data from the latest run', src: /collector reported down: http 503/ }],
    ['M2 microplastic stale (4 days), mismatched records', { plastic: { cells: P(iso(4 * DAY)).cells, snap: P(iso(5 * DAY)).snap } }, 'plastic', { state: 'unknown', count: '–', line: false }],
    ['M3 microplastic mismatch, valid count', { plastic: { cells: P(SAME_B).cells, snap: P(SAME_A).snap } }, 'plastic', { state: 'loaded', count: '2', line: [SAME_A, SAME_B] }],
    ['M4 microplastic: no snapshot at all', { plastic: NONE }, 'plastic', { state: 'unknown', count: '–', line: false, obs: 'no snapshot from the hub' }],
    ['M5 microplastic runs one day apart at the same clock time, count visible', { plastic: { cells: P(NEWER).cells, snap: P(iso(DAY + 20e3)).snap } }, 'plastic', { state: 'loaded', count: '2', line: [iso(DAY + 20e3), NEWER], dated: true }],
    ['M6 microplastic matched', { plastic: P(NOW) }, 'plastic', { state: 'loaded', count: '2', line: false }],
    // ---- the other three record layers (P3 applies to all five)
    ['X1 earthquakes runs three days apart, count visible', { usgs: { cells: U(NEWER).cells, snap: U(DAYS3).snap } }, 'usgs', { state: 'current', count: '1', line: [DAYS3, NEWER], dated: true }],
    ['X2 fires runs three days apart, count visible', { firms: { cells: F(NEWER).cells, snap: F(DAYS3).snap } }, 'firms', { state: 'current', count: '2', line: [DAYS3, NEWER], dated: true }],
    ['X3 ships runs three days apart, count visible', { ships: { cells: S(NEWER).cells, snap: S(DAYS3).snap } }, 'ships', { state: 'current', count: '2', line: [DAYS3, NEWER], dated: true }],
    ['X4 earthquakes runs in different years, count visible', { usgs: { cells: U(NEWER).cells, snap: U(LASTYEAR).snap } }, 'usgs', { state: 'current', count: '1', line: [LASTYEAR, NEWER], dated: true, year: true }],
    ['X5 earthquakes records carry an unreadable run time, count visible', { usgs: { cells: U(NEWER).cells, snap: U('n/a').snap } }, 'usgs', { state: 'current', count: '1', line: ['n/a', NEWER], unknown: true }],
    ['X6 buoys records carry an unreadable run time, count visible', { drifters: { cells: D(NEWER).cells, snap: D('yesterday-ish').snap } }, 'drifters', { state: 'current', count: '2', line: ['yesterday-ish', NEWER], unknown: true }],
    ['X7 earthquakes same day', { usgs: { cells: U(SAME_B).cells, snap: U(SAME_A).snap } }, 'usgs', { state: 'current', count: '1', line: [SAME_A, SAME_B] }],
  ];
  for (const [tag, over, k, e] of CASES) {
    const L = { ...base(), ...over }; const { ctx, page, perr } = await open(L, { on: ['drifters', 'plastic'].filter(x => x in over) }); const r = await read(page), c = r[k];
    ok(`${tag}: badge "${e.state}"`, c.state === e.state, c);
    ok(`${tag}: count "${e.count}"`, c.count === e.count, c);
    ok(`${tag}: withheld line ${e.line ? 'shown' : 'hidden'}`, c.lineShown === !!e.line, c);
    if (e.line) { const want = expectTimes(e.line[0], e.line[1]);
      ok(`${tag}: the line reads "${DIFF} (${want}) — ${ALONE}", beside a displayed number`, c.line === `Records withheld: ${DIFF} (${want}) — ${ALONE}` && /^[\d,]+$/.test(c.count), c.line);
      if (e.dated) ok(`${tag}: both run times carry their date${e.year ? ' and year' : ''}`, (c.line.match(e.year ? /\d{1,2} [A-Z][a-z]{2} \d{4} \d\d:\d\d UTC/g : /\d{1,2} [A-Z][a-z]{2} \d\d:\d\d UTC/g) || []).length === 2, c.line);
      else if (!e.unknown) ok(`${tag}: same UTC day — times only, no date${sameDayOk ? '' : ' (skipped: UTC day changed during the run)'}`, !sameDayOk && e.line[0] === SAME_A || /\(records \d\d:\d\d UTC, counts \d\d:\d\d UTC\)/.test(c.line), c.line);
      if (e.unknown) ok(`${tag}: the unreadable run time reads "unknown"; the other carries its full date`, /\(records unknown, counts \d{1,2} [A-Z][a-z]{2} \d{4} \d\d:\d\d UTC\)/.test(c.line), c.line);
    } else ok(`${tag}: the hidden line holds no text and "${ALONE}" is nowhere on the visible page`, c.line === '' && !r.visible.includes(ALONE), c.line);
    if (e.obs) ok(`${tag}: description "${e.obs}"`, c.obs === e.obs, c.obs);
    if (e.src) ok(`${tag}: the source line still gives the down reason`, e.src.test(c.src), c.src);
    if (e.fresh) { const f = await page.evaluate(k => ME.freshness(k).grade, k); ok(`${tag}: the kept counts ARE inside their limit (freshness ${f}), so only the rendered count can hide the line`, f !== 'unknown', f);
      ok(`${tag}: the card says the update failed`, /Latest update failed at \d\d:\d\d UTC/.test(c.src), c.src); }
    ok(`${tag}: nothing on the card prints "undefined", "NaN", "Invalid" or "null"`, !/undefined|NaN|Invalid|null/.test(c.obs + c.src + c.line + c.count), [c.obs, c.src, c.line]);
    ok(`${tag}: every other record card's line is hidden (their records are paired)`, ['usgs', 'firms', 'ships', 'drifters', 'plastic'].filter(x => x !== k).every(x => !r[x].lineShown), Object.fromEntries(['usgs', 'firms', 'ships', 'drifters', 'plastic'].map(x => [x, r[x].lineShown])));
    ok(`${tag}: records are drawn only when paired with the counts`, e.line ? r.pair[k].usable === false && r.pair[k].points === 0 : true, r.pair[k]);
    ok(`${tag}: no page error`, !perr.length, perr); await ctx.close();
  }

  // ---- the line follows the card through a switch-off: off is not "withheld"
  { const { ctx, page, perr } = await open({ ...base(), drifters: { cells: D(NEWER).cells, snap: D(DAYS3).snap } }, { on: ['drifters'] }); let r = await read(page);
    ok('T buoys on, mismatched: line shown', r.drifters.lineShown && r.drifters.count === '2', r.drifters);
    await page.evaluate(() => document.querySelector('button.tgl[data-layer="drifters"]').click()); await page.waitForTimeout(500); r = await read(page);
    ok('T buoys switched off: dash, line hidden and empty', r.drifters.state === 'off' && r.drifters.count === '–' && !r.drifters.lineShown && r.drifters.line === '', r.drifters);
    ok('T: no page error', !perr.length, perr); await ctx.close(); }

  // ---- cache key (app.js changed): the same on both pages, newer than the freshness-wording release
  { const { ctx, page, perr } = await open(base(), { page: 'sources.html' }); await page.waitForTimeout(1500);
    const src = await page.evaluate(() => [...document.scripts].map(s => s.getAttribute('src')).find(s => s && s.startsWith('app.js')));
    const ix = (served.index.match(/app\.js\?v=(\d+)/) || [])[1];
    ok('app.js cache key is the same on both pages and newer than the freshness-wording release (202612021000)', src === 'app.js?v=' + ix && ix > '202612021000', { sources: src, index: ix });
    ok('Sources page: no page error', !perr.length, perr); await ctx.close(); }

  await browser.close(); clearTimeout(wd);
  console.log(`optional-layers-status-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('ERR', e); process.exit(1); });
