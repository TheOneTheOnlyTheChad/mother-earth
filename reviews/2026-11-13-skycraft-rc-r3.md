# skycraft-rc — round 3 (GPT's review of round 2, `6b7adb5`, applied)

Chad relayed GPT's review on 13 Nov 2026: round 2 closes the lock-release and Sky return findings; one Parker failure path still needs a fix before the release steps. **Branch only. Nothing merged, deployed, uploaded, registered or scheduled.** Live unchanged: hub 0.6.11 `119cc641…801f`, page `bdf894f`.

Earlier packets: `reviews/2026-11-13-skycraft-rc.md` (round 1), `reviews/2026-11-13-skycraft-rc-r2.md` (round 2). They stand except where this file says otherwise.

## 1. GPT's finding and what changed

| | Finding (GPT) | Change |
|---|---|---|
| **P1** | A Parker **pointer** failure still skips the LRO capture: `craftUpdate()` can throw (GPT reproduced it by failing only the pointer read); the exception left `craftRun()` before the LRO request, and the job logged an internal error with one Horizons request. | In `craftParker`, the pointer update is now caught and returned as a Parker outcome: `parker pointer update failed`. The last good snapshot stays current; the LRO capture runs. |
| (same class, found while fixing) | Anything else either part throws could still take the other part down. | `craftRun` now catches around each part: an unexpected error in the Parker part becomes `parker internal error` (LRO still captured); an unexpected error in the LRO part becomes `lro study failed: internal error` (a published Parker snapshot stays published; the run is recorded degraded, not as an internal error). |

Not changed: the lock, the back-off rule (no answer, HTTP 429, HTTP 5xx), the source-tag and revision requirement, the probe wording, the Sky return, the pages.

## 2. Tests

- `skycraft-hub`: **164 passed** (was 156). New:
  - pointer **read** fails during publication → one run row `down`, note starts `parker pointer update failed`; two Horizons requests, one at a time; LRO stored; the previous snapshot is still current and still served; the lock is released by its owner;
  - pointer **write** fails → the same;
  - the Parker part throws unexpectedly → `parker internal error`, LRO still captured, snapshot kept;
  - the LRO part fails in storage → Parker published, run `degraded`;
  - an error outside both parts (the lock cannot be written) → recorded as an internal error, **no** Horizons request, no generic envelope, snapshot kept.
- **29 breaks, each fails** (new: `pointer-throws`, `parker-throw-escapes`).
- `skycraft-ui`: unchanged code path for the pages; 77 passed in the regression below.
- Full regression: 61 test files; 4 manual/network tools skipped; **57 run sequentially, 57 passed** (13 Nov 09:16:49–09:45:04 UTC, from the run log).

## 3. Carried, unchanged

- **Coverage gap, Parker, 20 Jan – 17 Feb 2027:** the current Horizons data sheet lists two segments for that span; the hub withholds those samples and the page shows no position there. If that sheet is still in use on 19 January 2027, the Sun page has no "today" position from 20 January until the sheet changes or a precedence rule is established.
- **Still not shown:** Worker reachability of Horizons; upstream receipt of the User-Agent (the probe reports the header the Worker sets); Worker CPU and wall time; the pages against the real hub; a real phone, Safari, a screen reader; any LRO prediction-error figure. GPT could not run the page suite (no Playwright on that Mac): the browser results are Claude's.

## 4. Release order (unchanged; each on Chad's own line)

1. GPT reviews this revision.
2. `Approve: upload the two skycraft example files to R2 ref/skycraft/ (craft-moon-2026-06-R1, craft-sun-2024-12-R1)`
3. `Approve: deploy hub 0.6.12 from <commit> (content only, SKYCRAFT_ENABLED unset) and run /admin/probe/skycraft once`
4. `Approve: run /admin/run/skycraft once`
5. REGISTER lines.
6. `Approve: set SKYCRAFT_ENABLED=1`
7. Live candidate check; Chad's look.
8. `Approve: push skycraft-rc to main (page change: Moon and Sun spacecraft pages, Sky Explore links, Sources section)`
