# GPT review: Animals East Walker corridor proposal rev 1 (as relayed by Chad, 21 Nov 2026)

Filed as received (the attached file, unchanged below the line). GPT's text, not Claude's. Not Chad's approval of anything. Chad's message also carried GPT's short summary: bounded hold on method wording, geometry checks and the shared-globe contract; recommendations C-D0 yes, C-D1 A, C-D2 A, C-D3 A, C-D4 A with tested fallback B, C-D5 A; no build or release clearance.

---

Animals — East Walker corridor proposal rev 1: GPT review

21 November 2026 · Docs review only.

Proposal commit: 1e5c6d1123c35da4d8a799ce217dd55fcdcd1204.
File: docs/concepts/ANIMALS-CORRIDOR-PROPOSAL.md.
Verified SHA256: 92fac505958d2fb2fe5d1c165fff682efec535d735af454e9c5d4ffd69614fdc.

Verdict: BOUNDED HOLD on three corrections below. The selected herd, Medium/High-only design and visible omission wording are sound. This is not a rejection of the feature. Record the corrected contracts in the proposal and return the focused changes; no implementation or production authority is supplied by this review.

Evidence independently checked

Read the complete proposal, the pinned archive's East Walker projection and metadata, and the current Animals globe interface plus journey camera calls. All four inner-file byte counts and hashes match the proposal. An independent standard-library shapefile read and ellipsoidal inverse-Albers calculation reproduced:

Low: 84,582 points, 14 rings, 1 clockwise outer and 13 anticlockwise holes, net projected area 1,431.13194 km².

Medium: 27,966 points, 6 rings, 4 outer and 2 holes, net area 279.95576 km².

High: 20,623 points, 3 rings, 2 outer and 1 hole, net area 159.08099 km².
The Medium/High vertex extents agree with §3.2. Inverting all four projected bounding-box corners reproduces the metadata envelope to four decimals.

This confirms counts, signed areas and extents, not geometric validity or correct hole assignment. I did not run a topology, overlap or performance audit or validate an image overlay. No output data file was built or retained.

Hold 1 — explain the actual corridor method

Section 4.4 currently says each animal's migration maps are averaged across animals and the classes cut from that result. That confuses the corridor procedure with population-averaged utilization distributions.

The pinned XML's process description averages migration utilization distributions across sequences for each individual, rescales each individual distribution, derives its 99% footprint, and stacks those footprints. Corridor classes are based on the number of sampled individuals represented at a location. Population-averaging of individual utilization distributions is described separately for stopovers.

Use a plain sentence such as:
“The source models a migration-use footprint for each sampled animal, combines the footprints, and classifies areas by the share of sampled animals represented there.”
The technical details may describe within-animal averaging and the 99% footprint if useful. Keep the herd-specific Medium 10–20% and High >20% definitions from the attribute definitions and report; do not silently replace them with the generic process text's inclusive thresholds. The sampled animals are not the entire herd, and the areas are modelled use, not observations of animals occupying every point.

Hold 2 — qualify geometry preservation and tighten its checks

Keeping all vertices is a sensible first candidate. It avoids intentional simplification, but §9 C-D3's “nothing can vanish or change shape” is false: conversion, rounding, triangulation and rendering still need validation.

Change this to “No simplification; all source vertices are retained before rounding. Geometry and rendering are validated separately.”

Before the builder is assessed, specify:

Finite coordinates, at least three distinct non-collinear vertices per closed ring, nonzero signed area and preserved orientation.

Validity in the source and in the rounded result: simple rings; correct hole assignment; disjoint hole interiors; no overlapping outer interiors; an explicit policy for touching boundaries. Checking crossings alone does not reject containment/overlap errors.

A numeric rounding-displacement limit and a defined per-ring area-change bound with tolerances for comparisons against full-precision expected values. Approximately metre-sized coordinate spacing is not a positional-accuracy claim.

Independent projection evidence: the existing metadata-corner check is useful, but forward/inverse round-trip agreement alone can share the same mistake. K3 must use genuinely independent implementation/reference fixtures, not copied production formulas presented as independent.

Measured cross-class overlap and boundary relations in source and output, with a definition of meaningful overlap versus numerical noise. Stop/report unplanned topology changes; do not repair or silently discard parts.

K4 must test absence of Low geometry/class records, not treat every numeric component that happens to match a Low coordinate as forbidden. Decode all output geometries, require exactly the intended Medium/High rings, and show no Low ring/polygon/coordinate array is emitted. Shared numeric values are not evidence of leakage.

K9's hole assertion is class-specific: a Medium hole may legitimately contain High geometry. Prove Medium does not fill its own holes and High does not fill its own holes; do not require every hole to be blank of all classes regardless of measured source relationships.

No need to introduce simplification or a new datum transform to close this hold.

Hold 3 — define the shared-globe and late-load contract

An independent corridor switch is acceptable, but some tests currently conflict with simultaneous journeys. K10's blanket prohibition on other lines/markers must apply to corridor-owned objects, and K17 must remove only corridor-owned scene/UI resources. The existing journey's marker, trail and replay remain.

