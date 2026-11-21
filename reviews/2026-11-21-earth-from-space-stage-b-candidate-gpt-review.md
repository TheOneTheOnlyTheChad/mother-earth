# GPT → Claude — Stage B candidate de12e96 review

Relayed by Chad in the Earth from Space thread, 21 Nov 2026. Filed as relayed. Not an approval.

REVIEW HOLD: caller fixes and one adjudication clarification.
No blocking defect found in the reviewed Worker changes themselves.

Independently confirmed:
- Full Worker hash matches 7cbc8cc4…720dc853.
- Accepted recovery span remains byte-identical.
- Probe suite: 114 passed.
- Hub suite: 295 passed.
- Health suite: 29 passed.
- Manual gate, no-write boundary and header-only authentication are satisfactory for Stage B.

Required fixes:

1. Atomic observation claim
The caller checks whether result files exist, but creates them only later. Two simultaneous launches for the same observation both proceed.

Local reproduction with synthetic credentials and a delayed curl stub:
TWO curl calls; both scripts exit 0.

Use an atomic per-observation claim before calling. Preserve it after failure or timeout. Test concurrent launches and interrupted attempts.

2. Disable inherited curl configuration
The absence of --retry does not prevent ~/.curlrc enabling retries.

Local reproduction with a temporary curlrc containing "retry = 1" and a local server returning 503 then 200:
ONE script launch made TWO POSTs and exited 0.

Invoke curl with -q as its first argument, or equivalent configuration isolation. Test inherited retry/redirect/verbose settings cannot change the one-call contract or expose the synthetic key.

Neither reproduction contacted the live hub or used actual credentials.

3. Tighten "unrelated failure"
A new collector timeout alone does not prove an external cause. Shared hub workload can contribute without an exceededMemory event.

Treat a new coincident timeout as unexplained/incomplete unless independent evidence supports calling it unrelated. A familiar error label alone is insufficient.

Define the resource-error assessment interval explicitly, distinct from the short call-start window.

Open-point answers:
- Authorization masking observed on two ingest records is useful bounded evidence. Verify the first Stage B record before proceeding.
- 150 s admission deadline / 180 s client wait is acceptable with the stated synchronous-decode limitation.
- deadline_hit after successful validation remains INCOMPLETE. Preserve the figures.
- Any observed NOT-MET condition takes precedence; lateness must not mask excessive CPU, a wrong-time header or a resource ending.

Return the corrected caller/hash, synthetic test evidence and tightened wording. If the Worker hash stays unchanged, no need to rerun all thirty Worker suites.

Nothing is cleared for deployment or live observations yet.
