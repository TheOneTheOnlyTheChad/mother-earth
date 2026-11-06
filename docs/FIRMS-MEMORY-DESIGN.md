# FIRMS pipeline — memory design (rev 4, 6 Nov 2026)

**Design only.** No parser rewrite, no production write, no retention change, no deployment is authorised by this document. Brief: `docs/briefs/2026-11-06-monitoring-and-memory.md` §2. Evidence: `reviews/2026-11-06-firms-guard.md` (§3 bench, §5 truncation), `phase1/bench-firms-memory/README.md`, hub 0.5.2 `worker.js` (sha256 `70307d5fc2a9…`).
Labels: **measured** = from those sources; **estimate** = reasoned, to be measured; ***stated*** = a Cloudflare documentation fact (R2 Workers API reference and "Upload objects", read through the Cloudflare connector on 6 Nov); **verify** = a platform behaviour to confirm in local workerd before relying on it.

**Rev 4 (GPT's review of rev 3, 6 Nov).** Rewritten where GPT found gaps; the rest of rev 3 stands. The SQL of §2 is **executed against real SQLite** in `docs/design-checks/firms-state.check.mjs` (13/13; it also reproduces GPT's rev-3 race, check C1) — design evidence, not hub code.
1. **Exclusive claim:** the active-attempt condition is inside the single atomic `INSERT … SELECT`, together with the bound; the caller proceeds only when the statement inserted a row (§2.2).
2. **Stale attempts:** a lease expiring proves nothing about the original invocation, so the **commit is fenced** — only the latest attempt, by token, can record an output; every attempt writes **its own immutable keys**; the one committed `firms_outputs` row names the winning keys and is the only thing ever published or checkpointed (§2.3, §3).
3. **Checkpoint discovery** reads committed outputs from D1, never an object listing, for new-format data; an uncommitted new object can never fall through to the legacy path (§7, §9).
4. **Reader pairing by run identity:** every writer of a shared FIRMS object first claims a **unique `retrieved_at`** in D1 (`firms_identity`), so one timestamp means one run and the existing timestamp pairing *is* identity pairing — **no page change needed**; the hub's `/place` additionally compares `run_id` when both files carry it (§8).
5. **Tests** for each rule, incl. real-SQLite interleavings, both shared objects absent, and bounded reads at 100k rows (§15). Legacy ordering when the upload is *after* our retrieval is labelled **uncertain** (deferred, not "newer") and tested (§5).

