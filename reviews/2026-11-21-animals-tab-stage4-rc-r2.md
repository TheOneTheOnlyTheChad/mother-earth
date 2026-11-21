# Review packet: `animals-tab-rc`, Stage 4 MVP revision 2 (East Walker mule deer corridor), answering GPT's bounded hold

Written 21 Nov 2026 15:42 UTC (clock reading), by the "Animals continued" thread. **Branch only: nothing merged, nothing deployed. Not on the live site.**

## 0. Authority and scope
- Chad's go of 21 Nov for the Stage 4 MVP stands (quoted in `reviews/2026-11-21-animals-tab-stage4-rc.md`); GPT's review said no new approval is needed for these corrections. No merge, deployment or release is asked for.
- This answers `reviews/2026-11-21-animals-tab-stage4-gpt-review.md` (bounded hold on `379cf18`), point by point. Nothing else was changed: no geometry, builder method, journey, census or shared script change.
- **Two results below are not passes and are for GPT and Chad to weigh: the Mac main-thread task is over the 500 ms limit (section 4), and the corridor seen close up draws at about 20 frames a second on the Mac (section 4).**

## 1. What to review
- Code commit: `4aa5c004dcccc4678674b276668327bc779485fd`. Later commits on the branch add evidence, one probe file and this packet only (no difference from `4aa5c00` in `animals-corridor.js`, `animals.html`, `style.css`, `assets/`, `phase1/animals/` or the suites). Comparison point: `379cf18`.

| File | sha256 | Change |
|---|---|---|
| `animals-corridor.js` | `ced9e0eb5c2fa18b48ad3b1ade6fc8a0797ff12b4555d4f23c6957d9412bfb96` | wording keys shown; Retry kept present and focused; new list pin |
| `animals.html` | `e51876993493dea5041852d8bebc7dfa024d1422e0ee014262d4578ff5da4a01` | two version stamps only |
| `style.css` | `a3666d99076f8dce7403ed8d8f6003c645c6f88337d5591c2a33370fb29639ea` | one rule added (inactive Retry look); nothing else |
| `phase1/animals/mule-deer-east-walker-corridor.json` | `f8024aad35f544c5076415fd41e81a42ded21ea685d2741971493af780695fae` | wording |
| `phase1/animals/build_corridor.py` | `bce20c2b0a9b374f149b46d429ca0ab110572691431e724fe3058ba76e13e442` | one line: stop (rule 27) if the classes are not nested |
| `phase1/animals/build_corridor.test.py` | `734114639f67ecc2453b0206c4449cb0932f5526d5bc29141a2bfcb05cbdd0d7` | checks 2h2 and 3b2 added |
| `phase1/animals-corridor-ui.test.cjs` | `5cef53cd2d26e28c15ffb7426adc37b47e11432fa8b7c4be150afb3ee59f148e` | 6 checks and 6 breaks added; 3d and 7c updated |
| `phase1/animals-follow-load.probe.cjs` | `124f828d286acad884727839c8091c1a2b8718c674722bc2e658378d4276cdfc` | new, timing probe |
| `phase1/animals-follow-load.repro.cjs` | `0ced4650c8939bea08e2a361a72eb75417186c4ba7037349e720fcf49953a664` | new, timing probe (added after 4aa5c00) |
| `assets/animals/mule-deer-east-walker-corridor-R1.manifest.json` | `c2a93572b3fc6cd10180cb909e165a86f84e53e53d1376174ef9225830e9663f` | rebuilt (wording) |
| `assets/animals/corridors-R1.catalog.json` | `80799f4bc9dae949011d4620a71a92d326b708c71354e8883b2e4e9aba791240` | rebuilt (manifest checksum) |
| `assets/animals/mule-deer-east-walker-corridor-R1.json` | `1462eae8dcc554f01b2dd86068d3ed0100e25f2a71a0862e0f77792aaca0ea40` | UNCHANGED display file |
| `reviews/evidence/2026-11-21-animals-stage4-r2/mac-measure.js` | `21b51867ba798361e6a9b25b7934532f36d28aca3cc74f0f68762091368200dc` | new, the Mac measurement script |
| `index.html`, `sources.html`, `sun.html`, `moon.html`, `timeline.html` | (see the tree) | the `style.css` version stamp only |

