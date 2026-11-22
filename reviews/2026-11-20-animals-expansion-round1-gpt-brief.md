# Animals: richer explorer — GPT research round 1 (relayed by Chad, 20 Nov 2026)

Filed on branch `animals-expansion-proposal`. GPT's text as Chad relayed it, unchanged below the line. GPT's research, not Chad's approval. Claude's response is `docs/concepts/ANIMALS-EXPANSION-PROPOSAL.md`.

---

Animals: richer explorer — research round 1 for Claude



20 November 2026. GPT's first research and design pass against the FULL concept. For discussion and a docs-only response, not implementation or production clearance.



Purpose and scope



Chad clarified that he wants the unstarted parts of Animals explored: what would make the eventual page richer, what additional sources are suitable, what existing enquiries could unlock, and what new enquiries are worth preparing. The earlier parked-readiness review covered the three-journey candidate and release documents; it did not answer this broader brief.



Read in full: concept rev 1, proposal rev 2.2, Claude's ANIMALS-SPEC-COVERAGE-2026-11-20.md, and the earlier sharks/dolphins audit. Current decisions and the later enquiries correction supersede historical “not sent / nothing built / no archive decision” text in those old proposals.



The original concept explicitly removes the former $0/month cap: Cloudflare is already paid for. We still estimate incremental costs and provider fees; this is not authority to spend. Existing Animals implementation stays parked. Research and proposal work can proceed without changing it, live infrastructure or the other thread's probe.



Recommended experience



Organise the page around three questions: Where did animals go? How are their populations changing? What does the evidence say about their future?



Keep Land / Sea / Air filters, and add a clear evidence-type label on every result: recorded fixes, interpolated/modelled movement, receiver detections, published corridor, population survey or dated assessment. Do not squeeze every result into a journey card. Penguin counts and whale population context can be valuable even without a replay.



Suggested next content package, conditional on audits:



Keep the existing zebra, shark and false killer whale journeys.



Add an African penguin population story, separate from any permissioned penguin foraging replay.



Add one whale recovery case tied to an explicitly named stock and evidence period.



Add one published land-mammal corridor with seasonal ranges/stopovers where supplied.



Audit one bird journey so Air has real content; consider one turtle later. More similar tags are a lower priority than a new kind of evidence.



These are recommendations for the eventual experience, not a condition that every module must launch together. Page modules need independent availability states and release boundaries.



Every unstarted or deferred area



Concept area



Proposed next work



Meaningful output / check



§3B migration corridors and seasonal distribution



Audit a CMS/GIUM product and a specific USGS herd layer; choose one



Actual downloadable geometry, method, season, contributing years/animals, rights and sensitivity; no inferred corridor from one replay



§6D African penguins



Audit the Dryad count dataset first; separately ask about an updated series and a suitable foraging product



Population chart with correct unit and missing-year treatment; movement permission is a separate issue



§6E recovery example



Audit a named IWC humpback stock and its underlying assessment



Dated population evidence with uncertainty; distinguish counts, model estimates and recovery classifications



Previously unopened source families



Use the findings below to select a few concrete products



A source name or a public map is not a completed data audit



§§7/13 date line



Specify crossing tests before adding global bird/whale/turtle tracks



179°E→179°W and reverse, polygons with holes/multiple pieces, globe joins, fitting the view and land tests; detect unsupported input before shipping



§4 several animals from one study



Start with a selector for a second zebra, not simultaneous tracks



Stable study+animal key, separate manifests, no stale response under a new selection; retain sample-versus-shown counts



§15 cost



Measure chosen prepared files and request pattern



Stored bytes, transfer per opened module, processing, provider fees and assumptions; estimate after choosing products



§§3C/3D/8 population and extinction risk



Audit per assessed population/taxon, not a universal category feed



Scope/date/unit explicit; no occurrence/tag counts as abundance; no blank chart axes without data



§11 historical environmental context



Begin with a static dated contextual view if justified by the paper



Product dates/resolution and study match documented; present-day wind/SST is not what the animal experienced



§12 ongoing feeds



Pick one provider/study only after access is understood



Separate observation/retrieval/public-delay times, completion, withholding, no-new-observation and retrieval failure



What the source research establishes



African penguin population: a concrete first candidate



