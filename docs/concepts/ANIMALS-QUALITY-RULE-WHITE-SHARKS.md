# Animals — quality-rule proposal: white sharks tagged on the South African coast

19 Nov 2026 08:58 UTC (clock reading) · rev 1 · for GPT review · documents only. Nothing built, no provider contacted, nothing spent. **Nothing in this document is decided; it proposes, and marks each choice as Chad's or GPT's to accept or change.**

**Chad's line (19 Nov):** "Go: quality-rule proposals for false killer whale 98364 and the white sharks, documents only, for GPT review".

Rests on: `docs/research/animals-source-audit/WHITE-SHARKS-SA.md` rev 1.1 and `PAPER-AND-QC-READ.md` rev 1.1 (GPT: pass for research). Every count below is from `quality_rule_effects.py` run on the pinned file (Zenodo 10.5281/zenodo.5575189, sha256 `156b1ee2…029d`, fetched again 19 Nov 08:53 UTC); full output in `quality-rule-effects-2026-11-19.json` beside the audits.

**Summary.** A speed limit alone does not make these tracks safe to draw. The reason is silence: these tags go quiet for days to months, and a speed test says nothing about a position that follows a long silence. The proposal is therefore a speed rule **plus** a rule for positions that cannot be checked, **and one animal first.**

## 1. New reading for this proposal
| Source | What it gives | How read |
|---|---|---|
| Queiroz et al. 2019, *Nature* 572:461–466, Supporting Information §1.2.2 and §1.3 | Class Z removed; the remaining raw positions (classes 3, 2, 1, 0, A, B) "analysed point-to-point with a 3 m s⁻¹ speed filter". Tracks with gaps over 20 days split into segments before interpolation. **It does not say which position of a fast pair is removed, whether the filter iterates, or name a software package.** No treatment of real positions on land is described. | SI PDF (NOAA repository copy) through the web-fetch tool, an extract; the publisher's page and the accepted manuscript could not be fetched. **To be checked line by line before adoption.** |
| Kock et al. 2022 | As in `PAPER-AND-QC-READ.md` §3 | — |

**Consequence:** the published limit (3 m/s) is citable. **The rejection algorithm is not published in what was read**, so any algorithm used here is Mother Earth's own and must be stated as such. A named published speed filter (McConnell et al. 1992, as implemented in the `argosfilter` package) exists and was not read; it is an alternative to weigh, not assessed here.

## 2. What the file does under a 3 m/s limit
19,278 rows, 34 sharks, 19,244 steps; 3,442 steps exceed 3 m/s and every shark has some.

Three candidate algorithms, each fully specified in the script header (order, which row goes, iteration, endpoints, stopping): **A "forward"** (reject a row too fast from the last kept row), **B "spike"** (reject only out-and-back jumps, one at a time), **C "anchored"** (classes 3, 2 and 1 filtered first as anchors; any other row kept only if within the limit of the nearest earlier kept row and the nearest later anchor).

| Algorithm | Rows kept | Rejected | Longest run of rejected rows | Steps still over 3 m/s | Sharks left under 25 rows |
|---|---|---|---|---|---|
| none | 19,278 | 0 | 0 | 3,442 | 0 |
| A | 14,741 | 4,537 | **87** | 0 | 0 |
| B | 18,788 | 490 | 6 | **2,797** | 0 |
| C, anchors 3, 2, 1 | 15,316 | 3,962 | 20 | 0 | 0 |
| classes 3, 2, 1 only, then A | 3,290 | 129 of 3,419 | 2 | 0 | **8** |

