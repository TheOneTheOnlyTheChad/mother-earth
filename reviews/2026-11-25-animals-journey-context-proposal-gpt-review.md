# Animals journey context — proposal review

25 Nov 2026 · GPT · proposal `3c07ecd`, rev 1

**Direction accepted for a bounded evidence step, with the corrections below. No build or release clearance.** This can stay in one Animals implementation thread through evidence, build, review, release and close-out. Email-dependent Animals work stays parked and does not block this feature.

Read the proposal, Nature handoff and original spec from the hash-checked Mac packet. Inspected the shipped zebra and corridor data and the hub grid/area definitions. This is not a fresh audit of all Animals work or a live-site test. Refresh main before implementation: the proposal predates the completed Timeline R4 release and its Animals TL_MAIN pin.

## Decisions J-D1 to J-D6

| Decision | GPT recommendation |
|---|---|
| J-D1 | Already covered in principle by Chad's standing acceptance of dated/modelled context. Record that policy and its applicability here; do not ask him to approve the same exception again. It does not clear an unreviewed product or method. |
| J-D2 | **C:** zebra and East Walker only; no new sea-card sentence in this slice. Existing exclusions are enough. “Recorded at sea” is too absolute for a track whose colony fixes were withheld; product applicability also cannot be inferred solely from calling an animal marine. |
| J-D3 | **A**, fires and annual tree-cover loss as candidates for evidence review. Either may remain unavailable or be deferred if the source/method does not pass. Neither is mandatory at the expense of correct meaning. |
| J-D4 | **A**, fixed 4° regional cells, with the selection and boundary rules below. No bounding-box substitute or inferred route exposure. |
| J-D5 | **B**, omit the present-day link for this first release. It adds a second time context and cell-link dependency without helping finish the bounded historical slice. It can be proposed later. In particular, never hard-code “November 2026” as what “today” means. |
| J-D6 | **A**, MODIS standard-processing for both, subject to product/platform/collection verification. This avoids introducing VIIRS as a second product. It does not make detection rates perfectly comparable across years. |

These are recommendations for Chad to adopt in his reply, not decisions silently attributed to him. The standing exception itself was already his decision.

## Required corrections in the evidence record/build brief

### A. Time and the kind of record

The zebra's retained fixes run from **25 Oct 2007 08:01:53 UTC to 22 Oct 2008 23:00:45 UTC**, independently checked from the shipped file. Fire counts should use an explicitly defined UTC interval tied to those dates; if whole days are used, disclose the partial endpoint-day extension. Monthly subtotals must not silently include the rest of October at either end.

Annual tree-cover loss cannot be matched to those partial years. Label it **“Mapped tree-cover loss in the calendar years 2007 and 2008; these years extend beyond the recorded journey.”** Do not describe both products as covering “the same period”. Keep the mismatch adjacent to the value, even when the closing disclaimer is present.

East Walker is a published corridor/use-area dataset assembled from 2017–2024 records, not one animal's continuous journey. Use “Corridor data years: 2017–2024” and regional calendar-year observations. Do not imply that all those years had continuous tracking or infer particular seasonal dates. Prefer a neutral heading such as **“Historical regional land context”** over “The land around it, at the time” for both cards.

### B. Region, area and sensitivity

I independently reproduced the zebra's **17_50 and 17_51** cells from its retained fixes, and the shipped corridor's outer vertices fall in **32_15**. The grid agrees with the hub: latitude from −90, longitude from −180, 4° increments.

Using the hub's spherical-area formula, each zebra cell is about **185,861 km²**, so their union is about **371,722 km²**, not the proposal's illustrative 180,000. The corridor cell is about 151,515 km². Show the union's computed area and bounds; these are very broad regions, not an animal's surroundings at route scale.

Define “touched” precisely. For the zebra, prefer **cells containing the retained displayed fixes**, with no inferred intermediate segment cells. For East Walker use only the already shipped Medium geometry. Freeze the exact cell set against the source-file hash. Use half-open boundary ownership consistent with the hub, unique cells, and a union mask so shared boundaries are never counted twice. If a provider request covers a larger bounding box, clip to the exact selected cell union before aggregation. Add no withheld fixes or Low-class geometry.

### C. FIRMS contract, coverage and resource budget

The official Area API page I opened specifies **1–5 days per request**, not ten. It also distinguishes a transaction allowance from a simple HTTP-request count. Replace the 37/292 request estimates with a bounded plan verified against the actual supported historical endpoint. A different limit is usable only with evidence for that exact endpoint.

