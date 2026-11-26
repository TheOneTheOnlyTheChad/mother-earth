# Moon globe: LROC regional detail — assessment and proposal

Rev 1 · 26 Nov 2026 · written by Claude · **docs only: nothing built, no page or hub change, nothing deployed** · for GPT's review

Checklist item §4 of `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`. It answers the LROC part of GPT's brief (`docs/concepts/MOON-LRO-SCIENCE-BRIEF-GPT-2026-11-25.md`, "LROC cameras" row and "Detailed LROC regional imagery can follow as a distinct zoom/region feature"). Chad's go (26 Nov): a docs-only assessment of one bounded, well-documented site, recording the exact product, observation date, resolution, footprint, coordinates and frame, attribution and rights, download size and the proposed interaction, and whether the globe can link honestly to the detail. Bounded downloads, a checkpoint per acquired file, no merge or deployment.

**Evidence:**
- `docs/research/moon-lro-science/lroc/checkpoints.jsonl`: two acquisitions, each checkpointed and pushed before the next began (`3a89ad5`, `2604505`).
- Three evidence views (screenshots of pane renderings, not page assets) on the Mac in `_source-data/moon-lro-science-lroc/`:
  - `view1-site-128m-0.5m-noncentred-screenshot.png` (`ad6c11a6…`)
  - `view2-site-512m-1m-crosshair-at-published-LM.png` (`73a19c16…`)
  - `view3-area-4km-4m.png` (`8de71fe3…`)
- None is committed, under the text-only research rule.

## 0. Bottom line

- **Site:** the Apollo 11 landing site, Tranquility Base.
- **Product:** LROC's own orthophoto of one Narrow Angle Camera observation, **M150368601** (left and right cameras together), taken **22 January 2011, 20:48:53–20:49:11 UTC**. PDS RDR collection `lro-l-lroc-5-rdr`, Apollo 11 NAC DTM set. It comes at 0.50 m and 2.00 m a pixel, map-projected (equirectangular), with an exact footprint, public domain as a PDS product, credit NASA/GSFC/Arizona State University.
- **It registers:**
  - The Lunar Module's brightest pixel is **0.6 m** from LROC's published LM position (0.67416°N, 23.47314°E) in the 0.5 m product, and **2.0 m** away in the 2 m product.
  - Its shadow falls 7–9 m to the east, as a low western Sun requires.
- **The globe cannot show it.** The globe picture is about 5.3 km a pixel. At the closest zoom one screen pixel is about 1.45 km. The whole 4.2 × 28 km orthophoto strip is about 3 screen pixels, and a 512 m site view about a third of one.
- **So the honest link is a marker, not a drape.** The globe turns to the site and marks *where* it is. The detail opens in its own panel beside the globe, as a dated single observation with scale, north, Sun direction and credit. It never claims the globe has this detail anywhere.
- **Proposed page cost:** two JPEGs, loaded only when the feature is switched on. Measured in the pane: about 225 KB for the site view (1,024², 0.5 m) and about 360 KB for the area view (1,055 × 1,000, 4 m), both at quality 0.8. Total about 585 KB.
- **One practical blocker for the build, not for this assessment:** the pane cannot save files to the Mac without Downloads access, which was refused in this session (§7). Decision D5.

## 1. What stays unchanged

- The globe's picture (`assets/moon/lroc_color_2k.jpg`, shared with Tides), its orientation, the polar disclosure and the default even lighting.
- "Lit as now" and "As seen from Earth now", the dated LRO path, and the height and temperature layers, with their state handling.
- Tides (10b, closed decision) and the Sky zoom-out (10a, its own round).
- Hub, R2, D1 and collectors: no change. The feature is page-only, with static files.

## 2. What LROC offers, and why this product (inventory)

Read from the PDS Imaging Node listing and labels, and from LROC's data portal pages, 26 Nov.

