# Review packet: `animals-tab-rc`, Stage 3 (African penguin colony census)

Written 21 Nov 2026 06:13 UTC (clock reading). **Branch only: nothing merged, nothing deployed, nothing sent, nothing spent. Private preview.**

- **Chad's go:** 21 Nov, his own message, "Go", in reply to Claude's offered line "Go: penguin chart, P-D0 yes, A, A, A, A". Taken as: build, with all five recommended options. **P-D0 is recorded on that basis only; Chad has not restated the rule in his own words** (asked of him again in the handover).
- **Design:** `docs/concepts/ANIMALS-PENGUIN-CHART-PROPOSAL.md` rev 1.1 (branch `animals-expansion-proposal`, `798849b`), with GPT's review of rev 1 (`reviews/2026-11-21-animals-penguin-chart-proposal-gpt-review.md` there).

## 1. What to review
- Code commit: `6c301c5c2f03a8a54c3d5b384baf163844948767`. The head adds this packet only. Comparison point: Stage 2, `ec19905`.
- Files (sha256 at the code commit):

| File | sha256 | What |
|---|---|---|
| `phase1/animals/build_census.py` (new) | `9b580a03283f4c5f7d8533a25e0cf4f98d347ab341a8c6d09eb183e7fd6e42aa` | builder |
| `phase1/animals/african-penguin-census.json` (new) | `1c6c9c3b0d8c9d21b273c0212cd2a59256bc14d7d2d5541dd2e15a38d5409020` | config: pins, colonies, markers, wording, record block |
| `phase1/animals/build_census.test.py` (new) | `0abfdff63e4c303b652d5b4e5badc6ddac37083d3f7695edb588425c0f58097c` | builder tests |
| `assets/animals/african-penguin-census-R1.json` (new) | `d8068a486813c7e718820357a1c8883fab4579817cab35d1020126f309544094` | display file, 4,933 bytes (1,891 gzipped) |
| `assets/animals/african-penguin-census-R1.manifest.json` (new) | `26d57d14e3a63c51ff4ef1bdc35a2142b8817c292ffaa74bfa200d72ecaca3e1` | manifest, 13,442 bytes |
| `assets/animals/populations-R1.catalog.json` (new) | `5c49f68f6d1ae076b0b2b357637a9dd93602b19d14d8214ada272b3e55d848eb` | the census section's own list |
| `animals-census.js` (new) | `18deb2e5a5c883581c2e600e85baf7bdf17b5c44934654800909c09a314682da` | the section's script |
| `phase1/animals-census-ui.test.cjs` (new) | `2f4c39128bff2e03f80081538f17632b62b2551b2fa1d1d270f547f613c04160` | page suite for the census |
| `animals.html` | `199b13e889cfc45eb59a079a697e5d8b4fff503af0ef0c78b0827001f5b68939` | one section and one script tag added |
| `style.css` | `33d8c8228e77eb2501cad5c09a997cec040535ed093d03a7638843e50fb9de80` | census rules added |
| `phase1/animals-tab-ui.test.cjs` | `377e53312c600aaa0eedb0347e6519fe029edce88ae8a217fea3da4f52c150d6` | three harness lines (§5) |
| `index.html` | `b2f4a6666859df7ec7c923f65f00180dd31de559e340d3755f9eb37a25d76972` | stylesheet version only |

- **Unchanged since `ec19905`:** `animals-journey.js`, `animals-globe.js`, `animals.js`, the journey list (`1386e4cc…`) and so every journey manifest and display file it pins, all three journey builders. `moon.html`, `sun.html`, `timeline.html`, `sources.html`: stylesheet version only.
- **Source:** the pinned zip stayed on Chad's Mac in `_source-data/animals-expansion/`; staged outside the repository, hash-checked (`2106ce70…`; CSV `9c57c168…`), not in Git.

## 2. The record, as read
Read by Claude on the Dryad record page in Chad's browser pane on 21 Nov 2026, between 05:06 and 05:09 UTC (the plain web fetch returned the page without these sections). In the config's `record` block and the manifest:
- Dataset citation as given: "Sherley, Richard; Crawford, Robert; de Blocq, Andrew et al. (2021). Data from: The conservation status and population decline of the African penguin deconstructed in space and time [Dataset]. Dryad. https://doi.org/10.5061/dryad.vx0k6djp7"
- Paper line as given: "Sherley, Richard B. et al. (2020), The conservation status and population decline of the African penguin deconstructed in space and time, Ecology and Evolution, Journal-article, https://doi.org/10.1002/ece3.6554"
- Licence as given: "License: Public domain", linking to the CC0 1.0 page.
- Version: "Published Mar 03, 2021 on Dryad"; "Mar 03, 2021 version files".
- **Usage notes, new to Claude in full:** NA are years in which counts were not conducted, for logistical reasons or because a colony had gone or had not yet been (re)colonised; the 0.1 entries are where the authors "know that the real popualtion size was zero" at that end of the series [their spelling], entered to anchor their model, "do not represent real count data and should be omitted".
- Methods: counts of occupied nests at 18 colonies in South Africa and 4 in Namibia; where more than one count was made in a year the highest was taken; occupied sites are defined differently in the two countries.
- **Pane time, to disclose:** that read fell inside the ten minutes either side of 05:00 UTC that Chad's rule keeps free for the other thread. Claude misjudged the clock. The tab was Claude's own, was closed afterwards, and no other tab was open. Reported to Chad.

