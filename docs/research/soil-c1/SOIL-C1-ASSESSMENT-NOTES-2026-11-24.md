# Soil carbon C1 — bounded methods and aggregation assessment, research notes (24 Nov 2026)

Evidence for `docs/concepts/NATURE-CONTEXT-SOIL-PROPOSAL.md`. Chad's authority, from his own message of 24 Nov 2026:
- the dated-model exception is accepted;
- option (a): download the two named files from Zenodo record 22137130 through the browser pane;
- this authorises the bounded local assessment and measurements;
- read the methods directly in full text;
- verify checksums; resolve the 1 km units, aggregation and no-data semantics;
- bring the assessment and proposed presentation to GPT.

No soil card, hub route, upload or deployment is approved.

## 0. How each source was read (said plainly)

- **Read in full, as returned by the source:**
  - the Zenodo record metadata (API);
  - `license_and_attribution.md`, `readme_data.md`, `data_dictionary.csv` and `release_manifest.csv`;
  - `state_codes.csv`: all 1,998 rows parsed and tabulated, not read line by line;
  - the embedded GeoTIFF tags of all eleven 1 km files.
- **Paper, Glen et al. (2026), *Frontiers in Environmental Science* 14, read directly as full text in the browser pane (24 Nov, about 14:30 UTC):**
  - read in full: §2.1–2.6 (all methods), §3.1 and §3.2, §4.5 (limitations), the data availability statement and the licence line;
  - the earlier summarising fetches (§3.9–3.11, §4) are discovery material only;
  - **not read directly:** the Introduction, §3.3–3.11, §4.1–4.4, §4.6, §5 and the supplementary notes and tables S1–S10 (emission-factor tables, threshold diagnostics).
- **Downloaded on Chad's yes**, through the browser pane to his Mac's Downloads, then staged to the workspace:
  - `organic_soil_emissions_1km_v1_0_1.zip`, 212,800,018 B;
  - `organic_soil_cover_percent_1km.tif`, 108,618,168 B.
  - No other file was downloaded: the 842 KB tables zip and the 30 m data were not fetched.
- **Not checked:** the Isik and Hengl probability record (doi 10.5281/zenodo.20121128), the model code repository, the mineral-soil stock-change product (ESSD 2026), and any soil-stock product.

## 1. Identity and version

| Item | Value |
|---|---|
| Record | Zenodo 22137130, concept 22137129, version **1.0.1**, created 2026-10-23 08:15:19 UTC; publication date 2026-10-21 |
| Version check | `/api/records/22137130/versions`: one version only (1.0.1). **Last checked 2026-11-24 14:33:44 UTC** |
| Licence | Data CC BY 4.0 (`license_and_attribution.md`); model code GPL-3.0-only; article CC BY (Frontiers licence line) |
| Paper | Glen, Gibbs, Scafidi, Isik, Rossi, Consoli, Rose, Senar, Hengl, Harris (2026). Online 3 Jul 2026, published 30 Oct 2026 (metadata, via the summarising fetch) |

**Checksums:** verified on the Mac and again in the workspace after staging; both match Zenodo's MD5 and the release manifest's SHA-256.

| File | MD5 | SHA-256 |
|---|---|---|
| zip | `55703ae10c6b0123d773e0b92138b65f` | `5c08288497265b761421d898819f11824000c1b06b4455052e0e1849d82a1473` |
| extent tif | `3b9649665f97a28ff8ba9f3ca01cdc07` | `7b35b59ab8d9944e9d0fa64c2ec903cdc0eaf131f4d462ec6304ddb740d15e0e` |

**Zip contents:** ten GeoTIFFs, `{drained,burned}_emissions_Mg_CO2e_cell_yr_1km_{2001_2005,…,2021_2024}.tif`, 7.6–38.5 MB each, 203 MB unpacked.

## 2. The 1 km files: units, grid, aggregation and no-data (from the files' own tags)

- **Grid:**
  - Float32, 34,736 × 14,686, 512 × 512 tiles, deflate, overviews ×2–×128;
  - CRS `+proj=cea +lat_ts=30 +lon_0=0 +ellps=WGS84`, 1,000 m cells, origin (−17,368,000, 7,343,000);
  - the grid runs about 470 m past ±180° and past the poles; 67,274 km² of cells fall outside the world, and all of them hold 0.
