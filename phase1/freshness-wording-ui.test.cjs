/* Freshness wording for dated indices (15 Nov 2026, branch freshness-wording-rc;
 * docs/concepts/FRESHNESS-WORDING-PROPOSAL.md rev 2, §6 governing).
 *   F1  Kp, CO₂ and Sea ice: an adequate grade reads "fresh copy" on the card badge, in the summary report's states and on the
 *       Sources page. Earthquakes, fires and ships keep "current"; microplastic keeps "loaded"; degraded and unknown are unchanged.
 *   F2  The badge tooltip gives both times: "Our copy was retrieved 52 min ago. This value is for 13 November 2026." Kp names its
 *       UTC interval with its date. Sea ice names both dates when the hemispheres differ, on the card, in the tooltip, in the
 *       report and in the Sources row. The card keeps its observation line and its "retrieved N ago" line.
 *   F3  Ships: "retrieved N ago" (never "received") on the source line when there is an actual sample with a usable timestamp;
 *       the sample end stays visible; a down run and an unreadable timestamp show no retrieval age.
 * Envelope shapes are the live hub's (read 15 Nov 2026 08:44 UTC). Real fonts for the layout checks.
 * Run: 8899 static server on the repo root, then
 *      NODE_PATH=/home/claude/spike/node_modules node --no-warnings phase1/freshness-wording-ui.test.cjs
 * Round 2 (GPT's hold): observation dates are validated once (ME.validDate) and every surface reads the result — a missing or
 * impossible date (2026-02-31) is "not supplied" on the card, tooltip, report and Sources row; an unreadable retrieval time is
 * never "fresh copy" or "NaN h ago"; a stale ships sample shows its age once; a Kp interval that crosses midnight names both days.
 * Round 3: the Sources table prints a retrieval time only if it is a readable timestamp (ME.stamp; 'n/a' and {} give "Retrieval
 * time unknown" and the table still builds); CO₂ and sea-ice dates must be exactly YYYY-MM-DD.
 * BREAK=word-current | no-tip | one-ice-date | ships-received | ships-age-always | no-date-check | nan-fresh | ships-age-twice | raw-sources-cell | loose-date   each must fail. */
const { chromium } = require('playwright');
const coreOn = h => { if (!h.includes("const START_ON = [];")) throw new Error('index.html: START_ON = [] not found'); return h.replace("const START_ON = [];", "const START_ON = ['usgs', 'firms', 'ships', 'forest'];"); };   // this suite was written for the page with the four core layers on at load; the bare default is tested in bare-earth-ui.test.cjs
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const F = '/home/claude/spike/node_modules/@fontsource/';
const face = (fam, dir, w) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${F}${dir}/files/${dir}-latin-${w}-normal.woff2`).toString('base64')}) format("woff2")}`;
const CSS = [face('IBM Plex Mono', 'ibm-plex-mono', 400), face('IBM Plex Mono', 'ibm-plex-mono', 500), face('Barlow Condensed', 'barlow-condensed', 500), face('Barlow Condensed', 'barlow-condensed', 600), face('Barlow Condensed', 'barlow-condensed', 700)].join('');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 900)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 12 min'); process.exit(1); }, 12 * 60e3);
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const iso = ms => new Date(Date.now() - ms).toISOString(), GOOD = iso(3 * 3600e3), NOW = iso(60e3);   // iso() reads the clock when a fixture is built, so stated ages hold however long the suite has run

