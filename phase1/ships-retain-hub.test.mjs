// Ships publication rule (hub 0.6.19; docs/concepts/SHIPS-DIAGNOSTICS-PROPOSAL.md rev 2.1, Parts B and C). Hub side.
// The real worker.js through its own dispatch: POST /ingest/ships for the Mac's uploads, /admin/run/ships-fallback for the
// hub's own sample (Worker WebSocket stubbed), /place, /cells and /snapshot for what readers get. R2 in memory with
// conditional writes, custom metadata and hooks to force interleavings; the clock is real time plus an offset we move.
// What it proves: an overlong sample and a failure never replace the last eligible sample; ordinary low-flow samples are
// eligible; an attempt never renews the sample's three-hour life; nothing to keep or an expired sample → a down-shaped
// counts file; order is by run time, also against last_attempt; records and counts are written conditionally, records first;
// a writer that loses re-reads once, then stops; an interrupted writer leaves a state readers withhold and the next write
// repairs; the fallback judges staleness from the retained sample's own time; public text is a fixed phrase.
// What it does NOT prove: the hourly aggregation itself is not run here (its "ok samples only" filter is checked in the source
// text, and the archived overlong object is checked to be degraded); production R2's conditional writes (checked on the real
// bucket by fvProbeR2 for the same two forms).
// Run: node --no-warnings phase1/ships-retain-hub.test.mjs      (about 2.5 min: two cases listen for the real 60 s)
// Breaks (each must fail): BREAK=overlong-publishes|attempt-renews|unconditional-cells|unconditional-records|fallback-reads-attempt|
//   older-failure-replaces|delayed-erases-later|no-repair|no-repair-on-archive|repair-drops-attempt|repair-unconditional|repair-no-retry|log-before-outcome|repair-not-logged|raw-note-public|expired-kept|down-replaces-sample|records-on-attempt|overlong-guard-only
//   FAST=1 skips the two 60 s fallback-sample cases (used for the breaks, which all fail in the fast cases).
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), BREAK = process.env.BREAK || '';
let src = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const BREAKS = {
  'overlong-publishes': ["(e.source_status === 'ok' || e.source_status === 'degraded') && e.overlong_sample !== true && e.cells", "(e.source_status === 'ok' || e.source_status === 'degraded') && e.cells",
    "    if (e.overlong_sample === true) {\n      const o = await shipsOverlong", "    if (false) {\n      const o = await shipsOverlong"],   // 0.6.18's behaviour: an overlong upload is published like any sample
  'overlong-guard-only': ["    if (e.overlong_sample === true) {\n      const o = await shipsOverlong", "    if (false) {\n      const o = await shipsOverlong"],   // the ingest branch alone removed: the second lock must still refuse it
  'attempt-renews': ["const body = keep ? { ...S, last_attempt: la }", "const body = keep ? { ...S, retrieved_at: at, last_attempt: la }"],
  'unconditional-cells': ["if (await shipsCondPut(env, SHIPS_PUB.cells, body, c.etag)) return keep ? 'kept last sample' : 'down envelope';", "await putJson(env, SHIPS_PUB.cells, body); return keep ? 'kept last sample' : 'down envelope';"],
  'unconditional-records': ["if (!mine && !(await shipsCondPut(env, SHIPS_PUB.rec, e, rec.absent ? null : rec.etag, meta))) continue;", "if (!mine) await env.R2.put(SHIPS_PUB.rec, JSON.stringify(e), { httpMetadata: { contentType: 'application/json' }, customMetadata: meta });"],
  'fallback-reads-attempt': ["const now = Date.now(); const latest = await getJson(env, 'latest/ships.json');", "const now = Date.now(); let latest = await getJson(env, 'latest/ships.json'); { const cc = await getJson(env, 'latest-cells/ships.json'); if (latest && cc && cc.last_attempt) latest = { ...latest, retrieved_at: cc.last_attempt.at }; }"],
  'older-failure-replaces': ["const stored = [cur && cur.scheduled_for, L && L.run].filter(Boolean).sort().pop();", "const stored = [cur && cur.scheduled_for].filter(Boolean).sort().pop();"],
  'delayed-erases-later': ["...(L && L.run && L.run > E.scheduled_for ? { last_attempt: { ...L, consecutive: 1 } } : {}) });", "});"],
  'no-repair': ["async function shipsRepair(env) {\n  try {", "async function shipsRepair(env) {\n  return 'none';\n  try {"],
  'no-repair-on-archive': ["{ const repair = await shipsRepair(env); return { published: 'archive only (older than latest)'", "{ const repair = 'none'; return { published: 'archive only (older than latest)'"],   // GPT hold 1 as it was at 5789f08
  'repair-drops-attempt': ["if (await shipsCondPut(env, SHIPS_PUB.cells, shipsCellsFor(E, cur && cur.last_attempt), c.etag)) return 'repaired';", "if (await shipsCondPut(env, SHIPS_PUB.cells, shipsCellsFor(E, null), c.etag)) return 'repaired';"],
  'repair-unconditional': ["if (await shipsCondPut(env, SHIPS_PUB.cells, shipsCellsFor(E, cur && cur.last_attempt), c.etag)) return 'repaired';", "await putJson(env, SHIPS_PUB.cells, shipsCellsFor(E, cur && cur.last_attempt)); return 'repaired';"],
  'repair-no-retry': ["    for (let t = 0; t < 2; t++) {\n      const c = await shipsReadCells(env), cur = c.cur, rec = await shipsRecHead(env);", "    for (let t = 0; t < 1; t++) {\n      const c = await shipsReadCells(env), cur = c.cur, rec = await shipsRecHead(env);"],
  'log-before-outcome': ["(/^left: /.test(outcome) ? ' [publication ' + outcome + ']' : '')", "''"],   // GPT hold 2 as it was at 5789f08: the conflict never reaches collector_runs
  'repair-not-logged': ["(info && info.repair && info.repair !== 'none' ? ' [counts repair: ' + info.repair + ']' : '')", "''", "const shipsRepairNote = r => (r && r !== 'none' ? '; counts repair: ' + r : '');", "const shipsRepairNote = r => '';"],
  'raw-note-public': ["const raw = String(e.note || ''), phrase = SHIPS_COLLECTOR_PHRASES.includes(raw) ? raw : SHIPS_PHRASE.collector;", "const raw = String(e.note || ''), phrase = raw;"],
  'expired-kept': ["const keep = !!(S && !shipsExpired(S, Date.now()));", "const keep = !!S;"],
  'down-replaces-sample': ["const keep = !!(S && !shipsExpired(S, Date.now()));", "const keep = false;"],   // 0.6.18's behaviour for a failure
  'records-on-attempt': ["      if (await shipsCondPut(env, SHIPS_PUB.cells, body, c.etag)) return keep", "      if (a.reason === 'sample_overlong' && a.e) await putJson(env, SHIPS_PUB.rec, a.e);\n      if (await shipsCondPut(env, SHIPS_PUB.cells, body, c.etag)) return keep",
    "collected_by: e.collected_by || e.ingested_from || null }, info);", "collected_by: e.collected_by || e.ingested_from || null, e }, info);"],   // both parts are checked to apply (the second was once applied unchecked and silently stopped applying)
};
let workerPath = path.join(HERE, 'worker.js');
if (BREAK) { if (!BREAKS[BREAK]) { console.log('FAIL  unknown break ' + BREAK); process.exit(1); } const B_ = BREAKS[BREAK]; for (let i = 0; i < B_.length; i += 2) { if (src.split(B_[i]).length !== 2) { console.log('FAIL  break did not apply: ' + BREAK + ' #' + i / 2); process.exit(1); } src = src.replace(B_[i], B_[i + 1]); }
  workerPath = path.join(HERE, `.ships-retain-break-${process.pid}.tmp.mjs`); fs.writeFileSync(workerPath, src); process.on('exit', () => { try { fs.unlinkSync(workerPath); } catch (_) { } }); }
