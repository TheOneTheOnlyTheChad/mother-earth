# Organic-soil emissions: fixture preview `soil-preview-rc` and T1 tables findings, for review (25 Nov 2026)

**Chad's go (his own words, 25 Nov):** "S1 revised yes—panel row plus optional globe layer. S2 P1 yes. S3 yes. T1 yes—download and check only the small tables zip. S4 yes—build the fixture preview on a branch, incorporating GPT's remaining implementation details. Bring back the preview and tables findings for review; no deployment yet."

**Nothing merged or deployed. No hub change.**
- **Branch:** `soil-preview-rc` at `0ee73283004f7aec774d647a1e618ff271f05586`, two commits on main `17af6be`.
- **Review copy:** Mac `_review/soil-preview-rc/`. Every tracked file is hash-checked against that commit, with 0 mismatches. Serve it with `python3 -m http.server 8899 --bind 127.0.0.1` from inside the folder (`00-READ-ME-FIRST.txt`).
- **Screenshots:** Mac `_review/soil-preview-rc-shots/` (6 PNG). They come from headless Chromium with a plain blue backdrop in place of the imagery, so they show the cells, not the Earth picture.

## 1. T1 tables check

Full record: `docs/research/soil-c1/SOIL-C1-TABLES-CHECK-2026-11-25.md`.

- **The file:** only `tabular_data_v1_0_1.zip` was fetched. Its 842,116 B match Zenodo's MD5 and the manifest's SHA-256.
  - Two identical copies landed, because the first click appeared to do nothing and I clicked again.
  - The licence file had also reached Downloads earlier, at 07:52 UTC, from an attempt that reported "failed". Its hash matches the manifest.
- **The 2011–15 "discrepancy" is a raster/table product difference, not an anomaly.**
  - The publishers' global table gives **2.6945** Gt for 2011–15, which matches the paper's 2.69.
  - The 1 km rasters are higher in **every** period: drainage by +0.064% to +0.078% (1.3–1.7 Mt/yr), fire by +0.003% to +0.005%, and area by about +0.1%.
- **The publishers' own guide gives the general reason:** the tables "use administrative boundaries and source pixel area weights", so "table totals and raster sums may differ".
  - This check does not attribute the 0.07% to a particular cause.
  - Country and detailed rows sum to the global rows to within 1.2×10⁻¹⁵.
- **Recommendation:** close T1 for release as a documented product difference. Sources now states it ("about 0.07% higher for drainage than the publishers' country and global tables").

## 2. What the preview is

| File | Change | SHA-256 |
|---|---|---|
| `soil.js` (new page file) | the layer, row, inspector rows, table check and validation; reproduces `soil_reference.py` | `a069117cc657c52ec3b19043ecf7270402335a71ed120df2abb8f8fecf1c72c8` |
| `assets/soil/g4-soil-fixture-v1.0.1.json` (new) | fixture: 65 real records unchanged, out of an 82-cell subset (South-East Asia 20–24 × 68–76, Scandinavia 37–39 × 44–52, and the named cells); meta lists the subset | `a789a6b88f21ebb5606c919a13d99c2fb22ce4c14e5b72ed5ec34ca4ece736da` |
| `index.html` | card under Optional layers; legend line; Key definition; script tag; `render()` asks `ME.soil.polys`; polygon altitude per polygon (default unchanged at .006); soil inspector; place-panel row after Forest; `ME.redraw`; `?v=` bumps | `8861e4e937e406db3069bf0cc2a7c95d540590e722774992c7fe1a03d142d1f1` |
| `sources.html` | `#soil` section and one shortcut, placed before Animals | `21eba50e678b5b7e00cdcf3a047e041b0657a064083d5b70cf898577952655a3` |
| `layers.js` | one row, "Organic-soil emissions (modelled)", under Analysed and modelled | `3f67670962285f67f096a147b6ae92f4e739c14fea06bdf3b416c1849ef3afc0` |
| `style.css` | 7 lines for the key and the period list | `21c631fdb21dff9f2dfca824754c38f275b892bd6393c4ed043b5fda373988cd` |
| `phase1/soil-ui.test.cjs` (new) | 37 checks | `af666b0788af047e21743db463660c2d07e94edf86e315183d7273e0884d7249` |
| `phase1/bare-earth-ui.test.cjs` | counts 17 switches instead of 16 (the new Layers row) | `bb2faa63695c50d4ef45d2d3de028365ecae33759f789b5d5007e2296eae0205` |
| `docs/research/soil-c1/soil_fixture.py` | cuts the fixture from the full table | — |

