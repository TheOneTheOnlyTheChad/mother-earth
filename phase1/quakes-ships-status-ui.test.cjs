/* Earthquakes and Ships cards: the withheld line and the down-run sample (15 Nov 2026, branch quakes-ships-status-rc;
 * docs/concepts/WITHHELD-LINE-QUAKES-SHIPS-PROPOSAL.md rev 2, §6 governing).
 *   W1/W2  "Records withheld … counts shown alone" shows only beside the displayed reading's value (value !== null). A valid zero
 *          and a displayed degraded count are counts and keep the line; a dash, and ships' "Last sample: N", are not.
 *   W3     a down ships run carries no sample: the card shows "–", no "Last sample" label, no sample description, and the report
 *          makes no sample claim. A stale real sample keeps "Last sample: N", a genuine zero included.
 * Real page; the hub's answers are fixtures shaped as the hub publishes them (writeDown: status down, cells {}, note).
 * Run: 8899 static server on the repo root, then
 *      NODE_PATH=/home/claude/spike/node_modules node --no-warnings phase1/quakes-ships-status-ui.test.cjs
 * BREAK=no-gate | down-as-sample | keep-description   each must fail. */
const { chromium } = require('playwright');
const coreOn = h => { if (!h.includes("const START_ON = [];")) throw new Error('index.html: START_ON = [] not found'); return h.replace("const START_ON = [];", "const START_ON = ['usgs', 'firms', 'ships', 'forest'];"); };   // this suite was written for the page with the four core layers on at load; the bare default is tested in bare-earth-ui.test.cjs
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 900)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 12 min'); process.exit(1); }, 12 * 60e3);
const ALONE = 'counts shown alone';
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const n0 = Date.now(), iso = ms => new Date(n0 - ms).toISOString(), GOOD = iso(3 * 3600e3), NOW = iso(60e3), NEWER = iso(20e3);

// ---- the hub's down envelope, tied to worker.js
const WSRC = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');
ok('worker.js: writeDown publishes an envelope with no cells, no window and no records', /const e = envelope\(layer, scheduledMs, null, null, 'down', \{\}, \[\], \[\], \{ note \}\);/.test(WSRC));
ok('worker.js: a ships sample ingested as down goes through writeDown', /await writeDown\(env, layer, scheduledMs, 'ingested down: ' \+ \((?:layer === AIRCRAFT_LAYER \? e\.note : \()?e\.note \|\| ''\)\)?, 0\);/.test(WSRC));   // hub 0.6.18 words the aircraft note itself; ships is unchanged

const served = { index: coreOn(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')), app: fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') };
{ const rep = (k, a, b) => { const before = served[k]; served[k] = served[k].replace(a, b); if (served[k] === before) { console.log('FAIL  break did not apply'); process.exit(1); } };
  if (BREAK === 'no-gate') rep('index', "const noCount = layer in cardCount && cardCount[layer] === null;", "const noCount = layer === 'firms' && cardCount.firms === null;");   // main's behaviour for earthquakes and ships
  if (BREAK === 'down-as-sample') rep('app', "sample = s && !sDown ? s : null;", "sample = s;");                                                                        // main's behaviour: the empty down envelope totalled as a sample
  if (BREAK === 'keep-description') rep('index', "(R.ships.down ? 'no sample from the latest run' : 'no sample yet')", "'sample ended –; undefined Class A'"); }
const FAST_APP = served.app.replace('5 * 60e3', '4e3');

const cov = { grade: 'partial', evidence: 'e', observed_fraction: 1 };
const env0 = (layer, extra) => ({ layer, schema_version: 1, collector_version: '0.6.14', retrieved_at: NOW, source_status: 'ok', stale_after_s: 10800, window_start: GOOD, window_end: NOW, quantity: 'q', record_format: 'rows', ...extra });
const mk = (layer, fields, recs, extra, at) => { const cells = {}; const a = fields.indexOf('lat'), b = fields.indexOf('lng'); for (const r of recs) { const k = cellOf(r[a], r[b]); (cells[k] = cells[k] || { count: 0, coverage: cov }).count++; }
  return { snap: env0(layer, { record_fields: fields, records: recs, cells, ...extra, retrieved_at: at }), cells: env0(layer, { cells, ...extra, retrieved_at: at }) }; };
