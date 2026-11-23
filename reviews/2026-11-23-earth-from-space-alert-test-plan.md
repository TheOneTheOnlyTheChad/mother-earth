# Earth from Space — the fixture alert test (monitoring proposal 9.5, decision M6): plan rev 1.1, NOT built, NOT approved

**Rev 1.1, 23 Nov 2026 19:40 UTC (clock reading): brought up to date, nothing else changed.** The hub is now 0.6.24 and
its file is on main, so the fixture copies the health code from main, not from `566a11b`. **The throwaway Worker is
not the hub: `docs/HUB-DEPLOY-RULE.md` does not cover it, and creating it still needs Chad's own line as section 10
says.** GPT had not yet reviewed rev 1; this is the version to review.

23 Nov 2026, 15:16 UTC (clock reading). Written on Chad's go of 23 Nov for docs work ("1.", choosing the docs first).
**Docs only. Nothing here is built, created, deployed or scheduled.** For GPT's review, then Chad.

Basis: `docs/concepts/EARTH-FROM-SPACE-INDEPENDENT-MONITORING-PROPOSAL.md` rev 3.1, section 9 test 5, and Chad's
"M1 to M8 yes" (section 11 there). Hub 0.6.24 is live with the two health addresses (0.6.23 at the time of rev 1); both answer 200
`no trial configured`. The two real monitors do not exist yet.

## 0. In short

- A **throwaway Worker**, separate from the hub, holds the hub's health code **byte for byte** and a fixed set of
  made-up run records. It answers a real 200, then a real 503, then 200 again, **by the clock, with nobody
  touching it**.
- **Two temporary UptimeRobot monitors** point at it. Chad's phone and email should get four messages over about
  three hours: runs down, runs up, trial down, trial up.
- The Mac is closed for the middle of it. Afterwards everything temporary is deleted and read back.
- **The hub is not touched.** No setting, no deploy, no collection, no request to EUMETSAT, no key.
- Chad is needed at the Mac for about 30 minutes before and about 20 minutes after. In between he only needs his
  phone with him.

## 1. What this test can show, and what it cannot

