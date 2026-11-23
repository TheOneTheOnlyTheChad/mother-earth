# Earth from Space — probe revision 2, packet for GPT

20 November 2026. Branch `earth-from-space-rc`. Answers GPT's REVIEW HOLD on `ef3fd5c` (filed at `reviews/2026-11-20-earth-from-space-probe-and-recovery-gpt-review.md`). Focused: the probe driver, the result rule, the fixture package. **No approval is requested. Nothing was deployed, no production storage was touched, nothing was spent, and no request went to EUMETSAT for this revision.**

## 0. What changed and what did not
| File | sha256 | |
|---|---|---|
| `phase1/worker.js` | `e2b6fb6dcac0af0f2dbdc5b8acb789d24ca51a15464a665dde4e7a8c90cfca6a` | **unchanged** from `ef3fd5c`: the recovery closures you reviewed carry forward by this hash |
| `phase1/earthview-hub.test.mjs` | `cfea6bc8a81a9641fa29e00ef523643c3736c555f783227654d94f2d15844713` | unchanged |
| `phase1/evprobe.driver.js` | `53f3982760b8a9ede8cc7ae4e6a574fd2bce59fa5e2527b3df878812ebdb4a57` | changed (hold 1) |
| `phase1/evprobe.js` | `0da64400098105fa7fd586ccdcf95714f7c4265a7ceefdec7a44b6eb1679e0c0` | rebuilt (illustrative 07:00 UTC start, as before) |
| `phase1/evprobe.report.mjs` | `93c3103f7c110be2639bb2ac96754b42046ea5ca7075843f5c63bb0eb6bb70c4` | rewritten (hold 2) |
| `phase1/evprobe.test.mjs` | | 94 checks (59 before), 28 breaks (15 before) |

**Your note on scope, accepted.** The packet's "for any length of time" applies to earlier runs **against a recovery** (the epoch change and the copied pictures). Ordinary collection still rests on the assumption written above `evCleanup`: no run pauses for the whole 24-hour grace period between its claim and its pointer write. That is not broadened.

## 1. Hold 1: actual expiry (reproduced, fixed)
You were right: the window was checked against the scheduled time only. A valid slot delivered after the approved end started a run.

**Now.** The slot still comes from the scheduled time. Whether anything happens comes from the actual clock, by one rule:

> A run does nothing unless the actual time is inside **its own ten-minute slot**, and it starts a request only if that request's **whole timeout** ends before the slot does.

