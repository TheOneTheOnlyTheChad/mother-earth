# 5 Nov 2026 fires — recovery record (review, rev 1)

**Status: built in Claude's workspace only. Nothing written to D1, R2 or the hub.** Chad's go for the recovery build: 6 Nov 2026 ("start the 5 Nov recovery build now, in your workspace only … Nothing touches D1 or production until I give a separate go"). Any write needs his separate go after review.

## 1. Why
On 5 Nov the hub's 4 MB FIRMS guard (0.5.1) skipped processing from 15:45 UTC to midnight. Each skipped run still archived its raw file. The 5 Nov checkpoint (written 6 Nov 02:16 UTC) therefore covers detections up to the **15:30 retrieval** only (STATUS, thread 15). Hub 0.5.2 (deployed 6 Nov 05:53 UTC, 8 MiB guard) stops it recurring but does not repair 5 Nov.

This recovery is a **separate, labelled record next to the original**. The original checkpoint (R2 object, `archive_checkpoints` marker, 555 `fires_daily` rows) is not changed.

## 2. Inputs and provenance
| input | where from | bytes | sha256 |
|---|---|---|---|
| `2026-11-05T23-45Z.csv` — **the recovery input** | R2 `raw/firms/2026-11-05T23-45Z.csv` (uploaded 2026-11-05T23:45:43.250Z by the 23:45 run; guard-skipped). Chad downloaded it from the R2 dashboard 6 Nov ~06:03 UTC; hash-checked against a direct R2 read. | 5,311,642 | `c3487dcc3e063db3dcbc7f76f272e00aaaf1bded83906c79b4c180619262bab8` |
| `checkpoint-firms-2026-11-05.json` — the original checkpoint (validation) | R2 `archive/checkpoints/firms/2026-11-05.json.gz`, read 6 Nov (decoded JSON) | 2,955,920 | `1a61adf2e9149ad21a4bc55f986406e95380c596d222e002d1c46bf834648bb0` |
| `2026-11-05T15-30Z.csv` — the raw file behind the original (validation) | R2 `raw/firms/2026-11-05T15-30Z.csv`, read 6 Nov | 3,833,218 | `de6c53975d5228641b3cda1da4301c7e0084fc16744a84733f59d7a5df957c31` |

The 23:45 file is the latest retrieval of the day, which is the input the hub's checkpoint rule takes (latest full `retrieved_at` on the day). R2 deletes the originals 2 days after upload (~7 Nov 15:30–23:45 UTC); the copies above are kept on Chad's Mac at `~/Documents/Mother Earth/research/firms-recovery/2026-11-05/` (`in/`, `out/`, `recover.mjs`, `probe23.mjs`, README).

## 3. Method
`recover.mjs` imports the hub's own `worker.js` from **`2ee3a62`** (= deployed 0.5.2, sha `70307d5f…`), with only test exports added (`firmsParse`, `cellId`, `runRef`; copy sha `46624a3d…`). It calls the hub's functions; nothing is reimplemented:
- `firmsParse` (0.5.2: field-count and content checks on every used field, empty FRP → null) on the raw CSV;
- `firesDaily` for per-cell daily aggregates, rounded exactly as `histCheckpointOne` writes them (`frp_sum` to 0.1 MW);
- `checkpointCoverage` for day-end age and status, with no run history (D1 not read; §5).
Node v22.23.4, no network. **Two runs give byte-identical outputs** (hashes in §6).

## 4. Validation — the harness reproduces the original exactly
| check | expected (STATUS / D1, 6 Nov 02:47 read) | harness | |
|---|---|---|---|
| `firesDaily` on the archived checkpoint input: cells | 555 | 555 | ✓ |
| detections | 46,009 | 46,009 | ✓ |
| day / night | 37,899 / 8,110 | 37,899 / 8,110 | ✓ |
| FRP present | 46,009 | 46,009 | ✓ |
| max FRP | 746.34 MW | 746.34 MW | ✓ |
| 0.5.2 `firmsParse` re-reading the 15:30 raw file vs the 0.5.1 checkpoint records | identical | 46,009 rows, **identical fields and rows in order** | ✓ |

