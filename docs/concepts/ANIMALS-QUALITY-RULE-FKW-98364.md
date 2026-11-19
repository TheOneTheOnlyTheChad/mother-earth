# Animals — quality-rule proposal: false killer whale, tag ptt 98364

19 Nov 2026 08:58 UTC (clock reading) · rev 1 · for GPT review · documents only. Nothing built, no provider contacted, nothing spent. **Nothing in this document is decided; it proposes, and marks each choice as Chad's or GPT's to accept or change.**

**Chad's line (19 Nov):** "Go: quality-rule proposals for false killer whale 98364 and the white sharks, documents only, for GPT review".

Rests on: `docs/research/animals-source-audit/FALSE-KILLER-WHALE-98364.md` rev 1.1 and `PAPER-AND-QC-READ.md` rev 1.1 (GPT: pass for research). Every count below is from `quality_rule_effects.py` run on the pinned file (sha256 `9896550e…d3f6`); the full output is `quality-rule-effects-2026-11-19.json` beside the audits. The script defines each candidate algorithm in full and refuses any other input.

## 1. What a rule has to settle
Five separate questions. A choice on one does not settle another.
1. Which rows are candidates at all.
2. Whether any further row is rejected, by what exact algorithm, at what speed limit.
3. When two consecutive kept fixes are joined by a line.
4. What is said about accuracy.
5. What happens to the tagging row.

Sensitivity and public release are outside this document and still need their recorded decision.

## 2. New reading for this proposal
| Source | What it gives | How read |
|---|---|---|
| Baird et al. 2011, "Movements and spatial use of false killer whales in Hawai‘i: satellite tagging studies in 2009" (Cascadia Research report to NOAA PIFSC) | The tagging group's own filter settings for this species: Douglas Argos-Filter 7.08, classes 3 and 2 always kept, **maximum rate of movement 20 km/h, stated as based on the fastest travel speeds they observed in fast-travelling false killer whales in Hawai‘i**, maximum redundant distance 3 km, rate coefficient 25. Tags of this family transmitted about 9 to 10 hours a day in blocks, then every second day, later every fifth. | Report PDF through the web-fetch tool (an extract). **To be checked line by line before adoption.** It describes 2009 deployments, not this 2013 one; whether 98364 used the same schedule is not established. |
| Movebank's description of the Douglas Argos Filter | What the filter's parameters mean. It does not state which point of a triplet is rejected. | Web page, same tool |
| Argos class meanings | In the file's own attributes and on ATN's modelling page: class 3 under 250 m, 2 250 to 500 m, 1 500 to 1,500 m, 0 over 1,500 m; A and B carry no estimate; Z is an invalid fix. Independent tests report larger real errors than these nominal figures. | File attributes (audit); web pages |

- 20 km/h is 5.56 m/s. In the tagging group's filter it works together with other tests and with classes 3 and 2 always kept. Used alone as a speed cut it is not the same filter. It is a species-specific, citable limit from the people who deployed this tag; that is all that is claimed for it.

## 3. Question 1: which rows are candidates
| Set | Rows |
|---|---|
| All rows | 824 |
| Tagging row (type "User") | 1 |
| Argos rows | 823 |
| Argos rows passing the source's time, location and speed checks (roll-up PASS) | 694 |
| …of which class Z | **1** |

**Proposed:** Argos rows with roll-up PASS, **minus class Z**: 693 rows.
- PASS is described on screen as "passed the data centre's time, location and speed checks". It is not a statement of accuracy.
- The one class Z row passes the source's checks, but Argos itself labels Z an invalid fix and ATN's own modelling page lists it as invalid. Dropping it is a rule of ours and would be stated.
- Not proposed: starting from all 823 Argos rows and replacing the source's test with ours. The source's flags are documented and reproduced (824 of 824); using them keeps the rule traceable. The counts for that route are in the JSON.

## 4. Question 2: further rejection
Among the 694 PASS rows, steps between neighbouring rows exceed the source's own limits because the source tested before any row was removed: 2 steps over 10 m/s, 3 over 8 m/s, **32 over 20 km/h**.

Three candidate algorithms, each fully specified in the script header (order, which row is rejected, iteration, endpoints, stopping):
- **A "forward":** one pass in time order; a row is rejected if the speed from the last kept row exceeds the limit. First row never tested.
- **B "spike":** a row is rejected only if the steps both into and out of it exceed the limit; repeated one row at a time until no such row remains. Endpoints never rejected. Lone fast pairs are left in and reported.
- **C "anchored":** rows of the better classes are filtered first (A among themselves) and become anchors; any other row is kept only if it is within the limit of the nearest earlier kept row and of the nearest later anchor. One pass.