- **A cascades.** One wrong kept row causes the rows after it to be rejected: up to 87 in a row. It also keeps a wrong first row, because nothing precedes it.
- **B leaves most fast steps in.** It will not guess at lone pairs, and here most fast steps are lone pairs. 2,797 steps over 3 m/s would stay on the map.
- **C** removes every fast step with shorter runs (20 at most), by trusting the classes Argos rates best when a pair conflicts. Two sharks' first rows in the South Atlantic (45°S, 37° to 40°W, class A, 19 to 20 days before the next position) are kept by A and **rejected by C**.
- Keeping only classes 3, 2 and 1 is clean but thin: 3,290 rows, and 8 sharks fall under 25 rows.
- For comparison, the paper reports 20,141 raw locations reduced to 17,317 by Z-class, duplicate and speed filtering. The archive is a different row set (research note §3), so these counts are not expected to match and no equivalence is claimed.

## 3. What a speed limit cannot do
After C, with no step over 3 m/s anywhere:
- **363 kept rows lie outside 10°E to 60°E** (9 sharks; 250 of them class B). The extremes are 27.5°W (South Atlantic) and 80.2°E (central Indian Ocean).
  - The 27.5°W row belongs to tag 117468, the shark the authors excluded: class A, weeks from its neighbours on both sides (measured under A: 47 days after the previous kept row, 20 days before the next).
  - The 80.2°E row is the last row of tag 117464: class A, **380 days after the row before it** (measured under A).
  - Others sit in clusters with close neighbours (for example, under A, 38°S 74°E, 58 km from a row 6.7 hours earlier). The paper reports sharks reaching Mozambique, Madagascar and the high seas, so some far positions are real. **Which are real cannot be told from this file by speed.**
- **Rows no speed test can check** (kept neighbours on both existing sides more than the stated time away): 401 at 24 hours, **172 at 72 hours**, 38 at 10 days. 30 of the 34 sharks have at least one at 72 hours.
- **Most of each track is silence.** Median share of a shark's first-to-last time that lies inside steps of 72 hours or less: 30%. At 24 hours: 20%.
- A position after a long silence can also come from a tag that is no longer on the animal. Nothing in the file says when a tag detached.

## 4. Proposal
Five parts. Each is a separate decision.

**4.1 One animal first: tag 118845.**
- 1,004 rows, 9 May 2012 to 29 Sep 2013. All its rows, filtered or not, lie between 23.2°S and 35.5°S, 18.8°E and 36.1°E: the South African coast to southern Mozambique, a range the paper itself reports.
- It is one of seven sharks with at least 500 kept rows whose kept extent stays inside 10°E to 45°E (tags 117471, 117472, 117474, 117480, 118845, 118859, 118864).
- The audit also suggested tag 118852 (most better-class rows). After C its extent still reaches 61.6°E and 15°S; it is the harder case and is better taken second, once the uncheckable-row rule has been seen working.

**4.2 Rejection: algorithm C, limit 3 m/s, anchors on classes 3, 2 and 1.**
- For 118845: 796 of 1,004 rows kept, 208 rejected, longest run 5; classes kept 28 / 81 / 92 / 30 / 112 / 453 (3 / 2 / 1 / 0 / A / B). First kept row 30 km from the middle of its next ten.
- Stated as: "the 3 m/s limit is the study authors'; the method of choosing which position to drop is Mother Earth's."
- More than half the kept fixes are class B, the weakest. That is the nature of this dataset and would be said on the card.

**4.3 Positions that cannot be checked: not drawn in the first preview.**
- Rule: after C, a kept row whose kept neighbours on both existing sides are more than **72 hours** away is not drawn; the card counts them. For 118845 that is 1 row.
- 72 hours is chosen because it is the authors' own figure for where a track stops being continuous (their segmentation limit). Here it is used only to say "a speed test tells us nothing about this position", not as a joining rule.
- Alternative: draw them as unjoined marks labelled "not checked against a neighbour". Honest, but it puts the least certain positions on the map with the same weight as the rest.

