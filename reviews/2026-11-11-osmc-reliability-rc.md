# Drifting buoys: last good run kept after a failed update — candidate (branch `osmc-reliability-rc`)

11 Nov 2026. Built on Chad's line "Go: OSMC reliability build on a branch per rev 2.1 (H1; O1–O7 as recommended; no page release, no hub deploy)". Proposal: `docs/concepts/OSMC-RELIABILITY-PROPOSAL.md` rev 2.1. Branch only: not merged, nothing deployed, no R2 or D1 change. Live remains hub 0.6.7 and main's page.

> **Rev 2 (code `3df9c1a`, 18:58:29 UTC commit time) supersedes the hashes and counts in §1–§6 below. See §9.** §1–§8 are kept as the rev 1 record GPT reviewed at `987f97e`.

## 1. Candidate

Code commit `266683b` (18:20:05 UTC commit time). This packet is a later commit on the same branch; code files are unchanged after `266683b`.

| File | sha256 | Change |
|---|---|---|
| `phase1/worker.js` | `73317081e65b66048e09bf0bdb993190567b56561a6a4a8415b15e3b22233802` (292,403 B) | hub **0.6.8** |
| `index.html` | `781de57c3ebd42fce184c356c05f1d17786591d3e03f771a3c3e37491a17951f` | buoy card, expiry redraw, `?v=202611291000` |
| `app.js` | `9df9dce8cb08234996313b0ddd78d2579216dca8ae62d94b5d1b0f4735de0c0b` | place clause, `ME.dayMonth` |
| `sources.html` | `44b6e42d5bb9a7fb5d4af7e006048b877294dc1a940d2ba88e76553eeb1a0917` | one sentence, `?v=202611291000` |

Unchanged: `style.css`, `arts.js`, `sky.js`, `skyscene.js`, `oceanheat.js`, `timeline.html`, `timeline.js`. No schema, cron, variable or R2 layout change.

New test files: `phase1/osmc-reliability-hub.test.mjs`, `phase1/osmc-reliability-ui.test.cjs`, `phase1/osmc-reliability-fixture-hub.mjs` (test fixture: the real `worker.js` behind a local port). Edited tests: `drifters-hub.test.mjs` (case I now expects the kept counts), `oceanheat-hub.test.mjs` (version pin loosened to "0.6.7 or later").

## 2. What was built

**Hub (0.6.8)**

- `driftFail()` handles every failed buoy run: request throws, non-2xx, refused by checks, and an unexpected throw caught by `guarded()` (reason `internal_error`). Buoys no longer reach the generic `writeDown`.
- The run is always logged first: the `collector_runs` row and the private per-run object, both with the raw note.
- `latest-cells/drifters.json`: a good run's counts are rewritten unchanged with `last_attempt` added (`run`, `failed_at`, `status`, `http`, `reason`, `consecutive_failures`). `latest/drifters.json` is never touched by a failure.
- Nothing good to keep (absent, unreadable, or an empty down envelope): an empty down envelope.
- Every one of those writes is conditional: the etag of what was read, or create-only when the key was absent; one re-read on a lost race; then nothing.
- Attempts are ordered by run timestamp (`scheduled_for`, `last_attempt.run`).
- `/place`: for the buoy section, a fallback older than `stale_after_s` (4 h) is returned `withheld` with no records and no cell count; inside the limit the section passes `last_attempt` through. Both are judged on the final counts envelope after the pairing re-read.

**Page**

- Buoy card: while the good run is inside its limit, badge "degraded" and the line "Latest update failed at 16:08 UTC. Showing buoys from the 15:08 UTC run." Both times carry their UTC date when the dates differ. "Showing buoys…" only when that run's records are read and paired.
- `ME.freshness('drifters')` is unchanged; past 4 h the badge is unknown with the existing reason.
- The 30-second timer redraws the map when a fallback's freshness grade changes, and an expired fallback draws no buoy cells.
- Place view: one clause on the buoy row when the section lists records from the good run.
- Sources: the buoy "Collection" paragraph's last sentence now describes this behaviour (it already claimed the previous snapshot stays; that was not true before this change).

## 3. Where the build differs from, or adds to, rev 2.1

