# Cape Town observation station — A1 private preview: "Aircraft seen by our Cape Town receiver"

**Rev 3, 17 Nov 2026 (17 Nov 07:38 UTC clock reading): GPT's review of rev 2; §7 records the two remaining freshness fixes, the balloon replay and the live results, and governs where it differs from earlier sections.**

**Rev 2, 17 Nov 2026 (17 Nov 06:32 UTC clock reading): GPT's review of rev 1; §6 records the three freshness fixes and the range controls and governs where it differs from §3–§5.**

Rev 1, 17 Nov 2026 (17 Nov 06:10 UTC clock reading). Branch `cape-town-station-rc`. For GPT's review. **Private, local-network preview only.** No page on the public site, no hub change, no upload, nothing on the Pi changed. The public OpenSky release, additional feeds and hardware purchases are outside this pass (Chad).

## 1. Scope (Chad's Go, 17 Nov, own message)
Spec: `docs/concepts/CAPE-TOWN-STATION-SPEC.md` (A1 only). Verify the local readsb aircraft JSON on the Pi; build a private page-only preview; plot aircraft with usable positions with observation age, altitude, heading and speed where available; distinguish a fresh feed with zero plottable aircraft, stale data and an unreachable receiver; confirm OpenSky is still receiving during the test; keep it on the local network.

## 2. The endpoint, verified
- `http://adsb-feeder.local:8080/data/aircraft.json` on the home network (read in the app's browser pane, 05:47:04 UTC by the receiver's own clock): HTTP 200, `application/json`, top-level keys `now`, `messages`, `aircraft`.
- That reading: 17 aircraft, 12 with `lat`/`lon`; `seen_pos` 0.03–5.0 s (median 0.26 s); 8 with barometric altitude "ground"; `r_dst` (distance from the receiver, nautical miles) and `r_dir` (bearing) present on all 12; furthest 82 nmi (152 km).
- Fields used by the preview: `flight`/`r`/`hex` (label), `lat`, `lon`, `seen_pos`, `r_dst`, `r_dir`, `alt_baro` (number or "ground"), `alt_geom`, `gs`, `track`/`true_heading`/`mag_heading`, `rssi`. Field meanings: readsb README-json (linked in the spec).
- Neither of Claude's shells can reach the Pi (the Mac shell is a sandbox behind an allow-list); only a browser or a program on the Mac itself can.

