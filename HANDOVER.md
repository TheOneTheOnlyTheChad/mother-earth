# Mother Earth — handover (10 Nov 2026, end of the Sky zoom-out thread; main = the commit that carries this file, see `git log -1 -- HANDOVER.md`)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4d D1 · §5a testing), then this file, then `STATUS.md` (newest first; threads 1–13 in `docs/STATUS-ARCHIVE.md`). **Not a fresh sandbox; don't repeat completed reviews.** This thread's full record is STATUS 8 Nov (from 16:15 UTC) and 9 Nov.

**Access (Chad, 4–5 Nov):** full access — GitHub (push), Cloudflare, Space-Track, the Mac's Mother Earth folder and `~/mother-earth`, browser pane. Chad enters secrets himself; Claude never creates accounts. **Every deploy, schedule or variable change, D1 schema change and push to main that changes the public page needs Chad's explicit go.** Production deploy clicks are Chad's (§3). **Say up front whenever Chad must be at the screen with the app in front** (standing rule). **Production approvals (thread 16): the session's auto-mode safety check lets a production action through only when Chad's message names that exact action — a bare "go" is not enough. So end any message that needs a production action with a ready line, e.g. `Approve: deploy hub commit <sha> (content only)` or `Approve: copy <files> into R2 recovery/`, and Chad replies with it.** Non-production work: "go" is fine. GPT reviews; approvals are Chad's. Not Overwatch: presentation lessons only. No surveillance, ever.

