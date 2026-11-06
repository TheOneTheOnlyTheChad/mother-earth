// DESIGN CHECK (not hub code): the SQL of docs/FIRMS-MEMORY-DESIGN.md rev 5 §2, executed by a REAL SQLite engine (node:sqlite).
// D1 is SQLite with one writer: each statement is atomic and a batch() is one transaction (Cloudflare D1 docs). Concurrency is
// modelled as the interleavings that writer can produce: every statement (or batch) runs whole, in some order.
// Usage: node --no-warnings docs/design-checks/firms-state.check.mjs
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

let passed = 0, failed = 0;
const t = (n, fn) => { try { fn(); passed++; console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e.message).split('\n').slice(0, 3).join('\n    ')); } };

import { SCHEMA, CLAIM, CLAIM_COUNT, COMMIT, COMMIT_DONE, FAIL_FENCE, FAIL_STALE, PUBLISH_CLAIM, PUBLISHED, SWEEP_INPUTS_SUPERSEDED, SWEEP_INPUTS_EXPIRED, SWEEP_OUTPUTS_SUPERSEDED, SWEEP_OUTPUTS_EXPIRED, FIND_UNPROCESSED, FIND_UNPUBLISHED, CHECKPOINT_INPUT, IDENTITY, CUTOVER, INPUT } from './firms-state.sql.mjs';

const mk = () => { const d = new DatabaseSync(':memory:'); d.exec('PRAGMA foreign_keys = ON;' + SCHEMA); return d; };
const batch = (d, stmts) => { d.exec('BEGIN'); try { const r = stmts.map(([sql, args]) => d.prepare(sql).run(...args)); d.exec('COMMIT'); return r; } catch (e) { d.exec('ROLLBACK'); throw e; } };
const T0 = '2026-11-07T10:00:00.000Z', LEASE = '2026-11-07T10:15:00.000Z';
const register = (d, run, at) => batch(d, [[CUTOVER, [at]], [IDENTITY, [at, run, 'input', at]], [INPUT, [run, 'raw/firms/' + run + '.csv', at, at]]]);
const claim = (d, run, tok, now, lease) => batch(d, [[CLAIM, [run, tok, 'inv-' + tok, now, lease]], [CLAIM_COUNT, [run, tok]]])[0].changes;
const commit = (d, tok, n = 1) => batch(d, [[COMMIT, [tok, `snapshots/firms/r-a${n}-${tok}.json`, 10, 's', 3, `snapshots/firms-aux/r-a${n}-${tok}.json`, 1, T0]], [COMMIT_DONE, [tok]]])[0].changes;

