# GPT's independent review of release-readiness proposal rev 2 (`c70fc78`)

Filed 20 November 2026 as received from Chad, in two parts: GPT's summary for Claude, then GPT's full review file. Unchanged apart from this heading, the two part headings, and the removal of one private link to GPT's own saved copy. Answered by `reviews/2026-11-20-earth-from-space-probe-and-recovery.md`.

## Part 1: summary relayed for Claude

> **GPT review — readiness rev 2, `c70fc784`**
>
> Proposal hash verified: `239de807c0c04832768c5c17519855ccc1ded29ead150222d711a0926f66a3ee`.
>
> **Accepted directions:** fresh randomness per allocation, equivalent testing of both resolutions, 48 MiB as a provisional checkpoint, removal of the 90% header threshold, and diagnosis before changing validation limits. The bounded isolated probe, including deliberate memory failures, is acceptable in principle. Its implementation and configuration still require review and Chad’s approval.
>
> **1. Recovery can preserve a picture with an old delete pending.**
>
> Consider K, once current, later retired and marked for deletion. Pause cleanup immediately before its delete. Restore an older pointer naming K. Recovery verifies K and preserves that key under the new epoch. The paused cleanup then deletes K.
>
> Fresh random identifiers protect future allocations; they do not protect this restored existing key. Epoch checks on subsequent record writes cannot undo the pending object delete.
>
> Close this case explicitly. Options include proving all old deletes have drained, or copying verified current/previous pictures to fresh recovery keys before installing the recovered pointer. Test recovery followed by resumption of the old delete, including deletion during verification/copy.
>
> The proposal incorrectly gives manual runs the scheduled 15-minute wall limit. HTTP-triggered runs have different lifetime rules, so the 16-minute wait alone does not establish their completion. [developers.cloudflare.com](https://developers.cloudflare.com/workers/platform/limits/?utm_source=chatgpt.com)
>
> **2. G5 needs a stable inventory procedure.**
>
> A reads the held list; B reserves and stores a new picture; A lists objects. B’s legitimate object now looks unlisted against A’s earlier snapshot.
>
> Specify pagination, version checks around reconciliation and bounded retries for contention. Only a persistent mismatch against a stable view should be called repair-needed. Keep pending entries legitimate. G5 is a consistency check, not a universal rollback detector.
>
> Also define monotonic witness updates, failed safety writes and partial initialization/recovery. Failure reporting must preserve the evidence used by guards.
>
> **3. Epoch fencing needs an installation order and partial-failure protocol.**
>
> Changing list and pointer epochs requires separate writes. If recovery changes the list first, an old publisher can still succeed against the old-epoch pointer before it is re-stamped.
>
> Specify the first operation that fences publication, every intervening state, conditional-write retry behavior and recovery after partial failure. Test old writers **between recovery’s writes**, not only after recovery finishes. Keep the hold until the result and release preconditions are verified.
>
> **4. Finish these details in the probe implementation packet.**
>
> - Produce an explicit UTC slot table accounting for Dust exclusions. A 07:00 start gives 70 opportunities: 18/6/11 per size across the three phases, not two complete ballast ladders.
> - Distinguish missed opportunities, header failures and an incomplete experiment. Count distinct frames and actual coverage.
> - OOM can prevent the final JSON log. Include bounded start/stage records and correlate incomplete runs with invocation outcomes.
> - Keep touched ballast live throughout validation and verify it afterward on completed runs.
> - Use maximum per-run CPU and outcomes alongside percentiles. Require repeated successful checkpoint observations.
> - Include criterion 3 explicitly when deciding which resolution qualifies; unexplained refusals must not qualify.
> - Verify disabled preview/version URLs, compatibility settings, extraction dependencies, CPU configuration, per-run wall budget and absolute expiry.
>
> **5. Carry forward the remaining wording and test requirements.**
>
> Three admin runs exercise the full hub deployment; they do not establish shared-isolate concurrency or quantify spare memory. Describe the workload actually tested. Assert zero R2/D1 mutations on every no-store success and failure path.
>
> Use each suite’s intended server. Say frame-time meaning is “not established,” rather than unknowable. Unpublished-object retention depends on a later successful cleanup. Gate removal stops future scheduled entry, not existing/manual work. Refresh costs with hosted measurements and the added inventory operations.
>
> **Next:** no need to park or repeat a broad exploratory proposal. With Chad’s Go, prepare the probe branch-build packet and corrected recovery design/tests. Recovery remains open; hosted execution still needs separate approval.

## Part 2: the full review file

Earth from Space release-readiness proposal rev 2 — independent review

20 November 2026. Review clock: 07:40:40 UTC / 09:40:40 SAST.

Stage A direction accepted for preparation of a branch-build packet, with the implementation requirements below. Recovery design returned for correction. No hosted experiment, production change or deployment is approved. The unchanged R3 private candidate retains its prior pass.

Reviewed supplied commit c70fc784cd196208b03b1681937cc4750262761e. Read the entire proposal in ~/Documents/Mother Earth/_review/earth-from-space-readiness/. Independently matched SHA256:
239de807c0c04832768c5c17519855ccc1ded29ead150222d711a0926f66a3ee.

The earlier full rev-1 review apparently did not reach Claude; this review therefore restates the remaining requirements in full. No proposed recovery or probe implementation exists yet, so the recovery counterexamples below are reasoning about the design, not claims of an executed implementation test.

Accepted changes

A fresh cryptographic random value in every allocation removes dependence on a restorable counter for key uniqueness. 96 bits is a reasonable probabilistic design at this collection rate if its residual collision assumption remains explicit. Create-only protects against collision with an object still present; it does not make repetition of a deleted key mathematically impossible. Do not turn the qualified argument back into an absolute guarantee.

Both resolutions now have equivalent proposed phases and ballast ladders.

48 MiB is explicitly a provisional checkpoint toward Stage B, not an allowance justified by three times a historical P99.

The conflicting 90% header threshold is removed. Matching confirmation on both responses for every published frame remains mandatory.

Refused frames are diagnosed rather than automatically used to loosen thresholds.

An explicit hold covering manual and scheduled entrypoints, epoch checks and bounded deployment settings are improvements.

1. Required recovery correction: preserving a restored key can expose it to a pending old delete

Fresh randomness protects future allocations. It does not protect an existing old key that recovery places or leaves in the pointer.

Counterexample:

K was once current. Save a consistent list/witness/pointer snapshot naming K.

Normal publications move past K. Its grace expires; cleanup marks K, reads the pointer as not naming K, then pauses just before the object delete.

Restore the saved records together while K still exists.

The guards can stop collection, but proposed recovery verifies K's bytes and hash, re-lists it as current, and preserves its key while changing the records' epoch.

The old cleanup resumes its already-authorized delete of K. The new epoch check on later conditional writes cannot undo that object delete. Current is missing.

The inference “it was marked out of role, so it can never enter the pointer again” is invalid once restoration of an older pointer is part of the supported fault model.

The 16-minute wait does not settle this for all permitted writers. The current manual route is HTTP-triggered, and Cloudflare does not give it the scheduled invocation's 15-minute wall bound. The proposal still incorrectly describes both manual and scheduled runs as having that bound.

Required: either make old deletes provably unable to remain active before preserving an old key, or protect the kept pictures another way. One possible design is to read and verify current/previous bytes and copy them to fresh unique recovery keys before installing the recovered pointer, so pending old deletes can reach only the old copies. That is a design option, not an implementation authorization. A specified enforced deadline/drain for every old writer is another possible approach if it really excludes all pending object deletes.

Add a named test that restores a formerly current key with its old delete pending, runs recovery, then resumes the delete. Assert the recovered current and previous remain served. Also cover deletion during recovery's verification/copy step and recovery failure before pointer commit.

2. G5 needs a stable inventory procedure

The claim that G5 has no false alarms during overlap is not correct as written.

Example: A reads the held list; B reserves its entry, stores and claims its picture; A then lists the prefix. A sees B's object but its earlier held-list snapshot lacks B's entry, so G5 reports repair needed during legitimate activity. Reading the objects first does not solve every inverse ordering.

Specify complete pagination, a stable held-list version around reconciliation, bounded retries when it changes, and a distinct contention outcome. Confirm persistent inconsistency against a stable view before declaring storage needs repair. Pending entries without objects must remain legitimate.

G5 is a consistency check, not a separately durable monotonic witness. Do not claim it detects every coordinated rollback: objects written since a snapshot might also have been deleted by the time records are restored. Future-key safety should continue to rest on fresh allocation identifiers, not universal detection.

Keep the earlier witness requirements explicit: monotonic high-water updates, no silent swallowing of safety-write failures, no evidence destruction by the failure-status writer, and safe handling of initialization/recovery partial commits and missing records.

3. Epoch fencing needs an ordering and partial-commit protocol

List and pointer cannot change epoch atomically through two independent R2 puts.

Counterexample to the current broad wording:

Recovery writes the new-epoch list.

Before it re-stamps the pointer, an old collector whose claim already succeeded reads or uses the still-old-epoch pointer and successfully publishes through its matching conditional write.

Recovery's original pointer CAS then fails. Blindly retrying could preserve or publish a pointer not covered by the earlier inventory.

Define the first operation that fences publication, what remains possible in every interval, how conditional-write retries recheck their fence, and how failed/partial recovery is resumed or refused. Hold must remain until the entire result is internally consistent and verified. Define preconditions for release, repeated sweep and dry-run-to-apply changes.

Tests must pause recovery BETWEEN its writes and run old writers in those gaps, not only pause an old writer until recovery is fully finished. Retain stale-delete cases from section 1: checking the epoch on a held-list write is not a transactional guard on a later object delete.

A stable bad-state guard should stop for a person. Bounded contention or a transient mixed read should not be labelled as proven corruption.

4. Stage A: buildable direction with concrete requirements

The finite, binding-free probe and intentional OOM limited to that probe are acceptable in principle. These should be resolved in its branch implementation/configuration packet; another broad exploratory proposal is unnecessary.

Schedule and denominators

72 is the number of nominal ten-minute slots in twelve hours, not guaranteed completed runs. The Dust exclusions subtract slots; propagation, late events and failed fetches can subtract more.

Independent enumeration for an illustrative 07:00 UTC start:

Phase 1: 18 opportunities per size.

Phase 2: 6 per size.

Phase 3: 11 per size, because 18:00 and 18:10 UTC are skipped.

Total 70, not 72. Thus the statement “ladder twice per size” is not always true.

Build and review an explicit UTC slot table with exclusions, size, phase and B. State required observations, completed counts and what makes an experiment incomplete. Never silently extend the approved window or add requests to fill missing slots. Count distinct verified frames and actual day/night/dusk coverage.

Logging and bounds

An OOM may prevent the promised final JSON line. Log a bounded start/stage record and completion where possible, with invocation outcome and correlation identifying where an incomplete run failed. Distinguish ballast-allocation OOM from decode OOM.

Touch ballast, retain it throughout validation and verify its contents afterward on completed runs. Allocation size is not by itself proof of live ballast.

Explicitly verify disabled workers.dev AND version/preview URLs, no bindings/routes/domains, runtime compatibility settings, CPU configuration, total per-run wall budget and absolute end checks. Match extraction dependencies against the candidate; identify the smaller-resolution variant. No completion counts or seriality guarantees should rest on an unstated scheduler assumption.

With 72 nominal slots and a configured 10,000 ms limit, the configured-limit arithmetic is 720,000 CPU-ms, separate from the 0.1–0.3 million estimate. It is not a strict billed maximum; runtime limit behavior and actual invocation count remain part of the report.

Criteria

Use per-run maximum CPU and invocation outcomes for this small experiment, not P99 alone. Require and report repeated successful 48 MiB checkpoint observations for the selected size, with available coverage identified; the two proposed ladder traversals should actually supply them.

Keep unexplained refusals from qualifying a size. The “which size goes forward” line currently lists criteria 1, 2, 4 and 5 but omits criterion 3; include its diagnosis/resolution requirement explicitly.

18/18 is a clear planned header criterion, but skipped/missed opportunities make a run incomplete, not automatically a measured header failure. Report missing/mismatched header patterns rather than inventing successful samples.

“No memory failure” and “completed at B” are observations for those invocations. They do not measure transferable hub headroom.

5. Stage B and release-table wording still need the earlier corrections

Three no-store admin validations of the full hub module are useful preliminary smoke tests. They do not prove co-residence with active collectors or quantify spare memory. Replace “in the hub's own isolate,” “beside the other work” and “headroom first observed” with exactly what was exercised. Specify the bounded representative overlap/workload if it is to support a concurrency claim. Daily metrics afterward supplement the evidence; they do not establish that prior claims were true.

The no-store probe needs zero R2/D1 mutation assertions on success AND timeout, missing/mismatched header, refused frame and internal error. Reusing production failure helpers can write state and D1; diagnostic logging must be distinguished from production data writes.

Retain these release-table corrections:

B1 is hosted capacity not yet established, rather than never having run in the Workers runtime at all.

B8: gate unset stops future scheduled entry, not in-flight work or the manual route.

Use the right server for each suite: legacy core-on suites versus actual bare-default/own-server suites.

“Frame-time meaning not established,” not proven unknowable.

Unpublished objects do not have bounded retention if no later successful publication triggers cleanup.

Refresh costs with measured hosted CPU, new inventory operations, identifier/epoch metadata retention and the actual billing period.

The real-device, extra timing-sample and independent browser-suite deferrals remain reasonable with their stated limits. No whole-site or runtime capacity pass is implied.

Decision and next step

Stage A's basic approach and the probabilistic allocation design are accepted directions. The recovery invariants in sections 1–3 are not yet closed.

If Chad authorizes branch work, the next packet can contain the probe implementation/configuration plus the corrected recovery design and tests. Do not park the feature and do not start a hosted run from this review. The concrete experiment still needs independent review followed by Chad's own approval.

No code, configuration or production data was changed in this review.

Official references already checked in this conversation:

https://developers.cloudflare.com/workers/platform/limits/ — scheduled versus HTTP wall duration, per-isolate memory and CPU configuration.

https://developers.cloudflare.com/workers/configuration/cron-triggers/ — scheduling propagation.

https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/ — URL exposure controls.

