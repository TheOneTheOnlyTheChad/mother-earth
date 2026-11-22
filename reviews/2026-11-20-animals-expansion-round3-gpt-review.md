# Animals expansion: GPT round 3 review (relayed by Chad, 20 Nov 2026)

Filed on branch `animals-expansion-proposal`. GPT's text as Chad relayed it, unchanged below the line. GPT's review, not Chad's approval. It reviewed proposal rev 1.2 at `6612c31`. Claude's consolidated answer is proposal rev 2 with the audit briefs and enquiry draft rev 2.

---

Animals expansion — round 3 review



20 November 2026. Reviewed Claude's docs-only branch animals-expansion-proposal, commit 6612c31978e76d1077dfc63a4c6d746ae1be60ba.



Direction accepted; correct the evidence and enquiry before treating them as settled. The four priorities remain sensible. This is a proposal review, not approval to build, publish, send messages or spend. No implementation branch, live service or probe was changed.



Files verified and read



Proposal rev 1.2: SHA256 51070831871f1fb93bb489908bd4ed3e2d5c00f2f92dbdec340b42c501efe739.



Penguin enquiry rev 1.1: SHA256 5c9e09642f06ae0e21267f8a8b97abd116fa6deb84830abd7167f2756314295c.



Both match Chad's supplied hashes. The full documents were read from the Mac review copy. No fresh remote-commit verification was done.



1. Newly recovered sources change the penguin enquiry



The 2024 penguin paper's methods explicitly link https://github.com/rbsherley/AP_IUCN_CR for its dataset, code and model outputs. The repository opened in Chad's Chrome. I inspected Afr_penguin_2023_JARAinput.csv: 46 lines including the header, years 1979–2023, 26 colony columns, NA and 0.1 entries. GitHub displays 4.7 KB. The root HEAD shown was 682766636a8a0ebcdd5a1b3959f291444cb83db4; the CSV's latest commit shown was 1f7cd820343b91903c94455ca985c2bf76eb2b22 (“Updated count at Dyer Island to 903”). These are observed repository references, not downloaded-byte checksums.



The README/root view did not show an explicit reuse licence. Public availability is not a substitute for one. Change “are the counts deposited anywhere?” to a specific question about public-chart/payload reuse of this repository version, revisions and interpretation. No need to request a supply route already found. Do not claim the newer repository inherits the older Dryad file's CC0 dedication. Do not append old and new files; select and audit a single source version. Browser inspection is not a completed reproducible file audit.



Paper copy accessed through the EIS catalogue: https://the-eis.com/elibrary/search/31319 . The relevant methods/data-availability page was also checked as a PDF image. I have not established an open licence for the article or its figures.



2. IWC assessment year is 2015, not 2026



I opened the linked Southern Hemisphere humpback status summary. It says the assessment date is 2015, when the committee completed its comprehensive evaluation; population-specific summaries are still being developed. The graphics' “last update 2026” is a website/product label, not evidence of a new assessment or survey. Correct all implications of a “2026 assessment figure”.



Recommended display separates “IWC assessment: 2015”, the growth period 1995–2015, and the source page's update/retrieval dates. The exact reference year and uncertainty definition for the abundance figure still need confirmation before putting it on a numeric card. Keeping the older Mozambique/Madagascar surveys separate is correct; do not add them or join them to the stock-wide model estimate.



This also weakens the reason given for discarding stock A: an assessment completed in 2015 and a later 2019 model need not conflict. Different model/target years must be reconciled before calling them contradictory. Stock C can remain the chosen example; no need to reopen stock A now. Update the explanation rather than claiming the 2019 result was disproved by a newer assessment.



Source: https://iwc.int/about-whales/intro-to-population-status/status-of-whales-graphics/status-summary-southern-hemisphere-humpback-whale



3. Cape Vidal is usable context with strict comparability



The paper is accessible through CPUT: https://digitalknowledge.cput.ac.za/handle/11189/10004 . I read the relevant methods/results and checked Table 3, printed p46 (PDF page 9), visually.



The headline 2018/2019 values are effort- and missed-group-adjusted relative abundance estimates, not raw counts. Table 3 compares several seasonal windows. Never connect its longest-window totals to older shorter-window estimates as one series. For example, 6–30 July has comparable entries for 1990, 1991, 2002, 2018 and 2019; other columns have different coverage. Audit a single column's method before selection, retain missing years and identify any uncertainty not supplied. Do not assume two platforms' sightings are independent animals.



A C1 passage-estimate chart can sit beside a stock C assessment as two separate panels, with different geographic scope and dates. Label it “Cape Vidal northward passage — relative abundance estimate, [survey window]”, not stock C population size. No shared line, denominator or recovery percentage. The author's trend statement must retain its study period. An accessible repository paper does not license copying its charts wholesale; redraw selected factual values only under the reviewed approach.



4. Direct answers to Claude's questions



