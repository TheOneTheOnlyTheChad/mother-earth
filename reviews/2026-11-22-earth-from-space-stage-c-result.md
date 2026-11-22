# Earth from Space — Stage C result: one stored picture by one manual run (22 Nov 2026)

Written 22 Nov 2026 12:25 UTC (clock reading), by the result rule of
`docs/concepts/EARTH-FROM-SPACE-STORAGE-TO-RELEASE-PROPOSAL.md` rev 2.2 section 4.5. For GPT and Chad.
Times are UTC. Every reading with its time is in
`reviews/evidence/2026-11-22-earth-from-space-stage-c/cloudflare-and-hub-readings.txt`; every saved answer and note is
in `…/results-as-saved/` with `results-as-saved.sha256`. The originals and the claims stay on the Mac in
`_review/earth-from-space-stage-c/results/`.

## Verdict proposed

**Not-met conditions: none found. A frame was published by the one authorised run, and the read-backs of section 4.4
are as stated, with two qualifications that keep this short of an unqualified "met" until they are settled:**

1. **The preview-page look was made by a different method from the one 4.4 names**, and **Chad has not yet said in
   the thread that he looked at the picture.** (Section 5 below.) Until he does, by "missing evidence is never counted
   as a pass", this item is open and the result is **incomplete on that one point**.
2. **Workers Observability (logs) volume was not read**, at the start or the end (it is not on the billing page that
   was read). Runbook 0.7 says a figure that cannot be read is reported as missing. It is missing.

The Stage C record also carries one finding and two unused windows, which a published frame does not remove:
the caller script defect found at C1 (section 2), and the windows of the first two Approve lines (section 1).

## 1. Approvals and what was done under each (all Chad's own messages, 22 Nov)

| Line | Window | What happened |
|---|---|---|
| Stage C (first) | 08:21 to 08:24 | Section 0 reads clean. C1 run with caller r1 at 07:35:02: status correct, but bash 3.2 printed a syntax error and the note's request line was malformed. **Stopped after C1** on GPT's recommendation. Window not used. |
| Stage C continued, caller r2 | 08:51 to 08:54 | C1 again (saved as C1.2), C2-hold, C2s, C3, C4-recover, C4s, C5a, C5b, C5-release, C5s by Chad; C6 by Claude. Chad then became unavailable; **the run was not made; window lapsed.** Requests to EUMETSAT: 0. |
| Stage C manual run | 11:51 to 11:54 | Pre-check 11:37:56 clean. **C7-run-1 called 11:51:10, published.** C8 status 11:58:49. |

The run was started by a one-line wait that Claude gave Chad in the thread (loop until 11:51:10, refuse after 11:54:00,
then `bash earthview-admin.sh C7-run-1 run`). **That wait line was not reviewed by GPT.** It decided only when the
reviewed script started; Chad pasted it himself.

## 2. Finding: caller script r1 on macOS bash 3.2 (kept)

`reviews/2026-11-22-earth-from-space-stage-c-c1-finding.md`; GPT's review of the fix
`reviews/2026-11-22-earth-from-space-caller-r2-gpt-review.md` (PASS). C1.1 and its malformed note are preserved
unchanged. Caller r2 (`ee08092ecdd61f1937ef65e283c9b196d00c47a38740bd671525a4a108adaa31`) was used for every later step;
its notes are clean and no shell diagnostic appeared in any step Chad pasted. The 18 earlier breaks were not rerun on
macOS.

## 3. The steps (each read by Claude before the next; each request seen in Cloudflare's record, 200, outcome ok, `authorization` masked, no key in any URL)

