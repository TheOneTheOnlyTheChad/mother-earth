# Proposal: ships — say why a Mac sample fails, and decide what an overlong sample and a late failure may replace

Rev 1, 18 Nov 2026 10:04 UTC (clock reading). Branch `ships-diagnostics-rc` from main `dcdda43`. Proposal only: no code is changed on this branch.
Asked for by GPT (relayed by Chad, 18 Nov) after the ships read. Evidence: STATUS 18 Nov 07:01, 07:02 and 07:56 UTC entries (D1 `collector_runs`, `~/mother-earth/logs/collector.log`, code on main).

## What is known

1. **Six Mac ships failures on 17 Nov**, all recorded as "websocket error:" with nothing after the colon. Two (13:02, 14:14 UTC) happened off the home network, with failed uploads beside them. Four (16:01, 16:32, 19:43, 22:22 UTC) happened at home with the network to the hub working; each tick ended about 18 s after it began. Cause unknown.
2. **Why the note is empty:** `phase1/collector-mac.mjs`, `ws.onerror`: `'websocket error: ' + [details].filter(Boolean).join(' | ') || 'unknown (no detail from the socket)'`. The `+` binds before the `||`, so the left side is never empty and the fallback never applies; and Node's WebSocket client put nothing in the four fields read. Checked in Node 22: the expression gives `"websocket error: "`.
3. **The 17 Nov 14:52 UTC sample** (`wall=381.5s overlong=true status=degraded flowing=20.2s interruptions=1 (348s) quiet_at_end=347.7s vessels=700`) was uploaded with its records, and the hub made it the latest sample. The collector uploads any degraded sample; the hub's `ingest()` withholds only `down`. The duration contract (START-HERE §5b) says an overlong sample is "never a usable sample". The page words it as "not counted as a full sample" and still draws its 700 vessels. The laptop was changing networks at the time; the cause of the silence is not established.
4. **A Mac failure is written over a good sample.** A Mac `down` upload calls `writeDown`, which replaces `latest-cells/ships.json` whatever is there. On 17 Nov the 16:32:06 UTC failure followed the hub's good 16:15:40 fallback sample (3,232 vessels) by 16 minutes. `latest/ships.json` (the records) is kept. What the page showed until 17:00 UTC was not checked.
5. **The fallback did not cause the failures** in these rows (five of six had no fallback in the 15 minutes before).

## Part A. Diagnostic logging (collector only) — recommended now

One extra line in `collector.log` for every ships run that fails or is degraded, and a correct note. No change to what is sampled, when, or how often. No extra request to aisstream.

**A1. On failure, log** (Mac log only):
`ships: failed phase=<connect|open-no-confirmation|listening> after=<s> opened=<true|false> confirmed=<true|false> messages=<n> error=<name> | <message> | <cause code> close=<code>/<reason> online_check=<…>`
- `phase` and `after` separate "never connected" from "connected, then dropped", and show whether the 15 s connect limit was involved.
- `error`: every field the error event carries (`type`, `message`, `error.name`, `error.message`, `error.code`, `error.cause.code`), and the words "no detail from the WebSocket client" when all are empty.
- `online_check`: one `dns.lookup('stream.aisstream.io')` after the failure: resolved in N ms, or its error code. This is a name lookup on the Mac, not a request to the provider. It separates "the Mac had no working network or DNS" from "the provider refused or dropped us".

**A2. Fix the note** so the fallback text applies (parentheses round the joined details).

**A3. What is uploaded stays small.** The envelope's `note` goes to the hub and into the public cells file. It will carry only a fixed phrase per phase ("websocket error before connection", "websocket error after connection", "connect timeout (15 s)"), not local network detail. The full line stays in the Mac log.

**A4. For a degraded sample, log the first interruption's start and end times** (already in the envelope; the log line has only the count and total), so a silence can be lined up with `pmset -g log` and the home-network check.

**Version** mac-0.3.5. **Tests:** `phase1/duration-contract.test.mjs` pattern (stubbed socket, controllable clock, no network): error before open; error after open with and without messages; connect timeout; error event with no fields → the fallback words; uploaded note is one of the fixed phrases and contains none of the logged detail; a normal run logs nothing new. Breaks: restore the precedence fault; upload the full detail. Then `phase1/aircraft-mac-regression.sh` on the Mac's own bash (Chad, Terminal, about 30 minutes), since `run.sh` is not touched but the collector file is replaced.
**Release:** install in `~/mother-earth` between ticks, old file preserved. One Approve line. Rollback = copy the preserved file back.
**What it will not do:** explain the six past failures. It explains the next ones. If aisstream gives the client no reason, the line will say so, and phase, timing and the DNS check are what is left.

## Part B. An overlong sample — a decision

Today an overlong sample replaces the latest sample and is drawn. Options:
- **B1. Leave it.** The card says degraded and why. Cost: 700 vessels from 20 s of listening stood as the latest ships sample for about half an hour on 17 Nov (accepted by the hub at about 14:59 UTC, replaced by the 15:29 UTC sample).
- **B2. The hub keeps the last good sample and records the attempt** (recommended). In `ingest()`, for ships only, an upload with `overlong_sample: true` is archived and logged as today but does not become latest. `latest-cells/ships.json` keeps the good sample's cells and gains `last_attempt` (time, status, reason code `sample_overlong`, elapsed, window), as buoys do since hub 0.6.8. The card reads "degraded" with "Latest sample ran N s against a 60 s window and is not shown. Showing ships from the HH:MM UTC sample." The existing three-hour stale limit still ends it.
- **B3. The collector does not upload an overlong sample's records.** Simpler, but the hub then sees `down` and Part C's problem applies.

Not proposed: withholding ordinary low-flow samples (for example 53 of 60 s). They are short of our 90% standard, not outside the window, and stay published as degraded.

## Part C. A failure after a good sample — a decision

- **C1. Leave it.** A Mac failure replaces the cells file with "down" even when a good sample (Mac or fallback) is minutes old.
- **C2. Same rule as B2** (recommended): for ships, a `down` upload keeps the last good sample's cells and adds `last_attempt`; the card reads "degraded" with "Latest sample failed at HH:MM UTC. Showing ships from the HH:MM UTC sample." Nothing good to keep, or the good sample older than three hours → down, as today. Conditional writes ordered by run time, as in the buoy path, so a late failure cannot displace a newer good sample.

B2 and C2 are one hub change and one page change (card, place row, Sources, report), with hub and page suites on the buoy pattern (`osmc-reliability-*`). Hub 0.6.19. Each release step on its own Approve line.

## Decisions for Chad (GPT to advise)
- D1. Part A now, on its own? (recommended: yes; it is small and is needed whatever is decided on B and C)
- D2. Overlong sample: B1, B2 or B3? (recommended: B2)
- D3. Failure after a good sample: C1 or C2? (recommended: C2, built with B2)
- D4. `online_check`: a DNS lookup only (recommended), or leave it out.

## Not in this proposal
- Moving ships collection to the Pi, changing the 30-minute cadence, or changing the fallback's 40-minute rule.
- The Sources page overflow at 360 px (its own small branch, after this).
