# Earth from Space, Stage A: result of the twelve-hour probe

Worker `mother-earth-evprobe`, created 20 Nov 2026 on Chad's Approve line, start 2026-11-20T13:00:00Z, last permitted request
before 2026-11-21T01:00:00Z. Deployed code sha256 `a84cf8548ff86bb44a82860c2e63636f27148f8594d2ccc317201ca132488343`,
build `b512f2c92211-53f3982760b8`. Logs exported 03:57 UTC 21 Nov, rule run, then the Worker was deleted at
2026-11-21T04:01:43Z (the line's "then delete the Worker"). Nothing was extended, rerun or added.

## Verdict by the reviewed rule (`phase1/evprobe.report.mjs`, unchanged, sha256 93c3103f…)

**Both sizes: incomplete. Forward: undecided, the experiment is incomplete.** No criterion is "not met" at either size.

| Criterion | 2,048 px | 1,536 px |
|---|---|---|
| 1. No memory or CPU ending in phases 1 and 2 | incomplete (none observed; 22 of 23 runs complete) | incomplete (none observed; 22 of 23) |
| 2. Both responses name the requested time, 18 of 18 | incomplete (17 of 18 observed, 0 failures) | incomplete (17 of 18, 0 failures) |
| 3. Every refusal diagnosed | incomplete (0 refusals; one run incomplete) | incomplete (0 refusals; one run incomplete) |
| 4. Single-check CPU under 5,000 ms | incomplete (maximum 1,016 ms; one run not clean) | incomplete (maximum 637 ms; one run not clean) |
| 5. Every run with up to 48 MiB extra memory clean | met (6 of 6) | met (6 of 6) |

Every "incomplete" has one cause per size: a single phase 1 run in which EUMETSAT did not return the check image.

## What was observed

- 72 slots, 2 excluded as planned (18:00 and 18:10 UTC), **70 runs planned, 70 attempts observed, one per slot**. No duplicate
  delivery, no overlapping runs, no slot missed, 70 different isolates. At most 210 requests to EUMETSAT (70 x 3), the planned figure.
- **84 Cloudflare invocation records, every one with outcome `ok`** (6 before the start: "not started"; 72 slots; 6 after the end:
  "expired", no request made). No `exceededMemory`, no `exceededCpu`.
- **66 runs clean.** 116 picture checks made, 116 passed, 0 refused. The picture response named the requested time in 70 of 70
  runs; the check-image response did in all 66 runs where it was a picture.
- **4 runs ended "fetch failed"**, all on the check image, the picture itself being sound each time:
  - k=7, 14:10 UTC, 1,536 px, phase 1: HTTP 503
  - k=18, 16:00 UTC, 2,048 px, phase 1: HTTP 503
  - k=70, 00:40 UTC, 2,048 px, phase 3 at 96 MiB: HTTP 200 with `text/xml` in place of a picture
  - k=71, 00:50 UTC, 1,536 px, phase 3 at 96 MiB: HTTP 200 with `text/xml` in place of a picture
- CPU, from Cloudflare's invocation records:

  | | 2,048 px | 1,536 px |
  |---|---|---|
  | one check (phase 1), maximum | 1,016 ms | 637 ms |
  | six checks in one run (phase 2), maximum | 3,681 ms | 3,129 ms |
  | one check with extra memory (phase 3), maximum | 904 ms | 581 ms |

- Memory ladder (extra memory held during the check, two runs per rung per size): 16, 32, 48, 64 and 80 MiB, 2 of 2 clean at
  both sizes. 96 MiB: 1 of 2 clean at each size, the other being the fetch failure above, not a memory ending.
  **No run ended for memory at any rung.** The rule's caution applies in spirit: the ladder found no ceiling, so it shows
  the check ran with 96 MiB extra held, and does not show where the limit is or that the extra memory was counted toward it.
- Picture check margins: worst surround difference 3.6 at 2,048 px and 13.6 at 1,536 px (tolerance 16); lowest agreement
  0.933 at both sizes. 35 different frame times per size, 12:30 UTC 20 Nov to 00:20 UTC 21 Nov.
- Start delay after the scheduled time: at most 1.4 s.

## Files

- `lines.jsonl`: the probe's 480 log lines, keys sorted, lines sorted as text. sha256 e595bf93…a225cd
- `invocations.json`: the 84 invocation records (scheduled, outcome, cpu_ms, wall_ms, logged). sha256 43d6cfb8…956b0b
- `result.json`: output of the rule. `run-report.mjs`: how it was run (deployed file's start and build, no diagnoses).
- `enc.txt`, `generic.jsonl`, `decode.mjs`: how the export left the browser. Cloudflare's log query was read in Chad's signed-in
  dashboard pane (read-only). The pane has no file channel to the repo, so the page wrote a compact lossless form, which was
  copied out and decoded here; the page's sha256 of both files above equals the sha256 of the decoded files. One field
  group on the first line (`43732 44469 737`) was masked in transit by a number filter and was restored from an earlier
  read of the same line; the matching hash confirms it. Raw query result in the page: 564 events, sha256 b0486534…06965c
  (not kept; Cloudflare holds Workers Logs for 7 days).
- Constant on every invocation record: event type `scheduled`, cron `*/10 * * * *`, script version
  `a416085e-464c-4f97-8fea-6d625ba54daa`, not truncated.

## Deletion

`DELETE …/workers/scripts/mother-earth-evprobe` from the dashboard session returned 200 at 2026-11-21T04:01:43Z. Read back:
the account's Workers are now `mother-earth` only; the probe's schedules address answers "This Worker does not exist on your
account". The hub `mother-earth` was not touched.

## Decision needed (GPT, then Chad)

The rule returns incomplete results for a decision. The choices are to accept the evidence as it stands (17 of 18 per size
with no observed failure, plus everything above), or a short top-up run, which needs a new Approve line. Stage B is not
built and not approved.
