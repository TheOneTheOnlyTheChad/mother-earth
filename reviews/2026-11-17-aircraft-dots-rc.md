# aircraft-dots-rc — aircraft positions as plain dots (preview branch) — review packet

**Rev 2.1, 17 Nov 2026 15:46 UTC (clock reading): one correction after GPT's review of `b23cd1e`.** The packet said a future snapshot time is withheld, but the code allowed up to ten minutes ahead (GPT's probe: five minutes ahead was published). The code now withholds any snapshot time later than the hub's clock, with no allowance; suite checks added for an hour, five minutes and one millisecond ahead (withheld) and for equal to the clock and one millisecond behind (served); breaks run against a copy: restoring the ten-minute allowance fails 1 check, withholding a time equal to the clock fails 1, and `expiry removed` still fails 1. `aircraft-counts.test.mjs` is 75 checks. GPT also confirmed: both production holds resolved; keeping one expired snapshot in private R2 until replacement or clearing is acceptable, no scheduled erasure; release order sound. Nothing else changed.

**Rev 2, 17 Nov 2026 15:41 UTC (clock reading). Preview only. Nothing here is installed, deployed or merged.**
Branch `aircraft-dots-rc`, from main `b9c0d2b`. The head is in the message that accompanies this packet (a file cannot hold its own commit). Rev 1.1 was reviewed by GPT at `c8bd941`: passed, with two fixes asked for before production. Rev 2 makes them. **Where rev 2 differs, §0 governs;** §2 and §7 are rewritten; the rest stands as written.

## 0. Rev 2: GPT's two findings and what changed
**Finding 1: the hub validated the coordinate rows but passed unexpected metadata through** (an upload with `unexpected.icao24` was accepted and served from `/snapshot/opensky`, `/cells/opensky` and the dated copy). Reproduced, then fixed:
- `aircraftProject()` in `phase1/worker.js` builds every stored and served aircraft object from nothing, key by key, nested objects included (`cells.<id>` = `count` + `coverage{grade, evidence}`; `counts` = seven named whole numbers; `coverage_default`; `interruptions` always empty). Nothing the uploader sent is copied through.
- **Every sentence in the file is now the hub's own text** (`quantity`, `records_policy`, `cadence`, `citation`): an uploader's wording never reaches a reader. `collector_version` and `ingested_from` must match a version pattern or read "unknown". `coverage.evidence` is `volunteer_receivers_only` or "unspecified". A failed run's free-text note is matched to one of seven fixed phrases, never copied.
- Applied at `/ingest/opensky` before any write (normal and archive-only path), in `writeSnapshot`, and **again when serving**, so a file left by an earlier hub is held to the same schema.
- **The counts-only collector installed today (mac-0.3.3) is still accepted and served** (suite check rev2 E).

**Finding 2: the three-hour limit only cleared the map; the hub kept serving coordinates, cacheable, and a rollback left them public.** Reproduced, then fixed:
- **Expiry at the hub:** `/snapshot/opensky` serves positions only while now − the snapshot's own time (`window_end`) is under 3 hours (`AIRCRAFT_MAX_AGE_S`), independent of cadence. After that the same file is served with no coordinates and `positions: "withheld_expired"`; the snapshot time and the counts are still given. A snapshot time that is unreadable or in the future is not served either.
- **`Cache-Control: no-store`** on `/snapshot/opensky` and `/cells/opensky` (was `public, max-age=60`).
- **Positions are OFF unless the plain variable `AIRCRAFT_POSITIONS` is exactly `1`.** Off: an upload's positions are not stored at all (the reply says "not stored"), and none are served. So deploying the hub publishes nothing new, and installing the collector publishes nothing new. **Setting the variable is the step that makes coordinates public, and gets its own approval.**
- **Immediate stop:** remove `AIRCRAFT_POSITIONS`: the route reads it on every request, so the next request gets `positions: "withheld_off"` and no coordinates. Then `POST /admin/aircraft/clear-positions?key=…` removes them from the one stored copy (`latest/opensky.json`); it is safe to repeat. Neither step waits for a collector run.
- **Page:** `aircraft.js` reads `positions` and says "…more than 3 hours ago… its positions are no longer served" (with the snapshot time) or "not being published at the moment"; a file marked withheld is never drawn. Wording now says **"rounded positions without identifiers"** and states that a position and snapshot time could still be matched against other flight data.

