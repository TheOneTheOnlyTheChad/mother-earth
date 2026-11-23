# Earth from Space — independent monitoring proposal rev 3: GPT review (23 Nov 2026)

Filed 23 Nov 2026 11:41 UTC (clock reading). Relayed by Chad in the thread. **Verdict: rev 3 answers the six rev 2
points; three precise corrections to the build contract, adopted in rev 3.1 with no redesign and no further full
proposal round. No deploy, monitor creation, fixture run or Stage D approval.** GPT recommends M8 (delete the
stale test monitor) on Chad's separate line; Chad gave that line in the same message. Answers: rev 3.1 section 13.

## The review as received

> Earth from Space independent monitoring — rev 3 review
> 
> 23 November 2026 · GPT for Chad and Claude · proposal review only
> 
> Rev 3 answers the six rev 2 review points sufficiently to move toward the branch build. Correct the three contract inconsistencies below before using it as the implementation brief. This does not require a monitoring redesign or another full proposal-review round if these precise corrections are adopted. The candidate code, tests and operational package still require their own review. No deploy, monitor creation, fixture execution, deletion or Stage D approval is given here.
> 
> Read the named Mac 05-INDEPENDENT-MONITORING-PROPOSAL-rev3.txt against my rev 2 review. Rechecked relevant retained 0.6.22 code, including evMark, evAdmit, logged execution, and collector completion notes. Did not inspect the live hub, sign in to UptimeRobot, or change anything. Section 12's account observations remain Claude's evidence, not my independent account reading.
> 
> What is closed
> 
> Earlier point
> 
> Rev 3 assessment
> 
> Manual timestamp collision
> 
> Correctly acknowledged as indistinguishable in the existing D1 row. Operational prohibition and the fixture documenting the blind spot are appropriate within this health-only scope.
> 
> Mixed duplicate outcomes
> 
> Any-refusal and any-storage-stop flags prevent a successful repeat from erasing those flags. The conservative c6 interpretation is explicit. superseded is correctly distinguished from publication in this execution.
> 
> Future slots in streaks
> 
> Only settled slots count, including the exact 20-minute boundary. This resolves the premature streak issue.
> 
> Configuration precedence
> 
> Unknown gates, gate 1 without windows, malformed windows and equality boundaries are now specified. Reuse the collector's exact evMark validation: its ten-minute alignment makes the stated last-slot formula valid.
> 
> Bounded reads and safe public output
> 
> Indexed time range, 2,000-row cap, fail-closed truncation and fixed public reason codes address the earlier concern. Measure actual D1 rows scanned/read and CPU; a result limit alone is not a performance measurement.
> 
> Current account evidence
> 
> Claude has now read enabled URLs, intervals and per-monitor email/push selections, and observed HEAD traffic. The account is no longer supported only by the 6 November setup record. The partial-read limits are disclosed.
> 
> Decision provenance
> 
> Section 11 now quotes Chad's own “M1 to M8 yes”, with the earlier misattribution corrected and design choices separated from execution approvals.
> 
> Three corrections to the build contract
> 
> 1. Startup grace must not mask a recorded adverse result
> 
> Section 3.4 makes a storage stop or unrecognised slot outcome a trial failure without waiting for a streak. Section 3.5 row 7 instead returns unconditional 200 for both checks until FROM + 20 minutes.
> 
> Example: first slot at 07:00, storage-stop completion at 07:02, poll at 07:05. The trial rule says 503; row 7 says 200. A row-read failure during startup has the same inconsistency.
> 
> Required rule: startup grace excuses missing completions and prevents premature c6/c8 streaks. It does not excuse a recorded c3 failure, an unrecognised matching outcome, an incomplete query or a read/parse failure. Evaluate those applicable failures before returning startup 200. Keep c6/c8 restricted to settled slots. Add the early-storage-stop and early-unrecognised/read-failure fixtures.
> 
> 2. Narrow the pause-history guarantee to what the evidence can establish
> 
> The statements “a pause is never reported as a recovery” and “paused slots stay overdue” are too absolute for current configuration plus completion rows.
> 
> Counterexamples:
> 
> Gate changes to manual and back between scheduled opportunities: every expected slot can still finish. The later health request has no evidence that the pause occurred.
> 
> Gate changes after the final trigger was admitted but before its due time: all expected rows can exist. Row 9 can be red while row 10 later becomes green, without closeout.
> 
> A paused slot's trigger arrives late after resumption and finishes: section 3.1 expressly permits its overdue condition to clear.
> 
> Required wording: an off gate during the active assessment period raises not collecting; missing slots and recorded qualifying outcomes are retained according to their stated rules. The health addresses do not retain an independent history of gate transitions or prove that collection was never paused. A later completed slot can resolve a missing-completion finding. A completed trial's 200 does not prove there was no pause.
> 
> Keep intentional pause, resumption and its effect on the Stage D verdict in the operational ledger/result, preserved at closeout. No collector change or persistent health write is required to make this truthful. If a permanent independently detectable pause latch is desired, that is additional design work, not something these read-only checks already provide. Add a short-pause/no-missed-slot fixture and the delayed-completion case to document the limit.
> 
> 3. State the 24-hour evidence horizon accurately
> 
> Section 3.6 says a row excluded after UNTIL + 24 hours leaves its slot overdue and therefore errs toward alerting. That is true only if no included row already completed the slot.
> 
> Example: an included good row completes a slot; a very late duplicate then records a storage stop beyond the cutoff. The latter row is excluded. There need be no overdue slot or other red answer. Therefore this horizon can exclude adverse evidence as well as late recovery evidence.
> 
> Required correction: disclose this as a finite observation horizon. Whole-trial failure retention applies to qualifying rows inside the defined read range, not arbitrary later executions forever. Include this residual limit in the revised Stage D basis and closeout procedure, with a fixture demonstrating the completed-slot/late-bad-duplicate case. If that limit is unacceptable, revise the bounded query strategy explicitly; do not claim the present cutoff fails safely for every case.
> 
> Account findings and M8
> 
> M8: I recommend deleting the stale “ME alert test” monitor on Chad's separate execution line, after preserving its settings and incident evidence needed for the result. It is clutter, not proof that notification delivery is broken. A 16-day-open incident with no repeats is compatible with one notification at opening and silence afterwards.
> 
> “No delay, no repeat” means one opportunity to notice an incident, not continuing reminders. Keep that explicit in the Stage D basis. The recorded seven-hour incident does not establish whether Chad saw or acted on its alert.
> 
> Avoid presenting all monitor settings as independently read on all nine monitors: timeout, redirect/status controls and some location details were inspected on one and assumed for the others. Read back the actual settings of the two new monitors when they are created. The contact/device details and confirmation count not read in section 12 remain unknown; the fixture test must supply current delivery evidence rather than a historical setup test standing in for it.
> 
> Candidate and operational verification
> 
> The existing proposed checks remain appropriate, with the three additions above. In particular:
> 
> Freeze good current evidence by the row's recorded finish timestamp at the slot's due time. Accept adverse outcomes within the defined query horizon even if later. Test the equality boundary and mixed repeats.
> 
> Prove actual HEAD and GET verdict equality, no-store responses, fixed public reasons, and no collection, writes or upstream image requests in the health path.
> 
> Measure duplicate-heavy and end-of-trial query cost. On any incomplete evidence, fail closed rather than converting truncation into a healthy verdict.
> 
> The disposable fixture test must exercise both exact production check functions, with deterministic times/records and no production bindings. Record the real HTTP 200→503→200 transitions, and phone/email receipt evidence by monitor for down and recovery. Missing or suppressed delivery is a finding, not an assumed pass. Its execution plan remains separately reviewable.
> 
> Keep healthy routine inspections silent. The three daytime reads, eleven-hour overnight gap, no automatic pause, one provider and conditional thread coverage all remain explicit limitations.
> 
> Build from the then-live hub source, show the health-only diff and unchanged collector/control paths, and run the relevant regressions. Stage C can carry forward only for the unchanged collector evidence; it cannot validate these new health checks or alert delivery.
> 
> Next step: record these narrow corrections in the proposal/build brief, then put the concrete branch-build request to Chad. No extra phone-heartbeat rehearsal is needed for this replacement. Retiring the old duties follows tested replacement monitoring and an accepted revised runbook; Stage D remains separate.