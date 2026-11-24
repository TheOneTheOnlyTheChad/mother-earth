# Animals NC_MAIN patch and combined Nature context release — independent review

24 November 2026 · GPT independent reviewer.

**Verdict A: PASS the Animals-owner maintenance patch unchanged at `4ed4ca6`.**

**Verdict B: accept the combined tested bytes at `f75c16709ac6ad4c37cdf5595a2f61ae818f12c4`, with the disclosed test limits. Correct the finalisation/approval order before asking Chad to approve publication.** No production action is authorized by this review.

This resolves the previously outstanding GPT review of the Animals patch. The Nature context thread remains the combined-release coordinator; no rewrite or separate landing of that patch is needed.

## 1. What was checked independently

Read the Animals record, exact suite diff and its controls, then the combined release packet, comparison summaries, relevant rerun/failure logs and REGISTER correction. Verified all **127 combined-packet checksums**, with no missing item or mismatch. The four production-document/page bytes match exact tested commit `f75c167`; the Animals suite matches exact patch head `4ed4ca6` and is byte-identical in the combined tree.

Made a temporary Git clone of the public release branch and checked out exact tested commit `f75c167`. Verified that reviewed page H `90eb52203c23b26a7fe00382f30cf3453b00a583` remains an ancestor. Git confirms the entire non-review diff from baseline `7e03793` is:

```text
REGISTER.md
app.js
index.html
sources.html
phase1/animals-tab-ui.test.cjs
phase1/nature-context-ui.test.cjs
phase1/place-rows.test.mjs
phase1/place-ui.test.cjs
```

Independent execution used the candidate's actual section-13 comparison block, extracted in memory before browser startup, with the real Git history and unchanged checked-out files. **All 13 non-browser comparisons pass.** Separate mutations of `app.js`, the index Animals link and a required Sources identifier fail 13k, 13b and 13e respectively. An unavailable pin independently fails 13b/13k/13e/13j; an older parent fails 13j. This is not a full Animals browser-suite run. Independently ran `hub-alignment`: **6 passed, 0 failed**.

The full 282-check Animals run, browser suites and cloud control matrix remain Claude's evidence. Earlier GPT review already independently closed Nature context H1–H3 for the identical page bytes; this review does not repeat or broaden that scientific/data contract.

## 2. Animals patch rulings

**Landing order: approve the proposed combined approach.** Neither the page change nor its test maintenance should be published alone. Keep H in history and merge the two branches together on the release branch, test the resulting tree, then publish them in one approved update.

The pin migration is narrow. `app.js` has its own comparison at 13k; the other 15 old script comparisons stay on `BASE_MAIN`. Index and Sources are held byte-for-byte to reviewed H while their Animals guarantees remain independent of those pinned bytes. Sources still checks the section, shortcut, six source identifiers, Low-use-class wording and exclusion of “private preview”; both pages check the tab/menu links exactly once and their old-header relationship. `TL_MAIN`, stylesheet protections, Moon/Sun and other comparisons remain unchanged.

Moving the existing 13c break from `app.js` to `layers.js` preserves its purpose. The new app-specific break protects 13k. The recorded failed-to-apply edit was correctly excluded from catches and rerun with a unique anchor.

**NC_DIR: acceptable with the stated limitation.** A supplied folder is not authenticated merely by naming H. Use verified exports when that mode is needed. The independent Git scope check remains compulsory and fails closed if its commits/range are unavailable; do not replace it with a silently skipped assertion.

**Records patterns in 13j: acceptable for this fixed reviewed H.** The production and test paths are explicit, the record patterns are narrow and separate, and the actual commit/range has been inspected. This is an allowlist for changed paths, not a privacy/content audit of every possible future record. Any future pin move still requires its own scope and content review. No need to rewrite the present patch solely to turn these patterns into literals.

Exact stylesheet-version comparison through pinned page bytes is acceptable. The pre-existing duplicate 13f labels need not be changed in this patch.

The supplied eighteen caught breaks and missing-pin/bad-baseline/extra-style/older-parent controls support the documented guarantees. In particular, the bad-baseline logs show `whole: true` while an Animals clause independently fails; the byte comparison is not doing all the work. These control results are not represented as new GPT browser runs.

## 3. Combined candidate and test limits