| Product family | What it is | Fit for a first regional view |
|---|---|---|
| NAC EDR / CDR single images (e.g. `M150368601LE`/`LC`) | raw and calibrated frames in camera geometry, not map-projected | **No**: needs ISIS projection and pointing; footprint not on a map grid |
| **NAC DTM set orthophotos** (`…/SDP/NAC_DTM/<site>/…_<image>_50CM.IMG`, `_2M.IMG`) | LROC's orthorectified mosaic of the left and right frames of **one** observation, map-projected, tied to LOLA | **Yes (chosen)**: one date, exact footprint, two scales, labelled projection |
| NAC ROI controlled mosaics (e.g. `NAC_ROI_APOLLO11HIB_E006N0235`, 0.40 m) | mosaics of several observations | Not first: several observation times in one picture; the 0.4 m Apollo 11 mosaic is 487 MB as TIF |
| NAC photometry sequences (`NAC_PHO_…`) | repeated images of one site under changing light | Later option: many dates; one could show how lighting changes a site |
| NAC DTM heights (`NAC_DTM_APOLLO11_E008N0234.IMG`, 2 m posts) | regional terrain model | Out of scope here; relevant to option 12a (finer heights, regionally) |
| WAC global mosaics (100 m) | global picture | Already covered in spirit by the globe; not a regional detail |
| LROC website Featured Images and Featured Sites | curated pictures | **Not usable**: LROC's terms say images on its website are copyrighted (§5) |

**Why Apollo 11:** the best-documented site on the Moon, with a published LROC position for the Lunar Module to ±0.3 m (§4.2). That gives a hard registration test that a natural feature cannot. It sits on the near side, close to where the globe opens (0°, 0°). The DTM set publishes an accuracy statement (§3).

**Host note:** `pds.lroc.im-ldi.com/data/…` now redirects to the PDS Imaging Node (`pds.mcp.nasa.gov/data/store/img/lunar_reconnaissance_orbiter/pds4/lroc/lro-l-lroc-5-rdr/…`). The products carry PDS4 labels (label version 2.0, 12 Dec 2025, "Correction to PDS4 labels") with the PDS3 header still attached. Neither shell reaches the host; the browser pane does, with range requests, and with ETags equal to the label MD5s.

## 3. The chosen product: exact facts

**Observation.** NAC M150368601, left and right cameras; 2011-01-22T20:48:53Z to 20:49:11Z (PDS4 label and PDS3 header agree). From LROC's data portal for `M150368601LE`:
- incidence 63.43°, emission 29.02°, phase 34.41°
- pixel scale 0.53 (scaled 0.51 × 0.55)
- centre 0.76°N, 23.36°E; spacecraft altitude 39.03
- sub-solar azimuth 179.85

The portal does not state units. Degrees, metres and kilometres are the evident reading, but they are not confirmed. The azimuth's convention is not stated, so the page will not use it. The Sun's side is taken from the image itself: shadows point east, so the Sun is low in the west (§4.3).

**Products** (both "Science / Derived", producer Arizona State University, RDR product version 1.9):

| | `NAC_DTM_APOLLO11_M150368601_50CM.IMG` | `NAC_DTM_APOLLO11_M150368601_2M.IMG` |
|---|---|---|
| PDS4 LID | `urn:nasa:pds:lro-l-lroc-5-rdr:lrolrc_2001_data:sdp.nac_dtm.apollo11.nac_dtm_apollo11_m150368601_50cm` | `…_2m` |
| Title | Orthophoto (0.50 m/px): M150368601 | Orthophoto (2.00 m/px): M150368601 |
| File size; MD5 | 943,743,920 B; `95decbebbf283e46d6146c47fec988ed` | 59,023,560 B; `187f3d1dac32aff7f00c512ec4907cdf` |
| Header (PDS3, attached) | 16,880 B | 4,222 B |
| Array | 8,440 samples × 55,908 lines, SignedLSB2 | 2,111 × 13,978, SignedLSB2 |
| Missing value | −32768 (other specials −32767…−32765) | same |
| Scale | 0.49999999999999 m/px (1.6489e-5°/px) | 2.0000000000006 m/px |
| Offsets (PDS3) | LINE 74,989.5; SAMPLE 9,497,505.5 | LINE 18,747.5; SAMPLE 2,374,376.5 |

**Map projection:** equirectangular, centre latitude 1.0°, centre longitude 180.0°. Planetocentric latitude, longitude positive east, sphere of radius 1,737.4 km.
- **Footprint** (both): 0.31464201–1.23650584°N, 23.37231647–23.51150435°E. That is about 4.2 km east–west by 28.0 km north–south.
- **Shape:** the strip is not quite rectangular in the map. The edges carry no data: 3.2 % of the 2 m array, and 2.9 % of the proposed area view.
- **Pixel values** are display brightness (DN). The README says: "These orthophotos do not include scale and offset information". The page must not call them reflectance or radiance.

