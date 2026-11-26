# Moon globe: Diviner temperature — assessment and proposal

Rev 1 · 26 Nov 2026 · written by Claude · **docs only: nothing built, nothing fetched in bulk, nothing deployed, no hub change** · for GPT's review

Checklist item §3 of `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`. It answers the Diviner part of GPT's brief (`docs/concepts/MOON-LRO-SCIENCE-BRIEF-GPT-2026-11-25.md`): "a bounded Diviner example, either one documented map product or a short dated observation interval"; channel brightness temperature kept apart from bolometric temperature; local time, viewing geometry and aggregation recorded; no "Moon temperature now"; no thermal response synchronised to the day/night control; the `-9999` warning checked against the exact product; missing never 0 K. Chad's go for this step (26 Nov): recheck suitable products first, use bounded small samples, define `tbol` from the documentation, test multi-range retrieval with a capped request, no global acquisition, keep measured sample costs apart from estimated build and page costs.

**Evidence:** `docs/research/moon-lro-science/SAMPLES.md` §6 (new), with `assess_diviner.py` and `assess_diviner_output-2026-11-26.txt` beside it. The earlier Diviner reads are in SAMPLES §1 and §3. The sample files are on the Mac (`_source-data/moon-lro-science-2026-11-26/` and its `diviner/` folder) and are not committed.

## 0. Bottom line

- **Recommended product: the Diviner Global Cumulative Product (GCP)**, `LRO-L-DLRE-5-GCP-V1.0`. Its quantity is `tbol`, the **bolometric brightness temperature**, compiled from all nadir observations 5 Jul 2009 – 1 Apr 2015. It is the only global Diviner product that covers every local time, so noon and midnight come from one product, one period and one method.
- **Recommended display:** one optional Moon-tab layer, off by default, with two maps: **"around local noon"** (11:30–12:30) and **"around local midnight"** (23:30–00:30). Each 0.5° cell shows the **unweighted mean of the available 15-minute bins** in that one-hour window. The click readout gives the number of bins behind the value (1–4) and their spread.
- **Latitude limits (proposed):** midnight shown 80°S–80°N, noon 70°S–70°N, everything poleward withheld and said so. Beyond those latitudes the within-window spread grows to tens of K, and local time stops meaning much.
- **Measured on the samples:** a one-hour window fills every sampled cell at midnight. At noon it leaves 7 of 200 cells empty in one near-side equatorial patch (3.5%) and 1 of 200 in each of the 60–70°S and 70–80°N patches. The spread inside the window is 1–3 K at noon and 1–2 K at midnight at low and mid latitudes. **Independent check:** the team's separate 2009–2022 midnight mosaic (GHRM) agrees with the GCP midnight window to within 0.2–0.5 K at all four overlapping cells.
- **Multi-range retrieval works** (capped tests up to 128 ranges, every part verified). For this product, though, the proposed route is **streaming the 18 whole band files in the browser pane** (2.81 GB, estimated 16–37 min): each file can be checked against the **archive's own MD5**, and nothing but the small derived grid leaves the pane.
- **Page cost (estimated):** a derived file of about 0.7–1.1 MB, fetched only when the layer is switched on. No change to the shared Moon picture, Tides, the Sky view, `craft.js`, `sunglobe.js`, the hub or the collectors.
- **Not proposed now, with revisit conditions (§10):** single mapping-cycle maps (sparse: 4–6% of low-latitude cells by day), the GHRM high-resolution midnight map, the polar products, and an RDR "dated interval" for 10–11 June 2026.

## 1. What stays unchanged