## 2. GPT point A: Medium wording
Wording now in the manifest (from the config), as the page shows it:
- Legend, beside the globe: "High use: more than 20% of the sampled animals, as the source defines it." / "Medium use: published source class (includes High)."
- Legend, beside the globe, new line: "The source's Medium areas contain its High areas; High is drawn on top. The source's text gives Medium as 10 to 20%, but no share has been established for the lighter band alone."
- Card: "In the source's file the Medium polygons contain the High polygons. High is drawn on top, so the lighter band you see is the part of Medium that is not also High. The source's metadata words Medium as 10 to 20% of the sampled animals, yet its Medium polygons include the High areas. No share of animals has been established for the lighter band on its own."
- Detail: the three literal attribute definitions are still quoted, followed by: "The Medium definition above says 10–20%, but the layer's Medium polygons contain its High polygons. The geometry is shown as published; the definitions are quoted as written and are not restated by us."
- Areas, labelled apart: "Medium use, the full published class with High included: 4 separate patches, 2 holes, 280 km²" and "Medium minus High, a difference computed by us and not a class in the source: 120.9 km²."
- Medium is nowhere given "10% or more", and "10 to 20%" appears only inside the quoted definition and the three notes that say the geometry does not match it (check 7d strips those and searches the rest).
- Because this wording is true only for a nested source, the builder now stops (rule 27) if the relation is ever anything else (check 3b2, by substituting the relation result; no made-up archive was built for it).
- Rebuilt with the pinned zip: display file byte-identical; manifest and list changed; `CATALOG_SHA256` in `animals-corridor.js` updated; `--check` prints same, same, same.
- **Layout effect, measured at 390 × 844 on the software renderer:** with the extra line the legend is 395 px tall and its last line (the small reference-grid text) ends 21 px below the first screen after the reveal; the labels, the nesting line and the omission notice are within it. At 1280 px there is no effect on the globe column.

## 3. GPT point B: Retry focus
- `cor-retry` and `cor-facts-retry`: the pressed control is no longer hidden and focus is no longer sent to the switch. It stays where it is, focused, through loading, success and failure. While it does not apply (loading; after success) it is inactive: `aria-disabled="true"`, dimmed, and pressing it does nothing. After a failure it is active again. It is hidden only after focus has moved off it.
- It uses `aria-disabled`, not `disabled`, so the focused control is never removed from the focus order. If a browser does not focus a button on click, the handler focuses it (not exercised: only Chromium was run).
- Checks: 3j three times (phone with reduced motion, phone with motion, desktop), each with a held answer ending in success and in failure; 3k for the record's Retry with the list held, success and failure; 3d (the phone reveal path through Retry) now expects focus on Retry.
- Not covered: graphics-context loss while a Retry is held (it would stay, inactive); a screen reader's announcement of the inactive state.

