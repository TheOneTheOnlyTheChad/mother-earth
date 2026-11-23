# Animals assessment card: branch candidate, for GPT's review

22 Nov 2026 · branch `animals-assessment-rc` (cut from main `6222728`; the docs branch `animals-assessment-proposal` is merged in) · by Claude ("Animals satellite picture" thread).

**Authority.** Chad's own line of 22 Nov: "Go: assessment card build on a branch per ANIMALS-ASSESSMENT-CARD-BUILD-BRIEF rev 1. Branch only, no merge." GPT's review of the brief, relayed by Chad the same day, is filed as `reviews/2026-11-22-animals-assessment-brief-gpt-review.md`; its three clarifications are built in (section 3).

**Status, 23 Nov 23 Nov 04:21 UTC (Claude, clock reading): TECHNICALLY COMPLETE, PARKED.** GPT has reviewed the candidate (22 Nov, `…-rc-gpt-review.md`) and the citation access-date diff (23 Nov, PASS, `reviews/2026-11-23-animals-assessment-citation-diff-gpt-review.md`); GPT names no code or test item left open. Code is `7be31cc`. **Not released and not cleared for release.** Waiting on: R1 (the permission basis for the fields beside the category); Chad's own release decisions and Approve lines (REGISTER, then the merge); R2 tracked after release. Before any merge: merge current main into the branch and rerun the six checks. GPT's note for upkeep: the page's "ccessed" rule is broad and case-sensitive; a future citation caught by it needs review. The lines below are the packet as first written.

**Nothing is live.** No merge, no REGISTER filing, no message to IUCN. **Release dependency R1 is open**, so this candidate cannot be cleared for the public page yet, whatever its tests say.

## 1. What was built

| File | What |
|---|---|
| `phase1/animals/red-list-assessments.json` | The hand-kept record: five records, values as in the evidence record. |
| `phase1/animals/build_assessments.py` | Builder with ten refusal rules; `--check` mode. Writes the shipped file. |
| `assets/animals/assessments-R1.json` | The shipped file, 5,512 bytes, sha256 `b1c7afa9…8265`. |
| `animals-assessment.js` | New page module. Fetches that one file, checks the pinned checksum and each record's shape, fills five blocks. |
| `animals.html` | Four journey cards: the "Not available yet" paragraph becomes the block. One new small section for the penguin. New script tag. Stamps: `style.css`, `animals.js` and the new script at `202612250100`. |
| `style.css` | Four rules. |
| `animals.js` | Header comment only. |
| `sources.html` | Animals section: one new paragraph for IUCN, two sentences reworded. |
| `phase1/animals/build_assessments.test.py` | 86 checks. |
| `phase1/animals-assessment-ui.test.cjs` | 49 checks, 15 deliberate breaks. |
| `phase1/animals-tab-ui.test.cjs` | Check 15a reworded: the card now has an assessment block where the fixed sentence was. |
| `phase1/animals-census-ui.test.cjs` | Check 1b, one clause: the page now also asks for `assessments-R1.json`, which that check would have counted as a journey file. Nothing else in the census suite changed. |
| Drafts, not filed or sent | `reviews/2026-11-22-animals-assessment-register-draft.md`; `docs/research/animals-source-audit/ENQUIRY-DRAFT-IUCN.md`. |

Animals does not touch the hub. Nothing is fetched from the Red List by the page.

## 2. Differences from the brief, each for GPT to accept or refuse

1. **The penguin block is in its own small section straight after the census section, not inside it.** Inside it, the census card's own rule ("if a check fails, nothing is shown and no number") and four checks of its suite (1g, 4a, 4b, 4c) and its claim check 7b ("no conservation category on the card") would all have had to be weakened. Kept apart, the census suite needed one clause changed (check 1b, section 1) and nothing weakened. Heading: "African penguin: conservation assessment". Sentence: "The charts above are counts…" (the brief said "The chart is").
2. **One shipped file with its checksum pinned in the script; no separate manifest or list file.** The brief said "with a manifest and a pinned hash, as the journeys, census and corridor files have". Those have three levels because a large data file sits behind a small manifest. Here the whole record is 5.5 kB. One file and one pin gives the same guarantee with fewer places to disagree.
3. **No Retry button.** If the file cannot be loaded the five blocks say so; a reload tries again.
4. **The citation line also carries a second link, "Assessment page"**, to the Red List's own page, beside the DOI.
5. **The "Accessed on" date is refused by the builder** (rule 4), not only left out.

## 3. GPT's three clarifications, where each is