Dryad DOI 10.5061/dryad.vx0k6djp7, Sherley and colleagues, published 2021, lists Afr_penguin.csv (3.89 KB) for count data spanning 1979–2019. The record describes occupied-nest counting and different South African/Namibian protocols. Usage notes warn that some 0.1 values are model anchors, not counts, and NA has multiple meanings. A chart must omit anchors and preserve documented gaps; do not mechanically turn every NA into zero. Dryad's terms use CC0 for deposited datasets. The file itself returned 403 today, so contents, per-series dates, columns and exact transformations are not yet audited. Repository metadata and usage notes were read.



https://datadryad.org/dataset/doi:10.5061/dryad.vx0k6djp7



https://datadryad.org/terms



BirdLife South Africa's assessment page separately reports 2025 regional Endangered and 2024 global Critically Endangered. This is a useful demonstration of why scope and date must accompany categories. Its newer population information must not be silently appended to the older CSV as a homogeneous series. Verify assessment reuse and the source of any extension.



https://www.birdlife.org.za/red-data-book/red-list/african-penguin/



African penguin movement: permission and interpolation matter



Seabird Tracking Database 2213, Robben Island 2008–2019, lists GPS data, “Data are interpolated: Yes” and duplicate tracks. It is a real local lead, not a drop-in recorded-fix replay. The database requires a request for use in a product; author conditions and further redistribution restrictions matter. Request a small original-fix subset or an explicitly labelled interpolated/generalised product, with permission for public delivery of the prepared file. Do not trace its displayed map or download it under an academic-only purpose.



https://data.seabirdtracking.org/dataset/2213



https://www.seabirdtracking.org/terms-of-use/



Corridors: CMS/GIUM and a new practical alternative



CMS/GIUM describes migration maps and factsheets with high/medium/low use and threats. The landing page does not establish a geometry export licence. Choose a specific product and resolve its rights rather than copying a map image or digitising it.



https://www.cms.int/gium/migration-atlas



New source: USGS Ungulate Migrations, volume 6, DOI 10.5066/P1ETBSYE, offers GIS map files with a CC0 label. Its page explicitly says some underlying files are withheld under sharing constraints. Audit one released herd/corridor and its metadata; do not infer a right to obtain or republish withheld tracks. This is a strong alternative if CMS geometry or rights cannot be settled promptly.



https://www.usgs.gov/data/ungulate-migrations-western-united-states-volume-6



Whale populations: recovery with the right stock and dates



IWC's population estimates and status products supply abundance estimates, intervals and stock-specific recovery information. For a first recovery candidate, assess Western Indian Ocean humpbacks (BSC), which the current status page describes as recovered after strong growth. Preserve the assessment's observation/model years; a website's 2026 update label is not a 2026 survey. Do not borrow this status for West South Africa (BSB2), which has a distinct, cautious assessment, or for the existing false killer whale journey. Repeated report-year estimates are not necessarily new survey points. An exportable series and reuse terms still need checking.



https://iwc.int/about-whales/estimate



https://iwc.int/about-whales/intro-to-population-status/status-of-whales-graphics



New source: NOAA Marine Mammal Stock Assessment Reports can add stock-specific abundance, uncertainty, threats and trends. The species index includes the Hawaiian false killer whale stock complex. Audit the actual pelagic-stock section, not a neighbouring insular population; minimum abundance and best abundance are different fields. No quantitative whale series was extracted today.



https://www.fisheries.noaa.gov/national/marine-mammal-protection/marine-mammal-stock-assessment-reports-species-stock



Assessments and broad population databases: terms need product-specific decisions



IUCN: official API guidance requires an account/key, restricts commercial API use and asks users to check caching permission. Its full current terms page returned 403 today. A small manually curated category card and an API-fed/cached dataset may have different conditions; do not declare every factual category unusable or assume API access licenses all hosting. Ask about the exact fields and use. Keep global/regional assessment and population trend separate. Account registration, token requests and agreements were not performed.



https://api.iucnredlist.org/



https://api.iucnredlist.org/help



https://www.iucnredlist.org/terms/terms-of-use



Living Planet Database: the current 2026 agreement was found and read, closing the original broken-link research gap. It restricts financial-gain use, onward sharing and hosting original data; derived data carry conditions too. Its published aggregate LPI results have a separate CC BY-SA provision, which does not license individual population records. A browser chart exposes its underlying values, so clarify this use rather than merely deleting a CSV download button. Prefer the direct penguin/IWC/NOAA sources for the first population modules.



https://stats.livingplanetindex.org/documents/LPI_Data_Use_Policy_2026.pdf



https://stats.livingplanetindex.org/search



