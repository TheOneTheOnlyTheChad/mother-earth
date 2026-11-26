# Moon globe: LROC regional detail — assessment and proposal

Rev 2.1 · 26 Nov 2026 · written by Claude · **docs only: nothing built, no page or hub change, nothing deployed** · for GPT's recheck

**Rev 2.1 (closure):**
- Sources retained on the Mac (retention lines 1–8).
- Volume RDR SIS v1.6 read directly: frame closed, pixel convention defined.
- A one-line offset error in the earlier 2 m pane figures is found and corrected.
- Chad's D5 and D6 are recorded.

The corrections are marked *(2.1)* below. The report is `reviews/2026-11-26-moon-lroc-retention-frame-closure.md`.

**Reviews.** Rev 1 (`9397993`) was reviewed by GPT on 26 Nov: concept and Apollo 11 product supported; **revise before build approval** (R1–R4). The review is filed unchanged as `reviews/2026-11-26-moon-lroc-proposal-rev1-gpt-review.md` (`0e76683a…`). §13 maps each point to its answer.

**Chad (26 Nov):** supports Apollo 11, both views, the optional pointer off by default, and leaving the camera where it is on switch-off. He asked for a docs-only rev 2 addressing R1–R4, with bounded downloads and no build, merge or deployment.

Checklist item §4 of `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`. It answers the LROC part of GPT's brief (`docs/concepts/MOON-LRO-SCIENCE-BRIEF-GPT-2026-11-25.md`).

**Evidence (all on main):**
- **`docs/research/moon-lro-science/lroc/checkpoints.jsonl`:**
  - lines 1–2: the two acquisitions
  - lines 3–4: verification re-reads
  - line 5: retention state, which was **NOT RETAINED** at rev 2 (§8)
  - *(2.1)* retention lines 1–8: each source file retained on the Mac and re-hashed, one at a time
- *(2.1)* **`phase1/moonsci/lroc/lroc_source_check.py`** (numpy, on the retained files) and its output `docs/research/moon-lro-science/lroc/lroc_source_check_output-2026-11-26.txt`: PASS, 0 failures. It supersedes the pane's 2 m figures.
- **`phase1/moonsci/lroc/lroc_geom.py`** (geometry, independent of the pane code) and its output **`docs/research/moon-lro-science/lroc/lroc_geom_output-2026-11-26.txt`**: PASS, 0 failures.
- **`phase1/moonsci/lroc/lroc_pixels.js`** (pane source-pixel checks on unstretched DN):
  - version 1 output: `lroc_pixels_output-2026-11-26.json`, SHA-256 `2ccbe61e…`
  - version 2 output: `lroc_pixels2_output-2026-11-26.json`, SHA-256 `12ca3c1a…`
  - each recorded byte-exact: my copy's hash equals the hash computed in the pane
  - loaded into the pane from main at pinned commits, with the SHA-256 checked before use; the MD5 helper is `mehash.js` (TOOLING v1 hash)
- **Three evidence views** (pane screenshots, not source or build files) on the Mac in `_source-data/moon-lro-science-lroc/`:
  - `view1-site-128m-0.5m-noncentred-screenshot.png` `d9456d23…`
  - `view2-site-512m-1m-crosshair-at-published-LM.png` `75ae93ed…`
  - `view3-area-4km-4m.png` `658a4638…` (575 × 544, a screenshot, not the 1,055 × 1,000 raster)
  - **Correction:** the hash prefixes printed in rev 1 do not match these files. The same files hash identically on the Mac and in my workspace now, with the sizes unchanged. I have not established why the rev 1 values differed. These are visual evidence only.

## 0. Bottom line

- **Site and product (unchanged):**
  - the Apollo 11 landing site
  - LROC's orthophotos of one Narrow Angle Camera observation, M150368601 L/R, 22 January 2011, 20:48:53–20:49:11 UTC, at 0.50 and 2.00 m a pixel
  - PDS `lro-l-lroc-5-rdr`, Apollo 11 NAC DTM set
  - public domain as PDS products; credit NASA/GSFC/Arizona State University
