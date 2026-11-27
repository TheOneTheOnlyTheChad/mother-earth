# Moon item 10a — the Moon's picture on the Sky zoom-out Moon: assessment and proposal

Rev 1 · 27 Nov 2026, written from 03:22 UTC (clock reading) · Claude · **docs only: no build, merge or deployment** · for GPT's review, then Chad's decisions.

**Chad's go (27 Nov 2026):** "Go with Moon item 10a: assess using the existing Moon appearance texture in the Sky zoom-out view. Read the existing behaviour and shared assets, then return a bounded proposal for GPT review, including orientation, lighting, attribution, loading and performance implications. Docs only for now; no build, merge or deployment. Keep the remaining Moon checklist intact."

Checklist: `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` item 10a. Starting point there: proposal rev 1 option S1 ("same picture, near side towards Earth, libration not shown, +457,942 B, new pixel tests").

## 0. Bottom line

1. **It can be done with files the site already serves and pins, and no new data.** The picture is `assets/moon/lroc_color_2k.jpg` (the Moon tab's map, 457,942 B). The Moon's true orientation at the Sky view's instant comes from the sunlight table `assets/moon/moon-light-2026-06-R1.json` (82,330 B), together with the Sky scene file the view already reads.
2. **Orientation can be the true one, not S1's approximation.** A two-direction fit (Moon→Earth and Moon→Sun, known in both frames) fixes all three rotation angles, so libration is included. Against an independent reference (astronomy-engine's IAU Moon rotation model) over all 579 dates the view covers: median 0.004°, 95th percentile 0.027°, worst 0.29°. The worst case is on 21 Feb 2027, when the Sun and the Earth are only 1.1° apart as seen from the Moon, which weakens the fit about the Moon–Earth line. Three deliberate breaks each produce errors of tens of degrees or more. §5.
3. **The Moon is very small on screen in this view, and that limits what the picture adds.** Measured on unchanged main (§3): at stop B (Earth and Moon) the Moon's radius is **1.3–5.2 CSS px** (about 3–10 px across). At stop C it is 0.5–1.7 px. At stop A it is outside the frame. The camera usually sees the Moon **from the side** (35–121° from the Earth–Moon line), so the visible disc is often half or more far side. At this size the picture shows a mottled light-and-dark disc in the right places, not recognisable features. The offline estimates in §3.3 show this.
4. **Lighting: keep the view's existing rule, evenly lit with no implied phase** (L1). The Earth in this view is evenly lit too (the day/night mesh is hidden). A phase would be the most visible change at this size, but it would contradict the rest of the view. It stays a separate decision (L2, not in this item).
5. **Loading:** nothing at page load. Two extra same-origin files are fetched only when the view opens, each checked against its pin, and drawn when ready. If either fails, the view shows **today's plain grey Moon, unchanged**. No hub, R2, Worker or collector change.
6. **Claude's recommendation:** proceed with **T-orient + L1** (§12, D1–D6), with the size limits stated honestly on the page. Choosing **"not pursued"** is a legitimate outcome too: it would record 10a as a closed decision with the reason "the Moon is 3–10 px in this view". That is Chad's call (D1).

## 1. Scope, and what this item leaves alone

- **In scope:** the Moon mesh in the Sky zoom-out view on the Mother Earth page (`index.html` → `skyscene.js`).
- **Unchanged:**
  - The Moon tab (`moon.html`, `moonglobe.js`, `moonlight.js`, `moonsci.js`, `moonlroc.js`).
  - The Tides Moon (10b, closed decision).
  - The Sky scene file and its pin.
  - The Sun mesh.
  - Framing, the camera path, zoom, the layer hide-and-restore, Explore links, Back.
  - The hub (0.6.25), R2 and collectors.
- **The remaining checklist is untouched:** items 5, 6, 7 and 8 stay "to assess", 9 only inside the item it serves, 11 carried, 12a–c options, 13 outside scope. This proposal moves only 10a's status (to "assessed; proposal with GPT").

## 2. Current behaviour on main (`018102c`)

- **`skyscene.js` (517 lines, unchanged since the zoom fix):**
  - The Moon is `new Mesh(new SphereGeometry(1, 32, 16), material)`. The material is a harvested `MeshPhongMaterial` with colour black, specular black, shininess 0 and **emissive `0x9a9a9a`**. The code comment says "flat, unlit: diffuse black + emissive; no light from the Sun, so no implied phase".
  - Position comes from the scene file's calculated sub-lunar point and range at 00:00 UTC, through `globe.getCoords`. Scale is the true radius (1,737.4 km).
  - **No rotation is set.** A grey sphere has no visible orientation.
