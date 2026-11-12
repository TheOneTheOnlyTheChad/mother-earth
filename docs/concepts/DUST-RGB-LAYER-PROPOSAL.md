# Dust RGB layer (EUMETSAT MTG, near-real-time) — proposal, rev 2 (12 Nov 2026, docs only)

**For:** GPT's review, then Chad's decisions (§9). Proposal only: no branch, build, REGISTER filing or page change is approved.
**Asked for by:** GPT's review of the live-dust source check, relayed by Chad on 12 Nov: a docs-only proposal for the near-real-time MTG Dust RGB layer, scoped to MTG at 0°.
**Sources:** `docs/research/DUST-LIVE-SOURCE-CHECK.md` rev 2, plus the checks in §2–§4 below (browser pane, 12 Nov 2026).
**Rev 2 (12 Nov 2026):** GPT reviewed rev 1 (relayed by Chad): ready for the 24-hour measurement pass, to be revised before any branch build. Changes:
- §3: the "far below the stated limits" claim is removed; the request budget is stated as a maximum per tab per hour, with back-off.
- §4: new measurements: publishing lag, what the service does for a time it does not have, cache headers, and the image footprint. The 24-hour log is running (§4c).
- §5: the timestamp line says "Frame"; time and picture swap together; a failed refresh keeps the last usable frame; the outline follows the verified footprint; transparency is verified on PNG.
- §9: GPT's recommendations recorded against D1–D6. The decisions stay Chad's.

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
- **Use each for what it can prove (GPT):** the catalogue for product identity and licence; the tested WMS response for what the page can actually display (§4b).
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
  - **What "user" means in those headers is not stated either** (per address, per session or something else).
- **Our request budget, as a maximum:** per tab that is visible and has the layer on, **at most six capabilities requests and six image requests an hour**.
  - On switching on: one capabilities request, then one image request.
  - Every 10 minutes after that: one capabilities request. An image request follows only if the latest time has changed.
  - Only one request in flight at a time. A frame already shown is never fetched again.
  - On a throttled or failed response the next check waits longer (20, 40, then 60 minutes), returning to 10 after a success.
  - Layer off or tab hidden: no requests.
- **What is not established:** how the service behaves at public traffic levels. Many readers behind one address could share one allowance. The headers show that throttling exists; they do not show our headroom.
- **Stated purpose:** the EUMETView page says its OGC services "allow you to integrate EUMETView in to other applications".
- **Dependence:** readers' browsers call EUMETSAT directly, so EUMETSAT sees our readers' requests, and an outage there shows as "not available" here. Proxying through the hub would hide that and cost money; not proposed.

## 4. Measurements so far (browser pane on `view.eumetsat.int`, 12 Nov 2026; one afternoon, indicative only)

### 4a. Frame lag
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
  - As GPT noted, differing file sizes do not prove which time the server rendered. §4b tests that directly.

### 4b. What the service does with the time we ask for (16:52–16:54 UTC; latest advertised frame 16:30)
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

**Consequences for the design (§5, §6)**
- Request **only a time read from the capabilities document, exactly as advertised**. Never an off-grid time, never the default.
- **The page cannot prove label and picture agree; it can only avoid the cases shown to break it.** That is the honest claim, and the card's wording must not go beyond it.
- Check that the response is an image that decodes; treat anything else as a failed refresh.
- A frame advertised but answered with a substitute would not be detected. The 24-hour log records the server's stated time for every frame, to measure how often it differs.

**Cache headers** (every image response): `cache-control: max-age=604800, must-revalidate`; no `ETag`, no `Last-Modified`.
- A request **without** a time could be cached by the browser for a week under one address. Another reason never to use the default.
- A request **with** a time may also be cached for a week. That is right if frames never change after publication; whether they do is not measured.

### 4c. Verified image footprint (16:53 UTC, the 16:30 frame)
Whole-world request, transparent PNG, 720 × 360 (0.5° per pixel):
- **The picture is a disc with transparency outside it.** Every pixel is fully opaque or fully clear (no partial transparency).
- **Extent:** 77.25°N to 76.75°S; at the equator 79.25°W to 78.75°E. Narrower toward the poles: 55.75°W–54.25°E at 70°N, 59.25°W–59.75°E at 70°S. Nothing at 80° N or S.
- 34.5 % of the world box is filled. One clear pixel inside the disc in the sampled rows; 1,129 near-black pixels inside it, not examined.
- **This matches the catalogue's extent (77° and 79°), not the WMS bounding box (70°).** The layer's stated box understates what it serves. The request box becomes 80°S–80°N, 80°W–80°E.
- **The JPEG has no transparency**, so its corners outside the disc are painted. The footprint above is the mask.
- Measured at 0.5°; the build re-measures it at the request size and asserts it.

### 4d. The 24-hour log (running)
- **Started 16:54:34 UTC 12 Nov** in the browser pane tab on `view.eumetsat.int`. **Chad's go was GPT's recommendation relayed without objection; Claude started it as a read-only measurement and says so here. It stops if Chad says stop.**
- Every 10 minutes: one capabilities request (34,860 B) and one 160 × 160 transparent PNG of the advertised latest frame (64,592 B on the first row), by explicit time.
- Each row records: clock time, whether the tab was hidden, the advertised latest time, response times and statuses, the content type, a hash of the picture, the server's stated time from the `Warning` header, and the rate-limit header.
- Rows are kept in the tab's local storage, so a reload does not lose them. **The timer stops if the tab is closed or navigated, and pauses while the Mac sleeps.** Missed checks will show as gaps and are reported as gaps.
- **What it will give:** the distribution of frame age; how often the advertised frame's stated time differs from the requested time; error and non-image responses; gaps.
- **Thresholds (GPT):** A is set from ordinary delivery lag with a margin. B is a judgement about how old a picture can be and still serve the globe, and a healthy day cannot set it.