- **Units (tag `units`):**
  - emissions: **"Mg CO2e cell-1 yr-1"**, the annual total for the whole 1 km cell;
  - extent: "percent of full 1 km cell".
- **Aggregation (tag `aggregation`):** "Conservative overlap on WGS84 cylindrical equal area, standard parallel 30 degrees".
- **Annualisation:** source annual values retained; "no further division by period length".
- **No-data, emissions (tag `missing_data`):**
  - **NaN** "where any organic soil source area lacks emissions";
  - **zero** "where no organic soil is mapped".
  - A zero is also produced where organic soil is mapped but the model assigns no emission. The guide gives two such cases: tropical undrained fire, and some coastal gases with no Tier 1 default. So **a 1 km zero is ambiguous; the extent map separates "no organic soil mapped" from "modelled zero"**.
- **No-data, extent:** zero means "no mapped organic soil or unpopulated background"; there are no NaN cells; the maximum is 100.0.
- **Overviews:** display means only; "use the original 1 km grid for analysis". Not used here.
- **Gap:** the record's `data_dictionary.csv` defines only the native 30 m / Zarr variables, not the 1 km GeoTIFFs. The 1 km semantics above come from the files' tags and the guide.

## 3. Methods, read in full text (§2.1–2.6)

- **Domain:**
  - IPCC organic soils, defined by soil properties; peatlands are a narrower subset;
  - extent comes from the OpenGeoHub ensemble probability, the mean of a taxonomy probability and a peat-depth probability (depth > 40 cm);
  - thresholds are 0.16 tropical (F2), 0.30 boreal (F1), 0.27 temperate (F1.5), chosen on spatially blocked held-out points and not calibrated to totals; other-domain pixels use the temperate threshold.
- **Grid:** all computation at 0.00025° (about 27–28 m at the equator), with geodesic pixel areas; some inputs are coarser, burned area at 500 m.
- **Drainage:**
  - inferred from proxies: within 500 m of mapped canals, ditches or roads (250 m and 750 m tested); GLCLUC cropland and settlement per interval; plantations; extraction areas;
  - infrastructure, plantations, coastal and extraction layers are static over 2001–2024;
  - legacy, pre-2001 drainage is included.
- **Fire:**
  - MODIS MCD64A1 burned years per interval are summed and divided by the interval length;
  - fire emissions are added to drainage emissions, not substituted for them;
  - tropical undrained burned pixels get no peat-fire emission, because there is no Tier 1 fuel-consumption default.
- **Gases and conversion:**
  - drainage: on-site CO₂, off-site CO₂ (DOC), CH₄ from land and ditches, N₂O; fire: CO₂ and CH₄; CO is reported separately and is not in CO₂e;
  - GWP100 AR6: CH₄ 27.0, N₂O 273;
  - IPCC 2013 Wetlands Supplement Tier 1, with documented fallback "routing assumptions" where no stratum fits.
- **Geographic totals:** "pixel-level area-weighted sums". Results are average annual rates per interval: 2001–05, 2006–10, 2011–15, 2016–20, 2021–24 (four years).
- **Sensitivity:** targeted scenario tests, not probabilistic uncertainty. The threshold scenarios give extent bounds of about 464–1,285 Mha. Benchmarks against FAOSTAT and national inventories are diagnostic only.
- **§3.1:** mapped extent **1,144 Mha** (boreal 971, temperate 89.8, tropical 82.9, other 0.3).
- **§3.2:**
  - totals 2.55–2.69 Gt CO₂e per year, mean 2.63; "no clear long-term trend"; drainage 1.99–2.15, fire 0.48–0.69;
  - drained about 79.6 Mha in 2021–24, plus about 15.8 Mha burned but not drained.
- **§4.5 limitations:**
  - an operational monitoring framework, not a minimum estimate;
  - static infrastructure may misattribute drainage in early intervals; "apparent trends should thus be interpreted with caution";
  - MODIS misses small and smouldering fires, so fire is conservative;
  - threshold choice is a first-order factor;
  - no drainage age or rewetting is modelled;
  - extraction is partial (Finland, Ireland, Russia).

## 4. Measurements (cloud workspace, 2 CPU, 7 GB RAM, 30 GB free disk; Python 3, rasterio 1.5.2 / GDAL 3.12.2)

