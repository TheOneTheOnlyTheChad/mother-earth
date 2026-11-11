# Ocean Heat — preview release-candidate packet (`ocean-heat-rc`)

**Approval:** Chad, 10 Nov 2026: "Approve: build ocean-heat-rc on a branch only — Ocean Heat preview per OCEAN-HEAT-PROPOSAL rev 4.2 on the pinned 9 Nov inputs; no merge, R2, hub or page change."
**Candidate:** branch `ocean-heat-rc` @ **`3915348`** (rev 2 code, after GPT's preview review, §9); rev 1 code and snapshot `0130e4d`. Earlier commits: `3245f73`, `ec08df1`, `a56a5e3`. This packet is committed after it.
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

## 9. GPT's preview review (relayed by Chad, 11 Nov 2026) and rev 2

**Verdict:** Ocean Heat **passes functional preview review**; **performance remains a merge gate**. GPT matched all 12 local file hashes to this packet, reviewed the recorded M3 run and the renderer-selection code, and did not rerun the browser suite.

**Answers to §8:**
1. **Foreground timing before merge.** On the final candidate, in foreground Chrome: the agreed rotation and tap checks, a layer-off baseline, **both shipping render paths** exercised; thresholds median frame interval ≤ 33 ms, p95 ≤ 50 ms, tap-to-visible-inspector ≤ 200 ms. Chad's hands-on impression alongside. The throttled pane run and the forced-render delta leave these unverified.
2. **Lighten the no-data checker** so it reads apart from dark land first; keep it distinct from the anomaly colours; compare against Greenland and nearby sea ice with day/night on.
3. **Phone-sized viewports default to P2** (≈ 25 MiB texture, not ≈ 99 MiB; a similar CPU canvas in each case). Keep P1 for larger viewports where it passes. Handle renderer limits below 3,600 px explicitly: the old fallback still attempted a 3,600 px texture on them.
4. **Pages for this fixed snapshot is reasonable if Chad explicitly chooses it for release.** Rev 4.2 approves the bundled asset for the preview branch and describes hub serving as the public follow-on. Shipping `data/ocean-heat/` from Pages changes that decision. If Chad chooses Pages: verify the four snapshot files and the page assets on Pages, and smoke-test the relative data URL (the M3 run used a rewritten raw.githubusercontent URL).
   - **Correction to §8 item 4 above:** it said Pages serving was "as the proposal says". It is not. Rev 4.2 names hub serving as the public follow-on; Pages would be a release decision of Chad's.

**Rev 2 on the branch (`3915348`, code; `oceanheat.js` sha256 `ee5331e4…33ff90`).** Only `oceanheat.js` and the suite changed. `index.html`, `sources.html`, `app.js` and the snapshot are unchanged.
- **Path rule.**
  - *Phone-sized*: the page's own phone breakpoint (≤ 720 CSS px wide), or a touch screen whose short side is ≤ 500 px (a phone held sideways). Decided once at switch-on. Phone-sized → P2.
  - *Not phone-sized* → P1 when the limit is ≥ 3,600.
  - *Tiles by limit*: P1 7200 × 3600 as one texture (≥ 7,200) or two tiles of 3600 × 3600 (3,600–7,199); P2 3600 × 1800 as one texture (≥ 3,600) or two tiles of 1800 × 1800 (1,800–3,599).
  - *Below 1,800, or unreadable*: "Ocean heat unavailable — this device's graphics texture limit (N px) is below the 1800 px the layer needs. Nothing is drawn." Only the 4.6 KB manifest has been fetched by then.
  - P2 painting now takes a tile offset (it was single-texture only).
- **No-data checker** `[128,140,160] / [100,112,130]` at alpha 220 (was `[59,70,84] / [42,50,61]`).
  - Chosen from five candidates by CIELAB ΔE, over normal, deuteranomaly and tritanomaly (minimum across the three):

    | vs | Old | New |
    |---|---|---|
    | polar-night land (black under the 0.40 night shade) | 12.4 | **28.0** |
    | black land, day | 22.4 | 46.4 |
    | daylit white land | 55.5 | 31.7 |
    | nearest anomaly class | 10.1 | **19.3** |
    | P2 mixed grey, over black / over white | 12.8 / 36.6 | 13.7 / 13.2 |

  - The cost is against daylit white land (31.7) and P2's mixed grey (13.2–13.7). The mixed grey is solid and appears only at coasts and ice edges; the checker is a pattern.
  - **Looked at on the real globe** (pane, M3, day/night on, 02:56Z):
    - Arctic in night: sea ice slate grey, clearly apart from black Greenland and the Canadian islands; blue and orange anomaly classes clearly different.
    - Weddell Sea in sun: slate checker apart from white Antarctica, in both the sunlit and the shaded band.
- **On the M3 in the pane (588 CSS px wide = phone-sized):** default enable chose **P2**, 0.5°, 1 texture 3600 × 1800, `phone: true`; requests manifest + mask + v050 (465,413 B); load 1,001 ms, paint 94 ms (page throttled, so upper bounds). All seven page files hash-exact at `3915348` (the same one-string `BASE` rewrite as §6).
- **Suite `phase1/oceanheat-ui.test.cjs` — 101 passed** (was 79):
  - **F (new):** limits simulated through a test aid (`forceMaxTex`, `forcePhone`) on the real snapshot:
    - 16384 → P1 × 1;
    - 4096 and exactly 3600 → P1 × 2 (Seam E tap on the tiled P1);
    - 2048 and exactly 1800 → P2 × 2 (Cape coast texel in tile 1 still mixed, its water neighbour the block colour);
    - 1799 and 1024 → unavailable, own reason, nothing drawn, no mask or value file fetched;
    - phone-sized → P2 × 1, and P2 × 2 at 2048.
  - **C [P2 × 2] (new):** the seam fixture rendered on the globe with P2 in two tiles, plus the tile join texels (pale | mixed | orange) and the mirror and π-rotation sensitivity.
  - **E:** 390 × 844 now enables with no forced path → P2, `3600x1800`, exactly manifest + mask + v050; Off Cornwall tap at 0.5°.
  - **A5:** the texel is exactly one of the new checker colours; rendered Weddell is blue-tinged grey, not near-normal pale.
  - **A2:** the path rule reads the phone flag.
- **Code breaks at `3915348`:** all 13 fail the suite (exit 1); clean 101/0.

  | Break | Failed | Caught by |
  |---|---|---|
  | `no-wrap` | 2 | A4 |
  | `linear` | 1 | A2 |
  | `nearest-water` | 2 | A3 / B2 Cape Town |
  | `paint-noncontrib` | 2 | A5, C4 [P1 ×2] |
  | `p2-any-water` | 3 | B3, C4 [P2 ×2], F2 |
  | `tile-shift` | 2 | C4 [P1 ×2] and [P2 ×2] |
  | `no-hash` | 2 | D |
  | `no-gen` | 1 | A7 |
  | `same-unavailable-text` | 3 | A3 / B2 Baffin, A4 |
  | `round-lookup` | 13 | A3 / B2 / A4 / A6 / F1 |
  | **`phone-p1`** (new: phone flag ignored) | 3 | E default P2, E tap at 0.5°, F6 |
  | **`small-limit`** (new: the < 1800 stop removed) | 2 | F4 at 1024 and 1799 |
  | **`p2-tile-x0`** (new: P2 tile offset dropped) | 4 | C2 [P2 ×2] seam and join, C4 [P2 ×2], F2 |
- **Regression at `3915348`:** mobile-pass 131, desktop-overflow 112, sky-zoom-ui 333, smoke-fixes 52, terminator-ui 19, all passing (the suites that load the page; only `oceanheat.js` changed).
- **Open (Chad's lines, unchanged by rev 2):** the foreground timing run (both paths: P1 on a desktop-sized window, P2 on a phone-sized one); Pages vs hub for release; the md5 sidecars; REGISTER filing (C6).
