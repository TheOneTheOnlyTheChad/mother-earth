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

## 6. Diviner assessment (26 Nov 2026, after the height release)

All reads and fetches below are **Claude's own**, made in the browser pane on 26 Nov 2026 between 08:41 and 08:53 UTC. The clock readings are the HTTP `Date` header (08:43:45 GMT on the SIS fetch) and the page's `new Date()` after the fetches (08:46:15, 08:46:49, 08:47:10 UTC). Every file was hashed in the pane, copied to the workspace as gzip in base64 pieces, and its SHA-256 matched there. The numbers come from `assess_diviner.py` (beside this note): `python3 -I assess_diviner.py <samples-dir>`. Its output is in `assess_diviner_output-2026-11-26.txt`. The samples are **not committed**. A copy is on the Mac in `Documents/Mother Earth/_source-data/moon-lro-science-2026-11-26/diviner/`.

### 6.1 Archive recheck: what Diviner products exist

PDS Geosciences holds four Diviner archives: `lro-l-dlre-2-edr-v1` and `lro-l-dlre-4-rdr-v1` (raw and calibrated point data), the PDS4 bundle `urn:nasa:pds:lro_diviner_derived1` (v5.0, 2 Feb 2024; DOI 10.17189/wj0s-w188), and `urn:nasa:pds:lro_diviner_derived2` (created 2024; Emission Phase Function products only, not maps). Bundle 1 has seven data collections. The table lists each one's relevance to a Moon-globe temperature layer.

| Collection | What it is (from the readme, labels and SIS v1.21) | Period | Grid | Relevant? |
|---|---|---|---|---|
| **GCP**, Global Cumulative Products | `tbol` and channels t3–t9 per 0.5° × 0.5° × 0.25 h local-time bin, all nadir data | 5 Jul 2009 – 1 Apr 2015 | global, 2 ppd, 96 local-time bins, ASCII, 2.81 GB | **Yes**: the only global product covering **all local times**, so noon and midnight come from one product |
| **GHRM**, Global High-Resolution Mosaics (added Release 4, 2 Feb 2024) | `tbol`, tb6–tb9, `treg` at **midnight** (`m`) and **slope-adjusted midnight** (`sam`); `tbol`/`treg` anomaly; rock abundance. One float32 map each, missing = NaN | 5 Jul 2009 – 1 Aug 2022 | 128 ppd, **70°S–70°N**, 3,303,014,400 B each | **Yes, midnight only**: a published team product; used here as an independent cross-check |
| **GDR Level 3 TBOL**, per mapping cycle (210 day maps and 210 night maps at each of 1, 4, 16, 64 and 128 ppd) | `tbol` binned over one 27-day mapping cycle, day (06–18 h) or night (18–06 h) | 5 Jul 2009 – Sep 2016 (last 4 ppd cycle starts 26 Sep 2016) | global; 4 ppd = 2,073,600 B | Assessed as the "short dated interval" option: see 6.4 |
| GDR Level 2 | per-cycle channel brightness temperatures, errors, counts, **local time (LTIM)**, Julian date | same as above | 1–128 ppd | Companion local-time map for a cycle |
| GDR Level 3 other | rock abundance, regolith (soil) temperature, Christiansen feature, RMS | 2009–2016 | 32 / 128 ppd | Not temperature maps of the requested kind (models or composition) |
| PCP, Polar Cumulative Products | `tbol` over 80–90° caps, 240 m, by local time or subsolar longitude, summer/winter | 2009 – 17 Feb 2019 (seasonal south cap to 15 Mar 2020) | polar stereographic, ASCII | Polar only: a later, separate polar question |
| PRP, Polar Resource Products | annual mean/max temperature and ice depth per polar mesh triangle (modelled) | first mapping year | mesh | Model-derived: not this layer |
| RCP, Regional Cumulative Products | Lacus Mortis only, 128 ppd, 0.1 h | 2009 – 1 Mar 2021 | regional | Regional only |

**Newer data:** the RDR archive (Release 67, data to 15 Jun 2026; SAMPLES §1) is still being added to. The **derived** bundles were last changed on 2 Feb 2024 (bundle 1) and 2024 (bundle 2). No newer GCP version exists: `gcpds.cat` still describes the 2009–2015 compilation, released 15 Mar 2017.

