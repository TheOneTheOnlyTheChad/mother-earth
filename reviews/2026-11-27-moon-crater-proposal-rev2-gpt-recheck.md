# Mother Earth — CRaTER proposal rev 2 recheck

27 November 2026 · GPT independent review for Chad and Claude

**PASS at proposal stage — R1–R3 closed.** Chad may accept D1–D5 and D7 and authorize a bounded page-only branch preview. No further proposal round is required for the notes below. This is not owner build authorization or release approval.

Reviewed: proposal rev 2, reported main `d702860`, Mac `_review/moon-crater-rev2/`, the new bin preview and builder, its failure evidence, the additional count-series assessment, and the unchanged source acquisitions. GPT's rev 1 review in the review copy is byte-identical to my saved original.

## Independent numerical checks

I read the source records directly at their fixed byte offsets, independently of the preview builder's comma-split parser. For 10 June's 86,400 records and the first 600 records of 11 June, all **145 bins** match the preview's GOOD sums and record counts. Each bin has 600 unique whole-second timestamps. Every rate and square-root counting benchmark agrees to the preview's displayed rounding.

I also ran the supplied preview builder against the retained inputs. It rebuilds the committed 28,242-byte JSON **byte-identically**, SHA-256:

`4c3a1d57c2cff93fef31f0b0b986d8ca04c6a86d6962727d94eafe369bebd2df`

The 144 bins for 10 June sum to **2,573,044** GOOD events. The extra 11 June bin contains **17,787**. The rates span **28.860–32.788 events/s**. These reproduce the proposed quantity without any fitted time correction.

The three bins starting 12:40, 12:50 and 13:00 are approximately 8.28%, 10.30% and 7.65% above the remaining day's mean of 29.72644 events/s. Describing this as an approximately 8–10% rise is reasonable. The proposal's detector comparisons are descriptive; no origin or causal interpretation is established. I inspected the additional analysis/output but did not independently repeat every detector, latitude or altitude statistic in it.

## Review points closed

**R1 — Timing and grouping.** The fitted offset is now explicitly a hypothesis/diagnostic, with no correction applied. The chart groups by the archive TIME field using left-inclusive/right-exclusive ten-minute windows. It selects time bins through the existing slider and leaves all spacecraft positions to the existing path. The nominal 600-second denominator, readout-time limitation, lack of live-time correction, and withheld incomplete bins are explicit. The extra 11 June bin is disclosed in title and readout. Frame compatibility is distinguished from proof of identical kernels, and minute-zero interpolation is unavailable rather than validated by clamping. These are sufficient for this coarse historical time-linked display; no SIS or full instrument-paper read is required as a new prerequisite to this bounded preview.

**R2 — Interpretation.** The unsupported quiet-day, solar-event-absence and cosmic-ray attribution claims are withdrawn. Altitude association is not claimed as causation or absence of a physical dependence. GOOD is not presented as immune to the documented detector anomaly. Primary-flag behaviour is a suspected inconsistency, with no source relabelling. Housekeeping is a holding/access limitation, and dose-product discovery is scoped to what was inspected. The revised instrument-count explanation is appropriate.

**R3 — Bars and data contract.** The proposal now defines a calculated approximate one-sigma Poisson counting benchmark rather than archive error bars or total uncertainty. It states the independence and nominal-duration assumptions and the exclusions. The bin completeness and nominal-setting policy, provenance, schema, validation, missing/zero distinction and failure-isolated browser behaviour form a suitable build contract. The supplied seven altered-input outcomes agree with the intended policy; I inspected their code and recorded results rather than independently rerunning all seven variants here.

## Decisions and build notes

I support **D1 R1 chart, D2 GOOD, D3 time chart, D4 ten-minute UTC-record-time groups, D5 the labelled extra 11 June bin, and D7 withholding incomplete/non-nominal bins**. D7 is conservative and does not withhold any of the assessed 145 bins. D6 remains optional correspondence, not a prerequisite and not authorized by this review.

Carry these implementation details into the branch without another proposal round:

1. **Production parsing and assertions:** enforce fixed field locations/lengths as well as record size/CRLF, valid field types/ranges and timestamps. The research preview uses comma splitting and prints a sum; the production builder must actually assert selected-bin source equality and coverage. Its total check must compare the selected 10 June day plus 600 records of 11 June, not all of the second day. Retain hashes before processing and keep mutation/fault modes isolated from normal building; unknown arguments must not bypass integrity checks.
2. **Output and readout:** preserve integer N and nominal T as the authoritative values. Derive and validate rate/benchmark consistently; agree output rounding explicitly. Withheld entries must carry a reason and have no numeric zero substitute. Mark the counting bar as an approximate benchmark in the visible legend; keep the one-sigma/independent-events qualification and total-uncertainty exclusions accessible in the explanation/Sources.
3. **Whole-load lifecycle:** freeze a concrete deadline and schema before building the page. Bound byte reading, hashing, parsing and chart preparation with generation checks; late completions cannot reopen a closed chart or replace a newer request. Verify fallback, retry, slider selection on bin edges and the last extra-bin label. A chart error must leave the dated trajectory, slider and other layers usable.
4. **Presentation:** no geographic radiation colouring, dose, flux, hazard score or claimed incident-particle origin. If the y-axis is truncated to show the modest rise, make its numerical range obvious and do not make the counting benchmark look like a total confidence interval. The drawn trajectory time is a bin selector, not an exact particle-location measurement.

No new acquisition or bulk download is needed. Keep original source bytes and checkpoints unchanged. A production asset build on an authorized preview branch is distinct from the existing research-bin preview.

## Next authorization

Suggested line for Chad, if he accepts the decisions:

> Accept D1–D5 and D7 as recommended. Go for a page-only CRaTER branch preview under proposal rev 2 with GPT's build notes. Use the retained sources, preserve the existing dated path and controls, and return the candidate and evidence for GPT review. No new bulk acquisition, merge or deployment.

Sources, REGISTER, narrow Animals pins, a reviewed served-file manifest and exact-commit owner release approval remain later release steps. Other Moon items and Sun/Parker sequencing stay unchanged.

This recheck used local retained sources and assessment tooling. No production page was built, no external data downloaded, and nothing merged or deployed. Page interaction, real phone, Safari, screen reader and hardware rendering remain untested for this proposed feature.
