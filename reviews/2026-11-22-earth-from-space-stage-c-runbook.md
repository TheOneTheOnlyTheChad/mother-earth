# Earth from Space — runbook for Stage C, the monitoring rehearsal and Stage D (rev 2, with the 0.6.22 candidate)

22 Nov 2026. **Rev 2** answers GPT's review of the candidate (`reviews/2026-11-22-earth-from-space-0.6.22-candidate-gpt-review.md`):
trial-end ordering (3.3, 3.4), account-usage reads (0.7, 3.1, 3.4), pause ownership if C6 is refused (1, 3.0), the
email alarm as a pre-D task (2a), and the native caller run still owed (5). Part of the 0.6.22 candidate packet. **Nothing here is approved.** Each block needs Chad's own Approve line
(proposal rev 2.2 section 10). Times are filled in when a line is asked for. Commands are run by Chad in Terminal from the
reviewed copy of the branch on the Mac, in the folder that holds `earthview-admin.sh`:

```
cd ~/Documents/"Mother Earth"/_review/earth-from-space-0.6.22-candidate/phase1
```

The script reads the admin key from `~/mother-earth/KEYS.md` itself. Nobody types, pastes or prints the key. Answers are
saved in `~/Documents/Mother Earth/_review/earth-from-space-stage-c/results/`, where Claude reads them.

**If anything on the day differs from what a step says it should show: stop, and nothing further is run until Chad and
Claude have looked at it.**

## 0. Before Stage C (Claude, read-only, recorded)

| # | Read | Must show |
|---|---|---|
| 0.1 | Deployed code hash, settings, bindings, crons (`/content/v2`, `/settings`, `/schedules`) | the 0.6.22 hash of the approval; 24 bindings; 4 crons; no `EARTHVIEW_*` variable |
| 0.2 | R2 list, prefix `earthview/` | empty |
| 0.3 | R2 lifecycle rules | none whose prefix matches `earthview/` (read 22 Nov: `cells/`, `raw/`, `snapshots/` at 48 h, and the default multipart rule) |
| 0.4 | REGISTER | the GeoColour entry is filed |
| 0.5 | Hub health: status file; the last hour's invocations | all `ok` |
| 0.6 | Hourly CPU and memory percentiles for the previous hour | recorded as the baseline |
| 0.7 | **Account usage this billing period**, from the dashboard: Workers requests and CPU milliseconds; R2 storage, Class A and Class B operations; Workers Observability (logs) volume | each figure recorded with its included allowance and the remainder. Stage C's own added load (one run: 3 requests out, about 7 Class A and 14 Class B operations, well under 1 s CPU) is set against the remainder. A figure that cannot be read is **reported as missing**, never taken as zero. Visitors' requests are unknown extra demand |

## 1. Stage C — one stored picture (Chad at the Mac, about 30 minutes)

| Step id | Chad runs | Claude then reads | Must show before the next step |
|---|---|---|---|
| C1 | `bash earthview-admin.sh C1 status` | the saved answer; **the invocation record of this call** | pointer missing, list missing, 0 pictures, no hold. **In the record, `Authorization` is masked and the URL holds no key.** A readable key stops everything |
| C2-hold | `bash earthview-admin.sh C2-hold hold` | answer; `status` (`bash earthview-admin.sh C2s status`) | `applied: true`, `held`; status shows the hold |
| C3 | `bash earthview-admin.sh C3 recover-plan` | answer | `plan.mode` is `first start`; Claude reads out the 16-character plan id |
| C4-recover | `bash earthview-admin.sh C4-recover recover-apply <plan id>` | answer; `bash earthview-admin.sh C4s status` | `recovered`; pointer and list present, same epoch, 0 pictures, guards `pass` |
| C5 | `bash earthview-admin.sh C5a sweep-plan` then `bash earthview-admin.sh C5b release-plan` | answers | sweep would add 0; release would "remove the hold" |
| C5-release | `bash earthview-admin.sh C5-release release-apply` | answer; `bash earthview-admin.sh C5s status` | `released`; no hold; guards `pass`; R2 list shows exactly `current.json`, `held.json`, one epoch marker |
| C6 | nothing in Terminal. **Claude**, with Chad watching the dashboard pane, adds the variable `EARTHVIEW_ENABLED` = `manual` and deploys the settings change | settings, deployed code hash, bindings, crons; the next five-minute tick's log line | the variable reads `manual`; code hash unchanged; 25 bindings (the 24 and this one); crons unchanged; the tick logs `earthview:not scheduled (EARTHVIEW_ENABLED is manual)`. If the dashboard refuses Claude, Chad makes the change; Claude tries no other route |
| C7-run-1 | at a minute between hh:21 and hh:24 or hh:51 and hh:54: `bash earthview-admin.sh C7-run-1 run` | section 1.1 | section 1.1 |

Exit codes of the script: 0 saved with HTTP 200; 4 the step was already used (never run it again); 7 no answer came
back (**do not repeat; reconcile**); 8 the hub answered something other than 200 (saved; stop and look).

