# Earth from Space — private branch, revision 2 (packet for GPT)

Answers GPT's review of `ef33a18` (REVIEW HOLD, relayed by Chad 20 Nov). Branch `earth-from-space-rc`. Read with the first packet, `reviews/2026-11-19-earth-from-space-rc.md`; only what changed is here.

**Not asked and not authorised:** any production step. Production is unchanged: hub 0.6.19 live; nothing deployed, written, gated, scheduled, probed, merged, spent or sent to a provider. Two dashboard pages were read (text only) on 20 Nov; nothing was clicked.

**No decoder option is proposed for selection in this packet and no production trial is requested.** Section 2 corrects the evidence only.

## 1. Publication against overlapping cleanup (finding 1) — fixed

### The defect, reproduced here
Regression `L1` in `phase1/earthview-hub.test.mjs` builds GPT's interleaving and **fails on the reviewed code** (`WORKER=<ef33a18 worker.js>`: 15 failed assertions in section L, among them "L1: the current frame's picture exists and is served"):

1. 11:00 is current. A run for 11:30 stores its picture and is interrupted before the pointer moves: an unpublished candidate.
2. The source list steps back to 11:10, which is published; that run's cleanup starts the candidate's grace period.
3. More than 24 hours pass with nothing new.
4. Run A (11:30, same bytes, so the same stored object) finds its picture already stored. Before A goes further, run B (11:20) publishes; B's cleanup finds the candidate out of role and past its grace period and deletes it.
5. A moves the pointer to 11:30. On the reviewed code the picture is gone: HTTP 503.

### The fix: a claim, a mark, and an order between them
Both are **conditional writes to the same record** (`earthview/held.json`), so one always sees the other.

- **Claim (collector step 6).** Before the pointer can name a picture, the run writes its entry on the held list with `left_at: null` and its own run stamp. The write **refuses if the entry is marked `deleting`** (the run fails with "stored copy is being removed" and publishes nothing). After the claim the stored bytes are checked **again**; if a cleanup finished before the claim and removed them, they are stored afresh.
- **Mark (cleanup, `evCleanup`).** A picture is marked `deleting` only in a conditional write whose own view of the list shows it **not in the pointer just read** and with `left_at` at least 24 hours old. Only then is the object deleted, and only if a **second** read of the pointer still does not name it. The entry is removed after the object.
- **Cleanup reads the pointer itself.** It no longer trusts what the publishing run believes current and previous are.

### Why cleanup cannot delete a candidate that can still become current or previous
A picture becomes current only through a run that claimed it first. Take any picture X and any cleanup C.

- **The claim's write lands before C's marking write.** C's write is conditional on the list as C read it, so it is refused and C evaluates again on the new list, where X has `left_at: null`. X is not eligible. The most a cleanup can do to X from here is start a new grace period at that moment, so X cannot be marked for another 24 hours. A run finishes in seconds.
- **C's marking write lands first.** The claim sees the mark and refuses. That run does not move the pointer. X cannot become current through it.
- **C finished entirely before the claim** (object deleted, entry removed). The claim creates a fresh entry; the check after the claim finds the object absent and stores it again. From the claim on, the first case applies.
- **X is already current or previous.** It was claimed (`left_at: null`) before its pointer write, and every cleanup reads the pointer afresh and sets `left_at` only on pictures the pointer does not name. A cleanup whose pointer read predates X's publication can at worst start X's grace period "now"; the next cleanup that sees X in the pointer clears it; none can mark it without 24 hours passing while the pointer does not name it. The second pointer read before deletion is a further guard for a state the protocol does not produce (`L7`).
- **An interrupted cleanup** (mark written, object not deleted) leaves a mark. Nothing can publish that picture while it stands, it is not served, and the next publishing run finishes the deletion (`L5`).

This is an argument about ordering through one conditionally written record, not a second read-back. It rests on R2's conditional `put` behaving as the existing probe (`/admin/probe/r2-conditional`, hub 0.6.0) showed on the production bucket.

**What it does not cover:** two runs storing different bytes for the same frame time use different keys, so neither can affect the other's object; a picture whose claim succeeded and whose pointer write then lost stays on the list with `left_at: null` until the next publishing run starts its grace period (a short-lived extra object, never a missing one).

