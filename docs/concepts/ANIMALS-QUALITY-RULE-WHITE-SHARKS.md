# Animals — quality-rule proposal: white sharks tagged on the South African coast

19 Nov 2026 · rev 2, 09:16 UTC (clock reading), after GPT's review of rev 1 (changes in §10) · documents only. Nothing built, no provider contacted, nothing spent. **Nothing in this document is decided. It proposes provisional policies for a private preview and marks each as Chad's or GPT's to accept or change.**

**Chad's line (19 Nov):** "Go: quality-rule proposals for false killer whale 98364 and the white sharks, documents only, for GPT review".

Rests on: `docs/research/animals-source-audit/WHITE-SHARKS-SA.md` rev 1.1 and `PAPER-AND-QC-READ.md` rev 1.1. Every count is from `quality_rule_effects.py` rev 2 on the pinned file (Zenodo 10.5281/zenodo.5575189, sha256 `156b1ee2…029d`); full output `quality-rule-effects-2026-11-19.json`; algorithm behaviour pinned by `quality_rule_effects.test.py` (19 checks, all pass).

**Summary.** A speed limit alone does not make these tracks safe to draw: the tags are silent for days to months, and a speed test does little for a position that stands alone in time. The proposal is one animal first, a speed-consistency rule, an isolation policy, a join limit and a land rule, with the complete effect of all of them counted for that animal.

## 1. Sources read for this proposal
| Source | What it gives | How read |
|---|---|---|
| **Queiroz et al. 2019**, "Global spatial risk assessment of sharks under the footprint of fisheries", *Nature*, doi `10.1038/s41586-019-1444-4`, Methods, "Track processing" | For Argos tags: class Z discarded; classes 3, 2, 1, 0, A and B "analysed point-to-point" with a 3 m/s speed filter to remove outliers; a continuous-time correlated random walk then gives one position a day. Tracks with gaps over 20 days are split before interpolation (stated under spatial density analysis). **How the filter chooses which position to remove is not stated.** | Copy of the article PDF at `sharkresearch.earth.miami.edu/wp-content/uploads/2019/08/Queiroz-etal_GlobalSharkRisksFromFisheries_Nature2019.pdf`, through the web-fetch tool (an extract of the first 100,000 of 103,286 characters; it prints "Accepted: 10 July 2019", no volume or pages). To be checked line by line before adoption. |
| **Queiroz et al. 2016**, *PNAS*, doi `10.1073/pnas.1510090113`, Supporting Information §1.2.2 and §1.3 | The same wording: Z removed; remaining raw positions analysed point-to-point with a 3 m/s speed filter; rejection method not stated; 20-day gap rule in §1.3 | `repository.library.noaa.gov/view/noaa/24375/noaa_24375_DS2.pdf`, same tool. **Rev 1 attributed this PDF to the 2019 paper. That was wrong:** GPT identified it as the 2016 PNAS supplement. The identification is GPT's; the extract read here did not print the journal. |
| Kock et al. 2022 | As in `PAPER-AND-QC-READ.md` §3: 3 m/s "following Queiroz et al., 2019" | — |

**Consequence:** the 3 m/s limit is supported as the authors' filter parameter. The rejection algorithm is not published in what was read, so any algorithm here is Mother Earth's own. There is no requirement to run a published filter because of that; the algorithm's limitations, complete effects and display claims must be explicit.

## 2. The three candidate algorithms
As defined in the script header and pinned by the tests; the same text as the false killer whale proposal §3. In short:
- **A "forward":** rejects a row too fast from the last kept row. Cascades after a wrong kept row; never tests the first row.
- **B "two fast legs":** rejects a row whose step in and step out are both too fast, one at a time. Not only out-and-back: it also removes the middle of steady fast movement. Leaves single fast steps in.
- **C "anchored": an experimental Mother Earth heuristic.** Classes 3, 2 and 1 are filtered first by A among themselves; other rows are kept only if within the limit of the nearest earlier kept row and the nearest later anchor.
  - It does **not** guarantee the better-rated fix of a pair is kept. Within the anchor classes and within the others, the choice is chronological (an earlier class 1 can reject a later class 3; an earlier B, once kept, can reject a later class 0).
  - It inherits A's first-anchor and cascade weaknesses. **Anchor-class rows rejected in step 1 are never reconsidered.**
  - After C no step between kept neighbours exceeds the limit: consistency between kept fixes, not evidence that any position is accurate.

## 3. All 34 sharks at 3 m/s
19,278 rows, 19,244 steps; 3,442 steps exceed 3 m/s; every shark has some.

| Algorithm | Rows kept | Removed | Longest run removed | Steps still over 3 m/s | Temporally isolated at 72 h |
|---|---|---|---|---|---|
| none | 19,278 | 0 | 0 | 3,442 | 142 |
| A | 14,741 | 4,537 | 87 | 0 | 180 |
| B | 18,788 | 490 | 6 | 2,797 | 143 |
| C, anchors 3, 2, 1 | 15,316 | 3,962 | 20 | 0 | 172 |