So the 0.5.2 parser and the aggregation used for the recovery give the same answer as the published original on the same input. (Compared against STATUS's recorded D1 figures, not a fresh D1 read — §5.)

## 5. Results
| | original checkpoint | recovery |
|---|---|---|
| input | snapshot of the 15:30 run | raw file of the 23:45 run |
| cutoff (retrieval) | 2026-11-05T15:30:44.382Z | **2026-11-05T23:45:43.250Z** (R2 upload time of the raw file — the run made no snapshot; the hub stamps retrieval just after upload, so this is a close lower bound) |
| latest detection inside | 11:55 UTC | **21:36 UTC** |
| processed by | 0.5.1 (hub) | 0.5.2 functions (workspace) |
| records / detections | 46,009 | **63,614** (63,591 distinct — §5.2) |
| cells | 555 | **641** (+86 new, 0 lost) |
| day / night | 37,899 / 8,110 | 48,826 / 14,788 |
| FRP present / max | all / 746.34 MW | all / 746.34 MW |
| day-end age (hub rule) | 30,556 s → stale | 857 s → current by the hub's rule (≤ 2 × 900 + 300 s) |

Largest additions are evening passes: cell 17_76 497 → 1,931; 25_46 68 → 1,325; 17_79 148 → 1,403; 25_48 186 → 1,185 (full table `out/cells-diff-2026-11-05.csv`).

### 5.1 The 23:45 file is not a superset of the 15:30 one
45,986 of the original's 46,009 rows are in the 23:45 file unchanged. **23 are not**, and no row at the same position, time and satellite replaced them: all from NOAA-20 passes over North America at 10:05–10:10 and 11:46–11:47 UTC (one has a neighbour 0.002° away; the rest have none). FIRMS removed them between 15:30 and 23:45. Four cells therefore have **fewer** detections in the recovery (34_19 8→6, 34_13 25→20, 32_18 12→9, 32_17 2→1). Not caused by our parsing: the 15:30 file re-parses to the original exactly (§4). Why FIRMS removed them is not known from the files.

### 5.2 Duplicate rows in the source
The 23:45 CSV contains **23 exact duplicate lines** (consecutive pairs, all one NOAA-20 pass at 17:59 UTC over Venezuela/Colombia, e.g. lines 60,809/60,810). The original had none. The hub counts every row as delivered, so the recovery counts them twice too (63,614); the distinct count is 63,591. That the duplicate count equals the removed count (§5.1) is a coincidence — different passes, places and times.

### 5.3 Finding for every day (not the recovery's): the day ends at the source's lag
The latest detection in the 23:45 file is **21:36 UTC**. FIRMS `day_range=1` returns the current UTC date only and resets at 00:00 (6 Nov's files hold only 6 Nov acquisition dates — checked on `raw/firms/2026-11-06T06-00Z.csv`, 396 rows, all 2026-11-06). So detections acquired late on any day and processed after midnight never reach us. **Every daily FIRMS checkpoint — including a perfect one — ends roughly 2–2.5 h before midnight**, while `input_status` reads "current" (it measures the retrieval, not the observations). `last_observation_at` (new in 0.5.2) records it, so it is visible per day. Research item, no build: whether to fetch `day_range=2` once after midnight to close the day, and how to word the day's end.

### 5.4 Run history after the cutoff (not queried)
D1 was not read. From STATUS: on 5 Nov the only run after 23:45:43 is the 23:45 run itself — the one whose raw file is the input (guard-skipped, "down"). The hub's own coverage query would count that run as a failure after the cutoff (it finished after the upload), so a coverage row computed by the hub would say `failed_runs_after_cutoff = 1`, `stale`. For the recovery this is misleading: that failure is the reason the file was never processed, and the file is used here. Proposal: state it in words in the recovery record, not as a failure count (decision 4).

## 6. Outputs (workspace + Mac; not in the repo — data)
| file | what | sha256 |
|---|---|---|
| `out/fires_daily-recovered-2026-11-05.csv` | 641 rows in `fires_daily`'s column layout (cutoff and run_ref from the 23:45 upload; collector_version 0.5.2) | `56a5ccb7…` |
| `out/recovery-firms-2026-11-05.json.gz` | the recovery record: label, what it recovers (original key, cutoff, count), input key + sha, processed-with, cutoff meaning, last detection, all 63,614 records — 691,761 B | `beee3cc0…` |
| `out/cells-diff-2026-11-05.csv` | per cell: original, recovered, change (641 cells) | `58177965…` |
| `out/summary.json` | every figure in this review | `d4975656…` |
Scripts: `recover.mjs` (`503fff69…`), `probe23.mjs` (`aa727578…`) — committed under `phase1/recovery-firms-2026-11-05/` for reproduction.

## 7. Proposal — where the record would live (NOT done; each needs Chad's go)
The original stays exactly as it is. `fires_daily`'s key is (cell, day) with `INSERT OR IGNORE`, so recovered rows cannot sit in it for the same day — and should not: they are a different record.
- **R2:** `archive/recoveries/firms/2026-11-05.json.gz` = the record in §6 (not under `raw/`, `snapshots/` or `cells/`, so no lifecycle rule deletes it).
- **D1 (additive schema, `CREATE … IF NOT EXISTS`):**
  - `archive_recoveries` (layer, day, recovers_r2_key, original_cutoff, cutoff, cutoff_meaning, last_observation_at, input_r2_key, input_sha256, input_bytes, records, records_distinct, removed_since_original, processed_with_commit, collector_version, made_where, made_on, reviewed_by, approved_by, note) — one row per recovery, PK (layer, day, cutoff).
  - `fires_daily_recovered` — `fires_daily`'s columns + nothing else, PK (cell_id, day, cutoff); 641 rows.
- **Hub reading:** none. 0.5.2 does not read either table; the place view, history report and `archive_health` keep showing the original. Showing recovered data anywhere is a later, separate presentation decision.
- **How it would be written:** the session refuses Claude's writes to production storage (6 Nov). Options: Chad pastes prepared statements in the D1 console and uploads the R2 object from the dashboard; or a hub admin endpoint (code change, review, deploy). Prepared statements would come with a read-back check.

## 8. Open decisions (Chad; GPT review first)
1. Write the recovery at all, or keep it as evidence on the Mac only?
2. Placement as §7, or R2 object only (no D1 rows)?
3. Duplicates: count as delivered (63,614, matches the hub) or distinct (63,591)? Proposal: as delivered, with the duplicate count stated.
4. Coverage of the recovery: words only (§5.4), or a coverage row — and if so, how to state the guard-skipped source run without calling it a failure after the cutoff?
5. §5.3 (day ends at source lag) — open a research item?

## 9. Limits
- One input file; FIRMS gives no row count, so no check proves the download complete (the parse refuses malformed rows only — 0.5.2 wording).
- The cutoff is the R2 upload time, not a recorded `retrieved_at`.
- D1 was not read: §4 compares with STATUS's recorded figures, and §5.4 relies on STATUS for the run history.
- The 23 removed rows' reason is unknown; the recovery reflects FIRMS's file as of 23:45, not a union of the day's files.
