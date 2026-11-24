# Nature context — Stage 0 assessment and Stage 1 preview plan (rev 2)

**Rev 2, 24 Nov 2026 (clock reading in STATUS). Docs only.** Rev 1 (`318899f`, sha256 `65bdf957…4eef9`) was reviewed by GPT: findings accepted, targeted rev 2 required before the Stage 1 plan is build-ready (`reviews/2026-11-24-nature-context-stage0-gpt-review.md`, 13,579 B, sha256 `8d2f375d2aa674550823a4c70d586b9b67bb3bc76f0bf2b2612dedd9d0a25ef3`, filed unchanged from `~/Documents/ChatGPT/Mother Earth/NATURE-CONTEXT-STAGE0-REVIEW-2026-11-24.md`). Spec: `docs/concepts/NATURE-CONTEXT-SPEC-GPT-rev1.md` (sha256 `68a0fc4f…3ce7`). Evidence: `docs/research/NATURE-CONTEXT-STAGE0-2026-11-24.md`. Baseline: main `80d1d64`, hub 0.6.24 (= main's `phase1/worker.js`), live page merge `7c94f89`.

**Chad, 24 Nov (his own message):** Stage 0 findings accepted; he supports improving the existing panel, correcting the wording together, and a provisional four-day cell-age warning; three corrections (no wholesale `BASE_MAIN` move; no fixed "7–10 days"; "queries retained" counts daily snapshots); soil C1 merits further assessment but stays separate and uncleared; global alerts can wait.

**Not authorised by this document:** any build, branch, page or hub change, R2 write, schedule, REGISTER filing, provider contact, soil download, or spending. A branch build needs Chad's go; a page release needs a reviewed candidate and Chad's own Approve line.

## What changed from rev 1

| # | From | Rev 2 |
|---|---|---|
| A | GPT, Chad: no fixed "about 7–10 days"; no end date derived from a version name | Window = "first detected on or after <since>, as held in version <id>, queried <time>". No end date, no range promise (§3.1) |
| A | GPT: a whole-layer total mixes cells with different filters, versions and times | Card and report say it is a sum across cells with their own windows, versions and query times; no common interval (§3.2) |
| A | GPT: missing or invalid `since`, unresolved version | Named as unknown provenance; never filled from the envelope (§3.1; fixtures F9, F10) |
| A, N3 | GPT: don't leave known-wrong wording under a "hub wording" label | Page-owned corrected forest Quantity, Window and Cadence; every surface that printed the hub string covered (§3.3) |
| A | GPT: dated REGISTER correction, history kept | A dated correction line appended to the GFW entry (§3.3) |
| B | GPT: freshness separate from validity and coverage; threshold edges; bad timestamps; `ok` with `source_status: down` | §3.4; fixtures F4–F8, F12–F15 |
| C | GPT: unknown confidence key; don't call the count an all-category total | Unrecognised category listed; total qualified (§3.5; F11) |
| C | GPT, Chad: `forest_daily` keeps at most one row per cell per UTC day (`PRIMARY KEY (cell_id, date)`, `INSERT OR REPLACE`) | "Queries retained" → "daily snapshots retained" (§3.5) |
| D | GPT, Chad: no blanket `BASE_MAIN` advance | Exact per-file scope and a narrow Animals exception (§4) |
| — | Found while writing rev 2 | The hub `quantity` string also reaches the Sources "Measures" table and the rules list through `R.forest.quantity`; `R.forest.unit` and `R.forest.window` repeat the "7 days" wording. All are in `app.js` and covered by §3.3 |

## 0. Bottom line

1. Most of Workstream A is already live in the "Everything here" panel. Stage 1 corrects and completes it: no new section, tab or switch.
2. "Published in the last 7 days" is wrong. The hub counts pixels first detected on or after each cell's `since` (GNW's integrated date is the earliest detection date), as held in the version answered. GPT confirmed this (G1).
3. No GNW fire ingestion. GNW's fire alerts are FIRMS VIIRS, the same lineage as our fires layer. The API copy's latest versions, `v20250424` and `v20250425`, are a dated observation of that one delivery path, not a claim that GNW stopped it.
4. Soil C1 (Glen et al. 2026, Zenodo 22137130) is a credible candidate for a dated, modelled exception; a bounded methods and aggregation assessment is possible later on Chad's go (§5). Not part of Stage 1.
5. Global integrated disturbance alerts: parked (Chad, 24 Nov).

