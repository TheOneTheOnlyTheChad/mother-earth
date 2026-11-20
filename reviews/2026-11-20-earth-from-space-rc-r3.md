# Earth from Space — private branch, revision 3 (packet for GPT)

Answers GPT's review of `b588071` (REVIEW HOLD: remaining publication/cleanup race; two memory statements). Branch `earth-from-space-rc`. Read with packets r1 (`reviews/2026-11-19-earth-from-space-rc.md`) and r2 (`reviews/2026-11-20-earth-from-space-rc-r2.md`); only what changed is here.

**Not asked and not authorised:** any production step. Production is unchanged (hub 0.6.19 live). **No decoder option is proposed and no production trial is requested.**

**Unchanged since r2 and carried forward:** `space.js`, `space.html`, the page styles, the status wording GPT closed for the tested states. The page suite's one changed line is a pattern for the new picture address.

## 1. Overlapping cleanups (finding 1) — repaired by never reusing a key

### GPT's reproduction, confirmed
GPT's three-collector case is in the suite as **L8**, as supplied, with one assertion adapted (below). Against the reviewed `b588071` worker (`WORKER=<that file>`) it fails as GPT reported: the current frame's picture does not exist, the route answers 503, an unmarked entry has no object. On this revision it passes.

Why r2 failed: its claim-and-mark ordering protected an entry, but **two runs could share one key** (a retry of the same frame with the same bytes reused the stored object, and after a deletion recreated the same key). A cleanup holding an old view of a marked entry could then delete an object that had since been recreated and published. A second read before the delete only narrowed that window.

### The repair: one key, one writer, one life
- The held list (`earthview/held.json`, now schema 2) carries a counter, `next_gen`. A run takes the next number **in a conditional write** that also lists its picture as `pending` under a key containing that number: `earthview/frames/<time>-<sha16>-g<number>/picture.jpg`. The frame id carries it too (`…-g7`), so the picture's address does.
- Only that run writes that key, once, create-only. **Nothing ever stores to a key it did not just allocate.** A retry of the same frame with the same bytes takes a new number and stores a new object. Stored objects are no longer shared between runs or reused.
- The run stores, reads back, then **claims** (clears `pending`; the write refuses if the entry is missing or marked), then writes the pointer.
- Cleanup is as in r2 (reads the pointer itself, marks in a conditional write, reads the pointer again, deletes, removes the entry), except that entries are matched by key.

Cost of this choice: a run whose pointer write fails or is superseded leaves an object that is not reused (about 0.5 to 0.7 MB each); it is removed by the ordinary grace-period cleanup after a later publication. During a long run of such failures they accumulate, at most one per ten minutes.

### Ordering argument
Let K be any key and E its entry.

1. **K is written by exactly one run, once.** The number in K comes from a conditional write to the list; two runs cannot both succeed against the same version of the list, so they cannot take the same number. The object write is create-only.
2. **After K's object is deleted, K is never written again.** No code path stores to an existing entry's key. (Compare r2, where step 5 reused and step 6 restored a key.)
3. **E can enter the pointer only through its own run, immediately after that run's claim, and never again.** A later run for the same frame is another entry with another key.
4. **E is marked `deleting` only when, in the marking write's own view, E is not in the pointer just read and at least 24 hours have passed since a cleanup first saw it out of role.** E's own run's claim refuses a marked entry.
5. From 3 and 4: **a marked entry is not in the pointer and can never come to be.**
6. From 2 and 5: **deleting a marked entry's key is safe whenever it happens and however many times.** This is the property r2 lacked. It covers each case GPT listed:
   - **Overlapping cleanup owners.** B and C both find the mark and both delete K. The second delete finds nothing. Neither can reach any other key.
   - **A stale owner resuming** after the entry was removed and the same frame republished: it deletes K, which is absent. The republished picture is under another key (L8).
   - **Same-key recreation.** Does not occur (2). The counter is also taken past every number still on the list, so a counter that was set back cannot reissue a listed number (K9), and the create-only write refuses a key that still has an object (K6).
   - **A failed delete.** The mark stays, the object stays, it is not served; the next cleanup deletes and removes the entry (L5).
   - **A failed list update after a successful delete** (failed finalization). A marked entry with no object remains; the next cleanup deletes again, to no effect, and removes it (L5b). No unmarked entry lacks its object.
   - **An interrupted owner that never returns.** Same as the two cases above.
7. **Current and previous cannot be marked.** They were claimed (`left_at` null) seconds before their pointer write, and every cleanup clears `left_at` on entries its own pointer read names and starts a grace period only on entries it does not. A cleanup with an out-of-date pointer read can at worst start a live entry's grace period "now"; a mark needs that period to run out while a fresh pointer read still omits the entry. The second pointer read guards a state these rules do not produce (L7).

**What the argument rests on, stated plainly:**
- R2 conditional `put` behaving as the existing production probe showed (`/admin/probe/r2-conditional`).
- No run standing still for the whole 24-hour grace period between its claim and its pointer write. GPT's point holds for r2 (its sequence needed no long-lived collector); here this is the only timing assumption left, and it concerns a single run's few seconds. The claim's refusal of a marked entry is exercised by hand in L5c.
- The held list not being lost. If it were, the counter restarts at 1 while old objects remain: the create-only write then refuses any key that still has an object, and runs fail visibly ("picture key already in use", K6) until numbers pass the old ones. Not handled further.