- **Requests:** off on load. The view makes ONE request when it opens (`/catalogue/sky/sky-scene-2026-11-R1` from the hub, sha256-pinned, shape-checked, paired with the distances card). Any failure means the view does not open.
- **Earth in the view:** every layer group and the day/night mesh are hidden (`hideLayers`), apart from the atmosphere. The Earth imagery keeps its own date, so the Earth is evenly lit.
- **Frame:** scene axes are Earth-fixed, from `getCoords`. The Sky suite takes three.js (x, y, z) as Earth-fixed (y, z, x) (`phase1/sky-zoom-ui.test.cjs`, `unitEcefFromThree`). The scene file's transform is IAU 2006 bias-precession plus GMST, with no nutation, polar motion 0 and UT1 = UTC. It agrees with ERFA within 0.0025° and with astronomy-engine within 0.0028° (Sources `#sky-scene`).
- **Sources `#sky-scene`** describes the Moon only as drawn "to scale". It says nothing about its picture or orientation, because there is none.

## 3. Measured: how the Moon is drawn today

Script `docs/research/moon-sky-texture/sky-moon-size.cjs`:
- Real `index.html`, `app.js`, `sky.js` and `skyscene.js` from main, real globe.gl 2.45.0, SwiftShader.
- Hub routed to the committed scene and distances files, as `sky-zoom-ui` does. Playwright clock fixed.
- Reads the page's own projected radius (`ME.zoomState().last`) and an independent one from the camera and the mesh scale. They agree on every row.
- Results: `sky-moon-size.json`, `shot-1280.json`, `shot-390.json`.
- Dates: 27 Nov 2026 (today), 24 Dec 2026 (nearest Moon, 356,779 km) and 7 Jan 2027 (farthest, 406,570 km), all in the scene file.

### 3.1 Moon radius on screen, CSS px (Earth's radius at stop B in brackets)

| Viewport | Stop A | Stop B (27 Nov · 24 Dec · 7 Jan) | Stop C |
|---|---|---|---|
| 360 × 740 | 2.6–3.3, **outside the frame** | 2.19 · 2.13 · 1.29 (Earth 5.5 · 5.3 · 7.0) | 0.47–0.52 |
| 390 × 844 | 3.1–3.9, outside | 2.57 · 2.45 · 1.62 | 0.57–0.66 |
| 721 × 900 | 2.2–2.7, outside | 2.71 · 2.55 · 1.80 | 0.55–0.73 |
| 1280 × 900 | 3.0–3.7, outside | 3.40 · 2.87 · 2.24 | 0.66–0.88 |
| 1920 × 1080 | 4.1–5.0, outside | 5.10 · 5.17 · 4.18 | 1.15–1.73 |

- **Device pixels:** headless runs used DPR 1. At DPR 3 (390 × 844, a modern iPhone) the renderer's pixel ratio read **2**, so the stop-B Moon is 5.1 device px in radius there. GPU work and visible detail scale with device pixels.
- **The framing changes with the date and the width**, so the size does not simply follow the Moon's distance (the 7 Jan row is smaller although the Earth looks larger).
- **Zoom** moves only along the bounded path, so **no guided position draws the Moon larger than about 5.2 CSS px in radius** at the widths measured.
- **Free orbit** turns the camera around the framing target at a fixed distance from it. That changes the Moon's distance only within the framing geometry (the target lies between Earth and Moon at stop B), but **free-orbit sizes were not measured**.

### 3.2 From which side the Moon is seen

At stop B the angle between the camera's line of sight to the Moon and the Earth→Moon line is **35.9–121.4°** across the 15 rows: 117° at 360/390 px today, 90° at 1280, 62° at 1920. At 0° the camera would see the near side; at 90° half near and half far; above 90° mostly far side. **An S1-style "near side towards Earth" picture would therefore show a large share of far side in this view.** That is correct, but it is not "the familiar face".

### 3.3 What the picture would look like at that size (offline estimate)

`docs/research/moon-sky-texture/sky-moon-illustrate.py` renders the map orthographically:
- The orientation is the one proposed in §5.
- The visible hemisphere is centred on the measured Moon→camera direction, with screen axes from the camera.
- It is supersampled 16× and box-averaged, close to an evenly lit, mipmapped emissive texture. Beside it are a flat-grey estimate and the **real crop of today's grey Moon from the page**.
- Panels:
  - `illus-1280.png` (1280 × 900, DPR 1; radius 3.4 device px; 50% of the visible disc is near side)
  - `illus-390.png` (390 × 844, DPR 3; 5.1 device px; 27% near side)
