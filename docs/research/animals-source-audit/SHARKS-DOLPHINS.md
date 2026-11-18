# Animals — sharks and dolphins: first source audit (terms and metadata)

18 Nov 2026 · rev 1 · for GPT review · read-only research. Nothing built, no data file stored, no provider contacted, nothing spent.

**Chad (18 Nov):** sharks and dolphins are part of the plan and are the next source audit; they do not wait behind seals, turtles and albatrosses.
**GPT's scope (relayed):** start with terms and metadata from NOAA ATN/NCEI, NOAA Fisheries, OBIS-SEAMAP and OTN/ATAP; look for identifiable tagged-animal journeys; keep satellite fixes, estimated positions, acoustic detections and tag-release metadata apart; find the best accessible candidate for each, with rights, download route, dates, positioning method and update status; if contact is needed, prepare the enquiry for Chad and do not send it.

## 1. Result in short

| Wanted | Best accessible candidate found | Rights on the record | Positions are | Dates | Updated? |
|---|---|---|---|---|---|
| **Sharks** | White sharks tagged on the South African coast, Zenodo `10.5281/zenodo.5575189` | CC BY 4.0 | Argos satellite fixes, with Argos quality class | 34 sharks tagged Mar–May 2012; tracks 2012–2014 | No. Closed archive, version 1.0.0 |
| **Dolphins** | No tagged-dolphin track is openly downloadable among the sources read. Nearest: false killer whales (*Pseudorca crassidens*, a member of the dolphin family) in the U.S. Animal Telemetry Network archive | Collection record: CC0 1.0; file header: free use and redistribution | Argos satellite fixes with location class, quality flags and error-ellipse fields | 27 tag deployments, 2007–2014 | The archive is added to in batches; these tracks ended in 2014 |

- Neither is cleared for display. Each needs the full audit the zebra had (files opened, rows counted, quality fields read, sensitivity decided) before any build.
- GPT's two leads are real but neither is the best first candidate: the NOAA bottlenose-dolphin record has no download, and the basking-shark package is CC BY-NC with its positioning method unstated (§3, §4).
- Whether a false killer whale answers "dolphins" is Chad's call. If he means bottlenose or common dolphins, the route is an enquiry (§6).

## 2. How this was done

- 18 Nov 2026, about 17:30–17:41 UTC. Record pages read through the web reader; search results used to find them; one public file listing and one file header read through the browser pane.
- **Read in full as pages:** NOAA InPort item 26479; the OBIS-SEAMAP IPT page for dataset 2383; Zenodo record 5575189; the IOOS page describing how ATN data are archived at NCEI.
- **Read as a listing:** the ATN production staging folder named on that IOOS page (file names, dates, sizes only).
- **Read as a file header:** one ATN trajectory file (320 KB), in the pane's memory, for its licence, citation and variable descriptions. Not saved. Evidence: `atn-listing-2026-11-18.json`.
- **Read only as search-result extracts:** NCEI's collection record, the data.gov copies of it, OTN's data-policy pages, OBIS-SEAMAP's licence FAQ, ATAP's pages and newsletters, the Scientific Data paper on juvenile white sharks.
- **Could not be read:** NCEI's own site answered HTTP 503 at 17:37–17:38 UTC (collection landing page and data directory). The DOI `10.24431/rw1k6c3` could not be opened by the web reader.
- **No data file was opened** for the shark candidate, the basking sharks or the dolphins. Every count below is the record's own unless marked.

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

- **Rights:** CC BY permits reuse and redistribution with credit. No extra condition is stated on the record. The tagging was done under a South African government research permit, which the record notes; whether that carries any expectation about public display is not stated.
- **Kind of position:** satellite fixes (Argos), not estimates and not acoustic detections. As with the blue whales, raw Argos rows need a quality rule justified for this study and tag (GPT, 18 Nov: one rule does not cover every species or tag).
- **Sensitivity:** a high-profile species tagged along a populated coast. The tracks are 12 to 14 years old and already public. Its legal protection and conservation status were not looked up in this pass. That does not settle it: a recorded, dataset-specific decision is needed before anything public (proposal §6a).
- **Not yet known:** rows, usable fixes per shark, gaps, the share of each quality class, what the "type" code means, implausible steps. All need the file.

