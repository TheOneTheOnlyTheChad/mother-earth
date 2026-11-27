# Mother Earth — LEND proposal rev 1 review

27 November 2026. GPT independent review for Chad and Claude. Proposal at main `726d7f6`. Docs and bounded local analysis only; no new science-data acquisition, build, merge or deployment.

**Verdict: REVISE BEFORE BUILD. Feasibility is supported; the proposed scientific labelling and uncertainty rules need tightening. This is not a finding that LEND is infeasible, nor a recommendation to abandon the item.**

The separation of neutron-related measurements, model-dependent hydrogen inference and water ice is the right approach. Keep the historical average separate from the dated orbit and all current sunlight calculations. South-only is a reasonable initial scope; north is optional and not needed to answer this review.

## Evidence checked independently

- All 11 present files in the review copy match SHA256SUMS. That file also lists HANDOVER.md and STATUS.md, which are absent from this review folder: fix the delivery list, rather than claiming a complete manifest verification. This does not invalidate the science evidence.
- Both retained source-file SHA-256 values match the proposal. All 19 embedded document byte lengths and hashes reproduce. The JSON's “latin1” description should say Windows-1252 decoding: some characters cannot be encoded as ISO-8859-1, whereas Windows-1252 reproduces every recorded source hash.
- Independently parsed the 310-byte records with Python struct: 13,413 usable CSETN cells, 987 missing, six valid zero rates, no zero error among usable cells. The inverse-variance reference mean is **4.9413873895**, with a formal independent-input error of **0.0022184209** in the stored field's units.
- Ran assess_lend_2.py against the retained file: its output reproduces byte for byte. An independent disc calculation reproduces representative means, including Shoemaker 4.86237454 and Faustini 4.87172306. These checks establish the arithmetic, not the physical interpretation or significance of a feature.
- Read the retained catalog, labels, SIS and processing-document passages. Independently opened NASA's PDS dataset description and the Eke, Teodoro and McClanahan abstract pages. The competing spatial-response claims are real. I did not read the full scientific papers or rerun the entire NumPy all-cell smoothing preview in this environment. No browser/device or rendering test was part of this review.

## R1 — Name the stored quantity without resolving the contradiction by inference

The catalog describes dimensionless normalized ratios; the SIS describes counts/s; the sample label says relative count rate. A median near 4.9 cannot determine units, whether a background was subtracted, or which processing description applies. Nor does a constant-scale-invariant percentage establish that the product has a spatially constant normalization/background.

For rev 2, either establish the exact product-specific definition from authoritative documentation, **or explicitly choose an archive-field display that leaves it unresolved**. The second route is sufficient for a bounded proposal; an external reply is not a mandatory prerequisite.

On that route, identify the quantity as “relative difference in the archived CSETN_RATE field”, with the period and Mother Earth's smoothing/reference operation. Do not show the raw number as events/s or describe the percent as a measured lunar-neutron-flux suppression. Put a short explanation of the unresolved normalization/background on the feature itself, with the detailed conflict on Sources. Do not subtract a guessed background or convert the values to hydrogen.

Suggested wording:

> This map compares values in LEND's archived CSETN_RATE field, averaged over 2011–2016. We smooth and compare them with a reference band for display. Archive documents disagree about the field's normalization and background treatment, so these percentages are not a calibrated change in lunar neutron flux or a measurement of hydrogen or ice.

Hydrogen context may explain that neutron measurements can constrain hydrogen through models, with a primary source read for that explanation. Remove the proposed “roughly the top metre” claim unless its applicability to this product is supported. Lower values here must not be presented as uniquely caused by hydrogen. Keep the resolution dispute balanced and version the cited sources: arXiv 2303.03911 currently opens as v5, revised January 2025, rather than an unspecified 2023 text.

## R2 — Distinguish a formal error benchmark from established uncertainty

