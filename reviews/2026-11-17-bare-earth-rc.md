# bare-earth-rc — Bare Earth at load, first-view line, Layers button and panel (stage A) — review packet

**Rev 1, 17 Nov 2026 21:03 UTC (clock reading). Branch only: nothing merged or deployed.**
Branch `bare-earth-rc`, from main `8e9f357` (which has stage B, the labelled switches). The head is in the message that accompanies this packet. Proposal: `docs/concepts/BARE-EARTH-LAYERS-PROPOSAL.md` rev 2 (§0).

## 1. What was asked
Chad, 17 Nov 2026: "you land at mother earth naked as she stands and then you start turning on all the different layers"; "Start bare every time for now"; then "Go" for this stage. GPT (rev 1 of the proposal): keep the dated Earth imagery and the reading cards; show "Choose layers to explore" with a visible Layers button, including on phones; bare must read as an intended starting point.

## 2. What this stage does
- **Bare at load.** `index.html`: one constant, `const START_ON = [];`. The four core layers (earthquakes, fires, ships, forest) start off like every other layer; their switches start unchecked. Nothing else about them changed: they are still fetched every five minutes, so **every reading card keeps its number, state word and time while its layer is off.**
- **First-view line** (`#bare-hint`): "Choose layers to explore." with a "Layers" button, over the globe, shown only while no map layer is on.
- **Layers button** (`#layers-btn`), always on the globe: "Layers · none on" / "Layers · 3 on".
- **Layers panel** (`#layers-panel`, new page file `layers.js`): every map-layer switch in one list (16 rows), grouped Observed / Analysed and modelled / Computed, each row a `role="switch"` button. **A row is a remote control:** it presses the layer's own switch on its card and mirrors that switch's `aria-checked`; it never sets a layer's state itself. "Switch everything off" presses every switch that is on. Escape or Close closes it and returns focus to the Layers button. The panel says: "The page starts bare each time: your choices are not saved." Nothing is written to browser storage.
- **Sky zoom-out view:** the Layers button, line and panel are hidden there, as the key and legend already are (found by `skycraft-ui`: the button sat over the Earth / + Moon / + Sun buttons).
- **Placement:** wide screens: button top-left, line top-centre. 721–1100 px: button on the right under the Key button's place, line near the bottom of the globe. Up to 720 px: button under the Key button, line below it; the panel is a sheet from the bottom.
- `layers.js` is a new page file: **served-hash checks would cover twenty-one files.** `style.css?v=` bumped on the five pages.

## 3. What it does not do (and what that means)
1. **Search still covers only layers that are switched on.** With everything off, a search finds nothing and its notes say each layer was "not searched — layer hidden". GPT's rule (choosing a search result switches its layer on and says so) is **not built here**: it changes the search code and its 104-check suite, and is proposed as the next small branch. Until then, a bare page with a search box that finds nothing is the weakest point of this stage.
2. **Place view** is unchanged (it already respects the switches).
3. **"Key · 0 layers"** is left as it is (not reworded to "no layers"): 548 legend checks read that text.
4. **Remembered choices** are parked (Chad). **A link cannot carry which layers are on.**
5. The cards stay where they are; the panel is the one list.

## 4. Checks run (Linux container, Playwright Chromium, globe.gl 2.45.0)
- **New `phase1/bare-earth-ui.test.cjs`: 126 passed**, at 1440, 1000, 800, 390 and 360 px wide, on the real `index.html` read from disk. No switch on at load; core cards off; key counts nothing; button reads "none on"; the line and both buttons visible, inside the viewport, at least 44 px tall, not covered, and **not over the imagery label, Key button or zoom buttons**; the panel lists 16 switches once each, grouped, inside the viewport, focus moved in; a row presses the real switch and mirrors it; a switch pressed on its card shows in the panel; the line hides and returns; "Switch everything off"; Escape and Close; nothing in `localStorage` or `sessionStorage`; no page errors. **Breaks, each fails the suite:** `start-on` (suite stops: the line never appears), `hint-stays` 5, `no-mirror` 10, `row-direct` 15.
- **Older suites:** they were written for a page with the core layers on at load. They now run against `phase1/serve-core-on.py`, a local server identical to `python3 -m http.server` except that it serves `const START_ON = [];` as the four core layers; seven suites that read `index.html` from disk themselves apply the same one-constant change (`coreOn()`). So those suites prove nothing else regressed; the bare default itself is proved by the new suite. `layer-switches-ui` was updated to the bare default (68 passed; its `pressed` break had stopped biting when the markup changed, and was repaired: 6 fail).
- **All 40 browser page suites were run on the branch.** 38 pass: aircraft-dots-page 37, arts-ui 90, backdrop-layer 27, bare-earth-ui 126, buoy-temp-ui 33, cell-perf-ui 43, desktop-overflow 258, drifters-ui 25, dustrgb-ui 67, fire-status-ui 279, fires-wording-ui 35, freshness-wording-ui 156, kept-ui 21, layer-switches-ui 68, legend-active-ui 548, mobile-pass 131, moon-globe 67, moon-lit 138, moon-lro-path 68, night-lights-ui 152, oceanheat-ui 109, optional-layers-status-ui 230, orbital-browser 113, place-ui 35, plastic-ui 29, quakes-ships-status-ui 124, search-ui 104, sky-ui 79, sky-zoom-ui 351, skycraft-ui 77, status-notes-ui 17, sun-globe 103, terminator-behaviour and terminator-ui (exit 0), timeline-axis 96, timeline-changes-ui 173, timeline-ui 591, ux-round1 34, wind-ui 92. After the last style change (button and line placement) these were run again and pass: bare-earth-ui, layer-switches-ui, desktop-overflow, skycraft-ui, ux-round1, mobile-pass; the rest were run before that change, which touched only the three new rules.
- **The same two checks that fail on main fail here** (`smoke-fixes` "Sources 360: no page-level horizontal overflow"; `osmc-reliability-ui` "old page: no page errors"): tracked separately, not from this branch.
- **On live data** (branch page at `a314c43` in a clean github.io tab in the Mac's pane, 20:17 UTC; hashes checked): at load 0 points and 0 cells drawn, "Layers · none on", line shown, while the cards read 46 earthquakes, 33,398 fire detections, 2,971 ships, 11,523,055 forest alert pixels, each with its state word. Earthquakes switched on from the panel: 46 points, "1 on", line gone. Ships too: 3,017 points. "Switch everything off": 0 points, line back, cards still 46 and 2,971. A screenshot at phone-like width showed the bare globe, the line and the button as intended. (That check was at `a314c43`, before the placement change.)

## 5. Not done, not checked
1. A person on a real phone; a real screen reader (the panel is a non-modal `role="dialog"`; focus is moved in and returned but not trapped).
2. The first-view line sits over the upper part of the globe on phones. It is the one thing on a bare Earth; whether that is right is Chad's eye.
3. Search with everything off (§3.1).
4. Worker or page performance at load was not measured (expected better: nothing is drawn).

## 6. Questions for GPT
1. Is the panel as a non-modal dialog with mirrored switches sound, or should the rows be the only switches (cards without their own)?
2. Search (§3.1): acceptable to ship stage A with search limited to switched-on layers and a next branch for "result switches its layer on", or should that be in this release?
3. Is `serve-core-on.py` plus `coreOn()` an acceptable way to keep the older suites meaningful, with the bare default proved by its own suite?
