# Kp / "degraded" fix — hub 0.6.1 + page wording — review (8 Nov 2026), rev 3

## Rev 3 — after GPT's review of `0513aa7` (8 Nov): collector-to-page precision only
GPT independently verified kp-degraded 28/28, health-hub 29/29, app syntax and the full worker hash on `0513aa7`. It found one remaining issue: **the cloud collector rounded its reason fields before publishing** (75.04 s → `elapsed_s: 75`; 0.8999 → `fraction: 0.9`). The page then said "ran 75 s … over our 75 s limit" and "flowed for 90% … below our 90% standard". Rev 2's page tests fed unrounded fields directly, so they missed it.

**Changes:**
- **Hub:** the cloud reason is now built by one exported function, `shipsReason(wallS, upFrac, windowS, overlong)`, used by `collectShipsFallback`.
  - It publishes the measured values **unrounded** (`elapsed_s`, `fraction`) plus `limit_s`; the page formats them.
  - Nothing else in the cloud envelope changed. The top-level `elapsed_wall_s` etc. keep their existing rounding.
- **Mac collector unchanged** (it publishes `elapsed_wall_s` to 0.1 s). On the page, when `overlong_sample` is true but the reported tenths value does not exceed the limit, the sentence states that the sample **exceeded** the limit and that the reported figure is **rounded to 0.1 s**, with no invented digits.
  - The same "exceeded" wording, without the rounding note, is used if a cloud value is so close to the limit that two decimals still don't show it above (e.g. 75.0001 s).
- **Tests through the generated fields:**
  - Cloud cases are now built by the hub's own `shipsReason`, JSON round-tripped as published, then rendered: 76, 75.04 and 75.0001 s overlong; 0.899 and 0.8999 flow.
  - Mac cases use only tenths values (76.3 s; a rounded 75.0 s with `overlong_sample: true`; 0.899 / 0.8999 flow).
  - The rev 2 test that supplied unrounded fields directly is replaced by these two.

**Rendered (rev 3):**
- Cloud 75.04 s: "the sample ran 75.04 s against a 60 s window, over our 75 s limit (1.25 × the window), so it is not counted as a full sample — …".
- Cloud 75.0001 s: "the sample exceeded our 75 s limit (1.25 × the 60 s window), so it is not counted as a full sample — …".
- Cloud 0.8999: "messages flowed for 89.9% of the 60 s sample (inferred from arrival gaps), below our 90% standard — …".
- Mac reported 75.0 s (overlong): "the sample exceeded our 75 s limit (1.25 × the 60 s window); its reported duration, 75 s, is rounded to 0.1 s, so it is not counted as a full sample — …".

