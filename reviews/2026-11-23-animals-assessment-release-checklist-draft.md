# Animals assessment card: integration with current main, and release checklist (draft)

Written by Claude, 23 Nov 2026, 04:47 UTC (workspace clock reading), "Animals assessment" thread. Branch `animals-assessment-rc` only. **Rev 1.1, 23 Nov:** GPT's document fixes applied (`reviews/2026-11-23-animals-assessment-release-prep-gpt-review.md`): the account wording, a check after the REGISTER commit (new step 7), and the rollback wording. GPT: the checklist order is sound; no further full review round for these edits.

**A DRAFT. NOTHING IS RELEASED. R1 IS UNRESOLVED.** No merge to main, no REGISTER filing, no IUCN message, no API token. This checklist cannot be run past step 1 while R1 is open.

Chad's line (his own message, 23 Nov): "Bring current main into `animals-assessment-rc`, resolve any conflicts and rerun the six required checks. Report any substantive changes for GPT review. Finish the REGISTER and release checklist as drafts, keeping R1 explicitly unresolved. Branch only; no merge, token or follow-up."

## Part A. Integration with current main (done)

| | |
|---|---|
| Branch before | `0ebe05e` |
| Main merged in | `7960335` |
| Merge commit on the branch | `70aeb62` |
| Conflicts | none |
| What main brought in | four files, all docs: `STATUS.md`, `HANDOVER.md`, `reviews/2026-11-22-earth-from-space-alarm-assessment.md`, `reviews/2026-11-23-earth-from-space-rehearsal-plan.md` (283 lines added) |
| Page, script, style, data or test files changed by the merge | none |

**Substantive changes for GPT: none from the merge.** Main had moved by docs only. The candidate's code is byte for byte what GPT reviewed: `animals-assessment.js` `2df25f9a…3a1a`, shipped file `b1c7afa9…8265`.

How the branch now differs from main, outside docs and reviews (twelve files; list kept as `reviews/evidence/2026-11-23-animals-assessment-integration/branch-vs-main.code-files.txt`):

- New: `animals-assessment.js`, `assets/animals/assessments-R1.json`, `phase1/animals/red-list-assessments.json`, `phase1/animals/build_assessments.py`, `phase1/animals/build_assessments.test.py`, `phase1/animals-assessment-ui.test.cjs`.
- Changed: `animals.html`, `animals.js` (header comment only), `style.css` (four added rules), `sources.html` (the Animals section), `phase1/animals-tab-ui.test.cjs`, `phase1/animals-census-ui.test.cjs`.

### The six required checks on the merged tree (Claude's runs, cloud workspace, each alone, on `70aeb62`)

| Check | Result | Time (UTC, 23 Nov) |
|---|---|---|
| `python3 -I phase1/animals/build_assessments.test.py` | 86 passed, 0 failed | 04:28:16 |
| `python3 -I phase1/animals/build_assessments.py --check` | identical, `b1c7afa9…8265` | 04:28:16 |
| `animals-assessment-ui` | 51 passed, 0 failed | 04:28:16 to 04:28:28 |
| `animals-census-ui` | 71 passed, 0 failed | 04:28:28 to 04:31:46 |
| `animals-tab-ui` | 277 passed, 0 failed | 04:31:52 to 04:38:45 |
| `animals-corridor-ui` | 102 passed, 0 failed | 04:38:45 to 04:47:26 |

Logs: `reviews/evidence/2026-11-23-animals-assessment-integration/`. Chromium through Playwright, software renderer, 2 cores. The 18 deliberate breaks were not rerun on the merged tree: they were all caught earlier the same day on the same code (`7be31cc`), and the merge changed no file a break edits.

**This integration goes stale.** Every commit to main after `7960335` reopens it. Step 3 below repeats it at release time.

### Three points for GPT's eye (documents, not code)

1. **REGISTER draft rev 3** (`reviews/2026-11-22-animals-assessment-register-draft.md`). One correction of fact: rev 2 said no account is used. Chad's Red List account was used for the subpopulation search and to open the "API access" page; no shown value comes from it, and no token was requested. Also added: the citation access date, the "ccessed" upkeep note, the four GPT reviews, and R1 split into the three places it must cover.
2. **The Sources page sentence** for the five cards (`sources.html`, Animals section) says the cards are shown "under its Terms and Conditions of Use, version 3.1". That wording was reviewed with the candidate. It names the terms and not whatever finally resolves R1. It should be read again against R1's actual resolution before release (step 2).
3. **Version stamps.** `animals.html` on the branch loads `style.css`, `animals.js` and `animals-assessment.js` with `?v=202612250100`. The stamp was set on 22 Nov and not moved for the 23 Nov citation change. The live site has never served `animals-assessment.js`, so no visitor holds an old copy. A browser that opened the Mac review copy before 23 Nov may. Proposed: leave it, and move all three stamps only if the code changes again before release.

## Part B. Release checklist (draft; not started)

Order matters. Each step names who does it. Steps 5, 6 and 8 need Chad's own words, written fresh; every earlier Approve line is spent.

**Gate: R1.**

