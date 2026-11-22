# Earth from Space — email alarm assessment (runbook 2a), read-only (22 Nov 2026) — rev 2

**Rev 2, 22 Nov 2026 15:06 UTC (clock reading),** after the review Chad sent back in the thread on 22 Nov (five points and a cost
note; section 9 lists each and what changed). Sections 3 to 5 and 8 are rewritten; section 6 reworded. **State now (see sections 10 and 11): one throwaway Worker, `mother-earth-alarmtest`, exists with its address off;
no monitor exists; `mother-earth` is unchanged.** Sections 1 to 9 were written before anything was created and
describe the read-only assessment as it then stood.

Written 22 Nov 2026 14:54 UTC (clock reading), on Chad's go of 22 Nov: "Go ahead with the read-only email-alarm assessment:
availability, actual detection coverage, delivery options and cost. Show me the proposed configuration before
creating or enabling anything." **At that time nothing had been created, enabled or changed** (historical; see the state line above). One monitor form was opened in the
dashboard to read its options and left without saving; the monitors list was read back empty afterwards.
`EARTHVIEW_ENABLED` stays `manual`.

## 1. What Cloudflare offers this account (read 14:51 to 14:54 UTC)

| Route | What it is | State on this account |
|---|---|---|
| **Monitors** (dashboard: Observability, Monitors; marked **Beta**) | A SQL query run on a schedule; threshold, anomaly or SLO; notifies when the result meets the condition | None exist. The form lists about 100 datasets, among them **Workers Invocations** (`events.workersInvocations`: "Workers invocations with adaptive sampling, execution timings, and response sizes"), **Workers Logs**, **Workers Real-Time Issues**, R2 Operations, D1 |
| **Workers Issues** with the "Real-Time Issue" notification | Cloudflare groups failures of a Worker into issues; automations send them on | **Not enabled** for `mother-earth` (the page offers "Enable issues"). Enabling is a setting on the Worker |
| Notification types listed by the account API | `custom_analytics` ("Configure your own alert for your data set"), `workers_observability_alert`, `workers_observability_real_time_issue` | Only policy that exists: the auto-created budget alert (US$10, one email recipient) |
| Delivery | Email: eligible and ready. Webhooks: eligible and ready, none configured. PagerDuty: not eligible | |

Worker logging as configured: observability on, invocation logs on, sampling 1, traces off.

## 2. What the documentation says (Cloudflare docs, read 22 Nov 2026)

- Monitors "evaluate a SQL API query on a schedule and send a notification when the result meets your detection
  criteria". Execution interval: the fastest the dataset supports, or a custom value of at least one minute; most SQL
  API datasets support one minute. Repeat notification interval one minute to 168 h, default 1 h. Email: up to 20
  recipients. **"A query that returns no rows produces no signal and cannot trigger the monitor for that evaluation."**
  The query preview "may differ from what the monitor evaluates". **No test-notification facility is described.**
  Monitor limits per plan, cost and data delay are not stated on that page.
- Cost: the Observability datasets page says "Queries, dashboards, alerts, and analytics do not incur additional
  charge." Email delivery is on all plans. **No charge for a monitor was found; no page says "free" for Monitors by
  name, and the feature is in beta.**
- Issues "is free to use during the beta period"; it records an occurrence for an uncaught exception, a failed
  invocation, a 5xx response or an error log. **Its page does not mention CPU or memory limit endings, nor scheduled
  invocations.** Automations go to a webhook, chat service, incident tool or coding agent; email is not listed there.
- **Pricing change on 1 December 2026:** Workers Logs moves to Cloudflare Observability pricing. Paid: 50 GB ingestion
  and 10 GB-month storage included per billing cycle, then US$0.25 per GB and US$0.10 per GB-month. Until then:
  20 million log events a month included with Workers Paid.

## 3. Detection coverage, as far as it can be established without creating anything

