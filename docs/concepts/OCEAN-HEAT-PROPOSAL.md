# Ocean Heat — proof-of-concept proposal, rev 4.2 (docs only)

**For:** Chad's O7 line (preview build on a branch). GPT cleared rev 4.1 for O7 (relayed by Chad, 10 Nov); rev 4.2 applies GPT's two build notes and the credit wording. REGISTER filing: its own line.
**Brief:** `docs/concepts/OCEAN-HEAT-BRIEF.md` (Chad's spec, filed verbatim 10 Nov 2026).
**Approved so far:** O1 (decided below); the source-file check C0–C5 (done, accepted by GPT). No build, branch, REGISTER filing, R2, hub or page change is approved.

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
- **Rev 4** — 10 Nov 2026, after the source-file check C0–C5 (`docs/research/OCEAN-HEAT-SOURCE-CHECK.md` rev 2; Mac packet `research/ocean-heat/2026-11-10-claude/REPORT-C2-C5.md`; GPT accepted it, relayed by Chad). Changes:
  - **§2:** the open questions are now answered from the files.
  - **§4:** unavailable ocean splits into two named states, "Sea ice" and "No 1991–2020 normal". The data date is "9 Nov 2026 (UTC day)". A coastline note is added.
  - **§5:** the presence planes become NOAA's own `mask`. The generator asserts the CoralTemp row flip, bitwise grid identity, the mask invariants and an **exact-zero** identity.
  - **§7:** status recorded; the md5 check stays open.
  - **§8:** a concrete coordinate table from the files; new breaks (missing flip, identity disabled).
  - **New §9a, Terms:** the OSTIA question, unresolved, blocking any public release but not the preview.
- **Rev 4.1** — 10 Nov 2026, Chad's corrections after GPT's review:
  - **§9a / C6:** the distinction between the exact files and the OSTIA notice is recorded; GPT's withdrawal of the OSTIA release hold for this snapshot; credit and the cited DOI.
  - **§2 / §5:** corrected mask invariants. Valid SST also occurs under masks 2 and 4. Land = mask 1, checked against the literal SST fill, which also occurs on 4,655 ice cells.
  - **§8:** expected display-block values at 0.25° and 0.5°; a seam fixture with visibly different classes; a real seam pair.
- **Rev 4.2** — 10 Nov 2026. GPT cleared rev 4.1 for the O7 preview-build approval (relayed by Chad), with two build notes and a credit note:
  - **§8:**
    - several rev 4.1 tap points sat on grid edges (e.g. (0, −140)). Visual taps now use **confirmed interior points** (packet `C4c-interior.json`: off every 0.05° / 0.25° / 0.5° edge, the expected native cell type, the same blocks as the values table), and exact edges are kept as **deliberate lookup tests**;
    - the synthetic seam is checked **on the rendered globe**, so a correctly painted texture mounted backwards still fails.
  - **§9a:** link the exact products; label `10.3390/rs12233856` as the **methods article DOI**. GPT found NCEI dataset DOIs only for the separate heat-stress archive, none verifiable for this 1991–2020 anomaly or its climatology.

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

**Settled by the files (C2–C5, 10 Nov 2026; inputs for 2026-11-09):**
- **Packing:** SST, anomaly and climatology are int16 in 0.01 °C, `_FillValue` −32768. SST valid −200…5000; anomaly −1500…1500.
- **Grid:** 3600 × 7200 **cell centres** at 0.05° (±179.975 / ±89.975). Edges fall on 0.05° multiples from −180°, so 0.25° and 0.5° blocks align with native cells.
- **Row order:** **CoralTemp is south-first; the SSTA and climatology files are north-first.** After flipping CoralTemp, all three grids are bitwise identical.
- **Data date:** the SST and SSTA reference time is 9 Nov 12:00 UTC; coverage is 9 Nov 00:00–24:00 UTC. The climatology has no time; its title names the calendar day ("November 09 … 1991-2020").
- **Baseline:** 1991–2020 in all the file metadata. The page's "2000" is a typo.
- **Presence: the SSTA file's `mask`** (0 valid-water, 1 land, 2 missing, 4 ice), which the climatology repeats.
  - **mask 0 ⇔ valid anomaly ⇔ valid climatology** (12,833,780 cells, no exception);
  - **mask 0 ⇒ valid SST, but valid SST also occurs under masks 2 and 4** (991,557 and 3,367,803 cells);
  - **land = mask 1** (8,722,205). Every land cell has the literal SST fill −32768, but that fill also occurs on 4,655 ice cells, so it never decides land on its own;
  - **mask 4 = sea ice now** (ice fraction > 0 in every such cell);
  - **mask 2 = no 1991–2020 normal** (the climatology is masked as ice-in-baseline; SST is valid).
- **Valid anomaly with missing SST:** occurs in 0 cells.
- **Identity:** stored SST − anomaly − climatology = **0 exactly** in every valid cell.
- **No per-cell gap-fill flag exists.**

## 3. Decisions

- **O1 — DECIDED (Chad, 10 Nov): (b) NOAA's 1991–2020 anomaly.**
  - Inspector: **"Compared with NOAA's 1991–2020 normal for this location and day of year."**
  - Legend: **"Difference from the 1991–2020 normal for this day of year (°C)."**
  - Sources records NOAA's description and that the heat-stress suite uses a different, older baseline.
- **O2 — proposed wording (GPT's).**
  - The date line stays **"Dated snapshot · NOAA Coral Reef Watch"**.
  - The inspector's method line reads **"Analysed · Satellite-based, with gaps filled by NOAA"**.
  - Displayed values are described as **estimates**. No tap is labelled "directly observed" or "gap-filled": C2 found no such source flag.
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
  - **Unavailable ocean:** a dark slate fill with a fine checker. The inspector names which kind, from NOAA's mask:
    - mask 4: **"Sea ice — no temperature difference shown"**;
    - mask 2: **"No 1991–2020 normal for this location and day of year"**.
    - A mask value outside {0, 1, 2, 4} → "No data for this location" (defensive; none were found).
  - Missing never becomes zero.
- **Date line, while on:** "Dated snapshot · NOAA Coral Reef Watch · 9 Nov 2026 (UTC day)", from the manifest's `time_coverage_start`, plus the display grid ("averaged on a 0.5° grid, about 55 km at the equator", or whatever the measured pairing is).
- **Inspector, for a valid water tap:**
  - "Surface temperature 18.0 °C";
  - "+1.4 °C warmer than usual" or "−0.6 °C cooler than usual" (true minus sign; one decimal). A value that rounds to 0.0 reads "0.0 °C, about the same as usual";
  - "Data date 9 Nov 2026 (UTC day)";
  - the 1991–2020 comparison line (O1) and the analysed line (O2);
  - **"19 of 25 source cells contributed to this average."** Only add "the others are land" when the mask establishes it (§5).
- **Valid anomaly, missing SST:** the anomaly is kept and the surface temperature reads "Surface temperature unavailable". This never occurs in the 9 Nov files (C4: 0 cells), so it stays as a safeguard tested by fixture only.
- **No anomaly because there is no baseline normal:** "No 1991–2020 normal for this location and day of year" (mask 2). Ice on the snapshot date is stated only where the mask says ice (mask 4).
- **Coastlines** follow NOAA's 5 km mask. Features narrower than a cell can read as water (C4: the Cape Point tip is water in the mask). This is stated in Sources.
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
  - The block identity *mean SST − mean anomaly = mean climatology of the same cells* holds exactly on the integer sums. The generator checks it on the sums **before** dividing and rounding.
  - Per block the generator stores *n* contributing, *N* total, and the land count from the mask.
- **Presence, per native cell: NOAA's `mask`** from the SSTA file, stored as one 2-bit plane (7200 × 3600: water / land / no-normal / ice).
  - Painting and tapping both read it. A native cell is coloured with its block's value only if it is water (mask 0), and so a contributing cell. Land stays transparent; mask 2 and mask 4 get the no-data style and their own inspector text, even inside a block that has a value.
  - Size [desk]: 26 M cells × 2 bits = ~6.5 MB raw. Coastlines and ice edges are long, coherent runs, so it should compress far better than the values. **Measured at build, not assumed.**
- **Generator assertions (each a hard stop, each with a break that must fail):**
  - CoralTemp latitude is ascending → flip to north-first. After the flip, the lat and lon arrays of all three inputs are **bitwise identical**.
  - The SST and SSTA `time_coverage_start` are the same day; the climatology title names that calendar day and "1991-2020".
  - Mask invariants, each checked against the **literal** sentinels (`_FillValue` −32768; mask values from the file):
    - mask values ⊆ {0, 1, 2, 4};
    - mask 0 ⇔ anomaly ≠ −32768 ⇔ climatology ≠ −32768;
    - mask 0 ⇒ SST ≠ −32768 and within −200…5000 (valid SST elsewhere, under masks 2 and 4, is allowed and expected);
    - mask 1 ⇒ SST = −32768 literally.
  - **Land is taken from mask 1 only, never from the SST fill.** Expected counts for the pinned inputs are asserted exactly: 12,833,780 / 8,722,205 / 991,557 / 3,372,458, and 4,655 ice cells with SST fill.
  - **Stored SST − anomaly − climatology = 0 exactly** in every mask-0 cell. A change in NOAA's packing stops the build rather than being absorbed into a tolerance.
  - Input sha256 = the pinned values (C2–C5 inputs; table in §7).

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

**Status: C0–C5 DONE (10 Nov 2026), accepted by GPT; correction 1 (masks) and C6 credit in record rev 2.1.** Record: `docs/research/OCEAN-HEAT-SOURCE-CHECK.md`. **Open:** the md5 sidecar check (the sidecars were not downloaded) and the REGISTER filing.

**The pinned inputs (2026-11-09):**

| # | File | Bytes | sha256 |
|---|---|---|---|
| 1 | `coraltemp_v3.1_20261109.nc` | 11,418,321 | `57de86e9…5b92` |
| 2 | `ct5km_ssta_v3.1-clim19912020-v1_20261109.nc` | 10,399,448 | `7b97760a…1033` |
| 3 | `ct5km_v3.1_clim-sst-mean-daily-window-01day-01grid-source19912020_day1109.nc` | 6,349,472 | `1495ac58…592e` |

- Full hashes are in the packet LOG.
- The files stay on the Mac (packet `inputs/`); they are not committed to the repo. The generator reads them from there and pins their hashes.

| Step | What we do | What it establishes |
|---|---|---|
| **C0 Route** | One HEAD request each from the workspace shell, the Mac shell and the pane to `www.star.nesdis.noaa.gov` | Reachability only |
| **C1 Bounded read + listing** | Read the three directory listings; one `Range: bytes=0-4095` read on each actual file URL. **The client consumes at most 64 KiB per request and aborts if the server ignores `Range`** (no `206` / `Content-Range`, or a body over the cap). No full file is fetched before the download line. | That the route serves the real files; their exact names and byte sizes for the download line. On the approved download: complete bytes, sha256 recorded. ERDDAP subsets may diagnose a route or decoder, but **global coverage and mask checks need the complete grids**. |
| **C2 Header** | Metadata only | Variables, units, packed types, `_FillValue`, `valid_min/max`, `scale_factor` / `add_offset`, version and baseline attributes (settles "2000" vs "2020"), any land, ice or gap-fill flag fields |
| **C3 Arrays** | Decode the actual time and coordinate arrays of all three files | **SST and SSTA times = the snapshot date; the climatology = that calendar day** (it represents the reference period, not a year); latitude order; spacing; bounds or derived edges (cell edges at ±180°, so the wrap and block alignment hold); identical grids across the three; **which field distinguishes land from unavailable ocean. If none does reliably, the check stops there and nothing proceeds to O7.** |
| **C4 Masks** | Global cross-tabulation of land × valid-anomaly × valid-SST × missing | Whether "valid anomaly, missing SST" occurs naturally (else a fixture); whether current ice and missing baseline climatology are separable; Cape Point's mixed blocks at 0.25° and 0.5°, and at P2's 0.1° texels |
| **C5 Consistency** | Independently decoded SST − SSTA vs the official climatology file, at several valid cells | That packing and baseline were read correctly. Reports **the packing-derived tolerance and the actual residuals**, plus one example where the climatology is unavailable |
| **C6 Terms** | Read the citation and disclaimer pages (text) | **Done for credit and DOI (§9a)**; the STAR disclaimer is still to read. The attribution and use record (REGISTER entry, filed only on Chad's line) |
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
- **Native-cell values from C5** (SST / anomaly / normal, °C), for the generator's own checks:

  | Cell | Expected |
  |---|---|
  | Atlantic off Cape Point (−34.425, 18.425) | 17.87 / +0.80 / 17.07 |
  | False Bay (−34.225, 18.675) | 18.07 / +1.48 / 16.59 |
  | Cape Town (−33.975, 18.575) | land |
  | Open Pacific (0.025, −140.025) | 30.51 / +4.99 / 25.52 |
  | Off Cornwall (50.025, −6.025) | 13.89 / +0.89 / 13.00 |
  | Gulf of Maine (43.025, −69.025) | 11.22 / +0.73 / 10.49 |
  | **Seam W, col 0** (−16.975, −179.975) | 25.83 / −1.04 |
  | **Seam E, col 7199** (−16.975, 179.975) | 25.73 / −1.02 |
  | Weddell Sea (−69.975, −40.025) | **Sea ice** |
  | Baffin Bay (71.575, −58.175) | **No 1991–2020 normal** (SST 0.63 valid) |

- **Expected display-block values** (what a tap shows). Computed straight from the native files (`C4b-blocks.json`, packet), never from page output; every block's integer sums satisfy SST − anomaly − normal = 0.
  - Format: *n*/*N* contributing · SST / anomaly / normal (°C) · class (§4 legend).
  - **Tap points are interior** (rev 4.2; packet `C4c-interior.json`): none lies on a 0.05°, 0.25° or 0.5° edge; each sits on the native cell type shown; each falls in the same blocks as the values below.

  | Tap point | 0.25° block | 0.5° block |
  |---|---|---|
  | Atlantic off Cape Point (−34.4125, 18.4125), native water | 25/25 · 17.71 / +0.71 / 17.00 · class 6 | 91/100 (9 land) · 16.71 / −0.08 / 16.79 · class 5 |
  | Cape Point tip (−34.357, 18.497), native water | same block as above (the tip is water at 5 km) | same block as above |
  | False Bay (−34.375, 18.625), native water | 25/25 · 17.95 / +1.15 / 16.80 · class 7 | 72/100 (28 land) · 18.05 / +1.33 / 16.72 · class 7 |
  | Cape Town (−33.9625, 18.6125), native land | 0/25 — all land: transparent, "land" | 0/100 — all land |
  | Open Pacific (−0.125, −139.875), native water | 25/25 · 30.57 / +5.09 / 25.48 · class 9 | 100/100 · 30.58 / +5.12 / 25.46 · class 9 |
  | Off Cornwall (49.875, −5.875), native water | 25/25 · 13.95 / +0.96 / 12.99 · class 6 | 100/100 · 13.76 / +0.79 / 12.97 · class 6 |
  | Gulf of Maine (42.875, −68.875), native water | 25/25 · 11.38 / +0.84 / 10.54 · class 6 | 100/100 · 11.71 / +1.06 / 10.66 · **class 7** |
  | Seam W (−17.125, −179.9125), native water | col 0 · 25/25 · 25.95 / −0.92 / 26.88 · class 4 | col 0 · 100/100 · 25.98 / −0.92 / 26.90 · class 4 |
  | Seam E (−17.125, +179.9125), native water | col 1439 · 25/25 · 25.77 / −0.93 / 26.71 · class 4 | col 719 · 100/100 · 25.78 / −0.91 / 26.68 · class 4 |
  | **Exactly +180** and **exactly −180** (−17.125), lookup test | **col 0** (same as Seam W) | **col 0** (same as Seam W) |
  | Weddell Sea (−70.125, −39.875), native ice | 0/25 · 25 ice → "Sea ice" | 0/100 · 100 ice → "Sea ice" |
  | Baffin Bay (71.575, −58.175), native no-normal | 0/25 · 25 no-normal → "No 1991–2020 normal …" | 0/100 · 100 no-normal |
  | **Near normal** (−0.125, 124.125), 0.5° only; block all water | — | 100/100 · 29.55 / +0.03 / 29.51 · **class 5** |

- **Gulf of Maine changes class with the grid** (class 6 at 0.25°, class 7 at 0.5°): a check that the displayed class follows the chosen grid.
- **Edge lookup tests (deliberate, not visual).** The lookup is `floor` on (90 − lat) and on wrapped (lon + 180), so a point exactly on an edge belongs to the block **south of** a latitude edge and **east of** a longitude edge. Exact-edge points assert this:
  - (0, −140) → the 0.25° block lat 0…−0.25, lon −140…−139.75; same block as Open Pacific;
  - (50, −6) → Off Cornwall's blocks; (43, −69) → Gulf of Maine's blocks;
  - (−34.25, 18.65) → False Bay's blocks; (−17, ±180) → col 0;
  - exactly lat −90 → the last row (clamped).
  - **Breaks:** `round` for `floor`, and `ceil` for `floor`, must each fail.
- **The 0.5° Cape Point block's** P2 texels: `CCCMM / CCCMM / CCCCM / CCCCC / CCCCC`. Tapped on its land, its water and a mixed texel.
- **The real seam at −17° is the same class on both sides** (class 4 / 4), so it cannot show a visible seam error. Two additions:
  - **Seam fixture (synthetic, visibly different classes):** a manifest-valid fixture snapshot in which the westmost value column (col 0, −180…−179.5) is all water at **−2.50 °C (class 2, blue)** and the eastmost (col 719, 179.5…180) is all water at **+2.50 °C (class 8, orange)**, every other block land.
    - **Rendered check on the globe itself:**
      - turn the camera to face the 180° meridian;
      - project points just west and just east of it to screen with `getScreenCoords`;
      - sample the **rendered canvas** there and assert blue west, orange east.
      - Sampling the texture alone is not enough: a correctly painted texture mounted backwards (mirrored, or rotated 180° on the sphere) must fail. **Breaks:** a mirrored mesh scale and a π offset in the mesh rotation must each fail this check.
    - **Tap checks:** −179.9 and **exactly −180 and +180** → −2.50; +179.9 → +2.50.
    - **Breaks:** the no-wrap formula (+180 lands out of range or in col 719), a one-texel shift, and a mirrored longitude must each fail.
  - **Real seam pair with different classes** (0.5°; 54 such rows exist): row 61 (59.5…59.0° N): col 0 +0.85 (class 6) vs col 719 +1.01 (class 7). Taps either side must return each own value.
- **Exactly +180° and −180°** both resolve to column 0 (−179.975), plus 179.9° E and 179.9° W.
- A near-normal cell (|anomaly| < 0.2), picked from the file at build and named in the packet.
- **Fixtures:** valid anomaly with missing SST (C4: none occurs naturally); mismatched date, grid and hash, each rejected.

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
- the identity check done after rounding;
- **the CoralTemp row flip omitted** (the generator must stop on the grid-identity assertion);
- **the exact-zero identity disabled or loosened** (a fixture with a one-unit shift must stop the build);
- mask 2 and mask 4 given the same inspector text.

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

## 9a. Terms (C6) — the exact files vs the OSTIA notice
- **The exact files this snapshot uses** (licence attributes read in full in C2):
  - the **SSTA 1991–2020** file and the **day-1109 climatology** file carry only Coral Reef Watch's statement: the data "are available for use without restriction", with credit and courtesy to **NOAA Coral Reef Watch** and the appropriate DOI;
  - the **CoralTemp** file adds the **OSTIA notice, explicitly labelled 1985–2002** (academic research only, no commercial use, Met Office terms), and a **GHRSST 2002–present "free and open"** notice. The 9 Nov 2026 SST is from the 2017–present near-real-time part.
- **The distinction:** the OSTIA notice is labelled for the 1985–2002 CoralTemp data. **No text read extends it to the derived anomaly or climatology files.** Texts read:
  - the three files' attributes;
  - NOAA's methodology, climatology and 1991–2020 product pages;
  - the Coral Reef Watch citation page.
- **The release hold is withdrawn for this snapshot:** GPT withdrew the OSTIA hold (relayed by Chad, 10 Nov), so it no longer blocks a public release of this 9 Nov snapshot. A later refresh re-reads the exact files' attributes, and any new source or wording is re-checked.
- **Credit (on the card date line, the inspector method row, Sources and the page footer):**
  - **"NOAA Coral Reef Watch"**: the citation page asks that credit and courtesy be given to NOAA Coral Reef Watch.
  - **Link the exact products** (Sources and the footer):
    - CoralTemp v3.1 daily SST: https://coralreefwatch.noaa.gov/product/5km/index_5km_sst.php
    - SSTA, 1991–2020 baseline: https://coralreefwatch.noaa.gov/product/5km/index_5km_ssta_clim19912020.php
    - the daily 1991–2020 climatology, from the same product page.
    - The exact file URLs and sha256 values go in Sources' provenance table.
  - **DOI:** the files ask for "the appropriate DOI associated with this dataset" but carry no DOI attribute, and neither the citation page nor the 1991–2020 product page lists a dataset DOI for the 1991–2020 anomaly or the climatology.
  - The citation page's reference for CoralTemp and the 5 km v3.1 suite is shown as **"Methods article DOI: 10.3390/rs12233856"**: Skirving, W., et al. (2020). *CoralTemp and the Coral Reef Watch Coral Bleaching Heat Stress Product Suite Version 3.1.* Remote Sensing 12(23):3856. It is never labelled a dataset DOI.
  - **Dataset DOI:** none verified for this exact 1991–2020 anomaly or its daily climatology. GPT found NCEI dataset DOIs only for the separate heat-stress archive, which does not cover these files. If NOAA or NCEI publishes one, it is added in a later revision.
- **C6 output:** a REGISTER entry recording the three statements, this distinction, GPT's withdrawal of the hold, the credit and the DOI. **Filed only on Chad's line.**

## 10. Decisions

- **O1:** decided (b).
- **O2:** GPT's wording.
- **O3:** preview branch only.
- **O4:** display grid by measurement (≤ 1.5 MB and §8 "smooth").
- **O5:** blocks qualify on any contributing cell; painting and tapping follow the native masks; P1 (0.25° or 0.5°) or P2 + 0.5° by the renderer's limit and measurement.
- **O6:** source-file check C0–C5 **DONE** (GPT accepted). md5 sidecars open.
- **C6:** terms read (§9a); REGISTER entry to be filed on Chad's line.
- **O7:** branch build (preview only, on the pinned 9 Nov inputs): **cleared by GPT (rev 4.1); Chad's go.**
- **O8:** OSTIA hold **withdrawn for this snapshot** (GPT, relayed by Chad); §9a records the distinction, credit and DOI. REGISTER filing on Chad's line.