Effects on the 694 PASS rows:
| Limit | Algorithm | Rows kept | Rejected | Longest run of rejected rows | Steps still over the limit | Fastest kept step |
|---|---|---|---|---|---|---|
| 10 m/s (source's fail limit) | none | 694 | 0 | 0 | 2 | 13.86 m/s |
| | A | 692 | 2 | 1 | 0 | 8.78 |
| | B | 694 | 0 | 0 | 2 | 13.86 |
| | C, anchors 3 and 2 | 692 | 2 | 1 | 0 | 8.78 |
| 20 km/h (tagging group's limit) | none | 694 | 0 | 0 | 32 | 13.86 |
| | A | 663 | 31 | 2 | 0 | 5.41 |
| | B | 692 | 2 | 1 | 28 | 11.46 |
| | C, anchors 3 and 2 | 663 | 31 | 2 | 0 | 5.31 |
| | C, anchors 3, 2 and 1 | 664 | 30 | 1 | 0 | 5.31 |

What the table shows:
- **B barely acts.** The fast steps here are almost all lone pairs, not out-and-back spikes. B is honest about not knowing which row is wrong, and leaves 28 steps over 20 km/h on the map.
- **A and C agree closely** on this file (31 rejected either way at 20 km/h), with short runs. No cascade: the longest run of rejected rows is 2.
- With anchors on classes 3 and 2, C at 20 km/h happens to remove the class Z row as well (classes kept: 14 / 101 / 189 / 119 / 121 / 119 for 3 / 2 / 1 / 0 / A / B).

**Proposed for review: C, anchors on classes 3 and 2, limit 20 km/h.** Reasons: it prefers the positions Argos rates best when a fast pair must lose one row, which is the same preference the tagging group's filter expresses; it is one pass with defined endpoints; and the limit has a species source. It rejects 31 of 694 rows (4.5%).
- **Alternative if the 20 km/h source is not accepted after a line-by-line read:** C at the source's 10 m/s (2 rows rejected). That adds no species claim: it only re-applies the source's own limit to kept neighbours.
- **What no option here does:** identify which row of a fast pair is truly wrong. C makes a stated, class-based choice. That would be said on the card.
- Rows no speed test can check (kept neighbours more than 24 hours away on both existing sides): 2.

## 5. Question 3: joining fixes
Gaps between kept neighbours (proposed set, 663 rows, 662 steps): median 1.7 h, longest 125.5 h.

| Join limit | Steps not joined | Share of the four months that lies inside joined steps |
|---|---|---|
| 3 h | 245 | 16% |
| 6 h | 108 | 36% |
| 10 h | 30 | 55% |
| 12 h | 25 | 57% |
| 24 h | 22 | 59% |
| 72 h | 7 | 74% |

- These are counts, not a recommendation by themselves. The zebra rule (3 hours) was three times a one-hour schedule. This tag has no fixed fix interval: positions arrive when the whale surfaces during a satellite pass inside the tag's transmission blocks.
- A straight line across a gap claims nothing about the route, but it reads as one. At 20 km/h a whale can be 200 km from the chord's midpoint after a 20-hour gap.
- ATN's 10 hours is its limit for modelling, recorded as a reference point only.

**Proposed for review: join at 6 hours or less,** on the reasoning that it is about three and a half times the median gap, the same proportion as the zebra rule, and that it never draws across the tag's daily silent period. Then 108 of 662 steps are unjoined and the fixes on either side stand as separate marks. **This is the choice in this document with the least outside support**; 3 hours and 10 hours are the alternatives to weigh, with the counts above.
- Whatever the limit, the replay bar's gap sentence ("No fix was recorded for … after it") applies as built for the zebra.

## 6. Question 4: accuracy
- Each fix carries its Argos class. Proposed: the class is shown for the fix under the marker, and the card states the class meanings as the file gives them, with the sentence that A and B carry no estimate.
- Proposed card wording: "Positions are Argos satellite fixes. Their accuracy varies from under 250 m to unknown; many are the two weakest classes. The line joins recorded fixes; it is not the whale's route."
- Error radius exists on 49 of 824 rows (audit). Not proposed for display in a first preview; stated on the card as "supplied for 6% of rows".
- Not proposed: thinning to classes 3, 2 and 1 only (319 PASS rows). It removes more than half the fixes and leaves the same 22 gaps over 24 hours.

## 7. Question 5: the tagging row
- One row of type "User", timed 22 Oct 2013 23:16 UTC, eight hours before the file's stated deployment start; it fails the source's time check.
- **Proposed:** not part of the track and not drawn as a fix. The card states the deployment start as the file's attribute gives it and notes the inconsistency.

## 8. What the proposal would produce
| | |
|---|---|
| Fixes drawn | 663 (classes 3 / 2 / 1 / 0 / A / B: 14 / 101 / 189 / 119 / 121 / 119) |
| First and last | 23 Oct 2013 03:02:00 UTC to 22 Feb 2014 15:28:47 UTC |
| Extent | 17.3°N to 24.6°N, 157.4°W to 137.9°W |
| Line | joins 554 of 662 steps at a 6-hour limit |
| Statement of what was done | "Shown: Argos fixes that passed the data centre's time, location and speed checks, except one the satellite system marks invalid. Mother Earth then removed 31 fixes that would need more than 20 km/h from a neighbouring fix, keeping the better-rated fix of a pair. Fixes more than 6 hours apart are not joined." |

## 9. Decisions asked for
1. Candidate rows: PASS minus class Z (§3).
2. Rejection: C, anchors 3 and 2, at 20 km/h; or C at 10 m/s; or none (§4).
3. Join limit: 6 h, 3 h or 10 h (§5).
4. Accuracy wording and whether the class is shown per fix (§6).
5. Tagging row left out (§7).

## 10. Not done, not claimed
- No rule is selected. No track is cleared for drawing. This covers one deployment; the other 26 are untouched.
- The 20 km/h source was read as a fetch-tool extract and concerns 2009 deployments.
- The Douglas Argos Filter itself was not run; C is not that filter.
- No land test was run (the extent is open ocean and island waters; a kept fix on an island is possible and uncounted).
- The table in §4 was run on the 694 PASS rows including the class Z row; C at 20 km/h removes that row itself. If §3 is accepted, the run is repeated on the 693-row set before anything is built, and any difference reported.
- Sensitivity: small, island-associated populations are the subject of the tagging project; their conservation and legal status were not looked up; the recorded decision is still to make, and the authors' request for contact stands as Chad's choice.
