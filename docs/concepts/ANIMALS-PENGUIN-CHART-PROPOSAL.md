# Animals: African penguin colony census chart. Build proposal

21 Nov 2026 · **rev 1** · docs only · for GPT's review, then Chad's decisions. **Nothing is built. No approval is requested for a build, a merge or a deployment.**

Authority: Chad's order of 20 Nov ("bird, dated penguin chart from version A through 2019, then corridor") and his "Go" of 21 Nov for this proposal. Source audit: `docs/research/animals-source-audit/PENGUIN-COUNTS.md` rev 2.1 (passed by GPT within its scope). Design base: `ANIMALS-EXPANSION-PROPOSAL.md` rev 2, §2 and §3.1.

Evidence key: [A] the audit, read from the file's bytes · [C] read by Claude on the source's page · [G] read by GPT · [P] proposed here.

## 1. What this is, in one paragraph

A new kind of card on the Animals tab: a **population card**. It shows, for each African penguin colony in one pinned, public-domain file, the yearly census of occupied nest sites from 1979 to 2019, exactly as deposited. Nothing is drawn on the globe. Nothing is added up, smoothed, projected or filled in. It is a dated record that ends in 2019, and the card says so.

## 2. One rule to settle first (Chad)

Chad's standing rule: new features are live or regularly updated feeds only, **except recorded animal journeys on the Animals tab**. A census chart is not a journey and not a feed. His order of 20 Nov asks for it, so the proposal assumes the exception is meant to cover it. **Decision P-D0 asks him to record that in his own words**, so the rule on file matches what is built. Suggested wording: "dated population evidence is allowed on the Animals tab as an archive feature, labelled with its end year".

## 3. The source (unchanged from the audit)

| | |
|---|---|
| Record | Dryad doi `10.5061/dryad.vx0k6djp7`, version of 3 Mar 2021 [C] |
| Download | zip, 4,034 bytes, sha256 `2106ce706f014f7d75008d117cba54a803664c279a5c96871396af0486866e11` [A]; re-checked 21 Nov from the Mac copy |
| File | `Afr_penguin.csv`, 3,890 bytes, sha256 `9c57c16809d1b886c5000555b495551f7d7cb1802cfa70c6d67323a87f40d72c` [A] |
| Licence | "Public domain" on the record [C] |
| Paper | Sherley and co-authors 2020, *Ecology and Evolution*, doi `10.1002/ece3.6554` [C]. Methods not read by Claude |
| Contents | 41 years (1979 to 2019) × 22 colonies = 902 cells: 600 counts, 298 without a count, 4 markers of 0.1 [A] |
| Unit | occupied nests; the highest count in a year stands for the year; occupied sites are defined differently in South Africa and Namibia [C] |
| Markers | 0.1 at Lamberts Bay 2019 and at Robben Island, Simonstown and Stony Point 1979: the record says they "do not represent real count data and should be omitted" [C] |
| Kept | on Chad's Mac in `_source-data/animals-expansion/`. Never committed, never served |

- The later repository file (to 2023) is **not used**: no licence, and its marker rule and unit are not written down. Enquiry C was sent by Chad on 20 Nov; no reply reported. The two files are never joined.
- The dataset citation and the paper citation are copied from the record **as given** at build time and checked by GPT; none is typed from memory here.

## 4. What the visitor sees [P]

### 4.1 Placement
- A new section on the Animals page, **"Population counts"**, below the journeys' globe and switches and above the study cards. Its own heading, its own availability state, its own files. It does not touch the globe, the switches or the replay.
- Evidence-type label: **census counts**. Group: Sea.
- Card heading: "African penguin: colony census, 1979 to 2019".

### 4.2 The charts (recommended: every colony, each in its own small chart)
- **22 small charts, one per colony, in the file's own order**, under two sub-headings: South Africa (18) and Namibia (4) [C for the split].
- Each small chart: years 1979 to 2019 across, occupied nest sites up, **from zero**, linear. Its own vertical scale, with the scale's top value printed on it, because colonies range from tens to tens of thousands. A sentence above the grid says the scales differ and that heights must not be compared between charts.
- **A dot for every count. A line joins two counts only when they are in consecutive years.** A year with no count is a visible gap; a count with no neighbour stands as a single dot. This is the chart's version of the journeys' "no line across a gap" rule.
- Under each chart, in words: the colony's name as the file gives it, how many of the 41 years have a count, first and last counted year with their values, and the highest value with its year.
- Selecting a small chart opens the same chart larger, with a **table of every year**: the count, "no count", or "not a count: model marker, left out". The table is the text alternative; it is in the page, not behind a hover.
- **The four markers are never drawn.** The colony's notes say, from the record: "The file holds a 0.1 marker at [year]. The authors say it is not a count; it is left out." Where the record gives the reason (colony not yet settled, or colony gone), that reason is quoted as the record's.
- No zero is plotted that the file does not contain (it contains none).