### Regressions (section L, 35 assertions)
| Case | Interleaving | Asserted |
|---|---|---|
| L0 | set-up | candidate stored, listed, out of role, grace period begun |
| **L1** | B runs whole between A's stored-copy check and A's claim (GPT's reproduction) | B deleted the candidate; A stored it afresh and published; current and previous both served |
| L2 | B runs whole exactly at A's claim write | A's write is refused, A reads again; same outcome |
| L3 | A claims first, then B's cleanup runs before A's pointer write | the claimed candidate is not deleted although its grace period had run out |
| L4 | B has marked the candidate and is about to delete when A runs whole | A publishes nothing ("stored copy is being removed"); the next run stores and publishes it |
| L5 | B's delete fails after its mark | mark stands; picture not served; a run for it is refused; the next publication finishes the deletion |
| L6 | stale grace period on a picture that is previous | never deleted; grace period cleared; an idle run never cleans |
| L7 | a mark placed by hand on a live picture | cleared, nothing deleted |

After every case: the current picture exists and is served, the previous likewise, every stored picture is on the list, every unmarked entry has its picture.

New breaks, each fails: `claim-keeps-grace` (2), `claim-ignores-mark` (8), `no-check-after-claim` (5), `cleanup-own-view` (7), `no-second-pointer-read` (2), `serve-marked` (1).

## 2. Decoder evidence (finding 2) — corrected, nothing selected
Full account with raw counters: `reviews/evidence/2026-11-19-earth-from-space/decoder-memory-rev2.md`; raw runs `decoder-measurements-rev2.jsonl`; the first file is kept as `…-rev1-superseded.jsonl`.

- **GPT was right on both points.** The first script added `arrayBuffers` to `external`, which already contains it, and its single reading when the decode returned was reported as a peak. **"About 80 MB at peak" is withdrawn.**
- **Three things, now kept apart** (three real frames, Node 22, megabytes over the baseline):

| | Returned footprint (result held, after a forced collection) | Sampled peak, collections forced before each reading | Sampled peak, as run | Process RSS rise |
|---|---|---|---|---|
| day | 7.08 | 49.35 | 53.65 | 78 to 84 |
| night | 7.08 | 49.34 | 54.08 | 78 to 88 |
| dusk | 7.08 | 49.35 | 53.16 | 80 to 86 |

  The peak is a **sampled** one: 402 readings a run, every 256th of the decoder's 102,431 typed-array allocations and around each allocation of 1 MB or more. It is not a guaranteed maximum. RSS is the whole Node process and is not a JavaScript memory figure.
- **The live hub's own memory** (dashboard, 24 hours to 20 Nov 04:51 UTC, hub 0.6.19): P50 2.69 MB, P90 3.24 MB, P99 16.86 MB; "Exceeded Memory" 0 in 3,090 invocations.
- **Not established:** how a Worker accounts array storage against its 128 MB, when its collector runs, and its own overheads. Adding the sampled peak to the live hub's highest figure gives roughly 66 to 71 MB; the RSS-style figure is the pessimistic bound. Nothing here was measured in a Worker.
- **Shared isolate, caveat retained and the earlier sentence withdrawn.** The limit is per isolate and one isolate can be serving page requests and other scheduled work at the same moment. Cloudflare's page says in-flight requests are allowed to finish and a new isolate is created, and that under very high load some incoming requests may be cancelled. Rev 1's "an overrun would kill that run only" was not supported and is removed from STATUS and HANDOVER.
- CPU, uninstrumented: 348 to 375 ms for the whole validation.

## 3. Status wording (finding 3) — changed, with regressions
One rule now: **the heading speaks of the displayed frame against the newest verified frame; what is known of the source is said in the lines beneath.**

| | Situation | Before | Now |
|---|---|---|---|
| a | A successful check whose list ends **earlier** than a frame already verified (cached, stepped-back list) | "Current: the newest frame the source lists" | Heading "Showing the last verified frame". Line: "At 17:35 UTC the source's list ended at 11:00 UTC, earlier than the 16:50 UTC frame already verified. The list we were given was out of date. Whether a newer frame exists is unknown." |
| b | An earlier frame displayed, a newer verified frame on offer, source fresh | "Waiting for the next frame." | "The newest frame the source lists is 11:00 UTC." then "Source last checked at …". "Waiting for the next frame." appears only when the displayed frame is the newest verified one |
| c | An earlier frame displayed, newer one offered and not accepted, checks stopped (or failed, or a collection failed) | "Showing the last verified frame" | Heading stays **"Showing an earlier frame"**; the stopped or failed check, or the failed collection, is its own line beneath |

"Current: the newest frame the source lists" now needs all of: a successful check, no older than 25 minutes, listing exactly the newest verified frame, and that frame being the one displayed.

Regressions in `phase1/earthview-ui.test.cjs` against the real hub code: `C3b` (b), `F1b` (c, failed check), `F3` and `F3b` (a, from both pages), `G3` (c, GPT's exact state: 11:00 displayed, 16:50 offered, checks stopped). Pure table: `L7`, `L7a`, `L7b`. New breaks, each fails: `rollback-current` (3), `waiting-with-offer` (2), `offer-heading-lost` (4).

Preview: a new scene `source-stepped-back` between `dusk-published` and `nothing-newer` (eleven scenes).

## 4. Tests on this revision
| Suite | Result | Breaks, each must fail |
|---|---|---|
| `earthview-hub.test.mjs` | **143 passed, 0 failed** (108 before; 35 new in section L) | **25 of 25 fail**: the 19 of the first packet plus the six in section 1. `pointer-on-fail` fails by stopping the suite on an error, as before. Two breaks (`overwrite`, `no-readback`) no longer matched the reworked code and were rewritten; a break may now have several parts and every part must apply exactly once |
| The reviewed code against the new suite (`WORKER=` the `ef33a18` file) | **15 section-L assertions fail**, L1 and L2 among them | |
| `earthview-ui.test.cjs` (real hub code, real frames, real browser) | **79 passed, 0 failed** (72 before), run twice | **14 of 14 fail**: the 11 of the first packet plus `rollback-current`, `waiting-with-offer`, `offer-heading-lost`. Two (`current-on-failed-check`, `stale-ignored`) were rewritten for the reworked wording code |
| `dustrgb-hub`, `history-hub`, `sunface-hub`, `wind-hub` | 174, 33, 171, 103 passed, 0 failed | |
| Static preview | rebuilt from this revision; picture hashes checked at build | |

Not rerun for this revision, because nothing they read changed: `header-tabs` (3,218 at `ef33a18`), `desktop-overflow`, the existing page suites. `space.html` changed only in its script's `?v=`. **GPT's limits stand:** fallback-font header checks were not completed by GPT; the suite totals are Claude's; desktop Chrome only; no real phone, Safari or screen reader.

## 5. Still open (unchanged unless noted)
- Morning and afternoon listing-delay samples.
- Account-wide Workers request and CPU totals, R2 operation counts: not read. **New:** Observability usage read on 20 Nov after Cloudflare's notice of volume-based pricing from 1 Dec: 0.57 GB ingested and 0.12 GB-month stored this cycle against 50 GB and 10 GB-month included; estimated charge US$0.00. Earth from Space would add one run-log row every ten minutes, which is small against that allowance but was not measured.
- Anything inside a Worker: memory, CPU, and the served-time header for this layer and projection.
- Validation limits rest on three frames from one day.
- Eight existing page suites fail identically on main and the branch in the cloud workspace (first packet §6); cause not investigated.
- The faint-local-damage limit stays as stated; GPT judged it acceptable in principle for a viewing feature.

## 6. Preview
Mac folder `~/Documents/Mother Earth/_review/earth-from-space-rc-r2/` (the branch at this revision plus the static preview). Serve it and open `space-preview.html`; `PREVIEW-README.md` lists the eleven scenes. The first round's folder is in `_to_delete/`.

To see finding 3c: `first-night`, `newer-day`, press "Show it", then `dusk-published` (do not accept the offer), then `checks-stopped`.
