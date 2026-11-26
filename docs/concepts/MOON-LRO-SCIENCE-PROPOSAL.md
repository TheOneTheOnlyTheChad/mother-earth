# Moon globe and LRO science — data assessment and implementation proposal

Rev 2.1 · 26 Nov 2026 · written by Claude · rev 2 passed by GPT's recheck (`reviews/2026-11-26-moon-lro-proposal-rev2-gpt-recheck.md`); 2.1 narrows §11 only · **docs only: nothing built, nothing deployed, no hub change**

Answers GPT's brief "Mother Earth — Moon globe and LRO science" (25 Nov; filed unchanged as `docs/concepts/MOON-LRO-SCIENCE-BRIEF-GPT-2026-11-25.md`). Rev 1 (`efdbf74`) was reviewed by GPT on 26 Nov (relayed by Chad; filed unchanged as `reviews/2026-11-26-moon-lro-proposal-rev1-gpt-review.md`): the elevation-first scope was supported, with changes asked for before any build. §12 lists each change and where it is answered. Evidence: `docs/research/moon-lro-science/SAMPLES.md` (rev 2 additions in its §5), `assess_samples.py` and `measure_browser.cjs`, with their outputs beside them.

**Scope note.** GPT's brief covers the Moon tab. **Chad widened the scope on 26 Nov to every page that shows the Moon.** That is Chad's instruction, not GPT's. Chad's go (26 Nov) also set: elevation first; Diviner assessed separately; keep the Moon's appearance, lighting and dated LRO behaviour; a textured Moon in the Sky zoom-out only as an optional, separately scoped suggestion; measured sample costs kept apart from estimated integration costs. (The brief's header line "Soil is active; Tides remains next" dates from 25 Nov; both are now released.)

## 0. Bottom line

