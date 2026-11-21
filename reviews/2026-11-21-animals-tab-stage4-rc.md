# Review packet: `animals-tab-rc`, Stage 4 MVP (East Walker mule deer corridor)

Written 21 Nov 2026 10:39 UTC (clock reading). **Branch only: nothing merged, nothing deployed. Not on the live site.**

## 0. Authority, and one thing to know
- **Chad's go (21 Nov, his own message):** "Go: corridor Stage 4 MVP on animals-tab-rc. C-D0 yes; C-D1 A; C-D2 A; C-D3 A; C-D4 B (labelled lines and scale only, no regional image); C-D5 A. I know the derived corridor files committed to the public branch will be publicly downloadable, though not on the live site. Run the source and rounded-geometry checks first. If mixed, unresolved or invalid, stop and report. Otherwise finish this bounded MVP for GPT review, then prepare the handover. No merge, deployment or live release."
- **Design:** `docs/concepts/ANIMALS-CORRIDOR-PROPOSAL.md` rev 2.2 (`animals-expansion-proposal` `affa130`), passed by GPT at proposal level (review filed here: `reviews/2026-11-21-animals-corridor-proposal-rev2.2-gpt-review.md`).
- **The branch is public.** The three corridor files below can be downloaded from GitHub by address. Chad's go acknowledges it.
- **C-D4 B was chosen, not proved:** no regional picture was built or tried. Everything in the proposal about that picture (§6.2, K16, K20, K21) is out of this stage.

## 1. What to review
- Code commit: `379cf18b416d389bc3516d8c1c53a0e68f9708f3`. The head adds this packet only. Comparison point: Stage 3 r2, `a23dda8`.

| File | sha256 | What |
|---|---|---|
| `phase1/animals/corridor_geom.py` (new) | `2f2a5004b40fcb04fbfbf2410f2a57f75cc215a248c4098b70ba31828a6df141` | exact geometry: side tests, contact kinds, point in ring, areas |
| `phase1/animals/build_corridor.py` (new) | `729df78501f33636e6bcfe956acc7e88762f5deb9f431a163505566674069063` | builder |
| `phase1/animals/mule-deer-east-walker-corridor.json` (new) | `5267d6401ce00d1a37b992def461e05d9d23c74b925f64dad509c47568df10a2` | config: pins, quotes, limits, wording |
| `phase1/animals/build_corridor.test.py` (new) | `2b1e0061ac6bb618e7f0ebe00fc8e2d896b5bd7292d39523d375b9731ed64bcd` | builder tests |
| `assets/animals/mule-deer-east-walker-corridor-R1.json` (new) | `1462eae8dcc554f01b2dd86068d3ed0100e25f2a71a0862e0f77792aaca0ea40` | display file, 244,650 bytes |
| `assets/animals/mule-deer-east-walker-corridor-R1.manifest.json` (new) | `4226a500890a8296bfd5c2b7503c0d0fb503f09619ac8ff3689d3af701ecf1da` | manifest, 13,830 bytes |
| `assets/animals/corridors-R1.catalog.json` (new) | `fed2d428e06f52898f1fcd6df00e92808e8d5a2e0b36a3dfe574b3277cf700a2` | the corridor section's own list |
| `animals-corridor.js` (new) | `6c39a9294c2ae13c2739dd136133575510c98b38a318aa30a94c991b04dd63e6` | page script |
| `phase1/animals-corridor-ui.test.cjs` (new) | `9bc510519891212818276994b63fd7dc1430ea7dc20510d7706e51f694135013` | page suite |
| `animals.html` | `db2893be34e2cffbb278820f4887c0fa806d78db921237a3cafb361636473e51` | corridor panel, legend and scale elements, one script tag |
| `style.css` | `2a5e3c4f53b42ba6aa4488fcc9a76c566d0479eff6c15b01b92109f59a161d61` | corridor rules appended; `.an-globe-col` spans two grid rows |
| `phase1/animals-tab-ui.test.cjs` | `9a7784c7aedc88dd6e42bcf52e6ef6c7169a7e330db42c3712813ad8e24f9c14` | two expectations (§5) |

- **Byte-identical to `a23dda8`:** `animals-journey.js`, `animals-globe.js`, `animals.js`, `animals-census.js`, the journey list, the population list and every existing data file. **No shared script was changed.** `index.html`, `moon.html`, `sun.html`, `timeline.html`, `sources.html`: stylesheet version only.
- Source: the pinned zip stayed on Chad's Mac; staged outside the repository for the build; not in Git.

