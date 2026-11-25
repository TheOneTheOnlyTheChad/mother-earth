# Tides explorer: Claude's implementation proposal

**Rev 1, 25 Nov 2026, 13:58 UTC (clock reading). Docs only.** Written by Claude (Tides thread) against GPT's "Tides explorer, spec rev 1" (24 Nov 2026), filed unchanged as `docs/concepts/TIDES-EXPLORER-SPEC-GPT-rev1.md` (sha256 `539ef06d…d927`, 17,595 B, from the Mac folder `Documents/ChatGPT/Mother Earth/`). Baseline: main `d85524f`. **Nothing is built, branched, fetched or deployed. No hub change is proposed.** Each decision in section 7 is Chad's; a build needs his own go.

Not part of this proposal: the later Sun reference-globe investigation (a separate workstream; nothing here depends on it or starts it).

## 1. Scope against the project rules (spec §10.1)

The spec fits the rules, with three points to name rather than assume.

- **A labelled mathematical model is allowed.** The constitution says "what is modelled or computed says so"; Chad's standing decision of 24 Nov 2026 allows models that are labelled as models. Precedents already live: the Sky Two Clocks card and zoom-out view ("Not observed"), day/night shading ("Computed"). Tides would carry the existing `Computed` evidence label and the spec's fixed line "Idealised tide model · Bulges exaggerated · Body sizes and distances not to scale · Not a tide prediction".
- **Two things are new for the project, and are Chad's to confirm (D1).** (a) Tides has no dataset at all: it is a mechanism view, where every other model on the site (wind, soil) is a published dataset. The 24 Nov lifecycle rules (period, source version, version checks) map onto a model version id (`tides-model-R1`), the reference-image dates and the six-month source check in spec §9. (b) "The site shows; it does not tell": this page explains more than any other. The explanation is physics with sources, no view on anything contested.
- **Page-only, like Night lights.** No hub route, collector, cron, D1 or R2 object. Running cost added: $0.

No rule conflict was found that changes the spec's meaning.

## 2. The three images (spec §10.2)

Read from main at `d85524f` and from REGISTER. No licence page was re-read for this proposal; the terms below are the ones already on file, and the two marked "to read" must be read directly before a build.

| Body | What the project has today | Finding |
|---|---|---|
| Earth | No Earth image is held. `index.html` asks NASA GIBS for a daily frame from the reader's browser (`VIIRS_NOAA21_CorrectedReflectance_TrueColor`, WMS, 2048 × 1024 JPEG, date = now − 36 h). REGISTER: LANCE/GIBS terms, cleared, one acknowledgment sentence. | **The live daily frame is a poor fit for this view.** The spec's default is an overhead view with the orbit plane on the equator, so the North Pole is in the centre of the picture. Measured 8 Nov 2026 (`reviews/evidence/2026-11-08-gibs-black-share.json`): everything north of 66°N was 100% black on all dates read (polar night), and missing swaths took up to 37% of the tropics on one day. From November to January the default view would open on a black disc. |
| Moon | `assets/moon/lroc_color_2k.jpg` (457,942 B, sha256 `f7130a18…2170`), `SOURCE.json`, REGISTER entry (NASA SVS CGI Moon Kit; credit "NASA's Scientific Visualization Studio"). | Reuse the same file, unchanged, same credit. No new request, no new rights question. Orientation as proven for `moon.html`; longitude 0 kept facing Earth as the Moon moves. No spacecraft, no "Lit as now". |
| Sun | No Sun image is held in the repo. The hub fetches one SDO HMI continuum picture an hour; `sunglobe.js` wraps the Earth-facing disc on a sphere, draws the rest plain ("outside this image's view"), and removes the picture at three hours old. REGISTER: SDO images "not copyrighted unless explicitly noted", non-commercial and public-information use encouraged, credit line asked. | The three-hour limit is our own freshness rule for a page that claims to show the Sun recently. It is not a rights limit. A dated reference copy is a different product and needs Chad's decision and a REGISTER line (D3). |

