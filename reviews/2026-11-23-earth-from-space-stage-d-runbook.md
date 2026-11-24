# Earth from Space — runbook for Stage D on the independent-monitoring basis (runbook rev 3.2, DRAFT for review)

**Rev 3.2, 24 Nov 2026 02:42 UTC (clock reading): GPT's review of rev 3.1 adopted**
(`EARTH-FROM-SPACE-STAGE-D-DOCS-REVIEW-2026-11-24.md` in GPT's folder on the Mac; outcome: direction accepted,
focused revisions needed, Stage D not cleared). Changed: section 0 (points 7 and 8); P4 rewritten, P4a and P11
added, P6's limit stated; 3.3 is a hold point; 3A saves raw records at every read; section 4 step 3 (a pause alert
is not proof of a pause); section 5 (a stop condition overrides the wait; the alert wording); section 6 (the result
is provisional until the late look, then a final result is reviewed before the variables go); section 10 now
records GPT's answers; section 11. **No change of design. GPT has not reviewed rev 3.2.**

**Rev 3.1, 23 Nov 2026 19:40 UTC (clock reading): brought up to date, nothing else changed.** Since rev 3 was written the
hub went to 0.6.24 (the Timeline pin; Earth from Space code unchanged) and main's hub file became the deployed file
(landing `7adef36`). Changed here: the hub version in the basis and P1; P1a (no hub deploy during the trial); P8
(the review copy comes from main); the rollback note in section 8; the revision numbers in the line. *(Written at rev 3.1, before GPT's review of 24 Nov.)* GPT had
not then reviewed rev 3.

23 Nov 2026, 15:16 UTC (clock reading). Written on Chad's go of 23 Nov for docs work. **Docs only. Nothing here is
approved, scheduled or set. Stage D is not cleared.**

**What this replaces.** Sections 2, 2a and 3 of `reviews/2026-11-22-earth-from-space-stage-c-runbook.md` (rev 2):
the hourly inspections, the heartbeat pushes, the "90 minutes without a push" duty and the email alarm. Sections
0, 1, 4 and 5 of that file are the record of Stage C and stand as written. **The old duties are retired only when
the replacement has been tested and this runbook accepted** (monitoring proposal section 10).

**Basis.** Monitoring proposal rev 3.1 with Chad's "M1 to M8 yes"; storage-to-release proposal rev 2.5 (draft,
same commit) sections 5.1, 5.5, 5.6; **hub 0.6.24 live since 23 Nov 17:18 UTC** (0.6.23 with the Timeline pin added;
the Earth from Space code and the two health addresses are unchanged from 0.6.23).

**If anything on the day differs from what a step says it should show: stop, and nothing further is done until
Chad and Claude have looked at it.**

## 0. What Chad is accepting if he approves Stage D on this basis

Said here in full, and repeated in his Approve line (section 7):

1. **Nothing pauses the trial by itself.** The monitors detect. A person pauses.
2. **An alert is sent once.** "No delay, no repeat": if it is missed, nothing reminds. At night it waits until it
   is seen.
3. **The two monitors see only what the run records show** (section 2). Everything else is found only if a later
   read by Claude takes place. Reads are three a day; the longest gap is 11 hours overnight. **If the reads stop,
   those things may not be found during the trial at all.**
4. **Nothing watches the watcher.** If UptimeRobot fails silently, nobody is told.
5. **The monitors do not read rows finished more than 24 hours after the trial's end.** A late bad row for a slot
   that already had a good one would not turn anything red. Claude's closeout read has no such cutoff.
6. **A wrong picture that passes validation is seen by nobody** until someone looks at it.
7. **The health addresses keep no history of the gate.** That a pause happened is recorded only in the ledger
   (section 4, step 7).
8. **Findings outside the read range are not kept by the monitors.** Point 5 is the case that matters. Nothing here
   claims a finding is retained beyond that range.

This is a **weaker** basis than the hourly inspections of proposal rev 2.2. It is offered because that design's
safety net failed its rehearsal on 23 Nov.

## 1. Before the Stage D line is asked for

Every item done, recorded, and where it says so reviewed. A missing item is **open**, not assumed.

