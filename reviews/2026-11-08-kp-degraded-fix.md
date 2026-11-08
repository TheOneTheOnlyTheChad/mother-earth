# Kp / "degraded" fix — hub 0.6.1 + page wording — review (8 Nov 2026)

Branch `kp-degraded`. **Not merged, not deployed.** Implements the fix described in `reviews/2026-11-08-kp-degraded-finding.md` (rev 3), on Chad's go ("go on the Kp branch"). For GPT's review, then Chad's Approve lines.

## What changes
**Hub (`phase1/worker.js`, 0.6.0 → 0.6.1)**
- New `kpStatus(timeTag, nowMs)`. Its reference point is `time_tag` = the **interval start**. A value is `degraded` when it is **≥ 7.5 h** past its interval start: a provisional candidate policy, not a source deadline. An **invalid** `time_tag` → `degraded` (`time_tag_invalid`). A `time_tag` **> 5 min in the future** → `degraded` (`time_tag_in_future`). It is never `ok` without a usable timestamp.
- Envelopes gain `status_reason` (`null` when ok), saying which rule set `degraded`:
  - swpc: `observation_older_than_limit` / `time_tag_invalid` / `time_tag_in_future`. `index` also gains `interval_start`, `interval_end` and `age_reference`.
  - usgs: `feed_not_refreshed` (feed generated more than 600 s before retrieval; rule unchanged).
  - co2: `observation_older_than_limit` (7 days; unchanged). seaice: the same (5 days; unchanged).
  - ships, cloud fallback: `sample_overlong` / `sample_flow_below_standard` (rules unchanged).
- **Unchanged:** every other rule and threshold; forest (the page already has specific sweep wording); the Mac ships collector. Its envelope already carries `overlong_sample` and `connection_fraction_of_sample`, which the page reads, so no Mac runtime change is needed.
- `kpStatus`, `KP`, `collectSwpc` and `collectUsgs` are added to the test-only export list.

**Page (`app.js`; asset version `?v=202611141000` → `?v=202611151000` in both HTML files)**
- **Removed:** "the source flagged this observation as degraded" (every layer); "source degraded" in the Kp **and fires** summary lines. The fires one was found by the new test.
- New `ME.degradedWhy(layer, snap)` names **our** rule:
  - observation age: "older than our observation-age limit: the newest value is N old, measured from the start of its 3-hour interval / its date (our limit: N[, provisional]) — marked by our collector, not by the source";
  - usgs feed age;
  - Kp invalid / future timestamps;
  - ships: which sampling condition applied (flow < 90%, inferred from arrival gaps; or overlong) — "our sampling standard, not a statement about the source or the sea", never "late";
  - an unknown or missing reason (e.g. an older hub) → a neutral collection-quality sentence, no cause invented.
- Observation age (`status_reason`) stays separate from collector freshness (`stale_after_s`, handled first and unchanged).
- Kp is shown as an **interval**: card "interval 00:00–03:00 UTC (began … ago); 3-hourly product, timestamped at the interval start"; summary "Kp 5 for 00:00–03:00 UTC (…)".

## Tests
**New `phase1/kp-degraded.test.mjs`: 21/21.**
- Hub rule cases:
  - normal cadence (3.13 / 4.13 / 5.13 h);
  - delayed replacement (old value at 6.13 h);
  - the exact boundary (1 s under / at / 1 s over 7.5 h);
  - missing replacement (8.13 h);
  - invalid time_tags (string, null, undefined, number, empty);
  - future (beyond and within 5 min skew);
  - the measured 3.13–6.13 h window → 0 degraded.
- `collectSwpc` and `collectUsgs` envelopes over a fake fetch/R2/D1.
- Page wording for every layer: Kp, usgs, co2, seaice, both ships sources and both ship conditions, the unknown-reason fallback, and forest unchanged.
- No "source flagged/degraded" anywhere in `app.js`.

**Breaks bite:**
- The old 4 h rule swapped in (`OLD_RULE=1`): **7 fail**.
- Main's `app.js` with the new hub: **8 fail**.

**Regressions on the branch (container; real webfonts for widths):**
- hub/logic: drifters-hub 12, firms-guard 19, firms-v2 57 (+7 skipped, need `OLD_WORKER`), health-hub 29, history-hub 27, orbital-hub 13, orbital-ui 38, place-rows 7, plastic-hub 11, satellites-hub 12, search 111, search.realdata 50, ships-fallback 7, ships-late 7, ships-probe 11, solar 26, spacetrack-probe 11, duration-contract ok;
- UI: backdrop-layer 27, desktop-overflow 112, drifters-ui 25, kept-ui 21, mobile-pass 131, orbital-browser 113, plastic-ui 29, search-ui 104, smoke-fixes 52, terminator-behaviour 47, terminator-ui 19, ux-round1 34 — all pass.
- **place-ui 28/30:** the 2 known harness failures, identical on main. That fix is on the separate `place-ui-harness` branch (GPT-signed, unmerged).
- **One test edit:** health-hub H8 pinned `"collector_version":"0.6.0"` as its example of a non-note string that survives redaction. It now matches any version string, so the intent is kept without pinning.

`node --check app.js` and a module import of `worker.js` pass. sha256: worker.js `ae17e3602d0f1e63f2de1f66620cf0d8c7ae9ea313aafb02da4e0680cd81245d`.

## Not covered / open for review
- **Exact sentences.** The wording above is a proposal; GPT and Chad settle it.
- **The 7.5 h threshold is provisional.** A missing value is first flagged ~8.13 h after its interval start, ~2 h after it was due.
- **No live check yet.** The new `status_reason` only exists once 0.6.1 is deployed. Before the page release: a live RC check in a clean pane tab (START-HERE §5a) against the deployed hub, reading Kp, usgs and ships on real data.
- The Mac ships collector is unchanged. Its wording is derived on the page from fields it already publishes.

## Release order (each its own Approve line)
1. **Hub 0.6.1 deploy** (content only, from the reviewed commit; the browser-pane flow, START-HERE §4). Old pages keep working: an unknown `status_reason` field is ignored by the current page.
   - Check: `/` = 0.6.1; the next swpc run carries `status_reason`; a swpc run in the 4–6 h window reports `ok`; health 8/8.
   - Rollback = redeploy 0.6.0 (`ac173d8a…`); FIRMS v2 is unaffected.
2. **Page release** (fast-forward main → publishes): served-hash check, then a live read of the Kp card and summary.
   - If the page went out before the hub, it would still be honest: the neutral fallback, no "source flagged".
