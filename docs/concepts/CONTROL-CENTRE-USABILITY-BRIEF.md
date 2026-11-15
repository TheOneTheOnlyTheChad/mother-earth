# Control Centre usability — brief for GPT review (rev 1)

15 Nov 2026 · docs only · nothing built · existing layers only · checked against main `1f6af0e` (page merge `967af71`, hub 0.6.14)

**Asked for (Chad, 15 Nov):** reproduce each issue on current main before it goes in scope, fire status first; then the legend, controls at intermediate widths, and freshness wording; name the smallest first branch with an acceptance check per fix. Sun picture cleanup stays out of this branch. Build waits for Chad's go.

## 1. How each issue was reproduced

- **Harness (workspace):** the real `index.html` and `app.js` from main, driven in Chrome with the hub's answers replaced by fixtures. `/place` is answered by the real `phase1/worker.js` over an in-memory store. Scripts and raw output: `reviews/evidence/2026-11-15-usability-repro/`.
- **Live page (browser pane, read-only):** card text and the summary report read at 05:00 UTC, 15 Nov.
- **Hub record (D1, read-only):** `collector_runs` for `firms`, 12–15 Nov.
- **Limits:** the harness uses the legacy `rows` records file; production serves `lines/1`. The place finding (F2) sits in a check that runs before either path, and both down writers publish `cells: {}` (code read: `writeDown`, `fvDownForInput`), but the `lines/1` path itself was not exercised. The globe did not draw under software rendering, so nothing here is a visual judgement of the globe. No phone, Safari or screen reader.

## 2. Fire status: what main shows in each state

Five hub states, six surfaces. "Report" is the page's summary sentence (`ME.report`).

| State | Card | "Records withheld" line | Find / search | Report | Place view |
|---|---|---|---|---|---|
| **A. Missing daily feed** (down, boundary note) | unknown · "–" · "Today's detections aren't available yet." | **"…different collector run… — counts shown alone"** | "unknown right now — collector reported down: no detections processed yet…" · not searched, same reason | "fires: unknown — collector reported down: no detections processed yet…" | **"withheld — records and counts are not from the same collector run"** |
| **B. Failed refresh** (down, fetch error) | unknown · "–" · "collector reported down: TypeError: fetch failed" | **same "counts shown alone" line** | unknown, same reason · not searched | "fires: unknown — collector reported down: …" | **"withheld — … not from the same collector run"** |
| **C. Valid zero** (ok, no records) | current · "0" | hidden | "No fire detections record in this snapshot carries a highest frp value…" · searched | "0 fire detections so far today" | "no detection reached us for this cell so far today (UTC) — not 'no fires'…" |
| **D. Run mismatch** (valid count, older records) | current · "2" | "…different collector run (records 01:58, counts 04:57) — counts shown alone" | "Records … are not usable — …" · not searched, same reason | "2 fire detections…" | "withheld — … not from the same collector run" |
| **E. Records file unreadable** (valid count) | current · "2" | "the record file could not be read (…) — counts shown alone" | not usable · not searched, same reason | "2 fire detections…" | "withheld — … (records unreadable…)" |

Findings:

- **F1 (reproduced A, B; seen live 12 Nov 01:40 UTC, STATUS).** "Counts shown alone" appears while the count is "–". Cause: `refreshPair` writes the mismatch reason whenever the two files differ, and a down run always differs from the last good records file. `pairNote` then prints it without asking whether a count is on screen.
- **F2 (reproduced A, B; harness with the real hub code).** The place view calls a missing feed and a failed refresh "withheld — records and counts are not from the same collector run". The card, search and report call them unknown. Cause: hub `placeSection` tests `source_status === 'down' && !cells.cells`, and a down run publishes `cells: {}`, which is truthy, so the down branch is never taken.
- **F3 (reproduced A).** The expected daily state is worded two ways: the card says "Today's detections aren't available yet."; find, search and the report say "collector reported down: no detections processed yet for today (UTC)…". This follows the 11 Nov scope (card copy only).
- **F4 (reproduced C).** With zero records, "Highest FRP" answers that no record carries an FRP value. There are no records at all.
- **States D and E are correct on main** and stay as they are: a valid count is visible and the line says why records are missing.
- **How often:** A is daily. D1 shows 13–16 down runs each day from 00:00 to 03:00–03:45 UTC on 12, 13, 14 and 15 Nov. B was not seen in those four days. **C is not published by the hub today:** a header-only file is always recorded as down ("not a validated zero"); the smallest ok runs on record carried 207 and 452 bytes (12 and 13 Nov, 03:15 UTC). C stays in the tests so a zero can never be confused with A or B.

