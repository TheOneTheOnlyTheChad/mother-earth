# GIBS backdrop — measured selection rule (PROPOSAL rev 2, 8 Nov 2026)

**Status: proposal only (HANDOVER item 4).** Nothing is built, deployed or changed, and no bench or shadow record is authorised. It touches the hub **and** the page.

**Rev 2 (after GPT's review, 8 Nov):**
- "More complete" and "completeness" are replaced with the measured criterion.
- Illumination limits are stated.
- No-data, failure and bounded-decoding handling are specified.
- Rankings are compared, not just percentages; the tie margin is justified.
- The day-before option is made Chad's explicit decision; same-date selection is evaluated first.
- Rollback is fixed.
- A workspace/pane shadow record is separated from a deployed hub job.
- Limits on what seven days can show are stated.

## 1. Why
Since 8 Nov the backdrop is a fixed choice: NASA GIBS `VIIRS_NOAA21_CorrectedReflectance_TrueColor` for `IMG_DAY` = now − 36 h (`3375e91`). On 4–7 Nov, neither satellite had the lower near-black share every day (`reviews/2026-11-08-gibs-noaa21.md`). 30°S–30°N:

| Day | NOAA-20 | NOAA-21 | Lower near-black share |
|---|---|---|---|
| 4 Nov | 0.1% | 6.2% | NOAA-20 |
| 5 Nov | 13.2% | 37.0% | NOAA-20 |
| 6 Nov | 25.8% | 3.3% | NOAA-21 |
| 7 Nov | 8.0% | 0.2% | NOAA-21 |

The cause of the dark areas is not established (NASA's VIIRS processing-delay alert; SNPP ended 2 Nov; REGISTER GIBS entry, R11).

## 2. The criterion, and what it does not measure
- **Measured criterion:** the **near-black pixel share** (R, G and B all < 12; the 8 Nov method), inside a fixed band, **66.5°S–66.5°N**.
- **It measures appearance, not completeness.** A near-black pixel can be missing imagery, night or low sun, a dark surface, or deep shadow. The criterion does not tell these apart. The page must not call the result "complete" or "more complete".
- **Illumination is not equalised.** The fixed band leaves out the polar caps but does not establish equal illumination across candidates. The two satellites cross at different times, so the sunlit area each image covers can differ. Comparing satellites on the same date limits the difference; it does not remove it. A solar-geometry mask is an open alternative (§10).

## 3. The rule (stage 1: same date only)
- **Candidates:** the page's current date (`IMG_DAY`), NOAA-21 and NOAA-20.
- **Choose:** the candidate with the **lower near-black share**.
  - A tie goes to NOAA-21, today's fixed default, so the backdrop doesn't change on measurement noise.
  - The **tie margin is not fixed here.** It is set from the bench (§6): it must be at least the share difference that the resolution/format comparison shows can flip a ranking. Until that is measured there is no justified number. Rev 1's 0.5 pp is withdrawn.
- **No threshold *T* in stage 1.** Choosing between two same-date candidates needs only their ranking.

**The day-before option is Chad's decision, not part of stage 1.** Showing an older image with fewer dark areas trades freshness for appearance. GPT prefers evaluating same-date selection first. If Chad later wants the day-before option, it comes back as its own proposal with its own threshold, set from evidence.

## 4. Where it runs (hub, not browser)
The hub is the product; the page is a client.
- **Hub job `backdrop`**, on the existing hourly cron (no new trigger).
  - It decides after 12:00 UTC (when `IMG_DAY` rolls), then re-measures a few times that day, because GIBS layers can fill in late. Exact times are set after the bench.
- **Publishes `latest/backdrop.json`** (~1 KB): `{ date, layer, sat, near_black_share_by_candidate, criterion, band, measured_at, rule_version }`.
  - Written only after both candidates were measured successfully.
  - On any failure, the last good file stays, with its own timestamps.
- **Hub endpoint:** `GET /backdrop`, read-only.
- **Page:** requests exactly the `layer` + `date` given. If the file is missing, unreadable, or for a date other than the page's current `IMG_DAY`, it uses the fixed default (NOAA-21) and says so.

## 5. Measuring inside a Worker
Workers have no canvas, so the image is decoded in code.
- **Proposed:** a **small PNG** per candidate (e.g. 512 × 256, `FORMAT=image/png`), decoded with the runtime's `DecompressionStream` plus a short un-filter routine. No new dependency.
- **Bounded decoding:** fixed request size; reject any response over a byte cap before decoding; check PNG dimensions against the request before allocating; cap decompressed bytes at width × height × channels; abort on any mismatch.
- **No-data / transparency:**
  - If GIBS returns an alpha channel, transparent pixels are counted **separately as no-data**, not as near-black.
  - The criterion reports `near_black`, `no_data` and `valid` counts. The share is computed over the band's pixels with no-data counted as dark, the conservative choice for appearance, and stated so.
  - A candidate that is all no-data is ineligible.
- **Failed responses:** non-200, a non-image content type, an XML service exception (GIBS returns these with 200 on some errors), a timeout or a decode failure all make that candidate **unmeasured**.
  - If either candidate is unmeasured, no new selection is published; the last good file stands.
  - Failures are logged as runs.
- **Unverified, for the bench:**
  1. that GIBS WMS serves both layers as `image/png` (the page uses JPEG today), and whether with alpha;
  2. that the small PNG gives the **same ranking** as the page's 2048 × 1024 JPEG on the same dates, as well as how close the percentages are;
  3. CPU and wall time per run.
- **Fallback if PNG is not served:** a pinned pure-JS JPEG decoder. That is a new dependency in `worker.js`, a decision for review.

## 6. Evaluation — two separate things, each on Chad's go
1. **Bench + shadow record in the workspace / browser pane (read-only; no hub or resource change).**
   - Points 1–3 of §5, run against the page's own JPEG.
   - Then a daily record of both candidates' shares, rankings and flips for about 7 days.
   - Output: how often the rule would change satellite, how often rankings disagree across resolutions/formats (which sets the tie margin), and the decoded bytes and CPU estimate.
2. **A deployed hub job, even with publishing off, is not read-only.** It is a hub deployment that writes resources (run logs). It belongs to the rollout (§8), not the evaluation.

**What seven days can show:** enough to inform a provisional rule. It cannot establish seasonal reliability: illumination and swath geometry change through the year, and the current gaps have an unknown cause. The rule stays labelled provisional, with a re-check date.

## 7. What the page says
- The label, chip and Sources name the satellite and the date, as now, plus one line:
  - **"chosen by our measurement: lower dark-area share of NOAA-21 / NOAA-20 for this date (N% vs M%, 66°S–66°N, measured HH:MM UTC); dark areas may be night, low sun or missing imagery"**.
- In fallback mode: **"fixed default (NOAA-21); our measured selection is unavailable"**.
- Unchanged: "dated, not live"; "cause of gaps not established"; tier `imagery (dated; not live)`. The selection is labelled **computed** and ours.

## 8. Rollout (each stage its own Approve line)
1. Hub deploy with `BACKDROP_ENABLED` absent (a no-op), tests + breaks.
2. Variable on: publishing starts. Compare `/backdrop` with pane measurements for at least one rollover.
3. Page release reading `/backdrop`, under a guard test like `backdrop-layer` that must fail on today's page.

**Rollback (fixed in rev 2):** removing `BACKDROP_ENABLED` stops new selections. The page **ignores any file whose date is not the page's current `IMG_DAY`**, so a stale selection is used for **at most the rest of that image day** (until the next 12:00 UTC rollover), not 36 h. For an **immediate** return to the default there are two options, for Chad to choose which exists before stage 3:
- **(a)** a hub variable `BACKDROP_FORCE_DEFAULT=1`, which makes `/backdrop` answer "default"; a variable change is its own Approve line;
- **(b)** deleting `latest/backdrop.json`, a resource delete with its own Approve line.

## 9. Cost and load (unverified)
- GIBS: at most 2 small images per deciding run; a few deciding runs a day.
- R2: one ~1 KB write per decision.
- Expected to stay inside Workers Paid's included usage, but **cost is unverified until measured**. Chad decides on any line item.
- **D1 history: optional.** Only if a purpose is shown, for example answering R11-style source-behaviour questions. Not part of stage 1.

## 10. Open questions (GPT / Chad)
1. Fixed band vs a solar-geometry mask (the page already computes day/night). The mask is more exact, but more code.
2. Whether to add a day-before option later (Chad's freshness-vs-appearance decision).
3. How no-data should count in the share (§5 proposes dark, conservatively).
4. The re-check date for the provisional rule.
5. Whether the fires layer should ever follow a similar measurement. Out of scope: FIRMS is a separate product.

## Not in scope
FIRMS satellite choice; any change to fire detections; polar-cap imagery; aircraft (parked).
