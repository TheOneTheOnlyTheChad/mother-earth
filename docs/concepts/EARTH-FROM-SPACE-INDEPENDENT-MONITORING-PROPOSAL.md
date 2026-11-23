# Earth from Space — monitoring independent of the thread, the Mac and the browser login: proposal (23 Nov 2026) — docs only

Written 23 Nov 2026 10:53 UTC (clock reading), on Chad's go of 23 Nov: "draft a docs-only proposal for monitoring Earth
from Space independently of this thread, the Mac and browser login. Routine success should be recorded without phone
pushes; alerts should cover failures and missing expected runs. Include how the watcher's own failure is detected,
what remains uncovered, costs and a bounded test. Assess existing monitoring first. No implementation, settings
changes or Stage D yet."

**Nothing here is built, deployed, configured or approved.** Reads made for it were public and read-only.

## 0. In short

- **The hub already has an independent watcher.** UptimeRobot polls eight public health addresses on the hub every
  five minutes and alerts Chad by email and on his phone. It needs no Mac, no Claude thread and no login. It was
  set up on 6 Nov and its phone alert was tested then with the Mac closed. **It watches earthquakes (`usgs`) and
  fires (`firms`) only. Nothing in it watches Earth from Space.**
- **Proposal:** give Earth from Space the same treatment. Two new read-only health addresses on the hub, and two
  more UptimeRobot monitors. A healthy check sends nothing; it is only logged. A failing or missing run turns the
  address to 503 and UptimeRobot alerts.
- **Cost:** no money found. It does need **a hub code change and a deploy** before Stage D, which is the real
  price (section 7).
- **It does not replace everything.** It detects; it cannot pause. Several stop conditions stay uncovered
  (section 6). The watcher's own failure has no fully independent detector (section 5).
- If adopted, the hourly heartbeat pushes, Chad's "notice the silence" duty and rehearsal amendment A1 are no
  longer needed in their present form.

## 1. Existing monitoring, assessed

| What | Independent of thread, Mac, login? | Covers Earth from Space? | State |
|---|---|---|---|
| **UptimeRobot, 8 monitors** on `/health/<check>/<layer>`: runs, publication, archive, coverage × `usgs`, `firms`. HEAD every 5 minutes; email and iPhone alert | **Yes** | **No.** `/health/…/earthview` answers 404 for all four checks (read 10:52 UTC today) | Live since 6 Nov (hub 0.5.3). All eight answered 200 at 10:52 UTC today. A real alert fired for `publication/firms` on a later night and cleared itself (STATUS). **UptimeRobot's own dashboard was not read for this proposal** |
| Hub's own records: `collector_runs` in D1, `/status`, Workers logs | Records, not alerts | Yes: every admitted Earth from Space run is recorded (`run-start`, `run-end`, a `collector_runs` row) | Live |
| Cloudflare email monitor on invocation failures | Yes | Would have | **Tested 23 Nov, not reliable** (one email for two recorded failures). None exists |
| Claude's hourly inspection through the dashboard tab | **No**: needs the Mac awake, the app open, the tab signed in, the thread alive | Yes, in detail | Rehearsed 23 Nov: inspections and gap detection worked |
| Chad noticing a missing heartbeat | No | n/a | **Rehearsed 23 Nov: failed** |

Two facts from the hub's code that matter here:

- The health checks' rules are already written down in the code: the verdict is the HTTP status (200 healthy, 503
  failing, 404 no such check); **fail closed** (an exception, a missing table, no rows or an unreadable time is a
  503); read-only; no secret in the answer; one check per address so one open incident cannot hide another.
- Earth from Space rides the five-minute trigger and starts **after** the `usgs` collector has finished and been
  recorded. So an invocation ended for CPU or memory during a picture run does **not** remove that slot's `usgs`
  record. **The existing eight monitors would not notice it.** They would notice the whole hub going down.

## 2. What is proposed

### 2.1 On the hub: two new read-only checks (a code change, later, on its own line)

Both follow the existing rules exactly. Both know the admission window, so they are silent when nothing is meant
to run.

| Address | Fails (503) when | Catches |
|---|---|---|
| `/health/runs/earthview` | Earth from Space is scheduled now (gate `1`, time inside `FROM` to `UNTIL`) **and** no Earth from Space run has finished for 3 slots plus 5 minutes (35 minutes) | **Missing expected runs:** triggers stopped; every run dying before it is recorded, which is how an invocation ended for CPU or memory shows up; the hub not answering at all (a non-200 is "down" to the monitor) |
| `/health/trial/earthview` | Scheduled now **and** the recorded runs show stop condition 3 (a storage stop on the latest run), 6 (three consecutive validation refusals) or 8 (no frame published for six consecutive slots while source checks list a newer one) | **Failures that end with a record** |

