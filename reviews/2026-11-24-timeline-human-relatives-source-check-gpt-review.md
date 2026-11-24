# Timeline — Humans and human relatives: bounded source-check review

24 November 2026 · GPT independent review · basis: repository snapshot `80d1d64`.

**Disposition: accept the bounded research record with the specific corrections below. Proposal rev 2 addresses the earlier design review. Recommend holding Drimolen. This is source and proposal review, not approval to build, publish a catalogue, change the hub or release a page.** Chad's H1–H5 decisions stand; H2b is no. No new owner decision is needed to restate them.

## 1. Material and verification

Read the source-check record, proposal rev 2 and private Mac extract report. The two public documents were also compared with the bytes at `80d1d64`. SHA256:

| File | SHA256 |
|---|---|
| `docs/research/TIMELINE-HUMAN-RELATIVES-SOURCE-CHECK.md` | `bd63d46ac6de6a349cba4b382f9c60d05260a0abf1077ae77481879353c11795` |
| `docs/concepts/TIMELINE-HUMAN-RELATIVES-PROPOSAL.md` | `023b9a3890b7124b4db62c977771a0955900d02a2d401e89f3bc21dc3026d7ff` |
| Private `research/timeline-human-relatives/2026-11-24-claude/REPORT.md` | `f0edbec49e432d7be2e345855cdfc4b317d8a823eb48878540d6d87040e42056` |

Independently retrieved the La Ferrassie paper's full-text XML from Europe PMC, PMCID PMC7725784, and read the relevant dating, attribution and calibration passages. XML SHA256: `d4a921ebea5261c1b1fadecc2b1a5b50139ff802cca8b480819b592141b3ca82`. This is a different representation from Claude's rendered publisher-page text; its hash is not supposed to match that page hash. Other dispositions below assess the supplied source passages and documented limits; they are not claims that GPT independently read every source or supplement.

The agreed verification rule requires the relevant number and association passages in full text. It does not require a cover-to-cover read. Searching a full article to locate and then read those passages is acceptable; search snippets alone would not be.

## 2. Separate rulings on the finds

| Claim | GPT ruling | What remains before freezing a catalogue claim |
|---|---|---|
| **C1 — Dinaledi deposit / Homo naledi** | Accept the supported deposit bracket, **335–236 ka**, with the authors' maximum-age scenario and overlying-flowstone relationship preserved. | Record it as a context bracket, not a lifespan or continuous occupation. Keep the distinction between dates measured on material and the resulting deposit constraint. |
| **C2 — Omo I / Homo sapiens** | Accept the one-sided relationship: older than the dated eruption. **233 ± 22 ka (2σ)** describes the eruption, not a fossil age interval. | Check corrected Supplementary Table 3, which the article cites for the result, before freezing this claim. The unchanged article text supports the current interpretation but is not a read of the corrected table. No invented older endpoint, hard 233 ka cutoff without uncertainty, or 211–255 ka fossil bar. |
| **C3 — Xiahe 2 rib / Denisovan lineage** | Accept **48–32 ka as the layer age reported and applied by Xia et al. 2024**, explicitly attributed that way. This is a supported qualified route under H2. | Name layer 3 and distinguish its dating from the rib's protein-based attribution. The earlier dating paper remains unread; do not describe its methods as independently verified. Reading it is useful if the build needs more detail, but H2 does not require recursively reading every upstream reference when the full-text source explicitly states the number and association. |
| **C4 — DNH 134 / Drimolen** | Recommend **hold** for the 2020 dating passages. | Retrieve a legitimate full-text version of Herries et al. 2020 and verify how the specimen is tied to the dated deposit. Do not replace the context interval with an apparently exact 2.04 Ma specimen point. The 2026 article could support a clearly attributed secondary report under the general passage rule; that would remain different from independently checking the primary dating. Holding is the better choice here and need not block the other finds. |
| **C4′ — DNH 127** | Agree: exclude as its own claim in this slice. | Do not merge it back into DNH 134 through the older proposal table. Its tentative attribution and displaced-block context are separate issues. |
| **C5 — Ngandong; C6 — Liang Bua** | Agree: not verified for plotting. | Full-text number and association passages are still needed. This is an access/verification limit, not a judgement that the underlying finds are poorly established. No need to fill a quota. |
| **C7 — La Ferrassie context bone / Neanderthal** | Accept the direct radiocarbon claim, **41.7–40.8 ka cal BP, 95.4%**. | Preserve the specimen/context identity. Neanderthal mitochondrial attribution and the authors' inference that the fragment belongs to the LF8 child are different claims; the latter must remain qualified. Calibration provenance is closed below. |

The selected sources describe finds, deposits and constraints. They do not establish group origins, extinction dates, ancestry or contact.

## 3. Calibration gap closed; one wording correction

Balzeau et al. 2020, DOI [10.1038/s41598-020-77611-z](https://doi.org/10.1038/s41598-020-77611-z), explicitly states in its radiocarbon methods that ages were calibrated with **OxCal 4.4 and IntCal20**. Its dating discussion supports the direct bone measurement and qualified assignment to LF8. The record can mark open point C7 closed by this independent read.

The 2022 paper's recalculation is not evidence that the original paper used a different calibration curve. Select one published calibrated result for the entry and retain its own precision and provenance; do not combine endpoints from the two results. Cal BP is relative to 1950. State the datum and conversion to the common axis, rather than letting the current device year move an ancient claim. A calibrated interval expresses dating uncertainty, not the length of occupation or a uniform distribution.

Correct the record's sentence **“C7 is the only find dated directly.”** C1 includes dating of fossil teeth. The defensible distinction is that C7 is the selected **direct radiocarbon bone-date claim**, whereas C1 is presented as a combined deposit bracket. This wording correction does not invalidate the bracket.

## 4. Bounded follow-up and proposal alignment

Before the next build proposal is treated as complete:

1. Close the specific corrected-table dependency for C2, or leave C2 pending. For C3 choose and record the explicitly attributed 2024 layer-age route, or read the earlier dating study. Keep C4–C6 held unless their stated evidence gaps close.
2. Finish the proposal's promised targeted check for later work that changes the selected claims, especially C3 and C7, and record its scope. This is a small update check, not a demand for an exhaustive literature review. Publisher notices take precedence over silent Crossref metadata; the Omo correction demonstrates why.
3. Open the proposed public identifier records and verify their entities. A species or site identifier is not automatically an identifier for a specimen. A stable internal claim id is still needed when no suitable public specimen id exists.
4. Update proposal rev 2's historical status: H1–H5 are decided and H2b is no; its blanket “all figures unverified,” combined DNH 134/127 row and unresolved Neanderthal lead are superseded by this record. Preserve the history while making the current selected set unambiguous.
5. Carry exact passage locators, source versions, original units, confidence meanings, dated material and find association into the build proposal. Whole-page hashes document a particular read; they do not replace locators or prove scientific correctness.

The design amendments are accepted: separate claim geometry; no joining group bars; neutral find/site titles; limits distinguished from intervals; no inferred older endpoint in zoom fitting; no regional disappearance model; access and licence recorded separately. The build proposal must still specify geometry, uncertainty, selection/history behaviour, scale and catalogue/page compatibility. No implementation is cleared by this review.

The private extracts remain on the Mac. This review does not authorize copying that packet into the public repository. No production or account action was taken.