| It can show (on that day, once) | It cannot show |
|---|---|
| UptimeRobot treats a 503 from the production health code's own answer (HEAD, same headers) as Down | That the **two real monitors** are wired correctly. They are read back when created (test 3) |
| A Down alert reaches Chad's phone and his email, and how long each took | Delivery at night, on another day, or with the phone off |
| A recovery message follows when the address answers 200 again | That an alert is **acted on**. Sent is not acted on (proposal section 12, point 4) |
| Roughly how many failed polls open an incident (from the poll log against the incident's start) | The hub's own route, its D1 read, or real run records |
| CPU of the production evaluation over a full 288-slot trial, in the Workers runtime | **D1 rows read.** The fixture has no database (section 7) |
| That one monitor going Down does not disturb the other | c6 and c8 live. Only a storage stop is exercised here; the offline suite covers the rest |

**"No delay, no repeat" is part of what is being tested:** each Down is announced once. If it is missed, nothing
reminds.

## 2. The throwaway Worker

- **Name:** `mother-earth-evhtest`. **No bindings of any kind**: no D1, no R2, no variables, no secrets, no cron,
  no custom route. It cannot reach the hub's data.
- **Its `workers.dev` address is ON.** UptimeRobot must be able to reach it. (This differs from the alarm test
  Worker of 22 Nov, whose address stayed off.) The address is public for the life of the test; it answers the two
  health paths and 404 for everything else, and holds nothing secret.
- **Logs on** for this Worker, sampling 100%, so every poll is on record with its time, method, status and CPU.
  If the dashboard will not show its logs on the day, that is recorded and UptimeRobot's own log is the only poll
  record (section 6).

### 2.1 What is production code and what is fixture

| Part | Source |
|---|---|
| `EVH`, `EVH_POST_CHECK`, `EVH_FETCH_FAIL`, `evhKind`, `evhConfig`, `evhEvaluate`, `evhSafe`, `healthEvRuns`, `healthEvTrial`, `health`, and what they use (`EV_STOP`, `EV_WINDOW_MAX_MS`, `evMark`, `HEALTH_SKEW_MS`, `healthNote`, `redactText`, `CORS`, `json`, `COLLECTOR_VERSION`) | **Copied byte for byte** from `phase1/worker.js` on main (the deployed 0.6.24, sha256 `db4f9cdf…1aa5`, on main since landing `7adef36`; the health code is byte for byte what 0.6.23 had, and `COLLECTOR_VERSION`, which the answer reports, is now `0.6.24`) by a build script. The script fails if any copied span differs from the source |
| `HEALTH.checks` | Only the two entries used: `runs: ['earthview']`, `trial: ['earthview']`. **Fixture, stated** |
| The `env` handed to the health code | **Fixture.** Before the simulated closeout: gate `1`, `EARTHVIEW_FROM`, `EARTHVIEW_UNTIL`. From the simulated closeout on: gate `manual`, no window. Decided by the clock |
| `env.DB` | **Fixture.** A stand-in that answers the production query from made-up rows held in the script. It applies the query's own bounds (layer, `finished_at` range, order, limit) and **one rule of its own: a row is returned only once the clock has reached its `finished_at`.** That is how a "late" row arrives with nobody touching anything |
| The router | **Fixture.** `GET` or `HEAD` on `/health/<check>/<layer>` goes to the production `health`; anything else is 404 |

**Stated plainly: the closeout and the arrival of rows are simulated by the fixture's clock rules.** The verdicts,
status codes, headers and bodies come from the production functions.

### 2.2 The made-up trial

`T0` is a ten-minute mark, set in Chad's Approve line. The build script takes `T0` and writes the Worker file; the
file's sha256 is quoted in the same line.

- `FROM` = `T0` − 44 h. `UNTIL` = `T0` + 4 h. **288 slots**, so each evaluation is the size of a real one near the
  end of a trial.
- Every slot has one good row (`ok`, `nothing newer: …`) finished 15 s after its mark, **except two:**

| Slot | Its row | Effect, from the production rules |
|---|---|---|
| **A** = `T0` + 30 min | one good row, but **finished at `T0` + 100 min** | `runs` is **503 `completion_missing` from `T0` + 50 min** (the slot becomes due) **to `T0` + 100 min** (its row arrives), then 200. `trial` unaffected |
| **B** = `T0` + 120 min | one `down` row, `storage busy`, finished 15 s after its mark | `trial` is **503 `storage_stop` from `T0` + 120 min 15 s**, and stays so. `runs` unaffected (the slot has its row) |

- **Simulated closeout at `T0` + 170 min:** the window is gone, both addresses answer 200 `no trial configured`.
  `trial` recovers. Nothing after that changes.

| Clock | `runs` | `trial` | Expected message |
|---|---|---|---|
| before `T0` + 50 | 200 `active` | 200 | none |
| `T0` + 50 to `T0` + 100 | **503** | 200 | **1. runs Down** |
| `T0` + 100 to `T0` + 120 | 200 | 200 | **2. runs Up** |
| `T0` + 120 to `T0` + 170 | 200 | **503** | **3. trial Down** |
| from `T0` + 170 | 200 | 200 | **4. trial Up** |

Each 503 lasts 50 minutes: about ten polls at five minutes.

### 2.3 Its own offline suite (branch work, before any line is asked for)

1. Every copied span equals the source: `phase1/worker.js` on main, which `phase1/hub-alignment.test.mjs` holds to
   the recorded deployed hash. A changed byte fails the build. If the hub is deployed again before the test, the
   fixture is rebuilt from the new file and its hash re-quoted.
2. With a controlled clock, the Worker's own `fetch` gives the table of 2.2 at each boundary: one millisecond
   before and at `T0` + 50, `T0` + 100, `T0` + 120 min 15 s, `T0` + 170.
3. `HEAD` and `GET` give the same status and headers; every answer is `no-store`; unknown paths are 404.
4. The Worker makes no outbound request and reads no binding (asserted with spies).
5. Two `T0` values a day apart give files that differ only in the `T0` line.
6. Deliberate breaks of the fixture's own rules (arrival rule off; closeout never; wrong slot), each caught.

## 3. The two temporary monitors

"TEST evh runs DELETE" → `https://<the test Worker's address>/health/runs/earthview`
"TEST evh trial DELETE" → `https://<the test Worker's address>/health/trial/earthview`

Set as the existing eight are (proposal section 12): HTTP, 5-minute interval, 30-second timeout, E-mail and iPhone
push both selected, "no delay, no repeat". Both read back from the account after creation.

They add 2 to the account's 8 (Free plan allows 50).

## 4. The day

All with the UptimeRobot and Cloudflare tabs **displayed in the browser pane** while Claude acts, and each action
read back in that system before it is reported.

| When | Who | What |
|---|---|---|
| by `T0` − 45 min | **Chad at the Mac**, Claude acting | Create the Worker from the reviewed file (hash checked before and after upload); turn its address on; read back: code hash, no bindings, no cron, address answers 200 on both paths, 404 elsewhere |
| by `T0` − 30 min | Chad at the Mac, Claude acting | Create the two monitors; read back their settings |
| `T0` − 30 to `T0` − 5 | Claude | Readiness: both monitors show **Up** with at least two successful checks; the Worker's log shows UptimeRobot's polls arriving. **If readiness is not complete by `T0` the test does not run:** everything temporary is deleted, the reason is reported, and `T0` is not moved without Chad |
| `T0` | Chad | **Closes the Mac** (or leaves it; the test does not need it). Phone with him, sound on |
| `T0` + 50 to `T0` + 180 | Chad, phone only | For each of the four messages: **a screenshot of the phone when he sees it.** Nothing else. No reply needed |
| from `T0` + 180 | **Chad back at the Mac** | Tells Claude; shares the four screenshots and the four emails' received times |
| then | Claude | Reads and saves: each monitor's log and incidents from UptimeRobot; the Worker's request log (time, method, status, CPU of every request); then cleanup (section 5) |

**The whole test lies between 08:00 and 18:00 SAST.** A `T0` of 10:00 SAST puts the four messages at roughly
10:55, 11:45, 12:05 and 12:55, and Chad back at 13:00.

**What a screenshot proves.** Its own time is when Chad saw the message. The push arrived at or before that. If
the phone shows the arrival time itself, that is recorded too. **UptimeRobot's "sent" time is never used in place
of a received time.** If a message was not seen until later, that is recorded as it happened.

**If a real hub alert arrives during the test,** it is a real alert and is handled as one. The test monitors are
told apart by their names.

**Nothing is retried.** A leg that did not happen is recorded as not having happened. A repeat is a new line.

## 5. Cleanup, same day

1. Save each test monitor's log and incident list (deleting a monitor removes its history).
2. Delete both test monitors; read back: the account lists the eight (or ten, if the real two exist by then), none
   named TEST.
3. Save the Worker's request log.
4. Delete the Worker; read back: it is not in the account's list; its address no longer answers as the fixture.
5. The hub: one read to show nothing changed (deployed hash, gate `manual`, no window, bindings, crons).

## 6. Result rule

Three verdicts, kept apart. **Not met takes precedence. Missing evidence is incomplete, never a pass.**

**A. Did UptimeRobot see it?** (from UptimeRobot's log and the Worker's request log)
- **Met:** each monitor has exactly one incident; the runs incident starts after `T0` + 50 and ends after
  `T0` + 100; the trial incident starts after `T0` + 120 and ends after `T0` + 170; neither monitor has an
  incident during the other's.
- **Not met:** a 503 phase with no incident; or an incident on the wrong monitor or in a 200 phase.
- **Incomplete:** the logs could not be read.

**B. Did it reach Chad?** (from his screenshots and mailbox)
- **Met:** both Down messages arrived by push **and** by email before that monitor's recovery.
- **Partly met:** both Down messages arrived, but on one channel only. The missing channel is named and goes into
  the Stage D basis as unreliable.
- **Not met:** a Down message arrived on neither channel before its recovery.
- Recovery messages are recorded; their absence is a finding, not a failure of B.

**C. How long?** One observation each, never a bound: 503 onset → first failing poll → incident opened → push
seen → email received. **Expectation written down beforehand: a Down alert within 15 minutes of onset.** Over 15
minutes is recorded as a finding; over 30 minutes changes the "roughly 25 to 30 minutes" estimate in proposal
section 5 and is carried into the Stage D basis.

**Also recorded:** how many failed polls preceded each incident; CPU per request of the 288-slot evaluation (every
poll's figure, with minimum, median, maximum); anything requested by anyone other than UptimeRobot.

**A met result shows that this path worked on that day. It does not clear Stage D.**

## 7. D1 rows read: what this test does not measure, and the choice

The handover expected this test to measure "D1 rows read and CPU for a real trial evaluation". **With no bindings
it measures CPU only.** The CPU figure includes the stand-in's own filtering and sorting, which on the hub is D1's
work, so it overstates the hub's CPU if anything.

What is already known about rows read: the query is bounded to 2,000 rows by its `LIMIT`; the offline suite (case
R7) shows SQLite answers it through the `(layer, finished_at)` index without a scan; a real trial holds about 288
rows. Two addresses polled every five minutes is 576 requests a day, so about 166,000 rows read a day at 288 rows,
and at most about 1.15 million a day at the limit.

| Option | What it adds | What it costs |
|---|---|---|
| **R-a (proposed): keep the test with no bindings.** Rows read is measured on the hub at the start of Stage D, from the first polls in state `active`, and is a named read in the runbook | Nothing new to create | The first real figure arrives inside the trial, when it is small (few rows yet) |
| R-b: give the test Worker its own throwaway D1 database, loaded with the fixture rows through `phase1/schema.sql` | A real D1 read of a full-size trial before Stage D | One more thing to create and delete; departs from "no bindings" in proposal 9.5; needs the plan revised and re-reviewed |

## 8. The generic delivery test (proposal 9.4)

The fixture test delivers a real Down alert to the same contacts, so it gives the delivery evidence 9.4 was for,
and more. **Proposed: if this test runs, 9.4 is not run separately.** If this test is not run, 9.4 stands as the
smaller alternative. Chad's call (T2 below).

## 9. Cost and exposure

- **Money:** none expected. A Worker with no bindings answering about 150 requests; two monitors for a few hours.
- **The hub:** untouched.
- **Public:** the test address is reachable by anyone for a few hours and says only what the fixture says.
- **Phone:** four messages on one day, and the same four by email.

## 10. Approval lines (sketches, not requests)

The build of the fixture Worker and its suite on the branch is covered by Chad's go. The live test needs his own
line, with the values filled in at the time:

`Approve: Earth from Space fixture alert test under plan rev <n>: create the Worker mother-earth-evhtest from
<file> sha256 <hash> with no bindings and its workers.dev address on, T0 <UTC time>; create the UptimeRobot
monitors "TEST evh runs DELETE" and "TEST evh trial DELETE" on its two health addresses, set as the existing
eight; I record the four messages on my phone; then delete both monitors and the Worker and read back; no change
to the mother-earth Worker or to any other monitor`

## 11. Decisions for Chad

| # | Question | Claude proposes |
|---|---|---|
| T1 | Run this test before the two real monitors are created, or after? They do not depend on each other | Either. Creating the real two first is a five-minute job and lets the cleanup read back "ten, none named TEST" |
| T2 | Drop the separate generic delivery test (9.4) if this one runs? | Yes |
| T3 | D1 rows read: R-a or R-b (section 7)? | R-a |
| T4 | A day and a `T0` that suit: about 30 minutes at the Mac before, phone with you for three hours, 20 minutes at the Mac after | A weekday `T0` of 10:00 SAST |

## 12. Questions for GPT

- **Q1.** Is the split in 2.1 acceptable: production verdict code byte for byte, with the row arrival and the
  closeout simulated by the fixture's clock?
- **Q2.** Is one overdue slot and one storage stop enough for the live true positive, with c6 and c8 left to the
  offline suite?
- **Q3.** Is the result rule right, in particular "partly met" for one channel and the 15-minute expectation?
- **Q4.** Is one row per slot (288 rows) the right size for the CPU figure, or should a near-limit set (about
  1,900 rows) be measured as well?
- **Q5.** R-a or R-b for rows read?
- **Q6.** Is the screenshot an acceptable receipt record?

## 13. Not checked while writing this

- Whether a new Worker's logs are readable in the dashboard at once (the alarm test of 22 Nov found a new Worker's
  rows recorded as `__unknown__` in a different tool). Checked at readiness; the fallback is in section 2.
- How many failed polls open a UptimeRobot incident. This test is where it is observed.
- UptimeRobot's current Free-plan terms were not re-read today; the figures are those in proposal section 8.
