# legend-active-rc — review packet (rev 2; §7 = round 2)

15 Nov 2026 · branch `legend-active-rc` from main `0373839` · page only · not merged · for GPT
Proposal: `docs/concepts/LEGEND-ACTIVE-PROPOSAL.md` rev 2 (§6 governs). Chad's go: "Go: build legend-active-rc on a branch per LEGEND-ACTIVE-PROPOSAL rev 2, with §6 governing L1–L3. index.html is the only production file in scope. Add the legend regression checks and update mobile-pass expectations where needed. No merge."

## 1. What changed

| File | Change |
|---|---|
| `index.html` | `render()` tallies what it hands to the globe per data layer (`drawnGeom`: symbols, usable count cells). `paintLegend()` builds the legend's data line from that tally. `drawnLayers()` counts the six data layers from the same tally. Legend markup: one span per layer with a symbols form and a counts-only form, plus the empty sentence. Key definition text updated. Two lines that showed the buoy and microplastic entries by switch state are removed (the tally decides). |
| `phase1/legend-active-ui.test.cjs` | New suite. |
| `phase1/fire-status-ui.test.cjs` | One expectation: a valid zero is no longer counted in the Key (L1). |

`app.js`, `style.css`, `sources.html` and the hub are unchanged. No cache key changes: `index.html` is not cached by key.

## 2. Rules as built (§6)

| Layer state | Legend | Counts toward N |
|---|---|---|
| Symbols drawn (dots; hollow microplastic rings) | the layer's entry | one |
| Usable count cells, no symbols (records withheld) | "Fire detections: cell outlines only (records withheld)"; same form for Earthquakes, Ships, Drifting buoys; no dot | one |
| Forest: at least one usable cell | swatch entry | one |
| Valid zero | none | no |
| Only cells outlined as unknown (stale) | none | no |
| Off, down, loading, unavailable | none | no |
| None of the six has symbols or count cells | "No data symbols or count cells are drawn right now." | — |

A "usable count cell" is a cell drawn with a grade other than unknown. Microplastic cells carry no value, so they are never count cells. With no globe (no WebGL) the tally is zero. Day/night, ocean heat and orbital counting and lines are untouched.

## 3. Tests (workspace, software rendering, 15 Nov)

`legend-active-ui`: **496 passed, 0 failed** (run twice). Every case also checks the legend and the count against what the globe was given (`ME.renderState`, `ME.cellPolys`), not against a second rule.

| Case | Checked |
|---|---|
| Matched; fires off and on | four entries, count 4; entry and count leave and return |
| Fires down | no entry, count 3, no fire cells |
| Valid zero | no entry **and** no count |
| Stale-only | unknown outlines on the globe, no entry, count not incremented |
| Counts-only, legacy file (mismatch; unreadable records) | counts-only wording, no dot, usable cells drawn, count 4 |
| Counts-only, production `lines/1` file written by the hub's own pipeline | same |
| Forest sweep not started | no swatch entry, not counted |
| All data layers off | exactly the empty sentence, "Key · 0 layers"; one layer back replaces it |
| Day/night on its own | its own legend line; data line still the empty sentence; count 1 |
| Buoys loading, loaded, unavailable | no entry and no count while loading or unavailable; entry and count once drawn |
| Microplastic: one value and one zero; hollow rings only; records withheld | entry and count with rings only; none when withheld |
| Buoys counts-only | counts-only wording, counted as one |
| 390 px | same count with the Key closed; same line with it open |
| One session: matched → down → matched | entry and count follow each refresh |

Breaks, each fails as it should: `always-show` 80 failures · `mismatch-as-symbols` 12 · `count-old-rule` 4 · `count-unknown-cells` 4 · `no-hollow-rings` 3 · `no-empty-line` 4.

Regression, all pass: `fire-status-ui` 279 · `fires-wording-ui` 35 · `mobile-pass` 131 · `drifters-ui` 25 · `plastic-ui` 29 · `place-ui` 30 · `search-ui` 104 · `kept-ui` 21 · `buoy-temp-ui` 33 · `desktop-overflow` 258 · `cell-perf-ui` 43 · `ux-round1` 34 · `status-notes-ui` 17 · `terminator-ui` 19 · `terminator-behaviour` (exit 0) · `dustrgb-ui` 67 · `backdrop-layer` 27 · `orbital-browser` 113 · `arts-ui` 90 · `sky-ui` 79 · `sky-zoom-ui` 351.

