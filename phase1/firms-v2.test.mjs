// FIRMS v2 (collector 0.6.0, design rev 6) — tests THROUGH THE REAL WORKER (phase1/worker.js), not the design model.
// D1 = a REAL SQLite database (node:sqlite, foreign keys ON like D1) loaded with phase1/schema.sql; batches are transactions.
// R2 = an in-memory stub with R2's documented semantics: conditional put (etagMatches / etagDoesNotMatch "*" → null), streams of
// known length only, multipart (non-last parts equal and ≥ 5 MiB), abort, range reads, head/list metadata. Clock controlled.
// The reference-model cases of docs/design-checks/firms-publish.check.mjs (P1–P20) and firms-state.check.mjs (C…) are ported
// here against the worker's own functions and its scheduled job; every case asserts the outputs, not just survival.
// Real data: the 5 Nov 2026 FIRMS files (5,311,642 B and 3,833,218 B) if present at $FIRMS_REAL_DIR; their cases are skipped
// (and reported as skipped) otherwise.
// Usage: node --no-warnings phase1/firms-v2.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
const W = await import(process.env.WORKER || './worker.js'), worker = W.default;   // WORKER = a deliberately broken copy (firms-v2-breaks.mjs)

let passed = 0, failed = 0, skipped = 0;
const t = async (n, fn) => { try { await fn(); passed++; console.log('ok -', n); } catch (e) { if (e && e.skip) { skipped++; console.log('SKIP -', n, '—', e.skip); return; } failed++; console.log('FAIL -', n, '\n   ', String(e && e.stack || e).split('\n').slice(0, 5).join('\n    ')); } };
const skip = why => { const e = new Error('skip'); e.skip = why; throw e; };
const enc = new TextEncoder(), dec = new TextDecoder();
const PART = 5 * 1024 * 1024;

// ---------- clock (covers `new Date()` too)
let NOW = Date.parse('2026-11-07T09:45:40Z');
{ const R = Date; globalThis.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(NOW); } static now() { return NOW; } }; }
const iso = ms => new Date(ms).toISOString();

// ---------- D1 over SQLite (FK on; batch = one transaction; failure injection on the n-th matching statement)
function makeD1() {
  const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys = ON;'); db.exec(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const fail = { re: null, nth: 1, seen: 0 };
  const exec = (sql, args) => {
    if (fail.re && fail.re.test(sql) && ++fail.seen === fail.nth) { fail.re = null; fail.seen = 0; throw new Error('D1 stub: forced failure'); }
    if (/^\s*SELECT/i.test(sql)) { const rows = db.prepare(sql).all(...args); return { results: rows, meta: { changes: 0 } }; }
    const r = db.prepare(sql).run(...args); return { results: [], meta: { changes: Number(r.changes) } };
  };
  const prep = sql => { const mk = args => ({ sql, args,
    async run() { return exec(sql, args); }, async all() { return exec(sql, args); }, async first() { const r = exec(sql, args); return r.results[0] ?? null; } });
    return { bind: (...a) => mk(a.map(v => v === undefined ? null : v)), ...mk([]) }; };
  const D1 = { prepare: prep, async batch(stmts) { db.exec('BEGIN'); try { const out = stmts.map(s => exec(s.sql, s.args)); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } } };
  return { db, D1, d1fail: fail };
}
// ---------- R2 stub
function makeR2() {
  const m = new Map(), log = [], fail = { put: null }, hooks = { beforePut: null, beforeHead: null }; let seq = 0; const stats = { mpuCompleted: [], mpuAborted: 0, mpuOpen: 0, gets: [] };
  const known = s => { s.__knownLength = true; return s; };
  const bytesOf = async v => {
    if (v === undefined || v === null) return new Uint8Array(0);
    if (typeof v === 'string') return enc.encode(v);
    if (v instanceof Uint8Array) return new Uint8Array(v);
    if (v instanceof ArrayBuffer) return new Uint8Array(v.slice(0));
    if (v && typeof v.getReader === 'function') { if (!v.__knownLength) throw new TypeError('R2 stub: a ReadableStream without a known length is refused (as on Workers)'); return new Uint8Array(await new Response(v).arrayBuffer()); }
    throw new TypeError('R2 stub: unsupported body');
  };
  const obj = (k, v, body) => ({ key: k, size: v.bytes.length, etag: v.etag, httpEtag: '"' + v.etag + '"', uploaded: new Date(v.uploaded), customMetadata: { ...(v.customMetadata || {}) }, httpMetadata: v.httpMetadata || {}, ...(body ? body : {}) });
  const R2 = {
    async put(k, value, o = {}) {
      if (hooks.beforePut) { const h = hooks.beforePut; hooks.beforePut = null; await h(k); }
      if (fail.put && fail.put(k)) { fail.put = null; throw new Error('R2 stub: forced put failure ' + k); }
      const cur = m.get(k), c = o.onlyIf;
      if (c && c.etagDoesNotMatch === '*' && cur) return null;
      if (c && c.etagMatches && (!cur || cur.etag !== c.etagMatches)) return null;
      const v = { bytes: await bytesOf(value), etag: 'e' + (++seq), uploaded: NOW, customMetadata: o.customMetadata, httpMetadata: o.httpMetadata };
      m.set(k, v); log.push({ op: 'put', key: k, meta: { ...(o.customMetadata || {}) } }); return obj(k, v);
    },
    async head(k) { if (hooks.beforeHead) { const h = hooks.beforeHead; hooks.beforeHead = null; await h(k); } const v = m.get(k); return v ? obj(k, v) : null; },
    async get(k, o = {}) { stats.gets.push(k); const v = m.get(k); if (!v) return null;
      let b = v.bytes; if (o.range) b = b.subarray(o.range.offset || 0, (o.range.offset || 0) + (o.range.length ?? b.length));
      const body = known(new Blob([b]).stream());
      return obj(k, v, { body, async text() { return dec.decode(b); }, async json() { return JSON.parse(dec.decode(b)); }, async arrayBuffer() { return b.slice().buffer; } }); },
    async delete(k) { m.delete(k); },
    async list({ prefix, include } = {}) { return { objects: [...m.keys()].filter(k => !prefix || k.startsWith(prefix)).sort().map(k => { const v = m.get(k); return { key: k, size: v.bytes.length, uploaded: new Date(v.uploaded), ...(include && include.includes('customMetadata') ? { customMetadata: { ...(v.customMetadata || {}) } } : {}) }; }), truncated: false }; },
    async createMultipartUpload(k, o = {}) { stats.mpuOpen++; const parts = new Map(); let done = false;
      return { key: k,
        async uploadPart(n, data) { if (done) throw new Error('upload finished'); if (fail.put && fail.put(k + '#part')) { fail.put = null; throw new Error('R2 stub: forced part failure ' + k); } const b = await bytesOf(data); parts.set(n, b); return { partNumber: n, etag: 'p' + n }; },
        async complete(list) { if (fail.put && fail.put(k + '#complete')) { fail.put = null; throw new Error('R2 stub: forced complete failure ' + k); } const ps = list.map(p => parts.get(p.partNumber)); const first = ps[0].length;
          ps.forEach((b, i) => { if (i < ps.length - 1 && (b.length < PART || b.length !== first)) throw new Error(`R2 stub: part ${i + 1} is ${b.length} bytes; non-last parts must be equal and ≥ 5 MiB`); });
          const all = new Uint8Array(ps.reduce((a, b) => a + b.length, 0)); let off = 0; for (const b of ps) { all.set(b, off); off += b.length; }
          const v = { bytes: all, etag: 'e' + (++seq), uploaded: NOW, customMetadata: o.customMetadata, httpMetadata: o.httpMetadata }; m.set(k, v); done = true; stats.mpuOpen--;
          stats.mpuCompleted.push({ key: k, parts: ps.length }); log.push({ op: 'mpu', key: k, meta: { ...(o.customMetadata || {}) } }); return obj(k, v); },
        async abort() { done = true; stats.mpuOpen--; stats.mpuAborted++; } };
    },
  };
  return { R2, m, log, fail, hooks, stats };
}
function makeEnv(extra = {}) {
  const d = makeD1(), r = makeR2();
  return { env: { R2: r.R2, DB: d.D1, ADMIN_KEY: 'k', FIRMS_MAP_KEY: 'MAPKEY0123456789abcdef', HISTORY_ENABLED: '1', FIRMS_PIPELINE: 'v2', FIRMS_CREATE_ONLY: 'verified', ...extra }, ...d, ...r };
}
const q = (db, sql, ...a) => db.prepare(sql).all(...a).map(r => ({ ...r }));
const one = (db, sql, ...a) => { const r = db.prepare(sql).get(...a); return r ? { ...r } : r; };
const jsonOf = (E, k) => JSON.parse(dec.decode(E.m.get(k).bytes));
const LATEST = 'latest/firms.json', CELLS = 'latest-cells/firms.json';

// ---------- FIRMS source stub (real 14-column header)
const HEAD = 'latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight\n';
const row = (lat, lng, time = '1300', frp = '3.34', dn = 'D', day = '2026-11-07') => `${lat},${lng},316.31,0.61,0.71,${day},${time},N20,VIIRS,n,2.0NRT,284.7,${frp},${dn}`;
const csv = rows => HEAD + rows.join('\n') + '\n';
let FIRMS = { status: 200, body: csv([row(-20, 30)]) };
globalThis.fetch = async (url, init = {}) => { url = String(url);
  if (url.includes('firms.modaps')) { if (FIRMS.throw) throw new Error('network reset');
    if (FIRMS.stall) return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(HEAD)); if (init.signal) init.signal.addEventListener('abort', () => c.error(init.signal.reason)); }, pull() { return new Promise(() => {}); } }), { status: 200 });   // headers, then nothing; the signal aborts the body as fetch does
    const h = {}; if (FIRMS.contentLength != null) h['content-length'] = String(FIRMS.contentLength);
    return new Response(FIRMS.body, { status: FIRMS.status, headers: h }); }
  if (url.includes('earthquake.usgs.gov')) return new Response(JSON.stringify({ metadata: { generated: NOW - 60e3 }, features: [] }), { status: 200 });
  return new Response('stub', { status: 503 }); };