Specify MODIS product/collection, constituent satellites, confidence/filter policy, UTC boundaries, duplicate/chunk-boundary handling and revision provenance. Count detections, never unique fires, and do not interpret a no-detection result as no fire. A complete API response is not proof of clear-sky observation or local detectability.

NASA's missing-data table lists database gaps by satellite/type/date. It does not establish local cloud-free coverage. If the table is unavailable or unparseable, coverage is unknown; do not treat it as an empty gap list. Distinguish failed requests, known database gaps and observation limitations. Partial counts need their own coverage label and must not look like complete totals.

Use the shared map key without printing it or retaining keyed URLs in logs, cache manifests, error reports or public files. Predeclare the request/transaction ceiling, delay/retry cap, private cache size and stopping rule. Check that this work does not consume the live collector's needed allowance. One small zebra pilot is enough for the first measurement; do not launch an eight-year corridor extraction as an incidental dry run.

### D. Tree-cover loss meaning and aggregation

Pin one release covering the required years; v1.13 is currently discoverable, so “v1.13 appears” is not a frozen version decision. Read its notes before selecting it. The original download page cautions against definitive area estimates from raw loss-pixel counts and describes methodological changes across years. Do not present the resulting hectares as a precise measured total or compare the two journeys as a trend.

If area is retained, label it **approximate mapped loss area**, document the limitation, and calculate physical pixel area from the actual raster georeferencing. Do not multiply every pixel by an assumed 30 × 30 m. Preserve the land/water/no-data mask; the proposed two bands alone are insufficient to establish missingness. An unmapped area is not zero.

State that a chosen canopy threshold applies to **treecover2000**, not reconstructed canopy in 2007 or 2017. Retain the selected years and threshold in the output metadata. Loss is gross mapped tree-cover loss, not automatically deforestation, net loss or a fire cause. Verify actual raster encoding and resolution rather than resolving inconsistencies in catalogue prose by assumption. Rights, attribution and retrieval/version hashes belong in the evidence record.

### E. Output and tests

Retain enough private input hashes and a reproducible method to regenerate the aggregates; serve only the bounded aggregate file and public provenance. Separate downloading from an offline deterministic builder/check: `--check` must not make provider calls or mutate pins.

Add focused cases for endpoint days, whole-calendar-year mismatch, shared-cell boundaries, duplicated request rows, unknown gaps, partial coverage, valid zero versus no-data, changed source/version and wrong context pin. Keep the disclaimer, but test meaning and states rather than a blanket forbidden-word scan: the required disclaimer itself contains “affected”, which the proposal's absolute word ban would reject.

Build on fresh main and preserve the current Timeline R4 TL_MAIN pin, Nature NC_MAIN/NC_PARENT, BASE_MAIN, hub alignment and all existing Animals guarantees. No pin moves simply to hide failures. No hub change, schedule, new account or provider correspondence is part of this slice.

## Source checks performed for this review

Official pages opened on 25 Nov 2026 (targeted contract check, not completed dataset assessment):

- NASA FIRMS Area API: https://firms.modaps.eosdis.nasa.gov/api/area/ — dated-query semantics, documented day range and transaction allowance.
- NASA missing-data API page: https://firms.modaps.eosdis.nasa.gov/api/missing_data/ — meaning of listed gaps. Its table failed to load in this read; no historical gap result is certified.
- Hansen/UMD v1.13 download and user notes: https://storage.googleapis.com/earthenginepartners-hansen/GFC-2025-v1.13/download.html — method/area caveats, bands and release details.
- Earth Engine v1.13 catalogue: https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2025_v1_13 — band definitions, time coverage and mask. No Earth Engine account is needed merely to assess the direct-download route.

No key, fire detection, raster tile or author email was fetched for this review. No new software, provider account or automated update task was created. Source refresh should follow the standing policy: check for relevant revisions before a later release and at a documented periodic maintenance interval; old released bytes remain immutable.

## Next action and thread ownership

Claude can incorporate these corrections directly into the bounded evidence record and build brief; a separate proposal-only revision/review cycle is unnecessary unless scope changes. Chad should adopt or amend the decision table and give his evidence-step go. Before a pilot provider request or large download, prepare its exact bounds/resource plan within that authorised scope. Return the source evidence, measured pilot and brief for GPT review before asking to build.

Keep this implementation in the Animals thread through its own completion. IUCN and other reply-dependent features remain parked, not dependencies. Nature soil/global-alert work stays queued until Chad resumes it; no parallel feature work is started by this review.
