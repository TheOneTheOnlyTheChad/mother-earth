# GPT's review of the Animals corridor cost candidate `62121d1` (BOUNDED HOLD)

GPT's text, relayed by Chad on 21 Nov 2026 and filed by Claude unchanged except that the Mac home folder in one path is written as `~`. It is GPT's review, not Chad's approval.

```
Animals corridor performance — candidate review of 62121d1
21 November 2026. GPT → Chad and Claude.

Supplied branch/head: animals-perf-rc 62121d1; code db75087.
Mac export: ~/Documents/Mother Earth/_review/animals-perf-rc-62121d1
Packet/read-copy SHA256 both match:
8be29ed617409de782a51f931188199ed37c6132c912fcc976a151f9b2b619da

VERDICT: BOUNDED HOLD on premature completion, followed by served-tree Mac confirmation. Diagnosis and optimisation direction accepted. Keep the two-stage strategy; do not revert to the one-stage variant merely to avoid this correction. No merge/deployment clearance.

INDEPENDENT REVIEW SCOPE

Read the packet, actual corridor/globe scripts, clean measurement and decomposition scripts, profiler runner, three retained workspace JSON evidence files, relevant tests/break definitions and the page script references.

Recorded exact candidate hashes:

animals-corridor.js:
292f9693f083a477c4ce5993f0f3ad94da8205b82fda6baab41f552c3aa265ff

animals-globe.js:
3a7ba3cb645030b4bc4ee79db16d860a9e698693962edc0a39852748e6bd9494

animals.html:
e8caad573138deffed04ad1e5e35815566a39012f73752969bc5d485eba71629

phase1/animals-corridor-ui.test.cjs:
4a222ded79597e8670b010f483678aa7f53ff968ebc0e727c7576c69d001d634

mac-clean-measure.js:
36169b5796111bddaa772b93e09f098e40e4e49c03feb27cc0dee528f986f0df

All 15 Animals assets have the hashes of the released package, including all six display files, manifests and three lists. Prior source/data validation carries forward. Local main and the former release export were not suitable comparison sources in this session; comparison uses the previously recorded released hashes. Commit identity remains supplied, not verified from Git metadata.

Executed a small independent Node harness using the candidate's actual finish()/draw() function text, a stub globe and controlled timers. This independently demonstrates the completion defect described below. It is a lifecycle/code check, not a real-library rendering or timing test.

Claude's 68/277/71 suite results, deliberate breaks and Mac timings remain his. GPT did not rerun those suites, operate a candidate browser, or execute Mac benchmarks for this review.

1. DOES THE EVIDENCE IDENTIFY THE COST?

Yes, sufficiently to justify this focused change, with bounded attribution:

- Clean switch-on observation adds no render wrapper, pixel read or GPU finish to its timed drawing window. Returned over 500 ms records demonstrate that the previous instrumented failure was not solely measurement overhead.
- Mac callback attribution identifies the library timer; workspace sampling summaries identify polygon construction/triangulation and outline work. Separate controlled options support side-wall and outline costs.
- The reversible pointer-on/off/on experiment, with unchanged drawn geometry, strongly identifies pointer intersection as the dominant close-view bottleneck in that tested state.
- Scale-bar screen-point queries are a separate, much smaller repeated intersection cost.

Describe the 130/150/320 ms decomposition as approximate experimental differences, not exact additive or universal costs. Say “dominant tested close-view cost is pointer hit-testing,” rather than asserting rendering has zero cost.

The arithmetic loop only shows that particular math workload was slower on the Mac. It does not diagnose Low Power Mode, battery state, general machine performance or a malfunction; no OS investigation is required to proceed.

Missing observation records are not passing zero-duration tasks. The Mac readings are Claude's reported records; raw Mac per-run telemetry is not included among this export's retained JSON files. The three JSON files are workspace runs/summaries, not Mac runs.

2. IS STAGED HAND-OVER ACCEPTABLE?

The staged strategy is acceptable; the current completion behavior is not.

The short Medium-only intermediate image is acceptable as an explicitly incomplete draw: it is genuine source geometry, and Medium contains High. No atomic/offscreen double-buffer architecture is required.

However finish() immediately sets status=shown, paints the final legend, offers go-to, and announces “areas shown” before High is even handed to the library. The first timer later sets both=true when calling polygonsData(feats), not when High's meshes have been built/rendered.

Independent harness output:
- Before the High timer: status shown; both false; only Medium handed over; completion announcement already issued.
- Immediately after that timer: both true without any library readiness/render acknowledgement.

Check 10a explicitly requires this premature shown state, so 68/68 does not establish a sound completion contract.

Required focused correction:

- Keep the user-facing state as loading/drawing while the result is partial. The legend may show the intended classes as a key, but must clearly identify that drawing is incomplete; do not claim both are already shown.
- Publish shown and its completion announcement only once both classes' actual filled geometry is ready and has reached a rendered frame, using bounded observation of the pinned renderer or another reliable completion signal.
- Do not treat a 20 ms delay, a setter call, an unqualified rAF, or the current both flag as proof of built geometry.
- Gate the raycast exclusion on the actual new objects being present too. A second 20 ms timeout is not an acknowledgement that High's meshes exist.
- Keep scale and other “ready” presentation consistent with that completion. Preserve press-time phone scrolling; no response/stage may scroll the page.
- Preserve current-action camera cancellation through both stages. If deferring a move to final readiness, a later gesture/journey/go-to must still cancel it.
- A failed/stalled second build must stop as failure rather than remain shown with Medium only. Use a bounded completion wait; cancellation must clean up its timer/observer.
- Recheck off, off/on, lost graphics context and pagehide during the staged interval. Define cancellation/restoration for a partially built view without stale work restoring it.

Add tests that hold High's actual build/first rendered frame after the setter: state/announcement must remain incomplete until released. Also cover a High build that never completes and stale completion after cancellation. Update 10a; add a deliberate break that restores premature completion. Tests may stretch the stage to make it observable but must distinguish “data handed over” from “mesh/frame ready.”

This correction does not require more source points, geometry simplification, a new feature or a general rendering framework.

3. IS DISABLING POINTER HIT-TESTING IN ANIMALS-GLOBE.JS ACCEPTABLE?

Yes for the current Animals page.

Only animals.html loads this Animals globe module in the inspected page set. The inspected current Animals scripts have no globe hover/click feature that depends on that pointer picking; journey markers/trails/fixes already suppress their raycasts. Camera controls are separate.

Retain direct drag, wheel/pinch zoom and journey replay/go-to regression checks after this shared-module change. This is Animals-only permission, not a recommendation to disable World View's picking/search/inspection.

Removing fully transparent polygon side walls is appropriate; retain top/outline, holes and High-above-Medium tests.

Excluding corridor objects from the scale query is reasonable. It depends on pinned library internals (__globeObjType and child objects), so keep the actual-object regression, including High after the second build and after off/on. Limit mutation to corridor-owned objects; currently polygon/path layers belong to this module. The globe surface and journey/coastline objects must remain usable and unmodified.

4. MAC CONFIRMATION NEEDED BEFORE AN APPROVE LINE

After the focused correction and relevant suites/breaks pass, serve the exact corrected review tree locally. Do not use rewritten live-page documents with inline candidate scripts for final confirmation.

One bounded confirmation session on the actual Mac is enough:

1. Record tree/file hashes, browser/GPU, viewport/DPR, imagery/fallback state, and visibility/focus during the runs. Keep the Mac awake and the tab active; Chad need not manually click every measurement.

2. Short nothing-on control and 5–7 complete candidate redraw observations, with verified data in memory. Retain raw per-run JSON, including missing/invalid runs and capture-health evidence. Do not count missing records as zero-task passes.

3. Clean longest task remains <=500 ms. Separately measure verified-data-in-memory → first frame containing BOTH complete classes, including the second stage, against 1,500 ms. Heavy pixel/geometry validation can be outside the clean task timing or in a separate corroboration run.

4. Five-second close-view frame intervals for nothing-on, corridor, and corridor plus one journey. Report median/worst and long tasks; no new frame-rate threshold is invented. Verify the restored near-baseline behavior.

5. Direct pointer drag/zoom and journey replay/go-to; off/on and interruption during partial draw; scale disappearance during motion and correct surface-distance scale after stable completion. Retain numeric scale/hole/top-order checks from the suite.

The clean script's diagnostic section deliberately turns pointer interaction back on. Treat that as a temporary experiment; reload before assessing the final candidate's normal interaction/performance. Do not contaminate a confirming run with leftover experimental state.

No second full Mac sampling-profile project is required merely to confirm this candidate. Existing attribution plus clean served-tree measurements is sufficient if they are complete.

BOUNDARIES

The 31–36 s following-load issue was not examined by this work; keep it open, not fixed by implication. Phone/Safari/screen-reader limitations remain. No performance exception or public Source limitation should be erased until the confirming evidence is reviewed and its exact scope recorded.

Keep the Earth from Space pane/page-merge restrictions. No Worker, hub deploy, observation caller/claim, production asset or source data was touched by this review.

NEXT: focused completion/readiness correction on animals-perf-rc; return candidate with relevant tests and bounded served-Mac confirmation. No new proposal cycle.
```
