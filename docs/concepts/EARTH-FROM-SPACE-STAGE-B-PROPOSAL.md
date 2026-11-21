# Earth from Space, Stage B: three validations inside the hub, nothing stored

Proposal rev 1, 21 November 2026. Branch `earth-from-space-rc`, documents only. For GPT's review, then Chad's decision.
**Nothing here is built, deployed or approved.** It answers the seven points of GPT's review of the Stage A result
(`reviews/2026-11-21-earth-from-space-stage-a-result-gpt-review.md`).

## 1. Where this starts from

- Stage A (the isolated twelve-hour probe) ended on 21 Nov. Formal result: **incomplete at both sizes**, no criterion "not met"
  (`reviews/evidence/2026-11-20-earth-from-space-probe/stage-a/result/README.md`). The Worker is deleted.
- GPT recommends going on to Stage B at 2,048 px **on Chad's explicit acceptance of the incomplete coverage**. That acceptance
  is decision D1 below. Until Chad gives it, this proposal is preparation only.
- What Stage A did not show, and Stage B is for: the same validation **in the hub's own isolate**, beside the hub's other
  work and sharing its 128 MB. Stage A's ladder found no ceiling and sets no bound for the hub. Every Stage A run was in a
  fresh isolate, so nothing is known about a reused one.

Stage B does not store a picture, does not switch collection on, and does not release the page. It ends with results
returned for review.

## 2. What would be built (branch only, after Chad's go)

### 2.1 One admin route

`GET /admin/probe/earthview?key=ADMIN_KEY`, beside the hub's existing `/admin/probe/…` routes and behind the same admin-key
check (wrong or missing key: 403, no request made).

One call does one observation:

1. Read EUMETSAT's frame list (one request, 30 s limit), take the newest listed GeoColour time on the ten-minute grid.
2. Fetch the 2,048 px picture and the 256 px check image for that time (one request each, 90 s limit).
3. Require the served-time header on **both** responses to name the requested time.
4. Decode and compare with the same functions and limits the collector uses (`evDecode`, `evPng`, `evCompare`,
   `EARTHVIEW.LIMITS`, unchanged).
5. Return the result as JSON with `Cache-Control: no-store`.

At most 3 requests to EUMETSAT per call. No retry inside a call.

### 2.2 It cannot write (GPT point 2)

- The observation is one function, `evProbeOnce(now)`. **It is not given `env`**, so it has no handle on the bucket, on
  any other binding or on a secret. The route wrapper touches `env` only to compare the admin key and read the gate.
- It does not call `evState`, `evFail`, `evUpdate`, `evCollect`, `evCleanup`, `evGuard` or `evAdmin`, and uses no cache API.
- Tests, each run for **every outcome** (success; list fails, times out, unreadable; picture fails, too large, wrong type;
  check image fails, wrong type; header missing or naming another time on either response; validation refused; decoder
  throws; busy; gate on; wrong key): the bucket double counts every `put`, `delete`, `get`, `head`, `list` and multipart
  call, and the count stays at zero. A static test asserts the function's source names no `env`. Breaks: adding any write,
  or passing `env` through, must fail the suite.
- In-memory only, lost with the isolate: the busy latch and the counters of 2.4. Nothing persists.

### 2.3 Collection disabled, and no overlap (GPT points 1 and 3)

- **Gate.** The route runs only while `EARTHVIEW_ENABLED` is unset. If it is `1`, the route answers 409 "collection is on"
  and makes no request. With the gate unset the collector makes no request and writes nothing (hub suite case A1), so in
  Stage B the probe is the only Earth from Space validation in the hub.
- **Latch.** A module-level flag is set before the first request and cleared in `finally`. A second call arriving in the
  same isolate while one is running answers 409 "busy", makes no request and does no decode. Tests: two overlapping calls,
  the second refused with zero fetches; the latch is released after success, after each failure and after a thrown error.