- **Registration claim, narrowed (R1):** the descent stage gives **local agreement at one named landmark, within the image sampling**. LROC's published Lunar Module position is 0.67416°N, 23.47314°E.
  - **0.5 m product:** the single brightest pixel of the whole 512 m site crop (DN 446, no ties) is 0.6 m from that position (−0.33 m east, +0.46 m north).
  - **2 m product:** the LM is a local feature only; a bright crater rim 1.6 km west is brighter. Its brightest pixel within 12 m is **0.95 m** away (+0.92 m east, +0.21 m north). *(2.1: corrected from 2.0 m, which came from reading the 2 m image one line early.)*
  - **Shadow:** in both products it falls 7 m east.
  - **Not established here:** absolute positional accuracy, registration elsewhere in the strip, and registration against the globe's picture. LROC states an orbital position uncertainty of ±15 m for the method behind its coordinate list (§4.4).
- **The globe cannot show the detail (unchanged; numbers corrected):** at the closest zoom one screen pixel is about 1.45 km. The 4.2 × 28 km strip is about **3 × 19 screen pixels**, and the 512 m site view about 0.35 of a pixel. So the globe gets a **locator**, a fixed-size symbol that marks the place and is **not the footprint**. The images go in a separate dated panel (§6).
- **Processing and retention:** an explicit build contract (§7). *(2.1)* The build inputs are retained on the Mac (§8), so nothing blocks a build.

## 1. What stays unchanged

- The globe's picture (`assets/moon/lroc_color_2k.jpg`, shared with Tides), its orientation, the polar disclosure and the default even lighting.
- "Lit as now" and "As seen from Earth now", the dated LRO path, and the height and temperature layers, with their state handling.
- Tides (10b, closed decision) and the Sky zoom-out (10a, its own round).
- Hub, R2, D1 and collectors: no change. The feature is page-only, with static files.

## 2. What LROC offers, and why this product (inventory; unchanged except one row)

| Product family | What it is | Fit for a first regional view |
|---|---|---|
| NAC EDR / CDR single images (e.g. `M150368601LE`/`LC`) | raw and calibrated frames in camera geometry | **No**: needs ISIS projection and pointing |
| **NAC DTM set orthophotos** (`…/SDP/NAC_DTM/APOLLO11/…_M150368601_50CM.IMG`, `_2M.IMG`) | LROC's orthorectified mosaic of the left and right frames of **one** observation, map-projected, tied to LOLA | **Chosen** |
| NAC ROI controlled mosaics (e.g. `NAC_ROI_APOLLO11HIB_E006N0235`, 0.40 m) | mosaics of several observations | Not first: several observation times in one picture |
| NAC photometry sequences (`NAC_PHO_…`) | repeated images of one site under changing light | Later option |
| NAC DTM heights (`NAC_DTM_APOLLO11_E008N0234.IMG`) | regional terrain model | Belongs with option 12a |
| WAC global mosaics (100 m) | global picture | Not a regional detail |
| LROC website Featured Images and Featured Sites | curated pictures | **Not selected: different terms.** LROC's terms call website images copyrighted and permit certain educational uses with citation. We use the PDS route instead (§5). |

**Host:**
- `pds.lroc.im-ldi.com/data/…` redirects to the PDS Imaging Node (`pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/…`).
- The products carry PDS4 labels (version 2.0, 12 Dec 2025) with the PDS3 header still attached.
- Only the browser pane reaches the host; ETags equal the label MD5s.

## 3. The chosen product: exact facts

**Observation:** NAC M150368601 L/R, 2011-01-22T20:48:53Z to 20:49:11Z (PDS4 label and PDS3 header agree).
- From LROC's data portal for `M150368601LE`: incidence 63.43°, emission 29.02°, phase 34.41°; sub-solar azimuth 179.85.
- The portal states no units or conventions, so the page uses none of these values. The Sun's side is read from the image (§4.3).

