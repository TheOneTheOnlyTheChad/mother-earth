# Earth from Space — from the first stored picture to the page: proposal (rev 2, for GPT)

22 Nov 2026. Asked for by GPT's review of the Stage B result and started on Chad's "Go" of 22 Nov. **Docs only. Nothing
here is built, deployed, stored, enabled or approved.** Every production step named below needs Chad's own exact
Approve line; the lines are sketched in section 10 and are not requests yet.

**Rev 2 (22 Nov)** answers GPT's bounded hold on rev 1.1
(`reviews/2026-11-22-earth-from-space-storage-to-release-proposal-gpt-review.md`): the trial is finite with stops that
can actually be carried out (5.5 to 5.7); the result rule is measurable (5.8); Stage C's retry and verdict are bounded
(4.3 to 4.5); the REGISTER draft moves to Stage C (7); and the factual corrections are made. Section 13 lists every
change. Rev 1.1 only reworded the memory paragraph of rev 1.

State it starts from: hub **0.6.21** live (deployed code sha256 `2028e2da…01c3`), `EARTHVIEW_ENABLED` not set, no object
under `earthview/` in storage, the tab not on the live page. Main's `phase1/worker.js` is still 0.6.19 and is the
rollback file. Branch `earth-from-space-rc`. **Stage B is MET** under its proposal rev 2.1 section 4, with the limits
in section 1 (GPT's closure, 22 Nov).

## 0. Summary

Three separate stages, each with its own approval, its own read-backs and its own way back:

| Stage | What happens | Requests to EUMETSAT | What becomes public |
|---|---|---|---|
| **C. First stored picture** | Storage is set up; **one** manual run stores one verified frame; nothing is scheduled | 3; 6 only if the one conditional second attempt is used | The hub's record and one picture become **publicly downloadable by URL** |
| **D. Scheduled collection, a finite trial** | Exactly 288 ten-minute slots (48 hours), then collection returns to `manual` by default | at most 3 per slot, 864 in all (schedule-derived, see 5.2) | The same URLs, now changing |
| **E. Page release** | The tab, the page, Sources go live | none added | The feature |

A stage starts only after the one before it has a written result that GPT has read and Chad has accepted.

One more hub version (**0.6.22**) is needed before Stage C: the three-state gate (section 2), the key in a header for
the Earth from Space admin routes (section 3), a caller script, and one log line (section 9). That candidate goes to
GPT before any deploy.

## 1. Evidence this rests on, and its limits

Carried from Stage A and Stage B, unchanged, into every decision below:

1. **Busy coexistence was not observed.** All three Stage B runs were quiet; run 2 ended 4.6 s before the heavy hourly job.
2. **Three different isolates, each on its first validation.** No second validation in one isolate; no isolate shared
   with a scheduled job.
3. **No memory bound.** The fetch-minute buckets containing the three probes report maximum isolate-memory readings
   of 54,827,181, 54,818,477 and 54,423,159 bytes (limit 128 MB per isolate). Each bucket holds two or three
   invocations, so tying those maxima to the probes is an inference, not an invocation-level measurement. The heavy
   hourly job's bucket (one invocation) read 34,791,643 bytes. These are sampled isolate-memory readings, not peaks
   and not decoder allocations, and they are not to be added to predict headroom in a shared isolate.
4. **Validation cannot be timed from inside the runtime.** The runtime's clock does not advance during computation, so
   start and end read the same. This is "unmeasurable", not "zero cost". The only cost figure is whole-request CPU
   (587 to 827 ms in Stage B; at most 1,016 ms in Stage A), which is not decoder time alone.
5. **Stage A's formal verdicts stay INCOMPLETE** at both sizes (one HTTP 503 for the check image per size).
6. **Validation limits rest on few frames**: Stage A's twelve hours of one date, plus Stage B's three.
7. The served-time header has been present and correct on every GeoColour response seen from a Worker so far. That is
   an observation of the service, not a guarantee by it.

**What scheduled collection changes, that no stage so far has exercised:** the decode will run inside the hub's
five-minute scheduled invocation, awaited after the earthquake and aircraft collectors of that same invocation, 144
times a day, in isolates Cloudflare may reuse for the hub's other scheduled jobs and for visitors' requests.

**Where the picture run has been seen to sit among the hub's jobs** (one day's records, 21 Nov): the five-minute
trigger was scheduled at second :08; the hourly job at hh:07:59; the fifteen-minute job at second :40; the
half-hourly job at hh:11:38 and hh:41:38. Stage B's runs took 11 to 16 s. **These are observations of one day, not
guarantees.** Cloudflare may schedule differently, any job may run long, and the picture run's own duration is not
bounded by us (5.4). Nothing in this proposal relies on the picture run staying clear of another job, and none of the
safety arguments do. Whether runs overlapped another job, and whether validations repeated in or shared an isolate, is
**read from evidence afterwards** (the new log line of section 9), never inferred from the schedule.

