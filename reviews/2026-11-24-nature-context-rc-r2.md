# Nature context — Stage 1 candidate (`nature-context-rc`), review packet rev 2

**24 Nov 2026 (10:11 UTC clock reading). Branch only: nothing merged, deployed, uploaded or filed.** Answers GPT's HOLD (`reviews/2026-11-24-nature-context-rc-gpt-review.md`, 8,534 B, sha256 `bf1ed78a78966f41ebe4b8f5b834ba221378669319beff5d31140736ec56eb2e`, filed unchanged from `~/Documents/ChatGPT/Mother Earth/NATURE-CONTEXT-STAGE1-RC-REVIEW-2026-11-24.md`): three targeted corrections H1–H3 on the same branch, no new scope. Chad relayed the review in his own message of 24 Nov.

- **Code commit `90eb522`** (rev 1 code was `879cea8`; this packet and its evidence follow in the next commit). Branch cut from main `6bebff1`; main has since moved by documents only.
- Rev 1 packet `reviews/2026-11-24-nature-context-rc.md` (sha256 `7ad2169c…ea54`) still describes everything not changed here; §2 below lists only what changed.
- **Not changed:** `sources.html` (byte-identical to rev 1), `style.css`, `phase1/worker.js`, REGISTER, R2, D1, schedules, every other page file.

## 1. Files

