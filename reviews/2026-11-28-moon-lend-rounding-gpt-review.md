# Mother Earth — LEND readout-rounding release review

28 November 2026 · GPT independent review for Chad and Claude.

**Verdict: PASS for Chad's release decision on `f0c76251964ec2b01f73f1016cfae723a1874839` (`f0c7625`), branch `moon-lend-rounding`, page only. No further code change requested.** Packet head `cbb62ca` adds the packet; this verdict names the exact tested candidate, not a future branch head.

## Independent verification

- All 84 files in the Mac review copy match its exact SHA256SUMS listing. The delivered moon.html, moonsci.js and manifest also match raw GitHub bytes at the full candidate commit.
- All 55 files in the candidate manifest match the candidate overlay plus unchanged project-mirror files. Against the previous LEND manifest, the path set is identical and only moon.html and moonsci.js hashes change. Data, colours, states, Sources and REGISTER remain unchanged.
- Inspected the code diff: the percentage and formal-error readout formatters now round integer hundredths to integer tenths half away from zero before assembling the decimal string. The other changes are the cache key, explanatory comment and formatter test hook. No science reduction, geometry, error propagation, selection or drawing code changes.
- Executed the actual formatter declarations extracted from candidate moonsci.js, and compared their output with Python Decimal ROUND_HALF_UP. **All 4,001 integer percentage inputs from −2000 through +2000, all 51 error inputs from 0 through 50, and all 11,656 shown source-file cells agree.** Positive/negative ties, neighbours, carries and exact zero are covered.
- The updated cache key is `moonsci.js?v=202612280400`. The data file remains the independently verified `9f185cc38cb8f378220b30f212deec8daf1e639071dcfe0304cb743038d26cdf` asset.

## Signed zero: keep the candidate as written

Keep the stored sign when a nonzero value rounds to zero: −0.04% can read “−0.0%”, +0.04% can read “+0.0%”, and an exact stored zero reads “0.0%”. This is a defensible presentation of a nonzero stored direction at limited display precision and preserves released behavior. It is not a reason to widen this correction or delay release. No formatter change or additional review round is needed for this question.

## Validation evidence and limits

The supplied complete-run logs support LEND 89/0, all 19 applied breaks caught, Animals 311/0 and its six tamper controls, plus the listed Moon/Sky/shared-page regressions. The old-toFixed and half-down controls each produce the expected three assertion failures. The narrow Animals pins preserve the previous chain and hold the new cache key to the rounding payload.

Two environment restarts interrupted the overall runner, but the packet distinguishes interrupted logs from completed tests and records the resume points. The interrupted tamper case was rerun whole. These events do not invalidate the completed results on the same frozen candidate.

The candidate/main exception logs remain evidence of baseline problems, not passing tests: OSMC is incomplete because its historical fixture commit is missing; smoke-fixes retains its fire-record failures and timeout; the other listed failure results match main; Tides T1a is a branch-scope check. Carry these qualifications.

The user-facing summary's “06:15–06:09” span is a typo; the packet and logs give the coherent 02:15–04:09 UTC / 04:15–06:09 SAST period, including main comparisons. Use recorded times in close-out.

This review adds independent arithmetic/code verification, not a new browser, phone, Safari, screen-reader, graphics or performance test. Those carried limits remain.

## Release and close-out after Chad's approval

- Recheck main and reconcile unrelated records. Any material served-code difference requires review rather than an assumption that this approval covers it.
- Release the exact approved candidate, page only. Check the merge's served tree against the reviewed manifest before publishing.
- Use the reviewed manifest itself for the live expected list: `reviews/evidence/2026-11-28-moon-lend-rounding-manifest.json`, SHA-256 **`943d243ba41a61807f9d5d0f38ae48413a0337cd95a6522256829931c4c320b1`**. Verify all 55 live files after Pages publishes; do not regenerate expected hashes from a later working copy.
- Bounded live check: a known affected cell shows the corrected rounding (for example cell 1604, 88.75°S / 82.25°E: −0.8% ± 0.4 pp), negative percentage tie −0.85% formats as −0.9% where available, and normal toggle/layer/lighting behavior still works. Use the foreground tab. No broad repeat sweep is requested for unchanged code.
- File this review unchanged, record the release and actual verification, close the rounding follow-up in checklist/STATUS/HANDOVER, preserve the original LEND release record and both manifests, sync preserve-first, and delete only the fully contained rounding branch/worktrees. Do not start LAMP automatically.

Suggested owner approval, if Chad chooses:

**Approve: release the LEND readout-rounding fix from `moon-lend-rounding` at `f0c7625` to main, page only; no hub or data change.**
