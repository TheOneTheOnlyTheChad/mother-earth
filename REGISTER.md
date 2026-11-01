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
- **Read:** 30 Oct 2026 by Chad: https://www.earthdata.nasa.gov/data/projects/lance (Acknowledgments, Disclaimer) and https://www.earthdata.nasa.gov/data/projects/lance/disclaimer (full text). FIRMS front page also read.
- **Terms (verbatim):** "NASA supports full and open sharing of data. We ask that if you provide Land, Atmosphere Near real-time Capability for Earth observation (LANCE) data to a third party, you follow the guidelines below."
- **Attribution (verbatim, required form):** "We acknowledge the use of data and/or imagery from NASA's Land, Atmosphere Near real-time Capability for Earth observations (LANCE) (https://earthdata.nasa.gov/lance), part of NASA's Earth Science Data and Information System (ESDIS)." → on the page footer (done 30 Oct 2026).
- **Disclaimer (verbatim):** "The information presented through LANCE, GIBS, Worldview, and FIRMS are provided 'as is' and users bear all responsibility and liability for their use of data…" and — **the operative line for us** — "Due to the spatial resolution and other characteristics of these data, their use for tactical decision-making or informing about conditions at a local scale are not advised." Also: "If latency is not a primary concern, users are encouraged to use standard science products." And: "The designations employed in the data do not imply the expression of any opinion whatsoever on the part of ESDIS concerning the legal or development status of any country, territory…"
- **Consequences on the page:** (1) the "not for local-scale or tactical decisions" line sits in the fire layer's Choices rows and in the cell inspector; (2) we use NRT because latency is the point, and say so; (3) we draw no borders, so the designations clause is moot — recorded anyway.
- **Rate limit (from MAP_KEY issue email, 30 Oct 2026):** 5,000 transactions / 10 minutes per key. We make 96/day.
- **Operational notice (FIRMS front page, 30 Oct 2026):** Suomi NPP data delivery ceases 2 Nov 2026; users told to move to NOAA-20/NOAA-21. **We already use NOAA-20 — no action.** NOAA-21 is a possible second source later.
- **Coverage statement:** global detections "within 3 hours of satellite observation" (US/Canada real-time). Per-cell adequacy needs the pass schedule (not wired); cloud hides detections (on the page already).
- **Window semantics (measured 1 Nov 2026, confirmed against the area-API docs by Gemini):** `day_range=1` returns the **current UTC date only**, not the last 24 h. The file was header-only (122 bytes) from 02:15 to 03:45 UTC and held 507 rows at 04:00. Decision: keep `day_range=1` (no extra CPU, no doubled file) and label the reading "detections so far today (UTC)". Hub 0.1.9: an empty file before 04:00 UTC is recorded as "no detections processed yet for today", later in the day as "not a validated zero"; both show as unknown, never zero. `day_range=2` would give a true 24 h but doubles the parse (~15 ms CPU at 1.3 MB already exceeds the Free plan's 10 ms soft limit) — not taken.
- **Status:** ✅ cleared for public, automated use with the LANCE acknowledgment and the local-scale caveat shown.

## NASA GIBS — WMS imagery (VIIRS NOAA-20 true colour)
- **Read:** 30 Oct 2026 by Chad — same LANCE pages as FIRMS; the disclaimer names GIBS explicitly ("The information presented through LANCE, GIBS, Worldview, and FIRMS are provided 'as is'…").
- **Terms / attribution:** as FIRMS — the single LANCE acknowledgment sentence covers "data and/or imagery", so one footer sentence credits both.
- **Coverage statement:** daily composite; the page labels it "previous day, not live" with the date. Not an observation layer; never graded.
- **Status:** ✅ cleared.

## NSIDC — Sea Ice Index v4 (G02135), daily extent + 1981–2010 climatology, NOAA mirror
- **Read:** 30 Oct 2026 by Claude — directory listing and file headers at https://noaadata.apps.nsidc.org/NOAA/G02135/ (open; no Earthdata login). **Chad to read and paste NSIDC's data-use/citation page:** https://nsidc.org/data/g02135 (look for "Citing These Data" and any use terms).
- **Terms:** NOAA-hosted NSIDC product; header points to source products nsidc-0081 / nsidc-0051. Citation form carried in the snapshot: Fetterer, F., K. Knowles, W. N. Meier, M. Savoie, and A. K. Windnagel. Sea Ice Index, Version 4. NSIDC. https://nsidc.org/data/g02135 — **verbatim terms pending Chad's paste.**
- **Cadence (measured):** file updated once a day (~14:20 UTC on 29–30 Oct); we fetch at 03/09/15/21 UTC. Daily files ≈1.9 MB each (tail-parsed), climatology 34 KB.
- **Coverage statement:** passive microwave; extent = ocean with ≥15 % concentration; one number per hemisphere; ~1 day latency. Not a map layer.
- **Map layer (measured 30 Oct 2026, GIBS WMS, 2048×1024, day 29 Oct):** VIIRS_NOAA20_Sea_Ice (observation) painted 0.76 % of the globe — polar night + cloud; AMSRU2_Sea_Ice_Concentration_12km ended 2025-09-01; GHRSST_L4_MUR_Sea_Ice_Concentration (L4 analysis, model tier) painted 12.2 %, 133 KB, 2.2 s. **Decision pending:** show MUR labelled "analysis, not observation", or no cap imagery.
- **Status:** ✅ data in use (attributed); terms paste outstanding.

## OpenSky Network — states API
- **Read:** 30 Oct 2026 (Terms §3(iii)/(vi) + reply Ticket#837506 by Chad).
- **Terms:** automated/public use needs written licence; hobbyist use OK within credits; public site requires being a feeder; no cloud whitelisting.
- **Status:** ⛔ parked until a receiver feeds the network. Page says "not shown" with reason.

## aisstream.io — AIS WebSocket stream (ships)
- **Read:** 31 Oct 2026 by Claude (browser pane), https://aisstream.io/ and https://aisstream.io/documentation. **No terms-of-use or licence page exists on the site** (the only policy link is /privacypolicy); the sentences below are the operative ones on the site. Chad to eyeball and confirm.
- **Terms (verbatim, homepage):** "Track ship movements, monitor maritime accidents and discover ship's cargo from aisstream.io's websocket api in real-time and for free."
- **Automated / public use (verbatim, documentation §02):** "Direct browser connections are not permitted; proxy only the information your clients need from your own server." → exactly our design: Mac collector holds the socket, the hub publishes snapshots, viewers never connect.
- **Limits (verbatim, documentation §05):** "Connections per account — 3 subscribed connections"; "Initial subscription — Within 3 seconds"; "Connection speed — Read continuously… the service drops messages"; "Beginning in September 2026, uncompressed connections will be subject to per-user bandwidth limits". We use 1 connection, compression negotiated (measured `CompressionEnabled: true`, 31 Oct).
- **Attribution:** none required by the site; we credit "AIS via aisstream.io" in the footer and carry a citation string in the envelope.
- **Coverage statement:** the site says its stations are "Our global network of Automatic Identification System (AIS) stations" — terrestrial receivers; no coverage map published. → cells stay `partial` with evidence `terrestrial_ais_only`; a silent cell is never read as an empty sea.
- **Measured (31 Oct 2026, 60 s window, world bbox):** 3,943 messages → 3,838 unique vessels (3,058 Class A, 780 Class B), 175 cells, 424 KB envelope; near-zero repeat rate per vessel within 60 s — reason not known (server-side thinning suspected, not confirmed).
- **Status:** ⚠️ in use, public, attributed — **scope not established**: the site's proxy guidance supports serving our own viewers, but "free" plus the absence of any licence page does not establish archival or redistribution rights. Evidence recorded above; the unresolved scope is recorded here. Durability risk: a free service with no published terms can change or close without notice. (Reviewer GPT, round 4, 31 Oct 2026.)