### 4.3 What the card says
- Unit (GPT's wording): "Annual colony census: occupied nest sites (used as a breeding-pair proxy)." Then: the two countries define an occupied site differently; these are not counts of birds; values are not doubled into individuals.
- Version note (GPT's wording, from the audit): "Historical census data from the 2021 deposit, ending in 2019. The authors' later analysis file extends to 2023 and differs in some overlapping entries. This chart uses the earlier deposit throughout."
- Three separate dates: period covered (1979 to 2019), the deposit's version date (3 Mar 2021), the date we last checked the record.
- "A rise at one colony does not show recovery of the species. No total is shown: colonies were counted in different years, so adding up what is present would invent a trend."
- **Colonies the later file differs on** carry a line in their details: "The authors' later file has different entries for this colony in N of the shared years." The later file's values are **not** shown. N per colony, from the audit's comparison [A]: Ichaboe 5, Halifax 4, Possession 4, Vondeling Island 2, Mercury 2, Bird Island 2, Stony Point 1, Seal Island Algoa Bay 1, Stag Island 1, Lamberts Bay 1 (the marker's position). 23 in all; the 24th difference is only how an empty cell is written and is not counted. The other 12 colonies carry no such line.
- Source, licence, both citations as given, and a link to the record.

### 4.4 What it never shows
- A national, regional or global total, or any sum of colonies.
- A trend line, slope, percentage change or projection computed by the page.
- An extinction date or countdown. The word "latest". "Live" or "updated".
- A conservation category. The assessment card (expansion proposal §7) is a separate module with its own sources and is **not part of this proposal**.
- A colony's position. Nothing goes on the globe.

## 5. Data path [P]

- **Builder** `phase1/animals/build_census.py` with a config that pins the zip (bytes, sha256) and the CSV inside it (name, bytes, sha256). It stops, writing nothing, when:
  - either checksum differs, or the zip holds anything but that one file;
  - the header is not exactly `Year` followed by the 22 expected names in order;
  - the years are not 1979 to 2019, consecutive, once each;
  - any cell is not one of: a whole number of 1 or more, `NA`, an empty cell, or `0.1`;
  - the markers are not exactly the four stated cells;
  - the totals are not 600 counts, 298 without a count, 4 markers.
- **Three cell states are kept apart** in the output: a count (integer), no count (`null`), marker (`"m"`). An empty cell and `NA` both become "no count", and the manifest says one cell was empty rather than `NA` (Seal Island Algoa Bay, 2003).
- **Display file**: years once, then per colony its name and 41 states. Trial size measured from the pinned file: **4,852 bytes, 1,813 gzipped**. Plus a manifest (source pins, licence, citations, unit text, marker rule, per-colony summary figures, the later-file difference counts with the audit named as their source, check date).
- The per-colony summaries (years counted, first, last, highest) are **computed by the builder**, never typed. The page prints them from the manifest.
- The later-file difference counts are the one hand-entered table: they come from the audit's comparison against the repository file at its pinned commit, which is not stored. The config names that audit and the file's sha256 (`647ea16a…`). GPT is asked whether that is acceptable or whether the line should be dropped.
- **Its own list file and its own script** (`assets/animals/populations-R1.catalog.json`, `animals-census.js`), so the journeys' list, its pinned checksum and the journeys' scripts do not change. Same pattern as the journeys: list pinned in the script, manifest pinned in the list, display file pinned in the manifest; nothing is drawn until all three verify.
- `--check` rebuilds in memory and compares (0 same, 3 missing or different, 2 stopped), as the bird's builder does.
- No hub, no schedule, no key, no storage, no third-party request. Charts are drawn as inline SVG by the page's own script; no chart library.

## 6. Page behaviour [P]

- The section loads its three small files when the page opens (about 2 KB gzipped of data). The journeys' network contract is unchanged: no journey coordinate file before its switch is on.
- Verification failure: no chart and no number is shown; the section says "The census file could not be verified. Nothing is shown." with a Retry. The journeys are unaffected, and a journey failure does not affect this section.
- No WebGL needed. The section works when the globe cannot start.
- Keyboard: each small chart is a button with a name that states the colony and that it opens the detail; Escape or a Close button returns focus to it. One polite announcement on open and close.
- No animation. Colour is not the only carrier: dots, gaps and words carry the states.
- Widths 360 to 1,470 px: the grid goes from one column to several; no sideways overflow; the detail table scrolls inside its own box if needed.

## 7. Acceptance criteria (to become tests)

Builder
- **P1** Wrong zip, wrong inner file, or an extra file in the zip stops the build.
- **P2** `--check`: 3 when outputs are missing, 0 when identical, 3 when one byte differs, 2 when the build stops; no source file is written anywhere.
- **P3** A changed header name, a missing or repeated year, a decimal other than 0.1, a zero, a negative, text in a cell: each stops the build (made-up copies).
- **P4** A marker in any cell other than the four stated, or a count where a marker is expected, stops the build.
- **P5** Counts are 600 / 298 / 4, and each colony's summary equals the audit's table (22 rows).
- **P6** An independent re-read of the CSV gives the same 902 states as the display file.
- **P7** The raw zip and CSV are not in the tree (by name and by checksum); `_source-data/` stays ignored.

Page
- **P8** Nothing is drawn before list, manifest and display file verify; one changed digit in any of the three gives the stated message and no chart.
- **P9** For every colony: one dot per count, at the right year and height; no dot for "no count" or a marker; a line only between consecutive counted years. Checked against expectations worked out in the test from the display file, for all 22.
- **P10** No element of the page holds a sum across colonies, a percentage, a slope, the words "latest", "live", "total" as a figure, or a conservation category (scan of the section's text and of the SVG).
- **P11** Each chart's printed scale top, counted years, first, last and highest equal the manifest's.
- **P12** The detail table has 41 rows with the three states in words; the four marker rows read as markers, not as 0.1 or 0.
- **P13** The ten colonies with later-file differences carry their line with the right N; the other twelve do not.
- **P14** Unit sentence, version note and the "no total" sentence are present, word for word as agreed.
- **P15** Keyboard, focus return, announcement; 44 px targets; widths 360, 390, 720, 900, 1,100, 1,280, 1,470 without sideways overflow.
- **P16** The journeys are untouched: the journey list, its checksum, the journey scripts' behaviour and the full existing suite (277 checks, 51 breaks) still pass; Earth now is still main's except the stated lines.
- **P17** The section works with the globe unavailable, and a census failure leaves the journeys usable (and the reverse).

Deliberate breaks for each of P8 to P13, as in the earlier suites.

## 8. Decisions for Chad

| | Question | Recommended |
|---|---|---|
| **P-D0** | Record that dated population evidence is allowed on the Animals tab (§2) | Yes, in his words |
| **P-D1** | Layout: **A** all 22 colonies as small charts with a larger detail view · **B** one chart at a time chosen with labelled buttons (like the animal switches) | **A**. Every colony is visible at once, nothing is hidden behind a choice, and no colony is picked to tell a story. B is simpler on a phone |
| **P-D2** | Colonies: **A** all 22 · **B** a named subset with few gaps (Robben Island, Simonstown, Mercury, Possession, Ichaboe) | **A**. A subset of well-counted colonies leaves out the three largest (Dassen, St Croix, Bird Island) |
| **P-D3** | Joins: **A** only consecutive counted years · **B** also a dashed line across gaps | **A**. A dashed line still suggests a path the file does not hold |
| **P-D4** | Where to build: **A** as a third stage on `animals-tab-rc`, reviewed by GPT as its own candidate · **B** a separate branch from it | **A**. One combined preview; the stage's commit keeps it separable |

No money, no account, no message to anyone. Not for decision here: the assessment card; any use of the later file; public release.

## 9. What GPT is asked

1. Is a per-colony small-chart grid with unequal scales acceptable with the stated warning, or should all charts share one scale (most colonies would then be flat lines near zero)?
2. Is "a line only between consecutive counted years" the right rule, and is a single isolated dot acceptable?
3. The later-file difference counts: keep as a hand-entered, audit-sourced table, or drop the line and keep only the version note?
4. Is the marker wording right, and may the record's reason for each marker be quoted?
5. Is anything in §4.4 missing?
6. Does the separate list file and script meet the "journeys untouched" aim, or should populations join the journey list?

## 10. Not done, not claimed

- No chart, no display file, no builder. The trial size is one measurement from the pinned file.
- The paper's methods were not read by Claude. The unit and marker rule are from the Dryad record's notes.
- The record's licence wording was read on 20 Nov; it is re-read at build time and its check date recorded.
- "Usable" still means a faithful, dated view of that deposit, not the latest population evidence.
- Real phone, screen reader and performance: unverified until a candidate exists.
- Corridor proposal: not started.
