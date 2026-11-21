# Earth from Space, Stage B: three validations inside the hub, nothing stored

Proposal **rev 2.1**, 21 November 2026 (rev 2 with the adjudication wording of section 4 tightened after GPT's review of the candidate, `reviews/2026-11-21-earth-from-space-stage-b-candidate-gpt-review.md`; nothing else changed). Branch `earth-from-space-rc`, documents only. **Nothing here is built, deployed or
approved.** Rev 2 takes in GPT's review of rev 1 (`reviews/2026-11-21-earth-from-space-stage-b-proposal-gpt-review.md`);
the changes are listed in section 10. GPT supports a branch-only build with these corrections, **on Chad's own go**, and
wants the implementation candidate back before any deployment or observation.

## 1. Where this starts from

- Stage A (the isolated twelve-hour probe) ended on 21 Nov. Formal result: **incomplete at both sizes**, no criterion "not met"
  (`reviews/evidence/2026-11-20-earth-from-space-probe/stage-a/result/README.md`). The Worker is deleted.
- GPT recommends going on to Stage B at 2,048 px **on Chad's explicit acceptance of the incomplete coverage** (D1).
- What Stage A did not show, and Stage B is for: the same validation **in the hub's own isolate**, beside the hub's other
  work and sharing its 128 MB. Stage A's ladder set no bound for the hub, and every Stage A run was in a fresh isolate.

Stage B stores no picture, does not switch collection on and does not release the page. It ends with results returned for review.

## 2. What would be built (branch only, after Chad's go)

### 2.1 One route: POST, key in a header

`POST /admin/probe/earthview`, with the admin key in the `Authorization: Bearer …` header.

- `GET`, or any other method: 405, nothing done. Any query string at all: 400, nothing done (so a key can never be accepted
  from a URL). Missing or wrong header: 403, nothing done.
- The route never logs a header or the key, and its three requests to EUMETSAT carry only the hub's `User-Agent`.
- The hub's existing admin routes keep their key-in-URL form; changing them is separate scope.
- **To verify in the candidate packet:** what Cloudflare's own invocation record stores of request headers (whether
  `Authorization` is redacted), from Cloudflare's documentation and from the local runtime. If it is stored readable, this
  comes back before any deployment.
