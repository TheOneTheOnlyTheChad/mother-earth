# GPT review of the hub 0.6.22 candidate `b8e55e8` (22 Nov 2026)

Relayed by Chad on 22 Nov 2026: a message and an attached text file, the fuller of the two, filed here as received.
Reviewed: `earth-from-space-rc` `b8e55e8`; `phase1/worker.js` sha256 `17798a44…da080`; `phase1/earthview-admin.sh`
sha256 `20726534…5407b`.

**Outcome: focused Worker code review PASS. The operational package stays on HOLD for four bounded items: three
runbook corrections and genuine native output of the caller suite. Not production approval. No proposal restart,
decoder redesign or Worker rebuild requested. Nothing deployed, stored or enabled.**

What GPT ran itself on the Mac (Darwin, Node v24.14.1): gate 163 of 163; hub without FAST 309 of 309; probe 117 of
117; all 31 gate breaks caught; a supplemental gate variant with a successful earthquake fixture, 164 of 164. It
reversed the diff and recovered the 0.6.21 file hash `7cbc8cc4…dc853` and the original span hash `cbe5dc6f…1ef6`.
**The caller suite did not run in GPT's sandbox** (`server.listen` on 127.0.0.1 refused with EPERM before any
assertion): neither a pass nor a failure.

## The review file, as received

> Earth from Space — hub 0.6.22 candidate review
> 22 November 2026. Candidate earth-from-space-rc b8e55e8.
>
> Verdict: focused Worker code review PASS; operational handoff remains HOLD for the native caller evidence and bounded runbook corrections below. This is not production approval. Claude can hand over now with these items stated explicitly. No proposal restart, decoder redesign or Worker rebuild is requested by this review.
> Reviewed identity and scope
> Mac review tree: /Users/chadobie/Documents/Mother Earth/_review/earth-from-space-0.6.22-candidate/.
>
> Independently verified:
> - phase1/worker.js: 17798a44a217bdb3eafe1ccd8852833cc050b9bb0e9094f65c59a2db2eeda080.
> - phase1/earthview-admin.sh: 2072653464c830ea5f0b2ad3d76a9d28c378896ccd4dcd95b3db27dd6ab5407b.
> Read packet, runbook, REGISTER draft, diff and changed source, gate/caller tests, relevant hub/probe changes, proposal and reported workerd/operation evidence. No credentials read; no real admin, probe, collection, storage or production setting action performed. Reported Cloudflare account state remains Claude's evidence, not an independent dashboard readback by this review.
> Six disclosed differences — accepted within this scope
> 1. Two run lines are preferable here: start precedes the collector's first awaited operation; end joins by per-execution id. These are emitted records, not a guarantee that the platform retains every record. Missing telemetry remains missing evidence.
> 2. Counting-only collector edits and three-part preservation checks are acceptable. Independently reversed the supplied diff: the reconstructed prior Worker hashes to the previously reviewed 0.6.21 source, 7cbc8cc4966ef3d2c512e9eaad279690259e76c9de4626a5ea1fa0da720dc853. Its whole original preservation span hashes to cbe5dc6ff44b857151450c7bb4d07268f6b1f27c3a6aa23cec4b61a8267c1ef6. This checks the new span assertions against the earlier identity rather than merely trusting their new constants.
> 3. Manual collection as POST with header authentication and no query is accepted.
> 4. Unknown actions/longer paths and unknown query parameters refuse before storage. Accepted. Existing path parsing collapses empty slash segments; this review does not claim canonical raw-path rejection for doubled/trailing separators.
> 5. Deferring page conflicts/main integration to Stage E is accepted for this hub review. No branch mergeability or final page-regression pass is claimed.
> 6. Manual collection at gate 1 outside the scheduled window matches the accepted separation. It is not authorised during Stage D and counts as the stated budget breach.
> Admission uses scheduled timestamps, FROM inclusive and UNTIL exclusive, strict ten-minute UTC window endpoints and span <=48 hours. It is neither a wall-clock execution deadline nor deduplication. Entry snapshots copy/freeze the per-cron tally before increment and before awaiting; validation snapshots count earlier completed validations at validation entry, not at handler entry.
> Independently executed on the Mac
> Host: Darwin, Node v24.14.1.
> - Original gate suite: 163 passed, 0 failed.
> - Original hub suite, without FAST: 309 passed, 0 failed.
> - Original probe suite: 117 passed, 0 failed.
> - All 31 gate negative controls: substantive assertion failures caught every break.
> - Supplemental gate variant: 164 passed, 0 failed. Replaced only the non-EUMETView stub with a fresh HTTP-200 one-earthquake GeoJSON fixture and added a positive baseline assertion of an ok USGS run plus snapshot write. Gate refusal cases still preserved the other collector's successful work. This is a modified supplemental harness, not a claim that Claude's original suite covered success.
> Native caller suite INCOMPLETE: attempted the exact requested command, node --no-warnings phase1/earthview-admin.test.mjs. It stopped before assertions because this shell sandbox refused server.listen on 127.0.0.1 with EPERM. This is an environment restriction, not an 80-check caller failure or pass. No alternate interface was used to evade that restriction. The supplied Linux 80/80 and 18 caught caller breaks remain Claude's reported evidence. Obtain an ordinary native Terminal run of this synthetic/local-only suite before using the production caller, and retain its output. Do not test against the real hub or real key.
>
> The other 27 Worker suites, hub/probe/caller mutation runs and local workerd sequence were read as reported evidence; they were not independently rerun in this review.
> Bounded closure required in the runbook
> 1. Correct trial-end ordering and expected logs (sections 3.3/3.4).
> Section 3.4 currently runs 3.3 (first setting the gate to manual) yet requires the following ticks to report after the window. The code checks the gate first, so those ticks report EARTHVIEW_ENABLED is manual. State the two phases correctly: any post-UNTIL ticks observed while gate remains 1 report after the window; after the pause/readback to manual, require the next two ticks to report manual. Do not delay an emergency pause to obtain a preferred line. If manual was set before a post-window tick was observed, say that production boundary evidence was not observed; retain isolated boundary tests.
>
> 2. Put the promised usage reads into the executable checklist.
> Packet section 6 promises current account usage at Stage C and the start/end of D, but the runbook omits them. Add explicit recorded reads for Workers requests/CPU, R2 storage/Class A/Class B, and relevant observability usage; compare the measured baseline and bounded added load against remaining included allowances. Preserve visitors as unknown extra demand. Availability of a paid plan's headline allowance alone does not establish unused headroom. Missing usage must be reported, not silently counted as zero cost. No new paid plan or cost approval is implied.
>
> 3. Carry forward pause ownership if C6 is refused.
> Proposal 4.2 explicitly requires rewriting Stage D pause ownership if Claude cannot make C6's supervised variable change. Add that conditional to the runbook and Stage D handoff: Chad becomes the actor; Claude immediately notifies him on detection; state the actual coverage and delay. A refused action is not retried through another interface. A successful supervised C6 still proves no unattended availability.
>
> 4. Retain the native caller gap until genuine native output exists.
> The exact command above uses a synthetic key, temporary files and a local stand-in. If Chad or the next session supplies its genuine macOS result, close this evidence item without a Worker rebuild. A bare handover assertion that GPT ran the suite is insufficient.
> REGISTER and source wording
> The draft correctly separates the product catalogue's explicit CC-BY-4.0 statement from the unread Data Policy PDF and unresolved provider-contact decision D3. I independently verified the current official catalogue text identifying GeoColour, its static NASA night background, the licence and credit to both organisations. Do not transfer the earlier Dust RGB policy reading to GeoColour, and do not remove the open items or call D3 decided.
>
> Draft wording is acceptable as a record of that evidence and its limits. Filing remains Chad's own action. It is not a new claim that all policy documents were read. Keep the public-download warning from first stored frame, and distinguish the Stage A estimated/planned request count from a measured total.
>
> Official source: https://user.eumetsat.int/catalogue/EO:EUM:DAT:0913
> Platform limits and alarm recommendation
> Current official Workers limits confirm the packet's short-interval cron CPU and wall limits and HTTP default CPU. The page now explicitly states no hard HTTP duration limit while the client remains connected, and that work may be cancelled on disconnect. Update the packet's narrower “not found” statement with that source qualification; curl's 300-second client timeout is not proof the invocation has ended, so lost-answer reconciliation stays mandatory. This changes no accepted whole-run-deadline decision.
>
> Source: https://developers.cloudflare.com/workers/platform/limits/
>
> Recommend attempting and testing an independent Cloudflare email alarm before Stage D, on Chad's separate settings approval. Do this as a bounded pre-D task, not an assumption hidden inside the trial-start line. Establish actual account availability, cost, scope, threshold, evaluation interval, recipient and receipt; use a harmless test facility or isolated test event, never deliberately fault the production hub. An available notification policy type does not prove delivery or coverage of CPU/memory endings. If unavailable/untested, state that explicitly in the Stage D approval package and let Chad decide on proceeding with the already described monitoring exposure. It is not a new Worker-code hold and does not replace the launch/phone/missed-launch rehearsal.
>
> Official alert references:
> - https://developers.cloudflare.com/notifications/
> - https://developers.cloudflare.com/workers/observability/logs/workers-logs/
> Handoff
> Keep 0.6.21 live/gate unset as the latest reported state until separately authorised actions and fresh readbacks establish otherwise. Preserve all existing Stage A/B verdicts and limitations.
>
> Next thread: close the bounded runbook items and native caller evidence, return the focused closure to GPT, then obtain Chad's separate REGISTER/deploy/Stage C lines in sequence. Rehearsal, Stage D (including D3 and explicit overnight acceptance) and page integration remain later gates. Every earlier approval stays spent.
## What was done about it (rev 2 of the runbook and a packet note, same day)

