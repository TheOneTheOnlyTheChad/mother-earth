# Animals — quality-rule proposal: false killer whale, tag ptt 98364

19 Nov 2026 · rev 2, 09:16 UTC (clock reading), after GPT's review of rev 1 (changes in §11) · documents only. Nothing built, no provider contacted, nothing spent. **Nothing in this document is decided. It proposes provisional policies for a private preview and marks each as Chad's or GPT's to accept or change.**

**Chad's line (19 Nov):** "Go: quality-rule proposals for false killer whale 98364 and the white sharks, documents only, for GPT review".

Rests on: `docs/research/animals-source-audit/FALSE-KILLER-WHALE-98364.md` rev 1.1 and `PAPER-AND-QC-READ.md` rev 1.1. Every count is from `quality_rule_effects.py` rev 2 run on the pinned file (sha256 `9896550e…d3f6`); full output `quality-rule-effects-2026-11-19.json`; behaviour of each algorithm pinned by `quality_rule_effects.test.py` (19 made-up-track checks, all pass).

## 1. What a rule has to settle
1. Which rows are candidates.
2. Whether further rows are rejected, by what exact algorithm, at what limit.
3. Whether temporally isolated fixes are drawn.
4. When consecutive fixes are joined.
5. What is said about accuracy.
6. Land.

Sensitivity and public release are outside this document and still need their recorded decision.

## 2. Sources read for this proposal
| Source | What it gives | How read |
|---|---|---|
| Baird et al. 2011, "Movements and spatial use of false killer whales in Hawai‘i: satellite tagging studies in 2009" (Cascadia Research report), `cascadiaresearch.org/files/CRCHawaiiPseudorcaSpatialUse2011.pdf` | The tagging group's filter settings for this species: Douglas Argos-Filter 7.08, classes 3 and 2 always kept, maximum rate of movement 20 km/h (stated as based on the fastest travel speeds they observed in fast-travelling false killer whales in Hawai‘i), maximum redundant distance 3 km, rate coefficient 25 | PDF through the web-fetch tool (an extract). To be checked line by line before adoption. It describes 2009 deployments. **The transmission schedule of tag 98364 is not established.** |
| Movebank's description of the Douglas Argos Filter | Meaning of that filter's parameters | Web page, same tool |
| Argos class meanings | In the file's attributes and on ATN's modelling page: nominal estimates of under 250 m (class 3), 250 to 500 m (2), 500 to 1,500 m (1), over 1,500 m (0); none for A and B; Z an invalid fix | File attributes; web pages |

**Status of the 20 km/h figure:** a sourced candidate parameter. It is not the Douglas filter (which combines it with other tests), and it is not a proven biological ceiling on the species' speed.

## 3. The three candidate algorithms
All three are Mother Earth's own. Full definitions (order, which row goes, iteration, endpoints, stopping) are in the script header; their behaviour, including the weaknesses below, is pinned by the test file.
- **A "forward":** one pass in time order; a row is rejected if the speed from the last kept row exceeds the limit. **Weakness:** a wrong kept row, including a wrong first row, causes correct rows after it to be rejected (cascade).
- **B "two fast legs":** a row is rejected when the step into it and the step out of it both exceed the limit; one row at a time until none qualifies; endpoints never rejected. **It is not only an out-and-back test:** it also removes the middle rows of steady fast movement in one direction. Fast steps with one fast leg are left in.
- **C "anchored": an experimental Mother Earth heuristic.** It gives the better Argos classes precedence. **It does not guarantee that the better-rated fix of a conflicting pair is the one kept.**
  - Step 1 applies A to the anchor-class rows alone. So within the anchor classes the choice is chronological: an earlier class-2 anchor can reject a later class-3 fix. Step 1 has A's first-anchor and cascade weaknesses.
  - **Anchor-class rows rejected in step 1 are never reconsidered.**
  - Step 2 walks the other rows in time order; each is kept if within the limit of the nearest earlier kept row and of the nearest later anchor. Among non-anchors the choice is again chronological: an earlier class B fix, once kept, can reject a later class 0 fix.
  - After C no step between kept neighbours exceeds the limit. **That is consistency between kept fixes. It does not establish that any position is accurate.**

