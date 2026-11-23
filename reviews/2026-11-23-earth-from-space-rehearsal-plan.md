# Earth from Space — monitoring rehearsal plan (23 Nov 2026) — rev 2, for a focused check, NOT started

**Rev 2, 23 Nov 2026 04:25 UTC (clock reading),** after the review relayed by Chad in the thread on 23 Nov (four
mechanics; section 11 lists each and where it went). The test push, the ledger and the identical scheduled messages
were accepted and stand. Proposal rev 2.2 section 5.5 and runbook rev 2 section 2 are the basis.
**Nothing here is approved or scheduled. A rehearsal that is met does not clear Stage D.**

## 0. Basis: no email alarm exists

- The Cloudflare email-alarm exercise is **accepted as unsuccessful**, with cleanup recorded
  (`reviews/2026-11-22-earth-from-space-alarm-assessment.md` section 13).
- So during Stage D **nothing on Cloudflare's side tells anyone about a hub error.** The only detection is Claude's
  hourly inspection, and the only check on the inspections is Chad noticing a missing heartbeat. This rehearsal
  tests those two things and nothing else.

## 1. What the rehearsal is, in one view

Hub state throughout: `EARTHVIEW_ENABLED=manual`, hub 0.6.22. **No change to the hub, no admin call, no key, no
request to EUMETSAT.** All reads are read-only.

Four hourly opportunities. T is the start time in Chad's Approve line, on the hour.
**The whole rehearsal lies inside 06:00 to 22:00 SAST: T no earlier than 06:00 and no later than 18:30.**

| Opportunity | Due | Scheduled task | Heartbeat push | Purpose |
|---|---|---|---|---|
| 1 | T | yes | yes | launch, read, push reaches the phone |
| 2 | T + 60 min | yes | yes | the same, a second time |
| 3 | T + 120 min | **none, on purpose** | **none, on purpose** | the missed launch |
| 4 | T + 180 min | yes | yes, after the gap alert | finds the gap by its own rule |

The rehearsal ends at **T + 210 min**, followed by cleanup (section 8).

## 2. Readiness, finished before T

All of this is complete **at least 15 minutes before T**, with Chad present for the first two minutes. If any item
fails or is not finished by then, **the rehearsal does not start**: the tasks are deleted, the reason is reported,
and T is not moved without Chad.

1. **Push available:** one test push ("Earth from Space rehearsal: test push, reply with the time"). It must reach
   Chad's phone within 10 minutes. It is not a heartbeat and starts no clock.
2. **Scheduler available:** the three tasks are created for T, T + 60 and T + 180, and then **listed back**: three
   tasks, their ids and due times as intended. All three carry the same text, with no number and no mention of a
   gap: "Earth from Space rehearsal: run the inspection in
   reviews/2026-11-23-earth-from-space-rehearsal-plan.md section 3."
3. **Ledger access:** the ledger (section 4) is written with its header and task table, then read back, in both
   places it is kept.
4. **Reads available:** the dashboard tab is signed in and each read of section 3 step 5 works once.
5. Conditions for the four hours: Mac awake, Claude app open, dashboard tab signed in, this thread used for
   nothing else (a running turn delays a task that falls due).

## 3. One inspection (the same procedure each time, in this order)

1. **Clock** (`date -u`).
2. **Which opportunity this is: from the task, not from the clock.** The delivered task carries its id and the
   time it fired. The ledger's task table maps that id to its opportunity number and due time. **The clock is
   never rounded to choose an opportunity.** Launch delay = clock minus due time. Over 10 minutes is **late**
   (section 6).
3. **Gap rule, before anything else is read.** Read the ledger's last **completed** inspection. If its clock time
   is more than 75 minutes ago, this is a missed inspection. The rule uses the ledger and the clock only. (For
   opportunity 1 there is no earlier inspection; the rule does not apply and the ledger line says so.)
4. **If the gap rule fired, push the gap alert at once, before any dashboard read:** "Earth from Space rehearsal:
   MISSED INSPECTION. Last completed <time>, now <time>, gap <minutes>. In Stage D you would pause now." The same
   in the thread, with the clock time of the push. **A blocked or slow read cannot delay it.**
5. **Reads, read-only, through the signed-in dashboard tab:**
   - hub invocation records since the last completed inspection (since T − 60 min for the first): count by type
     and status;
   - `earthview` log lines in the same period: expected only
     `earthview:not scheduled (EARTHVIEW_ENABLED is manual)`, no `run-start`;
   - the hub's public status file: each layer's state;
   - R2 objects under `earthview/`: count (5 at the last read);
   - settings read-back: `EARTHVIEW_ENABLED`, code hash, binding count, crons.
