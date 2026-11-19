<!-- Chad's brief, filed verbatim 19 Nov 2026 -->
Mother Earth — Earth from Space
Feature proposal: dedicated top-level tab

GOAL
Give visitors a recent satellite view of Earth, centred on Africa, with clear observation times and an explanation of how the imagery is made.

PLACEMENT
Add “Earth from Space” as a separate top-level navigation tab, alongside the existing views.

It opens its own page—not a globe overlay, layer switch or panel inside Earth Now. Opening it must not change the interactive globe’s layer selections.

Include the tab consistently across all site pages. Account for the forthcoming Animals tab when designing navigation at desktop, tablet and phone widths.

FIRST RELEASE
Start with one Africa-centred Meteosat full-disk still image.

Investigate EUMETSAT’s GeoColour RGB product first:
- Catalogue: EO:EUM:DAT:0913
- Candidate EUMETView layer: mtg_fd:rgb_geocolour
- Verify the exact layer/catalogue match, access, current terms and attribution.

PAGE LAYOUT
1. Page title: Earth from Space.
2. A short description of the selected satellite viewpoint.
3. A large satellite image preserving the disk’s proportions and projection.
4. A clearly visible information strip:
   - Satellite and instrument.
   - Product name and plain-language colour description.
   - Observation time in UTC and image age.
   - Availability/update status.
5. Zoom in/out, reset view and original-source link.
6. “How this image is made” disclosure.
7. Credits, licence and Sources link.

IMAGERY EXPLANATION
Explain that the instrument scans Earth and combines spectral channels into a processed image.

For GeoColour, distinguish:
- Daytime approximately natural-colour imagery.
- Nighttime infrared cloud information over a static NASA Black Marble background.
- Nighttime city lights are not current observations.

Do not call the image an instantaneous photograph. Establish what its timestamp represents and retain scan start/end where supplied.

RELIABILITY
Follow Mother Earth’s hub-first collection and caching approach:
- Discover available source times and request an explicit frame time.
- Fetch each new frame once for the selected product/resolution; visitors receive our cached copy.
- Keep observation time separate from retrieval time.
- Validate image format, dimensions and content before publication.
- Reject blank images and service-error responses.
- Never relabel an older frame with a newer requested time.
- Retain the last valid image after failures, with its actual age and an honest delayed status.
- Distinguish normal source publication delay from a collection failure.
- Derive stale thresholds from verified cadence and delay.
- Load this imagery only on its own page; no imagery requests or animation processing on Earth Now.

ANIMATION
Still image first. Assess a short recent loop as the next step.

If included:
- Play/pause, scrubber and visible time for the displayed frame.
- Fixed projection, dimensions and colour processing across frames.
- Disclose missing intervals.
- No invented intermediate frames.
- Bounded frame count, retention and browser memory.
- No autoplay by default; respect reduced-motion preferences.

SOURCE AND COST INVESTIGATION
Before implementation, return:
- Verified Africa coverage and projection options.
- Native resolution versus proposed delivered image dimensions.
- Actual available cadence and measured publication delay.
- Automated access method, authentication and usage limits.
- Public display, caching, redistribution and commercial-use terms.
- Exact attribution and any third-party component requirements.
- Measured frame sizes.
- Estimated collection, storage, requests and delivery costs for still-only and animation.
- One paid alternative only if it offers a meaningful advantage.

BUDGET
The former $0-only restriction has been lifted. Prefer a suitable free source where it meets the need. Present any proposed recurring spend to Chad before committing.

IMPLEMENTATION ORDER
1. Read-only source/access investigation.
2. Concise recommendation, page layout and costed implementation plan for GPT review.
3. Private preview on a separate branch from current main, following Chad’s Go.
4. Relevant checks, including navigation with Animals present, failure states, timestamps, zoom and narrow layouts.
5. GPT review.
6. Chad’s explicit production approval before any deployment, schedule activation or merge that publishes the feature.

LATER
GOES, Himawari and DSCOVR/EPIC may become additional viewpoints within this page. Label their different perspectives, products and schedules clearly.

No spending, provider contact or production changes authorised by this proposal.