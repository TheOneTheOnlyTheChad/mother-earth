# GIBS backdrop — measured fallback rule (PROPOSAL, 8 Nov 2026)

**Status: proposal only (HANDOVER item 4).** Nothing is built, deployed or changed. It needs GPT's review, then Chad's go per stage (§8). It touches the hub **and** the page.

## 1. Why
Since 8 Nov the backdrop is a fixed choice: NASA GIBS `VIIRS_NOAA21_CorrectedReflectance_TrueColor` for `IMG_DAY` = now − 36 h (`3375e91`). The 8 Nov measurement (`reviews/2026-11-08-gibs-noaa21.md`) shows that no fixed satellite is reliably the more complete one. Near-black share, 30°S–30°N:

| Day | NOAA-20 | NOAA-21 | Better |
|---|---|---|---|
| 4 Nov | 0.1% | 6.2% | NOAA-20 |
| 5 Nov | 13.2% | 37.0% | NOAA-20 |
| 6 Nov | 25.8% | 3.3% | NOAA-21 |
| 7 Nov | 8.0% | 0.2% | NOAA-21 |

The cause of the gaps is not established (NASA's VIIRS processing-delay alert; SNPP ended 2 Nov; REGISTER GIBS entry, R11). So the choice should follow measurement, not a guess.

## 2. The rule
For each candidate, measure the **near-black share** (R, G and B all < 12; the 8 Nov method) inside **66.5°S–66.5°N**. That band leaves out the polar night, which affects every candidate equally in any case.

Candidates, in order of preference:
1. the latest day (the page's current `IMG_DAY`), NOAA-21 and NOAA-20;
2. the day before, NOAA-21 and NOAA-20.

Choose:
- **the more complete satellite on the latest day**, if its share is at or under threshold *T*;
- otherwise **the more complete satellite on the day before**, if it is at or under *T*;
- otherwise **the least-black of all four**, published with a "no candidate met the completeness line" flag.

A tie (within 0.5 percentage points) goes to NOAA-21, today's default, so the backdrop doesn't flip on noise.

*T* is **not chosen in this proposal**. Four measured days are too few to set a threshold. §7 proposes how to set it.

## 3. Where it runs (hub, not browser)
Per the constitution, the hub is the product and the page is a client.
- **A small hub job, `backdrop`**, runs on the existing hourly cron (no new trigger). It does work only when there is something new to decide:
  - after 12:00 UTC, when `IMG_DAY` rolls;
  - then at a few later checks the same day, because GIBS layers fill in late.
  - Exact times are to be set after the bench.
- **It publishes `latest/backdrop.json`**, about 1 KB: `{ date, layer, sat, share_by_candidate, threshold, flag, measured_at, rule_version }`.
  - It is only overwritten after all candidates were measured.
  - On any failure the last good file is kept, with its own timestamps.
- **Hub endpoint:** `GET /backdrop`, read-only.
- **Page:** reads `/backdrop` and requests exactly the `layer` + `date` given.
  - If the file is missing, unreadable or older than 36 h, the page uses today's fixed default (NOAA-21, now − 36 h) and says so.

## 4. Measuring inside a Worker (the hard part)
Workers have no canvas or `createImageBitmap`, so the image has to be decoded in code.
- **Proposed:** request a **small PNG** (e.g. 512 × 256, `FORMAT=image/png`) per candidate, not the 2048 × 1024 JPEG the page shows.
  - PNG decodes with the runtime's `DecompressionStream` plus a short un-filter routine, with no new dependency.
  - Lossless, so the near-black test isn't blurred by JPEG artefacts.
- **Unverified, to be checked in the bench:**
  1. that GIBS WMS serves these two layers as `image/png` (the page uses JPEG today);
  2. that the 512 × 256 share agrees with the 2048 × 1024 JPEG share used on 8 Nov, within a stated margin, on the same days;
  3. CPU and wall time per run.
- **Fallback if PNG fails:** a pinned pure-JS JPEG decoder. That is a new dependency in `worker.js`, so a decision for review.

## 5. What the page says
- Label, label chip and Sources name the satellite and the date, as now, plus one honest line: **"chosen as the more complete of NOAA-21 / NOAA-20 for this date by our measurement at HH:MM UTC (dark share N% between 66°S and 66°N)"**.
- If the flag is set: **"no image met our completeness line; showing the least-dark one"**.
- In page fallback mode: **"fixed default (NOAA-21); our selection was unavailable"**.
- The existing qualified wording stays: "dated, not live"; "cause of gaps not established".
- Imagery stays the tier `imagery (dated; not live)`. The selection is **computed** and is labelled as ours.

## 6. Cost and load (to be measured, not assumed)
- GIBS requests: at most 4 small images per deciding run. A handful of deciding runs per day is roughly 8–20 requests a day, well under the page's own traffic to GIBS.
- R2: one ~1 KB write per decision. D1: optional; one row per decision for history (§9 Q4).
- **Expected new cost: $0** (inside Workers Paid's included usage). To be confirmed by the bench before any deploy; Chad decides on any line item.

## 7. Evaluation before anything ships (needs Chad's go; read-only)
1. **Bench (workspace + pane):** the three unverified points in §4, on the 4–8 Nov dates and following days.
2. **Shadow week:** a pane-side script, or the hub job with publishing off, records the four shares each day for ~7 days.
   - From that, propose *T*, show what the rule would have chosen each day, and how often it would have changed satellite or fallen back a day.
   - GPT reviews; Chad sets *T*.

## 8. Rollout (each stage its own Approve line)
1. Hub deploy with `BACKDROP_ENABLED` absent (a no-op), tests + breaks.
2. Variable on: publishing starts. Compare `/backdrop` against pane measurements for at least one rollover.
3. Page release reading `/backdrop`, under a guard test like `backdrop-layer` (it must fail on today's page).
- **Rollback:** remove `BACKDROP_ENABLED`. The page then falls back to the fixed default within 36 h, or immediately if the file is deleted (a separate Approve line).

## 9. Open questions (GPT / Chad)
1. Band 66.5°S–66.5°N for both hemispheres, or a solar-geometry mask (the page already computes day/night)? A mask is more exact but more code.
2. Should the "day before" fallback exist at all? Showing a 2–3 day old image might be worse than a gappier fresh one. Showing the age prominently would be the alternative.
3. Tie margin of 0.5 percentage points, or none?
4. Keep a D1 history row per decision? It is cheap and would feed R11's question about source behaviour.
5. Whether the fires layer should ever follow the same measurement. Out of scope here: FIRMS is a separate product and decision.

## Not in scope
FIRMS satellite choice; any change to fire detections; polar-cap imagery; aircraft (parked).