const worker = (await import(pathToFileURL(workerPath).href)).default;

// ---------- clock: real time plus an offset
const RealDate = Date, real = RealDate.now, B = real(); let NOW = RealDate.parse('2026-11-18T12:00:00.000Z');
globalThis.Date = class extends RealDate { constructor(...a) { a.length ? super(...a) : super(NOW + (real() - B)); } static now() { return NOW + (real() - B); } };
const now = () => Date.now(), iso = ms => new RealDate(ms).toISOString(), advance = ms => { NOW += ms; };

// ---------- the Worker's outbound WebSocket (the fallback's listen)
let conns = 0, wsMode = 'ok', onDuring = null;
globalThis.fetch = async (url) => { url = String(url); if (!url.includes('aisstream')) return new Response('stub', { status: 503 });
  conns++; if (wsMode === '522') return { status: 522, webSocket: null };
  const L = {}; const emit = (t, e) => (L[t] || []).forEach(f => f(e));
  const ws = { accept() { }, addEventListener(t, f) { (L[t] = L[t] || []).push(f); }, close() { setTimeout(() => emit('close', { code: 1000, reason: '' }), 0); },
    send() { setTimeout(async () => { emit('message', { data: new Blob([JSON.stringify({ MessageType: 'SubscriptionConfirmation' })]) });
      for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 1450)); emit('message', { data: new Blob([JSON.stringify({ MessageType: 'PositionReport', MetaData: { MMSI: 300000 + (i % 25), latitude: -33 + i * 0.01, longitude: 18, ShipName: 'F' + i, time_utc: iso(now()).replace('T', ' ').replace('Z', ' +0000 UTC') }, Message: { PositionReport: { Sog: 1 } } })]) }); if (i === 20 && onDuring) await onDuring(); }
    }, 5); } };
  return { status: 101, webSocket: ws }; };

