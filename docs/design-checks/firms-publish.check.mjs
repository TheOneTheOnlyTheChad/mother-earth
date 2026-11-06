// DESIGN CHECK (not hub code): a reference model of docs/FIRMS-MEMORY-DESIGN.md rev 6 §5 (publication), §2.6 (failure path) and
// §6 (discovery), run on the real SQLite state (firms-state.sql.mjs) and an in-memory R2 stub with R2's conditional-put semantics
// (put returns null when onlyIf fails — Cloudflare R2 Workers API reference). The model is the specification the hub must meet.
// Usage: node --no-warnings docs/design-checks/firms-publish.check.mjs
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA, CLAIM, CLAIM_COUNT, COMMIT, COMMIT_DONE, FAIL_FENCE, FAIL_STALE, PUBLISH_CLAIM, IDENTITY, CUTOVER, INPUT,
  SWEEP_INPUTS_SUPERSEDED, SWEEP_INPUTS_EXPIRED, SWEEP_OUTPUTS_SUPERSEDED, SWEEP_OUTPUTS_EXPIRED, FIND_UNPROCESSED, FIND_UNPUBLISHED } from './firms-state.sql.mjs';

let passed = 0, failed = 0;
const t = async (n, fn) => { try { await fn(); passed++; console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e.message).split('\n').slice(0, 3).join('\n    ')); } };

// ---------- R2 stub: etags, uploaded time, custom metadata, onlyIf {etagMatches | etagDoesNotMatch:'*'}; optional pause hook
function r2() {
  const m = new Map(); let n = 0; const log = [];
  return { m, log, fail: { put: null }, beforePut: null,
    async head(k) { const v = m.get(k); return v ? { key: k, etag: v.etag, uploaded: v.uploaded, customMetadata: v.meta } : null; },
    async get(k) { const v = m.get(k); return v ? { body: v.body, etag: v.etag, customMetadata: v.meta } : null; },
    async put(k, body, o = {}) {
      if (this.beforePut) { const h = this.beforePut; this.beforePut = null; await h(k, o); }   // lets a test interleave another writer here
      if (this.fail.put && this.fail.put(k)) { this.fail.put = null; throw new Error('R2 stub: put failed'); }
      const cur = m.get(k), c = o.onlyIf || {};
      if (c.etagMatches !== undefined && (!cur || cur.etag !== c.etagMatches)) return null;
      if (c.etagDoesNotMatch === '*' && cur) return null;
      const v = { body, etag: 'e' + (++n), uploaded: new Date(NOW), meta: o.customMetadata || {} };
      m.set(k, v); log.push(['put', k, (o.customMetadata || {}).run_id || null, (o.customMetadata || {}).status || null]); return { key: k, etag: v.etag };
    } };
}
const D1fail = { re: null };
const mkdb = () => { const d = new DatabaseSync(':memory:'); d.exec('PRAGMA foreign_keys = ON;' + SCHEMA); return d; };
const run = (d, sql, ...a) => { if (D1fail.re && D1fail.re.test(sql)) { D1fail.re = null; throw new Error('D1 stub: write failed'); } return d.prepare(sql).run(...a); };
const batch = (d, stmts) => { d.exec('BEGIN'); try { const r = stmts.map(([s, a]) => run(d, s, ...a)); d.exec('COMMIT'); return r; } catch (e) { d.exec('ROLLBACK'); throw e; } };
const LEASE_MS = 15 * 60e3;
let NOW = Date.parse('2026-11-07T10:00:00.000Z'); const iso = ms => new Date(ms).toISOString();
const LATEST = 'latest/firms.json', CELLS = 'latest-cells/firms.json';
let CREATE_ONLY_VERIFIED = true;   // §5 step 5: false until etagDoesNotMatch:'*' is verified in workerd → absent objects are refused

// ---------- the model
/* §5 ordering (rev 6): an object's position is (retrieved_at, status rank) with down < ok WITHIN ONE RUN.
 *   same run, same status (ok: same committed token)  → 'ours'   (nothing to write)
 *   same run, existing down, ours ok                  → 'older'  (the committed success replaces its own input's failure file)
 *   same run, existing ok, ours down                  → 'newer'  (a delayed failure never replaces the success)
 *   other run                                          → by retrieved_at (unique per run)
 *   legacy (no run_id)                                 → uploaded < our retrieved_at ⇒ older; else 'uncertain' (deferred)        */
