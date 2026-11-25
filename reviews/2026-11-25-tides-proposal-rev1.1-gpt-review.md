# Mother Earth — Tides proposal rev 1.1: GPT review

25 November 2026. Independent proposal review; not Chad's approval.

## Verdict

**REVISE FIRST, with the core model accepted.** This is a short documentation correction round, not a request for another assessment or a different design. The P2 model, check values, fixed exaggeration, always-visible cross-section and separate navigation candidate are sound. No branch build, asset acquisition, merge, deployment or hub change is authorised by this review.

Reviewed Mac copies supplied as main `801226e`:

- `docs/concepts/TIDES-EXPLORER-PROPOSAL.md`, rev 1.1, SHA-256 `22fd4435e8e673de1b8c44351bef517476af9803b4a9c93b507601ebe604d957`.
- `docs/concepts/TIDES-EXPLORER-SPEC-GPT-rev1.md`, SHA-256 `539ef06d7da603a7c8d761dc4ceebc5b214dae3e251e653a92f3f73c3b66d927`.

This review checked those file hashes, the model arithmetic, the local November GIBS black-share evidence, Stewart's HTML section, accessible later Fitzpatrick sections and the official GIBS/SDO guidance described below. It did not verify remote Git HEAD, fetch image assets, run page suites or inspect a working Tides scene. There is no implementation yet.

## Required corrections for rev 2

### R1 — Correct the Earth-image justification

The November evidence supports a black northern polar cap in the sampled daily imagery. It does **not** support an entirely black north-facing Earth disc, nor prove that every daily frame from November through January will behave identically. The cited file samples 4–7 November; its north-of-66° band is black. In an ideal north-polar orthographic view that cap occupies about 16.5% of the projected disc, not 100%.

Replace the whole-disc/whole-season claim with the measured statement. A pinned reference remains a reasonable choice because predictable, dated appearance suits an untimed mechanism view. It does not need an exaggerated problem with the live image to justify it.

Keep the proposed ceiling of four candidate Earth-image requests. Judge candidates in the actual Overhead and Angled views as well as by the recorded black-share statistic: an unweighted share north of 30°S alone is not a measurement of the visible disc. Do not fetch candidates merely to revise the proposal.

### R2 — Put the potential-to-height derivation in the method; close D7 technically

The step is sound with the stated negative gravitational-potential convention. For a rigid spherical Earth, constant surface gravity and a small static displacement:

`Phi0(R + zeta) + Vt(R, n) = C`

Linearising gives `g*zeta + Vt = C'`. The degree-two tide-generating potential has zero spherical mean; choosing zero mean displacement gives `C' = 0`, hence `zeta = -Vt/g`.

The negative P2 coefficient in `Vt` therefore gives a positive P2 coefficient in height. Label this as our short derivation from the equilibrium/equipotential condition, with its assumptions. It is not a quotation. A directly quoted height formula or another PDF is **not required** to validate this step.

This is the rigid-Earth, non-self-gravitating test-ocean illustration. It does not include elastic Earth response, ocean self-gravity/loading or dynamical tidal response. Do not accidentally import those corrections from a more complete source.

D7 should record “GPT checked and accepted the derivation; method documented”, rather than ask Chad to choose whether an equation is valid. Any approximate metre values retained in the disclosure need reproducible constants and units; alternatively omit these unnecessary physical-height examples. The model display itself should keep the dimensionless values and no metre claims.

### R3 — Correct rendering and image gates before the build brief

- The Sun is self-luminous: render its reference image emissively/unlit. Earth and Moon illumination follows the model Sun direction. Do not use the artificially compressed display distances to create misleading nearby-point-light illumination. Update T7 accordingly; the Sun has no externally lit day/night side.
- The static reference-image plan is supported in principle. Record the source guidance and any asset-specific notices before retaining/serving the selected assets. The SDO page expressly encourages credited informational imagery use, while separately imposing rules on scientific use and value-added data products. Describe the offline reprojection as a modified display texture, distinguish it from a scientific data product, and explicitly record how the relevant provisions apply. If the intended transformation would fall under a provision requiring contact, bring back that concrete issue; do not send an enquiry during this review.
- The official GIBS documentation provides open-sharing guidance and a requested acknowledgement. The separate Earthdata policy page returned 403 in this review, so do not record it as read by GPT. Claude's outstanding direct policy read remains an asset-preparation gate, not evidence already obtained.
- Preserve the original Sun source identity/hash, available time metadata, transformation parameters and output hash. A file-updated timestamp must remain labelled that way; it is not an inferred observation time. If the existing hub route has no available image, use the documented fallback or return the asset choice to Chad. Do not start a collector or bypass route freshness rules to obtain one.

## Model and rendering findings

