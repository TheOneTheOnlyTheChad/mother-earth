# Mother Earth — LAMP proposal rev 1 review

28 November 2026 · GPT independent assessment for Chad and Claude. Proposal at main `70ad676`, `docs/concepts/MOON-LAMP-PROPOSAL.md`; evidence and retained inputs on the Mac. Docs and bounded local calculations only. No new science acquisition, build, merge or deployment.

**Verdict: REVISE BEFORE BUILD. LAMP is feasible; a south-polar Lyman-α archive view is a reasonable candidate. The wavelength conflict has an explanation in the retained SIS, the orientation claim needs narrower wording, and the numerical/display contract is not yet sufficient.**

The separation from visible photographs, present sunlight, trajectory pairing and inferred water/frost is appropriate. Support assessing L1 south-only first; L2 is optional, not a prerequisite. Do not acquire the north pole or a new DEM merely because this review discusses them.

## Independent checks

- Decoded the 37 retained base64 document entries and verified their SHA-256 hashes. Each of the three retained 25,020,004-byte maps matches its own published archive MD5 and the recorded SHA-256. Mac/repo checkpoint files are byte-identical.
- Parsed the maps independently with Python's array module. Reproduced **5,023,277 existing source pixels inside the 80°S circle and 4,966,208 finite, quality-0 pixels**. Reproduced the exact SNR-below-three correspondence: 53,013 pixels, no discrepancies with quality codes 2/6.
- Independently formed the proposed 4×4 means, using only finite, quality-0 source pixels inside the display cap and requiring eight of sixteen qualifying pixels. Reproduced **311,757 shown cells**.
- Independent coarse orientation diagnostic, using only documented sunlit-peak codes 4/6 and a full-longitude LOLA row baseline rather than the submitted quality-0-pixel baseline: 8,153 flagged pixels in 80–88°S; B about **+2,024 m**, printed-equation reading A about **−69 m**, next alternative about **+776 m**. This strongly corroborates B among the eight tested symmetries. It does not establish 240 m absolute registration or reproduce the submitted statistical test verbatim.
- Converted and read relevant passages of the **retained DPSIS.DOC**, including its wavelength footnote and processing steps. Read the retained DSMAP text and sample labels. Independently opened Gladstone et al. (2012), DOI 10.1029/2011JE003913, introduction and map-generation passages for illumination/model context. That paper uses a longer observation span; its numerical values are not validation targets for this one-year archive file.

I did not rerun both NumPy scripts in full, download another height product, or inspect an implemented browser layer. No phone, Safari, screen-reader or hardware-renderer claim is added.

## R1 — Correct the source assessment and identify the derived quantity

**The retained SIS explains the upper wavelength edge.** Its footnote says the upper limit is extended to **125.57 nm** to include Lyman-alpha photons displaced by a detector peculiarity. Rev 1 calls this unresolved after reading that document in full. Update §4.4a: distinguish the nominal range from the documented operational extension; the labels' upper edge is explained by this footnote. Record the remaining bounds as they are documented rather than declaring every difference an unexplained contradiction.

The error-map label explicitly says SNR, and the values/quality threshold corroborate that interpretation. Use that combination as the basis; the agreement alone is not an independent calibration of SNR or an uncertainty model. Good flag plus finite albedo remains a sensible initial selection. Do not guess the meaning of code 5.

Name the shown value as **Mother Earth's mean of archived, illumination-model-dependent Lyman-α albedo estimates**, with the aggregation scale and dates. Not brightness, a visible-light image, or a direct model-free measurement. A lower mapped albedo is a lower archived estimate; avoid suggesting that measured brightness alone establishes a surface difference independently of illumination/calibration.

The archive's model description is sparse, but relevant primary literature is available. Gladstone et al. (2012), introduction and §2, describes sky-illumination fits, stellar inputs and topographic visibility in the map workflow. Ask Claude to read those passages and record what is supported in general, while leaving the exact implementation/version of this archived product unverified unless established. This does not require a full radiometric re-analysis or reuse of the paper's water/porosity inferences.

Keep no causal interpretation of dark patches and no ice/frost/water quantity. Say the layer does not identify those materials; do not imply that LAMP science as a whole has never investigated them. Keep nominal grid spacing separate from independently established effective resolution.

## R2 — Preserve the promising orientation evidence without calling the entire archive wrong

The DSMAP **prose already describes the south map as longitude 0 upward and 90°E rightward**, which matches B when the stored first row is displayed at the top. Its printed equations and LINE_DISPLAY_DIRECTION combination are inconsistent with that straightforward reading. Separate array/file indices, preferred display orientation, projected x/y coordinates and geographic longitude. A display keyword by itself is not a full registration proof.

Replace “the archive's orientation recipe is wrong” / “the independent test settles orientation” with a precise account: the adopted stored-array-to-coordinate transform agrees with the descriptive orientation and is strongly corroborated by this coarse terrain diagnostic; the printed algebra/display metadata have conflicts. Show explicit equations, one-based versus zero-based indices and the four cardinal directions.

Use documented codes **4 and 6 only** for the primary peak check. Code 5 is undocumented and should not simultaneously be treated as a known peak flag. My restricted check still strongly favors B. Keep all eight wrong-symmetry controls and describe spatial dependence: thousands of map pixels share coarse LOLA samples and do not constitute thousands of independent registration measurements. Crater darkness is secondary descriptive corroboration, not the criterion used to choose the frame.

