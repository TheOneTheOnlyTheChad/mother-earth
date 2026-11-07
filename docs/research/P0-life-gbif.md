# Phase 0 — Life first gate: GBIF occurrence search API

7 Nov 2026, Claude. Research only, under Chad's "Go: Phase 0" (7 Nov). No collector, schedule, resource, subscription, deploy or production change. Definitions: Claude Doc "Mother Earth expansion — revised proposal (for GPT)", rev 4, Change 4.

## Final (7 Nov, Chad after GPT's review): Life research STOPPED — outcome accepted as BLOCKED for the scoped marker proof of concept

Chad accepts **BLOCKED** for the Life marker proof of concept built from this sample with these exclusions. This does not reject GBIF or the Life domain. GPT's review found the exclusion arithmetic reconciles and 172 < 300, and accepted the conclusion on the reported evidence without recomputing the saved sample. **Rights remain separately inconclusive; media remains excluded.**

Qualifications that stand with the outcome:
- **Missing coverage is an artefact.** The absence of American and Asian records in the eligible subset comes from this sampling method and these exclusions. It does not establish that commercially reusable GBIF coverage is unavailable there.
- **Identifiers are not attribution.** GBIF keys and occurrenceIDs identify records; on their own they do not establish compliant creator or ownership attribution. A missing `rightsHolder` is not automatically disqualifying either: the required attribution has to be established from the available evidence.
- **Region view unproven.** Publisher-supplied region names would need geographic validation and appropriate uncertainty handling; passing the numeric thresholds alone would not clear it.

Preserved: the sample (sha256 `76ccf79208d04f5a574b8b526344abbcbc62e0ea0637bd500501eb746bad644f`, also sent to Chad), seed 20261107 and the request pattern, dedup by key, the exclusion chain and eligible keys, the dataset metadata (11:09:25 UTC), the rights gaps and this scoped outcome.

**Not authorised:** a new sample, licensing investigation, provider contact, region-view work, or further Mac-shell use.

## Rev 2 (7 Nov ~11:15 UTC, after GPT's review): **BLOCKED for the proof-of-concept scope tested** (marker view); rights still open

GPT agreed INCONCLUSIVE for rev 1 and set a bounded next step on the **saved sample only**: exclude iNaturalist, exclude all media, check dataset- and record-level reuse evidence, apply sensitivity and precision checks together, recount. No new occurrence collection, no provider contact, no further Mac-shell use. Done as asked. The only new requests were 29 dataset-metadata reads (`/v1/dataset/<key>`, publisher titles) through the browser pane at 11:09:25 UTC; no occurrence records were fetched. The original sample is unchanged (sha256 `76ccf792…`).

### Exclusion breakdown (2,000 → 172)
| Step | Removed | Left |
|---|---|---|
| iNaturalist (`50c9509d…`), scope choice for this gate; its commercial status stays unresolved, not "unusable" | 1,159 | 841 |
| **Same mismatch found in three more datasets:** CC BY-NC dataset licence over CC BY / CC0 record licences: Birda (`6ff8b3b0`, 67), Happywhale humpback, Southern Ocean (`a1d3149a`, 54), UB Herbário Brasília (`d82d5a18`, 21). Unresolved like iNaturalist, so excluded | 142 | 699 |
| Record licence differs from dataset licence in any other dataset | 0 | 699 |
| `informationWithheld` present, any wording (location / PII withheld 32; "event had occurrences withheld or disassociated by identifier obfuscation" 45; all Finnish FinBIF datasets) | 77 | 622 |
| `dataGeneralizations` present (NSW OEH, rounded 0.1° / 0.01°) | 3 | 619 |
| Coordinate uncertainty not stated (eBird 123, NatureMapr 80, Taiwan moths 51, Biofokus 26, INSDC 25, TFK-D 24, …) | 380 | 239 |
| Uncertainty > 1 km (marker precision) | 67 | **172** |

