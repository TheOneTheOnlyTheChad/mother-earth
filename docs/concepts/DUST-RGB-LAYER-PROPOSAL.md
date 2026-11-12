# Dust RGB layer (EUMETSAT MTG, near-real-time) — proposal, rev 1 (12 Nov 2026, docs only)

**For:** GPT's review, then Chad's decisions (§9). Proposal only: no branch, build, REGISTER filing or page change is approved.
**Asked for by:** GPT's review of the live-dust source check, relayed by Chad on 12 Nov: a docs-only proposal for the near-real-time MTG Dust RGB layer, scoped to MTG at 0°.
**Sources:** `docs/research/DUST-LIVE-SOURCE-CHECK.md` rev 2, plus the checks in §2–§4 below (browser pane, 12 Nov 2026).
**Replaces:** the historical Follow the Dust candidate (`dust-rc`, unmerged, stopped by Chad). Nothing from that branch is reused here except what §8 names.

## 1. What it is, in one paragraph
- **An optional globe layer, off on load.** When switched on, it paints EUMETSAT's latest Dust RGB frame from Meteosat Third Generation onto the part of the globe that satellite sees (Africa, Europe, the Atlantic, the Middle East).
- **It shows what the satellite observed at a stated time**, with that time and its age on the card, and the area the satellite does not see left plainly uncovered.
- **It is imagery, not a dust measurement.** The card says what the colours can and cannot tell you.
- **$0 in new cost:** the reader's browser fetches the frame straight from EUMETSAT, the same way the page already fetches the NASA backdrop. No hub, storage or scheduled job.

## 2. The product and its terms
**Catalogue entry (browser pane, signed in by Chad, read 16:46 UTC 12 Nov 2026):** https://user.eumetsat.int/catalogue/EO:EUM:DAT:0869
- Title "Dust RGB - MTG - 0 degree". Satellites: MTG. Sensors: FCI (Imager). Processing status: Operational. Processing level: **Visualisation**. Spatial resolution: 2 km. Temporal extent: 2 Dec 2024–Now.
- **Data policy (verbatim): "Free and unrestricted - CC-BY-4.0"**. Collection reference `EO:EUM:DAT:0869`.
- Description (verbatim): "The Dust product is an RGB composite based on infrared channels. It is designed to monitor the evolution of dust storms. However, it is equally useful for discriminating cloud types (eg, cloud phase or thin Cirrus detection) and detecting low-level moisture and also volcanic plumes. Being based solely on IR channels, this product has the same utility both during the day and night."

**The WMS layer is that product:**
- The catalogue entry's "Explore in EUMETView" link goes to `https://view.eumetsat.int/productviewer/productDetails/mtg_fd:rgb_dust`, and its Access tab lists EUMETView only.
- The WMS layer `mtg_fd:rgb_dust` is titled "Dust RGB - MTG-I - 0 degree" and carries the same description.
- **Two small mismatches, recorded, not explained:**
  - the catalogue gives the extent as 77° and 79°, the WMS layer's bounding box is 70° by 70°;
  - the catalogue's record starts 2 Dec 2024, the WMS time range starts 22 Oct 2024.
- The WMS layer's own metadata carries no licence or catalogue link, so the match rests on the catalogue's link to it.

**The Data Policy itself:**
- **GPT's reading, relayed by Chad (GPT's extraction; neither Chad nor Claude has read the PDF):** Article 4 and Annex II classify this kind of RGB composite as a Core Advanced Image Product; Articles 5 and 6 support public reuse with attribution; the one-hour threshold applies to the Recommended Level 1 inputs, not to this product.
- **Claude's reading of the licensing guide** (V2.2, 4 Nov 2026, page text): Core data and products are "made available without charge under a CC-BY-4.0 licence"; the one-hour licences are listed for Level 1 image data. That agrees with GPT's reading.
- **This supersedes the source check's rev 2 caution** that a public layer should stay an hour behind. That caution treated the picture like its Level 1 inputs; the catalogue entry answers it.

