// The SQL of docs/FIRMS-MEMORY-DESIGN.md rev 5 §2 (design, not hub code). Used by firms-state.check.mjs and firms-publish.check.mjs.
export const SCHEMA = `
CREATE TABLE firms_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE firms_identity (retrieved_at TEXT PRIMARY KEY, run_id TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, actual_at TEXT NOT NULL);
CREATE TABLE firms_inputs (run_id TEXT PRIMARY KEY REFERENCES firms_identity(run_id), raw_key TEXT NOT NULL UNIQUE,
  scheduled_at TEXT NOT NULL, retrieved_at TEXT NOT NULL UNIQUE, bytes INTEGER NOT NULL, sha256 TEXT NOT NULL,
  content_length INTEGER, created_at TEXT NOT NULL, collector_version TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'ready' CHECK (state IN ('ready','done','superseded','expired')), attempts_used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE firms_attempts (run_id TEXT NOT NULL REFERENCES firms_inputs(run_id), attempt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE, invocation TEXT NOT NULL, started_at TEXT NOT NULL, lease_until TEXT NOT NULL,
  finished_at TEXT, outcome TEXT, note TEXT, PRIMARY KEY (run_id, attempt));
CREATE TABLE firms_outputs (run_id TEXT PRIMARY KEY REFERENCES firms_inputs(run_id), attempt INTEGER NOT NULL, token TEXT NOT NULL,
  retrieved_at TEXT NOT NULL UNIQUE, day TEXT NOT NULL,
  snapshot_key TEXT NOT NULL UNIQUE, snapshot_bytes INTEGER NOT NULL, snapshot_sha256 TEXT NOT NULL, records INTEGER NOT NULL,
  aux_key TEXT NOT NULL UNIQUE, aux_bytes INTEGER NOT NULL, format TEXT NOT NULL, completed_at TEXT NOT NULL,
  publish_state TEXT NOT NULL DEFAULT 'pending' CHECK (publish_state IN ('pending','published','superseded','expired')),
  publish_attempts INTEGER NOT NULL DEFAULT 0, latest_at TEXT, cells_at TEXT);
-- ELIGIBLE-WORK indexes: a row is in them only while it can still be worked on. Exhausted rows (3 attempts used) leave by the
-- attempts expression; superseded / expired / done / published rows leave by their state. Their size is the eligible backlog only.
CREATE INDEX firms_inputs_eligible ON firms_inputs (retrieved_at) WHERE state = 'ready' AND attempts_used < 3;
CREATE INDEX firms_outputs_eligible ON firms_outputs (retrieved_at) WHERE publish_state = 'pending' AND publish_attempts < 3;
CREATE INDEX firms_outputs_day ON firms_outputs (day, retrieved_at);
`;
// §2.2 claim: ONE INSERT…SELECT (bound + no live owner + not done), then the input's attempt counter in the SAME batch, applied
// only if the claim inserted (EXISTS on the new token). Caller proceeds iff the first statement's changes === 1.
export const CLAIM = `INSERT INTO firms_attempts (run_id, attempt, token, invocation, started_at, lease_until)
  SELECT ?1, COALESCE(MAX(a.attempt), 0) + 1, ?2, ?3, ?4, ?5 FROM firms_attempts a WHERE a.run_id = ?1
  HAVING COALESCE(MAX(a.attempt), 0) < 3
     AND NOT EXISTS (SELECT 1 FROM firms_attempts b WHERE b.run_id = ?1 AND b.finished_at IS NULL AND b.lease_until > ?4)
     AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = ?1)`;
export const CLAIM_COUNT = `UPDATE firms_inputs SET attempts_used = attempts_used + 1
  WHERE run_id = ?1 AND EXISTS (SELECT 1 FROM firms_attempts WHERE token = ?2)`;
// §2.3 commit fence (unchanged from rev 4), then the input is marked done in the same batch.
export const COMMIT = `INSERT INTO firms_outputs (run_id, attempt, token, retrieved_at, day, snapshot_key, snapshot_bytes, snapshot_sha256, records,
    aux_key, aux_bytes, format, completed_at)
  SELECT a.run_id, a.attempt, a.token, i.retrieved_at, substr(i.retrieved_at, 1, 10), ?2, ?3, ?4, ?5, ?6, ?7, 'lines/1', ?8
  FROM firms_attempts a JOIN firms_inputs i ON i.run_id = a.run_id
  WHERE a.token = ?1 AND a.finished_at IS NULL
    AND a.attempt = (SELECT MAX(attempt) FROM firms_attempts m WHERE m.run_id = a.run_id)
    AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = a.run_id)`;