function order(head, me) {
  if (!head) return 'absent';
  const md = head.customMetadata || {};
  if (!md.run_id) return head.uploaded.getTime() < Date.parse(me.retrieved_at) ? 'older' : 'uncertain';
  if (md.run_id !== me.run_id) return md.retrieved_at > me.retrieved_at ? 'newer' : 'older';
  if (md.status === me.status) return me.status === 'ok' && md.token !== me.token ? 'mismatch' : 'ours';
  return md.status === 'down' && me.status === 'ok' ? 'older' : 'newer';
}
async function casPut(R, key, body, me) {
  for (let round = 0; round < 3; round++) {
    const h = await R.head(key), o = order(h, me);
    if (o === 'ours') return 'ours';
    if (o === 'newer' || o === 'uncertain' || o === 'mismatch') return o;
    if (o === 'absent' && !CREATE_ONLY_VERIFIED) return 'refused-absent';
    const meta = { run_id: me.run_id, retrieved_at: me.retrieved_at, status: me.status, token: me.token || '', format: 'lines/1' };
    const res = await R.put(key, body, { onlyIf: o === 'absent' ? { etagDoesNotMatch: '*' } : { etagMatches: h.etag }, customMetadata: meta });
    if (res) return 'written';
  }
  return 'contended';
}
/** §5: publish the COMMITTED output of run_id. "ours" requires same run, status ok AND the committed token — identity alone is not proof. */
async function publish(d, R, runId) {
  const out = d.prepare('SELECT * FROM firms_outputs WHERE run_id = ?').get(runId); if (!out) return 'no-output';
  if (run(d, PUBLISH_CLAIM, runId).changes !== 1) return 'publish-bound';
  const me = { run_id: runId, retrieved_at: out.retrieved_at, status: 'ok', token: out.token };
  const snap = await R.get(out.snapshot_key); if (!snap) return 'snapshot-missing';
  const r1 = await casPut(R, LATEST, snap.body, me);
  if (r1 === 'newer') { run(d, "UPDATE firms_outputs SET publish_state = 'superseded' WHERE run_id = ? AND publish_state = 'pending'", runId); return 'stop:newer'; }
  if (r1 !== 'written' && r1 !== 'ours') return 'stop:' + r1;
  run(d, 'UPDATE firms_outputs SET latest_at = COALESCE(latest_at, ?) WHERE run_id = ?', iso(NOW), runId);
  const body = JSON.stringify({ run_id: runId, retrieved_at: out.retrieved_at, source_status: 'ok', cells: { '1_1': { count: out.records } } });
  const r2r = await casPut(R, CELLS, body, me);
  if (r2r !== 'written' && r2r !== 'ours') return 'cells:' + r2r;
  run(d, "UPDATE firms_outputs SET cells_at = COALESCE(cells_at, ?), publish_state = 'published' WHERE run_id = ?", iso(NOW), runId);
  return r1 === 'ours' && r2r === 'ours' ? 'reconciled-only' : 'published';
}
/** §2.6 phase 1: the fence. */
function failFence(d, token, note) {
  if (run(d, FAIL_FENCE, token, iso(NOW), note).changes === 1) return true;
  run(d, FAIL_STALE, token, iso(NOW), note); return false;
}
/** §2.6 phase 2: the down counts file for THIS input, ordered by its retrieval time, status down. */
async function publishDown(d, R, token, note) {
  const a = d.prepare('SELECT a.run_id, i.retrieved_at FROM firms_attempts a JOIN firms_inputs i USING (run_id) WHERE a.token = ?').get(token);
  const me = { run_id: a.run_id, retrieved_at: a.retrieved_at, status: 'down', token };
  return 'down:' + await casPut(R, CELLS, JSON.stringify({ run_id: a.run_id, retrieved_at: a.retrieved_at, failed_at: iso(NOW), source_status: 'down', note }), me);
}
async function attemptFails(d, R, token, note) { return failFence(d, token, note) ? publishDown(d, R, token, note) : 'fenced: no public down'; }
function register(d, runId, at) { batch(d, [[CUTOVER, [at]], [IDENTITY, [at, runId, 'input', at]], [INPUT, [runId, 'raw/firms/' + runId + '.csv', at, at]]]); }
function claim(d, runId, tok) { return batch(d, [[CLAIM, [runId, tok, 'inv-' + tok, iso(NOW), iso(NOW + LEASE_MS)]], [CLAIM_COUNT, [runId, tok]]])[0].changes; }
async function processOk(d, R, runId, tok) {
  const a = d.prepare('SELECT attempt FROM firms_attempts WHERE token = ?').get(tok).attempt;
  const sk = `snapshots/firms/${runId}-a${a}-${tok}.json`, ak = `snapshots/firms-aux/${runId}-a${a}-${tok}.json`;
  await R.put(sk, JSON.stringify({ run_id: runId, by: tok })); await R.put(ak, '{}');
  return batch(d, [[COMMIT, [tok, sk, 10, 's', 3, ak, 1, iso(NOW)]], [COMMIT_DONE, [tok]]])[0].changes;
}
/** §6: ONE scheduled run's unfinished-work step, through the normal path: sweeps → discovery → claim → work → publication. */
let tokN = 0;
async function runOnce(d, R, plan = {}) {
  const h = await R.head(LATEST);
  const cur = !h ? '1970-01-01T00:00:00.000Z' : (h.customMetadata && h.customMetadata.retrieved_at) || h.uploaded.toISOString();
  run(d, SWEEP_INPUTS_EXPIRED, iso(NOW - 36 * 3600e3)); run(d, SWEEP_OUTPUTS_EXPIRED, iso(NOW - 36 * 3600e3));
  run(d, SWEEP_INPUTS_SUPERSEDED, cur); run(d, SWEEP_OUTPUTS_SUPERSEDED, cur);
  const pub = d.prepare(FIND_UNPUBLISHED).get(cur);
  if (pub) return 'repair ' + pub.run_id + ': ' + await publish(d, R, pub.run_id);
  const inp = d.prepare(FIND_UNPROCESSED).get(cur);
  if (!inp) return 'nothing';
  const tok = 'T' + (++tokN); if (claim(d, inp.run_id, tok) !== 1) return 'claim lost';
  if (plan[inp.run_id] === 'fail') return 'process ' + inp.run_id + ': ' + await attemptFails(d, R, tok, 'parse error');
  if (await processOk(d, R, inp.run_id, tok) !== 1) return 'fenced';
  return 'process ' + inp.run_id + ': ' + await publish(d, R, inp.run_id);
}
const cellsOf = R => JSON.parse(R.m.get(CELLS).body);

