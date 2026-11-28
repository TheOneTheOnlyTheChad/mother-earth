# Mother Earth — LAMP D6 registration evidence review

28 November 2026 · GPT independent review for Chad and Claude. Main `ffd182f`; report `reviews/2026-11-28-moon-lamp-d6-registration.md`, script and output in `docs/research/moon-lamp/`; retained LOLA/LAMP inputs on the Mac. No new acquisition, page build, merge or deployment.

**Verdict: the declared fine-registration test remains INCONCLUSIVE. The evidence supports reading B and is sufficient to proceed to a bounded page preview on Chad's go, with corrected claims. It does not establish a 240–480 m registration bound. Do not call D6 a fine-registration PASS.**

Recommend a modified option (a): retain the documented transform, apply no empirical shift, state the unresolved fine registration, and continue with the approved 960 m archive view. No further threshold-tuning exercise or new data acquisition is necessary merely to build that preview. Release remains subject to reviewing the implemented coordinate/lookup/rendering checks and honest limitations.

## Independent checks

- The retained DEM is 29,062,688 bytes, SHA-256 `d031efe2611b17dfbf3c158f5e15dc04cd5719349dcbf6384bb21fd97697c490`. The seven base64 document contents reproduce their recorded SHA-256 hashes. Read the retained DEM label and DSMAP equations. The label supports int16 little-endian DN×0.5 m, the reference radius, dimensions, DE421 ME frame and even-grid pole registration used by the script.
- Independently recomputed all five crater depth diagnostics under all eight symmetries with standard-library Python. Every rounded result matches the report, including the documented-transform mean **2,126.8 m** and next-best **1,519.2 m**. This corroborates the metadata/landmark orientation, not absolute map accuracy or exact crater-centre positions.
- The LAMP-to-DEM **655.5-pixel** index difference follows from the two array sizes and pixel-centre conventions. It is a grid-registration fact, not a measured physical shift. The script's bilinear sampling at that expected half-pixel offset is consistent with those conventions.
- Verified the recorded output SHA-256 `9e75a6c24e55c2251b01c5b5e88aa8ca8419bffd8b469041df7d89d6254e30a0`. Inspected the score generation, usability gate, summaries and controls. Both declared features have zero usable tiles. The post-hoc table matches the output.

I did not independently rerun the full NumPy tile-correlation pipeline. My numerical replication concerns the landmark tables and geometry, not an independent reproduction of all NCC score surfaces. No browser or rendering test was part of this review.

## What the evidence supports

The documented DEM forward transform, LAMP's descriptive map orientation, the previous coarse peak/height diagnostic and the new later diagnostic all favor B over the tested wrong symmetries. That is useful corroboration of orientation and terrain correspondence.

The later analysis is correctly labelled post-hoc. The dominant albedo/slope lag is (−1,+1) native pixels in 37 of 67 usable diagnostic tiles, about **339 m** in vector length. Known artificial shifts move that pattern as expected, and the wrong-symmetry/shuffled cases do not reproduce the cluster. This supports sensitivity to correspondence between the two maps. Keep the separate declared and exploratory outcomes.

The weak peak-mask feature does not agree on the east–west lag. No estimated shift should be applied.

## Required record correction before the page build

Remove or replace the following statements wherever carried forward:

- “registered within about 1–2 pixels (240–480 m)”;
- “within 2 pixels, unresolved below” as a settled outcome;
- any statement that D6 established fine registration or an upper error bound.

A correlation mode is not an upper bound on position error. In the report's own top-three table, another **14 of 67 tiles** peak at (−1,+2) or (−2,+1): those vector lengths are about **537 m**, already greater than 480 m. Other tiles are not summarized by those three modes. More fundamentally, albedo and slope are different quantities, so the best correlation lag can reflect their physical relation, common processing or biases rather than positional error. Recovery of known injected shifts establishes relative sensitivity; it does not establish the true unshifted geographic error.

Suggested replacement:

> The documented map orientation is supported by landmark and terrain comparisons. A later exploratory albedo/slope diagnostic shows a small-lag cluster that follows artificial shifts, but the declared fine-registration test was inconclusive. Fine positional error is not quantified. No shift is applied.

Use that in the D6 report, proposal/checklist/current status and eventual Sources. Do not relabel the diagnostic as an accuracy estimate merely because 960 m cells and the globe texture are coarser. The 960 m figure is aggregation spacing, not an error budget.

## Method qualifications to preserve

- Describe the failed usability criterion as a plausible test-design limitation, not proof that a true sharp correspondence must exist. The observed result is “did not discriminate at these settings”. A MAD of neighboring candidate-shift scores is not a calibrated error distribution for geographic registration.
- The report's proposal-based outcome wording needs a small procedural clarification: the implementation permits a PASS on one feature with five tiles/three quadrants, reporting two-feature agreement rather than requiring it. Proposal §5.4 stated both features agreeing. Document this execution-rule refinement and when it was set. It has **no effect on this result**, because zero tiles passed either feature.
- The exploratory diagnostic uses a different window and summary; keep it visibly separate from the declared test and its controls. Do not pool the two as if they independently passed a common criterion.
- Option (b)'s bootstrap of a correlation peak could estimate variation in that chosen statistic under its resampling model. It would not by itself establish geographic registration accuracy or remove systematic albedo/terrain offsets. I do not recommend it as a way to obtain a pass now.

## Preview follow-through

Carry the passed rev 2 proposal and its recheck notes: padded grid/origin, model-dependent quantity, outlier retention/disclosure, numeric plane separate from colour clipping, state distinctions and rounding/top-bin semantics (56 rounded top-bin cells versus 55 unrounded means ≥0.08). Keep the source transform fixed at B with no fitted translation.

The preview should test exact index/geographic transforms against independent known coordinates, padding, the fractional pole, cardinal directions, wedges, source-cell lookup and deliberately reflected/rotated/shifted implementations. These are implementation-registration checks, not a claim that a geophysical cross-correlation has validated absolute precision. Reuse the coordinator's loading, timeout-through-commit, cancellation, cleanup and atomic replacement protections.

No new DEM, no north acquisition, no hydrogen/water inference, and no further broad assessment is requested before this preview.

Suggested owner line, if Chad chooses:

“Accept D6 as assessed but inconclusive for fine positional accuracy, with reading B retained and no shift applied. Correct the unsupported 240–480 m bound in the records as GPT requests, then build the page-only LAMP preview under proposal rev 2 and GPT's recheck notes. Return the exact branch candidate and evidence for GPT review. No new acquisition, merge, deployment or hub change.”

This is a draft for Chad, not authorization from GPT.
