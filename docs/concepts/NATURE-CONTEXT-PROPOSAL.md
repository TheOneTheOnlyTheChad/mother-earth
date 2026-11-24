# Nature context — Stage 0 assessment and Stage 1 preview plan (rev 1)

**24 Nov 2026 (07:10 UTC clock reading). Docs only.** Written on Chad's "go" for Stage 0 of GPT's spec `docs/concepts/NATURE-CONTEXT-SPEC-GPT-rev1.md` (rev 1, 23 Nov 2026; filed unchanged, sha256 `68a0fc4f29cc40837d1858bc0cbe465853afad9b0bf9635e1b128da418943ce7`). Evidence: `docs/research/NATURE-CONTEXT-STAGE0-2026-11-24.md`. Baseline: main `2ed3f58`, hub 0.6.24 (= main's `phase1/worker.js`), live page merge `7c94f89`.

**Not authorised by this document:** any build, branch, page or hub change, R2 write, schedule, REGISTER filing, provider contact, download of the soil dataset, or spending. Chad owns and approves; Claude implements; GPT reviews.

## 0. Bottom line

1. **Most of Workstream A is already live.** The "Everything here" panel (`/place/g4/<cell>`, page `openPlace` → `ME.placeRows`) already lists, for one 4° cell, forest-disturbance counts by confidence with the cell's own query time, fires for the cell with the FIRMS caveats, and how many forest queries of the cell we keep. It already says "Listed together because they share this 4° cell. Nothing here states a connection between them." The smallest useful slice is to **correct and complete what is there**, not to build a new section.
2. **The forest window is described wrongly on the live site.** The query counts pixels **first detected** on or after each cell's `since` date (GNW: each pixel keeps its earliest detection date), at the confidence they hold in that day's version. The page, the report line, Sources, the hub's `quantity` string and REGISTER say "published in the last 7 days". Measured today, cells' windows start 14–17 Nov and run to their version's date (7 to 10 calendar days, depending on the cell), so "7 days" is also not exact.
3. **No GNW fire ingestion.** GNW's fire alerts are NASA FIRMS VIIRS (VNP14IMGT), the same lineage as our fires layer, and the Data API copy stops at `v20250425`.
4. **One soil-carbon candidate is concrete and open:** Glen et al. (2026) model outputs (Zenodo 22137130, CC BY 4.0) — **modelled** emissions from drained or burned organic soils, five period averages 2001–2024, 1 km maps (213 MB zip). It is dated and modelled, so it needs Chad's decision on an exception to the live-feed rule before any preview.
5. **New since the 1 Nov collector:** GNW's global integrated disturbance alerts (`gfw_integrated_dist_alerts`, daily, 10 m, global, four systems). It would make cells outside 30°N–30°S answerable, Cape Town's included. Not assessed; a hub change; not in the first slice.
6. **Recommended Stage 1:** a page-only fixture preview of the corrected forest and fire rows in the existing panel (§3). No hub change, no new provider request, no soil fixture yet.

## 1. What already exists (code read at `2ed3f58`, live read on hub 0.6.24)

| Spec asks (§4) | Live today | Gap |
|---|---|---|
| Forest counts and confidence groups for the containing 4° cell | Place row: count, nominal · high · highest; cell inspector: same, plus "highest = detected by more than one alert system" | The place row does not say "Containing 4° cell" beside the value |
| Query window and query time | Place row: "published in the 7 days from <since> · queried <time>"; cell inspector: "alerts dated from <since> · dataset <version>" | Wording wrong ("published", "7 days"); end of window (version date) not stated |
| Source dataset/version | Cell inspector only | Missing from the place row |
| Coverage status | Hub: `partial` per cell, `not_covered` outside the 559 cells, `pending` while unanswered | Place row does not print the grade; `not_covered` and `pending` are worded |
| Fire detections, period, scope, FIRMS caveats | Place row: records for the cell with the "not 'no fires'" sentence; window is "so far today (UTC)" | Adequate; the panel does not repeat FIRMS's "not unique fires" wording for a count |
| Loading / available / partial / stale / unavailable / outside coverage | All states exist in `ME.placeRows` | **Stale is judged on the envelope, not the cell**: an envelope 25 min old can carry a cell queried three days ago without a stale mark |
| Retained data keeps its timestamp after a failed refresh | Forest state keeps each cell's last answer with its own `queried_at` | Adequate |
| Zero only where valid | Hub sends 0 only for an answered cell; `not_covered` and `pending` never become 0 | Wording of a valid zero is the generic count; it does not say what a zero covers (alert masks; one or two systems) |
| No precise marker at the point or cell centre | Forest draws whole cells only, no point | None |

**Shared-file consequence:** any change to the place row is in `app.js`; a card or Sources change is in `index.html` / `sources.html`. The Animals suite `animals-tab-ui` holds `app.js` and `index.html` to main at `BASE_MAIN` `0e62083` (check 13b and the `same` list). A page release of this work therefore needs the Animals owner to move `BASE_MAIN` in a test-maintenance commit after a reviewed page commit, the same way `TL_MAIN` moved for the Timeline (GPT's rule of 24 Nov: never move a pin to hide an unrelated change).

## 2. Findings that change the spec

- **F1. Date semantics (spec §2, §5).** `gfw_integrated_alerts__date` is the earliest detection date from any system. The source supplies no publication time, update time or confidence-change time. So the rows say "first detected", name the version, and say "confidence-change time: not supplied by the source". No ingestion change is needed for that.
- **F2. Per-cell window.** Window = `since` (the cell's, which a timed-out retry keeps) to the version's content date. Live: `since` 14 Nov (2 cells), 15 Nov (181), 16 Nov (292), 17 Nov (84); versions v20261121–v20261123. The page should print each cell's own window, never a single "last 7 days" across cells. The report line sums cells with different windows and calls it "the last 7 days"; it should say "across N cells, each over its own window (first detected from <earliest since> to <latest version>)".
- **F3. Confidence labels.** The integrated layer has exactly nominal (2), high (3), highest (4); "not detected" is the default. There is no "low". The hub drops an unknown label from the total silently (it is kept on the cell, but `total` adds only the three). Proposal: a later hub change makes the total include every label and lists any unexpected one; Stage 1 fixtures include an unknown label so the page shows it as unknown rather than ignoring it.
- **F4. Late upgrades and the lookback (spec §5, acceptance 5).** EarthRanger's gap is a create-once event pipeline. Ours re-reads all pixels first detected in the window at each query, so an upgrade inside the window shows on the next query; a pixel first detected before `since` drops out whatever its later confidence, and a removed pixel disappears. We hold aggregates only, so the page must not imply alert history, deduplication or confidence transitions. Each retained query in D1 `forest_daily` is one dated snapshot of that cell, not a history of pixels.
- **F5. Fires.** One fire source: FIRMS. The double-count rule is that GNW fire alerts are never added.
- **F6. Baseline line in the spec is out of date.** Main has equalled the deployed hub (0.6.24) since the hub-to-main landing on 23 Nov; `docs/HUB-DEPLOY-RULE.md` governs any deploy.

## 3. Stage 1 — fixture preview plan (page only)

**Where:** the existing "Everything here" panel and the forest cell inspector. No new tab, no new switch, no layer turned on by viewing (spec §4; bare-start stays).

**Rows proposed (wording for GPT to test):**
- Forest disturbance — **Containing 4° cell:** "<N> alert pixels (10 m) first detected <since> to <version date> · nominal <n> · high <n> · highest <n> · coverage partial · version <vYYYYMMDD> · queried <time>". If the cell's query is older than a set limit: "· <b>older than <limit></b>: this cell was last queried <time>". Then one line: "Pixels, not hectares or a trend; first detection is not the date of clearing; confidence can rise or the alert can be removed later; when confidence changed is not supplied by the source."
- A valid zero: "0 alert pixels first detected <since> to <version date> in this cell, inside the alert systems' forest masks — not a statement that nothing was disturbed."
- Outside coverage (e.g. Cape Town's cell `14_49`): unchanged meaning, "not covered — the alert systems run between 30°N and 30°S".
- Fires — the existing row, plus for a count "detections, not unique fires" (FIRMS caveat kept).
- Card, report line, Sources, cell inspector: "published in the last 7 days" → "first detected in each cell's own window (about 7–10 days)".

**Fixtures (no live request; `page.route()` of `/place` and `/cells/forest`):** ok (`21_29`, 199,592 pixels, `since` 16 Nov, v20261123); valid zero (`15_49`); outside coverage (`14_49`); pending; a cell with `since` 14 Nov (window longer than 7 days); a stale cell (query older than the limit with a fresh envelope); an unknown confidence label; hub unreachable; FIRMS down beside forest ok; envelope `down` with no cells.

**Checks:** the existing place suites (`place-rows`, `place-ui`, `fire-status-ui`, `cell-perf-ui`, `smoke-fixes`) plus a new `nature-context-ui` with breaks that fail on the old wording; keyboard and focus in the panel; no horizontal overflow at 360 px; `animals-tab-ui` on the integrated tree (expected to fail 13b/13c until its owner moves `BASE_MAIN`). Real phone, Safari and screen reader stay unverified unless done.

**Hub:** none in Stage 1. The hub's `quantity` string keeps the old wording until the next hub deploy (a separate Approve line, coordinated with the Earth from Space owner). Until then the page should not print the forest `quantity` string where it contradicts the corrected row (the cell inspector "Quantity" row), or should print it labelled as the hub's wording. Decision N3.

**Effort and cost:** page code and one suite; no new cost.

## 4. Soil carbon (Workstream B) — after Stage 1, only on Chad's decision

- **Candidate C1:** Glen et al. 2026, Zenodo 22137130 v1.0.1, CC BY 4.0. Modelled average annual emissions (Mg CO₂e per 1 km cell per year; CO₂, CH₄, N₂O at AR6 GWP100) from drained and burned organic soils, five periods 2001–2024. One static organic-soil cover map (2021–2024 mask).
- **Path if wanted:** download the 1 km zip once (213 MB; the workspace allowlist does not reach Zenodo, so through the browser pane to Chad's Mac), sum per 4° cell offline with an overlap rule, publish a fixed, hash-pinned catalogue (the Arts and Timeline pattern), served by a hub route. That is a hub change and an R2 write, each on its own Approve line. Storage: a per-cell table, a few tens of KB (to measure).
- **Must be shown:** "modelled, not measured"; the period; drainage vs fire; "blank is not zero" and "a Tier 1 zero is not an absence of flux"; no link to a current fire detection.
- **Not assessed:** mineral-soil stock change (ESSD 2026) and any stock product. A first preview uses one product only (spec §6).

## 5. Later work, unchanged in scope

- **Journey context (C):** separate proposal after the place preview; the 4° counts support regional context only; Animals files and decisions are that thread's.
- **Global disturbance alerts:** a bounded measurement (query time per cell for a global sweep, cell count, wording) as its own proposal if Chad wants Cape Town and the extratropics answerable.
- **Horizon / EarthRanger:** reference only. Horizon has no API; its AI summaries are not a source.

## 6. Decisions for Chad

- **N1.** Stage 1 as in §3 (correct and complete the existing panel), rather than a new "Nature context" section. *Recommended.*
- **N2.** The corrected wording goes on the live card, report line and Sources in the same page release as the panel change. *Recommended:* yes — the current wording is inaccurate today.
- **N3.** Until the next hub deploy: hide the forest `quantity` string in the cell inspector, or keep it labelled "hub wording (being corrected)". *Recommended:* hide it; correct it at the next hub deploy.
- **N4.** Stale limit for one forest cell. Nominal sweep: 559 cells at 6 per run, two runs an hour, about 47 hours; retries lengthen it, and today's oldest cell query was 67.9 hours old (21 Nov 11:12 UTC, read 24 Nov 07:06 UTC). *Recommended:* mark a cell queried more than 4 days ago as "older than 4 days"; 3 days would mark cells on an ordinary sweep.
- **N5.** Soil carbon: whether a dated, modelled exception to the live-feed rule is wanted for C1, after GPT has reviewed the product. No work until then.
- **N6.** Whether to commission the global disturbance alerts measurement later.

## 7. Questions for GPT

- **G1.** Does F1's reading of `__date` (earliest detection, from the dataset `cautions`) and the absence of publication or confidence-change times match your reading of the provider's documentation? Is there a GNW page that defines the field more directly?
- **G2.** Is "first detected <since> to <version date>" the right window statement, given that the version's content date bounds the data and our query has no upper bound?
- **G3.** Is the proposed zero wording ("inside the alert systems' forest masks") accurate for GLAD-L's 2000 tree-cover mask, given that cells near 30°S are mostly treeless?
- **G4.** Is a 4-day per-cell stale limit (N4) defensible, or should the limit follow the window (a cell whose window no longer overlaps the last 7 days)?
- **G5.** For C1: is a 4° cell sum of 1 km Mg CO₂e values, with an overlap weight, a defensible downsampling, and which of drainage, fire or their sum should a first card show?
- **G6.** Anything in §1 where the existing panel already fails the spec's acceptance criteria that this plan misses?
