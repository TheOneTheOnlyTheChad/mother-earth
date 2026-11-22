# Animals: audit A, African penguin counts

20 Nov 2026 · **rev 2.1** (rev 2 passed by GPT within its scope, `reviews/2026-11-20-animals-audit-a-gpt-review.md`; rev 2.1 carries GPT's wording refinements, figures unchanged) · read-only research under brief A (`docs/concepts/ANIMALS-EXPANSION-AUDIT-BRIEFS.md` rev 1.1). Chad's go: 20 Nov, his own message ("go"), taken as audit A first. Nothing built, nothing sent, no account. Claude retained no new raw working copies; Chad's downloaded ZIP remains in his Downloads.


**Where the source files are now (20 Nov 14:36 UTC):** on Chad's instruction they were moved from his Downloads to `~/Documents/Mother Earth/_source-data/animals-expansion/` on his Mac, each hash-checked there against this audit before the Downloads original was removed. That folder is local only: not in Git, not in any served folder. Statements below that the files are in his Downloads describe where they were when read.

**Results**
- **Version A (Dryad file, to 2019): usable**, for individual colony series, as a dated 2021 deposit. Public domain on its record; contents consistent with the record's notes. One caution: the author's later file revises some of its values (§6).
- **Version B (repository file, to 2023): requires clarification** (no licence; the rule for its 0.1 markers and its unit are not written down). Its contents are internally consistent.
- **The two files are not one series.** B is not a simple four-year extension of A: across the 902 colony-years they share there are **24 literal cell differences**, one of which is only a difference in how an empty cell is written (§6).

## 1. How this was done

- In a tab Claude opened in Chad's Chrome and closed afterwards, 20 Nov 2026, between 13:20:55 and 13:22:49 UTC (clock readings).
- Version B: seven requests to GitHub's public API from a `github.com` page, one at a time, no sign-in used by the requests: repository record, head commit, commit list for the CSV, file tree at the pinned commit, and the contents of three files at that commit. The files were held in the tab's memory, hashed and counted there. **Nothing was saved.** The figures below were read out of the tab as text.
- Version A, first attempt (13:21 UTC): one scripted request to the record's file link returned an HTML page titled "Validating..." from a bot-protection service, not the CSV. No further attempt was made.
- Version A, part 2 (13:25:59 to 13:26:22 UTC, clock readings): **Chad downloaded the dataset himself** (his message, 20 Nov) and granted his Downloads folder. Claude read `doi_10_5061_dryad_vx0k6djp7__v20210303 (1).zip` there, in the Mac shell, without unpacking it into Downloads; counted it; and compared it with version B, fetched again at the pinned commit (same 4,813 bytes and sha256 as in part 1). The working copies were in the shell's scratch folder and were removed. The two zip files in Downloads are Chad's; an identical one from 12:46 UTC was already there.
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
- **An available-cell sum is not a supported national or global population total.** No colony has a count in every year from 1979. From 1989 only Malgas and Simonstown are complete; from 2004 only Malgas, Simonstown, Stony Point, Dyer and Ichaboe. A consistently counted subset could be summed as that named subset; it could never stand for the population.
- National, regional and global figures therefore exist only as the paper's model output. The repository holds those outputs (folders `AP Output/Global`, `S.Africa`, `Namibia`, `W_Coast`, `S_Coast`, `E_Cape`, each with estimate, fit and trajectory files). They are out of scope for this audit and were not opened.
- Three cell states must stay distinct on any chart: a count, no count (NA), and the 0.1 marker. The marker is never drawn as a value.

**Result for version B: requires clarification.** Two things are missing and both are in the enquiry draft already: reuse terms, and the meaning of the 0.1 markers (and of the unit) for this version. With those, the file is usable for individual colony series.

## 5. Version A: the file

| | |
|---|---|
| Record | Dryad doi `10.5061/dryad.vx0k6djp7`, version of 3 Mar 2021 (the download is named `…__v20210303`) |
| Download | a zip of 4,034 bytes, sha256 `2106ce706f014f7d75008d117cba54a803664c279a5c96871396af0486866e11`, holding one file |
| File | `Afr_penguin.csv`, **3,890 bytes**, sha256 `9c57c16809d1b886c5000555b495551f7d7cb1802cfa70c6d67323a87f40d72c` |
| Licence | "Public domain" on the record (read 20 Nov). The zip carries no licence or readme file of its own |
| Unit and notes | on the record: occupied nests; NA and 0.1 as described there (proposal rev 2, §3.1) |

- 42 lines: a header and 41 rows, one per year, **1979 to 2019, consecutive, no repeated year**. 23 columns: `Year` and **22 colonies** (the first 18 South African and the last 4 Namibian, in the record's count). No ragged row. Windows line endings; no final newline.
- 902 cells: **600 whole-number counts, 298 without a count, 4 markers of 0.1.** No zero, no other decimal, no text. One of the 298 is an empty cell, not the letters NA (Seal Island Algoa Bay, 2003).
- **The four 0.1 markers are exactly where the record's usage notes say:** Lamberts Bay at the end (2019); Robben Island, Simonstown and Stony Point at the start (1979). So for this file the rule is written down: they are not counts and are left out.

| Colony | Counts | First | Last | Gaps inside | 0.1 at | Lowest | Highest | Last count |
|---|---|---|---|---|---|---|---|---|
| Lamberts Bay | 19 | 1979 | 2005 | 8 | 2019 | 9 | 50 | 10 |
| Malgas Island | 33 | 1979 | 2019 | 8 | | 5 | 1,022 | 6 |
| Marcus Island | 27 | 1979 | 2018 | 13 | | 4 | 1,243 | 4 |
| Jutten Island | 30 | 1979 | 2019 | 11 | | 67 | 2,878 | 138 |
| Vondeling Island | 32 | 1979 | 2019 | 9 | | 82 | 649 | 112 |
| Dassen Island | 31 | 1979 | 2019 | 10 | | 1,862 | 24,901 | 1,912 |
| Robben Island | 37 | 1983 | 2019 | 0 | 1979 | 9 | 7,798 | 1,190 |
| Simonstown | 34 | 1985 | 2019 | 1 | 1979 | 2 | 1,227 | 932 |
| Seal Island False Bay | 18 | 1979 | 2019 | 23 | | 31 | 95 | 44 |
| Stony Point | 31 | 1982 | 2019 | 7 | 1979 | 1 | 2,533 | 1,705 |
| Dyer Island | 32 | 1979 | 2019 | 9 | | 951 | 22,655 | 1,071 |
| Geyser Island | 16 | 1979 | 2012 | 18 | | 1 | 328 | 2 |
| Jahleel Island | 21 | 1981 | 2019 | 18 | | 50 | 578 | 55 |
| Brenton Island | 20 | 1986 | 2019 | 14 | | 3 | 38 | 10 |
| St Croix Island | 23 | 1979 | 2019 | 18 | | 3,638 | 19,478 | 3,638 |
| Seal Island Algoa Bay | 20 | 1990 | 2019 | 10 | | 78 | 510 | 95 |
| Stag Island | 20 | 1990 | 2017 | 8 | | 1 | 50 | 2 |
| Bird Island | 26 | 1981 | 2019 | 13 | | 572 | 5,376 | 2,378 |
| Mercury | 33 | 1985 | 2019 | 2 | | 1,126 | 3,666 | 2,221 |
| Ichaboe | 32 | 1985 | 2019 | 3 | | 242 | 3,343 | 242 |
| Halifax | 32 | 1981 | 2019 | 7 | | 259 | 2,224 | 825 |
| Possession | 33 | 1985 | 2019 | 2 | | 327 | 1,205 | 657 |

**For a chart from version A**
- Individual colony series: Robben Island has no gap from 1983 to 2019; Simonstown has one; Mercury and Possession two; Ichaboe three. The three largest colonies have many gaps (Dassen 10, St Croix 18, Bird Island 13).
- **An available-cell sum is not a supported national or global total here either.** No colony is counted in every year from 1979. From 1989: Malgas, Robben Island and Simonstown only. From 2004: nine colonies (Malgas, Jutten, Vondeling, Robben Island, Simonstown, Stony Point, Dyer, Mercury, Possession), without Dassen, St Croix or Bird Island. Those could be summed as that named subset and nothing more.
- What a chart may say: "Annual colony census: occupied nest sites (used as a breeding-pair proxy)", per colony, 1979 to 2019, gaps left open, the four markers left out, with the two countries' definitions and the 2021 deposit date.

**Result for version A: usable**, with the caution in §6.

## 6. The two files compared

- Colonies: all 22 of A's are in B under the same names. B adds four: De Hoop, Pomona, Plumpudding, Sinclair.
- Shared colony-years (22 colonies, 1979 to 2019): **902. Identical cells: 878. Literal cell differences: 24** (23 differences of value or state, and one of spelling only).

| Kind of difference | Number | Where |
|---|---|---|
| A count in both, with a different value | 12 | Vondeling 2018 (122 → 111); Mercury 2019 (2,221 → 2,305); Ichaboe 2017, 2018, 2019 (383 → 346, 255 → 317, 242 → 229); Halifax 1986, 2016, 2017, 2018 (259 → 389, 1,656 → 1,075, 2,224 → 1,466, 1,249 → 1,170); Possession 1985, 2018, 2019 (638 → 735, 798 → 657, 657 → 693) |
| A count in A, no count in B | 3 | Vondeling 2019 (112); Mercury 2018 (2,500); Possession 2016 (990) |
| No count in A, a count in B | 7 | Stony Point 1987 (41); Seal Island Algoa Bay 1979 (26); Stag Island 1981 (23); Bird Island 1979 (314) and 2002 (4,459); Ichaboe 1979 (4,200) and 2016 (444) |
| A's 0.1 marker, no entry in B | 1 | Lamberts Bay 2019 (B's marker is at 2023) |
| Empty cell in A, NA in B | 1 | Seal Island Algoa Bay 2003. The same state written differently; not a new value |

- Values are given as "A → B". Why they differ is not stated in either source and is not guessed here. Most are Namibian colonies and recent years.
- The differences are not called corrections: neither source says which value is right. The Lamberts Bay marker is described by where it sits in each file, with no reason inferred.
- **Consequences.** (1) The files cannot be joined; that rule now rests on evidence. (2) B's numbers are never shown under A's licence. (3) A chart from A says which version it uses (below). (4) Which version the authors recommend for the shared years is a fair question for them; the enquiry draft's request for "any corrected version" covers it, and GPT's optional extra sentence is noted in that draft.

**Chart note for a chart built from A (GPT's wording, adopted for the later build proposal)**

> Historical census data from the 2021 deposit, ending in 2019. The authors' later analysis file extends to 2023 and differs in some overlapping entries. This chart uses the earlier deposit throughout.

- Both sources are linked in the card's details, with a line that the later file's public-display terms are being clarified, if that is still true at release. The chart is never labelled "latest".
- A colony whose own values differ between the files says so in its details. A colony with no differences (Robben Island, for one) carries no such warning.
- The note does not replace reading a published correction or withdrawal if one is found later.
- "Usable" means a faithful, dated view of that deposit. It is not the latest population evidence and does not validate every historical census. An increase at one colony does not show recovery of the species. A slope is never computed by the page and shown as the source's trend.

**Before a build relies on this audit:** the parser and checks used here (the three cell states; empty cell treated as no count; markers left out; gaps counted between first and last count) are to be kept as a reproducible script with its own tests, in the build proposal. Raw inputs still stay out of the public repository.

## 7. Not done, not claimed

- The two earlier commits of the version B file, and all model outputs: not opened.
- No licence for B. No statement of B's unit or marker rule from its own repository.
- The papers' methods (PDFs) were not read by Claude.
- No explanation of any difference between the files.
- No chart, no display file, no build.
