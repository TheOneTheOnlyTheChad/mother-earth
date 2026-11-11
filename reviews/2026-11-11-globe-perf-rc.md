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

All green on the branch (§4).

## 3. Finding for Chad: B1 changes a few outline pixels

Removing the invisible side walls changes **only outline pixels**, never fills: on shared edges between cells and in the strip of cells near the limb, parts of neighbouring outlines that the invisible walls used to hide (by writing depth) now draw. Fills, colours and hover/click winners are unchanged.

- `reviews/evidence/2026-11-11-globe-perf-rc/b1-vs-main-dateline-diff.png` — left: main, middle: B1, right: differing pixels (red), 4× zoom. Edges between the forest, fires and grey cells draw more completely in B1.
- `…/b1-vs-main-pose1-diff.png` — the same for pose 1 (shared edges near the centre, the limb strip, the northern cells).
- `…/test-pose1-main.png`, `…/test-pose1-b1.png` — the full test frames.

Reading: B1 shows the outlines as drawn, without walls nobody can see cutting them; it is arguably more correct than today. GPT predicted this class of change (proposal rev 1.1, R2). **Whether it is acceptable is Chad's call**, and the RC check repeats the comparison on the live page with real data (matched screenshots, limb, poles, dateline).

## 4. Regression suites (branch `globe-perf-rc`, container, swiftshader; run 11 Nov 15:02:05–15:27:03 UTC by file timestamps; buoy-temp-ui and terminator reruns after that)

Every browser and hub suite in `phase1/` was run in sequence (the default page is B2a):

- **Browser:** arts-ui 90 · backdrop-layer 27 · buoy-temp-ui 33 · cell-perf-ui 27 · desktop-overflow 112 · drifters-ui 25 · kept-ui 21 · mobile-pass 131 · oceanheat-ui 109 · orbital-browser 113 · place-ui 30 · plastic-ui 29 · search-ui 104 · sky-ui 79 · sky-zoom-ui 333 · smoke-fixes 52 · terminator-behaviour 47 · terminator-ui 19 · timeline-axis 96 · timeline-ui 585 · ux-round1 34 — **0 failed**.
- **Hub and logic:** arts-hub 54 · buoy-temp 37 · drifters-hub 12 · duration-contract all · firms-guard 19 · firms-v2 57 (+7 skipped, need `OLD_WORKER`) · health-hub 29 · history-hub 27 · kp-degraded 29 · oceanheat-hub 48 · orbital-hub 13 · orbital-ui 38 · place-rows 7 · plastic-hub 11 · satellites-hub 12 · search 111 · ships-fallback 7 · ships-late 7 · ships-probe 11 · sky-build 35 · sky-hub 46 · sky-scene-hub 7 · sky-scene-ref 7 · solar 26 · spacetrack-probe 11 · timeline-catalogue-hub 66 — **0 failed**.
- **Note:** buoy-temp-ui's first run stopped while writing a debug screenshot to a scratch path hard-coded by an earlier session (line 134); a rerun passed 33/33. Not a page failure.
- Ocean Heat suites ran on `OH_SNAPSHOT_DIR` rebuilt from `db5eedd` (START-HERE §4o).

## 5. Suite additions after GPT's review of `2ca14e1` (branch `b49671e`)

`phase1/cell-perf-ui.test.cjs` now 35 checks: B2b hover asserted (not just logged); **real clicks** at every probe point in every step (winners identical to main); **R3 closed in the suite for B2a and B2b**: the page's own scheduled refresh (`tick`, captured from its `setInterval`, not reimplemented) runs with cells added and removed, and afterwards no cap attached to a cell carries a disposed material, every cap material is from the current pass, one per fill. New break `cache-across-passes` (materials kept across passes — the R3 risk) fails 7 checks. All breaks: keep-sides 3 · per-cell 5 · wrong-opacity 2 · frontside-a 3 · cache-across-passes 7 failures; clean run 35/35.

## 6. RC check — Chad's Chrome, 11 Nov 2026, 15:48–16:07 UTC

