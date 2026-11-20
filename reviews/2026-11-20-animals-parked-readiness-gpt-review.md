# Animals: GPT parked readiness review, 20 Nov 2026 (relayed by Chad)

Filed 20 Nov 2026 11:33 UTC (clock reading). GPT's text as Chad relayed it, unchanged below the line. **GPT's review, not Chad's approval, and not checked by Claude:** the NOAA report (a PDF) was not opened by Claude (text-only rule); the population finding is recorded as GPT's reading of Table 1. Nothing merged, deployed, filed in REGISTER or sent.

---

Animals — parked readiness review, 20 November 2026



Verdict: the parked private candidate remains useful and its prior private-preview pass is not withdrawn. It is not ready for public release. This review finds a published answer to the whale population question and corrections needed in the release documents. Nothing was changed in Claude's files, merged, deployed, filed in REGISTER or sent to providers.



Material checked



_review/animals-release-assessment-74941ff/: release assessment rev 1; Sources/REGISTER draft rev 1; enquiries rev 2, all read in full.



_review/animals-journeys-preview-ea5414d-full/: manifests, catalogue, display files, page/replay scripts, review packets and test instructions.



Current main HANDOVER and STATUS parking instructions. The later instruction keeps all three animals together; the older two-animal recommendation is superseded.



The replay script, Animals HTML, index HTML and UI test match the code hashes listed in the r2 packet where checked. The preview directory is a review copy, not a Git checkout; no new remote-head verification was performed.



New finding: whale population is documented



Oleson, Bradford and Martien (2023), Developing a management area for Hawaiʻi pelagic false killer whales, NOAA Technical Memorandum NMFS-PIFSC-150, DOI https://doi.org/10.25923/c9qv-2v95, Table 1, printed page 6 (PDF page 12), explicitly lists ATN tag 98364, contributor CRC, contributor track PCTag041, among tags deployed on Hawaiʻi pelagic false killer whales. The table and caption were checked in the PDF image, not just a search snippet.



Source: https://repository.library.noaa.gov/view/noaa/56119/noaa_56119_DS1.pdf



This supplies a direct published basis for the population sentence; it is not an inference from the journey's shape. Suggested wording: “NOAA's 2023 report lists this tag as a Hawaiʻi pelagic false killer whale.” Cite the report. Do not turn this into a population count, trend, current conservation assessment or claim that showing the journey is risk-free.



The report lists a track start of 22 October 2013 and end of 22 February 2014. The shipped replay begins 23 October and ends 12 February after filtering. Keep the shipped fix times as recorded; distinguish the source/report span from the displayed span. The population lookup does not resolve the existing source-file deployment-time discrepancy.



Required corrections before release review



Revise the assessment §§1, 4, 5 and 7 and the whale conditions in Sources/REGISTER. “Keep whale private until population known” and “release zebra/shark first” are stale against Chad's later decision. The published population finding now answers the fact question. Keep the three-animal scope unless Chad changes it.



The sensitivity assessment overstates what presentation adds: “adds nothing” and “rounding would hide nothing” are not sufficient safety arguments. A searchable replay makes existing coordinates easier to inspect. Assess recurrent sites/corridors and accessibility explicitly; record any remaining uncertainty and Chad's per-animal precision decision. Tag-only labels are not anonymisation because the cited public records remain linkable. This does not by itself require removing an animal or contacting an author.



Retain the zebra timestamp qualification in the Sources draft: its README permits UTC or GPS time, rather than established UTC accuracy to the second. The manifest already discloses that uncertainty. Do not imply centimetre accuracy from decimal precision.



Replace the sweeping “one place ... archive in place of a live feed” claim with a narrow statement about the approved recorded-animal-journey exception. Other parts of Mother Earth already show dated snapshots/examples.



Final release wording lives in HTML and pinned manifests: zebra sensitivity, shark/whale card.note, plus animals.html's obsolete “one study” meta description. Updating manifests requires new manifest hashes in the catalogue and a new catalogue hash in both page scripts. Recheck the entire chain; do not edit just visible HTML.



Sources and REGISTER review



The draft's counts and filtering arithmetic agree with the shipped manifests: zebra 13,045 fixes, 3 positionless rows omitted; shark 1,004 → 755, with 208 + 1 + 40 removed, 616/754 steps joined and 69% classes A/B; whale 824 → 661, with 1 + 129 + 1 + 30 + 2 removed, 554/660 steps joined and 54% classes 0/A/B. Dates and source hashes in the draft agree with the manifests where compared.



The shark credit includes creators, dataset link, licence link and modifications and fits the stated CC BY 4.0 attribution structure. The current Zenodo record confirms 34 tagged sharks, UTC and the source methods, but its licence field did not render in today's retrieval and its API was unavailable. This review therefore carries the earlier licence audit rather than claiming a new independent verification of that field. CC BY requirements checked at https://creativecommons.org/licenses/by/4.0/ . The whale's data.gov record independently states CC0: https://catalog.data.gov/dataset/false-killer-whale-pseudorca-crassidens-location-data-from-a-satellite-telemetry-tag-ptt-i-687f4 . The zebra DOI did not resolve through today's retrieval; its earlier rights audit carries forward.



Keep Natural Earth 1:10m as its own REGISTER entry: it is a distinct pinned file/version and build-time use from the existing 1:50m coastline entry. The date/title/version and public-domain provenance should remain clear. Final Sources should link the land-data source as well as describe it. Preserve “displayed” versus “recorded”, experimental filtering, nominal Argos uncertainty, enlarged-marker disclaimer and the distinction between straight joins and an animal's actual route.



Enquiries rev 2 is consistent with the later handover: NOAA enquiry sent after a bounce; ATAP contact established, full enquiry supplied, substantive response pending as recorded. They concern other datasets and do not block these three journeys. No email inbox/replies were checked today; do not assume no newer reply exists or send duplicates.



Today's independent checks and limits



Zebra build tests: 22 passed.



All three display files: SHA256, byte size, fix count, coordinate range, strictly increasing times and endpoint agreement checked. Sea-journey class counts, join totals and time-limit compliance checked.



Both script pins → catalogue → all three manifests → display files: hashes verified.



Argos rule/build suites could not start because geographiclib is missing. No dependency installation performed.



Browser UI suite not rerun: it expects Playwright and a hard-coded cloud globe-library path absent from this Mac. No new claim of 314 checks or 38 deliberate breaks passing today.



No fresh raw-input rebuild, land-intersection rerun, performance run, real-phone Safari or screen-reader test. The local r2 packet predates the later performance closure recorded in current HANDOVER; retain that provenance distinction.



Complete resume list



Record this review and population citation; correct release drafts; obtain Chad's per-animal sensitivity decisions; bring the proposal/source-audit branch into the final release history (it is not contained in the journeys branch); merge current main into a release branch and resolve shared header/layer changes; make final Sources and release wording changes; rerun relevant journey/build and older regression suites with their fixtures and correct server; complete or explicitly record device/accessibility limitations; submit the actual release tree for independent review; then Chad's production approval steps, served-file verification and live smoke check.



Parked work can remain parked while another specification proceeds. No public-release clearance is given by this review.
