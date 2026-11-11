# Drifting buoys: keep the last good data on screen when one OSMC update fails — proposal

Rev 1, 11 Nov 2026. Docs only, for GPT's review and then Chad's decisions. Nothing is built, deployed or approved.

## 1. The problem

When one hourly request to NOAA OSMC fails, the drifting-buoy layer goes blank ("unknown, records withheld") for the whole hour, although the previous hour's buoys are still held by the hub and are still inside the layer's own freshness limit.

Seen once so far:

- **10 Nov, 16:07 UTC run:** OSMC answered HTTP 522 (run logged `down`, finished 16:08:42 UTC, about 30 s after it started).
- The layer was blank on the live site at 16:57 UTC and came back with the 17:08 run (1,303 buoys). STATUS 10 Nov 17:19 has the observation.

How often (D1 `collector_runs`, read 11 Nov 17:50 UTC, since 4 Nov 00:00 UTC):

| Layer | Runs | Down |
|---|---|---|
| drifters | 186 | 1 |

That is one failed hour in about eight days. It is a small problem; the fix should be small too.

## 2. Why it happens

Each good run writes two objects from the same run: `latest/drifters.json` (records and counts) and `latest-cells/drifters.json` (counts only). The page draws records only when both carry the same `retrieved_at`.

A failed run calls `writeDown`, which:

- overwrites `latest-cells/drifters.json` with an empty `down` envelope stamped with the failed run's time, and
- leaves `latest/drifters.json` alone.

So after a failure the two objects are from different runs. The page sees `source_status: down` and a mismatched pair, marks the layer unknown and withholds the records. That rule is right for a mismatched pair; the trouble is that the hub threw away the matching counts.

`writeDown` is shared by every layer. This proposal changes the buoy layer only (§7).

## 3. What a visitor should see instead

While the last good run is still inside the layer's freshness limit (4 hours for buoys):

- the buoys and counts from the last good run, drawn as now, with that run's own retrieval time, and
- a plain line on the Drifting buoys card saying the latest update failed and which run is shown.

Proposed card line (wording for GPT and Chad):

> Latest update failed at 16:07 UTC. Showing buoys from the 15:08 UTC run.

Once the last good run is older than the freshness limit, the layer becomes unknown and records are withheld, exactly as today.

Nothing is drawn that was not retrieved, and no time is moved forward: "retrieved … ago" keeps counting from the last good run.

## 4. Options

### H1 — the hub keeps the last good counts and adds a "last attempt" note (recommended)

On a failed buoy run, instead of the empty `down` envelope, the hub writes `latest-cells/drifters.json` as **the last good counts object unchanged, plus one added block**:

```json
"last_attempt": { "at": "2026-11-10T16:08:42.580Z", "status": "down", "http": 522,
                  "reason": "http_error", "consecutive_failures": 1 }
```

- `retrieved_at`, `cells`, `source_status` and everything else stay as the last good run wrote them, so the pair still matches and the times are still true.
- A good run writes both objects fresh, with no `last_attempt` block.
- `reason` is a short fixed code (`fetch_failed`, `http_error`, `refused_by_checks`), not the raw error text.
- If there is no last good counts object, or it is itself `down`, the hub writes the `down` envelope as today.
- The run is still logged `down` in `collector_runs` with its full note, as today.

No new route, no new R2 object, no extra read when serving. One extra R2 read on a failed run.

The page reads `last_attempt` from `/cells/drifters` and adds the card line. A page that does not know the field simply shows the last good run with its true retrieval time.

### H2 — one retry inside the same run (optional, independent of H1)

If the request fails to connect or returns a 5xx, wait 20 s and try once more before giving up. This would likely have turned the 10 Nov failure into a late success, but that is a guess from one event. It adds up to about a minute of wall time to a failed hourly run and one extra request to OSMC in that case only.

### P1 — page-only (not recommended)

`/snapshot/drifters` already carries the last good run's counts as well as its records, so the page alone could fall back to those when `/cells/drifters` says `down`. No hub deploy. But the place view (`/place`, built by the hub) would still withhold the buoys, and any other reader of the hub would still see the blank. The hub is the product; the fix belongs there.

### Leave as is

