# Buoys and microplastic: the withheld line — proposal (rev 2: GPT review recorded; §5 governs)

15 Nov 2026 · docs only · nothing built · page only · written against main `9bc05bb` (page merge `879cb20`, hub 0.6.14)
Deferred from `WITHHELD-LINE-QUAKES-SHIPS-PROPOSAL.md` (W-D2). Now reproduced.

## 1. What main does (reproduced 10:50 UTC, real page, fixture hub, layer switched on)

| State | Card | "Records withheld" line |
|---|---|---|
| Buoys down, last good records | unknown · – · "collector reported down: http 522" | **"…different collector run… — counts shown alone"** |
| Buoys stale (5 h), mismatched | unknown · – | **same line** |
| Buoys mismatch, valid count | current · 2 | shown (correct) |
| Microplastic down, last good records | unknown · – | **same line** |
| Microplastic stale (4 days), mismatched | unknown · – | **same line**, reading "records 10:50 UTC, counts 10:50 UTC" |
| Microplastic mismatch, valid count | loaded · 2 | shown (correct) |

- **O1.** Both optional cards show "counts shown alone" beside a dash, as fires, earthquakes and ships did.
- **O2.** Buoys down: the description line reads "no snapshot from the hub" while the source line says the collector reported down. There is a snapshot; it is a down one.
- **O3.** The line prints run times as hours and minutes only, so two runs a day or more apart can read as the same time ("records 10:50 UTC, counts 10:50 UTC").
- Since hub 0.6.8 a failed buoy update normally keeps the last good run with `last_attempt`, so a down buoy envelope is rare; the stale case is the ordinary route to "unknown".

## 2. Proposed rules

- **P1.** Gate the line for buoys and microplastic on the count the card displays (`value !== null`), exactly as for the other three. `cardCount` then covers all five record layers.
- **P2.** Buoys down: the description reads "no buoy data from the latest run" in place of "no snapshot from the hub".
- **P3.** When the two runs in the line fall on different UTC days, each time carries its date ("records 10 Nov 10:50 UTC, counts 14 Nov 10:50 UTC"). Same day: unchanged.

Files: `index.html` only if `driftCard` and `plasticCard` hold the counts; `app.js` if the run-time wording lives there (then the cache key is bumped on both pages).

## 3. Acceptance checks

| Rule | Check |
|---|---|
| P1 | The four unknown rows above: line hidden and empty, "counts shown alone" nowhere on the visible page. The two valid-count rows: line shown beside a number. A valid zero with mismatched records keeps the line. Break: remove the gate, the down rows must fail. |
| P2 | Buoys down: description as proposed; buoys with no snapshot at all keep "no snapshot from the hub". |
| P3 | Runs on different days: both dates shown. Same day: no date. |
| Regression | `osmc-reliability-ui`, `drifters-ui`, `plastic-ui`, `buoy-temp-ui`, `legend-active-ui`, `fire-status-ui`, `quakes-ships-status-ui`, `mobile-pass`. |

## 4. Decisions

- **O-D1.** P3: apply to all five record layers (recommended; one function) or only the optional ones?
- **O-D2.** P2 wording.

## 5. GPT review of rev 1 (relayed by Chad, 15 Nov) — governs where it differs from §2–§4

- **O-D1 decided: all five record layers.** Run times in the withheld line carry their UTC date when the two runs fall on different UTC days, and the year as well when they fall in different years. Run times go through the shared timestamp validation (`ME.stamp`'s rule: a string that parses to a real time); a malformed run time reads "unknown", never a made-up time.
- **O-D2 decided:** buoys down reads **"No buoy data from the latest run."** Microplastic has the same fallback text in the code (confirmed: `index.html` line 1490), so its down state reads **"No microplastic data from the latest run."** An absent snapshot keeps "No snapshot from the hub" on both cards.
- **Gate on the rendered count, not on freshness.** The withheld line follows the count the card actually renders. Named case: the buoy `last_attempt` fallback with unusable records shows a dash while the retained counts are still fresh enough, so a freshness-only gate would leave the line up beside a dash.

Added acceptance checks:

| Rule | Check |
|---|---|
| P1 | Buoy `last_attempt` fallback, counts within their limit, records unusable: card shows a dash, the line is hidden and empty. Break: gate on freshness instead of the rendered count, this case must fail. |
| P2 | Microplastic down: "No microplastic data from the latest run."; microplastic with no snapshot: "No snapshot from the hub". Same pair for buoys. |
| P3 | Cross-day case on a fixture where the count **and** the withheld line are both visible; all five record layers; a cross-year pair shows both years; a malformed run time on either side reads "unknown" and nothing reads "NaN", "undefined" or "Invalid". Same-day wording unchanged. |

Status: ready to build on Chad's own Go line. Page only.
