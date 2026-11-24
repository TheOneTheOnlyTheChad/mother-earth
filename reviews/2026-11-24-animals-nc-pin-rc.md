# Animals tab suite: `NC_MAIN` pin for the Nature context page commit (test-only candidate)

24 Nov 2026 10:37 UTC (clock reading) · rev 1 · for GPT · branch `animals-nc-pin-rc` at `0081f69` (the suite change), cut from main `6bebc21` · **one test file changed; no page, hub or data file; not merged, nothing deployed**

Written by the Animals thread (owner of `phase1/animals-tab-ui.test.cjs`) at the Nature context thread's request, `docs/concepts/NATURE-CONTEXT-ANIMALS-PIN-REQUEST.md` (main `6bebc21`), relayed by Chad on 24 Nov 2026. The reviewed page commit is **H = `90eb52203c23b26a7fe00382f30cf3453b00a583`** on `nature-context-rc` (GPT's recheck PASS; H is an ancestor of the branch tip `29492a9`, which adds only records). All runs are Claude's, cloud workspace, one at a time. No Mac or real-browser run.

## 1. What changed, item by item against the request

| Request §2 | Done |
|---|---|
| 1. `NC_MAIN` = H, the immutable reviewed commit | `const NC_MAIN = '90eb5220…a583'`, plus `NC_PARENT = '6bebff18…6c9f50'` for the scope check. Comment: only a Nature context release moves them, in the commit that records the release. Optional `NC_DIR` reads the files from a folder (as `TL_DIR`); the scope check always needs Git |
| 2. 13c: `app.js` out of `same`, own check | `same` is 15 files, still on `BASE_MAIN`; the list length and the absence of `app.js` are asserted. **New 13k:** `app.js` byte-identical to H's |
| 3. 13b and 13e, form (ii) | **13b:** `index.html` byte-identical to H's, **and** on its own: Animals tab link once, menu link once, `<header>` equal to `BASE_MAIN`'s except those links. **13e sources.html:** byte-identical to H's, **and** on its own: both links once, header as above, the Animals section, its one shortcut in the Sections list, all six source identifiers, the Low-use-class sentence, no "private preview". Each clause is printed separately on failure |
| 4. Scope check, explicit allowed list | **New 13j:** `NC_PARENT` is an ancestor of `NC_MAIN`, and `git diff --name-only NC_PARENT NC_MAIN` lists only: the pages `app.js`, `index.html`, `sources.html` (all three must be present); the tests `phase1/nature-context-ui.test.cjs`, `phase1/place-rows.test.mjs`, `phase1/place-ui.test.cjs`; and records matching `reviews/2026-11-24-nature-context-*.md` or `reviews/evidence/2026-11-24-nature-context-rc/*`. Anything else is listed on failure. Also asserts `NC_MAIN` differs from `BASE_MAIN` and `TL_MAIN` |
| 5. Negative checks | Section 4 below |
| 6. Unchanged | `BASE_MAIN`, `TL_MAIN`, 13a, 13d, 13f–13i, `moon.html` and `sun.html` in 13e, the 15 files of 13c, every other section. The `diff` in `evidence/…/suite.diff` shows no other line changed except one existing break's target (below) |

**One existing break moved.** `earth-script-edited` edited `app.js` to prove 13c catches a changed Earth-now script. `app.js` is now 13k's, so that break now edits `layers.js` (still in 13c) and keeps proving 13c; the `app.js` edit became the new break `nc-app-edited`, caught at 13k.

## 2. Results

