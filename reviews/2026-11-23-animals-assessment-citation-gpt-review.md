# Animals assessment card: GPT review of the evidence addendum and the citation access date (relayed by Chad, 23 Nov 2026 SAST)

GPT's text as Chad pasted it, filed unchanged below. It is GPT's review, not Chad's decision. Reviewed: `animals-assessment-rc` at `781d72a`.

---

Yes—add "Accessed on 22 November 2026" to the citation, using our recorded successful check date. I independently read IUCN's citation guidance (https://www.iucnredlist.org/about/citationinfo) in Chrome.

The simplest implementation:

* Keep rejecting an imported "Accessed" suffix in the hand-kept citation.
* Generate the suffix from `last_successful_check`.
* Keep "Checked by Mother Earth on…" as the maintenance statement.
* A failed check must advance neither date.

Add focused checks for the correct suffix, no duplication and preservation after failure. No new proposal needed.

The stock search strengthens the evidence; keep the cautious card wording unchanged.

I already reviewed enquiry rev 2: it's fit for you to send with the two small purpose/tense edits previously given. The citation guidance doesn't resolve R1, but we don't need another research round before you decide whether to send.

Animals assessment citation addendum review

22 November 2026. Read Mac evidence record with addendum, branch supplied as animals-assessment-rc 781d72a. Independently read IUCN's Citing The IUCN Red List page in Chad's signed-in Chrome. Did not independently repeat Claude's advanced search, Summary Terms, FAQ or API-page reads in this review. No account setting, token, download, message or production change.

Source read: https://www.iucnredlist.org/about/citationinfo . It gives an access-date placeholder in the general Red List citation, directs readers to the preferred citation atop each species fact sheet for specific assessments, and distinguishes web citations from PDF citations and Red List from Green Status assessments. The previously reviewed species-page citations contain an Accessed on suffix whose displayed date was stale. Use the citation for the source actually read: the webpage, not an unread PDF.

Recommendation: append 'Accessed on 22 November 2026.' to the rendered citation using the recorded successful source-check date. Keep the separate 'Checked by Mother Earth on ...' line because it conveys the maintenance meaning. For this workflow the dates coincide: a successful check involves accessing the primary assessment. Do not use the visitor's clock, the build date, a failed attempt date, or a page-generated stale access date as the citation access date.

Smallest change: continue storing the citation's bibliographic core without an access suffix and continue rejecting Accessed in that source string. Generate exactly one suffix from last_successful_check in the renderer. There is no need to relax the builder or introduce a separately editable duplicate access date. A later access that does not complete a successful source check must not advance the recorded successful citation/check date. Report failed attempts separately as already designed.

Focused checks: all five rendered citations have exactly one correct access-date suffix; stale imported Accessed wording remains refused; a failed check and an overdue check leave the successful access/check date unchanged. Review the focused diff and affected test expectations; no new full proposal is needed. Existing category/edition/publication/amendment distinctions remain unchanged. The current omission is a citation-format refinement, not evidence of a wrong category.

The advanced-search result strengthens the recorded search evidence only. Keep the bounded stock-not-verified wording; no need to change the card or claim a stock assessment can never exist.

R1 is not resolved by citation guidance. The enquiry remains a suitable clarification route for the actual page/JSON/repository distribution; a clear applicable statement remains an alternative. GPT already reviewed enquiry rev 2 and found it fit to send with the personal-control-centre purpose and planned-recheck wording edits. Sending remains Chad's choice and action. No additional research gate requested. Branch visibility remains Chad's decision; this review changes no visibility or access settings.
