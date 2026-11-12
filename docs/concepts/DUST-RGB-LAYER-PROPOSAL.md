# Dust RGB layer (EUMETSAT MTG) — proposal, rev 3 (12 Nov 2026, docs only)

**For:** GPT's review, then Chad's decisions (§9). Proposal only: no branch, build, REGISTER filing, hub deploy or page change is approved.
**Sources:** `docs/research/DUST-LIVE-SOURCE-CHECK.md` rev 2, and the measurements in §6 (browser pane, 12 Nov 2026).
**Replaces:** the historical Follow the Dust candidate (`dust-rc`, unmerged, stopped by Chad).

**Revision history**
- **Rev 1:** the reader's browser fetches the latest frame straight from EUMETSAT.
- **Rev 2:** GPT's review applied; time-handling, footprint, cache and speed measurements; a 24-hour log started.
- **Rev 3: the design changes, on Chad's direction (12 Nov).** In his words: "if we ping this thing once or twice a day to start off with that should be enough as MVP for this layer … set it up like we did the others to fetch data … a couple of updates per day would be fine for now until we decide we want it like an actual live flowing layer."
  - **The hub fetches a frame a few times a day and serves its stored copy.** Readers' browsers no longer call EUMETSAT.
  - This answers GPT's open question from the rev 2 review (can the page reliably fetch a usable image, at a useful size, and pair it with the right time) by moving all three to the hub (§4).
  - The 24-hour log no longer blocks a build (§6d). GPT has not reviewed this design.

## 1. What it is, in one paragraph
- **An optional globe layer, off on load.** It paints EUMETSAT's Dust RGB picture from Meteosat Third Generation onto the part of the globe that satellite sees.
- **A few frames a day, fetched by the hub** on its existing schedule and stored as the one current frame. The card states the frame's observation time, its age, and that it updates a few times a day.
- **It is imagery, not a dust measurement**, and it is not continuous: it is the latest frame the hub fetched.
- **Cost:** no new line item. A handful of small requests a day from the Worker, and one image of well under a megabyte kept in R2 and replaced each time.

## 2. The product and its terms
**Catalogue entry (browser pane, signed in by Chad, read 16:46 UTC 12 Nov 2026):** https://user.eumetsat.int/catalogue/EO:EUM:DAT:0869
- Title "Dust RGB - MTG - 0 degree". Satellites: MTG. Sensors: FCI (Imager). Processing status: Operational. Processing level: **Visualisation**. Spatial resolution: 2 km. Temporal extent: 2 Dec 2024–Now.
- **Data policy (verbatim): "Free and unrestricted - CC-BY-4.0"**. Collection reference `EO:EUM:DAT:0869`.
- Description (verbatim): "The Dust product is an RGB composite based on infrared channels. It is designed to monitor the evolution of dust storms. However, it is equally useful for discriminating cloud types (eg, cloud phase or thin Cirrus detection) and detecting low-level moisture and also volcanic plumes. Being based solely on IR channels, this product has the same utility both during the day and night."

**The WMS layer is that product:**
- The catalogue entry's "Explore in EUMETView" link goes to `https://view.eumetsat.int/productviewer/productDetails/mtg_fd:rgb_dust`, and its Access tab lists EUMETView only.
- The WMS layer `mtg_fd:rgb_dust` is titled "Dust RGB - MTG-I - 0 degree" and carries the same description.
- **Use each for what it can prove (GPT):** the catalogue for product identity and licence; the tested WMS response for what the page can actually display (§6c).
- **Two small mismatches, recorded, not explained:**
  - the catalogue gives the extent as 77° and 79°, the WMS layer's bounding box is 70° by 70°;
  - the catalogue's record starts 2 Dec 2024, the WMS time range starts 22 Oct 2024.
- The WMS layer's own metadata carries no licence or catalogue link, so the match rests on the catalogue's link to it.

**The Data Policy itself:**
- **GPT's reading, relayed by Chad (GPT's extraction; neither Chad nor Claude has read the PDF):** Article 4 and Annex II classify this kind of RGB composite as a Core Advanced Image Product; Articles 5 and 6 support public reuse with attribution; the one-hour threshold applies to the Recommended Level 1 inputs, not to this product.
- **Claude's reading of the licensing guide** (V2.2, 4 Nov 2026, page text): Core data and products are "made available without charge under a CC-BY-4.0 licence"; the one-hour licences are listed for Level 1 image data. That agrees with GPT's reading.
- **Storing and serving a copy is covered:** CC BY 4.0 permits redistribution with attribution, which is what the hub would do (§3).
- **This supersedes the source check's rev 2 caution** that a public layer should stay an hour behind. That caution treated the picture like its Level 1 inputs; the catalogue entry answers it.

