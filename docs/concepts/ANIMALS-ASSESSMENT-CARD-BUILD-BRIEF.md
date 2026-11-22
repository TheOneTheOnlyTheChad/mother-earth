# Animals assessment card: branch build brief

22 Nov 2026 · **rev 1** · docs only · branch `animals-assessment-proposal` · by Claude ("Animals satellite picture" thread).

**Standing.** Proposal rev 1.1 (`docs/concepts/ANIMALS-ASSESSMENT-CARD-PROPOSAL.md`) and the evidence record (`reviews/2026-11-22-animals-assessment-evidence.md`) were reviewed by GPT, which read the terms and all five assessment pages itself in Chad's Chrome and found the record matched (`reviews/2026-11-22-animals-assessment-evidence-gpt-review.md`, relayed by Chad). GPT: the evidence supports a short branch build brief; no second full proposal; **not production clearance**. Chad's own lines so far: go for the evidence step; agreed A-D1 B, A-D2 A, A-D3 B, A-D4 A, A-D5 A; agreed owner and six-month re-check.

**This brief authorises nothing.** A branch build needs Chad's own go. REGISTER filing, merge and any message to IUCN each need his own line.

## 1. Two release dependencies (open; they do not block a branch build)

| | Open matter | How it closes | Who |
|---|---|---|---|
| R1 | **Permission for the fields beside the category.** Section 3 of the terms frees the category for a named taxon. It does not say the same for the assessment date and the scope. Shortening a date to a year does not settle it. | A clear IUCN statement that applies, or a narrow question to IUCN. Until then no public candidate is cleared. | A message to IUCN is Chad's alone to authorise and send. |
| R2 | **Copy to IUCN.** Section 5 asks for a copy of products published using Red List Data. Whether a category-only card falls under it is not settled by the text. | Planned as a publication task: supply the page link in the form IUCN accepts, unless IUCN says it is not needed. Sending a copy grants no permission. | Chad's message. |

One enquiry could carry both. Draft wording is not written and is not part of this brief; it would be its own short document for GPT and Chad.

If R1 is answered "category and citation only", that is a **design change**: it gets its own review against criterion C2 before any build change. It is not a quiet fallback.

## 2. What is built

Five cards gain a filled "Conservation assessment" block: plains zebra, white shark, false killer whale, waved albatross (journey cards, where the heading exists today with "Not available yet") and the African penguin census card (new heading). The corridor card is untouched.

**Not built:** mule deer; any regional category; any trend value; criteria; map; logo; colour; population number; recovery score; Green Status; any request to IUCN from the page or the hub; any hub change.

## 3. The records (hand-kept file; values as read 22 Nov 2026 by Claude and matched by GPT)

Red List edition at the check: **2026-1**. Scope of every record: **global**. Last successful check: **22 Nov 2026**. Next check due: **22 May 2027**.

| Card | Taxon | Assessment ID | Category | Assessed | Publication year | Version note |
|---|---|---|---|---|---|---|
| Plains zebra | *Equus quagga* | e.T41013A45172424 | Near Threatened | 20 June 2016 | 2016 | none |
| White shark | *Carcharodon carcharias* | e.T3855A212629880 | Vulnerable | 7 November 2018 | 2022 | amended version of the 2019 assessment |
| False killer whale | *Pseudorca crassidens* | e.T18596A145357488 | Near Threatened | 23 July 2018 | 2018 | errata version published in 2019 |
| Waved albatross | *Phoebastria irrorata* | e.T22698320A132641638 | Critically Endangered | 7 August 2018 | 2018 | none |
| African penguin | *Spheniscus demersus* | e.T22697810A256021744 | Critically Endangered | 4 July 2024 | 2024 | none |

Each record also holds the citation and the link, as in the evidence record §2.

**Fields kept apart, never merged or derived from one another:** assessment date · publication year · version note with its own year · Red List edition · our last successful check · our last attempt and its result · next check due · state.

**Rules for the file:**
- The assessment ID is matched as well as the taxon. The white shark and penguin pages also carry a separate **Green Status** assessment with its own dates and categories: never read from it.
- No day or month is invented where the source gives a year.
- The page's own "Accessed on" date is never stored. Check dates come from our clock.
- Raw Red List pages are not committed.

