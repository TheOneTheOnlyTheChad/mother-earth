# Ocean Heat — preview release-candidate packet (`ocean-heat-rc`)

**Approval:** Chad, 10 Nov 2026: "Approve: build ocean-heat-rc on a branch only — Ocean Heat preview per OCEAN-HEAT-PROPOSAL rev 4.2 on the pinned 9 Nov inputs; no merge, R2, hub or page change."
**Candidate:** branch `ocean-heat-rc` @ **`0130e4d`** (code and snapshot). Earlier commits: `3245f73`, `ec08df1`, `a56a5e3`. This packet is committed after it.
**Scope:** the page and a static dated snapshot in the repo. No hub, D1, R2, cron, collector or new upstream request. Main and the public page are untouched.

## 1. What changed

| File | Change | sha256 at `0130e4d` |
|---|---|---|
| `oceanheat.js` (new page file) | The layer: hash-checked fetch, inflate, decode, path choice (P1/P2), painting, overlay meshes, tap rows, on/off | `3ecefc78…72c20` |
| `index.html` | Ocean heat card `#oh-card` (before the Sky group), `#oh-legend`, script tag, inspector wiring (`ohTap`), Key count, footer credit; all `?v=` → `202611271000` | `a09366f1…54366` |
| `sources.html` | `#oceanheat` section: credit, the terms distinction (§9a), methods-article DOI; `?v=` bump | `d589f275…187e7d` |
| `data/ocean-heat/oh-2026-11-09-R1/manifest.json` | Snapshot manifest (4,585 B) | `dcc34674…f5af1b` |
| `…/mask.bin.z` | 2-bit native mask, 7200 × 3600, zlib (137,652 B) | `349fc023…10bb9c` |
| `…/v025.bin.z` | 0.25° value planes (1,081,272 B) | `3e66d63c…be1ae0` |
| `…/v050.bin.z` | 0.5° value planes (323,176 B) | `be418c11…c00c725` |
| `phase1/ocean-heat/build_ocean_heat.py` | Generator with hard stops (§3) | `802cacb7…3c9dd` |
| `phase1/ocean-heat/test_generator.sh` | Generator fault tests | `7d262844…e09e1f` |
| `phase1/ocean-heat/build_fixture.py` | Seam and rejection fixtures | `1c9b875b…71d884e` |
| `phase1/ocean-heat/expected-taps.json` | Exact block sums from NOAA's native files (Mac packet C4d) | `4b1cfd73…77931e` |
| `phase1/oceanheat-ui.test.cjs` | Browser suite (79) | `c40df164…bced0d` |

`app.js`, `style.css`, `arts.js`, `sky.js`, `skyscene.js`, `timeline.html` and `timeline.js` are unchanged (equal to main). **On a merge, the served-hash check grows from nine page files to ten** (`oceanheat.js`), plus the four snapshot files.

## 2. Inputs (pinned, 9 Nov 2026 UTC day)

From the Mac research packet `research/ocean-heat/2026-11-10-claude/` (C2–C5, correction 1). The generator refuses any other bytes.

| NOAA Coral Reef Watch file | Bytes | sha256 (pinned) |
|---|---|---|
| CoralTemp v3.1 SST | 11,418,321 | `57de86e9…` |
| SSTA, `3.1-clim19912020-v1` | 10,399,448 | `7b97760a…` |
| Daily climatology 1991–2020 for the day | 6,349,472 | `1495ac58…` |