Stage D is itself the first observation of points 1 to 3 at scale, and is written as a finite trial with stop
conditions, not as a release.

## 2. The manual run and the gate: why a new gate value is needed

Since 0.6.21 the manual run (`/admin/run/earthview`) is refused unless `EARTHVIEW_ENABLED` is `1`, and `1` also starts
the scheduled path at the next ten-minute tick. So today there is **no way to store one frame without also starting
scheduled collection**.

**Proposed (0.6.22):** the variable takes three states.

| `EARTHVIEW_ENABLED` | Stage B probe | Manual run | Scheduled run |
|---|---|---|---|
| not set | allowed | refused, no request, nothing written | not run |
| `manual` | refused (409, as for any set value today) | **allowed** | not run |
| `1` | refused | allowed | run every ten minutes |
| anything else | refused | refused | not run |

Two one-line conditions change (`JOBS.earthview` accepts `manual` or `1`; the scheduled line stays `=== '1'`). The
probe route's rule is unchanged, so a supplementary busy observation stays possible only while the variable is not set.
Tests (as GPT asks): every cell of the table through the **actual handlers**, the five-minute scheduled wrapper
included, each refusal asserted to make **zero** requests to the source and **zero** storage calls of any kind (spies
on fetch, R2, D1, caches), with a break for each cell. Unknown values fail closed.

Alternatives considered and not proposed: setting `1` and trying to finish between two ticks (a race against a
schedule we do not control); using the storage hold to block the scheduler (a hold blocks the manual run too).

## 3. Admin calls put the key in the URL, and Cloudflare stores the URL

Stage B established that Cloudflare's invocation log masks the `Authorization` header and that the hub's setting
`redact_query_string` is **false**. `/admin/earthview/<action>?key=…` and `/admin/run/earthview?key=…` carry the admin
key in the query string, so every such call would write the key into the hub's stored logs.

**Proposed (0.6.22), limited to the Earth from Space routes** (GPT: yes, keep it limited; other jobs' auth is separate
scope): for `/admin/earthview/<status|hold|recover|sweep|release>` and `/admin/run/earthview`, the key is accepted in
`Authorization: Bearer …` exactly as the probe does, and a request carrying `key` in its query string is refused with
400 before the key is compared. `apply` and `plan` stay in the query string (not secret).

**What the refusal does not do.** Rejecting `key=` cannot stop the platform logging the URL it was sent: the URL is
logged on arrival. The refusal only makes the mistake useless and visible. Therefore: **no test, rehearsal or example
ever puts a real credential in a URL**; the suites use a made-up key; the caller script cannot build such a URL.

Tests (as GPT asks): exact path (no prefix or suffix match), method per route, missing header, wrong scheme, wrong key,
`key=` present with a right header, each asserted to make no request to the source and no storage call.

**Who makes the calls.** Chad, from Terminal, with a new script `phase1/earthview-admin.sh` built like the Stage B
caller: reads `ADMIN_KEY` from `~/mother-earth/KEYS.md` itself, passes it to curl on standard input, never prints it,
`curl -q`, emptied environment, no redirects, no retry, fixed hub address, one results folder. Claude never types or
sees the key.

**Logical step ids and atomic claims** (GPT, HOLD 3). Every call that can change anything is launched under a named
step id fixed in the runbook (`C2-hold`, `C4-recover`, `C5-release`, `C7-run-1`, `C7-run-2`, `D-status-<n>`, …). Before
the call the script creates `<step id>.claim` atomically (`mkdir`), as the Stage B caller does; a step id that is
already claimed is refused, and a claim is never removed. So a mutating step cannot be launched twice by a repeated
command, a second Terminal tab or an up-arrow. Dry runs and `status` are read-only and are numbered, not claimed.
Each claim, answer and exit code is kept. Suite with breaks; GPT runs it natively on macOS as before.

**Masking is verified on a harmless call first.** Step C1 is `status`, which writes nothing. Its invocation record is
read before any mutating step; a readable key stops everything.

## 4. Stage C — the first stored picture

### 4.1 Preconditions (all read-only, all recorded)

- Hub 0.6.22 deployed on its own line, read back exactly (deployed hash, settings, 24 bindings, 4 crons),
  `EARTHVIEW_ENABLED` not set.
- No object under `earthview/` (R2 list). Any object found: stop and report.
- No R2 lifecycle rule on the bucket matches `earthview/`. Read from the dashboard and recorded.
- **REGISTER:** the entry is filed (recommended), or Chad's Stage C line says in words that he approves a publicly
  downloadable frame before the entry exists (section 7).
- Hub health read: public status file; the last hour of invocations all `ok`.
- Cloudflare's CPU and memory percentiles for the previous hour, as a baseline.

### 4.2 Sequence (Chad at the Mac for about 30 minutes; Claude reads back after each step)