**Rev history.** Rev 1: first draft. Rev 2 (GPT): bounded `/place`, compare-and-swap publication, legacy transition, manifests, limits, expiry warning. **Rev 3 (GPT's re-review of `2fe320b`)** — this version is rewritten as **one procedure**; earlier sections are superseded, not appended to:
1. **Retry discovery:** separate *input ready* and *output complete* records, with bounded, concurrency-safe attempt accounting (§2, §6). Manifests are replaced by these records (§2).
2. **Publication repair:** a run is recognised by its **identity** (`run_id`), so a retry repairs a missing counts publication without overwriting a newer run; the unconditional first write is removed (§5).
3. **Legacy bounds:** the limits are on the actual **JSON bytes and decompressed bytes**, enforced while reading, and the legacy and new paths are tested together under overlap; nothing is inferred from the old bench (§9, §15).
4. **Format and lifecycle:** `cells` and `by_hour` are written one entry per line so every line has a bound (§3); dense valid inputs are tested; the object layout uses only prefixes that already have lifecycle rules, and the plan says so explicitly (§3, §14).

## 0. Bottom line
- Today the whole file is held several times at once (raw text, ~63k parsed rows, two JSON strings, and during a checkpoint the previous snapshot's text and full parse), while `/place` keeps another parsed copy resident (§1). Streaming the CSV alone would not change that.
- Proposed: the stored raw file is the one input; it is processed from R2 as a stream into outputs written in bounded parts; small per-cell results go to a sidecar so the checkpoint never parses a snapshot; `/place` scans per request keeping 8 rows; run state lives in four small D1 tables (identity, inputs, attempts, outputs) so retries and repairs are found and bounded without guessing.
- The aim is peak memory set by **declared limits** (§10), not by the file. **That is a target until §15's measurements establish it.**
- Production changes it would need (each a separate Approve line, later): an additive D1 schema change (4 tables + 3 indexes, §2) and a content-only deploy. **No new R2 prefix and no lifecycle-rule change** (§3, §14).
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


## 2. Run state in D1 (rev 4)
Every rule below is one SQL statement, executed whole by D1's single writer (each statement is atomic; a `batch()` is one transaction and rolls back as a whole, *stated*). **Proven against real SQLite:** `docs/design-checks/firms-state.check.mjs` (13/13).

### 2.1 Tables (additive; no existing table changes)
```sql
-- one row per publishing writer of a FIRMS shared object: makes retrieved_at ⇔ run_id one-to-one (§8)
CREATE TABLE firms_identity (retrieved_at TEXT PRIMARY KEY, run_id TEXT NOT NULL UNIQUE, kind TEXT NOT NULL);   -- kind: input | down
-- "raw input ready"
CREATE TABLE firms_inputs (run_id TEXT PRIMARY KEY REFERENCES firms_identity(run_id), raw_key TEXT NOT NULL UNIQUE,
  scheduled_at TEXT NOT NULL, retrieved_at TEXT NOT NULL UNIQUE, bytes INTEGER NOT NULL, sha256 TEXT NOT NULL,
  content_length INTEGER, created_at TEXT NOT NULL, collector_version TEXT NOT NULL);
-- attempt ownership: the token is the attempt's identity; lease_until only says when another invocation may try
CREATE TABLE firms_attempts (run_id TEXT NOT NULL REFERENCES firms_inputs(run_id), attempt INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE, invocation TEXT NOT NULL, started_at TEXT NOT NULL, lease_until TEXT NOT NULL,
  finished_at TEXT, outcome TEXT, note TEXT, PRIMARY KEY (run_id, attempt));
-- "processed output complete": exactly one per input, naming the winning attempt's immutable keys
CREATE TABLE firms_outputs (run_id TEXT PRIMARY KEY REFERENCES firms_inputs(run_id), attempt INTEGER NOT NULL, token TEXT NOT NULL,
  retrieved_at TEXT NOT NULL UNIQUE, day TEXT NOT NULL,
  snapshot_key TEXT NOT NULL UNIQUE, snapshot_bytes INTEGER NOT NULL, snapshot_sha256 TEXT NOT NULL, records INTEGER NOT NULL,
  aux_key TEXT NOT NULL UNIQUE, aux_bytes INTEGER NOT NULL, format TEXT NOT NULL, completed_at TEXT NOT NULL,
  publish_attempts INTEGER NOT NULL DEFAULT 0, latest_at TEXT, cells_at TEXT, superseded_at TEXT);
CREATE INDEX firms_inputs_created ON firms_inputs (created_at);
CREATE INDEX firms_outputs_day ON firms_outputs (day, retrieved_at);
CREATE INDEX firms_outputs_unpublished ON firms_outputs (retrieved_at) WHERE cells_at IS NULL AND superseded_at IS NULL;
```
Growth: ~96 inputs/day → ~35,000 rows/year per table. Every query below is an index search; the check builds **100,000 runs** and asserts no table scan in any plan and flat per-query time (C13; local SQLite timings, not D1). Pruning is not proposed (a retention decision; the rows are small).

### 2.2 Claiming an attempt — exclusive and bounded in one statement
```sql
INSERT INTO firms_attempts (run_id, attempt, token, invocation, started_at, lease_until)
  SELECT ?1, COALESCE(MAX(a.attempt), 0) + 1, ?2, ?3, ?4, ?5 FROM firms_attempts a WHERE a.run_id = ?1
  HAVING COALESCE(MAX(a.attempt), 0) < 3                                                     -- bound
     AND NOT EXISTS (SELECT 1 FROM firms_attempts b WHERE b.run_id = ?1
                     AND b.finished_at IS NULL AND b.lease_until > ?4)                       -- no live owner
     AND NOT EXISTS (SELECT 1 FROM firms_outputs o WHERE o.run_id = ?1);                     -- not already done
```
`?2` = a fresh random token, `?4` = now, `?5` = now + 15 min. **The caller proceeds only if `meta.changes === 1`.** Two contenders: whichever statement runs second sees the first one's live, unfinished attempt and inserts nothing (C2). Rev 3's form inserted for both (C1 reproduces GPT's result). Three attempts at most, ever (C3); a committed output blocks further claims (C4).

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
- `changes === 1` → this attempt owns the input's output. `0` → it is stale (a later attempt exists) or a commit already happened: it stops, publishes nothing, marks itself `outcome = 'fenced'`; its objects are unreferenced and expire with their prefix.
- Tested: A stalls, B claims and commits, A resumes → A inserts nothing (C5); B claimed but A resumes first → A still fenced, B commits (C6); A overruns its lease with no replacement → A may commit (C7; the fence is "latest attempt", not elapsed time); a duplicate commit inserts nothing (C8).
- **Immutable output keys per attempt** (§3): `snapshots/firms/<run_id>-a<attempt>-<token>.json` and `snapshots/firms-aux/<run_id>-a<attempt>-<token>.json`. No two attempts ever write the same key, so a stale attempt cannot overwrite the winner's objects, and `INSERT OR IGNORE`-style "first wins" applies to *references*, not to bytes that something else could still change.
- **The winning output is selected by D1, nowhere else:** publication (§5), checkpoints (§7) and retries (§6) read the one `firms_outputs` row and use exactly its keys, after checking `head().size` of each against the recorded bytes.
- `FINISH`: `UPDATE firms_attempts SET finished_at = ?, outcome = ? WHERE token = ? AND finished_at IS NULL` — after commit, failure or fencing.

### 2.4 Publication attempts — bounded atomically
Publication needs no lease: it only ever publishes the committed output (by CAS, §5), so two publishers of the same output converge. Its retries are bounded by
```sql
UPDATE firms_outputs SET publish_attempts = publish_attempts + 1
  WHERE run_id = ?1 AND publish_attempts < 3 AND cells_at IS NULL AND superseded_at IS NULL;   -- proceed iff changes === 1
```
(C9: three succeed, the fourth does not; none once `cells_at` is set.)

### 2.5 Identity claim — one `retrieved_at`, one run
Every writer of `latest/firms.json` or `latest-cells/firms.json` first runs `INSERT OR IGNORE INTO firms_identity (retrieved_at, run_id, kind) VALUES (?,?,?)` and proceeds only on `changes === 1` (C10).
- A **collecting run** uses the raw retrieval time: on a collision (another run retrieved in the same millisecond) it abandons publication and logs it; its raw is unreferenced; the next run fetches again.
- A **down run** (`writeDown`) stamps its own clock: on a collision it re-stamps 1 ms later (≤ 3 tries). Its `retrieved_at` is our failure time, not an observation, so this changes no meaning.

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
- **`by_hour` keeps its shape.** Rev 2 would have written each hour's object on one line, which exceeds 4 KiB in a busy hour (hundreds of cells). `lines/1` writes `"by_hour":{`, then for each hour `"2026-11-06T08":{`, one `"12_34":5,` line per cell, and `},` — the same nested object, one cell entry per line.
- **Dense bound:** grid 45 × 90 = 4,050 cells; a `day_range=1` file covers ≤ 24 hours → ≤ 4,050 `cells` lines and ≤ 97,200 `by_hour` lines. The in-memory maps behind them are bounded by the same numbers (§10).
- Any `JSON.parse` consumer (the page, `/snapshot/firms`) sees the same object; only key order and whitespace differ from today (§12).

## 4. One run, start to finish
Each step's input is immutable and named; each step records completion in D1 before the next depends on it.

**Step A — fetch → raw.** Stream the response body. Buffer at most one part (P = 5 MiB, R2's minimum part size; all parts but the last equal; ≤ 10,000 parts — *stated*). Ends within the first part → one `put`; otherwise multipart, one part buffered at a time, `abort()` on any error. While streaming: incremental SHA-256, byte count, and `Content-Length` if sent (**verify** whether FIRMS sends it; if it does, a short body is a detected truncation). After completion: `head()` size must equal the byte count. Then claim the identity (§2.5) and insert `firms_inputs` (input ready) in one `batch()` (one transaction). Peak: one part + stream buffers.

**Step B — raw → snapshot + sidecar.** Claim an attempt (§2.2; proceed only on `changes === 1`). Stream `raw/…` from R2 through `TextDecoderStream` and a line splitter (carry ≤ 4 KiB). Per line: today's checks unchanged (`firmsRowProblem`, field count). Each valid row is written straight into the `lines/1` snapshot writer (bounded parts, as step A) and folded into small maps: `cells`, `by_hour`, and the sidecar's per-cell day aggregates (`n, frpSum, frpMax, frpN, day, night` — exactly `firesDaily`'s fields) plus `last_observation_at` and `records`. After the rows: `cells` and `by_hour` lines; complete the upload; write the sidecar (small; `put`). Both objects go to this attempt's own keys (§3). `head()` sizes must match. Then the **commit** (§2.3): `changes === 1` → output complete; `0` → fenced, stop. Any malformed row or line over the limit → `abort()`, attempt `outcome = 'failed'`, `writeDown` as today; nothing published. Peak: one input chunk + one output part + the maps (§10).

**Step C — publish** (§5). **Step D — checkpoint** (§7). **Step E — readers** (§8).

**Where each run starts:** a scheduled run first looks for unfinished work (§6) and does at most one piece of it, then fetches. A manual `/admin/run/firms` behaves the same.

## 5. Publication: compare-and-swap with run identity
Input: the committed `firms_outputs` row only (§2.3). Claim a publication attempt (§2.4). `latest/firms.json` (records) and `latest-cells/firms.json` (counts) carry `run_id` and `retrieved_at` in custom metadata (and `run_id` in the envelope). R2 `put` accepts `onlyIf: { etagMatches }` and returns `null` without storing when the condition fails (*stated*).

**Ordering of an existing shared object relative to ours:**
| Existing object | Ordered as | Basis |
|---|---|---|
| carries `run_id` = ours | **ours** | identity |
| carries `run_id`, other run, `retrieved_at` > ours | **newer** | `retrieved_at` is unique per run (§2.5), so no ties |
| carries `run_id`, other run, `retrieved_at` < ours | **older** | same |
| **legacy** (no `run_id`), `head().uploaded` < our `retrieved_at` | **older — established** | an object is uploaded after its data was retrieved, so an earlier upload proves an earlier retrieval |
| **legacy**, `head().uploaded` ≥ our `retrieved_at` | **uncertain → defer** | its retrieval could be earlier or later; we cannot tell without reading it. Treated conservatively: we do not overwrite; logged as "deferred: legacy object of uncertain order", not as "newer". The next run (retrieved later still) normally resolves it. |

**C1 — records (`latest/`)**, up to 3 rounds per publication attempt:
1. `h = head(latest/firms.json)`.
2. ours → go to C2 (repair path).
3. newer → `superseded_at` in D1, stop. Uncertain (legacy) → stop, deferred.
4. older → claim identity is already ours (§2.5); `put(latest/…, stream copy of the committed snapshot, { onlyIf: { etagMatches: h.etag }, customMetadata })`. `null` → next round. Success → `latest_at`.
5. **absent** → create-only `put` with `onlyIf: { etagDoesNotMatch: "*" }` (**verify** in local workerd that `*` means "only if absent"). If that cannot be verified, **refuse to publish** and log "latest/firms.json absent: one-time seeding needed". **No unconditional write exists in this design.**
After 3 lost rounds → `contended`; nothing overwritten.

**C2 — counts (`latest-cells/`)**, only when `latest/` holds ours, up to 3 rounds:
1. `hc = head(latest-cells/firms.json)`. 2. ours → done. 3. newer (incl. a newer **down** run's file) → stop; uncertain legacy → stop, deferred. 4. older → `put(…, { onlyIf: { etagMatches: hc.etag } })`; `null` → next round; success → `cells_at`. 5. **absent** → the same create-only rule as C1 step 5, or refuse.

**Repair after a partial publication.** `latest_at` set, `cells_at` null → a later publication attempt (bounded, §2.4) re-enters C: C1 step 2 recognises **its own `run_id`**, so it goes straight to C2 and writes only the counts, conditional on the etag just read; a newer run publishing meanwhile stops it at C1 step 3. Nothing is overwritten by an older run, ever.

**Other writers** of `latest-cells/firms.json` (`writeDown`) use the same identity claim, metadata and CAS.

## 6. Retries: discovery, bound, concurrency
At the start of each run, at most one piece of unfinished work, found by one bounded query each (SQL in the design check):
- **Unprocessed input** — `firms_inputs` newer than the current publication's `retrieved_at` (legacy: its upload time, §5), created within 36 h, with no `firms_outputs` row; newest first, `LIMIT 1` (C12). Then `head()` the raw (it may have expired) and **claim** (§2.2): the claim itself enforces the bound, the live-owner exclusion and "not already done"; a `0` means someone else has it or it is spent — move on.
- **Unpublished or half-published output** — `firms_outputs` with `cells_at` null, not superseded, `publish_attempts < 3`, newest first, `LIMIT 1` (partial index `firms_outputs_unpublished`). Then the publication claim (§2.4) and §5.
- Older unfinished work behind a newer publication is never retried (it would be superseded); it stays recorded.
- Every attempt is also logged in `collector_runs` as today (run_id + attempt in the note), so `/health/*` and coverage see retries like any run.
- Not included: a **different** input for a closed day (historical recovery — reviewed decision), previous-day closure (R11), extending retention.

**Warning before inputs expire** (extends `/health/archive/firms`): (a) a pending checkpoint day whose newest **committed** output's snapshot is older than 36 h; (b) the newest unprocessed input older than 36 h. The reason names the key and its expiry. Nothing is extended automatically.

## 7. Checkpoint (step D) without parsing
For a closed day D (marker checked first, written last; `INSERT OR IGNORE`; completed days never rewritten):
- **New-format input comes from D1, not from a listing:** `SELECT … FROM firms_outputs WHERE day = D ORDER BY retrieved_at DESC, run_id DESC LIMIT 1` (index `firms_outputs_day`; C11). A new-format object with no committed `firms_outputs` row — upload succeeded, sidecar or commit failed, or a fenced attempt — is **never a candidate**, and never falls through to the legacy path (§9).
- **Legacy input** only for days before the cutover (§9), chosen exactly as today, from `snapshots/firms/` keys in the **legacy key format** (`YYYY-MM-DDTHH-MMZ.json`) only.
- **The day's input = the later of** the committed new output and the legacy candidate (by `retrieved_at`; legacy `retrieved_at` from its R2 custom metadata as today). On the cutover day both can exist.
- New-format processing: stream the committed snapshot through `CompressionStream('gzip')` into the checkpoint object (bounded parts); `fires_daily` and `last_observation_at` from the committed sidecar (same `run_id`, `attempt`, token as the output row; `head()` sizes = recorded bytes). Sidecar missing or mismatched → rebuild by one streaming line pass over the committed snapshot, never `JSON.parse`.
Peak: one gzip part + chunk buffers + the sidecar.

## 8. Readers (step E)
- `/snapshot/firms`: unchanged — streams the stored object.
- `/place` firms section: stream `latest/firms.json` (new format) and keep, for the asked cell, a **fixed 8-slot top list by `observed_at`** (ties in today's sort order) and a **count**. Answer shape unchanged: `records` (8, newest first), `records_total`, `count`, `cell`. Memory: 8 rows + one chunk + the line carry — independent of the cell and the file.
- **Pairing by run identity (rev 4).** Because every writer of a shared FIRMS object holds a unique `retrieved_at` (§2.5), two files with the same `retrieved_at` are from the same run: the existing timestamp pairing — the page's `refreshPair`/`usable()` and `/place` — already pairs by identity. **No page change is needed.** In addition, the hub's `/place` compares `run_id` when both files carry one; one carrying it and the other not (a file written before the change, the other after) is treated as a mismatch → withheld. Legacy pairs (neither carries `run_id`) are paired by `retrieved_at` exactly as today. Optional later, and not required: the page could also compare `run_id`; that would be its own reviewed page change.
- Answer cache keyed by `(etag, cell)`, capped at **256 KB** total (LRU by bytes); cleared when the etag changes.
- At most **2** concurrent firms scans per isolate; a third waits up to 2 s, then the firms section answers `unavailable` ("busy, try again"). No unbounded queue.

## 9. Legacy objects: bounded by their real sizes, not by the CSV guard
GPT's point: the 8 MiB guard limits the **CSV**; the JSON written from it is larger (GPT's valid synthetic file: JSON ≈ **1.48 ×** the CSV), and a checkpoint is gzip-compressed, so its **decompressed** size is what a reader holds. Rev 2 inferred safety from the guard; rev 3 enforces limits on the bytes actually read.
- **Cutover:** the first deploy of this design records `format_cutover_at` (the first `firms_inputs.created_at`). Legacy objects are only ever considered when their `retrieved_at` is before the cutover **and** their key is in the legacy format (`YYYY-MM-DDTHH-MMZ.json`). A new-format object is never read as legacy, whatever is missing about it (§7).
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
| B parse / snapshot / sidecar | this attempt's own keys partly written; no output row | last good | retry by a new attempt (≤ 3), new keys |
| B done, commit fenced (stale) | this attempt's objects, unreferenced | last good | nothing; the winner's output stands; the objects expire |
| B done, commit fails (D1 error) | objects, no output row | last good | retry by a new attempt, new keys |
| C1 `latest/` | output committed; `latest_at` null | last good, consistent | publication retry (≤ 3) |
| C1 newer run / uncertain legacy | `superseded_at` / deferred | the newer or existing publication | nothing overwritten |
| C2 `latest-cells/` | `latest/` ours, counts old → mismatched pair | `/place` withholds firms; page keeps its last good pair | repair: C1 recognises ours → C2 only |
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
| | Today (0.5.2) | Rev 4, CSV ≤ 5 MiB and JSON ≤ 5 MiB | Rev 4, 10 MB CSV (JSON ≈ 15 MB at 1.48×) |
|---|---|---|---|
| Class A | 5 puts (raw, snapshot, cells, latest, latest-cells) | 6 (+ sidecar) | raw multipart 4 (create, 2 parts, complete) + snapshot 5 (create, 3 parts, complete) + sidecar, cells, latest, latest-cells 4 = **13** |
| Class B | 0–1 | ~7 (heads after writes, raw read in B, snapshot read for the `latest/` copy, CAS heads) | ~7 |
| Per month (96 runs/day) | ~14,400 A | ~17,300 A · ~20,200 B | ~37,400 A · ~20,200 B |
R2 free tier: 1 M Class A and 10 M Class B per month; then **$4.50 / M** Class A and **$0.36 / M** Class B (*stated*, pricing page). **Worked example, not a ceiling:** if the account were already past the free Class A tier, the 10 MB case adds ~23,000 Class A/month ≈ **$0.10/month**. The account's current R2 usage has **not** been measured — read it before building.
**Per visitor:** each uncached `/place` view adds 1 Class B read and one scan of `latest/firms.json` in CPU. Extra Class B/month ≈ uncached views/month; extra CPU ≈ uncached views × scan time (to measure). At 10,000 uncached views/month and a 100 ms scan (assumed): 10,000 Class B (free tier) and 1 M CPU-ms (Workers Paid includes 30 M/month; then $0.02 per million ms). Visitor numbers are not measured; the cache and the scan cap bound bursts, not monthly totals.
**D1:** ≤ ~8 rows written per run (identity, input, attempt insert + finish, output, publish-attempt, `latest_at`, `cells_at`) ≈ 23,000/month (Workers Paid includes 50 M rows written/month); reads are single-row lookups by primary key or a small newest-first scan.
**CPU:** a streaming parse costs about what today's parse costs (80–173 ms on 5.3 MB, measured in the pane), plus gzip in the daily checkpoint and the `/place` scans above.

**Approval scope (when implementation is later authorised — each its own `Approve:` line):**
1. D1: create `firms_identity`, `firms_inputs`, `firms_attempts`, `firms_outputs` and their 3 indexes (additive, `IF NOT EXISTS`, procedure of START-HERE §4d).
2. Deploy the hub version that implements this (content only; no binding, secret, schedule or variable change).
3. Nothing else: **no R2 lifecycle change, no new prefix, no retention change.** Raising the 8 MiB guard is a separate, later decision after production measurement.

## 15. Verification (before any deploy; outputs asserted, never just survival)
**Inputs:** the real 5 Nov file (5,311,642 B, sha256 `c3487dcc…`, on the Mac); scale-ups of its own rows to 8 MiB, 16, 32 and 64 MiB; **dense synthetic files** that touch all 4,050 cells in all 24 hours (the `cells` / `by_hour` worst case) at 8 MiB and above; the 23-duplicate-line file; header-only; cut mid-row and between rows; a line of 4,097 bytes.
**Equivalence:** for every input, the new `latest/firms.json` parsed = today's `firmsParse` envelope parsed (records deep-equal in order; `cells`, `by_hour` equal); every emitted line ≤ 4 KiB, including the dense files; sidecar = today's `firesDaily` on the same envelope; checkpoint object gunzipped = the snapshot bytes; `fires_daily` rows and coverage equal to today's; `/place` firms answers equal to today's for every cell with records, including the busiest real cell and the densest synthetic cell.
**State and concurrency — real SQLite (`node:sqlite` + the real schema), deterministic interleavings.** Already run as design evidence (`docs/design-checks/firms-state.check.mjs`, 13/13): rev-3 race reproduced (C1); exclusive claim (C2); bound (C3); committed output blocks claims (C4); **stale attempt resumes after its replacement commits → fenced** (C5); stale resumes before the replacement commits → fenced (C6); overrun without replacement may commit (C7); duplicate commit (C8); publication bound (C9); **two runs, one `retrieved_at` → second refused** (C10); **newest snapshot without an output-complete record is not a checkpoint candidate** (C11); retry discovery (C12); **100,000 runs: every query an index search, flat timing** (C13). The build repeats them through the real `worker.js` and adds:
- the same interleavings with the R2 stub: the fenced attempt's objects are never published or checkpointed; the winner's keys are byte-identical before and after the stale attempt resumes;
- raw stored, then B fails → found and retried with new keys; commit D1 error → retried;
- a new-format snapshot present with no output row **and** a legacy candidate on the same day → the legacy path is not used for the new object; the day uses only committed or pre-cutover legacy inputs.
**Publication (R2 stub with real conditional semantics):** older run paused between `head()` and `put` while a newer run publishes → `null`, newer stands; `latest/` ok + `latest-cells/` failure → retry recognises its own `run_id`, writes only counts, stops if a newer run published first; newer down run's `latest-cells/` not overwritten; **both shared objects absent**, and each one absent alone, with create-only verified (writes once, a second create returns `null`) and unverified (refusal, nothing written); legacy object uploaded **before** our retrieval → replaced; legacy uploaded **after** our retrieval → **deferred and logged as uncertain**, not overwritten, not called newer.
**Pairing:** two runs forced to the same millisecond → the second cannot publish (identity refused), so no reader can combine their files; `/place` with `run_id` on both and different → withheld; one with and one without `run_id` → withheld; legacy pair → paired by `retrieved_at` as today; the page's existing `refreshPair` tests still pass unchanged.
**Legacy + new together:** §9's bench at L_json, overlapping, both caps, 3 runs, with negative controls.
**Injected failures:** every row of §11 — assert the last good publication byte-identical where it should be, no published key pointing at an incomplete object, retries bounded, nothing completed rewritten.
**Memory (local, labelled local):** the workerd bench (`phase1/bench-firms-memory/`), total-heap caps 48 / 64 / 80 MB, 3 runs each, outputs asserted, for every size up to 64 MiB and the dense files. **The "independent of file size" claim is made only if every new-path scenario passes at the same cap across all sizes.** Negative controls must FAIL.
**Production (labelled production; after a separate deploy approval):** Worker memory P50/P99/P999 and Exceeded Memory for 48 h; CPU per firms tick; R2 Class A/B from the usage page; D1 rows; `/health/*` green. The guard stays at 8 MiB until then.

## 16. Order of work (each a separate go)
1. GPT re-review of this rev 4.
2. Measure first: whether FIRMS sends `Content-Length`; the account's current R2 Class A/B usage; the largest stored legacy snapshot and checkpoint (sizes only, read-only listing); the JSON/CSV ratio on real and dense files; `etagDoesNotMatch: "*"` and `R2ObjectBody` known-length behaviour in local workerd; the busiest real cell and a `/place` scan's CPU on the 5 Nov file.
3. Build on a branch with §15's tests and bench.
4. GPT review → Chad's Approve lines (§14: D1 tables, then deploy).
5. Watch production 48 h; decide on the guard separately.