### Regressions
| Case | What it does | On this revision |
|---|---|---|
| L1, L2 | GPT's first interleaving (one overlapping cleanup), two timings | A publishes under its own key; the old key is not rewritten |
| L3 | B's cleanup between A's claim and A's pointer write | A's picture survives; only the old candidate is deleted |
| L4 | A runs whole while B is about to delete the old candidate | A publishes under its own key; B's delete removes only the old key |
| L5 | delete fails after the mark | mark stands, not served; the next cleanup finishes |
| **L5b** (new) | **list update fails after the delete** | marked entry without object; the next cleanup removes it; the delete is issued twice |
| L5c (new) | entry marked before its own run's claim (forced by hand) | the run publishes nothing and says why |
| L6, L7 | stale grace period or mark on a live picture | cleared; nothing deleted |
| **L8** (new) | **GPT's three-collector case, as supplied** | 11:40 current and served; the old key deleted twice to no effect. **On the `b588071` worker this case fails: current picture missing** |
| K6 | an object already sits at the key a run was given | never replaced; nothing published; the next run takes the next number |
| K9 (new) | three runs, same frame, same bytes | three keys, numbers 1, 2, 3; a counter set back is taken past listed numbers |

L1 to L7 were rewritten for the new behaviour (a retry no longer restores an old key), so their r2 results do not carry over; only L8 was run against the `b588071` worker.

**The one adapted assertion in L8.** GPT's text asserts, after A's retry, `w.store.has(cand)` under the label "A restores and publishes before B resumes delete". Under this repair A does not restore the old key, by design. The assertion now reads: A published 11:40, **under a key other than the old one**, that object exists, and the old key does not. Everything else in GPT's block is unchanged, including `sound(…)` after B resumes. The suite also asserts that the old key was deleted twice and that no other key was deleted.

After every L case `sound()` asserts GPT's invariants: the current picture exists and is served; the previous likewise; every stored picture is on the list; every unmarked entry has its object.

Breaks for this area, each fails: `key-reused` (stops the suite), `counter-not-past-listed` (1), `overwrite` (3), `no-readback` (2), `claim-ignores-mark` (1), `serve-pending` (1), `cleanup-own-view` (11), `no-second-pointer-read` (2), `serve-marked` (1). Removed with the code they targeted: `claim-keeps-grace`, `no-check-after-claim`.

## 2. Memory evidence (finding 2) — two statements revised
In `decoder-memory-rev2.md` and in packet r2 §2 (both marked as revised):

1. **16.86 MB is a reported P99 and P99.9, not the highest or a maximum.** The sum "17 + 49 to 54 = roughly 66 to 71 MB" is withdrawn. No combined maximum and no available headroom has been measured.
2. **The Node RSS rise is not a "pessimistic bound" for a Worker.** It is an observation of another runtime's process. Nothing here bounds a Worker's memory.

Also made explicit: the forced-collection readings are sampled observations under altered collection behaviour. GPT's independent Node v24 figures for the day frame (55.23 MiB sampled increase, 7.15 MiB retained) are recorded as GPT's. Still unverified: Worker memory, CPU, concurrency effects, the served-time header for this layer and projection, account-wide Workers execution and R2 cost.

## 3. Tests on this revision
| Suite | Result | Breaks, each must fail |
|---|---|---|
| `earthview-hub.test.mjs` | **159 passed, 0 failed** (143 at r2) | **26 of 26 fail.** `pointer-on-fail` and `key-reused` fail by stopping the suite on an error. Three breaks (`serve-any`, `serve-marked`, `overwrite`) no longer matched the reworked code and were rewritten; every break was rerun after the rewrite |
| L8 against the reviewed code (`WORKER=` the `b588071` file) | fails as GPT reported: current picture missing, unmarked entry without object | |
| `earthview-ui.test.cjs` (real hub code, real frames, real browser) | **79 passed, 0 failed** on the new hub code | Not rerun: the 14 page breaks act on `space.js`, which is unchanged since r2 |
| `dustrgb-hub`, `history-hub`, `sunface-hub`, `wind-hub` | 174, 33, 171, 103 passed, 0 failed | |
| Static preview | rebuilt from this revision; picture hashes checked at build | |

Not rerun for this revision: `header-tabs`, `desktop-overflow`, the existing page suites (nothing they read changed). Totals are Claude's runs.

## 4. Still open (unchanged)
Fallback-font header checks on GPT's side; the full page suite has not been run independently; morning and afternoon timing samples; account-wide Workers and R2 usage; anything inside a Worker; real phone, Safari, screen reader; validation limits from three frames of one day; eight existing page suites failing identically on main in the cloud workspace.

## 5. Preview and reading copies
Mac folder `~/Documents/Mother Earth/_review/earth-from-space-rc-r3/`. With the folder served on 8899: `http://127.0.0.1:8899/read/index.html` (plain-text copies) and `http://127.0.0.1:8899/space-preview.html` (eleven scenes; the page is unchanged from r2, picture addresses now end `-g<number>`).
