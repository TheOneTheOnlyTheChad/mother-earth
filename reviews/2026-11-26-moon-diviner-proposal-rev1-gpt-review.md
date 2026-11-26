# Moon Diviner proposal rev 1 — GPT review

26 November 2026, South Africa. Reviewed proposal `docs/concepts/MOON-DIVINER-PROPOSAL.md` rev 1, SAMPLES §6, `assess_diviner.py`, recorded output and checklist rev 2 from the Mac mirror, supplied as main `caa00ab`. No independent remote-HEAD query in this round.

## Verdict

**REVISE FIRST; GCP product choice and bounded noon/midnight concept supported.** This is a proposal review, not acquisition or build permission. Do not park Diviner as infeasible: the remaining work is to specify a scientifically clear summary and a robust acquisition/integration contract. No global fetch, build or production action was performed by GPT.

## Independent evidence

Checked all 13 new sample/document hashes in the supplied SHA256SUMS. Using a separate standard-library parser, independently recomputed bin-count distributions and within-window spreads for all seven GCP patches (1,400 spatial cells, 2,800 noon/midnight summaries). The recorded histograms, empty-cell counts and rounded spread summaries agree. The noon missing counts are 7 in the near-side equatorial patch and one each in 60–70 S and 70–80 N; every sampled midnight cell has at least one bin. This is sample coverage, not global completeness.

Read the PDS SIS v1.21 GCP section through the primary archive, confirming that per-bin bolometric brightness temperatures are calculated from mean channel radiances. Also opened Powell et al. 2023 on the publisher's site: its full text is openly accessible, explains the equivalent-blackbody interpretation (§2.5) and describes fitted nighttime temperatures (§2.4). This supplies a primary-source route instead of relying on the blog copy for the general definition. It does not replace the GCP SIS as authority for the GCP's own processing.

Primary references:
- https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/document/Diviner_RDR_SIS.pdf (§8.1)
- https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022JE007532 (§2.4–2.5)
- https://ode.rsl.wustl.edu/moon/pagehelp/Content/Missions_Instruments/LRO/DIVINER/GCP.htm (supporting overview; its heading/link metadata contain mistakes, so prefer the product labels/SIS for identity)

## R1. Name the new statistic and its support accurately

The GCP's existing bin values and our mean of up to four bin temperatures are distinct processing steps. An unweighted mean is acceptable as an explicitly labelled descriptive summary; it is not the bolometric temperature obtained by combining all observations/radiances for the hour, and it is not necessarily a fully sampled one-hour average.

Revise the legend's “Average of observations ...” to explain that this is our unweighted mean of available quarter-hour bin temperatures compiled from 2009–2015 observations. Keep the bin count visible. Distinguish the instrument footprint from the much larger 0.5-degree map cell; the gridded cell is not the detector's physical footprint.

For n=1, show “one bin; within-window range unavailable”, not an apparent 0 K range suggesting stability. For n>=2, define spread as max minus min of available bin values. It is not uncertainty, accuracy, a confidence interval or full temporal variability. Missing/invalid source bins are omitted. A zero-bin cell should say “no valid data in this window”, since the proposal excludes both empty (-9999) and invalid (-9998) records; “no observation” is too specific for the combined state.

Keep no valid bins, withheld-by-policy and valid values distinguishable in data, map and legend.

## R2. Finish the acquisition and retention contract

Whole-file Route A is a defensible candidate: fewer requests and archive MD5 checks can justify more transfer than Route B. This is a one-time build cost, not page traffic. It still needs Chad's explicit bulk-acquisition decision after the revised proposal.

The claim “Any window can be derived afterwards without refetching” contradicts “nothing but the small derived grid leaves the pane” if only noon/midnight summaries are retained. Either retain verified source files or a complete, lossless numerical extraction of all local-time tbol bins, or remove the no-refetch claim and explain future acquisition. For scale, 259,200 cells x 96 bins x float32 is 99,532,800 bytes before compression; this is an option, not a mandated format or extra product.

