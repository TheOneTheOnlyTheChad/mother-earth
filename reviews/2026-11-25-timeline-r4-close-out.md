# Timeline "Humans and human relatives" (catalogue `tl-2026-11-R4`): release and close-out record

25 Nov 2026, Timeline thread. All times UTC from tool clocks. One record for what shipped, how to roll back, what was removed and what is still open.

## 1. What shipped
- **Page release: merge `49d91bc`** (parents `e44d600`, `b198033`; commit time 25 Nov 2026 00:03:55, pushed by 00:03:59) on Chad's own line, given 24 Nov 18:47 and held until the catalogue's release day: "Approve: merge timeline-finds-release-rc b198033 into main (page release: Humans and human relatives, tl-2026-11-R4, release date 25 Nov 2026), with served-hash and live checks".
- **On the Timeline tab:** a lane "Humans and human relatives" with four dated finds, one row each: Dinaledi Chamber (deposit bracket 335,000 to 236,000 years ago), Omo I (older than a layer dated 233,000 ± 22,000 years ago), Xiahe 2 (layer bracket 48,000 to 32,000 years ago), the La Ferrassie bone fragment (direct radiocarbon date, 41,700 to 40,800 calibrated years before 1950, 95.4 %). A "Last 400,000 years" view, a 50,000-year narrowest window when finds are shown, a compact lane above 2 Ma, the wheel-zoom fix, change record `tl-2026-11-R4-1`.
- **Catalogue `tl-2026-11-R4`:** schema 4, 48,134 B, sha256 `74b1f8b165283b98023876fbd9e64b876bea17030973bfbc4ebea5f3ec8900ca`, release date 25 Nov 2026, previous R3. R2 object `ref/timeline/tl-2026-11-R4.json` since 24 Nov 17:59:14 (Chad's upload line).
- **Hub 0.6.25** since 24 Nov 18:01:46 (Chad's hub line): `phase1/worker.js` 551,780 B, sha256 `d54323183ebd49acb1818b2cb68dc31a56e95c6ddc2fc8635303311837e9e24d`; pins R4 and makes it current; landed on main as `95ac990`.
- **Served page files (hash-checked on github.io 25 Nov 00:05:26):**

| File | Bytes | sha256 |
|---|---|---|
| `timeline.html` | 73,210 | `95ad7f82dd32f286ade090fb735bbd7134125e06d7a44ac85a257ef75e9b27dd` |
| `timeline.js` (`?v=202612250900`) | 76,861 | `10ac42f49edecca40e74db871e3f094969db486e6aaa7f654978b5bbcc45ceec` |
| `style.css` (`?v=202612250900` on the Timeline page) | 87,531 | `a386302f4206c47efb4ce41401c268df40942e2cf9ddeef295f0b6a6bb899d71` |
| `assets/timeline/tl-2026-11-R4/PIA03379-fig1-1024.jpg` | 144,324 | `a1ab53fc…` (R3's NASA file, bytes unchanged) |
| `assets/timeline/tl-2026-11-R4/PIA03379-fig1-800.jpg` | 81,202 | `8886a64a…` (same) |
| `assets/timeline/tl-2026-11-R4/SOURCE.json` | 2,222 | `3b227bdd…` |

  `index.html` (`70b43b3e…`) and `app.js` (`a4876906…`) served unchanged. `REGISTER.md` served as merged (`e523aea7…`, 147,972 B) at that time; its heading was updated afterwards in the commit that carries this record.
- **Reviews:** GPT passed the page candidate `9b83b5c` and the hub candidate `0235545` (`reviews/2026-11-24-timeline-r4-page-and-hub-release-gpt-review.md`). The final combined tree `8ea37a7` was tested by Claude (packet `reviews/2026-11-24-timeline-r4-release-candidate.md` §10); the merge differs from that tree in records and evidence files only (18 files, no served file, no suite). Browser-suite results are Claude's evidence.

## 2. Checks at release
- **Before the merge (00:03:28 to 00:03:32):** hub reports 0.6.25; R4 route 200, 48,134 B, `74b1f8b1…00ca`; R3 `f1a5fab2…0993`, R2 `2f39aa30…0356`, R1 and the unversioned route `096ae648…0fbe`. `timeline-finds-release-rc` still `b198033`, main still `e44d600`. After the merge, before the push: the three page files, `phase1/worker.js` and the catalogue hash as reviewed; `build_timeline.py --check` passes.
- **Served hashes (00:05:26):** table above. At 00:04:29 Pages still served the R3 files; the three 404 lines in the pane's console are this check's own early asset requests.
- **Live read in the pane (00:05 to 00:07), at the pane's 588 px, at 375 × 812 with the phone user agent, and at 1280 × 800:** the page states revision R4, schema 4 and the catalogue hash, loads `/catalogue/timeline/tl-2026-11-R4` from the hub (200) and turns the explorer on; "Revision tl-2026-11-R4, released 25 Nov 2026 · What changed"; "Last 400,000 years" shows the four rows inside the page with no sideways scroll; each mark opens its entry with focus on the heading, and Back returns to the same window with focus on the mark (also with the pane's own Back); Older / Newer entry walks Dinaledi → Omo I → La Ferrassie → Xiahe 2; Close returns; the end-Cretaceous entry shows its image from `assets/timeline/tl-2026-11-R4/`; the R4 change record reads as released; no script error or rejected promise at any width.
- **After the release (00:07:06):** hub 0.6.25; R4, R3, R2, R1 and the unversioned route byte-identical to the readings before.

## 3. Rollback identities (each on Chad's own Approve line, prepared against fresh main)
1. **Page first:** `git revert -m 1 49d91bc`. That returns `timeline.html` `9fa7b4e6…f5e9`, `timeline.js` `55043697…7524`, `style.css` `6b6115b2…2956` (the R3 page, last release `7c94f89`). The revert also takes the suites and `TL_MAIN` back; rerun the Timeline and Animals suites on the reverted tree.
2. **Hub, only after the page is back on R3:** 0.6.24, `phase1/worker.js` at `72ea123`, 551,400 B, sha256 `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5`. A hub rollback while the page pins R4 turns the explorer off (the page falls back to its built-in text).
3. **R2:** the object stays. Uploaded or pinned bytes are never changed or removed; a correction is a new revision id and key.

## 4. Removed at close-out
See STATUS 25 Nov for the measured times. Branches of this work only: `timeline-finds-rc`, `timeline-finds-release-rc`, `timeline-r4-hub-rc` (all merged; work on main). Local worktrees and rehearsal previews in Claude's workspace. No Timeline copy was in the Mac `_review/`, so nothing was moved to `_to_delete/`; the eleven folders there belong to other threads and stay. Mac synced preserve-first to the close-out commits (28 preserved files, each equal to the last synced commit `06c7ee3`). Nothing of another thread was touched; `BASE_MAIN`, `NC_MAIN` and `NC_PARENT` are unchanged, `TL_MAIN` = `643bb9a7e9c63045dec3eac87837212f05841a3f`.

## 5. Still open
- **Not checked by anyone:** a real phone, Safari, a screen reader, true 200 % browser zoom, a physical mouse wheel on the live page.
- **Coverage limits kept on record:** `timeline-travel-ui` runs on a generated schema-3 page, not a full R4 travel run; the older `health-breaks` (14 / 19) and `firms-v2-breaks` (39 / 41) runners miss some breaks on main and candidate alike; five non-browser suites cannot run in Claude's workspace (same on main).
- **`/status`:** `ships` degraded and `firms:recovery` down were listed after the hub deploy with no reading of Claude's just before it. Hub owner's to look at.
- **Enquiries E1 to E4:** at the release none was sent. **Updated 25 Nov: all four sent by Chad; the Drimolen author replied the same day with the article** (`docs/research/TIMELINE-HUMAN-RELATIVES-ENQUIRY-DRAFTS.md` rev 4). Drimolen is still not on the page: it needs a source-check revision, GPT, Chad's go and a new catalogue revision. Ngandong and Liang Bua stay excluded until their sources are read.
- **`animals-tab-ui` 13c to 13e** compare with a fixed earlier main (`BASE_MAIN`, Animals owner's).
- **Recommended by GPT earlier, not commissioned:** the permanent break `unpinned-is-pinned` in `timeline-changes-ui`.

## 6. After the release (added 25 Nov)
- **GPT's independent live smoke test: PASS for its scoped check, no rollback recommended** (25 Nov, about 03:13 to 03:19 UTC; filed unchanged as `reviews/2026-11-25-timeline-r4-live-smoke-gpt-review.md`, sha256 `8ebe60f7a024de3eaa2bb123d7b2f810f7c44d7d8b04bb85c0fe039868f4a355`). The three page hashes matched its own downloads. Its shell request to the hub's R4 route returned 403, so it has no independent byte count or hash of the catalogue; the live page's own validation succeeded in its browser. Not closed by it: a real phone, Safari, a screen reader, true 200 % zoom, a physical wheel. Not a full regression or accessibility audit.
- **Project copies:** the Project's copies of the two release packets (`claude/reviews/2026-11-24-timeline-r4-release-candidate.md`, `claude/reviews/2026-11-24-hub-0.6.25-candidate.md`) are the earlier versions, without §10 and §9. The repository copies are complete. Refreshing them is left for the next Timeline thread.