const UF = ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], SF = ['mmsi', 'name', 'lat', 'lng', 'sog_kn', 'class', 'observed_at', 'received_at'];
const U = (at, recs = [['q1', -33.9, 18.4, 10, 3.1, 'ml', GOOD, 'M 3.1 - off Cape Town', '']]) => mk('usgs', UF, recs, { source_generated_at: NOW, source_age_s: 40, stale_after_s: 900 }, at);
const S = (at, recs = [['601000001', 'TEST VESSEL', -33.8, 18.5, 9.1, 'A', GOOD, NOW], ['601000002', 'TEST TWO', -33.7, 18.4, 3, 'B', GOOD, NOW]], extra = {}) => mk('ships', SF, recs, { window_s: 60, class_a: recs.filter(r => r[5] === 'A').length, class_b: recs.filter(r => r[5] === 'B').length, socket_connected_s: 60, collected_by: 'mac', stale_after_s: 10800, window_end: at, ...extra }, at);
const down = (layer, note) => ({ schema_version: 1, collector_version: '0.6.14', layer, window_start: null, window_end: null, retrieved_at: iso(30e3), scheduled_for: iso(30e3), source_status: 'down', interruptions: [], stale_after_s: layer === 'ships' ? 10800 : 900, cells: {}, record_format: 'rows', record_fields: [], note });   // writeDown's envelope, records removed

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (L, opt = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(BASE + '/index.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: served.index }));
    await ctx.route(BASE + '/app.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: opt.fast ? FAST_APP : served.app }));
    await ctx.route(HUB + '/**', async route => { const p = new URL(route.request().url()).pathname; const j = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
      const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p); if (m && L[m[2]]) return j(m[1] === 'cells' ? L[m[2]].cells : L[m[2]].snap);
      if (m) return j(env0(m[2], { cells: {}, index: null, record_fields: [], records: [], sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW } }));
      if (p === '/') return j({ name: 'x', history: { collecting: false, retained: { exists: false } } }); route.fulfill({ status: 404, body: '{}' }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/' + (opt.page || 'index.html'), { waitUntil: 'domcontentloaded' });
    if (!opt.page) { await page.waitForFunction(() => window.ME && ME.pairState && ['usgs', 'ships'].every(k => ME.pairState(k)[k].cells), null, { timeout: 40000 }); await page.waitForTimeout(900); }
    return { ctx, page, perr };
  };
  const read = page => page.evaluate(() => { const g = id => document.getElementById(id); const c = k => ({ state: g('s-' + k).textContent, label: k === 'ships' ? g('l-ships').textContent : '', count: g('v-' + k).textContent, lineShown: !g('p-' + k).hidden, line: g('p-' + k).textContent, obs: g('o-' + k).textContent, src: g('m-' + k).textContent, unit: k === 'ships' ? g('u-ships').textContent : '' });
    const R = ME.report(ME.readings()); const part = w => R.text.split('; ').find(s => s.includes(w)) || '';
    return { usgs: c('usgs'), ships: c('ships'), firms: { lineShown: !g('p-firms').hidden }, report: { usgs: part('earthquake'), ships: part('vessel') || part('ships:') }, visible: document.body.innerText, pair: ME.pairState() }; });

  const CASES = [
    // ---- earthquakes (W1)
    ['Q1 earthquakes down, last good records', { usgs: { cells: down('usgs', 'fetch failed: TypeError: fetch failed'), snap: U(GOOD).snap }, ships: S(NOW) }, 'usgs', { state: 'unknown', count: '–', line: false }],
    ['Q2 earthquakes stale, mismatched records', { usgs: { cells: U(iso(2 * 3600e3)).cells, snap: U(GOOD).snap }, ships: S(NOW) }, 'usgs', { state: 'unknown', count: '–', line: false }],
    ['Q3 earthquakes mismatch, valid count', { usgs: { cells: U(NEWER).cells, snap: U(GOOD).snap }, ships: S(NOW) }, 'usgs', { state: 'current', count: '1', line: 'records are from a different collector run' }],
    ['Q4 earthquakes valid zero, mismatched records', { usgs: { cells: U(NEWER, []).cells, snap: U(GOOD).snap }, ships: S(NOW) }, 'usgs', { state: 'current', count: '0', line: 'records are from a different collector run' }],
    ['Q5 earthquakes matched', { usgs: U(NOW), ships: S(NOW) }, 'usgs', { state: 'current', count: '1', line: false }],
    // ---- ships (W2, W3)
    ['S1 ships down, last good records', { usgs: U(NOW), ships: { cells: down('ships', 'ingested down: Error: websocket error: '), snap: S(GOOD).snap } }, 'ships', { state: 'unknown', count: '–', label: '', line: false, down: true }],
    ['S2 ships stale, mismatched records', { usgs: U(NOW), ships: { cells: S(iso(4 * 3600e3)).cells, snap: S(iso(5 * 3600e3)).snap } }, 'ships', { state: 'unknown', count: '2', label: 'Last sample:', line: false }],
    ['S3 ships stale, matched records', { usgs: U(NOW), ships: S(iso(4 * 3600e3)) }, 'ships', { state: 'unknown', count: '2', label: 'Last sample:', line: false }],
    ['S4 ships mismatch, valid count', { usgs: U(NOW), ships: { cells: S(NEWER).cells, snap: S(GOOD).snap } }, 'ships', { state: 'current', count: '2', label: '', line: 'records are from a different collector run' }],
    ['S5 ships degraded count displayed, mismatched records', { usgs: U(NOW), ships: { cells: { ...S(NEWER).cells, source_status: 'degraded', status_reason: 'short_socket' }, snap: S(GOOD).snap } }, 'ships', { state: 'degraded', count: '2', label: '', line: 'records are from a different collector run' }],
    ['S6 ships genuine zero-vessel sample, usable', { usgs: U(NOW), ships: S(NOW, []) }, 'ships', { state: 'current', count: '0', label: '', line: false, zero: true }],
    ['S7 ships genuine zero-vessel sample, stale', { usgs: U(NOW), ships: S(iso(4 * 3600e3), []) }, 'ships', { state: 'unknown', count: '0', label: 'Last sample:', line: false, zero: true }],
    ['S8 ships matched', { usgs: U(NOW), ships: S(NOW) }, 'ships', { state: 'current', count: '2', label: '', line: false }],
  ];
  for (const [tag, L, k, e] of CASES) {
    const { ctx, page, perr } = await open(L); const r = await read(page), c = r[k];
    ok(`${tag}: badge "${e.state}"`, c.state === e.state, c);
    ok(`${tag}: count "${e.count}"${e.label !== undefined ? ', label "' + e.label + '"' : ''}`, c.count === e.count && (e.label === undefined || c.label === e.label), c);
    ok(`${tag}: withheld line ${e.line ? 'shown' : 'hidden'}`, c.lineShown === !!e.line, c);
    if (e.line) { ok(`${tag}: the line says why and "${ALONE}", beside a displayed number`, c.line.includes(e.line) && c.line.includes(ALONE) && /^[\d,]+$/.test(c.count) && c.label === '', c); }
    else { ok(`${tag}: the hidden line holds no text and "${ALONE}" is nowhere on the visible page`, c.line === '' && !r.visible.includes(ALONE), c.line); }
    ok(`${tag}: nothing prints "undefined" or "NaN" on the card or in the report`, !/undefined|NaN/.test(c.obs + c.src + c.unit + r.report.usgs + r.report.ships), [c.obs, c.unit, r.report]);
    if (e.down) {
      ok(`${tag}: no sample claim on the card — no "Last sample", no "sample ended", no class counts, no zero`, !/Last sample|sample ended|Class A|socket connected/.test(c.label + c.obs) && c.obs === 'no sample from the latest run' && c.count !== '0', c);
      ok(`${tag}: the card still gives the down reason`, /current positions unknown — collector reported down: ingested down/.test(c.src), c.src);
      ok(`${tag}: the report says ships are unknown and makes no sample claim`, /^ships: unknown — collector reported down: ingested down/.test(r.report.ships) && !/last sample|vessels ending/.test(r.report.ships), r.report.ships);
      ok(`${tag}: unit line still reads as a 60 s sample`, c.unit === 'vessel identities in a 60 s AIS sample', c.unit); }
    if (e.label === 'Last sample:') { ok(`${tag}: the stale sample is described as a sample (its end time and class counts)`, /^sample ended \d\d:\d\d UTC; \d+ Class A \+ \d+ Class B/.test(c.obs), c.obs);
      ok(`${tag}: the report carries the last sample with its count`, new RegExp(`last sample ${e.count} vessels ending \\d\\d:\\d\\d UTC, current positions unknown`).test(r.report.ships), r.report.ships); }
    if (e.zero && e.state === 'current') ok(`${tag}: a usable zero-vessel sample reads 0 in the report too`, /^0 vessel identities received/.test(r.report.ships), r.report.ships);
    ok(`${tag}: the other card's line is untouched (hidden, matched)`, k === 'usgs' ? !r.ships.lineShown : !r.usgs.lineShown, [r.usgs.lineShown, r.ships.lineShown]);
    ok(`${tag}: records drawn only when paired with the counts`, r.pair[k].usable === (!e.line && e.state !== 'unknown' ? true : r.pair[k].usable) && (e.line ? r.pair[k].usable === false : true), r.pair[k]);
    ok(`${tag}: no page error`, !perr.length, perr); await ctx.close();
  }

  // ---- transition in one session: ships current → down → current
  { const L = { usgs: U(NOW), ships: S(NOW) }; const { ctx, page, perr } = await open(L, { fast: true }); let r = await read(page);
    ok('T ships start: current, 2', r.ships.state === 'current' && r.ships.count === '2', r.ships);
    L.ships = { cells: down('ships', 'ingested down: Error: websocket error: '), snap: S(NOW).snap };
    await page.waitForFunction(() => document.getElementById('v-ships').textContent === '–', null, { timeout: 20000 }).catch(() => { }); r = await read(page);
    ok('T ships down on the next refresh: dash, no label, no line, no sample description', r.ships.count === '–' && r.ships.label === '' && !r.ships.lineShown && r.ships.line === '' && r.ships.obs === 'no sample from the latest run' && !r.visible.includes(ALONE), r.ships);
    L.ships = S(iso(-5e3));
    await page.waitForFunction(() => document.getElementById('v-ships').textContent === '2' && document.getElementById('l-ships').textContent === '', null, { timeout: 20000 }).catch(() => { }); r = await read(page);
    ok('T ships back: current, 2, sample described again', r.ships.state === 'current' && r.ships.count === '2' && /^sample ended/.test(r.ships.obs), r.ships);
    ok('T: no page error', !perr.length, perr); await ctx.close(); }

  // ---- Sources page with ships down; cache key
  { const { ctx, page, perr } = await open({ usgs: U(NOW), ships: { cells: down('ships', 'ingested down: Error: websocket error: '), snap: S(GOOD).snap } }, { page: 'sources.html' });
    await page.waitForFunction(() => /ingested down/.test(document.body.innerText), null, { timeout: 20000 }).catch(() => { });
    const t = await page.evaluate(() => ({ text: document.body.innerText, app: [...document.scripts].map(s => s.getAttribute('src')).find(s => s && s.startsWith('app.js')) }));
    ok('Sources page, ships down: says so, prints no "undefined", "NaN" or "last sample 0"', /ingested down/.test(t.text) && !/undefined|NaN|last sample 0/i.test(t.text), t.text.split('\n').filter(l => /ship|vessel/i.test(l)).slice(0, 5));
    ok('Sources page: no page error', !perr.length, perr);
    const ix = (served.index.match(/app\.js\?v=(\d+)/) || [])[1]; ok('app.js cache key is the same on both pages and newer than the fire-status release', t.app === 'app.js?v=' + ix && ix > '202611301000', { sources: t.app, index: ix });
    await ctx.close(); }

  await browser.close(); clearTimeout(wd);
  console.log(`quakes-ships-status-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('ERR', e); process.exit(1); });