const runFirmsAt = async (env, schedIso, endIso) => { NOW = Date.parse(endIso); await worker.scheduled({ cron: '*/15 * * * *', scheduledTime: Date.parse(schedIso) }, env, { waitUntil() {} }); };
const cellsWrites = E => E.log.filter(x => x.key === CELLS).map(x => x.meta.run_id + ':' + x.meta.status);
/** Register an input as the job would (fetch → raw → register), without processing it. */
async function addInput(E, schedIso, endIso, body = csv([row(-20, 30)])) {
  NOW = Date.parse(endIso); FIRMS = { status: 200, body };
  const a = await (async () => { const r = await import('./worker.js'); return r; })();
  const sched = Date.parse(schedIso);
  const res = await fvFetch(E.env, sched); assert.equal(await W.fvRegister(E.env, sched, res), true); return res.runId;
}
// fvFetchToRaw is internal; reach it through the module scope via the job's own pieces: replicate with the exported writer is NOT
// equivalent, so the worker exports it for tests (see export list).
const fvFetch = (env, ms) => W.fvFetchToRaw(env, ms);
const claimRaw = async (E, runId, token) => { const r = await E.env.DB.batch([E.env.DB.prepare(W.FVSQL.CLAIM).bind(runId, token, 'inv-' + token, iso(NOW), iso(NOW + W.FV.leaseMs)), E.env.DB.prepare(W.FVSQL.CLAIM_COUNT).bind(runId, token)]); return r[0].meta.changes; };

// =====================================================================================================================
// 0. SQL is the authoritative design SQL
await t('S0. every statement the worker runs equals docs/design-checks/firms-state.sql.mjs (whitespace-normalised; INPUT has real bindings)', async () => {
  const D = await import('../docs/design-checks/firms-state.sql.mjs'); const n = s => s.replace(/\s+/g, ' ').trim();
  for (const k of Object.keys(W.FVSQL)) { if (k === 'INPUT') continue; assert.ok(D[k], 'design has ' + k); assert.equal(n(W.FVSQL[k]), n(D[k]), k); }
  assert.match(n(W.FVSQL.INPUT), /^INSERT INTO firms_inputs \(run_id, raw_key, scheduled_at, retrieved_at, bytes, sha256, content_length, created_at, collector_version\) VALUES \(\?1, \?2, \?3, \?4, \?5, \?6, \?7, \?8, \?9\)$/);
  const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  for (const tb of ['firms_settings', 'firms_identity', 'firms_inputs', 'firms_attempts', 'firms_outputs']) assert.match(schema, new RegExp('CREATE TABLE IF NOT EXISTS ' + tb + ' '));
  const norm = s => n(s.replace(/IF NOT EXISTS /g, '').replace(/--[^\n]*\n/g, '\n'));
  for (const stmt of D.SCHEMA.replace(/--[^\n]*\n/g, '\n').split(';').map(norm).filter(Boolean)) assert.ok(norm(schema).includes(stmt), 'schema.sql carries: ' + stmt.slice(0, 60));
});
await t('S1. legacy default: FIRMS_PIPELINE unset → the legacy collector runs, no v2 rows, legacy snapshot keys', async () => {
  const E = makeEnv({ FIRMS_PIPELINE: undefined }); FIRMS = { status: 200, body: csv([row(-20, 30)]) };
  await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_inputs').n, 0); assert.ok(E.m.has('snapshots/firms/2026-11-07T09-45Z.json')); assert.ok(!(E.m.get(LATEST).customMetadata || {}).run_id);
});

// =====================================================================================================================
// 1. Real file — complete, correct outputs, equal to the legacy collector's
const REAL = process.env.FIRMS_REAL_DIR || '/mnt/user-data/uploads/Mother Earth/research/firms-recovery/2026-11-05/in';
const real = f => { const p = REAL + '/' + f; return fs.existsSync(p) ? fs.readFileSync(p) : null; };
const R2345 = real('2026-11-05T23-45Z.csv'), R1530 = real('2026-11-05T15-30Z.csv');
const strip = (e, ...ks) => { const o = { ...e }; for (const k of ['run_id', 'format', 'raw', ...ks]) delete o[k]; return o; };
let pair = null;   // shared by 1a–1d: the same real file through legacy and v2
async function realPair() {
  if (pair) return pair; if (!R2345) skip('real file not present');
  const L = makeEnv({ FIRMS_PIPELINE: undefined }), V = makeEnv();
  for (const E of [L, V]) { FIRMS = { status: 200, body: R2345, contentLength: R2345.length }; await runFirmsAt(E.env, '2026-11-05T23:45:00Z', '2026-11-05T23:45:40Z'); }
  return (pair = { L, V });
}
await t('1a. real 5 Nov 23:45 file (5,311,642 B): v2 latest/firms.json == legacy snapshot (every record, cell, by_hour, header field) apart from raw key, run_id, format', async () => {
  const { L, V } = await realPair(); const lj = jsonOf(L, LATEST), vj = jsonOf(V, LATEST);
  assert.equal(vj.records.length, lj.records.length); assert.ok(vj.records.length > 50000, 'real size: ' + vj.records.length);
  assert.deepEqual(strip(vj), strip(lj)); assert.equal(vj.format, 'lines/1'); assert.ok(/^\d{4}-\d\d-\d\dT\d\d-\d\dZ-\d+-[0-9a-f]{12}$/.test(vj.run_id));
  assert.equal(vj.raw, `raw/firms/${vj.run_id}.csv`);
});
await t('1b. real file: latest-cells == legacy cells envelope (cells + by_hour, needed by aggregateFirms) apart from raw/run_id; files paired by run_id + retrieved_at', async () => {
  const { L, V } = await realPair(); const lc = jsonOf(L, CELLS), vc = jsonOf(V, CELLS), vl = jsonOf(V, LATEST);
  assert.deepEqual(strip(vc), strip(lc)); assert.equal(vc.run_id, vl.run_id); assert.equal(vc.retrieved_at, vl.retrieved_at);
  assert.equal(E_meta(V, LATEST).run_id, vl.run_id); assert.equal(E_meta(V, CELLS).token, one(V.db, 'SELECT token FROM firms_outputs').token);
});
function E_meta(E, k) { return E.m.get(k).customMetadata; }
await t('1c. real file: raw stored byte-identical in 2 multipart parts (5 MiB + rest), sha256 recorded; snapshot lines all ≤ 4 KiB; D1 state complete; run log as legacy', async () => {
  const { L, V } = await realPair(); const out = one(V.db, 'SELECT * FROM firms_outputs'), inp = one(V.db, 'SELECT * FROM firms_inputs');
  assert.deepEqual(Buffer.from(V.m.get(inp.raw_key).bytes), R2345); assert.equal(inp.sha256, crypto.createHash('sha256').update(R2345).digest('hex'));
  assert.equal(inp.bytes, R2345.length); assert.equal(inp.content_length, R2345.length); assert.equal(inp.state, 'done'); assert.equal(inp.attempts_used, 1);
  assert.deepEqual(V.stats.mpuCompleted.find(x => x.key === inp.raw_key), { key: inp.raw_key, parts: 2 });
  const snap = V.m.get(out.snapshot_key).bytes; assert.equal(out.snapshot_bytes, snap.length); assert.equal(out.snapshot_sha256, crypto.createHash('sha256').update(snap).digest('hex'));
  const lines = dec.decode(snap).split('\n'); assert.ok(lines.every(l => l.length <= 4095), 'max line ' + Math.max(...lines.map(l => l.length)));
  assert.deepEqual(Buffer.from(V.m.get(LATEST).bytes), Buffer.from(snap), 'latest/ is a byte copy of the committed snapshot');
  assert.equal(out.publish_state, 'published'); assert.equal(out.records, jsonOf(L, LATEST).records.length); assert.ok(out.latest_at && out.cells_at);
  const lr = one(L.db, "SELECT status, records, note FROM collector_runs WHERE layer='firms'"), vr = one(V.db, "SELECT status, records, note FROM collector_runs WHERE layer='firms'");
  assert.equal(vr.status, 'ok'); assert.equal(vr.records, lr.records); assert.equal(vr.note, lr.note + ' run=' + out.run_id);
  const aux = jsonOf(V, out.aux_key); assert.deepEqual(aux.by_cell, W.firesDaily(jsonOf(L, LATEST)), 'sidecar aggregates == firesDaily(legacy snapshot)');
  assert.equal(V.stats.mpuOpen, 0, 'no multipart upload left open');
});
await t('1d. real file: /place for the 3 busiest cells, 40 other cells and an empty cell == legacy answer (records 8 newest, ties in legacy order, totals)', async () => {
  const { L, V } = await realPair(); const cells = jsonOf(L, CELLS).cells;
  const ids = Object.entries(cells).sort((a, b) => b[1].count - a[1].count).map(x => x[0]); const pick = [...ids.slice(0, 3), ...ids.filter((_, i) => i % 9 === 4).slice(0, 40), '0_0'];
  for (const id of pick) {
    const a = await (await worker.fetch(new Request('http://x/place/g4/' + id), L.env)).json(), b = await (await worker.fetch(new Request('http://x/place/g4/' + id), V.env)).json();
    assert.ok(a.layers && a.layers.firms && ['ok', 'no_records'].includes(a.layers.firms.state), 'legacy answered ' + id); assert.deepEqual(b.layers.firms, a.layers.firms, 'cell ' + id);
  }
  const top = await (await worker.fetch(new Request('http://x/place/g4/' + ids[0]), V.env)).json(); assert.equal(top.layers.firms.records_total, cells[ids[0]].count); assert.equal(top.layers.firms.records.length, 8);
});
await t('1e. real file: next-day checkpoint == legacy (gz content = snapshot bytes; fires_daily rows equal; coverage equal); parsed content equal to legacy checkpoint', async () => {
  const { L, V } = await realPair(); FIRMS = { status: 200, body: HEAD };
  for (const E of [L, V]) await runFirmsAt(E.env, '2026-11-06T00:30:00Z', '2026-11-06T00:30:40Z');
  const gun = async u8 => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const k = 'archive/checkpoints/firms/2026-11-05.json.gz';
  const lt = await gun(L.m.get(k).bytes), vt = await gun(V.m.get(k).bytes);
  const out = one(V.db, "SELECT * FROM firms_outputs WHERE day='2026-11-05'");
  assert.deepEqual(Buffer.from(vt), Buffer.from(V.m.get(out.snapshot_key).bytes), 'v2 checkpoint = committed snapshot, gzip');
  assert.deepEqual(strip(JSON.parse(dec.decode(vt))), strip(JSON.parse(dec.decode(lt))));
  const cols = 'cell_id, day, detections, frp_sum_mw, frp_max_mw, frp_n, day_n, night_n, cutoff, run_ref, collector_version';
  assert.deepEqual(q(V.db, `SELECT ${cols} FROM fires_daily ORDER BY cell_id`), q(L.db, `SELECT ${cols} FROM fires_daily ORDER BY cell_id`));
  assert.ok(q(V.db, 'SELECT 1 FROM fires_daily').length > 400);
  const cc = 'layer, day, cutoff, last_observation_at, input_age_at_day_end_s, failed_runs_after_cutoff, failure_reasons, input_status, assessed_at, assessed_with_checkpoint';
  assert.deepEqual(q(V.db, `SELECT ${cc} FROM archive_checkpoint_coverage`), q(L.db, `SELECT ${cc} FROM archive_checkpoint_coverage`));
  const cpL = one(L.db, 'SELECT records, cutoff, run_ref FROM archive_checkpoints'), cpV = one(V.db, 'SELECT records, cutoff, run_ref, source_key FROM archive_checkpoints');
  assert.equal(cpV.records, cpL.records); assert.equal(cpV.cutoff, cpL.cutoff); assert.equal(cpV.source_key, out.snapshot_key);
  assert.equal(V.m.get(k).customMetadata.format, 'lines/1');
  // the boundary run: down for its own input, note text as legacy (health matches it)
  const n = q(V.db, "SELECT status, note FROM collector_runs WHERE layer='firms' ORDER BY id").pop(); assert.equal(n.status, 'down'); assert.match(n.note, /^no detections processed yet for today \(UTC\)/);
  assert.equal(jsonOf(V, CELLS).source_status, 'down'); assert.equal(jsonOf(V, LATEST).run_id, out.run_id, 'records kept');
});
await t('1f. two real files on one day (15:30 then 23:45): the later replaces both published files; checkpoint uses 23:45; the 15:30 output stays published, never re-chosen', async () => {
  if (!R1530 || !R2345) skip('real files not present');
  const V = makeEnv();
  FIRMS = { status: 200, body: R1530 }; await runFirmsAt(V.env, '2026-11-05T15:30:00Z', '2026-11-05T15:30:40Z');
  const first = jsonOf(V, LATEST).run_id;
  FIRMS = { status: 200, body: R2345 }; await runFirmsAt(V.env, '2026-11-05T23:45:00Z', '2026-11-05T23:45:40Z');
  const second = jsonOf(V, LATEST).run_id; assert.notEqual(first, second); assert.equal(jsonOf(V, CELLS).run_id, second);
  FIRMS = { status: 200, body: HEAD }; await runFirmsAt(V.env, '2026-11-06T00:30:00Z', '2026-11-06T00:30:40Z');
  assert.equal(one(V.db, 'SELECT source_key FROM archive_checkpoints').source_key, one(V.db, 'SELECT snapshot_key FROM firms_outputs WHERE run_id = ?', second).snapshot_key);
  assert.deepEqual(q(V.db, 'SELECT publish_state s FROM firms_outputs ORDER BY retrieved_at').map(r => r.s), ['published', 'published']);
});

