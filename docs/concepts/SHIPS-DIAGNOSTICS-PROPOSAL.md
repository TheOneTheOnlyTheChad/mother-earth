# Proposal: ships — record why a Mac sample fails, and decide what an overlong sample and a failure may replace

Rev 2.1, 18 Nov 2026 10:40 UTC (clock reading); rev 2 was 18 Nov 2026 10:31 UTC, rev 1 10:04 UTC. Branch `ships-diagnostics-rc` from main `dcdda43`. Proposal only: no code is changed on this branch.
Rev 2.1 takes in GPT's review of rev 2 (relayed by Chad, 18 Nov): **Part A passes proposal review** with one wording correction (A2) and one build requirement (an outstanding lookup must not keep the process alive); Parts B/C need two ordering cases defined before their build (contract points 7, 7a, 7b; marked **rev 2.1**).
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
- It runs after the socket and timers are cleaned up. **Rev 2.1:** it can delay the end of a failed ships run by up to 2 s. There is no aircraft cadence or quota change. **The build must prove that a lookup still outstanding at the deadline cannot keep the process alive past it** (the process ends on its own explicit exit after the upload, whatever the lookup is doing).

**A3. What is uploaded is a fixed phrase on every ships failure path.** The envelope's `note` goes to the hub and into the public cells file. For ships it becomes one of: "websocket error before connection", "websocket error after connection", "connection closed before confirmation", "connection closed after confirmation", "connect timeout (15 s)", "collector error". **This includes the outer catch**, which today uploads `String(err)` for whatever was thrown; for ships it will upload "collector error" and log the bounded detail locally. Other layers' notes are unchanged.

**A4. The precedence fault is fixed** as part of A1.

**Tests** (`phase1/ships-diagnostics.test.mjs`, the `duration-contract.test.mjs` pattern: stubbed socket, stubbed `dns.lookup`, controllable clock; **the suite fails if any real network call is made**):
- error before open; error after open, with and without messages; close before confirmation with no error event; close after confirmation with no error event; connect timeout; an error event with every field empty;
- DNS: success, error, and no answer (the 2 s deadline ends it; the upload proceeds; a late answer changes nothing); **rev 2.1:** a lookup that never answers, run as a real child process of the collector with the lookup stubbed to hang: the process exits within the bound, measured;
- after every ending: no timer left, socket closed, process free to exit;
- every public-note path, including a throw from outside the socket code: the uploaded note is one of the six phrases and contains none of the logged detail;
- long or multi-line error text is cut and cleaned; nothing from the subscription message appears in the log;
- an ok run logs nothing new;
- the 381.5 s / 700-record case: logged as `outcome=overlong` with its interruption times; its envelope is unchanged by Part A.
Breaks: restore the precedence fault; upload the detail; drop the DNS deadline; skip cleanup on the close-only path; serialise the event.
Then `phase1/aircraft-mac-regression.sh` under the Mac's own bash (Chad, Terminal, about 30 minutes): `run.sh` is untouched but the collector file is replaced.

**Release:** install in `~/mother-earth` between ticks, old file preserved. One Approve line. Rollback = copy the preserved file back. No hub or page change.

## Parts B and C. One publication rule for ships (hub 0.6.19 and a page change)

**Decided direction (GPT's advice; Chad's to confirm):** B2 and C2, built together. Not to be built until GPT has read the rev 2.1 ordering points.