- **When not scheduled** (gate unset or `manual`, before `FROM`, after `UNTIL` plus the same margin): both answer
  **200 with `state: not scheduled`** in the body. Otherwise the monitors would alert for ever outside a trial.
  The price: the check cannot tell "switched off on purpose" from "switched off by mistake". Nothing runs in
  either case.
- The first 35 minutes after `FROM` are allowed for the first run to finish.
- A source outage alone (EUMETSAT not answering) is not a stop condition and does not fail either check; it is
  recorded slot by slot as now.
- **To be confirmed in the candidate packet:** that `collector_runs` carries enough to decide conditions 6 and 8
  exactly. If it does not, the check is narrowed to what the records support and the gap is listed, not guessed.

### 2.2 At UptimeRobot: two more monitors (a settings change, later, on its own line)

"ME runs earthview" and "ME trial earthview": HEAD, every 5 minutes, the same alert contacts as the eight. Ten
monitors of the plan's fifty.

### 2.3 What Chad sees

- **Healthy: nothing.** No push, no email. UptimeRobot logs each check; the hub records each run.
- **Failing: one alert** by email and on the phone, naming the monitor. A second message when it recovers.
- **Worst-case time to alert for a stopped trial:** 35 minutes for the check to turn, up to 5 minutes to the next
  poll, plus UptimeRobot's own confirmation and delivery. **About 40 to 45 minutes; a planned figure, not a
  guarantee, and not measured.**

### 2.4 What happens to the thread's inspections

They stop being the alarm. Proposed: Claude reads the records two or three times a day, with no heartbeat push,
to keep the slot-by-slot ledger and to check the stop conditions the health checks cannot see (section 6). A
missed read then delays the ledger, not the alarm. The exact pattern belongs in the Stage D runbook revision.

## 3. Routine success, recorded without pushes

| Record | Where | Kept |
|---|---|---|
| Each health poll and its result | UptimeRobot's log for each monitor | 3 months on the Free plan, as reported (section 7) |
| Each admitted run | `collector_runs` (D1); `run-start` and `run-end` log lines | D1: until removed. Workers logs: retention **not checked for this proposal** |
| The trial's ledger | the Stage D result, from the records above | repo |

## 4. Alerts: failures and missing expected runs

| Event | Detected by | Notes |
|---|---|---|
| Triggers stop arriving | `runs/earthview` | within about 45 minutes |
| A picture run's invocation ended for CPU or memory | `runs/earthview`, **only if it keeps happening**: three slots in a row with no finished run | **A single ended invocation among good ones is not detected.** Stop condition 1 says pause on any |
| Hub unreachable or erroring | all ten monitors | existing |
| Storage stop; repeated validation refusals; no new frame while the source has one | `trial/earthview` | conditions 3, 6, 8 |
| `usgs` or `firms` stop running or publishing | the existing eight | part of condition 7 |

## 5. The watcher's own failure

Stated plainly: **there is no fully independent detector of UptimeRobot failing.** What exists and what is
proposed:

1. **Proof before the trial** that the alert path works end to end with the Mac closed (section 8, test 3).
2. **The hub can see whether it is being polled.** Every poll is a request in the hub's own logs. Claude's reads
   (section 2.4) include "the two Earth from Space addresses were requested about twelve times in the last hour".
   If the polls have stopped, that read says so and Chad is told. **This check depends on the thread and the Mac,**
   so it is a second watcher, not an independent one.
3. **Two watchers of different kinds.** UptimeRobot watches the hub; the thread, when alive, watches both the
   hub and UptimeRobot's polling. Silence about a real problem needs both to fail in the same hours.
4. **UptimeRobot's own notices:** account or service problems reach Chad by its emails, if it sends them. Not
   relied on.

Options not recommended for a 48-hour trial, listed so the choice is visible:

- A second external monitor from a different company on the same two addresses. Removes the single point; adds an
  account and more alerts to manage.
- A dead-man's-switch service that the hub would call after every good run (for example Healthchecks.io, whose free
  plan is reported as 20 checks). It would catch missing runs natively. It needs an outgoing request and a secret
  address inside the very invocation being measured, so it changes the thing under test.

## 6. What remains uncovered

- **The pause.** An alert reaches Chad; **nothing pauses the trial by itself.** He pauses from his phone in the
  Cloudflare dashboard (signed in there), or Claude does if the thread is alive and his Stage D line allows it.
  An alert at 02:00 is acted on when he sees it. The overnight exposure is the same as before, with this
  difference: there is now an alert waiting.
- **Stop condition 1 for a single event, 2, 4, 5, 9** (one resource ending; any other non-ok ending; a picture's
  bytes differing from its record; CPU at or above 5,000 ms; a request-budget excess) and **condition 7 for layers
  other than `usgs` and `firms`.** These need the invocation records and logs, which only the thread's reads see.
  They would be found at the next read, not by an alarm.
