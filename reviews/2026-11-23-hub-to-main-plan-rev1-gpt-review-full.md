# Hub-to-main plan rev 1 — GPT review

23 November 2026 · Independent reviewer for Chad

**Verdict: direction accepted; revise the plan before presenting a landing candidate for approval.** Selective integration is appropriate. The remaining plan issues concern exact scope, publication, test dependencies and the replacement deployment rule. No merge, copy into Claude's project, branch deletion or production action was performed or authorised by GPT.

Read in full: `/Users/chadobie/Documents/Mother Earth/_review/hub-to-main-plan/HUB-TO-MAIN-PLAN-rev1.md`, dated 17:47 UTC. This folder supplies the plan only, not the proposed manifest or candidate tree. Branch ancestry, unchanged-main-file claims and the new 0.6.24 live readback are the plan author's evidence, not independently checked Git/account facts. The root Mac STATUS mirror still shows 0.6.23 at its newest entry, illustrating why it must not supply the new live baseline by itself.

## Q1 — selective copy rather than merging the Earth branch

**Accept.** A commit importing exactly the already-deployed hub and its supporting files can align main without publishing the unreleased Earth page. Joining all branch history is not required for that outcome, and a full Earth branch merge would carry page work outside the approved scope.

Record source commit, destination main base, each imported path's source and hash, and whether it is added or replaced. Keep a clear provenance note identifying this as selective integration, not a claim that the entire Earth branch was merged. The candidate may include several source groups, but its final landing must be tied to one exact reviewed commit.

Recheck both forms of drift immediately before landing: the deployed Worker/settings and the remote main tip. If main has advanced, do not overwrite it or force-push; rebuild/rebase the candidate onto the new main and repeat checks affected by that integration. If live code changed, reconcile against its new exact bytes before proceeding. A matching read taken “in the same hour” is useful evidence but not a substitute for the final pre-action check.

Keep `earth-from-space-rc` for the unreleased page. Merge the resulting current main into it later as separate reviewed branch work. Resolve page conflicts in favour of current released behaviour plus only the intended Stage E additions; never restore old Timeline assets incidentally. Exact matching copied files normally need no further content change during that future merge, but the histories still require reconciliation.

## Q2 — the file split, fixtures and tab suites

**Broad split accepted, subject to an exact reviewed manifest and dependency check.** Bring the live Worker, required offline tests/fixtures/helpers and selected public development records. Leave `space.html`, `space.js`, their navigation/style/script changes and the unreleased tab-specific UI expectations behind. Leave the disposable alarm-test Worker out of this integration as planned.

Do not pre-certify all approximately 146 new docs/review paths merely because the branch added them. Review the explicit list and its content before publication: source/rights records, branch-only concepts, correspondence, operational evidence and current/private planning have different disclosure implications. Keep private-access material, secrets and private account/correspondence details out. Existing previously approved source/review records need not have their conclusions reopened just because they are being integrated.

The current `phase1/`, `docs/`, `reviews/` directory guard is **insufficient as the scope check**: those directories can hold unrelated files, deployable helpers, HTML or JavaScript. Require the changed-path set to equal the reviewed manifest, permitting only explicitly listed current-state documentation additions. Also compare the actual byte changes; a path being allowed does not justify arbitrary content changes within it.

The **3.8 MB of fixture images is reasonable** for deterministic offline tests. Carry the provenance/licence note and verify the candidate files against its hashes. The retained fixture SOURCE.md describes six EUMETSAT images plus three derived 1,536 px JPEGs and records CC BY 4.0 and modifications. That retained note is supporting context, not independent verification of the not-yet-supplied final fixture set.

Correct the claim that test fixtures are not served or that the entire site cannot change. Test-only use means no page is intended to request them; it does not make files private. Landing them in the currently accessible repository exposes them, and the Pages publishing configuration determines which URLs it also serves. Inspect that configuration and keep the existing rights/credit obligations. If page-delivery hashes stay equal, say **“the existing page files are unchanged; the repository gains the listed hub/test/record files.”** Do not equate that with no new accessible material. A repository-only landing may trigger a Pages build even though no hub deployment is intended.

Preserving main's existing header-tabs, desktop-overflow and timeline-ui expectations is correct: the Earth branch versions expect the unreleased tab. If any copied helper/test actually needs that unreleased page or a private file, either exclude it with a reason or decouple its fixture on the candidate and review that change. Do not silently import the page to make the test pass.

The manifest must also show that `schema.sql` is unchanged; the existing R3 catalogue is the exact final bytes from the Timeline merge; main changes are not lost when replacing version-sensitive tests; and every imported shell/probe/deploy helper is merely copied, not executed, installed or scheduled. Copying helpers gives no permission to operate them.