Birds: valuable, but three distinct routes



eBird Status and Trends offers modelled seasonal distributions and relative abundance, not individual journeys. Product access requires an application/key; the surfaced official terms and help guidance flag commercial permission. The specific main terms route was blocked today, so exact hosting/derivative conditions need a full current read. Do not substitute raw sightings for abundance. Use one existing product, not a new model trained on raw sightings.



https://science.ebird.org/en/use-ebird-data/download-ebird-data-products



https://science.ebird.org/en/status-and-trends/faq



Motus: the collaboration policy distinguishes summary versus complete data and expects contact/collaboration and project attribution for external use; custom summaries have a request route. A receiver detection is not an exact animal location or proof of the path between stations. Choose one project and a pre-aggregated example, not an all-network feed.



https://motus.org/resources/policy/



Archived GPS bird journey: the existing backlog's grey-headed albatross DOI 10.5441/001/1.694p666h is supported by its primary paper's data-availability statement. Its repository could not be opened today; current file licence/quality/sensitivity remain unverified. Do not carry the old discovery table's licence label forward as a new audit. An openly reusable bird package could fill Air without waiting on eBird/Motus permission.



https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0168513



OTN / ATAP / ATN / OBIS: what new responses could unlock



OTN: the official public-data and publication pages were read, improving on the earlier search-extract-only audit. They distinguish station deployments, animal releases and matched detections; node policies/embargoes can differ. Public release metadata alone do not establish an available detection replay. A selected historical detection product may be a viable next audit.



https://members.oceantrack.org/data/discovery/bypublic.htm



https://members.oceantrack.org/data/data/policies



https://members.oceantrack.org/data/publication-information



ATAP reply: could unlock a South African shark/ray receiver-detection story or a delayed regional summary, subject to the data owner's actual conditions. It would not automatically license every participating study. Current SAIAB information confirms the regional array and Dr Taryn Murray's role. The recorded enquiry already asks about historical/generalised data and recurring summaries; no duplicate is needed.



https://saiab.ac.za/platforms/acoustic-tracking-array-platform/



NOAA bottlenose reply: could provide the download route, position method, quality metadata and display conditions missing from InPort 26479. It is separate from the false killer whale and does not clear other telemetry data. The earlier enquiry remains recorded as sent; no inbox checked today.



ATN and OBIS/OBIS-SEAMAP: retain as discovery/export routes, with each dataset's licence and observation type checked. A growing archive is not a live-animal feed. The OBIS policy warns that licences vary; an aggregation portal is not a blanket clearance. No new ongoing deployment was verified today.



https://oceanservice.noaa.gov/ocean/animal-telemetry.html



https://portal.obis.org/data/datapolicy/



DFFE / SAEON / SAPRI



The SAEON MIMS catalogue was opened: it contains several licence classes and embargoed records, not blanket open reuse. DFFE reports provide penguin-monitoring leads; a report graph is not the numerical series or permission to host its artwork. SAPRI remains an organisational lead, not a specifically audited animal dataset. Ask the data custodian for a citable series and permission where necessary.



https://odp.saeon.ac.za/mims/catalog/



https://www.dffe.gov.za/sites/default/files/reports/research/oceans/2023annualsciencereport.pdf



Enquiry queue: proposed, none sent



First new enquiry worth drafting: penguin evidence



Approach an identified penguin researcher/data custodian, initially the named Dryad/Robben Island providers (Richard Sherley and collaborators), asking for the appropriate DFFE/BirdLife contact if needed. Avoid simultaneous duplicate requests to every organisation.



Ask two clearly separated things:



Is there a citable extension of the 1979–2019 count series, with the actual counting unit, methods, missing-year meanings, uncertainty, update schedule and terms for a public chart and downloadable browser payload?



Is there one small completed foraging study we may display, preferably original fixes, or a published seasonal/generalised foraging product? Dataset 2213 is marked interpolated with duplicates: what subset and labelling are appropriate, and what nesting/colony locations should be omitted/generalised?



State public educational display, local processing and delivery of prepared data through the website. Explain project funding/commercial plans accurately; do not assume “non-commercial” from an old template. Ask for required credit and any review/withdrawal expectations. This is an enquiry outline; verify current routing before drafting a send-ready message.



Conditional enquiries, ordered by the product we choose



Recipient/route



Narrow reason to contact



Priority



CMS/GIUM selected map owner



Public map/factsheet or geometry reuse, a download, generalisation and credit; specify one migration



