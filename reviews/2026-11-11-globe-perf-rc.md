# Globe performance — release candidate packet (branch `globe-perf-rc`), 11 Nov 2026

**Authority:** Chad's line `Go: globe performance build B1+B2 on a branch (no page release)`, 11 Nov 2026. Proposal: `docs/concepts/GLOBE-PERFORMANCE-BUILD-PROPOSAL.md` rev 1.1 (main `6883d12`; GPT: ready for the build go).
**Branch only.** No page release, no hub, R2, D1, cron or variable change. The RC check and any merge are separate lines.

## 1. What changed (`index.html` only, plus a new test suite)

- **B1 — no side walls:** `polygonSideColor(() => null)` (was `'rgba(0,0,0,0)'`). globe.gl builds no side geometry and makes no side draw calls; it still allocates its default side material per cell group (not used).
- **B2a — shared cap materials (the branch default):** `polygonCapMaterial(p => p.mat)`. Each `render()` pass makes one `MeshBasicMaterial` per distinct fill with exactly what globe.gl does for a cap colour (`color.setHex`, `transparent = alpha < 1`, `opacity = alpha`), `DoubleSide`, `depthWrite` taken from globe.gl's own default cap material. The constructor is taken from a cell globe.gl has already built (the harvest pattern used by day/night and Ocean Heat). Materials are never kept across passes, so a material disposed with a removed cell is never reused. Until the first cell exists, globe.gl's own per-cell materials are used; once one exists the page redraws once with shared ones.
- **B2b — FrontSide caps:** B2a with `FrontSide`; selectable only for the RC.
- **RC switch:** `?perf=main|b1|b2a|b2b` (default `b2a`). `main` reproduces today's page exactly. The released page will carry the chosen step with no switch (proposal §3).
- **Test aid:** `ME.cellPerf()` → `{ mode, harvested, pass, materials }` (read-only).

## 2. Tests

### New suite `phase1/cell-perf-ui.test.cjs` — 27/27

Fixture: 29 coverage cells over four layers with overlaps (up to three layers), shared edges (mixed-layer and same-layer), cells at the limb (19_65–19_68, 35_53) and across the dateline (17_88, 17_89, 17_0), all three grades, forest counts across its log fill. Swiftshader, 1280 × 860, a plain dark backdrop so the globe draws. Two fixed poses (centre −14°, 32°; dateline −20°, 178°).

| Check | Result |
|---|---|
| Draw calls, 29 cells | **main 147 · B1 89 · B2a 89 · B2b 60** — exactly −2 per cell for B1 and −1 more for B2b (the proposal's §1 prediction, confirmed on the pinned bundle) |
| Side geometry | main: every cell; B1/B2a/B2b: none |
| Cap materials | main and B1: one per cell; B2a: one per distinct fill, each with globe.gl's exact colour, opacity, transparency, depth and side for that fill; B2b: FrontSide on every cap |
| `ME.cellPolys` | identical in all four steps |
| Hover winners at 22 probe points (overlaps, mixed- and same-layer edges, limb, dateline, open globe) | **identical to main in B1, B2a and B2b** |
| Material lifetime (B2a) | after Forest off → on, an optional layer on (fetch + render) and off: every cap material belongs to the current pass; materials = distinct fills; programs stay few |
| Pixels, B2a vs B1 and B2b vs B2a | identical on both poses |
| **Pixels, B1 vs main** | **not identical: 296 of 469,208 px (pose 1) and 78 px (dateline pose), all on cell outlines** — §3 |

**Breaks (each must fail):** `BREAK=keep-sides` 3 fail · `per-cell` 3 fail · `wrong-opacity` 2 fail · `frontside-a` 3 fail.

### Regression suites

(see §4 — filled in when the run completes)

## 3. Finding for Chad: B1 changes a few outline pixels

Removing the invisible side walls changes **only outline pixels**, never fills: on shared edges between cells and in the strip of cells near the limb, parts of neighbouring outlines that the invisible walls used to hide (by writing depth) now draw. Fills, colours and hover/click winners are unchanged.

- `reviews/evidence/2026-11-11-globe-perf-rc/b1-vs-main-dateline-diff.png` — left: main, middle: B1, right: differing pixels (red), 4× zoom. Edges between the forest, fires and grey cells draw more completely in B1.
- `…/b1-vs-main-pose1-diff.png` — the same for pose 1 (shared edges near the centre, the limb strip, the northern cells).
- `…/test-pose1-main.png`, `…/test-pose1-b1.png` — the full test frames.

Reading: B1 shows the outlines as drawn, without walls nobody can see cutting them; it is arguably more correct than today. GPT predicted this class of change (proposal rev 1.1, R2). **Whether it is acceptable is Chad's call**, and the RC check repeats the comparison on the live page with real data (matched screenshots, limb, poles, dateline).

## 4. Regression suites

(pending)

## 5. Next

1. GPT reviews this packet and the branch (`globe-perf-rc`, files in the Mac folder `_review/globe-perf-rc/`).
2. `Go: globe performance RC check (Chad's Chrome)` — Chad at the screen, ~40 min: matched pairs against an unmodified tab of live main, both orders, median and p95, the hide-only ceiling, look and picks on real data, tap latency against main for the S0.7 cases (no worse than Stage 0, progress to 200 ms reported separately), the 33 ms threshold applied as written (proposal §3a).
3. Then §3a decides: ship the best passing step, or B3.
