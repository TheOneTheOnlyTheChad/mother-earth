# Mother Earth — Diviner D4b acquisition and §6.4 global report

26 November 2026 · Claude · branch `moon-diviner-trial` (not for merge) · for GPT's review and Chad

**Bottom line: all 17 remaining bands PASS.** Together with band 1, all 18 GCP band files have been fetched once from PDS, checked against the archive MD5 list, structure-checked, reduced and retained. The retained all-bin extraction for each band is on Chad's Mac and has been re-hashed there. An independent numpy reduction of every retained extraction reproduces the pane's noon and midnight planes byte for byte. The §6.4 numbers below are what the mask and scale decisions need. **No page build, merge or deployment.** Masks and scales are not frozen. Freezing them waits for GPT's review and Chad's decision.

## 1. What was run

- **Scope.** Chad's line: "Go: D4b. Fetch the remaining 17 Diviner GCP bands with tooling v2 at `83dc53a`, one at a time, with archive-MD5 checks, extraction retained and re-hashed on my Mac, and a durable checkpoint per band. Preserve band 1's original evidence. Then return the §6.4 global report to GPT and me. No page build, merge or deployment."
- **Tooling.** v2 at `83dc53a`:
  - `mehash.js` `85420962…` (unchanged)
  - `gcp_stream.js` `523149df…` (unchanged)
  - `pane_job.js` pane_job-2 `1ca0e93e…`

  The tooling was loaded into the built-in browser pane from `raw.githubusercontent.com` at that commit, and each file's SHA-256 was checked before use (09:59:11 UTC). GPT's v2 recheck (PASS) is filed unchanged as `reviews/2026-11-26-moon-diviner-pane-job-v2-gpt-recheck.md` (SHA-256 `10b097c1…1801421`, matching the Mac original).
- **Order.** One band at a time:
  - 10N–20N … 80N–90N
  - then 10S–00S … 90S–80S
- **Timing (page clock).** From 09:59:17 to 10:14:26 UTC, which is 11:59 to 12:14 SAST. Each new run started only after the previous run's outputs had been exported and ingested.
- **Per band:**
  1. Stream with `getReader`.
  2. Incremental MD5 and SHA-256.
  3. Size check, then a check of the MD5 against the archive list (SAMPLES §6.4 table) before the reduction was accepted.
  4. Strict parse: 1,382,400 records, with exact coordinate sequence anchored to the band identity.
  5. Noon and midnight planes, masks applied.
  6. Extraction (int32 tbol × 10,000, R1 schema).
  7. Planes out as a base64 piece, bound to runId and band, and SHA-checked in the workspace.
  8. Extraction out as a browser download, bound to runId and band, then copied by `ingest.sh` into `Documents/Mother Earth/_source-data/moon-lro-science-diviner-gcp/` and re-hashed there (gzip and raw).
- **Kept sample ranges.** For the five bands with committed samples, the pane hashed those byte ranges as they streamed past. All five equal the committed samples:
  - 70N–80N lon000–009 `c3e13259…`
  - 80N–90N rows0–19199 `9c1de725…`
  - 40S–30S lon000–009 `c3311ad6…`
  - 70S–60S lon000–009 `4a10075e…`
  - 90S–80S lon000–009 `2f99420f…`
- **No retries.** No band needed one. No failure path was triggered in the live run.

## 2. Integrity and retention

| | Result |
|---|---|
| Archive MD5 | 17 of 17 match (plus band 1) |
| Size | 156,211,313 B each |
| Records and coordinates | 1,382,400 each; exact sequence |
| Header | identical in all 18 (`ba58536a…`) |
| `-9998` (invalid) | 0 in all 18 |
| Empty bins (`-9999`) | from 79,210 (80N–90N) to 598,440 (20S–10S) per band; counts in each checkpoint |
| tbol range | 19.39 K (80N–90N) to 439.00 K (10S–00S); all within our 1–450 K bounds |
| Extractions on the Mac | 18 files, 59,945,431 B gzip in total (raw 99,532,800 B); gzip at 52–78% of raw, larger toward the poles where fewer bins are empty |
| Mac re-hash | 18 of 18 OK in `ingest.sh` |
| Independent re-hash | All 18 files were staged from the Mac into the workspace, then re-hashed and decompressed: gzip and raw SHA-256 equal the pane's values |
| Independent reduction | `global_report.py` (numpy, separate code from `gcp_stream.js`) recomputes each band's planes from the retained extraction: **18 of 18 equal the pane planes byte for byte**. The sentinel counts equal the checkpoints. |
| Negative control | One bit flipped in a copy of the 40S–30S planes. The script reports FAIL and exits 1. |
| Index anchors | First source record (−179.75°, 0.25°N) → grid row 179, column 360. 0.25°E, 0.25°N → row 179, column 0. +179.75°, 9.75°N → row 160, column 359. |