## Q3 — which browser suites before landing?

**Run the suites that depend on the changed material, not automatically all 45.** This needs a named dependency inventory on fresh post-Timeline main, including direct Worker execution, transitive helper loads, file/hash comparisons and any changed fixtures. Then add a small smoke of the existing page/header/Timeline behaviour appropriate to the final diff.

The plan's 13 may be the right count for direct/transitive execution, but it is not established by the supplied plan. In the available main/release mirrors a literal search finds 14 browser-suite files mentioning `worker.js`. This is not proof of 14 runtime consumers:

- `animals-tab-ui.test.cjs` includes a byte-comparison guard for `phase1/worker.js` in its section 13; it does not need to execute the Worker to be affected.
- `skycraft-ui.test.cjs` calls `skycraft-fixture.mjs`, which loads and executes the Worker, so dependencies must be followed through helper calls.
- `timeline-changes-ui` must be assessed in its final post-Timeline form, not taken from the older Earth branch copy.

Classify each named suite and its expected baseline. A historical immutable-baseline assertion may legitimately fail after an intended hub migration; do not delete it or blindly rebase its expected values. Explain the changed contract, retain the relevant old guarantees, make a focused test migration if needed, and review it. This may mean revising the plan's promise that every other suite is untouched.

Run the identified affected set against the candidate and a matched fresh-main baseline in the same Mac environment. Candidate-only behavioural regressions must be resolved before a landing recommendation. Baseline failures or missing local data/dependencies must be diagnosed and reported; neither is a pass. If an environment failure prevents a critical affected test from running, repair the harness or provide equivalent focused evidence for review before the approval line. The pre-candidate plan cannot guarantee every old suite already passes.

Keep the 47 non-browser comparison with skipped/not-run counts, plus the relevant new health and catalogue mutation checks. Preserve meaningful test results and exact source identities rather than treating a fixed suite count as the acceptance criterion. No need to rerun unrelated browser suites solely to reach 45 if the dependency inventory supports exclusion. Run all affected shared-page suites if the candidate's actual diff unexpectedly touches those assets.

The supplied plan makes Mac browser execution a pre-approval requirement. This review does not waive that requirement or claim it is already satisfied. The local GPT runtime previously lacked Playwright and listener permission; capability must be established for the selected runner before promising execution.

## Q4 — replacement for “never deploy from main”

**The stale-main warning can be retired after verified alignment, but the proposed reverse-diff rule alone is insufficient.** It proves a code baseline relationship; it does not prove the candidate is approved, current, complete, compatible with settings, or safe to roll back after later data/page changes.

Suggested replacement:

> Build hub changes on a branch from current main. Record the fresh deployed baseline code hash, the candidate's exact commit/hash/size and the complete reviewed diff. Reversing that diff must recover the freshly read deployed code byte for byte. Recheck live and main drift immediately before the action. Deploy only the exact reviewed candidate on Chad's explicit approval, with settings, schema, storage and schedule changes separately specified. Preserve the exact rollback artifact and its compatibility conditions. Verify deployed code/settings and affected live routes after deployment, then integrate/record that exact source on main through the approved landing flow. Main is a source baseline, not automatic deployment permission.

For this alignment landing there is **no hub deployment**: main is receiving a file already running live. Keep the old warning in force until both the live readback and landed main bytes agree. Put the replacement rule/current-state note in the reviewed landing candidate where practical so main does not temporarily carry the corrected Worker alongside contradictory standing guidance. Historical dated records should remain historical; update current pointers rather than rewriting old outcomes.

## Required changes for rev 2

1. Explicit file-by-file import manifest and exact-path/content checks, including public-exposure/provenance review of the record/fixture additions. Replace the blanket “site does not change” claim with the narrower verified page-byte statement.
2. Named dependency inventory and candidate/baseline browser plan, including indirect loads and file-identity guards. Allow focused, justified suite migrations if their historical baseline assumptions conflict with the approved import.
3. Stronger deployment rule, final main/live drift checks and coordinated current-state documentation. Retain exact rollback dependencies and separate approval boundaries.

These are plan revisions, not a request for a deployment or permission to land now. After revision, prepare the isolated branch candidate, full diff/manifest, dependency results and review copy for GPT before Chad's landing line.

Branch deletion remains a separate explicit Chad action. The plan's “can be deleted now” is an eligibility proposal, not permission: verify the source commit and unique-file preservation before deleting anything. No need to bundle deletions into the alignment landing.
