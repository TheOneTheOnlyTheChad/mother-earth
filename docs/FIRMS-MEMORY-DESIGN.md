# FIRMS pipeline — memory design (rev 6, 6 Nov 2026)

**Design only.** No parser rewrite, no production write, no retention change, no deployment is authorised by this document. Brief: `docs/briefs/2026-11-06-monitoring-and-memory.md` §2. Evidence: `reviews/2026-11-06-firms-guard.md` (§3 bench, §5 truncation), `phase1/bench-firms-memory/README.md`, hub 0.5.2 `worker.js` (sha256 `70307d5fc2a9…`).
Labels: **measured** = from those sources; **estimate** = reasoned, to be measured; ***stated*** = a Cloudflare documentation fact (R2 Workers API reference and "Upload objects", read through the Cloudflare connector on 6 Nov); **verify** = a platform behaviour to confirm in local workerd before relying on it.

**Current specification: rev 6.1 (6 Nov 2026; rev 6 + the §9 eligibility change accepted in GPT's review of the build).** This document is one current specification; earlier revisions' text has been removed or replaced, not kept alongside. **The SQL is authoritative in `docs/design-checks/firms-state.sql.mjs`**; the SQL quoted here is copied from it, and the procedures in §5–§6 are the reference model in `docs/design-checks/firms-publish.check.mjs`. Design evidence (not hub code): `firms-state.check.mjs` **20/20** (real SQLite) and `firms-publish.check.mjs` **16/16** (the model on real SQLite + an R2 stub with R2's conditional-put semantics). Deliberate breaks bite (§15).

| Rev | Reviewer finding → change |
|---|---|
| 1 | first draft |
| 2 | bounded `/place`, compare-and-swap publication, legacy transition, limits, expiry warning |
| 3 | one procedure; D1 run state instead of manifests; legacy limits on real JSON/decompressed bytes; `lines/1` format |
| 4 | exclusive atomic claim; commit fence + immutable per-attempt keys; checkpoints from committed outputs only; unique `retrieved_at` as run identity |
| 5 | eligible-work indexes + sweeps; fenced failure path ordered by input time; identity stamp vs actual time; cutover in the registration batch |
| **6** | **(a) counts ordering is (run, status): within one run a committed success replaces that run's down file, and a down file never replaces that run's success — matching `run_id` alone is not "ours"; (b) discovery includes the current publication's own pending repair (`retrieved_at >= current`), proven through the normal sweep → discovery → claim → publication path; (c) leftover rev-4/5 text removed (`superseded_at` SQL, the withdrawn C13 timing claim)** |

## 0. Bottom line
- Today the whole file is held several times at once (raw text, ~63k parsed rows, two JSON strings, and during a checkpoint the previous snapshot's text and full parse), while `/place` keeps another parsed copy resident (§1). Streaming the CSV alone would not change that.
- Proposed: the stored raw file is the one input; it is processed from R2 as a stream into outputs written in bounded parts; small per-cell results go to a sidecar so the checkpoint never parses a snapshot; `/place` scans per request keeping 8 rows; run state lives in five small D1 tables (settings, identity, inputs, attempts, outputs) so retries and repairs are found and bounded without guessing.
- The aim is peak memory set by **declared limits** (§10), not by the file. **That is a target until §15's measurements establish it.**
- Production changes it would need (each a separate Approve line, later): an additive D1 schema change (5 small tables + 3 indexes, §2) and a content-only deploy. **No new R2 prefix and no lifecycle-rule change** (§3, §14).
- Cost: R2 operations scale with file size above 5 MiB and with uncached `/place` views; worked examples, not ceilings, in §14.

## 1. Where memory goes today (hub 0.5.2), stage by stage
N = raw size (5.3 MB on 5 Nov, 63,614 rows). "Live" = still referenced when the next stage runs.

| # | Stage | Code | Allocation | Live into later stages? |
|---|---|---|---|---|
| 1 | Fetch | `fetchText` → `await r.text()` | whole body as one string (~N; plus the runtime's internal buffers while reading) | **yes** — `res.text` stays referenced in `collectFirms` until it returns, i.e. through stages 2–7 |
| 2 | Raw storage | `R2.put(raw, res.text)` | the string is encoded to bytes for the upload (~N, transient) | no |
| 3 | Parse | `firmsParse` | per line: a slice + `split(',')` array (transient); kept: `rows` = one 7-element array per detection with a new `observed_at` string; `cells`; `byHour` (**estimate** ~200–300 B/row in V8 → ~13–19 MB at 5.3 MB) | **yes** — rows are inside the envelope |
| 4 | Envelope | `envelope(...)` | references `rows`, `cells`, `byHour` (no copy) | yes |
| 5 | Serialise + publish | `writeSnapshot` → `putJson` ×4 | `JSON.stringify` of the full envelope **twice** (snapshot, latest; ~0.9 N each), twice for the small cells file | each string transient, but the second is built while the first may not yet be collected |
| 6 | Checkpoint (inside `writeSnapshot`, after publishing, when a closed day is due — the 00:30 run, or any run after a failure) | `histCheckpointOne` | previous day's snapshot `text()` (~N) + **`JSON.parse`** of it (a second full row set, ~same as stage 3) + `gzipText` output (~0.1–0.2 N) + `firesDaily` (small) + D1 statement objects (one per cell) | runs **while stages 1 and 3 are still live** |
| 6b | Coverage backfill | `backfillCoverage` | gzipped checkpoint `arrayBuffer` + decompressed text + `JSON.parse` | same as 6 |
| 7 | `/snapshot/firms` | streams `o.body` | none beyond stream buffers | — |
| 8 | `/place` | `placeRecords` → `placeCache` | `o.json()` of `latest/firms.json` (full parse) + a per-cell index of the rows, **kept for the isolate's life**; on a new etag the old index stays referenced until the new one replaces it | **resident across requests and runs** |
| 9 | Overlap | cron + `/admin/run` + visitors in one isolate | each concurrent collect has its own stages 1–6; the place cache is shared | additive |

Measured consequence (local workerd, total-heap cap, verified outputs): the real 5.3 MB file and 8 MiB pass every scenario at 80 MB; the heaviest case is collect + checkpoint overlap (one sampled peak 112 MB at 8 MiB, cap 128); 12 MiB fails two overlapping collects at 128 MB. Production: Worker metrics memory P999 17.41 MB over 24 h on files ≤ 3.8 MB, 0 Exceeded Memory (6 Nov). **These are local and production figures of different things and are not combined.**

**Why "stream the parser" is not enough:** if only stage 3 streamed, `rows` (stage 3), the two output strings (5), the checkpoint's parse (6) and the place cache (8) would all still grow with N. Backpressure matters too: a `tee()` of the fetch body into "upload" and "parse" buffers **without limit** behind the slower branch, so a stalled R2 upload would pull the whole file into memory anyway.


## 2. Run state in D1
Every rule below is one SQL statement, executed whole by D1's single writer (each statement is atomic; a `batch()` is one transaction and rolls back as a whole, *stated*). **Proven against real SQLite:** `docs/design-checks/firms-state.check.mjs` (13/13).

### 2.1 Tables (additive; no existing table changes)
```sql
CREATE TABLE firms_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);   -- format_cutover_at (§9)
CREATE TABLE firms_identity (retrieved_at TEXT PRIMARY KEY, run_id TEXT NOT NULL UNIQUE, kind TEXT NOT NULL,   -- kind: input | down
                             actual_at TEXT NOT NULL);   -- the real time; retrieved_at is the ordering/identity stamp
CREATE TABLE firms_inputs (run_id TEXT PRIMARY KEY REFERENCES firms_identity(run_id), raw_key TEXT NOT NULL UNIQUE,
  scheduled_at TEXT NOT NULL, retrieved_at TEXT NOT NULL UNIQUE, bytes INTEGER NOT NULL, sha256 TEXT NOT NULL,
  content_length INTEGER, created_at TEXT NOT NULL, collector_version TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'ready' CHECK (state IN ('ready','done','superseded','expired')),
  attempts_used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE firms_attempts (run_id TEXT NOT NULL REFERENCES firms_inputs(run_id), attempt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE, invocation TEXT NOT NULL, started_at TEXT NOT NULL, lease_until TEXT NOT NULL,
  finished_at TEXT, outcome TEXT, note TEXT, PRIMARY KEY (run_id, attempt));   -- outcome: committed | failed | fenced | fenced-failure
CREATE TABLE firms_outputs (run_id TEXT PRIMARY KEY REFERENCES firms_inputs(run_id), attempt INTEGER NOT NULL, token TEXT NOT NULL,
  retrieved_at TEXT NOT NULL UNIQUE, day TEXT NOT NULL,
  snapshot_key TEXT NOT NULL UNIQUE, snapshot_bytes INTEGER NOT NULL, snapshot_sha256 TEXT NOT NULL, records INTEGER NOT NULL,
  aux_key TEXT NOT NULL UNIQUE, aux_bytes INTEGER NOT NULL, format TEXT NOT NULL, completed_at TEXT NOT NULL,
  publish_state TEXT NOT NULL DEFAULT 'pending' CHECK (publish_state IN ('pending','published','superseded','expired')),
  publish_attempts INTEGER NOT NULL DEFAULT 0, latest_at TEXT, cells_at TEXT);
-- eligible-work indexes: a row is in them only while it can still be worked on
CREATE INDEX firms_inputs_eligible  ON firms_inputs  (retrieved_at) WHERE state = 'ready'           AND attempts_used    < 3;
CREATE INDEX firms_outputs_eligible ON firms_outputs (retrieved_at) WHERE publish_state = 'pending' AND publish_attempts < 3;
CREATE INDEX firms_outputs_day      ON firms_outputs (day, retrieved_at);
```
**Lifecycle of a row in the eligible indexes:**
| Class | How it leaves | When |
|---|---|---|
| exhausted processing (3 attempts claimed) | `attempts_used` reaches 3 in the claim's batch | at the 3rd claim |
| exhausted publication | `publish_attempts` reaches 3 in the publication claim | at the 3rd publication claim |
| done | `state = 'done'` in the commit's batch | at commit |
| published | `publish_state = 'published'` when `cells_at` is recorded | at publication |
| superseded | sweep: ready / pending rows with `retrieved_at` < the current publication's | every run, before discovery |
| expired | sweep: ready / pending rows with `retrieved_at` < now − 36 h (R2 keeps raw and snapshots 2 days) | every run, before discovery |
The sweeps are `UPDATE … WHERE <index condition> AND retrieved_at < ?`, so they walk the eligible index only. Rows never leave the tables (≈ 35,000 / year each; pruning is a later retention decision, not proposed).

### 2.2 Claiming an attempt — exclusive and bounded in one statement
```sql
INSERT INTO firms_attempts (run_id, attempt, token, invocation, started_at, lease_until)
  SELECT ?1, COALESCE(MAX(a.attempt), 0) + 1, ?2, ?3, ?4, ?5 FROM firms_attempts a WHERE a.run_id = ?1
  HAVING COALESCE(MAX(a.attempt), 0) < 3                                                     -- bound
     AND NOT EXISTS (SELECT 1 FROM firms_attempts b WHERE b.run_id = ?1
                     AND b.finished_at IS NULL AND b.lease_until > ?4)                       -- no live owner
     AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = ?1);                     -- not already done
```
Run in one `batch()` with `UPDATE firms_inputs SET attempts_used = attempts_used + 1 WHERE run_id = ?1 AND EXISTS (SELECT 1 FROM firms_attempts WHERE token = ?2)` — the counter moves only when the claim inserted. `?2` = a fresh random token, `?4` = now, `?5` = now + 15 min. **The caller proceeds only if the claim's `meta.changes === 1`.** Two contenders: whichever statement runs second sees the first one's live, unfinished attempt and inserts nothing (C2). Rev 3's form inserted for both (C1 reproduces GPT's result). Three attempts at most, ever (C3); a committed output blocks further claims (C4).

### 2.3 Committing an output — the fence against stale attempts
A lease expiring does not stop the original invocation; it may resume later. So the **commit**, not the clock, decides ownership:
```sql
INSERT INTO firms_outputs (run_id, attempt, token, retrieved_at, day, snapshot_key, snapshot_bytes, snapshot_sha256, records,
                           aux_key, aux_bytes, format, completed_at)
  SELECT a.run_id, a.attempt, a.token, i.retrieved_at, substr(i.retrieved_at, 1, 10), ?2, ?3, ?4, ?5, ?6, ?7, 'lines/1', ?8
  FROM firms_attempts a JOIN firms_inputs i ON i.run_id = a.run_id
  WHERE a.token = ?1 AND a.finished_at IS NULL
    AND a.attempt = (SELECT MAX(attempt) FROM firms_attempts m WHERE m.run_id = a.run_id)   -- still the latest attempt
    AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = a.run_id);              -- first and only commit
```
- Run in one `batch()` with `UPDATE firms_inputs SET state = 'done' WHERE run_id = (SELECT run_id FROM firms_outputs WHERE token = ?1)`.
- `changes === 1` → this attempt owns the input's output. `0` → it is stale (a later attempt exists) or a commit already happened: it stops, publishes nothing, marks itself `outcome = 'fenced'`; its objects are unreferenced and expire with their prefix.
- Tested: A stalls, B claims and commits, A resumes → A inserts nothing (C5); B claimed but A resumes first → A still fenced, B commits (C6); A overruns its lease with no replacement → A may commit (C7; the fence is "latest attempt", not elapsed time); a duplicate commit inserts nothing (C8).
- **Immutable output keys per attempt** (§3): `snapshots/firms/<run_id>-a<attempt>-<token>.json` and `snapshots/firms-aux/<run_id>-a<attempt>-<token>.json`. No two attempts ever write the same key, so a stale attempt cannot overwrite the winner's objects, and `INSERT OR IGNORE`-style "first wins" applies to *references*, not to bytes that something else could still change.
- **The winning output is selected by D1, nowhere else:** publication (§5), checkpoints (§7) and retries (§6) read the one `firms_outputs` row and use exactly its keys, after checking `head().size` of each against the recorded bytes.
- `FINISH`: `UPDATE firms_attempts SET finished_at = ?, outcome = ? WHERE token = ? AND finished_at IS NULL` — after commit, failure or fencing.

### 2.4 Publication attempts — bounded atomically
Publication needs no lease: it only ever publishes the committed output (by CAS, §5), so two publishers of the same output converge. Its retries are bounded by
```sql
UPDATE firms_outputs SET publish_attempts = publish_attempts + 1
  WHERE run_id = ?1 AND publish_state = 'pending' AND publish_attempts < 3;   -- proceed iff changes === 1
```
(C9: three succeed, the fourth does not; the third claim takes the row out of the eligible index.) Completion records are reconciled from R2 identity (§5): `latest_at = COALESCE(latest_at, now)`, then `cells_at` and `publish_state = 'published'`.

### 2.5 Identity — one ordering stamp per run, the real time kept separately
`INSERT OR IGNORE INTO firms_identity (retrieved_at, run_id, kind, actual_at) VALUES (?,?,?,?)`; proceed only on `changes === 1`.
- **Collecting runs** (an input): `retrieved_at` = `actual_at` = the real raw retrieval time. **Never re-stamped.** On a collision the registration batch (cutover + identity + input) fails as a whole; the run abandons, logs it, its raw is unreferenced; the next run fetches again (C10, C20).
- **Runs with no input** (a fetch failure, a key missing, an HTTP error — today's `writeDown` cases before any raw exists): `actual_at` = the real failure time; `retrieved_at` = an ordering stamp, starting at the failure time and moved +1 ms per collision, **at most 3 tries**, then refused: no public down file, the failure stays in `collector_runs` (C19). The stamp may cross UTC midnight (C19: 23:59:59.999 → 00:00:00.000 next day); nothing day-based reads it — checkpoints and coverage use `collector_runs` scheduled/finished times as today.
- **Processing failures of an input** use **that input's identity** (§2.6), so they never claim a new one.

### 2.6 Failure path — fenced, and ordered by the input it describes
Step B's failure (read, parse, upload or commit error) must not call today's `writeDown`, which stamps "now" and overwrites `latest-cells/` — a stale attempt could replace a newer success. Instead:
```sql
UPDATE firms_attempts SET finished_at = ?2, outcome = 'failed', note = ?3
 WHERE token = ?1 AND finished_at IS NULL
   AND attempt = (SELECT MAX(attempt) FROM firms_attempts m WHERE m.run_id = firms_attempts.run_id)   -- still the latest attempt
   AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = firms_attempts.run_id);            -- and nothing succeeded
```
- `changes === 1` → may publish a **down** counts file for **that input**: `run_id` and `retrieved_at` of the input (its identity), `failed_at` = the real failure time in the body, written through the same CAS as §5 — so it can never replace a newer run's file, and never replaces its own run's success.
- `changes === 0` → stale: `outcome = 'fenced-failure'`, logged in `collector_runs`, **no public write** (C17, C18; P1 is GPT's exact sequence: A stalls, B commits and publishes, A resumes with a read error — B's counts file is byte-identical afterwards).
- P2: even with the fence bypassed, the input-time ordering alone stops an older input's failure from replacing newer counts.

## 3. Objects and format
| Object | Key | Written by | Lifecycle (existing rules) |
|---|---|---|---|
| raw CSV | `raw/firms/<run_id>.csv` (one fetch, one key) | step A | `raw/` — 2 days (unchanged) |
| snapshot | `snapshots/firms/<run_id>-a<attempt>-<token>.json` — **one per attempt, never rewritten** | step B | `snapshots/` — 2 days (unchanged) |
| sidecar | `snapshots/firms-aux/<run_id>-a<attempt>-<token>.json` — one per attempt | step B | `snapshots/` — 2 days (unchanged) |
| cells file | `cells/firms/<run_id>.json` | step C | `cells/` — 2 days (unchanged) |
| published | `latest/firms.json`, `latest-cells/firms.json` | step C (CAS, §5) | none — kept until replaced (unchanged) |
| checkpoint | `archive/checkpoints/firms/<day>.json.gz` | step D | none — kept (unchanged) |
**No new prefix, no lifecycle-rule change, no `manifests/`.** Incomplete multipart uploads are aborted by R2 after 7 days by default (*stated*); every failed write also calls `abort()`.
Custom metadata on `latest/` and `latest-cells/`: `run_id`, `retrieved_at`, `format`. Envelopes also carry `run_id` as a field (both the records file and the cells file) (well under R2's 8,192-byte metadata cap, *stated*). Multipart objects cannot carry final hashes in their own metadata (it is fixed before streaming starts) — the hashes and counts live in D1 (§2).

**Format `lines/1` — every line has a bound.** The writer emits the envelope as valid JSON in which each line holds exactly one of: one top-level field with a scalar or a small object (header fields: version, times, scope, quantity, coverage_default, window_rule …), one `records` row, one `cells` entry (`"12_34":{"count":7,"coverage":{…}}`), one `by_hour` entry (one cell's count inside its hour's object, `"12_34":5`), or structural punctuation. Order: header fields → `record_fields` → `records` → `cells` → `by_hour`.
- **Line limit 4 KiB, enforced by both writer and reader.** The writer fails the run if any line it would emit exceeds it (no header field comes close: the longest today is `window_rule`, ~170 B). The reader fails if it meets a longer line and never buffers past it.
- **`by_hour` keeps its shape.** Writing each hour's object on one line would exceed 4 KiB in a busy hour (hundreds of cells). `lines/1` writes `"by_hour":{`, then for each hour `"2026-11-06T08":{`, one `"12_34":5,` line per cell, and `},` — the same nested object, one cell entry per line.
- **Dense bound:** grid 45 × 90 = 4,050 cells; a `day_range=1` file covers ≤ 24 hours → ≤ 4,050 `cells` lines and ≤ 97,200 `by_hour` lines. The in-memory maps behind them are bounded by the same numbers (§10).
- Any `JSON.parse` consumer (the page, `/snapshot/firms`) sees the same object; only key order and whitespace differ from today (§12).

## 4. One run, start to finish
Each step's input is immutable and named; each step records completion in D1 before the next depends on it.

**Step A — fetch → raw.** Stream the response body. Buffer at most one part (P = 5 MiB, R2's minimum part size; all parts but the last equal; ≤ 10,000 parts — *stated*). Ends within the first part → one `put`; otherwise multipart, one part buffered at a time, `abort()` on any error. While streaming: incremental SHA-256, byte count, and `Content-Length` if sent (**verify** whether FIRMS sends it; if it does, a short body is a detected truncation). After completion: `head()` size must equal the byte count. Then one `batch()` (one transaction): cutover row if unset (§9), the identity (§2.5), and `firms_inputs` (input ready). Peak: one part + stream buffers.

**Step B — raw → snapshot + sidecar.** Claim an attempt (§2.2; proceed only on `changes === 1`). Stream `raw/…` from R2 through `TextDecoderStream` and a line splitter (carry ≤ 4 KiB). Per line: today's checks unchanged (`firmsRowProblem`, field count). Each valid row is written straight into the `lines/1` snapshot writer (bounded parts, as step A) and folded into small maps: `cells`, `by_hour`, and the sidecar's per-cell day aggregates (`n, frpSum, frpMax, frpN, day, night` — exactly `firesDaily`'s fields) plus `last_observation_at` and `records`. After the rows: `cells` and `by_hour` lines; complete the upload; write the sidecar (small; `put`). Both objects go to this attempt's own keys (§3). `head()` sizes must match. Then the **commit** (§2.3): `changes === 1` → output complete; `0` → fenced, stop. Any malformed row, line over the limit or write error → `abort()`, then the **failure path of §2.6** (fenced; a down file only for this input and only if this attempt is still the latest); never today's unconditional `writeDown`. Peak: one input chunk + one output part + the maps (§10).

**Step C — publish** (§5). **Step D — checkpoint** (§7). **Step E — readers** (§8).

**Where each run starts:** a scheduled run first looks for unfinished work (§6) and does at most one piece of it, then fetches. A manual `/admin/run/firms` behaves the same.

## 5. Publication: compare-and-swap with run identity and status
Input: the committed `firms_outputs` row only (§2.3). Claim a publication attempt (§2.4). Every write to `latest/firms.json` (records) or `latest-cells/firms.json` (counts) carries custom metadata `run_id`, `retrieved_at`, `status` (`ok` | `down`), `token` (ok: the committed output's token) and `format`; envelopes also carry `run_id`. R2 `put` accepts `onlyIf: { etagMatches }` / `{ etagDoesNotMatch: "*" }` and returns `null` without storing when the condition fails (*stated*).

**Ordering of an existing shared object relative to what we are about to write** (model: `order()`):
| Existing object | Result | Basis |
|---|---|---|
| same `run_id`, same status (ok: same committed `token`) | **ours** — write nothing | identity **and** state |
| same `run_id`, existing **down**, ours **ok** | **older** — replace | within a run the committed success supersedes that input's failure file (P12) |
| same `run_id`, existing **ok**, ours **down** | **newer** — stop | a delayed failure never replaces its own run's success (P14, P15) |
| other run, `retrieved_at` > ours | **newer** — stop | `retrieved_at` is unique per run (§2.5) |
| other run, `retrieved_at` < ours | **older** — replace | same |
| legacy (no `run_id`), `head().uploaded` < our `retrieved_at` | **older — established** | uploaded after its data was retrieved |
| legacy, `head().uploaded` ≥ our `retrieved_at` | **uncertain** — stop, deferred, logged; *not* treated as newer, not "superseded" | cannot tell without reading it (P11) |
| absent | create-only `put` (`etagDoesNotMatch: "*"`) if verified; else **refused** — no unconditional write exists (P9, P10) | |
Rev 5's rule "same `run_id` ⇒ ours" let a successful retry record `published` while the counts file still said down (GPT; P13 reproduces it).

**C1 — records (`latest/`)**, up to 3 CAS rounds: `ours` → go to C2; `newer` → `publish_state = 'superseded'`, stop; `uncertain` → stop (deferred; stays pending, retried, expires by the sweep); `older` / `absent` → conditional put; `null` → next round; success or `ours` → `latest_at = COALESCE(latest_at, now)`.
**C2 — counts (`latest-cells/`)**, only when C1 ended `written` or `ours`, same rounds and table: success or `ours` → `cells_at = COALESCE(cells_at, now)`, `publish_state = 'published'`.

**Repair and reconciliation** — all through the normal path (§6):
- records published, counts write failed → the next run's discovery returns this output (its `retrieved_at` equals the current publication's), C1 finds `ours`, C2 writes the counts only (P16);
- R2 records written, D1 `latest_at` update lost → same path; C1 `ours` records `latest_at`; C2 writes the counts (P17);
- both R2 writes done, D1 `cells_at` update lost → C1 and C2 both `ours`: D1 reconciled, **zero R2 writes** (P18);
- a newer run published meanwhile → the older output is no longer discoverable (`retrieved_at` < current) and is swept `superseded`; nothing overwritten (P19);
- the counts write keeps failing → 3 publication claims, then the row leaves discovery (P20).

**Down files** (the only other writer of `latest-cells/firms.json`): processing failures per §2.6 — fenced, `status: down`, ordered by the input's identity; runs with no input per §2.5 — their own identity. Both go through this CAS and table, so neither can stamp "now" over a newer file nor over its own run's success.

## 6. Retries: sweeps, discovery, bound, concurrency
At the start of each run:
1. **Sweeps** (cheap, eligible-index only): ready inputs and pending outputs older than the current publication → `superseded`; older than now − 36 h → `expired` (§2.1 table).
2. **Discovery** — at most one piece of work, newest first, `LIMIT 1`, reading only an eligible index:
   - otherwise unprocessed input: `WHERE state = 'ready' AND attempts_used < 3 AND retrieved_at > <current publication> ORDER BY retrieved_at DESC LIMIT 1` → `head()` the raw → claim (§2.2); `0` → someone else has it or it is spent; move on;
   - unpublished output **first**: `WHERE publish_state = 'pending' AND publish_attempts < 3 AND retrieved_at >= <current publication> ORDER BY retrieved_at DESC LIMIT 1` → publication claim (§2.4) → §5. `>=` includes the current publication's own pending repair (equal `retrieved_at` means that run, §2.5); older outputs are excluded here and retired by the superseded sweep, which uses `<` and so never sweeps the current run.
3. Then the run's own fetch.
<current publication> = `retrieved_at` from `latest/firms.json`'s metadata (legacy: its upload time; absent: the epoch).
**Bounded reads, as evidenced:** C15 holds 1k / 10k / 100k rows in every ineligible class (exhausted processing, exhausted publication, superseded, expired, done, published), all newer than the single eligible row, and both discovery queries stay at ~0.01 ms (local SQLite, not D1); with exhausted rows left in either index the same query grows (C16; the breaks in §15). The claim is about what is read — the eligible index, whose size is the eligible backlog — not that time is constant on D1.
Every attempt is also logged in `collector_runs` (run_id + attempt in the note), so `/health/*` and coverage see retries like any run. Not included: a different input for a closed day (historical recovery), previous-day closure (R11), extending retention.

**Warning before inputs expire** (extends `/health/archive/firms`): (a) a pending checkpoint day whose newest committed output's snapshot is older than 36 h; (b) the newest unprocessed input older than 36 h — i.e. a row the expiry sweep is about to retire. The reason names the key and its expiry. Nothing is extended automatically.

## 7. Checkpoint (step D) without parsing
For a closed day D (marker checked first, written last; `INSERT OR IGNORE`; completed days never rewritten):
- **New-format input comes from D1, not from a listing:** `SELECT … FROM firms_outputs WHERE day = D ORDER BY retrieved_at DESC, run_id DESC LIMIT 1` (index `firms_outputs_day`; C11). A new-format object with no committed `firms_outputs` row — upload succeeded, sidecar or commit failed, or a fenced attempt — is **never a candidate**, and never falls through to the legacy path (§9).
- **Legacy input** where §9's eligibility holds (legacy key format, by its exact `retrieved_at`; *rev 6.1: the cutover is no longer a filter*), chosen exactly as today among those.
- **The day's input = the later of** the committed new output and the legacy candidate (by `retrieved_at`; legacy `retrieved_at` from its R2 custom metadata as today). On the cutover day both can exist.
- New-format processing: stream the committed snapshot through `CompressionStream('gzip')` into the checkpoint object (bounded parts); `fires_daily` and `last_observation_at` from the committed sidecar (same `run_id`, `attempt`, token as the output row; `head()` sizes = recorded bytes). Sidecar missing or mismatched → rebuild by one streaming line pass over the committed snapshot, never `JSON.parse`.
Peak: one gzip part + chunk buffers + the sidecar.

## 8. Readers (step E)
- `/snapshot/firms`: unchanged — streams the stored object.
- `/place` firms section: stream `latest/firms.json` (new format) and keep, for the asked cell, a **fixed 8-slot top list by `observed_at`** (ties in today's sort order) and a **count**. Answer shape unchanged: `records` (8, newest first), `records_total`, `count`, `cell`. Memory: 8 rows + one chunk + the line carry — independent of the cell and the file.
- **Pairing by run identity.** Because every writer of a shared FIRMS object holds a unique `retrieved_at` (§2.5), two files with the same `retrieved_at` are from the same run: the existing timestamp pairing — the page's `refreshPair`/`usable()` and `/place` — already pairs by identity. **No page change is needed.** In addition, the hub's `/place` compares `run_id` when both files carry one; one carrying it and the other not (a file written before the change, the other after) is treated as a mismatch → withheld. Legacy pairs (neither carries `run_id`) are paired by `retrieved_at` exactly as today. Optional later, and not required: the page could also compare `run_id`; that would be its own reviewed page change.
- Answer cache keyed by `(etag, cell)`, capped at **256 KB** total (LRU by bytes); cleared when the etag changes.
- At most **2** concurrent firms scans per isolate; a third waits up to 2 s, then the firms section answers `unavailable` ("busy, try again"). No unbounded queue.

## 9. Legacy objects: bounded by their real sizes, not by the CSV guard
GPT's point: the 8 MiB guard limits the **CSV**; the JSON written from it is larger (GPT's valid synthetic file: JSON ≈ **1.48 ×** the CSV), and a checkpoint is gzip-compressed, so its **decompressed** size is what a reader holds. An earlier revision inferred safety from the guard; this one enforces limits on the bytes actually read.
- **Cutover:** `firms_settings.format_cutover_at` is written by `INSERT OR IGNORE` in the **same batch** that registers the first input (cutover → identity → input, one transaction), with that input's `retrieved_at` — so it exists before, and only with, the first committed registration; a failed registration batch leaves it unset (C21). **Legacy eligibility (rev 6.1, after GPT's production review of the build, accepted 6 Nov):** a legacy-key snapshot (`YYYY-MM-DDTHH-MMZ.json`) is eligible by its exact `retrieved_at`. **The cutover is audit information, not a filter.** The day's input is **the latest complete eligible snapshot of either format**: a committed v2 output, or an eligible legacy snapshot. A legacy object written after the cutover is a complete legacy publication, from a rollback (`FIRMS_PIPELINE` unset) or an old-code isolate across the deploy, so excluding it would archive the wrong file (GPT probe G1). **Uncommitted v2 objects remain excluded:** only `firms_outputs` rows are v2 candidates. Until v2 has ever run (no cutover row and `FIRMS_PIPELINE` ≠ v2), the checkpoint and backfill use the legacy selection after one `firms_settings` read; a failed read defers the checkpoint. Unreadable state never becomes a gap (G2). Rev 6's original rule (legacy only when `retrieved_at` < `format_cutover_at`) is withdrawn. A new-format object is never read as legacy, whatever is missing about it (§7).
- **Where legacy objects appear:** `snapshots/firms/` (gone within 2 days of the switch by the existing rule), `latest/` (replaced by the first new publication, normally within 15 minutes), archived `archive/checkpoints/firms/*.json.gz` (kept for good; read only by coverage backfill, which reads them only when a coverage row is missing — today none is missing for firms).
- **Limits enforced while reading** (abort before parsing, never after):
  - legacy JSON (snapshot or `latest/`): `head().size` ≤ **L_json**; refused otherwise;
  - legacy checkpoint: compressed size from `head()`, then decompression through a counting stream that **aborts at L_json decompressed bytes**, before `JSON.parse`.
  - **L_json is set from measurements, not from the guard:** (1) the largest legacy snapshot and checkpoint actually stored (one read-only R2 listing — sizes only; checkpoints decompressed in the workspace), (2) the ratio JSON/CSV on the real 5 Nov file and on dense synthetic files, (3) the bench below at that limit. The working proposal is **L_json = 12 MiB** (8 MiB × 1.48 ≈ 11.8 MiB, rounded up) **only if** (3) passes.
- **Bench (new, local workerd, outputs asserted):** at L_json, the legacy paths (legacy `latest/` in `/place`, legacy snapshot checkpoint, legacy checkpoint backfill) **overlapping** the new paths (a new-format collect + publish, a new checkpoint, `/place` scans at the concurrency cap) in one isolate, at total-heap caps 80 and 128 MB, 3 runs each; plus negative controls (an object 1 byte over L_json is refused with nothing parsed). If it fails at L_json, L_json comes down and anything above it is refused — the transition never parses an unbounded legacy object.
- A refused legacy object leaves the previous state standing (the last good `latest/`, or a checkpoint attempt that records the refusal and is retried / becomes a gap by the existing rules).

## 10. Declared limits
| Limit | Value | On breach |
|---|---|---|
| Part size (every stream written) | 5 MiB | — (R2 minimum) |
| Line length (CSV in, `lines/1` out, `lines/1` read) | 4 KiB | run fails "line too long"; the reader never buffers further |
| Cells | ≤ 4,050 (grid) | structural |
| `by_hour` entries | ≤ 24 × 4,050 = 97,200 | structural |
| Attempts per input | 3 | no further claims; recorded |
| Publication CAS rounds | 3 per step | `contended`; nothing overwritten |
| Concurrent `/place` firms scans per isolate | 2 (+2 s wait) | "busy" |
| `/place` answer cache | 256 KB | LRU eviction |
| Legacy JSON / decompressed checkpoint | L_json (§9; 12 MiB proposed, to be measured) | refused before parsing |
| Raw CSV accepted by the new path | the 8 MiB guard stays until §15 measures the new path | — |
Peak per collect ≈ 2 × part + chunk buffers + 4 KiB carry + the maps (dense worst case: 4,050 cell objects + 97,200 `by_hour` counters + 4,050 sidecar aggregates — **estimate** a few MB; measure on the dense file). Peak per `/place` scan ≈ chunk + carry + 8 rows. **These are arithmetic from the limits, not results.**

## 11. Failure part-way through each stage
| Fails during | What remains | Reader sees | Next |
|---|---|---|---|
| A fetch / raw upload | multipart aborted; no identity / input row | last good publication | fresh fetch next run |
| A identity collision | raw stored; identity refused | last good | abandoned; next fetch |
| A after upload, before the D1 batch | a raw object with no input record | last good | not retried (unknown to D1); expires in 2 days |
| B claim lost | nothing | last good | another invocation owns it |
| B parse / snapshot / sidecar | this attempt's own keys partly written; no output row | last good, or a **down** file for that input if the failure fence passes (§2.6) | retry by a new attempt (≤ 3), new keys |
| B failure of a **stale** attempt | `fenced-failure` recorded | unchanged — no public write (P1) | nothing |
| B done, commit fenced (stale) | this attempt's objects, unreferenced | last good | nothing; the winner's output stands; the objects expire |
| B done, commit fails (D1 error) | objects, no output row | last good | retry by a new attempt, new keys |
| C1 `latest/` | output committed; `latest_at` null | last good, consistent | publication retry (≤ 3) |
| C1 newer run / uncertain legacy | `publish_state = 'superseded'` / deferred (stays pending) | the newer or existing publication | nothing overwritten |
| C R2 write ok, D1 `latest_at` / `cells_at` update failed | objects ours, D1 behind | the published pair | next run's discovery → reconcile from R2 identity + status; no rewrite (P17, P18) |
| C2 `latest-cells/` | `latest/` ours, counts old (or that input's down file) → mismatched pair | `/place` withholds firms; page keeps its last good pair | next run's discovery (`>=` current) → C1 `ours` → C2 only (P16) |
| a successful retry after the same input's down file | counts file still down | down | C2 sees same run, existing down, ours ok → **older** → replaced (P12) |
| a delayed failure after the same input's success | — | ok | C2 sees same run, existing ok, ours down → **newer** → stop (P14, P15) |
| C absent shared object, create-only unverified | refusal | — | one-time seeding (Approve line) |
| D committed output missing for the day | no new-format candidate | — | legacy candidate if pre-cutover; else the day waits / gap by the existing 2-day rule |
| D gzip / archive / marker | no marker | — | retried next run |
| D sidecar mismatch / missing | no marker yet | — | rebuilt by a line pass, then retried |
| Legacy object over L_json | refusal recorded | previous state | stays refused |
| E `/place` scan | — | `unavailable` / `withheld` | — |

## 12. Page and API behaviour
- **Unchanged:** every URL; the envelope's fields and meaning; `records` row shape and `record_fields`; `by_hour` and `cells` shapes; `/snapshot/firms` is valid JSON with the same content; the `/place` answer shape; `/status`; `/health/*`.
- **Changed, explicitly:** key order and whitespace inside the snapshot JSON (`lines/1`); a new `run_id` field in the FIRMS records and cells envelopes (ignored by the page); new custom metadata on the two published objects; new D1 tables; `/place` may answer the firms section "busy" under load, and withholds a pair whose `run_id`s differ. **No page change.** Any `JSON.parse` consumer is unaffected; a consumer relying on key order or exact bytes would be — none known.

## 13. Truncation and record counts (unchanged limits)
- FIRMS sends no row count. A response cut **exactly between rows** is still undetectable by content checks. If FIRMS sends `Content-Length`, a short body becomes detectable (step A) — to be measured, not assumed.
- A drop in record count versus the previous publication is an **anomaly signal**, recorded in the run note and the sidecar (`records_previous`, `delta`), **never** a reason to refuse: FIRMS legitimately removes passes (6 Nov: two whole passes, 344 + 145 detections, removed between 10:45 and 12:45 UTC; 5 Nov: 23 rows removed).

## 14. Cost, lifecycle and approval scope
**Lifecycle.** Every object this design writes sits under a prefix that already has a 2-day rule (`raw/`, `snapshots/`, `cells/`) or is already kept by design (`latest/`, `latest-cells/`, `archive/checkpoints/`). **No new prefix, no rule added or changed.** Rev 2's `manifests/` prefix is withdrawn (§2); rev 2's `snapshots-aux/` becomes `snapshots/firms-aux/`, inside the existing `snapshots/` rule. R2's default 7-day abort covers incomplete multipart uploads (*stated*).

**R2 operations per run** (Class A = writes/lists, Class B = reads/heads, *stated*):
| | Today (0.5.2) | This design, CSV ≤ 5 MiB and JSON ≤ 5 MiB | This design, 10 MB CSV (JSON ≈ 15 MB at 1.48×) |
|---|---|---|---|
| Class A | 5 puts (raw, snapshot, cells, latest, latest-cells) | 6 (+ sidecar) | raw multipart 4 (create, 2 parts, complete) + snapshot 5 (create, 3 parts, complete) + sidecar, cells, latest, latest-cells 4 = **13** |
| Class B | 0–1 | ~7 (heads after writes, raw read in B, snapshot read for the `latest/` copy, CAS heads) | ~7 |
| Per month (96 runs/day) | ~14,400 A | ~17,300 A · ~20,200 B | ~37,400 A · ~20,200 B |
R2 free tier: 1 M Class A and 10 M Class B per month; then **$4.50 / M** Class A and **$0.36 / M** Class B (*stated*, pricing page). **Worked example, not a ceiling:** if the account were already past the free Class A tier, the 10 MB case adds ~23,000 Class A/month ≈ **$0.10/month**. The account's current R2 usage has **not** been measured — read it before building.
**Per visitor:** each uncached `/place` view adds 1 Class B read and one scan of `latest/firms.json` in CPU. Extra Class B/month ≈ uncached views/month; extra CPU ≈ uncached views × scan time (to measure). At 10,000 uncached views/month and a 100 ms scan (assumed): 10,000 Class B (free tier) and 1 M CPU-ms (Workers Paid includes 30 M/month; then $0.02 per million ms). Visitor numbers are not measured; the cache and the scan cap bound bursts, not monthly totals.
**D1:** ≤ ~10 rows written per run (identity, input, attempt insert + counter + finish, output + done, publish-attempt, `latest_at`, `cells_at`/state) plus sweep updates that touch only rows leaving the eligible indexes ≈ 30,000/month (Workers Paid includes 50 M rows written/month); reads are single-row lookups by primary key or a small newest-first scan.
**CPU:** a streaming parse costs about what today's parse costs (80–173 ms on 5.3 MB, measured in the pane), plus gzip in the daily checkpoint and the `/place` scans above.

**Approval scope (when implementation is later authorised — each its own `Approve:` line):**
1. D1: create `firms_settings`, `firms_identity`, `firms_inputs`, `firms_attempts`, `firms_outputs` and their 3 indexes (additive, `IF NOT EXISTS`, procedure of START-HERE §4d).
2. Deploy the hub version that implements this (content only; no binding, secret, schedule or variable change).
3. Nothing else: **no R2 lifecycle change, no new prefix, no retention change.** Raising the 8 MiB guard is a separate, later decision after production measurement.

## 15. Verification (before any deploy; outputs asserted, never just survival)
**Inputs:** the real 5 Nov file (5,311,642 B, sha256 `c3487dcc…`, on the Mac); scale-ups of its own rows to 8 MiB, 16, 32 and 64 MiB; **dense synthetic files** that touch all 4,050 cells in all 24 hours (the `cells` / `by_hour` worst case) at 8 MiB and above; the 23-duplicate-line file; header-only; cut mid-row and between rows; a line of 4,097 bytes.
**Equivalence:** for every input, the new `latest/firms.json` parsed = today's `firmsParse` envelope parsed (records deep-equal in order; `cells`, `by_hour` equal); every emitted line ≤ 4 KiB, including the dense files; sidecar = today's `firesDaily` on the same envelope; checkpoint object gunzipped = the snapshot bytes; `fires_daily` rows and coverage equal to today's; `/place` firms answers equal to today's for every cell with records, including the busiest real cell and the densest synthetic cell.
**Run now (design evidence; real SQLite; the model on an R2 stub):**
- `firms-state.check.mjs` 20/20 — claim: rev-3 race reproduced (C1), exclusive (C2), bound (C3), blocked after commit (C4); commit fence: stale after/before replacement (C5, C6), overrun without replacement (C7), duplicate (C8); publication bound (C9); identity collision (C10); checkpoint candidates = committed outputs only (C11); discovery (C12); sweeps (C14); **growing ineligible backlogs, 1k/10k/100k per class, all newer than the eligible row → flat** (C15); rev-4 growth reproduced (C16); failure fence (C17, C18); down-run identity: repeated collisions, refusal after 3, across UTC midnight, actual time kept (C19); collecting runs never re-stamped (C20); cutover (C21).
- `firms-publish.check.mjs` 16/16 — stale failure fenced (P1); input-time ordering (P2); genuine latest failure (P3); paused older writer (P8); create-only both absent (P9) and **unverified** (P10); legacy older/uncertain (P11); **down → success, same input, through the normal path (P12)**; rev-5 "same run = ours" bug reproduced (P13); **success → delayed failure, fence passed then paused (P14) and racing at the put (P15)**; **discovery repair of the current run's counts (P16), lost D1 `latest_at` (P17), lost D1 `cells_at` with zero R2 writes (P18)**; older run's repair excluded and swept (P19); repair bound through the normal path (P20).
- **Breaks bite:** no failure fence → P1 fails; "same run_id = ours" → P12–P15 fail; `FIND_UNPUBLISHED` with `>` → P16–P20 fail; a failure allowed to replace its own run's success → P14, P15 fail; exhausted rows kept in either eligible index → C15 fails.
**Build-time, through the real `worker.js`:** the same cases, plus raw stored then B fails → retried with new keys; a commit D1 error → retried; two runs forced to one millisecond → the second cannot publish; `/place` with `run_id`s that differ, or one missing → withheld; legacy pair → paired by `retrieved_at` as today; the page's existing `refreshPair` tests unchanged.
**Legacy + new together:** §9's bench at L_json, overlapping, both caps, 3 runs, with negative controls.
**Injected failures:** every row of §11 — assert the last good publication byte-identical where it should be, no published key pointing at an incomplete object, retries bounded, nothing completed rewritten.
**Memory (local, labelled local):** the workerd bench (`phase1/bench-firms-memory/`), total-heap caps 48 / 64 / 80 MB, 3 runs each, outputs asserted, for every size up to 64 MiB and the dense files. **The "independent of file size" claim is made only if every new-path scenario passes at the same cap across all sizes.** Negative controls must FAIL.
**Production (labelled production; after a separate deploy approval):** Worker memory P50/P99/P999 and Exceeded Memory for 48 h; CPU per firms tick; R2 Class A/B from the usage page; D1 rows; `/health/*` green. The guard stays at 8 MiB until then.

## 16. Order of work (each a separate go)
1. GPT re-review of this rev 6.
2. Measure first: whether FIRMS sends `Content-Length`; the account's current R2 Class A/B usage; the largest stored legacy snapshot and checkpoint (sizes only, read-only listing); the JSON/CSV ratio on real and dense files; `etagDoesNotMatch: "*"` and `R2ObjectBody` known-length behaviour in local workerd; the busiest real cell and a `/place` scan's CPU on the 5 Nov file.
3. Build on a branch with §15's tests and bench.
4. GPT review → Chad's Approve lines (§14: D1 tables, then deploy).
5. Watch production 48 h; decide on the guard separately.