| # | Item | State on 23 Nov |
|---|---|---|
| P1 | Hub with the two health addresses live, read back | **Done** 23 Nov (0.6.23 at 14:47 UTC; now 0.6.24, `db4f9cdf…1aa5`, last read back 19:32 UTC) |
| P1a | **No hub deploy between the Stage D line and the closeout** (`docs/HUB-DEPLOY-RULE.md`, condition 9). Any other thread's hub change waits, or goes before the line | At the time |
| P2 | REGISTER entry for GeoColour filed | **Done** 22 Nov |
| P3 | UptimeRobot monitors "ME runs earthview" and "ME trial earthview" created on Chad's line and read back (address, interval, contacts), both Up | Open |
| P4 | The fixture alert test (`reviews/2026-11-23-earth-from-space-alert-test-plan.md`, rev 1.2) run and its result read by GPT, **with all eight receipts of its section 6 matrix recorded as received** (runs Down, runs recovery, trial Down, trial recovery, each by push and by email). **Anything less leaves P4 open.** It closes then only on Chad's own line naming the channel or the recovery path that is unreliable or unproven and accepting Stage D on that revised basis. **The generic delivery test in place of the fixture test is not an option here: Chad chose the fixture test (M6). It becomes one only if he changes that decision in his own words** | Open (fixture not built) |
| P4a | **D1 cost measured before the trial** (monitoring proposal 3.6): the isolated measurement of the alert test plan, section 7, run and its result read by GPT. Deferring it into the trial would change an adopted requirement and needs Chad's own line saying so | Open (plan in review) |
| P5 | This runbook (rev 3.2) and proposal rev 2.5 read by GPT and accepted by Chad | Open (rev 3.1 and 2.4 reviewed 24 Nov: revisions asked for, made here, not yet re-read) |
| P6 | **Phone pause, looked at once:** Chad opens the hub's variables on his phone in the Cloudflare dashboard, reaches the edit form for `EARTHVIEW_ENABLED`, and **cancels without saving.** The exact taps are written into section 4 from what he saw, with the gate's value as shown. **This rehearses getting there. It does not prove that saving a pause works on that phone**, and no live toggle is made to prove it | Open |
| P7 | Chad's answer on D3: does EUMETSAT need a note before sustained requests? | Open (his call) |
| P8 | A fresh copy of **main** on the Mac for the status calls: `_review/earth-from-space-stage-d/`, `phase1/earthview-admin.sh` hash checked against main (the script is on main since the hub-to-main landing) | Open |
| P9 | The read tasks of section 3A created and **listed back** (ids and due times), after the line and before `FROM` | At the time |
| P10 | Hub health on the day: status file; the last hour's invocations all `ok`; the eight existing monitors Up | At the time |
| P11 | **Evidence preflight** (section 11a), done and recorded before the line is asked for: this Worker's actual log retention and sampling; which of the figures the reads need are available, from where, and for how long; a query or export that returns **every** record of an interval, shown complete on a known interval; where D1 rows read comes from. A source that cannot be read is named as such | Open |

## 2. Who notices what

| Stop condition (proposal 5.6) | Noticed by | How soon, as designed |
|---|---|---|
| 1. `exceededMemory` or `exceededCpu` | **"ME runs earthview"** if that slot never gets its end-of-run row; otherwise a read | 20 min for the slot to be overdue, up to 5 to the next poll, then UptimeRobot's own handling. **An estimate, not a bound** |
| 2. Any invocation ending other than `ok`, any layer | **A read only** | Next read |
| 3. A storage stop | **"ME trial earthview"** | Next poll after the row is written |
| 4. A picture's bytes differ from its record | **A read only** | Next read |
| 5. CPU at or above 5,000 ms with a picture run | **A read only** | Next read |
| 6. Three adjacent slots each with a validation refusal | **"ME trial earthview"** | When the third slot is due |
| 7. Another layer newly down or degraded | The eight existing monitors for `usgs` and `firms`; **a read only** for the rest | |
| 8. Six adjacent slots with no current frame while a newer one is listed | **"ME trial earthview"**, when the rows show a newer frame listed; a source outage alone is recorded, not alarmed | When the sixth slot is due |
| 9. Request budget excess, a manual run | **A read only** | Next read |
| The gate switched off during the trial | **"ME runs earthview"** (`not_collecting`) | Next poll |
| A run that never finishes for any other reason | **"ME runs earthview"** | As 1 |

An overdue slot says "completion missing". It does not say why.

## 3. Start

### 3.1 Choosing `FROM`

- `FROM` and `UNTIL` are ten-minute marks, 48 hours apart, in the exact form `2026-11-24T10:30:00Z`.
- **`UNTIL` + 10 minutes must fall 15 to 30 minutes before a scheduled read**, so the end-of-trial step (section
  5) is not left waiting. With reads at 07:00, 13:00 and 20:00 SAST, a `FROM` of **12:30 SAST** (10:30 UTC) does
  that: the trial ends 12:30 SAST two days later and the 13:00 read closes it. Chad is awake at both ends.

### 3.2 The change (Chad at the Mac, about 45 minutes around `FROM`)

