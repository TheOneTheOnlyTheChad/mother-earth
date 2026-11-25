# Soil C1 assessment — independent GPT review

25 November 2026. Scope: proposal rev 1, assessment notes, aggregation script, saved per-map results and derived table. No implementation, account action, download, merge or deployment performed. This review is independent of Claude's assessment; Chad remains release approver.

**Verdict: HOLD on the current derivative/state contract and proposal wording. The equal-area aggregation approach is acceptable in principle. Support the panel-only approach and P1 pinned page-owned table, subject to the corrections below and Chad's choices. Return one corrected assessment/derivative packet before a fixture preview. No repeat raster download is needed.**

## Evidence and limits

Read local proposal and notes in full, cells4.py, retained Stage 0 aggregation requirements, relevant original spec sections, JSON metadata and all ten per-map outputs programmatically. Independently read the primary paper's methods §§2.1–2.6, results §§3.1–3.2, sensitivity §§3.8–3.9 and limitations §4.5 through the full-text web page. This is not a review of the entire paper or supplementary material.

Primary paper: https://www.frontiersin.org/journals/environmental-science/articles/10.3389/fenvs.2026.1761716/full
Dataset identity supplied by packet: https://zenodo.org/records/22137130

Zenodo metadata and guide requests failed in this session's web reader. I have not freshly verified the licence, latest-version status or the official release manifest against the service. The prior Stage 0 review inspected the guide/licence; this review does not silently claim a new live verification. Publication attribution and version preflight still need the official evidence retained/rechecked in the corrected packet.

Independently SHA256/MD5-hashed both existing files in /Users/chadobie/Downloads; they match the identities in the assessment notes:

| File | Bytes | SHA256 | MD5 |
|---|---:|---|---|
| organic_soil_emissions_1km_v1_0_1.zip | 212800018 | 5c08288497265b761421d898819f11824000c1b06b4455052e0e1849d82a1473 | 55703ae10c6b0123d773e0b92138b65f |
| organic_soil_cover_percent_1km.tif | 108618168 | 7b35b59ab8d9944e9d0fa64c2ec903cdc0eaf131f4d462ec6304ddb740d15e0e | 3b9649665f97a28ff8ba9f3ca01cdc07 |

The saved derivative is 312784 bytes, SHA256 49a745b053b21409f5ec0817c677fe7fc939dab1cda25e1c248321fdf6bd4bf0. It contains 790 records. Recomputed sums of its rounded components agree closely with the saved per-map totals, with sub-1 Mg differences per component/map. This is a consistency check of outputs, not an independent recount of raster values. No positive emissions present in the three-decimal per-map files became zero in the one-decimal derivative; no listed positive missing footprint became zero. Six small controls of the actual weights() function passed, covering full overlap, split overlap, negative coordinates, touching edges, clipped coverage and aligned intervals. The sparse-matrix constructor was substituted with a recording stub; these controls do not exercise rasterio, pyproj or matrix multiplication. Required numerical packages are absent from the direct Python runtime; I did not rerun all rasters. Runtime/memory and near-machine-precision conservation remain Claude's measurements.

## H1 — exported rounding destroys mapped-soil presence

The current derivative rounds organic_km2 to one decimal. Compared with the saved per-map outputs, **42 cells with positive organic_km2 become 0.0**. Twelve of these have positive drainage or fire in at least one period. This directly contradicts the proposed state test organic soil == 0 -> no organic soil mapped.

Reproductions:

- 31_78: per-map organic_km2 0.044; derivative 0.0; latest drained_Mg 130.4.
- 17_89: per-map organic_km2 0.012; derivative 0.0; latest drained_Mg 3.1.
- 35_61: per-map organic_km2 0.024; derivative 0.0; 2011–15 burned_Mg 25.3.

Fix: retain sufficient underlying precision and an explicit has_mapped_organic_soil flag derived before rounding. Derive display states from unrounded/explicit state metadata, not formatted numbers. Apply the same rule to positive emissions and missing coverage so formatting can never create a true-zero/complete state. For tiny positive areas, display an appropriate small positive value or '<… km²', never a semantic zero. Add the reproductions as controls and verify all cells, not just fixtures. Supply the assembly script that creates g4-cells-v1.0.1.json; cells4.py writes per-map files and does not reproduce the final table by itself.

## H2 — missing footprint and zero explanations

A_nan sums the overlap area of whole 1 km pixels flagged NaN. A source pixel is flagged when any organic-soil source area lacks emissions. This metric is therefore **the footprint of source raster pixels with incomplete estimates**, not the exact organic-soil area lacking estimates. It can include non-organic area and organic area with an underlying estimate that the NaN product does not preserve. The existing 'no estimate for <m> km²' wording overstates what is known.

Use, for example: 'Incomplete model coverage: source raster cells covering about <m> km² within this 4° cell have missing estimates. Values sum the available raster cells.' Explain on Sources that this is raster footprint, not measured missing organic-soil area. Name the field accordingly, e.g. incomplete_source_footprint_km2. Never label a partial zero as a complete zero. Entirely missing coverage must show unknown, not 0. Current drainage/fire missing footprints agree in the saved data, but a release builder must check that before combining them; equal area totals alone would not establish equal masks.

The proposed zero sentence suggests a cause the aggregate cannot identify. Replace with: '0 assigned by this model for [component] in this period; this does not establish zero real-world emissions.' Possible product-wide causes can be explained separately without assigning them to this cell. The user-facing assessment summary must also correct its unqualified 'zero means no organic soil mapped' statement.

## G1–G5

