# Timeline — Humans and human relatives: freeze record for catalogue `tl-2026-11-R4`

24 Nov 2026 · Claude · Timeline thread · release candidate branch `timeline-finds-release-rc`.
Chad's go (24 Nov 2026) for release-candidate preparation after GPT passed the rehearsal through `5977a1c` (wheel fix `bfa32da`).
**This record freezes the source side of R4.** It authorises no upload, hub deploy or page release; each needs Chad's own Approve line.

## 1. What is frozen

| | |
|---|---|
| Revision | `tl-2026-11-R4`, schema 4, previous `tl-2026-11-R3` |
| Release date in the catalogue | **25 Nov 2026** (the page release goes out on that date) |
| Generated at | 2026-11-24T14:51:16Z (clock reading, written into `phase1/timeline/BUILD.json`) |
| Catalogue | `phase1/timeline/catalogue/tl-2026-11-R4.json`, **48,134 B, sha256 `74b1f8b165283b98023876fbd9e64b876bea17030973bfbc4ebea5f3ec8900ca`** |
| Release sources | `phase1/timeline/BUILD.json`, `changes.json`, `finds.json`, `big5.json` (unchanged), the chart and Pliny files (unchanged) |
| Images | `assets/timeline/tl-2026-11-R4/`: the R3 NASA files, same bytes (PIA03379 800 and 1024 px, `SOURCE.json`) |

The four finds are the rehearsal's, claim for claim, as GPT accepted them (rehearsal review of `db8e40e`, recheck of `17b6f26`, wheel-fix pass at `bfa32da`). Only the file's note changed. Released revisions are never edited: any change to a number, a word or a source after the upload needs a new revision id and object key.

## 2. One selected result per find (source check rev 1.3)

| Find | Result | Source and DOI | Published notation, as stored | Stored values | Locators |
|---|---|---|---|---|---|
| Dinaledi Chamber fossils, Rising Star Cave | `C1.r1` | Dirks et al. 2017, eLife 6: e24231, doi 10.7554/eLife.24231 | `between 236 ka and 335 ka` | 0.335 to 0.236 Ma (ka as reported) | Abstract; Discussion |
| Omo I, Omo-Kibish Formation | `C2.r1` | Vidal et al. 2022, Nature 601: 579–583, doi 10.1038/s41586-021-04275-8 | `233 ± 22 kyr` | limit: layer 0.233 ± 0.022 Ma, 2σ, find older | Abstract; main text; corrected Supplementary Table 3 |
| Xiahe 2 rib, Baishiya Karst Cave | `C3.r1` | Xia et al. 2024, Nature 632: 108–113, doi 10.1038/s41586-024-07612-9 | `48–32 ka` | 0.048 to 0.032 Ma (ka as reported; "Reported by" names the earlier layer study) | Section "A new Denisovan individual" |
| Bone fragment, La Ferrassie 8 burial context | `C7.r1` | Balzeau et al. 2020, Scientific Reports, doi 10.1038/s41598-020-77611-z | `41.7–40.8 ka cal BP (95.4%)` | 0.0417 to 0.0408 Ma, calibrated, years before 1950; ETH-99102, 36,170 ± 220 radiocarbon years BP; OxCal 4.4, IntCal20 | Abstract; Results; Table 1 |

The generator refuses a find whose result id is not listed once in `docs/research/TIMELINE-HUMAN-RELATIVES-SOURCE-CHECK.md` with that exact notation, whose stored numbers are not the notation's own numbers at its precision, or whose words do not give them. The page checks the same numbers and words. Neither can check that the record matches the paper; that is source review (GPT, rev 2 recheck §2).

## 3. Attribution and wording

| Find | Attributed to | Basis | Qualification |
|---|---|---|---|
| Dinaledi | *Homo naledi* | anatomy | — |
| Omo I | *Homo sapiens* | anatomy | — |
| Xiahe 2 | Denisovan lineage (the paper's wording; Wikidata's "Homo longi" is not used) | proteins | — |
| La Ferrassie | Neandertal | mitochondrial DNA | "The 2020 authors judge the fragment most likely part of the La Ferrassie 8 child's skeleton. A 2023 study says that has not been demonstrated." |

**La Ferrassie's later paper.** Guérin et al. 2023, PaleoAnthropology 2023(1): 98–118, doi 10.48738/2023.iss1.811. Context line, accepted by GPT for the rehearsal (rev 2 recheck §2) and carried unchanged: the study models the child's age at 44,900 to 39,900 years ago at 95 % credibility, keeps the fragment's date as an alternative if the fragment belongs to the child, and says that has not been demonstrated; that model is for the individual, not a date on the fragment. The three-individual overlap (44.9–44.1 ka) is not shown. **The passages were read by GPT** in the publisher's full text (pp. 99, 115, 116). Claude could not retrieve the PDF: proxy refusal from the cloud workspace and the Mac shell, and the journal's page did not load in the browser pane (24 Nov, 10:58 UTC).

**Lane sentence**, word for word on the lane and in the page: *Marks and ranges show dates or age limits assigned to particular finds or deposits. They do not show how long a group lived. Overlap in date does not establish shared place or contact.*

**Change record `tl-2026-11-R4-1`** (kind "added", the four find ids): *Opened the Humans and human relatives lane with four dated finds. Each mark is the date or age limit one source gives for one find or deposit. It is not a record of how long a group lived.* It does not say a lifespan or a group record was added. Reviewed with the release data in this candidate.

**Coverage line on the page** (generator text): *This release shows the conventional Big Five mass extinctions, placed on the ICS chart, and 4 dated finds of humans and human relatives reviewed for this page. Other finds are not yet reviewed, or their full text is not yet verified. Empty stretches are not periods where nothing happened.*

## 4. Source status at the freeze

| Source | Licence | Status |
|---|---|---|
| Dirks 2017 | CC BY 4.0 | No correction, retraction or expression of concern: the publisher's page (source check, 24 Nov) and **Crossref's record re-read 24 Nov 2026 14:50:29 UTC** (no `updated-by`) |
| Vidal 2022 | CC BY 4.0 | Change history on the publisher's page, 4 Feb 2022: two supplementary tables replaced; the corrected Supplementary Table 3 carries this result. No retraction or expression of concern. Crossref re-read 14:50:29 UTC: no `updated-by` |
| Xia 2024 | CC BY 4.0 | None found: the publisher's page (24 Nov) and Crossref re-read 14:50:29 UTC |
| Balzeau 2020 | CC BY 4.0 | None found: the publisher's page (24 Nov) and Crossref re-read 14:50:29 UTC |
| Guérin 2023 | Not confirmed (the PDF is reported to state all rights reserved; the HAL record states CC BY-NC-SA). Cited and paraphrased only | DataCite record findable, no related correction (read 24 Nov 2026 10:57:52 UTC); Crossref holds no record of this DOI |

The Crossref re-read was made in the browser pane through Crossref's public API. Each source's `checked` date in `finds.json` is 24 Nov 2026, on or before the release date. **Review cadence:** these sources are re-checked for notices before any later Timeline revision that keeps them, and at least once a quarter while they are on the page. A notice withdraws the affected entry in a new revision with a change record.

## 5. Not in this release, and not holding it up

- **Drimolen DNH 134:** held. **DNH 127:** excluded. **Ngandong, Liang Bua:** out (source check rev 1.2).
- **Author enquiries E1–E4** (enquiry drafts rev 3): Chad's to send; none sent. E4 is an optional wording check. Their answers can only start a later revision.
- Real phone, Safari, screen readers and true 200 % zoom: not tested (as in every Timeline release so far).