**Basis:** the Workers Invocations dataset is the one behind the `workersInvocationsAdaptive` readings used all week;
its dimensions include `scriptName`, `status`, `eventType` (schema read 14:53 UTC).

- **This account's history cannot show coverage of resource endings.** 16 to 22 Nov, all scripts: `mother-earth`
  27,769 `success`, 3 `clientDisconnected`, 0 errors; 124 `success` under an unnamed script. **No invocation has ended
  for CPU or memory in that week**, so what `status` such an ending carries on this account has not been seen.
- **Would fire (by design, unverified):** any `mother-earth` invocation, scheduled or fetch, whose status is not
  `success` and not `clientDisconnected`. That includes an invocation ended for CPU or memory **if** the dataset
  records it with such a status, which the runbook asks to be shown and which is **not shown**.
- **Would not fire:** a missed hourly inspection (nothing on Cloudflare knows about it); a picture run that fails at
  EUMETSAT or is refused by validation (those invocations end `ok`; they are found by reading the run lines);
  a wrong result from a successful run; the dashboard tab being closed.
- **Not demonstrated either way:** triggers that stop arriving. Whether an ungrouped `count()` over no matching rows
  returns a numeric zero or no row is unresolved, and Cloudflare's no-rows rule alone does not answer it. Monitor A is
  not designed for this case; a monitor for it is left out for now (section 4).
- **One-minute checking is not one-minute detection.** A row must first arrive in the dataset. The delay between an
  invocation and its row is not stated on the Monitors page and has not been measured here. Hence the lookback in
  section 4 and the timing recorded in section 5.
- **CPU and memory endings:** Cloudflare's limits page documents the invocation outcomes `exceededCpu` and
  `exceededMemory`, shown in the dashboard as "Exceeded CPU Time Limits" and "Exceeded Memory" and in analytics as
  those outcomes. What is open is whether **this dataset, this query and this notification chain** catch them.
- **Unknown:** the delay between an invocation and its row being evaluated; whether "adaptive sampling" can drop a
  single failing row at this volume (about 4,000 invocations a day); whether a `count()` over no matching rows returns
  a zero row or no row.
- A health URL answering 503 by design is **not** an invocation failure (status `success`), so it would not fire this.

## 4. Proposed configuration (NOT created)

**Monitor A — "mother-earth: an invocation did not end successfully"**

| Setting | Value |
|---|---|
| Type | Threshold |
| Dataset | Workers Invocations (`events.workersInvocations`), Custom SQL, **manual time range** |
| Query | `SELECT count() AS "value" FROM "events"."workersInvocations" WHERE "accountTag" = '<account>' AND "scriptName" = 'mother-earth' AND "status" NOT IN ('success', 'clientDisconnected') AND <time column> >= NOW() - INTERVAL '15' MINUTE` |
| Trigger when | value > 0 |
| Run every | 1 minute |
| Repeat notification after | 1h |
| Destination | Email, one recipient: Chad's own address, typed by him; not written in the repo |

- **Why a 15-minute rolling lookback evaluated every minute.** In automatic mode Cloudflare supplies "a time range
  ending at the evaluation time and spanning the execution interval", so a one-minute monitor looks only at the last
  minute and would miss a row that arrives later than that. A manual relative range looks back 15 minutes on every
  evaluation, so a single failure is seen once its row arrives, provided it arrives within 15 minutes. The docs'
  own example of a manual range is `timestamp >= NOW() - INTERVAL '5' MINUTE`.
- **Consequence:** one failure keeps the condition true for up to about 15 minutes of evaluations. The repeat
  interval of 1h is what limits the emails; how many emails one failure produces is recorded in the test.
- **Corrected from rev 1:** rev 1 said a longer averaging period "would dilute a single failure below the threshold".
  That was wrong for a threshold of greater than 0: a positive count averaged with zeros is still above zero. The
  docs say only that the evaluation window "sets the data window for each evaluation" and do not say whether results
  are averaged or summed. Rev 2 does not rely on either: the query itself counts over the lookback.