The page hashes remain those GPT accepted. The Animals suite is the owner's unchanged patch. The REGISTER diff adds one dated correction while preserving the original historical explanation and 1 November sample. No Worker, stylesheet or Timeline production file changed in this release tree. The correction is appropriate; “no upper bound” refers to the query's date filter, not complete provider coverage.

The paired logs support the following description:

- New Nature suite **78/0**; Animals **282/0**; hub alignment **6/0**; history hub **33/0**.
- The initial missing-library/screenshot-directory stops are followed by successful reruns on the same candidate and baseline. The initial `_summary.txt` alone is not the final result; the individual rerun logs support the packet's corrected totals.
- OSMC reliability is **40/1 on both trees**, with the same old-page TypeError at the same assertion. Treat it as a disclosed pre-existing fixture/page-compatibility failure, not a passing suite or a newly cleared OSMC defect.
- Five suites remain unrun on both trees for absent orbital/ocean-heat fixtures. Their names and reasons are disclosed. “54 suites” means attempted inventory, not 54 passing suites; the Nature suite is absent from baseline main rather than passing there.
- Proxy-refused hub connections do not establish a live-hub test. The page tests use routed data. Real phone, Safari, screen reader and live-data validation remain open.

Those limits do not require unrelated feature work before this bounded forest wording/count/freshness correction can reach owner approval. Carry them into the release record without claiming a fully green or live-data regression.

## 4. Required release-order correction

Packet §4 currently places the fresh-main merge, exact-byte comparison and final tests **after Chad's Approve line**. Move that preparation **before** requesting the line. Chad must approve the concrete final candidate that has already been reconciled and checked.

Use this order:

1. File this PASS for `4ed4ca6`; keep the patch unchanged.
2. Fetch/merge current main into the release branch. Verify every non-document file still equals the accepted tested tree, inspect the remaining document changes, and preserve H's reachability. Any production/test difference beyond the reviewed scope needs assessment before publication.
3. Rerun **all four named final checks** on that final tree: `nature-context-ui`, `animals-tab-ui`, `hub-alignment`, `place-ui`. Record exact commit/tree, results and page hashes. Fix the packet's obsolete “two release-critical suites” reference so it agrees with the four listed checks.
4. Present that final prepared candidate, residual limits and publication action to Chad for his own Approve line.
5. Immediately before publication, verify the approved candidate and main relationship still hold. If main moved, reconcile and assess the difference; do not silently publish a different production/test tree under the old approval. Push only on Chad's explicit authority.
6. Read served hashes and live forest/card/place/Sources behaviour, update records, then delete the three release branches only after successful release verification and Chad's applicable cleanup authority. No premature deletion while a release or rollback decision is unresolved.

No new broad smoke test or account action is commissioned here. If the final reconciliation changes documents only and the four checks pass with identical reviewed production bytes, another full GPT code review is not needed solely for that reconciliation; report the final evidence before asking Chad to approve. Reopen review for material code/test changes, new failures or changed acceptance claims.

## 5. Accepted identities

| Item | Identity |
|---|---|
| Animals patch head | `4ed4ca6` |
| Animals suite SHA256 | `2921d437ee6121af5d3836ef96aace33cabbbe765db89c47e16efb781af4cc38` |
| Reviewed page H | `90eb52203c23b26a7fe00382f30cf3453b00a583` |
| Combined tested tree | `f75c16709ac6ad4c37cdf5595a2f61ae818f12c4` |
| Combined packet head | `9824c7e` |
| Combined packet SHA256 | `d445aa79a17f81beee3eca3c520ba0785be031c477bebfc17bd679a9b6be0c97` |
| `app.js` SHA256 | `a48769068c1a3fa1a2440f57e21610bd5d8f8195ce1e516cc79bfaaba9bd0e5a` |
| `index.html` SHA256 | `70b43b3e14198c9159204a1fa9bd1d5deff6031aca344c9329a9e9f4979d1b40` |
| `sources.html` SHA256 | `d6ca4fae29e269adb093a311cd6bf9bd66b27cae7031521d3546b276e12cc70a` |
| `REGISTER.md` SHA256 | `916809555a1f580a47012a27a20458f4376ceee6f3a1def6cc240e71047f5c7c` |

No project checkout, public branch, live service or account was changed by GPT. The temporary clone was for independent read/test work only. Soil/global-alert work and Earth from Space Stage D remain separate.
