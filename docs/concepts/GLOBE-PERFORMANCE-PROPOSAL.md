# Globe performance — measurement proposal, rev 1

**For:** GPT's review, then Chad's approval lines in §8. **Docs only.**
**Written:** 11 Nov 2026 (10:25 UTC clock reading at start of writing).
**Builds on:**
- `reviews/2026-11-10-ocean-heat-rc.md` §10 (foreground timing run, 11 Nov 03:58–04:05 UTC; GPT's verdict on it);
- `reviews/2026-11-11-ocean-heat-release.md` §8 (regression-gate run, 11 Nov 09:45–09:47 UTC);
- `docs/concepts/OCEAN-HEAT-RELEASE-PROPOSAL.md` rev 2 §0 (D1: absolute targets kept for this work).

**Not approved:** any measurement run, spike, branch, build, deploy or page change. Each stage in §8 is its own line.
**Cost:** $0. No hub, R2, D1, cron or variable change in any stage of this proposal.

## 0. Why

The page misses the agreed targets with every optional layer off. That is the page's own cost, not any one layer's.

| Target (kept by D1) | Measured, 11 Nov, Chad's Chrome 156, Apple M3, 1200 × 655 CSS px, DPR 2 |
|---|---|
| Rotation frame median ≤ 33 ms | 100–117 ms (03:58–04:05 UTC); 150–167 ms (09:45 UTC) |
| Rotation frame p95 ≤ 50 ms | 133–267 ms; 183–266 ms |
| Tap → inspector ≤ 200 ms | 368.5 ms median, 677 ms max (layer off) |

Chrome's own frame interval with the globe paused was 16.7 ms both times, so the browser was not throttled.

## 1. What is measured so far (and how firm it is)

| Finding | Source | Firmness |
|---|---|---|
| Scene held 2,379 objects (~362,000 vertices) at 04:00 UTC; **1,564 are the coverage-cell polygons** (782 cells × cap mesh + outline) | rc §10 | One census |
| One synchronous render: **31 ms → 3.5 ms with the coverage polygons hidden**; hiding any other object type left it at ~33 ms | rc §10 | **One sample.** The lead, not a result |
| Pixel ratio 1 instead of 2: 32.9 ms (no change) → cost is per object, not per pixel | rc §10 | One sample |
| Sync render varied 31–122 ms in the same session; frames slowed ~100 → 183 ms over it, layer on and off alike | rc §10 | Observed, unexplained |
| By 09:46 UTC the scene held **3,289 objects** (+910 since 04:00) and frames were 150–200 ms | release §8 | One census. Cause unknown |
| Points are already merged (`pointsMerge(true)`); polygons are not | `index.html` globe setup | Code |
| `render()` builds a new array of new polygon objects on every call (each refresh tick per layer, each toggle) and hands it to `polygonsData()` | `index.html` `render()` | Code. What globe.gl does with the old objects is not yet measured |

Two things here are **not** established and this proposal does not assume them:
1. That merging the polygons into one mesh is the fix. The 31 → 3.5 ms figure is one sample of a render that ranged 31–122 ms.
2. Why the scene grew by ~900 objects in six hours. It could be more cells (fires, forest and ships change through the day), optional layers left on, or objects not released when `render()` replaces the data. Each needs a different fix.

## 2. Questions the measurement must answer

- **Q1 — Where does a frame go?** Of a 100–200 ms rotation frame: the WebGL render, JavaScript before it (globe.gl's tick, ring animation, controls), and anything else. The sync render (31–122 ms) is less than the frame, so something else is in the frame too.
- **Q2 — How much is the coverage polygons?** Repeated, ordered A/B on rotation frames *and* sync renders, caps and outlines separately.
- **Q3 — Does the scene grow without the data growing?** Object count against polygon count over time and over repeated refreshes and toggles.
- **Q4 — Does a merged mesh deliver the saving?** Measured on a throwaway diagnostic in a test tab, before anyone designs a build.
- **Q5 — What does a click do today where cells of several layers overlap?** Which layer's cell opens. Any later build must keep it or replace it with a rule Chad chooses.
- **Q6 — What does a phone see?** Out of scope until Stage 0 says the desktop picture is understood; listed in §6.

## 3. Stage 0 — measure only (no code change anywhere)

**Where:** Chad's Chrome, through Claude in Chrome. **Chad at the screen:** the Chrome window in front and focused for the whole run (about 20 minutes). Same conditions as rc §10 (`visibilityState` visible, `hasFocus` true; report viewport, DPR, GPU string).

**Page under test:** the live public page at main as served (served-hash check of the ten page files first; record the commit). A fresh tab. No injection — this is the page as people get it. Optional layers in their default (off) state unless a step says otherwise.

**Instruments (all read-only, from the console via `javascript_tool`):**
- **Frame intervals:** `requestAnimationFrame` deltas during a 5 s scripted rotation (one `pointOfView` step per frame, as in rc §10). Report median, p95, max, n.
- **Phase split (Q1):** wrap `globe.renderer().render` for the run to time each call with `performance.now()`; frame time minus render time = everything else. Restore the original function after the run and confirm it is restored. Read `renderer.info.render.calls` and `.triangles` per frame.
- **Sync render:** 60 × `renderer.render(scene, camera)` + 1-pixel `readPixels`, globe paused (as release §8). Median and p95.
- **Census:** traverse `globe.scene()`: count by `type` and by globe.gl's `__globeObjType`; `globe.polygonsData().length`; `renderer.info.memory.geometries`.
- **Hiding:** set `.visible = false` on the scene objects of one kind, measure, set it back, confirm restored. Nothing is removed or disposed.

**Runs (order fixed in advance to handle drift; each A/B block is A–B–A–B):**

| # | What | Measures | Answers |
|---|---|---|---|
| S0.1 | Census at load, then frame + phase split, 3 × 5 s | frames, render share, draw calls, triangles | Q1 |
| S0.2 | Polygons visible vs **all** polygon objects hidden, A–B–A–B | frames, sync renders, draw calls | Q2 |
| S0.3 | Caps hidden only vs outlines hidden only, A–B–A–B | same | Q2 (which half) |
| S0.4 | Rings (quake animation) hidden vs visible, A–B–A–B | frames | Q1 (control: is it only polygons?) |
| S0.5 | Call `render()` 20 times via a no-change path (toggle an optional layer off→on is **not** used; call the page's own `render` through the console if reachable, else record "not reachable" and skip) then census | object count before/after; `polygonsData().length` before/after | Q3 |
| S0.6 | Leave the tab open in front for 30 min (Chad may step away; window stays in front), census + S0.1 again | object count vs data count over time; frame drift | Q3 |
| S0.7 | 12 clicks on cells where two or more layers overlap (picked from `polygonsData()` beforehand, listed in the record), read which layer's cell the inspector opens | layer opened per click | Q5 |

**Stop rules:** stop and report if the served hashes don't match main; if the window loses focus mid-block (rerun the block); if any restore check fails (reload the tab, record it).
**Record:** `reviews/2026-11-1x-globe-perf-stage0.md` (real-clock times, environment, raw numbers, the script text used). Evidence JSON beside it in `reviews/evidence/`.

**What Stage 0 decides:** whether Stage 1 is worth running, and on which candidate. If S0.2 shows the polygons are not most of the frame across repeats, Stage 1 changes target or stops.

## 4. Stage 1 — throwaway spike (only on a separate go, only if Stage 0 points there)

**Not a build.** A diagnostic script run from the console in a test tab of the live page; nothing committed to the page, nothing pushed to main. The script is committed only as evidence under `reviews/evidence/`.

**Candidates (run only those Stage 0 supports):**
- **C1 — Merge.** Hide globe.gl's polygon objects; add one mesh for all caps (vertex colours, same geometry and altitude as `cellGeom` + `polygonAltitude(.006)`) and one line object for all outlines. Constructors are taken from objects already in the scene (START-HERE §4m: the page has no three.js constructors of its own; `oceanheat.js` already does this). If the line constructor can't be obtained this way, report it — that is a finding for the build proposal, not something to work around in the spike.
- **C2 — Stable data.** If S0.5/S0.6 show growth without data growth: re-measure with `render()` reusing the same polygon objects for unchanged cells (keyed by layer + cell id), to see whether the growth stops.
- **C3 — Transition off.** `polygonsTransitionDuration(0)` on the test tab only, if S0.1 shows time inside polygon transitions after a refresh.

**Measures:** the S0.1 and S0.2 instruments, A–B–A–B against the unmodified tab state, plus a screenshot pair (spike vs original, same camera) for Chad to judge the look. **Pass for a candidate:** median and p95 frames move clearly beyond the A–B–A–B spread, on repeat.

**Record:** `reviews/2026-11-1x-globe-perf-stage1.md`.

## 5. What any later build must keep (for the build proposal, not decided here)

A merged mesh loses what globe.gl gives each polygon for free. A build proposal would have to show each of these still works, with tests:
- **Hover label** (`polygonLabel`) — would come from `globe.toGlobeCoords(x, y)` → `ME.cellId` → cell lookup.
- **Click → inspector** (`onPolygonClick` → `inspectCell`), including the `ohTap` lat/lng Ocean Heat uses, and the overlap rule from S0.7.
- **Grade colours** (`FILL`/`STROKE` by adequate / partial / unknown; forest's log fill; plastic's faint outline) and freshness forcing `unknown`.
- **Test aids** `ME.openCell`, `ME.cellPolys`, `ME.renderState` (same outputs).
- **The pairing invariant** (`usable()`) is about records, not cells, and must not be touched.
- Regression suites (desktop-overflow, mobile-pass, place-ui, timeline-ui, orbital-browser, buoy-temp-ui, oceanheat-ui, sky-zoom-ui) green; the Sky zoom-out view saves and restores what it touches, so it must be re-run.

## 6. Out of scope

- Physical phone and Safari (open item; worth doing once the desktop picture is understood — Chad's iPhone, his go).
- Points, rings, orbital and Ocean Heat objects, except as controls in S0.4.
- Any change to what the page shows or says.
- Absolute targets as a merge gate for other work (D1 keeps the regression gate).

## 7. Risks

- **Driving through the extension** may add overhead (rc §10 limit). Same harness for A and B keeps the comparison fair; absolute numbers carry that caveat.
- **Drift during a session** (rc §10, release §8) can swamp an A/B. Hence A–B–A–B and S0.6.
- **Hiding is not removing.** Hidden objects still cost in traversal; the spike (C1) is the only real test of a merge.
- **One machine** (M3). Results say nothing about slower GPUs until measured there.

## 8. Approval lines (Chad)

Neither is production; "go" is enough for each, but each is separate.
1. `Go: globe performance Stage 0 (measure only, Chad's Chrome, live page, no code change)` — needs Chad at the screen.
2. `Go: globe performance Stage 1 spike (<candidates from Stage 0>; test tab only, nothing pushed to the page)` — only after Stage 0's record and GPT's read of it.

## 9. For GPT

1. Is the Stage 0 run list enough to answer Q1–Q3 and Q5, and is the A–B–A–B order sufficient against the drift seen on 11 Nov?
2. Is wrapping `renderer.render` an acceptable way to split render time from the rest of the frame, or is a Chrome Performance trace needed?
3. S0.5: is there a better no-change trigger for `render()` than a console call?
4. Anything in §5 missing for a later build?
