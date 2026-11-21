# Animals: East Walker mule deer migration corridor. Build proposal

21 Nov 2026 · **rev 1** · docs only, for GPT's review. **Nothing is built. Chad's decisions (§9) and his own build go are needed after GPT's review.** No public-release clearance. Written 07:27 UTC (clock reading).

Authority: Chad's order of 20 Nov (bird, penguin chart, then corridor), his choice of the East Walker herd and his decision of 20 Nov ("Medium and High only, with a visible note that the broader Low-use footprint is omitted; not presented as the complete migration extent"), and his go of 21 Nov: "East Walker corridor proposal, docs only, for GPT review. Medium and High only, with the omitted Low-use footprint stated clearly. No implementation or deployment." Source audit: `docs/research/animals-source-audit/CORRIDOR-USGS.md` rev 1.2 (closed by GPT). Design base: `ANIMALS-EXPANSION-PROPOSAL.md` rev 2, §2, §5 and §10.

Evidence key: [A] the audit · [M] measured by Claude on 21 Nov from the pinned archive on Chad's Mac (§3.2) · [G] read by GPT · [P] proposed here.

## 1. What this is, in one paragraph

A third kind of card on the Animals tab: a **corridor card**. Under its own labelled switch it draws, on the Animals page's globe, two published polygon classes for one herd: the areas the source calls Medium use and High use during migration. It is a published summary of many collared animals over stated years. It is not the path of any animal, not where animals are now, and not the whole area the herd uses: the source's widest class is left out, and the card says so in plain sight.

## 2. One rule to settle first (Chad)

The standing rule allows recorded animal journeys on the Animals tab as an archive feature, and (P-D0, 21 Nov) dated population evidence. A corridor is neither: it is a fixed, dated, published map product. **Decision C-D0** asks Chad to say it is covered. Suggested wording: "published, dated corridor products are allowed on the Animals tab as an archive feature, labelled with their data years and release date".

## 3. The source

### 3.1 As audited [A]
| | |
|---|---|
| Release | USGS, "Ungulate Migrations of the Western United States, Volume 6", doi `10.5066/P1ETBSYE`, publication date on the record 2026-03-24 |
| Archive | `ungulate-migrations-volume-6.zip`, 160,106,900 bytes, sha256 `9bb5989ceab03235f42426ef51baafadd35eb6bf4ca9a4aaf19d17f6d39e4965` (re-checked on the Mac, 21 Nov 07:24 UTC) |
| Licence on the record | "Creative Commons Zero v1.0 Universal (CC0-1.0) public domain dedication" |
| Metadata use text | authors "retain ownership"; credit asked. GPT: a disclosure point, not a blocker |
| Herd | California mule deer, East Walker. Place keyword: Bridgeport, California |
| Sample | migration model: 267 migration sequences from 91 animals; GPS fixes every 1 to 24 hours; data from 2017, analysed through August 2024 [A][G] |
| Method | Fixed Motion Variance for the corridor; Net Squared Displacement to mark migration periods [G, from the report, SIR 2026-5123 v1.1] |
| Classes | Low = footprint used by at least one individual · Medium = 10 to 20% of the sampled population · High = more than 20% [A][G] |
| Updating | "Complete"; maintenance "As needed". Shown as a fixed, dated product |
| Kept | on Chad's Mac in `_source-data/animals-expansion/`. Never committed, never served |

### 3.2 Measured for this proposal [M]
Read inside the zip without unpacking, in the Mac shell on 21 Nov; both runs had ended by the 07:24 UTC clock reading. Scratch scripts removed afterwards; no output file kept. The build repeats every figure.

| File inside the zip (`…/CA_MuleDeer_EastWalker_Corridors/`) | Bytes | sha256 |
|---|---|---|
| `CA_MuleDeer_EastWalker_Corridors.shp` | 2,131,084 | `365522c5945a54b3b19d446f290912d2720efa9c6a0294914ee77fbe96bf2f1d` |
| `….dbf` | 1,397 | `12ef7c4605af6db921d61f7fae83bf219ab5482ce071a228727027ad92ffe302` |
| `….prj` | 464 | `c8a79e5f788ac300753a916cb2ee3cc9ae246323bc870d487c00c0edc4a1ac3a` |
| `….xml` | 25,155 | `f8e6bb31b6b06f74ac2a63b913f687bd7295148d283fb52bfd4efa84ab6b4a85` |

