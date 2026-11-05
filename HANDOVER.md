# Mother Earth — handover (5 Nov 2026, thread 15, ~15:45 UTC)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4d D1 · §5a testing), then this file, then `STATUS.md` (newest first; threads 1–13 in `docs/STATUS-ARCHIVE.md`). **Not a fresh sandbox; don't repeat completed reviews.**

**Access (Chad, 4–5 Nov):** full access — GitHub (push), Cloudflare, Space-Track, the Mac's Mother Earth folder and `~/mother-earth`, browser pane. Chad enters secrets himself; Claude never creates accounts. **Every deploy, schedule or variable change, D1 schema change and push to main that changes the public page needs Chad's explicit go.** Production deploy clicks are Chad's (§3). **Say up front whenever Chad must be at the screen with the app in front** (standing rule). GPT reviews; approvals are Chad's. Not Overwatch: presentation lessons only. No surveillance, ever.

## 0. Live state (5 Nov ~12:30 UTC)
| | State |
|---|---|
| **Page** | main **`bd17401`**, assets **`?v=202611121000`**: place view, hub-driven "What Mother Earth keeps" (now reads "collecting"), the unreachable "no history kept" fallback removed. |
| **Hub** | **0.5.1** (`8c8633d`, worker.js sha256 `1f34554b2e53…`); **17 bindings incl. `HISTORY_ENABLED=1`** (since 10:21 UTC). Endpoints: `/place/g4/<row>_<col>`; `/` and `/status` → `history`; `/status` → `archive_health`. |
| **History** | **ON — keep on (Chad: the full day is the test).** Retained since 10:25:08 UTC. 12:14 UTC: quake_revisions 42 · drifter_fixes 2,491 · archive_versions 2 · orbital_population 1 · history_activity 2 · the rest 0. `archive_health` empty. Figures in STATUS. |
| **D1** | 9 history tables + 8 indexes (live = `8c8633d` schema). |
| **Tests** | All suites pass on main (STATUS lists them); orbital-browser 105/105 after the stale-definition fix. |
| **Branches** | Leftover remote branches (e.g. `orbital-test-stale`, `place-view`, `nsidc-page`) are merged or superseded; the proxy can't delete them — Chad's call on GitHub. |

## 1. Next
1. **History day — HUB FREEZE until the midnight read is in STATUS.** No deploy, variable, schedule or D1 change. Thread 15 holds a scheduled read at **00:50 UTC 6 Nov** (02:50 SAST). It checks: `archive_checkpoints` for firms + usgs (5 Nov; cutoff = the day's last snapshot by full `retrieved_at`), `fires_daily` (FRP null where none), `archive_health` (no pending after the tick, no gaps), CPU of the 00:30–00:45 ticks. **If STATUS has no "midnight checkpoint" entry by the time you start, do the read yourself** (method: START-HERE §4a/§4d via the dashboard tab; data persists in D1).
2. **Drifter rows/day + bytes (open cost item).** 5 Nov is partial (from 10:21): mean ≈ 1,170 rows/hour ⇒ ~28,000/day if it holds. **6 Nov is the first full day** — measure it after 00:30 UTC 7 Nov.
3. **Plastic's first archived version** comes with its next daily run (~05:07–06:07 UTC 6 Nov).
4. **Research backlog** (`docs/RESEARCH-BACKLOG.md`, research only — index table at the top). **R2 fireballs PARKED** (Chad, 5 Nov; `docs/research/R2-revision-matching.md` rev 3 + evidence on the Mac at `~/Documents/Mother Earth/research/fireballs/2026-11-05-claude/`). Next tier-1 items: **R3 Earth rotation (USNO/IERS)**, **R4 Argo**. Same first gate for every item. No build, collector, schedule, deploy, purchase or third-party contact without Chad's go.
5. **Mac copies of STATUS / HANDOVER / START-HERE are behind** — one folder approval from Chad, then copy.
6. Carried over: real-phone check of the mobile pass (Galaxy); NCEI accession recheck; plastic research follow-ups; attribution placement; Possible futures (research only).

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

