# Timeline close-out — three separate review rulings

24 November 2026 · Independent GPT review for Chad

Reviewed the index and three requested items at repository commit **efa8e0d**, TheOneTheOnlyTheChad/mother-earth. The local Mac mirror did not contain this packet, so GPT retrieved the named files and evidence directly from that exact GitHub revision into temporary storage. The packet's base main is 5b3d9ba, including Animals landing 9969bc3.

**Item 1: PASS for the two released fixes. Item 2: PASS for the test-only follow-ups. Item 3: PASS at proposal level; recommend W1. Each ruling is bounded below. Nothing here authorises a release, merge, catalogue upload, hub change or account action.**

## Item 1 — travel record §9: PASS

Reviewed reviews/2026-11-24-timeline-travel-s9-review.md §7, the exact 4913d18 diff, current timeline.js and its travel suite, and the fresh run log.

| Question | Ruling |
| --- | --- |
| 1. Is data-x / data-px a sufficient split? | **Yes.** data-x retains its existing meaning of section-to-expand; rendered mark geometry uses data-px and label layout reads dataset.px. The generic entry handler therefore receives no section value on a mark and stores null. Explicitly ignoring data-x whenever opener is mark would be optional hardening, not a required fix. Preserve the regression requiring x === null for mark opens. |
| 2. Is document.activeElement in the wheel handler acceptable? | **Yes.** Activation remains a separate prerequisite. When wheel zoom is armed but focus is outside the explorer, the handler releases it and returns before preventDefault. Focus on a descendant inside the explorer remains allowed. Releasing silently when focus moves elsewhere matches the accepted interaction rule and does not require another announcement. |
| 3. Is capture-phase suppression of focusout an adequate stand-in? | **Yes for the targeted regression.** It holds the activation state while moving the active element outside, then tests the next wheel's view, prevention and released state. It is not an independent reproduction of every operating-system/background-window transition. Keep that qualification. |

Independently syntax-checked timeline.js and both affected suites. Extracted the actual wheel handler and exercised it with controlled inputs: unarmed/inside leaves scrolling alone; armed/outside releases without prevention or zoom; armed/inside prevents and zooms. Removing the focus guard exposes unwanted prevention for the outside-focus case. This is a source-level handler check, not a browser test.

The current script SHA256 is 55043697559b60d7470261afd88a790d0f07f1599c69165ee697788322d77524, matching the reviewed live-page source identity. The namespace change and corresponding reader are consistent.

Claude's supplied browser evidence reports 209/209 and all 22 deliberate breaks caught, including mark-x-in-state, no-focus-guard and wheel-always. That addresses the previously disclosed break-rerun gap. The OLD=1 control is correctly described as weak: it throws at an absent explorer, rather than demonstrating the specific fixes.

**Close GPT's outstanding §9 code-review item.** No further production fix or rollback is requested.

## Item 2 — test-only follow-ups: PASS

Reviewed reviews/2026-11-24-timeline-changes-ui-followups.md §5 and the exact changed test file.

| Question | Ruling |
| --- | --- |
| 1. Do the PREV conditions meet the request? | **Yes.** They require a nonempty string distinct from CUR, equality with catalogue release.previous, an existing previous catalogue file and that file's matching catalogue_revision. PREV is used for the unpinned current pointer and generator fixture copying. REV remains R2 for the historical change record. |
| 2. Is bypassing only the unpinned guard half the intended control? | **Yes; it is more focused.** It permits the deliberately wrong unpinned fixture while retaining the pinned-hash safeguard. The compatibility case must then distinguish pinned/missing-object 503 from unpinned/unknown-revision 404. |
| 3. Keep previous-drift? | **Yes.** It directly covers the new prerequisite. Require its own previous-revision-check message, as the packet does; an unrelated crash is not a successful break. |

Independently applied the exact supplied diff to the prior reviewed test file. It reconstructs the downloaded candidate exactly. Count confirmed: **+17, −4**, not +18, −4. Correct the two stale +18 descriptions in the index/item-2 record when filing; no code change is needed for that correction.

Candidate test-file SHA256:
1b6a89f847f4382a38860e940142a71a68e5d8bf91db49482327f79854c18e30

Executed the actual PREV guard independently with the valid case and nine invalid controls, including missing/empty/current/mismatching values, absent fixture data, wrong catalogue identity and previous-drift. All invalid controls stopped with the intended message.

Executed the actual fixture-construction block: normal construction preserves the pinned source and removes the current revision from the unpinned source; unpinned-is-pinned triggers the intended guard; the half-bypass allows that wrong fixture; deliberately damaging the pinned hash still triggers the retained guard under the bypass.

Claude's supplied results remain 173/173 before and after, all 14 older breaks failing, both new guards rejecting their intended faults, and the half-bypassed control failing exactly the intended compatibility case (172/173). Animals 280/280 and hub-alignment 6/6 are consistent with the limited changed-file scope.

**Close the two commissioned test follow-ups.** This review does not itself authorise their landing.

## Item 3 — date-label proposal: PASS at proposal level

Reviewed docs/concepts/TIMELINE-DATE-LABEL-PROPOSAL.md.

**Recommend W1:**

> Revision tl-2026-11-R3, released 24 Nov 2026 · What changed

That correctly attaches the date to the content/catalogue revision. The old wording can misdescribe a presentation-only release because it implies the date is the page's most recent change.

Keep the catalogue release date, per-entry evidence-review date and code/layout change history distinct. No new code-change date is required. Preserve tl-updated and the time element. W2 is acceptable but less precise; W3 adds unnecessary date machinery for this issue.

A wording-only implementation needs no catalogue-byte change, new revision id, storage upload or hub deploy. It still needs Chad's build/release decision and review of the resulting page-only candidate. It can be its own small maintenance release when Chad wants, or be bundled with the next planned page change; timing remains his decision.

**Animals coordination:** update the comparison baseline for the changed page within the same reviewed delivery. Do not require a commit to embed its own hash or its not-yet-created merge hash. One workable sequence is a reviewed page-change commit H, then the test-maintenance commit pinning H, followed by integration verification that the released Timeline files equal H. Coordinate the baseline comment/identity with the Animals owner. An alternative post-merge pin update must explicitly account for any temporary failing-suite interval. Do not arbitrarily advance TL_MAIN to hide unrelated changes.

No implementation is authorised by this proposal pass.

## Evidence and remaining limits

Verified all eight entries in the supplied SHA256SUMS. The downloaded R3 catalogue remains 31,636 bytes with SHA256 f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993. Worker remains 551,400 bytes, db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5.

GPT did not rerun the full Playwright browser suites or their browser breaks. Those remain Claude's workspace evidence; GPT's independent checks were source/diff/hash verification, syntax checks and extracted guard/handler controls. No production account was accessed.

The supplied story-ui log records 127/127 using fixture images, with no-image and image-failure cases at 1280 and 390 px. Accept that as bounded desktop Chromium fixture coverage. It is not a real phone or independent live-page failure test. The live released entry has an image, so the absent-image fixture does not imply a missing production feature.

Real phone, Safari, screen reader, true 200% zoom and the separately recorded live-image-failure check remain open. These limits do not reopen the two code/test findings closed above.

Corrected release identity remains page merge 19f4e07, R3 catalogue, hub 0.6.24. Source refresh followed by the bounded Human relatives proposal remains the next feature sequence after Chad settles this close-out. Earth from Space Stage D remains uncleared.

