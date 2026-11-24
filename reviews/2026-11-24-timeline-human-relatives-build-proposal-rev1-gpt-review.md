# Timeline — Humans and human relatives: build proposal rev 1 review

24 November 2026 · Independent GPT review · repository snapshot `d933709`.

**Accept the direction for a bounded, unpublished rehearsal build, with the specifications below incorporated into the branch and its review packet. No extra proposal round is required just for these clarifications. Recommend B1 yes, B2 L1, B3 yes, B4 provisional yes, B5 yes, B6 build the rehearsal now with La Ferrassie explicitly unfrozen. Chad supplies the branch-build go. No catalogue freeze, upload, hub pin, page release or email send is approved here.**

## 1. Evidence checked and source state

Read the build proposal, source-check rev 1.2, enquiry drafts and private Omo addendum. Public files match exact snapshot `d933709`. Inspected current renderer validation, mark construction, window clamping and tick selection; no browser or implementation test was run.

Independently read the already-downloaded corrected Omo workbook's cells. File: `41586_2021_4275_MOESM5_ESM.xlsx`, 10,227 bytes, SHA256 `8db1b690362622b297c2c2e2bbeba2ca1a7549a2c674a75d5b15878f7ade6020`. Composite row 10 gives 233 ± 22 ka under Kuiper 2008, 234 ± 22 under Renne 2011, n=71; columns distinguish uncertainty with/without J. **The corrected-table dependency is closed.** The eruption-to-fossil association remains the previously reviewed stratigraphic relationship, not a direct Omo I date.

Xiahe uses the accepted, explicitly attributed 2024 layer-age route. Drimolen remains held; DNH 127 remains excluded; Ngandong and Liang Bua remain unverified. The later La Ferrassie chronology paper remains unread: one DOI access attempt in this check failed, and no PDF was opened. This review does not assess that paper's conclusions.

The 2020 La Ferrassie measurement remains supported, but **the entry is not frozen for release until the identified later paper is assessed**. A branch may exercise that provisional entry. A note saying a relevant later analysis is unread does not, by itself, earn GPT clearance of a frozen claim. If access remains unresolved, the candidate may omit this find rather than delay all other work. An author reply is evidence to review, not automatic clearance or permission.

## 2. Answers to the six review questions

### Q1 — entry identity

**Yes: one find/context per entry meets the requirement. No group container is needed.** Dinaledi's assemblage is the selected context, not a fictitious single specimen. Keep stable find ids, attribution and dated-material association separate. A link to a broad group/site record must not masquerade as a specimen identifier.

### Q2 — Omo limit drawing

**Prefer L1: tick plus labelled eruption-uncertainty band and a short open chevron toward older ages.** A fixed-pixel chevron is appropriate because it does not assign an older endpoint.

The label “dated eruption, 233 ± 22 thousand years (2σ); Omo I is older than this layer; older limit unknown” must be available without relying on colour or opening the panel. The band belongs to the dated layer; it is not a fossil-age interval or an absolute confidence-bounded fossil limit. The tick denotes the eruption, not a point date on Omo I. Use shape/line treatment and text to distinguish the band from deposit brackets and calibrated dates. If that distinction fails visual review, L2 is an acceptable fallback with uncertainty still explicit in the adjacent label and accessible name.

Fit using the finite eruption reference/uncertainty only, with ordinary visual padding; never synthesize an unknown older extent. A clipped chevron must remain recognisably open rather than acquire a false endpoint. When the reference/band is outside the viewport, absence of an anchored mark must not become a claim that the fossil cannot fall in the displayed range. Define selection/offscreen behaviour and the empty-window wording accordingly.

### Q3 — datum and conversion

**Keep 1950 for cal BP and never use the reader's clock. Clarify the single axis convention.** “The axis treats its zero as that datum for these claims” leaves a mixed-origin axis ambiguous. State one fixed display convention for the common Ma/ka coordinate system. Keeping cal BP/1,000,000 is reasonable if the display convention explicitly uses the fixed 1950 BP reference and carries the other sources' ka values as reported, at their published precision; their unspecified reference epochs are not thereby verified as 1950.

