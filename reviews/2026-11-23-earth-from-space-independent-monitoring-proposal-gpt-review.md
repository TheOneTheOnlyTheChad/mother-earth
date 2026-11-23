# Earth from Space — independent monitoring proposal: GPT review (23 Nov 2026)

Filed 23 Nov 2026 11:05 UTC (clock reading). Relayed by Chad in the thread with his own summary and choices:
**M1 yes to the direction; M2 redeploy in principle; M3 three sustainable daytime reads on a revised basis; M4 no
second provider by default.** "Let Claude revise the proposal first. No more hourly phone-alarm rehearsals needed
while this replacement is being designed." **Nothing is authorised by the review: no monitor, setting, build or
deploy.** Reviewed: `docs/concepts/EARTH-FROM-SPACE-INDEPENDENT-MONITORING-PROPOSAL.md` rev 1.

**Verdict: direction accepted; revise the monitoring contract before a branch build.** Each numbered correction is
answered in rev 2 of the proposal, section 13.

## The review as received

> Earth from Space — independent monitoring proposal review
> 
> 23 November 2026 · GPT for Chad and Claude
> 
> Direction accepted; revise the monitoring contract before branch build. Extending the existing external watcher is a good fit for quiet monitoring independent of the Mac, browser login and thread. The proposal does not yet replace all trial supervision or clear Stage D. No monitor, settings change, code build or deployment is authorised by this review.
> 
> Read the Mac 03-INDEPENDENT-MONITORING-PROPOSAL.txt, the rehearsal result already reviewed, and relevant 0.6.22 run wrapper/scheduling code in the retained candidate. Verified current UptimeRobot public policy pages. No UptimeRobot dashboard or live account was inspected by GPT; the eight-monitor configuration and earlier phone tests remain attributed to project records/Claude.
> 
> What is already good
> 
> Use HTTP status checks, silent success, no admin credential, read-only monitoring and explicit limits. Existing USGS records cannot prove that the subsequent Earth from Space work finished. An external poller can detect the entire hub being unavailable even though the health calculation lives on the hub. The failed Cloudflare alarm exercise does not need reopening. The old heartbeat/silence-noticing rehearsal remains failed; replacing its design does not rewrite that result.
> 
> Corrections needed before implementation
> 
> 1. Resolve the exact evidence available first
> 
> Do not leave conditions 6 and 8 as “confirm in the candidate packet, narrow if needed”. Before agreeing coverage, identify the actual persisted fields and queries for run identity, scheduled timestamp, outcome, source check/newer advertised frame, validation refusal, publication, and storage stop. Map each stop rule to evidence and enumerate the cases that cannot be decided. Any narrowing comes back as an explicit proposal change.
> 
> The reviewed collector runs every ten minutes on alternate five-minute triggers. A row written at the end can carry a scheduled/start timestamp: that timestamp is not automatically its completion time. Define which freshness the check actually measures and name it accurately. Exclude Stage C/manual/prior-trial records from refreshing the current trial’s run health. Do not count repeated executions at one scheduled timestamp as distinct expected slots; this health interpretation must not change the collector’s accepted no-deduplication semantics.
> 
> State why 35 minutes is the chosen tolerance, what exact inequality triggers it, and how admitted-but-still-running/delayed runs are treated. Consider the collector’s position after the other collectors and the platform execution allowance. Missing three finishes is not the same as independently observing three CPU/memory kills. Use “completion missing” rather than guessing a cause.
> 
> 2. Specify trial-window and malformed-configuration behaviour
> 
> The proposal says both “scheduled now, inside FROM–UNTIL” and “not scheduled after UNTIL plus margin”. Resolve that inconsistency with a state table: unset/manual outside a trial; valid future trial; active trial startup; normal active trial; last expected slot; end grace; completed closeout; intentionally paused; malformed gate/window.
> 
> Malformed or unreadable active-trial configuration must not default to healthy/not scheduled. Health polls use their current clock to evaluate which scheduled timestamps should have produced records; preserve the collector’s existing scheduled-time admission semantics. Do not turn the window into a deadline for admitted work.
> 
> The last slots also need assessment after UNTIL. Otherwise a run killed near the end can never become overdue before monitoring disarms. Preserve/report unresolved failures at closeout; window expiry is not evidence of recovery. An intentional pause can report “paused/not collecting”, but must not masquerade as successful recovery from the incident. If the current gate alone cannot distinguish deliberate pause from accidental disarming, keep that residual limitation explicit rather than claiming an armed-trial watchdog.
> 
> 3. Stop conditions must not vanish between polls
> 
> “Storage stop on the latest run” can hide a storage stop when a later run replaces it before the next poll. A three-refusal streak or six-slot no-publication condition can likewise disappear after a good run. The trial’s stop rules are not equivalent to “currently looks bad”.
> 
> Define a persistent incident interpretation over the current trial’s records, or an explicit latch/acknowledgment design. Prefer deriving it read-only from sufficient retained records if possible. Do not silently add health-request writes or change collection to support it. A subsequent success must not erase an unreviewed stop condition. State reset/acknowledgment and trial-identity boundaries, including pause/restart/new-window cases. Test failure → good run → next poll and failure just before trial end.
> 
> 4. Read the existing monitor configuration before relying on it
> 
> Inspect the actual account read-only: enabled monitor URLs, interval, HEAD handling, timeout/confirmation policy, accepted statuses, alert delay, device/email contacts, dependencies/maintenance suppression and current incidents. A public endpoint returning 200 does not prove its monitor is active or push is attached. The official app instructions say Push must be selected per monitor.
> 
> Use explicit no-store responses and equivalent HEAD/GET verdicts, with no secret or raw internal note in the body. Health must perform no EUMETSAT request, admin action, collection or cleanup. Query costs are bounded and indexed. 576 new requests/day is the nominal two-by-five-minute count; retries/confirmation probes and unsolicited public traffic can add load. D1 rows examined and R2 operations need measurement rather than “small” as a guarantee.
> 
> The 35 + 5 + delivery calculation is a design estimate, not a worst-case bound. Polling, confirmation, retries, outages and delivery can take longer. Measure a normal path and state the unbounded service/phone failure cases.
> 
> 5. A live positive need not mean breaking real collection
> 
> Accept the proposed temporary 404 monitor as a generic delivery-path test, subject to account status handling. It does not prove that either actual Earth from Space monitor has the correct URL/contact configuration, or that the new endpoint’s 503 path is wired through the deployed Worker.
> 
> Explore an isolated fixture deployment using the exact production health functions and deterministic fake records, returning real 200/503 HTTP responses without any real collection/bindings. Test down and recovery delivery with the Mac closed, then inspect both real monitor configurations and harmless manual-state polling. This adds a separately approved disposable test leg; no live mutable “make health fail” admin toggle is needed.
> 
> If that extra test is not chosen, the limited combined evidence can still be presented for Chad’s decision: offline logic + deployed healthy path + generic alert delivery + verified real monitor wiring. Call the actual live true-positive path untested, not impossible to test safely. Do not create any throwaway Worker or monitor from this review alone.
> 
> 6. State what remains dependent on the thread
> 
> Reducing inspections to two/three daily reads leaves single resource endings, other non-ok invocations, image integrity, CPU threshold, budget and some cross-layer conditions without independent timely detection. If the thread stops, they may never be found during the trial. Change “found at the next read” to “found if a later read takes place”. This is a material weakening of the earlier supervision basis, not just fewer phone pings.
> 
> Likewise, watching requests arrive at the health URLs proves traffic, not successful UptimeRobot verdict evaluation or delivery. Public endpoints can be polled by others and request logs may be incomplete/sampled. It cannot be described as a dependable independent monitor of the watcher. “Both must fail” is too strong: a blind spot, faulty health logic, suppressed alert or unavailable phone can also prevent notice.
> 
> M1–M4 recommendations
> 
> Decision
> 
> GPT view
> 
> M1 adopt direction
> 
> Yes, develop this in place of heartbeat pushes and silence noticing, after the contract corrections above. Retire the old duties only when replacement checks/delivery have been tested and the revised runbook is accepted.
> 
> M2 redeploy
> 
> Reasonable in principle. Use the then-current live hub baseline, not main’s older file. Show the health-only diff, unchanged collector/control paths and relevant regressions, plus runtime overhead. Stage C can carry forward as historical collector evidence if those checks support it; it does not prove the added endpoints or alert path. No need to automatically repeat collection simply because a version/hash changes.
> 
> M3 record reads
> 
> Prefer three named daytime reads to two for the proposed bounded trial, but only on a revised Stage D basis explicitly accepting delays for uncovered conditions and the 11-hour 20:00–07:00 gap if those times are used. Choose sustainable times with Chad. Do not approve this reduced frequency as equivalent coverage or make these reads the independent alarm.
> 
> M4 second company
> 
> Not necessary to propose by default for a 48-hour trial. Accept a single external-provider failure point only as a stated residual limitation; a second provider would reduce some common dependence, not remove every single point or endpoint/phone failure.
> 
> Free-plan question — resolved on current official sources
> 
> UptimeRobot’s current Terms section 3 explicitly permits commercial and business use; its Free-plan help page explicitly says no personal-only restriction and lists 50 monitors/five-minute checks. Its mobile-push documentation says pushes are available free and require per-monitor selection. The old third-party personal-only report does not outweigh these current primary statements. Standard fair-use requirements still apply. No need to contact UptimeRobot merely to resolve that old inconsistency.
> 
> This is a check of published terms/features, not confirmation of this account’s enabled plan/contacts. No account agreement was accepted and no setting changed.
> 
> Primary sources read 23 November 2026:
> 
> https://uptimerobot.com/terms/ — section 3, availability for commercial/business use.
> 
> https://help.uptimerobot.com/en/articles/11604710-who-should-use-uptimerobot-s-free-plan — Free eligibility, capacity and interval.
> 
> https://help.uptimerobot.com/en/articles/17662644-uptimerobot-mobile-app-push-notifications — free push and per-monitor settings.
> 
> https://uptimerobot.com/terms-fair-use/ — incorporated policy link.
> 
> Next: revise the proposal around exact record support, persistent stop-condition interpretation, trial-window closeout and bounded tests. Then it is suitable for Chad’s branch-build choice. No Stage D clearance yet; no need for more hourly phone-alarm rehearsals while this replacement is being designed.