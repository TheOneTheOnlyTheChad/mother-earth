# Animals journey context: evidence record (Nature context Workstream C)

25 Nov 2026 03:48 UTC (clock reading) · rev 1 · Animals thread · for GPT · **evidence step only: nothing is built. The FIRMS pilot (§4) waits for Chad's Terminal run. No large download made; no corridor extraction.**

Follows the proposal `docs/concepts/ANIMALS-JOURNEY-CONTEXT-PROPOSAL.md` rev 1 and GPT's review `reviews/2026-11-25-animals-journey-context-proposal-gpt-review.md` (filed unchanged). GPT's corrections A to E are folded in here and in the build brief `docs/concepts/ANIMALS-JOURNEY-CONTEXT-BUILD-BRIEF.md`. No separate proposal revision is made.

## 0. Decisions and scope (Chad, 25 Nov 2026, his own message)

- **Standing exception:** Chad's standing dated-data exception covers historical context beside a recorded journey. This is not a new approval, and it clears no product or method.
- **J-D2 C:** zebra Z3866 and the East Walker corridor only. No sea-card sentence.
- **J-D3 A:** fires and annual tree-cover loss, each subject to this evidence. Either may be deferred if it fails.
- **J-D4 A:** fixed 4° cells.
- **J-D5 B:** no present-day line or link.
- **J-D6 A:** MODIS standard processing for both.
- **Go:** the bounded evidence step, with the exact budget before a small zebra pilot. **No full corridor extraction.**

Ownership is unchanged: soil carbon, the global alerts and the hub's forest wording stay with the Nature context thread. No hub change, schedule, new account or provider correspondence is part of this slice.

## 1. Region: frozen, exact

**Rule.** The region is the union of the 4° cells of the hub's grid (`cellBounds`, `phase1/worker.js`: rows from 90° S, columns from 180° W, 4° steps) that contain a **retained displayed fix** (zebra) or a **vertex of the shipped Medium-class geometry** (corridor). Cells are half-open, `[south, north) × [west, east)`, unique, and no intermediate cell is inferred between fixes. Withheld fixes and Low-class geometry are never used.

| | Source file (sha256) | Cells | Bounds (W, S, E, N) | Area (hub formula, R = 6371.0088 km) |
|---|---|---|---|---|
| Zebra Z3866 | `assets/animals/zebra-botswana-Z3866-R1.json` (`8d00aa32…1bb6`), 13,045 fixes | `17_50`, `17_51` | 20°E, 22°S, 28°E, 18°S | 185,861 + 185,861 = **371,722 km²** |
| East Walker | `assets/animals/mule-deer-east-walker-corridor-R1.json` (`1462eae8…ea40`), Medium class (extent 119.355–119.005° W, 38.151–38.497° N) | `32_15` | 120°W, 38°N, 116°W, 42°N | **151,515 km²** |

Claude reproduced these cells and areas, and they agree with GPT's independent figures. The builder freezes the cell set against the source file's hash and fails if either changes. **These are broad regions:** the zebra's is about 370,000 km², not the zebra's surroundings.

