# Timeline finds — unpublished rehearsal review

24 November 2026 · GPT independent reviewer · branch `timeline-finds-rc`, head `db8e40e`; served-code H `7c58664`, tested tree `f7a81dc`; baseline `4358264`.

**Direction accepted; targeted revision required before a release candidate.** Keep L1, use a compact coarse-scale lane rather than shifted marks, and retain the measured 400 ka view / 50 ka minimum. Correct the La Ferrassie follow-up interpretation and the mixed-endpoint validation gap below. No upload, catalogue freeze, hub pin, Animals pin change or page release is cleared.

## 1. Independent work and limits

No Mac rehearsal folder was supplied. Retrieved the public repository at exact head `db8e40e` into a temporary review tree. Read the packet, source data, generator and script changes, both new suites, measurement record and relevant evidence. All **47 manifest entries verify**, with no missing file or mismatch. Manifest SHA256: `0d54bbfa795b96b928299238b2a362042be5791fd4ae276bc9dfd9f642ea0d5e`.

Independently ran `timeline-finds-build`: **62 passed, 0 failed**. All **six supplied build breaks independently exited 1 with named check failures**. The clean run reproduced the rehearsal catalogue at 47,053 bytes, SHA256 `9127435a50629c38b8698f68581d2480ee720a55c7fe0771711d23ab10359637`, and confirmed R3 regeneration remains byte-identical. Inspected the supplied desktop landing, phone 400 ka, phone 50 ka and phone Omo panel screenshots. These are Claude's captured renders, not a new independent browser session. The 171-check browser result, rendered measurements, browser breaks and older browser-suite runs remain Claude's evidence.

Independently reproduced the mixed-endpoint issue in both the real generator and the page's actual `findsBad` function, with minimal DOM text stubs for its note/attribution checks. This was code execution, not a live-browser test.

Also reached the 2023 paper's publisher full-text PDF through web retrieval and read the relevant introduction, dating/model discussion, Figure 9 caption and implications/conclusion passages. It was not merely an abstract read. HAL returned an access-denied page; it was not bypassed. Direct PDF-byte retrieval and screenshot rendering timed out, so I do not claim a new saved PDF hash or visual inspection of the figure. Text conclusions below are grounded in the publisher full text, not an invented local PDF.

## 2. Answers to the five questions

### Q1 — L1

**Retain L1.** In the supplied 400 ka phone screenshot, the dashed layer band, central tick and open older-pointing chevron are distinguishable from the capped brackets. The caption and Omo panel explicitly assign the uncertainty to the dated layer. The legend explains the symbols. This is an acceptable basis for the next rehearsal revision; no switch to L2 is needed now.

At the narrow view, the offscreen layer wording does not claim Omo is absent. Preserve that distinction. Keep the full uncertainty/datum in the accessible name and adjacent words, not colour alone. Check actual focus visibility and clipped-band/chevron treatment after the layout change; reading role/name attributes is not proof of visible focus.

### Q2 — landing view

**Choose the compact “too recent to resolve at this scale” treatment, not a coordinate nudge.** At 538.8 Ma, moving a glyph seven pixels could imply several million years of displacement. Enlarged symbols are already schematic, but shifting their anchor adds unnecessary positional ambiguity.

For this bounded slice, use a documented coarse-mode threshold: **window span greater than 2 Ma**. At exactly 2 Ma and below, show the four independent sub-rows. Above it, show the lane heading, its essential evidence caveat, one brief explanation and the **Last 400,000 years** button instead of four edge-clipped glyph rows. Keep the full entry/list links available outside the hidden drawing rows. This also reduces the otherwise permanent 212/308 px height cost on the landing view.

This is display detail, not disappearance of data: retain stable entry ids, no-JavaScript content, change-record links and direct links. Selecting a find from a list or deep link should bring its finite reference into the focused view as the current code already intends. If a focused control would be removed when crossing the threshold, move focus deliberately to a persistent control. Test both directions across the threshold, resizing, Back/Forward and selection restoration. Phrase suppression as “not resolved at this scale,” never “no finds in this period.”

### Q3 — measured B4

**Accept 400,000 years as the lane preset and 50,000 years as the minimum window.** The supplied measurements support those choices. The 6.4 px calibrated range is geometrically distinguishable from a point at phone width, while its separate 44 × 32 px link remains operable. Neither glyph width nor target size establishes real-phone usability, source precision or screen-reader clarity.

Keep the small-range caption, the distinct calibrated glyph and the full textual interval. A 50 ka window is an interface limit, not a dating-resolution statement. The leftmost tick clipping in the supplied 400 ka phone screenshot needs correction before an RC: align/inset its text without shifting the actual tick coordinate. Check the first/last labels at 390 px and desktop, including the unit and the 2 Ma unit-switch boundary. Do not leave a partly cut label merely because a previous view might also have done so.

### Q4 — La Ferrassie after the full-text check

**Keep the fragment in the rehearsal and allow it to progress toward the release claim set after the following source/text correction. It need not be dropped solely for this paper.**

