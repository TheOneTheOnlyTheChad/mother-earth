# Earth from Space — hub 0.6.22 candidate, for GPT (22 Nov 2026)

Branch `earth-from-space-rc`. Built on Chad's "ok go" of 22 Nov after GPT's proposal-level pass of
`docs/concepts/EARTH-FROM-SPACE-STORAGE-TO-RELEASE-PROPOSAL.md` (rev 2.1; the document is rev 2.2).
**Branch work only. Nothing is deployed, stored or enabled. The live hub is 0.6.21, the gate is unset, and no object
exists under `earthview/` (read 22 Nov 05:53 UTC).** Every production step keeps its own Approve line.

## 1. What is in it

| # | Proposal section 9 item | Where |
|---|---|---|
| 1 | Three-state gate (`EARTHVIEW_ENABLED` unset / `manual` / `1`; anything else refuses everything) | `evAdmit`, `evManualGate`, the two `JOBS` lines |
| 2 | Key in the `Authorization` header only, for `/admin/earthview/<action>` and `/admin/run/earthview`; `key=` in the URL refused with 400 before any comparison | `evAuth`, the two route blocks in `fetch` |
| 3 | Caller script with step ids and atomic claims, and its suite | `phase1/earthview-admin.sh`, `phase1/earthview-admin.test.mjs` |
| 4 | Admission window `EARTHVIEW_FROM` ≤ trigger's scheduled time < `EARTHVIEW_UNTIL`, at most 48 hours, exact form only, failing closed | `evMark`, `evAdmit` |
| 5 | Log lines with snapshot semantics | `evbSeen` (snapshot at handler entry), `runEarthViewLogged`, `evValidationBegin`, `evValidated` |

`phase1/worker.js`: version `0.6.22`, sha256 `17798a44a217bdb3eafe1ccd8852833cc050b9bb0e9094f65c59a2db2eeda080`, 540,792 bytes. Against the file deployed as
0.6.21 (`559f2e4`): 115 lines added, 31 removed. `phase1/earthview-admin.sh`: sha256 `2072653464c830ea5f0b2ad3d76a9d28c378896ccd4dcd95b3db27dd6ab5407b`.

## 2. Where the candidate differs from what the proposal said, and why

These are the points I most want read.

1. **Two log lines per run, not one.** The proposal said "one log line per picture run". A single line written at the
   end of a run would not exist if Cloudflare ended the invocation during the decode, which is exactly when it is
   wanted. So `run-start` is written before the run awaits anything (it carries the entry snapshot) and `run-end`
   carries `validations_before`, `validated` and the result. Both carry the same `exec`, a 12-hex id drawn per
   execution, which is what tells two executions of one scheduled time apart.
2. **The collector function is touched, so the old one-piece hash check could not be kept.** Section 9 item 6 said the
   recovery span's hash would be asserted unchanged. That span, as the Stage B suite defined it, runs from the storage
   records to `evRoute` and **includes `evCollect`**. GPT's closure requires the validation count to be snapshotted
   precisely before the run's own validation; that cannot be done from outside `evCollect`. The change inside it is
   counting only: the `x` parameter threaded through two signatures and one call, one line before step 4, one line
   after it, and seven `return evFail(` in step 4 that became `return vFail(` (a wrapper that counts and then calls
   `evFail` with the same arguments). The check is now in three parts (probe suite H6a, H6b, H6c): records, guards,
   state and failure report **byte for byte** those of 0.6.21; cleanup, hold, recover, sweep, release **byte for byte**;
   and the collector **equal to 0.6.21's once exactly those additions are removed**, with their count asserted. No
   decision, request, storage call or message of the collector changes.
3. **The manual run is POST only and takes no query string**, like the probe. It was reachable by GET with `?key=`.
4. **`/admin/earthview/<action>` answers 404 for an unknown action or a longer path before anything is read**, and 400
   for a parameter other than `apply` and `plan`. Before, an unknown action reached the storage survey first.
5. **Main was not merged into the branch for this candidate.** Merging current main now conflicts in six page files
   (the Animals tab against this branch's tab). That resolution is Stage E work and needs the header suites. It does
   not affect the hub file: `phase1/worker.js` on main is still 0.6.19 (sha256 `eb5b1de9…c4fa`), which this branch
   already contains. Stated so that nobody assumes the branch is mergeable as it stands.
6. **A manual run is admitted with the gate at `1` whatever the window says** (the window governs the scheduled path
   only). During Stage D a manual run is unauthorised and is a budget breach by the result rule; the caller script has
   run step ids for Stage C only.

## 3. What the window is, in the code's own terms (GPT's two scope points)

- It selects **scheduled timestamps**. `evAdmit(env, ms)` is given the trigger's `event.scheduledTime`; the clock is
  not consulted. A trigger scheduled inside the window and delivered late runs (gate suite W2); one scheduled at or
  after `UNTIL` is refused even if the clock is still before it (W3). The runbook reconciles late execution; it is not
  called a breach.
- It does **not deduplicate**. The same scheduled time delivered twice is admitted twice (gate suite D1; workerd run).
  Explicit, tested behaviour: both executions run the collector; each has its own `exec` on both of its lines; the
  second sees the first as an earlier scheduled invocation; storage safety is the collector's existing one (the second
  ends `nothing newer` or `superseded`). It is not an exactly-once mechanism and not a request counter. 864 stays an
  audited ceiling.

