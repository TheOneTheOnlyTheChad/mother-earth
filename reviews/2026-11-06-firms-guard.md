# FIRMS resource guard + checkpoint coverage — candidate for review, **rev 3** (6 Nov 2026)

Branch `firms-guard`, hub **0.5.2** candidate. **Not deployed; no live database or settings change.** Needs, each with Chad's separate go: (a) one additive D1 table + one additive index, (b) the hub deploy. Page unchanged.

**Rev 3 (after GPT's review of `5570b82`, which confirmed firms-guard 19/19, history-hub 27/27 and that the clock and truncation probes are fixed):** the memory bench's verdict only checked survival, while the hub catches collection and checkpoint errors internally — GPT reproduced a failed checkpoint write reported as "pass". The bench now **asserts every scenario's outputs** (publication with the expected record count; checkpoint marker, object, daily aggregates, coverage; backfill row; both collects in the stress case; usgs; exact `/place` firms section and `/snapshot`; no history failures), **four negative controls each FAIL**, and the real-file and 8 MiB scenarios were rerun: **72/72 pass with outputs verified** at the 128 MB and 80 MB total-heap caps, 3 runs each (§3). No hub code changed in rev 3.

**Rev 2 (after GPT's review of `908ff8d`, which reproduced firms-guard 10/10 and history-hub 27/27 on Node 24):**
1. **Memory ceiling re-measured in the Workers runtime** under a total-heap cap, natural GC, real payload, overlapping invocations → **limit lowered 12 MiB → 8 MiB**. 12 MiB is not supported (§3). The earlier wording that transient peaks were "merely reclaimable" is withdrawn: before a collection runs, transient allocations count against the limit as much as retained objects do.
2. **Clock bug fixed** (GPT's reproduction: snapshot 23:45:40, a run scheduled 23:45:00 failing 23:46:00 → reported 0 failures, "current"). Scheduled and actual times are now never compared with each other (§4).
3. **Truncation wording corrected and content checks added** (GPT's reproduction: final `D` removed, 14 fields, published as ok). A matching field count is not proof of a complete download (§5).

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
- Origin (code comment, 30 Oct): Free plan, **CPU** — 1.3 MB ≈ 15 ms against the 10 ms soft limit. That reason ended with Workers Paid (3 Nov). CPU on the real 5.3 MB file: parse 80–173 ms (V8, pane) — not the constraint.
- On Paid the binding limit is **memory: 128 MB per isolate, shared by the isolate's concurrent requests, same on Free and Paid** ([limits](https://developers.cloudflare.com/workers/platform/limits/), [memory metrics](https://developers.cloudflare.com/changelog/post/2026-06-30-memory-usage-metrics/), read 6 Nov).

**Three kinds of evidence, kept apart:**
| kind | what | used for the limit? |
|---|---|---|
| **Node 22**, forced GC (rev 1) | retained memory after each step: 5.3 MB → 31 MB · 8 → 33 · 12 → 49 · 16 → 62 | **No.** Retained ≠ peak; superseded. |
| **Local Workers runtime** (workerd 2026-07-30 via Miniflare 4.20260730.0), **total-heap cap** `--max-heap-size`, natural GC | pass/fail per scenario and cap, 2 runs each — `phase1/bench-firms-memory/` | **Yes.** |
| **Real platform** | Worker Metrics memory P999 17.41 MB / 24 h on files ≤ 3.8 MB; 0 Exceeded Memory (6 Nov) | Context; **confirms** after deploy, not the first validation |

**Inputs:** the **actual 5 Nov payload** (`raw/firms/2026-11-05T23-45Z.csv`, 5,311,642 B, 63,614 rows, sha256 `c3487dcc3e063db3…`, brought in through Chad's Downloads, hash checked) and scale-ups made only of its own rows: 8 MiB (100,484 rows), 10 MB (125,593), 12 MiB (150,757).

**Scenarios, one isolate each:** collect · checkpoint (triggered by a down run: snapshot read → JSON.parse → gzip → firesDaily → D1 → coverage) · backfill (gunzip a stored checkpoint) · **realistic overlap** (a visitor's resident `/place` index + one collect + `/place` + `/snapshot/firms` + usgs) · **collect + checkpoint overlap** · **stress** (resident `/place` index + two overlapping collects + `/place` + `/snapshot`). Note: `/place` keeps a parsed index of `latest/firms.json` resident for the isolate's life (`placeCache`) — overlap with a collect is therefore realistic, not hypothetical.

**Smallest total-heap cap at which a scenario passed 2/2** (caps 64 · 80 · 96 · 112 · 128 MB; `results-total-heap-2026-11-06.jsonl`):
| scenario | real 5.3 MB | **8 MiB** | 10 MB | 12 MiB |
|---|---|---|---|---|
| collect | 64 | 64 | 64 | 64 |
| checkpoint | 64 | 64 | 64 | 96 |
| backfill | 64 | 64 | 64 | 96 |
| realistic overlap | 64 | 64 | 80 | 96 |
| collect + checkpoint overlap | 64 | **80** | 96 | 112 |
| stress (2 collects) | 64 | 64 | 80 | **fails at 128 (1 of 2)** |

- *The table above is survival-only (rev 2): it shows where the runtime died, not that the work completed.*
- **Verified rerun (rev 3, decisive):** real 5.3 MB and 8 MiB, all six scenarios, 3 runs each, at total-heap caps **128** and **80** MB, every output asserted — **72/72 pass** (`phase1/bench-firms-memory/results-verified-2026-11-06.jsonl`; tested `worker.js` sha256 `70307d5fc2a9afed…`, flags recorded per run). Negative controls (checkpoint-marker write failure, collect parse failure ×2 scenarios, `/place` read failure) each **FAIL**.
- **Decision proposed: 8 MiB** (1.6× the largest file seen). Passing at an 80 MB **local V8 heap cap** shows margin in the local runtime; it is **not** a measured production reserve (production counts the whole isolate footprint).
- **12 MiB is not supported:** the two-collect case fails under the production cap; others need up to 112 MB.
- **Uncapped run** (no limit, kept as `results-uncapped-…`): without a heap limit V8 collects lazily, so the heap kept growing across phases (up to 342 MB used at 12 MiB). Shown only to explain why the cap is required for a meaningful test.

**Above 8 MiB — allocation reductions (proposed, not built; measure first):**
1. Collect: serialise the envelope once and reuse the string for `snapshots/` and `latest/` (today: two full `JSON.stringify` calls).
2. Checkpoint: compute the daily per-cell aggregates and the latest detection time at collect time (small sidecar object), so the checkpoint can stream the stored snapshot into gzip without `JSON.parse` of the whole file.
3. `/place`: do not keep the full firms index resident (scan per request, or a compact per-cell index).
Peak-season (Aug–Sep) file sizes are unmeasured; the guard (now disclosed, §4) applies until these land.

## 4. Disclosure — operational health and retained history
- **New table `archive_checkpoint_coverage`** (additive; `phase1/schema.sql`), one row per checkpoint, **separate from `archive_checkpoints` so the original checkpoint is never rewritten**: `cutoff`, `last_observation_at`, `input_age_at_day_end_s`, `failed_runs_after_cutoff`, `failure_first_at`, `failure_last_at`, `failure_reasons` (distinct, shortened), `input_status` (`current` | `stale`: stale if any run failed after the cutoff that day, or the cutoff is older than 2 × cadence + 5 min at day end), `assessed_at`, `assessed_with_checkpoint` (1 = written with the checkpoint; 0 = assessed later), `collector_version`. Derived from `collector_runs` (never pruned) and the checkpoint's own records.
- **Which failures belong after the selected snapshot (rev 2).** `collector_runs.started_at` holds the run's **scheduled** time; the snapshot's `retrieved_at` and `collector_runs.finished_at` are **actual** times. They are never compared with each other: the **day** a run belongs to = its scheduled time in [day start, day end); **after the snapshot** = it **ended** (`finished_at`) after the snapshot was retrieved, without publishing. Conservative: an overlapping run scheduled earlier that failed later, and a day-D run that failed after midnight, are disclosed. A failure that ended before the snapshot was retrieved is superseded by it and not counted. `failure_first_at` / `failure_last_at` are actual end times; scheduled time is preserved in `collector_runs.started_at`. No schema change needed for this; one additive index proposed: `collector_runs (layer, finished_at)` for the health queries.
- `/status` failing streak = failures that **ended** after the last success **ended**; reported with both `since_scheduled` and `since_finished`.
- Written **before** the completion marker; also copied into the checkpoint object's R2 metadata.
- **Checkpoints that predate 0.5.2 (5 Nov)** get a coverage row on a later run, labelled `assessed_with_checkpoint = 0` with its `assessed_at`. The 5 Nov checkpoint row and object are not touched.
- **`/status` → `archive_health`:** `last_completed[].coverage` (the above); new `collection.<firms|usgs>`: `last_successful_run {scheduled_at, finished_at, age_s}`, `latest_run {status, note}`, `failing {since, runs}`; and a `note` that a completed checkpoint means archived, not that collection covered the day.
- **Checkpoint trigger:** a **failed** run of a checkpoint layer now also runs the (idempotent) checkpoint step, so a closed day is checkpointed — or recorded as a gap — without waiting for the layer's next success.

## 5. Truncated or malformed downloads — what is and is not caught
FIRMS sends no row count or content length, so **no check here proves a complete download.** What 0.5.2 refuses (whole response → down, last good kept):
- a row whose **field count** differs from the header's (a cut inside any field but the last, or a row cut short);
- a row whose **used fields fail content checks**, set from the values seen in real files (6 Nov: 125,294 rows over 3 files — **no empty value in any column**; `acq_time` `"0"` and FRP `"0"` are genuine): latitude/longitude numeric and in range; `acq_date` `YYYY-MM-DD`; `acq_time` 1–4 digits, valid HHMM; confidence `n|l|h` (or a 0–100 number); satellite non-empty; FRP empty (→ published as **null**, a legitimate missing value) or a number ≥ 0 (zero kept); daynight `D|N`. GPT's case — the final `D` cut off — is now refused (`daynight ""`).

**Not caught (stated limits):** a cut **exactly between rows**; a cut inside a field whose truncated value is still valid (today the last column is the 1-character `daynight`, so a cut inside the last field leaves it empty and is caught — if FIRMS ever reorders columns so a numeric field is last, a cut inside it could pass); any other content that is malformed but in range.

## 6. Tests — `node --no-warnings phase1/firms-guard.test.mjs` (**19/19**, Node 22.23)
| # | Covers |
|---|---|
| 1 | the limit is 8 MiB; the 5 Nov evening size (5,311,642 B) is processed |
| 2a–2d | exactly at the limit / +1 byte; network error, HTTP 500, HTML page; mid-row cut refused; cut between rows undetected (stated limit) |
| 3 | after a good run, three failures keep `latest/firms.json` byte-identical with its own `retrieved_at`; `/status` reports last success, its age, the failing streak |
| 4, 4b | 5 Nov replay (good to 15:30, latest detection 13:00, guard 15:45–23:45; checkpoint at 00:30 by a down run → stale, 33 failures, reasons, both times kept apart); a full good day → current |
| 5, 5b | resume without rewriting D's checkpoint row, object or coverage; a pre-0.5.2 checkpoint assessed later, labelled `assessed_with_checkpoint = 0` |
| **6a** | **GPT's case:** snapshot retrieved 23:45:40, run scheduled 23:45:00 fails 23:46:00 → 1 failure, stale |
| **6b–6d** | out-of-order completion (failure scheduled 23:30 ending 23:46 counts; one ending 23:45:20 does not); out-of-order success (later-retrieved snapshot wins; earlier-ended failure not counted → current); midnight (day-D run failing 00:00:20 counts for D; a D+1 run does not) |
| **6e** | `/status` streak by actual end time |
| **7a–7d** | **GPT's case:** final `D` cut → refused; FRP cut (13 fields), invalid daynight, invalid HHMM, latitude out of range → refused with the field named; genuine zeros kept, empty FRP → null; cut between rows still passes (stated limit) |

**Memory bench (rev 3):** 72/72 verified passes; 4 negative controls each FAIL (§3).

**Each of 8 breaks fails the suite:** `old-limit` (1, 2a) · `no-truncation` (2c, 7b) · `no-content-check` (7a, 7b) · `scheduled-clock` — the rev-1 comparison (6a, 6b) · `no-coverage` (7) · `coverage-blind` (3) · `down-no-checkpoint` (8) · `reassess-history` (5).
**Regressions (rev 2):** history-hub 27 · plastic-hub 11 · drifters-hub 12 · ships-fallback 7 · ships-late 7 · ships-probe 11 · orbital-hub 13 · spacetrack-probe 11 · satellites-hub 12 · place-rows 7 · duration contract — all pass. place-ui 30 (the page's `/place` answered by the rev-2 `worker.js`).

## 6a. Remaining limitations
- Memory evidence is **local** workerd, not production: compatibility date 2026-07-30 vs the hub's 2026-10-01 (workerd refuses newer dates); real R2/D1 latency; production may place invocations in different isolates (the bench forces one); the bench caps the V8 heap, production counts the whole isolate footprint. Heap samples are lower bounds (inspector blind during synchronous JS).
- workerd 2026-07-30 refuses modules with non-function named exports — **the live 0.5.1 fails the same way locally** and runs in production, so the bench strips the test-only export line. Recorded as a runtime difference.
- Truncation: §5 limits. Peak-season sizes unmeasured; above 8 MiB the guard applies until §3's reductions are built and measured.
- The 5 Nov coverage row will be **assessed after the fact** (labelled); the 5 Nov fires checkpoint stays partial unless a separate recovery is decided.

## 7. Decisions for Chad (none taken)
1. **D1:** create `archive_checkpoint_coverage` and the index `collector_runs_layer_finished` (two `… IF NOT EXISTS` statements, additive; START-HERE §4d procedure). Must precede the deploy.
2. **Deploy hub 0.5.2** (content-only; history stays on). Then **confirm** on the Memory chart and the invocation log during the first firms runs over 4 MB (today's file passes 4 MB by mid-afternoon UTC), and watch Exceeded Memory.
3. **5 Nov fires recovery — time-limited.** The guarded runs' raw files (`raw/firms/2026-11-05T15-45Z.csv` … `T23-45Z.csv`) are deleted 2 days after upload (earliest ~7 Nov 15:45 UTC). A recovery would be a **separate, explicitly labelled record** beside the original checkpoint (never a rewrite) and is **not built**. Let them expire, or ask for a recovery proposal.
4. Not in scope: page wording for stale checkpoints (the Sources page shows history, not checkpoint coverage); streaming parse for peak season.