- **Stated limit.** The latch is per isolate. Cloudflare may run more than one isolate, and a latch cannot see across
  them. Operationally the three observations are called one at a time, each awaited to its answer, hours apart.
- **Not in Stage B:** making the collector take the same latch. That touches `evCollect`, whose recovery closures GPT accepted
  on the condition that `phase1/worker.js`'s recovery code is unchanged. It is listed as a release-stage question (section 7).

### 2.4 What each observation reports (GPT points 4 and 6)

From the route's own answer:

- an attempt id; hub version and a build id of the probe code; requested frame time; start and end clock readings
- per response: HTTP status, content type, bytes, sha256, header present, the time the header names
- validation: every figure `evCompare` returns, pass or the refusal reason; wall time of decode and compare
- **isolate reuse:** a random isolate id made at module start; the isolate's start time and age; how many requests of any kind
  this isolate has served; how many Earth from Space validations it has run before this one, and the previous one's attempt id.
  That says plainly whether an observation ran cold or in a warm, reused isolate. Stage B cannot force either.

From Cloudflare, read-only in the dashboard pane, for that one request: the invocation record's outcome, CPU time and wall
time.

**Hub health, read before and after each observation (read-only):**

- the hub's public status file: every other layer's last-good time and state, to see that nothing went stale or failed
  around the observation
- Cloudflare's invocation records for the hub from 10 minutes before to 30 minutes after: counts by outcome, any
  `exceededMemory`, `exceededCpu` or exception, and whether scheduled runs in that window completed
- the dashboard's memory and CPU percentiles for the hub for that hour, reported as percentiles, not maxima

**Confirmed, read-only, 04:29 UTC 21 Nov:** the hub has Workers Logs on with invocation logs, sampling 1, and its request
records carry outcome, CPU time and wall time (33 records in the 15 minutes read). So criterion 4 can be read without any
settings change. Noted from the same read: the hub does not redact query strings in its logs, so the admin key in an admin
URL may be recorded in the account's own Workers Logs, as for every existing admin route. Not changed here; question 6.

## 3. The three observations (GPT point 4)

Declared in advance, in the Approve line, as three UTC windows on one day or across two. Proposed, for Chad and GPT to change:

| | Window (UTC) | SAST | Why |
|---|---|---|---|
| 1 | 07:20 to 07:29 | 09:20 | morning; full-disk daylight, larger picture files |
| 2 | 12:07 to 12:09 | 14:07 | midday, **on the minute the hub's hourly job runs** (7 past), to observe the decode beside other hub work. Which scheduled job is the hub's heaviest has not been measured; it can be read from the hub's invocation records before the windows are fixed |
| 3 | 20:40 to 20:49 | 22:40 | night; outside the 06:00 and 18:00 UTC Dust RGB runs |

One call per window. If a window is missed (pane signed out, Mac asleep), that observation is **not run** and is reported
so; it is not moved. 9 requests to EUMETSAT at most in total.

Window 2 is deliberately the least comfortable one. If GPT or Chad prefer three quiet windows first, say so; the cost is
that the first observation under load would then be a stored run.

## 4. Reading the result (GPT points 4, 5 and 7)

Per observation, all of these, or it is not complete:

1. the route's full answer was received and saved
2. both responses usable, both headers name the requested time
3. validation passed
4. Cloudflare's invocation record for that request found, outcome `ok`, CPU a finite number **below 5,000 ms**
5. the health reads before and after were made, with no `exceededMemory`, `exceededCpu` or new failure on the hub in the window

Verdict:

- **Stage B met:** three of three complete.
- **Not met:** any observed failure of the hub or of our code: a resource ending, CPU at or over 5,000 ms, a header
  naming another time, a validation refusal on a sound picture, another layer failing in the window with a cause in this code.
