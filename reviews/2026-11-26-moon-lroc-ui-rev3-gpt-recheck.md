# Mother Earth — LROC UI preview rev 3 recheck

26 November 2026 · GPT independent reviewer

Supplied branch `moon-lroc-ui`, head `ef479e4`; validated tree `02d2f4a`; readiness fix `f4599d6`. Reviewed the refreshed Mac preview code, packet, test additions and break log.

## Verdict

**PASS for the R1 startup-readiness fix. The prior startup hold is closed.** Recommend proceeding to release-candidate preparation on Chad's go, including the bounded control-availability fix below. No merge or deployment is cleared. The final release candidate must remain operable when the globe fails; a reload-only close path is not acceptable final behaviour.

There is no need for another separate preview round solely for relocating the existing toggle: include that small fix, its focused tests, Sources/REGISTER/manifest and pin maintenance in the RC, then return the exact RC for release review.

## Independent verification

Ran the actual refreshed `moonlroc.js` in a separate Node VM harness with mocked DOM/image/globe boundaries and controlled readiness, failure and clock progression. Five paths passed:

1. **Delayed readiness:** no early turn; when ready, exactly one successful turn and one locator; polling stops.
2. **Off before readiness:** no later turn or locator; polling stops.
3. **On/off/on before readiness:** only the current activation performs one turn and one placement.
4. **Globe failure:** locator becomes unavailable; polling stops; later readiness does not turn the camera.
5. **Deadline expiry:** locator becomes unavailable; polling stops; later readiness does not turn the camera.

These are deterministic code-level checks, not new browser timing measurements. Inspected H1–H10/H7a and the supplied mutation log; Claude's reported 67/0 and 19 mutation catches remain his browser-suite evidence, not a claim that GPT reran that full suite. No new data fetch or broad regression run performed by GPT.

The code now defers the camera turn and locator placement into the same guarded entry operation, and invalidates/stops that operation on off. Image loading remains independent. This answers the reproduced defect.

Verified **all 17 actual files** listed in the refreshed review checksum file. Images, source record and builder remain at the hashes reviewed previously. One checksum-list entry is spurious: `./SHA256SUMS.new` (the empty-file SHA) is listed but does not exist. Remove that generator-temporary entry when refreshing the review packet; do not fabricate an empty file merely to make the check pass. This does not affect the 17 matching candidate/evidence files.

## Required RC follow-through: keep the detail toggle available

The existing `moonglobe.js` failure path hides `mg-ctl`, which currently contains the LROC toggle. A detail panel opened before that failure remains displayed, but its only off control becomes hidden. This is a real usability/focus defect in the combined new feature, even though the code that hides globe controls predates LROC.

**Recommended bounded fix:** move the existing LROC toggle outside the `mg-ctl` block into the detail section's own persistent controls, so it stays visible when globe-specific controls are hidden. Reuse the same button, handler, state and focus target. Do not duplicate ownership or change the core globe failure behaviour. This also makes the standalone dated picture accessible when the globe fails before it is opened, which is consistent with the panel not requiring WebGL.

Required focused checks:

- Globe failure **before** opening: the detail control stays visible and keyboard-operable; detail opens with locator unavailable, then closes without reload.
- Globe failure **after** opening: pictures/radios/retry stay usable; the visible toggle closes the panel, clears pending work/locator and receives focus.
- Off during readiness wait still prevents any later camera move or locator; image late-answer safeguards still hold.
- Normal opening, styling/narrow layout and the existing state/visibility behaviour remain intact.

An independent panel Close button with a visible focus destination would also solve the trap, but moving the existing toggle is simpler and avoids redundant controls. Do not automatically discard a working image merely because its locator cannot be drawn.

## Accepted choices remain

- HTML locator with live-camera geometric visibility, pointer-event exclusion and Earth-view hiding: accepted.
- Area JPEG tolerance ≤6 grey levels for this display image, site ≤3, with the exact source/mask/provenance checks: accepted.
- Unchanged WebGL draw counts are not a measurement of unchanged HTML layout/CPU work; carry the qualification.
- Byte-identical builder claims apply only to the pinned encoder environment. Keep skipped comparisons explicitly labelled rather than describing another-encoder run as a byte-identical rebuild.
- Missing mutation patterns/setup faults and one-off harness stalls remain distinct from behavioural mutation failures. The isolated `ptr` rerun and replaced `offguard` mutation are disclosed appropriately; retain those qualifications in the RC packet.

## Next

On Chad's go, prepare the RC with the toggle-availability fix and tests, Sources `#moonlroc`, REGISTER, the previously carried Sources lighting wording correction, refreshed served-file manifest and narrow Animals pins. Validate a stable identified final tree and return its exact commit for GPT release review. Reuse retained source data; no archive refetch or hub change is needed. Real phone, Safari, screen reader and verified hardware-renderer checks remain open.

Suggested owner line:

> Go for the LROC release candidate. Keep the working detail usable after globe failure by moving its existing toggle outside the hidden globe-control block, and add the focused failure/close tests GPT specifies. Include Sources, REGISTER, served-file manifest, narrow Animals pins and final validation. Return the exact final commit and evidence for GPT release review. No merge or deployment.
