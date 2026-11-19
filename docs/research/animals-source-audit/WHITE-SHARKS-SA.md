# Animals — full file audit: white sharks tagged on the South African coast

19 Nov 2026 · rev 1.1 (after GPT's review of rev 1; changes in §10) · read-only. Nothing built, nothing saved, no provider contacted, nothing spent.

**Chad's line (19 Nov):** "Go: full audit of the South African white shark file (Zenodo 10.5281/zenodo.5575189), read-only".

**Result: usable as a candidate, not ready to draw.** The rights are clear (CC BY 4.0). The file is raw, unfiltered Argos output: two thirds of the rows are the weakest quality class and one step in five implies more than 10 km/h. It needs a quality rule argued for this study before any line is drawn, a recorded sensitivity decision, and a decision about the animals' names.

## 1. How this was done
- 19 Nov 2026, 02:25 UTC, browser pane, two requests to Zenodo with no sign-in: the record through Zenodo's API, then the one data file.
- The file (1,830,322 bytes) was fetched in the pane's memory and counted there. **It was not saved.** Its MD5 computed in the pane, `01cf51dc2b78c056d9b0d7a3f25553ea`, equals the checksum Zenodo lists. sha256 `156b1ee2d72b20244ad378020abd7da30e8c006fc58c7e72e6864f1f23a0029d`.
- Every figure below is counted from the file unless it says "record". Evidence: `white-sharks-evidence-2026-11-19.json`.
- Not read: the paper (Kock et al.), and therefore how the authors themselves filtered these rows.

## 2. Identity and rights
| | |
|---|---|
| Title | "Satellite tracking data of white sharks in the southwest Indian Ocean (2012-2014)" |
| DOI | `10.5281/zenodo.5575189` (all versions: `10.5281/zenodo.5575188`), version 1.0.0 |
| Record dates | publication date 18 Oct 2021; record created 18 Apr 2022, modified 19 Apr 2022 |
| Licence on the record | `cc-by-4.0`, access "open" |
| Creators | 16 named on the record, first author Kock |
| Paper | doi `10.3389/fmars.2022.811985` |
| File | `south_african_white_shark_ARGOS_tracks.csv`, 1,830,322 bytes |

- **What CC BY 4.0 requires of us:** credit to the creators, a link to the licence, and a statement of the changes we made (any filtering, thinning or reformatting). A source name alone does not meet it.
- The record states the tagging was approved under a South African government permitting authority. It states no further condition on reuse.
- Suggested credit line for a study card, to be checked against the record at build time: creators as listed, 2021, title, Zenodo, DOI, "CC BY 4.0", "Changes: <what we did>".

## 3. Type codes (resolved first, as GPT asked)
- The `type` column has **one value in all 19,278 rows: "Argos".** There is no second kind of row: no tagging-position rows, no GPS rows, no row marked as modelled or user-entered.
- So every row is an Argos Doppler location as delivered, each with an Argos quality class.

## 4. Dates and counts
- 19,278 rows, 11 columns, no ragged row, no unreadable time, no invalid coordinate, no empty field. No two rows of one shark share a time. Rows are in time order per shark.
- Times are `yyyy-mm-dd hh:mm:ss`; the record says UTC.
- **34 sharks, 34 tag numbers.** 21 female, 13 male. 13 juvenile, 18 sub-adult, 3 adult by the record's length classes; total length 228 to 505 cm.
- Tagging areas (record's names): Mossel Bay 15, Gansbaai 12, Struisbaai 3, False Bay 3, Algoa Bay 1.
- **Observed 9 Mar 2012 18:17 UTC to 11 Jun 2015 16:09 UTC.** The title says 2012–2014. Rows by year: 2012: 13,190 · 2013: 5,551 · 2014: 506 · 2015: 31.
- Rows per shark: 101 to 1,879, median 508. Days from first to last row: 47 to 1,153, median 454; 22 sharks span a year or more.
- Time between consecutive rows: median 1.7 h; one in ten over 21.9 h; one in a hundred over 298 h; longest 662 days. 33 of the 34 sharks have at least one gap over 10 days (232 such gaps in all).

## 5. Quality classes
| Argos class | Rows | Share |
|---|---|---|
| 3 | 496 | 2.6% |
| 2 | 1,359 | 7.0% |
| 1 | 1,564 | 8.1% |
| 0 | 740 | 3.8% |
| A | 2,600 | 13.5% |
| B | 12,519 | 64.9% |

- No row is class Z. The file carries no error estimate, no ellipse, no outlier flag and no second Argos solution: the class is the only quality information.
- The meaning of each class in metres is not given in the file or on the record.

## 6. Implausible positions
- Extent of all rows: 45.9°S to 6.2°S, **39.8°W to 80.2°E**. The second row of the file is 4 minutes after the first and about 1,100 km from it. Positions in the South Atlantic and the central Indian Ocean are in the file beside coastal ones; which are real long journeys and which are Argos errors cannot be told without a rule. 11 sharks have at least one row far outside southern African waters.
- Steps between consecutive rows (19,244): **3,631 imply more than 10 km/h (19%), 2,427 more than 20 km/h, 1,028 more than 100 km/h.** Every one of the 34 sharks has steps over 100 km/h.
- Keeping only classes 3, 2 and 1 (3,419 rows, 18%) still leaves 137 of 3,385 steps over 10 km/h and 77 over 20 km/h. Class alone does not make a clean track. With that filter, 13 sharks keep 100 or more rows and 22 keep 50 or more.
- So a journey from this file needs a **quality rule of ours, justified for this study, species and tag**: which classes are drawn, a speed test with a stated limit and source, how close-in-time rows are handled, and how long gaps break the line. It is not the blue-whale rule reused.

## 7. Sensitivity considerations (for a recorded decision; none taken here)
- A high-profile species; tagging areas are named coastal sites; the file is public at full precision and 11 to 14 years old.
- **Animal names.** The `DeployID` values are given names, not codes. Rev 1 §9 says researcher-given names are published only where the dataset and its permissions support it. The file is CC BY, so the names may be shown; whether they should be is a choice for Chad. A neutral option is the tag number.
- The species' legal protection and conservation status were not looked up.
- A courtesy note to the authors is optional under CC BY and is Chad's decision.

## 8. Update status and cost
- A closed, versioned archive: one version, last modified April 2022. Not a feed. Whether the tagging programme continues is not shown by the record.
- No fee, no account. A display file would be small (19,278 rows before filtering).

## 9. What this audit supports
- **Supports:** opening a quality-rule proposal for this study, and a study card with correct credit.
- **Does not support yet:** drawing any line; any statement about where the sharks travelled; public display.
- **Before a rule is proposed: read the paper** (doi `10.3389/fmars.2022.811985`). This audit counted the archive file and did not read how the authors filtered or modelled it; a rule of ours has to be set against theirs, and the paper's analysed counts and period may differ from the archive's.
- **Suggested first animals for the quality-rule work**, by amount of better-class data: tag `118852` (1,641 rows, 471 in classes 1–3, 15 Apr 2012 to 24 Apr 2015) and tag `118845` (1,004 rows, 209 in classes 1–3, 9 May 2012 to 29 Sep 2013).

## 10. Changes in rev 1.1 (GPT's review, relayed by Chad 19 Nov)
- The hold on drawing stands.
- §9 now puts reading the paper ahead of any rule proposal. GPT reports that the paper describes a 3 m/s speed filter, treatment of gaps over three days, and modelled trajectories, and that its analysed counts and period differ from this archive audit. **Not read or verified here.** The rule proposal must explain that difference, not assume the archive and the paper's analysed set are the same.
- Animal names: tag numbers are the neutral default (GPT agrees); showing given names stays Chad's decision.
