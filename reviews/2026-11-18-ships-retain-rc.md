# Review packet: `ships-retain-rc` — one publication rule for ships (hub 0.6.19 and the page)

Rev 1, 18 Nov 2026. Branch `ships-retain-rc` (from main `91f0cbb`; main has since moved to `bc462f7` with `STATUS.md` entries only), code commit `1989b17`. **Nothing deployed, nothing merged.**
Proposal: `docs/concepts/SHIPS-DIAGNOSTICS-PROPOSAL.md` rev 2.1, Parts B and C (on main; passed by GPT as a proposal). Chad's go, 18 Nov: "Go: build Parts B and C of SHIPS-DIAGNOSTICS-PROPOSAL rev 2.1 together on a new branch (hub and page; no deploy, no merge). Send GPT the candidate and review packet."

## 1. Files

| File | sha256 | |
|---|---|---|
| `phase1/worker.js` | `3b576033…36fb` | hub 0.6.19 |
| `app.js` | `d6d26c24…a30c` | `ME.shipsAttempt`, `ME.shipsSampleTime`; freshness, report, place row |
| `index.html` | `6a647a5c…5aaa` | ships card; cells not drawn when unpaired; `app.js?v=202612181100` |
| `sources.html` | `1e50e3b5…f90e` | `app.js?v=` only |
| `phase1/ships-retain-hub.test.mjs`, `phase1/ships-retain-ui.test.cjs` | see the commit | new suites |
| `phase1/ships-fallback.test.mjs` | | its in-memory storage now answers conditional writes and `head` |
| `phase1/quakes-ships-status-ui.test.cjs` | | one source-text check moved to the new ships path |
| `phase1/history-hub`, `wind-hub`, `sunface-hub` | | version pins 0.6.18 → 0.6.19 |

Not changed: `phase1/collector-mac.mjs`, `run.sh`, schedules, variables, D1 schema, the fallback's 40-minute and 25-minute rules, the hourly aggregation.

## 2. Hub: what was built (the block `SHIPS PUBLICATION RULE` in `worker.js`)

Both writers go through the same three functions: the Mac's upload (`ingest`, ships branch) and the hub's fallback (`collectShipsFallback`).

| Contract point | Where |
|---|---|
| 1. Eligible = ok or degraded and not overlong; a down attempt is not a sample | `shipsEligible` |
| 2. Retained sample kept exactly; counts file only gains or loses `last_attempt` | `shipsRecordAttempt` writes `{ ...S, last_attempt }` |
| 3. An ineligible attempt never becomes latest; archived and logged with its true status; never writes the records file | `shipsFailed`, `shipsOverlong`, `shipsRecordAttempt` |
| 4. `last_attempt` never renews the sample's life | the sample's `retrieved_at` is untouched; `shipsExpired` reads it |
| 5. Nothing to keep, or the sample is three hours old: a down-shaped counts file with a fixed phrase | `shipsRecordAttempt` (`keep` false) |
| 6. Both writers | `ingest` ships branch; `collectShipsFallback` (its two failure paths and its sample) |
| 7. Order by run time, also against `last_attempt`; delayed eligible sample keeps a later failure | `shipsRecordAttempt` (`stored`), `shipsCellsFor`, `shipsPublishEligible` |
| 7a. Records first, then counts, both conditional; loser re-reads once; retry exhausted stops; interrupted writer is withheld by readers and repaired by the next write | `shipsPublishEligible`, the repair step in `shipsRecordAttempt` |
| 8. Fallback scheduling reads the retained sample's own time | unchanged line in `collectShipsFallback`; a failure never touches `latest/ships.json` |
| 9. Archives keep the true status; hourly aggregates use ok samples only | `shipsStamp`; aggregation unchanged |

**Details a reviewer should know:**
- **Run metadata on the records object.** `latest/ships.json` is written with R2 custom metadata `{ run, retrieved_at, eligible }`, so an attempt can compare runs with a `head` and no 450 KB read. A records file written before 0.6.19 has none and is read once.
- **A second lock.** `shipsPublishEligible` refuses an ineligible envelope itself, whatever its caller did.
- **`last_attempt` fields:** `run`, `at`, `status`, `reason`, `collected_by`, `consecutive`, and for an overlong sample `elapsed_s`, `window_s`. `reason` is `sample_overlong` or a fixed failure phrase.
- **Public phrases.** A Mac failure's note is published only if it is one of mac-0.3.5's six fixed phrases; anything else becomes "collector reported a failure". The fallback's failures become "cloud fallback failed" (0.6.18 published the raw error text). An overlong sample with nothing to keep: "latest sample ran past its window and is not shown". Raw text stays in `collector_runs` and the dated `cells/ships/<stamp>.json` object.
- **`/place`:** the buoy rule now covers ships: a section with `last_attempt` is withheld once its sample passes three hours.
- **`/ingest/ships` answers** HTTP 200 as before, with `published`: absent for a published sample; `failure recorded; last sample kept`; `cells only (down)`; `not published: overlong sample; last sample kept` (or `; nothing to keep`); `archive only (older than latest)`; `left: not later than what is published`; `left: publish_conflict`; `publish_conflict (…)`; `publish_error`. The collector only prints this line.
- **A down-shaped counts file also carries `last_attempt`**, so order against it works the same way whether or not a sample was kept.

