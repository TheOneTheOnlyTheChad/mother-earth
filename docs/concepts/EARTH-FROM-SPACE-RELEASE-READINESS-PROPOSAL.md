# Earth from Space — release-readiness proposal (rev 1, for GPT)

20 Nov 2026. Asked for by Chad on 20 Nov after GPT's pass of the private candidate (`earth-from-space-rc` `9f350bc`, review filed as `reviews/2026-11-20-earth-from-space-r3-gpt-review.md`).

**This is a proposal. Nothing in it has been done in production and it requests no approval.** No production change, spending or provider contact is authorised. The candidate's code is unchanged since `9f350bc`; this commit adds documents and evidence only.

Three parts, as asked: (1) how to establish decoder memory, CPU and served-time behaviour in the Worker runtime; (2) safe recovery if the held list or its counter is lost or rolled back; (3) release blockers against checks that can be deferred with a stated limitation.

Local work done for this proposal (all read-only or on this machine): a run of the candidate's validation inside the Workers runtime locally; the cause of the "eight failing page suites"; a read of the account's billable usage. Evidence in `reviews/evidence/2026-11-19-earth-from-space/`: `workerd-local-spike-2026-11-20.md`, `eight-page-suites-2026-11-20.md`, `cloudflare-billable-usage-read-2026-11-20.json`.

---

## 1. Establishing memory, CPU and served-time behaviour in the Worker runtime

### 1.1 What a local test can and cannot show (done)
The candidate's `worker.js` was run inside workerd 1.20260730.1, Cloudflare's open-source runtime, on the cloud workspace with the real fixtures.

- **Shown:** the validation code runs unchanged in the Workers runtime and gives the same results as under Node (three frames; 6 and 12 validations in one invocation).
- **Not shown, and not showable locally:** capacity. Local workerd enforces no 128 MB limit (it held 1,500 MB of ballast and still decoded) and, with no ceiling, did not collect between runs. The served-time header is a property of the path from Cloudflare to EUMETSAT.

So an isolated local test is representative for "does it run" and not for "does it fit". Fit needs Cloudflare's hosted runtime.

### 1.2 Recommendation: an isolated probe Worker first, then the hub
Two stages, each with its own approval. Stage A cannot affect the hub's isolate or storage. Stage B is the smallest step inside the hub and happens only if A passes.

#### Stage A — isolated probe Worker `mother-earth-evprobe`
**What it is.** A second Worker script on the same account, one file, built from the candidate:
- It contains the candidate's validation code **verbatim** (the `EARTHVIEW` request constants, `evLatest`, `evFetch`, `evJpegScans`, `evPng`, `evDecode`, `evCompare`, the carried decoder, and the helpers they call). A build script extracts them from `phase1/worker.js` and refuses to build if any differs from the candidate's text.
- **No bindings at all:** no R2, no D1, no secrets, no variables. It cannot read or write the hub's storage.
- **No way in from outside:** no route, no custom domain, the `workers.dev` address switched off. It runs only on its own cron trigger, every ten minutes.
- It reports one JSON line per run through `console.log` (Workers Logs). Cloudflare's own per-script metrics give invocation status (including "Exceeded Memory" and "Exceeded CPU Time Limits"), CPU time and memory usage for this script alone.
- Its schedule of work is fixed in the file by a start time named in the approval. After six hours it does nothing; then it is deleted.

**What it does, in three phases.**

| Phase | Window | Each run | Establishes |
|---|---|---|---|
| 1 | hours 0 to 3 (18 runs) | Reads the frame list; asks for the newest frame's 2,048 px JPEG and 256 px check image, exactly as the collector would; records whether each response's `Warning` header names the requested time; validates once | Served-time behaviour for this layer and projection from Cloudflare; memory and CPU of one validation in the production shape; validation on 18 more real frames |
| 2 | hours 3 to 4 (6 runs) | As phase 1, then validates the same picture six times in one invocation. Alternate runs also fetch and validate a 1,536 px picture | Whether garbage from repeated decodes accumulates to the limit; first data for the smaller picture, should it be needed |
| 3 | hours 4 to 6 (up to 12 runs) | Holds B MB of extra memory, then validates once. B rises each run: 16, 32, 48, 64, 80, 96 … | **Measured headroom**: the largest B at which the decode still completes. A run in this phase is expected to end "Exceeded Memory". That is the measurement, and it happens in the probe's isolate |

