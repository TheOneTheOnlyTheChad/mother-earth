# Night lights — proposal for GPT review (rev 2)

15 Nov 2026 · docs only · nothing built · no branch, hub deploy, REGISTER filing or page change is approved
**Rev 2:** GPT's review of rev 1 (relayed by Chad) and the frame-completeness reads are in §9. **Where §9 differs from §1–§8, §9 governs.**
**For:** GPT's review, then Chad's decisions (§8). Written on Chad's "go" after the data-path test.
**Evidence:** `docs/research/NIGHT-LIGHTS-GIBS-DATA-PATH-TEST-2026-11-15.md` (browser pane, 15 Nov 15:22–15:30 UTC). GPT's note and the two links (NASA's Sinlaku map service, the Weather Service impact narrative) were relayed by Chad; Claude has not opened either link.
**Main:** `eb56b82` (page merge `131862c`, hub 0.6.15).

## 1. What it is, in one paragraph

- **An optional globe layer, "Night lights", off on load.** It paints NASA's NOAA-20 Day/Night Band picture for one stated UTC date: the light the satellite measured at night.
- **A compare control for the region in view.** It shows a second, earlier night of the same place, on the same extent and the same scale, with the pixels the cloud layer marks as cloud drawn as unreadable.
- **It is live in the sense Chad set on 15 Nov:** the layer has a new frame every day (read to 15 Nov on 15 Nov). The compare control reads the same service for any date it holds.
- **It is a measurement of light, not of power.** The page never says a place lost power. It says how much light was measured on each night and where cloud made the reading unusable.
- **Cost:** no new line item in the preview (§4).

## 2. The source

| | Read 15 Nov 2026 |
|---|---|
| Layer | `VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance` (NASA GIBS, WMS, EPSG:4326, PNG) |
| Dates held | 2024-03-25 to 2026-11-15, daily |
| Scale | Fixed grey scale, 181 steps, nW/(cm² sr), 0.1 steps from 0; 38.2 and above is white. GIBS publishes the key (`colormaps/v1.3/VIIRS_DayNightBand_At_Sensor_Radiance.xml`), so a pixel's colour gives back its value. |
| Cloud | `VIIRS_NOAA20_Clear_Sky_Confidence_Night`, 0 to 1 in 0.01 steps, daily to 2026-11-15, published key |
| Login | None for GIBS |
| Terms | The LANCE / GIBS terms already in REGISTER (cleared 30 Oct 2026; one acknowledgment sentence, already in the footer) |

- **NOAA-20 is the only satellite with history.** NOAA-21's layer starts 2026-10-27. Suomi NPP ended 2 Nov 2026.
- **Not used:** the gap-filled layer (it fills cloudy pixels from earlier nights, so it can hide a change or show an old one); the LAADS data files (6–24 MB a tile, about seven days behind in the standard archive, a new file reader in the hub, login not tested).

## 3. What the page may and may not say

- **R1. Light, not power.** Wording is "light measured", "less light measured than on <date>". The words "outage", "blackout" and "power" do not appear in the layer's own text.
- **R2. The reading is as measured.** One fixed line: "Light as measured at the satellite. Moonlight, cloud, fires, lightning, boats and the viewing angle all change it." No moonlight or atmosphere correction is claimed.
- **R3. Cloud is shown, never filled.** In the compare view, a pixel whose clear-sky confidence is below the threshold (§8 N4) is drawn with a pattern and reads "cloud: light not readable". Each frame states its share of readable pixels.
- **R4. The LANCE local-scale line travels with it.** REGISTER records NASA's sentence that these data are "not advised" for "informing about conditions at a local scale". The compare view carries the same caveat the fire layer carries.
- **R5. Dates are UTC dates and are printed on both frames.** No frame is shown without its date.
- **R6. Same scale, same extent, same layer** for both frames. The legend is the published scale, with "38.2 and above" at the white end.
- **R7. A documented event sits beside the picture, never inside it.** If a compare is opened from a named event, the event's source is a separate cited line. Nothing assigns the event to a pixel.

## 4. How the data would reach the page

