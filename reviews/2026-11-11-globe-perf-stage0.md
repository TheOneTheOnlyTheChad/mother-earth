# Globe performance — Stage 0 record (measure only), 11 Nov 2026 — IN PROGRESS (S0.6 dwell, S0.T trace, evidence file still to come)

**Authority:** Chad's line `Go: globe performance Stage 0 (measure only, Chad's Chrome, live page, no code change)`, 11 Nov 2026. Proposal: `docs/concepts/GLOBE-PERFORMANCE-PROPOSAL.md` rev 2.1 (main `b25da75`), GPT-cleared.
**No code change:** nothing pushed to the page; no hub, R2, D1 or variable change. All instruments were console wraps in one tab of the live page, each restored and the restore checked.

## 1. Setup (measured)

- **Page:** the live public page, fresh tab. Served-hash check 10:38:31 UTC: all ten page files equal main (index `75420aa2`, sources `50fa74e9`, timeline.html `d7c37d5f`, app `161b53cc`, arts `58773cef`, timeline.js `ae87c6a1`, style `fad92f02`, sky `2056da8d`, skyscene `5e00ad77`, oceanheat `a45097ba`). Page unchanged since merge `158e4b1`.
- **Browser:** Chad's Chrome 156 through Claude in Chrome; ANGLE Metal, **Apple M3**.
- **Viewport:** 1470 × 745 CSS px, DPR 2, drawing buffer 1804 × 1146 — the same in every block (checked per block). `visibilityState` visible and `hasFocus` true in every window.
- **Layers:** the four default map layers on (Earthquakes, Fires, Ships, Forest), optional layers off.
- **Rotation protocol (rev 2.1 §3):** auto-rotate off; start pose lat −10, lng 25, altitude 2.2; 2 s warm-up; then a 10 s window with longitude = start + 36°/s × elapsed, set each frame with `pointOfView(…, 0)`; clock and pose fresh after warm-up.
- **Instruments:** rAF frame deltas; CPU time inside `renderer.render` per frame; `renderer.info.render.calls` / `.triangles`; forced completion = globe paused, 60 × render + 1-pixel `readPixels`; census by type and globe.gl object type.
- **Scene-change flag:** a window is flagged if `polygonsData()` was replaced or the non-ring object count changed. Quake rings add and remove objects as they animate, so ring objects are excluded from the count (first S0.1 windows flagged on ring churn alone; noted).

## 2. Census

| Time (UTC) | Objects | Coverage cells (= polygon groups) | Cap meshes | Outlines | Per layer | Geometries |
|---|---|---|---|---|---|---|
| 04:00 (rc §10) | 2,379 | 782 | 782 | 782 | — | — |
| 10:39:03 | 3,453 | 1,138 | 1,138 | 1,138 | forest 559 · firms 384 · ships 169 · usgs 26 | 2,285 |
| 10:50:58 | 3,462 | 1,145 | 1,145 | 1,145 | — | 2,311 |

Points are one merged object (19,120 points at 10:39). Scene vertices ≈ 1.51 M.

## 3. Results

### S0.1 — baseline, all visible (10:39:10–10:39:55)

| Window | Frame median / p95 (ms) | n | Render CPU median (ms) | Draw calls | Triangles |
|---|---|---|---|---|---|
| 1 | 33.4 / 216.0 | 153 | 32.7 | 5,712 | 960,912 |
| 2 | 65.7 / 216.7 | 98 | 45.8 | 5,712 | 960,912 |
| 3 | 217.6 / 250.9 | 45 | 204.8 | 5,711 | 960,912 |

Forced completion: median 43.9, p95 249.1 ms.
**Render CPU tracks frame time closely:** the frame is mostly the `renderer.render` call. (The trace, S0.T, is what names the rest.)

### S0.2 — all coverage polygons visible vs hidden, A–B–A–B then B–A–B–A (10:40:12–10:42:30)

| Order | Visible: frame med / p95 (render CPU med) | Hidden: frame med / p95 (render CPU med) |
|---|---|---|
| A–B–A–B | 216.6 / 250 (195.0) · 216.1 / 250 (196.6) | 16.7 / 17.6 (4.8) · 16.7 / 17.6 (4.2) |
| B–A–B–A | 199.3 / 250 (181.4) · 183.4 / 216.6 (176.4) | 16.7 / 17.7 (4.9) · 16.7 / 17.6 (4.2) |

- Draw calls 5,711 visible → **22** hidden. Triangles 960,912 → 933,600: the polygons are **2.8 % of the triangles and 99.6 % of the draw calls**.
- Hidden windows ran at the display's own rate (16.7 ms, 567–595 frames per 10 s).
- **Forced completion** (separate block, same orders): visible 38.0, 212.9, 219.0, 38.6 ms; hidden 9.9, 4.1, 13.4, 10.7 ms.
- No window flagged; every restore confirmed.
- **Paired effect ~170–200 ms per frame, against a visible-baseline spread of 183–217 ms (fast windows aside): far outside the spread in both orders.** No repeat needed under the decision rule.

### S0.3 — caps vs outlines, each against all-visible, both orders (10:42:39–10:48:47)

**Caps (cell fills) hidden** — first block mostly in the slow state, one window flagged (a refresh at 10:43:16 replaced the polygons mid-window, so the hide missed the new objects). Rerun 10:47:20–10:48:47:

| | Visible | Caps hidden |
|---|---|---|
| Frame median, unflagged windows | 215.6, 216.6, 200.0 | 33.4, 33.8, 33.4 |
| Render CPU median | 193.9, 199.3, 184.5 | 25.9, 26.4, 24.3 |
| Draw calls | 5,711 / 5,746 | 1,160 / 1,167 |

Two rerun windows flagged (refresh at ~10:48:20; cell count rose, draw calls 5,711 → 5,746); not used. First-block forced completion: visible 38.7, 209.8, 45.4, 38.9; caps hidden 30.0, 32.7, 35.7, 31.4 ms.

**Outlines hidden** (10:44:55–10:46:20, both orders, all in the fast state):

| | Visible | Outlines hidden |
|---|---|---|
| Frame median / p95 | 33.3 / 33.5–34.4 (one 99.9 / 266.7 at block start) | 33.3 / 33.4–34.3 |
| Render CPU median | 32.0–32.2 | 28.8–28.9 |
| Draw calls | 5,712 | 4,574 |

Forced completion: visible 44.4, 43.8, 46.1, 227.6; outlines hidden 38.5, 38.2, 38.2, 39.4 ms.

**Reading:** each cap mesh costs ~4 draw calls (4,551 of 5,711) and is most of the cost; outlines cost ~1,138 draw calls and ~3 ms of render CPU. Hiding caps alone leaves 1,160 draw calls and a 33 ms frame; hiding both leaves 22 and a 16.7 ms frame.

### Two states, not a slope

With the polygons visible, frames sat in one of two states and switched between them: **~33 ms** (render CPU ~32 ms) or **~185–230 ms** (render CPU ~175–205 ms), with the same draw calls. The forced-completion block showed the same split (38–46 vs 210–228 ms). **No hidden-polygon window entered the slow state** in any block. What switches the state is not identified by Stage 0; the trace may show it. This is the "drift" seen on 11 Nov (rc §10, release §8).

### S0.4 — rings visible vs hidden, both orders (10:49:08–10:50:35)

Visible 200.0, 200.1, 200.0, 184.3 ms; rings hidden 200.0, 215.7, 200.0, 200.0 ms. Draw calls 5,746 → 5,728. **No effect** — the S0.2 result is not a general "hide anything" artefact. (Rings' animation kept running; this tests their draw cost only.)

### S0.5a — rebuilds through the page's own path (10:50:58–10:51:50)

Forest disturbance toggle, off → on × 20, each state applied before the next (aria-pressed checked, two frames + 400 ms).

| Cycle | Objects (no rings) | Polygon groups | `polygonsData` | Geometries | Cell keys | Snapshot IDs |
|---|---|---|---|---|---|---|
| 0 | 3,462 | 1,145 | 1,145 | 2,311 | same | same |
| 1 | 3,462 | 1,145 | 1,145 | 2,304 | same | same |
| 5 | 3,462 | 1,145 | 1,145 | 2,305 | same | same |
| 20 | 3,462 | 1,145 | 1,145 | 2,305 | same | same |

**No growth.** Geometry moves only with ring churn.

### S0.5b — setter-only, disposable tab (10:52:46), labelled setter-only

Fresh equivalent polygon objects passed to `ME.globe().polygonsData()` 20 times, each applied before the next. Before: 3,444 objects, 1,139 groups, 2,304 geometries. After 1 / 5 / 20: 3,444 / 1,139 each; geometries 2,299 / 2,299 / 2,294. **No retention.** Tab closed.

**Q3 answer so far:** the scene grew because the data grew (782 → 1,145 cells through the day, forest the largest), not because rebuilds leave objects behind. **C2 (stable data) has no case.** S0.6 (natural refresh) below.

### S0.7 — real canvas hover and click (10:53–10:55)

Each case centred with `ME.pointView(lat, lng)` (altitude 2), then a real hover and a real click at the canvas point of the target (735, 343 CSS px). Tap → painted inspector = canvas `pointerdown` to the inspector's first DOM change plus two animation frames.

| # | Case | Cell(s) and layers | Hover winner | Click winner | Tap → paint (ms) |
|---|---|---|---|---|---|
| 0 | Overlap | 20_53 firms + forest | Fires | Fires | 768.3 |
| 1 | Overlap | 14_49 firms + ships | Fires | Fires | 432.4 |
| 2 | Overlap (3) | 15_52 firms + ships + forest | Fires | Fires | 380.4 |
| 3 | Overlap | 29_21 ships + forest | Ships | Ships | 408.2 |
| 4 | Overlap | 27_28 usgs + forest | Earthquakes | Earthquakes | 408.2 |
| 5 | Shared edge | 36_11 (usgs) │ 36_12 (ships), on the boundary | Earthquakes 36_11 (west) | Earthquakes 36_11 | 437.8 |
| 6 | Dateline | 17_89 firms + forest | Fires | Fires | 374.1 |
| 7 | Polar (72° N) | 40_61 firms | Fires | Fires | 397.9 |
| 8 | Fire point over its cell | point −33.284, 21.884 in 14_50 (firms) | Fires cell | Fires cell 14_50 | 413.0 |
| 9 | Open globe | 18_2 (no cell) | none | "Everything here · cell 18_2" | 435.0 |
| 0′ | after Forest off → on | 20_53 | Fires | Fires | 515.8 |
| 2′ | after Forest off → on | 15_52 | Fires | Fires | 488.7 |
| 5′ | after Forest off → on | edge 36_11 │ 36_12 | Earthquakes 36_11 | Earthquakes 36_11 | 684.3 |

- **Observed precedence where cells overlap:** Earthquakes > Fires > Ships > Forest; hover and click always agreed.
- **On a shared edge** the west cell won.
- **Points are not separately pickable** (merged): a click on a fire dot opens its cell.
- **Tap → painted inspector:** 374–768 ms, median 432 ms over the 13 taps. Target ≤ 200 ms.
- Repeat after a refresh: below (S0.6).

## 4. Still to record

- S0.6 natural refresh, 30-min dwell (started 10:55:50 UTC) and the repeated S0.1.
- S0.7 repeat after a refresh.
- S0.T Chrome Performance trace (Chad starts/stops).
- Evidence JSON (one file saved from the tab, with Chad's permission).
