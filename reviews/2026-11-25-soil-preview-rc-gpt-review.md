# Organic-soil emissions fixture preview — independent GPT review

25 November 2026. Candidate supplied: soil-preview-rc 0ee73283004f7aec774d647a1e618ff271f05586; packet on main 081000a. Read Mac packet, T1 record, candidate soil.js, integration points in index.html, Sources, reference and controls, Animals pin checks, fixture and screenshots. No merge, deployment, account modification, deletion or new download.

**Verdict: HOLD before release preparation on the visual and state-handling corrections below. Core data/fixture approach is sound; T1 is closed as a documented product difference. The layer-owned selected-cell outline is acceptable. Return a corrected preview for bounded recheck.**

## Independent evidence

The first browser attempt could not connect because no server was running, and the shell could not bind a port. Chad then started the server. Retried successfully in the in-app browser at http://127.0.0.1:8899/index.html, against real Earth imagery and the live hub for other data. The initial failed connection is superseded by this successful preview check. I did not start a server or stop Chad's server.

Browser checks: soil starts off; switching on shows 65 cells and Layers 1 on; Drained/Burned radio switching works; rotated to Southeast Asia; clicked cell 22_73 and verified whole-cell bounds, annual-average values and caveats; opened Everything here and verified its soil row after Forest; closed inspector and switched off, leaving Layers none on and no soil fill. Actual imagery loaded. This is a desktop functional/visual check, not phone/Safari/screen-reader or full regression.

Node VM checks of actual soil.js, with stubbed DOM/fetch and real WebCrypto: exact fixture bytes load; fixture out-of-subset text remains unknown; all 65 fixture records equal their corresponding full-table records exactly; subset lists 82 cells. Independently reproduced the incomplete-zero and unknown-Key findings below using bounded in-memory fixtures; candidate files were not altered. No full browser suite rerun; reported 37 checks, breaks and 51-suite sweep remain Claude's evidence.

## P1 — outline ownership: accept

Keep selection outlines owned by the active soil layer. When off, the place panel names the selected cell and bounds without changing globe data. This respects the existing panel rule, so a separate relaxation is unnecessary. Selection outline should clear on closing its panel, as implemented. Keep this narrowed behaviour in the final spec.

## P2 — colours: not ready

On the actual imagery, the Southeast Asian drainage patch reads as a largely similar ochre block; upper classes are not reliably distinguishable. Burning is more fragmented, but cloud/land brightness affects visibility enough that adjacent legend classes cannot be confidently inferred. A six-class magnitude layer needs a scale whose classes survive the backdrop, not just different alpha constants.

Revise the sequential palette with more separation in colour/lightness and sufficiently stable opacity; keep the fixed bins and shared scale. Check both components on dark sea, bright clouds and land using the real preview, with known cells from at least the upper three classes. A texture/backdrop change is not authorised by this review. The positive lowest-bin label should say '>0 to <1,000' or equivalent, separating it clearly from the model-zero class. No extra data or bin quantiles needed.

## H1 — incomplete zeros still lose their visual coverage flag

Previously requested fix is not implemented: cellClass('38_39', 'burned', '2011_2015') returns 'zero', while drainage returns {bin:4,incomplete:true}. polys() paints every zero with zeroStroke and no coverage treatment. Both zero and positive values must preserve incomplete coverage independently of magnitude. The row's partial-sum wording is correct; the globe contract is not.

This does not alter the current 2021–24 numeric map (no incomplete cells then), but the preview explicitly promises/tests synthetic incomplete states. Fix the reference, JS class contract, drawing and focused controls together. A test that merely compares JS with the same information-losing reference will not catch this defect. Include a partial-zero polygon/style check. A solid outline is acceptable if distinguishable; dashed strokes are unnecessary.

## H2 — unknown-only outlines count as a drawn data layer

polys() increments drawnCells for unknown outlines and drawn() returns true whenever drawnCells > 0. Yet index.html's Key definition explicitly excludes 'cells outlined as unknown'. An independent synthetic table containing only one coverage:none cell validates, draws one unknown outline and returns drawn() == true. That counts soil in the Key without usable values.

Separate total polygon count from usable-value/model-zero cell count. Preserve a labelled unknown outline, but exclude unknown-only coverage and selection-only outlines from the usable-layer Key count. Add unknown-only and mixed-known/unknown controls, plus the actual integration's Key count. This is distinct from an unavailable table, which already draws nothing.

## H3 — inspector makes the figures too narrow to read

Independently confirmed on the served desktop preview at 1280×720: the long 'Organic-soil emissions (modelled)' definition label consumes most of the inspector width. Values/caveats wrap into a roughly 100–120 px column, producing many short lines and pushing the content far down the panel. Claude's 3-europe-inspector.png exhibits the same problem.