| Step | Called | Result |
|---|---|---|
| C1 (r1) → C1.1 | 07:35:02 | storage not set up; no hold. Malformed note (finding) |
| C1 (r2) → C1.2 | 08:05:28 | same state; clean note |
| C2-hold | 08:06:57 | `applied: true`, `held` |
| C2s status | 08:08:09 | hold shown; nothing else |
| C3 recover-plan | 08:08:37 | mode `first start`; plan id `294e508d75476393` |
| C4-recover | 08:09:04 | `recovered`; epoch `e20261122T080906Z-768e695ccab9b063`; guards pass |
| C4s status | 08:10:13 | pointer and list present, one epoch, 0 pictures, guards pass, held |
| C5a sweep-plan | 08:10:49 | would add 0 (no sweep-apply was made: nothing to add) |
| C5b release-plan | 08:11:01 | would remove the hold |
| C5-release | 08:11:32 | `released`. R2: `current.json`, `held.json`, one epoch marker |
| C5s status | 08:12:35 | no hold; guards pass |
| C6 (Claude, dashboard Settings form, pane displayed, **not refused**) | deployment 08:14:00 | `EARTHVIEW_ENABLED` = `manual`; code hash unchanged; 25 bindings; crons unchanged; hub reports 0.6.22. Tick 08:15:10 logged `earthview:not scheduled (EARTHVIEW_ENABLED is manual)`; 08:10:10 had said `unset` |
| C7-run-1 | 11:51:10 | `{"job":"earthview","result":"earthview:published 2026-11-22T11:20:00Z","wall_ms":19320}` |
| C8 status | 11:58:49 | 1 list entry, 1 object, in role as current (`2026-11-22T11:20:00Z`), previous null, epochs equal, 0 unlisted, guards pass, no hold |

Between 08:15 and 11:50 every five-minute tick logged `not scheduled (EARTHVIEW_ENABLED is manual)`; no admin call and
no non-ok invocation (412 invocations read at 11:37:56). C6's success shows only that Claude could make the change
with the pane open and Chad present at that hour.

## 4. The run (section 4.4 read-backs)

- **Answer and note:** POST `/admin/run/earthview`, called 11:51:10, answered 11:51:30, curl 0, HTTP 200. Claim present.
- **Log lines (same `exec` `c7bfdf8e3784`):** `run-start` trigger manual, run 11:51:11.167, hub 0.6.22, isolate
  `d388b18b`, isolate age 1,444,409 ms, `scheduled_before` 0, `fetches_before` 11. `run-end` `validated: true`,
  `validations_before: 0`, result published. So this isolate had served 11 fetches and no scheduled invocation before
  the run, and had validated no picture before.
- **Invocation record:** outcome ok, response 200, **whole-invocation CPU 536 ms** (checkpoint 5,000 ms), wall
  19,326 ms, key masked. No `exceededCpu` or `exceededMemory` anywhere in the day's reads.
- **Requests to EUMETSAT:** 3 by the code's count for a published run (one listing, one JPEG, one PNG). Counted from
  the code path and the published outcome, **not from a per-request log**. Stage C total 3; limit 6.
- **Status:** as C8 above.
- **R2 under `earthview/` (11:52:26 and again 12:22:39, unchanged):** `current.json` 1,528 B, `held.json` 506 B,
  `state.json` 307 B, `epochs/e20261122T080906Z-768e695ccab9b063.json` 303 B,
  `frames/e20261122T080906Z-768e695ccab9b063/20261122T1120Z-83c417a3246fcea9-g1-4be14d9d1ed424fd3857a435/picture.jpg`
  653,791 B. **Four small records and one picture; nothing else.**
- **Public reads (11:52:28, 11:52:39):** `/snapshot/earthview/meta` (no-store) returns the frame:
  `source_frame_time` = `served_time` = 2026-11-22T11:20:00Z, basis "the server named this frame time on both
  responses (Warning header)"; first listed seen 11:51:12.580; fetched 11:51:23.481 (frame 31 min 23 s old at fetch).
  The picture URL returns 200 `image/jpeg`, `public, max-age=86400, immutable`, 653,791 bytes, sha256
  `83c417a3246fcea99ac584320950f350f7bc00be52b9c34ddd992135e7bec899`: **equal to the record**; it decodes 2,048 × 2,048
  in the pane.
- **The hub's own checks on the frame:** decoded true; progressive, 10 scans; agreement with the check image 0.9383;
  surround share background 1; worst surround difference 1.9; disk brightness spread 47.2.
- **Percentiles, captured 11:53:16 and (hour complete) 12:22:39.** Hour 11:00, fetch: n 114, errors 0, CPU P50 2.8 ms,
  P90 5.4, P99 20.5, P99.9 536.7; memory P50 3.18 MB, P99 6.59, **P99.9 55.48 MB**. Cron: n 19, errors 0, CPU P50
  11.7 ms, P90 226, P99 270; memory P99 47.49 MB. Minute 11:51, fetch: n 2, CPU maximum 536.7 ms, memory maximum
  55,476,084 bytes. **That minute bucket holds two requests; its maximum CPU and maximum memory are separate maxima,
  and attributing 55.5 MB to the picture run is an inference.** No memory bound is claimed. It is not added to any
  other job's figure.