| Step id | Step | Who | Writes | Read-back before the next step |
|---|---|---|---|---|
| C1 | `status` | Chad's script | nothing | pointer missing, list missing, 0 objects, no hold; **the invocation record shows the key masked** |
| C2-hold | `hold` (apply) | Chad's script | `earthview/hold.json` | status shows the hold |
| C3 | `recover` dry run | Chad's script | nothing | plan mode is `first start`; note the plan id |
| C4-recover | `recover` apply with that plan id | Chad's script | an epoch marker, an empty pointer, an empty list | pointer and list present, same epoch, 0 pictures, guards pass |
| C5-release | `sweep` and `release` dry runs, then `release` apply | Chad's script | removes the hold | no hold, guards pass |
| C6 | Set `EARTHVIEW_ENABLED` = `manual` in the dashboard | **Claude, with Chad watching** (see below) | a new Worker version, same code | the variable reads `manual`; deployed code hash unchanged; bindings and crons unchanged; the next scheduled tick's line reads "not scheduled" |
| C7-run-1 | `run` | Chad's script | section 4.4 | section 4.4 |

C6 follows C5 so that storage is set up and released while no run of any kind can start.

**Why Claude makes the change in C6.** Stage D's emergency pause (5.6) is this same change in the other direction.
Claude's code uploads to this account are refused by a safety check, and whether Claude can change one plain variable
in the dashboard is **untested**. C6 tests it under Chad's eye, on his line, where a failure costs nothing: if Claude
cannot do it, Chad does it, and Stage D's pause arrangements are rewritten before Stage D is asked for.

C7's window is hh:21 to hh:24 or hh:51 to hh:54, minutes that were quiet on 21 Nov. That is a preference, not a
guarantee of a quiet hub.

### 4.3 The one conditional second attempt

`C7-run-2` is permitted only if **all** of these are established and recorded first:

1. Run 1 ended for a **positively identified source failure**: the listing request got no answer or a non-200; or the
   picture or the check image got no answer, a time-out or a non-200; or a response arrived **with no `Warning` header
   at all**. The run's own answer or log line must say so.
2. **Nothing was published**: the pointer's frame is still empty.
3. **Storage is reconciled**: `status` and the R2 list agree; every object and list entry is accounted for (a run that
   failed at the source should have left none; one that failed later may have left a pending entry or a stored copy,
   which is then named in the record and left alone).
4. **The hub is healthy**: no non-`ok` invocation since run 1 started.
5. Not sooner than 10 minutes after run 1 started, and **not later than 40 minutes after it**. Past that, Stage C ends
   incomplete and a new line is needed.

**No second attempt, ever, after:** a header naming a **different** frame time (a finding about the service, kept as
such); a validation refusal; a storage stop; any Cloudflare resource ending; or **a lost answer or client time-out**.
A lost answer does not show that nothing was stored: the run may have completed. It is reconciled (the invocation
record, the run log, `status`, the R2 list), and whatever the reconciliation finds is the outcome of run 1.

### 4.4 Read-backs after a run

- The run's saved answer, its claim, its log lines (including the new isolate line), its invocation record (outcome,
  **whole-invocation CPU**, key masked).
- `status`: one picture, one list entry, in role as current; pointer epoch = list epoch; guards pass.
- R2 list under `earthview/`. **The clean completed state is four small records and one picture**: `current.json`,
  `held.json`, `state.json`, one epoch marker, one `frames/<epoch>/<id>/picture.jpg`. Anything else is reported.
- Public reads: `/snapshot/earthview/meta` returns the frame; the picture URL returns bytes whose sha256 and size equal
  the pointer's; the frame time equals the `Warning` time recorded for both responses.
- The picture is looked at by Chad and Claude in the private preview page (Mac review copy against the live hub).
- Cloudflare's hourly CPU and memory percentiles for that hour and the minute rows by event type, **captured then**.
- Hub health: status file; every invocation from 10 minutes before the first step to 30 minutes after the last.

### 4.5 Result rule for Stage C

Every attempt is reported in full. A later success never removes an earlier finding.

