# Earth from Space — from the first stored picture to the page: proposal (rev 1.1, for GPT)

22 Nov 2026. Asked for by GPT's review of the Stage B result (`reviews/2026-11-22-earth-from-space-stage-b-result-gpt-review.md`)
and started on Chad's "Go" of 22 Nov. **Docs only. Nothing here is built, deployed, stored, enabled or approved.** Every
production step named below needs Chad's own exact Approve line; the lines are sketched in section 10 and are not
requests yet.

**Rev 1.1 (22 Nov):** section 1 point 3 reworded after GPT's closure of the Stage B percentiles gap
(`reviews/2026-11-22-earth-from-space-stage-b-percentiles-gpt-closure.md`): Stage B is **MET** under proposal rev 2.1
section 4 with its coverage limits; the memory figures are bucket maxima, not invocation-level measurements. Nothing
else changed from rev 1.

State it starts from: hub **0.6.21** live (deployed code sha256 `2028e2da…01c3`), `EARTHVIEW_ENABLED` not set, no object
under `earthview/` in storage, the tab not on the live page. Main's `phase1/worker.js` is still 0.6.19 and is the
rollback file. Branch `earth-from-space-rc`.

## 0. Summary

Three separate stages, each with its own approval, its own read-backs and its own way back:

| Stage | What happens | Requests to EUMETSAT | What becomes public |
|---|---|---|---|
| **C. First stored picture** | Storage is set up; **one** manual run stores one verified frame; nothing is scheduled | 3 (6 if the one permitted second attempt is used) | The hub's record and picture become readable by URL; no page links to them |
| **D. Scheduled collection, on trial** | The hub collects every ten minutes for a fixed trial of 48 hours, then the result is judged | at most 3 per run, at most 432 a day | The same URLs, now changing |
| **E. Page release** | The tab, the page, Sources and REGISTER go live | none added | The feature |

A stage starts only after the one before it has a written result that GPT has read and Chad has accepted.

The proposal needs **one more hub version (0.6.22)** before Stage C, for two reasons found while writing it
(sections 2 and 3). That candidate goes to GPT before any deploy.

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
five-minute scheduled invocation, after the earthquake and aircraft collectors of that same invocation, 144 times a
day, in isolates Cloudflare reuses for the hub's other scheduled jobs and for visitors' requests.

**Where the picture run sits among the hub's jobs** (job timing read on 21 Nov, one day's records): it starts at
hh:00:08, hh:10:08 and so on, after that tick's own collectors (2 to 9 s), and in Stage B took 11 to 16 s. The heavy
hourly job starts at hh:07:59 and lasted 13 to 65 s; the fifteen-minute job starts at hh:00:40, hh:15:40 and so on (CPU
up to 762 ms, wall up to 135 s); the half-hourly job at hh:11:38 and hh:41:38. So **by schedule the picture run mostly
runs between the other jobs, not on top of them**: the nearest regular neighbour is the fifteen-minute job at hh:00:40
and hh:30:40, which a slow picture run would overlap. Overlap in time is therefore expected to be occasional, and
sharing an isolate one after another to be common. Neither is controlled; both are read afterwards.

Stage D is itself the first observation of points 1 to 3 at scale, and is written as a trial with stop conditions,
not as a release.

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
Tests: the gate table above as cases through the real handlers, with breaks for each cell.

Alternatives considered and not proposed: setting `1` and trying to finish between two ticks (a race against a
schedule we do not control); using the storage hold to block the scheduler (a hold blocks the manual run too).

## 3. Admin calls put the key in the URL, and Cloudflare stores the URL

Stage B established that Cloudflare's invocation log masks the `Authorization` header and that the hub's setting
`redact_query_string` is **false**. `/admin/earthview/<action>?key=…` and `/admin/run/earthview?key=…` carry the admin
key in the query string, so every such call would write the key into the hub's stored logs (readable only inside
Chad's Cloudflare account, kept for the log retention period). Stages C and D need about ten such calls.

**Proposed (0.6.22):** for `/admin/earthview/*` and `/admin/run/earthview` only, the key is accepted in
`Authorization: Bearer …` exactly as the probe does, and a request carrying `key=` in its query string is **refused
with 400 before the key is compared**. `apply` and `plan` stay in the query string (they are not secret). Other layers'
`/admin/run/<layer>?key=` routes are untouched by this proposal; that the same exposure exists there is noted for
Chad as a separate matter, not acted on here.

