# Mother Earth — handover (6 Nov 2026, end of thread 15, ~05:45 UTC)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4d D1 · §5a testing), then this file, then `STATUS.md` (newest first; threads 1–13 in `docs/STATUS-ARCHIVE.md`). **Not a fresh sandbox; don't repeat completed reviews.**

**Access (Chad, 4–5 Nov):** full access — GitHub (push), Cloudflare, Space-Track, the Mac's Mother Earth folder and `~/mother-earth`, browser pane. Chad enters secrets himself; Claude never creates accounts. **Every deploy, schedule or variable change, D1 schema change and push to main that changes the public page needs Chad's explicit go.** Production deploy clicks are Chad's (§3). **Say up front whenever Chad must be at the screen with the app in front** (standing rule). GPT reviews; approvals are Chad's. Not Overwatch: presentation lessons only. No surveillance, ever.

## 0. Live state (6 Nov ~05:45 UTC)
| | State |
|---|---|
| **Page** | main, assets **`?v=202611121000`** (`bd17401` page files; later main commits are docs/tests only). |
| **Hub** | **0.5.1 still live** (`8c8633d`, worker.js sha256 `1f34554b2e53…`); 17 bindings incl. `HISTORY_ENABLED=1`. **0.5.2 (`2ee3a62`) reviewed by GPT, Chad's go given — deploy pending (§1.1).** |
| **D1** | 9 history tables + 8 indexes **+ `archive_checkpoint_coverage` (empty) + index `collector_runs_layer_finished`** (both created 6 Nov 05:37 UTC, live = `2ee3a62` schema). |
| **History** | ON since 5 Nov 10:21 UTC — keep on. First midnight checkpoint (5 Nov) completed; **fires part is partial** (input 15:30 UTC: the 4 MB guard skipped 15:45–23:45). Details STATUS. |
| **FIRMS** | Guard trips every afternoon on 0.5.1 → public fires layer stale until 0.5.2 is live. |
| **Branch** | `firms-guard` @ `2ee3a62`: hub 0.5.2, tests (`firms-guard.test.mjs` 19/19), bench (`phase1/bench-firms-memory/`, 72/72 verified), review `reviews/2026-11-06-firms-guard.md` rev 3. Not merged to main yet. |
| **Tests** | All hub suites pass on the branch; orbital-browser 113/113 on main. |

## 1. Next
1. **DEPLOY HUB 0.5.2 — Chad's explicit go is given (6 Nov), after GPT's sign-off.** The D1 additions are **already done** (05:37 UTC; STATUS). Do only the deploy, then monitor.
   - **Chad (6 Nov):** "its a go from me … lets get this thing live now"; full access to GitHub, Cloudflare and the browser pane; the browser will be open and he signs in to anything needed.
   - **What:** branch `firms-guard` @ **`2ee3a62`**, `phase1/worker.js` **sha256 `70307d5fc2a9afed5f04fb1929468a9b60d55f51e412e55d590d7c6e8596824a`**, `COLLECTOR_VERSION = '0.5.2'`, `FIRMS_MAX_PARSE_BYTES = 8 MiB`. Content-only: bindings, secrets, crons unchanged (17 bindings incl. `HISTORY_ENABLED=1`).
   - **How (START-HERE §4):** in a `dash.cloudflare.com` pane tab, fetch `https://raw.githubusercontent.com/TheOneTheOnlyTheChad/mother-earth/2ee3a62/phase1/worker.js`, refuse on any sha256 mismatch, `PUT /api/v4/accounts/0538d0fe34d9fd261a2eac11583f8972/workers/scripts/mother-earth/content` (multipart `metadata` `{"main_module":"worker.js"}` + part `worker.js` `application/javascript+module`, header `x-atok: window.bootstrap.atok`).
   - **If the session's safety check refuses Claude's deploy** (it did in thread 15, twice — a rule on Claude's own actions; do not try to route around it): Chad deploys by hand in the pane — tab 1 = the raw GitHub URL above (Claude checks it shows sha `70307d5f…` first), **Cmd+A, Cmd+C**; tab 2 = `https://dash.cloudflare.com/0538d0fe34d9fd261a2eac11583f8972/workers/services/edit/mother-earth/production`, click in the code, **Cmd+A, Cmd+V**, wait, **Deploy**. Tell Chad up front he must be at the screen for this.
   - **Verify after (read-only):** `GET …/workers/scripts/mother-earth/content/v2` (or the current script content endpoint) → sha256 must equal `70307d5f…` (if the editor changed whitespace on paste, report it — do not redeploy without Chad); `GET /` on the hub → `version: 0.5.2`; Worker settings → 17 bindings, `HISTORY_ENABLED=1` present; `/status` → `archive_health.collection.firms` and `.usgs` present.
   - **Monitor (GPT's step 3):** the first FIRMS runs **over 4 MB** (today's file passes 4 MB by early-to-mid afternoon UTC): `collector_runs` firms `ok` with records, not "resource guard"; Worker Metrics **Memory** chart + **Exceeded Memory = 0**; invocation-log CPU per firms tick; `/status` `collection.firms` (last success, no failing streak). Then the **next midnight checkpoint (00:30 UTC 7 Nov)**: `archive_checkpoints` + `archive_checkpoint_coverage` for 6 Nov with `assessed_with_checkpoint = 1`; 5 Nov coverage row backfilled with `assessed_with_checkpoint = 0`.
   - Production memory is **not** guaranteed by the bench (one sampled 112 MB heap peak at 8 MiB under overlap; the 80 MB local V8 cap is not a production reserve). If Exceeded Memory appears: tell Chad; rollback = redeploy 0.5.1 from `8c8633d` (`1f34554b…`), Chad's go.
2. **5 Nov fires recovery — separate decision, NOT part of the deploy.** Raw files expire from **~7 Nov 15:45 UTC**. Deploying 0.5.2 does not restore the 5 Nov evening or complete its checkpoint. Ask Chad; build nothing without his go.
3. **Merge `firms-guard` → `main`** once 0.5.2 is verified live (docs + tests + bench travel with it; no page files change). Chad's go.
4. **Drifter first full day (6 Nov)** — rows/day + bytes after 00:30 UTC 7 Nov (the 5 Nov partial-day estimate ~23,700/day is provisional).
5. **Plastic's first archived version** comes with its next daily run (~05:07–06:07 UTC 6 Nov).
6. **Research backlog** (`docs/RESEARCH-BACKLOG.md`, research only — index table at the top). **R2 fireballs PARKED** (Chad, 5 Nov; `docs/research/R2-revision-matching.md` rev 3 + evidence on the Mac at `~/Documents/Mother Earth/research/fireballs/2026-11-05-claude/`). Next tier-1 items: **R3 Earth rotation (USNO/IERS)**, **R4 Argo**. Same first gate for every item. No build, collector, schedule, deploy, purchase or third-party contact without Chad's go.
7. **Mac copies of STATUS / HANDOVER / START-HERE are behind** — one folder approval from Chad, then copy.
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