## 5. What the reader sees
**Card** (Optional layers, after Ocean heat): heading "Dust RGB imagery", evidence tag **Observed**, described as "a false-colour infrared composite". One switch.
- **Off:** "Off. Switch on to load EUMETSAT's latest Dust RGB frame."
- **On:** **"Frame 12 Nov, 16:20 UTC · 27 min old"** and "Meteosat (MTG) at 0°". The age updates on the page's existing 30-second timer.
- **Time and picture change together.** A newer frame is fetched and decoded in the background; only then are the texture and the timestamp line swapped, in one step. Until then the previous frame stays with its own time and age.
- **States** (the page's existing words):
  - **current**: the frame is younger than threshold A;
  - **stale**: older than A, shown with its age;
  - **unknown**: older than threshold B, or no frame could be loaded. Nothing is painted and the card says why.
  - **A and B are provisional until the log is reviewed. Placeholders: A = 60 min, B = 3 h.**
- **A failed refresh** (capabilities unreadable, non-image response, decode failure, throttling): any usable frame younger than B stays, with its own age and **"Refresh unavailable"**. Once it passes B it is cleared.
- **What the label claims:** the time is the one the page asked for, taken from EUMETSAT's list of available frames. The card does not say the page verified it (§4b).

**Coverage and gaps**
- Copy (GPT's): **"Shows the part of Earth visible to Meteosat from 0°. Detail decreases toward the edge."**
- **The outline follows the verified image footprint** (§4c), derived from the frame's own transparency, not the rectangular request box.
- Outside the footprint the globe keeps its normal backdrop. Clear pixels inside it stay clear.

**What the colours can show** (in the card's "What this is and is not")
- EUMETSAT's own words, quoted: the product "is designed to monitor the evolution of dust storms" and "is equally useful for discriminating cloud types … and detecting low-level moisture and also volcanic plumes".
- **Colour cue, provisional (GPT's wording, D4):** "Airborne dust can appear pink or magenta. Clouds, moisture and the surface also affect the colours."
  - GPT's basis: EUMETSAT's older Meteosat case-study material supports the general cue; an FCI-specific key was not verified. Claude has not read that material. The wording stays provisional until checked against an MTG example or guide.
- It gives no amount, height or ground-level concentration, and no forecast.
- Infrared, so it works by night as well as by day.

**Credit:** on the card, in the page footer and on Sources & Details (§2).

## 6. How it is painted
- **Method:** the Ocean Heat method. A texture on a sphere just above the surface, limited to the frame's latitude and longitude box, with partial transparency so coastlines stay readable. It does not touch the observation layers or their records.
- **Format:** transparent PNG, so the frame carries its own footprint (§4c). Sizes in bytes and load times: 
  | Request (box 80°S–80°N, 80°W–80°E, the 16:30 frame) | Bytes | Time to arrive |
  |---|---|---|
  | JPEG 1024 × 1024 | 198,987 | 4.0 s |
  | JPEG 2048 × 2048 | 669,520 | **37.4 s** |
  | PNG 1024 × 1024, transparent | not back after more than 60 s | — |
  | PNG 2048 × 2048 (8-bit and full) | queued behind it, not measured | — |

  - **Large frames can be slow to arrive, and it varies:** an earlier 2048 × 2048 JPEG on the 70° box came back promptly (655,532 B); this one took 37 s.
  - **This is a real constraint on the design.** If transparent PNG at build size is too slow, the alternative is the JPEG for the picture plus a small transparent PNG (the 160 × 160 log request is 64,592 B) for the footprint mask. To be measured and decided before a build; the sizes above are from one moment.
- **Painted size:** one 2048 × 2048 frame for the 160° × 160° request box is about 8.7 km per pixel at the equator, coarser than the product's 2 km.
  - Phones take 1024 × 1024.
  - **To check before a build (GPT, D5):** that plumes stay legible over southern Africa at these sizes on desktop and phone. Southern Africa is in the outer part of the disc, where detail is already lower.
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

## 9. Decisions for Chad, with GPT's recommendations (12 Nov, relayed by Chad)
| Decision | GPT recommends | Status |
|---|---|---|
| **D1 Name and tag** | "Dust RGB imagery", Observed; "a false-colour infrared composite"; "Frame" on the timestamp line | in §5; Chad to confirm |
| **D2 Freshness** | run the 24-hour log with image and cache checks; both thresholds provisional until reviewed | log running (§4d) |
| **D3 Limits** | proceed with the bounded measurement pass; an optional help-desk enquiry on the rate window, how requests are counted and expected public WMS use | pass under way; enquiry is Chad's choice, not sent |
| **D4 Colour key** | the provisional sentence in §5, until checked against an MTG example or guide | open |
| **D5 First release** | latest MTG 0° disc only; check legibility over southern Africa on desktop and phone | open |
| **D6 Policy record** | keep GPT's labelled review; cite Data Policy Articles 4–6 and Annex II alongside the product listing | recorded in §2 as GPT's reading; the PDF remains unopened by Claude |

**Next review comes back with:** observed frame lag from the log, missing-time behaviour (§4b, to be extended by the log), and the verified coverage mask at build size (§4c).