| | `NAC_DTM_APOLLO11_M150368601_50CM.IMG` | `NAC_DTM_APOLLO11_M150368601_2M.IMG` |
|---|---|---|
| PDS4 LID | `urn:nasa:pds:lro-l-lroc-5-rdr:lrolrc_2001_data:sdp.nac_dtm.apollo11.nac_dtm_apollo11_m150368601_50cm` | `…_2m` |
| Title | Orthophoto (0.50 m/px): M150368601 | Orthophoto (2.00 m/px): M150368601 |
| File size; MD5 (label) | 943,743,920 B; `95decbebbf283e46d6146c47fec988ed` | 59,023,560 B; `187f3d1dac32aff7f00c512ec4907cdf` |
| PDS3 header (attached) | 16,880 B | 4,222 B |
| Array | 8,440 samples × 55,908 lines, SignedLSB2 | 2,111 × 13,978, SignedLSB2 |
| Scale (MAP_SCALE) | 0.49999999999999 m/px | 2.0000000000006 m/px |
| LINE / SAMPLE_PROJECTION_OFFSET | 74,989.5 / 9,497,505.5 | 18,747.5 / 2,374,376.5 |

**Special values (label Special_Constants; R2):**

| Code | Meaning (label) | Our handling |
|---|---|---|
| −32768 | missing | no data |
| −32767 | low representation saturation | invalid for averaging |
| −32766 | low instrument saturation | invalid for averaging |
| −32765 | high instrument saturation | invalid for averaging |
| −32764 | high representation saturation | invalid for averaging |

- **Measured in every array checked:** only −32768 occurs. The four saturation codes count zero in the 17 MB range, the site crop, the area window and the whole 2 m file (`lroc_pixels` outputs).
- **The builder must still handle them.** Saturation codes are kept as their own category: invalid for averaging, shown as "saturated (no value)" if they ever appear, never as no coverage. If any appears in a build window, the build stops for review.
- *(2.1)* **There is no valid-range outlier.** The "DN 24,407" reported in rev 2 was header text, read as pixels at the wrong offset (§4.2). At the correct offset the whole 2 m file's valid range is DN 4–502.

**Pixel values** are display brightness (DN). The README says: "These orthophotos do not include scale and offset information". They are never called reflectance or radiance.

**Map projection** (PDS3 header, CATALOG/DSMAP.CAT read directly): equirectangular, CENTER_LATITUDE 1.0°, CENTER_LONGITUDE 180.0°.
- Planetocentric latitude, longitude positive east, sphere of radius 1,737.4 km (labels).
- DSMAP.CAT's prose says "For the Moon R is assumed to be 1734.4 km". That is a typo against every label; the labels' 1,737.4 km is used.

**Bounds:** the label's bounding coordinates (0.31464201–1.23650584°N, 23.37231647–23.51150435°E) are the **mapped array's bounding box**. They equal the README's "DTM extents" and are identical in both labels. Valid coverage is further limited by the no-data mask: 3.2 % of the 2 m array is −32768.

**Accuracy statement (README):** the DTM is tied to LOLA, with RMS 1.81 m against 7.0 LOLA tracks, and SOCET SET precision 0.77 m. These are **vertical/DTM figures, not the orthophoto's horizontal accuracy**, and are not used as such.

## 4. Verification done

### 4.1 Pixel convention and the label conflicts (`lroc_geom.py`, PASS, 0 failures)

**Formulas:**
- DSMAP.CAT gives `Sample = x/Scale + S0 + 1` and `x = (Sample − S0 − 1)·Scale`.
- Its line equations use a sign of L0 that does not fit the labels' positive LINE_PROJECTION_OFFSET.
- So the script tests three candidate conventions, `line = L0 − y/s + k` and `sample = S0 + x/s + k` with k = 0, 0.5 or 1, against the producer's bounds in **both** products. Integer coordinates are pixel centres; outer array edges are at 0.5 and N + 0.5.

