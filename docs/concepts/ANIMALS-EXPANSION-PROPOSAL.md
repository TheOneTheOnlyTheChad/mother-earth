# Animals: expansion proposal (the unstarted and deferred parts of concept rev 1)

20 Nov 2026 13:04 UTC (clock reading) · **rev 2, consolidated** (passed by GPT as a planning package) · **rev 2.1, 20 Nov: §9 only, after audit B** · **docs only.** Nothing built, no Animals code branch touched, no data file downloaded or saved, no account created, no agreement accepted, no provider contacted, nothing spent. Animals implementation stays parked. The other thread's probe is untouched.

Rev 2 replaces revs 1 to 1.2 in full. It folds in GPT's round 3 review (`reviews/2026-11-20-animals-expansion-round3-gpt-review.md`) and removes the override layers. What the earlier revisions got wrong is listed once, in §14. Companion files: the source-audit briefs (`ANIMALS-EXPANSION-AUDIT-BRIEFS.md`) and the penguin enquiry draft, rev 2, unsent (`docs/research/animals-source-audit/ENQUIRY-DRAFT-PENGUINS.md`).

## 1. Scope and evidence key

- **Chad's brief (20 Nov):** explore the unstarted parts of concept rev 1; prioritise penguin population evidence, one whale recovery example, one migration corridor and one bird journey; identify exact datasets, interpretation, rights gaps, costs and dependencies; draft the penguin enquiry unsent; keep the NOAA and ATAP status as recorded; implementation parked.
- **Scope note (GPT, round 3; accepted):** population charts, corridors and assessments are goals of Chad's own concept, so completing this proposal and its research needs no further permission. Which modules go into a first expanded release is recorded at implementation planning; production approval is separate, as always.
- **How each fact below was obtained:**
  - **[C]** read by Claude as page text in Chad's Chrome, 20 Nov 2026, between 12:41 and 13:04 UTC.
  - **[G]** read by GPT and relayed by Chad (rounds 1 and 3), including everything that rests on a PDF. Claude has opened no PDF (text-only rule).
  - **[S]** a search extract or a tool's summary of a page only. Not to be shown anywhere without a re-read.
- **No data file has been audited.** A page read, a licence label and a browser look at a CSV are not a file audit. The audits are specified in the briefs and each needs Chad's go.

## 2. The page

- Land, Sea and Air stay. Every item carries an **evidence-type label** from a fixed list: recorded fixes · filtered recorded fixes (ours, experimental) · source-interpolated track · receiver detections · published corridor or range · census counts · relative abundance estimate · model estimate · dated assessment.
- Three kinds of card: **journey** (replay on the globe, as built), **population** (a chart on the Animals page, nothing on the globe), **corridor** (polygons on the globe under their own labelled switch, off on load, in Layers and the drawn Key).
- Each card states the period its evidence covers, the source's version or publication date, and when we last checked it, as three separate things. A website's "last update" is never shown as an assessment or survey date.
- Records link by taxon **and** population or stock where the source names one. Where only the species matches, the card says so.
- **Update wording follows the selected product, not its publisher.** A census that runs every year does not make a file ending in 2019 a feed. A "living" atlas or a report series does not show that one herd's polygon is refreshed. Each product is shown as a dated, fixed product unless its own revision cadence is established.
- Modules are independent: each has its own availability state and its own release boundary.

## 3. Priority 1: African penguin population (concept §6D, §3C)

### 3.1 Two source versions. One is chosen; they are never joined.

