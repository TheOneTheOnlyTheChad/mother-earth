# Animals: the conservation assessment card. Short proposal

22 Nov 2026 · **rev 1.1** · docs only · branch `animals-assessment-proposal`. **GPT reviewed rev 1: worth pursuing; section 6 step 1 is the right next step; no category is cleared for display** (`reviews/2026-11-22-animals-assessment-and-tidy-gpt-review.md`, relayed by Chad). Rev 1.1 applies GPT's four corrections (§2, §4, §6, §7) and records its recommendations in §5. Chad's own choices and his go for the evidence step are still his. By Claude ("Animals satellite picture" thread).

Authority: Chad's own message of 22 Nov: the assessment card next, "a short proposal first, so we can judge what it adds and what evidence supports it." Nothing here authorises a source audit, a build, a message to anyone, or any change to the live page.

It builds on what is already accepted: concept §3D (`docs/concepts/ANIMALS-CONCEPT-REV1.md`), acceptance criteria C1 to C6 (`docs/concepts/ANIMALS-PROPOSAL.md` §8C), and the design GPT accepted in round 3 of the expansion proposal (`docs/concepts/ANIMALS-EXPANSION-PROPOSAL.md` §7): **a small, hand-kept, cited, category-only card.**

## 1. What is on the page today

Each of the four journey cards (plains zebra, white shark, false killer whale, waved albatross) has a "Conservation assessment" heading that reads: "Not available yet. No assessment source has been reviewed for display on Mother Earth." The penguin census card and the corridor card have no such heading. No category, colour or trend is shown anywhere.

## 2. What the card would add

One short block per animal, in words, no colour and no arrow:

> **Extinction-risk category:** [category], IUCN Red List, [global] assessment of [the assessed species, by scientific name], assessed [assessment date], published [publication or version date]. Checked by Mother Earth on [check date]. [Link to the assessment.]
> **This is not about the animal shown.** The assessment covers [the whole species worldwide]; the journey is one [animal] from [place and years].
> **Population trend:** not shown here; see the assessment.

That is all. The question the card answers is narrow: **what extinction-risk category did this dated assessment assign?** It does not say how the species is doing now, it is not a legal listing, and it is not a trend. It says plainly what the answer does not cover.

Three dates, never merged or inferred from one another or from a website's "updated" label: the assessment date, the publication or version date, and Mother Earth's check date.

For the penguin card the second line reads differently: the assessment covers the species as a whole at its date; the chart beside it is counts of occupied nest sites at named colonies from 1979 to 2019, a different thing from a different source.