**Success criteria (all must hold).**
1. Phases 1 and 2: no invocation ends "Exceeded Memory" or "Exceeded CPU Time Limits".
2. Phase 1: both responses carry a `Warning` header naming the requested time in every run.
3. Phases 1 and 2: every real frame passes validation.
4. CPU per invocation, as Cloudflare reports it: 99th percentile under 5,000 ms (the limit for a ten-minute cron is 30,000 ms).
5. Phase 3: the decode completes with at least 48 MB of ballast held. Reason for 48: the live hub's reported memory is P50 2.69 MB and P99 16.86 MB over 24 hours (a percentile, not a maximum); 48 MB is about three times that P99, as allowance for the hub's own state, other work in the same isolate and what the percentile does not show. **This number is Claude's proposal and is the main thing for GPT to challenge.**

**Failure handling.**
- Criterion 1 or 5 fails: 2,048 px as built is not releasable. Phase 2's 1,536 px runs say whether the smaller picture clears the same criteria; if they do, that becomes a branch change with new fixtures and GPT's review. If not, the remaining options of packet r1 §4 (modified decoder, page-side decode, WebAssembly) are reconsidered. No production step follows from a failure.
- Criterion 2: header absent in every run means a Worker cannot confirm served times for this layer, and the feature cannot publish from the hub under the strict rule. Stop and return with options (for example collection from the Mac, as aircraft counts do). The strict rule is not relaxed. Header intermittent: the absent runs would simply not publish in production; report the rate. Claude's proposed threshold for release: present in at least 90% of runs, otherwise the page would show gaps too often. **For GPT and Chad to set.**
- Criterion 3: a real frame refused means the validation limits (set from three frames) are wrong somewhere. Recalibrate on the branch with the refused frame's measures; GPT reviews. Blocker until done.

**How representative it is.**

| | Same as production hub | Different, and how it is covered |
|---|---|---|
| Runtime, memory limit, how memory is counted, collector behaviour under the limit | Same | |
| Validation code and request | Same text, checked at build | |
| Network path to EUMETSAT | Cloudflare's network, as the hub | The data centre that runs a cron varies run to run, for the hub too |
| What else is in the isolate | | The probe holds only its own code. The hub holds a 500 KB module and whatever its other collectors left behind. Covered in part by phase 3's ballast margin; **finally covered only by Stage B** |
| Concurrent requests in the isolate | | None in the probe. Same coverage as above |
| CPU | Same class of machine | Cloudflare reports it; the probe cannot time its own synchronous work |

**Possible effects on the existing hub.**
- **Isolate and storage: none.** Separate script, separate isolate, no bindings.
- **Account allowances: negligible.** About 36 runs. Billable usage as read on 20 Nov: 635 k of 30 M CPU-ms and 80.5 k of 10 M requests used. The probe adds roughly 0.1 M CPU-ms and 36 requests. The Workers Paid plan allows 500 scripts and 250 cron triggers; a second script has no fee. Logs: a few tens of kilobytes against 50 GB. **Expected added cost: US$0.**
- **EUMETSAT's service:** about 110 requests over six hours from Cloudflare addresses, one run at a time, against the hub's present six a day for Dust RGB. If the service limits by address, a Dust RGB run inside the window could be slowed or refused; the window is chosen to avoid 06:00 to 06:20 and 18:00 to 18:20 UTC. This is use of the public service the hub already uses, not a message to the provider; **whether it counts as "provider contact" under Chad's rule is Chad's call.**
- **A deliberate "Exceeded Memory"** will appear in the probe's own metrics in phase 3. It does not touch the hub's metrics, health routes or monitors.

