# Ocean Heat — proof-of-concept proposal, rev 3 (docs only)

**For:** Chad's O6 decision (source-file check). O7 (build) follows the source results.
**Brief:** `docs/concepts/OCEAN-HEAT-BRIEF.md` (Chad's spec, filed verbatim 10 Nov 2026).
**Approved so far:** nothing beyond O1 (decided below). No source-file download, build, branch, R2, hub or page change is approved.

**Revision history:**
- **Rev 1** — 10 Nov 16:20 UTC.
- **Rev 2** — 10 Nov 2026, after GPT's review (relayed by Chad).
  - **O1 decided:** Chad chose (b), the 1991–2020 normal; GPT and Claude leaned the same way.
  - **O2 wording** is GPT's.
  - **§5 rebuilt.** GPT found that a coarse block could paint over land and over unavailable water, even with nearest filtering. Painting and tapping now follow NOAA's native 5 km masks, and the phone texture limit this raises is addressed.
  - **§6:** seam tests at exactly ±180°; polygon-tap coordinates are verified on the pinned build.
  - **§8:** "smooth" is defined before testing.
  - **§7:** three named inputs; C0–C5 rewritten as GPT asked.
- **Rev 3** — 10 Nov 2026, after GPT's second review (relayed by Chad). GPT: ready for the source-file check once C1's byte limit is explicit; O7 held until P2's texture mapping is defined. Changes:
  - **§5 — P2 is now paired with 0.5° values.** 0.1° texels (2 × 2 native cells) nest exactly inside 0.5° blocks (10 × 10). With 0.25° blocks (5 × 5), texels straddle blocks, so a baked colour could disagree with what a tap reports.
  - **§5 — separate styles:** wholly unavailable ocean gets its own no-data style; the mixed style is only for genuinely mixed texels.
  - **§5 — P1:** tile joins tested, and texture allocation reported.
  - **§7 — C1:** a byte cap per bounded read, aborting if `Range` is ignored. **C3:** SST and SSTA matched to the snapshot date, the climatology to its calendar day; failure to tell land from unavailable ocean = **stop before O7**. **C5:** report the tolerance and the actual residuals.
  - **§8:** a layer-off baseline, several measured taps, and browser / GPU / max-texture recorded; emulation = host-GPU evidence only.

Evidence tags used below:
- **[NOAA page]** = NOAA's public product pages, read as text through Claude's fetch tool on 10 Nov 2026 (the tool's summary, not a verbatim copy); GPT checked the same pages independently.
- **[code]** = this repo.
- **[desk]** = an estimate, not measured.
- **[check]** = must be established from the files themselves (§7).

---

## 1. The question and the answer shape

The question: *Where is the ocean warmer or colder than it usually is for this time of year?*

- The globe is coloured by NOAA's published anomaly against the **1991–2020 normal**.
- A tap shows the surface temperature, the difference from normal and the data date.
- It is one dated, global snapshot.

The proof of concept succeeds if a visitor can turn on **Ocean Heat**, spin to Cape Point or any ocean basin, tap the water, and answer three questions: how warm was it, was that warmer or colder than usual, and what date is it from? Missing data must read as missing.

*Related, separate:* live, observed water temperatures from the drifting buoys we already collect are proposed on their own in `docs/concepts/BUOY-TEMPERATURE-PROPOSAL.md`. The buoys give the temperature only, never a "usual" comparison, so they complement this layer rather than replace it.

## 2. The source, as NOAA's pages describe it

**Established from the pages [NOAA page]:**
- **SST: CoralTemp v3.1.** Daily, global, 0.05° (~5 km).
  - A **gap-free blend of gridded (level-4) satellite analyses**, using night-time observations only, calibrated to 0.2 m depth.
  - NOAA documents spatial and temporal interpolation in the underlying Geo-Polar analysis (GPT).
- **Anomaly: SSTA `3.1-clim19912020-v1`** (released 1 Jun 2026; data from 2006).
  - CoralTemp v3.1 minus a **daily 1991–2020 climatology**, built for each calendar day as the mean of 30 values. 29 Feb = the mean of 28 Feb and 1 Mar.
  - NOAA says it is not part of the coral heat-stress suite.
  - Where ice was present during the baseline, there is no climatology and the cell is flagged no-data.
  - One sentence on the page says "1991–2000" / "31 December 2000". The title, the method and the climatology file names all point to 2020, so GPT and Claude treat it as an apparent typo, to be confirmed from file metadata (C2) and the matching climatology file (C5).
- **NOAA's maps** grey out −0.2 to +0.2 °C as near normal, on a −5 to +5 °C display range.
- **Format and access.** NetCDF4 over HTTPS, FTP, THREDDS and ERDDAP. SSTA: `https://www.star.nesdis.noaa.gov/pub/socd/mecb/crw/data/5km/v3.1-clim19912020-v1/nc/v1.0/daily/ssta/`; daily climatologies under `…/v3.1-clim19912020-v1/climatology/nc`.
- **Use.** Described as free to download and use. The citation page and the NOAA STAR disclaimer are read in C6.

**For the files to settle [check]:**
- what the data date and time represent;
- packed types, fill values, valid ranges, scale and offset;
- coordinate order, spacing and edges;
- whether the three inputs share one grid;
- which field reliably tells **land** from **unavailable ocean**;
- whether "ice now" and "no baseline climatology" can be told apart.

## 3. Decisions

- **O1 — DECIDED (Chad, 10 Nov): (b) NOAA's 1991–2020 anomaly.**
  - Inspector: **"Compared with NOAA's 1991–2020 normal for this location and day of year."**
  - Legend: **"Difference from the 1991–2020 normal for this day of year (°C)."**
  - Sources records NOAA's description and that the heat-stress suite uses a different, older baseline.
- **O2 — proposed wording (GPT's).**
  - The date line stays **"Dated snapshot · NOAA Coral Reef Watch"**.
  - The inspector's method line reads **"Analysed · Satellite-based, with gaps filled by NOAA"**.
  - Displayed values are described as **estimates**. No tap is labelled "directly observed" or "gap-filled" unless a source flag says so (C2 looks for one).
- **O3 — preview branch only.** The bundled snapshot never reaches main in this proof of concept, so the public site does not deviate from "the hub is the product". If the layer earns its place, the follow-on serves it from the hub as a pinned fixed catalogue (the Arts / Sky pattern).

## 4. What the visitor sees

- **Toggle.** An **Ocean Heat** card in Optional layers, off on load.
  - The first switch-on fetches the snapshot; nothing is requested before that.
  - Switching off clears the overlay, legend and date line. A load that completes after switch-off does not draw (generation token).
  - The layer is hidden in the Sky zoom-out view.
- **Legend.** Nine classes, diverging around 0, at stored precision:

  | Class | Range (°C) | Colour role |
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

  Exact colours come with the build, checked for colour-vision deficiency.
- **States that must stay distinct:**
  - **Land:** transparent, so the existing imagery shows.
  - **Near-normal water:** a pale neutral, drawn.
  - **Unavailable ocean:** a dark slate fill with a fine checker; the inspector says "No data for this location".
  - Missing never becomes zero.
- **Date line, while on:** "Dated snapshot · NOAA Coral Reef Watch · data date 2026-MM-DD", plus the display grid ("averaged on a 0.25° grid, about 28 km at the equator").
- **Inspector, for a valid water tap:**
  - "Surface temperature 18.0 °C";
  - "+1.4 °C warmer than usual" or "−0.6 °C cooler than usual" (true minus sign; one decimal). A value that rounds to 0.0 reads "0.0 °C, about the same as usual";
  - "Data date 2026-MM-DD";
  - the 1991–2020 comparison line (O1) and the analysed line (O2);
  - **"19 of 25 source cells contributed to this average."** Only add "the others are land" when the mask establishes it (§5).
- **Valid anomaly, missing SST:** the anomaly is kept and the surface temperature reads "Surface temperature unavailable".
- **No anomaly because there is no baseline normal:** "No 1991–2020 normal for this location and day of year", shown only if the files separate this case (C2/C4). A gap alone is never described as ice on the snapshot date.
- **Caveats** (method row and Sources):
  - an estimate for the surface of a grid cell, which can differ from a nearby beach or buoy reading;
  - nothing about the water below the surface;
  - one warm snapshot does not identify a marine heatwave or coral bleaching;
  - NOAA notes anomalies are less reliable at high latitudes.

## 5. The snapshot: values averaged in blocks, presence at native 5 km

**Rev 1's flaw (GPT).** One valid water pixel could make a whole 28 km block water. The block's colour then painted over land and over unavailable ocean inside it. Rev 2 separates *the value* from *where it is shown*:

- **Values, per display block (0.25° = 5 × 5 native cells, or 0.5° = 10 × 10).**
  - **Contributing cells** = native cells in the block with a valid anomaly. The block's anomaly is their mean.
  - The block's SST is the mean over **the same contributing cells**, given only if every one has valid SST; otherwise "unavailable".
  - The identity *SST − anomaly = mean 1991–2020 climatology of those cells* is checked in the generator **before rounding**, with a tolerance derived from the source packing (C2).
  - Per block the generator stores *n* contributing, *N* total, and the land count from the mask.
- **Presence, per native cell (two bit-planes, 7200 × 3600).**
  - **land** (from the field C3 identifies);
  - **valid anomaly**;
  - a third plane, "no baseline climatology", only if C4 shows the files distinguish it.
  - Painting and tapping both read these planes. A native cell is coloured with its block's value only if it is itself a contributing cell. Land stays transparent and unavailable ocean gets the no-data style, even inside a block that has a value.
  - Size [desk]: 2 planes × 26 M bits = ~6.5 MB raw. Coastlines and ice edges are long, coherent runs, so the planes should compress far better than the values do. **Measured at build, not assumed.**

**The phone texture problem this creates.** Exact painting needs 7200 × 3600 texels. That exceeds the 4096 maximum texture size many phones report, and as RGBA it is ~104 MB of GPU memory [desk]. The path is chosen from the **renderer's actual `MAX_TEXTURE_SIZE`**, read at run time and recorded in the report. Allowed pairings:

| Pairing | Texture | Values | Tap |
|---|---|---|---|
| **P1 + 0.25°** or **P1 + 0.5°** | Native 0.05°, tiled into sphere-segment meshes each within the renderer's limit (`phiStart` / `phiLength`, as `buildNight()` already copies [code]) | Block colour on each contributing native cell | Native planes + block values |
| **P2 + 0.5°** (only) | 0.1° (3600 × 1800). Each texel = 2 × 2 native cells, nested exactly inside one 10 × 10 block | See the texel rule below | Native planes + block values (exact) |

**P2 texel rule.** A texel is:
- the **block colour** if all four native cells contribute;
- **transparent** if all four are land;
- the **no-data style** if all four are water without a valid anomaly;
- the **mixed style** ("mixed coast or ice edge — a tap shows the cell underneath") otherwise.

Because a texel never straddles two blocks, its colour can never disagree with what a tap reports. P2 is **not** paired with 0.25° values: 5 × 5 blocks don't divide into 2 × 2 texels.

**P1 checks:**
- tile joins tested like the date line: distinct values either side, each landing on its own side;
- combined texture allocation reported, measured or clearly labelled as an estimate.

**Lean:** P2 + 0.5° wherever the renderer's limit is below 7200, P1 only where it fits and measures well. The UI discloses the texture and value resolution. Cape Point is shown under each pairing used.

**Display grid for values (O4).** Measure the pairings above, with the masks included (values + planes + manifest). Use the finest pairing whose first-enable transfer is ≤ **1.5 MB** and which meets §8's "smooth"; if none does, bring the measurements back.

**Encoding.**
- `manifest.json`: product and version; data date; grids (value grid and native mask grid: resolution, origin, rows, columns, row order); encodings and sentinels; the three input URLs with their sha256 and byte counts; the sha256 of each binary.
- Deflate-compressed little-endian binaries: int16 anomaly and SST in 0.01 °C, uint8 *n* and land count, and the bit-planes.
- Decoded with `DecompressionStream`. Without it, the card says the layer isn't available in this browser.
- Generator: `phase1/ocean-heat/build_ocean_heat.py --check`, byte-reproducible from the pinned inputs.

**Identity.** The page pins the manifest sha256, every binary sha256, the data date and both grids. It draws nothing on any mismatch ("Ocean Heat unavailable: snapshot failed its check").

## 6. Rendering and tapping

- **Overlay channel [code]:** as for day/night (`harvestThree()`, `buildNight()`).
  - Our own sphere mesh(es) just above the globe, with the globe mesh's rotation copied.
  - `raycast` disabled; explicit disposal; **nearest** filtering, so the GPU never blends texels.
  - The overlay sits beneath the night shading.
- **Longitude wrap.** `λ' = ((λ + 180) mod 360 + 360) mod 360 − 180`, mapping any longitude into **[−180°, 180°)**. So +180° and −180° land in the same first column.
  - `col = floor((λ' + 180) / res)`, `row = floor((90 − φ) / res)`, with pole rows clamped.
  - Texture and inspector use the **same orientation**: row 0 = north, column 0 = −180°, confirmed against the source's coordinate order in C3.
  - The tap reads exactly the native cell (presence) and its block (values). It never searches for the nearest valid water.
- **Where taps arrive [code].** A globe tap goes to `onGlobeClick → openPlace(ME.cellId(lat, lng))`; a polygon tap goes to `onPolygonClick`.
  - With Ocean Heat on, both add an **"Ocean heat here"** block from the tap's own lat/lng; the existing inspector behaviour is unchanged otherwise.
  - Upstream's type file shows polygon-click coordinates as the third argument (GPT). The page pins **globe.gl 2.45.0**, so this is verified on that exact build with a real click.
  - A tap without trustworthy coordinates omits the Ocean Heat block rather than guessing.
- **Files.** A new page file `oceanheat.js` (served-hash checks would go to ten files if it ever ships). Data lives under `data/ocean-heat/<revision>/` on the preview branch only.

## 7. Source-file check (O6, its own go) — what each step establishes

**Three inputs, one date** (named exactly once C1 has listed them, with sizes, for Chad's download line):
1. CoralTemp v3.1 daily SST;
2. SSTA `3.1-clim19912020-v1` daily;
3. the 1991–2020 **daily climatology for that calendar day** (needed by C5).

These are binary NetCDF data files, which the text-only research rule didn't contemplate; Chad's line covers them explicitly.

| Step | What we do | What it establishes |
|---|---|---|
| **C0 Route** | One HEAD request each from the workspace shell, the Mac shell and the pane to `www.star.nesdis.noaa.gov` | Reachability only |
| **C1 Bounded read + listing** | Read the three directory listings; one `Range: bytes=0-4095` read on each actual file URL. **The client consumes at most 64 KiB per request and aborts if the server ignores `Range`** (no `206` / `Content-Range`, or a body over the cap). No full file is fetched before the download line. | That the route serves the real files; their exact names and byte sizes for the download line. On the approved download: complete bytes, sha256 recorded. ERDDAP subsets may diagnose a route or decoder, but **global coverage and mask checks need the complete grids**. |
| **C2 Header** | Metadata only | Variables, units, packed types, `_FillValue`, `valid_min/max`, `scale_factor` / `add_offset`, version and baseline attributes (settles "2000" vs "2020"), any land, ice or gap-fill flag fields |
| **C3 Arrays** | Decode the actual time and coordinate arrays of all three files | **SST and SSTA times = the snapshot date; the climatology = that calendar day** (it represents the reference period, not a year); latitude order; spacing; bounds or derived edges (cell edges at ±180°, so the wrap and block alignment hold); identical grids across the three; **which field distinguishes land from unavailable ocean. If none does reliably, the check stops there and nothing proceeds to O7.** |
| **C4 Masks** | Global cross-tabulation of land × valid-anomaly × valid-SST × missing | Whether "valid anomaly, missing SST" occurs naturally (else a fixture); whether current ice and missing baseline climatology are separable; Cape Point's mixed blocks at 0.25° and 0.5°, and at P2's 0.1° texels |
| **C5 Consistency** | Independently decoded SST − SSTA vs the official climatology file, at several valid cells | That packing and baseline were read correctly. Reports **the packing-derived tolerance and the actual residuals**, plus one example where the climatology is unavailable |
| **C6 Terms** | Read the citation and disclaimer pages (text) | The attribution and use record (a REGISTER draft, filed only on Chad's line) |
| **C7 (optional)** | Compare with NOAA's browse PNG for that date | A flipped-map sanity check only; the numbers come from C3–C5 |

## 8. Done: tests, "smooth", and the GPT preview

**"Smooth", defined before testing.** All on the same setup for every pairing measured, desktop and 390 × 844, **with a layer-off baseline run first**:
- a 5 s scripted rotation with the layer on: median frame interval ≤ 33 ms (≥ 30 fps), p95 ≤ 50 ms;
- tap-to-inspector ≤ 200 ms, measured from input to visible inspector over several taps (median and max reported);
- first-enable transfer and time-to-layer reported alongside;
- for P1, GPU texture memory too;
- browser, GPU / renderer string and `MAX_TEXTURE_SIZE` recorded.

A 390 × 844 emulation is viewport evidence on the host GPU only; physical phone performance stays unverified. The phone run is **emulated** unless Chad runs a physical device (that test is currently deferred). The report says which it was.

**Coordinate table.** Expected values are computed **from the native files, independently of the page**:
- Cape Point: Atlantic water, False Bay water, nearby land, and **a mixed block, tapped on its land, its valid water and its unavailable water**;
- open Pacific (e.g. 0°, 140° W);
- a Northern Hemisphere coast (e.g. off Cornwall or the Gulf of Maine);
- the seam: **exactly +180° and −180°**, plus 179.9° E and 179.9° W;
- a near-normal cell;
- unavailable ocean (ice or missing);
- no baseline climatology (if separable);
- valid anomaly with missing SST (fixture if C4 finds none);
- mismatched date, grid and hash fixtures, each rejected.

**Rendered checks:**
- adjacent seam texels with distinct values, each landing on its own side;
- a mixed block whose land stays transparent and whose unavailable cells show the no-data style.

**Breaks** (each must fail):
- linear filtering;
- the seam formula without the wrap;
- a nearest-valid-water lookup;
- missing → 0;
- block colour painted on non-contributing native cells (rev 1's flaw);
- (P2) a texel coloured although one of its native cells doesn't contribute;
- (P1) a tile join offset by one texel;
- drawing before the hash check;
- drawing after switch-off;
- SST averaged over a different cell set from the anomaly;
- the identity check done after rounding.

**Behaviour:**
- default-off makes zero snapshot requests;
- enabling makes exactly the manifest and binary requests;
- switching off clears the overlay, legend and date line.

**Preview for GPT:** a hash-checked `_review/ocean-heat-rc/` that Chad serves from Terminal, plus the coordinate table and the snapshot's provenance. Branch only.

## 9. Cost and scope

- **$0/month.** No Worker, cron, R2 object or service; the snapshot lives in the preview branch.
- **Out of scope:**
  - automatic refresh (after this, hub-served per O3);
  - Follow the Swell (backlog);
  - any public release.

## 10. Decisions

- **O1:** decided (b).
- **O2:** GPT's wording.
- **O3:** preview branch only.
- **O4:** display grid by measurement (≤ 1.5 MB and §8 "smooth").
- **O5:** blocks qualify on any contributing cell; painting and tapping follow the native masks; P1 (0.25° or 0.5°) or P2 + 0.5° by the renderer's limit and measurement.
- **O6:** source-file check C0–C6 (C7 optional): its own go. A separate download line follows, naming the three files and sizes. **Ready (GPT, rev 3).**
- **O7:** branch build after the source results: its own go.
