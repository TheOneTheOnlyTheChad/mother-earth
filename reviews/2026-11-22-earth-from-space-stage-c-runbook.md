# Earth from Space — runbook for Stage C, the monitoring rehearsal and Stage D (draft with the 0.6.22 candidate)

22 Nov 2026. Part of the 0.6.22 candidate packet. **Nothing here is approved.** Each block needs Chad's own Approve line
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

## 3. Stage D — 288 slots (Chad's own line, with D8's acceptance in words)

### 3.1 Start

One dashboard change, at least 15 minutes before `FROM` (Claude with Chad watching, or Chad): add
`EARTHVIEW_FROM` = `<FROM>`, `EARTHVIEW_UNTIL` = `<FROM + 48 h>`, and set `EARTHVIEW_ENABLED` = `1`. Both times in the
exact form `2026-11-24T06:00:00Z`, on a ten-minute mark.

Read back: all three values, code hash unchanged, 27 bindings, crons unchanged. **The ticks before `FROM` must log
`earthview:not scheduled (before the window)`.** If they log anything else, set the variable back to `manual`.

### 3.2 Each hourly inspection (Claude, read-only)

1. Clock reading; compare with the last inspection's time (a gap over 75 minutes is a missed inspection: notify).
2. Invocation records since the last inspection: every outcome; CPU of every invocation with a picture run.
3. `run-start` and `run-end` lines: one pair per admitted slot; classify each slot (proposal 5.7); count requests.
4. Stop conditions 1 to 9 (proposal 5.6). On any: **pause** (3.3).
5. Other layers' public status; R2 object count and bytes under `earthview/`.
6. Hourly CPU and memory percentiles for the hour just ended; minute rows for any overlap minute.
7. Heartbeat push to Chad (06:00 to 22:00 SAST), saying "clean" or what was found.

Once a day, Chad: `bash earthview-admin.sh D-status-1 status` (then `D-status-2`).

### 3.3 Pause (any stop condition; and after `UNTIL`)

1. Set `EARTHVIEW_ENABLED` to `manual`. Note the time. (The two window variables stay.)
2. Read back the variable, code hash, bindings, crons.
3. Read invocation records until every invocation that began before the read-back has ended, and for at least 15
   minutes. List any picture run among them and what it did. **A trigger scheduled inside the window and delivered late
   may still run after `UNTIL`: that is reconciled, not a breach.**
4. The next two ticks must log `not scheduled`.
5. R2 list and public record: note the state.
6. Push to Chad; report in the thread.
7. Nothing is repaired, deleted, recovered or restarted.

### 3.4 After the window

The first inspection after `UNTIL` runs 3.3 (the two ticks after `UNTIL` must log
`earthview:not scheduled (after the window)`), then Chad runs `bash earthview-admin.sh D-status-3 status`. The result is
written by the rule of proposal 5.8.

## 4. Recovery (only if a guard reports `storage record needs repair` or a record is lost)

Not part of the normal path. Under a new Approve line: `hold` (step id like `D5-hold`), `recover-plan`, `recover-apply`
with the plan id (`D6-recover`), `sweep-plan` and `sweep-apply` if it would add anything (`D7-sweep`), `release-plan`,
`release-apply` (`D8-release`). Recovery deletes nothing and copies the kept pictures to new keys. Design and tests:
reviewed 20 Nov, unchanged in 0.6.22.