## 0. Live state (**Sky on Two Clocks card released 10 Nov 10:43:31 UTC, main `a1c3ed6`; hub 0.6.5 since 10:12:09 UTC; main = live**; later commits docs only. Older rows below are kept for the record.)
| | State |
|---|---|
| **Page** | **main `a1c3ed6`, assets `?v=202611231000` (timeline.html stays `202611221000`) — Sky on Two Clocks card (Sky heading beside Orbital objects; Now + Deep Time; catalogue `sky-2026-11-R1` from `/catalogue/sky/sky-2026-11-R1`), released 10 Nov 10:43:31 UTC; Pages build 10:44:20; served hashes for **eight page files** verified 10:44:39 UTC (index `95d0828c`, app `e3f4a385`, sky `175be00b`, style `f7ea6e9c`, arts `58773cef`, sources `a524dbd8`, timeline.html `d7c37d5f`, timeline.js `ae87c6a1`); live smoke test passed 10:44:53. Rollback = revert `a1c3ed6` (Approve line).** Before that: **main `cc91165`, assets `?v=202611221000` — the Timeline page fetches its own catalogue revision (`/catalogue/timeline/tl-2026-11-R1`), released 10 Nov 07:56:29 UTC; served hashes verified 07:58:38 UTC. Rollback = revert `cc91165` (keep hub 0.6.4).** Before that: main `57d07c2`, assets `?v=202611211000` — Timeline page with the deep-time axis (Big Five on the ICS chart, catalogue `tl-2026-11-R1` from hub `/catalogue/timeline`), released 10 Nov 06:17:50 UTC (commit time); served hashes = rev 3 (06:20:20 UTC). Rollback = revert `57d07c2` (Approve line), then hub 0.6.2 if wanted.** Before that: main `4b23518`, assets `?v=202611181000` — Timeline page (first entry, Pliny *Letters* 6.16) + Earth now · Timeline header tabs, released 9 Nov 16:33:11 UTC (commit time). Served hashes verified 16:36:27 UTC, **seven page files**: index `d826964ae313`, sources `8fbadc9048b3`, timeline `1c9770492c27`, app `e3f4a3854113`, arts `58773cef35e6`, timeline.js `66b5e0320e83`, style `20a8bce94ada`. Before that: `6d5ca55` (Met catalogue card, 9 Nov 06:20 UTC). Rollback = revert `4b23518` (Approve line; no hub/R2/D1 involved).
| **Hub** | **0.6.5 since 10 Nov 10:12:09 UTC** (adds versioned `/catalogue/sky/<revision>`; only `sky-2026-11-R1`; unknown/bare/loose → 404 with no R2 read; from `2da37b2`, worker.js `1073d15d…ec94`; R2 `ref/sky/sky-2026-11-R1.json` `f851f164…368a`, 71,925 B; rollback = 0.6.4 `7d46edf3…a7987`). Before that: **0.6.4 since 10 Nov 07:54:38 UTC** (versioned `/catalogue/timeline/<revision>`; legacy URL pinned to R1; from `timeline-revs-rc` @ `1d31df6`, worker.js `7d46edf3…a7987`; rollback = 0.6.3 `94a6b2b2…af93`). Before that: **0.6.3 since 10 Nov 06:09:15 UTC** (adds the fixed `/catalogue/timeline` route; from branch `timeline-deep-rc` @ `0f67fca`, worker.js sha256 `94a6b2b2…af93`; **rollback = 0.6.2 `4b5b6aa3…003f`** = main's worker.js; main ≠ live hub until the branch merges). Before that: **0.6.2 since 9 Nov 06:13:19 UTC** (adds the fixed `/snapshot/arts` catalogue route; from branch `arts-met-rc` @ `4c4bbb9`, worker.js sha256 `4b5b6aa3…003f`; rollback = 0.6.1 `f38296a0…`). Before that: **0.6.1 since 8 Nov 07:58:25 UTC.** worker.js sha256 `f38296a0183d14d958d5815d7926254cb4275be7ca00b384334974fad5b12cc8` (= main). Kp degraded only when ≥ 7.5 h past its interval start (provisional policy, not a NOAA deadline; 5 min future-skew tolerance). Envelopes carry `status_reason` (swpc, usgs, co2, seaice, cloud ships). FIRMS v2 ON (`FIRMS_PIPELINE=v2`, `FIRMS_CREATE_ONLY=verified`); 19 bindings. **Rollback:** hub = redeploy 0.6.0 `ac173d8a…58ea`; page = revert `ad4002b`. Each needs its own Approve line; the two are independent. Never redeploy 0.5.3. |
| **D1** | **+ 5 `firms_*` tables + 3 indexes (6 Nov 19:59:43–20:00:03 UTC, FIRMS v2 state).** 9 history tables + 8 indexes **+ `archive_checkpoint_coverage` (empty) + index `collector_runs_layer_finished`** (both created 6 Nov 05:37 UTC, live = `2ee3a62` schema). |
| **History** | ON since 5 Nov 10:21 UTC — keep on. First midnight checkpoint (5 Nov) completed; **fires part is partial** (input 15:30 UTC: the 4 MB guard skipped 15:45–23:45). Details STATUS. |
| **Monitoring** | UptimeRobot 8 monitors (runs, publication, archive, coverage × usgs, firms), all 200 at the last reads. No monitor on swpc. |
| **Branches** | **GitHub, 10 Nov end of Sky thread: `main` + parked `aircraft-rc` only (`sky-rc` deleted by Chad).** Earlier: `main` + parked `aircraft-rc` (never deploy as-is) + **`timeline-rc` @ `9dce186` (merged into main as `4b23518`; Chad can delete it)**. |
| **Tests on main** | **10 Nov (Sky): 41 regression suites green on the release code (sky-build 35, sky-hub 46, sky-ui 79 with 17 breaks each failing; desktop-overflow 112, mobile-pass 131, timeline-ui 585, orbital-browser 113).** Earlier: **timeline-ui 584/0 (12 breaks each fail); all 35 regression suites pass on the merge (desktop-overflow 112, mobile-pass 131; 390×844 overlay 7.2% vs 8% target)** ·  kp-degraded 29/29 · place-ui 30/30 · health-hub 29 · history-hub 27 · firms-guard 19 · firms-v2 57 (+7 need `OLD_WORKER`) · all UI suites pass (container). |
| **Mac copies** | **Synced 10 Nov end of the Sky thread (see STATUS), preserve-first. All review copies moved to `_to_delete/` (Chad empties it); `_review/` empty; the rehearsal packet `research/sky-two-clocks/2026-11-10-claude-rehearsal-T1/` stays.** Earlier: **Synced 9 Nov 16:37 UTC and 10 Nov (end of the Timeline build thread)** by the raw.githubusercontent route, preserve-first; every preserved copy matched an earlier commit (no local edits). Review copies `_review/timeline-rc/` (`c3498bc`) and `_review/timeline-rc-31fab7d/` can be removed by Chad. Next thread: grant `~/Documents/Mother Earth` again to sync. |

## 0a. Smoke testing, 8 Nov (GPT + Claude)
- **GPT, 05:14–05:20 UTC** (on `3375e91`) and **GPT, 12:10–12:19 UTC** (on `ad4002b` + hub 0.6.1): no blocking regression in the checks completed; **not exhaustive**.
  - Second run confirmed: hub 0.6.1, served files = `86134b8`, health 8/8 (HTTP 200, healthy), Kp card and Sources agree (interval wording fits at 360/390/430/1280 px), no obsolete wording or NaN, search and inspectors (0.51 MW precision), Everything here from a real click, buoys, plastic, day/night, all orbital categories (32,645 objects; 6 propagation failures and 547 unknown-type disclosed), post-noon imagery = 7 Nov NOAA-21, no console warnings or errors.
- **Claude, 05:47–05:50 UTC** (pane, 588 px): Everything here + all orbital categories pass. This supplements GPT's tests and was not independently reviewed by GPT.
- **Claude, 11:53–12:06 UTC:** noon rollover PASS on fresh loads (06 → 7 Nov). An already-open page keeps its date until reloaded (current behaviour). GPT independently confirmed the post-noon state.
- **Still open:** real-phone / Safari test; browser HTTP status codes. **No degraded path has been seen live:** no layer was degraded and GPT did not inject state; the wording rests on the reviewed tests (kp-degraded 29/29).

## 1. Next (from the Arts/timeline thread, 9 Nov 2026)
**Arts released this thread, each step on Chad's own Approve line:** R2 upload 06:11:12 UTC → hub 0.6.2 06:13:19 UTC → live RC check → page release 06:20:18 UTC (main `6d5ca55`). **main = live** (hub 0.6.2 `4b5b6aa3…`, page assets `?v=202611161000`).

**Where things stand:**
| Item | State | Doc |
|---|---|---|
| **Arts (the Met) card** | Proposal rev 2.1 accepted by GPT → Chad's branch-only Approve → **candidate built on `arts-met-rc` @ `4c4bbb9`** (+ `c5005c3` docs). GPT's independent implementation review: **no blocking defect in its code/test scope**; reproduced the file (127,887 B, sha256 `221bb1ca…9644`), worker/page hashes, arts-hub 54/54, the three hub breaks; `unreadable` accepted. The 90 browser checks are Claude-supplied. **R2 billing check rev 2.1** (account-wide, one bucket; expected $0.00 as an estimate, conditional on total usage incl. Arts reads staying inside the allowances; whole-million rounding as published) — **accepted by GPT 9 Nov** (estimates from Claude-supplied analytics, not an invoice). The upload approval is Chad's next choice. | `docs/research/P0-ARTS-RELEASE-PROPOSAL.md`, `reviews/2026-11-09-arts-met-rc.md` (branch; copy in project), `reviews/2026-11-09-arts-r2-billing-check.md` |
| Timeline concept | **Rev 3.1 accepted by GPT as a concept only. Route W gate parameters proposal **rev 4 ACCEPTED by GPT 9 Nov**; **first gate RUN 9 Nov 08:34–09:01 UTC; GPT review → rev 2 **accepted by GPT** (deviation recorded, coverage incomplete, selection inconclusive; not a feasibility/coverage pass or route clearance)** (`docs/concepts/TIMELINE-ROUTE-W-GATE-PROPOSAL.md`; route and parameters D1–D8 are Chad's).** Route L (library first) and Route W (Wikipedia/Wikidata first), each with a bounded gate; GPT suggests considering W first. No route selected; the gate was its only authorised research. | `docs/concepts/TIMELINE-CONCEPT.md` |
| Provider enquiries | USNO, adsb.lol, Ozone Watch, CNEOS sent — replies pending; OpenSky #837506 acknowledgement supplied + **substantive reply 9 Nov, linked to Chad's sent enquiry (ENQUIRIES rev 5, **accepted by GPT**): Q2 a contextual reading only; Q1b, Q1c, Q3 unanswered** (conditions beside REGISTER; not blanket permission); adsb.fi prepared, **not sent**. | `docs/research/ENQUIRIES-2026-11.md` |
| Aircraft | Reopened **only** for bounded terms/access and feeder clarification. `aircraft-rc` parked. | — |
| R2 fireballs terms | **Rev 2 ACCEPTED by GPT** as bounded research-only evidence (recorded 9 Nov); draft REGISTER entry **unfiled**. | `docs/research/R2-terms-access.md` |
| Inspiration list | Chad's 50 sites, kept separate from the research backlog; queues no work. | `docs/INSPIRATION-50-SITES.md` |
| CO₂ | GPT's bounded review supports the current card; a historical chart is a possible later proposal, not started. | STATUS 9 Nov |

**T3 brought forward (10 Nov): versioned catalogue route.** Proposal `docs/concepts/TIMELINE-CATALOGUE-REVISIONS-PROPOSAL.md` rev 1.1 (GPT-reviewed). Candidate branch `timeline-revs-rc` @ `4728907` (rev 2; code `1d31df6`; hub 0.6.4 `7d46edf3…`; no R2 write). GPT passed the core design; routing fix applied (STATUS 07:52). **Hub 0.6.4 DEPLOYED 07:54:38 UTC** (`7d46edf3…`, read back exact; rollback 0.6.3 `94a6b2b2…`). **Live RC passed 07:55 UTC.** **PAGE RELEASED 07:56:29 UTC (main `cc91165`)**, served hashes verified; fresh page fetches `/catalogue/timeline/tl-2026-11-R1`; a cached old page still draws via the legacy URL. **Done — main = live.**

**Timeline maintenance and expansion — captured 10 Nov on Chad's request (backlog §T, `docs/BACKLOG-VIEW-2026-11-08.md`; nothing started):** T1 discovery inbox, T2 evidence review (keep the dates-without-a-year shelf), T3 versioned releases (stable links, new revision IDs, older catalogues retained, page + catalogue as matched pairs with the existing hash checks), T4 public "What changed" (old/new ranges + evidence; page "last updated" separate from entry "last reviewed"), T5 release cadence (batch routine additions; corrections and withdrawals sooner). **First deliverables: T1 discovery inbox and T4 public changelog.** **Real iPhone Safari check: deferred by Chad (site first).**

**NEXT THREAD STARTS HERE (10 Nov, end of the Sky zoom-out thread):**
- **Live, main = live:** hub **0.6.6** (`4231114d…f078`, since 14:26:01 UTC); page = merge `5d01462` (page files = `860ed35`, `?v=202611241000`, timeline.html `202611221000`). **Sky zoom-out view public since 15:56:33 UTC** (push time; served hashes of nine page files verified 15:57:56Z; live smoke test 15:58:09Z). R2: `ref/sky/sky-2026-11-R1.json`, `ref/sky/sky-scene-2026-11-R1.json` (`d4605c3d…ae29`), `ref/timeline/tl-2026-11-R1.json`.
- **Rollback:** page = revert `5d01462`; hub = 0.6.5 `1073d15d…ec94`. Each needs its own Approve line, and they are independent.
- **This thread:** proposal revs 1 → 2.2 (GPT); text-only source pass (record rev 1.1, GPT accepted); REGISTER (Horizons entry live + scene use; ERFA entry, ten files); branch build; R2 + hub 0.6.6 + Pages-origin RC; GPT smoke test found Earth lost mid-pull-back → fixed at `860ed35` + intermediate-frame check; GPT retest passed; merge. Packet: `reviews/2026-11-10-sky-zoom-rc.md` (§3 breaks + regression, §4 build deviations, §6 the fix).
- **Open for GPT:** the `fixed-direction` break passes by design (no minimum disc size under the agreed checks). GPT to say whether that warrants a check.
- **Not done:** real phone / Safari (deferred by Chad); screen-reader pass; hardware depth measurement (GPT: after the rendered candidate, optional).
- **Sky refresh due by 2027-06-01:** card + scene as a pair; Bulletin C step 0 + Bulletin A check (START-HERE §4m).
- **Other open items unchanged:** T1/R1 −2.234 ms observation; timeline backlog §T (T1 inbox, T4 changelog); fires "down" wording; provider replies; OpenSky kit (Chad ordering; record what was bought).
- **Close-out:** see STATUS for the §9 checklist results.

**(superseded) NEXT THREAD STARTS HERE (10 Nov, end of the Sky on Two Clocks thread):**
- **Live, main = live:** hub **0.6.5** (`1073d15d…`, since 10:12:09 UTC); page main **`a1c3ed6`** (`?v=202611231000`). R2 holds `ref/sky/sky-2026-11-R1.json` (`f851f164…368a`) and `ref/timeline/tl-2026-11-R1.json`. Everything after `a1c3ed6` is docs only.
- **Released this thread, each step on Chad's own line:**
  - Proposal revs 1–3 (GPT).
  - Source pass and first Horizons export (research only).
  - REGISTER entry: Horizons, research only.
  - S1a / S2a / S3 range rate / S4 decisions.
  - Branch build `sky-rc`.
  - GPT fixes.
  - R2 upload (09:50:16Z).
  - Refresh rehearsal T1, run on Chad's "Go". It found that the generator required UT~ rows. GPT chose option (b): all-UTC windows are valid, and the time-note sentences appear only when they apply. Fixed at `2da37b2`; the T1 rerun passed.
  - Hub 0.6.5 (10:12:09Z).
  - Pages-origin RC.
  - Merge `a1c3ed6` (10:43:31Z).
  - `sky-rc` deleted.
- **GPT's recheck of rev 3:** the note was sent; Chad sent the merge line before a result was relayed in this thread. If GPT reports anything, treat it as a follow-up on the live page.
- **Next feature (GPT's brief, relayed by Chad): Sky zoom-out view — Earth → Moon → Sun.** Brief + open questions: `docs/concepts/SKY-ZOOM-OUT-BRIEF.md`.
  - **Start with a docs-only proposal for GPT.** No research run, build or production step is approved.
  - Key points: use the X/Y/Z vectors already in the raw exports (the R1 catalogue has none, so a new revision or a separate file is needed); keep to the same dated sample as Two Clocks; align ICRF with the globe's orientation at the timestamp (sourced, with a test); show real distances in labels; label any enlarged bodies or compressed spacing, with exact directions; support pinch and desktop controls; provide a clear way back to Earth.
- **Sky refresh due by 2027-06-01** (manual; procedure = proposal §5.1 + the rehearsal log). Step 0 is the Bulletin C check. The leap-second decision for end of June 2027 is open.
- **Observation, unresolved:** T1 vs R1 range differs by a constant −2.234 ms on the shared dates (≤ 0.92 m for the Sun). Cause not established; far below the card's precision.
- **Other open items unchanged from the previous block:** Timeline backlog §T (T1 inbox, T4 changelog); "extinction horizon" wording; iPhone Safari (deferred); screen reader; fires "down" wording; provider replies.
- **Close-out done this thread:** Mac `_review/` is empty. All 12 review copies (sky-rc, sky-rc-preview, timeline-deep-rc*, timeline-revs-rc*) were moved to `_to_delete/` for Chad to empty. `sky-rc` deleted. Mac synced. **Every thread closes out with the checklist in START-HERE §9.**
- **Chad's standing notes:** as below (Gmail line stays; branch deletions are his; exact Approve lines; at-the-screen calls).

**(superseded) NEXT THREAD STARTS HERE (10 Nov 08:03 UTC clock reading, end of the deep-time Timeline thread):**
- **Live, main = live:** hub **0.6.4** (`7d46edf3…`, since 07:54:38 UTC); page main **`cc91165`** (`?v=202611221000`); R2 holds `ref/timeline/tl-2026-11-R1.json` (`096ae648…0fbe`). Everything after `cc91165` is docs only.
- **Released this thread, each step on Chad's own Approve line:**
  - REGISTER: the ICS chart + six Big Five sources.
  - R2 upload of the catalogue.
  - Hub 0.6.3, then the deep-time page (main `57d07c2`).
  - GPT's live smoke test 10/10.
  - T3 versioned route: hub 0.6.4, then the page fetches its own revision (main `cc91165`).
  - Branches `timeline-deep-rc` and `timeline-revs-rc` deleted (only `aircraft-rc`, unmerged, and `main` remain).
- **Open, Chad's choice:**
  1. Backlog §T, first deliverables **T1 discovery inbox** and **T4 public "What changed"** (proposal first).
  2. GPT's "extinction horizon" wording, batched into the first real R2 catalogue revision (new ID + new key; old pins stay).
  3. Real iPhone Safari check: **deferred by Chad** (site first).
  4. Screen reader not tested.
  5. Chad said he has more specs to bring.
- **Chad's standing notes:**
  - His Gmail address in REGISTER's GFW access line stays for now (his call, 10 Nov); don't raise it again.
  - Branch deletions are his: open the GitHub branches page in the pane when asked.
- **Previous handover block (02:27 UTC) kept below for the record.**

**(superseded) NEXT THREAD STARTS HERE (10 Nov 02:27 UTC clock reading, end of the Timeline build thread):**
- **Live:** hub 0.6.2; page main `4b23518` = Timeline page + Earth now · Timeline tabs (seven page files, hashes above). Everything since is docs only. Health monitors green at the last read (10 Nov 02:23 UTC).
- **Open from the release (each needs Chad):**
  1. **Real-site smoke test** on desktop + phone, with Chad: globe with the new header, Earth now ↔ Timeline ↔ Sources (tabs and Menu), the Pliny entry, Back/Forward. **GPT's live smoke test is recorded (STATUS 10 Nov):** desktop + 390 × 844 navigation, Back/Forward, focus, withdrawal disclosure and phone sheet all worked; an initial earthquake-snapshot miss loaded on the follow-up (cause not established); fires Unknown after the daily reset (expected). Remaining: real iPhone Safari.
  2. **Real iPhone Safari** check (the pane is not a phone).
  3. Delete branch `timeline-rc` on GitHub; remove the Mac `_review/` folders (both Chad's).
- **Provider replies (10 Nov, docs only):** Ozone Watch — public domain for the two named 2026 files, credit line, one retrieval per file per day; CNEOS — "free to use the data for this purpose with the citation", API under 1 request/10 min; commercial use, lightcurve scope and lightcurve retrieval **open pending the follow-up**. `ENQUIRIES-2026-11.md` rev 8, `R6-ozone.md` rev 6, `R2-terms-access.md` rev 3. **REGISTER entries FILED 10 Nov on Chad's Approve lines** (research only; CNEOS commercial use and lightcurves open).
- **Timeline deep-time candidate (10 Nov):** branch `timeline-deep-rc` @ **`0f67fca` (rev 3; code `7cad90c`)** (hub 0.6.3 + page axis; packet `reviews/2026-11-10-timeline-deep-rc.md` §6 pins the hashes); GPT review copies in the Mac `_review/timeline-deep-rc-r3*`. GPT's review of rev 2 complete; **REGISTER entries FILED 10 Nov 06:02 UTC** (ICS chart + six articles, Chad's Approve line). **R2 upload DONE 06:06:51 UTC** (`ref/timeline/tl-2026-11-R1.json`, read back `096ae648…0fbe` exact). **Hub 0.6.3 DEPLOYED 06:09:15 UTC** from `0f67fca` (worker.js `94a6b2b2…af93`, read back exact; `/catalogue/timeline` serves `096ae648…0fbe`). **Rollback: 0.6.2 `4b5b6aa3…003f`.** Live RC from the Pages origin passed 06:16–06:17 UTC (CORS ok). **PAGE RELEASED 06:17:50 UTC (main `57d07c2`), served hashes verified. Released — main = live.** **GPT's live smoke test PASSED 10 Nov (10/10, no rollback).** Outstanding: iPhone Safari check (Chad); screen reader; optional wording change "extinction horizon" (needs a catalogue revision — STATUS 06:53).
- **Observation, not a task (10 Nov 02:23 UTC):** every morning the fires card reads **UNKNOWN** with "collector reported down: no detections processed yet for today (UTC) … (header only)" until FIRMS processes the day's first passes (first rows 02:16–04:15 UTC over 4–9 Nov). The behaviour is correct (records withheld, monitors green), but "down" reads as breakage to a visitor — Chad noticed it this morning. A calmer wording that separates "today's file not processed yet" from a real failure would be a **page change needing its own proposal and Approve line**. Not started.
- **Timeline follow-ons, not approved:** a second entry or an axis first needs the **T1 page-only exception reviewed** (START-HERE §2) and its own proposal deciding the hub route. Replacing the withdrawn EGU abstract with a non-withdrawn scholarly source for the August/October question would be a bounded text-only search (own go). Inline Latin still needs REGISTER clearance (Perseus CC BY-SA 3.0 US is the candidate).
- **Lessons (also in START-HERE §4k):** read an attributed source's **publisher landing page before release** (the EGU abstract's withdrawal surfaced only at R1); **scope new page CSS to its page** (`body.tl`) — a global `.card` rule restyled the globe's Readings; switching controls inside an open state should **update** history, not push; **bump `?v=` between review rounds**; GPT smoke-tests branches from a hash-checked `_review/` copy that Chad serves from Terminal.
- **Other tracks unchanged:** opening-page / Met placement audit (separate docs track); provider enquiries (ENQUIRIES-2026-11); aircraft parked except terms/feeder clarification; backlog first gates; FIRMS empty-input retry and 8 MiB guard left open by decision.

**PREVIOUS THREAD STARTED HERE (9 Nov 14:26 UTC, end of the timeline-tests thread) — kept for the record:**
- **Production unchanged all thread:** hub 0.6.2, page `6d5ca55`. Every commit this thread is docs-only.
- **Next task: a BUILD PROPOSAL for one Timeline entry** (the Pliny Letters 6.16 entry), from the accepted design `docs/concepts/TIMELINE-PAGE-UX-PROPOSAL.md` rev 2.
  - **Carry forward** (written at the top of that doc): "Read the passage" goes straight to the source (the hash identifies the checked copy; the live link may change), and Back/keyboard focus is tested both ways (from a card; from a direct entry link).
  - **Implementation and the live navigation change each need their own approval.** The opening-page / Met placement audit is a separate track.
- **Timeline research, all closed and accepted** (packets on the Mac under `research/`; the repo holds IDs/dispositions only):
  - **Route W gate** (rev 2), **Wikipedia pilot** (rev 2.1).
  - **Test A**: human evolution, rev 2. Primary-source tally **7/7/10/7**; with the separate Bräuer abstract **7/8/9/7**. Lesson: preserve what was dated vs what the authors inferred (Omo 233 ± 22 kyr = eruption age → the authors' minimum-age inference).
  - **Access retry** (rev 2): no improvement in access to primary reports through the routes tried.
  - **OA List A**: 6 works found, 1 new abstract, 0 claims resolved. List B parked.
  - **Test B**: Pliny Letters 6.16, 4 supported + 1 absence finding (year); 24 Aug = our Julian conversion of the pinned Latin Library reading; date dispute attributed to an EGU 2021 abstract.
- **Inline quotation of the Latin needs clearance in REGISTER first** (Latin Library: no terms seen; Perseus: CC BY-SA 3.0 US). Until then the build links to the source.
- **Not approved:** build, live nav change, Test B extensions, List B, PDFs (H8b no stands).

**NEXT THREAD STARTED HERE EARLIER (9 Nov, end of the timeline research thread) — kept for the record:**
- **Production unchanged all thread:** hub 0.6.2, page `6d5ca55`. All of today's work was docs and research.
- **9 Nov 13:45 UTC:** List A CLOSED by GPT (corrections recorded). **Test B proposal rev 2**, **RUN DONE 14:00–14:04 UTC** (Mac `research/timeline-test-b/2026-11-09-claude/`): Latin gate passed (edition unnamed), no translation, S3 date check done, B1–B5 supported, mock entry fully traceable. **CLOSED by GPT** (4 supported + 1 absence finding). **Timeline page UX proposal rev 2** (`docs/concepts/TIMELINE-PAGE-UX-PROPOSAL.md`; title opens entry, no-JS list, source link by default) → for review; build and nav change each need their own approval.
- **OA PASS (List A) DONE 9 Nov 13:30–13:39 UTC:** all 6 works found; only new text = Debénath 1982 HAL abstract (no Salé); full text PDF-only (unopened); no claim resolved; tallies unchanged. **Next:** GPT read → Test B proposal (Chad's go).
- **9 Nov 13:23 UTC:** retry rev 2 **ACCEPTED** (primary-source tally 7/7/10/7; with the Bräuer abstract 7/8/9/7). **OA proposal rev 2: 30-min List A pass** awaits Chad's go; List B parked; then one Test B case with readable text (own go).
- **9 Nov 13:14 UTC:** retry rev 2 (no improvement in access to primary reports; 'binding constraint' withdrawn; SALE-F4 labelled) → for GPT. **OA-search proposal rev 1** (`docs/concepts/TIMELINE-TEST-A-OA-SEARCH-PROPOSAL.md`; O1–O5 Chad's) → for GPT/Chad. **Search not approved.**
- **TEST A ACCESS RETRY DONE 9 Nov 13:00–13:06 UTC** (Mac `research/timeline-test-a-retry/2026-11-09-claude/`): logins did not open subscription text; ScienceDirect blocks the pane; one re-code (SALE-F4). **Awaiting GPT review**; then Chad: Test B, another source strategy, or park.
- **TEST A REV 2 ACCEPTED by GPT (9 Nov 12:53 UTC)** as the corrected record of a partial diagnostic; pipe-escape formatting fix applied. **Next (Chad's go only):** text-only access retry with Chad's logins on the same finds/claims, then Test B or park.
- **TEST A REV 2 (9 Nov 12:31 UTC)** after GPT's review: selection pass under the applied contextual reading; 31 list-row assertions, 14 checked (corrected) → 7 · 7 · 10 · 7; access 1 · 2 · 1 · 2 across six primary reports. **Awaiting GPT's sign-off** (`research/timeline-test-a/2026-11-09-claude/rev2/`). Then possibly a separately approved logged-in text-only retry (Chad's offer). Nothing started.
- **TEST A RUN DONE 9 Nov 12:12–12:23 UTC** (Mac packet `research/timeline-test-a/2026-11-09-claude/`): selection pass (Omo, Salé, EH 06, LH 18, Jebel Irhoud); 31 row claims → 9 supported / 7 unsupported / 8 inaccessible / 7 no reference; access was the limit (1 of 6 primary texts in full). **Next: GPT's review of REPORT.md (paths only), then Chad decides** (e.g. a logged-in access run, Test B, or park). Nothing else approved.
- **PARAMETERS DECIDED 9 Nov 12:10 UTC (Chad):** H1–H8 as recommended, H3b (i), H8b no. Parameters only; **Test A run not started — needs its own go.**
- **CLOSED 9 Nov (GPT, relayed by Chad):** POC **rev 4 accepted as a proposal**; Wikipedia pilot **rev 2.1 accepted** as the corrected record of a partial diagnostic (GPT verified the frozen originals and append-only log). GPT's pick: H3b (i), H8b no. **Next is Chad's parameter line** (suggested: "H1–H8 as recommended, H3b (i), H8b no. Parameters only."); **the run needs its own go.**
- *Superseded record —* **Pending with GPT (9 Nov, after GPT's direct review of both Mac copies):**
  - **(a)** timeline POC proposal **rev 4** (`docs/concepts/TIMELINE-POC-HUMAN-PROPOSAL.md`): H3b one-sided rule put to Chad; selection incomplete/inconclusive if unfinished at 30 min. H1–H8 + H3b + H8b are Chad's.
  - **(b)** the Wikipedia-led pilot **rev 2.1** (`research/timeline-wikipedia-pilot/2026-11-09-claude/rev2/` on the Mac): G-P2 row restored; §4 access wording.
  - The opening-page / Met placement / top-tabs audit stays on its own docs track.
- **Closed:** Route W gate (rev 2 accepted); ENQUIRIES rev 7 (OpenSky, accepted).
- **Design note (Chad):** the timeline needs its own page and view, via **tabs at the top of the screen**, not the opening globe page. A later UX proposal; nothing built. A parallel docs-only opening-page / Met placement review is referenced by GPT but not held in this repo.
- **No research run, build or production action is approved.**

**NEXT (Route W gate closed, 9 Nov):** **GPT accepted rev 2** as the corrected evidence record of an inconclusive run (`research/timeline-route-w/2026-11-09-claude/rev2/REPORT-rev2.md` on the Mac; wording tidy-up done).
**Then (9 Nov 10:45–10:54 UTC):** the Wikipedia-led pilot ran; **rev 2** applied GPT's three corrections (**awaiting GPT's check of rev 2**) (`research/timeline-wikipedia-pilot/2026-11-09-claude/rev2/REPORT-rev2.md`).
- 9 units, partial inventory: qualifying 0, repetition 1, unsupported 2 (both not stated), inaccessible 1, no reference given 5.
- The flood/Pennsylvania/1870–1927 case was a method test only. Chad is considering a human-history or evolution theme for any future test; **nothing is selected.**
- **OpenSky:** ENQUIRIES rev 7 **accepted by GPT**. Aggregate hosting (counts per area, no identifiers or tracks) = yes within the standing conditions; account link automatic at 30%+ feeding. No REGISTER, purchase, install, build or production approval.
- **Timeline POC proposal rev 3** (`docs/concepts/TIMELINE-POC-HUMAN-PROPOSAL.md`; GPT's rev 1 and rev 2 corrections applied; rev 3 awaits GPT): two separate tests, Test A (human evolution) first. For GPT, then Chad's H1–H8. **Chad's design note:** the timeline needs its own page and view, via **tabs at the top of the screen**, not the opening globe page (later UX proposal; nothing built).
- **Next is Chad's choice.**
- Selection is inconclusive (1 eligible item). Full source-link/timing assessment and coverage are incomplete.
- Not a feasibility, coverage, route or build clearance.
- **Next is Chad's choice, nothing started:** a new gate with a different discovery method; a source-reading L pass; Route L on the same ground; or parking the timeline.
- the shared-area predicate reversal is recorded as a deviation;
- L/source-timing is uncompleted, so the 14 classes are provisional and coverage is incomplete;
- the request log is reconciled (two aborts, one overlap, "serial" withdrawn);
- the reference-row wording is corrected;
- the WDQS limits are added to the terms record;
- the month-end dates are fixed.

Selection stays **inconclusive** (1 event). **Next:** GPT's check of rev 2 (paths only), then Chad decides. None of the options is started: a new gate with a different discovery method; a source-reading L pass; Route L on the same ground; or parking the timeline.
- OpenSky follow-up (Q1b, Q1c, Q3) drafted for Chad to send himself; file any reply verbatim, linked to those questions, then GPT.

**Next, each on Chad's go:**
1. **R2 upload DONE 9 Nov 06:11:12 UTC** (Chad's Approve line): `ref/arts/met-R1-e394878.json`, read back sha256 `221bb1ca…9644` exact. No public effect while the hub is 0.6.1. **Rollback target pinned:** live hub 0.6.1, worker.js sha256 `f38296a0…2cc8`.
2. **Hub 0.6.2 DEPLOYED 9 Nov 06:13:19 UTC** and **page RELEASED 06:20:18 UTC** (main `6d5ca55`), verified (served hashes, live read). **GPT's independent live smoke test (~06:44–06:52 UTC): no blocking defect within the checks completed** (limits in STATUS 9 Nov: GPT did not independently hash index/app/arts/sources or capture raw HTTP status codes; one non-blocking wording note on the Sources table row, no fix requested). **Closed by Claude's tidy-up (06:59 UTC, STATUS):** no-store served hashes for all five page files, raw HTTP status codes (`/cells/arts` 404, health 8/8 200), production Worker CPU (1 ms per `/snapshot/arts`). **Outstanding:** iPhone Safari check (Chad); cold-load after-measurement (Chad, fresh profile; no live "before" any more); served transfer size; optional VoiceOver. Rollback page-first: revert `6d5ca55` → hub 0.6.1 `f38296a0…` → R2 object, each its own Approve line.
3. ~~GPT's review of R2 fireballs terms rev 2~~ **accepted** (bounded research-only evidence); REGISTER draft unfiled.
4. Later, each a separate decision: timeline route/gate; remaining backlog first gates (R5, R7, R10); Phase 0 domain decision; GIBS beyond the bench.
5. Still open by decision: FIRMS empty-input retry; 8 MiB guard; R11; open-page imagery date until reload; real-phone/Safari test.

**Learned this thread (keep):**
- **Visual checks find what tests miss:** screenshots caught a borrowed country heading ("China / Iran") after 86 passing browser checks; the Tab-order test caught `display:flex` overriding `hidden`. Test what is rendered (`offsetParent`, size), not just properties, and look at the page.
- **Two hashes, two jobs:** a records hash identifies *what* is published; a complete-file hash is what the hub must validate (provenance, dates and limitations included). The approval names the file hash.
- **Cache lifetime ≠ displayed lifetime:** `max-age` bounds what a *new* fetch can receive; an already-rendered list stays until switched off or reloaded; a page revert reaches viewers only on their next load.
- **R2 is billed separately** (R2 Paid subscription, $0 base, usage-billed), not inside Workers Paid. Read the account's usage from the dashboard GraphQL (`r2StorageAdaptiveGroups`, `r2OperationsAdaptiveGroups`, no bucket filter for account-wide) and keep proportional estimates apart from whole-unit invoice increments.
- **Accessibility-tree checks** verify names, roles, expanded states and relationships, not screen-reader announcements.
- **Public repo:** never write Chad's phone number or precise home address into it.
- **Classify accounts by relationship to the event, not format** (timeline T2-c / T2-r / T2-h / T2-s).

## 1-prev. Next as of the backlog thread handover (8 Nov 16:11 UTC commit time; superseded by §1, kept for the record)
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

