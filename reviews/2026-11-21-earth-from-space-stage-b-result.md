# Earth from Space, Stage B: result of the three observations

21 November 2026. For GPT's review, then Chad's decision. **Nothing is stored and nothing is enabled.** The hub stays at
0.6.21 with `EARTHVIEW_ENABLED` unset until Chad's next line. Rules: `docs/concepts/EARTH-FROM-SPACE-STAGE-B-PROPOSAL.md`
rev 2.1, section 4. Evidence: `reviews/evidence/2026-11-21-earth-from-space-stage-b/` (`observations/`, the deployment read-back).

## Verdict

**By the letter of the rule: MET.** Three of three observations complete, each with CPU below 5,000 ms, and no hub
resource ending in any assessment interval. No not-met condition was observed anywhere.

**What that verdict does not cover, plainly:**

1. **Coexistence under load was not observed.** Observation 2 was timed for the heavy hourly job and ended 4.6 s before
   that job began. All three observations are quiet ones. The question Stage B's busy sample was there to answer is open.
2. **The validation could not be timed from inside.** In Cloudflare's runtime the clock does not advance during
   computation, so the validation's start and end are the same instant in every answer. Its cost is known only as the
   request's CPU time; overlap was assessed against the whole run.
3. **No isolate ran the validation twice.** Each observation landed in a different, already-running isolate and was the
   first validation in it. Nothing is known about a second validation in the same isolate.
4. Three observations are few. This shows nothing went wrong three times. It is not a memory bound.

Whether the result is accepted as enough to go on, or a re-timed busy observation is wanted first (a new Approve line),
is for GPT's reading and Chad's decision. No replacement run was made.

## The three observations

| | 1 quiet | 2 timed for busy | 3 quiet |
|---|---|---|---|
| Window start (UTC) | 12:21:30, 60 s | 16:07:40, 30 s | 20:21:30, 60 s |
| Called / answered | 12:21:31 / 12:21:47 | 16:07:40 / 16:07:53 | 20:21:31 / 20:21:44 |
| Outcome | validated | validated | validated |
| Frame time, named by both headers | 11:50:00Z | 15:40:00Z | 20:00:00Z |
| Requests to EUMETSAT | 3 | 3 | 3 |
| Cloudflare outcome | ok | ok | ok |
| **CPU (whole request)** | **827 ms** | **587 ms** | **820 ms** |
| Wall (Cloudflare) | 16.4 s | 13.4 s | 12.2 s |
| `deadline_hit` | false | false | false |
| Agreement / worst surround difference (tolerance 16) | 0.9332 / 1.9 | 0.9436 / 3.6 | 0.9715 / 3 |
| Picture bytes | 673,461 | 665,348 | 545,873 |
| Isolate (id, age at the call, requests served before) | `8c82d654`, 449 s, 4 | `d788bc14`, 679 s, 4 | `4695281c`, 855 s, 4 |
| Validations before in that isolate | 0 | 0 | 0 |
| Other invocations overlapping the run | none | one 1 ms health ping | none |
| Hub invocations in the assessment interval | 86, all ok | 84, all ok | 83, all ok |
| Hub resource endings or error logs in the interval | none | none | none |
| Authorization header in Cloudflare's record | 8 asterisks | 8 asterisks | 8 asterisks |
| Complete by the rule | yes | yes | yes |

Request budget: 9 authorised, **9 made**. Calls to the route all day: three POSTs (200) and Claude's one GET during the
deploy read-back (405, no upstream request). No duplicate, no retry, no replacement. Each observation's script was started
by Chad; each claim is kept in `_review/earth-from-space-stage-b/results/` on the Mac.

## Points for GPT's reading

- **Deployed code.** The reviewed `phase1/worker.js` at `559f2e4` without its final newline: 532,761 bytes, sha256
  `2028e2daec92591d781e4f6289224c5e7c74fd16addfada62f6b6fc7359301c3`. Accepted by GPT before observation 1. Unchanged at
  every before-read (same hash, last deployment 06:08:56 UTC, no `EARTHVIEW_ENABLED`, no object under `earthview/`).
- **The busy miss (observation 2).** Run 16:07:40.0 to 16:07:53.4; hourly job scheduled 16:07:58, ran about 20 s, outcome
  ok, CPU 814 ms. EUMETSAT answered faster than the window design allowed for. A surer design starts the call a few
  seconds AFTER the job's scheduled second (for example a window opening at hh:08:01) and still reads actual overlap afterwards.
- **The clock limit.** `validation.started_at` equals `ended_at` in all three answers, `wall_ms` 0. The local suites
  could not show this (Node's clock advances). Consequence for the collector: none known, since it does not time its own
  validation; consequence for evidence: per-validation timing needs Cloudflare's CPU figure, which is per request.
- **Ships rows.** Observation 1: `ships` went `down` at 12:46:02Z inside the interval. Called unrelated on the Mac
  collector's own log: its connection to aisstream timed out before opening (`connect-timeout … opened=false`), the hub
  only accepted the failure report; the same entry appears 96 times in that log, including before any observation.
  Observation 3: `ships` `degraded` at 20:38:05Z is a stored sample the Mac itself marked low-flow, following a `down`
  from before the interval. Observation 2: `down` predates the interval. The rule's independent-evidence test is met in
  my reading; GPT may read it otherwise, in which case observation 1 would be incomplete and the verdict incomplete.
- **Isolates.** Three observations, three different isolates, each 7 to 14 minutes old with 4 requests served and no
  scheduled run in it. Each isolate's start coincides with a Mac ships post a few minutes earlier. Scheduled jobs ran in
  other isolates. So the validation has not yet shared an isolate with a scheduled job at any time.
- **CPU.** 587 to 827 ms for the whole request, in line with Stage A's single-validation figures at 2,048 px (450 to 1,016 ms).
- **Upstream.** No EUMETSAT failure in these three runs (Stage A: 4 in 70).

## State left behind

Hub 0.6.21 live, collection off, nothing stored, page unchanged by this work. Rollback remains main's `phase1/worker.js`
(sha256 `eb5b1de9…c4fa`, 0.6.19) on its own Approve line. The probe route stays in the deployed hub, behind POST, the
header key and the unset gate.

## Decisions

- **GPT:** accept "met" with the four limits above, or require a re-timed busy observation (and say its design), or read
  the ships evidence differently.
- **Chad, after GPT:** go on to the next stage's proposal (first stored frame and the gate, which needs the new manual-run
  step noted in the candidate packet), or approve one more observation first.
