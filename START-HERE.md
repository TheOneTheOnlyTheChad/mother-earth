# Mother Earth — START HERE (read this before anything else in a new thread)

Written 31 Oct 2026 at the end of build day one; §3–§5 revised in thread 2 (31 Oct); §5a added in thread 4 (1 Nov). Purpose: a cold-start brief so a new thread can continue without re-learning. Read this, then `claude/HANDOVER.md` (live state + next), then `claude/STATUS.md` (newest first; threads 1–13 in `docs/STATUS-ARCHIVE.md`), then only the docs a task needs (`claude/SPEC-v0.3.md`, `claude/PROJECT-BRIEF.md`, `phase1/GUIDE-step1.md`).

## 1. What this is
One browser globe showing the latest observations of the planet from open live feeds. The promise, verbatim and on the page: **"See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage."** Build spec is SPEC-v0.3 with deviations D1–D14 logged in `docs/STATUS-ARCHIVE.md` (moved from STATUS.md 5 Nov). Phase 1 is live.

- Page: https://theonetheonlythechad.github.io/mother-earth/ (GitHub Pages, repo root `index.html`). **Pushing `main` publishes it** — unreleased page work lives on a branch (e.g. `aircraft-rc`) until Chad approves.
- Hub/collector: https://mother-earth.chadoberholzer.workers.dev — `/`, `/status`, `/health/<runs|publication|archive|coverage>/<usgs|firms>` (hub ≥ 0.5.3: 200 ok / 503 failing, fail closed, no-store; watched by UptimeRobot every 5 min with push to Chad's phone), `/cells/<layer>`, `/snapshot/<layer>`, `/elements/satellites`, `/elements/orbital`, `/admin/run/<job>?key=ADMIN_KEY`, `/admin/probe/r2-conditional?key=ADMIN_KEY` (0.6.0; writes and deletes only `probe/` keys) (Workers Paid since 3 Nov 2026). **Hub 0.6.1 since 8 Nov 2026 07:58 UTC (Kp degraded = ≥ 7.5 h past interval start, provisional; envelopes carry `status_reason`, worded on the page by `ME.degradedWhy`) — FIRMS v2 pipeline ON since 0.6.0 (7 Nov)** (`FIRMS_PIPELINE=v2`, `FIRMS_CREATE_ONLY=verified`; state in D1 `firms_*`; rollback = delete `FIRMS_PIPELINE`; see `reviews/2026-11-06-firms-v2-build.md`; rollout closed 8 Nov, main = live).
- **Hub 0.6.8 since 11 Nov 2026 19:38:18 UTC** (`85737a48…c427`; rollback = 0.6.7 `53ede31e…fb9e43`). **Buoy fallback LIVE (page merge `7c3aa22`):** when an hourly OSMC update fails, the hub keeps the last good buoy counts and adds `last_attempt`; the card reads "degraded" with "Latest update failed at HH:MM UTC. Showing buoys from the HH:MM UTC run." for up to 4 h, then unknown. Record: `reviews/2026-11-11-osmc-reliability-rc.md`, `docs/concepts/OSMC-RELIABILITY-PROPOSAL.md` rev 2.1; §4r. **Not yet seen on production** (no buoy failure since the deploy).
- **Fires card wording LIVE since 11 Nov 2026 (merge `0386058`):** during the daily FIRMS reset the card says "Today’s detections aren’t available yet." (state UNKNOWN, records withheld); real failures keep "collector reported down: …". Seen live 12 Nov 01:40 UTC. `index.html` only; §4r.
- **Globe performance B2b LIVE since 11 Nov 2026 (merge `a80bc49`):** coverage cells draw with no side walls and shared single-sided fills (`CELL_PERF` in index.html; one constant, no URL switch). ~2.5× fewer draw calls; frames 33→16.7 ms (fast state), ~220→50 ms (slow state). Rollback = revert `a80bc49`. Record: `reviews/2026-11-11-globe-perf-rc.md`; §4q.
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
- **Timeline T1 exception ENDED 10 Nov 2026 (deep-time release, main `57d07c2`).** The Pliny entry stays pre-rendered in the page; the deep-time axis follows the fixed-catalogue pattern: `phase1/timeline/build_timeline.py` generates `catalogue/tl-<rev>.json` and the page; the page pins the catalogue sha256, revision and build; hub ≥ 0.6.3 serves `ref/timeline/<rev>.json` at `/catalogue/timeline` only if its whole-file sha256 matches the Worker pin (else 503). A new catalogue revision = regenerate, re-pin page + Worker together, R2 upload, hub deploy, page release — each on its own Approve line. (Was: T1 bounded exception, live 9 Nov — one entry held by the page itself, no hub route.)

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
**Mac sync fallback (9 Nov):** the Mac shell's `git clone` of github.com was refused (proxy 403), but `curl` to `raw.githubusercontent.com/<owner>/mother-earth/<commit>/<path>` worked: download each changed file at the commit, check its sha256 against the commit, preserve as below, copy, re-hash.
**GPT reads the folders (Chad, 9 Nov):** messages for GPT point to file paths (repo path + commit, Mac folder synced) instead of carrying full content.
**Preserve before overwriting (Chad, 8 Nov):** the Mac folder is not a git repo, so local edits cannot be ruled out. Before overwriting any destination file that differs from main, copy it to `_sync-preserved/<UTC timestamp>/<path>` inside the Mac folder, then copy main's version and hash-check. Report every difference (file, preserved path). A hash match after copying proves only the copy, never that the earlier destination had no local edits.
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

