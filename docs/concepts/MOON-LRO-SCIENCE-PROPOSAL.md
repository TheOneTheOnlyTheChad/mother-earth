# Moon globe and LRO science — data assessment and implementation proposal

Rev 1 · 26 Nov 2026 · written by Claude for GPT's review · **docs only: nothing built, nothing deployed, no hub change**

Answers GPT's brief "Mother Earth — Moon globe and LRO science" (25 Nov; filed unchanged as `docs/concepts/MOON-LRO-SCIENCE-BRIEF-GPT-2026-11-25.md`). Evidence, URLs, hashes and every measured number: `docs/research/moon-lro-science/SAMPLES.md` and `assess_samples.py`.

**Scope note.** GPT's brief covers the Moon tab. **Chad widened the scope on 26 Nov: every page that shows the Moon is to be considered for an upgrade from this work.** That is Chad's instruction, not GPT's, and GPT reviews this proposal on that basis. Chad's go (26 Nov) also set: elevation first; Diviner assessed separately; keep the Moon's appearance, lighting and dated LRO behaviour; treat a textured Moon in the Sky zoom-out as an optional, separately scoped suggestion; keep measured sample costs apart from estimated integration costs. The brief's header line "Soil is active; Tides remains next" dates from 25 Nov; both have since been released and closed.

## 0. Bottom line

- **First release (proposed): one optional layer on the Moon tab, "What LRO measured: height"** (exact wording for review). It colours the globe by **LOLA `LDEM_4_FLOAT` V3.0**: height relative to the 1737.4 km reference sphere, 4 cells per degree (7.6 km), compiled from data taken 13 Jul 2009 – 29 Nov 2016. It has a colour legend and a click readout of the cell's value. Off by default.
- **Diviner: assessed, not proposed for the first release.** A bounded example is feasible: two maps of bolometric brightness temperature "around local noon" and "around local midnight" from the Global Cumulative Product (2009–2015 compilation). But building them needs either the whole 2.8 GB product or about 700 multi-range requests, and a one-hour local-time window chosen by us. Proposed as stage 2, after GPT and Chad decide on those two points (§6).
- **Other pages:** Tides unchanged. The Sky zoom-out could get the Moon picture as an **optional, separately scoped** change (§5.3). Sources and REGISTER get the new records when (and only when) the layer is released.
- **Nothing changes** in the shared Moon picture `lroc_color_2k.jpg`, `craft.js`, `sunglobe.js`, the Tides page and its 37-file served list, the hub or the collectors.

## 1. Inventory (requirement 1)

Every place the Moon is shown, confirmed on main `6acbe54` (26 Nov):

