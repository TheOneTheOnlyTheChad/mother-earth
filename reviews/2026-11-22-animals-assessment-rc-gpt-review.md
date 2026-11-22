# Animals assessment card: GPT review of the branch candidate (relayed by Chad, 22 Nov 2026)

Two GPT texts, filed unchanged. Neither is Chad's decision. Reviewed: `animals-assessment-rc` at `ff393e1`.

## 1. The review (Chad's attachment)

Animals assessment candidate review

22 November 2026. Candidate animals-assessment-rc ff393e1; supplied Mac tree. Branch/code review only. No build, merge, provider message or production action performed.

Verdict: no release-blocking code defect found in the reviewed implementation. Accept the five brief differences and the three clarification implementations. The code is acceptable as a branch candidate, subject to the documentation/enquiry corrections below. R1 remains open; this is not public-release clearance.

Code and five differences

Separate penguin assessment section immediately after the census: accepted. It is explicitly titled and the unit sentence keeps the historical counts separate. Preserving the census tests is useful evidence, but semantic clarity is the reason this placement is acceptable.

One small JSON file with its hash pinned in the module, without an intermediate manifest/list: accepted for this fixed five-record payload. This verifies the chosen bytes, not the truth or currency of their contents; independent source expectations remain necessary and are present.

Reload instead of Retry: accepted for this small independent block. Failure gives unavailable wording; the other page modules are unaffected.

Assessment-page link beside DOI: accepted.

Reject the source-generated Accessed date in the builder: accepted. It avoids copying the site's stale generated date as our check date.

The builder validates real dates, date precision, ID/URL/DOI consistency, field bounds and exact due-date arithmetic. The page checks the pin and needed shape before rendering, builds content with text nodes, suppresses before rendering a category, and independently adds failed-attempt and overdue notices. The fuller chronology checks live in the builder; the page is not claimed to repeat every builder rule. Independent five-record expectations are present in both test suites. A hand-entered false claim of successful checking remains a human/provenance limitation, honestly stated.

Read all five WANT blocks and viewed the supplied whale and penguin stills. The global/species versus individual/census distinctions, shark amendment wording, whale 2018 publication/2019 errata wording and stock-not-verified wording are acceptable. No trend value or Green Status value is introduced. Full citations make the blocks longer than the initial short-card sketch, but they remain clear and bounded; no redesign requested.

Verification

Independently ran:

build_assessments.test.py: 86 passed, 0 failed.

build_assessments.py --check: identical; shipped SHA-256 b1c7afa961875ab302eff3556110d78fe60b7422fdd015178214cd9fe5d58265.

Node syntax checks for animals-assessment.js and animals-assessment-ui.test.cjs: passed.

Compared changed HTML, CSS, animals.js, sources.html and existing suite edits against the local main copy. The animals.js edit is header-only. The census-suite exception is narrow to the assessment filename; tab 15a delegates assessment correctness to the new suite while retaining the existing population/sample checks. Four new CSS rules are scoped to assessment classes. No hub change was reviewed or requested.

Did not independently rerun Chromium UI suites or the 15 mutations: Playwright is unavailable in this shell environment. Claude's reported 49 assessment checks, 277 tab checks, 71 census checks, 102 corridor checks and 15 caught mutations remain attributed runs. The mutations predate the last layout/unit-wording edits; the normal checks were rerun afterward. Those edits do not appear to affect the mutation targets, so no blanket repeat is requested solely for that history. The wrong-date mutation plus exact independently recorded date assertions is adequate for the Green Status-date risk.

Required document/enquiry corrections

Correct the C1–C6 mapping in packet section 4. Original C6 says the card remains unavailable until C1 is met; it is not the words-only/no-alarm-colour criterion. Mark C6 pending for public release on R1, and explain that populated branch review blocks are intentional under Chad's branch-build instruction. C2 concerns source fields and assessed unit; C4 concerns the mismatch with the tracked/studied unit. Do not label C6 met merely because colours are absent.

The IUCN enquiry must describe actual distribution: a small static JSON file containing the five records is served to visitors, and the hand-kept source/generated file and code are stored in the repository. Its own notes say that repository is public. Ask expressly about this storage/public distribution of the listed ancillary fields alongside the displayed text. A permission answer for sentences alone may not cover the JSON/repository distribution.

Resolve the public-branch ambiguity before describing the material as unpublished. If the repository and this branch are public as the draft says, their files may already be publicly accessible even though the site has not merged/released. Verify and record actual visibility; do not equate branch-only with private. No permission or visibility change was made in this review. Update the enquiry to distinguish the website release from any existing repository publication honestly.

Change enquiry point 2 from 'If only the category and citation may be shown, I will show only those' to wording that a narrower reply would lead to a revised design for review. The current sentence precommits to a fallback the brief explicitly reserves for separate C2 review.

REGISTER: keep R1 as a real unresolved placeholder. Treat non-commercial use as the factual project scope confirmed by Chad and the eventual permission's terms, rather than an unqualified restriction inferred from the category exception. Include hand-kept/static-JSON/repository distribution in the eventual clearance basis. Preserve R2 as pending after release until a copy/link in IUCN's accepted form has actually been sent or IUCN confirms it unnecessary.

Suggested enquiry addition: 'The five records would be stored by hand in my repository and served as a small static JSON file to visitors, from which the page renders these sentences. The repository is [actual visibility], and [accurate statement of whether these candidate files are already publicly accessible]. Does your answer cover this storage and distribution of the listed fields as well as the page display?'

No new phone, Safari, screen-reader, performance or source-audit work is requested. Before public release: close R1 for the actual distribution, settle the visibility description, correct the criterion mapping and drafts, incorporate any reply-driven changes for review, then Chad's REGISTER/merge approvals. After release: served-file verification and R2 tracked to closure.

## 2. GPT's later note on R1, pasted by Chad in the same message

Yes bro—we did read the terms, and they permit non-commercial conservation, education and research use. The complication is that they separately restrict reposting or redistribution, while expressly exempting categories associated with named taxa.

So the unresolved point is narrower: whether that category exception also covers publishing the accompanying dates and scope—including in the downloadable JSON. Non-commercial use alone doesn't explicitly settle that separate clause.

I was too categorical in turning this into "IUCN must reply." Our agreed R1 can close through either a clear applicable IUCN statement or a clarification from them. An email is one route, not automatically the only route.

I'd correct Claude's wording to: The code review is complete. The remaining release question is the permission basis for publishing the assessment metadata alongside the category. We have already read the non-commercial-use permission; we need to reconcile it with the separate redistribution clause. IUCN clarification is one way to resolve that.

Your memory is right. We shouldn't repeat the whole source audit or describe the categories themselves as awaiting permission.
