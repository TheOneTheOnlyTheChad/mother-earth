# Nature context — Stage 0 research notes (24 Nov 2026)

Evidence for `docs/concepts/NATURE-CONTEXT-PROPOSAL.md`. Spec: `docs/concepts/NATURE-CONTEXT-SPEC-GPT-rev1.md` (GPT, rev 1, 23 Nov 2026; sha256 `68a0fc4f…3ce7`). Work done on Chad's "go" for Stage 0 (24 Nov 2026): reads only. No provider contact, account, key, request beyond reading public pages, hub change or page change.

**How each item was read** (said plainly, per the standing rule):
- **Read in full, as returned by the source:** GFW Data API JSON for `gfw_integrated_alerts` (dataset metadata, all `cautions`, `fields` of `v20261123`, version record), the dataset records for `gfw_integrated_dist_alerts`, `umd_glad_dist_alerts`, `nasa_viirs_fire_alerts`, `nasa_modis_fire_alerts` (metadata fields, first 1,200–3,500 characters of their overviews), the Zenodo record 22137130 (API metadata, `license_and_attribution.md` and `readme_data.md` in full). All through `fetch` in the browser pane, 24 Nov 2026 about 07:00 UTC.
- **Read through a summarising fetch, not line by line:** the WRI article "Soils Emit Massive Amounts of Greenhouse Gases…", the Frontiers paper Glen et al. 2026 (characters 0–200,000 of 208,069; the last 8,069, mostly references, not read), the EarthRanger support page, the Horizon page. Every figure taken from these is marked "(summary)" below.
- **Live hub:** read from a hub tab in the browser pane, hub 0.6.24, 07:06:32 and 07:09:52 UTC.
- **Not checked:** the WRI mineral-soil stock-change data (ESSD 2026, doi 10.5194/essd-18-989-2026); the Isik and Hengl organic-soil probability record (doi 10.5281/zenodo.20121128) beyond what the Glen release says about it; any soil-stock product (SoilGrids or other); the `data_dictionary.csv` and `state_codes.csv` files of the Zenodo record; the GFW Data API's published rate limits; the newsletter that prompted the spec; the WRI webinar page; the GNW news release.

## 1. Integrated deforestation alerts — what the field means

Source: `https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts` and `/v20261123/fields`.

- **`gfw_integrated_alerts__date` is the earliest detection date, not a publication date.** The `fields` record gives no description for it; the dataset `cautions` say each pixel "preserves the earliest date of detection from any alerting system" (under 15 words quoted). Our query `WHERE gfw_integrated_alerts__date >= since` therefore counts pixels **first detected on or after `since`**, at the confidence they hold in that day's version.
- **No publication, update or confidence-change time is supplied.** Of the 81 fields, the alert ones are `__date`, `__confidence`, `__date_conf` (packed date + confidence), `__intensity`, and the same for each source system. Nothing records when a pixel appeared in the data or changed confidence. So a confidence-change time cannot be shown and must not be made from our retrieval time (spec §5 is satisfied by saying "not supplied").
- **Confidence values:** `values_table` 2 = nominal, 3 = high, 4 = highest; default `not_detected`. **There is no "low" value in the integrated layer**, so the 1 Nov how-to wording (low/nominal/high) does not apply to this dataset. Our three labels are exactly the documented set.
- **Confidence moves, and pixels are removed.** Per `cautions`: GLAD-L and GLAD-S2 alerts that are not high confidence within 180 days are removed; RADD removes low-confidence alerts after 90 days; confidence "may change retroactively". A pixel removed can be alerted again. This matches the hub's `coverage_note`.
- **Highest confidence is only possible where two or more systems run.** GLAD-S2 runs only in South America's primary humid forest; RADD in primary humid forest of South America, sub-Saharan Africa and Southeast Asia; GLAD-L across 30°N–30°S within the 2000 tree-cover mask. A cell with no highest-confidence pixels may simply have one system.
- **Versions are immutable daily snapshots.** 52 versions on record; latest `v20261123`, `is_mutable: false`, `content_date` 2026-11-23, `content_date_range` 2014-12-31 to 2026-11-23. Each query names its version (`version` per cell in our state).
- **Cautions that bear on wording:** not human-caused vs other; potential deforestation; not for trend or area; recent alerts include false positives; methods, system count and cloud vary over time.