// ---------- env
const REC = 'latest/ships.json', CELLS = 'latest-cells/ships.json';
const enc = new TextEncoder(), dec = new TextDecoder();
let seq = 0;   // etags are unique across every env of the run: the hub caches /place records by etag for the life of the module
function makeEnv(extra = {}) {
  const m = new Map(), puts = [], runs = []; const hooks = { beforePut: null }, fail = { put: null };
  const obj = (k, v) => ({ key: k, size: v.b.length, etag: v.etag, httpEtag: '"' + v.etag + '"', uploaded: new Date(v.up), customMetadata: v.meta || {}, httpMetadata: {} });
  const R2 = {
    async put(k, value, o = {}) {
      puts.push({ key: k, cond: o.onlyIf ? (o.onlyIf.etagMatches ? 'etag' : 'absent') : 'none' });
      if (hooks.beforePut) { const h = hooks.beforePut; await h(k, o); }
      if (fail.put && fail.put(k, o)) throw new Error('R2 stub: forced put failure ' + k);
      const cur = m.get(k), c = o.onlyIf;
      if (c && c.etagDoesNotMatch === '*' && cur) return null;
      if (c && c.etagMatches && (!cur || cur.etag !== c.etagMatches)) return null;
      const v = { b: enc.encode(String(value)), etag: 'e' + (++seq), up: now(), meta: o.customMetadata || {} }; m.set(k, v); return obj(k, v);
    },
    async head(k) { const v = m.get(k); return v ? obj(k, v) : null; },
    async get(k) { const v = m.get(k); if (!v) return null; return { ...obj(k, v), body: new Blob([v.b]).stream(), async text() { return dec.decode(v.b); }, async json() { return JSON.parse(dec.decode(v.b)); } }; },
    async delete(k) { m.delete(k); },
    async list({ prefix } = {}) { return { objects: [...m.keys()].filter(k => !prefix || k.startsWith(prefix)).map(key => ({ key, uploaded: new Date() })), truncated: false }; },
  };
  const stmt = sql => { const x = a => ({ async run() { if (/INSERT INTO collector_runs/.test(sql)) runs.push({ layer: a[0], started_at: a[1], status: a[3], http: a[4], records: a[5], note: a[7] }); return {}; }, async first() { return null; }, async all() { return { results: [] }; } }); return { bind: (...a) => x(a), ...x([]) }; };
  const env = { R2, DB: { prepare: stmt, async batch() { return []; } }, ADMIN_KEY: 'k', INGEST_KEY: 'ik', AISSTREAM_KEY: 'AIS-SECRET', SHIPS_FALLBACK: '1', ...extra };
  const raw = k => { const v = m.get(k); return v ? dec.decode(v.b) : null; };
  return { env, m, puts, runs, hooks, fail, raw, json: k => { const t = raw(k); return t === null ? null : JSON.parse(t); }, etag: k => m.get(k) && m.get(k).etag, meta: k => m.get(k) && m.get(k).meta,
    sruns: () => runs.filter(r => r.layer === 'ships'), keys: p => [...m.keys()].filter(k => k.startsWith(p)) };
}
// ---------- the Mac's envelopes (collector mac-0.3.5's shape)
const FIELDS = ['mmsi', 'lat', 'lng', 'observed_at', 'received_at', 'sog_kn', 'cog_deg', 'heading_deg', 'nav_status', 'class', 'name'];
const cellOf = (lat, lng) => `${Math.floor((lat + 90) / 4)}_${Math.floor((lng + 180) / 4)}`;
const COV = { grade: 'partial', evidence: 'messages_flowing_inferred_from_arrival_gaps', observed_fraction: 1 };
/** A sample whose run began `runMs`; n vessels spread over a few cells (the first one always in cell 14_49: Cape Town). */
function sample(runMs, n, o = {}) {
  const t = iso(runMs + (o.elapsedS || 60) * 1000);
  const records = Array.from({ length: n }, (_, i) => [String(o.base || 100000 + i), i === 0 ? -33.9 : -60 + (i % 100), i === 0 ? 18.4 : -170 + (i % 300), t, t, 1, 2, 3, 0, 'A', 'V' + i]);
  const cells = {}; for (const r of records) { const k = cellOf(r[1], r[2]); (cells[k] = cells[k] || { count: 0, coverage: { ...COV } }).count++; }
  return { schema_version: 1, collector_version: 'mac-0.3.5', layer: 'ships', window_start: iso(runMs), window_end: t, retrieved_at: t, scheduled_for: iso(runMs), source_status: o.status || 'ok', interruptions: [],
    cells, record_format: 'rows', record_fields: FIELDS, records, coverage_default: COV, quantity: 'vessel identities in a 60 s AIS sample', window_s: 60, elapsed_wall_s: o.elapsedS || 60.1,
    messages_flowing_s: o.flowS ?? 58, connection_fraction_of_sample: (o.flowS ?? 58) / 60, overlong_sample: !!o.overlong, stale_after_s: 10800, class_a: n, class_b: 0, socket_connected_s: 59 };
}
const down = (runMs, note) => ({ schema_version: 1, collector_version: 'mac-0.3.5', layer: 'ships', retrieved_at: iso(runMs + 18000), scheduled_for: iso(runMs), source_status: 'down', cells: {}, note });
const post = async (E, body) => { const r = await worker.fetch(new Request('https://hub/ingest/ships', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ik', 'User-Agent': 'mother-earth-mac-0.3.5' }, body: JSON.stringify(body) }), E.env); return { status: r.status, j: await r.json() }; };
const get = async (E, p) => { const r = await worker.fetch(new Request('https://hub' + p), E.env); const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch (_) { } return { status: r.status, text, j }; };
const fallback = E => worker.fetch(new Request('https://hub/admin/run/ships-fallback?key=k'), E.env).then(r => r.json());
const placeShips = async E => { const p = await get(E, '/place/g4/14_49'); return (p.j && p.j.sections || []).find(s => s.layer === 'ships') || (p.j && p.j.layers && p.j.layers.ships) || p.j; };
/** No reader may be given records and counts from different runs: when the two files name different runs, /place must not list records. */
async function paired(E, label) {
  const c = E.json(CELLS), r = E.json(REC); if (!c || !r || c.source_status === 'down') return;
  const s = await placeShips(E);
  if (c.retrieved_at !== r.retrieved_at) assert.ok(s && s.state === 'withheld' && !s.records, `${label}: records ${r.retrieved_at} and counts ${c.retrieved_at} differ, so /place must withhold (got ${s && s.state})`);
  else assert.ok(s && (s.state === 'ok' || s.state === 'no_records' || s.state === 'withheld'), `${label}: paired files, /place answers (got ${s && s.state})`);
}
let passed = 0, failed = 0;
const t = async (n, fn) => { const s = real(); try { await fn(); passed++; console.log(`ok - ${n} (${((real() - s) / 1000).toFixed(1)} s)`); } catch (e) { failed++; console.log(`FAIL  ${n}\n      ${String(e && e.message || e).replace(/\n/g, " | ").slice(0, 500)}`); } };
const T0 = () => now();
/** S published: a 3,000-vessel eligible sample whose run began 31 minutes ago. */
async function seeded(o = {}) { const E = makeEnv(); const runMs = now() - (o.agoMin ?? 31) * 60e3; const S = sample(runMs, o.n ?? 3000, o); const r = await post(E, S); assert.equal(r.status, 200); return { E, S, runMs }; }
const sameSample = (cells, S) => { const c = { ...cells }; delete c.last_attempt; delete c.received_at; delete c.ingested_from; const w = { ...S, records: undefined, record_fields: undefined, record_format: undefined }; return JSON.stringify(Object.keys(w).filter(k => w[k] !== undefined).sort().map(k => [k, c[k]])) === JSON.stringify(Object.keys(w).filter(k => w[k] !== undefined).sort().map(k => [k, w[k]])); };

await t('0. hub reports at least 0.6.19', async () => { const v = String((await get(makeEnv(), '/')).j.version).split('.').map(Number); assert.ok(v.length === 3 && (v[0] > 0 || v[1] > 6 || (v[1] === 6 && v[2] >= 19)), 'version ' + v.join('.')); });

await t('1. an eligible ok sample is published: records and counts name the same run; records carry run metadata; no attempt note', async () => {
  const { E, S } = await seeded(); const c = E.json(CELLS), r = E.json(REC);
  assert.equal(r.records.length, 3000); assert.equal(c.retrieved_at, S.retrieved_at); assert.equal(r.retrieved_at, S.retrieved_at); assert.equal(c.last_attempt, undefined); assert.equal(c.records, undefined);
  assert.deepEqual(E.meta(REC), { run: S.scheduled_for, retrieved_at: S.retrieved_at, eligible: '1' });
  const row = E.sruns().pop(); assert.equal(row.status, 'ok'); assert.match(row.note, /^ingested from mother-earth-mac-0\.3\.5 vmac-0\.3\.5$/);
  await paired(E, '1'); assert.equal((await placeShips(E)).state, 'ok');
});
await t('2. an ordinary low-flow sample (53 of 60 s, degraded, not overlong) is eligible: it is published and it is retained after a failure', async () => {
  const { E, S } = await seeded({ status: 'degraded', flowS: 53, n: 2700 });
  assert.equal(E.json(CELLS).source_status, 'degraded'); assert.equal(E.json(REC).records.length, 2700);
  const r = await post(E, down(now() - 60e3, 'websocket error before connection')); assert.equal(r.j.published, 'failure recorded; last sample kept');
  const c = E.json(CELLS); assert.ok(sameSample(c, S), 'the degraded sample is kept unchanged'); assert.equal(c.source_status, 'degraded'); assert.equal(c.last_attempt.status, 'down'); await paired(E, '2');
});
await t('3. a failure after a good sample: counts keep the sample unchanged and gain last_attempt; records untouched; raw note only in the log and the dated object', async () => {
  const { E, S } = await seeded(); const recEtag = E.etag(REC), fRun = now() - 30e3;
  const r = await post(E, down(fRun, 'websocket error after connection')); assert.equal(r.status, 200); assert.equal(r.j.published, 'failure recorded; last sample kept');
  const c = E.json(CELLS); assert.ok(sameSample(c, S), 'sample fields unchanged'); assert.equal(c.retrieved_at, S.retrieved_at, 'the sample keeps its own time'); assert.equal(c.scheduled_for, S.scheduled_for);
  assert.deepEqual(Object.keys(c.last_attempt).sort(), ['at', 'collected_by', 'consecutive', 'reason', 'run', 'status']);
  assert.equal(c.last_attempt.run, iso(fRun)); assert.equal(c.last_attempt.status, 'down'); assert.equal(c.last_attempt.reason, 'websocket error after connection'); assert.equal(c.last_attempt.consecutive, 1);
  assert.equal(E.etag(REC), recEtag, 'a failure never writes the records file'); assert.equal(E.json(REC).records.length, 3000);
  const row = E.sruns().pop(); assert.equal(row.status, 'down'); assert.equal(row.note, 'ingested down: websocket error after connection');
  const dated = E.keys('cells/ships/').map(k => E.json(k)).find(x => x.source_status === 'down'); assert.ok(dated && dated.note === 'ingested down: websocket error after connection');
  await paired(E, '3'); const p = await placeShips(E); assert.equal(p.state, 'ok'); assert.equal(p.last_attempt.run, iso(fRun));
});
await t('4. a note that is not one of the collector\'s fixed phrases is never published: the public reason is a fixed phrase', async () => {
  const { E } = await seeded(); await post(E, down(now() - 30e3, 'Error: websocket error: SECRET-DETAIL 10.0.0.7'));
  assert.equal(E.json(CELLS).last_attempt.reason, 'collector reported a failure');
  for (const p of ['/cells/ships', '/snapshot/ships', '/place/g4/14_49', '/status']) assert.ok(!(await get(E, p)).text.includes('SECRET-DETAIL'), p + ' must not carry the raw note');
  assert.match(E.sruns().pop().note, /SECRET-DETAIL/, 'the raw note stays in collector_runs');
  const F = makeEnv(); await post(F, down(now() - 30e3, 'Error: SECRET-DETAIL')); assert.equal(F.json(CELLS).note, 'collector reported a failure'); assert.ok(!(await get(F, '/cells/ships')).text.includes('SECRET-DETAIL'));
});
await t('5. the 17 Nov case: a 381.5 s, 700-vessel overlong sample after a 3,000-vessel sample is NOT published', async () => {
  const { E, S } = await seeded(); const recEtag = E.etag(REC), oRun = now() - 390e3;
  const O = sample(oRun, 700, { status: 'degraded', overlong: true, elapsedS: 381.5, flowS: 20.2 });
  const r = await post(E, O); assert.equal(r.status, 200); assert.equal(r.j.published, 'not published: overlong sample; last sample kept'); assert.equal(r.j.records, 700);
  const c = E.json(CELLS); assert.ok(sameSample(c, S), 'the 3,000-vessel sample is still the counts'); assert.equal(E.etag(REC), recEtag); assert.equal(E.json(REC).records.length, 3000, 'records are still the 3,000');
  assert.equal(c.last_attempt.status, 'degraded'); assert.equal(c.last_attempt.reason, 'sample_overlong'); assert.equal(c.last_attempt.elapsed_s, 381.5); assert.equal(c.last_attempt.window_s, 60); assert.equal(c.last_attempt.run, iso(oRun));
  const arch = E.keys('snapshots/ships/').map(k => E.json(k)).find(x => x.overlong_sample === true); assert.ok(arch && arch.records.length === 700 && arch.source_status === 'degraded', 'the archive holds the 700 as degraded and overlong');
  const archCells = E.keys('cells/ships/').map(k => E.json(k)).find(x => x.overlong_sample === true); assert.ok(archCells && archCells.source_status === 'degraded' && archCells.records === undefined);
  const row = E.sruns().pop(); assert.equal(row.status, 'degraded'); assert.equal(row.records, 700); assert.match(row.note, /not published: overlong sample/);
  assert.ok(/const ok = files\.filter\(x => x\.f\.source_status === 'ok'\);/.test(src), 'the hourly aggregate uses ok samples only (source text): a degraded overlong sample is not in it');
  await paired(E, '5'); const p = await placeShips(E); assert.equal(p.state, 'ok'); assert.equal(p.records_total, 1); assert.equal(p.last_attempt.reason, 'sample_overlong');
});
await t('6. nothing to keep: a failure, and an overlong sample, each give a down-shaped counts file with a fixed phrase; no records are shown as current', async () => {
  const E = makeEnv(); const r = await post(E, down(now() - 30e3, 'connect timeout (15 s)')); assert.equal(r.j.published, 'cells only (down)');
  let c = E.json(CELLS); assert.equal(c.source_status, 'down'); assert.equal(c.note, 'connect timeout (15 s)'); assert.deepEqual(c.cells, {}); assert.equal(c.last_attempt.consecutive, 1); assert.equal(E.raw(REC), null);
  const F = makeEnv(); const O = sample(now() - 390e3, 700, { status: 'degraded', overlong: true, elapsedS: 381.5, flowS: 20.2 }); const r2 = await post(F, O); assert.equal(r2.j.published, 'not published: overlong sample; nothing to keep');
  c = F.json(CELLS); assert.equal(c.source_status, 'down'); assert.equal(c.note, 'latest sample ran past its window and is not shown'); assert.equal(c.reason, 'sample_overlong'); assert.deepEqual(c.cells, {}); assert.equal(c.last_attempt.elapsed_s, 381.5);
  assert.equal(F.raw(REC), null, 'an overlong sample never writes the records file'); assert.equal((await get(F, '/snapshot/ships')).status === 200 && (await get(F, '/snapshot/ships')).j.records && (await get(F, '/snapshot/ships')).j.records.length > 0, false, 'no records served as current');
});
await t('7. three-hour life: at 2 h 59 min the sample is kept; at 3 h it is not; attempts never move its time; an expired sample is not brought back', async () => {
  const { E, S, runMs } = await seeded({ agoMin: 1 }); const sampleAt = Date.parse(S.retrieved_at);
  advance(60 * 60e3); await post(E, down(now() - 20e3, 'websocket error before connection'));
  advance(60 * 60e3); await post(E, down(now() - 20e3, 'websocket error before connection'));
  NOW += (sampleAt + (2 * 3600 + 59 * 60) * 1000) - now(); const r1 = await post(E, down(now() - 20e3, 'websocket error before connection'));
  let c = E.json(CELLS); assert.equal(r1.j.published, 'failure recorded; last sample kept'); assert.equal(c.last_attempt.consecutive, 3, 'three failures in a row are counted'); assert.equal(c.retrieved_at, S.retrieved_at, 'three attempts later the sample still carries its own time'); assert.ok(sameSample(c, S));
  assert.equal(E.json(REC).retrieved_at, S.retrieved_at, 'and so does the records file the fallback reads');
  NOW += (sampleAt + 3 * 3600 * 1000 + 1000) - now(); const r2 = await post(E, down(now() - 20e3, 'websocket error before connection'));
  c = E.json(CELLS); assert.equal(r2.j.published, 'cells only (down)'); assert.equal(c.source_status, 'down'); assert.deepEqual(c.cells, {}); assert.equal(c.last_attempt.consecutive, 4);
  advance(10 * 60e3); await post(E, down(now() - 20e3, 'websocket error before connection')); c = E.json(CELLS); assert.equal(c.source_status, 'down', 'a later attempt does not bring the expired sample back'); assert.equal(c.last_attempt.consecutive, 5);
  void runMs;
});
await t('8. recovery: the next eligible sample replaces both files and the attempt note is gone', async () => {
  const { E } = await seeded(); await post(E, down(now() - 30e3, 'websocket error before connection')); assert.ok(E.json(CELLS).last_attempt);
  advance(30 * 60e3); const N = sample(now() - 61e3, 3100); const r = await post(E, N); assert.equal(r.j.published, undefined);
  const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at); assert.equal(c.last_attempt, undefined); assert.equal(E.json(REC).records.length, 3100); await paired(E, '8');
});
await t('9. order against last_attempt: an older failure arriving late does not replace a later one', async () => {
  const { E } = await seeded(); const f2 = now() - 30e3, f1 = now() - 10 * 60e3;
  await post(E, down(f2, 'websocket error after connection')); const before = E.raw(CELLS);
  const r = await post(E, down(f1, 'connect timeout (15 s)')); assert.equal(r.j.published, 'left: not later than what is published');
  assert.equal(E.raw(CELLS), before, 'the counts file is untouched'); assert.equal(E.json(CELLS).last_attempt.run, iso(f2)); assert.equal(E.json(CELLS).last_attempt.reason, 'websocket error after connection');
  { const row = E.sruns().pop(); assert.equal(row.status, 'down'); assert.equal(row.note, 'ingested down: connect timeout (15 s) [publication left: not later than what is published]', 'the late failure is still logged, with its own note first and what publication did after it'); }
  const o = await post(E, sample(f1 - 60e3, 500, { status: 'degraded', overlong: true, elapsedS: 200 })); assert.match(o.j.published, /not published: overlong sample; left: not later/); assert.equal(E.raw(CELLS), before);
});
await t('10. a delayed eligible sample newer than the retained one but older than a recorded failure: it becomes the retained sample and the later failure is kept', async () => {
  const { E, S } = await seeded({ agoMin: 61 }); const f2 = now() - 30e3; await post(E, down(f2, 'websocket error before connection')); await post(E, down(f2 + 10e3, 'websocket error before connection'));
  assert.equal(E.json(CELLS).last_attempt.consecutive, 2);
  const D = sample(now() - 31 * 60e3, 2900); const r = await post(E, D); assert.equal(r.j.published, undefined, 'published as latest');
  const c = E.json(CELLS); assert.equal(c.retrieved_at, D.retrieved_at); assert.ok(sameSample(c, D)); assert.equal(E.json(REC).records.length, 2900);
  assert.ok(c.last_attempt, 'the later failure is not erased'); assert.equal(c.last_attempt.run, iso(f2 + 10e3)); assert.equal(c.last_attempt.consecutive, 1); await paired(E, '10');
  const N = sample(now() - 5e3, 3000); await post(E, N); assert.equal(E.json(CELLS).last_attempt, undefined, 'a sample later than the failure removes the note'); void S;
});
await t('11. an eligible sample older than the published one is archived only', async () => {
  const { E, S } = await seeded(); const cells0 = E.raw(CELLS), rec0 = E.etag(REC);
  const r = await post(E, sample(Date.parse(S.scheduled_for) - 30 * 60e3, 1234)); assert.match(r.j.published, /^archive only \(older than latest\)$/);
  assert.equal(E.raw(CELLS), cells0); assert.equal(E.etag(REC), rec0); assert.match(E.sruns().pop().note, /^ingested \(archive only: older than latest /);
  assert.ok(E.keys('snapshots/ships/').map(k => E.json(k)).some(x => x.records.length === 1234), 'it is in the archive');
});
await t('12. /place: an attempt beside a retained sample is listed with it; once the sample is three hours old the section is withheld', async () => {
  const { E, S } = await seeded({ agoMin: 1 }); await post(E, down(now() - 5e3, 'websocket error before connection'));
  let p = await placeShips(E); assert.equal(p.state, 'ok'); assert.equal(p.records_total, 1); assert.ok(p.last_attempt);
  NOW += (Date.parse(S.retrieved_at) + 3 * 3600e3 + 5000) - now(); p = await placeShips(E); assert.equal(p.state, 'withheld'); assert.match(p.why, /latest sample was not usable and the last usable sample is over 3 h old/); assert.equal(p.records, undefined);
});
await t('13. fallback scheduling: failures do not make the old sample look new; the fallback fires on the sample\'s real age, and its own failure is a fixed phrase', async () => {
  const { E, S } = await seeded({ agoMin: 11 }); await post(E, down(now() - 5e3, 'websocket error before connection'));
  conns = 0; wsMode = '522'; let r = await fallback(E); assert.match(r.result, /not needed \(latest sample 1\d min old/); assert.equal(conns, 0);
  advance(35 * 60e3); await post(E, down(now() - 5e3, 'websocket error before connection'));   // a failure seconds ago; the sample is now about 45 min old
  r = await fallback(E); assert.match(r.result, /ships-fallback:down/); assert.equal(conns, 1, 'the fallback connected: the retained sample is over 40 min old, whatever the attempts say');
  const c = E.json(CELLS); assert.ok(sameSample(c, S)); assert.equal(c.last_attempt.reason, 'cloud fallback failed'); assert.equal(c.last_attempt.consecutive, 3); assert.equal(c.last_attempt.collected_by, 'cloud hub (fallback)');
  assert.ok(!(await get(E, '/cells/ships')).text.includes('522'), 'the raw fallback error is not public'); assert.match(E.sruns().pop().note, /cloud fallback: .*522/);
  assert.equal(E.json(REC).retrieved_at, S.retrieved_at); wsMode = 'ok';
});

// ---------- forced interleavings (hooks run inside the first writer's put, before it takes effect)
await t('14. a failure loses its counts write to a newer eligible sample: it re-reads and attaches nothing obsolete', async () => {
  const { E } = await seeded(); const fRun = now() - 90e3, N = sample(now() - 61e3, 3050);
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; await post(E, N); };
  const r = await post(E, down(fRun, 'websocket error before connection')); assert.equal(r.j.published, 'left: not later than what is published');
  const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at); assert.equal(c.last_attempt, undefined, 'no warning about a failure older than the sample shown'); await paired(E, '14');
});
await t('15. a failure loses its counts write to an OLDER-run sample published meanwhile: it re-reads and is recorded on that sample', async () => {
  const { E } = await seeded({ agoMin: 61 }); const fRun = now() - 20e3, N = sample(now() - 31 * 60e3, 3050);
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; await post(E, N); };
  const r = await post(E, down(fRun, 'websocket error before connection')); assert.equal(r.j.published, 'failure recorded; last sample kept');
  const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at); assert.equal(c.last_attempt.run, iso(fRun)); assert.equal(E.json(REC).retrieved_at, N.retrieved_at); await paired(E, '15');
});
await t('16. a later failure lands BETWEEN an eligible sample\'s records write and its counts write: one coherent result, the failure kept', async () => {
  const { E } = await seeded({ agoMin: 61 }); const N = sample(now() - 61e3, 3050), fRun = now() - 5e3; let mid = null;
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; mid = { rec: E.json(REC).retrieved_at, cells: E.json(CELLS).retrieved_at, place: (await placeShips(E)).state }; await post(E, down(fRun, 'websocket error before connection')); };
  const r = await post(E, N); assert.equal(r.j.published, undefined);
  assert.ok(mid && mid.rec === N.retrieved_at && mid.cells !== N.retrieved_at, 'the hook ran between the two writes'); assert.equal(mid.place, 'withheld', 'between the writes /place withholds records');
  const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at); assert.equal(E.json(REC).retrieved_at, N.retrieved_at); assert.equal(c.last_attempt.run, iso(fRun)); await paired(E, '16');
});
await t('17. an OLDER failure lands between the two writes: it completes the sample\'s counts and attaches nothing', async () => {
  const { E } = await seeded({ agoMin: 61 }); const N = sample(now() - 61e3, 3050), fRun = now() - 20 * 60e3;
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; const r = await post(E, down(fRun, 'websocket error before connection')); assert.equal(r.j.published, 'left: not later than what is published'); };
  await post(E, N); const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at); assert.equal(c.last_attempt, undefined); await paired(E, '17');
});
await t('18. a newer eligible sample is published while an older one is between its two writes: the newer one stands in both files', async () => {
  const { E } = await seeded({ agoMin: 91 }); const Old = sample(now() - 61 * 60e3, 2000), New = sample(now() - 61e3, 3050);
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; await post(E, New); };
  const r = await post(E, Old); assert.match(r.j.published, /^archive only/);
  assert.equal(E.json(CELLS).retrieved_at, New.retrieved_at); assert.equal(E.json(REC).retrieved_at, New.retrieved_at); assert.equal(E.json(REC).records.length, 3050); await paired(E, '18');
});
await t('19. a newer eligible sample is published just before an older one\'s records write: the older one is refused and archived only', async () => {
  const { E } = await seeded({ agoMin: 91 }); const Old = sample(now() - 61 * 60e3, 2000), New = sample(now() - 61e3, 3050);
  E.hooks.beforePut = async (k, o) => { if (k !== REC || !o.onlyIf) return; E.hooks.beforePut = null; await post(E, New); };
  const r = await post(E, Old); assert.match(r.j.published, /^archive only/); assert.equal(E.json(REC).records.length, 3050); assert.equal(E.json(CELLS).retrieved_at, New.retrieved_at); await paired(E, '19');
});
await t('20. a writer interrupted between its two writes: readers withhold records; the next failure repairs the pair and is recorded on it', async () => {
  const { E, S } = await seeded({ agoMin: 61 }); const N = sample(now() - 61e3, 3050);
  E.fail.put = (k, o) => k === CELLS && !!o.onlyIf; const r = await post(E, N); E.fail.put = null;
  assert.equal(r.status, 200); assert.equal(r.j.published, 'publish_error'); assert.equal(E.json(REC).retrieved_at, N.retrieved_at); assert.equal(E.json(CELLS).retrieved_at, S.retrieved_at, 'counts are still the old sample');
  let p = await placeShips(E); assert.equal(p.state, 'withheld'); assert.match(p.why, /not from the same collector run/); assert.equal(p.records, undefined); await paired(E, '20a');
  const fRun = now() - 5e3; const f = await post(E, down(fRun, 'websocket error before connection')); assert.equal(f.j.published, 'failure recorded; last sample kept');
  const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at, 'the interrupted sample\'s counts were completed'); assert.equal(c.last_attempt.run, iso(fRun)); p = await placeShips(E); assert.equal(p.state, 'ok'); await paired(E, '20b');
});
await t('21. …and the next eligible sample repairs it too (by replacing both files)', async () => {
  const { E } = await seeded({ agoMin: 61 }); const N = sample(now() - 31 * 60e3, 3050), N2 = sample(now() - 61e3, 3060);
  E.fail.put = (k, o) => k === CELLS && !!o.onlyIf; await post(E, N); E.fail.put = null; assert.equal((await placeShips(E)).state, 'withheld');
  await post(E, N2); assert.equal(E.json(CELLS).retrieved_at, N2.retrieved_at); assert.equal(E.json(REC).retrieved_at, N2.retrieved_at); assert.equal((await placeShips(E)).state, 'ok'); await paired(E, '21');
});
await t('22. retry exhausted (counts change twice under a failure): it stops, changes nothing more, and the run is still logged', async () => {
  const { E } = await seeded({ agoMin: 61 }); let n = 0;
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf || n >= 2) return; n++; const keep = E.hooks.beforePut; E.hooks.beforePut = null; await post(E, sample(now() - (50 - n * 10) * 60e3, 3000 + n)); E.hooks.beforePut = keep; };
  const fRun = now() - 5e3; const r = await post(E, down(fRun, 'websocket error before connection')); E.hooks.beforePut = null;
  assert.equal(r.j.published, 'left: publish_conflict'); const c = E.json(CELLS); assert.equal(c.last_attempt, undefined); assert.equal(E.json(REC).retrieved_at, c.retrieved_at, 'the files left behind are a pair'); assert.equal(E.json(REC).records.length, 3002);
  { const rows = E.sruns().filter(x => x.started_at === iso(fRun)); assert.equal(rows.length, 1, 'one collector_runs row for the failure'); assert.equal(rows[0].status, 'down', 'its true status');
    assert.equal(rows[0].note, 'ingested down: websocket error before connection [publication left: publish_conflict]', 'the diagnostic note is kept and the conflict is on the row (GPT hold 2)'); } await paired(E, '22');
});
await t('23. retry exhausted for an eligible sample (counts change twice after its records write): readers withhold; the next write repairs', async () => {
  const { E, S } = await seeded({ agoMin: 61 }); const N = sample(now() - 61e3, 3050); let n = 0;
  // two older failures, each recorded on the retained sample between this writer's read and write of the counts
  E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf || n >= 2) return; n++; const keep = E.hooks.beforePut; E.hooks.beforePut = null; const c = E.json(CELLS); c.touched = n; E.m.set(CELLS, { b: enc.encode(JSON.stringify(c)), etag: 'x' + n + real(), up: now(), meta: {} }); E.hooks.beforePut = keep; };
  const r = await post(E, N); E.hooks.beforePut = null; assert.match(r.j.published, /^publish_conflict \(records written, counts contended/);
  assert.equal(E.json(REC).retrieved_at, N.retrieved_at); assert.equal(E.json(CELLS).retrieved_at, S.retrieved_at); assert.equal((await placeShips(E)).state, 'withheld'); await paired(E, '23a');
  assert.match(E.sruns().pop().note, /^ingested \(publish_conflict\) from /);
  await post(E, down(now() - 2e3, 'websocket error before connection')); assert.equal(E.json(CELLS).retrieved_at, N.retrieved_at); assert.equal((await placeShips(E)).state, 'ok'); await paired(E, '23b');
});
await t('24. two writers at once, both orders: fallback failure and Mac failure; the later run is the note that stands', async () => {
  for (const order of ['mac-first', 'fallback-first']) { const { E } = await seeded({ agoMin: 51 }); wsMode = '522';
    const macRun = now() - 3e3; const a = () => post(E, down(macRun, 'websocket error before connection')), b = () => fallback(E);
    E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf) return; E.hooks.beforePut = null; await (order === 'mac-first' ? b() : a()); };
    await (order === 'mac-first' ? a() : b()); wsMode = 'ok';
    const c = E.json(CELLS), runs = E.sruns().filter(x => x.status === 'down'); assert.equal(runs.length, 2, order + ': both failures are logged'); assert.ok(c.last_attempt, order);
    const later = runs.map(x => x.started_at).sort().pop(); assert.equal(c.last_attempt.run, later, order + ': the later run\'s note stands'); assert.equal(c.retrieved_at, E.json(REC).retrieved_at); await paired(E, '24 ' + order); }
});