| Run | Tree | Result | Log |
|---|---|---|---|
| Full suite, old suite | H (= request's "today on H") | 277 passed, **3 failed** (13b, 13c, 13e sources.html), exit 1 | `before-full-H-old-suite.log` |
| Full suite, candidate | trial tree: candidate merged with H, local only, never pushed (`3735051`, parents `0081f69` and H) | **282 passed, 0 failed**, exit 0 | `trial-full.log` |
| `hub-alignment` | trial tree | 6 passed | `trial-hub-alignment.log` |
| Section 13, candidate | the candidate branch alone (main's current page files) | 11 passed, **3 failed: 13b, 13k, 13e sources.html** | `candidate-alone-s13-main-pages.log` |

Count: 277 + 3 = 280 checks on H; the candidate adds 13j and 13k: 282.

The third row is intended: main's `app.js`, `index.html` and `sources.html` are not the reviewed bytes, so the pinned checks fail until H is on the tree. See section 5, point 1.

## 3. Breaks: eighteen, each alone on the trial tree, eighteen caught at the named check (`trial-breaks.log`)

The ten existing section-13 breaks (now including `earth-script-edited` on `layers.js`), still caught at 13c, 13d, 13e moon.html, 13g, 13h ×3, 13i ×3; and eight new:

| Break | Unintended change | Caught at |
|---|---|---|
| `nc-app-edited` | one space in `app.js` | 13k |
| `nc-index-edited` | one space in `index.html` | 13b |
| `nc-index-tab-gone` | Animals tab link removed from `index.html` | 13b |
| `nc-index-menu-gone` | Animals menu link removed from `index.html` | 13b |
| `nc-sources-edited` | one space in `sources.html` | 13e sources.html |
| `nc-sources-tab-gone` | Animals tab link removed from `sources.html` | 13e sources.html |
| `nc-sources-id-gone` | one required source identifier altered | 13e sources.html |
| `nc-sources-shortcut-gone` | the Animals shortcut removed from the Sections list | 13e sources.html |

A break whose text is not found exactly once stops with "edit did not apply" and is not a catch (one did on the first pass: `10.5066/P1ETBSYE` occurs twice on the page; it was moved to `ptt id 98364`, which occurs once, and all eighteen were rerun).

## 4. Controls for request §2 item 5

| Control | Setup | Result | Log |
|---|---|---|---|
| 1. Missing `NC_MAIN` commit fails closed | `NC_MAIN` set to a commit that does not exist | 13b, 13k, 13e sources.html and 13j each report NOT RUN and count as failures; exit 1 | `control-1-missing-nc-commit.log` |
| 2a. Baseline also lacks the Animals tab link | `NC_DIR` = H's three files with the tab link removed from `index.html`; the tree matches it (`BREAK=nc-index-tab-gone`) | 13b fails with `whole: true, links: false, header: true` | `control-2a-baseline-also-lacks-tab-link.log` |
| 2b. Baseline also lacks a required Sources element | `NC_DIR` = H's files with `ptt id 98364` altered in `sources.html`; the tree matches it | 13e sources.html fails with `whole: true`, `missing: ["ptt id 98364"]` | `control-2b-baseline-also-lacks-source-id.log` |
| 3. Pin inequality alone is not enough | `NC_MAIN` = a local commit `c499bf8` (never pushed) on top of H that also edits `style.css`; `app.js`, `index.html`, `sources.html` unchanged, so 13b, 13k and 13e pass | 13j fails and lists `["style.css"]` | `control-3-pin-with-extra-production-file.log` |
| 4. A wider range is caught | `NC_PARENT` set back to `0e62083` | 13j fails | `control-4-older-parent.log` |

## 5. For GPT to judge

1. **Landing order.** On main as it is (pages at `6bebff1`), the candidate's 13b, 13k and 13e sources.html fail; on main plus H without the candidate, the old 13b, 13c and 13e fail. Either change alone leaves the suite red. Claude's recommendation: land the candidate in the same release as H. Either merge `animals-nc-pin-rc` and H together on fresh main before the one push, or merge the candidate into the release branch first, then rerun `animals-tab-ui` on the merged tree. That is the order in the request's §3.
2. **`NC_DIR` is accepted for the byte comparisons** (as `BASE_DIR` and `TL_DIR`); the scope check 13j always needs Git and fails closed without it. As GPT noted for the other folder inputs, a folder is supplied material, not authenticated by the constant: a Mac rerun must use verified exports of H.
3. **The records pattern in 13j** accepts any `reviews/2026-11-24-nature-context-*.md` and any file directly in `reviews/evidence/2026-11-24-nature-context-rc/`. That is the request's "record paths listed separately", written as two patterns rather than a file list; a stricter literal list is a small change if preferred.
4. **13b and 13e compare the stylesheet version exactly** (through byte identity with H), as 13h does for the Timeline page. The earlier forms set it aside.
5. **The two checks labelled 13f** (carried forward from the last review) are still both 13f; not touched here, to keep the change to what was asked.

## 6. Files

- Changed: `phase1/animals-tab-ui.test.cjs` (sha256 `2921d437…cc38`; diff from main `6bebc21`: `evidence/2026-11-24-animals-nc-pin/suite.diff`).
- Added: this record and `reviews/evidence/2026-11-24-animals-nc-pin/` (thirteen logs and the diff).
- Mac review copy: `~/Documents/Mother Earth/_review/animals-nc-pin-rc/`, plain-text copies under `read/`.
