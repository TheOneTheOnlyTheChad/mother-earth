# Moon height RC — independent GPT review

26 November 2026, South Africa. Candidate supplied as `moon-height-rc` at `2ac103e`; payload `f884b7c`, Animals maintenance `5e835de`. Reviewed Mac copy: `/Users/chadobie/Documents/Mother Earth/_review/moon-height-rc/tree/`. Commit identity is as supplied by Claude; no fresh remote branch query in this round.

## Verdict

**PASS for the branch preview.** The elevation model, lossless numerical derivative, conservative polar exclusion, displayed scientific limitations and principal lighting/camera behaviour support proceeding to release preparation after Chad's preview judgement. This is not release clearance or production approval. Sources, REGISTER, the refreshed served manifest and final integration remain a separate review round.

The 2,578,646-byte optional asset download and the extra polar-cap draw are disclosed deviations for Chad to accept with the preview. I do not require compression work or a general rendering refactor for this feature. Lossless numerical readouts are required; lossless display colours are an implementation choice, not a scientific requirement.

## Independently checked

- Read the packet, `moonsci.js`, the `moonglobe.js` delta, build script, asset record, CSS and the full new test suite.
- Independently decompressed the candidate grid and compared all 1,036,800 values to the source float converted in float64 and rounded to whole metres, with rows 0–1 withheld: **zero mismatches**.
- Confirmed both derived asset sizes and SHA-256 against SOURCE.json, and the build script hash against its record. The grid remains the same numerical derivative checked at proposal rev 2.
- Opened the exact review tree through a temporary localhost server in the in-app browser. Observed picture default, sunlight enabled, Earth view enabled, height transition, disabled sunlight control, legend, centre readout, far-side view, zoomed north-pole cap, a pointer click on the cap returning the withheld sentence, and switching height off restoring sunlight for the current minute while keeping Earth view closed.
- Source-checked two displayed centre readings: approximately 5.47 degrees south / 0.79 degrees east gives +532 m; 0 degrees / 180 degrees gives +2,837 m. Cap click read approximately 89.95 degrees north and correctly returned no value.
- `node --check` passed for `moonsci.js` and `moonglobe.js`.
- Temporary browser tab closed and reviewer server stopped. No implementation files, production settings or provider accounts changed.

## Accepted preview changes

1. Direct click-coordinate conversion is preferable to relying on stale hover coordinates. The code uses the actual click, with a drag-distance guard. Real touch/Safari behaviour remains unverified.
2. The small neutral cap polygon makes the excluded area visible; plain grey rather than stripes is acceptable with its legend and readout. The additional draw is disclosed. Draw-call counts do not alone measure energy use, CPU cost or perceived performance.
3. The separate centre-read button is a usable bounded keyboard alternative with the existing turn controls, but it is coarser than the originally proposed independent selection point. Do not claim arbitrary-cell keyboard selection or full keyboard access to the polar cap: the view buttons clamp at 85 degrees.
4. The height reference, data period, grid-spacing limitations, metre-rounding distinction and separation from the dated trajectory are stated adequately.
5. Explicit little-endian decoding, compressed/raw integrity paths, cancellation tokens, off-by-default acquisition and cached successful toggles are present.

## Small fixes during release preparation

**Resource cleanup:** `loadTex()` creates an object URL, but it is not revoked when a successful texture result is discarded after cancellation, or when its sibling grid load fails. Promise.all also leaves the sibling operation running after one branch rejects. Repeated cancelled/failed attempts can retain unused image blobs until page teardown. Add ownership-aware cleanup for uncommitted texture URLs, abort outstanding sibling acquisition on failure, and preserve the successfully cached URL. Test cancellation and a texture-success/grid-failure case. This is not a finding against the height values or normal successful preview.

**Keep test claims accurate:** the suite's texture comparison samples the saved PNG through `texAt` with a 36-per-channel screen tolerance; it is not an independent proof that every source cell is rendered as an exact unsmoothed colour. The indexed file is lossless, but raster resampling and GPU texture filtering still affect boundaries. Retain the source-value tests and describe visual registration evidence at its actual scope. A synthetic patch/known-cell colour control would strengthen it, as originally proposed.

Add texture-fetch/integrity/decode-failure coverage to exercise the second asset's fallback and cleanup, and retain the documented narrow regression checks on the final release tree. Do not describe the desktop-width checks as real-phone, Safari or screen-reader verification.

## Evidence limits

Claude reports 88/0 new checks, ten deliberate breaks caught, 291/0 Animals checks and the listed affected regressions. I inspected those test implementations and records, but did not independently rerun their browser suites or mutation controls: they reference Claude's workspace dependencies. I did not rerun the numpy/Pillow build; neither dependency is installed in the local Python environment. The independent numerical and integrity checks above used the standard library. No independent rendering-performance measurement, real phone, Safari or screen-reader test was performed in this round. No post-deploy claim is made.

## Suggested next message for Chad to send

GPT preview review: PASS for `moon-height-rc` at `2ac103e`. I accept the preview, the 2,578,646-byte optional asset download and the extra polar-cap draw. Prepare the release candidate: fix cancelled/failed-load resource cleanup with focused tests, add the Sources and REGISTER records, make the narrow Animals pin update, and prepare the current served-file manifest while retaining historical manifests. Carry the review's evidence limits accurately. Return the exact final commit for GPT review. No merge or deployment yet.