- The images are on the Mac with the review copy (hashes in §14), **not in the repository** (research stays text).
- **Reading:**
  - At 3–5 device px the textured disc shows brighter highland areas and darker maria in their true places. No crater or mare is identifiable.
  - The map is brighter overall than today's grey (map mean about (191, 186, 183) against `0x9a9a9a` = 154). Unscaled, the Moon gets brighter in this view (D4).
- **This is an estimate, not a page render.** The branch must replace it with real canvas crops (§10).

## 4. Shared assets

| File | Size | Pin | Today used by | Proposed use here |
|---|---|---|---|---|
| `assets/moon/lroc_color_2k.jpg?v=1` (NASA SVS CGI Moon Kit, 2048 × 1024, 0° longitude at the centre, east right, north up) | 457,942 B | sha256 `f7130a18…2170` (REGISTER, `assets/moon/SOURCE.json`, served manifest) | `moon.html`, `tides.html` | the picture, as an emissive map |
| `assets/moon/moon-light-2026-06-R1.json?v=1` (sub-solar and sub-Earth points, MOON_ME_DE440_ME421, every 6 h, 1 Jun 2026 – 1 Jan 2028) | 82,330 B | sha256 `a78c2f4b…b462` (pinned in `moonlight.js`) | `moon.html` ("Lit as now") | orientation only (§5); never lighting |
| `moonlight.js` (pure reader: `read`, `vec`, `ll`; no DOM, clock or network) | 52 lines | in the Animals suite's "same" list | `moon.html` | **not loaded by `index.html`** (decision D5: load it, or add a few lines inside `skyscene.js`) |

- **Same URL as the Moon and Tides pages.** A visitor who has opened either page can get the picture from the browser cache. GitHub Pages sends a short `max-age` (600 s), then revalidates.
- **Coverage:** the scene file covers 1 Jun 2026 – 31 Dec 2027. The sunlight table covers 1 Jun 2026 – 1 Jan 2028. Every scene sample (00:00 UTC) is an **exact** table sample (6-hour step from 00:00 UTC), so no interpolation is used. Verified for all 579 dates (`sky-moon-orient.mjs` stops on a non-exact sample).
- **Served-hash coverage:** the picture is in the reviewed LROC manifest (50 files). The sunlight table is **not**. The release manifest for this item would add it, and `skyscene.js` would change.

## 5. Orientation

### 5.1 Method (T-orient)

At the view's instant (00:00 UTC of the sample date):
- **Scene (Earth-fixed) frame:**
  - e_S = unit(−Moon position): Moon→Earth, from the scene file's sub-lunar point and range.
  - s_S = unit(Sun position − Moon position): Moon→Sun, using the scene file's **true** Sun range, not the drawn 200 Earth radii.
- **Moon-fixed frame (MOON_ME):**
  - e_M = the table's sub-Earth point (geometric).
  - s_M = the table's sub-solar point (light time and stellar aberration applied, per the table's conventions).
- **Rotation:** two-direction (TRIAD) fit, R = T(e_S, s_S)ᵀ · T(e_M, s_M), where T(p, q) has rows p̂, unit(p × q), p̂ × unit(p × q).
  - e_M maps exactly onto e_S, so the face turned to Earth is exact to the table.
  - s only fixes the roll about the Moon–Earth line.
- **Mesh rotation:**
  - Three.js `SphereGeometry` with u = (longitude + 180°)/360 places Moon-fixed (X, Y, Z) at mesh-local (X, Z, −Y). This is the convention `moonlight.js` already documents for the Moon globe.
  - The scene's three.js axes are Earth-fixed (y, z, x).
  - The mesh matrix is the product of these with R. It is set once per sample date: on entry and on a rollover.
  - **The branch must verify it on the picture itself, not on paper** (§10).

### 5.2 Independent check (done in this assessment)

`docs/research/moon-sky-texture/sky-moon-orient.mjs`; full rows in `sky-moon-orient.json`.
- **Reference:** astronomy-engine, built independently of both files:
  - IAU Moon pole and spin (`RotationAxis`), giving Moon-fixed → EQJ;
  - `Rotation_EQJ_EQD`;
  - apparent sidereal time, giving Earth-fixed.