**Credit (the guide's form, adapted):** "Contains modified EUMETSAT Meteosat data 2026 · Dust RGB - MTG - 0 degree · CC BY 4.0", with links to the catalogue entry and the licence. "Modified" because we reproject the picture onto a globe. No EUMETSAT logo.

## 3. How it is fetched (hub)
A new collector job, `dustrgb`, gated by a plain variable `DUSTRGB_ENABLED` (absent = off), in the pattern of the buoys and plastic jobs.
1. **Read the list:** GetCapabilities limited to the `mtg_fd` namespace (34,860 bytes when measured). Take the layer's latest advertised time.
2. **Skip if unchanged:** if that time is the frame already stored, stop. No image request.
3. **Fetch the picture** for that exact advertised time, box 80°S–80°N, 80°W–80°E.
4. **Verify before keeping it (§4):** HTTP 200, an image content type, a decodable image signature of the expected size, **and the server's `Warning` header naming the same time that was requested.** Anything else is a failed run.
5. **Publish:** write the image and a small metadata file (frame time, fetched-at time, bytes, SHA-256, the server's stated time, the request box). Only then does the stored frame change.
6. **On failure:** the previous good frame stays, with its original times, and the failed attempt is recorded beside it. This is the buoy fallback pattern (hub 0.6.8). The page decides what to show from the frame's age (§5).

**Cadence (Chad: "a couple of updates per day")**
- **Proposed start: four runs a day**, at 00:07, 06:07, 12:07 and 18:07 UTC (02:07, 08:07, 14:07 and 20:07 SAST), riding the existing hourly job. Two a day is equally easy; it is one setting.
- Each run costs EUMETSAT two requests (one if nothing is new). **At four runs that is at most eight requests a day**, against response headers that state a limit of 20 per unstated window.
- Going to hourly later changes that one setting and nothing else.

**Format and size**
- **Picture:** JPEG, 2048 × 2048 (669,520 bytes when measured; it once took 37 seconds to arrive, which a background job can wait for).
- **Footprint:** a transparent PNG of the same frame and box at a smaller size, fetched in the same run, stored beside the picture and used as the mask and for the outline. The 160 × 160 version was 64,592 bytes.
  - **To settle in the build, by measurement:** the mask size that is sharp enough at the disc edge and preserves any gaps inside the picture, compared against a full-size transparent PNG if the hub can fetch one.
  - The mask is fetched **per frame**, not reused, so a gap in one frame is never hidden by another frame's mask.
- **Hub routes:** `GET /snapshot/dustrgb/meta` (JSON, short cache) and `GET /snapshot/dustrgb/<frame time>/<file>` (the image and the mask; safe to cache for long because the address names the frame).

**The one unknown that decides this route**
- **Whether Cloudflare's Workers can reach `view.eumetsat.int` at all.** OpenSky refused cloud servers; EUMETSAT is untested. Both of Claude's shells are refused by their own proxy, which says nothing about Cloudflare.
- **First build step, before anything else is written:** a single reachability test from the Worker (one capabilities request, result reported, nothing stored), on its own Approve line since it is a production deploy. If it fails, this route is closed and the choice returns to the browser-direct design of rev 2, or to leaving Dust off.

## 4. What moving it to the hub settles
| GPT's open question (rev 2 review) | Browser-direct (rev 2) | Hub-collected (rev 3) |
|---|---|---|
| Is the picture the frame the card names? | The page cannot read the server's stated time; it could only avoid known-bad requests. | **The hub reads the server's stated time and refuses a mismatch.** The page shows the time the hub verified. |
| Can a usable image be fetched at a useful size? | Large frames were slow and variable for the reader. | The hub waits; readers get a stored file from the hub. |
| Request limits at public traffic | Unknown headroom, shared per address. | At most eight requests a day in total. |
| A week-long browser cache on images | A risk for default-time requests. | Each stored frame has its own address. |
| Dependence | Readers' browsers call EUMETSAT. | Readers call only the hub. |

- **What it gives up:** freshness. A frame is up to about six hours old at four runs a day, plus the 20 to 30 minutes EUMETSAT takes to publish (§6a).
- **Still not provable:** that the picture's pixels are what EUMETSAT intended for that time. The hub verifies the server's own statement, which is the best evidence available. §6b shows that statement was wrong for an off-grid time, so the hub requests only advertised times.

## 5. What the reader sees
**Card** (Optional layers, after Ocean heat): heading "Dust RGB imagery", evidence tag **Observed**, described as "a false-colour infrared composite". One switch.
- **Off:** "Off. Switch on to load the latest Dust RGB frame."
- **On:** **"Frame 12 Nov, 16:30 UTC · 5 h old"**, "Meteosat (MTG) at 0°", and **"Updated a few times a day — not continuous."**
  - Chad reads times in South African time in conversation; the globe's convention is UTC. Whether this card also shows local time is D7.
- **Time and picture change together:** a newer frame is fetched and decoded in the background, and only then are the texture, the mask and the timestamp line swapped in one step.
- **States** (the page's existing words), from the frame's age against the cadence:
  - **current:** younger than one run interval plus a margin;
  - **stale:** older than that, shown with its age;
  - **unknown:** older than threshold B, or nothing could be loaded. Nothing is painted and the card says why.
  - **Provisional values at four runs a day: current up to 8 h, unknown beyond 24 h.** B is a product judgement (GPT): how old a dust picture can be and still belong on a globe called "Earth now".
- **A failed page load of a newer frame:** any frame already shown stays, with its own age and "Refresh unavailable", until B.
- **A failed first load:** nothing is painted; the card says the frame could not be loaded.
- **A failed hub run** is visible as a growing age, and in `/status` like every other collector.

**Coverage and gaps**
- Copy (GPT's): "Shows the part of Earth visible to Meteosat from 0°. Detail decreases toward the edge."
- The outline follows the frame's own footprint (its mask, §3; measured in §6c), not the rectangular request box.
- Outside the footprint the globe keeps its normal backdrop. Gaps inside it stay clear.

**What the colours can show**
- EUMETSAT's own words, quoted: the product "is designed to monitor the evolution of dust storms" and "is equally useful for discriminating cloud types … and detecting low-level moisture and also volcanic plumes".
- **Colour cue, provisional (GPT's wording, D4):** "Airborne dust can appear pink or magenta. Clouds, moisture and the surface also affect the colours." Provisional until checked against an MTG example or guide.
- No amount, height or ground-level concentration, and no forecast. Infrared, so it works by night as well as by day.

**Credit:** "Contains modified EUMETSAT Meteosat data 2026 · Dust RGB - MTG - 0 degree · CC BY 4.0", on the card, in the footer and on Sources & Details.

## 6. Measurements so far (browser pane on `view.eumetsat.int`, 12 Nov 2026; one afternoon, indicative only)

### 6a. Frame lag
| Clock (UTC) | Latest advertised frame | Age |
|---|---|---|
| 16:35:28 | 16:10 | 25 min |
| 16:47:18 | 16:20 | 27 min |
| 16:49:18 | 16:20 | 29 min |
| 16:51:22 | 16:30 | 21 min |
| 16:53:22 | 16:30 | 23 min |

- **The 16:30 frame became the advertised latest between 16:49:18 and 16:51:22: 19 to 21 minutes after its time stamp.** The 16:20 frame appeared between 16:35:28 and 16:46:42 (15 to 27 minutes).
- **Reading:** a reader would see a frame roughly 20 to 30 minutes old, the age climbing for 10 minutes and then dropping when the next frame is advertised. Two frames only; the 24-hour log decides.
- **Recent frames present:** each 10-minute slot from 10:30 to 16:20 UTC (36 frames), requested by explicit time as a small picture over southern Africa, returned a complete picture. Response time 0.9 s fastest, 2.9 s average, 26.5 s slowest.
  - As GPT noted, differing file sizes do not prove which time the server rendered. §6b tests that directly.

### 6b. What the service does with the time we ask for (16:52–16:54 UTC; latest advertised frame 16:30)
Same-origin requests, so the response headers were readable. Pictures compared by a hash of their decoded pixels.

| Requested `TIME` | Result | Server's `Warning` header | Pixels |
|---|---|---|---|
| none | image | "Default value used: time=…16:30" | P1 |
| 16:30 (advertised latest) | image | "Nearest value used: time=…16:30" | **P1, identical** |
| 16:30 again | image | same | P1, identical |
| 16:20 (advertised) | image | "Nearest value used: time=…16:20" | P2 |
| 16:23 (off the 10-minute grid) | image | "Nearest value used: time=…16:20" | **P3: not P2 and not P1** |
| 16:29:59 (off-grid) | image | "Nearest value used: time=…16:20" | P3 |
| 16:40 (next slot, not yet advertised) | image | "Nearest value used: time=…16:30" | differed from P1 in the first test; identical to P1 on a whole-disc repeat a minute later |
| one day ahead | **HTTP 200, XML error document** | none | no image |
| 2024-10-01 (before the record) | HTTP 200, XML error document | none | no image |
| "yesterday" (malformed) | HTTP 200, XML error document | none | no image |

**What this establishes**
- **The service substitutes a nearby frame without an error** when asked for a time it does not have within its range. GPT's concern is confirmed.
- **For an off-grid time the picture returned was not the frame the header named.** At 280 × 280 over the whole disc it differed from the true 16:20 frame in 47,952 of 78,400 pixels, more than 16:20 and 16:30 differ from each other (29,025). What that picture is, is not established.
- **For an advertised time, asked for exactly, the picture matched the default latest frame** pixel for pixel (two requests).
- **Out-of-range and malformed times return HTTP 200 with an XML error**, not an image and not an error status.
- **The page cannot read the `Warning` header:** the response exposes no headers to other origins (`Access-Control-Expose-Headers` absent). So the page cannot confirm which frame it was given.
- **Not established:** the 16:40 result changed between two tests a minute apart and is unexplained; behaviour during a real gap in the record; whether the two matching requests generalise.

**Consequences for a browser-direct design (rev 2; kept for the record)**
- Request **only a time read from the capabilities document, exactly as advertised**. Never an off-grid time, never the default.
- **The page cannot prove label and picture agree; it can only avoid the cases shown to break it.** That is the honest claim, and the card's wording must not go beyond it.
- Check that the response is an image that decodes; treat anything else as a failed refresh.
- A frame advertised but answered with a substitute would not be detected. The 24-hour log records the server's stated time for every frame, to measure how often it differs.

**Cache headers** (every image response): `cache-control: max-age=604800, must-revalidate`; no `ETag`, no `Last-Modified`.
- A request **without** a time could be cached by the browser for a week under one address. Another reason never to use the default.
- A request **with** a time may also be cached for a week. That is right if frames never change after publication; whether they do is not measured.

### 6c. Verified image footprint (16:53 UTC, the 16:30 frame)
Whole-world request, transparent PNG, 720 × 360 (0.5° per pixel):
- **The picture is a disc with transparency outside it.** Every pixel is fully opaque or fully clear (no partial transparency).
- **Extent:** 77.25°N to 76.75°S; at the equator 79.25°W to 78.75°E. Narrower toward the poles: 55.75°W–54.25°E at 70°N, 59.25°W–59.75°E at 70°S. Nothing at 80° N or S.
- 34.5 % of the world box is filled. One clear pixel inside the disc in the sampled rows; 1,129 near-black pixels inside it, not examined.
- **This matches the catalogue's extent (77° and 79°), not the WMS bounding box (70°).** The layer's stated box understates what it serves. The request box becomes 80°S–80°N, 80°W–80°E.
- **The JPEG has no transparency**, so its corners outside the disc are painted. The footprint above is the mask.
- Measured at 0.5°; the build re-measures it at the request size and asserts it.

### 6d. The day log (running; no longer blocks the build)
- **Rev 3:** with the hub fetching a few frames a day, this log no longer decides anything before a build. It keeps running overnight as background evidence on lag and time handling.
- **Started 16:54:34 UTC 12 Nov**; changed at 16:59:30 UTC to a 7-minute interval (so it walks through the 10-minute publishing cycle), with the frame-time header recorded per frame as present or absent and by the time it names.
- **Original set-up:** in the browser pane tab on `view.eumetsat.int`. **Chad's go was GPT's recommendation relayed without objection; Claude started it as a read-only measurement and says so here. It stops if Chad says stop.**
- Every 10 minutes: one capabilities request (34,860 B) and one 160 × 160 transparent PNG of the advertised latest frame (64,592 B on the first row), by explicit time.
- Each row records: clock time, whether the tab was hidden, the advertised latest time, response times and statuses, the content type, a hash of the picture, the server's stated time from the `Warning` header, and the rate-limit header.
- Rows are kept in the tab's local storage, so a reload does not lose them. **The timer stops if the tab is closed or navigated, and pauses while the Mac sleeps.** Missed checks will show as gaps and are reported as gaps.
- **What it will give:** the distribution of frame age; how often the advertised frame's stated time differs from the requested time; error and non-image responses; gaps.
- **Thresholds (GPT):** A is set from ordinary delivery lag with a margin. B is a judgement about how old a picture can be and still serve the globe, and a healthy day cannot set it.

## 7. What it is not
- Not continuous and not animated: one current frame, replaced a few times a day.
- Not the multimission global ring, the older MSG layers or the Indian Ocean view. Each needs its own check.
- Not a dust detection, alert or count: no cells, no records, no place-view rows.
- **No history kept:** one current frame, the previous one deleted after a successful publish (the lean-storage rule of 3 Nov). Keeping frames for a later time-lapse would be a separate decision and is flagged here, not proposed.

## 8. Build shape (for a later Go; not requested now)
**Order**
1. **Reachability test from the Worker** (own Approve line). Stop here if it fails.
2. **Hub:** the `dustrgb` job, the two routes, a `/status` row, the `DUSTRGB_ENABLED` gate, version bump. Outside history and the health monitors for the first release.
3. **Page:** new file `dustrgb.js`, the card, scoped styles, Sources section. Painted by the Ocean Heat method: a texture on a sphere just above the surface, limited to the frame's box, masked to its footprint, partly transparent.
4. **REGISTER** entry on its own line.

**Tests**
- **Hub** (real job code, EUMETSAT stubbed, faked clock):
  - a good run publishes picture, mask and metadata that agree;
  - unchanged latest time → no image request;
  - **stated time differs from requested → run fails, previous frame kept;**
  - **`Warning` header missing → run fails** (counted separately from a mismatch);
  - HTTP 200 with an XML error → run fails;
  - undecodable image → run fails;
  - a failed run keeps the previous frame with its original times;
  - gate off → no request at all.
- **Page:**
  - layer off → no request;
  - on → metadata then exactly one picture and one mask;
  - label time equals the metadata's verified time;
  - current, stale and unknown from a faked clock;
  - **failed first load leaves the globe clear;**
  - **failed refresh keeps the existing frame and its original time until B, then clears it;**
  - **switching the layer off while an image is in flight: the late response never repaints;**
  - outline drawn from the mask; credit present.
- Breaks for each. Full regression.

**Checks on the real globe:** opacity and legibility over southern Africa at 2048 and 1024, in desktop Chrome with Chad, then the phone.
**Release:** branch → GPT review of the candidate → Approve lines for the hub deploy, REGISTER and the page merge, each separate.

## 9. Decisions for Chad
| Decision | Recommendation | Status |
|---|---|---|
| **D1 Name and tag** | "Dust RGB imagery", Observed, "a false-colour infrared composite", "Frame" on the timestamp line | GPT: ready as written |
| **D2 Freshness** | hub-collected, **four runs a day** to start; current up to 8 h, unknown beyond 24 h, both provisional | **changed in rev 3; needs GPT's review** |
| **D3 Limits** | at most eight requests a day needs no enquiry; an optional help-desk note stays Chad's choice | changed in rev 3 |
| **D4 Colour key** | the provisional sentence, until checked against an MTG reference | open |
| **D5 First release** | latest MTG 0° disc only; settle picture and mask sizes and southern Africa legibility in the build | open |
| **D6 Policy record** | GPT's labelled reading of Data Policy Articles 4–6 and Annex II, beside the product listing | GPT: ready as written |
| **D7 Times on the card (new)** | UTC only, as everywhere else on the globe; or UTC with the reader's local time beside it | new |
| **D8 Reachability test (new)** | one Worker request to EUMETSAT, on its own Approve line, before any other build work | new |
