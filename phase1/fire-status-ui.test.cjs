/* Fire status on every surface (15 Nov 2026, branch fire-status-rc; brief docs/concepts/CONTROL-CENTRE-USABILITY-BRIEF.md rev 1.1).
 * One table of hub states for fires, read on the card, its tooltip, the "Records withheld" line, Find, the search notes, the
 * summary report and the place row. What it holds:
 *   A1  "counts shown alone" appears only while the card shows a count (gated on the value the card rendered)
 *   A2  the place row reads a down fires run as unknown, from the section's own source_status and note
 *   A3  one reason on every surface: the daily reset sentence, or "collector reported down: <note>" for a real failure
 *   A4  Find with zero records says there are no detections
 *   A5  the states stay distinct
 * PART 1  legacy `rows` fixtures; /place answered by the real worker.js over a small store.
 * PART 2  the production `lines/1` format: files written by the hub's own v2 pipeline (worker.scheduled with a stubbed FIRMS
 *         source, SQLite D1, in-memory R2, clock set for the hub only); every page request answered by the real worker.js.
 * PART 3  a transition in one page session (count on screen, then the feed goes down) and the Sources page.
 * Run: 8899 static server on the repo root, then
 *      NODE_PATH=/home/claude/spike/node_modules node --no-warnings phase1/fire-status-ui.test.cjs
 * BREAK=no-gate | no-place-rule | no-shared-reason | no-zero-note | no-clear weakens the served page; each must fail. */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const { pathToFileURL } = require('url'); const { DatabaseSync } = require('node:sqlite');
const ROOT = path.join(__dirname, '..');
const BASE = 'http://127.0.0.1:8899', HUB = 'https://mother-earth.chadoberholzer.workers.dev';
const GLOBE_JS = fs.readFileSync('/home/claude/spike/node_modules/globe.gl/dist/globe.gl.min.js', 'utf8');
const BREAK = process.env.BREAK || '';
let pass = 0, fail = 0; const ok = (n, c, got) => { if (c) pass++; else { fail++; console.log(`FAIL  ${n}${got !== undefined ? `\n      got: ${JSON.stringify(got).slice(0, 900)}` : ''}`); } };
const wd = setTimeout(() => { console.log('FAIL  suite exceeded 14 min'); process.exit(1); }, 14 * 60e3);
const COPY = 'Today’s detections aren’t available yet', ALONE = 'counts shown alone', DOWN = 'collector reported down';
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const LAT = -33.80, LNG = 18.60, CELL = cellOf(LAT, LNG);
const RealDate = Date; const realNow = () => RealDate.now();
const iso = ms => new RealDate(ms).toISOString();

