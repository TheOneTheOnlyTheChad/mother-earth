# Night lights — GIBS data-path test, Saipan and Tinian (15 Nov 2026)

**Status: data-path test only. Nothing built, no hub or page change, no feature approved.** Run on Chad's "GO" (15 Nov), after GPT's note relayed by Chad. All reads by Claude through the browser pane, 15:22–15:30 UTC (clock readings in the tool output).

## Question
Is NASA's nighttime-light data a live feed, and can one same-scale before-and-after pair be drawn with the unusable areas visible, without a login or new backend?

## Is it live (read 15:22–15:23 UTC)
- **GIBS** (`gibs.earthdata.nasa.gov`, WMTS capabilities, EPSG:4326 "best"): `VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance` daily to 2026-11-15; `VIIRS_NOAA20_GapFilled_BRDF_Corrected_DayNightBand_Radiance` daily to 2026-11-14; `VIIRS_NOAA20_Clear_Sky_Confidence_Night` daily to 2026-11-15; NOAA-21 equivalents to 2026-11-15 (at-sensor radiance only from 2026-10-27).
- **LAADS standard archive** (collection 5200): `VJ146A1` and `VJ146A2` (NOAA-20) latest day 2026-312 (8 Nov), files posted 15 Nov 12:43–14:41 UTC; the two days before were each posted about seven days after acquisition. `VJ146A2`: 185 tiles a day, 5.8–24.2 MB each, about 2.7 GB a day. `VJ146A1`: 576 tiles, about 22.7 GB a day.
- **Suomi NPP has stopped:** `VNP46A1` / `VNP46A2` end at day 306 (2 Nov), and every S-NPP GIBS layer read ends 2026-11-02.
- GPT's reading (relayed): the LANCE near-real-time archive had 14 Nov tiles on 15 Nov. Not opened by Claude.
- Not tested: whether a LAADS file download needs an Earthdata login.

## The test
- WMS GetMap, EPSG:4326, BBOX 14.85,145.45,15.35,145.95, 120 × 120 px (about 460 m a pixel), PNG, `TIME` = the UTC date. Same layer, extent and scale for every date.
- Pixel colours turned back into values with GIBS's own colour maps (`colormaps/v1.3/VIIRS_DayNightBand_At_Sensor_Radiance.xml`: 181 grey steps, nW/(cm² sr), 0.1 steps from 0, everything at or above 38.2 is white; `VIIRS_Clear_Sky_Confidence.xml`: 0 to 1 in 0.01 steps). No pixel in any frame fell outside the colour maps.
- Boxes: Saipan 15.09–15.30 N, 145.68–145.84 E (1,950 px); Tinian 14.92–15.11 N, 145.58–145.68 E (1,080 px). The boxes include sea.
- Dates read: 15–23 March and 8–25 April 2026 (27 nights).

## Result
| | 19 March 2026 | 20 April 2026 |
|---|---|---|
| Saipan, summed radiance | 2,854 | 770 |
| Saipan, pixels at or above 5 | 154 | 16 |
| Saipan, brightest pixel | 38.2 or more (white) | 22.3 |
| Saipan, clear-sky confidence: mean; share at or above 0.95 | 0.92; 85% | 0.99; 95% |
| Tinian, summed radiance | 183 | 138 |
| Tinian, pixels at or above 5 | 7 | 0 |
| Tinian, brightest pixel | 5.7 | 2.9 |
| Tinian, clear-sky confidence: mean; share at or above 0.95 | 0.90; 83% | 0.98; 95% |
| Sea outside the boxes, median radiance | 0 | 0.1 |

- These were the clearest night on each side. 19 March was the only March night read with both islands mostly clear.
- **Every night 18–25 April** gave Saipan a summed radiance of 500–845 and 8–25 pixels at or above 5. **The March nights and 8–11 April** gave 962–3,732 and 5–192; the low March values (22, 23 March) are nights the cloud layer marks as cloud.
- **13–17 April:** no pixel above 1.7 on either island; clear-sky confidence 0.00 on every one of those nights. Cloud, so nothing can be said about lights from these frames.
- GPT's first candidates: 18 April Saipan clear-sky mean 0.59 (0% at or above 0.95); 19 April 0.93 (47%). 20 April is the clearer frame.

## What this does and does not show
- It shows the data path works: a live daily layer, fetched without a login, drawn on one fixed scale, with a matching cloud layer for the same night.
- The radiance is as measured at the sensor: not corrected for moonlight, the atmosphere or the viewing angle. Both nights are within three days of a new moon by the calendar (not read from a source here), and the sea reads 0 and 0.1.
- It does not assign an outage to any pixel or place. The outage record is the Weather Service report GPT cites (not opened by Claude).
- The gap-filled layer was not used: it fills cloudy pixels from earlier nights.
- One pair, one place. No rendering on the Mother Earth globe was done.

## Not opened by Claude
NASA's Sinlaku map service and the Weather Service impact narrative (links relayed from GPT); the LANCE archive.
