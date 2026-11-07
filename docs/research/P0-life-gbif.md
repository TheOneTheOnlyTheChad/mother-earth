# Phase 0 — Life first gate: GBIF occurrence search API

7 Nov 2026, Claude. Research only, under Chad's "Go: Phase 0" (7 Nov). No collector, schedule, resource, subscription, deploy or production change. Definitions: Claude Doc "Mother Earth expansion — revised proposal (for GPT)", rev 4, Change 4.

## Outcome: **INCONCLUSIVE** (rights). Geography cleared for a marker view.

| Requirement (Change 4) | Finding | State |
|---|---|---|
| Reuse rights | Records filtered to CC0 / CC BY 4.0 at record level. But 58% of the sample (1,159 of 2,000) sits in **iNaturalist Research-grade Observations, whose dataset licence is CC BY-NC 4.0** (doi 10.15468/ab3s5x), while each record states its own observer-chosen CC0 / CC BY licence and rightsHolder (checked on record 5230581699: verbatim `dcterms:license` = CC BY 4.0). Which governs commercial reuse is not settled by anything read so far. The GBIF data user agreement says publisher-selected licences prevail; it does not say which level. The operative licence sentence is not yet in REGISTER.md (Chad pastes). | **Open** |
| Media rights | 65% of records carry media (2,562 items, 99.5% still images). 13.8% of items are NC / ND / rights-reserved, 10.2% have no licence. | Clears **only if media is excluded** from the proof of concept, or filtered per item (CC0 / CC BY only). Chad's call. |
| Geography (marker view) | 986 records (49.3%) have stated uncertainty ≤ 1 km and no generalisation, across **63 countries, 439 one-degree cells**, every continent. Threshold: ≥ 300 across ≥ 20 places. | **Met** for the bounded sample |
| Access, caching, retention | API open, no key. GBIF's access page: no numeric rate limit; heavy query patterns can be restricted; offsets ≥ 10,000 are limited; for bulk pulls use the Occurrence Download API. DUA: don't disrupt GBIF; keep the ownership identifier on redistributed records; silent on caching and display (licence governs). CC0 / CC BY allow storage. | **Met** for a bounded collection; any recurring collection should go through the download API (needs a GBIF account, Chad's) |
| Sensitive locations | Publishers obscure in-record: 133 records (6.7%) carry `informationWithheld` (30 location withheld; 56 "coordinate uncertainty increased to ~28 km" for threatened taxa or at observer request); 3 carry `dataGeneralizations` (NSW OEH, rounded to 0.1° / 0.01°). Rule that honours it: never draw a record finer than its stated uncertainty; generalised records are regions. | **Met** (rule documented, can be honoured) |
| Identifiers (reported, not blocking) | GBIF key 100%; `occurrenceID` 97.8%; `taxonKey` 99.8% (GBIF taxon keys map to Wikidata P846, not checked here). | Reported |

**What would resolve it:** (1) a written answer on record-level vs dataset-level licence for iNaturalist records on GBIF (GBIF helpdesk or iNaturalist's published terms), or a decision to sample excluding dataset 50c9509d and re-run geography; (2) Chad's paste of the operative licence sentence into REGISTER.md; (3) Chad's decision on media (exclude or per-item filter).

## Reachability (Step 1)
| Route | UTC | Result |
|---|---|---|
| Cloud workspace (curl) | 10:43:25 | HTTP 000, exit 56; proxy `connect_rejected`, "gateway answered 403 to CONNECT", api.gbif.org:443 |
| Mac `device_bash` (curl) | 10:44:05 | HTTP 000, exit 56, "Received HTTP code 403 from proxy after CONNECT"; pypi.org 200, github.com 200 |
| **Browser pane `javascript_tool` fetch** | **10:44:01** | **HTTP 200**, count 3,890,495,026 |

The gate ran entirely through the pane. Both shells still refuse api.gbif.org after the "All domains" setting.

## Sampling method (as run)
- Filter: `year=2025&hasCoordinate=true&hasGeospatialIssue=false&license=CC0_1_0&license=CC_BY_4_0`. Counts at 10:44 UTC: 254,726,877 matching (continents sum 245,966,296; ~8.8 M have no continent). CC BY-NC same filters: 49,280,274.
- Strata: 7 continents (286 / 286 / 286 / 286 / 286 / 285 / 285). Within each: seeded month (uniform 1–12, mulberry32 seed 20261107), seeded offset below min(2,000, month count − 20), pages of 20, duplicates by key dropped. 170 pages, median 548 ms, max 3.3 s; no failed requests. 10:53–10:57 UTC.
- **Deviation from the plan (offsets < 10,000, pages ≤ 300):** offsets around 5,000–10,000 on this filtered query took 11–17 s and from ~10:47 were cut at ~15 s ("Failed to fetch"), or hung past 45 s; shallow offsets answered in ~1.5 s. Month sub-strata with offsets < 2,000 replaced them. A parallel burst of 84 count calls returned errors for about half (status not recorded); the sampler then ran sequentially without errors.
- **Limitations:** results come in GBIF's index order, not random order, so each page is a run of neighbouring records; only the first 2,000 per continent-month are reachable this way. Strata are equal-sized, not proportional (Antarctica is 0.01% of the population but 14% of the sample). One dataset dominates: iNaturalist 58%, top five 74.5%; North America 93% and South America 100% one dataset.
- Sample: 2,000 records, 30 datasets, 26 publishers. JSON sha256 `76ccf79208d04f5a574b8b526344abbcbc62e0ea0637bd500501eb746bad644f` (1,483,353 B; gz `b567c8c3…`, 112,731 B). Not committed here (CC BY records need their attribution kept); held in the session and sent to Chad.

## Measurements (n = 2,000)
- **Coordinate uncertainty:** ≤ 10 m 24.6% · ≤ 100 m 14.2% · ≤ 1 km 10.6% · ≤ 10 km 6.7% · ≤ 100 km 5.8% · > 100 km 0.3% · **not stated 37.9%**. `coordinatePrecision` stated on 95.
- **Places:** 76 countries, 657 one-degree cells, 310 four-degree cells. Per continent (countries / 1° cells): Africa 21/85, Antarctica 2/28, Asia 24/102, Europe 6/65, North America 5/174, Oceania 8/84, South America 12/119.
- **Marker-usable** (uncertainty ≤ 1 km, not generalised): 986 · 63 countries · 439 cells. At ≤ 10 km: 1,117 · 64 · 457. Records with no stated uncertainty are excluded from both.
- **basisOfRecord:** human observation 1,912 · preserved specimen 62 · material sample 25 · machine observation 1.
- **Taxa:** taxonKey 99.8%; species rank 90.4%; Animalia 1,356 · Plantae 544 · Fungi 71 · Bacteria 23.
- **Licences:** CC BY 4.0 1,580 · CC0 420.
- **Issues:** 97.2% of records have at least one. Top: continent derived from coordinates 1,767; coordinate rounded 1,289; taxon ID not found 1,258; taxon concept ID not found 422; datum assumed WGS84 240. None is a geospatial issue (filtered out).

## Desk terms (carried from the handover, checked)
- gbif.org/terms: three licences, CC0 / CC BY / CC BY-NC.
- Data user agreement (tools.gbif.org/terms/data-user): follow each publisher's licence; acknowledge publishers; DOI where appropriate (derived dataset recommended for API pulls); keep ownership identifiers on redistributed records; no ban on commercial use beyond the licences.
- Access page (gbif.org/restricted): see the table above.
- Sensitive species: publisher generalisation per Chapman (2020).

## Time
About 30 min of GBIF work in this thread (10:43–11:00 UTC), well inside the ~4 h cap. GPT review round not yet held.