Complete non-land pipeline on all sharks (C, then the 72-hour isolation exclusion, join at 12 hours):
| | |
|---|---|
| Removed by C | 3,962 |
| Removed as temporally isolated | 172 |
| Fixes left | **15,144** in 34 tracks, 15,110 consecutive steps |
| Steps joined / not joined at 12 h | 11,584 / 3,526 |
| Extent of everything left | **8.1°E to 74.4°E** (rev 1's 27.5°W and 80.2°E rows are isolated fixes and are gone) |
| Rows newly isolated by the removal | 0 |
| Sharks left under 25 fixes | 0 |

- Fixes far from southern Africa remain (to 74.4°E). The paper reports sharks reaching Mozambique, Madagascar and the high seas, so some are real; this file cannot say which.
- **No land stage was run on the 34-shark totals.** They are context for the one-animal proposal, not a proposal for all sharks.

## 4. The complete proposed pipeline for tag 118845
Chosen first because all 1,004 of its rows, filtered or not, lie between 23.2°S and 35.5°S, 18.8°E and 36.1°E: the South African coast to southern Mozambique, a range the paper reports. Eight sharks have at least 500 fixes left and stay inside 10°E to 45°E after the pipeline (tags 117464, 117471, 117472, 117474, 117480, 118845, 118859, 118864).

| Stage | Rows in | Removed | Rows out |
|---|---|---|---|
| 0. Rows for this tag | | | 1,004 |
| 1. C, anchors 3, 2, 1, limit 3 m/s (longest run removed 5) | 1,004 | 208 | 796 |
| 2. Temporally isolated under the 72-hour policy | 796 | 1 | **795** |
| 3. **PROVISIONAL** fixes on land in the pinned dataset | 795 | 40 | **755** |

**After stages 1 and 2 (no land stage)**
| | |
|---|---|
| Fixes | 795; classes 3 / 2 / 1 / 0 / A / B: 28 / 81 / 92 / 30 / 112 / 452 |
| Period | 9 May 2012 23:24:04 UTC to 29 Sep 2013 05:02:41 UTC, 507.2 days |
| Extent | 23.2°S to 35.5°S, 18.8°E to 36.1°E |
| Consecutive steps | **794** (rev 1 said 795); none over 3 m/s; fastest 2.97 m/s |
| Median / longest gap | 2.7 h / 4,519.5 h (188 days) |
| Rows newly isolated by stage 2 | 0 |

| Join limit | Steps joined | Not joined | Share of the 507 days inside joined steps |
|---|---|---|---|
| 6 h | 537 | 257 | 9% |
| **12 h (proposed, provisional)** | **654** | **140** | **17%** |
| 24 h | 747 | 47 | 31% |

**Land, PROVISIONAL.** Data: Natural Earth 1:10m land polygons, `ne_10m_land.geojson`, sha256 `1ac90796…7416`, from `github.com/nvkelso/natural-earth-vector` at commit `ca96624a`. A fix is "on land" if it lies inside a polygon. A step's line is the WGS84 geodesic between its two fixes, sampled at points no more than 1 km apart and tested as a polyline against the same polygons.
| | |
|---|---|
| Fixes on land (of 795) | **40**: 39 class B, 1 class A; none of classes 3, 2, 1 or 0 |
| Distance inland | median 4.9 km; 32 over 1 km; 19 over 5 km; 7 over 20 km; furthest 68.7 km |
| Joined steps (12 h) with an end on land | 38 |
| Joined steps (12 h) crossing land with both ends at sea | 2 |

**If fixes on land are not drawn and crossings are not joined (stage 3 plus the line rule), PROVISIONAL**
| | |
|---|---|
| Fixes | 755; classes 28 / 81 / 92 / 30 / 111 / 413 |
| Period and extent | unchanged |
| Consecutive steps | 754; none over 3 m/s |
| Steps within 12 h | 618 |
| …refused because the line crosses land in the dataset | 2 |
| **Steps joined** | **616**; 138 not joined |
| Rows newly isolated by the land stage | 0 |

At 6 hours: 517 within the limit, 2 crossings, 515 joined. At 24 hours: 704, 5 crossings, 699 joined.

## 5. The proposals, and their standing
1. **One animal first: tag 118845** (shown by tag number, not the file's given name).
2. **Rejection: C at 3 m/s, anchors 3, 2 and 1**, labelled as Mother Earth's experimental heuristic with the limitations in §2. "The 3 m/s limit is the study authors' filter parameter; the method of choosing which fix to leave out is Mother Earth's."
3. **Temporal isolation: fixes isolated under Mother Earth's 72-hour policy are not drawn.** This is our conservative choice. A speed test still limits how far such a fix can be from its neighbours; across days that limit is hundreds of kilometres wide and does little to make the position credible. 72 hours echoes the authors' segmentation figure but is used here for a different purpose and on our own authority.
4. **Join limit: 12 hours, as a provisional private-preview display policy.** Nothing is claimed for it beyond being a stated choice; the authors' three days is a pre-modelling segmentation limit and is not used for joining. Alternatives 6 h and 24 h are counted in §4.
5. **Land, PROVISIONAL:** fixes inside land in the pinned dataset are not drawn, and a step whose tested line crosses land in that dataset is not joined. The promise is "no fix or line on land **as detected by that dataset and that line test**", not perfect knowledge of the coastline. Alternative: keep fixes within some distance of the coast (32 of the 40 are more than 1 km inland, so a 1 km allowance would restore 8).

**What no speed limit or join limit does:** bound where the shark went between fixes. (Rev 1's "about 65 km either side of the line" is withdrawn.)

## 6. Accuracy wording and credit (proposed)
- The Argos class is shown for the fix under the marker.
- Card: "Positions are Argos satellite fixes. Each carries a quality class. The satellite system's nominal error estimates are under 250 m (class 3), 250–500 m (2), 500–1,500 m (1) and over 1,500 m (0); classes A and B have no estimate. These are nominal estimates, not guaranteed limits: real errors can be larger, and this file gives no error figure per fix. 69% of the fixes shown are class A or B."
  (524 of 755 after the provisional land stage; 564 of 795 before it, 71%.)
- "Recorded Argos fixes after filtering. This is not the study's modelled track." "The line joins fixes no more than 12 hours apart and is not the shark's route. For most of the 507 days there is no line."
- CC BY 4.0: creators as on the record, year, title, Zenodo, DOI, licence link, and a statement of changes naming the stages actually applied.

## 7. Statement of what was done (proposed card text, numbers PROVISIONAL until the land rule is accepted)
"1,004 recorded fixes for this tag. Mother Earth left out 208 under its own speed-consistency rule (3 m/s, the study authors' limit; the rule favours better-rated fixes, is experimental and can remove a correct fix), 1 fix more than 72 hours from any other, and 40 that fall on land in Natural Earth's 1:10m map. 755 are shown. Fixes more than 12 hours apart, and 2 pairs whose joining line would cross land, are not joined."

## 8. Decisions asked for
1. One animal first, tag 118845.
2. C at 3 m/s with anchors 3, 2, 1, as an experimental heuristic; or another rule.
3. The 72-hour temporal-isolation exclusion.
4. Join limit 12 h (or 6 h, 24 h).
5. The land rule and its dataset (§5.5), or a coastal allowance.
6. Accuracy wording and class per fix.

## 9. Not done, not claimed
- No rule is selected. No track is cleared for drawing. Nothing is proposed for the other 33 sharks.
- Both Queiroz sources were read as fetch-tool extracts. McConnell et al. 1992 and the `argosfilter` package were not read; no published filter was run.
- Land was tested against one dataset at one scale, with the line geometry stated; coast detail it lacks is not detected. The globe's own drawn line (a straight chord between fixes in 3-D) is not the identical curve to the tested geodesic; the difference was not measured, and a build would test the geometry it actually draws.
- No check of positions against each shark's tagging date (the file has none). The transmission schedule of these tags is not established.
- Why the archive differs from the paper's raw set remains an inference; the unsent enquiry to the authors would settle it and is Chad's decision.
- Sensitivity (a high-profile species, named coastal sites) still needs its recorded decision before any public display.

## 10. Changes in rev 2 (GPT's review of rev 1, relayed by Chad 19 Nov)
1. **Complete pipeline calculated, in order,** with the isolation exclusion applied before recounting fixes, steps, joins, dates, extent and time shares (§4). 795 fixes have **794** steps; rev 1's 795 was wrong. Land-dependent figures are marked PROVISIONAL throughout.
2. **C described as an experimental heuristic** with its chronological choices, inherited weaknesses and the no-reconsideration rule (§2); adversarial made-up tracks kept in the test file; the invariant stated as consistency only.
3. **B renamed "two fast legs"**, unchanged, with its behaviour on steady fast movement stated and tested.
4. **3 m/s** described as the authors' filter parameter. **12 hours** described as a provisional display policy; the claim about staying inside transmission bouts and the 65 km excursion bound are withdrawn.
5. **"Cannot be checked" renamed** "temporally isolated under Mother Earth's 72-hour policy" and described as our conservative choice.
6. **Shark reference corrected and pinned:** the NOAA-hosted supplement is Queiroz et al. 2016 (PNAS); the 2019 article's Track Processing section was read separately and carries the same 3 m/s wording; both PDFs identified (§1).
7. **Accuracy wording** says nominal estimates, not guaranteed limits. **Land assessed** against a pinned dataset with the tested line geometry stated; the promise is limited to what that mask detects.