1. **Usage read** (as the Stage C runbook 0.7, with D1 rows read added): Workers requests and CPU, R2 storage
   and operations, D1 rows read, Observability volume, each with its allowance and remainder. Missing figures are reported as missing.
2. At least 15 minutes before `FROM`, **Claude with Chad watching the pane** (or Chad): add `EARTHVIEW_FROM`,
   `EARTHVIEW_UNTIL`, and set `EARTHVIEW_ENABLED` = `1`, in one settings change.
3. Read back: all three values; deployed code hash unchanged; **27 bindings**; crons unchanged.
4. Ticks before `FROM` must log `earthview:not scheduled (before the window)`. Anything else: set the gate back
   to `manual` and stop.
5. Both health addresses (GET): 200, state `armed`. Both monitors Up.
6. Create the read tasks (section 3A) and list them back (P9).

### 3.3 The start read (at `FROM` + 30 minutes, Chad still there)

**A hold point: Chad does not leave the Mac until all of this has been seen.**

- The first slots have `run-start` and `run-end` lines; their rows are in `collector_runs` with `started_at`
  equal to **the scheduled timestamp on the ten-minute mark**. That is the trigger's scheduled time, not the second
  Cloudflare actually started it: a trigger delivered late is an accepted limit, not a fault. **This is the first
  live sight of a scheduled row** (monitoring proposal section 2). If `started_at` is not the scheduled mark, every
  slot will look incomplete and the runs monitor will alarm: pause and report.
- Health addresses: state `active`; the first slot that has come due is accounted for; nothing overdue.
- **D1 rows read and CPU of a health request in state `active`**, from the source named in the preflight (P11),
  set beside the isolated measurement (P4a). They are small while the trial is young and are read again at every
  read. If they cannot be read, that is said, and Chad decides whether to go on.
- **If this read finds an overdue slot or any adverse finding: pause (section 4). Nobody leaves.**
- Only then may Chad leave the Mac. **It stays awake with the Claude app open for the 48 hours.**

## 3A. The reads (Claude, read-only; 07:00, 13:00 and 20:00 SAST)

Each read is started by a scheduled message in the thread. **No push is sent for a clean read.** Each read writes
one ledger entry in the thread and in the result file, with a clock reading.

**Each read saves its raw records** (the invocation records, the log lines, the `collector_runs` rows since the
last read) into the evidence folder, with how they were obtained and the evidence that the set is complete: the
count the source reports against the count saved, every page fetched. **A truncated or sampled set is flagged. If a
source the read needs cannot be read, the interval is not called clean.**

1. Clock reading. Compare with the last read's time. **A read more than 60 minutes late, or a missing one, is
   recorded as a gap and pushed to Chad once.**
2. Both health addresses (GET, full body): state, settled, complete, overdue, findings.
3. Invocation records since the last read: every outcome on every layer; CPU of every invocation with a picture
   run (conditions 1, 2, 5).
4. `run-start` and `run-end` lines: one pair per admitted slot; each slot classified (proposal 5.7); requests to
   EUMETSAT counted (condition 9); any manual run.
5. The published picture: bytes and sha256 against its record (condition 4).
6. Other layers' public status (condition 7); R2 object count and bytes under `earthview/`.
7. Hourly CPU and memory percentiles since the last read; minute rows for any overlap.
8. D1 rows read and CPU of the health requests since the last read.
9. UptimeRobot: monitor states and any incident, **when the pane is displayed on that tab**; otherwise recorded
   as "not read at this read".

**On any stop condition: pause (section 4), then push to Chad.** Whether the cause was unrelated is looked at
after the pause.

**If a read cannot be made** (Mac asleep, tab signed out, pane unreachable): one push to Chad saying so, at once.
The interval is recorded as unread. Nothing is reported as clean.

**A read that never starts tells nobody.** The next read that does start finds the gap (step 1). If none starts
again, only the monitors remain.

Once a day, Chad: `bash earthview-admin.sh D-status-1 status` (then `D-status-2`), from the Stage D review copy.

## 4. Pause

**Who.** On an alert: **Chad, from his phone**, or Claude if the thread is alive and Chad says so. At a read:
**Claude**, if Chad's Stage D line allows it. If Claude cannot make the change, Claude does not look for another
way in: it pushes to Chad.

**Chad's phone steps** are filled in from P6. Until P6 is done this line is open.