Assembled grid digest (int32 noon value, n, range, then midnight; evidence only, not a page file): `1cd629dd3be7…cc9f7b`.

## 3. Checkpoints — one thing to note

`docs/research/moon-lro-science/diviner-acq/checkpoints.jsonl` now has 18 lines:

- **Line 1 (band 00N–10N, v1 tooling `0d5ae9b`, pane_job-1) is byte-identical to the committed original.** The file's SHA-256 at `83dc53a` is `d3676a7b…7907a9`, and the first line of the new file has the same SHA-256.
- Lines 2–18 use the same schema (`diviner-checkpoint-1`) with v2 provenance: commit `83dc53a`, the three file hashes, `pane_job-2`, the runId, the archive MD5, the Mac re-hash, timing and heap.

**Disclosure.** Each band's evidence was durable as soon as that band finished:

- the verified extraction on the Mac, re-hashed by `ingest.sh`
- the status JSON and planes in the workspace, with the planes SHA checked

The JSONL lines themselves were written to the branch in one step after the 17th band. No line was written for a band that had not passed every check, including the Mac re-hash. Recovery from any band would still have been possible from the Mac file and the status record. Strictly, though, the checkpoint file was not appended band by band. If GPT or Chad wants the strict reading for future acquisitions, the fix is procedural: append and push after each band.

## 4. Cost measured

These are single runs on Chad's connection, built-in browser pane.

| | Value |
|---|---|
| Stream time per band | median 29.8 s; slowest 83.9 s (80N–90N, stalled about 40 s and then completed), 59.1 s (10N–20N), 51.9 s (20S–10S) |
| Stream time total, 17 bands | 600 s (632 s including band 1) |
| Wall time, 17 bands | 15 min 09 s, including exports and ingest |
| Downloaded from PDS | 2,655,592,321 B for the 17 (2.81 GB for all 18) |
| JS heap (`usedJSHeapSize`; approximate, JS only) | peak 48.9 MB (60N–70N); start of each run 4–5 MB, except 29.0 MB once (80S–70S, before garbage collection ran). Heap does not grow across bands, so buffers are released between runs. |
| Chunks per band | 2,943–3,514; largest chunk 2.07 MB |

## 5. §6.4 global report

**Grid:** 720 × 360 cells of 0.5°.

**Statistic:** our unweighted mean of the available 15-minute bins:
- noon: bins 46–49 (11:30–12:30)
- midnight: bins 94, 95, 0, 1 (23:30–00:30)

**Masks as currently proposed:**
- noon withheld poleward of 70°
- midnight withheld poleward of 80°

Full output: `docs/research/moon-lro-science/diviner-acq/global_report_output-2026-11-26.txt`.

### 5.1 Global

| | Noon | Midnight |
|---|---|---|
| Withheld (mask) | 57,600 cells (22.22%) | 28,800 (11.11%) |
| Shown | 201,600 | 230,400 |
| No valid data, % of shown | **2,874 (1.43%)** | **1,610 (0.70%)** |
| n = 0 / 1 / 2 / 3 / 4, shown cells | 2,874 / 25,023 / 75,173 / 73,067 / 25,463 | 1,610 / 19,158 / 75,018 / 92,858 / 41,756 |
| n = 1 share of shown | 12.4% | 8.3% |
| Value, valid shown cells: min / median / max | 220.3 / 366.5 / 400.1 K | 46.2 / 96.7 / 149.0 K |
| 1st / 99th percentile | 281.5 / 394.3 K | 70.6 / 104.4 K |
| Range, n ≥ 2: median / p90 / p99 / max | 3 / 9 / 20 / 140 K | 1 / 4 / 10 / 40 K |
| Range capped (≥ 253.5 K) | 0 | 0 |

**Colour scales (proposal §4).** The ends are the 1st and 99th percentiles of valid displayed cells.

- **Noon: 281.5–394.3 K.** If rounded outward to 281–395 K, 0.93% of valid cells are clipped below and 0.43% above.
- **Midnight: 70.6–104.4 K.** If rounded outward to 70–105 K, 0.85% are clipped below and 0.75% above.

At the exact percentiles, the clipped shares are by definition about 1% at each end. Clipped cells keep their exact value in the readout.

To decide: whole-kelvin ends (rounded outward) or the exact percentiles. Recommended: whole kelvin, for a legible legend.

### 5.2 By 10° band (shown cells; masked bands are given without the mask)

**Noon:** no valid %, n = 0/1/2/3/4 %, median K, range median / p90 / p99 / max K

