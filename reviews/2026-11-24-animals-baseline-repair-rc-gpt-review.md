# Animals baseline repair — independent review

24 November 2026 · GPT review for Chad

**Outcome: PASS for the targeted test-only candidate. No blocking finding. Ready for Chad's landing decision after a fresh-main integration check. No merge, deployment or assessment release is authorised by this review.**

Submitted branch animals-baseline-repair-rc at 0b28745, based on main 3160658. Reviewed the Mac copy at /Users/chadobie/Documents/Mother Earth/_review/animals-baseline-repair-rc/, especially read/record.txt, suite.diff.txt, breaks.log.txt and the control/result logs. Remote branch ancestry and the reported whole-tree transfer hash were not independently verified.

## 1. Preservation of the checks

The repair is appropriately narrow. BASE_MAIN remains 0e62083. The 16 non-Timeline script/suite comparisons, the Moon/Sun/Sources page comparisons and non-Timeline stylesheet preservation stay on that baseline. The three Timeline comparisons remain present under a separately named release pin, rather than being discarded or silently accepted.

TL_MAIN names the corrected R3 page-release merge, **19f4e077b94d3b66b226be3e0b6549e299ad1130**. It does not use the discarded ea39975 identity.

13g checks the Timeline script exactly. 13h checks the complete Timeline page plus the two Animals links and the independently constrained header. 13i checks all body.tl lines exactly and in order against the Timeline release. The changed served() reads let the declared breaks reach the actual comparisons.

The test file's only production relevance is its test coverage: no page, hub or data change is required for this repair.

## 2. Four rulings requested in record section 5

| Point | Ruling |
| --- | --- |
| Second release pin versus recorded-hash architecture | **Accept the pin for this targeted repair.** No new manifest/alignment subsystem is required. Include updating/reviewing TL_MAIN in the Timeline release checklist, coordinated with the Animals suite owner. A new value must identify an actual accepted release whose file changes have been reviewed; an arbitrary pin advance is not a fix. Prepare the update on the integrated release candidate so the suite need not land knowingly broken again. |
| Timeline stylesheet version now compared exactly | **Accept.** It is a useful conservative constraint today. A later approved shared stylesheet/cache-key change can require a narrowly reviewed expectation adjustment. Do not restore a broad allowance pre-emptively or move the pin solely to hide such a failure. |
| Assessment branch still carries the old suite | **Accept leaving it untouched now.** If this repair lands, merge then-current main into animals-assessment-rc before its next candidate/release review, resolve any conflict and rerun the affected suite. IUCN R1 remains open; this repair does not change permission or release status. |
| Break anchors in app.js and timeline.js | **Accept.** Exact-once replacement fails visibly when a source anchor changes. A failed-to-apply break is not evidence that the regression was caught: distinguish it from the required named-check failure, and update the anchor with the relevant source change. |

## 3. Independent checks and limits

Applied the supplied diff in memory to the current local main suite: it reconstructs the candidate test file exactly. Candidate SHA256:

83ff9b184f550aaa79898573f5c4305bf1896998453404011c1fcbdd541103ad

Compared candidate timeline.js, timeline.html, style.css and phase1/worker.js to the local main mirror: all four match exactly. The Worker remains the reviewed 551,400-byte 0.6.24 file, db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5.

Independently extracted and executed the actual 13h predicate with controlled text inputs:

| Control | whole | links | header | Result |
| --- | --- | --- | --- | --- |
| Unchanged page/baseline | true | true | true | pass |
| Same added header link in both tree and Timeline baseline | true | true | false | fail |
| Same missing Animals tab link in both | true | false | true | fail |
| Page-only trailing-space edit | false | true | true | fail |

For this isolated predicate check, the old-header input was explicitly synthetic: the current page with the two Animals links removed. It was not a retrieved copy of commit 0e62083. This independently demonstrates that the header clause can reject a bad header even when the whole-page and link clauses pass. Claude's historical-baseline results remain separate evidence.

The full Mac copy has no Git metadata, and Playwright was unavailable in the local resolution path. **GPT did not rerun the full 280-check browser suite, its ten breaks or the historical baseline comparisons.** The supplied full-suite 274/3 → 280/0 results, ten named breaks, old-pin control and missing-link control remain Claude's workspace evidence. Their logs and source are consistent with the proposed repair.

The split directory inputs BASE_DIR/TL_DIR are supplied baseline material, not authenticated by the commit constant itself. Any Mac rerun using them must use verified exports of the named commits, rather than pointing at the candidate tree.

## 4. Nonblocking clarity points

- There are now two checks labelled 13f: the new Timeline-baseline availability check and the pre-existing Earth-now isolation check. Give one a distinct identifier when next updating the suite so failure reports cannot be confused. No protection is lost by the duplicate label.
- 13i protects literal lines containing body.tl, not every possible spelling or semantic equivalent of a Timeline selector. This is consistent with the narrow partition of the current stylesheet; revisit the partition if stylesheet structure changes.
- Keep the disclosed cloud-only full-suite evidence explicit when filing the pass. No new phone/Safari/accessibility clearance follows from a file-comparison repair.

## 5. Landing boundary

No additional implementation round is required by this review. Before asking Chad for the landing line, compare/rebase against fresh main, confirm the only functional change remains this test file, and rerun the affected suite on that actual integrated tree. Changes to source files or the chosen release baseline would require the corresponding review; documents-only main movement does not invalidate the code reasoning here.

Keep Animals assessment and other threads' branches separate. Earth from Space Stage D remains uncleared. No production or account operation occurred during this review.