**Who makes the calls.** Chad, from Terminal, with a new script `phase1/earthview-admin.sh` built like the Stage B
caller: reads `ADMIN_KEY` from `~/mother-earth/KEYS.md` itself, passes it to curl on standard input, never prints it,
`curl -q`, emptied environment, no redirects, no retry, fixed hub address, saves each answer with a UTC stamp into one
results folder, never overwrites a saved answer. Sub-commands: `status`, `hold`, `recover-plan`, `recover-apply <plan
id>`, `sweep-plan`, `sweep-apply <plan id>`, `release-plan`, `release-apply`, `run`. Its own suite with breaks, run
natively on macOS by GPT as before. Claude never types or sees the key.

Before either stage, the first invocation record of the first admin call is read to confirm the key is masked, as in
Stage B; a readable key stops everything.

## 4. Stage C — the first stored picture

### 4.1 Preconditions (all read-only, all recorded)

- Hub 0.6.22 deployed on its own line, read back (hash, settings, 24 bindings, 4 crons), `EARTHVIEW_ENABLED` not set.
- No object under `earthview/` (R2 list). Any object found: stop and report.
- **No R2 lifecycle rule on the bucket matches `earthview/`** (blocker B8 of the readiness proposal). Read from the
  dashboard and recorded.
- Hub health read: public status file, last hour of invocations all `ok`.
- Cloudflare's CPU and memory percentiles for the previous hour captured **before**, so the after-read has a baseline.

### 4.2 Sequence (Chad at the Mac for about 20 minutes; Claude reads back after each step)

| # | Step | Who | Writes | Read-back before the next step |
|---|---|---|---|---|
| C1 | `status` | Chad's script | nothing | `pointer` missing, `list` missing, 0 objects, no hold; the invocation record shows the key masked |
| C2 | `hold` (apply) | Chad's script | `earthview/hold.json` | status shows the hold |
| C3 | `recover-plan` | Chad's script | nothing | plan mode is **`first start`**; note the plan id |
| C4 | `recover-apply <plan id>` | Chad's script | an epoch marker, an empty pointer, an empty list | status: pointer and list present, same epoch, 0 pictures, guards pass |
| C5 | `sweep-plan`, then `release-plan`, then `release-apply` | Chad's script | removes the hold | status: no hold, guards pass |
| C6 | Set `EARTHVIEW_ENABLED` = `manual` in the dashboard | Chad (types and saves) | a new Worker version, same code | settings read-back: the variable is `manual`, code hash unchanged, bindings and crons unchanged; the next scheduled tick's log line reads "not scheduled" |
| C7 | `run` | Chad's script | one picture, the list (twice), the pointer, the state record | section 4.3 |

C6 is placed after C5 so that storage is initialised and released while no run of any kind can start. The window for
C7 is chosen at hh:21 to hh:24 or hh:51 to hh:54 (quiet minutes by the job-timing evidence of 21 Nov).

**Attempts.** One run. If it ends without publishing for a reason at the source (HTTP error, time-out, served time not
confirmed), **one** further run is permitted, not sooner than 10 minutes later, inside the same Approve line: 6
requests at most. A validation refusal, a storage stop or any Cloudflare resource ending is **not** retried: stop,
report, diagnose. Nothing else is repeated.

### 4.3 Read-backs after the run, and what counts as done

- The run's answer and its log line (`frame <time> as <id>; agreement …; 0 old picture(s) deleted`).
- Its invocation record: outcome `ok`, CPU figure, key masked.
- `status`: one object, one list entry, in role as current; pointer epoch = list epoch; guards pass.
- R2 list under `earthview/`: exactly `current.json`, `held.json`, `state.json`, one epoch marker, one
  `frames/<epoch>/<id>/picture.jpg`. Anything else is reported.
- Public reads: `/snapshot/earthview/meta` returns the frame; the picture URL returns bytes whose sha256 and size equal
  the pointer's; the frame time equals the `Warning` time recorded for both responses.
- The picture is **looked at** (Chad and Claude, in the private preview page served from the Mac review copy against
  the live hub): a whole disk, no banding, the surround in the page colour.
