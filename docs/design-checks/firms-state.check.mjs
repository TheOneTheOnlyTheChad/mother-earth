// DESIGN CHECK (not hub code): proves the SQL of docs/FIRMS-MEMORY-DESIGN.md rev 4 §2 against a REAL SQLite engine (node:sqlite).
// D1 is SQLite with one writer; each statement is atomic and a batch is one transaction (Cloudflare D1 docs). Concurrency is
// modelled as the interleavings the single writer can produce: every statement runs whole, in some order.
// Usage: node --no-warnings docs/design-checks/firms-state.check.mjs
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

let passed = 0, failed = 0;
const t = (n, fn) => { try { fn(); passed++; console.log('ok -', n); } catch (e) { failed++; console.log('FAIL -', n, '\n   ', String(e.message).split('\n').slice(0, 3).join('\n    ')); } };

export const SCHEMA = `
CREATE TABLE firms_identity (retrieved_at TEXT PRIMARY KEY, run_id TEXT NOT NULL UNIQUE, kind TEXT NOT NULL);
CREATE TABLE firms_inputs (run_id TEXT PRIMARY KEY REFERENCES firms_identity(run_id), raw_key TEXT NOT NULL UNIQUE,
  scheduled_at TEXT NOT NULL, retrieved_at TEXT NOT NULL UNIQUE, bytes INTEGER NOT NULL, sha256 TEXT NOT NULL,
  content_length INTEGER, created_at TEXT NOT NULL, collector_version TEXT NOT NULL);
CREATE TABLE firms_attempts (run_id TEXT NOT NULL REFERENCES firms_inputs(run_id), attempt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE, invocation TEXT NOT NULL, started_at TEXT NOT NULL, lease_until TEXT NOT NULL,
  finished_at TEXT, outcome TEXT, note TEXT, PRIMARY KEY (run_id, attempt));
CREATE TABLE firms_outputs (run_id TEXT PRIMARY KEY REFERENCES firms_inputs(run_id), attempt INTEGER NOT NULL, token TEXT NOT NULL,
  retrieved_at TEXT NOT NULL UNIQUE, day TEXT NOT NULL,
  snapshot_key TEXT NOT NULL UNIQUE, snapshot_bytes INTEGER NOT NULL, snapshot_sha256 TEXT NOT NULL, records INTEGER NOT NULL,
  aux_key TEXT NOT NULL UNIQUE, aux_bytes INTEGER NOT NULL, format TEXT NOT NULL, completed_at TEXT NOT NULL,
  publish_attempts INTEGER NOT NULL DEFAULT 0, latest_at TEXT, cells_at TEXT, superseded_at TEXT);
CREATE INDEX firms_inputs_created ON firms_inputs (created_at);
CREATE INDEX firms_outputs_day ON firms_outputs (day, retrieved_at);
CREATE INDEX firms_outputs_unpublished ON firms_outputs (retrieved_at) WHERE cells_at IS NULL AND superseded_at IS NULL;
`;
// §2.2 — the claim: ONE statement. Inserts only if (bound) fewer than 3 attempts, (exclusive) no unexpired unfinished attempt,
// and (pointless otherwise) no committed output. The caller proceeds only if changes === 1.
export const CLAIM = `INSERT INTO firms_attempts (run_id, attempt, token, invocation, started_at, lease_until)
  SELECT ?1, COALESCE(MAX(a.attempt), 0) + 1, ?2, ?3, ?4, ?5 FROM firms_attempts a WHERE a.run_id = ?1
  HAVING COALESCE(MAX(a.attempt), 0) < 3
     AND NOT EXISTS (SELECT 1 FROM firms_attempts b WHERE b.run_id = ?1 AND b.finished_at IS NULL AND b.lease_until > ?4)
     AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = ?1)`;
// §2.3 — the commit fence: the output is recorded only by the attempt that is still the LATEST attempt for its input,
// identified by its token. A stale attempt (a later attempt exists) or a duplicate commit inserts nothing (changes === 0).
export const COMMIT = `INSERT INTO firms_outputs (run_id, attempt, token, retrieved_at, day, snapshot_key, snapshot_bytes, snapshot_sha256, records,
    aux_key, aux_bytes, format, completed_at)
  SELECT a.run_id, a.attempt, a.token, i.retrieved_at, substr(i.retrieved_at, 1, 10), ?2, ?3, ?4, ?5, ?6, ?7, 'lines/1', ?8
  FROM firms_attempts a JOIN firms_inputs i ON i.run_id = a.run_id
  WHERE a.token = ?1 AND a.finished_at IS NULL
    AND a.attempt = (SELECT MAX(attempt) FROM firms_attempts m WHERE m.run_id = a.run_id)
    AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = a.run_id)`;
