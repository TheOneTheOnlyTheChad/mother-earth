# FIRMS pipeline — memory design (rev 3, 6 Nov 2026, branch `hub-health`)

**Design only.** No parser rewrite, no production write, no retention change, no deployment is authorised by this document. Brief: `docs/briefs/2026-11-06-monitoring-and-memory.md` §2. Evidence: `reviews/2026-11-06-firms-guard.md` (§3 bench, §5 truncation), `phase1/bench-firms-memory/README.md`, hub 0.5.2 `worker.js` (sha256 `70307d5fc2a9…`).
Labels: **measured** = from those sources; **estimate** = reasoned, to be measured; ***stated*** = a Cloudflare documentation fact (R2 Workers API reference and "Upload objects", read through the Cloudflare connector on 6 Nov); **verify** = a platform behaviour to confirm in local workerd before relying on it.

**Rev history.** Rev 1: first draft. Rev 2 (GPT): bounded `/place`, compare-and-swap publication, legacy transition, manifests, limits, expiry warning. **Rev 3 (GPT's re-review of `2fe320b`)** — this version is rewritten as **one procedure**; earlier sections are superseded, not appended to:
1. **Retry discovery:** separate *input ready* and *output complete* records, with bounded, concurrency-safe attempt accounting (§2, §6). Manifests are replaced by these records (§2).
2. **Publication repair:** a run is recognised by its **identity** (`run_id`), so a retry repairs a missing counts publication without overwriting a newer run; the unconditional first write is removed (§5).
3. **Legacy bounds:** the limits are on the actual **JSON bytes and decompressed bytes**, enforced while reading, and the legacy and new paths are tested together under overlap; nothing is inferred from the old bench (§9, §15).
4. **Format and lifecycle:** `cells` and `by_hour` are written one entry per line so every line has a bound (§3); dense valid inputs are tested; the object layout uses only prefixes that already have lifecycle rules, and the plan says so explicitly (§3, §14).

## 0. Bottom line
- Today the whole file is held several times at once (raw text, ~63k parsed rows, two JSON strings, and during a checkpoint the previous snapshot's text and full parse), while `/place` keeps another parsed copy resident (§1). Streaming the CSV alone would not change that.
- Proposed: the stored raw file is the one input; it is processed from R2 as a stream into outputs written in bounded parts; small per-cell results go to a sidecar so the checkpoint never parses a snapshot; `/place` scans per request keeping 8 rows; run state lives in three small D1 tables so retries and repairs are found and bounded without guessing.
- The aim is peak memory set by **declared limits** (§10), not by the file. **That is a target until §15's measurements establish it.**
- Production changes it would need (each a separate Approve line, later): an additive D1 schema change (3 tables, §2) and a content-only deploy. **No new R2 prefix and no lifecycle-rule change** (§3, §14).
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


## 2. Run state: three D1 tables (replace rev 2's manifests)
Rev 2 made a manifest written *after* processing the only thing retries could find, so a raw file stored by a run that then failed was invisible to retries (GPT). Rev 3 records each stage when it finishes, in D1, where unique keys make concurrent writers safe. **No `manifests/` prefix is used** (rev 2's is withdrawn).

```sql
-- "raw input ready": written once the raw object is complete and its size verified by head()
CREATE TABLE IF NOT EXISTS firms_inputs (
  run_id TEXT PRIMARY KEY,            -- <scheduled stamp>-<retrieved ms>-<6 random chars>; unique per invocation
  raw_key TEXT NOT NULL UNIQUE,       -- raw/firms/<run_id>.csv
  scheduled_at TEXT NOT NULL, retrieved_at TEXT NOT NULL,
  bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, content_length INTEGER,   -- content_length null when FIRMS sent none
  created_at TEXT NOT NULL, collector_version TEXT NOT NULL);
-- "processed output complete": written once snapshot + sidecar are complete and size-verified
CREATE TABLE IF NOT EXISTS firms_outputs (
  run_id TEXT PRIMARY KEY REFERENCES firms_inputs(run_id),
  snapshot_key TEXT NOT NULL, snapshot_bytes INTEGER NOT NULL, records INTEGER NOT NULL,
  aux_key TEXT NOT NULL, aux_bytes INTEGER NOT NULL, format TEXT NOT NULL,   -- 'lines/1'
  completed_at TEXT NOT NULL,
  latest_at TEXT, cells_at TEXT,      -- when this run's latest/ and latest-cells/ publications succeeded (null until then)
  superseded_at TEXT);                -- a newer run owns latest/: this run will not publish
-- attempt accounting: one row per attempt to process (step B) or publish (step C) a given input
CREATE TABLE IF NOT EXISTS firms_attempts (
  run_id TEXT NOT NULL REFERENCES firms_inputs(run_id),
  attempt INTEGER NOT NULL,           -- 1, 2, 3 — the bound
  invocation TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, outcome TEXT, note TEXT,
  PRIMARY KEY (run_id, attempt));
```
- **Claiming an attempt is the concurrency guard:** `INSERT INTO firms_attempts (run_id, attempt, …) SELECT ?, COALESCE(MAX(attempt), 0) + 1, … FROM firms_attempts WHERE run_id = ? HAVING COALESCE(MAX(attempt), 0) < 3`. Two invocations that try at the same moment compute the same number; the primary key lets one insert succeed and the other fail, and the loser does nothing. At most 3 attempts per input, ever (the original + 2 retries).
- An attempt that never records `finished_at` (the invocation died) still counts toward the bound. An unfinished attempt younger than 15 min blocks a new claim (it may still be running); older ones do not.
- `firms_outputs` is `INSERT OR IGNORE`: if two attempts on the same input both finish, the first record stands; the second attempt's objects are never referenced and expire with their prefix (§3).
- These tables replace nothing that exists today; `collector_runs` keeps one row per invocation as now (health checks and coverage read it unchanged). Rows per run: ≤ 1 input + ≤ 1 output + ≤ 3 attempts.

## 3. Objects and format
| Object | Key | Written by | Lifecycle (existing rules) |
|---|---|---|---|
| raw CSV | `raw/firms/<run_id>.csv` | step A | `raw/` — 2 days (unchanged) |
| snapshot | `snapshots/firms/<run_id>.json` | step B | `snapshots/` — 2 days (unchanged) |
| sidecar | `snapshots/firms-aux/<run_id>.json` | step B | `snapshots/` — 2 days (unchanged; outside the `snapshots/firms/` listing the checkpoint uses) |
| cells file | `cells/firms/<run_id>.json` | step C | `cells/` — 2 days (unchanged) |
| published | `latest/firms.json`, `latest-cells/firms.json` | step C (CAS, §5) | none — kept until replaced (unchanged) |
| checkpoint | `archive/checkpoints/firms/<day>.json.gz` | step D | none — kept (unchanged) |
**No new prefix, no lifecycle-rule change, no `manifests/`.** Incomplete multipart uploads are aborted by R2 after 7 days by default (*stated*); every failed write also calls `abort()`.
Custom metadata on `latest/` and `latest-cells/`: `run_id`, `retrieved_at`, `format` (well under R2's 8,192-byte metadata cap, *stated*). Multipart objects cannot carry final hashes in their own metadata (it is fixed before streaming starts) — the hashes and counts live in D1 (§2).

**Format `lines/1` — every line has a bound.** The writer emits the envelope as valid JSON in which each line holds exactly one of: one top-level field with a scalar or a small object (header fields: version, times, scope, quantity, coverage_default, window_rule …), one `records` row, one `cells` entry (`"12_34":{"count":7,"coverage":{…}}`), one `by_hour` entry (one cell's count inside its hour's object, `"12_34":5`), or structural punctuation. Order: header fields → `record_fields` → `records` → `cells` → `by_hour`.
- **Line limit 4 KiB, enforced by both writer and reader.** The writer fails the run if any line it would emit exceeds it (no header field comes close: the longest today is `window_rule`, ~170 B). The reader fails if it meets a longer line and never buffers past it.
- **`by_hour` keeps its shape.** Rev 2 would have written each hour's object on one line, which exceeds 4 KiB in a busy hour (hundreds of cells). `lines/1` writes `"by_hour":{`, then for each hour `"2026-11-06T08":{`, one `"12_34":5,` line per cell, and `},` — the same nested object, one cell entry per line.
- **Dense bound:** grid 45 × 90 = 4,050 cells; a `day_range=1` file covers ≤ 24 hours → ≤ 4,050 `cells` lines and ≤ 97,200 `by_hour` lines. The in-memory maps behind them are bounded by the same numbers (§10).
- Any `JSON.parse` consumer (the page, `/snapshot/firms`) sees the same object; only key order and whitespace differ from today (§12).

## 4. One run, start to finish
Each step's input is immutable and named; each step records completion in D1 before the next depends on it.

**Step A — fetch → raw.** Stream the response body. Buffer at most one part (P = 5 MiB, R2's minimum part size; all parts but the last equal; ≤ 10,000 parts — *stated*). Ends within the first part → one `put`; otherwise multipart, one part buffered at a time, `abort()` on any error. While streaming: incremental SHA-256, byte count, and `Content-Length` if sent (**verify** whether FIRMS sends it; if it does, a short body is a detected truncation). After completion: `head()` size must equal the byte count. Then insert `firms_inputs` (input ready). Peak: one part + stream buffers.

**Step B — raw → snapshot + sidecar.** Claim an attempt (§2). Stream `raw/…` from R2 through `TextDecoderStream` and a line splitter (carry ≤ 4 KiB). Per line: today's checks unchanged (`firmsRowProblem`, field count). Each valid row is written straight into the `lines/1` snapshot writer (bounded parts, as step A) and folded into small maps: `cells`, `by_hour`, and the sidecar's per-cell day aggregates (`n, frpSum, frpMax, frpN, day, night` — exactly `firesDaily`'s fields) plus `last_observation_at` and `records`. After the rows: `cells` and `by_hour` lines; complete the upload; write the sidecar (small; `put`). `head()` sizes must match. Insert `firms_outputs` (output complete). Any malformed row or line over the limit → `abort()`, attempt `outcome = 'failed'`, `writeDown` as today; nothing published. Peak: one input chunk + one output part + the maps (§10).

**Step C — publish** (§5). **Step D — checkpoint** (§7). **Step E — readers** (§8).

**Where each run starts:** a scheduled run first looks for unfinished work (§6) and does at most one piece of it, then fetches. A manual `/admin/run/firms` behaves the same.

## 5. Publication: compare-and-swap with run identity
`latest/firms.json` (records) and `latest-cells/firms.json` (counts) are the two shared objects. Each carries `run_id` and `retrieved_at` in custom metadata. R2 `put` accepts `onlyIf: { etagMatches }` and returns `null` without storing when the condition fails (*stated*).

**Ordering rule:** an object belongs to the newer run by `retrieved_at`; equal `retrieved_at` with a different `run_id` is ordered by `run_id` (deterministic). A **legacy** object (no `run_id` metadata — everything written before this change) is older than our run if its `head().uploaded` is earlier than our `retrieved_at` (a file is uploaded after it was retrieved, so an earlier upload means an earlier retrieval); otherwise it is treated as newer. No body read is needed.

**C1 — records (`latest/`)**, up to 3 rounds:
1. `h = head(latest/firms.json)`.
2. `h` is **ours** (`run_id` equal) → C1 already done (this is the repair path) → go to C2.
3. `h` is **newer** than ours → set `firms_outputs.superseded_at`, stop: the newer run owns publication. (Its own C2 publishes its counts.)
4. `h` is older → `put(latest/…, stream copy of our snapshot, { onlyIf: { etagMatches: h.etag }, customMetadata })`. `null` → another writer won between 1 and 4 → next round. Success → `latest_at` in D1.
5. `h` is **absent** (empty bucket) → create-only `put` with `onlyIf: { etagDoesNotMatch: "*" }`. R2 says conditional headers other than `If-Range` are supported (*stated*); the `*` form is **verify** in local workerd. **If it cannot be verified, the run refuses to publish** and logs "no latest/firms.json: one-time seeding needed" — **there is no unconditional first write** (rev 2's fallback removed). Production already has both objects, so this path only matters for a fresh bucket; seeding would be its own Approve line.
After 3 lost rounds → `outcome = 'contended'`; the attempt ends; nothing is overwritten.

**C2 — counts (`latest-cells/`)**, only once `latest/` holds ours, up to 3 rounds:
1. `hc = head(latest-cells/firms.json)`.
2. `hc` is ours → done.
3. `hc` is newer than ours → stop. This includes a newer **down** run's cells file (today's `writeDown` replaces `latest-cells/` with a down envelope; that stays, and goes through the same CAS): the newer information is that the source is down, and the page shows that, as it does today.
4. `hc` older → `put(…, { onlyIf: { etagMatches: hc.etag } })`; `null` → next round. Success → `cells_at` in D1.

**Repair after a partial publication (GPT's case).** C1 succeeded, C2 failed (`latest_at` set, `cells_at` null). The retry (§6) re-enters C: C1 step 2 sees **its own** `run_id` on `latest/` — it does not "skip because equal", it recognises the same run — and proceeds to C2, which writes only the counts, conditional on the etag it just read. If a newer run published meanwhile, C1 step 3 stops the repair and nothing is overwritten. Between the failure and the repair the pair is mismatched; readers already pair on `retrieved_at` (`/place` withholds the firms section; the page keeps its last good pair), so the mismatch is visible and safe.

**`writeDown` and other writers** of `latest-cells/` (and `/ingest`, which does not publish firms) use the same CAS and metadata from this change on, so every writer of a shared object obeys one rule.

## 6. Retries: discovery, bound, concurrency
At the start of each run, one query finds at most one piece of unfinished work, newest first:
- **Unprocessed input:** a `firms_inputs` row with no `firms_outputs` row, fewer than 3 attempts, no unfinished attempt younger than 15 min, `retrieved_at` newer than the current `latest/` (`head()` metadata, legacy rule as §5), and its raw object still present (`head()`, it may have expired) → claim an attempt, run step B, then C.
- **Unpublished or half-published output:** a `firms_outputs` row with `latest_at` or `cells_at` null, not `superseded_at`, fewer than 3 attempts → claim an attempt, run step C (the repair path in §5).
- Older unfinished work behind a newer publication is never retried: it would only be superseded (C1 step 3). It stays recorded in D1 with its attempts.
- Every attempt is recorded (`invocation`, times, `outcome`, `note`) and also logged in `collector_runs` as today, with the `run_id` and attempt number in the note — so `/health/*` and coverage see retries like any run.
- Not included: re-processing a **different** input for a closed day (a historical recovery — reviewed decision), previous-day closure (research-first, R11), extending retention.

**Warning before inputs expire** (built and tested with this change; extends `/health/archive/firms`): a reason when (a) a **pending** checkpoint day's newest retained snapshot is older than 36 h (12 h before the 2-day rule removes it), or (b) an unprocessed input that is still the newest is older than 36 h. The reason names the key and its expiry time. No retention is extended automatically; copying to `recovery/` stays an Approve-line decision.

## 7. Checkpoint (step D) without parsing
For a closed day, input selection is unchanged (latest full `retrieved_at` on that day among retained snapshots in `snapshots/firms/`; marker checked first, written last; `INSERT OR IGNORE`; completed days never rewritten).
- **New-format input** (`firms_outputs` row, `format = 'lines/1'`): stream the snapshot through `CompressionStream('gzip')` into the checkpoint object with the bounded writer (gzip length is unknown in advance, so bounded parts, never a whole-buffer `gzipText`); `fires_daily` and the coverage's `last_observation_at` come from the sidecar, whose `run_id` must match the snapshot's; mismatch or a missing sidecar → rebuild the sidecar with one streaming line pass over the snapshot (§3 makes that a line scan), never `JSON.parse`.
- **Legacy input:** §9.
Peak: one gzip part + chunk buffers + the sidecar.

## 8. Readers (step E)
- `/snapshot/firms`: unchanged — streams the stored object.
- `/place` firms section: stream `latest/firms.json` (new format) and keep, for the asked cell, a **fixed 8-slot top list by `observed_at`** (ties in today's sort order) and a **count**. Answer shape unchanged: `records` (8, newest first), `records_total`, `count`, `cell`. Memory: 8 rows + one chunk + the line carry — independent of the cell and the file.
- Records and counts paired by `retrieved_at`; withheld on mismatch (unchanged).
- Answer cache keyed by `(etag, cell)`, capped at **256 KB** total (LRU by bytes); cleared when the etag changes.
- At most **2** concurrent firms scans per isolate; a third waits up to 2 s, then the firms section answers `unavailable` ("busy, try again"). No unbounded queue.

## 9. Legacy objects: bounded by their real sizes, not by the CSV guard
GPT's point: the 8 MiB guard limits the **CSV**; the JSON written from it is larger (GPT's valid synthetic file: JSON ≈ **1.48 ×** the CSV), and a checkpoint is gzip-compressed, so its **decompressed** size is what a reader holds. Rev 2 inferred safety from the guard; rev 3 enforces limits on the bytes actually read.
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
| A fetch / raw upload | multipart aborted; no `firms_inputs` row | last good publication | fresh fetch next run |
| A after upload, before the D1 insert | a raw object with no input record | last good | not retried (unknown to D1); expires in 2 days; the next fetch supersedes it |
| B parse / snapshot / sidecar | input recorded; no output; attempt `failed` | last good | §6 retry (≤ 3 attempts) while it is the newest input |
| B done, D1 output insert fails | objects without an output record | last good | §6 retry re-runs B (objects keyed by `run_id`; second write replaces the first unreferenced copy) |
| C1 `latest/` | output recorded; `latest_at` null | last good, consistent | §6 retry → C |
| C1 CAS lost / newer run | `superseded_at` or `contended` | the newer run | nothing; never overwritten |
| C2 `latest-cells/` | `latest/` ours, counts old → **mismatched pair** | `/place` withholds firms; page keeps its last good pair | §6 repair (C1 recognises ours → C2 only) |
| D gzip / archive / marker | no marker | — | retried next run; a gap only by the existing 2-day rule |
| D sidecar mismatch / missing | no marker yet | — | sidecar rebuilt by a line pass, then retried |
| Legacy object over L_json | refusal recorded | previous state | stays refused; a gap if a checkpoint cannot complete in time |
| E `/place` scan | — | firms section `unavailable` / `withheld` | — |

## 12. Page and API behaviour
- **Unchanged:** every URL; the envelope's fields and meaning; `records` row shape and `record_fields`; `by_hour` and `cells` shapes; `/snapshot/firms` is valid JSON with the same content; the `/place` answer shape; `/status`; `/health/*`.
- **Changed, explicitly:** key order and whitespace inside the snapshot JSON (`lines/1`); new custom metadata on the two published objects; new D1 tables; `/place` may answer the firms section "busy" under load. Any `JSON.parse` consumer is unaffected; a consumer relying on key order or exact bytes would be — none known.

## 13. Truncation and record counts (unchanged limits)
- FIRMS sends no row count. A response cut **exactly between rows** is still undetectable by content checks. If FIRMS sends `Content-Length`, a short body becomes detectable (step A) — to be measured, not assumed.
- A drop in record count versus the previous publication is an **anomaly signal**, recorded in the run note and the sidecar (`records_previous`, `delta`), **never** a reason to refuse: FIRMS legitimately removes passes (6 Nov: two whole passes, 344 + 145 detections, removed between 10:45 and 12:45 UTC; 5 Nov: 23 rows removed).

## 14. Cost, lifecycle and approval scope
**Lifecycle.** Every object this design writes sits under a prefix that already has a 2-day rule (`raw/`, `snapshots/`, `cells/`) or is already kept by design (`latest/`, `latest-cells/`, `archive/checkpoints/`). **No new prefix, no rule added or changed.** Rev 2's `manifests/` prefix is withdrawn (§2); rev 2's `snapshots-aux/` becomes `snapshots/firms-aux/`, inside the existing `snapshots/` rule. R2's default 7-day abort covers incomplete multipart uploads (*stated*).

**R2 operations per run** (Class A = writes/lists, Class B = reads/heads, *stated*):
| | Today (0.5.2) | Rev 3, CSV ≤ 5 MiB and JSON ≤ 5 MiB | Rev 3, 10 MB CSV (JSON ≈ 15 MB at 1.48×) |
|---|---|---|---|
| Class A | 5 puts (raw, snapshot, cells, latest, latest-cells) | 6 (+ sidecar) | raw multipart 4 (create, 2 parts, complete) + snapshot 5 (create, 3 parts, complete) + sidecar, cells, latest, latest-cells 4 = **13** |
| Class B | 0–1 | ~7 (heads after writes, raw read in B, snapshot read for the `latest/` copy, CAS heads) | ~7 |
| Per month (96 runs/day) | ~14,400 A | ~17,300 A · ~20,200 B | ~37,400 A · ~20,200 B |
R2 free tier: 1 M Class A and 10 M Class B per month; then **$4.50 / M** Class A and **$0.36 / M** Class B (*stated*, pricing page). **Worked example, not a ceiling:** if the account were already past the free Class A tier, the 10 MB case adds ~23,000 Class A/month ≈ **$0.10/month**. The account's current R2 usage has **not** been measured — read it before building.
**Per visitor:** each uncached `/place` view adds 1 Class B read and one scan of `latest/firms.json` in CPU. Extra Class B/month ≈ uncached views/month; extra CPU ≈ uncached views × scan time (to measure). At 10,000 uncached views/month and a 100 ms scan (assumed): 10,000 Class B (free tier) and 1 M CPU-ms (Workers Paid includes 30 M/month; then $0.02 per million ms). Visitor numbers are not measured; the cache and the scan cap bound bursts, not monthly totals.
**D1:** ≤ ~6 rows written per run (input, attempt insert + finish, output, `latest_at`, `cells_at`) ≈ 17,000/month (Workers Paid includes 50 M rows written/month); reads are single-row lookups by primary key or a small newest-first scan.
**CPU:** a streaming parse costs about what today's parse costs (80–173 ms on 5.3 MB, measured in the pane), plus gzip in the daily checkpoint and the `/place` scans above.

**Approval scope (when implementation is later authorised — each its own `Approve:` line):**
1. D1: create `firms_inputs`, `firms_outputs`, `firms_attempts` (additive, `IF NOT EXISTS`, procedure of START-HERE §4d).
2. Deploy the hub version that implements this (content only; no binding, secret, schedule or variable change).
3. Nothing else: **no R2 lifecycle change, no new prefix, no retention change.** Raising the 8 MiB guard is a separate, later decision after production measurement.

## 15. Verification (before any deploy; outputs asserted, never just survival)
**Inputs:** the real 5 Nov file (5,311,642 B, sha256 `c3487dcc…`, on the Mac); scale-ups of its own rows to 8 MiB, 16, 32 and 64 MiB; **dense synthetic files** that touch all 4,050 cells in all 24 hours (the `cells` / `by_hour` worst case) at 8 MiB and above; the 23-duplicate-line file; header-only; cut mid-row and between rows; a line of 4,097 bytes.
**Equivalence:** for every input, the new `latest/firms.json` parsed = today's `firmsParse` envelope parsed (records deep-equal in order; `cells`, `by_hour` equal); every emitted line ≤ 4 KiB, including the dense files; sidecar = today's `firesDaily` on the same envelope; checkpoint object gunzipped = the snapshot bytes; `fires_daily` rows and coverage equal to today's; `/place` firms answers equal to today's for every cell with records, including the busiest real cell and the densest synthetic cell.
**State and concurrency (deterministic, controllable R2/D1 stubs):** two invocations claiming the same input at once → one attempt row, one does nothing; a 4th claim refused; an attempt that died without `finished_at` counts toward the bound and blocks for 15 min; raw stored then B fails → the next run finds and retries it; B done but the output insert fails → retried; two invocations for the same minute write distinct keys.
**Publication:** an older run paused between `head()` and `put` while a newer run publishes → the older `put` returns `null`, the newer publication stands; `latest/` ok + `latest-cells/` failure → the retry recognises its own `run_id`, writes only the counts, and stops if a newer run published first; a newer down run's `latest-cells/` is not overwritten by an older success; an empty bucket with create-only unverified → refusal, nothing written; legacy published objects ordered by upload time.
**Legacy + new together:** §9's bench at L_json, overlapping, both caps, 3 runs, with negative controls.
**Injected failures:** every row of §11 — assert the last good publication byte-identical where it should be, no published key pointing at an incomplete object, retries bounded, nothing completed rewritten.
**Memory (local, labelled local):** the workerd bench (`phase1/bench-firms-memory/`), total-heap caps 48 / 64 / 80 MB, 3 runs each, outputs asserted, for every size up to 64 MiB and the dense files. **The "independent of file size" claim is made only if every new-path scenario passes at the same cap across all sizes.** Negative controls must FAIL.
**Production (labelled production; after a separate deploy approval):** Worker memory P50/P99/P999 and Exceeded Memory for 48 h; CPU per firms tick; R2 Class A/B from the usage page; D1 rows; `/health/*` green. The guard stays at 8 MiB until then.

## 16. Order of work (each a separate go)
1. GPT re-review of this rev 3.
2. Measure first: whether FIRMS sends `Content-Length`; the account's current R2 Class A/B usage; the largest stored legacy snapshot and checkpoint (sizes only, read-only listing); the JSON/CSV ratio on real and dense files; `etagDoesNotMatch: "*"` and `R2ObjectBody` known-length behaviour in local workerd; the busiest real cell and a `/place` scan's CPU on the 5 Nov file.
3. Build on a branch with §15's tests and bench.
4. GPT review → Chad's Approve lines (§14: D1 tables, then deploy).
5. Watch production 48 h; decide on the guard separately.