## 4. Wording on the card

Line 1, the category:
> **Extinction-risk category:** [category]. IUCN Red List, global assessment of [common name] (*[scientific name]*), assessed [assessment date]. [Publication sentence.] Red List edition [edition]. Checked by Mother Earth on [check date]. [Citation, linked.]

Publication sentence, by case:
- No version note: "Published [year]."
- White shark: "This version published 2022, an amended version of the 2019 assessment."
- False killer whale: "Published 2018; errata version published in 2019." It never reads "this version published 2018".

Line 2, the assessed unit against what the card shows:
- Journey cards: "This is not about the animal shown. The assessment covers the species worldwide; the journey is one [animal] tracked in [place and years, from the card's own data]."
- False killer whale adds: "No assessment of this animal's own stock was verified for this card." It does not say none exists.
- Penguin: "The assessment covers the species as a whole at its date. The chart is counts of occupied nest sites at named colonies, 1979 to 2019, from a different source."

Line 3: "Population trend: not shown here; see the assessment."

Words only. No colour, arrow or badge. Final wording is fixed in the build and reviewed by GPT as part of the candidate.

## 5. States (criterion C5), each with a test

| State | When | What the reader sees |
|---|---|---|
| Checked | Last attempt succeeded; next check not yet due | The block as in §4. |
| Latest check failed | Last attempt failed after an earlier success | The block, plus "The latest check on [attempt date] could not be completed." **The successful-check date does not move.** |
| Check overdue | Today is past the next-check date, worked out when the page loads | The block, plus "This record's check is overdue." |
| Suppressed | Record marked withdrawn, replaced, or permission lost | No category. "Not available. [Short reason.]" |
| File missing, unreadable, or failing its pin | Any load or validation failure | "Not available" for all five; the rest of the card and page unaffected. |

A new Red List edition is a reason to check. A record is never shown as checked against a new edition without a real check of that record.

**Owner and cadence (accepted):** Claude, in a Mother Earth thread on Chad's go; every six months; and when IUCN announces an update naming one of the five species. **Nothing reminds anyone.** No monitor or schedule exists; the overdue state on the page is the only signal. A reminder, if Chad wants one, is a separate decision.

## 6. Shape of the build (the branch decides the detail)

- One hand-kept source file under `phase1/animals/`, a small builder with rules that refuse a bad record (unknown category word, missing ID, dates out of order, a state without its fields, a check date later than the build), and a shipped file under `assets/animals/` with a manifest and a pinned hash, as the journeys, census and corridor files have.
- One small page module that fills the five blocks from that file. It does not touch the globe, the journey player, the census chart, the corridor or the regional picture.
- Page files expected to change: `animals.html`, `style.css`, one new script, version stamps. Animals never touches the hub.
- `sources.html` and REGISTER wording for IUCN are drafted on the branch and filed only on Chad's line.

## 7. Checks the candidate must show

- **C1 to C6**, each mapped to a named check, with C1 recorded as **open on R1**.
- A new page suite: five blocks correct against the file; each state of §5; the successful-check date preserved after a failed attempt; suppression hides the category; overdue worked out from a fixed test clock; a broken or wrong-hash file gives "Not available" and no page error; the corridor card unchanged; no network request to iucnredlist.org from the page.
- Deliberate breaks, each run alone, each caught: Green Status date substituted; whale sentence reduced to "this version published 2018"; failed attempt advancing the check date; suppressed record still showing its category; trend value shown; regional category shown; "no stock assessment exists" wording.
- Builder tests for every refusal rule.
- The existing Animals suites rerun on the final code (tab, census, corridor, journeys), with counts stated.
- What was not tested, said plainly (phone, Safari, screen reader are parked).

## 8. Order from here

1. Chad's own go for the branch build.
2. Branch build and candidate packet, then GPT's candidate review.
3. R1 and R2: Chad decides whether and when to ask IUCN. This can run beside the build.
4. Release only when R1 is closed, GPT has passed the candidate, and Chad gives his own Approve lines (REGISTER, then merge).