**Credit (the guide's form, adapted):** "Contains modified EUMETSAT Meteosat data 2026 · Dust RGB - MTG - 0 degree · CC BY 4.0", with links to the catalogue entry and the licence. "Modified" because we reproject the picture onto a globe. No EUMETSAT logo.

## 3. Access, limits and the $0 path (browser pane, 16:47 UTC)
- **Endpoint:** `https://view.eumetsat.int/geoserver/ows`, WMS 1.3.0. No key, no sign-in. `Access-Control-Allow-Origin: *`, so a browser on any site can read the image and its pixels.
- **Finding the latest frame:** a GetCapabilities request limited to the `mtg_fd` namespace is **34,860 bytes** and states the layer's latest time. (The full capabilities document is 282,021 characters; the page would never request that.)
- **The frame:** GetMap in EPSG:4326 with an explicit `TIME`. The whole disc at 2048 × 2048 JPEG was **655,532 bytes**.
- **Limits, as the service's own response headers state them:**
  - `x-rate-limit-limit: 20` with `x-rate-limit-action: Delay excess requests 1000ms` (context `wms`);
  - `x-concurrent-limit-user: 8`.
  - **The window for the "20" is not stated** in the headers, and no written usage policy was found as page text. EUMETSAT's WMS tutorials are PDFs, unopened.
- **Our footprint per reader:** two requests when the layer is switched on, then two more only when a newer frame exists, checked every 10 minutes while the layer is on and the tab is visible. Nothing is requested while the layer is off. That is far below the stated limits.
- **Stated purpose:** the EUMETView page says its OGC services "allow you to integrate EUMETView in to other applications".
- **Dependence:** readers' browsers call EUMETSAT directly, so EUMETSAT sees our readers' requests, and an outage there shows as "not available" here. Proxying through the hub would hide that and cost money; not proposed.

## 4. Freshness and availability — measured first, threshold second
GPT asked that the freshness rule come from measurement. First measurements (browser pane, 12 Nov 2026; one afternoon, one site, so indicative only):

- **Latest frame against the clock** (GetCapabilities readings):

  | Clock (UTC) | Latest frame | Age |
  |---|---|---|
  | 16:35:28 | 16:10 | 25 min |
  | 16:47:16 | 16:20 | 27 min |
  | 16:49:18 | 16:20 | 29 min |

  - The 16:20 frame was not yet listed at 16:35:28 and was showing on the catalogue page at 16:46:42. So that frame was published between 15 and 27 minutes after its time stamp.
  - **Reading:** at the moments sampled, the newest frame a reader gets was 25 to 29 minutes old. A new frame every 10 minutes means the age shown would normally swing over about a 10-minute range.
  - A sampler reading every 2 minutes for about 30 minutes was still running when this revision was written; its result is added in the next revision.
- **Were recent frames there?** Each 10-minute slot from 10:30 to 16:20 UTC (36 frames) was requested as a small picture over southern Africa, one at a time:
  - **36 of 36 returned a complete picture** (HTTP 200, no empty pixels).
  - 35 distinct file sizes among the 36, so the frames differ from one another; two had the same size, not examined.
  - Response time: fastest 0.9 s, average 2.9 s, slowest 26.5 s (one outlier).
- **Not measured:** night-time and overnight behaviour, outages, how the service answers for a slot that is missing, and anything over more than six hours.

**Proposed before any build:** a 24-hour log of "latest frame time against clock time", one small request every 10 minutes from a browser tab on Chad's Mac while it is awake, written to the research packet. The freshness thresholds in §5 are then set from that log and stated with it. Until then the numbers in §5 are placeholders marked as such.

## 5. What the reader sees
**Card** (Optional layers, after Ocean heat): heading "Dust RGB imagery", evidence tag **Observed**, one switch.
- **Off:** "Off. Switch on to load EUMETSAT's latest Dust RGB frame."
- **On:** "Observed 16:20 UTC · 27 min ago · Meteosat (MTG) at 0°". The age updates on the page's existing 30-second timer.
- **States** (the page's existing words):
  - **current**: the frame is younger than threshold A;
  - **stale**: older than A, shown with its age;
  - **unknown**: older than threshold B, or the frame failed to load or decode. Nothing is painted; the card says why.
  - A and B come from the §4 log. **Placeholders until then: A = 60 min, B = 3 h.**
- **Never a guess:** if the latest time cannot be read, nothing is painted. A frame is always requested by its explicit time, so the label and the picture cannot disagree.

**Coverage and gaps:**
- The frame covers the satellite's view only. Outside it, the globe keeps its normal backdrop and the card says "Covers Africa, Europe, the Atlantic and the Middle East (the satellite's view from 0°). No coverage elsewhere."
- The edge of coverage is drawn as a thin outline, so "no dust shown" is never confused with "not observed".
- Near the edge of the disc the satellite looks at a steep angle and pixels stretch. The card says detail falls off toward the edge.
- Pixels the frame leaves empty stay transparent.

**What the colours can show** (short, in the card's "What this is and is not"):
- EUMETSAT's own words, quoted: the product "is designed to monitor the evolution of dust storms" and "is equally useful for discriminating cloud types … and detecting low-level moisture and also volcanic plumes".
- Dust usually appears pink to magenta. **This colour key needs a source:** it is standard in EUMETSAT's training material, which was not read for this proposal. The key is written only from a page we can quote, checked before the build.
- Cloud, moist air and bare desert also colour the picture. Pink is not always dust, and dust under cloud is not seen.
- It gives no amount, height or ground-level concentration, and no forecast.
- Infrared, so it works by night as well as by day.

**Credit:** on the card, in the page footer and on Sources & Details (§2).

## 6. How it is painted
- **Method:** the Ocean Heat method. A texture on a sphere just above the surface, limited to the frame's latitude and longitude box, with partial transparency so coastlines stay readable. It does not touch the observation layers or their records.
- **Size:** one 2048 × 2048 frame for the 140° × 140° box is about 7.6 km per pixel at the equator, coarser than the product's 2 km.
  - Phones take 1024 × 1024.
  - **Sharper regional detail (tiles as the reader zooms) is not in this proposal.** It multiplies requests and should follow the limits answer in §9.
- **Placement and opacity are judged on the real globe** against the true-colour backdrop, in a preview, before any release. A lesson from the buoy colours.
- **No animation, no time slider** in the first release: the latest frame only.

## 7. What it is not
- Not the multimission global ring (`mumi:wideareacoverage_rgb_dust`): other agencies' data, so it needs its own source and terms check.
- Not the older MSG layers, and not the Indian Ocean view.
- Not a dust detection, alert or count. No cells, no records, no place-view rows, no history kept.
- Not a hub feature: nothing is stored or served by Mother Earth.

## 8. Build shape (for a later Go; not requested now)
- One new page file `dustrgb.js`, a card in `index.html`, scoped styles, a Sources section, a REGISTER entry on its own line.
- **Reused from `dust-rc`:** nothing in the page. Two test lessons carry over: a plain backdrop image so the test globe finishes building, and assertions limited to what the page controls.
- **Tests:**
  - layer off → no request to EUMETSAT;
  - on → exactly one capabilities request and one frame request, the frame requested by explicit time;
  - label time equals requested time;
  - stale and unknown states from a faked clock;
  - capabilities unreadable, frame error and undecodable frame → nothing painted, reason shown;
  - outline drawn; credit present;
  - switch off → texture removed and no further requests;
  - a hidden tab makes no refresh requests.
  - Breaks for each.
- **Checks on the real globe** in desktop Chrome with Chad, then the phone.
- **Release:** branch, GPT review of the candidate, then separate Approve lines for REGISTER and merge.

## 9. Decisions for Chad (after GPT)
- **D1 Layer name and tag:** "Dust RGB imagery", tagged Observed.
- **D2 Freshness:** run the 24-hour log first (needs a browser tab left open on the Mac while it is awake), then set A and B from it.
- **D3 Limits:** proceed on the response headers and the page's small footprint, or first send EUMETSAT's help desk one question about embedding the WMS in a public page and its request limits. Sending grants nothing. Recommended as project practice, not shown to be required.
- **D4 Colour key source:** which EUMETSAT page the key is quoted from, to be found and read before the build.
- **D5 First release scope:** whole-disc latest frame only (recommended), with regional sharpening and animation left for later.
- **D6 Data Policy PDF:** GPT has read it; Claude has not. Either keep GPT's extraction as the record, labelled as GPT's, or lift the text-only rule for that one document so the repo's record quotes it directly.