1. **R1 is resolved.** *Chad brings the reply or the statement; GPT reviews what it covers first.* **[OPEN. UNRESOLVED as of 23 Nov 2026.]**
   - Resolved by IUCN's reply, or by a clear IUCN statement that applies. No follow-up unless Chad decides to send one himself.
   - The reply or statement is filed unchanged on the branch, with its date.
   - It must cover all three places: the page's sentences, the served JSON file, the public repository; and all three fields: assessment date, publication year, scope.
   - **If it covers less:** stop. That is a design change with its own review against criterion C2. This checklist does not apply as written.
   - **If it allows the API:** a scripted check is a separate small proposal. It does not hold up this release.
   - **If nothing comes:** nothing is assumed. The card stays parked.

**Once R1 is resolved, and not before:**

2. **Complete the documents from R1's actual scope.** *Claude; then GPT.*
   - REGISTER draft: fill the three R1 fields and the reply record. Leave R2 open.
   - `sources.html`: read the five-cards sentence against the resolution; change it only if the basis or a condition requires it. A change to a page file reopens step 3.
   - Candidate packet: criteria C1, C2 and C6 moved from open to met, each with its evidence.
3. **Integrate and test again.** *Claude.*
   - Merge current main into the branch. Report every non-docs file it brings.
   - Rerun the six checks above, one at a time. If any page file changed since `70aeb62`, also rerun the 18 breaks.
   - If main brought changes to `style.css`, `sources.html` or the header, run the suites that cover them (`desktop-overflow`, `smoke-fixes`, and any header suite main carries by then) with the right local server.
   - Sync a review copy to the Mac for GPT.
4. **GPT's release review** of the final tree and documents. *Chad relays it; filed unchanged.* A relayed review is not Chad's approval.
5. **Chad's decisions, in his own words.** *Chad.*
   - That the card is released with phone, Safari, screen reader and print untested, or that one of them is tested first.
   - That R2 follows after release.
6. **Chad's line to file REGISTER.** *Chad, then Claude.* Proposed wording, not valid until R1 is resolved and the draft completed:
   `Approve: file the IUCN Red List entry in REGISTER as written in reviews/2026-11-22-animals-assessment-register-draft.md rev <n>`
   - Pull main, add the entry after the Dryad penguin entry, commit, push. Docs only. REGISTER is filed before the release merge, as its own commit.
7. **Check again after the REGISTER commit.** *Claude.* That commit moves main, so before the merge line is used:
   - Merge the new main into the branch. Confirm it brings `REGISTER.md` and nothing unexpected; list every file.
   - Confirm the reviewed code is preserved: the page, script, style, data and test files hash the same as at GPT's release review.
   - Rerun the six checks if any file other than docs came in.
   - Give Chad the exact commit for his merge line.
8. **Chad's line to merge.** *Chad, then Claude.* Proposed wording, same condition:
   `Approve: merge animals-assessment-rc <commit> into main (Animals conservation assessment card goes live)`
   - No-ff merge. No force-push. Push with `git -c push.negotiate=true push`.
9. **Served-file check.** *Claude, in Chrome; the workspace cannot reach the live site.*
   - Hash every `.html`, `.js` and `.css` at the site root as served, with `no-store`, against the merge commit. The set now includes `animals-assessment.js`.
   - Hash `assets/animals/assessments-R1.json` as served: `b1c7afa9…8265`.
   - Open the Animals page with a fresh query string. Read all five blocks: category, dates, citation ending "Accessed on 22 November 2026.", both links.
   - Confirm the page makes no request to `iucnredlist.org`.
10. **Record.** *Claude.* STATUS entry with the clock time; this thread's HANDOVER line; Project copies; Mac main synced, old files preserved first.
11. **GPT's live smoke**, if Chad wants one. *Chad's call.*

**After release:**

12. **R2: the copy to IUCN under section 5 of the terms.** *Chad sends; Claude tracks.* **[OPEN. PENDING.]** Stays open in REGISTER until a copy or link in the form IUCN accepts has been sent, with its date, or IUCN has said it is not needed.
13. **Upkeep.** Next check of the five records due **22 May 2027**, and whenever IUCN announces an update naming one of the five. Nothing reminds anyone. A citation caught by the "ccessed" rule needs review, not an edit of the rule.
14. **Close-out.** Delete the merged branch on GitHub; move the Mac review copies to `_to_delete/`.

**Rollback.** Revert the merge commit on main, on Chad's own line. That restores the four journey cards' placeholder ("Not available yet. No assessment source has been reviewed for display on Mother Earth.") and removes the separate African penguin assessment section, which does not exist on the page before release. REGISTER is corrected to match in the same step. No hub change is involved, so there is nothing to roll back on Cloudflare.

## Part C. What is true today

- The live page shows the "Not available yet" placeholder on the four journey cards and has no penguin assessment section. Nothing here changes it.
- The candidate is code-reviewed by GPT (22 Nov, and the citation diff on 23 Nov) and integrated with main as of `7960335`.
- The branch is in the public repository, so its five records can be read on GitHub now. Chad knows and chose to leave them.
- Open: R1; Chad's release decisions and lines; R2. Not tested: a real phone, Safari, a screen reader, print, a Mac or real-browser run of the citation change.
- IUCN enquiry: sent by Chad on 23 Nov 2026. No reply reported. No follow-up. No API token.
