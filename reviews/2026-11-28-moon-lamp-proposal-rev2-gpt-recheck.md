# Mother Earth — LAMP proposal rev 2 recheck

28 November 2026 · GPT independent recheck for Chad and Claude. Proposal at main `cef66b1`, read from the synced Mac project mirror; reviewed the revised evidence scripts and retained inputs.

**Verdict: PASS for Chad's D1–D8 decisions and the bounded finer-registration assessment. R1–R4 are addressed sufficiently to proceed. Recommend doing D6's DEM check before the page build, returning its evidence for GPT review. No further full proposal revision is required for the small build/wording notes below.**

This is not clearance to merge, deploy, acquire other science products or treat the coarse orientation result as verified 240 m registration.

## What is now adequate

- The retained SIS footnote explains the operational Lyman-α upper band edge. The value is correctly described as Mother Earth's arithmetic mean of archived illumination-model-dependent albedo estimates. The longer-period Gladstone paper is context, not a source-value validation target for this file.
- The adopted transform, array-index bases, geographic cardinals and metadata inconsistency are explicit. Reading B is strongly supported by the coarse diagnostic, using documented peak codes 4/6, with dependence and scope limits stated. The 1,574 LOLA cells are **distinct cells**, not necessarily statistically independent observations.
- Numeric readouts are separated from colour mapping. Thousandths preserve the intended three-decimal output; high values are retained rather than silently clipped before averaging. Native support and anomalous-value inclusion are disclosed. No cause or ice/frost/water inference is assigned.
- Padding preserves the final source row/column; the reduced-grid origin and fractional pole index are correct. No-source wedges, quality rejection, limited support and outside-cap points are distinguished. The 2880×1440 texture and approximately 3.8 km latitude sampling are now described correctly; they are not a claim of effective instrument resolution.

## Independent numerical check

Using standard-library Python and the retained maps, I independently recomputed the padded 626×626 grid, qualifying support, float64 means, integer-thousandths rounding and outlier flags.

| Classification | Cells |
|---|---:|
| S0 shown | 311,803 |
| S1 insufficient qualifying pixels | 1,779 |
| S2 no usable value | 366 |
| S3 map-edge support | 935 |
| Total with at least one inside-cap source pixel | 314,883 |

- Exactly **300,895** shown cells have all 16 source pixels qualifying.
- All **311,803** shown values agree with Decimal ROUND_HALF_UP at three decimals; the largest integer is **31,069**, safely below sentinel 65,535.
- Exactly **nine** shown cells include a qualifying native value above 1.
- The three planes total **1,567,504 bytes** uncompressed. My local gzip-9 result is 233,479 bytes, rather than Claude's 233,132. Both support the approximately 233 kB estimate; I have not established compressed-byte identity across compressor/platform implementations. Freeze and record the actual final asset and compressor in the build, rather than treating this research size as a final pin.

This is a numerical/code review, not a browser or rendering check. I did not acquire the proposed DEM or rerun the complete NumPy terrain/nearest-peak analyses. The original source hashes, archive MD5s and coarse orientation were independently checked in the rev 1 review.

## Small clarifications to carry forward

1. **Rounded top-bin semantics.** I find 55 unrounded means ≥0.08, but **56 stored integer-thousandths values ≥80**. The extra cell rounds into the 0.080 display bin. Label the top bin as “displayed estimate 0.080 or higher”, and the readout note as “at or above the colour-scale limit after rounding”, or an equivalent honest statement. Do not call every such cell strictly “above” 0.080 or use 55 as the displayed top-bin count. Add boundary tests around 0.0795/0.080 and exact rounding ties.
2. **Outlier policy P1.** I support retaining and explicitly flagging the nine affected averages for this archive view. Do not infer that a value above 1 diagnoses a particular error or energy imbalance without a supported definition of the retrieved reflectance quantity. P2 remains a deliberate additional mask, not a scientific correction established by this assessment. Preserve numeric range checks: reject overflow into the sentinel, negative/nonfinite output, unknown/reserved flag bits, or impossible support relationships rather than wrapping or silently treating malformed data as absence.
3. **Header and states.** Freeze exact byte layout and version before building. Require `0 ≤ n_q ≤ n_in ≤ 16`, valid reserved bits, and value/sentinel consistency with derived states. Point-based S4/S5 must take precedence where there is no geographic source coverage. Test raw-source/parser failures using controlled fixtures beyond the checksum gate, and compare independently chosen edge/pole/outlier cells, not only forward/inverse round trips.
4. **Rendered resampling.** Nearest-cell lookup prevents creating interpolated numeric values. It does not automatically prove that the WebGL texture sampler adds no visual smoothing. Test and describe rendered boundaries honestly, including invalid cells, seams, the pole and no-source wedges. Keep texture detail, numeric grid spacing and effective science resolution separate.
5. **Precision wording.** The numeric plane agrees with rounding of the stored-pixel mean; it does not make that mean physically accurate to 0.001. The paper's Poisson-SNR discussion is contextual unless applicability to this exact file is established. Do not add an unsupported total-error bar.

## D6 — Proceed as a bounded assessment, with safeguards

Support the proposed one-file LOLA trial in §5.4. Before fetching, confirm the exact label, product/version, byte length, sample scaling, reference radius, map registration and any archive checksum. Retain its label with the file, and checkpoint/verify before processing. No north or other LAMP files are required.

The geographic transform must be anchored to the product metadata and known coordinates. The relative 120 m grid-origin difference is expected from centre-versus-corner registration, not evidence of a real spacecraft displacement.

The proposed peak/local-relief and high-passed-albedo/slope tests can be useful diagnostics, but different quantities need not have matching fine structure. Some tiles will have no documented sunlit-peak pixels or inadequate signal. Predeclare usable-tile criteria and report support and score/peak ambiguity. Do not force a subpixel fit to weak or flat correlation scores, treat all tiles as independent, or convert “inconclusive” into a pass. Do not apply a physical shift just because two terrain-related maps achieve a slightly higher correlation at it.

Preserve the reflected/rotated/known-shift controls and include direct landmark/coordinate checks. Report horizontal residuals and uncertainty/ambiguity separately from the coarse symmetry result. If inconclusive, return the evidence and a bounded alternative for Chad/GPT; this does not automatically make LAMP infeasible. A fine check of one relationship is corroboration, not a claim of absolute 240 m accuracy.

## Decisions and next step

I support the recommended **D1–D8** as a coherent plan: the selected south-polar archive product; L1 first; the padded 960 m mean; numeric thousandths with a separate colour scale; qualified wording; D6's bounded finer check; no north file; retain/disclose outliers. L2 can wait.

Suggested owner line, if Chad chooses:

“Accept D1–D8 as recommended in LAMP proposal rev 2, with GPT's recheck notes. Go for the bounded D6 finer-registration assessment: acquire and retain the specified LDEM_75S_240M product and its label, verify and checkpoint it, run the documented checks and controls, then return the evidence to GPT. No page build, bulk acquisition, merge, deployment or hub change.”

After that assessment, the page preview can receive its own go with the verified transform and remaining implementation notes. This draft is for Chad; it is not authorization from GPT.