- **Result over all 579 dates:**
  - **Rotation difference:** median **0.0038°**, 95th percentile **0.027°**, max **0.288°**.
  - **Phase angle** (Sun–Moon–Earth): 1.14–177.6°. Over the 60 dates with phase angle below 10° or above 170°, the worst case is 0.288°. Elsewhere it is ≤ 0.013°.
  - **Agreement between the two files:** the Sun–Earth angle seen from the Moon agrees between them within 0.006° on every date. That is the size of the aberration the table applies and the scene does not.
  - **Sub-Earth point, reference vs table:** ≤ 0.0056°.
- **Breaks** (`orient-breaks.txt`), each applied by a single replacement:
  - longitude mirrored: median 9.8°, max 173°;
  - fit directions swapped: about 180°;
  - spin dropped from the reference: median 90°.
- **Meaning:** these are agreements with a reference, not a claim of accuracy. On screen, 0.29° on a 5-px-radius disc is about 0.03 px. The fit's weak case near new and full Moon does not matter here.
- **Inherited limits:** the scene's transform has no nutation, polar motion 0 and UT1 = UTC (stated on Sources). The rotation inherits them; they are smaller than the figures above.

### 5.3 Not proposed

- **S1 (near side towards Earth, no libration):** it still needs a roll angle, which would have to be invented. It is not more honest and not cheaper once the table is read. Rejected in favour of T-orient.
- **Orientation from a new derived file** (for example 579 rotations baked into a small JSON): possible, but it adds an artefact and a build step for a 3–10 px object. Mentioned only for completeness.
- **Fallback with an invented orientation** if the table fails: no. If the orientation cannot be derived, the Moon stays plain grey (§7).

## 6. Lighting

- **L1 (recommended for this item): evenly lit, no phase.**
  - The material stays unlit: diffuse black, emissive map = the picture, emissive colour white, or scaled (D4).
  - Same rule as today's grey Moon and the Earth in the view. Same default as the Moon tab ("Appearance only … not how the Moon is lit today").
  - Wording on the page says so.
- **L2 (not in this item): a calculated phase from the Sun direction.**
  - At 3–10 px a phase would be the most visible thing on the Moon, more visible than the picture.
  - But the view's stated rule is "no light from the Sun, so no implied phase". A phased Moon beside an evenly lit Earth would also be inconsistent.
  - If Chad wants it, it is a separate item covering both bodies, with its own checks: the 200-Earth-radius Sun is placed along its true direction, so the direction is right but the drawn geometry is not.
- **Brightness (D4):**
  - (a) The map at its own brightness, as on the Moon tab: the Moon gets about 20% brighter than today's grey.
  - (b) The emissive colour scaled by 154/186 ≈ 0.83, so the disc's mean brightness stays close to today's.
  - Claude leans to (a), for consistency with the Moon tab and Tides, which use the map as is.
- **Colour space:** use the globe texture's own `colorSpace`, as Tides does (`tides.js`, `texture()`).

## 7. Loading and failure

- **Page load:** unchanged. Nothing new is fetched until the visitor opens the view.
- **On entry:**
  - The two files are requested in parallel with the scene file: same origin, `?v=1` (cache shared with the Moon and Tides pages).
  - Each gets the full bytes and has its sha256 checked against its pin. The picture is decoded from the checked bytes (blob or `createImageBitmap`); the table is checked with the same rules as `moonlight.js`'s `read`.
  - Timeout 10 s each, as the scene.
- **Never blocking:**
  - The view opens and frames exactly as today, with the grey Moon.
  - When both files are ready and the date has a sample, the Moon switches to the picture in place.
  - Late answers after Back or a rollover are dropped (token, as `load()` does).
- **Failure of either file** (network, pin, shape, decode, no Texture constructor available):
  - The Moon stays plain grey, as today.
  - One line in "How this is drawn": "The Moon's picture could not be loaded; it is drawn plain."
  - **The view still opens.** Its own failure rules for the scene file are unchanged.
- **Rollover while open:** the orientation is recomputed for the new date in the same update that moves the bodies (the existing "one update" rule). A date without a sample keeps today's "No computed position" state.
- **Contract text change:** the header comment ("Then ONE request") and Sources' "Data path" paragraph name the two extra files. The `sky-zoom-ui` check 8 ("exactly one scene request") is about the scene file and still holds.

## 8. Performance