1. Set `EARTHVIEW_ENABLED` to `manual`. Note the time. The two window variables stay.
2. Read back the variable, code hash, bindings, crons.
3. **What shows the pause worked is step 2 (the variable read back) and step 5 (the scheduler's refusals). An
   alert does not.** A pause made before `LAST` can turn "ME runs earthview" red (`not_collecting`) if it was Up,
   and one alert may follow: that alert is expected and is not a new fault. **But none may come:** a monitor that
   is already Down opens no new incident; after `LAST` the gate no longer decides the health answer; and delivery
   can fail. No alert is not evidence that the pause failed, and an alert is not evidence that it worked.
4. Read invocation records until every invocation that began before the read-back has ended, and for at least 15
   minutes. List any picture run among them and what it did. A trigger scheduled inside the window and delivered
   late may still run after `UNTIL`: that is reconciled, not a breach.
5. The next two ticks must log `earthview:not scheduled (EARTHVIEW_ENABLED is manual)`.
6. R2 list and public record: note the state.
7. Push to Chad; report in the thread; **write the pause into the ledger with its times.** The health addresses
   keep no history of the gate, so the ledger is the only record that a pause happened (monitoring proposal 3.5).
8. Nothing is repaired, deleted, recovered or restarted. **Resuming is Chad's decision, on his own line.**

A paused trial is not **met** (proposal 5.8).

## 5. The end of the window

`LAST` = `UNTIL` + 10 minutes. Admission ends at `UNTIL` by itself, whoever is watching.

1. **For a trial ending normally, the gate is left at `1` until `LAST`.** Setting it to `manual` earlier would
   turn the runs monitor red for nothing. This is tidy-up timing, not more admission: admission ends at `UNTIL`
   by the scheduled timestamp. **A stop condition overrides it: the pause of section 4 is made at once, before
   `LAST` or not.**
2. At the first read at or after `LAST`: any tick scheduled at or after `UNTIL` must have logged
   `earthview:not scheduled (after the window)`, with no `run-start` line.
3. **Then the gate is set to `manual`** (section 4, steps 1, 2, 4, 5, 6) and read back. **No new alert caused
   by the gate is expected after `LAST`**, because the gate no longer decides the health answer. **Recorded
   findings still apply:** this read may itself find a storage stop or a late row, and that alerts as it would at
   any other time.
4. Chad: `bash earthview-admin.sh D-status-3 status`.
5. **Usage read**, compared with the start.

If the gate was already `manual` before any tick after `UNTIL` ran, the result says **"the window's end was not
observed in production"**.

**The window variables stay set.** With them in place the health addresses keep answering for this trial: 200
`trial complete, nothing outstanding`, or 503 `trial ended with outstanding findings`.

## 6. Closeout

In this order. **The window variables are removed last, and only after the evidence is saved.**

1. **Save the evidence** into the result's evidence folder:
   - both health addresses, GET, full bodies, with the time;
   - every `collector_runs` row of layer `earthview` from `FROM` on, **with no upper time limit** (read-only);
   - each monitor's log and incidents from UptimeRobot (pane displayed; Chad at the Mac);
   - the ledger of reads, gaps, pauses and pushes;
   - what Chad received on his phone and by email, and when.
2. **The result** is written by the rule of proposal 5.8 and goes to GPT and Chad. **Written before the late look
   it is provisional, and says so.**
3. **A last look for late rows:** if step 1 was made less than 24 hours after `UNTIL`, the `collector_runs` read
   is repeated once after `UNTIL` + 24 hours. **Known limit, kept:** a read with no upper time limit covers the
   rows present at that read. It cannot show that no trigger admitted inside the window will run later still. The
   look at +24 hours is not a bound on how late a trigger can be delivered.
4. **The final result** is issued after the late look (the provisional one amended, or confirmed unchanged) and
   **reviewed by GPT before anything is removed.** No evidence and no earlier finding is deleted.
5. **Only then, on Chad's own line:** remove `EARTHVIEW_FROM` and `EARTHVIEW_UNTIL`; read back (the variables are
   gone, gate `manual`, code hash unchanged, 25 bindings, crons unchanged; both addresses 200 `no trial
   configured`; both monitors Up).

**"Up" after closeout means closed out. It does not mean the trial passed.** A new window is never set to hide an
unresolved result.

The two monitors stay. They are silent while no trial is configured.

## 7. The Stage D line (sketch, not a request)

