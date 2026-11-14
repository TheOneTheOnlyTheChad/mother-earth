# sunglobe-rc — the Sun as a globe carrying the hub's picture (page)

2026-11-14 · branch `sunglobe-rc` @ `e363b6b` (+ this packet) · built on `sunface-rc` (hub 0.6.14 source, already live) · **page not released**
Built to `docs/concepts/MOON-SUN-GLOBES-PROPOSAL.md` rev 2.3 §3.2 ("Projection", "Words on the page", age limit).

## What it is

A new panel at the top of `sun.html`, above the Parker Solar Probe drawing (which is unchanged):

- A globe (globe.gl 2.45.0, loaded by the script with a 12 s limit, as on the Moon page) carrying **the hub's current Sun picture**.
  The page reads `/snapshot/sunface/meta` and the image file from our hub. It never calls SDO (test: no such request).
- The picture is wrapped on the Earth-facing part of the sphere. Everything else is drawn plain with stripes, and the readout says
  **"outside this image's view"** there. Opens on the centre of the disc as seen from Earth.
- Controls as on the Moon: Earth-facing side, Far side, ◀ East, West ▶, North, South, Zoom in, Zoom out; drag; pinch / ctrl+wheel zoom; plain wheel scrolls the page.
- Words: "File updated at 14 Nov 2026, 07:00 UTC (1 h 1 min ago). Retrieved by our hub at 14 Nov 2026, 07:08 UTC. The file does not state when the Sun was observed."
  Never "observed at", "now" or "live".

Files: `sunglobe.js` (new), `sun.html` (panel, script tag, one source line), `sources.html` (new "Sun globe" section), `style.css` (one rule; version `202612051100` on all five pages), `phase1/sun-globe.test.cjs` (new), `reviews/2026-11-14-sunglobe-register-draft.md` (REGISTER draft, **not filed**).

## Projection (as built)

For a surface point at latitude `lat`, longitude `lon` (0 = centre of the disc as seen from Earth; positive = solar west, to the right):

    x =  cos(lat) sin(lon)
    y =  sin(lat) cos(B0) − cos(lat) cos(lon) sin(B0)
    z =  sin(lat) sin(B0) + cos(lat) cos(lon) cos(B0)          (z ≤ 0: far side)
    pixel = (cx + R·x, cy − R·y)