Guérin et al. 2023 does not replace the fragment's direct range with 44.9–44.1 ka. That interval is the overlap of three individuals' intervals. Its LF8 model gives 44.9–39.9 ka (95% credibility), while retaining the direct fragment date as an alternative if the fragment belongs to LF8. It explicitly says that anatomical assignment is unproven. Relevant locators: p.99 introduction; p.106 comparison; p.115 Figure 9 caption and implications; p.116 conclusion. Source: [publisher full text](https://paleoanthropology.org/ojs/index.php/paleo/article/download/811/979/2562), DOI 10.48738/2023.iss1.811.

Correct packet §8, the source-check record and the provisional entry context accordingly. Add the later source and retain the dated object as the fragment; avoid implying an independently established child identity or using the shared-overlap interval as its date. Review the resulting wording before freezing it. No new group-lifespan or contemporaneity mark is needed. The specific “later paper unread” access dependency is closed by GPT's relevant full-text passage check; full source audit/claim freeze remains later work. Do not send E4 in its current inaccessible-paper form without updating it to the new state. It remains unsent.

### Q5 — remaining validation and controls

**One concrete validation gap must close before an RC: the purported mixed-endpoint control does not test the promised failure.** It changes calibrated units to uncalibrated ones. That proves a units guard, not protection against combining two same-unit published results.

Independent reproduction, starting from the unchanged rehearsal:

```js
// Only the younger endpoint is taken from the other published calculation.
laFerrassieAxis.when.to_ma = 0.040827;
laFerrassieAxis.source_values.to = 40.827;
// Leave source_notation, prose, selected source/result and older endpoint unchanged.
```

The generator **exits 0** and emits:

```text
when_text: 41,700 to 40,827 calibrated years before 1950 (95.4 % range)
source_notation: 41.7–40.8 ka cal BP (95.4%)
claim prose: ...between 41,700 and 40,800 years before 1950...
```

The page's `findsBad` also **returns null** for those bytes: accepted. Generated mutated catalogue SHA256 `92442dff4ef276004197af57f0575ddc905c2f01813e75edc22050999aaa6e8e`.

Require a single identified, reviewed published result for this entry, with its original numeric endpoints/precision, confidence and datum retained coherently. A consistency check must cover that selected result rather than only comparing two editable copies of the same numbers. Reject the reproduction in generator and browser validation; make it a named permanent regression/control. Do not solve this by changing the source notation/prose to bless a newly mixed result. Validators cannot verify a paper's truth on their own; exact result identity and source review are the evidence boundary.

Other targeted checks for the next revision:

- Add the compact/coarse lane and first-tick cases described above. Ensure an actually visible focus outline and test it on each find, including the Omo chevron and short calibrated glyph at both widths; this was not visually verified in the supplied evidence.
- Test device-clock independence by generating/rendering the same fixed claim at two widely separated clocks and comparing numeric geometry/text, rather than describing enforcement of `datum_ce: 1950` as the same experiment. The existing static inspection is useful but narrower.
- Preserve validation and source attribution for all retained entries when going from four to three finds if any later selection changes. Do not assume an exact-four assertion is the product rule when the source policy has no quota.
- The rehearsal change-record sentence is reasonable for testing, but its final entry count, lane status/name, new revision and exact reader wording need review with the release data. This lane was previously planned/empty; avoid implying a taxonomic lifespan database was added.

## 3. Next step and boundaries

Revise on the same rehearsal branch: compact coarse-scale treatment, tick/focus verification, corrected La Ferrassie record/text and the real mixed-endpoint consistency control. Supply new screenshots/measurements and focused test/break evidence, then return for recheck. This is not a request for a production smoke test or a hub build.

After the rehearsal is accepted, the RC still needs final source locators/status and result identity, the exact catalogue revision/date/bytes, final change-record wording, REGISTER rows, the release-only Animals `TL_MAIN` maintenance, reviewed hub pin and the usual upload/read-back → hub → page order. `BASE_MAIN` must not move. Coordinate on fresh main with the separate Nature context/`NC_MAIN` work; retain its accepted changes rather than using an old branch as a release base.

Real phone, Safari, screen reader and true 200% zoom remain open. No message was sent, no repository code was edited, and no release/account action was taken by GPT.

## 4. Reviewed code identities

| File | SHA256 |
|---|---|
| `timeline.js` | `6ecc7ca68a7966ec8ee14f55a2e9c97a483ed9a47fcb24a022181d9848e746d6` |
| `timeline.html` | `09e85dd5ac7e4aff2abc234038dc6664516a8c7ef94987a43c064f63fd5c6d3f` |
| `style.css` | `4500c7aa3cf7db8bf90240eaa30e4dbbc5da41fd76e3f85f3367dc583ad5f28f` |
| `phase1/timeline/build_timeline.py` | `d5968c6dc3c7b4450b98d4dfb745a15c29372ab6bc3d8cf8d72a002d0bb55ab1` |

R3 catalogue remains `f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993`; the Worker remains the recorded hub 0.6.24 identity. These are repository/evidence checks, not a new live read-back.