- Cloudflare's hourly CPU and memory percentiles for that hour, and the minute by event type.
- Hub health after: status file, every invocation in the 10 minutes before to 30 minutes after, as in Stage B.

**Result rule.** *Met*: published, every read-back above as stated, no resource ending or error log on the hub in the
interval. *Not met*: any `exceededMemory` or `exceededCpu`, any picture readable by URL that differs from its record,
or a record state the guards refuse. *Incomplete*: anything else (for example the source failed twice). Not-met takes
precedence. No verdict is improved by a later attempt.

### 4.4 After Stage C, until Stage D

The variable stays `manual`: nothing runs by itself. The stored frame ages. The private preview page says how old it is
(its existing wording for a frame older than the newest listed cannot be exercised, because nothing checks the source
while collection is off: the page shows the last check's time, which is the run's). Nothing is deleted: the collector
deletes only after publishing a newer frame.

### 4.5 Way back from Stage C

- **Stop:** delete the variable (or leave `manual`; nothing runs either way).
- **What remains in storage:** five small objects and one picture of about 0.5 to 0.7 MB. Harmless and private in
  effect (no page links to them), but reachable by URL.
- **Removing them** is a separate action on its own Approve line: hold, then delete the listed keys under `earthview/`
  in the dashboard by Chad, then read back an empty prefix. The hub has no route that deletes them and none is proposed.
- **Code:** 0.6.22 with the variable unset behaves as 0.6.21 does today. Full rollback is main's 0.6.19 file.

## 5. Stage D — scheduled collection, as a 48-hour trial

### 5.1 What turns it on

One change: `EARTHVIEW_ENABLED` from `manual` to `1`, by Chad in the dashboard, read back. No code change. The first
scheduled run is the next tick whose minute is 0 to 4 past a ten-minute mark.

### 5.2 Request budget

| | Per run | Per day (144 runs) |
|---|---|---|
| Listing request | 1 | 144 |
| Picture and check image, only when a newer frame is listed | 2 | at most 288 |
| **Total to EUMETSAT** | **at most 3** | **at most 432** |

There is no retry inside a run. A frame that failed is asked for again by the next run only if it is still the newest
listed, so a failing source costs the same 3 per run and never more. Time-outs: 30 s for the list, 90 s for each
image; a run's own requests can therefore last at most 210 s plus storage calls, against a ten-minute cadence.
The user agent names the project. Chad's open question from 20 Nov, whether sustained requests to EUMETView count as
provider contact needing a prior note to EUMETSAT, is **his to answer before Stage D** (decision D3).

### 5.3 Concurrency across isolates

Safety here never depended on one isolate or one run at a time, and that is unchanged:

- Every write to the pointer and the list is conditional on the version read and fenced by the epoch.
- Each picture's key holds 96 random bits drawn by its own run and is written create-only.
- Two runs that fetch the same frame both store a copy; one publishes; the other ends `superseded`; its copy is out of
  role and is removed by a later cleanup after the grace period.
- A manual run during Stage D is an ordinary second run.
- Cleanup may overlap, stop half way or act on an old view (rules 1 to 6 in the code, reviewed 20 Nov).

What Stage D adds to that reviewed design is observation, not mechanism: the trial counts `superseded` outcomes,
storage stops and unlisted objects.

**Sharing an invocation.** The picture run is awaited after the earthquake and aircraft collectors inside the same
five-minute scheduled invocation, so a slow picture cannot delay them, but its CPU and memory are charged to that
invocation and it shares the isolate with whatever else runs there. Cloudflare's limits for scheduled invocations
(CPU per invocation, wall time) are to be quoted from its limits page in the candidate packet and compared with
Stage B's figures; they are not asserted here from memory.

### 5.4 Timing and deadline limits, stated plainly

- The collector has **no whole-run deadline** (the probe had 150 s; the collector never did). Its bounds are the three
  fetch time-outs.
- **Nothing can interrupt the decode.** It is synchronous computation; the runtime's clock does not move during it; no
  timer of ours fires inside it. The only enforcement during decoding is Cloudflare's own CPU limit, which ends the
  invocation.
- Timestamps in the run's records therefore bracket **network and storage calls**, not computation. The trial reports
  decode cost only as invocation CPU.
