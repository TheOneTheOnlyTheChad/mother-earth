# Sky zoom-out view (Earth → Moon → Sun) — proposal rev 1 (docs only)

Rev 1 written 10 Nov 2026, 11:03 UTC clock reading (start of writing), from GPT's brief (relayed by Chad), recorded in `docs/concepts/SKY-ZOOM-OUT-BRIEF.md`. **For GPT's review.** Nothing in this document is built, exported, uploaded or deployed. Each later step needs its own approval (§13). Builds on `SKY-TWO-CLOCKS-PROPOSAL.md` rev 3 and the live card (main `a1c3ed6`, hub 0.6.5).

**Question the view answers:** where are the Moon and the Sun, relative to the Earth, at the card's sample instant, and how far away are they?

## 0. Evidence status (read first)
Every number below carries one of these tags:
- **[desk]**: computed in this thread from **committed files only**: the raw Horizons exports `phase1/sky/raw/hz-moon-ut-20261110.txt` (sha256 `26d8c2b5…`) and `hz-sun-ut-20261110.txt` (`ce2aaea5…`), all 579 dates. No new request was made to Horizons or anywhere else. Scripts and outputs: `docs/concepts/sky-zoom-out-desk-check/` (`desk.py` → `transform-agreement.json`, `subpoints.json`; `cmp.mjs` → `reference-agreement.json`). Tools: pyerfa 2.0.1.5, numpy 2.5.3, astronomy-engine 2.1.19 (dev only, as in `solar.test.mjs`), Node 22.23.4.
  - **Note for Chad and GPT:** this desk check is analysis of data we already hold. It is not a research run. If you'd rather it waited for an approval, strike §3.3 and the [desk] figures stay unquoted.
- **[src]**: read in this thread from source text (§3.2 lists each with its revision).
- **[code]**: read from the library code the page loads (§4.1).
- **[GK]**: general knowledge. Not to be quoted on the page until the source pass (§13 step 2) confirms it.

As with Two Clocks, every figure is **agreement with a named reference over a stated range**, never a claim of absolute accuracy.

## 1. What the visitor sees
The Sky card gains one control: **"Zoom out to the Moon and Sun"**. It is off on load. The scene file (§7) is not fetched until the visitor opens the view.

Three stops. The visitor can move between them by pinch, wheel or the stop buttons:

| Stop | Shows | Scale on screen |
|---|---|---|
| **A. Earth** | Today's globe (where the view starts and where "Back to Earth" returns). | as now |
| **B. Earth and Moon** | Earth, the Moon, and a line from Earth's centre to the Moon labelled with its distance. | **True scale** for spacing and sizes (option Z2a, §4), with a marker ring so the small Moon can be found. |
| **C. Earth, Moon and the Sun's direction** | Stop B plus the Sun, **drawn closer than it really is**, along its exact direction. | Labelled on screen: "Sun drawn closer than it is — direction exact". The Sun's real distance is in its label. |