| Page | Files | What the Moon is today | Labels to keep |
|---|---|---|---|
| Moon tab `moon.html` | `moonglobe.js`, `moonlight.js`, `craft.js`; `assets/moon/lroc_color_2k.jpg`, `moon-light-2026-06-R1.json`, `craft-moon-me-2026-06-R1.json` | Textured globe (NASA SVS CGI Moon Kit picture, 0° longitude at the image centre, poles above 70° from a lower-resolution map), evenly lit by default; calculated "Lit as now" and "As seen from Earth now"; LRO's dated path (10–11 June 2026, one-minute samples, altitude above a 1737.4 km sphere) as an optional overlay | Appearance only, "not how the Moon is lit today" by default; calculated vs dated; no current LRO position |
| Tides `tides.html` | `tides.js` (reads the same `lroc_color_2k.jpg`, listed in Tides' 37 served files) | Moon body in the model scene, near side towards Earth; reference picture only, not used by the tide maths | Computed model; appearance only |
| World View, Sky zoom-out | `index.html`, `skyscene.js`, `sky.js` | A plain grey sphere (emissive colour `0x9a9a9a`, no picture) at true size and distance | Distances calculated by JPL Horizons; scale wording |
| Sources `sources.html` | — | Source record of the Moon picture | — |
| Animals, Night lights, Timeline | — | Mention the Moon in words only (moonlight in night images, tidal history); **no change** | — |

Shared-file rules from the handover apply: `craft.js` drives LRO and Parker (not touched here); `sunglobe.js` feeds Tides' Sun builder (not touched); `sources.html` and `index.html` are pinned byte-for-byte by the Animals suite (`TIDES_MAIN` `54cbc0d`, 13b/13e, and `SOIL_MAIN` for `index.html`/`layers.js`); any release touching them needs a narrow, reviewed pin update in `phase1/animals-tab-ui.test.cjs`.

## 2. Archive facts rechecked (Claude, 26 Nov; GPT's reads labelled apart)

GPT's brief (25 Nov) reported Release 67 (15 Sep 2026), Diviner data through 15 Jun 2026 and LOLA through 13 Jun 2026. **Claude read both PDS pages again on 26 Nov and confirms all three** (SAMPLES §1). The Diviner warning turned out to be specific: it covers **RDR point records from 17 Apr 2019** (channel 1–2 brightness temperatures missing in 99.25% of products, about 1.1% of channels 3–9; `-9999` in the RDR's `tb` column; processing errors, not the instrument). These are archive coverage statements. The page will not present them as instrument health.

## 3. Elevation: the product (requirement 2)

| | LOLA `LDEM_4_FLOAT` |
|---|---|
| Identity | PDS3 `LRO-L-LOLA-4-GDR-V1.0`, product version V3.0; PDS4 `urn:nasa:pds:lro_lola_rdr:data_gridded:ldem_4_float::1.0`; bundle DOI 10.17189/tnyt-7007 (Smith & Neumann 2023) |
| Kind | **Measurement-derived grid**: laser altimeter returns, geolocated with GRGM900C-based orbits, gridded by the LOLA team. Not a photograph, not a measurement made at any spacecraft position shown on the page. |
| Period | Data 2009-07-13 to 2016-11-29 (through phase LRO_ES_52); product created 2017-09-15. Multi-year compilation. |
| Quantity, unit | Height relative to a **1737.4 km sphere**, km (float32). Range −8.879 to +10.504 km. |
| Grid | 1440 × 720, 0.25° cells (7.58 km), equirectangular, **pixel registered**, planetocentric latitude |
| Longitude | 0–360° east; first column starts at 0°E. The page picture has 0° at its centre, so the grid is shifted by 720 columns (verified, §3.1). |
| Frame | Mean Earth / polar axis of DE421 (the same ME axes as the LRO catalogue) |
| Missing / quality | No missing constant in the label. Every cell has ≥ 64 returns at this resolution (`LDEC_4`). **The top row (89.875°N) has 1,010 fill zeros, and the top two rows disagree with the int16 version by up to 1.4 km**, so 89.5–90°N is shown as "no value". |
| Rights | NASA PDS data, no product-specific licence found. Cite the bundle DOI and the LIDVID (PDS "Citing PDS4 Data" guidance, read 26 Nov). NASA's media guidelines, already recorded in REGISTER for the Moon picture, are a reading of general guidance, not a grant for this file. No endorsement implied. Mother Earth is non-commercial. |
| Newer version | None found (PDS and the LOLA Data Node list the same 2017 file). Review cadence proposed: **check yearly** and at each build, against the PDS errata and the Data Node listing. |

### 3.1 Validation done on the real file

- **Published points:** the highest 4 ppd cell contains the published LOLA highest point (5.4125°N, 201.3665°E). The lowest cell (70.25–70.50°S, 187.50–187.75°E) contains or borders the published Antoniadi low point, whose coordinates vary by source (about 70.36–70.43°S, 187.2–187.6°E).
- **Against the page's own picture:** correlation between height and brightness peaks at zero offset in longitude and latitude after the 720-column shift (r 0.520; mirrored 0.339, flipped 0.110). The grid lands on the picture to within one 0.25° cell.
- **Seam** at 0°/360°: no step (0.181 km mean vs 0.228 km typical neighbour difference).
- **45° band edges:** no step at 4 ppd.
- **Coverage:** no zero-count cells; no interpolation-only cells at this resolution.
- **Poles:** north fill found (above). South pole rows plausible and consistent between versions.

