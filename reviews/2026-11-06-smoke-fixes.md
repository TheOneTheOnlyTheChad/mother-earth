# Live smoke review fixes — candidate for review (6 Nov 2026)

**Branch `smoke-fixes` @ `876061e`. NOT public.** Main and the live page are unchanged. Publishing means merging to main, which needs Chad's go after this review. Source: GPT's live smoke review, 6 Nov ~08:31 UTC (four findings). Page files only; no hub, D1, R2 or schedule change. Assets `?v=202611121000` → `?v=202611131000`.

| file | sha256 (branch) |
|---|---|
| `index.html` | `158587d8a6acefce3950c59345650a906d3aeac92d2c9db1f2535edb5aa32ebe` |
| `sources.html` | `b5810ac66023e9f1d04d4ffe0a629c56f2f69e81339a7a7238d19c9e813d3570` |
| `app.js` | `89f89ee6a1924716ce130660369520f3b4b294c8018c2e6a0046ed2c6d44f651` |
| `style.css` | `e4c9547d99bf2149452522e14aed77755381b802c019445fe8ec0e0d90c534c8` |

## 1. FRP shown as zero (finding 1)
**Cause.** Two formatters were in use:
- the record title and the record's FRP row used `fmt(frp, { dp: 0 })`, i.e. whole numbers;
- the place view used 1 decimal.

FIRMS delivers FRP to 2 decimals, so 0.4 showed as "0 MW" and 2.33 as "2.3 MW". The record title feeds the cell record list, the record header, the Highest FRP note and search results. **Scale on live data (08:45 UTC run): 272 of 906 records are under 1 MW**, so on the public page each reads "0 MW" or "1 MW".

**Fix.** One formatter, `ME.frp` (app.js), used on all three surfaces:
- the value as delivered, at most 2 decimals, never rounded to a whole number;
- a reported 0 → "0 MW (source-reported zero)";
- missing → "not provided";
- a positive value under 0.005 → "< 0.01 MW", so it can never print as 0.

No other surface formats FRP (checked by search: `frp_mw` appears only in these three places plus the data mapping and the Highest FRP key).

**Live check (candidate in a clean pane tab, real hub, run 08:45:41 UTC), cell 33_25:**
- cell list: 0.68 MW · 0.5 MW;
- the 0.5 MW record's FRP row: 0.5 MW;
- place view: FRP 0.68 MW · FRP 0.5 MW.

All three agree.

## 2. Sources & Details overflow (finding 2)
**Cause (measured on the live page at 360 px).** Page 1,371 px wide; `t-coverage` 1,351 px; one rules table 1,309 px. Two causes:
- **Evidence codes are single unbroken strings**, terms joined by `;` and `_` with no spaces. The longest is ships' 139 characters. A DOI URL is another.
- **The label column is `nowrap`.** About 167 px of a 360 px screen.

**Also found:** on main the long code overflows **at 1280 px too** (main's guard run below).

**Fix (no text changed, nothing clipped):**
- CSS: table cells may break a long token only where it would otherwise overflow (`overflow-wrap:anywhere`). Below 720 px the label column wraps at spaces and never inside a word (`overflow-wrap:normal`), and table text is 13 px.
- Sources renders the coverage and rules values through `brk()`, which inserts `<wbr>` break hints after each `;` and `_`. Codes wrap between terms and the text is unchanged.
- A contained horizontal scroll was not needed and is not added.

**Live check (candidate, real hub, 360 px):**
- page 360 px wide (was 1,371); widest table 340 px;
- no visible label split inside a word;
- ships' full code present;
- 139 break hints placed.

Visually, labels read whole ("Earthquakes", "Fire detections") and codes break at their separators.

## 3. Desktop place panel (finding 3)
**Cause.** The place view used the inspector's two-column grid (label | value) in the 400 px panel. Descriptions got ~131 px.

**Fix.** The place view (`.inspector.placeview`) stacks each label above its description at every width, which phones already did. Record and cell panels keep two columns.

**Live check (candidate, 1280×900, cell 33_25):** every description 366 px wide (was ~131); labels above descriptions.

## 4. Buoy collection wording (finding 4)
Sources & Details, Drifting buoys, Collection paragraph:
- **Was:** "…and keeps one current snapshot only."
- **Now:** "…and publishes one current snapshot, which replaces the previous one on the globe. What the hub retains beyond that is stated, from the hub's own report, in What Mother Earth keeps." (linked to `#kept`).

The new wording stays true whether history collection is on or off. Retention itself is unchanged. No other Sources paragraph makes a "keeps … only" claim (searched).

## 5. Tests
**New: `phase1/smoke-fixes.test.cjs`, 51 checks, 51 pass on the branch.**
- `ME.frp` on 11 values;
- the place view line;
- World View cell list, record detail and Highest FRP note on a fixture cell (5.8 · 2.33 · 0.8 · 0.4 · reported 0 · missing);
- place view at 1280 (description ≥ 300 px, stacked; cell panel still side by side);
- Sources at 360 and 1280 with the real long codes (no page overflow, tables inside the width, no label split inside a word, code text intact, break hints, buoy wording).

**Run against main: 33 of 51 fail.** That covers every finding, including Sources overflow at 1280. Main lacks `ME.frp`, so the formatter checks fail by construction; the browser checks fail on behaviour.

**Regressions on the branch:** see §6. Test-only adjustments made while writing the suite are fixes to the test itself, not to the page:
- the record header was never meant to carry FRP;
- the Highest FRP button sits in the collapsed Explore card;
- the "What Mother Earth keeps" table's first column is prose, not a label.

## 6. Regression results (branch)
*(filled in below when the run completes)*

## 7. Limits
- Emulated viewports in Chromium only; not a physical Galaxy or iPhone, and not Safari or Firefox.
- The live check used the 08:45 UTC run. No record with a reported 0 or a missing FRP was in it (0 and 0), so those two cases are covered by the fixture suite only.
- `overflow-wrap:anywhere` can break a long code inside a term when even one term is wider than its column. At 360 px none did, but a future longer term could.

## 8. For Chad
After GPT's review, the go is a fast-forward merge of `smoke-fixes` into main, which publishes the page (~1 min Pages build). I then hash-check the served files against the table above and repeat the live checks on the public page.
