# Proposal: ships — record why a Mac sample fails, and decide what an overlong sample and a failure may replace

Rev 2, 18 Nov 2026 10:32 UTC (clock reading); rev 1 was 18 Nov 2026 10:04 UTC. Branch `ships-diagnostics-rc` from main `dcdda43`. Proposal only: no code is changed on this branch.
Rev 2 takes in GPT's review of rev 1 (relayed by Chad, 18 Nov): direction supported; D1 Part A separately, D2 B2, D3 C2 built with B2, D4 DNS lookup included with a time bound; amendments to Part A and an explicit publication contract for B2/C2. Part A (what we log) and Parts B/C (what the public site publishes) are separate changes with separate approvals.
Evidence: STATUS 18 Nov 07:01, 07:02 and 07:56 UTC entries (D1 `collector_runs`, `~/mother-earth/logs/collector.log`, code on main).

## What is known

1. **Six Mac ships failures on 17 Nov**, all recorded as "websocket error:" with nothing after the colon. Two (13:02, 14:14 UTC) happened off the home network, with failed uploads beside them. Four (16:01, 16:32, 19:43, 22:22 UTC) happened at home with the network to the hub working; each tick ended about 18 s after it began. Cause unknown.
2. **Why the note is empty:** `phase1/collector-mac.mjs`, `ws.onerror`: `'websocket error: ' + [details].filter(Boolean).join(' | ') || 'unknown (no detail from the socket)'`. The `+` binds before the `||`, so the fallback text never applies; and Node's WebSocket client put nothing in the four fields read. Checked in Node 22: the expression gives `"websocket error: "`.
3. **The 17 Nov 14:52 UTC sample** (`wall=381.5s overlong=true status=degraded flowing=20.2s interruptions=1 (348s) quiet_at_end=347.7s vessels=700`) was uploaded with its records and the hub made it the latest sample. The collector uploads any degraded sample; the hub's `ingest()` withholds only `down`. The duration contract (START-HERE §5b) says an overlong sample is "never a usable sample". The laptop was changing networks at the time; the cause of the silence is not established.
4. **A Mac failure is written over a good sample.** A Mac `down` upload calls `writeDown`, which replaces `latest-cells/ships.json` whatever is there. On 17 Nov the 16:32:06 UTC failure followed the hub's good 16:15:40 fallback sample (3,232 vessels) by 16 minutes. `latest/ships.json` (the records) is kept. What the page showed until 17:00 UTC was not checked.
5. **These records do not support fallback overlap as the cause** of the failures (five of six had no fallback in the 15 minutes before; none overlapped in time).
6. **Hourly aggregates already leave overlong samples out:** the ships hourly step uses only samples with `source_status: 'ok'`, and an overlong sample is always `degraded`. They are listed under `rejected` with their status.

## Part A. Diagnostic logging (collector only, mac-0.3.5)

No change to what is sampled, when, or how often. No extra request to aisstream. More detail may help explain future failures; it cannot guarantee an explanation, and it says nothing about the six past ones.

**A1. One line in `collector.log` for every ships run that does not end as an ok sample:**
`ships: outcome=<error|close-before-confirmation|close-after-confirmation|connect-timeout|overlong|low-flow> after=<s> opened=<true|false> confirmed=<true|false> messages=<n> error=<…> close=<code>/<reason>|unavailable dns_check=<…>`
- **Every ending is covered, with or without an `error` event:** an error; a close before the subscription is confirmed; a close after confirmation and before the window ends; the 15 s connect timeout; and the two degraded endings (overlong, low flow), which add the first interruption's start and end times so a silence can be lined up with `pmset -g log` and the home-network check.
- **Close details are taken if they have arrived, never waited for.** When the run ends on an error or a timeout the line is written from what is known at that moment; if no close event has arrived it says `close=unavailable`.
- **`error` is built from named fields only** (`type`, `message`, `error.name`, `error.message`, `error.code`, `error.cause.code`), each cut to 80 characters with control characters and line breaks removed, the whole cut to 300. No event object is serialised. Nothing from the subscription message is logged (it carries the key). When every field is empty the line says "no detail from the WebSocket client".
- **Cleanup on every ending:** all three timers cleared and the socket closed before the line is written; the process exits on its own (no open handle).