**Approval needed for Stage A (not requested now).** Order: GPT accepts this proposal → Chad's Go for branch work → Claude builds the probe file and its build check, runs it locally in workerd, GPT reviews that one file → then Chad's own line, of this form, with the blanks filled from the reviewed file:

`Approve: create Worker mother-earth-evprobe from earth-from-space-rc <commit>, file phase1/evprobe.js sha256 <hash>, no bindings, no routes, workers.dev off, Workers Logs on, cron */10 * * * *, start <UTC time>, six hours, then delete the Worker`

If the session's safety check refuses Claude's upload (as on 15 Nov), Chad pastes the file and Claude verifies the hash before and after. Deletion is part of the same approval; Claude confirms afterwards that the script and its trigger are gone.

#### Stage B — inside the hub, without storing anything (only if A passes)
The probe's isolate is not the hub's. The last step before switching collection on is the same validation **in the hub's own isolate**, with nothing stored:

1. Deploy the candidate hub (0.6.20 plus whatever section 2 adds) with `EARTHVIEW_ENABLED` unset. With the gate unset the collector makes no request and writes nothing (suite case A1). Its own Approve line, as for any hub deploy.
2. Run a new admin route `/admin/probe/earthview` three times, at different times of day: it fetches the newest frame and check image, checks the header, validates, and returns the result. **It writes nothing** (to be built and tested on the branch, with a break proving it cannot write). Its own Approve line. Success: three of three complete, header confirmed, no "Exceeded Memory" on the hub for that hour.
3. Only then the first manual `/admin/run/earthview` (first stored frame), then the gate. Each its own line, as in the proposal rev 2 plan.

**Effect on the hub in Stage B:** step 2 is the first time the decode runs beside the hub's other work. If it exceeded memory, Cloudflare's stated behaviour is to let in-flight requests finish and start a new isolate, with possible cancelled requests under very high load; the hub's traffic is about 3,000 invocations a day. That risk is why Stage A comes first and why step 2 stores nothing.

### 1.3 What neither stage settles
Behaviour over weeks (memory creep, rare frames, eclipse seasons); concurrency under traffic far above today's. Covered after release by the existing Worker metrics, the run log and the page's own state lines.

---

## 2. Safe recovery if the held list or its counter is lost or rolled back

GPT's condition (r3 review): the ordering argument depends on the held list and counter being durable; loss or rollback is not an established safe recovery and the collector must not be treated as supporting it. Today's candidate would treat a missing list as a first start and restart the counter at 1. **That is the behaviour to remove.**

### 2.1 How loss or rollback could happen
Every write to the list is conditional, so the collector cannot roll it back. Loss or rollback needs a deletion or overwrite from outside the collector: a person or script, a bucket lifecycle rule that matches `earthview/`, a restore from a copy, or a storage incident.

### 2.2 Design (branch work, to be built and reviewed before any deployment)

**A. An epoch in every key.** The list gains an `epoch`: a value minted only at first start and at recovery, never by an ordinary run. Keys and frame ids become `<time>-<sha16>-<epoch>-g<n>`. A new epoch is claimed by a create-only write of a marker object `earthview/epochs/<epoch>.json`; if that write is refused the epoch has been used and another is minted. **A key from one epoch can never be allocated in another, whatever the counter does.** Nothing in production has the present key form, so no migration is needed.

**B. A second witness.** `earthview/state.json` (written every run) records the epoch and the highest counter value seen. It is a different object from the list, so losing or restoring one alone is visible.

**C. A guard at the start of every run, before any number is taken.** Using reads the run already makes:

| | Finding | Action |
|---|---|---|
| G1 | The list is missing, and the pointer names a frame, or the witness exists, or any object exists under `earthview/frames/` | **Stop** |
| G1′ | The list is missing and none of those is true | First start: mint an epoch, create the list create-only |
| G2 | The list's epoch differs from the witness's | **Stop** |
| G3 | The list's counter is below the witness's | **Stop** (rolled back) |
| G4 | The pointer's current or previous frame is not on the list, or is marked or pending there | **Stop** |

