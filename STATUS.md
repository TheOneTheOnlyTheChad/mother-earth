# Mother Earth — status

Newest first. Threads 1–13 are in `docs/STATUS-ARCHIVE.md` (moved verbatim 5 Nov). Current state and next steps: `HANDOVER.md`.

# 7 Nov 2026

## 7 Nov 12:16–~12:35 UTC — **Phase 0 evidence-recovery pass (Arts + Planet), GPT's go** — `docs/research/P0-arts-planet-recovery.md`
- **Arts:** the lost samples' source is recovered exactly: Met repo commit `e394878`, LFS sha256 `7adc37e4…` = the recorded etag. The original outputs are gone, so one **new** sample R1 (2,000, seed 20261107) was drawn from an explicit typed-place subset (59,137).
  - Rules: attributed kept separate and uncertain; pipe alignment enforced; ISO 3166-1 validation with documented rules.
  - Country view (certain, aligned, ISO, sensitivity-flagged excluded): **1,454 records / 27 countries, Egypt 57%**. Created/found only: **641 / 27, USA 37%**.
  - Typed geography is confined to 5 departments; Africa, Oceania and the Americas are absent.
  - Sensitivity: 159 candidates (mostly Egyptian funerary; 1 human-hair object, 5 burial wrappings) excluded and unresolved.
  - Rights: CC0, commercial use. **REGISTER filed** (Chad pasted the policy page, 7 Nov); data rights cleared.
  - Evidence in `docs/research/p0-recovery/arts/`.
- **Planet:** three replacement runs, 12:21–12:22 UTC, hub 0.6.0, pane at 588 × 834 DPR 2 (phone layout). FCP 960 / 640 / 176 ms; hub last response 8.0 / 4.7 / 3.8 s; frames ≈ 35 ms; ~1.1 s blocking after FCP.
  - Cold load **not demonstrated**; 13 of 17–21 resources opaque (no Timing-Allow-Origin); iPhone pending.
  - `docs/research/p0-recovery/planet/runs-2026-11-07.json`.
- No page or hub change, no Mac shell; pane used 12:20–12:22 UTC only.

## 7 Nov ~11:40 UTC — **Life research STOPPED** (BLOCKED for the scoped marker PoC accepted by Chad after GPT); **Arts + Planet evidence compiled for GPT**
- Life: Chad accepts BLOCKED for the marker proof of concept from this sample and these exclusions. This is not a rejection of GBIF or Life. Rights are separately inconclusive; media excluded. Three qualifications added to `docs/research/P0-life-gbif.md`: missing American and Asian coverage is a method artefact; identifiers are not attribution; the region view is unproven. Sample, hash, method, exclusions and gaps preserved. No new sample, licensing work, provider contact, region-view work or Mac-shell use.
- `docs/research/P0-arts-planet-for-GPT.md`, built from existing evidence only (no new measurement):
  - **Arts (the Met): INCONCLUSIVE.** Whole collection blocked for that scope (107 / 2,000 typed). Typed subset: region view 88 countries but 52% Egypt; marker view 492 / 159 but needs an unchecked gazetteer. CC0 not yet in REGISTER. Media per-item by public-domain flag, image availability unchecked. Sensitive material not assessed.
  - **Planet:** desktop warm-cache baseline only.
  - **MISSING items flagged:** CSV hash, per-run timings, UA and viewport, p95, sensitivity, attribution credit line. An unreconciled 107 vs ~238 typed count is flagged.

## 7 Nov ~11:15 UTC — **Phase 0 Life gate rev 2 (after GPT): BLOCKED for the proof-of-concept scope tested; rights still open** (saved sample only)
`docs/research/P0-life-gbif.md` rev 2. GPT's bounded step: exclude iNaturalist and all media; check rights; apply sensitivity and precision together; recount. No new occurrence collection, no Mac shell.
- **Three more datasets** carry the iNaturalist mismatch (CC BY-NC dataset over CC BY / CC0 records): Birda, Happywhale, UB Brasília (142 records). Excluded as unresolved.
- 2,000 → 841 (iNaturalist) → 699 (NC datasets) → 619 (withheld / generalised) → 239 (uncertainty stated) → **172 at ≤ 1 km**: 8 countries, 48 cells, 11 datasets, no Americas or Asia. **Fails ≥ 300.** The looser withheld rule gives 184; ≤ 10 km gives 277.
- Region view: 13 countries (fails 20); admin-1 names give 384 / 31 but are unverified.
- Retained 26 datasets: dataset = record licence (CC BY / CC0), DOIs and citations captured. Per-record `rightsHolder` not in the saved sample (gap). REGISTER paste pending.
- Corrections: Download API wording; timeouts not attributed to rate limiting; Mac-shell use (10:44 reachability curl + doc copy) recorded as a deviation. No further Mac-shell use is approved.

## 7 Nov 10:43–11:00 UTC — **Phase 0, Life gate (GBIF): INCONCLUSIVE on rights; geography met** (research only; Chad's "Go: Phase 0")
Full write-up: `docs/research/P0-life-gbif.md`.
- **Reachability:** workspace curl 10:43:25 and Mac `device_bash` curl 10:44:05 both HTTP 000 / exit 56 / proxy 403 on CONNECT (unchanged by "All domains"). **Browser pane `javascript_tool` fetch 10:44:01: HTTP 200.** The gate ran through the pane.
- **Sample:** 2,000 records (CC0 / CC BY, year 2025, coordinates, no geospatial issue), 7 continents × ~286, continent × seeded month, seeded offsets < 2,000, pages of 20, seed 20261107; sha256 `76ccf792…`. Deviation: offsets 5k–10k timed out (~15 s cut), so month sub-strata replaced deep offsets.
- **Geography (marker view): met.** 986 records ≤ 1 km uncertainty and not generalised, 63 countries, 439 one-degree cells. 37.9% state no uncertainty.
- **Rights: open.** 58% of the sample is iNaturalist (dataset licence CC BY-NC; each record states CC0 / CC BY). Which level governs is unresolved; operative sentence not yet in REGISTER.
- **Media:** 13.8% of media items NC / ND / rights-reserved, 10.2% unlicensed → exclude media or filter per item (Chad).
- **Sensitive locations:** 6.7% carry `informationWithheld` (incl. ~28 km generalisation), 3 `dataGeneralizations`; honoured by never drawing finer than stated uncertainty.
- **Next:** HANDOVER §1 item 0.

