# nav-tabs-rc — round 2 (after GPT's review of `dbb6057`)

2026-11-13 · branch `nav-tabs-rc` @ `f9445e3` (+ this packet) · page only · not merged

## GPT's finding

Keep the UTC label visible. At 721–900 px the candidate hid the label while the clock still showed UTC.
Hide the promise line where space is tight, keep it at 11 px where it fits, cover both sides of the
breakpoint with real and fallback fonts.

## What changed

- The clock's "UTC" label is never hidden. (721–900 px: clock 17 px, label kept.)
- The promise line is 11 px wherever it is shown. Below 1140 px it is hidden; it is never shrunk or cut.
- Found while scanning: with fallback fonts and four tabs the promise was also cut at 1201–1249 px
  (the old test only sampled 1200 and 1280). The tighter header rule (title 20 px, tabs 13 px) now
  runs to 1279 px.
- Stylesheet version `202612041200` on all five pages.

Breakpoints now: ≤720 phone layout (unchanged) · 721–1139 promise hidden · 721–1279 tighter title and tabs ·
721–900 smaller clock and Menu padding.

## Evidence

- Scan of **every width from 721 to 1300 px**, real and fallback fonts, on all five pages: no sideways
  overflow, Menu on screen, UTC label visible, promise never cut, promise shown from 1140 px.
- `phase1/desktop-overflow.test.cjs` now samples 721, 760, 900, 901, 1101, 1139, 1140, 1150, 1186, 1200,
  1279, 1280, 1366, 1440, 1920 with both font sets: 258 of 258. New checks: promise hidden below 1140;
  shown in full at 11 px from 1140; UTC label shown and clear of the Menu button.
- Breaks, each fails the test: breakpoint moved to 1100 (4 failures); label hidden at 721–900 (6);
  promise at 10 px (18).
- Full regression at `f9445e3`: 14:48:29–15:17:49 UTC, 57 files run (4 manual skipped), 57 pass.
  `timeline-ui` 591/591 · `mobile-pass` 131/131.

## Not checked

Real phone, Safari, screen reader.

## Release line (Chad)

`Approve: push nav-tabs-rc to main (page change: Moon and Sun header tabs and menu entries)`