**"Stop" means:** the run stores nothing, deletes nothing, takes no number and leaves the pointer alone. The outcome is recorded as failed with one fixed public phrase ("storage record needs repair"); detail goes to the run log. The page keeps the last verified picture and says collection failed. **The collector never repairs the list and never restarts the counter by itself.** It fails every ten minutes, visibly, until a person runs the recovery.

**D. Recovery is a separate, manual, approved action:** `/admin/earthview/recover`, with a dry-run mode that reports and writes nothing.
1. Refuses unless `EARTHVIEW_ENABLED` is unset (collection off), so no run can be in flight. The procedure says to wait two minutes after unsetting it.
2. Reads the pointer. Lists every object under `earthview/frames/`.
3. Verifies the pointer's current and previous pictures (bytes and hash against the pointer's record). If either is missing or wrong it reports and writes nothing: that is a different failure, for a person to decide.
4. Mints a **new epoch** (marker written create-only). Builds a new list: counter 1 in the new epoch; one entry per object found, each keeping its existing key; current and previous in role; every other object out of role with its 24-hour grace period starting now.
5. Writes the list (conditional on what it read, or create-only) and the witness. Logs the inventory. **It deletes nothing and does not touch the pointer.**
6. A person then switches collection back on.

### 2.3 Why a retired key cannot be reused, in each case
- **List lost.** G1 stops the collector. Recovery mints a new epoch; every later key carries it. Every retired key carries an older epoch. No reuse, and the counter's restart at 1 is harmless because the epoch differs.
- **List rolled back across a deletion.** Cleanup deletes only in a run that has just published, so the pointer has moved past the rolled-back list: its current frame is not on that list. G4 stops the collector. (G3 stops it too if the witness survived.) Recovery as above.
- **List rolled back, no deletion since.** No retired key exists. Numbers taken since the rollback point would be reissued: G3 stops this when the witness survived; if both were restored together, the create-only picture write refuses a key that still has an object and the run fails visibly ("picture key already in use"). No picture is replaced.
- **List and witness and pointer all lost, objects remain.** G1's listing of the prefix finds them. Stop. Recovery then has no pointer to honour: every object is listed out of role and the next run publishes afresh.
- **A cleanup from before the loss still running.** It can delete only keys it marked: old-epoch keys that were not in the pointer and can never enter it. If recovery has re-listed such an object, its entry will have no object; it is out of role, is never named by the pointer, and is removed by the ordinary cleanup after its grace period.

**What this rests on:** conditional writes behaving as probed; the epoch markers not being deleted (they are tiny and nothing deletes them); recovery being run only with collection off.

**Release checklist item from this:** confirm that no R2 lifecycle rule on the bucket matches `earthview/` (existing rules cover `raw/`, `snapshots/`, `cells/`).

### 2.4 Tests to add with it
Each guard with its own case and break; first start; recovery dry-run writes nothing; recovery with a missing current picture refuses; recovery then a stale old-epoch delete; counter restart cannot collide (epoch differs); the collector never creates a list when objects exist; GPT's L8 and the whole of section L rerun on the new key form.

---

## 3. Release blockers, and checks that can be deferred with a stated limitation

### 3.1 Blockers (release does not happen until each is closed)

| # | Blocker | Closed by |
|---|---|---|
| B1 | The decoder has never run in Cloudflare's runtime: memory and CPU unknown | Stage A criteria 1, 4, 5; then Stage B |
| B2 | Served-time header for GeoColour in `EPSG:900003` from a Worker is untested | Stage A criterion 2; Stage B step 2 |
| B3 | Held-list loss or rollback is not safely handled | Section 2 built, tested, GPT review |
| B4 | Validation limits rest on three frames from one day | Stage A criterion 3 adds at least 18 real frames over three hours. If the window is all daylight or all night, the other is still thin: state it, or run a second short window |
| B5 | Full regression on the tree to be merged, **on the correct test server** | See 3.3 |
| B6 | REGISTER entry filed; Sources text final (including the limits GPT accepted) | Chad's line for the filing |
| B7 | Merge with current main; header suites rerun | Branch work, then GPT's release review |
| B8 | No lifecycle rule matches `earthview/`; rollback path written (gate unset stops collection at once; revert of the page merge; what remains in storage) | Read-only check, and the release packet |
| B9 | GPT's release review and Chad's own Approve lines for each production step | |

