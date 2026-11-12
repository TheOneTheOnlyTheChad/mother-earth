# Live dust — EUMETSAT Dust RGB source check (rev 2, 12 Nov 2026)

**For:** GPT and Chad. Source check only: nothing built, no layer added, no account created, no enquiry sent.
**Why:** Chad stopped the historical Follow the Dust release on 12 Nov ("this isn't live feed … we want live feeds"). GPT agreed (relayed by Chad) and named EUMETSAT's Meteosat Dust RGB as the candidate. Dust comes back onto the globe only if a usable near-real-time satellite source is verified.
**Status of the historical candidate:** branch `dust-rc` stays **unmerged** (last commit `4e0ffb5`, a work-in-progress save; its last test run was interrupted). Release checks cancelled. The Orange River source work is kept for reference (`docs/research/FOLLOW-THE-DUST-SOURCE-CHECK.md` rev 2).

Evidence tags: **[pane]** = read by Claude in the browser pane on `view.eumetsat.int`, pane clock in the same call. **[fetch]** = Claude's fetch tool, which returns a model summary, not page bytes (a lead, not a quotation). **[unopened]** = found, not opened (PDF; the project's text-only rule).

## 1. Bottom line (rev 2)
- **Technically it fits:** the feed is real, fresh (20–25 minutes old when read), covers southern Africa, is already georeferenced for the globe, and can be read by a browser directly at no cost to us.
- **Terms, after reading EUMETSAT's licensing guide (§5a):** the freshest frames are the problem, not the feed.
  - Meteosat image data **less than 1 hour old** is licensed. Free use is limited to personal, educational and research purposes that are non-commercial and non-operational; "broadcasting images based on the data" sits under a licence with an **annual fee of EUR 8,000**.
  - Meteosat image data **1 hour old or more** may be used "for any purpose" with attribution, at no fee, with one prohibition: redistributing the original numerical data.
