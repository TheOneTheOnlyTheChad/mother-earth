# Nature context — Stage 0 review

24 November 2026 · Independent GPT review for Chad

**Outcome: accept the Stage 0 findings and the existing-panel direction. Targeted rev 2 required before treating the Stage 1 plan as build-ready. No new collector, soil integration, provider request, account action or release is cleared.**

Read the proposal, research notes and filed GPT spec from the Mac, then checked all three against repository commit 318899f: bytes match. Inspected the current forest collector, place endpoint, page rows, inspector and forest_daily schema. Independently read public GNW metadata/version/fields and the Zenodo release metadata, data guide, licence/attribution file, data dictionary and release manifest. Read targeted sections of the primary Glen paper. No raster archive was downloaded, no query endpoint called, no live hub/account action made.

Claude's dated live-cell counts/times remain Claude's observations; GPT did not independently rerun that sweep or live-cell audit.

## 1. Main rulings

Improve the existing Everything here panel. The documented functionality already covers much of the spec; a new section/tab would add duplication.

The implementation confirms both core defects: its SQL filters date >= since while page wording says published in seven days; the place-row stale flag uses the envelope timestamp rather than the forest cell's queried_at. Correct them together across the relevant page surfaces.

**Do not simply move Animals BASE_MAIN.** That is not equivalent to moving the separate Timeline release pin. BASE_MAIN predates the original Animals links/header changes; several comparisons deliberately subtract those changes from current pages before comparing. Advancing it to an Animals-era commit can invalidate those assumptions and silently rebaseline 16 unrelated scripts. Coordinate a narrow, reviewed exception/baseline for app.js and affected pages/style expectations while preserving every other comparison. Give the Animals owner the exact accepted page commit and scope; do not commission a broad baseline rewrite.

## 2. Answers to G1–G6

| Question | Ruling |
| --- | --- |
| G1 — earliest detection/date fields | **Yes.** The provider's cautions explicitly define the integrated date as earliest detection; the field itself has no description in the inspected fields response. Preserve detection, retrieval and confidence separately. No inspected field supplies a confidence-transition timestamp. Metadata for a whole version is not a per-pixel publication time. |
| G2 — since to version date | **Use the narrower statement by default:** first detected on or after <since>, as held in version <id>, queried <time>. SQL has no explicit upper bound. A verified version content_date_range can be shown separately as dataset temporal coverage, not as an invented SQL end or completeness guarantee. The page currently stores the version id, not that metadata; do not silently derive a certified content date from a vYYYYMMDD name. |
| G3 — zero within masks | **Broadly yes, with partial-coverage wording.** Say no matching alert pixels were returned within the contributing systems' monitored tree-cover/forest masks, for the stated version/filter. This is not proof of no disturbance or complete monitoring. GLAD-L's documented mask includes specified gain areas and loss exclusions as well as its year-2000 tree-cover basis; do not simplify it to a static 2000 mask. Latitude inclusion alone is not forest coverage. |
| G4 — four-day stale limit | **Accept as a provisional operational display threshold, subject to Chad's choice.** Show the cell's actual query age at all times; distinguish it from layer-envelope age and dataset age. Four days is not a provider guarantee or evidence of completeness. Window overlap with the last seven days measures a different thing and should not replace query-age freshness. |
| G5 — soil aggregation/card | **Area-weighted summation is defensible for the supplied per-cell extensive totals, with qualifications in section 5.** For a later first card, use the latest reporting period and show drainage and fire separately; a clearly named combined total is optional after verifying component/mask semantics. No current-fire attribution or soil-stock claim. |
| G6 — other acceptance gaps | Yes: mixed-window totals, unavailable metadata/dates, unknown labels, failed-refresh/retained combinations, and the retained-query wording need explicit handling. Most importantly, correct the proposed Animals baseline migration. See below. |

## 3. Targeted corrections for rev 2

### A. Date wording must remain correct after today's sample

Do not replace seven days with a hardcoded about 7–10 days. Retries keep pending_since; no maximum retry age is enforced, and future windows need not fit that range. The observed range can stay as dated evidence, not a production promise.

For a whole-layer total, say it is a sum across cells with different filters, versions and query times. An earliest-since/latest-content-date envelope is not a common interval and does not mean all cells were checked across it. Do not present it as a simultaneous observation or use it to infer trends.

If version is latest/unresolved, or since is absent/invalid, say which provenance is unknown. Do not fabricate an end date or silently substitute the envelope's window. The fixture plan should cover both cases.

N3: replace the forest inspector's incorrect Quantity wording with a corrected page-owned description, or omit that specific obsolete description. Keep source links, value, coverage, dates and caveats. Do not leave known misinformation under a hub-wording label as the main description.

Include a dated correction to the existing REGISTER explanation through the project's normal authority; preserve its original sample and do not rewrite history. Track the hub string separately for its owner: no opportunistic hub deploy, particularly during an Earth from Space trial window.

### B. Freshness must be orthogonal to validity and coverage

At a fixed test clock, exercise just below, exactly at and just above the chosen threshold. The proposal says more than four days, so equality itself is not old. Missing, malformed and implausibly future timestamps must not appear fresh.

A freshly queried old dataset still needs its own dataset/version date visible. A failed envelope refresh with a retained cell keeps the cell's original value/time and clearly reports the refresh failure where known. The forest place endpoint can return state=ok with source_status=down when a cell exists; handle that combination deliberately rather than relying only on the state word.

Keep partial coverage visible even when the query is recent or the count zero. Add failure with retained data, failure without data, prolonged retries and valid zero with partial coverage to the fixtures.

### C. Unknown confidence and collection wording

