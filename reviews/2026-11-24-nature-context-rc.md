# Nature context — Stage 1 candidate (`nature-context-rc`), review packet rev 1

**24 Nov 2026. Branch only: nothing merged, deployed, uploaded or filed.** Built on Chad's own message of 24 Nov 2026 ("N3: yes / N7: yes"), after GPT's review of proposal rev 2 (`reviews/2026-11-24-nature-context-proposal-rev2-gpt-review.md`, 8,674 B, sha256 `9a39a8ce85775178c8e84166473d1b35ec053899882e3a4bcf22a77445aa94d1`, = `~/Documents/ChatGPT/Mother Earth/NATURE-CONTEXT-PROPOSAL-REV2-REVIEW-2026-11-24.md`). Proposal: `docs/concepts/NATURE-CONTEXT-PROPOSAL.md` rev 2 (main `0ab5fa5`, sha256 `cecabfc5…8e03`).

- **Branch:** `nature-context-rc`, cut from main `6bebff1`. **Code commit `879cea8`** (this packet and its evidence follow in the next commit). Main has since moved by two documents-only Timeline commits (`6449484`, `d933709`; no page or test file).
- **Not changed:** `style.css`, `phase1/worker.js` (hub), every other page file, R2, D1, REGISTER, schedules. No GNW request was made by the candidate or by its tests.

## 1. Files

| File | main `6bebff1` sha256 | candidate `879cea8` sha256 | What changed |
|---|---|---|---|
| `app.js` | `2bb226b5…` | `05bd243faec327ff688143def9fe18e7f4efcbd199c68b4511009d93b5b94a4f` | Forest helpers `ME.forest*`; the place panel's forest row and collection line; `R.forest` (unit, observed, page-owned Quantity, Window, Cadence); the report line |
| `index.html` | `52ba007f…` | `98ec0ced5e697c92266974d01301783ead02e5e9a5f18550340a7225d0d4629a` | Card unit; cell inspector (Quantity, Queried, By confidence, Cell total, caveat); `app.js?v=202612241000` |
| `sources.html` | `f4a9254d…` | `d6ca4fae29e269adb093a311cd6bf9bd66b27cae7031521d3546b276e12cc70a` | Forest paragraph; `app.js?v=202612241000` |
| `phase1/nature-context-ui.test.cjs` | — | `b57d96e040a01b0995dfa15e9c2877d5338169139e9ea81955e086f27055268b` | New suite (58 checks) |
| `phase1/place-rows.test.mjs` | | | One assertion updated (§4) |
| `phase1/place-ui.test.cjs` | | | Two assertions updated (§4) |
| `reviews/2026-11-24-nature-context-proposal-rev2-gpt-review.md` | — | `9a39a8ce…94d1` | GPT's review, filed unchanged |

The page diff is `evidence/2026-11-24-nature-context-rc/page-diff.patch`.

## 2. What the page says now (per surface)

- **Place panel, forest row** (label "Forest disturbance · containing 4° cell"): "<N> alert pixels (10 m), first detected on or after <since>, as held in version <id>, queried <time> (<age> ago) · nominal · high · highest · coverage partial", then the caveats (pixels not hectares or a trend; first detection is not the date of clearing; confidence can rise or an alert be removed after the query; when confidence changed is not supplied by the source). No end date; nothing derived from the version name.
  - Age: strictly more than 4 days → "· older than 4 days: this cell was last queried <time>"; exactly 4 days is not old. Missing → "query time not recorded"; malformed → "query time unreadable"; impossible day → "query time is not a real calendar day"; ahead by up to 300 s → "ahead of this page's clock by N s, within the 5-minute tolerance; no age is claimed"; ahead by more → "query time unknown: … more than 5 minutes ahead of this page's clock".
  - Layer run, kept apart from the cell: `source_status: down` → "the latest forest run (<time>) did not succeed; this cell's value is from its own query"; an old envelope with status ok → "the layer's last recorded run was <time>, older than its refresh limit; this cell is judged by its own query time" (GPT §4: staleness is not failure).
  - Valid zero: "0 (source-reported zero) … — no matching alert pixel was returned within the contributing systems' monitored tree-cover and forest masks for this filter. Not proof that nothing was disturbed, and not complete monitoring of the cell." Not printed when an unrecognised category is non-zero.
  - Unknown provenance: "first-detection start date not recorded" / "… unreadable"; "dataset version not resolved". Never filled from the envelope.
  - Unrecognised confidence key: listed, escaped, "across the three known categories; the unrecognised category is listed separately and not included". A known group that is missing: "count not available (<group> not provided)", never 0.
  - Not covered: "not covered — the alert systems run between 30°N and 30°S; within that band, latitude alone does not make a cell monitored forest". Pending: "unknown — in the sweep, not answered yet (no count, no query time)".