**Accuracy statement (README, 2012):**
- The DTM is tied to LOLA, with RMS 1.81 m against 7.0 LOLA tracks, and SOCET SET precision 0.77 m.
- Known artifacts are listed: boxes, seams, faceting and noise. They concern the DTM heights, not the use of the orthophoto as a picture.
- Reference: Henriksen et al. 2017, Icarus 283, 122–137, doi:10.1016/j.icarus.2016.05.012.

**Label quirks recorded (not errors we rely on):**
- The PDS4 `upperleft_corner_x` is given as +4,748,752.75 m. The PDS3 offsets and the stated bounds imply −4,748,752.75 m, with x increasing east. I used the PDS3 header, which reproduces the stated corners to half a pixel (§4.1), and the landmark test confirms it (§4.2).
- The PDS4 `Element_Array` unit says "Elevation" for an orthophoto. That looks like a template leftover; the README and the title say orthophoto.

**Reference frame (open, does not change the outcome):**
- The label names the radius and the latitude type, not the frame. LROC's published coordinates are in the Mean Earth/Polar Axis frame (NSSDC's Apollo landing site page, citing Wagner et al. 2017).
- I have not read the RDR SIS or the projection catalogue (`DSMAP.CAT`) for the orthophoto frame. Their location is in the README; the SIS is a PDF and stays unread for now.
- At 1.45 km a screen pixel, any difference between the usual lunar frames (well under 1 km) is invisible on the globe. In the panel, the published landmark test is what matters. GPT may ask for the SIS read before the build.

## 4. Verification done

### 4.1 Projection arithmetic

Using the PDS3 header:
- sample = SAMPLE_PROJECTION_OFFSET + 1 + R·cos 1°·(λ − 180°)/scale
- line = LINE_PROJECTION_OFFSET + 1 − R·φ/scale

These reproduce the label's corners: the north-west corner at line 0.5, sample 0.97, and the south-east at 55,908.5, 8,440.97. That is, they are the outer pixel edges, to half a pixel.

### 4.2 Landmark: the Apollo 11 Lunar Module

- **Published position:** 0.67416°N, 23.47314°E, ±0.3 m, from LROC's "Coordinates of Lunar Anthropogenic Targets" list (28 July 2016, mean of several images; Wagner et al.). It is also on NSSDC's Apollo landing site page.
- **Predicted pixel:** line 34,104.92, sample 6,114.65 in the 0.5 m product; line 8,527.11, sample 1,529.54 in the 2 m product.
- **Found:**

  | Product | Brightest pixel (east, north of published LM) | Darkest pixel (shadow) |
  |---|---|---|
  | 0.5 m | −0.33 m, +0.46 m (0.6 m away) | 7.2 m east |
  | 2 m | +0.92 m, −1.79 m (2.0 m away) | 8.9 m east |

  Each search ran within 12 m (0.5 m product) and 16 m (2 m product) of the prediction.
- **Visual check:** a crosshair drawn at the published position sits on the LM's bright body and the start of its eastward shadow. By eye, a small crater lies about 70 m east of the LM and a large bright crater about 500 m east. That fits the site's known layout (Little West crater, then West crater, east of the LM), but it is not a measurement (views 1–3).

**Between the two products:** the whole-window correlation of the 0.5 m block, averaged to 2 m, against the 2 m product is r 0.94 at its best offset. Its peak lies next to the alignment expected from the two products' own offsets (+0.5 row, +0.75 column of the 2 m grid). The landmark test above is the stronger evidence.

**What this does not show:** registration across the whole strip, or against the globe's picture at landmark level (the globe is 5 km a pixel). It also does not cover other sites.

### 4.3 Lighting and appearance

- The incidence is 63°, so the Sun is low, and shadows fall to the east. The panel will say "Sun low in the west; shadows point east" (from the image) and give the observation's UTC time.
- This lighting is fixed in the picture. It is unrelated to the globe's even lighting and to "Lit as now".
- Display stretch, linear and the same for both views: DN 144 → black, DN 239 → white. Those are the 1st and 99th percentiles of the 0.5 m site block. The 2 m product shares the DN scale; its LM peak is lower (268 against 446) because each 2 m pixel averages 16 of the 0.5 m ones.

