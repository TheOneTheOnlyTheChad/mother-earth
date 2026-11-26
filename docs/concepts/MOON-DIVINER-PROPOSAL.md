# Moon globe: Diviner temperature — assessment and proposal

Rev 2 · 26 Nov 2026 · written by Claude · **docs only: nothing built, nothing fetched in bulk, nothing deployed, no hub change** · for GPT's recheck

Rev 1 (`9be23dd`, fixes `caa00ab`) was reviewed by GPT on 26 Nov: **REVISE FIRST**, with the GCP product and the bounded noon/midnight concept supported. The review is filed unchanged as `reviews/2026-11-26-moon-diviner-proposal-rev1-gpt-review.md`. §14 maps each of GPT's points R1–R5 to its answer. Chad's instruction for rev 2 (26 Nov): address the statistic and readout semantics, acquisition retention and recovery, shared lighting-state transitions, the numerical and display contract, and the validation claims; update the checklist. No extra global sampling is needed for this revision. No build or bulk acquisition.

Checklist item §3 of `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`. It answers the Diviner part of GPT's brief (`docs/concepts/MOON-LRO-SCIENCE-BRIEF-GPT-2026-11-25.md`).

**Evidence:** `docs/research/moon-lro-science/SAMPLES.md` §6 (rev 2 changes in §6.7), `assess_diviner.py` (rev 2: fails on any hash, layout or value error) and `assess_diviner_output-2026-11-26.txt`. The sample files are on the Mac in `_source-data/moon-lro-science-2026-11-26/` (the two older GCP patches) and its `diviner/` subfolder (the rest, with `SHA256SUMS.txt`). They are not committed.

## 0. Bottom line

- **Product (unchanged, supported by GPT):** the Diviner Global Cumulative Product (GCP), `LRO-L-DLRE-5-GCP-V1.0`. Its per-bin bolometric brightness temperature `tbol` is computed by the Diviner team from mean channel radiances, from nadir observations 5 Jul 2009 – 1 Apr 2015.
- **Our statistic, named precisely (R1):** for each 0.5° cell, the **unweighted mean of the available quarter-hour `tbol` bin values** within an hour of local noon (11:30–12:30) or local midnight (23:30–00:30). It is a descriptive summary of up to four published bin values. It is not a bolometric temperature for the whole hour, and not necessarily a fully sampled hourly average. The readout always shows how many bins it uses. "Range" is shown only for two or more bins, and is never called uncertainty.
- **Three cell states, kept apart in the data, on the map and in the legend:** a value; **no valid data in this window**; **withheld by our display policy** (noon beyond 70°, midnight beyond 80°).
- **Acquisition (R2):** route A, whole-file streaming of the 18 band files in the browser pane. Each band is checked against the archive's MD5 and has its own durable checkpoint. A band that fails is refetched whole. Nothing is published from a partial acquisition. A **first-band trial** comes first and measures time, memory and parsing. **Retention** is a decision for Chad (D8): keep a lossless extraction of all 96 local-time `tbol` values per cell (about 54–77 MB gzip, estimated from the samples), so other windows need no refetch; or keep only the two-window grid and refetch if a new window is ever wanted.
- **Transitions (R3):** one science-mode coordinator for height and temperature. The original lighting and Earth-view state is saved **once** on entering science mode, and kept across height ⇄ temperature and noon ⇄ midnight. It is restored for the current minute only on leaving science mode. The shown map stays until its replacement has passed validation. Stale answers are discarded.
- **Numerical contract (R4):** a strict parser, a 64-byte header with magic, schema, dimensions and payload hash, fixed sentinel codes, an encodable "range unavailable", a disclosed rounding and cap, and whole-file validation in the page before use. Each mode has a fixed colour scale computed once from valid displayed cells, with the scale numbers and any clipping in the legend.
- **Validation claims (R5):** narrowed. The four-cell GHRM agreement is corroboration only. Registration gets explicit coordinate and grid tests plus origin and flip controls. Single bins, cycle maps and dawn/dusk are described as unsuited to *this* display, not as unusable.
- **Page cost (estimated):** a derived file of about 0.8–1.2 MB gzip (2,073,664 B raw), fetched only when the layer is first switched on.

