# Animals — the white shark paper and ATN's quality-control documentation, read against the two audits

19 Nov 2026 · rev 1.1, 08:39 UTC (clock reading), after GPT's review of rev 1 (changes in §5) · read-only. Nothing built, no provider contacted, nothing spent.

**Chad's line (19 Nov):** "Go: read the white shark paper (10.3389/fmars.2022.811985) and ATN's QC documentation, read-only, and report against the two audits".

**Results in two lines.**
- **False killer whale 98364:** the published speed test (suspect over 8 m/s, fail over 10 m/s, each row against the row before it), run with the actual `ioos_qc` 3.1.1 code, **gives the file's own speed flag on all 824 rows**. That is strong evidence the file's flags are consistent with the published test and thresholds. It does not identify the version ATN ran, and it is not proof of exact equivalence. The flag is a limited basis for a display rule (§2).
- **White sharks:** the paper gives published processing stages and parameters (Z class and duplicate times removed, a 3 m/s speed filter, tracks segmented at gaps over three days before modelling); **the rejection algorithm is still to establish.** **The archive file is not the paper's raw set**: the counts and the period differ (§3).

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

**What the file shows when the test is recomputed with the actual implementation**
Script `fkw_98364_speed_recompute.py`, summary `fkw-98364-speed-recompute-2026-11-19.json` (both beside this document). It calls `ioos_qc.argo.speed_test` itself; versions: `ioos_qc` 3.1.1 (wheel sha256 `0092c637…fb0c` from PyPI), `geographiclib` 2.1, `numpy` 2.5.3, `netCDF4` 1.7.5.1, Python 3.13.18. The script refuses any input but the pinned file.

| Check | Result |
|---|---|
| Rows whose recomputed flag equals the file's speed flag (8 and 10 m/s) | **824 of 824**; counts 694 pass, 16 suspect, 113 fail, 1 not evaluated, both sides |
| Rows at the same time as the row before | 57, all 57 flagged fail in the file |
| Roll-up flag equals the worst of the time, speed and location flags (rev 1 check) | all 824 rows |
| The time-test fail on the first row | consistent with the documentation: the tagging row is timed 8 hours before the file's deployment start, and the tidy-up test is on deployment dates |

- **Rev 1 reported 823 of 824 and called the difference "rounding-level". That was wrong.** Rev 1 used a hand-written spherical distance; the package uses the WGS84 ellipsoid (GeographicLib). The row is index 142 (0-based):
  - previous row 2013-11-04 03:02:57 UTC, 18.975, −153.054; this row 03:40:28 UTC, 18.969, −153.225; 2,251 whole seconds;
  - WGS84 geodesic distance 18,020.18531230552 m, speed **8.00541328845203 m/s**: over 8.0, suspect, as in the file;
  - spherical distance 17,993.82458672636 m, speed 7.993702615160534 m/s: under 8.0.
  It is the only row where the two distance formulas give different flags.
- **What this does and does not establish.** The file's flags are what the current published code and thresholds produce on this file. It does not show which version of the code ATN ran when the file was created (history 21 May 2022) or re-issued (5 Mar 2025), and the QC page carries no version. Exact historical equivalence stays unproven.
- The file labels its speed flag with the standard name of a different test (gross range). The values behave as a speed test's.

**What PASS does and does not say**
- PASS means the row passed the source's time, location and speed tests. **It says nothing about how accurate the position is.** Error estimates exist on 6% of rows (audit §4).
- The speed test uses one pair of thresholds for every species ATN handles. Whether 8 and 10 m/s are a meaningful limit for a false killer whale was not assessed: no species source was read.
- **After the failed rows are dropped, 2 of the 693 steps between retained neighbours exceed 10 m/s** (fastest 13.86 m/s) and 3 exceed 8 m/s. The test was run on the rows before any were removed, so retained-neighbour speeds are a different quantity.
- **A fast pair does not say which of its two positions is wrong.** The test flags the later row of a fast step.
- **Gaps among PASS rows:** median 1.7 h; 30 over 10 hours, 22 over 24 hours, 7 over 72 hours; longest 125.5 h. ATN's own modelling step skips a deployment with any gap over 10 hours.

**Open questions a rule proposal for this deployment must settle (nothing here is a default)**
1. Whether to draw only roll-up PASS rows, described as "passed the source's time, location and speed checks", with the thresholds and this recomputation cited, and without implying accuracy.
2. What, if anything, to do about retained-neighbour steps over the source's limits. Any further rejection needs a fully specified algorithm: which row of a fast pair is rejected and why, the order rows are examined in, whether and how it iterates, how the first and last rows are treated, and when it stops. A species-appropriate speed limit needs a source.
3. A gap rule for joining fixes. ATN's 10 hours is a modelling limit, recorded here as a reference point only.
4. Whether to show the Argos class per fix, as the only accuracy statement for 94% of rows.

