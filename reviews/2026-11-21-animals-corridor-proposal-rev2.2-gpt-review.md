# GPT closure review: Animals East Walker corridor proposal rev 2.2, and its MVP recommendation (as relayed by Chad, 21 Nov 2026)

Filed as received (the attached file, unchanged below the line). GPT's text, not Claude's. Filed on the build branch with the Stage 4 packet; the earlier reviews of this proposal are on `animals-expansion-proposal`. Not Chad's approval: his own build go is quoted in the Stage 4 packet.

---

Animals — East Walker corridor proposal rev 2.2: closure and MVP recommendation

21 November 2026. GPT → Chad and Claude. Docs only.

Supplied branch/commit: animals-expansion-proposal, affa130bd574d14dbc1ef84369c7f76b33afb766.
Independently verified local proposal text SHA256: 6caba6bf86b5654120b113569673e86d3b63262ad92ff4828b611baae010f83b.
Read the full revised §5.4, builder criteria including K1/K1b, and §14. Earlier unchanged proposal findings carry forward. Commit identity remains supplied, not independently verified from Git metadata.

PASS at proposal level. The remaining geometry hold is CLOSED. The proposal is clear to go to Chad for decisions. This is not a candidate implementation pass or implementation/merge/deployment/release authorization.

Closure

§5.4 now classifies complete filled areas using A(M), A(H) and their intersection I. Arrangement faces include holes and all boundary contacts, so membership is tested only on regions where it cannot change. Bands requires I = 0. Nested requires I = A(H) and A(H) < A(M). Other relations stop as mixed. Incomplete or contradictory evidence stops unresolved; neither tolerances nor repair manufacture a pass.

The two rev 2.1 counterexamples are explicitly required with the correct intersection areas: shared-edge rectangles 40,000 m²; High covering the Medium hole 120,000 m². Crossings, hole occupation, partial components, point/edge-only contact and source/output changes are covered. K1b supplies a second area calculation. This closes the contract gap.

The previous phone-reveal closure and accepted clarifications carry forward. No further proposal hold found.

Implementation details to get right in the candidate

These implement the accepted exact-area contract; they are not additional proposal holds or features:

Rounded input vertices are integers, but segment intersections and face areas can be rational. Do not round newly computed intersections back to whole numbers.

The independent horizontal-strip calculation must account for every height where boundary ordering changes, including segment-intersection heights, not merely original input-vertex heights. Equivalent exact integration that handles those changes is acceptable.

Face construction must handle disconnected boundaries, holes and coincident segments. A matching total area alone is not proof against cancelling omission/double-counting errors; the face membership evidence, known fixtures and independent exact area comparison work together.

Use bounds/spatial pruning or other appropriate implementation choices if necessary. Exact arithmetic does not require comparing every pair in a naive quadratic loop.

Actual real-source validity, classification, rounded geometry, performance and rendering remain unmeasured. A mixed or unresolved result stops for review. The source's result must not be guessed from the names Medium and High.

Recommended MVP decision

Given Chad's request to finish a bounded MVP, recommend:
C-D0 yes; C-D1 A; C-D2 A; C-D3 A; C-D4 B; C-D5 A.

This deliberately chooses the proposal's existing B reference-context option: labelled latitude/longitude lines and a valid scale bar, without the regional satellite image. Retain the existing whole-globe backdrop behavior and its honest close-view/fallback wording. Regional imagery can be a later change.

This removes the regional request/decode/retry lifecycle and image-specific tests from this implementation's scope; keep the relevant globe/backdrop, geometry, phone interaction, coexistence, layout and scale checks. Record the explicit B selection in the packet rather than claiming the A proof passed.

Keep all vertices, source pins, geometry validation, omission notices, attribution and the complete-area relation checks. These protect the meaning of the displayed source and remain part of the MVP.

Suggested ordinary build-go line for Chad to send, if he chooses this:
“Go: corridor Stage 4 MVP on animals-tab-rc. C-D0 yes; C-D1 A; C-D2 A; C-D3 A; C-D4 B (labelled lines and scale only, no regional image); C-D5 A. I know the derived corridor files committed to the public branch will be publicly downloadable, though not on the live site. Build for GPT review only; no merge, deployment or live release.”

That line is a recommendation, not approval inferred from Chad's request for this review.

Bounded execution and handover

After Chad's go, run the source and rounded-geometry preflight first. If mixed, unresolved, invalid or over budget, report the exact result and hand over; do not repair or loosen limits to finish. If it passes, implement the selected B scope and return the candidate with the appropriate regression evidence and measured Mac drawing performance.

Thread capacity is a reason to make a clean checkpoint and handover when needed, not to skip checks or promise the current Claude thread must finish everything. A completed geometry preflight plus exact files/hashes/results is a useful handover checkpoint if capacity is already tight.

Nothing built, merged, deployed or sent by this review. Earthview callers, claims and observations were untouched.

