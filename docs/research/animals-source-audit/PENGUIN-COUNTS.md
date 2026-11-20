# Animals: audit A, African penguin counts

20 Nov 2026 · rev 1, **part 1 of 2** · for GPT · read-only research under brief A (`docs/concepts/ANIMALS-EXPANSION-AUDIT-BRIEFS.md` rev 1.1). Chad's go: 20 Nov, his own message ("go"), taken as audit A first. Nothing built, nothing sent, no account, nothing saved to the Mac or the repository.

**Status**
- **Version B (repository file, to 2023): audited at file level. Result: requires clarification** (no licence; the anchor rule is not written down). Its contents are internally consistent.
- **Version A (Dryad file, to 2019): NOT audited.** The record's download link answered with an automated-visitor check, not the file. Claude does not get past such checks. It needs Chad to download the file himself (§5).

## 1. How this was done

- In a tab Claude opened in Chad's Chrome and closed afterwards, 20 Nov 2026, between 13:20:55 and 13:22:49 UTC (clock readings).
- Version B: seven requests to GitHub's public API from a `github.com` page, one at a time, no sign-in used by the requests: repository record, head commit, commit list for the CSV, file tree at the pinned commit, and the contents of three files at that commit. The files were held in the tab's memory, hashed and counted there. **Nothing was saved.** The figures below were read out of the tab as text.
- Version A: one request to the record's own file link. It returned an HTML page titled "Validating..." from a bot-protection service, 2,881 characters, not the CSV. No further attempt was made.
- No separate evidence file: the results are in the tables here. The tab's raw output was not written anywhere.

## 2. Version B: identity and version