| | A. Dryad file, to 2019 | B. Repository file, to 2023 |
|---|---|---|
| Where | Dryad doi `10.5061/dryad.vx0k6djp7`, `Afr_penguin.csv`, 3.89 KB, published 3 Mar 2021 [C] | GitHub `rbsherley/AP_IUCN_CR`, `Afr_penguin_2023_JARAinput.csv` [C: listed in the repository root]. 46 lines with the header, years 1979 to 2023, 26 colony columns, NA and 0.1 entries, 4.7 KB as displayed [G] |
| Version seen | the record's 3 Mar 2021 version [C] | repository head `682766636a8a0ebcdd5a1b3959f291444cb83db4` [C]; the CSV's latest commit `1f7cd820343b91903c94455ca985c2bf76eb2b22`, "Updated count at Dyer Island to 903" [G]. Observed references, not checksums of downloaded bytes |
| Paper | Sherley and co-authors 2020, *Ecology and Evolution*, doi `10.1002/ece3.6554` [C: linked on the record] | Sherley and co-authors 2024, *Ostrich* 95(3): 181–187, doi `10.2989/00306525.2024.2355618`; its methods link this repository [G, from the PDF]. The repository's README calls it the code, data and outputs underpinning that paper [C] |
| What the values are | counts of occupied nests at 18 colonies in South Africa and 4 in Namibia; the highest count in a year stands for that year; occupied sites are defined differently in the two countries [C] | not yet read from a methods text by Claude; 26 colonies [G] |
| Blanks and anchors | NA: no count that year, for logistics, or the colony gone (Lambert's Bay after 2005) or not yet (re)colonised (Robben Island before 1983, Stony Point before 1982, Simonstown before 1985). The 0.1 values at those four colonies are model anchors, "do not represent real count data and should be omitted" [C] | NA and 0.1 entries are present [G]. Their rules for this version are **not established**; the older file's four-colony rule is not carried over |
| Rights | the record shows "Public domain" [C] | **no licence shown** in the repository root or README [C, G]. Public availability is not a licence. The Dryad dedication does not extend to it |

- **Choice proposed:** design and audit against A now, because its rights are clear. Move to B only as a whole new version, after its reuse terms are confirmed (§9) and its own file audit. B is the better series (four more years, four more colonies) and is the reason the enquiry is still worth sending.
- **Unit label (GPT's wording, adopted):** "Annual colony census: occupied nest sites (used as a breeding-pair proxy)", with the two countries' definitions stated. It is not a count of birds, and values are not doubled into individuals.
- **Aggregation safeguard (GPT; adopted).** Colonies are missing in different years. Adding up whatever is present would manufacture a decline. So the chart starts with **individual colony series**, or a fixed-coverage aggregate whose colony list and years are stated and justified. A national or global total comes only from the papers' model output, labelled as a model estimate with its method. A missing count is a gap; a colony known to be absent is stated with its source; neither is filled with zero by us.
- **Assessments shown beside it, as separate dated fields:** regional Endangered [A2abce], 2025, and global Critically Endangered [A3bce+4bce], 2024 (BirdLife International 2024), both as given on BirdLife South Africa's page, which cites Hagen 2025 in *The 2025 Red Data Book of Birds of South Africa, Lesotho and Eswatini* [C]. That page's own reuse terms are unread. See §7 for what may be shown.
- **Not shown:** an extinction date or countdown (concept §8); press totals.
- **Dependency:** none on the parked journey code. A chart from version A waits on no reply.

### 3.2 Penguin movement (separate; permission needed)

- Seabird Tracking Database, Robben Island: dataset 2213 (chick-rearing, 2008 and 2010 to 2019, GPS, 207 tracks, 185 birds, 180,360 points, **interpolated**, with duplicate tracks); the raw GPS sets it supersedes, 1444 to 1446 (2011 to 2013, not interpolated); juvenile dispersal set 1269 (14 birds, 2011 to 2013, satellite tags, 1,974 points, not interpolated). All [S]: read from the database's listings through search, not re-read in Chrome.
- **Terms, read in full [C]:** no use in any publication, product or commercial application without permission through a data request; the owner approves, amends or refuses; use only for the purpose requested; data not to be passed to third parties; reproduction for financial gain needs the owners' and BirdLife's permission; a commercial request includes revenue use by a non-profit; maps credit the owners and the database.
- **Consequence:** a replay hands the positions to every visitor's browser, where they can be saved. Any permission has to cover that in words. If it cannot, a generalised product is the alternative.
- **Interpretation:** 2213 could be shown only as a source-interpolated track. A raw set could use the existing replay. Foraging trips are loops from the colony; the dispersal set is a journey away from it. The label follows the paper and the bird's own record.
- **Sensitivity:** decided with the owners; foraging areas are part of a current fishing-closure dispute.
- Nothing is requested, downloaded or registered before a reply to the enquiry.

## 4. Priority 2: whale recovery example (concept §6E)

**Stock chosen: Southern Hemisphere humpbacks, Western Indian Ocean, IWC "BSC"** (GPT's choice, kept).

- **The assessment.** The IWC's status graphics page gives, for BSC: "Abundant and recovered after strong growth"; 18,111 (15,580 to 20,700); relative abundance "very good"; growth 1995 to 2015 "strongly increased" [C]. **The assessment date is 2015**: the IWC's status summary says so for all Southern Hemisphere humpback populations, and that population summaries are still in development [C, G]. The page's "last update: 2026" is a page label, not an assessment or a survey.
- **Not established:** which year the 18,111 refers to and what its interval is (confidence, credible or other). Until then the number is not put on a card as a bare figure.
- **Display:** "IWC assessment: 2015" · the growth period 1995 to 2015 · the page's update label and our retrieval date, as three fields. "Recovered" appears only as the IWC's word.
- **Kept apart:** the IWC estimates page lists older survey estimates for parts of this stock, Mozambique 6,000 (4,400 to 8,400) for 2003 and Madagascar 7,400 (2,100 to 12,800) for 2004 [C]. They are not summed, not joined to the model figure and not drawn as a series with it. BSC's status is never borrowed for West South Africa (BSB2: 484, 138 to 860, "very low", with a caution [C]) or for the false killer whale.
- **Observed context, second panel: Cape Vidal.** Wilkinson and co-authors 2023, *African Journal of Marine Science* 45(1): 39–50, doi `10.2989/1814232X.2023.2193591`; a repository copy is accessible through CPUT [G].
  - The 2018 and 2019 headline values (10,499 and 11,009) are **relative abundance estimates adjusted for effort and missed groups**, not raw counts; the authors give an average annual increase of 7.4% to 8.8% over 31 years from 1988 and say the rate is slowing [C: abstract; G: methods].
  - **Comparability (GPT, from Table 3 of the PDF):** the table compares several seasonal windows. Only one column's values are ever charted together. For example the 6 to 30 July window has entries for 1990, 1991, 2002, 2018 and 2019; other columns cover other years. Longest-window totals are never joined to older shorter-window estimates.
  - **Label:** "Cape Vidal northward passage: relative abundance estimate, [survey window]". Not the stock's size. No shared line, denominator or recovery percentage with the assessment panel. The authors' trend sentence keeps its study period. Missing years stay gaps; uncertainty not supplied is stated as not supplied. Sightings from the two platforms are not treated as independent animals.
  - It is context for sub-stock C1 at one site, not validation of the stock model.
  - The values would be redrawn from the paper's table as cited facts; the paper's figures are not copied. Reuse terms for the article are not established.
- **Stock A (western South Atlantic): not pursued.** Rev 1.1 said the IWC's entry and a 2019 paper contradict each other; that is withdrawn (§14).
- **A second, small whale item:** NOAA's stock assessment for the Hawaiian false killer whale stock complex (2023 cycle, revised July 2024) would give the existing journey its stock context. Estimates for the pelagic assessment area and for the EEZ are different quantities and stay separate [G, PDF]. No figure is proposed yet.

## 5. Priority 3: migration corridor (concept §3B)

- **Candidate:** USGS, "Ungulate Migrations of the Western United States, Volume 6", doi `10.5066/P1ETBSYE`. On its ScienceBase record: "Creative Commons Zero v1.0 Universal (CC0-1.0) public domain dedication"; publication date 2026-03-24; one archive of 152.69 MB and 30 child items, each a herd and a type. The ten listed to Claude: California mule deer East Walker and West Walker, each with Migration Corridors, Migration Routes, Stopovers and Winter Ranges, and Nevada mule deer Washoe (two listed). "Due to data sharing constraints of participating agencies, not all the files that underlie the mapped migrations included in the report have been released" [C].
- **Use only released polygons:** corridor, stopovers, winter range. Per-animal route lines are not used. Withheld files are never sought.
- **Interpretation:** a corridor is a summary of many collared animals over stated years, by the method the source names. It is not a path any animal took and says nothing about where an animal is. The card gives species, herd, contributing years and animal count, method, and the product's own date. It is shown as a fixed, dated product unless the herd's own revision history shows otherwise.
- **Africa:** the CMS Atlas of Ungulate Migration offers downloadable maps with factsheets and calls itself "living, and continually updated"; its page states no licence [C]. An African corridor needs one named migration and a rights answer. No corridor is ever drawn from our zebra's replay.
- **Dependency:** polygons are new drawing work, and a new switch touches the header-and-switch expectations that the parked Animals branch and Earth from Space also change.
- **Chad's choice:** the USGS example first (rights clear, North American), or wait for an African one.

## 6. Priority 4: bird journey (concept Air)

| | Grey-headed albatross, New Zealand | Waved albatross, Galápagos |
|---|---|---|
| Package | Movebank Data Repository doi `10.5441/001/1.694p666h`, "Data from: Classification of animal movement behavior through residence in space and time" (Thompson, Torres, Sagar, Kroeger, Orben 2017) [C] | doi `10.5441/001/1.3hp3s250`, "Data from: The Environmental-Data Automated Track Annotation (Env-DATA) System…" (Cruz and co-authors 2013) [C] |
| Licence on the record | CC0 1.0 Universal [C] | CC0 1.0 Universal [C] |
| Files | data 16 MB; reference data 4.08 KB; README 9.28 KB [C] | `Galapagos Albatrosses.csv` 4.69 MB; reference data 5.92 KB; README 13.84 KB [C] |
| Animals and fixes | 24 and 93,474 (the 18 Nov repository label; not re-read) | 28 and 16,414 (same) |
| Date line | not known | not known |

- Neither file has been opened. **Whether either crosses the date line is unmeasured**; geography makes the Galápagos package the likelier to avoid it, and that is a guess until counted.
- Both come from method papers. What each bird's record is (a foraging trip, a longer trip, dispersal) is read from the paper and the record before any label is chosen.
- **Choice is made from the two file audits** (brief D), on usable birds, quality fields, crossings and sensitivity.
- eBird Status and Trends: commercial use "Not at this time"; access by form, automatic for non-commercial use [C]. Motus: summary and complete data are treated differently and external use expects attribution and contact with the project [G]. Both stay later, and neither is a journey.

## 7. Assessment card (concept §3D)

- **Accepted design (GPT, round 3): a small, hand-kept, cited, category-only card.** IUCN Red List terms, version 3.1 (June 2024), section 3: IUCN "places no restrictions on use of the IUCN Red List Categories associated with each named taxonomic entity" [C, G]. No API, no cache, no enquiry for that.
- **Bounds:** the category, its scope (global or regional), the assessment year, the source's publication date and our check date, each its own field, with the citation. **Not copied from the Red List:** criteria strings, descriptive text, its population-trend field, figures, logos, map geometry. Those need IUCN's written permission.
- A regional assessment by BirdLife South Africa has its own source and its own terms (unread); the IUCN exception does not cover it. Whether its criteria string may be shown is part of that read.
- The restriction concerns IUCN's material. A trend stated in an independent paper or dataset is cited to that paper and is not an IUCN matter.

## 8. Every other unstarted or deferred area

| Area | Position |
|---|---|
| Date line (§7, §13 of the concept) | Criteria in §10. Written as audit and build criteria; they do not delay source research |
| Several animals from one study | A second zebra (`Z3743`) through the existing chooser, one at a time, with a study-and-animal key and its own manifest. With the parked journeys branch, when it resumes |
| Blue whales (§6B) | Unchanged: their own quality-rule proposal first. Behind the four priorities |
| Environmental context (§11) | Not before a paper supplies the link and a product matched to the journey's dates is audited |
| Ongoing feeds (§12) | Nothing selected. No refresh promise without a selected dataset and a known cadence |
| Sharks, rays (acoustic) | ATAP: contact established, response pending. **OTN is not parked behind that reply** (GPT): its publication page distinguishes station metadata from release and detection products and identifies public data as CC BY; node and record conditions still apply [G]. A separately released OTN product can be audited on its own when Chad wants it |
| Dolphins | NOAA enquiry: sent; no reply on record |
| Living Planet Database | 2026 agreement: restrictions on redistribution and financial gain; the aggregate index's separate licence does not clear individual series [G]. Not needed while direct sources serve |
| SAEON catalogue, DFFE reports | Several licence classes and embargoed entries; no animal series audited [G]. DFFE's 2023 report was not retrieved by either of us |
| Wider backlog (turtles, seals, elephants, basking sharks) | Unchanged, after the four priorities |
| Non-commercial-only sources | Still Chad's decision; it bears on eBird, the tracking database and several OBIS-SEAMAP sets |

## 9. Enquiries

- **Existing, unchanged:** NOAA Southeast Fisheries Science Center (bottlenose dolphins): sent by Chad; no reply on record. ATAP (SAIAB): contact established; substantive response pending. Neither of us checked an inbox. No follow-up and no duplicate.
- **Worth sending, Chad's decision:** the penguin message, rev 2 of the draft. Its purpose is now reuse terms for the repository file (version B), corrections and interpretation, and whether one track could be requested. It no longer asks where the data are. A chart from version A does not wait for it.
- **Conditional:** CMS/GIUM, only once an African migration is chosen.
- **Worth sending, Chad's decision (rev 2.1, after audit B):** one enquiry to the IWC Secretariat. The IWC's website terms require prior written permission to republish its material, so the proposed recovery card cannot show IWC wording or figures without it. The same message asks for the abundance figure's derivation, reference year and range. Draft, unsent: `docs/research/animals-source-audit/ENQUIRY-DRAFT-IWC.md`. Audit: `docs/research/animals-source-audit/WHALE-RECOVERY.md`.
- **Not needed:** IUCN for a category-only card. USGS and the two Movebank packages (open licences on the records).
- **Later:** eBird, Motus, Living Planet, an active Movebank study owner; the tracking database's formal request, only after a reply and through Chad's own account.

## 10. Date-line and polygon criteria (GPT's corrections folded in)

- **Source convention is separate from display convention.** A source in 0 to 360 is valid and is normalised explicitly, with the rule recorded; it is not refused for being outside ±180. Values that are invalid in the source's own convention stop the build.
- **Tests before any global track or polygon ships:** crossings eastward and westward; +180 and −180 treated as the same meridian; fixes exactly on the line and repeated fixes; paths near a pole; joins between nearly antipodal fixes, where the short way is ambiguous; fitting the view to a track that spans the line; polygons with holes, several parts and either winding; the land test for sea journeys run along the join actually drawn.
- **Unsupported cases are refused or left unjoined, visibly.** No path is invented.
- **For a polygon module:** its own switch and Key state, independent of the journey's; cancelled and failed loads; keyboard, touch and legend behaviour; and wording that never implies an individual animal is inside a corridor.

## 11. Cost: what is measured and what is not

- **Measured (GPT, on the review copy):** the seven existing Animals JSON files total 501,170 bytes. The zebra display file is 440,782 bytes for 13,045 fixes, about 33.8 bytes a fix, before its manifest and catalogue.
- **Withdrawn:** "12 bytes a fix" and "about 48 KB for one bird". Three 32-bit numbers would leave out fields the replay needs. Any other encoding must list every field it carries.
- **To measure once products are chosen:** the selected bird's display file and its compressed size; the chosen herd's polygons after a stated simplification; the penguin table.
- **Hosting:** GitHub Pages can serve these as static files. Its account quotas, bandwidth and build limits, and any visitor assumption, are still to be recorded. **Infrastructure and provider costs are not settled, and no dollar figure is offered.** Nothing proposed needs the hub, a schedule, storage or a key.

## 12. Order of work and what Chad decides

1. Brief A: penguin counts (both versions).
2. Brief B: whale recovery (IWC reference year; Cape Vidal column).
3. Brief C: corridor (one USGS herd).
4. Brief D: bird (two packages).

Each is read-only, bounded, and starts on Chad's go. They are independent; none waits for a reply to any enquiry. Build proposals follow per module, each to GPT, each on Chad's go.

**For Chad now:** which briefs to start · the penguin enquiry: send, amend or hold · corridor: USGS first or wait for Africa · non-commercial-only sources (open since 18 Nov). At implementation planning: which modules go into the first expanded release.

## 13. Not done, not claimed

- No data file audited; no value in any file relied on. No PDF opened by Claude.
- No licence established for the repository file, either article, BirdLife South Africa's page or the CMS maps.
- No estimate of visitors, transfer or price. No refresh cadence for any product.
- No implementation; no change to any Animals code branch, the hub, the site or the probe. Nothing sent.

## 14. What earlier revisions got wrong (kept once, for the record)

- Rev 1: "whether the counts to 2023 are deposited is not established". They are in the paper's linked repository (GPT found it; Claude confirmed the repository and file listing).
- Revs 1.1 and 1.2 treated the IWC figure as a 2026 assessment. The assessment date is 2015.
- Rev 1.1 withdrew stock A because a 2019 paper (93% of pre-exploitation size) and the IWC entry ("not yet recovered") disagreed. An assessment completed in 2015 and a later model with other inputs are not shown to conflict until their years and methods are reconciled. Stock A is simply not pursued.
- Rev 1: Claude's first read of the Dryad record missed its methods and usage notes; GPT's read was right.
- Rev 1.1: "marked open access" for the *Ostrich* paper came from a word match, not an access check.
- Rev 1.2 called the USGS series and the CMS atlas "regularly updated" as if that applied to a chosen product, and said the waved albatross does not cross the date line. Neither is established.
- Revs 1 to 1.2: the 12-bytes-a-fix cost input.
- Rev 1: decision D1 was framed as a gate on the research. It is an implementation-planning choice.