| Question | Answer |
|---|---|
| G1: overlap | Yes to additive overlap fractions in the documented CEA grid, treating each source-cell total as uniformly distributed within that source cell. No second multiplication by organic-soil percentage and no second annualisation. 'Exact' applies to geometric weights under this assumption, not ground truth or 30 m recovery. Missing footprint requires H2's interpretation. |
| G2: precision/uncertainty | Two significant figures are suitable display rounding, not an accuracy guarantee. Keep a short nearby sentence: 'Substantial model uncertainty; local uncertainty is not quantified.' Sources can carry the 2021–24 EF-only 1.50–3.97 Gt scenario range and combined approximately 0.7–4.5 Gt envelope, clearly global sensitivity scenarios, not local confidence intervals or a percentage to apply to every cell. |
| G3: zeros | Current wording does not pass. Use H1's preserved state and H2's neutral zero explanation. |
| G4: discrepancy | Inspect the small tables archive before release, within Chad's authorised next scope. Record exact archive/version/hash and compare like-for-like global totals, period, components, masks and tabulation rules. Downloading tables may establish a documented product difference without fully explaining its cause; do not promise it necessarily resolves everything. 2.696 rounds to 2.70 at two decimal places, so simple rounding does not reconcile 2.69. If still unexplained, return it explicitly for a bounded decision; do not claim exact reproduction of the paper. The 1145.5 vs 1144 Mha difference likewise supports close agreement, not an established explanation from CEA vs geodesic areas. |
| G5: periods | A collapsed disclosure can support the intended presentation, with no charts, arrows, percentage changes or trend calculations. Replace categorical 'differences are not a trend' with 'Differences between periods must not be interpreted as measured local change: input coverage and timing can affect them; several infrastructure layers are static.' The paper cautions about trends; it does not establish every jump as entirely an input artefact. Keep period labels on each row and the caveat visible when the table is open. |

The primary methods support period-average annual estimates, static infrastructure and partially changing inputs. The limitations support caution about temporal inference, missed fires, missing tropical undrained fire factors, incomplete extraction coverage, and lack of drainage-age/rewetting treatment. Proposed Sources wording should cover these proportionately. Use 'Organic-soil emissions (modelled)' or equally specific explanatory wording so 'Soil carbon' is not mistaken for carbon stock/depth.

## Presentation and release preparation

Support S1 in its corrected form: containing 4° cell, 2021–2024 average, drained/burned separate, modelled not measured, two significant figures, optional older periods, no globe layer. Distinguish a whole-cell total from a selected-point or per-area value.

Support S2/P1: pinned derivative in page repository, explicit attribution, changes described, version retained. CC BY reuse remains grounded in the official licence evidence, not a licence assumption. P2 provides no necessary benefit for this bounded release.

Support S3's monthly/quarterly source check as a maintenance policy. No automation has been created. Record who checks and what is checked, and never relabel an old source check as current.

S4: recommend waiting for one corrected packet/recheck, then Chad's fixture-preview go. Current positive, missing and sparse-cell states are not yet a sound preview contract.

Fixture confirmations from saved outputs: 22_70 large values; 21_29 smaller values; 38_39 incomplete 2011–15/2016–20 with zero burned sums over available pixels; 13_27 mapped-soil/zero values (area 0.1 km² in the derivative); 14_49 absent from both sparse representations. Absence is not self-explaining: define the full 45×90 domain and sparse omission semantics in validated metadata before treating an omitted cell as no mapped organic soil. A missing/invalid table, missing period or malformed record must remain unavailable, never a default zero. Include 31_78 as the small-positive-area regression fixture.

Before a reproducible release build, validate expected input hashes, grid/CRS/transform alignment with extent, 1000 m north-up cell dimensions, period/component tags, finite values/allowed NaN and extent range. cells4.py currently assumes those properties, uses 1 km² constants and handles NaN rather than all invalid/non-finite inputs. Supply bounded fail-closed checks in the eventual builder, and include geometry/conservation/no-data controls. No broad test expansion or repeat full run is requested just for unchanged assessment prose. Preserve full coverage/missing-state flags before rounding. Clarify peak_rss_MB units/platform if that diagnostic is retained; ru_maxrss/1024 is Linux MiB, not portable macOS MB.

Integration: the next release must preserve Animals C1a and Timeline R4 on fresh main. Animals check 13e's precise Sources addition cannot be handled by a blind NC_MAIN bump; review the narrow suite maintenance against the actual integrated baseline. Do not move BASE_MAIN to suppress failures. 72ea123 is this older assessment reference, not verified current main. No current-main identity was established through the shell, whose GitHub DNS failed during orientation.

## Next message to Claude

GPT review: HOLD on the current derivative/state contract; aggregation approach accepted in principle. Please prepare one corrected assessment packet, keeping soil as the only active implementation stream. Fix the exported organic-area rounding defect (42 positive-area cells become 0.0; 12 have positive emissions in some period), preserve explicit unrounded state flags, and include the final-table assembly script plus focused controls. Reword missing_km2 as incomplete source-raster footprint, use a neutral model-zero explanation, and soften categorical no-trend claims. Inspect/reconcile the small tables archive on Chad's go; do not repeat the two large downloads. Record remaining total/area differences honestly. I support corrected S1, P1 and the proposed maintenance cadence; return the packet before Chad's fixture-preview go. No hub work or deployment.

Input SHA256 identities:
- Proposal (8387 B): 4bf50a5cbb5278a1b10de9a69e373941912551023b956407bb0e16f187a7c84a
- Notes (11802 B): 5c5463dd13783132f0276057ef3340de6c4693bd755408abe1db18fc740578ae
- cells4.py (5819 B): 37dbff270358b367a61fa708b7ad47b82700d1466d92d25011a003bda5552c77
