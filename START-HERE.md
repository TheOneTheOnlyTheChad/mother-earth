# Mother Earth — START HERE (read this before anything else in a new thread)

Written 31 Oct 2026 at the end of build day one; §3–§5 revised in thread 2 (31 Oct). Purpose: a cold-start brief so a new thread can continue without re-learning. Read this, then `claude/STATUS.md` (current state), then only the docs a task needs (`claude/SPEC-v0.3.md`, `claude/PROJECT-BRIEF.md`, `phase1/GUIDE-step1.md`).

## 1. What this is
One browser globe showing the latest observations of the planet from open live feeds. The promise, verbatim and on the page: **"See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage."** Build spec is SPEC-v0.3 with deviations D1–D14 logged in STATUS.md. Phase 1 is live.

- Page: https://theonetheonlythechad.github.io/mother-earth/ (GitHub Pages, repo root `index.html`)
- Hub/collector: https://mother-earth.chadoberholzer.workers.dev — `/`, `/status`, `/cells/<layer>`, `/snapshot/<layer>`, `/admin/run/<job>?key=ADMIN_KEY`
- Repo: https://github.com/TheOneTheOnlyTheChad/mother-earth — push straight to `main` (no branches unless there is a reason; say the reason and let Chad decide)
- Layers running: usgs (quakes), swpc (Kp, hourly), firms (fires), co2 (NOAA GML), seaice (NSIDC); `mock` = hidden test layer fed from the Mac via `POST /ingest/mock` (D11, proven 31 Oct). Parked: opensky (aircraft) — see STATUS.

## 2. How Chad works (observe these; they are standing)
- **Baby steps, click-by-click.** One key, one dialog, one action at a time. He reads code; he does not write it.
- **Measure, don't assume.** Every limit/cost claim gets measured on the real platform and the number written down with the date.
- **$0/month target.** Name every non-zero line item explicitly before it is incurred.
- **MVP lives in the now.** Page reads `latest/*` only; history accumulates cheaply for phase-3 baselines.
- **Keys are shared and recorded.** He is fine with Claude knowing them. Record: `~/Documents/Mother Earth/KEYS.md` (gitignored). Secrets can't be read back from Cloudflare, so the value goes into KEYS.md *first*, then into Cloudflare.
- **Honesty over polish.** If a layer can't be shown honestly (e.g. sea-ice imagery blind in polar night), say "not shown" with the measured reason rather than paint something.
- He says "lol/bro", is warm and direct; match it, keep replies short, bottom line first, no restating his request.

## 3. Where the files live (three copies, keep them in sync)
| What | Repo path (clone at `/home/claude/mother-earth`) | Mac path |
|---|---|---|
| Collector | `phase1/worker.js` | `~/Documents/Mother Earth/phase1/worker.js` |
| Mac/Pi collector | `phase1/collector-mac.mjs` | same |
| Page | `index.html` | `~/Documents/Mother Earth/index.html` |
| Status | `STATUS.md` | `~/Documents/Mother Earth/STATUS.md` + project doc `claude/STATUS.md` |
| Start here | `START-HERE.md` | `~/Documents/Mother Earth/START-HERE.md` + project doc `claude/START-HERE.md` |
| Register | `REGISTER.md` | `~/Documents/Mother Earth/REGISTER.md` |
| Schema | `phase1/schema.sql` | same |
| Keys | never in repo (gitignored) | `~/Documents/Mother Earth/KEYS.md` |

The clone is the working copy (thread 2 onward; the old `/mnt/user-data/outputs/` paths are gone with thread 1's container). In a new container: `add_repo` (push access) → `git clone --depth 1` to `/home/claude/mother-earth`.

Sync procedure after any change: edit in the clone → commit with the attribution trailer → `git push origin main` → copy to the Mac → for STATUS/START-HERE also `Projects.project_write` to `claude/<name>.md`.
Copy to the Mac: the folder `~/Documents/Mother Earth` must be granted each thread (`device_request_folder_access`; Chad approves one prompt). Then either `device_bash` (the folder is mounted at `$HOME/mnt/Mother Earth`; edit in place with sed/python; `rm` is blocked) or `device_commit_files` with `stagedPath` under `/mnt/user-data/outputs/` and `devicePath` `~/Documents/Mother Earth/...` (force:true). Neither shell (container or device) can reach the hub or data hosts — use the browser pane's `javascript_tool` on a hub tab for every HTTP check. The Mac **Terminal** is the only place that reaches the hub from the Mac: Chad runs `node collector-mac.mjs …` there and pastes the output.

## 4. Deploying the collector (Cloudflare has no connector; use the built-in browser pane)
1. Open `https://dash.cloudflare.com/0538d0fe34d9fd261a2eac11583f8972/workers/services/edit/mother-earth/production` in a browser-pane tab. Wait ~15 s for the VS Code editor.
2. Click inside the code (left pane) so it has focus, then **right-click → Command Palette…** (bottom item, ~(213,1111) in an 800-px-wide pane) → type `Select All` → Return. Zoom to confirm the whole file is highlighted. (cmd+A / paste do **not** reach the editor — it is a cross-origin iframe.)
3. **`type`** the whole file over the selection, from a copy with leading whitespace stripped and `/**` changed to `/*` (`sed -E 's/^[[:space:]]+//' worker.js | sed 's#^/\*\*#/*#'`; `node --check` the stripped copy first). ~54 KB types in ~2 min. **The `type` call returns a 30 s timeout error — ignore it; the keystrokes keep arriving.** Do NOT retype. Wait ~2 min, screenshot, confirm the last line number equals the stripped file's line count and the status bar shows 0 errors.
4. Right-click → **Format Document**; click **Deploy** (~(705,107)); wait ~10 s.
5. Verify: `fetch(hub+'/').then(r=>r.json()).then(j=>j.version)` from a hub tab's `javascript_tool`, then `/admin/run/<job>?key=…` and read `/status`. `javascript_tool` has a 45 s cap: the `hourly` job can exceed it — fire it in one call, read `/status` in the next.
6. Secrets: Claude generates the value, writes it to KEYS.md, opens Settings → Variables and Secrets → Add in the browser pane, fills the Key name and ticks Secret, then **Chad pastes the value** and clicks "Add 1 variable and deploy" (Claude does not type secrets into Cloudflare). Settings URL: `…/workers/services/view/mother-earth/production/settings`.
Bump `COLLECTOR_VERSION` on every deploy. Jobs: five, minute, firms, hourly (hourly = co2 + seaice-gated + D1 aggregation; admin runs pass `manual=true`).
D1 console: dashboard → D1 → mother-earth → Console; Chad or Claude runs `CREATE TABLE` statements there (schema.sql holds them).
Metrics: `…/workers/services/view/mother-earth/production/metrics` — read with `get_page_text`. Free plan: 10 ms CPU soft limit per invocation; measured medians ~1 ms; worst offenders were whole-file parses (fixed by `tail()`).

## 5. Browser pane facts
- Tab names change; call `tabs_context` first. Keep the globe in its own tab for Chad; do dashboard work in a second tab.
- `browser_batch` has ignored `tabId` once and acted on the wrong tab — use single `computer` calls with explicit `tabId` for anything that clicks.
- New sites need `request_access` (scope "site"). Granted so far: dash.cloudflare.com, github.io, noaadata.apps.nsidc.org, gibs.earthdata.nasa.gov (via page fetches), firms.
- The container shell cannot reach most data hosts (egress allowlist); fetch test data through the browser pane's `javascript_tool` on a same-origin or CORS-open page instead.
- Computer use is granted narrowly (TextEdit + clipboard write). Not needed for the editor flow above.

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