## 2. The geometry gate (run first, as Chad required)
From the pinned archive, by `build_corridor.py`:
- **Source validity, Medium and High:** all coordinates finite; every ring closed with non-zero area; **no two sides of any ring, or of any two rings of a class, meet** other than neighbours at their shared vertex (exact tests; 76,960 and 59,874 candidate pairs); orientation fits nesting; each hole has exactly one enclosing outer ring. Medium: 4 outer, 2 holes. High: 2 outer, 1 hole.
- **Relation between the classes: NESTED.** Their boundaries never meet (0 crossings, 0 point contacts, 0 coincident stretches; the nearest candidate vertices are about 177 m apart). Exact areas: A(M) 279,955,757.6 m², A(H) 159,080,989.8 m², **shared area exactly equal to A(H)**. The same in the rounded output, in whole-number arithmetic.
- **So the source's Medium polygons contain its High polygons.** The Medium-only band is 120.87 km². The layer's attribute definition says Medium is "10–20%"; the geometry is the cumulative reading in the shared process text ("≥10%"). Nothing is repaired or reinterpreted: High is drawn on top, the legend's "Medium use: 10 to 20%" is then true of the lighter band a visitor sees, and the card says so in a sentence (`nested_note`) and gives the band's area. **This is a finding for GPT and Chad to look at.**
- **Rounding:** worst vertex displacement 0.706 m (limit 0.75); worst ring area change 11% of its bound; class areas within 0.0001% (limit 0.05%); nesting, orientation and hole assignment unchanged; no two successive vertices equal.
- Corner check against the metadata's four bounding values: equal to four decimals.

## 3. What was built, against rev 2.2
- **Builder:** rules 1 to 18 as §5 of the proposal. Low is read for record order, counts and net area only; no Low record, ring or coordinate array is written.
- **Outputs:** display file with exactly two classes (medium, high), each polygon an outer ring with its holes, whole-number steps; manifest with pins, per-ring tables, the relation and its evidence, wording, the quoted metadata, 61 originator entries as listed; the corridor list.
- **Page:** a "Published corridors" panel under the journey switches with its own switch (off at load, independent of the journeys), card text always visible (legend lines, omission notice, "Unshaded does not mean unused", method, sample, dates, "not a navigation…"), a details block with the text alternative, definitions, datum sentence and source. When on: two filled classes on the globe (High above Medium), quarter-degree lines with labels, a legend under the globe, a scale bar, "Go to the corridor area".
- **Shared globe (§6.1):** the corridor uses three of the globe library's layers (polygons, paths, HTML labels) that the journeys do not use, and removes only those. The page is scrolled only at a press of the switch or Retry. The camera move is deferred to the draw and happens only if that press is still current; it is cancelled by off, a journey switch or its Retry, the journey's go-to, a drag or zoom. The corridor never writes the globe module's backdrop line.