// =====================================================================================================================
// 2. Publication races and recovery (reference model P1–P20, through the worker)
await t('P1. A stalls; B claims, commits, publishes; A resumes with a read error → fenced, B\'s counts file untouched', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.equal(await claimRaw(E, r, 'A'), 1); NOW += W.FV.leaseMs + 60e3;
  const b = await W.fvWork(E.env, r, 'world'); assert.equal(b.r, 'published');
  const before = E.m.get(CELLS).etag; NOW += 60e3;
  assert.equal(await W.fvDownForInput(E.env, r, 'A', 'read error'), 'fenced: no public down'); assert.equal(E.m.get(CELLS).etag, before);
  assert.equal(one(E.db, "SELECT outcome FROM firms_attempts WHERE token='A'").outcome, 'fenced-failure');
});
await t('P2. an older input\'s failure (fence passed) cannot replace a newer run\'s counts: ordered by input time', async () => {
  const E = makeEnv(); const o = await addInput(E, '2026-11-07T09:30:00Z', '2026-11-07T09:30:40Z'), n = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.equal((await W.fvWork(E.env, n, 'world')).r, 'published'); assert.equal(await claimRaw(E, o, 'O'), 1); NOW += 3600e3;
  assert.equal(await W.fvDownForInput(E.env, o, 'O', 'upload error'), 'down:newer'); assert.equal(jsonOf(E, CELLS).run_id, n); assert.equal(jsonOf(E, CELLS).source_status, 'ok');
});
await t('P3. a genuine failure of the newest input (malformed row) publishes down with its input time; real failure time in the body; no partial snapshot', async () => {
  const E = makeEnv(); const a = await addInput(E, '2026-11-07T09:30:00Z', '2026-11-07T09:30:40Z'); assert.equal((await W.fvWork(E.env, a, 'world')).r, 'published');
  const b = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z', csv([row(-20, 30), row(-21, 31).slice(0, -2)]));
  NOW = Date.parse('2026-11-07T09:46:10Z'); const w = await W.fvWork(E.env, b, 'world');
  assert.match(w.failed, /truncated or malformed response: line 3/); assert.equal(w.r, 'down:written');
  const c = jsonOf(E, CELLS); assert.equal(c.source_status, 'down'); assert.equal(c.run_id, b); assert.equal(c.retrieved_at, one(E.db, 'SELECT retrieved_at FROM firms_inputs WHERE run_id=?', b).retrieved_at); assert.equal(c.failed_at, '2026-11-07T09:46:10.000Z');
  assert.equal(jsonOf(E, LATEST).run_id, a, 'records stay on the last good run');
  assert.ok(![...E.m.keys()].some(k => k.startsWith('snapshots/firms/' + b)), 'no snapshot object for the failed attempt');
  assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_outputs WHERE run_id=?', b).n, 0);
});
await t('P8. older writer paused between head() and put while a newer run publishes → its conditional put gets null → re-head → stops (newer)', async () => {
  const E = makeEnv(); const o = await addInput(E, '2026-11-07T09:30:00Z', '2026-11-07T09:30:40Z'), n = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.equal((await W.fvWork(E.env, n, 'world')).r, 'published'); const keepN = { ...E.m.get(LATEST) };
  // put an older LEGACY-free current state: rewind latest to an older run, then race
  E.m.set(LATEST, { ...keepN, customMetadata: { run_id: 'prev', retrieved_at: '2026-11-07T09:00:00.000Z', status: 'ok', token: 'x' }, etag: 'eprev' });
  E.hooks.beforePut = async () => { E.m.set(LATEST, keepN); };   // the newer publication lands inside o's head→put window
  const me = { run_id: o, retrieved_at: '2026-11-07T09:30:40.000Z', status: 'ok', token: 'T' };
  assert.equal(await W.fvCas(E.env, LATEST, async () => 'OLD', me), 'newer'); assert.equal(E.m.get(LATEST).customMetadata.run_id, n);
});
await t('P9. both shared objects absent: created once each with create-only; a second create-only gets null', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.equal((await W.fvWork(E.env, r, 'world')).r, 'published'); assert.equal(await E.R2.put(LATEST, 'y', { onlyIf: { etagDoesNotMatch: '*' } }), null);
  assert.deepEqual(E.log.filter(x => x.key === LATEST || x.key === CELLS).map(x => x.key), [LATEST, CELLS]);
});
await t('P10. create-only NOT verified (FIRMS_CREATE_ONLY unset): absent → nothing written, output stays pending; set verified → the next run publishes it', async () => {
  const E = makeEnv({ FIRMS_CREATE_ONLY: undefined }); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.equal((await W.fvWork(E.env, r, 'world')).r, 'stop:refused-absent'); assert.ok(!E.m.has(LATEST) && !E.m.has(CELLS));
  assert.equal(one(E.db, 'SELECT publish_state s FROM firms_outputs').s, 'pending');
  E.env.FIRMS_CREATE_ONLY = 'verified'; FIRMS = { throw: true }; await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  assert.equal(E.m.get(LATEST).customMetadata.run_id, r); assert.equal(one(E.db, 'SELECT publish_state s FROM firms_outputs').s, 'published');
});
await t('P11. legacy latest/ uploaded before our retrieval → older (replaced); uploaded after → UNCERTAIN: deferred, not overwritten, not superseded', async () => {
  const E = makeEnv(); NOW = Date.parse('2026-11-07T09:40:00Z'); await E.R2.put(LATEST, 'legacy'); await E.R2.put(CELLS, '{"legacy":1}');
  const q1 = await addInput(E, '2026-11-07T09:30:00Z', '2026-11-07T09:35:00Z');
  assert.equal((await W.fvWork(E.env, q1, 'world')).r, 'stop:uncertain'); assert.equal(dec.decode(E.m.get(LATEST).bytes), 'legacy');
  assert.equal(one(E.db, 'SELECT publish_state s FROM firms_outputs').s, 'pending');
  const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z'); assert.equal((await W.fvWork(E.env, r, 'world')).r, 'published');
  assert.equal(E.m.get(LATEST).customMetadata.run_id, r);
});
await t('P12. DOWN → SUCCESS, same input, through the scheduled job: attempt 1 fails (snapshot write), next run retries it → its counts file becomes ok, then the new run publishes', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]) };
  E.fail.put = k => k.startsWith('snapshots/firms/'); await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  const r = one(E.db, 'SELECT run_id FROM firms_inputs').run_id; assert.equal(jsonOf(E, CELLS).source_status, 'down'); assert.ok(!E.m.has(LATEST));
  FIRMS = { status: 200, body: csv([row(-20, 30), row(10, 10)]) }; await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  const r2 = one(E.db, 'SELECT run_id FROM firms_inputs WHERE run_id != ?', r).run_id;
  assert.deepEqual(cellsWrites(E), [r + ':down', r + ':ok', r2 + ':ok']);
  assert.deepEqual(q(E.db, 'SELECT run_id, attempts_used, state FROM firms_inputs ORDER BY retrieved_at'), [{ run_id: r, attempts_used: 2, state: 'done' }, { run_id: r2, attempts_used: 1, state: 'done' }]);
  assert.deepEqual(q(E.db, "SELECT status FROM collector_runs WHERE layer='firms' ORDER BY id").map(x => x.status), ['down', 'ok', 'ok']);
});
await t('P14. SUCCESS → delayed FAILURE: A\'s fence passes, A pauses before its head(); B claims, commits, publishes; A resumes → counts stay ok', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z'); assert.equal(await claimRaw(E, r, 'A'), 1);
  let b; E.hooks.beforeHead = async () => { b = await W.fvWork(E.env, r, 'world'); };
  assert.equal(await W.fvDownForInput(E.env, r, 'A', 'read error'), 'down:newer'); assert.equal(b.r, 'published'); assert.equal(jsonOf(E, CELLS).source_status, 'ok');
});
await t('P15. same race at the put itself: A\'s down head() saw nothing, B publishes ok, A\'s create-only put → null → re-head → stop', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z'); assert.equal(await claimRaw(E, r, 'A'), 1);
  let b; E.hooks.beforePut = async k => { b = await W.fvWork(E.env, r, 'world'); };
  assert.equal(await W.fvDownForInput(E.env, r, 'A', 'x'), 'down:newer'); assert.equal(b.r, 'published'); assert.equal(jsonOf(E, CELLS).source_status, 'ok');
});
await t('P16. DISCOVERY REPAIR via the job: records published, counts put fails → next run finds it (>= current) and writes the counts only, records untouched', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]) };
  E.fail.put = k => k === CELLS; await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  const r = one(E.db, 'SELECT run_id FROM firms_outputs').run_id; assert.equal(E.m.get(LATEST).customMetadata.run_id, r); assert.ok(!E.m.has(CELLS));
  assert.match(one(E.db, "SELECT note FROM collector_runs WHERE layer='firms'").note, /publication error \(pending repair\)|publication publication error/);
  const etag = E.m.get(LATEST).etag, n = E.log.length; FIRMS = { throw: true };
  await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  assert.equal(E.m.get(LATEST).etag, etag, 'records not rewritten');
  assert.deepEqual(E.log.slice(n).filter(x => x.key === CELLS || x.key === LATEST).map(x => x.key + ' ' + x.meta.run_id + ':' + x.meta.status).slice(0, 1), [CELLS + ' ' + r + ':ok']);
  assert.equal(one(E.db, 'SELECT publish_state s FROM firms_outputs').s, 'published');
  assert.match(q(E.db, "SELECT note FROM collector_runs WHERE layer='firms' AND status='ok'").pop().note, new RegExp('repair run=' + r));
});
await t('P17. lost D1 latest_at after a successful R2 write → next run reconciles; records not rewritten; only the counts written', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  E.d1fail.re = /SET latest_at/; E.d1fail.nth = 1; assert.match((await W.fvWork(E.env, r, 'world')).r, /publication error/);
  const etag = E.m.get(LATEST).etag, n = E.log.length; FIRMS = { throw: true }; await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  assert.equal(E.m.get(LATEST).etag, etag); assert.equal(E.log.slice(n)[0].key, CELLS); assert.equal(E.log.slice(n)[0].meta.run_id, r);
  const o = one(E.db, 'SELECT latest_at, cells_at, publish_state FROM firms_outputs'); assert.ok(o.latest_at && o.cells_at); assert.equal(o.publish_state, 'published');
});
await t('P18. lost D1 cells_at after both R2 writes → next run reconciles with ZERO R2 writes for the repair', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  E.d1fail.re = /SET latest_at/; E.d1fail.nth = 2; assert.match((await W.fvWork(E.env, r, 'world')).r, /publication error/);
  assert.equal(one(E.db, 'SELECT publish_state s FROM firms_outputs').s, 'pending');
  E.env.FIRMS_MAP_KEY = ''; const n = E.log.filter(x => x.key === LATEST || x.key.startsWith('cells/firms/') || x.key === CELLS).length;
  NOW = Date.parse('2026-11-07T10:00:40Z'); const res = await W.collectFirmsV2(E.env, Date.parse('2026-11-07T10:00:00Z'));
  assert.match(res, new RegExp('repair ' + r + ': reconciled-only'));
  const after = E.log.filter(x => x.key === LATEST || x.key.startsWith('cells/firms/') || (x.key === CELLS && x.meta.run_id === r)).length; assert.equal(after - n, 1, 'only the per-run archive cells file is rewritten (idempotent); shared objects untouched');
  assert.equal(one(E.db, 'SELECT publish_state s FROM firms_outputs').s, 'published');
});
await t('P19. an OLDER run\'s pending repair is never chosen once a newer run is current; swept as superseded', async () => {
  const E = makeEnv(); const r1 = await addInput(E, '2026-11-07T09:30:00Z', '2026-11-07T09:30:40Z');
  E.fail.put = k => k === CELLS; await W.fvWork(E.env, r1, 'world');
  const r2 = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z'); assert.equal((await W.fvWork(E.env, r2, 'world')).r, 'published');
  FIRMS = { throw: true }; await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  assert.equal(one(E.db, 'SELECT publish_state s FROM firms_outputs WHERE run_id = ?', r1).s, 'superseded'); assert.equal(E.m.get(LATEST).customMetadata.run_id, r2);
});
await t('P20. repair attempts are bounded: the counts put keeps failing → 3 publication claims, then publish-bound and out of discovery', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  E.fail.put = k => k === CELLS; await W.fvWork(E.env, r, 'world');
  for (let k = 0; k < 2; k++) { E.fail.put = k2 => k2 === CELLS; await assert.rejects(W.fvPublish(E.env, r), /R2 stub/); }
  assert.equal(await W.fvPublish(E.env, r), 'publish-bound'); assert.equal(one(E.db, 'SELECT publish_attempts n FROM firms_outputs').n, 3);
  assert.equal(await E.env.DB.prepare(W.FVSQL.FIND_UNPUBLISHED).bind('1970-01-01T00:00:00.000Z').first(), null);
});