## 5. Rights and attribution

**From LROC's "Using LROC Imagery" page (read in full in the pane, 26 Nov):**
- **Public domain:** data products available through the LROC Data Node of the PDS or through NASA PDS interfaces. The page lists `pds.nasa.gov` and `pds-imaging.jpl.nasa.gov`, among others.
- **Copyrighted:** images on the LROC website, including Featured Images and Featured Sites. Commercial use of LROC images not downloaded from the PDS archive needs prior permission.
- **Credit:** "NASA/GSFC/Arizona State University" (short form "NASA/GSFC/ASU").
- **Research citations** named: Robinson et al. 2010 (instrument overview); Henriksen et al. 2017 for the DTM products.

**What follows for Mother Earth:**
- Derive both pictures ourselves from the PDS products, never from LROC website images.
- Credit "NASA/GSFC/Arizona State University" on the panel, and cite Robinson et al. 2010 and Henriksen et al. 2017 in Sources.
- The serving host, `pds.mcp.nasa.gov`, is the PDS Imaging Node. It is a NASA PDS interface, but it is not one of the hostnames the terms page lists. I read that as covered ("through NASA PDS interfaces"). I record it as my reading, for GPT and Chad.
- Mother Earth is non-commercial, so the commercial clause does not arise.

## 6. Proposed interaction (Moon tab only)

**Control:** one button, off by default: **"Show a detailed site: Apollo 11 (LROC)"**, `aria-pressed`. Further sites would each be a separate decision (§9).

**When switched on:**
1. **Globe:** turns at once (like the other buttons) to 0.674°N, 23.473°E at the current zoom. A small fixed-size ring marker (about 14 px) is drawn at the site, labelled "Apollo 11 site". The globe's picture, lighting and science layers are untouched.
2. **Line under the globe:** "The ring marks where the detailed image below was taken. The globe's picture is about 5 km a pixel, so this detail cannot show on the globe itself."
3. **Panel below the globe:** loaded only now, with two views as radio buttons:
   - **Area, about 4 km across (4 m a pixel).** Default. The whole strip width, centred north–south on the site. A rectangle marks the site view's footprint.
   - **Site, 512 m across (0.5 m a pixel).** Centred on the published LM position.
4. **Each view carries:**
   - a scale bar
   - "North up, east right"
   - "Sun low in the west, so shadows point east"
   - no-data edges shown in a distinct colour, with "no image data"
5. **Caption:** "One observation by LRO's Narrow Angle Camera (M150368601, left and right cameras), 22 January 2011, 20:48:53–20:49:11 UTC. LROC's map-projected orthophoto from the PDS. Brightness stretched for display; not a measured reflectance. Credit: NASA/GSFC/Arizona State University." Plus a "Details" link to `sources.html#moonlroc`.
6. **Optional pointer (D3):** an arrow to the descent stage, "Apollo 11 Lunar Module descent stage (position: LROC 2016 list)". It would be off by default, behind a checkbox.
7. **Off:** removes the marker and the panel. The globe view stays where it is, as with the other buttons (D4).

**Never said:** that the globe has this detail, that the picture is current, that it shows the Moon "now", or that the brightness is a physical quantity. The date is always shown.

**Pairing (item 9):** none. The picture is from 2011; the dated LRO path is June 2026.

**Interplay:**
- Height and temperature can stay on; the marker sits above them.
- "As seen from Earth now" hides the marker while the Earth view is active, because the site may be on the visible disc but tiny. GPT's view is invited here.
- No new globe redraw cost beyond one marker; the panel images are ordinary `<img>` elements.

**Access and layout:**
- Keyboard: the button and radios.
- Each image gets alt text saying what is visible ("Grey cratered mare. The Lunar Module is the bright dot with a dark shadow to its right…").
- Narrow widths: the panel is full width and the image scales down.
- A failed image load gives a plain "Detailed image unavailable" line, and the marker stays.

## 7. Build data contract (for the later build, not now)

