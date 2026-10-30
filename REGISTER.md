# Mother Earth — source register (Terms and Coverage)

Rule: Chad reads the licence page and pastes the operative sentence; Claude files it with the date read. One row per source. "Coverage" is what the source documents about its own completeness — the thing the page's coverage grades lean on.

## USGS — Earthquake Hazards Program, GeoJSON feed `2.5_day`
- **Read:** 30 Oct 2026 by Chad, https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits
- **Terms (verbatim):** "USGS-authored or produced data and information are considered to be in the U.S. Public Domain."
- **Attribution (verbatim):** "When using information from USGS information products, publications, or websites, we ask that proper credit be given. Credit can be provided by including a citation such as the following: Credit: U.S. Geological Survey".
- **Caveats:** not all images on USGS sites are public domain (irrelevant — we use the data feed only). The USGS identifier/logo is trademarked and governed by the Visual Identity System — **we do not use the logo**, only the name as credit.
- **Automated / public use:** no restriction stated for public-domain data. Feed guidance (feed page, not re-read today) asks for polling no more often than every 5 min on the summary feeds — our cadence is exactly 5 min.
- **Coverage statement:** USGS documents the catalog as complete worldwide at M4.5+; M2.5 completeness is regional (ANSS network density). → D5: `count_m45` is the comparison-eligible quantity; `count` stays `partial`.
- **In force on the page:** footer credit "USGS" links to earthquake.usgs.gov; cell evidence string `m2.5_completeness_map_pending;m4.5_global_complete`.
- **Status:** ✅ cleared for public, automated, attributed use.

## NOAA GML — Mauna Loa CO₂ daily/weekly CSV
- **Read:** 30 Oct 2026 by Claude, from the file header of `co2_weekly_mlo.csv` and `co2_daily_mlo.csv` (carried into the snapshot as `source_notes`).
- **Terms (verbatim, file header):** data "are made freely available to the public and the scientific community in the belief that their wide dissemination will lead to greater understanding and new scientific insights"; "please include relevant citation" — citation: Lan, X., Tans, P. and Thoning, K.W., Trends in globally-averaged CO2 determined from NOAA GML measurements, gml.noaa.gov/ccgg/trends/.
- **Caveats (file header):** recent months are preliminary, subject to recalibration; the weekly file's "1 year ago" and "10 years ago" columns are NOAA's own comparison (365 and 3,653 days back).
- **Coverage statement:** one station. Not a map layer; never graded per cell.
- **In force on the page:** tile labelled "one station, not a map layer", value marked preliminary, comparison labelled as NOAA's; citation in Choices.
- **Status:** ✅ cleared; Chad to confirm by reading the header himself (open the weekly CSV, first 40 lines) — optional.

## NOAA SWPC — planetary K-index JSON
- **Read:** 30 Oct 2026 by Chad, https://www.weather.gov/disclaimer (SWPC is an NWS centre; the NWS disclaimer governs)
- **Terms (verbatim):** "The information on National Weather Service (NWS) Web pages are in the public domain, unless specifically noted otherwise, and may be used without charge for any lawful purpose so long as you do not: 1) claim it is your own …, 2) use it in a manner that implies an endorsement or affiliation with NOAA/NWS, or 3) modify its content and then present it as official government material."
- **Name/logo:** "Use of the NWS name … and/or visual identifier to identify unaltered NWS content or links to NWS web sites are allowable uses." → the credit "NOAA SWPC" + link is allowed; **no logo**, no implied endorsement.
- **Freshness (verbatim):** "special attention should be given to the date and time of the data and products being displayed." → the tile shows the Kp `time_tag` and retrieval age; already in force.
- **Appropriate use (verbatim, abuse policy):** "Know your data refresh frequency … Example: If the forecast data is updated every 6 hours you should only make requests during those cycle output windows." "If a Web Service isn't available users should limit the number of retries to 1 minute intervals." Blocked users email sdm@noaa.gov.
- **Action:** Kp is a 3-hourly product; we currently poll it every 5 min (288/day) — lawful but against the spirit of "know your refresh frequency". **Change to hourly** when the collector is next touched (the `kp_index` D1 write already dedups by time_tag).
- **Coverage statement:** planetary index derived from a fixed set of ground magnetometers (`station_count` is in the feed). Not a map layer; never graded per cell.
- **Status:** ✅ cleared for public, automated, attributed use; cadence change queued.

## NASA FIRMS — VIIRS NOAA-20 NRT area CSV
- **Read:** — (pending)
- **Terms:** —
- **Coverage statement:** — (pass schedule; cloud invisibility is already on the page)

## NASA GIBS — WMS imagery
- **Read:** — (pending)
- **Terms:** —

## OpenSky Network — states API
- **Read:** 30 Oct 2026 (Terms §3(iii)/(vi) + reply Ticket#837506 by Chad).
- **Terms:** automated/public use needs written licence; hobbyist use OK within credits; public site requires being a feeder; no cloud whitelisting.
- **Status:** ⛔ parked until a receiver feeds the network. Page says "not shown" with reason.