Keep original units/datum on each claim. Do not silently claim every source uses an identical epoch, manufacture a precise 76-year correction for unspecified ka ages, or let today's year alter the catalogue. State the approximation once in plain language. Define the corresponding axis/preset labels consistently. Source notation should say `ka cal BP` when that is the source's notation, while numeric cal-BP fields can be stored in years; specify those unit conversions explicitly.

Use the 2020 calibrated result consistently; preserve its 95.4% meaning. Neither a calibrated range nor its drawing midpoint is a duration or a uniformly distributed probability. Original radiocarbon uncertainty has its own meaning and must not inherit the calibrated confidence level.

### Q4 — sub-rows

**Yes for this bounded four-find slice.** One sub-row each avoids hiding the La Ferrassie find inside the Xiahe layer range and avoids visually joining them. No future cluster implementation is required now. If a fifth find would exceed the row rule, reject/defer it rather than silently reintroduce clustering. Define row order deterministically from finite, documented keys; the unknown older side cannot set it.

Keep useful click/touch targets when the glyph is narrower than a target. Distinguish glyph width from hit-area width. Verify label collisions, lane height, focus visibility and keyboard/history behaviour at both widths and when the viewport changes. Measured glyph extents must not include invisible hit-area padding.

### Q5 — forbidden phrases

**The global ban is too blunt.** Restrict any lexical guard to authored interpretive claims and require word/phrase boundaries; do not substring-match `met` inside other words. Preserve verbatim source titles and attributed quotations/metadata, even when they contain “earliest” or similar terms. Fixed contextual wording such as “earliest detection” elsewhere must remain unaffected.

A keyword blacklist does not establish scientific truth, and a source title containing a comparative claim does not make that claim ours. Retain the controlled claim types, neutral titles, explicit association and editorial review. Test both rejection of an unsupported authored assertion and acceptance of genuine source metadata.

### Q6 — validation and breaks

The proposed break list is useful; add these focused checks in generator and page validation where applicable:

- Finite numbers, positive uncertainty, valid ordering and bounds for the full derived interval; for a limit validate `ref_ma ± ref_pm`, with `ref_pm` explicitly in Ma. Reject strings, nulls, NaN/infinity, negative errors and unsupported sides. The existing boundary validator does not automatically cover the new field names.
- Validate the supported datum, calibration and confidence semantics rather than their mere presence. For this calibrated claim enforce 1950, the selected curve/result, a probability in its defined units/range, lab identity and original radiocarbon measurement/uncertainty. Reject inconsistent stored Ma endpoints versus stated source values. Keep original radiocarbon error separate from 95.4% calibrated coverage.
- Enforce one axis claim, lane/type compatibility, a nonempty site and attribution name, and an allowed attribution basis. Validate required dated-material and association content, not only their labels. Reject a group/site id used as the specimen id.
- Exercise narrow/wide views, offscreen limits, band clipping and fit at both ends. Verify every find remains independently selectable, including when its visible glyph is a midpoint fallback. Compare complete claim content and focus/history after Back/Forward, not only the URL.
- Test malformed new claims in both generator and browser, not just a valid rehearsal. Test all meaningful old/new page-script-catalogue combinations: retain a usable list and a clear explorer failure state; no partial misleading rendering. Schema-3 rejection depends on the actual served combination, not only a claim-label count assumption.
- Include tick formatting and spacing just below, at and above 2 Ma, and at the 0.05 Ma minimum. Finer numeric steps are required too: changing only the printed unit leaves the existing 0.1 Ma minimum tick step inadequate. Avoid duplicate rounded labels or false precision. Unit text and accessible labels must agree.