| | Today | Proposed | How established |
|---|---|---|---|
| Bytes on first entry | scene file only | + 457,942 B picture + 82,330 B table = **+540,272 B** (less on a cache hit) | file sizes (measured) |
| Requests on entry | 1 | 3 | design |
| WebGL draws per frame | unchanged mesh count | unchanged (same mesh, new material map) | design; **to measure on the branch** |
| GPU memory | none for the Moon | one 2048 × 1024 RGBA8 texture with mipmaps ≈ **10.7 MiB** while the meshes exist | arithmetic (estimate) |
| Upload | — | one texture upload and mipmap build on the first frame after load | **to measure on the branch** (long-task timing at entry) |
| Fragment cost | ≤ about 100 device px | same pixels, one texture fetch each | negligible (estimate) |

- **Mipmaps:** a power-of-two texture (2048 × 1024) gets mipmaps by default. They are what makes a 3-px disc average correctly instead of shimmering, so the branch must check that they are on.
- **Sphere:** 32 × 16 segments is enough at this size. Keep it unless the close-up landmark test (§10) shows a visible distortion.
- **Memory after Back:** the meshes are kept for re-entry today. D6: keep the texture for re-entry (≈ 10.7 MiB GPU until the page closes), or dispose it on exit and re-upload from the HTTP cache. Claude leans to dispose on exit.
- **Idle redraw:** the globe already redraws continuously (checklist item 11). This item does not change that, and it is not a performance claim.

## 9. Attribution and wording (drafts for GPT; the final text goes into the branch)

- **"How this is drawn" in the view** (strip explanation), one added sentence: "The Moon carries the Moon page's map (NASA Scientific Visualization Studio, CGI Moon Kit; appearance only, evenly lit, not how it is lit today), turned as the Moon was at that instant. At this distance it is a few pixels across." Plus the failure line from §7 when it applies.
- **Sources `#sky-scene`:**
  - **Scale:** "…The Moon carries the same colour map as the Moon page (NASA's Scientific Visualization Studio, CGI Moon Kit), evenly lit (no phase), so it shows the Moon's appearance, not its lighting at that instant. It is turned to its calculated orientation for that instant (the same calculated table the Moon page uses for 'Lit as now', JPL DE440 via NAIF). At the stops it is about 3–10 screen pixels across, so the map shows light and dark areas, not features. Seen from the side, as the camera usually sees it, much of the visible disc can be the far side."
  - **Data path:** names both files and that each is checked against its pin.
  - **Agreement:** "Its orientation agrees with an independent model (astronomy-engine, IAU) within 0.03° on 95% of the dates and 0.29° at worst (near new Moon)." This is agreement, not accuracy.
- **REGISTER:** two extension lines, **each to be filed only on Chad's own line**:
  - NASA SVS CGI Moon Kit entry: "also shown on the Sky zoom-out Moon on `index.html`".
  - Sunlight table `moon-light-2026-06-R1` entry: "also read by `index.html` when the Sky zoom-out view opens, for the Moon's orientation only".
- **Credit:** "NASA should be acknowledged as the source"; no endorsement implied. Reuse terms as filed. No new source.

## 10. Tests planned for the branch (none run now beyond §3 and §5)

- **New suite `phase1/sky-moon-texture-ui.test.cjs`**, real page and SwiftShader as `sky-zoom-ui`:
  1. Nothing new is fetched on load, or on switching the card on. Entry fetches the two files once each.
  2. Pins: a wrong picture hash, a wrong table hash, a malformed table or a slow file (past the timeout) each leaves the grey Moon (emissive `0x9a9a9a`, no map), shows the failure line, and still opens the view. The scene-file failures are unchanged.
  3. Orientation, by mathematics: for every date in a fixed sample (including 21 Feb 2027, phase 1.1°), the mesh's world direction of the table's sub-Earth point equals Moon→Earth within 0.01°, and of the sub-solar point equals Moon→Sun (true range) within 0.3°.
  4. Orientation, on the picture: a test-only close camera, with the strip hidden, looks along the Moon→Earth line. Named landmarks are found where they should be in canvas pixels. The checks are those of `phase1/moon-globe.test.cjs` §D: Mare Crisium (16.18°N 59.10°E) darker than the highlands at 100°E; Tycho (43.30°S 11.22°W) brighter than Mare Nubium; Mare Orientale (19.87°S 94.67°W), seen from a camera turned to it, dark against its mirrored longitude.
  5. Real canvas crops at stop B (DPR 1 and 2) replace the §3.3 estimates. The crop's mean differs from the grey baseline as D4 predicts.
  6. Rollover while open: the orientation changes in the same update as the positions.
  7. Back restores everything as today. Under D6 = dispose, the texture is disposed and re-entry re-uploads it.
  8. No page errors. Draws per frame unchanged.