| Band | No valid | n 0/1/2/3/4 | Median | Range |
|---|---|---|---|---|
| 80–90N | *withheld* (0.00) | 0.0/1.1/2.5/11.3/85.0 | 196.1 | 20 / 60 / 119 / 187 |
| 70–80N | *withheld* (0.06) | 0.1/0.6/8.5/37.1/53.8 | 264.4 | 13 / 23 / 57 / 166 |
| 60–70N | 0.29 | 0.3/5.4/24.5/36.7/33.1 | 301.8 | 9 / 15 / 31 / 140 |
| 50–60N | 3.28 | 3.3/10.3/32.8/39.9/13.7 | 329.4 | 7 / 11 / 19 / 98 |
| 40–50N | **3.92** | 3.9/13.8/37.6/37.7/7.0 | 350.6 | 5 / 9 / 15 / 61 |
| 30–40N | 1.94 | 1.9/18.7/44.9/29.4/5.0 | 366.5 | 3 / 7 / 13 / 28 |
| 20–30N | 1.31 | 1.3/19.0/46.7/27.4/5.6 | 378.2 | 3 / 6 / 10 / 31 |
| 10–20N | 1.10 | 1.1/**20.4**/43.4/28.3/6.8 | 386.4 | 3 / 5 / 8 / 27 |
| 0–10N | 0.85 | 0.8/15.4/42.8/32.7/8.2 | 390.2 | 2 / 4 / 7 / 30 |
| 10S–0 | 1.00 | 1.0/12.1/39.4/37.8/9.7 | 390.1 | 2 / 4 / 7 / 28 |
| 20–10S | 1.36 | 1.4/13.0/37.4/37.4/10.9 | 386.0 | 2 / 4 / 8 / 28 |
| 30–20S | 1.26 | 1.3/13.0/37.3/37.0/11.4 | 378.1 | 2 / 5 / 10 / 35 |
| 40–30S | 1.27 | 1.3/11.8/38.6/37.0/11.4 | 366.4 | 2 / 6 / 13 / 35 |
| 50–40S | 1.55 | 1.5/9.5/38.8/37.7/12.5 | 351.0 | 3 / 8 / 17 / 57 |
| 60–50S | 0.59 | 0.6/7.7/33.1/41.9/16.8 | 330.5 | 5 / 11 / 24 / 89 |
| 70–60S | 0.22 | 0.2/3.5/24.9/46.6/24.7 | 302.6 | 7 / 16 / 38 / 137 |
| 80–70S | *withheld* (0.06) | 0.1/2.7/22.6/46.5/28.1 | 266.0 | 11 / 27 / 73 / 167 |
| 90–80S | *withheld* (0.03) | 0.0/0.8/6.7/14.4/78.1 | 199.1 | 22 / 76 / 131 / 183 |

**Midnight:**

| Band | No valid | n 0/1/2/3/4 | Median | Range |
|---|---|---|---|---|
| 80–90N | *withheld* (0.01) | 0.0/0.3/4.9/11.3/83.5 | 65.1 | 6 / 16 / 52 / 95 |
| 70–80N | 0.01 | 0.0/2.0/15.3/46.7/36.0 | 78.1 | 4 / 7 / 14 / 38 |
| 60–70N | 0.01 | 0.0/0.6/12.2/48.1/39.1 | 86.0 | 2 / 4 / 8 / 23 |
| 50–60N | 0.01 | 0.0/1.7/17.5/48.4/32.4 | 91.2 | 2 / 4 / 7 / 30 |
| 40–50N | 0.34 | 0.3/4.6/23.3/47.2/24.6 | 95.2 | 2 / 3 / 7 / 27 |
| 30–40N | 0.35 | 0.3/6.3/29.7/46.2/17.5 | 97.9 | 1 / 2 / 5 / 33 |
| 20–30N | 0.74 | 0.7/9.4/32.2/43.4/14.2 | 99.8 | 1 / 2 / 5 / 26 |
| 10–20N | 0.74 | 0.7/10.2/36.5/40.5/12.1 | 100.8 | 1 / 2 / 7 / 35 |
| 0–10N | 0.34 | 0.3/8.9/40.7/40.1/10.0 | 101.4 | 1 / 2 / 6 / 33 |
| 10S–0 | 0.51 | 0.5/11.0/46.5/34.5/7.6 | 101.3 | 1 / 2 / 5 / 31 |
| 20–10S | 0.58 | 0.6/16.5/47.0/28.9/7.1 | 100.4 | 1 / 2 / 5 / 33 |
| 30–20S | 0.85 | 0.9/**17.6**/49.0/27.2/5.4 | 99.4 | 1 / 2 / 5 / 23 |
| 40–30S | 1.10 | 1.1/16.5/48.1/29.5/4.8 | 97.6 | 1 / 2 / 5 / 23 |
| 50–40S | **3.26** | 3.3/13.0/41.0/36.3/6.5 | 95.1 | 1 / 3 / 6 / 22 |
| 60–50S | 2.22 | 2.2/10.3/36.7/38.8/11.9 | 91.1 | 1 / 3 / 7 / 35 |
| 70–60S | 0.11 | 0.1/3.8/28.2/40.6/27.3 | 85.9 | 2 / 4 / 9 / 32 |
| 80–70S | 0.00 | 0.0/0.7/17.2/48.5/33.6 | 78.4 | 3 / 8 / 17 / 40 |
| 90–80S | *withheld* (0.00) | 0.0/2.7/6.7/14.6/76.0 | 66.1 | 6 / 17 / 82 / 187 |