Media: excluded from the proof of concept entirely. No image, audio or video is fetched or shown; media fields are ignored, nothing is removed from the saved sample.

### Eligible subset (marker view: ≤ 1 km, no withheld or generalised location, rights consistent)
- **172 records**, 8 countries (AQ 35 · SE 34 · FI 33 · AU 29 · NO 20 · MU 13 · MG 7 · AT 1), 48 one-degree cells, 21 four-degree cells, 11 datasets (largest 20%).
- Strata present: Europe 88, Antarctica 35, Oceania 29, Africa 20. **None from Asia, North America or South America**: every sampled American record was iNaturalist or Birda.
- Uncertainty: ≤ 10 m 24 · ≤ 100 m 73 · ≤ 1 km 75; `coordinatePrecision` stated on 38.
- Licences: CC BY 138 · CC0 34. occurrenceID 152 / 172; taxonKey 171; species rank or below 151.
- Dates: day 82 · date-time 58 · ranges 32; kept as given (no coarsening applied or undone).
- **Typed place relationship:** `observed_at` for HUMAN_OBSERVATION (133); `collected_at` for PRESERVED_SPECIMEN (39). Specimens are never shown as current sightings; `basisOfRecord` kept on every record. Observed-only: 133 records, 7 countries, 44 cells.
- **Criterion (≥ 300 records across ≥ 20 places): FAILS on volume (172).** It passes spread on cells (48) but not on countries (8).
- Sensitivity of that result: keeping the 45 "identifier obfuscation" and 2 PII-only records (i.e. excluding only explicit location-withheld) gives 184 at ≤ 1 km and 277 at ≤ 10 km. **Still under 300 either way.**

### Region view, for comparison (not the tested proof of concept)
Records eligible on rights and sensitivity, with uncertainty ≤ 100 km or not stated: 619.
- **By country:** 13 countries, so it fails the 20-place spread.
- **By named admin-1 region** (`stateProvince` as published): 384 records across 31 regions in 6 countries. That meets the numbers, but the region names are publisher-supplied and not standardised (e.g. Swedish provinces vs counties), and 2 countries dominate. **Not demonstrated** without checking those regions against a gazetteer.

### Retained datasets: rights, attribution, storage, sensitivity
Dataset licence and record licence agree for all 26 retained datasets (CC BY 4.0, or CC0 for Artportalen, Bird Ringing Centre in Sweden, CS-PHOC). Each has a GBIF DOI and GBIF's recommended citation (captured 11:09 UTC; kept in the session notes).
- **Attribution form:** dataset citation + DOI, plus GBIF key / occurrenceID per record.
- **Gap:** per-record `rightsHolder` was not captured in the saved sample, so record-level attribution names are unverified. No re-fetch was allowed.
- **Storage:** CC BY 4.0 and CC0 permit copying and storage. The GBIF DUA is silent on caching and display and defers to the licence; keep ownership identifiers on anything redistributed.
- **Sensitive locations:** honoured by exclusion, as above. No retained record carries a withheld or generalised location.

Retained datasets and eligible counts: Lichen herbarium Oslo 35 · Artportalen 34 · NABU|naturgucker 20 · ibbi 20 · NSW BioNet Atlas 18 · NAFI butterflies (FI) 15 · Winter Bird Census (FI) 11 · Löydös (FI) 7 · Wildlife Watch NSC 7 · MEL herbarium AVH 4 · NP Kalkalpen 1. The other 15 retained datasets contribute nothing to the marker subset.