- **Deliberate breaks**, each proved applied (pattern found): no pin check (picture), no pin check (table), mirrored longitude, swapped fit, no rotation, rotation not updated on rollover, emissive not white or not scaled as decided, blocking entry until the picture loads, invented orientation on table failure.
- **Regressions:** `sky-zoom-ui`, `sky-ui`, `skycraft-ui`, `mobile-pass` (needs the orbital fixture), `desktop-overflow`, `smoke-fixes`, and the Moon suites only to show they are unaffected (no Moon-tab file changes).
- **Animals suite:** `skyscene.js` and `moonlight.js` are in its "same" list, and `index.html` and `sources.html` are pinned. A narrow pin-maintenance commit and an Animals rerun are expected.
- **Served manifest:** a new reviewed manifest (adds `assets/moon/moon-light-2026-06-R1.json`; changes `skyscene.js`, `index.html`, `sources.html`). The live check is built from that reviewed file, never from the tree.

## 11. Cost (estimates, to be measured on the branch)

- `skyscene.js`: about 80–120 added lines (loads, pins, fit, material swap, failure line, rollover, D6).
- `index.html`: the cache key for `skyscene.js`, and possibly one `moonlight.js` tag (D5).
- `sources.html`: one paragraph edit.
- New suite: about 400–600 lines.
- No hub, R2, Worker, collector or new external data. Bytes: +540,272 B on first entry only.

## 12. Decisions for Chad

| # | Decision | Options | Claude's recommendation |
|---|---|---|---|
| D1 | Do it at all | (a) proceed · (b) not pursued: 10a becomes a closed decision ("3–10 px in this view; the Moon tab shows the picture") | (a), with the size stated honestly; (b) is legitimate |
| D2 | Orientation | (a) T-orient (true, from the existing table) · (b) S1 (near side to Earth, roll invented) | (a) |
| D3 | Lighting | (a) L1 evenly lit, no phase · (b) L2 calculated phase, as a separate item for both bodies | (a) now; (b) only as its own item if wanted |
| D4 | Brightness | (a) map as is (≈20% brighter than today's grey) · (b) scaled to today's mean | (a) |
| D5 | Code reuse | (a) `index.html` loads `moonlight.js` (one tag; the Animals "same" pin holds since the file is unchanged) · (b) the few needed lines inside `skyscene.js` | (a) |
| D6 | Texture after Back | (a) keep for re-entry · (b) dispose on exit | (b) |

## 13. What GPT is asked to check

1. Whether §3's measurements and the "from the side" finding support D1(a), or argue for D1(b).
2. The orientation method and frame chain (§5.1), and whether §5.2's reference and breaks are sufficient, including the 0.3° tolerance near new and full Moon.
3. L1 as the lighting for this item, and the brightness question (D4).
4. The loading and failure design (§7): never blocking, grey on any failure, pins for both files.
5. The test plan (§10), especially the on-picture landmark test and real crops replacing the estimates.
6. The wording drafts (§9): that they say "appearance only", "turned to its calculated orientation", the size limit and the far-side point without overclaiming.

## 14. Evidence and limits

- **Repository:** `docs/research/moon-sky-texture/`:
  - `sky-moon-size.cjs` and results `sky-moon-size.json`, `shot-1280.json`, `shot-390.json`
  - `sky-moon-orient.mjs` and `sky-moon-orient.json`, `orient-breaks.txt`
  - `sky-moon-illustrate.py`
- **Mac review copy only** (images; research stays text in the repository):
  - `illus-1280.png` `13d0d78d…4c4c`
  - `illus-390.png` `bc3c5c6c…6e28`
  - `shot-2026-11-27-1280x1.png` `bf995f96…db34`
  - `shot-2026-11-27-390x3.png` `a4bd85c6…2ebc`
- **Environment:** container, headless Chrome with SwiftShader, globe.gl 2.45.0, astronomy-engine (npm, current), Pillow 12.3.0.
- **Not done:** a real phone, Safari, a screen reader or a hardware renderer, and no build of the textured Moon. The §3.3 pictures are estimates. Free-orbit sizes and texture upload time were not measured.
- **No data was downloaded.** Every input is a file already in the repository.

## Change log

- Rev 1 (27 Nov 2026): first assessment and proposal, for GPT's review.