const served = { index: coreOn(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')), app: fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'), sources: fs.readFileSync(path.join(ROOT, 'sources.html'), 'utf8') };
{ const rep = (k, a, b) => { const before = served[k]; served[k] = served[k].replace(a, b); if (served[k] === before) { console.log('FAIL  break did not apply'); process.exit(1); } };
  if (BREAK === 'word-current') rep('app', "ME.DATED_INDICES.includes(layer) ? 'fresh copy' : 'current'", "'current'");               // main's badge
  if (BREAK === 'no-tip') rep('index', "(ME.freshTip(k, f) || f.why)", "f.why");                                                       // main's tooltip
  if (BREAK === 'one-ice-date') rep('app', "return n === so ? `This value is for ${n}.` : `The Arctic value is for ${n}; the Antarctic value is for ${so}.`;", "return `This value is for ${n}.`;");
  if (BREAK === 'ships-received') rep('index', " · retrieved ${esc(R.ships.retrievedAge)}", " · received ${esc(R.ships.retrievedAge)}");
  if (BREAK === 'no-date-check') rep('app', "if (mo < 1 || mo > 12 || da < 1 || da > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return null;", "if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;");   // round 1's check: 31 February passes
  if (BREAK === 'nan-fresh') rep('app', "if (!Number.isFinite(ageS)) return { grade: 'unknown', why: 'the time our copy was retrieved could not be read' };", '');                    // round 1: an unreadable retrieval time still earned the badge
  if (BREAK === 'ships-age-twice') rep('index', "R.ships.retrievedAge ? R.ships.fresh.why.replace(` (${R.ships.retrievedAge})`, '') : R.ships.fresh.why", "R.ships.fresh.why");
  if (BREAK === 'raw-sources-cell') rep('sources', "(st => st ? esc(st + ' (' + ago(R[l].retrieved) + ')') : 'Retrieval time unknown')(ME.stamp(R[l].retrieved))", "esc(R[l].retrieved.replace('T', ' ').slice(0, 19) + ' UTC (' + ago(R[l].retrieved) + ')')");   // round 2's cell
  if (BREAK === 'loose-date') rep('app', "/^(\\d{4})-(\\d\\d)-(\\d\\d)$/.exec", "/^(\\d{4})-(\\d\\d)-(\\d\\d)/.exec");
  if (BREAK === 'ships-age-always') rep('app', "retrievedAge: sample && Number.isFinite(Date.parse(sample.retrieved_at)) ? ago(sample.retrieved_at) : null,", "retrievedAge: s ? ago(s.retrieved_at) : null,"); }

// ---- fixtures in the live hub's shapes
const cov = { grade: 'partial', evidence: 'e', observed_fraction: 1 };
const env0 = (layer, extra) => ({ schema_version: 1, collector_version: '0.6.14', layer, window_start: GOOD, window_end: NOW, retrieved_at: NOW, scheduled_for: NOW, source_status: 'ok', interruptions: [], stale_after_s: 10800, cells: {}, quantity: 'q', record_format: 'rows', ...extra });
const mk = (layer, fields, recs, extra, at) => { const cells = {}; const a = fields.indexOf('lat'), b = fields.indexOf('lng'); for (const r of recs) { const k = cellOf(r[a], r[b]); (cells[k] = cells[k] || { count: 0, coverage: cov }).count++; }
  return { snap: env0(layer, { record_fields: fields, records: recs, cells, ...extra, retrieved_at: at }), cells: env0(layer, { cells, ...extra, retrieved_at: at }) }; };
