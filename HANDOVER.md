# Mother Earth — handover to thread 15 (5 Nov 2026, end of thread 14)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4d D1 schema changes · §5a testing), then this file, then `STATUS.md` (newest first). **Not a fresh sandbox, and do not repeat the reviews below: they are done.**

**Access (Chad, 4 Nov):** "you have full access — GitHub (push), Cloudflare, Space-Track, my Mac's Mother Earth folder and ~/mother-earth, browser pane. I enter secrets myself; you never create accounts. Tell me up front whenever my screen must be on the app." **Every deploy, schedule or variable change, D1 schema change and push to main that changes the public page needs Chad's explicit go.** GPT reviews; **the approvals are Chad's**. Not Overwatch: presentation lessons only. No surveillance, ever.

## 0. State at the end of thread 14 (5 Nov 09:41 UTC) — LIVE
| | State |
|---|---|
| **Page** | main = **`8c8633d`**, assets **`?v=202611111000`**, published 09:39 UTC (served hashes checked: index `bdc44df5d2e6`, app `fc2133f7f088`, style `e10935d03acb`, sources `dd2e63e59484`). New: **place view** ("Everything here" from a cell's details or any globe point; `/place` per cell; optional layers load for the panel only); **"What Mother Earth keeps" follows the hub** (`ME.historyLine`, `keptState()` in sources.html); Sources `fill()` refresh fix; desktop-overflow fix (`3a2fcb2`, published earlier the same day). |
| **Hub** | **0.5.1** (`8c8633d`, worker.js sha256 `1f34554b2e53…`) since 09:28 UTC; 16 bindings; **`HISTORY_ENABLED` absent**. New endpoints/fields: `GET /place/g4/<row>_<col>[?layers=drifters,plastic]`; `GET /` and `/status` → `history: {collecting, retained:{exists, first, last, layers}}`; `/status` → `archive_health {pending, gaps, last_completed, recent_failures, retry_window}`. FIRMS missing FRP is `null` (was 0). Snapshots carry R2 metadata `retrieved_at`. |
| **D1** | **9 history tables + 8 indexes** created 09:28 UTC from `8c8633d` (live schema = commit, 9/9 via `PRAGMA table_info`): `archive_versions`, `archive_checkpoints`, `quake_revisions`, `fires_daily`, `drifter_fixes`, `seaice_daily`, `orbital_population`, `history_activity`, `archive_gaps`. **All empty** (09:41 UTC). |
| **History** | **OFF.** Hub reports `collecting:false, retained:{exists:false}`; `archive_health` empty; 0 history rows; 0 R2 `archive/` objects; no `state/history-*` (that design was removed). |
| **Branch** | `place-view` (= main + docs); the reviews are at `reviews/2026-11-05-place-view-candidate.md` (§9 deploy verification, §11 public checks, §12 who checked what) and `…-place-view-and-history.md` (proposal rev 5; §5 = what the code keeps). |

## 1. Next
1. **History trial: awaiting Chad's separate go (not given).** When given:
   - Reload the Settings page **after** any code deploy before using the form (START-HERE §4). Add `HISTORY_ENABLED=1`, plain text, Production. Verify 16 → 17 bindings and that `/` still says 0.5.1.
   - Watch the next usgs (every 5 min), firms (every 15 min) and hourly (:07) runs. Expect: `quake_revisions` rows; `history_activity` rows for firms and usgs; `drifter_fixes`; version rows for co2/seaice/orbital/plastic as their jobs run; `seaice_daily` at 03/09/15/21 UTC; `orbital_population` at :41 in odd hours.
   - The hub report should flip to `collecting:true, retained:{exists:true…}`, and the public Sources page with it ("collecting; retained since …").
   - Read the CPU of each tick from the invocation log (START-HERE §4a), plus D1 rows written and R2 `archive/` objects.
   - Turning it off = remove the variable. Retained history is **not** deleted, and the page then says "retained … collection off — not deleted".
2. **Then one full UTC day with history on,** including the **first midnight checkpoint**. A day is due at **00:30 UTC** (end of day + 30 min grace) and runs on the next firms/usgs tick.
   - Verify `archive_checkpoints` for firms and usgs (cutoff = the day's last snapshot by full `retrieved_at`), `fires_daily` rows (FRP null where none), `archive_health` (no pending after the tick, no gaps).
   - Measure the open cost item: **drifter_fixes rows/day** (1,300 to 31,000 measured range; OSMC delivers in batches) and bytes. Record everything in STATUS.
3. **orbital-browser — fixed 5 Nov (thread 15), test-only.** The reference now counts stale over the objects whose elements initialise successfully (the worker's definition; stale and failed are not mutually exclusive — an object that initialises but fails propagation can be in both). 105/105. **Still open (recorded, not built):** the fixture's epochs are pinned to 3 Nov 13:00 while the suite runs on the wall clock. GPT's suggestion: keep real timers, but give browser and reference a shared fixed calculation time, with explicit cases either side of the 3-day boundary.
4. Small cleanup: the unreachable `'no history kept'` fallback text in `sources.html` (t-cmp) and `index.html` (inspector Comparison rows). Every layer has a kept line, so it never displays.
5. **Research backlog** (`docs/RESEARCH-BACKLOG.md`, research only — no build, collector, schedule, deploy or third-party contact): R1 Schumann/ELF + R2–R9 from GPT's source checks (first priorities: fireballs CNEOS, Earth rotation USNO/IERS, Argo; next: coral heat stress, ozone, CO-OPS water level; later: GloTEC, NMDB). Same first gate for every candidate: a representative numerical sample + units/timestamps/missing/flags/reuse + payload and processing measured.
6. Carried over: real-phone check of the mobile pass (Galaxy); NCEI accession recheck; plastic research follow-ups; attribution placement; Possible futures (research only).

## 2. Learned in thread 14
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

## 3. Where things are
| | |
|---|---|
| History + place hub tests | `node --no-warnings phase1/history-hub.test.mjs` (27; real SQLite via `node:sqlite` + `schema.sql`) |
| Place UI | `node --no-warnings phase1/place-ui.test.cjs` (30; the page's `/place` answered by the real `worker.js`) · `node phase1/place-rows.test.mjs` (7) |
| Retention wording | `node --no-warnings phase1/kept-ui.test.cjs` (19; off/on/off-after-trial/unreadable + transitions; table-growth check) |
| Desktop overflow | `node phase1/desktop-overflow.test.cjs` (112; needs `@fontsource/ibm-plex-mono@5` + `@fontsource/barlow-condensed@5` in /home/claude/spike) |
| Test setup, new container | `/home/claude/spike`: `npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs astronomy-engine @fontsource/ibm-plex-mono@5 @fontsource/barlow-condensed@5`; `mkdir -p /home/claude/fixtures && node phase1/orbital-fixture.build.mjs`; static server `python3 -m http.server 8899 --bind 127.0.0.1` via Bash `run_in_background` (with a long `timeout`, or it stops after 30 min) |
| Reviews | `reviews/2026-11-05-landscape-comparison.md` (rev 2) · `…-place-view-and-history.md` (rev 5) · `…-place-view-candidate.md` (§1–§12) |
