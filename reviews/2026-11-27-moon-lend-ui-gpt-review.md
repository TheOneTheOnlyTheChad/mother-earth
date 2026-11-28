# Mother Earth — LEND south-polar preview review

27 November 2026. GPT independent review for Chad and Claude. Branch `moon-lend-ui`, tested candidate `cd3a9b6`, packet head `b1b8164`. Reviewed the delivered `_review/moon-lend-ui/` copy, raw retained source, code and evidence. No merge, deployment, north acquisition or hub change.

**Verdict: PASS for proceeding to a release candidate on Chad's go.** The source-to-file reduction, qualified meaning, four display states and integration support this bounded preview. Close the small header-validation gap below in the release candidate. This is not approval to release the preview commit.

## Independent checks

- The review folder contains exactly the 57 files listed in SHA256SUMS; every hash matches.
- Independently reduced the raw source with standard-library Python, using spherical cosine-law geometry and precomputed longitude offsets rather than the builder's NumPy matrix selection. **All 14,400 packed records match**, including state, near-missing flag, signed percentage, propagated formal error, support count and native exposure. Missing centres remain missing. The binary is 144,160 bytes, SHA-256 `9f185cc38cb8f378220b30f212deec8daf1e639071dcfe0304cb743038d26cdf`; its payload hash matches.
- States match exactly: **11,656 shown; 987 archive missing; 317 withheld by error; 1,440 withheld at the product edge**. Full-precision classification precedes quantization. The 30 km radius / 60 km diameter, reference covariance and archived-field-relative interpretation are preserved.
- Inspected the builder, strict sentinel and coordinate/period checks, quantization, emitted header and fixture/mutation tests. The submitted 436/0 and nine-mutant results are supported by the supplied logs; I did not rerun the NumPy builder suite here.
- Executed the actual moonsci.js in an independent Node VM with a DOM/canvas/globe fixture and real asset bytes. All-cell decoding, centre readout, outside-coverage text and cached re-entry passed. Appearance HTTP 404, corrupted appearance bytes, image-decode failure and a null PNG result each retain the existing view, release object URLs and allow retry.
- Exercised the actual coordinator with a held PNG completion, manually firing its deadline callback, both on first entry and while replacing temperature. The pending request ends, the existing view remains, late resources are revoked, and retry works. This is a control-flow check, not another real-time browser deadline measurement.
- Reviewed the supplied desktop and 360 px screenshots. The cap, neutral states and qualified text are consistent with the contract. Radial wedges reflect the polar projection and narrow longitude cells; they are not new resolved lunar structures. The sticky-header crop is evidence framing, not proof of a layout defect.

These independent checks are numerical/code/fixture checks and inspection of Claude's images. I did not independently run a real browser, hardware renderer, phone, Safari or screen reader during this preview review.

## Required small fix in the release candidate

In loadLend(), the reference mean and reference error are checked with:

`Math.abs(value - expected) > 1e-9`

A NaN makes that comparison false. I reproduced acceptance of a crafted file with NaN at byte 52 (reference mean), and separately at byte 60 (reference error), while changing the test's outer file pin to match the crafted bytes. The actual reviewed asset is finite, and its unchanged pinned whole-file hash rejects ordinary alterations. This is therefore a defense-in-depth validation gap, not evidence that the current asset displays incorrect data.

Read both float64 fields once; explicitly require Number.isFinite before testing the tolerances. Add focused malformed-header tests for NaN in each field, with matching outer test hashes so they test the header validator. Require refusal, unchanged displayed map and a useful error. Keep the outer pin and payload checks. Include infinities if convenient. This can be done in the RC; another separate preview/proposal round is unnecessary.

## Wording and presentation

The feature states the unresolved normalization/background conflict, avoids raw count-rate units and calibrated flux/hydrogen/ice quantities, identifies the conditional formal estimate, and labels the smoothing as a display choice. The exposure belongs to the native cell, not a continuous observing duration. These meet the agreed scientific boundaries.

The error cutoff is a display policy; neither the palette nor the ± readout establishes a detection or physical accuracy. Preserve those caveats in Sources and REGISTER, including the missing-affected support disclosure and the disputed spatial response. Keep the same-period reference and no trajectory pairing.

Small housekeeping: update the moonsci.js opening comment (“both”, active-state list and transitions) to include LEND. Also qualify packet §4's untested-suite wording: not running a suite does not establish that its exceptions are unchanged, and other suites can consume shared moon.html. Carry the known baseline exceptions with their actual evidence dates; do not call them newly verified.

## Test evidence assessment

The final supplied logs show LEND 77/0, all 16 applied breaks with counted assertion failures, and the listed Moon/Sky/craft regressions green. The three Animals failures are the expected moon.html release pins awaiting narrow maintenance, rather than failures to conceal. A break's shell `exit=0` in the wrapper is not a successful assertion run; the packet discloses the wrapper bug, and the assertion FAIL lines support the reported catches. Fix exit capture in the RC runner.

The four disclosed test corrections are reasonable: move the radius stimulus outside the reference band; target the actual LEND validator; separately exercise token protection when abort cannot act; require the late texture to have been produced before asserting its disposal. Keep those tests and their controls. “No new requests on re-entry” is established for the LEND file; do not broaden a specific assertion into a total-network performance claim.

## Release-candidate follow-through

On Chad's go:

1. Reconcile current main explicitly; preserve other workstreams' changes and work from a frozen validation tree.
2. Apply the finite-header fix/tests and small record/comment corrections above.
3. Add sources.html#moonlend and its shortcut/Details links, plus the REGISTER entry. Record the exact product/LIDVID/period, retained source hash, derived asset hash and builder, unresolved field meaning, formal-error assumptions, reference, smoothing radius, masks and rights/citations. Mark RC until release.
4. Maintain Animals pins narrowly, including proof that tampering is caught. Update Sources-order checks only where the new section requires it.
5. Make a new served-file manifest while keeping historical manifests unchanged. Validate the final served bytes, affected suites and meaningful breaks, documenting exact tested/head differences and main baseline comparisons for any exceptions.
6. Return the final RC commit and packet for GPT release review. Chad's own approval must name that final commit before merge/deployment. The live hash check must use the reviewed manifest itself.

No north file, additional science acquisition, collector or hub work is required.

Suggested owner line, if Chad chooses:

“Go: build the page-only LEND release candidate from the passed preview, including GPT's finite-header fix/tests and RC notes, Sources, REGISTER, narrow Animals pins, served manifest and final validation. Return the exact RC commit for GPT release review. No merge, deployment, north acquisition or hub change.”

This is a draft for Chad, not authorization from GPT.
