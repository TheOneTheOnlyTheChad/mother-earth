# Mother Earth — Diviner D4b global report review

26 November 2026 · GPT independent reviewer

Reviewed the supplied Mac copy of `moon-diviner-trial`, reported branch head `b918187`: global report, `global_report.py`, recorded output, 18-line checkpoint and retained extractions. No new archive fetch, page change, merge or deployment by GPT.

## Verdict

**PASS for the acquired data and global numerical report.** Recommend freezing the proposed display masks at 70° absolute latitude for noon and 80° for midnight, and the whole-kelvin colour scales at **281–395 K** and **70–105 K** respectively. These are display choices, not instrument limits, quality guarantees or scientific transition latitudes.

The disclosed late JSONL checkpoint writing does not invalidate the retained data. Accept it as a one-off process deviation, explicitly in Chad's decision; no repeat acquisition is needed. Future acquisitions must write a durable per-band checkpoint before starting the next band, as originally instructed. This is not merely an optional preference.

With Chad's own approval, the next step can be a page-only branch preview under proposal rev 2 and the existing review notes, after Claude reads Powell 2023 §2.4–2.5. This does not clear merge or deployment.

## Independent evidence

I used a separate Python standard-library implementation, without numpy or Claude's reducer, on the actual retained files on the Mac:

- Exactly 18 distinct band checkpoints cover the full 360 latitude rows without gaps or overlap.
- All 18 gzip and raw SHA-256 values and sizes match their checkpoints, including the recorded destination re-hashes. Total compressed bytes: **59,945,431**; total raw bytes: **99,532,800**.
- Checked all **24,883,200** retained int32 values against the strict sentinel/valid-temperature rules. Reproduced each band's sentinel counts and minimum/maximum. There are no invalid (`-9998`) values.
- Each checkpoint's source MD5 agrees with both its recorded computed MD5 and the pre-existing 18-entry archive checksum table in SAMPLES. Source size/record count/header identity agree across all bands. This checks the retained acquisition record against the earlier archive table; I did not independently re-download the original 2.81 GB ASCII files or repeat source MD5 computation.
- Recomputed all noon/midnight means, bin counts, range codes, display masks and longitude/latitude mapping from the extraction. All **18 reconstructed band-plane hashes** match the browser acquisition checkpoints: **518,400 cell/window results**, including withheld cells.
- Reproduced the complete assembled-grid digest: `1cd629dd3be74f752452ea55366efd9ebff6d279bfedab30a7f1d9d4ebcc9f7b`.
- Independently re-hashed all seven original sample patches against the streamed-range checkpoint hashes: two from band 1, five from D4b.
- Band 1's first JSONL line, including its line ending, hashes to `d3676a7bb9067bc537477431d4f23b4cabf0e78652f63ec435e8f6d9017907a9`, matching its recorded original identity. It continues to name v1; the remaining bands name v2.
- Independently reproduced the global percentiles, n histograms, no-data counts, range statistics and clipping percentages below. I inspected Claude's numpy code but did not rerun it; the separate stdlib computation provides the independent check. The copied browser plane binary files are not in this Mac review copy; my comparison was against their checkpoint SHA-256 values and the global digest.

Timing, browser export success and approximate sampled script-heap readings remain Claude's acquisition measurements. They are not an independent browser performance test or total-process memory measurement.

## Display decisions

| Quantity | Noon | Midnight |
|---|---:|---:|
| Withheld cells | 57,600 | 28,800 |
| Unmasked cells | 201,600 | 230,400 |
| No valid data | 2,874 (1.43% of unmasked cells) | 1,610 (0.70%) |
| n = 0 / 1 / 2 / 3 / 4 | 2,874 / 25,023 / 75,173 / 73,067 / 25,463 | 1,610 / 19,158 / 75,018 / 92,858 / 41,756 |
| Displayed valid min / median / max | 220.3 / 366.5 / 400.1 K | 46.2 / 96.7 / 149.0 K |
| 1st / 99th percentile | 281.5 / 394.3 K | 70.6 / 104.4 K |
| Recommended scale | 281–395 K | 70–105 K |
| Clipped below / above scale | 0.934% / 0.426% | 0.851% / 0.747% |
| Range median / p90 / p99 / max, n ≥ 2 | 3 / 9 / 20 / 140 K | 1 / 4 / 10 / 40 K |

The masks are defensible conservative bounds for this display, not uniquely determined by the distributions. Keep their policy qualification visible. The separate fixed scales improve detail within each mode, but require the agreed always-visible warning: **the same colour does not mean the same temperature on the two maps**. Colour clipping must never clip the numerical readout; keep the ≤/≥ scale ends and distinguish missing from withheld cells.

The counts above are percentages of equal-angle grid cells, **not percentages of lunar surface area**. Label them as cell counts/shares in Sources or supporting records.

Keep bin counts in every valid readout. With one contributing bin, show range unavailable. The mean is our unweighted summary of published quarter-hour bin temperatures, not a directly measured hourly temperature or an observation-weighted mean. Range is bin-to-bin spread, not uncertainty or accuracy.

## Carry into the preview

1. Replace broad wording such as “the noon range is small where shown” with “most shown cells have modest bin-to-bin spread, with substantial tails.” The displayed noon maximum range is **140 K** and its 60–70° p99 reaches 31–38 K. The mask does not guarantee a small range for each included cell. Keep the numeric spread visible without implying a quality certification.
2. Preserve the full rev 2 controller, decoder, integrity, resource-cleanup and malformed-input requirements, including cancelling pending science loads on off and restoring the actual selected mode after a failed replacement. The existing height layer, appearance/lighting behaviour, dated LRO path and shared Moon picture remain within their agreed preservation boundaries.
3. Read Powell 2023 §2.4–2.5 before implementing temperature wording. File Claude's own read separately from GPT's prior read. No new bulk data are needed for the preview.
4. Record the checkpoint deviation plainly. Original instructions required durable per-band checkpoints, while the JSONL was written after acquisition. Verified files and status records support recovery retrospectively; they do not make the original checkpoint procedure compliant. No data correction or repeat download is warranted by this alone.
5. Keep transfer totals distinct: **2,655,592,321 bytes for D4b's 17 bands**; **2,811,803,634 bytes for all 18**, including the first-band trial. The report's table distinguishes them correctly.

## Suggested owner line

> I accept the disclosed checkpoint-timing deviation for this completed acquisition; future runs must write a durable checkpoint per band before proceeding. Freeze the noon/midnight display masks at 70°/80° and colour scales at 281–395 K / 70–105 K, with GPT's wording and safeguards. Read Powell 2023 §2.4–2.5 first, then go for the page-only `moon-diviner-ui` branch preview under proposal rev 2 and GPT's review notes. Return the preview and evidence for GPT review. No merge or deployment.