// ---------- P1–P11 (rev 5, kept; P4–P6 now also run through runOnce in P15–P17)
await t('P1. A stalls; B claims, commits, publishes; A resumes with a read error → fenced, B\'s counts file untouched', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A');
  NOW += LEASE_MS + 60e3; claim(d, 'r', 'B'); await processOk(d, R, 'r', 'B'); assert.equal(await publish(d, R, 'r'), 'published');
  const before = R.m.get(CELLS); NOW += 60e3;
  assert.equal(await attemptFails(d, R, 'A', 'read error'), 'fenced: no public down'); assert.equal(R.m.get(CELLS), before);
});
await t('P2. an older input\'s failure (fence passed) cannot replace a newer run\'s counts: ordered by input time', async () => {
  const d = mkdb(), R = r2(); register(d, 'old', '2026-11-07T09:30:00.000Z'); register(d, 'new', '2026-11-07T09:45:00.000Z');
  claim(d, 'new', 'N'); await processOk(d, R, 'new', 'N'); await publish(d, R, 'new'); claim(d, 'old', 'O'); NOW += 3600e3;
  assert.equal(await attemptFails(d, R, 'O', 'upload error'), 'down:newer'); assert.equal(cellsOf(R).run_id, 'new');
});
await t('P3. a genuine failure of the newest input publishes down with its input time; real failure time in the body', async () => {
  const d = mkdb(), R = r2(); register(d, 'a', '2026-11-07T09:30:00.000Z'); register(d, 'b', '2026-11-07T09:45:00.000Z');
  claim(d, 'a', 'A'); await processOk(d, R, 'a', 'A'); await publish(d, R, 'a'); claim(d, 'b', 'B'); NOW = Date.parse('2026-11-07T09:46:10.000Z');
  assert.equal(await attemptFails(d, R, 'B', 'parse error'), 'down:written');
  const c = cellsOf(R); assert.equal(c.source_status, 'down'); assert.equal(c.retrieved_at, '2026-11-07T09:45:00.000Z'); assert.equal(c.failed_at, '2026-11-07T09:46:10.000Z');
});
await t('P8. older writer paused between head() and put while a newer run publishes → its conditional put returns null', async () => {
  const R = r2(); await R.put(LATEST, 'x', { customMetadata: { run_id: 'prev', retrieved_at: '2026-11-07T09:00:00.000Z', status: 'ok' } });
  const h = await R.head(LATEST);
  await R.put(LATEST, 'NEW', { onlyIf: { etagMatches: h.etag }, customMetadata: { run_id: 'new', retrieved_at: '2026-11-07T09:45:00.000Z', status: 'ok' } });
  assert.equal(await R.put(LATEST, 'OLD', { onlyIf: { etagMatches: h.etag } }), null); assert.equal(R.m.get(LATEST).body, 'NEW');
});
await t('P9. both shared objects absent: created once each with create-only; a second create-only gets null', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A'); await processOk(d, R, 'r', 'A');
  assert.equal(await publish(d, R, 'r'), 'published'); assert.equal(await R.put(LATEST, 'y', { onlyIf: { etagDoesNotMatch: '*' } }), null);
});
await t('P10. create-only NOT verified: both absent → nothing written; only counts absent → records stay ours, counts refused; later verified → completes', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A'); await processOk(d, R, 'r', 'A');
  CREATE_ONLY_VERIFIED = false; assert.equal(await publish(d, R, 'r'), 'stop:refused-absent'); assert.ok(!R.m.has(LATEST) && !R.m.has(CELLS));
  const d2 = mkdb(), R2 = r2(); register(d2, 'r', '2026-11-07T09:45:00.000Z'); claim(d2, 'r', 'A'); await processOk(d2, R2, 'r', 'A');
  CREATE_ONLY_VERIFIED = true; R2.fail.put = k => k === CELLS; await assert.rejects(publish(d2, R2, 'r'), /R2 stub/);
  CREATE_ONLY_VERIFIED = false; assert.equal(await publish(d2, R2, 'r'), 'cells:refused-absent'); assert.equal(R2.m.get(LATEST).meta.run_id, 'r');
  CREATE_ONLY_VERIFIED = true; assert.equal(await publish(d2, R2, 'r'), 'published');
});
await t('P11. legacy object uploaded before our retrieval → older; after → UNCERTAIN: deferred, not overwritten, not superseded', async () => {
  const R = r2(); NOW = Date.parse('2026-11-07T09:40:00.000Z'); await R.put(LATEST, 'legacy');
  assert.equal(order(await R.head(LATEST), { run_id: 'r', retrieved_at: '2026-11-07T09:45:00.000Z', status: 'ok' }), 'older');
  const d = mkdb(); register(d, 'q', '2026-11-07T09:35:00.000Z'); claim(d, 'q', 'Q'); await processOk(d, R, 'q', 'Q');
  assert.equal(await publish(d, R, 'q'), 'stop:uncertain'); assert.equal(R.m.get(LATEST).body, 'legacy');
  assert.equal(d.prepare('SELECT publish_state s FROM firms_outputs').get().s, 'pending');
});

