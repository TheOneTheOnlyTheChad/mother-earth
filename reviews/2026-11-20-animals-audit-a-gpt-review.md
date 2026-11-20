# Animals audit A (penguin counts): GPT independent review — PASS within its scope (relayed by Chad, 20 Nov 2026)

Filed 13:33 UTC (clock reading) on branch `animals-expansion-proposal`. GPT's text as Chad relayed it, unchanged below the line. It reviewed audit rev 2 at `5fcb4d4`. Not a build or release approval. Its wording refinements are carried into audit rev 2.1.

---

African penguin counts — independent review of audit A rev 2



20 November 2026. Supplied branch animals-expansion-proposal, commit 5fcb4d4afdc40364f4f3a0708fa5c5c60f470973.



PASS for the audit's bounded conclusions: A is usable for individual-colony charts as the dated 2021 deposit, with the qualifications below; B requires clarification before public hosting. Neither result is a build or public-release approval. No implementation, branch, probe or external message was changed.



What I independently checked



Read the audit in full and verified its SHA256: e3e01ad71731958a5bcbd537e36da8aa42f1bdc8fc09c0f7a8dc74806f23beca.



Read Chad's existing ZIP in Downloads directly, in memory, using Python's standard library. No extraction to disk, modification or deletion of the ZIP. Its 4,034-byte size and SHA256 2106ce706f014f7d75008d117cba54a803664c279a5c96871396af0486866e11 match the audit. The contained A CSV is 3,890 bytes and hashes to 9c57c16809d1b886c5000555b495551f7d7cb1802cfa70c6d67323a87f40d72c.



Recomputed A's 41 years, 22 colonies, 600 integer entries, 298 missing entries and four 0.1 markers. Every row in its per-colony summary matches my calculation: count, endpoints, internal gaps, markers, minima, maxima and final count. The complete-since-1989 and complete-since-2004 colony lists also match.



B's reported summary table sums to 715 integer entries; every colony's count/endpoints/internal-gap arithmetic is consistent. The shared-cell and difference-category totals agree: 41×22 = 902; 878+24 = 902; 12+3+7+1+1 = 24. I did not independently re-obtain B's exact bytes this turn: raw GitHub retrieval failed through both web retrieval and the Mac network. Its exact hash and complete A/B diff therefore remain Claude's measurements, supported by the source inspection already performed in round 3, not a new independent byte-for-byte comparison. No remote-head verification was performed.



Answers and carry-forward wording



a. Results. Yes. “Usable” for A means a faithful, explicitly dated view of that deposit, not the latest population evidence or validation of every historical census. B's missing reuse terms remain a real public-hosting question. Its unit and artificial-entry treatment need a version-specific rationale from the associated methods or author; absence of a README statement does not prove that no published explanation exists. The enquiry is an appropriate way to settle any remaining gap. Do not use B's numbers while presenting A's licence.



b. Comparison. It is appropriately descriptive and does not invent reasons. Tighten “24 differ” to 24 literal cell differences, including one empty-cell versus NA representation difference. That last item is not a new biological value/state. Avoid calling all 24 “corrected counts”. A's terminal Lambert's Bay marker and B's marker at a different endpoint can be described by their locations without inferring why the authors changed them. B must not be treated as a simple four-year extension of A.



c. Chart note. Yes, disclose the version choice. Suggested study-level note:



Historical census data from the 2021 deposit, ending in 2019. The authors' later analysis file extends to 2023 and differs in some overlapping entries. This chart uses the earlier deposit throughout.



Link both sources in Details and state that the later file's public-display terms are being clarified if that remains true at release. Do not label it “latest”. If a selected colony has changed values, mention that in its details; do not imply every colony was revised. An unchanged Robben Island series, for example, does not need a warning that its own counts changed. A note is not a substitute for reviewing a published correction or withdrawal if one is found later.



d. Enquiry. Rev 2 already asks the right questions; no rewrite is necessary. An optional short addition is:



We also found differences in overlapping colony-years between the 2021 Dryad deposit and the later repository input. Is the repository version the one you recommend for historical counts as well?



Do not attach the whole diff unless useful to the recipient. The author need not explain every cell before a properly labelled archive chart can be considered. Current contact routing and the send decision remain Chad's.



Departures from the brief



The documented owner download and shell-based parsing do not invalidate the findings. The audit records the changed method and the owner-provided input. Its opening “nothing saved to the Mac” sentence should be replaced with “Claude retained no new raw working copies; Chad's downloaded ZIP remains in Downloads.” This avoids contradicting its own method section.



No separate JSON is acceptable for this source review because the compact tables expose the relevant results. Before a build relies on repeated transformations, preserve the exact parser/check logic or equivalent reproducible audit evidence, including explicit NA/empty/anchor handling. That does not require keeping raw inputs in the public repository or repeating the whole audit merely to change evidence format.



Replace blanket “adding cells would be wrong / no fixed-coverage total” wording with “an available-cell sum is not a supported national or global population total”. A consistently observed subset can legitimately be summed as that named subset; it must never stand in for the population. The individual-colony first scope avoids this issue.



Use the established unit label and country definitions, omit artificial markers as counts, preserve missing years, and keep source trend statements separate from a slope inferred by the page. Individual colony increases do not establish recovery of the species.



Next step



Audit A need not go through another review round for these wording refinements. Carry them into the record and a later bounded build proposal when Chad requests it. B's clarification can proceed separately. The other source audits remain independent. Existing NOAA/ATAP correspondence is unchanged; no inbox was checked and nothing sent.