export const COMMIT_DONE = `UPDATE firms_inputs SET state = 'done' WHERE run_id = (SELECT run_id FROM firms_outputs WHERE token = ?1)`;
// §2.6 failure fence (rev 5): an attempt may REPORT its failure publicly only if it is still the latest attempt and no output exists.
export const FAIL_FENCE = `UPDATE firms_attempts SET finished_at = ?2, outcome = 'failed', note = ?3
  WHERE token = ?1 AND finished_at IS NULL
    AND attempt = (SELECT MAX(attempt) FROM firms_attempts m WHERE m.run_id = firms_attempts.run_id)
    AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = firms_attempts.run_id)`;
export const FAIL_STALE = `UPDATE firms_attempts SET finished_at = ?2, outcome = 'fenced-failure', note = ?3 WHERE token = ?1 AND finished_at IS NULL`;
// §2.4 publication claim: the row leaves the eligible index when the 3rd claim is taken (publish_attempts reaches 3).
export const PUBLISH_CLAIM = `UPDATE firms_outputs SET publish_attempts = publish_attempts + 1
  WHERE run_id = ?1 AND publish_state = 'pending' AND publish_attempts < 3`;
export const PUBLISHED = `UPDATE firms_outputs SET latest_at = COALESCE(latest_at, ?2), cells_at = ?3,
  publish_state = CASE WHEN ?3 IS NOT NULL THEN 'published' ELSE publish_state END WHERE run_id = ?1`;
// §6 sweeps (each touches only eligible rows, through the eligible index): newer publication → superseded; older than the 36-h
// warning line → expired (inputs and outputs live 2 days in R2; after 36 h they are not worth starting).
export const SWEEP_INPUTS_SUPERSEDED = `UPDATE firms_inputs SET state = 'superseded' WHERE state = 'ready' AND attempts_used < 3 AND retrieved_at < ?1`;
export const SWEEP_INPUTS_EXPIRED = `UPDATE firms_inputs SET state = 'expired' WHERE state = 'ready' AND attempts_used < 3 AND retrieved_at < ?1`;
export const SWEEP_OUTPUTS_SUPERSEDED = `UPDATE firms_outputs SET publish_state = 'superseded' WHERE publish_state = 'pending' AND publish_attempts < 3 AND retrieved_at < ?1`;
export const SWEEP_OUTPUTS_EXPIRED = `UPDATE firms_outputs SET publish_state = 'expired' WHERE publish_state = 'pending' AND publish_attempts < 3 AND retrieved_at < ?1`;
// §6 discovery: read only the eligible indexes.
export const FIND_UNPROCESSED = `SELECT i.run_id, i.retrieved_at FROM firms_inputs i
  WHERE i.state = 'ready' AND i.attempts_used < 3 AND i.retrieved_at > ?1
  ORDER BY i.retrieved_at DESC LIMIT 1`;
export const FIND_UNPUBLISHED = `SELECT run_id, retrieved_at FROM firms_outputs
  WHERE publish_state = 'pending' AND publish_attempts < 3 AND retrieved_at >= ?1 ORDER BY retrieved_at DESC LIMIT 1`;
// rev 6: ?1 = the retrieved_at of the CURRENT records publication (latest/ metadata; legacy: its upload time). ">=" includes the
// current run's own pending repair (records published, counts or D1 completion not); retrieved_at is unique per run, so equality
// means that run. Older runs are excluded here and retired by the superseded sweep ("<" — the current run is never swept).
export const CHECKPOINT_INPUT = `SELECT run_id, snapshot_key, aux_key, retrieved_at FROM firms_outputs WHERE day = ?1 ORDER BY retrieved_at DESC, run_id DESC LIMIT 1`;
// §2.5 identity: one statement per try; the caller re-stamps (+1 ms) and retries at most 3 times for DOWN runs only.
export const IDENTITY = `INSERT OR IGNORE INTO firms_identity (retrieved_at, run_id, kind, actual_at) VALUES (?1, ?2, ?3, ?4)`;
// §9 cutover: set once, in the batch that registers the first input, BEFORE that input row.
export const CUTOVER = `INSERT OR IGNORE INTO firms_settings (key, value) VALUES ('format_cutover_at', ?1)`;
export const INPUT = `INSERT INTO firms_inputs (run_id, raw_key, scheduled_at, retrieved_at, bytes, sha256, content_length, created_at, collector_version)
  VALUES (?1, ?2, ?3, ?4, 1, 'h', NULL, ?4, 'x')`;

