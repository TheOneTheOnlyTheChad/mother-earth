# Moon / LRO science: archive rechecks and small real samples

26 Nov 2026 · Claude · evidence for `docs/concepts/MOON-LRO-SCIENCE-PROPOSAL.md` (rev 1, extended for rev 2 in §5) · docs only

All reads below are **Claude's own reads**, made in the browser pane between 03:56 and 04:05 UTC on 26 Nov 2026 (clock readings: the first data file's HTTP `Date` header said 03:58:37 GMT; `date -u` in the workspace said 04:05:54 UTC after the last fetch). Neither the workspace shell nor the Mac shell can reach `pds-geosciences.wustl.edu` (the proxy refuses the connection, HTTP 403), so every file was fetched in the pane, hashed there, and copied to the workspace in base64 pieces. Each copy's SHA-256 matched the hash taken in the pane. GPT's 25 Nov reads are in the brief (`docs/concepts/MOON-LRO-SCIENCE-BRIEF-GPT-2026-11-25.md`) and are labelled as GPT's wherever they are used.

The sample files are **not committed** (research stays text only). Since rev 2 a copy sits on Chad's Mac outside the repo, in `Documents/Mother Earth/_source-data/moon-lro-science-2026-11-26/` (the eight sample files plus the candidate grid as `ldem4-m-candidate.i16.gz`), so a reviewer can rerun the scripts. Anyone can fetch them again from the URLs and check them against the hashes. `assess_samples.py` (beside this note) reproduces the sample-derived numbers (hashes, LOLA checks, the float/int16 comparison, candidate sizes, Diviner statistics): `python3 -I assess_samples.py <samples-dir> <repo-root>`; its output is in `assess_output-2026-11-26.txt` (rev 2 run). Archive-page facts are reads, quoted with their pages. Browser decoding and rendering are measured by `measure_browser.cjs` (§5).

## 1. Archive rechecks (GPT's 25 Nov facts, read again)

| Fact in GPT's brief | Claude's read, 26 Nov | Source page |
|---|---|---|
| PDS Release 67, dated 15 Sep 2026 | Confirmed: "September 15, 2026. LRO Release 67 …" on both pages | lola.htm, diviner.htm |
| LOLA observations through 13 Jun 2026 | Confirmed: new LOLA EDR and RDR data "acquired between March 24 and June 13, 2026" | https://pds-geosciences.wustl.edu/missions/lro/lola.htm (page "Last Updated: 29 Sep 2026") |
| Diviner observations through 15 Jun 2026 | Confirmed: new Diviner EDR and RDR "acquired between March 16 and June 15, 2026"; RDR bundle LRODLR_1002 coverage Jan 1, 2017 – Jun 15, 2026 | https://pds-geosciences.wustl.edu/missions/lro/diviner.htm |
| LOLA Data Node updates more often than PDS | Confirmed (page text) | lola.htm |
| Diviner missing-field warning, `-9999` | Confirmed, and it is **specific**: since 17 Apr 2019 12:00, 99.25% of Diviner **RDR** products lack channel 1–2 brightness temperatures and about 1.1% lack some channel 3–9 values; the value is `-9999` in the `tb` column (column 24) of the **RDR**; processing errors, not an instrument fault; EDRs unaffected; JPL tracing it | diviner.htm |

These are archive coverage statements, not an instrument health check. Neither page says anything about the instruments' state today.

## 2. LOLA elevation: product and samples

**Product chosen: `LDEM_4_FLOAT`**, PDS3 `PRODUCT_VERSION_ID "V3.0"`, data set `LRO-L-LOLA-4-GDR-V1.0`; PDS4 LIDVID `urn:nasa:pds:lro_lola_rdr:data_gridded:ldem_4_float::1.0`; bundle DOI **10.17189/tnyt-7007** (Smith, D.E.; Neumann, G.A., 2023, "Lunar Reconnaissance Orbiter LOLA Processed (RDR) Data Products"). Producer: LOLA Science Team, NASA GSFC.

