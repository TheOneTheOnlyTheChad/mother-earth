# Animals: GPT's review of the assessment card proposal rev 1 and the tidy-up candidate (relayed by Chad, 22 Nov 2026)

GPT's text as Chad attached it, filed unchanged below. It is GPT's review, not Chad's decision: the choices in it are GPT's recommendations. Reviewed: `animals-assessment-proposal` at `abc9786` and `animals-tidy-rc` at `7d58f68`.

---

Animals assessment proposal and tidy-up review

22 November 2026. Independent GPT review of the supplied Mac review copies. No merge, deploy or source-audit clearance.

Assessment proposal rev 1 — abc9786

Worth pursuing. A dated species-level extinction-risk category adds useful context alongside a recorded journey or historical census, provided it never represents the tracked individual, local stock, census period or a population trend. The secondary table is discovery material only. No listed category is cleared by this review.

Section 6 step 1 is the right next step: read the primary assessments and current terms before implementation. Record exact scientific taxon/assessment identifier, global or regional scope, category, assessment date, publication/version date, citation/link and check date, with the terms version/date and relevant clause in context. Read BirdLife terms only if BirdLife material will actually be used. For the recommended five-card scope, mule deer research is optional discovery, not a build dependency. If a primary assessment cannot be read, retain unavailable rather than substitute search extracts.

Decisions recommended:

Decision

Recommendation

A-D1

B: four journey cards plus penguin census. Omit mule deer for this build. Penguin wording must describe the assessed species versus the historical colony counts.

A-D2

A: global category only. Explicitly distinguish species-wide scope from a local tracked population or stock.

A-D3

B: Population trend: not shown here; see the assessment. This supplies no trend value or inference and preserves the category-only scope.

A-D4

A: hand-kept cited file, as already accepted. Record an owner and concrete re-check cadence before build; no new API audit is needed for this approach.

A-D5

A: words only.

Corrections before implementation:

Restore publication/version date as distinct from assessment date and Mother Earth's check date, as required by accepted design section 7. Do not infer one from another or a website update label.

Carry C5 into the maintenance design: a failed latest check retains a permitted dated record with a failed-check notice; known withdrawal/replacement or loss of permission suppresses it pending a reviewed usable replacement. Never advance a successful-check date after a failed attempt. Define an overdue-check state. A date label alone cannot guarantee that a record has not become superseded.

Replace the broad question 'how is this species doing?' with the narrower question the card actually answers: 'What extinction-risk category did this dated assessment assign?' Keep legal listings and population trends separate.

For the false killer whale, do not assert that its stock has no separate assessment merely because none was found. State only the verified scope and that no stock-specific assessment was verified for this card.

After the evidence step, return the short evidence record and any design changes for review. If it confirms this bounded design, a second full build proposal is unnecessary; a branch build brief with the records, maintenance states and C1–C6 checks is sufficient.

Tidy candidate — 7d58f68

No merge-blocking finding. Ready for Chad's merge decision, with one small test-claim correction below.

Compared the review tree against the local main copy: animals.js, animals-globe.js, animals-journey.js and animals-census.js each remove PRIVATE PREVIEW from one header comment; style.css changes one comment. animals.html is identical. No executable change in these served files. Leaving version stamps unchanged is appropriate. Leaving the hash-pinned builder docstring alone is appropriate.

Read section 12 and its wheel-not-a-move mutation. Real browser wheel events check outward/inward altitude movement, approximate centre stability, lack of page scrolling, corridor retention, user-move wording, return to manifest view and page errors. Removing the controls start listener is a meaningful negative control for the move-wording assertion.

Small correction: 12a says the scale is worked out again, but asserts only that it is visible and nonempty. Narrow that claim to 'scale remains available after zoom', or add an independent expected-scale assertion. This does not invalidate the wheel movement checks or block the comment-only release.

Independent verification: node --check of the candidate corridor suite passed. Full browser suites and the mutation were not rerun here: Playwright is unavailable in this shell environment. Claude reports corridor 102/102, tab 277/277, census 71/71 and the new mutation caught at 12a. These remain reported runs, not independently reproduced runs. Section 12 uses the default regional-picture refusal path; section 11 separately covers the picture. No performance, trackpad-pinch or continuous-edge claim follows from this addition.