**One mask, no double counting.** Each FIRMS detection and each Hansen pixel is assigned by its own centre to at most one cell. Hansen pixel centres sit at a quarter-pixel offset (0.000125°) from every 4° line, so none falls on a boundary. A FIRMS detection that falls exactly on a cell's north or east edge belongs to the next cell, so it is outside the union. A provider request may cover a box larger than the union, so every row is clipped to the union before counting.

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
| Collection | "Collection 6.1 has been available since April 2021 and is the latest collection available." The `version` field of each row is kept and reported | FIRMS FAQ |
| Allowance | 5,000 transactions per 10 minutes per key (REGISTER, from the key's issue email, 30 Oct 2026). The live hub makes about 96 a day. The data-availability page says a request for ALL sensors costs 5 transactions. **The cost of one area request is not stated; the pilot measures it** | REGISTER; Data Availability page |
| Gap list | Fetched keyless from the page's own data call (`/api/missing_data/?action=fetch_data`, 24,691 bytes, sha256 `8b9c8d5d…82be`, 25 Nov 03:42 UTC). 171 standard-data rows. **No Terra or Aqua MODIS day is listed in the zebra's period.** In 2017–2024 it lists 28: Terra 11–22 Oct 2022 and Aqua 1–16 Apr 2022. The FAQ says it "will only show the days where there is no data for the satellite/sensor combination": it does not describe cloud. GPT's read found the table not loading; this read loaded the same data through the page's own call | Missing-data page and FAQ |
| What a detection is | The centre of a pixel flagged as containing one or more active fires. Usually vegetation fires, but volcanoes and gas flares occur. Cloud hides detections. The FAQ advises against estimating burned area from detections | FIRMS FAQ |
| Confidence | 0–100 for MODIS, with three classes; "should be used with caution as it is likely that it will vary in terms of meaning in different parts of the world" | FIRMS FAQ |
| Terms and credit | Already filed in REGISTER (LANCE acknowledgment, local-scale caveat, open use). The FAQ adds "NASA FIRMS" for captions. The journey block reuses the existing footer acknowledgement and adds "NASA FIRMS (MODIS)" beside the value | REGISTER; FAQ |

**Policy for the count (fixed before any data is seen):**
- Count **detections, never fires**: all rows inside the region and interval, Terra and Aqua together.
- **Confidence is not used as a filter.** The FAQ's caution is stated instead.
- **Volcano and other non-vegetation rows:** if the standard rows carry a `type` field, only `type 0` (presumed vegetation fire) is counted, and the excluded rows are counted by type in the file. If the field is absent, all rows are counted and the block says so. The pilot shows which.
- **Duplicates:** a row identical on latitude, longitude, `acq_date`, `acq_time` and satellite counts once; the number dropped is recorded. Windows never overlap.
- **Coverage states, kept apart:**
  - a failed request leaves the whole result incomplete;
  - a day in the gap list is a known database gap, and is named;
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

**The full zebra extraction (build stage, not now):** 73 area requests (364 days ÷ 5, the last one 4 days) plus 3 status and availability requests = **76 HTTP requests**, about 4 minutes at 3 s apart. Ceiling: stop at the first failure, or when the pilot-measured cost times the requests done would pass 500 transactions. Private cache: 73 CSVs, expected to be small (the pilot sets the expected size).

**The corridor (not authorised now):** 585 area requests for 2017–2024 over `-120,38,-116,42`. It gets its own budget line and Chad's go after the zebra build.

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
- **Zebra:** six whole tiles, **976.6 MB**, downloaded once by Chad in his browser to Downloads, checked against the store's MD5 and hashed with sha256, then moved to a private Mac folder. Never committed or served.
- **Corridor:** **707.6 MB**, later, under its own go.
- **Why whole tiles:** each row is its own strip, so the builder could read only the rows it needs. But only the browser pane reaches the store, and whole files are the simpler route to verify and repeat. GPT may prefer row reads.

## 6. What the evidence changes in the design

- **Heading:** "Historical regional land context", as GPT suggested, on both cards.
- **Products:** fires and tree-cover loss both pass the evidence so far.
- **Fires still depend on the pilot:** the cost per request, whether `type` is present, and whether the answer repeats.
- **Tree-cover loss carries strong caveats:** relative indicator, older method for 2007–08, approximate area, threshold applied to 2000. In the zebra's region, sampled canopy peaks at 54 %. So loss at a 30 % threshold may be very small or zero there, and the block must say what zero means.
- **Threshold:** proposed **30 %** (the common GFW default), stated beside the value. A different threshold is a decision for Chad after GPT.

## 7. Open, for GPT

1. The pilot itself (§4): its result goes back to GPT with the build brief's final budget.
2. Whole-tile download versus row reads (§5).
3. The 30 % canopy threshold.
4. Whether to show per-month fire counts for the zebra, or only the interval total with the part-months named. The brief proposes the total plus a 13-row month table: two part-months and eleven whole months.