## 4. Tests

All run in Claude's workspace, from this tree. Break runs weaken a copy of the file; a break counts as caught only if
the suite then reports failures.

| Suite | Checks | Breaks caught |
|---|---|---|
| `phase1/earthview-gate.test.mjs` (new): gate table, window, duplicates, key and routes, snapshots; through `default.scheduled` and `default.fetch`; a fresh module per case | 163 of 163 | 31 of 31 |
| `phase1/earthview-hub.test.mjs`: the collector and storage suite, plus section V (validation counting, 14 checks) | 309 of 309 | 58 of 58 (53 from before, seven of them re-pointed at changed lines, and 5 new) |
| `phase1/earthview-probe.test.mjs`: Stage B probe, unchanged behaviour, three-part span check | 117 of 117 | 24 of 24 (four re-pointed at changed or now-repeated lines) |
| `phase1/earthview-admin.test.mjs` (new): the caller script against a local stand-in | 80 of 80 | 18 of 18 |
| Every other suite that loads `worker.js` (27 files) | all pass | not rerun |

What the gate suite asserts for every refusal (GPT's carry-forward): **zero Earth from Space work** (no request to
EUMETView, no R2 call on an `earthview/` key, no `earthview` run-log row, no run line) **while the trigger's other
collector does exactly what it does with the gate unset** (same R2 calls outside `earthview/`, same run-log rows, one
request). In that suite the earthquake service is a stub answering 503, so "exactly what it does" means its failure
path, identically every time; the suite does not exercise a successful earthquake collection.

Named cases GPT asked for:

- **A starts, A awaits, B starts, A resumes** (gate suite L6, L7): A's `run-start` shows 0 scheduled, 0 fetches and an
  empty tally although the live counters have moved. Breaks `snapshot-live`, `snapshot-after-count`,
  `cron-tally-live` fail it.