## 3. The other three areas

- **L1. Legend lists layers that are not drawn (reproduced).** The key's first line always reads "earthquake · fire detection (per pass) · vessel (last sample) · forest-disturbance alert pixels…". It read the same with fires switched off, with all four core layers off (Key count 0), and with fires down. Buoys and microplastic already appear only while on.
- **W1. 721–1100 px: no layer switch shares the screen with the globe (measured, real fonts).** First switch at y = 811 (1024×768), 829 (1100×800), 1015 (768×1024); buoys and microplastic switches at 1,600–2,100. Changing a layer means scrolling the globe away.
- **W2. 1101–1279 px: the globe column is squeezed (measured).** The credits block takes 160–219 px under the globe (219 of 800 at 1101 px) and the legend covers 10–12% of the globe box.
- **Checked and clean at 721–1280 px:** no sideways scroll, no clipped or overlapping header item, all six layer switches 36 px tall.
- **T1. "current" sits beside dated values (live, 05:00 UTC).** CO₂: CURRENT with "daily mean for 2026-11-13". Sea ice: CURRENT with "daily extent for 2026-11-13". Kp: CURRENT with "began 5.0 h ago". The badge reports that our copy was refreshed in time, which the card does not say. The microplastic card already uses "loaded" for this reason (GPT, 4 Nov).
- **T2. Retrieval wording varies (live).** "retrieved 5 min ago" (most cards), "last run 18 min ago" (forest), no retrieval time on the Ships card (tooltip only), and ages as "68 s", "5 min", "1.9 h", "46.8 h".

## 4. Smallest first branch: `fire-status-rc` (page only)

`index.html` and `app.js` only. No hub deploy, no schedule, no REGISTER change, no new request.

| Fix | Change | Acceptance check |
|---|---|---|
| **A1** (F1) | The "Records withheld" line is shown only when the card shows a count. When fires are unknown the card's one reason stands alone. | Fixtures A and B: line hidden, and the words "counts shown alone" appear nowhere on the page. Fixtures D and E: line shown, count is a number. Break: remove the guard and A must fail. |
| **A2** (F2) | `ME.placeRows` reads a section whose `source_status` is `down` as "unknown — <reason>", whatever `state` the hub sent. | Fixtures A and B through the real `worker.js`: the place row starts "unknown —" and carries the same reason as the card. Fixture D still reads "withheld —". Break: drop the rule and A must fail. |
| **A3** (F3) | One helper gives the fires reason to the card, tooltip, find note, search note, report and place row. The daily state reads "Today's detections aren't available yet." everywhere. | Fixture A: all six strings contain that sentence and none contains "collector reported down". Fixture B: all six contain "collector reported down: TypeError: fetch failed". |
| **A4** (F4) | "Highest FRP" with zero records says there are no fire detections in this snapshot. | Fixture C: the note says so and does not mention records "without a value". |
| **A5** | The four states stay distinct. | One test table, rows A, B, C, D (and E), asserting card state, count, the withheld line, search, report and place row. No two rows share the same set. |

Also required: `fires-wording-ui`, `place-ui`, `search-ui` and `osmc-reliability-ui` still pass; served-hash check after any release.

## 5. Later branches (each its own proposal)

1. **Legend (L1).** Each core entry shows only while its layer is counted by "Key · N layers"; with none, the line says no map layer is drawn. Small; could ride with branch 1 if GPT prefers one review.
2. **Hub: fix the `placeSection` down test** (root cause of F2). Needs a hub deploy, so it is kept out of the first branch.
3. **Freshness wording (T1, T2).** Needs a wording decision first.
4. **Intermediate widths (W1, W2).** Needs a layout decision first.

## 6. Decisions

- **D1.** A3 changes the report and search wording for the daily fires state, which the 11 Nov scope left alone. Include A3, or keep branch 1 to A1, A2, A4, A5?
- **D2.** F2: page-side reading now (A2) with the hub fix later, or wait and fix it in the hub only?
- **D3.** Legend with branch 1 or after it?
- **D4.** T1: keep "current" and state what it means, or change the badge for dated index values?

## 7. Out of scope

Sun picture cleanup (separate proposal; replay markers kept), new layers, the Sky view, Moon and Sun pages, Timeline, phone and Safari passes, any hub or schedule change.