**Result:**
- **k = 1** (DSMAP's "+1" form) fits best in both products.
- **0.5 m product:** the north and south bounds land exactly on the array edges (line 0.500 and 55,908.500). The longitudes sit 0.47 px (0.23 m) inside.
- **2 m product:** the bounds sit about half a pixel inside (worst 0.62 px). k = 1 is separated from the next convention by 0.38 px.
- **The bounds alone are not enough:** in the 0.5 m product they do not separate k = 1 from k = 0.5, which is half a pixel (0.25 m).
- *(2.1)* **Closed by definition.** Both retained PDS3 headers, and the volume SIS v1.6 §6.4, state that the centre of the upper-left pixel is (line, sample) = (1.0, 1.0), and that the offsets run from it to the projection origin, positive right/below ("adopted in November 2011 by the LROC team"). For this product that is exactly k = 1. The bounds test stays as a consistency check.

**PDS4 upper-left values:**
- `upperleft_corner_y` 37,494.75 m equals the y of the **centre** of pixel (1,1).
- `upperleft_corner_x` +4,748,752.75 m has that centre's magnitude with the **opposite sign**.
- We use the attached PDS3 header with DSMAP's arithmetic. Archive metadata is recorded as found, never altered.
- Both label identities (PDS4 LID and the PDS3 PRODUCT_ID) stay in the records.

**Checks:**
- forward/inverse round trips under 1e-9° (LM, PSE, north-west corner)
- the LM's ground position is identical through both grids
- **negative controls** (x sign flipped, axes swapped, one-line shift) are each worse than the adopted convention by at least 0.5 px in both products
- crop offsets and ground bounds are derived in §7

**Anchors are independent of the code under test:** the label bounds come from the producer, and the LM and PSE come from LROC's 2016 list. The JS pane checks use separate code.

### 4.2 Landmark on unstretched source pixels (`lroc_pixels.js`, versions 1 and 2)

**0.5 m product, site crop** (lines 33,593–34,616, samples 5,603–6,626; 1,048,576 valid pixels, none special):
- The crop's single brightest pixel (DN 446, no ties) is −0.33 m east and +0.46 m north of the published LM.
- The intensity-weighted centroid of the two pixels above the threshold is −0.33 m east, +0.25 m north.
- The darkest 3 × 3 mean (DN 39.9), within 16 m east, is 7.2 m east.
- **Control:** the same 12 m search 40 m north-west peaks at DN 277, which is lower.

**2 m product, area window** (lines 7,527–9,526, samples 1–2,110). *(2.1: corrected figures, from `phase1/moonsci/lroc/lroc_source_check.py` on the retained file at the PDS3 image offset of 8,444 B.)*
- The window maximum is a bright crater rim about 1.57 km west, **not** the LM. So "brightest pixel" is not the 2 m test.
- **Local test:** the brightest pixel within 12 m (DN 268, no ties) is +0.92 m east, +0.21 m north. The shadow 3 × 3 minimum (DN 88.1) is 6.9 m east.
- **Control:** 40 m north-west, the same search peaks at DN 261, which is lower but close. **Within ±12 m, the 2 m product supports the LM's position at about the 2 m sample scale; it is not a strong discriminator.**
- **Offset error, corrected (2.1):**
  - The 2 m file's PDS3 header is two records long (LABEL_RECORDS 2, ^IMAGE 3), so the image starts at byte 8,444. The PDS4 label gives 4,222.
  - `lroc_pixels.js` versions 1 and 2 used 4,222 and so read the 2 m image one line (2 m) early.
  - The Python check reproduces each of the pane's 2 m numbers exactly only at the wrong offset, which proves the cause.
  - The 0.5 m figures are unaffected: one header record, and both labels agree on 16,880 B.
  - `lroc_pixels.js` version 3 uses 8,444.

**What this shows:** local agreement at one named landmark, within the image sampling. It supports orientation and crop placement.

**What it does not show:**
- absolute accuracy
- registration elsewhere in the strip
- that a local maximum near a prediction is an independent registration (the search was centred on the prediction)

### 4.3 Lighting

- Incidence is 63°, so shadows are long; they fall east in both products, so the Sun is low in the west.
- This lighting is fixed in the picture and unrelated to the globe's lighting or to "Lit as now".

### 4.4 Coordinates, uncertainty and frame (R1)

**LROC's coordinate list** ("Coordinates of Lunar Anthropogenic Targets", 28 July 2016) and its explanatory page ("Spacecraft Related Coordinates – 2016 Update", 25 Nov 2016) say:
- the coordinates are in the mean Earth/polar axis (ME) system
- they are means from multiple images, computed with ISIS and the GLD100 shape model
- LRO's positions came from cross-over corrected kernels "with an orbital position uncertainty of ±15 m"
- the page also puts the current latitude/longitude uncertainty at about ±15 m
- neither document defines the list's "Uncertainty (m)" column (0.3 m for the LM)

Both were read through the fetch tool's quoting, not as full PDFs.

**So:** the 0.3 m figure is not presented as absolute accuracy. The panel's optional pointer says "position from LROC's 2016 list", with no accuracy claim.

**The orthophoto's frame:**
- **Read directly:** the PDS4 label and the attached PDS3 header name no frame. DSMAP.CAT names none either.
- **Secondary reads:** the RDR SIS v1.2 (1 Dec 2008, pds-imaging copy) says "The coordinate system used is the mean Earth/polar axis system" and that DE421 with its Euler angles defines the Moon's ephemeris. That was read only through the fetch tool's quoting, so it is discovery material, not a direct read.
- **Not read:** the volume's own copy, `DOCUMENT/RDRSIS.PDF` (2,528,722 B, ETag `d52a5420…`). The fetch tool sees only binary data, the pane refused to navigate to it, and loading a PDF reader into the archive page was refused.

**Consistency, not proof:** the orthophoto puts the LM within 0.6 m of LROC's ME-frame coordinate. The ME–principal-axis offset is of order a kilometre, far larger. That is consistent with the orthophoto being in ME, but the two come from the same team's processing, so it is not independent proof.

*(2.1)* **Closed:** the volume's `DOCUMENT/RDRSIS.PDF` was retained (MD5 = ETag) and read directly. It is the LROC RDR SIS **version 1.6, 22 August 2020**.
- **§5.5:** "The coordinate system used is the mean Earth/polar axis system, using planetocentric latitude and east positive longitude direction". The Moon's ephemeris uses de421.bsp and its Euler angles.
- **§5.3:** NAC DTM orthophotos are stored as 16-bit signed values.
- **Table 2 (page 17):** NAC_DTM is "Digital Terrain Models (DTM) and orthophotos created from geometric stereo observations".
- **Appendix B** still carries the 2008 equations and the "1734.4 km" typo. §6.4 and the products' own header notes define the pixel convention used here.

## 5. Rights and attribution

**From LROC's "Using LROC Imagery" page (read in full in the pane, 26 Nov):**
- **Public domain:** data products available through the LROC Data Node of the PDS or through NASA PDS interfaces.
- **Copyrighted:** images on the LROC website. Educational use is permitted with citation; commercial use of LROC images not downloaded from the PDS archive needs prior permission.
- **Credit:** "NASA/GSFC/Arizona State University".

**For Mother Earth:**
- Both pictures are derived by us from the **PDS products** identified in §3. The basis is the product, its LID and label, and the recorded redirect from the LROC PDS host to the PDS Imaging Node, not the domain name alone.
- The panel credits "NASA/GSFC/Arizona State University". Sources cites Robinson et al. 2010 and Henriksen et al. 2017.
- No permission enquiry is needed (GPT concurs). Reuse is not argued from non-commercial status.

## 6. Interaction (Moon tab only) — R3

**Control:** one button, off by default: **"Show a detailed site: Apollo 11 (LROC)"**, `aria-pressed`.

**Switching on:**
1. **Camera:** opening the detail acts like a globe view button, through the existing view call (`set(lat, lng, alt)` in `moonglobe.js`).
   - If the Earth view is active, the camera leaves it the way every view button already does (`leaveEarth()`).
   - "Lit as now" stays as chosen, and the height or temperature mode stays active.
   - The globe turns at once to 0.674°N, 23.473°E at the current zoom. Then the locator is drawn.
2. **Locator:**
   - **Shape:** a ring about 14 px across, fixed on screen, drawn in WebGL at the surface. It is depth-tested, so it is hidden whenever the site is on the far side or past the limb. It never floats over unrelated terrain.
   - **Inert to clicks:** it ignores pointer events and is excluded from picking, so height and temperature readout clicks pass through.
   - **No floating label.** The line under the globe names it: "Ring: locator for the Apollo 11 site (marks the place, not the image's footprint). The globe's picture is about 5 km a pixel, so the detail is shown below."
3. **Panel:** below the globe, with two views as radio buttons. Each image is **lazy-loaded when first selected**.
   - **Area, about 4.2 km across (4 m a pixel).** Default. A rectangle marks the site view's footprint, from §7.
   - **Site, 512 m across (0.5 m a pixel).**
4. **Each view shows:**
   - a ground-distance scale bar that resizes with the displayed image (its length comes from metres per displayed pixel, not a fixed CSS length)
   - "North up, east right"
   - "Sun low in the west, so shadows point east"
   - no-data in a distinct hatched style with the words "no image data", kept apart from dark terrain
   - the caption: "One observation by LRO's Narrow Angle Camera (M150368601, left and right cameras), 22 January 2011, 20:48:53–20:49:11 UTC. LROC's map-projected orthophoto from the PDS, shown at its native pixel spacing of 0.5 m (site) or averaged to 4 m (area); what the eye can resolve depends on your screen. Brightness stretched for display; not a measured reflectance. Credit: NASA/GSFC/Arizona State University." Plus a "Details" link to `sources.html#moonlroc`.
5. **Optional pointer** (checkbox, off by default, site view only): "Apollo 11 Lunar Module descent stage (position from LROC's 2016 list)". No accuracy claim.

**Later Earth view:**
- If the reader chooses "As seen from Earth now" while the detail is open, the panel stays open, the camera is left alone, and the locator is hidden.
- The line under the globe then reads "Locator hidden in the Earth view".
- Returning to the ordinary view brings the locator back, subject to depth hiding.

**Switching off:**
- removes the panel and the locator, and cancels any pending image load
- leaves the camera and zoom where they are (Chad, D4) and does not reopen a previous Earth view
- focus returns to the button

**Loading:**
- Loading is ordered by a request token, as in the science layers. A load that completes after switch-off, or after the other view was chosen, is discarded and never shown.
- **Failure:** "Detailed image unavailable", with a Retry button; the locator stays.

**Dated LRO path:** independent. Both can be on; the path and the locator draw separately. Tests cover the combinations (§9).

**Cost:** the locator's draw cost is to be **measured** after implementation, the same way as the height layer's, not assumed.

**Pairing (item 9):** none. The picture is from 2011; the dated LRO path is June 2026.

## 7. Build processing contract — R2

**Geometry** (all 1-based inclusive, k = 1 convention):
- **Site crop (0.5 m):**
  - extent: lines 33,593–34,616, samples 5,603–6,626, 1,024 × 1,024, inside checkpoint 1's full-width lines
  - the LM's predicted position falls in output pixel (512, 512) (0-based), 0.04 m north and 0.17 m west of that pixel's centre (`lroc_geom.py` output); recorded, not "mathematically centred"
  - all 1,048,576 pixels valid, none special; the builder asserts this
- **Area window (2 m):**
  - extent: lines 7,527–9,526, samples 1–2,110
  - **sample 2,111 (the east edge column) is dropped**, so the width is 4,220 m and the height 4,000 m
  - output 1,055 × 1,000 at 4 m
  - ground bounds of the output's outer edges: N 0.74015568°, S 0.60824413°, W 23.37227576°, E 23.51146363°
  - the site footprint inside the area output (0-based, x right, y down): x 700.5–828.5, y 436.25–564.25; the rectangle is drawn from these numbers

**Downsampling (area only):**
- Each output pixel is a 2 × 2 block. Invalid codes (−32768…−32764) are **excluded before averaging**.
- Output = mean of the valid DN if **at least 2 of 4** are valid; otherwise no data.
- Measured valid counts per block, 0 to 4 *(2.1, correct offset)*: 30,579 / 10 / 1,999 / 10 / 1,022,402. So 30,589 output pixels are no data and 2,009 partial blocks are averaged. Chad accepted this rule and the hatched style (D6).

**No-data mask:**
- JPEG cannot carry an exact categorical mask, so the area view gets a 1-bit PNG mask of the same size, drawn as a hatched overlay.
- The mask comes from the valid-count rule above, not from image brightness.
- No-data pixels in the JPEG are filled with a constant mid grey under the overlay.
- The site view needs no mask (zero invalid pixels; asserted).

**Stretch** (same for both views):
- applied after averaging, on the float mean
- `v = clamp(floor((DN − 144) × 255 / 95 + 0.5), 0, 255)`, so DN 144 maps to 0 and DN 239 to 255
- 144 and 239 are the 1st and 99th percentiles of the site crop
- the LM's brightest pixels (DN > 239) clip to white, which the stretch implies; display only

**Encoding:**
- 8-bit greyscale (mode L) JPEG with no chroma subsampling, quality 80, baseline, not optimised
- Pillow, version pinned at build (12.3.0 in this workspace) and recorded in `SOURCE.json`
- Sizes are **measured from the built files**; rev 1's pane-encoder figures (about 225 KB and 360 KB) are trial numbers only

**Files:**
- `assets/moon/lroc/a11-site-0p5m.jpg`
- `assets/moon/lroc/a11-area-4m.jpg`
- `assets/moon/lroc/a11-area-4m-mask.png`
- `assets/moon/lroc/SOURCE.json`, recording product LIDs and PRODUCT_IDs, MD5s, ranges, crop bounds, k convention, valid rule, stretch, encoder and version, and the builder's hash

**Builder:** `phase1/moonsci/build_lroc.py --check`, from the **retained** source bytes (§8) only.

## 8. Retention of build inputs — R4

*(2.1)* **Now retained** (checkpoint retention lines 1–8): each file was saved by the pane to Downloads, checked there, copied into `_source-data/moon-lro-science-lroc/`, re-hashed and recorded before the next was saved. The Downloads copies are in `~/Downloads/_to_delete-lroc/`. Chad granted Downloads access (26 Nov). The text below records the state before that.

**State before retention:** fetched and checked, **NOT RETAINED** (checkpoints line 5).
- "Complete" in lines 1–2 means fetched and checked, not stored.
- The 0.5 m range is not verified by the archive MD5, which covers the whole file. Its provenance is the 206 status, the exact Content-Range, the total length equal to the label size, the ETag equal to the label MD5, and our SHA-256 `3bd1b862…a2fa`. It was re-fetched twice with the same hash.

**Needed, on the Mac in `_source-data/moon-lro-science-lroc/`, not committed:**
- the checkpoint 1 range (17,285,120 B)
- the whole 2 m file (59,023,560 B)
- both PDS4 labels, both attached PDS3 headers, the README, CATALOG/DSMAP.CAT, and DOCUMENT/RDRSIS.PDF (which also closes the frame read, §4.4)

Each gets a retention line with its path and its re-read hash once stored.

**Blocker:**
- The pane can save files only to `~/Downloads`. My request for this session to read `~/Downloads` was refused twice by the automatic approval check: first "Cowork Folder Access", then "Unauthorized Access".
- I have not repeated it. Its route needs Chad to name the folder himself.

**Fallbacks considered:**
- Moving the bytes through the conversation in base64 pieces is not practical at these sizes. Even the lossless crop subsets (2 MB site, 8.4 MB area source) come to about 14 MB of base64.
- Keeping only hashes is not a build path (GPT, R4).

**D5:** Chad either grants this session access to `~/Downloads` in his own words, or adds the folder with "Add folder" in the Claude desktop app. Then:
1. the pane saves each file
2. I move it into `_source-data/`, re-hash it, and write its retention line before the next file is saved
3. I read the SIS

No other download is needed: the 944 MB 0.5 m file is never fetched whole.

**Checkpoint timing deviation (disclosed):** the two `lroc_pixels` runs (checkpoint lines 3–4) each re-read both already-checkpointed files in one run, so the second fetch began before the first was recorded. These were verification re-reads of identical bytes, and nothing new was acquired or kept. The retention step will write each line before the next file.

## 9. Verification plan for the build — R2/R3

**Source (before encoding), in the builder `--check`:**
- re-hash the retained inputs
- recompute `lroc_geom.py` and the landmark checks of §4.2 on the retained unstretched pixels, plus the four special-code counts
- check the crop bounds and the valid-count histogram against this proposal's numbers
- stop on any saturation code in a window

**Encoded images (tolerances, no brightest-pixel test):**
- dimensions, greyscale, quality and version as recorded
- **orientation:** correlation of each decoded JPEG with the stretched source is above 0.98, and the north–south and east–west flipped controls are below 0.5
- mean absolute difference from the stretched source is at most 3 levels (to be measured and fixed at build)
- the mask equals the valid-count rule exactly (PNG, lossless)
- the decoded site JPEG shows a local feature at the LM's predicted pixel: a white blob covering pixel (512, 512) ± 2 px, which the stretch implies

**Overlays:** the locator latitude/longitude, the footprint rectangle and the pointer come from the geometry (§7) and are tested against those numbers, not against image brightness.

**Page suite (`moon-lroc-ui`, with deliberate breaks):**
- off by default, with no image request until switched on
- turn-to on, from both the ordinary view and the Earth view; the Lit choice and the height/temperature mode kept
- the locator hidden on the far side and past the limb after rotation
- clicks pass through to the readouts
- Earth view while open hides the locator; returning shows it again
- off: camera unchanged, no reopened Earth view, focus to the button
- late loads discarded (off during load; view switched during load)
- failure and Retry
- keyboard (button, radios, pointer checkbox, Retry); narrow 360, 390 and 721 px
- the dated LRO path on and off in combination
- `lroc_color_2k.jpg` unchanged

**Existing suites stay green:** moon-height-ui, moon-diviner-ui, moon-globe, moon-lit, moon-lro-path, moon-light, Animals. Breaks must report "BREAK applied (pattern found)".

**Not verified unless done (item 11):** real phone, Safari, screen reader, hardware renderer. The locator's draw cost is measured, not assumed.

## 10. Not proposed now (scope choices, with revisit conditions)

- **Draping regional imagery on the globe:** not honest at 1.45 km a screen pixel. Revisit only with a globe that zooms to kilometre scale.
- **Other sites:** one at a time, each with its own product check and landmark test.
- **Photometry sequences:** later option.
- **Site heights:** option 12a.

## 11. Costs: measured, kept apart from estimates

**Measured (pane, 26 Nov):**
- 0.5 m range: 17,285,120 B, fetched in 6.3 s; the 2 m whole file: 59,023,560 B in 12.2 s.
- Each `lroc_pixels` run (both re-reads plus checks) took 26–38 s.
- Trial encoder sizes (pane, rev 1): site about 225 KB, area about 360 KB at q 0.8.

**Estimated:** the built files are of the same order; they will be measured at build. A visitor who opens the feature loads one view at a time, on demand. Visitors who don't open it load nothing.

## 12. Decisions

**Chad (26 Nov), on GPT's recommendation:**
- **D1:** Apollo 11
- **D2:** both views
- **D3:** pointer offered, off by default
- **D4:** switch-off leaves the camera where it is

**Also decided (2.1):**
- **D5:** Downloads route granted; sources retained
- **D6:** at least 2 of 4 valid, with the hatched no-data overlay

Nothing is open. A build waits for GPT's recheck and Chad's build go.

## 13. GPT's rev 1 review: where each point is answered

| GPT | Answer |
|---|---|
| R1 frame, conventions, x-sign, narrowed claim, reproducible checks, independent anchors, negative controls, bounds as bounding box | §3, §4.1 (`lroc_geom.py`), §4.2 (`lroc_pixels.js`; corrected by `lroc_source_check.py`), §4.4. *(2.1)* Frame closed by the volume SIS v1.6 §5.5; convention defined by the header notes and SIS §6.4. Claims narrowed in §0 and §4. DTM figures marked vertical. |
| R2 build test, special values incl. −32764, 2 × 2 valid rule, odd column, crop bounds, stretch and encoder, native pixel spacing ≠ screen, 3 × 19 px | §3 table, §7, §9; the caption wording in §6 |
| R3 Earth view, locator vs footprint, occlusion, clicks, loading, late responses, keyboard, focus, LRO path, measured draw cost, scale bars | §6, §9 |
| R4 retention and honest checkpoints, ETag ≠ MD5, Downloads as an authorisation issue | §8; checkpoints lines 3–5 |
| Rights wording; host basis | §2 row, §5 |
| Evidence-image hashes and dimensions | evidence list (header): corrected, and recorded as screenshots only |