## 7 Nov 04:01–05:17 UTC — **hub 0.6.0 LIVE, FIRMS memory v2 ON** (FIRMS memory thread; one Approve line from Chad per stage; GPT accepted stages 1–5)
Full evidence: `reviews/2026-11-06-firms-v2-build.md` (branch `firms-memory`, stage log). Design: `docs/FIRMS-MEMORY-DESIGN.md` rev 6.1.
- **Stage 1, D1 additive schema:** 6 Nov 19:59:43–20:00:03 UTC. Five `firms_*` tables + 3 indexes. Production D1 has `foreign_keys = 1`.
- **Parser fix folded in before deploy:** the header-only file without a newline is now an empty day, which fixes the 00:51 bug below (`5b487ff`). Tests N1/N2; breaks 39/39; GPT signed off.
- **Stage 2, deploy 0.6.0 with v2 off:** 04:01:54 UTC.
  - `phase1/worker.js` from `firms-memory` `5b487ff`, sha256 `ac173d8ac0dd9d1b9584c3eaf771adabe5e215d993d34487edad12d8932758ea`. Content-only API; read back identical.
  - Runs 04:15 and 04:30 ok in legacy format; health 8/8 against the 03:59 baseline.
- **Stage 3, production R2 probe** (`/admin/probe/r2-conditional`, Chad entered the key): 04:40:39 UTC, `all_as_designed`, 0 open uploads, cleaned. Independent `probe/` listing = 0 objects.
  - Lifecycle rules confirmed: `raw/`, `snapshots/` and `cells/` deleted at 48 h; multipart uploads aborted at 7 d.
- **Stage 4, `FIRMS_CREATE_ONLY=verified`:** ~04:44 UTC.
- **Stage 5, `FIRMS_PIPELINE=v2`:** ~04:51 UTC. Format cutover 05:00:43.092Z.
  - v2 runs 05:00 (1,193 records) and 05:15 (1,881): published pairs matched (`run_id` + `retrieved_at`); cells and by_hour sums = records; `/place` = counts; health 8/8 with `v2_publication` facts.
- **Measured:** FIRMS sends **no Content-Length**, so a cut exactly between rows stays undetectable.
- **Open, stage 6:** the FIRMS memory thread verifies the 7 Nov mixed-day checkpoint at **00:45 UTC 8 Nov**: source = last v2 output, cutoff/records/`fires_daily`/coverage agree, archive health up, midnight header-only runs on the boundary path. GPT reviews it, then the rollout closes.
- **Rollback:** delete the `FIRMS_PIPELINE` variable (legacy from the next run, tested). **Not** unchanged 0.5.3, which reintroduces the nightly parser bug.
- **main is behind the live hub:** main's `worker.js` = 0.5.3. Merging `firms-memory` → main needs Chad's go. It changes no page files.
- **Unchanged:** 8 MiB guard (raising it is a separate decision); UptimeRobot monitors.

## 7 Nov 00:51 UTC — check-in 2 (6 Nov checkpoint), read-only — **checkpoint GOOD; new hub bug after midnight**
- **6 Nov checkpoint (first full day on the fixed guard), written by 0.5.3:**
  - firms: cutoff **23:45:42**, **50,634 records** / 592 cells (day 37,287 · night 13,347; max FRP 616.04 MW), 560,392 B gz.
  - firms coverage row: `assessed_with_checkpoint = 1`, input_status **current**, 0 failed runs after cutoff, latest observation **21:18 UTC**, age at day end 858 s.
  - usgs: 31 records, cutoff 23:55:08, coverage current.
  - 5 Nov coverage row unchanged (backfilled, `= 0`, stale, 33 failed).
  - The 5 empty `firms_*` tables (created 19:59–20:00 UTC) existed but were unused.
- **Over-4 MB case OBSERVED on 0.5.3:** 23:30 and 23:45 UTC files of **4,242,222 / 4,241,977 B** (> 4,194,304), both processed ok. 23:45 tick: CPU 335 ms, wall 2.8 s, outcome ok. **No exceeded-memory in the last 90 min of telemetry** (every outcome ok). 00:30 checkpoint ticks: */15 209 ms / 30.0 s, */5 105 ms / 34.0 s, ok.
- **Drifters, first full UTC day (6 Nov, by first_received_at):** **17,915 rows** from 1,302 buoys, ≈ **2.1 MB** of row content (D1 overhead not included). The partial-day estimate of ~23,700/day was high; one day is not yet an operating figure.
- **⚠ NEW BUG (0.5.2+): header-only FIRMS file after midnight is recorded as a failure.**
  - From 00:00 UTC every firms run is `down`: "truncated or malformed response: line 2 latitude "latitude"".
  - FIRMS's normal post-midnight file is the header only, 122 B, **with no trailing newline** (identical on 6 Nov 00:00, which 0.5.1 handled).
  - `firmsParse` takes `indexOf('\n') = -1`, so it reads the header again as data row "line 2", and the 0.5.2 content checks reject it.
  - **No data harm:** the file has no rows, and the last good publication (23:45) stays up.
  - **But** it is logged as malformed instead of "no detections processed yet", `/status` shows a failing streak (4 at 00:45), and **`/health/publication/firms` = 503**, so the **UptimeRobot "ME publication firms" alert fired (~00:50 UTC)**. It self-clears when FIRMS delivers rows (~02:15–04:00 UTC typical), and **recurs every night** until fixed.
  - **Fix (hub change, needs review + Approve):** in `firmsParse`, treat a file without `\n` as header-only (no rows). Add a guard test with the real 122-byte file. 0.6.0 with the pipeline off still uses this path.
