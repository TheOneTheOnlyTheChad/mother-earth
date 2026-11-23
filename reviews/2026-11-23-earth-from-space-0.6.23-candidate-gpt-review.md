Earth from Space hub 0.6.23 — candidate review

23 November 2026 · GPT independent review for Chad and Claude

Verdict: one focused hold before deployment review can close. A returned row with an unreadable started_at is skipped rather than failing closed. The implementation otherwise follows the reviewed health-only direction, and the supplied focused suite and all its deliberate breaks pass independently here. This is not deployment or Stage D clearance.

Reviewed the Mac earth-from-space-0.6.23-candidate/ packet, Worker diff, new suite, break runner and schema, against monitoring brief rev 3.1 and my closure. Candidate identified as branch earth-from-space-rc, code 114dc5b, packet head 5d289e6.

Finding H1 — unreadable scheduled timestamp is treated as an unrelated row

At worker.js:2987, this condition combines invalid data with legitimate exclusion:

if (!Number.isFinite(s) || s < from || s >= until ||
    (s - from) % EVH.SLOT_MS !== 0) {
  outside++;
  continue;
}

Ignoring a readable timestamp outside the current trial or off its marks is correct. An unreadable timestamp does not establish that exclusion. Brief section 3.6 says unreadable times fail closed; R3's name also promises that, but its invalid-time fixture only covers finished_at.

Reproduced through the real HTTP routes in a reviewer-added R8: fill all 12 trial slots with valid completion rows, then insert one further earthview row within the query's finish-time range:

started_at:  unreadable
finished_at: 2026-11-24T06:02:00.000Z
status:      down
records:     0
note:        storage record needs repair

At final assessment the candidate returns GET statuses [200, 200], marks the extra row rows_outside_slots, and reports no finding. It should return [503, 503] with the fixed rows_unreadable reason: the row cannot be assigned or excluded safely. This demonstrates a fail-closed contract gap, not an observed malformed production row or an observed missed live alarm.

Fix requested: reject a non-finite parsed started_at before applying readable outside-window/off-mark exclusions. Keep the latter exclusions. Add a proper R8-style suite case with every expected slot already complete, also checking HEAD/status and safe fixed output. Add a deliberate break that changes this rejection back to skipping it, and prove the new fixture catches that break. Keep a readable off-mark adverse row ignored, as the existing U1 case requires.

The minimal separation was tested only in a temporary reviewer copy:

if (!Number.isFinite(s))
  return both('rows_unreadable', 'rows unreadable', base);
if (s < from || s >= until || (s - from) % EVH.SLOT_MS !== 0) {
  outside++;
  continue;
}

Original candidate plus R8: 48 passed, 1 failed; exit 1. Temporary correction plus the same R8: 49 passed, 0 failed; exit 0. Claude's files were not changed. These demonstrate the defect and a narrow remedy; they do not create a reviewed replacement candidate.

Independently verified evidence

Check on supplied candidate

Result

All five entries in SHA256SUMS.txt

Match

Worker hash

111fdd101a9b7bbbefc174f0f7f432890a913b08b4334f19b13a4c5a29e55db8

New health suite, native Node v24.14.1

48 passed, 0 failed

New break runner

37 of 37 caught

Reverse all supplied Worker diff hunks against candidate, checking each context/added line

Reproduces 540,792 bytes identical to retained 0.6.22

Reconstructed baseline SHA256

17798a44a217bdb3eafe1ccd8852833cc050b9bb0e9094f65c59a2db2eeda080

The byte comparison independently supports unchanged collector, admission, admin, storage and other-layer implementations outside the listed edits. The version bump still changes shared User-Agent/version reporting, as the packet discloses. This is a source comparison to the retained baseline, not my own read-back of the currently deployed file.

The focused suite usefully covers real SQLite query behaviour, HTTP routing, no-store/HEAD behaviour, no upstream or R2 activity, no writes, slot equality, startup findings, duplicate outcomes, future/unsettled streaks, end-window evaluation and the disclosed blind spots. I1 exercises the actual scheduled wrapper and proves timestamp preservation on its guard-refusal path; it is not a successful scheduled picture collection or a live trial.

I did not rerun the wider Worker regressions: the review copy contains the seven listed files, not the updated wider suites or probe file. Their reported results remain Claude's. I did not perform an independent Workers/D1 cost measurement, network request, account change or live fixture test.

Non-blocking records and operational follow-through

Old health mutations: the reported five misses on unchanged 0.6.22 are a separate existing test weakness, not a regression demonstrated by this patch. Keep a tracked follow-up; do not describe the old suite's mutation coverage as complete. The new checks have their own rule implementation and caught breaks.

Cost: the local timing figures are not Workers CPU or D1 rows-read measurements. Those still belong to the specified post-deployment verification. An indexed SQLite plan is useful evidence, not a production billing measurement.

Comments: the file header can list the new addresses. The new block's blanket statement that a finding stays until closeout should distinguish retained trial findings from missing completions that can resolve. Neither comment requires collection changes.

Future-time wording: the code uses the existing HEALTH_SKEW_MS allowance of five minutes for finished_at. Describe that accurately rather than claiming every timestamp even one millisecond ahead fails. The current R3 verifies a value well beyond that allowance.

M8 correction: the packet now says the stale monitor was not actually deleted. Treat it as outstanding, despite the earlier report. Its absence must be observed in the account before cleanup is called complete. The correction appropriately preserves the failed attempt in the history.

The disposable live fixture plan and revised runbook remain unwritten and are not cleared by this code review. Future monitor creation and verification must retain their separate scope. Stage C carries forward only as evidence for the unchanged collector; it proves neither these health checks nor delivery.

Focused return requested

Return the timestamp rejection fix, its added fixture and caught break, updated hashes/diff, the focused suite/break results and relevant health regressions. A bounded recheck can then close H1. No proposal restart or collector rewrite is requested.