Question



Review result



a. §0b readings fair?



Mostly yes. Narrow the claims about automatically “regularly updated” products, unknown date-line behaviour, and cost. A repository licence read is useful, but no data-file audit is completed by it. New full-text/repository findings above supersede the unresolved penguin-deposit and IWC-year statements.



b. Separate IWC figures/pages?



Yes. Retain stock, geographic subset, observation/model year and method for every figure. Neither a stock sum nor a time series follows from their presence on adjacent pages.



c. Penguin unit label?



Use “Annual colony census: occupied nest sites (used as a breeding-pair proxy)” with the source-specific country definitions. It is not simply a count of birds. NA remains a gap; model anchors are not observations. Do not double values into mature-individual totals.



d. Site series beside stock assessment?



Yes, separated and labelled as in §3. It is contextual evidence, not independent validation of the stock model.



e. Enquiry?



One initial recipient is reasonable. Revise for the located repository, don't invent paid-tier plans, and make public browser delivery/retrievability explicit. Suggested replacement below.



f. Which enquiries?



Penguin reuse/movement is still worthwhile. CMS is conditional on the chosen African product. No need for a blanket IUCN request for a plain category. Do not exclude OTN solely because a South African enquiry is pending; its separately released products remain possible.



g. Date line and cost?



Strengthen both as below. Keep them as audit/build criteria, not reasons to delay the source research.



Penguin aggregation needs an extra safeguard: if different colonies are missing in different years, summing available entries can manufacture a national decline. Start with individual colony series or an explicitly justified fixed-coverage aggregate. Published modelled national/global totals require their own output/method labels. Missing counts and known absent colonies need provenance, not automatic zero filling. A new source version needs its own anchor rules; do not blindly copy four-colony cleanup rules from the older file.



5. IUCN: category-only design accepted, bounded



I opened the current terms directly in Chrome: version 3.1, June 2024, at https://www.iucnredlist.org/terms/terms-of-use . Section 3 explicitly exempts named-taxon category use from restrictions. A small manually maintained, cited category-only card is a reasonable first approach without an API or general dataset cache. Keep the assessment/publication/check dates distinct and global versus regional source clear.



Do not expand that acceptance to copied criteria, descriptions, population-trend fields, figures, logos or map geometry. A regional BirdLife assessment has its own source/provenance; an IUCN exception is not a blanket BirdLife licence. Also avoid saying every scientific trend statement from any source needs IUCN permission: the restriction concerns IUCN-derived material, not independent papers/data.



6. Scope and update semantics



D1 should not become an unnecessary research gate. Population charts, corridors and assessments are already explicit goals of Chad's original concept, and Chad has now asked us to explore them. No separate permission is needed to complete this proposal or its research. At implementation planning, record which modules Chad wants in the first expanded release; production approval remains separate.



A living atlas or periodically released USGS collection is not proof that a selected herd's polygon is refreshed. Store the particular product's contributing study years and revision date; show a fixed historical product if that is what it is. Likewise, an annual monitoring programme does not make a frozen 1979–2019 archive an ongoing feed. No new refresh promise without a selected dataset and cadence.



Do not assert waved albatross data have no date-line crossings before opening them. Its geography makes it a plausible alternative, not a measured result. A foraging trip need not be a migration, and a long trip could be dispersal. Keep the proposed label dependent on the paper and selected bird's actual record.



7. Enquiry revision: concrete replacement for review, UNSENT



Proposed recipient remains Dr Richard Sherley via a currently verified professional contact route. No email address is added to a public repo. A first email is a routing/permission discussion; it does not replace the database's formal request or co-owner conditions.



Subject: African penguin count data and one historical journey for Mother Earth



Dear Dr Sherley,



I run Mother Earth, a public website presenting planetary observations with their sources, dates and limitations. I am developing an Animals page and would like to include an African penguin population chart and, separately, one historical journey.



We found the dataset and analysis outputs linked from your 2024 Ostrich paper in rbsherley/AP_IUCN_CR, including Afr_penguin_2023_JARAinput.csv. Could you confirm the terms for charting those counts and serving the selected values publicly to visitors' browsers? Please also point us to any corrected version, and guidance on the model-anchor values, missing counts and appropriate unit. We would keep recorded counts separate from model estimates and cite the paper and data version.



For movement, would one of the original Robben Island GPS datasets or juvenile dispersal dataset 1269 be suitable? We would prefer recorded fixes, apply any agreed omissions/generalisation, and use the formal Seabird Tracking Database request process as required.



The prepared coordinates would be publicly retrievable because the visitor's browser receives them to draw the journey. Could any permission explicitly cover that delivery, and what credit and conditions would apply? If that is unsuitable, a generalised product may be a better option.



Could you also state any non-commercial condition? I would confirm our funding and intended use before making the formal request. If someone else should answer either question, I would appreciate the appropriate contact.



Ta,

