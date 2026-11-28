# Moon item 7 — LAMP (LRO's far-ultraviolet spectrograph): assessment and proposal

Rev 2 · 28 Nov 2026, written from 06:31 UTC / 08:31 SAST (clock reading; rev 1 05:55 UTC) · Claude · **docs and focused evidence only: no new acquisition, page build, merge, deployment or hub change** · for GPT's recheck, then Chad's decisions.

**Chad's go, rev 1 (28 Nov 2026):** "Continue with Moon item 7: LAMP. Start with archive documentation, then assess one suitable product and a small, bounded sample. Record wavelength bands, quantity and units, observation period, coverage, projection/frame, missing-data rules, processing, rights and size. Keep far-ultraviolet measurements distinct from visible photography and inferred frost or water. Checkpoint and retain each acquired file before proceeding. Return a docs-only feasibility assessment and proposal for GPT review. No page build, bulk acquisition, merge, deployment or hub change."

**Chad, rev 2 (28 Nov 2026):** "Please read GPT's saved LAMP rev 1 review and address R1–R4 in proposal rev 2, with focused evidence. No new acquisition, page build, merge or deployment. Return for GPT's recheck before my decisions."

**GPT's rev 1 review:** `reviews/2026-11-28-moon-lamp-proposal-rev1-gpt-review.md` (filed unchanged; sha256 `c19ca4c8…f88d24f`, equal to the Mac copy). **REVISE BEFORE BUILD.** GPT found LAMP feasible and the south-polar Lyman-α view a reasonable candidate. Its four points:
- **R1:** source corrections and naming the quantity;
- **R2:** narrower orientation wording and the finer-check specification;
- **R3:** numeric data, clipping, outliers and states;
- **R4:** the exact grid, reprojection and loading rules.