| Clarification | Where | Check |
|---|---|---|
| 1. Suppressed or invalid data always hides the category; failed and overdue can both show; a failed attempt cannot reset the clock; permission loss is not overridden by a checked state | Module: suppression is tested before any check state. Builder rule 9: due date must equal the last SUCCESSFUL check plus six months. | UI 5a, 5c, 4e; builder 9a, 9b; breaks `suppressed-shows-category`, `overdue-hides-failed`, `failed-advances-check-date` |
| 2. Dates validated at their own precision; errata year may follow the publication year; the whale's 2018 + 2019 is a required valid fixture | Builder rule 5: `assessed` a full date; `published_year` a year; amended note carries `of_year`; errata note carries `year`; years compared as years, no day invented | Builder 5a to 5i, V2; UI 2a (whale sentence); break `whale-this-version-2018` |
| 3. Independent expectations | The five records are typed a second time in each suite, from the evidence record, not read from the record file | Builder S1 to S6 (both the record file and the shipped file); UI 2a to 2c word for word; breaks `wrong-assessment-date`, `wrong-category` (a wrong value, correctly built and pinned, is caught) |

**A limit, stated.** No rule can see a failed attempt typed in as a successful check (builder test 9c records this). That honesty rests on the person doing the check and on the STATUS entry for it.

## 4. Criteria C1 to C6 (corrected 22 Nov after GPT's candidate review: the first mapping misread C6 and blurred C2 and C4)

The criteria are quoted in short from `docs/concepts/ANIMALS-PROPOSAL.md` §8, lines C1 to C6.

| | Criterion, as written | State | Evidence |
|---|---|---|---|
| C1 | A source audit has been reviewed and its terms allow the intended display (and caching, if cached) | **OPEN on R1.** The terms were read by Claude and by GPT. They allow non-commercial use and free the category. Section 4 separately bars reposting and redistribution, and does not say the category's exemption reaches the assessment date, publication year and scope, on the page or in the served file. | Evidence record §1; GPT's evidence and candidate reviews |
| C2 | The card shows the category, the assessment date, the scope and the assessed taxon, each from the source | Built on the branch. Whether the date and scope may be published is R1. | UI 2a, 2b; builder S1 to S4 |
| C3 | Population trend, where the source gives one, is a separate field from the risk category, with its period | **Not built as written, by Chad's decision A-D3 B:** no trend value is shown; a line says so and points to the assessment. Risk is never worded as trend. | UI 2d; builder rule 1; break `trend-shown` |
| C4 | Where the assessed unit differs from the tracked animals, the card says so in words | Built on the branch | UI 2c, 2f, 2g; break `claims-no-stock-assessment` |
| C5 | A failed retrieval does not erase a permitted, dated assessment; "Not available" when the terms no longer allow display or the assessment is withdrawn or replaced; never shown without its date | Built on the branch, for a hand-kept record (the "retrieval" is the six-monthly check by a person) | UI 4a to 4e, 5a to 5c, 6a to 6f |
| C6 | Until C1 is met the card reads "Not available yet" | **PENDING for the public page, on R1.** The live page still reads "Not available yet" and stays so until C1 is met. The filled blocks exist only on this branch, built for review under Chad's branch-build line. They are not a claim that C6 is satisfied. | Live `animals.html` unchanged; this branch unmerged |

"Words only, no colour" is decision A-D5 A, not a criterion. It is built and tested (UI 2e; break `colour-badge`).

**Where the five records can already be read.** The repository is public. This branch and the docs branch are pushed to it, so the hand-kept record, the shipped JSON file, the tests and the evidence record are publicly reachable there now, though the website does not show or serve them. Checked: the branch's files were fetched from GitHub's raw address at commit `ff393e1` from the Mac's shell with no credentials (22 Nov). "Branch only" means not on the website; it does not mean private. Whether to leave them there while R1 is open is Chad's decision (section 7).

## 5. Test results (Claude's runs, cloud workspace, Chromium with software rendering)

- `build_assessments.py --check`: identical.
- `build_assessments.test.py`: **86 passed, 0 failed** (43 refusals, 1 stated limit, 5 valid fixtures, 34 source-accuracy checks, 3 pin checks).
- `animals-assessment-ui`: **49 passed, 0 failed**.
- Deliberate breaks, each run alone: **15 of 15 caught** at the check named for it: `wrong-assessment-date`, `wrong-category`, `whale-this-version-2018`, `failed-advances-check-date`, `suppressed-shows-category`, `trend-shown`, `regional-shown`, `claims-no-stock-assessment`, `no-pin-check`, `no-shape-check`, `overdue-hides-failed`, `never-overdue`, `failed-not-said`, `contacts-red-list`, `colour-badge`. One break (`claims-no-stock-assessment`) first failed to apply because of a typing slip in the suite; fixed and rerun. **The breaks were run before the last two edits to the module** (the penguin block moved to its own section in `animals.html`; "The chart is" became "The charts above are"). Neither edit touches a rule a break tests. The 49 checks were rerun after them; the 15 breaks were not.
- Existing Animals suites on the final code: `animals-tab-ui` **277 passed, 0 failed**; `animals-census-ui` **71 passed, 0 failed**; `animals-corridor-ui` **102 passed, 0 failed**. The journeys are covered by the tab suite. The tab and corridor runs were on the final code; the census suite's final run followed one more one-clause edit to that suite only (section 1).
- Two stills of the blocks: `reviews/evidence/2026-11-22-animals-assessment-rc/`.