## 1. What stays unchanged

The Moon picture `assets/moon/lroc_color_2k.jpg` (shared with Tides; in Tides' served list), the globe's orientation, the polar disclosure, default even lighting, "Lit as now", "As seen from Earth now", the dated LRO path (10–11 Jun 2026), the height layer's data files and their meaning, `craft.js`, `sunglobe.js`, `skyscene.js`, the Tides page, the hub, R2, D1 and the collectors.

**Changed at build** (stated now so nothing is hidden):
- `moon.html`: the temperature controls and legend.
- `moonsci.js`: the shared science-mode coordinator of §5. The released height layer moves onto it, so its suite must stay green and gains transition tests.
- `moonsci.css`.
- `moonglobe.js`: only if a hook is needed, for example a texture handover that takes a canvas.
- `sources.html`.
- New files in `assets/moon/diviner/`.

Any change to `moon.html`, `moonglobe.js` or `sources.html` moves the Animals suite pins (`MH_MAIN`, checks 13e, 13q–13s) in a narrow maintenance commit.

## 2. Products checked (SAMPLES §6.1)

| Option | Fit for this display (a near-complete, one-hour, representative map) | Verdict |
|---|---|---|
| **GCP** (2 ppd, 96 local-time bins, 2009–2015) | Documented. Noon and midnight come from one source, with explicit empty bins | **Recommended** |
| GHRM `dghrm_tbol_m` (128 ppd, midnight fit, 2009–2022, 70°S–70°N) | Documented and longer. Midnight only, as an empirical fit (Powell et al. 2023); 3.3 GB per map | Corroboration now; a possible later high-resolution midnight (§11) |
| GDR Level 3 TBOL per 27-day mapping cycle (4 ppd, 2009–2016) | A true dated interval and small (2 MB). Sparse for a near-complete map (one 2016 day cycle: 4–6% of cells between 60°S and 60°N), with local time differing across the map | Unsuited to this display. Valuable for a dated-pass feature (§11) |
| PCP (80–90° caps) | Polar only, polar stereographic | A later polar question (§11) |
| PRP, Level 3 rock abundance / regolith temperature / CF, RCP, EPF | Modelled, compositional, regional, or not maps | Not this layer |
| RDR (point records to 15 Jun 2026) | No `tbol` field: it would be our own bolometric computation | Not proposed (§11) |

No newer GCP version exists (GCP files dated 15 Mar 2017; derived bundle last changed 2 Feb 2024).

## 3. The quantities, defined

**3.1 The GCP's per-bin `tbol` (the Diviner team's processing).**
- **Label:** "Bolometric average calibrated brightness temperature (K)".
- **SIS v1.21 §8.1 and `gcpds.cat`:** RDR radiances are binned per channel (3–9) in 0.5° × 0.5° × 0.25 h bins, and "the mean radiance values for all the channels were used to determine the bolometric brightness temperatures for each bin". The SIS refers to Paige et al. 2010 for the method. Claude read the SIS in full text; GPT also read §8.1 from the primary archive.
- **General meaning:** the temperature of an equivalent blackbody emitting the measured wavelength-integrated thermal radiance.
  - **Primary source:** Powell et al. 2023, JGR Planets 128, e2022JE007532, §2.5 (open access). **This is GPT's read** (review R0). Claude's fetch on 26 Nov needed an approval that went unanswered, so Claude reads §2.4–2.5 in full text before any build.
  - The third-party copy of Paige et al. 2010 stays labelled as secondary.
  - The team's spectral interpolation and extrapolation are not claimed.
- **Footprint against cell:** the GCP bins radiances into 0.5° cells, about 15 km across at the equator (0.5 × 30.3 km). Diviner's detector footprint is much smaller than the cell. **The map cell is not the detector's footprint**, and no footprint is drawn.