Specify per-band durable checkpoints (source URL, archive MD5, locally computed SHA-256, bytes, parser/version and reduced output hash), resume after a pane/tool interruption, and sequential bounded acquisition. Spell out whether parsing truly streams or holds a whole response; 156 MB file size is not peak memory when buffers, text and parsed objects coexist. Measure actual memory and parsing cost in the first-band trial. State the MD5 implementation/library and parse/header/row-count/coordinate checks. Stop on failed integrity or structural checks; never publish partial acquisition as a complete map.

Retain the proposed first-band trial before the other files. This review authorises no acquisition.

## R3. Specify transitions between appearance, height and temperature

Mutual exclusion alone is insufficient. Preserve the currently displayed map and view while a replacement loads; switch atomically after validation. A failed/cancelled replacement leaves the previous map usable. Rapid changes must not let a late answer select an obsolete mode.

Save the original lighting/Earth-view state once when entering science mode, retain it across height -> temperature -> height and noon -> midnight changes, and restore lighting for the current minute only when leaving science mode. Otherwise temperature can overwrite the remembered pre-height “Lit as now” choice with height's forced-off state. Define switching the active science layer off, and keep the existing Earth-camera non-restoration rule explicit. Include resource/cache ownership and focused regression tests for both transition directions and failures.

## R4. Complete the numerical and display contract

- Use strict finite-number parsing and exact sentinel handling. “tbol > -9998” alone is not a sufficient acceptance rule for malformed input; reject unexpected non-finite/nonphysical values according to the documented product bounds, rather than silently encoding them.
- Give the binary header's magic/schema, dimensions, order, offsets, byte order, lengths and exact sentinel meanings. The stated 1,814,400 bytes describes the planes only; any header is additional. Validate the complete payload before use, as for height.
- Make the n=1 unavailable range encodable. If range is rounded or capped, disclose that; do not present a capped number as the full range.
- Different fixed noon/midnight scales can be used, but make their different numerical ranges prominent: equal colours do not mean equal temperature across modes. Calculate quantiles from valid, displayed cells only, excluding nodata/withheld, and show clipping in the legend. Do not recalculate scale per view.
- Latitude exclusions are our display policy, not instrument coverage boundaries or a guarantee of small spread inside them. The retained 60–70 S noon patch already has a maximum spread of 54.72 K. Keep this visible in the rationale and report the final global distribution after acquisition before freezing the preview.

## R5. Narrow cross-checks and alternatives to their actual evidence

Four GHRM comparisons are useful corroboration, not independent absolute accuracy or a proof of sub-cell registration. GHRM shares instrument lineage, uses a longer interval and a fitted midnight method; its pointing treatment also differs. The proposed wider site comparisons should describe expected differences and not impose the initial 0.2–0.5 K as a universal pass tolerance. Use explicit coordinate/grid tests and deliberate origin/flip controls to test registration. Smooth ~100 K equatorial backgrounds can agree even with indexing errors.

“Single bins/cycle maps/dawn and dusk are unusable” is too broad. They are unsuitable for the proposed near-complete, one-hour representative display under the chosen trade-off; sparse sampling and large real changes can still be valuable in a dated-pass or diurnal feature. Record that scope choice and revisit condition rather than declaring the products scientifically unusable.

The assessment script prints hash MISMATCH without failing. Make hash/layout checks assert or exit non-zero. Clarify its runnable staging layout: two older GCP patches sit in the parent source-data folder, whereas the new files are in diviner/. Do not claim the full numpy script was independently rerun here: numpy is unavailable locally; GPT used an independent standard-library computation for the seven GCP patches only.

## Recommended direction after revision

Support D1 GCP noon/midnight, D2 one hour, D3 latitude masks as explicit display policy, D5 in-page texture from the checked grid, D6 K with Celsius secondary, and D7 bin count plus correctly defined range. Route A is supportable in principle with the first-band checkpoint, durable retention and bounded parser/memory contract specified, then Chad's bulk-fetch approval. No additional global samples are needed merely to rewrite this proposal.

Return proposal rev 2 and matching evidence/checklist updates for recheck. Moon remains the active full-spec workstream; Sun waits. No build or bulk fetch yet.
