# Brief from GPT (relayed by Chad), 6 Nov 2026 — monitoring first, then the FIRMS memory design

Verbatim. Context: Claude's problem statement "unattended operation of the FIRMS fires pipeline" (6 Nov, thread 17). Chad's authorisation is in the text: branch work, local tests and documentation only.

---

Bro, let’s prepare **monitoring first, then the full FIRMS memory design**, using **UptimeRobot as the independent monitoring service**.

This authorises branch work, local tests and documentation. No deployments, production writes, schedules, variables, schema changes, account setup or paid services until my explicit go. Keep unrelated work untouched.

1. **Prepare the monitoring change**

Use UptimeRobot Free as the proposed external service: $0/month, five-minute checks, with email and Android push notifications. Document the setup I’ll need to complete; don’t create an account or configure live monitors yet.

Prepare lightweight health endpoints for collection and archiving. They must detect pipeline failure even while the hub still answers HTTP requests. Evaluate actual successful publication and checkpoint completion, rather than simply whether `/status` loads.

Proposed starting conditions:
- No successful FIRMS publication for roughly 45 minutes.
- A resource guard prevents processing.
- A checkpoint remains incomplete two hours after UTC midnight.
- A new archive gap or stale checkpoint coverage is recorded.
- The hub or health endpoint becomes unreachable.

Review those thresholds against the existing schedules and distinguish collection freshness from observation age and source latency.

Keep checks inexpensive, read-only and uncached or explicitly protected against stale cached responses. Unreadable health data must not produce a healthy result. Expose enough information to explain a failure without exposing credentials or administrative access.

Use separate monitors where necessary so an existing incident cannot hide a new collection or archive failure. Document how historical incidents remain visible without causing permanent alerts or being silently erased.

Prefer incident-open and recovery notifications over “one message per condition per day.” Do not make hub-side email a prerequisite: the external monitor must still detect a stopped hub.

Test stopped scheduling, failed publication, overdue checkpoint, unreadable health data and recovery. Prepare a notification acceptance test for the later approved setup, including receipt on my phone while the Mac is closed.

2. **Prepare the complete memory design next**

Do not implement a parser rewrite yet. First document memory use across fetching, raw storage, parsing, record retention, JSON serialization, publication, checkpointing and concurrent Place/snapshot requests.

Streaming the CSV alone does not establish flat memory if full record arrays and output copies remain resident. Account for backpressure, overlapping runs, retained caches and failure halfway through each stage.

Propose the smallest workable design that:
- Preserves raw-source provenance.
- Publishes completed, validated outputs consistently.
- Keeps the last good publication after failure.
- Supports bounded, idempotent retries of the same retained input.
- Handles checkpointing without reintroducing the same memory problem.
- Preserves current page/API behaviour or identifies any required changes explicitly.

Retain the truncation limitation: a response cut cleanly between valid rows may be undetectable. Record-count changes are anomaly signals, not proof of corruption; legitimate FIRMS removals must remain possible.

Specify verification using the real 5.3 MB file, larger synthetic files, overlapping requests and injected failures. Assert complete outputs and correct contents, not merely process survival. Keep local memory measurements clearly separate from production isolate measurements.

3. **Keep later work separate**

Previous-day closure remains research-first. Historical recoveries using a different input remain reviewed decisions. Bounded retries of the same immutable input can be proposed now, but must not silently rewrite completed archives or extend retention.

Return with the monitoring branch, focused test results, proposed UptimeRobot setup, expected usage/cost, and the full memory design. Name any additional cost before incurring it.

Once reviewed and approved, we’ll configure alerts and prove they work with the Mac closed before retiring routine overnight check-ins.