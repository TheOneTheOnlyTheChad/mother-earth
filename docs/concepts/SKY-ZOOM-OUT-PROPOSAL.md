# Sky zoom-out view (Earth → Moon → Sun) — proposal rev 2 (docs only)

- **Rev 1:** written 10 Nov 2026, 11:03 UTC clock reading (start of writing), commit `49678eb`.
- **Rev 2:** written from 11:26 UTC clock reading (start of writing), after GPT's review of rev 1 (relayed by Chad, 10 Nov).
- Built from GPT's brief (relayed by Chad), recorded in `docs/concepts/SKY-ZOOM-OUT-BRIEF.md`. **For GPT's focused recheck of §1, §3.6, §4, §7 and §11.**
- Nothing in this document is built, exported, uploaded, filed or deployed. Each later step needs its own approval (§13).
- Builds on `SKY-TWO-CLOCKS-PROPOSAL.md` rev 3 and the live card (main `a1c3ed6`, hub 0.6.5).

**Question the view answers:** where are the Moon and the Sun, relative to the Earth, at the card's sample instant, and how far away are they?

## Rev 2 changes (GPT's review of rev 1)
| # | Change | Where |
|---|---|---|
| 1 | **Scene file fits the Worker's existing envelope check** (`catalogue: "sky"`, pinned `catalogue_revision`, `coverage`, non-empty `bodies.moon.rows` / `bodies.sun.rows`). Per-body rows replace the flat per-date array. Both files are tested through the real Worker functions. Card and scene are pinned as a pair at every refresh. | §7 |
| 2 | **Framing measured, not assumed** [desk]. Full labels beside the bodies don't fit a phone. Short name tags plus a text strip do, on every date. The Sun's drawn distance changes **400 → 200 R⊕**. The camera direction swings between stops during the same gesture. | §4.3 |
| 3 | **Depth range:** the camera's near plane is raised while in the view. Otherwise the atmosphere and globe surfaces collide in the depth buffer at stop-C distances. | §4.4 |
| 4 | **Signed 3D direction check** against an independent expected vector. An antipode mutation must fail it. Screen collinearity alone is dropped. | §3.6, §11 |
| 5 | Scale wording adopted from GPT. "Direction exact" dropped. The Details text explains "true apparent size as seen from Earth's centre". "Calculated point directly beneath the Sun / Moon" replaces "overhead point". | §1, §4.2 |
| 6 | The **proposed method's** agreement is measured for **both bodies** against both references [desk], with a tolerance for each. The build repeats it on the generator's own output. | §3.3, §3.6 |
| 7 | **Entry (Z1a refined):** the view starts on the Earth already on screen. The same wheel / pinch then brings the Moon and, farther out, the Sun. The stop buttons jump directly. | §2 |
| 8 | Z4: time-dependent layers hidden; imagery date stays visible. Repeated entry/exit restores everything. A UTC rollover while open moves bodies, distances and date together. | §5 |
| 9 | **REGISTER:** proposed update to the Horizons entry (live distance use; proposed derived scene use), and a new ERFA entry with its BSD-3 notice. Text proposed for Chad's line, **not filed**. | §10.1 |
| 10 | Evidence status separates **zero new Horizons requests** (desk check) from the **external source text read**: ERFA files and licence via raw.githubusercontent. | §0 |
| 11 | Rev 1's "about 3 px Moon" was a guess. Measured at stop B it is **7.7–16 px** depending on canvas and date [desk]. | §4.2 |