**Proposed (D2, D3): two pinned, dated reference images, held in the repo with hashes and credits.**

- **Earth reference:** one GIBS frame of the same layer and request shape as the Earth page, for a 2026 date chosen by measurement: of at most four candidate dates (around the June solstice and the September equinox), the one with the lowest near-black share north of 30°S. Saved unchanged as `assets/tides/earth-<date>.jpg` with `SOURCE.json` (request, date, bytes, sha256, credit, the measured black share). Cost: at most four interactive requests, once, from the browser pane. **To read before the build:** NASA's Earthdata data-use policy, directly, for keeping and serving a copy (REGISTER records GIBS as open under the LANCE terms; a retained copy has not been done before in this project).
- **Sun reference:** one picture copied from our own hub's existing route (`/snapshot/sunface/<id>/sun.jpg`), so no request goes to SDO. Wrapped at build time by a script that ports `sunglobe.js`'s projection and mask exactly (disc fit, B0, 0.97 mask, plain far side), checked against what `sunglobe.js` draws from the same picture. Saved as `assets/tides/sun-<file-updated date>.jpg` with `SOURCE.json` (hub id, SDO file-updated time, the fit numbers, our modifications, credit "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams."). In the scene the observed face points at Earth, which is where it was seen from; the far side stays plain and labelled. No mirroring or fill. **To read before the build:** SDO's rules page again, directly, for a retained and re-served copy.
- **What the page says:** "Reference images, not live: Earth, NASA GIBS, <date>. Sun, NASA/SDO, file updated <date>. Moon, NASA SVS appearance map. Moving the Moon does not change these pictures." Full records in a "Sources and method" disclosure.
- **If either read says no, or Chad prefers not to hold copies:** the smallest alternative per body is (i) the existing live route with its unchanged rules (GIBS daily frame; hub Sun picture with the three-hour rule), accepting the black polar cap and a Sun that is often plain, or (ii) a plain labelled body. No collector, cron or retention exception in any option.
- **Image failure:** each body falls back on its own to a plain sphere with its name ("Earth, image unavailable"); the model surface and every control keep working.

Image budget: Moon 458 KB (held). Earth and Sun sizes are unknown until fetched; target under 1.2 MB for all three, measured and reported at build.

## 3. The model (spec §10.3)

**Source read in full text (browser pane, 25 Nov 2026):** R. H. Stewart, *Introduction to Physical Oceanography*, §17.4 "Theory of Ocean Tides", LibreTexts copy, page last modified 11 Nov 2024, CC BY-NC-SA 4.0 (cited, not copied): https://geo.libretexts.org/Bookshelves/Oceanography/Introduction_to_Physical_Oceanography_(Stewart)/17%3A_Coastal_Processes_and_Tides/17.4%3A_Theory_of_Ocean_Tides . Stewart follows Pugh (1987, §3.2).

- Stewart expands the Moon's potential at Earth's surface in Legendre polynomials and keeps the third term as the tide-generating potential: V = −γM r² / (2R³) · (3 cos²φ − 1), with φ the angle from the Earth–Moon line. That is −(γM r²/R³) · P2(cos φ): the spec's P2 form. (The LibreTexts copy prints "e cos²φ" in that one line; the line above it and the later expansions give 3. Recorded as a typo in the copy.)
- He states the first term gives no force and the second is the uniform pull that keeps Earth in its orbit, and that the derivation "does not involve centripetal acceleration". This supports teaching point 1 as the spec words it.
- He gives the Sun-to-Moon ratio of the same coefficient as **0.46051**. Our own arithmetic from standard masses and mean distances gives 0.4595. Both round to the spec's **0.46**.
- **One step is ours, not quoted.** Stewart gives the potential, not the equilibrium surface height. The static surface that balances V against gravity is ζ = −V/g, so ζ = (γM r²/(g R³)) · P2(cos φ): about +0.36 m under the Moon and −0.18 m at right angles for the Moon alone (our arithmetic; Sun 0.16 m and −0.08 m). Stewart quotes Cartwright on the balance behind this (the horizontal force "has to be balanced by an opposing slope of the sea surface"). A direct quotation of the height formula sits in Pugh (1987) and similar texts that I could reach only as PDFs, which were not opened (D7).
- Not read by Claude: the five NOAA pages in spec §9. They are GPT's reads. The four HTML pages will be read directly in the pane before any page wording is final; the Swanson PDF stays GPT's read unless Chad says to open it.