**Not tested:** a real phone, Safari, a screen reader, print (parked). Nobody but Claude has looked at the blocks. The other pages' suites were not rerun: the only shared files changed are `style.css` (four added rules, no rule changed) and the Animals section of `sources.html`.

**`wrong-assessment-date` stands in for the Green Status risk.** The Green Status dates on the white shark and penguin pages were not recorded in the evidence record, so the break uses another date. What is proven: any assessment date other than the reviewed one fails.

## 5a. Change of 23 Nov: the citation's access date (GPT's recommendation, relayed by Chad; filed as `reviews/2026-11-23-animals-assessment-citation-gpt-review.md`)

IUCN's citation guidance (`/about/citationinfo`, read by Claude and separately by GPT) ends a citation with the user's own access date. Built as GPT set out:

- The citation on each card now ends "Accessed on 22 November 2026." The page builds it from `last_successful_check`. It is never the reader's clock, the build date, a failed attempt's date, or the date the Red List page prints.
- The hand-kept citation still carries no access date, and the builder still refuses one (rule 4). The page now refuses such a record too.
- "Checked by Mother Earth on …" stays as the upkeep statement. For this workflow the two dates are the same date by design.
- Files changed: `animals-assessment.js` (two lines and a comment), `phase1/animals-assessment-ui.test.cjs`. The shipped JSON file and its checksum are unchanged.

Checks (Claude's runs): `animals-assessment-ui` **51 passed, 0 failed** (2b now requires exactly one access date, the right one, on all five; new 4f: unchanged after a failed attempt; 4c and 4e: unchanged when overdue and when failed and overdue; new 6g: a typed-in "Accessed" date is not shown). Builder tests 86 passed, 0 failed. Three new breaks, each run alone, each caught: `accessed-from-failed-attempt`, `accessed-from-readers-clock`, `imported-accessed-kept`. **Not rerun after this change:** the earlier 15 breaks and the tab, census and corridor suites. The change touches only the citation line; the tab suite reads only the start of the block.

**Update, 23 Nov 03:50 UTC (Claude):** the reruns named above as not done have now been done on `7be31cc`: all 18 breaks caught, tab 277, census 71, corridor 102, all passing. The focused package for GPT is `reviews/2026-11-23-animals-assessment-citation-diff.md`.

Also on 23 Nov: the signed-in advanced search for *Pseudorca crassidens* found 0 subpopulation assessments (evidence record §8). GPT: it strengthens the evidence; the card's "not verified" wording stays.

## 6. What GPT is asked

1. Do the five differences in section 2 stand?
2. Are the three clarifications carried correctly?
3. Read the five blocks' wording (UI suite `WANT`, or the stills).
4. The REGISTER draft and the IUCN enquiry draft: wording.
5. Anything missing before this could be released, apart from R1 and Chad's lines.

## 7. What a release still needs

- **R1 closed**: the permission basis for publishing the assessment date, publication year and scope beside the category, on the page, in the served JSON file and in the public repository. It can close through a clear IUCN statement that applies, or through IUCN's answer to a question. Claude looked for such a statement on 22 Nov in two more places on the Red List site, the Summary Terms page and the FAQ page, and found none: the summary restates non-commercial use, attribution and no redistribution, with waiver by permission; the FAQ says the data are free for non-commercial use. Neither mentions the category exemption or its reach. The categories themselves are not waiting on permission.
- **Chad's decision on the branch files** already in the public repository (leave them, described honestly in any enquiry; or remove the branches from GitHub until R1 closes, which does not recall copies already fetched).
- **Enquiry sent by Chad to the Red List Unit on 23 Nov 2026** (rev 2.3; no reply reported). It also asks about the API; no token is requested before a reply.
- GPT's candidate review found no release-blocking code defect (22 Nov). The citation access-date change of 23 Nov has not had a code-diff review by GPT.
- Chad's own Approve lines: file the REGISTER entry, then merge.
- After release: the served-file check, and R2 (the copy to IUCN) tracked to closure.
