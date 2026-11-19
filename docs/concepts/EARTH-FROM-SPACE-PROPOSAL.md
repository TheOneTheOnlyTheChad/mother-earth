# Earth from Space: source check, recommendation, layout, costs and plan

19 Nov 2026 17:03 UTC (clock reading) · rev 1 · for GPT review · **read-only investigation and documents only.** Nothing is built, scheduled, deployed or spent. No provider was contacted: every request below was an ordinary read of EUMETSAT's public catalogue page and public map service from the browser pane.

**Chad's brief (19 Nov, filed verbatim as `docs/concepts/EARTH-FROM-SPACE-BRIEF.md`):** a dedicated top-level tab, "Earth from Space", opening its own page; first release one Africa-centred Meteosat full-disk still image; EUMETSAT GeoColour investigated first; hub-first collection and caching; still image first, a short loop assessed as the next step. **His line:** proceed with the read-only source investigation and return the source recommendation, layout, estimated costs and implementation plan for GPT review. No spending, provider contact, device changes or production actions authorised.

## 1. Recommendation in short
- **Source: EUMETSAT "GeoColour RGB - MTG - 0 degree"** (`EO:EUM:DAT:0913`), taken as rendered pictures from the EUMETView map service, layer `mtg_fd:rgb_geocolour`. It is the same service, host and collection pattern the Dust RGB layer already uses in production, so the access route, the licence family and the failure behaviour are known.
- **Picture: one 2048 × 2048 JPEG per 10-minute frame, drawn by the service as a disk** (orthographic view centred on 0°N 0°E), about 0.56 to 0.67 MB.
- **Collection: the hub**, every new frame once, validated, kept under an address that names the frame; visitors only ever load our copy. Newest frame about 20 to 30 minutes old when it becomes available.
- **Expected new cost: $0.** No paid service is recommended.
- **Three things to settle before a build** (section 9): what the frame time means; whether the disk view the service drew for us today can be relied on; and tab naming and order with Animals.

## 2. What was verified (browser pane, 19 Nov 2026, 16:42 to 17:02 UTC)

| Question | Finding | How |
|---|---|---|
| Layer exists | `mtg_fd:rgb_geocolour`, title "Geo Colour RGB - MTG-I - 0 degree" | WMS GetCapabilities, namespace `mtg_fd` (34,860 bytes, 13 layers) |
| Layer and catalogue match | the catalogue entry's "Explore in EUMETView" link goes to `…/productDetails/mtg_fd:rgb_geocolour`; its Access tab lists EUMETView only | catalogue page, read without signing in |
| Licence | **"Free and unrestricted - CC-BY-4.0"** (catalogue, "Data policy") | same page |
| Credit required | "When GeoColour imagery and animation are used outside of EUMETView, both EUMETSAT and NASA should be given credit." | same page, Description |
| What the picture is | **Daytime:** True Colour RGB from the red, green and blue visible channels, Rayleigh scattering removed, the green band adjusted for vegetation. **Night-time:** infrared (10.5 µm) and the 10.5 − 3.8 µm difference pick out ice and liquid-water clouds, shown whitish and bluish, partly transparent, over the NASA Black Marble. "the Black Marble is a static layer, and it doesn't reflect the actual conditions of the city lights." | same page |
| Satellite, instrument | MTG; FCI (Imager); processing level "Visualisation"; operational; 24 Sep 2024 to now | same page |
| Coverage | −77° to 77° latitude and longitude (catalogue); the layer's box is 81.3°W to 81.3°E, 77.4°S to 77.4°N. **All of Africa is inside it**, with the Atlantic, Europe, the Middle East and part of South America | catalogue; capabilities |
| Native resolution | 1 km (catalogue, "Spatial resolution"). The full disk is 10 minutes of scanning, in 40 chunks from south to north (EUMETSAT training material) | catalogue; search |
| Cadence | every 10 minutes: time dimension `2024-09-23T00:00:00Z/…/PT10M` | capabilities |
| Publication delay | the 16:20 frame was the newest at 16:42:15; the 16:30 frame appeared between 16:49:37 and 16:50:07 (**about 20 minutes** after its time); the 16:40 frame had not appeared by 17:01:24 (**more than 21 minutes**). The Dust RGB record (12 to 13 Nov, overnight) has 18 to 30 minutes for the same service. **Two frames is not a measurement**; section 8 puts a 24-hour log first | capabilities polled every 30 s |
| Explicit frame time | honoured. Every picture response carried `Warning: 99 Nearest value used: time=<served time>`, **also when the requested time existed**, so the header names the frame actually served | 9 GetMap requests |
| A time off the 10-minute grid | **silently substituted**: 11:03 returned the 11:00 frame, HTTP 200, and the header said 11:00 | one request |
| A time in the future | **HTTP 200 with an XML error document**, not a picture | one request |
| Projections on offer | advertised: EPSG:4326, EPSG:3857, EPSG:3995, EPSG:3976, CRS:84 and seven service-specific codes (EPSG:70201 to 70213). **A disk view was returned for `AUTO:42003` (orthographic, centred 0°N 0°E), which is not in the advertised list.** Three of the service-specific codes were probed and are not a centred disk; their definitions were not read | capabilities; 4 requests |
| Outside the disk | white in JPEG; transparent in PNG with `transparent=true` | measured |
| Authentication | none for the catalogue page or the map service | observed |
| Usage limits | none published that we have found. The Dust record notes service headers "a rate limit of 20 (window not stated) and 8 concurrent" | REGISTER, 13 Nov |

