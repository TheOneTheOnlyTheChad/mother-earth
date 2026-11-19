# Earth from Space: source check, recommendation, layout, costs and plan

19 Nov 2026 17:20 UTC (clock reading) · **rev 2** (rev 1: 19 Nov 2026, `41a8f2c`; changes after GPT's review are listed in section 12) · for GPT · **read-only investigation and documents only.** Nothing is built, scheduled, deployed or spent. No provider was contacted: every request was an ordinary read of EUMETSAT's public catalogue page, public viewer files and public map service from the browser pane. Evidence: `reviews/evidence/2026-11-19-earth-from-space/source-check.json`.

**Chad's brief** is filed verbatim as `docs/concepts/EARTH-FROM-SPACE-BRIEF.md`. **GPT's review of rev 1 (relayed by Chad, 19 Nov):** direction supported; six required revisions before a private build. Accepted and unchanged here: GeoColour collection 0913; a dedicated page and top-level tab; a 2048 px still first, animation later; EUMETSAT and NASA credit and an explicit static-night-background explanation; five-tab and six-tab tests with real and fallback fonts; no computed day and night line at first. No build, spending, provider contact or production change is authorised.

## 1. Recommendation in short
- **Source:** EUMETSAT "GeoColour RGB - MTG - 0 degree" (`EO:EUM:DAT:0913`), as rendered pictures from the EUMETView map service, layer `mtg_fd:rgb_geocolour`.
- **Picture:** one 2048 × 2048 JPEG per frame, **in the geostationary projection EUMETView's own viewer uses for this satellite** (`EPSG:900003`, section 3), with the surround drawn by the service in the page's background colour.
- **Collection:** the hub, every new frame once. A frame is published only when its served time is confirmed and the delivered picture itself has been decoded and checked (sections 4 and 5).
- **Expected incremental cost:** $0 if the account stays inside its shared allowances; the realistic exposure is processor time, at cents a month (section 8). Not certain until the account's present usage is read.

## 2. What was verified
Browser pane, 19 Nov 2026, 16:42 to 17:02 and 17:13 to 17:18 UTC. Full request lines, sizes, hashes and the response headers that matter are in the evidence file.

| Question | Finding |
|---|---|
| Layer and catalogue match | the catalogue entry's "Explore in EUMETView" link goes to `…/productDetails/mtg_fd:rgb_geocolour`; its Access tab lists EUMETView only. The layer's own metadata carries no licence or catalogue link, so the match rests on the catalogue's link (as recorded for Dust RGB) |
| Licence | "Free and unrestricted - CC-BY-4.0" (catalogue, "Data policy") |
| Credit | "When GeoColour imagery and animation are used outside of EUMETView, both EUMETSAT and NASA should be given credit." |
| What the picture is | by day, True Colour RGB from the visible channels; by night, infrared cloud information, partly transparent, over the NASA Black Marble, which "is a static layer, and it doesn't reflect the actual conditions of the city lights" |
| Instrument, level | MTG, FCI (Imager); "Visualisation"; operational; 1 km |
| Coverage | the layer's box is 81.3°W to 81.3°E, 77.4°S to 77.4°N. All of Africa is inside it |
| Cadence | every 10 minutes (time dimension `…/PT10M`) |
| When a frame is listed | 16:30 first seen at 16:50:07; 16:40 not listed at 17:01:24; 16:50 newest at 17:13:32. **The capabilities document comes through a cache** (`max-age=120`; one read carried `age: 177`), so a sighting can lag the service by minutes. These are observations, not a delay bound |
| Served time | every picture response carried `Warning: 99 Nearest value used: time=<served time>`, also when the requested time existed |
| Off-grid time | silently substituted (11:03 returned 11:00, HTTP 200, header said 11:00) |
| Future time | HTTP 200 with an XML error document |
| The delivered JPEG | **progressive** (frame marker FFC2), 8-bit, 3 components, 4:2:0, no restart markers, starts and ends with the correct markers |
| Rate control | headers on every response: limit 20 per context, 8 concurrent, "Delay excess requests 1000ms". Our own requests were delayed by up to 5.4 s when sent one after another |
| Authentication | none |
| Usage policy | none found |

**Sizes and service times** (19 Nov frames):

| Request | Bytes | Time |
|---|---|---|
| 2048 px JPEG, geostationary, page-coloured surround, 16:50 | 664,557 | 16.1 s |
| 256 px PNG, transparent surround, geostationary, 16:50 (the check image) | 131,868 | 5.6 s |
| 2048 px JPEG, orthographic: 11:00 day / 16:20 dusk / 00:00 night | 660,271 / 662,368 / 563,095 | 9.1 / 9.8 / 17.0 s |
| 1024 px JPEG, orthographic, 11:00 | 188,572 | 8.7 s |
| 4096 px JPEG, orthographic, 11:00 | 2,278,433 | 65.3 s |
| 1024 px PNG, transparent, orthographic | 1,830,785 to 1,840,439 | 38.9 to 53.1 s |

## 3. Projection (GPT 3)
**What was investigated:**
- The service's capabilities list, for the root layer: EPSG:4326, 3857, 3995, 3976, CRS:84 and seven service-specific codes, EPSG:70201 to 70213. Three of those seven were probed at 256 px; none returned a centred disk. **Their definitions were not found and are not used.**
- **EUMETView's own product viewer** loads its projections from `https://view.eumetsat.int/assets/data/config.json` (8,754 bytes, sha256 `e4f8369e…3a8a`, read 17:16:59 UTC). It defines **`EPSG:900003`, named "GEOS: MSG FES, MTG FD"**, as `+proj=geos +h=35785831.0 +lon_0=0`, extent ±5,440,000 m. This is the geostationary projection EUMETSAT's viewer offers for this satellite's full disk.
- A GetMap request in `EPSG:900003` over that extent returned a picture with the disk filling the frame (non-transparent share 0.78; a full circle would be 0.785).
- `AUTO:42003` (orthographic), which rev 1 proposed, also works but is listed nowhere. **It is dropped.**

**Proposed, pinned request for the delivered picture** (every parameter is a constant in the code and is written into each frame's record):
```
service=WMS  request=GetMap  version=1.3.0  layers=mtg_fd:rgb_geocolour  styles=
crs=EPSG:900003  bbox=<to be fixed in stage 1, see below>  width=2048  height=2048
format=image/jpeg  bgcolor=0x0B1016  time=<the advertised frame time>
```
- **No clipping.** The service paints the surround in the page's background colour (`bgcolor`; measured corner colour 11,15,24 against 11,16,22 asked, through JPEG compression). Rev 1's circular clip is withdrawn: on the orthographic picture the data's edge lay between 0.976 and 0.989 of the half-width depending on direction, so any circle would have cut valid imagery or shown surround.
- **The box is not final.** At ±5,440,000 m the data's edge reached 0.99 to 1.002 of the half-width, so the disk touches the frame and may lose a pixel at the west edge. Stage 1 fixes a slightly wider box and records, from the transparent check image, that the data's edge is inside the frame on every side.
- **No silent switch.** If this request fails, the hub keeps the last good picture or the page says none is available. A different projection is never substituted; changing the request is a code change and a review.
- **What the page may say:** "shown in the geostationary projection EUMETSAT's viewer uses for Meteosat at 0°". **Not** "exactly as the satellite sees it": the definition's height and longitude are nominal, and its match to the instrument's real viewing geometry was not verified.
- **Not verified:** that a projection defined in the viewer's file, and absent from the capabilities list, will stay available; where EUMETSAT documents it.

## 4. Frame time (GPT 1)
- **One rule, no exception:** a frame is published only if the response's `Warning` header names a served time **equal to** the time requested, on the delivered JPEG and on the check image.
- **A different served time: rejected.** Nothing is published; the run is recorded as "served a different frame".
- **No header: not published either.** The pointer to the current verified frame does not move, and no requested time is ever shown as an observation time. The run is recorded as "served time not confirmed", and the page keeps showing the last verified frame with its own time.
- **No alternative verification is proposed.** Nothing else in the response states which frame was drawn, and comparing pictures cannot prove it (two renderings of one frame differ; two frames ten minutes apart can look alike). If stage 1 or production shows that a Worker does not reliably receive the header for this layer (the Dust record has it absent in one outside probe and present in production), **the feature returns to review before any build**; the rule is not weakened. Rev 1's "Frame requested" label is withdrawn for this feature.
- **Wording:** the page says **"Source frame time"**, with the explanation that the instrument scans the disk in about ten minutes, south to north, so different parts were observed at different moments. It states no scan start or end. What EUMETSAT's time marks (start, end or a nominal slot) is not established; if stage 1 finds EUMETSAT's own statement, the wording is revised and reviewed.

## 5. Validating the picture that is displayed (GPT 2)
Rev 1 checked a small PNG and the JPEG's header. That does not show the JPEG decodes or is not blank. Proposed instead:

1. **Decode the delivered JPEG itself, in full, in the hub**, before it is stored. A Worker has no built-in image decoder, so this needs a JavaScript JPEG decoder carried inside `worker.js`. It must handle **progressive** JPEG (what the service sends) and must fail on a truncated or damaged file instead of filling the gap. Candidate: `jpeg-js` (to confirm: licence, progressive support, behaviour on damaged input). The exact library and version are named in the build packet.
2. **Checks on the decoded pixels:** 2048 × 2048; the four corners match the background colour asked for, within a tolerance for compression; inside the disk the picture is not blank or flat (spread of brightness and number of distinct colours above floors).
3. **The small transparent PNG stays as a second, separate check:** it is decoded in full (PNG carries checksums); its transparent area gives the disk's shape for **this** run. The JPEG's surround must fall where the PNG is transparent, and coarse block averages of the two must agree. Thresholds are relative to the same run's check image; **no fixed disk fraction is hard-coded.**
4. **Thresholds come from fixtures,** not from one measurement: day, night, dusk and a deliberately damaged set (truncated, blank, wrong size, an XML answer, a different frame). Each threshold is stated with the sample it came from.

**Limits, stated:**
- It shows the file decodes with that decoder, has the expected shape and is not blank. It does not show the picture is meteorologically right, or that a browser will decode it identically.
- Agreement with the PNG is coarse by nature: in the pane, the JPEG drawn down to 256 px differed from the 256 px PNG by 17.9 levels a channel on average.
- **Processor time and memory for a 2048 px progressive decode in a Worker are not measured.** If they do not fit, the options are a smaller delivered picture or a different delivered format the hub can verify, and the choice returns to review. The page also decodes before showing and says so if it cannot; that is display handling, not validation.

## 6. Keeping the last good picture (GPT 4)
- **No age-based lifecycle rule on this feature's pictures.** Rev 1's rule could have deleted the current picture during a long outage.
- The hub keeps a small list of the pictures it holds, with the time each stopped being current or previous.
- **A picture is deleted only when all three hold:** it is neither current nor previous; it left that role at least 24 hours ago (the grace period, Chad's to set, D3); and the deletion happens in a run that has just published a newer verified frame. So during an outage nothing is deleted, however long it lasts.
- **A reader who declined a newer frame** already holds the picture's bytes in the page, and its address never changes and is cached as immutable; the grace period covers a reload or a slow connection.
- Steady state at 10 minutes and 24 hours: about 146 pictures, about 95 MB. Deleting objects is free of charge.

## 7. What the page says, and on what evidence (GPT 5)
Three facts are kept apart in the hub's record and on the page:

| Fact | Values |
|---|---|
| **Source check** (the last attempt to read which frames exist) | succeeded at HH:MM, newest listed frame HH:MM · **failed** at HH:MM |
| **Collection** of the newest listed frame | collected and verified · failed (served a different frame / served time not confirmed / not a picture / failed validation / no answer) · not attempted |
| **Displayed frame** | its source frame time and its age, counting up |

**Wording, each line tied to the evidence it needs:**

| Shown | Only when |
|---|---|
| "Current: the newest frame the source lists" | the last source check succeeded and the displayed frame is that newest frame |
| "Waiting for the next frame" | the last source check succeeded, lists nothing newer, and the newest frame is younger than the provisional limit |
| "The source has listed nothing newer since HH:MM" | the last source check **succeeded** and the newest listed frame is older than that limit |
| "We could not check the source at HH:MM. Whether a newer frame exists is unknown." | the last source check failed. **Never worded as a source delay** |
| "A newer frame (HH:MM) is listed, but our collection failed. Showing HH:MM." | source check succeeded, collection of the newer frame failed |
| "No verified picture is available" | nothing verified is held |

- **Everything on the page describes the displayed picture:** its source frame time, its age, its credits. When a newer verified frame exists and the reader has not chosen it, one separate line says so ("A newer frame, HH:MM UTC, is available. Show it."), and nothing else changes until they do.
- A successful source check still reads a cached document; the record keeps the check time and the cache age.
- **Limits are provisional.** The stage 1 log is preliminary evidence about typical delay, not a guaranteed bound; the page's wording says what was listed and when, and never promises when the next frame will come.

## 8. Costs (GPT 6)
**Official prices, read 19 Nov 2026 from Cloudflare's pricing pages:** Workers Paid has a minimum charge of $5 a month; 10 million requests a month included, then $0.30 a million; 30 million CPU milliseconds a month included, then $0.02 a million; no charge for duration. R2 Standard: $0.015 a GB-month, Class A $4.50 a million, Class B $0.36 a million; free each month: 10 GB-month, 1 million Class A, 10 million Class B; DeleteObject is free; ListObjects and PutObject are Class A, GetObject and HeadObject are Class B; no egress charge. **These allowances are shared by everything on the account; the account's present usage was not read.**

**Per new frame (still, 2048 px, every 10 minutes: up to 144 a day, about 4,320 a month):**

| Item | Per frame | Per month | Against |
|---|---|---|---|
| Hub invocations | none added: the existing five-minute trigger is reused | 0 | 10 M requests |
| Reads from EUMETSAT | 1 capabilities (5.9 KB compressed), 1 JPEG (about 0.66 MB), 1 check PNG (about 0.13 MB, measured) | about 3.4 GB downloaded | EUMETSAT's service; whether outbound reads are billed by Cloudflare was not read |
| Stored objects written (Class A) | picture 1, pointer 1, held-list 1 | about 13,000 | 1 M |
| Stored objects read by the hub (Class B) | pointer 1, held-list 1 per run | about 8,600 | 10 M |
| Deletes | 1 | about 4,300 | free |
| Storage | | about 95 MB steady (24 h grace) | 10 GB |
| **Processor time** | **not measured**: hashing 0.8 MB, decoding one PNG and one 2048 px progressive JPEG | at 2 s a frame: 8.6 M CPU-ms (29% of the allowance); at 5 s: 21.6 M (72%) | 30 M CPU-ms, shared |

**Per reader, while the page is open and visible:**

| Item | Rate | Note |
|---|---|---|
| Status read (pointer and state) | one a minute | one request each; the hub can answer from a short in-memory copy so most do not read storage |
| Picture | one per frame shown, about 0.66 MB | one request and one Class B read, unless served from Cloudflare's cache |
| Example: 1,000 reader-hours a month | about 66,000 requests | 0.7% of the request allowance |

- **Expected incremental cost: $0, on the condition that the account's combined use stays within the shared allowances.** The one item that could plausibly leave them is processor time: 10 million CPU-ms over the allowance costs $0.20. Nothing here needs a new service or plan.
- **To read before a build (stage 1, read-only):** the account's present requests, CPU milliseconds, Class A and B operations and stored GB for the month.
- **Later loop:** a 1024 px copy per frame adds one EUMETSAT read, one Class A write and about 0.19 MB per frame (about 27 MB for 24 hours), and its own decode cost.
- **Paid alternative, not recommended:** drawing our own pictures from Level 1c data on a rented server (native 1 km, our own tiles for deep zoom); a monthly server charge not priced here, a far larger build, and EUMETSAT's one-hour licensing of Level 1 image data to resolve.

## 9. Page layout
`space.html` and `space.js` (two new page files).
1. Title: Earth from Space.
2. Viewpoint: "Africa, the Atlantic and Europe, as Meteosat at 0° longitude views them."
3. The picture: the disk on the page's own background, never stretched; alternative text gives product, source frame time and state.
4. Information strip, always visible: satellite and instrument; product and a plain colour description ("By day, close to natural colour. By night, cloud seen in infrared over a fixed NASA map. **The city lights are not tonight's.**"); **source frame time** in UTC and its age; the state lines of section 7.
5. Controls: zoom in, zoom out, reset; drag when zoomed; keyboard operable; zoom stops at one picture pixel per screen pixel; link to the original at EUMETSAT.
6. "How this image is made" (closed by default): scanning, band combination by day and by night, **not an instantaneous photograph**, what is and is not known about the frame time, the static night background, and what Mother Earth changed (asked the service for this projection, size and surround colour; nothing else).
7. Credits: "Contains modified EUMETSAT Meteosat data 2026 · GeoColour RGB - MTG - 0 degree · CC BY 4.0" with links; "Night-time background: NASA Black Marble"; a Sources link. EUMETSAT and NASA do not endorse Mother Earth.

Narrow screens: picture first at full width, strip beneath, controls in reach, disclosure and credits below.

## 10. Navigation
- Four tabs on main today; the parked Animals branch adds one; this adds one. The header must work with **five and with six**.
- Full label "Earth from Space" where it fits; a shorter label at compact widths; at phone width the tab row scrolls sideways with the current tab in view. Breakpoints come from measurement on the branch.
- The tab and Menu entry go on every page.
- The header suites take the tab list as a parameter and run with five and with six tabs, **with the real fonts and with the fallback fonts** (GPT).
- Animals and this branch both edit the tab row and the header suites: whichever merges second merges main first and reruns them.

## 11. Plan
Stages 1 to 3 need Chad's go. **Every action on production needs his own Approve line: a hub deploy, a production probe route or its use, any write to production storage, a variable, a schedule, a merge. A private page does not make any of those non-production.**

| Stage | What | Touches production? |
|---|---|---|
| 0 | This document, GPT's review, Chad's decisions | no |
| 1 | Read-only, from the browser pane only: a log of when frames are listed (D2 sets how long and when), kept as observations in `reviews/evidence/`; the final request box and its edge measurement; sample pictures across day, night and dusk captured as fixtures; EUMETSAT's documentation of the frame time, if any; the account's usage figures read from the dashboard | no |
| 2 | Branch from current main. Hub collector with its suite and breaks (different served time, no header, XML answer, truncated file, damaged scan, wrong size, blank disk, mismatched surround, older over newer, failure after a good frame, deletion during an outage). Decoder choice with measured processor time and memory on the fixtures. `space.html`, `space.js`, the tab on every page, page suite (every state in section 7, a declined newer frame, zoom, keyboard, narrow widths, five and six tabs, both font sets, reduced motion). Sources section and REGISTER draft | no |
| 3 | **Private preview on local fixtures only:** the real `worker.js` behind a local port with EUMETSAT stubbed by the stage 1 fixtures (the fixture-hub pattern already in the repo), and the branch page pointed at it. No production storage, route or probe | **no** |
| 4 | Release, each step on its own Approve line: hub deploy with the gate unset → gate on → first verified frames read back (this is also the first real test of which headers a Worker receives) → REGISTER → page merge → served-hash check → GPT smoke | yes, each step |
| 5 | The loop, as its own proposal after the still has run for some days | later |

**Rollback:** remove the gate variable (collection stops; held pictures stay); revert the page merge.

**Decisions for Chad**

| | Decision | Claude's recommendation |
|---|---|---|
| D1 | Tab label and order | "Earth from Space", second, after Earth now |
| D2 | How the stage 1 log is collected: it needs the browser pane, so the Mac must be on. One 24-hour run, or several shorter runs at different times of day | three runs of about three hours (morning, afternoon, night), since the Mac is not left on |
| D3 | Grace period before an old picture may be deleted | 24 hours |
| D4 | Cadence | every frame (10 minutes); 30 minutes if a lighter footprint on EUMETSAT's free service is preferred |

## 12. Changes in rev 2 (GPT's six points)
1. **Timestamp:** one rule. A different served time is rejected; without the header nothing is published and the pointer does not move; no alternative verification; "Source frame time"; no scan start or end stated (section 4).
2. **Validation:** the delivered JPEG is decoded in full and checked; the PNG is an additional check; thresholds are relative to the same run and set from fixtures; limits stated; decode cost unmeasured (section 5).
3. **Projection:** the viewer's own geostationary definition `EPSG:900003` replaces the unlisted orthographic request; full request recorded; evidence file added; no clipping; no silent switch; no "exact perspective" claim (section 3).
4. **Last good picture:** no age-based lifecycle rule; deletion only after a newer verified frame, with a grace period (section 6).
5. **Status:** source check, collection outcome and displayed frame kept apart; "delayed at the source" wording needs a successful check; everything describes the displayed picture (section 7).
6. **Costs and stages:** official prices; processor time, reader polling, shared allowances and the measured check-image size included; $0 qualified; stage 3 is local fixtures only; production probes and storage writes moved to stage 4 behind Approve lines (sections 8 and 11). The log is described as preliminary evidence.

## 13. Not verified
- What the source frame time marks; whether scan start and end exist for this product.
- That `EPSG:900003` stays available; its match to the instrument's real geometry; the meaning of codes 70201 to 70213.
- Whether a Worker reliably receives the `Warning` header for this layer.
- Processor time and memory to decode the picture in a Worker; the decoder's behaviour on damaged files.
- Listing delay and gaps over a day; sizes over a day; behaviour in an EUMETSAT outage.
- Any usage policy for automated reads; whether Cloudflare bills outbound reads.
- EUMETSAT's Data Policy document itself; any condition on the Black Marble background beyond credit.
- The account's present usage against the shared allowances.
- A real phone and a screen reader.
