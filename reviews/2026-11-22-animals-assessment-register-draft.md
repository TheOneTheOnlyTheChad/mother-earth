# Animals assessment card: REGISTER entry, draft

22 Nov 2026 · rev 1 · **A DRAFT. Nothing is filed.** Filed only on Chad's own Approve line, after GPT's review and after release dependency R1 is closed. By Claude ("Animals satellite picture" thread).

Proposed as a new section of `REGISTER.md`, placed after the Dryad penguin entry:

---

## IUCN — The IUCN Red List of Threatened Species, global categories for five species — **hand-kept dated record; shown on the Animals page once released**

- **Filed:** with the assessment card's release merge, on Chad's own Approve line (date and line recorded in STATUS at the merge).
- **Source:** the Red List's own assessment pages on `iucnredlist.org`, edition 2026-1, read in a browser on 22 Nov 2026 by Claude and, separately the same day, by GPT. Evidence: `reviews/2026-11-22-animals-assessment-evidence.md` and `reviews/2026-11-22-animals-assessment-evidence-gpt-review.md`. No file was downloaded. No account, API or token is used.
- **Request method:** none at run time. The page fetches one file from this site. Nothing is fetched from the Red List by the page or the hub.
- **Reuse terms:** IUCN Red List Terms and Conditions of Use, version 3.1 (June 2024). Section 3 places no restriction on use of the Red List Categories for each named taxon. **[R1: to be completed from IUCN's reply before filing: the basis for showing the assessment date, publication year and scope beside the category.]** Non-commercial use only: Mother Earth carries no advertising and makes no charge (Chad, 22 Nov 2026). Section 6: full citation with the edition, shown on each card. Section 7: a superseded assessment is not to be used; see upkeep.
- **What we ship:** `assets/animals/assessments-R1.json`, built by `phase1/animals/build_assessments.py` from the hand-kept `phase1/animals/red-list-assessments.json`; its checksum is pinned in `animals-assessment.js`.
- **What is shown:** for plains zebra, white shark, false killer whale, waved albatross and African penguin: the global category in words, the assessment date, the publication year with its amended or errata note, the citation with links, the edition, and our own check date. Words only.
- **Not used, on purpose:** population trend, criteria, range, maps, assessment text, regional assessments, Green Status assessments (the white shark and African penguin pages carry one each, with other dates), subpopulation or stock assessments, logo, colours. No category for mule deer.
- **Our modifications:** none to the values. Each sentence on the card is ours; the category words, dates and citation are the assessment's.
- **Upkeep:** checked by Claude in a Mother Earth thread on Chad's go, every six months and when IUCN announces an update naming one of the five species. Last successful check 22 Nov 2026; next due 22 May 2027. Nothing reminds anyone: the card says when its check is overdue or could not be completed. A record found withdrawn or replaced is suppressed until a reviewed replacement is filed.
- **Copy to IUCN (terms section 5):** **[R2: to be completed: whether IUCN wants a copy or link, and whether it was sent, with the date. Not sent as of this draft.]**
- **Enquiry:** **[to be completed: whether Chad sent the IUCN enquiry, the date, and any reply. Draft: `docs/research/animals-source-audit/ENQUIRY-DRAFT-IUCN.md`. Not sent as of this draft.]**
