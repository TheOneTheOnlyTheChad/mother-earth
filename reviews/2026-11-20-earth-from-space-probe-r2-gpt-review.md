# GPT's independent review of probe revision 2 (`26ae2c8`): PASS

Filed 20 November 2026 as received from Chad. Unchanged apart from this heading. Not authorization to deploy.

Earth from Space — probe revision 2 independent review

20 November 2026. Review clock reading: 10:10:32 UTC / 12:10:32 SAST.

PASS for the focused probe revision and reviewed reference configuration. Both previous probe holds are cleared. The candidate is ready to prepare the concrete Stage A approval package for Chad. This is not authorization to deploy, fetch from EUMETSAT, spend, change production, or proceed to Stage B.

Candidate identified in the supplied packet: earth-from-space-rc, 26ae2c8ab06e1ecfb9292a050691e1b22c043cf0. Reviewed directly from ~/Documents/Mother Earth/_review/earth-from-space-probe-r2/.

Verified identity

PACKET-probe-r2.md:
c830ba49509d452dee34ddfbc64edef392b656eeba7848b6d1e5b430f0475649

phase1/worker.js:
e2b6fb6dcac0af0f2dbdc5b8acb789d24ca51a15464a665dde4e7a8c90cfca6a

phase1/evprobe.js:
0da64400098105fa7fd586ccdcf95714f7c4265a7ceefdec7a44b6eb1679e0c0

phase1/evprobe.wrangler.jsonc:
23d6e1d81c4999de2a9b9d8ee9aa059d9d651ac443010e0a5778c5015b67942b

All supplied hashes above match. Worker hash is unchanged from the reviewed recovery candidate, so those recovery closures and their stated limits carry forward. The reference configuration is byte-identical to the preserved previous review copy.

Independent checks

Run directly from the complete submitted copy, Mac Node v24.14.1:

evprobe.test.mjs: 94 passed, 0 failed, including full-window simulation.

earthview-hub.test.mjs: 294 passed, 0 failed, default mode without FAST.

evprobe.build.mjs --verify: passes; exact generated probe hash above.

Four targeted mutations applied and failed:

Break

Result

actual-time-ignored

50 passed, 6 failed

request-may-outlast-slot

52 passed, 4 failed

report-stitches-attempts

90 passed, 4 failed

report-cpu-null-is-zero

85 passed, 9 failed

The two driver mutations used SIM=0; the report mutations ran the simulated window. I did not independently run all 28 mutations or repeat the workerd/browser checks.

Hold 1 — actual expiry: closed

The driver now uses scheduled time to choose the slot, actual time to permit entry, and the remaining slot duration to permit each request with its full timeout.

My independent reproduction delivered the valid first slot twice while the actual clock was one hour after the approved end. Result: zero upstream requests. This was the failure reproduced against revision 1.

The entry, per-request slot checks, late-event tests and per-isolate duplicate suppression address the inspected issue. The total is now honestly stated as 70 planned opportunities, at most three requests per delivered attempt, and 210 only under one delivery per scheduled time. No durable global quota is claimed.

Hold 2 — report qualification: closed for the reported cases

I built an independent conforming control with attempt IDs, reviewed build/start, correct input facts and expected validation records. It qualifies, so the new negative tests are not merely rejected because their control lacks the required schema.

The same independent changes now produce:

Only one validation in the 2048 phase-2 attempts: 2048 incomplete; the unaffected 1536 size can qualify.

No ballast invocation records: checkpoint incomplete for both; no size selected.

Null CPU everywhere: CPU incomplete for both; no size selected.

Mixed partial attempts for a required 2048 slot: 2048 incomplete; no stitching.

Two otherwise clean attempts for that required slot: 2048 incomplete.

The implementation also inspects individual validation indices and done counts, explicit successful invocation outcomes, valid numeric CPU values, plan/build/start identity, and input-hash-based diagnoses. The added regressions cover the inspected paths.

Judgment on duplicates: marking two clean attempts as incomplete for a slot needed by a criterion is acceptable and conservative. It is an evidence/plan exception, not proof the decoder lacks capacity. Return it for a decision; do not silently select one attempt or extend the approved window. Diagnostic rungs above the checkpoint remain governed by the published criteria.

Packaging: closed for suite execution

The required original fixtures, derived fixtures, Dust input and derived-input generator are now present. Both suites ran directly without reconstructing the tree or substituting inputs.

The committed derived JPEG hashes match the expected hashes recorded in make-1536-derived.py. I did not independently regenerate them: this Mac's python3 lacks Pillow, so --check stops on that missing dependency. This does not prevent the Node suites from using the supplied fixtures. Claude's byte-for-byte Pillow 12.3.0 regeneration remains his evidence.

Minor document correction only: this copy stores the suite evidence under reviews/evidence-probe/suites-probe-rev2-2026-11-20.md; the packet's older reviews/evidence/… path should be updated. This does not block the pass.

Scope and next step

The probe pass establishes the reviewed local behavior and reference configuration. It establishes no hosted memory capacity, CPU cost, served-time behavior or full-hub concurrency result.

Recovery scope is unchanged, including P4 and the ordinary collector's claim-to-publication grace-period assumption. The no-store full-hub route is still unbuilt. Final regression, release usage and real-device evidence remain as previously recorded.

Before asking Chad to authorize Stage A:

Choose the actual UTC start/end.

Regenerate the probe for that start, run --verify and inspect its resulting slot table.

Name the final file hash and concrete configuration in the approval request. The hash above has an illustrative start; it must not be substituted for a newly generated file.

Retain the reviewed delivered-attempt request wording, logging, expiry, removal and deployed-configuration read-back requirements.

A verified start-line-only regeneration does not reopen the whole readiness design. Any other code or configuration change needs review for its changed scope.

No implementation file was edited, no external source request was made, and no hosted or production action was performed.