The live cell object keeps unexpected confidence keys, but count sums only nominal/high/highest. Do not label that count an all-category total if unknown nonzero groups exist. Show the extra category as unrecognised and qualify/withhold the total as appropriate. Do not treat adding every unknown value to a sum as an automatically safe future hub fix; validate its meaning and numeric form first.

forest_daily has PRIMARY KEY(cell_id,date), and INSERT OR REPLACE retains at most one snapshot per cell per UTC day. The collection count is retained daily snapshots, not a complete count/history of successful queries. Correct the page wording accordingly; do not imply individual pixel histories or confidence-transition tracking.

### D. Shared-file plan

Return the exact per-file scope and the narrow Animals test migration, not a blanket BASE_MAIN advance. Distinguish the fixture-preview implementation from a later page release. A preview still makes no new GNW data queries; reading metadata in this review does not authorise runtime metadata fetching.

The Stage 0 findings support proceeding to this corrected preview plan. They do not require the unrelated soil/global-alert work to finish first.

## 4. Recommendations on N1–N6

- **N1: yes**, improve the existing panel.
- **N2: yes**, correct all misleading page/report/Sources surfaces together, plus the dated record correction. A page release still needs its own reviewed candidate and Chad's line.
- **N3: corrected page-owned replacement preferred**; otherwise hide only the obsolete forest Quantity row until the hub owner updates it.
- **N4: four days is acceptable provisionally**, with actual age always visible and the stated limits above. A nominal ~47-hour sweep assumes successful forward progress; six repeatedly pending cells can consume a run, so nominal cadence is not a refresh SLA.
- **N5: C1 is a credible candidate for a specifically dated/modelled exception.** Recommend allowing its next bounded methods/aggregation assessment if Chad wants it; do not yet clear a soil card, archive download, pinned derivative or production exception. This is not soil stock or a live flux sensor.
- **N6: park it or commission separately.** Global product reach does not prove local usable coverage or affordable sweep timing. It is not needed for the corrective preview.

## 5. Soil C1 — bounded product judgement

The official record/data guide supports treating the public 1 km files as period-average annual model totals per grid cell, with drainage/fire components and a separate static extent map. It specifies additive emissions aggregation, annualisation, missing-value cautions, and distinguishes native-cell values from averaged display overviews. The release licence file identifies the outputs/documentation separately from model-code and third-party input terms.

A later four-degree aggregation can use:

    F(C) = sum_i F(i) × area(C intersect i) / area(i)

Here F(i) is already a per-cell annual total. Use actual projected cell intersections in the documented equal-area CRS, not degree fractions, pixel counts alone or a second multiplication by organic-soil percentage. Partial-pixel weighting assumes uniform distribution within that 1 km source cell; it does not recover 30 m detail.

Use native COG cells, not display overviews. Keep periods/components and valid-data masks separate. An all-missing cell is unknown; a partially missing cell is a sum over available model pixels, not an unqualified complete estimate. Track available/missing area and keep model-assigned zeros distinct from a claim of no real flux.

The documentation says there is no 1 km categorical state layer. Do not claim the aggregated rasters alone can identify every local zero's reason or every unsupported emission-factor stratum. That limitation needs an honest product-level caveat unless additional reviewed inputs provide it.

Use 2021–2024 as a four-year reporting period with annual averages, not a 2024 observation. Do not divide already annualised values again. Do not add totals to component gases or compare historical fire emissions with today's FIRMS detections as a cause. Scenario envelopes in the paper are not local-cell confidence intervals.

The declared dimensions imply about **2.04 GB per Float32 array**, or 20.4 GB for ten raw arrays. That is arithmetic, not a measured peak or extracted archive size. A 213 MB compressed archive does not justify loading all rasters at once. A later bounded proposal must measure windowed transfer/disk/memory use and conservation/edge/no-data tests before selecting architecture. Country-table totals need not exactly equal raster sums because boundaries/masks/weights differ.

No raster was read in this review. State_codes was not read in full, and no numerical derivative or complete methods/status audit is cleared.

## 6. Evidence and record hygiene

Independently inspected code: forestQuery/collectForest; placeSection/placeCollection; ME.placeRows; inspector/windowText/report wording; forest_daily schema. No new tests were run for this docs-only review.

Primary references:
- GNW dataset, version and fields: https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts ; /v20261123 ; /v20261123/fields
- Zenodo dataset metadata: https://zenodo.org/api/records/22137130
- Official text files read through their API content links: license_and_attribution.md, readme_data.md, data_dictionary.csv, release_manifest.csv. These are documentation/metadata reads, not raster downloads.
- Glen et al. primary methods: https://www.frontiersin.org/journals/environmental-science/articles/10.3389/fenvs.2026.1761716/full

The FIRMS/no-duplicate decision is accepted. The dated latest-version observations are not proof that GNW permanently discontinued that delivery path. Do not generalise them into a provider-wide shutdown claim.

Concurrency explains caution around Project STATUS, but not treating a stale Project copy as current. After the repository record settles, coordinate a fresh snapshot or explicitly mark the Project copy stale. No Project or repo file was edited by GPT.

Input identities at 318899f:
- Proposal: 13,861 bytes; SHA256 65bdf95787d1757c4fc977a3b80587ba7aeeccbf8b09ba4c9bbe0b5816a4eef9.
- Evidence: 14,640 bytes; SHA256 9e9fbf87b76cffdfb5892513885e3d984c801b9a4a2122451ea851aad961b0e2.
- Filed GPT spec: SHA256 68a0fc4f29cc40837d1858bc0cbe465853afad9b0bf9635e1b128da418943ce7, matching the supplied identity.

Chad remains the decision maker. Animals permissions, private access and Earth from Space remain separate; Stage D is not cleared by this assessment.