**A2. `dns_check` (was `online_check`).** After a failed run only: one `dns.lookup('stream.aisstream.io')`, raced against a **2 s deadline**. Recorded as `resolved in N ms`, `error <code>`, or `no answer in 2 s`. A late answer is ignored. It is a name lookup on the Mac, not a request to the provider.
- **It records a fact and infers nothing.** A success shows only that the name resolved at that later moment. It does not show the network was working when the sample failed, and it does not separate a network fault from a refusal by the provider.
- It runs after the socket and timers are cleaned up and cannot delay the upload by more than 2 s. The aircraft schedule is not affected: `run.sh` runs ships first and kills an aircraft run at 90 s; the ships run's own bounds are unchanged.

**A3. What is uploaded is a fixed phrase on every ships failure path.** The envelope's `note` goes to the hub and into the public cells file. For ships it becomes one of: "websocket error before connection", "websocket error after connection", "connection closed before confirmation", "connection closed after confirmation", "connect timeout (15 s)", "collector error". **This includes the outer catch**, which today uploads `String(err)` for whatever was thrown; for ships it will upload "collector error" and log the bounded detail locally. Other layers' notes are unchanged.

**A4. The precedence fault is fixed** as part of A1.

**Tests** (`phase1/ships-diagnostics.test.mjs`, the `duration-contract.test.mjs` pattern: stubbed socket, stubbed `dns.lookup`, controllable clock; **the suite fails if any real network call is made**):
- error before open; error after open, with and without messages; close before confirmation with no error event; close after confirmation with no error event; connect timeout; an error event with every field empty;
- DNS: success, error, and no answer (the 2 s deadline ends it; the upload proceeds; a late answer changes nothing);
- after every ending: no timer left, socket closed, process free to exit;
- every public-note path, including a throw from outside the socket code: the uploaded note is one of the six phrases and contains none of the logged detail;
- long or multi-line error text is cut and cleaned; nothing from the subscription message appears in the log;
- an ok run logs nothing new;
- the 381.5 s / 700-record case: logged as `outcome=overlong` with its interruption times; its envelope is unchanged by Part A.
Breaks: restore the precedence fault; upload the detail; drop the DNS deadline; skip cleanup on the close-only path; serialise the event.
Then `phase1/aircraft-mac-regression.sh` under the Mac's own bash (Chad, Terminal, about 30 minutes): `run.sh` is untouched but the collector file is replaced.

**Release:** install in `~/mother-earth` between ticks, old file preserved. One Approve line. Rollback = copy the preserved file back. No hub or page change.

## Parts B and C. One publication rule for ships (hub 0.6.19 and a page change)

**Decided direction (GPT's advice; Chad's to confirm):** B2 and C2, built together.