## 0. Evidence status (read first)
Every number below carries one of these tags:
- **[desk]**: computed in this thread from **committed files only**: the raw Horizons exports `phase1/sky/raw/hz-moon-ut-20261110.txt` (sha256 `26d8c2b5…`) and `hz-sun-ut-20261110.txt` (`ce2aaea5…`). **The desk check made zero new requests to Horizons or any other data host.**
  - Scripts and outputs are in `docs/concepts/sky-zoom-out-desk-check/`:

    | Script | Writes |
    |---|---|
    | `desk.py` | `transform-agreement.json`, `subpoints.json` (full chain) |
    | `method.py` | `method-vs-full.json`, `method-subpoints.json` (proposed method) |
    | `cmp.mjs` | `reference-agreement.json`; `METHOD=1` writes `method-reference-agreement.json` |
    | `framing.py` | `framing-tags.json` (all 579 dates); `framing.py full-labels` writes `framing-full-labels.json` (83 dates) |
    | `framing-joint.py` | `framing-joint.json` (83 dates) |

  - Tools: pyerfa 2.0.1.5, numpy 2.5.3, astronomy-engine 2.1.19 (dev only, as in `solar.test.mjs`), Node 22.23.4, Python 3.
  - GPT reproduced the 0.0119° Sun/day-night comparison from `subpoints.json`, and confirmed all 579 vectors per body reproduce their exported ranges. GPT could not rerun ERFA or astronomy-engine (dependencies not in its workspace).
- **[src]**: **external source text read** in this thread: ERFA files and LICENSE from `raw.githubusercontent.com/liberfa/erfa` (§3.2), text only. This is reading documentation and code, separate from the desk check.
- **[code]**: read from the library code the page loads (§3.5, §4.1).
- **[GK]**: general knowledge. Not to be quoted on the page until the source pass (§13 step 2) confirms it.

As with Two Clocks, every figure is **agreement with a named reference over a stated range**, never a claim of absolute accuracy.

## 1. What the visitor sees
The Sky card gains one control: **"Zoom out to the Moon and Sun"**. It is off on load. The scene file (§7) is not fetched until the control is used.

Three stops on one continuous pull-back (§2):

| Stop | Shows | On-screen scale line |
|---|---|---|
| **A. Earth** | The globe as the visitor left it (entry point; "Back to Earth" returns here exactly). | none |
| **B. Earth and Moon** | Earth, the Moon (marker ring + name tag), a thin line from Earth's centre to the Moon. | **"Earth and Moon to scale. Labels show actual distances."** |
| **C. Earth, Moon and Sun** | Stop B plus the Sun, drawn closer and resized (§4.2), with a line from Earth's centre toward it. | **"Earth and Moon to scale. Sun drawn closer and resized. Labels show actual distances."** |

Distances are in a **text strip** in the scene. On phones the space beside the bodies only fits short name tags (§4.3). Example for 10 Nov 2026, using the live card's values:
- "Moon · 399,770 km from Earth's centre"
- "Sun · 148.2 million km from Earth's centre"
- "Computed positions at 00:00 UTC, 10 Nov 2026 · NASA/JPL Horizons · Layers are hidden in this view." (with the **Computed** evidence label)

The distances are the same values, from the same rows, that the Two Clocks card shows (§5, §7).