- **Not yet confirmed, and confirmed in the form's preview before anything is saved:** the SQL column names
  (`scriptName`, `status` are taken from the GraphQL schema of the same data; the time column's name is not known);
  that a manual range is accepted with a one-minute interval; that the preview returns a numeric 0 for the hub now.
  If the preview refuses the query, nothing is saved and the difference is reported.
- **Sampling stays open.** The dataset is adaptively sampled; the SQL API "automatically applies sample weights to
  COUNT, SUM, and AVG". Whether a single failing row can be dropped at this account's volume (about 4,000 invocations
  a day) is not established and the tests below cannot prove it never happens.
- The list of harmless statuses is deliberately short: an unknown status fires.

**Why not Issues:** it needs a setting changed on the hub Worker itself, its coverage of resource endings and
scheduled runs is not documented, and its documented destinations do not include email.

**Stopped-trigger monitor: left out for now.** Not demonstrated either way (section 3).

## 5. Bounded test plan (NOT run)

Nothing here touches `mother-earth`: no deploy, no setting, no request to it, no log line added to it.

**Objects created, all temporary, all deleted at the end and read back gone:**

- one Worker `mother-earth-alarmtest`: no bindings, no secrets, no custom route; reached at its workers.dev address;
  code is three small handlers (below) and nothing else;
- one monitor "TEST alarmtest, delete": **Monitor A's query and settings exactly, with the script name
  `mother-earth-alarmtest`**, email to Chad.

| Leg | What is done, once | What a received email shows | What it does not show |
|---|---|---|---|
| T-cpu | one HTTP request to a handler that computes until Cloudflare ends it for CPU | this dataset, query shape and notification chain catch a **CPU** ending of a **fetch** invocation; the email reaches Chad; one observed delay | memory endings; scheduled invocations; anything about `mother-earth` itself |
| T-mem (optional) | one HTTP request to a handler that allocates until ended for memory | the same for a **memory** ending of a fetch invocation | scheduled invocations |
| T-cron (optional) | a one-minute cron on the test Worker for one firing of the CPU handler, then the cron removed | the same for a CPU ending of a **scheduled** invocation | memory endings of scheduled invocations |

- Before each leg: the test monitor's condition is false (read). After each leg: the invocation's record is read
  (outcome as Cloudflare records it; expected `exceededCpu` or `exceededMemory`), the dataset row's status label is
  read, and **Chad says when the email reached his phone**. Each delay is recorded as **one observation, not a
  promised response time.**
- Legs are at least 20 minutes apart so the 15-minute lookback has cleared and each email belongs to one leg. If the
  repeat interval suppresses a later leg's email, that is recorded and the leg is rerun once after the alert has
  resolved; it is not explained away.
- A leg that produces no email within 30 minutes is a **finding**: the configuration is not created as Monitor A
  until it is understood.
