# Legend shows what is drawn — proposal for GPT review (rev 2)

15 Nov 2026 · docs only · nothing built · page only · main `5befc51` (page merge `83d0fc0`, hub 0.6.14)
Second item from `docs/concepts/CONTROL-CENTRE-USABILITY-BRIEF.md` (L1). GPT asked for its own review, "especially for counts-only layers and the empty key".

## 1. What main does (reproduced)

The key's first line is fixed text: "earthquake · fire detection (per pass) · vessel (last sample) · forest-disturbance alert pixels…". Buoys and microplastic entries already appear only while their layer is on.

| State (fires as the example) | On the globe | "Key · N layers" counts fires | Legend says |
|---|---|---|---|
| Layer switched off | nothing | no | fire dot entry |
| Down (daily reset, failed refresh) | nothing | no | fire dot entry |
| Stale counts (unknown) | one cell with the **unknown** outline, no dots | no | fire dot entry |
| Valid count, records withheld | cell outline, **no dots** | yes | fire dot entry |
| Valid zero | nothing | yes | fire dot entry |
| Matched, valid count | dots and cell outline | yes | fire dot entry |
| All four core layers off | nothing | 0 layers | all four entries |

Source: `reviews/evidence/2026-11-15-usability-repro/` (`widths.json` legend block) and a rerun of `fire-states.cjs` with drawn cells and points added (15 Nov 06:10 UTC).

## 2. Proposed rules

- **R1. A dot entry shows only while its dots are on the globe.** Earthquake, fire detection and vessel: the layer is on, not unknown, its records are usable, and at least one point is drawn. This is the test the globe itself uses to draw points.
- **R2. Counts-only gets its own words.** Layer on, not unknown, counts drawn, records withheld: the entry reads "<layer>: cell outlines only (records withheld)" with no dot. The card still gives the reason.
- **R3. Forest** (counts only by design): its swatch entry shows while forest is on, not unknown, and at least one cell is drawn.
- **R4. Empty key.** With no entry from R1–R3 and no buoy or microplastic entry, the line reads "No map layers are drawn right now." The imagery line, day/night, ocean heat, orbital lines and the coverage key are unchanged.
- **R5. Same line on phone and desktop.** The phone's Key button opens the same legend; "Key · N layers" keeps today's counting.

Files: `index.html` only (legend markup gets ids; one function called from `render()`), plus a new suite. `app.js`, `style.css` and the hub are untouched, so no cache key changes.

## 3. Acceptance checks

| Rule | Check |
|---|---|
| R1 | Fixture "matched": three dot entries present. Fires switched off: the fire entry is gone, the other two stay. Fires down: same. Break: always show, and the off case must fail. |
| R2 | Fixture "run mismatch, valid count" (legacy and production records format): the fire entry reads "cell outlines only (records withheld)", has no dot, and a fire cell outline is drawn. Break: treat it as matched, and it must fail. |
| R3 | Forest with one answered cell: swatch entry present. Forest off or sweep not started: absent. |
| R4 | All core layers off and optional layers off: the line is exactly the empty sentence. Turning earthquakes back on replaces it. |
| R5 | At 390 px: open the Key; same text as desktop for the same state. `mobile-pass` and `fire-status-ui` still pass. |
| Transition | One page session: matched → down → matched; the entry leaves and returns on the next refresh. |

## 4. Decisions

- **L1.** Valid zero: nothing is drawn, so R1 hides the entry while "Key · N layers" still counts the layer. Leave the count as is (recommended for this branch), or stop counting a layer that draws nothing?
- **L2.** Stale counts draw unknown outlines while the layer is not counted and gets no entry. The coverage key already explains unknown outlines. Leave as is (recommended), or add a line?
- **L3.** R2 wording: "cell outlines only (records withheld)" or GPT's alternative.

## 5. Out of scope

Freshness badges, layout at intermediate widths, the hub place fix, Earthquakes and Ships withheld-line gating, Sun picture cleanup, the Moon and Sun pages.

## 6. GPT review of rev 1 (relayed by Chad, 15 Nov 06:16 UTC) — rev 2

GPT: review complete; the page-only build awaits Chad's go. Rev 2 adopts all three answers. Where this section differs from §2–§4, this section governs.

**One source for the legend and the count.** For the six data layers (earthquakes, fires, ships, forest, drifting buoys, microplastic) the legend entry and the "Key · N layers" count both come from the geometry handed to the globe on that render: points, rings (including hollow microplastic rings) and usable count cells. Day/night, ocean heat and the orbital categories keep today's counting and their own legend lines.

| Layer state | Legend entry | Counts toward N |
|---|---|---|
| Symbols drawn (dots or rings), with or without cells | the layer's normal entry | yes, one |
| Usable count cell drawn, records withheld | "Fire detections: cell outlines only (records withheld)" and the equivalent for the other record layers; no dot; the reason stays on the card | yes, one |
| Valid zero: nothing drawn (**L1**) | none | **no** (changes today's count) |
| Stale or otherwise unknown: only unknown outlines (**L2**) | none; the coverage key covers them | no |
| Off, down, loading, unavailable | none | no |
| Forest: at least one usable cell drawn | swatch entry | yes, one |

**Empty line (L2):** "No data symbols or count cells are drawn right now." It shows only when none of the six data layers has such geometry. An overlay on its own (day/night, ocean heat, orbital) keeps its own line and does not suppress or replace this sentence's rule.

**Added acceptance checks** (with §3's desktop, 390 px and refresh checks):

- Valid zero removes both the entry and the count.
- Stale-only leaves the unknown outline on the globe, adds no entry and does not increment the count.
- An overlay on its own keeps its own legend line; the empty sentence still describes the six data layers.
- Optional layers (buoys, microplastic) while loading and while unavailable: no entry, no count.
- A microplastic fixture with hollow rings only (every sample zero) still gets its entry and counts as one.
- Counts-only wording appears only with a usable count cell drawn and records withheld, in both records formats.

**Scope note:** the count rule lives in `drawnLayers()` in `index.html`, so the build still touches `index.html` only. `mobile-pass` asserts today's counts and will need its expectations updated where L1 changes them; that is named here so it is not a surprise at review.

**Status:** not built. Awaits Chad's own go line.