The Moon picture `assets/moon/lroc_color_2k.jpg` (shared with Tides; in Tides' served list), the globe's orientation, the polar disclosure, default even lighting, "Lit as now", "As seen from Earth now", the dated LRO path (10–11 Jun 2026), the released height layer, `craft.js`, `sunglobe.js`, `skyscene.js`, the Tides page, the hub, R2, D1 and the collectors. The temperature layer adds new files only (§5). It changes `moon.html`, `moonglobe.js` only if a hook is needed, `moonsci.js`/`.css` and `sources.html`. Any change to those files moves the Animals suite pins (`MH_MAIN`, checks 13e, 13q–13s) in a narrow maintenance commit.

## 2. Products checked (SAMPLES §6.1)

| Option | Fit for "one documented map product or a short dated interval" | Verdict |
|---|---|---|
| **GCP** (2 ppd, 96 local-time bins, 2009–2015) | A documented map product. Both noon and midnight come from one source; per-bin values and empty bins are explicit; the method is in the SIS and Williams et al. 2017 | **Recommended** |
| GHRM `dghrm_tbol_m` (128 ppd, midnight fit, 2009–2022, 70°S–70°N) | Documented, published, longer period, higher resolution. **Midnight only.** 3.3 GB per map; the midnight value is an empirical fit (Powell et al. 2023, not read) | Cross-check now; optional later high-resolution midnight (§10) |
| GDR Level 3 TBOL per mapping cycle (4 ppd, 2009–2016) | A true dated interval (27 days) and tiny (2 MB). **Sparse** (one day cycle: 19.5% of cells, 4–6% between 60°S and 60°N; one night cycle: 36.8%), and local time differs across the map | Not recommended as the first example (§10) |
| PCP (80–90° caps, 240 m) | Polar only, a different projection | Later polar question (§10) |
| PRP, Level 3 rock abundance / regolith temperature / CF, RCP, EPF (bundle 2) | Modelled, compositional, regional, or not maps | Not this layer |
| RDR (point records, data to 15 Jun 2026) | Could give a dated interval near the LRO example, but `tbol` is not a field there; it would be our own bolometric computation, and it carries the 2019 channel 1–2 gap | Not proposed (§10) |

No newer GCP version exists. The derived bundle was last changed 2 Feb 2024 (GHRM added), and the GCP files are dated 15 Mar 2017.

## 3. The quantity, defined from the documentation (SAMPLES §6.2)

- **Label:** `tbol` = "Bolometric average calibrated brightness temperature (K)".
- **SIS v1.21 §8.1 and `gcpds.cat`:** RDR radiances are binned per channel (3–9) in 0.5° × 0.5° × 0.25 h bins; "the mean radiance values for all the channels were used to determine the bolometric brightness temperatures for each bin". The radiances are averaged first and then converted; this is not a mean of temperatures.
- **Method reference (SIS §2.2.6):** Paige et al. 2010, Science 330, 479. The paper's definition sentence was read only in a third-party copy of its text, **labelled as secondary**: the wavelength-integrated radiance in all seven channels, expressed as the temperature of an equivalent blackbody. It equals the surface temperature only for a uniform blackbody footprint. The team's spectral interpolation and extrapolation were not read and are not claimed.
- **Our second step** (proposed): averaging up to four bin values of `tbol` within one hour of local time. This is an **unweighted mean of bin values** (each bin already a radiance-mean conversion). It is not a radiance-weighted or observation-count-weighted mean: the GCP gives no per-bin observation counts. Stated in the records.
- **Missing values:** GCP `-9999` = empty bin, `-9998` = invalid (none in any sample). Both are treated as no value, never 0 K. The RDR's 2019 `-9999` gap (channels 1–2, `tb` column) cannot affect this 2009–2015 product (SAMPLES §3). Negative values occur only in single channels below their sensitivity; channels are not displayed.
- **Viewing geometry:** nadir observations only (`gcpds.cat`). Footprint and smoothing as described in the SIS; no footprint is drawn.
- **Local time:** hours past local midnight at the observed point, 0–24 over one lunar day, so one hour is 15° of the Sun's hour angle. The GCP's local-time bins are centred at 0.125 + 0.25k h (checked).

## 4. Proposed display (Moon tab only)

**Switch and modes.** A third button group beside "Show height (LOLA)": **"Show temperature (Diviner)"** with a choice **"around local noon" / "around local midnight"** (default noon). Height and temperature are **mutually exclusive**: switching one on turns the other off. While temperature is shown, the globe is **evenly lit** and "Lit as now" is off, as for height, with the previous lighting state restored afterwards. The map must not appear to respond to the current sunlight. The terminator is never drawn over it, and the noon/midnight choice is never tied to the day/night control.

**Draft wording** (for review; plain words, all four facts on screen):

- Legend title: **"What LRO measured: brightness temperature around local noon"** (or "… local midnight"), badge "Measured".
- Legend line: "Diviner bolometric brightness temperature, in kelvin. Average of observations from July 2009 to April 2015 taken within an hour of each place's own local noon (11:30–12:30). This is not today's temperature, and the Moon is shown evenly lit."
- Explainer (one line under the buttons): "Brightness temperature is the temperature a perfect emitter would need to give off the heat Diviner measured. Where rock and soil, or sun and shade, share one cell, it is not the temperature of any single surface. Noon and midnight here are each place's own local time, not the Sun's position now."
- Readout: "391 K (118 °C) around local noon · average of 3 quarter-hour bins, spread 2 K · 0.5° cell centred 0.25°N, 0.25°E."
- Readout, empty: "No Diviner observation in this window for this cell (0.25°N, 0.25°E)." No number, no colour.
- Readout, withheld: "Not shown beyond 70° latitude for noon (80° for midnight): near the poles the Sun stays low and local time means little, so a one-hour window mixes very different temperatures."
- Polar areas get a flat neutral fill and a key entry "withheld", like the height layer's cap.

**Colour.** One fixed sequential scale per mode, frozen at build time from the derived grid's 1st and 99th percentiles and recorded (sample-based guide: noon about 250–400 K, midnight about 60–130 K). Values outside the scale are clamped in colour but read out exactly. There is no hazard or "hot/cold zone" styling. The legend shows the scale with numbers in K.

**Keyboard and narrow screens:** as the height layer (focusable buttons, a "Read temperature at centre" button, aria-live readout), plus the mode choice as a two-option radio group. Keyboard access to the withheld cap is not claimed, as for height.

## 5. Derivation and files (proposed, not built)

- **Input:** the 18 GCP band files, whole, each checked against the archive's MD5 list (SAMPLES §6.4) and its size (156,211,313 B).
- **Per cell (259,200 cells, 0.5°):** for each window W ∈ {noon: bins 46–49; midnight: bins 94, 95, 0, 1}, keep the `tbol` values > −9998. Then:
  - mean = unweighted mean (in float64), stored in **0.1 K steps** (uint16; 0 = no value). The rounding is disclosed as rounding, not accuracy.
  - n = number of bins (0–4).
  - spread = max − min, in whole K, capped at 254 (uint8; 255 = not applicable).
- **Withheld:** noon poleward of 70°, midnight poleward of 80°. Stored as a separate code (uint16 1), so "withheld" and "no observation" stay distinguishable.
- **Longitude:** the GCP's −179.75…+179.75 is converted to the page's convention once, in the builder, with a fixed test at 0°, ±180° and the seam. GHRM, LOLA and the GDR use 0–360, starting at 0°E; the GHRM cross-check (§7) tests this.
- **Files** (new): `assets/moon/diviner/gcp-tbol-nm-R1.bin.gz` (one little-endian file: header, then noon mean, midnight mean, counts packed two per byte, two spread planes; 1,814,400 B raw) and `assets/moon/diviner/SOURCE.json` (product IDs, DOIs, file MD5s, the derivation rule, the colour scales, the withheld latitudes, the build script's hash). The colour texture is drawn in the page from the grid with nearest-cell colours. There is no PNG; that is a decision point (D5).
- **Builder:** `phase1/moonsci/build_diviner.mjs` (in-pane reduction, the same code run by Node on the samples), with `--check` against a Python reference (`phase1/moonsci/diviner_ref.py`) on the eight sample patches. Both must agree cell for cell.

## 6. Acquisition route

PDS Geosciences can only be reached from the **browser pane** (both shells get a 403 from the proxy). No hub or collector change is proposed (standing rule).

| Route | What moves | Estimate (from measured sample rates) | Verifiable against the archive | Notes |
|---|---|---|---|---|
| **A. Stream each whole band file in the pane, reduce in the page** (recommended) | 2,811,803,634 B; only the derived ~1.8 MB raw leaves the pane | **16–37 min** at the measured 1.25–2.93 MB/s, sequentially, plus any stalls (one >45 s stall was seen) | **Yes**: MD5 per file against the archive list, plus size | Any window can be derived afterwards without refetching; one file in memory at a time (156 MB) |
| B. Multi-range for the two windows only | per window 117,158,400 B payload + about 37 MB multipart overhead (143 B × 259,200 parts) | 18 min per window at the GCP-measured 80 parts in 0.33 s; 58–128 min per window at the GHRM-measured 128 parts in 1.7–3.8 s | No (no checksum for parts) | More than 128 parts per request untested; about 3,240 requests per window |

**Proposed first build step (stop point):** fetch **one** whole band file (00N–10N, 156 MB) in the pane, time it, check its MD5, and run the reduction on it. Then compare its two near-side and far-side patches cell for cell with the reference run on the committed-hash samples. Only then fetch the other 17. If file 1's MD5 fails, or the time is far outside the estimate, stop and report to Chad.

## 7. Verification planned for the build

1. Build `--check`: the in-page reducer and the Python reference agree on all sampled cells (8 patches, 1,600 cells × 2 windows), including counts, spreads, empty and withheld cells.
2. Archive integrity: 18 MD5s and sizes match.
3. **Registration:** (a) GHRM midnight cross-check at about 20 sites spread across longitude and ±60° latitude, fetched by capped multi-range (≤ 128 ranges each, about 84 KB per site), with the agreement statistic recorded (the 4-cell sample gave 0.20–0.50 K); (b) seam test at 0°/360° and ±180°; (c) north–south and east–west mirror tests (correlation against GHRM drops when flipped).
4. Page tests (a new `moon-diviner-ui` suite with breaks, as `moon-height-ui`): switch on/off, mode switch, mutual exclusion with height, lighting state saved and restored, readout at named cells (one with 1 bin, one with 4, empty, withheld at each boundary, seam), no 0 K anywhere, no fetch until switched on, failure paths (404, bad hash, truncated gzip) leave the globe usable and say so, keyboard path, 360 px layout.
5. All existing Moon, Tides, Sky, Animals and desktop-overflow suites stay green; the served manifest is refreshed for the release.
6. Not verified (carried): a real phone, Safari, a screen reader, a hardware renderer, energy or CPU. Draw counts are reported as counts only.

## 8. Costs: measured on samples, kept apart from estimates

**Measured (26 Nov, in the browser pane on Chad's connection; single runs, not page-load figures):**

| Item | Value |
|---|---|
| Contiguous fetch, 2,073,600–2,169,600 B | 708–1,702 ms (8 fetches), i.e. 1.25–2.93 MB/s |
| Multi-range, 128 × 512 B (GHRM) | 1,723–3,790 ms; body 83,888 B for 65,536 B payload |
| Multi-range, 80 × 452 B (GCP) | 329 ms; body 46,128 B for 36,160 B payload |
| Multipart overhead | about 143 B per part |
| One request for two 2.17 MB ranges | did not finish within 45 s (time unknown; bytes later verified) |
| One cycle map at 4 ppd, gzip −9 | 394,752 B (day) / 656,026 B (night); 0.1 K uint16 343,035 / 524,377 B |
| Sample transfer to the workspace | 15.0 MB raw as 2,933,891 B gzip in 6 pieces, plus 1,142,941 B in 3 pieces; all hashes matched |

**Estimated (not measured):**

| Item | Estimate | Basis |
|---|---|---|
| Route A acquisition | 16–37 min, 2.81 GB | measured rate range; stalls not included |
| Route B acquisition | 18–128 min per window, about 154 MB per window | measured per-request times |
| Page file | **0.7–1.1 MB gzip** (1,814,400 B raw) | full maps compress less than the sparse cycle maps (0.17–0.32 of raw measured); assumed 0.40–0.60 |
| Page decode | under 50 ms | the height grid's 1.78 MB decoded in 20 ms (SAMPLES §5) |
| Drawing | one texture swap while on, like height; no polar-cap draw unless D3 asks for one | to be measured as draw counts in the build |

## 9. Records (at release only)

REGISTER entry "LRO Diviner — Global Cumulative Product (tbol)", `sources.html#moontemp`, `assets/moon/diviner/SOURCE.json`. Each record carries the citation (Paige, Sullivan, Williams 2022, bundle DOI 10.17189/wj0s-w188; Williams et al. 2017, Icarus 283, 300–325, with the label's DOI typo noted), the product version, the compilation period, the derivation rule, the rounding, the withheld latitudes, and "PDS data are in the public domain" (PDS FAQ, SAMPLES §5).

**Review cadence (dated snapshot rule):** the product has not changed since 2017. Proposed: a check of the bundle's release notes and the GCP directory **every six months** and whenever a Diviner derived release is announced, with the last-checked date in REGISTER. Earlier versions are kept, and any change is reviewed before replacing the pinned file.

## 10. Not proposed now (revisit conditions)

- **Single mapping-cycle maps** (Level 3 TBOL + LTIM). Sparse, with local time differing across the map. Revisit if Chad wants a dated example of what one month of passes looks like, shown with its gaps and local times. The data are small (2 MB per map) and the route is easy.
- **GHRM high-resolution midnight** (128 ppd, 2009–2022). Revisit after the first release if Chad wants detail at midnight. That would mean a 3.3 GB stream reduced in the pane (estimated 19–44 min) and a choice between `m` and slope-adjusted `sam`. Powell et al. 2023 would need reading first.
- **Polar temperatures** (PCP, 80–90°). Revisit as its own question with polar stereographic handling. It is the right product for the caps.
- **RDR dated interval for 10–11 June 2026** (pairing with the LRO example). Not a published `tbol` product, and it needs a verified bolometric computation of our own. Revisit only if Chad asks for pairing, under checklist item 9's conditions (verified time, frame and pointing).
- **Dawn and dusk maps.** The samples show a 30–85 K spread inside one hour: not meaningful as a map.

## 11. Pages

- **Moon tab:** the layer above.
- **Tides:** unchanged (closed decision).
- **Sky zoom-out:** unchanged here; checklist item 10a is separate.
- **Sources:** a new section at release.

## 12. Decisions for Chad (after GPT's review)

- **D1 Product:** GCP noon and midnight (recommended), or the GHRM midnight only, or both (GCP first, GHRM midnight later).
- **D2 Window:** one hour (recommended) or two hours (fills a few more cells and doubles the noon spread).
- **D3 Latitude limits:** noon 70°, midnight 80° (recommended), or one limit for both.
- **D4 Acquisition:** route A with the one-file stop point (recommended), or route B.
- **D5 Texture:** drawn in the page from the grid (recommended; no extra download), or a built PNG as for height.
- **D6 Readout units:** K with °C in brackets (recommended), or K only.
- **D7 Spread in the readout:** shown (recommended) or left out (saves about 0.5 MB raw before compression).

## 13. For GPT

Please review this proposal (rev 1) and the evidence: SAMPLES §6, `assess_diviner.py`, `assess_diviner_output-2026-11-26.txt`, and checklist §3 as updated. Points where a check would help most: the `tbol` wording and the secondary-source label (§3); the unweighted bin mean as the second averaging step; the latitude limits; route A against route B; and whether a four-cell GHRM agreement is enough to carry the registration into the build (§7 item 3 proposes about 20 sites).
