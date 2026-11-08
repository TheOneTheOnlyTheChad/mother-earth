# Mother Earth — handover (8 Nov 2026, end of the Phase 0 / backdrop thread, ~05:30 UTC; §0 table partly from 6–8 Nov)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4d D1 · §5a testing), then this file, then `STATUS.md` (newest first; threads 1–13 in `docs/STATUS-ARCHIVE.md`). **Not a fresh sandbox; don't repeat completed reviews.**

**Access (Chad, 4–5 Nov):** full access — GitHub (push), Cloudflare, Space-Track, the Mac's Mother Earth folder and `~/mother-earth`, browser pane. Chad enters secrets himself; Claude never creates accounts. **Every deploy, schedule or variable change, D1 schema change and push to main that changes the public page needs Chad's explicit go.** Production deploy clicks are Chad's (§3). **Say up front whenever Chad must be at the screen with the app in front** (standing rule). **Production approvals (thread 16): the session's auto-mode safety check lets a production action through only when Chad's message names that exact action — a bare "go" is not enough. So end any message that needs a production action with a ready line, e.g. `Approve: deploy hub commit <sha> (content only)` or `Approve: copy <files> into R2 recovery/`, and Chad replies with it.** Non-production work: "go" is fine. GPT reviews; approvals are Chad's. Not Overwatch: presentation lessons only. No surveillance, ever.

## 0. Live state (updated 8 Nov by the FIRMS memory thread: rollout closed, merged; rest as of 6–7 Nov)
| | State |
|---|---|
| **Page** | main, assets **`?v=202611151000`** (`ad4002b`: Kp interval + honest degraded wording, released 8 Nov 08:11:22 UTC; before that `3375e91` GIBS NOAA-21). Served hashes verified. |
| **Hub** | **0.6.1 live since 8 Nov 07:58:25 UTC** (Kp from interval start, provisional 7.5 h; `status_reason` per layer); worker.js sha256 `f38296a0…2cc8`; **main = live** (merge `ad4002b`). Rollback = redeploy 0.6.0 `ac173d8a…58ea`. FIRMS v2 ON since 7 Nov (rollout closed 8 Nov). Variables `FIRMS_PIPELINE=v2`, `FIRMS_CREATE_ONLY=verified` (19 bindings). Includes the v2 streaming FIRMS pipeline, `/admin/probe/r2-conditional` and the header-only parser fix. **Rollback = delete `FIRMS_PIPELINE`** (tested). Do not redeploy unchanged 0.5.3: nightly parser bug. |
| **D1** | **+ 5 `firms_*` tables + 3 indexes (6 Nov 19:59:43–20:00:03 UTC, FIRMS v2 state).** 9 history tables + 8 indexes **+ `archive_checkpoint_coverage` (empty) + index `collector_runs_layer_finished`** (both created 6 Nov 05:37 UTC, live = `2ee3a62` schema). |
| **History** | ON since 5 Nov 10:21 UTC — keep on. First midnight checkpoint (5 Nov) completed; **fires part is partial** (input 15:30 UTC: the 4 MB guard skipped 15:45–23:45). Details STATUS. |
| **FIRMS** | 8 MiB guard live; first 0.5.2 run 06:00 UTC ok (57 ms CPU). First runs over 4 MB due 6 Nov afternoon UTC — check scheduled 14:20 UTC. |
| **Branch** | `firms-memory` **merged into main** (8 Nov); deleted on GitHub (gone by 8 Nov ~06:00 UTC). Its tests, bench and review are on main: `phase1/firms-v2.test.mjs` 64/64 (with `OLD_WORKER`), `phase1/firms-v2-breaks.mjs` 39/39, `phase1/bench-firms-memory/`, `reviews/2026-11-06-firms-v2-build.md`. `aircraft-rc` is parked and predates 0.6.0: rebuild it on main, never deploy it as-is. |
| **Tests** | All hub suites pass on the branch; orbital-browser 113/113 on main. |

