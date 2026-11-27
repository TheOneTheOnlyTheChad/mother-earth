# Mother Earth — CRaTER proposal rev 1 review

27 November 2026 · GPT independent review for Chad and Claude

**REVISE BEFORE BUILD — R1–R3 below.** A bounded historical GOOD-event chart is feasible and preferable to colouring the orbit. This is not an infeasibility finding. No more bulk data or dose derivation is needed to revise the proposal.

Reviewed: proposal rev 1, reported main `5db3425`, supplied Mac `_review/moon-crater-rev1/`; assessment scripts/outputs, retained source bundle and labels. No page implementation exists. Chad's D1–D5 choices remain his; D6 correspondence is optional and must not become a blocker.

## Independent checks

Using Python stdlib independently of the supplied numpy scripts, I verified:

- All four retained acquisition files match their checkpoint SHA-256 hashes. Both complete SEC files also match their archive-label MD5s. The PRI slice is correctly distinguished from a whole-file checksum.
- All **16** embedded documentation/label/table texts match their saved byte counts and SHA-256 hashes.
- Both SEC day files contain 86,400 fixed 194-byte CRLF records with 32 fields. TOTAL = GOOD + REJECT throughout.
- 10 June GOOD sum: **2,573,044**, mean **29.780602 per nominal one-second record**. Minute-sum mean 1,786.8361, SD 56.9178; SD divided by Poisson benchmark 1.3465. The ten-minute ratio is 2.8861.
- 11 June GOOD sum: **2,541,781**, mean **29.418762**. Minute benchmark ratio 1.1720; ten-minute ratio 1.9915. Its first 600 record tags give 29.645 events/s on the proposed nominal denominator.
- The 674 complete seconds in the PRI slice match SEC GOOD counts. The byte-228 flags match the specified near-saturation threshold in all six detectors in this slice.
- The position-comparison calculation reproduces the reported 1,440 interior minute points: using SECONDS + FRACT/100 as a hypothesized time coordinate gives median/max residual **0.033857/0.081357 km**; adding a fitted 0.02 s gives **0.023089/0.064023 km**. These are reproducible numerical comparisons, not validation of a clock correction.

The PPI FAQ independently opened during this review states that archived PDS data are public domain and should be appropriately cited: https://pds-ppi.igpp.ucla.edu/faq.jsp. The retained collection label confirms DOI 10.17189/2c1t-ph72, Spence, 2026, collection version 2.4. The citation and proposed reuse route are supported.

## R1 — Separate timestamp evidence from a validated timing correction; define the bins

The proposal currently says pairing is “verified” with an “understood timing”, and calls the 0.18–0.20 s a corrected clock-tag offset. That is stronger than the evidence.

The saved label calls SECONDS/FRACT **spacecraft time derived from the spacecraft clock**, while TIME is a whole-second UTC string. Both days have FRACT = 18. The saved data description says primary-event times refer to the **end of the measurement interval**, at the spacecraft timing pulse. It does not establish that adding that spacecraft-clock fraction to the whole-second UTC string gives an exact UTC event epoch or the exact epoch of MOONVEC. The proposal itself acknowledges the vector instant is not stated.

The improved residual after using the fraction, and after fitting another 0.02 s, is useful corroboration of time/frame compatibility. Optimizing the residual against the same path is not independent validation of a clock conversion. It also does not establish use of the identical ephemeris/kernel frame realization: MOON_ME is a general frame designation here, while the page names a particular realization.

**Required revision:**

1. Either document the relevant timing convention from an authoritative instrument/processing/SCLK source, or retain the comparison as a clearly labelled timing hypothesis and fit diagnostic. Do not apply the fitted 0.02 s as a scientific correction to chart observations. No bulk PRI acquisition is necessary.
2. For the proposed coarse chart, a simpler bounded rule is acceptable: use the archive's TIME values to group records, label this as **binning by UTC record timestamps**, retain the documented approximately one-second readout/end-time limitation, and synchronize only the selected **time bin** with the existing slider. The existing path remains the sole source of the spacecraft marker. Do not claim a precise position for a particular detected particle or a footprint.
3. Define the bin edges and interval membership explicitly, including whether timestamps are included at the left or right edge. A counter tagged at the end of a readout is not a sample of the following second. A nominal 00:00–00:10 timestamp group should not be described as exact knowledge of all particle arrival times in that wall-clock interval.
4. Specify the denominator: nominal 600 s for 600 complete one-second readout records, or a separately documented elapsed/live-time calculation. State that no live-time correction is applied if that is the choice. Missing records must not silently become zero or retain a 600-second denominator.
5. At the final slider position, show an explicit **11 June 00:00–00:10 UTC bin label** if D5 is accepted. The chart title/coverage must disclose that extra bin. Rev 1 simultaneously proposes it and says no second-day data are shown; resolve that contradiction. Keep the minute-zero position comparison as unavailable for interpolation, not a clamped validated sample.

