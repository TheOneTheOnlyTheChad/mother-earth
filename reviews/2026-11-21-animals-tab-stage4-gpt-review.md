# GPT candidate review: Animals tab Stage 4 MVP, code `379cf18` (as relayed by Chad, 21 Nov 2026): BOUNDED HOLD

Filed as received (the attached file, unchanged below the line). GPT's text, not Claude's. Not Chad's approval of anything. Chad's message also carried GPT's short summary: geometry narrowing accepted; label Medium neutrally and disclose the metadata and nesting discrepancy beside the globe; keep focus on the initiating Retry control; supply the Mac drawing and frame measurements, investigate the slow following-page load, complete the final regression; hand over now with this checklist if the thread is full.

---

Animals Stage 4 MVP — independent candidate review

21 November 2026. GPT → Chad and Claude.

Verdict: BOUNDED HOLD on candidate 379cf18. Browser review is now completed within the limits below. The data/geometry approach is acceptable for this pinned MVP; wording and Retry focus need correction, and the performance/final regression evidence is incomplete. No new proposal round or general geometry engine is requested. No merge, deployment or release clearance.

Code supplied: 379cf18b416d389bc3516d8c1c53a0e68f9708f3, animals-tab-rc; packet head supplied e6b0eb3.
Mac review tree: /Users/chadobie/Documents/Mother Earth/_review/animals-tab-stage4-379cf18.
Packet: reviews/2026-11-21-animals-tab-stage4-rc.md.
All twelve packet file SHA256 values independently match. Export lacks Git metadata, so commit identity remains supplied.

This completed review supersedes the access limitation in ANIMALS-STAGE4-379CF18-INTERIM-REVIEW-2026-11-21.md. The interim's detailed data/code findings carry forward.

1. Independent checks completed

Read the shared Animals handover/status entry, full packet, geometry module, builder, relevant test logic and page script.

Real-input builder suite: 33 passed, zero failed, part 3 run. Git-tracking check unavailable in the exported copy. Exact three-file rebuild and --check pass.

Separate shapefile reader and inverse-projection calculation using monotonic authalic-q bisection: all 48,589 rounded vertices match the committed display rings exactly, including closing vertices. Zero rounded-coordinate mismatches. Maximum pre-rounding residual 0.499996103 of one coordinate unit.

Executed exact-area strip checks agree with the supplied builder on source and output and support nested geometry.

Direct Chrome preview at localhost:8899/animals.html, in GPT's own tab. All journeys and corridor initially off. Corridor switch draws both classes, labels/grid and scale; omission text visible.

Direct responsive DOM overflow checks: 360, 390, 720, 900, 1100 and 1280 px: zero horizontal document overflow in the tested corridor-on states. These are layout checks, not blanket accessibility passes.

At 390×844, normal cached switch-on reveals the globe after its smooth scroll settles: globe top about 8.24 px, bottom about 428.24 px. Focus remains cor-tgl; visible legend fits below it and includes the omission notice. An immediate mid-animation position was not mistaken for a failed reveal.

Zebra and corridor can remain on together. Switching corridor off leaves zebra selected and replay visible; switching back on and going to corridor leaves zebra on. The corridor go-to displays the bounded “journey remains on” message.

Direct globe drag leaves both switches on, clears the view-status line, and the scale is hidden in the observed moving/settling state.

Visually, the two classes and reference grid can be distinguished. The whole-globe image is blurred at this scale and the page discloses it.

Not independently exercised in this direct browser pass: forced delayed/error responses, Retry paths, reduced-motion emulation, graphics-context loss, numeric scale accuracy, every hole's rendered triangles, frame benchmarks or full automated page suites. Claude's reported 55 corridor checks/16 breaks and other suite results remain attributed to him. The source suite execution and projection comparison above are GPT's.

Own browser tab closed; temporary viewport reset. Chad's server left running; no other tabs or processes touched.

2. Accepted MVP departures

No-contact geometry narrowing: accepted for this pinned source. The builder rejects every cross-class boundary contact as unresolved before classifying complete filled areas from signed ring containment/intersections. Holes participate. This is a sound conservative source-specific restriction, unlike rev 2.1's inadequate component-point rule. Keep it explicit and retain contact fixtures as unresolved stops. No need to build the general arrangement for this MVP.

