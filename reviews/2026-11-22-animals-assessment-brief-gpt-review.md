# Animals assessment card: GPT review of build brief rev 1 (relayed by Chad, 22 Nov 2026)

GPT's text as Chad pasted it into his message, filed unchanged below. It is GPT's review, not Chad's decision. Chad's own go for the branch build is a separate line in the same message and is recorded in the candidate packet.

---

Yes—the brief carries the requirements correctly and is ready for your branch-build decision. No further proposal round needed.
Carry three clarifications into implementation:

* State precedence: suppression or invalid data always hides the category. Failed-check and overdue notices can coexist. A failed attempt must not reset the six-month clock.
* Date validation: handle publication and errata years separately, at their actual precision. The whale's 2018 publication plus 2019 errata must remain valid.
* Independent expectations: test the five records against the reviewed evidence, not just against the same editable file used to render them. Otherwise an incorrect but correctly hashed record could pass.

R1 remains open before public clearance. R2 remains a tracked publication task. Both are represented correctly.

Animals assessment build brief rev 1 — review

22 November 2026. Reviewed the supplied Mac copy read/07-BUILD-BRIEF-rev1.txt, branch animals-assessment-proposal be5c9d9, against this thread's evidence review.

Verdict: the brief carries the requirements correctly and is ready for Chad's branch-build decision. No second proposal or separate review round is needed before branch implementation. This is neither a build instruction from Chad nor public-release clearance.

Correctly retained: five global categories, words only; assessment-ID/taxon matching; distinct assessment, publication, amendment/errata and check dates; Red List versus Green Status separation; journey/census scope wording; no stock-specific absence claim; hand-kept pinned file with no hub/IUCN runtime requests; named owner and six-month cadence; failed-check/overdue/suppressed states; meaningful candidate checks and regressions; C1 open on R1; R2 planned as a publication task and messages under Chad's control.

Three implementation clarifications to carry directly into the build:

1. Define state precedence. Suppressed or unusable/unverified content never shows a category. For usable records, latest-check failure and overdue can both apply: show both notices, rather than letting overdue conceal the failed attempt or failure conceal overdue. A failed attempt must not advance either the successful-check date or the next due date so as to reset the six-month clock. R1/permission loss must not be overridden by a checked state.
2. Spell out date validation rather than imposing one generic ordering. Assessment precedes publication; amendment/errata version years may be later than the original publication year; successful check precedes or equals a subsequent attempt; due date follows the successful check under the agreed cadence. Compare year-only values at their actual precision, without inventing January 1 or another date. The false killer whale's 2018 publication/2019 errata is a required valid fixture.
3. Source accuracy checks need independent expectations from the reviewed evidence record. If tests merely compare the rendered block with the same editable file, a validly rehashed wrong category, assessment ID, date or scope can pass. Keep explicit expected five-record fixtures and positive assertions for the primary Red List assessment dates, in addition to the proposed mutations.

No additional source research, API, automation, mobile testing or full proposal is requested. R1 remains a public-clearance dependency. R2 may be completed after publication in the accepted form; track it through release closure rather than silently treating the planned message as already sent. No message, build, merge or production action was performed in this review.
