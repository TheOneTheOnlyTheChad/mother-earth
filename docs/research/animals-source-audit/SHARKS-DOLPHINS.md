# Animals — sharks and dolphins: first source audit (terms and metadata)

18–19 Nov 2026 · rev 1.1 · candidate discovery, accepted as such by GPT with corrections (§0) · read-only research. Nothing built, nothing saved, no provider contacted, nothing spent.

## 0. Status and corrections (rev 1.1, 19 Nov)

GPT reviewed rev 1 at `970312e` (relayed by Chad): accepted as **candidate discovery, not a source clearance**. Its six corrections are applied below.

1. **File access, stated exactly:** one complete false-killer-whale netCDF file (319,596 bytes) was fetched in the browser pane's memory for metadata inspection. Its trajectory arrays were not analysed. Nothing was saved. The preserved evidence (`atn-listing-2026-11-18.json`) holds **text strings extracted from the file's bytes**, not a decoded header: it shows which names and descriptions occur in the file, not their structure or values.
2. **Fields present is not values present.** The full audits must establish the actual position-type values, whether the quality and error fields are populated, the fill values, and what each flag value means. The extracted strings include "argos / modeled", so the file is **not** yet classified as raw Argos fixes. The basking sharks' positioning remains unverified.
3. **Deployment-specific rights evidence added** for the inspected false killer whale deployment (§4b), with the source file and the OBIS extraction kept as separate identities.
4. **Listing dates are file dates.** They are not observation dates and do not demonstrate an update schedule. No live-feed qualification is established for any candidate here.
5. **OTN terms** read further (§3b); the full policy and a specific endpoint's terms are still to be read when an endpoint is selected.
6. **Both enquiries rewritten** so they do not commit Mother Earth to non-commercial-only use (§6). Both remain unsent.

GPT's recommended next work, each needing Chad's own go: the full South African white shark file audit; a deep audit of **one** false killer whale deployment before the other 26; the bottlenose-dolphin enquiry kept open in parallel.

**Chad (18 Nov):** sharks and dolphins are part of the plan and are the next source audit; they do not wait behind seals, turtles and albatrosses.
**GPT's scope (relayed):** start with terms and metadata from NOAA ATN/NCEI, NOAA Fisheries, OBIS-SEAMAP and OTN/ATAP; look for identifiable tagged-animal journeys; keep satellite fixes, estimated positions, acoustic detections and tag-release metadata apart; find the best accessible candidate for each, with rights, download route, dates, positioning method and update status; if contact is needed, prepare the enquiry for Chad and do not send it.

## 1. Result in short

| Wanted | Best accessible candidate found | Rights on the record | Positions are | Dates | Updated? |
|---|---|---|---|---|---|
| **Sharks** | White sharks tagged on the South African coast, Zenodo `10.5281/zenodo.5575189` | CC BY 4.0 | Described on the record as Argos-derived, with an Argos quality class and a location "type" code whose values are not yet read | 34 sharks tagged Mar–May 2012; tracks 2012–2014 | No. Closed archive, version 1.0.0 |
| **Dolphins** | No tagged bottlenose or common dolphin track is openly downloadable among the sources read. Accessible now: false killer whales (*Pseudorca crassidens*; biologically a dolphin, family Delphinidae) in the U.S. Animal Telemetry Network archive | CC0 1.0 on the record for the inspected deployment and on the collection record; free-use wording in the file | Not yet classified. The file names Argos, GPS and user-entered location types and contains the string "argos / modeled"; values unread | 27 tag deployments by file name, 2007–2014 | Historical deployments. No update schedule demonstrated |

- Neither is cleared for display. Each needs the full audit the zebra had (files opened, rows counted, quality fields read, sensitivity decided) before any build.
- GPT's two leads are real but neither is the best first candidate: the NOAA bottlenose-dolphin record has no download, and the basking-shark package is CC BY-NC with its positioning method unstated (§3, §4).
- False killer whales are dolphins biologically and are worth pursuing alongside bottlenose dolphins (GPT), with the species named exactly on the page. For bottlenose dolphins the route is an enquiry (§6), kept open in parallel.

