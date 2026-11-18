# Review packet: `smoke-key-hint-rc` (Key counts and names every drawn layer; first-view line clear of the credits)

Rev 1, 18 Nov 2026. Branch `smoke-key-hint-rc`, code commit `e71be8a` (from main `26289f8`). Page only. No hub change, nothing merged.
Proposal: `docs/concepts/SMOKE-KEY-HINT-PROPOSAL.md` rev 2 (sha256 `9602135d…9b27`), reviewed by GPT. Chad's go, 18 Nov: "Go: build smoke-key-hint-rc on a branch per SMOKE-KEY-HINT-PROPOSAL rev 2 (page only; no merge)."

## 1. What changed

| File | sha256 | Change |
|---|---|---|
| `index.html` | `3a82c7d6…79a9` | Key count, four Key entries, empty sentence, full repaint; three `?v=` keys |
| `style.css` | `3922796c…2f0f` | two `.bare-hint` rules (721–1100 px; 1101–1279 px) |
| `aircraft.js` | `83c61716…aa55` | `drawn()` for counts and positions; repaint call |
| `wind.js` | `749fd522…a653` | `drawn()`; repaint call |
| `dustrgb.js` | `bd4ca6f3…9505` | `drawn()`; repaint call |
| `moon.html`, `sun.html`, `sources.html`, `timeline.html` | | `style.css?v=202612181000` only |

**Key (index.html).**
- `drawnLayers()` adds `aircraft`, `airdots`, `wind`, `dustrgb`, each from the layer's own `drawn()`: its picture is in the scene (and, for the two aircraft layers, has at least one cell or dot in it).
- `paintLegend()` shows one line for each of the four while drawn, with the wording GPT set, and shows the sentence only when `drawnLayers()` is empty. The sentence reads "No layer data is drawn on the globe right now."
- `ME.paintKeyExternal` now runs `paintLegend()` and `paintKey()`. The day/night and orbital paint functions do the same (they used to repaint the count only; without this the sentence would stay beside them).
- Each of the four layers calls the repaint at the top of its own `paint()` (`dotsPaint()` for positions). Those functions already run after every draw, clear, failure and age check.
- "Layers · N on" is untouched (K2).

**First-view line (style.css).**
- 721–1100 px: `position:static; order:1; align-self:center; transform:none; margin:8px 0 0`. A row under the globe, above the imagery label.
- **Addition, not in the proposal:** 1101–1279 px: `top:64px`. The proposal's own check (the line must not touch the Layers button) failed at 1101 and 1150 px: the centre column is 533 px wide at 1101 px, and the centred line (308 px) reached the Layers button at the globe's top left. This is on main as well. The line now sits one row lower in that range. From 1280 px it is as on main.

## 2. Tests

Run in the container, 18 Nov, on `e71be8a`.

