# Animals — source audit of the two first study candidates

18 Nov 2026 · rev 1 · for GPT review · read-only research. Nothing built, nothing deployed, no provider contacted, nothing spent.

**Chad's scope (18 Nov):** inspect the Botswana zebra and archived blue-whale candidates; return dataset identity and DOI, licence and display rights, available files, observation dates, usable animal and point counts, tracking method, quality and uncertainty fields, sensitivity considerations and any costs; recommend one study for the first private journey preview.

**Recommendation: the Botswana zebra study, starting with animal `Z3866`.** Reasons in §4.

## 1. How this was done

- Both records were read on the Movebank Data Repository itself (`datarepository.movebank.org`), through the browser pane, 18 Nov 2026 16:45–16:48 UTC: the repository's record metadata, its file lists, and each file.
- 23 requests, one at a time, no sign-in, no account, no terms prompt. The request log is in `evidence-2026-11-18.json` beside this file.
- The two data files (15.7 MB and 4.4 MB) were read in the browser's memory and counted there. **They were not saved anywhere**: not in this repository, not on the Mac. Each file's byte length equals the length the repository lists. The repository lists MD5 checksums; these were not recomputed (the sha256 of what was received is recorded instead).
- Every figure below marked "counted" comes from those files as served. "Repository says" marks a figure taken from the record's metadata.
- Not read: the two journal papers themselves (only the abstracts carried in the records), the live Movebank study pages, and the full text of Movebank's General Terms of Use page (search-result extract only; see §5).

## 2. Botswana zebra

### Identity
| | |
|---|---|
| Data package | "Data from: In search of greener pastures: using satellite images to predict the effects of environmental change on zebra migration" |
| Package DOI | `10.5441/001/1.f3550b4f` (handle `10255/move.342`), issued 1 Aug 2013 |
| Parts | `…f3550b4f/1` tracking data "Migratory Burchell's zebra (Equus burchellii) in northern Botswana"; `…f3550b4f/2` reference data |
| Data authors | Bartlam-Brooks HLA, Harris S |
| Paper | Bartlam-Brooks, Beck, Bohrer, Harris (2013), *Journal of Geophysical Research: Biogeosciences*, doi `10.1002/jgrg.20096` |
| Movebank study ID | 10898263 |
| Taxon as recorded | *Equus burchellii*; taxon detail *Equus burchelli antiquorum* |
| Repository says | 7 animals, 53,793 locations, sensor GPS |

### Licence and display rights
- Record metadata: `CC0 1.0 Universal`. The README in the package says the same and adds that the work "must still be appropriately cited following professional and ethical standards for academic citation".
- The README also says "We highly recommend that you contact the data creator if possible" when re-using the data. That is a recommendation, not a condition of the licence. No message has been sent; sending one is Chad's decision.
- No display restriction, embargo or custom terms appear on the record or in the README.
- Required for REGISTER before any public use: the operative licence sentence pasted by Chad from the record page, per the register rule. Not filed yet.

### Files (as served 18 Nov 2026)
| File | Bytes | sha256 of what was received |
|---|---|---|
| `Migratory Burchell's zebra (Equus burchellii) in northern Botswana.csv` | 15,651,785 | `c91054627d7d60d50cd9cb59b3d52609df5d17e6985d147742bcf9a6da488824` |
| `…-reference data.csv` | 1,251 | `4faceb06b40002f64d1c1e77a33a8df52c9cc5c8825979563d027eb1dff5fd8b` |
| `README.txt` | 9,421 | `9c96d81f15e799f94d90fa4d091a8ea6a2fbcd5a1d0d5dd5455cd397924342d1` |

### Tracking method
- GPS collars, Vectronic Aerospace GPS-Plus 4D (three animals, 2007–08) and GPS-Plus IRIDIUM 4D (four animals, 2008–09), 950 g, all on adult females (two aged 3–5 years, five over 5 years).
- Reference data gives the duty cycle as "hourly fixes". **Counted: about 62% of intervals are one hour and about 38% are 15 minutes.** The 15-minute fixes fall on particular days (15 to 72 days per animal), spread evenly through the day. Why is not stated in the package.
- Timestamps are UTC ("or GPS time, which is a few leap seconds different", README). A study-local time (Central African Time) is also given.