**Implementation, as the spec proposes, with the numbers fixed:**

- q(n) = aMoon · P2(n · uMoon) + aSun · P2(n · uSun), aMoon = 1, aSun = 0.46; a disabled body's coefficient is 0. Summed before drawing. One pure file, `tides-model.js`, runs in the page and under Node (the pattern of `moonlight.js`), so the tested function is the drawn function.
- **Orientation.** North is the orbit normal; Earth's equator lies in the orbit plane (stated on the page as a simplification). The Sun direction is fixed. The Moon angle θ is measured from the Sun direction, counter-clockwise seen from north: 0° new, 90° first quarter, 180° full, 270° last quarter. Earth does not rotate and there is no clock.
- **Drawing.** Model surface radius = Earth radius × (1.12 + 0.08 · q), one constant for every angle and mode. q runs from −0.73 to 1.46, so the surface runs from 1.06 to 1.24 Earth radii and **never goes inside the globe**: lows stay visible as dips. A thin reference circle at 1.12 (the q = 0 level) shows what is above and below. Label: "Model surface lifted off the globe so its low parts stay visible." Exaggeration about 1.4 million times (0.08 Earth radii per unit q against 0.36 m), stated on the page as "greatly exaggerated", with the figure in the disclosure. 0.08 and 1.12 are provisional and may be tuned once in preview; they never vary at run time.
- **Check values the build must reproduce** (computed for this proposal): in the orbit plane, new and full Moon give high 1.46, low −0.73, range 2.19; quarter phases give high 0.77 (toward and away from the Moon), low −0.04 (toward and away from the Sun), range 0.81, which is 37% of the spring range and not zero. The pole value is −0.73 at every phase, which is why T5 is judged in the orbit plane.
- Not claimed: conserved water volume, lag, friction, basins, declination, distance changes, solid-Earth response.

## 4. Scene, navigation, files (spec §10.4)

**Scene: one globe.gl scene, no new dependency.** `tides.js` loads globe.gl 2.45.0 itself with the 12 s limit (the `moonglobe.js` pattern). Earth is the library's globe with the reference image and no layers. Moon, Sun, model surface, orbit ring and reference circle are added to the same scene with constructors harvested from the library's own mesh (the `skyscene.js` pattern; the bundle exposes no THREE global). The surface is a sphere mesh whose vertices are moved on the CPU by `tides-model.js` on each change (about 2,000 vertices). The Earth page's app, collectors and timers are not loaded. Lighting from the model Sun direction on all three bodies, with an ambient floor so Earth's geography stays readable on its night side.

**Rendering on demand.** The library's loop is paused (its `pauseAnimation` method, not used elsewhere in this project yet, so to be proven in the build) whenever nothing is moving and resumed during play, drag and camera moves. Evidence is a count of render calls, not an assertion.

**Controls.** A native range slider (0–360, step 1, with a spoken value such as "90°, first quarter"); a three-way radio group; four preset buttons; Play/Pause; Overhead/Angled; Reset. The Moon handle is a real focusable element drawn over the Moon with a 44 px target; it captures its own pointer, switches the camera controls off for the drag, and a cancelled pointer leaves the last angle. Camera orbit is bounded; no wheel or pinch zoom in the first slice, so the wheel always scrolls the page (D5). A polite status line is updated when a change ends, never per frame. Hidden tab: pause and stay paused. Reduced motion: nothing moves until Play is pressed.