- **Collection line:** "<n> daily snapshots of this cell retained, <first> to <last> (at most one per UTC day: the day's latest answered query; not every query, and no pixel history)".
- **Cell inspector:** Quantity is the page's own text (the hub's "published" string is not printed); Queried = age · since · version; By confidence lists unrecognised keys "(not included in the total)"; Cell total = "<n> alert pixels (10 m), first detected on or after this cell's own date (see Queried)".
- **Card:** unit "alert pixels (10 m) · first detected in each cell's own window"; the line under it lists the versions in use with cell counts, "version not resolved for N cells", and cells left out of the total (unrecognised category; incomplete count).
- **Report (both pages):** "<N> forest-disturbance alert pixels summed across <k> cells, each counted from its own first-detection date at its own query time (dataset versions …); not one common period and not a trend (…)".
- **Sources:** Measures table and rules list carry the page-owned Quantity; Windows table: "each cell from its own first-detection date (the collector normally asks from 7 days before the query's scheduled time; a retried cell keeps its first date); no common period across cells" — the qualified explanation GPT allowed in §1, not a claim about any returned cell; Cadence: "… about two days for all 559 cells when every query answers; retries lengthen it"; the forest paragraph corrected the same way and says a cell queried more than 4 days ago is marked older.

## 3. Tests (cloud workspace, Chromium via Playwright 1.63, SwiftShader; logs in `evidence/2026-11-24-nature-context-rc/`)

**New suite `nature-context-ui`: 58 passed, 0 failed.** Part A (no browser, fixed clock 2026-11-24 07:10 UTC): F1–F17 and GPT's additions A1 (stale envelope with status ok is not a failure), A2 (mixed-cell summary with an unresolved version, an unknown category and an incomplete cell), A3 (pending: no count, no invented time), A4 (future skew 299 / 300 / 301 s), A5 (collection: one daily snapshot stands for several same-day queries). Missing, malformed and impossible-day times are separate cases (F7). Part B (pages in the browser, the page clock fixed with `page.clock.setFixedTime`): card, panel for five cells, cell inspector, pending/not-covered, keyboard, 360 px text-node boxes for two cells, Sources report, Measures, Windows, forest paragraph.

**Isolation (GPT §4):** the suite serves the pages itself and routes every request. Hub paths are answered from fixtures (37 requests, including `/`); an unknown hub path would fail B14; any other host is aborted and listed (0 this run). No request reached the network, none went to Global Nature Watch, and the `/place` requests were exactly the seven cells opened.

