# nav-tabs-rc — Moon and Sun header tabs

2026-11-13 · branch `nav-tabs-rc` · page only · no hub change · not merged

## What changes

- Header tabs on all five pages: Earth now · Timeline · **Moon** · **Sun** (was two). Own page marked `aria-current="page"`.
- Menu list gains Moon and Sun before Sources.
- `style.css` (version `202612041100` on all five pages):
  - 721–1200 px: tabs tighter (13 px, 6 px padding), title 20 px, promise line 10 px (was 11 px), gap 8 px.
  - 721–900 px: tighter again; the clock's "UTC" label is hidden; Menu button padding 10 px.
  - ≤420 px: tabs 13 px with 4 px padding.
- `phase1/timeline-ui.test.cjs`: tab checks now expect four tabs and the new menu order; the loop covers `moon.html` and `sun.html`.

7 files, 31 insertions, 9 deletions against main `b85b69e`.

## Found and fixed on the way

First full run (commit `77d3e3a`) failed `desktop-overflow` 3 of 112: with fallback fonts at 1101, 1150 and 1186 px the
promise line no longer fitted its two lines beside four tabs. Fixed in `d002f67` by the 721–1200 px rule above.
Cost: the promise line is 1 px smaller in that width range, and the title 20 px. Wording unchanged.

## Tests

Full regression at `d002f67`: 11:10:08–11:38:13 UTC, 57 files run (4 manual skipped), 57 pass.
`desktop-overflow` 112/112 · `timeline-ui` 591/591 · `mobile-pass` 131/131 · `skycraft-ui` 77/77.
Header measured without sideways overflow at 360, 721, 760, 800, 901, 1100, 1280 px (fallback fonts, at `77d3e3a`).

## Not checked

Real phone, Safari, screen reader. Real webfonts at 721–900 px were not measured separately (the overflow test covers 1101 px and up with both font sets).

## For review

1. Is a 10 px promise line between 721 and 1200 px acceptable, or should the promise be hidden below a wider breakpoint instead?
2. Hiding the "UTC" label on the clock between 721 and 900 px.

## Release line (Chad)

`Approve: push nav-tabs-rc to main (page change: Moon and Sun header tabs and menu entries)`