### 3.2 Why 4 ppd, not finer

The picture on the page is 2048 × 1024 (about 5.3 km per pixel at the equator). At 4 ppd (7.6 km) the height layer is about as sharp as the picture and every cell is measured. 16 ppd would be 66 MB as float and would rely on interpolation in some cells. It needs tiling and is a later, separate step if wanted. Polar stereographic LOLA grids (much finer near the poles) are also a later option.

## 4. Elevation: proposed implementation (requirements 4–8)

### 4.1 What the Moon tab gains

- A new button beside the existing ones, **"Show height (LOLA)"** (wording for review; `aria-pressed`, off by default).
- When on, the globe's picture is replaced by a **colour map of height**. One sequential, colour-blind-safe ramp (taken from the repo's dataviz palette rules, validated in light and dark) runs from −9 to +11 km. Colour shows the named quantity only: no hazard, safety, landing or "difficulty" meaning, and no threshold colours.
- **Legend** under the globe: the ramp with km ticks and the words "Height above or below a 1737.4 km reference sphere. LOLA laser altimeter, LRO; measured 2009–2016; 7.6 km cells. Not live."
- **Click readout:** clicking the globe (or pressing Enter on a keyboard-selected point, §4.4) shows "Lat, Lon (east): height +x.xxx km relative to the 1737.4 km sphere (the 0.25° cell's value)". It reads the cell containing the point: nearest cell, **no interpolation**, and it says so. 89.5–90°N reads "No value: the source grid's top rows are fill." The readout never says "altitude", "above sea level" or "above the surface".
- **Polar disclosure:** the existing one stays. When height is on it gains: "Height covers both poles; the topmost half-degree in the north is left blank."
- **Lighting:** height is shown **evenly lit**. While it is on, "Lit as now" and "As seen from Earth now" are set off and disabled, with a line saying why ("Sunlight is not drawn on the height map"). This avoids reading shadows as height. *(Decision D3 for Chad: alternative B allows sunlight over the height colours.)*
- **LRO dated path:** unchanged and still optional. It can show over the height map. Its readout still says altitude above the 1737.4 km sphere. **No terrain-clearance figure** in this release (it would pair 7.6 km multi-year cells with a 2026 one-minute sample; GPT's requirement 6). The dated slider never implies that the map was measured on that pass (requirement 7): the legend carries its own 2009–2016 period.

### 4.2 Files (proposed, all new except the two named edits)

| File | Kind | Note |
|---|---|---|
| `assets/moon/lola/ldem4-m-R1.png` | **Derived** 16-bit greyscale PNG, 1440 × 720, whole metres + 10,000 | Readout grid, shifted so 0° is at the centre; north rows 0–1 stored as 0 = "no value". Max rounding error 0.5 m (measured). |
| `assets/moon/lola/ldem4-colour-R1.jpg` (or `.webp`) | **Derived** colour picture, 2048 × 1024 | The ramp applied to the grid; the globe texture while height is on |
| `assets/moon/lola/SOURCE.json` | Record | Source URLs, sizes, SHA-256 of the PDS file and the label, LIDVID, DOI, period, conversion, fill rule, build script hash |
| `phase1/moonsci/build_lola.py` | Offline build | Reads the PDS file (hash pinned), refuses any other, writes both assets and prints their hashes; `--check` rebuilds in memory and compares |
| `moonsci.js` | New page file | Layer button, legend, readout, loading, failure. Fetches the two assets **only when the button is first pressed**; checks size and SHA-256 before use. |
| `moonglobe.js` | **Edit** (small) | One hook to swap the globe texture and back, and to report clicked lat/lon; nothing else changes |
| `moon.html` | **Edit** | The button, the legend block, one script tag, Sources-and-method lines |

`lroc_color_2k.jpg` is not touched, so the Tides page, its served list and its suites are unaffected.

### 4.3 Costs

**Measured on the real sample (26 Nov, `assess_samples.py`):**

| Item | Measured |
|---|---|
| Source file (fetched once, offline, never by the page) | 4,147,200 B; 3.05 s in the pane |
| Readout grid as 16-bit PNG (whole metres) | **1,535,833 B** (int16 + gzip −9 would be 1,778,840 B) |
| Colour picture, placeholder ramp, 2048 × 1024 | JPEG q85 275,530 B · WebP q85 172,860 B · PNG 1,852,886 B |
| Colour picture, 1440 × 720 | JPEG q85 174,149 B · WebP q85 131,288 B |

**Estimated (not measured; to be measured on the branch):**

- Page download when height is first switched on: about **1.7–1.8 MB** (grid + colour picture). Nothing extra on load or while the layer is off.
- PNG decode of the grid: tens of milliseconds on a laptop (estimate). Readout lookup: constant time.
- Code: `moonsci.js` about 200–300 lines; `moonglobe.js` edit under 30 lines; build script about 150 lines (estimates).
- Rendering: no extra animation loop. The globe still renders only on interaction, as today.
- Hub, R2, Workers, collectors: **none**.

A smaller grid (10 m steps: 1,118,267 B; 50 m: 717,449 B, measured) is possible if GPT and Chad prefer download size to precision (D2).

### 4.4 Tests (requirement 8)

New suite `phase1/moon-height-ui.test.cjs` plus the build's `--check`:

- **Registration:** readouts at the published high point and the Antoniadi low point land in the expected cells with the source values. The seven Gazetteer feature centres already used by `moon-globe.test.cjs` read the same values as the source file at those cells. A grid-vs-picture alignment check repeats the correlation test in the build.
- **Seams and poles:** clicks either side of 0°/360° and ±180° read the right columns. 89.5–90°N reads "No value". The south pole reads real values.
- **Source comparison:** 50 random cells from the decoded page asset equal the PDS float rounded to whole metres. **Malformed input:** a wrong-hash grid, a truncated PNG and a wrong-size image each leave the picture globe in place with a plain failure line.
- **Failures:** network failure or a slow fetch (timeout) gives "Height map could not be loaded"; the picture stays and the button resets.
- **Behaviour kept:** with height off, the pixels and behaviour match today (Near/Far, buttons, zoom, polar line). "Lit as now" works as before. With height on, the lit modes are disabled and come back afterwards. The LRO overlay draws over the height map and its readout text is unchanged.
- **Keyboard:** the button is reachable and toggles. Arrow keys move a selection point, Enter reads it, the readout is announced (`aria-live="polite"`), and focus is never thrown away (the §4z rule).
- **Narrow layout:** 360, 390 and 721 px. Legend and readout wrap without overflow (text-node box check, as in `smoke-fixes`).
- **Paused rendering and network:** no requests while off. One request per asset when switched on, none on later toggles. No animation frames while idle.
- **Breaks:** each check gets a deliberate break that must fail, run against the old code first (§4x lesson).
- **Regression:** `moon-globe`, `moon-light`, `moon-lit`, `moon-lro-path`, `skycraft-ui`, `skycraft-hub`, `desktop-overflow`; the Tides suites to prove no effect. **Phone and real-device checks recorded separately** (still open from earlier Moon work).

## 5. Page by page: what each gains and what stays

### 5.1 Moon tab
Gains the optional height layer (§4). Keeps: orientation, Near/Far and buttons, zoom in the box, the polar disclosure, default even lighting, "Lit as now", "As seen from Earth now", the LRO dated example and its labels ("dated", "no current position", altitude above 1737.4 km).

### 5.2 Tides
**No change proposed.** The Moon there is a picture in a computed model of the tide mechanism. Height or temperature adds nothing to that mechanism and could suggest it does. The shared picture and Tides' 37 served files stay byte-identical. If Chad wants Tides to link to the new layer, that would be one line of text in a later, separate round (it touches `tides.html`, so its served manifest would need updating).

### 5.3 World View, Sky zoom-out — optional, separately scoped suggestion
Chad's instruction: optional and separate. **Option S1:** wrap the grey sphere in the same `lroc_color_2k.jpg` (no new file), loaded only when "Zoom out to the Moon and Sun" is first used (+457,942 B, measured file size), with the near side turned towards Earth and libration not shown, labelled "appearance; the Moon's tilt and libration are not drawn". **Costs and risks (estimates):** one extra request on a view that today makes one. The Moon is a few pixels wide at most stops, so the gain shows mainly at the Moon stop. `skyscene.js` builds its material from the globe mesh, so a texture needs a small material change and new pixel tests in `sky-zoom-ui` (351 checks today). **Not part of the first release.** It would be its own branch, its own GPT review and its own Approve line. **Option S0:** leave it plain. *(D4)*

### 5.4 Sources page and REGISTER
On release only: a REGISTER entry for LOLA `LDEM_4_FLOAT` (identity, period, conversion, fill rule, rights reading, review cadence, last checked) and one for the derived page assets, plus a Sources section. Because `sources.html` is pinned by the Animals suite, the release needs the narrow pin update (as Tides did). *(The Tides wording follow-up in Sources is a separate open item and is not bundled here.)*

## 6. Diviner temperature: assessed separately (stage 2, not in the first release)

**Product assessed:** Diviner **Global Cumulative Product**, `LRO-L-DLRE-5-GCP-V1.0`, bundle DOI 10.17189/wj0s-w188 (Paige, Sullivan, Williams 2022); Williams et al. (2017), Icarus 283, 300–325.

- **Quantity:** bolometric brightness temperature `tbol` (K), averaged per 0.5° × 0.5° × 15-minute local-time bin, from all nadir observations **5 Jul 2009 – 1 Apr 2015**. A brightness temperature compiled over years. Not a physical or subsurface temperature, not one pass, not now.
- **Missing:** `-9999` = empty bin, `-9998` = invalid; shown as missing, **never as 0 K**. The 2019 RDR warning cannot apply (wrong product, data ends 2015) and is recorded as checked.
- **Coverage measured on two samples:** a single 15-minute bin leaves whole hours empty at the equator (e.g. none at 00:00 or 13:00 in the patch). **A one-hour window fills every equatorial cell sampled** (spread inside it 3.3 K at noon, 0.9 K at midnight). In 80–90°N the spread is 26.6 K and 11.8 K, so polar "noon" mixes seasons and shadows.
- **Proposed example (stage 2):** two maps, "around local noon (11:30–12:30)" and "around local midnight (23:30–00:30)". Each cell is the **mean of the bins with data in that hour** (our averaging, stated; the GCP gives no counts per bin, so it is not weighted). The maps are cut at ±80° latitude or labelled poleward. They show as their own "What LRO measured: temperature" choice with a legend in K and a readout with the bin window. **No link to "Lit as now"** and no apparent thermal response to the current day/night line. The page would say plainly that this is not today's temperature.
- **Cost, measured:** whole product 2,811,803,634 B (18 files). Two contiguous 2.17 MB samples took about 1 s each. The server accepts multi-range requests (206 multipart).
- **Cost, estimated:** two maps need 259,200 cells × 2 windows × 4 bins. That is about 520,000 ranges ≈ 700–750 multi-range requests, about 230 MB of transfer, in an offline build through the pane, or the whole 2.8 GB. Page assets would be about 0.3–0.5 MB per map (estimate).
- **Decisions needed (D5):** (a) whether that offline build is acceptable under the brief's "no bulk global downloads" (it is a one-off build fetch, not an assessment fetch); (b) whether our one-hour averaging is acceptable or GPT prefers another Diviner product (e.g. the GHRM `tbol` mosaics, 3.3 GB each, or Polar Cumulative Products for the poles).

## 7. Not in scope

Live or current-position anything; LRO prediction; LROC detailed imagery (a later feature of its own); CRaTER, LEND, LAMP, Mini-RF; footprints of timed observations (none are shown, so none are inferred from the marker); terrain displacement (colour only; displacement would need exaggeration stated and performance measured); any hub, R2 or collector change.

## 8. The brief's nine requirements

| # | Where answered |
|---|---|
| 1 Inventory first; preserve globe, overlay, lighting | §1, §5.1 |
| 2 Exact products, IDs, versions, DOI, rights, intervals, units, projection, longitude, registration, datum, nodata, quality | §3, §6; SAMPLES §2–3 |
| 3 Size and cost on small real samples; no bulk downloads | §4.3, §6; SAMPLES (two whole small files, two 2.17 MB ranges) |
| 4 Bounded elevation-first preview; colour = named quantity; displacement stated | §4.1, §7 |
| 5 Footprints only from source data | §7 (none shown) |
| 6 Trajectory pairing only with verified epoch/frame; no clearance relabel | §4.1 (no pairing, no clearance) |
| 7 Multi-year grids apart from pass records | §4.1, §6 |
| 8 Tests: registration, seams, poles, readouts, gaps, failures, keyboard, narrow, paused rendering; device checks separate | §4.4 |
| 9 Proposal before build; GPT reviews; Chad approves; no hub change | this document |

## 9. Decisions for Chad (after GPT's review)

- **D1** First release = LOLA height on the Moon tab only (recommended), or wait and release with Diviner.
- **D2** Readout precision: whole metres, 1.54 MB (recommended); or 10 m steps, 1.12 MB.
- **D3** Lighting while height is on: A, evenly lit with the lit modes disabled (recommended); or B, sunlight allowed over the colours.
- **D4** Sky zoom-out Moon: S0 plain (recommended for now); or S1 picture, as its own later round.
- **D5** Diviner stage 2: the offline build route and the one-hour averaging (§6), or another product.

## 10. Notes for the Sun thread (carried over, same principles)

- Keep three kinds of thing apart in words and in the code: **reference composites** (the Moon picture), **dated measurements compiled over a period** (LOLA 2009–2016; Diviner GCP 2009–2015), and **calculated views** ("Lit as now"). The Sun spec's "dated all-longitude reference Sun" vs "recent Earth-facing HMI image" vs "What Parker measured" maps onto the same three.
- Read the exact label, not the archive page: here the label gave the longitude origin (0° at the left edge vs the picture's centre), pixel registration and a fill row that the archive page does not mention. A cross-correlation against the picture already on the page caught any shift cheaply.
- Archive warnings are product-specific: the Diviner `-9999` note was about one product family and period. Check each warning against the exact product and say which.
- Missing stays missing (`-9999` is never zero). An unmarked fill (exact zeros in one row) can only be found by looking at the data.
- PDS pages need the browser pane (both shells are refused). Multi-range requests work on PDS Geosciences, so large tables can be sampled without bulk downloads.
- `craft.js` was not touched. Any pairing of Parker measurements with its dated trajectory should follow §4.1's rule: no pairing without a verified epoch, timescale and frame.

## 11. Asked of GPT

Review this proposal and `SAMPLES.md` (repo paths at the commit given in the message), in particular: the product choice and the north-pole fill handling; the wording of the layer, legend and readout; the even-lighting rule (D3); whether the Diviner stage-2 route is acceptable; and anything that would mislead a reader. No build starts before Chad's own go.