### 3b. Other shark leads
| Lead | What it is | Why it is not the first candidate |
|---|---|---|
| Basking sharks, OBIS-SEAMAP dataset 2383, DOI `10.82144/41ac42db` (GPT's lead) | 4 sharks, pop-up satellite archival tags, 30 Jun 2022 to 20 Jun 2024, 1,468 records in a 97 KB archive; raw sensor data in a separate download of about 4 GB; published 25 Mar 2026, no update planned | **CC BY-NC 4.0**, which needs Chad's decision against the project's plans. The page does not say how positions were obtained; pop-up archival tags usually give **estimated** positions, not fixes, and that must be confirmed and labelled. The page does not confirm animal ids and timestamps per record |
| Juvenile white sharks, northeast Pacific, DOI `10.24431/rw1k6c3` | 63 individuals, 2001–2020; pop-up archival tags and Argos-transmitting tags; the paper says CC BY | Landing page not read. Mixes fixes and model-estimated positions, which must be kept apart. A good second candidate |
| Ocean Tracking Network public products | Public products are stated to be under CC BY; detections and tagging metadata are public by default with an optional two-year embargo after tag expiry | **Acoustic detections and tag-release metadata, not journeys.** A detection places an animal near a receiver. Usable later as "detections at receivers", never as a track |
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
| Licence | the data.gov copies of the record give CC0 1.0 (one copy shows no licence field). The file header read says the data "may be used and redistributed for free" and are not for legal use |
| Status on the NCEI record | ongoing, continually updated (search extract; NCEI itself was down) |
| What the staging folder held at 17:39 UTC | 402 trajectory files: ribbon seals 148, spotted seals 96, harbor seals 91, bearded seals 38, **false killer whales 27**, short-finned pilot whale 1, Blainville's beaked whale 1 |
| Files last added | in four batches: 18 Oct 2024, 19 Mar 2025, 12 Jun 2025, 6 Nov 2025 |
| Sharks | none in the staging folder, although the collection's keywords name a juvenile white shark project |
| Other routes named on the records | NCEI's HTTPS directory and THREDDS; an IOOS ERDDAP table for the collection (a query interface the hub could call) |

- **False killer whales** (*Pseudorca crassidens*): 27 files, deployments from 16 Aug 2007 to 23 Feb 2014, North Pacific. The longest file by its name runs 23 Oct 2013 to 23 Feb 2014 (123 days).
- **The one file read** (`atn_98364_false-killer-whale_trajectory_20131023-20140223.nc`, 319,596 bytes, sha256 `9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6`): a SPOT5 tag; a location-type field (Argos, GPS or user-entered); the Argos location class; quality flags for time, speed and location with a roll-up flag; error radius and error-ellipse fields; a citation naming the data authors, dated 2025; the licence wording above.
- That is the richest quality information of any candidate so far: the source supplies its own speed and location tests. Our rule can lean on the source's flags instead of inventing thresholds, and must still be justified for this study.
- **Is it a dolphin?** False killer whales and pilot whales are in the dolphin family (Delphinidae). They are not what most visitors mean by "dolphin". The page would name the species exactly and not call it a dolphin without saying so.
- **Updated?** New deployments are added to the archive in batches a few times a year, after any embargo. Every false killer whale track in the folder ended by 2014. This is a growing archive of finished deployments, not live animals.

### 4c. OBIS-SEAMAP dolphin datasets
- The dolphin datasets found there are sightings, surveys and photo-identification (for example the Georgia "Dolphin Project" surveys, 1992–2003, CC BY-NC; a NOAA photo-ID catalogue, CC0). **These are occurrences, not journeys**, and must not be drawn as one.
- OBIS-SEAMAP's default licence is CC BY-NC unless a provider chooses otherwise (its FAQ, search extract).
- No tagged-dolphin track was found there in this pass. The catalogue was not searched exhaustively.

## 5. Kinds of position, kept apart

| Kind | Where it appears here | How it may be shown |
|---|---|---|
| Satellite fix (Argos, GPS) | South African white sharks; ATN false killer whales | Recorded fix, with the source's quality class; lines only under a per-study rule |
| Estimated position (light-level or model) | Likely the basking sharks; part of the juvenile white shark database | Labelled as an estimate with its method; never as a fix |
| Acoustic detection | OTN, ATAP | "Detected near receiver X at time T"; gaps between receivers shown; no track |
| Tag-release metadata | OTN release records on OBIS-SEAMAP | Where and when an animal was tagged; nothing more |

## 6. Enquiries prepared for Chad (not sent)

Sending either is Chad's decision. No address is recorded here; each organisation's contact route is on its own page. The drafts call Mother Earth non-commercial and educational; Chad to confirm that wording matches his plans before sending.

**A. NOAA Southeast Fisheries Science Center, about InPort item 26479**

> Subject: Access to "Bottlenose dolphin satellite telemetry spreadsheets (many)", InPort 26479
>
> Hello,
>
> I run Mother Earth, a small non-commercial educational website that shows dated observations of the planet with their sources. I am looking for tagged-dolphin movement data that can be shown as recorded, historical journeys.
>
> Your InPort record 26479 (bottlenose dolphin satellite telemetry, 1999–2005) lists no distribution yet. Could you tell me:
> 1. whether the data can be obtained, and how;
> 2. what terms apply to showing the recorded positions on a public educational website, with credit;
> 3. how the positions were obtained (tag type, Argos or GPS) and whether location quality is included;
> 4. whether you would want any locations generalised or omitted;
> 5. the citation you would like used.
>
> Ta,
> Chad

**B. ATAP / SAIAB, about a South African shark or ray dataset**

> Subject: A completed or generalised ATAP dataset for public educational display
>
> Hello,
>
> I run Mother Earth, a small non-commercial educational website based in Cape Town that shows dated observations of the planet with their sources. I would like to show South African shark and ray movement honestly, as detections at receivers and not as tracks.
>
> Could you tell me:
> 1. whether a completed study, or a generalised historical product, could be made available for that purpose;
> 2. the terms and credit you would require, and whether the tagging researchers would need to agree;
> 3. what delay or generalisation you would want for sensitive species or sites;
> 4. whether any regularly updated summary (for example detections per receiver region per month) could be shared.
>
> Ta,
> Chad

## 7. Recommended next steps (each needs Chad's go)

1. **Full audit of the South African white shark file** (open the CSV in memory, count, read the quality classes, check for implausible steps, write the sensitivity considerations). Same size as the zebra audit.
2. **Full audit of the ATN false killer whale files** (27 small files), if Chad accepts the species as his dolphin-family candidate, and a first look at the ERDDAP route as a hub-first feed.
3. Decide on the two enquiries.
4. Decide whether CC BY-NC sources (basking sharks, much of OBIS-SEAMAP) are acceptable for Mother Earth at all.

## 8. Limits of this pass

- Terms and metadata only. No shark or dolphin data file was opened, so no count here is ours except the ATN file listing and one file header.
- NCEI was unreachable; its record and the species list in its keywords are from search extracts.
- Searches are not a complete catalogue. "Not found" means not found in these searches.
- A published package does not show whether its parent project is still active.
- No conservation status is stated for any species here.
