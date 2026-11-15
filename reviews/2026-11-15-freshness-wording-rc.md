# freshness-wording-rc — review packet (round 1)

15 Nov 2026 · branch `freshness-wording-rc` from main `df8f2fe` (after merge `2b94823`) · page only · not merged · for GPT
Proposal: `docs/concepts/FRESHNESS-WORDING-PROPOSAL.md` rev 2 (§6 governs). Chad's go: "Go: build freshness-wording-rc on a branch per FRESHNESS-WORDING-PROPOSAL rev 2 (§6 governing; page only; no merge)".

## 1. What changed

| File | Change |
|---|---|
| `app.js` | `ME.stateWord`: an adequate Kp, CO₂ or Sea ice reads "fresh copy". New `ME.longDate`, `ME.valueFor`, `ME.freshTip`. Sea ice reading carries both hemisphere dates (`dateS`, `datesDiffer`); its description and the report name both when they differ. Ships reading gains `retrievedAge` (only for an actual sample with a readable `retrieved_at`). |
| `index.html` | Badge tooltip uses `ME.freshTip` for an adequate dated index. Ships source line: "aisstream.io · retrieved N ago · …". `app.js?v=202612021000`. |
| `sources.html` | `app.js?v=202612021000` only. |
| `phase1/freshness-wording-ui.test.cjs` | New suite. |

No hub file, schedule or REGISTER change. `style.css` unchanged: the longer badge fits.

## 2. Rules as built (§6)

- **Badge:** "fresh copy" for adequate Kp, CO₂ and Sea ice, with the same colour class as before. Earthquakes, fires and ships keep "current"; microplastic keeps "loaded"; degraded and unknown wording is unchanged. Because the word comes from `ME.stateWord`, the report's states and the Sources page rows change with it.
- **Tooltip:** "Our copy was retrieved 52 min ago. This value is for 13 November 2026."
  - Kp: "…This value is for the interval 03:00–06:00 UTC on 15 November 2026." The date is the interval's start date.
  - Sea ice, dates differ: "…The Arctic value is for 13 November 2026; the Antarctic value is for 12 November 2026."
  - Unreadable date or time: "The date of this value was not supplied." / "The interval of this value could not be read." No date is guessed, and dates are formatted from the source's own text with no time-zone conversion.
- **Card:** the observation line and "retrieved N ago" line stay. Sea ice with different dates reads "daily extent: Arctic for 2026-11-13, Antarctic for 2026-11-12 (~1 day latency)".
- **Report and Sources:** sea ice with different dates reads "sea ice: Arctic 8.95 M km² on 2026-11-13, Antarctic 15.02 M km² on 2026-11-12 (NSIDC; …)"; the Sources row shows the same description and "fresh copy — retrieved …".
- **Ships:** "retrieved N ago", never "received". Shown for an adequate and for a stale real sample; omitted for a down run and for an unreadable timestamp. The sample end stays on the description line.

## 3. Tests (workspace, software rendering, real fonts, 15 Nov)

`freshness-wording-ui`: **63 passed, 0 failed.** Fixtures use the live hub's envelope shapes (read from the live page, 08:44 UTC).

- All three indices adequate: badge, colour class, report state, tooltip text, card lines kept.
- Sea ice with different hemisphere dates: tooltip, card, report, Sources row.
- Degraded Kp, down CO₂, stale Sea ice: wording unchanged.
- Unreadable CO₂ date, Kp time and missing Antarctic date: plain sentences; no "undefined", "NaN" or "Invalid".
- Ships: adequate, stale, down, unreadable timestamp.
- Layout at 1280, 1101, 721 and 390 px: "fresh copy" stays on one line, clear of the card title, inside the card.
- Cache key identical on both pages.

Breaks, each fails as it should: `word-current` 21 failures · `no-tip` 7 · `one-ice-date` 1 · `ships-received` 4 · `ships-age-always` 2.

Regression, all pass with **no expectation changes** (no existing suite asserted "current" for an index): `quakes-ships-status-ui` 124 · `fire-status-ui` 279 · `legend-active-ui` 548 · `fires-wording-ui` 35 · `mobile-pass` 131 · `drifters-ui` 25 · `plastic-ui` 29 · `place-ui` 30 · `search-ui` 104 · `kept-ui` 21 · `buoy-temp-ui` 33 · `desktop-overflow` 258 · `cell-perf-ui` 43 · `ux-round1` 34 · `status-notes-ui` 17 · `terminator-ui` 19 · `dustrgb-ui` 67 · `backdrop-layer` 27 · `orbital-browser` 113 · `arts-ui` 90 · `sky-ui` 79 · node suites `kp-degraded` 29, `place-rows` 7, `buoy-temp` 37.

Still failing, same as on main: `osmc-reliability-ui` "old page: no page errors"; `smoke-fixes` "Sources 360" overflow. Not run: `sky-zoom-ui`, `terminator-behaviour`, `oceanheat-ui`.

## 4. Points for GPT

1. **Stale ships repeats the age.** With a stale real sample the line reads "aisstream.io · retrieved 4.0 h ago · … · current positions unknown — last sample is over 3 h old (4.0 h ago)". §6 says to omit the age only without a usable sample timestamp, so it is shown. Say if it should be dropped when the reason already carries it.
2. **Kp interval that crosses midnight** (21:00–00:00) is dated by its start: "…interval 21:00–00:00 UTC on 14 November 2026."
3. **The page's search and inspector also use `ME.stateWord`**, but only for record layers, so nothing there changes.

## 5. Not tested

Real phone, Safari, screen reader (tooltips are `title` text), real GPU, the live page. Sea ice with different hemisphere dates has not been seen on production.

## 6. Release steps, if GPT passes (on Chad's own line)

1. Merge `freshness-wording-rc` to main (page change).
2. Served-hash check of `index.html`, `app.js`, `sources.html`; live read of the three index cards and the Ships line.

Rollback: revert the merge commit.
