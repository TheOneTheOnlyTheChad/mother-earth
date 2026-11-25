# Mother Earth — Tides explorer, spec rev 1

24 November 2026 · GPT concept/spec for Chad and Claude · docs only

## 1. Intent and boundary

Chad wants a separate **Tides** tab: an interactive view explaining how the Moon and Sun produce tides. Reuse the visual identity and actual imagery of Mother Earth's existing Earth, Moon and Sun views. Let him move the Moon, compare the two contributions and watch the combined shape change.

This is a mechanism explorer for Chad's personal control centre, not a daily/live ocean display. It models an idealised equilibrium tide, not water measured around Earth. No real date, beach forecast, tide timetable, height in metres or navigation use is implied. The next deliverable is Claude's short implementation proposal; this document does not authorise a build, merge, upload, deploy or change to existing collectors.

## 2. First impression

Page title: **How the Moon and Sun shape the tides**.

One main scene: familiar textured Earth at the centre, Moon on a visible illustrative orbit, Sun visible in its indicated direction. A translucent, labelled model surface around Earth reveals the two-sided deformation. Earth remains recognisable and its geography stays visible. The scene should feel like the existing globe family, not three embedded pages or a flat replacement diagram.

Default: paused, both contributions enabled, new-Moon alignment, overhead view that makes the geometry legible. No automatic camera rotation. Start with a clear deformation and a short explanation, not a wall of controls.

Keep visible beside the scene:

> Idealised tide model · Bulges exaggerated · Body sizes and distances not to scale · Not a tide prediction

The ocean-model surface represents a hypothetical ocean covering the whole Earth, including where continents are drawn. Label that explicitly. Do not clip it to real coastlines and then imply the resulting shape is a coastal calculation. It is a model overlay, not a satellite-observed layer or a simulated flood over land.

## 3. Core interactions

| Control | Behaviour |
|---|---|
| Moon position slider, 0–360° | Continuous movement around Earth relative to the Sun direction; keyboard-accessible alternative to dragging |
| Drag Moon handle | Moves the same angle; visibly distinct from dragging the camera; pointer cancellation leaves a valid state |
| Moon only / Sun only / Both | Exclusive comparison modes; matching legend and explanatory text; same visual magnification in every mode |
| New Moon / First quarter / Full Moon / Last quarter | Set 0°, 90°, 180°, 270° respectively and pause playback |
| Play / Pause | Advances an illustrative phase cycle; pauses when hidden and stays paused on return |
| Overhead / Angled view | Reliable camera presets; optional bounded orbit controls, with an obvious return to overhead |
| Reset | Restores the complete initial state: angle, contribution mode, camera and paused playback |

Dragging the camera must not change lunar phase. Grabbing the Moon must not also turn the camera or scroll the document. Touch scrolling outside the scene continues normally. Do not capture the page's wheel by default; follow the project's explicit wheel-activation/release conventions if wheel zoom is offered.

Phase labels describe the illumination **as seen from Earth**. The scene's external camera does not itself show that viewpoint. Do not make the Moon appear uniformly dark at new Moon merely because of its phase label: light each surface from the model Sun direction. A small Earth-view phase icon is optional, clearly distinguished from the external view.

No calendar or “now” control. Playback position reads “Illustrative cycle: 35%”, for example, rather than an actual date. No claim of real orbital speed. Keep the Sun direction fixed in this Earth-centred teaching frame; Moon position changes relative to it. Fixed representative distances and a common plane are deliberate simplifications.

## 4. What the model must teach

1. **Why there are two bulges.** Lunar gravity is stronger on the near side than at Earth's centre and weaker on the far side. Relative to the centre's acceleration, the two sides are stretched apart. Earth itself is also being pulled; the far-side effect is not lunar gravity pushing water away.
2. **The Sun contributes too.** In this representative-distance model its tide-generating contribution is smaller than the Moon's. Do not confuse total gravitational attraction with the variation across Earth that generates tides.
3. **Alignment strengthens the variation.** New and full Moon produce the same idealised combined shape: larger high-to-low variation, called spring tides. “Spring” does not mean the season.
4. **Quarter phases reduce the variation.** At right angles the contributions partly offset in the orbital plane: neap tides. They do not cancel all tides, and the ocean does not become a perfect sphere.
5. **Real oceans respond differently.** Continents, depth, basin shape and weather alter actual water levels and timing. The real high tide at a coast need not occur when the Moon is overhead; daily patterns vary by location.

Keep these as short contextual explanations with a “How this works” disclosure for detail. Refer to relative model highs/lows, not an asserted high tide at a named place. Do not promise two equal high tides daily everywhere.

Optional “Show tidal-force arrows” illustrates acceleration **relative to Earth's centre**, with an explicit label. Such arrows are not ocean currents or trajectories. If included, derive them from the same model and show both stretching and sideways compression; do not draw only outward arrows or animate parcels flowing along them.

## 5. Proposed calculation for Claude to validate in the proposal

