# Soil C1 rev 3 — preview readiness review

25 November 2026. Packet reference supplied: main 17af6be (not independently verified as current remote HEAD). Read the current Mac proposal rev 3, soil_reference.py, revised C7/C8 and G/H controls, saved rev 3 output, unchanged table and relevant builder code.

**Verdict: PASS for proceeding to a branch-only preview on Chad's go, with the bounded implementation details below incorporated. R2-1 and R2-2 are closed. Support revised S1, S2/P1, S3 and the bounded T1 tables check. No deployment or production clearance. T1 must return a documented outcome before release.**

## Independent verification

- Table is unchanged: 684135 bytes, SHA256 c5c01ff5a4300ace1e7348d6d25edb079ea424810e70d50a291afd0ffadb30cf.
- Imported and ran the actual soil_reference module in the direct standard-library Python runtime. The real table validates. Independently reproduced all three previous failures: empty meta/cells, unsupported period on an omitted cell and positive state with negative Mg now return unknown. Exact pinned bytes load; truncated bytes fail pinned identity.
- Executed the actual builder's open_checked, need and InputError definitions with independent lightweight dataset/CRS stubs. Otherwise-valid header passes. Wrong units fail at the tags guard. Removing only the emissions-units comparison allows the same wrong-units header through. This independently corroborates the repaired negative control without requiring full rasters or installed numerical libraries.
- Independently classified every listed cell for both 2021–24 components; the proposal's counts match exactly. Drainage: zero 83; positive bins 134/133/164/138/94/44. Burning: zero 366; bins 67/71/111/96/65/14. Every component accounts for all 790 listed cells. No incomplete coverage in the current period.
- Read the 75/0 saved output and controls. This remains Claude's full-suite result: I did not independently rerun numpy/scipy/rasterio/pyproj-dependent portions or rebuild the rasters. Earlier independent numeric checks remain applicable because the table is unchanged.

## Spatial proposal judgement

The revised design satisfies the spatial-discovery purpose: optional off-by-default layer on the landing globe, fixed 2021–24 annual-average period, drained/burned selection, fixed decade classes on a shared scale, regional polygons and selected-cell outline, with the detailed Everything here row. No new top tab is proposed or needed for this slice.

The legend correctly distinguishes whole-cell totals from intensity: 4° cells differ in area by latitude. Positive classes begin above zero; the lowest positive class should be labelled 'more than 0, below 1,000' or equivalent so the separate model-zero key is unambiguous. Use half-open intervals in code (as BINS already does) and legible non-overlapping labels in the key. Palette contrast, overlay interaction, cell selection and actual performance are preview checks, not established by this docs review.

## Carry into preview implementation and controls

1. **Incomplete zero must keep incomplete styling.** Current layer_class(table, '38_39', 'burned', '2011_2015') returns the plain string 'zero', losing the incomplete marker; drainage returns ('bin', 4, True). H4 currently asserts that information-losing zero result. The proposal promises distinct incomplete coverage. Preserve coverage independently of magnitude/class, e.g. a class plus incomplete flag for both positive and zero. Show the dashed/other clearly distinct outline on partial zeros as well. This is not a numerical-table defect and does not block starting the preview; include the correction and regression fixture in it. Synthetic unknown/incomplete scenes must be clearly fixture-labelled so they are not mistaken for actual 2021–24 observations.
2. **Validate once at load.** load_table can establish pinned identity and whole-table validity. Current reference display and layer_class revalidate all 790 records on every invocation. Keep their semantic checks, but cache validation for the accepted immutable table in page code; do not scan the full table once per polygon, hover or redraw. Validation must precede sparse absence. Include invalid/truncated-table and missing-period fixtures.
3. **Clean stale proposal text during preview preparation.** §1 still says 'There is no globe layer' and points the display reference at soil_controls.py, while §1b adds the layer and soil_reference.py now owns the reference. §2 still lists the old 58/0 control summary although §0a explicitly supersedes it with 75/0. Make the active build brief read consistently without requiring the implementer to resolve superseded paragraphs. This is record cleanup, not a new assessment cycle.

The selected-cell outline must remain distinct from model-zero/unknown/incomplete outlines. Turning the soil layer off must remove its polygons/legend and its layer-specific selection treatment as defined in the preview; keep the existing bare-start rule. Choose concrete palette/styles in the preview and review them at desktop and narrow widths. Do not silently expand into historical animation, intensity maps, a new tab or hub work.

## Decisions supported

- S1 revised: row plus optional off-by-default drained/burned 4° globe layer, no new tab.
- S2: P1 pinned page-repository data; no hub/R2 change.
- S3: monthly source-version checks while the 30 m release is pending, then quarterly, plus errata; no automation created.
- T1: only tabular_data_v1_0_1.zip, 842116 bytes, with the prepared checksum checks and like-for-like comparison. Do not re-download the two large files. Outcome before release; an unresolved difference returns honestly for a bounded decision.
- S4: branch-only fixture preview, incorporating the three details above; T1 may run alongside preview preparation on Chad's go. Candidate review, fresh-main integration, scoped tests and Chad's distinct release approval still follow.

## Relay to Claude

GPT rev 3 review: PASS for branch-preview readiness; R2-1/R2-2 closed independently. Table hash and all current-period class counts verified. Support revised S1, P1, maintenance cadence and bounded T1 on Chad's own go. In the preview, preserve incomplete styling for zero values (layer_class currently drops it; revise H4), validate the table once at load rather than per polygon, and remove superseded no-layer/reference/test-count wording from the active build brief. These can be carried into the preview without another docs-only round. Tables result required before release. No production approval.
