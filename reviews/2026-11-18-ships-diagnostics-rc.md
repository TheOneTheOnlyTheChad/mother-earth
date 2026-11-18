# Review packet: `ships-diagnostics-rc`, Part A (collector mac-0.3.5: how a ships run ended, and a fixed public note)

Rev 1, 18 Nov 2026. Branch `ships-diagnostics-rc` (from main `4303664`). **Collector only. Not installed on the Mac. Nothing merged. No hub or page change.**
Proposal: `docs/concepts/SHIPS-DIAGNOSTICS-PROPOSAL.md` rev 2.1, Part A (passed by GPT with one wording correction and the exit proof). Chad's go, 18 Nov: "Go: build Part A of SHIPS-DIAGNOSTICS-PROPOSAL rev 2.1 on branch ships-diagnostics-rc (collector only; no install, no merge)". Parts B and C are not built.

## 1. Files

| File | sha256 | |
|---|---|---|
| `phase1/collector-mac.mjs` | `342dfd41…de8f` | mac-0.3.5 |
| `phase1/ships-diagnostics.test.mjs` | see the commit | new suite |
| `phase1/ships-diagnostics.stub.mjs` | see the commit | its preload (stubbed socket, lookup, upload) |
| `phase1/aircraft-mac-regression.sh` | see the commit | runs the new suite too; lists the two new files' hashes |
| `phase1/run.sh` | `f6f587ae…65ce` | **unchanged** |

## 2. What the collector now does

**Unchanged:** what is sampled, the 60 s window, the 75 s and 120 s bounds, the 15 s connect limit, which endings count as a failure and which as a sample, the envelope of a sample (including its `close` field), exit codes, cadence, aircraft.

**Every ships run that does not end as an ok sample writes one line to the log:**

| Ending | Line | Uploaded |
|---|---|---|
| error event before the socket opened | `outcome=error … opened=false` | down, "websocket error before connection" |
| error event after it opened | `outcome=error … opened=true` | down, "websocket error after connection" |
| socket never opened in 15 s | `outcome=connect-timeout` | down, "connect timeout (15 s)" |
| far end closed before confirming (no error event needed) | `outcome=close-before-confirmation` | down, "connection closed before confirmation" |
| opened, never confirmed, our window ended it | `outcome=no-confirmation` | down, "no subscription confirmation within the window" |
| anything else thrown (no key, no WebSocket, a fault in our code) | `outcome=collector-error error=…` | down, "collector error" |
| far end closed after confirming, before the window ended | `outcome=close-after-confirmation` | **the sample, as before** |
| overlong sample | `outcome=overlong … first_interruption=<from>..<to> (Ns)` | **the sample, as before** |
| low-flow sample | `outcome=low-flow …` | **the sample, as before** |

A failed line: `ships: outcome=… after=<s>s opened=<bool> confirmed=<bool> messages=<n> [error=…] close=<code>/<reason>|unavailable dns_check=…`.
- `error` is built from six named fields (`type`, `message`, `error.name`, `error.message`, `error.code`, `error.cause.code`), strings and numbers only, each cut to 80 characters, the whole to 300, control characters and line breaks removed, the key's value struck out. When nothing but the bare type is there: "no detail from the WebSocket client".
- `close`: what has arrived by the time the line is written, else `unavailable`. Nothing waits for it. A close that arrives during the bounded DNS check is used.
- `dns_check`, failed runs only: one lookup of `stream.aisstream.io`, 2 s deadline: `resolved in N ms`, `error <code>` or `no answer in 2 s`. A late answer is ignored. The code comment states it records a fact and infers nothing.
- Every ending clears all three timers and drops the socket's open, message and error handlers.
- **Exit:** the upload path already ends with an explicit `process.exit`. `--dry` did not; when a lookup was abandoned at its deadline it now exits once its output is written.

## 3. Differences from the proposal's wording, for GPT's ruling