Use a leading-order, static equilibrium-tide model, adding the lunar and solar degree-two contributions. This is GPT's proposed mathematical implementation of the mechanism, not an equation quoted from the explanatory NOAA webpages.

For a unit surface direction n and unit direction u toward the relevant body:

    P2(x) = (3*x*x - 1) / 2
    q(n) = aMoon * P2(dot(n, uMoon)) + aSun * P2(dot(n, uSun))

Use aMoon = 1 and aSun approximately 0.46 for **Both** at fixed representative distances; set the disabled contribution to zero for comparison modes. Identify 0.46 as an approximate representative ratio, not a universal constant. The proposal must give a suitable technical source for the equation and the chosen approximation before implementation.

The display radius can be Rdisplay + k*q(n), with a single fixed k for all angles and modes. Positive and negative displacement are both meaningful. A fixed circular/spherical reference outline helps show change even where negative displacement lies inside the opaque Earth; a narrow model cross-section inset is acceptable if needed for clarity. Propose a rendering that reveals the full shape without hiding Earth or falsely turning every displacement into an outward swell.

Do not normalise every frame to the same maximum, change magnification at quarter phases, or add two hand-drawn ellipses. Those approaches conceal the variation the scene is meant to teach. Sum the contributions before drawing the combined surface. Keep the model stable when image assets fail.

This approximation has zero spherical-mean displacement to first order. Large visual exaggeration does not guarantee exact volume conservation; do not claim conserved physical water volume from the rendered shell. It is not a dynamic fluid solver. No friction, basin resonance, tidal lag, orbital eccentricity, declination, Earth elastic response or self-gravitation/ocean-loading correction is represented in rev 1. The orbital plane and equator may be aligned for this explicit idealisation; do not present that as Earth's actual geometry.

## 6. Imagery reuse and provenance

GPT inspected local `index.html`, `moonglobe.js`, `sunglobe.js` and `assets/moon/SOURCE.json` on 24 November. This was a bounded read, not a complete asset/licence audit or a live read.

| Body | Requirement |
|---|---|
| Earth | Reuse the current Earth globe's appearance and approved imagery route. Inventory its actual texture, date and credit first; do not assume it is an undated static Blue Marble or make the mechanism depend on a daily download. No earthquake/fire/ship/other layers in this view. |
| Moon | Existing `assets/moon/lroc_color_2k.jpg`, NASA SVS appearance map; use its existing SOURCE record and credit. It is an appearance texture, not live surface imagery or a new measurement. Preserve verified texture orientation; don't load spacecraft paths or the device-clock “Lit as now” mode. |
| Sun | Existing Sun view uses NASA/SDO HMI continuum through the hub and maps only the observed face; preserve its unseen-region treatment. No mirroring, wrapping the observed face around the back or AI fill. No flare or activity inference. |

Preferred first-slice asset strategy: use suitably licensed, explicitly dated reference imagery already held by the project, with hashes and credits, to make this explanatory view independent of live collection. Claude must establish whether the existing Earth and Sun images are available and permitted to be retained as such references. Existing live-serving rules do not automatically authorise an archival copy or bypass of freshness expiry.

If a pinned reference is not available within current permissions/storage rules, name that limitation and propose the smallest alternative: reuse the existing validated image-serving path with its unchanged freshness rules, or a labelled plain-body fallback. Do not quietly add a source fetch, collector, cron, retention exception or new Worker dependency. Chad can then choose before a build. The intent remains reuse of the real project imagery where available, not replacement with invented textures.

In every case, distinguish **imagery/reference time** from **model phase**. Moving the Moon does not replay the photographed Sun or Earth through time. Keep detailed image dates/credits in an accessible disclosure; mark a dated reference as a reference, never “live”. Source images are appearance evidence; the tidal shell is calculated.

## 7. Visual and technical scope

Reuse the project's colours, typography, buttons and navigation. Proposed top-level label **Tides**; dedicated `tides.html` or project-equivalent route. Claude should table all navigation surfaces that need a consistent link, including narrow layouts and menu fallback, rather than editing one page only. Publishing that link is a release action, not part of the docs stage.

Prefer a single rendering scene/context for the three bodies and model layer, reusing existing rendering dependencies where practical. Do not initialise the whole Earth app and its collectors just to borrow its texture. Verify globe/library coexistence and licensing; propose any additional dependency explicitly.

On desktop: dominant scene with compact controls and contextual explanation beside/below it. At 390 px: full-width scene, controls underneath, no sideways overflow and no floating explanation covering the Earth. Fit the bodies for teaching rather than literal distance; never move the Sun so close that the displayed positions are used to compute physical strength. Screen positions and representative physical coefficients are separate.

Render on demand while paused; animation only while playing or interacting. Stop offscreen/hidden work and release pointer capture properly. Honour reduced motion by starting and remaining paused unless explicitly played. Controls use readable names and visible focus; presets and slider provide all essential operations without dragging. Avoid a screen-reader announcement every animation frame.

