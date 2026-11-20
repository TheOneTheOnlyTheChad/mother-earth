# GPT's independent review of the probe build and recovery packet (`ef3fd5c`)

Filed 20 November 2026 as received from Chad. Unchanged apart from this heading. Answered by `reviews/2026-11-20-earth-from-space-probe-r2.md`.

Earth from Space — probe build and recovery review

20 November 2026. Clock reading: 09:29:49 UTC / 11:29:49 SAST.

REVIEW HOLD on hosted-probe readiness. The three prior recovery findings are addressed within the stated assumptions and limits. Two reproduced probe defects remain: actual expiry is not enforced, and the report can qualify incomplete or mixed evidence. The fixture package also needs completion. No production approval is requested or given.

Reviewed supplied branch earth-from-space-rc, packet ef3fd5c11c9be48a670209abb2136e917e726417, code/evidence identified as 3c7598b509af6208459b09f730e861dd75fc1b72.

Verified submitted hashes:

PACKET-probe-and-recovery.md: d1836d9e705e89948fcbc1850e9088f4a9d7e99ec23490f1556fc6111fcaeeaf

phase1/worker.js: e2b6fb6dcac0af0f2dbdc5b8acb789d24ca51a15464a665dde4e7a8c90cfca6a

phase1/evprobe.js: c7998618f91429a05141b88cded4c6978fefb7506525c87f6f7bbf12afaf8a61

I inspected the packet, Worker storage/recovery path, probe driver/build/report/configuration, test cases and evidence. All executable work below was local with stubbed sources. No hosted probe or new source retrieval occurred. Claude's implementation was not edited.

1. Verified results and fixture limitation

The submitted Mac copy has no phase1/earthview-fixtures directory. Initially the hub suite stopped with ENOENT day.jpg; the probe suite also stopped after fixture-read failures. These are package failures, not demonstrated collector defects.

I copied the submitted tree unchanged to scratch and supplied the preserved R3 day/night/dusk JPEG/PNG files and Dust fixture. For the missing *-1536-derived.jpg files, I generated my own 1536-square test copies locally with macOS sips. They are not claimed to match Claude's generated inputs or EUMETSAT's 1536 px rendering.

Results in that reconstructed environment:

Hub suite, default mode without FAST: 294 passed, 0 failed.

Probe suite, full window simulation: 59 passed, 0 failed, with the alternative derived inputs just described.

Build --verify: passes; exact submitted probe hash.

Compared the sixteen extracted declarations to passed R3: fifteen are identical; EARTHVIEW is the only changed declaration, as disclosed.

Nine selected recovery mutations all applied and failed:

Mutation

Result

recover-keeps-key

264 passed, 30 failed

recover-pointer-unconditional

290 passed, 4 failed

cleanup-pointer-unfenced

293 passed, 1 failed

recover-list-before-inventory

293 passed, 1 failed

inventory-unstable-view

292 passed, 2 failed

inventory-one-pass

293 passed, 1 failed

inventory-first-page-only

292 passed, 2 failed

no-fence

280 passed, 14 failed

no-hold-guard

287 passed, 7 failed

These mutation runs used FAST=1, as documented. I did not independently rerun all 52 hub mutations or 15 probe mutations, the browser page suite or workerd spike.

Required package correction: include the test fixtures and provenance, or a deterministic, documented way to reconstruct the intended derived fixtures from the preserved originals. The next review copy should run the stated commands directly.

2. High priority — expiry checks scheduled time, not actual time

Location: phase1/evprobe.driver.js:51–62 and upstream requests at 70/78; generated file has the same code.

evprobeRun derives k exclusively from scheduledMs. Its “ABSOLUTE WINDOW” branch checks that scheduled slot. Date.now() is read only afterward to establish a fresh 240-second budget. There is no actual-clock start/end check.

Independent reproduction on the unmodified generated module:

File start: 2026-11-21T07:00:00Z.

File end: 2026-11-21T19:00:00Z.

Actual clock stubbed to 2026-11-21T20:00:00Z.