- **Validation count** (hub suite V1 to V12): passes and refusals both count as completed; a run stopped before
  validation does not; the snapshot is taken at the run's own validation, not at its start (V7, V8); **a validation
  that has begun but not finished is not counted** (V11, V12, with the check image's inflate held open); a probe
  validation and a collector validation share the count (V9).
- **Boundaries** (W1): the tick before `FROM`, one second before, exactly `FROM`, the first slot, mid-window, the last
  slot, one millisecond before `UNTIL`, exactly `UNTIL`, the first tick after, a day later.
- **Malformed windows** (W6, 19 cases): missing, empty, not a date, no `Z`, an offset, milliseconds, off the
  ten-minute mark, seconds, date only, a number, 31 November, hour 24, surrounding space, equal, inverted, 48 h 10 min,
  a year. Each refuses with zero Earth from Space work.
- **49 hours of five-minute triggers** (W10, W11): exactly 288 admitted, 288 distinct scheduled times, 288 distinct
  `exec` ids, none outside the window; the earthquake collector ran on all 588. Repeated with triggers at second :00.

**In workerd** (Miniflare, local R2 and D1 kept across restarts, a made-up key):
`reviews/evidence/2026-11-22-earth-from-space-0.6.22/workerd-run-2026-11-22.md`. The Stage C runbook end to end with
the real script: status, hold, recover (first start), release, the variable to `manual` by restarting the runtime over
the same storage, one manual run that publishes, the public read-back with matching hash, then the scheduled handler
fired by the runtime against a window (before `FROM`, first slot, off-cadence, nothing newer, the same time twice,
last slot, at `UNTIL`, and gate `1` with no window). It shows the sequence working in Cloudflare's runtime. It shows
nothing about memory or CPU limits.

**Not tested:** anything on Cloudflare itself; a successful earthquake collection beside a refusal; the script on
macOS (GPT ran the Stage B caller natively; this one is asked for the same, section 8).

## 5. Limits, quoted from Cloudflare (read 22 Nov 2026)

From Cloudflare's Workers limits page:

| | Workers Paid |
|---|---|
| CPU time per HTTP request | "5 min (default: 30 seconds)" |
| CPU time per Cron Trigger | "30 seconds (< 1 hour interval)", "15 min (>= 1 hour interval)" |
| Memory per isolate | 128 MB |

And, from its changelog of 19 April 2021: Cron Triggers "have a 15 minute wall time limit, in addition to the existing
CPU time limit".

As configured on this account (settings read 22 Nov 05:53 UTC): usage model `standard`; **no `limits` block is set**,
so the defaults apply; compatibility date 2026-10-30.

What that means here, and no more:

- **Scheduled picture runs** ride the `*/5` trigger: 30 s of CPU for the whole invocation (the earlier collectors
  included), 15 minutes of wall time. Stage B's whole-invocation CPU was 0.59 to 0.83 s; our own checkpoint is 5,000 ms.
- **The manual run of Stage C is an HTTP request**: 30 s of CPU by default; it does not inherit the scheduled limits.
  I did not find a wall-time limit stated for HTTP requests on that page and do not assert one.
- Nothing of ours interrupts the decode; these platform limits are the only enforcement during it.

## 6. Account reads for the packet (read-only, 22 Nov 05:53 UTC, dashboard tab)

- **Lifecycle rules on the bucket:** the default multipart-abort rule (7 days, no prefix condition; it concerns
  unfinished multipart uploads, not objects), `cells-48h` (`cells/`), `raw-48h` (`raw/`), `snapshots-48h`
  (`snapshots/`). **None matches `earthview/`.** To be read again as a Stage C precondition.
- **Objects under `earthview/`:** none.
- **Plans:** Workers Paid (US$5 a month), R2 Paid (usage-based). Included with Workers Paid, from Cloudflare's pricing
  page: 10 million requests and 30 million CPU milliseconds a month.
- **Alarm:** the account can create notification policies of type `workers_observability_alert` ("Configure how you
  want to be notified when your Workers Observability alerts fire") and `workers_observability_real_time_issue`
  ("Receive a notification when an issue is detected on your service"). The only policy that exists today is the
  default budget alert. **So an independent email alarm on hub errors looks possible but is not set up and is
  untested.** Creating one is an account setting change and needs Chad's line; proposed with the Stage D line, not
  before. It would not detect a missed inspection.
- **Current usage figures** (requests, CPU-ms, R2 operations and storage this month) were **not read** for this packet.
  They are read at Stage C and again at the start and end of Stage D.

## 7. Operation counts per run, counted from the code (replacing the proposal's estimates where they differ)

| Run | Requests to EUMETSAT | R2 reads (Class B) | R2 writes and lists (Class A) | D1 |
|---|---|---|---|---|
| Refused by the gate or window | 0 | 0 | 0 | 0 |
| Nothing newer | 1 | 8 | 2 | 1 row |
| Published (no cleanup deletion) | 3 | 14 | 7 | 1 row |

Counted by a recording bucket on one run of each kind (script and output in
`reviews/evidence/2026-11-22-earth-from-space-0.6.22/operation-counts-2026-11-22.md`). Over 288 slots, if every slot
published: about 2,000 Class A and 4,000 Class B operations, against R2's included 1 million and 10 million
a month; a cleanup that deletes adds one or two writes to a published run. The proposal's estimate for reads (6 to 10 a run) was low: a published run makes 14. Visitors' reads of the record and pictures are extra and unknown (proposal section 8).

## 8. The runbook, the REGISTER draft, and what is asked

- Runbook: `reviews/2026-11-22-earth-from-space-stage-c-runbook.md` (Stage C by step id, the monitoring rehearsal as
  four opportunities with the third omitted, Stage D start, hourly inspection, pause, end).
- REGISTER draft: `reviews/2026-11-22-earth-from-space-register-draft.md` (not filed; Chad decided it is filed before
  Stage C; his own line).
- Read-backs to be made at each production step are in the runbook's "Must show" columns.

**Asked of GPT:**

1. The six differences in section 2, above all 2.1 (two lines) and 2.2 (the three-part span check).
2. The code of items 1 to 5 and their tests.
3. `earthview-admin.sh` run natively on macOS with its suite (`node --no-warnings phase1/earthview-admin.test.mjs`), as
   you did for the Stage B caller.
4. The runbook's sequence and "Must show" columns.
5. The REGISTER draft's wording, in particular that it does not claim a Data Policy reading for GeoColour.
6. Whether the Cloudflare email alarm should be attempted before Stage D or left out.

## 9. Still Chad's

His go for nothing further is needed for review. After GPT: his line to file the REGISTER entry; his line to deploy
0.6.22 (by his paste into the Cloudflare editor, as for every hub deploy); his Stage C line; then the rehearsal line;
then the Stage D line with D8's acceptance in words. D3 (a note to EUMETSAT) is open. No provider message is authorised.