- A separate delivery-only test (a certainly-true condition on the hub's own invocations) is not needed if T-cpu is
  run, since T-cpu's email shows delivery. If only delivery is wanted, that smaller test is the alternative.
- **Cost of the tests:** T-cpu and T-cron each burn up to the default CPU limit of 30 s (30,000 CPU-ms of the 30
  million included; the limits page does not say the limit can be set lower, so the default is assumed). A few
  invocations and log events on the test script. No charge expected; the usage page is read before and after.
- **Then, and only if the legs run are clean:** Monitor A is created with the script name `mother-earth`, read back,
  and its preview recorded. The Stage D package then says exactly which of CPU, memory, fetch and scheduled were
  shown and which were not.

Test Worker code, complete (to be committed on the branch and hash-checked before upload):

    export default {
      async fetch(req) {
        const p = new URL(req.url).pathname;
        if (p === '/cpu') { let x = 0; for (;;) { x += Math.sqrt(x + 1); } }
        if (p === '/mem') { const a = []; for (;;) { a.push(new Uint8Array(8 * 1024 * 1024).fill(1)); } }
        return new Response('mother-earth-alarmtest: nothing to see', { status: 200 });
      },
      async scheduled() { let x = 0; for (;;) { x += Math.sqrt(x + 1); } },
    };

## 6. Cost

- Monitor and email: no charge found (section 2), with the beta caveat.
- The tests add no hub invocations and no hub log lines; see section 5 for their own small cost.
- **From 1 December 2026 the Paid allowances for ingestion (50 GB) and storage (10 GB-month) are separate, each with
  its own overage charge** (US$0.25 per GB ingested; US$0.10 per GB-month stored). The usage below is well under both.
- **Observability usage, read 14:53:49 UTC (Observability, Usage page), cycle 30 Oct to 29 Nov, day 24 of 31:** Workers
  Logs 125.5k events, 0.60 GB ingested (included from 1 Dec: 50 GB), 0.13 GB-month stored (included: 10), average event
  4.8 kB, estimated bill US$0.00 so far and projected. Against today's rule: 125.5k of 20 million events. **This is
  the figure reported missing in the Stage C result; it is one later reading, not a start-and-end pair, and it cannot
  establish Stage C's incremental cost.**
  Stage D's about 600 extra log lines are small against either allowance.

## 7. What an alarm would and would not change for Stage D

It would add a signal that does not depend on Claude's hourly inspection or on the dashboard tab, for one class of
failure. It reaches Chad only when he sees the email, so between 22:00 and 06:00 SAST the exposure of D8 is the same
unless his phone alerts on that email. It cannot pause anything. It does not replace the rehearsal and cannot detect
a missed inspection.

## 8. Asked of Chad

1. Monitor A as configured in section 4: yes, no, or changes.
2. Which test legs: T-cpu alone, or with T-mem, or with T-mem and T-cron (recommended: all three, since they are what
   the alarm is for and each is one invocation of a throwaway Worker).
3. The stopped-trigger monitor stays out.

Creating anything is an account change on his own line. Suggested wording, to be adjusted to his choice of legs:

`Approve: create the temporary Worker mother-earth-alarmtest (no bindings, no routes) and the temporary Cloudflare
monitor "TEST alarmtest, delete" as in section 5 of reviews/2026-11-22-earth-from-space-alarm-assessment.md rev 2; run
test legs T-cpu, T-mem and T-cron once each; delete the test Worker and test monitor; then, only if the legs are
clean, create the monitor "mother-earth: an invocation did not end successfully" as in section 4, email to my address
typed by me; no change to the mother-earth Worker; EARTHVIEW_ENABLED stays manual`

This is additional warning coverage only. It does not change the overnight exposure, replace the rehearsal, or clear
Stage D.

## 9. Review points of 22 Nov and what changed in rev 2

| Point | Change |
|---|---|
| One-minute check is not one-minute detection; automatic window spans only the interval; sampling open | Section 3 says so; section 4 uses a manual 15-minute lookback evaluated each minute; sampling stated as open |
| The averaging explanation was mathematically wrong | Corrected in section 4; the design no longer depends on averaging |
| Delivery test: record the delay as one observation | Section 5 |
| Throwaway CPU test proves CPU coverage only; memory and scheduled are separate | Section 5 has three legs, each with what it shows and does not show |
| Stopped-trigger monitor out; "would not catch" becomes "not demonstrated" | Sections 3 and 4 |
| Cost: keep ingestion and storage separate; the later reading cannot establish Stage C's incremental cost | Section 6 |

## 10. First attempt under Chad's Approve line: STOPPED before any monitor or test leg (22 Nov 2026 15:14 UTC, clock reading)

Chad's line (his own message, 22 Nov): create the test Worker and test monitor, run T-cpu, T-mem and T-cron, delete
both, then create Monitor A only if the legs are clean. **Done: the test Worker only. Not done: any monitor, any test
leg, Monitor A.** Stopped under section 4's own rule ("if the preview refuses the query, nothing is saved and the
difference is reported") and because of a second finding that would have made the test legs meaningless.

**What exists now**

- Worker `mother-earth-alarmtest`, created 15:08:51 UTC from `phase1/alarmtest/worker.js` at branch commit `cb1fafe`
  (627 bytes, sha256 `9ea8f9352189ca7435a6cef05fb664331b3a25022739e1a468ba6294fcb942d1`, read back equal). 0 bindings, no
  cron, no route. Its workers.dev address was switched on at 15:09:00 and **switched off again at 15:13:57** so the
  `/cpu` and `/mem` paths are not reachable while the test is on hold. It was invoked twice, both on `/`
  (15:09:16 and 15:09:39, outcome ok, CPU 0 ms). `/cpu`, `/mem` and the cron were never used.
- No monitor. Notification policies read back 15:13:57: the budget alert only.
- `mother-earth`: 25 bindings, `EARTHVIEW_ENABLED` `manual`, unchanged.

**Finding 1: the dashboard's form rejects the approved query.** The form rewrites custom SQL before running it,
wrapping each condition in brackets, so the time condition becomes `("timestamp" >= (NOW() - INTERVAL '15' MINUTE))`.
The SQL API answers that form with `422 Input was invalid: recursion limit exceeded`. The same query without the
added brackets runs (HTTP 200) when sent to the SQL API directly. So a manual relative time range cannot be saved in
working order through the form as it is today. (The time column is `timestamp`, not `datetime`.)

**Finding 2: a new Worker's rows are not recorded under its name.** Three to four minutes after the test Worker's
two invocations, the dataset held no row with `scriptName` `mother-earth-alarmtest`; it held 2 rows for the same
period under `scriptName` `__unknown__`. (The week's 124 `__unknown__` rows are probably the deleted Stage A probe;
not established.) A test monitor filtering on the test Worker's name would therefore never fire, and a silent test
would have been indistinguishable from "the alarm does not work". Whether the name appears after some longer delay
has not been observed.

**Read on the way, by read-only queries to the SQL API (15:10 to 15:13 UTC)**

- Columns confirmed from the dataset's own listing: `scriptName`, `status`, `timestamp`, `invocationType` (fetch,
  cron, …), `cpuTimeUs`, `memoryUsageBytes`, `sampleInterval`, `httpResponseStatus`.
