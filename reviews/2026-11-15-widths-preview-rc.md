# widths-preview-rc — PREVIEW for GPT and Chad (round 1)

15 Nov 2026 · branch `widths-preview-rc` from main `f655613` · **page only** · preview · no merge · hub untouched
Built on Chad's Go line. Spec: `docs/concepts/INTERMEDIATE-WIDTHS-PROPOSAL.md` rev 2, §6 governing.
**Not for release until Chad has looked at it on a real screen.** D can be dropped without touching A.

## 1. What changed

| File | Change |
|---|---|
| `style.css` | Two blocks at the end, both scoped to `body.world` (World View only). |
| `index.html` | The script that makes the phone copy of the credits now puts it at the end of the right-hand column (was: end of the sheet). On a phone that is the same place. Its label drops "(phone)". Stylesheet key `style.css?v=202612081000`. |
| `phase1/widths-preview-ui.test.cjs` | New suite, 163 checks, 6 breaks. |

`app.js`, `sources.html` and every other page are untouched. Their stylesheet keys are unchanged; the new rules cannot match them.

## 2. A — 721–1100 px wide, on screens at least 660 px tall

- The header and the globe stay at the top. The picture date, legend, credits and cards scroll beneath them.
- Globe height `clamp(300px, 46vh, 560px)`, so it follows the viewport height.
- A control reached by keyboard is kept clear of the pinned area (`scroll-padding-top`).
- The place panel and the zoom-out view's overlay are pinned to the globe's rectangle.

Measured (real fonts):

| Viewport | Globe on main | Globe pinned | Page room under header + globe | Globe on screen at the buoys switch: main → preview |
|---|---|---|---|---|
| 768 × 1024 | 573 | 471 | 497 | 0 → 471 |
| 820 × 1180 | 661 | 543 | 581 | 0 → 543 |
| 1024 × 768 | 430 | 353 | 359 | 0 → 353 |
| 1100 × 800 | 448 | 368 | 376 | 0 → 368 |

**The cost:** the globe is 77–118 px shorter than on main, because 46% of the height is pinned where 56% used to scroll.

**Screens under 660 px tall are left exactly as on main** (globe scrolls away). Found by `mobile-pass`: a phone held sideways is 780–932 px wide and 360–430 px tall, which is inside the width range; a pinned header and globe left 4 px for the page there. An iPad held sideways shows about 700 px in Safari, so it is pinned. 660 is the lowest height at which both the globe and the page beneath keep 300 px.

## 3. D — 1101–1279 px wide

- The credits block under the globe is hidden; the copy at the foot of the right-hand column is shown. Exactly one credits block at every width, same text.

| Viewport | Globe on main | Globe in preview | Gain |
|---|---|---|---|
| 1101 × 800 | 525 | 744 | +219 |
| 1180 × 820 | 575 | 764 | +189 |
| 1279 × 720 | 504 | 664 | +160 |

**The cost, and it is a real one:** the credits are no longer on screen when the page opens. They are the last item of the right-hand column, about 2,550–2,650 px of scrolling down that column (column 664–764 px tall, content 3,325 px). On main they are always on screen at these widths. In the 284 px column the block is about 480 px tall, so keeping it pinned there is not an option. GPT's condition was "without making the credits hard to find"; by that test D as built is doubtful. This is the same position the credits have on a phone today.

## 4. Checks (rev 2 §6)

`widths-preview-ui`: **163 passed, 0 failed.** "Main" is `git show main:` of `index.html` and `style.css`, measured in the same run.

| Check | Result |
|---|---|
| A, each of 6 switches at 4 sizes | Scrolled to, fully on screen under the globe and not covered; a real mouse click changes the switch and what is drawn; header and globe still pinned with ≥ 300 px of globe on screen. |
| A, keyboard | Tab forwards and Shift+Tab backwards through every control in the cards at each size: none is ever under the header or globe. |
| A, touch | A finger drag starting below the globe scrolls the page; a second drag scrolls further with the globe still pinned. |
| A, place panel | Opened with the page scrolled to the last switch: inside the globe's box. |
| A, zoom-out overlay | Its box equals the globe's drawing area (CSS box only; see §6). |
| A, height edge | 1024 × 660 pinned with 300 px each for globe and page. 780 × 360, 844 × 390, 932 × 430, 1024 × 600, 1100 × 659: identical to main. |
| D | Gain ≥ 150 px at 3 sizes; one credits block, in the right column, main's text; fully visible at the column's end; header and columns where main has them. |
| Outside the ranges | 390 × 844, 720 × 900, 1280 × 800, 1440 × 900: header, globe, legend, columns and credits exactly where main has them. |
| Edges | 721, 1100, 1101, 1279 px: one credits block, no sideways scroll. |

Breaks, each fails: `no-sticky` 49 · `header-scrolls` 41 · `no-scroll-padding` 8 · `both-credits` 8 · `no-move` 8 · `short-screens` 5.

Regression: §7.

## 5. Things to look at on a real screen (Chad)

1. Is the pinned globe big enough at your tablet / narrow-window size, and is there enough room for the cards under it?
2. When a layer is switched, the legend above the cards changes height and the cards move by one line (16–17 px measured). It happens on main too, but with the globe pinned you are looking at the cards when it happens.
3. A drag that starts on the globe turns the globe and does not scroll the page (as on main). With the globe pinned, about half of every screen is globe.
4. D: with the credits gone from under the globe, are they findable enough at the foot of the right-hand column?

## 6. Not done, not claimed

- The globe did not draw in my screenshots (software rendering, imagery blocked in the test), so they show layout only. They are not in the repo; Chad has them in the chat.
- Not tested on a real tablet, Safari, a real touch screen or a screen reader. Touch is Chrome's emulation.
- The zoom-out view was not opened at these widths; only its overlay box was measured. `sky-zoom-ui` runs at 1280 and 390 px.
- On main the zoom-out overlay at tablet widths spans the globe, legend and credits together. In the preview it covers the globe only.

## 7. Regression

All pass: `mobile-pass` 131, `desktop-overflow` 258, `ux-round1` 34, `sky-zoom-ui` 351, `sky-ui` 79, `legend-active-ui` 548, `place-ui` 30, `search-ui` 104, `kept-ui` 21, `drifters-ui` 25, `plastic-ui` 29, `buoy-temp-ui` 33, `fire-status-ui` 279, `quakes-ships-status-ui` 124, `freshness-wording-ui` 156, `fires-wording-ui` 35, `cell-perf-ui` 43, `status-notes-ui` 17, `terminator-ui` 19, `dustrgb-ui` 67, `backdrop-layer` 27, `orbital-browser` 113, `arts-ui` 90, `skycraft-ui` 77, `timeline-changes-ui` 173. The two failures identical on main remain: `osmc-reliability-ui` "old page: no page errors" (40 of 41), `smoke-fixes` "Sources 360: no page-level horizontal overflow" (51 of 52).

sha256: `index.html` `ea827cd4…7365`, `style.css` `d2b1538d…6249`.