## 3. What was built against rev 1.1
- Section "Population counts" between the journeys' globe and the study cards. 22 small charts in the file's order under South Africa (18) and Namibia (4). Each: same 1979 to 2019 span; from zero; its own scale top (the highest count rounded up to 1, 2, 2.5 or 5 times a power of ten) printed with the unit; a dot per count; a line only between counts in consecutive years; nothing for a missing year or a marker.
- Detail view: an in-page labelled region after the grid (not a modal), focus on its heading, Close and Escape return focus to the chart's button, opening another replaces it. A real table with caption, column headers and a row header per year, in a focusable scrolling box. The scale is also stated in words.
- Wording from the manifest only: GPT's unit sentence, version note and "no total" sentence word for word; "No count in this file" with the general explanation attributed to the record's usage notes; the marker note attributed to them.
- Verification before drawing: list pinned in the script, manifest pinned in the list, display file pinned in the manifest, then a structure check (years, colonies, the three states, where markers are, every summary recomputed, totals, required sentences and record fields).
- Loading has a 20 s limit and its own token and request; a newer load or leaving the page cancels an older one.
- Later-file difference counts: typed into the config as the 23 differing cells (colony and year), with the audit, the repository commit and the file's sha256 named. The builder checks the list's shape and total; the test derives the per-colony counts a second way from the audit's §6 list by kind, and checks each cell's state in this file matches the kind.

## 4. Choices to check
1. **Marker wording now carries the record's reason:** "…entered to anchor the authors' model at an end of a series where they knew the population was zero, that they are not count data, and that they should be left out." It is attributed and tied to the marker's year (1979 or 2019), not to today. GPT's point 3 forbade present-day absence claims and per-entry reasons for NA; this is the record's own statement about the markers. Say if it should be shorter.
2. **The licence is shown as the record's words, "Public domain", linked to CC0** as the record links it. The page does not itself say "CC0".
3. **Scale tops are rounded up** (for example 24,901 → 25,000). Test 2d maps every dot back through the printed top.
4. **The larger chart is redrawn narrower on a narrow screen** so its printed scale stays legible (test 9b: at least 9 px as drawn).
5. **An empty section heading "Population counts" stays visible when the file fails,** with the message and Retry; no number is shown.
6. **P-D0** is recorded from Chad's bare "Go" (above).
7. **Group label "Sea"** is on the card; the proposal said so. The species is a seabird; nothing else rests on it.

## 5. Tests (Claude's runs)
- **Builder** `build_census.test.py`: **41 passed with the pinned zip** (38 without; part 3 then prints NOT RUN).
  - Part 1, made-up zips, each re-pinned so the parser rule is what stops the build (P19); 1a shows an un-pinned change stops at the checksum. Covers P1 to P4, the three states, summaries, countries, the later-file list, `--check` codes, and that only three files are written.
  - Part 2, committed files: P5 against the audit's 22-row table; structure; the second derivation of the later-file counts; wording; record block; the journey list byte-identical to Stage 2; P7.
  - Part 3: byte-identical rebuild; an independent re-read gives the same 902 states.
- **Census page** `animals-census-ui.test.cjs`: **64 passed, 0 failed. 19 of 19 breaks caught**, all run on the final file. `EDIT=no-abort`: only the two "request itself was aborted" checks fail (5b, 5d), so the token alone refuses a stale answer.
  - 1 loading, network and wording (P14). 2 all 22 charts: dots, lines, printed scale, same span (P9, P11, P21). 3 all 22 detail views and all 902 table cells, later-file lines, marker notes, focus and keyboard (P12, P13, P22, P24). 4 one changed digit in each of the three files, and 16 re-pinned structural faults (P8, P18). 5 bounded loading and stale answers, each with the held request confirmed in flight (P23). 6 made-up series: isolated dot, leading and trailing gaps, one counted year, one and two years apart, a marker (P20). 7 claims: 127 possible sums looked for as figures; twelve kinds of unsupported assertion; the card's own negative statements accepted (P10, P25). 8 independence from the globe and the journeys both ways, and the phone reveal with the census on the page (P17, P26). 9 seven widths and keyboard order (P15).
- **Combined page** `animals-tab-ui.test.cjs`: **277 passed, 0 failed** with the census section present. Harness changes only: its server now serves the census list as itself (it used to answer any `*.catalog.json` with the journey list); `open()` waits for the census to settle; check 1f counts the journey manifests and the three census files apart. Its breaks were not all rerun: the files they edit (`animals-journey.js`, `animals-globe.js`) are byte-identical to Stage 2; the two that edit `animals.html` and two others were rerun and caught; `EDIT=no-abort` as before.
- Older suites on this tree: `bare-earth-ui` 190, `layer-switches-ui` 68, `timeline-ui` 594, `desktop-overflow` 286, `smoke-fixes` 113. Journey builders: 22, 17, 28, 59 (real-input parts not rerun; those files are unchanged).
- **Not run:** `mobile-pass`, `key-drawn-ui` (fixture not in the repository).
- **A fault found in my own tests while building, and fixed:** three stale-answer checks first passed without testing anything, because the held request had not yet left the page when the second load began. They now wait until the server has received the held request.

## 6. To rebuild and check
```
Z=~/Documents/"Mother Earth"/_source-data/animals-expansion/doi_10_5061_dryad_vx0k6djp7__v20210303.zip
python3 -I phase1/animals/build_census.py --config phase1/animals/african-penguin-census.json --source "$Z" --check
ME_PENGUIN_ZIP="$Z" python3 -I phase1/animals/build_census.test.py
```
Standard library only. `--check` writes nothing.

## 7. Not proven, not done
- A real phone; a screen reader; performance; print.
- The paper itself was not read by Claude; unit, methods and marker rule are from the Dryad record.
- Sources page, REGISTER, public release. The assessment card. The corridor proposal.