`app.js` is **unchanged** (`a4876906…`, the released bytes).

**GPT's implementation details, as built:**
- **Validation before the sparse rule:** the pinned SHA-256 (WebCrypto), then the whole-table check, before any record is used or any absence is read.
- **Fixture cells:** a cell outside the fixture's subset is "unknown — this cell is not in the preview's fixture …; not 'no organic soil'".
- **Layer:** off by default and listed under "Analysed and modelled". It is labelled **Modelled**, fixed to 2021–24, with a drained/burned radio and no combined score.
- **Colours:** fixed decade bins on one muted ochre (alpha .16/.26/.38/.50/.64/.80).
- **Cell states:**
  - **Model zero:** a hollow ochre outline.
  - **Incomplete coverage:** the bin fill with a light outline.
  - **Unknown coverage:** the site's red unknown outline.
  - **No organic soil, or outside the fixture:** not drawn, and the key says so.
- **Key text:** "t CO₂e per year per whole 4° cell"; the scope note explains that cells shrink toward the poles.
- **Row:** whole-cell wording, the uncertainty sentence, neutral zeros, the incomplete-footprint wording, and the periods behind a closed "Show all reporting periods" with GPT's period warning.
- **Sources:**
  - **Citation and terms:** the citation, DOIs, and CC BY 4.0, read in full.
  - **Method:** modelled, not measured; our aggregation, and that the 4° totals are ours, not the publishers'.
  - **Comparison:** the table difference (T1).
  - **Caveats:** what zero and missing mean, the §4.5 limits and the §3.8–3.9 scenario bounds (read directly in full text today: 1.50–3.97 Gt for emission factors alone; about 0.7–4.5 Gt for the combined scenario envelope, which the authors call not probabilistic).
  - **Upkeep:** the version check and the preview note.

## 3. Departures from proposal rev 3 (for review)

1. **Selected-cell outline, deliberately narrowed.**
   - The proposal outlined the cell whenever the place panel was open. That broke an existing guarantee: the place view never changes globe data (`index.html`; nature-context-ui B5 failed).
   - So the outline now belongs to the soil layer: it is drawn only while the layer is on, for both the inspector and the place panel.
   - With the layer off, the place panel still names the cell and its bounds in its "Selected" row, and the globe is untouched.
   - If you would rather have the outline with the layer off, that is a change to the place-view rule, and it needs its own decision.
2. **The incomplete-coverage outline is solid, not dashed.** globe.gl polygon strokes cannot be dashed, so it is a light outline in place of the ochre one. There are no incomplete cells in 2021–24 in v1.0.1, so on the globe the style is only exercised by the controls.
3. **Alphas raised from .10/.18/… to .16/.26/…** after the first look: the two lowest bins were hard to tell from the sea.
   - **Open:** in the screenshots the top three bins are still hard to tell apart. Please judge it on the served copy against the real imagery.
4. **`layers.js` gained a row.** The Bare Earth suite's switch count moves from 16 to 17 (included).
5. **Card state "unknown":** a table that fails its fingerprint or validation shows "unknown" with the reason, and draws nothing.

## 4. Test results (workspace; Chromium + SwiftShader)