| Field | Value (from `ldem_4_float.lbl` / `.xml`, read 26 Nov) |
|---|---|
| Quantity | Height relative to a **1737.4 km reference sphere**, in km (`PLANETARY_RADIUS = DN + 1737.4`). The label says the planetopotential topography is radius minus a geoid radius, which **this product does not give**. So readouts say "height above / below the 1737.4 km reference sphere", never "above sea level", "above mean surface" or "altitude". |
| Data period | 2009-07-13T17:33:17 to 2016-11-29T05:48:19 (`START_TIME`/`STOP_TIME`), "through mission phase LRO_ES_52"; product created 2017-09-15 |
| Grid | 1440 × 720, 0.25° grid spacing (4 pixels per degree), simple cylindrical (equirectangular), **pixel registered** (cell centres at ±0.125°, …). The label's 7.58084 km/pixel is the spacing north–south and east–west at the equator; east–west spacing shrinks towards the poles (× cos latitude). |
| Longitude | East positive, **0° to 360°**, first column starts at 0°E (`WESTERNMOST_LONGITUDE 0`, `CENTER_LONGITUDE 180`, `SAMPLE_PROJECTION_OFFSET 719.5`). The page's Moon picture has 0° at its **centre**, so the grid is shifted by 720 columns to match it. |
| Latitude | Planetocentric, +90 to −90, `LINE_PROJECTION_OFFSET 359.5` |
| Frame | "MEAN EARTH/POLAR AXIS OF DE421" — the same mean-Earth axes as the existing LRO catalogue (`MOON_ME_DE440_ME421`) |
| Data type | IEEE754 little-endian float32 (`PC_REAL`); label min −8.879, max 10.504 |
| Missing values | **No `MISSING_CONSTANT` in the label.** The label says the gridding used GMT `surface` "to compensate for incomplete coverage" at higher resolutions, and that the 45° latitude bands "may" show edge artefacts. |
| Companion | `LDEC_4` (V3.0, same period): LOLA returns per cell, int16 |

**Samples fetched (whole files; the 4 ppd product is small):**

| File | URL | Bytes | Last-Modified | SHA-256 |
|---|---|---|---|---|
| ldem_4_float.img | https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/float_img/ldem_4_float.img | 4,147,200 | Wed, 06 Sep 2017 16:12:35 GMT | `6eaee9376442dc851b8f8e94790499ec339d923367d7b8608a4316088b85bd45` |
| ldec_4.img | …/cylindrical/img/ldec_4.img | 2,073,600 | Mon, 04 Dec 2017 18:00:22 GMT | `10ccc1253a7adab1ecb651d26b00ef6cbfa41107fd40f8998b5ab9fa5f9ee943` |
| ldem_4.img (int16; rev 1 read it in the pane only, rev 2 copied it, see §5) | …/cylindrical/img/ldem_4.img | 2,073,600 | Wed, 06 Sep 2017 15:43:35 GMT | `c04632eba6449af49e3108ed7c25b3b1c450600abd3690df4fc815853a1af476` |

