# Earth from Space — the two live tests: exact packets for Chad's separate approval (rev 1.1)

**Rev 1.1, 24 Nov 2026 03:29 UTC (clock reading): GPT's check of rev 1 adopted**
(`EARTH-FROM-SPACE-LIVE-TEST-PACKETS-REVIEW-2026-11-24.md`: files pass, 74 of 74, all ten live files match their hashes;
packet 2 acceptable as written; packet 1 needed two instruction fixes). Changed, packet 1 only: **1.2a added** (the
allowance and usage, now read, and made a condition of creating anything); **M0 and M5 rewritten** (an unreadable usage
read stops before M1; the one narrow exception for a refused seed); **1.4a added** (evidence rules for the day); the line
in 1.5 now names rev 1.1. Section 2.5 gains one sentence. **No file was rebuilt; every hash is unchanged.**

24 Nov 2026, 03:20 UTC (clock reading). Branch `earth-from-space-fixtures-rc`. Prepared after GPT's PASS of the branch
candidate (`EARTH-FROM-SPACE-FIXTURES-RC-REVIEW-2026-11-24.md`, 24 Nov: no blocking finding; it ran the suite itself).

**Nothing here has been run. No Worker, database or monitor exists. Each packet needs Chad's own exact `Approve:` line.
Stage D is not cleared and neither test clears it.** GPT reads this packet first.

Plan: `reviews/2026-11-23-earth-from-space-alert-test-plan.md` rev 1.2. Candidate record:
`reviews/2026-11-24-earth-from-space-fixtures-candidate.md` (section 3 lists the reviewed departures; this packet follows
them where they differ from the plan's wording).

**Source identity for every file below:** `phase1/worker.js` sha256
`db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5`, 551,400 bytes, the deployed hub 0.6.24. Suite on this
commit: **74 passed, 0 failed** (71 as reviewed, plus the extended A13 and one A14 per live build). **If the hub is
deployed again, or `phase1/worker.js` changes, before a test: the files are rebuilt, the suite rerun, the new hashes
quoted, and the line asked for again.**

**Rules for both tests.** The Cloudflare tab (and for packet 2 the UptimeRobot tab) is **displayed in the browser pane**
while Claude acts. Every action is read back in that system before it is reported. **Nothing is retried:** a step that
did not happen is recorded as not having happened. **If anything differs from what a step says it should show: stop.
Nothing further is done except the cleanup, which is always done.** The `mother-earth` Worker, its database, its
settings and the eight existing monitors are not touched; one read at the start and one at the end show it.

---

# Packet 1 — the D1 cost measurement (plan section 7; runbook P4a)

**Chad at the Mac for about 40 minutes, any weekday in daytime. His phone is not needed.**

## 1.1 The files (built for B = `2026-11-24T04:00:00Z`; folder `phase1/evh-fixture/live/d1-2026-11-24T0400Z/`)

| File | Bytes | sha256 |
|---|---|---|
| `evh-d1-worker.js` | 15,065 | `2afd3bdf1b08cfbe5c1a851580fd06d6030e1f16e30bfa4cd56164639a0d654f` |
| `seed-schema.sql` | 420 | `ddea3595fc868a40523dca8d8e61539e0e18cf268915c314244e8f63d7e21ad0` |
| `seed-clear.sql` | 28 | `81e63ac7e7ecb51509ac29d18ddf2a01de8ef20941cc138736d5501e525fc78a` |
| `seed-S1.sql` | 505 | `f39ed4705fd2c5faf11911d5a5784e93a452731c6fc2457de4dfb11701468410` |
| `seed-S2.sql` | 1,419 | `86bfb4e28f4cb6843b8ddc59f01718570b4ef50b3c3fee6d79b822f35004d0ec` |
| `seed-S3.sql` | 982 | `e6b26a5d77126290a1903bed88325f60bb69eb2d6ba921f1e3b1ff366b24ee3b` |
| `seed-S0.sql` | 1,450 | `5a270e3373a292366838078458e6b283f52f4eedcbe7b46e2233859a5253846b` |
| `expected.json` | 1,796 | `23c7e4ff4704b37688d07b7401466debf1a62a5e834e53e2374fddd480651bf3` |

**Why B is already fixed.** The made-up trial runs from 22 Nov 03:00 UTC to 24 Nov 03:00 UTC. Its last slot came due at
**24 Nov 03:10 UTC**, which has passed. From then on the verdicts depend on the rows only (suite C4, C5), so these files
are valid on whatever later day the measurement is made. They do not need rebuilding for the day.

## 1.2 What is created, exactly

| Thing | Identity | Settings, each read back |
|---|---|---|
| D1 database | `mother-earth-evd1test` | Created empty in the dashboard. Its id is recorded. Not bound to anything else |
| Worker | `mother-earth-evd1` | Code = `evh-d1-worker.js` above (hash checked before upload and read back after). **Exactly one binding: `DB` → `mother-earth-evd1test`, checked by the database's id.** No variable, no secret, no R2, no KV, no cron, no route, no custom domain. `workers.dev` address **on**. Logs on, sampling 100% |

**How.** In the dashboard, by Claude, with the tab displayed: the database under D1; the Worker created as an empty
"Hello World" Worker, its code then replaced with the built file. **If the dashboard refuses any of Claude's steps,
Claude does not look for another way in:** Chad makes that step and Claude reads it back, or the test stops.
**The seed is loaded through the database's own console in the dashboard**, one file at a time, statement by statement.

## 1.2a The allowance and usage: read before the line is asked for (GPT's D1-1)

Read from the account's D1 page, read-only, **24 Nov 2026 03:28 UTC** (the browser pane was not displayed at the time;
nothing was changed). Billing period 30 October to 30 November.

