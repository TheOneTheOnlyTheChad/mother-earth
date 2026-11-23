# Earth from Space — monitoring rehearsal result (23 Nov 2026): FAILED

Written 23 Nov 2026 10:32 UTC (clock reading). Plan: `reviews/2026-11-23-earth-from-space-rehearsal-plan.md` rev 2.1.
Chad's Approve line: his own message of 23 Nov, T = 09:00 SAST (07:00 UTC). Evidence, unchanged:
`reviews/evidence/2026-11-23-earth-from-space-rehearsal/LEDGER.txt` and `CHAD-REPLIES.txt` (his lines as he
wrote them, each with Claude's clock time on reading it).

**Verdict: FAILED, on R4a. Chad did not notice the missing third heartbeat; he learned of it from Claude's gap
alert at 12:00 SAST. Claude's side ran as planned. Stage D is not asked for on this monitoring plan. The hub was
not changed.**

## 1. Items

| # | Result | Evidence |
|---|---|---|
| R1 launches | **Met** | Inspections 1, 2 and 4 each launched from their own scheduled task, identified by task id against the ledger table: 07:00:33, 08:01:11 and 10:00:30 UTC. Delays 0.6, 1.2 and 0.5 minutes. **No late launch** (limit 10 minutes) |
| R2 reads | **Met** | Each completed every read and reported the counts (section 2) |
| R3 pushes reach the phone | **Met for heartbeats 1 and 2; incomplete for the two 12:00 pushes** | Heartbeat 1: phone 09:01 SAST (sent 09:00:56). Heartbeat 2: phone 10:01 SAST (sent 10:01:32). Gap alert and heartbeat 4: Chad confirmed both came through, the gap alert first, but could not read their times off the phone; his first reply after them was at 12:15:30 SAST. So "within 10 minutes" is **not shown** for those two |
| R4a Chad notices the gap | **FAILED** | Heartbeat 2 reached his phone at 10:01 SAST, so his deadline was 11:31 SAST. No line from him between 10:01:49 and 12:15:30 SAST. Asked, he wrote: "yes i learned it from your phone push" |
| R4b Claude detects the gap | **Met, with the receipt time incomplete** | Inspection 4 compared the clock with the ledger: last completed 08:01:27 UTC, 119.1 minutes, over the 75-minute limit. The gap alert was requested between 10:00:30 and 10:00:33 UTC; the reads began at 10:00:38. Chad confirms it arrived; phone time not available |

## 2. What each inspection read (all read-only)

| Inspection | Read cut-off (UTC) | Invocations, all `success` | `earthview` lines | Settings | Objects under `earthview/` | Public status |
|---|---|---|---|---|---|---|
| 1 | 07:00:39 | 172 fetch, 28 scheduled (since 06:00) | 13, all "not scheduled (EARTHVIEW_ENABLED is manual)" | `manual`, 25 bindings, code `17798a44a217…`, four crons | 5 | 0.6.22; 20 layers, 17 ok, 3 down |
| 2 | 08:01:17 | 191 fetch, 19 scheduled | 12, the same | the same | 5 | the same |
| 4 | 10:00:38 | 334 fetch, 36 scheduled | 24, the same | the same | 5 | the same |

- The three layers shown as down were down at readiness (04:45 UTC) and throughout: the old `opensky-bbox` entry
  (31 Oct), `firms:recovery`, and `ships`. They are outside this rehearsal and were not touched.
- The scheduled count for inspection 1's hour (28) is above what the four crons give (about 21). The dataset's
  counts are sample-weighted (alarm assessment, section 10). Not pursued; recorded as read.
- No `run-start` line, no picture run, in any period.

## 3. Readiness and cleanup

- **Readiness, complete by 04:48 UTC (06:48 SAST), more than two hours before T:** test push sent 04:44:13 UTC and
  confirmed by Chad in the thread within four minutes (phone time not given); three tasks created and listed back;
  ledger written and read back in the workspace and mirrored to the Mac; every read tried once.
- **Task identity:** each delivery carried its task id and the time it fired. No opportunity was guessed.
- **Cleanup, 10:31 UTC:** no scheduled task outstanding; hub read back unchanged (`manual`, 25 bindings, same code
  hash, four crons, 5 objects); the helper text kept in the dashboard tab for the reads was removed.
- **Mac mirror:** written after each inspection. The first write each time carried the previous version and a
  second was needed; the working copy in the workspace was never affected.

## 4. Deviations and things to know

1. **Claude asked Chad a direct question about the gap.** After inspection 4, with no "noticed" line from him,
   Claude asked whether he had noticed the missing heartbeat. His answer is the evidence for R4a. It was asked
   after his deadline had passed, so it could not have helped him pass.
2. **Chad's replies about pushes did not always give the phone's time.** Heartbeat 1 took three messages ("now
   lol", then a slip, then "09.01"). For the 12:00 pushes the times could no longer be read.
3. **Other threads push to the same phone.** A notification Chad read as "9 mins ago" at 12:19 SAST belonged to
   another thread. Pings from several threads look alike, so a missing one is easy to overlook. **This is the most
   likely reason for R4a, in Claude's reading; Chad has not said so.**
4. **A fourth scheduled task was created during the run:** Claude's own end-of-rehearsal reminder (created
   10:01:09 UTC, fired 10:31:43). It was not in the plan. It ran no inspection and sent no push.
5. Inspection 4's heartbeat text was "inspection 4 of 4: hub reads clean; one inspection was missed", not the
   plain "clean" of the plan.

## 5. What this shows and does not show

- **Shown:** over four hours, in daytime, the scheduled inspections launched within about a minute of their due
  time, read what they were meant to read, and the ledger-and-clock rule found a two-hour gap and alerted before
  reading. Pushes reached the phone within about a minute on the two occasions a time was given.
- **Shown:** the daytime fallback as written (Chad noticing 90 minutes without a heartbeat) **did not work**, on a
  morning when he knew the third heartbeat would be missing.
- **Not shown:** anything the plan already listed in its section 9: hub errors being recognised, the unreadable
  inspection, overnight, 48-hour endurance. Neither detection was blind.

## 6. Position

- **Stage D is not asked for on this monitoring plan.** With no email alarm (alarm assessment, section 13) and a
  fallback that did not work, a dead inspection by day would be found only by a later inspection that does start,
  exactly as at night.
- By the plan's section 7, two routes are open, **neither chosen here**: change the fallback and rehearse again
  on a new line (for example an alarm on Chad's phone at each expected heartbeat, so that silence is not what has
  to be noticed); or put Stage D on a **revised basis** that states this weaker daytime coverage, reviewed by GPT
  and accepted by Chad in words. Accepting weaker coverage does not turn this rehearsal into a pass.
- For GPT's review. Nothing is scheduled. `EARTHVIEW_ENABLED` stays `manual`.

## 7. After GPT's review (23 Nov 2026)

GPT accepted the verdict (`reviews/2026-11-23-earth-from-space-rehearsal-result-gpt-review.md`). Read this result
with these corrections:

- **"Hub clean"** in the thread and in heartbeat texts meant no new issue bearing on the rehearsal. Three layers
  were down throughout. Invocation totals are sample-weighted estimates, not exact counts.
- **Duration:** the planned three-and-a-half-hour structure (inspections 09:00 to 12:00 SAST, closeout about
  12:31), not "four hours".
- **Section 6, second route, corrected:** "found only by a later inspection" holds only if a later inspection
  starts. If inspections stop altogether and Chad does not check independently, **there is no bounded detection
  time**, by day or night.
- The headline is one failed item (R4a) plus incomplete delivery timing for the final two pushes. Neither is waived.
- Next: amendment A1 (`reviews/2026-11-23-earth-from-space-rehearsal-amendment.md`), for review. Nothing scheduled.
