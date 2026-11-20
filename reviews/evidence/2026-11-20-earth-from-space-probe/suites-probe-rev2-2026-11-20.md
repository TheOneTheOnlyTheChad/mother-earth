# Suite results, probe rev 2 (20 Nov 2026, cloud workspace, Node v22.23.5)

| Suite | Result |
|---|---|
| `phase1/evprobe.test.mjs` | evprobe: 94 passed, 0 failed |
| `node phase1/evprobe.build.mjs --verify` | passes; sha256 0da64400098105fa7fd586ccdcf95714f7c4265a7ceefdec7a44b6eb1679e0c0 |
| `phase1/earthview-hub.test.mjs` | not rerun: `worker.js` (sha256 e2b6fb6d…) and the suite are unchanged since `3c7598b`; results in `suites-2026-11-20.md` |

## Probe and report breaks (28): every one fails

```
actual-time-ignored => evprobe [BREAK=actual-time-ignored]: 50 passed, 6 failed
ballast-not-written => evprobe [BREAK=ballast-not-written]: 54 passed, 2 failed
ballast-released-early => evprobe [BREAK=ballast-released-early]: 54 passed, 2 failed
budget-ignored => evprobe [BREAK=budget-ignored]: 54 passed, 2 failed
duplicate-in-isolate-runs => evprobe [BREAK=duplicate-in-isolate-runs]: 54 passed, 2 failed
excluded-ignored => FAIL  suite stopped on an error: TypeError: Cannot read properties of undefined (reading 'k') |     at file://
fetched-logged-late => FAIL  suite stopped on an error: TypeError: Cannot read properties of undefined (reading 'picture') |     at f
fourth-request => evprobe [BREAK=fourth-request]: 44 passed, 12 failed
header-gates-validation => evprobe [BREAK=header-gates-validation]: 54 passed, 2 failed
no-attempt-id => evprobe [BREAK=no-attempt-id]: 53 passed, 3 failed
no-start-line => evprobe [BREAK=no-start-line]: 47 passed, 9 failed
repeats-once => evprobe [BREAK=repeats-once]: 53 passed, 3 failed
report-absence-is-failure => evprobe [BREAK=report-absence-is-failure]: 88 passed, 6 failed
report-any-validation-count => evprobe [BREAK=report-any-validation-count]: 92 passed, 2 failed
report-build-unchecked => evprobe [BREAK=report-build-unchecked]: 93 passed, 1 failed
report-checkpoint-any => evprobe [BREAK=report-checkpoint-any]: 89 passed, 5 failed
report-cpu-null-is-zero => evprobe [BREAK=report-cpu-null-is-zero]: 85 passed, 9 failed
report-diagnosis-by-time => evprobe [BREAK=report-diagnosis-by-time]: 93 passed, 1 failed
report-first-attempt-wins => evprobe [BREAK=report-first-attempt-wins]: 90 passed, 4 failed
report-missing-counts-as-pass => evprobe [BREAK=report-missing-counts-as-pass]: 91 passed, 3 failed
report-no-invocation-needed => evprobe [BREAK=report-no-invocation-needed]: 91 passed, 3 failed
report-plan-unchecked => evprobe [BREAK=report-plan-unchecked]: 93 passed, 1 failed
report-refusal-ignored => evprobe [BREAK=report-refusal-ignored]: 92 passed, 2 failed
report-stitches-attempts => evprobe [BREAK=report-stitches-attempts]: 90 passed, 4 failed
request-may-outlast-slot => evprobe [BREAK=request-may-outlast-slot]: 52 passed, 4 failed
size-fixed => FAIL  suite stopped on an error: TypeError: Cannot read properties of undefined (reading 'k') |     at kOf (fi
stale-build => evprobe [BREAK=stale-build]: 55 passed, 1 failed
window-ignored => FAIL  suite stopped on an error: TypeError: Cannot read properties of undefined (reading 'excluded') |     at 
```
