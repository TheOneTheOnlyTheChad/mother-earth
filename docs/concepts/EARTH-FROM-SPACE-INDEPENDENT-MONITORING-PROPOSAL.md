# Earth from Space — monitoring independent of the thread, the Mac and the browser login: proposal rev 3.1 (23 Nov 2026) — docs only; the build brief

**Rev 3.1, 23 Nov 2026 11:41 UTC (clock reading):** three corrections from GPT's review of rev 3
(`reviews/2026-11-23-earth-from-space-independent-monitoring-proposal-rev3-gpt-review.md`): startup grace does not
excuse a recorded failure (3.5); the pause guarantee is narrowed to what the records can show (3.5, 3.7); the
24-hour read horizon is stated as a limit that can exclude late bad rows as well as late good ones (3.6). GPT:
with these adopted, no further full proposal round is needed. **This revision is the brief for the branch build,
which still needs Chad's go.**

**Rev 3, 23 Nov 2026 11:26 UTC (clock reading),** after GPT's review of rev 2
(`reviews/2026-11-23-earth-from-space-independent-monitoring-proposal-rev2-gpt-review.md`) and a signed-in,
read-only reading of the UptimeRobot account (section 12). Earlier: rev 2 after GPT's first review; rev 1 on Chad's
go of the same day. Section 13 maps every review point to its answer.

**Nothing here is built, deployed, configured or approved. It does not clear Stage D.** No setting was changed in
any account for it.

**Decisions:** Chad decided M1 to M8 in his own line after rev 3 was written (section 11). They authorise no action.

## 0. In short

- The hub already has an independent watcher: UptimeRobot polls eight public health addresses every five minutes.
  It watches earthquakes and fires only. **Read today in the account:** all eight are enabled, polled by HEAD
  every five minutes, with email and iPhone push selected on each (section 12).
- **Proposal:** two read-only health addresses for Earth from Space and two more monitors. Healthy is silent.
- **Since rev 1:** the checks are defined **slot by slot over the whole trial**, from the records that
  actually exist, so that a failure stays visible after a later good run and after the window ends; the trial
  states are in one table; the tolerance is derived, not asserted; the dependence on the thread is stated as a
  weakening.
- It detects. It cannot pause. It does not see everything (section 7).

## 1. Existing monitoring, assessed

| What | Independent of thread, Mac, login? | Covers Earth from Space? | State |
|---|---|---|---|
| **UptimeRobot, 8 monitors** on `/health/<check>/<layer>`: runs, publication, archive, coverage × `usgs`, `firms` | Yes | **No.** The four `earthview` addresses answer 404 (read 10:52 UTC, 23 Nov) | **Read in the account 23 Nov (section 12):** all eight Up and enabled, 5-minute interval, email and iPhone push on each, no maintenance window. The hub's own log shows them arriving by HEAD with UptimeRobot's user agent. A ninth, "ME alert test", is a leftover from 6 Nov and has been Down ever since |
| Hub's own records: `collector_runs` (D1), `/status`, logs | Records, not alerts | Yes | Live |
| Cloudflare email monitor | Yes | Would have | Tested 23 Nov: not reliable. None exists. Not reopened |
| Claude's reads through the dashboard tab | **No** | Yes, in detail | Rehearsed 23 Nov: launches, reads and gap detection worked |
| Chad noticing a missing heartbeat | No | n/a | **Rehearsed 23 Nov: failed. That result stands**; replacing the design does not rewrite it |

From the code: Earth from Space rides the five-minute trigger and starts only **after** the `usgs` collector has
finished and been recorded. An invocation ended during a picture run leaves that slot's `usgs` record in place.
**The existing eight monitors would not notice it.** They would notice the hub not answering at all.

## 2. The evidence that actually exists (hub 0.6.22, read from `phase1/worker.js`)

Every admitted Earth from Space run that **finishes** writes one row to `collector_runs`:

| Field | What it holds for an Earth from Space run |
|---|---|
| `layer` | `earthview` |
| `started_at` | **the trigger's scheduled time**, not when the run began and not when it ended. For a scheduled run this is the ten-minute mark. For a manual run it is the time of the request |
| `finished_at` | the time the row was written, at the end of the run |
| `status` | `ok` or `down` |
| `records`, `bytes` | 1 and the picture's size when a frame was published; otherwise 0 |
| `note` (first 500 characters) | starts with a **fixed phrase** (below), then detail |

The fixed phrases, and what each row establishes:

| Row | Phrase at the start of `note` | Establishes |
|---|---|---|
| `ok`, records 1 | `frame <T> as <id>` | **published** |
| `ok`, records 0 | `nothing newer: <T> listed, <X> held` | source check succeeded; **nothing newer listed** |
| `ok`, records 0 | `superseded: …` | another run published that frame first |
| `down` | `source check failed` | the source check did not succeed |
| `down` | `picture …` or `check image …` followed by `request failed`, `http error`, `not a picture`, `size out of range` | **source check succeeded and listed a newer frame**; fetching it failed |
| `down` | `served time not confirmed`; `served a different frame` | the same, and the server's time statement was missing or wrong |
| `down` | `picture failed validation`; `check image failed validation` | the same, and **validation refused** |
| `down` | `picture write failed`; `picture key already in use`; `picture read-back differs`; `stored copy is being removed` | the same, and storing failed |
| `down` | `storage record needs repair`; `storage changed during the run`; `storage busy` | **a storage stop** (stop condition 3) |
| `down` | `collection is held`; `storage is not set up` | a guard refused before any request |
| `down` | `internal error` | an exception; where in the run is **not recorded in the row** |

**No row is written** when a run is not admitted, and none when the invocation is ended before the run reaches its
last step. A run that never finishes is known only by the absence of a row. The `run-start` log line exists for it,
but logs are not readable by a public health address.

**Not yet seen live:** a *scheduled* Earth from Space row on 0.6.22 (Stage C's run was manual). That its
`started_at` is the exact ten-minute mark is read from the code and would be shown by the offline suite running the
production wrapper. If it were not exact, every slot would look incomplete and the check would alarm: the failure
is in the safe direction.

Two indexes exist: `(layer, id)` and `(layer, finished_at)`. `collector_runs` is never pruned.

## 3. The contract

### 3.1 Slots

With a readable window, the **slots** are the ten-minute marks s with `FROM` ≤ s < `UNTIL`: at most 288. They are
the same scheduled times the collector's own admission rule selects. **The health check uses its own clock only to
decide which slots are due.** It does not change admission and it is not a deadline for admitted work.

- A slot is **complete** when at least one row exists with `layer = earthview` and `started_at` exactly equal to
  that mark. What is measured is named for what it is: **slot completion**, the existence of an end-of-run record
  for a scheduled time. It is not the time the run finished.
- **Several rows for one mark count as one slot.** The collector's accepted behaviour (it does not deduplicate a
  time delivered twice) is untouched; the health reading simply does not count the second as another slot.
- **A slot is overdue when now ≥ s + 20 minutes and it is not complete.**
- A late-delivered trigger that then runs writes its row and the slot becomes complete. That is a true resolution,
  not a hidden failure.
- **Rows from outside the trial.** Stage C's row and any earlier trial's rows have times outside this window and
  are not read.