**Measured frame sizes and service times (orthographic disk unless stated; 19 Nov frames):**

| Request | Bytes | Service time |
|---|---|---|
| 2048 px JPEG, 11:00 UTC (day over Africa) | 660,271 | 9.1 s |
| 2048 px JPEG, 16:20 UTC (dusk) | 662,368 | 9.8 s |
| 2048 px JPEG, 00:00 UTC (night) | 563,095 | 17.0 s |
| 2048 px JPEG, 16:20, latitude-longitude grid | 667,379 | 5.4 s |
| 1024 px JPEG, 11:00 | 188,572 | 8.7 s |
| **4096 px JPEG, 11:00** | 2,278,433 | **65.3 s** |
| 1024 px PNG, 11:00, transparent outside the disk | 1,840,439 | 38.9 s |

The disk fills the frame: the non-white share of the orthographic picture was 0.766, against 0.76 for a circle touching the content's own edges.

## 3. Delivered picture against the native data
- Native: 1 km at the point under the satellite, so the disk is roughly 11,000 pixels across. Delivered at 2048 px the disk is about 6 km a pixel at its centre: about one fifth of the native detail.
- 4096 px (about 3 km a pixel) took 65 seconds to draw and is 2.3 MB. **Not recommended** for routine collection: it is slow enough to fail under load and four times the bytes for every visitor.
- **Zoom in the first release is therefore zoom into the 2048 picture** (to one picture pixel per screen pixel, and no further without saying the picture is being enlarged). Deeper zoom would need tiles fetched on demand, which breaks "fetch each frame once" and is left out.
- **The disk view is the service's orthographic redraw, not the satellite's exact perspective.** From geostationary height the visible edge is about 81° from the centre; an orthographic view puts 90° at the rim, so the picture has a thin empty ring and slightly different proportions near the edge. The page would say "drawn as a disk centred on 0°N 0°E", never "as the satellite sees it", unless D2 chooses the exact view.