**3.2 Our second step (the statistic shown).**
- For each cell and window, take the bins whose `tbol` is a valid value (§6.1). The GCP's empty (`-9999`) and invalid (`-9998`) bins are omitted.
- **Window value** = unweighted arithmetic mean of those bin values, in float64. This is a descriptive summary: one bin counts the same as another, whatever its number of underlying observations (the GCP does not publish per-bin counts). It is not a radiance-weighted combination and not a bolometric temperature for the hour. With fewer than four bins it is not a fully sampled hourly average.
- **n** = number of bins used (0–4).
- **Range** = maximum minus minimum of the bin values used, **defined only for n ≥ 2**. It describes the spread between those published bins. It is **not** an uncertainty, accuracy, confidence interval or the full temporal variability.
- **n = 0:** "no valid data in this window". This covers empty and invalid bins together, so the wording does not claim there was no observation.
- **Latitude masks are our display policy**, not instrument coverage limits, and not a guarantee of small spread inside them: the 60–70°S noon sample already has one cell with a 54.72 K range. The range is in every readout, so a large spread is always visible.

**3.3 Local time.** Hours past local midnight at the observed point (SIS RDR field `cloctime`), 0–24 over one lunar day, so one hour is 15° of the Sun's hour angle. GCP bin centres are 0.125 + 0.25k h (checked).

## 4. Display (Moon tab only)

**Controls.** Beside "Show height (LOLA)": **"Show temperature (Diviner)"** and a two-option radio group, **"around local noon" / "around local midnight"** (default noon; the group is enabled only while temperature is shown). The behaviour of every combination is defined in §5.

**Draft wording** (for review):
- **Legend title:** "What LRO measured: brightness temperature around local noon" (or "… local midnight"), badge "Measured".
- **Legend line:** "Our unweighted mean of the available quarter-hour Diviner bin temperatures within an hour of each place's own local noon (11:30–12:30). The bins were compiled by the Diviner team from observations made July 2009 – April 2015. Each 0.5° map cell is much larger than Diviner's footprint. This is not today's temperature, and the Moon is shown evenly lit."
- **Explainer:** "Bolometric brightness temperature is the temperature of a perfect emitter giving off the heat Diviner measured. Where rock and soil, or sun and shade, share a cell, it is not the temperature of any one surface. Noon and midnight are each place's own local time, not the Sun's position now."
- **Scale line**, always visible and repeated when the mode changes: "Colour scale: noon a–b K. The midnight map uses c–d K. The same colour does not mean the same temperature on the two maps." Values outside the scale are clipped, and the ends read "≤ a K" and "≥ b K".
- **Readouts:**
  - n ≥ 2: "391.3 K (118.2 °C) around local noon · mean of 3 quarter-hour bins · range between bins 2 K · 0.5° cell centred 0.25°N, 0.25°E."
  - n = 1: "389.8 K (116.7 °C) around local noon · one bin; range unavailable · 0.5° cell centred …"
  - range at the cap: "range between bins 254 K or more".
  - n = 0: "No valid data in this window for this cell (0.25°N, 0.25°E)." No number.
  - withheld: "Not shown: our display limit is 70° latitude for noon (80° for midnight). Near the poles the Sun stays low and local time means little, so a one-hour window mixes very different temperatures. This is our choice, not the edge of Diviner's coverage."
  - The readout gives values to 0.1 K, and the legend says: "values are rounded to 0.1 K; the rounding is not the accuracy".
- **Map states:** valid cells on the colour ramp; **no valid data** in a dark neutral hatch; **withheld** in a flat light neutral. Each has its own legend key. Neither neutral is a ramp colour.

**Colour scales.** One fixed sequential ramp, with one scale per mode. Each scale's ends are the 1st and 99th percentiles of **valid, displayed** cells only (no-data and withheld excluded), computed once after acquisition, recorded in `SOURCE.json`, and never recalculated per view. The share of cells clipped at each end is recorded and stated in Sources. There is no hazard or "hot/cold zone" styling.

**Keyboard and narrow screens:** as for height (focusable controls, "Read temperature at centre", an aria-live readout), plus the radio group. Keyboard access to the withheld areas is not claimed.

## 5. Shared transitions between appearance, height and temperature (R3)

Today the height layer alone remembers `{on: lit.on, earth: lit.earth}` when it switches on (proposal rev 2.1 §4.3; `moonsci.js`). With a second science layer, that memory would be overwritten: height → temperature would save height's forced-off state. Rev 2 replaces it with **one coordinator**, `MoonScience` in `moonsci.js`, which both layers use.