**Assets:**
- `assets/moon/lroc/a11-site-0p5m.jpg`: 1,024 × 1,024, lines 33,593–34,616 and samples 5,602–6,625 of the 0.5 m product (1-based).
- `assets/moon/lroc/a11-area-4m.jpg`: 1,055 × 1,000, 2 × 2 means of the 2 m product, lines 7,528–9,527 (1-based), all samples.
- Both use the stretch in §4.3, are JPEG quality 0.8, and come with a `SOURCE.json` (product LIDs, MD5s, ranges, stretch, crop and the builder's hash).

**Builder:**
- `phase1/moonsci/build_lroc.py --check`, run against retained source files: the whole 2 m file (MD5-checked) and the 17,285,120-byte range of the 0.5 m file (SHA-256 `3bd1b862…a2fa`, recorded at checkpoint 1).
- The JPEG encoder is Pillow, with sizes re-measured. The pane's encoder measured 225 KB and 360 KB, so expect similar.

**Source retention** follows the Diviner rule: the source files go in the Mac's `_source-data/moon-lro-science-lroc/`, not committed. The blocker is that the pane can only save files through Downloads, and Downloads access was refused this session. **D5** asks how to proceed.

**Served-file manifest:** two new asset files plus `SOURCE.json`. `moon.html`, `moonglobe.js`/`moonsci.js`, `sources.html` and `REGISTER.md` would change, with the usual narrow Animals pin maintenance.

## 8. Verification plan for the build

- **Unit (pure):** pixel ↔ coordinate maths against both labels' corners and the LM landmark. Footprint rectangle position.
- **Page suite** (new `moon-lroc-ui`, with deliberate breaks):
  - off by default, with no image request until switched on
  - marker at the site's latitude and longitude, and turn-to on
  - panel facts (date, ID, scale, credit, "not reflectance")
  - radios, keyboard, narrow 360/390/721 px
  - image failure path
  - off removes both
  - independence from height, temperature, "Lit as now" and the LRO path (each state restored)
  - Earth-view interplay
  - no change to `lroc_color_2k.jpg`
- **Asset checks:** `SOURCE.json` hashes; LM brightest pixel within 1 m of the published position in the site JPEG; scale bar length against the pixel scale.
- **Existing suites** stay green: moon-height-ui, moon-diviner-ui, moon-globe, moon-lit, moon-lro-path, moon-light and Animals.
- **Verification limits (item 11):** real phone, Safari, screen reader and hardware renderer are not checked unless done.

## 9. Not proposed now (scope choices, with revisit conditions)

- **Draping regional imagery on the globe:** not honest at 1.45 km a screen pixel. Revisit only with a globe that zooms to kilometre scale, which is a different feature.
- **Other sites** (for example Apollo 15 or 17, Tycho's central peak, Chang'e landers): one at a time, after this one. Each needs its own product check and landmark or feature test.
- **LROC photometry sequences** (lighting change at one site): a possible later option.
- **NAC DTM heights at the site:** belongs with option 12a.
- **The LROC website's Featured Images:** copyrighted (§5); not used.

## 10. Costs: measured, kept apart from estimates

**Measured (pane, 26 Nov):**

| | Value |
|---|---|
| 0.5 m block fetch | 17,285,120 B in 6.3 s |
| 2 m whole file | 59,023,560 B in 12.2 s |
| Site JPEG (1,024², 0.5 m) | 224,518 B at q0.8; 325,419 B at q0.9 |
| Area JPEG (1,055 × 1,000, 4 m) | 360,459 B at q0.8; 502,077 B at q0.9 |
| 512² at 1 m | 71,622 B at q0.8 |

**Estimated:** a page visitor who switches the feature on downloads about 0.6 MB once (cacheable). Nothing is downloaded for visitors who don't.

## 11. Decisions for Chad (after GPT's review)

- **D1 Site:** Apollo 11 (recommended), or another site.
- **D2 Views:** area (4 m) plus site (0.5 m), about 585 KB on demand (recommended). Or the site view only (about 225 KB). Or a lighter area view at 8 m (528 × 500; not measured, expected well under 360 KB).
- **D3 LM pointer:** offered, off by default (recommended); or not offered.
- **D4 Switching off:** leaves the globe where it is (recommended, matches the other buttons); or returns to the previous view.
- **D5 Source retention for the build:** (a) grant the pane's Downloads folder for this work so the source files reach `_source-data/` (recommended); (b) move the needed bytes through the pane in pieces (about 4 MB of crops as base64; slow and heavy); or (c) build the JPEGs in the pane with committed code and keep only hashes, with the archive as the source of record.
