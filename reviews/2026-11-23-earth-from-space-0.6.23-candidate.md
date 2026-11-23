# Earth from Space — hub 0.6.23 candidate: two trial health checks (23 Nov 2026) — branch build for review, NOT deployed

Written 23 Nov 2026 13:59 UTC (clock reading), on Chad's go for the branch build ("go", his own message, after rev 3.1
of the monitoring proposal and GPT's confirmation that it is ready for the build). Brief:
`docs/concepts/EARTH-FROM-SPACE-INDEPENDENT-MONITORING-PROPOSAL.md` rev 3.1.

**Branch work only. Nothing is deployed. No setting, monitor or account was changed. It does not clear Stage D.**

## 1. What is in the candidate

| File | sha256 | Note |
|---|---|---|
| `phase1/worker.js` (0.6.23) | `111fdd101a9b7bbbefc174f0f7f432890a913b08b4334f19b13a4c5a29e55db8` | 550699 bytes (0.6.22: 540,792) |
| `phase1/earthview-health.test.mjs` | `30c0078685e8111f9f37ad74bdf1fd572f9e0054fcf23af9bfba5fa1dba537eb` | new suite, 48 cases |
| `phase1/earthview-health-breaks.mjs` | `ac813ae71f8648b4bc0e5e208d0e246d42f6ff46ce8917b3f853a49eb520c84c` | runs the suite once per deliberate break |
| `phase1/evprobe.js` | `09c688683d903ba69ca3bdeef5c507d2a4fc9bfea3782523532fa74b1246f799` | the retired Stage B probe file, rebuilt because it carries the version string (as at 0.6.22) |

**Built from the live hub.** Read at 13:58:14 UTC: the deployed file is 540,792 bytes, sha256
`17798a44a217…da080`, which is `phase1/worker.js` at this branch's previous commit (0.6.22). Gate `manual`, 25
bindings, no window variables. Main's older `worker.js` was not used.

## 2. The change to the hub is health-only (shown, not asserted)

Five edits to `worker.js`:

1. `COLLECTOR_VERSION` `'0.6.22'` → `'0.6.23'`.
2. `HEALTH.checks`: `earthview` added to `runs`; a new check `trial` with `earthview`.
3. One new block before `health()`: `EVH`, `EVH_POST_CHECK`, `EVH_FETCH_FAIL`, `evhKind`, `evhConfig`,
   `evhEvaluate`, `evhSafe`, `healthEvRuns`, `healthEvTrial` (about 105 lines).
4. In `health()`: the function is chosen from the two new ones when the layer is `earthview`.
5. Four names added to the export list for the tests.

**Check made:** taking those five edits back out of the new file gives the 0.6.22 file **byte for byte** (sha256
`17798a44a217…`). So the collector, the gate, the admin routes, storage and every other layer are untouched in
the text.

**One effect outside the health path, from edit 1:** the version string is part of the User-Agent the hub sends
to every source (EUMETSAT included) and of the `hub` field in the run log lines. It reads 0.6.23 after a deploy.
Nothing else in collection changes.

The Earth from Space probe suite's own byte check of the collector against 0.6.21 (case H6c) still passes.

## 3. How the code maps to the brief

| Brief (rev 3.1) | In the code |
|---|---|
| Slots: ten-minute marks `FROM` ≤ s < `UNTIL`; a row counts only if its `started_at` is exactly a slot | `evhEvaluate`: `(s - from) % SLOT_MS !== 0` or outside the window → not counted (reported as `rows_outside_slots`) |
| Due at s + 20 min, at equality; only settled slots build streaks | `settled` loop (`>=`); c6 and c8 loops run over `settled` |
| Flags per slot, true if any row says so; a good row never removes a bad flag | `refused`, `storage_stop`, `newer_listed`, `unrecognised`, `current` set, never cleared |
| Good evidence frozen at the slot's due time | `current` only if `finished_at` ≤ s + 20 min |
| c3, c6 (any-refusal reading), c8, unrecognised | `findings`: `storage_stop`, `three_slots_refused`, `six_slots_without_a_current_frame`, `unrecognised_outcome` |
| State table and precedence | `evhConfig` (rows 1 to 4), then the before-`FROM` branch (5, 6), then one evaluation for rows 7 to 11 |
| Startup excuses only a missing completion | rows are read from `FROM` onward, so a storage stop, an unrecognised row or a failed read answers 503 during startup |
| Bounded read, failing closed | one `SELECT` with `finished_at` in [`FROM`, `UNTIL` + 24 h), `LIMIT 2000`; 2,000 rows returned → `too_many_rows`; a failed read, an unreadable or future time → `rows_unreadable` |
| Fixed codes, no note text | reasons and findings are codes from a closed list; `evhSafe` keeps any exception's text out of the answer |
| HEAD equals GET, no-store | the existing `health()` wrapper, unchanged |
| No write, no upstream request, no collection | the suite fails any case in which a health request prepares a non-`SELECT` statement, touches R2 or calls `fetch` |

## 4. Tests run here (13:59 UTC, Node v22.23.5, this container)

**New suite: 48 passed, 0 failed.** Sections: S states and precedence (10); T slots (5); C and U findings (13); R
reads (7); P pause limits (3); H the HTTP answer (5); I through the real scheduled job (2).

