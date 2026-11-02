# Mother Earth — handover (2 Nov 2026; §3 updated end of thread 7 — see STATUS "Thread 7" first)

Read `START-HERE.md` (§2 constitution · §5a testing · §5b ships duration contract), then this file, then `STATUS.md` (newest sections first). Not a fresh sandbox: nothing below needs re-investigating.

---

## 0. State in one paragraph

**Nothing public changed in thread 6.** Page, hub (collector `0.2.1`) and Mac collector (`mac-0.3.2`) are exactly as at the start of the day; page assets still `?v=202611021500`. Thread 6 closed the terminator deployment check, did two desk checks (FIRMS observability docs, NOAA's raw CO₂ file), and ran the satellite work to an approved direction and a private benchmark. Satellites are **not live**: the gate is the reuse basis.

## 0a. Access the next thread has (all verified in thread 6)

- **GitHub:** push straight to `main` of `TheOneTheOnlyTheChad/mother-earth` (attach with `add_repo`, access "push", then shallow-clone to `/home/claude/mother-earth`). `gh` works from the container.
- **Chad's Mac:** remote-device tools. `~/Documents/Mother Earth/` granted by one folder-access prompt per thread; read/write via `device_bash` (mounted at `$HOME/mnt/Mother Earth`), `device_stage_files` (Mac → container) and `device_commit_files` (container → Mac; see the sync gotcha below). The runtime folder `~/mother-earth/` is reachable the same way. `rm` is blocked unless Chad grants delete permission.
- **Built-in browser pane (Claude app):** works when the Claude app is open and the pane is displayed (Cmd+Shift+B). Signed in to Cloudflare (dashboard, Worker editor, D1 console, Metrics) and claude.ai. Reaches the hub, the live site, CelesTrak, Space-Track, TraCSS (sites approved this thread: celestrak.org, space-track.org, api.tracss.gov, claude.ai, api.ipify.org, plus earlier ones). Timing measurements are only valid while the pane is displayed.
- **claude.ai artifacts:** private pages with their own data store (ArtifactData). The private "Satellite Population Bench" lives there.
- **Project docs:** `Projects.project_write` to `claude/<name>.md` (STATUS, HANDOVER, START-HERE).
- **Not reachable from these sessions:** Claude in Chrome (extension not connected); the container's and the Mac VM's shells cannot reach celestrak.org or the hub (allowlists). Only Chad's own Terminal writes a fetched file to disk byte-exact.
- **Chad does himself:** pastes every secret; any account creation (e.g. Space-Track); Worker settings changes (e.g. Observability "Include Invocation logs"); runs in his own Chrome.

## 1. Where things are

| | |
|---|---|
| Repo | `github.com/TheOneTheOnlyTheChad/mother-earth`, `main`. Commit straight to main. `bench-private/` is gitignored. |
| Hub | `https://mother-earth.chadoberholzer.workers.dev`, collector `0.2.1`, crons `:07` · `*/5` · `*/15` · `11,41` |
| Page | `https://theonetheonlythechad.github.io/mother-earth/`, assets `?v=202611021500` (bump in both html files on any change) |
| Mac | `~/Documents/Mother Earth/` (synced copy, not a git repo) + runtime `~/mother-earth/` for the collector |
| **Satellite working set (private)** | `~/Documents/Mother Earth/bench-private/` — `README.md` indexes it. Frozen inputs + `hub-manifest.json` / `celestrak-manifest.json`, `results/`, `code/` (bench source 1.6, `build.py`, `score.py`, runners, `freeze.mjs` + tests). |
| **Private bench page** | claude.ai artifact "Satellite Population Bench" (platform-stated: readable by only Chad). Holds the same 10 frozen input files. Results save to its private store, collections `runs/` and `memory/`; read them with ArtifactData. Freezer artifact "Satellite Bench Freezer" exists, asset store empty, unused. |
| Docs | `STATUS.md`, `START-HERE.md`, `HANDOVER.md`, `REGISTER.md` — repo, Mac, and `Projects.project_write` to `claude/<name>.md` |

**Sync gotcha seen this thread (twice):** `device_commit_files` reported "written" while the Mac received an OLD copy. It appears to cache by staged filename: re-using a `stagedPath` that was committed before delivered the earlier content. Always stage under a fresh, unique name (e.g. `STATUS-<commit>.md`), commit to a temporary name, `mv` on the Mac, then compare `shasum` with the repo.

**Reaching things:** the container and the Mac's `device_bash` cannot reach celestrak.org or the hub. The browser pane can (cross-origin reads are allowed by both). Only Chad's Terminal can write a fetched file to disk byte-exact. Claude in Chrome was **not reachable** from this session.

## 2. Satellites — where it stands

**Approved direction (Chad + GPT):** the full CelesTrak *active* catalogue as a population/distribution view. Keep all objects; only propagation failures omitted, and counted. One toggle, off on load, no card, no trails. Always visible while on: "Markers enlarged for visibility; not to physical scale." Positions at propagated altitude; height above the surface kept distinct from distance from the centre. The geostationary camera view must never be described as showing every orbit. Not a measure of obscuration, ground coverage or collision risk.

**Frozen inputs (hash-checked by every bench run):**
- CelesTrak `GROUP=active&FORMAT=csv`, fetched 2026-11-02 14:26:53 UTC by Chad's Terminal, 16,847 rows, sha256 `2c5c78ab…`. Structure ok, 0 value problems, 0 duplicate IDs, **completeness not established**. Includes 4 rocket bodies CelesTrak lists as active (documented in the scope line).
- Hub snapshots frozen 13:31:09 UTC, each records/cells pair matched on `retrieved_at` first attempt.

**Format:** OMM-keyword CSV/JSON, never TLE (TLE silently drops catalogue numbers > 99999: 949 in the active set).

**Results:** see STATUS "Satellite benchmark 2 Nov" and "Satellite work 2 Nov (later)". In short:
- **Mac pane and ordinary Mac Chrome agree:** the satellites add ~0 to median frame time. Today's layers already hold the Mac at ~30 fps. Satellites alone run at 60 fps. 0 long tasks in Chrome.
- **Memory:** a per-toggle GPU geometry leak was found, and fixed by creating the layer once and toggling visibility (bench 1.6). Retained-heap plateau is not yet proven.
- **Software rendering:** reported only, never scored.

**Recommended implementation (not built):**
- **Browser:** worker propagation every 2 s with satellite.js 6.0.2 pinned. One batched particle layer, created once, visibility-toggled, positions written in place. globe.gl pinned 2.45.0, with the same refuse-if-missing pattern as day/night. Teardown disposes after removal.
- **Hub:** stamp-gated single-attempt fetch, at most every 2 h, file stored unparsed (REGISTER has the bounded failure handling). Viewers never touch CelesTrak.
- **Scope lines:** counts drawn / not drawn, the stale-element line ("124 objects use element sets older than 3 days; their propagated positions may be unreliable"), and "N objects lie beyond the geostationary view".

## 3. Open — each with its decisive next step

| # | Item | Next step | Blocks satellites going public? |
|---|---|---|---|
| 1 | **Satellite reuse basis — now a decision, not a research gap (thread 7)** | Evidence read and filed (REGISTER CelesTrak row; STATUS thread 7). No published requirement for individual permission found; the constitution requires the commercial standing *recorded*, not a grant. Chad decides the basis. Recommendation: benchmarked CelesTrak active set fetched by the Worker under CelesTrak's rules, credit + origin citation; Space-Track (Chad's account, created 2 Nov) is the documented alternative. An email to CelesTrak is optional, not required. | **Yes — Chad's decision** |
| 2 | ~~Memory plateau~~ **DONE 2 Nov (thread 7)** | Tracker hypothesis refuted; the same growth appears with satellites never shown (control), so there is no satellite-attributable retained growth. Whole-page growth (about +0.5 MB/min in the software renderer) belongs to the existing layers and is folded into item 4. | No (satellites) |
| 3 | ~~Phase-7 visible object~~ **DONE 2 Nov (thread 7)** | Stale-reference state observed in kind after the phase-6 re-digest (`?refind` run) and cleared by re-finding; only the re-digest path can cause it. Production path (create once, in-place, visibility) shown clean: 0 visible after every one of 180 toggles. | — |
| 4 | Existing page at ~30 fps on the Mac pane | Separate investigation of today's layers (polygons, merged points, rings), now including their slow retained-heap growth (thread 7). Not a satellite issue. | No |
| 5 | FIRMS CPU attribution | Docs say CPU/wall time are in the **invocation log** (one event per invocation, ~2.4 % of the Free 200K/day at 100 %). Chad turns on Worker → Settings → Observability → "Include Invocation logs" (Traces off), then read CPU for the `*/15` runs. | No |
| 6 | CO₂ truncated-200 guard | Response carries Content-Length; file header carries "File Creation". A guard can check both. Not built. (30 Oct is omitted at source; the source omits 109 of 366 days — earlier "contiguous" note withdrawn.) | No |
| 7 | Physical long-sleep test (Mac) | Unchanged: a suspend that lasts past the hard deadline; no power-setting changes. Note: Chad ran `caffeinate` during the thread-6 benchmark. | No |
| 8 | Galaxy / Android | Unchanged: physical test pending; all phone checks emulated. Satellites unverified on mobile. | No (desktop decision) |
| 9 | Submarine cables | Licence question kept for its turn; the shorthand share-alike explanation is not a settled assessment. | — |

## 4. Rules that came out of thread 6

- **CelesTrak:** never fetch the active set from the pane or anywhere else without a reason that justifies it. CelesTrak counted the pane and Chad's Terminal as one requester (403: "GP data has not updated since your last successful download of GROUP=active at …"). The stamp is on `https://celestrak.org/NORAD/elements/` ("Current as of … UTC"). A stamp check is a request strategy, not a guarantee.
- **Benchmarks:** criteria are written before any real run; a hidden pane throttles rAF to ~1 Hz (bench 1.2+ records visibility and `score.py` refuses hidden runs); software rendering is its own environment, never scored, never a stand-in for phones; consistency between element sets is not accuracy.
- **Clipboard:** the app flags page-initiated clipboard writes; that route was abandoned rather than worked around.
- **Report unavailable measurements as unavailable.** Keep cold-start and steady-state costs separate, both reported.

## 5. Standing rules (unchanged)

The promise verbatim; the constitution (START-HERE §2); observations, models and computed context stay distinguishable; no inferred causes, no invented zeros; coverage never inferred from collector uptime; every source's commercial standing in REGISTER before it goes live; $0/month with named triggers; measure, don't assume; bound every test; baby steps; Chad pastes secrets himself.