### The contract
1. **Eligible sample:** a ships upload or fallback sample with `source_status` `ok` or `degraded` that is **not overlong**. An ordinary low-flow sample (for example 53 of 60 s) is eligible and is published as degraded, as today. **An overlong sample is never eligible.** A `down` attempt is not a sample.
2. **Retained sample:** the last eligible sample published. Its cells, records, `retrieved_at`, window times and run identity stay exactly as published. Cells and records stay paired: neither file is rewritten except to add or replace `last_attempt` in the cells file.
3. **An ineligible attempt** (overlong, or down) never becomes latest. It is archived and logged with its own true status (`degraded` with `overlong_sample: true`, or `down`), as today. The cells file gains `last_attempt`: `run` (the attempt's scheduled time), `at`, `status`, `reason` (a code: `sample_overlong` or one of the fixed failure phrases), and for an overlong attempt its `elapsed_s` and `window_s`, `collected_by`, `consecutive`.
4. **`last_attempt` never renews the retained sample.** The sample's three-hour life runs from its own `retrieved_at`. Every reader of freshness (page, `/place`, health, fallback) reads that time.
5. **Nothing eligible to retain, or the retained sample is three hours old or more:** the outcome is as today for a failure (a `down` cells file with the fixed phrase; the page says no sample from the latest run), and for an overlong attempt the same `down`-shaped cells file with reason `sample_overlong`: its records are not shown as current in either case. An expired retained sample is not brought back by a later attempt.
6. **Both writers obey it:** Mac ingest and the hub's own fallback (including the fallback's failure paths, which call `writeDown` today).
7. **Ordering (rev 2.1).** Every attempt carries a run time (its scheduled time). Let S be the retained sample and L the recorded `last_attempt`, if any.
   - **An ineligible attempt A** (failure or overlong) is applied only if A is later than S **and** later than L. Otherwise it is archived and logged and changes nothing published. So with S retained and failure F2 recorded, an older failure F1 arriving late does not replace F2's warning.
   - **An eligible sample E later than S and later than L** replaces S, and `last_attempt` is removed: no obsolete warning stays attached.
   - **An eligible sample E later than S but older than L** (a delayed upload): E becomes the retained sample, because it is newer data than S, and **L is kept**. The card then reads "Latest sample failed at <L's time>. Showing ships from the <E's time> sample." The later failure is not silently erased. `consecutive` is set to 1, since the hub cannot know how many attempts fell between E and L.
   - **An eligible sample E older than S** is archived only (today's rule).
7a. **Records and cells are protected together (rev 2.1).** Today `writeSnapshot` writes `latest/ships.json` (records) and then `latest-cells/ships.json` with two unconditional puts. For ships:
   - Both puts become conditional on the etag read, with the run-time order checked again against what is read. The records file is written first, then the cells file. Neither file can be overwritten by an older run.
   - An ineligible attempt never writes the records file. It makes one conditional write of the cells file.
   - **A writer that loses a conditional write** re-reads both files once and applies the rules in point 7 to what is there now.
   - **Retry exhausted** (the second attempt also conflicts): the writer stops, archives its attempt, logs `publish_conflict` in `collector_runs`, and changes nothing more. Published state is whatever the other writer left.
   - **A writer interrupted between its two puts** leaves records newer than cells. Every reader already checks that the two files name the same run (`retrieved_at`): the page's `usable('ships')`, and the hub's `/place`. While they differ, **records are withheld and counts are shown alone**; mixed runs are never displayed. This is the chosen outcome over displaying either file's partner.
   - **Repair:** the next ships write of any kind first checks the pair. If the records file is newer than the cells file and is an eligible sample, it completes that sample's cells write (conditionally) before applying its own rule.
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
- **rev 2.1, ordering against `last_attempt`:** S retained, F2 then older F1 → F2's warning stays; S, F2, then eligible E with S < E < F2 → E retained, F2's warning kept, card names both times; E later than F2 → warning gone;
- **rev 2.1, forced interleavings between the records put and the cells put:** a second writer (newer and older, eligible and ineligible) placed between them; a writer stopped after the records put; retry exhausted. In every case no reader is given records and cells from different runs; the withheld state is seen on `/place` and on the page; the next write repairs the pair;
- cells and records stay paired through every case (`usable('ships')` on the page).
Breaks: let an overlong sample publish; let `last_attempt` renew the sample's time; unconditional write (cells; records); fallback reads the attempt time; drop pairing; page takes N from the retained sample; **rev 2.1:** an older failure replaces a later one; a delayed eligible sample erases a later failure; no repair of an interrupted pair.

**Release:** hub 0.6.19 deploy, then the page merge, each on its own Approve line, after GPT's review of the build. Rollback: hub 0.6.18 (`ad5bce33…4132`); revert the page merge.

## Decisions (GPT's advice, 18 Nov; Chad's to give)
- D1. Part A separately, first. **Recommended by GPT and Claude.**
- D2. Overlong sample: B2 (retain the last eligible sample). **Recommended.**
- D3. Failure after a good sample: C2, built with B2. **Recommended.**
- D4. DNS lookup: included, 2 s deadline, recorded without inference. **Recommended.**

## Not in this proposal
- Moving ships collection to the Pi, changing the 30-minute cadence, or changing the fallback's 40-minute rule.
- The Sources page overflow at 360 px (its own small branch, after this).