- **First release (proposed, and GPT's recommendation): Moon-tab elevation only.** One optional layer, off by default, colouring the globe by **LOLA `LDEM_4_FLOAT` V3.0**: height relative to a 1737.4 km reference sphere on a 0.25° grid, compiled from data taken 13 Jul 2009 – 29 Nov 2016. It has a colour legend and a click readout of the cell's value.
- **Readout grid decoded losslessly** without any image or canvas path: int16 whole metres, gzip, `DecompressionStream` → `Int16Array`. Tested in Chrome on all 1,036,800 values (0 differ). File 1,776,231 B (measured).
- **North of 89.5°N is withheld**, visibly on the map and in the readout, because the two published versions of this grid disagree there (reproduced; cause not established).
- **Diviner parked** (GPT's recommendation). **Sky zoom-out parked** for its own later round. **Tides unchanged.** Sources and REGISTER get records only when the layer is released.
- Untouched: the shared Moon picture `lroc_color_2k.jpg`, `craft.js`, `sunglobe.js`, the hub and the collectors.

## 1. Inventory

Every place the Moon is shown, confirmed on main (26 Nov):

| Page | Files | What the Moon is today | Labels to keep |
|---|---|---|---|
| Moon tab `moon.html` | `moonglobe.js`, `moonlight.js`, `craft.js`; `assets/moon/lroc_color_2k.jpg`, `moon-light-2026-06-R1.json`, `craft-moon-me-2026-06-R1.json` | Textured globe (NASA SVS CGI Moon Kit picture, 0° longitude at the image centre, poles above 70° from a lower-resolution map), evenly lit by default; calculated "Lit as now" and "As seen from Earth now"; LRO's dated path (10–11 June 2026, one-minute samples, altitude above a 1737.4 km sphere) as an optional overlay | Appearance only, "not how the Moon is lit today" by default; calculated vs dated; no current LRO position |
| Tides `tides.html` | `tides.js` (reads the same `lroc_color_2k.jpg`, one of Tides' 37 served files) | Moon body in the model scene, near side towards Earth; reference picture only | Computed model; appearance only |
| World View, Sky zoom-out | `index.html`, `skyscene.js`, `sky.js` | A plain grey sphere (emissive colour `0x9a9a9a`, no picture) at true size and distance | Distances calculated by JPL Horizons; scale wording |
| Sources `sources.html` | — | Source record of the Moon picture | — |
| Animals, Night lights, Timeline | — | The Moon in words only; **no change** | — |

## 2. Archive facts rechecked

GPT's brief (25 Nov) reported Release 67 (15 Sep 2026), Diviner data through 15 Jun 2026 and LOLA through 13 Jun 2026. **Claude read both PDS pages again on 26 Nov and confirms all three** (SAMPLES §1). The Diviner `-9999` warning covers **RDR point records from 17 Apr 2019**. These are archive coverage statements, never presented as instrument health.

## 3. Elevation: the product

| | LOLA `LDEM_4_FLOAT` |
|---|---|
| Identity | PDS3 `LRO-L-LOLA-4-GDR-V1.0`, product version V3.0; PDS4 `urn:nasa:pds:lro_lola_rdr:data_gridded:ldem_4_float::1.0`; bundle DOI 10.17189/tnyt-7007 (Smith & Neumann 2023) |
| Kind | Laser altimeter returns, geolocated with GRGM900C-based orbits, gridded by the LOLA team. Not a photograph, and not measured at any spacecraft position shown on the page. |
| Period | Data 2009-07-13 to 2016-11-29 (through phase LRO_ES_52); product created 2017-09-15. Multi-year compilation. |
| Quantity, unit | Height relative to a **1737.4 km sphere**, km (float32). Range −8.879 to +10.504 km. Not height above a geoid ("sea level"), not altitude, not height above the local surface. |
| Grid | 1440 × 720, **0.25° grid spacing**: about 7.6 km north–south, and east–west at the equator. East–west spacing shrinks towards the poles (× cos latitude). Equirectangular, pixel registered, planetocentric latitude. |
| Longitude | 0–360° east, first column at 0°E. The page picture has 0° at its centre, so the colour texture is shifted 720 columns; the readout grid keeps the source order and the code converts longitude to column. |
| Frame | Mean Earth / polar axis of DE421 (the same mean-Earth axes as the LRO catalogue) |
| Missing / quality | No missing constant in the label. **North of 89.5°N (rows 0–1): withheld** (§3.2). Every cell has ≥ 64 LOLA returns (`LDEC_4`), so each contains observations. That does **not** show the published value is free of interpolation or smoothing: the label says GMT `surface` gridding was used at higher resolutions and does not describe the 4 ppd gridding in detail. |
| Rights | PDS Geosciences FAQ (read 26 Nov): "Data sets archived in the PDS are in the public domain"; when used in "other applications" they "should be cited appropriately". Citation shown: the bundle DOI and the product LIDVID, as PDS's "Citing PDS4 Data" asks. No endorsement implied. Mother Earth is non-commercial. |
| Newer version | None found (PDS and the LOLA Data Node list the same 2017 file). Review cadence: **yearly** and at each build, against the PDS errata and the Data Node listing; last checked 26 Nov 2026. |

### 3.1 What the checks show (and do not)

- **Landmarks.** The highest cell contains the published LOLA highest point (5.4125°N, 201.3665°E). The lowest cell contains or borders the published Antoniadi low point (sources give about 70.36–70.43°S, 187.2–187.6°E).
- **Orientation and longitude shift.** Against the page's own picture, the correlation between height and brightness peaks at zero offset in longitude and latitude (r 0.520; mirrored 0.339, flipped 0.110). This supports east-positive, north-up and the 720-column shift. It is a whole-map statistic, **not** proof of exact local registration everywhere; that is tested in the browser (§4.5).
- **Seam and band edges:** no step at 0°/360° or at the 45° band edges at this resolution.
- **Precision is not accuracy:** whole-metre encoding is a rounding precision (worst 0.5000 m from the source value). It says nothing about the terrain accuracy of a 0.25° cell value.

### 3.2 North of 89.5°N: withheld

Reproduced in `assess_samples.py` (B3b), with each product converted using its own label's scaling. The float product and the int16 product `LDEM_4` (V3.0, same period, `SCALING_FACTOR 0.5`, metres) agree within one 0.5 m step in **every cell of rows 2–719**. In **rows 0–1** they disagree in 1,038 cells, by up to 1,423 m. The float's top row holds 1,010 exact zeros. The int16's top row holds 1,412 zeros (maximum 0.0 m) and its second row 611, against none in the float's second row. The two labels also describe their inputs differently ("preliminary" vs "geolocated" LOLA data). **The cause is not established.** The page says:

> Values north of 89.5°N are withheld because inconsistencies were found in the source products.

## 4. Elevation: proposed implementation

### 4.1 What the Moon tab gains

- A button **"Show height (LOLA)"** (wording for review; `aria-pressed`; off by default).
- When on, the globe shows a **colour map of height**. One sequential, colour-blind-safe ramp (from the repo's dataviz palette method, checked in light and dark) runs from −9 to +11 km. Colour shows the named quantity only: no hazard, safety or landing meaning, no threshold colours.
- **Withheld area visibly masked:** the cap north of 89.5°N is painted in the colour texture as a neutral grey with diagonal stripes, a pattern the ramp never uses. It has its own legend swatch, "Withheld (north of 89.5°N)". Honest size note: the cap is about 30 km across (15 km radius) on a 3,475 km Moon. On a 2048 × 1024 texture it is the top 3 rows of pixels, so it is visible only when looking down at the north pole and zoomed in. That is why the legend and readout also carry it.
- **Legend** under the globe: the ramp with km ticks, the withheld swatch, and the words "Height above or below a 1737.4 km reference sphere. LOLA laser altimeter, LRO; data 2009–2016; 0.25° grid. Rounded to the metre; not a measure of accuracy. Not live."
- **Click readout:** clicking the globe (or Enter on the keyboard selection point) shows "Lat, Lon (east): +x,xxx m relative to the 1737.4 km sphere · value of the 0.25° cell containing this point". Nearest cell, **no interpolation**, and it says so. North of 89.5°N it reads the withheld sentence in §3.2. Never "altitude", "above sea level" or "above the surface".
- **LRO dated path:** unchanged and still optional; it draws over the height map. Its readout keeps "altitude above the 1737.4 km sphere". No terrain-clearance figure. The legend carries its own 2009–2016 period, so the dated slider never implies the map was measured on that pass.

### 4.2 The lossless readout grid (GPT point 1)

- **Format:** raw int16, little-endian, row-major, 720 × 1440, in the **source's own order** (row 0 at 90°N, column 0 at 0°E). Each value is whole metres relative to 1737.4 km, rounded in float64. **−32768 = withheld** (rows 0–1 only; the build refuses any other −32768). Compressed with gzip level 9 and a zero timestamp, so the build is reproducible byte-for-byte.
- **Decoder in the page:** `fetch` → `arrayBuffer` → SHA-256 checked against the pin → `DecompressionStream('gzip')` → `Int16Array`. No image element and no canvas, so no 8-bit colour path. If the server has already removed the gzip layer (first two bytes not 1f 8b), the bytes are used as they are; the integrity check is then on the decompressed bytes against a second pin. A browser without `DecompressionStream` gets "Height readout needs a newer browser", and the picture globe stays.
- **Lookup:** row = floor((90 − lat) × 4), clamped to 0–719; column = floor((lon mod 360) × 4) mod 1440. This is exactly the index the browser test used.
- **Measured** (`measure_browser.cjs`, Chrome under SwiftShader): file **1,776,231 B**, sha256 `af445001…7d43d`. **All 1,036,800 decoded values equal the same file decoded by Node's zlib (0 differ).** Named cells read back exactly: highest (+10,504 m), lowest (−8,879 m), a zero-metre cell, the first negative cell, withheld cells including the 89.51°N edge, the first kept row at 89.49°N, both sides of the 0°/360° seam, 180°E, and the south pole row. Fetch 50.5 ms and decompress 20.1 ms on a local server (workspace machine; not a phone figure).
- **Smaller options (measured, not recommended):** a 16-bit PNG would be 1,535,821 B but needs a JavaScript PNG decoder (a new library) to stay lossless. 10 m steps would cut the size (a 16-bit PNG at 10 m was 1,118,267 B in rev 1) but coarsen the readout.

### 4.3 Lighting, camera and loading contract (GPT point 4)

The current code has `lit.on` (the "Lit as now" choice), `lit.earth` (the "As seen from Earth now" camera), `enterEarth()`/`leaveEarth()`, and `tickLit()`, which reads the clock once and recomputes. The contract:

1. **Pressing "Show height" while it is off:** the button shows "Height: loading…" (`aria-busy`). **Nothing in the view changes**: the picture, "Lit as now", the Earth-view camera and the LRO overlay all stay as they are while the two files load and pass their checks.
2. **Once both files are ready, in one step:** remember `{litOn: lit.on, earthView: lit.earth}`. If the Earth view is on, `leaveEarth()` (same latitude and longitude, ordinary camera). If "Lit as now" is on, set it off through the existing path (`lit.on = false; tickLit()`), which clears the shading and stops the heartbeat. Then disable both lighting buttons with the line "Sunlight is not drawn on the height map", and swap the texture. Height is shown **evenly lit**.
3. **Failure** (network, 15 s timeout, integrity check, decompression, wrong length, no `DecompressionStream`): **nothing changes**. Picture, lighting and camera stay as they were. The line reads "Height map could not be loaded: <reason>", and the button returns to off.
4. **Pressing it again (height off):** swap the picture back, re-enable the lighting buttons. If "Lit as now" was on before, turn it back on through `tickLit()`. That recomputes for the **current** minute, not the remembered one. **The Earth-view camera is not restored automatically**: its button is available again, and the readout says "Earth view was closed while height was shown". (Any drag or zoom already leaves the Earth view today, and the user has usually moved the globe while height was on.)
5. **LRO overlay:** independent of all of the above in every state.

### 4.4 Files (complete list, GPT's smaller correction)

| File | Change | Note |
|---|---|---|
| `assets/moon/lola/ldem4-m-R1.i16.gz` | **new** (derived) | Readout grid (§4.2) |
| `assets/moon/lola/ldem4-colour-R1.jpg` (or `.webp`) | **new** (derived) | Colour texture 2048 × 1024, 0° at the centre, withheld cap striped |
| `assets/moon/lola/SOURCE.json` | **new** | PDS URLs, sizes, SHA-256 of the float file, both labels and the int16 file used for the comparison; LIDVID, DOI, period, conversion, withheld rule, build script hash, last-checked date |
| `phase1/moonsci/build_lola.py` | **new** | Offline build; refuses any other source file; `--check` rebuilds in memory and compares bytes |
| `moonsci.js` | **new** page file | Button, loading, decode, legend, readout, failure, state contract (§4.3) |
| `moonsci.css` (or a block in `moon.html`) | **new** | Legend and readout styles. **No `style.css` change**, so no stylesheet keys change on other pages |
| `moonglobe.js` | **edit** | A small hook: swap the texture and back, report clicked lat/lon, expose `lit` and Earth-view enter/leave to `moonsci.js` |
| `moon.html` | **edit** | Button, legend block, script tag, Sources-and-method lines |
| `phase1/moon-height-ui.test.cjs` | **new** | §4.5 |
| `sources.html` | **edit, at release** | Height section |
| `REGISTER.md` | **edit, at release** | Entries for LOLA `LDEM_4_FLOAT` and the derived assets |
| `phase1/animals-tab-ui.test.cjs` | **narrow pin update** | The Animals suite pins `moon.html` (13e), `moonglobe.js` (unchanged-file list) and `sources.html` (13b/13e) byte-for-byte |
| served-hash manifest | **new manifest** | `moon.html` is in Tides' 37-file served list. The release adds a new served comparison covering the changed and new files (as the Tides dedication did); Tides' release manifest stays as its record |
| `STATUS.md`, `HANDOVER.md`, `START-HERE.md`, `reviews/…` | records | As usual |

Not touched: `lroc_color_2k.jpg`, `tides.*`, `craft.js`, `sunglobe.js`, `index.html`, `skyscene.js`, `style.css`, `phase1/worker.js`.

### 4.5 Tests

New suite `phase1/moon-height-ui.test.cjs`, plus the build's `--check`. Each check has a deliberate break that must fail, run against the old code first.

- **Lossless decode, end to end in the browser:** every value of the decoded asset equals the build's integers. Named cells: negative, zero, both extremes, withheld (including the 89.51/89.49°N edge), and 50 random cells against the PDS float rounded to whole metres.
- **Texture and click mapping (GPT point 3):**
  - Click (or point) at the landmarks: the readout gives the right cell's value.
  - Either side of 0°/360° and of 180°.
  - Exactly on cell boundaries (e.g. 0.25° steps) and just inside each side.
  - Near both poles.
  - The colour under a clicked point matches the colour the ramp gives for the readout value (pixel check on a synthetic grid with patches at known cells, as `moon-globe.test.cjs` does for the picture).
- **Withheld mask visible:** at the north-pole view, zoomed in, the striped grey is on screen; the legend swatch is present; the readout gives the withheld sentence.
- **State contract (§4.3):**
  - While loading, the view is unchanged (camera, lit state, uniform).
  - On success, Earth view is left and lit is off and disabled.
  - On failure (404, timeout, bad hash, bad gzip, short file, no `DecompressionStream`), everything is unchanged.
  - On switching off, the picture is back and lit is restored to its earlier choice for the current minute; Earth view is not restored and its button is available.
  - The LRO overlay is untouched throughout.
- **Behaviour kept:** with height never switched on, `moon-globe`, `moon-light`, `moon-lit` and `moon-lro-path` pass unchanged.
- **Rendering and network (GPT point 4):** no height requests while off; one request per asset on first use, none on later toggles. Draw calls and animation-frame callbacks over 5 s idle measured with the same method as the baseline (§5), height off and on. The proposal does not claim the globe pauses when idle, because it does not today.
- **Keyboard and screen reader:** button reachable, selection point moved by arrow keys, Enter reads, readout in an `aria-live="polite"` region, focus never thrown away.
- **Narrow layout:** 360, 390 and 721 px with the text-node box check.
- **Regression:** Animals (with the narrow pins), `skycraft-ui`, `skycraft-hub`, `desktop-overflow`, and the Tides suites (to show no effect). **Phone, Safari and screen-reader checks on real devices recorded separately.**

## 5. Rendering: measured baseline (GPT point 4)

Rev 1 said the globe "renders only on interaction". **That was wrong and is withdrawn.** Measured on the current `moon.html` (unchanged), idle 5 s after start: **216–269 WebGL draw calls and 1,944–2,421 animation-frame callbacks per 5 s** (two runs, reduced motion on and off; SwiftShader). The globe redraws continuously, about one draw per frame. The layer adds no mesh: it swaps the texture on the same sphere. So the expected draw count is unchanged, and this is to be **measured** on the branch with the same script. Pausing the globe's loop when idle would cut the cost for every globe page. It is a separate, later question for Chad, not part of this release.

## 6. Costs

**Measured (26 Nov):**

| Item | Value |
|---|---|
| Readout grid, int16 + gzip (proposed) | **1,776,231 B**; browser decompress 20.1 ms; fetch 50.5 ms (local server) |
| Colour texture, placeholder ramp, 2048 × 1024 | JPEG q85 275,530 B · WebP q85 172,860 B |
| Source file (offline build only) | 4,147,200 B; 3.05 s in the pane |
| Current globe, idle | 216–269 draw calls / 5 s (§5) |

**Estimated (to measure on the branch):** about **1.95–2.05 MB** downloaded the first time height is switched on (grid plus texture), nothing extra otherwise. Code: `moonsci.js` 250–350 lines (the state contract adds to rev 1's estimate), `moonglobe.js` hook under 40 lines, build script about 150 lines. Hub, R2, Workers, collectors: none.

## 7. Page by page

- **Moon tab:** gains the optional height layer. Keeps orientation, buttons, zoom, polar disclosure, default even lighting, "Lit as now", "As seen from Earth now", the LRO dated example and all its labels.
- **Tides:** no change. The Moon there is a picture in a computed model of the tide mechanism.
- **Sky zoom-out:** **parked** for its own later round (GPT and Chad). The rev 1 notes on option S1 (same picture, near side towards Earth, libration not shown, +457,942 B, new pixel tests) stand as the starting point for that round.
- **Sources and REGISTER:** records at release only, with the narrow Animals pin update.

## 8. Diviner: parked

Diviner is not part of this release, and no download or averaging decision is needed now (GPT's recommendation). The assessment stays on record (SAMPLES §3). Two sampled patches cannot establish worldwide coverage. Any later proposal will show, for every cell, the count of contributing local-time bins and the missing share. It will describe the result as an **unweighted mean of available local-time-bin values**. And it will keep the GCP's `-9999` (empty bin) apart from the RDR's 2019 processing gap.

## 9. Not in scope

Live or current-position anything; LRO prediction; LROC detailed imagery; CRaTER, LEND, LAMP, Mini-RF; observation footprints (none shown, none inferred from the marker); terrain displacement; a terrain-clearance figure; pausing the globe's render loop; any hub, R2 or collector change.

## 10. Decisions for Chad (after GPT's recheck)

- **D1** First release = Moon-tab height only (recommended by Claude and GPT).
- **D2** Whole-metre int16 grid, lossless, 1.78 MB (recommended), disclosed as rounding, not accuracy.
- **D3** Evenly lit while height is on, with the §4.3 contract (recommended by Claude and GPT).
- **D4** Sky Moon and Diviner: parked (recommended by Claude and GPT).

## 11. Notes for the Sun thread

- Keep three kinds of thing apart in words and code: reference composites, dated measurements compiled over a period, calculated views.
- Read the exact label, and compare sibling products: here a second published version of the same grid exposed the polar inconsistency. Its cause stays unstated until known; the wording says "inconsistencies were found", not a guessed explanation.
- Numbers in images: ordinary canvas readback (`getImageData`) gives 8-bit components by default; other formats exist but were not used here. For values, a typed array (here int16 little-endian + gzip + `DecompressionStream`, read with an explicit little-endian decode) avoids the question; test the decode end to end in a real browser, with assertions that fail.
- A whole-map correlation shows orientation, not local registration; test clicks at landmarks, seams, cell boundaries and poles.
- Measure rendering before describing it: the Moon globe redraws continuously while idle. Only the Moon globe was measured; that result does not establish how any other globe page behaves (the Sun globe should be measured on its own).
- `craft.js` untouched; no pairing of timed measurements with a trajectory without a verified epoch, timescale and frame.

## 12. GPT's rev 1 review: where each point is answered

| GPT point | Answer |
|---|---|
| 1 Lossless browser decoding route; end-to-end comparison incl. negatives, zero, extremes, missing; recalculate size and cost | §4.2 (int16 + gzip + `DecompressionStream`, no canvas; all 1,036,800 values, 0 differ; named cells; 1,776,231 B; 20.1 ms) |
| 2 Reproduce the float/int16 comparison with labels, scaling and hashes; withheld wording; visible mask | §3.2 (`assess_samples.py` B3b; SAMPLES §5); wording as GPT gave it; striped cap + legend swatch + readout (§4.1). The script's opening claim narrowed to what it computes. |
| 3 Narrow registration, coverage and resolution claims; test texture and click mapping | §3 table, §3.1, §4.5 |
| 4 Lighting/camera on enable, disable and failure; don't switch the view before assets are ready; measure rendering | §4.3, §5 |
| Smaller: complete affected-file list; direct PDS data-use guidance | §4.4; §3 Rights (PDS Geosciences FAQ) |
| Recommendations: Moon-tab elevation only; whole-metre lossless; evenly lit with restoration; Sky later; Diviner parked | §0, §7, §8, §10 |

## 13. GPT's rev 2 recheck: implementation notes carried into the build

GPT passed rev 2 as a build proposal (26 Nov; filed unchanged). Notes to carry into the build and tests, without another proposal round:
- Decode the grid as **explicit little-endian** (`DataView.getInt16(i, true)`), or check host byte order before using `Int16Array`.
- **Cancellation and rapid toggles:** each load carries a token; a late response must not turn on a layer the user has since switched off (and aborts the fetch).
- **Assertions, not prints:** the evidence comparisons (every decoded value, named cells, withheld marker, rounding bound) become failing checks in `phase1/moon-height-ui.test.cjs` and the build's `--check`.
- **Two integrity pins, checked independently:** one for the compressed file, one for the decompressed bytes; whichever path the response takes, its own pin must match.
- §11 narrowed (rev 2.1, above).