**What it does not add, on purpose:** no population trend (the Red List's trend field may not be copied without IUCN's permission, and Chad's rule is that a risk category is never a trend), no population number, no criteria string, no summary text, no map, no logo. The penguin card already shows counted pairs from its own cleared source; the two stay separate fields.

## 3. What evidence supports it, and how strong it is

**Terms.** The expansion proposal records, as read by Claude and by GPT on 20 Nov, that the IUCN Red List terms (version 3.1, June 2024, section 3) place no restriction on use of the Red List Categories attached to each named taxon. **Not re-read for this note.** Everything else on the Red List needs written permission and is left out.

**The categories themselves. None has been read from the Red List's own pages yet.** What follows is from secondary pages found by search on 22 Nov, read as search extracts only, and is here to show what the card would say and where it gets awkward. It is not evidence fit for the page.

| Animal on the page | What secondary pages say | Source of that (secondary) | What to notice |
|---|---|---|---|
| Plains zebra, Botswana | Global: Near Threatened since 2016 (moved from Least Concern) | IUCN news item, iucn.org | A regional assessment for South Africa, Lesotho and Eswatini (2016) says Least Concern. It does not cover Botswana and must not be used for this animal. |
| White shark, South Africa | Global: Vulnerable; assessment published 2022 | Australian FRDC report card; a university record of the assessment's DOI | Other bodies list regional populations differently (Canada: Atlantic population Endangered). Not Red List; not used. |
| False killer whale, Hawaiʻi pelagic | A global assessment exists (Baird 2018); **category not seen in the extract** | Cascadia Research copy of the assessment's front page | NOAA lists only the main Hawaiian Islands insular population as endangered under US law. The tracked whale is from the pelagic stock. A US legal listing is not a Red List category and is not this animal's. |
| Waved albatross, Galápagos | Global: Critically Endangered, assessed 7 Aug 2018 | SeaLifeBase quoting the Red List; BirdLife Data Zone | BirdLife is the Red List authority for birds; its own pages have their own terms (unread). |
| African penguin (census card) | Global: Critically Endangered, 2024 | BirdLife Data Zone; BirdLife South Africa | BirdLife South Africa's **regional** assessment (2025) says Endangered. Global and regional differ, for the same bird, a year apart. |
| Mule deer (corridor card) | Not searched | n/a | To be read if the corridor card is in scope. |

**What this shows.** The category for each of our animals exists and is dated. But three of six have a second, different answer close by (a regional list, a national law, a population listing). The card's value depends on getting scope right, which is exactly what criteria C2 and C4 demand. That is the real work of this feature, more than the display.

## 4. How it would be kept (the one point that touches Chad's rules)

- **Accepted design: hand-kept.** A small file in the repository, one record per animal: category, scope, assessed taxon, assessment date, the assessment's citation and link, the date we checked. The page reads that file. No request to IUCN from the reader's browser or the hub.
- **Why this is honest for an archive item:** Red List assessments change every several years, not daily. Each card shows its assessment date and our check date, so a stale card is visibly dated, never silently wrong.
- **The tension:** Chad's standing rule is hub-first, no manual steps as the design. The Red List has an API, but it needs an account and token and has its own terms, which nobody here has read. Using it is a separate source audit and possibly an enquiry.
- **Proposed:** hand-kept for this build, and the API route recorded as a later option, not started. No API audit is needed for the hand-kept approach (GPT).
- **Maintenance states (criterion C5 carried in, as GPT asked). A date on the card does not by itself stop a record being superseded, so the record has states:**
  - **Checked:** the last check succeeded on the stated date; the record is shown.
  - **Latest check failed:** the source could not be read. A permitted, dated record stays shown with its dates and a notice that the latest check failed. **The successful-check date is never moved forward by a failed attempt.**
  - **Check overdue:** the re-check date has passed with no attempt. The record stays shown with a notice that its check is overdue.
  - **Withdrawn, replaced, or permission lost:** the record is not shown; the card returns to "Not available" until a reviewed, usable replacement is filed.
- **Owner and cadence, to be fixed before any build:** proposed owner Claude in a Mother Earth thread on Chad's go, recorded in STATUS; proposed cadence every six months and whenever IUCN announces a Red List update that names one of the five species. Both are proposals for Chad.

## 5. Decisions for Chad (after GPT's review)

| | Question | Options | Recommended |
|---|---|---|---|
| A-D1 | Which cards | A: the four journey cards (the heading is already there). B: those plus the penguin card. C: all six. | B. The penguin is the one animal where the category adds most beside its counts. Mule deer adds little. **GPT: B.** |
| A-D2 | Scope shown | A: the global Red List category only. B: global, plus a regional one where it covers the animal's place. | A for this build. A regional list is a different publisher with unread terms, and only the penguin clearly has one that applies. **GPT: A.** |
| A-D3 | Trend | A: no trend line at all. B: a line saying "Population trend: not shown here; see the assessment." | B. It keeps trend and risk visibly separate, as the concept asks, without copying IUCN's field. **GPT: B.** |
| A-D4 | Keeping it current | A: hand-kept file with a stated re-check. B: audit the Red List API for the hub first. | A now; B recorded for later. **GPT: A, with a named owner and a concrete re-check cadence before build.** |
| A-D5 | Look | A: words only. B: the Red List's category colours. | A. No colour-coded alarm; and the colours and logo are IUCN's. **GPT: A.** |

## 6. If Chad says go: the order

1. **Source read, docs only (the evidence step).** Open the Red List assessment pages for the five species of A-D1 B and the current terms in Chad's Chrome (the site does not read as plain text). Record for each: the exact scientific name and the assessment identifier, global or regional scope, category, assessment date, publication or version date, citation and link, and our check date; and for the terms, their version and date and the clause relied on, in context. BirdLife's terms are read only if BirdLife material would actually be used. Mule deer is optional discovery, not needed for the build. **If a primary assessment cannot be read, that card stays "Not available"; a search extract is never substituted.** Report anything that does not match the table in §3. No account, no API, no message to anyone.
2. The short evidence record and any design change go back to GPT. If the record confirms this bounded design, no second full proposal: a branch build brief with the records, the maintenance states and the C1 to C6 checks is enough (GPT).
3. GPT's candidate review. Chad's own Approve lines for the REGISTER entry (IUCN is a new source) and for any merge.

## 7. What could stop it

- The terms no longer say what was read on 20 Nov, or say less than "category for a named taxon may be shown".
- An assessment page cannot be read reliably, or its scope cannot be matched to our animal in plain words.
- The false killer whale: the card states only the scope that was verified, and that no stock-specific assessment was verified for this card. It does not claim that none exists because none was found (GPT's correction).

## 8. Sources for this note (all read 22 Nov as search extracts; none is the Red List itself)

- IUCN news, plains zebra moved to Near Threatened: https://www.iucn.org/news/four-out-six-great-apes-one-step-away-extinction-–-iucn-red-list
- Regional zebra assessment (South Africa, Lesotho, Eswatini, 2016, Least Concern): https://nationalredlist.org/node/34674
- White shark, Australian report card naming the global category: https://fish.gov.au/docs/SharkReport/2023_FRDC_Carcharodon_carcharias_final.pdf · assessment DOI record: https://staffprofiles.bournemouth.ac.uk/display/report/361330
- False killer whale, front page of the 2018 global assessment: https://cascadiaresearch.org/files/Baird_2018-Pseudorca_IUCNRedList.pdf · NOAA species page: https://www.fisheries.noaa.gov/species/false-killer-whale
- Waved albatross: https://sealifebase.org/summary/81744 · https://datazone.birdlife.org/species/factsheet/waved-albatross-phoebastria-irrorata/summary
- African penguin, global: https://datazone.birdlife.org/species/factsheet/african-penguin-spheniscus-demersus/details · regional: https://www.birdlife.org.za/?p=322554
