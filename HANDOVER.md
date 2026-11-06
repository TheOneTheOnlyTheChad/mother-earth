# Mother Earth — handover (6 Nov 2026, end of thread 16, ~07:00 UTC)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4d D1 · §5a testing), then this file, then `STATUS.md` (newest first; threads 1–13 in `docs/STATUS-ARCHIVE.md`). **Not a fresh sandbox; don't repeat completed reviews.**

**Access (Chad, 4–5 Nov):** full access — GitHub (push), Cloudflare, Space-Track, the Mac's Mother Earth folder and `~/mother-earth`, browser pane. Chad enters secrets himself; Claude never creates accounts. **Every deploy, schedule or variable change, D1 schema change and push to main that changes the public page needs Chad's explicit go.** Production deploy clicks are Chad's (§3). **Say up front whenever Chad must be at the screen with the app in front** (standing rule). **Production approvals (thread 16): the session's auto-mode safety check lets a production action through only when Chad's message names that exact action — a bare "go" is not enough. So end any message that needs a production action with a ready line, e.g. `Approve: deploy hub commit <sha> (content only)` or `Approve: copy <files> into R2 recovery/`, and Chad replies with it.** Non-production work: "go" is fine. GPT reviews; approvals are Chad's. Not Overwatch: presentation lessons only. No surveillance, ever.

## 0. Live state (6 Nov ~05:45 UTC)
| | State |
|---|---|
| **Page** | main, assets **`?v=202611131000`** (`e107c1d`: smoke-review fixes, 6 Nov 10:03 UTC). |
| **Hub** | **0.5.2 live since 6 Nov 05:53:57 UTC** (`2ee3a62`, worker.js sha256 `70307d5fc2a9…`; deployed by Claude via the content API — allowed this time; verified: content hash, version, 17 bindings incl. `HISTORY_ENABLED=1`, `/status` collection health). Rollback = 0.5.1 `8c8633d` (`1f34554b2e53…`), Chad's go. |
| **D1** | 9 history tables + 8 indexes **+ `archive_checkpoint_coverage` (empty) + index `collector_runs_layer_finished`** (both created 6 Nov 05:37 UTC, live = `2ee3a62` schema). |
| **History** | ON since 5 Nov 10:21 UTC — keep on. First midnight checkpoint (5 Nov) completed; **fires part is partial** (input 15:30 UTC: the 4 MB guard skipped 15:45–23:45). Details STATUS. |
| **FIRMS** | 8 MiB guard live; first 0.5.2 run 06:00 UTC ok (57 ms CPU). First runs over 4 MB due 6 Nov afternoon UTC — check scheduled 14:20 UTC. |
| **Branch** | `firms-guard` @ `2ee3a62`: hub 0.5.2, tests (`firms-guard.test.mjs` 19/19), bench (`phase1/bench-firms-memory/`, 72/72 verified), review `reviews/2026-11-06-firms-guard.md` rev 3. Not merged to main yet. |
| **Tests** | All hub suites pass on the branch; orbital-browser 113/113 on main. |

## 1. Next
1. **Monitor 0.5.2 (deployed 6 Nov 05:53:57 UTC, verified) — schedule these in the new session (thread 16's check-ins were cancelled at handover):** **~14:20 UTC 6 Nov** — first FIRMS runs over 4 MB: `collector_runs` firms ok with records (not "resource guard"), raw sizes in `raw/firms/2026-11-06*`, Exceeded Memory = 0 (Worker metrics / telemetry), CPU per firms tick, `/status` `collection.firms`; if still under 4 MB, check again ~16:00. **~00:50 UTC 7 Nov** — `archive_checkpoints` + `archive_checkpoint_coverage` for 6 Nov (`assessed_with_checkpoint = 1`), 5 Nov coverage backfilled (`= 0`), `fires_daily` 6 Nov, drifter full day (rows + bytes), CPU of the 00:30 ticks. All read-only. If Exceeded Memory appears: tell Chad; rollback = redeploy 0.5.1 from `8c8633d` (`1f34554b…`), with an Approve line. Production memory is not guaranteed by the bench (one sampled 112 MB heap peak at 8 MiB under overlap).
2. ~~5 Nov fires recovery~~ **WRITTEN to R2 6 Nov 08:19:35 UTC and verified** (`archive/recoveries/firms/2026-11-05.json.gz`, sha256 `624ecf2e…`; review §10). D1 recovery tables wait for an agreed querying requirement. The procedure's byte-transfer step needs fixing before reuse (review §10). Showing recovered data anywhere is a separate, later decision.
3. ~~Merge `firms-guard` → `main`~~ **DONE 6 Nov ~08:05 UTC** (`909e8cd`; worker.js on main = live 0.5.2). Branch `firms-guard` can be deleted on GitHub (Chad; the session proxy refuses ref deletes).
3a. ~~Smoke-review fixes~~ **PUBLISHED 6 Nov 10:03 UTC** (main `e107c1d`, assets `?v=202611131000`; served hashes verified; public checks passed — STATUS).
4. **Drifter first full day (6 Nov)** — rows/day + bytes after 00:30 UTC 7 Nov (the 5 Nov partial-day estimate ~23,700/day is provisional).
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

