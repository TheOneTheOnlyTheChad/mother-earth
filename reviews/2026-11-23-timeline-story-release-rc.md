# Timeline story — release candidate `tl-2026-11-R3` on branch `timeline-story-rc`

**Rev 2, 23 Nov 2026 16:02 UTC (clock reading). THE BYTES ARE FINAL, for a release on 24 Nov 2026.** Written statement asked for by the Earth from Space thread before it starts hub 0.6.24:

> The catalogue for `tl-2026-11-R3` is final: `phase1/timeline/catalogue/tl-2026-11-R3.json` on branch `timeline-story-rc` at the commit that carries this statement, **31,636 bytes, sha256 `f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993`**. The file has not changed since commit `95794be` and will not change unless the release date changes. Pin entry: `'tl-2026-11-R3': { key: 'ref/timeline/tl-2026-11-R3.json', revision: 'tl-2026-11-R3', fileSha256: 'f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993', bytes: 31636 }` and `TIMELINE_CURRENT = 'tl-2026-11-R3'`. Hub test patch: `reviews/evidence/2026-11-23-timeline-story-release/hub-test-for-0.6.24.patch`.
> **This holds for a page release on 24 Nov 2026 only.** If the release moves to another day the catalogue is rebuilt, these values are void, and Claude says so to Chad and to that thread at once, before anything else.

**What this rests on.**
- **GPT's review of this candidate (relayed by Chad, 23 Nov; a summary, no file):** accepts 4.1 (the page and catalogue hash assertion), 4.4 (exactly the two retired-id exceptions) and 4.5 (the image-request allowance and separate story coverage). GPT verified the catalogue and image bytes itself and ran: the generator check (passes); `timeline-changes-build` 49/49 with 8 of 8 breaks caught; `timeline-catalogue-hub` 73/73; and, on the hash-verified retained 0.6.23 Worker with the illustrative R3 pin and the supplied patch, 74/74 with 7 of 7 hub breaks caught. Its `timeline-story-build` run passed 87 assertions before its sandbox blocked the suite's listener, so GPT claims no independent full pass of that suite. The browser suites are Claude's results only. GPT's conditions: append the final 98/0 and 127/0 logs, keeping the earlier failed run; the space thread to acknowledge the shared test change; then Claude may state the reviewed bytes final. Production steps still need Chad's separate approvals and a review of the actual 0.6.24 candidate.
- **The Earth from Space thread (relayed by Chad, 23 Nov):** accepts the one-assertion change to `phase1/timeline-catalogue-hub.test.mjs` on main. Because that assertion no longer ties the page to the hub, **the live check "GET /catalogue/timeline/tl-2026-11-R3 returns the exact bytes" before the page merge is now the only tie and is not optional.** 0.6.24 was not started. Its commit on `earth-from-space-rc` will carry the pin, the test patch and the catalogue file, taken from the commit named here with its hash checked. The patch applies cleanly at `9f2c7ad` (checked by that thread, not run by it). Their branch's page still names R2, which the new assertion allows; they will not merge main into their branch for this.
- **Final story-suite logs appended:** `reviews/evidence/2026-11-23-timeline-story-release/run-final-story.log` (full output: `timeline-story-build` 98 pass, 0 fail; `timeline-story-ui` 127 pass, 0 fail). `run.log` is unchanged and still shows the earlier failed line (97 pass, 1 fail: a check in the suite matched too broadly; the suite was corrected, not the product).

Nothing is uploaded, pinned, merged or deployed by this revision. Section 1's table stands with "provisional" now read as "final for 24 Nov 2026".

