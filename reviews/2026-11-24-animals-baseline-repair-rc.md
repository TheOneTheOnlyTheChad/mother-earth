# Animals tab suite: baseline repair for the Timeline's files (test-only candidate)

24 Nov 2026 03:17 UTC (clock reading) · rev 1.1 (24 Nov 2026 03:30 UTC, clock reading: section 7 added, GPT's review and the fresh-main integration check; sections 1 to 6 unchanged) · for GPT · branch `animals-baseline-repair-rc`, cut from main `3160658` · **one test file changed; no page file, no hub file, no data file; not merged, nothing deployed**

Asked for by Chad and GPT on 24 Nov 2026 (Chad's own message to the Animals thread). All runs below are Claude's, in the cloud workspace, one at a time. No Mac run and no real-browser run was made; none is needed for a file comparison, but that is stated, not assumed away.

## 1. The three failures, reproduced on main `3160658`

`phase1/animals-tab-ui.test.cjs`, whole suite: **274 passed, 3 failed** (`before-full-main-3160658.log`). All three are in section 13, which compares files in the tree with main at the pinned commit `0e62083` (20 Nov 2026, the main commit the first Animals branch was cut from).

| Check | What failed | Cause |
|---|---|---|
| 13c | `timeline.js` differs from `0e62083` | Six Timeline commits, 23 Nov (explorer stage 1, then the story) |
| 13d | three `body.tl` lines of `0e62083`'s stylesheet are gone (`.tlmain` width, `.detail.tlpanel`, `.dopen .tlmain`) | The Timeline explorer replaced them |
| 13e | `timeline.html` differs from `0e62083` beyond the Animals links | The same Timeline releases |

Nothing in the three is an Animals change. Since the Animals release (`cff33b4`, 21 Nov), `timeline.js` and `timeline.html` were changed only by Timeline commits (list: `evidence/…/timeline-file-commits-since-0e62083.txt`; the entries before 22 Nov are the Animals branches adding the two header links, which 13e already allowed).

## 2. What each check protects, and how the candidate keeps it

Section 13 exists to show that the Animals work changed nothing outside its own files except what it declared: two header links on each page, header rules for five tabs, and its own rules added to the shared stylesheet.

| Check | Protects | In the candidate |
|---|---|---|
| 13c | No Earth-now script, the collector or the Bare Earth suite was changed (byte-identical to a pinned commit) | **Unchanged for 16 files**, still against `0e62083`. `timeline.js` moves to 13g. The list length (16) is now asserted |
| 13d | The shared stylesheet lost no line of main's except at most four header rules | **Unchanged for every line that does not contain `body.tl`**, still against `0e62083`. The `body.tl` lines move to 13i |
| 13e | Each other page gained only the Animals links (and Sources its one section) | **Unchanged for `moon.html`, `sun.html`, `sources.html`**, still against `0e62083`. `timeline.html` moves to 13h |
| 13f (new) | The Timeline comparisons were really made | The Timeline baseline is readable, and is not the older baseline |
| 13g (new) | What 13c protected for `timeline.js` | Byte-identical to main at the Timeline baseline |
| 13h (new) | What 13e protected for `timeline.html` | Three clauses, reported separately on failure: byte-identical to main at the Timeline baseline; the Animals tab link and menu link each present exactly once; the page's `<header>` equals `0e62083`'s except those two links. The stylesheet version is now compared too (the page pins its own) |
| 13i (new) | What 13d protected for the Timeline's rules, and more | The stylesheet's `body.tl` lines are exactly main's at the Timeline baseline, in order: none dropped, none edited, none added. 13d only caught a dropped or edited line |

**The Timeline baseline** is one new constant, `TL_MAIN` = `19f4e077b94d3b66b226be3e0b6549e299ad1130`, the merge that released `tl-2026-11-R3` on 24 Nov. `timeline.js`, `timeline.html` and `style.css` are unchanged between it and `3160658` (`git diff --quiet`, checked).

**What was not done.** `BASE_MAIN` was not moved. No check was removed. 13b (`index.html`) is untouched. The hub exclusion and `hub-alignment` are as the hub-to-main work left them.

## 3. Results

| Run | Result | Log |
|---|---|---|
| Whole suite, main `3160658` | 274 passed, 3 failed, exit 1 | `before-full-main-3160658.log` |
| Whole suite, candidate | **280 passed, 0 failed, exit 0** | `after-full.log` |
| Section 13 only, main | 6 passed, 3 failed | `before-section13-main-3160658.log` |
| Section 13 only, candidate | 12 passed, 0 failed | `after-section13.log` |

The count: 277 checks before. One 13e check (`timeline.html`) left; 13f, 13g, 13h and 13i arrived; 280.

## 4. Evidence that the revised checks catch unintended changes

Section 13 had no deliberate breaks before. It now reads the tree's files through the suite's own `served()` function, so a break edits what the comparison reads; nothing on disk changes, and an edit that does not apply exactly once stops the run. **Ten breaks, each run alone, ten caught at the named check** (`breaks.log`):

| Break | The unintended change | Caught at |
|---|---|---|
| `earth-script-edited` | one space added to `app.js` | 13c |
| `shared-rule-dropped` | a shared header rule of main's altered | 13d |
| `moon-page-edited` | one space added to `moon.html` | 13e |
| `tl-script-edited` | one constant changed in `timeline.js` | 13g |
| `tl-page-edited` | one space added to `timeline.html` | 13h |
| `tl-page-animals-tab-gone` | the Animals tab link removed from `timeline.html` | 13h |
| `tl-page-header-edited` | a link added to the Timeline page's header | 13h |
| `tl-rule-dropped` | one `body.tl` rule removed | 13i |
| `tl-rule-edited` | one value changed in a `body.tl` rule | 13i |
| `tl-rule-added` | one `body.tl` rule added | 13i |

The first three show the protection left on `0e62083` still works. Two controls:

- **`control-old-pin.log`**: with `TL_MAIN` set back to `0e62083`, 13f, 13g, 13h and 13i all fail. The three original failures return under their new names, so the new checks compare the same things the old ones did.
- **`control-release-drops-animals-link.log`**: against a Timeline baseline whose `timeline.html` itself lacks the Animals tab link (as a future Timeline release might), with the tree matching it, 13h reports `whole: true, links: false` and fails. So moving `TL_MAIN` cannot quietly accept a Timeline page that lost its Animals link.

**A limit, stated:** on the real tree any edit to `timeline.html` fails 13h's first clause, so the three page breaks do not each isolate one clause. The second control isolates the links clause. The header clause is not isolated by any run.

## 5. For GPT to judge

1. **A second pinned commit is upkeep.** The next Timeline release will change these files again and 13g to 13i will fail until `TL_MAIN` is moved in the commit that records that release. That is the same kind of failure as today's, now confined to one constant with a comment saying who moves it. The alternative is the hub pattern: a recorded-hash file owned by the Timeline thread and its own alignment test, with the Timeline's files leaving this suite. Claude chose the pin because the request was for a targeted repair of this suite; the alternative reaches into the Timeline thread's files.
2. **13h compares the stylesheet version**, which 13e set aside. Correct today (the Animals work does not change the Timeline page's key); it would need the allowance back if a later shared-stylesheet change bumps every page's key.
3. **`animals-assessment-rc` carries the old suite.** It gets this repair when main is merged into it at release time (checklist step 3). Nothing was done to that branch.
4. **Two break strings sit in other threads' files** (`'const MIN_SPAN = 1'` in `timeline.js`, `'ME.REFRESH_MS = 5 * 60e3;'` in `app.js`). If either line is reworded the break stops with "edit did not apply"; it cannot pass silently.

## 6. Files

- Changed: `phase1/animals-tab-ui.test.cjs` (diff from main `3160658`: `evidence/2026-11-24-animals-baseline-repair/suite.diff`).
- Added: this record and `reviews/evidence/2026-11-24-animals-baseline-repair/` (seven logs, the diff, the commit list).
- Mac review copy: `~/Documents/Mother Earth/_review/animals-baseline-repair-rc/`, plain-text copies under `read/`.

## 7. After review: GPT's verdict and the fresh-main integration check (rev 1.1)

**GPT's review, filed unchanged:** `reviews/2026-11-24-animals-baseline-repair-rc-gpt-review.md` (read by Claude from GPT's own folder on the Mac, sha256 `21509e95…6052`, 6,514 bytes; relayed by Chad on 24 Nov). Outcome: PASS for the targeted test-only candidate, no blocking finding, the four points of section 5 accepted. It is not a merge or deployment authorisation. GPT did not rerun the browser suite, the breaks or the historical comparisons; those remain Claude's workspace evidence. GPT independently ran 13h's predicate on controlled text and isolated the header clause (whole true, links true, header false: fail), which closes the limit stated in section 4.

**Integration check, as GPT's section 5 asks.** Main `9036552` merged into the branch as `42fe5b7`, no conflict. Main brought documents only since `3160658` (13 files: STATUS, HANDOVER, START-HERE, REGISTER, review files and logs).

| Check on the integrated tree `42fe5b7` | Result | Log (`evidence/…/integration-42fe5b7/`) |
|---|---|---|
| Whole suite | **280 passed, 0 failed**, exit 0 | `full.log` |
| The ten section-13 breaks, each alone | ten caught at the named check, none failed to apply | `breaks.log` |
| `phase1/hub-alignment.test.mjs` | 6 passed, 0 failed | `hub-alignment.log` |

- Against main `9036552`, the branch differs in one functional file, `phase1/animals-tab-ui.test.cjs` (sha256 `83ff9b18…03ad`, the value GPT computed); everything else that differs is this record, GPT's review and the evidence folder.
- `timeline.js`, `timeline.html` and `style.css` on the integrated tree are byte-identical to `19f4e07`; `phase1/worker.js` is the deployed 0.6.24 file (`db4f9cdf…1aa5`).
- Runs are Claude's, cloud workspace, one at a time. No Mac, phone, Safari or accessibility run; a file-comparison repair gives none.

**Carried forward from GPT's review, not done here (the reviewed test file is unchanged):**
1. Two checks are labelled 13f (the new Timeline-baseline check and the older Earth-now isolation check). Rename one at the next change to the suite.
2. Moving `TL_MAIN` belongs in the Timeline release checklist, prepared on the integrated release candidate, to an accepted release whose file changes were reviewed.
3. If this lands, merge then-current main into `animals-assessment-rc` before its next candidate or release review and rerun the suite there.
4. A Mac rerun with `BASE_DIR` / `TL_DIR` must use verified exports of the named commits.

**Landing** is Chad's own line. Landing changes no page, hub or data file: the live site is unchanged by it.