## 2. How this was done

- 18 Nov 2026, about 17:30–17:41 UTC. Record pages read through the web reader; search results used to find them; one public file listing read, and one data file fetched for metadata strings, through the browser pane.
- **Read in full as pages:** NOAA InPort item 26479; the OBIS-SEAMAP IPT page for dataset 2383; Zenodo record 5575189; the IOOS page describing how ATN data are archived at NCEI.
- **Read as a listing:** the ATN production staging folder named on that IOOS page (file names, dates, sizes only).
- **One data file fetched:** one complete ATN false-killer-whale trajectory file (319,596 bytes) was fetched in the pane's memory for metadata inspection: text strings were extracted from its bytes to find its licence wording, citation and field descriptions. The trajectory arrays were not analysed. Nothing was saved. Evidence: `atn-listing-2026-11-18.json` (extracted strings, not a decoded header).
- **Read on 19 Nov, 02:14 UTC, in the pane:** the data.gov record and the OBIS record for that same deployment (GPT's links).
- **Read only as search-result extracts:** NCEI's collection record, the data.gov copies of it, OTN's data-policy pages, OBIS-SEAMAP's licence FAQ, ATAP's pages and newsletters, the Scientific Data paper on juvenile white sharks.
- **Could not be read:** NCEI's own site answered HTTP 503 at 17:37–17:38 UTC (collection landing page and data directory). The DOI `10.24431/rw1k6c3` could not be opened by the web reader.
- **No data file was fetched** for the shark candidate, the basking sharks or the bottlenose dolphins. For the false killer whales, one file was fetched as described above and no position was read from it. Every count below is the record's own unless marked.

## 3. Sharks

### 3a. Candidate: white sharks, South African coast (recommended for the full audit)
| | |
|---|---|
| Title | "Satellite tracking data of white sharks in the southwest Indian Ocean (2012-2014)" |
| DOI | `10.5281/zenodo.5575189`, Zenodo, version 1.0.0, published 18 Oct 2021 |
| Licence on the record | Creative Commons Attribution 4.0 International |
| Paper | Kock et al., *Frontiers in Marine Science*, doi `10.3389/fmars.2022.811985` |
| Animals | 34 white sharks (*Carcharodon carcharias*), tagged March–May 2012 along the South African coast |
| Method | Wildlife Computers SPOT5 tags; positions are Argos-derived. The record does not mention modelled positions |
| File | one CSV, `south_african_white_shark_ARGOS_tracks.csv`, 1.8 MB, md5 listed on the record |
| Fields named on the record | shark id, tag number, UTC timestamp, location type code, Argos quality class, latitude, longitude, tagging area, sex, length, maturity class |
| Download route | direct from the Zenodo record, no account |
| Update status | closed archive |

- **Rights:** CC BY 4.0 permits reuse and redistribution on conditions: credit to the creators, a link to the licence, and a statement of any changes made (thinning, filtering, reformatting all count). A source name alone does not meet it. No extra condition is stated on the record. The tagging was done under a South African government research permit, which the record notes; whether that carries any expectation about public display is not stated.
- **Kind of position:** the record describes Argos-derived positions and does not mention modelled ones. The file has a location "type" code that the record does not define. **The type codes are resolved first in the full audit, before any position is classified.** Argos rows then need a quality rule justified for this study and tag (GPT, 18 Nov: one rule does not cover every species or tag).
- **Sensitivity:** a high-profile species tagged along a populated coast. The tracks are 12 to 14 years old and already public. Its legal protection and conservation status were not looked up in this pass. That does not settle it: a recorded, dataset-specific decision is needed before anything public (proposal §6a).
- **Not yet known:** rows, usable fixes per shark, gaps, the share of each quality class, what the "type" code means, implausible steps. All need the file.

### 3b. Other shark leads
| Lead | What it is | Why it is not the first candidate |
|---|---|---|
| Basking sharks, OBIS-SEAMAP dataset 2383, DOI `10.82144/41ac42db` (GPT's lead) | 4 sharks, pop-up satellite archival tags, 30 Jun 2022 to 20 Jun 2024, 1,468 records in a 97 KB archive; raw sensor data in a separate download of about 4 GB; published 25 Mar 2026, no update planned | **CC BY-NC 4.0**, which needs Chad's decision against the project's plans. The page does not say how positions were obtained. That they are estimates is a hypothesis from the tag type, **not a finding**; it stays unverified until the data are read. The page does not confirm animal ids and timestamps per record |
| Juvenile white sharks, northeast Pacific, DOI `10.24431/rw1k6c3` | 63 individuals, 2001–2020; pop-up archival tags and Argos-transmitting tags; the paper says CC BY | Landing page not read. Mixes fixes and model-estimated positions, which must be kept apart. A good second candidate |
| Ocean Tracking Network public products | OTN's publication page says public data use is constrained by CC BY and lists the public products (station and deployment metadata, tagged-animal release metadata, GeoServer layers, OBIS publication of tag metadata and compressed detections, ERDDAP); it says **detection extracts are not public**. OTN's policies page says anyone accessing OTN data must give proper attribution to all data providers and that citation metadata travels in each row; detections and tagging metadata are public by default with an optional two-year embargo after tag expiry. GPT reports provider-attribution and notification wording on the detection endpoint. **Not read: the 2024 policy document in full, and any one endpoint's own terms.** Both are read in full when an endpoint is selected | **Acoustic detections and tag-release metadata, not journeys.** A detection places an animal near a receiver. Usable later as "detections at receivers", never as a track |
| ATAP (South African acoustic array, hosted by SAIAB, an OTN partner) | 2,300 km of coast; 46 species including 18 sharks and 11 rays, at least 980 active transmitters (ATAP newsletter, Nov 2025). The "Shark Spotters" release record on OBIS-SEAMAP is tag-release metadata | No public data policy or download was found. **Needs an enquiry** (§6). The array is active, so it could be the regularly updated South African source |

## 4. Dolphins

### 4a. GPT's lead: NOAA bottlenose-dolphin satellite telemetry (InPort 26479)
- Title "Bottlenose dolphin satellite telemetry spreadsheets (many)"; purpose "documents movements"; 1999 to 2005; U.S. south Atlantic coast; owner NOAA's Southeast Fisheries Science Center.
- **No distribution is listed.** The record says the data will be available from a public server once an access method has been developed; archive location "To Be Determined"; status "In Work"; record last modified 4 Mar 2026.
- Access constraints "None"; no licence or use statement. Animals tagged and tag type are not stated.
- So: real tagged-dolphin data exist, with no download route. **Needs an enquiry** (§6).

### 4b. What is openly accessible: the U.S. Animal Telemetry Network archive
| | |
|---|---|
| Collection | "Marine animal satellite telemetry location and profile data from the U.S. Animal Telemetry Network (ATN)", NCEI, DOI `10.25921/wp4e-ph20` |
| Licence, collection | the data.gov copies of the collection record give CC0 1.0 (one copy shows no licence field) |
| Licence, the inspected deployment | **data.gov record for this deployment** (ptt id 98364, deployment id `573c6646d76c5c52816a4b92`): licence `https://creativecommons.org/publicdomain/zero/1.0/` (read 19 Nov 02:14 UTC). **OBIS record** `560c7bbd-ca6c-4b43-b134-8ca9e5b9e9f7` for the same deployment: "Public Domain (CC0 1.0)". Text in the file itself: the data "may be used and redistributed for free" and are not for legal use |
| Identities kept apart | **Source file:** the netCDF at NCEI, accession `0303525` (the full set of locations). **OBIS extraction:** a subset "intended to be useful for the OBIS network", 373 occurrences, published 30 Sep 2025 through the OBIS-USA IPT. **ERDDAP table:** the ATN ERDDAP serves this deployment as its own table. An audit states which of the three it read; the OBIS subset is not the source |
| Status on the NCEI record | ongoing, continually updated (search extract; NCEI itself was down) |
| What the staging folder held at 17:39 UTC | 402 trajectory files: ribbon seals 148, spotted seals 96, harbor seals 91, bearded seals 38, **false killer whales 27**, short-finned pilot whale 1, Blainville's beaked whale 1 |
| File dates in the listing | 18 Oct 2024, 19 Mar 2025, 12 Jun 2025, 6 Nov 2025. These are file modification dates. They are not observation dates and do not show a collection cadence |
| Sharks | none in the staging folder, although the collection's keywords name a juvenile white shark project |
| Other routes named on the records | NCEI's HTTPS directory and THREDDS; ERDDAP tables for the collection and for single deployments (a query interface; whether the hub may and can call it is unverified) |

- **False killer whales** (*Pseudorca crassidens*): 27 files, deployments from 16 Aug 2007 to 23 Feb 2014, North Pacific. The longest file by its name runs 23 Oct 2013 to 23 Feb 2014 (123 days).
- **The one file fetched** (`atn_98364_false-killer-whale_trajectory_20131023-20140223.nc`, 319,596 bytes, sha256 `9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6`). Strings found in it: a SPOT5 tag description; a location-type description (Argos, GPS or user-entered) and the string "argos / modeled"; an Argos location-class description; names of quality flags for time, speed and location with a roll-up flag; names of error-radius and error-ellipse fields; a citation naming the data authors, dated 2025; the licence wording above.
- **What that does and does not show.** The file declares more quality information than any other candidate so far. It does not show that those fields hold usable values. The deep audit must read: the actual location-type values per row (and what "modeled" covers), each flag's values and meanings, the fill values, and whether the error estimates are populated. Until then nothing in this file is classified as a raw fix.
- **Is it a dolphin?** Yes, biologically: false killer whales and pilot whales are in the dolphin family (Delphinidae; OBIS lists this deployment under Delphinidae). The common name says "whale", so the page names the species exactly and says it is a dolphin in one plain line.
- **Updated?** Not established. The NCEI record's status wording ("ongoing") was read only as a search extract, and the listing's file dates show nothing about cadence. Every false killer whale file name in the folder ends by 2014. **These are historical deployments, and no live-feed or regularly-updated qualification is established** for the purposes of proposal §9.

### 4c. OBIS-SEAMAP dolphin datasets
- The dolphin datasets found there are sightings, surveys and photo-identification (for example the Georgia "Dolphin Project" surveys, 1992–2003, CC BY-NC; a NOAA photo-ID catalogue, CC0). **These are occurrences, not journeys**, and must not be drawn as one.
- OBIS-SEAMAP's default licence is CC BY-NC unless a provider chooses otherwise (its FAQ, search extract).
- No tagged-dolphin track was found there in this pass. The catalogue was not searched exhaustively.

## 5. Kinds of position, kept apart

| Kind | Where it appears here | How it may be shown |
|---|---|---|
| Satellite fix (Argos, GPS) | Expected for the South African white sharks and the ATN false killer whales; **not yet confirmed row by row for either** (type codes unread; "argos / modeled" appears in the ATN file) | Recorded fix, with the source's quality class; lines only under a per-study rule |
| Estimated position (light-level or model) | Possibly the basking sharks (unverified); part of the juvenile white shark database per its paper; possibly some ATN rows ("modeled") | Labelled as an estimate with its method; never as a fix |
| Acoustic detection | OTN, ATAP | "Detected near receiver X at time T"; gaps between receivers shown; no track |
| Tag-release metadata | OTN release records on OBIS-SEAMAP | Where and when an animal was tagged; nothing more |

## 6. Enquiries prepared for Chad (not sent; rev 1.1)

Sending either is Chad's decision. No address is recorded here; each organisation's contact route is on its own page. Rev 1.1 (GPT): the drafts no longer describe Mother Earth as non-commercial. They describe the intended display and ask about future commercial reuse as a separate question.

**A. NOAA Southeast Fisheries Science Center, about InPort item 26479**

> Subject: Access to "Bottlenose dolphin satellite telemetry spreadsheets (many)", InPort 26479
>
> Hello,
>
> I run Mother Earth, a website that shows dated observations of the planet alongside their sources. I would like to show recorded, historical journeys of tagged dolphins: each animal's recorded positions on a globe, replayed against the dates they were recorded, with the study, method and credit shown.
>
> Your InPort record 26479 (bottlenose dolphin satellite telemetry, 1999–2005) lists no distribution yet. Could you tell me:
> 1. whether the data can be obtained, and how (download route and format);
> 2. whether I may process the data into a smaller display file (for example selecting animals, removing flagged positions), with every change stated;
> 3. whether I may host or cache that prepared file on my own servers and display it publicly, with credit;
> 4. whether the prepared file may be redistributed, or only displayed;
> 5. how the positions were obtained (tag type, Argos or GPS) and whether location quality is included;
> 6. whether you would want any locations generalised, delayed or omitted;
> 7. the credit and citation you would like used.
>
> Separately: the site is free to view today. If it later carried paid features, would the same use still be permitted, or would that need a further agreement?
>
> Ta,
> Chad

**B. ATAP / SAIAB, about a South African shark or ray dataset**

> Subject: A completed or generalised ATAP dataset for public display
>
> Hello,
>
> I run Mother Earth, a website based in Cape Town that shows dated observations of the planet alongside their sources. I would like to show South African shark and ray movement as it was recorded: detections at receivers, with the gaps between receivers shown, and not drawn as tracks.
>
> Could you tell me:
> 1. whether a completed study, or a generalised historical product, could be made available for that, and by what route;
> 2. whether I may process it into a display file, host or cache that file on my own servers, and display it publicly;
> 3. whether the prepared file may be redistributed, or only displayed;
> 4. the credit you would require, and whether the tagging researchers would each need to agree;
> 5. what delay or generalisation you would want for sensitive species or sites;
> 6. whether any regularly updated summary (for example detections per receiver region per month) could be shared.
>
> Separately: the site is free to view today. If it later carried paid features, would the same use still be permitted, or would that need a further agreement?
>
> Ta,
> Chad

## 7. Recommended next steps (each needs Chad's go)

1. **Full audit of the South African white shark file** (fetch the CSV in memory, resolve the type codes first, count, read the quality classes, check for implausible steps, write the sensitivity considerations and the CC BY credit, licence link and change statement). Same size as the zebra audit.
2. **Deep audit of one false killer whale deployment first** (GPT): decode the file properly, read the actual location types, flag values and meanings, fill values and whether error estimates are populated, and state which identity was read (source netCDF, ERDDAP table or OBIS subset). The other 26 follow only if that one holds up.
3. Decide on the two enquiries; the bottlenose-dolphin one stays open in parallel.
4. Decide whether CC BY-NC sources (basking sharks, much of OBIS-SEAMAP) are acceptable for Mother Earth at all.

## 8. Limits of this pass

- Terms and metadata only. One false-killer-whale file was fetched in memory for metadata strings; no positions were read from any shark or dolphin file. No count here is ours except the ATN file listing.
- This is candidate discovery. Nothing here is a source clearance.
- NCEI was unreachable; its record and the species list in its keywords are from search extracts.
- Searches are not a complete catalogue. "Not found" means not found in these searches.
- A published package does not show whether its parent project is still active.
- No conservation status is stated for any species here.
