# Mother Earth — Moon globe and LRO science

25 November 2026. GPT initial assessment and proposal brief for Chad/Claude. Research only; no build, merge, upload to production, deployment or account test. Soil is active; Tides remains Chad's chosen next implementation. This brief does not change that sequence.

## Existing Moon view: already all-round

Independently opened the live Moon tab, selected Far side and observed the textured globe. Both the live page and local code identify the NASA SVS CGI Moon Kit LRO-derived appearance mosaic. Unlike the Sun's single Earth-facing image, it already covers near and far sides. The page explains that regions poleward of 70 degrees are filled from a lower-resolution map, and that the texture is tuned for appearance rather than quantitative measurement. The source page's indexed description identifies polar fill from the LOLA monochromatic laser albedo map; a full live read of the SVS page timed out in this check.

Local `assets/moon/SOURCE.json` records `lroc_color_2k.jpg`, 2048 x 1024, 457942 bytes, SHA-256 `f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170`, source last-modified 3 December 2025 and retrieval 13 November 2026. Those are provenance dates, not a claim that the whole surface was photographed on one day. This pass read the source record; it did not independently rehash the remote texture.

The existing Moon appearance needs no Sun-style far-side replacement. Preserve its orientation, lower-resolution polar disclosure, default even lighting and separate calculated “Lit as now” mode. Do not derive elevation, temperature or scientific reflectance from its appearance pixels. Its approximate 5 km/pixel equatorial detail is a display limitation, not a scientific grid suitable for new readouts.

## Existing LRO view

The live page shows a dated definitive-trajectory example, 10–11 June 2026, with one-minute samples, and an optional overlay of that same example on the Moon globe. It explicitly shows no current LRO position. Nominal altitude is above a 1737.4 km reference sphere, not above local terrain.

Adding science records does not require enabling an unvalidated current prediction. Preserve that existing boundary. A science observation can be synchronized to the dated path only after confirming actual product/time overlap, pointing and compatible frames. Otherwise use a separately sourced historical interval or show the surface record without a synchronized spacecraft marker.

## Public data feasibility

NASA PDS and the instrument teams provide real science data. Official archive pages and discovery tools were read; no numerical product or complete imagery collection was downloaded or validated in this pass.

| Instrument | Data/useful view | Interpretation to preserve |
|---|---|---|
| LOLA laser altimeter | Topography, gridded elevation and individual laser returns | A reference elevation product is not a photograph or a measurement made at the current spacecraft position |
| Diviner radiometer | Dated thermal observations and derived thermal maps | Distinguish channel brightness temperature from derived physical/bolometric temperature; local time, viewing geometry and aggregation matter |
| LROC cameras | Broad mosaics and detailed images of selected terrain | Show image observation dates, resolution and coverage; cannot turn the whole globe into uniformly high-resolution imagery |
| CRaTER | Radiation measurements at the spacecraft | Different spatial meaning from ground-looking instruments; exact units/detector/product interpretation must be assessed |
| LEND | Neutron measurements and hydrogen-related products | Hydrogen inference is not direct confirmation or a quantity of accessible water ice |
| LAMP | Far-ultraviolet surface observations, including shadowed regions | Different spectral view, not ordinary visible-light photography |
| Mini-RF | Radar observations and derived products | Radar signatures require product-specific interpretation; do not label every signal as ice |

Archive timeliness is product-dependent. The PDS pages inspected on 25 November list Release 67, dated 15 September 2026: new Diviner observations through 15 June 2026 and LOLA observations through 13 June 2026. LOLA's team node can update more frequently than the quarterly PDS copies. These are stated archive coverage limits, not independently checked last-valid-sample times or evidence that every instrument remains active. Do not present archive holdings as a live instrument health check.

Diviner's archive carries a warning about missing brightness-temperature fields and a `-9999` missing-value marker. That warning should be checked against the exact product/version chosen rather than assumed resolved. Missing is never zero kelvin. Use the relevant infrared/derived product and its calibration/quality documentation; do not treat all channels as interchangeable thermometers.

