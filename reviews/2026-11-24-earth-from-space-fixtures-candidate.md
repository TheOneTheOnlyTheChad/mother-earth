# Earth from Space — the two throwaway Workers: branch candidate for review (rev 1)

24 Nov 2026, 03:05 UTC (clock reading). Branch `earth-from-space-fixtures-rc`, cut from main `3160658`. Built on Chad's own
"T5: go" of 24 Nov (the branch build of the two throwaway Workers and their suites) after GPT's document recheck passed
(`EARTH-FROM-SPACE-STAGE-D-DOCS-R2-RECHECK-2026-11-24.md` in GPT's folder on the Mac). Chad also decided T3 that day: D1 cost
is measured beforehand, in isolation.

**Branch work only. Nothing was created, deployed, changed or run in any account. No Worker, database or monitor exists.
Stage D is not cleared. Every live step still needs Chad's own Approve line.**

Plan: `reviews/2026-11-23-earth-from-space-alert-test-plan.md` rev 1.2. The hub file is untouched: `phase1/worker.js` is the
deployed 0.6.24 (`db4f9cdf…1aa5`, 551,400 bytes) and `hub-alignment` passes 6 of 6 on this branch.

## 1. What is on the branch

| File | What it is |
|---|---|
| `phase1/evh-fixture/build.mjs` | The build. `alert <T0>` writes the alert-test Worker (plan 2 to 6). `d1 <B>` writes the D1 measurement Worker, the schema, four row sets and `expected.json` (plan 7). It reads `phase1/worker.js` and `phase1/schema.sql` and writes files. It contacts nothing |
| `phase1/evh-fixture.test.mjs` | The suite: **71 checks, 71 pass**. `node --no-warnings phase1/evh-fixture.test.mjs`. No network, no account. Needs Node with `node:sqlite` (22 or later) |
| `phase1/evh-fixture/measure-in-pane.js` | The measurement requests for one row set: 20 each of runs GET, runs HEAD, trial GET, trial HEAD (plan 7.3) |
| `phase1/evh-fixture/example/` | **Examples only**, for reading: both Workers and the seed files as built for T0 `2026-11-26T08:00:00Z` and B `2026-11-27T09:30:00Z`. Check A13 holds them to the build. **These are not the files for the day**: the real T0 and B are set in Chad's lines, the files rebuilt, and their hashes quoted then |

Example hashes (reproducible with the two build commands): alert Worker 15,575 bytes `e09eeb57f47c2b535f4d7fa0c7483c619c465b0a8fc8f22d6b36dd46febd4865`;
D1 Worker 15,065 bytes `41614a57969285a0776599f480a1931243c611f33cf168667d392f063c9a8931`.

## 2. What is copied and what is fixture

**Copied byte for byte from `phase1/worker.js`, 19 spans**, each found exactly once or the build stops: `COLLECTOR_VERSION`,
`CORS`, `json`, `redactText`, `healthNote`, `HEALTH_SKEW_MS`, `EV_STOP`, `EV_WINDOW_MAX_MS`, `evMark`, `EVH`,
`EVH_POST_CHECK`, `EVH_FETCH_FAIL`, `evhKind`, `evhConfig`, `evhEvaluate`, `evhSafe`, `healthEvRuns`, `healthEvTrial`,
`health`. Each built file names the source hash and each span's line numbers.

**Fixture, in both:** `HEALTH.checks` (the two entries used); the router; the `env` handed to the copied code.
**Fixture, alert Worker only:** the made-up rows, the stand-in for `env.DB` with its arrival rule, the simulated closeout.
**Fixture, D1 Worker only:** the fixed window, the recorder around the real `env.DB`, the measurement headers.

**The router** passes only `/health/runs/earthview` and `/health/trial/earthview`, by `GET` or `HEAD`, to the copied
`health`. The copied `health` names four handlers of other layers that are not copied; check D shows that a router letting
`/health/runs/usgs` through makes it throw, which is why the router answers everything else itself.

**The strongest check (B10, C8):** the suite imports the **real** `phase1/worker.js` and drives its own fetch route as the
reference. The alert Worker's answer equals it in status, body and every header at 12 clock times, both addresses, `GET`
and `HEAD` (48 of 48). The D1 Worker's answer equals it for all four row sets apart from the seven added headers.

## 3. Where the build departs from the plan's wording, or fixes a detail the plan left open

1. **The D1 Worker's clock is the real clock, not a fixed one** (plan 7.1 said "its window and clock are fixed"). The copied
   `health` reads the clock itself and is not altered. Instead the window is fixed from B (FROM = B − 49 h, UNTIL = B − 1 h),
   so the made-up trial has ended for **any clock from B − 50 min on** and its verdict then depends on the rows only. Checks
   C4 and C5 show the verdicts hold at B − 50 min, B, B + 6 h and B + 30 h, and not one millisecond earlier.
2. **A method other than `GET` or `HEAD` on a right path is 405** with `Allow: GET, HEAD`. On a wrong path it is 404.
3. **A query string on a right path is ignored**, as on the hub (B12). On a wrong path the answer is 404 either way.
4. **Two different things are both called "rows read".** The health answer's own `facts.rows_read` is the number of rows
   **returned** to the evaluation (`rows.length`). D1's `rows_read` is what the query read. The measurement keeps them
   apart: `X-Evd1-Rows-Returned` and `X-Evd1-Rows-Read`.
5. **The row sets are built inside the database** by a few `INSERT … SELECT` statements over a recursive counter, not by
   thousands of literal rows. One file per set; `seed-clear.sql` empties the table between sets.
6. **The measurement requests are made from the browser pane on the measurement Worker's own address**, so the added
   headers are readable to the page. The script is `measure-in-pane.js`.

## 4. The row sets, fixed (`example/expected.json`; the same for any B)

| Set | Rows in the table | In the read range | Expected: runs, trial | State | Rows returned |
|---|---|---|---|---|---|
| S1 completed normal trial | 288 | 288 | 200, 200 | trial complete, nothing outstanding | 288 |
| S2 repeat-heavy (288 × 6, plus 172 stray rows started off a mark) | 1,900 | 1,900 | 200, 200 | trial complete, nothing outstanding; 172 rows outside slots | 1,900 |
| S3 at the cap (288 × 7) | 2,016 | 2,016 | 503, 503 `too_many_rows` | too many rows to evaluate | 2,000 |
| S0 S1 plus 5,000 rows of five other layers and 600 earthview rows finished before the range | 5,888 | 288 | 200, 200 | trial complete, nothing outstanding | 288 |

Bound query values, every set: `'earthview'`, FROM, UNTIL + 24 h, `2000` (check C9: the same four the real hub sends).
An empty table answers 503 with 288 overdue (C13), so a forgotten seed cannot pass for a clean set.

## 5. GPT's five carry-over points (recheck, section 3)

| Point | In the candidate |
|---|---|
| Capture each query's D1 metadata before the evaluator drops it; equivalence on status, body and original headers; `HEAD` evaluates and carries the headers | The recorder keeps `r.meta` at `all()`. C8: status, body and every original header equal the real hub; only the seven listed headers are added; `HEAD` included. C10 |
| No per-query `rows_read`: do not relabel a total | The header then reads `unavailable` (C11) and a break that writes a made-up figure is caught. A database total stays a total in the result |
| Exact row sets, clocks, bound values, expected verdicts fixed before execution; seed and cleanup kept apart from measured requests | Section 4 and `expected.json`. On the day: D1's metrics are read **after seeding and before the requests**, and again after, so the seed's own reads and writes are not counted with the 80 requests |
| 7.5's usage and money figures are expectations | Agreed. Actual usage and the allowance are read and recorded on the day |
| The trial 503 lasts 49 min 45 s | B6 asserts 50 min for runs and 49 min 45 s for trial. The plan's "each 503 lasts 50 minutes" is corrected in the next plan revision |

## 6. The suite, in outline (71 checks)

- **A (13):** the hub file is the recorded deployed one; 19 spans found once and in both built files; the query is the
  reviewed one; a changed source, a missing span and a doubled span are each noticed; two builds a day apart differ only in
  the time lines; the examples equal the build.
- **B (14):** the timetable of plan 2.2 at every boundary (1 ms before, at, 1 ms after) and every five minutes;
  runs 503 at T0 + 50 min for slot A only, recovery at T0 + 100; trial 503 at T0 + 120 min 15 s, closeout at T0 + 170;
  **rows returned 261, 268, 274, 281** at the four points GPT counted; `HEAD` and `GET` alike; equality with the real
  hub; 24 wrong paths and five other methods; no outbound request; **nothing read from the env**.
- **C (16 named, 26 checks):** the schema statements; each set's row counts and verdicts at four clock times; the validity
  bound; SQLite's plan uses the `(layer, finished_at)` index with no scan and no sort; equality with the real hub; the
  recorder passes the query and its values unchanged; "unavailable" when no figure exists; a failing database; an empty
  table; the router.
- **D (16):** eight breaks of the alert fixture's rules, two of its router, five of the D1 fixture, each caught.

## 7. Not checked, not run

- **Nothing has run on Cloudflare.** No `rows_read` figure exists. `node:sqlite` is not D1 and reports none; the suite
  proves the plumbing with a stand-in value.
- Whether D1 returns `meta.rows_read` to a Worker exactly as its documentation describes, and whether its duration field
  is named `duration`. The header takes either `duration` or `sql_duration_ms`, and the whole meta is also returned
  as `X-Evd1-Meta` so nothing is lost if a name differs.
- Whether D1 accepts the seed statements as written (a recursive counter of up to 5,000 steps). If it refuses one, that
  set is not run and the seed is revised and re-reviewed; nothing is improvised on the day.
- How the seed is loaded on the day (the D1 console in the dashboard, or the Cloudflare connector). To be fixed in the
  Approve line.
- Whether a new Worker's logs and CPU are readable at once (plan section 13).
- The suite was run in Claude's workspace only (Node 22.23.5). Nobody else has run it.
- The older hub suites were not rerun: no file they read was changed.

## 8. What comes next, each on its own line from Chad

1. GPT's review of this exact candidate (commit named in the read-me of the review folder).
2. The D1 measurement: `Approve:` line as sketched in plan section 10, with B and the rebuilt file's hash.
3. The alert test: `Approve:` line as sketched in plan section 10, with T0 and the rebuilt file's hash.
4. Results to GPT. Then the remaining runbook prerequisites (P3, P6, P7, P11).