| | |
|---|---|
| Repository | GitHub `rbsherley/AP_IUCN_CR`; created 2023-12-20; last push 2024-02-08T09:48:55Z; default branch `main` |
| Head at audit | `682766636a8a0ebcdd5a1b3959f291444cb83db4`, 2024-02-08T09:48:55Z, "Update README.md". Same head GPT and Claude saw earlier today |
| File | `Afr_penguin_2023_JARAinput.csv` at that commit |
| Bytes | 4,813 (the API's size field and the decoded length agree) |
| sha256 of the bytes | `647ea16a0b091fe444253ed3366438111b1498082f42a1ea24bdac83de045a43` |
| Git blob | `cbbf6701c9bda470693e04a7c9ec6af089b16717` |
| File's history (3 commits) | `9f214bd2…` 2023-12-20 "Add files via upload" · `3acbdf0e…` 2024-01-29 "Update Afr_penguin_2023_JARAinput.csv" · `1f7cd820343b91903c94455ca985c2bf76eb2b22` 2024-02-08 "Updated count at Dyer Island to 903" |
| README | 494 bytes, sha256 `6b1ee0a5e3de429a9687200942c984131929841b438f9da3ba0141edfaf96e5d`. It says the repository holds the code and data to reproduce the analysis in Sherley et al. 2024, "Submitted to Ostrich", and all the model outputs. It says nothing about reuse, units, NA or the 0.1 values |
| R script | `JARA R AP 2023.R`, 28,878 bytes, 550 lines, sha256 `1e3005db134d978aff6ee16a5a963eac1acce9f3c60f30cbab26195653c7bf62` |
| **Licence** | **None.** The API's licence field is null and the tree at this commit has no licence file. Public availability is not a licence |

The earlier two versions of the CSV were not opened. What changed at Dyer Island, and in January 2024, is not known.

## 3. Version B: what the file holds

- 46 lines: a header and 45 rows, one per year, **1979 to 2023, consecutive, no repeated year**. 27 columns: `Year` and **26 colonies**. No ragged row. Windows line endings; no final newline; no byte-order mark.
- Every cell is one of three things: a **whole number** (a count), **`NA`**, or **`0.1`**. No zero appears anywhere. No other decimal, no text.
- **The 0.1 values: eleven, in eleven colonies, always in the first or the last row.** At 1979: Robben Island, Simonstown, Stony Point, De Hoop. At 2023: Lamberts Bay, Marcus Island, Geyser Island, Brenton Island, Stag Island, Mercury, Pomona. That is a different and larger set than the four colonies named in the 2019 Dryad record's usage notes.
- **The script does not state the rule.** It reads the file (line 23) and passes columns straight to the model as a census; no line mentions the 0.1 values or treats them specially. So for this version, what a 0.1 means at each colony (a colony known to be empty, or something else) is **not established from the repository**. Mercury is the case to ask about: its last count is 315 in 2021, then 0.1 in 2023.
- The script takes columns 21 to 27 as "Namibia only": Mercury, Ichaboe, Halifax, Possession, Pomona, Plumpudding, Sinclair. So **19 South African and 7 Namibian colonies**, in the file's order.
- The unit is not stated in the repository. (For the 2019 file the Dryad record says occupied nests; that is not carried over.)

**Per colony** (counts are whole-number cells; "gaps inside" are NA years between the first and last count)

| Colony | Counts | First | Last | Gaps inside | 0.1 at | Lowest | Highest | Last count |
|---|---|---|---|---|---|---|---|---|
| Lamberts Bay | 19 | 1979 | 2005 | 8 | 2023 | 9 | 50 | 10 |
| Malgas Island | 37 | 1979 | 2023 | 8 | | 2 | 1,022 | 6 |
| Marcus Island | 27 | 1979 | 2018 | 13 | 2023 | 4 | 1,243 | 4 |
| Jutten Island | 33 | 1979 | 2023 | 12 | | 49 | 2,878 | 56 |
| Vondeling Island | 34 | 1979 | 2023 | 11 | | 63 | 649 | 63 |
| Dassen Island | 34 | 1979 | 2023 | 11 | | 1,806 | 24,901 | 2,037 |
| Robben Island | 40 | 1983 | 2023 | 1 | 1979 | 9 | 7,798 | 931 |
| Simonstown | 38 | 1985 | 2023 | 1 | 1979 | 2 | 1,227 | 845 |
| Seal Island False Bay | 18 | 1979 | 2019 | 23 | | 31 | 95 | 44 |
| Stony Point | 36 | 1982 | 2023 | 6 | 1979 | 1 | 2,533 | 1,200 |
| Dyer Island | 36 | 1979 | 2023 | 9 | | 903 | 22,655 | 903 |
| Geyser Island | 16 | 1979 | 2012 | 18 | 2023 | 1 | 328 | 2 |
| De Hoop | 7 | 2003 | 2023 | 14 | 1979 | 1 | 18 | 4 |
| Jahleel Island | 23 | 1981 | 2023 | 20 | | 24 | 578 | 24 |
| Brenton Island | 21 | 1986 | 2020 | 14 | 2023 | 3 | 38 | 4 |
| St Croix Island | 27 | 1979 | 2023 | 18 | | 712 | 19,478 | 712 |
| Seal Island Algoa Bay | 24 | 1979 | 2023 | 21 | | 26 | 510 | 33 |
| Stag Island | 21 | 1981 | 2017 | 16 | 2023 | 1 | 50 | 2 |
| Bird Island | 31 | 1979 | 2023 | 14 | | 314 | 5,376 | 1,722 |
| Mercury | 34 | 1985 | 2021 | 3 | 2023 | 315 | 3,666 | 315 |
| Ichaboe | 38 | 1979 | 2023 | 7 | | 13 | 4,200 | 13 |
| Halifax | 36 | 1981 | 2023 | 7 | | 334 | 1,466 | 603 |
| Possession | 36 | 1985 | 2023 | 3 | | 327 | 1,205 | 366 |
| Pomona | 11 | 1979 | 2019 | 30 | 2023 | 1 | 20 | 1 |
| Plumpudding | 19 | 1979 | 2023 | 26 | | 1 | 228 | 189 |
| Sinclair | 19 | 1979 | 2023 | 26 | | 21 | 124 | 21 |

"Last count" is the value in the colony's last counted year, which is not 2023 for eight colonies.

## 4. What this means for a chart (version B)

- **Individual colony series are possible, and the candidates are clear.** Fewest gaps inside the series: Robben Island and Simonstown (1 each), Mercury and Possession (3), Stony Point (6), Ichaboe and Halifax (7), Malgas (8), Dyer (9). The large colonies Dassen (11), St Croix (18) and Bird Island (14) have many gaps and would be drawn as broken series. How many gaps are acceptable for a visitor is a design choice for the build proposal; nothing is dropped here.
- **No fixed-coverage aggregate is available that covers the population.** No colony has a count in every year from 1979. From 1989 only Malgas and Simonstown are complete; from 2004 only Malgas, Simonstown, Stony Point, Dyer and Ichaboe. Those sets are a small and unrepresentative share. **A total made by adding the cells would be wrong**, as GPT warned: this file confirms it.
- National, regional and global figures therefore exist only as the paper's model output. The repository holds those outputs (folders `AP Output/Global`, `S.Africa`, `Namibia`, `W_Coast`, `S_Coast`, `E_Cape`, each with estimate, fit and trajectory files). They are out of scope for this audit and were not opened.
- Three cell states must stay distinct on any chart: a count, no count (NA), and the 0.1 marker. The marker is never drawn as a value.

**Result for version B: requires clarification.** Two things are missing and both are in the enquiry draft already: reuse terms, and the meaning of the 0.1 markers (and of the unit) for this version. With those, the file is usable for individual colony series.

## 5. Version A: what is needed

- The Dryad record (doi `10.5061/dryad.vx0k6djp7`) and its methods, usage notes and "Public domain" label were read on 20 Nov (proposal rev 2, §3.1). The file itself, `Afr_penguin.csv`, sits behind a bot check when requested by script.
- **Chad's part:** open the record in his own browser and click `Afr_penguin.csv`. It will download. That puts a 3.89 KB public-domain file in his Downloads folder, which departs from the brief's "nothing saved on the Mac"; it is his choice. Claude then reads it from there (one folder prompt), hashes and counts it, and writes part 2: the same table for A, and a cell-by-cell comparison of the colony-years the two files share.
- Until then nothing is claimed about A's contents beyond what its record says.

## 6. Not done, not claimed

- Version A's file: not seen.
- The two earlier commits of the version B file, and all model outputs: not opened.
- No comparison between A and B.
- No licence for B. No statement of B's unit from its own repository.
- The 2024 paper's methods (a PDF) were not read by Claude; whether they define the 0.1 markers for this version is not known to Claude.
- No chart, no display file, no build.