## Recommended first feature

An optional **What LRO measured** section in the Moon tab. Begin by assessing a manageable published LOLA elevation grid, with a colour legend and click readout against a named reference radius/datum. This is the strongest first candidate for giving the all-round Moon a scientifically meaningful additional layer. Validate product resolution, interpolation, missing cells and horizontal/vertical reference before choosing it.

Next assess a bounded Diviner temperature example: one documented map product or a short dated observation interval. A dated observation footprint or a map compiled for a particular local-time/statistical condition is useful; a generic “Moon temperature now” layer is not established by these archives. Keep measurement period and any currently calculated sunlight display visibly separate. No apparent synchronized thermal response to the current day/night control.

Detailed LROC regional imagery can follow as a distinct zoom/region feature. Do not make high-resolution images, radiation, hydrogen and radar all prerequisites for a first release.

## Proposal requirements for Claude

1. Inventory existing Moon/LRO assets and read current project records first. Preserve the finished globe, dated overlay and lighting behaviour.
2. Select exact candidate products and small real samples. Record product IDs/versions, DOI where provided, rights/attribution, observation/compilation intervals, units, projection/frame, longitude convention, grid registration, datum/reference radius, nodata and quality rules.
3. Measure size and processing cost. Prefer suitable precomputed science products over bulk raw archives. Do not download a full high-resolution global collection just to assess feasibility.
4. Propose a bounded elevation-first preview. Surface colour should represent the named quantity, not a hazard/safety score. If terrain displacement is proposed, state exaggeration and measure performance; a colour overlay is a smaller initial change.
5. Handle measurement footprints honestly. The spacecraft position, nadir point and detector footprint are not automatically the same location; obtain source footprints or sufficient pointing metadata before asserting where a timed observation was taken. Never infer a footprint solely from the drawn spacecraft marker.
6. For any trajectory pairing, verify the observation epoch, timescale and Moon-fixed frame against the definitive ephemeris. Keep current prediction out of scope unless separately requested and validated. Do not relabel above-reference-sphere altitude as clearance above terrain.
7. Keep multi-year gridded maps separate from individual pass records. Do not make the dated orbit slider imply that every mosaic value was measured on that pass.
8. Demonstrate near/far-side registration, seams and poles, selected-point readouts, gaps, image/data failures, keyboard access, narrow layout and paused rendering/network cost. Add meaningful source-value comparisons and malformed-input tests. Record phone-width and real-device checks separately.
9. Return the data assessment and implementation proposal before a build. GPT reviews; Chad approves release. Do not introduce a collector or hub change merely because data are public.

## Access

The PDS instrument pages and public ODE tools opened without sign-in. No mandatory account identified for the proposed initial assessment. ODE offers search/download APIs and asynchronous query jobs that use email notification; this pass submitted no job or email address. Prefer direct small samples where possible. Reuse terms still need product-specific recording; open browsing is not the same as a completed rights audit.

## Sources inspected

- Current live Moon page: https://theonetheonlythechad.github.io/mother-earth/moon.html
- NASA SVS CGI Moon Kit, local provenance plus indexed source description; full page timed out: https://svs.gsfc.nasa.gov/4720/
- NASA LRO instrument overview: https://science.nasa.gov/mission/lro/spacecraft-and-instruments/
- PDS LOLA archive and cadence: https://pds-geosciences.wustl.edu/missions/lro/lola.htm
- PDS Diviner archive, products and quality warning: https://pds-geosciences.wustl.edu/missions/lro/diviner.htm
- ODE tools and data-access formats: https://ode.rsl.wustl.edu/moon/tools.aspx
- LRO mission archive discovery: https://pds-geosciences.wustl.edu/missions/lro/

Screenshot saved beside this note: `MOON-FAR-SIDE-CHECK-2026-11-25.jpg`. The check was deliberately bounded to the Moon view and relevant data sources; no broad smoke test or release action.
