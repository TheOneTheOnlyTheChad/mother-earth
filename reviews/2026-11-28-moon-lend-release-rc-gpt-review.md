# Mother Earth — LEND release-candidate review

28 November 2026 · GPT independent release review for Chad and Claude.

**Verdict: PASS for Chad's release decision on candidate `5ed9d7041445aa557e326f5c8f583957526bc641` (`5ed9d70`), branch `moon-lend-ui`, page only. No hub deployment or north acquisition.**

This reviews the exact candidate, not an unrestricted future branch head. `7f851cc` adds records after it; preserve/file the packet during close-out without silently substituting another release payload. Production still requires Chad's own approval.

## Independent checks

- The Mac review folder `_review/moon-lend-rc/` contains exactly its 84 listed files, all with matching hashes.
- Compared the candidate's moon.html, moonsci.js, sources.html and reviewed manifest directly with their raw GitHub bytes at the full candidate commit: all four match the delivered copies.
- Verified **55/55 manifest files locally**, using the candidate overlay plus unchanged project-mirror files. This is a pre-release byte check, not a live served check. Compared with the CRaTER manifest: one added asset; four changed existing files (moon.html, moonsci.js, moonsci.css, sources.html); no removals.
- The LEND data asset is byte-identical to the passed preview. The preview review independently reproduced every one of its 14,400 records from the retained source, including states, values, formal errors, support and native exposure. That numerical result remains applicable.
- Read the preview-to-RC code diff: the functional change is the explicit finite-reference check; remaining changes there update the opening comment. Read the Sources section, REGISTER entry, Details link, Animals pin code and submitted tests/logs.
- Re-executed the actual candidate moonsci.js in my independent Node DOM/canvas/globe fixture. Crafted NaN reference mean (offset 52) and NaN reference error (offset 60), each with a matching outer test hash, now fail at the header validator. Normal all-cell decoding, readout and cached re-entry still pass. Appearance 404, corrupted bytes, decode failure and null PNG result retain the view and permit retry. Deadline/late-resource cleanup passes on first entry and while replacing temperature. These are code/fixture checks, not a real-browser rendering or timing measurement.

## Required preview fix: closed

Both reference numbers are read once, checked with Number.isFinite, then compared within tolerance. The payload and outer pins remain intact. The submitted browser tests cover both NaNs, infinities and retaining the height texture after rejection; the nofinite mutation reproduces the original four failing assertions. Infinity cases were already rejected by the old code, as the packet correctly discloses.

No further implementation change is required by this review.

## Meaning, provenance and presentation

Sources and REGISTER retain the agreed boundaries: relative difference in the archived CSETN_RATE field; unresolved normalization/background definitions; no raw count-rate unit, calibrated flux, hydrogen/ice amount or trajectory pairing; historical period and version; 30 km radius / 60 km diameter display smoothing; inverse-variance rather than equal-area averaging; propagated first-order formal error conditional on independent archive errors; display cutoff and palette not significance or accuracy.

The exact counts remain 11,656 shown, 987 archive missing, 317 error-withheld and 1,440 edge-withheld. The additional 1,102 shown cells with missing-affected support are disclosed. Native exposure is identified as accumulated, not a continuous observation duration. The source/derived hashes and product LIDVID match the established evidence. REGISTER is appropriately marked RC, not live.

The Sources phrase about preventing one-sided discs is understood to concern the product's geographic boundary; nearby text explicitly discloses missing-affected support. It must not be read as proof that every displayed disc has complete source coverage.

## Validation and exceptions

The supplied frozen-tree logs support LEND 83/0, builder 436/0, nine builder mutants caught, Animals 308/0 and the listed positive regressions. Each of the 17 LEND mutation logs contains its applied-pattern marker and counted assertion failures. The RC runner captures their nonzero exits correctly. The nine Animals tamper logs support the narrow pin updates and older controls; the data/page baselines behind those checks remain in place.

The reported exceptions are qualified as follows:

- Kept and UX: candidate/main assertion failure lines match.
- Timeline mixed assets: candidate/main both report 16 pass, 2 fail. Expected element counts differ because Moon/Sources content changed; the reported failure result remains the same.
- Smoke fixes: candidate/main show the same fire-record assertion failures and wait timeout, apart from their worktree paths. It is an open baseline exception, not a passed smoke test.
- OSMC: both stop at the unavailable historical commit `0386058`. This is an **incomplete test caused by missing fixture history**, not evidence that OSMC behavior was fully tested or passed. Record it that way.
- Tides: T1a rejects feature-branch scope; main passes. This is not an unexplained feature regression.

The one-off main comparison loop's incorrect exit reporting is disclosed. My comparison uses the actual assertion/error lines, not its zero exit codes. No additional broad sweep is requested on this unchanged tree.

Still unverified: real phone, Safari, screen reader, hardware rendering and device performance. My release review adds no independent live-browser claim.

## Release instructions after Chad's approval

1. Recheck main immediately before merging. Carry unrelated records safely. If served code has moved, reconcile it and return any material payload difference for review; do not assume this review covers it.
2. Merge/release the exact approved candidate, page only. Verify the resulting served tree matches the reviewed manifest before pushing.
3. Build the expected live-check list directly from the reviewed file `reviews/evidence/2026-11-27-moon-lend-manifest.json`, SHA-256 **`4764f405a45fb8584c0dbafdd569b4575db6b9fa35337018609c7b79c7416861`**. Do not regenerate expectations from the current working tree.
4. After Pages publishes, verify all **55** live files against it. Bounded functional check: off by default; open and show the cap/legend; south-pole and centre readout; representative value and missing/withheld/outside readouts; leave and restore prior lighting; existing layer switch; Details link. Use an active foreground tab. Do not label this a performance or full regression test.
5. Record actual live verification and limits, mark REGISTER live, update checklist/STATUS/HANDOVER, file this review unchanged and preserve the RC packet. Sync the Mac preserve-first; archive the review material and keep raw inputs. Delete only this workstream's fully contained branches/worktrees. Prepare the next-item handover without starting LAMP or Mini-RF automatically.

Suggested owner approval, if Chad chooses:

**Approve: release the Moon south-polar LEND record from `moon-lend-ui` at `5ed9d70` to main, page only; no hub deployment or north acquisition.**