**Setup.** Chrome 156, Apple M3, 1470 × 745 CSS px, DPR 2, window in front and focused in every window. One tab, reloaded per window: **baseline = unmodified live main**; **candidate = branch `index.html` (`43b7b14b…`, commit `2ca14e1`) injected on the Pages origin** with `?perf=` in the tab URL; every other page file was served live and checked equal to the branch. Same harness as Stage 0 (time-based sweep, 10 s window after 2 s warm-up, render CPU wrap, draw calls). Each load waited until every cell was built and the count had held for 2 s. Raw: `reviews/evidence/2026-11-11-globe-perf-rc/chrome-rc-raw.json` (27,900 B, sha256 `de1c6a3d…a04ea`; same on Chad's Mac `~/Downloads/globe-perf-rc-2026-11-11.json`).

**Matched pairs** (A = main, B = candidate; A–B–A–B then B–A–B–A; the same 1,250 cells — usgs 25/26, firms 502, ships 164, forest 559 — in each pair; no window flagged). **Correction (GPT, 11 Nov):** one pair was not matched on snapshot IDs — the second forward B2a pair (main 15:54:56 UTC on the 15:50:09 USGS snapshot, B2a 15:55:19 on the 15:55:09 snapshot) straddled a USGS rollover although both had 25 USGS cells. It is marked **unmatched** and is not counted; B2a rests on its other three pairs. Every B1 and B2b pair matched on all snapshot IDs:

| Step | Frame median / p95 (ms), 4 windows | Render CPU median (ms) | Draw calls | Main in the same pairs |
|---|---|---|---|---|
| B1 | 16.7 / 33.4–33.6 (all four) | 19.4–20.2 | 3,774 | 33.4 / 50–50.9; CPU 35.3–36.5; 6,274 |
| B2a | 16.7 / 33.4 (three matched pairs; the unmatched pair read the same) | 19.5–20.5 | 3,771–3,774 | 33.4 / 50; CPU 36.1–37.6; 6,271–6,274 |
| **B2b** | **16.7 / 16.7–16.8 (all four)** | **6.4–7.1** | 2,521–2,526 | 33.4 / 50–50.1; CPU 36.5–37.8; 6,271–6,279 |
| hide-only on main (ceiling) | 16.7 / 17.9–18.2 (two) | 1.9–2.0 | 24 | — |

- The effect is far beyond the baseline spread in both orders for every step (main's own windows: 33.4 / 50–50.9 throughout).
- Frames are capped at the display's 16.7 ms, so B1 and B2a already sit at the floor in median; **render CPU and p95 separate them: B2a adds nothing over B1; B2b cuts render CPU by a further two-thirds and brings p95 to the floor.**
- Main ran in its ~33 ms state for the whole matched session. The ~200 ms state appeared only in two unmatched trial reads before the log started (15:48–15:49 UTC: main 234 ms, then B1 133 ms, single windows, not used).

**Picks on live data (real hover and click, same screen coordinates, pose lat −10°, lng 25°, altitude 2.0):**

| Probe (chosen from the live cells) | main | B1 | B2a | B2b |
|---|---|---|---|---|
| overlap 19_51 (fires + forest) | Fires 19_51 | same | same | same |
| mixed-layer edge 21_51 │ 21_52 | Fires 21_51 (west) | same | same | same |
| same-layer edge, Forest 22_51 │ 22_52 | Forest 22_51 (west) | same | same | same |
| fire dot 0.06° west of an edge (15_51 │ 15_52) | Fires 15_52 (east) | same | same | same |
| limb, 75° from centre (aimed at 38_47) | Ships 36_48 | same | same | same |
| open globe | none → "Everything here 14_46" | same | same | same |

**Hover and click winners identical to live main in every step.** Two observations for B3 (not built): at the limb the click lands on a neighbouring cell, and a dot just west of an edge opens the east cell — this is what globe.gl does today, and any coordinate lookup would have to match or replace it on Chad's rule.

**Tap → painted inspector (same six taps):** main 711–768 ms · B1 611–629 · B2a 619–647 · **B2b 482–545**. No step is worse than main (rev 2.1 §5 regression check: met). Progress toward 200 ms, reported separately: B2b is ~230 ms faster than main but still 2.4–2.7× the target.

**Look (live data).** Matched zoomed screenshots, main vs B2b, same pose: the limb strip and southern Africa (dense fires and forest cells). No difference visible at that zoom: same fills, same outlines, no gaps or back-faces at the limb. (The images were captured by the browser extension and are not in the repo; the pixel-level evidence is the fixture comparison in §3.) **The planned live pole and dateline views were not captured in this run;** they are part of the final smoke check (§10).

## 7. §3a reading (for Chad's decision)

- **Every step passes** GPT's test: a repeatable gain beyond the paired baselines in both orders, with picks identical to main and the look unchanged apart from §3's outline pixels.
- **Best passing step: B2b** — median 16.7 ms (≤ 33 ms), p95 16.7 ms (≤ 50 ms), render CPU ~6.5 ms against main's ~36. **Under §3a it ships without B3.**
- B2b "earned its place" (proposal R3): it adds the p95 and CPU gain, and its picks and look matched main on live data at the limb.
- **Chad's calls:** (1) accept §3's outline change (B1 and everything built on it), (2) ship B2b.

## 8. Before a merge (not done; each its own step)

1. **Remove the RC switch:** done, §10.
2. GPT reviews the RC results and the switch removal.
3. `Approve: push globe-perf-rc to main (page change: globe performance B2b — no side walls, shared single-sided cell fills)`.

## 9. Next (superseded by §8)

1. GPT reviews this packet and the branch (`globe-perf-rc`, files in the Mac folder `_review/globe-perf-rc/`).
2. `Go: globe performance RC check (Chad's Chrome)` — Chad at the screen, ~40 min: matched pairs against an unmodified tab of live main, both orders, median and p95, the hide-only ceiling, look and picks on real data, tap latency against main for the S0.7 cases (no worse than Stage 0, progress to 200 ms reported separately), the 33 ms threshold applied as written (proposal §3a).
3. Then §3a decides: ship the best passing step, or B3.

## 10. Switch removal (branch `b78f811`) — GPT: proceed with §8

- **Diff (index.html only):** the `?perf=` reader is replaced by one constant, `const CELL_PERF = { mode: 'b2b', Ctor: null, pass: 0, mats: null };`; the B2b comment now says "the released step". No other line changed. Exact diff: `reviews/evidence/2026-11-11-globe-perf-rc/switch-removal.diff`.
- **Final `index.html`:** sha256 `b5ac4ed148beee4c754ebec428ef877f133c74ad5825118a09ce1e96f4665d54`.
- **Suite `cell-perf-ui` 43/43.** The comparison modes (main, B1, B2a) are served by rewriting that one constant in the served HTML (test-only, kept for fixture coverage). New **release checks on the untouched `index.html`**: at the ordinary URL and with `?perf=main`, `?perf=b1` and `?perf=b2a`, the page runs B2b (mode b2b, no side geometry, shared FrontSide caps, one material per fill), no page errors. New break `url-switch` (an old-style URL override put back) must fail.
- Breaks and the full regression run: (pending).
- **Final smoke check — DONE (Chad's Chrome, 16:20–16:21 UTC, 1470 × 745, focused):** live main (16:20:28 UTC, 1,248 cells) vs the final branch `index.html` injected on the Pages origin (sha256 `b5ac4ed148beee4c…` checked in the tab; 16:21:03 UTC, the same 1,248 cells, `ME.cellPerf()` = b2b, 40 shared materials). Same poses: **north pole** (lat 78°, lng 60°, altitude 1.8) and **dateline** (lat −15°, lng 180°, altitude 1.8), matched zoomed screenshots of the globe. **No visible difference at either view:** the cells around the polar-night area (outlines over the dark no-imagery disc), the limb ring, the dateline column of forest and fire cells and the outlines crossing 180° all draw the same; no missing or back-facing fills at the limb or the pole. (Screenshots taken by the browser extension; not in the repo.) Chad makes the visual call.