- **Reading (ours, not EUMETSAT's statement):** a layer that always shows a frame **at least one hour old** fits the free tier and $0. A layer showing the newest frames on a public site does not.
- **Still open:** the guide is written about data, and does not say in terms that EUMETView pictures follow the same latency rule, or that an unregistered public page may embed them. That is one question for EUMETSAT's help desk, if Chad wants certainty before building (§5b).

## 2. What the service offers [pane, WMS GetCapabilities, 16:35:28 UTC 12 Nov 2026]
Endpoint `https://view.eumetsat.int/geoserver/ows` (WMS 1.3.0; capabilities 282,021 characters). Service-level fields: `AccessConstraints` "none", `Fees` "none". **These two fields are service metadata, not a licence.**

| Layer | Title | Time range and step | Latest frame at 16:35:28 | Extent |
|---|---|---|---|---|
| `mtg_fd:rgb_dust` | Dust RGB - MTG-I - 0 degree | 2024-10-22 → now, every **10 min** | 16:10 (25 min old) | 70°S–70°N, 70°W–70°E |
| `msg_fes:rgb_dust` | Dust RGB - MSG - 0 degree | 2020-09-01 → now, every **15 min** | 16:15 (20 min old) | 77°S–77°N, 77°W–77°E |
| `msg_iodc:rgb_dust` | Dust RGB - MSG - Indian Ocean | 2020-08-01 → now, every 15 min | 16:15 | 77°S–77°N, 35.5°W–118.5°E |
| `mumi:wideareacoverage_rgb_dust` | Geo Ring Dust RGB - Multimission | 2021-06-03 → now, every **3 h** | 15:00 (1 h 35 min old) | global |

- **One reading only.** Freshness was read once; how late frames usually arrive, and how often they are missing, is not measured.
- **Southern Africa is inside both 0-degree discs** (the Orange River mouth is at 28.6°S, 16.5°E). It is toward the disc's southern part, so pixels are larger there than at the equator; resolution there not measured.
- **The "Geo Ring" layer is global** every 3 hours. Its abstract is empty; "Multimission" implies other agencies' satellites are included, so **third-party terms may apply to it**. Not established.
- EUMETSAT's own description (verbatim, `mtg_fd:rgb_dust`): "The Dust product is an RGB (Red, Green, Blue) composite based on infrared channels. It is designed to monitor the evolution of dust storms during both day and night. However equally useful for the discrimination of cloud types (e.g. cloud phase or thin Cirrus detection) and detection of low-level moisture."

## 3. Access test [pane, WMS GetMap, 16:35:44 UTC]
Request: EPSG:4326, bbox 40°S–15°S, 0°–35°E, 700 × 500 JPEG, latest frame, no key, no sign-in.

| Layer | HTTP | Bytes | Time | `Access-Control-Allow-Origin` | Blank pixels |
|---|---|---|---|---|---|
| `mtg_fd:rgb_dust` | 200 | 56,246 | 1.8 s | `*` | 0 % |
| `msg_fes:rgb_dust` | 200 | 57,345 | 1.2 s | `*` | 0 % |
| `mumi:wideareacoverage_rgb_dust` | 200 | 50,193 | 2.6 s | `*` | 0 % |
| same, whole globe 2048 × 1024 | 200 | 372,325 | — | — | — |

- **A browser on any site can read it** (`*`), exactly as the page reads NASA GIBS for its backdrop. No hub, storage or scheduled job would be needed: **$0 in new cost** on that route.
- Response header `cache-control: max-age=604800, must-revalidate`.
- **Not checked:** rate limits, a usage policy for the WMS, whether automated or embedded use is allowed, availability over time. Neither shell can reach the host (proxy refusal); only the pane did.
- **Looked at:** the regional frame and the global frame both drew complete images. Whether dust was present on 12 Nov was not assessed.

## 4. What it shows, honestly labelled
- It is **false-colour infrared imagery, not a dust measurement**. Dust is one of several things it makes visible; cloud, moisture and bare desert also colour it. On the globe it would have to be labelled "Dust RGB imagery (EUMETSAT)", evidence tag Observed, with a short key and the frame time.
- It cannot give concentration or height, and thin dust under cloud is not seen.
- It would sit as an optional layer, off on load, like Ocean heat. Design is a later step and not proposed here.

## 5. Terms: what is known, what is not
**Known (weak evidence):**
- EUMETSAT website Terms of Use [fetch]: satellite data are governed by EUMETSAT's Data Policy; "Satellite data and products are not released under Creative Commons licence."; credit form "©EUMETSAT [year]".
- EUMETSAT news item of 15 January 2019 [fetch]: "Hourly EUMETSAT imagery data will no longer be subject to licensing." and "full-resolution imagery at 15 minutes intervals will become available free of charge, three hours after sensing."
- Licence documents titled "Licence for EUMETSAT Recommended Meteosat Data with a latency of less than 1 hour" exist on the User Portal [unopened]. **Their existence suggests that data fresher than one hour is licensed for at least some users.** What they cover is not read.

**Not known:**
- The current Data Policy (January 2026 PDF) [unopened].
- Whether EUMETView images (pictures, not data) fall under those latency rules at all.
- Whether a public website may embed or display them, at what freshness, and with what credit.
- Anything about the MTG layer specifically (the 2019 item predates MTG) or the multimission ring.
- EUMETSAT's User Portal licensing page would not load in the pane or in Chrome (stuck on "Loading"), so no HTML version of the rules was read.

## 5a. EUMETSAT's licensing guide (rev 2) [pane, read 16:40 UTC 12 Nov 2026, after Chad signed in to the User Portal]
Page: "Data registration and licensing", **V2.2, 4 Nov 2026**, https://user.eumetsat.int/resources/user-guides/data-registration-and-licensing. Read as page text. It summarises the Data Policy; the policy PDF itself is still unopened.

**Core data (verbatim):** "All EUMETSAT data and products declared as 'Core' by the EUMETSAT Council are made available without charge under a CC-BY-4.0 licence." Attribution form: "[Contains modified] EUMETSAT [Meteosat/Metop] [data/product] [Year of publication or distribution]" or "This service is based on EUMETSAT [Meteosat/Metop] [data/products] [Year of publication or distribution]."
- This corrects §5's first bullet: the tool summary of the website Terms of Use said satellite data are "not released under Creative Commons". The dated guide says Core data are CC BY 4.0. The guide is the stronger evidence.

**Recommended (licensed) data: Meteosat level 1 image data.** The tables list SEVIRI "Level 1.5 Image Data — 0 degrees" and "— Indian Ocean", and FCI "Level 1C Normal/High Resolution Image Data — 0 degree". These are the channels a Dust RGB is made from.

| Latency | May | Must | Must not | Fee |
|---|---|---|---|---|
| **≥ 1 hour** | "Access and use for any purpose." | "Include attribution to EUMETSAT." | "Redistribute the Original Numerical Data." | "There is no licensing fee" |
| **< 1 hour**, Personal / Educational / Research | "Use for non-commercial and non-operational personal, educational, research purposes." | attribution | redistribute original data; "Make any operational and commercial use, including broadcasting in any form of the data." | none |
| **< 1 hour**, Service Provider / Broadcaster | "Provide Value Added Service to third parties and/or broadcasting images based on the data." | attribution | redistribute original data (with exceptions) | "Annual fee of EUR 8,000." |

- The ≥ 1 hour licence is established by registering in the User Portal and accepting its terms ("To access these data, you need to register in the user portal and accept the related terms and conditions").
- **EUMETView** (User Portal page, same reading): "The Open Geospatial Consortium (OGC) APIs allow you to integrate EUMETView in to other applications using the available Web Map Service (WMS), Web Coverage Service (WCS) and Web Feature Service (WFS)." Integration into other applications is an intended use. No usage limits are stated on that page.

**What this does and does not establish**
- **Establishes:** a one-hour line in EUMETSAT's rules for Meteosat image data; free any-purpose use beyond it; a paid licence for broadcasting images inside it.
- **Does not establish (our interpretation fills the gap):**
  - that a Dust RGB picture from EUMETView counts as "data" under these licences. A picture is not the original numerical data, which points toward the rules being no stricter for pictures; it is not stated.
  - that an unregistered public page may show the ≥ 1 hour frames. The licence is described as accepted by a registered user; the WMS itself asks for no sign-in.
  - anything about the multimission global ring (other agencies' data).
- The Dust RGB does not appear in the guide's tables as a product in its own right, and the layers' WMS metadata carry no licence or catalogue link.
- **Not read:** the Data Policy PDF; EUMETView's own product page (stuck on "Loading" in the pane); the Resources tab guides.

## 5b. Ways forward (Chad's choice; none started)
1. **Build to the free tier:** the layer always requests a frame at least one hour old (the WMS takes a time), labelled with its time, credited to EUMETSAT. Proposal for GPT first.
2. **Ask EUMETSAT first:** one enquiry to the User Service Helpdesk, sent by Chad: may a public, free website display EUMETView Dust RGB frames ≥ 1 hour old via WMS with attribution, and does that need a registered licence? Sending grants nothing. Recommended as project practice, not shown to be required.
3. **Leave Dust off the globe.**

## 6. If the terms clear, the first technical questions
- Which layer: MTG (10 min, newest satellite), MSG (15 min, the one the 2019 statement is about), or the global ring (3 h).
- Measured freshness and gaps over a day or more.
- Resolution over southern Africa; whether a 2048 × 1024 world image is sharp enough or regional tiles are needed.
- How it sits over or beside the true-colour backdrop, and the key.