- **cx, cy, R are measured in each picture**: a circle fit (least squares) to the limb, found as the ends of the longest bright run in every second row and column; points more than 4 px off the first fit are dropped and the fit repeated. A picture is refused unless R is 35–50% of the width, the centre is within 6% of the middle, the residual is ≤ 1.5 px and ≥ 80% of the edge points were kept.
- **B0** (tilt of the Sun's axis toward Earth) is computed for the file-updated date (Meeus ch. 25 and 29, low-precision solar longitude). Values produced: 6 Mar 2026 −7.25°, 6 Jun −0.04°, 8 Sep +7.25°, 8 Dec −0.03°, 14 Nov +2.94°. B0 changes by at most about 0.13° a day, so using the file time instead of the unknown observation time does not matter here.
- **Mask:** nothing with z ≤ 0, and nothing beyond **0.97 of the radius** (about 76° from the centre of the disc), is taken from the picture. That removes the stretched limb, the sky and SDO's printed caption. The page says so.
- Texture is rebuilt for each picture as a 2048 × 1024 map (nearest pixel).

## Is solar north up in SDO's browse image? Checked once, by hand

On the real picture `20261114T070005Z-4bc25d7a146de6fd` (browser pane, 08:01 UTC): disc fit cx 511.52, cy 511.54, R 480.96 px, residual 0.25 px; B0 +2.97°.
Dark features were located in the picture and turned into heliographic positions with the inverse of the formulas above, then compared with
**NOAA SWPC Solar Region Summary No. 318** (issued 14 Nov 00:30 UTC; positions valid 13 Nov 24:00 UTC), moved about 3.7° west for some 6.7 hours of rotation:

| SWPC region | SRS position | expected at the picture | measured in the picture |
|---|---|---|---|
| 4575 | S09 E38 | 9°S, 34°E | 9.1°S, 35.5°E |
| 4574 | N16 E33 | 16°N, 29°E | 16.6°N, 28.5°E |
| 4577 | S07 E18 | 7°S, 14°E | two spots: 6.8°S 17.2°E and 7.1°S 13.1°E |
| 4572 | N11 E16 | 11°N, 12°E | 11.5°N, 12.9°E |
| 4578 | S12 W21 | 12°S, 25°W | 12.6°S, 20.6°W |
| 4576 | S18 W25 | 18°S, 29°W | two spots: 17.5°S 27.0°W and 18.0°S 31.7°W |

Six of the nine listed regions were found, each within about 1° of latitude and 4° of longitude of the summary (which gives whole degrees for a region, not a spot).
Not found: 4573 (smallest class), 4568 (S08 W53; below my detection size), 4566 (W80, in the limb band).
Northern regions come out north and eastern ones east, so the picture is north-up and not mirrored; latitude agreement at ±30° of longitude puts any roll error under about 1°.
**Limits:** one picture, one day; my detection thresholds were chosen by hand; the picture's observation time is not known (06:30–07:00 UTC assumed for the rotation allowance). This is a manual check, not an automated test.

## Age limit (as built)

- Shown only while `now − file_updated < age_limit_s` (10,800 s). `now` is the device clock corrected by the hub's clock, read with each pointer (`meta.now`). The hub may shorten the limit, never lengthen it.
- Evaluated: after every pointer read; every 15 s by timer; on `visibilitychange`, `pageshow` and `focus`. At the limit the picture is removed from the globe ("No recent picture", with the file time), **whether or not the hub answers**.
- A file time more than 60 s ahead of the corrected clock, or unusable, is not shown.
- The pointer is re-read every 10 minutes. A newer picture replaces the one on screen only if it loads, a disc is found, and its file time is later. A replacement that is missing or cannot be placed leaves the valid picture up until its own limit. The page never steps back to an older picture. If the current picture is unusable and the previous is still under three hours, the previous is shown with its own time.

## Tests

`phase1/sun-globe.test.cjs`: **94 of 94.** Real globe.gl under software WebGL; the hub's two routes are answered by the test; time is controlled with Playwright's clock.
- **Projection:** a synthetic picture is painted by the test's own forward formula with coloured spots at five known places, for 8 Sep 2026 (B0 +7.25°) and 6 Jun 2026 (B0 0°, values from almanacs, not from the code under test). The globe is pointed at each place and the centre pixel read. Also an off-centre, smaller disc.
- **Mask:** a picture with bright corner blocks, a caption and a bright ring just inside the limb; ten viewpoints; no pixel of that colour appears. 70° from centre is picture; 80° is plain; far side plain and striped.
- **Disc fit:** located within 1 px; a black picture and a square are refused with the reason shown.
- **Age:** one millisecond before three hours (hub silent) still shown; exactly three hours removed; an open tab removes it by its own timer; after a clock jump (sleep) it is removed on resume; device clock 5 h slow or fast does not change the answer; limit cannot be raised by the hub; future or unusable file times not shown.
- **Replacement:** missing file, no disc, hub failing, empty pointer, older pointer, with and without a previous picture.
- Controls, zoom, phone width, library stall (spacecraft section does not wait), no request to SDO, Sources section and credit.

**14 breaks, each fails:** `mirror` (10), `no-b0` (17), `flip` (13), `no-mask` (2), `no-limb` (2), `age-late` (4), `no-timer` (1), `no-resume` (1), `no-offset` (3), `step-back` (1), `bad-displaces` (5), `limit-raised` (1), `future-ok` (5), `observed` (3).

Full regression at `e363b6b`: 08:50:14–09:24:51 UTC, 60 files run (4 manual skipped), 60 pass.

## Seen with the real picture (branch files injected on the public site, hub live; 08:01 UTC)

The globe showed the 07:00 UTC picture: orange disc with the sunspot groups, "File updated at 14 Nov 2026, 07:00 UTC (1 h 1 min ago)…". Turned 75° west: the picture ends in a clean edge and the rest is the striped plain surface. Screenshot kept.
Hub since the schedule went on: runs at 07:07 and 08:07 UTC both `ok`, a new picture each time.

## Not checked / open

- Real phone, Safari, screen reader; frame rate and memory on a phone (a 2048 × 1024 texture is rebuilt per picture; about 0.1–0.3 s of work on a desktop, not measured on a phone).
- North-up was checked on one picture only (above). No automated alignment test exists.
- The correction from the hub clock lags by the network delay of the pointer read (tens of milliseconds): expiry can be that much late.
- If a visitor's tab cannot reach the hub at all, there is no clock correction and the device clock alone decides.
- Storage on the hub still grows by one ~200 KB picture per hour with no cleanup.

## For review

1. Mask at 0.97 of the radius (76°). Tighter or looser?
2. The plain side: dark grey with stripes and the words in the readout and the caption. Enough, or should the words also be drawn on the globe itself?
3. Using the hub's clock to correct the device clock for the age rule.
4. Button names "◀ East / West ▶" with the note "On the Sun, as on a sky map, east is to the left."

## Order from here (Chad's lines)

1. GPT review of this branch and of the REGISTER draft (`reviews/2026-11-14-sunglobe-register-draft.md`).
2. `Approve: file the REGISTER entry for the NASA SDO HMI continuum latest image`
3. `Approve: push sunglobe-rc to main (page change: Sun globe on the Sun page; hub 0.6.14 source reaches main)`

The push also brings the hub's 0.6.14 source to main, so main equals the live hub again.