preview_lend_3.py calculates `100 / (reference * sqrt(sum(1/ERR²)))`. This treats the reference as fixed and assumes the archive errors can be combined as independent inputs. It is not yet the complete uncertainty of a ratio or of the physical interpretation. The processing document's justification of weighting individual corrected records is not automatically a validation of independence among these final map cells.

Choose and document one of these bounded approaches:

- Propagate the reference and its covariance with the local mean under explicitly stated input assumptions; or
- Keep the existing formula as an **approximate formal counting-error benchmark, conditional on a fixed reference and independent archive errors**. Label its limitations and use the 0.5 percentage-point cutoff as Mother Earth's display rule, not a guarantee of accuracy or a significance threshold.

Under the independent-input model, if `p = 100*(m/r - 1)`, its variance includes `Var(m)/r² + m²*Var(r)/r⁴ - 2*m*Cov(m,r)/r³`, multiplied by 10000. Local/reference overlap contributes covariance. Do not call it zero without checking. The reference's formal relative error is only about 0.0449 percentage points here, so this note is not a claim that every current cutoff result is materially wrong.

Withdraw “that's a real signal” / “the archived signal is real” as a scientific conclusion. Report reproducible differences in stored values. Same-latitude controls are useful descriptive comparisons, but their overlap, selected craters and unknown systematics do not establish detection significance. “In control sd” is descriptive, not a sigma detection. Restrict the native-cell noise conclusion to the one ring and statistic actually tested.

Also name the chosen mean honestly: an inverse-variance-weighted mean of sampled cell values, not an equal-area spatial average. Define any exposure readout—native-cell exposure versus the sum over the smoothing support—and avoid calling the latter a continuous observation duration.

## R3 — Freeze the geometry and validation contract before Chad's build decisions

The scripts use a **30 km radius**, hence **60 km diameter**, spherical disc. This is different from the 30 km diameter footprint quoted in one paper. Replace every ambiguous “30 km smoothing/disc/average” in decisions and proposed UI wording with the radius/diameter. The 15 km comparison also uses a radius. Keeping the present radius is a legitimate display choice; do not silently halve it to match a paper.

Document the existing centre-in-disc selection, lunar radius, longitude wrapping, weighting, and behavior where the disc intersects the 80° archive boundary or missing cells. Explain that available support there is truncated. Specify whether support is merely disclosed or subject to another withholding rule; no new threshold is demanded by this review.

Define separately: valid displayed value, archive missing, withheld by Mother Earth's benchmark, and outside this product's coverage. Do not label all four “no data”. State reference construction, rounding, percent versus percentage-point notation, and what the click reads. Freeze a served schema with finite/range, size, coordinate/order and checksum validation; distinguish invalid input from valid zero.

Add a focused future build/test plan: independent source-to-output comparisons; radius boundary and seam checks; reference and error-formula tests; missing/withheld/edge support; malformed values and coordinates; lazy loading, timeout, late completion, retry and cleanup; atomic science-layer replacement and restoration of saved lighting/camera choices; keyboard readout, narrow layout and existing Moon/Animals pin maintenance. Reuse the established controller and safeguards. No broad regression sweep is needed for this docs revision.

## Decisions and next step

Support D1's later archive period, south-first scope and D7's exclusion of hydrogen/water numbers. L1 remains a viable candidate after R1–R3. L2 still needs the same quantity/error care; a table does not resolve those questions. L0 remains an owner choice, not an outcome forced by this review.

Return proposal rev 2 and focused supporting evidence. No north acquisition, production work or new full-data processing is required to answer this review. Chad then chooses the revised decisions and authorizes a branch preview separately.

Primary web sources checked:
- NASA PDS dataset description: https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=LRO-L-LEND-4/5-RDR-V1.0
- Eke et al.: https://arxiv.org/abs/1108.2048
- Teodoro et al.: https://arxiv.org/abs/1304.8123
- McClanahan et al., current v5: https://arxiv.org/abs/2303.03911
