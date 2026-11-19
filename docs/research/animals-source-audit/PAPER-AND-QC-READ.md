# Animals — the white shark paper and ATN's quality-control documentation, read against the two audits

19 Nov 2026 08:33 UTC (clock reading) · rev 1 · for GPT review · read-only. Nothing built, no provider contacted, nothing spent.

**Chad's line (19 Nov):** "Go: read the white shark paper (10.3389/fmars.2022.811985) and ATN's QC documentation, read-only, and report against the two audits".

**Results in two lines.**
- **False killer whale 98364:** ATN's published speed test (suspect over 8 m/s, fail over 10 m/s, each row against the row before it) **reproduces this file's own flags on 823 of 824 rows**. The documentation applies to this file. The flag is a weak filter for a display rule, for reasons in §2.
- **White sharks:** the paper gives a complete, citable filtering recipe (no Z class, no duplicate times, 3 m/s speed filter, tracks split at gaps over three days). **The archive file is not the paper's raw set**: the counts and the period differ (§3).

## 1. What was read, and how
| Source | Read | How |
|---|---|---|
| Kock et al. 2022, *Frontiers in Marine Science* 9, doi `10.3389/fmars.2022.811985`, published 7 Apr 2022 | Methods, results, data availability and ethics statements | Publisher's full-text page, through the web-fetch tool, which returns an extract. **The figures in §3 are from that extract, not from a line-by-line read; a rule proposal must check each against the paper.** |
| ATN "Quality Control Protocols", `ioos.github.io/ioos-atn-data/quality-control.html` | Whole page | Same tool. The page carries no version or revision date; "Site last generated: Oct 27, 2026" is a build date. |
| ATN "Modeled Trajectory" page, `…/animotum.html`; "NCEI Archive" page, `…/atn-archive.html` | Whole pages | Same |
| `ioos_qc.argo.speed_test` source, `ioos.github.io/ioos_qc/_modules/ioos_qc/argo.html` | The function | Same |
| The deployment file again | All 824 rows | Fetched in the browser pane 19 Nov 08:31:51 UTC from the staging folder; 319,596 bytes, sha256 `9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6`, **the same file as the audit**; server "Last-Modified" 19 Mar 2025. Decoded in the cloud workspace, working copy deleted. |