Cost is not a blocker on present evidence: expected added recurring charge is under US$1 a month (account usage is at 2% of included CPU and under 1% of included requests; the feature adds an estimated 2 to 6.5 M CPU-ms and about 30 k R2 writes a month). To be restated with Stage A's measured CPU before any production approval is asked.

### 3.2 Deferrable, each with the limitation the release would state

| Check | Why it can wait | Limitation to state |
|---|---|---|
| Morning and afternoon listing-delay samples | They tune one provisional number (when the page stops saying "Waiting for the next frame"). Safety does not depend on it | "Typical delay measured on one evening; the waiting limit is provisional" (already in the record the hub serves) |
| Real phone, Safari, screen reader | Project practice so far: desktop first, stated as unverified | "Not verified on a real phone, in Safari or with a screen reader" in the release packet |
| GPT's independent run of the page suite and fallback-font header checks | Claude's runs exist; GPT's Mac cannot run Playwright | "Page-suite and fallback-font results are Claude's only" |
| Faint local damage in a late scan | Accepted by GPT in principle for a viewing feature | Stays in Sources as written |
| What instant the frame time marks | Not knowable from the service | Stays on the page as written |
| Storage left by unpublished runs | Bounded by the grace-period cleanup | Stated in the packet |
| Animation, other viewpoints | Out of scope for this release | |

### 3.3 The "eight failing page suites": cause found, and it was Claude's error
They were run against a plain file server. The older page suites must be run against `phase1/serve-core-on.py` (START-HERE says so). Rerun correctly on the branch on 20 Nov: **seven of the eight pass** (ux-round1 34, search-ui 117, drifters-ui 25, kept-ui 21, terminator-ui 19, place-ui 35, smoke-fixes 113). The eighth, `osmc-reliability-ui`, still fails one assertion ("old page: no page errors"), the case already recorded as failing on main on 17 Nov; it loads the 11 Nov page from git and the error is thrown by that old page. It does not involve Earth from Space; its exact cause is not traced.

Consequence: the 19 Nov regression's passes were also obtained on the plain server. They are not withdrawn, but **B5 requires the whole regression again on the correct server on the merge tree**, and the `osmc-reliability-ui` case either traced or carried as a named known failure with GPT's agreement.

---

## 4. Order of work proposed

1. GPT reviews this proposal (the 48 MB criterion, the 90% header threshold, whether Stage A's requests need Chad's "provider contact" decision, the recovery design).
2. On Chad's Go, branch work only: section 2 (epoch, witness, guard, recovery) with tests; the probe file and its build check; the hub's no-store probe route. Local runs in Node and workerd. Packet to GPT.
3. Chad's Approve line for Stage A. Run, report against the criteria.
4. If A passes: release branch work (B5 to B8), GPT's release review, then Stage B and the production steps, each on its own line.

## 5. Questions for GPT
1. Is Stage A's isolation acceptable as described (no bindings, no route, cron only), and is its representativeness table fair?
2. Criterion 5: is 48 MB of ballast the right margin, or should it be tied to something else?
3. Criterion 2 and the 90% threshold for an intermittent header.
4. Phase 3 deliberately drives the probe to "Exceeded Memory". Acceptable?
5. Section 2: are G1 to G4 and the recovery steps sufficient? Is "stop and wait for a person" the right behaviour for every guard?
6. Section 3: anything listed as deferrable that should be a blocker, or the reverse?