The first fetch of `ldem_4_float.img` took 3,052 ms in the pane (one measurement, Chad's home connection to St. Louis; not a page-load figure).

**Newer version?** The LOLA Data Node (`imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/FLOAT_IMG/`, read 26 Nov) lists the same `LDEM_4_FLOAT.IMG` (4,147,200 B, 20 Jul 2017). The PDS errata say the improved global grids (about 500 million more points, with count grids at 4, 16, 64, 128, 256 and 512 ppd) came with Release 31 (2017-09-15), and no later release replaces them. LDEM_16_FLOAT is V3.1 (created 2019-03-15), same data period. No newer global 4 ppd grid was found.

**Checks (all from `assess_samples.py`):**

1. **Values:** min −8.879 km, max 10.504 km, exactly as the label says; no NaN.
2. **Landmark checks against published points.** The highest cell's centre is 5.375°N, 201.375°E. That cell (5.25–5.50°N, 201.25–201.50°E) contains the LOLA/LROC "highest point" (5.4125°N, 201.3665°E, 10,786 m; LROC Image 249). The lowest cell's centre is 70.375°S, 187.625°E. That cell (70.25–70.50°S, 187.50–187.75°E) contains or borders the published deepest point in Antoniadi crater (about 70.36–70.43°S, 187.4–187.6°E across sources). The 4 ppd peak and trough are lower than those point values (10.504 vs 10.786 km) because each cell holds a 7.6 km value.
3. **Orientation against the Moon picture on the page** (`lroc_color_2k.jpg`, an independent camera mosaic). After the 720-column shift, the correlation between height and picture brightness (60°N–60°S) peaks at zero offset in both longitude and latitude (r 0.5197; ±1 cell gives 0.513–0.515). Mirroring east–west drops it to 0.339; flipping north–south drops it to 0.110. This supports the orientation (east positive, north up) and the 720-column longitude shift. It is a whole-map statistic: it does **not** establish exact local registration everywhere to within one cell (rev 2 wording, after GPT's review). Local mapping is to be tested in the browser at landmarks, seams, cell boundaries and poles.
4. **Observations per cell at 4 ppd:** every one of the 1,036,800 cells has at least 64 LOLA returns (median 6,225, max 26,671), so every cell contains observations. This does **not** by itself show that the published value is free of interpolation or smoothing: the label says GMT `surface` gridding was used at higher resolutions and does not describe the 4 ppd gridding in detail (rev 2 wording).
5. **Seam:** the mean difference between the first and last columns (0°/360°) is 0.181 km, smaller than the typical neighbour difference (0.228 km). No seam step.
6. **45° band edges:** row-to-row differences at 45°N (0.322 km), the equator (0.270 km) and 45°S (0.330 km) are no larger than the global mean (0.347 km). No visible artefact at 4 ppd.
7. **North of 89.5°N: inconsistencies found in the source products (rev 2: reproduced and reworded).** In the float product the top row (89.875°N) holds 1,010 cells of exactly 0.0 of its 1,440; no other row has any exact zero. The int16 product `LDEM_4` (V3.0, same period; label `SCALING_FACTOR 0.5`, `UNIT METER`, LSB_INTEGER; hashes in §2 and §5) agrees with the float product to within one 0.5 m step in **every** cell of rows 2–719 (max difference 0.5000 m). In rows 0–1 the two disagree in 1,038 cells, by up to 1,423 m (row 1 mean 416 m). The int16 top row is itself 1,412 of 1,440 zeros with a maximum of 0.0 m, and its second row has 611 zeros, against none in the float's second row. The cause is **not established**: zeros look like fill, but whether either product's rows 0–1 are usable is unknown. **Decision:** values north of 89.5°N are withheld, with the wording "Values north of 89.5°N are withheld because inconsistencies were found in the source products." The south pole rows vary strongly (Shackleton and neighbours) but agree between the two products within one step.
8. **Sizes:** see the proposal's cost table (measured).

## 3. Diviner temperature: product and samples

**Product assessed: Diviner Global Cumulative Product (GCP)**, data set `LRO-L-DLRE-5-GCP-V1.0`, files `global_cumul_avg_cyl_<band>_002.tab` (18 bands, 10° each, 90°S–90°N), PDS4 collection `urn:nasa:pds:lro_diviner_derived1:data_derived_gcp`, bundle `urn:nasa:pds:lro_diviner_derived1` version 5.0, bundle DOI **10.17189/wj0s-w188** (Paige, D.; Sullivan, M.; Williams, J-P., 2022, "Lunar Reconnaissance Orbiter Diviner Derived Data Products"). Producer: Diviner team, UCLA (J.-P. Williams). Calibration software 4.0; product version "1"; created 2016-05-27. Method paper named in the label: Williams et al. (2017), "The global surface temperatures of the Moon as measured by the Diviner Lunar Radiometer Experiment", Icarus 283, 300–325.

| Field | Value (from the `.lbl`/`.xml` of the 00N–10N band) |
|---|---|
| Quantity | Average calibrated brightness temperature per channel (t3–t9) and **bolometric brightness temperature `tbol`**, in K. Brightness temperatures, not a modelled physical or subsurface temperature. |
| Compilation period | All nadir observations, **5 Jul 2009 – 1 Apr 2015** (multi-year; not one pass, not now) |
| Binning | 0.5° latitude × 0.5° longitude × **0.25 h of local time** (96 local-time bins) |
| Longitude | Bin centres from −179.75 to +179.75 (east positive) — a **different convention** from LOLA's 0–360 |
| Row order | Longitude slowest, then latitude, then local time fastest (checked on the sample) |
| Missing | `-9999` = "bins that contained no observations"; `-9998` = invalid |
| Negative values | Channel brightness temperatures can be negative "when temperatures are below the sensitivity of a Diviner channel" (label). Only `tbol` is proposed for display. |
| Size | 18 files × 156,211,313 B = **2,811,803,634 B** (ASCII), read from the directory listing |

**The RDR `-9999` warning, checked against this product:** it is about **RDR point records from 17 Apr 2019 onward** (the `tb` column). The GCP is a gridded compilation of data from **2009–2015**, so that processing fault cannot be in it. The GCP's own `-9999` has a different meaning (an empty bin) and is shown as missing, never as 0 K.

**Samples fetched (contiguous byte ranges; HTTP 206 confirmed):**

| Sample | URL | Range | Bytes | SHA-256 |
|---|---|---|---|---|
| 00N–10N, first 10 longitudes (179.75°W–175.25°W), all 20 latitudes, all 96 local times | https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/data_derived_gcp/global_cumul_avg_cyl_00n10n_002.tab | bytes=113-2169712 of 156,211,313 | 2,169,600 | `b1f930da3d4a8de1e136ac71c90947e1d7dc3e82d54114f6b722eaa68802ba97` |
| 80N–90N, same longitudes | …/global_cumul_avg_cyl_80n90n_002.tab | bytes=113-2169712 | 2,169,600 | `9c1de7250ce3f24e6520623916dd910efd4ec2ba620aa20395e7df886c7f6264` |

The equatorial range took 1,015 ms in the pane. The server also answered a two-range request with `multipart/byteranges` (206), so a later build could fetch chosen local-time bins without the whole 2.8 GB.

**Checks:**

- Equator patch: 39.8% of `tbol` bins are `-9999`. Range 92.5–396.6 K. **A single 15-minute local-time bin is patchy**: at 00:00–00:15, 07:00, 13:00, 16:00, 18:00 and 20:00 local time the patch has **no** values; at 12:00 all 200 cells have one.
- With a **one-hour window** (11:30–12:30 or 23:30–00:30), all 200 equatorial cells have values. The spread between bins inside the window averages 3.29 K at noon and 0.85 K at midnight.
- Polar patch (80–90°N): only 7.5% missing, but the spread inside the same windows is 26.6 K (noon) and 11.8 K (midnight). Near the pole, local time means little and seasons and shadows mix in, so a "noon" polar map needs its own caveat or a cut-off latitude.

## 5. Rev 2 additions (26 Nov, after GPT's review of rev 1)

**Further files fetched in the pane (04:33 UTC; hashed there, copied to the workspace, hashes matched):**

| File | URL (under …/lrolol_1xxx/data/lola_gdr/cylindrical/) | Bytes | Last-Modified | SHA-256 |
|---|---|---|---|---|
| ldem_4.img (int16) | img/ldem_4.img | 2,073,600 | Wed, 06 Sep 2017 15:43:35 GMT | `c04632eba6449af49e3108ed7c25b3b1c450600abd3690df4fc815853a1af476` |
| ldem_4.lbl | img/ldem_4.lbl | 5,107 | Wed, 06 Sep 2017 15:44:17 GMT | `b5a197b4d417e3b5e0e84f8fe15f9a1d2203b8eb5d7213236c0ffbc86e940cc6` |
| ldem_4_float.lbl | float_img/ldem_4_float.lbl | 5,125 | Wed, 06 Sep 2017 16:15:16 GMT | `37315910c3064d66623180fe49e91abc6c0c6b43b064042d2ac8002d997479d4` |
| ldec_4.lbl | img/ldec_4.lbl | 3,942 | Mon, 04 Dec 2017 21:58:18 GMT | `ab220f2b95482f9d4a6e94a8714897e822492fe731aedaa1b275ba758869da13` |

The two height labels differ in one descriptive word: the float label says its samples are "generated using **preliminary** LOLA data", the int16 label "generated using **geolocated** LOLA data". Both are V3.0 with the same period and creation date. Recorded, not interpreted.

**Float/int16 comparison** (`assess_samples.py` B3b; each file converted with its own label's scaling): see §2 item 7. Output lines are in `assess_output-2026-11-26.txt`.

**Lossless decoding in a real browser** (`measure_browser.cjs`, Chrome under SwiftShader, 26 Nov):
- Candidate page file: int16 little-endian whole metres, rows 0–1 = −32768 (withheld), gzip level 9 with a zero timestamp: **1,776,231 B**, sha256 `af4450019840918da4a62812f4969ad07a0c77bf3f878ef59ca7e8961cc7d43d` (identical from `assess_samples.py` and from the separate build used for the browser test). Rounded in float64; worst |file − source| 0.5000 m over all 1,033,920 kept cells.
- In the page: `fetch` → `DecompressionStream('gzip')` → `Int16Array`. No image element, no canvas, so no 8-bit colour path. **All 1,036,800 values equal the same file decoded by Node's zlib (0 differ).** Named cells read back exactly: highest (10,504 m), lowest (−8,879 m), a zero-metre cell (0; source 0.207 m), first negative cell, withheld cells including the row edge at 89.51°N, the first kept row at 89.49°N, both sides of the 0°/360° seam, 180°E, and the south pole row. Extremes outside the withheld rows match (−8,879 / 10,504).
- Measured in that run: fetch 50.5 ms, decompress 20.1 ms (local server, headless Chrome on the workspace; not a phone figure).

**Current globe rendering, measured** (current `moon.html`, unchanged; idle 5 s after start, 3 s settle). Run B is in `measure_output-2026-11-26.txt`; run A was an earlier run of the same render code in this session (its output was not kept as a file; numbers copied from the tool output):

| Reduced motion | Animation-frame callbacks / 5 s (A / B) | WebGL draw calls / 5 s (A / B) |
|---|---|---|
| on | 2,421 / 1,944 | 269 / 216 |
| off | 2,268 / 2,106 | 252 / 234 |

So the current globe **redraws continuously while idle** (roughly 43–54 draws a second under software WebGL; about one draw per frame). The many callbacks per draw come from several animation loops inside the library. With another tab in front, headless Chrome still reported the page as `visible` and the counts fell to 72–180 callbacks and 8–20 draws per 5 s. That is a background-tab reading, not a hidden-page measurement. Rev 1's statement that the globe "renders only on interaction" was wrong and is withdrawn.

**PDS data-use guidance** (PDS Geosciences FAQ, https://pds-geosciences.wustl.edu/faq.html, page "Last Updated: 12 Oct 2026", read by Claude 04:35 UTC): "Data sets archived in the PDS are in the public domain." The FAQ adds that when PDS data sets are used in published literature or other applications "they should be cited appropriately", pointing to Citing PDS4/PDS3 Data.

## 4. What was not fetched

No full GCP band and no LOLA grid finer than 4 ppd (LDEM_16_FLOAT is 66,355,200 B; LDEM_64_FLOAT 1,061,683,200 B; their sizes are from the directory listing). No ODE job, no account, no email address. No CRaTER, LEND, LAMP, Mini-RF or LROC products. No hub request.
