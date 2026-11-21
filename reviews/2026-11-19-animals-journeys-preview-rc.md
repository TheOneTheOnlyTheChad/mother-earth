# Review packet: `animals-journeys-preview-rc` (three recorded journeys, one switch and a chooser)

Written 19 Nov 2026 12:40 UTC (clock reading). **Branch only: nothing merged, nothing deployed, nothing sent, nothing spent.** Hub untouched (0.6.19).

**Chad's lines (19 Nov):**
- "Decision: recorded animal journeys are allowed on the Animals tab as a dated archive feature; all other layers keep the live-feed rule"
- "Go: private preview build with one journey switch and a chooser for zebra Z3866, shark 118845 and false killer whale 98364, settings as GPT recommended; no merge, no deploy"

Built on `animals-zebra-preview-rc` `9ad932c` (GPT: pass for the private zebra preview). Settings are those of `docs/concepts/ANIMALS-QUALITY-RULE-*.md` rev 2 (branch `animals-proposal` `8b10fdb`; GPT: pass as provisional private-preview proposals). **They are experimental display choices, not reconstructions of the animals' routes.**

## 1. What to review
- Code commit and branch head before this packet: `185dcff26013025c08155e3e058fca0232aad09d` (its commit message says WIP; it is the candidate). The head is the later commit that adds this packet only.
- A complete tree at the head is on the Mac (see the GPT block).
- Files changed since `9ad932c` (sha256 at the code commit):

| File | sha256 |
|---|---|
| `animals-journey.js` | `cdb0f3316c679a8856dd4ab79231527f649d375e0834bdc8c43da408147be347` |
| `animals.html` | `28bd60bcbaf5d437075593a4a5c15728a2f4923bf38f6ee840c5d5ca1320f238` |
| `animals.js` | `dc69d31acdce1cc633a27261069a590671570e28e6605edd95a0b3abf8bab136` |
| `assets/animals/false-killer-whale-hawaii-98364-R1.json` | `7cb4bd447c27ab988e92f5149620a98ea7376d940b1d257a8025cb36f7865c84` |
| `assets/animals/false-killer-whale-hawaii-R1.manifest.json` | `9d7fd4fcf33cfd283af151a23e866b82dadd4cbc0f8e5fdce9f14bdc70c9c4e5` |
| `assets/animals/journeys-R1.catalog.json` | `a25cdce33091e0b1a62f4cce35c93f26b192d92409e53dc573ea513056bf3470` |
| `assets/animals/white-shark-sa-118845-R1.json` | `fb6d4079f5015270f453f984e316a3e22e04a1cce2d867581cc4ec717e986f71` |
| `assets/animals/white-shark-sa-R1.manifest.json` | `bf8cc595c4d471a6afe29f0998eb42f0aba7068b224b18f6fdd1c647afb0e160` |
| `index.html` | `4f20ce27ccfba1bf1674b8047b7074a55974c7dfd92e2e10df617633368f5d69` |
| `moon.html` | `e87e3f68285c737409b0d990d3e5a16093cded1deeaf7a0ad2914ff21e417196` |
| `phase1/animals-journey-ui.test.cjs` | `a76200a1a5f13bcc7fbfccbdbf2c621982d2ac698d0337e1a0ff7bbc990e794c` |
| `phase1/animals/argos_rules.py` | `5d45dc0a18daae8eeef8ca67c33368443f374ce62fd5c8a1ce378c249784db4d` |
| `phase1/animals/argos_rules.test.py` | `8a824f45a19c4fdad28e6ae90a4ead8b7c5806a84709ac0958d1b3ff3ba0211e` |
| `phase1/animals/build_argos_journey.py` | `c78fdb6240b2bd3bca80f217b439292743ffa786f90cc504b4156f65f1619708` |
| `phase1/animals/build_argos_journey.test.py` | `f83f6bcf6932d5e8c6174672c96058bbae74b8f3c2b09603f43883d3c6e2b015` |
| `phase1/animals/build_journey.test.py` | `13a4e39b67c4649575e07600c40eb848ab0800822521ea454f0b2bd4207f4491` |
| `phase1/animals/false-killer-whale-hawaii.json` | `36928c9f28987434fda77df7c4b05a658d9cf5919a834d97c301ecee9694fd18` |
| `phase1/animals/white-shark-sa.json` | `a472496f29863069ec6a2633ca86320dd1512bd4b3790d92d9134acc52fe95bc` |
| `sources.html` | `bb4453821504659f760bf5e37e8e1005933a53646055e19982d8d85d970258fd` |
| `style.css` | `2c66138351c2926da5e66947fc7fe3082c20f5bdcc74634d2dc2d0ac366e2e0b` |
| `sun.html` | `5ef5aac09f88c31bd4e131634ef2dace945124650374505d4d5ec29d7a1bcb71` |
| `timeline.html` | `d00f779b169b2f0337e8d58c5bff256b962a8d4050904c5a3db2a2d07015cf47` |

- Unchanged and still pinned: the zebra display file `8d00aa32…1bb6` and manifest `f337cdd0…73d0`.
- Keys: `style.css` and `animals.js` to `202612190200`, `animals-journey.js` to `202612190200`. Not used before.

