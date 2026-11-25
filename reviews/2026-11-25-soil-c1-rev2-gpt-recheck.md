# Soil C1 rev 2 — independent recheck and presentation advice

25 November 2026. Read proposal rev 2, research-notes amendment, soil_build.py, soil_controls.py, review README, saved control output and corrected table in the Mac mirror. No merge, deployment, account action or download. Main d520b33 is the packet's supplied reference; not independently verified as current remote HEAD.

**Verdict: prior H1/H2 corrections accepted for the assessment. The corrected numerical table is suitable to carry into a reviewed preview. Two narrow reference/control fixes remain before treating that preview contract as passed. The totals discrepancy remains open for the bounded tables check. No production clearance.**

## Independently verified

- Corrected table: 684135 bytes, SHA256 c5c01ff5a4300ace1e7348d6d25edb079ea424810e70d50a291afd0ffadb30cf.
- 790 listed cells, all with positive stored organic-soil area and has_mapped_organic_soil true. All 43 below 0.05 km² retain presence, including 33_54 at 0.000250837 km².
- Checked all 790 records and 7900 period/component states using an independent standard-library script: states agree with values; coverage agrees with nonzero incomplete footprint; saved per-map emissions and footprint values agree within the declared precision tolerances.
- Recomputed rounded table totals differ from saved raster totals by relative errors from 1.51e-8 to 6.76e-7. These are the expected storage-rounding differences; do not describe the six-significant-figure exported table as exactly conserving raw sums.
- Builder sets flags before rounding, validates the fixed input hashes and raster contract, compares drainage/burned NaN masks cell for cell and records incomplete source-raster footprint. It is now the complete assembly path.
- Prior H2 wording fixes, neutral zeros, local-uncertainty caveat and period warning are incorporated.

The actual raster rebuild, projection/matrix controls, 58/0 suite result, fresh Zenodo check and reported peak memory are Claude's evidence. I read the code and saved log but did not rerun that full suite or rasters: the direct Python environment lacks numpy/rasterio/pyproj/scipy. The previous independent hash verification of the two input files remains applicable; they were not downloaded again. No new primary scientific claim is introduced by this recheck.

## R2-1 — validate the table before interpreting sparse absence

The reference display() currently only requires 'cells' and 'meta' keys, then interprets an absent cell as no mapped organic soil. This fails its own unavailable/invalid-table contract.

Independent executions of the actual display()/fmt() functions, extracted without the numerical dependencies:

1. display({'meta': {}, 'cells': {}}, '22_70') -> 'no organic soil mapped in this cell by this model'. An invalid empty table must be unavailable.
2. display(valid_table, '14_49', '1999_2000') -> 'no organic soil mapped in this cell by this model'. An unsupported period is not rejected on the sparse-absence path.
3. A record with state='positive' and Mg=-1 produces a '<0.01' positive-looking value. State/value consistency and numeric validity are not checked by the reference.

Fix in a small shared validator or in the preview's validation contract before any sparse absence is trusted. Validate expected product/version/grid/periods and pinned content identity, record types, finite nonnegative numbers and state/value/coverage consistency. A pinned hash can protect against table truncation; it does not replace record validation for the malformed-record fixtures the contract promises. Validate cell ID and period before sparse lookup, and fail to unavailable on malformed input. Include the three reproductions as controls. This is not a defect in the current valid table's numerical values.

## R2-2 — wrong-units negative control is masked by wrong size

C8 creates a 4×4 raster while open_checked requires 34736×14686. Its first size guard raises before the units test. C8 therefore passes even if the units guard is removed. The claim that this control demonstrates wrong-units rejection is unsupported.

Use an otherwise-valid lightweight raster/header mock (or equivalent bounded fixture) that reaches the tag guard. Show it rejects wrong units and that removing just that guard makes the control fail. C7 should continue to exercise size independently. No giant synthetic raster or full rebuild is needed for this control repair. Existing production input hashes and code's units guard are present; this is a targeted test-evidence correction.

## Chad's calls

| Call | Advice |
|---|---|
| S1 presentation | Reconsider the no-layer limit in light of Chad's explicit question about seeing where emissions occur. Current proposal is a row on the landing page's Everything here panel for a selected place, not a top tab. It supplies whole containing 4° cell totals, not a hotspot overview or a point location. |
| S2 P1 | Support. A small pinned page-owned table is sufficient; no hub/R2 change needed. |
| S3 maintenance | Support proposed monthly source checks while the 30 m release is pending, then quarterly, plus errata. This is a policy, not a newly created recurring task, and requires an actual check when due. |
| T1 tables | Recommend the bounded 842116-byte tabular_data_v1_0_1.zip check with supplied MD5/SHA256, then compare the five global rows and like-for-like components/masks. No repeat large download. Permission remains Chad's; this recheck does not execute it. |
| S4 preview | Support a branch-only fixture preview after the two small fixes and agreement on spatial presentation; keep the totals investigation alongside that preparation and close it before release. A preview can honestly carry the unresolved discrepancy. |

## Spatial presentation: recommendation, not an approved implementation

The row-only proposal answers 'what does this model estimate for the cell containing this place?' It cannot answer 'where are the high/low values around the globe?' without the user already knowing where to select. An outline of the selected 4° cell and its bounds should accompany any row so its regional support is clear; do not imply the estimate belongs to the clicked point.

For Chad's control-centre purpose, recommend keeping this on the landing globe and adding an **optional, off-by-default globe layer**, subject to a small revised proposal/preview:

- Organic-soil emissions (modelled), fixed to 2021–2024 annual average initially.
- Switch between drainage and burning; do not add a combined score.
- Show the same 4° cells used by the data and highlight the selected one; no fake precise emission points or inferred within-cell hotspots.
- A shared global legend for the selected component, in t CO2e/year per whole cell, clearly labelled modelled and dated. Cell areas vary with latitude, so raw cell totals are not an intensity/density comparison; explain that distinction. Review bins/scale and colour treatment with actual values, rather than letting a chart library choose silently.
- Distinguish model zero, no mapped organic soil and incomplete/unknown coverage in the key and details; zero cannot share the visual meaning of unavailable.
- The Everything here row gives the two component values, mapped area, period, caveats and Sources. The layer is a way to find and select cells; the row carries the explanation.

No new top-level tab is required for this design. A dedicated Soil tab remains a possible later choice if Chad wants a separate explorer. None of these spatial additions is silently authorised by the data assessment or the old S1. Ask Chad to choose the intended first preview scope; do not build a large new explorer by inference.

## Relay to Claude

GPT rev 2 recheck: H1/H2 assessment corrections accepted; corrected table/hash checked, all 790 cells and 7900 component states consistent with saved outputs. Before the preview, fix the reference's invalid-table/unsupported-period/state-value validation (empty meta+cells currently returns 'no soil mapped') and repair C8 so wrong units reach the units guard rather than failing size first. No full raster rebuild required just for these changes. P1 and maintenance policy remain supported; recommend Chad's bounded T1 tables check. Chad has raised the spatial-discovery gap: current row is on the landing page, not a top tab. GPT recommends an optional off-by-default drainage/burning 4° globe layer plus the selected-cell panel, if Chad chooses that first-preview scope. Revised spatial proposal before implementation; no hub change or deployment.
