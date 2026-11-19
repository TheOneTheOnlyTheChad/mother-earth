# Animals: public-release assessment for the three recorded journeys

19 Nov 2026 14:37 UTC (clock reading) · rev 1 · for GPT review · **a recommendation, not a decision.** Nothing here authorises a merge or a deploy. The sensitivity decision for each animal is Chad's (ANIMALS-PROPOSAL §6a) and is recorded in REGISTER when he takes it.

Covers only what the preview shows: zebra `Z3866`, white shark tag `118845`, false killer whale tag `98364`, as built on `animals-journeys-preview-rc` (code `f00a330`, GPT pass 19 Nov). The bottlenose-dolphin and ATAP enquiries are separate and are in `docs/research/animals-source-audit/ENQUIRIES-ANIMALS.md`; no part of this assessment waits on them.

## 1. Recommendation in short

| | Zebra Z3866 | White shark 118845 | False killer whale 98364 |
|---|---|---|---|
| Recommend public release? | **Yes** | **Yes** | **Yes, after one fact is established** (§4) |
| Positions | as recorded, nothing generalised | as recorded, nothing generalised | as recorded, nothing generalised |
| Stored precision today | up to 7 decimal places (the file's own; about 1 cm of arithmetic, not of accuracy) | up to 3 decimal places (about 100 m) | up to 4 decimal places (about 10 m); most rows 3 |
| Times | as recorded, to the second; no delay | same | same |
| Identity shown | collar id `Z3866` (the dataset's id) | tag number only; the file's given name is not shown | tag number only; the catalogue id in the file (`HIPc626`) is not shown |
| Must the author reply first? | No | No | No, if the fact in §4 can be read from a published source; otherwise yes, that one question |
| Display file changes needed | none | none | none (a wording change only, §4) |

"As recorded" is recommended for all three for the same reason: every position is already public, at this precision or finer, in the cited open file, and the journeys ended 12 to 18 years ago. Rounding ours would hide nothing and would break the statement the page now makes truthfully: nothing moved, smoothed or interpolated. Rounding the sea journeys would also move fixes relative to the land map their lines were tested against.

That reasoning has a limit, which GPT set on 18 Nov and which stands: age and open availability do not show that a file exposes no sensitive site. So each animal below is assessed on what the display shows, not on the licence alone.

## 2. Zebra Z3866 (plains zebra, northern Botswana)

- **What is shown:** 13,045 GPS fixes of one collared zebra, 25 Oct 2007 to 22 Oct 2008, between the Okavango Delta and the Makgadikgadi grasslands.
- **Source and rights:** Movebank Data Repository, doi `10.5441/001/1.f3550b4f`, CC0 1.0, public since 2013. No condition on reuse.
- **Considered:**
  - Species: plains zebra. Not a species targeted for a high-value product in the way rhino or elephant are. Its Red List category was not read from the Red List itself for this note and is not relied on.
  - Places: the Okavango Delta to the Makgadikgadi. The migration is the subject of the published paper. Land tenure along the route was not looked up.
  - Time: the last fix is 18 years old. Nothing shown says where any zebra is now, and the page says so (a dated replay, not current).
  - What the display adds to the public file: nothing. No place, time or identity that the CC0 file does not give.
  - Residual risk: the corridor is still used. Showing it is what the study was published to do.
- **Recommendation:** release as recorded. Low risk.
- **Precision:** unchanged. The file's 7 decimal places are arithmetic, not accuracy; the page already says the dataset supplies no location uncertainty.
- **Author's reply needed?** No.

## 3. White shark 118845 (South African coast to southern Mozambique)

- **What is shown:** 755 Argos fixes of one shark, 9 May 2012 to 29 Sep 2013, after Mother Earth's filtering; 69% are the two weakest Argos classes.
- **Source and rights:** Zenodo, doi `10.5281/zenodo.5575189`, CC BY 4.0. Credit, a licence link and a statement of changes are required and are on the card. The record names a government research permit and states no further condition.
- **Considered:**
  - Species: white shark, a protected species in South Africa and a high-profile one. Assessed as Vulnerable on the IUCN Red List (read on 19 Nov from secondary sources, not the Red List itself).
  - Places: the tagging areas (Mossel Bay, Gansbaai, Struisbaai, False Bay, Algoa Bay) are named on the record and are publicly known shark sites. The display names no site beyond what the fixes show.
  - Time: the last fix shown is 13 years old.
  - Precision: Argos, not GPS. The best class is nominally under 250 m; most fixes shown have no error estimate. The page says so per fix.
  - Identity: the file gives each shark a name. The tag number is shown instead (Chad's rule; GPT agreed).
  - What the display adds to the public file: nothing in place or time. It shows fewer fixes than the file.
  - Residual risk 1, to sharks: someone using a 2012–2013 record to find sharks today. The sites are already known and the record is old. Low.
  - Residual risk 2, to the study: our filtered fixes being read as the authors' result. The card says this is not the study's modelled track and that the filter is Mother Earth's and experimental.
- **Recommendation:** release as recorded, tag number only. Low risk.
- **Precision:** unchanged (the file's own 1 to 3 decimal places).
- **Author's reply needed?** No. CC BY 4.0 does not require contact. A courtesy note to the corresponding author is optional and is Chad's choice; nothing waits on it.

## 4. False killer whale 98364 (Hawaiian Islands and the North Pacific to the east)

- **What is shown:** 661 Argos fixes of one adult, 23 Oct 2013 to 12 Feb 2014, after the data centre's checks and Mother Earth's filtering.
- **Source and rights:** US IOOS Animal Telemetry Network, deployment `573c6646d76c5c52816a4b92`. CC0 1.0 on the data.gov and OBIS records. The file's own terms allow free use and redistribution and ask that ATN or the citation be acknowledged; the card does. The file says contact with the authors is "strongly encouraged". It does not require it.
- **Considered:**
  - Species and population. Three populations of this species use Hawaiian waters. One, the main Hawaiian Islands insular population, is listed as endangered under the US Endangered Species Act and numbers roughly 140 to 200 animals (NOAA Fisheries species page, read 19 Nov). The other two are not listed. **The file does not say which population this whale belongs to.**
  - What the track suggests: it runs from the island of Hawaiʻi to about 138°W, about 1,800 km east. That is what a pelagic animal would do. **This is Claude's inference from the positions, not a fact from the source, and is not to be shown or relied on.**
  - Time: the last fix shown is 12 years old.
  - Precision: Argos; 54% of the fixes shown are classes 0, A or B.
  - Identity: the file carries a photo-identification catalogue id. It is not shown; the tag number is.
  - What the display adds to the public file: nothing in place or time.
  - Residual risk to the animal or its group from a 12-year-old record: low for any of the three populations.
- **Why one fact still matters.** The risk does not depend on it. The page's honesty does. If this whale is from the endangered insular population, a page that shows it under the species name alone leaves out the most important thing about it. If it is not, the page must not let a reader assume it is. Either way the card needs one true sentence about population, and today it cannot have one.
- **Recommendation:** release as recorded once the population is established from a source, with that sentence on the card. Until then, keep the whale in the private preview. The zebra and the shark do not wait on this.
- **Precision:** unchanged.
- **Author's reply needed?** See §5.

## 5. Questions that need an answer from outside

| # | Question | Who can answer | Needed before release? |
|---|---|---|---|
| 1 | **Which population does false killer whale tag 98364 (deployment `PcTag041`) belong to: main Hawaiian Islands insular, Northwestern Hawaiian Islands, or pelagic?** | First, a published source: the tagging group's reports or papers that list deployments by population. One web search on 19 Nov did not find it; a proper read-only search has not been done and needs Chad's go. If no published source states it, the dataset's authors (first author Robin Baird, Cascadia Research Collective) | **Yes, for the whale only** |

That is the only question that needs an answer. The following are **not** required, and are listed so they are not mistaken for blockers:
- Permission from any of the three sets of authors. The licences (CC0, CC BY 4.0, CC0 with an acknowledgement request) already allow this use.
- The authors' view of Mother Earth's experimental filtering. Welcome if offered; the page already says the rules are ours.
- Replies to the dolphin and ATAP enquiries. They concern other data.

## 6. What stays unverified
- Real phone and screen reader: not checked.
- Red List categories: not read from the Red List itself; none is shown on the page (conservation status reads "Not available yet").
- The NOAA abundance figure is quoted from NOAA's species page as read on 19 Nov and is not shown on the page.
- That the ATN staging file is byte-identical to NCEI's archived copy (carried from the audit).

## 7. If Chad agrees
1. A go for the read-only search in §5.
2. His recorded decision per animal (the wording is drafted in `reviews/2026-11-19-animals-journeys-sources-register-draft.md`).
3. Filing REGISTER and the Sources section, each on his own Approve line, with the release itself.