`Approve: Earth from Space Stage D under proposal rev 2.5 section 5 and runbook rev 3.2: set EARTHVIEW_FROM <UTC>,
EARTHVIEW_UNTIL <UTC, 48 hours later> and EARTHVIEW_ENABLED 1; 288 slots; at most 864 requests to EUMETSAT plus at
most 12 diagnostic requests; no manual run; watched by the UptimeRobot monitors "ME runs earthview" and "ME trial
earthview" and by three reads a day by Claude (07:00, 13:00, 20:00 SAST) with my Mac kept awake; I accept that
nothing pauses the trial by itself; that an alert is sent once and not repeated, and at night waits until I see
it; that what the two monitors do not cover is found only if a later read happens, up to 11 hours apart, or not
during the trial if the reads stop; that the monitors do not read rows finished more than 24 hours after the end;
Claude may set EARTHVIEW_ENABLED to manual, and only that, on any stop condition of section 5.6 and at the end of
the trial`

Closeout (section 6, step 5) is a separate line. It is cleanup: it is not acceptance of a provisional result.

## 8. Recovery

Unchanged: Stage C runbook section 4.

**Code rollback during or after the trial (rev 3.1).** The file before 0.6.24 is 0.6.23 (`566a11b`, `7141beb8…afa1`).
**It does not have the Timeline pin `tl-2026-11-R3`.** If the Timeline page that names R3 has been released by then,
rolling the hub back to 0.6.23 makes that page fall back to its plain list. A code rollback is therefore not a
routine step of this runbook: the pause (section 4) is. A rollback needs its own line and the Timeline thread told
first (`docs/HUB-DEPLOY-RULE.md`, condition 6).

## 9. Decisions for Chad

| # | Question | Claude proposes |
|---|---|---|
| R1 | `FROM` at 12:30 SAST, so the trial starts and ends with you awake and a read closes it (3.1)? | Yes |
| R2 | The phone look (P6) before Stage D: open the edit form on your phone and cancel? About five minutes | Yes |
| R3 | A push for a missed or unreadable read, and for nothing else routine? | Yes |

## 10. GPT's answers to rev 3.1's questions (24 Nov 2026), and where each is adopted

| Question | GPT's answer | Where |
|---|---|---|
| Q1. Does section 0 state the exposure fully enough? | Substantially. State watcher silence, the wrong-picture limit and the gate-history limit; do not imply findings outside the horizon are kept; amend P4, cost and evidence | Section 0 points 4, 6, 7, 8; P4, P4a, P11 |
| Q2. Gate left at `1` until `LAST`? | Accepted for a normal end. A stop condition overrides it. Admission still ends at `UNTIL` | Section 5 step 1 |
| Q3. Closeout order? | Accepted, with a final result issued and reviewed after the late look. Nothing deleted | Section 6 steps 2 to 5 |
| Q4. Is the phone look enough? | As a rehearsal of getting there. Not proof that a save works. Record the limit, the gate's value and the taps. No live toggle | P6 |
| Q5. First scheduled row a hold point? | **Yes.** No leaving until a scheduled row with its scheduled timestamp is seen, the first due slot is accounted for and the cost evidence is readable. On an overdue slot or adverse finding: pause | 3.3 |

GPT also said the 12:30 SAST start is a reasonable proposal and that no date or window is approved by its review.

**No new question for GPT in rev 3.2.** It is returned for a check that the points above were adopted as meant.

## 11. Not checked while writing this

- The exact taps on Cloudflare's mobile dashboard (P6 is for that).
- Whether the invocation records show D1 rows read per request, or only the account's total (3.3 and 3A step 8
  record whichever exists, and say which).
- Workers log retention, sampling and export on this account. **Not checked; P11 is for that.**

## 11a. The evidence preflight (P11): what is to be established, read-only, before the Stage D line

Cloudflare's documentation, read 24 Nov 2026, says Workers Logs are kept seven days on the Paid plan, that the
head sampling rate defaults to 1 (every request), and that logs can be queried in the dashboard's Query Builder or
exported. D1's documentation says rows read is returned with each query and that D1 metrics are kept 31 days.
**That shows the evidence can exist. It does not show this Worker's settings, or that each figure the reads need is
kept that long.** So, on the account itself, with the Cloudflare tab displayed:

1. The `mother-earth` Worker's observability settings as they are: logs on or off, the sampling rate. Read, not
   changed. If the rate is below 1, the reads cannot count every invocation, and that goes to Chad before any line.
2. For each figure a read uses (invocation outcome, CPU, the `run-start` and `run-end` lines, wall time): where it
   is read, how far back it goes, and whether it is exact or a percentile.
3. One query or export that returns every record of a known past hour, with the count the source reports beside
   the count obtained. The method is written into section 3A.
4. D1 rows read: whether one health request's figure can be obtained, or only a total for the database over a
   period. **A total is not passed off as one request's figure.** Worker logs and D1 metrics are different sources
   and are named separately.

The preflight changes no setting. If it shows a setting must change (sampling, for one), that is its own approved
step.