## 2. What was built
- **One switch, one chooser.** The Animal journey card has a "Journey" select with three entries; the switch shows the chosen one. Choosing while off requests nothing. Choosing while on stops playback, clears the old journey and loads the new one.
- **A pinned journey list** (`assets/animals/journeys-R1.catalog.json`, sha256 pinned in both page scripts) pins each study's manifest; each manifest pins its display file. Three requests per journey load.
- **Two Argos journeys built by `phase1/animals/build_argos_journey.py`** from the pinned source files, with the reviewed rule code copied into `phase1/animals/argos_rules.py`:

| | White shark, tag 118845 | False killer whale, tag 98364 |
|---|---|---|
| Candidate rows | 1,004 | 693 (824, less the tagging row, 129 not PASS, 1 class Z) |
| Speed-consistency rule (experimental) | 3 m/s, anchors 3 2 1: 208 left out | 20 km/h, anchors 3 2: 30 left out |
| Temporally isolated (72 h) | 1 | 2 |
| On land in the pinned map | 40 | 0 |
| **Fixes shown** | **755** | **661** |
| Steps | 754 | 660 |
| Within the join limit | 618 (12 h) | 554 (6 h) |
| Refused: the drawn line touches land | 2 | 0 |
| **Steps joined** | **616** | **554** |
| Display file | 21,884 bytes | 19,958 bytes |

  These equal the counts in the rev 2 proposals.
- **The land test now uses the geometry the page draws** (GPT's build requirement). The page draws a straight chord through the globe between the two fixes' positions on a sphere. `argos_rules.chord_points` samples that chord and pushes each sample back to the surface, at 1 km or less; the build tests that polyline against Natural Earth 1:10m land (file sha256 `1ac90796…7416`, commit `ca96624a`). The result is the same 2 refusals the geodesic test found for the shark.
  - The display file carries a join flag per step. The page joins a step only if it is within the time limit **and** flagged, and refuses a file whose flags join across more than the limit or disagree with the manifest's count.
  - Browser check 20f: the drawn line is exactly one straight segment per joined step between the page's own positions. 20g: seen from above, the middle of every drawn segment lies on the path the build tested, within 0.00001°.
  - Build check R3 (real inputs): no joined step's line touches land when resampled every 250 m. R4: every refused step does.
- **Quality class per fix**: the replay bar adds "Argos class B (no error estimate)" or "Argos class 2 (nominal error 250 to 500 m)" for the fix under the marker. Card and Animals page carry the nominal-estimate caveat as proposed.
- **Statements of what was left out** are composed by the build from its own counts and shown on the card and the Animals page.
- **Animals page:** three study cards (Land, Sea), each filled from its verified manifest; a paragraph stating the archive decision; a paragraph stating the sea journeys are experimental. Conservation and population "Not available yet" on every card; sample-size sentence per study. The shark is shown by tag number; the file's given name appears nowhere.
- **The whale replay ends 12 Feb 2014**, ten days before the file's last fix, because the last fixes are temporally isolated; the card says so.

## 3. Choices made in the build that the proposals did not fix
1. **Fix marks for the Argos journeys are larger** (sized so they stay visible with the whole journey in view; several kilometres across on the ground). The zebra's are unchanged. A mark's size is not an error circle and the page does not say it is.
2. **"Journey area" zooms to fit the journey's box**, so the shark and whale views are far wider than the zebra's.
3. **The chooser sits in the card under the switch.** On a phone it is in the sheet with the card.
4. **Deep links** are `index.html#journey=<id>` for each of the three; an unknown id changes nothing.
5. **The shark credit line is composed by Mother Earth** from the Zenodo record's creators, date, title and version, and labelled as such; the whale's citation is the file's own, read at build time.
6. **The code commit's message says WIP.** Nothing changed after it except this packet.

## 4. Tests
- `phase1/animals-journey-ui.test.cjs`: **308 passed, 0 failed** (zebra checks from the passed preview, plus the chooser, the Argos journeys, refused Argos files, the pinned journey list, three study cards). **37 breaks, each tied to its check: 37 of 37 caught.**
- `phase1/animals/build_argos_journey.test.py`: **30 passed** with the real inputs (parts 1 to 3); 22 without them (part 3 prints NOT RUN). The real inputs are not in the repo.
- `phase1/animals/argos_rules.test.py`: 17 passed (the reviewed made-up tracks for A, C and isolation, plus the chord geometry).
- `phase1/animals/build_journey.test.py` (zebra generator): 22 passed.
- Every other browser suite in `phase1/`: 43 run, 40 passed; the same three as before fail for reasons outside the branch (`osmc-reliability-ui`, same on main; `oceanheat-ui`, needs `OH_SNAPSHOT_DIR`; `buoy-temp-ui`, a missing scratch folder).

## 5. Not measured, not done
- **Performance not measured** for any of the three on this branch (GPT measured the zebra on `9ad932c`). The Argos journeys are far smaller than the zebra (755 and 661 fixes against 13,045).
- **No real phone, no screen reader, no real imagery behind the journeys.**
- **Real back/forward-cache restoration** was verified by GPT on `9ad932c`, not rerun here; the code path is unchanged and its event tests pass.
- **Land:** one map at one scale; coast detail it lacks is not detected. The chord is sampled, not tested exactly.
- **Sources & Details page and REGISTER not updated** (private preview).
- **Sensitivity and public release are undecided** for all three animals. Full-precision tracks are in the repo on this branch only.
- The two enquiries (NOAA SEFSC; the shark authors) remain unsent.
- The Baird et al. 2011 and Queiroz sources behind the two speed limits were read as fetch-tool extracts.
