# Globe performance — build proposal, rev 1

**For:** GPT's review, then Chad's approval lines in §7. **Docs only.**
**Written:** 11 Nov 2026 (14:28 UTC clock reading).
**Builds on:**
- `reviews/2026-11-11-globe-perf-stage0.md` (Stage 0 record, with GPT's read: supports C1; C2 and C3 no case);
- `docs/concepts/GLOBE-PERFORMANCE-PROPOSAL.md` rev 2.1 (§5: what any later build must keep).

**Chad's decision (11 Nov):** skip the throwaway Stage 1 spike. Go straight to a build proposal; GPT's C1 pass test is applied once, in the branch release-candidate check, with the Stage 0 harness.
**Not approved:** the branch build, the RC check, the merge. Each is its own line (§7). No hub, R2, D1, cron or variable change in any step.

## 0. What Stage 0 says, in one paragraph

With the coverage-cell polygons visible the page spends its frame in three.js per-object setup (`getParameters`, `getProgramCacheKey`) for ~2,300 meshes; hiding them takes frames to 16.7 ms and draw calls from 5,711 to 22. Caps (fills) account for ~4 draw calls per cell, outlines for 1. The scene grows only with the number of cells (782 → 1,229 during 11 Nov).

## 1. New finding from reading globe.gl's own code (not yet measured)

The page loads `globe.gl@2.45.0` (bundling three.js r181). Its polygon layer (three-globe) builds each cell as a Group with:
- one Mesh with **two materials**: an **invisible-underground side material** (a `MeshBasicMaterial` with a custom shader extension) and a cap `MeshBasicMaterial`, both `DoubleSide`;
- one `LineSegments` outline with its own `LineBasicMaterial`.

The page sets `polygonSideColor(() => 'rgba(0,0,0,0)')` to hide the sides. In three-globe a side colour that is **any non-empty value** means "build sides" (`hasSide = !!(sideColor || sideMaterial)`), so every cell still builds and draws fully transparent side walls with the custom shader. In three.js r181 a transparent `DoubleSide` material is drawn **twice** (back faces, then front). That accounts for Stage 0's 4 draw calls per cap mesh: **2 for invisible sides + 2 for the cap**.

So about **2,276 of the 5,711 draw calls (~40 %)** are walls nobody can see, each with a custom shader program. This was not known when Stage 0 ran, so it is a hypothesis to measure, not a result.

## 2. The build: three steps on one branch, smallest first

| Step | Change | Expected draw calls (1,138-cell scene) | Behaviour risk |
|---|---|---|---|
| **B1 — no sides** | `polygonSideColor(() => null)` (one line). globe.gl then builds no side geometry and no side material | 5,711 → ~3,400 (−2 per cell) | **None expected:** the sides are fully transparent today. Picking, labels, precedence and the inspector all stay globe.gl's own |
| **B2 — shared single-sided cap materials** | `polygonCapMaterial(p => shared(p.fill))`: one `MeshBasicMaterial` per distinct fill, `FrontSide`, `transparent`, same colour and opacity; constructor taken from a polygon's own default cap material once one exists (the harvest pattern already used by day/night and Ocean Heat) | ~3,400 → ~2,300 (−1 per cell); ~2,300 materials → tens | Low: one material per fill colour instead of one per cell. `FrontSide` must be checked against the limb (caps are on a sphere facing outward) |
| **B3 — merged mesh (C1)** | Replace globe.gl's polygon layer for coverage cells with **one mesh for all fills and one line object for all outlines**, rebuilt when `render()` runs. Hover and click move to a coordinate lookup (`globe.toGlobeCoords` → `ME.cellId` → cell), reproducing Stage 0's observed picking | ~2,300 → **a handful** | Highest: picking, hover labels, overlap draw order and the line constructor (the page has no three.js constructors of its own; §4) all have to be rebuilt and tested |

**Why in this order:** B1 and B2 keep every interaction exactly as globe.gl does it today, so they cost almost nothing in tests. If they bring the page close to the targets, B3 may not be worth its risk. If they don't, B3 is built on top.

**Not a scope change:** all three are changes to how the same cells are drawn. Nothing about what the page shows, says, fetches or keeps changes.

## 3. How it's measured (the RC check — one session, Chad's Chrome)

- **Where:** a clean Pages-origin tab with the branch page files injected (the established pattern, START-HERE §5a), against the live hub. Chrome in front, DevTools closed, full width.
- **Harness:** `reviews/evidence/2026-11-11-globe-perf-stage0/harness.js` (time-based sweep, render CPU, draw calls, forced completion, census), unchanged.
- **Baseline:** an **unmodified tab** (live main) in the same session. Both orders (A–B–A–B, B–A–B–A); repeat once if the effect is close to the baseline spread. The **hide-only** result (polygons hidden on main) is run as the reference ceiling.
- **Per step:** each built step that's on the branch (B1; B1+B2; and B1+B2+B3 if built) against the same baseline. The steps are switchable on the branch for the check only (`?perf=b1`, `b2`, `b3`), and the shipped page uses the chosen step with no switch.
- **Pass (GPT's test):** a repeatable rotation-frame gain beyond the spread of its paired baselines, in both orders; **and** the look preserved: matched screenshots (same pose) of overlapping translucent fills and outlines, at the limb and the dateline.
- **Also recorded:** tap → painted inspector for the S0.7 cases (open since Stage 0: does fewer objects help taps?); the S0.7 picking table must match exactly for B1/B2 and match or follow Chad's rule for B3.
- **Chad's impression** of the rotation, alongside the numbers.

## 4. B3 details (only if built)

- **Constructors:** Mesh and geometry from the globe mesh (as `harvestThree()` does); `BufferAttribute` from the globe geometry's position attribute; `MeshBasicMaterial` from a polygon's default cap material (B2's harvest); `LineSegments` from a polygon outline. If B3 replaces the polygon layer, these are harvested **before** the last globe.gl polygon is removed and kept; if any is missing, the page keeps globe.gl's polygons and says nothing (fail closed to today's behaviour).
- **Geometry:** each cell's cap as a small fan of triangles at altitude 0.006 on the sphere (same curvature resolution as now, 5°), vertex colours with alpha; outlines as segment pairs at 0.006 + 1e-4.
- **Picking:** canvas `pointermove` / `click` → `globe.toGlobeCoords(x, y)` → `ME.cellId` → the cells at that id; winner by the Stage 0 precedence (Earthquakes > Fires > Ships > Forest); on an exact shared edge the west cell (as observed), unless Chad sets another rule. Points and open globe keep their current routing. `ohTap` keeps its lat/lng.
- **Tests:** the eight suites named in proposal rev 2.1 §5; `ME.openCell`, `ME.cellPolys`, `ME.renderState` give the same outputs; new breaks for picking precedence and the edge rule.

## 5. Tests for B1 and B2

- Existing suites green (desktop-overflow, mobile-pass, place-ui, timeline-ui, orbital-browser, buoy-temp-ui, oceanheat-ui, sky-zoom-ui).
- New checks: no polygon object carries a side group (B1); caps share materials by fill and are `FrontSide` (B2); `ME.cellPolys` unchanged; one break per step that puts the old behaviour back and must fail.

## 6. Out of scope

Phones (still open), the hub, any other layer, what the inspector says, and the ~200 ms frame state's trigger (still unidentified; the RC records which state each window was in).

## 7. Approval lines (Chad)

1. `Go: globe performance build B1+B2 on a branch (no page release)` — Claude builds and tests; no screen time needed.
2. `Go: globe performance RC check (Chad's Chrome)` — needs Chad at the screen, ~30 min.
3. Then, from the RC result: either `Go: globe performance build B3 on the same branch` or `Approve: push <branch> to main (page change: globe performance B1+B2)`.

## 8. For GPT

1. Is §1's reading of three-globe right: does a fully transparent `polygonSideColor` still build and draw sides, and does r181 draw transparent `DoubleSide` twice?
2. Any reason B1 (sides off) could change what's visible (e.g. depth writes from the invisible sides hiding anything)?
3. Is B2's `FrontSide` safe for caps at altitude 0.006, or should it stay `DoubleSide` and only share materials?
4. Is the step-by-step RC (B1, B1+B2, then B3 only if needed) an acceptable way to apply your C1 pass test?
