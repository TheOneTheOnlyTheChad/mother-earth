# Mother Earth — handover (8 Nov 2026 16:11 UTC commit time, end of the backlog thread; main `5e37402`)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4d D1 · §5a testing), then this file, then `STATUS.md` (newest first; threads 1–13 in `docs/STATUS-ARCHIVE.md`). **Not a fresh sandbox; don't repeat completed reviews.** This thread's full record is STATUS 8 Nov.

**Access (Chad, 4–5 Nov):** full access — GitHub (push), Cloudflare, Space-Track, the Mac's Mother Earth folder and `~/mother-earth`, browser pane. Chad enters secrets himself; Claude never creates accounts. **Every deploy, schedule or variable change, D1 schema change and push to main that changes the public page needs Chad's explicit go.** Production deploy clicks are Chad's (§3). **Say up front whenever Chad must be at the screen with the app in front** (standing rule). **Production approvals (thread 16): the session's auto-mode safety check lets a production action through only when Chad's message names that exact action — a bare "go" is not enough. So end any message that needs a production action with a ready line, e.g. `Approve: deploy hub commit <sha> (content only)` or `Approve: copy <files> into R2 recovery/`, and Chad replies with it.** Non-production work: "go" is fine. GPT reviews; approvals are Chad's. Not Overwatch: presentation lessons only. No surveillance, ever.

