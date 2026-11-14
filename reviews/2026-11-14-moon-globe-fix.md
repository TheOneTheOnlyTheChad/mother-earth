# moon-globe-fix — instant buttons; zoom inside the box

2026-11-14 · branch `moon-globe-fix` @ `5cb3832` (+ this packet) · from main `0ef7937` · page only · not merged

## 1. The glide (defect found after the Moon release)

Near side and Far side used a 0.6 s glide. A direction button pressed during it was ignored, and the suite ran
only with reduced motion, so the glide had no test.

Fix (GPT's choice): **every button moves the view at once.** No animation anywhere in `moonglobe.js`; the
reduced-motion branch is gone because there is nothing left to reduce. The readout is written in the same call.

Tests, with motion allowed (`reducedMotion: 'no-preference'`, checked in the page):
- Far side then North in the same task: readout "15°N 180° · far side" immediately; the globe's own view is lat 15, lon ±180; both unchanged 1.2 s later.
- Real clicks in quick succession, Far → North → Near → East: ends at 0° 15°E, readout and view agree.

## 2. Zoom (Chad: "when you zoom in on the moon … the box zooms with it")

Cause: zoom was switched off on the globe, so a pinch zoomed the whole page.

Change:
- Pinch (touch, or a trackpad pinch, which arrives as ctrl+wheel) and two new buttons, **Zoom in** / **Zoom out**, move the camera. The Moon grows inside its box; the box does not move or resize.
- Range: from the whole Moon (altitude 2.2 desktop, 2.6 phone) down to altitude 0.5. Buttons step ×0.75.
- **A plain mouse wheel over the globe still scrolls the page** (a capture listener keeps it from the globe). Otherwise the globe would trap page scrolling on desktop.
- Turning and Near/Far keep the current zoom.
- One new line on the page: how to zoom, and that the map holds about 5 km to a pixel at the equator (2π × 1,737.4 km ÷ 2,048 px = 5.33 km), so it blurs up close.

Tests: Zoom in to 1.65; turning keeps it; stops at 0.5; box size and position unchanged while a corner that was
background now shows the Moon; no sideways overflow; Zoom out stops at 2.2; plain wheel scrolls the page and leaves
the zoom alone; ctrl+wheel zooms the globe and does not scroll the page.

## Files

`moonglobe.js`, `moon.html` (two buttons, one line, script version `202612051000`), `phase1/moon-globe.test.cjs`. No CSS change.

## Results

- `moon-globe`: 67 of 67.
- Breaks, each fails: `glide` (16), `zoomreset` (1), `wheel` (1), and the earlier seven: `lit` (1), `far` (4), `sign` (7), `mirror` (8), `flip` (8), `wait` (3), `late` (1).
- Full regression at `5cb3832`: 03:25:41–03:53:27 UTC, 58 files run (4 manual skipped), 58 pass.
- I looked at a zoomed-in render (four presses of Zoom in): the Moon fills the box, the box and the page are unchanged, the surface is soft as the page says.

## Not checked

- **Two-finger pinch on a real touch screen.** The test covers ctrl+wheel and the buttons only. On a phone the box has `touch-action: none`, so a pinch that starts on the globe should go to the globe, not the page; not verified on a device.
- Real phone scrolling and frame rate, Safari, screen reader.
- Whether a trackpad pinch in Safari arrives as ctrl+wheel (it does in Chrome; Safari uses gesture events). If not, Safari users get page zoom as before and the buttons still work.

## For review

1. Closest zoom 0.5: enough, or too soft to be worth it?
2. Plain wheel scrolls the page rather than zooming the globe. Agree?

## Release line (Chad)

`Approve: push moon-globe-fix to main (page change: Moon globe instant buttons and zoom inside the box)`
