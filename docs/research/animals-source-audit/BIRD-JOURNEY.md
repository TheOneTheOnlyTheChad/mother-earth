# Animals: audit D, bird journey (two albatross packages)

20 Nov 2026 · **rev 1.2** (GPT closed the corrections on rev 1.1, `reviews/2026-11-20-animals-audits-c-d-closure-gpt-review.md`; rev 1.2 makes its record updates only) · rev 1.1 (rev 1 accepted by GPT as source-feasibility work with corrections, `reviews/2026-11-20-animals-audits-c-d-gpt-review.md`; rev 1.1 carries them and adds the two reference-data files, read at 14:18 UTC) · read-only research under brief D (`docs/concepts/ANIMALS-EXPANSION-AUDIT-BRIEFS.md` rev 1.1), on Chad's go of 20 Nov. Nothing built, nothing sent, no account. Claude retained no raw working copies; the files Chad downloaded remain in his Downloads.


**Where the source files are now (20 Nov 14:36 UTC):** on Chad's instruction they were moved from his Downloads to `~/Documents/Mother Earth/_source-data/animals-expansion/` on his Mac, each hash-checked there against this audit before the Downloads original was removed. That folder is local only: not in Git, not in any served folder. Statements below that the files are in his Downloads describe where they were when read.

**Results**
- **Waved albatross, Galápagos: usable as a source, at feasibility level.** Structural checks passed and the rows without a position were identified; each positioned fix carries the tag's own accuracy estimate (not an independently measured error and not a quality pass); no date-line crossing anywhere in the file. **Recommended package; Chad agreed on 20 Nov.**
- **Grey-headed albatross, New Zealand: six candidates without date-line crossings; the other 18 birds cross the date line.** One bird has a timestamp anomaly and is set aside.
- **Provisional first-choice bird: Galápagos `3275-30662`** (1,326 fixes over 84 days, 1,807 km from its first fix at the farthest). **Its reference row is now read (§5):** adult, tagged 23 June 2008 at Punta Cevallos, nest stage "egg", no manipulation, and it is the bird the paper shows in its Figures 7 and 8. The record is a set of recorded movements over a breeding season, **not one trip and not a migration**.
- Rev 1's gap (reference data unread) is closed for both packages. Sex is not recorded in either file.

## 1. How this was done

- Chad downloaded the two data files himself and attached the two README files to the conversation. Claude read the data files in the Mac shell, from his Downloads, between 13:57:25 and 13:59:09 UTC (clock readings), 20 Nov 2026. The script ran in the shell's scratch folder, which was then removed.
- Repository pages were read in Chad's Chrome earlier today (licence, titles, file list).
- Each README ends with a repository support address; it is not written here.

## 2. Identity and rights

| | Grey-headed albatross | Waved albatross |
|---|---|---|
| Package | Movebank Data Repository doi `10.5441/001/1.694p666h` | doi `10.5441/001/1.3hp3s250` |
| Data file | `Grey-headed albatross, New Zealand (data from Torres et al. 2017).csv`, **16,781,164 bytes**, sha256 `7149906a043f18d3a179cedc240cfcf6c106a7f9ca172fa2647939e7ea82dda6` | `Galapagos Albatrosses.csv`, **4,913,156 bytes**, sha256 `1b62b43cfce5067193cde0fc1c5b6144eff193bd7c995160961479921fd4a8e6` |
| Species as recorded | *Thalassarche chrysostoma* | *Phoebastria irrorata* |
| Paper (README) | Torres, Orben, Tolkova, Thompson 2017, *PLoS ONE* 12(1): e0168513 | Dodge and co-authors 2013, *Movement Ecology* 1:3 |
| Data citation (README) | Thompson, Torres, Sagar, Kroeger, Orben 2017. The README's title for the package ("Animal movement analysis through residence in space and time") differs from the repository page's ("Classification of animal movement behavior through residence in space and time"); the doi is the same | Cruz, Proaño, Anderson, Huyvaert, Wikelski 2013 |
| Licence (README and record) | CC0 1.0; "must still be appropriately cited" | the same |
| Contact | both READMEs "highly recommend" contacting the data creator when re-using the data. A recommendation, not a condition. No message has been sent; that is Chad's decision | |
| Time convention (README) | UTC, or GPS time, which differs by a few leap seconds | the same |
| Stated in the README | "Locations collected by these tags within 5 km of the colony were not included in the published analysis and are not included in this dataset." | nothing comparable |

