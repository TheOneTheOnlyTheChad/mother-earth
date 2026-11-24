Mother Earth — Nature context: satellite alerts, soil carbon and recorded journeys
Revision 1 · 23 November 2026 · Prepared by GPT for Chad and Claude
Status: proposal for assessment and staged preview. Chad requested this specification; this document does not authorise implementation, provider correspondence, new accounts, spending, schedules, production writes, merges or deployment. Chad owns and approves; Claude implements and deploys; GPT independently reviews.
1. Purpose and outcome
Mother Earth is Chad's personal control centre and foundation for building other things. It is temporarily accessible during feature development, with access restriction planned. Intended purpose and present technical visibility must remain distinct when assessing data reuse.
Extend the centre's ability to explain what is known about a place by bringing together existing forest-disturbance and fire observations, a possible soil-carbon context layer, and eventually the landscapes around recorded animal journeys.
The motivating question is: “What observations and environmental context do we have for this place, and from when?”
The feature must make observation dates, confidence, resolution, coverage and unknowns visible. Putting datasets beside each other does not establish a causal relationship or demonstrate an impact on an animal.
2. Evidence and existing baseline
This proposal follows the November 2026 Global Nature Watch newsletter and an initial read of official WRI, EarthRanger and Horizon pages on 23 November. It is not a completed dataset, licence, API or scientific-method assessment.
The local project mirror was inspected at /Users/chadobie/Documents/Mother Earth/. It has no Git checkout available to GPT. The following are code/document findings, not a fresh live-service verification:
Existing capability	Inspected basis	Consequence
GNW integrated forest alerts	phase1/worker.js, forest section and URLS.forest	GNW is already a source; avoid a duplicate collector by default.
Forest counts grouped by nominal/high/highest confidence	forestQuery	Preserve confidence groups and investigate changed source semantics before altering them.
Six 4° land cells queried per scheduled run; 559 tropical cells; seven-day query window	Forest constants and collector	Cell counts cannot locate an alert along a precise animal route. Individual cells have different query times.
Partial coverage within the selected tropical cells; unknown outside	Forest comments and sources.html	A missing count cannot become “no disturbance.”
FIRMS fire observations	Existing sources documentation	Assess overlap before adding GNW fire alerts. Do not sum equivalent detections from two delivery paths.
Recorded animal journeys	Current project handover	They are dated archives. Current environmental observations are not conditions experienced during those journeys.
The source query filters an alert-date field, while existing explanatory text uses publication-window wording. Stage 0 must resolve the provider's exact field meaning and align any proposed wording; this specification does not certify the existing wording or require a collector rewrite.
Refresh current main, deployed hub and relevant branch baselines before implementation. The latest local STATUS reports hub 0.6.23 deployed from the reviewed Earth branch, while main's Worker was older. Never deploy a Worker from stale main to add this feature. Coordinate any future Worker integration with the Earth from Space owner.
3. Scope and priorities
Workstream	Proposed priority	Deliverable
A. Existing observations in one place	First preview	One place-context section presenting existing forest and fire information with separate dates and limitations.
B. Soil carbon	Separate assessment, then optional preview	One scientifically coherent, dated product chosen after source review.
C. Recorded journey context	Later, separate proposal	Landscape context beside a recorded journey, with explicit time alignment or mismatch.
D. Horizon	Research aid	Assess its datasets and interaction ideas. No dependency on a presumed API.
E. EarthRanger/SMART	Reference workflow	Learn from integration design; no EarthRanger, SMART or Gundi installation required.
Exclude patrol dispatch, emergency response, habitat-impact scoring, automated conservation decisions, provider messaging and a new notification service from this first slice. Do not make this work a prerequisite for the existing Animals release or treat it as resolving IUCN R1.
4. Workstream A — place context
Use the existing place-view structure if a short UX assessment confirms it fits. Do not add a top-level tab solely for this first slice.
The preview shows a compact “Nature context” section for one selected place:
* Forest disturbance: counts and confidence groups for the containing 4° cell, its query window and query time, source dataset/version when available, and coverage status.
* Fire observations: the existing source's detections, observation period and spatial scope. Preserve established FIRMS caveats: detections are not unique fires; absence of detections is not proof of absence.
* Soil carbon: absent until Workstream B is accepted; if shown later, clearly identify its historical period and measurement/model meaning.
* Sources and limits: direct provenance and a short explanation of what the values can support.
A selected point is not an exact observation location when its value is aggregated over a cell. Say “Containing 4° cell” adjacent to that value. Show geographic scope visibly; a cell outline is preferable where the existing map supports it without disproportionate work. Do not place a precise alert marker at the selected point or cell centre.
Keep controls compatible with the existing layer-switch pattern. Viewing context does not silently enable several globe layers. Any new optional layer starts off and follows Chad's current bare-start preference.
Use explicit loading, available, partial, stale, unavailable and outside-coverage states as applicable. Preserve the timestamp of retained data after a failed refresh. Show zero only when a valid source response and the metric's coverage support that zero. A missing or refused dataset remains visibly unavailable.
The first preview uses fixtures and makes no new provider requests. It may reuse already-loaded page data where appropriate; any new hub route or request requires a separate bounded implementation proposal.
5. Alert dates, confidence and completeness
EarthRanger documents that its GNW integration can miss alerts which reach the selected confidence after their original detection date leaves the lookback window. This is evidence about that integration, not proof of the same defect in Mother Earth's collector.
Before proposing an ingestion change, establish the GNW API's actual date fields, update behaviour, stable identity, query limits, versioning and confidence transitions.
Concept	Required treatment
First detection	Describe only as the provider defines it; never equate it with the date land was cleared.
Publication/update time	Keep distinct from detection time when supplied.
Confidence	Preserve documented source categories; do not present them as calibrated probabilities without evidence.
Confidence-change time	Retain if supplied; otherwise state that it is unavailable. Do not manufacture it from retrieval time.
Retrieval time	Records when our system obtained data; it is not the event time.
Query interval/version	Retain alongside each result, including whether boundaries are inclusive or exclusive.
Where only aggregate counts are available, do not imply an individual-alert history, deduplication capability or confidence-transition history. If event-level ingestion is proposed later, define stable identity, updates, duplicates, historical replay and bounded reconciliation before building it. A longer lookback alone is not proof of completeness.
Do not add GNW fire ingestion until an assessment establishes a useful difference from existing FIRMS data, its source lineage and a rule preventing double counting. Two feeds derived from the same observation are not independent corroboration.
6. Workstream B — soil carbon
Assess the products linked from WRI's soil-carbon analysis and the underlying primary research. Select one product for a first preview; do not combine their values into a single undifferentiated score.
Product concept	Question it could answer	Required distinction
Soil organic-carbon stock	How much carbon is estimated in a defined soil depth?	Stock, depth interval, reference period and units.
Stock change	How has estimated stored carbon changed over a specified period?	Net change, comparison dates, depth and method.
Disturbed organic-soil emissions	What emissions are estimated from mapped drainage/fire disturbance?	Modelled emissions, included gases, CO₂-equivalent convention, period and assumptions.
WRI's article distinguishes organic-soil emission-factor estimates from mineral-soil stock changes. Its global headline is not a ready-made local measurement and must not be copied into a live globe counter. The initial feature must not claim that a current fire detection caused a quantified soil-carbon release.
The assessment must record exact dataset identifiers, releases, download/API access, resolution, geographic coverage, no-data treatment, depth, units, temporal support, uncertainty, aggregation limits, licence, attribution and derivative/redistribution conditions. Read the applicable methods and primary study before approving reader-facing scientific claims.
Prefer a bounded, reproducible snapshot or supported tile product if permitted and practical. Measure transfer, memory and storage costs before choosing architecture. A nominal 30 m source does not require fetching or displaying a global 30 m raster. Any downsampling must use a defensible method for the variable and retain no-data distinctions.
The product label must identify it as dated/modelled context where applicable. Any exception to the project's live-feed rule needs Chad's decision; the Animals archive exception does not automatically cover soil-carbon products.
7. Workstream C — recorded journey context
Keep an animal's recorded track, event dates, habitat data and current observations independently labelled. For example: “Recorded journey: 2007–08. Forest observations: November 2026. These describe different periods.”
Do not label present-day alerts as threats that the animal encountered. Use period-matched information only when that product actually covers the journey's dates and geography. State when historical context is unavailable.
An exact route intersection or distance-to-alert claim requires suitable source geometry, justified spatial accuracy and a reviewed method. Existing 4° forest counts support regional context only. A route buffer width must not imply biological habitat use or a home range without evidence. No automated route buffer is selected in this revision.
Do not infer animal distress, population change, mortality, habitat suitability or a causal impact from overlap. Animal-location sensitivity and reuse permissions remain governed by the existing Animals decisions.
8. Workstream D — Horizon and external integrations
Horizon can inform dataset discovery and UX research. Its official page currently describes interoperability as coming soon and cautions that AI summaries can be incomplete or incorrect. Do not assume an accessible API, stable export contract or permission to redistribute generated outputs.
If a useful dataset is discovered through Horizon, evaluate the underlying source directly. Keep generated prose out of Mother Earth's factual ingestion path unless it receives its own evidence and review process. No embedded AI assistant is specified here.
EarthRanger/SMART demonstrate a useful pattern: satellite observations shown with field information. Mother Earth can adopt that information structure without adopting an operational conservation-management platform.
9. Delivery stages and review boundaries
Stage	Deliverable	Completion evidence
0 — source and overlap assessment	Inventory existing capabilities; resolve alert-date semantics; assess candidate soil products, rights, costs and gaps; recommend the smallest useful slice.	Exact sources and terms, current code baseline, access/cost findings and clear unresolved points. No provider enquiry without Chad's instruction.
1 — fixture preview	Place-context panel with forest/fire examples and honest spatial/temporal labels. Soil fixture only after a candidate's scientific meaning is established.	Reviewable branch, fixture descriptions, screenshots only if requested as deliverables, meaningful automated checks and desktop interaction review. No new live integration.
2 — bounded integration	Exact data path, configuration, request/storage limits, failure behaviour, privacy compatibility and rollback.	Measured resource use, reproducible data/package hashes, relevant regression results, GPT review and Chad's separate action lines.
3 — journey context	Separate proposal based on lessons from the place preview.	Period/geometry assessment, limitations and reviewable examples before build approval.
The recommended next job for Claude is Stage 0, returned as a docs-only assessment with a concrete Stage 1 preview plan. This recommendation is not a build or production approval. No background collection, webinar registration or reminder is created by this specification.
10. Acceptance criteria
Before an integration release can be recommended:
1. The feature answers a useful place question using existing data wherever sufficient; no unexplained duplicate forest/fire feed.
2. Every displayed value identifies its spatial scope, temporal support, units, source and coverage; retrieval time cannot disguise stale observations.
3. A 4° aggregate cannot appear as a precise alert. Unknown/outside coverage cannot appear as zero or “safe.”
4. Fixtures cover success, zero where valid, partial coverage, outside coverage, failure with/without retained data, mismatched periods, and relevant unknown confidence/schema values.
5. Any proposed update/reconciliation logic is challenged with a late confidence upgrade, an alert outside the lookback, a duplicate and a revised source record. Aggregate-only previews explicitly state those limits instead of claiming event-level handling.
6. Soil examples distinguish stock, stock change and emissions, including depth, time interval and units. Invalid/no-data values cannot acquire a plausible colour.
7. Journey examples show date mismatches; no causal or precise intersection claim exceeds the evidence.
8. Controls work with mouse and keyboard; labels and focus are clear; narrow layout has no horizontal overflow. Real phone/Safari/screen-reader checks remain explicitly unverified until actually performed, consistent with Chad's desktop-first preference.
9. The feature preserves source citations and the current access design. Secrets stay out of page bundles, URLs and repository data. Present accessibility is assessed when deciding redistribution rights.
10. Costs and request budgets are measured for the selected path. Material incremental spending requires Chad's approval. Relevant regressions pass on an integrated current baseline; broader tests follow actual shared-file risk.
11. Decisions still needed
* Chad's go for Stage 0 when he wants this work picked up.
* Whether a dated soil-carbon context exception is wanted, once a specific product is assessed.
* Which place provides a useful first fixture; recommend a place within the existing forest coverage, with both valid-data and unavailable examples. Do not imply Cape Town has tropical forest-alert coverage.
* Whether journey context is worth pursuing after the place preview.
Earth from Space monitoring, private-access migration and IUCN R1 keep their existing ownership and review boundaries. This proposal does not reopen settled reviews or authorise changes to them.
12. Sources and follow-up reading
Official pages consulted 23 November 2026. These support the opportunity assessment and documented integration caveats, not blanket data-reuse permission. Recheck the selected dataset's current terms and technical contract at Stage 0.
* WRI webinar, Connecting Satellite Alerts to Conservation Action: Integrating Global Nature Watch, EarthRanger, and SMART, 3 December 2026, 09:00–10:00 EST / 16:00–17:00 SAST: https://hub.wri.org/events/2026/12/connecting-satellite-alerts-conservation-action-integrating-global-nature-watch
* EarthRanger support, Global Nature Watch (GNW) — Gundi integration, confidence consolidation, lookback limits and latency: https://support.earthranger.com/en_US/remote-imagery/global-forest-watch
* WRI, Soils Emit Massive Amounts of Greenhouse Gases. Here’s What’s Behind It: https://www.wri.org/insights/soil-carbon-explained
* Global Nature Watch Horizon — preview, source-verification caveat and planned interoperability: https://horizon.globalnaturewatch.org/
* WRI, Global Forest Watch Becomes Global Nature Watch, Expanding to Cover More Land Ecosystems: https://www.wri.org/news/release-global-forest-watch-becomes-global-nature-watch-expanding-cover-more-land-ecosystems
* Primary research to read during Stage 0: Glen et al. (2026), Mapping global organic soil disturbance and associated greenhouse gas emissions, 2001–2024, DOI https://doi.org/10.3389/fenvs.2026.1761716. Located during initial search; the full paper has not been critically reviewed for this specification.
Project evidence: current USER-PREFERENCES.txt; GPT evening handover of 23 November; local project STATUS.md; phase1/worker.js forest section; sources.html forest/fire limitations. Local code inspection is not production verification.