The position and time evidence supports pursuing a historical time-linked chart at this resolution. It does not support the stronger corrected-clock narrative currently written.

## R2 — Remove unsupported source attribution and absence claims

No mode-change entry and a nearly flat GOOD series do **not** establish “no solar particle event”, a “quiet day”, or that most recorded events on this particular day are galactic cosmic rays. An instrument operations log is not a complete solar-event catalogue. The archive also explicitly warns that the thick-detector singles anomaly can affect **both GOOD and REJECT**, so choosing GOOD does not prove immunity to instrumental effects.

Use the measured result directly: the recorded GOOD-event rate stayed near 30/s; its origin and the causes of the variation have not been established in this assessment. General cosmic-ray context can be sourced separately, but must not identify the measured population on this day without analysis. No new solar-event study is required if those claims are removed.

Also narrow the other conclusions:

- Small observed altitude correlation is not proof of no physical altitude dependence; say the assessed series shows a small association, with no causal interpretation. Serial dependence and the growing extra-Poisson variation make “mostly noise” an interpretation rather than a demonstrated decomposition.
- Describe the primary flags as **a suspected label/column inconsistency observed in this slice**, not a confirmed swap. Matching one column to saturation does not prove every other flag's meaning, especially with unexplained thin-detector behaviour. Do not fix/relabel source columns in retained data.
- State “no suitable dose product identified among the inspected holdings for this interval”, rather than claiming no dose archive exists anywhere. R3 remains outside the proposed implementation; a future revisit requires fresh product discovery and validation, not an assumed commitment to deriving dose from raw events.
- Record the misplaced housekeeping directory as the observed access/holding issue. Missing off-Moon/eclipse flags limit physical interpretation even though an uninterpreted counter chart need not use them.

Suggested chart explanation:

> Archived good-event counts recorded by CRaTER on LRO. The rate depends on the instrument's detector thresholds, coincidence selection and operating state. These are instrument event counts, not a radiation dose, a particle flux or conditions at a place on the Moon's surface. This record stays near 30 events per second; the causes of its variation have not been determined here.

“Events” is preferable to claiming one counted event always equals one identified incident particle.

## R3 — Make the counting-bar and build contracts explicit

The square-root expression is a useful **conditional Poisson counting benchmark**, not a validated total uncertainty estimate. The ten-minute scatter is 2.89 times that benchmark on 10 June; the chart must not imply those bars contain all observed variability or systematics.

Specify:

- Rate = N / T, with **approximate one-standard-deviation Poisson counting bars sqrt(N) / T**, conditional on independent events and the stated exposure/readout convention. These are Mother Earth's calculation, not an archive-supplied error field. They exclude timing, dead time, configuration/systematic effects and physical variability. Do not call them 95% intervals or total uncertainty.
- Exact product IDs, hashes and nominal configuration rules in the builder; strict fixed-field parsing, finite values, nonnegative integer counters, chronological unique timestamps, expected coverage and expected setting values. Assert TOTAL = GOOD + REJECT and the selected samples' inclusion.
- A defined response to malformed, missing, duplicated, out-of-order, invalid-setting or incomplete bins: fail the build or explicitly withhold the affected bin. Never silently smooth, fill zero or divide incomplete data by nominal full exposure.
- A small output schema with source/provenance and timestamp-binning convention, counts, sample count/exposure, exact start/end tags and units. Browser validation must check the whole payload and pin before display. Specify cancellation/deadline, stale-answer and retry behaviour; a chart failure must leave the dated drawing and controls usable.
- Test source-value/bin comparisons, first/last and exact-edge selection, zero versus missing, bad settings, malformed input, hash failure, slow/late loading, keyboard/text alternative and narrow layout. No need to make every unrelated suite a prerequisite to this docs revision.

The all-ones mask interpretation is reasonable as a statement about permitting the documented coincidence patterns, given the saved description's 64-combination mask. It is not an efficiency/geometric-factor calibration and must not support conversion to flux or a claim of accepting every physical particle. The minimum-subset details can remain a metadata caveat unless a new interpretation actually depends on them.

## Recommendation and next step

I support **R1 as the candidate display form**, with D2 GOOD, D3 time chart rather than orbit colouring, D4 ten-minute timestamp bins and D5 the explicitly labelled extra 11 June bin. R0 remains a valid owner choice, but the assessment has found usable data. The surface/dose distinctions and exclusion of singles are sensible once the limitations above are included.

Return a **docs-only rev 2** addressing R1–R3, with any narrowly needed timing-document read and reproducible updated aggregation examples. Keep existing acquisitions and checkpoints intact. No page build, bulk fetch, merge or deployment. No enquiry is needed as a prerequisite; draft D6 only if Chad asks, and do not send it automatically.

This review used retained files and small documentation reads only. It did not independently inspect the housekeeping web-directory listing, reproduce all configuration/altitude correlation figures, read the full instrument paper/SIS, or build/test a page. No production action was taken.
