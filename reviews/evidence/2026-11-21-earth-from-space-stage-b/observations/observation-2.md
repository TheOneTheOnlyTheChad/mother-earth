# Stage B observation 2 (timed for the busy period), 21 Nov 2026

Hub 0.6.21 as deployed: sha256 `2028e2daec92591d781e4f6289224c5e7c74fd16addfada62f6b6fc7359301c3` (532,761 bytes),
Cloudflare version `030f8d76-f40e-4301-a21f-f69ada9d6a3a`. Chad's Approve line: window start 2026-11-21T16:07:40Z, 30 s.
Script started by Chad 15:40:00 UTC (claim), after the first record's Authorization value had been read as masked.

## The call

| | |
|---|---|
| Called / answered (script's clock) | 16:07:40Z / 16:07:53Z, curl exit 0, HTTP 200, one attempt |
| Saved answer | `observation-2.json`, 1,352 bytes, sha256 `4637a3c56f35a20e4dd59320714ea40ed6167ddecd963684350ace2980a5dbd8` (as on the Mac) |
| Attempt, build | `ed4f6dd61adf`, `stage-b-1` |
| Outcome | **validated**; `deadline_hit` false; run 12,771 ms |
| Requests to EUMETSAT | 3 |
| Frame | 2026-11-21T15:40:00Z; both responses usable; **both headers name 15:40:00Z** |
| Picture / check image | 665,348 bytes sha256 `e6bce0ea…b206` / 132,509 bytes sha256 `d44dabcb…c195` |
| Validation figures | agreement 0.9436; worst surround difference 3.6 (tolerance 16); 10 scans, progressive |
| Isolate | `d788bc14`, started 15:56:21.790Z, age 679 s, 4 requests served before, 0 scheduled runs, 0 validations before: a reused isolate, **a different one from observation 1's**, first validation in it |

## Cloudflare's record (requestId `25f1d221d1074cf987531a848c06a47a`)

POST, response 200, **outcome `ok`, CPU 587 ms, wall 13,373 ms**, logged 16:07:53.417Z. Five probe lines under the same
requestId with the same attempt id. Authorization stored as eight asterisks. Validation start and end again the same
instant (the clock limit described in `observation-1.md`).

## THE BUSY PERIOD WAS MISSED BY FIVE SECONDS

The run occupied 16:07:40.0 to 16:07:53.4. The heavy hourly job was scheduled at **16:07:58** and ran to about 16:08:18
(outcome `ok`, CPU 814 ms, wall 19,950 ms). EUMETSAT answered quickly, the run was over 4.6 s before the job began, and
**nothing of the hub's scheduled work overlapped it**. The only invocation crossing the run was a one-millisecond
`HEAD /health/test/firms` at 16:07:44.4 (CPU 0).

As the rule requires, this is reported as it is: **an observation timed for a busy period that overlapped nothing.** It is
a second quiet observation. Whether the validation coexists with the hub's heaviest regular work was **not observed**.
It is not replaced.

Why the timing failed: the window was set so the probe's fetches would still be running at 16:07:59, on the Stage A run
lengths of 5 to 30 s. A run of 13 s started at the first second of its window ended too early. A start a few seconds
AFTER the job's scheduled second would have been the surer design.

## Hub over the assessment interval, 15:57:40Z to 16:37:53Z (read 16:44:27Z)

- 84 invocations: 71 fetch, 8 five-minute, 3 quarter-hour, 1 forest, 1 hourly. **Every outcome `ok`.** No `exceededMemory`,
  no `exceededCpu`, no error-level log. Highest CPU: the hourly job 814 ms, the probe 587 ms, the quarter-hour job 372 ms.
- Storage: no object under `earthview/`.
- `/status` before (15:59:59Z) and after (16:44:29Z): every layer `ok` after. `ships` was already `down` in the before-read
  (15:56:06Z, before the interval opens; the Mac collector's log shows its connect-timeout to aisstream at 15:56:05Z) and
  is `ok` again at 16:27:01Z. The two old parked rows unchanged. **No new failure in the interval.**

## Reading by proposal rev 2.1 section 4

Saved answer, log lines, exact invocation record with outcome `ok` and CPU 587 ms, both headers naming the requested time,
validation passed, `deadline_hit` false, health reads before and after: all present. No not-met condition observed.
**Observation 2: complete as an observation; it did not observe coexistence under load.**

Files: `observation-2.json`, `observation-2-record.json`, `observation-2-before.json`, `observation-2-after.json`.