GPT independently reproduced the hashes, the 5,023,277 / 4,966,208 pixel counts, the 53,013 SNR correspondence, the 311,757 shown cells (rev 1's crop) and the coarse orientation result.

- **Checklist:** `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`, item 7.
- **Evidence:** `docs/research/moon-lamp/`. New in rev 2: `assess_lamp_2.py` and `check_lamp_frame.py` rev 2.
- **Retained source files:** Mac `~/Documents/Mother Earth/_source-data/moon-lro-science-lamp/` (unchanged; nothing new acquired).

## 0. Bottom line

**Feasible; ready for a branch preview once Chad has the decisions in §10.**

- **What would be shown:** Mother Earth's 960 m mean of the archive's south-polar, night-side, cumulative Lyman-α albedo estimates.
  - Source: LAMP GDR V1.0, 240 m polar stereographic grid, 80–90°S, LRO's first year (September 2009 to September 2010).
  - These estimates depend on an illumination model. The average is ours; it is not a new measurement at 960 m.
- **Orientation:** the transform adopted (reading B) agrees with the archive's own descriptive text and is strongly corroborated by a coarse terrain diagnostic. The archive's printed algebra, combined with its display keyword, is inconsistent with that text (§5). Registration at 240 m is not established; a bounded finer check is specified for Chad to authorise or not (D6).
- **Numbers:** they are carried in a separate numeric plane in integer thousandths. Every shown cell's three-decimal readout equals the exact rounding of its mean. Colour is a separate display step with an honest "at or above" top bin. Measured size: 233,132 B gzip for all three planes (§8).
- **Outliers:** quality-0 does not guarantee a plausible value. 27 native good pixels exceed 1 (largest 119.84), and 55 shown cells are at or above 0.08 (largest 31.07). The recommended policy is to keep them as archived and disclose them in the readout; a plausibility mask is costed but not adopted (§8.3, D8).
- **Kept separate, as before:** far-UV is not visible light and this is not a photograph. The layer does not identify ice, frost or water, and gives no cause for dark areas. The archive's "H2O absorption feature depth" ratio maps are not proposed.

## 0a. GPT's R1–R4 and what rev 2 does

| Point | GPT asked | Rev 2 |
|---|---|---|
| R1 | Use the retained SIS footnote on the band edge; name the quantity as an illumination-model-dependent estimate; read Gladstone et al. (2012) §1–2 for the model; separate nominal spacing from effective resolution | §4.3, §4.4a, §4.5. The footnote was missed because my plain-text export of the Word file dropped footnotes (disclosed; the HTML export recovers all four anchors). Gladstone et al. (2012) §1–2 read directly in full text (§4.5) |
| R2 | Precise orientation wording; explicit equations, index bases and cardinals; codes 4 and 6 only; the independence caveat; crater darkness secondary; specify the finer check | §5 rewritten; `check_lamp_frame.py` rev 2 (codes 4 and 6, two baselines, distinct-cell count, eight readings, cardinals); §5.4 finer-check specification (candidate DEM, size, method, controls) |
| R3 | 8-bit colour loses the readout; clipping hides values; quality-0 outliers need a policy; define states | §8: numeric uint16 plane, states S0–S5, the clipping rule, and outlier policy options with counts (`assess_lamp_2.py`) |
| R4 | Crop and origin offset; the no-source wedges; the actual LEND texture size; reprojection, loading and the build plan | §6–§8: pad to 2504 (nothing dropped), explicit cell-centre equations and pole index, wedges measured, texture corrected to 2880 × 1440, resampling rule, §8.5 bounded build plan |

## 1. Scope (unchanged)

- In scope: one product assessment and the proposal for one optional, off-by-default layer on `moon.html`.
- Left alone:
  - the existing Moon appearance, lighting and dated path;
  - the other science layers;
  - the Sky and Tides Moons;
  - the hub, R2 and all other pages.
- Not used: no trajectory pairing (item 9) and no current LRO position (item 13).

## 2. What was read

As in rev 1, plus:
- **`DOCUMENT/DPSIS.DOC` and `ARCHSIS.DOC` re-exported to HTML** (LibreOffice) so that footnotes appear. DPSIS has three footnotes on four anchors: the upper-edge note and two "day side data will be included in later deliveries" notes. ARCHSIS has the upper-edge note.
- **Gladstone, G. R., et al. (2012), "Far-ultraviolet reflectance properties of the Moon's permanently shadowed regions", JGR Planets, doi:10.1029/2011JE003913.** I read §1 and §2 (including Tables 1–2) directly in full text in the browser pane. §3–4 were not read.
- **LOLA polar products, PDS Geosciences Node:** the directory listing and one label (`ldem_75s_240m.lbl`) were read in the pane; nothing was downloaded (§5.4).

## 3. Acquisitions (unchanged from rev 1; nothing new)

| # | File | Bytes | sha256 |
|---|---|---|---|
| 1 | `lamp-docs-labels-2026-11-28.json` (37 items as exact bytes) | 1,839,519 | `ac21b553…4708b1` |
| 2 | `LAMP_80s_240mpp_lya_albed_01.img` | 25,020,004 | `896aa35d…8af2e2` |
| 3 | `LAMP_80s_240mpp_lya_dqual_01.img` | 25,020,004 | `3f071a9e…ff2754` |
| 4 | `LAMP_80s_240mpp_lya_error_01.img` | 25,020,004 | `8300ecb4…415141` |

- All four are MD5-matched to the archive's own list and checkpointed: `docs/research/moon-lamp/checkpoints.jsonl` (`1f17e6ef…db452c3`).
- Total: 76,899,531 B. The full map volume is 694 × 25,020,004 B = 17.36 GB; no further acquisition is proposed.

## 4. The product

### 4.1 LAMP and the GDR

- **Instrument:** an ultraviolet spectrograph with a passband of 57.5–196.5 nm.
- **Observing:** on the night side and in permanently shadowed regions, door open.
- **GDR V1.0:** CODMAC Level 5 maps of nine types in four bands, cumulative for the nominal mission plus monthly for most types.
- **Producer and dates:** D. E. Kaufmann, SwRI; cumulative maps created 15 Feb 2011; data set released 15 Mar 2011.
- **Later releases:** none. The only map volume is LROLAM_2001; the 2024 PDS4 bundle holds raw and calibrated data only.

### 4.2 The sample: south-polar cumulative Lyman-α albedo

- **Format:** IEEE float32, little-endian, 2501 × 2501, no header, scale 1, offset 0.
- **Label quantity:** "albedo as a dimensionless fraction".
- **Grid:**
  - polar stereographic on a 1,737.4 km sphere;
  - nominal spacing 240 m per pixel, true at the pole. This is nominal grid spacing, not an independently established effective resolution (Gladstone et al. 2012 note that the map grid oversamples the projected size of a LAMP spatial pixel);
  - square coverage: the edge midpoints reach 80.13°S and the corners 76.08°S.
- **Frame:** Mean Earth/Polar Axis of DE421.
- **Period:** labels 2009-09-01 to 2010-10-01; catalog 2009-09-16 to 2010-09-14 (§4.4f).
- **Values inside 80°S:**
  - 4,966,208 of 5,023,277 source pixels are finite and quality 0;
  - good pixels run 0.0198 (1st percentile), 0.0364 (median), 0.0618 (99th percentile);
  - but quality 0 includes large values: 6,306 above 0.08, 39 above 0.2, 27 above 1, largest 119.84 (§8.3);
  - all 141 negative values carry flag 2 or 6.

### 4.3 What the stored number is (R1)

- **Brightness:** calibrated photons, less a modelled background (detector dark and stray light), divided by exposure (SIS steps 4–7; the background step for cumulative products only).
- **Albedo:** that brightness divided by an integrated illumination map built from "FUV illumination models" (SIS steps 8–10).
- **Gladstone et al. (2012) §1–2 describe the general workflow:**
  - the night-side illumination is reflected interplanetary-medium Lyman-α plus far-UV starlight;
  - the interplanetary part comes from model fits to SOHO/SWAN sky data, with its solar-driven variation taken from TIMED/SEE;
  - the starlight comes from IUE fluxes of the 1000 brightest stars in the passband;
  - LOLA topography sets the fraction of sky visible from each surface point;
  - albedo is brightness ÷ illumination;
  - the paper restricts its maps to solar zenith angle above 91°.
- **What the paper does not settle for this file:**
  - **Implementation not verified for this archived file.** The paper used 18 months of data and describes its own maps. Whether the archive's GDR V1.0 used the same model version, star list or zenith-angle cut is not stated in the archive and is left unverified.
  - **Uncertainty.** The paper gives LAMP's absolute sensitivity accuracy as about 15% (a calibration statement, not a total albedo uncertainty). Its SNR contours are Poisson-only per 240 m pixel and exclude systematic errors.
- **The shown quantity's name (for the page and Details):** "Mother Earth's 960 m average of the archive's Lyman-α albedo estimates (LAMP GDR V1.0, night side, Sept 2009 – Sept 2010). Albedo here is the measured far-UV brightness divided by a modelled night-time illumination."
  - Not "brightness", not a picture, not a direct model-free measurement.
  - A lower value is a lower archived estimate.

### 4.4 Disagreements in the archive (revised)

| # | Point | Sources | Outcome |
|---|---|---|---|
| a | Lyman-α band | SIS text and catalog: 119.57–123.57 nm. Labels: 119.57–125.57 nm | **explained by the retained SIS and Archive SIS footnote:** in practice the upper edge is extended to 125.57 nm to include Lyman-α photons displaced by a detector peculiarity. Nominal range 119.57–123.57 nm; operational range 119.57–125.57 nm, which is what the labels record (and the paper's "119–125 nm"). Rev 1's "unresolved" withdrawn |
| b | "Error" maps | catalog: "statistical errors (noise) … photons/cm2". Labels: "the signal-to-noise (SNR) ratio" | **SNR, on the label's explicit statement, corroborated by data:** flag 2 ("SNR < 3") equals error < 3 on all 53,013 pixels. This agreement is not an independent calibration of SNR or a total-uncertainty model (per the paper, the SNR is Poisson-only per pixel) |
| c | Flag 1 | label: "1 = NaN" | contradicted by data (7,838 NaN albedos; flag 1 on one). **Rule:** finiteness is checked separately |
| d | Value 5 | label lists 0, 1, 2, 4, 6 | undocumented (449 pixels; 448 NaN). Not shown; meaning not guessed; **not** treated as a peak flag |
| e | Monthly quality and error maps | SIS: none; catalog: all but ratio | the listing confirms none |
| f | Period | labels: 2009-09-01 to 2010-10-01; catalog: 2009-09-16 to 2010-09-14 | unresolved; the page says "Sept 2009 – Sept 2010", Details give both |
| g | Projection inverse | DSMAP prints `X = SIN(LON)`, `Y = COS(LON)` | radius omitted; with `R·SIN`, `R·COS` forward and inverse agree |
| h | Orientation | DSMAP prose versus DSMAP algebra with `LINE_DISPLAY_DIRECTION = UP` | the prose and the adopted reading B agree; the algebra and the display keyword together imply A (§5) |

### 4.5 What the literature says (revised)

- **Gladstone et al. (2012), read (§1–2):**
  - from 18 months of night-side maps, most south-polar permanently shadowed regions (Haworth, Shoemaker, Faustini among them) are less reflective at far-UV than their surroundings. Typical Lyman-α values are about 0.028 in shadowed regions against about 0.036 outside;
  - exceptions include Shackleton;
  - low-SNR caution applies near permanently lit regions.
  - These are the paper's longer-period values and **are not validation targets** for this one-year archive file.
- **Named only, not read (abstracts in search results):** Rojas et al. (APS 2013) and Magaña et al. (JGR 2022, 2023). The latter use later data and different off-band and on-band edges.
- **For the page:**
  - the layer does not identify ice, frost or water and states no cause for dark areas;
  - Details may say that LAMP science teams have studied these questions in published work, without stating their conclusions or any quantity.

## 5. Orientation (R2, revised)

### 5.1 Indices, coordinates and the adopted transform

- **Indices:** the stored array has 2501 records ("lines") of 2501 samples, in file order.
- **Coordinates:** with 1-based line J (J = 1 is the first stored record) and 1-based sample I:
  - `x = (I − 1251) · 240 m` and `y = (J − 1251) · 240 m`. This is DSMAP's `(I − N/2 − 0.5) · scale` with N = 2501 and real division;
  - zero-based: `x = (i − 1250) · 240`, with i = I − 1;
  - the pole is pixel (I, J) = (1251, 1251), zero-based (1250, 1250);
  - the radius on the sphere is `r = √(x² + y²)`, and the latitude is `φ = −90° + 2·atan(r / (2 · 1,737,400 m))`.
- **Reading B (adopted):** `λ = atan2(x, −y)`, east-positive, 0–360°.
  - Longitude 0° lies towards the first stored record, 90°E towards the last sample, 180° towards the last record, and 270°E towards the first sample.
  - Checked: the four mid-edge positions (1251,1), (2501,1251), (1251,2501) and (1,1251) give 0°, 90°, 180° and 270°.
  - Displayed with the first record at the top, this is DSMAP's prose for the south: longitude 0 straight up from the centre, 90°E to the right.
- **Reading A (printed algebra):** `λ = atan2(x, y)` with J counted from the first record, as `LINE_DISPLAY_DIRECTION = UP` would imply. It puts longitude 0 towards the last record, contradicting the prose.
- **Inverse for B** (latitude and longitude → I, J; the printed inverse lacks R):
  - `r = 2R · tan((90° + φ)/2)`;
  - `I = 1251 + r · sin λ / 240`;
  - `J = 1251 − r · cos λ / 240`.

### 5.2 Coarse terrain diagnostic (`check_lamp_frame.py` rev 2)

- **Method:**
  - I placed the 8,153 pixels flagged with the documented sunlit-peak codes **4 or 6** (value 5 excluded) between 80°S and 88°S on the released LOLA grid (`ldem4-m-R1.i16.gz`, 0.25° cells);
  - I measured how high they sit above two baselines: (a) good map pixels in the same LOLA row, as in rev 1; (b) the whole LOLA row over all longitudes, GPT's baseline.

| Reading | (a) above same-row good pixels | (b) above full LOLA row |
|---|---|---|
| **B adopted: λ = atan2(x, −y)** | **+2,049.6 m** | **+2,023.7 m** |
| A rotated −90° | +793.9 m | +775.5 m |
| transpose | +487.6 m | +478.4 m |
| B mirrored E–W (= A rotated 180°) | +158.5 m | +159.2 m |
| **A as printed: λ = atan2(x, y)** | −68.0 m | −68.8 m |
| anti-transpose | −384.4 m | −382.2 m |
| A rotated +90° | −469.3 m | −461.3 m |
| A mirrored E–W | −621.9 m | −613.3 m |

- **Ranking:** B ranks first on both baselines, by 1,255.7 m and 1,248.2 m. These agree with GPT's independent figures: 8,153 pixels; B about +2,024 m, A about −69 m, next about +776 m.
- **Dependence:** the 8,153 flagged pixels fall in only 1,574 distinct LOLA 0.25° cells, and neighbouring flags belong to the same ridges. They are not thousands of independent registration measurements; the result is one strong coarse discrimination among eight symmetries.
- **Secondary, descriptive only (not used to choose the frame):** read with B, the 10 km discs at Shoemaker, Faustini, Haworth and Cabeus are darker than same-latitude controls (`assess_lamp_1.py`). This matches the direction Gladstone et al. (2012) report from longer data.

### 5.3 What this does not establish

The diagnostic does not test:
- translation or sub-pixel offset;
- arbitrary small rotation;
- scale;
- registration at 240 m.

LOLA's 0.25° rows are about 7.6 km apart. A small registration offset could leave this statistic unchanged, so it **must not be the only shipping check.**

### 5.4 Proposed finer check (D6; needs Chad's go for one bounded download)

- **Candidate DEM:** LOLA `LDEM_75S_240M` V2.0, PDS Geosciences Node (`lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_75s_240m.img`).
  - Size: **29,062,688 B**. Format: 3812 × 3812 LSB int16, 0.5 m per DN, height relative to 1,737.4 km.
  - Projection: polar stereographic centred on 90°S, 240 m per pixel, projection offset 1905.5 pixels.
  - Frame: Mean Earth/Polar Axis of DE421. Data 2009-07-13 to 2017-02-02.
  - Read from its label in the pane; not downloaded.
  - It shares LAMP's projection and spacing, but its pole lies at a pixel corner (an even grid), while LAMP's lies at a pixel centre. The expected relative offset of 120 m on each axis is itself a test of the transform.
- **Method:**
  - **Tiles:** nine or more tiles of about 60 × 60 km spread over 80–89°S and all longitude quadrants, each with relief.
  - **Feature 1:** the sunlit-peak mask (codes 4 and 6) against DEM local relief (height minus its 5 km-radius mean). The relief gain is scored over integer shifts of −4 to +4 pixels on each axis, with a parabolic sub-pixel peak fit.
  - **Feature 2:** high-passed LAMP albedo (quality-0 finite) against DEM slope magnitude, by normalised cross-correlation over the same shifts.
  - **Result per tile:** the horizontal residual (dx, dy) in metres from both features, and the median and maximum over tiles.
- **Controls:**
  - the same procedure on deliberately reflected (A), rotated (90°, 180°) and shifted (±2 and ±4 pixel) LAMP inputs must recover the applied shifts or lose the peak;
  - shuffled tiles must show no peak.
- **Outcomes:**
  - **pass:** median residual ≤ 240 m and no tile beyond 480 m with both features agreeing;
  - **offset found:** a consistent shift is reported and Chad decides whether to apply a documented correction;
  - **inconclusive:** features too weak in too many tiles. Stated so; not converted into a pass.
- **Cost:** one file of about 29 MB, checkpointed and retained as before; docs-only evidence for GPT.

## 6. Display options and reprojection (R4, revised)

- **The globe texture LEND generates is 2880 × 1440**, not 2048 × 1024 (rev 1 error, corrected): 8 pixels per degree, longitude 0 at the centre column.
  - South of 80°S that is 80 rows, about 3.79 km per row. A column near 85°S is about 0.33 km across, so the texture greatly oversamples longitude near the pole.
- **What a viewer sees on the globe:** the rendered detail is set by the texture and globe geometry (about 3.8 km rows), not by the 960 m grid. The 960 m grid is the readout's resolution and the colour source.

| Option | What it shows | Payload (measured) | New code |
|---|---|---|---|
| **L1** globe layer (recommended) | colours painted into the 2880 × 1440 globe texture south of 80°S from the 960 m grid; readout at the centre of view reads the 960 m cell | 233,132 B gzip (three planes, §8.1) | low; reuses the LEND controller |
| L2 polar panel (optional, later) | its own polar stereographic view at 480 m; no reprojection | to be measured if chosen (needs a 2-block origin of its own) | medium |
| 240 m on the globe | not proposed | — | heavy |

- **Resampling rule (L1):**
  - each texture pixel south of 80°S takes the latitude and longitude of its centre, applies the reading-B inverse (§5.1), and maps to a 960 m cell (§7);
  - **nearest cell, no interpolation**;
  - its colour comes from that cell's state and value. Cells not shown use the state hatches (§8.2);
  - no blending across invalid or masked cells, so no new colour boundaries are made.
- **Recommendation unchanged:** L1 only for this item.

## 7. Grid: exact layout and origin (R4)

- **Padding, not cropping:**
  - the 2501 × 2501 source is padded to **2504 × 2504** by appending 3 records and 3 samples of "no source" at the far end (after the last record and sample), giving **626 × 626 cells of 4 × 4 pixels (960 m)**;
  - rev 1's crop to 2500 would have dropped 818 inside-cap source pixels, 26 of them usable (`assess_lamp_2.py`);
  - nothing is dropped and the origin is unchanged.
- **Cell centres** (0-based cell column c, row r; projected metres before the reading-B sign):
  - `x_c = (4c + 1.5 − 1250) · 240` and `y_r = (4r + 1.5 − 1250) · 240`;
  - geographic: `φ` from `√(x² + y²)` as in §5.1, `λ = atan2(x_c, −y_r)`;
  - the pole lies at fractional cell index **312.125** on each axis, 120 m from the nearest cell centre. The grid is **not** re-centred on the pole, and the header records the origin.
- **Masking order:**
  1. native pixels outside the 80°S circle are set to "outside the cap" **before** aggregation;
  2. a native pixel **qualifies** if it is inside the cap, finite, and quality 0. Codes 1, 2, 4, 5 and 6 and any other code do not qualify;
  3. per cell: `n_in` is the number of inside-cap source pixels (0–16; padded pixels count as no source), and `n_q` is the number of qualifying pixels;
  4. the mean is the arithmetic mean of the qualifying pixels' float32 values in float64.
- **No-source wedges:** the 80°S circle (projected radius 304,005.6 m) reaches 3.9 km beyond the square's edge (half-width 300,120 m) around 0°, 90°, 180° and 270°E. That is about 1,005 km² in all, with no source pixels. They get their own state (S5): no extrapolation, never read as "north of 80°S", and no indexing outside the array.
- **Point lookup (readout):**
  1. φ > −80°: "outside the map";
  2. otherwise apply the reading-B inverse to fractional (I, J). If outside 0.5 ≤ I, J < 2501.5: S5;
  3. otherwise take the cell as `c = floor((I − 0.5)/4)` and `r = floor((J − 0.5)/4)` (0-based), then that cell's state.
- **Tests:** they must check positions against independent known points (the pole cell, the four cardinal mid-edges, named crater centres), not only forward-inverse round trips, which pass with a shared offset.

## 8. Numeric file, states, outliers and readout (R3)

### 8.1 File (L1)

- **Name:** `assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin`, gzip-compressed, fetched only when the layer is switched on.
- **Header:** fixed size, little-endian. It holds:
  - a magic and the format version;
  - the grid (626 × 626), the block size (4) and the native size (2501, padded to 2504);
  - the cell size (960 m), the sphere radius, and the origin constants in §7;
  - the orientation constant for reading B;
  - the value scale (thousandths) and the sentinel 65535;
  - the colour-scale end (80 thousandths);
  - the source albedo, quality and SNR sha256, and the builder version.
  - The page checks the magic and version, every constant, length and sha256 before use (pinned), and refuses on any mismatch.
- **Plane 1, value:** uint16, the cell mean in **integer thousandths**, rounded half away from zero from the float64 mean (means are never negative under the quality rule; the builder asserts it); **65535 = no value**.
  - Verified: all 311,803 shown cells' readouts equal Python `Decimal` ROUND_HALF_UP of the float64 mean.
  - The largest value is 31,069 (31.069), so it fits.
  - A valid zero would read "0.000"; there are none in this file.
- **Plane 2:** uint8 `n_q` (0–16) in bits 0–4. Bit 7 is set when any qualifying pixel in the cell exceeds 1 (9 cells).
- **Plane 3:** uint8 `n_in` (0–16).
- **Sizes (measured):** raw planes 1,567,504 B; **gzip -9: 233,132 B for all three** (value plane alone 213,934 B).
- **Builder:** `phase1/moonsci/build_lamp.py --check` rebuilds byte-for-byte from the retained sources (hash-pinned, layout from the labels, reading B).
- **Rev 1's 8-bit route is withdrawn:** 24,979 shown, unclipped cells would read differently from their true three-decimal mean (maximum quantisation error 0.000157), and 55 cells share the top code. GPT found 24,974 by its own float64 route; the point is the loss, not the exact count.

### 8.2 States (cell and point)

| State | Rule | Readout (draft wording) | Map |
|---|---|---|---|
| S0 shown | `n_q ≥ 8` | value (§8.4) | colour |
| S1 too few usable | `n_in ≥ 8`, 1 ≤ `n_q` ≤ 7 | "No value here: only n of this cell's 16 archive pixels pass the quality and finiteness rules (8 needed)." | hatch A |
| S2 no usable value | `n_in ≥ 8`, `n_q` = 0 | "No value here: the archive has no usable value in this cell (missing, or flagged by the archive's quality map)." | hatch A |
| S3 map edge | 1 ≤ `n_in` ≤ 7 | "Edge of the map: fewer than half of this cell lies inside the 80°S circle and the map's square." | hatch B |
| S4 outside | φ > −80° | "LAMP's map covers 80–90°S; north of that the usual picture is shown." | usual picture |
| S5 no source | inside 80°S but beyond the map's square | "Inside 80°S but beyond the edge of LAMP's map square; nothing is filled in." | hatch B |

Counts (cells with at least one inside-cap source pixel): **S0 311,803**, S1 1,779, S2 366, S3 935 (`assess_lamp_2.py`). S0 includes 300,895 cells with all 16 of 16 pixels qualifying.

### 8.3 Outlier policy (R3; D8)

- **Observed, not interpreted:**
  - inside 80°S, 27 qualifying native pixels exceed 1 (largest 119.84), 39 exceed 0.2, and 6,306 exceed 0.08;
  - the 39 above 0.2 have SNR 3.1–15.5 (median 4.6). Only 4 lie within 1 km of a documented sunlit-peak flag (median distance 6.8 km), so they are not explained by proximity to flagged peaks;
  - at 960 m, 55 shown means are at or above 0.08, 5 exceed 1, and the largest is 31.07;
  - 9 shown cells contain a native value above 1.
- **P1, retain and disclose (recommended):**
  - values are kept as archived;
  - the colour is the top bin "at or above 0.080" (from the numeric plane, value ≥ 80);
  - the readout always prints the numeric mean;
  - cells with bit 7 add: "This average includes archive values above 1; they are shown as archived, and their cause has not been assessed here."
  - No silent clipping before averaging, no inferred cause.
- **P2, Mother Earth plausibility mask (costed, not adopted):** exclude qualifying native values above 1 before averaging.
  - It changes the value of those 9 cells and no cell's state. 46 means would remain at or above 0.08 (largest 0.169).
  - It would need a stated rationale. Albedo above 1 would mean more light returned than the model's incoming light, which points at the illumination estimate or calibration, but that is an interpretation not established here.
- **The SNR product** is not turned into an error bar. The readout may give the count of qualifying pixels, never a ± from SNR.

### 8.4 Readout (S0) and colour

- **Readout:** "Lyman-α albedo estimate 0.036 (Mother Earth's 960 m average of n of 16 archive pixels; LAMP night side, Sept 2009 – Sept 2010; measured far-UV brightness ÷ modelled night-time illumination)."
  - Three decimals from the integer, written as a string.
  - Values ≥ 0.080 add "(above the colour scale)".
- **Colour:** a fixed one-hue ramp from 0 to 0.080 in 80 steps of 0.001 from the integer value; one distinct top colour for ≥ 0.080.
- **Wording rules (unchanged):**
  - "far-ultraviolet (Lyman-α, about 121.6 nm): light our eyes cannot see. Not a photograph";
  - "starlight and sky glow reflected on the night side";
  - "this layer does not identify ice, frost or water".
  - No cause for dark areas is given.

### 8.5 Bounded build plan (for the later branch preview)

- **Builder tests:**
  - hash-pinned inputs and output; layout from the labels;
  - header semantic validation (every constant);
  - byte-identical rebuild;
  - an independent source-to-output recomputation of a random 2,000-cell sample and all edge, pole and outlier cells;
  - known-point positions (pole cell 312/312, the four cardinal mid-edges, crater centres) under B, with reflected, rotated and one-pixel-shifted controls failing;
  - the coarse frame diagnostic on the built grid as a guard, not the release criterion (§5.3);
  - mutants on the magic, sha, orientation constant, origin, sentinel and rounding.
- **Page tests:**
  - off by default; one request, lazy; a timeout covering fetch, decode, validation and texture preparation;
  - malformed header, length, coordinates, flags and non-finite cases refused;
  - late-result disposal; cancellation and retry; atomic science-layer replacement through the existing controller;
  - lighting save and restore and Earth-view behaviour as for LEND;
  - every state S0–S5 at chosen points, including the pole, a seam at 0°/360°, a wedge, an edge cell and an outlier cell;
  - the clipping and readout text, and rounding against the oracle;
  - keyboard and narrow layout;
  - the existing Moon suites and narrow Animals pins as before.
- No broad regression sweep during this docs revision.

## 9. Not proposed, with revisit conditions (unchanged)

| Not proposed | Revisit if |
|---|---|
| The off/on "ratio" ("H2O absorption feature depth") maps | Chad asks, with its own assessment |
| North pole | Chad's go for one more bounded file |
| Other bands, brightness, monthly maps | Chad asks |
| 240 m on the globe | after L2, if wanted |
| Later LAMP maps (2009–2016, new bands) | a citable map release appears |
| Day-side maps | archived |

## 10. Decisions for Chad (after GPT's recheck)

- **D1** Product: south-polar cumulative Lyman-α albedo, GDR V1.0 (recommended).
- **D2** Form: L1 globe layer (recommended); L2 later if wanted.
- **D3** Grid: 960 m cells from the padded 2504 grid, `n_q ≥ 8`, states S0–S5 (§7–§8.2).
- **D4** Numbers and colour: the uint16 thousandths plane and readout; colour 0–0.080 with a distinct top bin.
- **D5** Wording: §4.3 name and §8.4 rules.
- **D6** Finer frame check: one bounded download of `LDEM_75S_240M` (29.1 MB) and the §5.4 method before release (recommended), or accept the coarse diagnostic with its limits stated.
- **D7** North pole: not now (recommended).
- **D8** Outliers: P1 retain and disclose (recommended), or P2 mask native values above 1 with the stated rationale.

## 11. Verification limits (item 11)

- The frame is coarse-checked only (§5.3). The crater comparison is descriptive. The illumination model's implementation for this file is unverified.
- The SNR is Poisson-only per pixel (per the paper), not a total uncertainty.
- The counts come from one band and one pole.
- For any later build, the usual four untested areas (real phone, Safari, screen reader, hardware renderer) remain unless actually done.

## 12. Records and delivery

- Proposal rev 2; evidence `docs/research/moon-lamp/` (README; `assess_lamp_1.py`, whose payload section is the withdrawn rev 1 route; `assess_lamp_2.py`; `check_lamp_frame.py` rev 2; outputs; checkpoints).
- GPT's review filed; checklist rev 38; STATUS and HANDOVER; Mac mirror preserve-first; Project copy.

## Change log

- Rev 1 (28 Nov 2026, 05:55 UTC): assessment, bounded sample (four files), orientation finding, options and decisions.
- Rev 2 (28 Nov 2026, 06:31 UTC): GPT's R1–R4. Band-edge footnote applied (rev 1 missed it: plain-text export dropped footnotes); quantity named as a model-dependent estimate; Gladstone et al. (2012) §1–2 read; orientation wording narrowed, with equations, cardinals, codes 4 and 6, both baselines and the dependence; finer check specified (LDEM_75S_240M, method, controls, outcomes); texture corrected to 2880 × 1440; padded grid and exact origin; numeric uint16 plane (8-bit route withdrawn); states S0–S5; outlier policy options with counts; bounded build plan. No new acquisition.
