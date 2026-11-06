# Mother Earth — START HERE (read this before anything else in a new thread)

Written 31 Oct 2026 at the end of build day one; §3–§5 revised in thread 2 (31 Oct); §5a added in thread 4 (1 Nov). Purpose: a cold-start brief so a new thread can continue without re-learning. Read this, then `claude/HANDOVER.md` (live state + next), then `claude/STATUS.md` (newest first; threads 1–13 in `docs/STATUS-ARCHIVE.md`), then only the docs a task needs (`claude/SPEC-v0.3.md`, `claude/PROJECT-BRIEF.md`, `phase1/GUIDE-step1.md`).

## 1. What this is
One browser globe showing the latest observations of the planet from open live feeds. The promise, verbatim and on the page: **"See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage."** Build spec is SPEC-v0.3 with deviations D1–D14 logged in `docs/STATUS-ARCHIVE.md` (moved from STATUS.md 5 Nov). Phase 1 is live.

- Page: https://theonetheonlythechad.github.io/mother-earth/ (GitHub Pages, repo root `index.html`). **Pushing `main` publishes it** — unreleased page work lives on a branch (e.g. `aircraft-rc`) until Chad approves.
- Hub/collector: https://mother-earth.chadoberholzer.workers.dev — `/`, `/status`, `/cells/<layer>`, `/snapshot/<layer>`, `/elements/satellites`, `/elements/orbital`, `/admin/run/<job>?key=ADMIN_KEY` (Workers Paid since 3 Nov 2026)
- Repo: https://github.com/TheOneTheOnlyTheChad/mother-earth — push straight to `main` (no branches unless there is a reason; say the reason and let Chad decide)
- Orbital (Space-Track via the hub): Payloads · Rocket bodies · Debris toggles on the page since 3 Nov 14:49 UTC; replaced the Satellites card.
- **Place view + hub-driven retention wording** public (main `bd17401`, `?v=202611121000`). **Hub 0.5.1:** `/place/g4/<row>_<col>`, history report, archive health; **history ON since 5 Nov 10:21 UTC (`HISTORY_ENABLED=1`, Chad's go) — keep on while the trial runs** (HANDOVER §1). Production deploy clicks are Chad's: the session blocks Claude's (HANDOVER §3).
- **Mobile pass** public since 4 Nov ~15:15 UTC (main `b04a930`, `?v=202611071000`): phone Key · N layers + persistent disclosure strip.
- **Microplastic samples** (hub 0.4.0, `PLASTIC_ENABLED=1`, daily) collecting since 4 Nov 12:16 UTC; public since 4 Nov 12:28 UTC (own toggle, off on load). Pinned original in R2 `ref/`.
- **Drifting buoys** (NOAA OSMC, GTS, CC0) since 3 Nov 17:19 UTC: hourly on the :07 job (`DRIFTERS_ENABLED=1`), own toggle card, off on load. **Ships cloud fallback** since 3 Nov ~18:10 (`SHIPS_FALLBACK=1`): the hub samples aisstream itself only when no Mac sample has arrived for 40 min; it hears ~half the vessels (measured twice) and the card says so. CelesTrak satellites job stopped (`SATELLITES_ENABLED=0`).
- Layers running: usgs (quakes), swpc (Kp, hourly), firms (fires), co2 (NOAA GML), seaice (NSIDC), **ships** (aisstream via the Mac: launchd job `earth.mother.ships` runs `~/mother-earth/run.sh tick` every minute, samples ~every 30 min while awake); `mock` = hidden test layer. Parked: opensky — gated off by `OPENSKY_ENABLED` (unset), minute trigger deleted. R2 lifecycle rules delete `raw/ snapshots/ cells/` after 2 days.

## 2. How Chad works (observe these; they are standing)
- **Baby steps, click-by-click.** One key, one dialog, one action at a time. He reads code; he does not write it.
- **Measure, don't assume.** Every limit/cost claim gets measured on the real platform and the number written down with the date.
- **Running cost as low as possible (updated 6 Nov 2026).** The $0 target ended when Cloudflare Workers Paid ($5/month) started on 3 Nov. Cost is now accepted where it buys something, kept to the minimum. Name every new line item, with its amount, before it is incurred; Chad decides.
- **MVP lives in the now.** Page reads `latest/*` only; history accumulates cheaply for phase-3 baselines.
- **Keys are shared and recorded.** He is fine with Claude knowing them. Record: `~/Documents/Mother Earth/KEYS.md` (gitignored). Secrets can't be read back from Cloudflare, so the value goes into KEYS.md *first*, then into Cloudflare.
- **Reviews (updated 1 Nov 2026):** GPT and Gemini are watching the site grow and want to assist, but they do not weigh in on every decision — Chad pulls them in when he sees something worth a three-way chat; otherwise Claude judges and builds. Claude stays sole code writer/deployer.
- **Honesty over polish.** If a layer can't be shown honestly (e.g. sea-ice imagery blind in polar night), say "not shown" with the measured reason rather than paint something.
- He says "lol/bro", is warm and direct; match it, keep replies short, bottom line first, no restating his request.

**Constitution (agreed 1 Nov 2026 — these outlast any one layer; Mother Earth is the first page of something broader, and every later page is built the same way):**
- **Live data, real things.** Only observations with provenance, time, place and an honest coverage grade. Nothing is shown that was not observed, and what is modelled or computed says so.
- **We force no view.** The site shows; it does not tell. No politics, no drama, no editorial. People take the real things and bridge, work and play with them themselves.
- **Bias is chucked.** Any source or dataset found to carry bias, an agenda, or an inability to be checked is removed outright — not re-labelled, not balanced, removed. Record the reason and date in REGISTER.md.
- **A bridge carries its evidence grade.** When cross-field links arrive, every link states what supports it and how sure, exactly as a cell states its coverage. Nothing implies a cause without saying so.
- **Shared keys for things.** From here on, records that name a thing (place, organisation, species, person, work) carry a stable public identifier where one exists (Wikidata ID preferred), so later pages can link across fields.
- **The hub is the product; the page is a client.** All future surfaces read the hub API; history stays private and accumulates from day one; paid features (later) are hub endpoints, never page code.
- **Code is AGPL-3.0** (switched 1 Nov 2026 from MIT; earlier commits remain MIT). Forks run as a service must publish their changes.
- **Every source's commercial standing is in the register** before it goes live (column: commercial use yes / with attribution / needs agreement).

## 3. Where the files live (three copies, keep them in sync)
| What | Repo path (clone at `/home/claude/mother-earth`) | Mac path |
|---|---|---|
| Collector | `phase1/worker.js` | `~/Documents/Mother Earth/phase1/worker.js` |
| Mac/Pi collector | `phase1/collector-mac.mjs`, `phase1/run.sh`, `phase1/earth.mother.ships.plist` | same in the project folder **plus the RUNTIME copy in `~/mother-earth/`** (run.sh, collector-mac.mjs, KEYS.md, state/, logs/). macOS denies launchd access to `~/Documents`, so the scheduler runs from `~/mother-earth` — copy any collector/run.sh change there too (device_bash: mounted at `$HOME/mnt/mother-earth`). Installed agent: `~/Library/LaunchAgents/earth.mother.ships.plist` (reinstall with `launchctl bootout gui/$(id -u)/earth.mother.ships` then `bootstrap` if the plist changes). Check: `~/mother-earth/run.sh status`. |
| Pages | `index.html` (World View), `sources.html` (Sources & Details), `app.js` (shared logic: freshness, readings, report, rules), `style.css` — bump the `?v=` on the css/js links in both html files on every change | same names in `~/Documents/Mother Earth/` |
| Status | `STATUS.md` | `~/Documents/Mother Earth/STATUS.md` + project doc `claude/STATUS.md` |
| Start here | `START-HERE.md` | `~/Documents/Mother Earth/START-HERE.md` + project doc `claude/START-HERE.md` |
| Register | `REGISTER.md` | `~/Documents/Mother Earth/REGISTER.md` |
| Schema | `phase1/schema.sql` | same |
| Keys | never in repo (gitignored) | `~/Documents/Mother Earth/KEYS.md` |

The clone is the working copy (thread 2 onward; the old `/mnt/user-data/outputs/` paths are gone with thread 1's container). In a new container: `add_repo` (push access) → `git clone --depth 1` to `/home/claude/mother-earth`.

Sync procedure after any change: edit in the clone → commit with the attribution trailer → `git push origin main` → copy to the Mac → for STATUS/START-HERE also `Projects.project_write` to `claude/<name>.md`.
**Mac sync (thread 16):** the Mac shell (`device_bash`) can `git clone` GitHub — clone main into `$HOME/me-sync`, then `cp` each changed file to `$HOME/mnt/Documents--Mother Earth/<path>` and compare `shasum -a 256` both sides.
Copy to the Mac: the folder `~/Documents/Mother Earth` must be granted each thread (`device_request_folder_access`; Chad approves one prompt). Then either `device_bash` (the folder is mounted at `$HOME/mnt/Mother Earth`; edit in place with sed/python; `rm` is blocked) or `device_commit_files` with `stagedPath` under `/mnt/user-data/outputs/` and `devicePath` `~/Documents/Mother Earth/...` (force:true). Neither shell (container or device) can reach the hub or data hosts — use the browser pane's `javascript_tool` on a hub tab for every HTTP check. The Mac **Terminal** is the only interactive place that reaches the hub from the Mac (computer-use typing into Terminal is blocked; clicks only). For the collector, read `~/mother-earth/logs/collector.log` and `state/scheduler.json` via device_bash instead of asking Chad to paste.

## 4. Deploying the collector (Cloudflare has no connector; use the built-in browser pane)
**Approval wording (thread 16):** the session's safety check passes a production deploy or write only when Chad's message names the exact action — end the message with `Approve: <action>` for him to send back (HANDOVER §3).

**Preferred since 3 Nov 2026 (thread 7), with Chad's explicit go per deploy:** in a `dash.cloudflare.com` pane tab, `javascript_tool` fetches `worker.js` from `raw.githubusercontent.com/…/<commit>/phase1/worker.js`, checks its sha256 against the repo, and `PUT`s it to `/api/v4/accounts/<acct>/workers/scripts/mother-earth/content` (multipart: `metadata` = `{"main_module":"worker.js"}`, part `worker.js` type `application/javascript+module`, header `x-atok: window.bootstrap.atok`). Code only — bindings, secrets, crons untouched; the previous version stays in Cloudflare's history. Plain-text variables go through the Settings → Variables and Secrets form, never the bindings API (it would have to restate the secrets). The typing flow below is the fallback.

1. Open `https://dash.cloudflare.com/0538d0fe34d9fd261a2eac11583f8972/workers/services/edit/mother-earth/production` in a browser-pane tab. Wait ~15 s for the VS Code editor.
2. Click inside the code (left pane) so it has focus, then **right-click → Command Palette…** (bottom item, ~(213,1111) in an 800-px-wide pane) → type `Select All` → Return. Zoom to confirm the whole file is highlighted. (cmd+A / paste do **not** reach the editor — it is a cross-origin iframe.)
3. **`type`** the whole file over the selection, from a copy with leading whitespace stripped and `/**` changed to `/*` (`sed -E 's/^[[:space:]]+//' worker.js | sed 's#^/\*\*#/*#'`; `node --check` the stripped copy first). ~54 KB types in ~2 min. **The `type` call returns a 30 s timeout error — ignore it; the keystrokes keep arriving.** Do NOT retype. Wait ~2 min, screenshot, confirm the last line number equals the stripped file's line count and the status bar shows 0 errors.
4. Right-click → **Format Document**; click **Deploy** (~(705,107)); wait ~10 s.
5. Verify: `fetch(hub+'/').then(r=>r.json()).then(j=>j.version)` from a hub tab's `javascript_tool`, then `/admin/run/<job>?key=…` and read `/status`. `javascript_tool` has a 45 s cap: the `hourly` job can exceed it — fire it in one call, read `/status` in the next.
6. Secrets: Claude generates the value, writes it to KEYS.md, opens Settings → Variables and Secrets → Add in the browser pane, fills the Key name and ticks Secret, then **Chad pastes the value** and clicks "Add 1 variable and deploy" (Claude does not type secrets into Cloudflare). Settings URL: `…/workers/services/view/mother-earth/production/settings`.
**After a code deploy, reload the Settings page before using the Variables form** — a form opened before the deploy saves the variable onto the OLD code (4 Nov 2026: version 44 rolled 0.4.0 back to 0.3.6). Verify `/` reports the new version after any settings change. **Check the worker loads as a module** (`node --input-type=module -e "await import('./phase1/worker.js')"`): `node --check` missed a duplicate function declaration that would have broken the deploy.
Bump `COLLECTOR_VERSION` on every deploy. Jobs: five, minute, firms, forest, hourly (hourly = co2 + seaice-gated + D1 aggregation; admin runs pass `manual=true`). A file over ~50 KB is typed in TWO `type` calls (split at a line boundary; the second call continues at the cursor) — 0.2.0 (71 KB) went in as 45.6 k + 25.0 k chars with no timeout error.
D1 console: dashboard → D1 → mother-earth → Console; Chad or Claude runs `CREATE TABLE` statements there (schema.sql holds them).
Metrics: `…/workers/services/view/mother-earth/production/metrics` — read with `get_page_text`. Free plan: 10 ms CPU soft limit per invocation; measured medians ~1 ms; worst offenders were whole-file parses (fixed by `tail()`).

## 4e. Cloudflare connector (added 6 Nov 2026, thread 17)
- Connector "Cloudflare Developer Platform": load with ToolSearch `select:mcp__Cloudflare_Developer_Platform__d1_database_query,mcp__Cloudflare_Developer_Platform__workers_get_worker_code,mcp__Cloudflare_Developer_Platform__r2_bucket_get`.
- **D1 reads without the Mac:** `d1_database_query` with database_id `53fced06-fcaa-48e4-a08b-5776125e0293` (mother-earth). Use it for collector_runs, checkpoints, coverage, fires_daily, drifter counts. **SELECT only.** The tool can write and the server has delete tools; any write needs Chad's Approve line.
- `workers_get_worker_code` returns the live script wrapped in multipart. Strip the header and boundary before hashing to compare with a commit.
- **Cannot:** deploy code, change variables, secrets or crons, read or write R2 objects (bucket metadata only), read telemetry or metrics. Those stay on the browser-pane flow (§4, §4a) with Approve lines.
- The server marks itself deprecated (successor: Cloudflare API MCP at mcp.cloudflare.com/mcp).

## 4b. Thread 10 operating facts (3 Nov 2026)
- **Worker outbound WebSockets work on Paid** (aisstream, 101 in ~2 s). Frames arrive as **Blob** — decode with `await data.arrayBuffer()`; never assume ArrayBuffer. Admin runs longer than the pane's 45 s cap: fire without awaiting (`window.__pr`), read in a second call.
- **Optional layers** on the page go through `OPTIONAL_LAYERS` in index.html (fetched only while on, cleared on off, `refreshPair` + `usable()` as for the always-on record layers). `ME.renderState()` and `ME.openCell(layer, id)` are the read-only test/console aids.
- **Shallow clone:** a `--depth=1` fetch can cut parent links ("unrelated histories"); `git fetch --deepen=5 origin main <branch>` restores them. Remote refspec is `+refs/heads/*:refs/remotes/origin/*` so branch tracking resolves (the stop hook checks it).
- Mac folder access in a new thread: `device_request_folder_access ["~/Documents/Mother Earth"]` (one prompt); KEYS.md line 8 admin key, line 16 aisstream (3 connections per account).

## 4c. Thread 11 operating facts (4 Nov 2026)
- **Layout (UX round 1):** left column = core observed cards → Aircraft (not shown) → Explore (search + jump buttons). Right column = indices (Kp, CO₂, sea ice) → **Optional layers** group `#card-optional` (drifters `#card-drifters`, day/night `.opt-night` with `#tgl-night`, orbital `#card-orb`). Credits are a `<footer id="credits">` below the globe inside `.centre`; `.gwrap` wraps `#globe`, `#imgdate`, `#legend` (transparent below 1100 px). A clone of the credits (`.credits.m`) is appended to the phone readings sheet.
- **Evidence labels:** `.evl` line with `.ev.obs` / `.ev.comp`. `Projected` is reserved for a future Possible futures view — never on current layers.
- **Kept wording:** `ME.KEPT` in app.js is the single per-layer statement of what the hub keeps; update it (and Sources `#kept`) from D1/R2 reads whenever retention changes.
- **Inspector rows:** a third element `'more'` puts a row behind "Method and full explanation" (`#insp-more`).
- **Previewing a branch on live data:** see HANDOVER §2 (blob-URL injection into a github.io tab).
- **Local test server:** start it with the Bash tool's `run_in_background`; `pkill -f "http.server 8899"` kills the calling shell too (its own command line matches) — record the pid instead.

## 4d. D1 schema changes and history (added thread 14, 5 Nov 2026)
- **Schema changes go through the dashboard API with Chad's go:** in a `dash.cloudflare.com` pane tab, take the `DB` binding's id from `GET /api/v4/accounts/<acct>/workers/scripts/mother-earth/settings` (header `x-atok: window.bootstrap.atok`), then `POST /api/v4/accounts/<acct>/d1/database/<id>/query` with body `{sql}` — **one statement per call**, `CREATE … IF NOT EXISTS` only (additive). Take the statements from `phase1/schema.sql` **at the approved commit**, check none of the objects exist first, and afterwards compare `PRAGMA table_info(<t>)` live against the same readout of the commit's schema on local SQLite (`node:sqlite`). Done this way on 5 Nov (9 tables + 8 indexes, 9/9 identical).
- **History** (hub ≥ 0.5.1) is controlled by the plain-text variable `HISTORY_ENABLED=1` (absent = off; tested no-op). The hub reports `history.collecting` and `history.retained` on `GET /` and `/status`; `/status` → `archive_health` shows pending days, gaps, last completed checkpoint and recent `history:<step>` failures. The page's retention wording follows that report. Removing the variable stops collection; it never deletes retained history.
- **Daily checkpoints** (firms, usgs) have no mutable state: `history_activity` + `archive_checkpoints` (marker, checked first, written last) + `archive_gaps`. A day is due at end of day + 30 min; its input is the retained `snapshots/<layer>/` object (2-day rule) with the latest full `retrieved_at` (R2 metadata).
- **`javascript_tool` 45 s cap:** never wait for a scheduled tick inside one call; wait with a background `sleep` in Bash, then read in a fresh call.

## 4a. Measuring Worker CPU and cleaning R2 (added thread 8, 3 Nov 2026)
- **Per-invocation CPU is readable** (invocation logs are on): from a `dash.cloudflare.com` tab, `POST /api/v4/accounts/<acct>/workers/observability/telemetry/query` with header `x-atok: window.bootstrap.atok` and body `{queryId:'adhoc', timeframe:{from,to}, view:'events', limit, parameters:{filters:[{key:'$workers.scriptName',operation:'eq',type:'string',value:'mother-earth'}]}}`. Each `cf-worker-event` carries `$workers.cpuTimeMs`, `wallTimeMs`, `outcome`, `eventType`, `event.cron`. Events take ~20 s to appear. A cron invocation runs every job of that tick, so its CPU is shared (forest + orbital on the :41 odd-hour tick).
- **Plan:** Workers Paid ($5/month) since 3 Nov — read from `GET /api/v4/accounts/<acct>/subscriptions`. Paid CPU limits: 30 s per request (default), 15 min for crons at ≥ 1-hour intervals, 30 s below.
- **R2 objects via the dashboard session:** list `GET …/r2/buckets/mother-earth/objects?prefix=…`, delete `DELETE …/r2/buckets/mother-earth/objects/<url-encoded key>` (only when Chad asked for it, e.g. a private staging file).
- **Space-Track:** the pane's sign-in does not survive a Mac restart; Chad signs in again. API docs (REST predicates, operators) are only visible signed in.
- Wait timers: a background `sleep` defaults to a 30-min limit — pass a longer `timeout` for longer waits.

## 5. Browser pane facts
- **The browser pane renders only while it is visible in the Claude app.** Hidden (side panel showing something else, or Chad in another app) = keystrokes still land but screenshots freeze or time out; `tabs_context` says "hidden". Ask Chad to show it (Cmd+Shift+B) before any deploy verification.
- **If the Claude desktop window is covered (Chad in another app), the pane stops drawing: screenshots repeat the same frame and nothing looks typed — but keystrokes still land.** Ask Chad to bring Claude to the front, then screenshot again before deciding anything. Never retype on the strength of a frozen screenshot; probe with one character first and delete it after.
- The R2 lifecycle "Add rule" form opens with "Delete uploaded objects after" already ticked — fill name, prefix, days; do not click the checkbox.
- Cron triggers: Worker → Settings → Trigger events → Add → "Cron expression" tab → the box is PREFILLED with `*/30 * * * *` (cmd+a then type replaces it; type a space + Backspace to re-run the validator) → Add → the **Save button is in a floating toast at the bottom** (ref clicks miss it; click by coordinate ~(612,1045) in an 800-px pane). Four now: hourly :07, */5, */15, 11,41 (forest).
- Tab names change; call `tabs_context` first. Keep the globe in its own tab for Chad; do dashboard work in a second tab.
- D1 console: click the textbox by `ref` (coordinate clicks missed it once), type, click Execute (~(720,856)); Return does not submit.
- `browser_batch` has ignored `tabId` once and acted on the wrong tab — use single `computer` calls with explicit `tabId` for anything that clicks.
- New sites need `request_access` (scope "site"). Granted so far: dash.cloudflare.com, github.io, noaadata.apps.nsidc.org, gibs.earthdata.nasa.gov (via page fetches), firms.
- The container shell cannot reach most data hosts (egress allowlist); fetch test data through the browser pane's `javascript_tool` on a same-origin or CORS-open page instead.
- Computer use is granted narrowly (TextEdit + clipboard write). Not needed for the editor flow above.

## 5a. Testing the page before and after a push (added thread 4, 1 Nov 2026)
The Pages deploy lock makes a bad push expensive (~30 min before the next one lands), so test before pushing, and again after.

- **Offline, in the container (no hub, no unpkg):** `python3 -m http.server 8899 --bind 127.0.0.1` in the clone, then drive it with the pre-installed Playwright — `require('playwright')` from a **`.cjs`** file (an `.mjs` import of it fails to resolve from the scratchpad). `context.addInitScript()` runs before the page scripts, which is how the no-WebGL path is tested: patch `HTMLCanvasElement.prototype.getContext` to return null for `webgl`. The hub, unpkg and Google Fonts are all blocked here, so expect `ERR_TUNNEL_CONNECTION_FAILED` noise and no data — this tests **failure paths and markup**, not readings.
- **Logic against real data, before pushing:** paste the new pure helpers into the live page with the pane's `javascript_tool` and run them over real `/snapshot/*` records. This caught the tie case (two M6.0 quakes) and the genuine FRP zeros.
- **Failure paths on the live page, after pushing:** `ME.getJson` is reachable on `window.ME`, and the inline script calls it by property lookup, so it can be patched at runtime to inject faults — return a doctored `retrieved_at` for a mismatch, throw for a failed read. The next polling tick (`ME.REFRESH_MS`, 5 min) picks it up; `javascript_tool` caps at ~45 s, so patch in one call and poll in later ones. Reload to clear.
- **What none of that catches:** anything depending on the *shape* of a live envelope. `hasField()` reading `record_fields` off the cells envelope passed syntax checks, headless tests and code review, and only showed up as missing rows on the deployed page. After any inspector/record change, open a record on the live site and read the rows.
- Toggling the other layers off is the cheap way to prove one layer's points actually render.
- **Testing a transition, not just an end state (added after review round 5, correction 1):** a bug can live entirely in the window between two fetches, so assert on what the page hands the renderer over time, not on where it settles. Serve the build locally, `page.route()` the hub to fixtures whose payloads carry a run label, delay one response, and swap in a **globe.gl test double** that records every `pointsData` / `ringsData` / `polygonsData` call. Zip the calls by index (a render pass calls them back to back) and assert no pass mixes labels. Run it against the **previous** build first: a test that does not fail on the old code is not evidence. `ME.pairState(layer?)` reports the same invariant live.
- **Live RC check in a clean session (added thread 13):** open a fresh pane tab on a plain-text github.io file (e.g. `app.js?clean-rc1`) so no page scripts run; fetch `index.html`, `app.js`, `style.css` from `raw.githubusercontent.com/…/<commit>/`, check sha256, replace the css/js links with blob URLs, add `<base href>`, then `document.open/write/close`. Never write an RC over the live page — its timers keep running. Verify a deploy by hashing the served files from the pane (`fetch(…,{cache:'no-store'})`); the container cannot reach github.io.
- **Phone layout (thread 13):** ≤ 720 px = header, globe, Readings sheet; legend behind the Key button (`ME.keyState()`), persistent disclosure strip `#persist`. 721–1100 px (incl. landscape phones) = tablet layout, legend static. Measure overlay coverage with the camera-based disc radius (HANDOVER §2), not box estimates.
- Page logic rule that came out of it: records and counts are committed together per layer (`refreshPair`), and `usable(layer)` re-checks `pmeta.id === snapId(state[layer])` at every read. Anything new that renders, lists or selects records goes through `usable()`.

## 5b. Ships duration contract and the retired sleep detector (2 Nov 2026)
One statement of the contract. Code (`collector-mac.mjs`), the envelope's `duration_rule`, and this file must agree; if they ever disagree, the code block marked DURATION CONTRACT is authoritative and the others are the bug.

| | value at the default | rule |
|---|---|---|
| intended sample length | **60 s** | `--window=<s>`, floor 10 s. The listening period we intend. |
| overlong threshold | **> 75 s** elapsed | `1.25 × window`. → `degraded`, `overlong_sample: true`, never a usable sample. |
| hard stop | **120 s** elapsed | `2 × window`. Socket force-closed; a message arriving at or past this is rejected **before** it can touch the vessel map. |

Both thresholds are multiples of the window, so a non-default `--window` scales them. The **180 s window in the 2 Nov physical test was a one-off override** to give a human time to trigger Apple-menu Sleep; it moved the thresholds to 225 s / 360 s for that run only and appears nowhere in production. Elapsed time is never counted as listening — the observation figure is `messages_flowing_s`, which is inferred.

**The wall-minus-monotonic sleep detector is retired on this Mac.** Measured 2 Nov against `pmset -g log`, which macOS writes and the collector has no part in: three overnight samples sat inside Maintenance Sleep of 946/921/682 s against collector gaps of 948/923/686 s, and it reported `slept=false` on every one. `process.hrtime` advances across suspend here, so both clocks include the suspended time. `wall_s` and `mono_s` are still published as raw measurements; **neither is evidence that sleep did or did not occur**, and nothing may be written that reads them that way. Status hangs on elapsed time instead.

Deterministic test of the hard boundary: `node phase1/duration-contract.test.mjs` (stubbed socket, controllable clock, no network, nothing uploaded). Case A delivers a position past the hard deadline and proves it is rejected before mutation; Case B lets the deadline pass with no further message and proves the run still ends and is still unusable, so cleanup does not depend on `onmessage`. **This proves the guard's logic only — the physical long-sleep/resumption case on real hardware stays open.**

## 6. Collector conventions (worker.js)
- Envelope per §5: `record_format:'rows'` + `record_fields`; cells `{count, coverage:{grade, evidence, observed_fraction}}` on a 4° grid; `latest/<layer>.json` only overwritten on success; `latest-cells/` small files; `stale_after_s` per layer; `writeDown()` on failure.
- Each collector runs inside `guarded()`; one throw never kills the others.
- Big files: `tail(text, n, bytesPerLine)` — never split a multi-MB file whole (measured 113 ms CPU when we did).
- Index layers (swpc, co2, seaice) set `map_layer:false`, carry `index{}`, `comparison{basis}` (source-provided baselines only; any subtraction we do is labelled ours), `citation`, `quantity`.
- Sentence template on the page cannot emit a cause. Comparisons: "none of ours yet" until phase 3; source-provided ones are labelled as the source's.

## 7. Register discipline
`REGISTER.md`: Chad opens the licence page and pastes the operative sentence; Claude files it verbatim with the date. Attribution forms required by sources are on the page footer (USGS credit, NOAA SWPC, NOAA GML citation, LANCE acknowledgment sentence, NSIDC). NASA's "not for tactical/local-scale decisions" line is on the page.

## 8. Open items (the ordered list is STATUS → Next)
- Ships via the Mac collector (aisstream WebSocket → `/ingest/ships`), then show on the page. R2 48 h retention job (D12). NSIDC citation paste. Polar-cap imagery decision. ADS-B receiver basket. Week-one FIRMS CPU review.

## 9. Handover rule for every thread
Before a thread ends: update STATUS.md (all three copies + project doc), update this file if an operating fact changed, and leave the next concrete action as item 1 of STATUS → Next. The new thread's first act is to read START-HERE then STATUS — Chad has put that instruction in the Project's custom instructions so it happens without being asked.