The page sizes ("16 MB", "4.69 MB") are labels; the byte counts above are from the files.

## 3. Grey-headed albatross: the file

- 93,474 rows, 10 columns, no ragged row, no repeated event id, all rows GPS, all visible, every row has coordinates. **24 birds.**
- **No quality or accuracy field.** No outlier flag is set.
- Longitudes run from −179.999863 to 179.999908: the −180 to 180 convention, with fixes on both sides of the date line. Latitudes 60.6°S to 41.6°S.
- Fix interval: median 5 to 6 minutes. Records of 8 to 22 days, 14 October to 12 December 2013, **for 23 of the 24 birds; `90494` is the exception (below).**
- No repeated times and no out-of-order rows within any bird.
- The six birds below are six candidates without the date-line obstacle, not six fully qualified journeys (GPT).
- **Date-line crossings** (counted after confirming the −180 to 180 convention: a step whose longitude changes by more than 180° between consecutive fixes; no fix lies exactly on ±180):

| Birds with no crossing (6) | Fixes | Days | Farthest from first fix km |
|---|---|---|---|
| `23059` | 3,551 | 12.7 | 738 |
| `29155` | 3,618 | 13.0 | 919 |
| `49364` | 2,582 | 11.0 | 792 |
| `62093` | 4,361 | 15.9 | 1,006 |
| `89570` | 3,963 | 14.1 | 896 |
| `90434` | 4,657 | 16.8 | 764 |

  The other 18 birds cross between 2 and 30 times each. The longest-ranging birds (`90493` 2,707 km; `89518` 2,634 km; `2` 2,316 km) all cross.
- **Speed, as a diagnostic only:** the highest speed implied between consecutive fixes is 83 to 138 km/h per bird; no step exceeds 150 km/h. No exclusion rule is proposed from this.
- **Anomaly: bird `90494`.** Its timestamps run from 11 January to 11 December 2013 with one gap of 720 hours (30 days), while every other bird is tracked for under 22 days in October to December. The pattern would fit dates with day and month exchanged, but that is a guess and the source says nothing. **Set aside, not used, not explained.** GPT confirmed the timestamps are so in the source (not a parsing error) and that the bird need not be chased; if it is ever proposed for display, an authoritative correction is sought first. The reference file gives this bird's deployment as 2013-01-11 00:00, the only deployment with no time of day and the only one outside October to November, so the oddity is in both files.
- Because fixes within 5 km of the colony were removed by the authors, a track here does not begin or end at the colony.

## 4. Waved albatross: the file