// ---------- rev 4 checks, kept (C1–C12) ----------
t('C1. rev-3 claim reproduced: two contenders both insert, both active (GPT\'s finding)', () => {
  const d = mk(); register(d, 'r', T0);
  const REV3 = `INSERT INTO firms_attempts (run_id, attempt, token, invocation, started_at, lease_until)
    SELECT ?1, COALESCE(MAX(attempt), 0) + 1, ?2, 'i', ?3, ?4 FROM firms_attempts WHERE run_id = ?1 HAVING COALESCE(MAX(attempt), 0) < 3`;
  assert.equal(d.prepare(REV3).run('r', 'A', T0, LEASE).changes, 1); assert.equal(d.prepare(REV3).run('r', 'B', T0, LEASE).changes, 1);
});
t('C2. exclusive claim: the second contender inserts nothing and its counter does not move', () => {
  const d = mk(); register(d, 'r', T0); assert.equal(claim(d, 'r', 'A', T0, LEASE), 1); assert.equal(claim(d, 'r', 'B', T0, LEASE), 0);
  assert.equal(d.prepare("SELECT attempts_used n FROM firms_inputs WHERE run_id='r'").get().n, 1);
});
t('C3. bound: a 4th claim inserts nothing; attempts_used = 3 takes the input out of the eligible index', () => {
  const d = mk(); register(d, 'r', T0);
  claim(d, 'r', 'A', T0, LEASE); claim(d, 'r', 'B', '2026-11-07T10:16:00.000Z', '2026-11-07T10:31:00.000Z'); claim(d, 'r', 'C', '2026-11-07T10:32:00.000Z', '2026-11-07T10:47:00.000Z');
  assert.equal(claim(d, 'r', 'D', '2026-11-07T11:00:00.000Z', '2026-11-07T11:15:00.000Z'), 0);
  assert.equal(d.prepare(FIND_UNPROCESSED).get('2026-11-07T00:00:00.000Z'), undefined, 'exhausted: not discoverable');
});
t('C4. a committed output blocks further claims and marks the input done', () => {
  const d = mk(); register(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); assert.equal(commit(d, 'A'), 1);
  assert.equal(claim(d, 'r', 'B', '2026-11-07T11:00:00.000Z', '2026-11-07T11:15:00.000Z'), 0);
  assert.equal(d.prepare("SELECT state FROM firms_inputs WHERE run_id='r'").get().state, 'done');
});
t('C5. stale attempt resumes after its replacement committed → its commit inserts nothing', () => {
  const d = mk(); register(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); claim(d, 'r', 'B', '2026-11-07T10:16:00.000Z', '2026-11-07T10:31:00.000Z');
  assert.equal(commit(d, 'B', 2), 1); assert.equal(commit(d, 'A', 1), 0);
  assert.match(d.prepare('SELECT snapshot_key k FROM firms_outputs').get().k, /-a2-B\.json$/);
});
t('C6. stale attempt resumes before the replacement commits → still fenced', () => {
  const d = mk(); register(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); claim(d, 'r', 'B', '2026-11-07T10:16:00.000Z', '2026-11-07T10:31:00.000Z');
  assert.equal(commit(d, 'A', 1), 0); assert.equal(commit(d, 'B', 2), 1);
});
t('C7. overrun with no replacement may commit (the fence is "latest attempt", not the clock)', () => {
  const d = mk(); register(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); assert.equal(commit(d, 'A'), 1);
});
t('C8. duplicate commit by the same attempt inserts nothing', () => {
  const d = mk(); register(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); assert.equal(commit(d, 'A'), 1); assert.equal(commit(d, 'A'), 0);
});
t('C9. publication claims: 3 succeed, the 4th does not; the 3rd claim removes the row from the eligible index', () => {
  const d = mk(); register(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); commit(d, 'A');
  for (let k = 0; k < 3; k++) assert.equal(d.prepare(PUBLISH_CLAIM).run('r').changes, 1);
  assert.equal(d.prepare(PUBLISH_CLAIM).run('r').changes, 0);
  assert.equal(d.prepare(FIND_UNPUBLISHED).get('2026-11-07T00:00:00.000Z'), undefined);
});
t('C10. identity: a collecting run whose retrieved_at is taken cannot register (whole batch rolls back)', () => {
  const d = mk(); register(d, 'r1', T0);
  assert.throws(() => batch(d, [[IDENTITY, [T0, 'r2', 'input', T0]], [INPUT, ['r2', 'raw/r2', T0, T0]]]), /FOREIGN KEY|UNIQUE/);
  assert.equal(d.prepare("SELECT COUNT(*) n FROM firms_inputs WHERE run_id='r2'").get().n, 0);
});
t('C11. checkpoint input = committed outputs only', () => {
  const d = mk(); register(d, 'r1', '2026-11-06T23:30:00.000Z'); register(d, 'r2', '2026-11-06T23:45:00.000Z');
  claim(d, 'r1', 'A', T0, LEASE); commit(d, 'A'); claim(d, 'r2', 'B', T0, LEASE);
  assert.equal(d.prepare(CHECKPOINT_INPUT).get('2026-11-06').run_id, 'r1');
});
t('C12. discovery returns the newest eligible input newer than the publication; nothing older', () => {
  const d = mk(); register(d, 'r1', '2026-11-07T09:30:00.000Z'); register(d, 'r2', '2026-11-07T09:45:00.000Z');
  assert.equal(d.prepare(FIND_UNPROCESSED).get('2026-11-07T09:00:00.000Z').run_id, 'r2');
  assert.equal(d.prepare(FIND_UNPROCESSED).get('2026-11-07T09:50:00.000Z'), undefined);
});