The sum `q = P2(n.uMoon) + 0.46*P2(n.uSun)` correctly represents the proposed idealised shape. Independently checked, for **Both** mode:

| Geometry | In-plane maximum | In-plane minimum | Range |
| --- | ---: | ---: | ---: |
| New/full | 1.46 | -0.73 | 2.19 |
| Quarter | 0.77 | -0.04 | 0.81 |

The quarter range is 36.986% of the spring range. The polar value is -0.73 at every phase **in Both mode**. It is -0.5 for Moon only and -0.23 for Sun only. State that qualification in the checks.

The proposed radius formula gives 1.0616–1.2368 Earth radii. Lifting the illustrative surface is acceptable provided the 1.12 zero reference is clear in the 3D view and cross-section, and the label explains why it floats above Earth. “Low” means below that reference, not below the textured globe. Keep one fixed baseline and scale across every angle and mode; any preview tuning must be frozen and reported. The proposal correctly disclaims conservation of water volume.

Stewart supports the equilibrium illustration and solar coefficient. The accessible Fitzpatrick harmonic expansion independently supports the P2 form. Removing the uniform acceleration relative to Earth's centre is a suitable explanation; avoid turning the two authors' different reference-frame descriptions into a contradiction.

## Acceptance mapping and navigation

T1–T10 are a useful plan. Make these clarifications in rev 2/build brief:

- **T1 is staged, not complete in an unlinked preview.** A top-level Tides tab remains part of the intended release. The later navigation candidate must cover the actual combined header state, Animals pin maintenance and existing navigation behaviour. Coordinate with Earth from Space without starting or clearing that workstream.
- **T2:** comparing the new Sun texture with the old renderer proves consistency, not independently correct orientation. Add an explicit orientation/face/mask check for the chosen image and record its limitations. Image failure must not remove the mechanism.
- **T6:** test exact periodic equality at 0°/360°, and bounded change across adjacent samples around the wrap. 359° and 0° are not identical states. Use numerical tolerances when playback reaches an angle between slider steps.
- **T7:** include the corrected illumination requirement above and keep camera/angle isolation tests.
- **T8:** the model has no clock or calendar. Reference-image dates belong in the disclosure. Ensure a copied shared header does not introduce a running UTC clock into this otherwise untimed page.
- **T10:** count zero steady-state renders after controls/damping have settled. Camera moves, resize and asynchronous image completion must still produce their necessary final frame while the model is paused. Verify mesh normals/bounds after deformation and report actual request/render measurements. These are preview proofs, not prerequisites for writing rev 2.

No real iPhone, Safari or screen-reader claim follows from emulated width or cloud software rendering. Keep the proposal's explicit coverage limits.

## Chad's decisions, reframed

- **D1:** record the existing instruction and standing acceptance of clearly labelled models. Chad already requested this mechanism view. Do not ask him to approve that principle again. Say “no observed tide dataset is used”, rather than “no dataset at all”.
- **D2:** support the bounded, pinned Earth-reference plan, with corrected rationale and source record. Chad chooses pinned/live/plain.
- **D3:** support a dated, credited Sun reference with the source/transform record and fallback above. Chad chooses pinned/live/plain.
- **D4:** support an unlinked branch preview followed by a measured navigation candidate before release. This does not abandon the top tab.
- **D5:** support omitting the listed optional arrows, phase icon and zoom in the first slice. Chad can request them if the preview needs them to teach clearly.
- **D6:** a page-scoped stylesheet is a routine implementation choice; support it. It need not become a separate permission barrier.
- **D7:** technical review closed as above; document the derivation.

After these documentation corrections, seek Chad's concrete image/scope choices and his branch-build go. A build go is not release approval. There is no need to expand into Parker, Sun reference-globe research, live tide predictions or another Nature-context workstream.

## Sources checked

- Stewart, section 17.4, full HTML: https://geo.libretexts.org/Bookshelves/Oceanography/Introduction_to_Physical_Oceanography_(Stewart)/17%3A_Coastal_Processes_and_Tides/17.4%3A_Theory_of_Ocean_Tides
- Fitzpatrick, harmonic expansion: https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node164.html ; total potential: https://farside.ph.utexas.edu/teaching/336L/Fluidhtml/node168.html . The proposal's node163 timed out for this reviewer; its pasted text is not claimed as independently retrieved. These sources plus the explicit equilibrium derivation support the finding above.
- Official GIBS guidance and acknowledgement: https://nasa-gibs.github.io/gibs-api-docs/#data-use-guidance-and-acknowledgements . Linked Earthdata policy returned 403.
- SDO data rights/rules, including informational-image use and separate scientific/value-added-product rules: https://sdo.gsfc.nasa.gov/data/rules.php
- Local evidence: `reviews/evidence/2026-11-08-gibs-black-share.json` in the Mother Earth Mac mirror.

No implementation or release clearance is implied.