export const FINISH = `UPDATE firms_attempts SET finished_at = ?2, outcome = ?3 WHERE token = ?1 AND finished_at IS NULL`;
// §5 — a publication attempt (no lease needed: it only ever publishes the committed output, by CAS) is bounded atomically.
export const PUBLISH_CLAIM = `UPDATE firms_outputs SET publish_attempts = publish_attempts + 1
  WHERE run_id = ?1 AND publish_attempts < 3 AND cells_at IS NULL AND superseded_at IS NULL`;
// §6 — retry discovery: at most one row each; both bounded by indexes.
export const FIND_UNPROCESSED = `SELECT i.run_id, i.retrieved_at FROM firms_inputs i
  WHERE i.created_at > ?1 AND i.retrieved_at > ?2 AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = i.run_id)
  ORDER BY i.retrieved_at DESC LIMIT 1`;
export const FIND_UNPUBLISHED = `SELECT run_id, retrieved_at FROM firms_outputs
  WHERE cells_at IS NULL AND superseded_at IS NULL AND publish_attempts < 3 ORDER BY retrieved_at DESC LIMIT 1`;
// §7 — checkpoint input for day D: committed new-format outputs only (never a listing of objects).
export const CHECKPOINT_INPUT = `SELECT run_id, snapshot_key, aux_key, retrieved_at FROM firms_outputs WHERE day = ?1 ORDER BY retrieved_at DESC, run_id DESC LIMIT 1`;

const db = () => { const d = new DatabaseSync(':memory:'); d.exec('PRAGMA foreign_keys = ON;' + SCHEMA); return d; };
const T0 = '2026-11-07T10:00:00.000Z', LEASE = '2026-11-07T10:15:00.000Z';
const input = (d, run, at) => { d.prepare('INSERT INTO firms_identity VALUES (?,?,?)').run(at, run, 'input');
  d.prepare("INSERT INTO firms_inputs VALUES (?,?,?,?,1,'h',NULL,?,'x')").run(run, 'raw/firms/' + run + '.csv', at, at, at); };
const claim = (d, run, tok, now, lease) => d.prepare(CLAIM).run(run, tok, 'inv-' + tok, now, lease).changes;
const commit = (d, tok, n = 1) => d.prepare(COMMIT).run(tok, `snapshots/firms/r-a${n}-${tok}.json`, 10, 's', 3, `snapshots/firms-aux/r-a${n}-${tok}.json`, 1, T0).changes;