6. **If any read fails** (pane unreachable, tab signed out), or the ledger itself cannot be read: push
   "Earth from Space rehearsal inspection n: CANNOT READ" and say so in the thread. Never "clean". On the first
   failure. **The ledger line is written as `failed`, and a failed inspection does not become the "last
   completed inspection":** the next gap rule still measures from the last one that completed.
7. **Thread entry** with the clock reading and every count read.
8. **Heartbeat push** (only when every read completed): "Earth from Space rehearsal inspection n of 4: clean" or
   what was found.
9. **Ledger line** appended (section 4), then copied to the Mac.

## 4. The ledger

- **Kept in two places:** the working copy in Claude's workspace, which every inspection reads and writes; and a
  copy on the Mac at `_review/earth-from-space-rehearsal/LEDGER.txt`, refreshed after each inspection so Chad and
  GPT can read it while the rehearsal runs. The gap rule reads the working copy. If the Mac copy cannot be written,
  that is recorded and the inspection goes on.
- **Header, written at readiness:** T; the task table (task id, opportunity number, due time) for the three tasks.
- **One line per launched inspection:** opportunity number, task id, due time, launch clock time, delay in minutes,
  gap-rule result (and the gap alert's push time if it fired), reads `completed` or `failed`, heartbeat push time.
- Only a line marked `completed` counts as a completed inspection.
- At the end it goes into the result document unchanged.

## 5. The omitted third: how the two detections are recorded

**Chad's noticing (the daytime fallback of proposal 5.5).**

- **His clock runs from actual receipt.** His deadline is **90 minutes after the last inspection heartbeat reached
  his phone**, by the time shown on the phone. T + 150 is only the nominal deadline.
- **Only an inspection heartbeat push counts.** The test push does not. Claude's replies in the thread, including
  "recorded", are not heartbeats and **do not reset his clock**, even if the app shows a notification for them.
- He writes one line in the thread in his own words giving **two times separately: when he noticed, and when he
  is posting.** Example: "Last heartbeat 11:02. Noticed 12:20. Posting 12:41."
- **He pauses nothing.** The variable is already `manual`. Optional, look only: he opens the Cloudflare dashboard
  on his phone as far as the variable's page and says whether he got there. No change is made.
- Recorded: receipt time of heartbeat 2 on his phone; his actual deadline (that time + 90 min); the time he
  noticed; the time he posted; the thread's own clock time for his message.

**Claude's later detection.**

- Claude does nothing at T + 120. If Chad's line arrives, Claude answers "recorded" with a clock time and **runs no
  inspection, reads nothing, writes no ledger line and sends no push.**
- At T + 180 the scheduled inspection runs. Steps 3 and 4 must fire by themselves.
- Recorded: launch clock time, the ledger time it compared against, the gap in minutes, the gap alert's push time,
  whether it went out before the reads began, and the time Chad says it reached his phone.

**The two are recorded separately and neither stands in for the other.**

## 6. Pass and fail (runbook R1 to R4)

| # | Met when | Failed when |
|---|---|---|
| R1 | Inspections 1, 2 and 4 each launch from their own scheduled task; thread entry with a clock reading | any of the three does not launch |
| R2 | Each completes every read of step 5 and reports the counts | a read is skipped, fails, or is reported without a figure |
| R3 | Each heartbeat push reaches Chad's phone; he gives the time shown on the phone (he may reply later) | a push is not received, or arrives more than 10 minutes after it was sent |
| R4a | Chad **noticed** the missing third heartbeat within 90 minutes of heartbeat 2's receipt on his phone | he noticed later, or only after the gap alert, or not at all |
| R4b | Inspection 4's gap rule fires, the gap alert is pushed **before the reads**, and it reaches his phone | it reports clean without the gap; or the alert is not sent, sent only after the reads, or not received |

- **A launch more than 10 minutes late is a finding.** While any such finding stands unreviewed, the rehearsal is
  **not called met**; the result says "late launch, for review" and GPT and Chad decide.
- R4a is judged on the time Chad says he noticed. If he **posted** after his deadline, both times are shown and
  the item is flagged for review; it is not quietly counted as met.
- **Missing evidence is incomplete, never met.** A confirmation Chad cannot give counts as not received.
- **Nothing is repeated or replaced inside this rehearsal.** A missed launch is not made up by a manual inspection.
- **Met means the rehearsal's own items are met. It does not clear Stage D.**

## 7. What happens if either misses the gap

| What goes wrong | Who finds out, and when | Consequence |
|---|---|---|
| **Chad does not notice within his 90 minutes** | Recorded when he does write, or at T + 210 if he has not | R4a failed; **the rehearsal is failed.** The daytime fallback is not shown to work. Stage D is not asked for on this monitoring plan. Either the fallback is changed (for example a phone alarm at each expected push) and the rehearsal is run again on a new line; or Stage D is put on a **revised basis** that states the weaker daytime coverage, reviewed and accepted by Chad in words. **Accepting weaker coverage does not turn this rehearsal into a pass** |
| **Inspection 4 runs but does not flag the gap** | Its own thread entry and ledger line | R4b failed; rehearsal failed. Stage D is not asked for. The procedure is corrected, reviewed by GPT, and the whole rehearsal is run again on a new line |
| **Inspection 4 never launches** | Nobody on Claude's side: an inspection that never starts cannot notify. Chad, by his 90-minute rule | R1 failed, and R4b is **not tested**. Claude, whenever next woken, records the failure with a clock time and runs **no** substitute. Stage D is not asked for |
| **Both miss** | The next message anyone writes in the thread | Hourly inspections have no working check on a dead inspection. A different monitoring design is needed before Stage D |
| Inspection 1 or 2 does not launch | Chad's 90-minute rule; the next inspection's gap rule | R1 failed. The remaining opportunities still run, for information only. Verdict stays failed |
| An inspection launches but cannot read | Its own CANNOT READ push | R2 failed. Its ledger line is `failed`; the next inspection's gap rule measures from the last completed one, so it may fire earlier than planned. Recorded as it happens |
| A push is sent but not received | Chad's missing confirmation | R3 failed. Without pushes there is no heartbeat, so R4a is not meaningful either |

## 8. Cleanup, after T + 210

1. List the scheduled tasks. **Delete any rehearsal task still outstanding** and list again: none left.
2. Final copy of the ledger to the Mac. No object was created on Cloudflare, so nothing is removed there; the hub's
   settings are read back once more (`manual`, code hash, bindings, crons) and recorded.
3. If the rehearsal was stopped at readiness or part-way, the same cleanup is done at that point.

## 9. What this rehearsal cannot show

- **Neither detection is blind.** Chad knows the third heartbeat will be missing; Claude wrote this plan, and the
  ledger's task table shows three tasks. It shows that the rule is workable in Chad's real day and that the gap rule
  runs and alerts first. It does not show vigilance against a surprise.
- **Hub errors:** the hub is expected to be healthy. It shows the reads are made, not that a real stop condition
  would be recognised.
- **The unreadable inspection (D9)** is not staged. Step 6 is live, but untested unless it happens or Chad adds D9.
- **Overnight.** No heartbeats between 22:00 and 06:00 SAST; that exposure is unchanged and still needs Chad's
  acceptance in words in the Stage D line (D8).
- **Four hours is not 48.** Stage D's 49 inspections also pass through context limits this rehearsal will not reach.
- **Push timing** is a handful of observations, not a promised delivery time.

## 10. The line that would start it (Chad's own words, after the focused check)

`Approve: Earth from Space monitoring rehearsal under proposal rev 2.2 section 5.5 and reviews/2026-11-23-earth-from-space-rehearsal-plan.md rev 2: readiness with one test push, then four hourly opportunities from <T, SAST> with the third omitted (scheduled inspections due at T, T+60 and T+180 minutes), read-only, with the variable at manual, notifications to my phone; outstanding tasks deleted afterwards; no change to the hub, no request to EUMETSAT`

Example T: 10:00 SAST (due 10:00, 11:00, 13:00; nominal deadline for noticing 12:30; end 13:30). Readiness then
starts by about 09:30.

A result document follows: the ledger unchanged, each thread entry's clock time, Chad's lines as he wrote them,
each of R1 to R4b marked met, failed or incomplete, every late launch, and what was not run. It goes to GPT.

## 11. Review points of 23 Nov and where they went

| Point | Change |
|---|---|
| 1. Actual receipt times; noticed and posted recorded separately; "recorded" replies must not reset the heartbeat clock | Section 5; R4a in section 6 |
| 2. No rounding of the clock; identify by the scheduled task and its due time; over 10 minutes late stays a finding for review before "met" | Section 3 step 2; ledger task table (section 4); section 6 |
| 3. Gap alert at once, before the reads; a failed inspection does not advance "last completed inspection" | Section 3 steps 3, 4 and 6; section 4; R4b |
| 4. Readiness finished before T (scheduler, push, shared ledger); all within daytime hours; outstanding tasks cleaned up | Sections 1, 2, 4 and 8 |
| Weaker daytime coverage after a failure needs a revised Stage D basis and is not a pass | Section 7, first row |
| A rehearsal pass does not clear Stage D | Header; section 6 |