| GPT's item | Done |
|---|---|
| 1. Trial-end ordering and expected logs (runbook 3.3, 3.4) | Corrected: "after the window" is expected only on ticks seen while the gate is still `1`; after the change to `manual` the next two ticks must say "EARTHVIEW_ENABLED is manual". A pause is never delayed to obtain a line; if no post-window tick was seen before the pause, the result says the production boundary was not observed |
| 2. Usage reads in the checklist | Added as numbered reads at Stage C (0.7), Stage D start (3.1) and end (3.4), with what is recorded and compared; a missing read is reported, never counted as zero |
| 3. Pause ownership if C6 is refused | Added to the runbook (after the Stage C table and as section 3.0) |
| 4. Native caller evidence | **Still open.** The command for an ordinary Terminal on the Mac is in the runbook (section 5); its output is to be kept in the review folder. Not closed by assertion |
| Packet: HTTP duration | Section 5 of the packet now quotes Cloudflare's statement; a lost answer still means reconcile |
| Email alarm | Runbook section 2a: a bounded pre-D task on Chad's separate settings line; never by faulting the production hub; if unavailable or untested, said so in the Stage D package |
| REGISTER draft | Unchanged in substance; its Stage A request count already reads as planned, not measured |

Not claimed, as GPT states: canonical rejection of doubled or trailing slashes in a path (the existing path parsing
drops empty segments); that the platform retains every emitted log line; branch mergeability.