**If the dashboard refuses Claude's change in C6** (proposal 4.2): Chad makes it; the refusal is recorded; Claude does
not retry it by any other interface. From then on **Chad is the actor for every pause in Stage D**, and section 3.0
applies before Stage D is asked for. A successful C6 shows only that Claude can make the change with the pane open and
Chad present; it does not show that Claude will be able to at any later hour.

### 1.1 After the run

Claude reads, and writes into the Stage C result:

1. The saved answer (`C7-run-1.json`) and meta file; the run's `run-start` and `run-end` log lines (same `exec`).
2. The invocation record: outcome, **whole-invocation CPU**, wall time, key masked.
3. `bash earthview-admin.sh C8 status` (Chad): one picture, in role as current, epochs equal, guards `pass`.
4. R2 list under `earthview/`: `current.json`, `held.json`, `state.json`, one epoch marker, one picture. Anything else is reported.
5. `/snapshot/earthview/meta` and the picture URL: sha256 and size equal the record; frame time equals both `Warning` times.
6. The picture, looked at by Chad and Claude in the private preview page.
7. Hourly CPU and memory percentiles for the hour and the minute rows by event type, **captured now**.
8. Every hub invocation from 10 minutes before C1 to 30 minutes after the run.

### 1.2 If run 1 did not publish

A second run, `bash earthview-admin.sh C7-run-2 run`, **only if all five** hold and are written down first (proposal
4.3): a positively identified source failure (no answer, non-200, time-out, or no `Warning` header at all); nothing
published; storage reconciled; hub healthy; between 10 and 40 minutes after run 1 was called. The script itself refuses
outside 10 to 40 minutes, after a published run 1 and after a run 1 with no saved answer. **Never** after a header naming
another frame, a validation refusal, a storage stop, a resource ending or a lost answer.

### 1.3 Leaving Stage C

The variable stays `manual`. Nothing runs by itself. The frame stays publicly downloadable. Result written by the rule of
proposal 4.5, to GPT and Chad.

## 2. Monitoring rehearsal (after Stage C; harmless; Chad's own line)

Variable at `manual` throughout. No change to the hub, no request to EUMETSAT.

Four hourly opportunities, **the third omitted**: scheduled messages for inspections 1, 2 and 4.