**Fallbacks.** An in-plane cross-section drawn as SVG from the same model sits beside the scene at all times (the spec's permitted inset), and is the whole view when WebGL is missing, with the four presets and three modes still working. Without JavaScript: the explanation, the sources and one pre-rendered default cross-section, generated by a build script from `tides-model.js` with a `--check` mode so it cannot drift.

**Files (first slice, all new; no existing file changes):**

| File | Purpose |
|---|---|
| `tides.html` | Page: header as the other pages, scene, controls, five short explanations, "How this works", "Sources and method" |
| `tides-model.js` | The calculation only |
| `tides.js` | Scene, controls, fallbacks |
| `tides.css` | Page-scoped rules; the shared `style.css` is loaded unchanged (D6) |
| `assets/tides/…` | Two reference images with `SOURCE.json` each |
| `phase1/tides/build_tides.py` (or `.mjs`) | Sun wrap, default SVG, `--check` |
| `phase1/tides-model.test.mjs`, `phase1/tides-ui.test.cjs` | Suites with named breaks |

**Navigation: every surface that would need the link.** Six pages (`index`, `timeline`, `moon`, `sun`, `animals`, `sources`), each with a header tab row (five tabs) and a Menu list (six items): **twelve edits**, plus the tab breakpoints in `style.css`, which are tuned comment by comment for five tabs (compact below 480 px, 721–760 px, 1280–1365 px, promise line hidden below 1200 px). Three facts make this its own step:

- A sixth tab changes `index.html` and `sources.html`, which the Animals suite holds byte-identical to `SOIL_MAIN` `86071bf` (checks 13b, 13e; 13b also compares the header with an earlier main). That needs the same narrow, reviewed pin maintenance as the soil release, with the Animals owner.
- The unreleased Earth from Space branch also adds a sixth tab and carries the header suite for five and six tabs. Tides and Earth from Space together make seven. The header must be measured for six and seven, at phone width too, and agreed with that thread.
- Publishing the link is a release action.

**Proposed (D4):** the first build adds **no navigation link**. The page is reachable by its address on the branch preview only. Navigation comes as a measured, separate candidate before release.

**Local preview.** Branch `tides-rc`; a hash-checked copy in the Mac folder `_review/tides-rc/`, served by Chad's one Terminal command (`python3 -m http.server 8899 --bind 127.0.0.1` inside that folder) for GPT and the browser pane. Static files only.

**Network inventory, first slice with pinned images:** the page's own five files, the Google Fonts stylesheet and font files the other pages request, globe.gl from unpkg (one), three images from `assets/`. No hub, GIBS or SDO request; no timers; animation frames only while playing or interacting.

## 5. Acceptance evidence (spec §10.5)

| ID | Planned evidence |
|---|---|
| T1 | `tides-ui`: page loads at its address with the shared header. First slice: no existing file differs from main (file-list and hash check), so existing tabs and suites are untouched by construction. Navigation and its regressions (header suite at six and seven tabs, `desktop-overflow`, `mobile-pass`, Animals pins) belong to the later navigation candidate. |
| T2 | `SOURCE.json` hashes checked against the files by the build `--check`. Moon orientation: the seven Gazetteer centres already proven for `moon.html`, reused. Sun: wrapped reference compared with `sunglobe.js`'s drawing of the same picture; far side reads plain and labelled. Each image blocked in turn: plain named body, model still works. |
| T3 | `tides-model`: Moon only, q(n) = q(−n) within 1e-12 over a grid; rotating n and the Moon direction together leaves q unchanged within 1e-12; high 1, low −0.5. |
| T4 | Sun only equals 0.46 × the Moon-only shape for the same geometry; the display constants are read from the drawn mesh and equal in all three modes. Break: a per-mode magnification. |
| T5 | New = full within 1e-12 at every grid direction; quarter in-plane range 0.81 against 2.19, both from the drawn cross-section and the function; Both = Moon only + Sun only at listed directions. Breaks: per-frame normalising, two hand-drawn ellipses. |
| T6 | `tides-ui`: the same angle reached by slider, keyboard, drag, preset and playback gives the same model state and the same mesh; 359° to 0° is continuous; Reset returns the recorded initial state exactly. |
| T7 | Camera orbit and presets leave angle, mode and mesh unchanged; a Moon drag leaves the camera unchanged and does not scroll the page; lit side of each body agrees with the Sun direction at the four presets (pixel reads). |
| T8 | Text checks on the page at 1280 px and 390 px: the fixed model line and the all-ocean label are present and visible; no date, clock, "live", "now", metres or place name appears in the model area. |
| T9 | Keyboard-only run of every control with visible focus; reduced-motion context; hidden-tab pause that stays paused; pointer cancel mid-drag; touch scroll outside the scene; each image failing; WebGL removed (`getContext` returning null). |
| T10 | Request log against the inventory in section 4; render calls counted for five seconds while paused (expected: none); loading cost of `tides.html` against `moon.html` measured in the browser pane on Chad's MacBook, device and figures stated. |

**Real-browser checks, recorded separately:** the suites (software rendering, cloud workspace); the browser pane on the Mac at desktop and 390 px emulated; Claude in Chrome on the Mac's graphics. **Not covered by Claude: a real iPhone, Safari, a screen reader.** Those are Chad's or stay listed as not verified.

**Review order:** GPT reviews this proposal (model and source mapping, image plan) → Chad's decisions and go → branch build with suites and breaks → `_review/` preview → GPT rounds → Chad judges whether it teaches the mechanism and looks right → navigation candidate → Chad's Approve line for release.

## 6. Departures from the spec and things not done

- **Model surface lifted off the globe** (baseline 1.12 Earth radii) so lows show as dips. The spec asks for a rendering that reveals the full shape; this is the proposed answer, with the cross-section beside it.
- **No navigation link in the first build** (D4).
- **Left out of the first slice** (D5): tidal-force arrows, the small Earth-view phase icon, wheel and pinch zoom. Each is optional in the spec and can follow.
- **Own stylesheet for the first slice** (D6), against the project's one-stylesheet habit, to keep every existing page byte-identical until release.
- **Not done for this proposal:** no image fetched; no terms page re-read; NOAA pages not read by Claude; no measurement of the header at six or seven tabs; no prototype, so the globe.gl integration is a plan on the patterns of `skyscene.js` and `moonglobe.js`, not a demonstrated result. Feasibility of a branch-only first build with no hub change is expected, not established.

## 7. Decisions for Chad

| # | Decision | Claude's recommendation |
|---|---|---|
| D1 | Tides is a labelled, computed mechanism view with no dataset behind it. OK under the 24 Nov rule? | Yes |
| D2 | Earth image: pinned dated GIBS reference in the repo · or the live daily frame · or a plain body | Pinned reference, subject to the terms read |
| D3 | Sun image: pinned dated copy of one hub picture, wrapped as on `sun.html` · or the live hub picture with its three-hour rule · or a plain body | Pinned reference, subject to the terms read; REGISTER line on its own Approve at release |
| D4 | First build without navigation links; navigation as a separate measured candidate, agreed with the Animals and Earth from Space threads | Yes |
| D5 | Arrows, phase icon and wheel/pinch zoom left out of the first slice | Yes |
| D6 | `tides.css` for the first slice | Yes |
| D7 | Equation source: accept Stewart §17.4 plus the one stated step · or a go to open one PDF textbook source for the height formula | Accept; GPT to check the step |

## 8. Maintenance, if built

Six-monthly link and content check of the sources (first due May 2027), and a check whenever the Moon asset, the Sun route or image permissions change. Recorded in REGISTER with the last-checked date. No scheduled task is created by this proposal.
