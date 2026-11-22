# Earth from Space — email alarm assessment (runbook 2a), read-only (22 Nov 2026)

Written 22 Nov 2026 14:54 UTC (clock reading), on Chad's go of 22 Nov: "Go ahead with the read-only email-alarm assessment:
availability, actual detection coverage, delivery options and cost. Show me the proposed configuration before
creating or enabling anything." **Nothing was created, enabled or changed.** One monitor form was opened in the
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
  a wrong result from a successful run; triggers that stop arriving (no rows, no signal); the dashboard tab being
  closed.
- **Unknown:** the delay between an invocation and its row being evaluated; whether "adaptive sampling" can drop a
  single failing row at this volume (about 4,000 invocations a day); whether a `count()` over no matching rows returns
  a zero row or no row.
- A health URL answering 503 by design is **not** an invocation failure (status `success`), so it would not fire this.

## 4. Proposed configuration (NOT created)

**Monitor A — "mother-earth: an invocation did not end successfully"**

| Setting | Value |
|---|---|
| Type | Threshold |
| Dataset | Workers Invocations (`events.workersInvocations`), Custom SQL |
| Query | `SELECT count() AS "value" FROM "events"."workersInvocations" WHERE "accountTag" = '<account>' AND "scriptName" = 'mother-earth' AND "status" NOT IN ('success', 'clientDisconnected')` |
| Trigger when | value > 0, averaged over 1m (a longer average would dilute a single failure below the threshold) |
| Run every | Automatic (the form shows one-minute evaluations for this dataset) |
| Repeat notification after | 1h |
| Destination | Email, one recipient: Chad's own address, typed by him; not written in the repo |

The column names `scriptName` and `status` are taken from the GraphQL schema of the same data and are **not yet
confirmed in the SQL form**; they are confirmed in the form's query preview before saving, and the monitor is not
saved if the preview refuses them. The list of harmless statuses is deliberately short: an unknown status fires.

**Why not Issues:** it needs a setting changed on the hub Worker itself, its coverage of resource endings and
scheduled runs is not documented, and its documented destinations do not include email.

**Optional Monitor B — triggers stopped (not recommended yet):** count of scheduled `mother-earth` invocations over
15 minutes below 1. It may never fire, because of the "no rows, no signal" rule. Only worth creating if a test shows
it fires.

## 5. Delivery test without faulting the hub (NOT run)

- **T1, delivery:** a temporary monitor "TEST, delete" on the same dataset with a condition that is certainly true
  (count of `mother-earth` invocations >= 1). Expect one email. Record its arrival time against the creation time,
  and Chad's confirmation; then delete the monitor and read the list back empty. It reads only Cloudflare's own
  records. **It shows the delivery path and the evaluation delay; it does not show coverage of resource endings.**
- **T2, coverage of resource endings (optional, its own line):** a throwaway Worker with no bindings and no routes,
  made to run past its CPU limit once, with Monitor A's query pointed at that script name. Then delete it. This is the
  only way found to show what the runbook asks; it adds one more short-lived Worker, as Stage A did. Without T2 the
  Stage D package says: **"the alarm's coverage of CPU and memory endings is untested."**

## 6. Cost

- Monitor and email: no charge found (section 2), with the beta caveat.
- T1 adds no hub invocations and no log lines. T2 adds a few invocations on a separate script.
- **Observability usage, read 14:53:49 UTC (Observability, Usage page), cycle 30 Oct to 29 Nov, day 24 of 31:** Workers
  Logs 125.5k events, 0.60 GB ingested (included from 1 Dec: 50 GB), 0.13 GB-month stored (included: 10), average event
  4.8 kB, estimated bill US$0.00 so far and projected. Against today's rule: 125.5k of 20 million events. **This is
  the figure reported missing in the Stage C result; it is one later reading, not a start-and-end pair for Stage C.**
  Stage D's about 600 extra log lines are small against either allowance.

## 7. What an alarm would and would not change for Stage D

It would add a signal that does not depend on Claude's hourly inspection or on the dashboard tab, for one class of
failure. It reaches Chad only when he sees the email, so between 22:00 and 06:00 SAST the exposure of D8 is the same
unless his phone alerts on that email. It cannot pause anything. It does not replace the rehearsal and cannot detect
a missed inspection.

## 8. Asked of Chad

1. Monitor A as configured: yes, no, or changes.
2. T1 (temporary test monitor, then deleted): yes or no.
3. T2 (throwaway Worker to show CPU-ending coverage): yes, or accept "untested" in the Stage D package.
4. Monitor B: leave out (recommended) or test.

Creating anything is an account setting change on his own line. Suggested wording when he has decided:
`Approve: create the Cloudflare monitor "mother-earth: an invocation did not end successfully" as in section 4 of
reviews/2026-11-22-earth-from-space-alarm-assessment.md, email to my address typed by me; run delivery test T1 and
delete the test monitor; no change to the mother-earth Worker`