| # | What must happen | Recorded |
|---|---|---|
| R1 | Inspections 1, 2 and 4 each **launch** from their scheduled message (an entry in the thread with a clock reading) | launch times against planned times |
| R2 | Each reads the intended records (invocation records since the last inspection, the run log's `earthview` rows, status file, R2 count) and says what it read | counts read |
| R3 | Each sends the heartbeat push; **Chad replies in the thread** with the time it reached his phone | his three replies |
| R4 | Inspection 4 finds the two-hour gap by itself (clock against the last inspection's time) and sends the missed-inspection notification; Chad says when he noticed the third push was missing | both |
| R5 (optional, D9) | Chad closes the dashboard tab before one inspection: it must notify "cannot read", not report clean | the notification |

If any of R1 to R4 fails, Stage D is not asked for on this monitoring plan.

## 2a. Email alarm (a bounded task before Stage D; Chad's separate settings line)

GPT recommends attempting it. It is an account setting, so it has its own line and is not folded into the Stage D line.

1. Establish what this account offers: the notification types seen on 22 Nov are `workers_observability_alert` and
   `workers_observability_real_time_issue`. Read their documentation and the dashboard form: scope (this Worker),
   condition or threshold, evaluation interval, recipient, **cost**.
2. If it costs anything, present it to Chad before going further.
3. Create it on Chad's line, recipient Chad's own email (typed by him; no address is written in the repo).
4. **Test delivery without faulting the hub:** the dashboard's own test-notification facility if there is one; failing
   that, an isolated test, never a deliberate error on `mother-earth`.
5. Record: what it covers (in particular whether an invocation ended for CPU or memory would fire it), how long it
   took, and that Chad received it.

If it is unavailable, untested or does not cover resource endings, **the Stage D approval package says so** and Chad
decides on the monitoring exposure already described. It does not replace the rehearsal of section 2, and it cannot
detect a missed inspection.

## 3. Stage D — 288 slots (Chad's own line, with D8's acceptance in words)

### 3.0 Who pauses

- **If C6 succeeded:** Claude pauses on detection (3.3), if Chad's Stage D line says so; Chad is the fallback from his
  phone.
- **If C6 was refused:** this runbook is rewritten before Stage D is requested. Chad is the actor. On detection Claude
  **notifies him at once** (push, and the thread) and does nothing to the hub. The actual coverage is then stated in
  the Stage D line: detection at the hourly inspection as planned; **action only when Chad sees the notification**,
  which between 22:00 and 06:00 SAST may be at 06:00. Chad decides whether to run the trial on that footing, to use
  night-time notifications, or not to run it.

### 3.1 Start

One dashboard change, at least 15 minutes before `FROM` (Claude with Chad watching, or Chad): add
`EARTHVIEW_FROM` = `<FROM>`, `EARTHVIEW_UNTIL` = `<FROM + 48 h>`, and set `EARTHVIEW_ENABLED` = `1`. Both times in the
exact form `2026-11-24T06:00:00Z`, on a ten-minute mark.

Read back: all three values, code hash unchanged, 27 bindings, crons unchanged. **The ticks before `FROM` must log
`earthview:not scheduled (before the window)`.** If they log anything else, set the variable back to `manual`.

**Usage read at the start** (as 0.7): Workers requests and CPU milliseconds, R2 storage and Class A and Class B
operations, Observability volume, each with allowance and remainder. Set against the trial's bounded load: at most 864
requests out; about 2,000 Class A and 4,000 Class B operations if every slot published; about 4 to 5 minutes of CPU in
all at Stage B's cost per run; about 600 log lines. Missing figures are reported as missing.

### 3.2 Each hourly inspection (Claude, read-only)

1. Clock reading; compare with the last inspection's time (a gap over 75 minutes is a missed inspection: notify).
2. Invocation records since the last inspection: every outcome; CPU of every invocation with a picture run.
3. `run-start` and `run-end` lines: one pair per admitted slot; classify each slot (proposal 5.7); count requests.
4. Stop conditions 1 to 9 (proposal 5.6). On any: **pause** (3.3).
5. Other layers' public status; R2 object count and bytes under `earthview/`.
6. Hourly CPU and memory percentiles for the hour just ended; minute rows for any overlap minute.
7. Heartbeat push to Chad (06:00 to 22:00 SAST), saying "clean" or what was found.

Once a day, Chad: `bash earthview-admin.sh D-status-1 status` (then `D-status-2`).

### 3.3 Pause (any stop condition)

1. Set `EARTHVIEW_ENABLED` to `manual`. Note the time. (The two window variables stay.)
2. Read back the variable, code hash, bindings, crons.
3. Read invocation records until every invocation that began before the read-back has ended, and for at least 15
   minutes. List any picture run among them and what it did. **A trigger scheduled inside the window and delivered late
   may still run after `UNTIL`: that is reconciled, not a breach.**
4. The next two ticks must log `earthview:not scheduled (EARTHVIEW_ENABLED is manual)`. (The code checks the gate
   before the window, so once the gate is `manual` no tick says anything about the window.)
5. R2 list and public record: note the state.
6. Push to Chad; report in the thread.
7. Nothing is repaired, deleted, recovered or restarted.

### 3.4 After the window

Two phases, in this order, and **a pause is never delayed to collect a log line**:

1. **While the gate is still `1`:** any tick scheduled at or after `UNTIL` that the inspection finds in the records
   must have logged `earthview:not scheduled (after the window)`, with no `run-start` line. This is the production
   evidence of the boundary. How many such ticks exist depends only on when the first inspection after `UNTIL` falls;
   none is waited for.
2. **Then the gate is set to `manual`** by 3.3 steps 1 to 7 (read back; admitted work reconciled; the next two ticks
   log `EARTHVIEW_ENABLED is manual`).

If the gate was already `manual` before any post-`UNTIL` tick ran (an earlier pause), the result says **"the window's
end was not observed in production"**. The boundary then rests on the isolated tests (gate suite W1 to W5, W10, W11
and the workerd run), and that is stated, not glossed.

Then Chad runs `bash earthview-admin.sh D-status-3 status`.

**Usage read at the end** (as 0.7), compared with the read at the start: the difference is the trial's measured added
load, together with whatever else the account did in those 48 hours, which cannot be separated in these totals; the
trial's own share is taken from its run lines and invocation records. Visitors' requests to the record and pictures
are counted from the invocation records and reported.

The result is written by the rule of proposal 5.8.

## 4. Recovery (only if a guard reports `storage record needs repair` or a record is lost)

Not part of the normal path. Under a new Approve line: `hold` (step id like `D5-hold`), `recover-plan`, `recover-apply`
with the plan id (`D6-recover`), `sweep-plan` and `sweep-apply` if it would add anything (`D7-sweep`), `release-plan`,
`release-apply` (`D8-release`). Recovery deletes nothing and copies the kept pictures to new keys. Design and tests:
reviewed 20 Nov, unchanged in 0.6.22.

## 5. Owed before the caller script is used on the hub: a native macOS run of its suite

GPT's sandbox could not open a local port, so `earthview-admin.sh` has been tested on Linux only (80 of 80; 18 breaks).
Before Stage C, in an ordinary Terminal on the Mac (a made-up key, temporary files, a local stand-in; it contacts
nothing outside the Mac and reads no real key):

```
cd ~/Documents/"Mother Earth"/_review/earth-from-space-0.6.22-candidate
node --no-warnings phase1/earthview-admin.test.mjs 2>&1 | tee NATIVE-CALLER-RUN.txt
```

Expected last line: `earthview-admin: 80 passed, 0 failed`. The file `NATIVE-CALLER-RUN.txt` is kept and filed with
the evidence, with `sw_vers`, `bash --version | head -1`, `curl --version | head -1` and `node -v` added beneath it.
Any failure is a finding about the script on macOS and is fixed and reviewed before Stage C; it is not explained away.
Until that output exists, this item is **open**.