| Class (`Contour`) | Record | Rings | Outer / holes | Points | Area km² (projected, equal-area) | Extent, degrees |
|---|---|---|---|---|---|---|
| Low (not shown) | 0 | 14 | 1 / 13 | 84,582 | 1,431.1 | 119.742°W to 118.944°W, 37.965°N to 38.569°N |
| **Medium** | 1 | 6 | 4 / 2 | 27,966 | 280.0 | 119.355°W to 119.005°W, 38.151°N to 38.497°N |
| **High** | 2 | 3 | 2 / 1 | 20,623 | 159.1 | 119.340°W to 119.023°W, 38.179°N to 38.474°N |

- **Projection, from the `.prj`:** Albers equal-area conic, GRS 1980 (a 6,378,137 m, 1/f 298.257222101), standard parallels 29.5° and 45.5°, latitude of origin 23°, central meridian 96°W, no false easting or northing, metres.
- **Inverse projection checked two ways.** (1) Forward then inverse on every vertex: largest difference about 0.00000001 m. (2) The four corners of the layer's projected bounding box, taken through the inverse, give 119.8921°W, 118.8154°W, 37.9630°N, 38.6056°N: **the metadata's four bounding values, to all four decimals.** That is a check against the source's own software.
- **Two refinements to the audit** (recorded here; the audit's conclusions stand):
  - Its "bounds (metadata) 119.89°W to 118.82°W, 37.96°N to 38.61°N for the corridors" are the corners of the projected box, not the shapes' extent. The shapes are narrower (table above).
  - Its remark that "the original outlines follow a fine raster" is not supported: the commonest spacings between successive vertices are about 5.1 to 5.5 m, none of the 133,148 segments is axis-aligned, and fewer than 0.3% of vertices lie on a straight line with their neighbours. The outlines are densely sampled curves.
- **Trial encoding, Medium and High, every source vertex:** 48,589 points, rounded to 0.00001° (about 1.1 m north-south, 0.9 m east-west here), stored as whole-number steps from the previous point: **244,276 bytes of JSON, 32,276 bytes gzipped.** No two successive vertices of Medium or High rounded to the same point. For scale, the zebra's display file is 440,782 bytes.
- **Not measured:** whether Medium and High overlap or are separate bands (High lies inside Medium's extent; Medium has two holes and High two outer rings, which suggests bands, but that is a guess until the build tests it); whether any ring touches or crosses itself.

## 4. What the visitor sees [P]

### 4.1 Placement and switch
- A new group on the Animals page beside the journey groups: **"Published corridors"**, with one labelled switch: "Mule deer, East Walker herd, California: migration corridor (data 2017 to 2024)". The same switch component as the journeys. **Off at load.**
- Evidence-type label: **published corridor or range**. Group: Land.
- **Recommended (C-D1 A): the corridor switch is independent of the journeys' "one at a time" group**, as the design base says ("its own switch and Key state, independent of the journey's"). A journey and the corridor may both be on; they are in different parts of the world. The journey scripts are then not touched.
- Switching it on moves the view to the corridor area once; a "Go to the corridor area" button repeats that. On a phone the globe is brought into view, as for a journey. No replay bar, no marker, no time control: nothing moves.
- State line on the card: off · loading · shown · could not be verified · failed, with Retry.

### 4.2 The drawing
- **Two filled classes with outlines, High drawn above Medium.** They differ by more than colour: High has the darker fill and the heavier outline, and the legend names both in words.
- **Holes are holes.** A hole inside a class is drawn empty, never filled.
- **Separate patches stay separate.** No line, arrow or direction joins them. No route is drawn; the release's route layers are not used and were never opened.
- **Nothing is drawn for Low.** There is no faint outline, shading or hint of where it lies.
- No animal symbol, no moving dot, no count on the map.
- **A legend beside the globe while the switch is on**, with the source's own definitions for this herd:
  - "High use: used by more than 20% of the sampled animals."
  - "Medium use: used by 10 to 20% of the sampled animals."
  - "Not shown: the source's Low class, the broader footprint used by at least one sampled animal."
- **The omission notice sits with the legend, always visible while the switch is on, not inside a details box** (GPT's wording): "Selected higher-use migration areas. The broader Low-use footprint is omitted." Followed by: "Unshaded does not mean unused."

### 4.3 Reading a small area on a globe
The two classes span about 30 km by 38 km. The whole-globe backdrop is one picture 2,048 pixels wide, about 20 km a pixel: at this zoom it is a blur. A reader needs something to place the shapes against. Recommended (C-D4 A):
- **A regional satellite picture from the same registered source and the same date rule as the page's backdrop** (NASA GIBS, the same VIIRS layer and the same UTC date), requested once for a box of about one degree around the herd and laid on the globe under the polygons. The backdrop line then says so, with its date, and still says it is not from the study's years.
- **Latitude and longitude lines every quarter degree across the box, labelled**, and a **scale bar** computed for the view. These are always drawn while the switch is on, picture or no picture.
- A sentence of plain location from the source's own keyword: "Eastern California, near Bridgeport."
- If the regional picture fails or is cloud: the lines, labels and scale bar remain, and the line reads "Regional satellite picture unavailable". The polygons are still shown.
- **No state line, road, town marker or place name is drawn.** Those need a new source and a register entry (option C-D4 C).

### 4.4 What the card says
- Heading: "Mule deer, East Walker herd: published migration corridor".
- "A published summary of many collared animals, not the path of any one, and not where animals are now."
- Sample, with roles kept apart: "Corridor model: 267 migration sequences from 91 collared animals. GPS fixes every 1 to 24 hours." The 125 captured adult females are **not** given as the corridor's sample.
- Method, as the source names it: "Fixed Motion Variance; migration periods marked by Net Squared Displacement", with one plain sentence: each animal's migration tracks are turned into a map of use, the maps are averaged across animals, and the classes are cut from the result.
- Three separate dates: data years (2017, analysed through August 2024), the release date (24 March 2026), the date we last checked the record.
- "This is a fixed, dated product. Nothing on the record says it is refreshed on a schedule."
- "Also in the release and not shown here: stopovers, winter range and per-animal routes." (If C-D2 A.)
- Geometry note: "Every outline point of the two published classes is kept. Positions were converted from the source's map projection to latitude and longitude and rounded to about one metre. That conversion and rounding are ours."
- Source: the release title, doi, originators as the metadata lists them, the report, the licence as the record words it, and the metadata's own use sentence quoted beside it. Citations copied from the record at build time, not typed from memory. No endorsement implied.
- **Text alternative, in the page:** for each class, its definition, the number of separate patches and holes, its area in km² ("area of the published polygons, computed by us in the source's equal-area projection"), and its extent in degrees. No list of vertices.

### 4.5 What it never shows or says
- The Low class, in any form. Stopovers and winter range (unless C-D2 chooses otherwise).
- "The migration route", "the corridor the herd follows", "the herd's range", or any wording that makes the shown area the whole.
- Animals "inside" the corridor, a number of animals in an area, a density, or a population figure. 91 is a sample of collared animals, not a herd size.
- A season, a direction of travel, a current or recent position, or a forecast.
- Recovery, decline, threat or conservation status. Hunting seasons or access.
- A comparison with any other herd's classes: the class names are not a common scale [A].

## 5. Data path [P]

- **Builder** `phase1/animals/build_corridor.py`, standard library only, with a config. It reads the four pinned files inside the pinned zip without unpacking it. It stops, writing nothing, when any of these fails:
  1. zip sha256, and each inner file's bytes and sha256 (§3.2);
  2. the `.prj` text equals the pinned text exactly, and its parameters equal those in the config;
  3. the shapefile is a polygon file with exactly 3 records; the `.dbf` has the fields State, Species, Herd, DataType, Contour with the values CA, MuleDeer, EastWalker, Corridors and Low, Medium, High in that order;
  4. the metadata `.xml` contains the three class definitions, the sample sentence and the use constraint the config quotes, word for word;
  5. every ring is closed, has at least four points, outer rings clockwise and holes anticlockwise, every hole inside exactly one outer ring of its own class;
  6. per class: rings, outer rings, holes, points and projected area equal the config's expected values (§3.2);
  7. after conversion and rounding: no two successive vertices equal; no ring touches or crosses itself; no two rings of a class cross; every hole still inside its parent; every vertex inside the class's expected extent;
  8. the corners of the projected bounding box, converted, equal the metadata's four bounding values to four decimals.
- **Conversion:** the inverse Albers formulas for the ellipsoid, written out in the builder with the parameters above. **No datum shift is applied:** the source is NAD83 (NSRS2007) and the globe is treated as WGS 84. The two differ by an amount of the order of a metre here (general geodesy, not measured by us); the manifest states that no shift was applied.
- **Rounding:** 0.00001°. Per ring, the manifest records the area before and after (after: recomputed by projecting the rounded points forward) and the largest displacement in metres.
- **Low is read only to check the file's structure and counts. No coordinate of Low is written to any output.** The builder test searches the outputs for it.
- **Outputs, three files:** a display file (two classes, each a list of polygons with outer ring and holes; whole-number steps), a manifest (pins, projection, every count, every check's result, wording, the record block, the class definitions quoted from the metadata), and the corridor section's own list `assets/animals/corridors-R1.catalog.json`. **The journey list, the population list and every existing data file stay byte-identical.**
- `--check` rebuilds in memory and compares, exit codes as the other builders'.
- **Page:** a new script `animals-corridor.js` with its own pinned list checksum, the same chain as the census (script pins list, list pins manifest, manifest pins display file, then a structure check, then drawing). Its own request, time limit and token, so a late answer never draws.
- Whether Medium and High overlap is measured by the builder and recorded. Either way High is drawn above Medium; the legend's definitions do not change.

## 6. Page behaviour [P]

- Nothing of the corridor is fetched before its switch is on, except its list and manifest for the card's facts (as for journeys). The display file and the regional picture are requested only when the switch goes on.
- Off: polygons, lines, labels, scale bar, legend and the regional picture are all removed from the scene and the page; the backdrop line returns to its ordinary text.
- On while loading counts as on; off during loading cancels; a failure returns the switch to off with the error and Retry on the card.
- A failed or unverified corridor file leaves the journeys and the census untouched, and theirs leave the corridor untouched. A failed globe leaves the card, legend text and text alternative readable.
- One polite announcement on switching on, one on shown or failed, one on off. Nothing on camera movement.
- Keyboard: Tab reaches the switch and the "Go to the corridor area" button; Space and Enter operate them. Focus stays on the switch.
- Reduced motion: the view changes without animation.
- The polygons are not interactive: no hover, no click. Everything they could say is in the legend and the text alternative.
- Lost graphics context, resize and orientation change: as the journeys.

## 7. To prove first in the build (stop and report if any fails)

1. The regional picture: that the GIBS service returns this layer for a one-degree box, at what real resolution, and that it can be laid on the globe without a seam or an offset against the polygons. If not, C-D4 falls back to B.
2. That the camera can come close enough for the two classes to be told apart at desktop and 390 px, and that the legend, notice and globe fit without covering each other.
3. That 48,589 vertices with holes fill correctly and without visible delay on the software renderer the tests use, and the frame rate is recorded.
4. The self-crossing and ring-crossing checks pass on the real data without simplification. If they fail in the source itself, stop: no repair is invented.

## 8. Acceptance criteria (to become tests)

**Builder**
- K1 Each stop condition of §5 (1 to 8) stops the build, shown with a made-up archive re-pinned so that the named rule is what stops it; an un-pinned change stops at the checksum.
- K2 Outputs rebuild byte-identically from the pinned zip; `--check` reports the same.
- K3 An independent re-read in the test (its own shapefile reader and its own inverse projection) gives the same rounded vertices for both classes.
- K4 **No Low coordinate anywhere in the outputs:** the test converts every Low vertex and finds none of Low's rings in the display file or manifest; the display file holds exactly two classes.
- K5 Counts, holes, areas and extents in the manifest equal §3.2; area change from rounding is reported per ring and is under a stated bound.
- K6 The journey list, the population list and every existing data file are byte-identical to Stage 3.
- K7 Only three files are written; no source file is in the repository.

**Page**
- K8 Off at load; no display file or regional picture requested before the switch is on; allowed origins listed.
- K9 On: exactly two classes drawn, High above Medium; each drawn polygon's vertices equal the display file's; holes are empty (a point inside a hole is tested as not covered).
- K10 No object in the scene joins two separate patches; no line or marker other than the polygon outlines, the latitude and longitude lines and their labels.
- K11 The omission notice, the three legend lines and "Unshaded does not mean unused" are visible whenever the switch is on, at every tested width, without opening anything.
- K12 Wording comes from the manifest; the class definitions equal the metadata's quoted text.
- K13 Claims: none of the forbidden statements of §4.5 appears (a list of patterns, as for the census); 91 never appears as a herd size; 125 never appears as the corridor sample.
- K14 One changed digit in the list, the manifest or the display file: "could not be verified", nothing drawn, Retry recovers with good files. Re-pinned structural faults (a third class, a missing hole, an open ring, a vertex outside the extent, a class named Low) are refused.
- K15 Stale and slow loads: on then off while loading; on, off, on; a held answer arriving after off draws nothing; the time limit ends a load that never answers. Each held request confirmed in flight.
- K16 Independence both ways: with a journey shown, switching the corridor on and off leaves the journey, its replay and its switch unchanged, and the reverse; the census is unaffected and unaffecting.
- K17 Off removes everything: scene objects, legend, labels, scale bar, regional picture; the backdrop line is restored. Counted before and after.
- K18 Regional picture failure: lines, labels, scale bar and polygons still shown; the line says the picture is unavailable and claims no date for it.
- K19 Phone: switching on brings the whole globe into view; reduced motion respected; no camera movement at load.
- K20 Layout at 360, 390, 720, 900, 1100, 1280, 1470 px: nothing overflows; the legend and notice do not cover the globe on narrow screens; switch and button at least 44 px.
- K21 Keyboard and announcements as §6; focus stays on the switch.
- K22 No globe (library failure, lost context): card, legend text, omission notice and text alternative remain.
- K23 The scale bar's stated length equals the distance computed from the view within a stated tolerance; the labelled lines are at the stated quarter degrees.
- K24 The combined page suite and the census suite still pass; Earth now files equal the baseline as before.
- K25 Private-preview wording as on the other cards.

## 9. Decisions for Chad (after GPT's review)

- **C-D0** The rule covers a published, dated corridor product (§2). Recommended: yes.
- **C-D1 The switch.** A (recommended): independent of the journeys' one-at-a-time group; journey scripts untouched. B: one thing on the globe at a time, corridor included; the journey script changes and its whole suite is rerun.
- **C-D2 Layers.** A (recommended, and what your go says): corridors, Medium and High only. B: also the stopover layer. C: also winter range. B and C each need their own wording and their own sensitivity judgement; nothing in this proposal measures or clears them.
- **C-D3 Geometry.** A (recommended): every source vertex kept, rounded to about a metre; about 244 KB (32 KB gzipped) on the trial. No simplification, so nothing can vanish or change shape. B: simplify to a stated tolerance, with GPT's validation list from the audit (algorithm, dropped parts, holes, crossings, original against derived, area change).
- **C-D4 Reference context.** A (recommended): regional satellite picture from the registered source, plus labelled latitude and longitude lines and a scale bar. B: lines and scale bar only. C: also a state line and place names from Natural Earth (public domain; new files and a register entry; its own small audit).
- **C-D5 Where.** A (recommended): a fourth stage on `animals-tab-rc`, private preview, candidate back to GPT. B: its own branch.

## 10. What GPT is asked

1. Is the display honest: two classes with the source's definitions, the omission in plain sight, nothing implying completeness, an individual animal, or the present?
2. Is C-D1 A (independent switch) right now that the globe lives on the Animals tab, or should the globe carry one thing at a time?
3. Is keeping every vertex with one-metre rounding (C-D3 A) acceptable in place of simplification, and are the stop conditions of §5 enough for it?
4. The datum statement: is "no shift applied, difference of the order of a metre, stated in the manifest" acceptable, or does it need a source?
5. The regional picture (C-D4 A): acceptable under the existing source, or does a second request to GIBS for a region need its own register note?
6. The two refinements to the audit in §3.2: accepted as record updates?
7. Anything in §4.5 missing, and anything in K1 to K25 untestable as written.
8. Sensitivity: this proposal makes no finding. Is there anything about showing Medium and High for a hunted species that should be settled before a private preview, as distinct from before public release?

## 11. Not done, not claimed

- Nothing built. No output file exists; the trial encoding was removed with its script.
- The report PDF: not read by Claude. Its East Walker section was read by GPT.
- Stopovers, winter range, routes, and the other ten herds: not measured here.
- Overlap between Medium and High; self-crossing: not measured.
- The regional picture, the close view and drawing speed: not tried.
- The datum difference: not measured.
- Sources page, REGISTER, sensitivity decision, public release: Chad's, later.
