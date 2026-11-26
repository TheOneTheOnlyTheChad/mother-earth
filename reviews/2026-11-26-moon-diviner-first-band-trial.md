# Moon Diviner — first-band trial (00N–10N): report

26 Nov 2026, 09:40 UTC (clock reading) · Claude · **D4a only**, on Chad's go of 26 Nov. Branch `moon-diviner-trial` (tooling and evidence; **not for merge**). No page change, no merge, no deployment, no hub change. The other 17 bands have **not** been fetched.

**Chad's decisions (26 Nov):** accept D1, D2, D3, D5, D6 and D7 with GPT's notes; D8 (a), retain the lossless all-bin `tbol` extraction on the Mac, with browser downloads approved if supported; go for D4a only. GPT's rev 2 recheck (PASS for this trial, five implementation notes) is filed unchanged as `reviews/2026-11-26-moon-diviner-proposal-rev2-gpt-recheck.md`.

## 0. Result

**PASS.**
- **Archive checksum:** the band file's MD5 matches the archive's list.
- **Sample bytes:** the two byte ranges that are our committed samples hash to the samples' SHA-256s, so they are byte-identical.
- **Strict parse:** every record passed (exact coordinates against the band's identity, exact sentinels, plausibility bounds).
- **Independent reference:** the reduction and the extraction equal the Python reference on both sample patches: 38,400 extraction values, and 400 cells × 2 windows with identical codes.
- **Stored on the Mac:** the extraction is in the designated source-data folder, and its re-read hashes match.
- **Measured:** 32.1 s to stream 156 MB; peak JS heap 41.9 MB; extraction 2.89 MB gzip.

## 1. What ran

| Step | Detail |
|---|---|
| Tooling | `phase1/moonsci/diviner/` on the branch at `0d5ae9b`: `mehash.js` (incremental MD5 and SHA-256, `85420962f50191ffa35be5f76cb49b4177c26a29387f31666a64fb40a4f99dd8`), `gcp_stream.js` (streaming parser, reducer, extractor, `523149df9db5dfd39ba3baa5e76efdd834859fa7165266bf409fdb9dc2941fb9`), `pane_job.js` (pane job, `d541245d8658eb27dff21497a59511e1225f48bdcc872651eb0ac2a89d229ba6`) (full hashes; rev 1 of this report abbreviated the `gcp_stream.js` hash wrongly, as GPT pointed out), `diviner_ref.py` (independent Python reference), `test_mehash.cjs`, `test_gcp_stream.cjs`, `trial_compare.py`; extraction schema `docs/research/moon-lro-science/diviner-acq/EXTRACTION-SCHEMA.md` |
| Tests before the fetch (Node 22, workspace) | `test_mehash.cjs`: **466 passed, 0 failed** (RFC 1321 and FIPS 180-4 vectors; one million 'a' in uneven chunks; every length 0–200 with random chunking and empty chunks; 3 MB random data in chunks of 1, 63, 64, 65, 113, 4096, 65536, 65537 and 1 MiB; all 16 sample files; misuse refused). A deliberately broken copy (one constant changed) fails 433 checks. `test_gcp_stream.cjs`: **165 passed, 0 failed** (seven sample patches in five chunkings each, equal to `diviner_ref.py` cell for cell and byte for byte; integer rounding and range-cap boundaries; 14 deliberate breaks refused, including a five-decimal value, a changed channel field, an extra record and a wrong band identity; header split and CRLF) |
| Loading in the pane | The three JS files were fetched from `raw.githubusercontent.com` at commit `0d5ae9b`, and each one's SHA-256 was checked before it ran. Self-test in the pane: MD5 and SHA-256 of "abc" correct, the latter fed in three chunks including an empty one |
| Fetch | `…/data_derived_gcp/global_cumul_avg_cyl_00n10n_002.tab`, `cache: 'no-store'`, one request, read with `getReader()`; each chunk went to MD5, SHA-256 and the parser, and two sample-sized byte ranges were copied aside. No whole-file buffer and no whole-file text decoding |
| Output | The extraction (Int32 × 10000, little-endian, source order) and the band's two-window planes (rev 2 §6.2 codes, page order, 20 rows × 720 columns) |
| Storage | The extraction went out by **browser download** (Chad's approval) into `~/Downloads`, was copied by the Mac shell into `Documents/Mother Earth/_source-data/moon-lro-science-diviner-gcp/` and re-hashed there. The 115,200 B planes came to the workspace as one base64 piece (§4) |
| Comparison | `trial_compare.py`: output `docs/research/moon-lro-science/diviner-acq/trial_compare_output-00n10n.txt` |
| Checkpoint | `docs/research/moon-lro-science/diviner-acq/checkpoints.jsonl`, line 1 (band `00n10n`, status `complete`) |

## 2. Integrity and structure (measured)

| Check | Result |
|---|---|
| HTTP | 200, `Content-Length` 156,211,313, `Last-Modified` Wed, 15 Mar 2017 20:33:42 GMT, `text/plain` |
| Bytes | 156,211,313 = expected |
| MD5 | `0044e6df5344775442241afb8e1a6e66` = archive list entry |
| SHA-256 (source) | `d333fc13b605beff4d977bd78299d3dd4c98905ea9008f69f4ee45073d7bedea` |
| Header line | 113 B ending CRLF: `   clon,   clat,   ltim,        t3, …,      tbol`, sha256 `ba58536a…c876` |
| Records | 1,382,400 = expected. Every record: 113 B with CRLF; 11 numeric fields; longitude, latitude and local time equal to the band's expected sequence as exact decimals (local time to 0.125 + 0.25k printed to 2 decimals) |
| Sentinels | `-9999` (empty) 588,791 (42.6%); `-9998` (invalid) 0; no other negative or non-finite value |
| `tbol` | 87.3290 – 405.1021 K, inside the 1–450 K plausibility bounds |
| Sample byte ranges | bytes 113–2,169,712 → `b1f930da…ba97` = `gcp_00n10n_rows0-19199.tab`; bytes 78,105,713–80,275,312 → `c6389c55…b54f` = `gcp_00n10n_lon000-009.tab`. **Byte-identical to the committed samples** |

## 3. Comparison with the samples (measured; `trial_compare.py` PASS)

- **Extraction:** longitudes 0–9 (179.75°W–175.25°W) and 360–369 (0.25°E–4.75°E) equal `diviner_ref.py`'s extraction of the two sample files: 2 × 19,200 values, identical.
- **Codes:** all 2 × 200 cells, noon and midnight (value, n, range), equal the reference.
- **Mapping:** the reference cells are located by the page mapping (−179.75 → column 360; 0.25°E → column 0; row 0 = 9.75°N). A deliberately wrong column mapping makes the comparison fail (tested).
- **§6.3 consistency rules** hold on all 14,400 cells of the band for both windows.

**This band's own figures** (measured, 00N–10N only; this is not the global report of §6.4):

| | Noon (11:30–12:30) | Midnight (23:30–00:30) |
|---|---|---|
| Cells with n = 0 / 1 / 2 / 3 / 4 | 122 / 2,215 / 6,167 / 4,715 / 1,181 | 49 / 1,286 / 5,858 / 5,771 / 1,436 |
| No valid data | 122 cells (0.85%) | 49 cells (0.34%) |
| Values | 378.0–397.2 K (1st/99th pct 383.6 / 395.6) | 96.5–137.4 K (1st/99th pct 99.6 / 107.3) |
| Range for n ≥ 2 | median 2 K, 99th pct 7 K, max 30 K, none capped | median 1 K, 99th pct 6 K, max 33 K, none capped |

**New against the samples:** the sampled patches had no empty midnight cell, but **the whole band has 49 (0.34%)**, and 122 noon cells (0.85%). The distribution by latitude row is in the output file. This is why the global report (§6.4) comes before the masks and scales are frozen.

## 4. Timing, memory, route (measured, with their limits)

| Item | Value |
|---|---|
| Stream time | 32,124 ms for 156,211,313 B, **4.86 MB/s** (one run; Chad's connection; 3,249 chunks, largest 1,704,062 B) |
| Reduce, hashes and gzip after the stream | 161 ms (total 32,285 ms) |
| JS heap (`performance.memory.usedJSHeapSize`) | start 0.8 MB, **max 41.9 MB**, end 29.7 MB (it still holds the extraction, its gzip, the two kept ranges and the planes). Chromium's JS heap only, sampled every 64 chunks; **not** total process, network-buffer or GPU memory |
| Clock | started 09:36:05.826 UTC (page clock; HTTP `Date` 09:36:05 GMT), finished 09:36:38.112 UTC |
| Extraction | 5,529,600 B raw → **2,886,891 B gzip (0.522)** |
| Browser download | **The first download arrived** in `~/Downloads` (2,886,891 B, hash matched). **The second, started straight after in the same script (the 115 KB planes), did not arrive.** This is consistent with browsers blocking several automatic downloads from one page. It was moved by a base64 piece instead. For later bands: one download per band, with its arrival checked before the next, and base64 pieces (about 6 per band) as the fallback |
| Leftover | A copy of the extraction stays in `~/Downloads`: the Mac shell copies but cannot delete without Chad's permission. Chad may delete it; the retained copy is the one in `_source-data` |

## 5. Estimates for D4b (estimated, not measured)

- **Time for the other 17 bands:** about 9 min at this run's 4.86 MB/s. About 15–35 min at the slower rates measured earlier (1.25–2.93 MB/s), plus any stalls.
- **Extraction for all 18 bands:** about 52–76 MB gzip. This band compressed to 0.522; the polar sample patches compressed to 0.71–0.78, so polar bands will be larger.
- **JS heap:** about the same per band (one band at a time, buffers released between bands). To be confirmed by measurement.

## 6. Deviations and limits

- **The band planes went out by base64, not download** (the second download did not arrive). There is no effect on the data: the hashes match.
- **One run:** the timing and heap figures are one sample each.
- **Not yet read by Claude:** Powell et al. 2023 §2.4–2.5 (GPT's read). It is needed before the page build, not for this trial (GPT's recheck says the same).
- **Not touched:** main's page files, the served manifest, Animals pins, the hub, R2, D1, collectors.
- **Carried for the page build (GPT rev 2 recheck notes 1–2):** the range-cap wording "at least 253.5 K (display capped)"; cancelling a pending request when science mode is switched off; restoring the radio label after a failed noon/midnight change.

## 7. Next (Chad's decision)

**D4b:** fetch the other 17 bands with the same tooling, one at a time. Each band gets its MD5 check, strict parse, extraction download (fallback: base64), Mac re-hash and checkpoint line. Then the §6.4 global report goes to Chad and GPT, before any preview build.

A ready line, if Chad and GPT accept this report:

> Go: D4b. Fetch the remaining 17 Diviner GCP bands with the trial tooling at `0d5ae9b`, one at a time, with archive-MD5 checks, extraction retained on my Mac and a checkpoint per band. Then return the §6.4 global report to GPT and me. No page build, merge or deployment.

## 8. Addendum (26 Nov, 09:53 UTC clock reading): GPT's review and the pane-job fix

- **GPT's review** is filed unchanged as `reviews/2026-11-26-moon-diviner-first-band-trial-gpt-review.md` (sha256 `74dd5fe5…9b43`).
  - **The first-band data and numerical result: PASS.** GPT independently re-read the retained extraction and matched all 38,400 sampled values. It rebuilt all 28,800 noon/midnight cell results from the extraction and reproduced the plane SHA-256. Both test suites pass on its side (468 hashing checks with 17 discoverable sample files).
  - **D4b: HOLD** for one tooling safeguard.
- **The fault (GPT's finding, reproduced by Claude):** pane_job-1 assigned the outputs before deciding between `done` and `integrity-failed`, and its exports did not check the phase. So a wrong-MD5 run could still be downloaded. And after a later run failed early, the previous band's outputs could be exported under the new band's file name. The trial run itself passed every check, so its evidence is unaffected.
- **The fix: pane_job-2** on this branch (`pane_job.js` `1ca0e93e…1601`):
  - each run is cleared and identified
  - integrity is checked before any reduction
  - failures keep nothing and cancel the stream
  - exports require the current verified run and band
  - **56 job-level tests** (`test_pane_job.cjs`) pass
  - versions and changes are recorded in `docs/research/moon-lro-science/diviner-acq/TOOLING.md`
- **Band 00n10n's checkpoint line and evidence are unchanged** (made with v1, `0d5ae9b`). No new download was made.
- **The ready line in §7 is superseded:** D4b would use v2. See the new line in the reply to Chad, after GPT's recheck.