- **`mobile-pass` needed no change:** none of its cases has a zero layer or a counts-only optional layer.
- Still failing, same as on main: `osmc-reliability-ui` "old page: no page errors"; `smoke-fixes` "Sources 360" overflow.
- Not runnable here: `oceanheat-ui` (needs a snapshot folder this workspace does not have).

## 4. Two behaviours to look at

1. **Buoys with records withheld now count as one.** Main never counted an optional layer whose records were not usable, though its count cells were drawn. Under "legend and count from the rendered geometry" they count, with the counts-only wording.
2. **Microplastic with records withheld gets no entry and no count** although its faint cell outlines are still drawn. Those cells carry no value, so they are not count cells under §6.

## 5. Not tested

Real phone, Safari, screen reader, real GPU, the live page. Legend appearance was read as text, not judged by eye (the globe does not draw fully under software rendering).

## 6. Release steps, if GPT passes (on Chad's own line)

1. Merge `legend-active-rc` to main (page change).
2. Served-hash check of `index.html` from the pane; live read of the legend line and Key count.

Rollback: revert the merge commit.

## 7. Round 2 (15 Nov 07:46 UTC): GPT's two wording fixes

GPT (relayed by Chad): the same render tally drives the legend and the Key count, as agreed; hold for two wording fixes. GPT reviewed the Mac copy, ran five checks against the candidate's render code with a stub globe (valid zero, counts-only, stale outlines, hollow microplastic rings, zero-alert Forest), then smoke-tested the local candidate in desktop Chrome on live hub data: fires off → on (entry leaves and returns, Key 3 → 4); all data layers off (empty message, 0 layers); day/night only (its own line, 1 layer, empty message stays). Desktop smoke passed; the hold stood for the two fixes, which live data did not exercise.

**Fix 1 — the Key definition.** It said a layer "whose count is zero" never counts, but a Forest cell reporting zero alerts is drawn, shows its swatch and counts (correct under rev 2). The definition now reads: "…each data layer that draws a symbol or a usable count cell (…) … switched-off layers, layers still loading or unavailable, a layer that draws nothing, and cells outlined as unknown are not counted." New case **3c**: one answered Forest cell with zero alerts (drawn, swatch, counted) beside zero fires (nothing drawn, no entry, not counted).

**Fix 2 — "(records withheld)" only when they are.** The suffix is now a separate span shown only while `usable(layer)` is false. A usable pair that draws cells and no symbols reads "Fire detections: cell outlines only". New case **4c**: same run, counts present, records file empty; the page accepts the pair; no suffix, no dot, counted as one. Every counts-only case now also asserts that the suffix appears exactly when the records are not usable.

Also changed: the test aid `ME.legendState()` reads visible text at any depth, so a hidden suffix is not reported as shown.

| Run | Result |
|---|---|
| `legend-active-ui` | **548 passed, 0 failed** |
| New breaks | `always-withheld` (round 1's behaviour) fails 2 · `never-withheld` fails 10 |
| Earlier breaks, rerun | `always-show` 87 · `mismatch-as-symbols` 19 · `count-old-rule` 6 · `count-unknown-cells` 4 · `no-hollow-rings` 3 · `no-empty-line` 4 failures |
| Regression rerun | `fire-status-ui` 279 · `mobile-pass` 131 · `drifters-ui` 25 · `plastic-ui` 29 · `buoy-temp-ui` 33 · `place-ui` 30 · `search-ui` 104 · `status-notes-ui` 17, all pass · `osmc-reliability-ui` 40 passed, 1 failed (same "old page" check as main) |

Files changed in round 2: `index.html`, `phase1/legend-active-ui.test.cjs`, this packet, STATUS. The other suites listed in §3 were not rerun (round 2 touches the legend markup, one line of `paintLegend()`, the definition text and the test aid).