| | Used this period | Allowance | This test is expected to add |
|---|---|---|---|
| Rows read | 7.59 million | 25 billion | under 2 million |
| Rows written | 1.46 million | 50 million | some tens of thousands (about 10,100 rows seeded over the four sets, their index entries, and the deletes between sets) |
| Storage | 111.05 MB | 5 GB | a few MB for under an hour |
| Databases | 1 (`mother-earth`) | 50,000 | 1, deleted the same day |

Billable usage shown for the period: $0.00. **"Expected to add" is an expectation, not a measurement.** The same read is
made again at M0 on the day and at M7.

## 1.3 Steps

| # | Step | Must show, or stop |
|---|---|---|
| M0 | Read-only preflight: the clock; the hub (code hash `db4f9cdf…1aa5`, gate `manual`, no window, 25 bindings, four crons); the account's lists of Workers and D1 databases; **the D1 allowance and usage, as in 1.2a** | Clock after 24 Nov 03:10 UTC. No Worker or database of these names exists. **Rows read, rows written and storage each read, with its allowance, and each with room for the "expected to add" of 1.2a. If any of them cannot be read, or the room is not there: stop before M1 and report. Nothing is created.** Going on without that read needs Chad's own decision on that changed basis |
| M1 | Create the database | Listed, empty, id recorded |
| M2 | Run `seed-schema.sql` in its console | `SELECT name, type FROM sqlite_master`: the table `collector_runs` and its two indexes |
| M3 | Create the Worker; add the binding; address on; logs on | The settings of 1.2. Code hash equal |
| M4 | **With the table empty:** `GET` both health paths; `GET /health/runs/usgs` | Both 503, `completion_missing`, 288 overdue. The wrong path 404. **First sight of what D1 returns:** if `X-Evd1-Rows-Read` reads `unavailable`, stop and report: Chad decides whether to go on with totals only, named as totals |
| M5 | For S1, S2, S3, S0 in that order: (a) `seed-clear.sql`, count 0; (b) the set's seed file; (c) counts read back: rows in the table, rows in the read range; (d) the database's metrics read (**after seeding, before the requests**); (e) `measure-in-pane.js` once, on the Worker's own address, its origin typed in from M3's read-back: 80 requests; (f) its JSON saved as it came; (g) the metrics read again | (a) the count is 0. (c) equals `expected.json`. (e) every `GET`'s status and state, and every `HEAD`'s status and `X-Health`, equal `expected.json`, and every request carries the measurement headers. **The one exception to the stop rule is 1.3a** |
| M6 | Save the Worker's invocation records for the test (time, method, path, status, CPU, wall time), with the count the source reports beside the count saved; save the database's metrics | Whatever cannot be read is recorded as not read |
| M7 | **Cleanup, always:** delete the Worker; delete the database; read back both lists; the address no longer answers as the fixture; the hub read of M0 again | Neither name listed. Hub unchanged |

### 1.3a The one exception to "stop": a seed statement D1 refuses (GPT's D1-2)

Everything else that differs from what a step must show stops the measurement and goes to M7. **This case alone goes on,
and only like this:**

1. The refusal is saved word for word.
2. **That whole set is not run.** No measurement request is made against a partly seeded table.
3. **No SQL is changed and nothing is retried.**
4. `seed-clear.sql` is run and the count is read. **Only if the clear succeeds and the count is 0** does the next
   unchanged, reviewed set begin.
