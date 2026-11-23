# Animals: IUCN Red List enquiry, draft

23 Nov 2026 · **rev 2.2** (adds point 5, the API question, on Chad's own decision of 23 Nov: "lets use your recommendation". The API page was read by Claude that day, evidence record §9; no token has been requested) · rev 2.1 was: (two wording edits after GPT found rev 2 fit to send: the purpose is given as a personal control centre, and the re-check is worded as a plan. **GPT's exact wording for these two edits did not reach Claude; the wording below is Claude's reading of them, for Chad or GPT to correct.**) · rev 2 was: (GPT's candidate review applied: the real distribution is described, the repository's visibility is stated, point 2 no longer commits to a fallback) · **A DRAFT. NOT SENT.** For GPT's review, then Chad's decision. Only Chad sends, from his own email, if he chooses to. Sending grants no permission and silence grants none. No follow-up is sent automatically. This is a new enquiry, separate from the NOAA, ATAP, penguin, IWC and Cape Vidal enquiries (all sent by Chad earlier).

## Who and why
- **Recipient:** the IUCN Red List Unit, at the contact the Red List's terms page gives in its section 16 (`iucnredlist.org/terms/terms-of-use`). No address is written in this repository.
- **Why:** the two release dependencies of `docs/concepts/ANIMALS-ASSESSMENT-CARD-BUILD-BRIEF.md` §1.
  - **R1.** Section 3 of the terms frees use of the Red List Category for a named taxon. It does not say the same for the fields the card shows beside it. Section 4 bars reposting Red List Data without a waiver. The card cannot be cleared for the public page until this is settled.
  - **R2.** Section 5 asks for a copy of products published using Red List Data. Whether a category-only card counts is not settled by the text.
- **An enquiry is one route, not the only one.** R1 can also close on a clear IUCN statement that applies. Claude looked on 22 Nov at the full terms, the Summary Terms page and the FAQ page and found none that reaches the date and scope fields. The terms already allow non-commercial use and free the categories; nothing here asks permission for the categories.
- **What it asks:** one narrow permission question covering the page, the served file and the repository copies; one question about the copy; one question about using the API for the re-check; and nothing else. It does not ask for a waiver for wider data, maps or trend.
- **Why the API is in it.** The API's own page says it runs under the same terms and that anyone holding a copy should ask the Red List for permission first. So a token would not settle R1, and asking first is what IUCN itself advises. A yes would also open the scripted re-check (decision A-D4 option B), which is not started and would be its own small build with its own review. No token is requested before the reply.
- **Facts stated about the project** are Chad's own: Mother Earth is his control tower, not for the masses; no advertising, no charge (Chad, 22 Nov 2026). The page is at a public address. Both are said plainly.
- A reply narrower than the card (for example "category and citation only") is a design change with its own review against criterion C2, not a quiet edit. The draft says so to IUCN too.
- **Visibility, checked 22 Nov:** the repository is public, and the working branches holding the five records are pushed to it, so those files can already be read there. The website does not show or serve them. The draft says exactly this.

## Draft

> Subject: Red List categories for five species on a non-commercial page: may the assessment date and scope be shown beside them?
>
> Dear Red List Unit
>
> I run Mother Earth, a personal, non-commercial website that presents observations of the planet with their sources, dates and limits (https://theonetheonlythechad.github.io/mother-earth/). It carries no advertising and makes no charge. It is my personal control centre, a working dashboard for my own use and not a site built for a wide audience, though the address is public.
>
> Its Animals page shows a few recorded animal journeys and one set of penguin colony counts from open datasets. On five cards I would like to state, in words only, the species' global Red List Category, so that a reader does not mistake one tracked animal for the state of its species.
>
> I have read the Terms and Conditions of Use (version 3.1, June 2024). Section 3 says there is no restriction on use of the Red List Categories associated with each named taxon. I would like to be sure about the few facts I would show beside the category.
>
> 1. For each of the five species, may I show the following in a sentence of my own, with the full citation and a link to the assessment?
>    - the category, in words (for example "Near Threatened");
>    - that the assessment is global;
>    - the date assessed and the year published, with the amended or errata note where there is one;
>    - the Red List edition I checked it against (2026-1) and the date I checked.
>
>    The five are: Equus quagga (e.T41013A45172424), Carcharodon carcharias (e.T3855A212629880), Pseudorca crassidens (e.T18596A145357488), Phoebastria irrorata (e.T22698320A132641638) and Spheniscus demersus (e.T22697810A256021744).
>
>    I would not show population trend, criteria, range, maps, text from the assessment, regional assessments, Green Status, or the Red List logo or colours.
>
> 2. How it is stored and served. Nothing is downloaded from the Red List by the page. I typed the five records by hand from your assessment pages on 22 November 2026, and I plan to re-check them against the current edition every six months. They are held in my code repository, and the page would read them from a small static JSON file served to visitors with the page, from which it builds the sentences. The repository is public. The website does not show or serve these records yet, but the working copies, with the fields listed in point 1, are already in that public repository on a development branch. Does your answer to point 1 cover this storage and distribution of those fields, as well as the sentences on the page? If it does not, please say so and I will change it.
>
> 3. If the date, publication year or scope need permission that the category does not, please tell me what I may show and hold. A narrower answer would lead me to revise the design and have it reviewed again before anything goes on the page.
>
> 4. Section 5 asks for a copy of products published using Red List Data. Does that apply to a page like this? If it does, is a link to the page the right form, and where should it go?
>
> 5. Your API. I have an account but have not requested a token. Your API page advises asking you before holding a copy of the data. If I may hold these five records as described, may I also use one API token to re-check just these five assessments when a new Red List edition is published, a handful of requests a few times a year, in place of reading the five pages by hand? If you would rather I did not use the API for this, I will keep checking by hand.
>
> If anything above is wrong or out of date, I would be glad to be corrected. The Animals page will not show these blocks until points 1 to 3 are settled.
>
> Ta
> Chad
> Mother Earth, Cape Town

## Notes for the reviewer
- "The Animals page will not show these blocks until points 1 to 3 are settled" is a commitment about the website only. It does not call the records unpublished, because the repository copies are public. Chad may prefer to drop the sentence.
- "Personal, non-commercial … my own working dashboard" is from Chad's own words of 22 Nov. No promise is made that it stays so for ever.
- The page address is public and is given. The repository is public too, and rev 2 says so in point 2.
- Point 4 asks; it does not send a copy. If IUCN says a link is wanted, sending it after release is a second, short message of Chad's.
- Sign-off "Ta" is Chad's standing choice.
- Point 5 describes the API use as small and tied to new editions. If IUCN agrees, the hand-kept file stays the record; the API would only do the check. Nothing is built for it.
- If the card's citation gains "Accessed on 22 November 2026" (built on the branch on 23 Nov, on GPT's recommendation from IUCN's citation guidance), point 1's list already covers it: "the date I checked".