### The contract
1. **Eligible sample:** a ships upload or fallback sample with `source_status` `ok` or `degraded` that is **not overlong**. An ordinary low-flow sample (for example 53 of 60 s) is eligible and is published as degraded, as today. **An overlong sample is never eligible.** A `down` attempt is not a sample.
2. **Retained sample:** the last eligible sample published. Its cells, records, `retrieved_at`, window times and run identity stay exactly as published. Cells and records stay paired: neither file is rewritten except to add or replace `last_attempt` in the cells file.
3. **An ineligible attempt** (overlong, or down) never becomes latest. It is archived and logged with its own true status (`degraded` with `overlong_sample: true`, or `down`), as today. The cells file gains `last_attempt`: `run` (the attempt's scheduled time), `at`, `status`, `reason` (a code: `sample_overlong` or one of the fixed failure phrases), and for an overlong attempt its `elapsed_s` and `window_s`, `collected_by`, `consecutive`.
4. **`last_attempt` never renews the retained sample.** The sample's three-hour life runs from its own `retrieved_at`. Every reader of freshness (page, `/place`, health, fallback) reads that time.
5. **Nothing eligible to retain, or the retained sample is three hours old or more:** the outcome is as today for a failure (a `down` cells file with the fixed phrase; the page says no sample from the latest run), and for an overlong attempt the same `down`-shaped cells file with reason `sample_overlong`: its records are not shown as current in either case. An expired retained sample is not brought back by a later attempt.
6. **Both writers obey it:** Mac ingest and the hub's own fallback (including the fallback's failure paths, which call `writeDown` today).
7. **Ordering:** every write of the cells file is conditional on what was read (etag) and ordered by run time, re-read once on conflict, as in the buoy path (hub 0.6.8). A delayed failure or overlong attempt older than the published sample changes nothing. An eligible sample newer than a recorded `last_attempt` replaces the file and the `last_attempt` goes with it, so no obsolete warning stays attached. Two writers at once (fallback and Mac): one wins the conditional write, the other re-reads and applies the same rule.
8. **Fallback scheduling:** the fallback's "is the Mac stale" test keeps reading the retained sample's own `retrieved_at` in `latest/ships.json`, which failed attempts never touch. Repeated failures therefore cannot make an old sample look newly collected or postpone the fallback; they are recorded only in `last_attempt` and `collector_runs`. The 25-minute gap between fallback attempts is unchanged.
9. **Archives and aggregates:** the rejected attempt keeps its actual status in `cells/ships/<stamp>.json`, `snapshots/ships/<stamp>.json` and `collector_runs`. Hourly aggregates continue to use only `ok` samples (known fact 6); a test fixes that in place.

### The page
- Card state "degraded". For an overlong attempt: "Latest sample ran N s against a W s window and is not shown. Showing ships from the HH:MM UTC sample." N and W come from `last_attempt`; HH:MM from the retained sample. For a failure: "Latest sample failed at HH:MM UTC. Showing ships from the HH:MM UTC sample." (failure time from `last_attempt`, sample time from the retained sample.)
- The same facts on the place row, Sources, the report and search, through one helper in `app.js`.
- Retained sample three hours old or more: unknown, records withheld, as today.

### Tests (hub: fixture hub with a controllable clock and conditional-write R2, as `osmc-reliability-hub`; page: real page against that hub, as `osmc-reliability-ui`)
The matrix, each for an overlong attempt and for a failure, from the Mac and from the fallback:
- no prior sample; prior eligible ok sample; prior ordinary degraded (low-flow) sample retained; prior sample 2 h 59 min old and 3 h old;
- the 381.5 s / 700-record upload after a 3,000-vessel sample: latest unchanged, records still the 3,000, `last_attempt` carries 381.5 and 60, archive holds the 700 as degraded and overlong, hourly aggregate does not use it;
- recovery: the next eligible sample replaces the file and `last_attempt` is gone;
- repeated failures: `consecutive` rises, the retained sample's times do not move, the fallback still fires on the retained sample's real age, expiry still happens at three hours;
- delayed uploads: an older failure after a newer sample changes nothing; an older eligible sample after a newer one is archived only (today's rule, kept);
- concurrent fallback and Mac writes, both orders, with a conditional-write conflict forced;
- cells and records stay paired through every case (`usable('ships')` on the page).
Breaks: let an overlong sample publish; let `last_attempt` renew the sample's time; unconditional write; fallback reads the attempt time; drop pairing; page takes N from the retained sample.

**Release:** hub 0.6.19 deploy, then the page merge, each on its own Approve line, after GPT's review of the build. Rollback: hub 0.6.18 (`ad5bce33…4132`); revert the page merge.

## Decisions (GPT's advice, 18 Nov; Chad's to give)
- D1. Part A separately, first. **Recommended by GPT and Claude.**
- D2. Overlong sample: B2 (retain the last eligible sample). **Recommended.**
- D3. Failure after a good sample: C2, built with B2. **Recommended.**
- D4. DNS lookup: included, 2 s deadline, recorded without inference. **Recommended.**

## Not in this proposal
- Moving ships collection to the Pi, changing the 30-minute cadence, or changing the fallback's 40-minute rule.
- The Sources page overflow at 360 px (its own small branch, after this).