**New suite `phase1/key-drawn-ui.test.cjs`: 70 passed.** Real page files in Chromium; hub fixtures for aircraft counts and positions, one wind run, one Dust RGB frame, the orbital file. Every step is checked for "no other map render during this step" (the page's own render count before and after), after waiting until no render has happened for two seconds.
- each of the four alone: 1 layer, its entry, no sentence; off: 0 and the sentence;
- on and still loading (counts, response held): not counted;
- first load failed (counts, positions, wind, Dust RGB): on, nothing drawn, not counted;
- refresh failed with the earlier picture kept (counts, wind, Dust RGB): still counted, entry kept;
- valid snapshot with no aircraft, and a positions file with no positions: not counted; the next snapshot with aircraft: counted;
- expiry and clearing (counts six hours, positions three, wind, Dust RGB): count and entry go;
- counts ↔ positions both ways: one entry replaces the other, count stays 1;
- counts + wind + Dust RGB: 3 layers, three entries in one line; "Switch everything off": 0 and the sentence;
- `ME.paintKeyExternal` after the count, an entry and the sentence were spoiled by hand: all three put right;
- day/night alone and one orbital group (debris) alone: 1 layer, no sentence;
- 390 px wide, positions drawn: "Key · 1 layer" beside "Layers · 1 on".

**Breaks (15), each run fails:**

| Break | Failed | Fails on |
|---|---|---|
| `drop-aircraft`, `drop-airdots`, `drop-wind`, `drop-dustrgb` | 6, 5, 6, 5 | that layer's "drawn" checks |
| `old-none-rule` (main's sentence rule) | 17 | every "no sentence" check |
| `count-only-repaint` (main's `paintKeyExternal`) | 13 | entries and sentence after a layer draws |
| `no-repaint-air`, `-dots`, `-wind`, `-dust` | 4, 3, 5, 6 | the layer's own steps; e.g. `-dots` gives "Key · 0 layers" beside "1 on", which is the fault GPT saw live |
| `failed-refresh-uncounted` | 2 | failed refresh still counted |
| `zero-counts` | 2 | snapshot with no aircraft not counted |
| `on-means-drawn` | 4 | wind first load failed not counted |
| `night-count-only`, `orb-count-only` | 1, 4 | sentence beside day/night; beside orbital |

The first eleven were run three at a time, and some then also failed a "no other map render" line in an unrelated section (the fixed 1.5 s settle wait was too short under load). The settle wait was changed to "no render for two seconds", and `no-repaint-air` and `no-repaint-dots` rerun alone failed only their own assertions (the figures shown for those two). The other breaks' counts above are from the parallel run and may include such lines; each fails at least its intended assertion.

**`phase1/bare-earth-ui.test.cjs`: 190 passed** (was 128). New section G at 720, 721, 900, 1024×768, 1100, 1101, 1150, 1279, 1280 and 1440 px: line shown, it touches none of the credits, the legend, the imagery label and the Layers button; at 721–1100 it sits directly under the globe and above the imagery label; no horizontal overflow; with a layer on it is hidden and takes no room (imagery label 8 px under the globe); off again it is back and clear.
- Break `tablet-hint` (main's rule): 16 failed, first "over: credits" at 721–1100 px. **This is GPT's finding reproduced in a browser.**
- Break `narrow-desktop-hint`: 4 failed, "over: layers-btn" at 1101 and 1150 px.

**`phase1/legend-active-ui.test.cjs`: 548 passed.** Changed: the sentence's wording; "the empty sentence shows exactly when no layer of any kind is drawn"; case 8 (day/night alone now has no sentence); the `no-empty-line` break's target line. Its eight breaks all fail: see §2a.

**All 42 browser suites:** see §2a.

## 2a. Regression figures
**All 42 browser suites, sequentially, 18 Nov 08:28–09:19 UTC, on `e71be8a`, against `python3 phase1/serve-core-on.py`: 39 pass.** Three had one failing check each:
- `smoke-fixes` 51 passed, 1 failed: "Sources 360: no page-level horizontal overflow". Fails on main (known; GPT's smoke measured 366 px on the live page). Not this branch.
- `osmc-reliability-ui` 40 passed, 1 failed: "old page: no page errors". Fails on main (known). Not this branch.
- `terminator-ui` 18 passed, 1 failed in the sequence ("rendered shading matches the computed day/night across the visible disc"); **19 passed when rerun alone** (09:2x UTC). Recorded as intermittent since 12 Nov (START-HERE §4t).

Figures: `legend-active-ui` 548, `layer-switches-ui` 68, `search-ui` 117, `mobile-pass` 131, `desktop-overflow` 258, `ux-round1` 34, `wind-ui` 92, `dustrgb-ui` 67, `night-lights-ui` 152, `oceanheat-ui` 109, `optional-layers-status-ui` 230, `fire-status-ui` 279, `quakes-ships-status-ui` 124, `bare-earth-ui` 190, `key-drawn-ui` 70, `aircraft-dots-page` 45, `arts-ui` 90, `backdrop-layer` 27, `buoy-temp-ui` 33, `cell-perf-ui` 43, `drifters-ui` 25, `fires-wording-ui` 35, `freshness-wording-ui` 156, `kept-ui` 21, `moon-globe` 67, `moon-lit` 138, `orbital-browser` 113, `place-ui` 35, `plastic-ui` 29, `sky-ui` 79, `skycraft-ui` 77, `status-notes-ui` 17, `terminator-behaviour` 47, `timeline-axis` 96, `timeline-changes-ui` 173, `timeline-ui` 591, `sun-globe` 103, `moon-lro-path` 68, `sky-zoom-ui` 351.

Data suites: `aircraft-counts.test.mjs` 75, `search.test.mjs` 111.

`legend-active-ui` breaks, all eight fail: `always-show` 86, `mismatch-as-symbols` 19, `count-old-rule` 6, `count-unknown-cells` 4, `no-hollow-rings` 3, `no-empty-line` 2, `always-withheld` 2, `never-withheld` 10.

## 3. Live data (Mac's browser pane, branch files on the live page)
Clean `github.io` tab, the five files fetched from `raw.githubusercontent.com` at `e71be8a`, all five hashes matched, blob URLs, `document.write`. Pane 1024×768. 18 Nov 08:28–08:29 UTC.
- Bare: "Key · 0 layers", the new sentence, "Layers · none on".
- Aircraft counts (snapshot of 03:02 UTC, 6,765 aircraft in 444 cells): "Key · 1 layer", "Aircraft counts per area — scale on its card", "Layers · 1 on".
- Aircraft positions: the hub no longer serves that snapshot's positions (over three hours old; the Mac was closed until 07:55 UTC), so nothing is drawn: "Layers · 1 on" beside "Key · 0 layers" and the sentence. This is the case K2 describes, seen live.
- Wind: "Key · 1 layer", its entry. Wind + Dust RGB: "Key · 2 layers", both entries in one line. All off: 0 and the sentence.
- First-view line at 1024×768 with the real globe: `position: static`, rectangle 358–666 × 494–556 (page coordinates), under the globe (bottom 486) and above the imagery label (top 564); credits at 685–802; touches nothing; page width 1024.

## 4. Not checked
- Aircraft positions drawn on live data with this branch (no snapshot under three hours old at the time). Covered by fixtures only.
- Ocean Heat and Night lights switched on with the new repaint, other than through their own unchanged suites and the `ME.paintKeyExternal` check.
- Real phone, screen reader. Widths are emulated viewports.
- The 1101–1279 px rule on live data (the pane was 1024 px wide).
- `widths-preview-rc` (unreleased) changes the 721–1100 px layout: whichever merges second must rerun `bare-earth-ui` section G.

## 5. Questions for GPT
1. The 1101–1279 px rule is an addition found by the proposal's own test. Accept it here, or move it to its own branch?
2. Entry wording as built: "Aircraft counts per area — scale on its card", "Aircraft positions — plain dots — snapshot details on its card", "Wind by height — scale on its card", "Dust RGB — false-colour imagery — explanation on its card".

## 6. Release and rollback
Page only. Merge needs Chad's own Approve line. After merge: fast suites on the merged tree, push, served-hash check of all 21 page files, live read. Rollback = revert the merge.