- Proposed: **no** whole-run deadline is added. Reason: the worst case from time-outs (210 s) is under the cadence, and
  an overlap is safe by 5.3. GPT is asked whether it agrees (question Q2).

### 5.5 What is watched, and when

Captured by Claude from Cloudflare, read-only, at fixed check-ins (first run; +1 h; then every 6 h; the first cleanup
after 24 h; the end):

- every `earthview` run's outcome from the hub's own run log: published, nothing newer, superseded, each failure with
  its reason;
- every hub invocation's outcome over the whole trial (any non-`ok` is listed, whatever layer);
- **hourly CPU and memory percentiles, and the per-minute rows by event type for every minute in which a picture run
  overlapped another scheduled invocation**, captured as the trial runs this time;
- `status` once a day by Chad's script (guards, object count, unlisted objects);
- the R2 object count and bytes under `earthview/`;
- the other layers' public status before, during and after, against each layer's own cadence;
- the account's Workers and R2 usage figures at the start and the end.

Chad is needed at the Mac to start it, once a day for `status`, and if a stop is called. Otherwise not.

### 5.6 Stop conditions during the trial

Immediate stop, then report, on any of:

1. any `exceededMemory` or `exceededCpu` on the hub;
2. any hub invocation ending other than `ok` that is not shown to be unrelated by independent evidence;
3. a storage stop (`storage record needs repair`, `storage changed during the run`) from any run;
4. a picture readable by URL whose bytes differ from its record;
5. three consecutive runs ending `picture failed validation` (a limits problem, to diagnose, not to ride through);
6. another layer newly failing in a way not shown to be unrelated.