## 2. False killer whale 98364 against ATN's documentation
**What the documentation says**
- Tests: a speed test (`ioos_qc.argo.speed_test`), a location test (fail only outside the globe's bounds), and a tidy-up that keeps rows inside the deployment dates. Flags are added; no row is removed. Flag 4 is described as "should not be used".
- Speed test thresholds: **suspect over 8.0 m/s (28.8 km/h), fail over 10.0 m/s (36 km/h).** One pair of thresholds for every species ATN handles.
- How the code works: each row is compared with the **row immediately before it in the file**, whatever that row's own flag. Strictly greater than. The first row is "not evaluated". Two rows at the same second and different places give an infinite speed, so the later one fails. The roll-up is described only as an aggregate; its derivation is not documented.
- ATN's own modelled tracks (aniMotum, 2-hour steps) drop flag-4 rows, need at least 20 records, and **skip a deployment that has any gap over 10 hours**. The page says these modelled outputs are not archived.

**What the file shows when the test is recomputed (ours, from latitude, longitude and time)**
| Check | Result |
|---|---|
| Rows whose recomputed flag equals the file's speed flag, thresholds 8 and 10 m/s, file order | **823 of 824** |
| The one difference | a step we compute as 7.99 m/s, flagged suspect in the file: a rounding-level difference in the distance formula |
| Thresholds that best reproduce the file's flags (search over 1–12 and 1–15 m/s in 0.25 steps) | **8.0 and 10.0** |
| Speeds of rows the file passes / marks suspect / fails | up to 7.83 m/s / 7.99 to 9.81 / 10.20 and above |
| Rows failing because they share a time with the row before | **57 of the 113 speed fails** |
| Roll-up flag equals the worst of the time, speed and location flags | all 824 rows |
| The time-test fail on the first row | explained: the tagging row is timed 8 hours before the file's deployment start, and the tidy-up test is on deployment dates |

- **So GPT's applicability question is answered by the file itself:** whatever version ran in 2022 or 2025, the flags in this file are the published test with the published thresholds.
- The file labels its speed flag with the standard name of a different test (gross range). The values are a speed test's.

**Why PASS is still a weak rule for display**
- **10 m/s is far above anything this tag can tell us about a whale.** The test only removes impossible jumps and duplicate times. Among PASS rows, **131 of 693 steps still exceed 3 m/s** (the limit the shark paper used for sharks).
- **After the failed rows are dropped, 2 steps between kept neighbours exceed 10 m/s** (fastest 13.86 m/s, 49.9 km/h) and 3 exceed 8 m/s. That is the kept-neighbour effect: the test was run before anything was removed.
- **The test fails the row after a jump, not necessarily the bad row.** Of the 114 failed rows, 6 are within 10 m/s of both nearest PASS rows.
- **Gaps among PASS rows:** median 1.7 h; **30 over 10 hours, 22 over 24 hours, 7 over 72 hours**; longest 125.5 h. By ATN's own rule this deployment would be skipped for modelling.
- Error estimates remain on 6% of rows (audit §4). PASS says nothing about how accurate a kept position is.

**What a rule proposal for this deployment can now rest on**
1. Draw only roll-up PASS rows, described as "positions that pass the data centre's impossible-speed and duplicate-time test", with the thresholds stated and this recomputation cited.
2. A **second speed check of ours on kept neighbours**, with a limit argued from the species literature (not read here), or at minimum the same 10 m/s re-applied until no kept step exceeds it.
3. A gap rule of ours for the line. ATN's 10 hours is a modelling limit, not a display rule, but it is a documented reference point.
4. The Argos class shown per fix, since it is the only accuracy statement for 94% of rows.
None of this is decided here.

## 3. White sharks: the paper against the archive file
| | Paper (as extracted) | Archive file (our audit) |
|---|---|---|
| Sharks | 34 tagged, 33 analysed (one had no segment over 25 locations) | 34 |
| Tags | Wildlife Computers SPOT5, dorsal fin | every row type "Argos" |
| Tagging | March to May 2012; False Bay, Gansbaai, Struisbaai, Mossel Bay, Algoa Bay | same five areas |
| Raw locations | **20,141**, March 2012 to **April 2014** | **19,278**, 9 Mar 2012 to **11 Jun 2015** |
| Z class, duplicate times | removed by the authors as their first step | **none present** |
| Speed filter | maximum **3 m/s** (10.8 km/h), following Queiroz et al. 2019; leaves 17,317 | not applied: 3,631 of 19,244 steps exceed 10 km/h |
| Gaps | track split wherever the gap exceeds **three days** (chosen empirically) | 232 gaps over 10 days |
| Short segments | under 25 locations dropped (model would not converge): 13,370 locations, 171 segments, 33 sharks | not applicable |
| Positions on land | left in; the authors say the error is evident and cannot be corrected systematically | present |
| Model | continuous-time state-space model (foieGras), one location every 12 hours: 6,680 modelled locations | no modelled rows |
| Transmission | 36 to 1,155 days | 47 to 1,153 days first to last row |
| Long journeys | 9 of 33 sharks reached Mozambique, 6 the Madagascar area; some used the high seas | extent 39.8°W to 80.2°E |

- **The archive is neither the paper's raw set nor its filtered set.** It has fewer rows than the paper's raw count yet runs 14 months longer, and it already lacks Z-class rows and duplicate times. It reads as the raw set with the first cleaning step applied and later transmissions included, but **that is our inference, not something the paper or the record states.** The enquiry to the authors (unsent, Chad's decision) is the way to settle it.
- **Long journeys are real, and so are errors.** The paper confirms movements to Mozambique, Madagascar and the high seas, so distance alone cannot mark a row as wrong. It says nothing that supports a white shark at 39.8°W; rows like that are what the speed filter is for.
- **The paper names no individual shark.** The file's `DeployID` values are given names. Tag numbers stay the neutral default.
- The data availability statement points to the Zenodo DOI we audited. The permit named is an Oceans and Coasts research permit (now Department of Forestry, Fisheries and the Environment).

**What a rule proposal for the sharks can now rest on**
1. The authors' own steps, cited: 3 m/s speed filter, line broken at gaps over three days. Both are published, study-specific choices.
2. To be read before proposing: **Queiroz et al. 2019**, for how the speed filter decides which row of a fast pair goes. Not read here.
3. A clear label that Mother Earth would draw **recorded Argos fixes after that filter, not the authors' modelled 12-hour track**, and that positions on land remain because the authors left them.
4. The effect of the filter on this archive must be computed (rows kept per shark, steps and gaps after), since the paper's counts are for a different row set.
5. CC BY 4.0 "statement of changes" would name exactly these steps.

## 4. What this does not do
- It clears no track for drawing and decides no rule.
- It does not cover the other 26 false killer whale deployments.
- Species speed literature for false killer whales, Queiroz et al. 2019, and the Argos class accuracy definitions were not read.
