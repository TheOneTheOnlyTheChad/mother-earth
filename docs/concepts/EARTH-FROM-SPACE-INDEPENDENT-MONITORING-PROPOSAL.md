# Earth from Space — monitoring independent of the thread, the Mac and the browser login: proposal rev 2 (23 Nov 2026) — docs only

**Rev 2, 23 Nov 2026 11:05 UTC (clock reading),** after GPT's review of rev 1
(`reviews/2026-11-23-earth-from-space-independent-monitoring-proposal-gpt-review.md`) and Chad's choices relayed
with it: **M1 yes to the direction; M2 a redeploy in principle; M3 three sustainable daytime reads on a revised
basis; M4 no second provider.** Section 13 maps each review point to its answer. Rev 1 was written the same day on
Chad's go ("draft a docs-only proposal for monitoring Earth from Space independently of this thread, the Mac and
browser login…").

**Nothing here is built, deployed, configured or approved. It does not clear Stage D.** Reads made for it were of
the repo's code and of public addresses.

**Two things rev 2 could not do, both waiting for Chad at the Mac (section 12):** read the UptimeRobot account's
actual configuration, and read UptimeRobot's own help pages. The plan terms below are therefore **GPT's reading of
UptimeRobot's primary pages**, not Claude's.

## 0. In short

- The hub already has an independent watcher: UptimeRobot polls eight public health addresses every five minutes.
  It watches earthquakes and fires only. **Whether those eight monitors are enabled with a phone alert attached
  today has not been read** (section 12).
- **Proposal:** two read-only health addresses for Earth from Space and two more monitors. Healthy is silent.
- **What rev 2 changes:** the checks are defined **slot by slot over the whole trial**, from the records that
  actually exist, so that a failure stays visible after a later good run and after the window ends; the trial
  states are in one table; the tolerance is derived, not asserted; the dependence on the thread is stated as a
  weakening.
- It detects. It cannot pause. It does not see everything (section 7).

## 1. Existing monitoring, assessed

| What | Independent of thread, Mac, login? | Covers Earth from Space? | State |
|---|---|---|---|
| **UptimeRobot, 8 monitors** on `/health/<check>/<layer>`: runs, publication, archive, coverage × `usgs`, `firms` | Yes | **No.** The four `earthview` addresses answer 404 (read 10:52 UTC, 23 Nov) | Set up 6 Nov; phone alert tested then with the Mac closed; a real `publication/firms` alert on a later night (project records). The eight addresses answered 200 at 10:52 UTC. **A 200 from an address does not show that its monitor is enabled or that a phone alert is attached. The account was not read** |
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
- **Rows that cannot refresh the trial:** a manual run's row (its `started_at` is not a ten-minute mark; a manual
  run during the trial is itself stop condition 9); Stage C's row and any earlier trial's rows (their times are
  outside this window).

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

### 3.2 Slot outcome (used for the stop conditions)

For a complete slot, from its rows: **published** if any row is a published or superseded row; else **nothing
newer** if any row says so; else **storage stop**, **validation refused**, **post-check failure**, **source check
failed**, **guard refused** or **internal error** by the phrase of its row (if several rows disagree, the first in
this order that applies).

### 3.3 The two checks, evaluated over the whole trial

Both read every Earth from Space row of the current trial on each poll: rows with `finished_at` ≥ `FROM`, through
the existing `(layer, finished_at)` index, then matched to slots. At most a few hundred rows.

| Address | 503 when, for the current trial | Stays 503 |
|---|---|---|
| `/health/runs/earthview` | any due slot is overdue; or the configuration is in a failing state (3.4) | until that slot becomes complete, or the trial is closed out |
| `/health/trial/earthview` | **(c3)** any slot's rows include a storage stop; **(c6)** any three consecutive slots are each *validation refused*; **(c8)** any six consecutive slots contain no *published* and no *nothing newer* slot and at least one slot whose row shows the source listing a newer frame (post-check failure or validation refused) | **until the trial is closed out. A later good run does not clear it** |

- **This is the answer to "a failure must not vanish between polls".** The checks do not ask "does the latest run
  look bad". They ask "has this happened anywhere in this trial's records". Nothing is written by a health
  request and nothing in collection changes to support it: the records are already kept.
- **What cannot be decided from the rows, and is therefore not claimed:**
  - c6 and c8 across an overdue slot: an overdue slot has no outcome. It **breaks** a c6 streak and counts as "not
    published" in c8. The overdue slot is itself alarming on the other address.
  - c8 when every row in the six is `source check failed`, `internal error`, a guard refusal or a storage stop:
    none shows the source listing a newer frame, so c8 does not fire. A source outage is recorded, not alarmed.
  - `internal error`: where the run failed is not in the row.
  - "The frame held" at each moment is taken from the rows' own words, not re-read from storage.