Labels (example for 10 Nov 2026, using the live card's figures):
- "Moon — 399,770 km from Earth's centre · 00:00 UTC, 10 Nov 2026"
- "Sun — 148.2 million km · drawn closer than it is; direction exact"

The distances are the same values, from the same rows, that the Two Clocks card shows (§5).

A persistent line in the scene says what the view is: **"Computed positions at 00:00 UTC, [date] (NASA/JPL Horizons). Layers are hidden in this view."** It uses the existing **Computed** evidence label.

### 1.1 Text equivalent
A list, always present in the DOM (visible to screen readers, and on screen as "Show as text"):
- the date and instant,
- each body's distance from Earth's centre,
- each body's **overhead point**: "Sun overhead at 17.08° S, 175.97° E; Moon overhead at 24.01° S, 177.19° W (00:00 UTC, 10 Nov 2026)" [desk, 2 dp],
- the scale statement for the current stop.

The overhead point (where the body is straight up) is a plain-language way of stating the direction. It also lets a reader check the scene against any other source.

## 2. Entering and leaving the view — decision Z1 (Chad)
- **Z1a (Claude's lean): explicit mode.** Entering the view comes only from the Sky card control (and a keyboard-reachable button). Outside the mode, the globe behaves exactly as today: same zoom limit and layers. **"Back to Earth"** (always visible in the mode; also `Esc`) restores the camera position, zoom, auto-rotate state and every layer's on/off state saved on entry.
- **Z1b: continuous.** Zooming out past a threshold on the normal globe brings the Moon in on its own. More discoverable, but it changes the main globe for every visitor. Layers would also need to vanish mid-gesture, and visitors may stumble into a computed view they didn't ask for. **Not recommended** (constitution: the globe opens uncluttered and people choose).

## 3. Frame alignment — how the vectors meet the globe
### 3.1 The problem
- The Horizons vectors are **ICRF** (geocentric, `REF_PLANE='FRAME'`, `REF_SYSTEM='ICRF'`: `build_sky.py` line 29 and the export headers). These axes are fixed relative to distant quasars, not to the ground.
- The globe's texture is **Earth-fixed** (latitude/longitude).
- So each vector has to be rotated into Earth-fixed axes for the sample instant (00:00 UTC on the sample date). The IERS chain for this is **[TRS] = RPOM · R₃(ERA) · RC2I · [CRS]** [src: ERFA `c2t06a.c` note 3, citing IERS Conventions 2003]:
  - RC2I is precession–nutation (the celestial-to-intermediate matrix),
  - ERA is the Earth rotation angle from UT1,
  - RPOM is polar motion.

### 3.2 Sources read (text only, no PDF)
- **ERFA** (BSD-3 C reimplementation of IAU SOFA), `github.com/liberfa/erfa` master `1a8044c` (read 10 Nov 2026 via raw.githubusercontent):
  - `era00.c`: ERA = 2π(0.7790572732640 + 1.00273781191135448·Tᵤ), Tᵤ = JD(UT1) − 2451545.0. Expressed in code as fraction-of-day + 0.00273781191135448·t. "Adapted from Expression 22 of Capitaine et al. 2000 … IERS Conventions (2003), Chap. 5, Eq. 14."
  - `c2t06a.c`: the chain above. Polar motion `xp, yp` are the pole's coordinates in the ITRS.
  - `gmst06.c`: GMST "compatible with the IAU 2006 precession"; needs UT1 and TT ("If UT1 is used for both purposes, errors of order 100 microarcseconds result").
  - Also fetched: `pnm06a.c`, `c2ixys.c`, `sp00.c`, `ee06a.c`. File sha256 prefixes: era00 `91c092c3`, gmst06 `5adeede2`, c2t06a `d9fda697`, pnm06a `ea1814a8`.
- **Not reachable this thread:** the JPL Horizons manual (`ssd.jpl.nasa.gov`) is blocked from Claude's fetch tool. It is on the source-pass list (§13 step 2) for the exact wording on what "ICRF" means for an Earth-centred vector table.

### 3.3 Desk check — how much each shortcut costs [desk]
Sun vector rotated into Earth-fixed axes four ways. Each is compared with the full ERFA chain (`c2t06a`: IAU 2006/2000A, polar motion 0, UT1 = UTC). The figure is the angular separation of the Sun's direction, over all 579 dates (2026-06-01 → 2027-12-31):

| Method | Separation from full chain |
|---|---|
| GMST applied straight to the ICRF vector (no precession) | **0.369°–0.392°** |
| ERA only (no precession–nutation) | 0.059°–0.156° |
| **IAU 2006 precession (with frame bias) + GMST (IAU 2006), no nutation** | **0.0004°–0.0023°** |
| Precession–nutation + GAST (IAU 2006/2000A) | < 0.00001° (the same chain written the other way) |
| Full chain with UT1 − UTC = 0.9 s instead of 0 | 0.0035°–0.0038° |

Independent references, full-chain overhead points against:
- **The page's own `ME.subsolar`** (the day/night formula): Sun separation **max 0.0119°**, median 0.0059°. This difference includes the formula's low precision and the geometric-vs-apparent difference (GEOMETRIC vectors carry no aberration; [GK] ≈ 20″).
- **astronomy-engine** (geocentric, geometric, of-date, apparent sidereal time):
  - Sun: max **0.00053°**, median 0.00021°;
  - Moon: max **0.0013°**, median 0.00072°. Geocentric `GeoMoon`, so no topocentric parallax enters.

What this means:
- A naive "rotate by sidereal time" puts the Sun about **0.38°** off. That is roughly 40 km on the ground under the subsolar point [GK conversion: 1° ≈ 111 km], and visible as a mismatch with the day/night layer.
- Precession + GMST stays within 0.0023° of the full chain on every date. Nutation and polar motion are not needed at the scene's drawing precision. The only figure we quote is that measured agreement.

### 3.4 Proposed method — decision Z3 (Chad, after GPT)
- **Z3a (Claude's lean): rotate in the generator, at build time.**
  - `build_sky.py` gains a plain-Python IAU 2006 precession (with frame bias) + GMST (IAU 2006). Coefficients are copied with attribution from ERFA (BSD-3) and cited in the code. Assumptions: UT1 = UTC, polar motion 0, no nutation. Rejected alternatives are named in a comment.
  - The output per body per date is its overhead latitude/longitude, plus the range already in R1.
  - **pyerfa is a test-only dependency** (like astronomy-engine in `solar.test.mjs`). A build test asserts agreement with `c2t06a` on every date. The page does no astronomy and gains no dependency.
- **Z3b:** ship ICRF X/Y/Z and rotate in `sky.js`. This puts the same maths in the page, makes the file bigger, and needs a JS test harness for it. Not recommended.
- **UT1 − UTC** is taken as 0. Bound: |UT1 − UTC| < 0.9 s [GK; confirm from IERS Bulletin C wording in the source pass]. Measured effect at 0.9 s: ≤ 0.0038° [desk]. Polar motion is taken as 0 [GK size ~0.5″; confirm in the source pass].

### 3.5 Globe axes [code]
- globe.gl 2.45.0 (the version the page loads) places lat/lng with `polar2Cartesian`: x = r·sinφ·cos θ, y = r·cos φ, z = r·sinφ·sin θ, with φ = 90° − lat and θ = 90° − lng. Globe radius 100 scene units.
  - So three.js **+y = north pole**, **+z = (0°, 0°)**, **+x = (0°, 90° E)**.
  - Read from three-globe 2.45.6 source (npm resolution of globe.gl 2.45.0). The same expression is in the bundled `globe.gl.min.js` (function `fm`).
- The page places the Moon and Sun with **`globe.getCoords(lat, lng, altitude)`**, the library's own placement call, rather than hand-mapping axes. So the axis convention is exercised, not re-implemented.
- The globe itself does not rotate (the camera orbits it, and auto-rotate moves the camera), so Earth-fixed positions stay put.

### 3.6 The alignment tests (acceptance, §11)
1. **Sun over the subsolar point.** For each sample date in the test set, the Sun's overhead point from the scene file is within **0.02°** of `ME.subsolar(00:00 UTC)` (measured max 0.0119°, so the bound leaves margin and is still well under the 0.38° naive error). Then in the rendered scene, the screen point of `getCoords(sun overhead, 0)` lies on the line from the screen point of Earth's centre to the Sun's drawn position (within 2 px).
2. **Moon against an independent reference:** within **0.005°** of astronomy-engine's geocentric overhead point on every date (measured max 0.0013°).
3. **Generator agreement:** within **0.003°** of ERFA `c2t06a` on every date (measured max 0.0023°).
4. Each test has a break (§11) that must fail it, including "no precession" (must fail test 1 at ~0.37°) and "swap lat/lng axes".

## 4. Scale — decision Z2 (Chad)
Facts:
- Moon range 356,779–406,570 km = **55.9–63.7 Earth radii**; Sun range 147.10–152.10 million km = **23,064–23,847 Earth radii** [desk, over the coverage, R⊕ = 6,378.137 km from the export header].
- Moon radius ~1,737 km (0.27 R⊕); Sun radius ~695,700 km (109 R⊕) [GK: confirm from Horizons body data in the source pass].

### 4.1 What the library allows today [code]
- globe.gl sets `controls.maxDistance = 100 × globe radius` and sky radius 500 × globe radius. three-render-objects sets `camera.far = 2.5 × skyRadius` (1,250 R⊕).
- So the Moon at true distance (≤ 64 R⊕) already fits. The Sun at true distance (~23,000 R⊕) is far beyond the camera's far plane. Pushing the far plane that far would cost depth precision for the layers drawn just above the surface (night overlay at altitude 0.0005, polygons at 0.006).
- **The near plane is not touched.** In the mode, the zoom limit rises to ~450 R⊕; the far plane stays as it is.

### 4.2 Options
- **Z2a (Claude's lean): true where possible, labelled where not.**
  - Stop B is fully true scale: spacing and sizes. At true scale the Moon is tiny (roughly 3 px on a 390-px-wide phone with Earth and Moon both in frame [GK estimate; to be measured in the build]). A marker ring and label make it findable. That smallness is itself the thing worth seeing.
  - Stop C draws the Sun at a fixed **400 R⊕** along its exact direction, about 1/58 of its true distance, at **its true apparent size as seen from Earth's centre** (radius scaled with the distance, so it looks from Earth as big as the real Sun). Labelled "drawn closer than it is — direction exact"; true distance in the label.
- **Z2b:** enlarged bodies at both stops, with an on-screen "Bodies enlarged ×N". Easier to see, but it adds a second distortion to label.
- **Z2c:** log-compressed spacing for both bodies. Smooth, but then neither distance on screen is true. Not recommended.
- Any of these can carry an optional "Enlarge bodies" switch (off by default, labelled ×N while on). **Z2d: include it or not** (Claude: not in the first release).

## 5. Which date and instant the scene shows — decision Z4 (Chad)
- **The same sample as Two Clocks**: today's UTC date on the device clock, at 00:00 UTC, matched exactly. A missing or out-of-coverage date shows "No computed position for today" (no neighbouring day, no interpolation), and the view does not open. The same rollover rules as the card apply: next tick, card open, return to the page.
- Both files are built **from the same raw rows**. The build test asserts that the scene's range for every date equals R1's `range_km` exactly.
- **Interpolation to "now"** (the exports carry velocities, so a Hermite fit is possible) would be a new claim. **Not proposed**; possible later follow-on.

### 5.1 Conflict with the layers that show "now"
- The day/night overlay repaints for the current time every minute, and orbital objects are propagated to now. At 00:00 UTC sample time, the Sun drawn in the scene would generally not line up with the lit side painted for "now" (up to 180° apart in longitude).
- **Z4a (Claude's lean):** in the mode, every layer is hidden (not switched off), with the line "Layers are hidden in this view; they show their own times." "Back to Earth" restores them exactly.
- **Z4b:** paint day/night for the sample instant while in the mode, labelled. More to explain and to test.
- **The Earth imagery** has its own date (`IMG_DAY`, about 36 h old; the existing `#imgdate` label). It stays labelled in the mode.

## 6. What is drawn
- **Moon and Sun:** plain spheres with flat, unlit material (`MeshBasicMaterial`, grey and pale yellow). No surface imagery (none is filed in REGISTER).
  - **No lighting from the Sun**, because shading would show a lunar phase, which is a further claim with its own check. Phase is a possible follow-on, not in this proposal.
- **Lines** from Earth's centre to each body (thin, labelled). For the Sun at stop C the line is dashed past the drawn Sun, a cue that the true distance is further.
- **No glare or bloom**, no stars, no orbit ellipse. The orbit would be a different claim: a path, not a position.

## 7. Data path — decision Z5 (Chad)
- **Z5a (Claude's lean): a separate fixed scene file**, built by the same `build_sky.py` run from the same raw exports. Revision `sky-scene-2026-11-R1`, R2 key `ref/sky/sky-scene-2026-11-R1.json`.
  - Served by the existing hub route `/catalogue/sky/<revision>` with one new entry in `SKY_REVISIONS`. The route code is unchanged: an exact key match on any pinned id. That is still a hub deploy.
  - The page pins the scene's revision and sha256 next to R1's, and checks the schema before anything is drawn.
  - **R1 and the live card are untouched** (T3 contract: old pins stay valid).
  - Fetched only when the view is opened.
  - Per date: `[date, moon_lat, moon_lng, moon_range_km, sun_lat, sun_lng, sun_range_km, time_flag]`, angles to 4 dp. Estimated ~35–45 KB raw [estimate, to be measured]; R1 itself compresses 71,925 → 26,819 B with zstd.
  - The file records the transform name, its assumptions (§3.4), the agreement figures from its own build test, and the sha256 of both raw exports.
- **Z5b:** a new card revision R2 carrying both. One file, but it re-pins the live card and makes every card open download scene data it may not use.

## 8. Controls, phone and accessibility
- **Desktop:** wheel / trackpad zoom (OrbitControls, as today); stop buttons A · B · C; `Esc` and the "Back to Earth" button.
- **Phone:** pinch (OrbitControls touch, as today) plus the stop buttons. At ≤ 720 px the Readings sheet collapses to its handle while in the mode; the scene line and the stop buttons sit in one strip.
  - The 390 × 844 overlay share must stay ≤ 8% (the existing measure, camera-based disc radius).
  - No horizontal overflow at 360/390/430/1280 px.
- **Keyboard:** every control reachable; stop buttons are a labelled group; focus returns to the Sky card control on "Back to Earth".
- **Reduced motion:** stop changes jump instead of animating; auto-rotate stays off in the mode.
- **Screen reader:** the text equivalent (§1.1) is the scene's accessible description; stop changes announce the scale statement (`aria-live="polite"`).
- **No WebGL:** the control shows the text equivalent only, with the existing plain-language message.

## 9. Performance
- Two extra meshes, two lines and up to three labels. Draw cost is negligible beside the existing layers, which are hidden in the mode anyway. The measure is the frame rate on the emulated phone widths (and a real phone when Chad does the deferred Safari check).
- The file loads only when the view is opened.

## 10. Wording that changes with it
- Sources `#sky` and the `sky.js` header say **"Nothing is drawn on the globe"**. They become: "Nothing is drawn on the globe unless you open the zoom-out view, which draws computed positions for the same instant."
- Sources gains a `#sky-scene` section: the transform, its assumptions, the agreement figures and the scale rule.
- REGISTER: no new source. Horizons stays the source (entry filed 10 Nov, "research only"). **The Horizons entry's status covers the card already live; whether it needs a wording change for a second use is a question for GPT (§12).**

## 11. Acceptance checks — each with a break that must fail it
| # | Check | Break that must fail it |
|---|---|---|
| 1 | Generator agrees with ERFA `c2t06a` ≤ 0.003° on every date | `no-precession` (GMST on ICRF): fails at ~0.37° |
| 2 | Sun overhead point within 0.02° of `ME.subsolar(00:00 UTC)` on every date | `era-only`: fails at ~0.06–0.16° |
| 3 | Moon within 0.005° of astronomy-engine geocentric | `wrong-day` (row shifted by one date): fails |
| 4 | Scene range = R1 `range_km` exactly, every date | `rounded-range` |
| 5 | Page rejects a scene file whose sha256 or schema differs; nothing drawn | `no-pin-check`, `schema-off` |
| 6 | Rendered: Sun's screen position, the subsolar screen point and Earth's centre are collinear within 2 px | `swap-axes` (lat↔lng in `getCoords`) |
| 7 | Missing / out-of-coverage date: no view, the "no computed position" text, zero draws | `nearest-day` |
| 8 | Off on load: zero scene requests until the view is opened | `eager` |
| 9 | "Back to Earth" restores camera, zoom limit, auto-rotate and every layer state exactly | `no-restore-layers` |
| 10 | Stop C shows the "drawn closer" statement whenever the Sun is drawn | `no-scale-label` |
| 11 | Text equivalent present and matches the drawn positions | `stale-text` |
| 12 | No horizontal overflow (360/390/430/1280); 390 × 844 overlay ≤ 8% | the existing `desktop-overflow` / `mobile-pass` breaks |
| 13 | Reduced motion: no animated transitions | `animate-always` |

The full regression (41 suites today) is run on the candidate, as for Two Clocks.

## 12. Questions for GPT
1. Is precession + GMST with no nutation and UT1 = UTC acceptable when the only claim is the measured agreement (≤ 0.0023° with `c2t06a`, ≤ 0.012° with the page's day/night formula)? Or should the generator carry the full chain using pyerfa as a build dependency?
2. Is the overhead point (§1.1) a fair way to state direction in text? Or does it read as an observation?
3. The scale rule at stop C (closer, true apparent size, direction exact): is the label enough?
4. Hiding all layers in the mode (Z4a) versus painting day/night for the sample instant (Z4b).
5. Separate scene file (Z5a) versus a card R2 (Z5b).
6. Does the Horizons REGISTER entry need a wording change for the second use?
7. Should the desk check (§3.3) be redone inside the source pass as a recorded protocol, or is the committed script + output enough evidence?

## 13. Steps (each its own approval) and what is not approved
1. **GPT reviews this rev 1** (docs only). → rev 2.
2. **Source pass**, text only, through the pane, no export:
   - the Horizons manual's frame statement,
   - Moon and Sun radii from Horizons body data,
   - the IERS |UT1 − UTC| bound (Bulletin C wording),
   - the size of polar motion.
   No new Horizons export is needed: the vectors are already committed.
3. Chad's decisions Z1–Z5 (after GPT).
4. **Branch build** `sky-zoom-rc` (generator, scene file, `sky.js`/index/Sources, tests). No merge, R2 write, hub deploy or page change.
5. GPT review of the candidate, with smoke tests from a hash-checked `_review/` copy.
6. `Approve: upload ref/sky/sky-scene-2026-11-R1.json … to R2`.
7. `Approve: deploy hub 0.6.6 … (content only)`: one new `SKY_REVISIONS` entry.
8. Live RC from the Pages origin.
9. `Approve: merge sky-zoom-rc to main (page change: Sky zoom-out view)`.

**The refresh (by 2027-06-01)** would then regenerate both files from the same export. Proposal for the refresh procedure: one extra step, rebuild the scene and run checks 1–4.

**Not approved:** the source pass, any build, any R2 write, any hub deploy, any page change.
