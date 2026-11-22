# GPT review of the storage-to-release proposal rev 1.1 (22 Nov 2026)

Relayed by Chad on 22 Nov 2026 as an attached text file. Reviewed: `docs/concepts/EARTH-FROM-SPACE-STORAGE-TO-RELEASE-PROPOSAL.md`
rev 1.1, sha256 `79cc77cec1b8742d757611f4e2a00bf2d7081cb642c570939f837d0ffa6c5108` (branch `earth-from-space-rc` `4c113e4`).

**Outcome: bounded proposal HOLD on three points (finite trial and executable stops; measurable result rule; Stage C
retry and verdict), with answers to Q1, Q2, Q4, Q5 and factual corrections under Q6. The C/D/E separation and the
focused 0.6.22 scope are supported. No decoder or storage redesign requested. No implementation, deployment, stored
frame, gate enablement or page release is authorized.** Answered by proposal rev 2.

## The review, as received

> GPT → Claude — storage-to-release proposal rev 1.1 review, 22 Nov
>
> Bounded proposal HOLD. Reviewed SHA-256 matches:
> 79cc77cec1b8742d757611f4e2a00bf2d7081cb642c570939f837d0ffa6c5108
>
> Stage B remains MET with its accepted limits. The corrected memory wording is accepted. Support the C/D/E separation and focused 0.6.22 gate/auth/caller scope.
>
> Q1 — Three-state gate: yes.
> Unset permits only the probe; manual permits manual collection; 1 permits manual and scheduled collection; unknown values fail closed. Test through actual handlers, including the five-minute wrapper, with zero source/storage side effects on refusal.
>
> Q2 — No new whole-run deadline: acceptable.
> But 210 seconds is the sum of source-fetch timeout allowances, not a maximum collector duration. Earlier collectors, storage, decoding and cleanup are outside it. Do not use it to prove non-overlap.
>
> Quote actual account/configured limits in the candidate. The containing trigger is the five-minute cron; the manual HTTP run does not inherit scheduled wall-time limits. Report whole-invocation CPU, not decoder cost.
>
> Observed start seconds and fast historical runs do not guarantee future separation from the hourly job. Remove absolute “does not coincide” and “cannot delay them” claims. No forced-overlap experiment is required.
>
> HOLD 1 — Finite trial and executable stops.
>
> “Immediate stop” is inconsistent with six-hour check-ins. State actual monitoring coverage, overnight arrangements, maximum inspection interval and detection-to-action procedure. A chat thread is not an unattended monitor.
>
> Align emergency pause authority with all six stop conditions, not only 1–4. Pause on detection; investigate unrelated attribution afterwards.
>
> Default to manual at the specified 48-hour end. Any continuation during review needs explicit bounded authorization, monitoring and request allowance.
>
> Fix start/end conventions and expected slots: nominally 288 slots and at most 864 upstream requests. The 432/day figure is schedule-derived, not a globally enforced counter. Do not include extra manual runs without separate authorization and accounting.
>
> Changing configuration or adding a hold does not cancel admitted invocations. Read back the pause and reconcile in-flight work. Do not delete storage while an uncertain earlier writer could still repopulate it.
>
> HOLD 2 — Measurable result rule.
>
> 48 hours is reasonable. Reporting overlaps without requiring them is acceptable.
>
> 80% can be a provisional owner-approved checkpoint, but “frames listed in the period” is undefined. The collector observes newest times at polls, not every frame that existed between polls.
>
> If retained, define unique eligible observed newest times, initial-frame treatment and trial-end opportunities. Separately account for every scheduled slot, failed check and unknown interval. Alternatively replace 80% with a concrete rule agreed before starting.
>
> Require actual advancement through distinct validated frames, diagnosed misses/refusals and observed post-grace cleanup protecting current/previous. Missing evidence stays incomplete.
>
> Three validation refusals do not prove a limits problem. Distinguish faulty source frames correctly rejected from sound frames wrongly rejected; the latter is not met for validation. Define treatment of persistent check-image and served-time failures.
>
> Explicitly retain or justify replacing the previous provisional 5,000 ms CPU checkpoint for the whole containing invocation.
>
> HOLD 3 — Stage C retry and verdict.
>
> One extra attempt after ten minutes is acceptable only for a positively identified source failure, with no publication, reconciled storage and healthy hub. Give it a latest permitted start too.
>
> Distinguish missing time confirmation from a header naming the wrong frame. Wrong-frame evidence and a sound-frame validation refusal must not be erased by later success.
>
> A lost answer or client timeout does not prove nothing was stored. Reconcile before another call. Use retained logical attempt IDs and atomic claims before mutating calls; timestamped outputs alone do not prevent duplicate launches.
>
> Q4 — Public frame before REGISTER.
>
> Acceptable only as an explicitly approved public Stage C experiment. Move the REGISTER draft into the Stage C packet; recommend filing before C, and require filing before sustained D collection.
>
> If Chad chooses the Stage C exception, his approval must acknowledge public downloadability. Remove “private in effect.” No link is not privacy.
>
> Q5 — Header-only scope: yes.
>
> Keep the change limited to Earth from Space routes, with exact-path, method, auth and no-side-effect tests. Other jobs’ auth remains separate scope.
>
> Rejecting key= cannot prevent the platform logging that incoming URL. Never test with a real credential in a URL. Verify header masking on a harmless status call before mutation.
>
> Q6 — Factual corrections.
>
> A late storage stop may follow successful partial writes; describe stopped further work and reconciliation, not “nothing written.”
>
> The 146-picture estimate is healthy steady state, not a hard bound including interrupted/superseded copies.
>
> Direct-URL traffic can occur before E. Immutable Cache-Control does not prove shared edge caching; include Worker/R2 reads and CPU in estimates.
>
> Repeated/shared-isolate validation must be evidenced, not inferred from the schedule.
>
> Keep lifecycle checks, account allowances, operation counts and exact deployed/configuration readbacks in the candidate packet. Stage C’s clean completed state retains four small records plus one picture after removing the hold.
>
> Please revise these together. No decoder or storage redesign is requested. No implementation, deployment, stored frame, gate enablement or page release is authorized by this review.