// =====================================================================================================================
// 3. Run state (firms-state.check C-cases, through the worker)
await t('C1. exclusive claim: two attempts on one input at once → one proceeds, the other "claim lost"; one output', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  const [a, b] = await Promise.all([W.fvWork(E.env, r, 'world'), W.fvWork(E.env, r, 'world')]);
  assert.deepEqual([a.r, b.r].sort(), ['claim lost', 'published']); assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_attempts').n, 1);
});
await t('C2. attempts bounded at 3: three failing attempts (each after its lease) → the input leaves discovery; a 4th claim inserts nothing', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z', csv([row(999, 30)]));
  for (let k = 0; k < 3; k++) { const w = await W.fvWork(E.env, r, 'world'); assert.match(w.failed, /latitude "999"/); NOW += 60e3; }
  assert.equal((await W.fvWork(E.env, r, 'world')).r, 'claim lost'); assert.equal(one(E.db, 'SELECT attempts_used n FROM firms_inputs').n, 3);
  assert.equal(await E.env.DB.prepare(W.FVSQL.FIND_UNPROCESSED).bind('1970-01-01T00:00:00.000Z').first(), null);
});
await t('C3. a live lease blocks a second claim; after the lease expires a new attempt may claim; the stale attempt\'s commit is fenced', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z'); assert.equal(await claimRaw(E, r, 'A'), 1);
  assert.equal(await claimRaw(E, r, 'B'), 0); NOW += W.FV.leaseMs + 1; assert.equal(await claimRaw(E, r, 'B'), 1);
  const c = await E.env.DB.prepare(W.FVSQL.COMMIT).bind('A', 'k', 1, 's', 1, 'ak', 1, iso(NOW)).run(); assert.equal(c.meta.changes, 0, 'A is not the latest attempt');
});
await t('C4. a collecting run whose retrieved_at is already taken (here by a down run) abandons: nothing registered, never re-stamped', async () => {
  const E = makeEnv(); NOW = Date.parse('2026-11-07T09:45:40Z'); E.env.FIRMS_MAP_KEY = '';
  await W.fvDownNoInput(E.env, Date.parse('2026-11-07T09:45:00Z'), 'x');   // takes 09:45:40.000
  E.env.FIRMS_MAP_KEY = 'k'; FIRMS = { status: 200, body: csv([row(-20, 30)]) }; const a = await W.fvFetchToRaw(E.env, Date.parse('2026-11-07T09:45:00Z'));
  assert.equal(a.retrievedAt, '2026-11-07T09:45:40.000Z'); const reg = await W.fvRegister(E.env, Date.parse('2026-11-07T09:45:00Z'), a);
  assert.notEqual(reg, true); assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_inputs').n, 0); assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_settings').n, 0, 'cutover rolled back with the batch');
});
await t('C5. no-input down runs re-stamp +1 ms at most 3 times, then refuse; the body carries the real failure time', async () => {
  const E = makeEnv(); NOW = Date.parse('2026-11-07T09:45:40Z');
  const r = []; for (let k = 0; k < 4; k++) r.push(await W.fvDownNoInput(E.env, NOW - 40e3, 'http 503'));
  assert.equal(r[3], 'identity refused'); assert.deepEqual(q(E.db, "SELECT retrieved_at FROM firms_identity ORDER BY retrieved_at").map(x => x.retrieved_at), ['2026-11-07T09:45:40.000Z', '2026-11-07T09:45:40.001Z', '2026-11-07T09:45:40.002Z']);
  const c = jsonOf(E, CELLS); assert.equal(c.failed_at, '2026-11-07T09:45:40.000Z'); assert.equal(c.retrieved_at, '2026-11-07T09:45:40.002Z');
});
await t('C6. cutover is written once, by the first registration; later registrations leave it', async () => {
  const E = makeEnv(); await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z'); await addInput(E, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  assert.deepEqual(q(E.db, 'SELECT key, value FROM firms_settings'), [{ key: 'format_cutover_at', value: '2026-11-07T09:45:40.000Z' }]);
});
await t('C7. expiry sweep: an unprocessed input older than 36 h is expired, never started; a superseded one is swept by the next publication', async () => {
  const E = makeEnv(); const old = await addInput(E, '2026-11-05T09:45:00Z', '2026-11-05T09:45:40Z'); const mid = await addInput(E, '2026-11-07T09:30:00Z', '2026-11-07T09:30:40Z');
  FIRMS = { status: 200, body: csv([row(-20, 30)]) }; await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  const st = Object.fromEntries(q(E.db, 'SELECT run_id, state FROM firms_inputs').map(x => [x.run_id, x.state]));
  assert.equal(st[old], 'expired'); assert.equal(st[mid], 'done', 'mid is newer than nothing published → retried first and published');
  FIRMS = { throw: true }; const late = await addInput(E, '2026-11-07T09:40:00Z', '2026-11-07T09:40:10Z');   // retrieved before the current publication
  await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z'); assert.equal(one(E.db, 'SELECT state FROM firms_inputs WHERE run_id=?', late).state, 'superseded');
});