## 4. The complete proposed pipeline, stage by stage
| Stage | Rows in | Removed | Rows out |
|---|---|---|---|
| 0. File | | | 824 |
| 1. Tagging row (type "User") left out | 824 | 1 | 823 |
| 2. Rows not passing the source's time, location and speed checks | 823 | 129 | 694 |
| 3. Argos class Z (the satellite system's "invalid fix") | 694 | 1 | **693** |
| 4. C, anchors on classes 3 and 2, limit 20 km/h | 693 | 30 | 663 |
| 5. Temporally isolated under Mother Earth's 72-hour policy | 663 | 2 | **661** |

- Stage 3 and stage 4 are counted separately: one row leaves as class Z, then C removes 30 others. (Rev 1 ran C on 694 rows and reported 31, which included the Z row.)
- Stage 4: longest run of consecutive removed rows 2. Before stage 4, 31 of 692 steps exceed 20 km/h; after it, none (fastest kept step 5.31 m/s).
- Stage 5 removes two fixes, and the last fix in the file is one of them: the final ten days hold fixes that are each more than 72 hours from any other kept fix. **The drawn record would then end 12 Feb 2014, not 22 Feb.** No row becomes newly isolated by the removal.

**Result after all stages**
| | With stage 5 (proposed) | Without stage 5 |
|---|---|---|
| Fixes | 661 | 663 |
| Classes 3 / 2 / 1 / 0 / A / B | 14 / 101 / 189 / 119 / 121 / 117 | 14 / 101 / 189 / 119 / 121 / 119 |
| First fix | 23 Oct 2013 03:02:00 UTC | same |
| Last fix | 12 Feb 2014 14:51:34 UTC | 22 Feb 2014 15:28:47 UTC |
| Extent | 17.3°N to 24.6°N, 157.4°W to 137.9°W | same |
| Consecutive steps | 660 | 662 |
| Median / longest gap | 1.7 h / 109.0 h | 1.7 h / 125.5 h |
| Steps over 20 km/h | 0 | 0 |

**Joining, on the 661-fix set**
| Join limit | Steps joined | Not joined | Share of first-to-last time inside joined steps |
|---|---|---|---|
| 3 h | 417 | 243 | 17% |
| **6 h (proposed, provisional)** | **554** | **106** | **39%** |
| 10 h | 632 | 28 | 60% |

**Land (provisional: Natural Earth 1:10m land, pinned in the script):** 0 of 661 fixes on land; 0 of the joined steps cross land at any of the three join limits. Islands and coast detail absent from that dataset are not detected.

## 5. Alternatives counted
| Limit | Algorithm on the 693 rows | Kept | Removed | Longest run | Steps still over the limit |
|---|---|---|---|---|---|
| 20 km/h | none | 693 | 0 | 0 | 31 |
| | A | 663 | 30 | 2 | 0 |
| | B | 691 | 2 | 1 | 27 |
| | C, anchors 3, 2 | 663 | 30 | 2 | 0 |
| | C, anchors 3, 2, 1 | 664 | 29 | 1 | 0 |
| 10 m/s (source's fail limit) | none | 693 | 0 | 0 | 2 |
| | A | 691 | 2 | 1 | 0 |
| | B | 693 | 0 | 0 | 2 |
| | C, anchors 3, 2 | 691 | 2 | 1 | 0 |

- A and C remove the same number at 20 km/h but not the same rows (the class counts differ). C at 10 m/s followed by stage 5 gives 689 fixes.
- B leaves 27 steps over 20 km/h on the map.

## 6. The proposals, and their standing
1. **Candidate rows: PASS minus class Z (693).** PASS is described as "passed the data centre's time, location and speed checks", never as accuracy.
2. **Rejection: C, anchors 3 and 2, at 20 km/h**, labelled as Mother Earth's experimental heuristic with the limitations in §3. Alternative: C at the source's own 10 m/s (2 rows), which adds no species parameter.
3. **Temporal isolation: fixes isolated under the 72-hour policy are not drawn** (2 fixes; the record ends 10 days earlier). This is a conservative choice of ours. A speed test still limits how far such a fix can be from its neighbours; over days that limit is too wide to do much for the position's credibility. Alternative: keep them (663 fixes).
4. **Join limit: 6 hours, as a provisional private-preview display policy.** It is about three and a half times the median gap, the proportion used for the zebra. Nothing more is claimed for it. Alternatives 3 h and 10 h, counted above.
5. **Tagging row left out** of the track; the card gives the deployment start as the file states it and notes that the tagging row's time disagrees by eight hours.

**What no speed limit or join limit does:** bound where the animal went between fixes. A limit used for filtering says which pairs of fixes are mutually plausible; the unseen route is not constrained by it.

## 7. Accuracy wording (proposed)
- The Argos class is shown for the fix under the marker.
- Card: "Positions are Argos satellite fixes. Each carries a quality class. The satellite system's nominal error estimates are under 250 m (class 3), 250–500 m (2), 500–1,500 m (1) and over 1,500 m (0); classes A and B have no estimate. These are nominal estimates, not guaranteed limits: real errors can be larger. 54% of the fixes shown are classes 0, A or B."
  (357 of 661.)
- "The line joins recorded fixes that are no more than 6 hours apart. It is not the whale's route."
- Error radius is supplied for 6% of the file's rows; not proposed for display in a first preview, and said so.

## 8. Statement of what was done (proposed card text)
"Shown: Argos fixes that passed the data centre's time, location and speed checks. Mother Earth then left out 1 fix the satellite system marks invalid, 30 fixes under its own speed-consistency rule (20 km/h, favouring better-rated fixes; an experimental rule that can remove a correct fix), and 2 fixes more than 72 hours from any other. Fixes more than 6 hours apart are not joined."

## 9. Decisions asked for
1. Candidate rows (§6.1).
2. Rejection rule and limit (§6.2).
3. Temporal isolation at 72 hours, or not (§6.3).
4. Join limit (§6.4).
5. Accuracy wording and class per fix (§7).

## 10. Not done, not claimed
- No rule is selected. No track is cleared for drawing. One deployment only; the other 26 are untouched.
- The 20 km/h source was read as an extract and concerns 2009 deployments.
- The Douglas Argos Filter was not run; no published filter was run.
- The tag's transmission schedule is unknown; no claim is made about transmission bouts or daily silent periods.
- Land results depend on one dataset at one scale.
- Sensitivity: small, island-associated populations are the subject of the tagging project; their conservation and legal status were not looked up; the authors' request for contact stands as Chad's choice.

## 11. Changes in rev 2 (GPT's review of rev 1, relayed by Chad 19 Nov)
1. **Complete pipeline calculated from the 693-row set, by stage** (§4). The Z row is no longer double-counted: 1 as class Z, then 30 by C.
2. **C described as an experimental heuristic** with its chronological choices, its inherited first-anchor and cascade weaknesses, and the rule that rejected anchor-class rows are never reconsidered (§3). Made-up tracks covering each are kept in `quality_rule_effects.test.py`; the invariant test is stated as consistency, not accuracy.
3. **B renamed "two fast legs"**; the algorithm is unchanged and its removal of the middle of steady fast movement is stated and tested.
4. **20 km/h** described as a sourced candidate parameter only. **6 hours** described as a provisional display policy; the claim that it stays inside transmission bouts or never crosses the daily silence is withdrawn (schedule unverified). The sentence bounding the whale's distance from a chord is withdrawn.
5. **"Cannot be checked" renamed** "temporally isolated under Mother Earth's 72-hour policy", applied here as a stage, with the effect on the end date shown.
6. **Accuracy wording** now says nominal estimates, not guaranteed limits.
7. **Land** assessed against a pinned dataset: none found; stated as provisional.
