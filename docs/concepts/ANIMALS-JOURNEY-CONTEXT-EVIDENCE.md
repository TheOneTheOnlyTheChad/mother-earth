# Animals journey context: evidence record (Nature context Workstream C)

25 Nov 2026 04:31 UTC (clock reading) · **rev 1.3** (GPT's targeted extractor review of 25 Nov, `reviews/2026-11-25-animals-journey-context-extractor-gpt-review.md`, filed unchanged: H1 and H2 fixed, new §4c; §4a stop-rule wording; rev 1.2 folded in the evidence review) · Animals thread · for GPT · **nothing built; no extraction run; no tiles downloaded; corridor parked.**

Follows the proposal `docs/concepts/ANIMALS-JOURNEY-CONTEXT-PROPOSAL.md` rev 1 and GPT's review `reviews/2026-11-25-animals-journey-context-proposal-gpt-review.md` (filed unchanged). GPT's corrections A to E are folded in here and in the build brief `docs/concepts/ANIMALS-JOURNEY-CONTEXT-BUILD-BRIEF.md`. No separate proposal revision is made.

## 0. Decisions and scope (Chad, 25 Nov 2026, his own message)

- **Standing exception:** Chad's standing dated-data exception covers historical context beside a recorded journey. This is not a new approval, and it clears no product or method.
- **J-D2 C:** zebra Z3866 and the East Walker corridor only. No sea-card sentence.
- **J-D3 A:** fires and annual tree-cover loss, each subject to this evidence. Either may be deferred if it fails.
- **J-D4 A:** fixed 4° cells.
- **J-D5 B:** no present-day line or link.
- **J-D6 A:** MODIS standard processing for both.
- **Go:** the bounded evidence step, with the exact budget before a small zebra pilot. **No full corridor extraction.**
- **Chad, 25 Nov, after GPT's evidence review** (`reviews/2026-11-25-animals-journey-context-evidence-gpt-review.md`, filed unchanged):
  - accepts the six whole-file downloads (about 976.6 MB);
  - accepts the 30 % threshold, labelled as applying to tree cover in 2000;
  - accepts the collapsed monthly table;
  - asks for the full zebra extractor with GPT's corrections and offline controls, returned for GPT's targeted check **before he runs it or downloads the tiles**;
  - keeps the corridor parked.

Ownership is unchanged: soil carbon, the global alerts and the hub's forest wording stay with the Nature context thread. No hub change, schedule, new account or provider correspondence is part of this slice.

## 1. Region: frozen, exact

**Rule.** The region is the union of the 4° cells of the hub's grid (`cellBounds`, `phase1/worker.js`: rows from 90° S, columns from 180° W, 4° steps) that contain a **retained displayed fix** (zebra) or a **vertex of the shipped Medium-class geometry** (corridor). Cells are half-open, `[south, north) × [west, east)`, unique, and no intermediate cell is inferred between fixes. Withheld fixes and Low-class geometry are never used.

| | Source file (sha256) | Cells | Bounds (W, S, E, N) | Area (hub formula, R = 6371.0088 km) |
|---|---|---|---|---|
| Zebra Z3866 | `assets/animals/zebra-botswana-Z3866-R1.json` (`8d00aa32…1bb6`), 13,045 fixes | `17_50`, `17_51` | 20°E, 22°S, 28°E, 18°S | 185,861 + 185,861 = **371,722 km²** |
| East Walker | `assets/animals/mule-deer-east-walker-corridor-R1.json` (`1462eae8…ea40`), Medium class (extent 119.355–119.005° W, 38.151–38.497° N) | `32_15` | 120°W, 38°N, 116°W, 42°N | **151,515 km²** |

Claude reproduced these cells and areas, and they agree with GPT's independent figures. The builder freezes the cell set against the source file's hash and fails if either changes. **These are broad regions:** the zebra's is about 370,000 km², not the zebra's surroundings.

**One mask, no double counting.** Each FIRMS detection and each Hansen pixel is assigned by its own centre to exactly one cell, half-open. A point on the internal 24° E line between the zebra's two cells goes to the eastern cell (`17_51`) and stays inside the union. Only points on the union's outer north (18° S) or east (28° E) edge fall outside it. Hansen pixel centres sit **half a pixel** (0.000125° of a 0.00025° pixel) from every 4° line, so none falls on a boundary. FIRMS returns rows on the closed box, so every row is clipped to the half-open union before counting. The geometric rule and its tests are authoritative over this prose.

## 2. Time

- **Zebra.** Retained fixes run from **25 Oct 2007 08:01:53 UTC to 22 Oct 2008 23:00:45 UTC** (shipped file; agrees with GPT's check).
  - **Fires:** FIRMS gives `acq_date` (UTC) and `acq_time` (HHMM UTC). The builder keeps detections whose acquisition time falls in **[2007-10-25 08:01, 2008-10-22 23:00] UTC**, inclusive, in whole minutes. That is a disclosed rounding of under one minute at each end, not a whole-day extension. Requests cover whole UTC days, 25 Oct 2007 to 22 Oct 2008, which is 364 days. The two end months are labelled as part-months, **25–31 Oct 2007** and **1–22 Oct 2008**, never as whole Octobers.
  - **Tree-cover loss:** annual only. Shown as **"Mapped tree-cover loss in the calendar years 2007 and 2008; these years extend beyond the recorded journey."** It sits next to the value, not only in the closing sentence. The two products are never described as covering "the same period".
- **East Walker.** **"Corridor data years: 2017–2024."** The block gives regional calendar-year observations and never implies continuous tracking or seasonal dates.

## 3. FIRMS: what was read (Claude, 25 Nov 2026, browser pane; text only)

| Point | Finding | Where |
|---|---|---|
| Area request | `/api/area/csv/[MAP_KEY]/[SOURCE]/[west,south,east,north]/[DAY_RANGE]/[DATE]` returns DATE to DATE + DAY_RANGE − 1. **DAY_RANGE is 1 to 5.** The proposal's "up to 10 days" was wrong; GPT's correction stands | FIRMS Area API page, read 25 Nov |
| Source | `MODIS_SP` = "MODIS Standard Processing". The live layer's `VIIRS_NOAA20_NRT` is a different product | same |
| Collection | The FAQ says Collection 6.1 is the latest. **The rows themselves read `6.03`.** GPT read NASA GIBS's documented VERSION value map, which gives `6.03` = "Collection 6 Standard processing". Wording accepted: "MODIS Collection 6 standard processing; file version 6.03". `version` is stored as text, never as a number or as 6.1. Any other label in the full extraction is kept literally unless a documented mapping exists | FIRMS FAQ; GIBS Python usage page (GPT, 25 Nov) |
| Allowance | 5,000 transactions per 10 minutes per key (REGISTER, from the key's issue email, 30 Oct 2026). The live hub makes about 96 a day. The data-availability page says a request for ALL sensors costs 5 transactions. **The cost of one area request is not stated; the pilot measures it** | REGISTER; Data Availability page |
| Gap list | Fetched keyless from the page's own data call (`/api/missing_data/?action=fetch_data`, 24,691 bytes, sha256 `8b9c8d5d…82be`, 25 Nov 03:42 UTC). 171 standard-data rows. **No Terra or Aqua MODIS day is listed in the zebra's period.** In 2017–2024 it lists 28: Terra 11–22 Oct 2022 and Aqua 1–16 Apr 2022. The FAQ says it "will only show the days where there is no data for the satellite/sensor combination": it does not describe cloud. GPT's read found the table not loading; this read loaded the same data through the page's own call | Missing-data page and FAQ |
| What a detection is | The centre of a pixel flagged as containing one or more active fires. Usually vegetation fires, but volcanoes and gas flares occur. Cloud hides detections. The FAQ advises against estimating burned area from detections | FIRMS FAQ |
| Confidence | 0–100 for MODIS, with three classes; "should be used with caution as it is likely that it will vary in terms of meaning in different parts of the world" | FIRMS FAQ |
| Terms and credit | Already filed in REGISTER (LANCE acknowledgment, local-scale caveat, open use). The FAQ adds "NASA FIRMS" for captions. The journey block reuses the existing footer acknowledgement and adds "NASA FIRMS (MODIS)" beside the value | REGISTER; FAQ |

**Policy for the count (fixed before any data is seen):**
- Count **presumed vegetation-fire detections** (`type` 0), never fires: all confidence levels, Terra and Aqua together, inside the region and interval. A missing or unknown `type` stops the extraction (the schema is frozen); it never widens the count to all hotspots.
- **Confidence is not used as a filter.** The FAQ's caution is stated instead.
- **Other types** (1 volcano, 2 other static land source, 3 offshore) are counted separately in the context file, never in the shown count. The pilot showed the field is present.
- **Duplicates:** a row identical in every field counts once, and the number dropped is recorded. Two rows that share latitude, longitude, `acq_date`, `acq_time` and satellite but differ elsewhere are a **conflict**: the builder stops and reports it rather than keeping either. Windows never overlap.
- **Coverage states, kept apart:**
  - a failed request leaves the whole result incomplete;
  - a day in the gap list is a known database gap, and is named. With no days listed, the block says **"No dates are listed in the provider's missing-data table for this period"**, never that every observation was available. An unreadable or failed list is "coverage unknown", never an empty list;
  - cloud and unobserved days are an observation limit, always stated, never measured here.
- **Zero detections** is shown as "no detections in the record", never as "no fire". **A partial result is never shown as a total.**

## 4. Budget, before any request (predeclared)

**Where it runs.** Neither the workspace nor the Mac shell reaches FIRMS (Mac shell: no connection, 25 Nov). The browser pane does, but using it would mean typing the key. So FIRMS requests run **in Chad's Terminal**, from a script that reads the key from `KEYS.md` itself and never prints or writes it (`phase1/animals/journey_context_firms_pilot.py`). An offline test against a stand-in server confirmed it: the key was absent from everything printed or written, including when the stand-in echoed the key back.

**The pilot (zebra only).**
- At most **six HTTP requests**, one at a time, 3 s apart, 60 s timeout, **no retries**:
  1. key status;
  2. `MODIS_SP` data availability;
  3. area 25–29 Oct 2007;
  4. area 30 Oct – 3 Nov 2007;
  5. area 25–29 Oct 2007 again, to see whether the answer repeats;
  6. key status.
- The area requests use exactly the region's box, `20,-22,28,-18`.
- **Stops** before any area request if 1,000 or more transactions are already used in the current window, which leaves the live hub's allowance alone. Also stops at the first area request that fails or isn't MODIS CSV.
- Output goes to the private Mac folder `research/animals-journey-context/<stamp>-firms-pilot/`: raw CSVs and a manifest with no key, giving bytes, sha256, rows, acquisition dates, satellites, `version` values, timings, the transaction difference and whether the repeat matched. Nothing goes in the repository.
- **Measures:** the transaction cost per area request, whether `type` is present, `version` values, repeatability, timing.

**The full zebra extraction (build stage, not now): final budget in §4a.**

**The corridor (not authorised now):** 585 area requests for 2017–2024 over `-120,38,-116,42`. It gets its own budget line and Chad's go after the zebra build.

## 4a. The pilot's measured results (run by Chad in Terminal, 25 Nov 2026, 03:50:48 UTC)

Chad ran the pilot script unchanged (sha256 `91be1a2e…a027`) and pasted its six printed lines into the thread. Claude read the output folder through the Mac shell. The folder is private, Mac only: `research/animals-journey-context/20261125T035048Z-firms-pilot/`, with the manifest's sha256 `b948cb6e…d3`.

| # | Request | Status | Bytes | Time | Result |
|---|---|---|---|---|---|
| 1 | key status | 200 | 96 | 6.8 s | `current_transactions` 0, limit 5,000 per "10 minutes" |
| 2 | `MODIS_SP` availability | 200 | 56 | 1.2 s | `MODIS_SP,2000-11-01,2026-08-31`: the standard record covers the zebra's and the corridor's periods |
| 3 | area 25–29 Oct 2007 | 200 | 1,011 | 2.0 s | 11 detections, 25–26 Oct, Terra and Aqua |
| 4 | area 30 Oct – 3 Nov 2007 | 200 | 1,881 | 2.4 s | 22 detections, 31 Oct – 3 Nov |
| 5 | request 3 again | 200 | 1,011 | 1.1 s | **byte-identical to 3** (sha256 `25b73082…9071` both) |
| 6 | key status | 200 | 97 | 1.7 s | `current_transactions` 31 |

**What it settles:**
- **Header**, exactly: `latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type`. **The `type` field is present**, so the type-0 rule in §3 applies. All 33 pilot rows are `type` 0. The builder still counts other types separately if they appear.
- **`version` reads `6.03` on every row.** The FAQ says Collection 6.1 is current. The file's own value is recorded as found and shown as "MODIS Collection 6 standard processing, version 6.03 as given in the file", not as 6.1. **Open point for GPT:** whether to state the collection beyond the file's value.
- **`acq_time` is unpadded** (`919` = 09:19 UTC). The builder pads it to four digits before any comparison. A test covers it.
- **Files have no final newline.** Rows are counted by a CSV reader, never by line count: the shell's `wc -l` gave 10 and 21 where the CSV holds 11 and 22.
- **No duplicates**, and all 33 rows fall inside the half-open union. None falls before 08:01 on 25 Oct (the first is 23:53 that day), so the endpoint filter removed nothing here. The dedupe and clipping rules stay as written.
- **Confidence** ran 22–100 with day and night rows; no filter is applied (§3).
- **Repeatable:** the repeated request gave the same bytes.
- **Transactions:** 31 used across the six requests in that interval; the live hub may also have used the key then. The split between requests isn't published. Assigning all 31 to the three area requests gives an **observed average of about 10.3 per area request**. That is an upper estimate from this sample, not a proven maximum for future requests (GPT).
- **No key** appears in anything written. The manifest's "asked" fields read `[KEY]`; the only long hex strings in it are sha256 values.

**Final budget for the full zebra extraction (C1a, only after GPT and Chad's go):**
- 73 area requests, 25 Oct 2007 to 22 Oct 2008 in 5-day windows (the last 4 days), over exactly `20,-22,28,-18`, `MODIS_SP`.
- Plus one availability request, key-status reads before the first window and after windows 15, 30, 45, 60 and 73 (six reads), and one keyless request for the missing-data list. That is **80 requests to the keyed API and 1 keyless: 81 HTTP requests**.
- One at a time, 3 s apart, 60 s timeout, no automatic retries: **typically about 4–5 minutes**. Slow responses can make it longer; there is no promised maximum.
- **Transactions: estimated about 755** (73 × 10.3), against 5,000 per 10 minutes. This is an estimate, not a maximum. What actually limits the run is the stop rules below, which read the real count.
- **Stop rules** (enforced by the extractor; §4b): at any key-status read that is unreadable or not in the expected form; at any read showing 2,000 or more already used, which is a **sampled** stop rule: usage is read before the run and after windows 15, 30, 45, 60 and 73, so it is not a guarantee that 3,000 stay free at every moment between readings, and the script reserves nothing on the provider's shared key (GPT); at the first failed, oversized or invalid response. A stopped run is marked so and nothing is built from it.
- **Private cache:** about 73 CSVs. The pilot's 33 rows for 10 days took 2.9 KB, so the year is expected at well under 1 MB; the extraction stops if the cache passes 20 MB.
- Same key handling as the pilot.
- **The corridor is not included:** 585 requests, an estimated 6,000 transactions on the same sample, which would need spreading across several 10-minute windows. It gets its own budget line and go.

## 4b. The full zebra extractor (for GPT's targeted check; not run)

`phase1/animals/journey_context_firms_fetch.py`, run by Chad in Terminal like the pilot, after GPT's check and Chad's go. It uses the standard library only and the same key handling: the key is read from `KEYS.md` by the script and never printed, logged or written. GPT's five corrections:

1. **Fails closed on status.** Every key-status read must be HTTP 200 JSON with `transaction_limit` exactly 5000, a non-negative integer `current_transactions` and `transaction_interval` "10 minutes", or the run stops. It also stops at 2,000 or more used. Status is read before any availability or area request, after windows 15, 30, 45 and 60, and after the last window. A drop between readings is recorded as an accounting-window reset; no negative figure is computed. Availability must name `MODIS_SP` with dates covering 25 Oct 2007 to 22 Oct 2008, or the run stops before any area request.
2. **Bytes bounded while reading.** Each response is read in 64 KB chunks: at most 2 MB for a data response, 64 KB for an error body, and 20 MB for the whole run counting the response being read. Data goes to a `.part` file, renamed only after every check. Leftover partial files are renamed `.incomplete`.
3. **Strict CSV.** Strict UTF-8; the exact 15-field MODIS header; every row parsed. Checks: coordinates inside the requested box; `acq_date` a real date inside the window; `acq_time` 1–4 digits, padded and then checked as HHMM (so `2460` fails); satellite Terra or Aqua; instrument MODIS; confidence 0–100; `version` a version label stored as text; `type` 0–3; day/night D or N; the five numeric fields numeric. Header-only CSV is a valid zero; anything else (HTML, a plausible prefix, a short row) stops the run.
4. **Provenance equals stored bytes.** The sha256 is of exactly the bytes stored. A response that would be stored and contains the key is not stored at all, and the run stops with a redacted record. Key-status bodies are never stored, only their parsed numbers.
5. **Explicit end.** The manifest is written on every exit with state `complete`, `stopped` or `invalid` and the reason. `complete` requires every planned window stored in order, every file matching its hash, the final status read, and exactly 81 requests. Only `complete` prints `COMPLETE` and exits 0; anything else prints the state and "do not build from it" and exits 1.

**The missing-data list** is fetched by the extractor itself (keyless) and stored with its hash, so the builder has frozen provenance from the run. Parsing is strict: table rows of exactly four cells, and at least one standard-data row. An unreadable list stops the run; it is never treated as an empty list. Claude checked this against the live list in the pane on 25 Nov: 171 rows, all with four cells, sha256 `8b9c8d5d…82be`, unchanged since the morning.

**Verifier for the builder:** `phase1/animals/journey_context_verify.py`. It makes no network call. It refuses a manifest that isn't `complete`, a window missing or out of order against the plan, any stored file absent or not matching its hash, missing availability or gap-list provenance, leftover partial files, and a request count other than planned. The builder calls it before reading anything.

**Offline controls:** `python3 -I phase1/animals/journey_context_firms_fetch.test.py`, **39 passed, 0 failed** (Claude, cloud workspace, 25 Nov). Each case runs the real extractor against a local stand-in server, with a fake key and the test caps. The fake key was absent from everything printed or written in every case. Cases:
- **the plan:** 73 windows and 81 requests;
- **test-only caps:** ignored without the test host;
- **complete runs:** a full run, all header-only, and an accounting-window reset;
- **status:** HTTP 500, non-JSON, a missing field, the wrong limit, a non-integer count, already busy, and an unreadable final read (73 windows stored but not complete);
- **availability:** short coverage;
- **gap list:** unreadable, and no rows;
- **area responses:** HTML with a plausible prefix, time `2460`, the wrong header, a date outside the window, a wrong satellite, outside the box, a short row, an echoed key, an oversize response, the run's cache cap, a small HTTP 500, an oversize error body, a dropped connection;
- **no key row:** nothing requested or written;
- **verifier:** refuses an altered file, a missing file, a missing gap list, a manifest not complete, missing gap provenance, a missing window, and a leftover partial file.

Two defects were found and fixed while writing these controls. A gap-list body with no table rows was first accepted as an empty list; it now stops the run. A key echoed inside a status body first stopped the run although status bodies are never stored; that check now applies only to stored responses. The real status response did not contain the key in the pilot.

## 4c. GPT's targeted hold, H1 and H2, and the fixes (25 Nov)

GPT reran the 39 offline controls on the Mac (39 passed) and reproduced two faults without any network use. Both are fixed on the same branch. No pilot was repeated, and no proposal revision was made.

**H1: the missing-data list could silently lose a real gap.** The row pattern skipped a `<tr>` with attributes, so GPT's reproduction listed no gap where 1 Mar 2008 should appear. `2008-02-31` was also accepted as a date.
- **Fix:** the list is now read with the standard library's HTML parser (`parse_gap_list`, a pure function). It accepts attributes on `<tr>` and `<td>`. It refuses any other markup, a cell outside a row, nesting, unclosed rows and rows without exactly four cells. Every date must be a real calendar date. Satellite labels must be among those the live list uses (Terra, Aqua, Suomi NPP, NOAA-20, NOAA-21 with their sensor). An unrecognised label stops the run rather than becoming "no MODIS gaps". Availability is read the same way (`parse_availability`, real dates required).
- **Checked against the live list** in the pane on 25 Nov: the response (24,691 bytes, sha256 `8b9c8d5d…82be`, unchanged since the morning) is kept as a test fixture. It parses to 171 standard rows, with no Terra or Aqua MODIS date listed in the zebra's interval. The count of 171 is not pinned as a substitute for parsing.

**H2: the verifier did not bind a folder to the planned extraction.** GPT changed only the manifest's area, and then only its source, and the verifier still accepted the folder.
- **Fix:** `journey_context_verify.py` now holds its own fixed expectations: `MODIS_SP`, `20,-22,28,-18`, 25 Oct 2007 to 22 Oct 2008, 73 windows, 81 requests. It does not read them from the extractor. It also holds the approved extractor's sha256 (`APPROVED_EXTRACTOR_SHA256`); the suite fails if that differs from the extractor file. It checks:
  - every window's index, start, duration and file name against its own plan;
  - file names as plain names inside the folder;
  - each file's hash, and re-runs the extractor's row checks on each, comparing the row count;
  - 81 requests, all HTTP 200;
  - the six key-status readings in planned order, each a valid reading below 2,000, the last after window 73;
  - the saved availability and missing-data files re-parsed with the extractor's own pure parsers, with their summaries required to equal the manifest's exactly.
- A malformed manifest shape gives a clear NOT USABLE, not a traceback. It establishes reproducible provenance only: the builder still parses, clips, deduplicates and checks aggregates.

**Evidence** (Claude, cloud workspace, 25 Nov):
- `python3 -I phase1/animals/journey_context_firms_fetch.test.py`: **72 passed, 0 failed** (`reviews/evidence/2026-11-25-animals-journey-context/firms-fetch-offline-controls-h1h2.log`).
- **New H1 controls:**
  - GPT's attributed row, through the whole extractor and directly;
  - attributes on `<td>`;
  - a valid list with no gap in the interval, which still completes;
  - `2008-02-31`;
  - an unknown label;
  - nested markup, a three-cell row, an unclosed row;
  - an impossible availability date;
  - the live-list fixture.
- **New H2 controls**, each refused:
  - the area and source changes;
  - another first day;
  - a wrong or missing extractor identity;
  - a missing final status reading, or one at 2,500 or with a text count;
  - a request recorded as HTTP 500;
  - a window file named `../x.csv`, a changed row count, a window record that isn't an object;
  - a changed availability summary, a removed gap day and an extra gap field (each with the file unchanged);
  - a manifest that is a list, `windows` null, readings of the wrong shape.

  The untouched run gives USABLE from the command line.
- **Old against new** (`h1h2-old-vs-new.log`), running GPT's reproductions on `e76d4de` and on the fix:

| Case | Old | New |
|---|---|---|
| attributed row | accepted, listing `[]` | lists `['2008-03-01']` |
| `2008-02-31` | accepted and listed | stops |
| area `0,0,4,4` | verifier returns `[]` | refused |
| source `VIIRS_SNPP_SP` | verifier returns `[]` | refused |

  The full new suite stops at its first check on the old verifier, which has no extractor pin.

## 5. Hansen / UMD Global Forest Change: what was read and measured

| Point | Finding |
|---|---|
| Release | **v1.13, "Global Forest Change 2000-2025"** (download page read in the pane, 25 Nov; page DOM sha256 `e15c93c1…9c4c`). Pin v1.13 with each tile's Last-Modified and the store's MD5/CRC32C (recorded below); the builder adds sha256 on download |
| Licence and credit | CC BY 4.0. Credit when displayed: "Source: Hansen/UMD/Google/USGS/NASA". Citation: Hansen et al. 2013, *Science* 342: 850–53, with the GLAD link. A REGISTER entry is needed before release |
| Meaning | `lossyear` is gross forest cover loss: "a stand-replacement disturbance, or a change from a forest to non-forest state". Not deforestation, not net loss, not a fire cause. `treecover2000` is canopy closure in **2000** for vegetation taller than 5 m. A threshold applies to 2000, not to 2007 or 2017 |
| Authors' cautions | The data are "a relative indicator"; "definitive area estimation should not be made using pixels counts from the forest loss layers". **Years before 2011 have not been reprocessed** (2011 onward is), and integrated use across them "should be performed with caution". So the zebra's 2007–08 values come from the older method and the corridor's 2017–24 from the newer: **never compared, no trend** |
| Encoding (measured from the files, not the prose) | Each tile is classic TIFF, 40,000 × 40,000 pixels, unsigned 8-bit, LZW, one strip per row. Pixel size 0.00025° (ModelPixelScale), corner at 20° E, 10° S (tiepoint, tile `10S_020E`), the same for all three layers. **`lossyear` values in sampled zebra rows run 0–25.** The page's prose says "1-20" but describes years 2001–2025, so the data rules: 7 = 2007, 8 = 2008, 17–24 = 2017–2024. `treecover2000` sampled 0–54 %. `datamask` sampled 1 and 2; per the page, 0 = no data, 1 = mapped land, 2 = persistent water. Four rows per layer were decoded in the pane (lat 18.5–19.9° S, lon 20–28° E) |
| Area | Pixel area is computed per row from the raster's own georeferencing on the WGS84 ellipsoid, never as an assumed 30 × 30 m. Results are labelled **"approximate mapped loss area"** with the authors' caution |
| Missingness | Kept separately: mapped land (`datamask` 1), water (2) and no data (0), each as an area in the region. No-data area is reported, never treated as zero loss |

**Tiles and sizes (HEAD requests only, 25 Nov 03:43 UTC; nothing downloaded):**

| Tile | `lossyear` | `treecover2000` | `datamask` | Used by |
|---|---|---|---|---|
| `10S_020E` | 77.5 MB (md5 `4eVKa2ut…`) | 644.7 MB (`yAZuhwre…`) | 15.4 MB (`31HG1wCL…`) | zebra (rows 18–20° S) |
| `20S_020E` | 16.6 MB (`NsZ6wifl…`) | 208.2 MB (`pTFf7Smo…`) | 14.2 MB (`vqDhzJfp…`) | zebra (rows 20–22° S) |
| `40N_120W` | 28.1 MB | 162.4 MB | 18.4 MB | corridor (38–40° N), later |
| `50N_120W` | 57.1 MB | 426.2 MB | 15.4 MB | corridor (40–42° N), later |

**Download plan:**
- **Zebra:** six whole files (two tiles × three layers), **976.6 MB** (accepted by Chad, 25 Nov), downloaded once by Chad in his browser to Downloads, checked against the store's MD5 and hashed with sha256, then moved to a private Mac folder. Never committed or served.
- **Corridor:** **707.6 MB**, later, under its own go.
- **Why whole tiles:** each row is its own strip, so the builder could read only the rows it needs. But only the browser pane reaches the store, and whole files are the simpler route to verify and repeat. GPT may prefer row reads.

## 6. What the evidence changes in the design

- **Heading:** "Historical regional land context", as GPT suggested, on both cards.
- **Products:** fires and tree-cover loss both pass the evidence so far.
- *(Superseded by §4a: the pilot has run.)*
- **Tree-cover loss carries strong caveats:** relative indicator, older method for 2007–08, approximate area, threshold applied to 2000. In the zebra's region, sampled canopy peaks at 54 %. So loss at a 30 % threshold may be very small or zero there, and the block must say what zero means.
- **Threshold: 30 %** of tree cover in 2000, labelled beside the value (accepted by Chad, 25 Nov). It is a selection threshold, not a habitat definition. It is never changed after seeing the result.

## 7. Open, for GPT (rev 1.3)

1. GPT's recheck of H1 and H2 (§4c) against the replacement hashes.
2. After that and Chad's go: Chad runs the extractor in Terminal and downloads the six Hansen files; then the C1a build on a branch. The corridor stays parked.