**Consequence.** The page's "published in the last 7 days", the hub `quantity` string and REGISTER's "Consequences for the page" line describe the window wrongly. The accurate statement is "first detected on or after <since> (alert date), as held in version <vYYYYMMDD>". The REGISTER sample (1 Nov) already used `__date ≥ 25 Oct`; only the wording drifted.

## 2. The window is per cell and is not exactly 7 days

From `/cells/forest` (hub 0.6.24) at 07:06–07:09 UTC:
- `source_status` ok; envelope `retrieved_at` 06:42:30.712 UTC; `window_start` 2026-11-17, `window_end` 2026-11-24 (the run's own values).
- 559 of 559 cells answered; 0 pending; oldest cell query 2026-11-21 11:12 UTC, newest 2026-11-24 06:42 UTC; versions in use v20261121 (9 cells), v20261122 (294), v20261123 (256).
- **Per-cell `since` values: 2026-11-14 (2 cells), 11-15 (181), 11-16 (292), 11-17 (84).** A cell's window runs from its `since` to its version's content date; a cell retried after a timeout keeps its first `since` (`pending_since`), so its window is longer than 7 days. Example: cell `21_29` (6°S–2°S, 64°W–60°W) has `since` 2026-11-16, `queried_at` 2026-11-23 09:42 UTC, version v20261123 → alerts first detected 16–23 Nov inclusive (8 calendar days), 199,592 pixels (nominal 198,963 · high 95 · highest 534).
- The page row says "published in the 7 days from <since>": both "published" and "7 days" are wrong for some cells.
- **Staleness is judged on the envelope, not the cell.** The envelope is 25 min old while some cells were queried three days ago. Spec §4 and acceptance 2 ask that retrieval time cannot disguise stale observations; today the page shows each cell's `queried_at`, which is the honest part, but the `stale` marker never fires for an old cell.
- **266 of 559 cells read 0.** Example `15_49` (30°S–26°S, 16°E–20°E, Northern Cape/Namibia), version v20261122, `since` 2026-11-15. A zero is a valid answer from the source for that cell and window; it says no pixel in the systems' masks was first detected in the window. Mostly-treeless cells within 30°N–30°S produce it.

## 3. Place view on the live hub

- `/place/g4/21_29`: forest `state: ok` with the cell above, `coverage.grade` partial; fires `no_records` (FIRMS window 24 Nov 00:00 UTC to 07:00:45 UTC; the page says this is "not 'no fires'"); forest collection: 12 queries of this cell retained, 2 Nov to 23 Nov. Statement: "Listed together because they share this 4° cell. Nothing here states a connection between them."
- `/place/g4/14_49` (Cape Town's cell, 34°S–30°S, 16°E–20°E): forest `not_covered`, "outside the swept tropical land cells (alert systems run between 30°N and 30°S only)".
- `/place/g4/10_45`: forest `not_covered`.

## 4. Fires — GNW's fire alerts are FIRMS

- `nasa_viirs_fire_alerts` on the GFW Data API: title "VIIRS active fires", product **VNP14IMGT**, licence text is NASA's FIRMS acknowledgment and data use policy; the overview says the data come from NASA FIRMS. **The same lineage as our FIRMS layer** (`firms`, VIIRS 375 m).
- **Its latest API versions are `v20250424`, `v20250425`.** The API copy stopped in April 2025 (GNW's own map may use another path; not checked).
- `nasa_modis_fire_alerts`: versions end `v2019`, `v2020`.
- EarthRanger's integration also pulls a fire alert type from GNW (summary). That does not change the lineage.
- **Consequence:** no GNW fire ingestion. It would duplicate FIRMS detections (not independent corroboration) and the API copy is 19 months old. The rule against double counting is simply: one fire source, FIRMS.

## 5. A newer GNW product: global integrated disturbance alerts

- `gfw_integrated_dist_alerts` — "Global integrated disturbance alerts", "daily, 10 m, global, UMD/GLAD and WUR", CC BY 4.0; created 2025-10-15; 23 versions, latest `v20261123`. Four systems: DIST-ALERT (global, from NASA OPERA HLS), GLAD-L, GLAD-S2, RADD.
- Alerts from several systems within 180 days of each other are one event and keep the earliest date. Confidence uses the same 2/3/4 values. Cautions: vegetation, forest or tree-cover disturbance, not cause; not for trend or area; alert counts can jump after a cloudy period.
- `umd_glad_dist_alerts` — DIST-ALERT alone, 30 m, global, weekly on GNW; low confidence 2–3 observations, high 4+ (summary of overview).
- **Why it matters:** this is the "more land ecosystems" expansion in the GNW release, and it would make cells outside 30°N–30°S answerable, including Cape Town's. **Not assessed:** query time per cell for a global geometry, whether the API answers inside our 30 s limit, cell count and sweep length, and wording. Switching or adding it is a hub change and is not proposed for the first slice.

## 6. Soil carbon — candidate products

**C1. Glen et al. (2026) model outputs, Zenodo record 22137130, version 1.0.1, published 2026-10-21. CC BY 4.0** (`license_and_attribution.md`, read in full). Model code GPL-3.0-only (separate repository).
- What it is: **modelled emissions from disturbed organic soils** (drained, burned, or both), CO₂ + CH₄ + N₂O as CO₂e with AR6 100-year GWPs (27 biogenic CH₄, 273 N₂O); IPCC 2013 Wetlands Supplement Tier 1 factors. The spec's third concept (§6 table).
- Periods: five averages, 2001–2005, 2006–2010, 2011–2015, 2016–2020, 2021–2024 (four years). Values are already annual: "do not divide them by period length again".
- Files: `organic_soil_emissions_1km_v1_0_1.zip` (212,800,018 B; ten COGs, drainage and fire per period, Mg CO₂e per 1 km cell per year); `organic_soil_cover_percent_1km.tif` (108,618,168 B; one static map, 2021–2024 source mask); tables (842,116 B zip; country and global summaries, detailed results CSV/Parquet); data dictionary, state codes, manifest, citation. Grid: Float32, WGS84 cylindrical equal area (+proj=cea +lat_ts=30), 1,000 m cells, 34,736 × 14,686.
- 30 m outputs and the probability inputs: by request to the author, not on Zenodo ("being prepared"). Not needed: a 4° cell is about 167,000–200,000 km², so the 1 km map is far finer than any cell we would show.
- **Missing is not zero:** blank, null or NoData "should not be treated as modeled zeros". Where the IPCC gives no Tier 1 default (tropical undrained fire, some coastal fluxes) the model assigns zero, which "does not demonstrate an absence of real world flux". So a zero is ambiguous in two ways; a cell sum must carry both cautions.
- Aggregating to a 4° cell: emissions are summable (sum the 1 km cells; do not average rows, do not sum per-hectare rates). Equal-area grid makes cell sums straightforward; cells cross the 4° boundaries, so a cell value needs either an overlap weight or a stated nearest-cell rule.
- Limits (readme, read in full): extent and threshold drive results; drainage inferred from proxies, 500 m distance; several layers static; no rewetting or restoration; MODIS burned area misses small or smouldering fires; Tier 1 factors are long-term averages; does not replace national inventories.
- Paper (summary): about 2.6 Gt CO₂e per year baseline, roughly three-quarters drainage and one-quarter fire; sensitivity tests only, not a probabilistic uncertainty; the 2021–2024 scenario envelope about 0.7–4.5 Gt CO₂e; authors call it a monitoring estimate, not a definitive total.

**C2. Mineral-soil organic carbon change, topsoil 0–30 cm** (ESSD 2026, doi 10.5194/essd-18-989-2026; cited by the WRI article, summary). Stock change, not emissions. **Not opened.**

**C3. A soil organic-carbon stock product** (the spec's first concept). **None identified or opened in this stage.**

**WRI article (summary):** authors Gibbs, Glen, Harris, Scafidi, Isik; total soil emissions about 3.9 Gt CO₂e per year (2016–2024), about two-thirds from organic soils; mineral soils estimated from topsoil stock change. The headline is a global modelled total and is not a local measurement (spec §6 agrees).

## 7. EarthRanger and Horizon

- **EarthRanger (summary):** Gundi polls GNW for an area; creates events once and never updates them; the lookback is keyed to the alert's original detection date (deforestation 1–30 days); minimum confidence is set per type (deforestation defaults to highest); reaching highest can take weeks, so an alert first detected before the window and confirmed later is never sent. **Our collector is different:** it does not create events; every query re-reads the current state of all pixels first detected in its window, so an upgrade inside the window is counted at its new confidence on the next query of that cell; an upgrade of a pixel first detected before `since` is not counted, and a removed pixel disappears. That is the same blind spot for anything older than the window, which our wording must state; it is not a defect while we only claim "first detected in this window, as held in version X".
- **Horizon (summary):** in preview and called experimental; AI answers over GNW and Land & Carbon Lab data; interoperability "coming soon"; warns that AI summaries can be incomplete or incorrect. No API to depend on.

## 8. Shared-file and suite inventory (repo at `2ed3f58`)

- Place view code: `index.html` (`openPlace`, `loadPlace`), `app.js` (`ME.placeRows`, `ME.PLACE_NONE`). Hub: `phase1/worker.js` `placeSection`, `placeCollection`, `place`.
- Suites that exercise the place view: `place-rows.test.mjs`, `place-ui.test.cjs`, `fire-status-ui`, `osmc-reliability-ui`, `ships-retain-ui`, `cell-perf-ui`, `smoke-fixes`, and the hub suites `history-hub`, `firms-v2`, `osmc-reliability-hub`, `ships-retain-hub`.
- Forest wording appears in `index.html` (card), `app.js` (place row, report line), `sources.html`, `phase1/worker.js` (`quantity`), `REGISTER.md`.
- `app.js` and `index.html` are shared page files: `animals-tab-ui` holds them to main at `BASE_MAIN` `0e620831…f195` (check 13b for `index.html`; the `same` list for `app.js`, `layers.js` and others). Any change to either fails those checks until the Animals owner moves `BASE_MAIN` after a reviewed page commit; never move it to hide an unrelated change.
- Forest sweep cadence: cron `11,41 * * * *` (two runs an hour), `FOREST_PER_RUN` 6, so 559 cells take about 47 hours with no retries; today's oldest cell query was 67.9 hours old.

## Amendment, 24 Nov 2026 (after GPT's Stage 0 review, `reviews/2026-11-24-nature-context-stage0-gpt-review.md`)
The notes above are kept as written. Three readings are corrected here:
- **§3 "12 queries of this cell retained"** is the hub's label. `forest_daily` has `PRIMARY KEY (cell_id, date)` and the collector writes `INSERT OR REPLACE`, so the number is retained daily snapshots (at most one per cell per UTC day), not every query.
- **§4 "The API copy stopped in April 2025"** means only that the latest versions of `nasa_viirs_fire_alerts` on the Data API, read on 24 Nov 2026, were `v20250424` and `v20250425`. It is not evidence that GNW stopped that delivery path or its fire alerts elsewhere.
- **§2 "7 to 10 calendar days"** describes the windows seen on 24 Nov only. A retried cell keeps its first `since` and no maximum retry age is enforced, so windows can be longer. Today's range is evidence, not a limit.
- Also found while writing rev 2: the hub `quantity` string reaches the Sources "Measures" table and the rules list through `R.forest.quantity` in `app.js`, and `R.forest.unit` / `R.forest.window` repeat the "7 days" wording.