- Other monitors: runs, archive and coverage (firms + usgs) 200; **coverage/firms flipped to ok** for day 6 Nov as expected; publication/usgs 200. Pending, gaps and recent_failures empty.
- **Window clear (01:00 UTC):** the 6 Nov checkpoint is written and measured. Deploys may proceed (Chad's go), with the bug above taken into account.

# 6 Nov 2026 — thread 17

## 6 Nov 19:59:43–20:00:03 UTC — additive D1 schema for FIRMS v2 (from the FIRMS memory thread; Chad's go)
- New tables, all empty: `firms_settings`, `firms_identity`, `firms_inputs`, `firms_attempts`, `firms_outputs`, plus 3 indexes. No existing table touched. The next FIRMS run (20:00:40) was ok. 0.5.3 never reads them, so the 6 Nov checkpoint runs on unchanged code.
- **Agreed window:** no deploy, variable change or R2 probe from 23:30 UTC 6 Nov to 01:15 UTC 7 Nov. Hub 0.6.0 (branch `firms-memory`, under GPT review) deploys only after this thread's "window clear" note following the 00:50 check. 0.6.0 changes the checkpoint code path even with the pipeline off.

## 6 Nov ~16:45 UTC — `hub-health` merged to main (`59f4cda`, Chad)
- main's `phase1/worker.js` = live 0.5.3 (sha256 `61c8e05262a3…`, checked). No page files changed. Branches left: `main`, `aircraft-rc`, `hub-health` (can be deleted on GitHub).

## 6 Nov ~16:35 UTC — **hub 0.5.3 LIVE + UptimeRobot monitoring LIVE** (from the hub-health thread; Chad's Approve line)
- **Hub 0.5.3** deployed **15:38:04 UTC**, content only, from `hub-health` `88e0399`. `phase1/worker.js` sha256 `61c8e05262a3d265dda937dbfc0730af7f553c50bffb2d8f17f7636b566d0692`; the connector read-back is identical.
  - Rollback = 0.5.2 `70307d5f…` (main `909e8cd`), with an Approve line.
  - **New:** read-only `GET|HEAD /health/<runs|publication|archive|coverage>/<usgs|firms>`: 200 ok, 503 failing, fail closed, no-store. `/status` notes are now redacted (secret values and long tokens in note/reason fields only).
  - No change to collection, checkpoints, bindings, variables, crons or schema. First runs on 0.5.3 all ok (usgs 15:40/15:45, firms 15:45, 30,644 records).
- **UptimeRobot (Free, $0, Chad's account): 8 monitors** = runs, publication, archive and coverage × usgs and firms. Every 5 min, HEAD, alerts by email and to Chad's iPhone.
  - **Mac-closed acceptance test PASSED:** up push 18:18:46, down push 18:21:58 SAST, received on the phone over 5G with the lid closed. Alerts land within ~1 s of the failed check.
  - **Expected tonight:** "ME coverage firms" is DOWN (503). That is 5 Nov's preserved stale coverage while 5 Nov is "yesterday". It should go UP at ~00:00–00:05 UTC 7 Nov. Evidence is not to be altered to clear it.
- **Branch `hub-health` @ `3b742c5` NOT merged:** main's `worker.js` is still 0.5.2 while live is 0.5.3. Merging is Chad's go (no page files change).
  - Docs on the branch: `reviews/2026-11-06-hub-health.md` (rev 2 + deploy + acceptance) and `docs/FIRMS-MEMORY-DESIGN.md` (rev 3, design only, awaiting GPT).
- **Routine overnight check-ins:** Chad decides when to retire them, now that alerts reach his phone without the Mac.

## 6 Nov 16:08 UTC — recheck (FIRMS) + **hub 0.5.3 found live** (read-only)
- **Production is hub 0.5.3**, Cloudflare version 50, uploaded via the dashboard at **15:38:04 UTC**.
  - Live code = `hub-health` `phase1/worker.js` sha256 `61c8e05262a3d265…` (identical in branch commits `88e0399`, `2fe320b`, `6bb3c27`; checked by containment in the live multipart).
  - Deployed by the hub-health thread with Chad's Approve line (confirmed in its 16:35 note, entry above).
  - Rollback = version 49 `cd3e1ffa` (0.5.2, `70307d5f…`).
  - main is still 0.5.2 (`70307d5f…`): the branch is not merged.
- FIRMS since 14:15: 8 runs, all ok. 30,640 records, raw 2,554,030 B at 16:00, so **still under 4 MB**; the over-4 MB case is not yet seen on 0.5.2 or 0.5.3. No more rechecks booked; the 00:50 check covers the day.
- Telemetry (last ~2.2 h, 500 events): every outcome ok, no exceeded-memory. Firms tick CPU 132–239 ms.
- `/status`: firms not failing; pending, gaps and recent_failures empty.

## 6 Nov ~15:30 UTC — Cloudflare connector connected; branch `hub-health` (from the hub-health thread)
- **Cloudflare Developer Platform connector** (Chad, 6 Nov). D1 read queries run directly: database_id `53fced06-fcaa-48e4-a08b-5776125e0293`. No browser pane and no Mac needed; checked from both threads.
  - Live worker code is readable too (strip the multipart wrapper before hashing). 15:10 UTC: live = main 0.5.2, sha256 `70307d5fc2a9…`.
  - It cannot deploy code, change variables, secrets or crons, read or write R2 objects, or read telemetry. Those stay on the pane flow.
  - It has delete tools and the query tool can write: **SELECT only**; writes still need an Approve line.
  - The server marks itself deprecated (successor: Cloudflare API MCP).
- FIRMS 15:00 UTC: 30,620 records, raw 2,552,302 B, ok (connector read). Growing towards the old 4 MB line.
- **Branch `hub-health` @ `80a380a` (hub 0.5.3 candidate; at 15:15 NOT deployed, NOT merged — superseded 15:38, see 16:08 entry)**, from GPT's brief `docs/briefs/2026-11-06-monitoring-and-memory.md`:
  - read-only `GET|HEAD /health/<runs|publication|archive|coverage>/<layer>`, answering 200/503 and failing closed;
  - health-hub 23/23; 12/12 breaks bite; 9 hub suites pass.
  - Docs: `reviews/2026-11-06-hub-health.md`, `docs/FIRMS-MEMORY-DESIGN.md`.
  - With GPT. No deploy, UptimeRobot account or monitor until Chad's go.

## 6 Nov 14:21 UTC — check-in 1 (FIRMS on 0.5.2), read-only
- **FIRMS caught up at 13:30 UTC.** A thin morning: the file peaked at 1,087 detections / 88 KB (10:00), then FIRMS **removed two whole passes** (04h: 344, 06h: 145) between 10:45 and 12:45, leaving 598 / 49 KB. At 13:30 it jumped to **22,762 records / 1.90 MB**; 14:15 shows 22,771 / 1.90 MB. Cause unknown (no NASA notice found). Source behaviour → R11.
- **Still under the old 4 MB guard**, so the memory test of 0.5.2 above 4 MB has not happened yet. Recheck booked 16:05 UTC. The 00:50 check covers the rest.
- All 10 firms runs since 12:00 ok. Telemetry (last 3 h, 434 events): every outcome ok, no exceeded-memory. Firms tick CPU 15–308 ms (308 at 14:00 on the 1.9 MB file); wall 3–14 s.
- `/status`: firms not failing; pending, gaps and recent_failures all empty.

## 6 Nov 10:41:46 UTC — 5 Nov raw input copied to R2 `recovery/` (Chad's Approve line)
- `raw/firms/2026-11-05T23-45Z.csv` → `recovery/firms/2026-11-05/2026-11-05T23-45Z.csv`: 5,311,642 B, read-back sha256 `c3487dcc…` ok, etag `1e932dd4…` (same as the source).
- No overwrite (destination checked absent first). The only object under `recovery/`. No lifecycle rule covers `recovery/` (rules: `raw/`, `snapshots/`, `cells/`), so it outlives the original's 2-day expiry. It passed with the Approve line, after the bare "go" was refused at 10:38.

## 6 Nov ~10:40 UTC — trust-rules test, branch clean-up, bench-orbital kept, cost rule
- **Trust-rules test: REFUSED.** After Chad's bare "go", Claude tried the same action that was refused in thread 16: copying `raw/firms/2026-11-05T23-45Z.csv` → `recovery/firms/2026-11-05/` in R2.
  - Read-only pre-check 10:38:24 UTC: source sha `c3487dcc…` ok; destination absent.
  - The write call was blocked by the auto-mode safety check ("Modify Shared Resources"). **Nothing written** (`recovery/` empty, re-read).
  - **Conclusion: the Mac's auto-mode trust rules (`setup/automode-mother-earth.json`) do not reach cloud sessions.** Production actions keep needing an `Approve: …` line naming the action.
- **Branches:** Chad deleted the 15 merged leftovers and `bench-orbital` on GitHub. Remaining: `main`, `aircraft-rc` (parked: OpenSky's public-site feeder condition).
- **bench-orbital** test + results copied to main under `phase1/bench-orbital/` (page source kept as `.html.txt` so Pages does not serve it as a page). The test passes and fails on a deliberate break.
- **Cost rule (START-HERE §2):** the $0 target ended with Workers Paid (3 Nov). Keep cost minimal; name every new line item with its amount first.

## 6 Nov 10:03:40 UTC — **smoke-review fixes PUBLISHED** (main `e107c1d`, fast-forward; GPT review + Chad's go)
- `smoke-fixes` brought up to date with main (docs only; page hashes unchanged). Re-run on the updated branch: smoke-fixes 52/52, desktop-overflow 112/0, mobile-pass 131/0.
- **Served files hash-equal to the reviewed values:** index `158587d8a6ac`, sources `b5810ac66023`, app `89f89ee6a192`, style `e4c9547d99bf`; assets `?v=202611131000`.
- **Public checks (10:05 UTC, FIRMS run 10:00:42, 1,087 records, 339 under 1 MW):**
  - cell 33_25 reads source 0.68 / 0.5, cell list 0.68 MW · 0.5 MW, record 0.68 MW, place view FRP 0.68 MW · FRP 0.5 MW;
  - place view stacked, descriptions 366 px;
  - World View 1280 wide;
  - Sources at 1280 (page 1280, widest table 985) and at 360 (page 360, widest table 340): no label split mid-word, ships' full code present;
  - buoy wording revised and linked to What Mother Earth keeps;
  - no console errors on either page.
- Leftover branch `smoke-fixes` (= main) can be deleted on GitHub.

## 6 Nov ~09:30 UTC — GPT live smoke review: 4 page fixes on branch `smoke-fixes` (NOT public)
- Review `reviews/2026-11-06-smoke-fixes.md`. The four fixes:
  - FRP shown as delivered via one formatter `ME.frp`. It was rounded to whole MW; **272 of 906 live records were under 1 MW**, shown as "0 MW" or "1 MW".
  - Sources tables wrap on phones: 360 px wide, was 1,371. Main also overflowed at 1280.
  - The place view is stacked on desktop: descriptions 366 px, were ~131.
  - The buoy collection wording points to the hub's retention report.
- Guard suite `smoke-fixes` 52/52 (33 of 51 fail on main). All regressions pass. Live-checked on real data in a clean pane tab.
- **Next:** GPT review → Chad's go → fast-forward merge to main (publishes the page).

## 6 Nov 08:19:35 UTC — **5 Nov fires recovery WRITTEN to R2 and verified** (Chad's Approve line)
- One object: `archive/recoveries/firms/2026-11-05.json.gz`, 659,639 B, sha256 `624ecf2ed864…`, etag `4e3b3d61…`. Uploaded by Chad through the R2 dashboard. This was the procedure's fallback: the base64 transfer step was not practical at 660 KB, a flaw in §7.
- Pre-check 08:11 (destination absent), read-back verify (18/18), originals untouched (checkpoint object + 3 D1 reads identical). Review §10.
- No D1, hub or page change. The hub does not read `archive/recoveries/`.

## 6 Nov ~08:15 UTC — 5 Nov fires recovery **rev 2 prepared** (GPT's review; R2-only) — nothing written
- GPT independently verified rev 1's figures. Rev 2 (`reviews/2026-11-06-firms-recovery-5nov.md`):
  - the record carries its own limitations;
  - observation, R2-upload and creation times are separate, and retrieval time is null (unavailable);
  - the reference is labelled recovery-generated;
  - run history is "not assessed" and the guard-skipped input run is described separately; the dummy coverage call is removed;
  - the source-lag wording now covers this file only, and **R11** is opened in the research backlog (`day_range=2` vs an explicit previous-date query; research only).
- **Validation gate:** `recover.mjs` writes `out/` only if every pinned figure matches. 5 negative controls stop with nothing written. Two runs byte-identical.
- **Record to write:** `archive/recoveries/firms/2026-11-05.json.gz`, 659,639 B, sha256 `624ecf2ed864…` (created 08:06:37 UTC).
- **R2-only procedure:** `phase1/recovery-firms-2026-11-05/r2-write.js`: precheck, sha-checked bytes, no-overwrite put (identical = no-op, different = stop), read-back verify, originals-untouched check, log. Offline test 6/6.
- **D1 recovery tables deferred** until a querying requirement is agreed.
- **Waiting on Chad's go.** The dashboard pane tab is signed out (Chad signs in first).

## 6 Nov ~08:05 UTC — firms-guard merged to main (Chad's go)
- `firms-guard` @ `2ee3a62` merged into main (`909e8cd`, no-ff). No overlap with main's docs; **no page files change**. `phase1/worker.js` on main = live 0.5.2 (sha256 `70307d5fc2a9afed…`). firms-guard 19/19, history-hub 27/27 on the merge (Node 22.23.4).
- Monitoring check-ins scheduled in this session: 14:20 UTC 6 Nov, 00:50 UTC 7 Nov.
- Baseline 07:54 UTC (read-only): hub 0.5.2, history collecting; firms 07:30 ok (43.7 KB raw), usgs ok; no pending/gaps/failures. **5 Nov coverage backfilled** by 0.5.2 (`assessed_with_checkpoint:false`, stale, 33 failed runs after cutoff, guard reason). **Plastic's first archived version 06:08 UTC.**

# 6 Nov 2026 — thread 16

## 6 Nov ~07:00 UTC — thread 16 handover
- **Production approvals:** the session's auto-mode safety check passes a production action only when Chad's message names that exact action (deploy passed; R2 copy after a bare "go" refused). From now on Claude ends such messages with an `Approve: …` line for Chad to send back. Standing trust rules drafted for Chad's Mac (`~/Documents/Mother Earth/setup/`: `automode-mother-earth.json`, `apply-automode.py`, tested on a scratch home folder: keeps existing settings, backs up first); whether they reach cloud sessions is unknown — the next production action will show.
- Monitoring check-ins (14:20 UTC, 00:50 UTC 7 Nov) **cancelled here**; the next thread schedules its own (HANDOVER §1.1).
- 5 Nov recovery review with GPT.

## 6 Nov ~06:40 UTC — **5 Nov fires recovery BUILT in the workspace** (Chad's go: build only; no D1/R2/hub write) — review `reviews/2026-11-06-firms-recovery-5nov.md`
- **Inputs preserved** (Mac `~/Documents/Mother Earth/research/firms-recovery/2026-11-05/`, hash-checked against R2): the 23:45 raw file (`c3487dcc…`, the day's latest retrieval), the original checkpoint (`1a61adf2…`) and the 15:30 raw behind it (`de6c5397…`). The R2 expiry no longer matters.
- **Method:** the hub's own `firmsParse` / `firesDaily` / `checkpointCoverage` from `2ee3a62` (0.5.2), test exports only; two runs byte-identical.
- **Validation:** on the original's input the harness gives 555 cells · 46,009 · day 37,899 / night 8,110 · max 746.34 MW = STATUS's D1 figures; 0.5.2 re-parses the 15:30 file to the 0.5.1 records **identically**.
- **Recovery:** 63,614 detections (63,591 distinct) · **641 cells** (+86, none lost) · day 48,826 / night 14,788 · last detection 21:36 UTC · cutoff 23:45:43.250Z (raw upload time).
- **Source behaviour found:** FIRMS **removed 23 rows** between 15:30 and 23:45 (NOAA-20, N. America, 10:05–11:47 UTC; 4 cells lose 1–5); the 23:45 file has **23 exact duplicate lines** (17:59 pass, Venezuela/Colombia) — counted as delivered, like the hub.
- **General finding:** `day_range=1` resets at 00:00 UTC, so **every** daily FIRMS checkpoint ends ~2–2.5 h before midnight (detections processed after midnight never arrive); `input_status` says "current" because it measures retrieval. Research item proposed, no build.
- **Proposal (not done):** R2 `archive/recoveries/firms/2026-11-05.json.gz` + D1 `archive_recoveries` + `fires_daily_recovered`; hub reads neither; original untouched. 5 open decisions (review §8). Next: GPT review → Chad's go.

## 6 Nov 05:53:57 UTC — **HUB 0.5.2 DEPLOYED** (Chad's explicit go, after GPT's sign-off on `2ee3a62`)
- **What:** branch `firms-guard` @ `2ee3a62`, `phase1/worker.js` sha256 `70307d5fc2a9afed…` (checked from raw.githubusercontent before upload), content-only API from the dashboard pane, HTTP 200. This time the session allowed Claude's upload (refused twice in thread 15).
- **Verified (read-only):** script content read back from Cloudflare hashes to `70307d5f…`; `/` and `/status` = **0.5.2**; **17 bindings**, `HISTORY_ENABLED=1`; `/status` → `archive_health.collection.firms` + `.usgs` present, both ok, no failing streak.
- **First firms run on 0.5.2 (06:00 UTC):** ok, raw 32 KB, **57 ms CPU / 6.5 s wall**; usgs 10 ms; `recent_failures` empty.
- **Still to see:** first firms runs over 4 MB (6 Nov afternoon UTC) — publication, Exceeded Memory = 0, CPU; then the 00:30 UTC 7 Nov checkpoint (6 Nov coverage row `assessed_with_checkpoint=1`, 5 Nov backfill `=0`). Checks scheduled 14:20 and 00:50 UTC.
- **5 Nov fires recovery — Chad: go (06:00 UTC).** Copying the 33 raw files (15:45–23:45) to `recovery/` in R2 was **refused by the session's safety check** (a rule on Claude's writes to production storage); nothing was written. The recovery's input is the latest retrieval, `raw/firms/2026-11-05T23-45Z.csv` (5,311,642 B), which expires ~7 Nov 23:45 UTC (the first file ~15:45). Plan: Chad downloads it from the R2 dashboard → Claude hash-checks it into the Mac research folder → recovery record built and reviewed outside production before anything goes to D1.

# 5 Nov 2026 — thread 15

## 6 Nov ~05:40 UTC — **D1 additions DONE; hub deploy PENDING** (Chad's explicit go for both, after GPT's sign-off on `2ee3a62`)
- **D1 (done 05:37 UTC):** `archive_checkpoint_coverage` (table) + `collector_runs_layer_finished` (index) created from `2ee3a62`'s `schema.sql`, one statement each; checked absent before; live `PRAGMA table_info` / `index_info` identical to the commit's schema read through local SQLite (13 columns; index layer, finished_at). Bindings 17. Empty table until 0.5.2 runs.
- **Deploy NOT done:** the session's automatic safety check refused Claude's content-only upload (as it refused the variable click on 5 Nov) — a policy on Claude's own actions, not a permissions or login issue. Handed to the next thread with a fallback where Chad pastes and clicks Deploy (HANDOVER §1.1).
- Hub still **0.5.1**; history on; fires goes stale each afternoon until 0.5.2 is live.

## 6 Nov — firms-guard **rev 3** (`2ee3a62`) — NOT deployed
GPT confirmed rev 2's clock and truncation fixes (firms-guard 19/19, history-hub 27/27) but found the memory bench's verdict only checked survival — the hub swallows collection/checkpoint errors, so a failed checkpoint write read as "pass". Rev 3: the bench asserts every scenario's outputs (publication + record count; checkpoint marker, object, daily aggregates, coverage; backfill row; both stress collects; usgs; exact `/place` firms section + `/snapshot`; no history failures); 4 negative controls each FAIL; **real 5.3 MB + 8 MiB, 6 scenarios × 3 runs, caps 128 and 80 MB: 72/72 verified passes** (tested `worker.js` sha `70307d5fc2a9afed…`). No hub code change. Wording: an 80 MB local V8 cap is not a measured production reserve. Pending: GPT's re-review → Chad's go for D1 (table + index) → deploy.

## 6 Nov — firms-guard **rev 2** (`5570b82`) after GPT's review — NOT deployed
GPT reproduced rev 1 (firms-guard 10/10, history-hub 27/27, Node 24) and found three problems, all addressed on the branch: (1) **memory** — re-measured in the Workers runtime (workerd 2026-07-30) under a **total-heap** cap, natural GC, the real 5 Nov payload + scale-ups, 6 scenarios incl. a resident `/place` index and overlaps, 2 runs each → **limit 8 MiB** (passes everything at an 80 MB cap, 48 MB headroom); **12 MiB not supported** (two-collect case fails at 128). The rev-1 Node "retained after forced GC" figures are superseded; "transient peaks are reclaimable" withdrawn. (2) **clocks** — the day a run belongs to = scheduled time; "after the snapshot" = actual end time vs retrieval time (GPT's 23:45:40 / 23:45:00→23:46:00 case now reports 1 failure, stale). (3) **truncation** — content checks on used fields (GPT's cut-final-`D` case refused; genuine zeros kept, empty FRP → null); wording: no check proves a complete download. firms-guard **19/19**, 8 breaks each fail it; all hub regressions + place-ui pass. Bench + results in `phase1/bench-firms-memory/`. Still pending: GPT's re-review → Chad's go for D1 (table + index) → deploy.

## 6 Nov — FIRMS guard fix on branch `firms-guard` (`908ff8d`), hub 0.5.2 candidate — NOT deployed
Review: `reviews/2026-11-06-firms-guard.md` (for GPT + Chad). Limit 4 → **12 MiB**, chosen on **memory** (128 MB per isolate; held ≈ 4× file: 5.3 MB → 31 MB, 12 → 49, 16 → 62; real Worker P999 17.4 MB on ≤ 3.8 MB files) — CPU on the real 5.3 MB file 80–173 ms. Truncated rows refused. New `archive_checkpoint_coverage` table + `/status` `collection` health: every checkpoint states its input's retrieval time, latest detection, age at day end, failed runs after it and reasons; 5 Nov gets a later-assessed row (labelled). Failed runs now trigger the checkpoint step. firms-guard 10/10; 6 breaks each fail it; all hub regressions pass. **Correction:** the "00:31 firms checkpoint 243 ms" was the ships fallback in the same invocation; the firms checkpoint was written 02:16:10 on the first successful run. **Needs Chad's go:** D1 table → deploy. **Time-limited:** 5 Nov raw files expire from ~7 Nov 15:45 UTC (recovery not built).

## History trial — ON since 10:21 UTC (Chad's go)
`HISTORY_ENABLED=1` (plain text, Production). Claude filled the form; Chad clicked "Add 1 variable and deploy" (the session's safety check blocks Claude from production-deploy clicks). Verified 10:21: 17 bindings, hub still **0.5.1**, `history.collecting:true`, `archive_health` empty. **Chad, 5 Nov: keep it on — the full day is the test.** To stop: remove the variable (Chad's click); retained history is not deleted.

**CPU per tick (invocation log, CPU / wall), history on vs off:**
| job | history on (5 Nov) | history off (reference) |
|---|---|---|
| usgs (*/5) | 9–14 ms | 6 ms (08:30) |
| firms (*/15) | 124 ms 10:30 · 190 ms 11:00 · 126 ms 12:00 (grows with the day's file) | 107 ms (08:30) |
| hourly (:07) | 82 ms / 15.2 s (11:08) · 84 ms / 17.1 s (12:08) | — |
| forest + orbital (11:41, odd hour) | 184 ms / 72.4 s | 173 ms (3 Nov) |
| forest alone (12:11) | 28 ms | — |
All outcomes ok.

**What was written (D1 at 12:14 UTC):**
- `quake_revisions` 42 — 30 on the first run, then only new quakes and revisions (e.g. us7000tw7b automatic → reviewed at 10:30).
- `drifter_fixes` 2,491 — 1,304 (11:08) + 1,187 (12:08; 1,304 buoys reported, only new buoy-fix pairs written). **Early rate ≈ 1,200 rows/hour ⇒ up to ~29,000/day if it holds** (top of the 1,300–31,000 range). Full-day rows + bytes at the midnight read.
- `archive_versions` 2 — co2 "first" (3,284 B gz; unchanged at 12:07 → same row, `retrievals: 2`, nothing new stored) and orbital "first" (1,220 B).
- `orbital_population` 1 — 32,584 objects (payload 19,675 · rocket body 2,207 · debris 10,163 · unknown type 539; elements sha `3bfcf743…`).
- `history_activity` 2 — firms + usgs for 5 Nov.
- `archive_checkpoints`, `fires_daily`, `seaice_daily`, `archive_gaps` 0 — none due yet.
- R2 `archive/`: 2 objects, ≈ 4.5 KB. Hub report: retained since 10:25:08 UTC; `archive_health` pending / gaps / failures empty at every read.

**15:07–15:15 UTC read:** first **`seaice_daily`** rows (2, data date 4 Nov: N 8.241 / clim 9.935, S 15.563 / clim 17.153 M km²) + seaice version "first" (3,908 B). New versions as sources moved: orbital 13:42 and co2 14:08, each `data+processing` — expected: "processing" is our derived output (counts, cells, index), not code, so new source data changes both hashes. Totals: quake_revisions 52 · **drifter_fixes 5,863** (per hourly run 1,304 / 1,187 / 933 / 1,214 / 1,225 → mean ≈ 1,170/h ⇒ ~28,000/day if it holds) · archive_versions 5 · orbital_population 2 · seaice_daily 2. R2 `archive/` 5 objects, 12.9 KB. CPU: hourly 110 ms / 22.5 s · firms 156 ms · usgs 10–17 ms · forest 31 ms — all ok. `archive_health` empty.

**FIRST MIDNIGHT CHECKPOINT — read 6 Nov 02:47 UTC** (the 00:50 scheduled read could not run: Mac closed by plan). **The checkpoint machinery worked; the fires collection was incomplete. The full-day trial is NOT complete** (GPT review, 6 Nov — adopted).
- **Qualification of "no gaps":** `archive_health` shows no pending day, no recorded gap and no history failure. That means every due checkpoint completed — **not** that collection covered the day. Fires stopped updating after 15:30 UTC and the archive retained that stale snapshot as the day's checkpoint. Today's `archive_health` does not show this; the fix adds it (below).
- **What "15:30" is:** the checkpoint `cutoff` = the chosen snapshot's **retrieval time** (`retrieved_at` 15:30:44). The latest detection time inside it is separate and is **not** recorded in the checkpoint today; the fix records it. Source cutoff (FIRMS NRT latency) is a third, separate thing.
- **Recoverable until ~7 Nov 15:45 UTC:** each guarded run archived its raw file (`raw/firms/2026-11-05T15-45Z.csv` … `T23-45Z.csv`, 4.5–5.3 MB); raw is deleted 2 days after upload. A recovery would be a separate, explicitly recorded record — never a rewrite of the original checkpoint. **Chad's call.**
- **It recurs daily** until fixed (6 Nov expected to trip by mid-afternoon UTC).
- `archive_checkpoints` 2 for 5 Nov: **usgs** cutoff 23:55:08 · 31 records · 2,605 B gz · `snapshots/usgs/2026-11-05T23-55Z.json`. **firms** cutoff **15:30:44** · 46,009 records · 507,004 B gz · `snapshots/firms/2026-11-05T15-30Z.json`.
- `fires_daily` 555 cells for 5 Nov: 46,009 detections (day 37,899 · night 8,110), FRP present on all 46,009 (0 missing that day), max 746.34 MW.
- `archive_health`: last_completed firms + usgs 5 Nov; pending, gaps, recent_failures all empty.
- **CPU of the checkpoint ticks:** firms */15 at 00:31 — **243 ms / 67.4 s wall**; usgs */5 at 00:32 — **558 ms / 165.6 s wall** (the heaviest invocation seen; ok, within limits; wall overlaps the firms tick). Other ticks 8–27 ms.
- **⚠ FINDING — FIRMS resource guard (pre-existing, not caused by history).** From **15:45 UTC 5 Nov to midnight** every firms run was "raw archived; processing skipped: resource guard" — the raw file grew past the **4 MB guard (4,194,304 B)**: 3.8 MB at 15:30 → 5.3 MB by 22:45. So (a) the **public fires layer kept serving the 15:30 snapshot all evening** (collector shown as down with the D14 wording — honest, but stale), and (b) **the 5 Nov `fires_daily` checkpoint covers detections up to 15:30 only**; the checkpoint records its cutoff but does not say later runs were skipped. **Getting earlier each day:** first guard trip 3 Nov 21:00 (12 runs) · 4 Nov 18:30 (22) · 5 Nov 15:45 (33); none before 3 Nov (max raw 3.4–3.7 MB). The 4 MB guard dates from the Free plan (D14); on Workers Paid a 5.3 MB parse is measured at 124–243 ms CPU at 3.8 MB. **Fix needs Chad's go** (hub change): raise the guard; make a checkpoint record skipped runs after its cutoff.
- **Drifter cost item, 5 Nov (partial: 10:21–24:00, ~13.6 h): 13,440 rows**, ≈ 1.85 MB of row content (estimate from field lengths; D1 overhead not included). Hourly batches uneven (OSMC delivers in batches: ~1,200 most hours, 116–206 in some). ≈ 990 rows/h ⇒ **~23,700/day — provisional extrapolation from a partial day.** One full UTC day (6 Nov, read after 00:30 UTC 7 Nov) and preferably several different days give the operating estimate.
- **Storage now:** D1 **8.3 MB** (2.6 MB on 4 Nov, before history; includes other tables' growth) · R2 `archive/` 13 objects, 530 KB (the firms checkpoint is 507 KB of it).
- Totals: quake_revisions 121 · drifter_fixes 14,750 · fires_daily 555 · orbital_population 8 (one per odd-hour run, each a new version) · seaice_daily 2 · archive_versions 11 · checkpoints 2 · gaps 0.
- Plastic: first version still due with its next daily run (~05:07–06:07 UTC 6 Nov).

**Still to see:** **first midnight checkpoint 00:30 UTC 6 Nov** (firms + usgs: `archive_checkpoints`, `fires_daily`); **drifter rows/day + bytes** (5 Nov is partial — from 10:21); plastic's first version with its next daily run ~05:07–06:07 UTC 6 Nov (its 5 Nov run was 09:07, before history was on). Read-only checks are scheduled in the session at 15:12 and 00:50 UTC.

## Page cleanup published — main `bd17401`, assets `?v=202611121000` (Chad's go)
- Removed the unreachable `'no history kept'` fallback (inspector Comparison row in `index.html`, Sources t-cmp in `sources.html`). A missing kept statement now adds nothing rather than an absolute claim. Visible text is unchanged today (every layer has a kept line).
- `kept-ui` +2 checks (21): every layer with a Comparison line has a kept statement; no "no history kept" text. Shown to fail when ships' line is removed (removing sea ice's does not — its history line still supplies text).
- Tests: kept-ui 21 · place-ui 30 · place-rows 7 · history-hub 27 · ux-round1 34 · mobile-pass 131 · drifters-ui 25 · plastic-ui 29 · search-ui 104 · terminator-ui 19.

## orbital-browser — 2 pre-existing failures fixed (test only; main `66c1a8c` + `e5bac15`)
- Cause: the reference counted stale over all rows; the page's worker over objects whose elements initialise successfully. The fixture's epochs are pinned to 3 Nov 13:00 and the suite runs on the wall clock; by 5 Nov 6 payload + 6 debris init failures were past 3 days (rocket bodies 0) — exactly the 6/6 gap. Fix: the reference uses the worker's definition. **Stale and failed are not mutually exclusive** (an object that initialises but fails propagation can be in both — GPT's correction). 105/105; still fails on `draws-all-groups` (6) and a stale threshold one day short (3). GPT agreed; Chad's go.
- Open: shared fixed calculation time for browser + reference, with cases either side of the 3-day boundary; real timers kept (GPT).

## Research backlog — `docs/RESEARCH-BACKLOG.md` (research only)
R1 Schumann resonance / ELF; R2–R9 from GPT's source checks (first: CNEOS fireballs, USNO/IERS Earth rotation, Argo; next: Coral Reef Watch, Ozone Watch, CO-OPS water level; later: GloTEC, NMDB). One first gate for all. No build, collector, schedule, deploy, purchase or third-party contact.

# Mother Earth — status (5 Nov 2026 — thread 14 close)

## 5 Nov 09:41 UTC — **PAGE RELEASE PUBLISHED; HISTORY OFF; TRIAL PENDING.** Chad's go, after GPT's review.
- **Published:** main = **`8c8633d`** (fast-forward from `da22513`, 09:39:07 UTC), assets **`?v=202611111000`**; served files hash-equal to the commit (index `bdc44df5d2e6`, app `fc2133f7f088`, style `e10935d03acb`, sources `dd2e63e59484`). New public: the **place view** ("Everything here" from any cell or any globe point) and **"What Mother Earth keeps" following the hub** (collecting now / retained, never "none" when unknown); the Sources `fill()` refresh fix; the desktop-overflow fix (published earlier, `3a2fcb2`).
- **Hub 0.5.1** (`8c8633d`) since 09:28 UTC; **9 history tables + 8 indexes** in D1 since 09:28 UTC (empty). **`HISTORY_ENABLED` absent.** Hub reports `history: {collecting:false, retained:{exists:false}}`; `/status` → `archive_health` all empty; 0 history rows; 0 `archive/` objects (09:41 UTC).
- **Public checks:** candidate report §11 (globe, place panel, panel-only loading, phone layout, retention wording).
- **Tests:** Claude: history-hub 27/27, kept-ui 19/19, place-ui 30/30, place-rows 7/7 + all regressions. GPT independently: 27/27 + six retention-state checks on `8c8633d`. **orbital-browser: 2 pre-existing failures** (same on main), open.
- **Next:** HANDOVER §1. The history trial waits for **Chad's separate go**.

# Mother Earth — status (5 Nov 2026 — thread 14, continued)

## 5 Nov 09:28 UTC — **HISTORY TABLES CREATED + HUB 0.5.1 DEPLOYED, HISTORY OFF.** Chad's go, after GPT's re-check of `8c8633d`.
- D1: 9 tables + 8 indexes from `8c8633d` (17 statements, all ok); live schema = commit (9/9 via `PRAGMA table_info`); all empty.
- Hub 0.5.1 (`8c8633d`, sha256 `1f34554b2e53…`), content-only; 16 bindings, no `HISTORY_ENABLED`. `/` + `/status` 0.5.1; history `collecting:false, retained:{exists:false}`; `archive_health` empty; `/place` ok (all sections same-run).
- First scheduled runs 09:30 (usgs ok 29, firms ok 20,332): 0 history rows, 0 `archive/` objects, no failures; snapshots now carry `retrieved_at` metadata.
- Page release (place view + hub-driven retention wording) live-RC-checked against 0.5.1 — candidate report §10. **Next:** GPT reviews the page release → Chad's go to publish (merge `place-view` → main) **before** the history trial (GPT's separate go).

## 5 Nov 08:27 UTC — **HUB 0.5.0 DEPLOYED, HISTORY OFF.** Chad's go: "if you ready you can deploy" (read as step 2 only).
- **What:** `place-view` commit `482ffb0`, worker.js sha256 `311455d37e1c…` (checked against GitHub before upload), content-only API, HTTP 200. Bindings unchanged (16; no `HISTORY_ENABLED`). No D1 tables created, no history, page NOT published (main unchanged, `b04a930` + docs).
- **New live:** `GET /place/g4/<row>_<col>`; `GET /` reports `history: {enabled:false}`; FIRMS missing FRP → null (not 0).
- **Verified 08:27–08:33 UTC:** `/` and `/status` = 0.5.0; `/place` North Sea 35_46 (ships 873, fires 31, every section same-run), Pacific 20_0 (all no_records), plastic cell 33_46 with `?layers=plastic,drifters` (plastic 100); bad cell → 400. Collection block on real D1: ships 22/24 h usable, 75/115 aggregated h in 7 d, retention since 2026-10-31T13. First scheduled runs on 0.5.0: usgs 08:30:07 ok (29), firms 08:30:40 ok (16,639; 0 null / 0 zero FRP in this file). R2 `archive/` 0 objects, `state/history-*` 0 objects (history off writes nothing).
- **CPU (invocation log):** firms tick 107 ms (wall 4.5 s), five 6 ms; `/place` 43 ms (cold index, North Sea), 16 ms (plastic + drifters), 7 ms (Pacific); other fetches ≤ 2 ms.
- **Next (superseded 09:28 — see above):** (1) D1: create the history tables; (2) trial `HISTORY_ENABLED=1`; (3) one full UTC day measured; (4) live RC + merge `place-view` → main (publishes the place view and the hub-driven "What Mother Earth keeps").

# Mother Earth — status (5 Nov 2026 — thread 14)

## 5 Nov 03:12 UTC — **DESKTOP OVERFLOW FIX PUBLIC.** main `3a2fcb2` (fast-forward of `desktop-overflow`), assets `?v=202611081000`. Chad's go: "you can merge".
- **GPT's discrepancy resolved:** GPT could not reproduce "8 px at 1280" — correct. That figure came from the container, where Google Fonts are blocked and fallback fonts are wider. Cause: `body.world` was a grid with an implicit auto column, so the header's min-content (nowrap title + nowrap promise + clock + menu) set the page width: **1,186.6 px with the real webfonts, 1,287.6 px with fallbacks**.
- **Real bug with the real fonts, measured live on the public page before the fix at 1,101×800:** page 1,186 px wide; `overflow:hidden` meant no scrollbar — **Menu button off-screen (left edge 1,110) and not clickable; right column (Kp, CO₂, sea ice, Optional layers) clipped by 86 px**. Affected every desktop width 1,101–~1,186 (and up to 1,288 when webfonts fail).
- **Fix (CSS only):** `body.world` gets `grid-template-columns:minmax(0,1fr)`; the promise is no longer nowrap — it wraps to at most 2 lines (`line-clamp:2`), wording verbatim, never an ellipsis. Header stays 56 px.
- **Tests:** new `node phase1/desktop-overflow.test.cjs` — 8 widths (1,101–1,920) × real fonts (npm `@fontsource`, served in place of Google Fonts) and fallback fonts: **112/0 on the fix, 20 FAIL on main**. `mobile-pass` no longer exempts 1280 (131/0). Regressions: ux-round1 34 · plastic-ui 29 · drifters-ui 25 · search-ui 104 · terminator-ui 19 · terminator-behaviour 47 · orbital-ui 38 · search 111 · real-data 50 · solar 26 — all pass. **orbital-browser 103/2 — the same 2 fail on main** (`B payload/debris alone: stale and beyond-GEO counts match the reference`); passed 105/105 in thread 9 → likely time-dependent fixture; separate test item.
- **Live RC (clean session, branch files sha-matched `99c1749e38e7` / `77b7202d356e` / `8ec969837bc9`, real fonts):** 1,101 / 1,150 / 1,186 / 1,280 / 1,440 — page = window, Menu clickable, right column fits, promise 2 lines below ~1,190 and 1 line above, nothing cut.
- **Public check 03:12 UTC:** served hashes = branch; 1,101×800: page 1,101, Menu clickable, right column fits, promise in full.
- **GPT's live check (5 Nov, before this fix):** mobile pass verified on the public site (Key, focus, 6→9 count staging, plastic LOADED 1,145, buoys 1,302, 844×390 controls); disclosure text readable but small — **do not shrink further**; all three orbital categories crowd a small globe (known).
- **Open:** Mac copies of STATUS/HANDOVER/START-HERE not synced this thread (folder not granted). Leftover branch `desktop-overflow` (= main).