**Tests added (each proven to fail on broken code):** `phase1/aircraft-counts.test.mjs` is now **74 checks** (rev2 A to G): unexpected fields at every level absent from all four stored objects and both routes; exact top-level and nested key lists; hub-owned sentences; no-store; 1 s under 3 h served, at 3 h and 4 h withheld, future time withheld; variable removed → withheld on the next request; clear route (403 without key, 405 on GET, clears, repeatable); variable off → nothing stored; only "1" switches on; mac-0.3.3 counts-only upload unchanged; a stored legacy file projected when served; unreadable stored file → 503; fixed phrases for a failed run. **Hub breaks run against a copy:** ingest projection removed → 3 fail; expiry removed → 1; switch ignored → 5; cacheable header → 1; clear does nothing → 2; cells copied through → 3. `phase1/aircraft-dots-page.test.cjs` is now **32 checks** (three for the withheld states); its 4 breaks still fail.
**Also run after rev 2:** aircraft-schedule 88; history-hub 33, sunface-hub 171, wind-hub 103, health-hub 29, osmc-reliability-hub 27, status-notes-hub 6, drifters-hub 12, ships-fallback 7, ships-late 7, place-rows 7; the Worker loads as a module.
**Still not done:** a real upload; phone rendering; the Mac bash 3.2 regression (`run.sh` unchanged); the Playwright page suites; dot colour over cloud.
**One thing rev 2 does not do:** after three hours the hub stops *serving* positions, but the stored copy in `latest/opensky.json` (private R2, not publicly readable) stays until the next upload overwrites it or the clear route is called. Say if you want the hub to erase it on a schedule.

## 1. What was asked
Chad, 17 Nov 2026 (his own message): "reuse the existing scheduled pull and keep one replaceable snapshot of plain dots, with no identifiers, tracks or history. Include the 2014 paper citation alongside the OpenSky website credit. Send GPT the branch head and the exact fields the browser receives for review. This go is for the preview only. Production approval comes separately."
Basis: OpenSky ticket #837506, Martin, 17 Nov 2026: "All good with us, yes you can use the aircraft positions / contents from the API on the map." Record: `docs/research/ENQUIRIES-2026-11.md` rev 11 (on main). Terms §3(i): no aircraft identifiers in anything published.

## 2. What the browser receives (the exact fields)
The page makes two requests for aircraft, each only while its own switch is on. Neither is new: both routes exist on hub 0.6.17.

**`GET /cells/opensky`** (counts switch): unchanged. No `records`, `record_fields` or `record_format` key.

**`GET /snapshot/opensky`** (positions switch). Top-level keys, complete list and order, enforced by the hub (rev 2):
`schema_version, collector_version, layer, window_start, window_end, retrieved_at, scheduled_for, source_status, interruptions, stale_after_s, cells, record_format, record_fields, records, coverage_default, quantity, position_age_cutoff_s, counts, position_precision_deg, records_policy, credits_remaining, cadence, citation, received_at, ingested_from, positions, positions_max_age_s` (`note` only on a failed run; `position_precision_deg` only when positions are present). `positions` is one of `published`, `none`, `withheld_off`, `withheld_expired`.

| Key | Content | Per aircraft? |
|---|---|---|
| `record_fields` | exactly `["lat","lng"]` | names only |
| `records` | one `[lat, lng]` pair per counted aircraft, each value rounded to 0.01°, the list sorted by latitude then longitude. Example: `[[-33.9,18.6],[48.86,2.35]]` | **yes: the only per-aircraft values** |
| `cells` | `{ "<row>_<col>": { count, coverage: { grade, evidence } } }` on the 4° grid | no (totals) |
| `counts` | `state_vectors, counted, without_position, position_older_than_cutoff, position_time_missing, duplicate_addresses, on_ground` | no (totals for the snapshot) |
| `window_start`, `window_end` | OpenSky's snapshot time (one time for the whole snapshot) | no |
| `retrieved_at`, `scheduled_for`, `received_at` | collector and hub clock times for the run | no |
| `position_age_cutoff_s` | 300 | no |
| `position_precision_deg` | 0.01 | no |
| `stale_after_s` | 10800 | no |
| `source_status`, `interruptions`, `record_format`, `schema_version`, `collector_version`, `layer`, `coverage_default`, `quantity`, `records_policy`, `cadence`, `citation`, `credits_remaining`, `ingested_from` | run metadata and wording | no |

**Not in the file, and not reaching the hub at all:** ICAO 24-bit address, callsign, origin country, altitude (barometric or geometric), velocity, heading, vertical rate, squawk, on-ground flag per aircraft, position source, category, the time of each aircraft's position or last contact. The address is used once, inside `openskyPositions()` on the Mac, to drop duplicates, and never leaves that function.
**Order carries nothing:** the list is sorted by position, not left in OpenSky's order, so an entry's place in the list says nothing about which aircraft it was and two snapshots cannot be lined up entry by entry.
**Size:** about 6,700 positions is roughly 110 KB uncompressed on top of the 42 KB counts file (estimate from the 17 Nov counts; not measured on a real upload).