**Old-code control (`OLD=1`, main's page files):** 12 passed, 46 failed. The 12 that hold on main too: F1 "no age warning at 21.5 h", F4 (no warning just under 4 days), F13 (down with no cell is unknown), B5 "no layer switched on by the panel", B6 keyboard, B8 and B13 no page errors, B9 360 px (two), B14 isolation (three).

**Breaks, each fails (exit 1):**

| BREAK | What it restores or weakens | Fails |
|---|---|---|
| `published` | "published in the 7 days from <since>" | F1 F2 F14 B2 B7 |
| `queries` | "queries of this cell retained" | A5 B2 |
| `never-old` | no cell-age warning | F6 F15 B3 |
| `ge-limit` | exactly 4 days counted as old | F5 |
| `hub-quantity` | the hub's "published" Quantity string | B11 B12 |
| `stale-is-failure` | an old envelope reported as a failed run | A1 |
| `unknown-in-total` | unknown categories added to the total | F11 A2 B1 |
| `skew-fresh` | no 5-minute limit on a future time | F8 |
| `no-escape` | a provider key inserted unescaped | F11 B4 B7 |
| `card-old` | the card's old unit | B1 |
| `common-interval` | the report's "in the last 7 days" | B10 |
| `since-from-envelope` | a missing `since` filled with the envelope's date | F9 |

**Existing suites on the candidate (against `phase1/serve-core-on.py` where they need it):** place-rows 7/7 · place-ui 35/0 · fire-status-ui 279/0 · cell-perf-ui 43/0 · smoke-fixes 113/0 (text-node boxes at seven widths) · freshness-wording-ui 156/0 · legend-active-ui 548/0 · ux-round1 34/0 · search-ui 117/0 · layer-switches-ui 68/0 · optional-layers-status-ui 230/0 · quakes-ships-status-ui 124/0 · bare-earth-ui 190/0 · hub-alignment 6/0 (worker.js = deployed hub 0.6.24) · history-hub 33/0.

**`animals-tab-ui`: 277 passed, 3 failed — exactly 13b, 13c, 13e, as the proposal (§4) and GPT (§2) expect.** 13c lists exactly `["app.js"]`. This is **not** a passing Animals suite; it is the disclosed consequence of changing three files that suite holds to `BASE_MAIN` `0e62083`. No pin or Animals test was changed here. For a release, the Animals owner writes and reviews the narrow exception (GPT's preferred form (ii): exact files at the reviewed page commit H via an `NC_MAIN` pin, the existing Animals guarantees kept — tab and menu link once each, the header guarantee for both pages, and the Sources Animals section, its shortcut, six source identifiers, the Low-use-class sentence and no "private preview" — with a check that H's diff touches only the allowed paths, that an unreviewed edit to a pinned file is caught, and that a missing Animals link or Sources element is caught even if a proposed baseline also lacks it).

## 4. Assertions changed in existing suites (each with its reason)

| Suite | Assertion | Was | Now | Reason |
|---|---|---|---|---|
| `place-rows.test.mjs` | "a source-reported forest zero is labelled as the source's zero" | `/Forest disturbance: 0 \(source-reported zero\) alert pixels/` | `/Forest disturbance · containing 4° cell: 0 \(source-reported zero\) alert pixels/` | The row label now names its scope (spec §4, proposal §3.1). The zero rule itself is unchanged and still tested. |
| `place-ui.test.cjs` | 1 "every layer has its own row" | label `'Forest disturbance'` | `'Forest disturbance · containing 4° cell'` | Same label change. |
| `place-ui.test.cjs` | 1 "forest outside the sweep says not covered (not zero)" | `/^not covered — outside the swept tropical land cells/` (the hub's `why` text) | `/^not covered — the alert systems run between 30°N and 30°S; within that band, latitude alone does not make a cell monitored forest/` | The page now owns this wording (proposal §3.1, GPT G3); the hub's `why` is not printed for forest. |

## 5. Not checked, open, and for later

- Real phone, Safari and screen reader: **not checked**. The 360 px checks are an emulated width in Chromium.
- The candidate has not been run against the live hub or live data; it is a fixture preview by design. No live RC check was made.
- **Hub `quantity` string** still says "published" (`phase1/worker.js` `collectForest`). It is no longer printed for forest on any page surface. Recorded for the hub owner's next reviewed hub change; no hub deploy proposed.
- **REGISTER:** the dated correction (proposal §3.3) belongs to the release commit on Chad's line; not filed.
- **Release path, if wanted:** Chad's go → the Animals owner's test-maintenance commit (above), reviewed → merge on fresh main → rerun the affected suites and `animals-tab-ui` on the merged tree before the push → Chad's Approve line → push → served hashes and a live read.
- Research notes: GPT asked (§1) that the §2 sentence "a cell's window runs from its `since` to its version's content date" be marked superseded. Done on main as a documents-only amendment (see STATUS).

## 6. Evidence

`evidence/2026-11-24-nature-context-rc/`: the new suite's own log on the candidate, its `OLD=1` log and one log per break, one log per existing suite, `page-diff.patch`, and `SHA256SUMS` covering every file there and this packet's inputs.
