# Animals assessment card: branch candidate, for GPT's review

22 Nov 2026 · branch `animals-assessment-rc` (cut from main `6222728`; the docs branch `animals-assessment-proposal` is merged in) · by Claude ("Animals satellite picture" thread).

**Authority.** Chad's own line of 22 Nov: "Go: assessment card build on a branch per ANIMALS-ASSESSMENT-CARD-BUILD-BRIEF rev 1. Branch only, no merge." GPT's review of the brief, relayed by Chad the same day, is filed as `reviews/2026-11-22-animals-assessment-brief-gpt-review.md`; its three clarifications are built in (section 3).

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

## 4. Criteria C1 to C6

| | Criterion (short) | State | Evidence |
|---|---|---|---|
| C1 | Reuse terms read and recorded | **OPEN on R1.** Section 3 covers the category. The date and scope fields beside it are not settled. | Evidence record §1; GPT's evidence review; enquiry draft |
| C2 | Scope stated; not the animal shown | Met on the branch | UI 2a ("global assessment of"), 2c, 2f, 6c |
| C3 | Risk category never presented as a trend | Met on the branch | UI 2d; builder rule 1; break `trend-shown` |
| C4 | Right assessment for the right taxon | Met on the branch | Builder rule 4, S2, S3; UI 2a, 2b |
| C5 | Dated; failed check, withdrawal and replacement handled | Met on the branch | UI 4a to 4e, 5a to 5c, 6a to 6f |
| C6 | Words only; no alarm colour | Met on the branch | UI 2e; break `colour-badge` |

Criterion wording here is Claude's short form of `docs/concepts/ANIMALS-PROPOSAL.md` §8C; GPT should read the originals.

## 5. Test results (Claude's runs, cloud workspace, Chromium with software rendering)

- `build_assessments.py --check`: identical.
- `build_assessments.test.py`: **86 passed, 0 failed** (43 refusals, 1 stated limit, 5 valid fixtures, 34 source-accuracy checks, 3 pin checks).
- `animals-assessment-ui`: **49 passed, 0 failed**.
- Deliberate breaks, each run alone: **15 of 15 caught** at the check named for it: `wrong-assessment-date`, `wrong-category`, `whale-this-version-2018`, `failed-advances-check-date`, `suppressed-shows-category`, `trend-shown`, `regional-shown`, `claims-no-stock-assessment`, `no-pin-check`, `no-shape-check`, `overdue-hides-failed`, `never-overdue`, `failed-not-said`, `contacts-red-list`, `colour-badge`. One break (`claims-no-stock-assessment`) first failed to apply because of a typing slip in the suite; fixed and rerun. **The breaks were run before the last two edits to the module** (the penguin block moved to its own section in `animals.html`; "The chart is" became "The charts above are"). Neither edit touches a rule a break tests. The 49 checks were rerun after them; the 15 breaks were not.
- Existing Animals suites on the final code: `animals-tab-ui` **277 passed, 0 failed**; `animals-census-ui` **71 passed, 0 failed**; `animals-corridor-ui` **102 passed, 0 failed**. The journeys are covered by the tab suite. The tab and corridor runs were on the final code; the census suite's final run followed one more one-clause edit to that suite only (section 1).
- Two stills of the blocks: `reviews/evidence/2026-11-22-animals-assessment-rc/`.

**Not tested:** a real phone, Safari, a screen reader, print (parked). Nobody but Claude has looked at the blocks. The other pages' suites were not rerun: the only shared files changed are `style.css` (four added rules, no rule changed) and the Animals section of `sources.html`.

**`wrong-assessment-date` stands in for the Green Status risk.** The Green Status dates on the white shark and penguin pages were not recorded in the evidence record, so the break uses another date. What is proven: any assessment date other than the reviewed one fails.

## 6. What GPT is asked

1. Do the five differences in section 2 stand?
2. Are the three clarifications carried correctly?
3. Read the five blocks' wording (UI suite `WANT`, or the stills).
4. The REGISTER draft and the IUCN enquiry draft: wording.
5. Anything missing before this could be released, apart from R1 and Chad's lines.

## 7. What a release still needs

- **R1 closed** by IUCN's answer (Chad's message to send).
- GPT's pass on this candidate.
- Chad's own Approve lines: file the REGISTER entry, then merge.
- After release: the served-file check, and R2 (the copy to IUCN) tracked to closure.