Deliver scheduledTime = the valid 07:00 slot.

Stub fetch to count calls and return HTTP 503.

Two deliveries produced two start lines and two upstream calls after expiry.

The current tests move actual time with the scheduled slot, so C17/C18 do not exercise this counterexample.

Required: retain scheduled time for slot selection, but enforce actual time at entry and before new upstream work. Bound remaining network/work time by the actual approved end and per-invocation budget; define behavior for an already-running request at the end. Prevent late ticks from moving requests into the actual Dust exclusion window. Test delayed in-window events after expiry, early actual time, the window ending between fetches, and actual-time exclusions.

The claimed 210 total is also a nominal-slot calculation: repeated deliveries of the same valid slot run again. This reproduction delivered the same slot twice. The report already acknowledges duplicate slots, so the deployment specification must not silently equate planned slots with a hard request cap. Either enforce the stated total under the delivery assumptions, or state the exact assumption and a reviewed bound in the eventual approval. No new storage binding is implicitly authorized to solve this.

3. High priority — the report can turn incomplete/mixed evidence into a pass

Locations: phase1/evprobe.report.mjs:15–23, 29–43, 47.

The report groups by slot k, chooses the first fetched and done records, and counts all validation lines together. A done record is enough to call a slot completed. Phase-2 expected validation count/indices are not checked. Phase-3 checkpoint success does not require corresponding invocation records. Number(null) converts missing CPU to zero.

I constructed a complete synthetic control window matching evprobePlan, then independently changed one property per case. The control and all four defective cases returned forward = 2048 and criteria 1–5 = met:

Changed evidence

Actual evaluator result

Each 2048 phase-2 run contains only one validation, and its done line explicitly claims validations:1

qualifies

Remove Cloudflare invocation records for every ballast run

qualifies

Set cpu_ms:null on every invocation

qualifies; missing CPU becomes zero

Give one slot two partial attempts: fetched/validation from attempt A, done from attempt B, with two invocation records

qualifies; duplicates produce only a note

These are input/evaluator counterexamples, not claims that the hosted probe has produced such records.

Required:

Correlate records per attempt and invocation, not only per scheduled slot. Existing isolate + isolate_run can help; validate an unambiguous attempt identity. Never stitch different attempts.

Match observed phase, size, ballast, scheduled time, build/source identity and window to the reviewed plan.

Require the expected sequence and all validation indices: one for phases 1/3; six for phase 2. Cross-check done counts/results against individual records.

Require valid corresponding invocation evidence for the checkpoint runs too. Accept explicit successful outcomes; classify missing/ambiguous telemetry as incomplete.

Validate CPU before conversion. Null, absent, empty, nonnumeric and nonfinite values must not become zero; a genuine measured zero remains valid.

Define duplicate/retry handling conservatively and report every attempt; a complete successful attempt must not erase a failed one.

Tie refusal diagnoses to the actual picture/check hashes and size, not only frame time and size; a service may render the same time differently.

Separate an observed resource failure from an absent completion log. Missing telemetry alone does not establish that execution failed.

Add each reproduced case as a negative regression that prevents qualification.

Compact independent evaluator reproduction

The following runs against the submitted probe/report modules, without fixtures or networking:

import M from './evprobe.js';
import { evaluate } from './evprobe.report.mjs';
const P = M.__probe, plan = P.evprobePlan(), lines = [], inv = [];
for (const s of plan.filter(s => !s.excluded)) {
  const b = {probe:'evprobe', k:s.k, phase:s.phase, size:s.size,
    ballast_mib:s.ballast_mib, isolate:'test', isolate_run:s.n+1};
  lines.push({...b,ev:'start',scheduled:s.at},
    {...b,ev:'fetched',frame_time:'2026-11-19T11:00:00Z',header_ok:true});
  for (let i=1;i<=s.validations;i++)
    lines.push({...b,ev:'validate-begin',i},{...b,ev:'validated',i,ok:true});
  lines.push({...b,ev:'done',outcome:'validated',
    validations:s.validations,ballast_ok:s.ballast_mib?true:null});
  inv.push({scheduled:s.at,outcome:'ok',cpu_ms:400,wall_ms:1000});
}
const check = async (name,L,I) => {
  const r = await evaluate({start:P.PROBE_START,lines:L,invocations:I},
    P.evprobePlan);
  console.log(name,r.forward,r.sizes[2048].criteria);
};
await check('control',lines,inv);
const p2 = new Set(plan.filter(s=>!s.excluded&&s.phase===2&&s.size===2048)
  .map(s=>s.k));
