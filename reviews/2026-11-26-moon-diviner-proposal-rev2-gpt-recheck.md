# Moon Diviner proposal rev 2 — GPT recheck

26 November 2026, South Africa. Supplied main `eeedf40`; read current Mac proposal rev 2, SAMPLES §6.7 and revised assessment script directly. No fresh remote HEAD verification in this round.

## Verdict

**PASS as a proposal for the first-band acquisition trial.** The substantive R1–R5 findings are closed at design level. Support GCP noon/midnight, one-hour windows, policy latitude masks subject to the global report, generated textures, kelvin with Celsius secondary, and counts with correctly defined ranges.

This pass is not permission for acquisition, the remaining 17 bands, a page build, merge or deployment. The next concrete action for Chad to approve is D4a: one 00N–10N band, about 156 MB, with streaming, source integrity, sample comparisons, memory/timing evidence and a durable checkpoint. D4b follows the trial report. Moon remains active; Sun waits.

## Independent checks

- Verified all 14 sample hashes from the script's EXPECTED map, resolving the two-folder Mac layout.
- Independently inspected all 134,400 sampled GCP records: fixed 113-byte records, CRLF, 11 numeric fields, finite Decimal temperatures in the proposed accepted domain or exact special constants.
- Confirmed exact extraction of every sampled tbol value as an int32 scaled by 10,000, including empty/invalid sentinel representations. This supports the proposed lossless-retention format on the samples, not yet on full source bands.
- Verified the stated raw binary size: 64 + two 518,400-byte planes + four 259,200-byte planes = 2,073,664 bytes; offsets are consistent.
- Inspected fail-closed hash/layout flow in the revised assessment script. Did not rerun its numpy-dependent full statistics or Claude's eight mutation runs. Previous independently reproduced count/range statistics remain applicable; no new data changed those findings.

## Closed design findings

- R1: the statistic is explicitly our unweighted mean of available published bin temperatures, separate from the archive's radiance-processing step. Counts are always shown, range is unavailable for n<=1, and no-valid-data/withheld/valid are distinct.
- R2: acquisition is sequential and streaming, with incremental hash validation, per-band durable checkpoints, restart at whole-band boundaries, bounded retries and no incomplete global publication. Retention is now an explicit choice. Full-bin extraction supports later tbol windows without claiming to preserve unretained channel measurements.
- R3: one coordinator owns the science-mode lighting memory across height/temperature/mode transitions; replacement loads preserve the active map; stale requests cannot commit; Earth-view non-restoration is explicit in §5 despite shorthand in the summary.
- R4: explicit header, order, byte lengths, sentinel consistency, physical plausibility bounds labelled as our checks, mask policy, fixed scales and clipping disclosure. Global distribution review occurs before freezing masks/scales.
- R5: related-product comparison is corroboration, with coordinate tests and origin/flip controls carrying registration claims; alternatives are described as unsuitable for this chosen display rather than scientifically unusable; source hashes and structure now fail closed.

## Small implementation notes, not a new proposal round

1. **Range cap wording:** the encoding defines code 254 for source ranges >=253.5 K, whereas the draft readout says “254 K or more”. Use “at least 253.5 K” / “>=253.5 K (display capped)”, or change the encoding threshold consistently. Keep the rounding disclosure. This is a documentation/codec boundary correction to carry into implementation.
2. **Atomic-state details:** when the active science layer is switched off while another target is pending, cancel/invalidate that pending request so a late completion cannot reopen science mode. On a failed noon/midnight change, restore the selected radio label to the map actually displayed. These follow the existing latest-token/displayed-state contract and need focused tests.
3. **Coordinate checks:** anchor each whole band's origin, latitude limits and first/last records to its expected identity, not only regular coordinate increments inferred from the data. Use explicit tolerances for printed local-time values. Do not rely on numpy's default relative tolerance as a claim of exact decimal matching.
4. **Retention:** define extraction order, endianness, dimensions/scaling/sentinels and per-band provenance in a small schema/record before calling retained bytes reusable. Checkpoint completion requires the output to exist durably and be re-hashed, as already proposed. A compact lossless extraction retains tbol bins, not all original GCP channels or the original ASCII file.
5. **Hashing and memory:** pin the chosen incremental hash implementation; test varied chunk boundaries and empty/final chunks as well as known vectors. Measure approximate JS heap with its limits stated; it is not total process/GPU memory. No whole-file text or response buffering should be hidden inside a nominally streaming pipeline.

## Recommendations for Chad

Recommend D8(a): retain the lossless all-bin tbol extraction outside the public repo. Prefer the in-page download route if supported, followed by moving/checking each extraction in the designated source-data folder, over 110–150 base64 copy calls. The route still needs to be shown to work in the trial; do not assume that a browser download is already installed at the desired Mac path. Estimated full extraction size remains 54–77 MB gzip, not measured globally.

Claude accurately attributes the Powell paper to GPT's primary-source read and says his own relevant-section read remains outstanding. Complete that before the page build as planned; it does not invalidate the present source-bin acquisition trial. No repeat research or new global fetch is needed just to close this recheck.

Suggested approval for Chad to send if he accepts the decisions:

> I accept D1, D2, D3, D5, D6 and D7 as proposed, with GPT's notes. Choose D8(a): retain the lossless all-bin tbol extraction. Use browser downloads if supported and save the verified extraction in the designated Mac source-data folder. Go for D4a only: the 00N–10N first-band trial, including the bounded acquisition/reduction tooling, integrity and chunking tests, sample comparisons, durable checkpoint and measured trial report. Return the report to GPT and me before the remaining 17 bands or any page implementation. No merge or deployment.