## 3. No tracks, no history: where a position can exist
| Place | Positions? |
|---|---|
| Mac, memory of the one collector run | yes, until the process exits |
| Mac disk | **no.** An aircraft upload is never kept as a pending file (one attempt, `noPending`); a dry run prints "[N positions not printed]" because `run.sh` sends collector output to `logs/collector.log` |
| Hub R2 `latest/opensky.json` | **yes: the one stored copy.** Overwritten by the next upload |
| Hub R2 `snapshots/opensky/<time>.json` (dated copy, 2-day lifecycle) | **no** from hub 0.6.18 (written without records). **On hub 0.6.17 it would hold them for 2 days: this is why the hub change is part of this branch and must be deployed before the collector is installed** |
| Hub R2 `cells/…`, `latest-cells/…` | no (as today) |
| Hub D1 | no (run log holds the number of records only) |
| Browser | in memory while the switch is on; `Cache-Control: public, max-age=60` on the route, so a cached copy lasts a minute |
| Page | one sheet of dots; the earlier sheet is removed and disposed in the same step the new one is added; cleared when the snapshot is 3 hours old (its own `stale_after_s`) |

## 4. What changed, by file
- **`phase1/collector-mac.mjs`** (mac-0.3.3 → **mac-0.3.4**): `openskyDots()` (round to 0.01°, sort); the opensky feed publishes `records: openskyDots(rows)` with `record_fields ["lat","lng"]`; cells are still counted from the unrounded positions, so the counts are exactly what mac-0.3.3 publishes; `position_precision_deg` and a new `records_policy` sentence; the dry run never prints positions. **The request to OpenSky is unchanged: same URL, same one request per run.**
- **`phase1/run.sh`: not changed** (sha256 `f6f587ae…65ce`, the installed rev 5). Schedule, home check, ledger and the cap of 10 per rolling 24 h are untouched.
- **`phase1/worker.js`** (0.6.17 → **0.6.18**): `/ingest/opensky` refuses any record field other than exactly `lat,lng`, any value that is not a latitude and longitude in range, and any value not rounded to 0.01° (HTTP 422, nothing stored); the dated copy under `snapshots/opensky/` is written without records, on the normal and the archive-only path; `aircraftPublic()` strips records with any other field before publishing, which also covers the hub's own parked OpenSky job (its rows carry addresses and callsigns) should `OPENSKY_ENABLED` ever be set. Other layers are untouched (ships checked in the suite).
- **`aircraft.js`**: second switch "Aircraft — positions in the newest snapshot". Reads `/snapshot/opensky`; draws only if `record_fields` is exactly `lat,lng`; one non-pickable sheet of dots above the counts sheet; no tap reading, no label per dot; cleared at `stale_after_s`. The counts layer's code path is unchanged apart from `buildMesh()` taking height, opacity and order as parameters.
- **`index.html`, `sources.html`, `app.js`**: card and Sources wording for both layers; **the 2014 paper citation added beside the website credit** (terms §4(i)): Schäfer, Strohmeier, Lenders, Martinovic, Wilhelm, "Bringing up OpenSky: A large-scale ADS-B sensor network for research", ACM/IEEE IPSN, April 2014. `?v=` bumped; `style.css` one rule; `moon.html`, `sun.html`, `timeline.html` only the `style.css?v=` value.
- **Suites:** `phase1/aircraft-counts.test.mjs` (now collector + hub, 49 checks; the hub part drives the real `fetch` handler with storage in memory); **new `phase1/aircraft-dots-page.test.cjs`** (29 checks on the real `aircraft.js` with stand-ins for document, canvas and globe; 4 code breaks). Three hub suites had the hub version pinned and now read 0.6.18.

## 5. Checks run (Linux, node 22, this container)
- `node phase1/aircraft-counts.test.mjs`: 49 passed, 0 failed.
- `node phase1/aircraft-dots-page.test.cjs`: 29 passed, 0 failed. Breaks: `any-fields` 3 fail, `keep-old` 4 fail, `no-clear` 2 fail, `tap` 1 fail (each break fails the suite, as it must).
- `bash phase1/aircraft-schedule.test.sh`: 88 passed, 0 failed (bash 5.2, Linux).
- Hub suites after the change: history-hub 33, sunface-hub 171, wind-hub 103, dustrgb-hub 174, skycraft-hub 164, health-hub 29, drifters-hub 12, ships-fallback/late/probe pass, and the rest of `phase1/*.test.mjs` as on main. Three suites do not run in this container on main either (`night-lights`, `sky-scene-ref`, `solar` crash at import; `oceanheat-hub` needs its snapshot folder; `orbital` needs a file argument).

