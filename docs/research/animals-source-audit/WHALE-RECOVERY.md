# Animals: audit B, whale recovery (IWC stock C and Cape Vidal)

20 Nov 2026 · rev 1 · for GPT · read-only research under brief B (`docs/concepts/ANIMALS-EXPANSION-AUDIT-BRIEFS.md` rev 1.1), on Chad's go of 20 Nov. Nothing built, nothing sent, no account, nothing downloaded or saved.

**Results**
- **IWC assessment for Western Indian Ocean humpbacks (BSC): requires clarification.** Two reasons. The IWC's own terms say its material must not be republished without written permission (§3). And the pages do not say which year the abundance figure refers to or what its interval is (§2).
- **Cape Vidal passage estimates: requires clarification.** The values are GPT's extraction from a PDF Claude has not opened; the repository copy is "all rights reserved"; the table gives no uncertainty (§4).
- **Neither part is unsuitable.** The stock, the wording and the survey window are all identified. What is missing is permission and two definitions.
- **This changes the proposal's enquiry list:** rev 2 said no IWC message was needed unless reuse turned out to be unclear. It is not unclear; the terms require permission. An IWC enquiry is now recommended, for Chad's decision (§5).

## 1. How this was done

- In tabs Claude opened in Chad's Chrome and closed afterwards, 20 Nov 2026. IWC status graphics page and estimates page: first read between 12:41 and 12:44 UTC; status summary: 13:03 to 13:04 UTC; the graphics page's explanatory text, the IWC disclaimer page and the CPUT repository record: between 13:34:13 and 13:37:24 UTC (clock readings).
- Page text only. No PDF opened by Claude. The Cape Vidal table is GPT's extraction, relayed by Chad, recorded as such.
- Quotations are short and exact; the rest is paraphrase.

## 2. The IWC assessment

**Source pages**
- Status graphics: `iwc.int/about-whales/intro-to-population-status/status-of-whales-graphics`
- Status summary, Southern Hemisphere humpback: the same address followed by `/status-summary-southern-hemisphere-humpback-whale`
- Population estimates: `iwc.int/about-whales/estimate`

**What the graphics page says for "Humpback: Southern Hemisphere, Western Indian Ocean (also known as BSC)"**

| Field on the page | Value |
|---|---|
| Status sentence | "Abundant and recovered after strong growth." |
| Abundance | 18,111 (15,580-20,700) |
| Relative Abundance | VERY GOOD |
| Change over a 20-year period | Growth (1995-2015): STRONGLY INCREASED |
| Label | "last update: 2026" |

**What the page's own explanation says** (paraphrased, from its expandable text)
- The Scientific Committee uses computer models of direct abundance estimates together with other information to track abundance. The table summarises status by two measures from such stock assessments: Relative Abundance and 20-Year Change.
- Relative Abundance is usually a proportion of the estimated number of whales before whaling, sometimes of what the habitat can support; a reference year is sometimes specified.
- The 20-Year Change is based on model estimates of recent change.
- It refers the reader to the Status Summary and Status Details for specifics.

**What the status summary says:** summary pages for all Southern Hemisphere humpback populations "are currently in development". "The assessment date for these populations is 2015", when the Committee finalised a comprehensive evaluation that took over ten years. New information continues to be reviewed and the assessments will be updated.

**Established**
- The figure is a model-based assessment output, not a survey count: the page's explanation says so in general terms for the table.
- The assessment date is 2015. "last update: 2026" is the page's label.
- The growth class refers to 1995 to 2015.

**Not stated on the pages read**
- The year the 18,111 refers to. (2015 is the likely reading, since the growth period ends there; that is an inference and is not shown.)
- What the bracketed range is (a confidence interval, a credible interval or something else).
- The numeric Relative Abundance behind "VERY GOOD".
- Where it would be stated: the population's own Status Summary and Status Details, which the IWC says are in development, or the Scientific Committee's published assessment. Neither was read.

**Kept apart (estimates page, humpback section)**
- "Eastern Africa: Mozambique", 2003: 6,000 (4,400 – 8,400). "Eastern Africa: Madagascar", 2004: 7,400 (2,100 – 12,800). The column heading for the range is "Approximate 95% CI".
- These are survey-based estimates for parts of the stock in single years. They are not summed, not compared with 18,111 as a trend, and not drawn with it.
- West South Africa (BSB2) on the graphics page: 484 (138-860), "VERY LOW", with a caution about scientific uncertainty. Never borrowed from or for stock C.

## 3. Reuse: the IWC's terms

From the IWC's "Copyright disclaimer" page (`iwc.int/disclaimer`), read in full:
- Information on the site is the IWC's copyright "and must not be reproduced in any medium without permission".
- Users may copy some material for personal use as private individuals only, and must not republish any part of the data on another website, or as part of any commercial service, without the IWC's prior written permission.
- If permission is given, the IWC sets guidelines for how the information is displayed, and an acknowledgement of the source is required.
- Requests go to the IWC Secretariat. (Its address is on that page and is not written here.)

