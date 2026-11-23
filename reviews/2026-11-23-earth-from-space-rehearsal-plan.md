# Earth from Space — monitoring rehearsal plan (23 Nov 2026) — for review, NOT started

Written 23 Nov 2026 04:17 UTC (clock reading). Proposal rev 2.2 section 5.5 and runbook rev 2 section 2 are the
basis; this plan fills in the mechanics. **Nothing in it is approved or scheduled.** It needs GPT's review and then
Chad's own Approve line (section 9).

## 0. Basis: no email alarm exists

- The Cloudflare email-alarm exercise is **accepted as unsuccessful** (instruction relayed by Chad in the thread,
  23 Nov): one email for two recorded failures, scheduled leg not run, test monitor and test Worker deleted, read
  back clean at 04:01:49 UTC. Record: `reviews/2026-11-22-earth-from-space-alarm-assessment.md` section 13.
- So during Stage D **nothing on Cloudflare's side tells anyone about a hub error.** The only detection is Claude's
  hourly inspection, and the only check on the inspections is Chad noticing a missing heartbeat. This rehearsal
  tests those two things and nothing else.

## 1. What the rehearsal is, in one view

Hub state throughout: `EARTHVIEW_ENABLED=manual`, hub 0.6.22. **No change to the hub, no admin call, no key, no
request to EUMETSAT.** All reads are read-only.

Four hourly opportunities. T is the start time in Chad's Approve line, on the hour, inside 06:00 to 22:00 SAST.

| Opportunity | Planned | Scheduled message | Heartbeat push | Purpose |
|---|---|---|---|---|
| 1 | T | yes | yes | launch, read, push reaches the phone |
| 2 | T + 60 min | yes | yes | the same, a second time |
| 3 | T + 120 min | **none, on purpose** | **none, on purpose** | the missed launch |
| 4 | T + 180 min | yes | yes, plus the missed-inspection push | finds the gap by its own rule |

The rehearsal ends at **T + 210 min**. Chad is needed at his phone, not at the Mac, apart from section 2.

## 2. Before T (on the Approve line, with Chad present for about 2 minutes)

1. **Pre-check push.** Claude sends one test push ("Earth from Space rehearsal: test push, reply with the time").
   The push tool has not been used in this thread. If it does not reach Chad's phone within 10 minutes, **the
   rehearsal does not start**; reported, nothing scheduled.
2. Claude reads once that the dashboard tab is signed in and the reads of section 3 work.
3. Claude writes the ledger file (section 4) with T and schedules **three** messages, for T, T + 60 and T + 180.
   **All three carry the same text**, with no number and no mention of a gap: "Earth from Space rehearsal:
   run the inspection in reviews/2026-11-23-earth-from-space-rehearsal-plan.md section 3."
4. Conditions that must hold for four hours: Mac awake, Claude app open, dashboard tab signed in, this thread used
   for nothing else. A turn that is running when a message falls due delays it, so Claude does no other work here.

## 3. One inspection (the same procedure each time)

1. **Clock** (`date -u`). Work out the opportunity number from the clock alone:
   n = round((now − T) / 60 min) + 1.
2. **Gap rule.** Read the ledger's last completed inspection. **If its clock time is more than 75 minutes ago, this
   is a missed inspection** (runbook 3.2 step 1). The rule uses the ledger and the clock only; it does not rely on
   the message, on memory of this plan, or on anything Chad has written.
3. **Reads, read-only, through the signed-in dashboard tab:**
   - hub invocation records since the last ledger entry (or since T − 60 min for the first): count by type and status;
   - `earthview` log lines in the same period: expected only
     `earthview:not scheduled (EARTHVIEW_ENABLED is manual)`, no `run-start`;
   - the hub's public status file: each layer's state;
   - R2 objects under `earthview/`: count (5 at the last read);
   - settings read-back: `EARTHVIEW_ENABLED`, code hash, binding count, crons.
4. **If any read fails** (pane unreachable, tab signed out): push "Earth from Space rehearsal inspection n:
   CANNOT READ" and say so in the thread. Never "clean". On the first failure, not the second.
5. **Thread entry** with the clock reading and every count read.
6. **Heartbeat push:** "Earth from Space rehearsal inspection n of 4: clean" or what was found.
7. **If the gap rule fired:** a second push, "Earth from Space rehearsal: MISSED INSPECTION. Last completed
   <time>, now <time>, gap <minutes>. In Stage D you would pause now." and the same in the thread.
8. Append the ledger line.

## 4. The ledger

One text file in Claude's workspace, one line per completed inspection: opportunity number, planned time, launch
clock time, whether the reads completed, push sent time(s), gap-rule result. Written by the inspection itself. It
is the only thing the gap rule reads. At the end it is copied into the result document unchanged.

## 5. The omitted third: how the two detections are recorded

**Chad's noticing (the daytime fallback of proposal 5.5).**

- His rule: 90 minutes with no push means something is wrong. The last push before the gap is opportunity 2, so his
  deadline is **T + 150 min**.
- When he notices, he writes one line in the thread, in his own words, with **the time he noticed** (phone clock).
  Example: "No push since 11:01, noticed 12:24."