- **Other invocations:** 11:41:00 to 12:21:30: 88 invocations, 74 fetch and 14 scheduled, all ok. In this run the
  record times of the neighbouring scheduled invocations were 11:50:12 and 11:55:09; nothing is concluded from that
  about other runs. Fetches of the record and the picture in that period (1 and 2, plus a favicon) were Claude's
  read-backs. `/health/test/firms` was requested 3 times by a requester not identified; it is not an Earth from Space
  route.
- **Hub health after:** eight health URLs 200. `/status` non-ok rows: `opensky-bbox` (31 Oct), `firms:recovery`
  (02:45), and ships `degraded` (11:58 sample; it was ok at 08:01 and degraded at 07:12 and 11:26). Not connected to
  this stage by any evidence; not investigated.

## 5. The picture, looked at

- Claude, 11:53: the stored JPEG opened by its URL in the pane. Full disk, Africa centred, daylight, dark surround;
  no tearing or banding visible **at screenshot scale. Not a pixel inspection.**
- Claude, 12:23:57: the branch's page (`space.html`, `space.js`, `style.css` fetched from raw.githubusercontent at
  `b8e55e8`, sha256 checked against the commit, injected into a clean github.io tab) reading the **live hub**. It
  showed "Showing the last verified frame", "Our last check of the source was at 11:51 UTC, 33 minutes ago. Whether a
  newer frame exists is unknown.", the picture, "SOURCE FRAME TIME 11:20 UTC, 22 Nov 2026 · 64 minutes ago", and the
  EUMETSAT and NASA credits. **This is not the method 4.4 names** (the Mac review copy served locally); it is the
  project's usual hash-checked injection.
- **Chad:** the picture and then the page were left displayed in the pane for him. **He has not yet said he looked.**

## 6. Usage (runbook 0.7), billing page, account-wide

| | 07:33 | 12:23 | allowance |
|---|---|---|---|
| Workers requests | 86.11k | 88.63k | 10M |
| Workers CPU ms | 770.23k | 816.88k | 30M |
| R2 Class A operations | 58.8k | 58.8k (same figure shown) | 1M |
| R2 Class B operations | 92.08k | 92.08k (same figure shown) | 10M |
| R2 storage, GB-months | 0.53 | 0.56 | 10 |
| Usage cost | $0.00 | $0.00 | |
| Workers Observability volume | **not read** | **not read** | |

The differences are the whole account's five hours, not this stage's. The stage's own share from its records: 14
admin requests and a handful of read-backs; CPU well under 1 s in all (536 ms for the run); R2 operations by the
code's counts about 7 Class A and 14 Class B for the published run plus the set-up steps' few. The page's R2 operation
figures did not move at the precision shown, so they neither confirm nor contradict that.

## 7. Checked against the result rule

| Not-met condition | Found |
|---|---|
| `exceededMemory` or `exceededCpu` on the hub | none in any read |
| Containing invocation's CPU at or above 5,000 ms | 536 ms |
| Picture readable by URL that differs from its record | equal (sha256 and size) |
| A record state the guards refuse | guards pass before and after |
| A sound frame refused by validation | the one frame was accepted |

## 8. Not done, not shown

- The Mac-served preview page; Chad's own look (section 5).
- Observability volume (section 6).
- A per-request count of calls to EUMETSAT (section 4).
- Any second run: none was made or permitted (run 1 published).
- Anything about scheduled collection, busy coexistence, or memory headroom. One run in one isolate shows none of them.
- Phone, Safari, screen reader: Stage E.

## 9. State left (proposal 4.6)

`EARTHVIEW_ENABLED` = `manual`; nothing runs by itself. Hub code 0.6.22 unchanged. **The stored frame is publicly
downloadable by its URL and through `/snapshot/earthview/meta`; no page links to it, which is not privacy.** It ages;
nothing deletes it until a newer frame is published. The Earth from Space tab is not on the live page.

## 10. Asked

Of Chad: say whether he has looked at the picture (and the page) in the pane. Of GPT: review this result; say whether
the two qualifications close with Chad's look and the stated missing figure, or what else is needed. Then, each on
Chad's own line and not before: the email-alarm assessment (runbook 2a), the monitoring rehearsal (section 2), and
later Stage D with D3 and D8 decided. Before Stage D the caller fix and this result's finding go into its package.