1. **A seventh ending and a sixth uploaded phrase: "no subscription confirmation within the window".** The proposal listed "connection closed before confirmation" only. Today the collector also fails when the socket opens, is never confirmed, and our own window timer closes it; calling that "closed before confirmation" would be untrue, so it has its own phrase.
2. **"connection closed after confirmation" is logged but is not an uploaded phrase.** Today a run the far end closes after confirming is still a sample (degraded by flow). Making it a failure would change what is published, which Part A must not do. It gets the log line and keeps its sample.
3. **Low-flow samples get the line too.** Between 17 Nov 12:00 and 18 Nov 03:41 UTC, 10 of 26 Mac uploads were degraded (D1; for example 52.6 of 60 s on 18 Nov 03:09), so expect this line often. It adds the first interruption's times when there is one.
4. **Close details that arrive during the DNS check are included** (the proposal said "what is known at that moment"). Nothing waits for them either way.

## 4. Tests

**New `phase1/ships-diagnostics.test.mjs`: 94 passed** (about 35 s). Child processes run the real collector file as a command under a preload that replaces the WebSocket, `dns.lookup` and `fetch`; two parts import it in-process. Any real lookup, any fetch other than the test hub's ships ingest, and any in-process socket are recorded and fail the suite.
- A. helpers: empty event → the fallback words; named fields only (an unnamed field and nested objects never appear); cut, cleaned, key struck out; DNS success, error, lookup that throws, no answer (2.0–2.5 s), late answer ignored.
- B. as real processes: error before open; error with no fields; error after open; error after messages; close before confirmation with no error event; opened and never confirmed (ends at the 10 s test window); never opens (ends at 15 s). Each: exit 3, one down report with exactly its phrase, exactly one line, nothing of the detail uploaded, no key anywhere, no control character in the line.
- C. the outer catch: a throw from the socket constructor, no key configured, no WebSocket in Node → "collector error" uploaded, cleaned reason in the local line.
- D. **lookup that never answers and holds the process open** (the stub keeps a live handle, as a stuck resolver would): the process ends by itself with exit 3 in at least 2 s and under 4 s, measured; same for a late answer; same for `--dry` (exit 0, output complete and parseable, nothing uploaded). Cleanup: three `--dry` runs end by themselves in under 3 s, which they could not with their 10 s and 20 s timers alive.
- E. ok run: one ok sample, **no new line, no lookup**, envelope as before. Far end closes mid-window after confirming: still a sample, one extra line, no lookup.
- F. **the 17 Nov case** with a controllable clock: 700 vessels over 20.1 s, then silence, the first message back at 381.5 s rejected by the guard. The sample is built as before (700 records, overlong, degraded, 381.5 s elapsed) and its line reads `outcome=overlong after=381.5s … messages=700 first_interruption=…`. The fixture's silence is 361 s; the real one was logged as 348 s.

**Breaks (8), each fails on its own assertions:** `precedence` 6 (the fault on main: the fallback words never apply), `upload-detail` 13, `outer-raw` 4 (main's behaviour), `no-dns-deadline` 7, `no-cleanup` 3, `serialise-event` 8, `no-exit-outstanding` 1, `log-raw-close` 3.

**Unchanged suites:** `duration-contract.test.mjs` all passed; `aircraft-schedule.test.sh` 88 (bash 5.2, Linux); `aircraft-counts.test.mjs` 75; `ships-fallback.test.mjs` 7.

**One slip while writing the suite, recorded:** the first run of the suite imported the collector in a way that made it run as the command, in the workspace, at 18 Nov 10:46:09 UTC. It tried one real WebSocket connection to `stream.aisstream.io`, which failed at once ("Received network error or non-101 status code"; whether it got past the workspace's proxy is not established). The socket never opened, so no subscription and no key were sent (the key set was a made-up test value in any case). Nothing was uploaded (`--dry`). The suite now points `argv[1]` at itself and installs a socket that throws and fails the suite before the import.

## 5. Not checked
- What Node's real WebSocket client on the Mac puts in an error event. The four home failures on 17 Nov may still give "no detail"; then phase, timing, close code and the DNS result are what the line has.
- macOS: the suite under the Mac's own Node and bash. `phase1/aircraft-mac-regression.sh` now runs it; Chad runs that in Terminal before any install.
- A real failure on the Mac after installation (first one will be read from `collector.log`).

## 6. Install (not approved; for later)
Write the new file beside the old one in `~/mother-earth`, move it into place between minute ticks, old file preserved in `_preserved/<UTC stamp>/`. `run.sh` and the schedules unchanged. One Approve line. Rollback = copy the preserved file back.