| File | rev 1 `879cea8` | rev 2 `90eb522` sha256 |
|---|---|---|
| `app.js` | `05bd243f…a4f` | `a48769068c1a3fa1a2440f57e21610bd5d8f8195ce1e516cc79bfaaba9bd0e5a` |
| `index.html` | `98ec0ced…29a` | `70b43b3e14198c9159204a1fa9bd1d5deff6031aca344c9329a9e9f4979d1b40` |
| `sources.html` | `d6ca4fae…70a` | unchanged `d6ca4fae29e269adb093a311cd6bf9bd66b27cae7031521d3546b276e12cc70a` |
| `phase1/nature-context-ui.test.cjs` | `b57d96e0…68b` | `92acf1f5a2629509a371aee0b31bca0199ed902c9dbda8160153ce3fc9ad2a7b` |
| `reviews/2026-11-24-nature-context-rc-gpt-review.md` | — | `bf1ed78a…2eb2e` (GPT's review, unchanged) |

Diffs: `evidence/2026-11-24-nature-context-rc-r2/page-diff-r1-to-r2.patch` (rev 1 → rev 2) and `page-diff.patch` (main `6bebff1` → rev 2, the three page files).

## 2. The three corrections

**H1 — no contributing count is unavailable, not zero.** `ME.forestSummary` now returns `total` (`null` unless at least one cell has a complete count) and `countWhy` ("none of the N answered cell(s) has a complete count" / "no cell has answered yet"). `R.forest.value` uses `total`, so the card shows "–", never "0".
- The card's source line says "**count not available — <reason>**" and prints no highest-confidence figure. With a total it says "<n> highest-confidence across the <k> of <N> cells with a complete count".
- The report says "forest disturbance: count not available — <reason> (a question of the cells' counts, not of the latest run)". It does not claim a stale envelope or an outage.
- An envelope with no cells keeps the existing freshness rule ("unknown — no cell has answered yet — the sweep has not started"), now without a "0 highest-confidence" beside it.
- A complete all-zero cell is still a genuine 0 ("0 … summed across 1 cell"). A mixed sum counts the complete cells and names the left-out ones.
- The report's "summed across 1 cells" became "1 cell".

**H2 — one count policy on every surface.** `ME.forestCount(cell)` is used by both the place row and the cell inspector's **Cell total**:
- the total is the sum of nominal + high + highest, and only when all three are supplied; otherwise "count not available (<group> not provided)";
- unrecognised categories stay listed and excluded, with the same qualification;
- the hub's own `count` field is not used for display. If it disagrees with the groups' sum, the row says "(the hub's own count field says <n>; the sum of the three known categories is shown)". A missing raw count with complete groups shows the sum, and never "undefined".

**H3 — a timezone offset is converted, not relabelled.** `ME.forestAge` formats the parsed instant (`new Date(Date.parse(iso)).toISOString()`), so `2026-11-24T08:10:00+02:00` reads "queried 2026-11-24 06:10 UTC (60 min ago)", the same as its Z form. Only the forest helper changed; the shared `when()` is untouched.

## 3. Tests (cloud workspace, Chromium via Playwright 1.63, SwiftShader; logs in `evidence/2026-11-24-nature-context-rc-r2/`)

**`nature-context-ui`: 78 passed, 0 failed** (rev 1: 58). New cases:
- **A6** (helper): all incomplete → null with its reason; no cells → null, "no cell has answered yet"; one complete zero → 0; mixed → sum of the complete cells with the exclusion named.
- **A7**: the Z / +02:00 pair reads identically (06:10 UTC, 60 min ago); an offset form exactly 300 s ahead is within tolerance and shown as 07:15 UTC; 301 s ahead is unknown.
- **A8**: a raw count that disagrees with the groups; no raw count with complete groups.
- **B15–B19** (browser, separate forest envelopes on World View and Sources): all incomplete (card "–", source line and report say count not available, no 0, no stale/outage wording); inspector of an incomplete cell says count not available like the panel, not the raw 5; no cells; one complete zero (card 0, report "summed across 1 cell"); mixed (card 199,612 over 3 of 4 cells; report names the exclusion; inspector for disagreement, no raw count and incomplete cells); no page errors.
- **B7** updated: the inspector's Cell total now carries the same unrecognised-category qualification as the panel. The rev 1 fixture was a complete cell whose two totals agreed, so it could not detect the bypass (GPT §3).

**Isolation:** 104 hub requests answered from fixtures, 0 other requests (0 aborted), 0 reached the network, none to Global Nature Watch; `/place` requests exactly the seven cells opened.

**Old-code control (`OLD=1`):** 13 passed, 60 failed. Part A's A6/A7 crash as one failure each on main, where the helpers don't exist.

**Breaks: all 15 fail.** The rev 1 twelve still fail: published, queries, never-old, ge-limit, hub-quantity, stale-is-failure, unknown-in-total, skew-fresh (now also A7), no-escape, card-old, common-interval, since-from-envelope. Three are new:

| BREAK | Restores | Fails |
|---|---|---|
| `zero-no-contributors` | `total = n` (zero across no contributors) | A6 B15 |
| `inspector-raw-count` | the inspector's Cell total from the raw `count` | B7 B16 B19 |
| `offset-literal` | `when(iso)` (an offset relabelled UTC) | A7 |

**Existing suites on rev 2:**

| Suite | Passed | Failed |
|---|---:|---:|
| place-rows | 7 | 0 |
| place-ui | 35 | 0 |
| fire-status-ui | 279 | 0 |
| cell-perf-ui | 43 | 0 |
| smoke-fixes | 113 | 0 |
| freshness-wording-ui | 156 | 0 |
| legend-active-ui | 548 | 0 |
| ux-round1 | 34 | 0 |
| search-ui | 117 | 0 |
| layer-switches-ui | 68 | 0 |
| optional-layers-status-ui | 230 | 0 |
| quakes-ships-status-ui | 124 | 0 |
| bare-earth-ui | 190 | 0 |
| hub-alignment (worker.js = deployed hub 0.6.24) | 6 | 0 |
| history-hub | 33 | 0 |

No existing assertion changed in rev 2; the three rev 1 changes stand as listed in the rev 1 packet §4.

**`animals-tab-ui`: 277 passed, 3 failed — exactly 13b, 13c (`["app.js"]`), 13e.** As in rev 1 this is expected and disclosed. It is not a passing Animals suite. No pin was moved and no Animals test was changed.

## 4. Open, unchanged

- Real phone, Safari, screen reader: not checked. Live data: not used (fixture preview by design).
- The hub `quantity` string still says "published"; it is not printed for forest on any page surface. Left for the hub owner; no hub deploy.
- REGISTER's dated correction, the Animals owner's narrow `NC_MAIN` exception (GPT's form (ii), with every existing Animals guarantee kept), the merged-tree reruns and Chad's Approve line all belong to a later release.
- Packaging (GPT §1): the Mac review copy now carries all three GPT reviews this candidate depends on (Stage 0, proposal rev 2, candidate), so it is self-contained.

## 5. Evidence

`evidence/2026-11-24-nature-context-rc-r2/`:
- the new suite's log on `90eb522`;
- the `OLD=1` log and one log per break (15);
- one log per existing suite (16);
- both diffs;
- `SHA256SUMS` over every file there and this packet's inputs.