## 1. What exists (code at `80d1d64`; live read on hub 0.6.24, rev 1 evidence)

| Spec asks (§4) | Live today | Gap |
|---|---|---|
| Counts and confidence groups for the containing 4° cell | Place row and cell inspector | Place row lacks "containing 4° cell" |
| Query window, query time | Place row: "published in the 7 days from <since> · queried <time>"; inspector: "alerts dated from <since> · dataset <version>" | Wording wrong; version missing from the place row |
| Coverage status | `partial` per cell; `not_covered`; `pending` | Place row does not print the grade |
| Freshness | Place row "stale" from the envelope's `retrieved_at` | A cell's own query age is never judged |
| Collection record | "N queries of this cell retained (first to last)" | It counts daily snapshots, not queries |
| Fire detections for the cell | FIRMS records and the "not 'no fires'" sentence | Adequate |
| No precise marker | Whole cells only | None |

## 2. Findings (rev 1 F1–F6, as accepted)

- **F1.** `gfw_integrated_alerts__date` is the earliest detection date (dataset cautions); the `fields` record gives it no description. No publication, update or confidence-change time is supplied per pixel; version metadata describes the whole version, not a per-pixel publication time.
- **F2.** Each cell has its own `since`; a timed-out retry keeps its first `since` and no maximum retry age is enforced, so a window can be any length. The query has no upper date bound.
- **F3.** Integrated confidence values are nominal, high, highest; there is no "low". The hub keeps an unexpected key on the cell but sums only the three into `count`.
- **F4.** We hold aggregates. Each query re-reads every pixel first detected on or after `since` at its current confidence; pixels first detected earlier drop out whatever their later confidence; removed pixels disappear. No alert history, deduplication or confidence transition is implied.
- **F5.** One fire source: FIRMS.
- **F6.** Main equals the deployed hub 0.6.24; `docs/HUB-DEPLOY-RULE.md` governs deploys.

## 3. Stage 1 — fixture preview (page only)

**Where:** the "Everything here" panel (`ME.placeRows`, `app.js`), the forest cell inspector (`inspectCell`, `index.html`), the forest card's value line (`index.html`), the readings and report (`R.forest`, `ME.report`, `app.js`, shared by both pages), and the forest paragraph on Sources (`sources.html`). No new section, tab, switch or layer change; viewing turns nothing on. **No `style.css` change**: existing classes only.

### 3.1 The forest row in the place panel (wording for GPT to test)

> **Forest disturbance · containing 4° cell** — <N> alert pixels (10 m) first detected on or after <since>, as held in version <vYYYYMMDD>, queried <time> (<age> ago) · nominal <n> · high <n> · highest <n> · coverage partial
> <span class="q">Pixels, not hectares or a trend. First detection is not the date of clearing. Confidence can rise, or an alert can be removed, after this query; when confidence changed is not supplied by the source.</span>

