# Cape Town observation station — A1 private preview: "Aircraft seen by our Cape Town receiver"

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