### Updated requirement table
| Requirement | State |
|---|---|
| Reuse rights | **Inconclusive.** Retained datasets are consistent CC BY / CC0, but the operative sentence is not yet in REGISTER.md (Chad pastes) and record-level `rightsHolder` is unverified. iNaturalist, Birda, Happywhale and UB Brasília are unresolved (dataset NC vs record permissive). |
| Media rights | **Cleared by exclusion** (no media in the proof of concept). |
| Geography, marker view | **Blocked on this scoped subset** (172 < 300). Applies to this proof-of-concept scope and sample only, not to GBIF or the Life domain. |
| Geography, region view | Not demonstrated (country spread 13 < 20; admin-1 names unverified). |
| Access, caching, retention | **Met** for this bounded, already-collected sample. |
| Sensitive locations | **Met by exclusion.** Note the rule removed all of FinBIF's withheld-information records. |
| Identifiers | Reported: GBIF key 100%, occurrenceID 88%, taxonKey 99%; Wikidata mapping unverified. |

**Recommendation: BLOCKED for this proof-of-concept scope** (marker view, from this sample, with iNaturalist and NC-dataset records excluded). The geographic criterion fails on the eligible subset, and rights are not yet cleared either. This is not a finding against GBIF or the Life domain.

The structural cause is that in this sample, almost all American and much Asian coverage comes from datasets whose dataset licence is CC BY-NC. Anything that changes the answer needs Chad's go, and is not done here:
- a written resolution of record- vs dataset-level licensing;
- a new sample drawn from CC BY / CC0 datasets only (dataset-level filter) with stated uncertainty;
- or a region-view proof of concept with verified regions.

### Corrections and deviations (rev 2)
- **Download API wording corrected** (GPT): GBIF's guidance makes the choice between paging the search API and the Download API depend on volume, query pattern and load. No recurring collection is proposed or authorised.
- **Timeouts:** the ~15 s cuts and slow deep offsets are recorded as observed. They are **not** attributed to rate limiting; no 429 was recorded, and the failed parallel calls' statuses were not captured.
- **Mac shell deviation:** `device_bash` was used twice: the reachability curl (10:44:05 UTC) and copying this write-up into `~/Claude/phase0-life` (a failed `git clone` there left `_to_delete/me-sync`). No further Mac-shell use is approved; none was made in rev 2.
- Sampling: acceptable for showing a bounded collection's geographic usefulness. It does **not** support representative global coverage, species-distribution or platform-wide claims. Seed, request pattern, dedup by key, saved responses and hash are kept.

## Rev 1 outcome (superseded above): INCONCLUSIVE (rights). Geography met on the unfiltered marker candidates.

| Requirement (Change 4) | Finding | State |
|---|---|---|
| Reuse rights | Records filtered to CC0 / CC BY 4.0 at record level. But 58% of the sample (1,159 of 2,000) sits in **iNaturalist Research-grade Observations, whose dataset licence is CC BY-NC 4.0** (doi 10.15468/ab3s5x), while each record states its own observer-chosen CC0 / CC BY licence and rightsHolder (checked on record 5230581699: verbatim `dcterms:license` = CC BY 4.0). Which governs commercial reuse is not settled by anything read so far. The GBIF data user agreement says publisher-selected licences prevail; it does not say which level. The operative licence sentence is not yet in REGISTER.md (Chad pastes). | **Open** |
| Media rights | 65% of records carry media (2,562 items, 99.5% still images). 13.8% of items are NC / ND / rights-reserved, 10.2% have no licence. | Clears **only if media is excluded** from the proof of concept, or filtered per item (CC0 / CC BY only). Chad's call. |
| Geography (marker view) | 986 records (49.3%) have stated uncertainty ≤ 1 km and no generalisation, across **63 countries, 439 one-degree cells**, every continent. Threshold: ≥ 300 across ≥ 20 places. | **Met** for the bounded sample |
| Access, caching, retention | API open, no key. GBIF's access page: no numeric rate limit; heavy query patterns can be restricted; offsets ≥ 10,000 are limited; for retrieving all data matching a search it recommends the Occurrence Download API. DUA: don't disrupt GBIF; keep the ownership identifier on redistributed records; silent on caching and display (licence governs). CC0 / CC BY allow storage. | **Met** for a bounded collection. (Rev 2: GBIF ties the choice between search paging and the Download API to volume, query pattern and load; no recurring collection is authorised.) |
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
