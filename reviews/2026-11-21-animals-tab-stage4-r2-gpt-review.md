# GPT focused review: Animals tab Stage 4 MVP revision 2, code `4aa5c00` (as relayed by Chad, 21 Nov 2026): corrections A and B CLOSED; performance criterion NOT MET; private-preview exception recommended

Filed as received (the attached file, unchanged below the line). GPT's text, not Claude's. Not Chad's approval of anything. **Chad's own decision, sent in the same message (his words):** "Accept Stage 4 r2 at `4aa5c00` as the private-preview checkpoint with the recorded performance exception. The 500 ms task criterion remains NOT MET; close-view motion is about 20 fps; the extreme following-load observation remains unexplained. Keep these in the handover. No merge, deployment or public release."

---

Animals Stage 4 MVP revision 2 — focused independent review

21 November 2026. GPT → Chad and Claude.

Code supplied: animals-tab-rc 4aa5c004dcccc4678674b276668327bc779485fd.
Head supplied: 28734df0971ccccec85763012279edbb289a8215.
Packet SHA256 independently matches: 0e43a910ea483fb877a3b8fd6e380f173d885d8bc60d53031517add1e2a36c64.
Local tree: /Users/chadobie/Documents/Mother Earth/_review/animals-tab-stage4-r2-4aa5c00.

Verdict: corrections A and B CLOSED. Functional review satisfactory for this private-preview checkpoint; no new functional hold found. Performance criterion remains NOT MET in the submitted measurements. Recommend Chad accept an explicit private-preview performance exception, rather than require optimisation before this checkpoint. This is not an unconditional within-budget candidate PASS and not merge/deployment/public-release clearance.

Independent scope and results

Read read/index.html, the complete r2 packet, Mac measurement record and script, regression/break records, both follow-load outputs, page/config diff, and relevant Retry tests/handlers. All 13 hashed files in the packet table match; the packet itself matches too. Local export has no Git metadata, so commit identities remain supplied.

Ran the builder suite with the pinned source archive: 35 passed, zero failed, real-input part run. One repository-tracking check is unavailable in this export; that accounts for 36 versus 35. The source test performs three-output byte-identical rebuild and --check. Display geometry SHA256 unchanged at 1462eae8dcc554f01b2dd86068d3ed0100e25f2a71a0862e0f77792aaca0ea40. Prior independent all-48,589-vertex inverse-projection match and accepted source-specific no-contact geometry method carry forward; no need to redo unchanged geometry.

Claude's full corridor 61 / combined 277 / census 71 and older-page regression totals, plus 14 relevant deliberate breaks, remain his execution evidence. GPT inspected the final totals, the initially missed break/repaired-check/rerun record, and the new focus assertions; GPT did not independently rerun the browser suites or all deliberate breaks. Unaffected breaks need no blanket rerun.

Direct Chrome checks on Chad's Mac, own tab at localhost:8911/animals.html:

Revised Medium label, attribution and nesting caveat are visible beside the globe.

Corridor renders and responds to direct pointer drags, alone and with zebra selected; both switches remain on and replay remains available. This is direct input through the browser tool, not a human's hand-drag or quantitative frame benchmark.

At 390×844 after reveal settles: no horizontal overflow; focus on cor-tgl; globe about y8.24–428.24; nesting caveat y586–653 and omission notice y656–707 are visible in the first screen.

With the journey also on the complete legend extends to about y882, below the 844px viewport. Supporting reference text requires scrolling; the class labels, discrepancy warning and omission notice fit. Acceptable for the MVP; no new layout hold.

Temporary viewport reset, own tab closed, user server left running. No other tabs, source files, production or Earthview operations touched.

The direct pass did not force error/delayed responses or independently reproduce the Mac benchmark. Retry closure relies on code/test inspection and Claude's executed held-response suite; no claim that GPT directly exercised those paths.

A. Medium wording — CLOSED

The label no longer assigns an unsupported percentage to the full Medium polygon or visible difference band. High's threshold is attributed to the source. The beside-globe text explains the nested geometry and conflicting metadata wording; the detail retains literal definitions. Full Medium area and Medium-minus-High difference have distinct labels. Rule 27 prevents reusing this nested-only wording for a non-nested result.
Manifest/catalogue rebuild and script pin are verified by the executed source suite. No new enquiry or proposal cycle needed.

B. Retry focus — CLOSED

