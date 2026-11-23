# Earth from Space — probe build and corrected recovery, packet for GPT

20 November 2026. Branch `earth-from-space-rc`, code and evidence at commit `3c7598b509af6208459b09f730e861dd75fc1b72` (this packet is the next commit, documents only). Answers GPT's review of readiness proposal rev 2 (`c70fc78`), filed at `reviews/2026-11-20-earth-from-space-readiness-rev2-gpt-review.md`.

**What this is.** Branch work only, on Chad's "go". Two things are built and tested here:
- **Part A:** the corrected recovery design, in the hub candidate (`phase1/worker.js`), with tests for each of your three findings.
- **Part B:** the Stage A probe Worker as a file (`phase1/evprobe.js`), its build check, its slot table, its configuration, and the rule that will read its result.

**What is asked.** Review. **No approval is requested.** Nothing was deployed, no production storage was read or written, nothing was spent. The hosted probe still needs your review of this file and configuration, then Chad's own line.

**What this does to the R3 pass.** R3 passed `9f350bc` as a private candidate. This commit changes the collector's storage path (keys, guards, fence, cleanup's pointer reads) and adds the admin recovery actions. **Those parts are no longer covered by the R3 pass and need review here.** The validation code is unchanged: the sixteen declarations the probe is built from are identical, character for character, to `9f350bc`, except one added line in the `EARTHVIEW` constant (two storage key names and three listing limits, which the validation does not read).

---

## Part A — Recovery, as built

### A1. Fault model
**In scope.** Something outside the collector removes, alters or puts back an earlier version of the pointer, the list or both; or deletes stored pictures. Runs that started earlier, scheduled or manual, may still be going at any point and for any length of time. A cleanup may be paused at any instruction, including just before a delete.

**Corrected from rev 2.** Rev 2 gave manual runs the scheduled 15-minute limit. That was wrong: Cloudflare's limits page gives HTTP-triggered Workers no duration limit while the client stays connected (read again 20 Nov). **Nothing here assumes any run has ended.** The 16-minute wait is removed.

**Out of scope, stated:** R2 conditional writes not behaving as probed on the production bucket; `crypto.getRandomValues` being predictable; someone altering stored picture bytes while keeping size and SHA-256.

### A2. Records and keys
| Record | Holds | Written by |
|---|---|---|
| `earthview/current.json` (pointer) | epoch, current frame, previous frame | collector (publish, fenced); recovery |
| `earthview/held.json` (list) | epoch, every stored picture, its role state | collector and cleanup (fenced); recovery; sweep |
| `earthview/epochs/<epoch>.json` | create-only marker, with the recovery's plan | recovery only |
| `earthview/hold.json` | present = no run may start | hold; removed by release |
| `earthview/state.json` | last source check, last outcome, for the page | collector. **No guard reads it** |

Key: `earthview/frames/<epoch>/<time>-<sha16>-g<n>-<24 hex>/picture.jpg`. The 24 hex digits are 96 random bits drawn by the run. The picture write is create-only.

**The collector never creates the pointer or the list.** Both are created only by the recovery action, for a first start and for a repair alike. A run that finds either missing stops. There is no counter that could silently restart: the number `g<n>` is kept for reading order only, and key uniqueness does not rest on it.

**Removed from rev 2, and why.** The witness (a counter high-water mark in the state record) is gone. With random keys the counter protects nothing, so a witness of it protects nothing either, and it brought the obligations you listed (monotonic updates, failed safety writes, evidence destroyed by the failure writer). The state record is now outside every guard, so a failure report cannot destroy evidence and a failed write to it is not a safety failure. Test `stops(...)` asserts, for every stop, that nothing but the state record changed.