- Who calls it: `phase1/earthview-stage-b-call.sh` on the Mac, which reads the key from `KEYS.md` itself, claims the
  observation number atomically before anything else (a claim is never released, so an observation is never called twice),
  starts curl with `-q` and an emptied environment so that no inherited setting can add a request, makes **one** POST, waits,
  and saves the answer. Claude does not see or type the key. Chad starts it (the Mac's sandboxed shell cannot reach the hub).

One call is one observation: read EUMETSAT's frame list, fetch the 2,048 px picture and the 256 px check image for the
newest listed time, require the served-time header on both to name that time, decode and compare with the collector's own
functions and limits (`evDecode`, `evPng`, `evCompare`, `EARTHVIEW.LIMITS`, unchanged), answer in JSON, `no-store`.
At most 3 requests to EUMETSAT. No retry inside a call.

### 2.2 A whole-run deadline

The collector's per-request limits (30 s list, 90 s each picture) add up to 210 s, too long for a timed observation.
The probe gets **one deadline for the whole run: 150 s from its start**. Each request's limit is the smaller of its own
limit and the time left; if the deadline passes, the run ends "deadline" with what it has (incomplete, by rule).
The client waits **180 s**, once. **No client retry**: if the answer is lost, the observation is incomplete and is not repeated.

### 2.3 No collection during Stage B, scheduled or manual

GPT's finding, confirmed in the code: `JOBS.earthview` (the manual `/admin/run/earthview`) ignores the gate, so an unset
gate alone does not make the probe the only Earth from Space validation.

- In the **outer dispatch**, before `runEarthView` and before the run-log wrapper `guarded`: both the scheduled path and the
  manual job refuse unless `EARTHVIEW_ENABLED` is `1`. Refusal makes no request, validates nothing, and touches neither the
  bucket nor the database. `evCollect`, the guards and the recovery code are **not edited**.
- The probe route refuses (409 "collection is on") unless `EARTHVIEW_ENABLED` is unset.
- So by configuration exactly one of the two can run. Tests: a manual call with the gate unset, while the probe is idle and
  while a probe is in flight: zero source requests, zero validation, zero storage and database calls.
- Consequence for later: the release plan's "first manual stored run before the gate" needs its own switch. That is a
  release-stage decision, listed in section 7, not built here.
- **Latch.** With collection excluded, a probe-only latch is enough: a second probe call in the same isolate while one runs
  answers 409 "busy" with no request and no decode; released in `finally`. **Limit, stated:** it is per isolate. It cannot
  see another isolate, and it is not a cap on requests to EUMETSAT. The budget of section 3 is kept by making three single calls.

### 2.4 It cannot write: proof on the whole route

- Design: the observation function `evProbeOnce(now)` is not given `env`. This is supplementary.
- **The proof is a test of the whole route**, wrapper, error handling and deferred work included. Every binding the hub has
  that can write is replaced by a spy: the R2 bucket (`put`, `delete`, multipart, and also `get`, `head`, `list`) and the D1
  database (`prepare`, `batch`, `exec`, and every statement's `run`, `all`, `first`). `ctx.waitUntil` is recorded and awaited;
  the cache API is spied. For **every outcome** the count of calls on all of them is zero: success; list fails, times out,
  unreadable; picture fails, too large, wrong type; check image fails, wrong type (the `text/xml` case from Stage A); header
  missing or naming another time on either response; validation refused; decoder throws; deadline; busy; collection on;
  wrong method; query string present; wrong or missing key.
- Breaks: adding any bucket or database call, passing `env` through, or routing the probe through `guarded` must fail the suite.
- In memory only, lost with the isolate: the latch and the counters of 2.5.

### 2.5 What each observation records

**Log lines** (safe: no key, no header), each with the attempt id, the probe build id and the isolate id: `start`,
`fetched`, `validate-begin`, `validated`, `done`, with clock readings. Cloudflare stores them under the same request as the
invocation record, so the lines, the saved answer (same attempt id) and **the exact invocation record** (outcome, CPU, wall)
are tied together by Cloudflare's request id, not by time alone.

**The answer:** attempt id; hub version; build id; requested frame time; run start and end; **validation start and end**;
per response: status, content type, bytes, sha256, header present, time named; every figure `evCompare` returns, or the
refusal reason; whether the deadline was hit.

**Isolate reuse:** isolate id made at module start; the isolate's start time and age; how many requests of any kind it has
served; how many Earth from Space validations it ran before this one, and the previous attempt id. Stage B cannot force a
cold or a warm isolate; it reports which it got.

**Actual overlap:** from the hub's invocation records, every other invocation whose start-to-end span crosses the
validation's start-to-end span, with its kind (which scheduled job, or a page request), CPU and outcome. An observation
timed for a busy period that overlapped nothing is reported as such; timing alone is not counted as overlap.

## 3. The three observations

**Order: quiet, busy, quiet.** Windows bound the **start of the call**; the run then has its 150 s deadline. Calendar dates
are fixed only after GPT's review of the candidate and when deployment is ready.

Measured from the hub's invocation records, 04:00 UTC 20 Nov to 04:00 UTC 21 Nov (457 scheduled runs, all outcome `ok`; read-only):

| Scheduled job | Starts | Runs | Wall, median / 95th / max | CPU, median / 95th / max |
|---|---|---|---|---|
| every 5 min | at :08 s of the minute | 289 | 2.2 s / 5.5 s / 9.0 s | 9 / 16 / 22 ms |
| every 15 min | at :40 s | 96 | 8.5 s / 99 s / 135 s | 217 / 600 / 762 ms |
| 11 and 41 past | at :38 s | 48 | 53 s / 66 s / 78 s | 23 / 208 / 228 ms |
| hourly, 7 past | at :59 s | 24 | 25 s / 53 s / 65 s | 84 / 1,042 / 1,072 ms |

The hourly run is heavy four times a day, at 04:07, 10:07, 16:07 and 22:07 UTC (CPU 718, 1,072, 717 and 1,042 ms; the other
twenty runs 57 to 174 ms).

- **Quiet start:** between hh:21:30 and hh:22:30, or hh:51:30 and hh:52:30. The five-minute run of hh:20 has ended, and
  the run ends by hh:25:00 at the latest, before the quarter-hour job at hh:30:40. The five-minute run at hh:25:08 falls
  after the deadline.
- **Busy start:** between 10:07:40 and 10:08:10 UTC, or the same seconds at 16:07 or 22:07, so the fetches run while the
  heavy hourly job (starting hh:07:59, typically 20 to 65 s) is working and the five-minute run of hh:10:08 may follow.
  Whether the decode itself overlapped is read afterwards (2.5), not assumed.

Budget: **9 requests to EUMETSAT, for three single attempts.** That is the authorised budget, kept by procedure, not a cap
the isolate enforces. A duplicate is reported. A missed, failed or lost observation is **not replaced**.

## 4. Reading the result

**Two different spans of time, not to be confused:**

- the **call-start window**: the 60 s in which the one call may start (section 3);
- the **assessment interval** of an observation: from **10 minutes before the call starts to 30 minutes after the run ends**
  (its `ended_at`; for a lost answer, 180 s after the call started). All hub health and resource evidence is judged over
  this interval. It is fixed here and is not shortened or lengthened after the fact.

Per observation, complete only with all of: the saved answer; its log lines; the exact invocation record with outcome `ok`
and a finite CPU figure; both responses usable with both headers naming the requested time; validation passed;
`deadline_hit` false; the health reads before and after.

**Health reads** (read-only), judged against each layer's own cadence: the hub's public status file before and after;
every hub invocation record in the assessment interval; the dashboard's memory and CPU percentiles for the hour, as
percentiles.

Verdict, in this order. **An observed not-met condition always takes precedence**: lateness, a lost answer or any other
incompleteness never masks it.

- **Not met**, if any of these is observed, whatever else is missing:
  - any `exceededMemory` or `exceededCpu` on the hub inside the assessment interval. This is **not met for operational
    coexistence**, whichever request it fell on, and without claiming the probe caused it
  - the observation's CPU at or above 5,000 ms
  - a header naming another time
  - a refusal of a picture found sound on diagnosis.
- **Met:** three of three complete, with none of the above.
- **Incomplete:** everything else, including: missing evidence; an upstream failure; a missed window; a lost answer; the
  deadline; **`deadline_hit` true even when the validation succeeded** (its figures are kept and reported, and it is still
  incomplete); and **any new failure, timeout or staleness on another layer inside the assessment interval** unless the
  rule below is satisfied.
- **Other layers.** A layer already failing or stale in the "before" read is recorded as pre-existing and is not counted.
  A **new** failure or timeout coinciding with the observation is **unexplained, and the observation incomplete**, by
  default: shared hub workload can contribute to a timeout without any `exceededMemory` event, and **a familiar error
  label is not evidence of an outside cause**. It may be called unrelated only on **independent evidence** that does not
  come from the hub's own record of that failure, such as: the same upstream failing for a request made from outside the
  hub in the same minutes (the browser pane, or the Mac collector's own log for a Mac-collected layer); the upstream's own
  published status; or the failure being on the Mac collector's side of a layer the hub does not fetch. The evidence is
  named in the result. Without it, the word "unrelated" is not used.
- A validation refusal is diagnosed from the saved hashes before anything is concluded.
- The `Authorization` masking is re-read on the first Stage B invocation record before observation 2 is started; if the
  key is stored readable, the remaining observations stop and it comes back to GPT and Chad.

Three observations are few. "Met" means nothing went wrong three times, not a measured memory bound. **Nothing is stored
and nothing is enabled until the result has been reviewed** and Chad has given the next line.

## 5. What goes to production, and on which lines

1. **Branch work (Chad's go):** build section 2 with tests and breaks; merge current main into the branch; full hub
   regression on the merged tree; packet with the exact hash of the **full merged Worker file**, which is what GPT reviews.
2. **GPT's review of that candidate.** Then the calendar dates are fixed.
3. **Approve line 1, deploy:** hub 0.6.19 to the candidate (0.6.21), `EARTHVIEW_ENABLED` not set. Read back the deployed hash
   and settings; confirm every existing layer still updates; confirm the public Earth from Space route answers
   "unavailable". **If the read-back finds any `earthview/` object in storage: stop and report. Nothing is deleted or
   initialised.**
4. **Approve line 2, the three observations:** the three start windows, 9 requests at most, nothing stored.
5. **Result** to GPT and Chad.

**For visitors: no intended visible page change.** It is a production change to the hub: the dormant Earth from Space
collector (about 1,640 added lines in `phase1/worker.js` against main, plus the probe route), its public read route and the
storage admin routes go live behind the unset gate and the admin key.

**Rollback:** redeploy hub 0.6.19 (main). No storage to undo. **Cost:** none expected; no new binding, storage or cron.

## 6. Risks, plainly

- First time the decoder runs in the live hub's isolate. If it exceeds memory, Cloudflare's stated behaviour is to let
  requests in flight finish and start a new isolate; requests can be cancelled under heavy load. A collector run caught by
  that fails once and runs again on its next schedule. The busy observation raises this chance on purpose, after a quiet one.
- EUMETSAT may fail an observation (4 of Stage A's 70; a sample, not a forecast). That yields "incomplete".
- Chad is needed at the Mac to start each observation's script, three times.

## 7. Not part of Stage B

First stored frame and the switch a manual first run now needs (2.3); the gate; the page and tab; a collector latch;
key-in-header for the other admin routes; morning and afternoon listing-delay samples; real phone, Safari and screen
reader; REGISTER and Sources; lifecycle rule check.

Collector behaviour is unchanged, as GPT asks: no publication without both usable responses and matching frame
confirmation; on failure the last validated pointer and its original timestamps stay, with the existing expiry; no new
immediate retry.

## 8. Decisions for Chad

- **D1.** Go on despite Stage A's incomplete coverage, verdicts recorded as incomplete? (GPT: yes. Claude: yes.)
- **D2.** 2,048 px? (GPT: yes. Claude: yes.)
- **D3.** Quiet, then one measured busy period, then quiet? (GPT: yes. Claude: yes.)
- **D4.** "Go" for the branch build of section 5 step 1? Branch only. The deploy and the observations each need their own
  Approve line later.

## 9. Open points for GPT at candidate review

1. What the invocation record keeps of the `Authorization` header (2.1).
2. The 150 s whole-run deadline and 180 s client wait.
3. The unrelated-failure rule of section 4.

## 10. What changed from rev 1

| GPT's point | Rev 2 |
|---|---|
| 1. Manual collector ignores the gate | 2.3: scheduled and manual collection both refused in the outer dispatch while the gate is unset; tests idle and in flight; recovery internals untouched; latch limit stated |
| 2. "No env" is not proof | 2.4: whole-route test with spies on R2 and D1, deferred work and cache; static check supplementary |
| 3. Authentication | 2.1: POST, header only, no query string accepted, nothing logged or forwarded |
| 4. Timing | Section 3: quiet, busy, quiet from measured job timings; windows bound starts; 2.2 whole-run deadline, one client wait, no retry; dates fixed later; actual overlap reported (2.5) |
| 5. Health verdict | Section 4: any hub resource ending in a window is not met for coexistence; incomplete and unrelated-failure rules defined |
| 6. Evidence | 2.5: lines, answer and exact invocation record tied by request and attempt id; validation start and end; 9 requests is a budget, duplicates reported, no replacements |
| 7. Deployment | Section 5: full merged Worker reviewed; "no intended visible page change"; unexpected `earthview/` objects mean stop and report |