- **A wrong picture that passes validation.** No monitor looks at pictures.
- **A watcher that fails silently while the thread is also dead** (section 5).
- **Chad not seeing the alert** (phone off, silenced, no signal).
- **The live true positive of the new checks.** The offline suite can prove the logic; making the live check fail
  on purpose would mean running or breaking real collection, so it is not proposed (section 8).
- The 35-minute allowance itself: up to about 45 minutes of a stopped trial before anyone is told.

## 7. Costs

- **Money:** none found. UptimeRobot's pricing page lists the Free plan at $0 with 50 monitors at a 5-minute
  interval (uptimerobot.com/pricing, read 23 Nov 2026); eight are in use. **Reports conflict on whether the Free
  plan's terms allow commercial use** (some say personal use only since December 2024; its pricing page now reads
  "personal and commercial"). Mother Earth earns nothing, but the terms page should be read before relying on it.
- **Hub load:** two more addresses polled every 5 minutes is 576 requests a day, each a few indexed D1 reads and
  one R2 metadata read. The eight existing monitors already make 2,304 a day. Small against the plan's
  allowances; the usage page is read before and after, as usual.
- **The real cost: a hub change before Stage D.** Today's hub is 0.6.22, the code Stage C ran on. Adding the checks
  makes a new version (0.6.23): branch build, tests with deliberate breaks, GPT's candidate review, Chad's deploy
  line, read-back. The checks sit on the health path and do not touch collection, **but the deployed hash
  changes**, so the candidate packet must show the Earth from Space code is byte-for-byte unchanged, and GPT and
  Chad must agree that Stage C's evidence carries over or name what is repeated.
- **Chad's attention:** two more monitors that can alert. During a trial an alert means "look now". Outside one
  they stay silent by design.

## 8. Bounded test (not run; each part on its own line)

1. **Offline, on the branch:** the two checks against a fake clock and fake records: scheduled and fresh (200);
   scheduled and stale (503); before `FROM`, after `UNTIL`, gate `manual` and unset (200, not scheduled); the
   first 35 minutes (200); each of conditions 3, 6 and 8 (503) and their near misses (200); unreadable records and
   exceptions (503). Deliberate breaks, each caught.
2. **Live, after deploy, gate still `manual`:** both addresses answer 200 "not scheduled"; the eight existing ones
   answer as before; deployed hash equals the built file; nothing under `earthview/` changed. No collection.
3. **Alert path, with the Mac closed:** one temporary UptimeRobot monitor, "TEST delete", pointed at a hub health
   address that answers 404 by design (a check name that does not exist). UptimeRobot reads that as down. Chad
   records when the alert reaches his phone and his email, then deletes the monitor. **This proves delivery today,
   not the new checks' logic.** The hub is not faulted.
4. **Polling seen from the hub:** after the two real monitors are created, a read of the hub's request log shows
   them arriving every five minutes.

Not tested, and said so: a live failing answer from the new checks; overnight response; 48 hours.

## 9. What changes elsewhere if this is adopted

- Proposal rev 2.2 section 5.5 and the runbook's sections 2 and 3.2: the hourly heartbeat push and the "90 minutes
  without a push" fallback are withdrawn; the inspection pattern is rewritten (section 2.4).
- Rehearsal amendment A1 is not run. A short rehearsal of the new arrangement replaces it: test 3 above, plus one
  read by Claude that reports the polling.
- The Stage D approval line states the remaining exposure in words (section 6), in place of D8's present wording.
- Stage D still needs its own line. Nothing here clears it.

## 10. Decisions for Chad

- **M1.** Adopt this direction (extend the existing UptimeRobot monitoring to Earth from Space) in place of
  heartbeat pushes and phone alarms? If yes, the next step is a branch build of hub 0.6.23 for GPT's review.
- **M2.** Accept a hub redeploy before Stage D, with the carry-over of Stage C's evidence to be argued in the
  candidate packet?
- **M3.** How often should Claude read the records during the trial for the ledger and the uncovered conditions:
  two or three times a day is proposed.
- **M4.** A second external monitor from another company (section 5): not recommended for 48 hours. Yes or no.

## 11. Sources read

- Hub code `phase1/worker.js` at `earth-from-space-rc` (0.6.22): the Health section and the five-minute job.
- `HANDOVER.md` and `STATUS.md` on main: UptimeRobot set up 6 Nov, eight monitors, phone alert tested with the
  Mac closed; a later `publication/firms` alert.
- The twelve health addresses, read 23 Nov 10:52 UTC: eight 200, four `earthview` ones 404.
- UptimeRobot pricing page and third-party summaries; Healthchecks.io pricing page (23 Nov 2026).
- `reviews/2026-11-22-earth-from-space-alarm-assessment.md` section 13; `reviews/2026-11-23-earth-from-space-rehearsal-result.md`.