The `.md5` sidecars are still unchecked (Chad's line: paste the two `.md5` lines).

## 3. Generator (`build_ocean_heat.py`)

- **Hard stops:** input sha256 values; time coverage; climatology title; the CoralTemp row flip (south-first → north-first), with bitwise grid identity afterwards; mask invariants checked against the literal fill −32768 (land from mask 1, not from the SST fill); pinned counts `mask0 12,833,780 · mask1 8,722,205 · mask2 991,557 · mask4 3,372,458 · ice_with_sst_fill 4,655`; SST − anomaly − normal = 0 exactly, per cell and per block sum.
- **Outputs:** 2-bit mask (0 water, 1 land, 2 no normal, 3 ice); value planes as row-delta, byte-split anomaly, SST, contributor count, land count and an SST-valid plane. Rounding ties away from zero.
- **Tests:** `test_generator.sh` **6/6** on the Mac. Faults `no-flip`, `shift-one`, `land-from-fill`, `wrong-hash` each stop the build; the code break `loose-identity` loosens both identity checks, and the test confirms that `shift-one` is then no longer stopped (so the identity check is what catches it).
- **Determinism:** the snapshot built on the Mac and the copy transferred here (`0f9234d3-oh-snapshot-R1.zip`, sha `64759371…`) are byte-identical.

## 4. Display choices made by measurement (O4)

- **First-enable transfer, P1 (0.25° values + native mask):** manifest 4,585 + mask 137,652 + values 1,081,272 = **1,223,509 B (≤ 1.5 MB)**. P2: 465,413 B.
- **Path rule:** P1 when the renderer's `MAX_TEXTURE_SIZE` ≥ 7200 (native 0.05° texels, 7200 × 3600, paired with 0.25° values); otherwise P2 (0.1° texels, paired with 0.5° values).
- **P1 GPU texture memory:** 7200 × 3600 × 4 B = **103,680,000 B (≈ 98.9 MiB)**, no mipmaps, one texture; a CPU-side canvas of the same size is kept while the layer is on. Both freed on off.

## 5. Tests

- **`node phase1/oceanheat-ui.test.cjs` — 79 passed** (real globe.gl 2.45.0, headless Chromium + SwiftShader, hub routed to fixtures):
  - A — real snapshot, default path: zero requests while off; exactly three on enable; path rule; nearest filtering, no mipmaps; never a pick target; all 12 table taps match the exact sums; edge lookups (±180 → col 0; edges south/east; lat −90 clamped); per-grid columns written out; texels (Cape Peninsula land clear inside a contributing square; Weddell ice = no-data fill); rendered Weddell no-data; real taps through the page's handlers.
  - B — forced P2: Gulf of Maine changes class with the grid (6 → 7); Near normal at 0.5°; Cape Point 0.5° texels `CCCMM / CCCMM / CCCCM / CCCCC / CCCCC`.
  - C — seam fixture on the rendered globe (P1 × 1 tile, P1 × 2 tiles, P2): west strip blue, east strip orange, join pale/orange, sensitive to mirroring and π rotation.
  - D — rejected snapshots: tampered mask bytes, a manifest that is not the pinned one, a wrong data date (pinned), a wrong value grid (pinned, P2). Each: nothing drawn, toggle off, its own reason shown. (A superseded load is covered by the `no-gen` break.)
  - E — phone 390 × 844 (emulated): toggle ≥ 44 px tall, layer ready, key fits, no horizontal scroll.
- **Code breaks** (each must fail the suite), rerun at `0130e4d`: see §7.
- **Regression on the branch, all passing:**

  | Suite | Result |
  |---|---|
  | sky-zoom-ui | 333 |
  | sky-ui | 79 |
  | arts-ui | 90 |
  | orbital-browser | 113 |
  | mobile-pass | 131 |
  | desktop-overflow | 112 |
  | search-ui | 104 |
  | smoke-fixes | 52 |
  | ux-round1 | 34 |
  | buoy-temp-ui | 33 |
  | buoy-temp (unit) | 37 |
  | place-ui | 30 |
  | plastic-ui | 29 |
  | drifters-ui | 25 |
  | kept-ui | 21 |
  | terminator-ui | 19 |

## 6. Live RC (Pages origin, live hub, real backdrop, real GPU)

- **Setup.** Clean tab on `theonetheonlythechad.github.io/mother-earth/` in the browser pane on Chad's Mac. **Browser:** Claude desktop pane, Chrome 152.0.7977.167. **GPU:** ANGLE Metal, Apple M3. **`MAX_TEXTURE_SIZE` 16384.** Viewport 588 × 834 CSS px at DPR 2.
- **19:28:02Z — injection.** The seven page files fetched by commit `0130e4d` from raw.githubusercontent and hash-checked: all seven exact (index `a09366f1`, app `161b53cc`, oceanheat `3ecefc78`; style, arts, sky, skyscene equal to live). Blob-injected.
  - One deviation, needed because main has no `data/ocean-heat/`: in the injected copy only, `OH.BASE` was rewritten to the same snapshot folder on raw.githubusercontent **at the same commit** (one string replaced). The page's own sha256 check of the manifest, and the manifest's own file hashes, still ran and passed.
- **Off on load:** status off, zero snapshot requests.
- **Enable (first, cold):** P1, 0.25° values, 1 tile, texture 7200 × 3600. Exactly three requests (manifest, mask, v025). Bytes 4,585 + 137,652 + 1,081,272. **Time to layer 2,586 ms** (load 1,482 ms, paint 1,094 ms). Second enable, cached: **1,592 ms** (load 950, paint 634). The page was reported as hidden by the browser during both, so these are upper bounds.
- **All 12 table taps** (`rowsAt`, the function the inspector uses), compared afterwards with `expected-taps.json` by the suite's own `expectText`: **12 match, 0 fail.** Examples: Atlantic off Cape Point 17.7 °C, +0.7 °C; False Bay 18.0 °C, +1.2 °C; Open Pacific 30.6 °C, +5.1 °C; Seam W 26.0 °C / Seam E 25.8 °C, both −0.9 °C; Cape Town "Land — no sea temperature"; Weddell "Sea ice …"; Baffin "No 1991–2020 normal …"; Near normal 29.5 °C, −0.1 °C.
- **Real tap through the page's handlers** (a click at the globe centre over 0.125° S, 139.875° W): the inspector opened "Everything here · cell 22_10" with an "Ocean heat here" section: 30.6 °C, +5.1 °C warmer than usual, 25 of 25 source cells, 0.25° square, credit and methods DOI.
- **Sky zoom-out:** opening it hid the Ocean Heat mesh (`visible` false) with the layer still on; closing it restored the mesh; status stayed `ready`.
- **Off:** status off, 0 meshes, no 7200-wide texture left in the scene, legend and card key hidden, `rowsAt` null, no further requests.
- **Looked at on the real backdrop** (screenshots, 19:30–19:35Z):
  - South Atlantic and Indian Ocean whole-globe: classes read clearly; land (Africa) clear, showing the imagery; Antarctic sea ice shows the dark no-data checker.
  - Equatorial Pacific close-up: the +5 °C warm tongue in the darkest class; vessel cells and other layers draw on top.
  - Cape Peninsula close-up: coastline in 5 km steps, land clear, False Bay and the Atlantic side coloured by their 0.25° squares; ship and fire dots on top.
  - Arctic in polar night: sea ice as the dark slate checker; Greenland and the Canadian islands near-black. **Ice and polar-night land are close in tone here** (see §8).
- **Not obtained: §8 "smooth" and tap-to-inspector timing.** Throughout the session the pane's page reported `visibilityState` hidden for most of the time, and `requestAnimationFrame` ran at one frame per 2,000 ms, **with the layer off as well as on**. A run started automatically the moment the page reported visible (19:36:30Z, after Chad clicked into the pane) still saw 2,000 ms frames. So the frame and tap numbers measure the pane's throttling, not the layer. Recorded only:
  - rotation, layer off / on / off / on: median 2,000 ms each, identical;
  - synthetic taps: 1.24–1.96 s, all waiting on throttled frames;
  - forced synchronous renders (120 frames, `render` + 1-pixel readback, layer off / on / off / on): median 53.2 / 54.7 / 53.6 / 54.0 ms. **The layer adds ≈ 1 ms** to a render in this state; the absolute figure includes the readback stall and the background state, so it is not a frame time.
- **Console:** one error, `renderAll` in `sources.html:213`. This is the original Sources page's own timer still running after the tab's document was replaced by the injection, not the branch.
- The public page was untouched (injection into a clean tab only).

## 7. Code breaks at `0130e4d`

Rerun 19:37–19:57 UTC at `0130e4d`, logs kept in the session. Clean: **79 passed, 0 failed.** Every break fails the suite (exit 1):

| Break | What it does | Failed | Caught by |
|---|---|---|---|
| `no-wrap` | longitude not wrapped | 2 | A4 lng 540 → col 0; ±180 → col 0 at every grid |
| `linear` | linear filtering | 1 | A2 nearest filtering, no mipmaps |
| `nearest-water` | land tap answers from nearby water | 2 | A3 / B2 Cape Town "Land" at 0.25° and 0.5° |
| `paint-noncontrib` | non-contributing cells painted | 2 | A5 Cape Peninsula land texel clear; C4 tile join (land col 3601) |
| `p2-any-water` | P2 texel coloured if any water | 1 | B3 Cape coast texel is the mixed style |
| `tile-shift` | second tile off by one column | 1 | C4 tile join |
| `no-hash` | sha256 checks skipped | 2 | D tampered mask; D manifest not pinned |
| `no-gen` | no generation token | 1 | A7 switched off while loading: late load never draws |
| `same-unavailable-text` | no-normal reads as sea ice | 3 | A3 / B2 Baffin; A4 ice ≠ no-normal |
| `round-lookup` | `round` for `floor` | 12 | A3 / B2 taps, A4 edges, A6 real taps |

## 8. Open for GPT

1. **§8 "smooth" is not yet measured on a real GPU in the foreground** (§6). Options:
   - a foreground run in Chad's own Chrome (Claude in Chrome), same injection, same scripted rotation and taps;
   - or Chad looks for himself in the preview, rotating and tapping, and reports whether it feels smooth.

   The evidence so far: the layer adds about 1 ms per forced render on the M3, and SwiftShader (software) renders it. Is a foreground measurement a condition for the preview pass, or for the merge?
2. **Sea ice in polar night** (§6): the no-data checker `[59,70,84]/[42,50,61]` at alpha 220 sits close to the near-black night land. Lighter checker, or leave it (the inspector says "Sea ice" on tap)?
3. **P1 texture memory ≈ 99 MiB.** Phones with `MAX_TEXTURE_SIZE` ≥ 7200 (most current iPhones report 16384) also take P1. Keep the rule as written, or send phone-sized viewports to P2 (≈ 25 MiB)? Physical-phone performance is unverified.
4. **Data path on merge:** the snapshot lives in the repo under `data/ocean-heat/`, served by Pages, as the proposal says. No R2.