### 5.3 Around the mask limits (5° rows, computed without the mask)

Each figure is range median / p90.

| | Equatorward of the limit | Poleward of the limit |
|---|---|---|
| Noon N (70°) | 60–65°: 8 / 13 K · 65–70°: 10 / 16 K | 70–75°: 12 / 20 K · 75–80°: 15 / 25 K |
| Noon S (70°) | 60–65°: 6 / 14 K · 65–70°: 7 / 17 K | 70–75°: 10 / 21 K · 75–80°: 13 / 32 K |
| Midnight N (80°) | 70–75°: 3 / 6 K · 75–80°: 4 / 8 K | 80–85°: 5 / 10 K · 85–90°: 6 / 27 K |
| Midnight S (80°) | 70–75°: 3 / 6 K · 75–80°: 4 / 9 K | 80–85°: 6 / 12 K · 85–90°: 7 / 29 K |

## 6. What the numbers say for the open decisions

1. **The coverage concern is settled.** No-valid-data is 1.4% of shown noon cells and 0.7% of shown midnight cells. It is highest at noon at 40–60°N (3–4%) and at midnight at 50–60°S (2–3%). A near-complete map is supported for both modes. The no-data style and the "no value in these bins" readout stay as proposed.
2. **n = 1 is common enough that it must stay in the readout.** It reaches 20% of noon cells at 10–20°N, and 17–18% of midnight cells at 20–40°S. The readout already shows "from 1 of 4 bins" with no range. No change is proposed.
3. **The noon range is small where noon is shown,** but it grows steadily with latitude:
   - low latitudes: p99 7–10 K
   - 60–70°: p99 31–38 K, max 137–140 K

   There is no step at 70°. Poleward of 70° it keeps growing (p99 57–73 K at 70–80°, 119–131 K at 80–90°), and the median at 80–90° is 20–22 K. The 70° noon limit is therefore a **display choice along a smooth gradient**, as rev 2 already says; it is not a data cliff. The numbers support keeping it at 70°. A limit at 60° would hide cells whose spread is still moderate (60–65°: p90 13–14 K); 80° would show cells whose noon window spans tens of kelvin.
4. **Midnight is tight up to 80°** (70–80°: p99 14–17 K). At 80–90° the median is still only 6 K, but the tail is long (p99 52–82 K, max 95–187 K). Keeping 80° is consistent with these numbers.
5. **Range cap.** No cell reaches 253.5 K, so the cap is never hit.
6. **Scales.** Proposed: noon 281–395 K and midnight 70–105 K (whole kelvin, rounded outward), with clipped shares of 0.93% / 0.43% (noon) and 0.85% / 0.75% (midnight) stated in Sources. The noon maximum of 400.1 K is well below our 450 K bound.

## 7. Files (branch `moon-diviner-trial`)

- `phase1/moonsci/diviner/global_report.py`: independent reduction, assembly and §6.4 statistics. Needs numpy; run with Python 3.13.18 and numpy 2.5.3.
- `docs/research/moon-lro-science/diviner-acq/global_report_output-2026-11-26.txt`: its output (PASS).
- `docs/research/moon-lro-science/diviner-acq/checkpoints.jsonl`: 18 lines; line 1 is unchanged.
- `reviews/2026-11-26-moon-diviner-pane-job-v2-gpt-recheck.md`: GPT's recheck, filed unchanged.
- This report.

The retained extractions stay on the Mac only. Nothing binary is committed.

## 8. Still open before any page build

- Chad's decisions on the masks and scales (§6), after GPT's review.
- Claude's own read of Powell et al. 2023 §2.4–2.5. So far it has been cited from GPT's read only.
- The page build itself (`moon-diviner-ui`) needs its own go. Merging and deploying need Chad's own Approve line naming the commit.