- **An ungrouped `count()` with nothing matching returns one row with the number 0**, not an empty result. That
  settles the SQL half of the stopped-trigger question; how a monitor treats a 0 is still not demonstrated.
- **Hub rows arrive quickly:** at 15:13:35 the newest `mother-earth` row was stamped 15:13:05. One observation.
- **Sampling is real on this account.** Today to 15:00: 2,260 hub rows with `sampleInterval` 1, 54 with 2 and 10 with
  10. The rows above 1 fall where several requests arrived in the same second (for example the eight health reads
  Claude fired together at 07:31:02, 08:01:09 and 11:38:06). **So one failing invocation inside such a burst could be
  left out of the dataset, and no monitor on this dataset can be promised to see every failure.** Scheduled ticks are
  spaced out and were not seen sampled, which is not a guarantee.
- **The Stage C run has its own row:** `timestamp` 2026-11-22 11:51:11, fetch, status success, `cpuTimeUs` 536,696,
  `memoryUsageBytes` 55,476,085, one full garbage collection (52,430 µs), `sampleInterval` 1. The dataset describes
  `memoryUsageBytes` as "V8 isolate memory usage at the end of the invocation". **So the 55.48 MB belongs to the
  run's own row, not merely to a two-request minute bucket; it is still the isolate's memory at the end of the
  invocation, not a peak and not a headroom bound.**

**Options for Chad (none taken)**