// =====================================================================================================================
// 4. Failures at the source and guards (note texts health depends on are unchanged)
await t('F1. resource guard: a 9 MiB file is archived (multipart, byte-identical), not processed; note text as legacy; /health/publication fails on the guard', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]) }; await runFirmsAt(E.env, '2026-11-07T09:30:00Z', '2026-11-07T09:30:40Z');
  const big = HEAD + (row(-20, 30) + '\n').repeat(Math.ceil((9 * 1024 * 1024) / 76)); FIRMS = { status: 200, body: big };
  await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  const n = q(E.db, "SELECT note FROM collector_runs WHERE layer='firms' ORDER BY id").pop().note; assert.match(n, new RegExp(`^raw archived; processing skipped: resource guard \\(${enc.encode(big).length} bytes > ${8 * 1024 * 1024}\\)$`));
  const raw = [...E.m.keys()].filter(k => k.startsWith('raw/firms/')).map(k => E.m.get(k)).find(v => v.bytes.length > W.FIRMS_MAX_PARSE_BYTES); assert.equal(dec.decode(raw.bytes), big);
  assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_inputs').n, 1, 'the guarded file is not registered for processing');
  const h = await worker.fetch(new Request('http://x/health/publication/firms'), E.env); assert.equal(h.status, 503); assert.match(await h.text(), /resource guard/);
});
await t('F2. HTTP 500, network error, Invalid key: down with the legacy note prefixes; counts file down; records kept', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]) }; await runFirmsAt(E.env, '2026-11-07T09:30:00Z', '2026-11-07T09:30:40Z'); const r = jsonOf(E, LATEST).run_id;
  for (const [f, re] of [[{ status: 500, body: 'oops' }, /^http 500 oops/], [{ throw: true }, /^fetch failed: Error: network reset/], [{ status: 200, body: 'Invalid MAP_KEY' }, /^http 200 Invalid MAP_KEY/]]) {
    FIRMS = f; NOW += 15 * 60e3; await runFirmsAt(E.env, iso(NOW - 40e3), iso(NOW));
    assert.match(q(E.db, "SELECT note FROM collector_runs WHERE layer='firms' ORDER BY id").pop().note, re); assert.equal(jsonOf(E, CELLS).source_status, 'down'); assert.equal(jsonOf(E, LATEST).run_id, r);
  }
});
await t('F3. Content-Length mismatch → "truncated response", nothing registered; a line over 4 KiB → run fails "line longer", attempt aborted, no snapshot', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]), contentLength: 99999 }; await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.match(q(E.db, "SELECT note FROM collector_runs WHERE layer='firms'").pop().note, /^truncated response: \d+ bytes of Content-Length 99999/); assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_inputs').n, 0);
  FIRMS = { status: 200, body: HEAD + row(-20, 30) + 'x'.repeat(5000) + '\n' }; await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  assert.match(q(E.db, "SELECT note FROM collector_runs WHERE layer='firms' ORDER BY id").pop().note, /line longer than 4096/);
  assert.ok(![...E.m.keys()].some(k => k.startsWith('snapshots/firms/'))); assert.equal(E.stats.mpuOpen, 0);
});
await t('F4. an uncaught error in the v2 job (D1 down at the sweep) never calls the unconditional writeDown: counts written through CAS with its own identity', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]) }; await runFirmsAt(E.env, '2026-11-07T09:30:00Z', '2026-11-07T09:30:40Z');
  E.d1fail.re = /SET state = 'expired'/; await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  const c = jsonOf(E, CELLS); assert.match(c.note, /^uncaught: Error: D1 stub/); assert.match(c.run_id, /^down-/); assert.equal(E.m.get(CELLS).customMetadata.status, 'down');
  assert.ok(!E.m.has('cells/firms/2026-11-07T09-45Z.json'), 'no legacy writeDown archive file');
});
await t('F5. multipart part failure while archiving raw → upload aborted, nothing left, run down', async () => {
  const E = makeEnv(); const big = HEAD + (row(-20, 30) + '\n').repeat(Math.ceil((6 * 1024 * 1024) / 76)); FIRMS = { status: 200, body: big };
  E.fail.put = k => /^raw\/firms\/.*#part$/.test(k); await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.equal(E.stats.mpuAborted, 1); assert.equal(E.stats.mpuOpen, 0); assert.ok(![...E.m.keys()].some(k => k.startsWith('raw/firms/')));
  assert.match(q(E.db, "SELECT note FROM collector_runs WHERE layer='firms'").pop().note, /^fetch failed: Error: R2 stub: forced part failure/);
});

await t('F6. a download that stalls after the headers is aborted at the download limit: down "download timed out", nothing registered, no raw left', async () => {
  const E = makeEnv(); const keep = W.FV.fetchMs; W.FV.fetchMs = 200; FIRMS = { stall: true };
  try { NOW = Date.parse('2026-11-07T09:45:40Z'); await Promise.race([W.collectFirmsV2(E.env, Date.parse('2026-11-07T09:45:00Z')), new Promise((_, rej) => setTimeout(() => rej(new Error('the job is still waiting on the download after 5 s')), 5000))]); } finally { W.FV.fetchMs = keep; }
  assert.match(q(E.db, "SELECT note FROM collector_runs WHERE layer='firms'").pop().note, /^fetch failed: Error: download timed out after 0.2 s/);
  assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_inputs').n, 0); assert.ok(![...E.m.keys()].some(k => k.startsWith('raw/firms/'))); assert.equal(E.stats.mpuOpen, 0);
});

await t('F7. /admin/probe/r2-conditional: admin key required; every check true on R2 semantics; nothing left under probe/', async () => {
  const E = makeEnv(); assert.equal((await worker.fetch(new Request('http://x/admin/probe/r2-conditional'), E.env)).status, 403);
  const r = await (await worker.fetch(new Request('http://x/admin/probe/r2-conditional?key=k'), E.env)).json();
  assert.equal(r.all_as_designed, true, JSON.stringify(r)); assert.ok(![...E.m.keys()].some(k => k.startsWith('probe/')));
  // the probe must detect a bucket WITHOUT conditional puts: a stub that ignores onlyIf → not as designed
  const F = makeEnv(); const put = F.env.R2.put; F.env.R2 = { ...F.env.R2, put: (k, v, o = {}) => put(k, v, { ...o, onlyIf: undefined }) };
  const r2 = await (await worker.fetch(new Request('http://x/admin/probe/r2-conditional?key=k'), F.env)).json(); assert.equal(r2.all_as_designed, false); assert.equal(r2.createPresent, false);
});