### A3. Guards, at the start of every run, before any request or write
| | Finding | Outcome (fixed public phrase) |
|---|---|---|
| G0 | a hold record exists | `collection is held` |
| G1 | neither pointer nor list exists | `storage is not set up` |
| G1 | one is missing or does not parse | `storage record needs repair` |
| G2 | the epochs differ, or the epoch has no marker | repair |
| G4 | the pointer names a picture outside this epoch, not on the list, marked, or pending | repair, after a second read confirms it |
| G5 | inventory mismatch against a stable view, found twice | repair |
| G5 | the view could not be held still | `storage busy` |

A stopped run makes no request to EUMETSAT, stores nothing, deletes nothing, and leaves the pointer, list, markers and pictures untouched. The manual route runs the same guards.

**G5, the stable inventory procedure (your point 2).**
1. Read the list (version `a`).
2. List every page of `earthview/frames/<epoch>/` (cursor loop, 1,000 a page, at most 20 pages; more is reported as repair).
3. Read the list's version again. **If it is not `a`, the pass is discarded**: it is not a finding.
4. On a stable pass, a mismatch is: a stored picture the list does not know; or a claimed, unmarked entry of this epoch with no stored picture.
5. A mismatch must be found by **two** stable passes with the same result before the run reports repair. At most four passes. If no conclusion is reached the run ends as `storage busy`: nothing is collected and nothing is called broken.

Why a stable pass is sound: an entry is always written before its object (the "pending" write), and an object is deleted only after its mark is written. So with no list write between steps 1 and 3, every object seen has its entry in the version read, and every claimed unmarked entry still has its object, unless the records and the store really disagree. Your A/B case is test M8; four overtaken passes are M9.

Never reported: pending entries without a picture (K2); marked entries without a picture (L5b); entries adopted by a recovery whose key is under another epoch (M7), because an old delete may still remove those, harmlessly.

**G5 is a consistency check, not a rollback detector.** A restore after which the records and the stored pictures agree passes it (tests N4 and P1 set up exactly that and say so). Key safety rests on the random value, not on detection.