## 4. What the hub would do (reusing the Dust RGB pattern)
1. Every 10 minutes (the existing five-minute trigger; no new trigger), read the capabilities document and take this layer's newest advertised time. If it is the frame already held, stop: **source not updated yet**, which is normal.
2. Request that exact time: the 2048 px JPEG, and a small transparent PNG of the same view (about 256 px; size to be measured) used only for checking.
3. **Validate before publishing:** content type is an image (an XML answer is a failure); the JPEG's own header gives 2048 × 2048 and the file is complete; size within bounds; the `Warning` header's time equals the time asked for; the small PNG decodes in the Worker (a Worker can decode PNG, not JPEG), its opaque share matches the expected disk (about 0.77), and the disk is not blank or one flat colour.
4. Write the picture under a key that names product, size and frame time and never changes; then move the pointer with a conditional write. A newer pointer is never replaced by an older frame.
5. On any failure: keep the last valid frame and its true time; record whether **the source had nothing newer** or **our collection failed**.
6. **Times kept apart:** frame time (EUMETSAT's), advertised-by time (when we first saw it listed), retrieved time (ours).
7. **Frame-time label rule** (as accepted for Dust): "Frame" only when the header named the requested time; otherwise "Frame requested". In the browser the header was present on every response today; in a Worker it was absent in one probe and present in production (Dust record), so both cases must be handled.
8. Retention: the current and previous frames for a still; the last 24 hours once a loop exists; older frames removed by a storage lifecycle rule (the bucket already has such rules for other prefixes).
9. Gate: a plain variable (absent = no request at all). Outside layers, cells, history and health, as Dust is.

**The page never contacts EUMETSAT.** Nothing on Earth now loads or processes this imagery; the globe's layer choices are untouched because this is a separate page.

## 5. Page layout
`space.html` with `space.js` (two new page files; the served-hash check grows by two).

1. **Title:** Earth from Space.
2. **Viewpoint line:** "Africa, the Atlantic and Europe, from Meteosat's position 36,000 km above the equator at 0° longitude."
3. **The picture:** the disk on the page's dark background, clipped to a circle just inside the data's edge so the white surround is not shown; never stretched; alternative text gives product, frame time and state.
4. **Information strip, always visible beside or under the picture:**
   - Satellite and instrument: Meteosat Third Generation, Flexible Combined Imager (FCI).
   - Product: GeoColour RGB. "By day, close to natural colour. By night, cloud seen in infrared over a fixed NASA map of city lights. **The city lights are not tonight's.**"
   - Frame time in UTC and its age, counting up.
   - State: one of **Current** · **Waiting for the next frame** (the source has published nothing newer; normal up to a stated limit) · **Delayed at the source** (past that limit) · **Our last collection failed: showing the frame from HH:MM UTC** · **No picture available**.
   - A new frame is offered, not swapped in under the reader: "A newer frame (HH:MM UTC) is available. Show it."
5. **Controls:** zoom in, zoom out, reset; drag to move when zoomed; keyboard operable; "Open the original at EUMETSAT" (the catalogue entry and EUMETView's viewer).
6. **"How this image is made"** (closed by default): the instrument scans the disk from south to north in about ten minutes and measures 16 bands; EUMETSAT combines visible bands by day and infrared by night into one processed picture; it is **not an instantaneous photograph**; what the frame time marks; the night side's static background; what Mother Earth changed (asked the service for a disk view, clipped the surround, resized for the screen).
7. **Credits:** "Contains modified EUMETSAT Meteosat data 2026 · GeoColour RGB - MTG - 0 degree · CC BY 4.0", links to the catalogue entry and the licence; "Night-time background: NASA Black Marble"; the method's origin (CIRA and NOAA's RAMMB, per the catalogue); a link to our Sources page. EUMETSAT and NASA do not endorse Mother Earth.

**Narrow screens:** picture first at full width, strip under it, controls reachable by thumb, disclosure and credits below. A 1024 px copy for phones is a later saving, not in the first release (section 6).

## 6. Navigation
- Today main has four tabs (Earth now · Timeline · Moon · Sun). The parked Animals branch adds a fifth. This adds one more, so the header must work with **five now and six later**.
- "Earth from Space" is the longest label. Proposed: full label where it fits; "From space" at the compact widths; at phone width the tab row scrolls sideways with the current tab brought into view, instead of shrinking six labels. The exact breakpoints come from measurement on the branch, both font sets, as `desktop-overflow` does now.
- The tab and the Menu entry go on every page (World View, Timeline, Moon, Sun, Sources).
- **Branch dependency, stated now:** Animals and this branch both edit the tab row and both change the header suites' expectations. Whichever merges second must merge main first and rerun the header suites. The new suite takes the tab list as a parameter and is run with and without the Animals tab, so the six-tab header is tested before Animals is released.
- Tab order is Chad's (D5).

## 7. Costs
Prices as read on 19 Nov from Cloudflare's billing page and secondary summaries; to confirm on Cloudflare's pricing pages before a build. The account's present usage was not read.

| | Still only (every frame, 2048 px) | With a loop (adds a 1024 px copy per frame, 24 h kept) |
|---|---|---|
| Requests to EUMETSAT a day | 144 capability reads (35 KB each), up to 144 pictures, up to 144 small check images | up to 144 more pictures |
| Downloaded from EUMETSAT a day | about 95 MB | about 125 MB |
| Hub storage, steady | about 1.3 MB (two frames) | about 120 MB (24 h of both sizes) |
| Storage writes a month | about 13,000 | about 17,000 |
| Each page view | one pointer read and one picture, about 0.6 MB | a three-hour loop is 18 frames: about 3.4 MB and roughly 75 MB of decoded pictures in the browser at 1024 px |
| Allowances | Workers Paid includes 10 million requests a month; storage has 10 GB, 1 million writes and 10 million reads a month free; no charge for data sent out | same |
| **Expected new monthly cost** | **$0** | **$0** |

- **If old frames were never removed** the store would grow about 2.8 GB a month and pass the free 10 GB in about three months, at $0.015 a GB-month after that. Hence the lifecycle rule in section 4.
- A loop at 2048 px is not proposed: 18 frames are about 12 MB to download and roughly 300 MB decoded, too much for a phone.
- **Load on EUMETSAT's free service:** about 290 to 430 small requests a day from one address. No usage policy was found; if GPT or Chad prefers a lighter footprint, collecting every 30 minutes cuts it by two thirds and still shows a picture 20 to 50 minutes old.
- **One paid alternative, not recommended:** collect the instrument's Level 1c data from EUMETSAT's Data Store and draw our own pictures on a small rented server. Advantage: native 1 km detail, the satellite's exact perspective, our own tiles for deep zoom. Cost: a server every month (not priced), a much larger build, and a licence question, because EUMETSAT's licensing guide lists one-hour licences for Meteosat Level 1 image data (REGISTER, Dust entry). It buys zoom, which the first release does not need.

## 8. Implementation plan
Each stage ends with a packet for GPT. Stages 1 to 3 need Chad's go; every production step needs his own Approve line.

| Stage | What | Production? |
|---|---|---|
| 0 | This document, GPT review, Chad's decisions D1 to D7 | no |
| 1 | **Read-only measurement:** a 24-hour log of when each frame is advertised (delay and gaps), sizes across a day, one Worker-side read through the existing admin probe pattern to see which headers reach a Worker, the size of the small check image, EUMETSAT's documentation on what the frame time marks. Thresholds for "waiting" and "delayed" come from this log | the Worker probe needs a hub that has the probe route, so it follows stage 2's hub review or is done from the pane only (D7) |
| 2 | Branch from current main: hub collector and routes with a suite and breaks (substituted time, XML answer, truncated file, wrong size, blank disk, missing header, older-over-newer, failure after a good frame); `space.html`, `space.js`, the tab on every page; page suite (states, times, zoom, keyboard, narrow widths, five and six tabs, reduced motion); Sources section; REGISTER draft | no |
| 3 | Private preview: the branch page against a hub copy of real frames, as earlier live candidate checks were done | no |
| 4 | Release, each on its own Approve line: hub deploy (gate unset) → lifecycle rule → gate on → first frames read back → REGISTER → page merge → served-hash check → GPT smoke | yes, each step |
| 5 | The loop, as its own proposal after the still has run for some days: play, pause, scrubber, the shown frame's time, gaps disclosed, no invented frames, no autoplay, reduced motion respected, bounded frames and memory | later |

**Rollback:** remove the gate variable (collection stops; the page says no picture is available); revert the page merge. Stored frames expire by the lifecycle rule.

## 9. Decisions for Chad
| | Decision | Claude's recommendation |
|---|---|---|
| D1 | Source and product | GeoColour from EUMETView, as above |
| D2 | The disk view: the service's orthographic redraw (works today, not in its advertised list); or the latitude-longitude picture redrawn by our own page into the satellite's exact perspective (advertised projection, more code, a reprojection of ours to disclose) | start with the service's disk; build the fallback only if stage 1 shows the disk request is unreliable |
| D3 | Cadence | every frame (10 minutes) |
| D4 | Size | 2048 px only for the first release |
| D5 | Tab label and order | "Earth from Space", placed second, after Earth now |
| D6 | A computed day and night line on the picture, to mark where the static night background begins | not in the first release; the text explains it. A computed line would be labelled as computed |
| D7 | Whether stage 1's Worker-side header check waits for the hub branch | yes; the pane log does not need it |

## 10. Not verified
- **What the frame time marks** (start of the 10-minute scan, its end, or a nominal slot) and whether scan start and end are available anywhere for this product. The map service supplies one time only.
- That the orthographic disk request will keep working: it is not in the advertised projection list.
- Publication delay and gaps over a full day; frame sizes over a full day; behaviour during an EUMETSAT outage.
- Which headers reach a Worker for this layer.
- Any usage policy for automated reads of the map service.
- EUMETSAT's Data Policy document itself (not read by Claude; the catalogue's licence statement is what this rests on). Whether NASA's Black Marble inside the composite carries any condition beyond credit.
- The meaning of the seven service-specific projection codes.
- Cloudflare's prices on its own pages; the account's present usage.
- A real phone and a screen reader.

## 11. Later viewpoints
GOES, Himawari and DSCOVR/EPIC are not investigated here. Each has its own position, products, schedule and terms, and would be labelled as a different viewpoint on the same page.

**Evidence:** values in section 2 are from the browser pane on 19 Nov 2026 between 16:42 and 17:02 UTC (pane clock), 14 GetMap requests, 3 projection probes at 256 px and about 35 capability reads in all. No picture was saved; sizes and statistics were computed in the pane.
