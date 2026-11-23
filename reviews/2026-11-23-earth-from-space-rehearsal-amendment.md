# Earth from Space — rehearsal plan amendment A1: independent phone alarm, then repeat (23 Nov 2026) — for review, NOT started

Written 23 Nov 2026 10:37 UTC (clock reading). Amends `reviews/2026-11-23-earth-from-space-rehearsal-plan.md` rev 2.1
after the failed rehearsal (`…-rehearsal-result.md`) and GPT's review of it (`…-rehearsal-result-gpt-review.md`).
**Everything in rev 2.1 stands unless changed here.** Nothing is approved or scheduled. A met repeat does not
clear Stage D.

## 1. What changes, in one view

The first rehearsal asked Chad to notice a silence. He did not. **The repeat gives him a prompt that does not come
from Claude:** an alarm on his phone's own clock app at each expected heartbeat. When it sounds he looks for one
specifically named push and writes down what he sees, there and then.

Same shape as before: four hourly opportunities from T, the third omitted; scheduled inspections due at T, T + 60
and T + 180 minutes; read-only; variable at `manual`; ends T + 210.

## 2. The alarm (Chad's, independent of Claude)

- **What:** four alarms in the phone's built-in clock app, each labelled **"Earth from Space check"**. Not a
  Claude reminder, not a push, nothing scheduled by Claude. A second push from the same system would not be
  independent.
- **When: 10 minutes after each opportunity's due time,** including the omitted one: T + 10, T + 70, **T + 130**,
  T + 190. Ten minutes is the delivery grace: a heartbeat not there by then counts as missing.
- **Set and proved at readiness:** Chad sets all four, plus one test alarm two minutes ahead, with the phone in the
  sound and focus mode he will actually have it in. He confirms in the thread that the test alarm sounded. If it
  did not, the rehearsal does not start.
- Claude cannot see or hear the alarm. That it sounded is Chad's word, recorded as such.

## 3. What Chad does when an alarm sounds

1. Look for the push that begins **"Earth from Space rehearsal inspection n of 4 (due HH:MM)"** for that hour.
   **Only that push counts.** Other Claude notifications, other threads, and Claude's replies in this thread do not.
2. Write one line in the thread straight away, while the phone still shows the notification's time:
   - there: `alarm 10:10, heartbeat 2 shows 10:01`
   - not there: `alarm 11:10, NO heartbeat`
3. **He pauses nothing.** The variable is already `manual`. What he would do in Stage D, and who pauses, is
   specified separately and is not rehearsed here.

- **First heartbeat missing:** alarm 1 covers it. No separate 90-minute rule is needed; that rule is withdrawn for
  the repeat.
- **A line written later from memory is not a receipt time.** If he cannot write at the alarm, a screenshot taken
  then and sent later is accepted. The sender's time is never used in its place.
- At alarm 4 he records two times: the MISSED INSPECTION alert and heartbeat 4.

## 4. Changes on Claude's side

- **Push wording, so the right one can be found:**
  "Earth from Space rehearsal inspection n of 4 (due HH:MM SAST): no new issue" or what was found.
  **"No new issue" means nothing new that bears on the rehearsal;** layers already down at readiness are listed in
  the thread entry and do not make it "clean".
- **The gap alert stays separate.** Inspection 4 sends the MISSED INSPECTION alert first, then the reads, then the
  ordinary heartbeat in the standard wording. No combined text.
- **Cleanup is scheduled at readiness** as a fourth task due T + 210, listed in the ledger's task table as
  "cleanup, not an inspection", with different wording from the three inspection tasks. Nothing is added mid-run.
- **Mac mirror verified.** After each write the Mac copy is read back and its SHA-256 compared with the working
  copy. If it does not match after a second write, the thread says "mirror stale" and the ledger records it. The
  working copy remains the one every inspection reads.
- Claude still does nothing at T + 120, and still answers Chad's lines with "recorded" and a clock time only.
- Invocation totals are reported as sample-weighted estimates.

## 5. Verdicts, kept separate

| Part | Met when | Otherwise |
|---|---|---|
| **A. Human fallback** | Alarm 3 sounded and Chad posted "NO heartbeat" for the third opportunity **within 15 minutes of the alarm (by T + 145)**, before Claude's gap alert | Failed if he posts later, only after the gap alert, or not at all. Incomplete if the alarm did not sound: that is a failure of the prompt, recorded as such, and the fallback is not shown |
| **B. Claude's ledger detection** | Inspection 4's gap rule fires and the alert is requested before the reads | Failed |
| **C. Delivery** | Each of the four pushes (heartbeats 1, 2, 4 and the gap alert) has a phone time written at the alarm or on a screenshot, within 10 minutes of sending | Failed if later than 10 minutes; **incomplete** if no contemporaneous time exists |
| R1, R2 | as rev 2.1 (launch from own task, no guessing; every read completed) | as rev 2.1 |

- The rehearsal is **met only if A, B, C, R1 and R2 are all met** and no late launch stands unreviewed.
- An incomplete item is not waived. Nothing is repeated or replaced inside the run.

## 6. What a met repeat would and would not show

- **Would show:** on that occasion, a prompted check by Chad caught a missing heartbeat within 15 minutes, and the
  pushes' delivery times were recorded as they arrived.
- **Would not show:** blind vigilance (both still know which opportunity is omitted); recognition of a real hub
  failure; an unreadable inspection; a real pause; overnight; 48 hours. No email alarm exists.

## 7. One thing for Chad to decide before Stage D, not before the repeat

Stage D runs 48 hours with a heartbeat each hour between 06:00 and 22:00 SAST. **An alarm every hour for two days is
about 33 alarms.** If that is not something he can keep up, the pattern has to change (for example a check every
two hours that looks for the last two heartbeats), or the trial's length or monitoring design has to be
reconsidered. The repeat should use the pattern he would really keep. **If he wants a two-hourly pattern, say so
before the Approve line and this amendment is adjusted first.**

## 8. The line that would start it (Chad's own words, after review)

`Approve: repeat the Earth from Space monitoring rehearsal under reviews/2026-11-23-earth-from-space-rehearsal-plan.md rev 2.1 as amended by reviews/2026-11-23-earth-from-space-rehearsal-amendment.md A1: my own phone alarms 10 minutes after each of the four opportunities, readiness with one test push and one test alarm, then four hourly opportunities from <HH:00> SAST on <date> with the third omitted, a cleanup task at T+210, read-only, with the variable at manual, notifications to my phone; no change to the hub, no request to EUMETSAT`

T on the hour, 06:00 to 18:00 SAST. Chad needs his phone on him, with sound, from T to T + 210, and about five
minutes at the Mac or phone before T for readiness.