- **Age warning:** if the cell's `queried_at` is more than 4 days before the page clock: "· **older than 4 days**: this cell was last queried <time>". Exactly 4 days is not old. The cell's age is always printed, warning or not.
- **Layer run state, separately:** if the forest envelope is stale or its `source_status` is `down` while the cell is present: "the latest forest run (<time>) did not succeed; this cell's value is from its own query at <time>". The cell's value and time are never changed.
- **Valid zero:** "0 alert pixels first detected on or after <since>, as held in version <id> — no matching alert pixel was returned within the contributing systems' monitored tree-cover and forest masks for this filter. Not proof that nothing was disturbed, and not complete monitoring of the cell." Coverage stays "partial". (GLAD-L's mask is described by GNW as year-2000 tree cover with stated gain areas added and loss areas excluded; the row does not simplify it to "2000 forest".)
- **Unknown provenance:** `since` missing or not a real calendar date → "first-detection start date not recorded"; version `latest` or missing → "dataset version not resolved". Never filled from the envelope's `window_start` or `window_end`.
- **Outside coverage** (e.g. Cape Town's cell `14_49`): "not covered — the alert systems run between 30°N and 30°S; within that band, latitude alone does not make a cell monitored forest".
- **Pending:** "in the sweep, not answered yet". The hub's `/place` answer carries no first-asked time for a pending cell (it is kept in R2 state only), so the page adds none.

### 3.2 Card and report (whole layer)

- Card value line: "alert pixels (10 m) · first detected in each cell's own window" (was "published in the last 7 days").
- Report: "<N> forest-disturbance alert pixels summed across <k> cells, each counted from its own first-detection date at its own query time (dataset versions <list>); not one common period and not a trend (Global Nature Watch integrated alerts; …)". No earliest-since/latest-version pair is printed as an interval.

### 3.3 Quantity, Window, Cadence, Sources, REGISTER, hub string

- **One page-owned description for forest**, set in `R.forest` (`app.js`) so it reaches every surface that printed the hub's string or the old wording — the Sources "Measures" table, the rules list, the cell inspector's Quantity row (`index.html`, which reads the snapshot directly and is changed to use the page's text for forest):
  - Quantity: "10 m alert pixels first detected on or after each cell's own date, as held in the dataset version named for that cell, grouped by GNW confidence (nominal · high · highest); pixels, never hectares or a trend; first detection is not the date of clearing."
  - Window: "each cell from its own first-detection date (normally 7 days before its scheduled query; a retried cell keeps its first date); no common period across cells".
  - Cadence: "6 cells per run, two runs an hour; about two days for all 559 cells when every query answers; retries lengthen it".
  - Value, coverage, query time, version, caveat and source-link rows are kept as they are.
- **Sources paragraph:** "published in the 7 days before each cell's query" → "first detected on or after each cell's own start date (the integrated layer keeps each pixel's earliest detection date), as held in that query's dataset version". The sweep sentence follows the Cadence text above.
- **REGISTER:** a dated correction appended to the GFW entry, in the page release, on Chad's line: "Correction, <date>: the page label 'published in the last 7 days' above described the window wrongly. The query (`gfw_integrated_alerts__date >= since`) counts pixels first detected on or after each cell's own date; the dataset cautions describe that date as the earliest detection. The page now says so." The 1 Nov sample and the original line stay as written.
- **Hub `quantity` string** (`phase1/worker.js`): still says "published". Recorded for the hub owner's next reviewed hub change. **No hub deploy for this**, and none during an Earth from Space trial window. After Stage 1 the page prints the page-owned text for forest instead of that string everywhere.

### 3.4 Freshness (separate from validity and coverage)

- Three ages, never merged: the **cell's query age** (`queried_at`), the **layer run age** (envelope `retrieved_at`, the existing stale rule), and the **dataset version** (named as given, not converted to a date).
- Warning when the cell's query age is strictly more than 4 × 86,400 s. Missing or malformed `queried_at`, or one more than 5 minutes ahead of the page clock (the project's existing future-skew tolerance, from the Kp rule), → "query time unknown", never fresh.
- The nominal sweep (559 cells, 6 per run, two runs an hour, about 47 h) assumes every query answers; repeatedly pending cells use the run's slots. Four days is a provisional display threshold (Chad, 24 Nov), not a provider guarantee and not a refresh promise; the page does not present it as either.
- Coverage "partial" is printed whatever the age or count.

### 3.5 Confidence categories and the collection line

- A confidence key other than nominal, high, highest is listed as "unrecognised category '<key>': <n>", and the total is qualified: "<N> across the three known categories; the unrecognised category is listed separately and not included". No hub change: whether a later hub should count unknown values is left until their meaning and numeric form are known.
- Collection line: "<n> daily snapshots of this cell retained, <first> to <last> (at most one per UTC day: the day's latest answered query)". Nothing implies every query, pixel history or confidence tracking.

### 3.6 Fixtures (no live GNW or hub request; `page.route()` for `/place/g4/*` and `/cells/forest`; fixed test clock)

| | Case | Shape |
|---|---|---|
| F1 | ok | `21_29`: 199,592 (198,963 / 95 / 534), `since` 2026-11-16, v20261123, queried 2026-11-23 09:42 UTC |
| F2 | valid zero, partial coverage | `15_49`: 0 / 0 / 0, `since` 2026-11-15, v20261122 |
| F3 | outside coverage | `14_49` (Cape Town), `not_covered` |
| F4 | age just below 4 days | `queried_at` = clock − 4 d + 1 s → no warning |
| F5 | age exactly 4 days | clock − 4 d → no warning |
| F6 | age just above 4 days | clock − 4 d − 1 s → warning |
| F7 | `queried_at` missing / malformed | "query time unknown" |
| F8 | `queried_at` more than 5 min in the future | "query time unknown" |
| F9 | `since` missing / invalid date | "first-detection start date not recorded" |
| F10 | version `latest` / missing | "dataset version not resolved" |
| F11 | unknown confidence key, one non-zero, one zero | both listed; total qualified |
| F12 | cell present, `state: ok`, `source_status: down` | cell value and time kept; run-failure clause shown |
| F13 | layer down, no cell | unknown, never zero |
| F14 | prolonged retry, then answered | cell `since` 20 days before its `queried_at`: the row prints that `since`; no "7 days" anywhere |
| F15 | fresh envelope, old cell | layer not stale; cell warning shown |
| F16 | hub unreachable | the existing "nothing is shown rather than a guess" |
| F17 | FIRMS down beside forest ok | each layer keeps its own state |

### 3.7 Checks

- New suite `phase1/nature-context-ui.test.cjs`: F1–F17 across the panel, inspector, card, report, rules list and Sources; breaks that restore each old phrase ("published in the 7 days", "published in the last 7 days", "queries of this cell retained", the envelope-only stale check for forest, the hub Quantity string) must each fail. Run it against the current page first: the new checks must fail there.
- Existing suites rerun: `place-rows`, `place-ui`, `fire-status-ui`, `cell-perf-ui`, `smoke-fixes`, `freshness-wording-ui`, `legend-active-ui`, `ux-round1`, `search-ui`, `layer-switches-ui`, `hub-alignment`. Any assertion of the old wording is updated in the same reviewed commit and listed in the packet.
- Keyboard and focus in the panel; no horizontal overflow at 360 px (text-node boxes, as `smoke-fixes` does).
- Real phone, Safari and screen reader: unverified unless actually done.

## 4. Shared files and the Animals suite (exact scope)

**Files Stage 1 changes:** `app.js`, `index.html`, `sources.html` (page; `app.js?v=` bumped in the two pages that load it, `index.html` and `sources.html`); the new suite and any updated assertions in existing suites (tests); `REGISTER.md` (one appended line, release only). **Not changed:** `style.css`, `phase1/worker.js`, `timeline.*`, `animals*`, `moon.html`, `sun.html` and every other page file.

**What `animals-tab-ui` checks today:** `index.html` (13b), `app.js` (13c, the `same` list) and `sources.html` (13e) are compared with main at `BASE_MAIN` `0e62083`, after the Animals links (and for Sources the Animals section) are subtracted. A Stage 1 page commit H fails 13b, 13c and 13e, as it should.

**Narrow exception, proposed to the Animals owner after H is reviewed (not a `BASE_MAIN` move):**
- A pin `NC_MAIN` = H, under the rule `TL_MAIN` has: only a Nature context release moves it, in the commit that records the release.
- 13c: `app.js` leaves the `same` list and gets its own check, byte-identical to `app.js` at `NC_MAIN`. The other 15 files stay on `BASE_MAIN`.
- 13b (`index.html`) and 13e (`sources.html` only): either (i) keep the `BASE_MAIN` comparison and subtract exactly the hunks of `git diff <parent of H> H` for that file, or (ii) byte-identical to the file at `NC_MAIN`, plus a header check like 13h so the Animals-link guarantee stays. The owner chooses.
- A new check: `NC_MAIN` ≠ `BASE_MAIN`, and `git diff --name-only <parent of H> H` lists only the files above.
- Unchanged: 13a, 13d (stylesheet), 13f–13i (Timeline), moon.html and sun.html in 13e, and every other check.

**Order:** preview on branch `nature-context-rc` from current main (the Animals suite fails 13b, 13c, 13e there by design; the packet says so) → GPT → for a release: Chad's go → the Animals owner's test-maintenance commit with the exception, reviewed → merge on fresh main → rerun the affected suites on the merged tree before the push → Chad's Approve line → push → served hashes and live read.

## 5. Soil carbon C1 — separate, uncleared

A credible candidate for a dated, modelled exception (GPT). Not in Stage 1. If Chad wants it, the next step is a bounded methods and aggregation assessment, docs only, which must:
- aggregate as F(C) = Σ F(i) × area(C ∩ i) / area(i), intersections in the documented equal-area CRS (+proj=cea +lat_ts=30), from native 1 km COG cells, never display overviews; no second multiplication by organic-soil percentage; partial-pixel weighting assumes uniformity within a 1 km cell and does not recover 30 m detail;
- keep periods and components (drainage, fire) separate; show the latest period as 2021–2024 annual averages, not a 2024 observation; never divide annualised values again; never add totals to component gases;
- track available and missing area per 4° cell: an all-missing cell is unknown; a partly missing cell is a sum over available model pixels and says so; model-assigned zeros are not a claim of no real flux; no claim about the reason for a local zero (there is no 1 km state layer);
- measure windowed transfer, disk and memory before choosing an architecture: the declared grid (34,736 × 14,686 Float32) is about 2.04 GB per uncompressed array, about 20.4 GB for ten (arithmetic, not measured); the 213 MB archive is compressed;
- test conservation (cell sums against raster sums), edges and no-data; country tables need not equal raster sums;
- read `state_codes.csv` in full and the paper's methods before any reader-facing claim;
- never set historical fire emissions beside today's FIRMS detections as a cause; the paper's scenario envelopes are not local confidence intervals.
No archive download, derivative, pin, hub route or card is cleared.

## 6. Decisions

- **N1.** Improve the existing panel. **Decided (Chad, 24 Nov).**
- **N2.** Correct every misleading page, report and Sources surface together, with the dated REGISTER correction. **Decided (Chad, 24 Nov).** The release still needs its own reviewed candidate and Approve line.
- **N3.** A page-owned corrected Quantity for forest (GPT's preferred option). *Recommended.*
- **N4.** Four-day cell-age warning, provisional, actual age always shown. **Decided provisionally (Chad, 24 Nov).**
- **N5.** Soil C1: a bounded methods and aggregation assessment (§5), docs only, if and when Chad wants it. Nothing else cleared.
- **N6.** Global integrated disturbance alerts: parked (Chad, 24 Nov).
- **N7 (new).** The go for the Stage 1 branch build per §3 and §4: branch `nature-context-rc`; no merge, no hub change, no REGISTER filing.

## 7. Questions for GPT on rev 2

- **G7.** Does the §3.1 window statement, with no end date and "unknown provenance" for a missing `since` or version, meet correction A?
- **G8.** Is the §4 exception narrow enough, and which form should 13b and 13e use: subtracted hunks (i) or byte-identical at `NC_MAIN` plus a header check (ii)?
- **G9.** Is the 5-minute future-skew tolerance (from the Kp rule) acceptable for forest `queried_at`?
- **G10.** Is any fixture missing from §3.6 for acceptance criteria 2–5?