t('C1. rev 3 SQL reproduced: two contenders both inserted (attempt 1 and 2), both active — GPT\'s finding', () => {
  const d = db(); input(d, 'r', T0);
  const REV3 = `INSERT INTO firms_attempts (run_id, attempt, token, invocation, started_at, lease_until)
    SELECT ?1, COALESCE(MAX(attempt), 0) + 1, ?2, 'i', ?3, ?4 FROM firms_attempts WHERE run_id = ?1 HAVING COALESCE(MAX(attempt), 0) < 3`;
  assert.equal(d.prepare(REV3).run('r', 'A', T0, LEASE).changes, 1); assert.equal(d.prepare(REV3).run('r', 'B', T0, LEASE).changes, 1);
  assert.equal(d.prepare('SELECT COUNT(*) n FROM firms_attempts WHERE finished_at IS NULL').get().n, 2, 'both active: not exclusive');
});
t('C2. rev 4 claim: A wins, B (any order after A) inserts nothing — exclusive, and the caller sees changes = 0', () => {
  const d = db(); input(d, 'r', T0);
  assert.equal(claim(d, 'r', 'A', T0, LEASE), 1); assert.equal(claim(d, 'r', 'B', T0, LEASE), 0);
  assert.equal(d.prepare('SELECT COUNT(*) n FROM firms_attempts').get().n, 1);
});
t('C3. bound: after 3 attempts (each finished or expired) a 4th claim inserts nothing', () => {
  const d = db(); input(d, 'r', T0);
  for (const [tok, now, lease] of [['A', T0, LEASE], ['B', '2026-11-07T10:16:00.000Z', '2026-11-07T10:31:00.000Z'], ['C', '2026-11-07T10:32:00.000Z', '2026-11-07T10:47:00.000Z']])
    assert.equal(claim(d, 'r', tok, now, lease), 1, tok);
  assert.equal(claim(d, 'r', 'D', '2026-11-07T11:00:00.000Z', '2026-11-07T11:15:00.000Z'), 0);
});
t('C4. a committed output blocks every further claim on that input', () => {
  const d = db(); input(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); assert.equal(commit(d, 'A'), 1);
  d.prepare(FINISH).run('A', T0, 'ok');
  assert.equal(claim(d, 'r', 'B', '2026-11-07T11:00:00.000Z', '2026-11-07T11:15:00.000Z'), 0);
});
t('C5. STALE ATTEMPT: A claims, stalls past its lease; B claims and commits; A resumes → A\'s commit inserts nothing', () => {
  const d = db(); input(d, 'r', T0);
  assert.equal(claim(d, 'r', 'A', T0, LEASE), 1);
  assert.equal(claim(d, 'r', 'B', '2026-11-07T10:16:00.000Z', '2026-11-07T10:31:00.000Z'), 1, 'A\'s lease expired');
  assert.equal(commit(d, 'B', 2), 1);
  assert.equal(commit(d, 'A', 1), 0, 'A is not the latest attempt and an output exists');
  const o = d.prepare('SELECT attempt, token, snapshot_key FROM firms_outputs').get();
  assert.equal(o.token, 'B'); assert.match(o.snapshot_key, /-a2-B\.json$/, 'the winning output names B\'s own immutable keys');
});
t('C6. STALE ATTEMPT before the replacement commits: B claimed, A resumes first → A fenced; B then commits', () => {
  const d = db(); input(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); claim(d, 'r', 'B', '2026-11-07T10:16:00.000Z', '2026-11-07T10:31:00.000Z');
  assert.equal(commit(d, 'A', 1), 0, 'a later attempt exists'); assert.equal(commit(d, 'B', 2), 1);
});
t('C7. no replacement: A overruns its lease but nobody claimed → A may still commit (fence is "latest attempt", not the clock)', () => {
  const d = db(); input(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); assert.equal(commit(d, 'A'), 1);
});
t('C8. duplicate commit by the same attempt inserts nothing the second time', () => {
  const d = db(); input(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); assert.equal(commit(d, 'A'), 1); assert.equal(commit(d, 'A'), 0);
});
t('C9. publication claims are bounded and atomic: 3 succeed, the 4th does not; none once cells_at is set', () => {
  const d = db(); input(d, 'r', T0); claim(d, 'r', 'A', T0, LEASE); commit(d, 'A');
  for (let k = 0; k < 3; k++) assert.equal(d.prepare(PUBLISH_CLAIM).run('r').changes, 1);
  assert.equal(d.prepare(PUBLISH_CLAIM).run('r').changes, 0);
  const d2 = db(); input(d2, 'r', T0); claim(d2, 'r', 'A', T0, LEASE); commit(d2, 'A'); d2.prepare("UPDATE firms_outputs SET latest_at = ?, cells_at = ? WHERE run_id = 'r'").run(T0, T0);
  assert.equal(d2.prepare(PUBLISH_CLAIM).run('r').changes, 0);
});
t('C10. identity: two runs cannot share a retrieved_at — the second identity claim fails (§8)', () => {
  const d = db(); d.prepare('INSERT INTO firms_identity VALUES (?,?,?)').run(T0, 'r1', 'input');
  assert.throws(() => d.prepare('INSERT INTO firms_identity VALUES (?,?,?)').run(T0, 'r2', 'down'), /UNIQUE/);
  assert.equal(d.prepare('INSERT OR IGNORE INTO firms_identity VALUES (?,?,?)').run(T0, 'r2', 'down').changes, 0, 'the writer sees 0 and must not publish under that time');
});
t('C11. checkpoint input = committed outputs only: an input whose output never committed is not a candidate', () => {
  const d = db(); input(d, 'r1', '2026-11-06T23:30:00.000Z'); input(d, 'r2', '2026-11-06T23:45:00.000Z');
  claim(d, 'r1', 'A', T0, LEASE); commit(d, 'A'); claim(d, 'r2', 'B', T0, LEASE);   // r2 claimed, objects maybe written, never committed
  assert.equal(d.prepare(CHECKPOINT_INPUT).get('2026-11-06').run_id, 'r1');
});
t('C12. retry discovery returns the newest unprocessed input newer than the publication; nothing older', () => {
  const d = db(); input(d, 'r1', '2026-11-07T09:30:00.000Z'); input(d, 'r2', '2026-11-07T09:45:00.000Z');
  assert.equal(d.prepare(FIND_UNPROCESSED).get('2026-11-05T10:00:00.000Z', '2026-11-07T09:00:00.000Z').run_id, 'r2');
  assert.equal(d.prepare(FIND_UNPROCESSED).get('2026-11-05T10:00:00.000Z', '2026-11-07T09:50:00.000Z'), undefined);
});
t('C13. bounded reads as tables grow: 100,000 runs — every query is an index SEARCH, no table SCAN; timing flat', () => {
  const d = db(); const ins = d.prepare("INSERT INTO firms_identity VALUES (?,?,'input')"), inp = d.prepare("INSERT INTO firms_inputs VALUES (?,?,?,?,1,'h',NULL,?,'x')"),
    att = d.prepare("INSERT INTO firms_attempts (run_id, attempt, token, invocation, started_at, lease_until, finished_at, outcome) VALUES (?,1,?,'i',?,?,?,'ok')"),
    out = d.prepare("INSERT INTO firms_outputs (run_id, attempt, token, retrieved_at, day, snapshot_key, snapshot_bytes, snapshot_sha256, records, aux_key, aux_bytes, format, completed_at, latest_at, cells_at) VALUES (?,1,?,?,?,?,1,'s',1,?,1,'lines/1',?,?,?)");
  d.exec('BEGIN'); const base = Date.parse('2024-01-01T00:00:00Z');
  for (let k = 0; k < 100000; k++) { const at = new Date(base + k * 900e3).toISOString(), r = 'r' + k;
    ins.run(at, r); inp.run(r, 'raw/' + r, at, at, at); att.run(r, 'tok' + k, at, at, at); out.run(r, 'tok' + k, at, at.slice(0, 10), 's/' + r, 'a/' + r, at, at, at); }
  d.exec('COMMIT');
  const plans = { FIND_UNPROCESSED: [FIND_UNPROCESSED, ['2026-11-05', '2026-11-07']], FIND_UNPUBLISHED: [FIND_UNPUBLISHED, []], CHECKPOINT_INPUT: [CHECKPOINT_INPUT, ['2026-11-06']],
    CLAIM: [CLAIM, ['r5', 'x', 'i', T0, LEASE]], COMMIT: [COMMIT, ['x', 'k', 1, 's', 1, 'a', 1, T0]], PUBLISH_CLAIM: [PUBLISH_CLAIM, ['r5']] };
  for (const [name, [sql, args]] of Object.entries(plans)) {
    const p = d.prepare('EXPLAIN QUERY PLAN ' + sql).all(...args).map(r => r.detail).join(' | ');
    assert.ok(!/SCAN (firms_inputs|firms_outputs|firms_attempts|firms_identity)(?! USING)/.test(p), name + ' → ' + p);
  }
  const ms = (sql, args) => { const s = process.hrtime.bigint(); for (let k = 0; k < 200; k++) d.prepare(sql).all(...args); return Number(process.hrtime.bigint() - s) / 1e6 / 200; };
  const a = ms(FIND_UNPROCESSED, ['2026-11-05', '2099-01-01']), b = ms(FIND_UNPUBLISHED, []), c = ms(CHECKPOINT_INPUT, ['2026-11-06']);
  console.log(`   per query at 100k rows (local SQLite, not D1): unprocessed ${a.toFixed(3)} ms · unpublished ${b.toFixed(3)} ms · checkpoint input ${c.toFixed(3)} ms`);
  assert.ok(a < 5 && b < 5 && c < 5);
});
console.log(`\n${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
