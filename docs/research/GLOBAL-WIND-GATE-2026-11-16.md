# Global Wind — first gate result (16 Nov 2026)

Research only, read-only. No hub change, nothing built into the page. Run on Chad's line: "Go: Global Wind first gate per GLOBAL-WIND-PROPOSAL rev 2 §11.5 (research only, read-only; no hub change)".
Written 08:47 UTC (clock reading). Proposal: `docs/concepts/GLOBAL-WIND-PROPOSAL.md` rev 2 §11.5. Files: `docs/research/global-wind-gate/`.

**Result: all three parts pass on one real run. The candidate decoder matched the reference on every value.** What the gate did not test is in §6.

## 1. Fetch (§11.5 step 1) — pass

- **Route:** Chad's Chrome, a page on the mirror's own origin (`noaa-gfs-bdp-pds.s3.amazonaws.com`), 08:42:07–08:42:16 UTC. Claude's workspace and the Mac shell were both refused by their network allowlists (403, 08:41 UTC), so neither could be used.
- **Pinned object:** `gfs.20261116/00/atmos/gfs.t00z.pgrb2.0p25.f000`, 500,418,863 bytes, Last-Modified 16 Nov 03:48:31 GMT, ETag `e85c7642b26561940fb3e795dd04348e`. Index: 31,816 bytes, 696 lines, sha256 `ffc4e74b…b146`.
- **Six range requests, one host.** Each: one index match, `206`, `Content-Range` equal to the range asked, length as expected, same ETag as the object, starts `GRIB`, ends `7777`.

| Field | Level | Bytes | Time | sha256 (start) |
|---|---|---|---|---|
| UGRD | 10 m above ground | 959,584 | 1.46 s | 10b5602745b7 |
| VGRD | 10 m above ground | 942,176 | 1.21 s | e7ec0160867f |
| UGRD | 250 mb | 587,676 | 0.44 s | 7d1db1dea9e3 |
| VGRD | 250 mb | 595,021 | 0.51 s | b84f60e543c9 |
| UGRD | 10 mb | 491,358 | 0.44 s | 83ff8d385f24 |
| VGRD | 10 mb | 454,997 | 0.49 s | 0d1261163e81 |

- **Total 4,030,812 bytes.** Times are from a home connection in Cape Town, not from the hub.
- The bytes reached Claude's workspace as one file saved from the tab to Chad's Downloads (with his yes) and staged; the six sha256 values were recomputed there and match.
- The NOAA 0.25° filter was not tried; the mirror did not fail.

## 2. What the six messages are (read with ecCodes 2.50.0)

Same for all six: edition 2; regular lat/lon grid, 1440 × 721, 90°N to 90°S, 0° to 359.75°E, 0.25° steps; scanning mode 0 (west to east, north to south, by rows); resolution and component flags 48, so **u and v are Earth-relative (east, north)**; reference time 16 Nov 2026 00:00 UTC, forecast time 0, generating process "forecast" (2); units m/s; **data template 5.3: complex packing with second-order spatial differencing**; no bitmap; missing-value management 0; no missing values. Decimal scale 2 at 10 m (0.01 m/s steps), 1 at 250 and 10 hPa (0.1 m/s steps).

## 3. Decode (§11.5 step 2) — pass

- **Candidate:** `global-wind-gate/gribwind.mjs`, 117 lines, no dependencies, plain JavaScript of the kind a Worker runs. sha256 `faf26812…8831`.
- **Compared with ecCodes on every native-grid value:** 6 × 1,038,240 values. **Largest difference 0 in all six** (stated tolerance 1e-6 m/s; none over). No missing mask exists in these messages; the decoder refuses a message that has one.
- **Refusals (each a clear named error, nothing decoded):** message cut to half; 1,000 bytes cut with the length and end marker repaired; data template changed to 5.0 and to 5.40; missing-value management 1; differencing order 1; scanning mode 64; components flagged grid-relative; bitmap flagged present; edition 1. Full text in `gate-output.txt`.
- **Cost, Node 22 in Claude's workspace (not a Worker):** 21–70 ms CPU a message. One message at a time, keeping only the 1° samples: about 290 ms CPU for all six including the reduction; process memory rose from 38 MB to 72–75 MB at peak; typed-array memory peaked at 18 MB. Cloudflare's limits as GPT cited them: 128 MB, 30 s CPU.

## 4. Exported grids (§11.5 step 3) — pass

- **Method tested:** the model's own value at each whole degree (every fourth point each way). Components first; speed and direction after. No averaging. Box averaging was not tested.
- **Three grids, 360 × 181, two signed 16-bit values a cell, 0.1 m/s:** 260,640 bytes each.
- **Against the reference over all 3 × 65,160 cells:** largest difference 0.0488 m/s (the rounding limit is 0.05).
- **Real vectors** read correctly at Cape Town, North Atlantic, Tokyo, Southern Ocean, the date line and one degree either side, the 0° seam and the last column (359°E), 89°N, 89°S and both poles. Table in `gate-output.txt`. Example, Cape Town cell (34°S 18°E), 00:00 UTC: near ground "From south (158°), 43 km/h"; 250 hPa "From south-west (245°), 141 km/h"; 10 hPa "From east (71°), 27 km/h".
- **Made-up vectors:** eastward reads "From west (270°)", arrow heads 90°; northward reads "From south (180°)", arrow heads 0°; 0.2 m/s reads "calm"; at an exact pole, speed only.
- **Pole rows:** across the 1,440 longitudes of each pole row the speed varies by at most 0.13 m/s, so a single pole speed is sound.

