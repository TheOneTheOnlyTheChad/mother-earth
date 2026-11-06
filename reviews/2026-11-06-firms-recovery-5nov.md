# 5 Nov 2026 fires — recovery record (review, rev 2)

**Status: WRITTEN to R2 on 6 Nov 2026 08:19:35 UTC (Chad's go) and verified — see §10.** One object only; nothing written to D1, the hub or the page.

**Changes since rev 1** (GPT's review, 6 Nov 2026). GPT independently verified the rev 1 calculations against the preserved inputs and the hub's functions: original 46,009 records, identical fields and rows; recovery 63,614 rows, 63,591 distinct parsed records, 641 cells; 23 original records absent; latest observation 21:36 UTC; records and per-cell aggregates match. Rev 2 changes:
- **Metadata.** The record now carries its own limitations, separates observation, upload and creation times, sets the retrieval time to null (unavailable), and labels its reference as recovery-generated.
- **Coverage.** The dummy-database coverage result is removed. The record states that run history was not assessed, and describes the guard-skipped input run separately.
- **Wording.** Source-lag wording is narrowed to this file only. Research item R11 is opened.
- **Validation gate.** `recover.mjs` writes nothing on any mismatch.
- **Placement.** R2 only. The D1 recovery tables are dropped until there is an agreed querying requirement.

## 1. Why
On 5 Nov the hub's 4 MB FIRMS guard (0.5.1) skipped processing from 15:45 UTC to midnight. Each skipped run still archived its raw file. The 5 Nov checkpoint (written 6 Nov 02:16 UTC) therefore holds the **snapshot retrieved at 15:30:44 UTC**. Hub 0.5.2 (deployed 6 Nov 05:53 UTC, 8 MiB guard) stops this recurring but does not repair 5 Nov.

The recovery is a **separate, labelled record next to the original**. The original checkpoint (R2 object and its metadata, the `archive_checkpoints` marker, the 555 `fires_daily` rows, the `archive_checkpoint_coverage` row) is not changed. The hub and page do not read the recovery.

## 2. Inputs and provenance
| input | where from | bytes | sha256 |
|---|---|---|---|
| `2026-11-05T23-45Z.csv` — **the recovery input** | R2 `raw/firms/2026-11-05T23-45Z.csv`. **Uploaded to R2 at 2026-11-05T23:45:43.250Z** (object `last_modified`) by the 23:45 run, which did not process it (guard). Its retrieval time is **not recorded** anywhere. Chad downloaded it 6 Nov ~06:03 UTC; hash-checked against a direct R2 read. | 5,311,642 | `c3487dcc3e063db3dcbc7f76f272e00aaaf1bded83906c79b4c180619262bab8` |
| `checkpoint-firms-2026-11-05.json` — original checkpoint (validation) | R2 `archive/checkpoints/firms/2026-11-05.json.gz`, read 6 Nov (decoded JSON) | 2,955,920 | `1a61adf2e9149ad21a4bc55f986406e95380c596d222e002d1c46bf834648bb0` |
| `2026-11-05T15-30Z.csv` — raw behind the original (validation) | R2 `raw/firms/2026-11-05T15-30Z.csv`, read 6 Nov | 3,833,218 | `de6c53975d5228641b3cda1da4301c7e0084fc16744a84733f59d7a5df957c31` |

Preserved on Chad's Mac at `~/Documents/Mother Earth/research/firms-recovery/2026-11-05/in/`. All three were re-hashed on 6 Nov ~07:58 UTC and match. R2 deletes the originals 2 days after upload; the Mac copies are the durable inputs.

## 3. Method
`recover.mjs` (rev 2) imports the hub's own `worker.js` from **`2ee3a62`** (= deployed 0.5.2, sha `70307d5f…`), with only test exports added (copy sha `46624a3d…`). It calls `firmsParse` and `firesDaily`; nothing is reimplemented. `checkpointCoverage` is **no longer called**: without D1 its result was not meaningful.

**Validation gate (new).** The script runs in this order:
1. Input and harness hashes. Any mismatch stops it.
2. Compute.
3. Check every figure against pinned values: the original's figures, the 0.5.2 re-parse, and the recovery's rows, distinct records, excess, cells, day/night, FRP, latest observation, absent count and cell differences.
4. Gzip round trip of the record (records identical, 641 cells, cell detections sum to the row count).
5. Only then create `out/` and write.

`out/` must not exist beforehand, so a failed run leaves no write-ready files. Negative controls each stopped with exit 1 and **no `out/`**:
- one input row dropped (input hash);
- the same file with its hash re-pinned (figures caught it: 63,613 ≠ 63,614);
- duplicates removed before counting (63,591 ≠ 63,614);
- a wrong pinned latest observation (21:35);
- an altered worker copy.

The unmodified control passed. Two runs gave byte-identical outputs (Node 22.23.4).

## 4. Validation — the harness reproduces the original exactly
| check | expected (STATUS / D1, 6 Nov 02:47 read) | harness | |
|---|---|---|---|
| `firesDaily` on the archived checkpoint input: cells | 555 | 555 | ✓ |
| detections | 46,009 | 46,009 | ✓ |
| day / night | 37,899 / 8,110 | 37,899 / 8,110 | ✓ |
| FRP present / max | 46,009 / 746.34 MW | 46,009 / 746.34 MW | ✓ |
| 0.5.2 `firmsParse` re-reading the 15:30 raw vs the 0.5.1 checkpoint records | identical | 46,009 rows, identical fields and rows in order | ✓ |

Independently reproduced by GPT (6 Nov).

## 5. Results
| | original checkpoint | recovery |
|---|---|---|
| input | snapshot of the 15:30 run | raw object of the 23:45 run (one later source snapshot) |
| input time | **retrieved** 2026-11-05T15:30:44.382Z | **uploaded to R2** 2026-11-05T23:45:43.250Z; retrieval time unavailable |
| latest observation inside | 11:55 UTC | **21:36 UTC** |
| processed by | 0.5.1 (hub) | 0.5.2 functions (workspace) |
| rows (as delivered) | 46,009 | **63,614** |
| distinct parsed records | 46,009 | **63,591** (23 duplicate excess rows, §5.2) |
| cells | 555 | **641** (+86, 0 lost) |
| day / night | 37,899 / 8,110 | 48,826 / 14,788 |
| FRP present / max | all / 746.34 MW | all / 746.34 MW |

**Coverage is not stated.** Run history for 5 Nov was not assessed for this record. The record does not say "current", gives no failure count, and implies neither zero failures nor complete coverage. The 23:45 run, whose raw object is the input, is described separately in the record: it finished 23:45:43.686Z, archived the file and did not process it ("raw archived; processing skipped: resource guard (size > limit)", per the hub's `/status` read 6 Nov 07:54 UTC). The hub's own 5 Nov coverage row is unchanged by this work: stale, 33 failed runs after its cutoff.

Largest additions are evening passes: cell 17_76 497 → 1,931; 25_46 68 → 1,325; 17_79 148 → 1,403; 25_48 186 → 1,185 (`out/cells-diff-2026-11-05.csv`).

### 5.1 The 23:45 file is not a superset of the 15:30 one
45,986 of the original's 46,009 records are in the 23:45 file unchanged. **23 are absent, reason unknown.** No record at the same position, time and satellite replaced them. All are NOAA-20, North America, 10:05–10:10 and 11:46–11:47 UTC. Four cells have fewer detections in the recovery (34_19 8→6, 34_13 25→20, 32_18 12→9, 32_17 2→1). Our parsing is not the cause: the 15:30 file re-parses to the original exactly (§4).

### 5.2 Duplicate rows in the source
The 23:45 CSV holds 23 exact duplicate lines (consecutive pairs, one NOAA-20 pass at 17:59 UTC over Venezuela/Colombia). Counts are **as delivered**, matching the hub: 63,614 rows, 63,591 distinct parsed records, 23 duplicate excess rows. The record states all three. That 23 also equals the absent count (§5.1) is a coincidence: different passes, places and times.

### 5.3 Latest observation — this file only
This file's latest observation is **21:36 UTC**. That is one file on one day; it does **not** establish a fixed end-of-day gap for any other day. `day_range=1` returns the current UTC date only, so previous-day observations that arrive after midnight are a question worth measuring. It is opened as **research item R11** (`docs/RESEARCH-BACKLOG.md`), research only. R11 will compare `day_range=2` with an explicit previous-date query on payload and cost. No collector or schedule change.

## 6. Outputs (rev 2; data, not in the repo; Mac `out/`, rev 1 kept as `out-rev1/`)
| file | what | bytes | sha256 |
|---|---|---|---|
| `recovery-firms-2026-11-05.json.gz` | **the record to write** (§7) — label, recovery ref, times, input, input run, run history (not assessed), counting, limitations, 641 per-cell aggregates, 63,614 records | 659,639 | `624ecf2ed864465137cb20ddc999d594cbbdeefcce7b9f0f682aede75678096e` |
| (same, uncompressed JSON) | for comparison across Node/zlib versions | 3,999,628 | `16e536c72e738ff910e6a87b35bbf4dd7e84a026854677154d8c7013a9a77358` |
| `fires_daily-recovered-2026-11-05.csv` | 641 per-cell rows (working copy; columns `input_r2_uploaded_at`, `recovery_ref` — not a hub cutoff or run ref) | 75,581 | `c9af5a72b30fd9f736f52b4f959f38c8743d2b483f58a2d351edf9f871a6a9b7` |
| `cells-diff-2026-11-05.csv` | per cell: original, recovered, change (unchanged from rev 1) | 8,734 | `581779657030b274bdb101adff211f2e87e4dc3f0d456ce515c6b99ad88f29d0` |
| `summary.json` | every figure here + output hashes | 2,656 | `ea072c33311a5a83bddb57b853480c081f0e0338835c4bf304242dd58420a82b` |

**The record's metadata** (everything except `daily_cells.rows` and `records`):
- `kind` `recovery` · `layer` `firms` · `day` `2026-11-05` · `recovery_ref` **`recovery-generated:firms:2026-11-05:c3487dcc3e06`** (not a hub run reference).
- `label`: "RECOVERED — made after the day, outside the hub, from a raw object the hub archived but did not process (4 MB resource guard). Not the original checkpoint, not a hub run, and not a complete record of the UTC day."
- `recovers`: original checkpoint key, its snapshot's retrieval time 15:30:44.382Z, 46,009 records, plus a note that the original and its tables are unchanged.
- `times`:
  - `observations.latest_observation_at` 21:36:00Z, with the this-file-only note;
  - `input_r2_uploaded_at` 23:45:43.250Z;
  - `input_retrieved_at` **null**, with the "unavailable" note;
  - `recovery_created_at` 2026-11-06T08:06:37.000Z.
- `input`: R2 key, bytes, sha256, and where the preserved copy is.
- `input_run`: finished_at, "not processed", the guard reason, its source, and that it is described, not counted as a failure.
- `run_history`: `assessed: false`, with a note.
- `processed_with`: commit `2ee3a62`, full worker sha, 0.5.2, the functions used, made in Claude's workspace, validated.
- `counting`: as delivered — 63,614 / 63,591 / 23.
- `limitations`, six statements:
  - counts as delivered (with the three figures);
  - 23 original records absent, reason unknown;
  - a later source snapshot, not a union of the day's files or a complete UTC-day record;
  - retrieval time unavailable;
  - run history not assessed, no implication of zero failures or complete coverage;
  - no proof of a complete download.

Scripts, committed under `phase1/recovery-firms-2026-11-05/`:

| script | sha256 |
|---|---|
| `recover.mjs` | `92403d54…` |
| `r2-write.js` | `2dae92e6…` |
| `test-r2-write.mjs` | `393e5bd8…` |
| `probe23.mjs` | `aa727578…` |

The README there has the reproduction steps.

## 7. R2-only write procedure (prepared; NOT run)
**Writes exactly one object.** Nothing else is written: no D1 write and no D1 recovery tables (they wait for an agreed querying requirement), no hub deploy, no page change. The hub never lists or reads `archive/` beyond `archive/versions/` and `archive/checkpoints/` (checked in `worker.js`: its only R2 `list` calls are under `cells/` and `snapshots/`). So the object cannot appear in the hub, `/place`, `/status` or the page.

| | |
|---|---|
| destination | bucket `mother-earth`, key **`archive/recoveries/firms/2026-11-05.json.gz`** |
| bytes | **659,639** |
| sha256 | **`624ecf2ed864465137cb20ddc999d594cbbdeefcce7b9f0f682aede75678096e`** |
| content type | `application/gzip` (stored as-is; no content-encoding) |
| lifecycle | the 2-day rules cover `raw/`, `snapshots/`, `cells/`; `archive/` is outside them. Re-read at step 0. |

**Where:** a signed-in `dash.cloudflare.com` browser-pane tab, running `phase1/recovery-firms-2026-11-05/r2-write.js` via `javascript_tool` (dashboard API with the session's `x-atok`, as for the 0.5.2 deploy). The pane tab is **signed out** at 6 Nov ~08:00 UTC (after the app restart). Chad signs in first; Claude never enters credentials.

**Steps:**
0. **`REC.precheck()`** — read-only:
   - the destination key must be **absent** (exact-key listing);
   - lifecycle rules are read, and none may match the destination;
   - **"before" state** is recorded: the original checkpoint object's size, etag and last_modified, plus three D1 SELECTs for firms 5 Nov (`archive_checkpoints` row, `archive_checkpoint_coverage` row, `fires_daily` count / detections sum / FRP max).
1. **Transfer + check bytes:** the gzip goes into the page as base64 in ~150 k-character chunks (`REC.addChunk` × 6, then `REC.assemble()`). The page hashes the assembled bytes. Anything other than 659,639 B with the pinned sha256 discards them, and step 2 refuses.
2. **`REC.put()` — the only write.** It re-checks the destination immediately before writing:
   - **absent** → one `PUT` to the exact key;
   - **identical object present** → **no-op** (no PUT);
   - **different object present** → **stop, nothing written, needs review**.
   It never overwrites. The page logs the request start and response times. Residual race window between the re-check and the PUT: nothing else writes under `archive/recoveries/` (the hub does not), and the dashboard API offers no conditional put.
3. **`REC.verify()`** — read-only. It reads the object back and checks:
   - sha256 and byte length equal the pins, and the listed size matches;
   - after gunzip: `kind`, `layer`, `day`, `recovery_ref`, input sha, `input_r2_uploaded_at`, `input_retrieved_at` null, `recovery_created_at`, latest observation, `run_history.assessed` false, counting 63,614 / 63,591 / 23, 63,614 records, 641 cells summing to 63,614, and limitations present.
   It records the object's `last_modified` and etag as the **actual write time**.
4. **`REC.untouched()`** — read-only. The original checkpoint object and the three D1 reads must equal the step-0 "before" state.
5. **Record:** `REC.log` (every step's time and result) goes into §10 below and STATUS. That includes the actual write time (R2 `last_modified` + the page's PUT response time) and the verification result.

**If the PUT endpoint is refused** (the session's safety check, or HTTP error): nothing is written, and `verify` reports not found. Fallback: Chad uploads the Mac file `out/recovery-firms-2026-11-05.json.gz` himself through the R2 dashboard. He opens folder `archive/recoveries/firms/`, uses Upload, and the file is named exactly `2026-11-05.json.gz`. Steps 3–4 then run unchanged.

**Tested offline** (`test-r2-write.mjs`, mocked dashboard API, the real gzip):
- absent → written, verify ok, untouched ok, **exactly one non-GET call (the PUT to the key)**;
- identical present → no-op, 0 PUTs;
- different present → stopped, 0 PUTs, object unchanged;
- corrupted bytes → refused, 0 PUTs;
- PUT fails → verify fails;
- original changed → untouched fails.

D1 calls in the procedure are SELECT only (the mock rejects anything else). The real dashboard endpoints are confirmed only at step 0 (lists, lifecycle) and steps 2–3 on the day.

**Approve line for Chad (when ready):**
`Approve: write one R2 object archive/recoveries/firms/2026-11-05.json.gz (659,639 B, sha256 624ecf2ed864465137cb20ddc999d594cbbdeefcce7b9f0f682aede75678096e) via r2-write.js — no overwrite, no D1, no hub or page change`

## 8. Decisions (rev 1 §8, now settled)
| # | rev 1 question | rev 2 |
|---|---|---|
| 1 | Write at all? | R2 object only, pending Chad's go |
| 2 | Placement | `archive/recoveries/` R2 object; **D1 tables deferred** until a querying requirement is agreed |
| 3 | Duplicates | as delivered (63,614), with distinct (63,591) and excess (23) stated in the record |
| 4 | Coverage | no coverage row; run history "not assessed"; the input run described separately |
| 5 | Source lag | research item R11 (one data point; two query options to measure) |

## 9. Limits
- One input file. FIRMS gives no row count, so no check proves the download complete; the parser refuses malformed rows only.
- The input's retrieval time is unknown; only its R2 upload time is recorded.
- Run history not assessed (D1 not read for this record). §4 compares with STATUS's recorded D1 figures; GPT's verification was against the preserved inputs.
- The reason the 23 records are absent is unknown. The recovery reflects the source file as of its 23:45 upload, not a union of the day's files.

## 10. Write log
**Approval (Chad, 6 Nov ~08:10 UTC):** "Approve: write one R2 object archive/recoveries/firms/2026-11-05.json.gz (659,639 B, sha256 624ecf2e…) via r2-write.js — no overwrite, no D1, no hub or page change".

| step | time (UTC) | result |
|---|---|---|
| load `r2-write.js` | 08:11 | fetched from GitHub at `5f68d8e`; sha256 `2dae92e6…` matched before running |
| 0 precheck | 08:11:16 | **destination absent**. Lifecycle: `cells-48h`, `raw-48h`, `snapshots-48h` (prefixes `cells/`, `raw/`, `snapshots/`) plus Cloudflare's *Default Multipart Abort Rule* (no prefix; it only aborts unfinished multipart uploads and never deletes stored objects). Before-state recorded: checkpoint object 507,004 B, etag `1c24bb71698efcd5de2c4d135e7327ec`, last_modified 02:16:10.930Z; `archive_checkpoints` firms 5 Nov (46,009 records, cutoff 15:30:44.382Z); coverage row (stale, 33 failed after cutoff, assessed 06:00:45.551Z); `fires_daily` 555 cells / 46,009 detections / max 746.34 MW |
| 1–2 transfer + write | **08:19:35.374Z** (R2 `last_modified`) | **Deviation from §7:** step 1 (base64 through Claude's tool calls) was not practical at 660 KB (~880 k characters), so the procedure's own fallback was used. **Chad uploaded the Mac file** `upload/2026-11-05.json.gz` (a copy of `out/recovery-firms-2026-11-05.json.gz`, sha256 checked on the Mac first) through the R2 dashboard into `archive/recoveries/firms/`. The script's in-page no-overwrite re-check did not run for this upload; the 08:11 precheck had shown the destination absent. |
| 3 verify | ≈08:20 | **ok, all 18 checks.** Read-back sha256 `624ecf2ed864465137cb20ddc999d594cbbdeefcce7b9f0f682aede75678096e`, 659,639 B, listed size equal. After gunzip, every content field matches the pins. etag `4e3b3d614ce5f7625248bffb6876b6e1`. The dashboard set content type `application/x-gzip` (planned `application/gzip`; bytes stored as-is, no content-encoding). |
| 4 untouched | ≈08:20 | **ok.** The checkpoint object and all three D1 reads are identical to the 08:11 state. The only object under `archive/recoveries/` is the one key; no folder placeholders were created. |

**For a future write of this kind:** the bytes need a route into the page that does not pass through tool-call text. Options: a dashboard upload as here, or a page fetch from a hash-pinned source. Fix this in the procedure before reusing it.
