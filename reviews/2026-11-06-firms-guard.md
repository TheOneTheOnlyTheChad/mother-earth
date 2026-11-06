# FIRMS resource guard + checkpoint coverage — candidate for review (6 Nov 2026)

Branch `firms-guard`, hub **0.5.2** candidate. **Not deployed.** Needs, each with Chad's separate go: (a) one additive D1 table, (b) the hub deploy. Page unchanged.

## 1. The problem (measured 6 Nov 02:47 UTC; STATUS)
- Every FIRMS run from **15:45 to 23:45 UTC on 5 Nov** (33 runs) logged `raw archived; processing skipped: resource guard` — the raw file grew past the **4 MB guard**: 3.8 MB at 15:30 → 5.3 MB (5,311,642 B, 63,614 rows) by 22:45.
- Recurring and earlier each day: first trip 3 Nov 21:00 (12 runs) · 4 Nov 18:30 (22) · 5 Nov 15:45 (33). None 30 Oct–2 Nov (max raw 3.4–3.7 MB).
- Consequences: (a) the public fires layer served the 15:30 snapshot all evening (cells file "down" with the D14 wording — honest, but stale); (b) the 5 Nov fires checkpoint holds that 15:30 snapshot, and nothing in the checkpoint or `archive_health` said so.
- **Correction to the 6 Nov report:** the "firms checkpoint tick, 00:31, 243 ms" was the ships cloud fallback sharing the */15 invocation. The **firms checkpoint object was written at 02:16:10 UTC** — on the first *successful* firms run of 6 Nov (02:15), because the checkpoint step only ran after a successful publish. usgs's checkpoint was written 00:32:53 as expected.

## 2. What "15:30" is — three separate times
| | 5 Nov firms value | Where it lives |
|---|---|---|
| **Retrieval time** of the checkpoint input (`cutoff`) | 15:30:44 UTC | `archive_checkpoints.cutoff` (unchanged meaning) |
| **Latest detection** inside that input | not recorded before 0.5.2 → `archive_checkpoint_coverage.last_observation_at` (new) | e.g. the 23:45 raw file's newest detection is **21:35 UTC** — hours behind its retrieval |
| **Source cutoff** (FIRMS NRT processing latency, ~2–3 h) | not supplied by FIRMS per file | stated in the envelope's `window_rule`; not a per-file value |

