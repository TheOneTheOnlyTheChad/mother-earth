# Animals journey context C1a — independent candidate review

25 Nov 2026 · GPT · branch `animals-journey-context-proposal`, packet head `814a1d62520d3617eae001bd3fc20a865d09f12a`, page commit `a83b04f3`

**PASS for the zebra feature candidate. Release preparation remains to be completed and reviewed before Chad's production approval.** The feature's meaning, counts, presentation and sampled browser behaviour are accepted. No extraction rerun or design restart is required. The resource record/formatter, packet manifest and Sources-page integration described below must be settled in the final release packet.

No merge, deployment, provider request or production change was performed by GPT. The corridor stays parked.

## Accepted identities and independent evidence

| Item | SHA256 |
|---|---|
| Context JSON, 7,879 bytes | `6b67818b4fb2c334bce958f1b50a3a8d3e66fd69269357dee35650ffe922a21e` |
| animals-context.js | `a12594c11291890c181b8b46b4e8350785f48833bcc5ded6387a75d99cf455cc` |
| animals.html | `4e75d051f690573f3401b7ad51e27c64efe5b10625bc32d5063caa831f3fc0ed` |
| style.css | `3f8515c2fe661fc9517c35f0052b9250dbc30da763fb05d8201c3bdfc06f1c4d` |
| build_journey_context.py, before memory-format correction | `73d7a19d6bb37ab9ab9c1862cafe250a8c376dce2b7ebe955c04db903d32391c` |

I read the code, record, builder controls, UI suite and supplied phone screenshot. Fetched the branch Git objects into the independent scratch checkout and inspected the production HTML/CSS diff: one zebra block/script addition, asset-key update, and eight added context-specific CSS lines. Existing page content and stylesheet lines are retained.

The **real FIRMS extraction passes the reviewed verifier**. I independently counted the private CSVs with separate code, rather than merely calling the builder's count function:

- **21,744** accepted detections: Aqua 13,240; Terra 8,504; western cell 15,520; eastern cell 6,224.
- Monthly counts: **13, 360, 35, 3, 14, 13, 26, 119, 316, 591, 2,689, 11,141, 6,424**. These sum to the total.
- Exclusions: 3 type-2 rows, 22 outside the minute-rounded interval, 2 outside the half-open union, no identical duplicates. This reconciles all 21,771 extracted rows.

Independently reran the **16 builder controls: all pass**. Verified all six actual private Hansen files against the full SHA256 pins in the builder. Independently numerically integrated the WGS84 surface element for a zebra cell: **185,320.999771241 km²**, agreeing with the builder's analytic formula. Its strip/row selection and accumulation code are consistent with the declared region, threshold, years and mask conservation method.

I did **not** independently decode/recount all Hansen pixels or reproduce the complete raster build: the local Python available to this review lacks numpy, tifffile and imagecodecs. Thus 145.1/99.9/245.0 ha, exact raster-mask totals and full-build runtime remain supported by Claude's reproducible build evidence and my code/input review, not a claimed second independent raster extraction. No new dependency installation was performed.

## Browser check

Used an isolated localhost server with the exact candidate HTML, CSS, script and context bytes; existing Animals scripts/data came from the Mac mirror. The server exposed only the required public page/assets paths, not the private cache or key file. The context was initially off-screen and showed its not-yet-checked state; scrolling to it caused verification and the figures appeared. The normal path used no script substitution.

The displayed text correctly names the large regional cells, period, presumed vegetation-fire detections, all confidence levels, database-gap qualification, annual tree-loss mismatch, year-2000 threshold, credits and closing disclaimer. Both native disclosures start closed. At **390 × 844**, both opened by keyboard, 13 monthly rows appeared, focus had a visible orange outline, and the document's scroll width equalled 390 pixels.

For failure checks the server supplied (a) the context with one extra byte, leaving the approved pin unchanged, and (b) HTTP 503. The first showed “could not be verified”, the second “could not be loaded”; both hid the body and contained **zero figure spans**. The viewport override was reset and the review server stopped.

I did not rerun the full 30-check browser suite or its 12 breaks, nor all existing Animals regressions. Those remain Claude's logged results. Local preview is not a live-page smoke or a real phone, Safari, screen-reader, print or 200% zoom check.