1. **Same-run rule.** The guard writes nothing when the stored data is from this run *or* a later one (rev 2.1 said "later"). Case: a run publishes both objects and then throws; its own good pair must not be labelled as a failed update. The run is still logged down.
2. **The empty down envelope's public note is a fixed phrase** ("request failed", "http error 522", "response refused by our checks", "internal error") plus a `reason` code, instead of the raw note that 0.6.7 publishes there. This is what makes "the data endpoints never carry the raw text" true for buoys in every state. The page shows it as "collector reported down: http error 522".
3. **Unreadable stored counts** (not valid JSON) are treated as nothing good to keep.
4. **Badge when records are missing or mismatched.** The card shows "degraded" with "Latest update failed at …" (no "Showing buoys") and the existing "Records withheld" reason. Rev 2.1 specified the line for this case but not the badge. For GPT: degraded, or unknown?
5. **Expired fallback and buoy cells.** Today an ordinary expired layer keeps its cells on the globe, drawn as "unknown". For an expired buoy fallback the cells are removed, as rev 2.1 says. An ordinary expired buoy snapshot (no `last_attempt`) is unchanged.
6. **Place clause** appears only on a section that lists records. A cell with no buoys in the good run gets no clause (literal reading of rev 2.1 §4.4).
7. **After expiry** the card shows the existing "last snapshot is over 4 h old" reason only, without repeating that the update failed.
8. `/status` still shows the latest run's raw note (existing behaviour, asserted in the hub suite as such).

## 4. Hub tests — `osmc-reliability-hub.test.mjs`: 21 passed, 0 failed

Through `scheduled()` and `/admin/run/drifters`, read back through `/cells`, `/snapshot`, `/place`, `/`, `/status`. Fake R2 with etags and conditional puts; clock faked for `Date.now()` and `new Date()`.

| Case | Result |
|---|---|
| 0 version 0.6.8 | pass |
| 1 good → 522 → recovery: decoded counts minus `last_attempt` deep-equal the good run's; records bytes and etag unchanged; down row and per-run record; recovery clears the field | pass |
| 2 each failure kind on the manual path: `http_error`, `fetch_failed`, `refused_by_checks`; one conditional write; raw text absent from `/cells`, `/snapshot`, `/place`, `/`; present in `collector_runs`, the private object and `/status` | pass ×3 |
| 2d unexpected throw via `guarded()`: `internal_error`, no unconditional write | pass |
| 3 two failures in a row: `consecutive_failures` 2 | pass |
| 4 late failure against a newer good publish: newer pair byte for byte, failure still logged | pass |
| 4b run order and publish order disagree | pass |
| 5 conditional write loses the race, re-read once | pass |
| 6 late failure against a later failure | pass |
| 7 first-ever failure; second failure over a down envelope (create-only, then etag) | pass |
| 7a absent-key race · 7b existing-down race · 7c older attempt after a newer down envelope | pass ×3 |
| 8 exact partial publish (records written, counts write throws) and recovery through both endpoints | pass |
| 8b the failure handler's own write throws: logged, `latest-*` unchanged, no unconditional write attempted | pass |
| 9 missing records object: `/place` withheld | pass |
| 10 place cutoff at 3 h 59 / 4 h 01; ordinary old pair as today | pass |
| 10b recovery during a place request | pass |
| 12 failed runs always logged; other layers still use `writeDown` | pass |

**Breaks (each fails):**

