# Stage B observation 3 (quiet), 21 Nov 2026

Hub 0.6.21 as deployed: sha256 `2028e2daec92591d781e4f6289224c5e7c74fd16addfada62f6b6fc7359301c3` (532,761 bytes),
Cloudflare version `030f8d76-f40e-4301-a21f-f69ada9d6a3a`. Chad's Approve line: window start 2026-11-21T20:21:30Z, 60 s.
Script started by Chad 15:40:18 UTC (claim).

## The call

| | |
|---|---|
| Called / answered (script's clock) | 20:21:31Z / 20:21:44Z, curl exit 0, HTTP 200, one attempt |
| Saved answer | `observation-3.json`, 1,350 bytes, sha256 `2621fe715bd9142997cbf7230b539e8c99e812b1123f3af6bed51633145b10e9` (as on the Mac) |
| Attempt, build | `9eb5793ca9f0`, `stage-b-1` |
| Outcome | **validated**; `deadline_hit` false; run 11,342 ms |
| Requests to EUMETSAT | 3 |
| Frame | 2026-11-21T20:00:00Z (night side); both responses usable; **both headers name 20:00:00Z** |
| Picture / check image | 545,873 bytes sha256 `aaf0b073…2aa4` / 118,810 bytes sha256 `5ae4f245…c209` |
| Validation figures | agreement 0.9715; worst surround difference 3 (tolerance 16); 10 scans, progressive |
| Isolate | `4695281c`, started 20:07:17.755Z, age 855 s, 4 requests served before, 0 scheduled runs, 0 validations before: a reused isolate, a third different one, first validation in it |

## Cloudflare's record (requestId `191998875e33010c266e2ca4c290e085`)

POST, response 200, **outcome `ok`, CPU 820 ms, wall 12,173 ms**, logged 20:21:43.673Z. Five probe lines under the same
requestId with the same attempt id. Authorization stored as eight asterisks. Validation start and end the same instant
(the clock limit, `observation-1.md`).

## Hub over the assessment interval, 20:11:32Z to 20:51:44Z (read 20:56:50Z)

- 83 invocations: 70 fetch, 8 five-minute, 3 quarter-hour, 2 forest. **Every outcome `ok`.** No `exceededMemory`, no
  `exceededCpu`, no error-level log. Highest CPU: the probe 820 ms, then the quarter-hour job 535 ms.
- **Overlap with the run (20:21:31.5 to 20:21:43.7): none.** Nearest: five-minute job 20:20:07 (4.1 s) before, 20:25:07 after.
- Storage: no object under `earthview/`. No `EARTHVIEW_ENABLED`. Hub 0.6.21, last deployment still 06:08:56 UTC.
- `/status` before (20:13:40Z) and after (20:56:52Z): every layer `ok` in both except `ships`, and the two old parked rows.
  `ships` was `down` before the interval opened (20:07:02Z; the Mac collector's log: `connect-timeout … opened=false` at
  20:07:01Z) and is `degraded` at 20:38:05Z with HTTP 200: a sample that DID arrive and was stored (2,851 vessels), which
  the Mac collector itself marked low-flow from its source (`ships: outcome=low-flow after=60.1s opened=true confirmed=true
  messages=2882`). A recovery from the earlier failure, with the Mac's own measurement of the source as the independent
  evidence. Recorded as unrelated; no new failure of a hub-fetched layer in the interval.

## Reading by proposal rev 2.1 section 4

Saved answer, log lines, exact invocation record with outcome `ok` and CPU 820 ms, both headers naming the requested time,
validation passed, `deadline_hit` false, health reads before and after: all present. No not-met condition observed.
**Observation 3: complete.**

Files: `observation-3.json`, `observation-3-before.json`, `observation-3-record-and-after.json`.