**What follows.** A card that shows the IWC's status sentence, its figure and its growth class on Mother Earth is republishing part of that material on another website. Under the IWC's own terms that needs written permission. Whether a short cited statement of fact would be allowed without it is not Claude's call and is not assumed. **No IWC wording or figure is shown without the IWC's written permission.**

## 4. Cape Vidal

**Source:** Wilkinson, Seyboth, Olbers, Vermeulen, Kramer and Findlay 2023, "Estimating population changes in humpback whales *Megaptera novaeangliae* migrating past Cape Vidal, South Africa", *African Journal of Marine Science* 45(1): 39–50, doi `10.2989/1814232X.2023.2193591`.

**Read by Claude (the abstract, on the publisher's page):** shore-based surveys from two independent platforms, 27 June to 7 August, in 2018 and 2019; groups tracked by theodolite; observed numbers adjusted for daily sighting effort and for groups missed; daily sighting frequency aggregated across the season into annual relative abundance estimates of 10,499 (2018) and 11,009 (2019); an average annual increase of 7.4% to 8.8% over 31 years from 1988 when compared with earlier estimates from the same area; the authors read this as a slowing of the rate of increase.

**GPT's extraction, recorded as GPT's (Table 3, printed page 46, the "6–30 July" column):**

| Survey year | Relative abundance estimate for that window |
|---|---|
| 1990 | 695 |
| 1991 | 1,093 |
| 2002 | 1,673 |
| 2018 | 6,801 |
| 2019 | 7,378 |

**Claude's check of the extract against what Claude has read**
- Unit: consistent. The abstract calls the headline values "annual relative abundance estimates", adjusted for effort and missed groups. GPT reports the same kind of value for the window.
- Window: consistent. 6 to 30 July lies inside the 27 June to 7 August survey period, so a window total below the season total is expected: 6,801 against 10,499 for 2018, and 7,378 against 11,009 for 2019. That is a consistency check, not a verification of the cells.
- Years: 2018 and 2019 match the abstract. 1990, 1991 and 2002 are earlier surveys the abstract refers to only as "previous estimates"; **Claude cannot confirm those three values**.
- Not checkable by Claude: the cell values themselves, the column's exact heading, whether the older values were recomputed by these authors for this window or taken from earlier papers, and the absence of intervals.

**Reuse.** The repository record (CPUT Digital Knowledge, handle `11189/10004`) lists the article with publisher NISC and one PDF of 1.01 MB, and states that items are "protected by copyright, with all rights reserved, unless otherwise indicated". No open licence is indicated on the record. The publisher's page showed the abstract view. So redrawing five cited values as facts is a reuse question that is not settled here; it goes to the build proposal's release review, and to the authors if Chad wants certainty.

**If shown, how** (from the proposal and GPT's refinements; unchanged)
- Its own panel, titled "Cape Vidal northward passage: relative abundance estimate, 6–30 July".
- Five points for five survey years. Missing years are gaps, not zeros, and the points are not joined as if yearly.
- "No uncertainty interval is given in the source table" on the card.
- The authors' 7.4% to 8.8% a year is quoted as theirs, with "over 31 years from 1988", and with their own reading that the rate is slowing. No rate is computed from the five values.
- Sub-stock C1 at one site. Not the stock's size, and not a check on the IWC model.

## 5. What this means for the module

- The whale recovery card can be designed now: stock, wording, fields and the second panel are fixed.
- It cannot be shown until two things are settled:
  1. **IWC permission** to display the status sentence, the figure with its range, the growth class and period, with the IWC's display guidelines and acknowledgement; and, in the same message, what year the figure refers to and what the range is.
  2. **The Cape Vidal values**: either an independent read of Table 3 (GPT's extraction stands until then, labelled as GPT's), and a view on reuse of five cited values.
- If the IWC's answer on the figure is slow or negative, GPT's point applies: the dated status statement could still be used with permission, and the number left unavailable.
- **Recommended, for Chad's decision:** one short enquiry to the IWC Secretariat. Not drafted; Claude drafts it only if Chad asks. It would be a new enquiry and would change nothing about NOAA (sent) or ATAP (contact established, response pending).
- An unread lead: the Scientific Committee's assessment is published in the IWC's journal. Its licence and whether it states the reference year were not checked.

## 6. Not done, not claimed

- No PDF opened by Claude: the Cape Vidal paper's methods and Table 3 are GPT's reading.
- The IWC's Status Details for this stock, the Committee's reports and the journal: not read.
- No permission sought or assumed. No statement that citing a published figure is or is not allowed.
- The NOAA stock assessment for false killer whales: out of scope here.
- No chart, no card, no build.