Use a soil-scoped stacked label/value layout, a shorter definition label or another bounded layout that gives the figures usable width. Keep modelled identity in the inspector heading and do not remove caveats to make it fit. Check inspector and Everything here at desktop and narrow width with a positive cell, zero cell and expanded periods. A global definition-list change would require its own regression scope; prefer a scoped correction.

## P3 — fixture and incomplete styling

Fixture scope is honest: 65 unchanged records inside an explicit 82-cell subset; outside the subset is unknown, not no mapped soil. Accept. The chosen synthetic unknown/incomplete fixtures must remain clearly identified as synthetic; don't publish historical missing states as actual 2021–24 data. Light solid incomplete outlines are acceptable in principle, subject to H1 and clear visual separation from the white selected-cell outline and the model-zero outline. Outside-subset cells not being drawn is reasonable in a labelled fixture preview.

## P4 — T1: close as documented difference

Read the existing ZIP's global CSV and the full local licence file independently. ZIP: 842116 bytes; SHA256 3108fefee61dc190ec316c48a7bfd6598c5842896dc43795a1e82b2270e5f4a8; MD5 2a4dd44b561d0e168b57856a9da2689a. Four members are under data/.

Recomputed all five raster/table percentage differences from the global CSV and saved per-map sums: drainage +0.064346%, +0.078038%, +0.071042%, +0.076270%, +0.078029%; burned +0.004227%, +0.003444%, +0.005409%, +0.004020%, +0.002952%. 2011–15 table total is 2694544133.4066386 Mg/yr (2.694544133 Gt), which rounds to 2.69; raster total is about 2.696003344 Gt. This is not an isolated period anomaly.

Independently summed the 1005 country rows and populated emission fields in 8693 detailed rows with math.fsum: both match global drainage/burned totals to floating-point resolution. Detailed blank component fields were excluded, not interpreted as evidence of real-world zero. Area discrepancy remains documented; no quantitative attribution of individual causes was established here.

Licence file SHA256 65d86603304fc5a0131a3180dae4755c468f47c77f178f16c2276c473c034c9d. Its full text grants CC BY 4.0 to original outputs/documentation, requests credit/licence link/changes, distinguishes third-party inputs and separate GPL model code, and avoids endorsement. Preview Sources carries the citation, licence and aggregation changes. The earlier unintended licence download and duplicate table downloads are disclosed; I have not deleted or moved them.

The publisher-guide explanation of administrative boundaries/source area weights is recorded in Claude's direct read, not independently reread by me this turn. Accept the comparison as evidence of a small documented product difference; keep that general explanation attributed and the precise contribution of boundaries, weights, missing values and rounding unquantified. No 30 m investigation or new download is required for this release. Avoid 'the exact cause has been proved'.

## P5 — Animals maintenance plan: direction acceptable, incomplete scope

Do not blindly move NC_MAIN/NC_PARENT. The plan correctly retains BASE_MAIN/TL_MAIN and folds the already-landed zebra Sources block into the new baseline, preserving the separate Animals guarantees.

However, **13j also needs explicit treatment**, omitted from §5.1: its old scope accepts only app.js/index.html/sources.html, three named Nature tests and old dated records, and requires all three page files to change. Soil introduces soil.js, an asset, layers.js/style.css and other tests, while app.js is unchanged. A genuine soil-parent to soil-page pin will therefore fail that scope check even after the four listed preview failures are handled.

Prepare a reviewed soil-specific parent-to-page changed-path manifest/control that preserves the old historical Nature guarantees and protects unrelated files. Keep app.js byte-pinned, and preserve Animals Sources/link/header protections. Include controls for unrelated edits. Do not widen the whitelist to everything or move parent pins merely to make it pass.

Five suites lacking fixtures remain unverified, including general Key/mobile checks. Supply relevant fixtures or equivalent focused integration evidence for actual affected behaviour in the release candidate; do not turn every legacy fixture gap into an unrelated maintenance project. Baseline failures may remain explicitly recorded only where reproduced unchanged. The full-data switch, REGISTER, fresh-main integration and served hashes still require candidate review and Chad's release approval.

## Relay to Claude

GPT preview review: HOLD before release preparation. P1 accept layer-owned outline; P3 fixture handling acceptable; P4 T1 closed as documented raster/table difference (precise cause unquantified). Fix palette separation on real imagery, the narrow inspector value column, incomplete-zero coverage styling (still dropped), and unknown-only outlines incorrectly counting soil in the Key. Add focused controls. P5 also needs an explicit 13j soil scope check, since the old changed-path rule cannot accept this release and app.js stays unchanged. Preserve BASE_MAIN/TL_MAIN and prior guarantees. Return the corrected preview; no further data download or deployment.