- The body carries the state, the counts, and for each finding the slot time and the fixed phrase only. No raw
  note text beyond what the existing checks already publish (cut to 160 characters, secrets removed).

### 3.4 States

`ALLOW` is 20 minutes. "Closed out" means the two window variables have been removed (3.5).

| # | Gate | Window variables | Clock | `runs` | `trial` | Body state |
|---|---|---|---|---|---|---|
| 1 | unset or `manual` | none | any | 200 | 200 | `no trial configured` |
| 2 | any other value | any | any | **503** | **503** | `gate has an unknown value` |
| 3 | any | only one set; or unreadable; or `UNTIL` ≤ `FROM`; or longer than 48 hours | any | **503** | **503** | `window not readable` |
| 4 | `1` | valid | before `FROM` | 200 | 200 | `armed, starts <FROM>` |
| 5 | `1` | valid | `FROM` to `FROM` + ALLOW | 200 | by its rules | `starting` (no slot is due yet) |
| 6 | `1` | valid | active, slots due | by 3.3 | by 3.3 | `active` |
| 7 | not `1` | valid | before the last slot is due | **503** | by 3.3 | `trial window set but not collecting` |
| 8 | any | valid | after `UNTIL`, last slot not yet due | by 3.3 | by 3.3 | `ending` |
| 9 | any | valid | every slot due, none overdue, no finding | 200 | 200 | `trial complete, nothing outstanding` |
| 10 | any | valid | every slot due, something overdue or found | **503** as applies | **503** as applies | `trial ended with outstanding findings` |

- **Row 7 is deliberate.** A pause (gate to `manual`, window left as it is, exactly the pause procedure) answers
  503 "not collecting". **A pause is therefore never reported as a recovery,** and a gate switched off by mistake
  during a trial raises an alert. Chad gets one alert when Claude pauses; that is the intended notice.
- **Rows 8 to 10 are the closeout.** The last slots are judged after `UNTIL` like any others. **The window ending
  is not evidence of recovery:** findings stay 503 until closeout.
- **Residual limitation, stated:** if the gate and both window variables are removed together during a trial, by
  mistake, the state is row 1 and the checks are silent. The configuration alone cannot tell that from a trial that
  was never set. This is not an armed-trial watchdog in that one case.
- Unreadable or malformed configuration is never healthy (rows 2 and 3), matching the collector, which admits
  nothing in those cases.

### 3.5 Acknowledgment, reset and trial identity

- **A trial is identified by its `FROM` and `UNTIL` values.** Rows are in or out of it by their times.
- **There is no acknowledge button and no health write.** Findings are acknowledged by **closing the trial out**:
  removing the two window variables in the dashboard, on Chad's line, after the result has been reviewed. The
  checks then answer row 1. UptimeRobot will report "up" at that point; it means "closed out", and the result
  document says what was outstanding.
- **Pause and resume inside one window:** the slots that passed while paused are overdue and stay so. `runs`
  stays 503 for the rest of that trial. That is accurate: those slots did not complete. A restart after a pause is
  a new decision and, if wanted clean, a new window.
- **A new window is a new trial.** Earlier findings are outside it.

## 4. At UptimeRobot (a settings change, later, on its own line)

Two monitors, "ME runs earthview" and "ME trial earthview", with the same settings as the existing eight **once
those have been read** (section 12): method, interval, timeout, confirmation, accepted statuses, contacts, and the
phone alert selected on each. GPT's reading of UptimeRobot's help pages: push is available on the Free plan and
must be selected per monitor.

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
  at the provider; the phone unavailable; the both-removed configuration case (3.4).
- **A wrong picture that passes validation.** No monitor looks at pictures.
- **One provider** is a single point for the alarm. Accepted as a stated limitation (M4).

## 8. Costs

- **Money:** none found. GPT's reading of UptimeRobot's current terms and Free-plan help page: commercial and
  personal use permitted, 50 monitors, five-minute checks, fair-use policy applies. Eight monitors are in use
  by the project's records; this adds two. **This account's own plan and contacts are unread** (section 12).
- **Hub load, nominal:** two addresses every five minutes is 576 requests a day. Confirmation probes, retries and
  anyone else requesting the public addresses add to that. Each request reads the trial's rows through an index
  (at most a few hundred by the end) and no object storage. **D1 rows read and CPU per request are to be measured
  on the candidate, not assumed small.**
