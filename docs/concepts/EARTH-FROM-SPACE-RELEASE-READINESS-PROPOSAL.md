# Earth from Space — release-readiness proposal (rev 2, for GPT)

> **Note, 20 November 2026.** GPT reviewed this rev 2 (`reviews/2026-11-20-earth-from-space-readiness-rev2-gpt-review.md`). **Section 1.2's Stage A (configuration, workload, criteria) and all of section 2 (recovery) are superseded** by `reviews/2026-11-20-earth-from-space-probe-and-recovery.md`, where the probe is a built file and the recovery design is built and tested. Corrections GPT gave for Stage B and for section 3's table are accepted and listed in that packet's section C; they are not yet edited into the text below. Known errors below: manual runs do not have the scheduled 15-minute limit; the slot counts (72 runs, 216 requests, six phase 2 runs a size) are 70, 210 and five; G5 does not catch every coordinated rollback.


20 Nov 2026. Asked for by Chad on 20 Nov after GPT's pass of the private candidate (`earth-from-space-rc` `9f350bc`, review filed as `reviews/2026-11-20-earth-from-space-r3-gpt-review.md`). Rev 1 was `f1ee413`. **Rev 2 answers GPT's review of rev 1, as Chad relayed it on 20 Nov** (five points; section 6 lists what changed). GPT's own review file was not found in the Mac folders Claude can read, so rev 2 works from the relayed points.

**This is a proposal. Nothing in it has been done in production and it requests no approval.** No production change, spending or provider contact is authorised. The candidate's code is unchanged since `9f350bc`; this commit changes documents only. GPT's R3 pass of the candidate stands.

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
- Its schedule of work is fixed in the file by a start time named in the approval. After twelve hours it does nothing; then it is deleted.

**Both picture sizes are tested the same way.** The 1,536 px picture is the fallback if 2,048 px does not fit, so it gets the same phases, the same criteria and the same ballast ladder, on alternate runs (even ten-minute ticks 2,048 px, odd ticks 1,536 px). Before the probe is built, 1,536 px fixtures are captured read-only in the browser pane and the validation is run on them locally; if the comparison's limits do not hold at that size, that is found on the branch, not in production.

**Concrete configuration (for review; any change to it needs review again).**

| Setting | Value |
|---|---|
| Script name | `mother-earth-evprobe` |
| File | one module, `phase1/evprobe.js`, built by `phase1/evprobe.build.mjs` from the candidate's `worker.js`; the build fails if any extracted function differs from the candidate's text |
| Bindings | none (no R2, D1, KV, secrets, variables, service bindings) |
| Routes, custom domains | none; `workers.dev` address off; preview addresses off |
| Trigger | one cron, `*/10 * * * *` |
| CPU limit set on the script | 10,000 ms per invocation (Cloudflare ends an invocation that exceeds it) |
| Logs | Workers Logs on for this script only; one JSON line per run, about 1 KB |
| Start and end | a start time fixed in the file and named in the approval; work only inside the 12 hours after it; outside that window a run returns at once without any request |
| Removal | the script and its trigger deleted after the window; Claude confirms both are gone |

**Workload.** 72 runs over 12 hours, one at a time. Each run makes at most three requests to EUMETSAT's public service (frame list, picture, check image): at most 216 in all.

| Phase | Window | Runs per size | Each run | Establishes |
|---|---|---|---|---|
| 1 | hours 0 to 6 | 18 | Reads the frame list; asks for the newest frame's picture and check image exactly as the collector would; records, for each response, whether a `Warning` header is present and which time it names; validates once | Served-time behaviour for this layer and projection from Cloudflare; memory and CPU of one validation in the production shape; validation on real frames across six hours |
| 2 | hours 6 to 8 | 6 | As phase 1, then validates the same picture six times in the same invocation | Whether garbage from repeated decodes accumulates to the limit |
| 3 | hours 8 to 12 | 12 (the ladder twice) | Holds B MiB of extra memory (1 MiB blocks, each written to), then validates once. B per run: 16, 32, 48, 64, 80, 96 | The largest B at which the decode still completes, per size |