**State:** `active` ∈ {none, height, temp-noon, temp-midnight}; `saved` = the appearance state `{litOn, earthView}`, or null; `pending` = {target, token, abort controller}, or null. Each layer owns its decoded data and its texture; the coordinator owns what is on the globe.

**Rules:**
1. **Entering science mode** (active = none, user picks M). The view does not change while M loads and validates. On success, in one step: `saved` = current `{litOn, earthView}` (**only here**); leave the Earth view; set "Lit as now" off through the existing path; lock both lighting buttons; show M's texture; active = M.
2. **Changing within science mode** (active = A, user picks M ≠ A, including noon ⇄ midnight). **A stays on the globe** while M loads and validates. On success, swap the texture in one call (active = M). **`saved` is not touched.** On failure or cancel, A stays and the line says why.
3. **Leaving science mode** (the active layer's own button pressed again). Picture back, lighting buttons unlocked. If `saved.litOn`, "Lit as now" is recomputed **for the current minute**. The Earth view is **not reopened**: the line says "Earth view was closed while a science map was shown; 'As seen from Earth now' can reopen it" (the existing rule). `saved` = null.
4. **Rapid changes:** every request takes a new token and aborts the previous pending one. Only the latest token may commit. A late answer is discarded, and anything it created (decoded arrays, object URLs, canvases) is released.
5. **Cancel while entering** (pressed again during the first load): abort; nothing in the view changed; `saved` stays null.
6. **Resources:** a texture is released only when it is neither on the globe nor in its layer's cache. Height keeps its existing cache. Temperature keeps one decoded grid (both modes come from one file) and one texture per mode once drawn. Failed and cancelled attempts keep nothing.
7. **Independent:** the LRO overlay in every state.

**Tests** (new, in `moon-height-ui` and a new `moon-diviner-ui`, each with deliberate breaks):
- Lit as now on → height → temp-noon → temp-midnight → height → off: Lit as now restored for the current minute. Same sequence with Lit as now off: stays off. The Earth view is never reopened, and the line says so.
- The same with temperature first: temperature → height → off.
- In each direction, a failed replacement (404, bad hash, truncated gzip, wrong header) leaves the previous map shown and usable.
- Rapid clicks across all four modes: only the last one commits, the counts of released resources match, and no stale texture is shown.
- Cancel during first entry leaves `saved` null and the view unchanged.
- The current height tests all pass unchanged in behaviour.

## 6. Numerical and data contract (R4)

**6.1 Parsing a GCP record (builder; the same rules as `assess_diviner.py` L1).**
- Every record is exactly 113 bytes and ends in CRLF. The file has a 113-byte header line, checked against the first band's recorded header bytes.
- 11 comma-separated fields, each matching `^ *-?[0-9]+(\.[0-9]+)?$`, parsed as finite numbers.
- Coordinates must follow the exact sequence: longitude slowest in 0.5° steps, then latitude ascending in 0.5° steps, then the 96 local-time bins at 0.125 + 0.25k h (printed to 2 decimals).
- 1,382,400 records per band.
- `tbol` is **exactly** the text `-9999` (empty) or `-9998` (invalid), or a finite value with 1 K < `tbol` < 450 K. These are **our** plausibility bounds: the label documents only the special constants. The lower bound keeps every valid value clear of the reserved codes 0 and 1 in §6.2; the samples' lowest value is 28.3 K. Any other value, such as `-9997`, a negative number or `nan`, **stops the build**. It is never encoded.
- Each failing case is a test (eight already pass as breaks in `assess_diviner.py --structure-only`).

**6.2 The page file `assets/moon/diviner/gcp-tbol-nm-R1.bin.gz`** (gzip −9, mtime 0, of the following, all little-endian).

| Offset | Bytes | Field |
|---|---|---|
| 0 | 8 | magic `MEDIVNR1` (ASCII) |
| 8 | 2 | schema = 1 |
| 10 | 2 | header length = 64 |
| 12 | 2 | columns = 720 |
| 14 | 2 | rows = 360 |
| 16 | 2 | planes = 6 |
| 18 | 2 | flags = 0 |
| 20 | 2 (i16) | first column centre, 0.01° east = 25 (0.25°E; columns run east from 0°E) |
| 22 | 2 (i16) | first row centre, 0.01° = 8975 (89.75°N; rows run south) |
| 24 | 2 | cell size, 0.01° = 50 |
| 26 | 2 | noon mask latitude, 0.1° = 700 |
| 28 | 2 | midnight mask latitude, 0.1° = 800 |
| 30 | 2 | reserved = 0 |
| 32 | 32 | SHA-256 of bytes 64 to end |

**Planes** (row-major, 259,200 cells each, in this order):

| # | Offset | Bytes | Content |
|---|---|---|---|
| P1 | 64 | 518,400 | noon value, u16: **0 = no valid data**, **1 = withheld**, v ≥ 2 → v/10 K (mean rounded half up to 0.1 K) |
| P2 | 518,464 | 518,400 | midnight value, same coding |
| P3 | 1,036,864 | 259,200 | noon n, u8, 0–4 (0 for withheld) |
| P4 | 1,296,064 | 259,200 | midnight n |
| P5 | 1,555,264 | 259,200 | noon range, u8: whole K rounded half up; **254 = 253.5 K or more** (capped, shown "254 K or more"); **255 = unavailable** (n ≤ 1, no valid data, or withheld) |
| P6 | 1,814,464 | 259,200 | midnight range, same coding |

Total **2,073,664 B** raw (64 header + 2,073,600 planes). The page pins the gzip bytes' SHA-256, the raw length and the raw SHA-256, as the height layer does.

**6.3 Validation in the page before anything is shown.** The whole file is rejected, with nothing displayed and the previous map kept (§5), unless all of these hold:
- gzip and raw pins; exact raw length; magic and every header field equal to the constants above; the header's payload SHA-256 matches;
- for every cell and mode:
  - value = 1 ⇔ the cell is beyond that mode's mask
  - value = 0 ⇔ n = 0 and not masked
  - value ≥ 2 ⇔ 1 ≤ n ≤ 4
  - range = 255 ⇔ n ≤ 1
  - valid values ≤ 4500 (450 K)

**6.4 Global report before freezing the preview.** After acquisition, and before the preview is built, the build reports:
- the global distribution of n (0–4) and of range for each mode, by 10° latitude band
- the share of no-valid-data cells
- the two colour scales and their clipped shares

The masks and scales are frozen only after that report has gone to Chad and GPT.

## 7. Acquisition, checkpoints, recovery and retention (R2)

**7.1 Route A, defined.** The 18 band files are fetched **one at a time, in a fixed order** (00N–10N first), in the browser pane (the only route that reaches PDS), by a job that runs inside the page and is polled by short tool calls (tool calls have a 45 s limit). Each band is read with `response.body.getReader()`, as a stream:
- **Bytes** feed an incremental MD5 and an incremental SHA-256. `crypto.subtle` has no MD5 and no incremental digest. The implementation is a small pure-JS one, pinned by its own SHA-256 and verified **before use** against the RFC 1321 and FIPS 180-4 test vectors and against Node's `crypto` on the seven sample files. It is injected into the pane with the job. It is build tooling only, never served on the site.
- **Records** are parsed directly from the bytes in fixed 113-byte slices, with a carry buffer across chunk edges (§6.1). No whole-file text decoding; no whole-file buffer.
- **Per-band output buffers** are preallocated: the band's two-window rows (≤ 0.3 MB) and, under D8 (a), a 1,382,400-value `Int32Array` (5.5 MB) of every `tbol` × 10000. The source has 4 decimals, so ×10000 is exact: checked on every sample value. Sentinels are stored as −99,990,000 and −99,980,000.
- **Memory** should stay in the tens of MB, but that is an estimate. The first-band trial measures it (`performance.memory`, a non-standard, approximate Chromium reading, labelled as such) along with the parse time.

**7.2 Durable checkpoint per band.** One JSON line per completed band is appended to `docs/research/moon-lro-science/diviner-acq/checkpoints.jsonl` and committed. It holds:
- band and URL
- bytes against 156,211,313; `Last-Modified`
- archive MD5 (from the list) and computed MD5
- computed SHA-256
- start and end times (clock readings)
- the header-line hash; records = 1,382,400
- sentinel counts; `tbol` minimum and maximum
- the coordinate-check result
- the job script's SHA-256 (the parser version)
- the band's two-window output SHA-256; under D8 (a), the extraction's raw and gzip SHA-256 and sizes
- the memory and time readings

**A band is complete only when** its checkpoint is committed and its outputs are stored (§7.4) and re-hashed.

**7.3 Recovery.**
- If the pane reloads, the tool loses contact or a fetch stalls, the job restarts at the first band without a complete checkpoint. **A partial band is always refetched whole from byte 0.** There is no resume within a band.
- **Stops:** an MD5 or size mismatch, any structural or value failure (§6.1), or two failed attempts on the same band. The job stops, records the reason and reports to Chad.
- **No preview or page file is ever built unless all 18 checkpoints are present and pass.** The builder checks this.

**7.4 Retention (D8, Chad's decision).** GPT pointed out that rev 1's "any window can be derived afterwards without refetching" contradicted "nothing but the small derived grid leaves the pane". Rev 2 drops that claim unless option (a) is chosen.
- **(a) Keep a lossless extraction of all 96 local-time `tbol` values per cell** (recommended). Per band, 5,529,600 B raw; 99,532,800 B in all. Gzip size **estimated at about 54–77 MB**, from the seven sample patches (ratios 0.54–0.78, measured; polar patches are over-represented, so this is not a global measurement; the first band measures its own). Stored on the Mac in `_source-data/moon-lro-science-diviner-gcp/`, not committed, with SHA-256s in the checkpoints.
  - With it, any other local-time window can be derived later **without refetching**.
  - Channels t3–t9 are not kept: a future channel feature would refetch.
  - There are two ways to move it out of the pane:
    - **(a1)** base64 pieces through tool calls, as for the samples. About 110–150 calls, nothing for Chad to do.
    - **(a2)** an in-page download of each band's extraction to the Mac's Downloads folder. Fast, but the download needs Chad's explicit yes, and the pane must allow downloads.
- **(b) Keep only the derived two-window grid** (about 2 MB). Any other window later means a new acquisition (16–37 min estimated).

**7.5 The first-band trial (a stop point).** Band 00N–10N only:
- verify the hashing code against its vectors, then fetch, stream and check (MD5, size, structure, values)
- reduce the two windows; under D8 (a), extract all bins
- compare the result **cell for cell** with `assess_diviner.py` on the two sampled patches inside this band (the far-side patch at 179.75°W–175.25°W and the near-side patch at 0.25–4.75°E; 400 cells × 2 windows)
- measure time, memory and the compressed extraction size
- write the checkpoint

The result goes to Chad and GPT. **The other 17 bands are fetched only after that.** This proposal authorises no acquisition: the trial needs Chad's go (D4a), and the remaining bands need a second go after the trial report (D4b).

**7.6 Route B** (multi-range for the two windows only; about 154 MB per window including multipart overhead; 18–128 min per window, estimated) stays the fallback. There is no archive checksum for the parts, and it was tested only up to 128 ranges.

## 8. Verification (R5)

1. **Builder `--check`:** the in-page reducer, run under Node on the samples, and the Python reference agree on every sampled cell (7 patches, 1,400 cells × 2 windows), including n, range coding, no-valid-data and withheld codes, and rounding.
2. **Archive integrity:** 18 MD5s and sizes, and the hashing code's vector tests.
3. **Registration**, by explicit tests rather than agreement statistics:
   - (a) **Index tests:** the GCP's first record (−179.75°, first latitude) lands in column 360, row as computed; +179.75° lands in column 359; 0.25°E in column 0; the latitude row of ±0.25° and of each band's first and last row; tested on synthetic marked grids and on the real first band.
   - (b) **Origin and flip controls:** deliberately shifted (±1 cell, 180°) and mirrored (east–west, north–south) grids must fail the index tests and score worse in (c).
   - (c) **GHRM comparison** at about 20 sites, including high-contrast young craters (coordinates to be taken from a gazetteer at build) as well as smooth plains, fetched by capped multi-range (≤ 128 ranges each, about 84 KB per site). Differences are **reported with their expected causes**: GHRM's 2009–2022 period, its fitted midnight, its 128 ppd sampling and pointing treatment. There is **no universal pass tolerance**; the 0.20–0.50 K seen at four cells is not a target. A large, systematic, location-dependent difference blocks the preview until it is explained.
4. **Page tests (`moon-diviner-ui`, with breaks):** the §5 transitions; readouts for n = 1, 2–4, 0, withheld at each mask edge, the seam and the range cap; no 0 K anywhere; nothing fetched until switched on; every §6.3 rejection case (each a crafted file) leaves the previous map shown; keyboard path; 360 px layout; the scale line on mode change.
5. **All existing Moon, Tides, Sky, Animals and desktop-overflow suites stay green;** the served manifest is refreshed for the release.
6. **Not verified (carried):** a real phone, Safari, a screen reader, a hardware renderer, energy or CPU. Draw counts are only counts.

**What the evidence so far supports, stated narrowly:**
- The sample statistics (SAMPLES §6.5) describe seven 10° × 5° patches, not global completeness.
- The four-cell GHRM agreement is **corroboration from a related product** (same instrument lineage, different period and method). It is not independent absolute accuracy and not a registration proof: smooth ~100 K night fields can agree despite an indexing error.
- GPT independently recomputed the bin counts and spreads for the seven patches with its own standard-library parser (labelled as GPT's work). It did not rerun `assess_diviner.py`.

## 9. Costs: measured on samples, kept apart from estimates

**Measured** (26 Nov, browser pane, Chad's connection; single runs; SAMPLES §6.3–6.4):

| Item | Value |
|---|---|
| Contiguous fetch of 2.07–2.17 MB | 708–1,702 ms (8 fetches), 1.25–2.93 MB/s |
| Multi-range, 128 × 512 B (GHRM) | 1,723–3,790 ms; 83,888 B body for 65,536 B payload |
| Multi-range, 80 × 452 B (GCP) | 329 ms; 46,128 B body for 36,160 B payload |
| Multipart overhead | about 143 B per part |
| One request with two 2.17 MB ranges | did not finish within the 45 s tool limit (time unknown) |
| Lossless int32 × 10000 extraction of the seven sample patches | exact on every value; gzip ratio 0.538–0.775 (total 347,089 of 537,600 B) |
| One 4 ppd cycle map, gzip | 394,752 / 656,026 B |

**Estimated** (not measured):

| Item | Estimate | Basis |
|---|---|---|
| Route A transfer | 2.81 GB, 16–37 min plus stalls | measured rates |
| Peak memory during route A | tens of MB | §7.1 design; measured in the trial |
| D8 (a) extraction | 99.5 MB raw, about 54–77 MB gzip | sample ratios; trial measures band 1 |
| D8 (a1) copy-out | about 110–150 tool calls | 512 KB per piece |
| Page file | 0.8–1.2 MB gzip (2,073,664 B raw) | assumed 0.40–0.60 ratio for full maps |
| Page decode and validation | under 100 ms | the height grid decoded in 20 ms; plus the cell consistency checks |
| Drawing | one texture swap while on, as for height; the neutrals are painted into the same texture | draw counts measured in the build |

## 10. Records (at release only)

REGISTER entry "LRO Diviner — Global Cumulative Product (tbol)", `sources.html#moontemp` and `assets/moon/diviner/SOURCE.json`. They hold:
- the citations: bundle DOI 10.17189/wj0s-w188 (Paige, Sullivan, Williams 2022); Williams et al. 2017, Icarus 283, 300–325, with the label's DOI typo noted; Powell et al. 2023 for the general definition, once Claude has read it
- the product version and compilation period
- **our** statistic in the words of §3.2
- the rounding, cap and coding
- the masks as display policy
- the colour scales with clipped shares
- the 18 archive MD5s and the checkpoint file's hash
- "PDS data are in the public domain"

**Review cadence:** the bundle's release notes and the GCP directory are checked every six months and on any Diviner derived release, with the last-checked date in REGISTER; earlier versions are kept.

## 11. Not proposed for this display (scope choices, with revisit conditions)

These are unsuited to the chosen near-complete, one-hour, representative map. None is scientifically unusable.
- **Single mapping-cycle maps:** sparse sampling, and local time differing across the map, are what a **dated-pass** feature would show honestly. Revisit if Chad wants "one month of passes", with gaps and local times.
- **Single quarter-hour bins and dawn/dusk windows:** the large changes within an hour (18–85 K mean) are real. They suit a **diurnal-curve** feature (for example, temperature through the lunar day at one clicked place, from the D8 (a) extraction). Revisit after the first release.
- **GHRM high-resolution midnight:** revisit after the first release; a 3.3 GB stream; read Powell et al. 2023 first; choose `m` or slope-adjusted `sam`.
- **Polar PCP:** revisit as its own polar question.
- **An RDR dated interval for 10–11 June 2026:** revisit only under checklist item 9 (verified time, frame and pointing).

## 12. Pages

Moon tab: the layer above. Tides: unchanged (closed decision). Sky zoom-out: unchanged (item 10a is separate). Sources: a new section at release.

## 13. Decisions for Chad (after GPT's recheck)

- **D1 Product:** GCP noon and midnight (recommended; supported by GPT).
- **D2 Window:** one hour (recommended; supported).
- **D3 Masks:** noon 70°, midnight 80° as display policy (recommended; supported), frozen only after the §6.4 report.
- **D4a:** go for the first-band trial (§7.5; about 156 MB from PDS in the pane). **D4b:** after the trial report, go for the other 17 bands.
- **D5 Texture:** drawn in the page from the validated grid (recommended; supported).
- **D6 Units:** K with °C secondary (recommended; supported).
- **D7 Readout:** bin count always; range for n ≥ 2 as defined in §3.2 (recommended; supported).
- **D8 Retention:** (a) lossless all-bin extraction kept on the Mac (recommended), copied out by (a1) tool calls or (a2) downloads with your yes; or (b) the two-window grid only.

## 14. GPT's rev 1 review: where each point is answered

| GPT point | Answer in rev 2 |
|---|---|
| R1 name the statistic; GCP bins and our mean are distinct steps; legend wording; bin count visible; footprint against cell | §3.1, §3.2, §4 legend and readouts |
| R1 n = 1 "range unavailable"; range defined for n ≥ 2, not uncertainty; zero-bin wording "no valid data in this window" | §3.2, §4, §6.2 (code 255) |
| R1 no-valid-data, withheld and valid distinct in data, map and legend | §4 map states, §6.2 codes 0/1, §6.3 |
| R2 retention contradiction | §7.4 (claim removed unless D8 (a)) |
| R2 per-band checkpoints, resume, sequential, streaming against holding, measured memory, MD5 implementation, structure checks, stop on failure, no partial publishing | §7.1–7.3, §6.1 |
| R2 first-band trial; Chad's bulk-fetch decision | §7.5, D4a/D4b |
| R3 atomic switch after validation; failed replacement keeps the previous map; stale answers; saved once; restore for current minute only on leaving; switch-off defined; Earth-camera rule; resources; tests | §5 |
| R4 strict parsing and sentinels; bounds | §6.1 (our plausibility bounds, stated as ours) |
| R4 header, dimensions, order, offsets, byte order, lengths, sentinels; validate the whole payload | §6.2, §6.3 |
| R4 n = 1 encodable; cap disclosed | §6.2 P5/P6, §4 readouts |
| R4 different scales prominent; quantiles from valid displayed cells; clipping shown; no per-view rescale | §4 scale line and colour scales |
| R4 masks are display policy; 60–70°S max 54.72 K; global distribution before freezing | §3.2, §4 withheld wording, §6.4 |
| R5 GHRM as corroboration; no universal tolerance; explicit coordinate and flip tests | §8 item 3 and the closing paragraph |
| R5 "unusable" too broad | §2, §11, SAMPLES §6.5 (reworded) |
| R5 the script prints MISMATCH without failing; staging layout; don't claim GPT reran numpy | `assess_diviner.py` rev 2 (exit 1; layout; eight break tests), SAMPLES §6.7, §8 closing paragraph |
| R0 Powell et al. 2023 as primary source for the general definition | §3.1 (GPT's read; Claude's read before build) |