// ---------- GPT's hold on 5789f08 (18 Nov): repair before archiving an older eligible upload; conflicts on the collector_runs row
const touchTwice = (E, max = 2) => { let n = 0; E.hooks.beforePut = async (k, o) => { if (k !== CELLS || !o.onlyIf || n >= max) return; n++; const keep = E.hooks.beforePut; E.hooks.beforePut = null; const c = E.json(CELLS); c.touched = n; E.m.set(CELLS, { b: enc.encode(JSON.stringify(c)), etag: 'x' + n + real(), up: now(), meta: {} }); E.hooks.beforePut = keep; }; return () => n; };
const interrupt = async (E, N) => { E.fail.put = (k, o) => k === CELLS && !!o.onlyIf; const r = await post(E, N); E.fail.put = null; assert.equal(r.j.published, 'publish_error'); };
await t('27. an older eligible upload (S < E < N) arriving after N was interrupted: N\'s counts are completed BEFORE E is archived', async () => {
  const { E, S } = await seeded({ agoMin: 91 }); const N = sample(now() - 61e3, 3050), Em = sample(now() - 45 * 60e3, 2000);
  await interrupt(E, N); assert.equal(E.json(REC).retrieved_at, N.retrieved_at); assert.equal(E.json(CELLS).retrieved_at, S.retrieved_at); assert.equal((await placeShips(E)).state, 'withheld');
  const r = await post(E, Em); assert.equal(r.status, 200); assert.match(r.j.published, /^archive only/); assert.equal(r.j.counts_repair, 'repaired');
  const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at, 'counts now name N'); assert.equal(c.scheduled_for, N.scheduled_for); assert.equal(c.records, undefined); assert.equal(c.last_attempt, undefined);
  assert.deepEqual(c.cells, N.cells); assert.equal(E.json(REC).retrieved_at, N.retrieved_at, 'records are still N'); assert.equal(E.json(REC).records.length, 3050);
  const p = await placeShips(E); assert.equal(p.state, 'ok', '/place lists records again'); await paired(E, '27');
  const row = E.sruns().pop(); assert.equal(row.status, 'ok'); assert.equal(row.records, 2000); assert.match(row.note, /^ingested \(archive only: older than latest .*; counts repair: repaired\) from /);
  assert.ok(E.keys('snapshots/ships/').some(k => E.json(k).retrieved_at === Em.retrieved_at), 'E is in the archive');
});
await t('28. …and a LATER last_attempt already on the counts is preserved by that repair (consecutive 1)', async () => {
  const { E, S } = await seeded({ agoMin: 91 }); const fRun = now() - 5e3; await post(E, down(fRun, 'connect timeout (15 s)'));   // S + L(F)
  const N = sample(now() - 31 * 60e3, 3050), Em = sample(now() - 61 * 60e3, 2000);                                             // N is a delayed sample: S < E < N < F
  await interrupt(E, N); assert.equal(E.json(CELLS).retrieved_at, S.retrieved_at); assert.equal(E.json(CELLS).last_attempt.run, iso(fRun));
  const r = await post(E, Em); assert.match(r.j.published, /^archive only/); assert.equal(r.j.counts_repair, 'repaired');
  const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at); assert.ok(c.last_attempt, 'the later failure is still stated'); assert.equal(c.last_attempt.run, iso(fRun)); assert.equal(c.last_attempt.reason, 'connect timeout (15 s)'); assert.equal(c.last_attempt.consecutive, 1);
  assert.equal((await placeShips(E)).state, 'ok'); await paired(E, '28');
});
await t('29. …an attempt note OLDER than the repaired sample is not carried onto it', async () => {
  const { E } = await seeded({ agoMin: 91 }); const f0 = now() - 70 * 60e3; await post(E, down(f0, 'connect timeout (15 s)'));
  const N = sample(now() - 61e3, 3050), Em = sample(now() - 80 * 60e3, 2000); await interrupt(E, N);
  const r = await post(E, Em); assert.equal(r.j.counts_repair, 'repaired'); const c = E.json(CELLS); assert.equal(c.retrieved_at, N.retrieved_at); assert.equal(c.last_attempt, undefined); await paired(E, '29');
});
await t('30. a conflict during that repair: the counts change once under it, it reads again and completes', async () => {
  const { E } = await seeded({ agoMin: 91 }); const N = sample(now() - 61e3, 3050), Em = sample(now() - 45 * 60e3, 2000); await interrupt(E, N);
  const n = touchTwice(E, 1); const r = await post(E, Em); E.hooks.beforePut = null; assert.equal(n(), 1); assert.match(r.j.published, /^archive only/); assert.equal(r.j.counts_repair, 'repaired');
  assert.equal(E.json(CELLS).retrieved_at, N.retrieved_at); assert.equal((await placeShips(E)).state, 'ok'); await paired(E, '30');
});
await t('31. …the counts change twice under the repair: it stops, nothing is overwritten, the conflict is answered and logged, readers still withhold; the next write repairs', async () => {
  const { E, S } = await seeded({ agoMin: 91 }); const N = sample(now() - 61e3, 3050), Em = sample(now() - 45 * 60e3, 2000); await interrupt(E, N);
  const n = touchTwice(E, 2); const r = await post(E, Em); E.hooks.beforePut = null; assert.equal(n(), 2); assert.equal(r.status, 200); assert.match(r.j.published, /^archive only/); assert.equal(r.j.counts_repair, 'publish_conflict');
  const c = E.json(CELLS); assert.equal(c.retrieved_at, S.retrieved_at); assert.equal(c.touched, 2, 'the other writer\'s change stands'); assert.equal(E.json(REC).retrieved_at, N.retrieved_at); assert.equal((await placeShips(E)).state, 'withheld'); await paired(E, '31a');
  const row = E.sruns().pop(); assert.equal(row.status, 'ok'); assert.match(row.note, /^ingested \(archive only: older than latest .*; counts repair: publish_conflict\) from /);
  const E2 = sample(now() - 40 * 60e3, 2100); const r2 = await post(E, E2); assert.equal(r2.j.counts_repair, 'repaired'); assert.equal(E.json(CELLS).retrieved_at, N.retrieved_at); assert.equal((await placeShips(E)).state, 'ok'); await paired(E, '31b');
});
await t('32. a repair made by a failure is on that failure\'s collector_runs row; a failure whose repair conflicts says so', async () => {
  { const { E } = await seeded({ agoMin: 61 }); const N = sample(now() - 61e3, 3050); await interrupt(E, N); const fRun = now() - 5e3; const f = await post(E, down(fRun, 'websocket error before connection'));
    assert.equal(f.j.published, 'failure recorded; last sample kept'); const row = E.sruns().pop(); assert.equal(row.status, 'down'); assert.equal(row.note, 'ingested down: websocket error before connection [counts repair: repaired]'); await paired(E, '32a'); }
  { const { E } = await seeded({ agoMin: 61 }); const N = sample(now() - 61e3, 3050); await interrupt(E, N); const n = touchTwice(E, 4); const fRun = now() - 5e3; const f = await post(E, down(fRun, 'websocket error before connection')); E.hooks.beforePut = null;
    assert.equal(n(), 4); assert.equal(f.j.published, 'left: publish_conflict'); const row = E.sruns().pop(); assert.equal(row.status, 'down');
    assert.equal(row.note, 'ingested down: websocket error before connection [publication left: publish_conflict] [counts repair: publish_conflict]'); assert.equal((await placeShips(E)).state, 'withheld'); await paired(E, '32b'); }
});
await t('33. exhausted conflicts are on the collector_runs row with the true status and note: Mac overlong sample; fallback failure', async () => {
  { const { E, S } = await seeded({ agoMin: 61 }); const n = touchTwice(E, 2); const oRun = now() - 400e3; const r = await post(E, sample(oRun, 700, { status: 'degraded', overlong: true, elapsedS: 381.5 })); E.hooks.beforePut = null;
    assert.equal(n(), 2); assert.equal(r.j.published, 'not published: overlong sample; left: publish_conflict'); const c = E.json(CELLS); assert.equal(c.retrieved_at, S.retrieved_at); assert.equal(c.last_attempt, undefined);
    const rows = E.sruns().filter(x => x.started_at === iso(oRun)); assert.equal(rows.length, 1); assert.equal(rows[0].status, 'degraded'); assert.equal(rows[0].records, 700);
    assert.match(rows[0].note, /^ingested \(not published: overlong sample\) from mother-earth-mac-0\.3\.5 vmac-0\.3\.5 \[publication left: publish_conflict\]$/); await paired(E, '33 mac overlong'); }
  { const { E, S } = await seeded({ agoMin: 51 }); wsMode = '522'; const n = touchTwice(E, 2); const r = await fallback(E); E.hooks.beforePut = null; wsMode = 'ok';
    assert.equal(n(), 2); assert.equal(r.result, 'ships-fallback:down'); const c = E.json(CELLS); assert.equal(c.retrieved_at, S.retrieved_at); assert.equal(c.last_attempt, undefined);
    const row = E.sruns().pop(); assert.equal(row.status, 'down'); assert.match(row.note, /^cloud fallback: .*522.* \[publication left: publish_conflict\]$/); await paired(E, '33 fallback failure'); }
});