**Details** (in the scene's "How this is drawn" disclosure and in Sources):
- The resized Sun is drawn at 200 Earth radii instead of about 23,000, along its calculated direction.
- Its size is set so that, **as seen from Earth's centre**, it covers the same angle as the real Sun.
- How big it looks on your screen depends on where the camera is.
- The directions come from a calculation with stated approximations (§3.4).

### 1.1 Text equivalent
A list, always in the DOM (for screen readers, and on screen through "Show as text"):
- the date and instant,
- each body's distance from Earth's centre,
- **"Calculated point directly beneath the Sun: 17.08° S, 175.97° E. Calculated point directly beneath the Moon: 24.01° S, 177.19° W"** (00:00 UTC, 10 Nov 2026; [desk], 2 dp),
- the current stop's scale line.

## 2. Entering and leaving the view — decision Z1 (Chad; GPT supports Z1a as refined)
**Z1a, refined:**
- **Entry:** the Sky card control (keyboard-reachable). It **starts on the Earth the visitor is already looking at**: no jump, and nothing changes until they pull back.
- **In the view:** wheel or pinch **out** is one continuous pull-back, A → B → C. As distance grows:
  - the camera's direction and orbit target **swing smoothly** from the visitor's view to stop B's framing, then to stop C's;
  - each body appears, with its tag and strip line, once it is in frame.
- **Stop buttons A · B · C** jump straight to each framing (animated, or a cut under reduced motion).
- **Free orbit** is allowed at any point. A **"Re-frame"** button returns to the current stop's framing.
- **Exit:** "Back to Earth" (always visible) or `Esc`. It restores, exactly as saved on entry:
  - camera position and orbit target,
  - zoom limits, near plane (§4.4), auto-rotate,
  - every layer's on/off state,
  - the Readings sheet state,
  - focus, which returns to the Sky card control.
- **Outside the view,** the globe behaves exactly as today.

**Z1b** (continuous from the normal globe, no explicit entry) stays not recommended.

## 3. Frame alignment — how the vectors meet the globe
### 3.1 The problem
- The Horizons vectors are **ICRF** (geocentric; `REF_PLANE='FRAME'`, `REF_SYSTEM='ICRF'`: `build_sky.py` line 29 and the export headers).
- The globe's texture is **Earth-fixed**.
- The IERS chain is **[TRS] = RPOM · R₃(ERA) · RC2I · [CRS]** [src: ERFA `c2t06a.c` note 3, citing IERS Conventions 2003]:
  - RC2I = precession–nutation,
  - ERA = Earth rotation angle (from UT1),
  - RPOM = polar motion.

### 3.2 Sources read (external text, no PDF) [src]
- **ERFA** (BSD-3 reimplementation of IAU SOFA), `github.com/liberfa/erfa` master `1a8044cde5b7…`, read 10 Nov 2026 via raw.githubusercontent:
  - `era00.c`: ERA = 2π(0.7790572732640 + 1.00273781191135448·Tᵤ), with Tᵤ = JD(UT1) − 2451545.0; "IERS Conventions (2003), Chap. 5, Eq. 14".
  - `c2t06a.c`: the chain above.
  - `gmst06.c`: GMST "compatible with the IAU 2006 precession"; needs UT1 and TT.
  - `pmat06.c` note 2: "V(date) = rbp · V(GCRS) … mean equatorial triad of the given date" (bias + precession, no nutation).
  - Also fetched: `pnm06a.c`, `c2ixys.c`, `sp00.c`, `ee06a.c`.
  - **`LICENSE`** (sha256 `b1858f9a…`): BSD-3 terms (§10.1).
- **Not reachable from Claude's fetch tool:** the Horizons manual. It was read in the pane in the Two Clocks pass (REGISTER); the frame wording is re-read in the source pass.

### 3.3 Desk check [desk]
**(a) Shortcuts against the full chain:** Sun direction over all 579 dates (2026-06-01 → 2027-12-31). Full chain = `c2t06a`, polar motion 0, UT1 = UTC.

| Method | Separation from full chain |
|---|---|
| GMST straight on the ICRF vector (no precession) | 0.369°–0.392° |
| ERA only (no precession–nutation) | 0.059°–0.156° |
| **Proposed: IAU 2006 bias-precession + GMST 2006, no nutation** | **0.0004°–0.0023°** |
| Full chain with UT1 − UTC = 0.9 s instead of 0 | 0.0035°–0.0038° |

**(b) The proposed method, both bodies, against both references** (new in rev 2; `method.py`, `cmp.mjs` with `METHOD=1`). Measured with ERFA's own `pmat06`/`gmst06`, so this checks the **method**. The build repeats it on the generator's own output (§3.6).

| Proposed method vs | Sun max (median) | Moon max (median) |
|---|---|---|
| Full ERFA chain `c2t06a` | 0.0023° (0.0016°) | 0.0025° (0.0016°) |
| astronomy-engine (geocentric, geometric, of-date, GAST) | 0.0025° (0.0016°) | 0.0027° (0.0019°) |
| The page's day/night formula `ME.subsolar` | 0.0115° (0.0051°) | — |

**(c) Full chain against the independent references** (rev 1, unchanged):

| Full chain vs | Max | Median |
|---|---|---|
| astronomy-engine, Sun | 0.00053° | 0.00021° |
| astronomy-engine, Moon | 0.0013° | 0.00072° |
| `ME.subsolar` | 0.0119° | 0.0059° |

The `ME.subsolar` figure includes that formula's low precision and the geometric-vs-apparent difference: GEOMETRIC vectors carry no aberration, which is ~20″ [GK].

### 3.4 Proposed method — decision Z3 (Chad; GPT: reasonable v1)
**Z3a: rotate in the generator.**
- `build_sky.py` gains a plain-Python IAU 2006 bias-precession (Fukushima–Williams angles) + GMST 2006, with coefficients transcribed from ERFA with attribution and the BSD-3 notice in the file (§10.1).
- **Assumptions, stated in code, file and Sources:** no nutation; polar motion 0; UT1 = UTC. The bound on UT1 − UTC is to be confirmed in the source pass [GK < 0.9 s]; the measured effect of 0.9 s is ≤ 0.0038°.
- pyerfa and astronomy-engine are **test-only** dependencies. The page does no astronomy.

### 3.5 Globe axes [code]
- globe.gl 2.45.0 (the version the page loads) places lat/lng with `polar2Cartesian`: x = r·sinφ·cos θ, y = r·cos φ, z = r·sinφ·sin θ, with φ = 90° − lat and θ = 90° − lng. Globe radius = 100 units = 1 R⊕.
  - So **+y = north**, **+z = (0°, 0°)**, **+x = (0°, 90° E)**.
  - Read from three-globe 2.45.6 (the npm resolution); the same expression is in the bundled `globe.gl.min.js`.
- Bodies are placed with **`globe.getCoords(lat, lng, altitude)`**. The globe mesh does not rotate (the camera orbits it).

### 3.6 Alignment tests (acceptance, §11)
1. **Generator vs full ERFA chain, both bodies, every date:** ≤ **0.004°**. The method measured ≤ 0.0025°; the build's plain-Python output must also stay within 0.0001° of ERFA's own `pmat06`/`gmst06` method.
2. **Generator vs astronomy-engine, both bodies, every date:** ≤ **0.005°** (method measured ≤ 0.0028°).
3. **Generator Sun vs `ME.subsolar(00:00 UTC)`, every date:** ≤ **0.02°** (measured ≤ 0.0115°).
4. **Signed 3D direction, in the rendered scene.**
   - For each drawn body, read its world position from the three.js scene and take the unit vector from Earth's centre.
   - Map it back to Earth-fixed axes (inverse of §3.5).
   - Compare it with the **expected unit vector computed independently in the test** from astronomy-engine (not from the scene file).
   - Pass: the angle between them ≤ **0.01°**, and their dot product > 0.
   - Run on a test set that includes **2027-Feb-21**, the date in coverage when the Sun and Moon are nearly opposite (178.86° apart as seen from Earth [desk]).
   - **Breaks that must fail it:** `antipode` (body placed at −v; fails at 180°), `swap-axes` (lat↔lng), `mirror-lng` (lng → −lng), `no-precession`.

## 4. Scale — decision Z2 (Chad)
**Facts [desk]:**
- Moon range 356,779–406,570 km = **55.9–63.7 R⊕**.
- Sun range 147.10–152.10 million km = **23,064–23,847 R⊕**.
- R⊕ = 6,378.137 km, from the export header.

Radii [GK; to be confirmed from Horizons body data in the source pass]:
- Moon ~1,737.4 km (0.272 R⊕).
- Sun ~695,700 km.

### 4.1 Camera today [code]
- three.js `PerspectiveCamera` with default vertical field of view **50°**.
- globe.gl sets `near = 0.05` units and `controls.maxDistance = 100 R⊕`.
- three-render-objects sets sky radius 500 R⊕ and `far = 2.5 × sky radius = 1,250 R⊕`.

### 4.2 Options
- **Z2a (lean; GPT supports): true scale for Earth and Moon, Sun drawn closer and resized.**
  - Stop B is fully to scale. The Moon at true size measures **7.7–16 px across** at stop B, depending on canvas and date [desk, `framing-tags.json`]. Small but visible, with a marker ring.
  - Stop C draws the Sun at **200 R⊕** (rev 1 said 400; §4.3) along its calculated direction, with radius 200 × 695,700 / range. That makes its angular size as seen from Earth's centre the same as the real Sun's: 0.91–0.95 R⊕ drawn [desk ranges / GK radius].
  - At stop C on a 390-px phone, Earth is ~8 px and the Moon ~2 px across [desk, from the worst-case framing distance]. So both keep marker rings and tags.
- **Z2b:** enlarged bodies, labelled ×N.
- **Z2c:** log spacing. Not recommended.
- **Z2d:** optional "Enlarge bodies" switch. Not in the first release.

### 4.3 Framing: what fits on screen [desk, new in rev 2]
**Method (`framing.py`):**
- Camera: fov 50°, up = north.
- For each date: 220–400 candidate view directions, then the smallest camera distance at which **every drawn disc and its label box** fits inside the canvas with a 6% inset.
- Canvases: phone 390 × 844 with the sheet collapsed; phone 360 × 640; desktop globe area 760 × 640.
- The canvas sizes and label boxes are **estimates, measured in the build**.

**Results:**
- **Full two-line labels beside the bodies (150 × 34 px) don't work on phones.** Stop C needs 875–1,215 R⊕ on the two phone canvases whatever the Sun's distance (400, 200 or 120 R⊕; `framing-full-labels.json`, 83 dates). Earth is then a few pixels and the labels dominate. → **Short name tags (56 × 18 px) beside the bodies; full text in the strip.**
- **With tags, on every one of the 579 dates** (`framing-tags.json`), worst camera distance in R⊕:

  | Canvas | Stop B | Stop C, Sun at 400 R⊕ | Stop C, Sun at 200 R⊕ |
  |---|---|---|---|
  | phone 390 × 844 | 49.1 | 344.6 | **241.4** |
  | phone 360 × 640 | 48.5 | 344.1 | **208.7** |
  | desktop 760 × 640 | 41.4 | 292.6 | **166.4** |

  All of these are inside the far plane once the farthest body is added (≤ 241 + 200 R⊕ ≪ 1,250 R⊕). That includes the near-opposite configuration. → **Sun at 200 R⊕** keeps the phone camera closest, so Earth and Moon stay largest.
- **One fixed direction for the whole pull-back** (`framing-joint.py`, 83 dates) costs up to **715 R⊕** at stop C on a phone (Earth ~3 px). → **The direction swings between stops** during the same gesture (§2). It is not fixed.

**In the build:** the page computes each stop's framing the same way: a fixed, ordered candidate list, so the result is deterministic. Acceptance checks 14–15 (§11) assert that the intended bodies, their tags and the strip are in frame on all three canvases, on all dates in the test set, including 2027-Feb-21.

### 4.4 Depth range (new in rev 2)
- With today's near plane (0.05 units) and a camera 241 R⊕ away, depth resolution at Earth's distance is about 7 R⊕ for a 24-bit depth buffer. The estimate is Δz ≈ z² / (near · 2²⁴), a standard approximation, not measured on hardware.
- That is far coarser than the 0.18 R⊕ gap between the atmosphere shell and the surface, so they would collide.
- **In the view:** `near = max(0.05 units, 0.2 × distance from the camera to the nearest drawn body surface)`. Restored on exit. With the nearest drawn surface at least 50 R⊕ from the camera (so near ≥ 10 R⊕), this gives ~0.0004 R⊕ resolution at Earth at stop C with 24-bit depth, and ~0.09 R⊕ at 16-bit (same approximation).
- **The far plane is not changed.**
- Acceptance check 16 asserts the near-plane rule and the restore. A rendered screenshot at stop C on the emulated phone is inspected for surface artefacts (Chad or GPT, in the smoke test).

## 5. Which date and instant — decision Z4 (Chad; GPT supports)
- **The same sample as Two Clocks:** today's UTC date on the device clock, at 00:00 UTC, matched exactly.
  - A missing or out-of-coverage date shows "No computed position for today". The view does not open: no neighbouring day, no interpolation.
- **Rollover while the view is open:** at the next tick, on return to the page, or on re-entry, the bodies, distances, date line and text equivalent change **together in one update**. If the new date has no row, the scene shows the "no computed position" state with Back to Earth; it never mixes two dates. Check 17.
- **Layers (Z4a):** every time-dependent layer is hidden in the view, not switched off. The scene says "Layers are hidden in this view." The Earth imagery's date label (`#imgdate`, `IMG_DAY`) stays visible.
- **Repeated entry and exit** restore camera, zoom limits, near plane, auto-rotate, layers, Readings sheet and focus every time. Check 9 runs 5 cycles with different layer combinations and stops.
- Interpolation to "now" is not proposed.

## 6. What is drawn
- Moon and Sun as flat, unlit spheres (`MeshBasicMaterial`). No lighting, so no implied lunar phase. No imagery.
- Thin lines from Earth's centre. The Sun's line continues dashed past the drawn Sun.
- No glare, stars or orbit path.

## 7. Data path — decision Z5 (Chad; GPT supports a separate file)
**Z5a: separate fixed scene file** `sky-scene-2026-11-R1` (R2 key `ref/sky/sky-scene-2026-11-R1.json`), built by the same `build_sky.py` run from the same raw exports.

**Fits the Worker's existing check** (`skyCatalogue` in `phase1/worker.js`; no route or validation code change):
```
{ "catalogue": "sky",
  "catalogue_revision": "sky-scene-2026-11-R1",
  "content": "scene", "schema": 1,
  "pairs_with": { "catalogue_revision": "sky-2026-11-R1", "fileSha256": "f851f164…368a" },
  "coverage": { …identical to R1… },
  "time": { …identical to R1… },
  "transform": { "name": "IAU 2006 bias-precession + GMST 2006", "assumptions": [...], "agreement": {…build test figures…} },
  "fields": ["date", "lat", "lng", "range_km", "time_flag"],
  "bodies": { "moon": { "rows": [...] }, "sun": { "rows": [...] } },
  "sources": { raw export sha256s, generator commit } }
```
- `lat` and `lng` are the calculated point directly beneath the body, 4 dp. `range_km` is byte-identical to R1's value for the same date.
- **Hub:** one new `SKY_REVISIONS` entry: key, revision, sha256, bytes. Still a hub deploy (0.6.6).
- **Page:** pins the scene revision and sha256. Before drawing anything it checks:
  - `content === "scene"`, the schema, the fields;
  - **`pairs_with` equals the card's own pinned R1 revision and sha256.** If not, there is no view and nothing is drawn.
- **Tests through the real Worker** (`skyRoute` / `skyCatalogue` with a mock R2, as `sky-hub.test.mjs` does):
  - the **actual scene bytes** and the **actual R1 bytes** both return 200 with exact hashes;
  - a scene file missing `bodies.sun.rows` → 503 `invalid`;
  - wrong bytes → 503 `integrity`;
  - an unknown id → 404 with no R2 read.
- **Refresh:** the card and scene revisions are generated, uploaded, pinned in the hub and pinned in the page **as a pair**, on the same Approve lines. A refresh that changes one without the other fails the build check.
- Size: estimated ~35–45 KB raw. Measured in the build.

## 8. Controls, phone and accessibility
- **Desktop:** wheel/trackpad, stop buttons, Re-frame, Back to Earth, `Esc`.
- **Phone:** pinch plus the same buttons. At ≤ 720 px the Readings sheet collapses to its handle in the view, and the strip and buttons share one band.
  - 390 × 844 overlay share ≤ 8% (existing measure).
  - No horizontal overflow at 360/390/430/1280.
- **Keyboard:** every control is reachable; the stops are a labelled group; focus returns to the Sky card control on exit.
- **Reduced motion:** cuts instead of animation; auto-rotate off in the view.
- **Screen reader:** the text equivalent is the scene's description. Stop changes announce the scale line (`aria-live="polite"`).
- **No WebGL:** the text equivalent only.

## 9. Performance
- Two meshes, two lines, two tags; the layers are hidden. Frame rate is measured on the emulated phone widths, and on a real phone at Chad's deferred Safari check.
- The scene file is fetched only on entry.

## 10. Wording that changes with it
- Sources `#sky` and the `sky.js` header: "Nothing is drawn on the globe" becomes "Nothing is drawn on the globe unless you open the zoom-out view, which draws computed positions for the same instant."
- New Sources section `#sky-scene`: transform, assumptions, agreement figures, scale rule, and the apparent-size explanation (§1). ERFA credit with its notice.

### 10.1 REGISTER — proposed text, not filed (for Chad's line after GPT)
**Horizons entry:**
- Heading becomes: "NASA/JPL Horizons … — **live: Moon and Sun distances on the Two Clocks card (since 10 Nov 2026 10:43 UTC); proposed: derived scene positions (not live)**".
- Add **"Live use:"** daily 00:00 UTC range and range rate from the R1 exports, rounded for display. Attribution and modifications as already filed.
- Add **"Proposed derived use (not live):"** directions computed by us from the same exports (ICRF → Earth-fixed by IAU 2006 precession + GMST; assumptions stated), shown as positions in a zoom-out scene and as calculated points beneath each body.
  - Modifications to state: our transform; values rounded; the Sun drawn closer and resized.
  - The existing reuse interpretation ("public domain" statement; scope reading labelled) and attribution are unchanged.
- The "research only" line is kept as history, with its date.

**New entry "ERFA (liberfa/erfa)":**
- Code/coefficients only, no data. BSD-3-Clause, `LICENSE` at `1a8044c` (sha256 `b1858f9a…`), read 10 Nov 2026.
- Condition 1 (verbatim): "Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer". The notice reads "Copyright (C) 2013-2021, NumFOCUS Foundation. All rights reserved."
- Condition 3: no endorsement by the SOFA Board or the IAU.
- ERFA's note: acknowledge "a library derived from SOFA, rather than SOFA itself".
- **Our obligation:** the generator file carries the notice, conditions and disclaimer verbatim. Sources credits ERFA in those terms.
- Commercial use: permitted by the licence terms. The AGPL-3.0 repo can include BSD-3 code with the notice kept [GK reading; GPT to confirm].

## 11. Acceptance checks — each with a break that must fail it
| # | Check | Break that must fail it |
|---|---|---|
| 1 | Generator vs ERFA `c2t06a` ≤ 0.004°, both bodies, every date; plain-Python vs ERFA's method ≤ 0.0001° | `no-precession` |
| 2 | Generator vs astronomy-engine ≤ 0.005°, both bodies, every date | `wrong-day` (rows shifted one date) |
| 3 | Generator Sun vs `ME.subsolar(00:00 UTC)` ≤ 0.02°, every date | `era-only` |
| 4 | Scene `range_km` = R1 `range_km` exactly, every date; `coverage`/`time` identical to R1 | `rounded-range`, `coverage-drift` |
| 5 | Page rejects a scene with wrong sha256, schema, fields or `content`; nothing drawn | `no-pin-check`, `schema-off` |
| 6 | **Signed 3D direction** (§3.6 test 4) ≤ 0.01° and dot > 0, test set incl. 2027-Feb-21 | `antipode`, `swap-axes`, `mirror-lng` |
| 7 | Missing / out-of-coverage date: no view, "no computed position" text, zero draws | `nearest-day` |
| 8 | Off on load: zero scene requests until entry | `eager` |
| 9 | 5 entry/exit cycles restore camera, target, zoom limits, near plane, auto-rotate, layers, sheet, focus | `no-restore-layers`, `no-restore-near`, `no-restore-focus` |
| 10 | Scale line present for the current stop whenever a body is drawn | `no-scale-label` |
| 11 | Text equivalent present and matches the drawn positions and date | `stale-text` |
| 12 | No horizontal overflow (360/390/430/1280); 390 × 844 overlay ≤ 8% | existing `desktop-overflow` / `mobile-pass` breaks |
| 13 | Reduced motion: no animated transitions | `animate-always` |
| 14 | **Stop B framing:** Earth, Moon and both tags inside the canvas (6% inset), the strip readable, on 390 × 844, 360 × 640 and desktop, test set incl. the stop-B worst dates | `fixed-distance` (one camera distance for all dates) |
| 15 | **Stop C framing:** Earth, Moon, Sun, three tags and the strip inside, same canvases, test set incl. 2027-Feb-21 and the stop-C worst dates | `sun-400-full-labels`, `fixed-direction` |
| 16 | Near plane follows §4.4 in the view and is restored on exit | `near-default` |
| 17 | UTC rollover while open: bodies, distances, date line and text change in one update; never mixed | `split-update` |
| 18 | **Hub:** actual scene + R1 bytes 200 through `skyRoute`/`skyCatalogue`; missing `bodies.sun.rows` 503 `invalid`; unknown id 404 with no R2 read | `serve-on-fail`, `no-envelope-check` |
| 19 | Page refuses a scene whose `pairs_with` ≠ the card's pinned R1 | `no-pair-check` |
| 20 | Build refuses to emit a card/scene pair from different raw exports or generator commits | `unpaired-refresh` |

The full regression (41 suites today) runs on the candidate.

## 12. Questions for GPT (focused recheck)
1. Is the framing method (§4.3) and its acceptance (checks 14–15) enough, or should a minimum on-screen size for Earth and Moon at stop C be a pass condition too?
2. Sun at 200 R⊕ rather than 400: any objection on honesty grounds? It is labelled either way.
3. Is the near-plane rule (§4.4) acceptable as computed, with a visual check in the smoke test? Or must a hardware depth measurement come first?
4. The REGISTER texts in §10.1, especially the ERFA notice placement and the AGPL/BSD reading.

## 13. Steps (each its own approval) and what is not approved
1. **GPT rechecks rev 2** (docs only).
2. **Source pass**, text only, in the pane, **no export**:
   - the Horizons manual's frame wording,
   - Moon and Sun radii from Horizons body data,
   - the IERS |UT1 − UTC| bound,
   - the size of polar motion.
3. **REGISTER update** on Chad's line (the §10.1 text as GPT leaves it).
4. Chad's decisions Z1–Z5. GPT supports the five defaults, with Z1a and Z2a as refined here.
5. **Branch build** `sky-zoom-rc`. No merge, R2 write, hub deploy or page change.
6. GPT review and smoke test from a hash-checked `_review/` copy.
7. `Approve: upload ref/sky/sky-scene-2026-11-R1.json … to R2`
8. `Approve: deploy hub 0.6.6 … (content only)`
9. Live RC from the Pages origin.
10. `Approve: merge sky-zoom-rc to main (page change: Sky zoom-out view)`

**Refresh by 2027-06-01:** the card and scene are regenerated, uploaded and pinned as a pair (§7). Checks 1–4 and 20 are added to the refresh procedure.

**Not approved:** the source pass, the REGISTER update, any build, any R2 write, any hub deploy, any page change.