| Break | Failing cases |
|---|---|
| `stamp-failed-time` (failed run's time on the counts) | 9 |
| `keep-after-good` (`last_attempt` kept after a good run) | 3 |
| `unconditional` (good-counts write unconditional) | 8 |
| `down-unconditional` (empty-down write unconditional) | 3 (7, 7a, 7b) |
| `order-by-retrieved` | 4 (4, 4b, 6, 7c) |
| `guarded-writedown` | 2 (2d, 8) |
| `no-place-cutoff` | 1 (10) |
| `raw-note-public` | 4 |

## 5. Page tests — `osmc-reliability-ui.test.cjs`: 35 passed, 0 failed

Every hub response is produced by the real hub code: the fixture runs this branch's `worker.js` on one port and main's `worker.js` (0.6.7) on another. The browser's clock is set to the hub's; the page's own refresh and its 30-second timer are captured and fired by the suite, and "no data poll" is read from the hub's request log.

- **1 Fallback inside the limit:** full line, badge degraded with the line as tooltip, 1,300 points and cells drawn, count shown, "retrieved 72 min ago" from the good run, freshness still adequate, cell coverage grades the good run's.
- **2 Midnight:** "Latest update failed at 00:08 UTC, 11 Nov. Showing buoys from the 23:08 UTC run, 10 Nov." and the same in the place clause.
- **3a/3b Records unreadable / from a different run:** nothing drawn, no "Showing buoys", existing withheld reason, place withheld without the clause.
- **4 Ageing in an open page, no data poll:** badge unknown, points 0, cells 0 after one 30-second timer; the hub's request log unchanged; a fresh place request is withheld.
- **5 Recovery through the page's own refresh.**
- **6 Place clause** on a cell with buoys; absent on a cell with none.
- **7 Old page (main) on the new hub:** draws the pair with the true retrieval time and no line; at expiry the badge goes unknown on the 30-second timer while the points stay; they go at its next refresh; a fresh place request is withheld by the hub.
- **8 New page on the old hub:** after a failure exactly today's behaviour ("collector reported down: http 522", withheld); after a good run current with no line.
- **9 Layer off:** no buoy request.

**Breaks (each fails):** `drop-line` 7 · `showing-without-records` 2 · `no-redraw` 1 · `keep-cells` 1 · `missing-field-is-failure` 2 · `failed-at-run` 6 · `no-degraded` 2.

## 6. Regression

Run on the candidate code (`266683b`), 18:13–18:42 UTC, workspace container. All green.

**Hub-side (22 suites):** arts-hub 54 · buoy-temp 37 · drifters-hub 12 · duration-contract · firms-guard 19 · firms-v2 57 (+7 skipped, need `OLD_WORKER`) · health-hub 29 · history-hub 27 · kp-degraded 29 · oceanheat-hub 48 · orbital-hub 13 · plastic-hub 11 · satellites-hub 12 · ships-fallback 7 · ships-late 7 · sky-hub 46 · sky-scene-hub 7 · timeline-catalogue-hub 66 · place-rows 7 · search 111 · solar 26 · osmc-reliability-hub 21. Ocean Heat pin check: consistent.

**Browser (22 suites):** fires-wording-ui 35 · smoke-fixes 52 · kept-ui 21 · ux-round1 34 · search-ui 104 · place-ui 30 · backdrop-layer 27 · cell-perf-ui 43 · desktop-overflow 112 · mobile-pass 131 · drifters-ui 25 · buoy-temp-ui 33 · plastic-ui 29 · terminator-ui (exit 0) · terminator-behaviour (exit 0) · arts-ui 90 · sky-ui 79 · oceanheat-ui 109 · timeline-ui 585 · timeline-axis 96 · sky-zoom-ui 333 · orbital-browser 113.

Notes:
- `buoy-temp-ui` first stopped on a harness error (it writes a screenshot to another session's scratch folder, START-HERE §4q). With that folder created it passed 33/33. No test logic involved.
- `oceanheat-hub` had two checks pinned to version "0.6.7"; loosened to "0.6.7 or later" (48/48; its `no-hash-check` break still fails).
- Not rerun: the Python generator suites (`sky-build`, `sky-scene-build`), `sky-scene-ref`, `orbital-ui`, and the probe and real-data tools. None of their inputs changed.

## 7. Not done, not verified

- No live check: nothing is deployed. The failure path cannot be triggered on production without breaking a real run (proposal §9).
- Worker CPU and wall time of the failure path on Cloudflare: not measured (one extra R2 read and one conditional write on a failed run).
- Real R2 conditional-put behaviour is relied on as proven by the 7 Nov production probe (FIRMS v2); not re-probed.
- A real phone; screen reader.
- No `_review/` copy on the Mac yet for a GPT smoke test (next step if wanted).

## 8. Release steps (none approved)

1. GPT review of this candidate.
2. `Approve: merge osmc-reliability-rc to main (page change: buoy card and place wording for a failed update)` — page first; with hub 0.6.7 nothing changes for visitors. Note: the merge also puts `worker.js` 0.6.8 on main before it is live, so main ≠ live hub until step 3.
3. `Approve: deploy hub 0.6.8 from <commit> (content only)`.
4. Watch the next real failed buoy run (D1, R2, live page).

Rollback as in the proposal §9.

## 9. Rev 2 — after GPT's review of `987f97e` (relayed by Chad, 11 Nov)

GPT verified all 312 manifest entries, reran the hub suite independently (21/21; all eight breaks failed with the packet's counts) and read the browser tests. The browser run and its mutations remain Claude's evidence. One fix was required before a page-first merge, plus rulings on §3.

### 9.1 The defect GPT found

`driftFail()` set `failed_at` after awaiting the D1 log, the private R2 write and the counts read, so slow storage moved the reported failure time (GPT reproduced 16:08:58 reported as 16:09:03). **Fixed:** `failed_at` is captured once on entry, before any await, and reused on the conditional-write retry.

### 9.2 Changes

| | Change |
|---|---|
| Hub | `failed_at` captured on entry. Stored counts whose body cannot be **read** are left alone and the failure logged; counts that read but are not JSON count as nothing good to keep and are replaced conditionally (§3.3). |
| Page | **§3.4 ruling:** when the update failed and the good run's records are missing or mismatched, the badge is **unknown** (not degraded). In that state the card shows no count ("–"), the map draws no buoy cells, and the observation line reads "buoy positions not shown". The "Latest update failed at …" line and the "Records withheld: …" reason stay. "Degraded" appears only when a fresh, matched fallback is actually on screen. |
| Unchanged | §3.1 same-run guard, §3.2 fixed public down notes (with the `/status` exception), §3.5 expiry, §3.6 place clause — all agreed by GPT. `app.js` and `sources.html` are byte-identical to rev 1. |

Nothing of the good run stays visible without its records, so no "last-good counts" label was needed.

### 9.3 Revised hashes (code commit `3df9c1a`)

| File | sha256 |
|---|---|
| `phase1/worker.js` | `85737a48c97a0ee1817b3a70883ba4d334b82da4092135a367d25a676c17c427` (293,193 B) |
| `index.html` | `59500752aef111f1a0744fe8fee6e4457734e1f5741d11c399fa167af0113c8a` |
| `app.js` | `9df9dce8cb08234996313b0ddd78d2579216dca8ae62d94b5d1b0f4735de0c0b` (unchanged) |
| `sources.html` | `44b6e42d5bb9a7fb5d4af7e006048b877294dc1a940d2ba88e76553eeb1a0917` (unchanged) |

### 9.4 Hub suite: 27 passed, 0 failed (was 21)

New cases, one per review point:

| Case | Covers |
|---|---|
| 13 delayed storage: D1 log +2 s and each R2 write +3 s; failure at 16:08:58 is published as 16:08:58 while the clock passes 16:09:03 | the defect |
| 13b `failed_at` unchanged across the conditional-write retry | the defect, retry path |
| 14 both objects publish, then the run throws: published pair intact, no `last_attempt`, failure logged | §3.1 |
| 15 cold failure with a distinctive raw error: public down envelope, `/cells`, `/place`, `/` clean; kept in D1, the private object and `/status` | §3.2 |
| 16 stored counts are malformed JSON: conditional replacement; and it loses to a good publish landing in between | §3.3 |
| 17 stored counts body cannot be read: object and etag unchanged, no write attempted, failure logged | §3.3 |

Breaks, each fails (12 now):

| Break | Failing cases |
|---|---|
| `failed-at-late` (new) | 2 (13, 13b) |
| `same-run-strict` (new) | 1 (14) |
| `raw-note-down` (new) | 3 (7, 15, 16) |
| `unreadable-as-empty` (new) | 1 (17) |
| `stamp-failed-time` | 9 |
| `keep-after-good` | 4 |
| `unconditional` | 9 |
| `down-unconditional` | 4 |
| `order-by-retrieved` | 4 |
| `guarded-writedown` | 3 |
| `no-place-cutoff` | 1 |
| `raw-note-public` | 4 |

### 9.5 Page suite: 41 passed, 0 failed (was 35)

Cases 3a (records unreadable) and 3b (records from a different run) now each assert explicitly: badge unknown with the "bad" class and not "warn"; zero buoy points; zero buoy cells; no count; "buoy positions not shown"; the failed-at line on the card and tooltip; no "Showing buoys"; the withheld reason.

Breaks, each fails (11 now): `degraded-without-records` 2 (new) · `cells-without-records` 2 (new) · `count-without-records` 2 (new) · `positions-copy-without-records` 2 (new) · `drop-line` 11 · `showing-without-records` 2 · `no-redraw` 1 · `keep-cells` 1 · `missing-field-is-failure` 2 · `failed-at-run` 6 · `no-degraded` 2.

### 9.6 Regression on rev 2

**Focused run on `3df9c1a` (finished 18:58:24 UTC), all green** — the suites that exercise the changed code:

- Hub: osmc-reliability-hub 27 · drifters-hub 12 · health-hub 29 · history-hub 27 · firms-v2 57 (+7 skipped) · oceanheat-hub 48 · place-rows 7 · kp-degraded 29.
- Browser: osmc-reliability-ui 41 · drifters-ui 25 · buoy-temp-ui 33 · place-ui 30 · cell-perf-ui 43 · mobile-pass 131 · desktop-overflow 112 · fires-wording-ui 35 · kept-ui 21 · smoke-fixes 52 · plastic-ui 29.

**Remaining suites on rev 2: running at this commit; results in the next commit of this packet.**

