# Earth from Space — the fixture alert test (monitoring proposal 9.5, decision M6): plan rev 1.2, NOT built, NOT approved

**Rev 1.2, 24 Nov 2026 02:43 UTC (clock reading): GPT's review of rev 1.1 adopted**
(`EARTH-FROM-SPACE-STAGE-D-DOCS-REVIEW-2026-11-24.md` in GPT's folder on the Mac). Changed: section 1 (what the CPU
figure is); 2.1 (the router); 2.2 (how many rows the polls see; the 120 min 15 s boundary); 2.3 (router cases);
section 6 (the receipt matrix; what closes the Stage D prerequisite; 15 minutes is a target); **section 7 rewritten:
D1 cost is measured before Stage D, in isolation, as its own approved step**; section 8 (the fixture test is
Chad's chosen test, M6); section 10 (**the fixture build is NOT yet authorised: that sentence in rev 1.1 was
wrong**); sections 11 to 13. GPT checked the timeline of 2.2 against the exact Worker and found it behaves as
described. **GPT has not reviewed rev 1.2.**

**Rev 1.1, 23 Nov 2026 19:40 UTC (clock reading): brought up to date, nothing else changed.** The hub is now 0.6.24 and
its file is on main, so the fixture copies the health code from main, not from `566a11b`. **The throwaway Worker is
not the hub: `docs/HUB-DEPLOY-RULE.md` does not cover it, and creating it still needs Chad's own line as section 10
says.** *(Written at rev 1.1, before GPT's review of 24 Nov.)* GPT had not then reviewed rev 1.

23 Nov 2026, 15:16 UTC (clock reading). Written on Chad's go of 23 Nov for docs work ("1.", choosing the docs first).
**Docs only. Nothing here is built, created, deployed or scheduled.** For GPT's review, then Chad.

Basis: `docs/concepts/EARTH-FROM-SPACE-INDEPENDENT-MONITORING-PROPOSAL.md` rev 3.1, section 9 test 5 and section 3.6, and Chad's
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
| **Fixture CPU:** the CPU of each poll's evaluation in the Workers runtime, over the 261 to 281 rows the fixture returns during the test (2.2). Not the hub's CPU, and not a bound on it | **D1 rows read, or the hub's CPU for a completed trial.** The fixture has no database. Section 7 measures those separately |
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
| The router | **Fixture.** Only the two exact paths `/health/runs/earthview` and `/health/trial/earthview`, by `GET` or `HEAD`, go to the production `health`. **Everything else is answered 404 by the router itself and never reaches the copied code**: the copied `health` refers to other layers' handlers, which are not copied, so a general `/health/*` route could throw instead of answering 404 (GPT, 24 Nov) |

**Stated plainly: the closeout and the arrival of rows are simulated by the fixture's clock rules.** The verdicts,
status codes, headers and bodies come from the production functions.

### 2.2 The made-up trial

`T0` is a ten-minute mark, set in Chad's Approve line. The build script takes `T0` and writes the Worker file; the
file's sha256 is quoted in the same line.

- `FROM` = `T0` − 44 h. `UNTIL` = `T0` + 4 h. **288 slots are allocated. The polls do not see 288 completed
  rows:** a row is returned only once the clock has reached it, so the query returns 261 rows at `T0` − 30 min,
  268 at the first Down, 274 at the runs recovery and 281 just before the simulated closeout (GPT's independent
  count, 24 Nov). **This is not a measurement of a completed 288-row trial.** That is section 7's.
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
| `T0` + 100 to `T0` + 120 min 15 s | 200 | 200 | **2. runs Up** |
| `T0` + 120 min 15 s to `T0` + 170 | 200 | **503** | **3. trial Down** |
| from `T0` + 170 | 200 | 200 | **4. trial Up** |

Each 503 lasts 50 minutes: about ten polls at five minutes.

### 2.3 Its own offline suite (branch work, before any line is asked for)

1. Every copied span equals the source: `phase1/worker.js` on main, which `phase1/hub-alignment.test.mjs` holds to
   the recorded deployed hash. A changed byte fails the build. If the hub is deployed again before the test, the
   fixture is rebuilt from the new file and its hash re-quoted.
2. With a controlled clock, the Worker's own `fetch` gives the table of 2.2 at each boundary: one millisecond
   before and at `T0` + 50, `T0` + 100, `T0` + 120 min 15 s, `T0` + 170.
3. `HEAD` and `GET` give the same status and headers; every answer is `no-store`. **The router:** an unknown
   layer (`/health/runs/usgs`), an unknown check (`/health/coverage/earthview`), a trailing or doubled separator,
   a longer path, a query string on a wrong path, and every method other than `GET` and `HEAD` each give 404 (or
   405 for the method, whichever the build fixes and the suite states) **and none throws**.
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

**B. Did it reach Chad?** (from his phone and his mailbox). One matrix, eight cells:

| | Push | Email |
|---|---|---|
| runs Down | | |
| runs recovery | | |
| trial Down | | |
| trial recovery | | |

Each cell is one of: **received**, with the time it was received or seen and which of the two that is; **not
received**, where the phone or mailbox was checked and it is not there; **evidence missing**, where it cannot be
said either way. A known delivery failure and an unknown receipt are different things and are kept apart. **A
missing screenshot does not prove non-delivery.**

- **Met:** all eight cells received, and each Down received before that monitor's recovery.
- **Partly met:** anything between. **A partial result stays partial.** Every cell that is not "received" is named.
- **Not met:** a Down message received on neither channel before its recovery.

**What this means for Stage D (runbook P4).** Chad chose this test (M6) to see Down and recovery reach his phone
and his email with the Mac closed. **Only "met" closes P4.** With "partly met", P4 stays open until Chad, in his own
line, names the channel or the recovery path that is unreliable or unproven and accepts Stage D on that revised
basis. With "not met" or "incomplete", P4 is open. Not met takes precedence over incomplete.

**C. How long?** One observation each, never a bound: 503 onset → first failing poll → incident opened → push
seen → email received. **A Down alert within 15 minutes of onset is the target written down beforehand. It is a
target, not something the service promises.** Over 15 minutes is a finding **even if the alert arrived before the
recovery.** A late recovery is not used to make a late Down look timely: each is timed from its own onset. The
"roughly 25 to 30 minutes" estimate in proposal section 5 is updated from what is observed, whichever way it
moves, and stays an estimate: one test is never a maximum.

**Also recorded:** how many failed polls preceded each incident; fixture CPU per request (every poll's figure, with minimum, median, maximum, and the rows returned at that poll); anything requested by anyone other than UptimeRobot.

**A met result shows that this path worked on that day. It does not clear Stage D.**

## 7. D1 cost: measured before Stage D, in isolation (rewritten in rev 1.2)

**Why this changed.** Monitoring proposal 3.6 requires D1 rows read and CPU per request to be measured with
end-of-trial and repeat-heavy fixtures. Rev 1.1 proposed leaving the first real figure to the trial itself (option
R-a). GPT's review: that changes the adopted requirement; it is not another way of meeting it. **Rev 1.2 proposes
measuring it beforehand, apart from the alert test.** If Chad prefers to defer it into the trial after all, that is
his own decision to change the prerequisite, recorded as that (T3).

**Three statements in rev 1.1 are withdrawn:**

- "Bounded to 2,000 rows by its `LIMIT`." **`LIMIT 2000` bounds the rows returned to the evaluation. It does not
  bound the rows D1 bills as read**, which counts what the query reads or scans, index entries included.
- "About 166,000 rows read a day … at most about 1.15 million." Those are **illustrations of rows returned** (576
  polls a day times 288, or times 2,000). They are not measured D1 usage and not upper bounds. Extra polls and
  manual health reads add to the real number.
- "It overstates the hub's CPU if anything." **Unsupported.** D1's response handling and the runtime differ from
  the stand-in. The alert fixture's figure is fixture CPU and nothing more.

### 7.1 What is created (nothing in production is touched)

- **A throwaway D1 database, `mother-earth-evd1test`.** Created empty. The `collector_runs` table and its two
  indexes are created from the exact statements in `phase1/schema.sql` on main; the build checks them against that
  file. **It is not the hub's database and nothing binds it to the hub.**
- **A throwaway Worker, `mother-earth-evd1`,** with one binding: `DB` → that database. No R2, no secrets, no cron,
  no route. It holds the same byte-for-byte health code as the alert fixture (2.1) and the same two-path router.
  Its window and clock are fixed per row set, so the answer does not drift while it is measured. **This is a
  second Worker, not the alert fixture: the alert fixture keeps no bindings**, as proposal 9.5 says.
- **A thin recorder around `env.DB`: fixture, stated.** It passes each call straight to D1 unchanged and copies the
  `rows_read` and duration figures D1 returns with the result into a response header. The query text, its bound
  values and its result are untouched; the suite shows the health answer is byte-identical with and without the
  recorder.
- Its `workers.dev` address is on for the measurement and reads only made-up rows. Logs on, sampling 100%.

### 7.2 The row sets (made up; loaded one at a time, the table emptied between)

| Set | Rows | Expected answer |
|---|---|---|
| **S1. A completed normal trial** | 288 slots, one good row each, all finished; clock fixed just after `LAST` | 200, complete |
| **S2. Repeat-heavy** | 288 slots with repeats and stray rows, about 1,900 rows inside the read range | 200 or 503 as the rows dictate, stated beforehand; evaluated in full |
| **S3. At the cap** | 2,000 or more rows inside the read range | **503 `too many rows to evaluate`** |
| **S0. Other layers present** | S1 plus several thousand rows of other layers and of `earthview` outside the range | As S1. Shows whether rows read follows the range or the table |

### 7.3 What is measured

For each set, each of the two addresses, `GET` and `HEAD`, **20 requests each**: `rows_read` and duration from D1's
own result; CPU and wall time from the Worker's invocation record; the status and state of the answer. Reported as
every figure, with minimum, median and maximum. **Rows read is set beside rows returned, so the difference is on
the page.** Afterwards, D1's own metrics for the database are read and compared with the sum of the per-request
figures.

### 7.4 What it shows and does not show

It shows what the production query costs in real D1 on these row sets. **It does not show the hub's cost during a
trial:** the hub's table holds every layer's rows and has its own size and history, and S0 only approximates that.
The figures are read again on the hub itself at the start read and at every read of Stage D (runbook 3.3 and 3A),
from the source the evidence preflight names (runbook P11).

### 7.5 Cost, and cleanup

- **Money: none expected.** A few thousand rows written and well under a million read, once. The account is on
  Workers Paid; the D1 allowance and the month's usage so far are read and recorded before the line is asked for.
- Cleanup the same day: save the request log and D1's metrics; delete the Worker; delete the database; read back
  that neither is in the account's lists; one read of the hub to show nothing changed.

### 7.6 Order

It is independent of the alert test and of the two real monitors. It needs Chad at the Mac for about 40 minutes
(the Cloudflare tab displayed), on a weekday in daytime. It does not use his phone. **Nothing is retried: a set
that did not run is recorded as not run.**

## 8. The generic delivery test (proposal 9.4)

**The fixture test is the test Chad chose (M6).** It is not swapped for the generic delivery test by leaving it out
or by noting that it was not run: that needs Chad to change M6 in his own words.

A fixture test that is **met** on its delivery matrix (section 6 B) gives everything 9.4 was for, and 9.4 is then
not run as well. **A fixture test that merely ran does not:** if it ends partly met, not met or incomplete, 9.4 is
not thereby dropped, and what happens next is Chad's decision.

## 9. Cost and exposure

- **Money:** none expected. A Worker with no bindings answering about 150 requests; two monitors for a few hours.
- **The hub:** untouched.
- **Public:** the test address is reachable by anyone for a few hours and says only what the fixture says.
- **Phone:** four messages on one day, and the same four by email.

## 10. Approval lines (sketches, not requests)

**The build is not yet authorised.** Chad's go of 23 Nov ("1.") was for the documents first, and M1 to M8 are
design decisions. Building the two throwaway Workers and their suites on a branch needs a separate go from him;
none has been given. **Rev 1.1 said the build was covered. That was wrong.** After his go: the branch build, GPT's
review of that exact candidate, then his own line for each live step, with the values filled in at the time:

`Approve: Earth from Space fixture alert test under plan rev <n>: create the Worker mother-earth-evhtest from
<file> sha256 <hash> with no bindings and its workers.dev address on, T0 <UTC time>; create the UptimeRobot
monitors "TEST evh runs DELETE" and "TEST evh trial DELETE" on its two health addresses, set as the existing
eight; I record the four messages on my phone; then delete both monitors and the Worker and read back; no change
to the mother-earth Worker or to any other monitor`

`Approve: Earth from Space D1 cost measurement under plan rev <n> section 7: create the D1 database
mother-earth-evd1test and the Worker mother-earth-evd1 from <file> sha256 <hash>, bound only to that database, its
workers.dev address on; load row sets S1, S2, S3 and S0 in turn and make the stated requests; save the figures; then
delete the Worker and the database and read back; no change to the mother-earth Worker, its database or any
monitor`

## 11. Decisions for Chad

| # | Question | Claude proposes |
|---|---|---|
| T1 | Run this test before the two real monitors are created, or after? They do not depend on each other | Either. Creating the real two first is a five-minute job and lets the cleanup read back "ten, none named TEST" |
| T2 | Drop the separate generic delivery test (9.4) once this one is **met** on its delivery matrix? (If it ends partly met or worse, you decide then) | Yes |
| T3 | D1 cost: measure it beforehand in isolation (section 7), or change the prerequisite and take the first figure inside the trial? | **Beforehand** (GPT's recommendation, and what monitoring proposal 3.6 says) |
| T5 | Your go for the branch build of the two throwaway Workers and their suites (branch work only; nothing created in any account) | Yes, when you are ready |
| T4 | A day and a `T0` that suit: about 30 minutes at the Mac before, phone with you for three hours, 20 minutes at the Mac after | A weekday `T0` of 10:00 SAST |

## 12. GPT's answers to rev 1.1's questions (24 Nov 2026), and where each is adopted

| Question | GPT's answer | Where |
|---|---|---|
| Q1. Production code and fixture split? | Accepted in principle. Verify the copied spans against the exact Worker, name every simulated piece, and route only the two exact paths (or copy the full dependencies). Test unknown layers and checks, separators, methods, `HEAD` and `GET` | 2.1 (router), 2.3 items 1 and 3 |
| Q2. One overdue slot and one storage stop enough? | Yes for this two-monitor delivery exercise. It does not exercise every stop condition live | Section 1 |
| Q3. "Partly met" and the 15 minutes? | Keep partial outcomes, with the receipt matrix and an explicit rule for the Stage D prerequisite. 15 minutes is a target only | Section 6 B and C |
| Q4. 288 rows or near the limit? | Both, and the 2,000-row refusal. Keep cost measurement apart from delivery if the load would disturb it | Section 7 (S1, S2, S3) |
| Q5. R-a or R-b? | Real D1 before Stage D, in isolation. R-a as written does not meet the adopted prerequisite | Section 7 |
| Q6. Is a screenshot a receipt? | Yes, as a record of when Chad saw it. Its capture time is not the receipt time: use the notification's own time if shown, or call it "seen by". Email received time and the provider's sent time stay distinct. Screenshots stay private | Section 4 ("What a screenshot proves"), section 6 B |

**Screenshots are personal and are not put in the public repository.** The result records the times read from them.

**No new question for GPT in rev 1.2,** beyond whether section 7's measurement is the isolated measurement it meant.

## 13. Not checked while writing this

- Whether a new Worker's logs are readable in the dashboard at once (the alarm test of 22 Nov found a new Worker's
  rows recorded as `__unknown__` in a different tool). Checked at readiness; the fallback is in section 2.
- How many failed polls open a UptimeRobot incident. This test is where it is observed.
- **Section 7 is a design. Nothing in it has been run.** Whether `rows_read` reaches the Worker in the result's
  metadata exactly as Cloudflare's documentation describes is checked in the branch suite against the local D1
  emulator and then on the day; if it does not, the per-request figure is taken from D1's own metrics and the plan
  says which was used.
- The account's D1 allowance and usage this month (7.5).
- UptimeRobot's current Free-plan terms were not re-read today; the figures are those in proposal section 8.
