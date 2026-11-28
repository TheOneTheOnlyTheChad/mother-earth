# Mother Earth — LEND proposal rev 2 recheck

27 November 2026. GPT independent review for Chad and Claude. Proposal identifies main `10385fe`; reviewed the Mac `_review/moon-lend-rev2/` copy and retained south-polar source. Docs and focused local calculations only. No acquisition of science data, page build, merge or deployment.

**Verdict: PASS for Chad's D1–D9 decisions and, on his separate go, a page-only branch preview. R1–R3 are addressed. This is proposal clearance, not release approval or validation of the archive's unresolved physical interpretation.**

## What closes the three points

- **R1:** The displayed quantity is explicitly a relative difference in the archived CSETN_RATE field. No raw count-rate unit, guessed background subtraction, calibrated neutron-flux interpretation or hydrogen/ice amount is proposed. The normalization/background contradiction appears on the feature as well as Sources. The general hydrogen context is qualified, the depth claim removed, and the spatial-resolution sources are versioned. The current McClanahan PDF supports the existence of the debate and the need for model assumptions; it does not resolve this particular archive field.
- **R2:** “Real signal” is withdrawn; the crater comparisons are descriptive. The proposed error is correctly conditional on independent archive errors and excludes full physical/systematic uncertainty. The reference variance and local/reference covariance are included in a first-order propagated estimate. The cutoff is Mother Earth's display rule, not a detection or accuracy threshold.
- **R3:** The operation is explicitly a 30 km radius / 60 km diameter disc, with centre-in-disc selection and inverse-variance weighting. This is not an equal-area average or an instrument footprint. Edge support, polar missing support, four display states, exposure meaning, schema and focused build tests are specified.

## Independent verification

1. SHA256SUMS lists exactly the review folder's 16 files; all hashes match. The previous absent-entry issue is fixed.
2. Wrote and ran a separate standard-library Python reduction of the retained 14,400 records. It uses spherical cosine-law selection with latitude/longitude offsets, rather than the submitted NumPy matrix reduction. It recomputes all usable disc means, reference overlap, formal errors and final states.
3. **Exact agreement in state counts:**

| Classification | Cells |
|---|---:|
| Displayed | 11,656 |
| Withheld at the product's 80°S boundary | 1,440 |
| Withheld by the formal-error rule, away from the boundary | 317 |
| Missing in the archive | 987 |
| Total | 14,400 |

4. Without the edge rule, the independent implementation obtains 12,340 displayed using the old benchmark and 12,344 using the propagated estimate, with ten state changes. Propagated minus benchmark ranges from −0.0030887337 to +0.0047793544 percentage points, matching the recorded result.
5. The covariance formula is correct under the stated fixed-weight, independent-input model: shared source cells contribute W_overlap/(W_disc W_band). Propagation is first-order, not an exact finite-noise distribution of a ratio. The submitted Monte Carlo output corroborates the formula under that model; I inspected its code and results but did not rerun its NumPy simulation here. It does not establish independence or error completeness in the actual archive.
6. Opened the current arXiv v5 PDF independently: published PSJ 5:217 (2024), DOI 10.3847/PSJ/ad5b55. Checked relevant introductory/model-caveat and spatial-resolution-debate passages. No published hydrogen number is adopted for Mother Earth.

Primary paper checked: https://arxiv.org/pdf/2303.03911v5

## Decisions I support

I support the recommendations in **D1–D9 as a coherent bounded preview**: the later south-polar product, archive-field-relative quantity, L1, 30 km radius smoothing, propagated conditional formal estimate, 0.5 pp cutoff plus edge withholding, the qualified wording, no hydrogen/water numbers, and no north acquisition now.

The edge rule is a reasonable display choice. It removes one-sided discs, rather than implying a scientific boundary at 80.75°S. Missing-affected discs nearer the pole can remain displayed with their available support disclosed, as proposed. Do not fill archive-missing centre cells merely because neighboring cells support a smoothed estimate.

## Carry these details into the build; no further proposal round required

1. **Precision and state assignment:** apply cutoff and edge classification at full reduction precision before quantizing. A withheld value must not become displayed because rounding makes its error 0.50. Define rounding for signed percentages and native exposures, state precedence (archive missing first, then edge, then error), exact header offsets/lengths and payload hashing before producing the binary file. Validate fields and zero sentinels consistently with those choices.
2. **Malformed source versus genuine absence:** nonfinite values, invalid errors, invalid coordinates/order or inconsistent sentinel/exposure combinations must not silently become ordinary archive-missing cells. The production builder should reject malformed input. To test parser rules beyond the hash gate, use controlled synthetic fixtures with matching test hashes; do not claim a parser test merely because a changed source was rejected by its checksum. Keep valid zero distinct from absence.
3. **Meaningful geometry/error tests:** the current boundary check mostly confirms that values selected by `distance <= radius` satisfy that same inequality. Add independent expected inclusion/exclusion cases that would fail if radius, longitude wrapping or row/column orientation were wrong. Include known shared-band and no-overlap covariance cases and assert final output states/values. Preserve the existing deadline-through-commit, disposal, retry and atomic replacement safeguards when integrating with height and temperature.
4. **Current records and UI:** mark the old rev 1 checklist summary as superseded, or replace its current summary bullets. It still contains the unrestricted noise claim, ambiguous “30 km” wording and old D2 north-pole decision even though the appended rev 2 update is correct. Keep conditional-error wording visible with the legend/readout, the uncalibrated-field caveat on the feature, and support disclosure for missing-affected discs. No extra broad test sweep is requested at this docs stage.

The existing phone, Safari, screen-reader and hardware-renderer limits remain. An implementation preview must return for GPT review before release-candidate work; production still requires Chad's own approval naming the final commit.

## Suggested owner go, for Chad to choose

“Accept D1–D9 as recommended in LEND proposal rev 2. Build a page-only south-polar LEND branch preview, carrying GPT's rev 2 recheck build notes. Return the preview and evidence for GPT review. No north acquisition, merge, deployment or hub change.”

This is a draft for Chad, not authorization from GPT.
