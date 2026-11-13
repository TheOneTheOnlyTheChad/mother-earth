# moon-globe-rc — round 2 (after GPT's review of `13704c5`)

2026-11-13 · branch `moon-globe-rc` @ `ca61299` (+ this packet) · page only · not merged

## GPT's findings and what was done

1. **A stalled CDN held up the spacecraft drawing.** Fixed. The page no longer has a library tag at all:
   `craft.js` runs first, and `moonglobe.js` loads globe.gl itself (async) with a **12-second limit**.
   On error or at the limit the panel says "Moon globe unavailable" with the reason; a library that
   arrives after the limit is ignored (no half-started globe).
2. **Keyboard: native buttons.** `role="application"`, the tab stop on the globe box and the arrow-key
   handler are gone. The box is `role="img"` named "Globe of the Moon". Buttons: Near side, Far side,
   West, East, North, South (15° a press; stops at 85° latitude). All six are ordinary tab stops.
3. **Brightness:** unchanged, as ruled.
4. **Size:** 2.2 desktop / 2.6 phone kept. On phones (≤720 px) the globe box is at most 82% of the window
   width, leaving a strip each side to scroll the page past it. A swipe that starts on the globe still
   turns it. **Needs a real-phone check** (not possible here).
5. **Wording:** "far side" and "near side" only. "(never faces Earth)" and "(faces Earth)" removed.
6. **Landmarks:** the test and this packet now use the Gazetteer centres. I read all seven pages on
   planetarynames.wr.usgs.gov on 13 Nov 2026 (features 6108, 3685, 3682, 3671, 3678, 6163, Mare Nubium);
   they match the values GPT supplied. Convention: planetographic, +East, ±180.

| Feature (Gazetteer centre) | at feature | comparison | rules out |
|---|---|---|---|
| Tsiolkovskiy 20.38°S 128.97°E | 162 | 193 at 128.97°W | east/west mirror |
| Mare Orientale 19.87°S 94.67°W | 157 | 194 at 94.67°E | east/west mirror |
| Mare Moscoviense 27.28°N 148.12°E | 140 | 222 at 148.12°W | east/west mirror |
| Mare Crisium 16.18°N 59.10°E | 132 | 181 at 100°E | — |
| Mare Imbrium 34.72°N 14.91°W | 135 | 200 at 34.72°S | north/south flip |
| Tycho 43.30°S 11.22°W | 231 | 138 Mare Nubium 20.59°S 17.29°W | north/south flip |

Mean brightness 0–255 on the pinned file; margin required 15. Sampling radii are ours, not the Gazetteer's.

## Tests

- `moon-globe`: 51 of 51. New: with the library request held open, the spacecraft section finishes
  loading while the globe still says "loading…"; the globe gives up at about 12 s and says why; a library
  arriving at 14 s does not start a globe; no blocking library tag; six buttons, tab order, Enter;
  pole stop; phone side strips ≥ 30 px.
- Breaks, each fails: `lit` (1), `far` (1), `sign` (6), `mirror` (8), `flip` (8), `wait` — no limit (3),
  `late` — late library starts a globe (1).
- Full regression at `ca61299`: 18:29:47–18:59:59 UTC, 58 files run (4 manual skipped), 58 pass.

## Not checked

Real phone (scrolling past the globe, frame rate), Safari, screen reader. Rendering only under software WebGL.
NASA's general media guidelines still read only as a search excerpt; to be read directly before the REGISTER line.

## Also

Proposal is rev 2.3: one rule for a bad replacement picture — a valid picture stays on screen and expires
on its own clock; "No recent picture" only when none remains (section 3.2).

## Order from here

1. GPT review.
2. REGISTER wording for the NASA SVS map shown to Chad, then `Approve: file the REGISTER entry for the NASA SVS CGI Moon Kit colour map`.
3. `Approve: push moon-globe-rc to main (page change: Moon globe on the Moon page)` — after `nav-tabs-rc` is merged.