## 5. Arrival sample (§11.5 step 4)

**What the timestamp is:** the mirror's Last-Modified for its copy of the whole file. It is not NOAA's own publication time and not a measured time at which the six fields could first be retrieved.

| Run | Mirror file written (UTC) | After the run's named time |
|---|---|---|
| 15 Nov 06 | 09:32:15 | 3 h 32 min |
| 15 Nov 12 | 15:33:31 | 3 h 34 min |
| 15 Nov 18 | 21:33:42 | 3 h 34 min |
| 16 Nov 00 | 03:48:31 | 3 h 49 min |

At 08:42:16 UTC the 16 Nov 06 run's index returned 404. Four runs are a first sample only; no stale line is proposed from them.

## 6. Not tested by this gate

- **The hub.** Whether a Cloudflare Worker can reach the mirror, and the decoder's CPU and memory inside a Worker. Needs the later read-only Worker check.
- **Other runs.** One run only. A run with a different packing, a bitmap or missing values would be refused, not decoded; how often that happens is unknown.
- **Complete-run availability over several days** (proposal §11.3).
- **Reuse terms** for GFS output and for the mirror. Not read.
- **The reduction method as a display choice.** Point sampling was proved correct, not shown to look better or worse than averaging.
- **Anything on the page:** colour scale, arrows, frame rate, wording.

## 7. Question the gate was to answer

Whether the decoder goes forward to a private preview. The evidence supports yes. The decision is Chad's, after GPT's review.

## 8. GPT's review of the result (relayed by Chad, 16 Nov) and the hardening fix — written 08:52 UTC (clock reading)

GPT: carry the decoder forward as a private-preview candidate; run a read-only Worker reach-and-cost probe before any collector or layer is built. GPT reran the decoder on the Mac's copy of the run: six hashes matched, all values finite, each field's minimum, maximum and mean matched the saved ecCodes figures, and the 0.0488 m/s export rounding was reproduced. The point-by-point comparison in §3 is Claude's alone.

**Two gaps GPT found by changing a real message, both confirmed and closed:**
- A corrupt packing reference value was accepted and gave not-a-number values. Now refused: "packing reference value is not a finite number".
- A grid whose first latitude was 123° was accepted. Now refused: "grid la1 is 123, expected 90".

**Decoder rev 2** (`gribwind.mjs`, 156 lines, sha256 `f1bd75e6…9e75`):
- The grid must be exactly the global 0.25° grid (1440 × 721, 90 to −90, 0 to 359.75, 0.25 steps).
- Sizes and the group count are bounded before any array is made (the group fields must fit in the data section).
- Refused: a non-finite reference value; a binary scale beyond ±30; a decimal scale outside 0–6; any decoded value that is not finite or is beyond 500 m/s (Claude's bound, added beyond GPT's list: a finite but absurd value would otherwise pass).
- `decodeWindBatch()` requires exactly six messages, in the fixed order, each the expected parameter and level, forecast time 0, all from the stated run.

**Rerun on the same bytes:** all six still match ecCodes with a largest difference of 0; export unchanged (same three grid hashes). **25 refusals, none accepted:** the first ten; GPT's two; +Infinity reference; an absurd finite reference; scale factors; Ni changed; longitude step changed; group count set to the number of points; a batch of five; a field given twice; levels swapped; the wrong run expected; one message relabelled as another run; one relabelled as a 3-hour forecast. One of Claude's own new tests first changed nothing (it wrote the value already there) and was corrected. Full text: `gate-output.txt`.

## 9. The read-only Worker probe, as prepared (not deployed; needs Chad's own Approve line)

- **File:** `global-wind-gate/probe-worker.mjs` (the decoder plus `probe-handler.part.mjs`; built by `build-probe.sh`). It is a separate, temporary Worker. No bindings, no schedule, no storage, no change to the hub `mother-earth`, R2, D1 or the page.
- **What one request does:** for one run, reads the index, then six range requests to one host; each response is checked (status `206`, exact `Content-Range`, exact length, same ETag) **before** its body is read, and refused otherwise; one field decoded at a time with no forced garbage collection; three 1° grids made; hashes and wall times returned as JSON.
- **Pass:** for run 2026111600 the three grid hashes equal the workspace's (`515452c6…`, `5e37bfa3…`, `cf721ec0…`) and the six message hashes equal §1's.
- **CPU and memory:** a Worker cannot read its own CPU time; it comes from the invocation log (`$workers.cpuTimeMs`, `wallTimeMs`, `outcome`; START-HERE §4a). The runtime gives no memory figure; the evidence is the outcome (an over-limit run is reported as such).
- **Guard:** the probe refuses to run after a fixed time written into the file, and the Worker is deleted after the result is read.
- **Checked in the workspace with the network replaced by the saved bytes** (`probe-local.mjs`): same three grid hashes; a full `200`, a wrong range and a changed ETag are each refused before the body is used.