**How it is stopped.** Fastest, and with no secret: the variable is changed from `1` back to `manual` in the dashboard.
Decision D2 asks whether Chad's Approve line for Stage D should authorise **Claude** to make that one change, to
`manual` only, on conditions 1 to 4 when Chad cannot be reached, with a report at once. Without that, a stop waits for
Chad. The storage hold (Chad's script) is the second lever and also blocks manual runs.

### 5.7 Result rule for the trial

- **Not met:** stop condition 1 or 4 occurred; or condition 2 or 3 occurred and stands unexplained.
- **Met:** 48 hours completed; none of 1 to 6; at least one cleanup observed deleting pictures past the grace period
  with the pointer's pictures untouched; published frames at least 80% of frames listed in the period, every miss
  diagnosed. **Overlaps are reported, not required:** every picture-run invocation whose wall span overlaps another
  hub scheduled invocation is listed with both outcomes, CPU and memory readings, and the count is stated, even if it
  is zero.
- **Incomplete:** anything else, including a trial stopped for a reason at the source.

The trial does not prove a memory bound either. It replaces "three readings" with several hundred readings under the
real schedule, and it is the first observation of repeated validation in reused isolates and of the picture run among
the hub's other jobs. If no overlap with a heavy job occurs in 48 hours, the result says so: that case stays
unobserved, and the schedule is the reason it is rare.

**After the trial**, collection continues or pauses by Chad's decision on the result (decision D4); the proposal's
default is that it continues while the result is being read, because a stop-and-restart teaches nothing new.

### 5.8 Failure and expiry behaviour (already built; what the trial checks)

| Situation | Hub | What a reader of the record sees |
|---|---|---|
| Source lists nothing newer | no picture request; pointer untouched | displayed frame, "newest listed" equal to it |
| Source check fails | outcome recorded apart from the frame | the last frame, with the failed check and its time |
| Picture or check image fails, or served time not confirmed | nothing published; pointer untouched; nothing deleted | the last frame; the failure reason; no requested time is ever shown as a frame time |
| Validation refuses | the same | the same |
| Nothing newer listed for 45 minutes (provisional) | unchanged | the page says it is waiting, plainly; this is not a delay bound |
| Collection off | nothing runs | the last frame and the time of the last check, which stops advancing |
| Storage stop | the run stores, deletes and publishes nothing | the last frame; the stop phrase in the run log |

A frame is never replaced by an older one, and a failed or idle run deletes nothing. The page's wording for each state
was closed by GPT at private-candidate level; the trial checks that the live record produces those states.

### 5.9 Retention and cleanup

- Kept: the current and previous pictures, plus every picture that left those roles less than 24 hours ago.
- Steady state after the first day: about 146 pictures. At 0.55 to 0.67 MB each (Stage B's three frames; the hard
  limit per picture is 3 MB), about **80 to 100 MB**, at most 440 MB if every picture were at the limit.
- Deletion happens only in a run that has just published a newer verified frame, only for pictures out of role past
  the grace period. If collection stops, deletion stops: storage stays where it is and does not grow.
- Copies left by superseded or interrupted runs are listed and removed by the same rule. A picture stored under an old
  epoch after a recovery is unlisted until a `sweep`; the daily `status` reports the count.
- Removing everything is the manual action of 4.5.

### 5.10 Way back from Stage D

- Variable to `manual` (collection stops at the next tick; the last frame stays served), or deleted.
- A hold, if the records need protecting while something is investigated.
- Recovery (`recover`) if a record is lost or rolled back: built, tested and reviewed on 20 Nov; its runbook goes in
  the Stage D packet.
- Code: main's 0.6.19 file. Storage is untouched by a code rollback.

## 6. Stage E — page release

Not started by this proposal. Listed so that its separation is explicit.

Preconditions: Stage D's result read by GPT and accepted by Chad; collection running.

1. Merge current main into `earth-from-space-rc` (main now carries the Animals tab: six header tabs' worth of changes
   to `index.html`, `style.css`, `sources.html`); resolve; rerun `header-tabs`, `desktop-overflow`, the page suite and
   the full older-suite set **on the correct test server** (`phase1/serve-core-on.py`).
2. Release packet and GPT's release review of the merged tree.
3. Chad's line to file the REGISTER entry; Chad's line to merge.
4. Served-hash check of every page file, a live read, GPT's smoke test.
5. The hub file on main is brought to the live version in the same merge, so that main equals live again and the
   "never deploy the hub from main" warning can be retired. Stated here because it is easy to forget.

Way back: revert the merge commit (own line). The hub and storage are unaffected by a page revert.

## 7. Sources and REGISTER

- **REGISTER:** an entry for "GeoColour RGB - MTG - 0 degree", collection `EO:EUM:DAT:0913`, EUMETView layer
  `mtg_fd:rgb_geocolour`, licence CC BY 4.0, credit "Contains modified EUMETSAT Meteosat data", written on the pattern
  of the Dust RGB entry filed 13 Nov, with what was read and by whom. Filed only on Chad's line.
- **When:** the draft goes in the Stage D packet. This proposal's position is that the entry should be **filed before
  Stage D starts**, because from then the hub fetches from the provider on a schedule and serves the result by URL,
  page or no page. Chad decides (decision D5).
- **Sources page:** the section already drafted on the branch, with the limits GPT accepted (what instant the frame
  time marks is not knowable from the service; faint local damage in a late scan is possible; the night side's lights
  are a static NASA layer, not current), goes live only with the page in Stage E.
- Stage C stores one frame reachable by URL before any REGISTER entry exists. It carries the credit and licence in the
  record the hub serves. Stated so that it is a choice, not an accident.

## 8. Cost: staying at US$0 added

Estimates from the code's own operation counts, to be replaced by the trial's measured figures:

| | Per day | Per 30 days | Against |
|---|---|---|---|
| Hub CPU for picture runs (about 0.6 to 1.0 s each) | 86 to 144 s | 2.6 to 4.3 million ms | account at about 2% of included CPU (20 Nov) |
| R2 writes and lists (about 8 to 12 per published run) | 1,150 to 1,730 | 35,000 to 52,000 | R2's included Class A operations |
| R2 reads by runs (about 6 to 10 per run) | 860 to 1,440 | 26,000 to 43,000 | included Class B operations |
| R2 storage | | 80 to 100 MB steady | included storage |
| Log lines | about 300 | about 9,000 | Observability: 0.57 GB of 50 GB used on 20 Nov; volume pricing from 1 Dec 2026 |
| Picture downloads by visitors | 0 until Stage E | | cached for a day as immutable; R2 has no egress charge |

Expected added recurring charge: **none**. The readiness proposal's earlier range (2 to 6.5 million CPU-ms, about
30,000 writes) is consistent. The account's actual plan allowances and current usage are read from the dashboard and
quoted in the Stage D packet; any expected charge above US$1 a month is presented to Chad before anything proceeds, as
his rule requires.