**4.4 Joining fixes.** Counts after C:
| Join limit | 118845: steps not joined (of 795) | Share of its 507 days inside joined steps | All sharks: steps not joined (of 15,282) |
|---|---|---|---|
| 3 h | 384 | 4% | 7,585 |
| 6 h | 258 | 9% | 5,516 |
| 12 h | 141 | 17% | 3,698 |
| 24 h | 48 | 31% | 1,641 |
| 72 h | 17 | 41% | 775 |
| 10 days | 3 | 54% | 234 |

- 118845: median gap 2.7 h, longest **188 days**.
- **Three days is the authors' segmentation limit before modelling; it is not an established safe gap for joining recorded fixes,** and is not proposed as one.
- At 3 m/s a shark covers about 260 km in 24 hours and 780 km in 72. A straight line over such a gap would cross land in places on this coast.
- **Proposed for review: join at 12 hours or less.** At 3 m/s that bounds an unrecorded excursion to about 65 km either side of the line, and it keeps the line inside single bouts of transmission. 141 of 795 steps are then unjoined. This choice has the least outside support in the document; 6 and 24 hours are the alternatives, with the counts above.

**4.5 Land.** **Not counted, and it must be before anything is built.**
- Raw Argos fixes of a coastal shark will include positions on land; a class B fix can be tens of kilometres out.
- The authors' statement about land concerns their modelled estimates and does not settle what to do with raw fixes.
- Proposed next step, read-only: count kept rows on land for 118845 against Natural Earth land (already a Mother Earth source), by class, and bring the count back. Options then: drop fixes on land beyond a stated distance, or show them as recorded with their class. No option is recommended until the count exists.
- Whatever is chosen, **no line is drawn across land**: a joined step whose straight line crosses land is left unjoined. That needs the same land data.

## 5. Labels and credit
- Tag number, not the given name (the file's `DeployID`).
- "Recorded Argos satellite fixes after filtering. This is not the study's modelled track." The authors' analysis used a state-space model at 12-hour steps; nothing of that is reproduced.
- Each fix carries its Argos class; the card says the file gives no error estimate and that most fixes are the weakest class.
- CC BY 4.0: creators as listed on the record, year, title, Zenodo, DOI, licence link, and a statement of changes naming the steps actually applied (C at 3 m/s with anchors 3, 2, 1; uncheckable rows removed at 72 hours; the land rule once chosen; join limit).

## 6. What the proposal would produce for tag 118845 (before any land rule)
| | |
|---|---|
| Fixes drawn | 795 (796 kept by C, less 1 that cannot be checked) |
| Period | 9 May 2012 23:24:04 UTC to 29 Sep 2013 05:02:41 UTC, 507 days |
| Extent | 23.2°S to 35.5°S, 18.8°E to 36.1°E |
| Line | joins about 654 of 795 steps at 12 hours (to be recounted once the uncheckable row is removed) |
| Silence | about 83% of the 507 days lies in gaps longer than 12 hours |

## 7. Decisions asked for
1. One animal first, tag 118845 (§4.1).
2. Algorithm C at 3 m/s, anchors 3, 2, 1; or the published McConnell-type filter after it has been read; or another (§4.2).
3. Uncheckable positions: not drawn at 72 hours, or drawn unjoined and labelled (§4.3).
4. Join limit: 12 h, 6 h or 24 h (§4.4).
5. Go-ahead for the read-only land count (§4.5).

## 8. Not done, not claimed
- No rule is selected. No track is cleared for drawing. Nothing here covers the other 33 sharks beyond the totals shown.
- Queiroz et al. 2019 was read as a fetch-tool extract of its Supporting Information; the main paper's page could not be fetched.
- McConnell et al. 1992 and the `argosfilter` package were not read. No published filter was run.
- No land test. No check of positions against the tagging date of each shark (the file has no deployment dates).
- The explanation of why the archive differs from the paper's raw set remains an inference; the unsent enquiry to the authors would settle it and is Chad's decision.
- Sensitivity (a high-profile species, named coastal sites) still needs its recorded decision before any public display.