// =====================================================================================================================
// 4b. GPT production-review probes (6 Nov), as behavioural regressions
const cpRow = E => one(E.db, "SELECT cutoff, records, source_key FROM archive_checkpoints WHERE layer='firms' AND day='2026-11-06'");
const gapsOf = E => q(E.db, "SELECT day, reason FROM archive_gaps WHERE layer='firms'");
const histFails = E => q(E.db, "SELECT note FROM collector_runs WHERE layer='history:firms-checkpoint' AND status='down'");
await t('G1a. ROLLBACK: v2 publishes 23:00, FIRMS_PIPELINE unset, legacy publishes 23:45 → the checkpoint is the 23:45 legacy file (2 records)', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) }; await runFirmsAt(E.env, '2026-11-06T23:00:00Z', '2026-11-06T23:00:40Z');
  E.env.FIRMS_PIPELINE = undefined; FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06'), row(-19, 31, '1300', '3.34', 'D', '2026-11-06')]) };
  await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
  NOW = Date.parse('2026-11-07T00:31:00Z'); await W.histCheckpointsDue(E.env, 'firms', NOW);
  const cp = cpRow(E); assert.equal(cp.cutoff, '2026-11-06T23:45:40.000Z'); assert.equal(cp.records, 2); assert.equal(cp.source_key, 'snapshots/firms/2026-11-06T23-45Z.json');
  assert.equal(one(E.db, "SELECT SUM(detections) n FROM fires_daily WHERE day='2026-11-06'").n, 2);
});
await t('G1b. mixed day the other way: legacy 22:00, v2 re-enabled, v2 23:00 → the v2 output; then a legacy-only next day after another rollback → legacy', async () => {
  const E = makeEnv({ FIRMS_PIPELINE: undefined }); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) };
  await runFirmsAt(E.env, '2026-11-06T22:00:00Z', '2026-11-06T22:00:40Z');
  E.env.FIRMS_PIPELINE = 'v2'; FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06'), row(-19, 31, '1300', '3.34', 'D', '2026-11-06'), row(-18, 32, '1300', '3.34', 'D', '2026-11-06')]) };
  await runFirmsAt(E.env, '2026-11-06T23:00:00Z', '2026-11-06T23:00:40Z');
  E.env.FIRMS_PIPELINE = undefined; FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-07')]) };
  await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  NOW = Date.parse('2026-11-08T00:31:00Z'); await W.histCheckpointsDue(E.env, 'firms', NOW);
  const d6 = cpRow(E); assert.equal(d6.cutoff, '2026-11-06T23:00:40.000Z'); assert.equal(d6.records, 3); assert.match(d6.source_key, /-a1-/);
  const d7 = one(E.db, "SELECT cutoff, records, source_key FROM archive_checkpoints WHERE day='2026-11-07'"); assert.equal(d7.source_key, 'snapshots/firms/2026-11-07T10-00Z.json'); assert.equal(d7.records, 1);
});
await t('G2a. a failed committed-output read DEFERS the checkpoint (history failure logged, no gap, no marker); the next run completes it from the committed snapshot', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) }; await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
  E.d1fail.re = /FROM firms_outputs WHERE day/; FIRMS = { status: 200, body: HEAD }; await runFirmsAt(E.env, '2026-11-07T00:30:00Z', '2026-11-07T00:31:00Z');
  assert.deepEqual(gapsOf(E), []); assert.equal(cpRow(E), undefined); assert.match(histFails(E).pop().note, /committed-output read failed; checkpoint deferred/);
  await runFirmsAt(E.env, '2026-11-07T00:45:00Z', '2026-11-07T00:46:00Z');
  const cp = cpRow(E); assert.equal(cp.records, 1); assert.match(cp.source_key, /-a1-/); assert.deepEqual(gapsOf(E), []);
});
await t('G2b. other unreadable state defers too: the completion-marker read, and a fires_daily batch failing half-way (no marker; retry completes, rows not doubled)', async () => {
  for (const re of [/FROM archive_checkpoints WHERE layer = 'firms' AND day/, /INSERT OR IGNORE INTO fires_daily/]) {
    const E = makeEnv(); const rows = Array.from({ length: 120 }, (_, i) => row(-80 + i, -170 + i * 2.5, '1300', '3.34', 'D', '2026-11-06'));
    FIRMS = { status: 200, body: csv(rows) }; await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
    E.d1fail.re = re; E.d1fail.nth = /fires_daily/.test(String(re)) ? 60 : 1; FIRMS = { status: 200, body: HEAD };
    await runFirmsAt(E.env, '2026-11-07T00:30:00Z', '2026-11-07T00:31:00Z');
    assert.equal(cpRow(E), undefined, String(re)); assert.deepEqual(gapsOf(E), []); assert.ok(histFails(E).length >= 1);
    await runFirmsAt(E.env, '2026-11-07T00:45:00Z', '2026-11-07T00:46:00Z');
    assert.equal(cpRow(E).records, 120); assert.equal(one(E.db, "SELECT SUM(detections) n, COUNT(*) c FROM fires_daily WHERE day='2026-11-06'").n, 120);
  }
});
await t('G2c. the checkpoint never reads the cutover setting: a failing firms_settings read changes nothing; missing tables with v2 OFF = no committed outputs; with v2 ON = deferred', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) }; await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
  E.d1fail.re = /firms_settings/; NOW = Date.parse('2026-11-07T00:31:00Z'); assert.equal(await W.histCheckpointsDue(E.env, 'firms', NOW), '2026-11-06:done');
  for (const pipeline of [undefined, 'v2']) {
    const L = makeEnv({ FIRMS_PIPELINE: undefined }); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) }; await runFirmsAt(L.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
    for (const tb of ['firms_attempts', 'firms_outputs', 'firms_inputs', 'firms_identity', 'firms_settings']) L.db.exec('DROP TABLE ' + tb);
    L.env.FIRMS_PIPELINE = pipeline; NOW = Date.parse('2026-11-07T00:31:00Z');
    if (pipeline) { await assert.rejects(W.histCheckpointsDue(L.env, 'firms', NOW), /committed-output read failed/); assert.equal(cpRow(L), undefined); assert.deepEqual(gapsOf(L), []); }
    else { assert.equal(await W.histCheckpointsDue(L.env, 'firms', NOW), '2026-11-06:done'); assert.equal(cpRow(L).source_key, 'snapshots/firms/2026-11-06T23-45Z.json'); }
  }
});
await t('G2d. cutover-state read failure after a ROLLBACK (v2 off, v2 has run): the checkpoint is deferred — no gap, no marker; next run completes with the right input', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) }; await runFirmsAt(E.env, '2026-11-06T23:00:00Z', '2026-11-06T23:00:40Z');
  E.env.FIRMS_PIPELINE = undefined; FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06'), row(-19, 31, '1300', '3.34', 'D', '2026-11-06')]) };
  await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
  E.d1fail.re = /FROM firms_settings/; NOW = Date.parse('2026-11-07T00:31:00Z');
  await assert.rejects(W.histCheckpointsDue(E.env, 'firms', NOW), /v2 state read failed; checkpoint deferred/); assert.equal(cpRow(E), undefined); assert.deepEqual(gapsOf(E), []);
  assert.equal(await W.histCheckpointsDue(E.env, 'firms', NOW), '2026-11-06:done'); assert.equal(cpRow(E).cutoff, '2026-11-06T23:45:40.000Z');
});
await t('G2e. v2 never ran and is off (the "deploy 0.6.0 with v2 off" state): the checkpoint runs the legacy selection — its only firms_* access is one firms_settings read; it never reads firms_outputs/inputs/attempts/identity', async () => {
  const E = makeEnv({ FIRMS_PIPELINE: undefined }); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) }; await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
  const seen = []; const prep = E.env.DB.prepare; E.env.DB = { ...E.env.DB, prepare: sql => { if (/firms_(outputs|inputs|attempts|identity)/.test(sql)) seen.push(sql); return prep(sql); }, batch: E.env.DB.batch };
  NOW = Date.parse('2026-11-07T00:31:00Z'); assert.equal(await W.histCheckpointsDue(E.env, 'firms', NOW), '2026-11-06:done');
  assert.deepEqual(seen, [], 'no v2 table read'); assert.equal(cpRow(E).source_key, 'snapshots/firms/2026-11-06T23-45Z.json');
});
await t('G3a. a sidecar with the right run but wrong attempt/token/counts is REJECTED and rebuilt from the committed snapshot: marker 1 record, fires_daily = firesDaily(snapshot)', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '7.5', 'N', '2026-11-06')]) }; await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
  const o = one(E.db, 'SELECT * FROM firms_outputs'); const aux = jsonOf(E, o.aux_key); aux.token = 'wrong-token'; aux.attempt = 99; aux.records = 999; for (const c of Object.values(aux.by_cell)) c.n = 999;
  await E.R2.put(o.aux_key, JSON.stringify(aux)); NOW = Date.parse('2026-11-07T00:31:00Z');
  assert.match(await W.fvCheckpointNew(E.env, '2026-11-06', o), /sidecar rebuilt/);
  assert.equal(cpRow(E).records, 1); const fd = one(E.db, "SELECT detections, frp_sum_mw, frp_max_mw, frp_n, day_n, night_n FROM fires_daily WHERE day='2026-11-06'");
  assert.deepEqual(fd, { detections: 1, frp_sum_mw: 7.5, frp_max_mw: 7.5, frp_n: 1, day_n: 0, night_n: 1 });
  assert.match(q(E.db, "SELECT note FROM collector_runs WHERE layer='firms:recovery'").pop().note, /token .* ≠ committed|size .* ≠ committed/);
});
await t('G3b. every sidecar fault is caught (size, run, token, attempt, retrieved_at, records, by_cell/cells/by_hour sums); a missing sidecar is rebuilt', async () => {
  const faults = [a => { a.extra = 'x'.repeat(10); }, a => { a.run_id = 'other'; }, a => { a.records = 2; }, a => { a.retrieved_at = '2026-11-06T00:00:00.000Z'; },
    a => { for (const c of Object.values(a.by_cell)) c.n += 1; }, a => { for (const c of Object.values(a.cells)) c.count += 1; }, a => { const h = Object.values(a.by_hour)[0]; h[Object.keys(h)[0]] += 1; }, null];
  for (const f of faults) {
    const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) }; await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
    const o = one(E.db, 'SELECT * FROM firms_outputs'); if (f) { const a = jsonOf(E, o.aux_key); f(a); await E.R2.put(o.aux_key, JSON.stringify(a)); } else E.m.delete(o.aux_key);
    NOW = Date.parse('2026-11-07T00:31:00Z'); assert.match(await W.fvCheckpointNew(E.env, '2026-11-06', o), /sidecar rebuilt/, String(f)); assert.equal(cpRow(E).records, 1);
  }
});
await t('G3c. a committed snapshot whose bytes no longer match its commit → checkpoint REFUSED: no marker, no fires_daily, no checkpoint object; also refused when its metadata token differs', async () => {
  for (const mode of ['bytes', 'token']) {
    const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06')]) }; await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
    const o = one(E.db, 'SELECT * FROM firms_outputs'), v = E.m.get(o.snapshot_key);
    if (mode === 'bytes') { const b = v.bytes.slice(); b[b.length - 5] = b[b.length - 5] === 49 ? 50 : 49; v.bytes = b; } else v.customMetadata = { ...v.customMetadata, token: 'other' };
    NOW = Date.parse('2026-11-07T00:31:00Z'); await assert.rejects(W.fvCheckpointNew(E.env, '2026-11-06', o), mode === 'bytes' ? /does not match its committed hash/ : /does not match the committed output/);
    assert.equal(cpRow(E), undefined); assert.equal(one(E.db, "SELECT COUNT(*) n FROM fires_daily").n, 0); assert.ok(!E.m.has('archive/checkpoints/firms/2026-11-06.json.gz'));
  }
});
await t('G3d. publication applies the same checks: a wrong sidecar → counts rebuilt from the committed snapshot; a snapshot with another token → nothing published', async () => {
  const E = makeEnv(); const r = await addInput(E, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z', csv([row(-20, 30), row(10, 10)]));
  E.fail.put = k => k === CELLS; await W.fvWork(E.env, r, 'world');   // records published, counts pending
  const o = one(E.db, 'SELECT * FROM firms_outputs'); const a = jsonOf(E, o.aux_key); a.cells = { '0_0': { count: 2 } }; a.token = 'x'; await E.R2.put(o.aux_key, JSON.stringify(a));
  assert.equal(await W.fvPublish(E.env, r), 'published'); const c = jsonOf(E, CELLS);
  assert.deepEqual(Object.fromEntries(Object.entries(c.cells).map(([k, v]) => [k, v.count])), { [W.cellId(-20, 30)]: 1, [W.cellId(10, 10)]: 1 });
  const F = makeEnv(); const r2 = await addInput(F, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  F.hooks.beforeHead = async k => { if (k.startsWith('snapshots/firms/')) { const v = F.m.get(k); v.customMetadata = { ...v.customMetadata, token: 'other' }; } };
  // tamper right after commit: run the steps by hand
  const w = await W.fvWork(F.env, r2, 'world'); assert.equal(w.r, 'stop:snapshot-mismatch'); assert.ok(!F.m.has(LATEST) && !F.m.has(CELLS));
});
await t('G4a. GPT case: records published, counts put fails; next run repairs counts then its fresh fetch fails → /health/publication/firms 200 (log agrees with the pair completion)', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]) }; E.fail.put = k => k === CELLS;
  await runFirmsAt(E.env, '2026-11-07T09:00:00Z', '2026-11-07T09:00:40Z');
  let h = await worker.fetch(new Request('https://hub/health/publication/firms'), E.env); assert.equal(h.status, 503); assert.match(await h.text(), /counts are not complete yet|no successful firms publication/);
  FIRMS = { status: 500, body: 'Internal error' }; await runFirmsAt(E.env, '2026-11-07T09:15:00Z', '2026-11-07T09:15:40Z');
  h = await worker.fetch(new Request('https://hub/health/publication/firms'), E.env); const b = await h.json(); assert.equal(h.status, 200, JSON.stringify(b.reasons));
  assert.equal(b.facts.last_publication.age_s, 900, 'age counts from the records upload (09:00:40), not from the repair');
  assert.equal(b.facts.v2_publication.counts_published_at, '2026-11-07T09:15:40.000Z');
});
await t('G4b. …and the age is NOT reset: if fresh fetches keep failing, the check fails once the 09:00 data is overdue (09:50:40), exactly as without a repair', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]) }; E.fail.put = k => k === CELLS;
  await runFirmsAt(E.env, '2026-11-07T09:00:00Z', '2026-11-07T09:00:40Z');
  FIRMS = { status: 500, body: 'Internal error' };
  for (const m of ['09:15', '09:30', '09:45']) await runFirmsAt(E.env, `2026-11-07T${m}:00Z`, `2026-11-07T${m}:40Z`);
  NOW = Date.parse('2026-11-07T09:50:30Z'); assert.equal((await worker.fetch(new Request('https://hub/health/publication/firms'), E.env)).status, 200);
  await runFirmsAt(E.env, '2026-11-07T10:00:00Z', '2026-11-07T10:00:40Z');
  const h = await worker.fetch(new Request('https://hub/health/publication/firms'), E.env); assert.equal(h.status, 503); assert.match(await h.text(), /no firms publication since 2026-11-07T09:00:40/);
});
await t('G4c. a v2 publication whose latest ok log is for ANOTHER run is reported, not hidden', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30)]) }; await runFirmsAt(E.env, '2026-11-07T09:00:00Z', '2026-11-07T09:00:40Z');
  E.db.exec("UPDATE collector_runs SET note = 'raw_bytes=1 run=someone-else' WHERE layer='firms' AND status='ok'");
  const h = await worker.fetch(new Request('https://hub/health/publication/firms'), E.env); assert.equal(h.status, 503); assert.match(await h.text(), /not for the published run/);
});
await t('G5a. GPT case: probe multipart PART failure → rejects, every upload aborted, nothing left (uploads tracked, not inferred from a listing)', async () => {
  const E = makeEnv(); E.fail.put = k => k.includes('/mp#part');
  await assert.rejects(W.fvProbeR2(E.env), /forced part failure/); assert.equal(E.stats.mpuOpen, 0); assert.ok(![...E.m.keys()].some(k => k.startsWith('probe/')));
});
await t('G5b. probe failure at multipart COMPLETE, at the abort test\'s part, and at a plain put → each rejects with 0 uploads open and 0 probe objects', async () => {
  for (const f of [k => k.endsWith('/mp#complete'), k => k.endsWith('/ab#part'), k => k.endsWith('/copy')]) {
    const E = makeEnv(); E.fail.put = f; await assert.rejects(W.fvProbeR2(E.env), /forced/); assert.equal(E.stats.mpuOpen, 0, String(f)); assert.ok(![...E.m.keys()].some(k => k.startsWith('probe/')), String(f));
  }
});
await t('G5c. the writer itself never leaves an upload open: complete() failing during a collect → upload aborted, run down, nothing registered', async () => {
  const E = makeEnv(); const big = HEAD + (row(-20, 30) + '\n').repeat(Math.ceil((6 * 1024 * 1024) / 76)); FIRMS = { status: 200, body: big };
  E.fail.put = k => /^raw\/firms\/.*#complete$/.test(k); await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  assert.equal(E.stats.mpuOpen, 0); assert.equal(E.stats.mpuAborted, 1); assert.equal(one(E.db, 'SELECT COUNT(*) n FROM firms_inputs').n, 0);
  assert.equal(q(E.db, "SELECT status FROM collector_runs WHERE layer='firms'").pop().status, 'down');
});