- 16,414 rows, 28 columns, no ragged row, no repeated event id, all rows GPS, all visible. **28 birds.**
- **386 rows have no position** (status `D`, "no valid data", fix type 0). The other 16,028 have status `A` and a 3D fix.
- **A horizontal accuracy estimate on every positioned fix:** 1.28 m at best, median 4.35 m, 95% under 16.9 m, worst 84.74 m (the tag maker's own estimate, as the README defines it).
- Longitudes 91.37°W to 77.52°W, latitudes 12.79°S to 0.18°N: between the Galápagos and the coast of South America. **No date-line crossing; nowhere near it.**
- Fix interval: 90 minutes. 31 May to 6 November 2008.
- No repeated times and no out-of-order rows within any bird. Highest implied speed 61 km/h.
- **11 of the 28 records have less than 10 km displacement from their first positioned fix; the reasons are not established** (GPT's wording; rev 1 called them "not journeys", which displacement alone cannot show). The reference file marks 19 of the 28 birds "not used in analysis" and 9 as used.

| Birds that travel more than 1,000 km from the first fix | Fixes | First | Last | Days | Longest gap h | Farthest km | Path km |
|---|---|---|---|---|---|---|---|
| `3275-30662` | 1,326 | 23 Jun 2008 | 15 Sep 2008 | 83.8 | 9.0 | 1,807 | 14,395 |
| `4266-84831108` | 1,113 | 31 May 2008 | 9 Aug 2008 | 70.1 | 4.5 | 1,497 | 9,397 |
| `4262-84830876` | 573 | 31 May 2008 | 6 Jul 2008 | 35.9 | 3.0 | 1,474 | 4,093 |
| `4265-8483009431` | 633 | 31 May 2008 | 11 Jul 2008 | 40.9 | 25.5 | 1,435 | 4,662 |
| `2131-2131` | 647 | 23 Jun 2008 | 3 Aug 2008 | 40.6 | 3.0 | 1,413 | 5,094 |
| `4264-84830852` | 757 | 31 May 2008 | 17 Jul 2008 | 47.3 | 3.0 | 1,347 | 5,939 |
| `4267-84830990` | 757 | 31 May 2008 | 17 Jul 2008 | 47.3 | 3.0 | 1,346 | 4,821 |
| `1163-1163` | 1,503 | 23 Jun 2008 | 28 Sep 2008 | 96.8 | 34.5 | 1,298 | 15,491 |
| `4261-2228` | 977 | 31 May 2008 | 3 Aug 2008 | 63.9 | 6.0 | 1,254 | 9,198 |
| `unbanded-156` | 1,552 | 19 Jun 2008 | 13 Oct 2008 | 116.4 | 183.0 | 1,039 | 6,429 |

  "Path km" is the sum of straight steps between fixes, not a distance flown.

## 5. What is not known, and why

**Reference data, read 20 Nov 14:18 UTC from Chad's Downloads (rev 1.1).**

| | Waved albatross | Grey-headed albatross |
|---|---|---|
| File | `Galapagos Albatrosses-reference-data.csv`, 6,066 bytes, sha256 `1d7b24cf119f65ba7c90358b52ed5d29ec07b1b87c61ca6960b4bfad108061ad` | `Grey-headed albatross, New Zealand (data from Torres et al. 2017)-reference-data.csv`, 4,183 bytes, sha256 `1af2559474818c1d985658b9b3656e2baa81e6f940fdc488b57d1d301b22f89a` |
| Rows | 28, one per bird | 24, one per bird |
| Sites | Punta Suarez 12 · Punta Cevallos 10 · Isla de la Plata 6 | Campbell Island, all 24 |
| Life stage | adult, all | adult, all; reproductive condition "incubating", all |
| Nest stage comment | "egg" 9 · "downy chick" 1 · blank 18 | (no such field) |
| Tag and schedule | e-obs, 22 g, a fix every 90 minutes; read out wirelessly | igotU GT-600, a fix every 5 minutes; tag retrieved |
| Attachment · manipulation | tape and cable ties · none | tape · none |
| Deployment comment | "used in analysis" 8 · "used in analysis and shown in Figs 7-8" 1 · "not used in analysis" 19 | (no such field) |
| Deployment coordinates | given to two decimals, one pair per site | one pair for all |
| Sex | not recorded | not recorded |

**The proposed bird, `3275-30662`:** tag 132; adult; deployed 2008-06-23 at Punta Cevallos; nest stage "egg"; 22 g e-obs tag; "GPS locations recorded every 90 minutes"; tape and cable ties; manipulation none; **"used in analysis and shown in Figs 7-8"**. No limitation is recorded for it. The first fix in the data file (23 June 17:58 UTC) fits the deployment date.

**Paper context for the waved package (Dodge and co-authors 2013), from a summarising fetch of the open-access full text, not a full read by Claude; to be re-read before any wording is shown:** 28 adults tagged at the start of incubation; nine birds analysed, chosen for extensive movement over most of June to September 2008; the movements are described as long-range trips to foraging areas off Peru with transit flights to and from the Galápagos; the paper does not call them migration. Its Figures 7 and 8 show one bird with 1,326 locations from 23 June to 15 September 2008, which matches this bird's count and dates. The summary reports no account of GPS error or tag effects in the paper.

**Grey-headed context is GPT's reading** of Torres and co-authors 2017, methods: Campbell Island, adult incubation foraging trips, five-minute GPS schedule, colony-near fixes removed. Study-level context; not a check of any one deployment. The reference file agrees on site, stage and schedule.

**GPT's direct check (closure review; GPT's reading of the publisher's HTML: case study, data collection, Figures 7–8 and discussion):** breeding adults, 90-minute GPS sampling, nine extensively moving birds analysed; the captions of Figures 7 and 8 give 1,326 locations and 23 June to 15 September 2008; the discussion describes repeated outward and return movements involving the Peruvian coast. With the reference row's own link to those figures, the identification is supported. **This replaces the re-read asked for above, for the narrow label below.** The summary's remark that the paper gives no account of GPS error is not a finding that there is no error or tag effect.

**Label, accepted by GPT:** "Recorded movements of one breeding adult, 23 June to 15 September 2008", with species and source context nearby, and the site and nest stage as the source gives them. It does not say the bird was incubating throughout, and it gives no number of trips. Not "migration", and not "a foraging trip" in the singular: the record spans several departures and returns, which have not been counted or segmented here. The paper's own description can be quoted as the paper's once re-read.

**Deployment coordinates are research context, not automatically display fields** (GPT). Whether the colony position and colony-side fixes are shown at full precision stays an explicit decision.

## 6. Recommendation

- **Package: waved albatross, Galápagos.** No date-line work is needed, each fix carries an accuracy estimate (the first journey on the page that could state one from the source), and the 90-minute interval gives small files.
- **Bird: `3275-30662`, provisional first choice** (GPT confirmed 1,326 positioned fixes, 23 June to 15 September 2008, longest gap about 9.004 hours). The farthest-ranging, and the one the paper illustrates. Second choice `4266-84831108` (Punta Suarez, "used in analysis", longest gap 4.5 hours).
- **For the build proposal (GPT):** define missing-fix and gap handling from this study's 90-minute schedule and the intended portrayal; the time convention; rounding; which quality fields are kept. Rows without a position never become zeros or interpolated points. If an accuracy claim is shown per fix, the accuracy value stays attached to its fix through processing (the trial format below drops it).
- A gap rule is set for this study at the build proposal (fixes are 90 minutes apart by schedule); none is carried over from the zebra.
- **Grey-headed albatross: keep as the date-line test case.** It is the right dataset for proving the crossing tests of the proposal's §10, with a bird that crosses 30 times (`61696`) and six that never do.

**Trial display size (a measurement of a plain trial format, not an approved encoding):** three arrays (time in seconds, latitude and longitude to five decimals) as compact JSON.

| Bird | Fixes | JSON bytes | Compressed | Bytes a fix |
|---|---|---|---|---|
| Galápagos `3275-30662` | 1,326 | 39,530 | 13,567 | 29.8 |
| Galápagos `unbanded-159` (most fixes) | 2,339 | 69,654 | 19,199 | 29.8 |
| Grey-headed `90493` | 3,558 | 112,710 | 36,705 | 31.7 |
| Grey-headed `89518` (most fixes) | 5,959 | 188,331 | 59,883 | 31.6 |

This format omits the accuracy field and everything else the existing journey encoding carries; it is an indication of scale only.

## 7. Sensitivity considerations (not conclusions)

- Waved albatross: its breeding is almost wholly on one Galápagos island, which is public knowledge; the tracks are from 2008; the file gives positions at the colony to a few metres. The at-sea part off South America is where the birds meet fisheries. Whether colony-side fixes should be shown at full precision is a decision for the release review.
- Grey-headed albatross: the authors already removed fixes within 5 km of the colony.
- No finding is made that either display is risk-free.

## 8. Not done, not claimed

- Both papers: not read in full by Claude (the waved paper through a summarising fetch only; the grey-headed methods are GPT's reading).
- Trips within the chosen bird's record: not counted or segmented.
- No message to the data creators; GPT: none is required merely because the READMEs recommend contact.
- No reason given for the `90494` anomaly.
- No gap rule, no quality rule, no display file, no build.
- The trial sizes are not the existing encoding and are not a cost estimate.