5. If the clear fails, the count is not 0, or anything else unexpected happens: the measurement stops and goes to M7.

**A set that was not run leaves the cost evidence incomplete. Runbook P4a is not closed by a measurement with a set
missing.**

About 330 requests in all. `measure-in-pane.js` makes `GET` and `HEAD` requests to the two health paths of that Worker
and nothing else. Its `wall_ms` is the browser's latency, not the Worker's wall time.

## 1.4 What the result will and will not say

For each set: every request's D1 `rows_read`, rows returned, D1 duration, and the Worker's CPU and wall time from its
invocation records, with minimum, median and maximum. Rows read beside rows returned. The database's own totals beside the
sum of the measured requests, **with the seed's reads and writes kept out by the before-and-after readings.**

**It will not say what the hub costs during a trial** (the hub's table has every layer's history; S0 only approximates
that). A per-request figure that D1 did not return is recorded as missing: **a total is never written as one request's
figure.** Expected money: none. That is an expectation; the allowance and actual usage are read at M0 and M7.

## 1.4a Evidence rules for the day (GPT's check, section 4)

- **`HEAD` has no body.** The helper records no state for a `HEAD`; that is correct and is not a failed measurement.
- **D1's own per-request figure is the primary evidence.** The database's totals may lag and include other reads (the
  count checks, the console, the dashboard itself). The before-and-after readings are saved with their real times. A
  difference that is not explained is flagged. Subtraction alone is not claimed to isolate the 80 requests.
- **The helper returns its batch at the end.** If it is interrupted, the invocation records that exist are saved, the
  batch is marked partial, and it is not run again.
- **Unavailable D1 metadata, CPU or log evidence is a limit to be reviewed. It does not pass P4a by itself.**
- **Cleanup is always attempted and always read back.** A deletion that is refused is reported with the resource that
  remains. Cleanup is never called complete on an attempted delete.

## 1.5 The line

`Approve: Earth from Space D1 cost measurement under plan rev 1.2 section 7 and packet rev 1.1: create the D1 database
mother-earth-evd1test and the Worker mother-earth-evd1 from phase1/evh-fixture/live/d1-2026-11-24T0400Z/evh-d1-worker.js
sha256 2afd3bdf1b08cfbe5c1a851580fd06d6030e1f16e30bfa4cd56164639a0d654f, bound only to that database, its workers.dev
address on; load row sets S1, S2, S3 and S0 in turn from that folder and make the stated requests; save the figures; then
delete the Worker and the database and read back; no change to the mother-earth Worker, its database or any monitor`

---

# Packet 2 — the fixture alert test (plan sections 2 to 6; runbook P4)

**Chad at the Mac for about 30 minutes before, his phone with him (sound on) for three hours, about 20 minutes at the
Mac after. All between 08:00 and 18:00 SAST.**

## 2.1 The file: T0 is Chad's choice (decision T4)

T0 is a ten-minute mark. The Worker must exist by T0 − 45 min and the two monitors by T0 − 30 min. Two builds are ready;
any other T0 is a ten-second rebuild with its hash quoted in the line.

| T0 | In SAST | Folder under `phase1/evh-fixture/live/` | `evh-alert-worker.js`, 15,575 bytes, sha256 |
|---|---|---|---|
| `2026-11-24T08:00:00Z` | **Tue 24 Nov, 10:00** | `alert-2026-11-24T0800Z/` | `6f24ab6485740cc40db562bd83e3c5504436e5ff500dd17db51576f7da801a7d` |
| `2026-11-25T08:00:00Z` | **Wed 25 Nov, 10:00** | `alert-2026-11-25T0800Z/` | `9dbd1e8ca8d61045c4ada09209f042e70ea02d4fbfe7faf62a259b4c9d2a61c2` |

**For a 10:00 SAST T0, in SAST:**

| Clock | What the fixture does | Message expected |
|---|---|---|
| by 09:15 | Worker created and read back | |
| by 09:30 | Two test monitors created and read back | |
| 09:30 to 09:55 | Readiness: both monitors Up with at least two good checks; polls seen in the Worker's log. **Not ready by 10:00: the test does not run, everything temporary is deleted, T0 is not moved without Chad** | |
| 10:00 | Chad closes the Mac or leaves it | |
| 10:50:00 | runs answers 503 | **1. runs Down** |
| 11:40:00 | runs answers 200 | **2. runs recovery** |
| 12:00:15 | trial answers 503 | **3. trial Down** |
| 12:50:00 | trial answers 200 (the simulated closeout) | **4. trial recovery** |
| from 13:00 | Chad back at the Mac; evidence saved; cleanup | |

