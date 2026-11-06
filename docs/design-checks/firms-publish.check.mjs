// DESIGN CHECK (not hub code): a reference model of docs/FIRMS-MEMORY-DESIGN.md rev 5 §5 (publication) and §2.6 (failure path),
// run against the real SQLite state of firms-state.check.mjs and an in-memory R2 stub with R2's conditional-put semantics
// (put returns null when onlyIf fails — Cloudflare R2 Workers API reference). The model is the specification the hub must meet.
// Usage: node --no-warnings docs/design-checks/firms-publish.check.mjs
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { SCHEMA, CLAIM, CLAIM_COUNT, COMMIT, COMMIT_DONE, FAIL_FENCE, FAIL_STALE, PUBLISH_CLAIM, IDENTITY, CUTOVER, INPUT } from './firms-state.sql.mjs';

let passed = 0, failed = 0;
const t = async (n, fn) => { try { await fn(); passed++; console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e.message).split('\n').slice(0, 3).join('\n    ')); } };

// ---------- R2 stub: etags, uploaded time, custom metadata, onlyIf {etagMatches | etagDoesNotMatch:'*'}
function r2(opts = {}) {
  const m = new Map(); let n = 0; const log = [];
  return { m, log, fail: { put: null },
    async head(k) { const v = m.get(k); return v ? { key: k, etag: v.etag, uploaded: v.uploaded, customMetadata: v.meta } : null; },
    async get(k) { const v = m.get(k); return v ? { body: v.body, etag: v.etag, customMetadata: v.meta } : null; },
    async put(k, body, o = {}) {
      if (this.fail.put && this.fail.put(k)) { this.fail.put = null; throw new Error('R2 stub: put failed'); }
      const cur = m.get(k), c = o.onlyIf || {};
      if (c.etagMatches !== undefined && (!cur || cur.etag !== c.etagMatches)) return null;
      if (c.etagDoesNotMatch === '*' && cur) return null;
      if (opts.createOnlyUnsupported && c.etagDoesNotMatch === '*') throw new Error('create-only not verified');
      const v = { body, etag: 'e' + (++n), uploaded: new Date(opts.now ? opts.now() : Date.now()), meta: o.customMetadata || {} };
      m.set(k, v); log.push(['put', k, (o.customMetadata || {}).run_id || null]); return { key: k, etag: v.etag };
    } };
}
const D1fail = { re: null };
function mkdb() { const d = new DatabaseSync(':memory:'); d.exec('PRAGMA foreign_keys = ON;' + SCHEMA); return d; }
const run = (d, sql, ...a) => { if (D1fail.re && D1fail.re.test(sql)) { D1fail.re = null; throw new Error('D1 stub: write failed'); } return d.prepare(sql).run(...a); };
const batch = (d, stmts) => { d.exec('BEGIN'); try { const r = stmts.map(([s, a]) => run(d, s, ...a)); d.exec('COMMIT'); return r; } catch (e) { d.exec('ROLLBACK'); throw e; } };
const LEASE_MS = 15 * 60e3;
let NOW = Date.parse('2026-11-07T10:00:00.000Z'); const iso = ms => new Date(ms).toISOString();