**The deliberate memory failures are bounded.** Phase 3 is the only phase meant to fail. It has at most 24 runs in all; each holds a fixed amount set by the clock, not by the previous run's result; a failed run ends that invocation only; nothing is retried. At most 24 invocations can end "Exceeded Memory", all in the probe's isolate.

**What each run logs** (and nothing else): run time, phase, size, B; the frame time asked for; for each response the HTTP status, content type, byte count, sha256, whether the header was present and the time it named; the validation's outcome, reason and every measure (`surround_share_background`, `disk_brightness_spread`, `agreement`, scans, completeness). CPU, memory and invocation status come from Cloudflare, not from the probe.

**Criteria.** These decide whether to go on to Stage B. **None of them is a statement that the hub has headroom.**

1. **Memory and CPU, phases 1 and 2:** no invocation ends "Exceeded Memory" or "Exceeded CPU Time Limits", for the size being judged.
2. **Served time, phase 1:** in every run, both responses carry a `Warning` header naming the requested time. **Pass means 18 of 18 for that size.** Anything less is not a pass: it is returned with the pattern observed (which runs, which response, which data centre if Cloudflare reports it) for a decision. There is no percentage threshold. The publication rule does not change in any case: **every published frame must have matching confirmation on both responses**; a frame without it is never published.
3. **Validation, phases 1 and 2:** every refusal is diagnosed (below) before anything else is concluded. A refusal is not, by itself, a reason to change a limit.
4. **CPU:** Cloudflare's reported CPU per invocation, 99th percentile under 5,000 ms.
5. **Ballast ladder, phase 3:** reported as measured, per size: the largest B completed and the first B that failed. **Checkpoint to proceed to Stage B: the decode completed at B = 48 MiB.** 48 MiB is a provisional checkpoint chosen by Claude (about three times the live hub's reported P99 of 16.86 MB). It is not proven hub headroom: the probe's isolate is not the hub's, and a percentile is not a maximum. What it buys is a reason to believe Stage B is worth running. Hub headroom is observed only in Stage B and afterwards.

**Which size goes forward.** 2,048 px if it meets 1, 2, 4 and the checkpoint in 5. Otherwise 1,536 px if it meets them. Otherwise neither, and the remaining options of packet r1 §4 are reconsidered. A change to 1,536 px is a branch change (request, fixtures, limits, page wording on detail) with GPT's review before Stage B.

**Diagnosing a refused frame.** The probe cannot keep a picture. Its log gives the frame time, both sha256 values and every measure. Then, read-only:
1. The same frame time is requested again from the browser pane (EUMETView keeps past frames) at the same size, and its bytes saved as a fixture. The service can return a different rendering of the same frame, so the new sha256 is compared with the logged one and both are recorded.
2. The candidate's validation is run on it locally, and the picture is looked at.
3. It is classed as one of: **(a) the picture was faulty** (missing strip, blank, wrong frame): the refusal was right, nothing changes; **(b) the picture was sound and the refusal reproduces**: the measure that refused it is examined, and a change to that limit is proposed only with this frame, the existing fixtures and the reasoning, for GPT's review; **(c) the picture is sound and the refusal does not reproduce** (a different rendering came back, or a runtime difference): recorded as unexplained, and the probe's result is not a pass on criterion 3 until it is understood.

**How representative it is.**

| | Same as production hub | Different, and how it is covered |
|---|---|---|
| Runtime, memory limit, how memory is counted, collector behaviour under the limit | Same | |
| Validation code and request | Same text, checked at build | |
| Network path to EUMETSAT | Cloudflare's network, as the hub | The data centre that runs a cron varies run to run, for the hub too |
| What else is in the isolate | | The probe holds only its own code. The hub holds a 500 KB module and whatever its other collectors left behind. **Not covered by the probe.** The ballast ladder shows how much room the decode leaves in an empty isolate; it does not show what the hub uses. Covered only by Stage B |
| Concurrent requests in the isolate | | None in the probe. Covered only by Stage B and by watching after release |
| CPU | Same class of machine | Cloudflare reports it; the probe cannot time its own synchronous work |

**Possible effects on the existing hub.**
- **Isolate and storage: none.** Separate script, separate isolate, no bindings.
- **Account allowances: negligible.** 72 runs. Billable usage as read on 20 Nov: 635 k of 30 M CPU-ms and 80.5 k of 10 M requests used. The probe adds an estimated 0.1 to 0.3 M CPU-ms and 72 requests. The Workers Paid plan allows 500 scripts and 250 cron triggers; a second script has no fee. Logs: under 100 KB against 50 GB. **Expected added cost: US$0.**
- **EUMETSAT's service:** at most 216 requests over 12 hours from Cloudflare addresses, one run at a time, against the hub's present six a day for Dust RGB. If the service limits by address, a Dust RGB run inside the window could be slowed or refused; the probe skips its 06:00, 06:10, 18:00 and 18:10 UTC ticks to keep clear of them. This is use of the public service the hub already uses, not a message to the provider; **whether it counts as "provider contact" under Chad's rule is Chad's call.**
- **Up to 24 deliberate "Exceeded Memory" results** in the probe's own metrics in phase 3. They do not touch the hub's metrics, health routes or monitors.

**Approval needed for Stage A (not requested now).** Order: GPT accepts this proposal → Chad's Go for branch work → Claude captures 1,536 px fixtures, builds the probe file and its build check, runs it locally in workerd, and GPT reviews that one file and its configuration → then Chad's own line, of this form, with the blanks filled from the reviewed file:

`Approve: create Worker mother-earth-evprobe from earth-from-space-rc <commit>, file phase1/evprobe.js sha256 <hash>, no bindings, no routes, workers.dev off, CPU limit 10000 ms, Workers Logs on, cron */10 * * * *, start <UTC time>, twelve hours, then delete the Worker`

If the session's safety check refuses Claude's upload (as on 15 Nov), Chad pastes the file and Claude verifies the hash before and after. Deletion is part of the same approval; Claude confirms afterwards that the script and its trigger are gone.

#### Stage B — inside the hub, without storing anything (only if A passes)
The probe's isolate is not the hub's. The last step before switching collection on is the same validation **in the hub's own isolate**, with nothing stored:

1. Deploy the candidate hub (0.6.20 plus whatever section 2 adds) with `EARTHVIEW_ENABLED` unset. With the gate unset the collector makes no request and writes nothing (suite case A1). Its own Approve line, as for any hub deploy.
2. Run a new admin route `/admin/probe/earthview` three times, at different times of day: it fetches the newest frame and check image, checks the header, validates, and returns the result. **It writes nothing** (to be built and tested on the branch, with a break proving it cannot write). Its own Approve line. Success: three of three complete, header confirmed, no "Exceeded Memory" on the hub for that hour.
3. Only then the first manual `/admin/run/earthview` (first stored frame), then the gate. Each its own line, as in the proposal rev 2 plan.

Stage B is where hub headroom is first observed. Its three runs are few; the release packet would say so, and the hub's "Exceeded Memory" count and memory percentiles are read daily for the first week after the gate goes on.

**Effect on the hub in Stage B:** step 2 is the first time the decode runs beside the hub's other work. If it exceeded memory, Cloudflare's stated behaviour is to let in-flight requests finish and start a new isolate, with possible cancelled requests under very high load; the hub's traffic is about 3,000 invocations a day. That risk is why Stage A comes first and why step 2 stores nothing.

### 1.3 What neither stage settles
Behaviour over weeks (memory creep, rare frames, eclipse seasons); concurrency under traffic far above today's. Covered after release by the existing Worker metrics, the run log and the page's own state lines.

---

## 2. Safe recovery if the held list or its counter is lost or rolled back

GPT's condition (r3 review): the ordering argument depends on the held list and counter being durable; loss or rollback is not an established safe recovery and the collector must not be treated as supporting it. Today's candidate would treat a missing list as a first start and restart the counter at 1. **That is the behaviour to remove.**

GPT's two findings on rev 1 of this section, both accepted:
- **A coordinated rollback** (list, witness and pointer restored together) passes every rev 1 guard, after which the counter reissues numbers and a retired key can be written again.
- **Two minutes does not prove writers have stopped.** A scheduled invocation may run for up to 15 minutes, and the manual run ignores the gate.

Rev 2 therefore stops relying on stored state for key uniqueness, and stops relying on waiting for exclusion.

### 2.1 How loss or rollback could happen
Every write to the list is conditional, so the collector cannot roll it back. Loss or rollback needs something outside the collector: a person or script, a bucket lifecycle rule that matches `earthview/`, a restore from a copy (of one record or of several together), or a storage incident.

### 2.2 Design (branch work, to be built and reviewed before any deployment)

**A. Key uniqueness that no stored state can undo.** Every key carries a 96-bit random value drawn by the run itself (`crypto.getRandomValues`), beside the epoch and the counter:

`earthview/frames/<epoch>/<time>-<sha16>-g<n>-<24 hex>/picture.jpg`

The picture write stays create-only. **A retired key can be written again only if a later run draws the same 96-bit value**, whatever has happened to the list, the witness, the pointer or the counter, separately or together. That is the property the coordinated rollback defeated in rev 1: there, uniqueness came from a number kept in storage. Here the counter and the epoch are kept for order, detection and fencing; the safety against reuse does not rest on them. (Stated honestly: this is a probability, about 1 in 8 × 10^28 per pair of keys, not an impossibility.)

**B. An epoch, minted only at first start and at recovery,** claimed by a create-only marker `earthview/epochs/<epoch>.json` and written into the list, the pointer and the witness. It is the **fencing token** (D below) and it puts each epoch's pictures under their own prefix.

**C. Guards at the start of every run, scheduled or manual, before any number is taken.**

| | Finding | Action |
|---|---|---|
| G0 | A hold record `earthview/hold.json` exists | **Stop** ("collection is held") |
| G1 | The list is missing, and the pointer names a frame, or the witness exists, or any object exists under `earthview/frames/` or `earthview/epochs/` | **Stop** |
| G1′ | The list is missing and none of those is true | First start: mint an epoch, create the list create-only |
| G2 | The epochs of the list, the pointer and the witness are not all the same | **Stop** |
| G3 | The list's counter is below the witness's | **Stop** |
| G4 | The pointer's current or previous frame is not on the list, or is marked or pending there | **Stop** |
| **G5** | **Inventory: one listing of the current epoch's prefix, `earthview/frames/<epoch>/`. Any object there that is not on the list; or any current-epoch entry that is neither marked nor pending and has no object there. Also: the pointer's current and previous pictures exist (they may carry an older epoch's key after a recovery, so each is checked by its own key)** | **Stop** |

**G5 is what catches a coordinated rollback.** The stored pictures are a witness that restoring three records does not rewind. In normal running an object never exists without its entry (the entry is written first) and an unmarked, claimed entry always has its object, so G5 has no false alarm from overlapping runs. After a rollback of list, witness and pointer to an earlier moment, either a picture has been stored since that moment, and it is an object the restored list does not know (stop), or nothing has been stored since and nothing has changed. Cost: one R2 list request and two existence checks per run, about 4,300 list requests a month against 1 million included.

**"Stop" means:** the run stores nothing, deletes nothing, takes no number and leaves the pointer alone. The outcome is recorded with one fixed public phrase ("storage record needs repair", or "collection is held"); detail goes to the run log. The page keeps the last verified picture and says collection failed. **The collector never repairs the list and never restarts the counter by itself.** The manual route `/admin/run/earthview` runs the same guards; it ignores only the schedule gate, as now.

**D. Fencing, so that exclusion does not depend on waiting.** A run reads the epoch at its start. **Every conditional write it makes afterwards (taking a number, the claim, the pointer, cleanup's writes) carries a check that the record's epoch is still that one, and aborts if not.** Recovery changes the epoch in the list and re-stamps the pointer with it by conditional writes. From that instant every run that began under the old epoch fails its next write to either record and stops, however long it has been running and whether it was scheduled or manual. It cannot take a number, claim, publish or clean up.

What an old-epoch run can still do after recovery is finish a picture write it had already begun, under the old epoch's prefix, and delete a key it had already marked. Neither harms the new epoch: its prefix is different, the stray object is unlisted and out of the pointer's reach, and a marked key was already out of role and (A) can never be written again. Strays are found and listed by the sweep in E.

**E. Recovery is a separate, manual, approved sequence.** Each step is an admin route with a dry-run that reports and writes nothing, and each write step needs Chad's own line.
1. **Hold.** `/admin/earthview/hold` writes the hold record with the hub's time. From the next run's start, G0 stops every run, scheduled or manual. The schedule gate is also unset.
2. **Wait until the hold is at least 16 minutes old.** The recovery route refuses before then. This is not what makes recovery safe (D does that); it is so that the inventory in step 3 is not taken while a run that started before the hold could still be writing. Sixteen minutes is one more than the 15 minutes Cloudflare allows a scheduled invocation.
3. **Recover.** Reads the pointer; lists every object under `earthview/frames/`; verifies the pointer's current and previous pictures by bytes and hash (if either is missing or wrong it reports and writes nothing: that is a different failure, for a person to decide). Mints a new epoch. Writes a new list (counter 1 in the new epoch; one entry per object found, each keeping its existing key; current and previous in role; every other object out of role with its 24-hour grace period starting now), re-stamps the pointer with the new epoch (frames unchanged), writes the witness. All conditional on what it read. **It deletes nothing.** Logs the full inventory.
4. **Sweep** (may be repeated): lists the old epochs' prefixes again and adds any object not yet on the list as an out-of-role entry. Catches a picture written by a straggler after step 3.
5. **Release.** `/admin/earthview/release` removes the hold. The gate is set again on its own line.

### 2.3 Why a retired key cannot be reused, case by case
- **List lost.** G1 stops the collector. After recovery, new keys are under a new epoch's prefix and carry fresh random values.
- **List rolled back, alone or with the witness.** G2, G3 or G4 stops the collector in most cases; G5 stops it whenever a picture has been stored since the rollback point. Recovery as above.
- **List, witness and pointer rolled back together (GPT's case).** G1 to G4 pass. G5 stops the collector if any picture has been stored since the rollback point. **And if G5 were also defeated, reuse still does not happen:** the counter may reissue numbers, but each new key carries a new random value, so it is a different key from every retired one (A).
- **Everything lost but the pictures.** G1 finds objects under the prefix. Stop. Recovery lists them all out of role; the next run publishes afresh.
- **A cleanup from before the recovery still running.** It can delete only keys it marked: keys that were out of the pointer and (A) will never be written again. Its writes to the list fail the epoch check (D).
- **A collector run from before the recovery still running, for up to 15 minutes, scheduled or manual.** Its next conditional write fails the epoch check (D). It publishes nothing. A picture it was already writing lands under the old prefix and is picked up by the sweep.

**What this rests on:** R2 conditional writes behaving as probed; `crypto.getRandomValues` giving unpredictable values in the Workers runtime; the epoch markers not being deleted.

**What it does not do:** it does not detect a rollback after which nothing was ever stored (there is nothing to protect), and it does not make a restore of the whole bucket to an earlier day safe to run on without recovery: that is a recovery case (hold, recover, release), and the release runbook says so.

**Release checklist items from this:** confirm that no R2 lifecycle rule on the bucket matches `earthview/` (existing rules cover `raw/`, `snapshots/`, `cells/`); the runbook for hold, recover, sweep and release, with its dry-runs, is part of the release packet.

### 2.4 Tests to add with it
- Each guard G0 to G5, with its own case and its own break.
- **GPT's coordinated rollback as a regression:** publish, store more, then restore list, witness and pointer together to their earlier bytes; assert G5 stops the next run; then, with G5 disabled by a break, assert that no later key equals any earlier key and that every earlier object is untouched.
- Fencing: a run paused before each of its conditional writes while recovery completes, then resumed; scheduled and manual; assert it writes nothing further and the pointer and list are recovery's.
- A straggler's picture written after recovery is found by the sweep.
- Hold stops scheduled and manual runs; recovery refuses before 16 minutes and without a hold; every dry-run writes nothing.
- Recovery with a missing or altered current picture refuses.
- The collector never creates a list when anything exists under the prefixes.
- The random value: two runs with the same counter value produce different keys; with the random source stubbed to repeat, the create-only write refuses.
- All of section L, GPT's L8 included, rerun on the new key form.

---

## 3. Release blockers, and checks that can be deferred with a stated limitation

### 3.1 Blockers (release does not happen until each is closed)

| # | Blocker | Closed by |
|---|---|---|
| B1 | The decoder has never run in Cloudflare's runtime: memory and CPU unknown | Stage A criteria 1, 4 and the checkpoint in 5, for the size that goes forward; then Stage B, which is the first observation in the hub's own isolate |
| B2 | Served-time header for GeoColour in `EPSG:900003` from a Worker is untested | Stage A criterion 2 (18 of 18, or a decision on the pattern seen); Stage B step 2 |
| B3 | Held-list loss or rollback is not safely handled | Section 2 built, tested (GPT's coordinated rollback and the long-running writer included), GPT review; recovery runbook in the release packet |
| B4 | Validation limits rest on three frames from one day | Stage A validates real frames at each size across 12 hours, with every refusal diagnosed (not assumed to be a limit problem). Twelve hours covers day and night over the disk but one date only: stated in the release packet |
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

1. GPT reviews rev 2.
2. On Chad's Go, branch work only: 1,536 px fixtures (read-only, pane) and local validation at that size; section 2 (random value in the key, epoch, guards G0 to G5, fencing, hold, recover, sweep, release) with tests; the probe file, its build check and its configuration; the hub's no-store probe route. Local runs in Node and workerd. Packet to GPT. **A change to the candidate's code ends the R3 pass for the changed parts; GPT reviews the new candidate.**
3. GPT reviews the probe's concrete file and configuration. Then, and only then, Chad is asked for the Stage A line.
4. Stage A runs; results reported against the criteria, refusals diagnosed.
5. If a size goes forward: release branch work (B5 to B8), GPT's release review, then Stage B and the production steps, each on its own line.

## 5. Questions for GPT
1. Section 2.2 A and G5: does a per-run random value in the key, with the inventory guard, close the coordinated rollback to your satisfaction?
2. Section 2.2 D and E: does epoch fencing on every conditional write, plus the hold and the 16-minute rule for the inventory, answer "two minutes does not prove writers have stopped"? Is anything a pre-recovery writer can still do (finish a picture write under the old prefix; delete a key it had marked) a problem?
3. Stage A's concrete configuration and workload (12 hours, 72 runs, both sizes, the ladder to 96 MiB twice per size, at most 24 deliberate failures): acceptable, or to be narrowed?
4. Criterion 5 as now worded: a checkpoint for going on to Stage B, with no claim about the hub.
5. Stage B: are three no-store runs in the hub enough before the first stored run, given a week of daily reads afterwards?
6. Section 3: anything mis-sorted between blocker and deferrable?

## 6. Changes from rev 1 (GPT's review, as relayed by Chad on 20 Nov)
| GPT's point | Change |
|---|---|
| Recovery can miss a coordinated rollback of list, witness and pointer, allowing retired-key reuse | Key uniqueness no longer rests on stored state: a 96-bit random value in every key (2.2 A). New guard G5 reconciles the stored pictures with the list every run and catches the rollback (2.2 C). The case is argued in 2.3 and is a named regression in 2.4 |
| Two minutes does not prove writers have stopped; runs can continue; the manual run bypasses the flag; scheduled invocations may run 15 minutes | Exclusion no longer depends on waiting: every conditional write is fenced by the epoch (2.2 D). A hold record stops scheduled and manual runs alike (G0). Recovery refuses until the hold is 16 minutes old, for the inventory's sake; a sweep catches stragglers (2.2 E) |
| 48 MiB of ballast is a provisional checkpoint, not proven hub headroom | Criterion 5 reworded as a checkpoint for going on to Stage B; the representativeness table now says the probe does not cover what the hub itself uses; headroom is observed only in Stage B and after |
| The smaller-image fallback needs equivalent testing | 1,536 px gets the same phases, criteria and ladder on alternate runs; fixtures and local validation at that size come first. Window 12 hours instead of six |
| Header criteria conflict ("every run" against 90%) | The 90% threshold is removed. Pass is 18 of 18; anything less is returned with its pattern for a decision. Every published frame must have matching confirmation on both responses, unchanged |
| A rejected frame needs diagnosis; it does not automatically mean the thresholds should change | A diagnosis procedure with three outcomes; a limit change only for a sound picture whose refusal reproduces, with evidence, for review (1.2) |
| The probe's concrete configuration and workload still need review | Configuration table, workload, what is logged, and the bound on deliberate failures added (1.2). The approval line is still not requested |