## 1. Next
**Ordered for the next thread (8 Nov ~05:30 UTC; updated ~06:45):**
0. ~~Kp "degraded" fix~~ **DONE 8 Nov: hub 0.6.1 live 07:58:25 UTC; page released 08:11:22 UTC (main `ad4002b`); main = live.** Next choice (Chad): a terms review (R2/R3/R4/R6) or the GIBS bench (`docs/BACKLOG-VIEW-2026-11-08.md`). Branch `kp-degraded` can be deleted (Chad).
1. ~~GPT's live smoke test~~ **DONE 8 Nov 05:14–05:20 UTC: no blocking regression in the checks completed (not exhaustive; STATUS 8 Nov).** Still open from it: actual-phone test, imagery-date rollover at noon UTC (booked 11:50 UTC). "Everything here" UI and all orbital categories checked by Claude 05:47–05:50 UTC (pane, 588 px): pass — supplements GPT's test, not independently reviewed by GPT; not real-phone, not exhaustive orbital-inspector coverage. Also open: uncaptured browser HTTP status codes. No fix or further testing authorised; any proposal needs review + Chad's specific approval.
2. **Phase 0 Planet, with Chad** (iPhone skipped 8 Nov; recommendation DRAFTED — `docs/research/P0-RECOMMENDATION-DRAFT.md`, rev 3 after GPT 8 Nov; iPhone runs pending Chad's availability, not a dependency): three iPhone Safari loads, screen-recorded (time to globe visible, time to first drag response) plus direct interactivity. Then a short **Phase 0 recommendation** comparing the gates, for Chad's separate domain-selection decision. Resume point `bad819a` + `docs/research/P0-CHECKPOINT.md`.
   - Arts: scoped gate cleared, not selected. Life: scoped block, stopped. Aircraft: parked (research included).
   - No prototype, collector, resource, production change, deploy or merge.
3. **place-ui harness fix — DONE on branch `place-ui-harness` (`601b899`), 30/30; GPT technical sign-off 8 Nov; merge awaits Chad's Approve line.** Was: its fake R2 lacks `head()`, which hub 0.6.0 uses, giving 2 pre-existing failures (28/30, identical before and after the backdrop release). Branch → small review → merge with Chad's go. No hub code change.
4. **GIBS measured selection — PROPOSAL rev 3 after GPT (`docs/GIBS-FALLBACK-PROPOSAL.md`):** same-date satellite selection by dark-area score; a workspace/pane bench + shadow record needs Chad's go; a hub job is a separate rollout. *(The earlier idea "most complete of NOAA-21 / NOAA-20, latest day, else the previous day" is SUPERSEDED by rev 2/3: "completeness" is not measured, and a day-before option is Chad's separate decision.)* Evidence: `reviews/2026-11-08-gibs-noaa21.md`, REGISTER GIBS entry.
5. Left open by decision (each needs its own review and go): FIRMS empty-input retry; raising the 8 MiB guard.
6. GitHub branch clean-up (Chad; the session proxy can't delete refs): `gibs-noaa21` (= main ancestor), `firms-memory` (merged). `aircraft-rc` stays parked — never deploy it as-is.
7. ~~Mac copies~~ **synced 8 Nov ~05:45 UTC (167/167 = main `c151306`).** Was: Mac copies of STATUS / HANDOVER / START-HERE and the Phase 0 files were **not** synced this thread (no Mac-shell use was approved during Phase 0). Sync at the next handover if Chad grants `~/Documents/Mother Earth` and approves the Mac shell. Stale extras on the Mac: `~/Claude/phase0-life/P0-life-gbif.md` (rev 1) and `_to_delete/me-sync` (Chad bins).

**Older items below are kept for the record.**
0. **Phase 0 position (7 Nov ~13:25 UTC):** Arts CLEARED for the limited feasibility gate (metadata-only view of the Met's catalogued places of making, 479 objects / 25 countries; qualifications in `docs/research/P0-arts-planet-recovery.md` and `P0-CHECKPOINT.md`); may be recommended first, not selected. Planet cold load and desktop width DONE 7 Nov 13:32–13:43 UTC (Chrome Guest; `docs/research/p0-recovery/planet/`). **Next action: iPhone Safari runs (Chad, another day; screen recordings), then a Phase 0 recommendation for Chad's separate domain-selection decision. Life stopped; aircraft parked; no prototype, collector, resource, production change, deploy or merge. The pane belongs to the FIRMS thread when the Mac is open; 8 Nov 02:40–03:00 SAST reserved.
1. **Monitor 0.5.2 (deployed 6 Nov 05:53:57 UTC, verified) — schedule these in the new session (thread 16's check-ins were cancelled at handover):** **~14:20 UTC 6 Nov** — first FIRMS runs over 4 MB: `collector_runs` firms ok with records (not "resource guard"), raw sizes in `raw/firms/2026-11-06*`, Exceeded Memory = 0 (Worker metrics / telemetry), CPU per firms tick, `/status` `collection.firms`; if still under 4 MB, check again ~16:00. **~00:50 UTC 7 Nov** — `archive_checkpoints` + `archive_checkpoint_coverage` for 6 Nov (`assessed_with_checkpoint = 1`), 5 Nov coverage backfilled (`= 0`), `fires_daily` 6 Nov, drifter full day (rows + bytes), CPU of the 00:30 ticks. All read-only. If Exceeded Memory appears: tell Chad; rollback = redeploy 0.5.1 from `8c8633d` (`1f34554b…`), with an Approve line. Production memory is not guaranteed by the bench (one sampled 112 MB heap peak at 8 MiB under overlap).
2. ~~5 Nov fires recovery~~ **WRITTEN to R2 6 Nov 08:19:35 UTC and verified** (`archive/recoveries/firms/2026-11-05.json.gz`, sha256 `624ecf2e…`; review §10). D1 recovery tables wait for an agreed querying requirement. The procedure's byte-transfer step needs fixing before reuse (review §10). Showing recovered data anywhere is a separate, later decision.
3. ~~Merge `firms-guard` → `main`~~ **DONE 6 Nov ~08:05 UTC** (`909e8cd`; worker.js on main = live 0.5.2). Branch `firms-guard` can be deleted on GitHub (Chad; the session proxy refuses ref deletes).
3a. ~~Smoke-review fixes~~ **PUBLISHED 6 Nov 10:03 UTC** (main `e107c1d`, assets `?v=202611131000`; served hashes verified; public checks passed — STATUS).
3b. **Monitoring LIVE: hub 0.5.3 + UptimeRobot (8 monitors, Free, phone push tested with the Mac closed 6 Nov).** `hub-health` **merged to main as `59f4cda`** (main = live 0.5.3); the branch can be deleted on GitHub (Chad). FIRMS memory design rev 3 (`docs/FIRMS-MEMORY-DESIGN.md`, design only) awaits GPT. Chad decides when routine overnight check-ins retire. Original plan: from GPT's brief (`docs/briefs/2026-11-06-monitoring-and-memory.md`): `/health/*` endpoints for UptimeRobot (external; free plan terms to confirm), review `reviews/2026-11-06-hub-health.md`, design `docs/FIRMS-MEMORY-DESIGN.md`. Next: GPT review → Chad's go → deploy with an Approve line → UptimeRobot setup by Chad → acceptance test (alert on his phone with the Mac closed) → retire routine overnight check-ins.
3c. ~~Fix: header-only FIRMS file after midnight logged as malformed~~ **FIXED in 0.6.0 and proven live** (8 Nov 00:00–00:45 UTC runs took the boundary path; health 8/8).
3d. ~~FIRMS memory v2 rollout~~ **CLOSED 8 Nov** (stage 6 passed, GPT accepted; merged `0891d13`). Left open by decision:
   - the bounded empty-input retry (refining it needs its own review);
   - raising the 8 MiB guard (a separate decision; bench: v2 completed 16/32/64 MiB within 64 MB in a bench copy);
   - ~~the GIBS backdrop fix~~ **NOAA-21 switch RELEASED 8 Nov** (`3375e91`); a measured fallback rule stays a separate proposal (hub work, own review and go); real-phone check outstanding.
   - place-ui harness: 2 pre-existing failures (its fake R2 lacks `head()`, used by hub 0.6.0) — a small test-only fix, not yet done.
4. ~~Drifter first full day~~ **6 Nov: 17,915 rows / 1,302 buoys / ≈2.1 MB content** (STATUS 7 Nov).
4b. **Drifter first full day (6 Nov)** — rows/day + bytes after 00:30 UTC 7 Nov (the 5 Nov partial-day estimate ~23,700/day is provisional).
5. ~~Plastic's first archived version~~ **arrived 6 Nov 06:08 UTC.**
6. **Research backlog** (`docs/RESEARCH-BACKLOG.md`, research only — index table at the top). **R2 fireballs PARKED** (Chad, 5 Nov; `docs/research/R2-revision-matching.md` rev 3 + evidence on the Mac at `~/Documents/Mother Earth/research/fireballs/2026-11-05-claude/`). Next tier-1 items: **R3 Earth rotation (USNO/IERS)**, **R4 Argo**. Same first gate for every item. No build, collector, schedule, deploy, purchase or third-party contact without Chad's go.
7. **Mac copies:** synced at every handover by cloning the repo inside the Mac shell (`device_bash`: `git clone --depth 1 https://github.com/TheOneTheOnlyTheChad/mother-earth.git`) and copying with a hash check (START-HERE §3).
8. Carried over: real-phone check of the mobile pass (Galaxy); NCEI accession recheck; plastic research follow-ups; attribution placement; Possible futures (research only).

## 2. Done in thread 15 (details in STATUS)
- History trial on (10:21 UTC), measured tick by tick.
- "no history kept" fallback removed from the public page (`bd17401`), with a guard test.
- orbital-browser: 2 failures fixed (`66c1a8c`, `e5bac15`), then a shifted fixed-start clock + 3-day boundary cases (`32a29b0`) — **113/113**; page unchanged.
- R2 fireballs: independent re-check, revision-matching proposal rev 3, parked (other thread, same day).
- Research backlog R1–R9.
- STATUS trimmed: threads 1–13 moved verbatim to `docs/STATUS-ARCHIVE.md`.

## 3. Learned (threads 14–15)
| | |
|---|---|
| Fake clocks in tests | the hub stamps times with `new Date()`; faking only `Date.now` makes a test pass only on the day it was written (plastic-hub only passed on 4 Nov). Fake the no-argument `Date` constructor too (see history-hub / plastic-hub). |
| Mutable state + overlap | a single R2 state pointer failed four ways (failed write, out-of-order runs, overlapping runs, finished work later called lost). Replaced with append-only D1 facts + a completion marker checked first and written last, and inputs chosen afresh by full timestamp. Apply the same pattern to any future recoverable job. |
| `+''` is 0 | a missing CSV value parsed with `+x` becomes 0; FIRMS FRP was published as 0 MW. Parse empties as `null`. |
| SQLite MIN+MAX | one query with both MIN and MAX scans the whole index; two single lookups are index searches. Check `EXPLAIN QUERY PLAN` (node:sqlite) for any query on a growing table. |
| `insertAdjacentHTML('beforeend', '<tr>…')` on a `<table>` | the rows land in a new `<tbody>`, so `tr:not(:first-child)` leaves one stale row per refresh. Remove `[...t.querySelectorAll('tr')].slice(1)`. |
| `data-layer` | already the page's toggle attribute; new buttons must not reuse it (the place view uses `data-place-layer`). |
| Fonts in the container | Google Fonts are blocked, so container width measurements are the **fallback-font** case; use `@fontsource` (spike) for the real faces. |
| Hidden pane | `resize_window` to 390 gave a 588 px page while the pane was hidden; ask Chad for the app in front for an exact phone-size visual check. |
| D1 from the dashboard | `POST /api/v4/accounts/<acct>/d1/database/<id>/query` with `x-atok` runs one statement (database id from the Worker settings' `DB` binding); see START-HERE §4d. |
| Safety check on production clicks | the session refuses Claude's clicks that deploy to production or write a production variable, even with Chad's consent in chat. Claude fills the form and verifies; **Chad clicks the deploy button**. Tell him up front. |
| Breaks must bite | when adding a guard test, break something the guard alone can catch — removing sea ice's kept line did not fail (its history line still supplies text); removing ships' did. |
| Pinned fixtures vs the wall clock | a fixture with fixed epochs drifts against `Date.now`; a test that agreed on the build day can fail days later (orbital-browser, 5 Nov). |
| Auto-mode safety check (thread 16) | It reviews every Claude action; by default it trusts only the working copy + its GitHub repo, so Cloudflare/R2/D1 are external and production deploys / shared-storage writes are default blocks. **It allows them when Chad's message names the exact action** (the 0.5.2 deploy passed on "DEPLOY HUB 0.5.2 … my explicit go"; an R2 copy after a bare "go" was refused). `/permissions` is not available in cloud chats. Standing trust rules were drafted (`~/Documents/Mother Earth/setup/automode-mother-earth.json` + `apply-automode.py` → `~/.claude/settings.json` on the Mac); **Tested 6 Nov 10:38 UTC (thread 17): they do NOT reach cloud sessions.** A bare "go" R2 copy into `recovery/` was refused again ("Modify Shared Resources"). Keep using `Approve: …` lines. Claude never edits these rules itself. |
| Pulling big files through the pane | `javascript_tool` results over the token cap are saved to a file (`tool-results/…txt`) without entering context: gzip in the page (`CompressionStream`), base64, return 150 k-char slices, reassemble with python, hash-check. Used for the 5 Nov checkpoint (2.96 MB) and the 15:30 raw (3.8 MB). |
| GitHub branch deletes | the session proxy refuses ref deletion (git push --delete and the API). Leftover branches stay until Chad deletes them on GitHub. |

## 4. Where things are
| | |
|---|---|
| History + place hub tests | `node --no-warnings phase1/history-hub.test.mjs` (27; real SQLite via `node:sqlite` + `schema.sql`) |
| Place UI | `node --no-warnings phase1/place-ui.test.cjs` (30; the page's `/place` answered by the real `worker.js`) · `node phase1/place-rows.test.mjs` (7) |
| Retention wording | `node --no-warnings phase1/kept-ui.test.cjs` (21; off/on/off-after-trial/unreadable + transitions; table-growth check; every layer has a kept statement) |
| Desktop overflow | `node phase1/desktop-overflow.test.cjs` (112; needs `@fontsource/ibm-plex-mono@5` + `@fontsource/barlow-condensed@5` in /home/claude/spike) |
| Test setup, new container | `/home/claude/spike`: `npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs astronomy-engine @fontsource/ibm-plex-mono@5 @fontsource/barlow-condensed@5`; `mkdir -p /home/claude/fixtures && node phase1/orbital-fixture.build.mjs`; static server `python3 -m http.server 8899 --bind 127.0.0.1` via Bash `run_in_background` (with a long `timeout`, or it stops after 30 min) |
| Reviews | `reviews/2026-11-05-landscape-comparison.md` (rev 2) · `…-place-view-and-history.md` (rev 5) · `…-place-view-candidate.md` (§1–§12) |
| Orbital browser | `node phase1/orbital-browser.test.cjs /home/claude/fixtures` (113; stale = objects whose elements initialise; fixed calculation time + 3-day boundary cases) |
| Research backlog | `docs/RESEARCH-BACKLOG.md` (R1–R9, research only) |
| Older status | `docs/STATUS-ARCHIVE.md` (threads 1–13, verbatim) |