**Tests (rev 3):**
- kp-degraded **29/29**.
- Breaks:
  - `SHIPS_ROUNDED=1` (rev 2's rounding swapped into the generated reason) → the generated-fields test **fails**;
  - rev 2's `app.js` (`0513aa7`) → **2 fail** (cloud generated fields; Mac rounded 75.0 s).
- Regressions: all hub suites pass (ships-fallback 7/7, which exercises `collectShipsFallback`; health-hub 29; firms-v2 57 + 7 skipped; the rest as in rev 2); UI backdrop-layer 27, desktop-overflow 112, drifters-ui 25, kept-ui 21, mobile-pass 131, orbital-browser 113, plastic-ui 29, search-ui 104, smoke-fixes 52, terminator-behaviour 47, terminator-ui 19, ux-round1 34; place-ui 28/30 = the known harness failures. Run on the final rev 3 tree; container results remain Claude-supplied evidence.
- worker.js sha256 `f38296a0183d14d958d5815d7926254cb4275be7ca00b384334974fad5b12cc8`.

---


## Rev 2 — after GPT's review of `67140b0` (8 Nov)
GPT verified kp-degraded 21/21, health-hub 29, history-hub 27, firms-guard 19, firms-v2 57 (+7 skipped), ships-late 7, the old-rule break (7 fail), syntax/module load and the worker hash. It asked for three fixes and two evidence corrections before release sign-off. All are done:

1. **Invalid / future Kp timestamps no longer leak into the card or summary.**
   - New `ME.kpWhen(t)` guards the interval and the relative time together; it drives both the card (`R.swpc.observed`) and the report.
   - An unusable timestamp gives "interval time unknown — the source's timestamp could not be read". A future one gives "interval HH:MM–HH:MM UTC, timestamp later than our clock", never a negative age.
   - `ME.kpInterval` returns `null` (no text) when the timestamp is unusable.
   - Tested on the actual `ME.readings()` card and `ME.report().text` output for normal, invalid (`'garbageZ'`, `''`, `null`) and future timestamps.
2. **Missing USGS generation time is no longer described as expired.**
   - The hub gives a new reason, `feed_age_unknown` (no `age_s`); the outcome is still `degraded`.
   - Page: "the feed gave no usable generation time, so its age is unknown and our 10 min feed-age limit could not be applied — marked by our collector, not by the source".
   - The same unknown-age guard applies to `observation_older_than_limit` without a usable age.
   - Collector-to-page test: `collectUsgs` with no `metadata.generated` → envelope → `ME.freshness('usgs')`.
3. **Ships wording keeps the condition visible.**
   - Durations in seconds, with two decimals when one would round onto the limit.
   - The limit is stated in seconds ("over our 75 s limit (1.25 × the window)").
   - The flow fraction is rounded **down** to one decimal, with "below our 90% standard".
   - Tested for both the cloud reason codes and the Mac envelope at 76 s, 75.04 s, 89.9% (0.899) and 89.99% (0.8999).
- **Clock-skew boundary:** exactly 300 s ahead → ok; 301 s → degraded (`time_tag_in_future`).
- **Evidence corrections:**
  - the worker comment no longer says "while the source was on schedule";
  - the synthetic-ages test is renamed ("synthetic ages sampled across the reported 4–8 Nov range … not a replay of the 102 measured runs").
- **Policy wording per GPT:** 7.5 h is a provisional Mother Earth policy, not a NOAA deadline. 5 min is an explicit clock-skew tolerance, not a measured source guarantee.

**Rev 2 rendered wording (from the branch's `app.js`):**
- Kp normal: card "interval 05:00–08:00 UTC, began 2.1 h ago; 3-hourly product, timestamped at the interval start"; report "Kp 5, interval 05:00–08:00 UTC, began 2.1 h ago (NOAA SWPC)".
- Kp invalid: "interval time unknown — the source's timestamp could not be read; …" / "Kp 5, interval time unknown — the source's timestamp could not be read (NOAA SWPC)".
- Kp future: "interval 10:03–13:03 UTC, timestamp later than our clock".
- Kp late: "older than our observation-age limit: the newest value is 8.1 h old, measured from the start of its 3-hour interval (our limit: 7.5 h, provisional) — marked by our collector, not by the source".
- USGS, no generation time: "the feed gave no usable generation time, so its age is unknown and our 10 min feed-age limit could not be applied — …".
- Ships, 76 s: "the sample ran 76 s against a 60 s window, over our 75 s limit (1.25 × the window), so it is not counted as a full sample — our sampling standard, not a statement about the source or the sea".
- Ships, 0.8999: "messages flowed for 89.9% of the 60 s sample (inferred from arrival gaps), below our 90% standard — …".
- Neutral: "below our collection-quality standard for this layer — marked by our collector, not by the source".

**Rev 2 tests:**
- kp-degraded **28/28**.
- Breaks: the previous branch commit `67140b0` → **10 fail** (each of GPT's reproduced issues); main's `app.js` → **13 fail**; `OLD_RULE=1` → **8 fail**.
- Regressions: hub/logic — drifters-hub 12, duration-contract ok, firms-guard 19, firms-v2 57 (+7 skipped), health-hub 29, history-hub 27, orbital-hub 13, orbital-ui 38, place-rows 7, plastic-hub 11, satellites-hub 12, search 111, search.realdata 50, ships-fallback 7, ships-late 7, ships-probe 11, solar 26, spacetrack-probe 11; UI — backdrop-layer 27, desktop-overflow 112, drifters-ui 25, kept-ui 21, mobile-pass 131, orbital-browser 113, plastic-ui 29, search-ui 104, smoke-fixes 52, terminator-behaviour 47, terminator-ui 19, ux-round1 34 — all pass; place-ui 28/30 = the 2 known harness failures (fix on `place-ui-harness`). These ran in the container before the final one-line wording change (the invalid-timestamp brackets → a dash); kp-degraded was re-run after it (28/28). Container results remain Claude-supplied evidence.
- worker.js sha256 `4ddfccb26ee0d893a3f57e2d01eefe436d695e90fc414eaf94a667364450b69c` (rev 1 was `ae17e360…`).

---

## Rev 1 (`67140b0`)

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