await t('G6. ROLLBACK BY REDEPLOY: the live 0.5.3 code (OLD_WORKER = main:phase1/worker.js) checkpoints a v2-written day correctly and keeps collecting/publishing, health up', async () => {
  const oldPath = process.env.OLD_WORKER; if (!oldPath || !fs.existsSync(oldPath)) skip('set OLD_WORKER to a copy of main:phase1/worker.js (git show main:phase1/worker.js > /tmp/w053.mjs)');
  const OLD = await import(oldPath);
  const E = makeEnv(); FIRMS = { status: 200, body: csv([row(-20, 30, '1300', '3.34', 'D', '2026-11-06'), row(-19, 31, '1300', '3.34', 'D', '2026-11-06')]) };
  await runFirmsAt(E.env, '2026-11-06T23:00:00Z', '2026-11-06T23:00:40Z'); const env = { ...E.env, FIRMS_PIPELINE: undefined };
  NOW = Date.parse('2026-11-07T00:31:00Z'); assert.equal(await OLD.histCheckpointsDue(env, 'firms', NOW), '2026-11-06:done');
  const cp = cpRow(E); assert.equal(cp.records, 2); assert.match(cp.source_key, /-a1-/); assert.equal(one(E.db, "SELECT SUM(detections) n FROM fires_daily WHERE day='2026-11-06'").n, 2);
  FIRMS = { status: 200, body: csv([row(-20, 30)]) }; NOW = Date.parse('2026-11-07T09:00:40Z');
  await OLD.default.scheduled({ cron: '*/15 * * * *', scheduledTime: Date.parse('2026-11-07T09:00:00Z') }, env, { waitUntil() {} });
  assert.equal(q(E.db, "SELECT status FROM collector_runs WHERE layer='firms'").pop().status, 'ok'); assert.equal(jsonOf(E, LATEST).run_id, undefined, 'legacy file back on latest/');
  assert.equal((await OLD.default.fetch(new Request('https://hub/health/publication/firms'), env)).status, 200);
});

const HEADER_ONLY_NO_NL = HEAD.slice(0, -1);   // FIRMS's real post-midnight file: 122 bytes, no trailing newline (raw/firms/2026-11-07T00-00Z.csv)
await t('N1. header-only FIRMS file WITHOUT a trailing newline (the real 122-byte post-midnight file): legacy parse = 0 rows, not "malformed line 2"', async () => {
  assert.equal(enc.encode(HEADER_ONLY_NO_NL).length, 122);
  for (const body of [HEADER_ONLY_NO_NL, HEAD, HEAD.replace('\n', '\r\n')]) { const p = W.firmsParse(body); assert.equal(p.rows.length, 0, JSON.stringify(body.slice(-3))); }
  const one1 = W.firmsParse(HEAD + row(-20, 30)); assert.equal(one1.rows.length, 1, 'a last row without newline still parses');
});
await t('N2. the nightly case end to end, both pipelines: 00:00 UTC header-only (no newline) → down with the boundary note, health/publication stays 200 (expected empty day), records kept', async () => {
  for (const pipe of [undefined, 'v2']) {
    const E = makeEnv({ FIRMS_PIPELINE: pipe }); FIRMS = { status: 200, body: csv([row(-20, 30, '2300', '3.34', 'D', '2026-11-06')]) };
    await runFirmsAt(E.env, '2026-11-06T23:45:00Z', '2026-11-06T23:45:40Z');
    for (const body of [HEADER_ONLY_NO_NL, HEAD]) {
      FIRMS = { status: 200, body }; NOW += 15 * 60e3; await runFirmsAt(E.env, iso(NOW - 40e3), iso(NOW));
      const last = q(E.db, "SELECT status, note FROM collector_runs WHERE layer='firms' ORDER BY id").pop();
      assert.equal(last.status, 'down', String(pipe)); assert.match(last.note, /^no detections processed yet for today \(UTC\)/, String(pipe) + ' ' + last.note);
      assert.doesNotMatch(last.note, /malformed/);
    }
    const h = await worker.fetch(new Request('https://hub/health/publication/firms'), E.env); assert.equal(h.status, 200, String(pipe) + ' ' + await h.clone().text());
    assert.equal(jsonOf(E, LATEST).records.length, 1, 'yesterday\'s records kept');
  }
});