## Packet §6 — decisions

1. **Loading near the viewport: accepted.** The cards are already open; within 200 px is a reasonable bounded preload. Describe it as near-screen loading, not literally waiting for pixels to be visible. The documented no-IntersectionObserver fallback is acceptable. It must not toggle any journey/globe layer.
2. **Acknowledgement inside the block: accepted.** This is where the figures are displayed, so it is an appropriate place for the LANCE acknowledgement, FIRMS credit, Hansen credit/licence and local-scale limitation. A new footer is unnecessary.
3. **“About 245.0 ha”: accepted.** One decimal is a display rounding convention, not a confidence interval. The adjacent approximation/relative-indicator caveat prevents it being presented as an exact observed total. Whole hectares would also be defensible, but no new wording revision is required merely for this choice.
4. **Two area bases: accepted as disclosed.** The top line follows the hub's grid sphere, while raster area uses WGS84. The method disclosure states both and gives their per-cell areas. They describe the same geographic bounds with different area models; don't silently equate their totals in conservation checks.
5. **Wording meets the bounded brief.** Temporal mismatch is beside the loss value, the type-0 detection rule is named, absence in the gap list is not absence of fire, and no animal-exposure/causal claim is added. The fixed source labels are acceptable for this immutable zebra R1 file; they are not a generic renderer contract for arbitrary future products.

## Finish these items in release preparation

### 1. Correct the memory measurement's units and record

The builder prints `resource.getrusage(...).ru_maxrss / 1024` as “MB”. On **Darwin/macOS**, ru_maxrss is bytes, so that division gives KiB, not MB. On Linux it starts in KiB and the division gives MiB. The candidate's formatter therefore cannot substantiate a Mac “105 MB” claim as written.

Normalize by platform (or use a reliable external measurement), label MB/MiB accurately, retain raw value/platform/command with the measured result, and update the record. Rerun the offline build/check through Claude's prepared environment to establish the corrected figure. Keep timing and memory out of the context bytes. This is a resource-evidence correction, not a finding that the row-bounded algorithm actually loads whole rasters or exceeds its budget.

### 2. Repair the stale packet checksum

Seven of eight `SHA256SUMS.txt` entries match. The candidate-record entry `run/2026-11-25-animals-journey-context-c1a-rc.md` is stale; the run and read copies agree with each other, but not with that recorded checksum. Regenerate the manifest after the final record edits. Production script/data hashes above match.

### 3. Include Sources and its narrow test maintenance in the final reviewed tree

The current candidate does not change `sources.html`, so its reported Animals pass does not cover the drafted Sources addition. Existing check 13e requires that file to equal **NC_MAIN** byte for byte. Applying the draft at release would make that check fail.

Prepare the exact Sources/REGISTER additions now, together with the smallest reviewed test accommodation. One workable approach is to allow **only the exact reviewed new Sources block** on top of the NC_MAIN copy, compare the remainder byte for byte, and retain every independent Animals link/header/source/Low-class guarantee. Add a control showing an unrelated Sources edit is still caught. Keep BASE_MAIN, TL_MAIN, NC_MAIN and NC_PARENT unchanged. Do not move the broad Nature pin to an Animals commit or weaken the comparison to presence-only checks.

The Animals thread owns its suite and can prepare this itself; no new parallel implementation thread is needed. The final maintenance diff still comes to GPT with the concrete release packet.

### 4. Prepare, test and identify the final tree before Chad approves publication

Merge fresh main into the release branch, preserve the deployed hub and all existing pins, and include the dated source records plus the narrow maintenance above. Run the affected context/build/Animals/hub checks on that exact tree; include new code hashes and a passing offline `--check`. Scope other regressions to actual shared-file changes. No need to repeat the live FIRMS extraction or download the unchanged raster files.

Return that final packet for a bounded release recheck. After it passes, ask for Chad's concrete page-release approval, publish, verify served hashes and perform a scoped live check. Then close the zebra branch work and record remaining device limits. If corridor work is still parked, retain its proposal in durable records rather than leave it ambiguously in progress.

No new scientific hold is raised on the accepted fixed zebra data in this review. Earlier email-dependent Animals items remain separate and parked.