The independent strip calculation is in the test/preflight, not build() itself. Report it accurately, and run it alongside rebuild/check. Do not claim that the builder independently performs two calculations.

Projection evidence: Snyder's printed worked example remains not done. For this bounded MVP, the independent complete-data bisection comparison plus externally supplied metadata bounds is sufficient to continue without making the printed example a separate blocker. Record the substitution; do not mark K3(b) completed.

C-D4 B is Chad's existing selection: no regional image, no new image lifecycle. No restatement or fresh build approval is needed for the previously authorized candidate work.

Different fill/outline colours and labelled swatches are acceptable for this MVP despite the one-pixel outline limitation; no heavier-outline implementation is required before closure.

3. Required corrections

A. Medium class wording

The geometry establishes that Medium contains High. It does not establish a replacement numerical threshold, nor prove that the source's “10–20%” attribute definition accurately describes the visible Medium-minus-High band.

Do not silently change Medium to “10% or more,” and do not justify the 10–20% claim merely because High is painted above it.

Use a neutral main legend label, for example:
“Medium — published source class (includes High).”
High may retain its source-backed threshold, clearly attributed to the source.

Put the nesting explanation beside the globe legend, not only down in the card. In the detail, retain the layer's literal attribute definitions and explain that its Medium geometry contains High despite the 10–20% text. Keep full Medium polygon area and the computed Medium-minus-High difference clearly distinct. This is honest disclosure of the available source evidence, not a new enquiry requirement.

Rebuild manifests and repin the catalogue/script chain after wording changes.

B. Retry focus

Code inspection confirms cor-retry explicitly focuses cor-tgl and then disappears on loading. The accepted contract says focus stays on the control used. cor-facts-retry also disappears during its load.

Keep the initiating Retry control present and preserve its focus through loading/success/failure, or implement equivalent tested focus preservation consistent with the agreed interaction. Avoid hiding/removing the focused control in the asynchronous path. Retest held responses and the phone/reduced-motion paths. The normal switch-on focus path passed the direct browser check; that does not clear Retry.

4. Evidence needed before closure

Mac performance

Measure the agreed metrics on Chad's Mac:

verified display data available in memory -> first rendered frame actually showing both classes;

longest main-thread task over that draw;

median/worst frame interval over a five-second orbit, corridor alone and alongside a journey.

Compare a no-corridor control with a corridor-plus-journey then navigation/reload sequence to investigate the reported 32–36 s following-page load. Report remaining uncertainty. Ordinary responsiveness during this review does not resolve that report.

Keep the agreed first-draw <=1,500 ms and main-task <=500 ms acceptance limits. Software switch-on-to-status timing is not the same measurement; do not claim the budget is met from it or silently loosen it.

Final regression

Run the combined-page suite on the final corrected tree. The earlier 275/277 plus corrected sections is useful evidence, not a final full-tree pass. Repeat deliberate breaks affected by the actual changes; unchanged unrelated break sets need not be repeated merely for paperwork.

Supply appropriate prior-page/layout regression evidence for shared style.css changes, including the changed Animals grid-row arrangement. Missing mobile-pass/key-drawn-ui fixtures remain not run. Real-device phone/Safari/screen-reader evidence remains unverified.

No whole unchanged source audit or proposal cycle is requested. Data rebuild checks and relevant wording/focus/page tests should target the actual fixes.

5. Disposition for Claude's handover

The current Claude thread may hand over immediately with this exact candidate and checklist. Next thread should make the wording/focus corrections, collect bounded performance/regression evidence and return a new candidate packet. Keep Stages 1–3 passes scoped to their reviewed bytes and recheck shared interactions in the combined tree.

This review does not authorize sources/REGISTER publication, sensitivity decisions, page release, production changes or any Earthview operation. Hub 0.6.19 in the pasted Animals handover is stale: the shared HANDOVER records the separate 0.6.21 deploy. No fresh live-hub audit was performed.

