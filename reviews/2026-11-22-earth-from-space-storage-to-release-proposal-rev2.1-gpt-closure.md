# GPT closure of the storage-to-release proposal, rev 2.1 (22 Nov 2026)

Relayed by Chad on 22 Nov 2026. Reviewed: `docs/concepts/EARTH-FROM-SPACE-STORAGE-TO-RELEASE-PROPOSAL.md` rev 2.1,
sha256 `dd10f90bf6e91ead6bc7359db8a422fac1c7e2aa84b100af2ccca66fcdc49a98` (branch `earth-from-space-rc` `2e6a30a`).

**Outcome: PASS at proposal level. The bounded hold is CLOSED. No further proposal round requested; the
clarifications below go into the candidate and the runbook. Ready for Chad's go for the focused branch build, then
candidate review. Deployment, storage, rehearsal, scheduled collection and page release keep their separate approval
steps. Nothing authorized beyond that.**

## The review, as received

> GPT → Claude — storage-to-release rev 2.1 closure, 22 Nov
>
> PASS at proposal level. Checksum matches. The bounded hold on rev 2 is CLOSED. No further proposal round requested for the implementation clarifications below.
>
> Q1 — Admission window: accepted.
>
> FROM <= scheduledTime < UNTIL, with strict parsing, the ten-minute cadence and gate 1, closes the slot-289 race. A positive maximum window of 48 hours is appropriate for this trial.
>
> Keep the proposed real-handler boundary, malformed-input, late-delivery and 49-hour simulation tests.
>
> Two scope clarifications for the candidate/runbook:
> - This selects eligible scheduled timestamps, not a hard wall-clock execution deadline. An eligible trigger delivered late may execute after UNTIL. Reconcile that work; do not call it a breach solely because it executed late.
> - The predicate selects 288 distinct opportunities but does not deduplicate executions of the same timestamp. Actual request counts remain audited. Do not describe it as an enforced global 864-request counter or exactly-once mechanism. Repeated timestamps must have explicit tested behavior and distinguishable execution records.
>
> No new deduplication service or global counter is requested.
>
> Q2 — Monitoring correction: CLOSED.
>
> Accept the required rehearsal, first-failure notification, daytime heartbeat, named fallback and explicit overnight limitation.
>
> Describe the rehearsal as four hourly opportunities, with the third omitted: actual launches 1, 2 and 4. The fourth independently detects the gap; Chad confirms phone receipt.
>
> D8 remains Chad's explicit future acceptance. Keeping the Mac awake does not itself accept the new overnight exposure. The planned inspection and response intervals are not guaranteed service levels.
>
> Q3 — Budget verdict: CLOSED.
>
> Demonstrated excess is NOT MET; an unestablished count is INCOMPLETE; diagnostics stay separate. Correct.
>
> For consistency, explicitly include total over 864 and diagnostics over twelve in stop condition 9 as well as the result rule. Editorial alignment only.
>
> The percentage, 230 minimum, slot ledger, refusal diagnosis, cleanup and 5,000 ms checkpoint remain accepted.
>
> Q4 — Log definitions: sufficient, with one implementation requirement.
>
> Capture immutable prior counts and a copy of the per-cron tally at handler entry, before adding the current invocation and before any await.
>
> Reading a live global counter later and subtracting one is insufficient: another invocation may have started while the first awaited other work.
>
> Test A starts, A awaits, B starts, A resumes: A's "before" snapshot must remain unchanged. Apply similarly precise snapshot semantics to the validation count.
>
> The counters establish earlier starts/completed validations as defined; they do not establish simultaneous execution or memory headroom.
>
> Carry-forward:
> - Stage C retry policy and supervised C6 rehearsal remain accepted.
> - REGISTER before C is recorded as Chad's decision.
> - Refusal tests must prove zero Earth from Space work while leaving the wrapper's unrelated collectors operating normally.
> - D3 remains open. No provider message is authorized here.
>
> Ready for Chad's applicable go for the focused branch build, followed by candidate review. Deployment, storage, rehearsal, scheduled collection and page release retain their separate approval steps. Nothing run or changed by GPT.

## Requirements carried into the 0.6.22 candidate and the runbook

1. **The window selects scheduled timestamps; it is not a wall-clock deadline.** An eligible trigger delivered late may
   run after `UNTIL`: reconciled, not a breach for lateness alone.
2. **288 distinct opportunities, not exactly-once.** The predicate does not deduplicate a repeated delivery of one
   timestamp. Never described as an enforced 864-request counter. Repeated timestamps get explicit, tested behaviour
   and execution records that can be told apart. Actual request counts stay audited.
3. **Snapshots at handler entry.** Prior counts and a copy of the per-cron tally are captured immutably at handler
   entry, before the current invocation is added and before any await. No "live counter minus one". Test: A starts,
   A awaits, B starts, A resumes; A's "before" values unchanged. The same precision for the validation count.
4. **Refusal tests** prove zero Earth from Space work while the wrapper's other collectors run normally.
5. **Rehearsal wording:** four hourly opportunities, the third omitted; actual launches 1, 2 and 4; the fourth detects
   the gap by itself; Chad confirms phone receipt.
6. **Stop condition 9** names the total over 864 and diagnostics over twelve, as the result rule does.
7. **D8 is Chad's own future acceptance** of the overnight exposure; keeping the Mac awake does not accept it. Planned
   inspection and response intervals are not service levels.
8. **D3 stays open.** No provider message is authorized.

Items 1, 2, 3, 5 and 6 are written into the proposal as **rev 2.2 (editorial; not sent for another round)**.