- **A manual run is a blind spot, stated.** The row has no field saying whether a run was scheduled or manual, and
  a manual run's `started_at` is the time of the request. If a manual request landed exactly on a ten-minute mark
  inside the window, to the millisecond, its row would be indistinguishable from that slot's scheduled row and
  would make the slot look complete. **This record alone cannot exclude it.** What stands against it: manual runs
  are forbidden during Stage D (stop condition 9, and Chad's line); the thread's reads see manual runs in the logs,
  where the trigger kind is recorded; the offline suite includes this collision as a documented case. Recording
  the trigger kind in the row would close it, and would be a change to collection: **not proposed here; a
  separate reviewed change if wanted.**

**Why 20 minutes.** Cloudflare's limits page gives a scheduled invocation at most 15 minutes of wall time
(developers.cloudflare.com/workers/platform/limits, read 23 Nov 2026). The run starts after the `usgs` and aircraft
collectors in the same invocation, and its own waits are bounded (30 s for the source list, 90 s each for the
picture and the check image). So if the trigger was delivered on time, the row exists by s + 15 minutes or it never
will. Five minutes are added, the same margin the existing checks use. **A trigger delivered late is the case this
does not bound:** the slot shows overdue until the late run finishes.

**An overdue slot is "completion missing". The check does not say why.** One overdue slot is consistent with an
invocation ended for CPU or memory, with an exception before the last step, and with a trigger that never arrived.
It is not an observation of any of them.

**Rev 1 said three slots in a row. Rev 2 proposes one.** A single run that never finishes is the nearest thing
these records hold to stop conditions 1 and 2, which say "any". The cost is an alert for a single trigger that
Cloudflare delivers late or not at all. **This is decision M5.**

### 3.2 Which slots may be judged

- A slot is **due** when now ≥ s + 20 minutes. **At equality it is due.**
- A slot is **settled** when it is due. A settled slot is either complete or overdue.
- **Only settled slots take part in any streak.** Future slots, and slots still inside their 20 minutes, are not
  failures and are not "not published": they are not counted at all. Streaks are read in scheduled order over
  settled slots only, so an early failure followed by slots that are not yet due cannot make a streak.
- Slots do not exist at or after `UNTIL`. A streak cannot run past the last slot.

### 3.3 What each slot's rows say (duplicates included)

A slot may have several rows. Each row is read by its fixed phrase (section 2) into one of: published; superseded;
nothing newer; storage stop; validation refused; other post-check failure; source check failed; guard refused;
internal error; **unrecognised** (a status or phrase not in the table).

A slot then carries **flags**, each true if **any** of its rows says so:

| Flag | True when the slot has a row that is |
|---|---|
| `refused` | validation refused |
| `storage_stop` | a storage stop |
| `newer_listed` | validation refused, or any other post-check failure (both show the source listing a newer frame) |
| `current` | published, superseded or nothing newer, **and that row finished at or before the slot's due time** |
| `unrecognised` | unrecognised |

- **A good row never removes a bad flag.** A repeat of a slot that succeeds does not erase a refusal or a storage
  stop recorded for that slot.
- **`superseded` is not "published in this slot".** It records that another execution had already published that
  frame. It is evidence that the held frame was current, so it sets `current`, like "nothing newer".
- **Evidence that clears is frozen at the slot's due time; evidence of failure is accepted whenever it arrives.**
  A good row that appears after a slot is due cannot switch off a finding already made.

### 3.4 The two checks, evaluated over the whole trial

| Address | 503 when, for the current trial | Stays 503 |
|---|---|---|
| `/health/runs/earthview` | any settled slot is overdue; or the configuration is in a failing state (3.5); or the rows could not be read completely (3.6) | until that slot becomes complete, or the trial is closed out |
| `/health/trial/earthview` | **(c3)** any slot has `storage_stop`; **(c6)** any three adjacent settled slots each have `refused`; **(c8)** any six adjacent settled slots of which none has `current` and at least one has `newer_listed`; or any slot is `unrecognised`; or the rows could not be read completely | **until the trial is closed out** |

- **c6, the reading chosen and why.** Stop condition 6 says "three consecutive slots ending in a validation
  refusal". With repeats, three readings are possible: each of three adjacent slots holds **at least one** refusal;
  each holds **only** refusals; or three consecutive **attempts** were refused. Rev 3 takes the first. It is the
  only one that a later repeated success cannot mask, and it errs toward alerting. It can alert where the
  strictest reading would not; that is accepted and listed here.
- **An overdue slot inside a streak:** it has no rows, so it is not `refused` (it breaks c6) and not `current`
  (it counts toward c8's six). It is alarming on the other address in its own right.
- **What cannot be decided from the rows, and is not claimed:** c8 when none of the six shows `newer_listed`
  (all source-check failures, internal errors, guard refusals, storage stops or overdue): a source outage is
  recorded, not alarmed. Where an `internal error` happened in the run. The frame actually held, which is taken
  from the rows' words and not re-read from storage. A manual run on an exact mark (3.1).
- **The public answer** carries the state, counts, and for each finding the slot time and a **fixed reason code**
  from a closed list. **No note text is published by these two checks.**

### 3.5 States, in order of precedence

`ALLOW` is 20 minutes. `LAST` is the last slot's due time: `UNTIL` − 10 minutes + `ALLOW`. The first rule that
applies decides. "Gate" is `EARTHVIEW_ENABLED`.

| Order | Condition | `runs` | `trial` | State in the body |
|---|---|---|---|---|
| 1 | Gate is anything other than unset, `manual` or `1` | **503** | **503** | `gate has an unknown value` |
| 2 | Neither window variable is set, gate is `1` | **503** | **503** | `gate is 1 with no window` |
| 3 | Neither window variable is set, gate unset or `manual` | 200 | 200 | `no trial configured` |
| 4 | Only one window variable set; or either unreadable; or `UNTIL` ≤ `FROM`; or longer than 48 hours | **503** | **503** | `window not readable` |
| 5 | Valid window, now < `FROM`, gate `1` | 200 | 200 | `armed, starts <FROM>` |
| 6 | Valid window, now < `FROM`, gate not `1` | **503** | 200 | `window set but gate is not 1` |
| 7 | Valid window, `FROM` ≤ now < `FROM` + `ALLOW`, gate `1` | 200, **unless the rows cannot be read** | 200, **unless** a row already recorded shows a storage stop or an unrecognised outcome, or the rows cannot be read | `starting` (no slot is due; at `FROM` + `ALLOW` exactly, row 8 applies) |
| 8 | Valid window, `FROM` + `ALLOW` ≤ now < `LAST`, gate `1` | by 3.4 | by 3.4 | `active` |
| 9 | Valid window, `FROM` ≤ now < `LAST`, gate not `1` | **503** | by 3.4 | `trial window set but not collecting` |
| 10 | Valid window, now ≥ `LAST`, nothing overdue and no finding | 200 | 200 | `trial complete, nothing outstanding` (the gate's value is reported, and no longer decides) |
| 11 | Valid window, now ≥ `LAST`, something overdue or found | **503** as applies | **503** as applies | `trial ended with outstanding findings`; if the gate was not `1`, also `not collecting` |

- **What startup excuses, and what it does not.** Before any slot is due, a missing completion is not a
  failure and no c6 or c8 streak can exist. **Startup does not excuse** a storage stop already recorded, an
  unrecognised outcome on a row of this trial, a read that is incomplete, or a read or parse failure: each is
  evaluated first and answers 503 at once. (First slot 07:00, storage stop recorded 07:02, poll at 07:05: 503.)
- **A gate that is off during the trial answers 503 "not collecting" while it is off** (rows 6, 9, 11). A gate
  switched off by mistake therefore alerts.
- **What these addresses do not keep: a history of the gate.** They read the gate as it is now and the rows as
  they are. They cannot show that collection was never paused:
  - a pause and resume between two scheduled times loses no slot and leaves no trace here;
  - a pause after the last trigger was admitted can show red while off and green at row 10, with no closeout;
  - a paused slot whose trigger arrives late after resumption completes, and its overdue finding clears (3.1).
  **A completed trial's 200 does not prove there was no pause.** Slots that really were missed, and qualifying
  outcomes that really were recorded, are kept by their own rules. Every deliberate pause and resumption, and its
  effect on the Stage D verdict, is recorded in the operational ledger and the result, and preserved at closeout.
  A permanent, independently detectable pause latch would be further design work; it is not claimed here.
- **An unknown gate is refused at every stage** (row 1 comes first), including after the window.
- **The window ending is not evidence of recovery** (row 11).
- **Residual limitation:** if the gate and both window variables are removed together during a trial, by mistake,
  the state is row 3 and the checks are silent. The configuration alone cannot tell that from no trial.

### 3.6 Bounded reads, failing closed

- The query is bounded on both sides and by count: `layer = 'earthview'`, `finished_at` ≥ `FROM`, `finished_at` <
  `UNTIL` + 24 hours, through the existing `(layer, finished_at)` index, in order, **at most 2,000 rows**; then
  only rows whose `started_at` is a slot of this trial are used.
- **288 slots do not bound the rows.** Repeats and stray rows add to them. If the query returns its limit, the
  evidence may be incomplete: **both checks answer 503 `too many rows to evaluate`.** They never treat a
  truncated read as a complete one.
- **The read has a finite horizon: `UNTIL` + 24 hours.** A row finished after that is not read, whatever it
  says. If it would have completed an overdue slot, the slot stays overdue: that errs toward alerting. **If it
  is a late repeat recording a failure for a slot an earlier good row already completed, the failure is not
  seen and nothing turns red.** So "a finding is kept for the whole trial" means: for qualifying rows inside the
  read range, not for any execution at any later time. This limit goes into the revised Stage D basis and the
  closeout procedure (the closeout read of the rows is made without the horizon, by Claude, from the logs and the
  table). If it is not acceptable, the query strategy is changed explicitly; the present cutoff is not claimed to
  fail safely in every case.
- Any row whose status or phrase is not in section 2's table makes its slot `unrecognised`: 503, not ignored.
- An exception, an unreadable time or a missing table: 503, as the existing checks.
- **D1 rows read and CPU per request are measured on the candidate** with end-of-trial and repeat-heavy fixtures.

### 3.7 Acknowledgment, reset and trial identity

- **A trial is identified by its `FROM` and `UNTIL` values.**
- **There is no acknowledge button and no health write.** Findings are acknowledged by **closing the trial out**:
  removing the two window variables in the dashboard, on Chad's line, **after the result has been reviewed and
  the trial's rows and the health answers have been copied into the result document.** UptimeRobot will then show
  "Up". **That means closed out. It does not mean a failed trial passed.**
- **Pause and resume inside one window:** slots that were missed stay overdue unless a late run completes them;
  the addresses hold no record of the pause itself (3.5). The ledger does.
- **A new window is a new trial.** It is never set to hide an unresolved result: the earlier trial's result is
  written first.

## 4. At UptimeRobot (a settings change, later, on its own line)

Two monitors, "ME runs earthview" and "ME trial earthview", set as the existing eight are today (section 12):
5-minute interval, 30-second timeout, default location, **E-mail and Push in-app (iPhone) both selected on each**,
"no delay, no repeat". On the Free plan the method and the accepted status codes cannot be chosen; the account
uses HEAD (seen in the hub's log) and counts 2xx and 3xx as up, so 503 and 404 are down. The proposal relies on
nothing beyond that. After creation both are read back from the account (test 3).

## 5. What Chad sees, and when

- **Healthy: nothing.** Each poll is logged by UptimeRobot; each run by the hub.
- **Failing: an alert** naming the monitor; a second message when it clears or at closeout.
- **Time to alert for a slot that never completes, as designed:** 20 minutes for the slot to become overdue, up to
  5 minutes to the next poll, then UptimeRobot's own confirmation, retries and delivery. **A design estimate of
  roughly 25 to 30 minutes on a normal path, to be measured once. It is not a worst case.** A provider outage, a
  suppressed alert or a phone that is off has no bound.

## 6. Routine success, recorded without pushes

UptimeRobot's log per monitor (kept three months on the Free plan, as reported); `collector_runs` (not pruned);
the `run-start` and `run-end` log lines (Workers log retention not checked); the trial's ledger in the result.

## 7. What remains uncovered, and what depends on the thread

**This is a weaker supervision basis than the hourly inspections proposal rev 2.2 described, not only fewer phone
pings.** It is offered because the hourly design's safety net failed its rehearsal.

- **The pause.** Nothing pauses the trial by itself. Chad pauses from his phone in the Cloudflare dashboard, or
  Claude does if the thread is alive and Chad's Stage D line allows it. An alert at night waits until it is seen.
- **Seen only by the thread's reads, three a day (M3):** a single resource ending whose slot nonetheless completed
  on a repeat; any other non-ok invocation on any layer (condition 2); a picture's bytes differing from its record
  (4); CPU at or above 5,000 ms (5); other layers newly down or degraded, except `usgs` and `firms` (7); request
  budget (9). **Each is found only if a later read takes place. If the thread stops, they may not be found during
  the trial at all.** With reads at, say, 07:00, 13:00 and 20:00 SAST the longest gap is 11 hours overnight.
- **The watcher itself.** There is no independent detector of UptimeRobot failing. Requests arriving at the health
  addresses show traffic, not that UptimeRobot evaluated them or delivered anything; the addresses are public and
  anyone may request them; the request log is sampled. **It is a hint, not a monitor of the watcher.**
- **Other ways to hear nothing:** a blind spot in these rules; a mistake in the health code; an alert suppressed
  at the provider; the phone unavailable; the both-removed configuration case (3.5).
- **A wrong picture that passes validation.** No monitor looks at pictures.
- **One provider** is a single point for the alarm. Accepted as a stated limitation (M4).

## 8. Costs

- **Money:** none found. GPT's reading of UptimeRobot's current terms and Free-plan help page: commercial and
  personal use permitted, 50 monitors, five-minute checks, fair-use policy applies. **The account is on the Free
  plan and has nine monitors** (section 12); this adds two.
- **Hub load, nominal:** two addresses every five minutes is 576 requests a day. Confirmation probes, retries and
  anyone else requesting the public addresses add to that. Each request reads the trial's rows through an index,
  bounded as in 3.6, and no object storage. **D1 rows read and CPU per request are to be measured on the
  candidate, not assumed small.**
- **The health code makes no request to EUMETSAT, no admin action, no collection, no cleanup, no write.** Answers
  are `no-store`; HEAD and GET give the same verdict.
- **A hub change before Stage D (M2):** built on the then-live hub (0.6.22 from its branch, not main's older
  file). The candidate packet shows a health-only difference, the collector and control paths byte-for-byte
  unchanged, the regression suites, and the measured overhead. Stage C carries forward as evidence about the
  collector if those checks hold. It says nothing about the new addresses or the alert path.

## 9. Bounded tests (none run; each live part on its own line)

1. **Offline, on the branch,** production functions against a fake clock and fake rows:
   - every row of the state table, and each precedence boundary (gate `1` with no window; unknown gate after the
     window; exactly `FROM` + `ALLOW`; exactly `LAST`);
   - slots: exact mark; the exact s + 20 minutes boundary; repeats; an earlier trial's row; a late row resolving
     an overdue slot; **a manual-looking row on an exact mark, recorded as the known blind spot**;
   - streaks: **an early failure followed by slots not yet due (no finding)**; incomplete slots across the end
     of the window; each of c3, c6, c8 and its near misses;
   - **mixed good and bad repeats in one slot:** refusal then success (still `refused`); success after the due
     time (does not set `current`); `superseded` rows;
   - **failure, then a good run, then the next poll: still 503**; a failure in the last slot: 503 after the window;
   - truncation at the row limit, an unrecognised phrase, unreadable rows, exceptions: each 503;
   - **startup:** a storage stop recorded before any slot is due (503); an unrecognised row at startup (503); a
     read failure at startup (503); a merely missing first completion at startup (200);
   - **pause limits, documented as such:** a short pause that misses no slot (green; no trace); a paused slot
     completed late (finding clears);
   - **read horizon:** a slot completed by a good row, then a storage-stop repeat after `UNTIL` + 24 hours (not
     seen; documented); a good row frozen out at the slot's due time, at equality and one millisecond after;
   - **HEAD and GET give the same verdict; every answer is `no-store`; the health path makes no upstream request,
     no write, no collection** (asserted by the suite, not only stated);
   - deliberate breaks, each caught.
2. **Live, after deploy, gate still `manual` and no window:** both addresses answer 200 `no trial configured`;
   the eight existing ones as before; deployed hash equals the built file; nothing under `earthview/` changed;
   D1 rows read and CPU per health request measured.
3. **Monitor wiring, read-only:** after the two monitors are created, their address, interval, method, statuses
   and contacts are read back from the account, with the eight.
4. **Generic delivery, Mac closed:** one temporary monitor "TEST delete" on a hub health address that answers 404
   by design. Chad records phone and email times; the monitor is deleted. Proves delivery that day. **Does not
   prove the two real monitors' wiring or the new 503 path.**
5. **Optional, GPT's suggestion: a live true positive without touching collection.** A disposable Worker holding
   the **exact production health functions** and fixed fake rows, with no bindings, answering a real 200, then a
   real 503 at a set time, then 200 again. Two temporary monitors point at it. With the Mac closed, Chad records
   the down alert and the recovery. Then the Worker and the monitors are deleted. **This is decision M6.**

**If 5 is not chosen,** the evidence put to Chad is: offline logic, the deployed healthy path, generic delivery,
and verified wiring of the real monitors. **The live true-positive path of the new checks is then untested. It is
not impossible to test safely.** Rev 1 was wrong to say so.

## 10. What changes elsewhere if this is adopted

- Proposal rev 2.2 section 5.5 and the runbook's sections 2 and 3.2 are rewritten: no hourly heartbeat push, no
  "90 minutes without a push" duty; three named daytime reads by Claude for the ledger and the uncovered
  conditions. **The old duties are retired only when the replacement has been tested and the revised runbook
  accepted.**
- The pause procedure gains one line (the pause itself raises a "not collecting" alert). The closeout gains one
  step (remove the window variables after review).
- Rehearsal amendment A1 is not run.
- The Stage D line states section 7's exposure in words. Stage D keeps its own line.

## 11. Decisions

**Decided by Chad, his own message in the thread, 23 Nov 2026 (recorded 11:28 UTC, clock reading): "M1 to M8 yes".**
All eight stand as in the table's "Claude proposes" column. These are decisions on the design. **They authorise no
action:** the build is branch work on his go after GPT's check of rev 3; the deploy, the two monitors, the fixture
test and the deletion under M8 each need his own Approve line.

History of this section: rev 2 recorded M1 to M4 as his choices when they were GPT's recommendations; rev 3
corrected that; his own line then followed.


| # | Question | GPT recommends | Claude proposes |
|---|---|---|---|
| M1 | Develop this in place of heartbeat pushes and silence-noticing? | Yes | Yes |
| M2 | A hub redeploy before Stage D, on section 8's terms? | Yes in principle | Yes |
| M3 | Three daytime reads by Claude, on a revised Stage D basis accepting section 7? | Yes, three | Yes |
| M4 | A second monitoring company? | Not by default | No |
| M5 | Alert on one overdue slot, or three in a row? | One | One |
| M6 | The disposable fixture test (9.5), on its own later line and reviewed plan? | Yes | Yes |
| M7 | Read times | 07:00, 13:00, 20:00 SAST if they suit Chad; 11-hour overnight gap stated | The same |
| M8 | Delete the leftover "ME alert test" monitor (section 12)? A settings change, on Chad's own line | not yet seen by GPT | Yes |

## 12. The UptimeRobot account, read 23 Nov 2026 (signed in by Chad; read-only; nothing changed)

Read through the dashboard pages between about 11:10 and 11:25 UTC. Edit forms were opened to read their
settings and left without saving.

- **Plan: Free** (the dashboard says so). No maintenance window exists. No chat or webhook integration is added.
- **Nine monitors, none paused: 8 Up, 1 Down.**

| Monitor | Address under the hub | Interval | E-mail | Push (iPhone) | SMS, voice | State |
|---|---|---|---|---|---|---|
| ME runs usgs | `/health/runs/usgs` | 5 min | on | on | off | Up 16 days |
| ME runs firms | `/health/runs/firms` | 5 min | on | on | off | Up 16 days |
| ME publication usgs | `/health/publication/usgs` | 5 min | on | on | off | Up 16 days |
| ME publication firms | `/health/publication/firms` | 5 min | on | on | off | Up 3 days 23 h |
| ME archive usgs | `/health/archive/usgs` | 5 min | on | on | off | Up 16 days |
| ME archive firms | `/health/archive/firms` | 5 min | on | on | off | Up 16 days |
| ME coverage usgs | `/health/coverage/usgs` | 5 min | on | on | off | Up 16 days |
| ME coverage firms | `/health/coverage/firms` | 5 min | on | on | off | Up 16 days 11 h |
| **ME alert test** | `/health/test/firms` (404 by design) | 5 min | on | on | off | **Down since 6 Nov 18:21 SAST, incident still open** |

- **Alert timing on every contact: "No delay, no repeat".** One notification when an incident opens; none while
  it stays open.
- **Read on one monitor ("ME runs usgs") and assumed the same on the others, which were not opened that far:**
  request timeout 30 seconds; follow redirections on; up status codes 2xx and 3xx, changeable only on a paid plan;
  HTTP method changeable only on a paid plan; location default; region shown as Europe.
- **Method, from the hub's side:** in 12 minutes to 11:24 UTC the hub logged 18 requests to `/health/…` with
  UptimeRobot's user agent, all **HEAD**: two or three to each of the eight (200) and one to the test address
  (404). So the monitors are polling now, by HEAD.
- **Incidents on record (five):** `coverage/firms` 6 Nov 18:00 to 7 Nov 02:04 SAST; the alert test, twice, 6 Nov;
  `publication/firms` 7 Nov 02:39 to 05:47; **`publication/firms` 19 Nov 06:36 to 14:02 SAST, 7 hours 26 minutes.**
- **Not read:** how many failed checks open an incident (not shown on the pages read); the alert contact's own
  page (whether the email is verified, which device holds the push); the billing page; whether any alert was
  seen or acted on at the time.

**What this adds to the picture**

1. The existing watcher is real and current: enabled, polling by HEAD, email and phone push selected.
2. **"ME alert test" is a leftover.** It has shown Down for 16 days, polls the hub 288 times a day, and keeps the
   account's summary at "1 Down". Because alerts do not repeat, it is silent. It is harmless and it is clutter:
   **M8** proposes deleting it. A fresh delivery test (9.4) needs a new down event in any case.
3. **"No repeat" matters for Stage D.** One alert, once. If it is missed, nothing reminds. The incident stays
   open on the dashboard and in the app.
4. **An alert being sent is not an alert being acted on.** The 19 Nov incident stayed open for over seven daytime
   hours. Whether that was noticed is not recorded and is not assumed. It is the same exposure section 7 names.
5. On the Free plan a 503 is "down" and nothing needs configuring to make it so.

**"ME alert test": deletion approved by Chad on 23 Nov, attempted, and NOT done. Corrected 14:02 UTC (clock reading).**

Chad's line: "Approve: delete the UptimeRobot monitor "ME alert test" (the leftover 404 test from 6 Nov); no other
monitor or setting changed".

- **Preserved first** (read 11:35 UTC): address `/health/test/firms`; HTTP monitor, 5-minute interval; E-mail and
  iPhone push selected, SMS and voice off; region Europe; no status page; two incidents, both 404 Not Found:
  6 Nov 18:11:54 to 18:18:45 SAST (6 min 51 s) and 6 Nov 18:21:57 SAST, still open.
- **Attempt, about 11:36:55 UTC:** the monitor's menu, "Delete monitor", and the confirmation's Delete button were
  pressed while the browser pane was not in view. **The deletion did not take effect.**
- **What Claude then wrote was wrong.** An earlier version of this section and of STATUS said the monitor was
  deleted and that the hub's log confirmed it, because one poll expected about 11:39 had not arrived. **That
  inference was unsound:** this monitor's polls are irregular while it is down (the hub's log shows 11:33:57,
  11:46:57, 12:01:10, and later 13:43:33, 13:53:40). One missing poll proved nothing.
- **Read 14:00 UTC:** the dashboard lists nine monitors, "ME alert test" Down, 1 Down and 8 Up; the hub is still
  being polled at `/health/test/firms`. A second attempt at 14:01 could not be completed: the pane went out of
  view again and the confirmation did not open.
- **State now: nine monitors, exactly as read at 11:10 to 11:25 UTC. Nothing in the account has changed.** The
  deletion stays approved and outstanding; it is done only with the pane in view, and read back in the dashboard
  before it is reported.


## 13. Review points and where they went

### Rev 1 review (GPT, 23 Nov)

| GPT's point | Answer |
|---|---|
| 1. Resolve the exact evidence first; no "narrow later" | Section 2 (fields, phrases, what each row establishes); 3.4 (what cannot be decided) |
| 1. Scheduled time is not completion time; name the freshness | 3.1: "slot completion" |
| 1. Exclude manual, Stage C and earlier-trial rows; do not count repeats as slots | 3.1 |
| 1. Why 35 minutes; exact inequality; delayed and still-running runs; "completion missing", not a cause | 3.1: 20 minutes, derived; overdue rule; late rows resolve; no cause named |
| 2. State table, malformed configuration, last slots, expiry is not recovery, pause is not recovery, residual limitation | 3.5 and 3.7 |
| 3. Stop conditions must not vanish between polls; no health writes; reset and identity; tests | 3.3, 3.4, 3.7; tests in 9.1 |
| 4. Read the real monitor configuration | Done in rev 3: section 12 |
| 4. no-store, HEAD equals GET, nothing secret, no collection; load measured, not assumed | Section 8 |
| 4. The timing is an estimate, not a bound | Section 5 |
| 5. A live positive need not break collection; fixture option; "untested", not "impossible" | 9.5, M6 |
| 6. What depends on the thread; "if a later read takes place"; polling is not a monitor of the watcher; "both must fail" too strong | Section 7 |
| M1 to M4 | Section 11 |
| Free plan terms | Section 8, attributed to GPT's reading |

### Rev 2 review (GPT, 23 Nov) and where each point went

| GPT's point | Answer |
|---|---|
| A manual request can land exactly on a mark; the row cannot tell | 3.1: stated as a blind spot; operational ban, the thread's log reads, a documented test case; a provenance field not proposed here |
| A successful duplicate must not mask a qualifying failure; define c6; superseded; c8's evidence; mixed fixtures | 3.3 (flags; a good row never removes a bad flag; `superseded` sets `current`, not "published"); 3.4 (c6 reading chosen and why); 9.1 |
| Only elapsed slots may build a streak; boundaries | 3.2; 9.1 |
| State table exhaustive, precedence explicit | 3.5 |
| Row limits are not slot limits; bound the query; fail closed on truncation and unrecognised outcomes; no raw note in public answers | 3.6; 3.4 last bullet |
| The account read is a real precondition | Done: section 12 |
| Closeout: preserve evidence first; a new window must not hide a result | 3.7 |
| M1 to M4 provenance | Section 11 |
| M5, M6, M7 | Section 11, as recommendations |

### Rev 3 review (GPT, 23 Nov) and where each point went

| GPT's point | Answer in rev 3.1 |
|---|---|
| 1. Startup grace must not mask a recorded adverse result or unreadable evidence | 3.5 row 7 and the bullet under the table; fixtures in 9.1 |
| 2. Narrow the pause-history guarantee; no claim that a pause is always visible; ledger carries it | 3.5; 3.7; fixtures in 9.1 |
| 3. The 24-hour horizon can exclude late bad evidence too | 3.6; fixture in 9.1; carried to the Stage D basis and closeout |
| Settings read on one monitor and assumed on the others | Section 12 already says so; the two new monitors are read back in full (test 3) |
| Contact and device details, confirmation count unknown; the fixture test supplies current delivery evidence | Section 12 "not read"; test 5 |
| "No delay, no repeat": one opportunity to notice | Section 12; to be stated in the Stage D basis |
| Prove HEAD equals GET, no-store, no collection or writes in the health path | 9.1 |
| M8: delete the stale test monitor after preserving its settings and incidents | Approved by Chad; **attempted and not done**; outstanding (section 12, last paragraph) |

## 14. Sources

- `phase1/worker.js` at `earth-from-space-rc` (0.6.22): `logRun`, `guarded`, `evAdmit`, `evMark`, `evCollect`,
  `evFail`, `evFetch`, the Health section, the five-minute job; `phase1/schema.sql`.
- Cloudflare Workers limits page (wall time of a scheduled invocation), read 23 Nov 2026.
- `HANDOVER.md`, `STATUS.md` on main (UptimeRobot set up 6 Nov).
- The twelve health addresses, read 23 Nov 10:52 UTC.
- GPT's three reviews, with its list of UptimeRobot primary pages.
- The UptimeRobot dashboard, signed in by Chad, read 23 Nov 2026; the hub's request log for the same minutes.