Specify who owns the camera, backdrop text and scene objects:

Explicit corridor activation / “Go to the corridor area” may move the shared camera; state that a journey can remain active off-screen. A journey's own explicit area action may move it back without changing corridor state.

Move/reveal once at the user's action, respecting reduced motion. If loading requires deferral, cancel that movement after a later selection, camera gesture or newer navigation action. A late geometry/image response must not pull the visitor back.

Corridor-off cancels pending geometry and regional-image work, invalidates their tokens and removes/disposes only corridor resources. Late success/failure cannot draw, announce, restore regional backdrop text or overwrite a newer state.

Bound image fetch and decode waits; validate the response; cap requests. No fetch on every pan, zoom, resize or animation frame. Specify cache/reuse behavior for repeated toggles.

Test regional image loading independently from geometry loading, off/retry races, context loss and a late whole-globe backdrop result arriving while the regional overlay is active. One module must not overwrite the other's date/status line.

Any globe/coastline changes needed for close viewing or independent drawing are declared and their existing tests rerun. “Journey scripts untouched” alone does not establish unchanged journey behavior.

Answers to the eight questions

Honesty: yes with Hold 1's method correction. Keep the visible Low omission and “Unshaded does not mean unused.” Label this as published modelled migration-use areas, never individual tracks, a full range or present-day occupancy.

Switch: recommend independent (C-D1 A), with Hold 3's explicit shared-camera behavior. A clear “Go to journey area” / “Go to corridor area” is preferable to automatically turning another evidence type off.

All vertices: recommend C-D3 A for the first candidate, subject to Hold 2 and measured rendering performance. Vertex count and compressed size do not establish rendering speed.

Datum: inverse Albers returns geographic coordinates on NAD83(NSRS2007); it is not itself a transformation to WGS84. Leaving the datum shift unapplied is acceptable for this contextual private preview if disclosed. Replace the unsupported local “order of a metre” accuracy implication with:
“Coordinates were inverse-projected in NAD83(NSRS2007), rounded to 0.00001°, and displayed on a WGS84 reference globe without a datum transformation. The local datum offset and absolute positional accuracy have not been established.”
A broad metre-scale background statement can cite NOAA, but is not a measured bound for this dataset, location and epoch. Do not promise one-metre alignment with imagery.

Regional GIBS: technically the same service supports a custom bounding box. Reusing the same layer/day does not require treating it as a different scientific dataset, but record the new regional request pattern in the source/release notes: exact layer, endpoint/version, CRS/axis order, box, image dimensions, date rule, timeout, request cap and caching. Requested pixel spacing must be distinguished from native imagery resolution. Do not identify cloud from a successful RGB response unless there is a validated method; say imagery may contain cloud/gaps, and reserve “unavailable” for a failed/invalid request. The dated image is context, not study-era habitat evidence.

Audit refinements: accept the bounding-box correction, independently reproduced. Accept withdrawal of the old visual inference about the outlines, but not an inference that these polygons were not grid-derived. The pinned process description explicitly describes grid-to-polygon conversion. Non-axis-aligned segments can result from projection/conversion; spacing alone does not determine provenance. Describe densely sampled outlines without asserting a new origin.

Other criteria: add “not a navigation, hunting/access or precise boundary product” to the wording constraints where appropriate; no new animal presence or habitat-change inference from the backdrop. Define K5's area tolerance, K23's scale tolerance and where the scale applies in a perspective globe. Recalculate or hide the scale when the view makes it invalid. Set measurable time-to-draw/frame reporting and a declared private-preview acceptance budget instead of “without visible delay.” K20/K22 must account for both an active journey and corridor. A global-only coastline fallback must not silently disappear or become misleading at close zoom.

Sensitivity: no additional enquiry is identified as necessary for a genuinely local/private preview of this already-published aggregate product. Omitting Low is a display choice, not proof the rest is insensitive. The private-preview label is not access control; establish whether branch assets/previews are actually publicly accessible before treating them as private. Public release still needs Chad's recorded sensitivity decision, Sources/REGISTER work and his approval. Do not add stopovers, winter range or individual routes under this proposal.

Recommended decisions after closure

C-D0 yes; C-D1 A independent switch; C-D2 A Medium/High only; C-D3 A all vertices with qualified rounding checks; C-D4 A regional imagery plus grid/scale as a conditional first choice, with B fallback if the stated proof fails and reported back; C-D5 A Stage 4 on animals-tab-rc. These are recommendations, not Chad's decisions or a build go.

External documentation checked

NASA GIBS Access Basics: https://nasa-gibs.github.io/gibs-api-docs/access-basics/

NASA GIBS Access Advanced Topics: https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/

NOAA NGS, Transformations Between NAD83 and WGS84: https://www.ngs.noaa.gov/CORS/Articles/WGS84NAD83.pdf

The official USGS full-text report is discoverable at https://pubs.usgs.gov/publication/sir20265123/full (a possible text route for Claude); direct retrieval returned 403 in this session, so the method correction above rests on the pinned local XML actually read, not a claim to have newly read the report in full.

Nothing built, merged, deployed or sent. Other Animals modules and Earth from Space work untouched.

