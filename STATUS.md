# Mother Earth — status

Newest first. Threads 1–13 are in `docs/STATUS-ARCHIVE.md` (moved verbatim 5 Nov). Current state and next steps: `HANDOVER.md`.

# 12 Nov 2026

## 12 Nov 11:27 UTC (clock reading at write) — **Thread close-out (START-HERE §9): Timeline inbox + What changed thread**

- **Mac `_review/` emptied 11:26:06 UTC (Mac clock):** `timeline-changes-rc`, `-preview`, `-r2` and `-r2-preview` moved to `_to_delete/20261112T112606Z/_review/` for Chad to empty.
- **Branch `timeline-changes-rc` deleted by Chad;** `git fetch -p`: remote = `main` + parked `aircraft-rc`.
- **Downloads tidy-up (Chad's ask):** 16 Mother Earth files moved from `~/Downloads` to `_to_delete/20261112T112606Z/Downloads/` (56 MB; each copied, hash-checked, then removed from Downloads). All 16 had a byte-identical copy in the project (research packets, `bench-private/`, the repo) or are public files that can be fetched again (`co2_daily_mlo.csv`, `horizons_batch.txt`). **Left in Downloads for Chad to decide:** `Performance_Trace` (11 Nov globe trace, the only copy), `index.html` (27 Oct first cut, no identical copy in the project), `credentials.json` (30 Oct, not opened). Nothing else in Downloads was touched.
- START-HERE: the live-state bullet for hub 0.6.9 / R2 and §4t (thread facts). HANDOVER: new "NEXT THREAD STARTS HERE" block. Project docs updated.
- **Mac sync at `45f0fac`, 11:27:15 UTC (Mac clock), preserve-first:** 318 tracked files; 17 updated and 5 new; every preserved copy matched an earlier commit (no local edits), kept under `_sync-preserved/20261112T112715Z/`; all 318 byte-identical afterwards (hash-list digest `fecb7d42f2f16faa` both sides). This entry was then copied the same way.
- Checkouts clean and pushed. Research packets and the private inbox untouched by the close-out.
- Live unchanged since the release: hub 0.6.9, page `12ff4ff`. Nothing pending approval.

## 12 Nov 11:18:16 UTC (push time) — **PAGE RELEASED: Timeline "What changed" + evidence last reviewed** (main merge `12ff4ff` of `timeline-changes-rc` @ `281bb55`, code `eed6c28`; Chad: "Approve: merge timeline-changes-rc to main (page change: Timeline What changed + evidence last reviewed)") — entry written 11:21 UTC

- **Merge (11:18:09 UTC commit time):** no conflicts (main side: STATUS and the backlog view only). The ten page files, worker.js and both catalogue files are byte-identical to the branch. On the merge: generator `--check` OK; timeline-changes-build 45/45; timeline-catalogue-hub 73/73. main's `phase1/worker.js` = live hub 0.6.9 `3e791a5c…c49d`, so **main = live**.
- **Served hashes: all ten page files exact at 11:19:47 UTC** (pane clock, no-store, first try). **This is the first verified live observation of the release; it is on 12 Nov UTC, the date the page states.**

  | File | sha256 (first 16) | |
  |---|---|---|
  | timeline.html | `2f5a246c31ac56f7` | changed |
  | timeline.js | `713ecd4fad97908a` | changed |
  | style.css | `e48b3fc067ea7558` | changed |
  | index.html | `5d2d284c934628fb` | `style.css?v=` only |
  | sources.html | `5c3e4a7e7dc00087` | `style.css?v=` only |
  | app.js | `9df9dce8cb082349` | unchanged |
  | arts.js | `58773cef35e6e947` | unchanged |
  | sky.js | `2056da8d8bf544e8` | unchanged |
  | skyscene.js | `5e00ad77cec264bb` | unchanged |
  | oceanheat.js | `a45097baed582d7f` | unchanged |

- **Live read of the public Timeline page (fresh load, 11:20:24 UTC, pane, 588×834 = phone layout):** assets `?v=202611301000`; embeds revision `tl-2026-11-R2` and catalogue sha256 `2f39aa30…0356`; **one hub request, to `/catalogue/timeline/tl-2026-11-R2`**; axis on, 5 marks; no horizontal overflow.
  - "Timeline page updated 12 Nov 2026 · revision tl-2026-11-R2 · What changed"; headings "12 Nov 2026 — revision tl-2026-11-R2" and "10 Nov 2026 — revision tl-2026-11-R1 (first release)".
  - End-Triassic: label "Approximate age of the extinction level in the rock record"; text option A; "Evidence last reviewed: 10 Nov 2026 · Changed in revision tl-2026-11-R2: wording clarified". Pliny: "Evidence last reviewed: 9 Nov 2026". The R2 change record word for word.
  - The jump: entry open (sheet, page inert) → "wording clarified" → sheet closed, record in view and focused → Back → entry open, focus on the link → Close → closed, fragment cleared.
- **Observed, as designed:** the pane's first navigation (11:20:10 UTC) got the **old page from its browser cache** (transfer size 0): build `202611221000`, revision R1, axis on from R1. A cached matched R1 page and script keep working until the cache expires or the page is reloaded.
- **Earth now page (fresh load, 11:20:44 UTC):** `style.css?v=202611301000` loaded (448 rules); earthquakes and fires cards current; header and tabs as before; no overflow; hub 0.6.9.
- **Timeline inbox:** TL-IN-0001 marked **released** in the private item (11:20:57 UTC, Mac clock), after this live verification.
- **Limits:** pane only (not a real phone); desktop width not read live (covered by the suites and GPT's Chrome re-check on the preview); Safari and screen reader untested; Worker CPU not measured; GPT has not checked the live release.
- **Rollback (each its own Approve line):** page = revert `12ff4ff` with both pins kept (axis preserved only for readers with a matched cached R2 page and script; fresh loads get R1). Hub = 0.6.8 `85737a48…c427`, a separate decision: it removes the R2 route, and cached R2 pages fall back to the static list. The R2 object stays.
- **Open (Chad):** delete branch `timeline-changes-rc` on GitHub; thread close-out (START-HERE §9) not yet done — Mac `_review/` holds four `timeline-changes-rc*` folders.

## 12 Nov 11:11:37 UTC — **HUB 0.6.9 DEPLOYED** (Chad: "Approve: deploy hub 0.6.9 from 281bb55 (content only)"); **live RC from the Pages origin PASSED** — entry written 11:16 UTC

- **Before (11:11:12 UTC, dashboard tab):** live worker.js = 0.6.8 `85737a48c97a0ee1817b3a70883ba4d334b82da4092135a367d25a676c17c427` (293,193 B; the rollback target); 19 bindings; health 8/8 (200); `/` = 0.6.8.
- **Source:** raw.githubusercontent at `281bb55`: 293,542 B, sha256 `3e791a5c7ea501ac89c87e355aef1defed81456ef5bc6d80a0f8de1750d1c49d` (= the file GPT passed at `eed6c28`). Source hash and the live 0.6.8 hash re-checked in the tab immediately before the write.
- **Deploy:** content-only PUT 11:11:34.6Z → HTTP 200, success, etag `6196e51c…9475`, modified 11:11:37.160Z. Bindings, secrets, variables and crons untouched.
- **Verified 11:11:48 UTC:** read-back `3e791a5c…c49d` exact; 19 bindings, identical list; `/` = **0.6.9**, history collecting; `catalogues.timeline` = legacy path + revision R1, **current `tl-2026-11-R2`**, revisions R1 and R2; health 8/8 (200).
  - `/catalogue/timeline`, `/catalogue/timeline/` and `/catalogue/timeline/tl-2026-11-R1` → 200, 15,656 B, **R1's original bytes `096ae648…0fbe`**, max-age=60.
  - `/catalogue/timeline/tl-2026-11-R2` → 200, 18,120 B, `2f39aa30…0356` exact, ETag = file hash (weak, as on the other catalogues).
  - `/tl-2026-11-R3`, `/tl-2026-11-R2/`, `//tl-2026-11-R2` → 404 `unknown revision`, no-store.
  - Unchanged routes 200: sky R1 `f851f164…`, arts `221bb1ca…`, Ocean Heat manifest `dcc34674…` (immutable), `/snapshot/usgs`, `/cells/drifters`, `/status`.
- **First scheduled runs on 0.6.9 (D1, read 11:16:07 UTC):** usgs 11:15:10 ok; firms 11:15:46 ok (970,429 B raw); forest 11:12:36 ok (its tick started 11:11:37.5, at the moment of the deploy). No down or degraded run.
- **Live RC from the Pages origin (11:12:30–11:13:06 UTC, pane tab on a plain-text github.io file, 588×834 = phone layout):**
  - **CORS:** legacy URL, `/tl-2026-11-R1` and `/tl-2026-11-R2` each `type: cors`, 200, exact sha256, ETag readable; unknown revision `cors` 404.
  - **Branch page** (timeline.html, timeline.js, style.css fetched by commit `281bb55`, hashes exact, blob-injected into the clean tab): axis **on**, build `202611301000`, revision R2, 5 marks; **exactly one hub request, to `/catalogue/timeline/tl-2026-11-R2`**; no page error; no horizontal overflow.
  - Rendered text exact: "Timeline page updated 12 Nov 2026 · revision tl-2026-11-R2 · What changed"; both release headings; the R2 change record and the entry line word for word; the approved label on the card, the entry and the axis mark.
  - **The jump, live:** open End-Triassic (sheet, page inert, locked) → "wording clarified" → sheet closed, nothing inert, record in view and focused → Back → the entry open again, **focus on the link** → Forward → record focused → Back and Close → closed, fragment cleared.
  - **The live public page** (still the R1 page, build `202611221000`) on 0.6.9: axis on, 5 marks, one request, to `/catalogue/timeline/tl-2026-11-R1`. Unchanged for readers.
- **Public page unchanged:** served `timeline.html` `d7c37d5f…`, `timeline.js` `ae87c6a1…`, `style.css` `fad92f02…`, `index.html` `59500752…`, `sources.html` `44b6e42d…` (11:12:30 UTC). **main ≠ live hub** until the branch merges (main's worker.js is 0.6.8).
- **Limits:** the pane is not a real phone; desktop width not exercised live (covered by the suites); Worker CPU not measured.
- **Rollback (own Approve line):** hub = 0.6.8 `85737a48…c427`. Harmless to leave: the live page asks only for R1.
- **Next (Chad):** `Approve: merge timeline-changes-rc to main (page change: Timeline What changed + evidence last reviewed)` — today, latest start 22:00 UTC, so the page's 12 Nov date is true.

## 12 Nov 11:09:38 UTC — **R2 UPLOAD DONE: `ref/timeline/tl-2026-11-R2.json`** (Chad: "Approve: upload ref/timeline/tl-2026-11-R2.json (complete-file sha256 2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356, 18,120 B) to R2")

- **Pre-checks (11:09:16 UTC, dashboard tab):** destination absent (404 "The specified key does not exist"); `ref/timeline/` held only `tl-2026-11-R1.json` (15,656 B). Source fetched from raw.githubusercontent at branch commit `281bb55`: HTTP 200, 18,120 B, sha256 `2f39aa30…0356` = the approved hash. Source hash and absence re-checked immediately before the write.
- **Upload:** dashboard R2 objects API `PUT` at 11:09:38.048Z → HTTP 200, success, size 18,120, storage class Standard, etag `329dd82ba7cdae4fb55ccf8b12b8d40c`, version `7e5e308d101a811bf2dafde871a58765`, uploaded **11:09:38.699Z**.
- **Read-back (11:09:39 UTC):** HTTP 200, 18,120 B, **sha256 `2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356` (exact)**.
- **R1 untouched:** the R1 object read back 15,656 B, `096ae648…0fbe`; its listing still shows its 10 Nov 06:06:51 upload.
- **No public effect:** the live hub is still **0.6.8** (`/` read after the upload); `/catalogue/timeline/tl-2026-11-R2` → 404 "unknown revision"; `/catalogue/timeline/tl-2026-11-R1` → 200 with R1's exact bytes.
- **Rollback target pinned for the hub deploy (11:09:52 UTC, read back from Cloudflare):** live worker.js = **0.6.8, sha256 `85737a48c97a0ee1817b3a70883ba4d334b82da4092135a367d25a676c17c427`** (293,193 B). Candidate at `281bb55`: 293,542 B, `3e791a5c7ea501ac89c87e355aef1defed81456ef5bc6d80a0f8de1750d1c49d`.
- **The R2 object is now uploaded**, so by proposal §3.5 any change to the catalogue bytes (including a release-date slip past today) needs a **new revision ID and key**; this object would then stay, unused.
- R2 cost: one Class A write and a few Class B reads, inside the allowances. Removing the object would be a separate action on its own Approve line.
- **Next (each its own line):** `Approve: deploy hub 0.6.9 from 281bb55 (content only)` → live RC from the Pages origin → the page merge.

## 12 Nov 11:06 UTC (clock reading at write) — **GPT's re-check PASSED for timeline-changes-rc rev 2; release hold lifted; awaiting Chad's R2 upload line** (docs only)

- GPT (relayed by Chad): passed for packet `6fbbad5` / code `eed6c28`. The repeated-jump focus defect is closed in Chrome on desktop and at 390×844; reload → Forward → Back also restored the correct link focus at 390×844. The browser re-check used the local preview in Chrome.
- **Release hold lifted.** Ready for Chad's separate R2 upload approval; the deploy and the merge keep their own approvals, with the live Pages-origin check between them.
- Packet updated on the branch (`281bb55`, docs only: §10 records the re-check; the rollback note now reads "a matched cached R2 page and R2 script"). No code, catalogue or page file changed after `eed6c28`. The Mac `_review/timeline-changes-rc-r2/` copy stays at the reviewed `6fbbad5`.
- **Final hashes rechecked 11:06:18 UTC (workspace clock):** generator `--check` passes; catalogue `2f39aa3001c382a1c466386a88364cecec3583aa7767ba8c7c766a6c715a0356` (18,120 B) = the hub pin in worker.js (`3e791a5c…c49d`); release_date **2026-11-12**, previous R1. timeline.html `2f5a246c…fda5`, timeline.js `713ecd4f…8fad`, style.css `e48b3fc0…bc69`, index.html `5d2d284c…43aa`, sources.html `5c3e4a7e…f937`.
- The date holds only if the page is released today (latest start 22:00 UTC). **Not approved yet:** R2 upload, hub 0.6.9 deploy, page merge. Live unchanged: hub 0.6.8, page `7c3aa22`.

## 12 Nov 10:58 UTC (clock reading at write) — **timeline-changes-rc rev 2 @ `6fbbad5`** (code `eed6c28`; focused fix after GPT's review of `fe4cf18`; branch only) — packet §9

- **GPT (relayed by Chad): hold the upload, deploy and merge lines pending a focused branch fix.** Accepted: the `entries` / `records` / `releases` shapes, the focus retry, the desktop Back behaviour, the narrowed privacy check. GPT's independent checks passed (318 manifest entries, generator 45/45, hub 73/73, static fallback, the preview's five marks; Worker diff = version + Timeline pin and current only).
- **Defect GPT reproduced (desktop and 390×844, Chrome, no reload):** Open End-Triassic → Changed in … → Open the entry → Changed in … → Back ×3: the third Back reopened the entry but focused its heading. Cause: one jump kept in page memory, overwritten by the second jump.
- **Fix (`timeline.js` only):** each jump's history state carries its own return target (the entry key and the link id); every pushed state records the key of the entry it was pushed from, and direction is read from that, never from the size of a key; the current state is tracked from `history.state` (survives a reload) and refreshed on `hashchange`; keys are unique across reloads. timeline.js `713ecd4f…8fad` (29,113 B). **Every other served file, the catalogue (`2f39aa30…0356`) and worker.js (`3e791a5c…c49d`) are unchanged.**
- **Tests on `eed6c28`:** timeline-changes-ui **173/173** (new block: GPT's sequence, three reload cases incl. reload with Forward history, a plain fragment in between); 14 breaks each fail, incl. `single-jump-memory`, which re-creates the defect and fails exactly on "Back 3" and the reload cases. timeline-ui 585 (two break anchors repointed; 12 breaks rerun, each fails), timeline-axis 96, timeline-changes-build 45, timeline-catalogue-hub 73, desktop-overflow 112, mobile-pass 131, terminator-ui 19. The other 44 suites were not rerun (only `timeline.js` and two test files changed since the full run).
- **terminator-ui** stays recorded as intermittent (18/19 once in the full run), cause unverified.
- **Release date rechecked 10:56 UTC:** still 2026-11-12; holds only if the page is released today (latest start 22:00 UTC), else rebuilt before any upload. Hashes to be rechecked again before any approval line.
- **Rollback note qualified (GPT):** a page revert with both pins kept preserves the axis only for readers who still hold a matched R2 page and script.
- **Mac:** `_review/timeline-changes-rc-r2/` = `6fbbad5` (318 files, every SHA256SUMS line OK, 10:57:47 UTC Mac clock) and `-r2-preview/`. Rev 1 folders kept.
- **Next:** GPT's re-check; then the three lines, each its own. **Nothing uploaded, deployed or merged.** Live unchanged: hub 0.6.8, page `7c3aa22`.

## 12 Nov 10:23 UTC (clock reading at write) — **Timeline "What changed" candidate BUILT on branch `timeline-changes-rc` @ `fe4cf18`** (code `9f31fb6`; Chad's Approve line; no merge, R2 write, hub deploy or page change) — packet `reviews/2026-11-12-timeline-changes-rc.md` (on the branch)

- Chad: "Approve: build timeline-changes-rc on a branch only — TL-IN-0001 option A, review snapshot sha256 d7b895c5b0a5361e06ebbd05dacedd0a3727e27050ff5622b9f9938f2a405d8d, What changed and evidence-last-reviewed per TIMELINE-INBOX-AND-CHANGES-PROPOSAL rev 2.1; no merge, R2 write, hub deploy or page change." Acceptance recorded in the private item (09:33:20 UTC, Mac clock); item now "built".
- **Catalogue `tl-2026-11-R2`** (schema 2; 18,120 B; sha256 `2f39aa30…0356`): release block (release_date 2026-11-12, previous R1), change records (R1-1, R1-2, R2-1), `evidence_reviewed` per entry (Big Five 10 Nov, Pliny 9 Nov). Apart from the new fields and the one approved label and text, identical to R1 (tested). **R1 untouched** (`096ae648…0fbe`).
- **Hub 0.6.9 (branch):** R2 pin added, current = R2, legacy = R1; no route code changed. worker.js `3e791a5c…c49d`.
- **Page (branch):** "Timeline page updated … · What changed" line; "Evidence last reviewed" on every entry; What changed section; the "Changed in …" jump across the phone sheet (visual close only; Back reopens the entry with focus on the link). `timeline.js` and `style.css` `?v=202611301000`; `index.html` and `sources.html` change by that version string only.
- **Tests:** timeline-changes-build 45/45 (8 breaks each fail); timeline-changes-ui 135/135 (12 breaks each fail; real hub code in-process; real R1 page files from `cc91165`); timeline-ui 585, timeline-axis 96 (8 breaks fail), timeline-catalogue-hub 73 (7 breaks fail).
- **Full regression 09:51–10:16 UTC:** 51 suites run, 50 green, 4 manual/network tools skipped. **One failure not from this change:** terminator-ui 18/19 once (1 of 104 shading probes); 19/19 on four captured reruns alone. Cause not investigated.
- **Found by the tests:** Chrome drops focus set during Back when it then handles the entry's fragment; the link is focused again on a zero-delay timer.
- **Mac:** `_review/timeline-changes-rc/` = `fe4cf18` (318 files, every SHA256SUMS line OK, 10:23 UTC) and `_review/timeline-changes-rc-preview/` (one-line change so the axis reads the local catalogue; README).
- **Not done:** live checks (nothing uploaded or deployed), Worker CPU, real phone, screen reader.
- **Release date note:** the catalogue says 12 Nov. If the page is not released today (latest start 22:00 UTC) the date is rebuilt before anything is uploaded (new hash and pin).
- **Next:** GPT reviews the candidate; then the R2 upload, the hub 0.6.9 deploy and the page merge, each on its own Approve line. Live unchanged: hub 0.6.8, page `7c3aa22`.

## 12 Nov 09:29 UTC (clock reading at write) — **GPT approved TL-IN-0001 review snapshot 1 (option A); item now "reviewed"** (docs only)

- GPT (relayed by Chad): both supplied hashes verified. Claim label approved as written; **option A selected**; public change record and entry line approved as written.
- **Count verification, GPT's (recorded separately in the private item):** He et al. 2020, Results, "Sulfate S isotope trends", identifies three localities immediately before the excerpt's "In all sections"; Figure 2 names Mount Sparagio, Cloghan Point and Black Bear Ridge. This is GPT's reading of the article, not Claude's and not in the research packet's excerpt. It closes the open point on "three".
- Private item history appended 09:28:44 UTC (Mac clock); index updated. **Both frozen files unchanged** (evidence record `fe176e16…d8c9`, snapshot `d7b895c5…5d8d`, re-hashed on the Mac after the append). Source checked date and entry-wide "evidence last reviewed" both stay 10 Nov 2026.
- **Next (Chad):** the branch-build line, naming option A and the snapshot sha256 `d7b895c5b0a5361e06ebbd05dacedd0a3727e27050ff5622b9f9938f2a405d8d`. **Not approved:** branch build, R2 upload, hub deploy, page release. Live unchanged: hub 0.6.8, page `7c3aa22`.

## 12 Nov 09:21 UTC (clock reading at write) — **Timeline inbox CREATED; TL-IN-0001 logged; review snapshot 1 frozen for GPT** (docs only, on Chad's Go line)

- Chad: "Go: create the Timeline inbox (Mac research/timeline-inbox/ + Project) and log TL-IN-0001 (docs only)".
- **Inbox** created in the Mac folder `research/timeline-inbox/` and mirrored to the Claude Project: README (rules), index, the item, evidence record 1 and review snapshot 1. All five Mac files hash-checked against the written copies at 09:21:28 UTC (Mac clock). **Its contents are not in this repo.**
- **TL-IN-0001** (GPT's 10 Nov "extinction horizon" wording note): logged, triaged, **in evidence review**. The evidence record is an editorial check against the He et al. 2020 passage already in the Big Five research packet (no source opened; no date moves).
- **Review snapshot 1** (frozen; the reference for approvals): sha256 `d7b895c5b0a5361e06ebbd05dacedd0a3727e27050ff5622b9f9938f2a405d8d`. Evidence record sha256 `fe176e16…d8c9`.
- **Open point carried to GPT:** the packet's recorded excerpt says "In all sections" and gives no count; "three" is in the released R1 text and in GPT's review, but no excerpt on record states it. The snapshot offers the wording with "three" (option A) and without (option B).
- **Next:** GPT reviews the snapshot. Then Chad's branch-build line naming the snapshot's sha256 (proposal §9 step 3). **Not approved:** branch build, R2 upload, hub deploy, page release. Live unchanged: hub 0.6.8, page `7c3aa22`.

## 12 Nov 09:18 UTC (clock reading at write) — **Timeline T1/T4 proposal rev 2.1** (GPT's re-check of rev 2 applied; docs only)

- GPT (relayed by Chad): rev 2's sha256 verified; states, the three dates, the reduced validator, the 22:00 UTC cutoff and the phone Back behaviour agreed; **the private inbox setup is ready for Chad's docs-only Go**; C1–C5 remain Chad's. A docs re-check.
- Rev 2.1: approvals reference a frozen review snapshot (the live item file's hash changes as its history grows), and GPT reviews that snapshot before the branch-build line; privacy guarantee = inbox fields and private paths kept out of shipped data and pages, public evidence pointers limited to records already suitable for publication; cutoff = latest start, first verified live observation recorded, a midnight straddle cannot prove the cutover day, `previous` always names the last reader-facing release (R1); the "Changed in …" jump reuses the visual close without the Close handler, tested with Back and Forward from card-opened and direct-link entries; the mixed pair (old HTML re-fetching the new script) shows the static list and is tested.
- **Not approved:** inbox creation (Chad's Go line pending), branch build, R2 upload, hub deploy, page release. Live unchanged: hub 0.6.8, page `7c3aa22`.

## 12 Nov 09:15 UTC (clock reading at write) — **Timeline T1/T4 proposal rev 2** (GPT's review of rev 1 applied; docs only)

- GPT (relayed by Chad): rev 1's sha256 verified; **revise before branch build**; C1–C5 remain Chad's. A docs review.
- Rev 2 (`docs/concepts/TIMELINE-INBOX-AND-CHANGES-PROPOSAL.md`):
  1. **Inbox states:** "reviewed" and "accepted" each name the specific reviewed version (sha256), both recorded in the private item; a material change after review goes back through review; the branch-build go and the page-release approval are distinct; "released" only after the matched page and catalogue are verified live.
  2. **No inbox reference in anything public:** the `inbox` field is dropped from the changes file and catalogue; the mapping to the public change ID lives in the private item.
  3. **Three dates kept apart:** page release date, per-entry "evidence last reviewed" (entry-wide reviews only, recorded explicitly, never derived), per-source checked date. Rev 1's validator rule withdrawn (it would have rejected a partial re-check). Stated dates verified against the records: Big Five 10 Nov, Pliny 9 Nov. A differing-dates test asserts the rendered values. The date-change fixture keeps each side's own citation and checked date. Withdrawals deferred.
  4. **Release day:** planned UTC day, no release started after 22:00 UTC, the actual live day verified and recorded; a date-only rebuild may keep the ID only before upload or pin, otherwise a new ID and key.
  5. **Wording (GPT's, the C5 lean):** label "Approximate age of the extinction level in the rock record"; text "In each of the three sections studied, a large sulfur-isotope shift about 201.5 million years ago coincides with the level in the rock record that marks the extinction."
  6. **Compatibility:** new `?v=` on `timeline.js` (and `style.css` where its bytes change); the real R1 page files (main `cc91165`; checked: `timeline.html` and `timeline.js` are unchanged since) tested against the candidate hub; R1 hashed against its known pin in its own test; links tested both ways across the phone sheet; Pliny `-conv` / `-debate` fragments in the anchor regression; rollback trade-off stated (page revert keeps cached R2 readers' axis; a hub rollback to 0.6.8 would not, and is a separate decision).
- **Not approved:** inbox creation, branch build, R2 upload, hub deploy, page release. Live unchanged: hub 0.6.8, page `7c3aa22`.

## 12 Nov 09:10 UTC (clock reading at write) — **Timeline T1 inbox + T4 "What changed" proposal rev 1 written** (docs only, on Chad's go); sea ice recovered

- New thread (lockdown-pass handover). Chad: "Go: draft the Timeline T1 discovery inbox and T4 public 'What changed' proposal for GPT review", small first delivery, proposal only.
- **Proposal:** `docs/concepts/TIMELINE-INBOX-AND-CHANGES-PROPOSAL.md` rev 1 (main `4001a73`, sha256 `b03f51e6…6ad9`; Mac copy hash-checked 09:07:09 UTC, Mac clock; Claude Project copy written).
  - **T1:** a private inbox (Mac `research/timeline-inbox/` + Project, outside the public repo); states logged → triaged → in evidence review → reviewed → accepted → released. Worked example **TL-IN-0001** = GPT's 10 Nov "extinction horizon" wording note on the end-Triassic entry.
  - **T4:** a pre-rendered "What changed" section; per-entry "Evidence last reviewed" kept apart from the release date; old and new values side by side when a date changes (test fixture only in the first delivery).
  - **Preserved:** entry IDs and anchors; R1's object, pin and both routes. The first delivery would be a new revision `tl-2026-11-R2`.
  - Decisions C1–C5 are Chad's after GPT. Approval lines listed in §9; **none given**.
- **Not approved:** inbox creation, branch build, R2 upload, hub deploy, page release.
- **Sea ice (read-only, D1):** the 03:08 UTC run was down (NSIDC north daily file HTTP 521; climatology 200). **The 09:08 run recovered:** finished 09:08:12 UTC, ok, HTTP 200, data date 2026-11-10 (read at 09:10:08 UTC, D1 clock). One failed run in the last six.
  - Sea ice still takes the generic failure write, so one failed run can blank the tile until the next 6-hourly run although the last good reading exists (the shape buoys had before hub 0.6.8). **Chad: keep the fallback on the backlog for now; if failures recur, bring back the evidence and a sea-ice-only scope.** Nothing changed.
- **Buoy watch (read 08:52:57 UTC, D1 clock):** 13 of 13 runs ok since the 0.6.8 deploy; the fallback has still not run on production.
- Live unchanged: hub 0.6.8, page `7c3aa22`.

## 12 Nov 08:50 UTC (clock reading at write) — **Lockdown pass closed and parked (Chad); back to the backlog** (docs only; nothing changed)

- Chad paused the wider migration (12 Nov), asked for the remaining read-only access checks and a rehearsal plan for a narrower website-publishing restriction, then parked it: "Let's park the publishing restriction here and return to the backlog."
- Done this pass, all read-only or in scratch: access checks (some still need Chad at the screen); rehearsal plan revs 1 and 2 (GPT cleared rev 2 for an isolated rehearsal only); one rehearsal attempt on Chad's Go, **stopped before any site build** because the site builder could not be obtained in the workspace. **The candidate was not tested.**
- **No change** to the repo's page files, GitHub Pages, any setting, permission, the hub, collectors, storage or production. No purchase, upgrade or visibility change. Nothing was installed on the Mac.
- **Records are outside this repo:** Mac `research/lockdown/2026-11-12-claude/` (plan, stop report, `rehearsal-evidence/`) and the Claude Project. Detail is deliberately not recorded here.
- Checked while there (read-only, 08:34–08:40 UTC): GitHub's own build artefact for `d4095c5` holds all ten page files byte-identical to the pinned hashes.
- **Next:** Chad chooses the next backlog item (HANDOVER lists the candidates). The private-control-centre direction stands but nothing further is scheduled or approved.
- **Close-out (START-HERE §9), checked 08:50 UTC:** Mac `_review/` empty; no branch was created this pass (remote: `main` + parked `aircraft-rc`); workspace rehearsal scratch removed; research packets untouched; Mac sync of the three changed docs follows this commit, preserve-first (the Mac copies matched `d4095c5` before the sync).

## 12 Nov 03:44 UTC (clock reading at write) — **Lockdown stage 0 done: read-only fact check and audit; staged proposal rev 2 written** (nothing changed)

- On Chad's line "Go: lockdown fact check and audit of what was already public (read-only)". Run 03:32–03:40 UTC. No purchase, plan, setting, code, deployment or visibility change.
- GPT's review of rev 1 adopted (protect the repository first; restricting the live site is a separate staged job; no redesign of the hub, collectors, storage or globe). Chad's three corrections applied in rev 2.
- **Findings and proposal rev 2 are filed outside this repo:** Mac `research/lockdown/2026-11-12-claude/` (`LOCKDOWN-FINDINGS-2026-11-12.md`, `LOCKDOWN-MIGRATION-PROPOSAL.md`; rev 1 kept beside them) and the Claude Project. Detail is deliberately not recorded here.
- **Next:** GPT's review, then Chad's Stage 1 review. Four read-only access checks are still owed and need Chad at the screen. Stage 1 and Stage 2 each need separate review and approval; every rehearsal is its own approval.

## 12 Nov 02:48 UTC (clock reading at write) — **Direction change (Chad): Mother Earth becomes a private control centre; migration proposal rev 1 written** (docs only; nothing changed)

- **D1 decided by Chad:** the repository, the working record, the dashboard and general hub access are to be private, limited to Chad and the build and review workflows he authorises. Narrow allowances: the eight UptimeRobot health checks and the authenticated ships ingest. Products built from Mother Earth can have their own public pages and data endpoints where he chooses; kept at design level until a first product has a concrete data requirement.
- **Separate decisions, not taken:** the future code licence; any cleanup of published history. Previously published copies are outside the lockdown.
- **Proposal rev 1** for GPT, then Chad: `research/lockdown/2026-11-12-claude/LOCKDOWN-MIGRATION-PROPOSAL.md` in the Mac folder, and `claude/concepts/LOCKDOWN-MIGRATION-PROPOSAL.md` in the Claude Project (sha256 `ebefa16d…c283`). It is **not** filed in this repo, which is still public.
- **Not approved:** research, any account, repository, hosting, licence or production change. The first two steps the proposal asks for are read-only (confirmations; audit of what was already public), each on Chad's own go.
- Also this session: Chad is registering a domain separately.

## 12 Nov 01:49 UTC (clock reading at write) — **Thread close-out (START-HERE §9): Fires wording + OSMC reliability thread**

- Mac `_review/` emptied 01:44:45 UTC (Mac clock): `osmc-reliability-rc` and `osmc-reliability-rc-r2` moved to `_to_delete/20261112T014445Z/` (313 files each) for Chad to empty.
- Branch `osmc-reliability-rc` deleted by Chad; `git fetch -p`: remote = `main` + parked `aircraft-rc`.
- START-HERE: two live-state bullets and §4r (thread facts). HANDOVER: new "NEXT THREAD STARTS HERE" block. Project docs updated. **Mac sync at `68d9ad9`, 01:49:58 UTC (Mac clock), preserve-first:** 312 tracked files; 9 updated (HANDOVER, START-HERE, STATUS, app.js, index.html, sources.html, worker.js, drifters-hub and oceanheat-hub tests) and 4 new; every preserved copy matched an earlier commit (no local edits), kept under `_sync-preserved/20261112T014958Z/`; all 312 byte-identical afterwards (hash-list digest `b2805d25eabd6af8` both sides). This entry's own correction was then copied the same way.
- Live unchanged: hub 0.6.8, page `7c3aa22`. Nothing pending approval.
- **Tidy-up on Chad's ask, 02:34:11 UTC (Mac clock):** this thread's eight `_sync-preserved/` folders (19 files, every one matching an earlier commit) moved to `_to_delete/20261112T023411Z/_sync-preserved/` for Chad to empty. The 131 folders from earlier threads stay; they were recorded as matching earlier commits at the time and were not rechecked now.

## 12 Nov 01:41 UTC (clock reading at write) — **Fires wording seen live in the real header-only state; hub 0.6.8 clean overnight** (read-only; Chad asked for the status)

- **Fires card, live page, 01:40:59 UTC (pane):** state UNKNOWN, count "–", "NASA FIRMS · VIIRS NOAA-20 · world · retrieved 10 min ago · Today’s detections aren’t available yet.", tooltip the same sentence, "Records withheld: records are from a different collector run (records 23:45 UTC, counts 01:30 UTC) — counts shown alone". This closes the "not yet seen live" item from the 11 Nov 17:44 entry. D1: 7 firms runs since 00:00 UTC logged down with the header-only note (the expected daily state).
- **Hub 0.6.8 since the 19:38:18 UTC deploy (D1, read 01:40 UTC):** drifters 6 runs, 6 ok; usgs 73/73; swpc 6/6; co2 6/6; forest 12/12; ships 11/11; orbital 3/3; seaice 1/1; firms 17 ok + the 7 header-only. No buoy failure yet, so the new fallback has not run on production.
- **Open, Chad's:** delete branch `osmc-reliability-rc` (still on GitHub); thread close-out (START-HERE §9) not yet done — Mac `_review/` holds `osmc-reliability-rc` and `osmc-reliability-rc-r2`.

# 11 Nov 2026

## 11 Nov 20:12 UTC (clock reading at write) — **Hub 0.6.8: first scheduled runs all ok** (read-only, D1 via the connector, read ~20:12 UTC)

- Runs finished after the 19:38:18 UTC deploy: **drifters 1 ok** (started 20:07:58.510, finished 20:08:10.352 UTC, HTTP 200, **1,303 buoys**, 0 refused, newest fix 19:04 UTC) · usgs 7 ok · firms 2 ok (44,140 records at 20:00) · swpc 1 ok · co2 1 ok · forest 1 ok · orbital 1 ok (32,663) · ships 1 ok. No down or degraded run on any layer.
- The buoy failure path has not run on production (no failed buoy run since the deploy); it stays proven by tests until a real failure occurs.

## 11 Nov 19:38:18 UTC — **HUB 0.6.8 DEPLOYED** (Chad: "Approve: deploy hub 0.6.8 from 51f87fc (content only)") — entry written 19:38 UTC

- **Before (19:37:57 UTC, dashboard tab):** live worker.js = 0.6.7 `53ede31e…fb9e43` (287,973 B; the rollback target); 19 bindings.
- **Source:** raw.githubusercontent at `51f87fc`: 293,193 B, sha256 `85737a48c97a0ee1817b3a70883ba4d334b82da4092135a367d25a676c17c427` (= the file GPT cleared at `d28763d`). Hash and the live 0.6.7 hash re-checked in the tab immediately before the write.
- **Deploy:** content-only PUT 19:38:15Z → HTTP 200, success, etag `932239ee…918b`, modified 19:38:18.025Z. Bindings, secrets, variables and crons untouched.
- **Verified 19:38:42 UTC:** read-back `85737a48…c427` exact; 19 bindings, identical list; `/` = **0.6.8**, history collecting; health 8/8 (200); `/cells/drifters` and `/snapshot/drifters` 200, same run (19:08:09, 1,302 buoys, written by 0.6.7), no `last_attempt`; `/place` buoy section ok; `/snapshot/usgs`, `/snapshot/arts`, sky, timeline and Ocean Heat catalogue routes 200.
- **main = live again** (hub 0.6.8 `85737a48…`, page merge `7c3aa22`).
- **Pending:** first scheduled buoy run on 0.6.8 (20:07 UTC job), to be read in D1. The failure path itself is proven by tests only until a real failed run occurs.
- **Rollback:** hub = 0.6.7 `53ede31e…fb9e43`; page = revert `7c3aa22`; each its own Approve line, independent. A `last_attempt` already in R2 stays until the next run successfully replaces the envelope, normally within an hour.

## 11 Nov 19:27 UTC (clock reading at write) — **OSMC reliability: PAGE RELEASED (merge `7c3aa22`, 19:23:40 UTC commit time); hub 0.6.8 NOT deployed (live hub 0.6.7)**

- GPT cleared rev 2 for Chad's page-first merge approval (all 312 manifest entries and the revised worker and index hashes verified; hub suite rerun independently 27/27, all 12 breaks failing as reported; browser assertions read; the 41/41 browser run and the full regression are Claude's evidence).
- Merged on the line in Chad's message: "Approve: merge osmc-reliability-rc to main (page change: buoy card and place wording for a failed update)". Page and hub files on the merge equal the reviewed branch (`d28763d`). On the merge: osmc-reliability-hub 27/27, osmc-reliability-ui 41/41, drifters-ui 25/25.
- **Test-only follow-up `51f87fc`:** the page suite took its "old page / old hub" from `main`, which after the merge is the new code (5 false failures). Pinned to `0386058`; 41/41. No page or hub file touched.
- **Served hashes: all ten page files exact at 19:25:50 UTC** (index `59500752…3c8a`, app `9df9dce8…0c0b`, sources `44b6e42d…0917`; the other seven unchanged).
- **Live read 19:26:47 UTC (pane, live hub 0.6.7):** `app.js?v=202611291000`; no buoy request while the layer is off; on → current, 1,302 buoys drawn, 728 cells, "retrieved 18 min ago", no `last_attempt` from the hub and no failure line (expected with 0.6.7); place view lists buoys with no clause; off → nothing drawn; no page errors.
- **main ≠ live hub:** main's `phase1/worker.js` is 0.6.8 (`85737a48…c427`); production runs 0.6.7 (`53ede31e…fb9e43`). Until 0.6.8 is deployed a failed buoy run still blanks the layer as before.
- **Rollback:** page = revert `7c3aa22` (Approve line). Hub: nothing to roll back yet.
- **Next (Chad):** `Approve: deploy hub 0.6.8 from 51f87fc (content only)`; then read the first scheduled buoy run in D1. Branch `osmc-reliability-rc` is Chad's to delete.

## 11 Nov 19:18 UTC (clock reading at write) — **OSMC reliability candidate rev 2 on `osmc-reliability-rc` @ `d28763d`** (code `3df9c1a`; after GPT's review of `987f97e`; branch only) — packet §9

- GPT (relayed by Chad): all 312 manifest entries verified; hub suite rerun independently 21/21 with all eight breaks failing as reported; browser run is Claude's evidence. **One defect:** `failed_at` was set after awaited storage calls (16:08:58 reported as 16:09:03). §3 rulings: 1, 2, 3, 5, 6 agreed; 4 = badge **unknown** when records are missing or mismatched.
- **Rev 2:** `failed_at` captured once on entry and reused on retry; stored counts that cannot be read are left alone (malformed JSON replaced conditionally); page shows unknown, no count, no buoy cells and "buoy positions not shown" when the good run's records are missing or mismatched, keeping the failed-at line and the withheld reason.
- **Hashes:** worker.js `85737a48…c427`, index.html `59500752…3c8a`; app.js and sources.html unchanged from rev 1.
- **Tests:** hub suite 27/27, 12 breaks each fail; page suite 41/41, 11 breaks each fail; all 22 hub-side and 22 browser suites green on rev 2 (finished 19:17 UTC).
- Mac `_review/osmc-reliability-rc/` = rev 1 (`987f97e`); rev 2 copy in `_review/osmc-reliability-rc-r2/`.
- **Next:** GPT's re-check; then page merge and hub 0.6.8 deploy, each on its own Approve line. Nothing merged or deployed.

## 11 Nov 18:42 UTC (clock reading at write) — **OSMC reliability candidate BUILT on branch `osmc-reliability-rc` @ `987f97e`** (code `266683b`; Chad's Go line; no merge, no deploy) — packet `reviews/2026-11-11-osmc-reliability-rc.md` (on the branch)

- Chad: "Go: OSMC reliability build on a branch per rev 2.1 (H1; O1–O7 as recommended; no page release, no hub deploy)".
- **Hub 0.6.8 (branch):** `driftFail()` for every failed buoy run (incl. `guarded()`, reason `internal_error`); last good counts kept unchanged + `last_attempt`; every failure write conditional (etag or create-only), ordered by run timestamp; `/place` applies the 4 h limit to the fallback. worker.js `73317081…3802`.
- **Page (branch):** buoy card badge "degraded" + "Latest update failed at HH:MM UTC. Showing buoys from the HH:MM UTC run." (dates across midnight; "Showing buoys" only with paired records); 30 s timer redraws an expired fallback; place clause; Sources sentence; `?v=202611291000`.
- **Tests:** osmc-reliability-hub 21/21, 8 breaks each fail; osmc-reliability-ui 35/35, 7 breaks each fail (hub responses from the real hub code via a local fixture; old page on new hub and new page on old hub covered). Regression: 22 hub-side and 22 browser suites green (18:13–18:42 UTC).
- **Differences from rev 2.1 for GPT (packet §3):** same-run rule (`>=`); the empty down envelope's public note is now a fixed phrase; badge "degraded" when records are missing or mismatched; expired fallback removes buoy cells; place clause only on sections listing records.
- **Not done:** live check (nothing deployed), Worker CPU of the failure path, real phone.
- **Next:** GPT reviews the candidate; then page merge and hub 0.6.8 deploy, each on its own Approve line.

## 11 Nov 18:03 UTC (clock reading at write) — **OSMC reliability proposal rev 2.1** (GPT's re-check of rev 2 applied; docs only)

- GPT (relayed by Chad): Mac copy matched; **H1 ready for Chad's branch-build decision once the write guard covers both failure paths**; partial-publish policy acceptable; O7 fallback-only recommended. A docs re-check.
- Rev 2.1: the empty-down fallback is conditional too (etag, or create-if-absent); attempts ordered by run timestamp; a failing failure-handler cannot reach `writeDown`; place expiry judged on the final counts envelope; absent-key and existing-down race tests; open-page expiry without a data poll must remove the points and cells (the new page redraws the buoy layer at expiry on the 30-second timer; old pages keep the 5-minute cadence); rollback wording corrected.
- Found while checking GPT's raw-error point: the public `/status` endpoint already shows each layer's latest run note (redacted). Existing behaviour, left unchanged and stated in §4.1; the data endpoints never carry the raw text.
- **Not approved:** build, hub deploy, page change. O1–O7 are Chad's.

## 11 Nov 17:54 UTC (clock reading at write) — **OSMC reliability proposal rev 2** (GPT's review of rev 1 applied; docs only)

- GPT (relayed by Chad): Mac copy matched the sha256; H1 is the right shape; cached-page behaviour acceptable; revise before a branch-build go. A docs-and-code review.
- Rev 2 (`docs/concepts/OSMC-RELIABILITY-PROPOSAL.md`):
  - every failure path named, including an unexpected throw caught by `guarded()` (buoys no longer reach the generic `writeDown`);
  - the preserving write is conditional (R2 etag), and writes nothing when a newer run has already published, so a late failure cannot overwrite newer data;
  - the hub applies the 4 h limit to the buoy place section for the fallback; the failure clause and the card's "Showing buoys" line appear only when records from the good run are actually shown;
  - "degraded" as an update-status badge, good run's coverage and freshness intact, unknown after expiry; "failed at" = actual failure time (16:08), dates shown across midnight;
  - H2 (retry) deferred; tests tightened (dispatch path and public endpoints, interleaved late failure, ageing in an open page, old page on the new hub); rollback residual in R2 documented.
- GPT's recommendation for Chad: H1 only, degraded, four hours, refused responses included, the short place clause. O1–O6 stay Chad's; **O7 is new** (place cutoff: fallback only, or every buoy place section past 4 h).
- **Not approved:** build, hub deploy, page change.

## 11 Nov 17:48 UTC (commit time, `e99b362`) — **OSMC reliability proposal rev 1 written** (docs only, on Chad's go) — `docs/concepts/OSMC-RELIABILITY-PROPOSAL.md`, for GPT

- Chad deleted `fires-wording-rc` (remote: `main` + parked `aircraft-rc`, checked with `git fetch -p`).
- Evidence (D1, read between 17:44:39 and 17:49:07 UTC, bracketed by a pane clock and a Mac clock reading): buoys 186 runs since 4 Nov 00:00 UTC, **1 down** (10 Nov 16:07 run, HTTP 522). Cause of the blank hour: `writeDown` overwrites `latest-cells/drifters.json` with an empty down envelope while `latest/drifters.json` keeps the last good run, so the pair no longer matches.
- Lean **H1**: on a failed buoy run the hub rewrites the last good counts unchanged plus a `last_attempt` block; the page keeps drawing the last good run (inside the 4 h limit) with a card line "Latest update failed at HH:MM UTC. Showing buoys from the HH:MM UTC run." Optional H2 (one retry); P1 page-only not recommended; leaving as is stays a fair choice. Buoys only. Decisions O1–O6 are Chad's; page-first release order.
- **Not approved:** build, hub deploy, page change.
- Mac synced 17:49:07 UTC (Mac clock) at `e99b362`, preserve-first: 5 files (3 new; STATUS and index.html preserved in `_sync-preserved/20261111T174907Z/`, each matching an earlier commit). Stamp correction: this entry and the one below first carried estimated times; replaced with commit times.

## 11 Nov 17:44 UTC (commit time, `4bf3065`) — **Fires card wording for the daily FIRMS reset LIVE (merge `0386058`, 17:43:07 UTC commit time)**

- New thread (globe performance handover). Chad's ask: when FIRMS returns a header-only file and the hub's note is "no detections processed yet for today (UTC)…", the Fires card says **"Today’s detections aren’t available yet."**; coverage stays UNKNOWN, records stay withheld; genuine fetch or processing errors keep "collector reported down: …". Card copy only.
- Branch `fires-wording-rc` @ `39100b3`: `index.html` only (no `?v=` bump; `app.js`, `sources.html`, hub unchanged). The state word's tooltip carries the same sentence. `ME.freshness` is untouched, so the summary report, cell inspector, search notes and Sources keep the hub's full reason.
- Tests: new `phase1/fires-wording-ui.test.cjs` 35/35 (down notes read from `worker.js`); breaks `match-all` 10 fail, `never-match` 4, `loose-prefix` 2. Regression green: kp-degraded 29, smoke-fixes 52, kept-ui 21, ux-round1 34, search-ui 104, place-ui 30, backdrop-layer 27, cell-perf-ui 43, desktop-overflow 112, mobile-pass 131, drifters-ui 25, plastic-ui 29, terminator-ui. Packet `reviews/2026-11-11-fires-wording-rc.md`. No GPT review of this change was relayed.
- Merged on Chad's line "Approve: merge fires-wording-rc to main (page change: Fires card wording for the daily FIRMS reset)"; merged tree = branch tree; suite 35/35 on the merge.
- **Served hashes: all ten page files exact 17:44:23 UTC** (index `50c8e0669e00d366`; the other nine unchanged). Live read 17:44:39 UTC: page carries the new code; fires card current (37,464), ordinary wording, no sentence (expected at this hour).
- **Not yet seen live:** the header-only state itself (00:00 UTC until the day's first FIRMS rows, 02:16–04:15 UTC over 4–9 Nov).
- Rollback: revert `0386058` (Approve line). No hub, R2 or D1 change; hub 0.6.7.
- Next (Chad): OSMC 522 reliability.

## 11 Nov 17:08 UTC (clock reading at write) — **Globe performance B2b LIVE (merge `a80bc49`, 17:03:37 UTC commit time)** — packet §11

- On Chad's Approve line after GPT's final clearance (Chad's approve taken as acceptance of the outline change). Served hashes of all ten page files exact 17:04:19 UTC (index `b5ac4ed1…`).
- Live: B2b active, 1,264 cells, no side walls, FrontSide caps, 40 shared materials, 2,559 draw calls (old page ~6,340), no errors.
- **Post-release matched pairs caught the slow (~200 ms) state:** old page 216.7 / 234.3 ms median (render CPU ~214) vs live B2b 50 ms (CPU ~38) — ~4.5× faster; RC fast state was 33.4 → 16.7. Slow-state trigger still unknown; cells remain the residual cost (hidden → 16.7 ms), so B3 stays the lever if wanted.
- Rollback: revert `a80bc49` (Approve line). Close-out next.

## 11 Nov 17:01 UTC (clock reading at write) — **Globe performance: switch removed, final code verified; ready for GPT's final review and Chad's merge line** (branch `globe-perf-rc` @ `06febc0`)

- GPT: B2b meets §3a; proceed with §8; no B3 for this release. Packet correction applied (second forward B2a pair straddled a USGS rollover → unmatched; all B1/B2b pairs matched).
- `index.html` fixed on B2b, no URL switch (final sha256 `b5ac4ed148beee4c…`; diff `reviews/evidence/2026-11-11-globe-perf-rc/switch-removal.diff`). Suite cell-perf-ui 43/43 incl. release checks on the untouched HTML (ordinary URL and former `?perf=` overrides all B2b); 6 breaks each fail (url-switch 10). Full regression green on the final code; oceanheat-ui rerun 109/109 after the local test server hit its 2-hour limit.
- Final smoke check in Chad's Chrome (16:20–16:21 UTC): live main vs final B2b at the north pole and the dateline — no visible difference.
- Next: GPT's final review; Chad's visual call (outline change) and `Approve: push globe-perf-rc to main (page change: globe performance B2b — no side walls, shared single-sided cell fills)`.

## 11 Nov 16:10 UTC (clock reading at write) — **Globe performance RC check DONE (Chad's Chrome, 15:48–16:07 UTC): B2b best; every step passes** — packet `reviews/2026-11-11-globe-perf-rc.md` §6–§8 on branch `globe-perf-rc` @ `01232f9`

- GPT cleared `2ca14e1` for the RC; suite grown to 35 checks (B2b hover asserted, real clicks, R3 disposal through the page's own scheduled refresh; break `cache-across-passes` fails 7).
- Matched pairs vs unmodified live main, both orders, same 1,250 cells: main 33.4 / 50 ms (render CPU ~36); B1 16.7 / 33.4 (~20); B2a 16.7 / 33.4 (~20, no gain over B1); **B2b 16.7 / 16.7 (~6.5)**; hide-only ceiling 16.7 / 18 (~2).
- Picks on live data (overlap, mixed and same-layer edges, dot near an edge, limb, open globe): identical to main in every step. Taps: main 711–768 ms → B2b 482–545 (no regression; still above 200).
- §3a: B2b ships without B3. Chad's calls: accept the outline change; ship B2b. Before merge: remove the RC switch (hard-wire B2b), rerun suites, GPT review, `Approve: push globe-perf-rc to main (page change: …)`.

## 11 Nov 15:30 UTC (clock reading at write) — **Globe performance B1+B2 BUILT on branch `globe-perf-rc` @ `2ca14e1`** (Chad's build line; no page release)

- B1 no side walls, B2a shared DoubleSide cap materials per fill (branch default), B2b FrontSide; `?perf=main|b1|b2a|b2b` for the RC only. `index.html` only + new suite `phase1/cell-perf-ui.test.cjs` 27/27 (4 breaks each fail).
- Draw calls on 29 test cells: main 147 · B1 89 · B2a 89 · B2b 60 (prediction confirmed on the pinned bundle). Hover winners identical to main in all steps (overlaps, edges, limb, dateline). B2a/B2b pixel-identical to B1.
- **For Chad:** B1 is not pixel-identical to main — ~300 outline pixels per frame draw more completely where cells meet (the invisible walls were hiding them by writing depth); fills unchanged. Screenshots in the packet.
- All regression suites green (packet §4). Packet `reviews/2026-11-11-globe-perf-rc.md` (branch); Mac `_review/globe-perf-rc/` hash-checked.
- Next: GPT reviews; then `Go: globe performance RC check (Chad's Chrome)`.

## 11 Nov 14:36 UTC (clock reading at write) — **Globe performance build proposal rev 1.1** (GPT's review applied; docs only)

- GPT: skip-the-spike accepted; §1 credible as a prediction; revise before the build go. Rev 1.1: B1 = no side geometry or side draws, with its own look/pick checks at grazing edges and the limb (invisible sides can write depth and be raycast today); B2 split into B2a (shared DoubleSide, same settings, materials made fresh per render pass) and B2b (FrontSide, tested alone); RC pairs matched on snapshot IDs, layers and cell counts, median + p95, interrupted pairs rerun; ship rule §3a (best passing step ships without B3 if its median ≤ 33 ms; B3 gets its own RC vs the best simpler step and main); no general edge rule yet (ME.cellId floors east), same-layer edge case added.
- Next: Chad's `Go: globe performance build B1+B2 on a branch (no page release)` (no screen time).

## 11 Nov 14:28 UTC (clock reading at write) — **Globe performance build proposal rev 1** (Chad chose (b): no spike; docs only)

- `docs/concepts/GLOBE-PERFORMANCE-BUILD-PROPOSAL.md`. New from reading globe.gl 2.45.0 / three-globe (three r181), not yet measured: the page's fully transparent `polygonSideColor` still makes globe.gl build and draw invisible side walls with a custom shader, and transparent DoubleSide draws twice → ~40 % of draw calls are invisible walls.
- Plan: B1 sides off (one line) → B2 shared FrontSide cap materials → B3 merged mesh only if needed; all measured in one RC check against an unmodified tab with the Stage 0 harness and GPT's pass test.
- Next: GPT reviews (§8); then Chad's `Go: globe performance build B1+B2 on a branch (no page release)`.

## 11 Nov 14:25 UTC (clock reading at write) — **GPT's read of Stage 0: supports a C1 merged-mesh spike only**; record tightened (docs only)

- GPT (relayed by Chad) verified the hashes and reproduced the trace analysis; C2 and C3 no case. Two claims tightened in the record: the ~50 ms state had no matched hidden window and the GPU-process figure is host activity; the 433 ms tap latency is a polygons-visible baseline.
- Chad doesn't want further measurement rounds for their own sake. Next is his choice: (a) the Stage 1 spike, or (b) skip it and write the build proposal, with GPT's C1 pass test applied in the branch release-candidate check using the Stage 0 harness.

## 11 Nov 14:11 UTC (clock reading at write) — **Globe performance Stage 0 DONE (measure only)** — record `reviews/2026-11-11-globe-perf-stage0.md`

- On Chad's Stage 0 line; live page, his Chrome (M3), no code change. Served hashes = main (10:38:31 and 11:07 UTC).
- **Coverage-cell polygons are the cost:** hidden vs visible, both orders → frames 183–217 → 16.7 ms; draw calls 5,711 → 22 (2.8 % of triangles, 99.6 % of draw calls). Caps ≈ 4,550 calls, outlines ≈ 1,140. Rings: no effect.
- **Trace (13:29 UTC pair):** main thread 99.96 % busy with three.js per-object material/program bookkeeping (`getParameters`, `getProgramCacheKey`); GPU process ~28 % → CPU per object, not pixels.
- **No leak:** 20 page toggles, 20 setter calls and a clean 30-min dwell (13:37–14:07 UTC) — counts move only with the cell count (+63 cells → +189 objects). Cells 782 (04:00) → 1,229 (14:02).
- **Picking baseline:** Earthquakes > Fires > Ships > Forest; west cell on an edge; points not pickable; tap → inspector median 433 ms (374–768).
- **Decision under rev 2.1:** C1 merged-mesh spike justified; C2 no case; C3 not supported. Stage 1 needs GPT's read of the record and Chad's separate go.
- Tab 1 lost when DevTools was undocked (START-HERE §4p); tab-1 numbers transcribed from read-back; tab-2 raw file hash-checked both sides.

## 11 Nov 10:36 UTC (clock reading at write) — **Globe performance proposal rev 2.1: GPT's re-review CLEARED it** (docs only)

- GPT verified the Mac copy by sha256 (`37c05529…`); §3 covers G1–G5; recommends Chad give Stage 0 its separate go. Rev 2.1 applies the run-sheet points: camera set each frame with zero transition, fresh clock after warm-up; Forest disturbance for the rebuild toggle (Earthquakes fallback, ring counts logged); each update applied before the next; paused readback for the polygon comparisons too; tap-to-painted-inspector times in S0.7; within-spread = inconclusive.
- Next: Chad's `Go: globe performance Stage 0` (at the screen ~30 min + 30 min dwell).

## 11 Nov 10:33 UTC (clock reading at write) — **Globe performance proposal rev 2** (GPT's review of rev 1 applied; docs only)

- GPT (relayed by Chad): revise Stage 0 before a measurement go. Rev 2 adds a short Chrome trace beside the render-CPU wrapper, both-order A/B with repeats and a time-based sweep over 10 s windows, the Earthquakes off→on toggle for the rebuild test (render() is inside the IIFE) plus a labelled setter-only test, natural-refresh checkpoints, real canvas hover/click for overlap picking, environment per block. Decision rule: a material, repeatable rotation gain justifies a C1 spike; a readback gain alone does not.
- Next: GPT re-reviews rev 2 (§9); then Chad's Stage 0 go (at the screen ~30 min active + 30 min dwell).

## 11 Nov 10:26 UTC (clock reading at write) — **Globe performance measurement proposal rev 1 written** (docs only, on Chad's go)

- `docs/concepts/GLOBE-PERFORMANCE-PROPOSAL.md` rev 1: Stage 0 = measure only on the live page in Chad's Chrome (frame/render split, coverage polygons A–B–A–B, caps vs outlines, scene growth, overlap clicks); Stage 1 = throwaway spike only on a separate go (C1 merged mesh, C2 stable data, C3 transition off). $0; nothing approved beyond the proposal.
- Next: GPT reviews (§9 questions); then Chad's Stage 0 go (needs him at the screen, ~20 min + a 30 min idle step).

## 11 Nov 10:16 UTC (clock reading at write) — **Ocean Heat thread closed: GPT smoke test passed; handover written; Mac synced**

- **GPT's independent desktop smoke test (relayed by Chad): passed.** Starts off; enabling renders the 0.25° overlay and the 9 Nov 2026 legend; off clears the legend; re-enable restores it. STAR credit in footer and Sources. A different open-water cell: 26.0 °C, +1.1 °C warmer than usual, 25 of 25 source cells. Land and Antarctic sea ice show their messages. Chrome showed the live manifest (revision, date, three binary hashes). `/%6danifest.json` → "unknown revision or file". His shell requests timed out, so headers, bytes, request counts and cache reuse rest on Claude's checks (packet §8–§9). Desktop only.
- **Close-out (START-HERE §9):** Mac `_review/` emptied (two Ocean Heat review copies → `_to_delete/`); branches deleted by Chad (remote `main` + `aircraft-rc`); START-HERE §4o (thread facts) and the HANDOVER block written; Mac synced at the final commit, preserve-first; Project docs updated.
- **Next (suggested, Chad to choose):** docs-only globe performance proposal (coverage polygons). See HANDOVER.

## 11 Nov 10:06 UTC — Ocean Heat LIVE (merge `158e4b1`; hub 0.6.7 `53ede31e…`)

- Merged on Chad's line 09:58:30 UTC. **Served hashes: all ten page files exact** (10:04:02Z; `oceanheat.js` `a45097ba` is the tenth). Four hub responses 200, byte-exact, immutable 24 h. Public-page smoke test in Chad's Chrome: the toggle loads P1 from the hub, Open Pacific tap 30.6 °C / +5.1 °C, legend and STAR credit present, off clean, no console errors. **main = live.**
- Open: physical phone; globe performance (coverage polygons); md5 sidecars; OSPO status; OSMC 522. Branches `ocean-heat-rc` and `ocean-heat-release` deleted by Chad (confirmed gone 10:07 UTC; remote heads: main, aircraft-rc). Packet §9.

## 11 Nov 09:50 UTC — Ocean Heat: live RC through the hub passed

- Chad's Chrome, Pages origin, branch `1b975a0` injected with its own hub BASE. Zero requests before the toggle; P1 manifest+mask+v025 and P2 manifest+mask+v050, all 200, all hash = pin, no cache override; immutable 24 h; repeats from browser cache (≤ 17 ms); weak manifest ETag harmless. Taps 12/12 on both paths. First enable 2.3 s (P1) / 2.5 s (P2, mask cached). Regression gate met (no repeatable layer cost; renders on ≈ off). Packet §8. Next: Chad's merge line.

## 11 Nov 09:38 UTC — Ocean Heat: hub 0.6.7 live (from `1b975a0`)

- Content-only deploy 09:36:49Z on Chad's line; read-back exact (`53ede31e…`); 19 bindings unchanged. Live: version 0.6.7; four files 200, byte-exact, immutable 24 h; bad paths 404 no-store. Manifest ETag arrives weak (edge compression of JSON; bytes exact). Page unchanged (main). Next: live RC, then merge line. Packet §7.

## 11 Nov 09:24 UTC — Ocean Heat: R2 upload done; route fix on the branch; deploy awaits a new line

- **R2:** the four `ref/oceanheat/oh-2026-11-09-R1/` objects uploaded 09:16 UTC on Chad's Approve line (destination empty first; sources from `db5eedd`, hash-checked; read-back exact). Not served yet (live hub 0.6.6).
- **GPT's review:** STAR credit kept; Sources' experimental-status clause dropped; route now matches path segments literally (`/%6danifest.json` → 404, no R2 read). Branch `ocean-heat-release` at `1b975a0`: hub suite 48/48, breaks 7/7, pin check consistent, browser 109/109.
- **Not done:** hub deploy (Chad's line named `d4272a8`; needs a line for `1b975a0`), live RC, merge. Packet §6.

## 11 Nov 05:15 UTC (clock reading at write) — **STAR disclaimer READ; REGISTER entry FILED (C6); release candidate BUILT on branch `ocean-heat-release` @ `d4272a8`** (Chad's three lines; no merge, R2, hub or page change) — packet `reviews/2026-11-11-ocean-heat-release.md` (on the branch)
- **STAR disclaimer:** free use with credit to the NOAA / NESDIS Center for Satellite Applications and Research; hosted data described as experimental, not official operational products. Recorded in `OCEAN-HEAT-SOURCE-CHECK.md` rev 2.2 and the REGISTER (main `50e9419`).
- **Build:**
  - hub 0.6.7 `GET /catalogue/oceanheat/<revision>/<file>` (pinned length + sha256; immutable 24 h on 200; `no-store` 404 / 503; no `Content-Encoding`);
  - page `BASE` → hub, no forced revalidation, STAR credit (inspector, footer, Sources);
  - `data/ocean-heat/` removed; build-time pin check consistent.
- **Tests:**
  - hub suite 45/45, 6/6 breaks;
  - pin check 3/3 breaks;
  - browser suite 109/109 on `OH_SNAPSHOT_DIR`, 14/14 breaks;
  - 17 hub and 7 page regression suites green.
- **Next:** GPT reviews (including the STAR wording); then the R2 upload, the hub 0.6.7 deploy, the live RC through the hub, and the merge, each on its own line.

## 11 Nov 04:19 UTC (clock reading at write) — **Ocean Heat release decisions RECORDED (Chad); release proposal rev 2** (docs only; main `7ba3660`)
- **D1:** regression gate adopted for this release. §10 satisfies it for the tested Chrome setup (P1 and forced P2); physical phone unverified. Absolute targets kept for the globe performance work (coverage-cell polygons first).
- **D2:** hub serving; `data/ocean-heat/` removed from the release branch; both suites take `OH_SNAPSHOT_DIR`, hash-check the four files at setup, and run with the branch copy absent.
- **Q1:** verified 200s `public, max-age=86400, immutable`; the page's pinned fetches drop `no-cache`; 404 and 503 `no-store`; byte changes get a new revision and pins.
- **Q2:** the Worker checks length and SHA-256; a build-time check matches the manifest revision to the route and its file entries to the Worker pins; the page keeps its checks; `.bin.z` as `application/octet-stream` with no `Content-Encoding`; the Worker tests add `unreadable`.
- **Final check:** Pages origin, against the deployed hub, with the candidate's actual `BASE`; exact requests and response hashes on both paths; tap readings; first-enable timing through the hub.
- **Approval lines** (proposal §7, none given): STAR disclaimer Go; REGISTER filing; release branch build; R2 upload; hub 0.6.7 deploy; merge.

## 11 Nov 04:11 UTC (clock reading at write) — **GPT: regression gate recommended and cleared on the timing run; Ocean Heat release proposal rev 1 written** (docs only)
- GPT recommends (a), the regression gate (no repeatable slowdown against the layer-off baseline, both paths), as an explicit change to the merge criterion. The absolute targets stay for the globe's own performance work. Cleared for the tested Chrome setup; phone unverified. **Adoption is Chad's (D1).**
- Remaining release check: the page fetches the pinned snapshot through the hub, after the separately approved route and upload.
- `docs/concepts/OCEAN-HEAT-RELEASE-PROPOSAL.md` rev 1 (main): R2 `ref/oceanheat/oh-2026-11-09-R1/` (4 objects); hub 0.6.7 route `GET /catalogue/oceanheat/<revision>/<file>` (pinned, length + sha256, 404 without an R2 read for anything else); page `BASE` → hub; tests with breaks; live RC through the hub; steps 1–8, each its own line.
- Still before release: REGISTER (C6), the STAR disclaimer read, the md5 sidecars.

## 11 Nov 04:05 UTC (clock reading at write) — **Ocean Heat foreground timing run DONE (Chad's Chrome, M3): thresholds missed by the page itself, not the layer**; GPT cleared rev 2 for preview (branch only)
- **GPT (relayed):** rev 2 clears the preview findings. Merge pending the timing run and a verified hub-backed release candidate.
- **Run** (packet §10), branch `7cd43ac`, 7 files hash-exact; Chrome raw frame rate 16.7 ms:
  - desktop: P1 layer on 100 ms median / 133 p95 vs layer-off baseline 117 / 267;
  - P2 (forcePhone): 183 / 200 on and off alike;
  - taps about 350 ms, on and off alike;
  - **live public page without Ocean Heat: 117 / 133.**
- **Cause:** the 782 coverage-cell polygons (1,564 meshes). A synchronous render took 31 ms in that sample, 3.5 ms with them hidden.
- **Question for GPT and Chad:** is the gate regression (met) or absolute (needs separate page-performance work first)?

## 11 Nov 03:32 UTC (clock reading at write) — **GPT: Ocean Heat passes functional preview review; performance is a merge gate. Rev 2 on `ocean-heat-rc` @ `3915348`** (branch only)
- **GPT (relayed by Chad):** all 12 local hashes match the packet.
  - Foreground timing goes before merge: both shipping paths, layer-off baseline, median ≤ 33 ms, p95 ≤ 50 ms, tap ≤ 200 ms, plus Chad's impression.
  - Lighten the no-data checker.
  - Phones default to P2; handle limits below 3,600 explicitly.
  - Pages serving only if Chad chooses it for release (rev 4.2 names the hub as the public follow-on).
- **Rev 2 (packet §9):**
  - phone-sized (≤ 720 px, or a touch screen with short side ≤ 500) → P2;
  - P1 / P2 in 1 or 2 tiles by limit; < 1800 → unavailable, nothing more fetched;
  - checker `[128,140,160] / [100,112,130]`, ΔE to polar-night land 12.4 → 28.0;
  - suite 101/101; 13/13 breaks caught (3 new);
  - 5 page-loading regression suites green;
  - looked at on the M3 (Arctic night, Weddell in sun, day/night on);
  - the pane (588 px) chose P2 by default.
- **Unchanged:** main, the public page, hub, D1, R2.
- **Chad, 11 Nov (answers):** release data host = **hub, as in rev 4.2** (not Pages): the hub route and the R2 upload each need their own line before merge; the RC's relative `data/` path changes with it. Timing run in his Chrome: **yes**.
- **Open (Chad):** the foreground timing run (Chrome extension was not reachable at first try); md5 sidecars; REGISTER (C6).

# 10 Nov 2026

## 10 Nov 19:55 UTC (clock reading at write) — **Ocean Heat preview candidate BUILT on branch `ocean-heat-rc` @ `0130e4d`** (Chad: "Approve: build ocean-heat-rc on a branch only — Ocean Heat preview per OCEAN-HEAT-PROPOSAL rev 4.2 on the pinned 9 Nov inputs; no merge, R2, hub or page change.") — packet `reviews/2026-11-10-ocean-heat-rc.md` (on the branch)
- **New:** `oceanheat.js` (page file 10 on a merge), snapshot `data/ocean-heat/oh-2026-11-09-R1/` (manifest `dcc34674…`; P1 first-enable 1,223,509 B), generator with hard stops (6/6), browser suite 79/79, all 10 code breaks caught at `0130e4d`; 16 regression suites green.
- **Live RC (Pages origin, real Apple M3 GPU, `MAX_TEXTURE_SIZE` 16384), 19:28–19:37Z:** seven page files hash-exact; P1 7200 × 3600; zero requests while off, exactly three on enable; 12/12 taps match NOAA's exact sums; real tap through the handlers; Sky zoom-out hides and restores the layer; off clears everything.
- **Not obtained:** §8 "smooth" and tap timing. The pane ran `requestAnimationFrame` at one frame per 2 s with the layer off as well as on. The layer adds ≈ 1 ms to a forced render. Open for GPT, with the sea-ice-in-polar-night tone and the ~99 MiB P1 texture.
- **Unchanged:** main, the public page, hub 0.6.6, D1, R2.
- **Next:** GPT reviews the packet and the `_review/ocean-heat-rc/` preview; Chad's lines for anything further.

## 10 Nov 18:30 UTC (clock reading at write) — **GPT cleared Ocean Heat rev 4.1 for O7; rev 4.2 applies the build notes** (docs only)
- GPT (relayed by Chad): §2/§5 pass; §8 passes with two build notes; §9a/C6 pass. The OSTIA hold stays withdrawn for the 9 Nov snapshot.
- **Rev 4.2:**
  - interior tap points (packet `C4c-interior.json`, all off 0.05° / 0.25° / 0.5° edges, the right native type, the same blocks), with exact edges kept as lookup tests (floor rule, `round` / `ceil` breaks);
  - the seam fixture checked on the **rendered globe** (mirrored-mesh and π-rotation breaks);
  - exact product links;
  - "Methods article DOI: 10.3390/rs12233856"; no dataset DOI verified (GPT: NCEI DOIs only for the separate heat-stress archive).
- **Next (Chad):** O7 line (preview build on a branch); REGISTER filing on its own line; md5 sidecars still open.

## 10 Nov 17:46 UTC (clock reading at write) — **Ocean Heat proposal rev 4.1 + record rev 2.1** (docs only; Chad's corrections after GPT's review of rev 4)
- **§9a / C6 — the exact files vs the OSTIA notice:**
  - the SSTA 1991–2020 and climatology files carry only Coral Reef Watch's unrestricted-use statement (credit + DOI);
  - the OSTIA notice in CoralTemp is labelled 1985–2002;
  - **no text read extends it to the derived files**;
  - **GPT withdrew the OSTIA release hold for this snapshot** (supersedes rev 4's "blocks any public release").
- **Credit:** "NOAA Coral Reef Watch". **DOI:** no dataset DOI is listed for the 1991–2020 anomaly or climatology (citation and product pages read, text); the citation page's reference doi:10.3390/rs12233856 (Skirving et al. 2020, an article DOI) is used and labelled as such.
- **§2 / §5 corrected (packet `REPORT-C2-C5-correction-1.md`; script `c4b_blocks.py`, 17:44Z):**
  - mask 0 ⇔ valid anomaly ⇔ valid climatology;
  - **valid SST also occurs under masks 2 (991,557) and 4 (3,367,803)**;
  - **land = mask 1**; the literal SST fill −32768 covers all 8,722,205 land cells **plus 4,655 ice cells**, so it never decides land.
  - Rev 2 of the record and the rev 2 report had both equivalences wrong as worded.
- **§8:** expected 0.25° / 0.5° block values for every tap point (sums identity exact); Gulf of Maine changes class with the grid (6 → 7); a near-normal block (−0.25, 124.25) at +0.03; a **synthetic seam fixture** (col 0 −2.50 class 2 vs col 719 +2.50 class 8); a real seam pair (row 61, class 6 vs 7).
- **Open:** the md5 sidecars; the STAR disclaimer read; the REGISTER filing (Chad's line); O7 build (Chad's go).

## 10 Nov 17:34 UTC (clock reading at write) — **Ocean Heat proposal rev 4** (docs only), after C0–C5; `buoy-temp-rc` deleted by Chad
- GPT accepted the C2–C5 results (relayed by Chad).
- **Rev 4** (`docs/concepts/OCEAN-HEAT-PROPOSAL.md`):
  - §2 answered from the files;
  - inspector names **Sea ice** (mask 4) vs **No 1991–2020 normal** (mask 2);
  - presence = NOAA's mask as one 2-bit plane;
  - generator hard stops: CoralTemp flip + bitwise grid identity, mask invariants, **exact-zero** identity, pinned input hashes;
  - a concrete coordinate table from C5;
  - new breaks (missing flip, loosened identity, same text for masks 2 and 4);
  - **§9a Terms:** the OSTIA question blocks any public release, not the preview.
- **Decisions:** O7 build, C6 REGISTER draft, O8 terms. md5 sidecars still open.
- **Branches:** Chad deleted `buoy-temp-rc`. `git fetch -p`: remote = `main` + parked `aircraft-rc`.

## 10 Nov 17:29:25 UTC (push time) — **PAGE RELEASED: buoy dots coloured by water temperature** (main merge `28d6047` of `buoy-temp-rc` @ `52fa1eb`, code `61d0504`; Chad: "Approve: merge buoy-temp-rc to main (page change: buoy dots coloured by water temperature)")
- **Merge:** no overlap (main side: STATUS and the Ocean Heat record only). All nine page files and `worker.js` are byte-identical to `61d0504`. `worker.js` = live hub 0.6.6 `4231114d…`, so **main = live**. Unit suite 37/37 on the merge.
- **Served hashes: all nine page files exact at 17:30:10Z:**

  | File | sha256 (first 16) |
  |---|---|
  | index | `c1797d72` |
  | app | `161b53cc` |
  | sources | `e469e0f5` |
  | style | `fad92f02` |
  | arts | `58773cef` |
  | sky | `2056da8d` |
  | skyscene | `5e00ad77` |
  | timeline.html | `d7c37d5f` |
  | timeline.js | `ae87c6a1` |

- **Live smoke test on the public page (17:30:43Z):**
  - scripts `?v=202611261000`;
  - drifters off on load: 0 drifter requests, keys hidden;
  - on: 1,303 buoys from the 17:08 pair, 0 colour mismatches, 46 grey, 0 old yellow; card key and main key shown;
  - off: both hidden.
- **Rollback:** revert the merge `28d6047` (own Approve line). No hub change.
- **GPT:** approved the Ocean Heat C2–C5 results too (relayed by Chad; detail not relayed in this thread).

## 10 Nov 17:28 UTC (clock reading at write) — **GPT's smoke test of `buoy-temp-rc` PASSED** (relayed by Chad; docs only)
- 1,303 buoys; both keys; buoy `1601749` 19.55 °C at its 16:00 UTC fix; off clears both keys; the three changed page files match the packet hashes; unit suite 37/37.
- GPT: keep the yellow card pip and count; keep `#3b528b` (not a release condition); **the OSMC 522 blank-layer behaviour is a separate reliability follow-up** (shape if revisited: serve a coherent last-good pair with its original timestamp plus a separate feed-down label).
- No release blocker. **Merge awaits Chad:** `Approve: merge buoy-temp-rc to main (page change: buoy dots coloured by water temperature)`.

## 10 Nov 17:25 UTC (clock reading at write) — **Ocean Heat C2–C5 DONE** (Chad's Approve line; research only) — `docs/research/OCEAN-HEAT-SOURCE-CHECK.md` rev 2; packet `research/ocean-heat/2026-11-10-claude/REPORT-C2-C5.md`
- **Inputs:** Chad downloaded the 3 files to ~/Downloads (granted this thread); copied to `inputs/`. Sizes match C1; first-4 KiB hashes match the C1 bounded reads. **md5 check pending** (the sidecars were not downloaded).
- **C2:**
  - `mask` flags (0 water, 1 land, 2 missing, 4 ice) in SSTA and the climatology;
  - baseline **1991–2020** confirmed in the metadata;
  - no gap-fill flag;
  - **licence finding:** CoralTemp's attribute includes an OSTIA 1985–2002 academic-only / no-commercial statement. Whether it reaches the derived 1991–2020 climatology is unresolved (for GPT and Chad).
- **C3:**
  - time 9 Nov 12:00Z ref (coverage 9 Nov); the climatology is the 9 Nov calendar day;
  - **CoralTemp rows south-first vs SSTA / climatology north-first.** Identical after the flip. The first script run compared unflipped rows (void, kept); rev 2 flips first.
- **C4:**
  - land vs unavailable ocean **separable (no stop)**;
  - unavailable = ice now (3.37 M) or no 1991–2020 normal (0.99 M);
  - valid-anomaly-missing-SST = 0 (fixture).
- **C5:** SST − anomaly − climatology = 0 exactly in 12,833,780 cells.
- **Next (Chad, after GPT):** proposal rev 4 (flip assertion, two unavailable states, exact-zero identity, terms question), then O7 (build) and C6 (REGISTER draft) each on its own line.

## 10 Nov 17:19 UTC (clock reading at write) — **Buoy temperature candidate BUILT on branch `buoy-temp-rc` @ `61d0504`** (Chad's Approve line: branch only; no merge or page change) — packet `reviews/2026-11-10-buoy-temp-rc.md` (on the branch, `0e08fa8`)
- Page only:
  - drifter dots coloured by `sst_c`, viridis 0.25–1.0 in 8 classes; grey `#b0b0b8` = Temperature unavailable; exactly 0 °C is a class;
  - card key (GPT's wording) and main-key swatch, built from one source in `app.js`;
  - Sources wording; `?v=202611261000`.
  - No hub change. Served-hash checks stay at nine files.
- **Tests:**
  - `buoy-temp.test.mjs` 37; breaks 4/4 fail;
  - `buoy-temp-ui.test.cjs` 33 (rendered pixels included); breaks 3/3 fail;
  - regression 11 suites green;
  - emulation only.
- **Palette chosen by measurement.** Plasma and magma rejected (their oranges and reds are within ΔE 4–10 of fire and earthquake dots).
- **Live RC** (Pages origin, live hub, real backdrop):
  - **16:57Z: the drifters layer was "unknown, records withheld" on the live site too.** The 16:07 run failed upstream (OSMC HTTP 522); the hub served counts from the failed write and records from 15:08, and the page withheld the mismatched pair. Recovered at 17:08 (1,303 buoys). **Observation, not changed:** one failed upstream hour blanks the layer although the last good pair exists; any change needs its own proposal.
  - **17:08Z:** 1,303 drawn, 0 colour mismatches. The first grey `#54545a` nearly vanished on night-side ocean (globe.gl shades dots darker) → **rev 2 grey `#b0b0b8`**, compared against 3 other greys on the real globe.
  - **17:17Z at `61d0504`:** 6 page files hash-exact; zero drifter requests before switch-on; 1,303 drawn; grey and classes visible on night ocean, cloud and Arctic polar night (coldest class faintest).
- **GPT preview:** Mac `_review/buoy-temp-rc/` = `0e08fa8` (275 files hash-matched). Served by Chad in Terminal as before.
- **Open for GPT:** (1) whether the card accent (pip, count) should also leave the old yellow; (2) coldest-class contrast; (3) the OSMC 522 observation.
- **Not approved:** merge (`Approve: merge buoy-temp-rc to main (page change: buoy dots coloured by water temperature)`).

## 10 Nov 16:46 UTC (clock reading at write) — **Ocean Heat C0–C1 DONE** (Chad's Go; research only) — `docs/research/OCEAN-HEAT-SOURCE-CHECK.md`; packet on the Mac `research/ocean-heat/2026-11-10-claude/`
- 16:43:31–16:45:36Z; 16 requests (cap 30); no full file, nothing decoded.
- **Route:** both shells refused at the proxy; **the pane works** (Chad granted `star.nesdis.noaa.gov`, scope site).
- **Inputs for 2026-11-09** (sizes from `Content-Range`):
  - CoralTemp SST, 11,418,321 B;
  - SSTA 1991–2020, 10,399,448 B;
  - day-1109 climatology, 6,349,472 B.
- Bounded reads: 206 / 4,096 B each; HDF5 signature on all three.
- **Next (Chad): the download line.** Route D1 (Chad downloads the 3 files + 2 md5 sidecars into the packet's `inputs/`), then C2–C5.

## 10 Nov 16:41 UTC (clock reading at write) — **GPT's second review: Ocean Heat rev 3 (ready for O6); buoy temperature rev 2 (ready for B3)** (docs only)
- GPT (relayed by Chad) verified both local sha256 prefixes; it could not tie the files to a commit (the Mac folder has no git).
- **Ocean Heat rev 3:**
  - P2 paired with 0.5° values only (0.1° texels nest in 10 × 10 blocks; with 0.25° they straddle);
  - separate no-data vs mixed styles;
  - P1 tile-join tests and allocation report;
  - C1 capped at 64 KiB per bounded read, aborting if `Range` is ignored;
  - C3: climatology matched to its calendar day; land / unavailable indistinguishable = stop before O7;
  - C5 reports tolerance and residuals;
  - §8: layer-off baseline, measured taps, renderer limits recorded.
  - **GPT: ready for the source-file check (O6). O7 held until source results.**
- **Buoy temperature rev 2:**
  - legend "Water temperature at each buoy's latest reported fix (°C). Fix times vary.";
  - grey = "Temperature unavailable";
  - range-check sentence for Sources;
  - main map key `#leg-drifters` no longer one fixed yellow;
  - palette picked on the globe with night shading;
  - tests at exactly 0 °C and both sides of each boundary.
  - **Ready for Chad's branch-build decision (B3).**
- **Not approved:** O6, the download line, O7, B3.

## 10 Nov 16:35 UTC (clock reading at write) — **Ocean Heat rev 2 after GPT's review; O1 DECIDED; buoy-temperature proposal rev 1** (docs only)
- **GPT's review of rev 1 (relayed by Chad):**
  - recommended O1(b) and O2 with shorter wording;
  - **build hold on §5**: a coarse block could paint over land and over unavailable water;
  - seam tests at exactly ±180°; three named inputs; C0–C5 tightened.
- **O1 DECIDED (Chad): (b) NOAA's 1991–2020 anomaly** (`3.1-clim19912020-v1`).
- **Proposal rev 2** (`docs/concepts/OCEAN-HEAT-PROPOSAL.md`):
  - values averaged in blocks; painting and tapping from native 5 km land / valid bit-planes;
  - the phone texture limit (7200 × 3600 > 4096) handled by P1 (tiled native) / P2 (0.1° texture with a "mixed" style, never over-painting), chosen by measurement;
  - "smooth" defined (≥ 30 fps median, p95 ≤ 50 ms, tap ≤ 200 ms);
  - C0–C7 rewritten.
- **Chad asked whether live sea-temperature sources exist. They do, and we already collect one:** drifters carry `sst_c` hourly. D1 read 16:29 UTC, last 24 h: 1,259 of 1,303 buoys reported a temperature; 14,413 fixes; −1.55 to 35.94 °C. The page shows it only on tap.
- **New:** `docs/concepts/BUOY-TEMPERATURE-PROPOSAL.md` rev 1 (Chad's ask). Colour drifter dots by reported water temperature on a sequential scale; grey = none reported; page-only; no hub change; $0.
- **Not approved:** Ocean Heat source-file check (O6) or build (O7); buoy branch build (B3).

## 10 Nov 16:20 UTC (clock reading at write) — **Ocean Heat: Chad's spec filed; proposal rev 1 for GPT** (docs only)
- New thread (Sky zoom-out handover). Mac folder re-granted; Mac already matched main `3873ce5` (268/268 files by sha256, 16:14 UTC); nothing copied.
- Chad's spec filed verbatim: `docs/concepts/OCEAN-HEAT-BRIEF.md` (one dated global SST-anomaly snapshot on the globe; $0; no backend, ingestion or production deploy; docs-only proposal first).
- **Proposal rev 1:** `docs/concepts/OCEAN-HEAT-PROPOSAL.md`. Read NOAA's product pages as text (fetch tool summary). Found:
  - CoralTemp is a **gap-free blended analysis**, so it needs an analysed label (O2);
  - a parallel **1991–2020-baseline SSTA** (v3.1-clim19912020-v1, Jun 2026) exists beside the spec's heat-stress baseline (1985–1990 + 1993), so the baseline is a decision (O1, lean 1991–2020);
  - NOAA's own ±0.2 °C near-normal mask is confirmed.
- Design reuses the day/night overlay mesh channel (nearest filtering, one tap mapping with a seam `mod`). Bundled snapshot on a preview branch only (O3). 0.25° or 0.5° grid chosen by measurement (O4). Coastal rule (O5). Source-file check C0–C7 listed with what each establishes (O6, needs binary NetCDF downloads, its own go).
- **Not approved:** source-file check, downloads, REGISTER, branch, build.

## 10 Nov 16:20 UTC (clock reading at write) — **OpenSky feeder kit ORDERED by Chad** (his purchase; recorded from his screenshots)
- **Standing feeder conditions (REGISTER, ENQUIRIES rev 7):**
  - public site must be a feeder;
  - hobbyist, non-commercial;
  - credits and attribution apply;
  - no cloud whitelisting;
  - account link automatic at 30%+ feeding of the preceding month;
  - aggregated counts per area (no identifiers or tracks) OK within those conditions.
- **Order 1, total R3,567.60** (sub-total R2,997.91 + flat shipping R104.35 + VAT R465.34):
  - Raspberry Pi 4 Model B 3GB, R1,426.00;
  - FlightAware Pro Stick Plus (USB SDR ADS-B receiver), R1,304.26;
  - Raspberry Pi 4 official USB-C power supply 5.1 V 3 A (15.3 W), R139.04;
  - 3 dBi ADS-B 1090 MHz SMA antenna with magnetic base, R128.61.
- **Order 2, R199:** SanDisk Ultra microSDHC 32 GB Class 10; "delivery by Wed 11 Nov", not yet shipped at the screenshot.
- **Kit total R3,766.60** (one-off; no recurring line item).
- **Note against OpenSky's equipment advice** (Pi 3B/4 + RTL-SDR, outdoor antenna, adsb.im image; provider advice, unverified): the kit matches the Pi/SDR part. The antenna is a 3 dBi magnetic-base whip, not an outdoor one. Placement and reach are to be measured once running.
- **Not approved by the purchase:** installation, feeding, account linking, REGISTER change or any aircraft build. `aircraft-rc` stays parked; each step is Chad's go.

## 10 Nov 16:11 UTC — Close-out (START-HERE §9), Sky zoom-out thread
- `_review/sky-zoom-rc` and `_review/sky-zoom-rc-preview` moved (mv) to `_to_delete/20261110T160032Z/` on the Mac. `_review/` is empty.
- Branch `sky-zoom-rc` deleted by Chad. `git fetch -p`: remote has only `main` and `aircraft-rc`.
- HANDOVER "NEXT THREAD STARTS HERE" block and START-HERE §4m written (`e1ea255`). Mac sync of the whole repo at the final commit (preserve-first). Research packets stay. Project docs updated.

## 10 Nov 15:56:33 UTC (push time) — **PAGE RELEASED: Sky zoom-out view (Earth → Moon → Sun)** (main merge `5d01462` of `sky-zoom-rc` @ `3739284`, page = `860ed35`; pushed with `e8eb30e`, `ddf7020`; Chad: "Approve: merge sky-zoom-rc to main (page change: Sky zoom-out view)")
- **Before the push:** the last break reruns on the new camera path. endpoint-only (2), pinch-off (1), near-default (3) failed as they should. **near-by-distance PASSED** (test gap: the near check compared the camera with the page's own reported depth). Chad was told; the test now computes forward depth independently (camera world direction + drawn meshes): near-by-distance 15 failed, near-default 15, clean 333/333 (`ddf7020`).
- Merge: no conflicts; the ten page/Worker files are byte-identical to `860ed35`; `build_sky --check`, `build_scene --check`, `build_timeline --check` OK. Main's worker.js = live hub 0.6.6 (`4231114d…`), so **main = live**. An accidentally committed `__pycache__` file was removed (`e8eb30e`).
- **Served hashes: all nine page files exact at 15:57:56Z** (index `5193cb51`, sources `fb682867`, timeline.html `d7c37d5f`, app `e3f4a385`, arts `58773cef`, sky `2056da8d`, **skyscene `5e00ad77`**, style `fad92f02`, timeline.js `ae87c6a1`).
- **Live smoke test on the public page (15:58:09Z):** scripts load with `?v=202611241000`; zero catalogue requests on load; card → R1; zoom → scene (exactly those two); view open for 10 Nov; stop C: Earth, Moon, Sun all in frame, none occluded, scale line correct; Back to Earth restores.
- **Rollback:** page = revert the merge `5d01462` (own Approve line); hub = 0.6.5 `1073d15d…` (own line; harmless to leave, since the old page ignores the scene).

## 10 Nov 15:40 UTC (clock reading at write) — **GPT retest PASSED at `860ed35`; Pages-origin RC at `860ed35` PASSED; merge awaits Chad's line**
- GPT's first smoke test (preview, port 8899): the wheel pull-back lost Earth before the Moon came into frame (four sampled positions showed neither body). **Fixed at `860ed35`:** the target and swing follow the distance covered, plus containment (the target slides back toward Earth just enough to keep it in the safe area). New intermediate-frame check (201 positions × 3 canvases × 4 dates). Breaks `target-by-s` (11 fail) and `no-containment` (3 fail). Clean suite 333/333. Packet §6.
- **GPT retest (relayed by Chad):** desktop wheel passed; Earth's centre visible and clear of the controls at all 25 sampled positions; + Sun framed all three; Back to Earth closed the view and returned focus. Mobile pinch is covered by Claude's regression. GPT is comfortable releasing after a Pages-origin check of this exact revision.
- **Pages-origin RC at `860ed35` (15:39–15:40Z, pane, 588 px, real hub 0.6.6):** six page files hash-exact; requests = R1, then the scene only; **201-position sweep: Earth never lost or covered**; stops B and C all bodies in frame, no forced tags, no occlusion, camera near = rule; Back to Earth → near 0.05, focus restored.
- Mac `_review/sky-zoom-rc/` = `860ed35` (270 files, digest `adaf3067`); preview `skyscene.js` identical to the commit.

## 10 Nov 14:53 UTC (clock reading at write) — **Candidate final at `0ce5415`; all tests done; live RC repeated at `0ce5415` PASSED; merge awaits Chad's line**
- Since `96bcc5e`: one page line (`skyscene.js`, `zoomState` reports the camera's actual near plane, so the near-default break now fails), test hardening, packet §3 (results). Break runs: 22/25 fail cleanly, 2 more after test hardening, near-default after the reporting fix; **fixed-direction passes by design under the agreed checks (no minimum size), recorded for GPT**. Full regression green (orbital-browser 113/113 on a quiet machine; 112/113 only under parallel load, timing).
- Live RC at `0ce5415` (14:52Z, pane, Pages origin, real hub 0.6.6): six page files hash-exact; card → R1, zoom → scene (exactly those two requests); stops B and C all bodies in frame, no forced tags, no occlusion; camera near = rule (1,440.08 / 4,781.68); Back to Earth → near 0.05, focus restored.
- Mac `_review/sky-zoom-rc/` refreshed to `0ce5415` (270 files, digest of the hash list matches the commit); preview copy updated. GPT's smoke test paused by Chad (Terminal server stopped).

## 10 Nov 14:27 UTC (clock reading at write) — **R2 UPLOAD + HUB 0.6.6 DEPLOYED (no public page change); live RC from the Pages origin PASSED** — branch `sky-zoom-rc` @ `96bcc5e`
- **R2** (Chad: "Approve: upload ref/sky/sky-scene-2026-11-R1.json (complete-file sha256 d4605c3d…ae29, 67,778 B) to R2"):
  - source fetched from raw.githubusercontent at `96bcc5e`, sha256 exact; destination absent at 14:25:23Z;
  - PUT 14:25:24Z → 200, uploaded 14:25:25.732Z, etag `84ce4411eba28bfb0323ebabb5ee4ce1`, version `7e5e3a26895847bcb2f8cbf884eb8e1c`;
  - read-back 14:25:35Z: 67,778 B, sha256 exact.
- **Hub** (Chad: "Approve: deploy hub 0.6.6 from 96bcc5e (content only)"):
  - live before = 0.6.5 `1073d15d…ec94` (rollback target);
  - code from raw.githubusercontent at `96bcc5e`, 283,352 B, sha256 `4231114d21cdc004427fde072755776539db108fce5994efdad408db4168f078`;
  - content-only PUT 14:25:58Z → 200, etag `8a189d7f…ad9a`, modified 14:26:01.776Z. Bindings, secrets, variables, crons untouched.
  - **Verified 14:26:16Z:** read-back `4231114d…f078` exact; 19 bindings; `/` = **0.6.6**, `catalogues.sky.scene` = `sky-scene-2026-11-R1`, current still R1.
  - Routes: `/catalogue/sky/sky-scene-2026-11-R1` 200, 67,778 B, `d4605c3d…`; R1 200 `f851f164…`; unknown scene id 404; timeline 200 `096ae648…`; arts 200 `221bb1ca…`; `/snapshot/usgs` 200.
- **Live RC from the Pages origin (14:26:40–14:27:30Z, pane):**
  - branch page files (index, app, sky, skyscene, style, arts) fetched by commit with exact hashes, blob-injected into a clean github.io tab;
  - no catalogue request on load; card on → only R1; "Zoom out" → exactly one more request, the scene file;
  - view open for 10 Nov; stop C: Earth, Moon, Sun all in frame with tags, none occluded; scale line, strip (with "Imagery: 09 Nov 2026") and text equivalent correct;
  - Back to Earth restored near 0.05, target (0,0,0), sheet, focus.
- **Public page unchanged** (main `a1c3ed6` page files; the live page never requests the scene). Rollback for the hub alone: 0.6.5 `1073d15d…ec94` (own Approve line).
- **Held for GPT:** the smoke test of `_review/sky-zoom-rc-preview/`; then `Approve: merge sky-zoom-rc to main (page change: Sky zoom-out view)`.

## 10 Nov 12:01 UTC (clock reading at write) — **Source pass accepted by GPT; record rev 1.1; Sky zoom-out proposal rev 2.2** (docs only)
- GPT (relayed by Chad): the pass supports the frame, the radii (IAU Moon 1,737.4 km, Sun 695,700 km) and the build-time transform; **no repeat export needed**. GPT reproduced the 365-row Bulletin A maxima (0.26843 s; joint 0.50474″) and found the hashes matching and the repo record byte-identical to the corrected packet result. GPT could not rerun ERFA.
- **Record rev 1.1:**
  - the two protocol clock readings explained (11:42:31 `date -u` in the writing/hashing command; 11:42:37 the first LOG entry; first request 11:42:38);
  - UT1−UTC values marked as estimates; with the bulletin's seasonal term, −0.2909 s at 2027-12-31 (GPT's −0.291 s reproduced); −0.30 s is a rounded scenario;
  - the polar-motion input called conservative (largest x and y from different dates, 0.5408″), ~0.00015° a sensitivity estimate, no bound for the full window;
  - the 0.9 s convention attributed to the IERS glossary (GPT's citation, not read here).
- **Proposal rev 2.2:** carries these in, plus the explicit ICRF→GCRS-input assumption, sourced radii, the body sheets as radius sources (REGISTER text, proposed), Bulletin A summary-figure citation only (R3 separate), and a Bulletin A check in the refresh. Scene design unchanged.
- **Next, Chad's (separate lines):** REGISTER filing (§10.1 texts) and the branch build `sky-zoom-rc`.

## 10 Nov 11:52 UTC (clock reading at write) — **Sky zoom-out source pass DONE** (text only, no export; Chad: "Go: Sky zoom-out source pass — text only via the pane, no export (…)") — `docs/research/SKY-ZOOM-OUT-SOURCE-CHECK.md`; packet on the Mac `research/sky-zoom-out/2026-11-10-claude/`
- Run 11:42:31–11:50:48 UTC (Mac clock, protocol hash to the LOG entry closing request #5); protocol fixed first; **5 requests** (cap 6), one at a time, from the pane. Horizons requests were `MAKE_EPHEM='NO'` (body data only); the "I Accept" control was not clicked; no PDF; no fallback.
- **Frame (Horizons manual):** DE440/441 "taken to be indistinguishable from the ICRF"; ICRF vs FK5/J2000 "at most 0.02 arcseconds". The GCRS-axes reading stays labelled (IERS via ERFA).
- **Radii (Horizons body data):** Moon "Radius (IAU), km = 1737.4" (vol. mean 1737.53±0.03); Sun "Solar radius (IAU2015)= 695700 km" (photosphere 696500).
- **UT1−UTC: Bulletin C 72 does not state the 0.9 s bound** (stays [GK], no longer needed). Bulletin A (5 Nov 2026, No. 045): max |UT1−UTC| 0.26843 s (2027-06-02) over predictions to 2027-11-05; ~0.30 s at 2027-12-31 by its formula. Effect ≤ 0.00125° [desk, `sensitivity.py`].
- **Polar motion (Bulletin A):** max pole offset 0.5047″ (2027-06-01); effect ≤ 0.00015°.
- Proposal changes listed (record §5), **not applied**. REGISTER unchanged. **For GPT's review.**

## 10 Nov 11:37 UTC (clock reading at write) — **Sky zoom-out proposal rev 2.1 after GPT's recheck** (docs only)
- GPT (relayed by Chad; reviewed Mac copy `d0b39140…31ea`): rev 2 **closes the Worker-schema and alignment findings**; ready for Chad's separate text-only source-pass decision. GPT keeps Z1a–Z5a; Sun at 200 R⊕ fine; hardware depth measurement can wait for the rendered candidate. GPT reproduced the method figures from the saved point sets and ran a fixture of the proposed envelope through the existing Worker (200; empty Sun rows → 503).
- Rev 2.1 applies GPT's tightening:
  - framing checked on the rendered viewport (tag overlap, occlusion, strip coverage, readable distinct Earth/Moon markers at stop C; no minimum disc diameter), with near-conjunction dates 2026-Sep-11 (2.38°) and 2027-Dec-28 (2.82°) added beside 2027-Feb-21;
  - full wheel and pinch sequences through both stops;
  - near plane by forward camera-space depth, clipping checked during the pull-back and free orbit;
  - ERFA: complete file-level notice from the six pinned files (identical blocks, © 2013-2023; hashes listed) plus LICENSE, full non-endorsement clause.
- **Next, Chad's:** the text-only source pass (no export). REGISTER filing and the branch build stay separate approvals.

## 10 Nov 11:28 UTC (clock reading at write) — **Sky zoom-out proposal rev 2 after GPT's review** (docs only) — `docs/concepts/SKY-ZOOM-OUT-PROPOSAL.md`
- GPT (relayed by Chad) kept the five defaults and asked for three changes plus evidence work. All applied:
  1. **Scene file fits the Worker's existing envelope check** (`catalogue:"sky"`, pinned revision, `coverage`, non-empty `bodies.moon.rows`/`bodies.sun.rows`); no route code change; `pairs_with` the card's R1; card and scene pinned as a pair at refresh; tests through the real Worker functions.
  2. **Framing measured** [desk, committed files only]. Full labels beside bodies don't fit phones (875–1,215 R⊕ needed). Short tags + a text strip fit on all 579 dates. Worst stop C: 241 R⊕ on a 390×844 phone with the **Sun drawn at 200 R⊕ (was 400)**. A single fixed view direction would need 715 R⊕, so the camera swings between stops. Moon at stop B 7.7–16 px (rev 1's ~3 px was a guess). Near plane raised in the view (depth estimate).
  3. **Signed 3D direction check** vs astronomy-engine, with `antipode`/`swap-axes`/`mirror-lng` breaks; test set includes 2027-Feb-21 (Sun and Moon 178.86° apart).
- **Proposed method measured for both bodies:** vs full ERFA chain Sun 0.0023° / Moon 0.0025°; vs astronomy-engine 0.0025° / 0.0027°; Sun vs `ME.subsolar` 0.0115° (max over 579 dates).
- Wording from GPT adopted ("Earth and Moon to scale. Sun drawn closer and resized. Labels show actual distances."; "Calculated point directly beneath …"; "direction exact" dropped).
- REGISTER texts proposed, **not filed**: Horizons entry (live distances; proposed derived scene use) and a new ERFA entry (BSD-3 notice, LICENSE `b1858f9a…` read at `1a8044c`).
- **Not approved:** source pass, REGISTER update, build, R2, hub, page.

## 10 Nov 11:05 UTC (clock reading at write) — **Sky zoom-out proposal rev 1 written (docs only)** — `docs/concepts/SKY-ZOOM-OUT-PROPOSAL.md`, for GPT
- New thread; Mac folder re-granted. Mac already matched main `65306ac` (238/238 files by sha256, 10:58 UTC); nothing copied.
- **Frame alignment sourced** from ERFA (BSD-3 reimplementation of IAU SOFA, master `1a8044c`: `era00.c`, `c2t06a.c`, `gmst06.c`, `pnm06a.c`; text only). The Horizons manual was unreachable from Claude's fetch tool, so it goes on the source-pass list.
- **Desk check on committed raw exports only (no request)**, 579 dates, script + outputs in `docs/concepts/sky-zoom-out-desk-check/`:
  - Sun direction vs the full ERFA chain (`c2t06a`, polar motion 0, UT1 = UTC): GMST on ICRF (no precession) 0.369–0.392°; ERA only 0.059–0.156°; **IAU 2006 precession + GMST 0.0004–0.0023°**; UT1 − UTC = 0.9 s changes it by ≤ 0.0038°.
  - Independent agreement: Sun vs the page's `ME.subsolar` max 0.0119°; Sun vs astronomy-engine max 0.00053°; Moon vs astronomy-engine max 0.0013°.
- **globe.gl axes read from code:** +y north, +z (0°, 0°), +x (0°, 90° E). Camera limits: maxDistance 100 R⊕, far 1,250 R⊕. So the Moon fits at true distance; the Sun (~23,000 R⊕) cannot.
- **Leans (decisions Z1–Z5 Chad's after GPT):** explicit mode with Back to Earth; true-scale Earth–Moon, Sun drawn at 400 R⊕ with true apparent size and exact direction, labelled; same 00:00 UTC sample as Two Clocks; layers hidden in the mode (they show "now"); separate fixed scene file `sky-scene-2026-11-R1` on the existing route (R1 untouched); rotation done in the generator.
- **Not approved:** source pass, build, R2, hub, page.

## 10 Nov 10:49 UTC (clock reading at write) — **Sky thread closed: handover written; Mac synced; next = Sky zoom-out proposal (docs only)**
- `sky-rc` deleted by Chad (GitHub now: `main` + parked `aircraft-rc`).
- GPT's brief for the next Sky feature (zoom-out Earth → Moon → Sun) recorded in `docs/concepts/SKY-ZOOM-OUT-BRIEF.md`, with facts from this thread and the questions the proposal must answer. **Docs-only proposal next; nothing approved.**
- HANDOVER (new "NEXT THREAD STARTS HERE" block; §0 live state) and START-HERE §4l (Sky facts: eight page files, Horizons via the pane only, refresh by 2027-06-01, Pages-origin size measurement) updated at `5ea33c4`.
- **Mac sync at `5ea33c4`** (10:49:32 UTC, preserve-first): 238 repo files, 7 updated + 14 new; every preserved copy matched an earlier commit (no local edits); all 238 byte-identical afterwards. Preserved under `_sync-preserved/20261110T104932Z/`.

## 10 Nov 10:43:31 UTC — **PAGE RELEASED: Sky on Two Clocks card** (main `a1c3ed6`, merge of `sky-rc` @ `22f5aa9`, code `2da37b2`; Chad: "Approve: merge sky-rc to main (page change: Sky on Two Clocks card)")
- **Merge:** no conflicts. Merged files equal the candidate: index `95d0828c…`, app `e3f4a385…`, sky `175be00b…`, style `f7ea6e9c…`, arts `58773cef…`, sources `a524dbd8…`, timeline.html `d7c37d5f…`, timeline.js `ae87c6a1…`, worker `1073d15d…`. `build_sky.py --check` OK (`f851f164…368a`); `build_timeline.py --check` OK. The full regression (41 suites) passed on the code at 10:30 UTC.
- GPT's recheck of the corrected page at rev 3 was requested (note at 10:31 UTC). Chad sent the merge line; no GPT result was relayed in this thread before it.
- **Pages build** success 10:44:20 UTC.
- **Served hashes:** all **eight** page files exact (10:44:39 UTC).
- **Live smoke test (10:44:53 UTC, public page):**
  - Card present under the Sky heading, off on load, no sky request before switch-on.
  - Switch on → exactly one request, `/catalogue/sky/sky-2026-11-R1`; status ok. No JPL request.
  - Moon 399,770 km "Getting farther at sample time"; Sun 148.2 million km "Getting closer at sample time"; both "at 00:00 UTC, 10 Nov 2026". Charts and text equivalents present; R1 note shown.
  - Deep Time readable.
- **Rollback:** page = revert `a1c3ed6` (own Approve line); hub = 0.6.4 `7d46edf3…a7987` (own line; not needed, since the old page ignores the sky route).
- **Follow-on (Chad, 10 Nov):** Moon and Sun drawn in the 3D view when zoomed out — phase two, new thread, own proposal → GPT. Needs a sky-direction source (Horizons) and a scale decision (true scale is Moon ~60, Sun ~23,000 Earth radii).
- **Open:** `sky-rc` branch deletion (Chad's, GitHub branches page); HANDOVER / START-HERE at thread end.

## 10 Nov 10:12:09 UTC — **HUB 0.6.5 DEPLOYED** (Chad: "Approve: deploy hub 0.6.5 from 2da37b2 (content only)")
- **Before (10:11:32 UTC):** live worker.js = 0.6.4 `7d46edf3…a7987` (rollback target), 279,110 B; 19 bindings. Code from raw.githubusercontent at `2da37b2`: 282,755 B, sha256 `1073d15d0743171909debb95900141fefcf7f41185f2c0eb7646afd53665ec94` (same Worker as packet rev 1/2; the option (b) change touched only the generator and the page). Hash re-checked in the tab immediately before the write.
- **Deploy:** content-only PUT from the dashboard tab 10:11:48Z → HTTP 200, success, etag `03a5a98e…ed25`, modified 10:11:51.293Z. Bindings, secrets, variables and crons untouched.
- **Verified (10:12:04–10:12:09 UTC):** read-back `1073d15d…ec94` (exact); 19 bindings, identical list; `/` = **0.6.5**, `catalogues.sky` = `{kind:'fixed catalogue', current:'sky-2026-11-R1', revisions:['sky-2026-11-R1'], versioned_path:'/catalogue/sky/<revision>'}`; history collecting; `/status` collector 0.6.5.
  - `/catalogue/sky/sky-2026-11-R1` → 200, 71,925 B, sha256 `f851f164…368a` exact, ETag = file hash, max-age=60.
  - `/catalogue/sky`, `/catalogue/sky/`, `/sky-2026-11-R9`, `/sky-2026-11-T1`, `//sky-2026-11-R1`, `/sky-2026-11-R1/` → 404 `unknown revision`, no-store.
  - Unchanged routes: `/catalogue/timeline/tl-2026-11-R1` 200 `096ae648…`; `/snapshot/arts` 200 `221bb1ca…`; `/snapshot/usgs` 200.
- **Live RC from the Pages origin (10:12:51–10:13:58 UTC):**
  - Sky route `type: cors`, 200, sha256 exact; unknown revision `cors` 404.
  - Served size (same-origin tab, where timing is visible): zstd, 26,819 B encoded / 27,119 B transferred for the 71,925 B file; `access-control-allow-origin: *`.
  - **Branch page** `2da37b2` (index, app, sky, style, arts fetched by commit with exact hashes, blob-injected into a clean Pages-origin tab): off on load, zero sky requests; switch on → exactly one request, `/catalogue/sky/sky-2026-11-R1`; status ok; Moon 399,770 km "Getting farther", Sun 148.2 million km "Getting closer", both "at 00:00 UTC, 10 Nov 2026"; R1 time note exact; no JPL request.
  - The live page (main, `?v=202611221000`) still loads on 0.6.5 (no Sky card).
- **Public page unchanged.** Rollback for the hub alone: 0.6.4 `7d46edf3…a7987` (own Approve line).
- **Merge held (GPT):** corrected page recheck (option (b) at `2da37b2`), T1 rerun (done, Mac packet), this Pages-origin check (done). Then `Approve: merge sky-rc to main (page change: Sky on Two Clocks card)`.

## 10 Nov 10:01 UTC (clock reading at write) — **R1 catalogue IN R2 (no public effect); GPT fixes on `sky-rc` @ `770e4fb`; refresh rehearsal T1 RUN — generator REJECTED the short window (finding)**
- **GPT candidate review** (relayed by Chad): R1 catalogue and Worker passed; merge held for three fixes, applied on the branch: page schema validates the `time` block (`horizons_ut_tilde_from`, leap-second date, coverage order; new fixtures + `no-time-check` break); Sources cross-check sentence now Moon-only ("agreed with the Moon export to within 0.17 m on every date"); timeline hub version check numeric ≥ 0.6.4. Tests: sky-hub 46, sky-build 33, sky-ui 66; all breaks fail.
- **R2 write** (Chad: "Approve: upload ref/sky/sky-2026-11-R1.json (complete-file sha256 f851f164…368a, 71,925 B) to R2"): destination absent at 09:49:57Z; PUT 09:50:15Z → 200, uploaded 09:50:16.417Z, etag `634a44d8fc2f4430bab23e2ce0410d98`, version `7e5e3b2272dd178150b2aa704d145f67`; read-back 71,925 B, sha256 exact. Live hub is 0.6.4 (no sky route), so nothing public changed.
- **Refresh rehearsal T1** (Chad: "Go: Sky refresh rehearsal — window 2026-11-10 to 2026-11-24, revision sky-2026-11-T1, three Horizons requests from the pane, output to the Mac research packet only; nothing published."): Mac `research/sky-two-clocks/2026-11-10-claude-rehearsal-T1/` (PROTOCOL, LOG, REHEARSAL-RESULT, .hashes-T1). Bulletin C unchanged (C 72, same bytes). Three requests 09:53:40Z–09:54:07Z, all 200, raw byte-exact. **Unchanged generator REJECTED: "UT~ flag start missing or differs between bodies"** — a window ending before Horizons' UT~ start (this export 2027-02-04) has no UT~ rows; real S4 windows always cross it, R1 unaffected. Options for GPT/Chad: (a) keep the rule, say so in the rejection and the procedure (Claude's lean); (b) allow none on both bodies with a null, plus page schema change. A scratch copy relaxing that one line built and `--check`ed clean (all other validations passed; cross-check 0.015 m) — diagnostic only. Observation: T1 − R1 on the 15 shared dates differs ≤ 0.16 m (Moon) / 0.92 m (Sun), a constant −2.234 ms in time on every row; cause not established; far below the card's precision.
- Nothing went to the repo catalogue, the hub or the page. **Next:** GPT reviews the rehearsal + corrected page bytes (packet update + Mac `_review` refresh); then hub 0.6.5 deploy and merge, each on its own Approve line.

## 10 Nov 09:35 UTC (clock reading at write) — **Sky candidate BUILT on branch `sky-rc` @ `eb78e1a`** (Chad's Approve line; branch only: no merge, R2 write, hub deploy or page change) — packet `reviews/2026-11-10-sky-rc.md` (on the branch)
- **Catalogue** `sky-2026-11-R1` (71,925 B, sha256 `f851f164…368a`; generator `phase1/sky/build_sky.py --check`; raw Horizons exports in `phase1/sky/raw/`). **Hub 0.6.5** `/catalogue/sky/<revision>` (versioned only; unknown/malformed/bare → 404, zero R2 reads; bad bytes → 503). **Card** `sky.js` + Sky group (heading + Orbital objects + card) before the Met card; Deep Time pre-rendered; Sources `#sky`; assets `?v=202611231000` (timeline.html unchanged).
- **Tests:** sky-hub 46/46, sky-build 30/30, sky-ui 56/56 (three timezones; real after-apogee day 2026-11-14); **all 21 breaks fail**. 41-suite regression run green (desktop-overflow 112, mobile-pass 131, orbital-browser 113, timeline-ui 585); timeline-catalogue-hub version pin loosened to ≥ 0.6.4 (66/66, breaks still fail).
- Deviations for GPT (packet §6): no day-over-day mode (S3 = range rate); phone overlay measure can't see sheet cards; bundle 72 KB vs ~50 KB estimate.
- Mac: `_review/sky-rc/` (exact, SHA256SUMS 236 files) + `_review/sky-rc-preview/` (one-line change: reads the local catalogue; README).
- **Next (each its own Approve line):** GPT review → R2 upload → hub 0.6.5 deploy → live RC from the Pages origin → merge.

## 10 Nov 08:56 UTC (clock reading at write) — **Horizons REGISTER entry FILED; Sky S1–S4 DECIDED** (docs only)
- Chad: "Approve: file the Horizons REGISTER entry per SKY-SOURCE-CHECK rev 2 §5 (research only)" → filed in REGISTER.md (research only, not on the page).
- Chad: "S1a existing hub, S2a beside Orbital Objects under a Sky heading, S3 range rate, S4 coverage 2026-06-01 to 2027-12-31 with refresh by 2027-06-01" → recorded in proposal rev 3 §9.
- **Next (own Approve line):** branch build `sky-rc` — no merge, R2 write, hub deploy or page change.

## 10 Nov 08:51 UTC (clock reading at write) — **GPT passed the Horizons exports for research use; source record rev 2; proposal rev 3** (docs only)
- GPT matched the record hash, verified the protocol and all 29 packet hashes, reproduced the check output and parsed all 7 raw responses (Mac copy). Six qualifications applied in `SKY-SOURCE-CHECK.md` rev 2: CSV isolation by #3 vs #5 and #2 vs #7 (deviations recorded); `UT~` from 2027-02-04 and the July leap-second uncertainty from 2027-07-01 kept separate, "~2 ms" withdrawn; API pins 1.2 (GET) / 1.0 (File API); widening "Estimated from changes in Mercury's orbit consistent with solar mass loss"; card keeps "hundreds of millions of years" (~650 Myr in Sources); REGISTER draft records the operator-triggered pane requests and default User-Agent. Packet: `rev2/CORRECTIONS-rev2.md`, originals unchanged.
- **Proposal rev 3** (`SKY-TWO-CLOCKS-PROPOSAL.md`): tested recipe (UT route + route-1 cross-check, CSV off, raw flags kept, version pins), Deep Time wording from the sources, real after-apogee fixtures, refresh step 0 = Bulletin C check.
- **Next, Chad's:** `Approve: file the Horizons REGISTER entry per SKY-SOURCE-CHECK rev 2 §5 (research only)`; S1–S4 decisions (GPT recommends S1a, S2a, S3 range rate, S4 as proposed); then the branch build on its own line.

## 10 Nov 08:45 UTC (clock reading at write) — **Sky source pass + first Horizons export DONE** (research only; Chad: "Approve: Sky source pass + first Horizons export …") — `docs/research/SKY-SOURCE-CHECK.md`; packet on the Mac `research/sky-two-clocks/2026-11-10-claude/`
- Run 08:28:54Z–08:43:20Z (Mac clock). GPT passed proposal rev 2 first (focused recheck) and recommended S1a / S2a / S3 range rate / S4 as proposed — relayed by Chad, **not yet Chad's decisions**.
- **Export accepted:** Moon + Sun, 579 daily samples each at 00:00:00 UTC (2026-06-01…2027-12-31), DE441, Earth body centre, GEOMETRIC, KM-S, RG/RR. Route 2 (`TIME_TYPE='UT'`) accepted; route 1 (own TDB epochs) cross-check agrees to 0.166 m on every date. **`CSV_FORMAT='YES'` drops the vector columns** (observed); labelled text used. Rows from 2027-02-04 are Horizons' `UT~` (last known leap second held); Bulletin C 72 rules out a leap second only to end Dec 2026. Responses say API 1.2, doc says 1.3 (flag). 7 requests, one at a time; the "I Accept" control was not clicked; the Mac shell can't reach JPL (403).
- **Sources:** SSD FAQ public-domain statement + fair use; D1 147/152 M km confirmed (export: 147,104,596 / 152,100,460 km, Δ 5.0 M km); L1 3.8 cm/yr LLR; L2 live page gone, archived copy gives ~650 Myr to no total eclipses; **M1's 1.5 cm/yr/AU is the earlier theoretical figure — the measurement (Genova 2018, CC BY) is a fitted GM change −6.13e-14/yr → ~0.9 cm/yr, ~0.9 m/century**.
- Draft REGISTER wording for Horizons in the record §5, **not filed**. Proposal changes listed for rev 3 (§6), not applied. **For GPT's review.**

## 10 Nov 08:25 UTC (clock reading at write) — **Sky on Two Clocks proposal rev 2 after GPT's review** (docs only)
- GPT reviewed rev 1 (Mac copy `7112dfbf41c9…`): card design sound; targeted rev 2 asked for. Applied: UTC as an export requirement (TLIST of individually converted TDB epochs preferred; `TIME_TYPE='UT'` only if docs + header establish UTC; fixed offset only with residual, leap-second check and agreed tolerance); User-Agent reconciled with the browser route; reproducible export record, 2028-01-01 row trimmed, bundle hash pinned outside the bundle; one direction method per dataset (missing value ≠ method switch; check 2 fixture corrected to after apogee); partial Sun window and outside-coverage states; rollover by the next tick + on card open + on return to the page; one consistent solar mass-loss chain (fitted GM change vs mass-loss estimate); T3 contract carried over for S1(a); every acceptance check names a concrete break.
- GPT confirmed: 579 days; full Sun window 30 Nov 2026 – 2 Jul 2027; 0.91 cm/yr and 0.91 m/century. **For GPT's focused recheck of §3, §4, §6.2, §8.** Nothing approved.

## 10 Nov 08:18 UTC (clock reading at write) — **Sky on Two Clocks: build proposal rev 1** (docs only; Chad's spec) — `docs/concepts/SKY-TWO-CLOCKS-PROPOSAL.md`, for GPT
- One compact card (Now: Moon/Sun geometric centre-to-centre distance at 00:00 UTC with 35-day / 1-year charts; Deep Time: measured lunar recession, estimated widening from solar mass loss). Horizons VECTORS recipe pinned (301/10 from 500@399, VEC_TABLE 3, VEC_CORR NONE, KM-S, daily; time scale UT-or-TDB settled by the first export's header). Coverage 2026-06-01 → 2027-12-31, manual refresh before 2027-06-01.
- **No source read:** the workspace shell and Claude's fetch tool could not reach JPL or nasa.gov (08:10–08:15 UTC); numbers marked [GK] until a text-only pane pass. Solar mass-loss trace written out (≈0.9 cm/yr from the ~6.1e-14/yr rate [GK]); a possible mismatch with the NASA article's own figure flagged for that pass.
- Decisions S1 (hub fixed catalogue vs page-bundled — constitution point) to S5 for Chad after GPT. **Not approved:** source pass, export, REGISTER, build, any production action. Opening-page / Met audit untouched.

## 10 Nov 07:56:29 UTC — **PAGE RELEASED: timeline fetches its own catalogue revision** (main `cc91165`, merge of `timeline-revs-rc` @ `4728907`/code `1d31df6`; Chad: "Approve: merge timeline-revs-rc to main (page change: timeline fetches its own catalogue revision)")
- Merge: no conflicts; merged files = packet hashes; generator `--check` passes. Pages build success 07:58:30 UTC.
- **Served hashes (no-store, 07:58:38 UTC), all 7 = candidate:** index `fc8f1fa209d8`, sources `c63f89041d74`, timeline `d7c37d5f3057`, app `e3f4a3854113`, arts `58773cef35e6`, timeline.js `ae87c6a1f2ef`, style `30bc06b37123`.
- **Live page:**
  - Fresh load (07:59:02 UTC): build `202611221000`, axis on, exactly one hub request, to `/catalogue/timeline/tl-2026-11-R1`; End-Cretaceous mark → its card, Back → focus on the mark; no overflow.
  - **A cached old page** (07:58:50, build `202611211000`, legacy URL) also drew on 0.6.4: the two page generations coexist, which is the point of T3.
- **main = live:** hub 0.6.4 `7d46edf3…` = main's worker.js; page = main.
- **Rollback:** revert `cc91165` (page; legacy URL still served). Prefer keeping hub 0.6.4; hub to 0.6.3 only on its own line (new-page tabs would then fall back to the list).
- Backlog T3 (versioned releases): serving mechanism done; the release rule is in the code and proposal rev 1.1.

## 10 Nov 07:54:38 UTC — **HUB 0.6.4 DEPLOYED** (Chad: "Approve: deploy hub 0.6.4 from 1d31df6 (content only).")
- **Before (07:54:26 UTC):** live worker.js = 0.6.3 `94a6b2b2…af93` (rollback target); 19 bindings; health 8/8. Code fetched from raw.githubusercontent at `1d31df6`: 279,110 B, sha256 `7d46edf36e6f8c8d03293ad862e4d8b8b49fa48e72ca4aa5cf29f7945c0a7987` (= packet rev 2). Hash re-checked immediately before the write.
- **Deploy:** content-only API from the dashboard tab, HTTP 200, success, etag `2a179043…770a`, modified 07:54:38.493Z. Bindings, secrets, variables and crons untouched.
- **Verified (07:54:52 UTC):** read-back `7d46edf3…a7987` (exact); 19 bindings, identical list; `/` = **0.6.4**, `catalogues.timeline` = `{path:'/catalogue/timeline', revision:'tl-2026-11-R1', current:'tl-2026-11-R1', versioned_path, revisions:['tl-2026-11-R1']}`; history collecting; health 8/8; `/snapshot/arts`, `/snapshot/usgs` 200.
  - Routes: `/catalogue/timeline`, `/catalogue/timeline/` and `/catalogue/timeline/tl-2026-11-R1` → 200, `096ae648…0fbe`, max-age=60.
  - `/tl-2026-11-R9`, `//`, `//tl-2026-11-R1` and `/tl-2026-11-R1/` → 404 `unknown revision`, no-store.
- **Live RC from the Pages origin (07:55:08–07:55:32 UTC):**
  - **Both R1 routes:** `type: cors`, 200, 15,656 B, sha256 exact.
  - **Branch page:** files fetched by `1d31df6` with exact hashes, injected into a clean tab; it draws (`TL_AXIS.state = on`, build `202611221000`, 5 marks) and made exactly one hub request, to `/catalogue/timeline/tl-2026-11-R1`.
  - **The live page** (main, build `202611211000`, legacy URL) still draws on 0.6.4.
- **Public page unchanged** (main `57d07c2` page). Rollback for the hub alone: 0.6.3 `94a6b2b2…af93` (own Approve line).
- **Next:** `Approve: merge timeline-revs-rc to main (page change: timeline fetches its own catalogue revision)`.

## 10 Nov 07:52 UTC (clock reading at write) — **timeline-revs-rc rev 2: routing fix after GPT's review** (branch only)
- GPT: core design passed (all 10 manifest hashes matched; GPT's own fixture confirmed legacy = R1 with R2 current, per-revision bytes/ETag, swapped object → 503 integrity, unknown ids → 404 with zero reads). One fix: the shared parser drops empty segments, so `/catalogue/timeline//` and `//tl-2026-11-R1` returned 200 and read R2.
- Applied `1d31df6`: the Timeline route matches the raw path (one trailing slash = the R1 alias, as 0.6.3; any other loose separator → 404, no read). Hub 66/66; full regression green on `1d31df6`; 16 breaks fail (new `loose-separators` → 8). **Replacement worker.js `7d46edf3…a7987`** (279,110 B); page files and catalogue unchanged. Packet rev 2 at `4728907`.
- Mac: `_review/timeline-revs-rc-r2/` (exact + test sources + SHA256SUMS) and `-r2-axis-preview/`.
- **Next:** GPT's hash recheck → `Approve: deploy hub 0.6.4 from 1d31df6 (content only)` → live RC (both R1 routes + CORS from the Pages origin) → page merge on its own line. No R2 upload needed.

## 10 Nov 07:30 UTC (clock reading at write) — **timeline-revs-rc built: hub 0.6.4 versioned catalogue route (branch only)** (Chad: "Approve: build timeline-revs-rc on a branch only — hub 0.6.4 versioned catalogue route + page fetches its own revision, per TIMELINE-CATALOGUE-REVISIONS-PROPOSAL rev 1.1; no merge, R2 write, hub deploy or page change.")
- Proposal rev 1 → GPT review (versioned route and 404/503 split accepted; four points) → **rev 1.1** (legacy URL pinned to R1 permanently, `current` = metadata only; immutable revisions; qualified rollback; legacy-vs-current fixture test) → Chad's branch go.
- **Candidate `timeline-revs-rc` @ `c98cb24`** (code `4310d54` + packet `reviews/2026-11-10-timeline-revs-rc.md`). Hub 0.6.4 `a4cd5c91…9eca0`; page fetches `/catalogue/timeline/<its revision>`; `?v=202611221000`. **Catalogue unchanged (`096ae648…0fbe`), so no R2 write.**
- Tests: hub 57/57 (fixture R1 + R2 with R2 current: legacy still R1; 16 malformed ids → 404 with no R2 read), axis 96/96, timeline-ui 585/585; full regression green; 15 breaks each fail (new: legacy-follows-current, serve-unknown-as-current, no-per-revision-hash, fetch-unversioned).
- Mac: `_review/timeline-revs-rc/` (exact, SHA256SUMS) + `_review/timeline-revs-rc-axis-preview/` (HUB='.' only; README).
- **Next (each its own Approve line):** GPT review → `Approve: deploy hub 0.6.4 from 4310d54 (content only)` → live RC (both R1 routes + CORS from the Pages origin) → `Approve: merge timeline-revs-rc to main (page change: timeline fetches its own catalogue revision)`.

## 10 Nov 06:53 UTC (clock reading at write) — **GPT's live smoke test of the deep-time release: PASSED, no rollback indicated** (relayed by Chad)
- All 7 served page/asset hashes = rev 3. 10/10 checks pass: hub root 0.6.3 + `catalogues.timeline`; `/catalogue/timeline` 200, 15,656 B, exact sha256; CORS (`Access-Control-Allow-Origin: *`, page used the cross-origin catalogue); axis drawn, build/revision match; all 5 marks open their evidence, Back returns focus each time; periods list (keyboard + click, 12, `1.0`/`66.00`); public sources = ICS + 6 articles, Herz/Dai/Bos/Trudgill absent; empty lanes not focusable; 390×844 no overflow; regressions clear (Pliny shelf, Earth now readings, Arts, health 8/8).
- **ETag:** GPT saw a strong ETag; Claude saw a weak `W/"…"` at 06:09 (dashboard tab). Likely depends on the request's compression; no effect (the page doesn't use it).
- **Limits (GPT):** CORS and axis state inferred from working behaviour, not the literal `response.type` / `TL_AXIS.state` values (Claude read both directly at 06:16–06:20 UTC). Untested: real iPhone Safari, screen-reader announcements, deliberate failure paths on production.
- **Wording suggestion (not applied):** "extinction horizon" may slow a general reader → e.g. "the rock layer that marks the extinction". It lives in the claim label `extinction_horizon_approx` (`build_timeline.py` + `timeline.js`) and the E4 claim text in `big5.json`, so a change means a new catalogue revision: regenerate, re-pin page + Worker, R2 upload, hub deploy, page release — each its own Approve line. Chad's call.

## 10 Nov 06:17:50 UTC — **PAGE RELEASED: deep-time axis on the Timeline page** (main `57d07c2`, merge of `timeline-deep-rc` @ `0f67fca`; Chad: "Approve: merge timeline-deep-rc to main (page change: deep-time axis on the Timeline page)")
- **Live RC from the Pages origin first (06:16:26–06:17:31 UTC, clean pane tab on `timeline.js?clean-tl-rc3`):** timeline.html, timeline.js, style.css fetched by commit `0f67fca`, sha256 exact; **CORS: `fetch` of `/catalogue/timeline` from `https://theonetheonlythechad.github.io` → response type `cors`, 200, 15,656 B, sha256 `096ae648…0fbe`, ETag readable**; injected page: `TL_AXIS.state = on`, build `202611211000`, rev `tl-2026-11-R1`; 5 marks + "Periods on the chart (12)" (12 items); 1280×900 and 390×844 no horizontal overflow; all 5 mark targets present. (Clicking marks not tested in the injected copy — its `<base href>` resolves `#…` to the index; done on the live page instead.)
- **Merge:** no conflicts; merged page/hub/catalogue files = the rev 3 hashes; generator `--check` passes on the merge.
- **Pages build:** success 06:20:12 UTC. **Served hashes (no-store, 06:20:20 UTC), all 7 = rev 3:** index `df534c65f2b3`, sources `b9df5d546da3`, timeline `6be51fbfb828`, app `e3f4a3854113`, arts `58773cef35e6`, timeline.js `cf8522a23e45`, style `30bc06b37123`.
- **Live page (06:20:33–06:20:45 UTC):** axis on, build `202611211000`; End-Permian mark → `#e-big5-end-permian`, focus on its card heading; browser Back → focus back on the mark, axis still on.
- **main = live again:** hub 0.6.3 `94a6b2b2…af93` = main's worker.js; page = main.
- **Rollback (page first, each its own Approve line):** revert `57d07c2` (page back to `4b23518`) → hub 0.6.2 `4b5b6aa3…003f` → R2 object removal (optional; unused without the route).
- **START-HERE:** T1 exception line replaced with the fixed-catalogue rule for the timeline.
- **Outstanding:** real iPhone Safari check (Chad); GPT's independent live smoke test if wanted; Chad's choice on the Gmail address in REGISTER's GFW access line.

## 10 Nov 06:09:15 UTC — **HUB 0.6.3 DEPLOYED** (Chad: "Approve: deploy hub 0.6.3 from 0f67fca (content only)")
- **Before (06:08:46–06:09:00 UTC):** live worker.js = 0.6.2 `4b5b6aa3…003f` (the pinned rollback target); 19 bindings; health 8/8 (200). Code fetched from raw.githubusercontent at `0f67fca`: 276,411 B, sha256 `94a6b2b263468c910e91d13f6437514cf77ae3e9556f1b686d7a5f31925caf93` (= the reviewed branch file, rev 3 §6). Hash re-checked immediately before the write.
- **Deploy:** content-only API from the dashboard tab, HTTP 200, success, etag `19de98d2…f8af`, modified 06:09:15.541Z. Bindings, secrets, variables and crons untouched.
- **Verified (06:09:29 UTC):** read-back worker.js sha256 = `94a6b2b2…af93` (exact); **19 bindings, identical list**; `/` = **0.6.3**, `catalogues.timeline` listed (revision `tl-2026-11-R1`) beside `catalogues.arts`; history collecting; health **8/8** (200); `/snapshot/arts` and `/snapshot/usgs` 200; **`/catalogue/timeline` 200, 15,656 B, sha256 `096ae648…0fbe` (= the R2 object and the page's pin)**, `application/json`, `Cache-Control: public, max-age=60`, ETag weak `W/"096ae648…"` (same edge weakening as Arts; the page doesn't use it). The cross-origin read from the dashboard origin succeeded (the code sends `Access-Control-Allow-Origin: *`; the header itself is not script-readable). `/catalogue/timeline/x` falls through to the root listing, as other unknown paths do.
- **Public page unchanged:** main's page is still `4b23518` (?v=202611181000); the axis exists only on branch `timeline-deep-rc`.
- **Rollback (own Approve line):** redeploy 0.6.2 `4b5b6aa3…003f` (= main's `phase1/worker.js`; main ≠ live hub until the branch merges).
- **Next:** live RC from the GitHub Pages origin (incl. CORS; read-only, branch page against the deployed hub) → `Approve: merge timeline-deep-rc to main (page change: deep-time axis on the Timeline page)`.

## 10 Nov 06:06:51 UTC — **R2 UPLOAD DONE: `ref/timeline/tl-2026-11-R1.json`** (Chad: "Approve: upload ref/timeline/tl-2026-11-R1.json (complete-file sha256 096ae648479b744f458cdf5d042667c6a6262114ee63252cf132c41f99050fbe, 15,656 B) to R2")
- **Pre-checks (06:06:36 UTC, dashboard tab):** destination absent (404 "The specified key does not exist"); nothing under `ref/timeline/`. Source fetched from raw.githubusercontent at branch commit `0f67fca`: HTTP 200, 15,656 B, sha256 `096ae648…0fbe` = the approved hash. Hash and absence re-checked immediately before the write.
- **Upload:** dashboard R2 objects API `PUT`, HTTP 200, size 15,656, storage class Standard, etag `9e8b864bc64fe3baff1b801750677319`, version `7e5e3beefe0d7b1ab9c05a54496c7c60`, uploaded **06:06:51.433Z**.
- **Read-back (06:06:52 UTC):** HTTP 200, 15,656 B, **sha256 `096ae648…0fbe` (exact)**. No lifecycle rule covers `ref/`, so it does not expire.
- **No public effect:** the live hub is still **0.6.2** and has no timeline route (`/catalogue/timeline` falls through to the hub's root listing, 06:07:07 UTC).
- **Rollback target pinned for the hub deploy (06:07 UTC, read back from Cloudflare, multipart wrapper removed):** live worker.js = **0.6.2, sha256 `4b5b6aa3c953afbce197586b8007a54da5191d83f4b317b28a48b4b1661a003f`** (274,031 B) = main.
- R2 cost: one Class A write and a few Class B reads, inside the allowances. Removing the object would be a separate action with its own Approve line.
- **Next (each on its own Approve line):** `Approve: deploy hub 0.6.3 from 0f67fca (content only)` → live RC from the Pages origin (incl. CORS) → page release.

## 10 Nov 06:02 UTC (clock reading at write) — **timeline REGISTER entries FILED** (docs only)
- On Chad's line "Approve: file the timeline REGISTER entries — ICS chart (v2026-06.5, CC BY 4.0) and the six episode sources (Harper 2024, Percival 2018, Burgess 2017, He 2020, Wilf 2023, O'Connor 2024), research record docs/research/TIMELINE-BIG-FIVE-SOURCE-CHECK.md".
- REGISTER: one entry for the ICS chart (tag `v2026-06.5`, commit `44d1043ecf29`, chart.ttl `0158959e…b355`, citation as the chart gives it) and one entry with a line per article (DOI, who read the publisher page, notice status as of 10 Nov). All CC BY 4.0, commercial use with attribution. Herz, Dai, Bos, Trudgill listed as not filed (research record only). Source-check doc marked filed.
- Terms only: nothing uploaded, deployed or released. **Next, each on its own Approve line:** R2 upload of `ref/timeline/tl-2026-11-R1.json` → hub 0.6.3 deploy → live RC (incl. CORS from the Pages origin) → page release.

## 10 Nov 05:55 UTC (clock reading at write) — **timeline-deep-rc rev 3: candidate `0f67fca`** (branch only; code = `7cad90c` + packet)
- GPT's rev 2 review complete; ready for Chad's approval to file the seven sources. Applied GPT's pre-upload point: end-Triassic context (Bos 2024, Trudgill 2025) removed from the public catalogue and page (research record only), as with Herz/Dai. **Public sources = the ICS chart + Harper, Percival, Burgess, He, Wilf, O'Connor** (hub test checks the set).
- Page, catalogue and Worker regenerated and pinned together: catalogue `096ae648…0fbe` (15,656 B) = hub pin; `?v=202611211000`. Every suite passes on `7cad90c`; every break fails. Packet §6 rev 3 table. Mac `_review/timeline-deep-rc-r3/` (+ `-axis-preview`).
- **Next, each on its own Approve line:** GPT's focused re-check of the replacement hashes → REGISTER filing (seven sources) → R2 upload → hub deploy → live RC (incl. CORS from the Pages origin) → page release.

## 10 Nov 05:25 UTC (clock reading at write) — **timeline-deep-rc rev 2 after GPT's review: candidate `569e6e2`** (branch only; code = `4482045`, then a test-only fix + packet)
- GPT verified rev 1 (ten hashes; preview at 1280 and 390×844; fallbacks; Worker in-memory checks) and asked for one small revision. Applied: one F–F mark at the modelled range (bound in the panel); intervals at true endpoints when ≥ 4 CSS px; Herz/Dai off the public card (research record only); key text exposed, symbols hidden; bands to scale with codes only where they fit, plus a keyboard/tap **period list** (ages as the chart writes them); guarded validation (nested nulls → unavailable message, list usable). `?v=202611201000`; catalogue `ebf7c6e1…c1ab` (16,648 B) = hub pin.
- **Every suite on `4482045`** passes (timeline-axis 93, timeline-catalogue-hub 25, timeline-ui 585, desktop-overflow 112, mobile-pass 131, …); every break fails its suite. Packet §6 pins candidate + hashes together.
- **For GPT:** Mac `_review/timeline-deep-rc-r2/` (exact, SHA256SUMS) and `_review/timeline-deep-rc-r2-axis-preview/` (README; start the server from that folder). Rev 1 folders kept for the record.
- **Not approved:** REGISTER filing, R2 upload, hub deploy, page release.

## 10 Nov 04:47 UTC (clock reading at write) — **Timeline deep-time candidate BUILT on branch `timeline-deep-rc` @ `539b785`** (Chad's Approve line: branch only; NOT merged, NOT deployed, no R2 write) — packet `reviews/2026-11-10-timeline-deep-rc.md` (on the branch)
- **Built:** chart extractor (pinned `chart.ttl` hash) → `chart-v2026-06.5.json`; `big5.json` (five episodes, ten sources, values as checked); generator → catalogue `tl-2026-11-R1.json` (17,127 B, sha256 `cab2ac93…552e`) + pre-rendered list with embedded hash/revision/build; **hub 0.6.3** `GET /catalogue/timeline` (Arts pattern, pin = that hash); page axis (overview strip, 538.8 Ma window, chart bands + 5 boundary lines, Mass extinctions lane, three empty lanes 69 px at 390×844, glyph key), every §4a failure → list only, §4b permalinks. Asset `?v=202611191000`.
- **Tests:** timeline-catalogue-hub 24/0 (3 breaks fail), timeline-axis 78/0 (5 breaks fail), timeline-ui 585/0, all other suites pass (desktop-overflow 112, mobile-pass 131). CORS is checked in the live RC (not testable with fulfilled routes).
- **For GPT:** Mac `_review/timeline-deep-rc/` (exact branch copy, SHA256SUMS) and `_review/timeline-deep-rc-axis-preview/` (one-line change so the axis reads the local catalogue before hub 0.6.3 exists; README). Open points in the packet §7.
- **Not approved:** REGISTER filing, R2 upload, hub deploy, merge/page release.

## 10 Nov 04:16 UTC (clock reading at write) — **Build proposal rev 1.1 (GPT's review); E1 publisher check complete** (docs only)
- **E1:** Chad pasted the Oxford page for Harper 2024 (sha256 `fab9abba…0bbb`): no correction/retraction/EoC text, CC BY 4.0 → all five episodes confirmed; release carries the Big Five (GPT's four-episode freeze kept as the fallback rule).
- **Rev 1.1:** mismatch/failure table widened (open tabs and caches, HTML/JS from different builds via `build_id`, 10 s timeout, parse/validation failure, CORS from the Pages origin; "impossible" replaced by "reduces version skew"); E2 drawn as a modelled-range glyph at the midpoint plus a directional marker at ≤ 372.4 Ma (no fading bar); claim types as separate labelled fields; permalinks always reach pre-rendered evidence (loading / unavailable / clustered).
- GPT found B2–B6 sound. **Not approved:** branch build, filing, release.

## 10 Nov 04:10 UTC (clock reading at write) — **Timeline deep-time BUILD PROPOSAL rev 1** (docs only) — `docs/concepts/TIMELINE-DEEP-TIME-BUILD-PROPOSAL.md`
- GPT reviewed source check rev 2 (hashes matched) and read the science.org pages for E4 and O'Connor (no notices). **E1 provisional, off the release axis** until the Oxford page is read.
- Proposal: overview strip + 538.8 Ma window; Mass extinctions lane with E2–E5 (E1 per B1); three empty lanes ≤ 96 px; a drawing rule per shape (one-sided bar never closed, modelled hatched, approximate "~", no-uncertainty point, chart boundary beside the source value); one versioned catalogue served by hub 0.6.3 at `/catalogue/timeline` (Arts pattern), no-JS list from the same revision, mismatch → list only; tests; REGISTER before release; rollback page first.
- **R2 read 04:08:55 UTC** (dashboard GraphQL, read-only): Class A 26,777, Class B 38,550 over 10.708 days → ~7.6 % / ~1.1 % of allowances projected; storage peak 0.877 GB. Expected increment $0.00 (estimate, conditional).
- Decisions B1–B6 for Chad. **Nothing built, uploaded, deployed or filed.**

## 10 Nov 04:02 UTC (clock reading at write) — **Big Five source check rev 2 after GPT's review** (research only; packet `rev2/` on the Mac; originals unchanged)
- GPT accepted the packet as a bounded evidence record and revised the blanket PASS. Rev 2: **C0 reconciled** (tag `v2026-06.5` = `44d1043ecf29`; chart.ttl re-fetched by the Mac = same sha256, now retained); **E3 switched** to Burgess et al. 2017 (onset 251.941 ± 0.037 Ma, CC BY 4.0) because Herz's ~251.906 Ma is not in Dai's readable text; **E2** labelled boundary-age evidence, duration unset; **E5** extinction placed at the dated impact with O'Connor 2024 as synchrony evidence, causes off; **E1** pulses as attributed text.
- Publisher pages read for E2, E3, E5 (no notices). **E1 (OUP) and E4 (Science) blocked by a bot challenge — not bypassed; open.** Pane site access granted by Chad: academic.oup.com, cambridge.org, science.org.
- Full-text XML not retained (Mac shell refused at Europe PMC/NCBI/Crossref); passages + hashes kept. REGISTER entries proposed, not filed.

## 10 Nov 03:39 UTC (clock reading at write) — **Big Five source check RUN: chart + all five episodes PASS under §11a** (research only) — `docs/research/TIMELINE-BIG-FIVE-SOURCE-CHECK.md`; packet on the Mac `research/timeline-big-five/2026-11-10-claude/`
- 03:27:47–03:39:11Z (Mac clock), 11 min 24 s of the 3 h cap; browser pane, text only (Europe PMC XML, Crossref, stratigraphy.org, jsDelivr). Chad granted pane access to stratigraphy.org.
- **C0:** ICS chart CC BY 4.0, data tag 2026-06.5 pinned by file hash. **E1–E5:** one CC BY source each with a timing passage; Crossref shows no update notices.
- **Findings:** no numerically dated pulses (fixture test needed); chart and sources differ at every boundary (shown, not reconciled); E3 has two flags (secondary statement of a CC BY-NC-ND result; licence version unstated); E5 cause contested (impact vs Deccan as attributed claims); E2 covers the Frasnian–Famennian event only.
- **Not done:** publisher landing pages (before release); REGISTER entries proposed, not filed. **For GPT's review.**

## 10 Nov 03:27 UTC (clock reading at write) — **Chad decided the Timeline deep-time proposal (D1–D7) and gave the go for the Big Five source check** (research only)
- Chad: "D1–D4 and D6 as written, D5 show all four lanes, D7 3 h incl. write-up, text only. Go: Big Five source check per §11a." Packet will be on the Mac at `research/timeline-big-five/2026-11-10-claude/` (protocol fixed and hashed before any request; append-only LOG; repo gets IDs, hashes and dispositions only).

## 10 Nov 03:18 UTC (clock reading at write) — **Timeline deep-time proposal: GPT accepted rev 1.2 for concept approval; rev 1.3 wording** (docs only)
- All four lanes visible (Chad's D5). Applied GPT's points: §10 build target ≤ 96 CSS px for the three empty rows at 390 × 844 (pending measurement; wrap and grow at larger text, no clipping); zero Tab stops for empty rows; short phone text, explanation once in the coverage note; Human history "No dated entries on the axis yet".
- **Open:** Chad's decision line and the source-check go.

## 10 Nov 03:15 UTC (clock reading at write) — **Timeline deep-time proposal rev 1.2: Chad decided D5 = show all four lanes** (docs only)
- Lanes with no entries collapse to a thin labelled row, "No entries yet — this lane fills as its evidence is checked"; nothing unchecked is drawn; each lane fills only through its own slice and source check (§3a). Answers GPT's phone-space concern. **For GPT's review.** Other decisions and the source-check go still open.

## 10 Nov 03:02 UTC (clock reading at write) — **Timeline deep-time proposal ACCEPTED by GPT as a concept; rev 1.1** (docs only)
- GPT (read the Mac copy, relayed by Chad) recommends D1–D4 and D6 as written, **D5 hide empty axis lanes**, D7 3 h incl. write-up, text only. Added §11a (source-check pass rules: readable passage for the timing shown, source version and status, terms evidence; unresolved at the cap stays unresolved; chart never supplies a missing event date; pulses tested with a fixture if unsupported) and §11b (before a build: approximate and one-sided ages, version-mismatch fallback with the previous catalogue kept, fresh R2 headroom read).
- **Chad's decision line and the source-check go are still separate.**

## 10 Nov 02:58 UTC (clock reading at write) — **Timeline deep-time proposal rev 1** (docs only) — `docs/concepts/TIMELINE-DEEP-TIME-PROPOSAL.md`
- From Chad's vision (a real timeline across deep time: mass extinctions, life over time, human relatives, human history) and GPT's review of Claude's brief.
- First slice: **the Big Five mass extinctions** on a Phanerozoic zoom window with a full-span overview; the ICS chart supplies the clock, the extinction literature the events; boundary / interval / pulses / partial date kept distinct; no percentage-loss figures; Pliny stays on the shelf.
- **Ends the T1 exception** in the same release: a versioned catalogue on the hub (Arts pattern), with the no-JS list generated from the same pinned revision.
- Decisions D1–D7 for Chad. **Nothing researched, built or approved.** Housekeeping: `timeline-rc` deleted on GitHub by Chad; Mac `_review/` folders moved to `_to_delete/_review/`.

## 10 Nov 02:43 UTC (clock reading at write) — **REGISTER: Ozone Watch and CNEOS entries FILED** (Chad's two Approve lines, after GPT accepted the provider records)
- **Ozone Watch:** R6 §9.6 rev 6.1, scoped to `to3areas_2026_toms+omi+omps.txt` and `to3mins_2026_toms+omi+omps.txt` only (public domain per provider; credit line; one retrieval per file per day; no bulk pulls; best-effort availability).
- **CNEOS:** R2 §4 rev 3.1 ("for this purpose with the citation"; API under 1 request/10 min; S1 applicability a contextual reading). **Commercial use, lightcurve scope and lightcurve retrieval stay open.**
- Both research only: no building, collector, page or production change.

## 10 Nov 02:41 UTC (clock reading at write) — **GPT accepted the provider records; editorial fixes; GPT's live Timeline smoke test recorded** (docs only)
- **GPT accepted** ENQUIRIES rev 8, R6 rev 6 and R2 rev 3 (Mac copies) as provider evidence records. Editorial fixes applied: R6 §9.6 draft heading names the exact two 2026 files (no clearance for future years); the rev 5 note labelled historical; modification notice = our own practice. R2 heading and REGISTER cross-reference → rev 3; S1 applicability kept as a contextual reading; commercial use, lightcurve scope and lightcurve retrieval stay open. **Both drafts NOT filed** — Chad's separate Approve line each.
- **GPT's live smoke test of the Timeline release (main `4b23518`, hub 0.6.2; relayed by Chad):** at desktop and 390 × 844, moving between Earth now, Timeline and Sources worked, as did Back, Forward and focus return. The withdrawal disclosure showed on the card and before the October claim in the note. Phone header and modal sheet: no horizontal overflow.
  - The initial globe check showed no earthquake snapshot; on the follow-up the same live page loaded 48 earthquakes, plus ships, Kp and CO₂. Cause of the first miss not established.
  - Fires stayed Unknown: the 02:15 UTC run got the header-only FIRMS file after the daily reset, and the page withheld the previous run's records (the observation already recorded at 02:23 UTC). The first new-day fire batch was not verified in GPT's check.
  - **Still open:** real iPhone Safari (Chad).

## 10 Nov 02:37 UTC (clock reading at write) — **Provider replies recorded: NASA Ozone Watch (R6) and CNEOS (R2)** (docs only; Chad's go) — `docs/research/ENQUIRIES-2026-11.md` rev 8, `R6-ozone.md` rev 6, `R2-terms-access.md` rev 3
- **Ozone Watch** (Leslie R. Lait, NASA, ARC-SG, Code 614, Goddard Space Flight Center; Paul A. Newman copied, per Chad; Gmail-displayed 9 Nov, 10:45 PM): the two named 2026 files (`to3areas_`, `to3mins_`) are **public domain as U.S. Government products; no licence or permission applies** (the question named public redistribution and commercial use); no third-party rights or extra conditions; suggested credit "Data are courtesy of the NASA Ozone Watch website ( https://ozonewatch.gsfc.nasa.gov)"; **one automated retrieval per file per day fine**. Carried forward: no bulk pulls; as-is, best-effort availability (a shutdown could stop updates). Bounded to those two 2026 files. R6 technical gates open; no building clearance.
- **CNEOS** (Shantanu P. Naidu, JPL; Gmail-displayed 9 Nov, 10:43 PM): "You are free to use the data for this purpose with the citation." — preserved alongside the exact sent enquiry. API cadence: **stated preference of fewer than one request every 10 minutes**; the catalogue changes roughly monthly. **Open pending the follow-up:** explicit commercial-use confirmation, lightcurve reuse scope, automated lightcurve retrieval guidance.
- Times are Gmail-displayed, no timezone assigned. Screenshots, email addresses, phone numbers and the office address are not in the repo; Gmail's summary feature not used.
- **REGISTER drafts updated in R6 §9.6 and R2 §4, NOT filed.** Next: GPT's review (paths only); filing only on Chad's separate Approve line afterwards. No production change.

## 10 Nov 02:23 UTC — **Fires card UNKNOWN after midnight: expected FIRMS daily reset, no fault** (read-only; Chad asked; D1 via connector, hub + page via pane)
- Every firms run since 00:00 UTC (00:00–02:15, 10 runs) got today's header-only file: `down`, note "no detections processed yet for today (UTC) … (header only)". Last full file 9 Nov 23:45 UTC: **61,660 records**, 5.15 MB.
- First rows of the day over 4–9 Nov: 04:15 · 03:45 · 02:16 · 03:45 · 03:00 · 03:30 UTC.
- Page (live): fires card **UNKNOWN**, count "–", the header-only reason shown, and **"Records withheld: records are from a different collector run (records 23:45 UTC, counts 02:15 UTC)"** — the pair rule working as designed. `/snapshot/firms` 200 (the 23:45 publication, retained); `/health/publication/firms` and `/health/runs/firms` 200 ok.
- **Observation:** "collector reported down" reads as breakage for an expected daily state. A wording change would be a page change (own proposal + Approve). Nothing changed.
- **Thread handover** written (HANDOVER "NEXT THREAD STARTS HERE", 10 Nov).

# 9 Nov 2026

## 9 Nov 16:33:11 UTC (commit time) — **PAGE RELEASED: Timeline page (first entry, Pliny *Letters* 6.16) + Earth now · Timeline header tabs** (main `4b23518`, no-ff merge of `timeline-rc` @ `9dce186`; Chad: "Approve: push timeline-rc @ 9dce186 to main (page change: Timeline page + Earth now · Timeline header tabs)")
- **Served hashes verified 16:36:27 UTC** (browser pane, no-store, Chad's screen locked): all seven page files HTTP 200 and = the reviewed values — index `d826964ae313`, sources `8fbadc9048b3`, timeline `1c9770492c27`, app `e3f4a3854113`, arts `58773cef35e6`, timeline.js `66b5e0320e83`, style `20a8bce94ada`; assets `?v=202611181000`. **Seven page files now.**
- **Live read 16:36:41 UTC (pane, phone-width):** card "24 August (Julian) · year unstated" and "Date note · withdrawn abstract"; title opens the sheet (dialog), focus on the heading, `#e-pliny-ep-6-16`; Back closes, clears the fragment, focus on the title; Timeline tab current.
- **Announcement (Chad's wording):** we've added the first Timeline entry, based on Pliny's account of the cloud noticed at Misenum; a date note cites a 2021 EGU conference abstract describing a proposed October date, and that abstract was withdrawn on 8 March 2021.
- **Constitution exception in force (T1):** the Timeline entry is page-only (pre-rendered, no hub route); reviewed before a second entry or an axis (START-HERE §2).
- **Still to do (Chad present):** real-site smoke test on desktop and phone — globe with the new header, moving between Earth now / Timeline / Sources, the Pliny entry, Back. Real iPhone Safari check.
- **Rollback (own Approve line):** revert `4b23518` on main; no hub, R2 or D1 involved. Branch `timeline-rc` can be deleted on GitHub (Chad).

## 9 Nov 16:26 UTC (clock reading at write) — **Timeline candidate `9dce186`: withdrawn abstract shown (Chad's (a)); R1 closed; R2 preview PASS** (branch only; release awaits line B)
- **R1:** Chad pasted the publisher pages: EGU21-16222 is **CC BY 4.0**, and was **withdrawn by its authors on 8 Mar 2021** (new finding; filed verbatim in REGISTER on the branch). Chad chose (a): the card reads "Date note · withdrawn abstract"; the note opens with "2021 EGU conference abstract, withdrawn on 8 March 2021." before the October proposal (also without JS); provenance of the copy read (OpenAlex, 14:03:45 UTC) kept. timeline-ui 584/0; break `no-withdrawal` fails; desktop-overflow 112/0; mobile-pass 131/0.
- **R2 non-public preview (16:24–16:26 UTC, browser pane, Chad present; files from raw.githubusercontent at `9dce186`, sha256 checked, blob-injected into clean github.io tabs; live site untouched):**
  - timeline.html at phone width: "Date note · withdrawn abstract" opens the sheet (dialog, modal, background inert) with the withdrawal line first; browser Back closes it, focus on that shortcut, inert/scroll lock released.
  - at 1280: title open, then (Julian) while open → history length unchanged, state updated; one Back closes the panel, focus on (Julian). No console errors.
  - index.html against the **live hub**: live readings at 1280 (header 56 px, tabs, Earth now current, `#card-usgs` 8px 10px with its own border) and 390 (header 94 px, Menu and tabs 44 px, no overflow). No console errors.
  - Limits: cross-page tab navigation goes to the live pages (the Timeline page is not live yet), so moving between pages is checked after release; the pane is not a real phone.
- **Dry-run merge with main: no overlap; merged page files = the candidate hashes.** Release = Chad's line B.

## 9 Nov 16:01 UTC (clock reading at write) — **timeline-rc rev 2 @ `c3498bc`: GPT's two smoke findings fixed; phone header 94 px** (branch only; packet rev 2 at `412b8a8`)
- GPT smoke-tested `31fab7d` on Chad's localhost server (Terminal, `_review/timeline-rc/`) and confirmed two findings:
  1. title → (Julian) while open pushed a second history entry (one Back only collapsed the conversion). **Fixed:** a switch updates the open history entry; focus returns to the most recently used card control. New tests incl. direct link + shortcut; break `switch-pushes` 102 fail.
  2. Timeline `.card` rules restyled the globe's Readings cards (`#card-usgs` 12px 14px, strong border; main 8px 10px). **Fixed:** all Timeline CSS scoped under `body.tl`; test + break `unscoped-card`.
- **Phone header:** two-row grid, 44 px targets, 2 px gap/padding → **94 px** (rev 1 104 px). Overlay check at 390×844, everything on, Readings open: **7.2%** (rev 1 8.3%, main 5.4%, target ≤ 8%); mobile-pass 131/0. Also fixed: rev 1's wrapping header pushed the title above the header at 390 px with fallback fonts.
- **Tests:** timeline-ui 578/0; 11 breaks each fail (a stale break anchor found and fixed); all 35 regression suites pass. Asset `?v=202611181000`.
- **Shared copy refreshed** (`_review/timeline-rc/` = `c3498bc`, new SHA256SUMS; rev 1 kept at `_review/timeline-rc-31fab7d/`). Chad restarts the localhost server for GPT's re-check.
- Still before release B: GPT's re-check, R1, R2 (separate), Chad's release line.

## 9 Nov 15:20 UTC (clock reading at write) — **Timeline candidate BUILT on branch `timeline-rc` @ `31fab7d`** (Chad's Approve line A; NOT merged, NOT served; no hub, R2 or D1 change) — packet `reviews/2026-11-09-timeline-rc.md` (on the branch)
- **Built:** `timeline.html` (entry pre-rendered from `phase1/timeline/entry-pliny-ep-6-16.json` by `build_timeline.py`), `timeline.js` (panel/sheet, history and focus; 9,021 B, over the 8 KB target), header tabs Earth now · Timeline on index and sources, REGISTER rows (EGU licence pending publisher verification, R1).
- **Read-only checks (pane):** Wikidata 14:47:26–28 UTC — Misenum Q19900818, Vesuvius Q524, Pliny the Younger Q168707, *Epistulae* Q2099521 (all resolved). Latin Library 14:47:44 UTC — page hash unchanged (`b59e819a…`), **no anchors**, so no jump link.
- **Tests:** timeline-ui **426/0**; nine breaks each fail; all other suites pass except **mobile-pass 130/1**: at 390×844 with everything on and Readings open, overlays cover **8.3% of the globe disc vs 5.4% on main** (the phone tab row makes the header 56 → 104 px). Open decision (a/b/c in the packet §4); not changed. Fixed during the build: 1101 px fallback-font header clip, a `.sheet` class clash, direct-link focus, same-page fragments.
- **For GPT (R4):** packet + smoke-test routes; a hash-checked review copy is in the Mac folder `_review/timeline-rc/` (serve it with `python3 -m http.server`).
- **Still before release B:** GPT review, R1 (publisher licence pasted into REGISTER), R2 non-public preview against the live hub (Chad present), the finding-2 decision. **Not approved:** merge, release, nav change on the public site.

## 9 Nov 14:44 UTC (clock reading at write) — **Timeline entry build proposal rev 2 after GPT's review** (docs only)
- GPT: direction good; four points, all applied in `docs/concepts/TIMELINE-ENTRY-BUILD-PROPOSAL.md` rev 2:
  1. **Back/focus:** one shareable fragment `#e-pliny-ep-6-16`; shortcut expander in history state; Back/Forward return focus to the exact opener; direct link focuses the detail heading; explicit Close clears the fragment and focuses the card title (fallback `<h1>`); Back after a direct link goes to the real previous page (tested with a genuine prior entry); 721–1100 px layout and the phone sheet's modal keyboard/focus behaviour specified.
  2. **Date and attribution:** 24 August = our conversion of the checked reading (1 September = day one), shelf only; Misenum attributed to Pliny, Bay of Naples = our present-day reference; seasonal hour = our model, clock time unset; §22 caveat; S3 authors and DOI named; one historical account.
  3. **Source link / no-JS:** Book 6 page with Letter 6.16 and §§4–5, 22 beside it; no jump promised unless a working fragment is verified; date, hash, conversion and debate in static HTML; the hash identifies the checked copy, the live page can change; no inline Latin.
  4. **Release gate:** EGU licence = CC BY as reported by OpenAlex, publisher verification a release condition (R1); non-public pinned-candidate preview (R2); actual header diff in the pre-release review (R3); GPT candidate review (R4).
- Recommended (GPT and Claude): T1 page-only, exception reviewed before a second entry or an axis; T2 English only; T3 omit search; T4 four named entities only, unresolved recorded (Chad's call); T5 page and tabs together.
- **Not approved:** branch build (line A), live page/navigation release (line B). Opening-page/Met audit separate; completed research stays closed.

## 9 Nov 14:30 UTC (clock reading at write) — **Timeline entry BUILD PROPOSAL rev 1** (docs only) — `docs/concepts/TIMELINE-ENTRY-BUILD-PROPOSAL.md`
- One entry (Pliny, *Letters* 6.16) from UX rev 2. Pins S1 (Latin Library page sha256 `b59e819a…e281`, retrieved 14:00:36 UTC) and S3 (EGU21-16222, attributed) from the Mac packet; packet re-checked 14:28 UTC (4 files exact; LOG = hashed original + appended closure line).
- Carry-forward specified: source link with the checked copy's date and hash and a "may have changed" line; Back/focus for card-opened and direct-link paths, tested at 1280 and 390 px.
- Decisions T1–T5 for Chad: **T1 page-only (recommended, a bounded dated deviation from "the page is a client") vs the Arts hub pattern**; T2 English-only conversion rule; T3 no search box; T4 Wikidata IDs looked up during build; T5 release order.
- Approve lines in §10: A = build on branch `timeline-rc` only; B = push to main with the header tabs (the live nav change).
- **Not approved:** build, nav change, REGISTER filing, any production action.

## 9 Nov 14:26 UTC (clock reading at write) — **Timeline UX rev 2 ACCEPTED as design direction (GPT + Chad); thread handover** (docs only)
- **Accepted:** the partial-date shelf, one-action evidence controls and no-JavaScript fallback are specified.
- **Carry forward into the build proposal** (recorded at the top of the UX doc):
  1. "Read the passage" goes straight to the source while inline quotation awaits clearance; the retrieval hash identifies the checked copy, and the live link may serve a different copy later.
  2. Test Back and keyboard focus both ways: from a card (focus returns to the opener) and from a direct entry link (its own close and focus behaviour).
- **Handover:** HANDOVER "NEXT THREAD STARTS HERE" rewritten (next task = **build proposal for one Timeline entry**; implementation and live nav each need their own approval; the opening-page/Met audit stays separate). START-HERE §4j added (routes, approvals, packet pattern).
- Production unchanged all thread (hub 0.6.2, page `6d5ca55`).

## 9 Nov 14:23 UTC (clock reading at write) — **Test B closure verified; Timeline UX proposal rev 2** (docs only)
- **Chad verified** the four original non-log Test B files and the appended closure entry. Test B is closed: 4 supported + 1 absence finding, §22 caveat intact.
- **UX rev 2** (`docs/concepts/TIMELINE-PAGE-UX-PROPOSAL.md`). The core is kept; three points tightened:
  1. **Interaction (§5a):** the title opens the entry; the three evidence items are one action each; card shortcuts ("(Julian)", "⚑ Date debated") are separate controls; closing returns focus to the opener; the entry has its own anchor; Back closes first.
  2. **No-JS fallback (§7a):** entries are pre-rendered in the Timeline page's HTML, with a working source link and in-page anchors; data loads only on the Timeline page.
  3. **Source access vs quotation (§5b):** a direct source link by default; inline Latin only after clearance in REGISTER; evidence labelled "**one historical account**", with the scholarly date note separate.
  - New decisions U7, U8.
- **Not approved:** build, live navigation change. The opening-page/Met audit stays separate.

## 9 Nov 14:19 UTC (clock reading at write) — **Test B CLOSED (GPT) + corrections; Timeline page UX PROPOSAL** (docs only)
- **GPT accepted Test B as a one-entry text mock-up:**
  - 5 hashes matched; the Latin Library passage was checked directly;
  - the scholarly wording was confirmed on an author-hosted copy;
  - the conference page and the Perseus route were not independently verified.
- **Corrections** (`research/timeline-test-b/2026-11-09-claude/rev2/CORRECTIONS-rev2.md`):
  - **4 supported + 1 absence finding** (year not stated);
  - 24 August stays our conversion; the dispute is attributed separately; the clock time is unset;
  - attribution "Pliny reports that his mother pointed out the cloud", per §22, where Pliny combines what he witnessed with what he heard soon afterwards without marking which detail is which.
- **UX proposal rev 1** (`docs/concepts/TIMELINE-PAGE-UX-PROPOSAL.md`):
  - top tabs **Earth now | Timeline**;
  - a "**Dates without a year**" shelf, so the entry is not placed at 79 CE;
  - the card shows "24 August (Julian) · year unstated";
  - a desktop right panel / phone bottom sheet with three one-step expanders: passage · conversion rule · attributed debate;
  - desktop and phone wireframes; U1–U6 for review.
  - Separate from the opening-page/Met audit.
- **Not approved:** any build or navigation change.

## 9 Nov 14:00:17–14:04:40 UTC (Mac clock) — **Timeline Test B RUN** (research only; Chad's go on rev 2) — packet `research/timeline-test-b/2026-11-09-claude/` on the Mac
- **Latin gate passed** in under a minute. S1 = The Latin Library, Pliny Letters Book 6 (HTTP 200, sha256 `b59e819a…`); **edition not stated by the host**. Perseus (CC BY-SA 3.0 US) has the same reading and also no edition named.
- **Translation not reached** → Latin only. **S3:** one open-access EGU 2021 conference abstract (CC BY, via OpenAlex), read in its 5-min window: the date is debated (24 Aug classical reading vs a 24 Oct hypothesis; probable medieval copying error).
- **B1–B5: 5 supported.**
  - B1 = 24 August, a Julian conversion of the page's reading «Nonum Kal. Septembres», by a stated rule; date of the **reported notice** (by his mother), not "first sighting".
  - **B2 year not stated.**
  - B3 «hora fere septima» kept; **no modern clock range** (gap).
  - B4 Misenum.
  - B5 Vesuvius "learned later".
- **Mock entry:** every field ends in an S1 passage, a method note or a visible gap; it separates others reported / Pliny's own recollection / learned later; the date doubt is attributed to S3.
- 4 min 23 s of the 45-min cap. **For GPT:** `research/timeline-test-b/2026-11-09-claude/report/REPORT.md` (+ CLAIMS, sources/, LOG, `.hashes`).
- **Not approved:** a page/tab build, any production action, further tests.

## 9 Nov 13:56 UTC (clock reading at write) — **GPT confirmed List A closure; Test B proposal rev 2** (docs only)
- **GPT:** the original OA report is byte-identical, the closure entry is appended to the log; **List A closed**.
- **Test B proposal rev 2** (`docs/concepts/TIMELINE-TEST-B-PROPOSAL.md`):
  - B1 = date of the **reported sighting/notice** of the cloud: pinned Latin edition, exact wording, stated inclusive-counting rule, result labelled as a conversion of that edition's reading; year unset;
  - Roman hour kept as written, with a modern range only if its assumptions are established;
  - mock entry separates Pliny's own recollection / others reported / learned later, and every field traces to a passage, a conversion or a visible gap;
  - **the Latin text is the only readability gate** (≤ 10 min; unreadable → inconclusive); the translation is optional;
  - one scholarly date check ≤ 5 min (else "not assessed"); 6.20 out; 45 min.
- **Not approved:** the Test B run (Chad's go).

## 9 Nov 13:45 UTC (clock reading at write) — **List A CLOSED (GPT) + corrections; Test B PROPOSAL** (docs only)
- **GPT checked the OA report and log** (hashes matched): List A closed — 6 works identified, 1 new abstract, 0 claims resolved, tallies unchanged.
- **Corrections** (`research/timeline-test-a-oa/2026-11-09-claude/rev2/CORRECTIONS-rev2.md`):
  - the cap was **not reached** (search 8 min 41 s; write-up end 9 min 7 s; remaining listings unattempted);
  - HAL was queried before IA Scholar (order deviation);
  - A1 ANU fetch failed, kept separate from the A2 ANU listing (not tried).
- The Debénath PDF stayed unopened; whether it would resolve a Salé claim is unknown.
- **Test B proposal rev 1** (`docs/concepts/TIMELINE-TEST-B-PROPOSAL.md`):
  - one case: **Vesuvius, Pliny the Younger, Letters 6.16**;
  - S1 a public-domain Latin text (evidence) + S2 a public-domain translation (display only);
  - 5 claims (date, year not stated, hour, Misenum, the "later identified" mountain);
  - a sample entry separating the source's wording / our inference / uncertainty.
  - **Readability flagged** (no written-history source yet known readable); stop rule; 45 min. T1–T6 are Chad's.
- **Not approved:** the Test B run.

## 9 Nov 13:30:33–13:39:40 UTC (Mac clock) — **Test A open-access pass, List A RUN** (research only; Chad's go on OA proposal rev 2) — packet `research/timeline-test-a-oa/2026-11-09-claude/` on the Mac
- **All six exact works found** via OpenAlex (A1–A4, A6 by DOI; A5 by exact title).
- **New readable text: one abstract.** A5 Debénath et al. 1982 is on **HAL halshs-00005580** (open; full text **PDF only, unopened**); the HAL abstract does **not name Salé**.
- **Claim-resolving passages: none.** Tallies unchanged: **7/7/10/7** (primary) and **7/8/9/7** (with Bräuer).
- **Routes:**
  - Internet Archive Scholar returned a proof-of-work "verifying your session" page → **skipped**;
  - ANU fetch error;
  - Griffith metadata-only, no files;
  - other A2 repository listings not checked (cap);
  - reroDoc PDF for A1 recorded unopened.
- **Identity detail:** A5 = CR Acad. Sci. **Série II, tome 294** (per HAL); third author Pierre-Jean (HAL) vs Jean-Pierre (enwiki) Texier, unresolved.
- **The one lawful open copy of a missing work is a PDF**; under H8b no, it stays unread.
- 9 min 7 s of the 30-min cap. **Next:** GPT's read of `report/REPORT.md`; then Chad's Test B proposal/go (one case with already-readable written source text). Nothing started.

## 9 Nov 13:23 UTC (clock reading at write) — **GPT accepted retry rev 2; OA proposal trimmed to rev 2** (docs only)
- **Retry rev 2 accepted.** The Bräuer abstract check is kept separate:
  - **primary-source tally 7 / 7 / 10 / 7**;
  - **with the secondary abstract-only check: 7 / 8 / 9 / 7**;
  - the Salé chapter is still unchecked.
- **OA proposal rev 2** (`docs/concepts/TIMELINE-TEST-A-OA-SEARCH-PROPOSAL.md`):
  - **one 30-min pass incl. write-up, List A only** (A1–A5 + A6 Bräuer separate);
  - full Debénath 1982 citation recorded verbatim (enwiki rev 1360734129, from the Test A fetch);
  - route order OpenAlex → IA Scholar → HAL → a listed repository/author page; skip anything unavailable or credentialed;
  - text only, PDF-only copies recorded unopened;
  - results in three stages: exact work found / readable text reached / a passage that resolves a claim.
  - **List B parked.**
- **Next (each its own go):** the 30-min pass; then one Test B case with already-readable source text (Chad's preference). Nothing started.

## 9 Nov 13:14 UTC (clock reading at write; corrected from a mistyped 13:28) — **Retry rev 2 (wording) + OA-search PROPOSAL** (docs only)
- **GPT read the retry packet** (three hashes matched).
- **Retry rev 2** (`research/timeline-test-a-retry/2026-11-09-claude/rev2/RETRY-REPORT-rev2.md`):
  - conclusion = **no improvement in access to primary reports through the routes tried**;
  - per-site facts kept (Nature still subscription content after sign-in; ScienceDirect 403 before sign-in; De Gruyter empty 202, login skipped; Springer abstract in an already signed-in session, cause not isolable);
  - the "binding constraint" claim is **withdrawn**.
  - SALE-F4 is labelled "not stated in the inspected abstract; chapter unchecked" (one more partial check; no new evidence on the classification). Its rule basis is flagged for GPT (a review as an attributed-classification source rests on rev 2's treatment; it reverts if judged outside `ta-v1`).
- **Proposal** `docs/concepts/TIMELINE-TEST-A-OA-SEARCH-PROPOSAL.md` (rev 1):
  - same 5 finds and 31 claims;
  - **list A**: lawful copies of the 6 identified sources by exact DOI/title;
  - **list B**: exact-specimen evidence leads, coded separately;
  - routes OpenAlex, Europe PMC, IA Scholar, HAL; CORE and Unpaywall excluded (account key / email);
  - text only (PDF-only copies recorded, not opened); 90 min cap;
  - decisions O1–O5 are Chad's.
- **Not approved:** the search, PDFs, Test B, any production action.

## 9 Nov 13:00:44–13:06:23 UTC (Mac clock) — **Test A access retry RUN** (research only; Chad: "Approve: Test A access retry — text-only, same finds and claims, Chad signs in") — packet `research/timeline-test-a-retry/2026-11-09-claude/` on the Mac
- **Protocol `ta-r1`** fixed before any request (sha256 `f9f41126…`). Same 5 finds, 31 claims, rules. **Chad created and signed in to accounts himself**; Claude typed no credentials. No purchase, PDF, image or bypass.
- **Routes:**
  - **Nature:** a session alone turned the redirect into HTTP 200, but still subscription content (abstracts only). Signing in changed nothing. Extended-data tables are JPEG images (outside bound).
  - **ScienceDirect:** home page HTTP 403 in the pane, so no sign-in was possible.
  - **De Gruyter:** still 202 empty (login skipped by Chad).
  - **Springer:** HTTP 200 with the Bräuer abstract; already signed in via the shared Springer Nature account, so session and login effects could not be separated.
- **Primary reports unchanged:** 1 full · 2 abstracts · 1 title · 2 none. Bräuer: none → abstract.
- **One re-code:** SALE-F4 inaccessible → unsupported (not stated in the Bräuer abstract). Tally **7 · 8 · 9 · 7** (checked 15); the six ages unchanged.
- **Finding:** the binding constraint is subscription access, which is out of scope (no purchases). Free logins did not open text.
- **For GPT:** `research/timeline-test-a-retry/2026-11-09-claude/report/RETRY-REPORT.md` (+ LOG, protocol, `.hashes`).
- **Not approved:** purchases, Test B, build, production. Next is Chad's call: Test B, a different source strategy, or park.

## 9 Nov 12:53:35 UTC (Mac clock, LOG) — **GPT ACCEPTED Test A rev 2** (docs only)
- Accepted as the **corrected record of a partial diagnostic**.
- **GPT verified:**
  - the six rev 2 files against their hashes;
  - the eight original non-log files byte-identical; the log gained one entry;
  - the three recodes reconcile to 7 supported · 7 unsupported · 10 inaccessible · 7 unreferenced;
  - the 13-entry source inventory is reported separately;
  - the selection pass is explicitly conditional on the contextual reading;
  - the 234-row screen remains Claude-reported.
- `64a8a81` and the sync are Claude-reported.
- **Formatting fix after acceptance (GPT's request):** literal pipes in source-unit IDs escaped in table rows (SOURCE-UNITS-rev2: 39, CLAIMS-rev2: 3). No content change. Accepted hashes kept in `rev2/.rev2-hashes-accepted`; new ones in `rev2/.rev2-hashes`.
- **Next is Chad's choice:** a separately approved **text-only access retry** (his logins) on the same finds and claims, recording which routes actually improve; whether logging in resolves any block is open. Then Test B or park. **Nothing started.**

## 9 Nov 12:31:48 UTC (Mac clock, LOG) — **Test A rev 2 after GPT's review** (docs only; existing evidence; no rerun or new reads) — `research/timeline-test-a/2026-11-09-claude/rev2/` on the Mac
- **GPT verified:** all 9 file hashes (protocol included); the seeded ranking reproduced from the 8 recorded row IDs; the original tally 9 · 7 · 8 · 7. The full 234-row screen and script were not retained, so the eligibility screen remains Claude's reported result.
- **Rev 2:**
  1. **Selection: pass under the applied contextual reading.** The header supplies the units; a present reference is **not** established by the header. The literal cell-only reading (0 eligible) is kept visible.
  2. **31 list-row assertions inventoried; 16 checked (original) / 14 (corrected).** Corrected tally: supported **7** · unsupported **7** (all not stated) · inaccessible **10** · no reference **7**. Rows changed: LH18-F2 and F4 → inaccessible; JI-F4 → unsupported.
     - Six ages: supported 1 · unsupported in inspected evidence 2 · inaccessible 1 · unreferenced 2.
     - Source-derived inventory partial, **13 units with stable IDs**: the Omo cited value, Vidal's recalculation and its inference kept separate; the JI new-remains classification separate from Irhoud 1–5.
  3. **Access reconciled:** six primary reports = 1 full text · 2 abstracts · 1 title only · 2 none (Bräuer review separate). Route causes (login/key/paywall) withdrawn; only observed outcomes are kept. **Elapsed 11 min 42 s.**
- Frozen originals unchanged (8/8 hash-match; LOG.md append-only). Rev 2 hashes in `rev2/.rev2-hashes`.
- **Next:** GPT's sign-off (paths only). Then Chad's separately approved **text-only retry with his logins** on the same finds and claims (blocked sources only), before any Test B decision. **Nothing started.**

## 9 Nov 12:12:00–12:23:42 UTC (Mac clock) — **Timeline Test A (human evolution) RUN** (research only; Chad: "go Test A run") — packet `research/timeline-test-a/2026-11-09-claude/` on the Mac (not in the repo)
- **Protocol `ta-v1`** fixed 12:12:20Z before any request (sha256 `39d27916…`); parameters H1–H8 as recommended, H3b (i), H8b no; strictly text-only, no account or login.
- **Selection: PASS** (~2 min). Frame: enwiki "List of human evolution fossils" **revid 1379856573**; 234 rows screened, 13 meet Africa + H. sapiens, **8 eligible**, ranked by `SHA-256("20261109|HA|"+row id)` → **Omo remains, Salé cranium, EH 06, LH 18, Jebel Irhoud 1–5**. **Interpretation point for GPT:** the units are in the column headers ("Age (ka)/(Ma)"); the strict-wording alternative gives 0 eligible.
- **31 row claims:** supported **9** (all qualifying) · unsupported **7** (not stated 6, precision 1, contradicted 0) · inaccessible **8** · no reference given **7** · not checked 0. **Ages: 1 of 6 values supported.**
- **Main findings:**
  - **Omo:** the list's "233±22" is a **minimum age** (2σ eruption age of an overlying ash) in the 2022 source, not the fossils' age.
  - **Jebel Irhoud:** the list's "315±32" is **not stated** by the source abstract, which gives 315 ± 34 ka (TL, artefacts) and 286 ± 32 ka (US-ESR, Irhoud 3 tooth).
  - **EH 06** has no reference at all. Definitions (material, target, relationship) were recoverable from every reached text.
- **Access:** 1 of 6 identified primary reports readable in full (Europe PMC); 2 abstracts; 1 title only; publisher routes redirected, returned 202/403, or need an account. **Chad offered logins mid-run; declined for this run** (protocol). A logged-in run would be a separate decision.
- **Outcomes:** selection pass · inventory partial · access partial · method pass within scope. 11 min of the 3 h cap.
- Pane site approvals by Chad this run: en.wikipedia.org, ebi.ac.uk, degruyterbrill.com, link.springer.com, sciencedirect.com, nature.com.
- **For GPT:** `research/timeline-test-a/2026-11-09-claude/report/REPORT.md` (+ DISCOVERY, finds/, LOG, `.hashes`). Report sha256 `cac7a66b5774c1e7…`.
- **Not approved / not done:** logins, PDFs, images, bypasses, REGISTER, prototype, page/tabs, production, Test B, any timeline scope selection.

## 9 Nov 12:10 UTC (clock reading at write) — **Chad set the Test A parameters** (docs only)
- Chad: "its a go from me" on the line "H1–H8 as recommended, H3b (i), H8b no. Parameters only." Recorded in POC rev 4 §11.
- **Parameters only.** The Test A run (3 h cap, 30-min selection sub-cap) is **not started** and needs Chad's separate go.

## 9 Nov 12:06 UTC (clock reading at write) — **GPT ACCEPTED POC rev 4 and Wikipedia pilot rev 2.1** (docs only)
- **POC rev 4: accepted as a proposal.** H3b separates known one-sided bounds from unknown-basis ages; the 30-min stop works as intended (unfinished screening/ranking = incomplete and inconclusive, even with ≥ 3 eligible).
- **Pilot rev 2.1: accepted** as the corrected record of a partial diagnostic: G-P2 restored, the 9-unit totals reconcile, four captures inspected vs three readable texts distinguished. GPT verified the frozen originals and the append-only log directly in the Mac folder; commit `efba832` and the repo sync are Claude's verification.
- R2 fireballs rev 2 accepted for bounded research; REGISTER draft unfiled. The opening-page / Met / top-tabs audit stays separate.
- **GPT's pick: H3b (i), H8b no** (one-sided bounds kept visible in the report, excluded from this first sample; strictly text-only). A reviewer recommendation, **not Chad's decision**.
- **Next:** Chad's parameter line; **no run without a separate go.** No research, rerun, build or production action approved.

## 9 Nov 12:00 UTC (clock reading at write) — **POC rev 4 + Wikipedia pilot rev 2.1 (GPT's direct review of both Mac copies); R2 fireballs terms rev 2 recorded as accepted** (docs only)
- **POC rev 4** (`docs/concepts/TIMELINE-POC-HUMAN-PROPOSAL.md`): GPT closed the image/PDF, axis and scientific-comparability points. Two fixes:
  1. **H3b:** the one-sided rule is its own decision. A known minimum-only ≤ 350 ka or maximum-only ≥ 100 ka bound is now its own outcome, "one-sided overlapping", kept separate from "unknown basis". Recommendation (i) not eligible, listed with the bound; option (ii) eligible, flagged, with no filled endpoint.
  2. **Selection:** if screening or ranking is unfinished at 30 min (inside the 3 h), selection is reported **incomplete and inconclusive even if ≥ 3 eligible finds have surfaced** (§4, §10, H5).
- **Pilot rev 2.1** (Mac, `research/timeline-wikipedia-pilot/2026-11-09-claude/rev2/`): GPT accepts the G-PA1 withdrawal and the partial-inventory wording. **G-P2 row restored** (no tally change; it was always counted). REPORT §4: **four Wayback captures inspected, three relevant texts readable**; Perkins body blocked; Williams assessed through separate archive.org item metadata; capture IDs and timing limits linked. Rev 2 as reviewed preserved in `rev2/_rev2.0-20261109T115906Z/`; LOG appended; originals unchanged (hashes match `.orig-hashes`, except LOG.md, which is append-only).
- **R2 fireballs terms rev 2: ACCEPTED by GPT** as bounded research-only evidence (had been accepted; now recorded). Draft REGISTER entry **unfiled**.
- The opening-page / Met placement / top-tabs audit stays on its separate docs track.
- **Not approved:** research, rerun, build, REGISTER filing, production.

## 9 Nov 11:51 UTC (clock reading at write) — **Timeline POC proposal rev 3 (GPT's three targeted corrections + selection cap)** (docs only)
- **`pr-v1` completed:** explicit inside / overlapping / outside / unknown–incomparable outcomes. On a comparable basis, minimum-only > 350 ka is outside and maximum-only < 100 ka is outside. A one-sided bound that overlaps the period is unknown (not eligible). Missing endpoints are never filled.
- **`ax-v1`:** no assumed 1950 reference where the basis is unstated; originals and bounds always shown; a midpoint is a labelled display aid only.
- **Comparability before contradiction:** same target, referent, units, reference date, context and uncertainty meaning required. Non-overlap = "tension", not proof. Source-stated disagreement is recorded separately. Otherwise "comparison not established".
- **Image scope:** the default is strictly text-only (direct text/XML, unrendered HTML without image resources); otherwise outside bound / inaccessible. Unrendered PDF ingestion (which transfers embedded image bytes) is a separate option, **H8b, Chad's explicit choice only**.
- **Selection cap:** A1 frame discovery and selection ≤ 30 min **inside** the 3 h; stop and report if unusable or insufficient; no A2/A3 switch or extension.
- §12 (separate page / top tabs) kept. The parallel docs-only opening-page / Met placement review is noted as separate (not held in this repo).
- **No research or pilot run approved.** H1–H8 (+ H8b) are Chad's.


## 9 Nov 11:41 UTC (clock reading at write) — **Timeline POC proposal rev 2 (GPT's five corrections)** (docs only) — `docs/concepts/TIMELINE-POC-HUMAN-PROPOSAL.md`
- GPT supports the direction (two separate tests, Test A first, as a recommendation). Rev 2:
  1. **Age definitions:** material, target quantity, units, epoch, calibration/model and uncertainty recorded as stated (unknown otherwise); specimen, associated material, deposition, discovery and publication dates kept apart; period rule `pr-v1` (overlaps eligible and flagged; min/max labelled; unknown basis not eligible); any axis conversion is T3 `ax-v1` with originals kept.
  2. **Disagreement and independence:** results compared by target, referent, context/model and uncertainty; different methods on the same target can contradict; different layers usually measure different quantities; labs, teams or papers are not automatically independent; shared samples/data/contexts recorded; revisions and supersessions kept.
  3. **Types vs units:** F1–F5 frozen as types with inclusion rules; every revealed unit logged with stable IDs; completeness assessed after inspection; selection, inventory, access and method outcomes reported separately; floor 3 is operational.
  4. **Tiers and support:** a paper is a carrier, not automatic T1; reported measurements vs source inferences vs T3; a layer age is not a specimen measurement; "supported" = the source states the scoped claim, not validation; accepted dispositions kept.
  5. **Image exclusion:** text/table-only routes; images never saved; image-only evidence → "not checked — outside bound (image only)".
- **A1 bounded:** no silent switch to A2/A3 (selection inconclusive instead).
- **Chad's design note recorded (§12):** the timeline needs its own page and view, not the opening globe page; think about **tabs at the top of the screen**. A later UX proposal; nothing built.
- H1–H8 stay Chad's. The Route W gate stays closed; the Wikipedia pilot's rev 2 awaits GPT's check. **No research or building.**


## 9 Nov 11:29 UTC (clock reading at write) — **Timeline POC proposal (human evolution / human history), rev 1** (docs only; Chad's brief) — `docs/concepts/TIMELINE-POC-HUMAN-PROPOSAL.md`, for GPT
- **Recommends two separate small tests:**
  - **Test A (human evolution) first:** physical evidence and scientific dating as the primary tier, something the pilots have not tested;
  - **Test B (human history) later**, sketched only;
  - no forced link or implied progression between them.
- **Test A question:** for ≤ 5 early *Homo sapiens* finds (~350–100 ka, Africa; candidates labelled unverified), can the timeline show each find with its dating method, material, range and uncertainty, keep attribution disputes as separate attributed claims, and trace each to its primary report, without implying ancestry?
- **Method:**
  - claim units F1–F5 fixed before tracing (each dating result its own unit);
  - inventory declared complete or partial;
  - contradictions only for the same unit and referent;
  - age, discovery, publication and update/copyright dates kept apart;
  - images of human remains excluded;
  - 3 h cap + one GPT review.
- Decisions H1–H8 are Chad's. **No research, lookups or selection done.** The Route W gate stays closed; the Wikipedia pilot's findings and rev 2 stand.


## 9 Nov 11:23 UTC (clock reading at write) — **Wikipedia-led pilot rev 2 after GPT's review** + **GPT accepted ENQUIRIES rev 7** (docs only)
- **Pilot rev 2** (`research/timeline-wikipedia-pilot/2026-11-09-claude/rev2/` on the Mac; originals unchanged, hashes in `rev2/.orig-hashes`):
  1. **G-PA1:** `contradicted` → **`not stated`**. The source's 26 March low-pressure centre and 27 March trough are different features, and the lead's "the storm" has an uncertain referent. No one-day contradiction is established, and 27 March is not a correction. Unsupported reasons are now not stated 2 · contradicted 0.
  2. **Inventory: partial.** The leads hold further date/place assertions (e.g. flooding in named cities on 25 March, Maryland). The 9 units are kept, completeness is incomplete/unassessed, and rates are bounded to the 9. Nothing is split or added.
  3. **Provenance:** copyright years and last-updated dates are separated from publication dates (Storms, Rivers, WDL description: original publication date not established). Sources are described as "reached through the inspected archive routes". The access-dominated effort claim is withdrawn; the observed obstacles are reported instead.
- **GPT's answers recorded:**
  - the Austin exclusion is defensible;
  - the 20-state compound claim may stay intact;
  - Perkins is a candidate citation of uncertain scope;
  - the WDL description is T2-s;
  - request-completion pin times are the right source.
  - **GPT independently observed the Rivers page's copyright footer**: new GPT verification, not Claude's capture or reuse clearance.
- **Scope (Chad):** floods / Pennsylvania / 1870–1927 were only the pilot test case. A theme closer to human history or evolution is being considered for any future test; **nothing is selected or authorised.**
- **ENQUIRIES rev 7 ACCEPTED by GPT** as the bounded evidence/linking record:
  - "3. Yes" confirms the specific public aggregate-hosting arrangement (counts per area, no aircraft identifiers or individual tracks), within the standing hobbyist, feeder, credit and attribution conditions;
  - the automatic account link is conditional on feeding 30%+ of the preceding month; measurement, window and receiver association are unspecified;
  - feeder qualification is only partly addressed.
  - No REGISTER change, purchase, installation, aircraft build or production approval.
- **Not approved:** rerun, research, queries, source reads, sampling, provider contact, REGISTER, prototype, production. The Route W gate stays closed.


## 9 Nov 10:57 UTC (commit time, `61c3cd6`) — **ENQUIRIES rev 7: OpenSky second reply LINKED** (docs only)
- Chad supplied his exact sent follow-up (screenshot, displayed 10:22 AM, not converted). Q1–Q3 filed verbatim; his email address is omitted.
- **"3. Yes" answers follow-up Q3:** hosting the aggregated snapshots on our own public site (counts per area, no aircraft identifiers or individual tracks), under the ~10 requests/day arrangement. Recorded as **affirmative for that specific arrangement only, within the standing hobbyist, feeder and credit conditions**. Not blanket redistribution; the feeder condition is not waived.
- **Account link (follow-up Q2):** automatic on OpenSky's side if feeding for 30%+ of the preceding month. The measurement and the linking mechanism are not stated, and our account does not qualify now (no receiver).
- **Feeder qualification (follow-up Q1):** only the 30%+ criterion is stated, by contextual reading.
- No REGISTER change. Aircraft scope unchanged (no purchase, installation, build or deployment).


## 9 Nov 10:45:13–10:54:21 UTC (Mac clock) — **Wikipedia-led discovery and source-tracing pilot RUN** (research only; Chad's Go) — packet `research/timeline-wikipedia-pilot/2026-11-09-claude/` on the Mac (not in the repo)
- **Protocol** `wp-pilot-v1`, fixed at 10:45:30 before any discovery:
  - route 1 = Category:Floods in Pennsylvania (+ subcategories at depth 1);
  - single fallback = search `flood Pennsylvania`, first 50;
  - eligibility from the pinned lead and infobox (flood event, date in 1870–1927, Pennsylvania stated);
  - selection all if ≤ 5, else SHA-256 order;
  - claims = event date and place in the infobox and lead;
  - ≤ 3 sources per claim.
- **Discovery:** 16 category members, 2 eligible; the fallback added none. **Austin Dam failure (1911) excluded as a boundary case** (lead and infobox describe the dam; neither states flooding), flagged for GPT.
- **Selected:** Johnstown Flood (pageid 454915, rev 1380111733, **baseline-labelled**) and Great Flood of 1913 (41070003, rev 1383070635).
- **9 claims:**
  - **qualifying support 0**;
  - repetition 1 (J-D1 date, World Digital Library description, T2-s);
  - unsupported 2 (G-P1: the cited source names 17 states, not 20, but does state Pennsylvania; G-PA1: the lead's Wed 26 Mar is contradicted by the cited source's Thu 27 Mar, which matches the article's own timeline);
  - inaccessible 1 (J-P2, *Science News* subscriber-only);
  - **no reference given 5**.
  - The **Great Flood of 1913 lead and infobox have no footnotes at all.** No independent corroboration is counted (all lineage unknown).
- **Sources:** WDL item 9571, Silver Jackets/MRCC "Storms" and "Rivers" (2013, T2-h), all read via Internet Archive captures. *Science News* 2009 is paywalled; *Washed Away* (2013) is borrow-only on archive.org. Chad granted pane access to archive.org.
- **Effort:** about 9 min of the 3 h cap. Effort was dominated by access routes; small because the case set is small.
- **For GPT:** `research/timeline-wikipedia-pilot/2026-11-09-claude/report/REPORT.md` (+ `articles/EVIDENCE-TABLE.md`, `sources/SOURCES.md`, `discovery/DISCOVERY.md`, `protocol/PROTOCOL.md`, `LOG.md`).
- **Not approved / not done:** History selection, Phase A, publication, prototype, REGISTER, provider contact, accounts or borrowing, production.

## 9 Nov 10:44 UTC (commit time, `bb71e56`) — **ENQUIRIES rev 6: OpenSky second reply recorded verbatim** (docs only)
- Martin (ticket #837506), header "11:35 AM" as Gmail displays it (not converted): "It's automatic on our side, if you've been feeding for 30%+ of the preceeding month." / "3. Yes". Read from Chad's screenshot; Gmail's AI overview not used.
- **The link to the sent follow-up is PENDING:** the exact sent follow-up (and so its numbering) is not on record. Q3 stays unresolved until Chad supplies it. Nothing is inferred about qualification, measurement or account linking. No REGISTER change; aircraft scope unchanged.


## 9 Nov 10:28 UTC (clock reading at write) — **GPT ACCEPTED Route W gate rev 2** (docs only)
- **Accepted as the corrected evidence record of an INCONCLUSIVE run.** All substantive review corrections are closed.
- **GPT verified:**
  - the frozen originals are unchanged and the log is append-only;
  - all 52 revised date intervals are valid, with 0 period-eligibility changes;
  - the same 14 reference rows are retained, with provisional matching classes;
  - the terms corrections agree with the evidence already reviewed.
- **Wording tidy-up (nonblocking, no further GPT gate):** `rev2/REPORT-rev2.md` §3.2 now says the SPARQL probe was outstanding for ~65 s, and two requests overlapped only during A (1.518 s) and B1 (10.854 s), ≈ 12.4 s in total. Rev 2 report sha256 `a85d2e82…` → `a49db6a8…` (LOG.md records both).
- **Standing position:**
  - selection inconclusive: one eligible item in the returned, verified frame;
  - full source-link/timing assessment and coverage incomplete;
  - **acceptance is not a feasibility or coverage pass, and not a route or build clearance.**
- **Not approved:** rerun, research, queries, source reads, sampling, provider contact, REGISTER filing/status change, prototype, production.


## 9 Nov 10:21 UTC (clock reading at write) — **Route W gate rev 2 after GPT's review** (docs and derived records only; existing evidence; no rerun) — `research/timeline-route-w/2026-11-09-claude/rev2/` on the Mac
- **GPT accepted, within scope:**
  - the 9 in-rule Johnstown claims: 8 without references, 1 date supported at day precision by the later-history article;
  - packet hashes, sampling and order keys reproduced;
  - USGS derivation reproduced: 39 in-period rows → 14 selected reference rows.
- **GPT did not accept the unconditional method/discovery/coverage pass.** Six corrections, all applied in rev 2 (frozen originals unchanged):
  1. **Shared-area predicate:** the rev 1 code reversed the frozen rule's direction. It is now recorded as a **deviation**, with both predicates evaluated (they differ on Q691404 and Q22023013; no candidate under either).
  2. **Source-link (L) check:** it was a metadata screen only. Full L/source-timing is **uncompleted**, the 14 classes are **provisional**, and coverage is **incomplete/inconclusive**.
  3. **Request log:** A+B is the split replacement for the main query. A2 and two probes are identified separately; **two** queries aborted. The aborted SPARQL probe (08:44:01.8–08:45:06.8) overlapped A and B1, so **"serial throughout" is withdrawn**. "Completed with no detected truncation"; one eligible item in the returned, verified frame; no quota inference either way.
  4. **Reference list:** "14 selected reference rows" (our T3 threshold). Row 5's 19.02 ft (1886-01-06) and 20.81 ft (1886-02-01) are each kept with their own date. Matching failures are no longer an "externally documented" gap.
  5. **Terms:** the WDQS numerical limits are added (60 s processing per 60 s per client, 30 error queries/min, 5 parallel per IP, 429 + Retry-After), taken from manual rev 8632351 text already retrieved; their omission was Claude's error. USGS/NWS reuse UNRESOLVED. American Heritage wording corrected (observed notice + no project approval, not a legal claim). Nothing filed.
  6. **Month-end arithmetic:** 7 invalid endpoints corrected (GPT's count confirmed; an 8th sat in a non-governing, unrecorded statement). 0 eligibility flips.
- **Selection stays inconclusive.** Not approved: rerun, queries, source reads, research, route adoption, REGISTER, prototype, production.


## 9 Nov 08:34:48–09:01:03 UTC (Mac clock) — **Timeline Route W first feasibility gate RUN** (research only; Chad's "go" on rev 4's parameters) — packet in the Mac folder `research/timeline-route-w/2026-11-09-claude/` (not in the repo)
- **Protocol:** `docs/concepts/TIMELINE-ROUTE-W-GATE-PROPOSAL.md` rev 4.
  - Pennsylvania fixed · 1870–1927 · English · ≤ 30 / floor 10 · reference list ≤ 40 · seed 20261109 · `map-v2`, `roll-v1`, `match-v3`.
  - Cap 6 h with fixed sub-caps. No national fallback; D3b yes.
  - **Clock time used: 26 min** (terms 1 · reference list 4 · selection 12 · inventory 2 · checking 2 · report ~1).
- **Access:** the workspace shell is refused at the proxy for Wikidata and Wikipedia. Every read went through the browser pane: serial requests, `Api-User-Agent` = repo URL, `maxlag=5`. Chad granted pane site access to wikidata.org, wikipedia.org, waterdata.usgs.gov, nwis.waterdata.usgs.gov, water.noaa.gov and web.archive.org.
- **Terms (pass, research record, nothing filed):**
  - Wikidata:Copyright rev 1523614187 (CC0);
  - Wikipedia:Copyrights rev 1378669134 (CC BY-SA 4.0 / GFDL);
  - WMF Terms of Use rev 598588 and User-Agent policy rev 564705;
  - extracted directly by Claude; GPT has not checked them.
- **Reference list (`ref-v1`), fixed 08:41:33 UTC before any flood query:**
  - source: USGS 01570500 (Susquehanna at Harrisburg) annual peaks with gauge height ≥ 17 ft, the NWS minor flood stage at HARP1;
  - **14 entries, 1886–1926**;
  - list sha256 `01ca635a…f66f`, source file `4ad3a8d5…e544`.
- **Discovery / selection (`sel-v1`):**
  - 34 flood classes;
  - frame 67, verified on pinned data, 0 discrepancies;
  - **1 eligible: Q691404 Johnstown Flood** (rev 2540961062) → **selection INCONCLUSIVE** (< 10);
  - exclusions: 19 with no date, 38 outside the period, 9 with country only (incl. Q16982566 Great Flood of 1913).
  - The first single query hit our 65 s client timeout and was replaced by a logged A + B + A2 split.
  - File sha256 `9e6677cb…eabd`.
- **Inventory:** `map-v2` = `map-v1` (no corrections). 9 claims in the rule (A 7, B 2) + 2 type statements. File `4500f965…2d5e`.
- **Checking:**
  - P585 → **checked — supported, qualifying** (American Heritage 2006 article, T2-h, lineage unknown; Wayback capture 2010-12-05);
  - **the other 8 claims: no reference given** (leads from enwiki rev 1380111733);
  - coverage 1/9, qualifying rate 1/1 (one claim; little information).
  - File `0f363c41…adbb`.
- **Matching (`match-v3`):** 14/14 entries "not found in our discovery results" (discovery complete; not provisional). Near misses: Johnstown (documented interval 31 May 1889 vs the Harrisburg crest on 2 Jun); Great Flood of 1913 (23–26 Mar vs 28 Mar; no PA place or river).
- **Sensitivity flag for Chad:** deaths are 2,209 in Wikidata (unreferenced); enwiki body 2,209 with a footnote, enwiki infobox 2,208 with none; the 2006 article says "2,200-plus".
- **For GPT (one review):** `research/timeline-route-w/2026-11-09-claude/report/REPORT.md` and the packet beside it. Points to look at:
  - our reading of "shared area";
  - the L check, bounded to frame items' own text;
  - the discovery split;
  - the reference-list event definition (our T3).
- **Not approved / not done:** route or History selection, prototype, Phase A, REGISTER filing, provider contact, any production change. Nothing from Wikidata, Wikipedia or the cited article is in the repo.

## 9 Nov 08:20 UTC (clock reading at write) — **GPT accepted Route W gate proposal rev 4 and ENQUIRIES rev 5** (docs only)
- **Proposal rev 4:** accepted within its recorded scope; all requested corrections addressed. The 30-day matching window = provisional, unmeasured candidate-generation boundary (not episode duration or identity evidence); documented timing and source links take priority; negative results bounded to the method. Editorial tidy-up after acceptance: §6.3 heading `match-v2` → `match-v3` (label only; no further review needed, per GPT).
- **ENQUIRIES rev 5:** accepted as a bounded evidence/interpretation record. Q1b, Q1c, Q3 unresolved; Q2 a contextual reading only; feeder, credit and cloud conditions stand.
- **Acceptance selects nothing:** Route W and its parameters remain Chad's decisions (D1–D8). No research, queries, sampling, downloads, provider contact, REGISTER filing/status change, prototype or production change authorised. Aircraft stays terms/access + feeder clarification only.

## 9 Nov 08:07 UTC (clock reading at write) — **Route W gate proposal rev 4 + ENQUIRIES rev 5** (docs only; after GPT's direct review in the shared folder)
- **Proposal rev 4:** claims outside the checking rule = "not checked — outside rule", references kept but not evaluated; roll-up only for within-rule claims. Matching clock separate from the selection clock: matching interval from documented timing, else a provisional 30-day window after the selection value; candidates **C = (T AND (A OR R)) OR L** (source link stated separately); uncertain episode/crest relationships stay unresolved (`match-v3`). Property mapping verified within the gate by meaning/description, datatype and presence on the frozen items before inventory, corrections recorded, frozen as `map-v2` before checking, unresolved membership and coverage limits kept. GPT's acceptance of support-first precedence recorded (measures whether a source states a claim; not truth or agreement); `contradicted by` and `coarser only` now separate fields and separate report lines. One open point for GPT (30-day window).
- **ENQUIRIES rev 5:** Q2 rationale corrected (Q3 is also yes/no; Q2 = plausible contextual interpretation, not uniquely established); closing-line reading labelled contextual interpretation ("normal" undefined by OpenSky); cloud, feeder and credit conditions restated. Rev 3's acceptance stands; rev 4 was not accepted verbatim.
- Standing: GPT reads current files directly from `/Users/chadobie/Documents/Mother Earth`.
- **Not approved:** research, queries, sampling, downloads, route or parameter selection, provider contact, REGISTER change, prototype, connector/permission change, production action.

## 9 Nov 07:58:46 UTC — **Mac folder synced to main `7de48f4`** (raw.githubusercontent route; preserve-first)
- 5 files: STATUS, HANDOVER, TIMELINE-CONCEPT, ENQUIRIES (each preserved to `_sync-preserved/20261109T075846Z/`, all four = `0f7ec67`, so no local edits) and the new TIMELINE-ROUTE-W-GATE-PROPOSAL; every copy hash-checked against the commit. The Mac shell can't `git clone` GitHub today but can `curl` raw files (START-HERE §3). Standing (Chad): GPT reads the folders, so messages to GPT point to paths.

## 9 Nov 07:54 UTC (clock reading at write) — **Route W gate proposal rev 3 (GPT's four targeted corrections; docs only)**; GPT accepted ENQUIRIES rev 3
- **GPT (relayed by Chad):** accepts `ENQUIRIES-2026-11.md` **rev 3** as a bounded evidence record (reply quoted accurately, earlier conditions intact, equipment advice labelled unverified); no aircraft clearance or REGISTER change. **Rev 4** (the reply linked to Chad's sent enquiry, `fd58543`) has not yet been reviewed by GPT. Rev 2 of the proposal: most findings addressed.
- **Proposal rev 3** (`docs/concepts/TIMELINE-ROUTE-W-GATE-PROPOSAL.md`), rev 2's improvements kept:
  1. identity matching (§6.3, `match-v2`): candidates ≠ identity; documented identity evidence required; a single weak candidate stays unresolved; episodes vs gauge crests with many-to-one recorded; separate from eligibility;
  2. coverage counts (§6.2, §6.4): no "at least"; exact classes in the fixed subset, provisional where discovery/verification is incomplete, summing to the subset size; stable source-row IDs + tie-break;
  3. roll-up (§4.3a, `roll-v1`): reference-level observations → one disposition per claim, contradictory and partially checked references kept, each claim counted once; circular-only repetition never qualifying (§4.4); accepting Wikidata/Wikipedia terms does not clear external works; quotation length ≠ rights clearance (§5);
  4. frozen protocol: property-ID → group mapping (`map-v1`, IDs from general knowledge, label-verified at gate start) with unmapped-but-relevant statements logged (§4.1); rule V — eligibility re-evaluated on pinned item data before the sample is frozen, hierarchy provenance and query/item discrepancies kept, unverifiable frame reported incomplete with reproducibility limits (§3.3).
- GPT's answers to rev 2's four points recorded in §8 (hop limits and the 40-entry cap = provisional effort boundaries; start-time precedence for eligibility only; reviewer-chosen revision = dated T2-s repetition evidence; Step A first, Step B on the remaining budget). Two new points for GPT.
- **Not approved:** research, queries, sampling, downloads, route or parameter selection, provider contact, REGISTER filing/status change, prototype, connector/permission change, production work.

## 9 Nov 07:47 UTC (clock reading at write) — **OpenSky reply linked to Chad's exact sent enquiry** (docs only; `ENQUIRIES-2026-11.md` rev 4)
- Chad supplied his sent message (screenshot, read by Claude); Q1–Q3 and the closing line filed verbatim, personal details (address, phone, building role) kept out of the repo.
- **Bounded reading (Claude's, for GPT and Chad):** "That works for us" most plausibly answers **Q2** (~10 REST requests/day from the home connection for a public aircraft-distribution globe), within the hobbyist/feeder conditions Chad's own message cites — interpretation, not explicit. "Normal connections need no whitelisting" answers the own-connection line. Equipment advice answers Q1a. **Not answered:** Q1b (feeder contribution/uptime), Q1c (feeder ↔ API account), Q3 (hosting aggregated snapshots). No waived feeder condition, unlimited credits or redistribution permission inferred. REGISTER unchanged; no follow-up sent.

## 9 Nov 07:44 UTC (clock reading at write) — **Route W gate proposal rev 2 (GPT's six corrections; docs only)** + **OpenSky substantive reply recorded** (docs only)
- **Proposal rev 2** (`docs/concepts/TIMELINE-ROUTE-W-GATE-PROPOSAL.md`, for GPT): imported references kept as references with separate provenance; dependency ≠ circularity without evidence; "support kind" qualifying vs repetition, qualifying rate reported first. Over-precise claims = checked — unsupported, with the coarser supported value recorded separately. Coverage bounded by five outcome classes (matched selected / omitted by cap / excluded by rule / unresolved / not found in our discovery results). Reference-list size (≤ 40, hash subset) and matching rule fixed beforehand; gauge comparisons limited to the gauge's own coverage. Pennsylvania fixed, sparse = inconclusive (GPT's recommendation adopted); national fallback kept only as an option with its changed predicate and separate results. Reproducible selection: date precedence, interval/boundary/conflict rules, type and place chains with hop limits, Q-number ordering, SHA-256 keyed sample with the seed as salt, discovery truncation reported. Incomplete inventory reported with unknown remainder; checking coverage beside every rate; N/A on zero denominators; 10-event floor operational. Full rule carryover (§1); terms sequencing: Wikidata + Wikipedia terms up front, media excluded, external works recorded as encountered. Candidates stay candidates; no completion guarantee. Four points for GPT (§8).
- **OpenSky ticket #837506 reply** (Martin Strohmeier; read by Claude from Chad's screenshot, Gmail AI overview not used): "That works for us. Normal connections need no whitelisting." plus equipment advice (Pi 3B/4 + RTL-SDR, outdoor antenna, adsb.im image; active-antenna product explicitly not vouched for) — recorded as provider advice, unverified. **Antecedent UNRESOLVED:** the exact 9 Nov sent enquiry is not in any saved record (repo, Project, Mac folder searched). No waived feeder condition, unlimited credits or blanket redistribution inferred. REGISTER unchanged. `docs/research/ENQUIRIES-2026-11.md` rev 3.
- **Not approved:** timeline research, queries, sampling, downloads, route or parameter selection, provider follow-up, REGISTER filing/status change, purchase, account, installation, prototype, connector/permission change, production work. Aircraft stays terms/access + feeder clarification only; `aircraft-rc` parked.

## 9 Nov 07:24 UTC (clock reading at write) — **Timeline Route W first-gate parameters: PROPOSAL rev 1** (docs only; Chad's go for a proposal only) — `docs/concepts/TIMELINE-ROUTE-W-GATE-PROPOSAL.md`, for GPT
- Brings forward TIMELINE-CONCEPT rev 3.1 §5A.4 with recommended parameters: water/floods · **1870–1927** · **one US state, Pennsylvania (candidate)**, pre-recorded fallback to the contiguous US if < 10 events · **English** (cited works in any language checkable) · **≤ 30 events, ≥ 10 workable** · **6 h incl. write-up** in fixed sub-caps (terms 0.75 · reference list 1 · selection 0.75 · inventory 0.75 · checking 2 · report 0.75) + one GPT review · seed `20261109`.
- **Checking rule:** all date and place claims of every selected event, then all scale/relationship claims of a seeded 10, in a saved seeded order; claims not reached = "not checked — cap reached" (a sub-field; the five dispositions unchanged). Wikipedia footnotes recorded as leads, not checked.
- **Independent reference list recommended** (1 h sub-cap, fixed before the Wikidata selection is seen; measures missed events for the state only; a gauge-crest list would double as a Route L T1 anchor). Without it, missed events stay unmeasured.
- Rev 3.1 rules restated unchanged: T2-s labelling, unverified-assertion display, pinned revisions, kept uncertainty, two dates, lineage states, support rate over checked claims only, terms record with nothing filed. Copied Wikidata/Wikipedia/cited content stays out of the public repo until the terms record is accepted.
- Region reasons are labelled general knowledge, unverified. Four open points for GPT (§8). Decisions D1–D8 for Chad; route not selected.
- **Nothing run:** no provider research, queries, sampling, downloads, accounts, contact, REGISTER filing, prototype or production change. Arts reviews stay closed; actual-iPhone check deferred.
- Operating note: on 9 Nov 07:14 UTC the Mac shell's `git clone` of GitHub was refused (proxy 403), so the START-HERE §3 Mac-sync route did not work; the Mac copy was spot-checked from the workspace side (8 key files = main `0f7ec67`).

## 9 Nov 07:00 UTC (clock reading at write) — **Arts release tidy-up checks (Claude, read-only; closes two of GPT's stated limits)**
- **Served page files, no-store (06:59:46 UTC, pane tab on the live site):** all five HTTP 200 and = the reviewed hashes — index `e30b04f7ee5a` (110,497 B), app `e3f4a3854113` (81,781 B), arts `58773cef35e6` (5,759 B), sources `33074c2d17d3` (43,378 B), style `6a54e0b17cbd` (28,489 B).
- **Raw HTTP status codes (same read):** `/` 200; `/snapshot/arts` **200**, 127,887 B, sha256 = `221bb1ca…9644`; `/cells/arts` **404** (body "unknown layer"); `/snapshot/usgs` 200; all eight `/health/<runs|publication|archive|coverage>/<usgs|firms>` **200**.
- **Production Worker CPU for `/snapshot/arts` (telemetry, 06:13:19–06:59:58 UTC, 539 events returned):** 6 `/snapshot/arts` invocations, all outcome ok, **CPU 1 ms each** (telemetry reports whole milliseconds), wall 209–243 ms (412 ms on the first request right after the deploy). Telemetry may not list every request (the newest take ~20 s to appear), so the count is not a complete request tally.
- **Still unmeasured:** served transfer size (the hub sends no Timing-Allow-Origin, and compression is not observable from the page); cold-load "after" (Chad, fresh profile); actual iPhone Safari (Chad); screen-reader announcement (optional VoiceOver).
- These are Claude-supplied checks; GPT has not reviewed them. No production change.

## 9 Nov 06:58 UTC (clock reading at write) — **GPT independent live smoke test of the Arts release: no blocking defect within the checks completed** (GPT, ~06:44–06:52 UTC, read-only; relayed by Chad; recorded here, docs only)
**GPT's observations (kept separate from Claude's release evidence in the 06:20 entry below):**
- Hub reports 0.6.2. The browser-delivered Arts snapshot matches the approved file: 127,887 B, sha256 `221bb1ca…9644`.
- 25 country rows sum to 479; all 479 expanded entries show the sensitivity warning; exactly 11 carry tentative labels; rendered titles, Met wording and country strings match the snapshot.
- The card starts off, loads when enabled, clears when disabled, keeps the accepted caveats, dates and limitations, and leaves the map key unchanged.
- Country button / ARIA relationships and Enter, Space and Tab behaviour checked.
- No page overflow and no inner Arts-list scrollbar at 360, 390, 430 and 1280 px.
- All eight health response bodies report healthy. Served stylesheet hash matches.
- Bounded regression checks passed: core layers, search, ship/earthquake/fire inspectors, Everything here, optional layers, all three orbital categories. Captured console warning/error log empty. No Met-host resources in the inspected resource inventories.
- **Minor, non-blocking, no fix requested:** the Sources attribution-table row reads "Met catalogue sample" without the word "catalogued"; the Arts section and the tiers row classify it as catalogued.
**GPT's stated verification limits:**
- No independent no-store hashes for index.html, app.js, arts.js or sources.html; the stylesheet export's cache mode was not observable.
- Raw HTTP status codes and exact request counts not captured: healthy bodies do not establish verified HTTP 200s, and the `/cells/arts` unknown-layer body does not establish a verified 404.
- Resource inventories deduplicate URLs: they support the lazy-loading and no-Met-resource findings but are not a complete network trace.
- Actual iPhone/Safari and screen-reader announcements unverified (iPhone check deferred with Chad).
- Production Worker CPU, transfer size and a live cold-load "before" unmeasured. Not an exhaustive regression pass and not a rerun of Claude's 90 browser tests.
- GPT saved its evidence and updated its own reviewer ledger/handover (outside this repo).
**Nothing approved:** no fixes, upload, deployment, merge, page release, schedule or other production change.

## 9 Nov 06:20:18 UTC — **PAGE RELEASED: Met catalogue sample card** (main `6d5ca55`, no-ff merge of `arts-met-rc` @ `c5005c3`; Chad: "Approve: push arts-met-rc to main (page change: Met catalogue sample card)")
- **Live RC check before the merge (06:19–06:20 UTC, clean pane tab, branch files from raw.githubusercontent at `c5005c3`, sha256 matched: index `e30b04f7`, app `e3f4a385` (unchanged), arts `58773cef`, style `6a54e0b1`), against live hub 0.6.2:** off on load with no Arts request; on → one request, status ok, 25 rows summing to 479, headings correct; Iran expanded: 26 objects visible, each with the sensitivity warning; Key count unchanged (4); no Met image requests; no script errors; no overflow at 588 px. Transfer size not readable (no Timing-Allow-Origin).
- **Merge:** no overlap with main's docs; merged page and hub files = the reviewed hashes; arts-hub 54/54 on the merge. **main's `phase1/worker.js` = live 0.6.2 (`4b5b6aa3…`), so main = live again.**
- **Served hashes verified 06:22:23 UTC** (no-store): index, app, arts, style, sources all = the reviewed values; assets `?v=202611161000`.
- **Live read (06:22–06:23 UTC, public page):** hub 0.6.2; card on → ok, "479 objects · 25 present-day countries", label Catalogued, "loaded — source CSV of 2 Nov 2026 (commit e394878) · view prepared 7 Nov 2026"; China expanded: 28 objects, all with the warning; off → cleared; Key 4 layers throughout; footer credit present; Sources `#arts` present; no Met requests; no errors. Pane at 588 px (phone layout), **not a real phone**.
- **REGISTER:** Met entry status → on the page (fixed snapshot).
- **Still outstanding:** actual iPhone Safari check (Chad); cold-load measurement (a true before is no longer available live — the 7 Nov baseline is historical and pre-NOAA-21; an after measurement can still be taken, Chad, fresh profile); served transfer size; Worker CPU for `/snapshot/arts` (readable from telemetry); screen-reader announcement (optional VoiceOver). GPT has not independently checked the live release.
- **Rollback (each its own Approve line; page first):** revert `6d5ca55` on main (an open page keeps the old code until reloaded); then, if wanted, hub → 0.6.1 `f38296a0…`; then the R2 object.
- Branch `arts-met-rc` deleted by Chad on GitHub after the release; checked: remote heads are `main` and the parked `aircraft-rc` only.

## 9 Nov 06:13:19 UTC — **HUB 0.6.2 DEPLOYED** (Chad: "Approve: deploy hub 0.6.2 from 4c4bbb9 (content only)")
- **Before (06:13:05 UTC):** live worker.js = 0.6.1 `f38296a0…2cc8` (the pinned rollback target); 19 bindings; health 8/8 (all 200). Code fetched from raw.githubusercontent at `4c4bbb9`: 274,031 B, sha256 `4b5b6aa3c953afbce197586b8007a54da5191d83f4b317b28a48b4b1661a003f` (= the reviewed branch file).
- **Deploy:** content-only API from the dashboard tab, HTTP 200, success, etag `32b879f9…0ccb`, modified 06:13:19.209Z. Bindings, secrets, variables and crons untouched.
- **Verified (06:13:48 UTC):** read-back worker.js sha256 = `4b5b6aa3…003f` (exact); **19 bindings, identical list**; `/` = **0.6.2**, `catalogues.arts` listed, history collecting; health **8/8** (200); **`/snapshot/arts` 200**, 127,887 B, sha256 `221bb1ca…9644` (= the R2 object), `snapshot_id` `067211d9…16cb2`, 479 objects / 25 countries, `Cache-Control: public, max-age=60`, `application/json`; `/cells/arts` 404; `/snapshot/usgs` 200.
- **First scheduled runs on 0.6.2 (D1):** usgs 06:15:07 ok (46 records), firms 06:15:40 ok (3,196 records, v2 run). `collector_runs` has **no `arts` rows** (as designed).
- **Finding (no functional effect):** the ETag reaches the browser as **weak** — `W/"221bb1ca…9644"` — though the hub sets a strong one. Most likely Cloudflare's edge compression weakening it; not investigated. The page does not use the ETag; the hash value is unchanged.
- **Public page unchanged:** main still `ad4002b` (?v=202611151000); the card exists only on branch `arts-met-rc`. Served transfer size and production CPU for `/snapshot/arts`: not yet measured.
- **Rollback (own Approve line):** redeploy 0.6.1 `f38296a0…2cc8` (main's `phase1/worker.js` is still 0.6.1, so main ≠ live hub until the branch merges). Page-first order applies once the page is released.
- **Next:** live RC check of the page branch against the deployed hub (clean pane tab; 5 page files incl. `arts.js`; read-only) → `Approve: push arts-met-rc to main (page change: Met catalogue sample card)`.

## 9 Nov 06:11:12 UTC — **R2 UPLOAD DONE: `ref/arts/met-R1-e394878.json`** (Chad: "Approve: upload ref/arts/met-R1-e394878.json (complete-file sha256 221bb1cab1c186a99972fdf936efddc22a298b6529abf30450ca0b3f4d219644) to R2")
- **Pre-checks (06:10:58 UTC, dashboard tab):** destination absent (404 "The specified key does not exist"); nothing under `ref/arts/`. Source fetched from raw.githubusercontent at branch commit `4c4bbb9`: HTTP 200, 127,887 B, sha256 `221bb1ca…9644` = the approved hash. Absence re-checked immediately before the write.
- **Upload:** dashboard R2 objects API `PUT`, HTTP 200, size 127,887, storage class Standard, etag `018c5530041ede986508980c688b577d`, version `7e5e41115f0f148786da0d15470293b1`, uploaded **06:11:12.285Z**.
- **Read-back (06:11:25 UTC):** HTTP 200, 127,887 B, **sha256 `221bb1ca…9644` (exact)**. `ref/` now holds this file and the existing Oceaneye original. No lifecycle rule covers `ref/` (rules: `raw/`, `snapshots/`, `cells/`), so it does not expire.
- **No public effect:** the live hub is still **0.6.1** and answers `/snapshot/arts` with 404 "unknown layer". The file is served only once hub 0.6.2 is deployed (separate approval).
- **Rollback target pinned for the hub deploy (06:11:42 UTC, read back from Cloudflare):** live worker.js = **0.6.1, sha256 `f38296a0183d14d958d5815d7926254cb4275be7ca00b384334974fad5b12cc8`** (271,271 B).
- R2 cost: one Class A write and three Class B reads (pre-check, absence re-check, read-back), well inside the allowances (billing check rev 2.1). Removing the object would be a separate action with its own Approve line.
- **Next (each on its own Approve line):** `Approve: deploy hub 0.6.2 from 4c4bbb9 (content only)` → live RC check → page release.

## 9 Nov 06:09 UTC (clock reading at write) — **R2 billing check rev 2.1 ACCEPTED by GPT** (docs only)
- GPT accepted rev 2.1 within its recorded scope (9 Nov 2026): both wording fixes present; all recorded billing findings closed. The expected $0 R2 increment stays conditional on total account usage, future Arts traffic included, staying within the allowances. The account evidence is Claude-supplied analytics, not independently inspected by GPT and not verified against an invoice. Workers Paid and R2 Paid remain separate subscriptions. Review acceptance only: no R2 upload, hub deployment, merge or page release is approved.
- Next for Arts, on Chad's choice: `Approve: upload ref/arts/met-R1-e394878.json (complete-file sha256 221bb1cab1c186a99972fdf936efddc22a298b6529abf30450ca0b3f4d219644) to R2` (Chad at the screen).

## 9 Nov 05:55 UTC (clock reading at write) — **R2 billing check rev 2.1** (docs only, after GPT's review of rev 2)
- GPT supports the account-wide headroom and the expected $0 R2 increment **as estimates** from the account evidence.
- Wording fixed: the pricing page states operation rounding ("If you have performed one million and one operations, you will be billed for two million operations.", re-read 9 Nov) — a crossed boundary above the allowance adds $4.50 (A) or $0.36 (B); the $0 is **conditional on total account usage, future Arts reads included, staying inside the allowances** (Arts reads consume the same Class B headroom). Account evidence, the 18 unknown-class operations (bounded at Class A) and the cache wording unchanged. For GPT. Nothing approved.

## 9 Nov 05:46 UTC (clock reading at write) — **thread handover** (Arts/timeline thread → next); R2 billing check rev 2; timeline rev 3.1 accepted
- **R2 billing check rev 2** (`reviews/2026-11-09-arts-r2-billing-check.md`, targeted read-only re-read 05:44 UTC): **account-wide** — one bucket (`mother-earth`; connector list and dashboard API agree); account-wide analytics show only it (Infrequent Access 0 B) plus 19 bucketless ListBuckets. 9.774 days: Standard peak 0.83 GB, Class A 24,355, Class B 31,802, **18 unclassified (left unknown; bounded at the Class A price)**. Projections: A ~7.5 %, B ~1 %, storage ~0.77 GB-month. Proportional estimates kept apart from **whole-unit invoice increments** (storage ≤ $0.015 per crossed GB-month; operations, if billed per million, ≤ $4.50 A / $0.36 B per crossing — only once an allowance is reached). Cache wording corrected (`arts.js` uses `no-store`: one Class B per request reaching the hub). Corrected conclusion: **expected $0.00, estimate, not verified against an invoice.** For GPT.
- GPT accepted **timeline rev 3.1** as a concept only (no route selected, no research).
- **Handover:** HANDOVER §1 rewritten (Arts candidate, billing check, timeline, enquiries, next approvals in order); START-HERE §4h added. Production unchanged; nothing approved for upload, deploy, merge or page release.
- **Mac sync (05:47–05:50 UTC, Chad granted the folder):** 5 new files copied; 6 differing destination files (HANDOVER, REGISTER, START-HERE, STATUS, R2-terms-access, R6-ozone) were each an earlier committed version (`5e37402`, `d4f86c7`, `4c53d3a`, `692455a`, `ab8e14c`, `643e309`), preserved to `_sync-preserved/20261109T054755Z/` and replaced. **185/185 tracked files identical to main `6413891`** (this entry and the HANDOVER row were then copied the same way). Branch-only Arts files are not on the Mac by design.

## 9 Nov 05:29 UTC (clock reading at write) — **Arts: read-only R2 billing check done** (`reviews/2026-11-09-arts-r2-billing-check.md`); **timeline rev 3.1** (docs only)
- GPT accepted the Arts cache/withdrawal correction; the implementation review stands.
- **R2 billing (read 05:20–05:30 UTC; analytics, not an invoice):** R2 is billed through its own **R2 Paid** subscription ($0 base, usage-billed), **separate from Workers Paid** ($5, no R2 component). Period 30 Oct 11:09 → 30 Nov. Published free tier (pricing page, updated 30 Oct): 10 GB-month, 1 M Class A, 10 M Class B. Usage so far (9.76 days): peak 0.83 GB, Class A 24,335, Class B 31,727. Estimates for the period: ~0.77 GB-month, ~75 k A, ~98 k B → **inside the free tier, expected R2 cost $0.00**. Arts adds +0.000128 GB-month, one Class A for the upload, and one Class B per switch-on that reaches the hub. Unknowns: the invoice, decimal vs binary GB, two unlisted actions (counted as B); the Worker-side line is not assessed here.
- **Timeline rev 3.1:** effort is unmeasured for both routes (W expected to need less initial extraction work, tracing could dominate); every written account is classified individually (T2-c contemporary · T2-r later recollection · T2-h later history · T2-s summary/structured), never by format; Route W gate lists every claim with one disposition, with support rates over checked claims only; untraced assertions are shown only as unverified source assertions. GPT supports Route W as the first option to consider — a recommendation, not a selection.
- **Nothing approved:** no upload, hub deploy, merge or page release. Production unchanged.

## 9 Nov 05:12 UTC (clock reading at write) — **GPT's implementation review of `arts-met-rc` recorded; Arts rollback wording corrected (branch `c5005c3`, docs only); timeline rev 3 (Route W added)**
- **GPT (independent, on `4c4bbb9`):** reproduced the complete 127,887-byte file byte for byte (sha256 `221bb1ca…9644`); confirmed the worker and page-file hashes; arts-hub 54/54, health-hub 29/29, history-hub 27/27, kp-degraded 29/29; all three weakened hub versions fail. **No blocking defect within that code and test scope**; `unreadable` accepted. The 90 browser checks remain Claude-supplied (not rerun by GPT).
- **Correction (review §5, branch):** response-cache lifetime (a new fetch may get the old file for ≤ 60 s) is separate from displayed-content lifetime (an already-rendered list stays until switched off or reloaded); a page revert reaches a viewer only on their next load. Page-first rollback stands. No code change; the branch hashes are unchanged.
- Still outstanding: R2 billing allowances, live hub/RC checks, served transfer size, performance measurements, actual-phone checks. **Nothing authorised: no upload, deploy, merge or page release.** Production unchanged.
- **Timeline rev 3** (`docs/concepts/TIMELINE-CONCEPT.md`): Route W (Wikipedia/Wikidata first) beside Route L (library first): source roles, pinned revisions and check dates, same-source ≠ independent, T2-c vs T2-s, four separate reuse questions, a bounded first gate (not run), a route comparison and how book mining could deepen or challenge the timeline. No source adopted or cleared.

## 9 Nov 04:54 UTC (clock reading at write) — **Arts candidate built on branch `arts-met-rc` @ `4c4bbb9`** (Chad's Approve line for a branch-only build; NOT merged, NOT deployed, no R2 write) — review `reviews/2026-11-09-arts-met-rc.md` (on the branch)
- **Approve line (Chad):** "Approve: Arts scoped feature per the Arts release proposal rev 2.1 — D1 authorise the fixed Met snapshot card only (one bounded exception; no domain selection, prototype or Phase A otherwise); D2–D8 as recommended; build arts-met-rc on a branch only — no merge, R2 write, hub deploy or page change." GPT had accepted rev 2.1.
- **Generated file** `phase1/arts/met-R1-e394878.json`, generated 2026-11-09T04:47:20Z: **file_sha256 `221bb1ca…9644`** (127,887 B); records_sha256 `067211d9…16cb2` (122,227 B, embedded byte-identically); reproducible with `--generated-at`. A first generation (`cb5f74b1…`) was superseded before upload after screenshots showed a borrowed country heading ("China / Iran"); headings now use the Met's text paired with the placing wording.
- **Hub 0.6.2 (branch):** `GET /snapshot/arts` serves the pinned file only if the whole file and the records hash match; 503 missing/unreadable/integrity/invalid otherwise; outside LAYERS, cron, D1, health and history. **Page (branch):** off-on-load "Met catalogue sample — places of making" card, label Catalogued, list by present-day country, sensitivity warning on every expanded object, Sources `#arts`, footer credit; new file `arts.js`; `?v=202611161000`.
- **Tests:** arts-hub 54/0 (3 breaks each fail), arts-ui 90/0 (6 breaks each fail), every other suite exits 0. Found and fixed during the build: `display:flex` overriding `hidden`.
- **Not verified:** Worker CPU in production, served size, R2 allowances, live RC, cold load before/after, iPhone Safari, screen-reader announcement. Next: GPT's implementation review; then R2 upload, hub deploy and page release, each on its own Approve line.

## 9 Nov 04:19 UTC (clock reading at write) — **Timeline concept rev 2 (GPT's review of rev 1; docs only)**; Arts rev 2.1 supplied to Chad for GPT
- Timeline: evaluation measures false matches/extraction errors only; missed passages unmeasured unless an independent reference set is chosen (not run); lineage = independent-with-evidence / known dependent / unknown, unknown never counted; gaps = measured corpus coverage / externally documented / unassessed; gate yields a research-only terms record + draft REGISTER wording, **no filing**; stage 1 bounded source selection with blocked/inconclusive allowed; T1 dates keep method and uncertainty. Separate from Arts and the research backlog.
- Arts: GPT had been given rev 2. The rev 2.1 text (commit `bfe3e99`) was sent to Chad as a file for GPT. No content change.

## 9 Nov 04:12 UTC (clock reading at write) — **Arts proposal rev 2.1 (docs-only amendment after GPT)** + **timeline concept written (concept only)**
- **Arts rev 2.1:** GPT supports rev 2 as the basis for a branch-only build, subject to two fixes, now applied: (1) `records_sha256` (= `snapshot_id`, `067211d9…16cb2`) kept separate from a **`file_sha256`** of the complete generated file, pinned at build; the hub validates the whole file before serving, and the R2 approval names that hash; (2) accessibility-tree checks described as verifying names, roles, expanded states and relationships, not screen-reader announcements (VoiceOver stays optional). GPT reproduced the records bytes/hash and the object-file hash; gzip 7,207 B (Claude, Python 3.13.18) vs 7,159 B (GPT, own tool), served size still a release measurement. Every expanded object must visibly carry the sensitivity warning. **Nothing built; no branch, R2 write, deploy or page change.**
- **Timeline concept** (`docs/concepts/TIMELINE-CONCEPT.md`): visitor experience, three-tier evidence model (physical/dated · what a source records · our computed matches), copy-chain and two-date rules, bounded gaps, access **leads** (Harvard public-domain corpus, LoC OCR packages, Europeana full text — not cleared), recommended first gate (water/flood accounts, one bounded period and region, small hand-checked passage set) — **not started**. Separate from Arts and the research backlog; does not select History or authorise Phase A.

## 9 Nov 03:46 UTC (clock reading at write) — **Arts release proposal rev 2 (GPT's review of rev 1 applied; docs only)**; enquiry record corrected; CO₂ review recorded
- **Arts rev 2** (`docs/research/P0-ARTS-RELEASE-PROPOSAL.md`): sampling stages exact (59,137 typed records in five departments → seeded 2,000 → 479 from four); source date (2 Nov, `e394878`) kept apart from processing dates (7 Nov commits); D1 = an explicit, bounded exception authorising this one public Arts card while the no-prototype/no-Phase-A decision stands for everything else; D2 separates disclosed limitations from the §7 engineering checks; cold-load and R2 cost claims corrected (R2 has its own allowances, not established; served size unmeasured); projection pinned (records 122,227 B, sha256 `067211d9…16cb2`, gzip 7,207 B); fixed-snapshot serving contract (integrity check, 503 unavailable state, outside freshness/collection/health/history); keyboard + `aria-expanded` checks; dependency-aware rollback with the pre-deploy hub version pinned at release; B/C described neutrally. GPT supports A, fixed snapshot, H1, "Catalogued", credit and Met links as **recommendations for Chad's decision, not decisions taken**. Nothing built.
- **Enquiries (rev 2 of the record):** CNEOS sent (`contact-cneos@jpl.nasa.gov`, pending); OpenSky, adsb.lol, Ozone Watch confirmed sent; USNO pending; **adsb.fi prepared, not sent**. OpenSky #837506 acknowledgement **supplied** — its hobbyist/public-site conditions recorded next to the REGISTER entry (summary as relayed; not blanket permission).
- **CO₂ (GPT, bounded code/record review, not a live-health pass):** supports keeping the Mauna Loa daily reading, preliminary/one-station labels and separately identified NOAA weekly comparisons; no expansion or provider enquiry recommended. A historical chart is a possible later proposal (omitted dates = unknown; preliminary revisions handled explicitly) — **not started**.

## 9 Nov 03:38 UTC (clock reading at write) — **Arts release proposal rev 1 (proposal only) + provider enquiries recorded** (docs only)
- **Enquiries (Chad):** OpenSky (ticket #837506), adsb.lol and NASA Ozone Watch sent; USNO (8 Nov) still pending. **Replies pending; sending grants no permission.** Record: `docs/research/ENQUIRIES-2026-11.md`. Chad's address and phone are kept out of this public repo. No duplicate or automatic follow-ups.
- **Aircraft reopened only for bounded terms/access and feeder clarification** (Chad). No building, purchase, installation or deployment; `aircraft-rc` stays parked.
- **Arts:** `docs/research/P0-ARTS-RELEASE-PROPOSAL.md` rev 1, for GPT. Recommends an off-on-load optional card with a list by present-day country (nothing drawn on the globe), a **fixed snapshot** pinned to Met commit `e394878`, served by the hub from R2 `ref/` (constitution). Every accepted limitation carried, including that the 479 are a **seeded sample** of the 59,137 typed-geography records. Published fields measured: 122,227 B JSON / 7,207 B gzip. Decisions D1–D8 open. **Arts unselected; no prototype, Phase A, branch or production change.**
- Unchanged: Life stopped; GIBS bench closed, no shadow record; inspiration list separate from the research backlog; all accepted reviews and approvals stand.

# 8 Nov 2026

*Timestamps (corrected 8 Nov, Chad): entry stamps marked "commit time" come from `git log` (the commit lands after the work); stamps without that label are measured readings. The earlier "~HH:MM" stamps on this day were estimates, 1–3 h out, and have been replaced.*

## 8 Nov 16:29 UTC (clock reading at write) — **Inspiration list filed** (docs only; Chad's go) — `docs/INSPIRATION-50-SITES.md`
- Chad's original 50-site list kept as inspiration, **outside the research backlog; queues no work**. Each item: suggested experience, evidenced connection, status (live / parked / researched-not-adopted / inspiration only). Six domains recorded as an organisational idea, not approved builds.
- Checked: **no feature is reviewed and authorised for implementation, and no completed candidate awaits production approval.**

## 8 Nov 16:10 UTC (commit time, `692455a`) — **GIBS stage 1 bench ACCEPTED by GPT and CLOSED** (`reviews/2026-11-08-gibs-stage1-bench.md` rev 2, recorded at `cca33e6`)
- Completed one-off research bench. GPT checked the revised write-up against the evidence it inspected earlier (no new requests, decoder runs or Worker measurements by GPT).
- PNG = promising tested route. Eligibility handling unresolved; **no tie margin or byte cap adopted**. Worker compatibility, CPU, memory, cost and production decoder readiness unverified.
- Bench item closed. Nothing further authorised (no measurement, shadow record, implementation, deployment or production change). All other approvals and parked/stopped decisions stand.

## 8 Nov 16:08 UTC (commit time, `cca33e6`) — **GIBS stage 1 bench rev 2 (GPT's review of `f7791b9` adopted; documentation only)**
- GPT inspected the saved evidence and independently recalculated: max per-image PNG/JPEG difference 0.20988 pp, median 0.08978 pp; raw ranking 12/14; a 0.25 pp tie-to-NOAA-21 rule gives the same choice in both formats on all 14 dates.
- Corrections: exact counts (36 PNG + 28 JPEG requests; **32 distinct PNG images**, all with recorded alpha 255; pixel cross-check on the **28** main-run PNGs only); **0.25 pp is a candidate, not a minimum or error bound** (largest signed-gap change ≈ 0.288 pp) — **no margin adopted**; opaque-black finding bounded (alpha cannot detect the unavailable-date case; not every case established; response size withdrawn; eligibility unresolved); decoder = feasibility only (no CRC / full chunk-structure checks); FIRMS CPU comparison removed — Worker compatibility, CPU, memory and cost unverified; "four days" → five.
- No shadow record, threshold, implementation, deployment or production change.

## 8 Nov 16:00 UTC (commit time, `f7791b9`; run measured 15:55–15:59) — **GIBS stage 1 bench (one-off, read-only; Chad's go)** — `reviews/2026-11-08-gibs-stage1-bench.md`, for GPT
- Browser pane (Chad's Mac), 15:55–15:59 UTC; 25 Oct – 7 Nov, NOAA-20 vs NOAA-21, 512×256 PNG vs the page's 2048×1024 JPEG (~60 GIBS requests, once). Evidence `reviews/evidence/2026-11-08-gibs-stage1-bench/`.
- **PNG served:** HTTP 200 `image/png`, 8-bit RGBA, 202–287 KB. **Alpha always 255**; a day with no imagery (9 Nov) = 1,204 B, 100 % opaque black → no-data is not signalled by alpha; dark-area score = near-black share; ineligibility needs another signal (§5 revision for review).
- **Ranking agreed 12/14**; flips on 28 and 29 Oct, both with satellite gaps ≤ 0.22 pp; per-image PNG–JPEG difference ≤ 0.21 pp (median 0.09). 0.25 pp = a candidate only *(rev 2: not adopted, not an error bound)*.
- **Decoder** (DecompressionStream + un-filter) exact vs the browser on the 28 cross-checked PNGs *(rev 2 corrected count)*; bounded-decoding negative controls rejected. Time per image: pane median 3.2 ms; local Node median 10.0 ms wall / 10.4 ms CPU. **Cloudflare Worker CPU not measured** (needs a deployment).
- 7 Nov images changed between the 03:56 and 15:55 reads (N20 8.8 % → 6.9 %), supporting re-measurement after the decision.
- No shadow record, threshold, fallback, branch, deploy, resource, schedule or page change. Bench code kept as a temporary research tool in the evidence folder.

## 8 Nov 15:50 UTC (commit time, `ab8e14c`) — **R2 terms review rev 2 (GPT's review of `f6b8093` adopted; docs only)** — `docs/research/R2-terms-access.md`
- **X1:** GPT's direct extraction + browser reading of SSD FAQ #a05: "No permissions are needed. The data provided on this site are considered public domain." (+ no endorsement, cite SSD with retrieval date/title/URL, identify modifications, fair-use guidance). **The accepted 5 Nov reading is restored as corroborated.** Rev 1's contrary reading came from Claude fetch summaries — kept only as an uncorroborated extraction discrepancy; no claim the site changed or the earlier review was wrong.
- **X2:** general Caltech/JPL notice (documents may be protected; reproduction may require permission; Caltech manages JPL) recorded alongside, not substituted for, the specific SSD data statement. **X3:** CNEOS catalogue + lightcurve pages — government-sensor data for public release, not verified/reanalysed, revisable; no separate commercial statement. **X4:** citation/modifications/no-endorsement are provider-stated (FAQ); crediting CNEOS + underlying sensors is a project choice.
- API conditions verified (caching "where practical"; no-embedding concerns the APIs, not publishing downloaded data; no numerical limit).
- Scope as interpretation: S1 (API catalogue) plausibly covered; S2 (lightcurve files) not established. Research-only REGISTER draft §4, **not filed**. Identity/validation gates open.

## 8 Nov 15:46 UTC (commit time, `f6b8093`) — *(superseded by rev 2 above: the FAQ conflict was an uncorroborated Claude fetch summary)* **R2 fireballs terms/access review rev 1 (read-only; Chad's go, R2 only)** — `docs/research/R2-terms-access.md`, for GPT
- Products/routes already sampled: Fireball API v1.2 (`ssd-api`), CNEOS lightcurve index + one report (`cneos`). No sampling, contact, route selection or implementation; identity and validation gates open.
- **⚠ Conflict found:** the SSD FAQ (8 Nov, two fetches) answers the publishing-permission question "The short answer is yes", places most content under JPL's copyright statement, prefers links, and has **no "public domain" wording**. This contradicts the accepted 5 Nov reading ("public domain, no permission needed"), which is now **not relied on** pending verbatim extraction (X1, X2). Marked in RESEARCH-BACKLOG §R2 A.
- API fair-use conditions explicit (one request at a time, reasonably necessary, cache, User-Agent with contact, back off, no website embedding; JPL may rate-limit/throttle/block); no licence text; **no numerical limit found (≠ unlimited)**.
- JPL Image Use Policy = images/video only (not applied); data.gov record = a different legacy distribution, access "public", no licence field. Public release / public access / credit ≠ commercial permission. U.S.-government-work default not available (JPL is Caltech-managed; general knowledge, labelled).
- Pending extraction X1–X4 (FAQ verbatim; JPL copyright statement; CNEOS fireball + lightcurve pages; source of the 5 Nov attribution guidance), X5 supplementary. **No REGISTER draft** until the conflict is resolved.

## 8 Nov 15:40 UTC (commit time, `643e309`) — **R6 terms review rev 5: GPT wording corrections (docs only)**
- §9.1: an evidence gap, not an absent route ("…does not establish that these two files are distributed through ESDIS or covered by its data-use guidance"). §9.4: applicability of the ESDIS guidance and NASA media guidelines not established; input terms not by themselves permission; privacy notice no applicable grant. Carried into the table and REGISTER draft; §6's older "likely free to reuse with credit" assumption replaced by a cross-reference to §9.
- GPT: the research-only REGISTER draft is technically acceptable as an unresolved evidence record. **Not filed; not authorised**; clears no commercial reuse, cadence, integration or building. Technical gates unchanged; R3 reply-pending.

## 8 Nov 14:08 UTC (commit time, `4b43c1b`) — **R6 terms review rev 4: extraction complete; corrected packet for GPT (docs only)** — `docs/research/R6-ozone.md` §9
- P1–P5 read by **GPT on Chad's behalf**. Disclaimers: no commercial-reuse grant or limit; methods may change, versions not all archived; interpolation for visualisation/area only, never minimum; research-only caution = GMAO GEOS forecasts only. Footer notice → redirect to nasa.gov/privacy (not licence evidence). Homepage credit request verified. Contacts: affiliations establish neither authorship nor copyright. GMAO: no applicable grant; products-page login is that page's limitation only.
- Corrections: §9.4 now separates the requested credit from permission for commercial redistribution; the rev-3 authorship inference from a contact's affiliation is withdrawn.
- **Commercial reuse UNRESOLVED — no applicable grant established in the inspected sources; not a finding of prohibition.** No numerical limit found in the named pages/dates (≠ unlimited). Research-only REGISTER draft §9.6, **not filed**. R3 email reply-pending; silence grants nothing.

## 8 Nov 13:59 UTC (commit time, `132b646`) — **R6 ozone terms/access review rev 3 (read-only; Chad's go, R6 only)** — `docs/research/R6-ozone.md` §9, for GPT; **USNO email recorded (R3)**
- **R3:** Chad sent the USNO enquiry to `eopcp@us.navy.mil` on 8 Nov (commercial reuse; storage/reformatting/redistribution; IERS mirror; attribution; one automated download per day). **Reply pending; no permission inferred from sending or silence**; R3 reuse stays UNRESOLVED (`R3` §9.4a). No follow-up or further R3 work.
- **R6:** evidence split into reuse, attribution, automated access, numerical limits. Ozone Watch's credit request confirmed ("Please credit all material to "NASA Ozone Watch" unless otherwise noted."); no licence found. NASA's CC0 (ESDIS-scoped), the OMPS input record and NASA media guidelines read but **not applied to the derived files** (scope). No numerical limit found (≠ unlimited). Commercial use not established; not a finding of prohibition.
- **Pending extraction (allowlist):** Ozone Watch disclaimers, the footer's NASA notices target, Ozone Watch homepage (required); contacts, GMAO input terms (supplementary). GPT may extract on Chad's behalf. No REGISTER draft yet.

## 8 Nov 13:36 UTC (commit time, `cb1e7e7`) — **R3 terms review rev 4: extraction complete; research-only REGISTER draft for review (docs only)** — `docs/research/R3-earth-rotation.md` §9
- E1–E5 independently inspected by **GPT on Chad's behalf** (GPT is the reader). Data-centre "Legal and Privacy" link 404; current IERS legal notice: BKG responsible for the website, no data licence/citation/limit (website only, not product rights); `maia` carries "Distribution Statement A… distribution unlimited" and has no separate site notice; IERS XML metadata: free of charge, `dataSetURI` → `maia`, no constraint elements (≠ unrestricted); products/FAQ: downloads, alternatives, checksums, no scripted-download rule or limit.
- **A6 (IAG terms) withdrawn:** a news article's own footer was misattributed to IERS.
- Position: public distribution supported; **commercial reuse not yet established (not a finding of prohibition)**; U.S.-government-work reasoning an inference requiring assessment; product rights kept separate from website conditions and route.
- §9.6 REGISTER draft, commercial use UNRESOLVED; **not filed**. No route, provider contact, other investigation, R6 or GIBS.

## 8 Nov 13:29 UTC (commit time, `4c53d3a`) — **R3 Earth rotation terms/access review rev 3 (read-only; Chad's go, R3 only)** — `docs/research/R3-earth-rotation.md` §9, for GPT
- Evidence separated into reuse/commercial, attribution, automated-access guidance and numerical limits; evidence, interpretation and unanswered questions kept apart. No data fetched, no provider contact, no route selection, no implementation.
- Read 8 Nov (Claude fetch summaries): NASA Earthdata data-use guidance (non-NASA data via CDDIS follow the sponsoring organisation's terms); USNO AA and navy.mil notices ("public information… unless otherwise specified"), **scoped to their own sites, not extended to `maia`**; an IAG/GGOS post on the IERS site relaunch (secondary).
- **No numerical rate/cadence/load limit found** in the pages inspected (≠ unlimited).
- **Pending extraction (Claude's tools refused by allowlist):** IERS data-centre EOP page, IERS legal/terms, USNO `maia` site notice (required); data-centre metadata and USNO FAQ (supplementary). GPT may extract on Chad's behalf. No REGISTER entry drafted until then.
- Mac sync rule added to START-HERE §3: preserve differing destination copies before overwriting; report differences; a post-copy hash match proves nothing about earlier local edits.

## 8 Nov 13:19 UTC (commit time, `d4f86c7`) — **R4 Argo: terms round CLOSED; REGISTER entry FILED** (docs only; Chad: "Approve: make these documentation corrections and file the corrected Argo REGISTER entry")
- **GPT's review of rev 7:** accepted the dataset-level CC BY evidence and GDAC linkage, supported synchronisation routes, the narrowly stated absence of a numerical limit, the attribution plan and the preserved non-terms gates. S4 (Ifremer policy) supplementary, not needed while not relied on.
- **Rev 8 corrections:** provenance throughout = "GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet" (Chad did not personally inspect the pages); §12.4's Ifremer exclusion now stated as Claude's unverified fetch summary, unestablished, not relied on; §§8, 10.1, 11.1, 11.5.1 marked historical, superseded by §12.
- **REGISTER.md:** Argo GDAC entry filed, with the labelled licence-scope inference, CC BY attribution (credit, licence link, DOI, modifications), supported routes (rsync, `aws s3 sync`) and "no numerical limit found" (not unlimited). Research only.
- Accepts the scoped terms conclusion only: no route, collector, build, resource, schedule, deploy or page change. R4 technical gates open; R2, R3, R6 untouched; other approvals and parked/stopped decisions stand.

## 8 Nov 13:13 UTC (commit time, `43e4881`) — **R4 terms review rev 7: evidence packet filed (docs only)** *(provenance corrected in rev 8: GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet)* — `docs/research/R4-argo.md` §12.5–12.6
- **R1 (required, SEANOE, checked 8 Nov):** Licence section links to CC BY 4.0; acknowledgment sentence verbatim; additional-access GDAC link to `https://data-argo.ifremer.fr/`.
- **S1 Sextant** (field values verbatim; use-limitation paragraph a summary) · **S2 Data Access** ("The synchronization service is available from Ifremer 'rsync' and from 'aws s3 sync'.") · **S3 US GODAE disclaimer** (public-domain sentence with "unless otherwise specified" preserved; not used to override dataset terms).
- **S4 Ifremer policy: PENDING, unverified.** Recorded URL 404; corrected filename `R2-D1-Instruction PDG 2023-0550 …pdf` (GPT); no readable text yet. The provisional French quotations are not filed as verified.
- Proposed REGISTER entry updated from the pastes; **not filed**. No route selection, build clearance or other research.

## 8 Nov 12:44 UTC (commit time, `0939710`) — **R4 terms review rev 6 (GPT's review of `5b33a52` adopted; docs only)** — `docs/research/R4-argo.md` §12
- GPT independently inspected the official sources: useful bounded progress; **no building clearance**.
- Corrections: (1) automated access is evidenced (Data Access page offers Ifremer rsync and AWS sync, incl. floats and indexes); the open point is **no numerical rate/cadence/load limit found in the pages inspected** (named, dated). (2) Licence scope: CC BY 4.0 on the DOI record, which links `data-argo.ifremer.fr` as additional access; missing per-file wording is not a separate blocker; live-collection scope uncertainty kept explicit. (3) Sextant: Access constraints "Other restrictions", Other constraints "No limitations on public access", Use constraints empty; use limitation kept separately. (4) Attribution per CC BY 4.0: credit, licence link, DOI/dataset link, modifications where applicable. (5) Evidence status per page: GPT read Data Access + US GODAE (disclaimer's scope/exceptions preserved, not used to override dataset terms); Ifremer policy PDF unverified by GPT, provisional, incl. its application to real-time files.
- Paste pack cut to 1 required (SEANOE) + 4 supplementary. REGISTER unfiled. Non-terms gates and parked/stopped decisions unchanged.

## 8 Nov 12:35 UTC (commit time, `5b33a52`) — **R4 Argo terms/access review rev 5 (read-only; Chad's go, R4 only)** — `docs/research/R4-argo.md` §12, for GPT
- Read 8 official pages (web-fetch summaries, so quotations are provisional until Chad pastes them). No data files, sampling, provider contact, implementation, resource or production change. R2, R3, R6 not touched.
- **New:** the general DOI record (SEANOE 10.17882/42182) states **CC BY 4.0**; Ifremer's catalogue record for the GDAC (listing `data-argo.ifremer.fr`) says "No limitations on public access"; Ifremer policy DG/2023.0550 allows reuse for any purpose with source + last-update date credited.
- **Still open:** no published automated-access/rate policy for Coriolis or US GODAE; the live HTTPS files carry no licence of their own; US GODAE and argodatamgt.org Data Access unread (tool allowlist) → paste session §12.4 (7 items, Chad at the screen).
- Proposed REGISTER entry in §12.5, **not filed**. Terms clarification does not clear R4 for building; non-terms gates unchanged.
- **GIBS summary corrected** (backlog view row): proposal rev 3, stage 1 = same-date selection with no threshold *T*; day-before fallback a later, separate decision; bench and shadow record not authorised.

## 8 Nov 12:22 UTC (commit time, `114f9f5`) — **thread handover** (Kp / smoke-test thread → backlog thread). HANDOVER rewritten (§0 live state, §0a smoke testing, §1 next).

## 8 Nov 12:10–12:19 UTC — **GPT independent live smoke test of `ad4002b` + hub 0.6.1: no blocking regression in the checks completed** (not exhaustive)
- Confirmed:
  - hub 0.6.1; all four served page files = reviewed `86134b8`; all eight health endpoints HTTP 200, healthy=true;
  - Kp card and Sources agree (3.33, interval 09:00–12:00 UTC, current); wording fits at 360/390/430/1280 px without page overflow;
  - no obsolete "source flagged/degraded" wording or NaN in inspected rendered text;
  - coordinate search, ship/fire inspectors, 0.51 MW precision;
  - real globe click → Everything here; panel-only buoy loading leaves the globe layer off;
  - buoys, microplastic, computed day/night load;
  - all three orbital categories render and switch off; counts reconcile to the current 32,645-object file, with 6 propagation failures and 547 unknown-type disclosed;
  - fresh post-noon imagery label and request both 7 Nov NOAA-21;
  - no warning/error entries in inspected logs.
- **Limits:**
  - no naturally degraded path and no injected browser-state test: those paths rest on the reviewed local tests;
  - no real-phone/Safari test;
  - Claude's before/after-noon transition remains Claude-supplied; GPT independently confirmed the post-noon state.
- No production changes. Existing approvals and accepted gates stand.

## 8 Nov 11:53–12:06 UTC — **Noon UTC imagery rollover: PASS** (read-only; smoke-test open item; browser pane, Mac unattended)
- Live page = main `ad4002b` (assets `?v=202611151000`). The booked prompt said `3375e91`; the imagery logic is unchanged between the two.
- **Correction:** `IMG_DAY` = now − 36 h rolls **6 → 7 Nov** at 12:00 UTC on 8 Nov, not 7 → 8 as Claude's booking note said.
- **Before noon** (fresh load, 11:53:21): `IMG_DAY` 2026-11-06, label "Imagery 06 Nov / NOAA-21 · not live". The one GIBS request: `TIME=2026-11-06`, `VIIRS_NOAA21_CorrectedReflectance_TrueColor`. They match.
- **After noon** (fresh load, 12:05:30): `IMG_DAY` 2026-11-07, label "Imagery 07 Nov / NOAA-21 · not live", request `TIME=2026-11-07`, 2048×1024. Label and request rolled together.
- **The image itself** (same URL, no-store, 12:05:40): HTTP 200, `image/jpeg`, 546,723 B, 2048×1024. Near-black (R, G, B < 12): 30°S–30°N **0.2%** (= the 8 Nov review's 7 Nov NOAA-21 figure), 66.5°S–66.5°N 2.8%, global 15.2% (incl. polar night).
- **Open page (confirms GPT's point):** a tab loaded at 11:53 still showed 06 Nov at 12:05:02, with label and request still agreeing. An already-open page does not roll over until reloaded. That is current behaviour, already noted in the GIBS proposal rev 3 §4; no fix authorised or made.
- Smoke-test items still open: actual-phone test, browser HTTP status codes.

## 8 Nov 08:16 UTC (commit time, `96c52a1`) — **`place-ui-harness` merged into main** (`96c52a1`, no-ff of `601b899`; Chad's go; GPT technical sign-off)
- Test-only: `phase1/place-ui.test.cjs` + its review. No page, hub or production change.
- **place-ui 30/30 on main** (was 28/30 since the FIRMS merge); kp-degraded 29/29 on the merge.
- Branches: Chad deleted `kp-degraded`, `gibs-noaa21` and `place-ui-harness`; GitHub now shows only `main` and the parked `aircraft-rc` (recorded in `c2eb13d`, 08:17 UTC commit time).

## 8 Nov 08:11:22 UTC — **PAGE RELEASED: Kp interval + honest degraded wording** (main `ad4002b`, no-ff merge of `kp-degraded` @ `86134b8`; Chad: "Approve: push kp-degraded to main (page change: Kp interval + honest degraded wording)")
- No overlap with main's docs-only changes. Merged page files = the reviewed commit (index `b9d4649e1ac6`, app `e3f4a3854113`, sources `7d66228f07b8`, style unchanged `e4c9547d99bf`); kp-degraded 29/29 on the merge.
- **main's `phase1/worker.js` = live 0.6.1** (`f38296a0…`), so **main = live** again.
- **Served hashes verified** 08:13:11 UTC (pane, no-store): all four = the reviewed values; assets `?v=202611151000`.
- **Live read** 08:13:42 UTC:
  - Kp card "interval 03:00–06:00 UTC, began 5.2 h ago; 3-hourly product, timestamped at the interval start", **current**;
  - summary "Kp 3.33, interval 03:00–06:00 UTC, began 5.2 h ago (NOAA SWPC)";
  - no "source flagged/degraded" and no NaN on the page; no console errors; imagery chip unchanged (06 Nov, NOAA-21).
  - Pane hidden (Chad away): text and logic checked, not pixels. The degraded wording is proven by tests, not yet seen live (no layer degraded).
- **Rollback:** page = revert `ad4002b` on main (Approve line); hub = redeploy 0.6.0 `ac173d8a…` (Approve line). The two are independent.
- Branch `kp-degraded` can be deleted on GitHub (Chad). `place-ui-harness` is still awaiting Chad's merge decision.

## 8 Nov 08:09–08:12 UTC — **hub 0.6.1 first runs verified + live RC check of the page branch: PASS** (read-only)
- **First 0.6.1 Kp run (08:07:59 UTC): `ok`** for the value 03:00 UTC at **5.13 h** past its interval start. The old rule called this degraded (07:07 run, 4.13 h).
  - Envelope: `status_reason: null`, `interval_end 06:00Z`, `age_reference "interval start (time_tag)"`.
- **D1, every run since the deploy is `ok`:** swpc 1, usgs 2 (`status_reason: null`), firms v2 1 (08:00, 1.1 MB raw), co2 1, drifters 1.
  - forest, seaice and Mac ships not yet run on 0.6.1 (next scheduled ticks).
- Health **8/8** at 08:09.
- **Live RC check** (clean pane tab; `kp-degraded` @ `86134b8` files from raw.githubusercontent, sha256 matched: index `b9d4649e1ac6`, app `e3f4a3854113`, style `e4c9547d99bf`; blob-injected; the live page untouched) against live 0.6.1 data:
  - Kp card: "interval 03:00–06:00 UTC, began 5.2 h ago; 3-hourly product, timestamped at the interval start", **current**;
  - summary: "Kp 3.33, interval 03:00–06:00 UTC, began 5.2 h ago (NOAA SWPC)";
  - no "source flagged/degraded" and no "NaN" anywhere on the page; all layers current (forest partial by design); no console errors.
  - Pane hidden (Chad away), so this checks text and logic, not rendered pixels.
  - The degraded wording paths are covered by the tests, not seen live: no layer is degraded right now, which is the expected outcome.
- **Next:** Chad's `Approve: push kp-degraded to main (page change: Kp interval + honest degraded wording)`, then served-hash check + live read.

## 8 Nov 07:58:25 UTC — **HUB 0.6.1 DEPLOYED** (Chad: "Approve: deploy hub 0.6.1 from 86134b8 (content only)")
- **What:** `phase1/worker.js` from `kp-degraded` @ `86134b8`.
  - sha256 `f38296a0183d14d958d5815d7926254cb4275be7ca00b384334974fad5b12cc8`, checked in the pane from raw.githubusercontent before upload.
  - Content-only API from the dashboard pane, HTTP 200, etag `b231d47a…`. Claude's upload passed on the Approve line.
- **Verified (read-only, pane):**
  - read-back worker.js part sha256 = `f38296a0…` (exact);
  - `/` = **0.6.1**, history collecting;
  - health **8/8** (07:59:01; baseline 07:57:58 on 0.6.0 also 8/8);
  - **19 bindings unchanged**; variables as before (`FIRMS_PIPELINE=v2`, `FIRMS_CREATE_ONLY=verified`, `HISTORY_ENABLED=1`, …).
- **Baseline before the deploy:** swpc `degraded` at 07:07 (value 03:00 UTC, 4.1 h past its interval start: the false signal being fixed).
- **Pending:** first 0.6.1 swpc run (08:07 UTC) and the other layers' first runs; then the live RC check of the page against 0.6.1.
- **Rollback** = redeploy 0.6.0 (`ac173d8a…`, = main's worker.js), with an Approve line. **main is now behind the live hub** until `kp-degraded` is merged (the page release).

## 8 Nov 07:56 UTC (commit time, `9882b71`) — **GPT technical sign-off: `kp-degraded` @ `86134b8`**
- Independently verified by GPT:
  - kp-degraded 29/29 and health-hub 29/29;
  - the SHIPS_ROUNDED break fails the intended generated-fields test;
  - app syntax and worker module loading;
  - worker sha256 `f38296a0183d14d958d5815d7926254cb4275be7ca00b384334974fad5b12cc8`.
- No blocking issue found. Broader regressions remain Claude-supplied; **no live validation yet**.
- Policy and order stand: provisional 7.5 h; 5 min skew tolerance; **separately approved hub deploy → live RC check → separately approved page release**.
- This is technical sign-off, not Chad's merge or production approval.

## 8 Nov 07:33 UTC (commit time, `86134b8`) — **Kp/degraded fix rev 3 on `kp-degraded` @ `86134b8`** (focused, after GPT's review of `0513aa7`; NOT merged, NOT deployed)
- **GPT verified `0513aa7`:** kp-degraded 28/28, health-hub 29/29, app syntax, full worker hash. The Kp rendering, USGS unknown age and evidence corrections address its findings.
- **The one remaining issue, fixed:** the cloud collector rounded its reason fields before publishing (75.04 s → 75; 0.8999 → 0.9), which contradicted the stated condition.
  - New `shipsReason` publishes them unrounded.
  - The Mac collector is unchanged. When its tenths-rounded duration equals the limit, the page says "exceeded our 75 s limit … reported duration rounded to 0.1 s", with no invented digits.
  - Tests now run the hub-generated, JSON round-tripped fields through the renderer.
- **Tests:** kp-degraded 29/29. Breaks: rev 2 rounding → fail; rev 2 app.js → 2 fail. All regressions pass except the known place-ui 28/30. worker.js sha256 `f38296a0…`.
- GPT: the provisional threshold, skew tolerance and release order remain acceptable. **Next:** GPT re-review of `86134b8` → `Approve: deploy hub 0.6.1 from 86134b8 (content only)`.

## 8 Nov 07:04 UTC (commit time, `0513aa7`) — **Kp/degraded fix rev 2 on `kp-degraded` @ `0513aa7`** (after GPT's independent review of `67140b0`; NOT merged, NOT deployed)
- **GPT verified on `67140b0`:** kp-degraded 21/21, health-hub 29, history-hub 27, firms-guard 19, firms-v2 57+7 skipped, ships-late 7, the old-rule break, syntax/module load and the worker hash. GPT stopped ships-fallback early; no result claimed. Other browser regressions remain Claude-supplied.
- **Fixed per GPT:**
  1. Invalid or future Kp timestamps leaked into the card and summary. `ME.kpWhen` now guards interval + age together: "interval time unknown — …" or "timestamp later than our clock". Tested on the real readings/report output.
  2. A missing USGS generation time was described as expired. It now has its own reason, `feed_age_unknown` (still degraded), with unknown-age wording, plus a collector-to-page test.
  3. Ships rounding hid the condition (76 s → "1 min", 89.9% → "90%"). Now seconds with limit-aware precision, the percentage rounded down, and "below our 90% standard"; cloud and Mac both tested at the boundaries.
  - Also: exact 300 s / 301 s skew boundary tests. The withdrawn "source on schedule" claim is removed from the worker comment; the synthetic-ages test is renamed (not a replay of the 102 runs).
- **Tests:** kp-degraded 28/28.
  - Breaks: `67140b0` → 10 fail; main's app.js → 13 fail; old rule → 8 fail.
  - All regressions pass except the known place-ui 28/30.
- **Policy (GPT):** 7.5 h = a provisional Mother Earth policy, not a NOAA deadline; 5 min = an explicit skew tolerance. Release order: hub → live RC check → separately approved page.
- **Next:** GPT re-review of `0513aa7` → `Approve: deploy hub 0.6.1 from 0513aa7 (content only)`.

## 8 Nov 06:34 UTC (commit time, `67140b0`) — **Kp/degraded fix built on branch `kp-degraded` @ `67140b0`** (Chad's go; NOT merged, NOT deployed) — review `reviews/2026-11-08-kp-degraded-fix.md` (on the branch)
- **Hub 0.6.1:**
  - `kpStatus`: degraded at ≥ 7.5 h past the interval start (provisional); invalid or future `time_tag` → degraded with its own reason.
  - Envelopes carry `status_reason` (swpc, usgs, co2, seaice, cloud ships); Kp's `index` gains `interval_start`/`interval_end`.
  - No other rule or threshold changed; Mac collector unchanged.
- **Page:** "the source flagged…" and "source degraded" removed. The fires summary had the same phrase, found by the new test. `ME.degradedWhy` names our rule per layer; ships say which sampling condition applied, never "late"; an unknown reason gets neutral wording. Kp shown as an interval. Assets `?v=202611151000`.
- **Tests:**
  - new `kp-degraded` 21/21, including the boundaries, invalid and future time_tags;
  - breaks: old 4 h rule → 7 fail; main's app.js → 8 fail;
  - all hub + UI regressions pass, except the known place-ui 28/30 (harness fix on its own branch);
  - health-hub H8 version pin loosened (the test's intent kept).
- **Next:** GPT review → Approve: hub 0.6.1 deploy → live RC check → Approve: page release. 7.5 h stays provisional.

## 8 Nov 06:13 UTC (commit time, `9d2adab`) — **GPT's second review of `add3206` applied (docs only)**
- GPT accepted the main Phase 0, Kp and backlog corrections; harness sign-off confirmed tied to `601b899`; Arts department counts confirmed against the saved results.
- Five remaining edits applied:
  1. Phase 0 §3 is now "Outstanding measurements — pending Chad's availability". The Backlog §C dependency on the iPhone runs is removed. Claude's pane cell-selection check (588 px) is kept distinct from the pending actual-phone check.
  2. Kp inventory: Mac ships are degraded on **either** a flowing fraction < 90% **or** an overlong sample (both in `collector-mac.mjs`).
  3. GIBS: `IMG_DAY` is computed once at page load, so open pages don't roll over. The proposal now specifies recompute + re-read `/backdrop` on the 5-min refresh tick (or reload-only, Chad/GPT to choose). Rollback and "immediate default" timings are qualified for open pages.
  4. GIBS wording matches the rule, including the tie case ("NOAA-21 kept by our rule…", even if slightly higher). The **dark-area score** (near-black + no-data) is named separately from the raw near-black share. The band is 66.5°S–66.5°N throughout; the 8 Nov 30°S–30°N evidence is labelled as motivation only.
  5. HANDOVER item 4: the old "most complete… else previous day" idea is marked SUPERSEDED.
- GPT: the Kp branch work is a sensible next step **for Chad to authorise**, with implementation and wording returned for review before merge or production approval. This review starts no work. No iPhone session today; no prototype or Phase A.

## 8 Nov 06:06 UTC (commit time, `add3206`) — **GPT's review of the morning's work applied (docs only; nothing authorised beyond)**
- **place-ui harness `601b899`: GPT technical sign-off.** The fake `head()` supplies the UTF-8 size and metadata the legacy-reader checks need. Worker hash = live 0.6.0; no production or page change. Syntax checked independently by GPT; suite results and the break check remain Claude-supplied evidence. **Merge awaits Chad's decision.**
- **Smoke follow-up:** qualifications confirmed by GPT. It supplements GPT's independent test, and GPT has not repeated those browser checks.
- **Phase 0 recommendation → rev 2** (GPT's six revisions):
  - "only cleared expansion candidate among those assessed in this round";
  - per-object "sensitivity not fully assessed", source restrictions, present-day countries ≠ historical nationality;
  - 5 typed departments vs 4 in the final view (American Wing 326, Islamic 72, Medieval 43, Cloisters 38);
  - Planet = 7 Nov pre-NOAA-21 transfer/load baseline, not input responsiveness or tolerances;
  - waiting for the iPhone is a suggestion, not a prerequisite;
  - unsupported phone-cost claim removed; VoiceOver baseline separate.
  - No gate reopened; the 5.09 s cold load confirmed as correctly rounded.
- **Kp finding → rev 2** (GPT: diagnosis supported, threshold provisional). GPT's smoke report ("Kp degradation explicitly disclosed") is preserved unchanged; this finding is appended to it.
  - `kp_index.retrieved_at` = our first retrieval, not NOAA's publication time. The "every degraded run on schedule" claim is withdrawn.
  - The 7.1 h maximum was unsupported and is removed; the largest observed age is 6.13 h.
  - 7.5 h past interval start is a provisional candidate, not a source deadline. With hourly polling a missing value is first flagged ~2 h after it was due (~8.13 h). Boundary/invalid/future test cases listed.
  - Inventory of `degraded` on every active layer (usgs, swpc, co2, seaice = freshness rules; forest = sweep; ships = sampling quality): wording to be fixed across all of them, ships keeping its own reason.
  - Kp's timestamp described as the interval start.
- **GIBS proposal → rev 2:**
  - the measured criterion is "near-black share" (appearance, not completeness); illumination not equalised;
  - no-data / failure / bounded-decoding handling specified; rankings compared, not just percentages; tie margin set from the bench (0.5 pp withdrawn);
  - same-date selection only (day-before = Chad's later decision);
  - rollback bounded to the current image day, with an immediate-default option (a) or (b) for Chad;
  - pane/workspace shadow record separated from a deployed hub job; 7 days = provisional only; cost unverified; D1 history optional.
- **Backlog view → rev 2:**
  - R2 also has open identity/validation/acceptance rules, and a terms review clears nothing;
  - R11 is an unmeasured question;
  - order: Kp correctness first, then a choice between the terms review and the GIBS bench (neither started).
- Not authorised by this review: implementation, research restart, merge, deploy, shadow job, resource creation. FIRMS closed; Arts scoped-cleared, unselected; Life stopped; aircraft parked (research included); no prototype or Phase A.

## 8 Nov 06:00 UTC (commit time, `57debf2`) — **Backlog view written** — `docs/BACKLOG-VIEW-2026-11-08.md` (for Chad's choice; nothing started)
- One page over R1–R11 plus the open hub/page items. Observation: R2, R3, R4 and R6 all parked on terms/access, not data. Claude's suggested order: Kp fix → a read-only terms pass over R2/R3/R4/R6 → GIBS bench + shadow week → new first gates.

## 8 Nov 05:59 UTC (commit time, `5013943`) — **GIBS measured fallback rule: PROPOSAL written** (HANDOVER item 4; design only) — `docs/GIBS-FALLBACK-PROPOSAL.md`
- Hub job picks the more complete of NOAA-21 / NOAA-20 (near-black share, 66.5°S–66.5°N) for the latest day, else the day before. It publishes `latest/backdrop.json` + `GET /backdrop`; the page follows, or uses the fixed NOAA-21 default if it is unavailable.
- Threshold *T* is not chosen: it needs a bench (PNG decode in a Worker, small-vs-full agreement, CPU) and a ~7-day shadow record first, each on Chad's go.
- Staged rollout with Approve lines; rollback = remove `BACKDROP_ENABLED`. Expected cost $0 (to be measured). Open questions §9. For GPT.

## 8 Nov 05:58 UTC (commit time, `5f877e9`) — **Finding: Kp "degraded" is a false signal** (read-only; no change) — `reviews/2026-11-08-kp-degraded-finding.md`
- 69% of swpc runs since 4 Nov (70/102) were `degraded` while NOAA delivered on schedule. The 4 h rule ignores that `time_tag` is the interval start: on-time values appear at 3.13 h (31/33; 2 at 4.13 h) and age to ~6.1 h.
- The page says "the source flagged this observation as degraded" / "source degraded". The flag is our hub's rule, not NOAA's, so that wording is untrue. The same reason text applies to every layer the hub marks degraded.
- Values and dates shown are correct; no swpc monitor exists, so no false alerts. Fix options (threshold ~7.5 h; honest wording) in the finding; each needs review + Chad's approval.

## 8 Nov 05:47–05:50 UTC — **two of the smoke test's open checks done (read-only, Claude, browser pane)**; Mac copies synced
- **Conditions:** Claude desktop browser pane (Chromium), 588 × 834 = the phone layout, **not a real phone**; live page main `3375e91` assets, hub 0.6.0. Pane visible.
- **"Everything here" cell selection — PASS.** A real click on the globe opened a forest cell inspector (cell 17_35). Its "Everything we hold for this cell, all layers" link opened **Everything here · cell 17_35** with the expected rows:
  - the qualified "none / not a statement that none occurred" wording for quakes, fires and ships, and the forest source-reported zero;
  - drifters and plastic as "layer off · Load this layer's data for this place";
  - collection lines and "Not place-based".
  - "Load" for drifters filled the drifters row ("no buoy's latest fix is in this cell…"), left plastic off, and left the globe's drifters toggle off. No page overflow.
  - A direct click on bare ocean (no cell polygon) was not separately exercised.
- **Orbital — all three categories PASS.** Rocket bodies, Debris and Payloads each switched on.
  - Drawn counts match the card: payloads 19,702 of 19,706; rocket bodies 2,213 of 2,213; debris 10,185 of 10,187.
  - 19,706 + 2,213 + 10,187 + 548 not drawn (type unknown) = 32,654 = file total. Element file retrieved 05:42 UTC.
  - "What this is and is not" opens (1,294 chars). Debris off → hidden, draw range 0, the others stay on. Markers visible on the globe.
  - Orbital markers have no per-object inspector by design, so "every inspector" reduces to the card and its explainer.
- Console: no messages.
- **Standing of this evidence (Chad, after GPT, 8 Nov):** completed in Claude's browser pane at 588 px, 05:47–05:50 UTC. It **supplements** GPT's smoke test; **GPT has not independently repeated or reviewed it**. It does **not** establish real-phone behaviour or exhaustive orbital-inspector coverage.
- **Still open from the smoke test:** actual-phone test, noon UTC imagery rollover (booked 11:50 UTC), uncaptured browser HTTP status codes.
- **Mac copies synced** (`~/Documents/Mother Earth`, Chad granted the folder): 96 files copied (83 new, 13 older versions, each confirmed to be an earlier committed version, not a local edit). 167/167 tracked files identical to main `c151306`.

## 8 Nov 05:33–05:34 UTC (commit times, `601b899` / `c151306`) — harness fix on a branch; noon check booked; Phase 0 recommendation drafted (Chad's go; no production change)
- **place-ui harness** (branch `place-ui-harness` @ `601b899`, **not merged**): its fake R2 gains `head()` (hub 0.6.0 reads it before the place firms section). 28/30 → **30/30**; a break (head reports 1e9 bytes) fails the same two tests. Related suites all pass; `worker.js` untouched (= live). Review: `reviews/2026-11-08-place-ui-harness.md` — for GPT, then Chad's go to merge.
- **Noon UTC imagery rollover** (read-only): `IMG_DAY` = now − 36 h, so the date rolls 7 → 8 Nov at 12:00 UTC. Check booked in this session for 11:50 UTC (before/after reads of label + actual GIBS request). Needs the Mac awake with the Claude app open.
- **Phase 0 recommendation DRAFT**: `docs/research/P0-RECOMMENDATION-DRAFT.md`, from accepted findings only. Arts (the Met, cleared scope) recommended as the only candidate first domain, not selected; Life block kept; suggests taking the domain decision after the iPhone runs. **iPhone measurements outstanding** (skipped today, Chad). For GPT's review.
- Not authorised: domain selection, prototype, new research, backlog implementation. Aircraft parked.

## 8 Nov 05:14–05:20 UTC — **GPT live smoke test of main `3375e91`: no blocking regression found in the checks completed** (not an exhaustive pass)
- **Conditions:** Codex in-app browser (exact version not captured); imagery date shown 6 Nov 2026. Report + evidence on Chad's Mac: `~/Documents/ChatGPT/Mother Earth/outputs/2026-11-08-live-smoke/` (not copied into the repo).
- **Passed:**
  - NOAA-21 imagery rendered; GIBS request date = label; qualified wording present; fires still NOAA-20.
  - Phone 360/390/430 px: two-line chip unclipped, full explanation in Key, no page overflow. Desktop 1280×860: imagery label clear of the legend.
  - Main cards populated; buoys, microplastic, day/night and orbital payloads loaded; Kp degradation and partial forest coverage disclosed.
  - Coordinate search and record inspectors worked; a 0.51 MW fire kept its precision in search and inspector.
  - Sources tables populated at 360/1280 with imagery credits and retention wording, no overflow.
  - Browser reads: hub 0.6.0; all eight health bodies healthy (verdict ok, no reasons); `/place` returned the documented structure.
  - No warning/error entries in the inspected browser logs on either page.
- **Not covered / remaining:**
  - Actual-phone testing.
  - Imagery-date rollover at noon UTC.
  - "Everything here" cell-selection UI (browser-control timeouts; the direct `/place` endpoint worked).
  - Orbital: payloads only, not every category or inspector.
  - Browser HTTP status codes not separately captured.
- **Environment note:** GPT's direct command-line hub requests got 403 while browser access worked — an access limitation of that environment, not a demonstrated outage.
- **No fix or further testing authorised.** Any proposed fix comes back for review and Chad's specific approval before publishing or any production change. Aircraft parked (research included); expansion permissions unchanged (no prototype, no Phase A).

## 8 Nov 05:07:54 UTC — **PAGE RELEASED: GIBS backdrop → NOAA-21** (main `3375e91`, Chad's Approve line, after GPT's review). Served hashes verified 05:09:53 UTC; live check 05:10:24 UTC: NOAA-21 requested for 2026-11-06; labels/credit name NOAA-21, "dated, not live", dark-area cause not established; fires still NOAA-20. Assets `?v=202611141000`. Improves the current images (NOAA-21 was worse on 4–5 Nov); not a completeness fix. New guard `phase1/backdrop-layer.test.cjs` (27). place-ui 28/30 = 2 pre-existing harness failures (`env.R2.head` missing in its fake R2 since the FIRMS merge). Outstanding: real-phone check; any fallback rule is a separate proposal (hub work).

## 8 Nov 02:34 UTC (commit time, `0891d13`) — **FIRMS v2 rollout CLOSED; `firms-memory` merged into main** (FIRMS memory thread; Chad's Approve line)
- **Stage 6 (read-only, 00:45:42–00:47 UTC):** the 7 Nov mixed-day checkpoint used the **latest** publication, v2 run `2026-11-07T23-45Z-…46a4be89350f` (cutoff 23:45:42.788Z).
  - Marker records 56,536 = that output = its run log.
  - The checkpoint object read back with sha256 `e82f96cc…` = the committed snapshot.
  - `fires_daily` 600 cells, Σ 56,536. Coverage current, `assessed_with_checkpoint` 1. No gaps.
  - Midnight header-only runs (00:00–00:45) took the boundary path ("no detections processed yet"), records retained. Health 8/8.
  - Evidence: `reviews/2026-11-06-firms-v2-build.md` stage log (`b1758cd`).
- **GPT accepted stage 6; the rollout is closed** (stages 1–5 already accepted). Acceptance rests on the reported evidence, not an independent live inspection.
- **Merge:** `firms-memory` → main as **`0891d13`**. Before the merge: no overlapping files, no page-file changes, no worker change on main.
  - main's `phase1/worker.js` sha256 = **`ac173d8ac0dd9d1b9584c3eaf771adabe5e215d993d34487edad12d8932758ea`** = the live code, so **main = live**.
  - Tests on the merged tree: firms-v2 64/64 (rollback to 0.5.3 included), guard 19/19, health 29/29, health-breaks 19/19, history 27/27, place 7.
  - **No deploy, variable, schema, schedule, guard or page change.**
- **Unchanged by decision:**
  - The bounded empty-input retry (an empty header-only input is retried ≤ 3 times, then swept or expired; logs `firms:recovery` rows). Any refinement needs its own review.
  - The 8 MiB guard.
  - Aircraft parked, research included.
  - Expansion: no prototype or Phase A start authorised.
- Branch `firms-memory` can be deleted on GitHub (Chad; the session proxy refuses ref deletes). Hub work now branches from main.

# 7 Nov 2026

## 7 Nov 13:32–13:43 UTC — **Planet: cold load demonstrated + desktop-width runs** (Chad, Chrome 156 Guest window). Cold: 1,500,912 B / 22 requests (all measured), DCL 1.52 s, load 5.08 s, last 7.45 s. Desktop 1470×835 warm ×3: DCL 0.69–0.91 s, last 4.96–6.20 s, ~0.9 MB per load (backdrop + hub data re-fetched each time). Pending: iPhone, direct interactivity.

## 7 Nov ~13:25 UTC — **Phase 0: Arts CLEARED for the limited feasibility gate** (Chad, after GPT): a metadata-only view of the Met's catalogued places of making mapped to present-day countries; 479 objects / 25 countries; data rights cleared; catalogue uncertainty, 23 unverified pages and incomplete sensitivity assessment disclosed. Research-gate clearance only, not release readiness. Arts may be recommended as the first domain, **not selected**. Planet partial (pending Chad). Life: scoped block, stopped. Aircraft parked. No prototype; domain selection and Phase A need a separate decision.

## 7 Nov 12:44 UTC — **Phase 0 validation + measurement pass started** (Chad's go; 2 h cap). Checkpoint `f91ccc5`: Life sample + scripts + attribution and the created_at view script moved into the repo; `docs/research/p0-recovery/MANIFEST.sha256` verified against a fresh clone (14/14 OK). Resume file `docs/research/P0-CHECKPOINT.md`.

## 7 Nov ~13:00 UTC — **Phase 0 review update after GPT** (existing evidence only) — `docs/research/P0-arts-planet-recovery.md`, top section
- **Arts:** data rights accepted as cleared; still **INCONCLUSIVE**.
  - The "decisions, not research" line is withdrawn: sensitive material needs an agreed rule AND validation.
  - GPT's recommended first view is **created_at only**: **485 distinct objects, 25 present-day countries, USA 49.5%**, from R1 (`created-at-view-object-ids-R1.json`).
  - A validation defect was found and fixed in the count: "Formerly considered made in" had been treated as certain, which wrongly added 3 objects.
  - Historical places = present-day location reference with the Met's verbatim wording, never nationality.
  - AAOA is an excluded department, not an absence of those regions.
- **Planet:** partial baseline (warm/mixed, 588 px pane). No production header changes for measurement.
- **Backdrop:** unconfirmed coverage concern recorded (REGISTER GIBS entry; R11 gains the FIRMS thread's 6 Nov late-arrival table). No backdrop change authorised.
- **Proposed follow-ups 1–8 listed, NOT started** (Arts relationship / rule-list / sensitive checks; Planet desktop width, cold load, iPhone). Chad decides.

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
