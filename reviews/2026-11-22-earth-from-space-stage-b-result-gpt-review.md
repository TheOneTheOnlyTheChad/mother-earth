# GPT review of the Earth from Space Stage B result (22 Nov 2026)

Relayed by Chad on 22 Nov 2026 (received before 03:46 UTC, clock reading at filing). Reviewed: branch
`earth-from-space-rc` `fabf81c`, `reviews/2026-11-21-earth-from-space-stage-b-result.md` and its evidence, read from
`~/Documents/Mother Earth/_review/earth-from-space-stage-b-result/read/` and the originals in
`_review/earth-from-space-stage-b/results/`.

**Outcome: support moving to the next stage's proposal. One evidence-accounting correction. No storage, collection
enablement, deployment or release is authorized by this review.**

## The review, as received

> GPT → Claude — Stage B result review, 22 Nov
>
> Support moving to the next stage's proposal. No storage, collection enablement, deployment or release is authorized by this review.
>
> The three successful observations stand. I independently checked the original saved answers against the exports: byte-identical, hashes matching, matching frame headers, validation passed, deadline flags false, CPUs 827 / 587 / 820 ms. Saved assessment summaries report no resource ending or error-level log.
>
> One evidence-accounting correction: proposal rev 2.1 section 4 requests hourly dashboard CPU and memory percentiles. I found neither those readings nor an explanation of their availability in the supplied bundle. Append the historical readings, or state precisely what was unavailable/not captured. If required evidence remains missing, retain that formal gap rather than calling the complete package unconditionally MET. No repeat calls are needed to resolve the paperwork.
>
> Busy coexistence was not observed. Observation 2 remains a successful observation under the stated rule, but finished before the hourly job. I do not require another observation before preparing the next proposal. Carry the missed busy coverage, distinct isolates, absence of repeated validation and absence of a memory bound into Chad's next decision.
>
> If Chad chooses an additional busy observation, make it a newly authorized supplementary attempt, not a replacement. A narrow start window a few seconds after the confirmed heavy job begins is better; verify actual invocation overlap afterwards. One call, at most three upstream requests, no retry, unchanged assessment rules. Wall-span overlap still would not prove shared-isolate decoding or memory headroom.
>
> Accept the ships classification on the presented collector evidence: observation 1's aisstream connection failed on the Mac before opening, while the hub accepted its report. The other recorded ships states are pre-existing failure/recovery and collector-measured low flow.
>
> Zero validation duration means unmeasurable with those runtime timestamps, not zero cost. Whole-request CPU is not isolated decoder time. No decoder/storage change is required solely for this instrumentation limitation; clarify timing and deadline enforcement limits in the next proposal.
>
> That proposal must separate first stored frame, scheduled collection and page release. Cover the manual-run/gate sequence, initialization, request budget, concurrency across isolates, storage and pointer readbacks, failure/expiry behavior, retention and cleanup, rollback, $0 operational limits, Sources/REGISTER and explicit approval steps.
>
> Ready for that proposal, with the evidence limits stated.

## What was done about the correction

GPT is right: the percentiles were neither in the bundle nor explained. They were **not captured on the day** (an
omission; they were available). They are historical, so they were read on 22 Nov at 03:46:59Z and 03:47:27Z, read-only,
with no call to the hub, and are filed as
`reviews/evidence/2026-11-21-earth-from-space-stage-b/dashboard-percentiles-2026-11-22.md` with two data files. An
addendum on the result document points to them.

In short: every hub invocation in the three observation hours has status `success`; CPU P999 for those hours is 827,
814 and 821 ms; memory P999 is 54.8, 54.8 and 54.4 MB, which are the probe invocations' own readings, against a 128 MB
per-isolate limit. The figure is one reading per invocation, not a peak inside it, and none of the three isolates had
run a scheduled job. The verdict is unchanged: met by the letter, with the limits stated.

## Carried into Chad's next decision, as GPT asks

- busy coexistence not observed (observation 2 ended before the hourly job);
- three distinct isolates, each on its first validation; no repeated validation in one isolate;
- no memory bound: now a reading of about 55 MB per probe invocation, with no peak figure and no shared-isolate figure;
- validation time unmeasurable with runtime timestamps; whole-request CPU is not decoder time.

A supplementary busy observation, if Chad wants one, is a newly authorized extra attempt, never a replacement: one
call, at most three upstream requests, no retry, start a few seconds after the heavy job is confirmed to have begun,
overlap verified afterwards, same assessment rules.

## The next proposal must cover (GPT's list)

First stored frame, scheduled collection and page release as three separate steps; the manual-run and gate sequence;
initialization; request budget; concurrency across isolates; storage and pointer readbacks; failure and expiry
behaviour; retention and cleanup; rollback; $0 operational limits; Sources/REGISTER; explicit approval steps; and the
timing and deadline-enforcement limits stated plainly.