Both Retry controls retain the initiating focus through loading/success/failure. aria-disabled prevents repeat action without removing focus. Controls disappear only once focus leaves and they no longer apply. The handlers and inspected held-response tests cover geometry Retry in motion/reduced-motion phone and desktop paths, and record Retry. Focus retention is no longer replaced by focusing the switch.
Real-device Safari and screen-reader behavior remain unverified; do not upgrade Chromium evidence to those claims.

C. Performance assessment

First draw

Claude's recorded verified-data-in-memory -> first-render figures: median 636 ms, worst 733 ms across seven warm redraws. These meet the 1,500 ms limit for the stated procedure.
The script checks both classes' filled geometry, waits for GPU completion and reads distinguishing pixels. This is stronger evidence than a shown-status timestamp. They remain Claude's measurements, not independently reproduced here. They are warm redraws after an initial load; the initial switch-on-to-shown 802 ms is separate information.

Main-thread task

Recorded 474–689 ms, six of seven over 500 ms: NOT MET; do not change the limit or relabel it PASS.
Measurement caveat: renderer.render is wrapped with scene traversal, gl.finish and pixel reads in the observed draw task. These add work/synchronisation; pixel reads occur after the first-frame timestamp but may still contribute to that task's duration. Therefore the figures establish an overrun for the instrumented procedure, not an isolated measurement of the uninstrumented application task.
This caveat does not prove the application meets 500 ms and is not a reason to erase the failed result.

Recommendation: accept the reported pause as a private-preview exception if Chad chooses. No rendering rewrite or profiling is required to finish this private-preview checkpoint. Before a public-release performance claim, use a clean task measurement with heavy geometry/pixel validation outside the measured interval or a profiler trace, and profile/optimise as necessary. Do not assume a fix requires changing source geometry or simplifying vertices.

Close-view frame intervals

The render wrapper is restored before the orbit section; the camera is then driven by script. Recorded median 49.9–50.0 ms, worst 83.3 ms corridor-only or 66.8 ms with zebra, versus a 16.7 ms median with nothing on. About 20 fps close up, with whole-globe results near 60 fps.
No frame threshold was agreed. Accept as a disclosed private-preview limitation; do not invent a retroactive 60 fps gate. Direct pointer drags worked in this review, but that is a qualitative check, not proof of smoothness, phone performance or the cause of the frame cost.

D. Slow following-page load

Yes: the 31–36 s extreme may remain an unexplained test-machine observation for this private-preview checkpoint. It was seen once across the supplied three full runs and not in eight targeted suite-sequence repeats. Cause is unestablished; do not label it fixed, harmless, unrelated or solely a software-renderer defect.

Retain the repeatable smaller cost too:

Targeted software sequence: next DOM ready about 2.0–2.6 s after corridor, versus 0.36–0.44 s journey-only controls.

New tab with old corridor tab still open: globe-ready about 13.5–14.8 s versus roughly 3.2–6.0 s in the supplied controls. This is a real observed slowdown on that setup, not just the rare extreme.

Some closed-context results also remain slower; “no clear difference” must not become a general claim that closing the old page eliminates the cost.

Mac's one reload reading per state: DOM 184 ms versus 96 ms; load 252 ms versus 248 ms. Small sample, no Mac globe-ready measure; does not rule out rare freezes or slower devices.

Keep the investigation open for release/performance work, without blocking this private-preview checkpoint on reproducing the extreme.

Decision and exact next step

Recommend accepting this Stage 4 checkpoint with a private preview only performance exception. Chad's original build-go did not automatically waive the 500 ms budget, so GPT's recommendation is not his acceptance.

Suggested concise decision if Chad chooses:
“Accept Stage 4 r2 at 4aa5c00 as the private-preview checkpoint with the recorded performance exception: the 500 ms task criterion remains NOT MET, close-view motion is about 20 fps, and the extreme following-load observation remains unexplained. Keep those in the handover. No merge, deployment or public release.”

Once Chad makes that choice, record functional closure + accepted preview exception, not “all criteria passed.” No code change or suite rerun is needed merely to record the decision. The unchanged passed stages remain carried forward within their scoped evidence.

Public-release source/REGISTER/sensitivity decisions and device/accessibility/performance limitations stay separate. Snyder K3(b) remains not done with the previously accepted independent projection substitution; missing mobile-pass/key-drawn-ui fixtures remain not run.

