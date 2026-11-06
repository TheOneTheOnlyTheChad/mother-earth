# FIRMS memory v2 — branch build, tests, benchmarks (for GPT review)

## Rev 2 — fixes after GPT's production review (6 Nov, evening). READ THIS FIRST; the rev-1 sections below are kept for the record.
**Nothing in production has changed.** No schema, deploy, probe, variable, merge or activation.

| | |
|---|---|
| Commit | `0f3f5fd` (fixes; rev-2 tests G1a–G5c, rev-2 breaks) + `7408fc7` (rev-2 doc, bench results). Branch `firms-memory`. |
| Worker | `phase1/worker.js` 0.6.0, sha256 **`9c2a1a1e65feef20fe1890cf19fbe7558054463e4bba7d97184cc5e4a35871d5`**. The bench copy (export line stripped) is `3046da881c106039…` and matches. `schema.sql` is unchanged from rev 1 (`0c964327…a0d2`). |
| Diff since rev 1 | `git diff 5644926 0f3f5fd` — worker +159/−33, tests, breaks, bench script |

### The five findings and their fixes
| # | GPT finding | Fix (implementation only; the design's procedures are unchanged except the one rule flagged in G1) |
|---|---|---|
| G1 | After a rollback, the checkpoint chose the 23:00 v2 file over the 23:45 legacy file, because the cutover filter excluded it. | **The day's input is the latest publication of either kind:** a committed v2 output, or a legacy-key snapshot by its exact `retrieved_at`. **The cutover is no longer an eligibility filter.** It is still written, for audit. *This changes one rule in design §9.* A legacy object after the cutover is a complete legacy publication (a rollback, or an old isolate during the deploy), so excluding it gives the wrong day. **Until v2 has ever run** (flag off and no cutover row), the checkpoint and backfill run **the legacy selection**. Their only `firms_*` access is **one read of `firms_settings`** (is there a cutover row?), which decides between the two paths; they never read `firms_outputs`, `firms_inputs`, `firms_attempts` or `firms_identity` (G2e). If that one read fails, the checkpoint is deferred (G2d). So deploying 0.6.0 with v2 off selects exactly the files 0.5.3 would. *(Corrected after GPT's rev-2 review: rev 2 said "never read a `firms_*` table".)* |
| G2 | A failed committed-output read was swallowed and recorded as "no retained snapshot", leaving a permanent gap. | Unreadable state now raises: the committed-output read, the v2-state (cutover) read, the completion-marker read and the `fires_daily` batches. `hist()` logs the failure, and the day stays due with **no gap and no marker**. The next run completes it. The one tolerated case: the tables don't exist while v2 is off, which means no v2 output can exist. |
| G3 | A sidecar with the right run but the wrong attempt, token and counts was accepted, so a 1-record snapshot got a 999-record marker. | The sidecar is checked against the **committed output row**: run, attempt, token, retrieved_at, records, stored size, and the sums of `by_cell`, `cells` and `by_hour`. If any check fails, it is **rebuilt by streaming the committed snapshot**, with its SHA-256 and size checked against the commit and a `firms:recovery` row logged. Two kinds of check apply, at different points:
- **Object check** (size, run, token), against the commit, at both publication and checkpoint. A snapshot that fails it is **refused**.
- **Full SHA-256 of the snapshot bytes**, only during **checkpointing** (hashed as they stream into gzip; on a mismatch the object is deleted before any D1 write) and during a **sidecar rebuild**.

