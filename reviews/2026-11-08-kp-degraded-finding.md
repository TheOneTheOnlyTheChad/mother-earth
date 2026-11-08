# Kp "degraded" is a false signal — finding (8 Nov 2026, read-only) — rev 2

**Status: finding only. No hub, page or production change.** Any fix needs its own review and Chad's specific approval.

**Rev 2 (after GPT's review, 8 Nov):**
- Measurements qualified.
- The unsupported 7.1 h maximum removed; detection timing corrected.
- The wording fix widened to every affected active layer, with each layer's reason inspected.
- Kp's timestamp described as the interval start.
- GPT: diagnosis supported; threshold provisional.

**Relation to the 8 Nov smoke test:** GPT's smoke report recorded "Kp degradation explicitly disclosed", meaning the badge was shown. That report stands unchanged. This finding is appended to it and concerns whether the badge's diagnosis is correct.

## What was seen
The swpc (Kp) layer alternates between `ok` and `degraded` through the day, and the public page then shows "degraded" on the Kp card.

## Measured (Cloudflare D1, read-only, 8 Nov ~06:00 UTC)
- **When our collector first saw each value.** `kp_index.retrieved_at` is the time of our **first retrieval** of each 3-hourly value. It is not NOAA's exact publication time: the collector polls hourly at about :07, so a value could have been published up to an hour earlier.
  - 33 values, 4 Nov 00:00 to 8 Nov 00:00 UTC. 31 were first seen **3.13 h** after their `time_tag`; 2 were first seen **4.13 h** after it (the 21:00 intervals of 6 and 7 Nov).
- **Run status.** 102 swpc runs since 4 Nov:
  - **70 (69%) `degraded`**, source ages 14,879–22,079 s (4.13–6.13 h);
  - 32 `ok`, all ~11,280 s (3.13 h).
- **Oldest value shown.** The largest age any run reported is 6.13 h. That happened when a replacement was first seen at 4.13 h, so the old value was 6.13 h old at the run before.
- **What the evidence does not show:** that NOAA was on time at every degraded run. It shows that, in this window, each new value was first seen 3.13 or 4.13 h after its interval start, and that degraded runs fell in the hours before the next value. That pattern matches the rule's arithmetic, not lateness at the source.

## Cause
1. **The threshold ignores what `time_tag` means.** Each Kp value covers a 3-hour interval, and its `time_tag` is the interval **start**, not an instantaneous observation. That fits the 3.13 h first-retrieval lag above.
   - The rule in `collectSwpc` is `ageS < 4 h → ok, else degraded` ("Kp is 3-hourly; > 4 h is late").
   - So a value that arrives normally is ~3.1 h past its start when first seen, and the next hourly runs (4.1 h, 5.1 h) are flagged. Two of every three runs are degraded by construction.
2. **The page attributes the flag to the source.**
   - A `degraded` snapshot is graded `partial` with the reason *"the source flagged this observation as degraded"* (`app.js` ~314).
   - The readings summary adds "source degraded" (`app.js` ~375).
   - NOAA SWPC sets no such flag in this feed: the hub's age rule does. The sentence is untrue for Kp, and, as the inventory below shows, for every active layer.

## Inventory: who sets `degraded` on active layers (`phase1/worker.js` at `57debf2`, Mac collector)
| Layer | Rule that sets `degraded` | What it actually means | Honest explanation (to settle in review) |
|---|---|---|---|
| **swpc (Kp)** | newest `time_tag` ≥ 4 h old | our freshness rule (miscalibrated, above) | late by our freshness rule, with the reference point stated |
| **usgs** | feed's own generation time stale | our freshness rule on the feed's timestamp | the feed has not refreshed within our limit |
| **co2** | latest daily value ≥ 7 days old | our freshness rule | latest value older than our limit |
| **seaice** | latest daily value ≥ 5 days old | our freshness rule | latest value older than our limit |
| **forest** | every due cell still pending in a sweep | sweep progress (the page already labels it "partial"/"sweeping") | sweep incomplete; keep the existing specific label |
| **ships (cloud fallback)** | < 90% of the window with messages flowing, or overlong | **sampling quality**, not age | sample incomplete or overlong; **not** "late by our freshness rule" |
| **ships (Mac collector)** | overlong sample (> 1.25 × window), per the duration contract | **sampling quality** | sample overlong; not usable as a full sample |
| opensky | source time not advancing | parked layer, not public | — |

The fix keeps **observation age** (how old the source's value is) separate from **collector freshness** (when we last retrieved, `stale_after_s`). Where a cause is established it uses a specific explanation; otherwise it uses a neutral collection-quality wording. Exact sentences are for review.

## What it does not affect
- The Kp **values** shown and their dates. The page should still say the date is an interval start: "Kp 5 for 00:00–03:00 UTC" rather than "observed 00:00".
- `kp_index` history.
- Monitoring: no UptimeRobot monitor watches swpc, so no false alerts.

## Fix options (not done; each needs review + Chad's approval)
- **Kp threshold (provisional candidate, not a validated source deadline):** degraded when the newest value is **≥ 7.5 h past its interval start** (`time_tag`).
  - In this window it would have flagged 0 of 102 runs.
  - **Detection timing:** with hourly polling, crossing the line is seen at the next successful run. On the measured cadence, a replacement normally arrives when the old value is ~6.13 h past its start. A missing replacement would first be flagged at ~8.13 h, **about two hours after it was due**.
  - Tests needed: normal cadence; delayed value (4.13 h); missing value; invalid `time_tag`; `time_tag` in the future; the exact 7.5 h boundary (just under, at, just over).
- **Wording across all affected active layers** (table above). Inspect each reason; ships' sampling problem keeps its own explanation.
- **Kp interval wording** on the card and summary.
- The threshold and the wording are independent changes; both are hub + page work with their own review.