- **He does not pause anything.** The variable is already `manual`. Optional, look only: he opens the Cloudflare
  dashboard on his phone as far as the variable's page, to see that he could have acted, and says whether he got
  there. No change is made.
- Recorded: time of the last push on his phone, time he noticed, minutes between, and whether it was before T + 150.

**Claude's later detection.**

- Claude does nothing at T + 120. If Chad's line arrives, Claude answers "recorded" with a clock time and **runs no
  inspection, reads nothing, and does not send the missed-inspection push.** A message from Chad is not an
  inspection.
- At T + 180 the scheduled inspection runs. Step 2 must fire by itself: last ledger entry about 120 minutes old.
- Recorded: launch clock time, the ledger time it compared against, the gap in minutes, the time the
  missed-inspection push was sent, and the time Chad says it reached his phone.

**The two are recorded separately and neither stands in for the other.**

## 6. Pass and fail (runbook R1 to R4)

| # | Passes when | Fails when |
|---|---|---|
| R1 | Inspections 1, 2 and 4 each launch from their scheduled message; thread entry with a clock reading | any of the three does not launch |
| R2 | Each completes every read of section 3 and reports the counts | a read is skipped, or reported without a figure |
| R3 | Each heartbeat push reaches Chad's phone; he gives the time shown on the phone (he may reply later) | a push is not received, or arrives more than 10 minutes after it was sent |
| R4a | Chad notices the missing third push and says so **before T + 150** | he first says so after T + 150, or only after the missed-inspection push, or not at all |
| R4b | Inspection 4's gap rule fires and the missed-inspection push is sent and received | it reports clean without the gap, or the push is not sent or not received |

- A launch more than 10 minutes after its planned time is recorded as **late**, with the delay. Late is a finding
  for the review, not by itself a failure.
- **Missing evidence is incomplete, never a pass.** A confirmation Chad cannot give counts as not received.
- **Nothing is repeated or replaced inside this rehearsal.** A missed launch is not made up by a manual inspection.

## 7. What happens if either misses the gap

| What goes wrong | Who finds out, and when | Consequence |
|---|---|---|
| **Chad does not notice by T + 150** | Recorded when he does write, or at T + 210 if he has not | R4a fails. The daytime fallback is **not shown to work**. Stage D is not asked for on this monitoring plan. Chad chooses: change the fallback (for example a phone alarm at each expected push) and rehearse again on a new line; or accept in words, in the Stage D line, that a missed inspection by day is found only by a later inspection, as at night |
| **Inspection 4 runs but does not flag the gap** | Seen in its own thread entry and ledger line | R4b fails. Stage D is not asked for. The inspection procedure is corrected, reviewed by GPT, and the whole rehearsal is run again on a new line |
| **Inspection 4 never launches** | Nobody on Claude's side: an inspection that never starts cannot notify. Chad, by the same 90-minute rule (no push by T + 150, and still none after T + 180) | R1 fails, and R4b is **not tested**. Claude, whenever next woken, records the failure with a clock time and runs **no** substitute. Stage D is not asked for |
| **Both miss** | The next message anyone writes in the thread | The plan has no working check on a dead inspection. Stage D is not asked for on hourly inspections at all; a different monitoring design is needed |
| Inspection 1 or 2 does not launch | Chad's 90-minute rule; the next inspection's gap rule | R1 fails. The remaining opportunities still run, for information only. Verdict stays failed |
| A push is sent but not received | Chad's missing confirmation | R3 fails. Without pushes there is no heartbeat, so R4a is not meaningful either |

## 8. What this rehearsal cannot show

- **Neither detection is blind.** Chad knows the third push will be missing and when; Claude wrote this plan. It
  shows that the rule is workable in Chad's real day and that the gap rule runs and notifies. It does not show
  vigilance against a surprise.
- **Hub errors:** the hub is expected to be healthy. The rehearsal shows the reads are made, not that a real stop
  condition would be recognised.
- **The unreadable inspection (D9)** is not staged. Step 4 of section 3 is live, but untested unless Chad adds D9.
- **Overnight.** No heartbeats between 22:00 and 06:00 SAST; that exposure is unchanged and still needs Chad's
  acceptance in words in the Stage D line (D8).
- **Four hours is not 48.** A thread, tab or Mac that holds for four hours has not been shown to hold for two days.
  Stage D's 49 inspections also pass through context limits this rehearsal will not reach.
- **Push timing** is three or four observations, not a promised delivery time.

## 9. The line that would start it (Chad's own words, after review)

`Approve: Earth from Space monitoring rehearsal under proposal rev 2.2 section 5.5 and reviews/2026-11-23-earth-from-space-rehearsal-plan.md: one test push, then four hourly opportunities from <T, SAST> with the third omitted (inspections at T, T+60 and T+180 minutes), read-only, with the variable at manual, test notifications to my phone; no change to the hub, no request to EUMETSAT`

Suggested T: a weekday hour when Chad has his phone on him for three and a half hours, for example 10:00 SAST
(inspections 10:00, 11:00, 13:00; his deadline for noticing 12:30; end 13:30).

## 10. Result

A result document follows the rehearsal: the ledger unchanged, each thread entry's clock time, Chad's lines as he
wrote them, R1 to R4b each marked met, failed or incomplete, and what was not run. It goes to GPT, then into the
Stage D packet.
