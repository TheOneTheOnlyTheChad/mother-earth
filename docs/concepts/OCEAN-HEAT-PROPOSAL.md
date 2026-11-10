# Ocean Heat — proof-of-concept proposal, rev 1 (docs only)

**For:** GPT's review, then Chad's decisions (O1–O7).
**Brief:** `docs/concepts/OCEAN-HEAT-BRIEF.md` (Chad's spec, filed verbatim 10 Nov 2026).
**Written:** 10 Nov 2026, 16:20 UTC (clock reading at write).
**Approved so far:** nothing. No source-file download, build, branch, R2, hub or page change is approved.

Evidence tags used below:
- **[NOAA page]** = NOAA's public product pages, read as text through Claude's fetch tool on 10 Nov 2026 (the fetch tool's summary, not a verbatim copy);
- **[code]** = this repo at `3873ce5`;
- **[desk]** = an estimate made for this proposal, not measured;
- **[check]** = must be established from the source files themselves (§7).

---

## 1. The question and the answer shape

The question: *Where is the ocean warmer or colder than it usually is for this time of year?*

The answer shape:
- the globe is coloured by NOAA's published anomaly;
- a tap shows the surface temperature, the difference from normal and the data date;
- one dated, global snapshot is used, never a live feed.

The proof of concept succeeds if a visitor can turn on **Ocean Heat**, spin to Cape Point or any ocean basin, tap the water, and answer three questions: how warm was it, was that warmer or colder than usual, and what date is it from? Missing data must read as missing.

## 2. What NOAA's pages say, and what they leave open

**Established from the pages [NOAA page]:**
- **CoralTemp v3.1** is daily, global and 0.05° (~5 km). It is a **gap-free blend of three gridded (level-4) satellite SST analyses** (OSTIA reanalysis 1985–2002; NOAA Geo-Polar Blended reanalysis 2002–2016; near-real-time Geo-Polar Blended from Oct 2016). It uses night-time observations only, calibrated to 0.2 m depth.
- **The heat-stress suite's SSTA** is the daily SST minus a daily climatology. The daily climatology is interpolated linearly from monthly means, each pinned to the 15th of its month. Those monthly means come from 1985–2012 CoralTemp, re-centred to **1985–1990 plus 1993** (1991–92 are excluded from the final baseline because of Pinatubo aerosols). NOAA explains this baseline in terms of its coral heat-stress purpose: consistency with older products, and not implying that corals adapt as fast as the climate warms.
- **A second, parallel SSTA exists on a 1991–2020 baseline** (version `3.1-clim19912020-v1`, released 1 Jun 2026). It uses daily climatologies (the mean of the 30 values for each calendar day). NOAA states it is **not part of the heat-stress suite** and presents 1991–2020 as the standard 30-year "normal". Data run from 2006. Where ice was present during the baseline, it has **no climatology and is flagged as no-data**. The page contradicts itself once ("1991–2000" in one passage); the file metadata must settle that [check].
- **Near-normal band.** NOAA's own SSTA maps mask **−0.2 to +0.2 °C in light grey** and use a display range of −5 to +5 °C. Whether the band's ends are inclusive is not stated.
- **Format and access.** NetCDF4 over HTTPS, FTP, THREDDS and ERDDAP. The 1991–2020 SSTA is under `https://www.star.nesdis.noaa.gov/pub/socd/mecb/crw/data/5km/v3.1-clim19912020-v1/nc/v1.0/daily/ssta/`.
- **Use.** The data are described as free to download and use. A citation page and a NOAA STAR disclaimer page are linked; neither has been read yet.

**Not stated on the pages; the files must settle these [check]:**
- what date and time a daily value represents, and how files are dated;
- how land and sea ice are represented (fill values, a mask variable, flags);
- units, scale factors and fill values;
- exact grid alignment (cell centres or edges at ±180°, latitude order);
- whether the SST and SSTA files share an identical grid and land mask.

## 3. Points that change the spec (decisions)

**O1 — Which anomaly product (baseline).** The spec names the heat-stress SSTA (1985–1990 + 1993). NOAA built that baseline for coral heat stress and keeps it deliberately old. The visitor's question is "warmer or colder than *usual for this time of year*", and NOAA itself presents 1991–2020 as the standard "normal".
- **(a) Heat-stress SSTA, 1985–1990 + 1993** (as specified).
  - Its anomalies are measured against a late-1980s reference. On a warming ocean that makes them systematically warmer than against a 30-year normal.
  - To stay honest, the inspector wording would say what "usual" means, for example "compared with NOAA's 1985–1993 reference for this place and time of year" rather than a bare "usual".
- **(b) 1991–2020 SSTA.** This matches the question's "normal for this time of year" in the conventional climate sense.
  - It uses a daily climatology rather than interpolated monthlies.
  - It is newer (released Jun 2026) and outside the heat-stress suite.
  - Ice-affected cells have no anomaly by design.
- Either way, the baseline and NOAA's stated purpose for it go in Sources.
- **Claude's lean: (b)**, because it answers the question as worded with the fewest qualifiers. This is a framing choice that shapes what visitors take away, so it is Chad's call after GPT.

**O2 — Labelling an analysis.** CoralTemp is gap-filled by NOAA's analysis, so in cloudy areas a cell's value is analysed, not seen by a satellite that night. The constitution says that what is modelled or computed says so.
- Proposed evidence line: **"Analysed · NOAA satellite-based analysis, gap-filled by NOAA"**.
- The anomaly carries the existing comparison treatment: the comparison is **NOAA's**, not ours.
- This keeps the layer within "live data, real things", in the same way FIRMS is "interpreted by the source".

**O3 — Static data bundled with the page.** The constitution says the hub is the product and the page is a client; the spec says no Worker.
- Proposal: the bundled snapshot exists **only on a preview branch**. Nothing merges to main in this proof of concept, so the public site never deviates.
- If the layer earns its place, the follow-on serves the snapshot from the hub as a fixed, pinned catalogue (the Arts / Sky pattern), and the later latest-snapshot refresh builds on that.

## 4. What the visitor sees

- **Toggle.** An **Ocean Heat** card in the Optional layers group, off on load. The first switch-on fetches the bundled snapshot; nothing is requested before that.
  - Switching off removes the overlay, legend and date line.
  - If a load completes after switch-off, a generation token stops it from drawing (the existing `optLoading` pattern, extended).
  - The layer is also hidden while the Sky zoom-out view is open, like the other layers.
- **Legend.** "Difference from normal for this time of year (°C)" (O1 may change the wording). Nine classes, diverging around 0:

  | Class | Range (°C, at stored precision) | Colour role |
  |---|---|---|
  | 1 | ≤ −3.0 | deepest blue |
  | 2 | −3.0 < a ≤ −2.0 | blue |
  | 3 | −2.0 < a ≤ −1.0 | mid blue |
  | 4 | −1.0 < a ≤ −0.2 | pale blue |
  | 5 | −0.2 < a < +0.2 | **neutral (near normal)** |
  | 6 | +0.2 ≤ a < +1.0 | pale orange |
  | 7 | +1.0 ≤ a < +2.0 | mid orange |
  | 8 | +2.0 ≤ a < +3.0 | orange |
  | 9 | ≥ +3.0 | deepest orange |

  - The near-normal band follows NOAA's ±0.2 °C mask. Ours excludes the ends, and the inclusivity is written down.
  - Colours will be checked for colour-vision deficiency at build. Exact hex values come with the build.
- **The three states that must not be confused:**
  - **Land:** the overlay is transparent, so the existing imagery shows.
  - **Near-normal water:** a pale neutral fill, drawn.
  - **No data** (ice, a missing value, or no climatology): a dark slate fill with a fine checker, plus "No data for this location" in the inspector.
  - A missing value never becomes zero, and near-normal never reuses the no-data colour.
- **Date and source line.** While the layer is on: "Dated snapshot · NOAA Coral Reef Watch · data date 2026-MM-DD", taken from the snapshot's own manifest. The display grid is disclosed there too ("display grid 0.25°, about 28 km at the equator").
- **Inspector, for a valid water cell:**
  - "Surface temperature 18.0 °C";
  - "+1.4 °C warmer than usual" or "−0.6 °C cooler than usual" (true minus sign; one decimal). A value that rounds to 0.0 reads "0.0 °C, about the same as usual";
  - "Data date 2026-MM-DD";
  - "Compared with NOAA's usual surface temperature for this location and time of year" (wording per O1);
  - one line on what the cell is: "Average of 19 of NOAA's 25 five-km cells in this square (the rest are land)."
- **Missing SST with a valid anomaly:** the anomaly is kept and the surface temperature reads "Surface temperature unavailable".
- **Caveats** (in the inspector's "Method and full explanation" row and in Sources):
  - a satellite-based estimate of the surface, per grid cell, which can differ from a nearby beach or buoy reading;
  - nothing about the water below the surface;
  - one warm snapshot does not identify a marine heatwave or coral bleaching;
  - NOAA notes that anomalies are less reliable at high latitudes (persistent cloud).

## 5. The snapshot

**Resolution (O4).** Native is 7200 × 3600 cells (0.05°), about 26 million cells per variable, which is too heavy for a phone. Two candidate display grids, both global and aligned to native cell edges [check]:

| Display grid | Cells | Native cells per display cell | Raw size [desk] | Expected transfer [desk] |
|---|---|---|---|---|
| **0.25°** | 1440 × 720 = 1,036,800 | 5 × 5 | ~5.2 MB (int16 anomaly + int16 SST + uint8 count) | perhaps 1–2 MB deflated |
| 0.5° | 720 × 360 = 259,200 | 10 × 10 | ~1.3 MB | perhaps 0.3–0.5 MB |

- Proposed: build both and measure both.
- Ship 0.25° if its measured first-enable transfer is ≤ 1.5 MB and it renders and taps smoothly in the phone emulation; otherwise ship 0.5°. The 1.5 MB figure is a proposal for GPT to challenge.

**Aggregation (O5).** Each display cell is built from its native cells only. There is no smoothing, no interpolation and no borrowing from neighbouring cells.
- **Land:** every native cell is land.
- **No data:** the cell has water but no native cell with a valid anomaly (ice, missing, or no climatology).
- **Water value:** the anomaly is the mean of the native cells with a valid anomaly. SST is the mean over **the same native cells**, given only if every one of them has a valid SST; otherwise SST is unavailable. Because both means use the same cells, displayed SST − displayed anomaly = the mean NOAA climatology of those cells. This is a built-in consistency check.
- The count *n* of *N* used cells is stored and shown.
- Coastal rule options:
  - **(i)** any valid native water cell makes the display cell water;
  - **(ii)** a minimum share, e.g. ≥ 50 %.
  - **Lean: (i).** It keeps narrow coasts such as Cape Point visible, and the *n / N* line discloses how much of the cell is water. Under (ii) those coasts would be painted as land.

**Encoding.**
- Two files:
  - `manifest.json`: product, version, data date, grid (resolution, origin, rows, columns, row order), encoding, sentinels, source-file URLs and sha256 values, binary sha256;
  - one deflate-compressed little-endian binary: int16 anomaly in 0.01 °C, int16 SST in 0.01 °C, uint8 count, with reserved sentinels for land and no-data.
- The browser decompresses with `DecompressionStream`. If that is unavailable, the card says Ocean Heat is not available in this browser rather than half-drawing.
- The generator is `phase1/ocean-heat/build_ocean_heat.py`, with `--check`. Its output is byte-reproducible from the pinned source files, the same discipline as `build_sky.py`.

**Identity and rejection.** The page pins the manifest's sha256 together with the binary's sha256, data date and grid. It draws nothing unless all of them match, and then says "Ocean Heat unavailable: snapshot failed its check". A mismatched date, grid or hash fixture must hit that path.

## 6. Rendering and tapping on the existing globe

**Overlay.** The day/night layer's proven channel is reused [code: `harvestThree()`, `buildNight()`]:
- a canvas texture on our own sphere mesh just above the globe;
- the globe mesh's rotation is copied, so longitude lines up;
- `raycast` is disabled, so the overlay never takes a click;
- explicit disposal on switch-off.

Changes for Ocean Heat:
- The canvas is the display grid itself, one texel per display cell (1440 × 720 at 0.25°). The no-data checker may need a 2× canvas.
- Texture filtering is set to **nearest**, so the GPU never blends a coastal cell into land or into its neighbours. This is the rendering half of "no smoothing".
- The overlay sits beneath the night shading.

**Tap → cell.**
- One mapping, used for both painting and tapping: `col = floor((lng + 180) / res) mod ncols`, `row = floor((90 − lat) / res)`, clamped at the poles. The `mod` sends lng = 180° to column 0 and keeps the 180° seam exact.
- The inspector reads the same array the canvas was painted from, so it can never jump to the nearest valid water.
- **Where the tap arrives:** today a globe tap opens the 4° place view [code: `onGlobeClick → openPlace(ME.cellId(lat, lng))`], and a tap on a drawn coverage polygon opens that cell instead (`onPolygonClick`).
  - With Ocean Heat on, both paths add an **"Ocean heat here"** block, resolved from the tap's own lat/lng, not from the 4° cell.
  - For polygon taps that needs the click coordinates from globe.gl's polygon-click callback. Its signature in globe.gl 2.45 is to be verified at build; if it does not carry them, that limitation is reported rather than worked around silently.

**Files.**
- A new page file `oceanheat.js`. If this ever ships, served-hash checks go from nine files to ten.
- Data under `data/ocean-heat/<revision>/` on the preview branch only.

## 7. Source-file check (needs its own go) — what each step establishes

This needs **binary NetCDF data files**, which the "research stays text only (no PDFs)" rule did not contemplate. Downloading them needs Chad's explicit line, naming the files and their sizes once C1 has shown them (**O6**).

| Step | What we do | What it establishes |
|---|---|---|
| C0 Route | One HEAD request each from the workspace shell, the Mac shell and the browser pane to `www.star.nesdis.noaa.gov` | Which route can carry ~tens of MB (pane-to-workspace via base64 cannot). Fallbacks: Chad downloads the files in his browser into the Mac folder, or an ERDDAP subset. |
| C1 Listing | Read the directory listings for SST and the chosen SSTA (O1) | That both files exist for the same day; their exact names and sizes; the date to pin |
| C2 Header | Read the NetCDF metadata only (`ncdump -h` equivalent) | Variables, units, scale factor and offset, fill values; the time variable and what the data date means; lat/lon arrays (0.05°, centre or edge alignment, row order); how land and ice are flagged; version and baseline attributes (settles the "1991–2000" inconsistency) |
| C3 Grid identity | Compare the coordinate arrays and land masks of the two files | That one coordinate mapping is valid for both, and display cells align with native edges |
| C4 Values | Counts of land / ice / missing / valid; the native cells around Cape Point | Whether "valid anomaly, missing SST" happens naturally (otherwise a fixture); what the coast looks like at each display grid |
| C5 Consistency | SST − SSTA at a handful of cells, compared with NOAA's published climatology file for that day | That scale factors and baselines were read correctly |
| C6 Terms | Read the citation and disclaimer pages (text) | The REGISTER entry: attribution form and commercial standing. A research-only draft, filed only on Chad's line. |
| C7 (optional) | Compare against NOAA's own browse PNG for that date | A visual cross-check of our rendering. It is an image, so Chad's call. |

## 8. Done: tests and the GPT preview

- **Fixed-coordinate table.** Expected inspector values are computed **from the native files independently of the page**, so the page is never checked against its own output.
  - Water off Cape Point (Atlantic side), nearby land, and False Bay;
  - open Pacific (e.g. 0°, 140° W);
  - a Northern Hemisphere coast (e.g. off Cornwall or the Gulf of Maine);
  - both sides of the 180° seam (e.g. 17° S at 179.9° E and 179.9° W);
  - a near-normal cell from the file;
  - ice or other no-data;
  - valid anomaly with missing SST (fixture if C4 finds none);
  - mismatched date, grid and hash fixtures, each rejected.
- **Breaks** (each must fail when applied):
  - linear filtering instead of nearest;
  - the seam without `mod`;
  - a nearest-valid-water lookup;
  - missing → 0;
  - drawing before the hash check;
  - drawing after switch-off;
  - SST averaged over a different cell set from the anomaly.
- **Behaviour:**
  - the default-off load makes zero snapshot requests;
  - enabling it makes exactly the manifest and binary requests;
  - switching off clears the overlay, legend and date line.
- **Report:**
  - measured first-enable transfer and time to show the layer;
  - rotation smoothness and tap behaviour with the layer on, at desktop width and at 390 × 844;
  - whether the phone test was physical or emulated. **Emulated** unless Chad does a device run; the real-phone test is currently deferred.
- **GPT preview:** a hash-checked `_review/ocean-heat-rc/` copy that Chad serves from Terminal (`python3 -m http.server 8899 --bind 127.0.0.1`), plus the coordinate table and the snapshot's provenance. Branch only.

## 9. Cost and scope

- **$0/month.** No Worker, cron, R2 object or new service. The snapshot lives in the branch.
- **Out of scope:**
  - automatic updates and freshness handling (the follow-on, after this proof of concept and a hub-served design under O3);
  - **Follow the Swell** (stays on the backlog as a separate offshore forecast);
  - publishing on the live site.

## 10. Decisions for Chad (after GPT)

- **O1** Baseline: (a) heat-stress 1985–1990 + 1993 as specified, or (b) 1991–2020. Lean (b).
- **O2** Evidence label for a gap-filled analysis ("Analysed · NOAA").
- **O3** Bundled snapshot on a preview branch only; hub-served if it earns its place.
- **O4** Display grid by measurement: 0.25° if ≤ 1.5 MB and smooth, else 0.5°.
- **O5** Coastal rule: (i) any valid water cell, with *n / N* disclosed. Lean (i).
- **O6** Source-file check C0–C6 (C7 optional), with binary NetCDF downloads allowed for this check: its own go.
- **O7** Build on a branch after the check: its own go.