Normal publication with a valid sidecar does the object check and the sidecar validation, but **does not re-hash the snapshot bytes**. The copy to `latest/` is a stream copy of the committed per-attempt object, which is never rewritten. The marker carries the committed count. *(Wording narrowed after GPT's rev-2 review.)* |
| G4 | After a counts repair one interval later, the fresh `firms ok` log disagreed with the records upload time, giving a 503. | For a v2 (`lines/1`) publication, `/health/publication/firms` compares the run log with **the pair's completion** (`firms_outputs.cells_at`). The **age still counts from the records upload**, so a repair never makes old data look fresh (G4b: it fails at 09:50:40 as it would without a repair). It also reports a pair whose counts are not complete, and an ok log that belongs to another run (G4c). |
| G5 | A multipart part failure left an upload open while the object listing was empty. | **`fvWriter` aborts its own multipart upload on any failure** (write, part, complete). This covers every v2 write path, not only the probe. The probe tracks every upload it starts, aborts any still open, then deletes its objects. `cleaned` = no open upload **and** no object. |

### Evidence (rev 2)
- **`firms-v2.test.mjs`: 62 / 62.**
  - 44 rev-1 cases (L1 updated to the G1 rule).
  - 18 new: G1a, G1b, G2a–G2e, G3a–G3d, G4a–G4c, G5a–G5c, G6.
  - **G6** (run with `OLD_WORKER` = `main:phase1/worker.js`, the live 0.5.3): rollback *by redeploy* works. 0.5.3 checkpoints a v2-written day correctly (2 records, v2 snapshot, `fires_daily` = 2), collects and publishes again, and its health is 200. Without `OLD_WORKER`, G6 reports SKIP rather than passing.
- **GPT's own probe file**, `2026-11-06-firms-v2-production-review-probes.mjs`, run unchanged apart from its paths: **5 / 5 pass**. G1 picks 23:45 with 2 records; G2 defers with no gap; G3 marker 1; G4 200; G5 0 open uploads.
- **`firms-v2-breaks.mjs`: 38 / 38 caught**: the 26 from rev 1 plus 12 new ones, each caught by the case meant for it.
  - Checkpoint prefers committed output: G1a, G2d, L1.
  - Swallows a D1 read: G2a, G2c.
  - Sidecar never validated: G3a, G3b, G3d.
  - Hash not checked: G3c.
  - Publication uses the sidecar unchecked: G3d.
  - Snapshot not matched to the commit: G3c, G3d.
  - Health compares with the records upload: G4a, G4b.
  - Health takes age from the repair: G4a, G4b.
  - Health ignores the run of the ok log: G4c.
  - Writer doesn't self-abort: G5c.
  - Probe doesn't abort tracked uploads: G5b.
  - v2 path before v2 ever ran: G2d, G2e.
  - Cutover read failure treated as "never ran": G2d.
- **Existing suites:**

  | Suite | Result |
  |---|---|
  | firms-guard | 19/19 |
  | health-hub | 29/29 |
  | health-breaks | 19/19 |
  | history-hub | 27/27 |
  | place-rows | 7 |
  | drifters | 12 |
  | plastic | 11 |
  | satellites | 12 |
  | orbital-hub | 13/13 |
  | orbital-ui | 38 |
  | search | 111 |
  | search.realdata | 50 |
  | ships | 7 / 7 / 11 |
  | spacetrack | 11/11 |
  | duration-contract | pass |

- **Benchmarks repeated** (`results-v2-fix.jsonl`, final worker): **141 of 144 pass.** The changes touch the checkpoint (hashing on the read path), publication (validation and possible rebuild) and the writer. The new scenario `checkpoint-rebuild` replaces the sidecar with a wrong one and requires a correct, rebuilt checkpoint.
  - Every real, 8 MiB and dense scenario, including `checkpoint-rebuild`, passes at **all four caps (48/64/80/128)**. Checkpoint, rebuild and overlap pass **3 of 3 at 80 and 128**.
  - 64 MiB passes everything at 48, 80 and 128, including the rebuild. One overlap run failed at 64. That size is only reachable in the bench copy with the guard raised; production keeps 8 MiB. Rev 1 had the mirror image: 64 MiB failed at 48 and passed at 64. So 64 MiB overlap sits at the edge of 48–64 MB.
  - legacy-transition: fails at 48 and 64, passes 3 of 3 at 80 and 3 of 3 at 128. This is unchanged, as required.
  - Sampled peaks (lower bounds): ≤ 37 MB at ≤ 8 MiB (dense overlap) and ≤ 51 MB at 64 MiB. Rebuild peaks equal the normal checkpoint's.
| file | scenario | cap 48 MB | cap 64 MB | cap 80 MB | cap 128 MB | max sampled heap MB | max wall ms |
|---|---|---|---|---|---|---|---|
| real.csv | collect | p | p | p | p | 9.7 | 2876 |
| real.csv | checkpoint | p | p | ppp | ppp | 11.0 | 1309 |
| real.csv | checkpoint-rebuild | p | p | ppp | ppp | 11.1 | 1934 |
| real.csv | overlap | p | p | ppp | ppp | 12.5 | 4296 |
| real.csv | stress-2-collects | p | p | p | p | 12.6 | 3863 |
| real.csv | injected-reset-cl | p | p | p | p | 10.8 | 6148 |
| real.csv | injected-truncated-row | p | p | p | p | 10.8 | 1944 |
| real.csv | legacy-transition | F | F | ppp | ppp | 110.5 | 4575 |
| 8mib.csv | collect | p | p | p | p | 12.7 | 4183 |
| 8mib.csv | checkpoint | p | p | ppp | ppp | 13.7 | 1768 |
| 8mib.csv | checkpoint-rebuild | p | p | ppp | ppp | 13.5 | 2321 |
| 8mib.csv | overlap | p | p | ppp | ppp | 15.1 | 5594 |
| 8mib.csv | stress-2-collects | p | p | p | p | 16.9 | 7069 |
| 8mib.csv | injected-truncated-row | p | p | p | p | 13.5 | 3015 |
| dense-8mib.csv | collect | p | p | p | p | 22.2 | 5491 |
| dense-8mib.csv | checkpoint | p | p | ppp | ppp | 22.7 | 2283 |
| dense-8mib.csv | checkpoint-rebuild | p | p | ppp | ppp | 22.3 | 2683 |
| dense-8mib.csv | overlap | p | p | ppp | ppp | 37.2 | 8719 |
| dense-8mib.csv | stress-2-collects | p | p | p | p | 35.2 | 9617 |
| dense-8mib.csv | injected-truncated-row | p | p | p | p | 22.3 | 3367 |
| 64mib.csv | collect | p | p | p | p | 50.8 | 26637 |
| 64mib.csv | checkpoint | p | p | p | p | 48.0 | 8861 |
| 64mib.csv | checkpoint-rebuild | p | p | p | p | 48.2 | 12241 |
| 64mib.csv | overlap | p | F | p | p | 47.7 | 37505 |
| 64mib.csv | stress-2-collects | p | p | p | p | 47.8 | 46430 |
| 64mib.csv | injected-truncated-row | p | p | p | p | 49.8 | 18305 |

141 of 144 runs pass.

Failures:
- real.csv legacy-transition --max-heap-size=48: alive=False err=TypeError: fetch failed fail=[]
- 64mib.csv overlap --max-heap-size=64: alive=True err=TypeError: fetch failed fail=[]
- real.csv legacy-transition --max-heap-size=64: alive=False err=TypeError: fetch failed fail=[]

- **Negative controls** (`results-v2-fix-negative.jsonl`, cap 128). Each broken copy must fail; **7 of 7 that break final outputs FAIL**:

  | Broken copy | Why it failed |
  |---|---|
  | commit fenced | 0 collects |
  | records truncated | not the complete publication |
  | published cells wrong *(new)* | cell counts differ from the CSV |
  | checkpoint aggregates wrong *(new)* | detections 64,255 ≠ 63,614 |
  | rebuild wrong *(new)* | detections 127,228 |
  | `/place` scan throws | final `/place` withheld |
  | legacy checkpoint skipped | no marker |

  **Two rev-1 negative controls now PASS by design:** a wrong `by_hour` and a wrong sidecar count were both introduced *in the sidecar*. The G3 validation now rejects such a sidecar and rebuilds it from the committed snapshot, so the published counts and `fires_daily` come out correct. That is the fix working. The two new controls break the published or archived outputs directly, so the bench's checks are still shown to bite.

**Rev-2 review outcome (GPT):** the code is signed off for the staged rollout below, and the revised cutover rule is accepted. Each stage goes back to Chad with its exact `Approve:` line, target commit/hash and the previous stage's evidence. Three wording corrections were applied here (`firms_settings` read, hashing scope, monitor baseline) and design §9 was updated.

### Revised rollout (each step needs Chad's `Approve:` line; nothing before GPT re-reviews; nothing in the other thread's window 23:30 UTC 6 Nov → 01:15 UTC 7 Nov, or until its "window clear" note)
0. **Read-only:** dashboard → R2 `mother-earth` → lifecycle rules. Confirm `raw/`, `snapshots/` and `cells/` expire after 2 days.
1. **D1 additive schema** (5 tables + 3 indexes; the live 0.5.3 never reads them):
   `Approve: D1 additive schema — create firms_settings, firms_identity, firms_inputs, firms_attempts, firms_outputs + 3 indexes (schema.sql @ 7408fc7, sha256 0c964327…a0d2)`
   Record the exact UTC time it was created (the other thread asked for this).
2. **Deploy 0.6.0 with v2 OFF** (content only). Until v2 first runs, the checkpoint and backfill are the legacy code (G2e).
   - Differences from 0.5.3 in this mode, none reachable at today's sizes or with no v2 files: `/place` withholds a legacy `latest/` over 12 MiB; the listing never parses an unmetadata'd object over 12 MiB; the new admin probe route; version 0.6.0 in `/status`.
   - Watch 2 FIRMS runs: **no unexpected deterioration from the recorded baseline** (each monitor's state is recorded before the deploy) and `/status` shows 0.6.0. The known historical alert on "ME coverage firms" (5 Nov) is part of the baseline and is not a new failure.

   `Approve: deploy hub commit 7408fc7 (firms-memory, 0.6.0, phase1/worker.js sha256 9c2a1a1e…71d5, content only, FIRMS_PIPELINE unset)`
3. **Production R2 probe**, once: `all_as_designed` must be true and `uploads_open_after: 0`.
   `Approve: run /admin/probe/r2-conditional once on production (probe/ keys only, uploads aborted and objects deleted in the same request)`
4. `Approve: set Worker variable FIRMS_CREATE_ONLY=verified` (only if step 3 is all true)
5. `Approve: set Worker variable FIRMS_PIPELINE=v2`. Watch 2 runs:
   - `lines/1` with `run_id` on both files;
   - `publish_state = published` with `cells_at`;
   - `/place` ok;
   - `/health/*`: no unexpected deterioration from the recorded baseline (the known coverage alert excepted), with `v2_publication` facts present.
6. Next day after 00:30 UTC (no action): the checkpoint `source_key` is the v2 snapshot, `fires_daily` is present, and `/health/archive/firms` is up.

### Revised rollback (tested)
- **R1 — unset `FIRMS_PIPELINE`** (one variable change, needs Approve). The legacy collector runs from the next run. Because v2 has run, the checkpoint keeps the v2 selection, which takes the **latest publication of either kind** (G1a, G1b), so a mixed or rollback day is archived correctly. Health accepts the legacy file: no `run_id`, so the legacy rules apply.
- **R2 — redeploy 0.5.3** (`61c8e052…6d0692`, needs Approve). Tested in G6: 0.5.3 checkpoints a v2-written day correctly (it reads `lines/1` as JSON; unbounded parse, but fine at today's sizes), collects, publishes, and health is 200. The `firms_*` tables are simply unused.
- Neither rollback needs any data change.

### Remaining limitations (unchanged from rev 1 §6, plus)
- G3: the rebuild streams the whole committed snapshot, so its CPU is about one more read of the file. It happens only when a sidecar is rejected; the bench shows memory equal to a normal checkpoint.
- G4: health now reads one `firms_outputs` row per `/health/publication/firms` call, which is 1 D1 read every 5 minutes from UptimeRobot (negligible).
- The design doc §9 eligibility text should be updated to match G1 (cutover = audit only) once GPT agrees. Not done yet, so as not to edit the signed-off design without review.

---

## Rev 1 (as first submitted)

6 Nov 2026 · branch `firms-memory` · built to design rev 6 (`docs/FIRMS-MEMORY-DESIGN.md` @ `48a0f63`, signed off by GPT).
**Nothing in production has changed.** There has been no deploy, no D1 schema change, no variable change, no R2 write, no merge, and the 8 MiB guard is the same. Chad's go covered read-only measurements, local platform checks and the branch build only.

## 0. What to review
| | |
|---|---|
| Implementation commits | `2629aac` (pipeline) + `77eeb22` (R2 probe, download limit, tests, bench results) on `firms-memory` |
| Worker | `phase1/worker.js` collector **0.6.0**, sha256 `71de6094db1abe57f3afbf8bf220d055bbc198e72808239377fc07c67e7eae07` (bench copy without the export line `d364c7a6ccd4b9b1…`) · `schema.sql` sha256 `0c964327ea5f…a0d2` |
| Diff | `git diff main...firms-memory -- phase1/` (worker +485 lines, schema +21, three existing test stubs +head()/body, two version literals) |
| New tests | `phase1/firms-v2.test.mjs` (44 cases through the real worker) · `phase1/firms-v2-breaks.mjs` (26 deliberate breaks) |
| New bench | `phase1/bench-firms-memory/bench-v2.mjs`, `run-v2.sh`, `run-v2-repeat.sh`, `run-v2-extra.sh`, `summarise-v2.py`; results `results-v2-*.jsonl` |

## 1. How it is switched (all off by default)
- `FIRMS_PIPELINE` unset → the **legacy collector runs unchanged**. Every existing suite passes on this branch; test `S1` checks it.
- `FIRMS_PIPELINE = "v2"` → the v2 job (sweeps → repair or retry → own fetch → register → claim → process → commit → publish → checkpoint). It needs the five `firms_*` tables.
- `FIRMS_CREATE_ONLY = "verified"` → only then may v2 **create** `latest/` or `latest-cells/` when the object is absent (design §5: "absent → create-only if verified, else refused"). In production both objects already exist, so this only matters on a fresh bucket. It should be set only after the production probe (§7 step 3) passes.
- Rollback = unset `FIRMS_PIPELINE`. A `lines/1` file is valid JSON, so the legacy readers (`/snapshot`, legacy `/place`, legacy checkpoint) still read it.

## 2. What was built (design section → code)
| Design | Code (`worker.js`, FIRMS v2 section) |
|---|---|
| §2 SQL | `FVSQL`. Test `S0` checks every statement is identical to `docs/design-checks/firms-state.sql.mjs`, whitespace-normalised. `INPUT` carries real bindings instead of the design file's placeholders. The schema is in `schema.sql` (5 tables + 3 indexes, `IF NOT EXISTS`). |
| §2.2–2.3 claim / commit | `fvWork`: claim + count in one batch, proceeding only on `changes === 1`. `fvProcess` commits through the fence, then marks the attempt finished. |
| §2.5 identity | `fvRegister` writes cutover → `IDENTITY` → input in one batch. It then confirms that the identity row is its own, so a collision abandons the run and is never re-stamped. `fvDownNoInput` re-stamps +1 ms, at most 3 times, then refuses. |
| §2.6 failure | `fvDownForInput` runs `FAIL_FENCE`, then writes a down counts file through the CAS, keyed by the input's identity, with `failed_at` in the body. A stale attempt runs `FAIL_STALE` and publishes nothing. |
| §3 keys / `lines/1` | `snapshots/firms/<run>-a<n>-<token>.json`, `snapshots/firms-aux/…`, `raw/firms/<run>.csv`, `cells/firms/<run>.json`. Every line is ≤ 4 KiB, in the order header → `record_fields` → records → cells → `by_hour` (nested). |
| §4 step A | `fvFetchToRaw` streams the body into `fvWriter`, which holds at most one 5 MiB part: it does a single `put` if the data ends inside the first part, otherwise a multipart upload, aborted on any error. It computes SHA-256 incrementally (`crypto.DigestStream`), checks the size with `head`, and checks `Content-Length` when the header is present. |
| §4 step B | Streaming parse with `TextDecoderStream` and a line carry, using the **same** `firmsRowProblem` and field-count checks. Rows go straight into the writer, and the small maps go into the sidecar. |
| §5 publication | `fvOrder` and `fvCas` (3 rounds) implement the (run, status) rule. `fvPublish` streams a copy of the committed snapshot to `latest/` and then writes `latest-cells/` (cells + `by_hour`, which `aggregateFirms` needs). `PUBLISHED` records each step. |
| §6 discovery | Sweeps (expired, superseded), then `FIND_UNPUBLISHED` (`>=` current), then `FIND_UNPROCESSED` (`>` current), and only then the run's own fetch. A publication error leaves the output pending for repair; it never becomes a down file. |
| §7 checkpoint | `fvCheckpointCandidate` picks the latest of {committed output for the day, legacy snapshot with key regex AND `retrieved_at` < cutover}. `fvCheckpointNew` streams the snapshot through gzip into the bounded writer and takes `fires_daily` from the sidecar. Coverage takes `last_observation_at` from the sidecar, never from parsing the records. |
| §8 `/place` | `fvPlaceSection` / `fvPlaceFirms`: a streaming scan keeping the 8 newest records, with ties in the legacy sort order, plus a count. It allows 2 concurrent scans and waits 2 s before answering "busy". The answer cache is LRU, capped at 256 KB. Records and counts are paired by `run_id` AND `retrieved_at`, re-read once, else withheld. |
| §9 legacy bounds | L_json = 12 MiB. A legacy snapshot over it is recorded as a gap and never read. Legacy checkpoint backfill uses a counting gunzip that stops at L_json. A legacy `latest/` over L_json is withheld in `/place`. The listing never parses an unmetadata'd object over L_json. |

**Additions beyond rev 6 (please review these specifically):**
1. **Download limit 180 s** (`FV.fetchMs`). In local workerd, a connection reset on a response that carries `Content-Length` left the body read hanging indefinitely, because the platform does not time out a stalled body. v2 now aborts at 180 s and records the run as down: "fetch failed: … download timed out", with nothing registered and no raw object left behind. Test `F6`, bench `injected-reset-cl`.
2. **`/admin/probe/r2-conditional`** (admin key). It runs the platform checks on *this* bucket: create-only when absent and when present, CAS with a stale and a current etag, stream copy of an `R2ObjectBody`, multipart of 5 MiB + a small part with metadata, and abort. It uses fresh `probe/firms-v2/<random>/` keys and deletes all of them afterwards. This is how create-only gets verified in production (§7 step 3). Test `F7` also checks that the probe **detects** a bucket that ignores `onlyIf`.
3. **Logging of recovery work.** A repair or retry that publishes logs `firms ok` with note `repair run=…` / `retry run=…`, which the health checks read as a publication. One that does not publish logs under layer `firms:recovery`, so health is not misled by a recovery step's internal outcome.
4. **`guarded()` in v2.** An uncaught error writes a no-input down file through the CAS with its own identity, never through the unconditional `writeDown` (test `F4`).
5. **Registration uses the design's `IDENTITY` (`INSERT OR IGNORE`) plus an ownership check.** In D1 a collision also fails the input row's foreign key or `UNIQUE` constraint, so the batch rolls back (test `C4`).
6. **Resource guard (8 MiB, unchanged).** It is checked after the raw is archived and **before** registration, so a guarded file is archived but is not an input. The note text is identical to legacy, so `/health/publication` still fails on it (test `F1`).

## 3. Tests through the real worker — `firms-v2.test.mjs`: **44 / 44**
D1 is real SQLite with foreign keys ON and a transaction per batch, loaded with `schema.sql`. R2 is a stub with R2's conditional-put, known-length-stream, multipart (non-last parts equal and ≥ 5 MiB), abort, range, head and list semantics. Faults are injected on the n-th matching D1 statement or the next matching R2 put or part. The clock is controlled.
- **Real data (the 5 Nov files, 5,311,642 B and 3,833,218 B):**
  - `1a` `latest/` equals the legacy snapshot for every record, cell, `by_hour` entry and header field, apart from the raw key, `run_id` and `format`.
  - `1b` The counts file equals legacy.
  - `1c` Raw is byte-identical in 2 parts and the SHA-256 is recorded. Every line is ≤ 4 KiB. `latest/` is a byte copy of the committed snapshot, and the sidecar equals `firesDaily(legacy)`.
  - `1d` `/place` matches legacy for the 3 busiest cells, 40 others and an empty cell: 8 newest records, ties in legacy order, same totals. The test also asserts the legacy answer is real, so the comparison is not vacuous.
  - `1e` The next-day checkpoint matches legacy: the gz content is the snapshot, and `fires_daily`, coverage and marker are equal. The boundary note keeps its legacy text.
  - `1f` With two files on one day, the later one wins everywhere.
- **Reference model, ported:** P1–P3, P8–P12, P14–P20. They run against the worker's own functions and, for P10, P12, P16, P17, P19 and C7, its scheduled job.
- **Run state:**
  - C1: the claim is exclusive under `Promise.all`.
  - C2: at most 3 attempts.
  - C3: a lease blocks other claims until it expires, and a stale commit is fenced.
  - C4: a collision abandons the run; nothing is registered and the cutover is rolled back.
  - C5: +1 ms re-stamp, at most 3, with `failed_at` in the body.
  - C6: the cutover is written once.
  - C7: expired and superseded sweeps.
- **Source failures:**
  - F1 guard.
  - F2 HTTP 500, network error, `Invalid` key: same note prefixes as legacy.
  - F3 `Content-Length` mismatch, and a line over 4 KiB.
  - F4 uncaught error.
  - F5 a multipart part fails, so the upload is aborted and nothing is left.
  - F6 stalled download.
  - F7 R2 probe.
- **Legacy transition and bounds:**
  - L1 cutover eligibility.
  - L2 a legacy-only day.
  - L3 1 byte over L_json → gap, object never read; exactly L_json → read.
  - L4 bounded gunzip at ±1 byte.
  - L5 `/place` with `run_id` on one side only → withheld; legacy `latest/` over L_json → withheld and not read.
  - B1 scan cap → "busy".
  - B2 the cache stays ≤ 256 KB across 1,200 cells holding about 0.6 MB of answers.
- **Existing suites on this branch:**

  | Suite | Result |
  |---|---|
  | firms-guard | 19/19 |
  | health-hub | 29/29 |
  | health-breaks | 19/19 |
  | history-hub | 27/27 |
  | place-rows | 7 |
  | drifters | 12 |
  | plastic | 11 |
  | satellites | 12 |
  | orbital-hub | 13/13 |
  | orbital-ui | 38 |
  | search | 111 |
  | search.realdata | 50 |
  | ships-* | 7 / 7 / 11 |
  | spacetrack | 11/11 |
  | duration-contract | pass |

  `solar.test.mjs` errors on main too; it is pre-existing and unrelated.

  Changes to existing tests: their R2 stubs gained `head()` and `body`, because the hub's bounded legacy reads use them and production R2 has both. Two version literals went from 0.5.3 to 0.6.0. No assertion was weakened.

**Breaks must bite — `firms-v2-breaks.mjs`:** 26 deliberate breaks, each of which must make a *behavioural* test fail (the S0 SQL-text check does not count).
- First run: 25 of 26 caught.
- The one miss ("download never times out") came from the test itself. An `unref()`'d timer let Node exit with code 13 before the case could fail. That is fixed and now confirmed to bite (F6).
- One break ("/place cache unbounded") was caught only by an unrelated artefact of that run. B2 was strengthened to 1,200 cells and now bites on its own.
- **Final rerun on the final code: 26 of 26 caught**, each by the case meant for it (list in §9).

## 4. Benchmarks (local workerd, Miniflare 4.20260730.0, outputs asserted)
**Method.**
- The real `worker.js` (minus the test-only export line) runs in workerd with the total V8 heap capped by `--max-heap-size`, one scenario per process.
- A scenario passes only if the runtime survived, no exception escaped, **and** the outputs are complete and correct against counts the bench computes from the CSV itself:
  - every record published, in `lines/1`;
  - counts and records from the same newest committed run;
  - every cell count and every `by_hour` entry equal to the CSV;
  - lines ≤ 4 KiB;
  - for the checkpoint: marker, object (decompressed record count), `fires_daily` sum and coverage;
  - `/place` exact at the end;
  - no history failure.
- Verification happens in a **second, uncapped** runtime opened on the same persisted R2 and D1, so that reading 64 MiB through Miniflare's proxy does not count against the hub's heap.
- Heap peaks are sampled every 10 ms and are **lower bounds**; the verdict is the evidence.
- Files above 8 MiB run in a bench-only copy with `FIRMS_MAX_PARSE_BYTES = 1 GiB` (labelled `guard_raised_in_bench_copy`). Production keeps 8 MiB.

**Inputs.**
| File | Size | Rows |
|---|---|---|
| real | 5,311,642 B | 63,614 (sha256 `c3487dcc3e063db3…`) |
| 8mib | 8,388,544 B | 100,484 (real rows repeated) |
| dense-8mib | 8,388,569 B | 98,726 — every one of the 4,050 cells in every one of 24 hours, the maps' worst case |
| 16mib | — | 200,970 |
| 32mib | — | 401,911 |
| 64mib | — | 803,795 |

**Scenarios.**
| Scenario | What it does |
|---|---|
| collect | one collect |
| checkpoint | closed-day checkpoint from a committed output |
| overlap | collect + checkpoint + usgs + 3 `/place` + `/snapshot` in one isolate |
| stress-2-collects | two overlapping collects + `/place` ×2 + `/snapshot`; both must complete, or one may end with an identity collision |
| legacy-transition | a 12 MiB legacy `latest/` (`/place` legacy path), a 12 MiB legacy snapshot checkpoint and a 12 MiB-decompressed legacy checkpoint backfill, overlapping a new collect and `/place` ×2 |
| injected-reset | a connection reset half-way |
| injected-reset-cl | the same reset with `Content-Length` (bench copy with a 5 s download limit) |
| injected-truncated-row | a malformed last row |

**Run 1 — every file × scenario × cap 48/64/80/128 MB (`results-v2-run1.jsonl`; worker identical to the final apart from the probe route and comments): 148 of 152 pass.**
- Every real, 8 MiB, dense, 16 MiB and 32 MiB scenario passes at **all four caps, including 48 MB**.
- 64 MiB passes every scenario at 64, 80 and 128; overlap and stress fail at 48.
- legacy-transition (12 MiB legacy objects being parsed) fails at 48 and 64 and **passes at 80 and 128**, which is what the design required.
- Sampled peaks:
  - v2 paths: ≤ 52 MB at 64 MiB and ≤ 36 MB on the dense 8 MiB file.
  - Legacy transition: 110 MB. That is the legacy parse of 12 MiB, and it goes away once the 2-day legacy objects expire.

(Full table: `python3 summarise-v2.py results-v2-run1.jsonl`.)

**Runs 2–3 on the final worker** (`results-v2-runs23.jsonl`, bench copy `d364c7a6…`): real, 8 MiB and dense × all 8 scenarios at caps 80 and 128, plus 64 MiB overlap at 128, two runs each. **82 of 82 pass.** Run 1 therefore has 3 runs in total for every production-relevant cell at 80 and 128.

**Negative controls (`results-v2-negative.jsonl`, cap 128): all 6 broken copies FAIL, each for its own reason.**
| Broken copy | Scenario | Why it failed |
|---|---|---|
| commit always fenced | collect | 0 of 1 collects |
| `by_hour` wrong | collect | "by_hour differs from the CSV" |
| records truncated at 1,000 | collect | "not the complete new publication" |
| sidecar count wrong | checkpoint | aggregates 641 ≠ 63,614 |
| `/place` scan throws | overlap | final `/place` withheld |
| legacy checkpoint skipped | legacy-transition | no marker |

**Legacy pipeline at low caps, for contrast** (`results-legacy-lowcap.jsonl`, old `bench.mjs`, main-branch worker = live 0.5.3):
- The real file passes at 48 and 64, apart from one stress-2-collects runtime death at 48.
- **8 MiB collect + checkpoint overlap died at 48 and 64 in every run** (3 recorded failures; the other runs died without writing a result line). v2 passes every 8 MiB and dense scenario at 48 and 64.

**Local R2 probe:** `/admin/probe/r2-conditional` in workerd returns `all_as_designed: true` and leaves 0 objects under `probe/`.

## 5. Measured costs (named before anything is incurred)
- **R2 operations per FIRMS run, real file** (counted through the worker in the test harness):

  | | Class A | Class B |
  |---|---|---|
  | v2 collect | 9 (`put` 5, multipart create/part/part/complete 4) | 10 (`head` 7, `get` 3) |
  | legacy collect | 5 | 0 |
  | v2 checkpoint run | 4 | 7 |
  | legacy checkpoint run | 5 | 1 |
  | v2 `/place` uncached | 0 | 7 |
  | v2 `/place` cached | 0 | 6 |
  | legacy `/place` | 0 | 6 |

  Raw above 5 MiB adds 2 parts. So would a snapshot above 5 MiB, which happens for raw above about 6.4 MiB.
- **Monthly at 96 runs per day: +11,520 Class A and +28,800 Class B.**
  - Current measured use is about 75k A per month of the 1M free, and B is far under the 10M free (R2 pricing checked today: A $4.50/M, B $0.36/M beyond the free tier).
  - **Expected cost: $0.** If the free tier were already exhausted, this would add about $0.06 per month.
- **Storage.**
  - The snapshot grows 4,075,445 → 4,140,975 B (+1.6%, newlines).
  - The new sidecar is 149,837 B per run.
  - Over the 2-day retention that is roughly 41 MB more in steady state. Current use is 763 MB of 10 GB free, so **$0**.
- **D1.** About 11 row writes per run, roughly 32k per month, plus small indexed reads. Well within the Paid plan's included rows (allowance figures not re-checked today). **$0.**
- **CPU** (local, not production).
  - Node, real file: v2 collect 734 ms vs legacy 230 ms. Node uses a pure-JS SHA-256; Workers use native `DigestStream`.
  - workerd wall time: real collect 1.2–2.6 s; 64 MiB collect about 25 s.
  - `/place` uncached scan of the 4.1 MB snapshot: median 55 ms, max 90 ms (Node).
  - **Production CPU per run is unmeasured.** At about 1 s × 2,880 runs, that is roughly 3M CPU-ms per month, inside Workers Paid's included 30M (not re-checked today).
- **The probe (§7 step 3), once:** about 15 Class A and 10 Class B, about 10 MiB written and deleted within the same request. **$0.**

## 6. Remaining limitations (measured vs unproven)
- **Measured locally only.**
  - All memory and stream results come from workerd/Miniflare with a local R2/D1 simulator.
  - Production R2 conditional writes, multipart rules and stream copy are **unproven** until the probe runs there.
  - Peak heap numbers are lower bounds.
- **FIRMS `Content-Length` is unmeasured** (not reachable from here).
  - Without it, a download cut exactly at a row boundary is indistinguishable from a complete file. This is unchanged from legacy.
  - In workerd, a reset with no length ended the body cleanly, and the row checks caught the cut.
- **Stalled-download behaviour in production is unknown.** The 180 s limit is new; please confirm it is acceptable.
- **R2 lifecycle rules not re-read.** The design assumes `raw/`, `snapshots/` (which covers `snapshots/firms-aux/`) and `cells/` expire after 2 days. `r2_bucket_get` does not show rules, so this is a read-only dashboard check before the switch (§7 step 0).
- **Two overlapping collects finishing in the same millisecond:** the second one abandons on an identity collision, as designed. It is logged down "identity collision" and the next run fetches again.
- **Files above 8 MiB are still refused** by the unchanged guard. The bench shows v2 completing 16/32/64 MiB within 64 MB of heap, but raising the guard is Chad's separate decision. CPU at 64 MiB (about 25 s wall locally) would also need measuring in production first.
- **`/place` CPU per uncached view** is about 55 ms locally and visitor numbers are unmeasured. The scan cap and cache bound bursts, not monthly totals.
- **Transition window.** Until the last legacy snapshot expires (2 days), the legacy paths still parse up to 12 MiB. That case needs 80 MB of heap and passes at 80 and 128.

## 7. Exact proposed production steps (each needs Chad's `Approve:` line; GPT reviews first)
0. **Read-only:** in the Cloudflare dashboard, open R2 → `mother-earth` → Settings → Object lifecycle rules and confirm the rules for `raw/`, `snapshots/` and `cells/`. No approval needed; reading only.
1. **D1 schema (additive):** run the 21 new lines of `phase1/schema.sql` (5 `CREATE TABLE IF NOT EXISTS` + 3 `CREATE INDEX IF NOT EXISTS`) on D1 `mother-earth`. They touch no existing table.
   `Approve: D1 additive schema — create firms_settings, firms_identity, firms_inputs, firms_attempts, firms_outputs + 3 indexes (schema.sql @ 77eeb22, sha256 0c964327…a0d2)`
2. **Deploy 0.6.0 with v2 OFF** (content only, as for 0.5.3): `phase1/worker.js` sha256 `71de6094…7eae07`. Behaviour stays legacy. Check `/status` shows 0.6.0 and the 8 health monitors stay up for 2 FIRMS runs. Rollback: 0.5.3 sha256 `61c8e052…6d0692`.
   `Approve: deploy hub commit 77eeb22 (firms-memory, 0.6.0, phase1/worker.js sha256 71de6094…7eae07, content only, FIRMS_PIPELINE unset)`
3. **Production R2 probe** (writes and deletes only `probe/firms-v2/<random>/` keys): `GET /admin/probe/r2-conditional?key=…`. All checks must return true and `cleaned` must be true.
   `Approve: run /admin/probe/r2-conditional once on production (probe/ keys only, deleted in the same request)`
4. **Variable `FIRMS_CREATE_ONLY = verified`**, only if step 3 is all true.
   `Approve: set Worker variable FIRMS_CREATE_ONLY=verified`
5. **Variable `FIRMS_PIPELINE = v2`.** Watch the next 2 runs:
   - `latest/firms.json` has `format: lines/1` and a `run_id`;
   - `latest-cells` has the same `run_id`;
   - `firms_outputs.publish_state = published`;
   - `/place` firms section `ok`;
   - all `/health/*` checks up.

   `Approve: set Worker variable FIRMS_PIPELINE=v2`
   Rollback: delete the variable (legacy resumes at the next run; nothing else to undo).
6. **Next day after 00:30 UTC (no action):** confirm `archive_checkpoints` for the switch day has `source_key` = a v2 snapshot, that `fires_daily` is present, and that `/health/archive/firms` is up.

**Not proposed:** raising the 8 MiB guard, any retention change, any schedule change, or merging to main before steps 1–5 are reviewed.

## 8. Questions for GPT
1. Are the six additions in §2 acceptable, especially the 180 s download limit and the `firms:recovery` logging layer?
2. Is the probe (§2 item 2, test F7) sufficient production evidence for create-only and CAS, or do you want more checks in it?
3. Bench acceptance: does run 1 plus runs 2–3 satisfy "real-file, larger-file, dense-grid, overlap, legacy-transition and injected-failure benchmarks with asserted outputs"?

## 9. Final evidence
- `node --no-warnings phase1/firms-v2.test.mjs` → **44 passed, 0 failed, 0 skipped** (real files staged from Chad's Mac, read only).
- `node phase1/firms-v2-breaks.mjs` → **26 of 26 breaks caught**:
  - claim ignores a live owner: C1, C3
  - commit not fenced: C3
  - failure fence ignored: P1
  - same run = ours: P12, P14, P15
  - other runs always older: P2, P8
  - `>` instead of `>=`: P16–P18
  - unconditional put: P8, P15
  - create-only ungated: P10
  - legacy uncertain → older: P11
  - guard removed: F1
  - line limit removed: F3
  - Content-Length unchecked: F3
  - writer drops parts: 1a–1f, F1, F7
  - `/place` tie order: 1d
  - cache unbounded: B2
  - scan cap removed: B1
  - legacy size unchecked: L3
  - gunzip unbounded: L4
  - uncaught → writeDown: F4
  - sidecar FRP count: 1c, 1e
  - cutover ignored: L1
  - always prefer legacy: L1
  - publication error not pending: P16–P20
  - empty-file note changed: 1e
  - no CAS on `latest/`: 19 cases
  - no download limit: F6
- Existing suites:

  | Suite | Result |
  |---|---|
  | firms-guard | 19/19 |
  | health-hub | 29/29 |
  | health-breaks | 19/19 |
  | history-hub | 27/27 |
  | place-rows | 7 |
  | drifters | 12 |
  | plastic | 11 |
  | satellites | 12 |
  | orbital-hub | 13/13 |
  | search | 111 |

- Bench results: run 1 148/152 (all 4 failures are in the expected places: 64 MiB at 48 MB, and the legacy transition below 80 MB); runs 2–3 82/82; negative controls 6/6 FAIL as required.
- Bench files: `phase1/bench-firms-memory/{bench-v2.mjs, run-v2.sh, run-v2-repeat.sh, run-v2-extra.sh, summarise-v2.py, results-*.jsonl}`. The data is rebuilt from the real file as described in the bench README method; it is not committed.