One blank hour in about eight days, self-healing, honestly labelled. A fair choice if this is not worth a hub release.

## 5. Decisions for Chad (after GPT)

| | Question | Lean |
|---|---|---|
| O1 | H1, H1 + H2, P1, or leave as is | H1; H2 only if GPT sees value from one event |
| O2 | Card wording (§3) | as written |
| O3 | State word on the card while a failed attempt is showing: stay as it is ("current"), or show "degraded" | "degraded", with the line as the reason |
| O4 | Freshness limit stays 4 h (up to three failed hours shown with the line, then unknown), or shorter | stay 4 h |
| O5 | A response our checks refuse (bad header, buoy count halved) is treated like a failed request | yes, with its own reason code |
| O6 | The place view says the same thing when it lists buoys from a run with a failed attempt after it | yes, one short clause |

## 6. What changes, if H1 is chosen

- **Hub (0.6.8):** `collectDrifters` failure paths call a buoy-specific write (last good counts + `last_attempt`); `/place` passes the block through for the buoy section (O6). No schema, cron, variable or R2 layout change.
- **Page:** `ME.freshness('drifters')` and the buoy card read `last_attempt`; Sources gets one sentence in the buoy section. `app.js` changes, so the `?v=` bump applies.
- **Unchanged:** validation rules, the pairing rule, history (`drifter_fixes` only ever takes good runs), health endpoints (none cover buoys), every other layer.

## 7. Scope

Buoys only. The same `writeDown` behaviour applies to every layer, but the others either run every 5–15 minutes (a failure clears quickly) or carry their own rules (fires' daily reset, ships' sampling). Extending the pattern to another layer would be its own proposal with its own evidence.

## 8. Tests

**Hub** (`drifters-hub.test.mjs`, real `collectDrifters` against a fake R2 and D1):

- good → 522: counts object equals the last good one byte for byte except the added block; `retrieved_at` unchanged; records object untouched; run logged `down`.
- two failures in a row: `consecutive_failures` 2, `at` moves, counts still the last good.
- failure → good: block gone, both objects from the new run.
- first run ever fails, and failure when the stored counts are already `down`: today's `down` envelope.
- refused response (O5): same as a failed request, reason `refused_by_checks`.
- the raw error text never appears in the published object.
- `/place` for a cell with buoys after a failure: buoys listed, with the clause (O6).

**Page** (browser suite, hub routed to fixtures built by the real hub code):

- failed attempt inside the limit: buoys drawn, counts shown, card line with both times, state word per O3, "retrieved … ago" from the last good run.
- last good run older than 4 h: unknown, records withheld, nothing drawn.
- recovery inside one open page through its own refresh: line gone.
- hub without the field (today's 0.6.7): page behaves exactly as today, including the blank after a `down` envelope.
- layer off: no buoy request, as now.

**Breaks, each must fail:** hub stamps the failed run's time onto the counts; hub keeps showing the block after a good run; page drops the line; page draws past the freshness limit; page treats a missing field as a failure.

Then the usual regression suites.

## 9. Release order and rollback

1. Branch build and tests; GPT review of the candidate.
2. **Page first.** With hub 0.6.7 the new page never sees `last_attempt`, so nothing changes for visitors. Own Approve line; served-hash check.
3. **Hub 0.6.8**, content only. Own Approve line; read-back; first scheduled buoy run read in D1.
4. The failure path cannot be triggered on production without breaking a real run, so it is proven by the tests and then watched: the next real failed run is read from D1 and the live page.

Rollback: hub back to 0.6.7 (`53ede31e…fb9e43`) and/or revert the page merge, each on its own line. They are independent: either half alone behaves like today or shows the last good run without the line.

Running cost: $0 expected (one extra R2 read and write on a failed run only).

## 10. Questions for GPT

1. Is H1's shape right: the last good counts object rewritten unchanged with an added `last_attempt` block, rather than a separate status object or route?
2. With hub 0.6.8 and a page that does not know the field (an old cached page), the last good run shows with its true retrieval time but without the failure line, for up to 4 hours. Acceptable, given the time shown is honest?
3. O3: should a failed latest attempt change the state word, or is the line enough?
4. H2: is one retry worth adding on the evidence of a single 522?
5. Anything in §8 that would pass while the defect is present?