// ---------- rev 6: GPT's recovery probes
await t('P12. DOWN → SUCCESS, same input (GPT #1): attempt A publishes down; attempt B succeeds → counts file becomes ok; cells_at only after that', async () => {
  const d = mkdb(), R = r2(); NOW = Date.parse('2026-11-07T10:00:00.000Z'); register(d, 'r', '2026-11-07T09:45:00.000Z');
  assert.match(await runOnce(d, R, { r: 'fail' }), /down:written/); assert.equal(cellsOf(R).source_status, 'down');
  NOW += 60e3; assert.match(await runOnce(d, R), /process r: published/);
  const c = cellsOf(R); assert.equal(c.source_status, 'ok', 'the failure file was replaced by the committed success');
  assert.equal(R.m.get(CELLS).meta.status, 'ok'); assert.equal(R.m.get(CELLS).meta.token, d.prepare('SELECT token FROM firms_outputs').get().token);
  const o = d.prepare('SELECT publish_state, cells_at FROM firms_outputs').get(); assert.equal(o.publish_state, 'published'); assert.ok(o.cells_at);
});
await t('P13. rev-5 model reproduced: with "same run_id = ours" the counts writer records published while the file still says down', async () => {
  const sameRunIsOurs = (head, me) => head && head.customMetadata.run_id === me.run_id ? 'ours' : order(head, me);
  const R = r2(); await R.put(CELLS, '{"source_status":"down"}', { customMetadata: { run_id: 'r', retrieved_at: 'x', status: 'down' } });
  assert.equal(sameRunIsOurs(await R.head(CELLS), { run_id: 'r', retrieved_at: 'x', status: 'ok' }), 'ours', 'the rev-5 bug');
  assert.equal(order(await R.head(CELLS), { run_id: 'r', retrieved_at: 'x', status: 'ok', token: 't' }), 'older', 'rev 6: down → ok progresses');
});
await t('P14. SUCCESS → delayed FAILURE (reverse protection): A\'s fence passes, A pauses; B claims, commits, publishes; A resumes → counts stay ok', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A');
  assert.equal(failFence(d, 'A', 'read error'), true, 'A is latest, no output: fence passes');
  NOW += 60e3; assert.equal(claim(d, 'r', 'B'), 1, 'A finished (failed): B may claim'); await processOk(d, R, 'r', 'B'); assert.equal(await publish(d, R, 'r'), 'published');
  const before = R.m.get(CELLS); NOW += 60e3;
  assert.equal(await publishDown(d, R, 'A', 'read error'), 'down:newer'); assert.equal(R.m.get(CELLS), before); assert.equal(cellsOf(R).source_status, 'ok');
});
await t('P15. same race at the put itself: A\'s down head() sees nothing, then B publishes ok, then A\'s put → null → re-head → stop', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A'); failFence(d, 'A', 'x');
  claim(d, 'r', 'B'); await processOk(d, R, 'r', 'B');
  R.beforePut = async () => { assert.equal(await publish(d, R, 'r'), 'published'); };   // B publishes inside A's head→put window
  assert.equal(await publishDown(d, R, 'A', 'x'), 'down:newer'); assert.equal(cellsOf(R).source_status, 'ok');
});
await t('P16. DISCOVERY REPAIR (GPT #2): records published, counts put fails → the next normal run finds it (retrieved_at = current) and repairs counts only', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z');
  R.fail.put = k => k === CELLS; await assert.rejects(runOnce(d, R), /R2 stub/);
  assert.equal(R.m.get(LATEST).meta.run_id, 'r'); assert.ok(!R.m.has(CELLS));
  const etag = R.m.get(LATEST).etag, n = R.log.length;
  assert.equal(await runOnce(d, R), 'repair r: published'); assert.equal(R.m.get(LATEST).etag, etag, 'records not rewritten');
  assert.equal(R.log.length, n + 1, 'one write: the counts'); assert.equal(cellsOf(R).run_id, 'r');
});
await t('P17. DISCOVERY + lost D1 latest_at after a successful R2 write → next normal run reconciles; only the counts written', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z');
  D1fail.re = /SET latest_at/; await assert.rejects(runOnce(d, R), /D1 stub/);
  const etag = R.m.get(LATEST).etag, n = R.log.length;
  assert.equal(await runOnce(d, R), 'repair r: published'); assert.equal(R.m.get(LATEST).etag, etag); assert.equal(R.log.length, n + 1);
  const o = d.prepare('SELECT latest_at, cells_at, publish_state FROM firms_outputs').get(); assert.ok(o.latest_at && o.cells_at); assert.equal(o.publish_state, 'published');
});
await t('P18. DISCOVERY + lost D1 cells_at after both R2 writes → next normal run reconciles with ZERO R2 writes', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z');
  D1fail.re = /SET cells_at/; await assert.rejects(runOnce(d, R), /D1 stub/);
  const n = R.log.length; assert.equal(await runOnce(d, R), 'repair r: reconciled-only'); assert.equal(R.log.length, n);
  assert.equal(d.prepare('SELECT publish_state FROM firms_outputs').get().publish_state, 'published');
});
await t('P19. an OLDER run\'s pending repair is never chosen once a newer run is the current publication; it is swept as superseded', async () => {
  const d = mkdb(), R = r2(); register(d, 'r1', '2026-11-07T09:30:00.000Z');
  R.fail.put = k => k === CELLS; await assert.rejects(runOnce(d, R), /R2 stub/);   // r1: records ok, counts missing
  register(d, 'r2', '2026-11-07T09:45:00.000Z');
  // r1 is still the current records publication, so the next run repairs it first (correct: it is the current run) …
  assert.equal(await runOnce(d, R), 'repair r1: published');
  // … then r2 is processed and published; now force r1 back to pending to prove it can no longer be chosen
  assert.match(await runOnce(d, R), /process r2: published/);
  d.prepare("UPDATE firms_outputs SET publish_state = 'pending', cells_at = NULL, publish_attempts = 0 WHERE run_id = 'r1'").run();
  assert.equal(await runOnce(d, R), 'nothing'); assert.equal(d.prepare("SELECT publish_state s FROM firms_outputs WHERE run_id = 'r1'").get().s, 'superseded');
  assert.equal(cellsOf(R).run_id, 'r2');
});
await t('P20. repair attempts are bounded through the normal path: counts keep failing → 3 publication claims, then the row leaves discovery', async () => {
  const d = mkdb(), R = r2(); register(d, 'r', '2026-11-07T09:45:00.000Z');
  for (let k = 0; k < 3; k++) { R.fail.put = key => key === CELLS; await assert.rejects(runOnce(d, R), /R2 stub/); }
  assert.equal(await runOnce(d, R), 'nothing'); assert.equal(d.prepare('SELECT publish_attempts n FROM firms_outputs').get().n, 3);
});
console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
