# moon-lit-rc — "Lit as now" on the Moon globe — review packet

15 November 2026 · branch `moon-lit-rc` (from main `e98fe66`) · page only · **not merged, nothing live** · for GPT's review.
Built on Chad's line: "Go: build moon-lit-rc on a branch per MOON-LIT-AS-NOW-PROPOSAL rev 2.1 (D1 B fixed catalogue; D2 off by default; D3 faint night floor; D4 Earth view only if it passes the phase test; page only; no merge)".

## 1. What was built

- **`moon.html`**: two buttons after "Show LRO's dated path": **Lit as now** (off by default) and **As seen from Earth now** (hidden until the lighting is on). A lighting readout, and the both-on line between the lighting readout and the LRO readout.
- **`moonlight.js`** (new, 4.4 KB): the arithmetic only. Reads the table, interpolates unit vectors spherically, lit fraction, the day/night mask. No DOM, clock or network; the same file runs under Node in the test.
- **`moonglobe.js`**: shading, clock, Earth-view camera, readouts, fallbacks.
- **`assets/moon/moon-light-2026-06-R1.json`** (82,330 B, sha256 `a78c2f4b…b462`): the table. Fetched only when "Lit as now" is first pressed; hash pinned in `moonlight.js`.
- **`sources.html#moonlight`** and `moon.html` Sources: method, limits and check results.
- No hub change. No change to the Earth, Sun or Timeline pages. **D4 outcome: the Earth view passes the phase test, so the button is included.**

### How it behaves
- Opens evenly lit, as today. On: day side at the map's even brightness, night side at 12% (labelled a display aid, not earthshine), linear transition ±1° centred on the calculated line.
- Readout: "Sunlight calculated for 15 Nov 2026 03:20 UTC · device clock" with the Computed label; "Sun overhead at … · Earth overhead at …"; "28.4% of the Earth-facing disc is lit"; the limits sentence.
- Clock: device clock only. A one-second heartbeat compares UTC minutes and recalculates when the minute changes (boundary or corrected clock), and at once when the tab becomes visible.
- Earth view: same camera at 100 Moon radii, field of view narrowed so the disc keeps its size; stays centred on the sub-Earth point as the clock ticks. A drag, a pinch, any view or zoom button, switching the lighting off, or a fallback restores the ordinary camera first.
- Both displayed: "Lighting uses the current UTC minute. The LRO path is a dated example from 10–11 June 2026." Each time stays in its own readout.
- Unavailable (table missing or altered, clock outside 1 Jun 2026 – 1 Jan 2028, no valid clock, shading cannot be applied, arithmetic file missing): evenly lit, button reads "Lit as now unavailable", one reason. A clock that becomes valid again brings the lighting back by itself.

### Two implementation choices to check
1. **Shading is tied to the map, not to the scene.** The Sun direction is handed to the shader in the globe mesh's own coordinates using the sphere's texture mapping (image column = (longitude + 180) / 360). No scene or camera transform is involved. A first version converted through scene matrices and showed a run-dependent error of up to 0.0012° in longitude; it was replaced.
2. **The shading is added to the library's own material** when it is first compiled (two string insertions in its shader). If the expected insertion points are missing, the state is "unavailable — this device could not apply the shading", never an unlit "on".

## 2. One correction to the proposal (for GPT's judgement)

Proposal rev 2.1 §2 says the convention difference between a geometric and an apparent Earth direction is "0.0002°". **That figure was wrong.** Measured against Horizons' apparent sub-observer point, the table's geometric Earth direction differs by up to **0.0058°** (mean 0.0036°). The cause: Horizons places the Moon where it was 1.3 s earlier, and in that time both bodies move about 38 km around the Sun, which is 0.0057° at the Moon's distance. It is the same size as stellar aberration.

