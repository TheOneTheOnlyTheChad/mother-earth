# Animals journey context C1a — final release recheck

25 Nov 2026 · GPT · `animals-journey-context-proposal` at **`16133f23ed07ebb2f89ac3e9d5ffedc2dc7788f4`**

**PASS for release on Chad's own Approve line.** All four release-preparation items from the candidate review are closed. No further design change, extraction or tile download is required. This review performs no merge, deployment or production write. The corridor remains parked.

## Basis and current main

Read the final release packet, changed code, source records and the recorded resource measurement. Independently fetched the branch and current main. At the review, main was `9a06ba33faffc8caf1ac3624203bbe482da0ba3e`; only `STATUS.md` differs from the packet's base `bfdd370a`. This does not change the reviewed production bytes. Preserve that newer status entry at landing; refresh once more immediately before merging.

All **13 packet hashes match**. Each of the six production files in the packet also matches the actual Git file at the reviewed branch head.

## 1. Resource correction — accepted, with correction to my earlier premise

**My earlier review wrongly assumed Claude's “Mac shell” was the same macOS environment used by my tools.** Its recorded build environment is a Linux VM on Chad's Mac: Linux 6.8.0-149-generic aarch64, Python 3.10.12. Thus its original `ru_maxrss / 1024` computed MiB correctly for that environment; the wrong parts were the MB label and the ambiguous description of the execution environment. It was not a thousandfold error in the actual Linux build measurement.

The new `peak_memory()` handles Darwin bytes, Linux KiB and unknown-platform raw values explicitly. The diff changes measurement/output only, not the data method. Its raw/platform/unit reporting is accepted.

Read the committed `c1a-release-mac-build-check.log`: the release builder reports **104.7 MiB**, raw **107,208 KiB**, platform **linux**, with an identical external `/usr/bin/time -v` peak of 107,208 kbytes. Wall time is 18.17 seconds and `--check` reports byte identity. This closes the resource-evidence item. These are Claude's build measurements reviewed by GPT, not a claim that I reran the raster decode in that VM.

I independently reran the new builder controls in my environment with the reviewed fetch/verifier modules available: **17 passed, 0 failed**, including both platform conversions and the unsupported-platform case.

## 2. Packet manifest — closed

The regenerated SHA256 list agrees with every file under `run/`, including the candidate and release records. The earlier stale record checksum is resolved. The accepted context JSON remains unchanged, 7,879 bytes, SHA256 `6b67818b4fb2c334bce958f1b50a3a8d3e66fd69269357dee35650ffe922a21e`.

## 3. Sources, REGISTER and narrow test accommodation — accepted

The Sources addition is one exact paragraph after the existing zebra source paragraph. It names the chosen historical fire product, type/confidence policy, source credits/licence, selected tree-cover product/threshold, temporal mismatch and regional-only limitation. The REGISTER entries accurately describe the retained private source files, published aggregates, offline method and source limitations. Their prospective “Filed with release merge” wording becomes true only upon Chad's approved release and must be completed with the actual merge identity/time in the records.

Independently reconstructed the expected Sources file from **NC_MAIN** plus `CTX_SOURCES` at its prescribed position: it is byte-identical to the candidate Sources file. Then changed each of the following in memory: the new line's wording, removal, relocation, unrelated title whitespace, an existing source identifier, the Animals shortcut, and the Animals tab target. All seven mutations changed the expected comparison and were refused by it.

This is an independent check of the exact whole-file comparison, not a rerun of the full Playwright Animals suite. The reviewed code retains all separate header/link/section/source/Low-class guarantees. The comparison has not been reduced to presence checks.

**BASE_MAIN, TL_MAIN, NC_MAIN and NC_PARENT are all unchanged**, independently checked against the base tree. No Nature pin was moved to an Animals commit. The adjustment is the narrow exception requested in my candidate review and is accepted.

## 4. Final scope and regression evidence — accepted

The four already-reviewed feature files are unchanged: Animals page, context script, context JSON and the eight-line stylesheet addition. The final changes beyond them are the reviewed Sources/REGISTER additions, narrow test maintenance, measurement formatting/control, records and evidence. The context data and user-facing feature need no new broad browser review solely because the resource log and source records changed.

Claude's final-tree logs report: context UI 30/0 and all 12 breaks caught; Animals 282/0; census 71/0; corridor 102/0; hub alignment 6/0; builder 17/0; extractor 72/0; Hansen download controls 5/0. The shared Sources suites pass except the three disclosed Kept World View failures, reproduced on baseline main as well. Those are not presented as a passing Kept suite or closed by this release.

The earlier independent candidate review already verified the actual fire totals, exclusion accounting, all six Hansen input hashes, the ellipsoid area calculation, narrow layout and wrong-pin/unavailable UI states. This bounded recheck carries those findings forward because the feature/data files are unchanged. It does not claim a fresh complete raster recount or full independent execution of every browser regression.

Tools, tests and records are not page-runtime dependencies. Do not interpret the packet's “not served” label as an access-control guarantee: ordinary repository publication rules still apply. No raw CSV/TIFF or secret is included in the reviewed publication scope.

## Release identities

| File | SHA256 |
|---|---|
| animals.html | `4e75d051f690573f3401b7ad51e27c64efe5b10625bc32d5063caa831f3fc0ed` |
| animals-context.js | `a12594c11291890c181b8b46b4e8350785f48833bcc5ded6387a75d99cf455cc` |
| style.css | `3f8515c2fe661fc9517c35f0052b9250dbc30da763fb05d8201c3bdfc06f1c4d` |
| context JSON | `6b67818b4fb2c334bce958f1b50a3a8d3e66fd69269357dee35650ffe922a21e` |
| sources.html | `99931b2a6df942e08c8a6feb7d24be9aa4c521c7ddef2d3eebcfd41144975128` |
| REGISTER.md | `929eef63bd4e9ad0fa9b6f1816670bdc4e9915719ac44df27166dfa164f4b7bc` |

Release builder: `880dc87c3e9cb8b98bc1f01b374085d203fcd220976d39d002534189451a5ca3`. Animals suite: `77b7aa71aba491c31be180c9720c49d6df6ea199760577ef1e09ce69375c24cf`.

## Next action

File this review unchanged. Claude may now ask Chad for the exact page-release approval naming branch/head, then merge while preserving fresh main, verify served hashes and perform the scoped live check. Any new production-code difference, conflict requiring such a change, or changed context bytes returns to review before publishing; ordinary documentation-only landing updates do not require restarting this review.

Suggested owner line, for Chad to give in his own message if ready:

> Approve: merge animals-journey-context-proposal at 16133f23ed07ebb2f89ac3e9d5ffedc2dc7788f4 into main for the C1a zebra historical regional land-context page release, preserving current main, with served-hash verification and the scoped live check. No hub change; corridor remains parked.

After live verification, record actual release identities and close the completed zebra work. Real phone, Safari, screen reader, print, true 200% zoom and independent live smoke remain unverified by this recheck. Email-dependent work and corridor remain parked; no wider Animals or Nature work starts automatically.
