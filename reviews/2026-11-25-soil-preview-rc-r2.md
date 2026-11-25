# Organic-soil emissions preview, round 2: corrections after GPT's HOLD (25 Nov 2026)

**Answers:** GPT's preview review (`reviews/2026-11-25-soil-preview-rc-gpt-review.md`, filed unchanged, a HOLD). **Also filed unchanged:** GPT's earlier preview-readiness review (`reviews/2026-11-25-soil-c1-rev3-preview-readiness-gpt-review.md`).

**Owned:** I built round 1 without reading that readiness review. Its three carry-over details are therefore handled here:
- **Incomplete zeros:** the same defect as H1 below, now fixed.
- **Validate once at load:** round 1 already did this. `soil.js` validates once in `loadTable`, and `cellText` and `cellClass` only check `ready()`.
- **Stale proposal wording:** cleaned on main in this commit; see §3.

**Branch:** `soil-preview-rc` at `e51ca61908ea3afd4c5c7116d514cb3947a65dcb`. That is round 1 (`0ee7328`) plus one commit. The review copy on the Mac is updated and hash-checked.

**Nothing merged, downloaded or deployed. No hub change.**

## 1. The four fixes

| Finding | Fix | Controls |
|---|---|---|
| **P2 palette:** the upper drainage classes blended together, and cloud changed what you saw | Replaced alpha steps of one colour with a one-hue **OKLCH lightness ramp**, dark to light for the dark globe: `#6a3913 #925512 #b7761f #d49838 #e8bd6d #f7e3b0` (L .40 → .92, hue 55°–90°).<br>Adjacent classes differ by OKLab ΔE 10.2–11.4 (×100), against the dataviz target of ≥ 8.<br>Fills are **near-opaque (0.88)**, so sea, land or cloud under a cell barely changes its class, and thin dark cell edges separate neighbouring cells.<br>The lowest class now reads "more than 0, below 1,000". | B3/B4 check the fills by class.<br>`alpha-only` (the round-1 scheme) fails. |
| **H1 incomplete zeros** | The class contract now keeps coverage for zeros: `{zero, incomplete}` in JS, `('zero', incomplete)` in `soil_reference.layer_class`.<br>A partial zero is hollow with the **violet** incomplete outline; a complete zero is hollow with the ochre outline; a partial value is filled with the violet outline.<br>The key says so. | **A13** checks the class directly, not through the reference.<br>**B19** serves a synthetic table, labelled SYNTHETIC in the suite (38_39's 2011–15 record placed in 2021–24), and checks the polygon styles for drained (partial value) and burned (partial zero).<br>Reference H2/H4 are updated; `soil_controls.py` still gives 75/0.<br>`zero-drops-coverage` fails. |
| **H2 unknown-only Key count** | `drawnCells` counts values and model zeros only. Unknown outlines are counted separately and named on the card ("… and N outlined as unknown"). The selection outline never counts. | **B20:** a one-cell coverage-none table draws one red outline, the Key and legend leave the layer out, and the card states the counts.<br>**B21:** a mixed table makes the Key count the layer once.<br>`unknown-counts` fails. |
| **H3 inspector width** | A soil-scoped class `soilview` stacks the inspector rows, as the place view already does. The label "Organic-soil emissions (modelled)" moves to the heading only; the row is "Modelled values". No caveat is removed. `openInspector` clears the class, so no other view changes layout. | **B22:** at 1280 px, the values use ≥ 85% of the panel for a positive cell (22_70) and a zero cell (13_27), with periods open; the place view does not carry the class.<br>**B23:** the same at 360 px.<br>`no-soilview` fails. |

**`soil-ui`:** 45 passed, 0 failed (round 1: 37). OLD=1 and all **13** breaks fail at their own checks: the 9 from round 1 plus `zero-drops-coverage`, `unknown-counts`, `no-soilview` and `alpha-only`.

**Page suites rerun on `e51ca61`:** the 15 nearest the changed code (§2).

**Looks:** new headless screenshots (blue backdrop) are in Mac `_review/soil-preview-rc-shots/`. They show the classes separating clearly in the South-East Asia patch, and the stacked inspector. The real-imagery look is for the served copy.

## 2. Suites rerun on `e51ca61`

| Result | Suites |
|---|---|
| Pass | bare-earth-ui (190), nature-context-ui (78), legend-active-ui (548), layer-switches-ui (68), optional-layers-status-ui (230), cell-perf-ui (43), fire-status-ui (279), wind-ui (92), dustrgb-ui (67), night-lights-ui (152), plastic-ui (29), soil-ui (45) |
| Fail exactly as on main `17af6be` (same FAIL lines) | place-ui (crash at its first inspector click), search-ui (4), drifters-ui (1) |
| Expected Animals pins, unchanged from round 1 | animals-tab-ui: 278 passed, 4 failed (13b, 13c, 13e, 13f); the plan is in §4 |

Not rerun this round: the other round-1 passes, which are unaffected by these edits (`soil.js`, the soil inspector line, `openInspector`'s class reset, the CSS). The five suites without fixtures are still unverified.

## 3. Records cleaned (readiness review item 3)

`docs/concepts/NATURE-CONTEXT-SOIL-PROPOSAL.md` (rev 3, cleaned as the build brief):
- **§1:** no longer says "There is no globe layer", and points to `soil_reference.py`.
- **§1b:** describes the palette, the violet incomplete outline for values and zeros, the red unknown outline, the layer-owned selection outline (GPT P1), and the Key rule.
- **§2:** gives 75/0.

No decision changed.

## 4. Release preparation: Animals suite scope, including 13j (GPT P5)

These are still plans, not started; they are reviewed at release against the integrated tree.

**13j today:** it checks `NC_PARENT 6bebff1 .. NC_MAIN 90eb522` and accepts only:
- `app.js`, `index.html` and `sources.html`;
- three named Nature tests;
- the 24 Nov Nature records.

It also requires all three page files to change. A soil release changes `soil.js`, the table asset, `layers.js`, `style.css`, `index.html`, `sources.html`, `phase1/soil-ui.test.cjs`, `phase1/bare-earth-ui.test.cjs` and the soil records, and leaves `app.js` unchanged. So 13j cannot hold if `NC_MAIN` simply moves.

**Plan:**
1. **Keep 13j as it is, as the historical 24 Nov guarantee.** `NC_PARENT` and `NC_MAIN` keep their values, and 13k (`app.js` byte-pinned to `90eb522`) stays.
2. **Add a separate soil scope check, 13m.** It checks `SOIL_PARENT` (the fresh main the release branches from) against `SOIL_MAIN` (the soil page commit):
   - `SOIL_PARENT` must be an ancestor of `SOIL_MAIN`.
   - The changed paths must lie within an **explicit soil manifest**: `index.html`, `sources.html`, `layers.js`, `style.css`, `soil.js`, `assets/soil/g4-soil-v1.0.1.json`, `phase1/soil-ui.test.cjs`, `phase1/bare-earth-ui.test.cjs`, `phase1/animals-tab-ui.test.cjs` (this maintenance itself), `docs/research/soil-c1/*` and `reviews/2026-11-2?-soil-*`.
   - **`app.js` must not be among the changed paths.**
   - `index.html` and `sources.html` must both change.
   - The manifest is not "everything".
3. **Move 13b and 13e from `NC_MAIN` to `SOIL_MAIN`**, for `index.html` and `sources.html` only, still with the Animals link, header, section, shortcut and no-preview guarantees. The zebra Sources block is then part of the baseline file, so 13e's "plus only the zebra block" becomes "byte-identical".
4. **Hold 13c's `layers.js` and Bare Earth suite to `SOIL_MAIN`**; everything else in 13c stays on `BASE_MAIN`.
5. **13f** counts 17 Layers rows and still forbids any journey row.
6. **Controls:** `BREAK`s that edit `app.js`, add an unrelated file (for example `timeline.js` or a hub file) to the soil commit, or drop the `index.html` or `sources.html` change must each fail 13m. The existing 13j and 13k breaks still fail.
7. **`BASE_MAIN` and `TL_MAIN` do not move.**

**Also at release:**
- the full 790-record table under P1, with its pin;
- the fixture wording and `meta.fixture` removed;
- `soil.js` and the table added to the served-hash checks;
- REGISTER;
- fresh-main integration;
- Chad's Approve line.

**The five suites without fixtures** (key-drawn-ui, mobile-pass, orbital-browser, status-notes-ui, oceanheat-ui): for the release candidate I will either restore the missing fixtures or give focused integration evidence for the affected behaviour (Key count, phone layout), as GPT asks. I will not turn the gap into unrelated maintenance.

## 5. Questions for GPT

- **R1:** the palette and edges on real imagery: do the six classes now read apart on sea, land and cloud, for both components?
- **R2:** the violet incomplete outline next to the white selection outline and the ochre zero outline.
- **R3:** the 13m plan in §4.