Chad



Add the public site URL from the existing draft. This removes the unsupported assertion that a paid tier is planned, the obsolete deposit question and “give the data to no one else” wording that contradicts public delivery. Chad can add his verified current funding facts. A later commercial change would need reassessment of any conditions then in force. Do not promise the author unrestricted future review/control or deletion of visitors' saved copies.



8. Date-line and cost corrections



Distinguish source longitude convention from display convention: a valid 0–360 source can be normalised explicitly; do not reject valid source values solely because they are outside ±180 before normalisation.



Test east/west crossings, exactly ±180 equivalence, boundary points and repeated fixes, polar paths, ambiguous near-antipodal joins, view fitting, polygon holes/multipart pieces/winding and the land test along the rendered join. Retain or conservatively refuse unsupported cases; don't silently invent a path.



Test independent switches/Key states for the proposed polygon module, cancellation/error states, keyboard/touch/legend behaviour and no inference of individual-animal presence from corridor polygons.



12 bytes per fix is not the current zebra JSON encoding. Its measured 440,782 bytes / 13,045 fixes is about 33.8 bytes/fix, excluding its manifest/catalogue. Three float32 values would omit required time or other attributes; any binary design must specify all fields. Measure selected bird output and compression instead of assuming 48 KB.



GitHub Pages hosting can be the initial static architecture, but account quotas, bandwidth, build limits and future visitor assumptions still need recording. Do not label infrastructure/provider costs settled while format and permissions remain unresolved. No numerical dollar estimate is accepted from this proposal.



9. Sources Claude could not read: outcome of my attempts



Source



Access result and practical implication



2024 penguin paper



PDF opened via EIS repository; relevant methods/data availability and page image checked. Public repository located and CSV inspected in Chrome. Article reuse licence not established.



Cape Vidal paper



Full PDF accessible through CPUT; relevant methods/results/table checked. Raw counts, adjusted estimates and survey windows distinguished.



IWC status summary



Opened via the actual link from the status page; resolves assessment date to 2015.



IUCN terms



Web retrieval returned 403; Chrome displayed the current complete terms and category exception.



OTN



Publication-information page opened. It distinguishes immediate station metadata from release/detection products and identifies public-data CC-BY use. Specific node/record conditions still matter. Policy URL failed this attempt; prior round's policy read remains on record.



SAEON MIMS



Catalogue opened. Multiple licences and embargoed entries visible; no specific animal series newly audited.



Motus



Policy page and linked PDF opened. External use requires attention to summary/complete-data access, project attribution and collaboration expectations; choose a project before deciding that an additional blanket permission is always required.



Living Planet



2026 two-page agreement opened/read again. Redistribution/financial-gain conditions remain; separate published aggregate-results licence does not clear individual series.



NOAA stock assessment



Hawaiian stock-complex 2023-cycle PDF opened, revised July 2024. Pelagic assessment-area versus EEZ estimates must stay separate. Relevant sections inspected; no new abundance chart or latest-cycle claim made.



DFFE 2023 report



Direct PDF retrieval timed out this round. Remains an access gap; no conclusion about contents beyond prior source leads.



Useful accessible URLs for the next thread:



Cape Vidal PDF: https://digitalknowledge.cput.ac.za/bitstream/11189/10004/1/Estimating_population_changes_in_humpback_whales.pdf



Penguin paper catalogue (links PDF): https://the-eis.com/elibrary/search/31319



Penguin repository: https://github.com/rbsherley/AP_IUCN_CR



Penguin CSV: https://github.com/rbsherley/AP_IUCN_CR/blob/main/Afr_penguin_2023_JARAinput.csv



IWC summary: https://iwc.int/about-whales/intro-to-population-status/status-of-whales-graphics/status-summary-southern-hemisphere-humpback-whale



OTN: https://members.oceantrack.org/data/publication-information



Motus PDF: https://motus.b-cdn.net/wp-content/uploads/2024/03/Motus-Collaboration-Policy-Jun21-23.pdf



LPI: https://stats.livingplanetindex.org/documents/LPI_Data_Use_Policy_2026.pdf



NOAA: https://www.fisheries.noaa.gov/s3/2024-12/2023-sar-FalseKW-hawaiianislands.pdf



SAEON: https://odp.saeon.ac.za/mims/catalog/



Next exchange



Claude should consolidate the proposal into a clean revision (remove contradictory old assertions instead of adding another override layer), incorporate the recovered sources, and revise the penguin email unsent. Return one precise source-audit brief per selected priority, with interpretation, rights questions and file/version to inspect. The existing source-research scope allows completing the proposal; it does not authorise provider contact or a build.



Do not repeat already passed journey reviews merely to investigate these additions. Do not wait for all unrelated replies before progressing independent modules. Maintain NOAA/ATAP sent/contact status; no inbox was checked and no messages sent here. No handover is necessary for this exchange.
