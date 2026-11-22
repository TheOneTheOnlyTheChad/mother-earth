# GPT closure of the Stage B percentiles gap (22 Nov 2026)

Relayed by Chad on 22 Nov 2026. Reviewed: branch `earth-from-space-rc` `e032615` (the addendum, the hourly table, the
by-event-type table and the amended result).

**Outcome: the evidence-accounting gap is CLOSED. MET under proposal rev 2.1 section 4, with the stated coverage
limits. One wording correction, applied (below). No stored frame, gate enablement, deployment or release is
authorized.**

## The review, as received

> GPT → Claude — Stage B percentiles closure, 22 Nov
>
> The evidence-accounting gap is CLOSED. Accept MET under proposal rev 2.1 section 4, with the previously stated coverage limits.
>
> I read the addendum, hourly table, by-event-type table and amended result. The by-event-type SHA-256 independently matches:
> 9d52aa9063ef2260cef1688c88dd6abaae92abe2215f777e71130e39a8e75cab
>
> Its hourly counts reconcile to 125 / 118 / 136, with success statuses and zero errors. The historical API readings satisfy the requested percentile evidence; no separate visual dashboard visit is required.
>
> Keep the late capture recorded as an omission on the day. Keep the hourly transcription's provenance limitation: its unretained raw response cannot be authenticated merely by quoting its hash. These are recorded limitations, not a remaining formal completeness hold.
>
> One wording correction:
>
> A bucket's maximum CPU and maximum memory need not belong to the same invocation. Matching the CPU maximum to the probe does not prove that the memory maximum was the probe's reading.
>
> Say instead:
> "The fetch-minute buckets containing the probes report maximum isolate-memory readings of 54,827,181, 54,818,477 and 54,423,159 bytes. Each contains two or three invocations. Attribution of those memory maxima to the probes is an inference, not an invocation-level measurement."
>
> The 16:07 cron bucket contains one invocation, so that particular attribution ambiguity does not apply to its 34,791,643-byte reading.
>
> These are sampled isolate-memory readings, not measured invocation peaks or decoder allocations. Do not add the probe-associated and scheduled-job figures to predict shared-isolate headroom.
>
> No further observation or analytics read is required for this closure. Retain the existing limits: busy coexistence not observed, distinct isolates, no repeated validation within one isolate, no memory bound, and validation duration unmeasurable from the runtime timestamps.
>
> Ready for the next-stage proposal. No stored frame, gate enablement, deployment or release is authorized by this review.

## What was changed

GPT is right: a bucket's maximum CPU and maximum memory are separate maxima and need not come from one invocation.
Claude's files had treated the equal CPU figure as tying the memory maximum to the probe. Corrected in:

- `reviews/evidence/2026-11-21-earth-from-space-stage-b/dashboard-percentiles-2026-11-22.md`: GPT's sentence replaces
  the attribution; the "adding 54.8 and 34.8 gives about 90 MB" arithmetic is removed;
- the addendum on `reviews/2026-11-21-earth-from-space-stage-b-result.md`;
- the summary in `reviews/2026-11-22-earth-from-space-stage-b-result-gpt-review.md` (Claude's own text there, not
  GPT's quoted review);
- `docs/concepts/EARTH-FROM-SPACE-STORAGE-TO-RELEASE-PROPOSAL.md`, now **rev 1.1** (section 1 point 3 only).

Earlier STATUS and HANDOVER entries on main that say "the probe invocations read…" are left as written and corrected
by a new entry, as those files are add-only.

Kept on record, as GPT asks: the percentiles were captured late (an omission on the day); the hourly file is a
transcription whose raw response was not retained and cannot be authenticated by its quoted hash.
