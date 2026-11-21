# Stage B observation 1 (quiet), 21 Nov 2026

Hub 0.6.21 as deployed: 532,761 bytes, sha256 `2028e2daec92591d781e4f6289224c5e7c74fd16addfada62f6b6fc7359301c3`
(the reviewed file without its final newline; accepted by GPT), Cloudflare version `030f8d76-f40e-4301-a21f-f69ada9d6a3a`.
Chad's Approve line of 21 Nov: window start 2026-11-21T12:21:30Z, 60 s. Script started by Chad 06:01:33 UTC (claim).

## The call

| | |
|---|---|
| Called / answered (script's clock) | 12:21:31Z / 12:21:47Z, curl exit 0, HTTP 200, one attempt |
| Saved answer | `observation-1.json`, 1,352 bytes, sha256 `73ad802df508b5f4f9761f5b81fa7a87e2d3866548fdc2d968101e08c1dc2c98` (as on the Mac) |
| Attempt, build | `c7e35a233477`, `stage-b-1` |
| Outcome | **validated**; `deadline_hit` false; run 15,531 ms |
| Requests to EUMETSAT | 3 |
| Frame | 2026-11-21T11:50:00Z; both responses usable; **both headers name 11:50:00Z** |
| Picture / check image | 673,461 bytes sha256 `c8418e19…8e4f` / 133,100 bytes sha256 `17cc1374…c5a0` |
| Validation figures | agreement 0.9332; worst surround difference 1.9 (tolerance 16); 10 scans, progressive |
| Isolate | `8c82d654`, started 12:14:02.765Z, age 449 s, 4 requests served before, 0 scheduled runs, 0 validations before: **a reused isolate, first validation in it** |

## Cloudflare's record of that request (requestId `b4ed2d100531b2e1e8687379a4478ccf`)

POST `/admin/probe/earthview`, response 200, **outcome `ok`, CPU 827 ms, wall 16,377 ms**, logged 12:21:47.147Z, same version.
The five probe lines (`start`, `fetched`, `validate-begin`, `validated`, `done`) are stored under the same requestId and
carry the same attempt id as the saved answer.

**Authorization header: stored as eight asterisks.** Not readable, does not begin "Bearer". No log line contains the
word. This is the re-read required before observation 2; Chad was then told to start observations 2 and 3.

## A limit found: the validation's own start and end are the same instant

`validation.started_at` and `ended_at` are both 12:21:47.147Z and `wall_ms` is 0. In Cloudflare's runtime the clock does
not advance during computation, only across I/O, so timestamps taken around the synchronous decode cannot differ. The
validation's cost is therefore read from the invocation record's CPU time (827 ms for the whole request), and overlap
is assessed against the whole run (12:21:31.6 to 12:21:47.1), not a validation span. The local tests could not show
this: Node's clock advances. To be carried into the result and GPT's reading.

## Hub over the assessment interval, 12:11:31Z to 12:51:47Z (read 12:57:56Z)

- 86 invocations: 73 fetch, 8 five-minute, 3 quarter-hour, 2 forest. **Every outcome `ok`.** No `exceededMemory`, no
  `exceededCpu`, no error-level log. Highest CPU in the interval: the probe's 827 ms; next the quarter-hour job's 185 ms.
- **Overlap with the run: none.** No other invocation's span crosses 12:21:31.6 to 12:21:47.1. Nearest: five-minute job
  12:20:07 (2.1 s) before, five-minute job 12:25:07 after. A quiet run, as intended.
- Storage: no object under `earthview/`.
- `/status` before (12:14:03Z) and after (12:57:58Z): every layer `ok` in both, the two old parked rows unchanged
  (`opensky-bbox` 31 Oct, `firms:recovery` 03:00 UTC), and **one change: `ships` is `down` at 12:46:02Z** (it was `ok`, 11:42:00Z).

## The ships row: called unrelated, on this independent evidence

Rule (proposal rev 2.1 section 4): a new coincident failure is unexplained unless independent evidence, not the hub's own
record of it, supports "unrelated"; one accepted kind is a failure on the Mac collector's side of a layer the hub does not fetch.

The Mac collector's own log (`~/mother-earth/logs/collector.log`, read-only on the Mac) for that sample:

```
2026-11-21T12:46:02Z [tick] sample due (last 1855 s ago)
ships: outcome=connect-timeout after=15.0s opened=false confirmed=false messages=0 close=1006/- dns_check=resolved in 8 ms
200 {"ok":true,"layer":"ships","published":"failure recorded; last sample kept","snapshot":"2026-11-21T12-46Z"}
2026-11-21T12:46:20Z [tick] ships exit=3
```

The Mac's connection from Chad's home to aisstream never opened. The hub was not in that path; the hub's part was to
accept the Mac's failure report, which it did (HTTP 200), 24 minutes after the probe run. The same Mac-side failure is in
that log 96 times in all, including 11:11:23Z today, before the observation. The sample before it (12:14:02Z, posted
12:15:07Z) reached the hub and was stored, with the Mac's own note of low flow from the source.

On that evidence the ships row is recorded as unrelated and does not make this observation incomplete. GPT may read it otherwise.

## Reading by proposal rev 2.1 section 4

Saved answer: yes. Log lines: yes. Exact invocation record, outcome `ok`, CPU finite and below 5,000 ms: yes (827 ms).
Both headers name the requested time: yes. Validation passed: yes. `deadline_hit`: false. Health reads before and after: made.
No not-met condition observed. **Observation 1: complete**, subject to GPT's reading of the ships row and of the clock limit.

Files: `observation-1.json` (the answer), `observation-1-record.json`, `observation-1-before.json`, `observation-1-after.json`.