The coarse result does not check translation, subpixel offsets, arbitrary rotation, scale or 240 m registration. D6's proposed finer check is reasonable **before release**, but specify the exact candidate DEM, size and a bounded validation method before asking Chad to authorize it. It must include multiple geographically separated features/control points, quantitative horizontal residuals or another direct registration measure, and deliberately reflected/rotated/shifted controls. Do not make passing the same height-rank statistic on the reduced grid the sole shipping check. A small coarse registration offset can leave that statistic unchanged.

## R3 — Separate numeric data, clipping and quality/support states

**The proposed 8-bit colour-grid encoding loses information promised by the readout.** Its quantization interval is 0.08/254 ≈ 0.000315. Independent comparison found roughly **24,974** shown, unclipped means whose three-decimal text differs between the unquantized mean and decoded colour value. The specific count uses my float64 means; the issue is the demonstrated loss, not a required golden count.

Clipping also maps every mean at/above the scale end to the same colour code. That code alone cannot establish the proposed strict statement “above 0.08”, recover the mean, or distinguish a value at the endpoint from a value that rounds into its code.

Choose a documented route in rev 2:

- Prefer a numeric readout plane with sufficient precision/range and colour clipping performed separately; or
- Keep a deliberately quantized display/readout product, call it approximate, specify its maximum quantization error and honest endpoint bins such as a documented “at/above” code. Do not present a decoded colour bin as the exact mean.

Measure the revised size rather than retaining the current 244 kB claim as if the format had not changed. Specify reduction order, encoding, sentinels, clipping flags and integer rounding. State that the 960 m arithmetic mean is our derived quantity, not a new instrument measurement at that resolution.

**Quality 0 is not a guarantee of a plausible albedo estimate.** In the retained data inside 80°S, I find 27 finite quality-0 native values above 1, including about 119.84. Under the proposed mean rule, 55 shown 960 m means exceed 0.08; the largest is about **31.07**. Another large mean is about 2.03. These survive the quality rule and drive the clipped display cells.

Do not automatically relabel every value above 1 as physically impossible: that requires a supported interpretation of the retrieved quantity. Instead explicitly choose and justify a policy: retain anomalous archive estimates with clear disclosure/readout, or add a Mother Earth plausibility mask with its rationale and counts. Do not silently clip before averaging, infer a cause, or hide the question behind the top colour. The proposed scale can remain a display choice once those consequences are visible. Use the SNR product as documented if adding a rule; do not convert it into a total error bar without support.

Define at least the distinctions between a shown value, archive absent/nonfinite or quality-rejected data, insufficient aggregation support, and no source-grid coverage. Give the qualifying pixel count or fraction in the readout; flag 0 plus finite remains a selection rule, not certainty. Unknown codes and valid zero require explicit handling.

## R4 — Freeze exact grid/reprojection and loading rules

The 2501×2501 input does not divide evenly into four. The assessment crops to the first **2500×2500** pixels, dropping the final row and column. Its 625×625 block centres therefore have projected coordinate:

`x = (4*c + 1.5 - 1250)*240 m`

and the analogous stored-row coordinate before the B sign change. The geometric centre of the reduced array is **120 m off the original pole on each axis**; the pole lies at reduced fractional index **312.125**, not exactly 312. Record this origin/registration in the header and transform. Do not silently recenter the 625 grid on the pole. L2's 2×2 crop likewise needs its own correct origin.

The nominal “80–90°S” label is not a complete circular footprint: square-edge midpoints only reach about 80.13°S. There are small no-source wedges of the intended cap around cardinal longitudes. Do not extrapolate into them, index outside the array, or merge them with “north of 80°S”. Document how boundary pixels and the half-valid threshold interact, whether inside-cap masking precedes aggregation, and how click coordinates map to a reduced cell. Round-trip tests alone can pass if forward and inverse share the same wrong offset.

§6 also describes LEND's generated texture as 2048×1024. The released moonsci.js actually generates **2880×1440**. Correct the comparison, and specify the texture size/reprojection/resampling proposed for LAMP. Do not imply that a 960 m readout grid gives 960 m rendered detail. Avoid interpolating across invalid/masked cells or presenting new colour boundaries as source features.

Expand §8.1's small contract into a bounded build plan: exact header/grid layout and semantic validation; pinned inputs and output; malformed coordinate/flag/nonfinite tests beyond the hash gate; independent source-to-output checks; rotation/reflection/translation and seam/pole/boundary tests; clipping/readout/support tests; lazy requests; timeout covering preparation and commit; late-result disposal; cancellation/retry; atomic science-layer replacement; existing lighting/Earth-view behavior; keyboard and narrow layout. Reuse the released science controller's safeguards. A broad regression sweep is not needed during this docs revision.

## Next step

Return **proposal rev 2 with focused evidence**, before a page build. No new map or DEM acquisition is needed to answer the documentary and numeric-format points. If the finer DEM check is selected, Chad can authorize that bounded step separately with its candidate product and cost visible.

D1's product, a south-first L1 option and D7's “not now” for north remain reasonable. D3–D6 need the revised information above before Chad freezes them. No reason to park LAMP as infeasible.

Sources checked:
- Retained DPSIS.DOC, DSMAP_POLAR.CAT, sample labels and map bytes in `_source-data/moon-lro-science-lamp/`.
- Gladstone et al. (2012), https://doi.org/10.1029/2011JE003913 — introduction/map-generation passages only; longer-period paper maps are not this file's source-value targets.