// ---------- the model (rev 5 §5 / §2.6 / §2.5)
const LATEST = 'latest/firms.json', CELLS = 'latest-cells/firms.json';
function order(head, me) {   // §5 ordering table
  if (!head) return 'absent';
  const md = head.customMetadata || {};
  if (md.run_id) return md.run_id === me.run_id ? 'ours' : (md.retrieved_at > me.retrieved_at ? 'newer' : 'older');
  return head.uploaded.getTime() < Date.parse(me.retrieved_at) ? 'older' : 'uncertain';   // legacy
}
async function casPut(R, key, body, me, cfg) {
  for (let round = 0; round < 3; round++) {
    const h = await R.head(key), o = order(h, me);
    if (o === 'ours') return 'ours';
    if (o === 'newer' || o === 'uncertain') return o;
    const meta = { run_id: me.run_id, retrieved_at: me.retrieved_at, format: 'lines/1' };
    if (o === 'absent' && !cfg.createOnlyVerified) return 'refused-absent';
    const res = await R.put(key, body, { onlyIf: o === 'absent' ? { etagDoesNotMatch: '*' } : { etagMatches: h.etag }, customMetadata: meta });
    if (res) return 'written';
  }
  return 'contended';
}
/** §5: publish the COMMITTED output of run_id (never anything else). D1 completion records are reconciled from R2 identity. */
async function publish(d, R, runId, cfg = { createOnlyVerified: true }) {
  const out = d.prepare('SELECT * FROM firms_outputs WHERE run_id = ?').get(runId); if (!out) return 'no-output';
  if (run(d, PUBLISH_CLAIM, runId).changes !== 1) return 'publish-bound';
  const me = { run_id: runId, retrieved_at: out.retrieved_at };
  const snap = await R.get(out.snapshot_key); if (!snap) return 'snapshot-missing';
  const r1 = await casPut(R, LATEST, snap.body, me, cfg);
  if (r1 === 'newer' || r1 === 'uncertain') { if (r1 === 'newer') run(d, "UPDATE firms_outputs SET publish_state = 'superseded' WHERE run_id = ?", runId); return 'stop:' + r1; }
  if (r1 !== 'written' && r1 !== 'ours') return 'stop:' + r1;
  run(d, 'UPDATE firms_outputs SET latest_at = COALESCE(latest_at, ?) WHERE run_id = ?', iso(NOW), runId);   // reconciled even when R2 already had ours
  const r2r = await casPut(R, CELLS, JSON.stringify({ run_id: runId, retrieved_at: out.retrieved_at, source_status: 'ok', cells: { '1_1': { count: out.records } } }), me, cfg);
  if (r2r !== 'written' && r2r !== 'ours') return 'cells:' + r2r;
  run(d, "UPDATE firms_outputs SET cells_at = COALESCE(cells_at, ?), publish_state = 'published' WHERE run_id = ?", iso(NOW), runId);
  return r1 === 'ours' && r2r === 'ours' ? 'reconciled-only' : 'published';
}
/** §2.6: an attempt's processing failure. Public "down" ONLY through the failure fence; the down file is ordered by the
 * INPUT's retrieval time (it describes that input), with the actual failure time kept in the body, never as its stamp. */
async function attemptFails(d, R, token, note) {
  const a = d.prepare('SELECT a.run_id, i.retrieved_at FROM firms_attempts a JOIN firms_inputs i USING (run_id) WHERE a.token = ?').get(token);
  if (run(d, FAIL_FENCE, token, iso(NOW), note).changes !== 1) { run(d, FAIL_STALE, token, iso(NOW), note); return 'fenced: no public down'; }
  const me = { run_id: a.run_id, retrieved_at: a.retrieved_at };
  const res = await casPut(R, CELLS, JSON.stringify({ run_id: a.run_id, retrieved_at: a.retrieved_at, failed_at: iso(NOW), source_status: 'down', note }), me, { createOnlyVerified: true });
  return 'down:' + res;
}
// setup helpers
function register(d, runId, at) { batch(d, [[CUTOVER, [at]], [IDENTITY, [at, runId, 'input', at]], [INPUT, [runId, 'raw/firms/' + runId + '.csv', at, at]]]); }
function claim(d, runId, tok) { return batch(d, [[CLAIM, [runId, tok, 'inv-' + tok, iso(NOW), iso(NOW + LEASE_MS)]], [CLAIM_COUNT, [runId, tok]]])[0].changes; }
async function process_(d, R, runId, tok) {   // step B success path: own immutable keys, then the commit fence
  const a = d.prepare('SELECT attempt FROM firms_attempts WHERE token = ?').get(tok).attempt;
  const sk = `snapshots/firms/${runId}-a${a}-${tok}.json`, ak = `snapshots/firms-aux/${runId}-a${a}-${tok}.json`;
  await R.put(sk, JSON.stringify({ run_id: runId, by: tok })); await R.put(ak, '{}');
  return batch(d, [[COMMIT, [tok, sk, 10, 's', 3, ak, 1, iso(NOW)]], [COMMIT_DONE, [tok]]])[0].changes;
}