Next if an African corridor is preferred and no clear terms are found



IUCN Red List team



Exact assessment fields, cache/update/withdrawal conditions, public display and present/future commercial scope



In parallel with assessment-card design



IWC science/data route



Underlying estimate/model series and observation years; chart/table reuse and attribution if unclear



Only after selecting a stock and reading its assessment



Cornell/eBird



One species/product; public hosting of prepared seasonal tiles, attribution, commercial scope and fees



Later seasonal-bird module



Motus project PI / Motus Central



One historical summary/detection example, interpretation and external display



Later receiver module



ZSL/WWF LPI team



Browser exposure/redistribution and financial-gain conditions for a selected series



Lower priority while direct sources suffice



Active Movebank study owner



One suitable delayed feed, external publication right, cadence, sensitivity and termination



Later ongoing-feed stage



Existing NOAA and ATAP enquiries: preserve their sent status and correspondence. An access reply, licence statement and actual data delivery are separate milestones. Do not send follow-ups without Chad's instruction. No promise that all new sources require an email: clear reusable products can proceed to audit without one.



Engineering and cost boundaries for the next proposal



Separate immutable journey, population-series, assessment and corridor records, linked by taxon AND population identifiers where known. A species match is not a stock match. Carry display precision and sensitive-section treatment before public upload.



Each module states observation/assessment period, source publication/revision and retrieval/check time. Cached content must have a permitted retention/update policy.



Source-approved smoothing/interpolation and population model outputs need distinct labels. Do not retrofit a modelled track into the recorded-fix claim.



Dateline work is more than drawing: cover longitude wrapping, shortest joins, map fitting and sea-journey land tests. Reuse the existing machinery only after cross-date-line tests.



Multi-animal selector first; simultaneous overlays later with an explicit shared or separate time convention and a measured visual/performance budget.



The seven existing Animals JSON files total 501,170 bytes on today's review copy. This is a measured static-content baseline, not a bill or full-page transfer estimate. Existing libraries/imagery and compression are separate.



Illustrative planning arithmetic only: 2 MB of new files loaded by 10,000 visitors is 20 GB transfer. Replace with measured on-demand bytes and actual opened-module rates; include request count, retention, builds, schedules and provider fees. No price or $0 claim is made here.



Population charts and corridor polygons can be bounded static assets. Raster surfaces and ongoing feeds have larger operational implications; do not adopt them solely because an API exists.



Proposed order for the next rounds



Round 2, Claude: challenge this shortlist and return one expansion proposal covering all concept areas. Prioritise exact penguin series, one recovery stock, one corridor and one Air study. For each, give specific product, current evidence, unanswered questions, proposed visitor experience, dependency, cost inputs and next audit. Prepare the penguin enquiry draft and at most the next selected rights enquiry, unsent. Do not implement or silently reopen production-release work.



Round 3, GPT: independently review the selected products and message drafts; resolve scientific interpretation and data rights before recommending implementation.



Then Chad chooses: which modules to build first and which enquiries to send. One useful module need not wait for all provider replies. The three-journey private candidate remains a valid foundation, not the completed concept.



Original-spec reference continuity



The original source links were recovered from the local concept, not lost. In addition to URLs above, these remain relevant prior-work references, not newly audited products in this round:



Movebank repository: https://www.movebank.org/cms/movebank-content/data-repository



Movebank policy: https://www.movebank.org/cms/movebank-content/data-policy



Movebank API: https://github.com/movebank/movebank-api-doc



Active-study access: https://www.movebank.org/cms/movebank-content/access-data



Zebra study: https://www.movebank.org/cms/movebank-content/migratory-burchells-zebra-in-northern-botswana



Blue-whale paper: https://pmc.ncbi.nlm.nih.gov/articles/PMC6637557/



False Bay collaboration: https://www.aquarium.co.za/foundation/news/this-world-shark-day-a-collaborative-acoustic-tagging-project-is-shining-a-light-on-elasmobranch-movements



Limits of round 1



This is a source-screening and expansion brief. It is not a complete per-file audit, new test run, re-review of every earlier study, legal determination or release approval. No bulk telemetry files were downloaded, no accounts or keys created, no agreement accepted, no provider contacted, no inbox checked and no branch modified. Some links were blocked or rendered partially; those gaps are stated. Prior J12/device/testing limitations remain with the parked candidate. Browser extension access is available in this thread, but was not needed for this text/source pass. No handover is needed yet.
