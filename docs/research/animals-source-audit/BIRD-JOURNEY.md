# Animals: audit D, bird journey (two albatross packages)

20 Nov 2026 · rev 1 · for GPT · read-only research under brief D (`docs/concepts/ANIMALS-EXPANSION-AUDIT-BRIEFS.md` rev 1.1), on Chad's go of 20 Nov. Nothing built, nothing sent, no account. Claude retained no raw working copies; the files Chad downloaded remain in his Downloads.

**Results**
- **Waved albatross, Galápagos: usable.** Clean GPS file, an accuracy estimate on every fix, no date-line crossing anywhere in the file. **Recommended package.**
- **Grey-headed albatross, New Zealand: usable for 6 of 24 birds without date-line support; the other 18 cross the date line.** One bird has a timestamp anomaly and is set aside.
- **Recommended bird:** Galápagos `3275-30662` (1,326 fixes over 84 days, 1,807 km from its first fix at the farthest). Label: the neutral "recorded journey" until the reference data are read.
- **Gap in this audit:** the two reference-data files were not among the downloads, so breeding stage, deployment site, sex and tag details are unread (§5).

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
- Fix interval: median 5 to 6 minutes. Trips of 8 to 22 days, 14 October to 12 December 2013.
- No repeated times and no out-of-order rows within any bird.
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
- **Anomaly: bird `90494`.** Its timestamps run from 11 January to 11 December 2013 with one gap of 720 hours (30 days), while every other bird is tracked for under 22 days in October to December. The pattern would fit dates with day and month exchanged, but that is a guess and the source says nothing. **Set aside, not used, not explained.**
- Because fixes within 5 km of the colony were removed by the authors, a track here does not begin or end at the colony.

## 4. Waved albatross: the file

- 16,414 rows, 28 columns, no ragged row, no repeated event id, all rows GPS, all visible. **28 birds.**
- **386 rows have no position** (status `D`, "no valid data", fix type 0). The other 16,028 have status `A` and a 3D fix.
- **A horizontal accuracy estimate on every positioned fix:** 1.28 m at best, median 4.35 m, 95% under 16.9 m, worst 84.74 m (the tag maker's own estimate, as the README defines it).
- Longitudes 91.37°W to 77.52°W, latitudes 12.79°S to 0.18°N: between the Galápagos and the coast of South America. **No date-line crossing; nowhere near it.**
- Fix interval: 90 minutes. 31 May to 6 November 2008.
- No repeated times and no out-of-order rows within any bird. Highest implied speed 61 km/h.
- **Many birds barely move**: 11 of the 28 stay within 10 km of their first fix for the whole record (tags on birds that stayed at the colony, or short records). They are not journeys.

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

- **The reference-data files were not read** (`…-reference-data.csv`, 4.08 KB and 5.92 KB). They hold, by the READMEs' attribute lists, life stage, reproductive condition, deployment site and coordinates, attachment, tag model and comments. So the kind of trip (incubation or chick-rearing foraging, or something else), the colony as the source names it, and any deployment comment are unread. They are two small files on the same two pages.
- Neither paper was read. Both are method papers; what they say about these trips is not established.
- Hence the neutral label "recorded journey", and no word such as "foraging trip" or "migration", until then.

## 6. Recommendation

- **Package: waved albatross, Galápagos.** No date-line work is needed, each fix carries an accuracy estimate (the first journey on the page that could state one from the source), and the 90-minute interval gives small files.
- **Bird: `3275-30662`.** The farthest-ranging, 84 days, 1,326 fixes, longest gap 9 hours. Second choice `4266-84831108` (longest gap 4.5 hours).
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

- Reference data and both papers: unread.
- No reason given for the `90494` anomaly.
- No gap rule, no quality rule, no display file, no build.
- The trial sizes are not the existing encoding and are not a cost estimate.
