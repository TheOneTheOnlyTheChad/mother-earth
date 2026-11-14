# LRO's dated path on the Moon globe — candidate `moon-lro-path-rc` (14 Nov 2026)

Written 14 Nov 2026 17:06 UTC (clock reading) by Claude. **Branch only; nothing merged or deployed. Page only: no hub, R2 or D1 change.**
Proposal: `docs/concepts/MOON-LRO-DATED-PATH-PROPOSAL.md` rev 2 (GPT; on main at `0d2bb9e` with Claude's review).
Chad's line: "Go: build moon-lro-path-rc on a branch per MOON-LRO-DATED-PATH-PROPOSAL rev 2 (keep both rotation checks; if Horizons
can't supply a usable Moon-fixed comparison, bring it back to Chad before release; page only; no merge)".

**Horizons supplied a usable, identified Moon-fixed comparison** (§3.2), so nothing has to come back to Chad on that point.

## 1. What a visitor sees
- The Moon globe opens as before. A new button, **Show LRO's dated path**, sits with the globe controls; off by default.
- When on: one flight path (the drawing's window: 120 one-minute samples either side of the selected minute, clipped at the ends)
  and one enlarged marker labelled "LRO", both at their calculated altitude above the 1,737.4 km sphere and hidden by the Moon
  when behind it. Readout: "Dated LRO example · 10–11 June 2026 UTC"; "Calculated from NASA/GSFC's definitive trajectory · 10 Jun
  12:00 UTC · change the time"; "83.5 km above the reference sphere"; the window's UTC bounds; "At this time LRO is behind the
  Moon from this view" when it is; and the explanation (flight path above a spherical Moon, not a ground track; marker enlarged;
  Moon orientation: JPL DE440 via NAIF).
- **Time:** the spacecraft drawing below stays the only time control (`craft.js` now announces its selected sample and window;
  the globe follows). "change the time" moves focus to the drawing's time slider. The view direction is not moved when the time
  changes.
- **Unsupported time** (off-grid, out of range, invalid, current): nothing on the globe; "No dated position on the globe for this
  time", with a link to the drawing's "View a dated example". The requested `?t=` stays in the address until the visitor chooses
  the example.
- **Failures:** the overlay's file missing or altered → "Dated path unavailable on the globe — …"; the globe and drawing keep
  working. No globe library or no WebGL → the existing "Moon globe unavailable", the drawing remains the fallback.
- Screenshots (headless Chrome, SwiftShader): `reviews/evidence/moon-lro-path/lro-default.png`, `lro-facing.png` (view on the
  marker), `lro-limb.png` (view 90° from the marker: path drawn above the limb).

## 2. Catalogue and transform
- `phase1/skycraft/build_moonfixed.py` → `assets/moon/craft-moon-me-2026-06-R1.json` (39,267 B, sha256 `d62fb271…afb9`, pinned in
  `moonglobe.js`), `phase1/skycraft/BUILD-moonfixed.json`, `phase1/skycraft/checks/moonfixed-checks.json`. `--check` rebuilds byte
  for byte. The R1 file and its generator are unchanged (`build_examples.py --check` ok).
- The 1,441 native states are read from the segment already pinned for R1 (unrounded), each rotated once at its own SPK epoch
  (TDB) with `pxform('J2000', 'MOON_ME_DE440_ME421', et)`. SpiceyPy 8.0.0, CSPICE N0067 (checked at run time).
- Kernels, as pinned in rev 2: `moon_de440_250416.tf` (whole), `naif0012.tls` (whole), `moon_pa_de440_200625.bpc` (**three verbatim
  byte ranges, not the whole 12.9 MB file — deviation, §5**).
- Radius kept to within 1 mm (worst 0.0000000002 km). Lowest sample 64.851 km; **lowest chord 64.177 km** (GPT's 64.18 confirmed),
  with each chord's endpoints rotated at their own epochs. Straight segments between native samples; no densification.

## 3. Evidence before release (rev 2's table)
### 3.1 Independent rotation — PASS
DE440 libration angles evaluated from `ascp01950.440` record 874 by our own Chebyshev code, 3-1-3 Euler rotation and the 31009
fixed offset with our own matrices; no SPICE. Nine samples: the five proposal epochs, the northernmost (617) and southernmost (675)
samples, two seam crossings (97, 214). **Worst: 0.0000071° between matrices, 0.00023 km per position** (ceilings 0.001°, 0.05 km).
Matrices, inputs and residuals in `checks/moonfixed-checks.json`.
- The direction of the fixed PA → ME offset: read as SPICE's TKFRAME convention (the matrix maps the defined frame to the relative
  frame; PA → ME is its transpose). The opposite reading misses by 0.058° and fails; leaving the offset out misses by 0.029°.

### 3.2 External Moon-fixed comparison — PASS
Horizons, target 301 from `500@-85`, quantity 14, five epochs. Header: "Target pole/equ : MOON_ME {East-longitude positive}";
radii 1737.4 × 3. Horizons applies down-leg light time. With the same correction (Moon centre at t − lt, both bodies referenced to
the solar-system barycentre; Moon's velocity from a second Horizons request), **worst separation 0.0000016°** (ceiling 0.01°).
Without it the residual is 0.004–0.0055°, which is the light-time effect, not a frame difference: aberration is not applied by
Horizons here (adding it moves the residual back to 0.004–0.005°). Horizons' Moon source is DE441; the comparison shows its MOON_ME
and our DE440 ME421 frame agree at this level.
- **Honest limit:** the 0.01° ceiling on its own would also pass a build without the light-time correction (0.0055°). The evidence
  is the recorded per-epoch agreement, not the ceiling.

### 3.3 Texture alignment — PASS (rendered globe)
Six Gazetteer fixtures already pinned in `moon-globe.test.cjs` (Tycho, Mare Crisium, Mare Imbrium, Mare Orientale, Mare
Moscoviense, Tsiolkovskiy; Copernicus is not among them). For each: the view faces the feature; a fiducial is placed **through the
path's own conversion** at the feature's coordinates; paired frames with and without it give the fiducial's centre; the drawn
feature is located by matching the frame against the pinned texture as globe.gl maps it (normalised cross-correlation, ±25 px).
**Offset 0.061° for all six** (≈0.7 px, the pixel grid; correlation 0.94–0.98; ceiling 1°). Longitude sign flip, 180° offset and
latitude flip all fail. Synthetic cardinal axes, seam and 85° latitude pass.
- This checks that the path and the map share one convention on the drawn globe. That the map's coordinates are right rests on the
  existing file-level Gazetteer test (unchanged, passing). SVS's upstream projection documentation was not re-read for this build.

### 3.4 Interaction and failure — PASS
`phase1/moon-lro-path.test.cjs`: **61 passed, 0 failed.** Off by default; toggle; readout; the diagram's minute and window; rendered
vertex radii equal the catalogue radii (worst < 0.001 globe units; 241 vertices = no interpolation); every rendered segment clears
the sphere; marker at its altitude; Next / Previous / slider keyboard; both endpoints (0–120, 1320–1440); four unsupported times
and a current time; back to the example; an ended selection clears at once; occlusion (marker pixel hidden from the far side; the
words say so); limb view (marker outside the disc); missing file; altered file; no library; no WebGL; Space toggles; resize to
390 px keeps it; no page errors.

### 3.5 Breaks (each must fail)
- Page (`BREAK=`): lngsign 12 failed · lng180 15 · latflip 14 · alt0 2 · nowindow 4 · stale 3 · nosha 1 · keepold 1. **All eight fail as they must.**
- Build (`test_moonfixed_breaks.py`, 6 of 6 caught): offset reversed; offset left out; SPICE asked for PA; libration from the
  wrong 8-day block; Horizons without light time (ceiling tightened to show it matters); every state a minute late.

### 3.6 Regressions run
moon-globe 67/0 (one wording assertion updated to the new caption) · skycraft-ui 77/0 · sun-globe 103/0 · desktop-overflow 258/0 ·
mobile-pass 131/0 · sky-zoom-ui 351/0 · `build_examples.py --check` ok. **Not run:** the full regression (61 files).

## 4. Files
`moonglobe.js` (overlay), `craft.js` (announces the selection; nothing else changed), `moon.html` (button, readout, caption,
Sources line; `?v=202612071000`), `sources.html` (Moon globe section: what is shown and the checks), `style.css` (overlay styles;
`?v` bumped on all five pages), `assets/moon/craft-moon-me-2026-06-R1.json`, `phase1/skycraft/build_moonfixed.py`,
`BUILD-moonfixed.json`, `checks/moonfixed-checks.json`, `test_moonfixed_breaks.py`, `raw/` (kernels, byte ranges, DE440 header
and record, two Horizons answers), `phase1/moon-lro-path.test.cjs`, `phase1/moon-globe.test.cjs` (one assertion).

## 5. Deviations from rev 2, for GPT
1. **The orientation PCK is kept as three byte ranges, not the whole file.** The 12.9 MB file could only reach the workspace
   through the browser pane at about 190 KB per call. The full file was hashed in the pane (`60cd55aa…783f`, matching its NAIF
   listing size); the three ranges were hashed there and on arrival; the build fills every other byte with 0xFF so any read
   outside them is NaN and stops the build (tested: a July date gives NaN). Anyone can rebuild with the full file instead by
   placing it at the reassembled path; the outputs must be identical.
2. **The Horizons comparison needed the light-time model spelled out** (§3.2). Rev 2 anticipated "documenting any … apparent-time
   corrections"; this is that.
3. Seam and polar samples were chosen by the data (first two seam crossings; northernmost and southernmost samples).

## 6. Not done / open
- **REGISTER entries are drafted, not filed:** `reviews/2026-11-14-moon-lro-path-register-draft.md` (NAIF kernels; DE440 ASCII;
  Horizons extension; the derived catalogue). Rev 2 asks for them before page release. Filing needs Chad's line.
- No real-graphics check yet (Mac browser pane needs Chad to serve a `_review/` copy). No phone, Safari or screen-reader check.
- Full regression not run.
- Merge needs Chad's own Approve line after GPT's review.