- **Not met:** any `exceededMemory` or `exceededCpu` on the hub; the containing invocation's CPU at or above 5,000 ms
  (the provisional checkpoint, kept from Stage B); a picture readable by URL that differs from its record; a record
  state the guards refuse; or **a sound frame refused by validation** (established by examining the frame; "not met
  for validation").
- **Met:** a frame published by an authorised attempt with every read-back of 4.4 as stated, and none of the above.
  If run 1 failed at the source and run 2 published, the result reads "met on the second attempt; first attempt:
  <source failure>", and the failure stays in the record.
- **Incomplete:** everything else, including: the source failed twice; a wrong-frame header; a validation refusal that
  cannot be classified as a faulty or a sound frame; an unreconciled lost answer; missing evidence of any kind.

Not-met takes precedence. Missing evidence is never counted as a pass.

### 4.6 After Stage C, until Stage D

The variable stays `manual`: nothing runs by itself. The stored frame ages and **stays publicly downloadable**. Nothing
is deleted: the collector deletes only after publishing a newer frame.

### 4.7 Way back from Stage C

- **Stop:** delete the variable, or leave `manual`. Neither cancels an invocation already admitted (5.6 applies here
  too, for the single manual run).
- **What remains:** four small records and one picture of about 0.5 to 0.7 MB, reachable by anyone who has or guesses
  the URL. That no page links to them is not privacy.
- **Removing them** is a separate action on its own Approve line and is **not done while an earlier writer could still
  be alive**: first the variable is unset and read back; then a hold; then every invocation admitted before the pause
  is shown to have ended (invocation records); only then does Chad delete the listed keys in the dashboard, and the
  prefix is read back empty twice, some minutes apart. The hub has no route that deletes them and none is proposed.
- **Code:** 0.6.22 with the variable unset behaves as 0.6.21 does today, apart from the header-only key on these
  routes. Full rollback is main's 0.6.19 file.

## 5. Stage D — scheduled collection, as a finite trial

### 5.1 Start, slots and end

- **Start:** `EARTHVIEW_ENABLED` is changed from `manual` to `1` and read back. The read-back time is **T0**.
- **Slot 1** is the first five-minute tick after T0 whose minute is 0 to 4 past a ten-minute mark. Slots follow every
  ten minutes. **The trial is exactly 288 slots.**
- **End:** when slot 288's invocation has ended (its record is read), the variable is set back to **`manual`**, read
  back, and in-flight work is reconciled (5.6). **This is the default and needs no decision.** Collection does not
  continue while the result is read.
- **Any continuation** is a separate Approve line with its own end time, monitoring and request allowance.
- **No manual run** is made during the trial. One would need its own authorisation and is counted separately.

### 5.2 Request budget

| | Per slot | 288 slots |
|---|---|---|
| Listing request | 1 | 288 |
| Picture and check image, only when a newer frame is listed | 2 | at most 576 |
| **Total to EUMETSAT** | **at most 3** | **at most 864** |

This ceiling is **derived from the schedule and the code path** (one run per slot, no retry inside a run). It is not a
counter the hub enforces. The trial's report counts actual requests from the run log and compares. A frame that failed
is asked for again by the next slot only while it is still the newest listed, so a failing source costs the same 3 per
slot. Chad's open question, whether sustained requests need a note to EUMETSAT first, is his to answer before Stage D
(decision D3).

### 5.3 Concurrency across isolates

Safety never depended on one isolate or one run at a time:

- every write to the pointer and the list is conditional on the version read and fenced by the epoch;
- each picture's key holds 96 random bits drawn by its own run and is written create-only;
- two runs that fetch the same frame both store a copy; one publishes; the other ends `superseded`; its copy is out of
  role and is removed by a later cleanup after the grace period;
- cleanup may overlap, stop half way or act on an old view (rules 1 to 6 in the code, reviewed 20 Nov).

**A stop is not "nothing written".** A run that stops late (storage changed, a fenced write refused, an interruption)
may already have listed a pending entry or stored a copy. What a stop guarantees is that the run does **no further**
storing, deleting or publishing. What it left is reconciled: pending entries and unpublished copies are out of role
and are removed by the grace-period cleanup, or adopted by a `sweep` after a recovery. The trial counts them.

The picture run is awaited after the earthquake and aircraft collectors inside the same scheduled invocation. Its CPU
and memory are charged to that invocation, and it shares the isolate with whatever else runs there. No claim is made
that it cannot affect them: an invocation ended by Cloudflare for CPU or memory is ended as a whole, and what the
earlier collectors had completed by then is what the trial reads.

### 5.4 Timing and deadline limits, stated plainly

- The collector has **no whole-run deadline**, and none is added (GPT: acceptable).
- Its three source requests have time-outs: 30 s, 90 s, 90 s. **Their sum, 210 s, is only the most the source requests
  may wait. It is not a maximum duration of the run**: the earlier collectors of the same invocation, storage calls,
  decoding and cleanup are outside it. It is not used anywhere to argue that runs cannot overlap.
- **Nothing of ours can interrupt the decode.** It is synchronous; the runtime's clock does not move during it; no
  timer fires inside it. The only enforcement during decoding is Cloudflare's own limit on the invocation.
- **The containing trigger is the five-minute cron.** Its CPU and wall-time limits, as configured on this account, are
  quoted from the dashboard and Cloudflare's limits page in the candidate packet. The manual HTTP run of Stage C is a
  different kind of invocation and does not inherit the scheduled limits; its own are quoted too.
- Timestamps in the run's records bracket network and storage calls, not computation. **Cost is reported as
  whole-invocation CPU**, never as decoder cost.
- **Provisional checkpoint, kept from Stage B:** whole-invocation CPU at or above **5,000 ms** for any invocation that
  contains a picture run is a stop condition and a not-met finding. It is a checkpoint we chose, far below any
  platform limit expected; the candidate packet states the platform limit beside it.

### 5.5 Monitoring: what is actually covered

A chat thread is not an unattended monitor, and this proposal does not pretend otherwise. What is proposed:

- **Inspections by Claude at fixed times, one per hour, 49 in all** (T0 + 15 min, then hourly, then the end), each
  started by a scheduled message in this thread. Each reads, read-only: the hub's invocation records since the last
  inspection (every outcome, CPU, the picture runs' log lines), the run log's `earthview` outcomes slot by slot, the
  other layers' public status, and the R2 object count under `earthview/`.
- **What that depends on:** the Mac awake, the Claude desktop app open, the dashboard tab signed in, and this thread
  alive, for 48 hours including two nights. Chad kept the Mac open overnight for Stage A. He is asked to do the same.
- **Maximum inspection interval: 60 minutes by plan.** So a stop condition can go undetected for up to about an hour,
  plus the time to act. "Immediate" in rev 1 was wrong; **"paused on detection"** is what can be delivered.
- **If an inspection cannot read** (Mac asleep, tab signed out): Claude sends a push notification to Chad's phone and
  says so in the thread; the interval is recorded as **unmonitored**. Claude cannot pause either while the pane is
  unreachable. After **two** consecutive unreadable inspections the notification asks Chad to pause from his phone
  (the variable in Cloudflare's dashboard). Unmonitored intervals are reported in the result and are never treated
  as clean; what happened in them is read from Cloudflare's stored records once access returns.
- **An independent alarm** is wanted and not yet established: whether Cloudflare can notify Chad by email on Worker
  errors for this account is to be checked and reported in the candidate packet. If it can, it is set up before
  Stage D on Chad's line. If it cannot, the hourly inspection is the only detection, and that is stated in the
  approval line.
- `status` (needs the key) is run by Chad's script once a day, under step ids `D-status-1` and `D-status-2`, and at
  the end.

### 5.6 Stop conditions, and what a pause is

**Pause on detection of any of these. Whether the cause was unrelated is investigated after the pause, not before:**

1. any `exceededMemory` or `exceededCpu` on the hub;
2. any hub invocation ending other than `ok`, on any layer;
3. a storage stop from any run (`storage record needs repair`, `storage changed during the run`, `storage busy`);
4. a picture readable by URL whose bytes differ from its record;
5. whole-invocation CPU at or above 5,000 ms in an invocation containing a picture run;
6. three consecutive slots ending in a validation refusal (picture or check image);
7. another layer newly `down` or `degraded` since T0;
8. no frame published for six consecutive slots while successful source checks list a newer frame than the one held
   (this is where persistent check-image failures, missing served-time headers and wrong-frame headers land);
9. the trial's actual request count exceeding 3 per slot.

Conditions 6 and 8 pause the trial; they do not by themselves say whose fault it was (5.8).

**The pause procedure** (decision D2: Chad's Stage D line authorises Claude to do exactly this, for all nine
conditions, and nothing else):

1. Set `EARTHVIEW_ENABLED` to `manual` in the dashboard. Note the time.
2. **Read back** the variable, the deployed code hash, bindings and crons.
3. **A pause does not cancel admitted invocations.** Read the invocation records until every invocation that started
   before the read-back has an end record, and for at least 15 minutes; list any picture run among them and what it
   did (published, stored, cleaned up).
4. Read the next two scheduled ticks' lines: both must say "not scheduled".
5. Read the R2 list and the public record; note the state.
6. Push notification to Chad, and a report in the thread: the condition, the evidence, the times, the state left.
7. Nothing is repaired, deleted, recovered or restarted. No storage is deleted while an earlier writer could still
   repopulate it. Any next step is Chad's.

A hold (Chad's script) is the second lever. It also only prevents new runs.

### 5.7 What is recorded for every slot

Each of the 288 slots is classified from the run log and the invocation records as exactly one of: **published**;
**nothing newer**; **superseded**; **source check failed** (with cause); **picture or check image failed** (which,
with cause); **served time missing** (no header); **wrong frame named**; **validation refused** (with the recorded
reason and figures); **storage stop**; **not run** (no invocation found for the slot, or the gate line says so);
**unknown** (records missing or contradictory). The table is part of the result. So are: the isolate line of every
picture run (isolate id, age, scheduled runs and validations already made in it), from which repeated and shared-
isolate validation is **counted**; every wall-span overlap of a picture run's invocation with another hub invocation;
hourly CPU and memory percentiles for all 48 hours and the minute rows for overlap minutes, captured as the trial
runs; R2 object count and bytes; actual requests to EUMETSAT.

### 5.8 Result rule for the trial

**Advancement, defined.** The collector sees only the newest listed time at each poll, not every frame that existed
between polls. So the measure is built from what it saw:

- An **eligible time** is a distinct frame time that a successful source check, in slots 1 to 288, reported as newest
  and that was newer than the frame held at that moment. The frame held at T0 (Stage C's) is not eligible. A time
  first seen in slot 288 is eligible: it was attempted in that same run.
- Each eligible time ends **published** (in the slot that first saw it or a later one) or **missed**; each miss
  carries the slots in which it was the newest and why each attempt failed.
- Frames that came and went between two polls are invisible to this measure and are not claimed either way. Slots
  with a failed check, `not run` or `unknown` are counted separately and are not folded into the ratio.

**Validation refusals, classified.** A refusal is examined, not assumed. The refused picture is not stored, so the
evidence is the recorded reason and figures and, where needed, a fresh request for that same frame time from Chad's
Mac. Up to **12** such diagnostic requests are allowed in total, counted separately from the 864, and named in the
Approve line. Each refusal ends as: **faulty frame correctly refused**; **sound frame wrongly refused**; or
**unclassified** (the evidence does not decide; a re-request is not proof of what was served the first time).

**Verdict, not-met first:**

- **Not met:** stop condition 1, 4 or 5 occurred; or condition 2, 3 or 7 occurred and is not shown unrelated by
  independent evidence; or any **sound frame wrongly refused** ("not met for validation"); or a pointer picture was
  deleted or unreadable at any time.
- **Met**, only with all of:
  - all 288 slots completed without a pause;
  - no slot `unknown`; every `not run` explained;
  - **published eligible times at least 80% of eligible times, and at least 230 eligible times seen.** 80% is a
    provisional checkpoint for Chad to approve or change **before the start** (decision D4), not a derived number;
  - every miss and every refusal diagnosed and classified, none unclassified;
  - at least one cleanup observed deleting pictures past the grace period, with the current and previous pictures
    present and matching their records before and after it;
  - evidence, from the isolate lines, of validations repeated in one isolate and of an isolate shared with another
    scheduled job, **or** an explicit statement that none occurred (which leaves those cases unobserved and is said
    so in the result);
  - no unmonitored interval whose stored records could not be read afterwards.
- **Incomplete:** everything else: a pause for conditions 6, 8 or 9 or for a source-side cause; fewer than 230
  eligible times; a ratio under 80% whose misses are source failures; any unclassified refusal; any missing evidence.

Persistent source-side trouble therefore yields **incomplete**, never met and never not-met for the hub: check-image
failures, missing served-time headers and wrong-frame headers are counted by kind, and each wrong-frame occurrence is
kept as a finding about the service whatever happens afterwards.

The trial does not prove a memory bound. It replaces three readings with several hundred under the real schedule.

### 5.9 Failure and expiry behaviour (already built; what the trial checks)

| Situation | Hub | What a reader of the record sees |
|---|---|---|
| Source lists nothing newer | no picture request; pointer untouched | displayed frame, "newest listed" equal to it |
| Source check fails | outcome recorded apart from the frame | the last frame, with the failed check and its time |
| Picture or check image fails; no served-time header; wrong frame named | nothing published; pointer untouched; nothing deleted | the last frame; the failure reason; no requested time is ever shown as a frame time |
| Validation refuses | the same | the same |
| Nothing newer listed for 45 minutes (provisional) | unchanged | the page says it is waiting, plainly; not a delay bound |
| Collection off or paused | nothing new starts | the last frame and the time of the last check, which stops advancing |
| Storage stop | the run does no further storing, deleting or publishing; what it left is reconciled (5.3) | the last frame; the stop phrase in the run log |

A frame is never replaced by an older one, and a failed or idle run deletes nothing.

### 5.10 Retention and cleanup

- Kept: the current and previous pictures, plus every picture that left those roles less than 24 hours ago.
- **Healthy steady state** after the first day: about 146 pictures, about 80 to 100 MB at Stage B's sizes (0.55 to
  0.67 MB). **This is not a bound.** Superseded copies, copies left by interrupted runs and pending entries add to
  it until the grace period passes; the per-picture cap is 3 MB; unlisted objects under an old epoch stay until a
  `sweep`. The trial reports the actual count and bytes hourly.
- Deletion happens only in a run that has just published a newer verified frame. If collection stops, deletion stops.
- Removing everything is the manual action of 4.7, with its condition about earlier writers.

### 5.11 Way back from Stage D

The pause of 5.6; a hold; `recover` if a record is lost or rolled back (built, tested and reviewed on 20 Nov; runbook
in the Stage D packet); main's 0.6.19 file for the code. Storage is untouched by a code rollback.

## 6. Stage E — page release

Not started by this proposal. Listed so that its separation is explicit.

Preconditions: Stage D's result read by GPT and accepted by Chad; the REGISTER entry filed; collection running under
a separately authorised continuation (5.1), with its own monitoring and request allowance.

1. Merge current main into `earth-from-space-rc` (main now carries the Animals tab: six header tabs' worth of changes
   to `index.html`, `style.css`, `sources.html`); resolve; rerun `header-tabs`, `desktop-overflow`, the page suite and
   the full older-suite set **on the correct test server** (`phase1/serve-core-on.py`).
2. Release packet and GPT's release review of the merged tree.
3. Chad's line to merge (the REGISTER entry is already filed by then, section 7).
4. Served-hash check of every page file, a live read, GPT's smoke test.
5. The hub file on main is brought to the live version in the same merge, so that main equals live again and the
   "never deploy the hub from main" warning can be retired. Stated here because it is easy to forget.

Way back: revert the merge commit (own line). The hub and storage are unaffected by a page revert.

## 7. Sources and REGISTER

- **REGISTER:** an entry for "GeoColour RGB - MTG - 0 degree", collection `EO:EUM:DAT:0913`, EUMETView layer
  `mtg_fd:rgb_geocolour`, licence CC BY 4.0, credit "Contains modified EUMETSAT Meteosat data", on the pattern of the
  Dust RGB entry filed 13 Nov, with what was read and by whom.
- **The draft is part of the Stage C packet** (GPT). **Recommended: filed before Stage C**, on Chad's line.
  **Required before Stage D**: sustained collection does not start without it.
- **If Chad prefers Stage C first:** Stage C is then an explicitly approved **public** experiment, and his Stage C
  line says so in words: one frame, with its credit and licence in the served record, publicly downloadable by URL
  before a REGISTER entry exists (decision D5).
- **Sources page:** the section drafted on the branch, with the limits GPT accepted, goes live only with the page in
  Stage E.

## 8. Cost: staying at US$0 added

Estimates from the code's operation counts. **The candidate packet replaces them** with counted operations per run
kind, the account's plan allowances and current usage read from the dashboard.

| | Per day | Per 30 days if it ran continuously | Against |
|---|---|---|---|
| Hub CPU for picture runs (about 0.6 to 1.0 s of invocation CPU each) | 86 to 144 s | 2.6 to 4.3 million ms | account at about 2% of included CPU (20 Nov) |
| R2 writes and lists by runs (about 8 to 12 per published run) | 1,150 to 1,730 | 35,000 to 52,000 | included Class A operations |
| R2 reads by runs (about 6 to 10 per run) | 860 to 1,440 | 26,000 to 43,000 | included Class B operations |
| R2 storage | | 80 to 100 MB in healthy steady state (5.10) | included storage |
| Log lines | about 450 | about 13,500 | Observability: 0.57 GB of 50 GB used on 20 Nov; volume pricing from 1 Dec 2026 |
| **Requests for the record and pictures by anyone with the URL** | unknown | unknown | each is a Worker request with CPU and one or two R2 reads |

**Direct-URL traffic can occur from Stage C onward**, before any page links to it. The pictures are served with
`Cache-Control: public, max-age=86400, immutable`; that tells browsers to keep a copy and **does not show that
Cloudflare's edge caches the Worker's response**, so each request is assumed to reach the Worker and R2. The trial
reports the count of such requests. Nothing here limits them; a sustained unexpected volume is reported to Chad.

Expected added recurring charge: **none**. Any expected charge above US$1 a month is presented to Chad before anything
proceeds.

**Operational limits that keep it there:** fixed cadence, no retry inside a run, one picture size, a 3 MB cap per
picture, retention tied to the grace period, no visitor-triggered request to EUMETSAT.

## 9. What must be built and reviewed first (hub 0.6.22 candidate)

1. The three-state gate (section 2), tested through the actual handlers and the five-minute wrapper.
2. Header-only key for the Earth from Space admin routes and the manual run (section 3).
3. `phase1/earthview-admin.sh` with step ids and atomic claims, and its suite (section 3).
4. **One log line per picture run** (new in rev 2): isolate id, isolate age, scheduled runs and validations already
   made in that isolate, and the slot's scheduled time, using the counters the probe already keeps; the validation
   counter is incremented by collector validations too. This is what lets repeated and shared-isolate validation be
   evidenced (5.7). It writes nothing to storage and changes no decision.
5. Nothing else. The decoder, the validation limits, the storage records, the guards, recovery and the probe route's
   rules are unchanged; the recovery span's hash is asserted unchanged by the existing static check.
6. Main merged into the branch first.

Packet to GPT: the diff; the suites with breaks; the runbook for sections 4 and 5 as numbered commands with step ids;
the REGISTER draft; Cloudflare's limits for scheduled and HTTP invocations as configured on this account, quoted from
source; the lifecycle-rule read; account allowances and current usage; counted operations per run kind; whether an
email alarm exists; and the exact deployed-code and configuration read-backs to be made at each step.

## 10. Approval steps (sketches, not requests)

Each is sent by Chad himself, in his own message, with hashes and times filled in at the time.

1. `Approve: deploy hub 0.6.22 from earth-from-space-rc <commit>, phase1/worker.js sha256 <hash>, code only, EARTHVIEW_ENABLED left unset; read back hash and settings; stop and report if any earthview/ object exists`
2. `Approve: file the EUMETSAT GeoColour REGISTER entry as drafted in <file>` (recommended before Stage C; required before Stage D)
3. `Approve: Earth from Space Stage C on hub 0.6.22 under proposal rev <n> section 4: set up storage (hold, recover first start, release); Claude sets EARTHVIEW_ENABLED to manual in the dashboard while I watch; one manual run started by me in the window <start UTC>; one further run only under section 4.3, not later than 40 minutes after the first; at most 6 requests to EUMETSAT; no scheduled collection` — plus, if the REGISTER entry is not yet filed: `; I approve one frame being publicly downloadable by URL before the REGISTER entry is filed`
4. `Approve: Earth from Space Stage D under proposal rev <n> section 5: set EARTHVIEW_ENABLED to 1 at <time UTC> for exactly 288 slots, then back to manual; at most 864 requests to EUMETSAT plus at most 12 diagnostic requests; no manual run; hourly inspections with my Mac kept awake; Claude may set the variable to manual, and only that, on any stop condition of section 5.6 and at the end`
5. Stage E's line (the merge) comes with the release packet.

## 11. Decisions for Chad

- **D1.** Accept the three stages C, D, E and one more hub version (0.6.22) before C.
- **D2.** May Claude pause the trial (set the variable to `manual`, nothing else) on any stop condition and at the
  end? Without it, a pause waits until you are reached. (Recommended: yes.)
- **D3.** Do sustained requests to EUMETView (up to 864 in 48 hours) need a note to EUMETSAT first? Open since 20 Nov.
- **D4.** The publication checkpoint for "met": 80% of eligible times, with at least 230 seen. Approve, or name
  another number, before the start.
- **D5.** REGISTER entry filed before Stage C (recommended), or Stage C as an explicitly approved public experiment
  with the entry filed before Stage D.
- **D6.** Can the Mac stay awake with the Claude app open for the 48 hours, two nights included? If not, the trial's
  monitoring has gaps of the length of each night, and that would be written into the line.
- **D7.** No supplementary busy observation with the probe (GPT does not require one). (Recommended: none.)

## 12. Questions for GPT

- **Q1.** Do 5.5 and 5.6 close HOLD 1? In particular: is a 60-minute maximum inspection interval, dependent on the Mac
  and the thread, with a push notification and Chad's phone as the fallback, acceptable for this trial if stated in
  the approval line?
- **Q2.** Does 5.8 close HOLD 2: the eligible-time definition, the 230 minimum, the three-way classification of
  refusals, the 12 diagnostic requests?
- **Q3.** Does 4.3 to 4.5 close HOLD 3: the positive list of source failures, the 40-minute latest start, no retry
  after a lost answer?
- **Q4.** Is the one added log line (section 9 item 4) acceptable inside the 0.6.22 scope?
- **Q5.** Should Claude making the variable change in C6 be kept as the rehearsal of the pause lever, or would you
  rather Chad make every production change in Stage C?

## 13. Changes from rev 1.1 (GPT's review of 22 Nov)

| GPT's point | Where answered |
|---|---|
| Q1 gate: test through actual handlers and the five-minute wrapper, zero side effects on refusal | section 2 |
| Q2: 210 s is not a maximum duration; remove "does not coincide" and "cannot delay them"; quote configured limits; manual run does not inherit scheduled limits; whole-invocation CPU | section 1 (last paragraphs), 5.3, 5.4 |
| HOLD 1: real monitoring coverage, overnight, maximum interval, detection-to-action | 5.5, 5.6 |
| HOLD 1: pause authority for all stop conditions; pause first, attribute later | 5.6, D2 |
| HOLD 1: default to `manual` at the end; continuation separately authorised | 5.1 |
| HOLD 1: 288 slots, 864 requests, schedule-derived not enforced; no extra manual runs | 5.1, 5.2 |
| HOLD 1: a pause does not cancel admitted invocations; reconcile; no deletion while an earlier writer may live | 5.6, 4.7 |
| HOLD 2: define what 80% is measured against; account for every slot | 5.7, 5.8, D4 |
| HOLD 2: advancement, diagnosed misses, observed post-grace cleanup; missing evidence is incomplete | 5.8 |
| HOLD 2: refusals are not presumed a limits problem; sound frame wrongly refused is not met; persistent check-image and served-time failures | 5.6 (6, 8), 5.8 |
| HOLD 2: keep or replace the 5,000 ms checkpoint | kept: 4.5, 5.4, 5.6 (5) |
| HOLD 3: retry only for a positively identified source failure, with a latest start | 4.3 |
| HOLD 3: missing header against wrong frame; findings not erased by later success | 4.3, 4.5 |
| HOLD 3: lost answer; attempt ids and atomic claims | 4.3, section 3 |
| Q4: REGISTER draft in the Stage C packet; public downloadability acknowledged; "private in effect" removed | section 7, 4.6, 4.7, section 10 |
| Q5: limited scope; never a real credential in a URL; masking verified on a harmless call first | section 3 |
| Q6: late storage stop; 146 not a bound; direct-URL traffic and caching; shared-isolate validation evidenced; packet contents; four records plus one picture | 5.3, 5.10, section 8, 5.7 and section 9 item 4, section 9, 4.4 |