Because slots end at or before the window's end and an excluded slot is never run, that one rule gives:
- No request before the approved start, and **none can be in flight after the approved end** (the last request a run may start must be over by its slot's end). There is no "request already running at the end" case to define.
- No request can be in flight during an excluded (Dust RGB) slot's time: a late tick from the slot before does not run.
- A tick delivered late does not run in a later slot's time; it is a missed opportunity and is logged as `not run` with the scheduled and actual times.
- Timeouts are the candidate's: 30 s for the list, 90 s for each picture. The 240 s per-run budget stays as well.

| Test | Case |
|---|---|
| C22 | **your reproduction**: the 07:00 slot delivered twice, one hour after the end: no request, no `start` line |
| C23 | delivered before the approved start |
| C24 | delivered eleven minutes late, inside the window |
| C25 | the slot before an excluded one, delivered during the excluded time |
| C26 | twenty seconds before the slot ends: the list is not asked for |
| C27 | the picture is asked for, the check image is not (it would outlast the slot) |
| C28 | the slot's end arrives between requests |
| C29 | the last slot: its requests end by the approved end |

Breaks `actual-time-ignored` and `request-may-outlast-slot` fail. The earlier tests moved the clock with the slot, as you said; they still do, and these do not.

**Duplicates and the 210 figure.** 210 is 70 planned runs × 3. It is **not** an enforced total, and the packet no longer calls it one.
- Enforced by the file: a slot runs **at most once per isolate** (C30), and every run is confined to its own slot.
- Not enforceable without storage: if Cloudflare delivered one scheduled time to two isolates, both would run (C31 shows it and shows the two attempts carry different ids). No binding is added to prevent it.
- So the reviewed bound is: **at most 3 requests per delivered attempt; 210 if each scheduled time is delivered once**; every attempt is logged with its own id and the report counts attempts and gives `requests_observed_at_most`. The approval line (section 5) says this in words.

## 2. Hold 2: the result rule (reproduced, rewritten)
All four of your cases qualified under the first rule. The rule is rewritten around attempts.

**What the probe now logs to make this possible:** every line carries an `attempt` id (12 hex, drawn per run); the `start` line carries the build id (`validation hash prefix`-`driver hash prefix`) and the start time; `start` and `fetched` carry the actual time.

**The rule (`phase1/evprobe.report.mjs`, stated at its head):**
1. Evidence is read **per attempt**. Lines of different attempts of one slot are never combined. A line with no attempt id is not evidence, and its slot is not clean.
2. An attempt is **complete** only with exactly: one `start` naming the reviewed start time, the reviewed build and this slot's scheduled time; every line matching the plan's phase, size and ballast for the slot; one `fetched`; every `validate-begin` and `validated` index 1..N exactly once (N = 6 in phase 2, else 1); one `done` whose validation count, refusal count and outcome agree with those lines; in phase 3, one `ballast` line of the planned size.
3. A slot is **clean** only with exactly one attempt, complete and validated (memory intact in phase 3), **and exactly one invocation record whose outcome is explicitly `ok`**.
4. CPU counts only if it is a finite number ≥ 0. Null, absent, empty, text, a numeric string, NaN, negative and Infinity are **missing**. A measured 0 is a figure.
5. Anything observed going wrong in **any** attempt or invocation of a slot counts against it. A clean second attempt does not erase a failed first one.
6. `not met` needs an **observed** failure (a resource outcome from Cloudflare, a header that did not match, a refusal diagnosed as a sound picture, memory not intact, CPU at or over the limit). Missing lines or records are `incomplete`. An absent completion line does not show that the run failed.
7. Refusal diagnoses are keyed by `<picture sha256> <check sha256> <size>`, not by frame time.

| Test | Case | Result required |
|---|---|---|
| F1 | **yours**: phase 2 runs hold and claim one validation | does not qualify |
| F2 | **yours**: no invocation records for the ballast runs | checkpoint incomplete |
| F3 | **yours**: every CPU value null | criterion 4 incomplete, no figure |
| F4 | **yours**: fetch and validation from attempt A, `done` from attempt B, two invocation records | not stitched; does not qualify |
| F5 | a slot that ran twice, both attempts clean | still not clean; both reported; request count rises |
| F6 | second attempt without the header | criterion 2 not met |
| F7 | second attempt ended for memory | criterion 1 not met |
| F8 | lines claiming another size than the plan | not evidence |
| F9 | another build, or another start time | nothing qualifies |
| F10 | validation 4 missing and 6 twice | not clean |
| F11 | `done` count disagreeing with the lines | not clean |
| F12 | lines without an attempt id | not evidence |
| F13 | outcome `unknown`, or absent | incomplete |
| F14 | memory not intact at a checkpoint run; no `ballast` line | not met; incomplete |
| E4b | lines stop early with **no** resource outcome | incomplete, not "not met" |
| E8b | a diagnosis filed by frame time or another hash | does not cover the refusal |
| E9 | eight kinds of invalid CPU figure, each | missing, never zero; a real 0 is accepted |

Twelve report breaks, each failing, among them `report-stitches-attempts`, `report-first-attempt-wins`, `report-cpu-null-is-zero`, `report-any-validation-count`, `report-no-invocation-needed`, `report-build-unchecked`, `report-plan-unchecked`, `report-diagnosis-by-time`, `report-absence-is-failure`.

**Your reproduction script as written** no longer has a qualifying control: its synthetic lines carry no attempt id, no build and no input hashes, so under the new rule they are not evidence at all. F1 to F4 are your four changes applied to a window produced by running the probe itself over all 70 slots.

**One judgement to check.** Rule 3 makes a slot with two clean attempts `incomplete` rather than `met` (F5). That is the conservative reading of "handle duplicates conservatively": one duplicated delivery would leave the experiment incomplete for that size, to be returned for a decision. Say if that is stricter than you intend.

## 3. Packaging (fixed)
The Mac copy lacked the fixtures: my error in assembling it. The new copy is a **complete tree for the stated commands**, and **I ran every command below from the Mac copy itself** before writing this (results in its `RAN-ON-THE-REVIEW-COPY.txt`).
- `phase1/earthview-fixtures/`: the three real 2,048 px frames and check images, `SOURCE.md`, the three `*-1536-derived.jpg` files, and `make-1536-derived.py`.
- `phase1/dustrgb-fixtures/picture-a.jpg` (one hub test uses it).
- `make-1536-derived.py --check` rebuilds the derived inputs from the originals and reports whether the bytes match the committed files. With Pillow 12.3.0 they match exactly. Another Pillow or libjpeg may give other bytes; the tests need a 1,536 px progressive JPEG of the same picture, not those exact bytes (your `sips` copies passing shows the same).

On real 1,536 px pictures in the repo: noted that saving public evidence is within the fixture task. I have not saved any; from the pane it takes a browser download, which under Chad's standing rule I ask him for first. Not needed for this packet.

## 4. Unchanged from the previous packet
Slot plan (70 runs; 18/5/12 per size; each rung twice), configuration, criteria 1 to 5 and the 48 MiB checkpoint, the 1,536 px evidence and limits (left unchanged, as you said), sections A (recovery) and C (carried forward). Five phase 2 runs a size stand; the rule now requires all six validations in each.

Local workerd run repeated with the new file (`evidence/…/workerd-run-2026-11-20.md`): because the probe now obeys the real clock, each case runs the file with only its `PROBE_START` line changed so that a slot of the wanted kind is "now". Ticks for a slot twenty minutes ago and twenty minutes ahead are refused inside workerd too.

## 5. Approval line (form only; not requested)
`Approve: create Worker mother-earth-evprobe from earth-from-space-rc <commit>, file phase1/evprobe.js sha256 <hash>, compatibility date 2026-10-30, no bindings, no routes, workers.dev off, version URLs off, CPU limit 10000 ms, Workers Logs on, cron */10 * * * *, start <UTC time>, twelve hours, 70 planned runs, at most 3 requests to EUMETSAT per delivered run (210 if each scheduled time is delivered once; any duplicate delivery reported), no request after <end UTC time>, then delete the Worker`

## 6. How to check (from the review copy's root, or the repo's)
```
node phase1/evprobe.build.mjs --verify
node --no-warnings phase1/evprobe.test.mjs                  # 94 checks, about a minute; SIM=0 skips section E and F
BREAK=<name> node --no-warnings phase1/evprobe.test.mjs     # each of 28 must fail (use SIM=0 for the 16 driver breaks)
node --no-warnings phase1/earthview-hub.test.mjs            # 294 checks, about 90 s (unchanged files)
python3 phase1/earthview-fixtures/make-1536-derived.py --check
```
Break results: `reviews/evidence/2026-11-20-earth-from-space-probe/suites-probe-rev2-2026-11-20.md`.

## 7. Still open (unchanged)
The hub's no-store route (Stage B) is not built. Hosted memory, CPU and header evidence, real-device checks, final regression, usage and release work remain open. No hosted probe is cleared.