Named in the brief and present: the exact s + 20 min boundary (S6, C6c, C8d); gate `1` with no window (S3);
unknown gate after the window (S2); a storage stop at startup (C3d); an unrecognised row at startup and a read
failure at startup (U1, R2); failure, then a good run, then the next poll (C3b); a failure in the last slot
(C3c, S9); mixed good and bad repeats in both orders (C6b); an early failure with future slots (C8e); incomplete
slots across the end of the window (C8f); truncation (R1); the 24-hour horizon both ways (R4, R5); HEAD and GET
(H1); no note text (H2).

**KNOWN LIMIT cases, pinning what the brief says cannot be detected:** T4 (a manual run exactly on a mark), P1 (a
pause that misses no slot), P2 (gate off after the last admitted trigger), R4 (a late bad repeat after the horizon).

**I1 is the first evidence about a scheduled row's time:** driven through the real five-minute job with the gate
at `1`, the Earth from Space row's `started_at` is exactly the mark (`2026-11-24T06:00:00.000Z`) although the
trigger was delivered 8 seconds late, and that row completes the slot. Storage is empty in this suite, so the run
stops at its first guard. **It is an offline result, not a live one.**

**U2 reads the collector's own source:** every failure phrase `evFail`, `evFetch` and `EV_STOP` can write (at
least 18) is recognised by `evhKind`. A phrase added to the collector later without a matching rule fails this
case, and on the hub it would answer 503 `unrecognised_outcome`.

**Breaks: 37 of 37 caught** (`earthview-health-breaks.mjs`). Each weakens a copy of `worker.js` and must make
the suite fail.

**Regression, every `phase1/*.test.mjs`:**

| Result | Suites |
|---|---|
| Passed | aircraft-counts 75; arts-hub 54; buoy-temp 37; drifters-hub 12; duration-contract; dustrgb-hub 174; earthview-admin 109; earthview-gate 163; earthview-hub 309; earthview-probe 117; earthview-stage-b-call 48; evprobe 94; firms-guard 19; firms-v2 61 (7 skipped, as before); health-hub 29; history-hub 33; kp-degraded 29; moon-light 27; orbital-hub 13; orbital-ui 38; osmc-reliability-hub 27; place-rows 7; plastic-hub 11; satellites-hub 12; search 111; search.realdata 50; ships-diagnostics 102; ships-fallback 7; ships-late 7; ships-probe 11; sky-hub 46; sky-scene-hub 7; skycraft-hub 164; spacetrack-probe 11; status-notes-hub 6; sunface-hub 171; timeline-catalogue-hub 73; timeline-changes-build 45; wind-hub 103 |
| **Not run here** (need files this container does not have; nothing to do with this change) | night-lights, sky-scene-ref, solar (missing local modules); oceanheat-hub (needs a snapshot folder); orbital (needs a data file) |

**Test files edited, and why:** six suites pinned the version string `0.6.22` in a User-Agent or a `hub` field
(history-hub, wind-hub, sunface-hub, earthview-gate, earthview-probe, evprobe): changed to `0.6.23`.
health-hub's case H9 compared the list of checks with the eight monitor addresses: it now expects those eight
plus the two new ones. No other assertion was changed.

## 5. Findings to know about

1. **An older weakness, not caused by this change:** `health-breaks.mjs` (the 0.5.3 health suite's breaks) catches
   **14 of 19** here. The same five are missed on the unchanged 0.6.22 file (run against it to check): P2, P3, P4,
   P5, P6. They concern the `usgs` and `firms` checks. **Not fixed here; it needs its own look.** The new checks do
   not rely on that code path for their rules, and the new suite has its own future-time case (R3).
2. **Local cost, not a Workers or D1 measurement:** one evaluation at the end of a 48-hour trial with one row per
   slot (288 rows returned, 6,000 older rows in the table) took about 1.1 ms of CPU; with 1,999 rows (six or seven
   repeats per slot) about 4.3 ms. The query uses the `(layer, finished_at)` index (R7 asserts the plan has no
   scan). **D1 rows read and CPU per request on the hub are still to be measured after a deploy** (proposal test 2).
3. **The two addresses answer on the live settings as "no trial configured", 200,** once deployed: gate `manual`,
   no window variables (state row 3). So creating the two monitors before a trial raises no alert.
4. **Not done in this build:** the hub file's header comment does not list the two new addresses; the reviewed
   plan for the disposable fixture test (M6) is not written yet; the runbook revision is not written yet.
5. **Still outstanding from before:** the UptimeRobot dashboard read-back after deleting "ME alert test".

## 6. What a deploy would need (not asked for here)

- GPT's review of this candidate.
- Chad's own Approve line: deploy 0.6.23 from this branch at the reviewed commit, code only, gate left at
  `manual`, read back the hash and settings.
- After it, proposal test 2: both addresses 200 "no trial configured"; the eight existing ones unchanged; nothing
  under `earthview/` changed; D1 rows read and CPU per health request measured.
- Then, each on its own line: the two monitors; the fixture test under its own reviewed plan.
- **Stage C carries forward as evidence about the collector only,** on section 2's byte check. It says nothing
  about the new addresses or the alert path.

## 7. How to rerun

    node --no-warnings phase1/earthview-health.test.mjs
    node phase1/earthview-health-breaks.mjs
    node --no-warnings phase1/health-hub.test.mjs