- **`soil-ui`:** 37 passed, 0 failed.
  - **Part A (no browser):** the JS reproduces `soil_reference.py` for every stored number (fmt), every fixture cell and period (text), and every class.
  - **Also in Part A:** GPT's three R2-1 reproductions plus 18 mutations are refused; a one-space change to the table is refused.
  - **Controls:** OLD=1 (main's files) fails, and each of the 9 breaks fails at its own checks: `no-hash`, `sparse-first`, `zero-positive`, `combined`, `no-outline`, `subset-nosoil`, `load-at-start`, `no-incomplete`, `bins-shifted`.
- **All 51 `phase1/*.test.cjs` suites were run on the branch.** Every suite that failed was then rerun on main `17af6be`, and the FAIL lines were compared.

| Result | Suites |
|---|---|
| Pass on the branch | aircraft-dots-page, animals-census-ui, animals-context-ui, animals-corridor-ui, arts-ui, backdrop-layer, bare-earth-ui (190), buoy-temp-ui, cell-perf-ui, desktop-overflow, dustrgb-ui, fire-status-ui, fires-wording-ui, freshness-wording-ui, layer-switches-ui, legend-active-ui (548), moon-globe, moon-lit, moon-lro-path, nature-context-ui (78), night-lights-ui, optional-layers-status-ui, plastic-ui, quakes-ships-status-ui, ships-retain-ui, sky-ui, sky-zoom-ui, skycraft-ui, soil-ui, sun-globe, terminator-behaviour, timeline-axis, timeline-changes-ui, timeline-travel-ui, timeline-ui, wind-ui |
| Fail identically on main (same FAIL lines) | drifters-ui (1), kept-ui (3), osmc-reliability-ui (1), place-ui (crash at its first inspector click), search-ui (4), smoke-fixes, terminator-ui (1), timeline-mixed-assets, ux-round1 (1) |
| **Not run here: missing fixture** (`/home/claude/fixtures/orbital.csv`, `OH_SNAPSHOT_DIR`) | key-drawn-ui, mobile-pass, orbital-browser, status-notes-ui, oceanheat-ui. **These are unverified**, including the Key count and the phone pass. soil-ui covers the Key, the legend and 360 px for the soil card only. |
| **Expected Animals pins** | animals-tab-ui: 278 passed, 4 failed. **13b** (`index.html` ≠ NC_MAIN), **13c** (`layers.js` and the Bare Earth suite ≠ main), **13e** (`sources.html` ≠ NC_MAIN plus the zebra block), **13f** (Earth now has 17 Layers rows, not 16). All four are byte or count pins on files this feature changes. Nothing else in the Animals suite changed. |

- **Hub suites:** not run. No hub file changed, and `hub-alignment` compares main with the deployed hub.

## 5. Release preparation (not started; for later)

1. **Animals suite maintenance**, reviewed against the actual integrated tree, not a blind bump:
   - move `NC_MAIN` (and `NC_PARENT`) to the soil release's page commit;
   - 13e then becomes byte-identical to NC_MAIN, because the zebra block is already inside it;
   - 13c gains `layers.js` and the Bare Earth suite under the same commit;
   - 13f's row count becomes 17;
   - `BASE_MAIN` and `TL_MAIN` do not move.
2. **The full table:** the fixture is replaced by the full 790-record table under P1. It is 684 KB as stored, or 43 KB gzipped (GitHub Pages serves it compressed). Its pinned SHA-256 goes in `soil.js`, the fixture wording comes off the card and Sources, and `meta.fixture` goes.
3. **Release checks:** add `soil.js` and the table to the served-hash checks; a REGISTER entry; refresh the fresh-main reconciliation; rerun the affected suites; and get Chad's Approve line.

## 6. Questions for GPT

- **P1:** is the layer-owned outline (§3.1) acceptable, or should the place-view rule change?
- **P2:** colour and bins on the served copy with real imagery. Are the upper three bins distinguishable enough, and is the zero outline clear?
- **P3:** the fixture's out-of-subset wording, and the incomplete style as a light solid outline.
- **P4:** T1: close as a documented product difference?
- **P5:** the release maintenance plan for the Animals suite (§5.1).
