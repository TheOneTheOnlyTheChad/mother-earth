# Soil C1: T1 tables check (25 Nov 2026)

Chad's go, in his own words, 25 Nov: "T1 yes—download and check only the small tables zip." Proposal rev 3 §6 sets the plan.

## What was fetched and read

- **Download:** `tabular_data_v1_0_1.zip`, through the browser pane's Download button on the record page at about 08:10–08:11 UTC (Mac clock).
  - The first click appeared to do nothing, so I clicked a second time. Both clicks completed, which left **two identical copies** in Chad's Downloads under the desktop app's hidden temporary names: `.Q6L2SF6YDW.com.anthropic.claudefordesktop.wSv6C5` and `….Q9FxNy`. Neither was renamed or removed (deletion is off).
  - Both copies are 842,116 B, with MD5 `2a4dd44b561d0e168b57856a9da2689a` (matching Zenodo) and SHA-256 `3108fefee61dc190ec316c48a7bfd6598c5842896dc43795a1e82b2270e5f4a8` (matching the manifest).
  - The zip's internal CRC test passes. It has four members:
    - `global_summary_by_inventory_period.csv` (875 B)
    - `country_summary_by_inventory_period.csv` (99,999 B)
    - `master_zonal_full_disaggregation.csv.gz` (491,072 B)
    - `master_zonal_full_disaggregation.parquet` (343,620 B)
- **Disclosed: one earlier file also arrived.** At 07:52 UTC, before Chad's go, my attempt to open `license_and_attribution.md` as a page was reported as "denied or failed", but the browser saved the file to Downloads instead (5,008 B). Its SHA-256 `65d86603…4c9d` matches the manifest. I used it here as the licence evidence GPT asked for. Nothing else was downloaded, and the two large files were not fetched again.
- **Read in full:**
  - all five rows of the global summary;
  - the licence file;
  - the data guide `readme_data.md`, read as Zenodo's rendered preview page in the browser pane, not downloaded.
- **Read by program:** all country and detailed rows were summed.

## Like-for-like comparison: global tables against the 1 km rasters (Gt CO₂e/yr)

| Period | Drained: table | Drained: raster | Raster − table | Burned: table | Burned: raster | Raster − table | Total: table | Total: raster |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2001–05 | 1.9909 | 1.9922 | +0.064% | 0.6337 | 0.6337 | +0.0042% | 2.6245 | 2.6258 |
| 2006–10 | 2.0072 | 2.0087 | +0.078% | 0.5972 | 0.5972 | +0.0034% | 2.6043 | 2.6059 |
| 2011–15 | 2.0012 | 2.0026 | +0.071% | 0.6933 | 0.6934 | +0.0054% | **2.6945** | **2.6960** |
| 2016–20 | 2.0725 | 2.0740 | +0.076% | 0.4808 | 0.4808 | +0.0040% | 2.5533 | 2.5549 |
| 2021–24 | 2.1474 | 2.1491 | +0.078% | 0.5419 | 0.5419 | +0.0030% | 2.6894 | 2.6911 |

- **Organic-soil area:**
  - tables: 1,144.33 Mha (2001–10 and 2021–24) and 1,143.04 Mha (2011–20);
  - raster extent map: 1,145.54 Mha, about 0.1% more.
- **Internal consistency:** the country rows sum to the global rows, and the detailed rows sum to the global rows, both to within 1.2×10⁻¹⁵.

## Findings

1. **The paper's figures match the tables, not the rasters.**
   - The tables give 2011–15 = 2.6945 Gt, which rounds to the paper's 2.69, and 2021–24 = 2.6894, which also rounds to 2.69.
   - The 2.696 that rev 1–3 flagged is the **1 km raster** sum for the same period.
   - So the "discrepancy" is not a 2011–15 anomaly. It is a small, **systematic** difference between the two products, in every period and in the same direction:
     - rasters are higher by 0.06–0.08% for drainage (1.3–1.7 Mt per year);
     - rasters are higher by 0.003–0.005% for fire;
     - the area runs the same way.
2. **The publisher states a general reason; this check did not attribute the difference quantitatively.**
   - In its own words, the data guide says the tables "use administrative boundaries and source pixel area weights", and that their extent, boundaries and weights differ from the raster aggregation, "so table totals and raster sums may differ".
   - It also notes that Float32 rounding and missing values can affect sums.
   - How much of the 0.07% comes from boundaries, area weights or Float32 is **not established**. Settling it would need the 30 m data, which is out of scope.
3. **The 2011–20 drop in table area (−1.29 Mha) is not explained by the raster NaN cells.** Those total only about 0.003 Mha (40 km²). It is recorded, not explained.
4. **Consequences for the page:**
   - The page uses the raster-derived 4° values. Sources should say so, and should say that the record's own country and global tables (and the paper) give global totals about 0.07% lower for drainage.
   - Neither the page nor the docs claim an exact reproduction of the paper; "close agreement" stands.
   - The data guide also states that where IPCC has no Tier 1 default for some drained coastal fluxes the model assigns zero, and that "those values do not demonstrate an absence of real world flux". This supports the neutral model-zero wording.
5. **Licence evidence:** CC BY 4.0 for the model outputs and documentation; the full text was read. The preferred attribution is quoted on the preview's Sources entry.

**Status:** the T1 question is answered as a documented product difference with a publisher-stated general cause. I recommend closing it for release on that basis; GPT and Chad decide. No further download is needed.