await t('P1. GPT\'s sequence: A stalls; B claims, commits, publishes; A resumes with a read error → B\'s healthy counts file is untouched', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'r', '2026-11-07T09:45:00.000Z');
  assert.equal(claim(d, 'r', 'A'), 1);
  NOW += LEASE_MS + 60e3; assert.equal(claim(d, 'r', 'B'), 1);
  assert.equal(await process_(d, R, 'r', 'B'), 1); assert.equal(await publish(d, R, 'r'), 'published');
  const before = R.m.get(CELLS);
  NOW += 60e3; assert.equal(await attemptFails(d, R, 'A', 'read error'), 'fenced: no public down');
  assert.equal(R.m.get(CELLS), before, 'same object, same etag'); assert.equal(JSON.parse(R.m.get(CELLS).body).source_status, 'ok');
  assert.equal(d.prepare("SELECT outcome FROM firms_attempts WHERE token='A'").get().outcome, 'fenced-failure');
});
await t('P2. even if the fence were bypassed, the down file is ordered by its INPUT time: an older run\'s failure cannot replace a newer run\'s counts', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'old', '2026-11-07T09:30:00.000Z'); register(d, 'new', '2026-11-07T09:45:00.000Z');
  claim(d, 'new', 'N'); await process_(d, R, 'new', 'N'); await publish(d, R, 'new');
  claim(d, 'old', 'O'); NOW += 3600e3;   // old's attempt is the latest for its input and has no output → passes its own fence
  assert.equal(await attemptFails(d, R, 'O', 'upload error'), 'down:newer', 'stopped by ordering, not stamped with "now"');
  assert.equal(JSON.parse(R.m.get(CELLS).body).run_id, 'new');
});
await t('P3. a genuine failure of the newest input does publish down, stamped with its input time; the real failure time is in the body', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'a', '2026-11-07T09:30:00.000Z'); register(d, 'b', '2026-11-07T09:45:00.000Z');
  claim(d, 'a', 'A'); await process_(d, R, 'a', 'A'); await publish(d, R, 'a');
  claim(d, 'b', 'B'); NOW = Date.parse('2026-11-07T09:46:10.000Z');
  assert.equal(await attemptFails(d, R, 'B', 'parse error'), 'down:written');
  const c = JSON.parse(R.m.get(CELLS).body); assert.equal(c.source_status, 'down'); assert.equal(c.retrieved_at, '2026-11-07T09:45:00.000Z'); assert.equal(c.failed_at, '2026-11-07T09:46:10.000Z');
});
await t('P4. RECOVERY: R2 publication succeeds, the D1 latest_at update fails → next attempt recognises its own objects, reconciles D1, rewrites nothing', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A'); await process_(d, R, 'r', 'A');
  D1fail.re = /SET latest_at/;
  await assert.rejects(publish(d, R, 'r'), /D1 stub/);
  assert.equal(R.m.get(LATEST).meta.run_id, 'r', 'R2 latest/ already holds r'); assert.equal(d.prepare("SELECT latest_at FROM firms_outputs").get().latest_at, null);
  const puts = R.log.length, etagL = R.m.get(LATEST).etag;
  assert.equal(await publish(d, R, 'r'), 'published', 'C1 recognised ours; C2 then wrote the counts');
  assert.equal(R.m.get(LATEST).etag, etagL, 'latest/ NOT rewritten'); assert.equal(R.log.length, puts + 1, 'only the counts file was written');
  const o = d.prepare('SELECT latest_at, cells_at, publish_state FROM firms_outputs').get(); assert.ok(o.latest_at && o.cells_at); assert.equal(o.publish_state, 'published');
});
await t('P5. RECOVERY: both objects published, the D1 cells_at update fails → next attempt reconciles D1 with ZERO writes to R2', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A'); await process_(d, R, 'r', 'A');
  D1fail.re = /SET cells_at/;
  await assert.rejects(publish(d, R, 'r'), /D1 stub/);
  const puts = R.log.length; assert.equal(await publish(d, R, 'r'), 'reconciled-only'); assert.equal(R.log.length, puts, 'no R2 write');
  assert.equal(d.prepare('SELECT publish_state FROM firms_outputs').get().publish_state, 'published');
});
await t('P6. partial publication repair: latest/ ok, counts put fails → retry writes only the counts', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A'); await process_(d, R, 'r', 'A');
  R.fail.put = k => k === CELLS; await assert.rejects(publish(d, R, 'r'), /R2 stub/);
  const etagL = R.m.get(LATEST).etag; assert.equal(await publish(d, R, 'r'), 'published'); assert.equal(R.m.get(LATEST).etag, etagL);
  assert.equal(JSON.parse(R.m.get(CELLS).body).run_id, 'r');
});
await t('P7. partial repair stopped by a newer run: r\'s latest/ ok, counts fail; s publishes fully; r\'s retry must not touch either file', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'r', '2026-11-07T09:45:00.000Z'); register(d, 's', '2026-11-07T10:00:00.000Z');
  claim(d, 'r', 'A'); await process_(d, R, 'r', 'A'); R.fail.put = k => k === CELLS; await assert.rejects(publish(d, R, 'r'), /R2 stub/);
  claim(d, 's', 'S'); await process_(d, R, 's', 'S'); assert.equal(await publish(d, R, 's'), 'published');
  const l = R.m.get(LATEST).etag, c = R.m.get(CELLS).etag; assert.equal(await publish(d, R, 'r'), 'stop:newer');
  assert.equal(R.m.get(LATEST).etag, l); assert.equal(R.m.get(CELLS).etag, c);
});
await t('P8. older run paused between head() and put while a newer run publishes → its conditional put returns null; newer stands', async () => {
  const R = r2({ now: () => NOW }); const me = { run_id: 'old', retrieved_at: '2026-11-07T09:30:00.000Z' };
  await R.put(LATEST, 'x', { customMetadata: { run_id: 'prev', retrieved_at: '2026-11-07T09:00:00.000Z' } });
  const h = await R.head(LATEST);   // old sees "prev" (older) …
  await R.put(LATEST, 'NEW', { onlyIf: { etagMatches: h.etag }, customMetadata: { run_id: 'new', retrieved_at: '2026-11-07T09:45:00.000Z' } });   // … new wins meanwhile
  assert.equal(await R.put(LATEST, 'OLD', { onlyIf: { etagMatches: h.etag }, customMetadata: me }), null);
  assert.equal(R.m.get(LATEST).body, 'NEW');
});
await t('P9. BOTH shared objects absent: create-only verified → written once each; a second creator gets null; unverified → refused, nothing written', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A'); await process_(d, R, 'r', 'A');
  assert.equal(await publish(d, R, 'r'), 'published'); assert.ok(R.m.has(LATEST) && R.m.has(CELLS));
  assert.equal(await R.put(LATEST, 'y', { onlyIf: { etagDoesNotMatch: '*' } }), null, 'create-only refuses when present');
  const d2 = mkdb(), R2 = r2({ now: () => NOW }); register(d2, 'r', '2026-11-07T09:45:00.000Z'); claim(d2, 'r', 'A'); await process_(d2, R2, 'r', 'A');
  assert.equal(await publish(d2, R2, 'r', { createOnlyVerified: false }), 'stop:refused-absent'); assert.ok(!R2.m.has(LATEST) && !R2.m.has(CELLS));
});
await t('P10. only latest-cells absent (latest/ present): counts created with create-only; unverified → counts refused, latest/ stays ours', async () => {
  const d = mkdb(), R = r2({ now: () => NOW }); register(d, 'r', '2026-11-07T09:45:00.000Z'); claim(d, 'r', 'A'); await process_(d, R, 'r', 'A');
  R.fail.put = k => k === CELLS; await assert.rejects(publish(d, R, 'r'), /R2 stub/);   // latest/ created, cells never existed
  assert.equal(await publish(d, R, 'r', { createOnlyVerified: false }), 'cells:refused-absent');
  assert.equal(await publish(d, R, 'r', { createOnlyVerified: true }), 'published');
});
await t('P11. LEGACY ordering: uploaded before our retrieval → older (replaced); uploaded after → UNCERTAIN, deferred, not overwritten', async () => {
  const R = r2({ now: () => NOW });
  NOW = Date.parse('2026-11-07T09:40:00.000Z'); await R.put(LATEST, 'legacy');   // no run_id metadata
  assert.equal(order(await R.head(LATEST), { run_id: 'r', retrieved_at: '2026-11-07T09:45:00.000Z' }), 'older');
  assert.equal(order(await R.head(LATEST), { run_id: 'q', retrieved_at: '2026-11-07T09:35:00.000Z' }), 'uncertain');
  const d = mkdb(); register(d, 'q', '2026-11-07T09:35:00.000Z'); claim(d, 'q', 'Q'); await process_(d, R, 'q', 'Q');
  assert.equal(await publish(d, R, 'q'), 'stop:uncertain'); assert.equal(R.m.get(LATEST).body, 'legacy');
  assert.notEqual(d.prepare("SELECT publish_state s FROM firms_outputs").get().s, 'superseded', 'not recorded as superseded by a newer run');
});
console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