// ---------- the fallback's own samples (each listens for the real 60 s)
if (process.env.FAST === '1') { console.log(`\nships-retain-hub${BREAK ? ' [BREAK=' + BREAK + ']' : ''} (FAST: the three 60 s fallback-sample cases not run): ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0); }
await t('25. the fallback publishes an eligible sample by the same rule: after a Mac failure it replaces the old sample and the note goes', async () => {
  const { E } = await seeded({ agoMin: 51 }); await post(E, down(now() - 5e3, 'websocket error before connection')); conns = 0; wsMode = 'ok';
  const r = await fallback(E); assert.match(r.result, /^ships-fallback:(ok|degraded) \(25 vessels\)$/); assert.equal(conns, 1);
  const c = E.json(CELLS), rec = E.json(REC); assert.match(rec.collected_by, /cloud hub/); assert.equal(rec.records.length, 25); assert.equal(c.retrieved_at, rec.retrieved_at); assert.equal(c.last_attempt, undefined);
  assert.deepEqual(Object.keys(E.meta(REC)).sort(), ['eligible', 'retrieved_at', 'run']); assert.ok(!JSON.stringify([...E.m.values()].map(v => dec.decode(v.b))).includes('AIS-SECRET'), 'the key is never stored'); await paired(E, '25');
});
await t('26. an overlong fallback sample is not published either: the retained sample stays and the attempt is recorded', async () => {
  const { E, S } = await seeded({ agoMin: 51 }); conns = 0; wsMode = 'ok'; onDuring = async () => { advance(40e3); };   // the clock jumps 40 s mid-listen: elapsed passes 75 s
  const r = await fallback(E); onDuring = null; assert.match(r.result, /^ships-fallback:degraded \(\d+ vessels, not published: overlong\)$/);
  const c = E.json(CELLS); assert.ok(sameSample(c, S)); assert.equal(E.json(REC).retrieved_at, S.retrieved_at); assert.equal(c.last_attempt.reason, 'sample_overlong'); assert.ok(c.last_attempt.elapsed_s > 75); assert.equal(c.last_attempt.window_s, 60); assert.match(c.last_attempt.collected_by, /cloud hub/);
  assert.match(E.sruns().pop().note, /cloud fallback \(not published: overlong sample\)/); await paired(E, '26');
});

await t('34. an overlong fallback sample whose counts write is contended twice: the conflict is on its collector_runs row with its own status', async () => {
  const { E, S } = await seeded({ agoMin: 51 }); conns = 0; wsMode = 'ok'; onDuring = async () => { advance(40e3); }; const n = touchTwice(E, 2);
  const r = await fallback(E); onDuring = null; E.hooks.beforePut = null; assert.equal(n(), 2); assert.match(r.result, /not published: overlong/);
  const c = E.json(CELLS); assert.equal(c.retrieved_at, S.retrieved_at); assert.equal(c.last_attempt, undefined);
  const row = E.sruns().pop(); assert.equal(row.status, 'degraded'); assert.ok(row.records > 0); assert.match(row.note, /^cloud fallback \(not published: overlong sample\) .* \[publication left: publish_conflict\]$/); await paired(E, '34');
});

console.log(`\nships-retain-hub${BREAK ? ' [BREAK=' + BREAK + ']' : ''}: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
