# Mother Earth — LROC regional-detail proposal rev 2 recheck

26 November 2026 · GPT independent reviewer · supplied main `297cb64`

Reviewed the refreshed Mac `_review/moon-lroc-proposal/` proposal, geometry code/output, pixel-check code/two outputs and checkpoint additions.

## Verdict

**PASS for the revised design and processing plan, with two explicit prerequisites still open before page implementation: retain the build inputs and read/record the volume RDR SIS coordinate basis.** No further wholesale proposal rewrite is needed. A short source-retention/frame closure packet can close those prerequisites; no build, merge or deployment is cleared by this recheck.

R2 and R3 are substantively answered. R1's numerical conventions/claim limitations are answered, while its named volume-SIS read remains open. R4 now correctly distinguishes checked acquisition from retained inputs, but actual retention is still pending.

## Independent evidence

- Ran `python3 -I lroc_geom.py` successfully: PASS, zero failures. Its full stdout is **byte-identical** to the saved output. Inspected the candidate pixel conventions, negative controls, crop offsets, 4,220×4,000 m area bounds and footprint rectangle.
- Verified both saved pixel-output JSON hashes: `2ccbe61e3d22bf20546ebbad1b5d8614bbde7972ac5ffabed17c5996fe59e2c1` and `12ca3c1ad83f55d58b38e536dc56a4aacf558d461e2d0e2000601ce305177426`. Both record completion and the same source-range/source-file identities as the earlier checkpoints.
- Reconciled the area histogram arithmetically: **1,055,000 output blocks**, **4,093,650 valid source pixels**, **30,588 blocks masked** under n≥2, and **2,001 partly valid blocks retained**. These agree with the recorded counts and the revised policy.
- Source pixel arrays are still not retained, so I have **not** independently recomputed their extrema, local maxima, shadows, special-code counts or full histogram. Inspection of the script and consistency of its saved output do not substitute for a source-data rerun. That becomes possible after retention.

Forward/inverse round trips and the same-coordinate mapping through two grids are algebraic consistency checks, not independent geographic accuracy evidence. The producer bounds and adopted catalogue convention support the grid interpretation, subject to the stated subpixel ambiguity; the local source-feature match is separate evidence. The revised proposal now properly avoids absolute accuracy claims.

## Supported decisions

- D1–D4 remain supported as recorded: Apollo 11, both views, optional descent-stage pointer off by default, leave the current camera/zoom on off.
- **D6: support at least 2 of 4 valid samples, with an exact categorical mask and a hatched display.** This is a display/downsampling policy, not a measurement-quality threshold. Label partially sampled averaging in provenance. Saturation and missing coverage remain distinct; stopping for review if a saturation code enters a build window is reasonable for this bounded release.
- The revised camera and locator rules are coherent: explicit site view leaves Earth camera, preserves lighting/science choices; subsequent Earth view hides only the locator; ordinary view restores its visibility subject to occlusion. Pointer/locator are not footprints and do not intercept scientific readouts.
- Raw-pixel checks replace the invalid brightest-pixel-in-JPEG test. Exact crop/trim rules, source-derived lossless mask, fixed stretch and pinned encoder make the build contract reviewable. Final encoding size/quality and screen visibility still need measurement in the branch preview.

## Close the remaining prerequisites

1. **D5 authorization and durable source retention.** Use an approved Downloads route or a permitted bounded transfer alternative. Retain the named 17,285,120-byte high-resolution range, 59,023,560-byte 2 m file and small metadata/documents outside the repository. Re-read hashes at the final Mac paths. Record each durable checkpoint before beginning the next fetch/save. A verification re-read is still a download; it does not exempt the workflow from the per-file rule. The disclosed earlier batched re-reads do not invalidate matching hashes, but must not become the procedure for retention.
2. **SIS read.** Retain and read the volume's `DOCUMENT/RDRSIS.PDF`, record its version/hash and the relevant coordinate-system passage. Reconcile it with the product label, PDS3 header, DSMAP and the intended ME-coordinate locator. Do not use “invisible at globe scale” to close a missing coordinate-basis fact. If the document contradicts the expected interpretation, return for review before building.
3. **Short closure report.** Supply final file paths/hashes, retention checkpoint lines, SIS passage/version and a rerun of the raw-pixel/geometry checks from retained bytes. The 48×48 witness windows, if preserved with hashes, would let GPT independently recheck the local source feature without another archive fetch; they are optional, not a prerequisite for retaining the actual build inputs.

The full 944 MB high-resolution image is unnecessary. Do not fetch it wholesale.

## Small tooling notes for the retention/build step

- The current `lroc_pixels.js` is analysis tooling: its first ranged response uses `arrayBuffer()` without a streaming size cap, records rather than enforces status/Content-Range, and its Int16Array decode assumes native little-endian. Do not copy that directly into the retention fetcher. Enforce exact 206/Content-Range/byte cap before accepting a range; enforce full-file size/MD5 for the 2 m file; use explicit little-endian decode or an asserted platform check. Reuse the strict integrity/cleanup approach already established for Diviner.
- Keep pre-existing source hashes as expectations; do not replace them with whatever a new fetch returns. A changed source identity needs review.
- Retain the residual half-pixel convention qualification. The raw landmark location is a local validation, not a calibrated sub-metre pointer guarantee.
- Carry the source-caption, scale-bar, lazy-load/off/retry, late-completion and marker-occlusion tests into the build. Once all build inputs are retained, no additional repeated archive fetch is needed for ordinary testing.

## Suggested next owner line

> You may access my Downloads folder for this LROC work. I accept D6: at least 2 of 4 valid pixels and the hatched no-data overlay. Retain the bounded source inputs and metadata on my Mac, re-hash and checkpoint each file before proceeding to the next, read the volume RDR SIS, and return the short source-retention/frame closure report for GPT. No page build, merge or deployment yet.

Claude's reported blocker is an **automatic approval-review rejection** of Downloads folder access (reported reasons: “Cowork Folder Access” and “Unauthorized Access”), not absence of public archive data. The explicit folder wording addresses the stated authorization gap; it does not guarantee a platform grant. If rejected again, report the action and stated reason and use an appropriately authorized alternative.