1. **Form-native window:** no time condition in the SQL; let the form supply the range and set its "Average over"
   to 15m with "greater than 0", run every minute. It saves through the form. Whether that window re-reads the last
   15 minutes or only averages past one-minute results is not documented; the test would show it.
2. **Create through the API with the unbracketed query.** Keeps the approved query exactly. It is the same signed-in
   dashboard session, but not the form, and the policy fields for a monitor are not documented for hand use.
3. For the test legs, either wait and see whether the test Worker's name appears in the dataset, or point the test
   monitor at `scriptName` `__unknown__` (it would also see any other unnamed script's rows), or test delivery only
   with a certainly-true condition on the hub's own rows and record coverage of CPU and memory endings as untested.
4. Stop here: delete the test Worker, create nothing, and write "no alarm; reasons in section 10" into the Stage D
   package.

## 11. Review of the stop, and one later naming check (22 Nov 2026 15:19 UTC, clock reading)

Review relayed by Chad in the thread (22 Nov): stopping was right; **do not continue with `__unknown__`**; keep the
test Worker's address off; make one later read-only check for its proper name without more traffic; if naming
resolves, bring back a revised form-native test plan with the window limitation stated; if not, stop the
resource-test route; delivery-only testing stays an option with CPU, memory and scheduled coverage recorded as
untested; avoid the undocumented API route for this trial; fix the opening wording (done above).

**Corrections accepted**

- Section 10's option 3 suggested pointing the test at `__unknown__`, and Claude told Chad the test Worker was "the
  only thing that would produce unnamed rows". **That was wrong on this document's own evidence** (124 unnamed rows
  earlier in the week). Withdrawn. An email from such a monitor would have needed correlating with the failure's
  timestamp, invocation type and outcome before it counted as evidence.
- **One successful test cannot tell the two window behaviours apart.** A rolling 15-minute read and an average of
  earlier one-minute results would both catch an ordinary failure whose row arrives promptly. A form-native test can
  show delivery and detection in that test; it cannot show protection against late-arriving rows.
- **Sampling makes any monitor on this dataset supplementary warning coverage.** Even three clean legs would not
  establish that every future failure produces an email.

**Naming check, read-only, 15:18:54 UTC (about nine minutes after the test Worker's two invocations; no new traffic:
its invocation records still show only 15:09:16 and 15:09:39, and its address is off)**

- Rows with `scriptName` `mother-earth-alarmtest` since 15:00: **none**.
- Rows with `scriptName` `__unknown__` today: exactly two, fetch, success, at 15:09:16 and 15:09:39, both with script
  version `b6c8e9b2-c273-4586-a92b-eb162578b2b2`. They match the test Worker's two invocations to the second.
- Unnamed rows 15 to 22 Nov by day: 16 Nov 10 fetch; 20 Nov 87 cron and 2 fetch; 21 Nov 25 cron; 22 Nov the 2 above.
  **The 20 and 21 Nov rows fit the Stage A probe Worker (created 20 Nov, cron-driven, deleted 21 Nov); if they are
  its rows, a Worker that lived for more than twelve hours was never recorded under its name, or lost it on
  deletion. Which of the two is not established. The 16 Nov rows are unexplained.**
- This was an early read, not the "later" one asked for. **One more read is scheduled for about two hours after
  creation; it is the last.** If the name has not appeared, the resource-test route stops and the test Worker is
  deleted under the existing approval's "delete the test Worker".

**The Stage C row:** the attribution of 55.48 MB rests on the row's `timestamp` 11:51:11, type fetch and
`cpuTimeUs` 536,696 matching the run's invocation record (11:51:11.167 start, CPU 536 ms). On that correlation it is
the isolate's memory at the end of that invocation. It establishes neither peak memory nor headroom.

**Where this leaves the alarm:** the assessment has exposed limits; **it has not established a dependable alarm.**
Stage C is unaffected.