await check('only one phase2 validation',
  lines.filter(l=>!(p2.has(l.k)&&
    ['validated','validate-begin'].includes(l.ev)&&l.i>1))
    .map(l=>p2.has(l.k)&&l.ev==='done'?{...l,validations:1}:l),inv);
const p3 = new Set(plan.filter(s=>!s.excluded&&s.phase===3).map(s=>s.at));
await check('no ballast invocation records',lines,
  inv.filter(i=>!p3.has(i.scheduled)));
await check('null CPU',lines,inv.map(i=>({...i,cpu_ms:null})));
const k = plan.find(s=>!s.excluded&&s.phase===1&&s.size===2048).k;
const mixed = lines.flatMap(l=>l.k!==k?[l]:
  l.ev==='done'?[{...l,isolate:'attempt-B'}]:
  l.ev==='start'?[{...l,isolate:'attempt-A'},{...l,isolate:'attempt-B'}]:
  [{...l,isolate:'attempt-A'}]);
await check('mixed attempts',mixed,
  [...inv,inv.find(i=>i.scheduled===plan[k].at)]);

4. Recovery closures and explicit scope

The three prior findings are addressed:

N4/N5 exercise fresh verified copies and the pending old delete; recovery no longer keeps the original key.

Stable-list-version reconciliation, confirmation and pagination address the inspected inventory race.

Pointer-first, no-retry fencing and after-fence inventory address the inspected between-write publication race. The corresponding mutations fail.

I accept removal of the witness: status is not a safety authority, and uniqueness no longer rests on a restorable counter.

P4 is an acceptable stated failure boundary: an external restore can point at a condemned key before recovery protects it. A 503/missing response and explicit repair plan are honest; this is not a claim that the restore itself is safe. Keep the runbook's planned kept/not-kept behavior reviewable.

The source comment above evCleanup still retains the assumption that no ordinary collector pauses for the whole grace period between claim and pointer write. Do not broaden the packet's “any length of time” wording into an unconditional guarantee for ordinary collection. The arbitrary old-writer coverage established here concerns recovery changing the epoch and protecting the copied pictures.

5. Answers to packet E

Copying to new verified recovery keys is accepted for the inspected pending-delete case, with P4 retained.

Removing the witness is accepted for the stated probabilistic key-allocation model.

Keep storage busy as a stop for that run. Do not proceed after a guard cannot establish a consistent view.

Five phase-2 runs per size, six validations each, are adequate for this bounded screening experiment. The report must actually require the six.

Six supplied real-frame pane observations plus clearly labelled derived inputs are enough to continue toward an isolated probe; they are not an independent service-rendering verification by GPT. Reproducible packaged fixtures are still needed for the stated local test commands. Ordinary saving of public evidence within the authorized fixture task should not become an invented production-approval gate.

Keep the 1536 thresholds unchanged for the probe. The acceptance measure is the background share, not its worst single sample, and the reported share is 1.0. Do not tune against an unobserved failure; diagnose if the probe produces one.

The no-store full-hub route remains unbuilt. Hosted memory/CPU/header evidence, real-device checks, final regression/usage/release work remain open.

Next packet

Return a focused probe driver/report revision with the new negative tests and a complete fixture package. Keep recovery unchanged unless those edits require it. The reviewed recovery closures can carry forward by matching file hash.

No need to reopen the broad readiness design or park the feature. No hosted probe, production write, deployment, merge or spending is approved by this review.