- **Incomplete:** anything else, including an upstream failure (as in four of Stage A's 70 runs), a missed window or a
  missing record. **No automatic extra run, no moved window, no retry.** An incomplete or not-met result goes back to GPT
  and Chad as it is.
- A validation refusal is diagnosed from the saved hashes before anything is concluded, as in Stage A.

Three observations are few. A met result means "nothing went wrong three times", not a measured memory bound.
**Whatever the result, nothing is stored and nothing is enabled until it has been reviewed** and Chad has given the next line.

## 5. What goes to production, and on which lines

Stage B needs the candidate hub in production with collection off. That is a hub deploy and needs its own line.

1. **Branch work (Chad's "go"):** build 2.1 to 2.4 with tests and breaks; merge current main into the branch; full hub
   regression on the merged tree; packet to GPT with the exact file hash.
2. **GPT's review** of that candidate.
3. **Approve line 1, deploy:** hub from 0.6.19 to the candidate (0.6.21: Earth from Space collector dormant behind the unset
   gate, its public read route, the storage admin routes, the probe route), `EARTHVIEW_ENABLED` not set. Read back the
   deployed hash and settings; confirm every existing layer still updates; confirm the public Earth from Space route
   answers "unavailable" and that no `earthview/` object exists.
4. **Approve line 2, the three observations:** the three windows, at most 9 requests to EUMETSAT, nothing stored.
5. **Result** to GPT and Chad.

Lines 1 and 2 can be given together or apart; they are separate actions.

**What the deploy changes for visitors:** nothing. The page is not merged, the tab is not shown, collection is off.

**Rollback:** redeploy hub 0.6.19 (main). No storage to undo, since nothing is written.

**Cost:** none expected. No new binding, no storage, no new cron.

## 6. Risks, plainly

- **This is the first time the decoder runs in the live hub's isolate.** If it exceeds memory, Cloudflare's stated behaviour
  is to let requests in flight finish and start a new isolate; requests can be cancelled under heavy load. A collector run
  caught by that would fail once and run again on its next schedule. That is the reason for three single calls and for
  watching the hub around each.
- The deploy itself carries the dormant Earth from Space code into the hub (about 1,640 added lines in `phase1/worker.js` against main, before the probe route). It is behind the gate and the
  admin key; the hub suite covers "gate unset makes no request and writes nothing".
- EUMETSAT may fail an observation (it did 4 times in 70). That yields "incomplete", by rule.

## 7. Not part of Stage B

First stored frame; the gate; the page and tab; whether the collector should share the busy latch; morning and afternoon
listing-delay samples; real phone, Safari and screen reader; REGISTER and Sources; lifecycle rule check; real 1,536 px
fixtures (no longer needed if 2,048 px goes forward). Each stays on the open list.

Collector behaviour is unchanged, as GPT asks: no publication without both usable responses and matching frame
confirmation; on failure the last validated pointer and its original timestamps stay, with the existing expiry; no new
immediate retry.

## 8. Decisions for Chad

- **D1.** Accept Stage A's evidence as enough to go on, with both formal verdicts recorded as incomplete? (GPT: yes.
  Claude: yes.)
- **D2.** 2,048 px for Stage B? (GPT: yes. Claude: yes.)
- **D3.** The three windows of section 3, including the one on the hourly job's minute, or three quiet ones?
- **D4.** "Go" for the branch work of section 5 step 1? This is branch work only. The deploy and the observations each
  need their own Approve line later.

## 9. Questions for GPT

1. Is "the function is never given `env`" plus the counted bucket double enough for point 2, or do you want the route
   to run against a binding-less stub as well?
2. Latch in the probe only for Stage B, collector latch deferred to release: acceptable, given the gate guarantees the
   collector is idle?
3. Window 2 on the hourly job's minute: wanted, or too much for a first observation?
4. Is the health read (status file, invocation outcomes for the window, hourly percentiles) the right set, and is "no
   `exceededMemory` on the hub in the window" a fair not-met condition when the cause may be another request?
5. Should the busiest scheduled minute be measured from the hub's invocation records first, and window 2 set on it?
6. The admin key travels in the query string and the hub's logs do not redact query strings. Leave as is for Stage B
   (existing behaviour of every admin route), or move the key to a header for this route?
