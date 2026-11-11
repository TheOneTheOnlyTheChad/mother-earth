# Globe performance — build proposal, rev 1.1

**For:** GPT's review, then Chad's approval lines in §7. **Docs only.**
**Written:** 11 Nov 2026 (14:28 UTC clock reading).
**Builds on:**
- `reviews/2026-11-11-globe-perf-stage0.md` (Stage 0 record, with GPT's read: supports C1; C2 and C3 no case);
- `docs/concepts/GLOBE-PERFORMANCE-PROPOSAL.md` rev 2.1 (§5: what any later build must keep).

**Rev 1.1:** GPT's review of rev 1 (relayed by Chad, 11 Nov): skipping the spike is fine; revise before the branch-build go. Changes in the table below.

**Chad's decision (11 Nov):** skip the throwaway Stage 1 spike. Go straight to a build proposal; GPT's C1 pass test is applied once, in the branch release-candidate check, with the Stage 0 harness.
**Not approved:** the branch build, the RC check, the merge. Each is its own line (§7). No hub, R2, D1, cron or variable change in any step.

## Rev 1.1 changes (GPT's review)

| # | GPT's point | Change | Where |
|---|---|---|---|
| R1 | §1 is credible; keep ~2,276 side draws as a **prediction**; three-globe still allocates a default side material when it creates each polygon group | B1 worded as "no side geometry or side draw calls"; prediction labelled; the pinned bundle's internals confirmed in the RC | §1, §2 |
| R2 | B1 can change pixels and picks: zero-alpha side fragments above the surface can still write depth, and side triangles can be raycast targets | B1 gets its own matched screenshots and hover/click checks at grazing edges and the limb, including an outline or point passing behind a cell edge | §2, §3 |
| R3 | Shared `DoubleSide` caps first; `FrontSide` must earn its place; material lifetime: the removal path disposes attached materials, so a cache can hold a disposed material | B2 split into **B2a** (shared, `DoubleSide`, same colour/opacity/depth settings) and **B2b** (`FrontSide`, tested alone at limb, poles, dateline). Shared materials are made fresh for each `render()` pass, never cached across passes; lifetime checked through a toggle and a refresh | §2, §5 |
| R4 | RC pairs need the same snapshot IDs, layers and cell counts, both settled and foreground; median and p95; rerun interrupted pairs; define what lets B1/B2 ship without B3; B3 needs its own RC against the best simpler step and main | §3 rewritten; ship rule in §3a | §3, §3a |
| R5 | `ME.cellId` floors longitude, so an exact interior boundary maps **east**; the Stage 0 edge case (Earthquakes west, Ships east) can't separate a west-edge rule from layer precedence | No general edge rule codified; that case kept as a regression case; a **same-layer** edge case added; B3's edge rule decided by Chad after it is measured | §4 |

## 0. What Stage 0 says, in one paragraph

With the coverage-cell polygons visible the page spends its frame in three.js per-object setup (`getParameters`, `getProgramCacheKey`) for ~2,300 meshes; hiding them takes frames to 16.7 ms and draw calls from 5,711 to 22. Caps (fills) account for ~4 draw calls per cell, outlines for 1. The scene grows only with the number of cells (782 → 1,229 during 11 Nov).

## 1. New finding from reading globe.gl's own code (not yet measured)

The page loads `globe.gl@2.45.0` (bundling three.js r181). Its polygon layer (three-globe) builds each cell as a Group with:
- one Mesh with **two materials**: an **invisible-underground side material** (a `MeshBasicMaterial` with a custom shader extension) and a cap `MeshBasicMaterial`, both `DoubleSide`;
- one `LineSegments` outline with its own `LineBasicMaterial`.

The page sets `polygonSideColor(() => 'rgba(0,0,0,0)')` to hide the sides. In three-globe a side colour that is **any non-empty value** means "build sides" (`hasSide = !!(sideColor || sideMaterial)`), so every cell still builds and draws fully transparent side walls with the custom shader. In three.js r181 a transparent `DoubleSide` material is drawn **twice** (back faces, then front). That accounts for Stage 0's 4 draw calls per cap mesh: **2 for invisible sides + 2 for the cap**.

So about **2,276 of the 5,711 draw calls (~40 %)** are predicted to be walls nobody can see, each with a custom shader program. This is a **prediction** from the source GPT and Claude read (three-globe 2.43.0 / 2.45.6 public source); the exact pinned bundle's behaviour is confirmed in the RC by draw-call counts.

## 2. The build: three steps on one branch, smallest first

| Step | Change | Expected draw calls (1,138-cell scene) | Behaviour risk |
|---|---|---|---|
| **B1 — no sides** | `polygonSideColor(() => null)` (one line). globe.gl then builds **no side geometry and draws no side calls** (it still allocates a default side material per group) | 5,711 → ~3,400 (−2 per cell), predicted | **Low but real:** invisible sides can write depth above the surface and can be raycast targets today, so removing them can change pixels and picks at grazing edges and the limb. Picking, labels, precedence and the inspector otherwise stay globe.gl's own |
| **B2a — shared cap materials** | `polygonCapMaterial(p => shared(p.fill))`: one `MeshBasicMaterial` per distinct fill, **`DoubleSide`**, same colour, opacity, `transparent` and depth settings as globe.gl's default; constructor taken from a polygon's own default cap material (the harvest pattern used by day/night and Ocean Heat). Made fresh in each `render()` pass (never cached across passes, so a material disposed with a removed polygon is never reused) | draw calls unchanged; ~2,300 materials → tens | Low: same look by construction; checks per §5 |
| **B2b — single-sided caps** | B2a with `FrontSide` | ~3,400 → ~2,300 (−1 per cell) | Must earn its place: at altitude 0.006 caps near the limb can show their backs, and culling affects picking. Tested alone at the limb, poles and dateline |
| **B3 — merged mesh (C1)** | Replace globe.gl's polygon layer for coverage cells with **one mesh for all fills and one line object for all outlines**, rebuilt when `render()` runs. Hover and click move to a coordinate lookup (`globe.toGlobeCoords` → `ME.cellId` → cell), reproducing Stage 0's observed picking | ~2,300 → **a handful** | Highest: picking, hover labels, overlap draw order and the line constructor (the page has no three.js constructors of its own; §4) all have to be rebuilt and tested |

**Why in this order:** B1 and B2 keep interactions in globe.gl's hands, so they need far fewer new tests than B3. §3a says when B3 is built.

**Not a scope change:** all three are changes to how the same cells are drawn. Nothing about what the page shows, says, fetches or keeps changes.

## 3. How it's measured (the RC check — one session, Chad's Chrome)

- **Where:** a clean Pages-origin tab with the branch page files injected (START-HERE §5a), against the live hub; the baseline is an **unmodified tab** of live main in the same session. Chrome in front, DevTools closed, full width.
- **Harness:** `reviews/evidence/2026-11-11-globe-perf-stage0/harness.js` (time-based sweep, render CPU, draw calls, forced completion, census), unchanged.
- **Matched pairs:** each pair (candidate vs baseline) runs with the **same snapshot IDs, the same enabled layers and the same cell counts** in both tabs; both tabs settled and **foreground during their measured windows** (one tab measured at a time, the other idle). Both orders (A–B–A–B, B–A–B–A); repeated once if the effect is close to the baseline spread. **Median and p95** recorded. Any pair interrupted by a refresh, a cell-count change or focus loss is rerun. The **hide-only** result on main is run as the reference ceiling.
- **Steps measured:** B1; B1 + B2a; B1 + B2a + B2b. Each is selectable on the branch for the check only (`?perf=b1|b2a|b2b`); the shipped page uses the chosen step with no switch.
- **Draw-call counts** confirm or refute §1's prediction on the pinned bundle.
- **Look and picks, per step (R2, R3):** matched screenshots (same pose) of overlapping translucent fills and outlines at the limb, poles and dateline; real hover and click at **grazing edges and the limb**, including where an **outline or a point passes behind a cell edge**, plus the Stage 0 S0.7 cases. B1 and B2a must reproduce today's screenshots and the S0.7 picking table; any difference is reported with its screenshot, and Chad decides whether it is acceptable.
- **Also recorded:** tap → painted inspector for the S0.7 cases (open since Stage 0); Chad's impression of the rotation.

## 3a. Ship rule (R4)

- A step **passes** if it gives a rotation-frame gain beyond the spread of its paired baselines in both orders, with look and picks preserved (or differences Chad accepts).
- **The best passing step ships without B3** if its rotation **median is ≤ 33 ms** (the D1 target) in the RC. Chad decides, with the numbers, whether a p95 above 50 ms is acceptable.
- If no simpler step reaches a 33 ms median, Claude says so and B3 becomes a separate build go (§7). B3 then gets **its own RC before any merge**, measured against **the best passing simpler step and live main**, with GPT's C1 pass test.
- If a simpler step passes but misses 33 ms, Chad chooses: ship it now and consider B3 later, or build B3 first.

## 4. B3 details (only if built)

- **Constructors:** Mesh and geometry from the globe mesh (as `harvestThree()` does); `BufferAttribute` from the globe geometry's position attribute; `MeshBasicMaterial` from a polygon's default cap material (B2's harvest); `LineSegments` from a polygon outline. If B3 replaces the polygon layer, these are harvested **before** the last globe.gl polygon is removed and kept; if any is missing, the page keeps globe.gl's polygons and says nothing (fail closed to today's behaviour).
- **Geometry:** each cell's cap as a small fan of triangles at altitude 0.006 on the sphere (same curvature resolution as now, 5°), vertex colours with alpha; outlines as segment pairs at 0.006 + 1e-4.
- **Picking:** canvas `pointermove` / `click` → `globe.toGlobeCoords(x, y)` → `ME.cellId` → the cells at that id; winner by the Stage 0 precedence (Earthquakes > Fires > Ships > Forest). Points and open globe keep their current routing. `ohTap` keeps its lat/lng.
- **Shared edges (R5):** no general edge rule is codified yet. `ME.cellId` floors, so an exact interior longitude boundary maps **east**, while Stage 0's edge case picked the west cell; that case had Earthquakes west and Ships east, so it can't tell a west-edge rule from layer precedence. It stays a **regression case**, and a **same-layer** edge case is added to the RC. B3's edge rule is set by Chad once both are measured.
- **Tests:** the eight suites named in proposal rev 2.1 §5; `ME.openCell`, `ME.cellPolys`, `ME.renderState` give the same outputs; new breaks for picking precedence and the edge rule.

## 5. Tests for B1 and B2

- Existing suites green (desktop-overflow, mobile-pass, place-ui, timeline-ui, orbital-browser, buoy-temp-ui, oceanheat-ui, sky-zoom-ui).
- New checks: no polygon mesh has a side geometry group (B1); caps share materials by fill with globe.gl's default colour, opacity, transparency and depth settings (B2a); `FrontSide` only under `?perf=b2b` (B2b); `ME.cellPolys` unchanged.
- **Material lifetime (R3):** after an optional-layer toggle and after a scheduled refresh, every rendered cap material is undisposed and in use, the material count follows the distinct fills, and no material outlives its pass.
- One break per step that puts the old behaviour back and must fail.

## 6. Out of scope

Phones (still open), the hub, any other layer, what the inspector says, and the ~200 ms frame state's trigger (still unidentified; the RC records which state each window was in).

## 7. Approval lines (Chad)

1. `Go: globe performance build B1+B2 on a branch (no page release)` — Claude builds and tests (B1, B2a, B2b behind `?perf=` for the check); no screen time needed.
2. `Go: globe performance RC check (Chad's Chrome)` — needs Chad at the screen, ~40 min.
3. Then, by §3a: either `Approve: push <branch> to main (page change: globe performance <step>)`, or `Go: globe performance build B3 on the same branch` followed by its own RC.

## 8. GPT

Rev 1 review (relayed by Chad, 11 Nov): revise before the branch-build go; skipping the spike accepted; §1 credible as a prediction. Rev 1.1 applies R1–R5.