- It does not affect the lighting (the Sun direction agrees with Horizons to 0.0002°).
- It moves "Earth overhead at" and the Earth-view centre by at most 0.006°, and the lit share by at most 0.0026 percentage points. None is visible at the readout's 0.1° and 0.1% precision.
- The table is built as the approved proposal specifies (geometric). **Option:** switch the Earth direction to the apparent one (what an observer at the Earth's centre sees), as revision R2. It is a one-line change in the generator and a rebuild. Claude's view: the apparent direction is the better definition for a button called "As seen from Earth", but the difference is far below anything shown, so either is defensible. GPT to say.

Also found: Horizons' "apparent sub-solar point" includes stellar aberration. Reading it with light time only leaves 0.0057–0.0060° at all 116 dates; with aberration, 0.0000014°. The like-for-like comparison uses the reading that fits and records the rejected one.

## 3. Numerical evidence (`phase1/skycraft/checks/moonlight-checks.json`)

| Check | Result | Ceiling |
| --- | --- | --- |
| Independent DE440 calculation vs SPICE, all 2,317 samples, before rounding | worst **0.0000072°** | 0.0001° |
| … after the table's rounding (5 decimals) | worst **0.0000128°** | 0.0001° |
| Own UTC→TDB vs SPICE | worst 0.00000012 s | — |
| June rotation at the nine archived SPK epochs vs `moonfixed-checks.json` | worst element difference **1.0 × 10⁻¹⁵** | 10⁻¹⁴ |
| Horizons sub-solar, like for like, 116 dates | worst **0.0000014°** | 0.001° |
| Horizons sub-observer, like for like | worst **0.0000013°** | 0.001° |
| Horizons illuminated fraction, like for like | worst **0.0000051 pp** | 0.01 pp |
| Table conventions vs Horizons (reported, not gated) | Sun 0.00019°, Earth 0.0058°, lit 0.0026 pp | — |
| Interpolation, page rule, 2,317 samples + 2,316 midpoints | Sun **0.00055°**, Earth **0.00495°**, lit 0.0032 pp | 0.01° |
| NASA SVS hourly table, 1,128 hours (15 Nov – 31 Dec 2026), corroboration | Sun ≤ 0.00083°, Earth ≤ 0.00069°, phase ≤ 0.0052 pp | none |

- Horizons answer header: "Target pole/equ : MOON_ME {East-longitude positive}", radii 1737.4 × 3, target source DE441, geocentric. Request URL and raw answer are in `raw/` and `BUILD-moonlight.json`.
- SVS: the page lists "DE421 (JPL DE421)". Its table gives 3 decimals of a degree and 2 of a percent, so its offsets are at its own rounding. No light-time convention is stated on the page.
- Earth interpolation error (0.005°) is half the ceiling. A 3-hour table would quarter it at twice the size; not done, since it is within the gate.
- Leap seconds: none is scheduled after 2017. One announced inside the table's span would shift later samples by 1 s (0.00014°).

**Inputs** (all hashed in the browser pane from the full files, then again on arrival; `BUILD-moonlight.json`):
- `de440s.bsp` 32,726,016 B, sha256 `c1c7feea…49f2`: nine byte ranges kept (header and summaries; type-2 records of the Sun, the Earth–Moon barycentre, the Moon and the Earth covering the table with a day's margin; four segment trailers), 184 KB.
- `moon_pa_de440_200625.bpc` (hash as before): records 21750–21823, 18,944 B. The earlier three-record range is byte-identical inside it.
- `ascp01950.440` 30,629,582 B, sha256 `e24f6356…7286`: records 873–891 (509,599 B). Record 874 is byte-identical to the one already in the repo.
- Coverage is confirmed by record number before every SPICE call, and every value returned is finite (other bytes are 0xFF).

**Build breaks** (`test_moonlight_breaks.py`): 13 of 13 caught — Sun without aberration, Sun geometric, Earth light-time corrected, wrong frame, EMRAT ignored, altered raw file, a byte range left out, Horizons read without aberration, Horizons without light time, June rotation one second late, no leap seconds, no interpolation, wrong libration block.

## 4. Page evidence

**`phase1/moon-light.test.mjs`** (the page's `moonlight.js` under Node): **27 / 0**. Six breaks fail as they must (longitude-latitude interpolation, nearest sample, edge 2°, edge off-centre, hash, open-ended coverage).

**`phase1/moon-lit.test.cjs`** (real `moon.html`, globe.gl 2.45.0, SwiftShader; device clock shifted, timers real): **132 / 0** (one full run, about 3.5 minutes**.
- A. Off by default; table not fetched until asked; switching off returns the evenly lit picture.
- B. Four instants (crescent 27.2%, quarter 47.8%, gibbous 72.1%, and one with the day–night line on the ±180° meridian): readout, shader direction.
- C. Mask, independent of the map: 56 probes per instant at 0°, ±0.5°, ±1°, ±2°, eight places round the line (within 2° of a pole; both sides of the seam); half value within 0.1° of the line.
- D. Rendered globe: the same surface points, lit capture divided by an evenly lit capture at the same camera pose (§10).
- E. Earth view (§10): camera distance read after settle and after two resizes; disc area kept within 1.5%; centred on the sub-Earth point, and on the new one after a minute boundary; exits by drag (the same drag turns the globe), Near side, Zoom in, East, lighting off, fallback; motion allowed.
- F. Both-on line and wording; each time in its own readout; LRO step leaves the lighting time; a lighting tick leaves the LRO time; minute boundary by itself; tab return; focus kept.
- G. Clock jumps (forward, back, out of range both ends and back, no clock); missing, altered and failed table; missing arithmetic file; shading not applicable; no WebGL.

**Phase on screen** (share of disc pixels on the day side of the mask's 50% contour; §10 method):

| Instant | Calculated | Earth view | Ordinary camera, at the sub-Earth point |
| --- | --- | --- | --- |
| Crescent | 27.23% | **27.07%** | 18.64% |
| Quarter | 47.79% | **47.78%** | 46.77% |
| Gibbous | 72.08% | **72.25%** | 80.51% |

The Earth view is within 0.2 points (gate 2). The ordinary camera misses by 8 points at crescent and gibbous, which is why the distant view exists.

**Page breaks** (each run against the sections that should catch it): **14 of 14 fail as they must** — Sun 5° off (D), Sun longitude sign flipped (B, D), Earth view at 3.2 radii (E), no re-centring on a tick (E), no exit on drag (E), field of view not restored (E), lighting left on in a fallback (G), no hash check (G), no coverage check (G), no heartbeat (F), on by default (A), both-on line shown without LRO (F), transition 3° wide (C, D), no "shading not applied" check (G).

**Existing Moon suites on this branch:** `moon-globe` **67 / 0**, `moon-lro-path` **68 / 0**, `skycraft-ui` **77 / 0** (one run each, on the final code). Generators: `build_moonlight.py --check` and `build_moonfixed.py --check` both "check ok".

**Not run:** the full regression (the other 60 files); a real phone, Safari, a screen reader; a real GPU (all rendering here is software). Desktop Chrome on the Mac is GPT's to check.

## 5. Things a reviewer may want to press on

1. The Earth-direction convention (§2).
2. The lit readout is `aria-live="off"`: it changes every minute and would otherwise interrupt a screen reader each time. State changes are carried by the button's label and pressed state. If GPT prefers a single polite announcement when the lighting first comes on or becomes unavailable, that is a small addition.
3. The night floor is 12% of day brightness. It is a judgement call; the test only requires that it is small and positive.
4. In the ordinary close view the on-screen phase is not the phase (table above). The readout's percentage is always the geocentric figure, and the Earth-view note says what that view is. Is one more sentence wanted beside the globe for the close view?
5. The heartbeat is one comparison a second while the lighting is on, nothing when off.
6. A drag's momentum under software rendering leaves a 0.01° drift after "Near side" for a second or two. Seen in the test, present before this branch; not changed.

## 6. Files

- Page: `moon.html`, `moonglobe.js`, `moonlight.js` (new), `style.css` (three rules), `sources.html`, `assets/moon/moon-light-2026-06-R1.json` (new).
- Build: `phase1/skycraft/build_moonlight.py`, `BUILD-moonlight.json`, `checks/moonlight-checks.json`, `checks/moonlight-truth.json` (test-only SPICE values), `test_moonlight_breaks.py`, fourteen files in `raw/`.
- Tests: `phase1/moon-light.test.mjs`, `phase1/moon-lit.test.cjs`.
- REGISTER draft: `reviews/2026-11-15-moon-lit-register-draft.md` (not filed).

## 7. Release steps, each on Chad's own line

1. File the REGISTER entries on the branch (after GPT's view of the draft).
2. Merge `moon-lit-rc` to main (page change). Rollback: revert the merge commit.
3. On release, record the renewal date: the table ends 1 January 2028.