- **The health code makes no request to EUMETSAT, no admin action, no collection, no cleanup, no write.** Answers
  are `no-store`; HEAD and GET give the same verdict.
- **A hub change before Stage D (M2):** built on the then-live hub (0.6.22 from its branch, not main's older
  file). The candidate packet shows a health-only difference, the collector and control paths byte-for-byte
  unchanged, the regression suites, and the measured overhead. Stage C carries forward as evidence about the
  collector if those checks hold. It says nothing about the new addresses or the alert path.

## 9. Bounded tests (none run; each live part on its own line)

1. **Offline, on the branch,** production functions against a fake clock and fake rows. Every row of the state
   table. Slot rules: exact mark, duplicate rows, a manual row, an earlier trial's row, a late row resolving a
   slot. Each of c3, c6, c8 and its near misses. **Failure, then a good run, then the next poll: still 503.**
   **A failure in the last slot before `UNTIL`: 503 after the window.** Unreadable rows and exceptions: 503.
   Deliberate breaks, each caught.
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

Chad's, as relayed 23 Nov: **M1 yes** (develop this in place of heartbeat pushes and silence-noticing). **M2 yes
in principle** (redeploy, on the terms in section 8). **M3 three sustainable daytime reads**, on a revised Stage D
basis that accepts section 7. **M4 no second provider.**

New in rev 2:

- **M5.** Alert on **one** overdue slot (proposed), or only on three in a row as in rev 1?
- **M6.** Include test 5, the disposable fixture, on its own later line? Proposed: yes; it is the only live proof
  that a 503 from these functions reaches the phone.
- **M7.** The three read times. Proposed 07:00, 13:00 and 20:00 SAST; Chad to say what he can sustain.

## 12. Not done in rev 2, and what it needs

- **The UptimeRobot account was not read.** It needs Chad's sign-in in the browser pane and his go to open the
  site there. To read, read-only: the monitors' addresses, enabled state, interval, method, timeout, confirmation
  and accepted statuses, alert delay, contacts and whether push is selected on each, maintenance windows, and any
  open incident. **Until then, section 1's "existing watcher" is the project's record of 6 Nov, not today's
  reading.**
- **UptimeRobot's help and terms pages were not read by Claude** (the fetch needed an approval while Chad was
  away). The terms quoted are GPT's reading of the primary pages listed in its review.

## 13. Review points and where they went

| GPT's point | Answer |
|---|---|
| 1. Resolve the exact evidence first; no "narrow later" | Section 2 (fields, phrases, what each row establishes); 3.3 (what cannot be decided) |
| 1. Scheduled time is not completion time; name the freshness | 3.1: "slot completion" |
| 1. Exclude manual, Stage C and earlier-trial rows; do not count repeats as slots | 3.1 |
| 1. Why 35 minutes; exact inequality; delayed and still-running runs; "completion missing", not a cause | 3.1: 20 minutes, derived; overdue rule; late rows resolve; no cause named |
| 2. State table, malformed configuration, last slots, expiry is not recovery, pause is not recovery, residual limitation | 3.4 and 3.5 |
| 3. Stop conditions must not vanish between polls; no health writes; reset and identity; tests | 3.3, 3.5; tests in 9.1 |
| 4. Read the real monitor configuration | **Not done**; section 12 |
| 4. no-store, HEAD equals GET, nothing secret, no collection; load measured, not assumed | Section 8 |
| 4. The timing is an estimate, not a bound | Section 5 |
| 5. A live positive need not break collection; fixture option; "untested", not "impossible" | 9.5, M6 |
| 6. What depends on the thread; "if a later read takes place"; polling is not a monitor of the watcher; "both must fail" too strong | Section 7 |
| M1 to M4 | Section 11 |
| Free plan terms | Section 8, attributed to GPT's reading |

## 14. Sources

- `phase1/worker.js` at `earth-from-space-rc` (0.6.22): `logRun`, `guarded`, `evAdmit`, `evMark`, `evCollect`,
  `evFail`, `evFetch`, the Health section, the five-minute job; `phase1/schema.sql`.
- Cloudflare Workers limits page (wall time of a scheduled invocation), read 23 Nov 2026.
- `HANDOVER.md`, `STATUS.md` on main (UptimeRobot set up 6 Nov).
- The twelve health addresses, read 23 Nov 10:52 UTC.
- GPT's review, with its list of UptimeRobot primary pages.
