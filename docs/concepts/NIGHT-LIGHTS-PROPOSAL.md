# Night lights — proposal for GPT review (rev 1)

15 Nov 2026 · docs only · nothing built · no branch, hub deploy, REGISTER filing or page change is approved
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
