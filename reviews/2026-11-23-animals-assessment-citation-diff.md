# Animals assessment card: focused review package for the citation access date

Written by Claude, 23 Nov 2026, 03:50 UTC (workspace clock reading). For GPT's focused review. Branch `animals-assessment-rc` only. Nothing merged, nothing live, no IUCN message, no API token.

Chad's line (his own message, 23 Nov): "Prepare the focused citation access-date review package for GPT: the diff from the reviewed candidate, updated test expectations, results and three new deliberate breaks. Include the check that a failed attempt leaves both dates unchanged. Branch only; no merge, API token or follow-up to IUCN."

## 1. What is reviewed

| | |
|---|---|
| Reviewed candidate (GPT, 22 Nov) | `ff393e1` |
| Code under review now | `7be31cc` (the code change is commit `10d8d97`; every later commit is docs only) |
| Code files that differ between the two | two: `animals-assessment.js`, `phase1/animals-assessment-ui.test.cjs` (22 lines added, 12 removed) |
| The diff itself | `reviews/evidence/2026-11-23-animals-assessment-citation/citation-focused.diff` (121 lines, sha256 `6f7e0c5b…291c`) |
| `animals-assessment.js` | was `26bf2016…5b8a`, now `2df25f9a…3a1a` |
| `phase1/animals-assessment-ui.test.cjs` | was `c0aaef68…10e4`, now `9424eb13…902f` |
| Shipped file `assets/animals/assessments-R1.json` | unchanged, `b1c7afa9…8265`; `build_assessments.py --check` says identical |
| Not changed | the hand-kept record, the builder and its tests, `animals.html`, `style.css`, `sources.html`, every other page file |

The change follows GPT's recommendation filed as `reviews/2026-11-23-animals-assessment-citation-gpt-review.md`.

## 2. The change in the page script (three places)

1. **The citation line.** Was `Citation: <citation> <DOI link>. <Assessment page link>.` Now `Citation: <citation> <DOI link>. Accessed on <date>. <Assessment page link>.` The date is the record's `last_successful_check`, printed by the same `day()` helper as the "Checked by Mother Earth on" date. It is not the reader's clock, the build date, the failed attempt's date, or a date from the Red List page.
2. **The shape rule (`wellFormed`).** A record whose citation text contains "ccessed" is refused, so it shows "Not available" and no category. The builder already refuses such a record (its rule 4); the page now refuses it too if one arrives correctly pinned.
3. **The file's header comment** says both of the above.

Nothing else in the script changed. The record carries no access date of its own; there is one stored date and two sentences printed from it.

## 3. Updated test expectations

The page suite went from 49 checks to 51.

| Check | Before (`ff393e1`) | Now |
|---|---|---|
| `WANT` citation text, all five species | ended "…en. Assessment page." | ends "…en. Accessed on 22 November 2026. Assessment page." Typed in the suite, not read from the file |
| 2b (five checks) | required no "Accessed" anywhere in the block | requires the exact citation, exactly one "Accessed on" in the block, and the ending " Accessed on 22 November 2026. Assessment page." |
| 4c overdue | category sentence unchanged on all five | also the citation unchanged on all five |
| 4e failed and overdue | category sentence unchanged | also the citation unchanged |
| **4f (new)** | none | after a failed attempt the citation still ends "Accessed on 22 November 2026", once |
| **6g (new)** | none | a record whose citation has a typed-in "Accessed on 19 November 2026." is not shown, even correctly pinned; the other four are shown with one access date each |

## 4. A failed attempt leaves both dates unchanged

The two dates on a card are "Checked by Mother Earth on …" and the citation's "Accessed on …".

**Fixture A (checks 4a, 4b, 4f).** Plains zebra record with `last_attempt` set to 1 March 2027, result failed; the reader's clock fixed at 2 March 2027 10:00 UTC. The file is re-pinned by the harness, so the page's own rules are what runs.

- 4a: the category is still shown, with "The latest check on 1 March 2027 could not be completed." and no overdue notice.
- 4b: the category sentence is word for word the reviewed one, ending "Checked by Mother Earth on 22 November 2026."
- 4f: the citation is word for word the reviewed one, ending "Accessed on 22 November 2026. Assessment page.", with "Accessed on" appearing once in the block.

**Fixture B (check 4e).** African penguin record with a failed attempt on 30 May 2027; clock at 1 June 2027 10:00 UTC. Both notices show, and both the category sentence and the citation equal the reviewed text.

**Each date is tested on its own.** Two breaks move one date and leave the other right:

| Break | What it does | Caught at | Also failed |
|---|---|---|---|
| `failed-advances-check-date` (from the reviewed candidate) | "Checked by" follows the failed attempt | 4b | 4e |
| `accessed-from-failed-attempt` (new) | "Accessed on" follows the failed attempt | 4f | 4e |