## 3. Why the old limit existed, and what binds now
- Origin (code comment, 30 Oct): Free plan, **CPU** — 1.3 MB ≈ 15 ms against the 10 ms soft limit. That reason ended with Workers Paid (3 Nov).
- On Paid the binding limit is **memory: 128 MB per isolate, shared by concurrent requests, same on Free and Paid** ([Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/), [memory metrics changelog](https://developers.cloudflare.com/changelog/post/2026-06-30-memory-usage-metrics/), read 6 Nov).
- **Measured on the actual oversized payload** (`raw/firms/2026-11-05T23-45Z.csv`, 5,311,642 B, sha256 `c3487dcc3e063db3…`, 63,614 rows, all 14 fields) with the hub's own `firmsParse` + `envelope` + `firesDaily` from commit `2e717c8`, in V8 (browser pane, warm): parse **80–173 ms**, stringify 11–14 ms, firesDaily 28–61 ms; 2× file 118–150 ms parse; 3× 174–204 ms. **CPU is not the constraint.**
- **Memory, Node 22 with forced GC**, synthetic files built from real 5 Nov rows (all 14 columns), full collect path (parse → envelope → two full JSON strings) then the checkpoint path (JSON.parse + gzip + firesDaily). *Held* memory after GC at each step (the meaningful figure; transient peaks before GC were 66–310 MB and are reclaimable):

| file | rows | held max | collect ms | checkpoint ms |
|---|---|---|---|---|
| 5.3 MB | 66,749 | **31 MB** | 186 | 246 |
| 8 MB | 100,758 | **33 MB** | 248 | 199 |
| 12 MB | 151,132 | **49 MB** | 357 | 284 |
| 16 MB | 201,515 | **62 MB** | 518 | 357 |
| 24 MB | 302,269 | **98 MB** | 857 | 653 |

- **Cross-check on the real platform:** Worker Metrics, last 24 h (incl. firms runs on ≤ 3.8 MB files): memory P50 2.31 MB · P90 13.14 · P99 16.86 · **P999 17.41 MB**; Exceeded Memory 0, Exceeded CPU 0. Node's held estimate for a 3.8 MB file (~4×) is the same order. **Not established:** real Worker memory above 3.8 MB — the deploy's Memory chart is the decisive check.
- **Proposal: 12 MiB** (2.3× the largest file seen). Held ≈ 49 MB ≈ 40 % of the isolate, leaving room for concurrent invocations and GC timing. Above it, the D14 guard still applies — now disclosed (§4). Peak fire season (Aug–Sep) file sizes are **unmeasured**; the limit may need revisiting then, or a streaming parse.

## 4. Disclosure — operational health and retained history
- **New table `archive_checkpoint_coverage`** (additive; `phase1/schema.sql`), one row per checkpoint, **separate from `archive_checkpoints` so the original checkpoint is never rewritten**: `cutoff`, `last_observation_at`, `input_age_at_day_end_s`, `failed_runs_after_cutoff`, `failure_first_at`, `failure_last_at`, `failure_reasons` (distinct, shortened), `input_status` (`current` | `stale`: stale if any run failed after the cutoff that day, or the cutoff is older than 2 × cadence + 5 min at day end), `assessed_at`, `assessed_with_checkpoint` (1 = written with the checkpoint; 0 = assessed later), `collector_version`. Derived from `collector_runs` (never pruned) and the checkpoint's own records.
- Written **before** the completion marker; also copied into the checkpoint object's R2 metadata.
- **Checkpoints that predate 0.5.2 (5 Nov)** get a coverage row on a later run, labelled `assessed_with_checkpoint = 0` with its `assessed_at`. The 5 Nov checkpoint row and object are not touched.
- **`/status` → `archive_health`:** `last_completed[].coverage` (the above); new `collection.<firms|usgs>`: `last_successful_run {scheduled_at, finished_at, age_s}`, `latest_run {status, note}`, `failing {since, runs}`; and a `note` that a completed checkpoint means archived, not that collection covered the day.
- **Checkpoint trigger:** a **failed** run of a checkpoint layer now also runs the (idempotent) checkpoint step, so a closed day is checkpointed — or recorded as a gap — without waiting for the layer's next success.

## 5. Truncated downloads
FIRMS rows have exactly the header's field count (checked on 3 real files, 6 Nov: 46,009 / 63,614 / 52 rows, 0 exceptions, no quotes, no CR, no trailing newline). 0.5.2 refuses a response with any row whose field count differs: `truncated or malformed response: line N has k fields, header has 14` → down, last good kept. **Stated limit:** a body cut exactly between rows is not detectable (FIRMS sends no row count) — test 2d documents it rather than hiding it.

## 6. Tests — `node --no-warnings phase1/firms-guard.test.mjs` (10/10)
| # | Covers (GPT's points) |
|---|---|
| 1 | the limit; the 5 Nov evening size (5,311,642 B) now processed |
| 2a | exactly at the limit → processed; +1 byte → guard; raw archived both times |
| 2b | network error, HTTP 500, HTML error page → down, nothing published |
| 2c | body cut mid-row → refused whole |
| 2d | cut between rows → undetected (stated limit) |
| 3 | after a good run, guard + network + 503 failures keep `latest/firms.json` byte-identical with its own `retrieved_at`; `/status` reports last success, its age and the 3-run failing streak |
| 4 | **5 Nov replay:** good to 15:30 (latest detection 13:00), guard 15:45–23:45, header-only file at 00:30 → checkpoint written at 00:30 by the *down* run; coverage stale, 33 failed runs, reason, first/last failure, both times kept apart; R2 metadata and `/status` show it |
| 4b | a full good day → current, 0 failed |
| 5 | next day resumes; D's checkpoint row, object and coverage byte-identical after more runs; failing streak cleared |
| 5b | a pre-0.5.2 checkpoint is assessed later, labelled `assessed_with_checkpoint = 0`; checkpoint row unchanged |

**Each break fails the suite** (`BREAK=<name>`): `old-limit` (2 fail) · `no-truncation` (1) · `no-coverage` (3) · `coverage-blind` (2) · `down-no-checkpoint` (4) · `reassess-history` (1). A first `rewrite-checkpoint` break passed — the due-day query already skips completed days, so the marker check it removed is defence in depth; replaced by `reassess-history`, which models silently rewriting retained coverage.
**Regressions:** history-hub 27 · plastic-hub 11 · drifters-hub 12 · ships-fallback 7 · ships-late 7 · ships-probe 11 · orbital-hub 13 · spacetrack-probe 11 · satellites-hub 12 · place-rows 7 · place-ui 30 · duration contract — all pass.

## 7. Decisions for Chad (none taken)
1. **D1:** create `archive_checkpoint_coverage` (one `CREATE TABLE IF NOT EXISTS`, additive; START-HERE §4d procedure). Must precede the deploy.
2. **Deploy hub 0.5.2** (content-only; history stays on). Then read the Memory chart and the invocation log on the first firms runs over 4 MB (today's file passes 4 MB by mid-afternoon UTC).
3. **5 Nov fires recovery — time-limited.** The guarded runs' raw files (`raw/firms/2026-11-05T15-45Z.csv` … `T23-45Z.csv`) are deleted 2 days after upload (earliest ~7 Nov 15:45 UTC). A recovery would be a **separate, explicitly labelled record** beside the original checkpoint (never a rewrite) and is **not built**. Let them expire, or ask for a recovery proposal.
4. Not in scope: page wording for stale checkpoints (the Sources page shows history, not checkpoint coverage); streaming parse for peak season.
