# moon-globe-rc — the Moon as a real, spinnable globe

2026-11-13 · branch `moon-globe-rc` (built on `nav-tabs-rc` @ `d48faa6`) · page only · no hub change · not merged
Built to `docs/concepts/MOON-SUN-GLOBES-PROPOSAL.md` rev 2.1, section 3.1 (the proposal is now rev 2.2; the change is Sun-only).

## What it is

A new panel at the top of `moon.html`, above the spacecraft drawing:

- The Moon on the same globe engine as the Earth page (globe.gl 2.45.0), with NASA's colour map.
- Evenly lit (ambient light only). Opens on the near side, centre 0° 0°.
- Turn it by dragging, with the arrow keys (10° a press), or with **Near side** / **Far side** buttons.
- A readout under it: "Centre of view: 10°N 20°E · near side (faces Earth)".
- Zoom and pan are off. No auto-rotation.
- Not on the globe: the spacecraft, sunlight, time. The LRO drawing below is unchanged and the page says the two are separate views.

Words on the page: not how the Moon is lit today; map tuned for looks, not measurement; filled from a
lower-resolution map poleward of 70°; drawn to fill the view, sizes not comparable between pages.

## Files

- `moonglobe.js` (new, self-contained)
- `moon.html` (panel, two script tags, one source line), `style.css` (six rules), stylesheet version `202612041300` on all five pages
- `assets/moon/lroc_color_2k.jpg` — NASA SVS file, **unchanged**: 457,942 bytes, 2048×1024,
  sha256 `f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170`, source Last-Modified 3 Dec 2025,
  fetched 2026-11-13 17:26:55 UTC through the browser pane. Record in `assets/moon/SOURCE.json`.
- `phase1/moon-globe.test.cjs` (new)

The elevation (relief) map is **not** used: with even lighting it would change nothing visible.

## Orientation check (the source page does not state east/west)

1. **The globe shows the point it says it shows.** A synthetic map with coloured patches at five known
   places; for each, the view is pointed there and the centre pixel of the rendered globe is read. All five match.
2. **The real map puts named features at their published coordinates.** Mean brightness (0–255) at the
   feature against a comparison point:

| Feature (lat, east lon) | at feature | comparison | what it rules out |
|---|---|---|---|
| Tsiolkovskiy (20.4°S, 129.1°E) | 162 | 193 at 129.1°W | east/west mirror |
| Mare Orientale (19.4°S, 92.8°W) | 152 | 187 at 92.8°E | east/west mirror |
| Mare Moscoviense (27.3°N, 147.9°E) | 141 | 221 at 147.9°W | east/west mirror |
| Mare Crisium (17.0°N, 59.1°E) | 133 | 180 at 100°E | — |
| Mare Imbrium (32.8°N, 15.6°W) | 134 | 189 at 32.8°S | north/south flip |
| Tycho (43.3°S, 11.4°W) | 230 | 138 Mare Nubium | north/south flip |

Each test needs a margin of 15. Coordinates are feature centres as I know them from the IAU nomenclature;
**they were not re-read from the Gazetteer in this session** — a point for review.
I also looked at the rendered near and far sides: the near side is the familiar face (Tycho low, Crisium right).

## Tests

- `moon-globe`: 39 of 39. Covers start state, lighting (ambient only; same brightness centre and edge),
  the five map points, buttons, arrow keys, drag, east/west/near/far wording, phone width (390 px),
  no library, no map file, pinned file bytes, landmarks.
- Breaks, each fails: `lit` (1), `far` (1), `sign` (3), `mirror` (8), `flip` (8).
- Full regression at `00763f3`: 17:34:00–18:03:30 UTC, 58 files run (4 manual skipped), 58 pass.

## Not checked

- Real phone, Safari, screen reader. Rendering was checked only under software WebGL (SwiftShader).
- Frame rate and memory on a phone (one 2048×1024 texture; the Earth page's budget was not re-measured here).
- The page loads globe.gl from unpkg, as the Earth page does; if that is blocked the panel says so and the rest of the page works.
- NASA's general media guidelines have still only been read as a search excerpt. To be read directly before the REGISTER line.
- `sources.html` has no entry for this map yet; it goes in with the REGISTER entry.

## For review

1. `role="application"` on the globe box so arrow keys reach it. Acceptable, or prefer buttons only?
2. Brightness: ambient light at full strength; highlands read quite bright.
3. Globe size in its box (camera distance 2.2, as the Earth page).

## Order from here (proposal section 6)

1. GPT review of this branch.
2. `Approve: file the REGISTER entry for the NASA SVS CGI Moon Kit colour map` — before release. I will put the exact wording in front of Chad first.
3. `Approve: push moon-globe-rc to main (page change: Moon globe on the Moon page)` — after `nav-tabs-rc` is merged, since this branch sits on top of it.
