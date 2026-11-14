# Sky zoom-out view: zoom fix — candidate `sky-zoom-fix-rc` (14 Nov 2026)

Written 14 Nov 14:49 UTC (clock reading) by Claude. Branch only; nothing merged or deployed. Page only: no hub, R2 or D1 change.
Proposal: `docs/concepts/SKY-DISTANCE-ZOOM-FIX-PROPOSAL.md` rev 2 (GPT; copied unchanged from the Mac, 8,096 B).
Chad's line: "Go: build sky-zoom-fix-rc on a branch per SKY-DISTANCE-ZOOM-FIX-PROPOSAL rev 2 (plain wheel scrolls the
page; resize included; page only; no merge)".

## 1. What was wrong (reproduced on main `49c8c7e`)
- After a drag at + Sun, zoom-in moved the camera toward the framing centre, which is empty space: no body in frame
  after about 5 notches, then stuck beside that point (GPT, live Chrome; Claude, headless).
- After a drag, zoom-out ran to 200,000 units while the far plane is 125,000: meshes clipped, rings and tags left on
  empty space (Claude).

## 2. What changed
| File | Change |
|---|---|
| `skyscene.js` | Free zoom removed: every zoom input moves along the path, clamped at Earth and + Sun; after a drag the first input returns to the position held when the drag began and applies its increment. Inputs: Zoom in / Zoom out buttons, touch pinch, ctrl+wheel, Safari gesture events. Plain wheel not handled and not prevented. Re-framing when the globe box or the strip changes size (ResizeObserver), keeping the entry view and progress; narrowing into the phone layout collapses the readings sheet as entry does. Tags, rings and lines only for bodies inside the camera frustum (near and far). After a pinch, a finger left down is not a drag. |
| `index.html` | Zoom in / Zoom out buttons in the stop bar; `skyscene.js?v=202612061000`. |
| `style.css` | Strip height cap 40% → 30% of the box (see §4.1). `?v=202612061000` on all five pages. |
| `sources.html` | One sentence in "What it is" describing the zoom inputs. |
| `phase1/sky-zoom-ui.test.cjs` | Path driven by ctrl+wheel, pinch and buttons; new checks (§3). |
| `phase1/skycraft-ui.test.cjs` | One step uses ctrl+wheel instead of a plain wheel. |

## 3. Tests (container, headless Chrome with SwiftShader; hub answers = the committed R1 and scene files)
- **`sky-zoom-ui`: 351 passed, 0 failed** (was 333 on main).
- New checks:
  - **Rendered stops**, 1280×900, 900×700, 390×844, 360×640, explanation closed and open: Earth drawn, expected bodies
    tagged and drawn.
  - **Zoom after a drag**, both directions, from s = 0, 0.5, 1, 1.5, 2: ctrl+wheel (1280×900), pinch (390×844), buttons
    (360×640). First input back on the path at the held position ± one step; 30 more (80 for pinch) clamp at the end.
  - **Far plane:** a Sun beyond the far plane with its centre on screen gets no tag and no ring.
  - **Plain wheel:** progress unchanged, event not prevented.
  - **Pinch finger changes:** one finger lifted, the other moves, then cancelled: never free orbit.
  - **Resize / rotation:** 390×844 → 844×390 → 390×844 → 1280×900 (from free orbit) → 360×640; and 1280×900 → 390×844 → 1280×900.
- **How "drawn" is established (independent of the page's own report):** (a) a frustum test from the camera matrices
  and the meshes in the scene, near and far planes included; (b) two screenshots of the page with the SVG overlay
  hidden, one with that body's mesh shrunk to nothing; the body counts as drawn where they differ inside its
  projected disc. A body under the strip, clipped, or off the canvas counts 0. These runs give Earth a plain
  near-white image (the suite otherwise blocks imagery, and a black Earth cannot be seen on the dark page).
- **Breaks, each must fail and does:**

| Break | Failed checks |
|---|---|
| `free-zoom-old` (the old free branch) | 3 (zoom after a drag: ctrl+wheel, pinch, buttons) |
| `plain-wheel-zooms` | 2 |
| `no-resize-reframe` | 1 |
| `tags-not-frustum` | 1 |
| `pinch-leaves-drag` | 1 |
| `buttons-off` | 2 |
| `resize-keeps-sheet` | 1 (first passed: the check did not look at the sheet; fixed, then failed) |
| `strip-40` (old strip cap) | 4 |
| existing: `pinch-off` 2, `endpoint-only` 3+, `target-by-s` 13, `no-containment` 1 | |

  `endpoint-only`'s run was cut short when the local server reached its time limit (3 failures before that); not rerun.
  The other 17 existing breaks were not rerun on this branch.
- **Neighbouring suites:** sky-ui 79/0, skycraft-ui 77/0, desktop-overflow 258/0, mobile-pass 131/0. The full regression
  (51 files) was not run.
- **Far-plane margin on the path** (10 Nov sample, 201 positions): farthest body from the camera 28,810 units
  (1280×900), 40,468 (390×844), 43,171 (360×640); far plane 125,000.

## 4. Deviations and findings for GPT
1. **Strip cap 40% → 30% (not in the proposal).** With "How this is drawn" open, the strip grew to 40% of the box and
   the stops could not be framed above it at any tested size: the Moon or Sun sat under the strip. Measured: at 30%
   every stop re-frames above the open strip at 1280×900, 390×844 and 360×640 (also at 25% and 20%). The strip
   scrolls inside the cap. If the stops still cannot be framed (same box, taller strip), the view keeps its framing
   rather than closing.
2. **Plain wheel and page scroll.** On the Earth page the body does not scroll at desktop and phone sizes
   (`overflow:hidden`), so "the page scrolled" cannot be shown there; the check asserts progress unchanged and the
   event not prevented. A plain wheel over the view therefore does nothing visible at those sizes.
3. **Between stops a tagged body may be under the stop bar or strip** (proposal: bodies may move in or out of view
   between stops). The check requires it to be inside the frustum there, and drawn at the stops.
4. **Button step:** 0.2 of a stop per press (10 presses Earth → + Sun). A choice, not from the proposal.
5. **Safari gesture events** are handled but cannot be exercised in this container. Untested.
6. **Entry view is kept across re-framing.** Stop A used to be re-read from the camera on a date rollover; it is now
   kept from entry (needed for resize; also changes rollover-while-free).

## 5. Not done
Real phone, Safari (trackpad and touch), screen reader; a live check from the Pages origin; the full regression;
GPT's independent review.

## 6. Next
1. GPT reviews this packet and smoke-tests the Mac copy `_review/sky-zoom-fix-rc/` (Chad serves it:
   `python3 -m http.server 8899 --bind 127.0.0.1`).
2. `Approve: merge sky-zoom-fix-rc to main (page change: Sky zoom-out view zoom fix)`
3. Served hashes and a live check. Rollback = revert the merge (own Approve line).