The runs outage lasts 50 minutes; the trial outage lasts 49 minutes 45 seconds. Message times are later than these by
however long UptimeRobot takes to notice: that delay is what is being observed.

## 2.2 What is created, exactly

| Thing | Identity | Settings, each read back |
|---|---|---|
| Worker | `mother-earth-evhtest` | Code = the file of 2.1 for the chosen T0. **No binding of any kind**, no cron, no route. `workers.dev` address **on** (public for the life of the test; it answers the two health paths and 404 or 405 for everything else, and holds nothing secret). Logs on, sampling 100% |
| Monitor | `TEST evh runs DELETE` | `https://<the test Worker's address>/health/runs/earthview` |
| Monitor | `TEST evh trial DELETE` | `https://<the test Worker's address>/health/trial/earthview` |

**Monitor settings: copied from one of the existing eight as read on the day** (type, interval, timeout, method, alert
contacts, alert timing), and that reading is saved with the result. The plan expects HTTP, 5 minutes, 30 seconds, e-mail
and iPhone push, "no delay, no repeat". **If what is read differs from that, stop and report before creating anything.**
The contacts are selected, never typed: no address or number is entered or recorded by Claude.

## 2.3 What Chad does during the test

**For each of the four messages, on each of the two channels: a screenshot when he sees it.** Nothing else. No reply is
needed. If the phone shows when the notification arrived, that is in the screenshot. Afterwards he shares the
screenshots and each email's received time. **The screenshots stay private: they do not go into the repository.**

If a real hub alert arrives during the test it is a real alert and is handled as one. The test monitors are told apart
by their names.

## 2.4 The evidence, then the cleanup (same day)

1. Each test monitor's log and incidents, saved **before** it is deleted (deleting removes its history).
2. The Worker's request log: time, method, path, status, CPU of every request, with the count reported beside the count saved.
3. Delete both test monitors; read back: the eight existing monitors, none named TEST (ten if the real two exist by then).
4. Delete the Worker; read back: not listed; its address no longer answers as the fixture.
5. The hub read: unchanged.

## 2.5 The result (plan section 6, unchanged)

**A. Did UptimeRobot see it?** One incident per monitor, each in its own 503 phase, neither during the other's.
**B. Did it reach Chad?** The eight-cell matrix: runs Down, runs recovery, trial Down, trial recovery, each by push and
by email; each cell received (with the time, and whether received or seen), not received, or evidence missing.
**Only all eight received, each Down before its recovery, is "met" and closes runbook P4.** Anything else is "partly
met" or "not met" and P4 stays open until Chad decides, in his own line. **C. How long?** One observation each, never a
bound. A Down alert within 15 minutes of onset is the target, not a promise; later than that is a finding.

**All three verdicts are read together. Eight messages do not excuse an incident in the wrong phase (A), and a receipt
that was not observed is not assumed.** T0 is not moved without Chad; if a build's deadlines are missed, that build is not
reused for another time.

## 2.6 The line (T0 and hash filled in for the day he chooses)

`Approve: Earth from Space fixture alert test under plan rev 1.2 and packet rev 1.1: create the Worker mother-earth-evhtest
from phase1/evh-fixture/live/alert-<T0 folder>/evh-alert-worker.js sha256 <hash from 2.1> with no bindings and its
workers.dev address on, T0 <UTC time>; create the UptimeRobot monitors "TEST evh runs DELETE" and "TEST evh trial DELETE"
on its two health addresses, set as the existing eight; I record the messages on my phone and in my mailbox; then delete
both monitors and the Worker and read back; no change to the mother-earth Worker or to any other monitor`

---

# 3. Order, and what stays open

- The two tests are independent. **Packet 1 first is suggested:** it needs no phone and no waiting.
- T1 (plan section 11): the two **real** monitors may be created before or after packet 2. That is its own line (runbook P3).
- After both results are read by GPT, still open before a Stage D line: P3 (the real monitors), P6 (the phone look), P7
  (EUMETSAT note, Chad's call), P11 (the evidence preflight), and Chad's acceptance of the documents (P5).

# 4. Not checked while writing this

- Whether Claude can replace a new Worker's code in the dashboard editor in this session. The hub deploys of 21 to 23 Nov
  went through the dashboard tab's session; a throwaway Worker has not been created that way by this thread. 1.2 says what
  happens if it is refused.
- Whether the D1 console takes each seed statement as written, and what D1 returns as `meta`.
- The existing monitors' settings were read on 23 Nov, not today.
- The built files were produced and the suite run in Claude's workspace only.