## 3. What was built (`station/cape-town/`)
- `preview.mjs`: a helper for the Mac, no dependencies. Listens on **127.0.0.1:8787 only**. `/` serves the page; `/aircraft.json` reads the Pi's JSON (4 s limit) and returns it with the time it was fetched; anything else 404; GET only. Nothing is stored or sent anywhere else.
- `preview.html`: one self-contained page (no external scripts, fonts or map tiles). Polls every 3 s.
  - **Plot:** receiver at the centre, north up, rings at 50/100/200/300 km. Each aircraft is placed by the receiver's own `r_dst` and `r_dir`, so **the page never holds the antenna's coordinates**. Arrow along the heading (dot if none), coloured by altitude band; on-ground and no-altitude have their own colours.
  - **Table:** label, altitude (m), speed (km/h), heading, distance and bearing, position age, signal.
  - **Ageing:** position age = `seen_pos` + time since the reading. Faded past 15 s; not drawn past 60 s (still listed, marked). Aircraft with no position are counted, not drawn.
  - **States:** live with aircraft · live with zero plottable ("Receiver live — no aircraft with a usable position right now", with the number heard) · stale (receiver's newest data over 30 s old, or its clock unchanged for 4 readings in a row; nothing drawn) · unreachable (no answer in 4 s, HTTP error, or not aircraft JSON; nothing drawn and earlier aircraft cleared) · helper not running (says so).
  - Scope wording on the page: aircraft heard by this one receiver; terrain, antenna position, height and transmission decide what appears; an empty sky here is not an empty sky.
  - Test switches `?sim=zero|stale|down` act on the real feed in the helper and show a red SIMULATED banner.
- Start: `node ~/mother-earth/cape-town/preview.mjs`; open `http://localhost:8787`.

## 4. Checks
**Local suite** (`station/cape-town/preview.test.cjs`; a stand-in receiver, the real helper and page, Chromium): **24 passed, 0 failed.** Covers: live (4 plotted of 7; faded; too-old listed not drawn; no-range listed not drawn; no-position counted; units), fresh-and-empty, sim=zero, sim=stale, an old receiver clock, a truly frozen receiver, sim=down, HTTP 500, wrong content, no answer, recovery, live-then-unreachable clears the plot, helper stopped, helper not reachable on the network address, 404 and POST refused.

**Live smoke on the real Pi** (Chad started the helper in Terminal; Claude drove a tab in Chad's Chrome through the extension, 06:07–06:09 UTC):
- Live: "Receiver live — 12 aircraft plotted" at 06:07:55 UTC; receiver clock 06:07:55, fetched 0.41 s later; 20 heard, 12 with a position, all 12 with distance, altitude, speed and heading; 8 counted without a position; furthest 228 km. Aircraft on the ground at 13 km, bearing 78–80° (the airport side). Screenshot looked at: arrows, labels, table and counts agree.
- `?sim=zero`: live, 0 plotted, "18 aircraft heard; none has a current position to plot", banner shown.
- `?sim=down`: "Receiver unreachable", nothing drawn, banner shown.
- `?sim=stale`: "Receiver data is stale … newest data is 2 min old", nothing drawn, banner shown. (It was stale at once because the frozen reading had been taken about two minutes earlier, when the stale link was first opened; the frozen-clock rule is covered by the local suite.)
- The main page stayed live throughout.

**OpenSky still receiving during the test (Pi's own status page, `http://adsb-feeder.local/`, status update 06:09:35 UTC):** OpenSky row: **Data = "feed/mlat is connected"** (green); MLAT = "mlat sync warning (intermittent sync issue / lack of traffic / no other receivers in the area)"; Enabled = "feed is intermittent / degraded". This is the Pi's side of the connection. **OpenSky's own dashboard was not checked in this pass** (it needs Chad's login); the last dashboard check is GPT's at 03:26 UTC.

## 5. Open / not done
- OpenSky's dashboard during the test (above). The degraded/MLAT warning on the Pi's page is not investigated; the note on that page says degraded MLAT is often server-side, and Martin's location update for the receiver is still unverified.
- The plot crowds near the centre: airport traffic at 13 km sits on a 320 km scale. A range switch would fix it (not built).
- No coastline or map under the plot (kept fully offline). Possible later.
- Callsigns and registrations are shown (private preview of our own reception). Any public version is a separate decision and would need its own rules.
- The helper runs only while its Terminal window is open, on the Mac, on the home network.
- Not tested: Safari, phone, screen reader; a receiver-clock offset against the Mac's clock (the stale rule assumes both keep time).
- A2 (other networks) and section 4 instruments: not started, by scope.

## 6. Rev 2 — GPT's review of rev 1 (relayed by Chad, 17 Nov)
**OpenSky:** GPT refreshed the dashboard: Online, 74 messages per second at 06:20 UTC (08:20 SAST), i.e. received after the smoke test. GPT: leave the Pi settings alone; watch the Pi's "intermittent" warning only if OpenSky's samples stop advancing; the MLAT warning is about synchronisation between receivers. This closes the dashboard item in §5.

**Three freshness cases GPT reproduced on `preview.html`, all fixed:**
1. **Clock difference was read as staleness (and a fast clock passed unnoticed).** Staleness no longer compares the Pi's clock with the Mac's. The page watches whether the receiver's own clock moves between readings. The smallest gap seen between the two clocks is taken as the clock difference; how far the gap grows past it is the data's age (stale past 30 s), and an unchanged receiver clock for 4 readings is stale as before. A first reading more than 30 s off is shown as "Checking the receiver…" with nothing drawn until a second reading settles it. A difference over 10 s is stated on the page ("about 45 s behind/ahead of this Mac's clock"). Limit: data that arrives late by a constant amount but keeps moving cannot be told from a clock difference, and shows as one.
2. **Live after 35 s without a poll.** A reading now expires on its own: 30 s after the last fresh reading the page shows "No fresh reading" and draws nothing, whatever the last poll concluded.
3. **Overlapping polls; an older answer replacing a newer one.** One poll at a time: a poll still waiting blocks the next (counted), each has a 6 s limit, and a reading older than the one held is ignored.

**Range controls:** 40 km, 100 km, 320 km buttons (rings 10/20/30/40, 25/50/75/100, 50/100/200/300). Aircraft beyond the chosen range stay in the table, marked, and are counted under the plot. `?range=40` opens at that range. Default 320 km.

**Checks:** local suite now **42 passed, 0 failed**. New cases: Pi clock 45 s behind (checking, then live with the note); 45 s ahead; 2 min behind but moving; old and not moving (checking, then stale); clocks agreeing (no note); no poll for 27 s (still live) and for 36 s (expired, nothing drawn), then recovery; a receiver taking 3.5 s per answer (polls skipped, never two requests at once); answers alternating newer/older (receiver time never goes backwards on the page); the three ranges, the pressed state, `?range=40`, and the empty state at 40 km. **Run against the rev 1 page, the new freshness, overlap and range cases fail.** `preview.mjs` is unchanged.

**Not done:** the live smoke was not repeated on the real Pi at rev 2. The helper had been stopped when Claude tried (06:31 UTC). It needs `node ~/mother-earth/cape-town/preview.mjs` running again; the Mac copy of the page is already rev 2.

**Radiosonde first look** (GPT's second ask): `docs/research/CAPE-TOWN-RADIOSONDE-FIRST-LOOK-2026-11-17.md`.

## 7. Rev 3 — GPT's review of rev 2 (relayed by Chad, 17 Nov), balloon replay, live results
**Two remaining A1 cases GPT reproduced, both fixed in `preview.html`:**
1. **A repeated reading reset the 30 s timer.** The limit now runs from the last reading whose receiver time moved forward (`movedAt`); a repeat of the same reading leaves it alone. Position ages are counted from the same moment. Check: one answer replayed byte for byte with the frozen-clock rule switched off: live at 24 s, "No fresh reading" at 35 s while answers keep arriving, live again when the receiver moves.
2. **A Pi clock stepping backwards was ignored until it caught up.** The first older reading is still not trusted on its own. A second older reading that has moved forward from the first confirms the receiver is on an earlier clock: the page follows it, goes live, and says the clock moved back (for 60 s). Older readings that do not move are stale. Checks: 5-minute step back (not followed on the first, followed on the second, stays live, forward jump is simply newer); back and frozen is stale.
- Aircraft suite **50 passed**; against the rev 2 page the new cases fail. `preview.mjs` gained two read-only routes for the replay; its aircraft behaviour is unchanged.

**Balloon replay (private; GPT's licence finding: SondeHub's open telemetry is CC BY-SA 2.0; sensor readings to be treated as uncalibrated; single archived flight only, no polling):**
- `fetch-flight.mjs`: downloads one serial once and saves it unchanged in `balloon/` with a record (source, time, frame count, sha256). Does nothing if the copy exists. Tries the open archive, then the API.
- `preview.mjs`: `/balloon` (the page) and `/balloon/flight.json` (the saved copy and its record), read from disk only.
- `balloon.html`: received path from above (north up, scale bar; way up and way down in different colours; a gap over 30 s breaks the line); first and last points labelled "first point received (not the launch)" and "last point received (not the landing)", plus a sentence saying so; highest point; altitude slider with an up/down switch; readout (time, altitude, position, distance from the first point, temperature, humidity, wind estimate); temperature and humidity by altitude, each marked uncalibrated on the chart, in the readout and in a note; wind labelled as an estimate from GPS drift with its window stated (first to last reading within 30 s either side; none under 20 s or across a gap); credit block: SondeHub, CC BY-SA 2.0 with link, the single copy's source/time/sha256, the changes made (time order, repeats and unusable readings left out and counted, flat local map, wind estimate added), and the ShareAlike condition.
- **The raw flight is on the Mac only** (`~/mother-earth/cape-town/balloon/`), not in this repository: it carries the volunteer stations' callsigns and positions. The page shows only how many receivers heard the flight.
- Balloon suite (`balloon.test.cjs`, synthetic flight in SondeHub's frame format, real helper and page): **24 passed**.

**Live results (Chad ran `fetch-flight.mjs` then `preview.mjs`; Claude drove tabs in Chad's Chrome, 07:35–07:37 UTC):**
- **Flight download:** open archive answered HTTP 403 for this serial; the API copy was saved at 07:33:44 UTC: 2,829 frames, 1,726,665 bytes, sha256 `c29a63b9…dd97`.
- **Balloon replay on the real flight:** loaded; 2,829 readings, 16 Nov 23:42:17 UTC to 17 Nov 01:06:27 UTC; first received 211 m, highest 27,429 m, last 9,631 m; one reading every 2 s; no gap over 30 s; 2 receivers; 0 repeats and 0 unusable readings left out. Slider: 3,000 m → 8.3 °C, 13.7 %, about 12 km/h from 233°; 10,007 m → −39.7 °C, 18.4 %, about 90 km/h from 231°, 17.6 km from the first point; top → −51.3 °C, 0.0 %; way down at 14,967 m → −60.8 °C, 2.7 %, about 119 km/h from 246°. These agree with the first-look note. Screenshot looked at: path, three labels, slider marker, both profiles drawn.
- **Aircraft at 40 km: NOT smoke-tested live.** The helper ran, but the Pi did not answer: six requests in a row timed out at 4 s, and Chrome could not resolve `adsb-feeder.local` (DNS_PROBE_FINISHED_NXDOMAIN) at 07:36 UTC. The page showed "Receiver unreachable", nothing drawn, with the 40/100/320 km rings switching correctly. Cause not known (Pi off the network or restarting, the Mac on a different network, or name resolution); not investigated; nothing on the Pi touched.

**Open:** live aircraft smoke at 40 km once the Pi answers; why the Pi stopped answering by name; map labels can overlap the path near the end points; the wind estimate around the highest point spans the burst and is not meaningful there; GFS comparison, recurring polling and hardware left for a later decision (GPT, Chad).