**Differences from the proposal's wording, for GPT's ruling:**
1. **`last_attempt` uses `at`, not a separate failed-at name, and the card prints the attempt's run time** ("Latest sample failed at HH:MM UTC" is when that sample began), because `at` is when the hub recorded it, which for a delayed upload can be much later.
2. **An interrupted eligible write answers HTTP 200 with `published: "publish_error"`** (the records are written; the counts are not). The collector treats 200 as delivered and does not retry. The next ships write repairs the pair. Returning an error instead would make the Mac retry the same sample, which would also repair it; say if that is preferred.
3. **Order between a Mac sample and a fallback sample is by `scheduled_for`** (each writer's own clock), where 0.6.18 compared `retrieved_at`. Both depend on the Mac's clock being close to the hub's. Not new, but stated.
4. **`consecutive` counts attempts applied since the retained sample**, and is set to 1 when a delayed sample is placed beneath a later failure (contract 7).

## 3. Page: what was built

- `ME.shipsAttempt(s)` gives one sentence, or nothing: "Latest sample ran 381.5 s against a 60 s window and is not shown." (elapsed and window from `last_attempt`), or "Latest sample failed at HH:MM UTC." It gives nothing for a down file.
- `ME.freshness('ships')` returns `partial` with that sentence plus "The sample in use ended HH:MM UTC" (the retained sample's own time), after the down and three-hour tests. So the badge, the report's state line, the Sources page, the cell inspector and search notes all carry it through the helper they already use.
- **Card:** "degraded"; the retained sample's count; "· **Latest sample … Showing ships from the HH:MM UTC sample.**" "Showing ships from" appears only while that sample's records are read and paired.
- **Unpaired** (records and counts from different runs): badge unknown, no count, "ship positions not shown", no vessel and no ships cell drawn; the attempt is still stated.
- **Report:** the ships figures are followed by "— latest sample failed at HH:MM UTC" (or the overlong wording).
- **Place row:** "· **latest sample failed at HH:MM UTC**; from the sample retrieved at HH:MM UTC".
- Three hours after the sample: unknown, "Last sample: N", as today. No sample to keep: as today, with the fixed phrase.

## 4. Tests

**`phase1/ships-retain-hub.test.mjs`: 27 passed** (2 min; two cases listen for the real 60 s). The real `worker.js` through `/ingest/ships`, `/admin/run/ships-fallback`, `/place`, `/cells`, `/snapshot`; in-memory R2 with conditional writes, metadata and hooks.
- eligible ok sample; ordinary low-flow sample published and retained;
- failure after a sample (counts keep the sample field for field; records untouched; raw note only in the log and dated object); unknown note text never public (four public routes checked);
- **the 381.5 s / 700-vessel upload after a 3,000-vessel sample:** latest unchanged, records still 3,000, `last_attempt` carries 381.5 and 60, archive holds the 700 as degraded and overlong;
- nothing to keep, for a failure and for an overlong sample;
- 2 h 59 min kept, 3 h not, `consecutive` 1 to 5, the sample's time never moved, an expired sample not brought back;
- recovery; older failure does not replace a later one; delayed eligible sample beneath a later failure; eligible sample older than latest archived only;
- `/place` with an attempt, and withheld at three hours;
- fallback scheduling: with failures recorded seconds ago the fallback still judges the sample's own age (not needed at 11 min; fires at 45 min), and its own failure is a fixed phrase;
- **forced interleavings (cases 14–24):** a failure losing its counts write to a newer sample, and to an older-run sample; a later failure, and an older failure, between an eligible sample's two writes (in between, `/place` withholds); a newer sample published while an older one is between its writes, and just before its records write; a writer stopped after its records write, repaired by the next failure, and by the next sample; retry exhausted for a failure and for an eligible sample; fallback and Mac failures at once, both orders;
- the fallback's own eligible sample, and its own overlong sample (clock moved 40 s mid-listen).
After every case that leaves two files: if records and counts name different runs, `/place` must be withholding.

**Hub breaks (13), `FAST=1` (the two 60 s cases skipped; every break fails in the fast cases):**

| Break | Failed cases |
|---|---|
| `overlong-publishes` (0.6.18's behaviour) | 5, 6, 9 |
| `overlong-guard-only` (ingest branch removed; the second lock answers "refused: not an eligible sample") | 5, 6, 9: the sample is still not published |
| `down-replaces-sample` (0.6.18's behaviour) | 2, 3, 5, 7, 12, 13, 15, 20, 23, 24 |
| `attempt-renews` | 2, 3, 5, 7, 12, 13, 15, 20, 23, 24 |
| `unconditional-cells` | 14, 15, 22, 24 |
| `unconditional-records` | 19 |
| `fallback-reads-attempt` | 13 |
| `older-failure-replaces` | 9, 24 |
| `delayed-erases-later` | 10 |
| `no-repair` | 17, 20, 23 |
| `raw-note-public` | 4 |
| `expired-kept` | 7 |
| `records-on-attempt` | 5, 6 |

The first version of `overlong-publishes` passed (it weakened only `shipsEligible`, and the ingest branch still caught the sample). It was rewritten to remove both, and the second lock was added to the hub.

**`phase1/ships-retain-ui.test.cjs`: 39 passed** (40 s). The real page in Chromium; every `/cells/ships`, `/snapshot/ships` and `/place` answer comes from the real `worker.js` in the test process, fed by `/ingest/ships`. Cases: good sample; failure after it (card, report, state line, cell inspector, place view, Sources page; the two times are checked to print differently and each in its place); the 381.5 s / 700 case (3,000 shown, never 700); low-flow sample retained; nothing to keep (failure; overlong); three hours after the sample, and three minutes before; unpaired files; recovery; **this page on hub 0.6.18** and **the 0.6.18-era page on this hub** (both from git `155af90`).

**Page breaks (8), each fails:** `no-attempt` 15, `n-from-sample` 2, `time-from-attempt` 6, `no-pair-check` 1, `draw-unpaired-cells` 1, `attempt-when-down` 1, `attempt-renews-life` 1, `report-silent` 3. `attempt-when-down` first passed (nothing checked the helper for a down file); a check was added and it now fails.

## 4a. Regression
Every suite in `phase1/` on the branch tree, 12:54–13:54 UTC, in the workspace (hub suites in Node, page suites in Chromium): **79 suites run (36 hub and collector, 43 page).**
- **76 passed outright.**
- `sunface-hub`: 170 passed, 1 failed on the first run: it pins the hub's User-Agent version. Pin moved to 0.6.19; rerun **171 passed**. That change is in the commit.
- `smoke-fixes`: 51 passed, 1 failed, "Sources 360: no page-level horizontal overflow". Fails the same way on main (the Sources fix that is queued next).
- `osmc-reliability-ui`: 40 passed, 1 failed, "old page: no page errors". Fails the same way on main.
- `terminator-ui` passed this run.
- Not run: `orbital.test.mjs`, `search.realdata.test.mjs`, `ships-probe.test.mjs`, `spacetrack-probe.test.mjs` (they call live services or need a key; none touches ships publication).
The one page suite that needed an edit: `quakes-ships-status-ui` line 27 read the hub source for the old ships `writeDown` call; it now reads for `shipsFailed`. 124 passed.

## 5. Live data (read-only)
- **Branch page files on the live hub (0.6.18), Mac's pane, 13:02 UTC** (`index.html` and `app.js` from `raw.githubusercontent.com` at `1989b17`, hashes matched): the live counts file was the Mac's 12:34 UTC failure (`down`, "ingested down: connect timeout (15 s)", no cells). The branch page showed unknown, "–", "no sample from the latest run", "collector reported down: ingested down: connect timeout (15 s)", no attempt sentence: the same as the released page. The hub's good 12:30:40 UTC fallback sample (3,194 vessels) was 32 minutes old and not shown: the case this branch changes.
- The new wording cannot be seen on live data until hub 0.6.19 is deployed (0.6.18 never sends `last_attempt`).

## 6. Not checked
- Production R2: conditional writes with custom metadata on `latest/ships.json` (the two conditional forms are already used in production by FIRMS, wind and others; `head` metadata by FIRMS).
- The hourly aggregation run end to end (its "ok only" filter is checked in the source text).
- A real overlong upload and a real failure against the deployed hub.
- Real phone, screen reader.
- CPU cost of the extra reads per attempt (one `get` of the counts, one `head` of the records; a repair reads the records once).

## 7. Release order and rollback (not approved; for later)
1. **Hub 0.6.19 first.** The released page ignores `last_attempt` and shows the retained sample (tested). One Approve line.
2. Read the next Mac failure or overlong upload in D1 and at `/cells/ships`.
3. **Page merge.** One Approve line. Then served-hash check and a live read.
Rollback: hub 0.6.18 (`ad5bce33…4132`); revert the page merge. A counts file with `last_attempt` left behind is read by 0.6.18 and the old page as an ordinary sample.