Update affected travel/axis expectations with a reason for each changed assertion. Existing accepted story and change-record behaviour remains protected; do not rewrite their expected scientific content to make tests pass. Run deliberate breaks independently, plus an old-code control for the new behaviours. Baseline and candidate logs must name their exact trees.

## 3. Scale and compatibility decisions

B4 is a provisional interface choice: 400 ka view and 50 ka minimum are reasonable to try. The table is arithmetic, not proof of readability or actual lane width. Measure rendered widths, clipping, labels, targets and keyboard paths at 1280 and 390 px before accepting it. The approximately 6.4 px La Ferrassie extent on a phone-width viewport is not an adequately sized standalone touch target.

B5 is accepted with responsive tick steps and an unambiguous unit. Fix the proposal's “axis stays in Ma” wording to distinguish stored Ma coordinates from displayed thousands-of-years ticks. No need to add new geological periods. Restore old views correctly, and explicitly verify older-script fallback for newly saved narrow views.

Keep schema 4 as a separate catalogue revision with reviewed publication order. Existing R1/R2/R3 bytes and routes remain unchanged. A fixture preview must isolate catalogue/data requests and not accidentally fetch a new live product. Freeze record: source versions, passage locators, the chosen result and units, scientific disposition and final bytes. Actual release day and hashes are later work.

Work from fresh main and name the exact changed files in the packet. The Animals `TL_MAIN` adjustment follows the reviewed page commit H. If Sources/shared files beyond the existing Timeline scope are changed, coordinate their narrow baseline handling with their owners; do not advance `BASE_MAIN` or another thread's pin wholesale. No deployment is commissioned through this review.

## 4. Enquiry drafts and the PDF decision

**The four drafts are suitable in purpose, with one shared wording correction before sending:** replace “we only show what we have read in full” with “we only show claims whose relevant dating and association passages we have checked in the full text.” The accepted rule is passage verification, not necessarily a cover-to-cover read. The request for a number plus its material/find association is appropriately specific. Keep the La Ferrassie question neutral about whether the later paper changes the bone date, the modelled individual age or the individual attribution.

No address was verified in this review. Take the current corresponding-author address from the actual article or an official institutional source before Chad sends. Keep replies/private copies outside the public repository; record scientific dispositions without republishing supplied correspondence. No automatic follow-up, and silence supplies no permission.

**Recommend allowing legitimate scholarly PDFs for private reading**, including an author-supplied copy or a publisher/institutional-repository version. There is no evidential advantage to refusing a paper solely because of its file format. Extract text with page/section locators and inspect the relevant tables/figures when extraction alone cannot establish their meaning. A PDF does not supply redistribution permission, and an author reply does not remove the need to verify the claim.

This is a recommendation to change the current text-only constraint, not an instruction overriding Chad's rule. Until Chad accepts it, ask for passages as text and remove the unconditional invitation to send a copy in an unspecified format. If he accepts, keep the copy option and use legitimate versions; no bypass of access controls is authorized. A legitimate public copy of the 2023 paper could close the evidence gap without waiting for an email reply once the format rule permits reading it.

## 5. Input identities

| File at `d933709` | Bytes | SHA256 |
|---|---:|---|
| `docs/concepts/TIMELINE-HUMAN-RELATIVES-BUILD-PROPOSAL.md` | 15,768 | `2910124961bc3bce39c68de05bc925f3a49e7d9ed6464d8762b725a205a79846` |
| `docs/research/TIMELINE-HUMAN-RELATIVES-SOURCE-CHECK.md` | 13,986 | `2ac7b0849f0bb76feb68d0d5825c1154e451bfd91216aea0d23687830f28737b` |
| `docs/research/TIMELINE-HUMAN-RELATIVES-ENQUIRY-DRAFTS.md` | 5,825 | `852d88c49263e6e8be88250c1ea58f14273fc4edd4684faf04a211abcc900bb1` |

No repository file was edited. No email was sent and no build, account action or release occurred in this review.