Without WebGL, retain a labelled static schematic or equivalent accessible explanation and the four preset comparisons. Without JavaScript, retain the explanation, source links and a labelled default schematic if provided. Image failure should leave the mechanism usable with clearly named plain bodies. Do not misreport a fallback as a photograph.

## 8. Acceptance and review evidence

The proposal should map these to specific implementation checks and actual browser checks; do not merely assert visual similarity.

| ID | Must demonstrate |
|---|---|
| T1 | A separate Tides view and working navigation, with existing tabs/regressions unaffected |
| T2 | Familiar Earth/Moon/Sun imagery with source records, correct orientation and explicit unknown Sun regions; clear fallback for each asset failure |
| T3 | Moon-only two-sided deformation, rotational covariance and identical opposite-point values within a stated numerical tolerance |
| T4 | Sun-only deformation and the chosen approximately 0.46 coefficient, without changing display magnification |
| T5 | New/full combined equality; at quarter phases a reduced but nonzero in-plane range; combined values at selected directions equal the sum of the isolated values |
| T6 | Same physical state via slider, drag, presets and playback; wraparound continuous; Reset deterministic |
| T7 | Camera movement does not change the model; model movement doesn't accidentally move the camera; phase names and lighting agree with the declared convention |
| T8 | No “live”, measured height, real date or coastal prediction implied; model, scaling and all-ocean idealisation labels remain available at desktop/phone widths |
| T9 | Keyboard-only operation, visible focus, reduced motion, hidden-tab pause, touch/pointer cancellation, image failure and no-WebGL fallback |
| T10 | Declared network inventory: no unexpected source calls, collectors or timers; paused view avoids continuous rendering; before/after loading cost measured on a stated device |

For T5 the full 3-D surface need not become spherical at quarter phases: inspect the specified orbital-plane cross-section and directional values, not an assumed globe-wide scalar “tide height”. No local tide range readout.

Before acceptance GPT reviews the model/source mapping, imagery plan and branch preview; Chad judges whether the view communicates the mechanism and looks right. Local desktop at phone width is not an iPhone/Safari test; record each separately. Keep other pages' assets/behaviour unchanged unless a specific shared change is explained and checked.

## 9. Sources and maintenance

The following primary educational sources were opened/read by GPT on 24 November 2026. Use their relevant passages, not every numerical/date statement on the pages; this spec does not reproduce their diagrams or photographs.

- NOAA JetStream, **Tides**: https://www.noaa.gov/jetstream/ocean/tides — unequal pull relative to Earth's centre; local patterns and timing. Basis for the differential-force explanation, not an assertion that real bulges track the Moon without lag.
- NOAA NOS, **Tidal Variations — Influence of Position and Distance**: https://oceanservice.noaa.gov/education/tutorial_tides/tides06_variations.html — alignment, quarter phases and relative contributions. Fixed distances are a model choice; distance variation omitted.
- NOAA NOS, **What Affects Tides in Addition to the Sun and Moon?**: https://oceanservice.noaa.gov/education/tutorial_tides/tides08_othereffects.html — coastline/basin/weather limits.
- NOAA NOS, **Changing Angles and Changing Tides**: https://oceanservice.noaa.gov/education/tutorial_tides/tides04_angle.html — declination effects, explicitly omitted here.
- R. Lawrence Swanson, **Understanding tides**, Oregon State University Extension/Sea Grant, June 1977, held by NOAA: https://repository.library.noaa.gov/view/noaa/45665/noaa_45665_DS1.pdf — equilibrium-tide framing and approximately 46% solar contribution, pages 3–4 of the PDF. It is a historical fundamentals source, not current observed data.

Keep a compact sentence-to-source/model-assumption record with the proposal and final Sources entry. Add a technical source for the chosen equation. Preserve source title, link, passage locator and reading date. Treat later wording/model changes as reviewed changes. Proposed maintenance is a six-month link/content check, and a check whenever imagery permissions or shared assets change; do not create a scheduled task or automated scrape merely from this recommendation.

## 10. Claude's requested next deliverable

A short docs-only proposal against the current main baseline, before building:

1. Confirm this scope against project rules, especially explicit permission to show a labelled mathematical model rather than observed water; identify any rule conflict instead of silently changing the meaning.
2. Inventory the three assets and resolve the reference-image/freshness/retention question, with existing rights and any added cost or network request stated.
3. Confirm the model equation against a technical source; state coefficients, orientation convention, rendering exaggeration and how negative displacement remains legible.
4. Choose the scene integration, navigation edits and local preview route; list actual files/dependencies, accessibility fallback and performance measurements.
5. Map T1–T10 to planned evidence and identify departures needing Chad's decision. Propose a branch-only first build with no hub change if feasible; do not treat that feasibility as already established.

No new live astronomy feed is needed for the mechanism. There is no need to coordinate a hub deployment merely to write this proposal. Later execution and release stay on Chad's own lines.