## 6. Not done, not checked (say so plainly)
1. **No real upload exists.** No Mac runtime file was changed and no hub was deployed, so `/snapshot/opensky` on the live hub still has `records: []`. On the live hub today the positions switch would read "…carries counts only: no positions have been collected yet."
2. **Seen on the real globe with SYNTHETIC positions only** (17 Nov 2026 15:25 UTC, the Mac's browser pane, 1024 × 768): the branch's page files at `a3510fe`, fetched by commit, sha-checked (`index.html` af6497b6, `app.js` 0ecb24e4, `style.css` 2d5f51f6, `aircraft.js` 2a404fbd) and written into a clean github.io tab; 6,500 seeded made-up positions supplied through `ME.aircraft.dots.opts.source`. Result: state "loaded", one sheet in the scene, 6,500 dots drawn, in the right places, the counts layer off and unrequested. **The pale yellow dots read weakly over white cloud** and are small at world zoom: colour and size (2.4 px on a 4096 × 2048 sheet, about 0.2°) are provisional and want Chad's eye. Not seen with real positions (none exist); not checked zoomed in, at phone width, or with the counts sheet on underneath.
3. **Phones:** a 4096 × 2048 sheet is about 33 MB of picture memory; not measured on a phone; no smaller sheet for narrow screens yet.
4. **The 38 browser page suites (Playwright) were not run** (not installed in this container). They do not cover aircraft, but `index.html`, `app.js` and `style.css` changed.
5. **Mac `/bin/bash` 3.2 regression not run** (`run.sh` is unchanged, so its result should stand; say if you want it run anyway).
6. **Rounding at a cell edge:** a dot can sit up to 0.005° inside the neighbouring cell from the one its aircraft was counted in. Tested and stated; not hidden.
7. **Re-identification:** a rounded position at a known snapshot time can still be matched against other flight-tracking data by anyone who has it. Rounding and sorting remove identity from our file; they do not make a position anonymous against outside data. This is inherent in showing positions and is what was asked of OpenSky.
8. **On-ground aircraft are included** (as in the counts: 846 of 6,694 on 17 Nov). Martin set no exclusion; say if they should be left out.
9. **Cadence unchanged** (about every 144 minutes), so dots are up to 2 h 24 min old before the next snapshot, and are cleared at 3 h: one missed pull leaves the layer empty until the next. A faster cadence is Chad's separate decision.
10. **VPN case of the home check: still untested.**

## 7. If this goes to production later (rev 2; each step on Chad's own Approve line, in this order)
1. **Deploy hub 0.6.18** with `AIRCRAFT_POSITIONS` unset. Nothing new is published. Read back `/cells/opensky` and `/snapshot/opensky` with the collector installed today (mac-0.3.3): counts as before, `positions: "none"`, `no-store`.
2. **Install `collector-mac.mjs` mac-0.3.4** in `~/mother-earth` (preserve the old file; `run.sh` stays). Positions are uploaded and dropped by the hub: after the next scheduled run the ingest reply reads "not stored", and the read-backs are unchanged.
3. **Set `AIRCRAFT_POSITIONS=1`. This is the step that makes coordinates public through the API,** before any page change. After the next scheduled run: `/snapshot/opensky` has `record_fields` exactly lat,lng and `positions: "published"`; search the body for hex strings and callsign shapes; list R2 `snapshots/opensky/` to confirm the dated copy has no records.
4. REGISTER: positions in use.
5. Merge the page.
**Rollback, immediate:** remove `AIRCRAFT_POSITIONS` (the next request serves no coordinates), then `POST /admin/aircraft/clear-positions` (none left in storage). Later, if wanted: copy the preserved mac-0.3.3 collector back; revert the page merge; hub 0.6.17 is the previous version.

## 8. Questions for GPT
1. Is the field list in §2 what you expect the browser to receive, and is anything in the metadata keys a concern (`counts.on_ground` is a total, not per aircraft)?
2. Rounding to 0.01° and sorting by position: sufficient, or would you round more coarsely?
3. Hub before collector (§7): agreed as the order?
4. Three-hour clearing with a 144-minute cadence (§6.9): keep, or tie the clear time to the cadence?