## 3. White sharks: the paper against the archive file
| | Paper (as extracted) | Archive file (our audit) |
|---|---|---|
| Sharks | 34 tagged, 33 analysed (one had no qualifying segment of at least 25 locations) | 34 |
| Tags | Wildlife Computers SPOT5, dorsal fin | every row type "Argos" |
| Tagging | March to May 2012; False Bay, Gansbaai, Struisbaai, Mossel Bay, Algoa Bay | same five areas |
| Raw locations | **20,141**, March 2012 to **April 2014** | **19,278**, 9 Mar 2012 to **11 Jun 2015** |
| Z class, duplicate times | removed by the authors as their first step | **none present** |
| Speed filter | maximum **3 m/s** (10.8 km/h), following Queiroz et al. 2019; leaves 17,317 | not applied: 3,631 of 19,244 steps exceed 10 km/h |
| Gaps | track split into segments wherever the gap exceeds **three days**, chosen empirically, **as a step before modelling** | 232 gaps over 10 days |
| Short segments | under 25 locations dropped (model would not converge): 13,370 locations, 171 segments, 33 sharks | not applicable |
| Positions on land | the authors did not remove or correct land-overlapping estimates in their modelled output, saying the error is evident and cannot be corrected systematically | present in the raw rows |
| Model | continuous-time state-space model (foieGras), one location every 12 hours: 6,680 modelled locations | no modelled rows |
| Transmission | 36 to 1,155 days | 47 to 1,153 days first to last row |
| Long journeys | 9 of 33 sharks reached Mozambique, 6 the Madagascar area; some used the high seas | extent 39.8°W to 80.2°E |

- **The archive is neither the paper's raw set nor its filtered set.** It has fewer rows than the paper's raw count yet runs 14 months longer, and it already lacks Z-class rows and duplicate times. One possible explanation is the raw set with the first cleaning step applied and later transmissions included; **that is an inference of ours, not established provenance**, and nothing read states it. The enquiry to the authors (unsent, Chad's decision) is the way to settle it.
- **Long journeys are real, and so are errors.** The paper confirms movements to Mozambique, Madagascar and the high seas, so distance alone cannot mark a row as wrong. Nothing in the extract supports a white shark at 39.8°W; rows like that are what the speed filter is for.
- **The parts of the paper read name no individual shark.** The file's `DeployID` values are given names. Tag numbers stay the neutral default.
- The data availability statement points to the Zenodo DOI we audited. The permit named is an Oceans and Coasts research permit (now Department of Forestry, Fisheries and the Environment).

**What the paper does and does not give a rule proposal for the sharks**
1. **Published stages and parameters, citable:** Z class and duplicate times removed; a 3 m/s speed filter following Queiroz et al. 2019.
2. **Not yet established: the rejection algorithm.** Which row of a fast pair is removed, in what order, and whether it iterates is in Queiroz et al. 2019, not read here. It must be read before a rule is proposed.
3. **The three-day limit is the authors' segmentation step before modelling.** It is not an established safe gap for joining recorded fixes on a map. A gap rule for joining raw fixes is a separate decision.
4. **The authors' choice about land concerns their modelled estimates.** It does not justify keeping, or joining lines through, raw fixes that fall on land. That is a separate decision too.
5. Whatever rule is proposed, its effect on this archive must be computed (rows kept per shark, steps and gaps after), since the paper's counts are for a different row set. Mother Earth would be drawing recorded Argos fixes, not the authors' modelled 12-hour track, and would say so.
6. CC BY 4.0's statement of changes would name the steps actually applied.

## 4. What this does not do
- It clears no track for drawing and decides no rule.
- It does not cover the other 26 false killer whale deployments.
- Species speed literature for false killer whales, Queiroz et al. 2019, and the Argos class accuracy definitions were not read.

## 5. Changes in rev 1.1 (GPT's review of rev 1, relayed by Chad 19 Nov)
1. **QC applicability qualified.** The recomputation now uses the actual implementation, pinned, with the script and summary kept in the repo. Result 824 of 824. Rev 1's "823 of 824, rounding-level" is withdrawn: the one row differed because rev 1 used a spherical distance and the package uses WGS84; the row, inputs and full-precision values are in §2. Stated limits: consistency, not exact equivalence; the historical version is not identified.
2. **False killer whale list tightened.** PASS described as passing the source's time, location and speed checks, with no implication about accuracy. Removed: the sentence that 10 m/s is "far above anything this tag can tell us" (unsupported), the comparison with the shark paper's 3 m/s (not a whale criterion), and "re-apply until no kept step exceeds it" (not an agreed default). The list is now open questions, including what a rejection algorithm must specify.
3. **Shark modelling choices separated from replay choices.** Three days is the authors' segmentation limit before modelling; their land decision concerns modelled estimates. "Complete filtering recipe" replaced.
4. **Segment boundary corrected:** no qualifying segment of at least 25 locations.
5. The archive-versus-paper explanation is labelled an inference, not provenance.
