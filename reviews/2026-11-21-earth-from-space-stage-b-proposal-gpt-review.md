# GPT → Claude — Stage B proposal rev 1 review

Relayed by Chad in the Earth from Space thread, 21 Nov 2026. Filed as relayed. Relayed text is not Chad's go or approval.

Support the branch-only build incorporating these corrections, on Chad's own go. Rev 1 is not yet an agreed execution plan. No deployment or observation is approved.

1. Manual collector loophole
The supplied Worker's JOBS.earthview explicitly ignores the scheduled gate. Therefore an unset gate does not make the probe the only possible Earth from Space validation.

Enforce Stage B exclusion for BOTH scheduled and manual collection, preferably in the outer dispatch layer without changing accepted recovery internals. Test manual calls while the probe is idle and running: zero source requests, validation and storage calls.

A probe-only latch is then acceptable for Stage B. State its per-isolate limitation.

2. No-write proof
Not passing env is good design, but insufficient alone. Test the whole route, error handling and deferred work against spies covering every writable binding, including D1 as well as R2. The static "no env" check is supplementary.

3. Authentication
Use POST with header-only authentication for this new route, not an admin-key URL. Do not log credentials or forward them upstream. Existing admin routes remain separate scope.

4. Timing
Prefer quiet first, representative busy period second, quiet third. Read existing job timing/duration first. Starting in the hourly job's minute does not prove overlap; report actual overlap where observable.

Fix future calendar dates only after candidate review and deployment readiness.

Clarify whether windows bound call starts or complete observations. The sequential 30 + 90 + 90 second fetch budgets exceed the proposed three-minute busy window. Specify a whole-run deadline and compatible client wait. No client retry after a lost response.

5. Health verdict
The proposed health sources are suitable, assessed against each layer's cadence.

Any hub exceededMemory/exceededCpu in the observation window prevents clearance: not met for operational coexistence, without claiming the probe caused it.

Missing evidence, upstream failure or an unexplained potentially related regression is incomplete. Define treatment of established unrelated failures before running.

6. Evidence
Correlate safe attempt/build start/end logs and the saved response with the exact invocation CPU record. Add validation start/end times.

Nine requests is the authorized budget for three single attempts, not an account-wide cap enforced by an isolate latch. Report duplicates; no replacement calls.

7. Deployment
Review the full merged Worker candidate. Say "no intended visible page change", not "no production change".

If initial readback finds unexpected earthview objects, stop and report; do not delete or initialize anything.

Recommendations to Chad:
D1 yes: accept proceeding despite incomplete Stage A.
D2 yes: 2,048 px.
D3 retain one measured busy-period sample after a quiet first run.
D4 support branch-only work incorporating these corrections.

Return the implementation candidate for GPT review before deployment or live observations.
