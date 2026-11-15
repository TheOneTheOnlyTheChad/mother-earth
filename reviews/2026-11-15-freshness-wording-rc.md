# freshness-wording-rc — review packet (rev 3; §7 = round 2, §8 = round 3)

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

## 7. Round 2 (15 Nov 09:57 UTC): GPT's hold for timestamp handling

GPT (relayed by Chad): the three indices say "Fresh copy" and valid split sea-ice dates appear correctly in the shared report; hold for two edge cases. GPT reproduced "Antarctic … on undefined" on the card and report with no Antarctic date (the Sources row inheriting it), the same for a missing CO₂ date, 2026-02-31 becoming "31 February 2026", and "Our copy was retrieved NaN h ago" still earning "Fresh copy". On the packet's two questions: show the stale Ships age once, with the retrieval label; write the midnight Kp interval as "21:00 UTC on 14 November to 00:00 UTC on 15 November 2026". GPT's three Node suites passed independently (73 checks); GPT did not rerun the browser suite.

**Fix 1 — observation dates validated once, used everywhere.** New `ME.validDate`: a date is used only if it is a real calendar day written `YYYY-MM-DD` (day checked against the month's length). `ME.readings` validates CO₂ and both sea-ice dates once; the card, tooltip, report and Sources row all read that result.

| Input | Card and Sources row | Report |
|---|---|---|
| CO₂ date missing, a word, 2026-02-31 or month 13 | "daily mean; the date was not supplied (preliminary), Mauna Loa, Hawaii" | "CO₂ 428.88 ppm at Mauna Loa (date not supplied) (NOAA GML, …" |
| Sea ice, no or impossible Antarctic date | "daily extent: Arctic for 2026-11-13, Antarctic date not supplied (~1 day latency)" | "sea ice: Arctic 8.95 M km² on 2026-11-13, Antarctic 15.02 M km² (date not supplied) (NSIDC; …" |
| Sea ice, no Arctic date | "daily extent: Arctic date not supplied, Antarctic for 2026-11-12 (~1 day latency)" | mirrored |
| Sea ice, neither date | "daily extent: Arctic date not supplied, Antarctic date not supplied (~1 day latency)" | "sea ice (dates not supplied): Arctic …, Antarctic …" |

**Fix 2 — a readable retrieval time is required.** `ME.freshness` returns unknown with "the time our copy was retrieved could not be read" when `retrieved_at` cannot be parsed, so the badge is "unknown", never "fresh copy". `ME.ago` returns "at an unreadable time" in place of "NaN h ago", so the card line reads "… · retrieved at an unreadable time · the time our copy was retrieved could not be read". **This guard sits in the shared freshness rule, so it applies to every layer, not only the three indices** (an unreadable retrieval time could not honestly be "current" for earthquakes either). Say if it should be limited to the indices.

**GPT's two wording answers, applied.** Stale ships: "aisstream.io · retrieved 4.0 h ago · … · current positions unknown — last sample is over 3 h old; current positions unknown" (the age once, with the retrieval label; the report and tooltip keep their own single mention). Kp across midnight: "This value is for 21:00 UTC on 14 November to 00:00 UTC on 15 November 2026."; across a year end both years are named.

| Run | Result |
|---|---|
| `freshness-wording-ui` | **115 passed, 0 failed** (was 63): assertions now cover the card, report and Sources row for every bad-date case, the unreadable retrieval time for all three indices and ships, the single ships age, the midnight and year-end Kp intervals, and `ME.validDate` directly |
| New breaks | `no-date-check` (31 February passes) fails 11 · `nan-fresh` fails 8 · `ships-age-twice` fails 1 |
| Earlier breaks, rerun | `word-current` 21 · `no-tip` 14 · `one-ice-date` 1 · `ships-received` 4 · `ships-age-always` 2 failures |
| Regression rerun, all pass | `quakes-ships-status-ui` 124 · `fire-status-ui` 279 · `legend-active-ui` 548 · `fires-wording-ui` 35 · `mobile-pass` 131 · `drifters-ui` 25 · `plastic-ui` 29 · `place-ui` 30 · `search-ui` 104 · `kept-ui` 21 · `buoy-temp-ui` 33 · `desktop-overflow` 258 · `cell-perf-ui` 43 · `ux-round1` 34 · `status-notes-ui` 17 · `terminator-ui` 19 · `dustrgb-ui` 67 · `backdrop-layer` 27 · `orbital-browser` 113 · `arts-ui` 90 · `sky-ui` 79 · node `kp-degraded` 29, `place-rows` 7, `buoy-temp` 37 |
| Same as main | `osmc-reliability-ui` "old page" check; `smoke-fixes` "Sources 360" overflow |

Files changed in round 2: `app.js`, `index.html`, `phase1/freshness-wording-ui.test.cjs`, this packet, STATUS. The cache key is unchanged from round 1 (`202612021000`); nothing has been released under it.

**Not covered:** a sea-ice envelope with a whole hemisphere missing (no `south` object at all) is outside this change; the page's handling of that is as on main.

## 8. Round 3 (15 Nov 10:33 UTC): the Sources retrieval cell and the strict date form

GPT (relayed by Chad) on `4d3b4e8`: the original card and report failures are resolved; the Kp year boundary verified; keep the unreadable-retrieval guard shared across layers. Hold for one Sources-page fix: the Sources table formatted the raw retrieval value ("n/a UTC (at an unreadable time)"), and with `retrieved_at: {}` its renderer threw and stopped building the table. Also require the full `YYYY-MM-DD` form for CO₂ and sea ice (`2026-11-13-not-a-date` was accepted); Kp passes the date part of its normalised UTC timestamp. GPT's three Node suites passed again (73 checks); its Sources check ran the page renderer outside the browser.

**Fix 1 — one timestamp test for every printed retrieval value.** New `ME.stamp(v)`: text only when `v` is a string that parses to an instant, otherwise null (the same test `ME.freshness` applies).
- `sources.html`: the retrieval cell reads "Retrieval time unknown" when the value is present but unreadable; "–" when there is no snapshot; the real time otherwise. The table builds in full.
- `index.html`: the three inspector rows that formatted a raw `retrieved_at` ("This run" twice, "Retrieved") use `ME.stamp` too, so the same payloads cannot throw there.

**Fix 2 — strict date form.** `ME.validDate` matches the whole string `YYYY-MM-DD`; text after the day, a timestamp, or a leading space is not a date. `ME.kpIntervalLong` passes the date part of the normalised UTC instant.

**A fault of mine, caught by the suite before this commit:** my first edit of the validator put a comment mid-line and commented out three variable declarations; the page stopped loading and the suite timed out on its first case. Fixed; noted because a syntax-only check did not catch it.

| Run | Result |
|---|---|
| `freshness-wording-ui` | **156 passed, 0 failed** (was 115) |
| New cases | Sources with `retrieved_at` "n/a", `{}` and a number, for each of CO₂, Sea ice and Kp: the table keeps all its rows, no page error, the cell reads "Retrieval time unknown", every other row keeps its real time. World View with CO₂ `retrieved_at` "n/a" and `{}`: badge unknown, no page error. `2026-11-13-not-a-date` for CO₂ and for the Antarctic date: "not supplied" on the card, tooltip, report and Sources row. `ME.validDate` and `ME.stamp` checked directly. |
| New breaks | `raw-sources-cell` (round 2's cell) fails 21 · `loose-date` fails 9 |
| Earlier breaks, rerun | `word-current` 21 · `no-tip` 16 · `one-ice-date` 1 · `ships-received` 4 · `ships-age-always` 2 · `no-date-check` 11 · `nan-fresh` 19 · `ships-age-twice` 1 failures |
| Regression rerun, all pass | `quakes-ships-status-ui` 124 · `fire-status-ui` 279 · `legend-active-ui` 548 · `fires-wording-ui` 35 · `mobile-pass` 131 · `drifters-ui` 25 · `plastic-ui` 29 · `place-ui` 30 · `search-ui` 104 · `kept-ui` 21 · `buoy-temp-ui` 33 · `desktop-overflow` 258 · `cell-perf-ui` 43 · `ux-round1` 34 · `status-notes-ui` 17 · `terminator-ui` 19 · `dustrgb-ui` 67 · `backdrop-layer` 27 · `orbital-browser` 113 · `arts-ui` 90 · `sky-ui` 79 · node `kp-degraded` 29, `place-rows` 7, `buoy-temp` 37 |
| Same as main | `osmc-reliability-ui` "old page" check; `smoke-fixes` "Sources 360" overflow |

Test change: fixture ages are now measured from when each fixture is built, so "52 min ago" holds however long the suite has run (two checks drifted by a minute as the suite grew).

Files changed in round 3: `app.js`, `index.html`, `sources.html` (now more than the cache key: the retrieval cell), `phase1/freshness-wording-ui.test.cjs`, this packet, STATUS. Cache key unchanged (`202612021000`).

**Not changed:** `ME.hhmm` and `ME.when` still slice their argument and would throw on a non-string; they are fed record and place timestamps, not the retrieval values in this change. Named so it is not a surprise later.