**The record side (builder tests, unchanged, rerun).** 9b: a failed attempt cannot reset the six-month due date. V3: a failed attempt with the successful check and due date left alone builds. 9c is the stated limit that stands: a failed attempt typed in as the successful check is not something a rule can see.

## 5. Results (Claude's runs, cloud workspace, 23 Nov 2026, on `7be31cc`)

Each suite and each break was run alone, one after another. Chromium through Playwright 1.63.0, software renderer, 2 cores. Raw logs are in `reviews/evidence/2026-11-23-animals-assessment-citation/`.

| Run | Result | Time (UTC) | Log |
|---|---|---|---|
| `build_assessments.test.py` | 86 passed, 0 failed | 03:19:43 | `builder.log.txt` |
| `build_assessments.py --check` | identical, `b1c7afa9…8265` | 03:19:44 | `builder.log.txt` |
| `animals-assessment-ui` | 51 passed, 0 failed | 03:19:44 to 03:19:55 | `assessment-ui.log.txt` |
| 18 deliberate breaks | 18 of 18 caught, each at its named check | 03:20:03 to 03:23:09 | `breaks.log.txt` |
| `animals-census-ui` | 71 passed, 0 failed | 03:24:21 to 03:27:24 | `animals-census-ui.log.txt` |
| `animals-tab-ui` | 277 passed, 0 failed | 03:34:09 to 03:40:35 | `animals-tab-ui.log.txt` |
| `animals-corridor-ui` | 102 passed, 0 failed | 03:40:38 to 03:49:19 | `animals-corridor-ui.log.txt` |

This closes the gap stated in the candidate packet's section 5a: the 15 earlier breaks and the tab, census and corridor suites have now been rerun on the code with the citation change.

**One run that did not count.** The first `animals-tab-ui` run (03:27:24) reported 269 passed, 1 failed: "NOT RUN 13a–13e: main 0e62083 is not available". The workspace clone was too shallow to hold that commit. After fetching more of main's history the suite was run again in full and that is the result in the table. The first log is kept as `animals-tab-ui.first-run-setup-gap.log.txt`.

## 6. The three new breaks

Each edits the served page script in one place. Detail in `new-breaks-detail.log.txt`.

| Break | The edit | Caught at | Checks that failed |
|---|---|---|---|
| `accessed-from-failed-attempt` | the access date is read from `last_attempt.date` | 4f | 4f, 4e (2) |
| `accessed-from-readers-clock` | the access date is the reader's clock | 2b | 2b on all five, 4f, 4c, 4e, 6g (9) |
| `imported-accessed-kept` | the page no longer refuses a typed-in "Accessed" | 6g | 6g (1) |

**Control: do the new checks fail on the reviewed code?** The current suite was run against a copy of the tree with `animals-assessment.js` taken from `ff393e1` (03:23:59 UTC): 42 passed, 9 failed. The nine are 2b on all five, 4f, 4c, 4e and 6g. So each new or changed expectation fails on the old code and passes on the new. Log: `control-old-code.log.txt`.

## 7. One measurement outside the suites

The citation line is longer, so its fit on a narrow screen was measured (Claude, 03:49:51 UTC; script kept as `wrap-measure.cjs.txt`). The page was loaded at three widths and every piece of citation text was read for its right-hand edge.

| Width | Page scroll width | Right-most citation text, new code | Same, reviewed code |
|---|---|---|---|
| 360 px | 360 | 339.5 | 339.5 |
| 390 px | 390 | 368.4 | 368.4 |
| 1280 px | 1280 | 1197.1 | 1129.6 |

No sideways overflow at any of the three. Limit: the workspace cannot reach the web fonts, so this is with fallback fonts.

## 8. What was not done

- No run on the Mac and no real browser session for this diff. All results are from the cloud workspace.
- No still picture of the new citation line was taken or looked at.
- No real phone, Safari or screen reader (unchanged from the candidate packet).
- Main has moved two docs-only commits past the branch (`STATUS.md`, `HANDOVER.md`). It was not merged in. The handover's rule stands: before any merge, merge current main into the branch and rerun the six.
- Nothing here bears on R1. The permission basis for showing and holding the assessment date, publication year and scope is still open.

## 9. What GPT is asked

1. Does the diff do what the recommendation of 23 Nov set out, and nothing more?
2. The page refuses any citation containing "ccessed". A real citation with that word in a title would be refused and show "Not available". Is that fail-closed rule acceptable as it stands?
3. Are 2b, 4c, 4e, 4f and 6g, with the three breaks and the control, enough for this change?
4. With this diff reviewed, is there any code or test item left open on the candidate, apart from R1, R2 and Chad's release decisions?

A pass here is a code review of a branch candidate. It is not release clearance.