// ---- the hub's own notes, read from worker.js (so the page's pattern is tied to what the hub publishes)
const WSRC = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');
const mNote = WSRC.match(/const why = utcHour < FIRMS_DAY_BOUNDARY_H \? `([^`]+)` : `([^`]+)`;/);
ok('worker.js: the legacy header-only notes are where this test expects them', !!mNote);
const NOTE_BOUNDARY = (mNote ? mNote[1] : '').replace('${res.text.length}', '122');
const NOTE_FETCH = 'TypeError: fetch failed';
ok('worker.js: both down writers publish cells: {} (the reason the hub\'s own place down branch is skipped)', /envelope\(layer, scheduledMs, null, null, 'down', \{\}, \[\], \[\], \{ note \}\)/.test(WSRC) && /source_status: 'down', interruptions: \[\], stale_after_s: STALE_AFTER_S\.firms, cells: \{\}, note, run_id: runId/.test(WSRC));

// ---- page under test (optionally weakened)
const served = { index: fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), app: fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') };
{ const rep = (k, a, b) => { const before = served[k]; served[k] = served[k].replace(a, b); if (served[k] === before) { console.log('FAIL  break did not apply'); process.exit(1); } };
  if (BREAK === 'no-gate') rep('index', " && !noCount;", ";");                                                       // main's behaviour: the line shows with no count
  if (BREAK === 'no-place-rule') rep('app', "if (l === 'firms' && s.source_status === 'down')", "if (false)");          // main's behaviour: place says withheld
  if (BREAK === 'no-shared-reason') rep('app', "layer === 'firms' && ME.firmsNotYet(s) ? ME.FIRMS_NOT_YET_COPY : ", ''); // the daily state says "collector reported down" off the card
  if (BREAK === 'no-zero-note') rep('index', "if (layer === 'firms' && !points.firms.length) return say(", "if (false) return say(");
  if (BREAK === 'no-clear') rep('index', " else e.textContent = '';", ''); }
const FAST_APP = served.app.replace('5 * 60e3', '4e3');   // PART 3 only: the page polls every 4 s instead of 5 min (timing, nothing else)
ok('fast-poll variant applies', FAST_APP !== served.app);

// ---- hub stand-ins
function makeD1() {
  const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys = ON;'); db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  const exec = (sql, args) => { if (/^\s*SELECT/i.test(sql)) return { results: db.prepare(sql).all(...args), meta: { changes: 0 } }; const r = db.prepare(sql).run(...args); return { results: [], meta: { changes: Number(r.changes) } }; };
  const prep = sql => { const mk = args => ({ sql, args, async run() { return exec(sql, args); }, async all() { return exec(sql, args); }, async first() { return exec(sql, args).results[0] ?? null; } }); return { bind: (...a) => mk(a.map(v => v === undefined ? null : v)), ...mk([]) }; };
  return { prepare: prep, async batch(st) { db.exec('BEGIN'); try { const out = st.map(s => exec(s.sql, s.args)); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } } };
}
function makeR2() {   // R2's documented semantics as far as the hub uses them: conditional put, head/get/list metadata, range reads, multipart
  const m = new Map(), enc = new TextEncoder(), dec = new TextDecoder(); let seq = 0;
  const bytesOf = async v => v == null ? new Uint8Array(0) : typeof v === 'string' ? enc.encode(v) : v instanceof Uint8Array ? new Uint8Array(v) : v instanceof ArrayBuffer ? new Uint8Array(v.slice(0)) : new Uint8Array(await new Response(v).arrayBuffer());
  const obj = (k, v, body) => ({ key: k, size: v.bytes.length, etag: v.etag, httpEtag: '"' + v.etag + '"', uploaded: new RealDate(v.uploaded), customMetadata: { ...(v.customMetadata || {}) }, httpMetadata: v.httpMetadata || {}, writeHttpMetadata() { }, ...(body || {}) });
  const R2 = {
    async put(k, value, o = {}) { const cur = m.get(k), c = o.onlyIf; if (c && c.etagDoesNotMatch === '*' && cur) return null; if (c && c.etagMatches && (!cur || cur.etag !== c.etagMatches)) return null;
      const v = { bytes: await bytesOf(value), etag: 'e' + (++seq), uploaded: Date.now(), customMetadata: o.customMetadata, httpMetadata: o.httpMetadata }; m.set(k, v); return obj(k, v); },
    async head(k) { const v = m.get(k); return v ? obj(k, v) : null; },
    async get(k, o = {}) { const v = m.get(k); if (!v) return null; let b = v.bytes; if (o.range) b = b.subarray(o.range.offset || 0, (o.range.offset || 0) + (o.range.length ?? b.length));
      return obj(k, v, { body: new Blob([b]).stream(), async text() { return dec.decode(b); }, async json() { return JSON.parse(dec.decode(b)); }, async arrayBuffer() { return b.slice().buffer; } }); },
    async delete(k) { m.delete(k); },
    async list({ prefix, include } = {}) { return { objects: [...m.keys()].filter(k => !prefix || k.startsWith(prefix)).sort().map(k => { const v = m.get(k); return { key: k, size: v.bytes.length, uploaded: new RealDate(v.uploaded), ...(include && include.includes('customMetadata') ? { customMetadata: { ...(v.customMetadata || {}) } } : {}) }; }), truncated: false }; },
    async createMultipartUpload(k, o = {}) { const parts = new Map();
      return { key: k, async uploadPart(n, data) { parts.set(n, await bytesOf(data)); return { partNumber: n, etag: 'p' + n }; },
        async complete(list) { const ps = list.map(p => parts.get(p.partNumber)); const all = new Uint8Array(ps.reduce((a, b) => a + b.length, 0)); let off = 0; for (const b of ps) { all.set(b, off); off += b.length; }
          const v = { bytes: all, etag: 'e' + (++seq), uploaded: Date.now(), customMetadata: o.customMetadata, httpMetadata: o.httpMetadata }; m.set(k, v); return obj(k, v); }, async abort() { } }; },
  };
  return { R2, m, text: k => m.has(k) ? dec.decode(m.get(k).bytes) : null };
}
// the hub's clock, set only while the hub's own code runs (the browser and Playwright keep the real clock)
let CLOCK = 0; class HubDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(CLOCK); } static now() { return CLOCK; } }
const hubAt = async (ms, fn) => { CLOCK = ms; globalThis.Date = HubDate; const log = console.log; console.log = () => { }; try { return await fn(); } finally { globalThis.Date = RealDate; console.log = log; } };   // the hub's own run log is silenced
// FIRMS source stub (the real 14-column header)
const HEAD = 'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n';
const csvRow = (lat, lng, day, time = '1300', frp = '5.8') => `${lat},${lng},316.31,0.61,0.71,${day},${time},N20,VIIRS,n,2.0NRT,284.7,${frp},D`;
const csv = rows => HEAD + rows.join('\n') + '\n';
let FIRMS = { body: HEAD };
globalThis.fetch = async url => { url = String(url);
  if (url.includes('firms.modaps')) { if (FIRMS.throw) throw new TypeError('fetch failed'); return new Response(FIRMS.body, { status: 200 }); }
  if (url.includes('earthquake.usgs.gov')) return new Response(JSON.stringify({ metadata: { generated: CLOCK - 60e3 }, features: [{ id: 'q1', properties: { mag: 3.1, magType: 'ml', time: CLOCK - 3600e3, title: 'M 3.1 - off Cape Town', url: '' }, geometry: { coordinates: [18.4, -33.9, 10] } }] }), { status: 200 });
  return new Response('stub', { status: 503 }); };

