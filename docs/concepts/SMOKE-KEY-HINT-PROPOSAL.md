# Proposal: two fixes from GPT's 18 Nov smoke (Bare Earth line over the credits; Key says nothing is drawn while layers are)

Rev 2, 18 Nov 2026 07:55 UTC (clock reading); rev 1 was 18 Nov 2026 03:27 UTC. Branch `smoke-key-hint-rc` from main `8bdb329`. Proposal only: no page file is changed on this branch yet.
Rev 2 takes in GPT's review of rev 1 (relayed by Chad, 18 Nov): both causes confirmed by GPT, fixes supported, K1 and K2 answered, three implementation and test details tightened (marked **rev 2**).
Source: GPT's read-only smoke of the live page, 18 Nov 03:11–03:21 UTC (relayed by Chad). Causes below are read from the code on main; Claude has not yet reproduced either in a browser.

## 1. "Choose layers to explore." sits over the credits at 721–1100 px

**Seen (GPT):** 900×800, fresh load, all layers off. `#bare-hint` at y 662–724; `#credits` at y 649–780. At 360 and 390 px the line is below the globe and clear.

**Cause:** up to 1100 px, `style.css` sets `.gwrap{display:contents}`, so the globe's wrapper makes no box. `.bare-hint` is `position:absolute; bottom:64px` (line 728), and with no wrapper box it is measured from the bottom of the whole centre column, which at these widths also holds the imagery label, the legend and the credits. The ≤720 px rule replaces it, so phones are not affected.

**Proposed:** in the 721–1100 px range only, take the line out of absolute positioning and make it a row of the column directly under the globe (`position:static; order:2; align-self:center; margin:8px 0 0; transform:none`), ahead of the imagery label. It then cannot cover anything. Above 1100 px and up to 720 px: unchanged.

**Check the same cause on the Layers button** (`top:64px; right:12px` in the same range): GPT did not report it and it measures from the top, but the suite will assert it stays inside the globe's rectangle.

**Tests (rev 2):** `bare-earth-ui`: at 900×800 and 1024×768, and at both sides of each boundary (720 / 721 and 1100 / 1101 px wide), with the line shown and with it hidden: shown, its rectangle does not intersect `#credits`, `#legend`, `#imgdate` or `#layers-btn`; hidden, it takes no room and the column is as on main. Break = remove the new rule.

**Note:** `widths-preview-rc` (unreleased) changes this same width range. Whichever merges second must rerun this check.

## 2. The Key says nothing is drawn, and counts 0 layers, while aircraft, wind or dust are on the globe

**Seen (GPT):** aircraft counts alone: cells drawn, card 6,765 aircraft in 444 cells, "Layers · 1 on", but the Key reads "No data symbols or count cells are drawn right now." Same with positions. At 390 px "Key · 0 layers". The sentence also shows beside drawn orbital markers.

**Cause (index.html):**
- `drawnLayers()` counts the six data layers, day/night, ocean heat, night lights and the orbital groups. It has no entry for **aircraft counts, aircraft positions, wind or Dust RGB**, so "Key · N layers" leaves them out.
- `paintLegend()` shows `#leg-none` whenever none of the six data layers drew anything, whatever else is on the globe.
- Aircraft, wind and dust never call `ME.paintKeyExternal`, so the Key is not repainted when they switch.

**Proposed:**
1. `drawnLayers()` adds `aircraft` (counts picture in the scene with at least one cell drawn), `airdots` (positions picture in the scene with at least one dot), `wind` (a field on the globe) and `dustrgb` (a frame on the globe), each read from that layer's own state, counted only while actually drawn (same rule as today: on but loading, withheld or failed does not count).
2. The empty sentence shows only when `drawnLayers()` is empty, and reads **"No layer data is drawn on the globe right now."** (rev 2, GPT: "Nothing is drawn" would contradict the Earth imagery in view).
3. Each of the four gets a one-line Key entry (rev 2, K1 decided; wording per GPT). No scale is duplicated:
   - Aircraft counts: "Aircraft counts per area — scale on its card".
   - Wind: "Wind by height — scale on its card".
   - Aircraft positions: "Aircraft positions — plain dots — snapshot details on its card" (it has no numerical scale).
   - Dust RGB: "Dust RGB — false-colour imagery — explanation on its card" (it has no numerical scale).
4. Those four call `ME.paintKeyExternal` when they draw, clear or fail. **Rev 2:** today `ME.paintKeyExternal` repaints only the count (`paintKey`). It will repaint the count, the entries and the empty sentence together, so the existing Ocean Heat and Night lights callers get the same full repaint.
5. **Rev 2, counted means drawn:** a layer whose refresh failed but whose earlier valid picture is still on the globe stays counted and keeps its entry. A layer that failed or is still loading with nothing drawn is not counted.

**Decisions (rev 2, GPT's advice; Chad's to confirm with his go):**
- K1: one-line entries, worded as in item 3.
- K2: keep both measures unchanged. "Layers · N on" counts switches that are on; "Key · N layers" counts layers actually drawn. They can rightly differ.

**Tests (rev 2):** `legend-active-ui` new section:
- each of the four alone → Key count 1, no empty sentence, its entry shown; off → 0 and the sentence returns;
- first load still loading, and first load failed → not counted, no entry;
- refresh failed with the earlier picture still drawn → still counted, entry kept;
- zero aircraft in a valid snapshot (nothing drawn) → not counted;
- aircraft expiry (three hours for positions, six for counts) and clearing → count and entry go;
- counts ↔ positions → one entry replaces the other, count stays 1;
- "Switch everything off" → 0 and the sentence;
- an existing overlay alone (Ocean Heat; Night lights) and one orbital group alone → counted, no empty sentence.

Breaks: drop each layer from `drawnLayers()`; restore the old `leg-none` rule; drop the repaint call; restore the count-only `paintKeyExternal`. Each break must fail its own assertion. For the repaint breaks the test switches the layer with no other render in between (no data poll, no other switch), so an unrelated `render()` cannot hide the missing call.

## Not in this proposal
- Sources page: 6 px of page-level overflow at 360 px (366 wide). Known (`smoke-fixes` fails on it on main); the overflowing element is not yet isolated. Its own small branch if Chad wants it.
- Real phone, screen reader, three-hour aircraft withdrawal, hidden-pane flipping: still untested, as in HANDOVER.

## Release
Page only (`index.html`, `style.css`, `aircraft.js`, `wind.js`, `dustrgb.js`, `?v=` bumps). No hub change. Branch build on Chad's "go"; merge on his own Approve line after GPT's review.