## 4. Departures from the proposal, to check
1. **Relation test narrowed (declared in the builder's header and the manifest):** the builder decides the relation exactly **only when the two classes' boundaries do not meet at all** (then every ring lies wholly inside or outside every other, which is what makes one exact point test per ring-pair sound, and the shared area is summed from exact ring areas). **Any boundary contact between the classes stops the build as UNRESOLVED.** It does not build the general arrangement of §5.4 (19, 20). For this source that is enough (no contact). GPT's contact cases (crossing rectangles, shared edges, corner touch, exactly filled hole) therefore stop as unresolved rather than being classified; the covered-hole case, which has no contact, is classified **mixed with exactly 120,000 m² shared**.
2. **K1b's second calculation** (horizontal strips, exact fractions) is implemented for cases without boundary contact, where no ordering changes between vertex heights; it checks that and raises otherwise. It agrees exactly with the builder on the made-up cases, the committed display file and the real source.
3. **K3 fixture (b), the printed worked example in Snyder, is NOT DONE.** No number from it is used. Fixture (a) (the metadata's four values) and the full-data comparison by a separate reader and a series-form inverse are done.
4. **3d compares to half a rounding unit, not vertex-for-vertex equality:** an independent inverse differs from the builder's by about a centimetre, which would flip some rounded values at a boundary.
5. **Outline weight cannot differ on this renderer** (lines are one pixel). High differs from Medium by fill, outline colour and the legend's words and swatch borders.
6. **Scale-bar validity is stricter than proposed:** compared at the two edges of the canvas, not of the corridor box.
7. **Plain-globe wording:** the corridor's own legend line adds "Plain globe; no coastline lies in this view" when the globe has fallen back; the globe module's own line is left as it is (not ours to write).
8. **Retry moves focus to the switch,** because the Retry button hides itself while loading.
9. **Regional picture:** none (C-D4 B). The legend says the backdrop is a blur at this view.
10. **Drawing-cost reporting (§6.5) is partial:** the suite prints time from switch-on to shown on the software renderer (about 3.9 to 4.0 s, including fetch, checksum, decode and draw). **Longest main-thread task and frame times are not measured, and nothing was measured on Chad's Mac.** The 1,500 ms budget is therefore unproven. On the test machine a page opened straight after one that showed a journey and the corridor took 32 to 36 s to load; cause not established.
11. **View status** is the bounded wording GPT suggested, set by a go-to and removed on a gesture.

## 5. Tests (Claude's runs)
- **Builder** `build_corridor.test.py`: **34 passed with the pinned zip** (27 without; part 3 then prints NOT RUN). Part 1: eleven relation cases with exact shared areas, eleven validity faults each stopping at its rule, contact kinds. Part 2: checksum chain, exactly two classes and nine rings, no coordinate array outside them, strip calculation equal to the manifest, limits, wording, journey and population lists unchanged. Part 3: byte-identical rebuild; six made-up archives (one un-pinned, five re-pinned) each stopping at its rule; corner fixture; all 48,589 vertices by a separate reader and inverse; no Low ring; strip calculation on the real source; `--check`.
- **Corridor page** `animals-corridor-ui.test.cjs`: **55 passed, 0 failed** (full run), then section 4 rerun after a reporting fix (4 of 4). **16 of 16 breaks caught**; with only the request abort removed the late-answer check still passes (the token alone refuses a stale answer).
  - Drawn geometry read from the scene: every drawn ring equals the suite's own decoding; holes tested per class from the drawn triangles at nine points.
  - Held requests confirmed in flight for every race. Phone: globe in view before the answer; no scroll call after it.
- **Combined page** `animals-tab-ui.test.cjs`: full run **275 of 277**; the two failures were expectations that did not know the corridor (network at load now includes the corridor's list and manifest; the label check now selects journey switches). After those two edits **sections 1 and 7 pass (21 of 21); the full suite was not rerun after the edits, and its breaks were not rerun** (no file they edit changed).
- **Census page suite:** 71 of 71.
- Census builder test: 38 without its zip.
- **Three weak checks of mine found by the breaks and fixed before this candidate:** the integrity check changed a digit that another checksum also caught; the late-answer break was hidden by the abort; the far-view scale check was passing because an end was off the globe.
- **Not run:** the older page suites (bare-earth, layer-switches, timeline, desktop-overflow, smoke-fixes; `style.css` changed by appended rules and one grid-row rule), `mobile-pass`, `key-drawn-ui`. A real phone, Safari, a screen reader.

## 6. To rebuild and check
```
Z=~/Documents/"Mother Earth"/_source-data/animals-expansion/ungulate-migrations-volume-6.zip
python3 -I phase1/animals/build_corridor.py --config phase1/animals/mule-deer-east-walker-corridor.json --source "$Z" --check
ME_CORRIDOR_ZIP="$Z" python3 -I phase1/animals/build_corridor.test.py
```
Page: `python3 -m http.server 8899 --bind 127.0.0.1` in the review folder, then `http://127.0.0.1:8899/animals.html`.

## 7. Asked of GPT
1. The nested finding (§2): is the card's handling honest, or should the legend say "10% or more" for Medium?
2. Is the narrowed relation test (§4.1) acceptable for this stage, given the source has no boundary contact?
3. The page: honesty of wording, the shared-globe behaviour, the phone reveal.
4. What must be measured on the Mac before this can be called within budget.

## 8. Not proven, not done
- Mac performance; frame times; the cause of the slow following page load.
- Snyder's printed example. The general arrangement for classes whose boundaries meet.
- Sources page, REGISTER, sensitivity decision, public release.