const usgs = () => mk('usgs', ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], [['q1', -33.9, 18.4, 10, 3.1, 'ml', GOOD, 'M 3.1 - off Cape Town', '']], { source_generated_at: NOW, source_age_s: 40, stale_after_s: 900 }, NOW);
const firms = () => mk('firms', ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'], [[-33.5, 18.9, GOOD, 'n', 5.8, 'N20', 'D']], { scope: 'world', raw_bytes: 5000, stale_after_s: 2400 }, NOW);
const ships = (at = NOW, extra = {}) => mk('ships', ['mmsi', 'name', 'lat', 'lng', 'sog_kn', 'class', 'observed_at', 'received_at'], [['601000001', 'TEST VESSEL', -33.8, 18.5, 9.1, 'A', GOOD, NOW]], { window_s: 60, class_a: 1, class_b: 0, socket_connected_s: 59, collected_by: 'mac', stale_after_s: 10800, window_end: at, ...extra }, at);
const shipsDown = () => ({ schema_version: 1, collector_version: '0.6.14', layer: 'ships', window_start: null, window_end: null, retrieved_at: iso(30e3), scheduled_for: iso(30e3), source_status: 'down', interruptions: [], stale_after_s: 10800, cells: {}, record_format: 'rows', record_fields: [], note: 'ingested down: Error: websocket error: ' });
const RET = () => iso(52 * 60e3);   // "retrieved 52 min ago", measured from when the fixture is built
const kp = (tag, extra = {}) => env0('swpc', { retrieved_at: RET(), stale_after_s: 7200, index: { name: 'planetary K-index', value: 2, time_tag: tag, interval_start: tag, age_reference: 'interval start (time_tag)' }, map_layer: false, status_reason: null, quantity: 'NOAA planetary Kp, 3-hourly index (not a map layer)', ...extra });
const co2 = (date, extra = {}) => env0('co2', { retrieved_at: RET(), stale_after_s: 7200, index: { name: 'CO2, Mauna Loa Observatory', value: 428.88, unit: 'ppm', date, preliminary: true }, status_reason: null, comparison: { basis: 'source-provided: NOAA GML weekly file, same week 1 year ago (365 days) and 10 years ago (3,653 days), week starting 2026-11-08', week_average: 428.64, days_in_week: 6, one_year_ago: 426.3, ten_years_ago: 402.95, increase_since_1800: 150.83 }, map_layer: false, ...extra });
const hemi = (value, date, avg) => ({ value, unit: '10^6 km^2', date, missing_area: 0, day_of_year: 317, climatology_1981_2010: { average: avg, std: .5, p10: avg - .8, p25: avg - .4, p50: avg, p75: avg + .4, p90: avg + .8 }, difference_from_average: +(value - avg).toFixed(3) });
const ice = (dN, dS, extra = {}) => env0('seaice', { retrieved_at: iso(1.9 * 3600e3), stale_after_s: 28800, index: { name: 'sea-ice extent, NSIDC Sea Ice Index v4', north: hemi(8.951, dN, 10.53), south: hemi(15.024, dS, 16.378) }, status_reason: null, comparison: { basis: 'source-provided baseline' }, map_layer: false, ...extra });
const KP_TAG = '2026-11-15T03:00:00Z';   // a same-day interval; the badge depends on our retrieval time, not on this
const longDate = d => { const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d); return `${+m[3]} ${M[+m[2] - 1]} ${m[1]}`; };
const kpIv = t => { const a = Date.parse(t); return `${new Date(a).toISOString().slice(11, 16)}–${new Date(a + 3 * 3600e3).toISOString().slice(11, 16)} UTC`; };
const base = () => ({ usgs: usgs(), firms: firms(), ships: ships(), swpc: { cells: kp(KP_TAG) }, co2: { cells: co2('2026-11-13') }, seaice: { cells: ice('2026-11-13', '2026-11-13') } });

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (L, opt = {}) => {
    const ctx = await browser.newContext({ viewport: opt.viewport || { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: CSS }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(BASE + '/index.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: served.index }));
    await ctx.route(BASE + '/app.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: served.app }));
    await ctx.route(BASE + '/sources.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: served.sources }));
    await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const j = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
      const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p); if (m && L[m[2]]) return j(m[1] === 'cells' ? L[m[2]].cells : (L[m[2]].snap || L[m[2]].cells));
      if (m) return j(env0(m[2], { index: null, record_fields: [], records: [], sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW } }));
      if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } }); route.fulfill({ status: 404, body: '{}' }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/' + (opt.page || 'index.html'), { waitUntil: 'domcontentloaded' });
    if (!opt.page) { await page.waitForFunction(() => window.ME && ME.pairState && ['usgs', 'firms', 'ships'].every(k => ME.pairState(k)[k].cells) && ['swpc', 'co2', 'seaice'].every(k => document.getElementById('s-' + k).textContent !== 'loading'), null, { timeout: 40000 }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(900); }
    return { ctx, page, perr };
  };
  const read = page => page.evaluate(() => { const g = id => document.getElementById(id); const c = k => { const e = g('s-' + k); return { word: e.textContent, cls: e.className, tip: e.title, obs: (g('o-' + k) || {}).textContent, src: (g('m-' + k) || {}).textContent }; };
    const R = ME.report(ME.readings()); return { swpc: c('swpc'), co2: c('co2'), seaice: c('seaice'), usgs: c('usgs'), firms: c('firms'), ships: c('ships'), states: R.states, report: R.text }; });
  const TIP = /^Our copy was retrieved (\d+(\.\d+)? (s|min|h|days?)) ago\. /;

  // ---- F1 + F2, all three adequate, same dates
  { const { ctx, page, perr } = await open(base()); const r = await read(page);
    for (const k of ['swpc', 'co2', 'seaice']) { ok(`F1 ${k}: badge "fresh copy", same colour class as an adequate badge`, r[k].word === 'fresh copy' && r[k].cls === 'state ok', r[k]); ok(`F1 ${k}: report state starts "fresh copy —"`, r.states[k].startsWith('fresh copy — retrieved '), r.states[k]);
      ok(`F2 ${k}: the card keeps its "retrieved N ago" line and its observation line`, / · retrieved \d/.test(r[k].src) && r[k].obs.length > 10, r[k]); }
    for (const k of ['usgs', 'firms', 'ships']) ok(`F1 ${k}: still "current"`, r[k].word === 'current' && r.states[k].startsWith('current — '), [r[k].word, r.states[k]]);
    ok('F2 CO₂ tooltip: both times, the date in words', r.co2.tip === 'Our copy was retrieved 52 min ago. This value is for 13 November 2026.', r.co2.tip);
    ok('F2 CO₂ card still shows the observation date', /daily mean for 2026-11-13/.test(r.co2.obs), r.co2.obs);
    ok('F2 Kp tooltip: names the UTC interval and its date', r.swpc.tip === 'Our copy was retrieved 52 min ago. This value is for the interval 03:00–06:00 UTC on 15 November 2026.', r.swpc.tip);
    ok('F2 Kp card still shows the interval and its age', new RegExp(`^interval ${kpIv(KP_TAG).replace(/[–]/g, '–')}, began \\d`).test(r.swpc.obs), r.swpc.obs);
    ok('F2 Sea ice tooltip, same date in both hemispheres: one date', r.seaice.tip === 'Our copy was retrieved 1.9 h ago. This value is for 13 November 2026.', r.seaice.tip);
    ok('F2 Sea ice card and report, same date: unchanged wording', r.seaice.obs === 'daily extent for 2026-11-13 (~1 day latency)' && /sea ice on 2026-11-13: Arctic 8\.95 M km², Antarctic 15\.02 M km²/.test(r.report), [r.seaice.obs, r.report.slice(r.report.indexOf('sea ice'), r.report.indexOf('sea ice') + 90)]);
    ok('F1/F2: no page error', !perr.length, perr); await ctx.close(); }

  // ---- F2: sea ice hemispheres on different dates
  { const L = base(); L.seaice = { cells: ice('2026-11-13', '2026-11-12') }; const { ctx, page } = await open(L); const r = await read(page);
    ok('F2 Sea ice, dates differ: tooltip names both', r.seaice.tip === 'Our copy was retrieved 1.9 h ago. The Arctic value is for 13 November 2026; the Antarctic value is for 12 November 2026.', r.seaice.tip);
    ok('F2 Sea ice, dates differ: the card names both', r.seaice.obs === 'daily extent: Arctic for 2026-11-13, Antarctic for 2026-11-12 (~1 day latency)', r.seaice.obs);
    ok('F2 Sea ice, dates differ: the report names both', /sea ice: Arctic 8\.95 M km² on 2026-11-13, Antarctic 15\.02 M km² on 2026-11-12 \(NSIDC;/.test(r.report), r.report.slice(r.report.indexOf('sea ice'), r.report.indexOf('sea ice') + 110));
    ok('F2 Sea ice, dates differ: badge still "fresh copy"', r.seaice.word === 'fresh copy', r.seaice.word); await ctx.close();
    const s = await open(L, { page: 'sources.html' }); await s.page.waitForFunction(() => /Antarctic for 2026-11-12/.test(document.body.innerText), null, { timeout: 20000 }).catch(() => { });
    const t = await s.page.evaluate(() => { const rows = [...document.querySelectorAll('#t-dates tr')].map(tr => tr.innerText.replace(/\s+/g, ' ')); return { ice: rows.find(x => /^Sea ice/.test(x)) || '', co2: rows.find(x => /^CO/.test(x)) || '', kp: rows.find(x => /^Kp/.test(x)) || '', quakes: rows.find(x => /^Earthquakes/.test(x)) || '', app: [...document.scripts].map(x => x.getAttribute('src')).find(x => x && x.startsWith('app.js')) }; });
    ok('Sources row, Sea ice with different dates: both dates and "fresh copy"', /Arctic for 2026-11-13, Antarctic for 2026-11-12/.test(t.ice) && /fresh copy — retrieved/.test(t.ice), t.ice);
    ok('Sources rows: CO₂ and Kp "fresh copy", Earthquakes "current"', /fresh copy — retrieved/.test(t.co2) && /fresh copy — retrieved/.test(t.kp) && /current — retrieved/.test(t.quakes), [t.co2, t.kp, t.quakes]);
    const ix = (served.index.match(/app\.js\?v=(\d+)/) || [])[1]; ok('app.js cache key is the same on both pages and newer than the Earthquakes and Ships release', t.app === 'app.js?v=' + ix && ix > '202612011000', { sources: t.app, index: ix });
    ok('Sources page: no page error', !s.perr.length, s.perr); await s.ctx.close(); }

  // ---- F1: degraded and unknown wording unchanged; unreadable dates say so
  { const L = base(); L.swpc = { cells: kp(KP_TAG, { source_status: 'degraded', status_reason: 'observation_age' }) }; L.co2 = { cells: co2('2026-11-13', { source_status: 'down', note: 'http 503' }) }; L.seaice = { cells: ice('2026-11-13', '2026-11-13', { retrieved_at: iso(9 * 3600e3) }) };
    const { ctx, page } = await open(L); const r = await read(page);
    ok('degraded Kp: "degraded", tooltip is the collector\'s own reason, not the two-time sentence', r.swpc.word === 'degraded' && !TIP.test(r.swpc.tip) && r.swpc.tip.length > 10 && r.states.swpc.startsWith('degraded — '), r.swpc);
    ok('down CO₂: "unknown — collector reported down: http 503", as before', r.co2.word === 'unknown' && r.co2.tip === 'collector reported down: http 503' && r.states.co2 === 'unknown — collector reported down: http 503', [r.co2, r.states.co2]);
    ok('stale Sea ice: "unknown", the stale reason, as before', r.seaice.word === 'unknown' && /^last snapshot is over 8 h old/.test(r.seaice.tip), r.seaice); await ctx.close(); }
  // ---- round 2: missing or impossible observation dates are "not supplied" on EVERY surface, never "undefined" or a made-up day
  const srcRows = async L => { const s = await open(L, { page: 'sources.html' }); await s.page.waitForFunction(() => document.querySelectorAll('#t-dates tr').length > 3, null, { timeout: 20000 }).catch(() => { });
    const t = await s.page.evaluate(() => { const rows = [...document.querySelectorAll('#t-dates tr')].map(tr => tr.innerText.replace(/\s+/g, ' ')); return { ice: rows.find(x => /^Sea ice/.test(x)) || '', co2: rows.find(x => /^CO/.test(x)) || '', kp: rows.find(x => /^Kp/.test(x)) || '', quakes: rows.find(x => /^Earthquakes/.test(x)) || '', n: rows.length, all: document.body.innerText }; }); const perr = s.perr; await s.ctx.close(); return { ...t, perr }; };
  const BAD = /undefined|NaN|Invalid|null/;
  for (const [tag, d] of [['a word', 'soon'], ['missing', undefined], ['31 February', '2026-02-31'], ['month 13', '2026-13-01'], ['a date with text after it', '2026-11-13-not-a-date']]) { const L = base(); L.co2 = { cells: co2(d) };
    const { ctx, page, perr } = await open(L); const r = await read(page); const rep = r.report.split('; ').find(x => /^CO₂/.test(x)) || '';
    ok(`CO₂ date ${tag}: tooltip says the date was not supplied`, r.co2.tip === 'Our copy was retrieved 52 min ago. The date of this value was not supplied.', r.co2.tip);
    ok(`CO₂ date ${tag}: the card says so too`, r.co2.obs === 'daily mean; the date was not supplied (preliminary), Mauna Loa, Hawaii', r.co2.obs);
    ok(`CO₂ date ${tag}: the report says so too`, /^CO₂ 428\.88 ppm at Mauna Loa \(date not supplied\) \(NOAA GML/.test(rep), rep.slice(0, 90));
    ok(`CO₂ date ${tag}: nothing prints "undefined", "NaN", "Invalid", "null" or "February"`, !BAD.test(r.co2.tip + r.co2.obs + rep) && !/February/.test(r.co2.tip + r.co2.obs + rep) && !perr.length, [r.co2.tip, r.co2.obs, rep.slice(0, 80), perr]); await ctx.close();
    const t = await srcRows(L); ok(`CO₂ date ${tag}: the Sources row says so too`, /daily mean; the date was not supplied/.test(t.co2) && !BAD.test(t.co2) && !t.perr.length, t.co2); }
  for (const [tag, dN, dS, exp] of [
    ['no Antarctic date', '2026-11-13', undefined, { tip: 'The Arctic value is for 13 November 2026; the Antarctic date was not supplied.', obs: 'daily extent: Arctic for 2026-11-13, Antarctic date not supplied (~1 day latency)', rep: /sea ice: Arctic 8\.95 M km² on 2026-11-13, Antarctic 15\.02 M km² \(date not supplied\) \(NSIDC;/ }],
    ['Antarctic date with text after it', '2026-11-13', '2026-11-13-not-a-date', { tip: 'The Arctic value is for 13 November 2026; the Antarctic date was not supplied.', obs: 'daily extent: Arctic for 2026-11-13, Antarctic date not supplied (~1 day latency)', rep: /sea ice: Arctic 8\.95 M km² on 2026-11-13, Antarctic 15\.02 M km² \(date not supplied\) \(NSIDC;/ }],
    ['impossible Antarctic date', '2026-11-13', '2026-02-31', { tip: 'The Arctic value is for 13 November 2026; the Antarctic date was not supplied.', obs: 'daily extent: Arctic for 2026-11-13, Antarctic date not supplied (~1 day latency)', rep: /sea ice: Arctic 8\.95 M km² on 2026-11-13, Antarctic 15\.02 M km² \(date not supplied\) \(NSIDC;/ }],
    ['no Arctic date', 'n/a', '2026-11-12', { tip: 'The Antarctic value is for 12 November 2026; the Arctic date was not supplied.', obs: 'daily extent: Arctic date not supplied, Antarctic for 2026-11-12 (~1 day latency)', rep: /sea ice: Arctic 8\.95 M km² \(date not supplied\), Antarctic 15\.02 M km² on 2026-11-12 \(NSIDC;/ }],
    ['neither date', undefined, undefined, { tip: 'The date of this value was not supplied.', obs: 'daily extent: Arctic date not supplied, Antarctic date not supplied (~1 day latency)', rep: /sea ice \(dates not supplied\): Arctic 8\.95 M km², Antarctic 15\.02 M km² \(NSIDC;/ }],
  ]) { const L = base(); L.seaice = { cells: ice(dN, dS) }; const { ctx, page, perr } = await open(L); const r = await read(page); const rep = r.report.slice(r.report.indexOf('sea ice'), r.report.indexOf('sea ice') + 120);
    ok(`Sea ice, ${tag}: tooltip`, r.seaice.tip === 'Our copy was retrieved 1.9 h ago. ' + exp.tip, r.seaice.tip);
    ok(`Sea ice, ${tag}: card`, r.seaice.obs === exp.obs, r.seaice.obs);
    ok(`Sea ice, ${tag}: report`, exp.rep.test(r.report), rep);
    ok(`Sea ice, ${tag}: nothing prints "undefined", "NaN", "Invalid" or "February"; no page error`, !BAD.test(r.seaice.tip + r.seaice.obs + rep) && !/February/.test(r.seaice.tip + r.seaice.obs + rep) && !perr.length, [r.seaice.tip, r.seaice.obs, rep, perr]); await ctx.close();
    const t = await srcRows(L); ok(`Sea ice, ${tag}: the Sources row carries the card's wording`, t.ice.includes(exp.obs) && !BAD.test(t.ice) && !t.perr.length, t.ice); }
  { const L = base(); L.swpc = { cells: kp('not a time') }; const { ctx, page, perr } = await open(L); const r = await read(page);
    ok('Kp with an unreadable time: tooltip says the interval could not be read; the card keeps its own plain sentence', r.swpc.tip === 'Our copy was retrieved 52 min ago. The interval of this value could not be read.' && /interval time unknown/.test(r.swpc.obs) && !BAD.test(r.swpc.tip + r.swpc.obs) && !perr.length, [r.swpc.tip, r.swpc.obs, perr]); await ctx.close(); }
  { const L = base(); L.swpc = { cells: kp('2026-11-14T21:00:00Z') }; const { ctx, page } = await open(L); const r = await read(page);
    ok('Kp interval that crosses midnight: both days named', r.swpc.tip === 'Our copy was retrieved 52 min ago. This value is for 21:00 UTC on 14 November to 00:00 UTC on 15 November 2026.', r.swpc.tip);
    const pure = await page.evaluate(() => ({ ny: ME.kpIntervalLong('2026-12-31T21:00:00Z'), same: ME.kpIntervalLong('2026-11-15T18:00:00Z'), bad: ME.kpIntervalLong('x'),
      dates: ['2026-11-13', '2024-02-29', '2026-02-29', '2026-02-31', '2026-04-31', '2026-13-01', '2026-00-10', '2026-11-00', 'soon', '', null, undefined, 20261113, '2026-11-13-not-a-date', '2026-11-13T00:00:00Z', ' 2026-11-13', {}].map(d => ME.validDate(d)), long: ME.longDate('2026-11-03'),
      stamps: ['2026-11-15T08:08:00.996Z', 'n/a', {}, null, undefined, 12345, ''].map(v => ME.stamp(v)) }));
    ok('Kp interval across a year end names both years', pure.ny === '21:00 UTC on 31 December 2026 to 00:00 UTC on 1 January 2027' && pure.same === 'the interval 18:00–21:00 UTC on 15 November 2026' && pure.bad === null, pure);
    ok('ME.validDate accepts only real calendar days written exactly YYYY-MM-DD', JSON.stringify(pure.dates) === JSON.stringify(['2026-11-13', '2024-02-29', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]) && pure.long === '3 November 2026', pure);
    ok('ME.stamp gives text only for a readable timestamp', JSON.stringify(pure.stamps) === JSON.stringify(['2026-11-15 08:08:00 UTC', null, null, null, null, null, null]), pure.stamps); await ctx.close(); }

  // ---- round 2: an unreadable retrieval time is never "fresh copy" and never "NaN"
  for (const k of ['co2', 'swpc', 'seaice']) { const L = base(); L[k] = { cells: { ...L[k].cells, retrieved_at: 'n/a' } }; const { ctx, page, perr } = await open(L); const r = await read(page);
    ok(`${k} with an unreadable retrieval time: badge "unknown", plain reason, no value claimed as fresh`, r[k].word === 'unknown' && r[k].cls === 'state bad' && r[k].tip === 'the time our copy was retrieved could not be read' && r.states[k] === 'unknown — the time our copy was retrieved could not be read', [r[k], r.states[k]]);
    ok(`${k} with an unreadable retrieval time: the card line reads "retrieved at an unreadable time" and gives the reason`, / · retrieved at an unreadable time · the time our copy was retrieved could not be read$/.test(r[k].src), r[k].src);
    ok(`${k} with an unreadable retrieval time: no "NaN" or "undefined" on the card, in the report or its states; no page error`, !/NaN|undefined/.test(r[k].tip + r[k].src + r[k].obs + r.report + JSON.stringify(r.states)) && !perr.length, [r[k].src, perr]); await ctx.close(); }

  // ---- round 3: the Sources table with an unreadable retrieval value — 'n/a' and {} — still builds, and prints no raw value
  { const good = await srcRows(base());
    ok('Sources baseline: the dates table has a row per layer and a real retrieval time for CO₂', good.n >= 7 && /\d{4}-\d\d-\d\d \d\d:\d\d:\d\d UTC \(52 min ago\)/.test(good.co2) && !good.perr.length, [good.n, good.co2, good.perr]);
    for (const [tag, bad] of [['"n/a"', 'n/a'], ['{}', {}], ['a number', 1731657600]]) for (const k of ['co2', 'seaice', 'swpc']) { const L = base(); L[k] = { cells: { ...L[k].cells, retrieved_at: bad } };
      const t = await srcRows(L), rowk = k === 'co2' ? t.co2 : k === 'seaice' ? t.ice : t.kp;
      ok(`Sources, ${k} retrieved_at ${tag}: the table still builds in full, no page error`, t.n === good.n && !t.perr.length && t.quakes === good.quakes.replace(/\(\d+ (s|min) ago\)/, m => m) || (t.n === good.n && !t.perr.length), [t.n, good.n, t.perr]);
      ok(`Sources, ${k} retrieved_at ${tag}: the cell reads "Retrieval time unknown", not the raw value`, /Retrieval time unknown/.test(rowk) && !/n\/a UTC|\[object|NaN|undefined|1731657600/.test(rowk) && /unknown — the time our copy was retrieved could not be read/.test(rowk), rowk);
      ok(`Sources, ${k} retrieved_at ${tag}: every other row keeps its real retrieval time`, (k === 'co2' ? t.ice : t.co2).match(/\d\d:\d\d:\d\d UTC \(/) && /\d\d:\d\d:\d\d UTC \(/.test(t.quakes), [t.co2, t.ice, t.quakes]); }
    // the World View page with the same payloads: no page error, the card says unknown
    for (const [tag, bad] of [['"n/a"', 'n/a'], ['{}', {}]]) { const L = base(); L.co2 = { cells: { ...L.co2.cells, retrieved_at: bad } }; const { ctx, page, perr } = await open(L); const r = await read(page);
      ok(`World View, CO₂ retrieved_at ${tag}: badge unknown, plain reason, no page error, no raw value`, r.co2.word === 'unknown' && r.co2.tip === 'the time our copy was retrieved could not be read' && !perr.length && !/\[object|NaN|n\/a/.test(r.co2.src + r.co2.tip), [r.co2, perr]); await ctx.close(); } }

  // ---- F3: ships retrieval time
  for (const [tag, sh, exp] of [
    ['adequate sample', () => ships(iso(32 * 60e3)), { age: /^aisstream\.io · retrieved 32 min ago · /, end: true }],
    ['stale real sample', () => ships(iso(4 * 3600e3)), { age: /^aisstream\.io · retrieved 4\.0 h ago · /, end: true, unknown: true, once: '4.0 h ago' }],
    ['down run', () => ({ cells: shipsDown(), snap: ships(GOOD).snap }), { age: null, end: false, unknown: true }],
    ['sample with an unreadable retrieval time', () => (s => ({ cells: { ...s.cells, retrieved_at: 'n/a' }, snap: { ...s.snap, retrieved_at: 'n/a' } }))(ships(iso(60e3))), { age: null, unknown: true, reason: 'the time our copy was retrieved could not be read' }],
  ]) { const L = base(); L.ships = sh(); const { ctx, page, perr } = await open(L).catch(e => ({ err: e })); if (!page) { ok(`F3 ${tag}: page opened`, false, String(perr)); continue; }
    const r = await read(page);
    ok(`F3 ${tag}: source line ${exp.age ? 'gives "retrieved N ago"' : 'gives no retrieval age'}`, exp.age ? exp.age.test(r.ships.src) : !/· retrieved /.test(r.ships.src), r.ships.src);   // "· retrieved <age>" is the label; the plain reason may contain the word
    ok(`F3 ${tag}: never says "received"`, !/received \d/.test(r.ships.src), r.ships.src);
    if (exp.end !== undefined) ok(`F3 ${tag}: sample end ${exp.end ? 'still visible' : 'not claimed'}`, /^sample ended \d\d:\d\d UTC/.test(r.ships.obs) === exp.end, r.ships.obs);
    if (exp.unknown) ok(`F3 ${tag}: the existing "current positions unknown —" reason is kept`, /current positions unknown — /.test(r.ships.src), r.ships.src);
    if (exp.once) ok(`F3 ${tag}: the age appears once on the line, with the retrieval label; the reason keeps "last sample is over 3 h old"`, r.ships.src.split(exp.once).length === 2 && /last sample is over 3 h old; current positions unknown/.test(r.ships.src), r.ships.src);
    if (exp.reason) ok(`F3 ${tag}: badge unknown with the plain reason; no "NaN"`, r.ships.word === 'unknown' && r.ships.src.includes(exp.reason) && !/NaN/.test(r.ships.src + r.ships.tip + r.report), [r.ships.word, r.ships.src]);
    ok(`F3 ${tag}: no page error`, !perr.length, perr); await ctx.close(); }

  // ---- layout: the longer badge neither wraps nor meets the card title
  for (const [w, h] of [[1280, 860], [1101, 800], [721, 900], [390, 844]]) { const { ctx, page } = await open(base(), { viewport: { width: w, height: h } });
    const m = await page.evaluate(() => ['swpc', 'co2', 'seaice'].map(k => { const b = document.getElementById('s-' + k), n = b.parentElement.querySelector('.name'), br = b.getBoundingClientRect(), nr = n.getBoundingClientRect(), cr = b.closest('.card').getBoundingClientRect(); const lh = parseFloat(getComputedStyle(b).lineHeight) || parseFloat(getComputedStyle(b).fontSize) * 1.4;
      return { k, text: b.textContent, shown: br.width > 0, oneLine: br.height <= lh * 1.6, gap: Math.round(br.left - nr.right), inside: br.right <= cr.right + .5 && br.left >= cr.left - .5, titleOneLine: nr.height <= (parseFloat(getComputedStyle(n).lineHeight) || 30) * 1.6 }; }));
    for (const x of m) ok(`layout ${w} px, ${x.k}: "fresh copy" on one line, clear of the title, inside the card`, x.text === 'fresh copy' && (!x.shown || (x.oneLine && x.gap >= 4 && x.inside && x.titleOneLine)), x);
    await ctx.close(); }

  await browser.close(); clearTimeout(wd);
  console.log(`freshness-wording-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('ERR', e); process.exit(1); });
