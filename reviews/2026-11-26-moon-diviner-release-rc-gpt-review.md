# Mother Earth — Moon temperature release-candidate review

26 November 2026 · GPT independent reviewer

Supplied release candidate: branch `moon-diviner-ui`, final commit **`310ca1e`**; validated tree `8b233d9`, release payload `cc75407`, Animals maintenance `8b233d9`. Reviewed the supplied Mac `_review/moon-diviner-ui/` copy, the release packet and preserved passed preview.

## Verdict

**PASS for release of the reviewed Moon temperature candidate `310ca1e`, page only, on Chad's own approval. No hub deployment.** No remaining release hold found within the reviewed scope.

This is release-content clearance, not a claim of live deployment or successful served verification. After the approved merge, verify against the exact reviewed 44-file manifest, perform the bounded live layer check and record the result.

## Independent content checks

- Checked all **44** unique manifest entries against the local candidate overlay: changed files from the review copy and unchanged files from the main Mac mirror. Every byte count and SHA-256 matches. Scope: **35 root HTML/JS/CSS files and 9 selected assets**, not every asset or endpoint on the site.
- Reviewed manifest SHA-256: **`7bf9576a56b987501170d58d2c092a997d46aa4d024bb6f8a7c3d17ebba82f78`**, path `reviews/evidence/2026-11-26-moon-diviner-manifest.json`.
- Compared directly to the preserved passed rev 2 preview: `moonsci.js`, `moonsci.css` and the temperature gzip are **byte-identical**. Removing only the intended Details link from candidate `moon.html` exactly recovers that preview's HTML.
- The data gzip remains `1d81cb86738d81797ad92449419d4c46a2e8ffe6233a66863dcf2e05fde611d0`. Its numerical contents remain those independently verified in the preceding preview/global reviews.
- Removing the new temperature Sources section and its shortcut exactly recovers main's `sources.html`. The section has the named quantity, precise statistic, dates, citations, bin-count/range meanings, masks as policy, unequal colour scales, cell-share qualification, rounding, clipping and selected-site comparison caveat.
- Removing the new Diviner REGISTER entry recovers main's REGISTER (ignoring surrounding whitespace). The entry records RC status, retained extraction, acquisition/checkpoint deviation, scientific interpretation, reuse attribution, limits and review cadence.
- SOURCE differs from the passed preview only in build provenance and the new review metadata. The actual builder hash matches SOURCE, and the checkpoint-file hash matches the actual checkpoint. The scientific comparison caveat and frozen display policy are retained.
- Reran the independent actual-code Node VM checks on this RC: temperature entry/replacement and height entry/replacement deadlines settle without switching the map, late outputs are released, retries succeed; an ordinary height HTTP failure still displays its original reason. All passed. These are mocked browser-boundary tests, not new Playwright or live-browser runs.

The named Git commit relationships and final packet-only difference are Claude's recorded repository evidence. This review independently verifies the delivered Mac content, preserved preview comparison and manifest; it does not claim an independent GitHub history inspection.

## Validation evidence and limits

The packet records a stable detached validation worktree at `8b233d9`. Its reported primary results include temperature 178/0, height 110/0, Animals 294/0 and all 31 mutations applied and caught. Missing-pattern/setup failures are distinguished from behavioural failures. I inspected the packet and relevant test code; I did not independently rerun its full 30-suite matrix, 31 browser mutation runs or inspect the ephemeral workspace logs.

The exceptions are adequately disclosed for this release:

- Tides T1a is a feature-branch scope assertion rather than a Moon behaviour failure.
- Smoke-fixes, kept-ui, ux-round1, timeline-mixed-assets and osmc have recorded matching baseline failures.
- Moon-lit passes 138/0 in the isolated rerun; osmc's additional parallel-load timing failure disappears in isolation, leaving the recorded baseline failure.

These are accepted as recorded baseline/test-environment qualifications, not relabelled as universally green or independently closed defects. No unrelated repair is required to ship this page change.

Real phone, Safari, screen reader and verified hardware-renderer checks remain unperformed. Earlier bounded in-app-browser preview behaviour was checked; this RC has no new controller change requiring a repeat broad smoke before approval.

## Release execution

1. Chad approves **`310ca1e`** explicitly. If served content changes during reconciliation with newer main, return the changed candidate for review rather than treating this approval as covering arbitrary new content.
2. Merge page-only; do not deploy the hub or change collectors, R2 or D1.
3. Verify the live site against the **reviewed manifest above**, not a newly generated post-merge baseline. The current helper's `--pane` output derives its literal expected list from its current working tree: generate/preserve that script from the reviewed candidate or explicitly verify its literal expectations match this reviewed manifest. Do not silently absorb later differences by regenerating expectations.
4. Record 44/44 or the actual mismatches, the time and merge commit. Check noon → midnight → height → off, including restoration of the original lighting choice. If Lit was off before science entry, it must remain off afterwards; if on, restore it for the current minute. Earth camera does not reopen automatically.
5. Mark REGISTER live, file the release/served result and update STATUS, START-HERE, HANDOVER and the full Moon checklist. Preserve historical manifests and errata. Sync the Mac/Project, archive the review copy preserve-first, and delete only this feature's completed branches when appropriate. The acquisition branch is labelled not-for-merge; preserve its tooling/evidence in the released tree before closing it.
6. Continue the remaining **Moon/LRO checklist** item by item. Diviner release closes the temperature item, not the entire Moon spec. Sun waits for the agreed full Moon close-out.

Minor documentation polish for a later documentation update: Sources' “switching it off brings sunlight back” is shorthand for restoring the prior lighting choice; the actual code and tests correctly preserve an initially off choice. This does not require changing the reviewed functional candidate.

Suggested owner approval:

> Approve: release Moon temperature from `moon-diviner-ui` at `310ca1e` to main, page only; no hub deployment. Verify the live site against GPT's reviewed 44-file manifest and record the live layer check, then complete this item's release cleanup and update the full Moon checklist.