## 0. Live state (production unchanged since the 08:11:22 UTC 8 Nov page release (hub 07:58:25); **main = live**; the backlog thread made docs-only commits, no production change)
| | State |
|---|---|
| **Page** | main `ad4002b`+ (docs since), assets **`?v=202611151000`**. Released 8 Nov 08:11:22 UTC: Kp shown as an interval; honest "degraded" wording (our rule named, never "the source flagged"). Before that: `3375e91` GIBS backdrop NOAA-21 (05:07:54 UTC). Served hashes verified (index `b9d4649e1ac6`, app `e3f4a3854113`, sources `7d66228f07b8`, style `e4c9547d99bf`). |
| **Hub** | **0.6.1 since 8 Nov 07:58:25 UTC.** worker.js sha256 `f38296a0183d14d958d5815d7926254cb4275be7ca00b384334974fad5b12cc8` (= main). Kp degraded only when ≥ 7.5 h past its interval start (provisional policy, not a NOAA deadline; 5 min future-skew tolerance). Envelopes carry `status_reason` (swpc, usgs, co2, seaice, cloud ships). FIRMS v2 ON (`FIRMS_PIPELINE=v2`, `FIRMS_CREATE_ONLY=verified`); 19 bindings. **Rollback:** hub = redeploy 0.6.0 `ac173d8a…58ea`; page = revert `ad4002b`. Each needs its own Approve line; the two are independent. Never redeploy 0.5.3. |
| **D1** | **+ 5 `firms_*` tables + 3 indexes (6 Nov 19:59:43–20:00:03 UTC, FIRMS v2 state).** 9 history tables + 8 indexes **+ `archive_checkpoint_coverage` (empty) + index `collector_runs_layer_finished`** (both created 6 Nov 05:37 UTC, live = `2ee3a62` schema). |
| **History** | ON since 5 Nov 10:21 UTC — keep on. First midnight checkpoint (5 Nov) completed; **fires part is partial** (input 15:30 UTC: the 4 MB guard skipped 15:45–23:45). Details STATUS. |
| **Monitoring** | UptimeRobot 8 monitors (runs, publication, archive, coverage × usgs, firms), all 200 at the last reads. No monitor on swpc. |
| **Branches** | GitHub: `main` + parked `aircraft-rc` (never deploy it as-is) + **`arts-met-rc`** (Arts candidate, awaiting GPT's review; not merged, not deployed). Aircraft reopened 9 Nov for terms/access + feeder clarification only. |
| **Tests on main** | kp-degraded 29/29 · place-ui 30/30 · health-hub 29 · history-hub 27 · firms-guard 19 · firms-v2 57 (+7 need `OLD_WORKER`) · all UI suites pass (container). |
| **Mac copies** | Synced at each step this thread (`~/Documents/Mother Earth` granted 8 Nov; clone in the Mac shell at `$HOME/me-sync`, then cp + cmp over `git ls-files`). |

## 0a. Smoke testing, 8 Nov (GPT + Claude)
- **GPT, 05:14–05:20 UTC** (on `3375e91`) and **GPT, 12:10–12:19 UTC** (on `ad4002b` + hub 0.6.1): no blocking regression in the checks completed; **not exhaustive**.
  - Second run confirmed: hub 0.6.1, served files = `86134b8`, health 8/8 (HTTP 200, healthy), Kp card and Sources agree (interval wording fits at 360/390/430/1280 px), no obsolete wording or NaN, search and inspectors (0.51 MW precision), Everything here from a real click, buoys, plastic, day/night, all orbital categories (32,645 objects; 6 propagation failures and 547 unknown-type disclosed), post-noon imagery = 7 Nov NOAA-21, no console warnings or errors.
- **Claude, 05:47–05:50 UTC** (pane, 588 px): Everything here + all orbital categories pass. This supplements GPT's tests and was not independently reviewed by GPT.
- **Claude, 11:53–12:06 UTC:** noon rollover PASS on fresh loads (06 → 7 Nov). An already-open page keeps its date until reloaded (current behaviour). GPT independently confirmed the post-noon state.
- **Still open:** real-phone / Safari test; browser HTTP status codes. **No degraded path has been seen live:** no layer was degraded and GPT did not inject state; the wording rests on the reviewed tests (kp-degraded 29/29).

## 1. Next (from the backlog thread, 8 Nov, handover commit 16:11 UTC)
**Production unchanged all thread** (hub 0.6.1, page `ad4002b` assets `?v=202611151000`, health 8/8 at last read). Every commit since `114f9f5` is docs/evidence only.

**Where each backlog item stands (details in STATUS 8 Nov, newest first):**
| Item | State | Doc |
|---|---|---|
| R4 Argo terms | **CLOSED; REGISTER entry FILED** (Chad's Approve line, after GPT). CC BY 4.0 on the dataset DOI record (links the GDAC); rsync / `aws s3 sync` supported; no numerical limit found (≠ unlimited). Technical gates open. | `docs/research/R4-argo.md` §12 |
| R3 Earth rotation terms | Rev 4 + research-only REGISTER draft, **not filed**; commercial use UNRESOLVED. **Chad emailed `eopcp@us.navy.mil` 8 Nov — reply pending; no permission inferred from sending or silence.** No follow-up without Chad's go. | `docs/research/R3-earth-rotation.md` §9 |
| R6 ozone terms | Rev 5; GPT accepted the research-only REGISTER draft as an **unresolved evidence record — not filed, not authorised**. | `docs/research/R6-ozone.md` §9 |
| R2 fireballs terms | **Rev 2 awaiting GPT's review** (SSD FAQ public-domain statement corroborated by GPT; reach to the API = interpretation; lightcurve files not established; research-only REGISTER draft, not filed). Identity/validation gates open. | `docs/research/R2-terms-access.md` |
| GIBS stage 1 bench | **CLOSED, accepted by GPT** (rev 2, `cca33e6`). PNG promising; no tie margin, byte cap or eligibility rule adopted; Worker CPU/memory/cost unverified. No shadow record authorised. | `reviews/2026-11-08-gibs-stage1-bench.md` |

**9 Nov additions:**
- Provider enquiries (rev 2): USNO, adsb.lol, Ozone Watch, CNEOS sent — **replies pending**; OpenSky #837506 acknowledgement **supplied** (conditions filed beside REGISTER; not blanket permission); adsb.fi prepared, **not sent**. No permission from sending or silence; record and filing rule in `docs/research/ENQUIRIES-2026-11.md`. No duplicate or automatic follow-ups; draft sign-off "Ta". Keep Chad's address/phone out of the repo.
- **Aircraft: reopened only for bounded terms/access and feeder clarification** (no building, purchase, installation, deployment; `aircraft-rc` parked).
- **Arts release proposal rev 2.1** (`docs/research/P0-ARTS-RELEASE-PROPOSAL.md`, after GPT's reviews of rev 1 and rev 2) awaits Chad's D1–D8; exact Approve line in its §8. Arts stays unselected; nothing built.
- CO₂: GPT's bounded review supports the current card; a historical chart is a possible later proposal, not started.

**Next, all on Chad's go:**
1. GPT's review of R2 rev 2 → corrections if any; filing only on Chad's separate authorisation.
1a. **Arts: candidate built on branch `arts-met-rc` @ `4c4bbb9`** (Chad's branch-only Approve, after GPT accepted rev 2.1). File sha256 `221bb1ca…9644`; hub 0.6.2 on the branch only. **GPT's implementation review done 9 Nov: no blocking defect in its code/test scope** (browser checks Claude-supplied); rollback wording corrected on the branch (`c5005c3`, docs only). R2 billing check **done** (`reviews/2026-11-09-arts-r2-billing-check.md`: inside the free tier, expected $0.00, estimate). Next, each on its own Approve line (wording in the review §6): R2 upload → hub deploy (pin the pre-deploy version first) → live RC → page release. Unreleased page code stays off main.
1b. Timeline concept **rev 3.1** (`docs/concepts/TIMELINE-CONCEPT.md`): Route L and Route W, each with a bounded first gate; GPT suggests considering W first; concept only; any gate needs Chad's go.
2. Remaining backlog: new first gates (R5 coral, R7 tides, R10 solar flares); Phase 0 domain decision (rec. rev 3); GIBS beyond the bench (shadow record / implementation) each a separate decision.
3. Still left open by decision: FIRMS empty-input retry; 8 MiB guard; R11; open-page imagery date until reload; real-phone/Safari test.

**Learned this thread (keep):**
- **Fetch summaries are leads, not evidence, for operative wording.** Twice Claude's web-fetch summaries were wrong on key text (SSD FAQ, R2 rev 1). Operative terms are filed only from a direct extraction (GPT's or Chad's), labelled with who read it.
- **Provenance wording:** when GPT extracts on Chad's behalf, write "GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet" — never imply Chad read the page.
- **"Not found" is bounded** to the named pages and date; no limit found ≠ unlimited; public release / credit request ≠ commercial permission.
- **Mac sync preserves first** (START-HERE §3): differing destination files go to `_sync-preserved/<UTC>/` before overwrite; each is compared with the previous commit. All of this thread's preserved copies matched the previous commit.
- **Timestamps:** STATUS/HANDOVER stamps come from a real clock (a measured reading) or the commit time, labelled as such — never an estimate. The backlog thread's "~HH:MM" stamps ran 1–3 h late (corrected 8 Nov from `git log`).
- Claude's web-fetch tool refuses some hosts (allowlist: e.g. argodatamgt.org, usgodae.org, datacenter.iers.org, ozonewatch.gsfc.nasa.gov) — list those for GPT extraction rather than working around it.

## 1-old. Next as of 12:22 UTC 8 Nov (commit time) (superseded by §1; kept for the record)
1. **Chad chooses the next piece of work** from `docs/BACKLOG-VIEW-2026-11-08.md` (rev 2; GPT agrees Kp first, now done):
   - **(a) a bounded terms review** of R2/R3/R4/R6, read-only. It reads each provider's reuse terms and files the operative sentences in REGISTER. It may clarify rights but **clears no source**, and R2 also has open identity, validation and acceptance rules.
   - **(b) the GIBS bench + shadow record** (`docs/GIBS-FALLBACK-PROPOSAL.md` rev 3), read-only in the workspace or pane: PNG served?, ranking agreement across resolution/format, CPU, ~7 days of shares. A hub job is a separate rollout.
   - Then new first gates (R5 coral, R7 tides, R10 solar flares). Nothing is started until Chad says go.
2. **Phase 0:** recommendation rev 3 (`docs/research/P0-RECOMMENDATION-DRAFT.md`) is ready for Chad's separate domain decision. The iPhone Safari runs (×3, screen-recorded) are pending his availability and are **not** a prerequisite. Arts scoped-cleared, unselected; Life stopped.
3. **Left open by decision** (each needs its own review and go): FIRMS empty-input retry; raising the 8 MiB guard; R11 FIRMS late arrivals (an unmeasured question); an open page not rolling its imagery date until reload (noted in GIBS proposal rev 3 §4).
4. **Watch (read-only, optional):** the first real `degraded` envelope on 0.6.1 (any layer), to see the new wording live once. `SELECT layer, status, finished_at FROM collector_runs WHERE status='degraded' AND finished_at > '2026-11-08T07:58'`.
5. Standing: aircraft parked (research included); no prototype, domain selection or Phase A without a separate decision; production actions need Chad's exact "Approve: …" line; Claude never types secrets; say up front when Chad is needed at the screen.

**Older items below are kept for the record.**
0. **Phase 0 position (7 Nov ~13:25 UTC):** Arts CLEARED for the limited feasibility gate (metadata-only view of the Met's catalogued places of making, 479 objects / 25 countries; qualifications in `docs/research/P0-arts-planet-recovery.md` and `P0-CHECKPOINT.md`); may be recommended first, not selected. Planet cold load and desktop width DONE 7 Nov 13:32–13:43 UTC (Chrome Guest; `docs/research/p0-recovery/planet/`). **Next action: iPhone Safari runs (Chad, another day; screen recordings), then a Phase 0 recommendation for Chad's separate domain-selection decision. Life stopped; aircraft parked; no prototype, collector, resource, production change, deploy or merge. The pane belongs to the FIRMS thread when the Mac is open; 8 Nov 02:40–03:00 SAST reserved.
1. **Monitor 0.5.2 (deployed 6 Nov 05:53:57 UTC, verified) — schedule these in the new session (thread 16's check-ins were cancelled at handover):** **~14:20 UTC 6 Nov** — first FIRMS runs over 4 MB: `collector_runs` firms ok with records (not "resource guard"), raw sizes in `raw/firms/2026-11-06*`, Exceeded Memory = 0 (Worker metrics / telemetry), CPU per firms tick, `/status` `collection.firms`; if still under 4 MB, check again ~16:00. **~00:50 UTC 7 Nov** — `archive_checkpoints` + `archive_checkpoint_coverage` for 6 Nov (`assessed_with_checkpoint = 1`), 5 Nov coverage backfilled (`= 0`), `fires_daily` 6 Nov, drifter full day (rows + bytes), CPU of the 00:30 ticks. All read-only. If Exceeded Memory appears: tell Chad; rollback = redeploy 0.5.1 from `8c8633d` (`1f34554b…`), with an Approve line. Production memory is not guaranteed by the bench (one sampled 112 MB heap peak at 8 MiB under overlap).
2. ~~5 Nov fires recovery~~ **WRITTEN to R2 6 Nov 08:19:35 UTC and verified** (`archive/recoveries/firms/2026-11-05.json.gz`, sha256 `624ecf2e…`; review §10). D1 recovery tables wait for an agreed querying requirement. The procedure's byte-transfer step needs fixing before reuse (review §10). Showing recovered data anywhere is a separate, later decision.
3. ~~Merge `firms-guard` → `main`~~ **DONE 6 Nov ~08:05 UTC** (`909e8cd`; worker.js on main = live 0.5.2). Branch `firms-guard` can be deleted on GitHub (Chad; the session proxy refuses ref deletes).
3a. ~~Smoke-review fixes~~ **PUBLISHED 6 Nov 10:03 UTC** (main `e107c1d`, assets `?v=202611131000`; served hashes verified; public checks passed — STATUS).
3b. **Monitoring LIVE: hub 0.5.3 + UptimeRobot (8 monitors, Free, phone push tested with the Mac closed 6 Nov).** `hub-health` **merged to main as `59f4cda`** (main = live 0.5.3); the branch can be deleted on GitHub (Chad). FIRMS memory design rev 3 (`docs/FIRMS-MEMORY-DESIGN.md`, design only) awaits GPT. Chad decides when routine overnight check-ins retire. Original plan: from GPT's brief (`docs/briefs/2026-11-06-monitoring-and-memory.md`): `/health/*` endpoints for UptimeRobot (external; free plan terms to confirm), review `reviews/2026-11-06-hub-health.md`, design `docs/FIRMS-MEMORY-DESIGN.md`. Next: GPT review → Chad's go → deploy with an Approve line → UptimeRobot setup by Chad → acceptance test (alert on his phone with the Mac closed) → retire routine overnight check-ins.
3c. ~~Fix: header-only FIRMS file after midnight logged as malformed~~ **FIXED in 0.6.0 and proven live** (8 Nov 00:00–00:45 UTC runs took the boundary path; health 8/8).
3d. ~~FIRMS memory v2 rollout~~ **CLOSED 8 Nov** (stage 6 passed, GPT accepted; merged `0891d13`). Left open by decision:
   - the bounded empty-input retry (refining it needs its own review);
   - raising the 8 MiB guard (a separate decision; bench: v2 completed 16/32/64 MiB within 64 MB in a bench copy);
   - ~~the GIBS backdrop fix~~ **NOAA-21 switch RELEASED 8 Nov** (`3375e91`); a measured fallback rule stays a separate proposal (hub work, own review and go); real-phone check outstanding.
   - place-ui harness: 2 pre-existing failures (its fake R2 lacks `head()`, used by hub 0.6.0) — a small test-only fix, not yet done.
4. ~~Drifter first full day~~ **6 Nov: 17,915 rows / 1,302 buoys / ≈2.1 MB content** (STATUS 7 Nov).
4b. **Drifter first full day (6 Nov)** — rows/day + bytes after 00:30 UTC 7 Nov (the 5 Nov partial-day estimate ~23,700/day is provisional).
5. ~~Plastic's first archived version~~ **arrived 6 Nov 06:08 UTC.**
6. **Research backlog** (`docs/RESEARCH-BACKLOG.md`, research only — index table at the top). **R2 fireballs PARKED** (Chad, 5 Nov; `docs/research/R2-revision-matching.md` rev 3 + evidence on the Mac at `~/Documents/Mother Earth/research/fireballs/2026-11-05-claude/`). Next tier-1 items: **R3 Earth rotation (USNO/IERS)**, **R4 Argo**. Same first gate for every item. No build, collector, schedule, deploy, purchase or third-party contact without Chad's go.
7. **Mac copies:** synced at every handover by cloning the repo inside the Mac shell (`device_bash`: `git clone --depth 1 https://github.com/TheOneTheOnlyTheChad/mother-earth.git`) and copying with a hash check (START-HERE §3).
8. Carried over: real-phone check of the mobile pass (Galaxy); NCEI accession recheck; plastic research follow-ups; attribution placement; Possible futures (research only).

## 2. Done in thread 15 (details in STATUS)
- History trial on (10:21 UTC), measured tick by tick.
- "no history kept" fallback removed from the public page (`bd17401`), with a guard test.
- orbital-browser: 2 failures fixed (`66c1a8c`, `e5bac15`), then a shifted fixed-start clock + 3-day boundary cases (`32a29b0`) — **113/113**; page unchanged.
- R2 fireballs: independent re-check, revision-matching proposal rev 3, parked (other thread, same day).
- Research backlog R1–R9.
- STATUS trimmed: threads 1–13 moved verbatim to `docs/STATUS-ARCHIVE.md`.

## 3. Learned (threads 14–15)
| | |
|---|---|
| Fake clocks in tests | the hub stamps times with `new Date()`; faking only `Date.now` makes a test pass only on the day it was written (plastic-hub only passed on 4 Nov). Fake the no-argument `Date` constructor too (see history-hub / plastic-hub). |
| Mutable state + overlap | a single R2 state pointer failed four ways (failed write, out-of-order runs, overlapping runs, finished work later called lost). Replaced with append-only D1 facts + a completion marker checked first and written last, and inputs chosen afresh by full timestamp. Apply the same pattern to any future recoverable job. |
| `+''` is 0 | a missing CSV value parsed with `+x` becomes 0; FIRMS FRP was published as 0 MW. Parse empties as `null`. |
| SQLite MIN+MAX | one query with both MIN and MAX scans the whole index; two single lookups are index searches. Check `EXPLAIN QUERY PLAN` (node:sqlite) for any query on a growing table. |
| `insertAdjacentHTML('beforeend', '<tr>…')` on a `<table>` | the rows land in a new `<tbody>`, so `tr:not(:first-child)` leaves one stale row per refresh. Remove `[...t.querySelectorAll('tr')].slice(1)`. |
| `data-layer` | already the page's toggle attribute; new buttons must not reuse it (the place view uses `data-place-layer`). |
| Fonts in the container | Google Fonts are blocked, so container width measurements are the **fallback-font** case; use `@fontsource` (spike) for the real faces. |
| Hidden pane | `resize_window` to 390 gave a 588 px page while the pane was hidden; ask Chad for the app in front for an exact phone-size visual check. |
| D1 from the dashboard | `POST /api/v4/accounts/<acct>/d1/database/<id>/query` with `x-atok` runs one statement (database id from the Worker settings' `DB` binding); see START-HERE §4d. |
| Safety check on production clicks | the session refuses Claude's clicks that deploy to production or write a production variable, even with Chad's consent in chat. Claude fills the form and verifies; **Chad clicks the deploy button**. Tell him up front. |
| Breaks must bite | when adding a guard test, break something the guard alone can catch — removing sea ice's kept line did not fail (its history line still supplies text); removing ships' did. |
| Pinned fixtures vs the wall clock | a fixture with fixed epochs drifts against `Date.now`; a test that agreed on the build day can fail days later (orbital-browser, 5 Nov). |
| Auto-mode safety check (thread 16) | It reviews every Claude action; by default it trusts only the working copy + its GitHub repo, so Cloudflare/R2/D1 are external and production deploys / shared-storage writes are default blocks. **It allows them when Chad's message names the exact action** (the 0.5.2 deploy passed on "DEPLOY HUB 0.5.2 … my explicit go"; an R2 copy after a bare "go" was refused). `/permissions` is not available in cloud chats. Standing trust rules were drafted (`~/Documents/Mother Earth/setup/automode-mother-earth.json` + `apply-automode.py` → `~/.claude/settings.json` on the Mac); **Tested 6 Nov 10:38 UTC (thread 17): they do NOT reach cloud sessions.** A bare "go" R2 copy into `recovery/` was refused again ("Modify Shared Resources"). Keep using `Approve: …` lines. Claude never edits these rules itself. |
| Pulling big files through the pane | `javascript_tool` results over the token cap are saved to a file (`tool-results/…txt`) without entering context: gzip in the page (`CompressionStream`), base64, return 150 k-char slices, reassemble with python, hash-check. Used for the 5 Nov checkpoint (2.96 MB) and the 15:30 raw (3.8 MB). |
| GitHub branch deletes | the session proxy refuses ref deletion (git push --delete and the API). Leftover branches stay until Chad deletes them on GitHub. |

## 4. Where things are
| | |
|---|---|
| History + place hub tests | `node --no-warnings phase1/history-hub.test.mjs` (27; real SQLite via `node:sqlite` + `schema.sql`) |
| Place UI | `node --no-warnings phase1/place-ui.test.cjs` (30; the page's `/place` answered by the real `worker.js`) · `node phase1/place-rows.test.mjs` (7) |
| Retention wording | `node --no-warnings phase1/kept-ui.test.cjs` (21; off/on/off-after-trial/unreadable + transitions; table-growth check; every layer has a kept statement) |
| Desktop overflow | `node phase1/desktop-overflow.test.cjs` (112; needs `@fontsource/ibm-plex-mono@5` + `@fontsource/barlow-condensed@5` in /home/claude/spike) |
| Test setup, new container | `/home/claude/spike`: `npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs astronomy-engine @fontsource/ibm-plex-mono@5 @fontsource/barlow-condensed@5`; `mkdir -p /home/claude/fixtures && node phase1/orbital-fixture.build.mjs`; static server `python3 -m http.server 8899 --bind 127.0.0.1` via Bash `run_in_background` (with a long `timeout`, or it stops after 30 min) |
| Reviews | `reviews/2026-11-05-landscape-comparison.md` (rev 2) · `…-place-view-and-history.md` (rev 5) · `…-place-view-candidate.md` (§1–§12) |
| Orbital browser | `node phase1/orbital-browser.test.cjs /home/claude/fixtures` (113; stale = objects whose elements initialise; fixed calculation time + 3-day boundary cases) |
| Research backlog | `docs/RESEARCH-BACKLOG.md` (R1–R9, research only) |
| Older status | `docs/STATUS-ARCHIVE.md` (threads 1–13, verbatim) |

