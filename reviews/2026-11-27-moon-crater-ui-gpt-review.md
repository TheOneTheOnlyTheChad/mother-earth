# Mother Earth — CRaTER branch preview review

27 November 2026 · GPT independent review for Chad and Claude

**PASS at preview stage.** `moon-crater-ui` tested at `d6f9a0f`, reported head `10a05db` adding the packet, may proceed to release-candidate preparation on Chad's go. No blocking finding. This verdict does not authorize merge or deployment.

Reviewed supplied Mac `_review/moon-crater-ui/`: packet, production builder and builder tests, chart JS/CSS/markup, data asset, logs, break summary and screenshots. All **28** checksum entries match. Commit relationships are as supplied by Claude; I have not independently read remote Git history.

## Independent verification

- Ran the supplied production builder against the retained SEC files with `--check` and the candidate asset as the comparison target. It passes and reproduces the **3,908-byte** asset byte for byte.
- Asset SHA-256: **`50ef3c0cfd64879f429093e60bcd02ee1511480250f3615225ed12a0bbf19a5c`**, matching the chart's pin.
- All **145** production rows, integer N and nominal T, match the research preview previously independently verified from fixed source byte positions. Selected GOOD total is **2,590,831**, comprising 2,573,044 on 10 June and 17,787 in the extra bin.
- Executed actual mooncrater.js unchanged in a minimal DOM fixture, with the real pinned data and WebCrypto. Verified no request before opening, valid default selection, **all 1,441 slider minute selections** against expected ten-minute groups, the 11 June extra-bin label, rejection of a non-example selection, and cached reopen without a second request. This is code/DOM-fixture verification, not a browser layout or screen-reader test.

## Builder, schema and page

The production builder checks the input hashes before parsing, uses the saved labels' fixed positions, verifies separators and record shapes, validates timestamps and fields, and enforces ordering, configuration, coverage and selected totals. It contains no fault switches. The compact output preserves integer counts and nominal duration; the page derives rate and square-root benchmark consistently.

The packet correctly explains that a truly missing record in these pinned day files fails whole-file integrity/coverage before any incomplete-bin asset is published. The general incomplete-bin representation is tested through altered data and page fixtures; it is not represented as an actual gap in the archive day. Withholding non-nominal bins and treating GOOD zero as a value are consistent with D7.

The chart listens to the existing selection event without changing craft.js or its position model. It validates the revision, interval and whole payload before use; keeps fetch/hash work under a bounded request race; invalidates late answers; offers explicit retry; and leaves the dated drawing independent. Caching this small validated data object across close/reopen is acceptable.

The production tests and packet distinguish hypothetical/fault inputs from the unchanged retained source bytes. The numerical guards are sufficient for this fixed, pinned product and interval.

## Scientific wording and presentation

- **Observed badge accepted:** the source is an archived instrument counter. The surrounding wording identifies the ten-minute grouping and derived rate/benchmark, so this does not imply an observed dose, surface field or exact particle position.
- **Zero-based 0–40 events/s axis accepted.** It communicates the modest rate change without exaggerating it. Barely visible counting bars at this scale are disclosed; the readout and full table provide their numbers.
- UTC record-time grouping, nominal 600 s, no live-time correction, explicit extra-bin coverage, lack of physical source attribution, and the separation from dose/flux/surface conditions are preserved.
- The page's benchmark text does not claim total uncertainty. At release, include the promised full approximate one-standard-deviation/independent-events qualification in Sources, with a Details link from the panel. Do not drop the exclusions or change the bars into confidence intervals.
- The supplied 390 px screenshot shows readable labels and the complete explanatory text. This is screenshot evidence, not an independently observed real phone.

One wording clarification for the RC records: the primary-science telemetry/reporting ceiling of about 1,200 events/s should not be described as a universal physical ceiling of the secondary GOOD counter. The page's conservative row bound is harmless for this pinned interval, whose counts are far below it; label it as a chosen validation bound for this release rather than inferring a general counter limit from telemetry capacity. No new product assessment is needed.

## Test evidence and limits

I inspected the test implementations and supplied logs; I did not independently rerun the complete builder fault suite or browser regressions. Recorded results: builder 28/0, new UI 49/0, all six listed Moon suites green, Skycraft 77/0, Tides 60/0, Timeline 594/0, navigation 2,882/0. The supplied summary records all **11** mutations applied and caught without setup termination; individual full mutation logs were not included in this review copy, so that aggregate claim rests on the summary and suite code.

The two Animals failures are the expected whole-file moon.html pin consequences and must be resolved narrowly in the release candidate. Timeline-mixed-assets 16/2 is carried as the documented baseline exception, not a pass. The disclosed harness corrections and redefined combined late-answer break do not invalidate the final run.

Real phone, Safari, screen reader and hardware renderer remain unchecked. No WebGL-draw increase is expected from an external SVG, but draw/performance measurement was not performed and should not be claimed. The Project checklist copy remains stale at rev 25 while repo/Mac are rev 26; bring the Project copy current in RC preparation or close-out and record successful synchronization.

## Next step

On Chad's go, prepare Sources, REGISTER, narrow Animals maintenance, a new reviewed served-file manifest and final affected validation on a frozen tree. The manifest must include the new root JS/CSS and CRaTER data asset. Preserve prior manifests and the existing Moon features. Bring forward GPT's filed recheck/review and reconcile current main explicitly.

Suggested owner line:

> Go for the CRaTER release candidate, carrying GPT's passed preview and release notes. Include Sources, REGISTER, narrow Animals pins, the served-file manifest and final affected validation. Update the Project checklist copy and return the exact candidate for GPT release review. Page only; no merge, deployment or new bulk acquisition.

No item is live or closed by this preview verdict. Other Moon items and Sun/Parker sequencing remain unchanged.
