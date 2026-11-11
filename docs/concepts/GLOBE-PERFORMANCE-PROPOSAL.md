# Globe performance — measurement proposal, rev 2.1

**For:** GPT's re-review, then Chad's approval lines in §8. **Docs only.**
**Rev 1:** 11 Nov 2026 (main `ae13189`). **Rev 2:** 11 Nov 2026 (main `0ab49fd`), after GPT's independent review of rev 1 (relayed by Chad; verdict: revise Stage 0 before asking for a measurement go). **Rev 2.1:** 11 Nov 2026, GPT's re-review of rev 2 (relayed by Chad): **proposal review cleared**; recommends Chad give Stage 0 its separate go; run-sheet details applied (table below).
**Builds on:**
- `reviews/2026-11-10-ocean-heat-rc.md` §10 (foreground timing run, 11 Nov 03:58–04:05 UTC; GPT's verdict on it);
- `reviews/2026-11-11-ocean-heat-release.md` §8 (regression-gate run, 11 Nov 09:45–09:47 UTC);
- `docs/concepts/OCEAN-HEAT-RELEASE-PROPOSAL.md` rev 2 §0 (D1: absolute targets kept for this work).

**Not approved:** any measurement run, spike, branch, build, deploy or page change. Each stage in §8 is its own line.
**Cost:** $0. No hub, R2, D1, cron or variable change in any stage of this proposal.

## Rev 2 changes (GPT's review of rev 1)

| # | GPT's point | Change | Where |
|---|---|---|---|
| G1 | Frame minus render time leaves an unattributed interval (other JS, browser work, scheduling, presentation wait) | Keep the `renderer.render` wrapper as CPU time inside the call only; add a short marked **Chrome Performance trace** of matched visible/hidden rotation windows; traced timings kept apart from the headline A/B; paused render + readback reported as a separate forced-completion measure; hiding rings tests their draw cost, not their animation | §3 instruments, S0.1, S0.4 |
| G2 | One A–B–A–B can't separate a smaller effect from drift; fixed-step rotation covers less globe when slow; 5 s at 150–200 ms gives only 25–33 frames | A–B–A–B **and** B–A–B–A in the same settled tab, pair repeated if close to the spread; **time-based sweep** over fixed camera poses; auto-rotate off; longer windows; rotation and readback in separate blocks; windows crossing a refresh or scene change flagged and rerun; caps-hidden and outlines-hidden each against the same all-visible baseline; decision rule from paired effects across both orders | §3 protocol, S0.2–S0.3, §3 decision |
| G3 | `render()` sits inside an IIFE; no console entry point | S0.5 uses a **default-on map layer's own toggle** (off → on), which calls `render()` with no fetch (`index.html`, toggle handler); a separate **setter-only** test through `ME.globe().polygonsData()` in a disposable tab, labelled as such; natural-refresh checkpoints around the real 5-min polls with per-layer cell keys and scene counts by type | S0.5, S0.6 |
| G4 | `ME.openCell` bypasses picking | Overlap baseline from **real canvas hover and clicks**, logging camera, coordinates, candidates, hover winner and inspector winner; more case types; repeated after a refresh/toggle | S0.7, §5 |
| G5 | Viewports differed between earlier packets; the later census doesn't show which objects grew | Record actual viewport and drawing-buffer size every block; census by type including polygon children | §3 instruments |
| G6 | GPT could not verify the commit from the Mac copy (no git metadata) | The message to GPT carries this file's sha256 for the Mac copy | message, not this file |

## Rev 2.1 changes (GPT's re-review of rev 2)

| # | GPT's point | Change | Where |
|---|---|---|---|
| R1 | Keep 10 s at 36°/s; start clock and pose fresh after each warm-up; set the camera directly each frame with zero transition; repeat full sweeps if p95 or the paired effect is unstable; fixed poses only as follow-up | Rotation protocol worded that way | §3 |
| R2 | Use **Forest disturbance** for S0.5a (default-on, cell-only, same render path, no fetch); Earthquakes also changes points and can restart rings | S0.5a uses Forest if it has visible cells after startup; Earthquakes is the fallback, with ring counts logged separately | S0.5a |
| R3 | Let each toggle state and each setter update apply before the next, so 20 calls are 20 rebuilds | Wait for the update to apply (next frames + census) between steps | S0.5a, S0.5b |
| R4 | Make the paused readback block explicit for the polygon comparisons too | Forced-completion block in S0.2 and S0.3 | S0.2, S0.3 |
| R5 | S0.7 needs tap-to-painted-inspector timings for coverage-cell clicks | Recorded, as §5's latency baseline | S0.7 |
| R6 | Effect within baseline spread after the repeat → inconclusive at this resolution | Added to the decision rule | §3 decision |

## 0. Why

The page misses the agreed targets with every optional layer off. That is the page's own cost, not any one layer's.

| Target (kept by D1) | Measured, 11 Nov, Chad's Chrome 156, Apple M3, DPR 2 |
|---|---|
| Rotation frame median ≤ 33 ms | 100–117 ms (03:58–04:05 UTC, 1200 × 655 CSS px); 150–167 ms (09:45 UTC) |
| Rotation frame p95 ≤ 50 ms | 133–267 ms; 183–266 ms |
| Tap → inspector ≤ 200 ms | 368.5 ms median, 677 ms max (layer off) |

The two runs did not record the same viewport, so they are not directly comparable (G5). Chrome delivered 16.7 ms callbacks with the globe paused both times: the browser could run at 60 Hz when the globe wasn't drawing.

## 1. What is measured so far (and how firm it is)

| Finding | Source | Firmness |
|---|---|---|
| Scene held 2,379 objects (~362,000 vertices) at 04:00 UTC; **1,564 are the coverage-cell polygons** (782 cells × cap mesh + outline) | rc §10 | One census |
| One synchronous render: **31 ms → 3.5 ms with the coverage polygons hidden**; hiding any other object type left it at ~33 ms | rc §10 | **One sample.** Enough to prioritise the test (GPT), not a result |
| Pixel ratio 1 instead of 2: 32.9 ms (no change) → cost looks per object, not per pixel | rc §10 | One sample |
| Sync render varied 31–122 ms in the same session; frames slowed ~100 → 183 ms over it, layer on and off alike | rc §10 | Observed, unexplained |
| By 09:46 UTC the scene held **3,289 objects** (+910) and frames were 150–200 ms | release §8 | One census, not by type. Which objects grew is unknown |
| Points are already merged (`pointsMerge(true)`); polygons are not | `index.html` globe setup | Code |
| `render()` builds a new array of new polygon objects on every call (refresh ticks, toggles) and hands it to `polygonsData()` | `index.html` `render()` | Code. What globe.gl does with the old objects is unmeasured |

**Not assumed:** that merging is the fix, or why the scene grew. More cells, layers left on, and objects not released are each possible and need different fixes.

## 2. Questions

- **Q1 — Where does a frame go?** CPU time inside `renderer.render`, other main-thread work (controls, raycasting, refresh callbacks, garbage collection, globe.gl's tick), and the rest.
- **Q2 — How much do the coverage polygons cost in rotation frames,** caps and outlines separately, as a paired effect larger than the spread of repeated baselines?
- **Q3 — Does the scene grow without its inputs growing?** And if it grows, which object types?
- **Q4 — Does batching deliver the saving?** A Stage 1 measurement only (GPT).
- **Q5 — What does real hover and click pick where cells overlap,** and at edges, the dateline, over points and on open globe?
- **Q6 — Phones.** Out of scope until the desktop picture is understood (§6).

## 3. Stage 0 — measure only (no code change anywhere)

**Where:** Chad's Chrome, through Claude in Chrome. **Chad at the screen:** the Chrome window in front and focused for the active blocks (about 30 min), then a separate **30-min foreground dwell** (S0.6) where the window stays in front and he can step away. Active screen time and dwell time are reported separately.

**Page under test:** the live public page at main, served-hash check of the ten page files first (commit recorded). Fresh tab, no injection: the page as people get it. Optional layers off. Let startup settle (all four default map layers loaded, no fetch in flight) before any block.

**Instruments (read-only from the console via `javascript_tool`; every wrap restored and the restore confirmed):**
- **Environment, every block:** `innerWidth × innerHeight`, DPR, drawing-buffer size (`gl.drawingBufferWidth/Height`), GPU string, `visibilityState`, `hasFocus`.
- **Frames:** `requestAnimationFrame` deltas. Report n, median, p95, max per window.
- **Render CPU time:** wrap `globe.renderer().render` to record each call's `performance.now()` start and duration and the call count per frame. This is CPU wall time inside the call (including any driver stall met there), nothing else.
- **Draw work:** `renderer.info.render.calls` and `.triangles` per frame.
- **Trace (G1):** one short Chrome Performance trace (Chad starts and stops it in DevTools; Claude marks windows with `performance.mark`) covering one matched visible/hidden rotation pair. Used to name main-thread work, not for the headline numbers.
- **Forced completion:** separate block, globe paused: 60 × `renderer.render` + 1-pixel `readPixels`. Reported apart from rotation.
- **Census:** traverse `globe.scene()`, counts by `type` and globe.gl's `__globeObjType`, including the children of each polygon object; `globe.polygonsData().length` per layer; `renderer.info.memory.geometries` and `.textures` as supporting evidence.
- **Hiding:** `.visible = false` on the objects of one kind, then back; nothing removed or disposed.

**Rotation protocol (G2):**
- Auto-rotate off. Same start pose (`lat −10, lng 25, altitude 2.2`), same warm-up (2 s) per condition; the measured clock and the camera pose start fresh after each warm-up.
- **Time-based sweep:** camera longitude = start + 36°/s × elapsed, set directly each frame with `pointOfView(…, 0)` (zero transition), at fixed latitude and altitude. Window **10 s** = one full turn, the same intended path every time; a slower window samples fewer poses (~50–100 frames at today's speeds). If p95 or the paired effect is unstable, repeat full sweeps at the same speed. Matched fixed poses only as a follow-up if one view seems to drive a difference.
- Each comparison runs **A–B–A–B then B–A–B–A** in the same settled tab. If the paired effect is within the spread of the four visible baselines, run the pair again once.
- A window that crosses a 5-min refresh or any scene-count change is flagged and rerun.

**Blocks:**

| # | What | Answers |
|---|---|---|
| S0.1 | Census; 3 visible rotation windows with frames, render CPU, draw calls; forced-completion block | Q1 baseline |
| S0.2 | All coverage-polygon objects visible vs hidden, both orders; then a separate paused forced-completion block, visible vs hidden | Q2 |
| S0.3 | Caps hidden vs all visible; outlines hidden vs all visible (each against the same visible baseline), both orders; then the paused forced-completion block for the same conditions | Q2 (which half) |
| S0.4 | Rings hidden vs visible, both orders. Tests the rings' draw cost only; their animation keeps running (G1) | Q1 control |
| S0.T | One Chrome Performance trace of a matched visible/hidden pair (Chad starts/stops) | Q1 |
| S0.5a | **Rebuild through the page's own path:** after settle, toggle **Forest disturbance** off → on (default-on, cell-only; the toggle calls `render()` and fetches nothing), if it has visible cells after startup; otherwise Earthquakes, with ring counts logged separately. Let each off and on state apply (next frames + census) before the next toggle. Compare settled on-state census at cycles 0, 1, 5 and 20; confirm snapshot IDs and cell keys unchanged throughout | Q3 |
| S0.5b | **Setter-only, disposable tab:** pass fresh equivalent polygon objects to `ME.globe().polygonsData()` 20 times, letting each update apply before the next so the 20 calls are 20 rebuilds; census before/after. Labelled setter-only | Q3 |
| S0.6 | **Natural refresh, 30-min foreground dwell:** checkpoints just before and after each 5-min poll — enabled layers, snapshot IDs, per-layer cell counts and keys, census by type. Then repeat S0.1 | Q3, drift |
| S0.7 | **Real picking (G4):** real canvas hover then click at listed coordinates: overlap interiors, shared cell edges, a dateline or polar case where data allows, a point over a cell, open globe. Log camera pose, screen and lat/lng, candidate layer/cell IDs, hover winner, inspector winner. Record **tap-to-painted-inspector time** for representative coverage-cell clicks (the §5 latency baseline). Repeat representative cases after a refresh and after the S0.5a toggle | Q5 |

**Reading the results:**
- If geometry counters rise while the scene count is stable, that warrants a retention check before anyone calls it a leak.
- If polygon counts stay flat but the scene grows, name the growing object types before choosing C2.

**Stop rules:** served hashes ≠ main → stop. Window loses focus mid-block → rerun the block. Any restore check fails → reload, record it, rerun.

**Decision (what Stage 0 says about Stage 1):** from the paired effects across both orders against the spread of the repeated visible baselines.
- A **material, repeatable** gain in rotation frames from hiding the polygons justifies a C1 spike, even if they are less than half the frame (GPT).
- A forced-completion gain **alone** leaves the rotation bottleneck open and does not by itself justify C1.
- Growth without input growth (S0.5/S0.6) points to C2.
- Neither → report, and the next target comes from the trace.
- An effect still within the visible-baseline spread after the repeat is reported as **inconclusive at this resolution**, not as "no effect".

**Record:** `reviews/2026-11-1x-globe-perf-stage0.md` (real-clock times, environment per block, raw numbers, the script text used), evidence JSON in `reviews/evidence/`.

## 4. Stage 1 — throwaway spike (only on a separate go, only on candidates Stage 0 supports)

**Not a build.** A diagnostic script from the console in a test tab of the live page. Nothing goes to the page or main; the script is committed only as evidence.

- **C1 — Merge.** Hide globe.gl's polygon objects; add one mesh for all caps (vertex colours, same geometry and altitude as `cellGeom` + `polygonAltitude(.006)`) and one line object for all outlines. Constructors taken from objects already in the scene (START-HERE §4m; `oceanheat.js` does the same). If a line constructor can't be had that way, that is a finding for a build proposal, not something to work around.
- **C2 — Stable data.** If Stage 0 shows growth without input growth: re-measure with polygon objects reused for unchanged cells (keyed by layer + cell id).
- **C3 — Transition off.** `polygonsTransitionDuration(0)` in the test tab, if the trace shows transition work after a refresh.

**Measures:** the Stage 0 protocol (both orders, time-based sweep) against the unmodified tab state; matched screenshots (same pose) of spike vs original, checking alpha blending, depth and draw order where translucent cells overlap, and outlines at the limb and the dateline. **Pass for a candidate:** a rotation-frame gain clearly beyond the baseline spread, in both orders, on repeat.

**Record:** `reviews/2026-11-1x-globe-perf-stage1.md`.

## 5. What any later build must keep (for a build proposal; not decided here)

- **Picking:** reproduce the hover and click behaviour Stage 0 S0.7 observed, or an explicit rule Chad approves. A coordinate lookup (`globe.toGlobeCoords` → `ME.cellId`) is one route, not a given.
- **Routing:** points still open their record; open globe still opens the place view; Ocean Heat still receives the tap's own lat/lng (`ohTap`).
- **Tap → inspector latency** no worse than the Stage 0 baseline.
- **Hover label** content as today (`polygonLabel`).
- **Look:** grade colours (`FILL`/`STROKE` for adequate / partial / unknown; forest's log fill; plastic's faint outline), freshness forcing `unknown`, alpha blending and draw order where cells overlap, outlines at the limb and dateline — checked by matched screenshots.
- **Test aids** `ME.openCell`, `ME.cellPolys`, `ME.renderState` give the same outputs.
- **The pairing invariant** (`usable()`) is about records, not cells, and is not touched.
- **Suites:** desktop-overflow, mobile-pass, place-ui, timeline-ui, orbital-browser, buoy-temp-ui, oceanheat-ui, sky-zoom-ui green; the Sky zoom-out view saves and restores what it touches, so it must be re-run.

## 6. Out of scope

- Physical phone and Safari (open item; once the desktop picture is understood — Chad's iPhone, his go).
- Points, rings, orbital and Ocean Heat objects except as controls (S0.4).
- Any change to what the page shows or says.
- The absolute targets as a merge gate for other work (D1 keeps the regression gate).

## 7. Risks

- **Driving through the extension** may add overhead (rc §10 limit). The same harness for A and B keeps comparisons fair; absolute numbers carry that caveat.
- **Drift within a session** (rc §10, release §8). Hence both orders, repeats, settle rules and refresh flags.
- **Hiding is not removing:** hidden objects can still cost in traversal and picking. Only the C1 spike tests batching.
- **One machine** (M3); nothing here speaks for slower GPUs.
- **The trace itself has overhead**, which is why its timings stay out of the headline A/B.

## 8. Approval lines (Chad)

Neither is production; "go" is enough for each, but each is separate.
1. `Go: globe performance Stage 0 (measure only, Chad's Chrome, live page, no code change)` — needs Chad at the screen (§3).
2. `Go: globe performance Stage 1 spike (<candidates from Stage 0>; test tab only, nothing pushed to the page)` — only after Stage 0's record and GPT's read of it.

## 9. GPT

Rev 2 re-review (relayed by Chad, 11 Nov): §3 covers G1–G5; the proposal review is cleared; recommends Stage 0's separate go. Rev 2.1 applies the run-sheet details (R1–R6). Stage 0 and Stage 1 each still need Chad's own line.