// ---------- rev 5 ----------
t('C14. sweeps: newer publication → ready inputs/pending outputs superseded; older than 36 h → expired; both leave the index', () => {
  const d = mk(); register(d, 'old', '2026-11-05T09:00:00.000Z'); register(d, 'mid', '2026-11-07T08:00:00.000Z'); register(d, 'new', '2026-11-07T09:45:00.000Z');
  d.prepare(SWEEP_INPUTS_EXPIRED).run('2026-11-05T22:00:00.000Z'); d.prepare(SWEEP_INPUTS_SUPERSEDED).run('2026-11-07T09:30:00.000Z');
  assert.deepEqual(d.prepare('SELECT run_id, state FROM firms_inputs ORDER BY retrieved_at').all().map(r => r.run_id + ':' + r.state), ['old:expired', 'mid:superseded', 'new:ready']);
  assert.equal(d.prepare(FIND_UNPROCESSED).get('2026-11-07T09:30:00.000Z').run_id, 'new');
});
t('C15. GROWING INELIGIBLE BACKLOGS (GPT\'s case): exhausted, superseded, expired, done and published rows at 1k/10k/100k — discovery reads only the eligible index; time does not grow', () => {
  const sizes = [1000, 10000, 100000], times = { unprocessed: [], unpublished: [] };
  for (const n of sizes) {
    const d = mk(); d.exec('BEGIN');
    const idn = d.prepare("INSERT INTO firms_identity VALUES (?,?,'input',?)"),
      inp = d.prepare("INSERT INTO firms_inputs (run_id, raw_key, scheduled_at, retrieved_at, bytes, sha256, created_at, collector_version, state, attempts_used) VALUES (?,?,?,?,1,'h',?,'x',?,?)"),
      out = d.prepare("INSERT INTO firms_outputs (run_id, attempt, token, retrieved_at, day, snapshot_key, snapshot_bytes, snapshot_sha256, records, aux_key, aux_bytes, format, completed_at, publish_state, publish_attempts) VALUES (?,1,?,?,?,?,1,'s',1,?,1,'lines/1',?,?,?)");
    const base = Date.parse('2024-01-01T00:00:00Z');
    for (let k = 0; k < n; k++) {   // five ineligible classes, interleaved through time
      const at = new Date(base + k * 60e3).toISOString(), r = 'r' + k, cls = k % 5;
      idn.run(at, r, at);
      inp.run(r, 'raw/' + r, at, at, at, ['ready', 'superseded', 'expired', 'done', 'done'][cls], cls === 0 ? 3 : 1);   // cls 0 = exhausted
      if (cls >= 3) out.run(r, 't' + k, at, at.slice(0, 10), 's/' + r, 'a/' + r, at, cls === 3 ? 'pending' : ['published', 'superseded', 'expired'][k % 3], cls === 3 ? 3 : 1);   // cls 3 = publication exhausted
    }
    // the only eligible work: one input and one output OLDER than the whole backlog — the worst case, where a query that
    // walked the ineligible rows (newest first) would have to pass all of them before reaching it
    const at = '2023-06-01T09:45:00.000Z'; idn.run(at, 'live', at); inp.run('live', 'raw/live', at, at, at, 'ready', 0);
    const at2 = '2023-06-01T09:40:00.000Z'; idn.run(at2, 'liveout', at2); inp.run('liveout', 'raw/liveout', at2, at2, at2, 'done', 1);
    out.run('liveout', 'tl', at2, '2023-06-01', 's/liveout', 'a/liveout', at2, 'pending', 0);
    d.exec('COMMIT'); d.exec('ANALYZE');
    assert.equal(d.prepare(FIND_UNPROCESSED).get('2023-01-01T00:00:00.000Z').run_id, 'live');   // found although 99.9% of rows are newer
    assert.equal(d.prepare(FIND_UNPUBLISHED).get('2023-01-01T00:00:00.000Z').run_id, 'liveout');
    for (const [sql, idx] of [[FIND_UNPROCESSED, 'firms_inputs_eligible'], [FIND_UNPUBLISHED, 'firms_outputs_eligible']]) {
      const plan = d.prepare('EXPLAIN QUERY PLAN ' + sql).all('2023-01-01T00:00:00.000Z').map(r => r.detail).join(' | ');
      assert.match(plan, new RegExp('USING (COVERING )?INDEX ' + idx), plan);
    }
    const eligibleIn = d.prepare("SELECT COUNT(*) n FROM firms_inputs INDEXED BY firms_inputs_eligible WHERE state = 'ready' AND attempts_used < 3").get().n;
    const eligibleOut = d.prepare("SELECT COUNT(*) n FROM firms_outputs INDEXED BY firms_outputs_eligible WHERE publish_state = 'pending' AND publish_attempts < 3").get().n;
    assert.equal(eligibleIn, 1, 'the eligible input index holds only eligible rows'); assert.equal(eligibleOut, 1);
    const ms = sql => { for (let k = 0; k < 50; k++) d.prepare(sql).get('2023-01-01T00:00:00.000Z'); const s = process.hrtime.bigint(); for (let k = 0; k < 500; k++) d.prepare(sql).get('2023-01-01T00:00:00.000Z'); return Number(process.hrtime.bigint() - s) / 1e6 / 500; };
    times.unprocessed.push(ms(FIND_UNPROCESSED)); times.unpublished.push(ms(FIND_UNPUBLISHED));
  }
  console.log('   ms/query at', sizes.join(' / '), 'ineligible rows (local SQLite, not D1):', 'unprocessed', times.unprocessed.map(x => x.toFixed(4)).join(' / '), '· unpublished', times.unpublished.map(x => x.toFixed(4)).join(' / '));
  for (const k of ['unprocessed', 'unpublished']) assert.ok(times[k][2] < times[k][0] * 5 + 0.05, k + ' grew with the backlog: ' + times[k].join(', '));
});
t('C16. GPT\'s rev-4 regression reproduced: with exhausted publications left in a pending-only index the query grows', () => {
  const sizes = [1000, 100000], tt = [];
  for (const n of sizes) {
    const d = new DatabaseSync(':memory:');
    d.exec(`CREATE TABLE o (run_id TEXT PRIMARY KEY, retrieved_at TEXT, cells_at TEXT, superseded_at TEXT, publish_attempts INTEGER);
            CREATE INDEX o_unpub ON o (retrieved_at) WHERE cells_at IS NULL AND superseded_at IS NULL;`);
    d.exec('BEGIN'); const ins = d.prepare('INSERT INTO o VALUES (?,?,NULL,NULL,3)');
    for (let k = 0; k < n; k++) ins.run('r' + k, new Date(Date.parse('2024-01-01T00:00:00Z') + k * 60e3).toISOString());
    d.exec('COMMIT');
    const q = d.prepare('SELECT run_id FROM o WHERE cells_at IS NULL AND superseded_at IS NULL AND publish_attempts < 3 ORDER BY retrieved_at DESC LIMIT 1');
    const s = process.hrtime.bigint(); for (let k = 0; k < 20; k++) q.get(); tt.push(Number(process.hrtime.bigint() - s) / 1e6 / 20);
  }
  console.log('   rev-4 shape, ms/query at 1k / 100k exhausted rows:', tt.map(x => x.toFixed(3)).join(' / '));
  assert.ok(tt[1] > tt[0] * 10, 'expected growth (this is the bug rev 5 removes)');
});
t('C17. FAILURE FENCE: A stalls; B claims, commits; A resumes with an error → A may NOT report publicly (changes 0); recorded as fenced-failure', () => {
  const d = mk(); register(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); claim(d, 'r', 'B', '2026-11-07T10:16:00.000Z', '2026-11-07T10:31:00.000Z');
  assert.equal(commit(d, 'B', 2), 1);
  assert.equal(d.prepare(FAIL_FENCE).run('A', '2026-11-07T10:40:00.000Z', 'read error').changes, 0);
  assert.equal(d.prepare(FAIL_STALE).run('A', '2026-11-07T10:40:00.000Z', 'read error').changes, 1);
  assert.equal(d.prepare("SELECT outcome FROM firms_attempts WHERE token='A'").get().outcome, 'fenced-failure');
});
t('C18. failure fence also holds before B commits (A not latest), and lets a genuine latest failure through', () => {
  const d = mk(); register(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); claim(d, 'r', 'B', '2026-11-07T10:16:00.000Z', '2026-11-07T10:31:00.000Z');
  assert.equal(d.prepare(FAIL_FENCE).run('A', '2026-11-07T10:20:00.000Z', 'x').changes, 0, 'A is not the latest attempt');
  assert.equal(d.prepare(FAIL_FENCE).run('B', '2026-11-07T10:21:00.000Z', 'x').changes, 1, 'B is latest, no output: may report');
});
t('C19. DOWN-RUN IDENTITY: repeated collisions re-stamp +1 ms; the actual failure time is kept separately; refusal after 3 tries; works across UTC midnight', () => {
  const d = mk();
  const downClaim = (run, actual) => { let at = Date.parse(actual);
    for (let k = 0; k < 3; k++, at += 1) if (d.prepare(IDENTITY).run(new Date(at).toISOString(), run, 'down', actual).changes === 1) return new Date(at).toISOString();
    return null; };
  const mid = '2026-11-06T23:59:59.999Z';
  d.prepare(IDENTITY).run(mid, 'x1', 'input', mid);
  const a = downClaim('d1', mid); assert.equal(a, '2026-11-07T00:00:00.000Z', 'pushed across midnight by 1 ms');
  assert.equal(d.prepare("SELECT actual_at FROM firms_identity WHERE run_id='d1'").get().actual_at, mid, 'actual failure time preserved, still 6 Nov');
  const b = downClaim('d2', mid); assert.equal(b, '2026-11-07T00:00:00.001Z', 'second collision → +2 ms');
  d.prepare(IDENTITY).run('2026-11-07T00:00:00.002Z', 'x2', 'input', '2026-11-07T00:00:00.002Z');
  assert.equal(downClaim('d3', mid), null, '3 tries exhausted → refused (no public down file; logged)');
  assert.equal(d.prepare("SELECT COUNT(*) n FROM firms_identity WHERE run_id='d3'").get().n, 0);
});
t('C20. collecting runs are never re-stamped: their identity is their real retrieval time or nothing', () => {
  const d = mk(); register(d, 'r1', T0);
  assert.equal(d.prepare(IDENTITY).run(T0, 'r2', 'input', T0).changes, 0, 'the caller abandons r2 — it does not retry with +1 ms');
});
t('C21. CUTOVER: set by the first registration, in its own batch, before the input row; later registrations do not move it', () => {
  const d = mk();
  assert.equal(d.prepare("SELECT value FROM firms_settings WHERE key='format_cutover_at'").get(), undefined, 'unset before any registration');
  register(d, 'r1', '2026-11-08T07:15:02.345Z'); register(d, 'r2', '2026-11-08T07:30:01.000Z');
  assert.equal(d.prepare("SELECT value FROM firms_settings WHERE key='format_cutover_at'").get().value, '2026-11-08T07:15:02.345Z');
  assert.throws(() => batch(d, [[CUTOVER, ['2026-11-09T00:00:00.000Z']], [IDENTITY, ['2026-11-08T07:15:02.345Z', 'r9', 'input', 'x']], [INPUT, ['r9', 'raw/r9', 'x', '2026-11-08T07:15:02.345Z']]]));
  assert.equal(d.prepare("SELECT value FROM firms_settings WHERE key='format_cutover_at'").get().value, '2026-11-08T07:15:02.345Z', 'a failed registration batch leaves the cutover unchanged');
});
console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