**Method:** `docs/research/soil-c1/cells4.py` (sha256 `37dbff27…2c77`). The test applied to every map:
- read the raster in 512-row strips;
- weight each 1 km cell's value into the 4° cells (the page's g4 grid; ids `row_col`, south = −90 + 4·row, west = −180 + 4·col) by exact overlap area;
- overlap is computed in the projected CEA metres: x is linear in longitude, and the y of each 4° parallel comes from pyproj, so area is Δx·Δy;
- every NaN cell is kept out of the sum, and its overlapping area is counted as missing;
- zero and positive areas, and the organic-soil area from the extent map, are tracked separately;
- anything beyond ±180° or the poles goes to an "outside" bin.

**Cost per map:** about 35–45 s and about 1.13 GB peak resident memory. The full ten maps took about 6.5 minutes. No overview was used.

**Conservation:** for every map, the sum of all 4° cells equals the raster's own sum to within 5×10⁻¹⁶ relative; the "outside" bin holds 0.

| Period | Drainage Gt CO₂e/yr | Fire Gt CO₂e/yr | Total | NaN 1 km cells | Paper |
|---|---:|---:|---:|---:|---|
| 2001–2005 | 1.9922 | 0.6337 | 2.6258 | 0 | |
| 2006–2010 | 2.0087 | 0.5972 | 2.6059 | 0 | |
| 2011–2015 | 2.0026 | 0.6934 | **2.6960** | 27 | |
| 2016–2020 | 2.0740 | 0.4808 | 2.5549 | 13 | |
| 2021–2024 | 2.1491 | 0.5419 | 2.6911 | 0 | baseline 2.69 |

- Drainage spans 1.99–2.15 and fire 0.48–0.69: **the paper's ranges exactly**.
- **One open point:** the 2011–15 total from the 1 km rasters is 2.696, while the paper gives 2.69 as the top of its range. The guide says raster sums and table totals can differ (boundaries, masks, weights); the tables were not downloaded, so this is not resolved.
- **Mapped organic soil** (extent map × cell area): 11,455,359 km² = **1,145.5 Mha**, against the paper's 1,144 Mha (CEA cells against geodesic tabulation).
- **NaN cells:**
  - only in 2011–15 (27) and 2016–20 (13), and the drainage and fire maps carry the same cells;
  - 4° cells affected: `38_39`, `38_40`, `38_41`, `39_39`, `39_40` (62–70°N, 24–12°W; Iceland) and `40_16` (70–74°N, 116–112°W; Canadian Arctic), 1–10 km² each;
  - those cells' totals for those periods are sums over the available part only.
- **4° cells:**
  - 790 cells carry mapped organic soil or a non-zero value;
  - 707 have drainage > 0 in 2021–24; 424 have fire > 0;
  - 82 have organic soil but zero drainage, and 81 of those also have zero fire (modelled zero or no Tier 1 default);
  - drainage per cell in 2021–24 (n = 707): p10 193, median 34,909, p90 2,788,699, max 305,074,153 Mg CO₂e/yr (`22_70`, 2°S–2°N, 100–104°E, Sumatra);
  - 195 cells lie in 30°S–30°N.
- **Per-period values can jump for input reasons (examples):**
  - `22_29` (2°S–2°N, 64–60°W, Amazonas): drainage 17,626 → 265,140 Mg/yr from 2016–20 to 2021–24 (×15);
  - `38_39` (Iceland): drainage 0, 0, 1.79 M, 2.24 M, 0 across the five periods.
  - These follow the paper's warning about apparent trends; they are why the presentation shows no trend or change.
- **Cape Town's cell `14_49`:** no organic soil mapped and all values 0, so the page would say "no organic soil mapped in this cell by this model", not zero emissions.
- **Derivative size:** the per-cell table for all five periods, both components, organic area and missing area, as compact JSON, is 312,784 B (36,884 B gzip). sha256 `49a745b0…f0` (in the Mac review copy only; not in the repository, not uploaded).

## 5. Version-check record (Chad's standing rule, 24 Nov)

| Product | Version pinned | Last checked | Proposed cadence |
|---|---|---|---|
| Glen et al. 2026 model outputs (Zenodo concept 22137129) | 1.0.1 | 2026-11-24 14:33:44 UTC | **Monthly** while the 30 m open release is "being prepared" (readme); then **quarterly**. Also on any erratum to the paper. Check: one GET `/api/records/22137129/versions`. A new version is reviewed (diff of global and per-cell sums) before any pinned data is replaced; 1.0.1 is kept. |
