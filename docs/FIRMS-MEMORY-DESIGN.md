# FIRMS pipeline — memory design (rev 2, 6 Nov 2026, branch `hub-health`)

> **Rev 2 (GPT's review of rev 1):** §2a (bounded `/place`), §2b (concurrency), §2c (old-format transition), §2d (manifests and verification), §2e (limits) and §3a (expiry warning) are new; Step C's failure claim, §4 and §7 are corrected. Platform facts marked *stated* in rev 2 were read from Cloudflare's R2 docs through the Cloudflare connector on 6 Nov. GPT's verdict stands until re-review: **"independent of file size" is a design target, not an established property** — §8 is how it would be established.

Brief: `docs/briefs/2026-11-06-monitoring-and-memory.md` §2. **Design only — no parser rewrite, no code, no deploy.** Evidence base: `reviews/2026-11-06-firms-guard.md` (§3 bench, §5 truncation), `phase1/bench-firms-memory/README.md`, hub 0.5.2 `worker.js` (sha256 `70307d5fc2a9…`). Figures marked **measured** come from those; **estimate** = reasoned, to be measured; **verify** = a platform fact not yet confirmed in the docs read today.

## 0. Bottom line
- Today's pipeline holds the **whole file several times at once**: the raw text, ~63k parsed row arrays, two full `JSON.stringify` copies, and — when a checkpoint runs inside the same collect — the previous snapshot's text **and** its fully parsed records, while `/place` keeps a third parsed copy resident for the isolate's life. That is why 12 MiB fails the two-collect case under the 128 MB cap and why the guard sits at 8 MiB (measured).
- Streaming the CSV parse alone does not fix it: the rows array, the output strings, the checkpoint's `JSON.parse` and the `/place` cache would all still scale with the file.
- **Proposed (smallest workable):** make the stored raw file the one input; process it from R2 as a stream; write outputs as streams in bounded parts; carry the small per-cell results (counts, hourly counts, daily fire aggregates, last observation) in a **sidecar** so the checkpoint never parses the snapshot; let `/place` scan the published file per request instead of keeping it resident. The target is peak memory set by **declared limits** — part size, maximum line length, concurrent scans, cache bytes, the grid (≤ 4,050 cells) — not by the file (§2e). Not yet established: §8. Page and API shapes stay as they are (§5).
- Cost: a handful of extra R2 Class A operations per run only when a file is larger than one part (§7). Named, not incurred.
- Nothing here changes retention, rewrites a completed archive, or touches previous-day closure (research-first) or recoveries from a different input (reviewed decisions).

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

## 2. Design (smallest workable)
Five steps per run; each step's input is immutable and named, each output is written whole before anything points at it.

**Step A — Fetch → raw (bounded).** Read the fetch body as a stream and write it to `raw/firms/<stamp>.csv` **without holding the file**: accumulate up to one part (P = 5 MiB: R2's minimum part size, all parts but the last the same size, max 10,000 parts — *stated*). If the stream ends within the first part → one `put` (as today). Otherwise → R2 multipart upload, one part buffered at a time; **abort** the upload on any error. While streaming: SHA-256 of the bytes (incremental), byte count, `Content-Length` if FIRMS sends one (**verify** — unknown today; if present, a short body is a detected truncation, which closes part of §6's gap). These go into the run's **manifest** (§2d) — with multipart they cannot go into the object's own metadata, which is fixed before streaming starts. Key: unique per run (§2b). Peak: P + stream buffers. R2 `put` needs a stream of known length (*stated*), which is why the bounded-part approach is used rather than piping the response straight in.

**Step B — Raw → snapshot (streaming parse + streaming write).** Re-open `raw/…csv` from R2 as a stream (`TextDecoderStream` → line splitter with a carry buffer for a line split across chunks). Per line: today's checks unchanged (`firmsRowProblem`, field count). For each valid row, **emit** it straight into the output writer as one JSON array on its own line; keep only:
- `cells` (≤ 4,050 entries), `byHour` (≤ 24 × cells touched), and the **daily sidecar**: per cell `n, frpSum, frpMax, frpN, day, night` (exactly `firesDaily`'s fields) + `last_observation_at` + `records` count.
The output is the same envelope written in this order: header fields → `"record_fields"` → `"records":[` + one row per line + `]` → `"cells"` → `"by_hour"` → closing fields. Still one valid JSON object; only the key order changes. Written to `snapshots/firms/<stamp>.json` through the same bounded writer as step A (single put if ≤ P, else multipart; abort on error). A malformed row → abort the upload, `writeDown` as today, nothing published. Peak: one input chunk + one output part + the small maps — **independent of N**.

**Step C — Validate, then publish.** Read back the snapshot's metadata (`head()`: size) and check it against what was written (bytes and record count counted while streaming, raw sha256 — all held in the run's manifest, §2d). Then, in today's order:
1. `snapshots-aux/firms/<stamp>.json` — the sidecar (small; carries `raw_sha256`, `snapshot key`, `retrieved_at`, `records`).
2. `cells/firms/<stamp>.json`, then `latest/firms.json` = a **stream copy** of the snapshot (`get` → `put` of a body whose length is known from the object size; **verify** that an `R2ObjectBody` stream satisfies the known-length rule, otherwise a `FixedLengthStream` of that size). There is no server-side copy in the Workers binding (*stated*: methods are head/get/put/delete/list/multipart).
3. `latest-cells/firms.json` last (small) — readers pair records and counts by `retrieved_at` (`/place` withholds a mismatch), as today.
4. Ordering is enforced by a compare-and-swap, not a check-then-write — §2b.
If the `latest/` write fails, `latest/` still holds the last good snapshot (a `put` is all-or-nothing) and `latest-cells/` is not advanced: the pair stays consistent. **If the `latest-cells/` write fails after `latest/` succeeded, the pair is mismatched** (records new, counts old) until the next successful step C. Two objects cannot be written atomically; readers already pair on `retrieved_at` (`/place` withholds the section; the page keeps its last good pair), so the mismatch is visible and safe, not hidden (corrected in rev 2; §4 row C3 already said so). The run is logged `down` with the step named.

**Step D — Checkpoint without parsing.** For a closed day, choose the input exactly as today (latest full `retrieved_at` on that day among retained snapshots; marker checked first, written last). Then:
- **stream** the snapshot through `CompressionStream('gzip')` into `archive/checkpoints/firms/<day>.json.gz` with the bounded writer (gzip output length is unknown in advance → bounded parts, never a whole-buffer `gzipText`);
- `fires_daily` rows and the coverage's `last_observation_at` come from the **sidecar**, which must name the same snapshot key and `retrieved_at` (and raw sha256) — a mismatch stops the checkpoint (retried next run);
- no sidecar (snapshots written before this change, or a lost sidecar write): rebuild it with **one streaming pass** over the snapshot (our own one-row-per-line format makes this a line scan), never a `JSON.parse` of the whole file. Before this change lands, old snapshots use today's path, which stays behind the 8 MiB guard.
- D1 writes, coverage before marker, marker last — unchanged.
Peak: one gzip part + chunk buffers + the sidecar.

**Step E — `/place` and `/snapshot` while all this runs.**
- `/snapshot/firms`: unchanged (streams the stored object).
- `/place`: drop the resident full index — replaced in rev 2 by §2a (bounded selection, not "every row of the cell").
- Records and counts still paired by `retrieved_at`; withheld on mismatch, as today.

## 2a. `/place` with a fixed memory bound (rev 2, GPT)
Rev 1 kept every matching row of the asked cell, which grows with a busy cell. But the firms section only ever **returns** `PLACE.listMax` = 8 records (newest first) plus `records_total`.
- Per request: stream `latest/firms.json`; for the asked cell keep a **top-8 by `observed_at`** (ties broken by the existing sort's order) in a fixed 8-slot buffer, and a **count**. Memory = 8 rows + one chunk + the line carry (§2e) — independent of the cell and the file.
- Answer shape unchanged: `records` (8, newest first), `records_total`, `count`, `cell`. Plastic is not a FIRMS concern (its records are small and capped by the source file); unchanged.
- Cache: keyed by `(etag, cell)`, storing only that answer (≈ 8 rows ≈ 1 KB), capped by **bytes** (e.g. 256 KB total, LRU), not by entry count. Cleared when the etag changes.
- **Concurrent scans** are capped per isolate (e.g. 2). A request over the cap waits up to a short bound, then answers the firms section as `unavailable` ("busy, try again") — never an unbounded queue of full scans.

## 2b. Concurrent publication and overlapping invocations (rev 2, GPT)
Rev 1's "check `retrieved_at`, then write" is a race: an older run can check, pause, and overwrite a newer publication.
- **Unique keys for everything a run writes privately:** `raw/firms/<stamp>-<retrievedMs>-<rand6>.csv`, `snapshots/firms/<stamp>-<retrievedMs>-<rand6>.json`, sidecar and manifest likewise. Two invocations for the same scheduled minute (cron + manual, or a retry) can never write the same key. Readers that list a day's snapshots already choose by full `retrieved_at` (unchanged).
- **Compare-and-swap for the shared keys** (`latest/firms.json`, `latest-cells/firms.json`): R2 `put` accepts `onlyIf: { etagMatches }` and returns `null` without storing when the condition fails (*stated*). Procedure:
  1. `head(latest/firms.json)` → current etag E and its `retrieved_at` (kept in the object's custom metadata from now on).
  2. If current `retrieved_at` ≥ ours → do not publish (we are older); log "superseded", success for monitoring purposes is the newer run's.
  3. Else `put(latest/…, body, { onlyIf: { etagMatches: E } })`. `null` → someone published between 1 and 3 → go back to 1 (at most 3 rounds, then log "contended" and leave the newer publication standing).
  4. Same CAS for `latest-cells/` against its own etag, with the rule that it only advances to the `retrieved_at` now in `latest/`.
  An older run therefore cannot overwrite a newer publication: either its condition fails, or it sees the newer `retrieved_at` first.
- First publication (no object yet): `onlyIf: { etagDoesNotMatch: "*" }` is the create-only form of the standard conditional headers R2 supports (*stated* that conditional headers other than `If-Range` are supported; the `*` form specifically — **verify** in local workerd before relying on it; the fallback is the old unconditional first write, which happens once).

## 2c. The old-format transition (rev 2, GPT)
Snapshots written before this change are compact JSON (all records on one line), not one-record-per-line. They must never be scanned as lines.
- New objects carry `customMetadata.format = "lines/1"`; anything without it is **legacy**.
- **Legacy objects are bounded by construction:** every legacy snapshot and `latest/` was produced under the 8 MiB guard (0.5.2 parses nothing larger), and the legacy path for them is exactly today's verified one (72/72 bench passes at 5.3 MB and 8 MiB). So the fallback is "today's code, only for legacy objects, which are all ≤ 8 MiB" — it does not recreate an unbounded problem. A legacy object over 8 MiB is refused (logged), not parsed.
- Where legacy objects appear: `snapshots/firms/` (gone within 2 days by the lifecycle rule), `latest/` (until the first new publication — minutes), archived checkpoints (`archive/checkpoints/firms/*.json.gz`, kept; read only by coverage backfill, which already has its 3-per-run cap). `/place` and the checkpoint branch on `format`.
- Legacy archived checkpoints stay as they are (never rewritten).

## 2d. Hashes, counts and when they are known (rev 2, GPT)
With multipart, custom metadata is fixed at `createMultipartUpload` — **before** the content is streamed — so the final sha256, byte count and record count cannot go into the object's own metadata. (Custom metadata is also capped at 8,192 bytes, *stated*.)
- Each run writes a small **manifest** last: `manifests/firms/<run-id>.json` = `{raw: {key, bytes, sha256, content_length}, snapshot: {key, bytes, sha256, records, format}, sidecar: {key, sha256}, retrieved_at, collector_version, state: "complete"}`. Single-put objects may also carry their hashes in metadata; the manifest is the one place that always has them.
- **The manifest is the commit record.** Steps C (publication), D (checkpoint) and retries only use a snapshot that has a complete manifest whose sizes match `head()` of each object. An object without a manifest is an unfinished run: ignored, expired by its prefix's lifecycle rule.
- Verification after writing: compare `head().size` with the bytes counted while streaming (cheap, every run). A full read-back re-hash costs one more Class B read and one more pass of CPU; proposed only for the raw object, and only when `Content-Length` was absent (when it is present, the byte count already matches it).
- Incomplete multipart uploads are aborted by R2 after 7 days by default (*stated*); a failed run also calls `abort()` itself.

## 2e. Declared limits (rev 2, GPT)
| Limit | Proposed | On breach |
|---|---|---|
| Part size (all streams) | 5 MiB | — (R2 minimum) |
| Maximum line length (CSV and our line format) | 4 KiB (real FIRMS rows ≈ 80 B) | the run fails "line too long" — never buffers further |
| Concurrent `/place` scans per isolate | 2 | §2a "busy" answer |
| `/place` answer cache | 256 KB total, LRU | evict |
| Cells, hours | grid ≤ 4,050 cells; ≤ 24 h per file | structural |
| Legacy parse path | 8 MiB (today's guard) | refuse |
| Raw size the new path accepts | **no new guard proposed until §8's measurements**; the 8 MiB guard stays in force until then | — |
Peak per collect ≈ 2 × part + chunk buffers + line carry + the small maps; peak per `/place` ≈ chunk + carry + 8 rows. These are arithmetic from the limits, **to be measured** (§8), not results.

## 3. Retries of the same retained input (bounded, idempotent)
- The unit of work is **one raw object** (`raw/firms/<stamp>.csv`, sha256 in its metadata). Steps B–C can be re-run on it without fetching again.
- **When:** if step B or C fails, the next scheduled run first retries the **most recent** unprocessed raw — only if no newer raw has been processed since (a newer success supersedes it), at most **2** retries per raw, and only while the raw is retained (2-day rule, unchanged; no retention is extended).
- **Idempotent:** outputs are keyed by the raw's stamp; a snapshot already complete for that raw (custom metadata `raw_sha256` matches and the sidecar exists) is reused, not rewritten; publication applies the ordering guard; checkpoints keep marker-first / marker-last and never rewrite a completed day (`INSERT OR IGNORE`, object keyed by day, already-done check first).
- **Record:** each attempt is a `collector_runs` row whose note names the raw stamp and the attempt number, so the health checks and coverage see it like any run.
- Retries pick inputs by **manifest** (§2d), never by a guessed key.
- Not included: re-processing a **different** input for a closed day (that is a historical recovery — a reviewed decision), and previous-day closure (research-first, R11).

## 3a. Warning before a retry input expires (rev 2, GPT)
- Retained inputs expire by the R2 lifecycle rules (`raw/`, `snapshots/`: 2 days, unchanged). A retry, or a pending checkpoint, can only use an input while it exists.
- Proposed: the archive health check (`/health/archive/<layer>`) adds a reason when a **pending** day's newest retained input is within **12 h** of its 2-day expiry (age > 36 h), naming the key and its expiry time — so Chad hears about it while a recovery from the same input is still possible. Built and tested with the memory change, not in the monitoring branch.
- No retention is extended automatically; extending it (e.g. copying to `recovery/`) stays a reviewed decision with an Approve line, as on 6 Nov.

## 4. Failure halfway through each stage
| Fails during | What remains | What the reader sees | Next run |
|---|---|---|---|
| A (fetch/raw upload) | multipart aborted; no raw object (or none completed) | last good publication | fresh fetch |
| B (parse/snapshot write) | raw kept; snapshot upload aborted | last good publication | bounded retry of that raw (§3) or newer fetch |
| C1 sidecar | snapshot exists, not published | last good | retry from step C (snapshot reused) |
| C2 latest copy | `latest/` unchanged (put is all-or-nothing) | last good, consistent pair | retry C |
| C3 latest-cells | `latest/` new, `latest-cells/` old → **mismatched pair** (not consistent; Step C text corrected in rev 2) | `/place` withholds firms; page pairs on `retrieved_at` (`refreshPair`) and keeps the last good pair | retry C3 (idempotent, CAS) |
| C (CAS lost) | a newer run published in between | the newer publication | nothing to do; logged "superseded" |
| any (manifest not written) | objects without a manifest | last good publication | ignored; expired by lifecycle |
| D gzip/archive | archive upload aborted; no marker | — | retried next run; gap only after the 2-day retention rule, as today |
| D sidecar mismatch | no marker | — | sidecar rebuilt by a streaming pass, then retried |
| E `/place` read | — | firms section `unavailable`/`withheld` | — |

## 5. Page and API behaviour
- **Unchanged:** every URL; the envelope's fields and their meaning; `records` row shape and `record_fields`; `/snapshot/firms` bytes are valid JSON with the same content; `/place` answer shape; `/status`; the new `/health/*`.
- **Changed, explicitly:** key order inside the envelope (records before cells and by_hour); whitespace (one row per line). Any consumer using `JSON.parse` is unaffected; a consumer relying on key order or exact bytes would be — none known (the page parses JSON). Two new R2 prefixes: `snapshots-aux/firms/` (needs the 2-day lifecycle rule like `snapshots/` — **a production setting, needs Chad's go**) and multipart uploads (aborted ones are cleaned up by R2; **verify** the default abort/expiry behaviour for incomplete uploads).
- Envelope gains: `raw_sha256`, `raw_bytes` (already present), `content_length` (if FIRMS sends one).

## 6. Truncation and record counts (unchanged limits)
- FIRMS sends no row count. A response cut **exactly between rows** is still undetectable by content checks. If FIRMS sends `Content-Length`, a short body becomes detectable (step A) — to be measured, not assumed.
- A drop in record count versus the previous publication is an **anomaly signal**, recorded in the run note and the sidecar (`records_previous`, `delta`), **never** a reason to refuse: FIRMS legitimately removes passes (6 Nov: two whole passes, 344 + 145 detections, removed between 10:45 and 12:45 UTC; 5 Nov: 23 rows removed).

## 7. Cost (named before anything is incurred)
- Files ≤ one part (P ≈ 5 MiB): R2 operations per run as today (raw, snapshot, cells, latest, latest-cells: 5 Class A) **+1** (sidecar) **+1 Class B** (the read-back of raw in step B) **+1 Class B** (latest copy reads the snapshot).
- Files > P: each multipart upload = create + parts + complete (Class A). At 10 MB: raw 4 + snapshot ~4 + checkpoint (once a day) small. Roughly **+10 Class A per run** at that size → 96 runs/day ≈ 29,000/month.
- R2 (*stated*, pricing page read 6 Nov): Class A 1 M/month free then **$4.50/M**; Class B 10 M/month free then **$0.36/M**; list is Class A. Whether the account stays inside the free 1 M depends on today's total, **which has not been measured** — read the R2 usage page before building. Worst case at 10 MB files: ~29,000 extra Class A ≈ **$0.13/month** if already over the free tier.
- **Per-visitor reads (rev 2, GPT):** the $0.13 above is **an example for the stated collector workload, not a cost ceiling.** Each uncached `/place` request adds one R2 Class B read of `latest/firms.json` and one scan of it in CPU. Formula: extra Class B per month ≈ uncached place requests per month (Class B: 10 M/month included, then $0.36/M, *stated*); extra CPU ≈ uncached requests × scan time (to be measured; 30 M CPU-ms/month included, then $0.02 per million ms). At 10,000 uncached place views a month that is ~10,000 Class B (inside the free 10 M) and, if a scan were 100 ms, 1 M CPU-ms (inside the included 30 M). The cache and the scan cap bound bursts, not monthly totals; current visitor numbers are not measured.
- CPU: a streaming parse costs about what today's parse costs (80–173 ms on 5.3 MB, measured in the pane) plus the `/place` per-request scan; inside the 30 M ms included on Workers Paid at today's traffic (**estimate**).

## 8. Verification plan (before any deploy; outputs asserted, not survival)
**Inputs:** the real 5 Nov file (5,311,642 B, sha256 `c3487dcc…`, on the Mac); scale-ups of its own rows to 8 MiB, 16, 32 and 64 MiB (to show memory is flat in N); a file with the 23 duplicate lines; a header-only file; files cut mid-row and between rows.
**Equivalence (correct contents):** for each input, the new pipeline's `latest/firms.json` parsed = today's `firmsParse` envelope parsed (records deep-equal in order; `cells`, `by_hour` equal); sidecar = today's `firesDaily` on the same envelope; checkpoint object gunzipped = the snapshot bytes; `fires_daily` rows and coverage equal to today's; `/place` firms sections equal for every cell with records (incl. the busiest).
**Overlap:** two collects + a checkpoint + `/place` (cold and warm) + `/snapshot` in one isolate; both collects complete; final pair consistent. **Race (rev 2):** an older run paused between its check and its write while a newer run publishes → the older run's CAS fails and the newer publication stands (deterministic test with a controllable R2 stub); two invocations for the same minute write distinct raw/snapshot keys.
**Transition (rev 2):** a legacy `latest/` and legacy snapshots read through the legacy path; a legacy object over 8 MiB refused; a new object without `format` never line-scanned; mixed legacy/new snapshots on one day choose by `retrieved_at` correctly.
**Limits (rev 2):** a 5 KiB line fails the run; a third concurrent `/place` scan gets "busy"; the cache never exceeds its byte cap; the busiest real cell answers 8 rows + the exact total.
**Expiry warning (rev 2):** a pending day whose newest input is 36 h old → archive health reason names it; at 35 h it does not.
**Injected failures:** at every row of §4's table (abort part N of M, fail the sidecar, fail the latest copy, fail latest-cells, sidecar mismatch, gzip part failure, marker failure) — assert last good publication byte-identical, no partial object visible under a published key, the next run's bounded retry completes and nothing completed is rewritten.
**Memory (local, labelled local):** the existing workerd bench (`phase1/bench-firms-memory/`) with total-heap caps 48 / 64 / 80 MB, 3 runs each, every output asserted; pass criterion = all scenarios at 64 MB for every size up to 64 MiB (the flatness claim). Negative controls must FAIL.
**Production (labelled production, after a separate deploy go):** Worker metrics memory P50/P99/P999 and Exceeded Memory for 48 h; CPU per firms tick; R2 Class A/B counts from the usage page; `/health/*` all green. The guard stays at 8 MiB until production confirms; raising it is its own decision.

## 9. Order of work (each a separate go) — after GPT's re-review of rev 2
1. Measure first: does FIRMS send `Content-Length`; today's R2 Class A/B monthly usage; the known-length behaviour of an `R2ObjectBody` stream and the `etagDoesNotMatch: "*"` form in local workerd; the busiest real cell and a `/place` scan's CPU on the 5 Nov file.
2. Build steps A–E on a branch with the tests in §8; bench.
3. Review (GPT) → Chad's go → deploy content-only + the `snapshots-aux/` lifecycle rule (Approve lines).
4. Watch production 48 h; then decide on raising the guard.