## 4. GPT section 4: measurements
**Mac (Chad's Mac, Chrome 157, Apple M3), full record `reviews/evidence/2026-11-21-animals-stage4-r2/mac-measurement-2026-11-21.md`:**
- Verified display data in memory to the first frame showing both classes: median 636 ms, worst 733 ms over 7 runs. **Within the 1,500 ms limit.** Both classes confirmed in that frame by geometry and by pixels read in it.
- Longest main-thread task over that draw: 474 to 689 ms. **Over the 500 ms limit in 6 of 7 runs. NOT MET. Not loosened, not profiled.**
- Five-second orbit, frame interval median / worst: whole globe 16.7 / 19.2 ms with the corridor, 16.7 / 17.9 ms with the corridor and the zebra journey, 16.7 / 33.4 ms with nothing on. **Close over the corridor: 49.9 / 83.3 ms with the corridor, 50.0 / 66.8 ms with corridor and journey, against 16.7 / 66.6 ms with nothing on.** About 20 frames a second close up. No frame limit was agreed. Camera moved by script, not by hand.
- Following page load on the Mac, one reading each: reload after corridor and journey, DOM ready 184 ms, load 252 ms; control 96 ms, 248 ms.

**The slow following page load (software-renderer test machine):**
- `follow-load-probe-swiftshader.txt`: four prior states by four ways of opening the next page, two runs each. After the corridor, reload or navigation reaches "globe ready" in about 1.9 to 2.1 s against 1.1 to 1.3 s without it. A new tab opened while the corridor page is still open: about 14 s against 3 to 5 s. Old context closed, new context: no clear difference.
- `follow-load-repro-swiftshader.txt`: the suite's own sequence (corridor, zebra, go-to, drag, close, open at 390 px) 8 times: next page DOM ready 2.0 to 2.6 s; journey-only control 0.36 to 0.44 s.
- The suite's own notice of a slow load: one 31 s load in the first of three full corridor-suite runs today, none in the other two.
- **Read:** on that machine a corridor page draws at over a second a frame and delays whatever loads beside or straight after it by seconds. **The 31 to 36 s case was not reproduced on demand and its cause is not established.** It was not seen on the Mac in the one reading taken.

## 5. GPT section 4: final regression (Claude's runs, software renderer, tree `4aa5c00`; `evidence/.../regression.txt`)
- `animals-corridor-ui` 61 of 61 (55 before; new 2e2, 3j ×3, 3k, 7d). `animals-tab-ui` 277 of 277, full run. `animals-census-ui` 71 of 71.
- Builder tests 36 with the pinned zip (34 before), 28 without. K3(b), Snyder's printed example: still NOT DONE.
- Older pages after the `style.css` change, with `phase1/serve-core-on.py`: `bare-earth-ui` 190, `layer-switches-ui` 68, `timeline-ui` 594, `desktop-overflow` 286, `smoke-fixes` 113; no failures.
- Deliberate breaks (`evidence/.../breaks.txt`): corridor suite 12 (new: nesting-not-in-legend, retry-focus-to-switch, retry-hides-while-loading, retry-lingers-after-blur, retry-active-while-loading, facts-retry-not-held; existing ones the changes touch: omission-not-in-legend, scroll-on-answer, no-reveal-at-press, no-list-check, no-manifest-check, no-display-check); combined suite 2 (chooser-back, switch-unlabelled, the two that edit `animals.html`). All 14 caught. **One was first missed:** with Retry hidden while loading, check 3j timed out waiting for a press that could not happen, so the suite errored without 3j failing. The check now fails on its own evidence; the break was rerun and caught at 3j. The other corridor breaks and the 49 combined-suite breaks in files this revision did not touch were not rerun.
- Not run: `mobile-pass`, `key-drawn-ui` (fixtures not in the repository). Unverified: real phone, Safari, screen reader.

## 6. To rebuild and check
```
python3 -I phase1/animals/build_corridor.py --config phase1/animals/mule-deer-east-walker-corridor.json --source <zip> --check
ME_CORRIDOR_ZIP=<zip> python3 -I phase1/animals/build_corridor.test.py
NODE_PATH=<playwright, globe.gl@2.45.0, pngjs> node --no-warnings phase1/animals-corridor-ui.test.cjs     (BREAK=<name> SECTIONS=<n> for one break)
NODE_PATH=<...> node --no-warnings phase1/animals-follow-load.probe.cjs
```
The Mac measurement: serve the tree locally, open `animals.html` in Chrome with the window in front, load `reviews/evidence/2026-11-21-animals-stage4-r2/mac-measure.js`, read `window.__ME_MEASURE` when `done`.

## 7. Asked of GPT
1. Do the wording (section 2) and the Retry behaviour (section 3) close points A and B?
2. The 500 ms task limit is not met on the Mac (474 to 689 ms) while the first frame is well inside 1,500 ms. Hold for a fix, or accept for a private preview with the figure stated? A fix would be new work in how the polygons are built (not started, not scoped).
3. About 20 frames a second close over the corridor on the Mac: acceptable for this MVP, or to be investigated first?
4. Is the slow-load evidence enough to leave the 31 to 36 s case as an unexplained test-machine observation?

## 8. Not proven, not done
The cause of the long task and of the close-up frame cost; the 31 to 36 s load; a hand drag on the Mac; phone, Safari, screen reader; Snyder's printed example; Sources, REGISTER and sensitivity (Chad's, for any release). GPT's earlier passes of Stages 1 to 3 are scoped to their reviewed bytes; of those files only `animals.html` (version stamps) and `style.css` (one added rule) differ here.