(async () => {
  let wn = 0; const freshWorker = async () => (await import(pathToFileURL(path.join(__dirname, 'worker.js')).href + '?fs=' + (++wn))).default;   // a fresh module per scenario: the hub caches the records file per isolate
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

  /** Open the page against `hub(pathname, search) → {status, body}` and read every surface. */
  const open = async (hub, opt = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' });
    await ctx.route('**/unpkg.com/globe.gl**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: GLOBE_JS }));
    await ctx.route('**/fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('**/gibs.earthdata.nasa.gov/**', r => r.abort());
    await ctx.route(BASE + '/index.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: served.index }));
    await ctx.route(BASE + '/app.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: opt.fast ? FAST_APP : served.app }));
    await ctx.route(HUB + '/**', async route => { const u = new URL(route.request().url()); const a = await hub(u.pathname, u.search); route.fulfill({ status: a.status, contentType: 'application/json', body: a.body }); });
    const page = await ctx.newPage(); const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 200)));
    await page.goto(BASE + '/' + (opt.page || 'index.html'), { waitUntil: 'domcontentloaded' });
    if (!opt.page) { await page.waitForFunction(() => window.ME && ME.pairState && ME.renderState && ME.renderState() && document.getElementById('s-firms').textContent !== 'loading' && document.getElementById('s-usgs').textContent !== 'loading', null, { timeout: 40000 }); await page.waitForTimeout(700); }
    return { ctx, page, perr };
  };
  const read = async page => {
    const r = {};
    r.card = await page.evaluate(() => { const t = id => document.getElementById(id); return { state: t('s-firms').textContent, tooltip: t('s-firms').title, count: t('v-firms').textContent, src: t('m-firms').textContent, lineShown: !t('p-firms').hidden, line: t('p-firms').textContent }; });
    r.pair = await page.evaluate(() => ME.pairState('firms').firms);
    r.drawn = await page.evaluate(() => ME.keyState().drawn.includes('firms'));
    await page.evaluate(() => document.getElementById('find-firms').click()); await page.waitForTimeout(150);
    r.find = await page.evaluate(() => document.getElementById('find-note').textContent);
    await page.evaluate(([la, ln]) => { const q = document.getElementById('search-q'); q.value = la + ', ' + ln; document.getElementById('search-form').requestSubmit(); }, [LAT, LNG]); await page.waitForTimeout(400);
    r.search = await page.evaluate(() => ({ searched: /fire detections/.test((document.getElementById('search-status').textContent.split('searched:')[1] || '')), note: ([...document.getElementById('search-notes').children].map(e => e.textContent).find(t => /^Fire detections: not searched/.test(t)) || '') }));
    r.report = await page.evaluate(() => { const R = ME.report(ME.readings()); return { text: R.text.split('; ').find(s => /fire/i.test(s)) || '', state: R.states.firms }; });
    await page.evaluate(id => ME.openPlace(id), CELL);
    await page.waitForFunction(() => /Fire detections/.test(document.getElementById('insp').innerText), null, { timeout: 15000 }).catch(() => { });
    r.place = await page.evaluate(() => { const all = document.getElementById('insp').innerText.split('\n'); const i = all.findIndex(l => /^Fire detections/.test(l)); return i < 0 ? '' : all[i + 1] || ''; });
    r.visible = await page.evaluate(() => document.body.innerText);
    return r;
  };
  const has = (s, w) => String(s).includes(w);
  /** The checks every row gets, from what it is expected to be. */
  const check = (tag, r, e, perr) => {
    ok(`${tag}: no page error`, !perr.length, perr);
    ok(`${tag}: card state "${e.state}"`, r.card.state === e.state, r.card);
    ok(`${tag}: card count "${e.count}"`, r.card.count === e.count, r.card);
    // A1: the line and the count go together
    ok(`${tag}: "Records withheld" line ${e.line ? 'shown' : 'hidden'}`, r.card.lineShown === !!e.line, r.card);
    if (e.line) { ok(`${tag}: the line says why (${e.line}) and "${ALONE}"`, has(r.card.line, e.line) && has(r.card.line, ALONE), r.card.line); ok(`${tag}: a count is on the card beside it`, /^[\d,]+$/.test(r.card.count), r.card.count); }
    else { ok(`${tag}: the hidden line holds no text`, r.card.line === '', r.card.line); ok(`${tag}: "${ALONE}" is nowhere on the visible page`, !has(r.visible, ALONE)); }
    ok(`${tag}: "${ALONE}" never appears beside a dash`, !(r.card.count === '–' && has(r.visible, ALONE)));
    // withholding is preserved: records are drawn and listed only when paired with the counts on screen
    ok(`${tag}: fire points drawn = ${e.points}`, r.pair.points === e.points && r.pair.usable === !!e.usable, r.pair);
    ok(`${tag}: Key counts fires as drawn = ${!!e.drawn}`, r.drawn === !!e.drawn, r.drawn);
    // A3: one reason on every surface
    if (e.reason) { const w = e.reason;
      ok(`${tag}: card line carries the reason`, has(r.card.src, w), r.card.src);
      ok(`${tag}: tooltip carries the reason`, has(r.card.tooltip, w), r.card.tooltip);
      ok(`${tag}: Find carries the reason`, has(r.find, w) && has(r.find, 'unknown right now'), r.find);
      ok(`${tag}: search says not searched, with the reason`, !r.search.searched && has(r.search.note, w), r.search);
      ok(`${tag}: report says unknown, with the reason`, has(r.report.text, 'fires: unknown — ' + w) && has(r.report.state, 'unknown — ' + w), r.report);
      if (e.placeReason !== false) ok(`${tag}: place row says unknown, with the reason`, r.place.startsWith('unknown — ' + w), r.place);
      for (const [n, s] of [['card', r.card.src], ['tooltip', r.card.tooltip], ['Find', r.find], ['search', r.search.note], ['report', r.report.text], ['place', e.placeReason === false ? '' : r.place]]) for (const not of e.never || []) ok(`${tag}: ${n} does not say "${not}"`, !has(s, not), s); }
    if (e.place) ok(`${tag}: place row starts "${e.place}"`, r.place.startsWith(e.place), r.place);
    if (e.find) ok(`${tag}: Find says "${e.find}"`, has(r.find, e.find), r.find);
    if (e.report) ok(`${tag}: report says "${e.report}"`, has(r.report.text, e.report), r.report);
    if (e.searched !== undefined) ok(`${tag}: fires searched = ${e.searched}`, r.search.searched === e.searched, r.search);
    if (e.searchNote) ok(`${tag}: search note says "${e.searchNote}"`, has(r.search.note, e.searchNote), r.search);
  };
  const sig = r => [r.card.state, r.card.count === '–' ? 'dash' : r.card.count === '0' ? 'zero' : 'count', r.card.lineShown ? 'line' : 'no-line', has(r.report.text, COPY) ? 'daily' : has(r.report.text, DOWN) ? 'failed' : has(r.report.text, 'old') ? 'stale' : has(r.report.text, 'validated zero') || has(r.report.text, 'no detections processed') ? 'header-only' : 'value', has(r.card.line, 'could not be read') ? 'unreadable' : has(r.card.line, 'different collector run') ? 'mismatch' : '-'].join('|');

  // =================================================================== PART 1: legacy `rows` fixtures
  const GOOD = iso(realNow() - 3 * 3600e3), NOW = iso(realNow() - 60e3), NEWER = iso(realNow() - 20e3), DOWN_AT = iso(realNow() - 30e3), OLD1 = iso(realNow() - 3 * 3600e3), OLD2 = iso(realNow() - 2 * 3600e3);
  const FIELDS = ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'];
  const RECS = [[LAT, LNG, GOOD, 'n', 5.8, 'N20', 'D'], [LAT - .01, LNG + .01, GOOD, 'n', 2.3, 'N20', 'D']];
  const cov = { grade: 'partial', evidence: 'pass_schedule_pending;cloud_may_hide_detections', observed_fraction: 1 };
  const base = { schema_version: 1, collector_version: '0.6.14', layer: 'firms', scheduled_for: NOW, interruptions: [], stale_after_s: 2400, record_format: 'rows', quantity: 'one VIIRS detection per pass' };
  const goodSnap = at => ({ ...base, retrieved_at: at, window_start: GOOD, window_end: at, source_status: 'ok', scope: 'world', raw_bytes: 5000, cells: { [CELL]: { count: 2, coverage: cov } }, record_fields: FIELDS, records: RECS });
  const goodCells = at => ({ ...goodSnap(at), records: undefined });
  const downCells = note => ({ ...base, retrieved_at: DOWN_AT, window_start: null, window_end: null, source_status: 'down', cells: {}, record_fields: [], note });   // envelope(layer, …, 'down', {}, [], [], { note }) without records
  const zeroSnap = (at, raw) => ({ ...base, retrieved_at: at, window_start: GOOD, window_end: at, source_status: 'ok', scope: 'world', raw_bytes: raw, cells: {}, record_fields: FIELDS, records: [] });
  const LEGACY = {
    'A missing daily feed': { cells: downCells(NOTE_BOUNDARY), snap: goodSnap(GOOD), e: { state: 'unknown', count: '–', points: 0, reason: COPY, never: [DOWN, 'no detections processed yet'] } },
    'B failed refresh': { cells: downCells(NOTE_FETCH), snap: goodSnap(GOOD), e: { state: 'unknown', count: '–', points: 0, reason: DOWN + ': ' + NOTE_FETCH, never: [COPY] } },
    'C valid zero, matched records': { cells: { ...zeroSnap(NOW, 5000), records: undefined }, snap: zeroSnap(NOW, 5000), e: { state: 'current', count: '0', points: 0, usable: true, drawn: false /* since legend-active-rc (15 Nov): a zero draws nothing, so the Key does not count it */, searched: true, find: 'No fire detections in this snapshot', report: '0 fire detections so far today', place: 'no detection reached us for this cell' } },
    'H header-only file published as ok (legacy path)': { cells: { ...zeroSnap(NOW, 122), records: undefined }, snap: zeroSnap(NOW, 122), e: { state: 'unknown', count: '–', points: 0, usable: true } },
    'D run mismatch, valid count': { cells: goodCells(NEWER), snap: goodSnap(GOOD), e: { state: 'current', count: '2', points: 0, drawn: true, line: 'records are from a different collector run', searched: false, searchNote: 'records are from a different collector run', find: 'are not usable', report: '2 fire detections so far today', place: 'withheld — records and counts are not from the same collector run' } },
    'E records file unreadable, valid count': { cells: goodCells(NOW), snap: null, e: { state: 'current', count: '2', points: 0, drawn: true, line: 'the record file could not be read', searched: false, searchNote: 'the record file could not be read', find: 'are not usable', report: '2 fire detections so far today', place: 'withheld — ' } },
    'S stale counts, mismatched records': { cells: goodCells(OLD2), snap: goodSnap(OLD1), e: { state: 'unknown', count: '–', points: 0, reason: 'last snapshot is over 40 min old', placeReason: false, never: [COPY, DOWN], place: 'withheld — records and counts are not from the same collector run' } },
    'F matched, valid count': { cells: goodCells(NOW), snap: goodSnap(NOW), e: { state: 'current', count: '2', points: 2, usable: true, drawn: true, searched: true, find: 'Highest FRP in the loaded snapshot: 5.8 MW', report: '2 fire detections so far today', place: '2 detections so far today' } },
  };
  const env0 = (layer, extra) => ({ layer, schema_version: 1, collector_version: '0.6.14', retrieved_at: NOW, source_status: 'ok', stale_after_s: 10800, window_start: GOOD, window_end: NOW, quantity: 'q', record_format: 'rows', ...extra });
  const usgsF = ['id', 'lat', 'lng', 'depth_km', 'mag', 'mag_type', 'observed_at', 'title', 'src'], usgsCells = { [cellOf(-33.9, 18.4)]: { count: 1, coverage: cov } };
  const legacyHub = async S => {
    const store = new Map(); store.set('latest-cells/firms.json', JSON.stringify(S.cells)); if (S.snap) store.set('latest/firms.json', JSON.stringify(S.snap));
    store.set('latest/usgs.json', JSON.stringify(env0('usgs', { record_fields: usgsF, records: [['q1', -33.9, 18.4, 10, 3.1, 'ml', GOOD, 'M 3.1 - off Cape Town', '']], cells: usgsCells }))); store.set('latest-cells/usgs.json', JSON.stringify(env0('usgs', { cells: usgsCells })));
    const R2 = { async get(k) { const b = store.get(k); if (b === undefined) return null; return { body: b, httpEtag: '"' + k + '"', etag: k, async json() { return JSON.parse(b); }, async text() { return b; } }; },
      async head(k) { const b = store.get(k); if (b === undefined) return null; return { key: k, size: new TextEncoder().encode(b).length, etag: k, httpEtag: '"' + k + '"', uploaded: new RealDate(), customMetadata: undefined }; },
      async put(k, b) { store.set(k, String(b)); }, async delete(k) { store.delete(k); }, async list() { return { objects: [] }; } };
    const W = await freshWorker(), env = { R2, DB: makeD1() };
    const hub = async (p, q) => {
      if (p.startsWith('/place/')) { const res = await W.fetch(new Request(HUB + p + q), env); return { status: res.status, body: await res.text() }; }
      const m = /^\/(cells|snapshot)\/(\w+)$/.exec(p);
      if (m) { const b = store.get((m[1] === 'cells' ? 'latest-cells/' : 'latest/') + m[2] + '.json'); if (b) return { status: 200, body: b }; if (m[2] === 'firms') return { status: 500, body: '{}' };
        return { status: 200, body: JSON.stringify(env0(m[2], { cells: {}, index: null, record_fields: [], records: [], sweep: { answered: 0, cells_total: 559, oldest_queried_at: NOW } })) }; }
      if (p === '/') return { status: 200, body: JSON.stringify({ name: 'x', history: { collecting: false, retained: { exists: false } } }) };
      return { status: 404, body: '{}' }; };
    return { hub, set(k, v) { store.set(k, JSON.stringify(v)); } };
  };
  const sigs = {};
  for (const [name, S] of Object.entries(LEGACY)) {
    const { hub } = await legacyHub(S); const { ctx, page, perr } = await open(hub); const r = await read(page);
    check('rows · ' + name, r, S.e, perr); sigs[name] = sig(r);
    if (name[0] === 'H') { ok('rows · H: the page\'s own reason for a header-only ok file (not a zero, not the daily sentence)', /not a validated zero|no detections processed yet for today \(UTC\) —/.test(r.card.tooltip) && !has(r.card.tooltip, COPY), r.card.tooltip); }
    if (name[0] === 'A') { ok('rows · A: the card and its tooltip end the sentence with a full stop', has(r.card.src, COPY + '.') && r.card.tooltip === COPY + '.', r.card); ok('rows · A: Find reads as one sentence', has(r.find, COPY + '. Nothing to move to.') && !has(r.find, '..'), r.find); }
    await ctx.close();
  }
  // A5: no two states read the same
  { const keys = Object.keys(sigs).filter(k => k[0] !== 'F'), seen = new Map(); for (const k of keys) { const dup = seen.get(sigs[k]); ok(`A5: "${k}" is distinct${dup ? ' (same as "' + dup + '")' : ''}`, !dup, sigs); seen.set(sigs[k], k); }
    ok('A5: a valid zero and the daily reset differ in state, count and reason', sigs['C valid zero, matched records'] !== sigs['A missing daily feed'] && sigs['C valid zero, matched records'].startsWith('current|zero'), sigs);
    ok('A5: the daily reset and a failed refresh differ by reason only', sigs['A missing daily feed'].replace('daily', 'x') === sigs['B failed refresh'].replace('failed', 'x'), sigs); }

  // =================================================================== PART 2: production `lines/1`, written by the hub's own pipeline
  const Q = 15 * 60e3, q15 = ms => Math.floor(ms / Q) * Q, day = ms => iso(ms).slice(0, 10);
  const v2 = async build => {
    const r2 = makeR2(), env = { R2: r2.R2, DB: makeD1(), ADMIN_KEY: 'k', FIRMS_MAP_KEY: 'MAPKEY0123456789abcdef', HISTORY_ENABLED: '1', FIRMS_PIPELINE: 'v2', FIRMS_CREATE_ONLY: 'verified' };
    const W = await freshWorker();
    const run = async (endMs, body) => { FIRMS = body === 'throw' ? { throw: true } : { body }; await hubAt(endMs, () => W.scheduled({ cron: '*/15 * * * *', scheduledTime: q15(endMs) }, env, { waitUntil() { } })); };
    await build({ run, r2 });
    const hub = async (p, q) => { const res = await W.fetch(new Request(HUB + p + q), env); return { status: res.status, body: await res.text() }; };
    const cells = JSON.parse(r2.text('latest-cells/firms.json') || 'null'), head = await r2.R2.head('latest/firms.json'), latest = r2.text('latest/firms.json');
    return { hub, cells, format: head && head.customMetadata.format, latest };
  };
  const two = d => csv([csvRow(LAT, LNG, d, '1300', '5.8'), csvRow(LAT - .01, LNG + .01, d, '1310', '2.3')]), three = d => csv([csvRow(LAT, LNG, d, '1300', '5.8'), csvRow(LAT - .01, LNG + .01, d, '1310', '2.3'), csvRow(10, 10, d, '1320', '9.9')]);
  const n0 = realNow(), midnight = RealDate.UTC(new RealDate(n0).getUTCFullYear(), new RealDate(n0).getUTCMonth(), new RealDate(n0).getUTCDate());
  const V2 = {
    'A missing daily feed': { build: async ({ run }) => { await run(midnight - 14 * 60e3, two(day(midnight - Q))); await run(midnight + 31 * 60e3, HEAD); },   // last good run 23:45 yesterday; header-only at 00:30 today
      e: c => ({ state: 'unknown', count: '–', points: 0, reason: COPY, never: [DOWN, 'no detections processed yet'] }), down: /^no detections processed yet for today \(UTC\)/ },
    'B failed refresh': { build: async ({ run }) => { await run(n0 - 17 * 60e3, two(day(n0))); await run(n0 - 60e3, 'throw'); },
      e: c => ({ state: 'unknown', count: '–', points: 0, reason: DOWN + ': ' + c.note, never: [COPY] }), down: /fetch failed/ },
    'D run mismatch, valid count': { build: async ({ run, r2 }) => { await run(n0 - 17 * 60e3, two(day(n0))); const keep = r2.m.get('latest/firms.json'); await run(n0 - 60e3, three(day(n0))); r2.m.set('latest/firms.json', keep); },   // counts from the second run, records file still the first run's
      e: c => ({ state: 'current', count: '3', points: 0, drawn: true, line: 'records are from a different collector run', searched: false, searchNote: 'records are from a different collector run', find: 'are not usable', report: '3 fire detections so far today', place: 'withheld — records and counts are not from the same collector run' }) },
    'S stale counts, mismatched records': { build: async ({ run, r2 }) => { await run(n0 - 3 * 3600e3, two(day(n0 - 3 * 3600e3))); const keep = r2.m.get('latest/firms.json'); await run(n0 - 2 * 3600e3, three(day(n0 - 2 * 3600e3))); r2.m.set('latest/firms.json', keep); },
      e: c => ({ state: 'unknown', count: '–', points: 0, reason: 'last snapshot is over 40 min old', placeReason: false, never: [COPY, DOWN], place: 'withheld — records and counts are not from the same collector run' }) },
    'F matched, valid count': { build: async ({ run }) => { await run(n0 - 60e3, two(day(n0))); },
      e: c => ({ state: 'current', count: '2', points: 2, usable: true, drawn: true, searched: true, find: 'Highest FRP in the loaded snapshot: 5.8 MW', report: '2 fire detections so far today', place: '2 detections so far today' }) },
  };
  const vsigs = {};
  for (const [name, S] of Object.entries(V2)) {
    const h = await v2(S.build), tag = 'lines/1 · ' + name;
    ok(`${tag}: the hub published a lines/1 records file`, h.format === 'lines/1' && /^\{\n"/.test(h.latest || '') && /\n"records":\[\n/.test(h.latest || ''), { format: h.format, head: (h.latest || '').slice(0, 60) });
    ok(`${tag}: the counts file carries a run id`, !!(h.cells && h.cells.run_id), h.cells && { run_id: h.cells.run_id, status: h.cells.source_status });
    if (S.down) ok(`${tag}: the hub itself recorded the run as down, cells: {}, note as expected`, h.cells.source_status === 'down' && JSON.stringify(h.cells.cells) === '{}' && S.down.test(h.cells.note || ''), h.cells);
    const { ctx, page, perr } = await open(h.hub); const r = await read(page);
    check(tag, r, S.e(h.cells), perr); vsigs[name] = sig(r);
    await ctx.close();
  }
  for (const k of Object.keys(vsigs)) ok(`lines/1 · "${k}" reads the same as its legacy row`, vsigs[k] === sigs[k], { lines1: vsigs[k], rows: sigs[k] });

  // =================================================================== PART 3: a transition, and the Sources page
  { const S = LEGACY['D run mismatch, valid count']; const L = await legacyHub(S); const { ctx, page, perr } = await open(L.hub, { fast: true });
    const before = await page.evaluate(() => ({ count: document.getElementById('v-firms').textContent, shown: !document.getElementById('p-firms').hidden, line: document.getElementById('p-firms').textContent }));
    ok('transition: starts with a count and the line', before.count === '2' && before.shown && has(before.line, ALONE), before);
    L.set('latest-cells/firms.json', downCells(NOTE_BOUNDARY));   // the feed goes down; the records file stays the last good run's
    await page.waitForFunction(() => document.getElementById('v-firms').textContent === '–', null, { timeout: 20000 }).catch(() => { });
    const after = await page.evaluate(() => ({ count: document.getElementById('v-firms').textContent, shown: !document.getElementById('p-firms').hidden, line: document.getElementById('p-firms').textContent, visible: document.body.innerText.includes('counts shown alone'), src: document.getElementById('m-firms').textContent }));
    ok('transition: the count becomes a dash and the line goes with it, text and all', after.count === '–' && !after.shown && after.line === '' && !after.visible && has(after.src, COPY + '.'), after);
    L.set('latest-cells/firms.json', S.cells);   // counts return, records still mismatched
    await page.waitForFunction(() => document.getElementById('v-firms').textContent === '2', null, { timeout: 20000 }).catch(() => { });
    const back = await page.evaluate(() => ({ count: document.getElementById('v-firms').textContent, shown: !document.getElementById('p-firms').hidden, line: document.getElementById('p-firms').textContent }));
    ok('transition: the count returns and so does the line', back.count === '2' && back.shown && has(back.line, ALONE), back);
    ok('transition: no page error', !perr.length, perr); await ctx.close(); }
  { const { hub } = await legacyHub(LEGACY['A missing daily feed']); const { ctx, page, perr } = await open(hub, { page: 'sources.html' });
    await page.waitForFunction(() => document.body.innerText.includes('Today’s detections') || document.body.innerText.includes('collector reported down'), null, { timeout: 20000 }).catch(() => { });
    const t = await page.evaluate(() => ({ text: document.body.innerText, app: [...document.scripts].map(s => s.getAttribute('src')).find(s => s && s.startsWith('app.js')) }));
    ok('Sources page, daily state: says the daily sentence, never "collector reported down" or "counts shown alone"', has(t.text, COPY) && !has(t.text, DOWN) && !has(t.text, ALONE), t.text.split('\n').filter(l => /fire/i.test(l)).slice(0, 4));
    ok('Sources page: no page error', !perr.length, perr);
    const ix = (served.index.match(/app\.js\?v=(\d+)/) || [])[1]; ok('app.js cache key is the same on both pages and is not main\'s', t.app === 'app.js?v=' + ix && ix !== '202611291000', { sources: t.app, index: ix });
    await ctx.close(); }

  await browser.close(); clearTimeout(wd);
  console.log(`fire-status-ui${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('ERR', e); process.exit(1); });