// =====================================================================================================================
// 5. Legacy transition and bounds (L_json = 12 MiB)
const legacySnap = (n, at) => JSON.stringify({ schema_version: 1, layer: 'firms', retrieved_at: at, source_status: 'ok', window_start: at.slice(0, 10) + 'T00:00:00.000Z', window_end: at, collector_version: '0.5.3', record_fields: ['lat', 'lng', 'observed_at', 'confidence', 'frp_mw', 'satellite', 'daynight'], records: Array.from({ length: n }, () => [-20, 30, at.slice(0, 10) + 'T13:00:00Z', 'n', 3.3, 'N20', 'D']), cells: { [W.cellId(-20, 30)]: { count: n } } });
await t('L1. checkpoint input = the LATEST publication of either kind (legacy key + retrieval time; the cutover is not a filter)', async () => {
  const E = makeEnv(); NOW = Date.parse('2026-11-07T09:00:00Z');
  await E.R2.put('snapshots/firms/2026-11-07T09-00Z.json', legacySnap(3, '2026-11-07T09:00:40.000Z'), { customMetadata: { retrieved_at: '2026-11-07T09:00:40.000Z' } });
  const snaps = await W.listSnapshots(E.env, 'firms'); assert.equal((await W.fvCheckpointCandidate(E.env, '2026-11-07', snaps)).kind, 'legacy');
  FIRMS = { status: 200, body: csv([row(-20, 30)]) }; await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  let c = await W.fvCheckpointCandidate(E.env, '2026-11-07', await W.listSnapshots(E.env, 'firms')); assert.equal(c.kind, 'new'); assert.equal(c.out.retrieved_at, '2026-11-07T09:45:40.000Z');
  await E.R2.put('snapshots/firms/2026-11-07T10-00Z.json', legacySnap(9, '2026-11-07T10:00:40.000Z'), { customMetadata: { retrieved_at: '2026-11-07T10:00:40.000Z' } });   // a legacy publication after the cutover (rollback / old isolate)
  c = await W.fvCheckpointCandidate(E.env, '2026-11-07', await W.listSnapshots(E.env, 'firms')); assert.equal(c.kind, 'legacy'); assert.equal(c.snap.retrieved_at, '2026-11-07T10:00:40.000Z');
  assert.ok(one(E.db, "SELECT value FROM firms_settings WHERE key='format_cutover_at'").value, 'cutover still recorded (audit)');
});
await t('L2. legacy-only day: legacy snapshot checkpointed by the legacy path; fires_daily from it', async () => {
  const E = makeEnv(); NOW = Date.parse('2026-11-07T09:00:00Z');
  await E.R2.put('snapshots/firms/2026-11-07T09-00Z.json', legacySnap(3, '2026-11-07T09:00:40.000Z'), { customMetadata: { retrieved_at: '2026-11-07T09:00:40.000Z' } });
  await E.env.DB.prepare("INSERT INTO history_activity (layer, day, first_seen) VALUES ('firms','2026-11-07','x')").run();
  NOW = Date.parse('2026-11-08T00:31:00Z'); assert.equal(await W.histCheckpointsDue(E.env, 'firms', NOW), '2026-11-07:done');
  assert.deepEqual(q(E.db, 'SELECT cell_id, detections FROM fires_daily'), [{ cell_id: W.cellId ? W.cellId(-20, 30) : q(E.db, 'SELECT cell_id FROM fires_daily')[0].cell_id, detections: 3 }]);
});
await t('L3. negative control: a legacy snapshot 1 byte over L_json → gap recorded, the object is never read; at exactly L_json it is read', async () => {
  for (const over of [1, 0]) {
    const E = makeEnv(); NOW = Date.parse('2026-11-07T09:00:00Z'); const base = legacySnap(1, '2026-11-07T09:00:40.000Z');
    const body = base.slice(0, -1) + ',"pad":"' + 'p'.repeat(W.FV.legacyMaxJson + over - enc.encode(base).length - 9) + '"}'; assert.equal(enc.encode(body).length, W.FV.legacyMaxJson + over);
    await E.R2.put('snapshots/firms/2026-11-07T09-00Z.json', body, { customMetadata: { retrieved_at: '2026-11-07T09:00:40.000Z' } });
    await E.env.DB.prepare("INSERT INTO history_activity (layer, day, first_seen) VALUES ('firms','2026-11-07','x')").run(); E.stats.gets.length = 0;
    NOW = Date.parse('2026-11-08T00:31:00Z'); const r = await W.histCheckpointsDue(E.env, 'firms', NOW);
    if (over) { assert.equal(r, '2026-11-07:gap'); assert.match(one(E.db, 'SELECT reason FROM archive_gaps').reason, /over the bounded-read limit/); assert.ok(!E.stats.gets.includes('snapshots/firms/2026-11-07T09-00Z.json')); }
    else { assert.equal(r, '2026-11-07:done'); }
  }
});
await t('L4. bounded gunzip: a legacy checkpoint decompressing to L_json + 1 is refused (null) before parsing; exactly L_json is returned', async () => {
  const E = makeEnv(); for (const over of [1, 0]) { const text = 'x'.repeat(W.FV.legacyMaxJson + over);
    const gz = new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); await E.R2.put('cp' + over, gz);
    const r = await W.fvBoundedGunzip(E.env, 'cp' + over, W.FV.legacyMaxJson); if (over) assert.equal(r, null); else assert.equal(r.length, W.FV.legacyMaxJson); }
});
await t('L5. /place during the switch: legacy latest/ + new counts (run_id on one side only) → withheld; legacy latest/ over L_json → withheld, not parsed', async () => {
  const E = makeEnv(); NOW = Date.parse('2026-11-07T09:00:00Z'); await E.R2.put(LATEST, legacySnap(2, '2026-11-07T09:00:40.000Z'));
  await E.R2.put(CELLS, JSON.stringify({ retrieved_at: '2026-11-07T09:00:40.000Z', run_id: 'r', source_status: 'ok', cells: { [W.cellId(-20, 30)]: { count: 2 } } }));
  let a = await (await worker.fetch(new Request('http://x/place/g4/' + W.cellId(-20, 30)), E.env)).json(); assert.equal(a.layers.firms.state, 'withheld');
  await E.R2.put(CELLS, JSON.stringify({ retrieved_at: '2026-11-07T09:00:40.000Z', source_status: 'ok', cells: { [W.cellId(-20, 30)]: { count: 2 } } }));
  a = await (await worker.fetch(new Request('http://x/place/g4/' + W.cellId(-20, 30)), E.env)).json(); assert.equal(a.layers.firms.state, 'ok'); assert.equal(a.layers.firms.records_total, 2);
  await E.R2.put(LATEST, 'x'.repeat(W.FV.legacyMaxJson + 1)); E.stats.gets.length = 0;
  a = await (await worker.fetch(new Request('http://x/place/g4/' + W.cellId(-20, 30)), E.env)).json(); assert.equal(a.layers.firms.state, 'withheld'); assert.ok(!E.stats.gets.includes(LATEST));
});

// =====================================================================================================================
// 6. /place bounds
await t('B1. /place scan cap: 2 concurrent scans per isolate; a 3rd waits ≤ 2 s then answers "busy" (counts still given)', async () => {
  const E = makeEnv(); FIRMS = { status: 200, body: csv(Array.from({ length: 200 }, (_, i) => row(-20 + i * 0.01, 30))) }; await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z');
  W.fvPlace.cache.clear(); W.fvPlace.bytes = 0; W.fvPlace.scans = 2;
  const realNow = Date.now; let fake = NOW; globalThis.Date.now = () => (fake += 500);   // the wait loop sees time pass
  const cj = jsonOf(E, CELLS), id = Object.keys(cj.cells)[0];
  const s = await W.fvPlaceSection(E.env, id, cj); globalThis.Date.now = realNow; W.fvPlace.scans = 0;
  assert.equal(s.state, 'busy'); assert.equal(s.cell.count, cj.cells[id].count); assert.ok(!s.records);
});
await t('B2. /place answer cache stays ≤ 256 KB (LRU) across 1,200 distinct cells (≈ 0.6 MB of answers); repeat answers equal fresh scans', async () => {
  const E = makeEnv(); const rows = []; for (let i = 0; i < 1200; i++) for (let k = 0; k < 9; k++) rows.push(row(-88 + Math.floor(i / 89) * 4 + 0.5, -179 + (i % 89) * 4 + 0.5 + k * 0.01, String(1000 + k)));
  FIRMS = { status: 200, body: csv(rows) }; await runFirmsAt(E.env, '2026-11-07T09:45:00Z', '2026-11-07T09:45:40Z'); W.fvPlace.cache.clear(); W.fvPlace.bytes = 0;
  const cells = jsonOf(E, CELLS); const ids = Object.keys(cells.cells); assert.ok(ids.length >= 1150, 'cells ' + ids.length); let total = 0;
  let maxB = 0; for (const id of ids) { const s = await W.fvPlaceSection(E.env, id, cells); assert.equal(s.records.length, 8); assert.equal(s.records_total, 9); total += JSON.stringify(s.records).length; maxB = Math.max(maxB, W.fvPlace.bytes); }
  assert.ok(total > 2 * W.FV.placeCacheBytes, 'the answers exceed the cache: ' + total);
  assert.ok(maxB <= W.FV.placeCacheBytes, 'cache bytes ' + maxB); const fresh = await W.fvPlaceSection(E.env, ids[5], cells); W.fvPlace.cache.clear(); W.fvPlace.bytes = 0;
  assert.deepEqual(await W.fvPlaceSection(E.env, ids[5], cells), fresh);
});

console.log(`\nfirms-v2: ${passed} passed, ${failed} failed, ${skipped} skipped`); process.exit(failed ? 1 : 0);