## 12. Final naming check: the name HAS appeared. Nothing tested, nothing deleted (22 Nov 2026 17:11 UTC, clock reading)

Read-only, 17:10:43 UTC, two hours after the test Worker was created. No traffic was generated: the test Worker's
invocation records still show only 15:09:16 and 15:09:39, its address is off, it has no cron.

- Rows with `scriptName` `mother-earth-alarmtest` since 15:00: **two**, fetch, success, at 15:09:16 and 15:09:39.
- Rows with `scriptName` `__unknown__` today: **none**. The two rows that were unnamed at 15:18 are now under the
  Worker's name.
- So **a new Worker's rows are first recorded as `__unknown__` and are given its name later: after more than 9
  minutes and within 2 hours** (two readings; the moment is not known). Whether a row written *now*, with the name
  already known, is named at once is **not established**. The Stage A probe's rows being unnamed today is then more
  likely an effect of its deletion; also not established.
- Scripts on the account: `mother-earth`, `mother-earth-alarmtest`. Notification policies: the budget alert only.

By the agreed rule: **no test was run and the Worker was not deleted.** A revised form-native plan follows for Chad's
decision. Nothing in it is approved.

### 12.1 Revised test plan, form-native (NOT approved, NOT run)

**Test monitor "TEST alarmtest, delete"** (Cloudflare dashboard form, Threshold, Custom SQL, automatic time range):

| Setting | Value |
|---|---|
| Query | `SELECT count() AS "value" FROM "events"."workersInvocations" WHERE "scriptName" = 'mother-earth-alarmtest' AND "status" NOT IN ('success', 'clientDisconnected')` (no time condition; the form supplies the range) |
| Trigger when | Query result > 0 |
| Average over | 15m |
| Run every | Automatic (one minute for this dataset) |
| Repeat notification after | 1h |
| Destination | Email, Chad's address, typed by him |

Saved only if the form's preview runs without error and shows 0.

**Steps**

0. **Naming pre-check (no failure):** switch the address on; one request to `/`; read when its row appears and under
   which name. **If it is `__unknown__`, stop: the legs would be invisible to the monitor.** One observation of row
   delay.
1. **T-cpu**, 2. **T-mem**, 3. **T-cron**, as in section 5, each once, at least 20 minutes apart, the address switched
   off between and after.
4. For each leg, **an email counts as evidence only when correlated with the failure's own row**: its `timestamp`,
   `invocationType` (fetch or cron) and `status` label, and the invocation record's outcome (`exceededCpu` or
   `exceededMemory`). Chad reports when each email reached his phone. Each delay is one observation.
5. Delete the test monitor and the test Worker; read back that only `mother-earth` and the budget alert remain.
6. Only if every leg run is clean: create the hub monitor with the same settings and `scriptName` `mother-earth`.

**What a clean run would show:** that this dataset, this query shape and this notification chain produced an email
for a CPU ending and a memory ending of a fetch invocation and a CPU ending of a scheduled invocation, on a
different Worker, when the row arrived promptly.

**What it cannot show, however clean:**

- **Which window behaviour the form uses.** A rolling 15-minute read and an average of earlier one-minute results
  would both catch a failure whose row arrives promptly. So it shows **no protection against a late-arriving row.**
- **That every failure produces an email.** The dataset is sampled; a failure inside a burst of same-second requests
  can be left out. **This is supplementary warning coverage, not a dependable alarm.**
- Anything about `mother-earth` directly: the hub monitor is the same query with another name, an inference.
- A missed inspection, a source failure, a validation refusal, stopped triggers.

**Cost and time:** as section 5 (two CPU legs of up to 30 s each; a handful of invocations). About an hour and a half
with Chad at the Mac to type his address into the form twice and to confirm three emails from his phone.

**Alternatives still open:** a delivery-only test against the hub's own rows (CPU, memory and scheduled coverage
recorded as untested); or stop, delete the test Worker, and record "no alarm" for Stage D with these reasons.