### Dates and counts (counted)
- 53,794 rows; 16 columns; every row has the same number of fields; no unreadable timestamp; no duplicate event id; rows already in time order per animal.
- 17 rows have no coordinates (a fix was attempted and none was recorded): 13 for `Z3743`, 3 for `Z3866`, 1 for `Z3864`.
- 1 row is marked `manually-marked-outlier = true` and `visible = false` (`Z3743`, 15 Jul 2008 15:01 UTC, at 19.7°N 135°W).
- **Usable fixes (visible, with coordinates): 53,776 across 7 animals.** The repository's 53,793 is the count of visible rows, including the 17 without coordinates.
- Observation period: **25 Oct 2007 00:02 UTC to 1 Jun 2009 15:00 UTC**, in two cohorts.

| Animal | First fix (UTC) | Last fix (UTC) | Days | Usable fixes | Gaps over 3 h | Longest gap | What the fixes show |
|---|---|---|---|---|---|---|---|
| `Z3866` | 25 Oct 2007 | 22 Oct 2008 | 363.6 | 13,045 | 0 | 2.0 h | Out in Nov 2007, back in May–Jun 2008, then at the delta until October. **Complete out-and-back.** |
| `Z3743` | 28 Oct 2007 | 28 Aug 2008 | 305.4 | 10,911 | 1 | 10.8 h | Out in Nov 2007, back in May 2008. **Complete out-and-back.** |
| `Z6407` | 27 Aug 2008 | 27 May 2009 | 273.2 | 9,680 | 0 | 2.0 h | Out in Nov 2008; record ends in May 2009 west of the grasslands, 121 km from its first fix. |
| `Z6399` | 24 Oct 2008 | 1 Jun 2009 | 220.2 | 6,389 | 1 | 11.0 h | Out in Nov 2008; return in Apr–May 2009; record ends 47 km from its first fix. |
| `Z6405` | 27 Aug 2008 | 31 Mar 2009 | 216.6 | 6,194 | 2 | 8.0 h | Out in Nov 2008; record ends on the grasslands side. |
| `Z6402` | 24 Oct 2008 | 21 Apr 2009 | 179.0 | 4,837 | 88 | 38.4 h | Out in Nov 2008; record ends in Apr 2009, 140 km from its first fix. Many missed fixes from Feb 2009. |
| `Z3864` | 25 Oct 2007 | 5 Jan 2008 | 72.2 | 2,720 | 1 | 35.2 h | Out in Nov 2007; record ends on the grasslands side. |

- Extent of usable fixes: 19.21°S to 20.81°S, 23.42°E to 25.35°E. No date-line or pole case.
- Farthest distance from each animal's first fix: 203 to 215 km (great-circle, counted). The Movebank account says "over 200 km". **The files do reproduce the journey described** (rev 1 §6A asked): every animal moves from about 23.6°E 19.4°S to about 25.0°E 20.6°S in November.
- One thing for the build to look at: `Z6405`'s second fix is 15.1 km from its first, one hour later (27 Aug 2008 06:01 UTC). In the other six animals no step implies more than 9.4 km/h. Whether the first fix predates the collar being on the animal is not stated in the package.

### Quality and uncertainty fields
- **None per fix.** The file carries no dilution-of-precision value, satellite count, fix type or error estimate. The only quality information is the outlier flag (1 row) and the rows without coordinates (17).
- So a display can say what the method is (GPS collar) and what was flagged. It cannot state a location accuracy from this dataset. "Location uncertainty: not supplied by the dataset."

### Sensitivity considerations
- Completed historical tracks, 17 to 19 years old, already public under CC0 at full precision since 2013.
- The fixes lie between the south-eastern Okavango Delta and the Makgadikgadi grasslands. No den, nest, breeding site or individual home range of a currently living animal is exposed by data this old.
- Animal identifiers are collar-derived codes (`Z3866`), not names.
- The species' assessed extinction risk was **not looked up in this audit** (the conservation source has not been reviewed; proposal §7). No sensitivity treatment beyond "completed historical track" is proposed. GPT to say if it reads this differently.

### Costs
- No fee, account or agreement was needed to read the record or the files.
- A display file for all seven animals at full resolution is about 645 KB before compression and about 275 KB gzipped (three 32-bit numbers per fix, a simple encoding tried in the pane); one animal (`Z3866`) is about 157 KB and 66 KB. Thinned to one fix an hour the seven animals have 38,436 fixes.
- A private preview reads a local file: no hub, storage or request cost. Public hosting cost is for the release proposal, not measured here.

