# Mother Earth — handover to thread 7 (2 Nov 2026, end of thread 6)

Read `START-HERE.md` (§2 constitution · §5a testing · §5b ships duration contract), then this file, then `STATUS.md` (newest sections first). Not a fresh sandbox: nothing below needs re-investigating.

---

## 0. State in one paragraph

**Nothing public changed in thread 6.** Page, hub (collector `0.2.1`) and Mac collector (`mac-0.3.2`) are exactly as at the start of the day; page assets still `?v=202611021500`. Thread 6 closed the terminator deployment check, did two desk checks (FIRMS observability docs, NOAA's raw CO₂ file), and ran the satellite work to an approved direction and a private benchmark. Satellites are **not live**: the gate is the reuse basis.

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

**Sync gotcha seen this thread:** `device_commit_files` once reported "written" for an existing path while the Mac kept the old file. Overwrite via a new name + `mv` on the Mac, or verify with `shasum` after every overwrite.

**Reaching things:** the container and the Mac's `device_bash` cannot reach celestrak.org or the hub. The browser pane can (cross-origin reads are allowed by both). Only Chad's Terminal can write a fetched file to disk byte-exact. Claude in Chrome was **not reachable** from this session.

## 2. Satellites — where it stands

**Approved direction (Chad + GPT):** the full CelesTrak *active* catalogue as a population/distribution view. Keep all objects; only propagation failures omitted, and counted. One toggle, off on load, no card, no trails. Always visible while on: "Markers enlarged for visibility; not to physical scale." Positions at propagated altitude; height above the surface kept distinct from distance from the centre. The geostationary camera view must never be described as showing every orbit. Not a measure of obscuration, ground coverage or collision risk.

**Frozen inputs (hash-checked by every bench run):**
- CelesTrak `GROUP=active&FORMAT=csv`, fetched 2026-11-02 14:26:53 UTC by Chad's Terminal, 16,847 rows, sha256 `2c5c78ab…`. Structure ok, 0 value problems, 0 duplicate IDs, **completeness not established**. Includes 4 rocket bodies CelesTrak lists as active (documented in the scope line).
- Hub snapshots frozen 13:31:09 UTC, each records/cells pair matched on `retrieved_at` first attempt.

**Format:** OMM-keyword CSV/JSON, never TLE (TLE silently drops catalogue numbers > 99999: 949 in the active set).

**Results:** see STATUS "Satellite benchmark 2 Nov" and "Satellite work 2 Nov (later)". In short:
- **Mac pane:** the satellites add ~0 to median frame time. Today's layers already hold the pane at ~30 fps. Satellites alone run at 60 fps.
- **Memory:** a per-toggle GPU geometry leak was found, and fixed by creating the layer once and toggling visibility (bench 1.6). Retained-heap plateau is not yet proven.
- **Software rendering:** reported only, never scored.

**Recommended implementation (not built):**
- **Browser:** worker propagation every 2 s with satellite.js 6.0.2 pinned. One batched particle layer, created once, visibility-toggled, positions written in place. globe.gl pinned 2.45.0, with the same refuse-if-missing pattern as day/night. Teardown disposes after removal.
- **Hub:** stamp-gated single-attempt fetch, at most every 2 h, file stored unparsed (REGISTER has the bounded failure handling). Viewers never touch CelesTrak.
- **Scope lines:** counts drawn / not drawn, the stale-element line ("124 objects use element sets older than 3 days; their propagated positions may be unreliable"), and "N objects lie beyond the geostationary view".

## 3. Open — each with its decisive next step

| # | Item | Next step | Blocks satellites going public? |
|---|---|---|---|
| 1 | **Satellite reuse basis** | Three questions in REGISTER (CelesTrak row): does Space-Track's blanket approval reach data taken via CelesTrak; what "appropriate citation" wording satisfies it; commercial use. Clean route on the evidence: Chad's own Space-Track account (he creates it — Claude never creates accounts) + citation. Alternative: written confirmation from CelesTrak. TraCSS CC0 endpoint answers 200 "OK" with no records — recheck occasionally. | **Yes** |
| 2 | **Memory plateau** | Rerun bench 1.6 memory mode in the container with forced GC and the orphan tracker OFF (it keeps a record of every ring geometry and is the likely source of the residual +~1.1 MB / 30 toggles). Plateau = flat retained heap across batches. | Yes, before release |
| 3 | **Ordinary Mac Chrome run** | Chad opens the private bench in Chrome, labels "Mac Chrome", runs **Run benchmark** then **Memory test**; read `runs/` + `memory/`; score with `score.py`, label separately from the pane run. | Desktop decision |
| 4 | Existing page at ~30 fps on the Mac pane | Separate investigation of today's layers (polygons, merged points, rings). Not a satellite issue. | No |
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