**Rev 1, 23 Nov 2026 15:50 UTC (clock reading). Branch work only.** Nothing is merged, uploaded, pinned or deployed. The live page is unchanged (merge `03aff0a`); the live hub is 0.6.23 on `earth-from-space-rc` and is not touched by this thread.
**Chad's own line, 23 Nov 2026:** "Go: release build of the end-Cretaceous story on timeline-story-rc as tl-2026-11-R3, release date 24 Nov 2026, hub route H1. Branch work only."
Built from the branch candidate GPT closed (`reviews/2026-11-23-timeline-story-rc.md` rev 4c; GPT's review and recheck are on main). The story's sentences, image, caption and code are those of that candidate. This record covers only what a release adds.

## 1. Values — PROVISIONAL until GPT has reviewed this candidate and Claude states in writing that the bytes are final
| | |
|---|---|
| Revision | `tl-2026-11-R3` (schema 3), previous `tl-2026-11-R2` |
| Release date carried in the catalogue | 2026-11-24 |
| Catalogue file | `phase1/timeline/catalogue/tl-2026-11-R3.json` |
| sha256 | `f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993` |
| Bytes | 31,636 |
| R2 object key (form already in the Worker) | `ref/timeline/tl-2026-11-R3.json` |
| Pin entry | `{ key: 'ref/timeline/tl-2026-11-R3.json', revision: 'tl-2026-11-R3', fileSha256: 'f1a5fab2…0993', bytes: 31636 }` and `TIMELINE_CURRENT = 'tl-2026-11-R3'` |
| Asset-version key (page, script, Timeline stylesheet link) | `202612250500` (was `202612250400`) |
| Published image files | `assets/timeline/tl-2026-11-R3/PIA03379-fig1-800.jpg` (81,202 B, 8886a64a…351e), `…-1024.jpg` (144,324 B, a1ab53fc…b770), `SOURCE.json` |

**If the release does not happen on 24 Nov the catalogue is rebuilt with the new date: its sha256, byte count and the pin values all change.** The Earth from Space thread asked that hub 0.6.24 is not started until these are final; they are not final yet.

## 2. What the release build changed
- **Sources promoted.** `phase1/timeline/big5.json`, `changes.json` and `BUILD.json` now hold the schema 3 release (the rehearsal's content with the release revision id and date). A suite check holds the release source and the rehearsal source to the same End-Cretaceous episode.
- **Image files published by the generator.** For the real page it copies each rendition the catalogue names, and `SOURCE.json`, from `phase1/timeline/assets/` to `assets/timeline/<revision>/`, and `--check` fails if a published file is missing, differs, or if the folder holds anything the catalogue does not name.
- **Asset-version key bumped** in `timeline.html` (script and stylesheet links, build id) and `timeline.js`.
- **The rehearsal sources and the preview helper are kept** as the helper's and the story suites' fixture (revision `tl-2026-11-T1`, previous R2). They are not release sources.

## 3. Rehearsal against release: every value that differs (compared by script, nothing else differs)
Catalogue (`tl-2026-11-T1` built by the helper today against `tl-2026-11-R3`): `catalogue_revision`; `release.revision`; `release.release_date` (23 → 24 Nov); `releases[2]` revision, date and its note "rehearsal, not published" (absent in the release); `changes[3].id` and `.revision`; `entries[4].revisions[0]`; `generated_at`. No other key or value.
Page (17 lines): the banner line (absent); the pinned sha256 and revision; "Timeline page updated 24 Nov 2026 · revision tl-2026-11-R3"; the two image elements' paths (`assets/timeline/tl-2026-11-R3/`); the entry's "Changed in revision" line; the release heading and the change record's ids. The hub address in `timeline.js` is the real one (the helper's one substitution is not in the repository).

## 4. Suites: what had to change, and why. Each of these is a judgement for GPT
Five existing suites were written with R2 as the current release. They were migrated; none was loosened to pass.
1. **`timeline-catalogue-hub` — one assertion changed on this branch, and this needs the Earth from Space thread's agreement before any merge.** The suite runs main's Worker (0.6.19, which is never deployed and has no R3 pin) and asserted that the page embeds the Worker's current revision. After this release the page on main names R3 and main's Worker names R2, so that assertion would fail on main whatever anyone does. It now asserts what is true of the repository: the page embeds the hash of the committed catalogue file for the revision it names. Everything else in the suite is untouched and still tests main's Worker with R1 and R2 (73 pass). I had told that thread the file would not change on main; it changes by this one assertion.
2. **For hub 0.6.24 (route H1):** `reviews/evidence/2026-11-23-timeline-story-release/hub-test-for-0.6.24.patch` is the updated hub test as a diff against `earth-from-space-rc` at `9f2c7ad` (its test file is identical to main's). It covers R3 as current, R1 and R2 still served byte for byte with their pins unchanged, and the legacy pin. Run in a scratch checkout of that branch with the pin added: 74 passed, 0 failed; without the patch and the pin the branch's own test: 73 passed. `worker-pin-illustration.diff` in the same folder is the pin as I added it in that scratch copy, for illustration only; the hub build is that thread's.
3. **`timeline-changes-build`** now runs on a frozen copy of the R2 source files as released (`phase1/timeline/fixtures/tl-2026-11-R2-src/`, checked equal to commit `03aff0a`), built with the current generator. It shows the earlier revision still builds byte for byte and its change-record rules still hold. 49 checks.
4. **`timeline-changes-ui`**: the hub pairs use main's Worker with the R3 pin added in memory ("pinned hub") and without it ("unpinned hub": 404, list stays). Literal expectations moved to three releases. **The retired claim's two element ids (`e-big5-end-cretaceous-c2`, `-c2-h`) are gone from the page**; the suite's rule "every id on the released R1 page still exists" now names those two as the only exceptions. The ids are not reused.
5. **`timeline-travel-ui`**: two stage-1 rules are changed by this release and the suite now says so: opening a story may make one request (the image of a story that has one; everything else still zero), and the "claims regrouped, nothing added" structure check applies to every entry without an account. Its 200-entry fixture gained the claim elements schema 3 requires.
6. **`timeline-axis`**: an attributed finding has no repeated label, so the fixed-label check covers labelled claims and a new check covers findings. **`timeline-mixed-assets`**: each page is given the catalogue it asks for by name.
7. **Story suites**: `timeline-story-build` checks the release identity, the published image bytes, the frozen R2 file, and that the release catalogue carries snapshot 2's sentences word for word with no rehearsal id. `timeline-story-ui` gained section R: the committed release page, script, stylesheet, catalogue and published images in Chromium, with the hub address answered by the committed catalogue.

## 5. Results (workspace Chromium and Node; each suite alone; real NASA files)
| Suite | Result |
|---|---|
| `timeline-story-build` | 98 pass, 0 fail |
| `timeline-story-ui` | 127 pass, 0 fail (includes section R on the release build at 1280 and 390 px) |
| `timeline-changes-build` | 49 pass (on the frozen R2 sources; after rev 1 its one git-dependent check was replaced by literal hashes so it also runs in a copy without git: found when it failed 48/1 in the Mac review copy) |
| `timeline-catalogue-hub` | 73 pass (main's Worker; one assertion changed, section 4.1) |
| `timeline-ui` | 594 pass (no change to the suite) |
| `timeline-axis` | 97 pass |
| `timeline-changes-ui` | 173 pass |
| `timeline-mixed-assets` | 18 pass |
| `timeline-travel-ui` | 209 pass |

Logs: `reviews/evidence/2026-11-23-timeline-story-release/run.log` (seven suites in sequence at the final state; `timeline-story-build` and `timeline-story-ui` were run again after their last edits, with the results above) and `breaks.log`.
Breaks rerun on this build, each failing as it must: `timeline-story-ui` `eager-image` 14 failures, `no-story-validate` 15, `no-schema-pin` 4, `inert-cites` 16, `cite-history` 16; `timeline-changes-build` all eight (`date-after-release` 2, `orphan-change` 1, `review-derived-from-sources` 1, `inbox-allowed` 2, `private-record-allowed` 2, `after-unchecked` 2, `previous-unchecked` 1, `r1-mutated` 1). **Not rerun on this build:** the breaks of `timeline-travel-ui`, `timeline-axis`, `timeline-ui`, `timeline-changes-ui` and `timeline-mixed-assets`.
`python3 phase1/timeline/build_timeline.py --check` passes: page, catalogue, script key and published image files equal the generator's output.

## 6. Not done, and not claimed
- GPT has not reviewed this release candidate. The values in section 1 are not final.
- Nothing is uploaded to R2, no hub build exists for the pin, nothing is merged.
- Claude's pane pass was of the rehearsal preview, not of this release build (which differs from it only as section 3 lists). The preview helper still serves the rehearsal.
- A real phone, Safari, a screen reader, a true 200 % browser zoom: nobody.
- REGISTER, START-HERE and HANDOVER entries for the release are not written.
- The page validator does not compare the scoped review date with the release day (branch record rev 4c).

## 7. Order from here (route H1, as agreed with the Earth from Space thread; each live step on Chad's own Approve line)
1. GPT reviews this candidate. Claude then states the bytes final and hands that thread the catalogue file at a named commit, its sha256 and byte count, the pin entry, and the hub test patch.
2. Catalogue uploaded to R2 at `ref/timeline/tl-2026-11-R3.json` and read back, exact bytes.
3. Hub 0.6.24 built on `earth-from-space-rc` by that thread, reviewed by GPT, deployed; `GET /catalogue/timeline/tl-2026-11-R3` returns the exact bytes; R1 and R2 still served.
4. Page merge. The image files reach the Pages origin with the same merge as the page that refers to them; the page falls back to its list until the hub answers for R3, so the hub pin goes first. Then served-hash and live checks.
A page rollback comes before any hub rollback; the additive pin can stay.

## 8. R2 upload done, 23 Nov 2026 17:07:13 UTC
Chad's line: "Approve: upload phase1/timeline/catalogue/tl-2026-11-R3.json (31,636 B, sha256 f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993) to R2 as ref/timeline/tl-2026-11-R3.json, and read it back. No Worker change, no merge."
All by Claude, in its own pane tab on the Cloudflare dashboard (bucket `mother-earth`), then closed. Times are the Mac browser's clock.
- **Before (17:06:59 UTC):** destination 404 "The specified key does not exist"; `ref/timeline/` held R1 (15,656 B) and R2 (18,120 B) only. Source read from raw.githubusercontent at commit `36c6cb0`: 200, 31,636 B, sha256 `f1a5fab2…0993`. Source hash and absence checked again immediately before the write.
- **Upload:** dashboard R2 objects API `PUT` at 17:07:12.494Z: HTTP 200, success, size 31,636, storage class Standard, content type application/json, etag `1c9a29d624aa7c70a3c6796b2191fc8f`, version `7e5df69fbda0ed02f93bb5982f6f8e93`, uploaded 17:07:13.194Z.
- **Read back:** HTTP 200, 31,636 B, sha256 `f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993` (exact).
- **R1 and R2 untouched:** read back 15,656 B `096ae648…0fbe` and 18,120 B `2f39aa30…0356`; listing shows their uploads of 10 Nov 06:06:51 and 12 Nov 11:09:38, etags unchanged.
- **No public effect (17:07:35 UTC, own pane tab on the hub):** `/` reports 0.6.23; `/catalogue/timeline/tl-2026-11-R3` 404 "unknown revision"; R2 and R1 routes 200 with their exact bytes.
- The object is now uploaded: any change to the catalogue bytes, a release-date slip included, needs a new revision id and key; this object would stay, unused.
- Section 6's "Nothing is uploaded to R2" is superseded by this section. Still not done: hub 0.6.24 deploy (Earth from Space thread), the live check of the R3 route, the page merge.

## 9. Live check of the R3 route, 23 Nov 2026 17:22:35 UTC (Claude's own read, own pane tab, closed after)
The Earth from Space thread reports hub 0.6.24 deployed 17:18:38 UTC on Chad's own line (their record: `reviews/2026-11-23-earth-from-space-0.6.24-candidate.md` section 8 on `earth-from-space-rc` `e9242a4`). Read here, independently:
- `/catalogue/timeline/tl-2026-11-R3`: 200, application/json, 31,636 B, sha256 `f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993` (exact); schema 3, release_date 2026-11-24, previous `tl-2026-11-R2`.
- `/catalogue/timeline/tl-2026-11-R2`: 200, 18,120 B, `2f39aa30…0356`. `/catalogue/timeline/tl-2026-11-R1` and `/catalogue/timeline`: 200, 15,656 B, `096ae648…0fbe`.
- `/` reports 0.6.24. All four catalogue answers carry `access-control-allow-origin: *`.
Not done: the page merge. By the release-day rule (TIMELINE-INBOX-AND-CHANGES-PROPOSAL section 3.5) it belongs to the UTC day 24 Nov, latest start 22:00 UTC.

## 10. Page release, 24 Nov 2026 02:48:03 UTC (main `1d0c6dd`)
Chad's line: "Approve: merge timeline-story-rc into main (page release: end-Cretaceous story, tl-2026-11-R3, release date 24 Nov 2026), with served-hash and live checks."
- **Before the push (Claude):** clock 02:42 UTC, 24 Nov. Hub re-read 02:47:29 UTC: 0.6.24; R3 route 200, 31,636 B, `f1a5fab2…0993`; R2 route exact. Main had moved to `419ccb4` (docs only, three commits after `abe7928`); the merge was made on that tip.
- **Merge `19f4e07`** (`timeline-story-rc` `efeb145` into main, no fast-forward). One conflict, `phase1/timeline-catalogue-hub.test.mjs`, resolved to main's version. 41 files differ from the previous tip; outside `phase1/timeline*`, `reviews/` and `assets/timeline/` only `timeline.html`, `timeline.js`, `style.css`. `phase1/worker.js` untouched (`db4f9cdf…1aa5`).
- **One change that was not on the reviewed branch, commit `1d0c6dd`, test only:** on the merged tree `timeline-changes-ui` stopped before its first check ("worker anchors missing"), because since hub-to-main the Worker in the repository already pins R3 and the suite expected an unpinned one. The suite now takes the Worker as the pinned hub and removes the R3 entry in memory for the unpinned hub (the earlier direction is kept for a Worker without the pin). No page, catalogue, generator or Worker byte changed. GPT has not seen this commit.
- **On the merged tree before the push (Claude, workspace):** generator `--check` passes; `timeline-catalogue-hub` 74, `hub-alignment` 6, `timeline-story-build` 98, `timeline-changes-build` 49, `timeline-story-ui` 127, `timeline-ui` 594, `timeline-axis` 97, `timeline-changes-ui` 173 (after `1d0c6dd`), `timeline-mixed-assets` 18, `timeline-travel-ui` 209; 0 failures. The browser suites ran on the tip `6dcda3c`; the three later commits on main are documents only. Breaks were not rerun.
- **Served hashes (02:48:55 UTC, own pane tab, Pages origin, cache-busted):** `timeline.html` 50,013 B `b3db16d1…def1`; `timeline.js` 60,015 B `55043697…7524`; `style.css` 83,189 B `6b6115b2…2956`; `PIA03379-fig1-800.jpg` 81,202 B `8886a64a…351e`; `PIA03379-fig1-1024.jpg` 144,324 B `a1ab53fc…b770`; `SOURCE.json` 2,222 B `3b227bdd…842d`. All equal to the release files.
- **Live page (02:49:14 UTC, pane, 556 px wide, `timeline.html#e-big5-end-cretaceous`):** page revision `tl-2026-11-R3`, schema 3; the axis is shown and the fallback line is hidden; the entry opens with the heading "Evidence and interpretations", the image loaded from the Pages origin (1024 rendition), caption, "Image: NASA/JPL (PIA03379)" and the scoped review note; 11 citation buttons, one pressed: its source group opened and took focus with no history entry or fragment change; change record `change-tl-2026-11-R3-1` present; footer "Timeline page updated 24 Nov 2026 · revision tl-2026-11-R3". Hosts contacted: the Pages origin, the hub, the two font hosts.
- The first screenshot again showed the sheet see-through; the second was clean (as in the branch record).
- **Not done:** a real phone, Safari, a screen reader, true 200 % zoom; no-image and image-failure states on the live page; REGISTER, START-HERE and HANDOVER release entries; Mac sync; Project copies; the private inbox item's state.
- **Rollback:** revert `19f4e07` on main (page first). The hub pin for R3 can stay. A hub rollback to 0.6.23 has no R3 pin, so the page would have to be rolled back before it.
- **Correction, 24 Nov:** this section first named the merge `ea39975`. That was a first local attempt at the same merge, made on the tip `6dcda3c` and discarded unpushed when main was found to have moved; the merge on main is **`19f4e07`** (parents `419ccb4`, `efeb145`). The section now reads `19f4e07` throughout. The Earth from Space thread noted the same in STATUS.
