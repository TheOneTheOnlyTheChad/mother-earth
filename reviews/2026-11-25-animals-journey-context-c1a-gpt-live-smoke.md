# Animals journey context C1a — independent live smoke

25 Nov 2026 · GPT · approximately 06:59–07:02 UTC (08:59–09:02 SAST)

**PASS for the scoped live smoke. No rollback recommended.** The zebra historical regional context works on the live Animals page. No production setting, file, merge, deployment or data was changed by this review.

Read the release/live-smoke request first. Recorded page merge: **`64e9cf599b1138fa3b838c027ff460275c56b332`**, 25 Nov 06:54:07 UTC, reviewed branch head `16133f23`. This smoke does not independently audit the merge approval or reread the Cloudflare deployment; it checks the served release and its behaviour.

Live page: https://theonetheonlythechad.github.io/mother-earth/animals.html

## Served identities

Independent HTTPS downloads returned 200 for all six files. The five functional files match the release recheck exactly:

| File | Bytes | SHA256 |
|---|---:|---|
| animals.html | 23,220 | `4e75d051f690573f3401b7ad51e27c64efe5b10625bc32d5063caa831f3fc0ed` |
| animals-context.js?v=202612250100 | 17,198 | `a12594c11291890c181b8b46b4e8350785f48833bcc5ded6387a75d99cf455cc` |
| style.css?v=202612250100 | 87,864 | `3f8515c2fe661fc9517c35f0052b9250dbc30da763fb05d8201c3bdfc06f1c4d` |
| assets/animals/zebra-botswana-Z3866-context-R1.json | 7,879 | `6b67818b4fb2c334bce958f1b50a3a8d3e66fd69269357dee35650ffe922a21e` |
| sources.html | 91,893 | `99931b2a6df942e08c8a6feb7d24be9aa4c521c7ddef2d3eebcfd41144975128` |
| REGISTER.md after close-out filing | 152,479 | `3f6b1832a2c79e46a00cd708ee33d30a4ef4667eba458bf2f068f1ff3bccfbbb` |

Compared the served REGISTER with the reviewed candidate: **only the expected four lines differ**—the two entry headings and their Filed lines, completing the release date/merge identity. No terms, figures or methodology changed in that comparison.

## Live browser findings

Used a fresh in-app browser tab at the plain live URL, then a temporary 390 × 844 viewport. No cache-busting URL or injected page was needed in this run.

1. **Initial state / loading:** at the top of the page the context block was about 6,752 px below the viewport, whose height was 720 px. It said its file would be checked when the card area was on screen. The browser's observed-asset inventory contained no context JSON resource then. After bringing the heading into view, that exact live JSON appeared as an observed fetch resource and the block became verified. This independently supports deferred loading. The available read-only browser surface did not expose an exact request counter, so I do not independently claim “exactly one request” or a measured 200 px trigger boundary; those remain supported by the reviewed code and Claude's live measurement.

2. **Verified figures / words:** the block showed **21,744 presumed vegetation-fire detections**, the minute-rounded UTC interval, the two broad cells and approximately 371,700 km². It named Collection 6/file version 6.03, Terra and Aqua, all confidence levels, detection-versus-fire and cloud limitations, and the provider's no-listed-gap-dates wording. It showed **about 245.0 ha**, with annual values 145.1 and 99.9 ha, the year-2000 30% threshold and calendar-year mismatch immediately beside the value. The relative-indicator qualification, exact closing disclaimer, LANCE acknowledgement and source credits were present.

3. **Disclosures:** “By month” and “How these figures were made” both began closed. There were 13 month rows plus total 21,744. At 390 px, both opened with Enter; the focused summary had a visible orange 2 px outline. The monthly values matched the reviewed sequence, including partial October rows at each end. Document width and scroll width were both **390 px**: no horizontal overflow. Screenshot inspection confirmed legible wrapping and the visible focus outline. The viewport override was reset afterwards.

4. **No automatic activation / existing cards:** all four journey switches and the corridor switch were false before and after interacting with the context. All four journey study-state lines reported their existing files verified. No replay or extra globe layer was activated by the smoke. The exact served Animals page hash matches the reviewed limited addition; this is not a full replay/globe/census regression.

5. **Sources:** opened the live Sources page. The new paragraph sits immediately after “Plains zebra, collar Z3866…”, with the reviewed qualifiers and the expected NASA FIRMS, Hansen v1.13 and CC BY 4.0 links. Its whole-file hash matches the reviewed version.

6. **Console:** no captured error-level console messages on the live Animals test or subsequent Sources view. This does not certify all providers or background collectors.

## Limits and close-out

Not tested here: **real phone, Safari, screen reader, print or true 200% browser zoom**. A 390-pixel desktop viewport does not close those checks. Did not force live wrong-pin/network-failure states, repeat data extraction, download rasters, run broad regressions or assess hub health. Those failure states were independently checked on the candidate in the earlier review.

Claude can file this report unchanged and complete the already-described zebra close-out: retain actual merge/hash evidence, record device limits, remove the completed merged branch and move the review copies to the agreed recoverable holding folder, preserve the private raw inputs, and retain C1b as parked rather than in progress. Do not delete or modify another thread's branch or research.

The handover can now state: **C1a zebra regional context released, independently smoke-tested, PASS; no rollback recommended.** Email-dependent Animals items and the corridor remain parked. This pass starts no further feature work automatically.
