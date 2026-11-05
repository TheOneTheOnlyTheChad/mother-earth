# Mother Earth — Place view v1 + history retention: candidate for review (5 Nov 2026)

Prepared by Claude for Chad and GPT (thread 14). **Branch `place-view` only.** Nothing has been deployed, merged, pushed to main, written to the live hub or its storage, or scheduled. Proposal: `reviews/2026-11-05-place-view-and-history.md` (rev 3, on the branch).

## 1. What is in the candidate
| Part | What it does | Live effect if deployed |
|---|---|---|
| **Hub 0.5.1 — `GET /place/g4/<row>_<col>`** | One envelope per cell: a section per layer, each from ONE collector run (records and counts compared on `retrieved_at`, re-read once, else **withheld** with the reason); optional layers only when named in `?layers=`; collection evidence from D1; cell bounds and area. Read-only: no writes, no upstream requests. | a new read endpoint |
| **Hub 0.5.1 — history** | Everything in proposal §5, behind **`HISTORY_ENABLED=1`** (unset = no-op; tested). | **none until Chad sets the variable** |
| **Hub fix (found by the new tests)** | FIRMS parser: a missing FRP becomes `null` ("not provided"), not `0`. JavaScript turns `+''` into 0; today's hub publishes a missing FRP as 0 MW. | affected fire records read "FRP not provided" instead of "0 MW" |
| **D1 schema** | 9 new tables + 8 indexes (`phase1/schema.sql`, History section; 17 statements). | **Created 5 Nov 09:28 UTC** (GPT's go) — see §9. Originally: Chad/Claude run the `CREATE TABLE` statements in the D1 console (his go) before the variable |
| **Page** | Click **any** point on the globe, or "Everything we hold for this cell, all layers" in a cell's details → **Everything here** panel (inspector). Sources & Details `#place`. Assets `?v=202611091000`. | new panel; nothing else changes |

### The panel, row by row
- **Selected:** cell, its `g4:` reference, latitude/longitude bounds, area in km² (cells shrink toward the poles).
- **Read this first:** *"Listed together because they share this 4° cell. Nothing here states a connection between them."*
- One row per layer, each with its own retrieval time, coverage grade and stale flag:
  - **Earthquakes / Fires / Ships:** the count and up to 8 records, each with its own time.
  - **Forest:** pixels by confidence, or "not covered" outside the swept tropical cells, or "unknown — in the sweep, not answered yet".
  - **Drifting buoys / Microplastic samples:** if off, *"layer off · Load this layer's data for this place — fetches data for this panel only; the layer stays off on the globe"*. Every plastic sample is listed.
- **Nothing reached us** is never shown as zero:
  - quakes: "… not a statement that none occurred";
  - fires: "not 'no fires'";
  - ships: "not an empty sea";
  - buoys: "says nothing about the water";
  - plastic: "does not establish plastic-free water".
- **Collection · Earthquakes / Fires / Ships:**
  - "our collector produced a usable sample in X of Y aggregated hours" (all places at once);
  - "records for this cell reached us in N h";
  - "Retained since …" and "first retained report here: …";
  - "Neither is the source's geographic coverage."
  - With no aggregated hour on record: **"unknown"**, never "0 of 24 h".
- **Not place-based:** Kp, CO₂, sea ice, orbital, day/night, each with the reason (in the disclosure).

## 2. GPT's four build details — where each is implemented
| Detail | Implementation | Test |
|---|---|---|
| Data revisions vs processing/check changes vs repeat retrievals; no duplicate unchanged datasets; plastic verification revisions preserved | `versionParts()` splits each envelope into the source's data and our processing results (volatile fields stripped: retrieval/scheduling times, versions, the NSIDC access-date citation, fetch metadata). New object only when a hash changes, labelled `first`, `data`, `processing` or `data+processing`. A repeat updates `last_retrieved_at`, `retrievals` and `last_run_ref` only. | history-hub **D1–D3** |
| Drifters: suppress identical buoy + fix-time repeats, keep corrections under the same key | `drifter_fixes` primary key = buoy, fix time, lat, lng, SST (missing SST keyed `'na'` so it de-duplicates). `INSERT OR IGNORE`: an exact repeat writes nothing; a corrected position or SST is a new row with its own first-received time. | history-hub **E1** |
| Collector uptime vs hours records reached us for this cell; neither is coverage; retention start vs first report here | `/place` returns `collection_ran` (from `layer_hourly`) and `records_reached_us_here` (from `cell_hourly` for that cell) separately, plus `retention_start` and `first_report_retained`; the panel words them separately. | history-hub **G5**, place-ui **1**, place-rows |
| "cannot be rebuilt" → "we do not currently retain a lasting history of these records" | proposal rev 3 §2 | — |

## 3. Tests (container: Chromium + SwiftShader, real globe.gl 2.45.0; D1 = real SQLite via `node:sqlite` loaded with `schema.sql`)
| Suite | Result | Shown to fail on |
|---|---|---|
| **history-hub** (new) | **16/16** | 7 deliberate breaks, each caught: gate always on (A1) · volatile fields kept (D3) · drifter repeats duplicated (E1) · checkpoint takes the new snapshot (C1) · place pairing check removed (G1) · off layers read anyway (G3) · history error propagates (F1) |
| **place-ui** (new; page's `/place` answered by the real `worker.js` over seeded stores) | **30/30** | 5 deliberate breaks, each caught: off layers requested anyway · Load also switches the layer on · late response repaints after close · empty cell shown as zero · missing FRP shown as 0 |
| **place-rows** (new, pure wording) | **7/7** | — |
| Hub regressions | drifters-hub 12 · plastic-hub 11 · orbital-hub 13 · satellites-hub 12 · ships-fallback 7 · ships-late 7 · ships-probe 11 · spacetrack-probe 11 · duration contract — pass | |
| Page regressions | desktop-overflow 112 · ux-round1 34 · mobile-pass 131 · plastic-ui 29 · drifters-ui 25 · search-ui 104 · terminator-ui 19 · terminator-behaviour 47 · orbital-ui 38 · search 111 · real-data 50 · solar 26 — pass | |
| orbital-browser | 103/105 — **the same 2 fail on main** (stale/beyond-GEO reference, likely a time-dependent fixture); separate test item, already in HANDOVER | |

**Fixed on the way:**
- **plastic-hub only passed on 4 Nov.** The hub stamps times with `new Date()`, and the test faked only `Date.now`, so it compared against the real clock. The test now fakes both.
- **A collision:** the new Load button first used `data-layer`, the attribute the page's layer toggles use. Renamed to `data-place-layer`.

**Real data, read-only (pane, 06:13–06:20 UTC):** the branch's own `worker.js` and `app.js` (sha256 `f3c73447c5b6` / `cdda62e17f58`, matching commit `dd1ec31`) ran in the browser. The hub's storage reads went to the public `/cells` and `/snapshot` files, and the database was stubbed. Six cells:
- busiest fire cell 21_32: fires 341;
- busiest ship cell 35_46: ships 900, fires 31;
- plastic cell 33_46: plastic 100, ships 60, fires 4;
- one quake cell;
- forest 22_46;
- open Pacific 20_0.

**Every count equals the hub's published cell count, and records were paired with counts for every live layer.** This run found the two wording faults fixed in `3867ef9`:
- an absent collection record was printed as "0 of 24 h" (now "unknown");
- the forest source's zero now says "source-reported zero".

**Live RC check, clean session (pane, 06:33–06:40 UTC, app in front):** the branch page files and `worker.js` (commit `928c9e0`; sha256 index `5abc1a9bc973`, app `71c88df49a83`, style `e10935d03acb`, worker `f3c73447c5b6`) ran against the live hub. Only `/place` was answered by the branch hub code in the page, reading the same public files; the database was stubbed.
- The page loaded live (8,408 points; quakes, fires and ships paired).
- A real click on the North Sea opened the fires cell inspector, which now carries the **"Everything we hold for this cell, all layers"** link. That link opened the panel for 35_46: ships 888, fires 31, quakes "not a statement that none occurred", forest "not covered", buoys and plastic "layer off".
- **Load** for plastic made one request. 3 dated samples were listed, each "check: reproduced". The **globe was unchanged** (8,408 points, 0 plastic markers or cells) and the plastic toggle stayed off (`aria-pressed=false`).
- **Phone 390×844:** no sideways scroll, panel bottom 422 above the Readings sheet at 434, scrolls inside itself, Load button 70 px tall. **Found:** the two-column layout left the text in a narrow strip. Fixed in `928c9e0` (label over text, place panel only, phones only), re-checked live, and mobile-pass still passes 131/131.

**Not yet done:** the collection block against the live D1. That needs the deploy; with the stubbed database it correctly reads "unknown".

## 4. Measurements (offline / read-only; nothing written)
### 4a. Bytes, from today's real published files (gzipped in the browser exactly as the hub would)
| Layer | Raw | gzip | Records | What is kept | Per day (est.) |
|---|---|---|---|---|---|
| firms | 328 KB | 55 KB | 4,873 (06:00 UTC, partial day) | daily checkpoint (last file of the day) | ~11.4 B/record gz → a 30–40k-record day ≈ **0.34–0.45 MB** |
| usgs | 12 KB | 2.7 KB | 32 | daily checkpoint | **~3 KB** |
| plastic | 481 KB | 68 KB | 1,145 | version on change only | **68 KB per version** (expected rare) |
| seaice | 11 KB | 3.9 KB | 330 | version (data date changes daily) | **~4 KB** |
| co2 | 11 KB | 3.3 KB | 366 | version | **~3–7 KB** |
| orbital meta | 2.3 KB | 1.2 KB | — | version (new file every 2 h) | **~15 KB** (12 files) |
| drifters | 221 KB | 27 KB | 1,302 | D1 rows (not R2) | see 4b |

**R2 total ≈ 0.4–0.5 MB/day ≈ 150–180 MB/year**, about 1.5–2 % of the 10 GB-month free allowance after a year. Rev 1 estimated 2–5 GB/year, before the archive promise was narrowed.

### 4b. D1 rows (written)
| Table | Rows/day | Basis |
|---|---|---|
| quake_revisions | **~50–100** | USGS M2.5+ day feed, re-read 06:14 and 07:10 UTC: 31 → 30 events; **2 new revisions in 56 min** (≈ 50/day) plus each new event's first revision (~30/day) |
| fires_daily | ~1,000–2,800 | one per cell with detections at the day's last pull. 170 cells at 06:00 UTC (partial day); a uniform synthetic full day gives 2,790 (upper bound) |
| drifter_fixes | **~1,300 to ~31,000** (one interval measured; a full day decides) | snapshots compared one hour apart (06:08 → 07:08 UTC): at 06:08 every buoy's latest fix was the same age (7.1 h), so that pull would have added nothing; at 07:08 a new batch had arrived and **1,293 of 1,304** fixes were new (ages 1.2–2.1 h), **0 corrections**. OSMC delivers in batches, so the daily figure depends on how many batches a day bring new fixes. At ~120 B/row incl. key ≈ **0.15–3.7 MB/day** (≈ 0.06–1.4 GB/year); within the 5 GB included, but the upper end is the largest single item, so the trial day measures it before the go |
| seaice_daily | 2–8 | 2 hemispheres × distinct values (4 runs/day) |
| orbital_population | 12 | one per published element file |
| archive_versions / checkpoints | ~15 + 2 | plus retrieval-count updates on repeats |

### 4c. CPU proxies (container Node 22, not the Worker; for order of magnitude)
| Step | When | Measured |
|---|---|---|
| place index for a full-day fires file (35k records, 2 MB) | once per file change per isolate (≤ every 15 min) | parse 20–29 ms + index 33–55 ms |
| daily checkpoint: gzip 2 MB | once a day | 37–76 ms |
| fires_daily from the same file | once a day | 10–50 ms |
| version hash of a layer | per run of small layers | ≤ 23 ms (plastic-size) |
| `/place` D1 reads | per visitor request | 16 statements, **every one an index search** (SQLite query plans checked); window sums read ≤ 168 rows per layer, start dates one row each |

### 4d. Meters that scale with visitors (cannot be measured before traffic exists)
- Worker requests: one per place view.
- Rows read: ≤ ~600 per place view by construction.
- R2 Class B reads: up to 8 small reads per place view, more when the cached index is cold.

Workers Paid includes 25 bn rows read/month and 10 M Class B/month free. These are stated as **to be measured** on the trial day; the trial will read the Worker invocation log and the D1/R2 dashboards.

## 5. What a go would mean, step by step (each its own go) — current as of 5 Nov 09:30 UTC
1. ~~**D1:** create the history tables~~ — **done 09:28 UTC** (GPT's go): 9 tables + 8 indexes from commit `8c8633d`, all `IF NOT EXISTS`, additive; existing tables untouched; verified identical to the commit, all empty (§9).
2. ~~**Deploy hub 0.5.1** with `HISTORY_ENABLED` unset~~ — **done 09:28 UTC** (GPT's go): worker.js sha256 `1f34554b2e53…` from GitHub at `8c8633d`, content-only API; 16 bindings unchanged (§9).
3. **Publish the page release** (`place-view` → main): the place view and the hub-driven "What Mother Earth keeps" wording. With history off, the page says *"History collection now: off … Retained history: none"*. **Published before collection starts** (GPT), so the public wording is already following the hub when history begins. Chad's go; live RC check in a clean session first (§10).
4. **Trial:** set `HISTORY_ENABLED=1` (Settings form; reload the Settings page first, START-HERE §4). Watch the next usgs (5 min), firms (15 min) and hourly runs: rows written, R2 objects, CPU, `/status` → `archive_health`. Turning it off is one variable, and retained history is not deleted (the wording then says so). **GPT's separate go.**
5. **One full UTC day** with history on, including the first day-change checkpoint (due 00:30 UTC + next firms/usgs run). Measure fires_daily and drifter rows. Record in STATUS.

## 6. Open points for Chad / GPT
- **Drifters in D1 rather than an R2 file** (rev 3 §11): the key does the de-duplication and correction work. Cost per §4b.
- **The FIRMS FRP fix changes published data** (a missing value stops being 0). Correct by our rules; flagged because it is a hub data change.
- **"Load this layer's data for this place"** is per panel: reopening the panel asks again. GPT's condition was that it be deliberate; it is.
- `orbital-browser` 2 known failures stay a separate item.

## 7. GPT's independent review of the branch (5 Nov) — three defects, fixed
GPT reproduced three failures that the original 16 hub checks missed. All three were real.

| # | Defect | Fix | Regression check |
|---|---|---|---|
| 1 | `placeSection()` built the section's metadata (retrieval time, run ref, version…) **before** re-reading a mismatched pair. When the re-read found a newer matching pair, the records were new but the metadata was from the superseded first read. | Metadata built by `placeMeta()` from the **final** cells file. Each section also carries `records_run_ref`, which must equal `run_ref`. | history-hub **R1**: first cells read old, records new, re-read new → checks retrieval time, run ref, version **and** the records all come from the new run. |
| 2 | `firesDaily()` started the FRP sum at 0, so a cell where no detection carried an FRP stored `frp_sum_mw = 0` (with `frp_n = 0`). | Sum and max start as null and stay null when no valid FRP exists; a reported 0 stays 0; for mixed cells the sum covers only valid values (`frp_n` says how many). Schema: `frp_sum_mw` nullable. | **R2** (pure: all missing / reported zero / mixed); **C1** now also asserts the stored row's `frp_sum_mw` is null. |
| 3 | The day-boundary checkpoint read `latest/` just before publishing replaced it. A failed archive write was never retried and the input was gone, so that day's checkpoint and fires rows stayed missing for good. | Runs **after** publishing, from the retained `snapshots/<layer>/` copy (2-day storage rule). The day goes onto a **durable pending list** before any work, and every run retries. Writes are idempotent; the `archive_checkpoints` row is written **last** as the completion marker. A day whose stored snapshot expires first is recorded **lost, with the reason**. | **R3**: first archive write on D+1 fails → publishing continues → next run completes D (cutoff = D's last pull). **R4**: partial D1 failure (object written, `fires_daily` batch fails) → finished next run, no duplicates, marker only after completion. **R5**: snapshot expired before the retry → recorded lost, nothing invented. |

**Shown to fail on the old code:** the same test file run against the pre-fix hub (`5914a6d`) gives **15 passed, 7 failed** (C1, R1–R6). On the fix: **22/22**.

**Retention wording (GPT's last point).**
- The hub now reports what it retains: `GET /` → `history: { enabled, since }`, where `since` is the first retained record.
- Sources & Details "What Mother Earth keeps" shows the history rows **only while the hub reports retention on**, plus a state line ("on … first retained record …" / "off" / "hub could not be read — the rows above describe what runs without it").
- The World View "kept" lines follow the same report.
- So the public wording changes **when retention changes**, whenever the page is published, and an unreadable hub never claims retention.
- New **kept-ui** suite: **10/10**, shown to fail on 2 deliberate breaks (history rows always shown; wording ignoring the hub).
- Proposal §5 rewritten to match the implementation exactly (rev 4), including what is **not** kept (orbital stale/beyond-GEO, Kp versions, F2).

**Asset version** `?v=202611101000`.

## 8. GPT's re-check of `482ffb0` — checkpoint recovery and wording reworked (rev 5, hub 0.5.1)
GPT accepted fixes 1 (place metadata) and 2 (FRP). Checkpoint recovery failed four independent probes, all of them caused by **one mutable state file**. Rather than patching four symptoms, the state file is gone.

**Design:**
- Each run with history on records an idempotent fact: `history_activity(layer, day)`.
- A day is **due** when history ran on it, it is **closed** (end of day + 30 min grace), and it has neither a completion marker nor a recorded gap.
- Its input is chosen afresh at every attempt: the retained snapshot with the **latest full `retrieved_at`** on that day. Snapshots now carry `retrieved_at` as R2 metadata, so a listing can order them.
- The marker is checked first and written last. A day that can't be done becomes a **gap with the reason**.
- Health is reported in **`/status` → `archive_health`**: pending days with their age, gaps, last completed, and recent history failures. Failures are also logged as `history:<step>` rows in `collector_runs`.
- The 2-day retry window is unchanged and stated. Keeping inputs longer is Chad's decision; nothing was silently extended.

| GPT probe on `482ffb0` | Regression check | `482ffb0` | 0.5.1 |
|---|---|---|---|
| first state write fails → an earlier snapshot archived (22:00 instead of 23:55) | **P1** | FAIL | pass |
| out of order within the day (a 23:40 run replaces 23:55) | **P2** (a real later run with an earlier timestamp) | FAIL | pass |
| overlapping runs roll state back | **P3** (one attempt paused mid-way, the other completes, the first resumes → one marker, consistent rows) | FAIL | pass |
| finished work later marked lost | **P4** (marker present, input expired → stays done; the step checks the marker before touching the input) | FAIL | pass |
| — | **P5** archive health in `/status` | FAIL | pass |

history-hub: **27/27** on 0.5.1. On `482ffb0` the same file gives **17 passed, 10 failed**.

**Query cost:** every new D1 read is an index search (SQLite plans checked). The history report reads first/last as separate MIN and MAX lookups, because one query doing both scans the whole index.

**Wording:** the hub reports **two facts**: `collecting` (now) and `retained` (what exists; `exists: null` when unreadable).
- Base lines say only what is always true ("the current file").
- The history line has four states:
  - collecting, retained since …;
  - retained for … to …, collection is off now, retained history is not deleted;
  - no further history collected;
  - could not be read just now.
- The broad "None of it is shown" sentence is replaced; the place view is named as the exception.
- The Oceaneye row's "samples are not kept" clause is removed.
- kept-ui **19/19** covers off+none, on, the on → off transition (retained, not deleted), on → unreadable hub, readable hub with unreadable history (both unknown) and World View.

**Found on the way (pre-existing, on the live Sources page):** `fill()` removed rows with `tr:not(:first-child)`, but each redraw's rows land in their own `<tbody>`. So every 5-minute refresh left one stale row in every redrawn table. Fixed; kept-ui checks that 3 refreshes leave every table's row count unchanged, and that check fails with main's `fill()`.

Assets `?v=202611111000`. Hub version **0.5.1** (deployed 5 Nov 09:28 UTC with history off — §9).

## 9. Schema + hub 0.5.1 deployed, history OFF (5 Nov 09:28 UTC, GPT's go) — verification
- **D1:** the 17 statements of the History section of `phase1/schema.sql` at `8c8633d` (9 tables + 8 indexes, all `IF NOT EXISTS`) executed one by one through the dashboard API, 17/17 ok. Before: none of the nine existed. After: each table's columns, NOT NULL flags and primary keys were read live (`PRAGMA table_info`) and compared with the same readout from the commit's schema on SQLite: **9/9 identical**. All 9 empty; 8 new indexes present; existing tables untouched.
- **Hub:** worker.js from GitHub at `8c8633d`, sha256 `1f34554b2e539e97…` checked before upload, content-only API, HTTP 200. **Bindings unchanged: 16; `HISTORY_ENABLED` absent** (checked before and after).
- `/` and `/status` = **0.5.1**. History report (both): `collecting: false`, `retained: {exists: false}`. This is read from the real, empty tables (not "tables not created"), so the report path is exercised.
- `/status` → `archive_health`: pending [], gaps [], last_completed [], recent_failures [], retry window stated.
- `/place`: North Sea 35_46 (ships 848, fires 31, every record section same-run; ships collection 22/24 aggregated hours), plastic cell 33_46 with `?layers=plastic,drifters` (plastic 100, all same-run).
- **First scheduled runs on 0.5.1:** usgs 09:30:07 ok (29); firms 09:30:40 ok (20,332). History tables: **0 rows in all nine**. R2 `archive/`: 0 objects; `state/history-*`: 0. No history failures. New snapshots carry R2 metadata `retrieved_at` (e.g. `snapshots/firms/2026-11-05T09-30Z.json` → `2026-11-05T09:30:42.818Z`), which the checkpoint design orders by.

## 10. The retention-wording release (page) — ready for GPT's review and Chad's go to publish
`place-view` page files at `8c8633d` (sha256 index `bdc44df5d2e6`, app `fc2133f7f088`, style `e10935d03acb`, sources `dd2e63e59484`; assets `?v=202611111000`) contain the place view and the hub-driven "What Mother Earth keeps". **Live RC check, clean session, against the live 0.5.1 hub (no stand-ins), 5 Nov 09:29–09:31 UTC:**
- **Sources & Details:**
  - state line *"History collection now: off (reported by the hub). Retained history: none."*;
  - 0 history rows shown;
  - comparison lines *"…; no further history collected"*;
  - intro names the place view as the one exception;
  - Oceaneye row without the "samples are not kept" clause;
  - no "no history kept" text anywhere;
  - every table the same size after two extra refreshes (the `fill()` fix).
- **World View:** the place panel for 35_46 loads from the live `/place` (one request). Ships 848 with records, and real collection evidence: *"our collector produced a usable sample in 22 of 24 aggregated hours … records for this cell reached us in 22 h …"*. Fires: 16 of 24 h, consistent with FIRMS's empty early-UTC hours.
- **Publishing this before history starts** means the public wording is already following the hub when collection begins: it will switch to *"collecting; retained since …"* by itself on the first history write.
- Publishing = merge `place-view` → main (Chad's go), then served-file hash check and a public smoke test.