## 4f. Monitoring (added 6 Nov 2026)
- **UptimeRobot Free** ($0, Chad's account): 8 monitors (runs, publication, archive, coverage × usgs, firms), HEAD every 5 min, alerting by email and iPhone push. Tested 6 Nov with the Mac lid closed: alerts arrive within ~1 s of a failed check.
- The endpoints judge pipeline facts (successful publication, run streaks, checkpoint completion, coverage), not just whether the hub answers. A red monitor is a finding. Never alter evidence to turn one green. Known case: "coverage firms" shows red while the previous day's coverage is stale (e.g. 5 Nov during 6 Nov).
- With monitoring live, routine overnight check-ins are optional (Chad's call). The connector (§4e) reads D1 with the Mac closed. Telemetry (CPU, memory) still needs the browser pane.

## 4g. Thread facts (8 Nov 2026, Kp thread)
- **Deploy read-back, exact:** in the dashboard tab, `GET /api/v4/accounts/<acct>/workers/scripts/mother-earth/content/v2` (header `x-atok`) returns multipart; `await r.formData()` → `get('worker.js')` gives the script itself, whose sha256 must equal the commit's. No wrapper stripping needed. Bindings: `GET …/settings` (19 on 0.6.1).
- **The content-only upload passed on Chad's exact Approve line** (0.6.1, 8 Nov). Keep the pattern: fetch from raw.githubusercontent at the commit, sha-check in the tab, PUT, read back.
- **Release pattern that worked:** branch → GPT review rounds → `Approve: deploy hub …` → first scheduled runs read in D1 → live RC check in a clean pane tab against the deployed hub → `Approve: push <branch> to main (page change: …)` → no-ff merge (check overlap first) → served-hash check → live read.
- **GitHub in the pane:** Chad is signed in; `github.com/<repo>/branches/all` read with `get_page_text` shows ahead/behind per branch. Only Chad deletes refs (the session proxy refuses).
- **Open pages keep their imagery date:** `IMG_DAY` (now − 36 h) is computed once when `app.js` loads, so a tab open across 12:00 UTC keeps the old date (label and request still agree) until reloaded. Confirmed live 8 Nov.
- **Test pattern for page wording:** `app.js` loads in Node (`globalThis.window = globalThis; globalThis.document = {}; new Function(src)()`), then set `ME.state[layer]` and read `ME.freshness`, `ME.readings()`, `ME.report(R).text`. Test **generated** hub fields (export the builder, JSON round-trip) through the renderer, not hand-written fields.

## 4h. Thread facts (9 Nov 2026, Arts/timeline thread)
- **Browser pane from a cloud session:** the pane tools are `mcp__remote-devices__Claude_Browser__*` (load with ToolSearch). `navigate` opens the pane; the dashboard session (`window.bootstrap.atok`) was still signed in on 9 Nov.
- **R2 billing reads (read-only):** `GET /api/v4/accounts/<acct>/subscriptions` (R2 Paid is its own subscription, $0 base, usage-billed; Workers Paid has no R2 component); usage via `POST /api/v4/graphql` with `r2StorageAdaptiveGroups` (max payloadSize + metadataSize per day) and `r2OperationsAdaptiveGroups` (sum requests by actionType, bucketName, storageClass) from the billing-period start. Classify operations against the pricing page's lists; leave unlisted ones unknown. Analytics are not an invoice. Method and figures: `reviews/2026-11-09-arts-r2-billing-check.md`.
- **Arts card (LIVE since 9 Nov 06:20 UTC; hub 0.6.2):** a new kind of hub route, a **fixed catalogue** (`GET /snapshot/arts`), outside `LAYERS`, cron, D1, health and history; served only if the complete stored file matches `ARTS.fileSha256`. The page logic is a **new page file `arts.js`**, so served-hash checks after its release cover **five** page files. The generator is `phase1/arts/build_arts_snapshot.py` (`--generated-at` pins the bytes).
- **Docs added:** `docs/INSPIRATION-50-SITES.md` (not the backlog), `docs/concepts/TIMELINE-CONCEPT.md` (concept only), `docs/research/ENQUIRIES-2026-11.md` (provider emails; no personal contact details in the repo).
- **Test suites added:** `node --no-warnings phase1/arts-hub.test.mjs` (54; `BREAK=records-only|no-records-check|serve-on-fail`), `node phase1/arts-ui.test.cjs` (90; 8899 server + /home/claude/spike; `BREAK=no-consistency|eager|no-warning|no-aria|show-retrieval|css-hidden`). Both are on main since the merge (`6d5ca55`).

## 4i. Thread facts (9 Nov 2026, timeline research thread)
- **Reaching Wikimedia and source hosts:** the workspace shell is refused at the proxy for wikidata.org, wikipedia.org and query.wikidata.org. The **browser pane** reaches them; Chad granted pane site access to wikidata.org, wikipedia.org, waterdata.usgs.gov, nwis.waterdata.usgs.gov, water.noaa.gov, web.archive.org and archive.org (scope site).
  - Requests are sent **one at a time**, with `Api-User-Agent: MotherEarthResearch/0.1 (https://github.com/TheOneTheOnlyTheChad/mother-earth)` (no personal email) and `maxlag=5` on Action API reads.
  - The WDQS limits are in the Route W terms record rev 2.
- **The pane tool's 45 s cap leaves scripts running.** A timed-out `javascript_tool` call keeps executing, and on 9 Nov it overlapped later queries. Background a long request explicitly (`window.__p = …`), then poll in later calls.
- **Wayback tabs fake the clock:** page JavaScript on a web.archive.org replay reports the archived time. Never take a timestamp from such a tab; use the Mac or workspace clock. Use `Memento-Datetime` (HEAD on the `id_` URL) for capture times.
- **Moving pane data to the Mac:** gzip + base64 in the pane, then `base64 -d | gunzip` in `device_bash`, then hash-check both sides. Pane working memory is lost when a tab navigates away, so save before navigating.
- **Research packets live in the Mac folder** (`research/timeline-route-w/…`, `research/timeline-wikipedia-pilot/…`). The repo gets IDs, revisions, hashes and dispositions only.
- **Corrections go in a `rev2/` folder** beside the frozen originals. The LOG is append-only.

## 4j. Thread facts (9 Nov 2026, timeline-tests thread)
- **Research packets** (Mac folder, not the repo): `research/timeline-test-a/`, `timeline-test-a-retry/`, `timeline-test-a-oa/`, `timeline-test-b/` (each `2026-11-09-claude/`, with `LOG.md`, `.hashes`, and a `rev2/` folder for corrections).
  - **Pattern:** protocol fixed and hashed before any request; real-clock LOG, append-only; corrections in `rev2/` with `.orig-hashes`; originals never edited.
- **Routes that worked (pane):**
  - Europe PMC REST (full-text XML for PMC open-access; abstracts otherwise);
  - OpenAlex and Crossref APIs: cross-origin fetch from the ebi.ac.uk tab works;
  - HAL API (cross-origin);
  - the Wikipedia Action API;
  - The Latin Library and Perseus (`/hopper/xmlchunk`, `/hopper/dltext`) as same-origin text.
- **Routes that did not:**
  - ScienceDirect serves HTTP 403 to the pane even on its home page (the error page shows the pane's User-Agent);
  - De Gruyter Brill returns an empty HTTP 202;
  - Internet Archive Scholar returns a proof-of-work "verifying your session" page. **Not solved** (bot detection);
  - nature.com articles: HTTP 200 with a normal session, but subscription content even signed in;
  - Springer chapter pages: HTTP 200, abstract.
- **Pane site approvals Chad granted this thread** (scope site): en.wikipedia.org, ebi.ac.uk, degruyterbrill.com, link.springer.com, sciencedirect.com, nature.com, scholar.archive.org, openresearch-repository.anu.edu.au, research-repository.griffith.edu.au, thelatinlibrary.com, en.wikisource.org, perseus.tufts.edu.
  - Chad also holds a Springer Nature account (Google sign-in) in the pane.
  - **Claude never types credentials; logins are Chad's.**
- **Text-only rule (H8b no):** no PDF is fetched or opened; a PDF-only copy is recorded as "found, unopened".
- **Pane working memory survives in a tab until it navigates.** Data already fetched can be re-read from it without a new request; record that you did.

## 4k. Thread facts (9 Nov 2026, Timeline build thread)
- **Timeline page LIVE 16:33 UTC 9 Nov** (main `4b23518`). Files: `timeline.html` (entry between `<!-- TIMELINE:BEGIN/END -->`, generated — edit the JSON, run `python3 phase1/timeline/build_timeline.py`, check with `--check`), `timeline.js` (history/focus; no fetch; does not load app.js), styles scoped under `body.tl` in `style.css`. Header tabs on all three pages; phone header = two-row grid, `--header:94px`. **Served-hash checks now cover seven page files.**
- **Tests:** `node phase1/timeline-ui.test.cjs` (584; `BREAK=` 12 breaks incl. switch-pushes, unscoped-card, no-withdrawal); desktop-overflow and mobile-pass must be rerun on any header change (the 390×844 overlay figure was 7.2% at release vs 8% target).
- **GPT smoke tests a branch** from a hash-checked copy in the Mac folder `_review/<branch>/`, served by Chad in Terminal: `python3 -m http.server 8899 --bind 127.0.0.1` (GPT's shell cannot start a server; its browser rejects `file://`). Bump `?v=` between review rounds so cached CSS/JS cannot mask a fix.
- **Source status can change after a check:** EGU21-16222 was found withdrawn (8 Mar 2021) only when Chad read the publisher page for R1; OpenAlex did not flag it. For any attributed source, read the publisher's landing page before release.
- **Pane with Chad's screen locked:** fetch-based checks (served hashes, page reads) still worked (16:36 UTC 9 Nov).

## 4l. Thread facts (10 Nov 2026, Sky on Two Clocks thread)
- **Sky card LIVE 10:43 UTC 10 Nov** (main `a1c3ed6`; hub 0.6.5).
  - Page logic in `sky.js` (new page file), so **served-hash checks now cover eight page files**.
  - The catalogue is a fixed, versioned file, `/catalogue/sky/<revision>`. The hub pins its own key and hash (`SKY_REVISIONS`); the page pins its revision and sha256.
  - Generator `phase1/sky/build_sky.py --manifest revisions/<rev>.json [--base DIR --out-dir DIR] [--check]`. Revision ids `sky-YYYY-MM-[RT]n`: T = rehearsal, never published.
- **Horizons is reachable only from the pane** (a tab on `ssd.jpl.nasa.gov`). The workspace and Mac shells get proxy 403.
  - Recipe: GET `/api/horizons.api` VECTORS, `CSV_FORMAT='NO'` (CSV drops the vector columns), `TIME_TYPE='UT'`.
  - Cross-check: File API (`/api/horizons_file.api`, POST multipart `format`+`input`, one TLIST epoch per line, lines < 80 chars) with our own UTC→TDB epochs.
  - Raw bytes come back to the workspace through the tool output: base64, or gzip+base64 via `CompressionStream`. The sha256 is checked on both sides.
  - Never click "I Accept the Terms Above" on ssd-api.
- **Refresh:** due by 2027-06-01. Run step 0 (Bulletin C, `hpiers.obspm.fr/iers/bul/bulc/bulletinc.dat`) first, then follow the T1 rehearsal (Mac `research/sky-two-clocks/2026-11-10-claude-rehearsal-T1/`) as the worked example.
- **Pages-origin checks:** the hub's responses carry no `Timing-Allow-Origin`, so transfer size reads 0 from the Pages tab. Measure it from a tab on the hub's own origin (R1 was zstd, 26,819 B).
- **Branch page against the live hub:** fetch the page files by commit from raw.githubusercontent, check hashes, then blob-inject them into a clean Pages-origin tab with `document.write`.

## 4m. Thread facts (10 Nov 2026, Sky zoom-out thread)
- **Sky zoom-out view LIVE 15:56 UTC 10 Nov** (merge `5d01462`; page = `860ed35`; hub 0.6.6 `4231114d…`). New page file `skyscene.js`, so **served-hash checks now cover nine page files**. Scene file `sky-scene-2026-11-R1` (`d4605c3d…`, 67,778 B) in R2, served on the existing `/catalogue/sky/<revision>` route; it pairs with R1 (`pairs_with`), and the page refuses any other pair.
- **Generator:** `phase1/sky/build_scene.py` (rebuilds R1 in memory and refuses an unpaired build), `earth_orient.py` (IAU 2006 precession + GMST transcribed from ERFA `1a8044c`; ten files' notices verbatim; `ERFA-LICENSE.txt`). **Refresh by 2027-06-01:** regenerate the card AND the scene as a pair (one R2 upload each, one hub pin each, page pins both). Add a Bulletin A check (UT1−UTC and polar-motion sizes; rerun `docs/concepts/sky-zoom-out-desk-check/sensitivity.py`) beside Bulletin C step 0.
- **Tests:** `python3 -I phase1/sky-scene-build.test.py` (needs `pip install pyerfa`), `node phase1/sky-scene-ref.test.mjs` (astronomy-engine in /home/claude/spike), `node --no-warnings phase1/sky-scene-hub.test.mjs`, `node phase1/sky-zoom-ui.test.cjs` (333 checks; 27 breaks via `BREAK=`; ~6 min alone, ~15–20 min when six run in parallel).
- **Fresh-container test setup:** in /home/claude/spike, `npm i globe.gl@2.45.0 astronomy-engine @fontsource/barlow-condensed @fontsource/ibm-plex-mono pngjs satellite.js@6.0.2`; `pip install --break-system-packages pyerfa`; `mkdir -p /home/claude/fixtures && node phase1/orbital-fixture.build.mjs` (synthetic, seeded) for mobile-pass and orbital-browser. `orbital.test.mjs` is a manual tool, not a suite.
- **Background limits:** a `run_in_background` command dies at its timeout (default 30 min). Give the local `http.server` an explicit long timeout, or later suites see ERR_CONNECTION_REFUSED.
- **Load-sensitive suite:** orbital-browser fails 1/113 (marker ~1.6 s ahead of its reference) when six browser suites share the machine; it passes alone. Run it alone before treating a failure as real.
- **globe.gl quirks found:** its own controls `change` handler resets the orbit target to Earth's centre (a view needing another target re-sets it in a later-registered handler); damping is on (0.1). The globe mesh appears only once globe.gl has finished building (wait for it). The page has no three.js Line/Basic material constructors (harvest Mesh/Sphere/Phong from the globe mesh; draw lines as SVG from `getScreenCoords`).
- **Break discipline that paid off:** a break that passes means the test can't see the defect. Three did this today (tag rule never exercised; near check compared the page with itself, twice). Check each against an independent computation, not the page's own report.

## 4n. Thread facts (10 Nov 2026, buoy temperature + Ocean Heat thread)
- **Buoy temperature colours LIVE 17:29 UTC 10 Nov** (merge `28d6047`).
  - One source of truth in `app.js`: `ME.SST_BREAKS`, `ME.SST_COLOURS` (viridis 0.25–1.0, 8 classes) and `ME.SST_NONE` `#b0b0b8` ("Temperature unavailable"). `ME.sstClass(t)` returns −1 for null and for anything non-finite; 0 °C is a class.
  - Keys built from it: `#sstkey-drifters` (card) and `#leg-drifters-sw` (main key).
  - Tests: `node phase1/buoy-temp.test.mjs` (37; `BREAK=null-zero|edge|grey-class|no-none`); `node phase1/buoy-temp-ui.test.cjs` (33; `BREAK=fixed-yellow|key-always|null-zero`; serves a dark-ocean PNG for GIBS so the globe builds).
- **Lesson: pick dot colours on the real globe.** globe.gl shades 3D dots darker than their declared colour, so desk ΔE overstates visibility on night-side ocean (the first grey `#54545a` nearly vanished). The real backdrop is often cloud (white/grey), not dark ocean. Compare candidates through the page's own render path in a Pages-origin RC tab; points set by hand with `pointsData()` did not render.
- **Playwright:** `require('playwright')` resolves from `/opt/npm-tools/node_modules`. Run suites with `NODE_PATH=/opt/npm-tools/node_modules:/home/claude/spike/node_modules`.
- **NOAA STAR file share** (`www.star.nesdis.noaa.gov`): reachable **only from the pane** (Chad granted the site); both shells get proxy 403. Byte ranges are honoured. Large files: Chad downloads them in his browser; Claude reads them from a granted `~/Downloads` and works in the Mac shell (`pip install --break-system-packages netCDF4` works there; Python 3.10, so no `-P`; keep scripts in a folder apart from the data).
- **CoralTemp rows are south-first; the CRW SSTA and climatology files are north-first.** Same grid otherwise. Flip and assert before comparing.
- **OSMC 522 (16:07 run):** one failed upstream hour blanks the live buoy layer ("unknown, records withheld") although the last good records exist. A separate reliability follow-up (GPT's shape: a coherent last-good pair with its original time, plus a feed-down label).

## 4o. Thread facts (11 Nov 2026, Ocean Heat release thread)
- **Ocean Heat LIVE 09:58:30 UTC 11 Nov** (merge `158e4b1`; hub **0.6.7** `53ede31e…fb9e43` since 09:36:49 UTC; rollback = 0.6.6 `4231114d…f078` and/or revert `158e4b1`, each its own Approve line). New page file `oceanheat.js`, so **served-hash checks now cover ten page files**.
- **Hub route** `GET /catalogue/oceanheat/<revision>/<file>`: frozen pins (`OCEANHEAT_REVISIONS`: key, sha256, bytes, type) for `oh-2026-11-09-R1` only. Path segments are matched **literally** (no percent-decoding). Serves only when length and sha256 match, with `public, max-age=86400, immutable`; 404 and 503 (missing / unreadable / size / integrity) are `no-store`. Outside LAYERS, cron, D1, health and history.
- **R2 objects:** `ref/oceanheat/oh-2026-11-09-R1/{manifest.json, mask.bin.z, v025.bin.z, v050.bin.z}` (4,585 / 137,652 / 1,081,272 / 323,176 B). **A refresh is a new revision id** (new keys, new pins, new page `REV`/`BASE`/`MANIFEST_SHA256`); never overwrite R1.
- **The repo carries no snapshot copy.** The four files are in git history at `db5eedd` (`git show db5eedd:data/ocean-heat/oh-2026-11-09-R1/<file>`), and in R2. For tests, rebuild the folder that way and set `OH_SNAPSHOT_DIR` to it; the suites hash-check it and fail if `data/ocean-heat/` exists in the checkout.
- **Tests:** `node phase1/ocean-heat/check_release_pins.mjs` (Worker pins = manifest = page; 3 breaks); `node --no-warnings phase1/oceanheat-hub.test.mjs` (48; 7 breaks); `node phase1/oceanheat-ui.test.cjs` (109; 14 breaks; needs the local `http.server` on 8899 with a long timeout).
- **Edge compression:** Cloudflare compresses the JSON manifest in transit, which weakens its ETag (`W/"…"`); bytes are exact and `immutable` means no revalidation, so browser cache reuse still works (measured). The binaries keep strong ETags.
- **R2 uploads of binaries** work through the dashboard API from the signed-in pane tab (`PUT /r2/buckets/mother-earth/objects/<key>` with `x-atok`, body = the hash-checked bytes from raw.githubusercontent by commit; check the destination is empty first; read back after).
- **Live RC injection:** start from `…/mother-earth/sources.html` and clear its timers. The GitHub 404 page blocks outside fetches (CSP), and `…/LICENSE` downloads as a file. Wrap `fetch` before `document.write` to log the page's own requests; `performance` resource durations show cache reuse.
- **Claude in Chrome:** `javascript_tool` calls time out at 45 s. Run longer timing jobs in the background (results on `window.*`) and poll.
- **Pages build status** is not readable from the container (`gh api …/pages/builds` blocked by the proxy). The served-hash check is the verification.
- **Performance:** the regression gate (layer must not slow the page measurably) is the merge criterion, and it was met. The page itself misses the absolute targets (150–200 ms frames on 11 Nov, 3,289 scene objects); the coverage-cell polygons are the measured lead (§10 of `reviews/2026-11-10-ocean-heat-rc.md`).
- **STAR notice:** free use with credit to the NOAA / NESDIS Center for Satellite Applications and Research; credited in the inspector, footer and Sources. The experimental-status wording stays in the research record only (GPT).

## 4p. Thread facts (11 Nov 2026, globe performance Stage 0)
- **Claude in Chrome loses its tab when DevTools is undocked:** the tab leaves the Claude tab group and can't be reached again (in-page state is lost). Keep DevTools **docked** for traces; record the narrower viewport.
- **Traces: stop within a minute.** A Performance recording left running 30+ min could not be saved. Mark windows with `performance.mark`, tell Chad "STOP" right after, save to Downloads, read it on the Mac (`device_bash`, Python 3.10, gzip JSON).
- **Claude in Chrome blocks base64-looking output and truncates `javascript_tool` results at ~1,000 chars.** Bulk results: `console.log` chunks of ~2,500 chars read with `read_console_messages` (full messages), or a blob download from the tab to Downloads (Chad's permission) then read on the Mac and hash-check.
- **A hidden tab breaks a dwell:** timers throttle when Chrome is behind the Claude app. Log `visibilitychange` and restart if hidden; ask Chad not to switch apps.
- **Stage 0 harness** (read-only, `reviews/evidence/2026-11-11-globe-perf-stage0/harness.js`): time-based sweep, render-CPU wrap, draw calls, forced completion, census, hide/restore. Reusable for Stage 1 and later performance checks.
- **Measured (Stage 0):** coverage-cell polygons = 99.6 % of draw calls; hiding them → 16.7 ms frames; cost is three.js per-object CPU work (trace). Scene grows only with cell count (no leak). Picking precedence Earthquakes > Fires > Ships > Forest; tap → inspector median 433 ms.

## 4q. Thread facts (11 Nov 2026, globe performance build + RC + release)
- **Cell drawing (index.html `CELL_PERF`):** `polygonSideColor` returns `null` (any value, even fully transparent, makes globe.gl build and draw side walls); caps use `polygonCapMaterial(p => p.mat)` with one `MeshBasicMaterial` per distinct fill made fresh in each `render()` pass (constructor harvested from a globe.gl-built cell; first pass uses globe.gl defaults, then one redraw). Never cache these materials across passes: globe.gl disposes a removed cell's materials (break `cache-across-passes`). `ME.cellPerf()` is a read-only aid.
- **Suite `phase1/cell-perf-ui.test.cjs` (43):** serves main/B1/B2a by rewriting the one `CELL_PERF` constant in the served HTML; release checks on the untouched file; captures the page's own `tick` from `setInterval` (filter `fn.name === 'tick'` — sky.js and skyscene.js also run 5-min intervals) to run a real scheduled refresh. Needs a backdrop PNG for GIBS or the globe never draws (blank canvas ⇒ vacuous pixel checks).
- **Chrome RC pattern that worked:** one tab, reloaded per window; candidate = branch `index.html` fetched from raw.githubusercontent by commit, sha-checked, `<base href>` added, `document.write` on a plain-text Pages URL (only index changed, so other files load live — check they equal the branch). Harness kept in the Pages origin's `localStorage` across reloads (`eval` per load; remove the keys after). Settle = polygon groups == `polygonsData().length`, steady 2.5 s. `browser_batch` with more than ~2 loads times out (work still completes; read the log).
- **Frame states:** visible-cell frames sit in a fast (~33 ms old / 16.7 B2b) or slow (~220 ms old / 50 B2b) state; trigger unknown. Matched pairs must record which state; the slow state can be reproduced only by waiting — inject the old page from its commit to compare.
- **Local `http.server` dies at the 2-hour background limit** — restart it before long suite runs; a suite that prints nothing ran into it.
- **Tests write evidence images to `/home/claude/spike/`;** buoy-temp-ui hard-codes another session's scratch path (line 134) — first run can fail there.

## 4r. Thread facts (11–12 Nov 2026, Fires wording + OSMC reliability thread)
- **Fires wording (`index.html`, `FIRMS_NOT_YET`):** the card matches the hub's note by its opening words, "no detections processed yet for today (UTC)" (`collectFirms` in `worker.js`). Reword that note and the card falls back to "collector reported down"; `phase1/fires-wording-ui.test.cjs` (35; 3 breaks) reads the note from `worker.js` and fails first. `ME.freshness` is untouched, so the report, cell inspector, search and Sources keep the full reason.
- **Buoy failure path (hub ≥ 0.6.8, `driftFail` in `worker.js`):**
  - Buoys never reach the generic `writeDown`, including via `guarded()` (reason `internal_error`).
  - `latest-cells/drifters.json` keeps the good run's counts unchanged plus `last_attempt` (`run`, `failed_at`, `status`, `http`, `reason`, `consecutive_failures`). `failed_at` is captured on entry, before any await.
  - Every failure write is conditional (etag of what was read, or create-only), re-read once, ordered by **run timestamp** (`scheduled_for` / `last_attempt.run`); stored data from the same or a later run is left alone.
  - Nothing good to keep → an empty down envelope whose public note is a fixed phrase ("http error 522"). The raw note stays in `collector_runs` and the private per-run object.
  - `/status` is public and shows each layer's latest run note (secret-redacted) — existing behaviour for every layer.
  - `/place` withholds a buoy fallback older than 4 h; ordinary stale buoy sections are handled as before.
- **Buoy page behaviour:** badge "degraded" only when the fallback's records are read and paired; records missing or mismatched → unknown, no count, no cells, "buoy positions not shown". The 30 s timer redraws the map when a fallback expires (other layers still redraw only on the 5-min refresh).
- **Suites:** `node --no-warnings phase1/osmc-reliability-hub.test.mjs` (27; 12 breaks; dispatch path + public endpoints, fake R2 with conditional puts, clock faked for `Date.now()` and `new Date()`). `node --no-warnings phase1/osmc-reliability-ui.test.cjs` (41; 11 breaks; needs the 8899 server and commit `0386058` in the clone: `git fetch --depth=60 origin main`).
- **Fixture hub pattern (reusable):** `phase1/osmc-reliability-fixture-hub.mjs <port> [worker.js]` runs the real hub code behind a local port with a controllable clock and OSMC stubbed, so a browser suite reads responses the hub produced. Run a second one on main's old `worker.js` to test page/hub version skew both ways.
- **A test that reads `main` as "the old version" breaks at the merge** (5 false failures on 11 Nov). Pin the old reference to a commit.
- **`hourly` runs other collectors first**, so a faked clock has already moved when the buoy job starts; use `/admin/run/drifters` for timing-exact hub tests.
- **Version pins in tests:** use "at least", not equality (`oceanheat-hub` was loosened to ≥ 0.6.7 on 11 Nov).
- **Fresh container setup that worked:** `/home/claude/spike`: `npm i globe.gl@2.45.0 pngjs astronomy-engine satellite.js@6.0.2 @fontsource/barlow-condensed@5 @fontsource/ibm-plex-mono@5`; `node phase1/orbital-fixture.build.mjs`; Ocean Heat snapshot via `git show db5eedd:data/ocean-heat/oh-2026-11-09-R1/<file>` into a folder, `OH_SNAPSHOT_DIR` set to it; `mkdir -p` the scratch folder `buoy-temp-ui` hard-codes (line 134). Full regression takes about 30 min.
- **Clone tracking:** a `--depth` clone tracks only `main`; set `remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'` before pushing a branch, or the stop hook reports it unpushed.
- **Mac shell `git clone` of GitHub worked on 11 Nov** (it was refused on 9 Nov). Try it first for a `_review/` copy; fall back to raw.githubusercontent per file.
- **Timestamps:** two STATUS stamps in this thread were first written as estimates and corrected the same hour. Take the stamp from `date -u` in the same command that writes the entry.
- **An `Approve:` line can arrive inside a pasted GPT review.** On 11 Nov the merge line did; it was taken as Chad's because it came in his own message, and that was said to him.

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

## 4s. Thread facts (12 Nov 2026, lockdown pass)
- **Lockdown records live outside this repo** (Mac `research/lockdown/2026-11-12-claude/`, Claude Project). Parked by Chad 12 Nov; do not restart it unasked.
- **The workspace shell cannot reach the Ruby package registry**, in this or a fresh session, even with Chad's network setting on "allow all sites". The Mac shell Claude uses is refused too. The browser pane can reach it.
- **How the site is built today** (from GitHub's build log, 12 Nov): image `jekyll-build-pages` v1.0.13, `github-pages` v232, Jekyll 3.10.0, no config file, default theme. The image has no dependency lock.
- **Reading a Pages build:** `gh api repos/<owner>/<repo>/actions/runs` and `/actions/artifacts` work through the proxy; run logs download (`/actions/runs/<id>/logs`). The artefact file's storage host is refused from the workspace and the Mac shell; it can be fetched and inventoried inside a github.com pane tab (zip → tar → per-file sha256 in page JavaScript). The artefact expires after about a day.
- **Project uploads from a file:** `project_write` with `local_path` only accepts a path inside the working directory. For a file that must stay out of the repo, stage a temporary copy under `.git/` (untracked), upload, delete it.
- **A push to `main` publishes.** Treat anything committed as public.

## 5. Browser pane facts
- **Measuring the backdrop (8 Nov):** GIBS is not reachable from the container. In a pane tab on a plain-text github.io file, fetch the WMS GetMap exactly as the page does (EPSG:4326, 2048×1024 JPEG, no-store), decode with `createImageBitmap` + `OffscreenCanvas`, and count near-black pixels (R, G, B < 12) by latitude band. Evidence and script shape: `reviews/evidence/2026-11-08-gibs-black-share.json`.
- **Cold load + total transfer (7 Nov):** the pane's cache can't be cleared, and the hub, GIBS and unpkg send no Timing-Allow-Origin, so pane timing can't see their sizes. Method that works: Chad opens a **Chrome Guest window** (fresh profile), opens DevTools → Network (Disable cache off), loads the page, and exports a HAR (↓ in the Network toolbar). Undock DevTools first, or the viewport shrinks. HARs are committed with bodies stripped (`docs/research/p0-recovery/planet/`).
- **Visible preview of a branch (8 Nov):** pane visible + clean-session injection (§5a). `resize_window` emulates 360/390/1280 widths for screenshots (reset to `desktop` after). The emulated widths are not a real phone.
- **Local clone tracking (8 Nov):** a clone made with a main-only refspec can't see pushed branches; the stop hook then reports "no remote branch". Fix: `git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'`, fetch the branch, `git branch -u origin/<branch>`.
- **Data hosts (7 Nov, Phase 0):** both shells (workspace and Mac `device_bash`) are refused at the proxy (403 on CONNECT) for api.gbif.org even with network access set to "All domains"; the pane's `javascript_tool` reached it (200). Long-running pane loops: wrap each fetch in an AbortController (~25 s) and retry with backoff; slow responses were cut at ~15 s. Avoid parallel bursts (about half of 84 parallel calls failed).
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
**Timestamps (Chad, 8 Nov):** every STATUS/HANDOVER time is either a measured reading (a real clock: tool output, `date -u`, a log) or a git commit time labelled "commit time". Never an estimate. A file cannot hold its own commit's sha, so write the handover header's sha after committing (second commit) or say "this commit".
Before a thread ends: update STATUS.md (all three copies + project doc), update this file if an operating fact changed, and leave the next concrete action as item 1 of STATUS → Next.
**Close-out checklist (Chad, 10 Nov; every thread, before the handover note):**
1. **Mac `_review/`:** move every review copy (`_review/<branch>*`) into `~/Documents/Mother Earth/_to_delete/`. Deletes are blocked in the Mac folder, so use `mv`, never `rm`; if a name already exists there, leave it and say so. Chad empties `_to_delete/` himself. `_review/` should be empty at the end of the thread.
2. **Branches:** a merged release branch is deleted by Chad. Open the GitHub branches page in the pane and ask him. Confirm with `git fetch -p` that only `main` and the parked `aircraft-rc` remain (or name any other branch and why it stays).
3. **Mac sync** of the whole repo at the final commit, preserve-first. Every preserved copy must match an earlier commit; report any that don't.
4. **Clean checkouts:** `git status` is empty in every worktree, and everything is pushed.
5. **Research packets stay** (`research/…`). Never move them to `_to_delete/` without Chad saying so.
6. Then write HANDOVER's "NEXT THREAD STARTS HERE" block and give Chad the copy-and-paste handover note. The new thread's first act is to read START-HERE then STATUS — Chad has put that instruction in the Project's custom instructions so it happens without being asked.