### 6.2 What `tbol` is (from the product documentation)

- **GCP label** (PDS4 `global_cumul_avg_cyl_00n10n_002.xml`, field 11 `tbol`): "Bolometric average calibrated brightness temperature (K)". Missing: `-9999` = "bins that contained no observations", `-9998` = invalid.
- **GCP catalog** (`catalog/gcpds.cat`, Mark Sullivan 2017/2020) and **SIS v1.21 §8.1** (Diviner RDR and Derived Products SIS, 25 Oct 2023, `document/Diviner_RDR_SIS.pdf`, 1,829,904 B, sha256 `a2d2f02e…4a46`, read in full text in the workspace and not committed): radiances from the RDR are binned per channel (3–9) per bin, "to determine the mean brightness temperatures", and "the **mean radiance values for all the channels** were used to determine the bolometric brightness temperatures for each bin". So the bin's radiances are averaged first and then converted to `tbol`. It is not a mean of per-observation temperatures.
- **SIS §2.2.6** sends the reader to Paige et al., Science 330, 479 (2010) for the bolometric method. That journal's full text was **not read** (it is not open access). Its definition sentence is reproduced on a third-party page that copies the paper's text (https://lunarnetworks.blogspot.com/2010/10/lro-diviner-lunar-radiometer.html, read 26 Nov). That copy says `tbol` is the wavelength-integrated radiance in all seven Diviner channels, expressed as the temperature of an equivalent blackbody. It equals the surface temperature only when the footprint is a uniform-temperature blackbody. **This sentence is a secondary copy and is labelled as such.** The spectral interpolation and extrapolation the team uses between and beyond the channels were not read and are not claimed.
- **Consequences for wording:** `tbol` is a **brightness** temperature of the whole footprint (several km at 0.5°). In a footprint that mixes rocks and fine regolith, or sunlit and shadowed slopes, it is not the physical temperature of any one surface. It says nothing about the subsurface. The page must call it "bolometric brightness temperature" (short form "brightness temperature") and never "surface temperature now" or "how hot the ground is".
- **Label error recorded:** the GCP label's reference DOI reads `10.1026/j.icarus.2016.08.012`. The Icarus DOI form is `10.1016/…`, so the label looks like a typo. Records will cite the paper by journal, volume and pages and say this.
- **Level 3 TBOL label errors recorded** (4 ppd cycle label, e.g. `dgdr_tbol_avg_cyl_20160111d_004_img.lbl`): `NAME = "BOLOMETRIC TEMPERATURE"`, but `UNIT = NORMALIZED_RADIANCE`, and the `DESCRIPTION` paragraph is about "Visual Brightness (VB) for Channel 1". The values (25.16–397.86 K at DN × 0.02) match `DERIVED_MINIMUM`/`MAXIMUM` (25.1764 / 397.8657) to within one 0.02 K step, so the data are bolometric temperatures in K and the label text is a copy error. Recorded, not relied on.
- **Local time** (SIS RDR field 30 `cloctime`): "Local time at FOV Center (hours past midnight)", 0–24, spherical Moon. 24 local-time hours make one lunar day, so a one-hour window spans 15° of the Sun's hour angle.

### 6.3 Samples fetched (26 Nov, 08:45–08:53 UTC)

| Sample | URL (under `…/urn-nasa-pds-lro_diviner_derived1/`) | Request | Bytes | Pane time | SHA-256 |
|---|---|---|---|---|---|
| GCP 0–10N, 0.25–4.75°E (near side) | `data_derived_gcp/global_cumul_avg_cyl_00n10n_002.tab` | `bytes=78105713-80275312` → 206 | 2,169,600 | 765 ms | `c6389c55…bb54f` |
| GCP 30–40S, same longitudes | `…/global_cumul_avg_cyl_40s30s_002.tab` | same range → 206 | 2,169,600 | 1,702 ms | `c3311ad6…91ee` |
| GCP 80–90S, same longitudes (south polar) | `…/global_cumul_avg_cyl_90s80s_002.tab` | same range → 206 | 2,169,600 | 1,173 ms | `2f99420f…f809` |
| GCP 60–70S, same longitudes | `…/global_cumul_avg_cyl_70s60s_002.tab` | same range → 206 | 2,169,600 | not measured¹ | `4a10075e…dd15` |
| GCP 70–80N, same longitudes | `…/global_cumul_avg_cyl_70n80n_002.tab` | same range → 206 | 2,169,600 | not measured¹ | `c3e13259…b26c` |
| L3 TBOL, cycle from 2016-01-11 (day), 4 ppd | `data_derived_gdr_l3/2016/cylindrical/img/dgdr_tbol_avg_cyl_20160111d_004_img.img` | whole → 200 | 2,073,600 | 708 ms | `86679c0c…83b2` |
| L2 LTIM, same cycle | `data_derived_gdr_l2/2016/cylindrical/img/dgdr_ltim_avg_cyl_20160111d_004_img.img` | whole → 200 | 2,073,600 | 1,365 ms | `b267a8b7…e49d` |
| L3 TBOL, cycle from 2016-01-25 (night), 4 ppd | `…/dgdr_tbol_avg_cyl_20160125n_004_img.img` | whole → 200 | 2,073,600 | 1,653 ms | `5a769d45…fd00` |
| L2 LTIM, same cycle | `…/dgdr_ltim_avg_cyl_20160125n_004_img.img` | whole → 200 | 2,073,600 | 1,084 ms | `81d47f9d…5a69` |
| GHRM `tbol` midnight, 1° × 1° at 0°N 0°E | `data_derived_ghrm/img/dghrm_tbol_m_70s70n_img.img` | 128 ranges in one request → 206 multipart | 65,536 payload | 2,204 ms | `e3478099…9549` |
| same, 1° × 1° at 0°N 180°E | same file | 128 ranges → 206 | 65,536 | 1,723 ms | `e1f909ab…2fbc` |
| same, 1° × 1° at 45°S 300°E | same file | 128 ranges → 206 | 65,536 | 3,790 ms | `2d9216d6…387d` |

The earlier two GCP samples (SAMPLES §3, far side 179.75°W–175.25°W) were staged from the Mac and re-hashed: both matched.

¹ The first request for the last two GCP patches was still running when the 45 s tool limit ended. A second request a few seconds later returned in about 50 ms, from the browser's cache. The true transfer time is **unknown**; the bytes and hashes are verified.

### 6.4 Multi-range retrieval test (capped)

Five requests to the GHRM file had 8, 32, 128, 128 and 128 ranges; one request to the GCP file had 80 ranges. Each multi-range request was answered with HTTP 206 `multipart/byteranges`. **Every returned part had exactly the requested start, end and length**, in order. The first part of each GHRM request was byte-identical to the same range fetched on its own. Each of the 80 GCP parts was byte-identical to the same bytes in the contiguous patch fetched earlier.

| Request | Ranges | Payload | Body | Overhead | Time |
|---|---|---|---|---|---|
| GHRM, 8 rows × 512 B | 8 | 4,096 | 5,288 | 1,192 B | 2,579 ms |
| GHRM, 32 rows × 512 B | 32 | 16,384 | 21,008 | 4,624 B | 2,848 ms |
| GHRM, 128 rows × 512 B (three sites) | 128 | 65,536 | 83,888 | 18,352 B | 2,204 / 1,723 / 3,790 ms |
| GCP, noon window (4 lines × 20 latitudes × 4 longitudes) | 80 | 36,160 | 46,128 | 9,968 B | 329 ms |

Overhead is about 143 B per part (multipart headers). More than 128 ranges per request was **not tried**.

**Archive checksums for the whole GCP files.** The bundle's MD5 list `urn-nasa-pds-lro_diviner_derived1.md5` (45,050,842 B, Last-Modified 21 Sep 2026) was searched with small byte ranges (8 binary-search steps of 4 KB, then 64 KB reads). It lists one MD5 per file. A whole-file fetch can therefore be checked against the archive's own checksum; a ranged fetch cannot. The 18 GCP entries (each file 156,211,313 B):

| File | MD5 (archive list) |
|---|---|
| `global_cumul_avg_cyl_00n10n_002.tab` | `0044e6df5344775442241afb8e1a6e66` |
| `global_cumul_avg_cyl_10n20n_002.tab` | `66dcd592b7bb614ffa72eb110d0c506a` |
| `global_cumul_avg_cyl_10s00s_002.tab` | `c1fc628ba4fbedf0de620573d215686c` |
| `global_cumul_avg_cyl_20n30n_002.tab` | `dedfe3f2ccc0ee71e993d9b5bcfc69f3` |
| `global_cumul_avg_cyl_20s10s_002.tab` | `0b13cb5d7f244e3bb5dc8545a7d08eac` |
| `global_cumul_avg_cyl_30n40n_002.tab` | `5dfe356183b56e4e1df3de54ecc10278` |
| `global_cumul_avg_cyl_30s20s_002.tab` | `24916e51c8fb8befc14ad83f761d7de8` |
| `global_cumul_avg_cyl_40n50n_002.tab` | `837dc75075c1b342dd30427fb4d468eb` |
| `global_cumul_avg_cyl_40s30s_002.tab` | `3d7f97803c6a9082e9a6274892a4bcbd` |
| `global_cumul_avg_cyl_50n60n_002.tab` | `93c039247e7f7ad5e54d0358243c5488` |
| `global_cumul_avg_cyl_50s40s_002.tab` | `26727cfa54c758dfd8e0274c52d24e0e` |
| `global_cumul_avg_cyl_60n70n_002.tab` | `71e6784dd51cc2833d907da337546663` |
| `global_cumul_avg_cyl_60s50s_002.tab` | `62c5b3f9764e0626697398776a019005` |
| `global_cumul_avg_cyl_70n80n_002.tab` | `c132354928ad9b09a3da974b6af9f215` |
| `global_cumul_avg_cyl_70s60s_002.tab` | `b3c131b9c243168fe7b0060d4dc418f8` |
| `global_cumul_avg_cyl_80n90n_002.tab` | `396e9215ab3925b3b1facf6d487050c4` |
| `global_cumul_avg_cyl_80s70s_002.tab` | `d26aa3c85b82105dcb15825de076a4ce` |
| `global_cumul_avg_cyl_90s80s_002.tab` | `3200dd1267b676cad89300d344a88010` |

### 6.5 Findings from the samples

**GCP coverage and local-time bins** (G1–G4 in the output):

- Empty `tbol` bins: 39–41% at 0–10° and 30–40°S, 30% at 60–70°S, 17% at 70–80°N, 7.5–12% in the polar caps. There is no `-9998` and no negative `tbol` in any patch. Negative values appear only in single channels t3–t9 (below each channel's sensitivity, as the label says). They are never displayed.
- **A single 15-minute bin is too sparse for the proposed near-complete map** (scope choice; rev 2 wording). At low and mid latitudes, 15–18 of the 96 bins have **no value in any cell** of a patch. Single bins can still serve a dated-pass or diurnal feature.
- **One-hour window around noon (11:30–12:30) and around midnight (23:30–00:30)**, unweighted mean of the available bins, with a count of contributing bins (0–4) per cell:

  | Patch | Noon: cells with no bin / spread inside the window (mean, max) | Midnight: cells with no bin / spread (mean, max) |
  |---|---|---|
  | 0–10N far side | 0 / 3.29, 7.72 K | 0 / 0.85, 6.75 K |
  | 0–10N near side | **7 of 200 (3.5%)** / 1.49, 4.75 K | 0 / 1.59, 7.47 K |
  | 30–40S | 0 / 2.43, 12.55 K | 0 / 1.14, 8.18 K |
  | 60–70S | 1 of 200 / 7.17, 54.72 K | 0 / 2.84, 14.34 K |
  | 70–80N | 1 of 200 / 14.52, 73.30 K | 0 / 4.31, 11.58 K |
  | 80–90N | 0 / 26.61, 138.15 K | 0 / 11.79, 48.61 K |
  | 80–90S | 0 / 30.15, 116.55 K | 0 / 14.37, 141.08 K |

  A **two-hour** window fills every cell sampled but doubles the spread at noon (for example 4.41 K mean, 20.20 K max at 0–10N near side).
- **Dawn and dusk windows are unsuitable for a one-hour representative map** (scope choice; rev 2 wording): the spread inside one hour is 18–85 K on average, up to 203 K near the terminator. That spread is real change, which a diurnal feature could show. Only noon and midnight are proposed.
- **By latitude (G4):** midnight spread stays at 2–6 K per row up to 80° in both hemispheres. Noon spread is 4–20 K per row at 60–70°S, rises to 10–20 K at 70–80°N, and reaches tens of K, with rows of only one bin, beyond 80°.

**Cross-checks between products at the same places (X1, X2):**

- **GHRM midnight against the GCP midnight window**, as 0.5° block means at four cells (0°N 0.25°E and 0.75°E; 0°N 180.25°E and 180.75°E): GHRM 102.28, 101.86, 101.98, 101.88 K against GCP 102.78, 102.15, 102.18, 102.15 K. The differences are 0.20–0.50 K, with GCP slightly warmer at all four. The two products are made differently (an empirical fit to midnight on 2009–2022 data at 128 ppd, against a bin mean of 2009–2015 data), but they share the instrument's lineage. **This is corroboration only** (rev 2 wording, after GPT's review). It is not independent absolute accuracy and not proof of registration: smooth ~100 K equatorial night backgrounds could agree even with an indexing error. Registration is to be tested with explicit coordinate and grid tests and deliberate origin and flip controls (proposal rev 2 §7).
- **2016 cycle maps against the GCP at the cell's own local time:** night cycle, 1,752 matched cells, median difference −0.02 K, mean |difference| 4.25 K. Day cycle, 1,322 cells, median +0.14 K, but mean |difference| 23.3 K and 90th percentile 71 K. The day-cycle matches sit mostly at high latitudes, where daytime gradients over 15 minutes and seasons are large. Not interpreted further.

**Mapping-cycle maps (the dated-interval option):**

- One cycle at 4 ppd is **sparse**. In the day cycle from 11 Jan 2016, 19.5% of cells have a value: 44–53% poleward of 60°, but only **4–6% between 60°S and 60°N**. In the night cycle from 25 Jan 2016, 36.8% of cells have a value (20–36% at low and mid latitudes).
- **Local time differs across one map.** In the day cycle the equatorial values sit near 12:00 (12.09–12.17 h medians where present). In the night cycle the median local time drifts from 23:09 to 00:10 across longitude. As the label itself says, the orbit's drift produces "a drift in local time across each map".
- LTIM decodes as DN × 0.0833333333 + 2730.00273000273 (the label's offset). This gives 6.086–18.003 h (label: 6.0102–17.9918) in 5-minute steps, a difference of up to 0.08 h from the label's derived limits. Every TBOL cell has an LTIM value (9,109 and 23,356 LTIM cells have no TBOL).
- Measured page-file size for one cycle at 4 ppd (gzip −9): 394,752 B (day) and 656,026 B (night) as published int16. Re-quantised to 0.1 K uint16: 343,035 B and 524,377 B. These are sparse maps, so a full map will compress less.

### 6.6 What was not fetched

No whole GCP band file, no whole GHRM mosaic, no RDR records, no PCP, no ODE job, no account, no email. Paige et al. (2010), Williams et al. (2017) and Powell et al. (2023) were not read in full text (Science and Icarus are not open access; Powell 2023 was not sought). The GHRM midnight fitting method is described here only as the SIS states it. No hub, R2 or collector request.

### 6.7 Rev 2 changes (26 Nov, after GPT's review of proposal rev 1)

- **GPT's review** is filed unchanged as `reviews/2026-11-26-moon-diviner-proposal-rev1-gpt-review.md` (sha256 `6457efb2…a4b9e`). GPT checked the 13 hashes in `SHA256SUMS.txt`. **GPT's own work, labelled as GPT's:** it recomputed the bin-count distributions and within-window spreads of all seven GCP patches with a separate standard-library parser, and they agree. It did **not** rerun `assess_diviner.py`, because numpy was unavailable to it.
- **Primary source for the general `tbol` meaning:** GPT reports that Powell et al. 2023, JGR Planets 128, e2022JE007532 (https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022JE007532) is openly accessible. GPT says §2.5 explains the equivalent-blackbody interpretation and §2.4 the fitted night-time temperatures. **That is GPT's read.** Claude's own fetch of the page on 26 Nov needed an approval that was not answered, so Claude has **not** read it yet. Claude reads §2.4–2.5 in full text before any build. The GCP's own processing stays sourced to the SIS §8.1 and `gcpds.cat`. The third-party copy of Paige et al. 2010 stays labelled as secondary.
- **`assess_diviner.py` (rev 2):**
  - It now exits with status 1 and prints `STOP: …` when a file is missing, a hash does not match or a structural check fails. Before, it printed `MISMATCH` and carried on.
  - New L1 checks for each GCP sample: whole 113-byte records ending CRLF, 11 numeric fields, the exact coordinate sequence (longitude, then latitude ascending, then 96 local-time bins), sentinels exactly `-9999`/`-9998`, and every other `tbol` finite and inside our plausibility bounds of 1–450 K (the floor keeps valid values clear of the page file's reserved codes 0 and 1). The label documents no bounds, so these are ours; a value outside them stops the script and is never encoded. The binaries are checked for exact size.
  - It looks for each file in `<samples-dir>` and then in `<samples-dir>/diviner/`, which matches the Mac layout (the two older GCP patches in the parent folder, the newer files in `diviner/`).
  - Tested by Claude on 26 Nov:
    - The full run passes (exit 0), and its statistics are identical to the rev 1 output.
    - A copy laid out like the Mac folders gives byte-identical output.
    - One altered byte gives exit 1 (hash). A missing file gives exit 1.
    - `--structure-only` (a test aid that runs L1 on one file without hashes or statistics) catches eight deliberate breaks, each with exit 1: a letter in a field, `tbol` 500 K, `tbol` 0.5 K, sentinel `-9997`, `nan`, a missing CRLF, a wrong longitude and a truncated file.

### 6.8 Claude's own read of Powell et al. 2023 §2.4–2.5 (26 Nov 2026, before the page build)

Read in full on the publisher's page (https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022JE007532) in the built-in browser pane. Title: "High-Resolution Nighttime Temperature and Rock Abundance Mapping of the Moon Using the Diviner Lunar Radiometer Experiment With a Model for Topographic Removal", JGR Planets 128, e2022JE007532. This replaces "GPT's read" in §6.7 for what the two sections say. The GCP's own processing stays sourced to the SIS §8.1 and `gcpds.cat`.

- **§2.5, the meaning used on the page.** One Diviner observation can hold a mixture of temperatures: rocks and small slopes below the instrument's resolution. The channels then disagree, with the shorter wavelengths reading warmer. The bolometric temperature approximates the wavelength-integrated flux from all channels as an equivalent blackbody temperature: in the paper's words, the "total radiative heat flux leaving the surface expressed as an effective temperature". That is why it suits comparison with thermal models. This supports the explainer's two claims: it is an equivalent (perfect-emitter) temperature of the heat measured, and where materials or slopes are mixed it is not the temperature of any one surface.
- **What differs from the GCP:** Powell's bolometric maps are for the GHRM. They use channels 6–9 at night, by the method of Paige, Siegler et al. 2010. The GCP bins use the mean radiances of channels 3–9, per the SIS. So Powell is cited for the general definition only, not for the GCP's processing.
- **§2.4, the GHRM midnight fit (relevant only to the corroboration, §6.5 X1).** For each channel and 128 ppd bin, the night-time cooling curve is fitted with an empirical exponential in local time. Data within half an hour of sunrise and sunset are excluded. A bin needs at least three night observations, with at least one before and one after midnight (a typical bin has about 14). The median fit standard error is 0.74–2.46 K by channel. "Slope-adjusted midnight" shifts the time by the east-west slope. **So a GHRM midnight value is a fitted estimate at exactly 00:00, while our GCP midnight is a mean of up to four published quarter-hour bins between 23:30 and 00:30.** They are expected to differ, and this is one more reason the GHRM comparison stays corroboration with no universal tolerance.
- **Not used from the paper:** rock abundance and regolith temperature (a two-component model, with its own stated limits), and the topographic thermal model (§3).