**Operational limits that keep it there:** fixed cadence, no retry inside a run, one picture size, a 3 MB cap per
picture, retention bounded by the grace period, no visitor-triggered fetch from EUMETSAT (visitors read the hub's copy
only).

## 9. What must be built and reviewed first (hub 0.6.22 candidate)

1. The three-state gate (section 2).
2. Key in the `Authorization` header for the Earth-from-Space admin routes and the manual run; `key=` refused there
   (section 3).
3. `phase1/earthview-admin.sh` and its suite (section 3).
4. Nothing else. The decoder, the validation limits, the storage records, the guards, recovery and the probe route are
   **unchanged**; the recovery span's hash is asserted unchanged by the existing static check.
5. Main merged into the branch first, so the deployed file contains whatever main's hub has by then (today main's hub
   is 0.6.19 and the branch already contains it).

Packet to GPT: the diff, the suites with breaks, the runbook for sections 4 and 5 as numbered commands, the REGISTER
draft, the Cloudflare limits quoted from source, the lifecycle-rule read.

## 10. Approval steps (sketches, not requests)

Each is sent by Chad himself, in his own message, with the hash and times filled in at the time.

1. `Approve: deploy hub 0.6.22 from earth-from-space-rc <commit>, phase1/worker.js sha256 <hash>, code only, EARTHVIEW_ENABLED left unset; read back hash and settings; stop and report if any earthview/ object exists`
2. `Approve: Earth from Space Stage C on hub 0.6.22: set up storage (hold, recover first start, release), set EARTHVIEW_ENABLED to manual, one manual run in the window <start UTC>, at most one further run not sooner than 10 minutes later if the source fails; at most 6 requests to EUMETSAT; no scheduled collection`
3. `Approve: file the EUMETSAT GeoColour REGISTER entry as drafted in <file>` (if D5 is "before Stage D")
4. `Approve: Earth from Space Stage D: set EARTHVIEW_ENABLED to 1 at <time UTC> for a 48-hour trial under proposal rev <n> section 5; at most 432 requests to EUMETSAT a day; [Claude may set it back to manual on stop conditions 1 to 4 if I cannot be reached]`
5. Stage E's lines (REGISTER if not yet filed; merge) come with the release packet.

## 11. Decisions for Chad

- **D1.** Accept three separate stages C, D, E as laid out, and one more hub version (0.6.22) before C.
- **D2.** During the Stage D trial, may Claude set the variable back to `manual` on stop conditions 1 to 4 if you
  cannot be reached? (Recommended: yes. It only ever turns collection off, and needs no secret.)
- **D3.** Do sustained requests to EUMETView (up to 432 a day) need a note to EUMETSAT first? Your call, open since
  20 Nov. (No message is drafted or sent without you.)
- **D4.** After the 48 hours, does collection continue while the result is read? (Recommended: yes.)
- **D5.** REGISTER entry filed before Stage D, or with the page in Stage E? (Recommended: before Stage D.)
- **D6.** A supplementary busy observation with the probe before any of this? GPT does not require it. By schedule
  the collector's picture run does not coincide with the heavy hourly job (it starts about two minutes after it), so
  the case the probe would test is one the collector is not expected to meet. (Recommended: no.)

## 12. Questions for GPT

- **Q1.** Is the three-state gate the right answer to the manual-run problem, or do you prefer another?
- **Q2.** No whole-run deadline in the collector (5.4): acceptable, given the time-outs, the cadence and the storage
  design?
- **Q3.** Are the Stage D stop conditions and result rule (5.6, 5.7) sufficient, and is 48 hours the right length?
  Is the 80% publication threshold a sensible number, or should it be a diagnosed-misses rule only?
- **Q4.** Is it acceptable that Stage C makes one frame reachable by URL before a REGISTER entry exists (section 7)?
- **Q5.** Should the header-only key rule (section 3) be limited to the Earth from Space routes as proposed?
- **Q6.** Anything on your list that this does not cover adequately: initialization, request budget, concurrency,
  read-backs, failure and expiry, retention and cleanup, rollback, cost limits, Sources and REGISTER, approvals.
