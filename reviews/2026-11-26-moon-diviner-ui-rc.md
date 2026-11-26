# moon-diviner-ui — Moon temperature layer, branch preview for GPT's review

26 Nov 2026 · Claude · branch `moon-diviner-ui` · **preview only: not merged, nothing deployed, no hub, R2, D1 or collector change**

- **Go:** Chad's own lines (26 Nov, in the thread):
  - "I accept the disclosed checkpoint-timing deviation for this acquisition; future runs must write a durable checkpoint per band before proceeding."
  - "Freeze the noon/midnight masks at 70°/80° and scales at 281–395 K / 70–105 K, with GPT's wording and safeguards."
  - "Read Powell 2023 §2.4–2.5 first, then go for the page-only `moon-diviner-ui` branch preview under proposal rev 2 and GPT's review notes. Return the preview and evidence for GPT review. No merge or deployment."
- **Proposal:** `docs/concepts/MOON-DIVINER-PROPOSAL.md` rev 2 (passed by GPT's recheck, `reviews/2026-11-26-moon-diviner-proposal-rev2-gpt-recheck.md`, with five implementation notes).
- **Data:** the 18 retained GCP extractions (D4a + D4b; `reviews/2026-11-26-moon-diviner-global-report.md`).
- **Commits** (parent: fresh main `f63b4fe`):
  - `c3bc497`: Powell read (SAMPLES §6.8)
  - `47dc4f1`: page file, builder, GHRM comparison, acquisition evidence carried from `moon-diviner-trial`
  - `947dd14`: page payload (`DV_MAIN`)
  - `29bb0ee`: the Animals-suite pin maintenance
  - then this packet (see the message for the exact final commit)

## 0. Bottom line

- **Built and passing.**
  - `moon.html` gets **"Show temperature (Diviner)"** with **around local noon / around local midnight**, drawn in the page from one checked file (720,037 B gzip).
  - Height and temperature share one coordinator (proposal §5).
  - **`moon-diviner-ui`: 157 passed, 0 failed**, and 17 of 17 deliberate breaks each fail.
  - **`moon-height-ui`: 110 passed** on the refactored code, and 12 of 12 breaks fail.
  - The other suites are listed in §7.
- **One finding for GPT, before anything else (§4):** at the 10 high-contrast sites, our midnight value is warmer than GHRM by a median of 8.75 K (up to 16.7 K). At the 10 background sites the two agree within 0.05–0.82 K. Registration passes: the true alignment beats every shifted and flipped control. The difference is partly explained and partly only plausibly explained (§4). I did not treat it as blocking the **preview**; it needs GPT's judgement before any release.
- **One fix to an earlier record (§6):** two of the released height suite's deliberate breaks (`late`, `nocache`) matched no code, so they never broke anything. That suite's "12 breaks each fail" claim at the height release was therefore wrong for those two. Both now target real code and are caught, and a break that matches nothing now stops the suite.

## 1. What the candidate does

**Off by default.** Nothing is fetched until "Show temperature (Diviner)" is pressed.

**On:** the Moon picture is replaced by a map of the GCP `tbol` window statistic, one colour per 0.5° cell:
- **Map:** one fixed sequential ramp (viridis stops, dark purple → yellow); one fixed scale per mode, **noon 281–395 K, midnight 70–105 K** (frozen).
- **No valid data in this window:** a dark neutral hatch.
- **Withheld by our display policy** (noon poleward of 70°, midnight poleward of 80°): flat light neutral.
- **Legend:**
  - title "What LRO measured: brightness temperature around local noon" (or midnight), with the "Measured" tag
  - the scale line, always visible and repeated on each mode change: "Colour scale: noon 281–395 K. The midnight map uses 70–105 K. The same colour does not mean the same temperature on the two maps."
  - ticks with "≤ 281 K" / "≥ 395 K" at the ends
  - keys for the two neutrals
  - the statistic sentence (proposal §4, unchanged)
  - the explainer, now from Claude's own read of Powell 2023 §2.5 (SAMPLES §6.8)
  - the clipped shares (noon 0.93% / 0.43%, midnight 0.85% / 0.75%), and that clipped cells keep their exact value in the readout
  - "Values are rounded to 0.1 K; the rounding is not the accuracy"
- **Readout** (click, or "Read temperature at centre"; polite live region):
  - n ≥ 2: "391.3 K (118.2 °C) around local noon · mean of 3 quarter-hour bins · range between bins 2 K · 0.5° cell centred 9.75°N, 30.25°E."
  - n = 1: "… · one bin; range unavailable · …"
  - **range code 254: "range between bins at least 253.5 K (display capped)"** (GPT note 1; no such cell exists in the data, so this is tested on a crafted file)
  - n = 0: "no valid data in this window for this cell (centred …)", with no number
  - withheld: the policy sentence ("This is our choice, not the edge of Diviner's coverage"), with no number
  - °C = K − 273.15. It always ends in 5 hundredths, so it is rounded half away from zero.
- **Sources:** the page's own Sources list gains a "Temperature (optional)" line (product, DOI, period, our statistic, the masks, the scales, Powell §2.5). `sources.html` and `REGISTER.md` are **not** changed; per proposal §10 they come with the release candidate.

## 2. Files (`f63b4fe..947dd14`)

| File | Change |
|---|---|
| `assets/moon/diviner/gcp-tbol-nm-R1.bin.gz` | new · 720,037 B gzip, sha256 `1d81cb86…11d0` · raw 2,073,664 B, sha256 `cfaaabd8…ff92` · MEDIVNR1, schema 1, exactly as proposal §6.2 |
| `assets/moon/diviner/SOURCE.json` | new · product, bundle DOI, 18 archive MD5s, checkpoint file hash, statistic, coding, masks, frozen scales with percentiles and clipped shares, build, files |
| `phase1/moonsci/build_diviner.py` | new · re-hashes all 18 retained extractions against their checkpoints; recomputes the codes; with `--planes`, each band's rows must equal the pane's band planes byte for byte; the assembled grid must equal the global report's digest `1cd629dd…`; it stops if the frozen scale ends no longer follow from the percentiles; `--check` rebuilds both files: **byte-identical** |
| `moonsci.js` | rewritten · `MoonScience` coordinator; height layer moved onto it (its loaders unchanged); temperature layer: fetch, two pins, header, payload hash, per-cell consistency (§6.3), explicit little-endian reads, drawn texture, readouts, legend |
| `moon.html` | edit · temperature button, centre button, two-option group, legend and readout, one scale line, one Sources line, new `moonsci.css` / `moonsci.js` version keys |
| `moonsci.css` | edit · ramp bar, neutral keys, radio group |
| `phase1/moon-diviner-ui.test.cjs` | new suite |
| `phase1/moon-height-ui.test.cjs` | break patterns updated to the refactored code; missing pattern = error |
| `phase1/moonsci/diviner/ghrm_compare.py`, `docs/research/moon-lro-science/diviner-ghrm/` | new · §8 item 3c comparison and registration controls, sites, output |
| `docs/research/moon-lro-science/SAMPLES.md` | §6.8, Claude's Powell read |
| `phase1/moonsci/diviner/*`, `docs/research/moon-lro-science/diviner-acq/*`, the two Diviner trial and global reports | carried unchanged from `moon-diviner-trial` (tooling and evidence for the build chain) |

**Not touched:** `moonglobe.js` (its height hook was enough: texture, lock, restore, clicks, cap), `lroc_color_2k.jpg`, `craft.js`, `moonlight.js`, `sunglobe.js`, `skyscene.js`, `tides.*`, `index.html`, `sources.html`, `style.css`, `REGISTER.md`, the hub.

## 3. GPT's notes and the proposal's safeguards, and where they are

| Requirement | In the candidate |
|---|---|
| **GPT note 1:** range cap wording | code 254 reads "at least 253.5 K (display capped)"; crafted-file test; BREAK `cap` caught |
| **GPT note 2:** leaving cancels a pending request | `leave()` calls `cancel()` first. Tested: height shown, temperature requested, height pressed off while temperature is pending → science mode does not reopen. BREAK `noleavecancel` caught |
| **GPT note 2:** a failed noon/midnight change restores the radio | `syncRadio()` after every failure and cancel; tested with a forced draw failure (radio back on noon, noon still shown, nothing kept). BREAK `radio` caught |
| §5 rule 1: saved once, on entry | `MS.saved = h.lit()` only when `active` was none; tested across height → noon → midnight → height, with lit on and off. BREAK `nosave` caught |
| §5 rule 2: the shown map stays while the replacement loads and is checked; swap in one call | `request()` commits only after `prepare()` resolves; every failure in each direction (temperature over height, height over temperature, midnight over noon) keeps the shown map usable |
| §5 rule 3: restore for the current minute on leave; Earth view not reopened | tested both orders (height first, temperature first); the line names the map shown at entry. BREAK `norestore` caught |
| §5 rule 4: latest token only; late answers released | rapid clicks across all four modes, with the abort working and with it disabled; one commit; the live object URLs at the end are exactly the cached ones. BREAKs `late` and `leak` caught |
| §5 rule 5: cancel during entry | saved stays null, the view is unchanged, nothing is kept (no grid, no URL) |
| §5 rule 6: resources | one decoded grid; one texture per mode, made on first use; failed and cancelled attempts keep nothing (object-URL accounting in the suite) |
| §6.3: whole-file validation before anything is shown | gzip pin, raw pin, length, magic and every header field, the header's payload SHA-256, and per cell and mode: withheld ⇔ beyond the mask, no data ⇔ n = 0 inside, value ⇔ 1 ≤ n ≤ 4, range 255 ⇔ n ≤ 1, value ≤ 450 K. Fifteen crafted-file rejections, each with **valid pins injected**, so the page's own checks are what reject them; the previous map is kept each time. BREAKs `nopin`, `nocell`, `nomask` caught |
| §8 item 3a/3b: registration | index anchors (first source record → row 179, column 360; 0.25°E → column 0; +179.75 → column 359; the poles), texture columns (column 0 → x 1440, column 360 → x 0), lookups either side of 0/360 and 180. **Real clicks on a crafted file with seven marked cells** (including both sides of 0/360 and 180) read back each marked cell, and the screen colour there is the top of the ramp. Real clicks on the real map at 14 points read the build value, and the screen colour matches the ramp computed in the suite from the frozen scales. BREAKs `row`, `col`, `flip`, `shift` (one cell east) and `tex180` caught |
| §8 item 3c: GHRM comparison | §4 |
| Nothing fetched until switched on; one request for both modes | network counts in the suite |
| Keyboard, 360 px | Enter on the button, arrow keys in the radio group, "Read temperature at centre"; no overflow at 360, 390, 721 px; the scale tick labels are at least 4 px apart in both modes at each width (the minor ticks give way below 520 px, found from the 360 px screenshot) |

## 4. GHRM comparison (§8 item 3c): a location-dependent difference, for GPT

`phase1/moonsci/diviner/ghrm_compare.py`; output `docs/research/moon-lro-science/diviner-ghrm/ghrm_compare_output-2026-11-26.txt`.

**What was fetched:** 20 sites, each a 3 × 3 block of 0.5° cells from GHRM `dghrm_tbol_m_70s70n_img.img`:
- 192 rows × 768 B per site, 40 multi-range requests of 96 ranges in the browser pane, 3,497,088 B of response
- every part's range checked against the request
- the file reported as 3,303,014,400 B, Last-Modified 6 Oct 2023
- 2,949,120 B kept on the Mac in `_source-data/moon-lro-science-2026-11-26/diviner/ghrm-sites-20-R1.f32` (sha256 `94cba44b…45e5`)

**How the sites were chosen:**
- **10 high-contrast sites:** the strongest midnight local maxima in our own grid, at least 5° apart. This is a deviation from "craters from a gazetteer": a sharp peak is where a registration error shows most. The first one picked is 35.75°N 102.75°E, the young crater Giordano Bruno.
- **10 background sites:** a fixed spread of latitudes and longitudes.

**Results (ours − GHRM 0.5° block mean, centre cell):**

| | Median | Range |
|---|---|---|
| background | +0.35 K | +0.05 … +0.82 K |
| high-contrast | **+8.75 K** | −1.91 … **+16.71 K** |
| high-contrast, against GHRM's radiance-equivalent (mean T⁴)^¼ | +4.85 K | −4.31 … +12.24 K |

**Registration controls** (mean |difference| over the 3 × 3 blocks, averaged over sites):

| | true | N | S | E | W | 180° | mirror E–W | mirror N–S |
|---|---|---|---|---|---|---|---|---|
| high-contrast | **2.26** | 6.31 | 6.01 | 6.54 | 5.45 | 5.62 | 4.01 | 3.33 |
| background | **0.60** | 1.31 | 1.55 | 1.01 | 1.04 | 1.99 | 1.01 | 1.53 |

The true alignment is best on average at both kinds of site; individually, it is best at 5 of the 10 high-contrast sites. Registration is supported. The offset at hot spots is **not** a registration error: it appears on the centre cell, while the 3 × 3 surroundings agree.

**Causes. What is shown, and what is only plausible:**
1. **Order of averaging (shown, partly).** A GCP bin converts the *mean radiance* to a temperature (SIS §8.1); a GHRM block mean averages *temperatures*. Where a small hot spot sits in a cold cell, the radiance route reads warmer. Using GHRM's (mean T⁴)^¼ as a radiance-equivalent cuts the high-contrast median from +8.75 to +4.85 K (site 5: 107.0 → 112.6 K against our 112.2 K).
2. **Channel set (plausible, not quantified here).** The GCP uses channels 3–9; GHRM's night bolometric uses 6–9 (Powell §2.5). Powell says mixed (anisothermal) cells read warmer at shorter wavelengths, so including channels 3–5 should raise rocky cells most.
3. **Method and period (plausible).** GHRM is an empirical cooling-curve fit at exactly 00:00 over 2009–2022, with sunrise and sunset excluded (Powell §2.4). Ours is a mean of up to four quarter-hour bins from 23:30 to 00:30 over 2009–2015.
4. **Not noise.** At site 0, for example, our three bins read 128.2, 122.4 and 124.0 K; GHRM's block reads 110.2 K (114.9 radiance-equivalent).
5. **Selection** picked our own maxima, which favours cells where ours is high. This does not explain a 10 K gap between consistent bins.

**What the page already says:** a cell is not the temperature of any one surface where rock and soil share it; the value is our mean of the team's bins. **Question for GPT:** is this sufficient for the preview, and what, if anything, must Sources say at release (for example: "At small, rocky, warm-at-night spots this map reads several kelvin warmer than Diviner's high-resolution midnight mosaic, which is made differently")?

## 5. Animals-suite pins (narrow, the Animals owner's pattern)

`phase1/animals-tab-ui.test.cjs` pins `moon.html` byte for byte. The maintenance commit changes only that suite:
- `DV_MAIN` = `947dd14`, `DV_PARENT` = `f63b4fe`, literal `DV_FILES` (the 28 paths of §2)
- **13e moon.html** is held to `DV_MAIN` (each temperature and height addition exactly once). With the temperature additions set aside and the two version keys put back, it is byte-identical to the Moon height baseline `MH_MAIN` (and through it to everything before).
- **13t:** `DV_PARENT..DV_MAIN` changes exactly `DV_FILES`. No `index.html`, `sources.html`, `style.css`, `app.js`, `moonglobe.js`, animals scripts or hub.
- **13u:** the maintenance after `DV_MAIN` changes only this suite.

`MH_MAIN` and every baseline behind it do not move.

## 6. Correction to the height suite (found while moving it onto the coordinator)

In `phase1/moon-height-ui.test.cjs` on main, `BREAK=late` replaced `if (tok !== st.token || !st.on) return;` and `BREAK=nocache` replaced `st.grid || loadGrid`. Neither string exists in main's `moonsci.js`, so those two breaks changed nothing, and that suite would still pass under them. The height release packet's "12 breaks each fail" was therefore true for 10. The behaviour itself was tested: the late-answer tests pass with the abort disabled. What was not proved is that those tests would catch a removed token check or cache.

Now:
- every break goes through a helper that **throws if its pattern is missing**
- `late` removes the coordinator's token check
- `nocache` removes both caches

Both are caught (§7). The same helper is used in `moon-diviner-ui`.

## 7. Tests (26 Nov, headless Chromium 158, SwiftShader, workspace machine)

| Suite | Result | Code |
|---|---|---|
| `moon-diviner-ui` (new) | **157 passed, 0 failed** | final payload `947dd14` |
| `moon-diviner-ui` breaks | **17 of 17 fail**: `row` 13, `col` 32, `flip` 7, `shift` 6, `tex180` 9, `nosave` 7, `norestore` 4, `late` 5, `noleavecancel` 1, `radio` 1, `nopin` 1, `nocell` 9, `nomask` (the real file is rejected at once; the suite stops, exit 2), `cap` 1, `n1` 3, `leak` 2, `celsius` 2 | run on the first payload `66b7a24` (151 checks); the final payload adds only the minor-tick class and one CSS rule, which no break touches |
| `moon-height-ui` | **110 passed, 0 failed** | final |
| `moon-height-ui` breaks | **12 of 12 fail**: `be` 32, `late` 1, `nolock` 2, `norestore` 2, `early` 14, `nocache` 2, `row` 10, `col` 24, `noraw` 3, `nofirst` 2, `norevoke` 4, `nopin` 2 | `66b7a24` (as above) |
| `animals-tab-ui` | **294 passed, 0 failed** (13e moon.html, 13t, 13u included) | final, with maintenance `29bb0ee` |
| `moon-globe` | 67 passed, 0 failed | final |
| `desktop-overflow` | 286 pass, 0 fail | final |
| `mobile-pass` | 131 passed, 0 failed (its orbital fixture rebuilt with the repo's `phase1/orbital-fixture.build.mjs`) | final |
| `moon-lit` | 138 passed, 0 failed | `66b7a24` |
| `moon-lro-path` | 68 passed, 0 failed | `66b7a24` |
| `moon-light` | 27 passed, 0 failed | `66b7a24` |
| `tides-nav` | 2,882 passed, 0 failed | `66b7a24` |
| `tides-ui` | 59 passed, 1 failed: **T1a**, the Tides branch's own scope check (`origin/main...HEAD` may change only its navigation files). It lists this branch's intended changes (`moonsci.css`, `moonsci.js`, `phase1/moon-height-ui.test.cjs`). It cannot pass on another feature branch, and does on main | `66b7a24` |
| `test_mehash` / `test_gcp_stream` / `test_pane_job` (acquisition tooling, carried) | 466 / 165 / 56 passed, 0 failed | final |
| `build_diviner.py --planes … --check` | committed files equal a fresh build | final |
| `ghrm_compare.py` | PASS (registration controls) | final |
| `skycraft-ui` | 77 passed, 0 failed | final |
| `smoke-fixes` | 11 failed, **the same 11 on main** (`f63b4fe`, run side by side on another port): Earth now's fire-cell record checks, which read live hub data. Pre-existing; not from this branch | final |

The suites marked `66b7a24` ran on code that differs from the final only by the minor-tick class line and its CSS rule. Not run: `timeline-ui`, `orbital-*` (they touch no Moon file).

## 8. Measurements (same machine; single runs; SwiftShader is software rendering)

| | Value |
|---|---|
| Page file | 720,037 B gzip (estimate was 0.8–1.2 MB); raw 2,073,664 B |
| Decode and full check in the page | 108–121 ms |
| Draw one mode's texture (2880 × 1440, 4 × 4 pixels a cell, then PNG) | 810 ms in the suite run; 2,864 ms on the first cold run. A hardware browser was not measured |
| Idle draw calls per 5 s | temperature off 301, on 301 (texture swap only; no polygon) |
| First "on" (fetch + check + draw) | about 2.9 s cold in the smoke run, served locally |

**Not verified:**
- a real phone, Safari or a screen reader
- a hardware renderer; energy or CPU
- the GHRM causes of §4 beyond what is measured

The 4 × 4 texture is a display choice: at full zoom the cells look slightly soft at their edges (linear filtering), and the hatch reads as a dark grey from far away.

## 9. Asked of GPT

1. **§4:** is the high-contrast offset sufficiently explained for a preview, and what wording should Sources carry at release?
2. The coordinator and its tests against proposal §5 and your notes 1–2.
3. The §6 correction.
4. The page wording (§1), now with Claude's own Powell read.
5. Anything that must change before a release candidate.

Merging and deploying need Chad's own Approve line naming the commit.