### A4. The fence
A run learns the epoch from the guards. Every conditional write it makes afterwards (taking a number, the claim, the pointer, cleanup's two list writes) goes through `evFence(epoch, …)`, and cleanup's two pointer reads check it too. The check is inside the change function that `evUpdate` calls **on every retry, against the record just read**, so a write refused because the record changed is re-fenced before it is tried again. A failed fence ends the run with `storage changed during the run`.

### A5. Recovery: order of writes, and what holds in every gap (your point 3)
`/admin/earthview/<status|hold|recover|sweep|release>`, admin key. Every action is a dry run unless it is a POST with `apply=1`. `recover` and `sweep` also need `plan=<id>` from a dry run and refuse if what they then find gives a different id.

| Step | What it does | What an earlier run can still do | What new runs do |
|---|---|---|---|
| hold | writes the hold record, create-only | everything, as before | stopped by G0 |
| R1 | reads pointer, list, every object. Reads the current and previous pictures **whole** and checks each against the size and hash the pointer records. One that is missing or differs is not kept, and the plan says so by role | as before | stopped |
| R2 | new epoch; its marker, create-only, holding the plan | as before | stopped |
| R3 | writes each kept picture's bytes, **from memory**, to a **new key** under the new epoch; reads each back | as before. **It can still publish; if it does, R4 refuses** | stopped |
| **R4** | **the fence on publication:** one conditional write of the pointer, on exactly the version R1 read: new epoch, kept frames under their new keys. If the pointer changed since R1 nothing is installed and recovery ends. **It is not retried** against a pointer the plan never saw | **cannot publish** (pointer write meets the new epoch). Can still take a number, store and claim on the old list. A cleanup stops at its pointer read; one already past it deletes only keys it had marked, none of which the new pointer names | stopped by G0 and by G2 |
| R5 | lists every object under `earthview/frames/` (after the fence) and writes the list: new epoch, kept pictures in role, **every other object out of role, grace period starting now**. The body does not depend on the old list, so a conflict is retried (5 times) | cannot write the list either | stopped |
| R6 | runs the guards on the result and reports | | stopped |
| sweep | adds any stored picture the list does not know, out of role (fenced). Repeatable | | stopped |
| release | refuses unless: held; every guard passes; a sweep would add nothing; current and previous read back whole and match. Then removes the hold | | run |

**Recovery deletes nothing.** The page is served from the new keys from R4 on.

**Partial failure.** A failed recovery is never resumed. It is run again from R1 with a new epoch.
- Failure before R4 (N6, O4): nothing live changed. Left behind: one marker and up to two unlisted copies under an epoch that never became current. The next R5 adopts the copies out of role.
- Failure between R4 and R5 (N6b): the pointer is recovery's and is served; the list is the old epoch's; **G2 keeps every run stopped and release refuses**. Recovery is run again, whole: it copies the pointer's pictures once more and installs both records.

### A6. Your three findings
| Your finding | Closed by | Tests |
|---|---|---|
| 1. A restored key with an old delete pending is preserved, then deleted | Recovery never keeps a key. It copies the verified bytes to new keys before it installs a pointer (your second option). A pending delete can reach only the old copies | **N4** (your counterexample: both restored keys are deleted after recovery; both frames still served). **N5a** (a kept picture deleted between dry run and apply: apply refused). **N5b** (both originals deleted during the apply, after verification: recovery completes from memory). **N6** (failure before the pointer commit). Break `recover-keeps-key` |
| 2. G5 false alarm; needs a stable procedure | A3 above | **M8** (your A/B case), **M9** (contention → busy), **M10** (pagination), **M6** (confirmed twice), **M7**. Breaks `inventory-unstable-view`, `inventory-one-pass`, `inventory-first-page-only`, `pending-called-missing`, `marked-called-missing`, `adopted-called-missing` |
| 3. Two writes cannot change epoch together; old writers between them | Pointer first (it is the fence on publication), never retried; list second, from an inventory taken after the fence; hold kept until release's checks pass | **O4** (an earlier run publishes between R3 and R4: recovery refuses). **O5, O6** (earlier collectors resumed between R4 and R5). **O7, O8** (earlier cleanups resumed between R4 and R5). **O1 to O3** (after recovery; scheduled, manual job and manual route). **O9**. Breaks `no-fence`, `recover-pointer-unconditional`, `cleanup-pointer-unfenced`, `recover-list-before-inventory` |

The O tests pause real runs at a named storage call with a gate, start recovery, pause **it** between its writes with a second gate, let the earlier run go, then let recovery go.

### A7. What this does not do
- **An undetected restore, then the pending delete, before anyone runs recovery.** If an older pointer is put back, names a key whose delete is already pending, and the delete lands before a recovery, that picture is gone. The address answers 503 `missing`, never another picture; the next run stops with repair; recovery then reports the picture as not kept. Test **P4** shows exactly this. No check in the collector can prevent it: the restore itself re-pointed at a condemned key.
- **Key reuse is improbable, not impossible.** 96 random bits; create-only refuses a key that still has an object. A deleted key could be drawn again with probability about 1 in 8 × 10^28 per pair.
- **G5 does not detect every restore** (A3).
- **A picture stored by an earlier run after R5** lands under the old epoch's prefix, unlisted. The guards do not look there. It is a leak of at most one picture per such run until a sweep adopts it (O2, O6). Release refuses while one exists; one arriving after release stays until the next hold and sweep.
- **The hold does not stop a run already going.** Only the fence does, at its next write.
- **Unpublished pictures** (stored and claimed, never published) are deleted only by a later publishing run's cleanup. With no later publication they stay.
- **Recovery cannot keep a picture that no longer matches its record** (N7). It installs what it can verify, which may be an empty pointer.

### A8. Runbook (each write is its own Approve line in production)
1. `GET …/status`: read what is there and what the guards say.
2. `POST …/hold?apply=1`.
3. `GET …/recover`: read the plan (mode, kept, not kept). Note `plan_id`.
4. `POST …/recover?apply=1&plan=<id>`. On `pointer changed`, go to 3. On any failure, go to 3.
5. `GET …/sweep`; if it would add anything, `POST …/sweep?apply=1&plan=<id>`; repeat until it adds nothing.
6. `POST …/release?apply=1`.

The first production start is this same sequence on empty storage (N1).

### A9. Tests for Part A
`phase1/earthview-hub.test.mjs`: **294 checks** (159 at R3), **52 breaks** (26 at R3), each of which fails (three by stopping the suite on an error; listed in `evidence/…/suites-2026-11-20.md`). New sections: M (guards), N (hold, recover, sweep, release), O (earlier runs against a recovery), P (restores). Sections A to L are kept, on the new key form; four cases were adapted and say so in place (K6, K9's last step, L1's hook position, L7).

`FAST=1` remembers full JPEG decodes per input and is used for the break runs only (the suite now publishes several hundred frames; a default run takes about 90 seconds). The default run does not use it.

---

## Part B — The Stage A probe, as a file

### B1. Files
| File | What | sha256 |
|---|---|---|
| `phase1/evprobe.js` | **the probe Worker** (generated; start `2026-11-21T07:00:00Z`, illustrative) | `c7998618f91429a05141b88cded4c6978fefb7506525c87f6f7bbf12afaf8a61` |
| `phase1/evprobe.driver.js` | the probe's own driver, the only hand-written code in it | `88aac761858d0c4940a1242082449e6ca9b650b140e532e581c2d00e8792073b` |
| `phase1/evprobe.build.mjs` | cuts sixteen declarations out of `worker.js`, appends the driver, verifies | |
| `phase1/evprobe.wrangler.jsonc` | reference configuration | |
| `phase1/evprobe.report.mjs` | the rule that reads the result | |
| `phase1/evprobe.test.mjs` | **59 checks, 15 breaks** | |

**The start time is one line of the file** (`PROBE_START`). The approved start will differ from the illustrative one, so the approved file's hash will differ from the one above by that line. `node phase1/evprobe.build.mjs --verify` rebuilds the file from `worker.js` and the driver for the start time it finds and fails unless the result is byte for byte the file on disk. The Approve line names the final hash.

### B2. What is the candidate's code, and what is not
Part 1 of the file is sixteen declarations cut whole from `worker.js`: `COLLECTOR_VERSION`, `UA`, `sha256Bytes`, `pngInfo`, `dustInflate`, `dustBody`, `DUST_CRC`, `dustServed`, `EARTHVIEW`, `evLatest`, `evJpegScans`, `evDecode`, `evPng`, `evCompare`, `evFetch`, `EV_JPEG` (the carried decoder with its licence notice). Tests A1 to A5 check that each occurs exactly once in `worker.js`, unchanged, and that part 1 holds nothing else. That list is the whole dependency closure: the file loads and runs inside workerd with nothing else defined (B8).

Part 2, the driver, is new code: the plan, the run, the log lines, and `evprobeValidate`, which repeats the collector's steps 3 and 4 with the size as a parameter. Section D of the test runs eleven inputs (three real frames, seven damaged or mismatched, one of the wrong size) through **both** the hub's collector and the probe and requires the same acceptance or the same refusal with the same wording.

**The smaller-size variant** is the same file: the size is the slot's, 2048 or 1536, in the request's `width` and `height` and in the size check. Nothing else differs between the two.

**Deliberate differences from the collector:** validation runs even when a header is missing or names another time, so that memory is measured on every run (the collector would stop); nothing is stored.

### B3. Slots and denominators
The plan is a function of the start time alone. For **every** start on the ten-minute grid (test B5, all 144):
- 72 nominal slots in twelve hours. **2 are excluded** (whichever of 06:00/06:10 or 18:00/18:10 UTC falls in the window). **70 runs.**
- Phases are counted in **runs**, not clock hours, so the exclusion cannot shorten a phase unevenly: runs 1 to 36 are phase 1, 37 to 46 phase 2, 47 to 70 phase 3.
- Per size: **18** runs in phase 1, **5** in phase 2 (rev 2 said 6), **12** in phase 3: each rung (16, 32, 48, 64, 80, 96 MiB) exactly **twice**.
- At most 3 requests a run: **at most 210 requests** to EUMETSAT (rev 2 said 216).

The table for a 07:00 UTC start is `reviews/evidence/2026-11-20-earth-from-space-probe/slot-table-0700.md`. Your enumeration (18/6/11 for that start) was right for rev 2's clock-based phases; this is the change made because of it.

**70 is opportunities, not completed runs.** Cron delivery can be late or missing. A slot is never made up: the window is fixed in the file and no request is added to replace a missed one. Outside the window a tick makes no request (C17, C18).

### B4. What a run logs, and how a killed run is read
One JSON line each, all carrying slot, run, phase, size, ballast and an isolate id:
`start` → (`ballast`) → `fetched` → `validate-begin` / `validated` (once, or six times) → `done`.
- `fetched` carries both responses' facts (bytes, hash, header present, time named) **before any decode**, so a run killed while decoding has still reported its header result.
- A run killed for memory shows how far it got: no `ballast` line = it died taking the extra memory; `validate-begin` without `validated` = it died decoding.
- Phase 3 memory: 1 MiB blocks, every byte written with a per-block value, **kept referenced through the validation and checked afterwards** (`ballast_ok`). Breaks `ballast-not-written` and `ballast-released-early` fail.
- `isolate`, `isolate_run` and `overlapping` show isolate reuse and any overlap. **Nothing assumes runs are serial or that each gets a fresh isolate.** A run has a wall budget of 240 s (30 s list + 90 s + 90 s at worst).
- CPU time, wall time and the outcome of each invocation (`ok`, `exceededMemory`, `exceededCpu`, …) come from Cloudflare's invocation log, joined to the probe's lines by scheduled time. **The probe cannot time its own work:** in the Workers runtime the clock does not advance during computation, so the `wall_ms` on `validated` lines will read about 0 there. It is not used by any criterion.

### B5. Configuration, and what is read back after upload
`phase1/evprobe.wrangler.jsonc`. To be read back from the dashboard (or API) before the first tick, and recorded:

| Setting | Value | 
|---|---|
| Script | `mother-earth-evprobe`, one module, hash as approved |
| Compatibility date / flags | `2026-10-30` / none: **the hub's own**, read from its Settings page 20 Nov about 09:00 UTC |
| Bindings | none of any kind |
| `workers.dev` address | off |
| Version (preview) addresses | off, set explicitly |
| Routes, custom domains | none |
| Handlers | `scheduled` only. An HTTP request has no handler (B8) |
| Trigger | one cron, `*/10 * * * *` |
| CPU limit | 10,000 ms (the hub's own value was not legible in the page text read; nothing here relies on it) |
| Workers Logs | on, sampling 1, invocation logs on |
| Window | fixed in the file: twelve hours from `PROBE_START`; silent outside it |
| Removal | script and trigger deleted after the window; confirmed gone |

### B6. Criteria, as coded (`phase1/evprobe.report.mjs`)
Each criterion is `met`, `not met` or `incomplete`, per size. **A missing observation is never a success and never a failure.**

| | Criterion | `not met` | `incomplete` |
|---|---|---|---|
| 1 | Phases 1 and 2: no invocation ended for memory or CPU, none left unfinished | any such run | a run not observed, or no invocation record for it |
| 2 | Phase 1: both responses named the requested time, in **18 of 18** runs | any observed run where either did not, reported with the pattern | fewer than 18 observed |
| 3 | Every refusal diagnosed | a refusal diagnosed as a sound picture (b or c) | an undiagnosed refusal; or a run that did not validate |
| 4 | CPU: the **maximum** over single-validation runs under 5,000 ms | one run at or over it | a run with no CPU figure |
| 5 | Checkpoint: **every** planned run at 16, 32 and 48 MiB completed, validated, memory intact (2 of 2 per rung) | any of those killed or not intact | any not observed |

A size **qualifies** only with all five met, criterion 3 included. `incomplete` anywhere and nothing `not met` = the experiment is incomplete for that size: it is returned for a decision, and **the window is not extended**. 2048 goes forward if it qualifies, else 1536 if it does, else neither.

Also reported, not judged: every rung's result; the six-validation CPU maximum; distinct frames validated and their time range; runs that overlapped or ran twice. If every run at 96 MiB completes, the report says the extra memory may not be counted toward the limit and the ladder may have measured nothing.

**48 MiB is a checkpoint for going on to Stage B and no more.** "Completed at B" and "no memory failure" are observations of those invocations in the probe's isolate. They do not measure hub headroom.

Test section E runs the whole 70-run window through the probe (stubbed source) and checks the rule on the clean result and on eleven altered ones (missed slot, missing header, refusal with and without diagnosis, kills at each stage, missing invocation records).

### B7. CPU arithmetic
- Configured ceiling: 70 runs × 10,000 ms = **700,000 CPU-ms** (72 nominal slots × 10,000 = 720,000, your figure). Not a billing maximum: it is what the limit permits.
- Estimate from the Node measurements (348 to 375 ms a validation): 60 single validations + 10 runs of six ≈ 120 validations ≈ **45,000 CPU-ms**, well inside rev 2's 0.1 to 0.3 million. Billable usage read 20 Nov: 635,350 of 30,000,000 included.
- The actual figures are part of the report.

### B8. Local runs
- **Node:** `phase1/evprobe.test.mjs`, 59 checks.
- **workerd** (miniflare 4.20260730.0, workerd 1.20260730.1): the file as built, loaded as a Worker with no bindings, thirteen scheduled events. Every phase at both sizes, rungs 16, 48 and 96, an excluded slot, before and after the window. Three requests a run; an HTTP request to it answers "Handler does not export a fetch() function". Output: `evidence/…/workerd-run-2026-11-20.md`. **This shows it runs. It shows nothing about capacity:** local workerd has no memory limit, which is why 96 MiB completes there.

### B9. 1,536 px
**Real frames.** The probe file itself (same hash) was loaded in the browser pane from the branch and its validation run on six real frames fetched in that page, read-only: 19 Nov 00:00, 11:00, 16:50; 20 Nov 04:00, 06:30, 08:30 UTC. All six pass at 1,536 px; the three also fetched at 2,048 px pass. Every response named the requested time. The script ran twice (my first call timed out in the tool but finished in the page), so this was 32 requests, not the 16 intended; both passes received byte-identical 1,536 px pictures for all six frames. `evidence/…/validation-1536-real-frames.json`.

| Measure | Limit | 1,536 px (six frames) | 2,048 px (same three frames) |
|---|---|---|---|
| agreement | ≥ 0.85 | 0.936 to 0.971 | 0.944 to 0.971 |
| surround at background, share | ≥ 0.98 | 1 | 1 |
| surround, worst difference | tolerance 16 | **6.9 to 12.9** | 1.9 to 2.6 |
| disk brightness spread | ≥ 12 | 36.1 to 56.6 | 51.8 to 56.6 |
| scans | complete | 10, complete | 10, complete |

**A finding to weigh:** at 1,536 px the worst single surround sample comes much closer to the tolerance (12.9 of 16) than at 2,048 px (2.6). The share within tolerance is still 1.0, and the limit that decides is the share (0.98), so no frame was near refusal. But the margin on that one measure is thinner at the smaller size. The limits are unchanged.

**No real 1,536 px picture is in the repo.** I could not bring picture bytes out of the pane without a download, which needs Chad's permission. The test suite's 1,536 px inputs are the three real 2,048 px frames resized here (`earthview-fixtures/*-1536-derived.jpg`, labelled in `SOURCE.md`). They exercise the code path; they say nothing about EUMETSAT's rendering. If you want real 1,536 px fixtures in the repo, Chad can allow three downloads.

### B10. Approval line (form only; not requested)
`Approve: create Worker mother-earth-evprobe from earth-from-space-rc <commit>, file phase1/evprobe.js sha256 <hash>, compatibility date 2026-10-30, no bindings, no routes, workers.dev off, version URLs off, CPU limit 10000 ms, Workers Logs on, cron */10 * * * *, start <UTC time>, twelve hours, at most 210 requests to EUMETSAT, then delete the Worker`

Whether those requests count as "provider contact" is still Chad's call.

---

## C. Carried forward (your point 5): accepted, to be applied where Stage B and the release table are next written
Not built in this packet: the hub's no-store probe route. When it is:
- Its three runs are described as what they are: **three no-store validations inside the deployed hub module**. Not "in the hub's own isolate beside the other work", not a concurrency result, not a measure of spare memory. A concurrency claim would need a stated, bounded overlap workload.
- It asserts **zero R2 and D1 writes on every path**: success, timeout, missing header, mismatched header, refused frame, internal error. It does not reuse `evFail` (which writes state and a run row); diagnostic `console.log` is kept apart from production data writes.

Release-table wording, accepted as you gave it:
- B1: hosted capacity **not yet established** (the code has run in the Workers runtime locally).
- B8: the gate unset stops **future scheduled entry**, not work in flight and not the manual route. (The hold now stops new manual runs too; nothing stops a run in flight but the fence.)
- Each page suite on **its intended server** (`serve-core-on.py` for the older core-on suites).
- Frame-time meaning: **not established**, rather than unknowable.
- Unpublished objects: retention depends on a later successful cleanup (A7).
- Costs refreshed with hosted CPU and the new operations. Per run the guards add about 6 Class B operations and 1 Class A (the listing): about 26,000 Class B and 4,300 Class A a month at ten-minute cadence, against 10 million and 1 million included (used 20 Nov: 87,220 and 53,090). Expected added cost: US$0.

`docs/concepts/EARTH-FROM-SPACE-RELEASE-READINESS-PROPOSAL.md` carries a note at its head: its section 1.2 (Stage A) and section 2 are superseded by this packet.

## D. How to check
```
node --no-warnings phase1/earthview-hub.test.mjs                 # 294 checks, about 90 s
BREAK=<name> FAST=1 node --no-warnings phase1/earthview-hub.test.mjs   # each of 52 must fail
node phase1/evprobe.build.mjs --verify                           # the probe file is what worker.js builds
node --no-warnings phase1/evprobe.test.mjs                       # 59 checks, about 50 s (SIM=0 skips the window simulation)
BREAK=<name> node --no-warnings phase1/evprobe.test.mjs          # each of 15 must fail
node phase1/evprobe.build.mjs --plan --start <UTC>               # the slot table for any start
NODE_PATH=… node phase1/earthview-ui.test.cjs                    # 79 checks (page unchanged; preview set up through the admin actions)
```
Other hub suites rerun because the hub file changed: history-hub 33, sunface-hub 171, wind-hub 103, dustrgb-hub 174, all passing. No page file changed in this commit, so the header, desktop-overflow and timeline suites were not rerun.

## E. Questions
1. Is copying to new keys at R3 (rather than proving old deletes have drained) accepted as the closure of finding 1, with P4 as its stated limit?
2. Is removing the witness acceptable, given that no guard now reads the state record and key uniqueness does not rest on the counter?
3. `storage busy` ends the run without collecting. Is that the right contention outcome, or should a busy inventory be skipped and the run proceed?
4. Phase 2 is 5 runs a size (30 validations), not 6. Enough?
5. Is validation on six real 1,536 px frames in the pane, plus resized inputs for the suite, enough to let the probe run at that size, or do you want real 1,536 px fixtures in the repo first?
6. The surround margin at 1,536 px (B9): leave the limits as they are and let the probe report, or look at it first?
