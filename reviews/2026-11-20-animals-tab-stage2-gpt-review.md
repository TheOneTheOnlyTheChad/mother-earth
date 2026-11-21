# GPT review: Animals tab Stage 2 candidate, the waved albatross (`ec19905`)

**GPT's text (dated by GPT 20 November 2026), relayed by Chad on 21 Nov 2026 and filed unchanged below. It is GPT's review, not Chad's approval. Filed 21 Nov 2026 04:03 UTC.**

---

GPT → Claude — Animals tab, Stage 2 review
20 November 2026

VERDICT: PASS for the private-preview Stage 2 candidate.
No blocking finding. This is not clearance to merge, deploy or publicly release Animals.

IDENTITY

Branch: animals-tab-rc
Code reviewed: ec199058bd53eef9ff300488bc19909166bfce43
Packet head: 774e66ef66082062baa57c981181ce7a67f7df31
Comparison: Stage 1 r2, 069a2dc

Mac tree reviewed:
~/Documents/Mother Earth/_review/animals-tab-stage2-ec19905/

Packet SHA-256:
6e2d3d298312eda6f704ef7851a693a11f18c8743e215be2d96eaf35326dd63e

The packet hash and all twelve file hashes in its table match the reviewed bytes. The review copy has no Git metadata, so commit identities are supplied provenance; file hashes were independently checked.

This is the Stage 2 BIRD review, separate from the earlier Stage 1 hold and pass.

WHAT GPT CHECKED INDEPENDENTLY

1. Builder tests with both actual pinned source CSVs:
69 passed, zero failed.

The test file reports that Git tracked-file checks cannot run in this copy and scans the folder tree instead. This is not a Git-history audit.

2. Builder --check:
The display file and manifest both rebuild byte for byte, exit zero. No output data was written.

3. Independent source extraction:
Re-read the tracking and reference CSVs without importing the builder. Used a different spherical-distance formulation and independently reconstructed periods and join flags.

All 981 displayed time/latitude/longitude/accuracy tuples match.
All 14 withheld periods, totalling 345 fixes, match.
All join flags and listed failed-attempt times match.

Confirmed:
- 1,338 source rows
- 1,326 positioned fixes
- 12 failed attempts
- 981 displayed fixes
- 345 withheld fixes
- 14 withheld periods
- 966 joined steps
- 995 slider stops

4. Reader inspection and independent logic checks:
Read the new builder, configuration, changed reader paths, card rendering changes and relevant new browser checks.

Exercised the actual reader functions in a separate local harness at 2,052 distinct replay times across slider stops, failed attempts and withheld boundaries.

Hidden-state classification and bar wording/accuracy suppression match independent expectations.

Nine malformed variants were refused, including missing required fields, bad accuracy, an invalid failed time and inconsistent periods.

This harness is not the Playwright suite and does not test graphics rendering.

5. Existing journeys:
The six older display/manifest files are byte-identical to Stage 1 r2.

Both older builders, animals-globe.js, style.css, index.html, app.js and layers.js are also unchanged.

6. Direct Chrome checks:
- All four switches start off.
- Bird opens at the recording’s withheld beginning.
- Opening text states that no marker is shown and gives the next displayed time.
- One right-arrow step reaches the first displayed fix, with its 5.38 m tag estimate.
- End reaches the final displayed fix, with its 6.14 m estimate.
- Playback advances through the recording.
- Observed the separate nine-hour missing-source interval wording.
- Selecting zebra switches the bird off and starts zebra at its first recorded fix.

7. Phone-size view, 390 × 844:
Switching the bird on reveals the globe even though the opening has no marker.

The globe fits on screen, approximately y=8 to y=428. Focus remains on the bird switch, and the Journey switches return link is visible.

Inspected the opening and completed-track views. Real NASA imagery loaded in this browser session with its separate backdrop date. Temporary viewport override was reset afterwards.

ANSWERS TO THE PACKET’S QUESTIONS

1. Separate builder: ACCEPTED.

It keeps the existing GPS builder untouched while implementing the bird-specific rules. Both input pins, reference identity, validation before filtering, timestamp checks and expected counts are present. The real-input rebuild confirms this candidate.

2. Withheld-state wording: ACCEPTED.

“Near the tagging site” refers to the documented reference-point omission rule. It does not say the bird was at a colony or nest throughout the hidden span.

The count and first/last withheld-fix times describe recorded omitted fixes, not continuous residence.

3. “Next displayed fix [time]”: ACCEPTED.

This gives a replay destination, not a future position or a reconstructed route. No marker or accuracy is shown before that displayed fix arrives.

4. No gap sentence before a withheld period: ACCEPTED.

The later withheld-state message explains the omission. Claiming that no source position existed across that interval would be wrong.

A failed attempt in an otherwise visible interval keeps its distinct wording.

5. Larger fix marks: ACCEPTED for this preview.

The visible explanation says their size does not show uncertainty. They must not be presented as accuracy circles. The tag’s numerical estimate remains associated with its own displayed fix.

6. Inferable omission disc: ACKNOWLEDGED; not a new hold.

This follows from the agreed D2-A design and the permitted coarse reference point.

The implementation does not establish a protection guarantee. Public-release sensitivity review remains separate and must not cite this pass as establishing safety.

ADDITIONAL REPLAY CLARIFICATIONS

The failed-attempt time outside a stored period but inside its extended hidden span can remain in failed_t: withholding correctly takes precedence in the replay text.

The omitted attempt inside the stored period remains count-only.

The half-open hidden span and the inclusive trailing-record case are correctly represented by the reader logic.

LIMITS

GPT did NOT independently rerun:
- the supplied 277-check Playwright suite;
- its 51 deliberate breaks;
- the older page suites.

The local environment lacks playwright, pngjs and the packaged globe library used by that harness. Those totals remain Claude’s reported evidence.

GPT’s direct Chrome checks and local reader sweep are additional, bounded evidence, not a claim that the complete browser suite was independently rerun.

This is not a real-phone, Safari, screen-reader, performance or hardware graphics-context-loss pass.

It is not public sensitivity or rights clearance for the older animals.

Sources-page and REGISTER work, existing release corrections and the eventual release decision remain open.

No inbox was checked. No message was sent. Nothing was merged or deployed. The Earth from Space probe was untouched.

NEXT STATE

Stage 2’s private-preview candidate review is CLOSED: PASS.

The branch can remain the current combined Animals preview.

Further authorized proposal work — dated penguin chart, then corridor — can proceed without treating this pass as approval to publish Animals.

Please file this as the Stage 2 GPT review for ec19905.
