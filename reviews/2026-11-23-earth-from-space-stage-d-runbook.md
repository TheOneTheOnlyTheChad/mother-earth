# Earth from Space — runbook for Stage D on the independent-monitoring basis (runbook rev 3.1, DRAFT for review)

**Rev 3.1, 23 Nov 2026 19:40 UTC (clock reading): brought up to date, nothing else changed.** Since rev 3 was written the
hub went to 0.6.24 (the Timeline pin; Earth from Space code unchanged) and main's hub file became the deployed file
(landing `7adef36`). Changed here: the hub version in the basis and P1; P1a (no hub deploy during the trial); P8
(the review copy comes from main); the rollback note in section 8; the revision numbers in the line. **GPT had not
yet reviewed rev 3; this is the version to review.**

23 Nov 2026, 15:16 UTC (clock reading). Written on Chad's go of 23 Nov for docs work. **Docs only. Nothing here is
approved, scheduled or set. Stage D is not cleared.**

**What this replaces.** Sections 2, 2a and 3 of `reviews/2026-11-22-earth-from-space-stage-c-runbook.md` (rev 2):
the hourly inspections, the heartbeat pushes, the "90 minutes without a push" duty and the email alarm. Sections
0, 1, 4 and 5 of that file are the record of Stage C and stand as written. **The old duties are retired only when
the replacement has been tested and this runbook accepted** (monitoring proposal section 10).

**Basis.** Monitoring proposal rev 3.1 with Chad's "M1 to M8 yes"; storage-to-release proposal rev 2.3 (draft,
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
| P4 | The fixture alert test (`reviews/2026-11-23-earth-from-space-alert-test-plan.md`) run and its result read by GPT; or, if Chad decides against it, the generic delivery test, with "live true positive untested" stated in the Stage D line | Open (plan in review) |
| P5 | This runbook and proposal rev 2.4 read by GPT and accepted by Chad | Open |
| P6 | **Phone pause, looked at once:** Chad opens the hub's variables on his phone in the Cloudflare dashboard, reaches the edit form for `EARTHVIEW_ENABLED`, and **cancels without saving.** The exact taps are written into section 4 from what he saw | Open |
| P7 | Chad's answer on D3: does EUMETSAT need a note before sustained requests? | Open (his call) |
| P8 | A fresh copy of **main** on the Mac for the status calls: `_review/earth-from-space-stage-d/`, `phase1/earthview-admin.sh` hash checked against main (the script is on main since the hub-to-main landing) | Open |
| P9 | The read tasks of section 3 created and **listed back** (ids and due times), after the line and before `FROM` | At the time |
| P10 | Hub health on the day: status file; the last hour's invocations all `ok`; the eight existing monitors Up | At the time |

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
6. Create the read tasks (section 3.3) and list them back (P9).

### 3.3 The start read (at `FROM` + 30 minutes, Chad still there)

- The first slots have `run-start` and `run-end` lines; their rows are in `collector_runs` with `started_at` on
  the exact mark. **This is the first live sight of a scheduled row** (monitoring proposal section 2). If the
  marks are not exact, every slot will look incomplete and the runs monitor will alarm: pause and report.
- Health addresses: state `active`, nothing overdue.
- **D1 rows read and CPU of a health request in state `active`**, from the invocation records: the first real
  figures (not measured before; they are small while the trial is young, and are read again at every read).
- Then Chad may leave the Mac. **It stays awake with the Claude app open for the 48 hours.**

## 3A. The reads (Claude, read-only; 07:00, 13:00 and 20:00 SAST)

Each read is started by a scheduled message in the thread. **No push is sent for a clean read.** Each read writes
one ledger entry in the thread and in the result file, with a clock reading.

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
3. **The pause itself turns "ME runs earthview" red** (`not_collecting`) within a poll or two, and one alert is
   sent, unless that monitor was already Down. **That alert is expected. It confirms the pause; it is not a new
   fault.**
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

1. **The gate is left at `1` until `LAST`.** Setting it to `manual` earlier would turn the runs monitor red for
   nothing.
2. At the first read at or after `LAST`: any tick scheduled at or after `UNTIL` must have logged
   `earthview:not scheduled (after the window)`, with no `run-start` line.
3. **Then the gate is set to `manual`** (section 4, steps 1, 2, 4, 5, 6) and read back. No alert is expected:
   after `LAST` the gate no longer decides the health answer.
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
2. **The result** is written by the rule of proposal 5.8 and goes to GPT and Chad.
3. **A last look for late rows:** if step 1 was made less than 24 hours after `UNTIL`, the `collector_runs` read
   is repeated once after `UNTIL` + 24 hours and anything new is added to the result.
4. **Only then, on Chad's own line:** remove `EARTHVIEW_FROM` and `EARTHVIEW_UNTIL`; read back (the variables are
   gone, gate `manual`, code hash unchanged, 25 bindings, crons unchanged; both addresses 200 `no trial
   configured`; both monitors Up).

**"Up" after closeout means closed out. It does not mean the trial passed.** A new window is never set to hide an
unresolved result.

The two monitors stay. They are silent while no trial is configured.

## 7. The Stage D line (sketch, not a request)

`Approve: Earth from Space Stage D under proposal rev 2.4 section 5 and runbook rev 3.1: set EARTHVIEW_FROM <UTC>,
EARTHVIEW_UNTIL <UTC, 48 hours later> and EARTHVIEW_ENABLED 1; 288 slots; at most 864 requests to EUMETSAT plus at
most 12 diagnostic requests; no manual run; watched by the UptimeRobot monitors "ME runs earthview" and "ME trial
earthview" and by three reads a day by Claude (07:00, 13:00, 20:00 SAST) with my Mac kept awake; I accept that
nothing pauses the trial by itself; that an alert is sent once and not repeated, and at night waits until I see
it; that what the two monitors do not cover is found only if a later read happens, up to 11 hours apart, or not
during the trial if the reads stop; that the monitors do not read rows finished more than 24 hours after the end;
Claude may set EARTHVIEW_ENABLED to manual, and only that, on any stop condition of section 5.6 and at the end of
the trial`

Closeout (section 6, step 4) is a separate line.

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

## 10. Questions for GPT

- **Q1.** Does section 0 state the exposure of monitoring proposal section 7, "no delay, no repeat" and the
  24-hour horizon fully enough for the Stage D line?
- **Q2.** Is leaving the gate at `1` until `LAST` (section 5) right, given that an earlier `manual` would raise a
  `not_collecting` alert?
- **Q3.** Is the closeout order right: evidence, result, late-row look, then the window variables on their own
  line?
- **Q4.** Is the phone look (P6) a sufficient check that Chad can pause, without making a change?
- **Q5.** Should the first live sight of a scheduled row (3.3) be a hold point: no leaving the Mac until it is
  seen on the exact mark?

## 11. Not checked while writing this

- The exact taps on Cloudflare's mobile dashboard (P6 is for that).
- Whether the invocation records show D1 rows read per request, or only the account's total (3.3 and 3A step 8
  record whichever exists, and say which).
- Workers log retention.