## 3. Eastern North Pacific blue whales

### Identity
| | |
|---|---|
| Data package | "Data from: Behavioural estimation of blue whale movements in the Northeast Pacific from state-space model analysis of satellite tracks" |
| Package DOI | `10.5441/001/1.5ph88fk2` (handle `10255/move.837`), issued 8 Feb 2019 |
| Parts | `…5ph88fk2/1` "Blue whales Eastern North Pacific 1993-2008 - Argos Data"; `…5ph88fk2/2` reference data |
| Data authors | Mate BR, Palacios DM, Irvine LM, Follett TM (the README's citation also lists Bailey H) |
| Papers | Bailey et al. (2009), *Endangered Species Research* 10: 93–106, doi `10.3354/esr00239`; six further papers listed on the record, including Abrahms et al. (2019), doi `10.1073/pnas.1819031116` |
| Movebank study ID | 650188969 |
| Taxon as recorded | *Balaenoptera musculus* |
| Repository says | 143 animals, 15,778 locations. The record's sensor field reads "GPS"; the title, the README and 16,106 of 16,249 rows say Argos. |

### Licence and display rights
- Record metadata and README: `CC0 1.0 Universal`, with the same citation sentence and the same recommendation to contact the data creator as the zebra package.
- No display restriction, embargo or custom terms on the record or in the README.

### Files (as served 18 Nov 2026)
| File | Bytes | sha256 of what was received |
|---|---|---|
| `Blue whales Eastern North Pacific 1993-2008 - Argos Data.csv` | 4,353,684 | `43178b0d2313a44d90dbe519d3ef767e5fd65b7a233c8532d42156e7fb53e5a6` |
| `…-reference-data.csv` | 30,266 | `f321895e9cfc07effd8dfd288e448ca7ab40ea71943bddda211d43dbfc6a3c37` |
| `README.txt` | 15,043 | `0814e3e6a30db68c357fe4b3bfa518267daf040bc1035303dcc4e89157b516a4` |

### Tracking method
- Implanted satellite tags located by Argos Doppler shift: Telonics ST15 (109 tags), ST10 (15), ST6 (12), ST21 (6) and one Wildlife Computers MK10. All animals recorded as adults; sex recorded for 38 (20 male, 18 female), blank for 105.
- Each animal's first row is a `gps` row: the position where the tag was put on (143 rows). The other 16,106 rows are Argos locations.
- **The package holds the Argos locations, not the modelled tracks.** The 2009 paper's results come from a state-space model fitted to these locations; that model's output is not in the package.

### Dates and counts (counted)
- 16,249 rows; 21 columns; no ragged row; no unreadable timestamp; every row has coordinates.
- 471 rows are marked `manually-marked-outlier = true` and `visible = false`. README: "Locations on land and extreme outliers were manually flagged."
- **Visible rows: 15,778 across 143 animals** (15,635 Argos locations and 143 tagging positions). This matches the repository's count.
- Observation period: **28 Aug 1993 18:20 UTC to 10 Apr 2009 12:34 UTC.** The title says 1993–2008, which is the range of tagging years; the last tag reported into April 2009.
- Animals by tagging year: 1993: 4 · 1994: 9 · 1995: 14 · 1998: 9 · 1999: 19 · 2000: 12 · 2001: 1 · 2002: 2 · 2004: 19 · 2005: 15 · 2006: 11 · 2007: 15 · 2008: 13.
- The paper's abstract says 159 whales were tagged in 1993–2007 and 92 tracks lasted more than 7 days. The package holds 143 animals over 1993–2008, of which 110 span more than 7 days. The two are different selections; the package does not explain the difference.

| Track length (visible rows) | Animals |
|---|---|
| Fewer than 10 rows | 33 |
| 10 or more rows | 110 |
| 100 or more rows | 56 |
| Spanning 30 days or more | 90 |
| Spanning 100 days or more | 44 |

- Longest span: `2004CA-Bmu-00840`, 20 Aug 2004 to 6 Jan 2006, 504 days, 317 rows, 7 gaps over 10 days. Most rows: `2007CA-Bmu-10836`, 456 rows over 250 days (8 Sep 2007 to 16 May 2008), longest gap 5.3 days.
- Time between consecutive visible locations, all animals together: median 9.9 h; one in ten is longer than 37 h; one in a hundred longer than 133 h; the longest is 261 days.
- Extent: 6.2°N to 53.1°N, 151.6°W to 87.5°W. No date-line crossing.

### Quality and uncertainty fields
- `argos:lc` (location class) on the 15,635 visible Argos locations:

| Class | Count | Share |
|---|---|---|
| 2 | 653 | 4% |
| 1 | 2,080 | 13% |
| 0 | 4,266 | 27% |
| A | 2,781 | 18% |
| B | 4,690 | 30% |
| Z | 1,039 | 7% |
| not given | 126 | 1% |

  No location has class 3. The README defines the field by reference to the Argos User's Manual (2011) and gives no distances. The usual reading (classes 3, 2, 1 carry an accuracy estimate; 0, A and B carry weaker or none; Z is an invalid location) was **not checked against the manual in this audit.**
- Also present: both Argos position solutions (`argos:lat1/lon1`, `argos:lat2/lon2`), `argos:iq`, message counts (`argos:nb-mes`, `argos:nb-mes-120`), signal strength and frequency. No error-ellipse fields.
- **The visible rows are not a cleaned track.** Counted on visible rows at least 15 minutes apart: 115 of the 143 animals have at least one step implying more than 20 km/h, and some steps imply thousands of km/h. Joining consecutive rows with lines would draw movements the animals did not make.
- A replay from this package therefore needs a stated quality rule first (which classes are drawn, how an implausible step is treated, which of the two Argos solutions is used), and that rule would be ours, not the source's. It needs its own short proposal.

### Sensitivity considerations
- Completed historical tracks, 17 to 33 years old, public under CC0 at full precision since 2019.
- Open-ocean and coastal positions at Argos precision. No haul-out, nest or den applies.
- Identifiers are tag-derived codes.
- The species' assessed extinction risk and any stock-level guidance were **not looked up in this audit.** GPT to say if a generalisation is still expected for a whale dataset this old.

### Costs
- No fee, account or agreement was needed. All visible rows encode to about 189 KB (114 KB gzipped) with the same simple encoding.

## 4. Recommendation for the first private journey preview

**Botswana zebra, `10.5441/001/1.f3550b4f`, animal `Z3866` first, `Z3743` second.**

| | Zebra | Blue whale |
|---|---|---|
| Licence on the record | CC0 1.0 | CC0 1.0 |
| Method | GPS collar | Argos Doppler |
| Fixes per animal | thousands, hourly or better | median 59 visible rows |
| Gaps | 93 over 3 h in 53,776 fixes; 88 of them in one animal | median gap 9.9 h; multi-day gaps common |
| Cleaning needed before lines can be drawn | none found (1 flagged outlier, already excluded) | yes: a quality rule of our own |
| Source's own uncertainty | not supplied | location class per fix |
| A complete journey in one animal | yes: two animals out and back | partial seasons |
| Replay honest with "last recorded fix + connecting line" | yes | only after the quality rule is agreed |

- `Z3866` has a full year, a complete out-and-back, no gap over 3 hours and no flagged row. It is the cleanest test of observation-based playback.
- The zebra dataset has no per-fix uncertainty, so the preview must say so in words. That is a wording requirement, not a blocker.
- The whale dataset is usable and is the better test of uncertainty display, but only as the second preview, after a quality-rule proposal.

## 5. What stays open

- **Both studies are closed archives.** Neither is live or regularly updated. Chad's feature rule (15 Nov) is live or regularly updated feeds only. The private preview does not settle that; the revised proposal makes it a decision before any public release.
- Movebank's General Terms of Use were read only as a search-result extract (owner permission not required for publicly downloadable CC0 studies; citation encouraged). The full page should be read, and the operative sentence pasted by Chad, before a REGISTER entry.
- The repository files were read without the MD5 comparison.
- The papers were not read beyond their abstracts. A statement about what the animals were doing (migration timing, causes) needs the paper, not this audit.
- Conservation assessment and population series: no source audited. Nothing about status or trend is claimed here.
- Argos location-class accuracies: not checked against the manual.
