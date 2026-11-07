# Sensitive-material rule — Arts created_at country view

## ✅ DECIDED by Chad, 7 Nov 2026 — proposal NOT adopted
Chad's decision, verbatim: **"no include it that is the truth we are not here to bury the truth"**.

**Rule applied:**
- Sensitive material is **included, never excluded**, and **labelled honestly**: human remains, funerary, sacred/ritual, Indigenous source community.
- Labels describe; they never remove an object.
- Provenance and ownership are still never inferred.
- Metadata only; media stays excluded.

**Applied in** `docs/research/p0-recovery/arts/final_view.py` → `final-view-objects.json` / `final-view-results.json`.

**Result on the 479 candidates:**
- 11 objects carry at least one label: sacred/ritual 9, funerary 3, Indigenous source community 2.
- **0 human-remains labels** among them, so that part of the decision doesn't arise in this view.
- The labels come from a keyword screen extended with the Met's own terms and culture names, plus three page-check findings. Some are imprecise: a memorial-window design, and a "temple pendant" that is jewellery.
- Labels are candidates for display wording, not verified classifications.

The original proposal below is kept for the record.

---

## (Superseded) Proposal as drafted for Chad's agreement

7 Nov 2026, Claude. Scope: a metadata-only, created_at-only, country-level view of Met Open Access records. No images. Nothing here is applied until Chad agrees it. GPT reviews.

## What the Met's own policies say (read 7 Nov 2026)
- **"Stewardship of Human Remains"** (guidelines as of 22 Apr 2025, https://www.metmuseum.org/policies/human-remains-guidelines):
  - Human remains include mummified remains, bones, cremated ashes, teeth, hair and bodily fluids.
  - They also include *modified* remains: hair jewellery, reliquaries holding bones, ritual instruments incorporating bone.
  - Display follows ethical and cultural consideration, with consultation of descendant communities where applicable. Access requests may need community consent.
  - The page says many points may also apply to images of human remains, but sets no digital or data rule.
  - It does not mention burial wrappings.
- **"About the Met's collecting practices"** (https://www.metmuseum.org/policies/about-the-mets-collecting-practices):
  - Provenance research is ongoing; available provenance is published on object pages.
  - The Met complies with NAGPRA and consults Tribal Nations.
  - Repatriations are listed publicly; archaeological material is acquired subject to legal and ethical review.
  - These are the Met's own statements, not independent verification.

## Proposed rule (four parts)
1. **Human remains — exclude.** Exclude any object that is, or incorporates, human remains in the Met's sense: bones, mummified remains, ashes, teeth, hair, bodily fluids, and objects made with them.
   - Also exclude **wrappings, linen and textiles taken from human burials or mummies**. The Met's page doesn't name them, but they come from the body.
   - Not shown in any form, even as a counted country.
2. **Funerary and sacred objects without human remains — exclude from the first view; mark unresolved.** This covers grave goods, coffins and coffin fragments, shabtis, tomb reliefs, shrine, altar or reliquary elements, and ritual equipment.
   - The Met itself displays and publishes these, but no consultation context is available in the data. A first view loses little by leaving them out (in R1 most are Egyptian "From" records, already outside created_at).
   - Revisit only with a separate decision.
3. **Indigenous / NAGPRA-scope material — exclude.** Exclude any object identifiable as Native American, or as from another Indigenous source community where consultation applies.
   - In practice the typed subset holds almost none, because Arts of Africa, Oceania and the Americas has no Geography Type. The rule still holds for anything that appears via other departments (e.g. American Wing objects of Native American culture).
4. **Provenance and ownership — never inferred, never judged.**
   - The view states where an object was **made** (present-day country, with the Met's verbatim wording). It never says how or when the Met acquired it, and never implies the holding is legitimate or illegitimate.
   - Each object links to its Met page, where the Met publishes its own provenance.
   - Repatriated objects drop out of the Met's dataset when they leave; no extra handling is proposed.

## How compliance would be checked (the validation GPT asked for)
- **Screen (recall aid, not proof):** the R1 keyword screen, extended with the Met's own terms: hair, teeth, ashes, cremat-, bone (human), reliquar-, mourning, wrapping/linen with mummy, Native American, plus culture or tribe names.
- **Full manual pass:** every one of the ~479 created_at candidates is read on its metadata (title, object name, medium, classification, culture, tags, department) and marked include / exclude (rule 1, 2 or 3) / unresolved.
  - At this size a full pass is feasible within the budget. Not a sample.
- **Page check:** every object marked exclude or unresolved, plus the random 50, is checked on its public Met page.
- **Output:** a per-object decision file with reasons, counts by rule, and a list of unresolved cases. A keyword miss found during the manual pass is recorded as a screen-recall finding.

## What this rule does not do
- It does not certify that no sensitive object remains. A metadata pass can miss sensitivity that isn't in the text.
- It does not assess provenance, legality or community views.
- It does not apply to any view other than this metadata-only first view.

## Decision needed (Chad)
Agree the rule as written, or amend parts 1–4. Until then the candidate set stays at 479 with sensitivity not applied, and Arts stays INCONCLUSIVE.