- **Preview (proposed): the page asks GIBS directly**, as it already does for the true-colour backdrop (the page's only direct source call today). No hub change, no storage, no schedule.
- **This departs from hub-first.** The reason for the preview: the compare control asks for a region and two dates the reader chooses, so the hub would be a pass-through, not a collector. Whether a release goes through the hub (a cached pass-through route, or one stored global frame a day as Dust RGB does) is §8 N1.
- **Global frame:** one 2048 × 1024 PNG for the layer's date, drawn over the globe in place of the true-colour picture while the layer is on.
- **Compare frames:** two radiance requests and two cloud requests for the region in view, at the layer's own resolution (about 500 m; cloud about 1 km).

## 5. Not measured yet (to settle before or at the start of a build)

| Open | How it would be measured |
|---|---|
| Which date is safe to call "latest": today's UTC date is still filling. The backdrop uses now − 36 h. | Share of no-data pixels in the global frame for today, yesterday and the day before, at a few times of day |
| Size and fetch time of the global PNG | Read from the pane |
| How the global frame looks on the globe at 2048 px (about 20 km a pixel at the equator) | Local preview |
| Whether a moonlit night makes the global frame unreadable as "lights" | Frames at full moon and new moon, side by side |
| High-latitude summer (no night) and the day side | No-data share by latitude band in June and December frames |
| GIBS rate limits for region requests | NASA's published guidance; not read yet |

## 6. First preview and its acceptance checks

**Scope:** branch from main, page only, local review copy; no merge. `index.html`, `app.js`, `style.css` and a new suite; cache keys bumped.

| Check | Pass |
|---|---|
| Fresh load | Layer off; no night-light or cloud request is made |
| Layer on | Global frame drawn; card states the UTC date, "NASA GIBS, VIIRS NOAA-20", the R2 line; legend shows the scale; "Key · N layers" follows what is drawn |
| Layer off | Backdrop returns; the legend entry and card state clear |
| **Saipan and Tinian, 19 March and 20 April 2026** | Both frames on the same extent and scale; the values read back from the page equal the test record (Saipan summed radiance 2,854 and 770; pixels at or above 5: 154 and 16), same boxes |
| Cloud | 13–17 April for the same place: every pixel drawn as unreadable; no light value shown for them |
| A failed request | The frame says it could not be loaded; the other frame and the legend stay correct; nothing is drawn from a stale answer |
| Dates outside the layer's range | Refused with the range stated |
| Without WebGL, by keyboard, at 390 px | Dates, readable share, caveats and source are readable and operable |
| Breaks | Each rule R1–R7 has a break that must fail its check |
| Regression | The existing suites pass; a normal World View smoke test |

**The test stops the feature** if the Saipan and Tinian pair cannot be drawn credibly on the globe with the cloud visible. That is GPT's condition and it stays.

## 7. Out of scope

- Any statement about power, outages or damage; any per-pixel event claim.
- NASA's Sinlaku map-service layers and its March composite (not opened; a separate source with its own terms).
- Cape Town, or any place chosen because of a local interruption record.
- The LAADS files, the LANCE archive, an Earthdata login, the gap-filled layer, NOAA-21, Suomi NPP.
- Stored history, a Timeline entry, the hub, R2, D1, schedules.
- A difference picture or a percentage change (§8 N5).

## 8. Decisions (Chad's; GPT's view asked on each)

- **N1. Route at release.** Page asks GIBS directly, as the backdrop does (recommended for the preview only); or a hub route. The preview does not settle it.
- **N2. How the global layer sits on the globe.** In place of the true-colour picture while on (recommended: one picture at a time, nothing blended); or drawn over it.
- **N3. Saipan and Tinian after the preview.** Acceptance test only, not kept on the page (recommended: the layer is the live feed; a 2026 event kept on the page is a dated exhibit); or kept as an example link, with the Weather Service record cited once Claude or GPT's extraction of it is on file.
- **N4. Cloud threshold.** Clear-sky confidence below 0.95 is "not readable" (recommended as a starting value; on the test pair it left 85% and 95% of Saipan readable); or another value GPT can justify from NASA's product guide.
- **N5. Numbers in the compare view.** Readable share for each frame only (recommended for the first preview); or also the summed radiance of readable pixels in view for each night, with no percentage and no difference picture.
- **N6. Which night the global layer shows.** Settled by the first measurement in §5; the card always prints the date.

## 9. GPT review of rev 1 (relayed by Chad, 15 Nov) — rev 2

GPT: Night lights passes the live-feed check; advance to a local preview after a short rev 2. The data path is demonstrated; rendering on the globe is still to be verified. Three changes before the build, all adopted. Chad, with the relay: "just remember we have cloudflare lol no manual jobs".

### 9.1 Compare only what is usable on both dates (GPT 1)

- **Every pixel in the compare view is in one of three states**, decided from both dates together:

| State | Rule | Drawn as |
|---|---|---|
| **Usable on both** | Light data present on both dates and clear-sky confidence at or above the threshold on both | The measured light, each frame on the fixed scale |
| **No reliable comparison** | Light data present on both, clear-sky confidence below the threshold or absent on either date | One pattern, the same on both frames; no light value shown |
| **No data** | No light data on either date (no night pass, or the frame has not arrived) | A second, different pattern; never black, never zero |

- **Three shares are printed:** readable on the first date, readable on the second date, usable on both.
- **Any sentence of the form "less light measured" uses only the pixels usable on both.** The first preview prints no such sentence and no radiance total (N5). The reader sees the two pictures and the three shares.
- **Top of the scale.** A pixel at 38.2 or above is white and its true value is unknown above that. The legend says so, and the inspector reads "38.2 or more". This is one reason no total is shown: a sum that includes such pixels is a lower bound.
- **Sea.** A region in view includes sea. Sea pixels are readable and near zero, so they raise the shares without adding light. The shares are labelled "of the area in view".
- **The test record's limits, as GPT states them:** it does not establish that the two sums use the same clear pixels; the boxes include sea; the brightest March pixel was at the top of the scale. `2,854 → 770` stays as a **fixture check** that the page's requests return what the recorded requests returned. It is not shown on the page.

### 9.2 Threshold and withheld comparisons (GPT 2)

- **0.95 stays, labelled as what it is:** "Preview threshold: clear-sky confidence 0.95 or more on both nights. Chosen for this preview; not a NASA standard."
- **Low confidence withholds the comparison; it does not say there was cloud.** The wording is "No reliable comparison", as GPT gives it.
- **Missing coverage is its own state** (table above), so it can never look like a measured zero. In GIBS's picture no-data pixels are transparent, and a measured zero is a grey (`7,7,7` for 0 to 0.1), so the two are distinguishable in the response (read 15 Nov).
- **To verify on the actual preview page, each with its own check (§9.5):**
  - **WMS version and axis order.** The test used WMS 1.3.0 with `CRS=EPSG:4326` and `BBOX` as south, west, north, east, the form the page's backdrop request already uses. Both islands landed inside their boxes. GPT's link to the GIBS access documentation was relayed; Claude has not opened it.
  - **Mask alignment.** The cloud layer is about 1 km and the light layer about 500 m. Both are requested on the same box and the same pixel grid; the check is that a known coast falls on the same pixels in both.
  - **Browser pixel access.** Reading pixel values needs GIBS to allow it for the page's own address. It worked in the pane from a GIBS address and from another NASA address; it is not yet shown from the preview page's address.

### 9.3 The latest-date rule (GPT 3), with the reads behind it

Read through the pane, 15 Nov 15:41 UTC, `VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance`, whole globe at 1024 × 512, share of pixels with no data:

| UTC date | Whole globe | 90–60°S | 60–30°S | 30°S–0 | 0–30°N | 30–60°N | 60–90°N |
|---|---|---|---|---|---|---|---|
| 15 Nov 2026 (today, at 15:41 UTC) | 58.8% | 100% | 54% | 57% | 57% | 53% | 34% |
| 14 Nov 2026 | 17.4% | 98% | 0% | 0% | 0% | 0% | 6% |
| 13 Nov 2026 | 17.3% | 98% | 0% | 0% | 0% | 0% | 6% |
| 12 Nov 2026 | 17.1% | 97% | 0% | 0% | 0% | 0% | 6% |
| 8 Nov 2026 | 16.5% | 93% | 0% | 0% | 0% | 0% | 6% |
| 21 Jun 2026 | 21.8% | 5% | 0% | 0% | 0% | 26% | 100% |

- **Today's date is still filling; yesterday's is complete** apart from the polar gap. One read at one time of day: when a date finishes filling was not measured.
- **The polar gap is expected and seasonal.** In November almost nothing south of 60°S has a night pass. On 21 June nothing north of 60°N did, and a quarter of the 30–60°N band did not. Parts of the northern mid-latitudes have no night-light picture around midsummer.
- **Rule: the layer shows the newest UTC date whose 30°S–30°N band has no more than 1% no data.** That band has a night pass all year, so it tests arrival without being confused by the seasonal gap. By this rule the answer at the time of the read is 14 Nov.
- **The date is pinned.** The chosen UTC date goes into the request and onto the card. If the newest date fails the rule, the card says so: "15 Nov is still arriving. Showing 14 Nov."
- **The seasonal gap is drawn as "No data: no night pass"** in the no-data pattern, with one line in the layer's Choices rows.
- **Nothing is manual (Chad).** The date is chosen by the rule, never by hand. In the preview the page applies the rule itself with one small request per candidate date. At release the hub applies it on its existing schedule and publishes the pinned date, so readers' browsers do not each repeat the check (N1, N6).

### 9.4 Size and time (read 15 Nov 15:41 UTC, pane, one request each)

| Request | Size | Time |
|---|---|---|
| Light, whole globe, 1024 × 512 PNG | 230–244 KB (complete dates) | 1.0–1.4 s |
| Light, whole globe, 2048 × 1024 PNG | 891 KB | 2.3 s |
| Clear-sky confidence, whole globe, 1024 × 512 PNG | 297 KB | 2.2 s |

Request volume and GIBS's published limits are not measured or read yet.

### 9.5 Acceptance checks added or changed

| Check | Pass |
|---|---|
| Three states | A fixture with all three in one view: each has its own drawing; "No data" and "No reliable comparison" differ from each other and from dark measured light without relying on colour alone |
| Shares | The three printed shares equal the fixture's counts; the "usable on both" share is never larger than either readable share |
| 13–17 April, Saipan and Tinian | Whole view "No reliable comparison"; no light value readable from the inspector |
| A frame that has not arrived | A fixture frame that is half transparent: those pixels are "No data", the card names the date as still arriving, and the layer falls back to the prior date by the rule |
| Seasonal gap | 21 June 2026: north of 60°N is "No data: no night pass", not dark |
| Latest-date rule | Fixtures for "newest complete", "newest still filling", "two newest still filling": the pinned date and the card sentence are right in each; the request carries the same date the card prints |
| Axis order and alignment | Saipan and Tinian fall inside their boxes; one named coast falls on the same pixels in the light and cloud frames |
| Pixel access | Values are read on the preview page's own address; if the browser refuses, the compare view says it cannot read values and shows no shares |
| Top of the scale | A pixel at 38.2 or more reads "38.2 or more" |
| Fixture | Recorded requests for 19 March and 20 April give 2,854 and 770 (Saipan box, test harness only) |
| Breaks | One for each of: shares taken from one date only; missing coverage treated as zero; low confidence treated as usable; date on the card differing from the request |

**Stop condition (GPT):** if the preview cannot make the light change and the missing coverage visually distinct, the feature stops there.

### 9.6 Decisions, as they now stand (all Chad's)

| | GPT's recommendation | Claude |
|---|---|---|
| **N1. Route** | Direct GIBS for the preview. Decide the release route after measuring transfer size, load time and request volume. | Agree. With Chad's note: at release the date rule, and any stored copy, run in the hub on its schedule. |
| **N2. On the globe** | Replace the backdrop while Night lights is on | Agree |
| **N3. Saipan and Tinian** | Keep Sinlaku as the acceptance case | Agree: acceptance case; not an exhibit on the page |
| **N4. Threshold** | 0.95 for the preview, labelled accurately | Agree (§9.2) |
| **N5. Numbers** | Coverage shares, no radiance totals | Agree (§9.1) |
| **N6. Latest date** | A usable frame chosen by coverage, pinned, prior date shown when the newest is filling | §9.3: 30°S–30°N no more than 1% no data. The 1% and the band are open to GPT. |
