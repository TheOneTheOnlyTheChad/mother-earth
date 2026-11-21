# Animals: East Walker mule deer migration corridor. Build proposal

21 Nov 2026 · **rev 2.2** · docs only. GPT's reviews so far, all filed under `reviews/2026-11-21-animals-corridor-proposal-*`: rev 1 held on three bounded corrections; on rev 2, hold 1 (method) closed; on rev 2.1, the phone-reveal hold closed and the clarifications accepted, **with one geometry correction left in §5.4**. Rev 2.2 changes §5.4 and its tests only; §14 says how. GPT accepted the herd, the Medium and High only design and the visible omission wording; its recommended decisions are unchanged. **Nothing is built. Chad's decisions (§9) and his own build go are needed after GPT clears the proposal.** No public-release clearance. Written 08:06 UTC (clock reading).

Authority: Chad's order of 20 Nov (bird, penguin chart, then corridor), his choice of the East Walker herd and his decision of 20 Nov ("Medium and High only, with a visible note that the broader Low-use footprint is omitted; not presented as the complete migration extent"), and his go of 21 Nov: "East Walker corridor proposal, docs only, for GPT review. Medium and High only, with the omitted Low-use footprint stated clearly. No implementation or deployment." Source audit: `docs/research/animals-source-audit/CORRIDOR-USGS.md` rev 1.2 (closed by GPT). Design base: `ANIMALS-EXPANSION-PROPOSAL.md` rev 2, §2, §5 and §10.

Evidence key: [A] the audit · [M] measured by Claude on 21 Nov from the pinned archive on Chad's Mac (§3.2) · [X] read by Claude on 21 Nov, 07:37 UTC, in the pinned metadata XML inside the archive · [G] read or reproduced by GPT · [P] proposed here.

## 1. What this is, in one paragraph

A third kind of card on the Animals tab: a **corridor card**. Under its own labelled switch it draws, on the Animals page's globe, two published polygon classes for one herd: the areas the source calls Medium use and High use during migration. These are **published, modelled migration-use areas** built from a sample of collared animals over stated years. They are not the path of any animal, not where animals are now, not the whole area the herd uses, and not a boundary anyone can navigate by. The source's widest class is left out, and the card says so in plain sight.

## 2. One rule to settle first (Chad)

The standing rule allows recorded animal journeys on the Animals tab as an archive feature, and (P-D0, 21 Nov) dated population evidence. A corridor is neither: it is a fixed, dated, published map product. **Decision C-D0** asks Chad to say it is covered. Suggested wording: "published, dated corridor products are allowed on the Animals tab as an archive feature, labelled with their data years and release date".

## 3. The source

### 3.1 As audited [A]
| | |
|---|---|
| Release | USGS, "Ungulate Migrations of the Western United States, Volume 6", doi `10.5066/P1ETBSYE`, publication date on the record 2026-03-24 |
| Archive | `ungulate-migrations-volume-6.zip`, 160,106,900 bytes, sha256 `9bb5989ceab03235f42426ef51baafadd35eb6bf4ca9a4aaf19d17f6d39e4965` (re-checked on the Mac, 21 Nov 07:24 UTC) |
| Licence on the record | "Creative Commons Zero v1.0 Universal (CC0-1.0) public domain dedication" |
| Metadata use text [X] | "Dataset authors will retain ownership of the data provided. The burden for determining fitness for use lies entirely with the user. For purposes of publication or dissemination, citations, or credit should be given to the authors/originators listed herein." GPT: a disclosure point, not a blocker |
| Herd | California mule deer, East Walker. Place keyword: Bridgeport, California |
| Sample [X] | "267 migration sequences collected from a sample size of 91 animals comprising GPS locations collected every 1-24 hours". Data from 2017, analysed through August 2024 [G] |
| Method for this herd | Fixed Motion Variance; Net Squared Displacement to mark migration periods [G, from the report, SIR 2026-5123 v1.1] |
| Updating | "Complete"; maintenance "As needed". Shown as a fixed, dated product |
| Kept | on Chad's Mac in `_source-data/animals-expansion/`. Never committed, never served |

**How the corridor classes are made, from the metadata's process description [X] (GPT's hold 1):**
1. For each animal, the modelled use maps of its spring and autumn migration sequences are averaged across its years into one map for that animal, rescaled to sum to one.
2. Each animal's **footprint** is the 99% isopleth of its own map.
3. The footprints of all sampled animals are stacked, and corridor levels are defined "based on the number of individuals using a given pixel".
4. The result is converted "from a grid-based format to a polygon format", and isolated polygons under 20,000 m² are removed.
- Averaging the animals' maps into one population map is a **different** step, used for stopovers. Rev 1 described the corridor that way; that was wrong.
- **Class definitions used here are this layer's own attribute definitions [X], confirmed by the report [G]:** Low "the footprint used by at least one individual"; Medium "10–20% of the sampled population"; High "greater than 20% of sampled population". The shared process text states the thresholds generically (at least 10%, at least 20%); it is not substituted for the layer's own definitions.

### 3.2 Measured for this proposal [M]
Read inside the zip without unpacking, in the Mac shell on 21 Nov; both runs had ended by the 07:24 UTC clock reading. Scratch scripts removed afterwards; no output file kept. **GPT independently reproduced the hashes, counts, signed areas, extents and the corner check** with its own reader and its own inverse projection. That confirms counts, areas and extents; it does not establish geometric validity or hole assignment.

| File inside the zip (`…/CA_MuleDeer_EastWalker_Corridors/`) | Bytes | sha256 |
|---|---|---|
| `CA_MuleDeer_EastWalker_Corridors.shp` | 2,131,084 | `365522c5945a54b3b19d446f290912d2720efa9c6a0294914ee77fbe96bf2f1d` |
| `….dbf` | 1,397 | `12ef7c4605af6db921d61f7fae83bf219ab5482ce071a228727027ad92ffe302` |
| `….prj` | 464 | `c8a79e5f788ac300753a916cb2ee3cc9ae246323bc870d487c00c0edc4a1ac3a` |
| `….xml` | 25,155 | `f8e6bb31b6b06f74ac2a63b913f687bd7295148d283fb52bfd4efa84ab6b4a85` |

| Class (`Contour`) | Record | Rings | Outer / holes | Points | Net area km² (projected) [M][G] | Vertex extent, degrees |
|---|---|---|---|---|---|---|
| Low (not shown) | 0 | 14 | 1 / 13 | 84,582 | 1,431.13194 | 119.742°W to 118.944°W, 37.965°N to 38.569°N |
| **Medium** | 1 | 6 | 4 / 2 | 27,966 | 279.95576 | 119.355°W to 119.005°W, 38.151°N to 38.497°N |
| **High** | 2 | 3 | 2 / 1 | 20,623 | 159.08099 | 119.340°W to 119.023°W, 38.179°N to 38.474°N |

(Areas to five decimals are GPT's figures; Claude's run gave the same to three.)

- **Projection, from the `.prj`:** Albers equal-area conic on `GCS_NAD_1983_NSRS2007`, GRS 1980 (a 6,378,137 m, 1/f 298.257222101), standard parallels 29.5° and 45.5°, latitude of origin 23°, central meridian 96°W, no false easting or northing, metres.
- **Corner check:** the four corners of the layer's projected bounding box, taken through the inverse, give 119.8921°W, 118.8154°W, 37.9630°N, 38.6056°N: the metadata's four bounding values, to four decimals. Reproduced by GPT. Forward-then-inverse agreement (about 0.00000001 m) is recorded but **is not independent evidence**: both directions could share one mistake.
- **Two record updates to the audit** (GPT accepted the first and the withdrawal in the second):
  - Its "bounds (metadata)" are the corners of the projected box, not the shapes' extent. The shapes are narrower (table above).
  - Its remark that "the original outlines follow a fine raster" was a visual inference and is withdrawn. What is measured: densely sampled outlines, commonest vertex spacings about 5.1 to 5.5 m, no axis-aligned segment among 133,148. **Nothing is concluded about how they were made from that:** the source's own method says the corridors were converted from a grid to polygons [X], and projection or conversion can leave no axis-aligned segments.
- **Trial encoding, Medium and High, every source vertex:** 48,589 points rounded to 0.00001°, stored as whole-number steps from the previous point: 244,276 bytes of JSON, 32,276 gzipped. No two successive vertices of Medium or High rounded to the same point. These are sizes; they say nothing about drawing speed.
- **Not measured:** ring validity, hole assignment, the relation between Medium and High, rounding displacement, anything about rendering.

## 4. What the visitor sees [P]

### 4.1 Placement and switch
- A new group on the Animals page beside the journey groups: **"Published corridors"**, with one labelled switch: "Mule deer, East Walker herd, California: migration corridor (data 2017 to 2024)". The same switch component as the journeys. **Off at load.**
- Evidence-type label: **published corridor or range**. Group: Land.
- **Recommended (C-D1 A, GPT agrees): the corridor switch is independent of the journeys' "one at a time" group.** A journey and the corridor may both be on. §6.1 says who owns what on the shared globe.
- State line on the card: off · loading · shown · could not be verified · failed, with Retry.
- No replay bar, no marker, no time control: nothing moves.

### 4.2 The drawing
- **Two filled classes with outlines, High drawn above Medium.** They differ by more than colour: High has the darker fill and the heavier outline, and the legend names both in words.
- **A class never fills its own holes.** A hole in Medium is not filled by Medium; a hole in High is not filled by High. (High may lie inside a hole of Medium; that is then High's fill, not Medium's.)
- **Separate patches stay separate.** No line, arrow or direction joins them. No route is drawn; the release's route layers are not used and were never opened.
- **Nothing is drawn for Low.** No faint outline, shading or hint of where it lies.
- No animal symbol, no moving dot, no count on the map.
- **A legend beside the globe while the switch is on**, with this layer's own definitions:
  - "High use: more than 20% of the sampled animals."
  - "Medium use: 10 to 20% of the sampled animals."
  - "Not shown: the source's Low class, the broader footprint used by at least one sampled animal."
- **The omission notice sits with the legend, always visible while the switch is on, not inside a details box** (GPT's wording): "Selected higher-use migration areas. The broader Low-use footprint is omitted." Followed by: "Unshaded does not mean unused."

### 4.3 Reading a small area on a globe
The two classes span about 30 km by 38 km. The whole-globe backdrop is one picture 2,048 pixels wide, about 20 km a pixel: at this zoom it is a blur. Recommended (C-D4 A, conditional on the proof in §7; fallback B):
- **A regional satellite picture from the same registered source, layer and date rule as the page's backdrop**, requested for a fixed box around the herd and laid on the globe under the polygons. §6.2 gives the exact request, its limits and its failure rule.
- **Latitude and longitude lines every quarter degree across the box, labelled**, always drawn while the switch is on, picture or no picture.
- **A scale bar**, under the rule in §6.3; hidden when the view makes it invalid.
- A sentence of plain location from the source's own keyword: "Eastern California, near Bridgeport."
- Wording for the picture: "Regional backdrop: NASA satellite imagery for [date]. It may contain cloud or gaps. It is not from the study's years and shows nothing about the animals or their habitat then." **"Unavailable" is said only for a failed or invalid request.** The page does not judge cloud.
- **No state line, road, town marker or place name is drawn.** Those need a new source and a register entry (option C-D4 C).
- If the whole-globe backdrop has fallen back to the plain globe with the coastline outline: no coastline lies in this inland view, so the backdrop line says "Plain globe; no coastline lies in this view" while the camera is at the corridor, instead of promising an outline that cannot be seen.

### 4.4 What the card says
- Heading: "Mule deer, East Walker herd: published migration-use areas".
- "Published, modelled migration-use areas from a sample of collared animals. Not the path of any one animal, not the herd's whole range, and not where animals are now."
- **Method, plain sentence (GPT's wording):** "The source models a migration-use footprint for each sampled animal, combines the footprints, and classifies areas by the share of sampled animals represented there."
- Technical detail, in the methods note: each animal's migration maps are averaged across its own years; its footprint is the 99% isopleth of that map; the footprints are stacked and counted; the result is converted from a grid to polygons and isolated polygons under 20,000 m² are removed. Method named as the report names it for this herd: Fixed Motion Variance, with Net Squared Displacement to mark migration periods.
- "The sampled animals are not the whole herd. The areas are modelled use, not observations of animals at every point."
- Sample, with roles kept apart: "267 migration sequences from 91 collared animals. GPS fixes every 1 to 24 hours." The 125 captured adult females are **not** given as the corridor's sample.
- Three separate dates: data years (2017, analysed through August 2024), the release date (24 March 2026), the date we last checked the record.
- "This is a fixed, dated product. Nothing on the record says it is refreshed on a schedule."
- "Not a navigation, hunting, access or boundary product."
- "Also in the release and not shown here: stopovers, winter range and per-animal routes."
- **Geometry and position note (GPT's wording for the datum):** "No simplification: every outline point of the two published classes is kept. Coordinates were inverse-projected in NAD83(NSRS2007), rounded to 0.00001°, and displayed on a WGS84 reference globe without a datum transformation. The local datum offset and absolute positional accuracy have not been established." No promise is made that the shapes line up with the imagery to any stated distance.
- Source: the release title, doi, originators as the metadata lists them, the report, the licence as the record words it, and the metadata's own use sentence quoted beside it. Citations copied from the record at build time. No endorsement implied.
- **Text alternative, in the page:** for each class, its definition, the number of separate patches and holes, its area in km² ("area of the published polygons, computed by us in the source's equal-area projection"), and its extent in degrees. No list of vertices.

### 4.5 What it never shows or says
- The Low class, in any form. Stopovers, winter range and individual routes: **not under this proposal at all** (GPT).
- "The migration route", "the corridor the herd follows", "the herd's range", or any wording that makes the shown area the whole.
- Animals "inside" the corridor, a number of animals in an area, a density, or a population figure. 91 is a sample, not a herd size.
- A season, a direction of travel, a current or recent position, or a forecast.
- Recovery, decline, threat or conservation status. Hunting seasons, access or land ownership.
- Use for navigation, hunting, access or as a precise boundary.
- Any inference from the backdrop picture about animal presence, habitat or change.
- A stated positional accuracy, or alignment with the imagery to a stated distance.
- A comparison with any other herd's classes: the class names are not a common scale [A].

## 5. Data path [P]

**Builder** `phase1/animals/build_corridor.py`, standard library only, with a config. It reads the four pinned files inside the pinned zip without unpacking it. **It never repairs, reorders or drops a part: any failure below stops the build, writing nothing, and is reported.**

### 5.1 Pins and structure
1. Zip sha256; each inner file's bytes and sha256 (§3.2).
2. The `.prj` text equals the pinned text exactly, and its parameters equal the config's.
3. A polygon shapefile with exactly 3 records; `.dbf` fields State, Species, Herd, DataType, Contour with CA, MuleDeer, EastWalker, Corridors and Low, Medium, High in that order.
4. The metadata `.xml` contains, word for word, the three class definitions, the sample sentence, the use constraint and the process sentences the config quotes.
5. Per class: rings, outer rings, holes and points equal the config (exact); the **source's** net projected area equals the pinned full-precision value within **0.001 km²**. (Rounded areas have their own bounds, 16.)

### 5.2 Validity of the source geometry (full precision, projected metres)
6. Every coordinate finite.
7. Every ring closed, with at least three distinct vertices that are not all on one line, and a signed area that is not zero.
8. Orientation as the format expects: outer rings clockwise, holes anticlockwise.
9. Every ring simple: no two of its segments cross or touch except neighbours at their shared vertex.
10. Hole assignment: every hole lies strictly inside exactly one outer ring of its own class; the assignment is recorded.
11. Holes of one outer ring have disjoint interiors; outer rings of one class have disjoint interiors.
12. **Touching policy:** two rings of the same class that touch at a point or along a line are **not accepted silently**. The build stops and reports where; the answer (accept as the source's own geometry and record it, or not show the class) comes back to GPT and Chad. No repair.

### 5.3 Conversion and rounding
13. Inverse Albers for the ellipsoid with the `.prj` parameters. The result is geographic coordinates **on NAD83(NSRS2007). No datum transformation is applied**; the manifest says so in the words of §4.4.
14. Rounded to 0.00001°. **Rounding is not an accuracy claim.**
15. **Displacement limit:** each rounded vertex, projected forward again, lies within **0.75 m** of its source vertex (half a rounding cell's diagonal here is about 0.71 m). The largest displacement per ring is recorded.
16. **Area-change bound:** for each ring, the area recomputed from the rounded vertices (projected forward) differs from the source ring's area by no more than **0.75 m × that ring's perimeter**; both areas, the difference and the bound are recorded per ring. Per class, the net area after rounding is within 0.05% of the source's.
17. Checks 6 to 12 are run again on the rounded geometry, with the same results required: same orientation of every ring, same hole assignment, no new touching or crossing, no ring lost, no two successive vertices equal.
18. The corners of the projected bounding box, converted, equal the metadata's four bounding values to four decimals.

### 5.4 Relation between Medium and High (measured in the source and in the output; never repaired)
A class's **filled area** is its outer rings less their holes. The relation is defined and measured **over the complete filled areas**, not from sample points.

19. **The arrangement.** All boundary segments of both classes (outer rings and holes) are taken together and split at every point where two of them meet: proper crossings, a vertex of one lying on a segment of the other, shared vertices, and the ends of any stretch where two segments run along each other. All of this is computed exactly (rational arithmetic on the source's numbers; whole-number arithmetic on the rounded output), so no tolerance decides whether two boundaries meet.
20. **Faces.** The split segments divide the plane into faces. **No boundary of either class passes through the inside of a face.** That is the reason, and the only reason, a single exact point test is allowed here: one point inside a face decides, for the whole face, whether it is in Medium's filled area and whether it is in High's, holes included, because membership can only change by crossing a boundary and none crosses the face. The build checks that the faces' areas add up exactly to the area of their union's outline, so no face is missing or counted twice.
21. **Three exact areas:** A(M), the filled area of Medium; A(H), of High; and **I, the area of the faces that are in both filled areas.** Each is an exact number, not a rounded one.
22. **The relation, by those areas:**
   - **bands**: I is exactly zero. The filled interiors are disjoint.
   - **nested**: I is exactly A(H), and A(H) is less than A(M). Every part of High's filled area is in Medium's.
   - **mixed**: anything else: 0 < I < A(H) (partial overlap or partial containment), or I equal to A(M) (Medium inside High, including the case where the two filled areas are the same).
23. **Boundary contact between the classes is recorded as evidence and does not decide the relation by itself.** Recorded, with positions: the number of proper crossings; the number of point contacts (a vertex on the other's boundary, or a shared vertex, without crossing); the total length along which the two boundaries coincide. Policy: contact that encloses no shared area leaves the relation as the areas give it (bands that share an edge are bands; nested High touching Medium's boundary from inside is nested), and is shown in the manifest. **A proper crossing is impossible when I is zero or I equals A(H); if the build finds one together with either, its own evidence disagrees with itself and it stops as unresolved.**
24. **Unresolved stops.** If the arrangement cannot be completed, the face-area check of 20 fails, or the second calculation in K1b disagrees, the relation is unresolved and the build stops and reports. No point is moved and no tolerance is introduced to get an answer.
25. **Mixed stops the build** for a decision, with I, the faces concerned and their positions reported.
26. **Source against output.** The whole of this is run on the source and again on the rounded output. **The relation must be the same, and so must the kind of evidence behind it:** I zero in both, or I equal to A(H) in both; proper crossings none in both; point contacts and coincident length each either absent in both or present in both. **Any difference stops the build for review.** The counts and lengths themselves are recorded for both.
27. **Near-boundary reporting, separate from all of the above.** Vertices of one class within 0.01 m (source) or 1.5 m (output) of the other class's boundary are counted and listed, to show where rounding could matter. They decide nothing and excuse nothing; the relation comes from 19 to 26 only.
- Either way High is drawn above Medium and the legend's definitions do not change.

### 5.5 Outputs
- **Low is read only for checks 1 to 5 on its record. No Low record, ring, polygon or coordinate array is written to any output.**
- Three files: a display file (exactly two classes; each a list of polygons, each with one outer ring and its holes; whole-number steps), a manifest (pins, projection, the datum sentence, every count and check result, per-ring tables, the relation found, wording, the record block, the definitions and process sentences quoted from the metadata), and the corridor section's own list `assets/animals/corridors-R1.catalog.json`. **The journey list, the population list and every existing data file stay byte-identical.**
- `--check` rebuilds in memory and compares, exit codes as the other builders'.
- **Page:** a new script `animals-corridor.js` with its own pinned list checksum and the same chain as the census (script pins list, list pins manifest, manifest pins display file, structure check, then drawing).

## 6. Page behaviour [P]

### 6.1 The shared globe: who owns what (GPT's hold 3)
- **Scene objects.** The corridor script creates and keeps a list of its own objects: the two classes' fills and outlines, the latitude and longitude lines and their labels, the regional picture. **Switching the corridor off removes and disposes only those.** A journey's marker, trail, fix marks and replay are never touched by the corridor, and the corridor's objects are never touched by a journey.
- **Camera.** The camera is shared. It moves only on an explicit action by the visitor:
  - switching the corridor on, or pressing "Go to the corridor area", moves it to the corridor;
  - a journey's own switch or "go to the journey area" moves it to the journey, without changing the corridor's state.
  - **View status makes no claim about what is visible.** After a go-to, the legend says what was done: "View moved to the corridor. The journey remains on." (and "View moved to the journey. The corridor remains on."). When the visitor then drags or zooms, that line is removed; nothing is inferred from the last go-to about what is or is not in view at the current zoom.
- **Bringing the globe into view on a phone is page scrolling, and it happens at the press** (the journeys' rule, as passed at Stage 1): once, immediately, when the visitor presses the corridor switch on or the card's Retry, with the loading or failure status shown beside the globe. **No answer scrolls the page:** not geometry success or failure, not picture success or failure. No scroll for switching off, for page load, for background or list retries, or for a control that is unavailable. Focus stays on the control used. Reduced motion: the scroll is a jump, not a glide.
- **Moving the camera is separate from scrolling the page.** The camera move for "switch on" is deferred until the geometry is drawn, and it happens only if that press is **still current**: the load it started has not been superseded or cancelled, and since the press there has been no switch-off, no journey selection or journey go-to, no drag, zoom or other camera gesture, and no other go-to. Scrolling the page does not cancel it, because the camera move does not move the page.
- **"Late" means stale or superseded:** an answer whose load is no longer the current one. A current answer may complete its own pending camera move; a stale answer does nothing at all. **A regional-picture answer never owns a camera move or a scroll**, current or not.
- **Backdrop text.** The whole-globe backdrop line belongs to the globe module. The regional picture has **its own separate line** in the corridor's legend. Neither module writes the other's line; a whole-globe backdrop answer arriving while the regional picture is shown changes only the globe's line.
- **Off cancels everything pending.** Switching off aborts the geometry request and the picture request, invalidates their tokens, cancels the pending camera move, removes the corridor's objects and legend, and announces once. A late success or failure after that draws nothing, announces nothing, writes no status and restores no text.
- **Declared changes to shared code.** If close viewing or independent drawing needs any change to `animals-globe.js`, the coastline drawing or the journey script (zoom limits, render order, the handle the scripts share), the packet lists each change, and **the whole combined-page suite with all its breaks is rerun**. "Journey scripts untouched" is not offered as proof that journey behaviour is unchanged; the suite is.

### 6.2 The regional picture: exact request and limits
| | |
|---|---|
| Endpoint | the page's existing one: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi`, WMS 1.3.0 GetMap |
| Layer and date | the page's layer (`VIIRS_NOAA21_CorrectedReflectance_TrueColor`) and the page's date (the UTC date 36 hours before now), the same constants |
| CRS and axis order | `EPSG:4326`; in WMS 1.3.0 the box is south, west, north, east |
| Box | 37.8, −119.8, 38.8, −118.6 (1.0° by 1.2°), fixed in the manifest |
| Size and format | 960 by 800 pixels, JPEG. **That is the requested spacing (0.00125° a pixel), not the imagery's native resolution**, which is read from GIBS's layer documentation at build and stated on the card |
| Limits | fetch limit 20 s; decode limit 5 s; the answer must be an image of exactly the requested size, else invalid |
| Request cap | **at most three requests in total per page load, including the first automatic one.** The automatic request is made when the switch first goes on. A successful picture is kept in memory and reused for every later switch-on. A switch-off that aborts the automatic request **has used that attempt**; later toggles do not start it again by themselves |
| Asking again | when the picture is not loaded (failed, invalid, or aborted) and attempts remain, the picture's own line carries a button, "Try the regional picture again", which works while the corridor is on and needs no switch to be toggled. After the third request: "No further attempts on this visit. Reload the page to try again." |
| Never | no request on pan, zoom, resize or animation frame |
| Failure | failed or invalid: "Regional satellite picture unavailable"; lines, labels, scale and polygons still shown |

- This request pattern is recorded in the source and release notes for the register work. It is the same dataset as the page's backdrop, asked for a region.
- **Loading and error handling are independent; the picture never outlives the geometry.** A picture failure leaves the verified polygons shown. A geometry load or verification failure returns the corridor to off and removes and invalidates the regional picture with everything else the corridor owns: no regional picture is ever left on the globe without the corridor's polygons.

### 6.3 The scale bar
- It states the ground distance, along the surface, between the two globe points under the bar's two ends, at the centre of the canvas.
- It is shown only while (a) both ends are on the globe, and (b) the same pixel length measured at the left and right edges of the corridor box differs from the centre's by no more than 5%. Otherwise it is hidden, not shown wrong.
- **It is hidden the moment a camera movement or a resize begins**, and shown again, freshly checked, once the view is still. A stale length is never left on screen during motion. It is not recomputed on every frame.
- Its label reads "Scale at the centre of the view".

### 6.4 Loading, failure and access
- Nothing of the corridor is fetched before its switch is on, except its list and manifest for the card's facts. The display file and the regional picture are requested only when the switch goes on.
- On while loading counts as on; a failure returns the switch to off with the error and Retry on the card.
- A failed or unverified corridor file leaves the journeys and the census untouched, and theirs leave the corridor untouched. A failed globe leaves the card, legend text, omission notice and text alternative readable.
- **Lost graphics context:** the corridor's state says the globe stopped; its text stays; nothing is redrawn into a dead context; after a reload it starts off.
- One polite announcement on switching on, one on shown or failed, one on off. Nothing on camera movement.
- Keyboard: Tab reaches the switch and "Go to the corridor area"; Space and Enter operate them. Focus stays on the control used.
- The polygons are not interactive: no hover, no click.

### 6.5 Drawing cost: what is reported and the budget
Reported in the packet, on the suite's software renderer and on Chad's Mac in Chrome:
- time from the verified display file being in memory to the first frame with both classes drawn;
- the longest single main-thread task during that;
- median and worst frame time over a five-second orbit with the corridor shown, alone and with a journey also shown.

**Declared private-preview budget:** first draw within 1,500 ms and no main-thread task over 500 ms on Chad's Mac; on the software renderer the figures are reported without a pass mark. A miss is reported and comes back for a decision (which may be C-D3 B); the budget is not loosened in the build.

## 7. To prove first in the build (stop and report if any fails)

1. The regional picture: that the request of §6.2 returns this layer, what its native resolution is, and that it lies on the globe without a seam or a visible offset against the latitude and longitude lines. If not, C-D4 falls back to B and that is reported.
2. That the camera can come close enough for the two classes to be told apart at desktop and 390 px, and that legend, notice and globe fit without covering each other, with and without a journey shown.
3. The drawing figures of §6.5.
4. Checks 6 to 12 and 19 to 27 on the real source. If the source itself fails one, stop: nothing is repaired.

## 8. Acceptance criteria (to become tests)

**Builder**
- K1 Each stop condition 1 to 27 of §5 stops the build, shown with a made-up archive re-pinned so that the named rule is what stops it; an un-pinned change stops at the checksum. Made-up cases include: a hole outside every outer ring, a hole inside two, overlapping outer rings, overlapping holes, a ring that touches itself, two rings touching, a zero-area ring, a ring of collinear points, a non-finite coordinate, a relation that changes on rounding, contact evidence that changes on rounding, an unresolved arrangement, and these relation cases, each with its exact expected I: **two crossing rectangles (Medium x from −200 to 200 m, y from −50 to 50; High x from −50 to 50, y from −200 to 200: no vertex of either inside the other, four proper crossings, 10,000 m² of overlap; must be mixed, never bands; GPT's counterexample)**; one High component inside Medium and another outside (mixed); a Medium component inside High (mixed); **shared edges with overlap (Medium x from 0 to 400, y from 0 to 200; High x from 200 to 600, y from 0 to 200: no proper crossing, 400 m of coincident boundary, I = 40,000 m² against A(H) = 80,000; must be mixed, never bands; GPT's counterexample)**; **High covering a Medium hole (Medium square 0 to 1,000 with a square hole 400 to 600; High square 300 to 700: no contact at all, I = 120,000 m² against A(H) = 160,000; must be mixed, never nested; GPT's counterexample)**; High exactly filling a hole of Medium (I = 0, bands, coincident boundary recorded); High strictly inside a hole of Medium (bands, no contact); High wholly inside Medium's fill (nested); High inside Medium touching its outer boundary at one vertex (nested, one point contact recorded); two shapes meeting only at a corner (bands, one point contact).
- K1b **A second calculation of the three areas.** The test computes A(M), A(H) and I by a different method from the builder's (horizontal strips between successive vertex heights, each strip's overlap worked out exactly), for every made-up case above and for the real data in source and output. It must agree with the builder exactly. A disagreement is a failed test, and in the builder's own run it is the unresolved stop of §5.4 (24).
- K2 Outputs rebuild byte-identically from the pinned zip; `--check` reports the same.
- K3 **Independent projection evidence.** The test has its own shapefile reader and an inverse projection written from a different formulation (the authalic-latitude series, not the builder's iteration). Before it is compared with the builder it is checked against **fixtures that do not come from our code**: (a) the metadata's four bounding values, which come from the source's own software; (b) the worked numerical example for the ellipsoidal Albers projection in Snyder, *Map Projections: A Working Manual* (USGS Professional Paper 1395), with the numbers copied from the printed text at build and the page cited in the packet. Then it converts every vertex of both classes and is compared with the builder. **No point-by-point fixture from GPT exists today:** GPT's reviews supplied areas, extents and the envelope check, which are used as such (§3.2). If GPT supplies vertex values at candidate review they are added and labelled as GPT's; none is invented or attributed. The printed example and the independent full-data calculation must be real and cited at candidate review.
- K4 **No Low geometry in the outputs.** The test decodes every geometry in the display file and requires exactly the intended rings: Medium's 6 and High's 3, each equal vertex for vertex to the test's own conversion of that source ring, and nothing else. It requires that no class record, ring, polygon or coordinate array for Low exists in the display file, manifest or list. (A single number that happens to equal a Low coordinate is not leakage and is not tested for.)
- K5 Counts exact. **Source** net areas (full precision, before rounding) within 0.001 km² of §3.2. **Rounded** areas are not compared with §3.2: each rounded ring is within 0.75 m × its perimeter of its own source ring, and each class's rounded net area within 0.05% of its source net area. Both sets are recorded. Per-ring displacement at most 0.75 m. The manifest's per-ring tables equal the test's own computation.
- K6 The journey list, the population list and every existing data file are byte-identical to Stage 3.
- K7 Only three files are written; no source file is in the repository.

**Page**
- K8 Off at load; no display file or regional picture requested before the switch is on; allowed origins listed.
- K9 On: exactly two classes drawn, High above Medium; each drawn polygon's vertices equal the display file's. **Holes, per class:** for a test point inside each hole of Medium, Medium's own fill does not cover it; the same for High's hole and High's fill. (Whether another class covers that point is whatever the measured relation says, and is asserted to match it.)
- K10 **Among corridor-owned objects**, none joins two separate patches, and there is no line or marker other than the polygon outlines, the latitude and longitude lines and their labels. Journey-owned objects are outside this check.
- K11 The omission notice, the three legend lines and "Unshaded does not mean unused" are visible whenever the switch is on, at every tested width, without opening anything.
- K12 Wording comes from the manifest; the class definitions and the plain method sentence equal the manifest's; the datum sentence is present word for word.
- K13 Claims: none of the forbidden statements of §4.5 appears (a list of patterns, as for the census); 91 never appears as a herd size; 125 never appears as the corridor sample; "averaged across animals" never describes the corridor.
- K14 One changed digit in the list, the manifest or the display file: "could not be verified", nothing drawn, Retry recovers with good files. Re-pinned structural faults (a third class, a class named Low, a missing hole, an open ring, a vertex outside the extent) are refused.
- K15 Geometry races, each with the held request confirmed in flight: on then off while loading; on, off, on; a held answer arriving after off draws nothing, announces nothing and writes no status; the time limit ends a load that never answers.
- K16 **Picture races, separately from geometry:** picture held while geometry succeeds; geometry held while picture succeeds; off and Retry during each; a held picture arriving after off is not added to the scene and writes no line; **a geometry failure removes a picture already shown**; the cap is three requests in total: ten toggles after a success make one request; an automatic request aborted by off is not restarted by later toggles and is offered through "Try the regional picture again"; a fourth request is never made; no request on pan, zoom or resize; an answer of the wrong size or type is refused.
- K17 **Camera:** with geometry held and a pending switch-on move, each of off, a journey selected, a journey go-to, a drag, a zoom and another go-to cancels it, and the camera is where the visitor left it after the answer arrives; with none of those, the current answer completes the move once; a stale answer (superseded load) never moves it; a picture answer never moves it. Scrolling the page alone does not cancel the camera move.
- K18 **Both on.** With a journey shown: switching the corridor on and off leaves every journey-owned object, the replay state and the journey's switch unchanged (counted before and after), and the reverse. Each go-to moves the camera and changes neither state. The view-status line says what the go-to did, is removed after a drag and after a zoom, and no text anywhere says an item is in or out of view. The census is unaffected and unaffecting.
- K19 **Off removes only corridor-owned things:** its scene objects, legend, labels, scale bar and regional picture, counted before and after, with a journey shown and without; the globe module's backdrop line is unchanged by the corridor at any point.
- K20 A whole-globe backdrop answer (success and failure) arriving while the regional picture is shown changes only the globe's line; the plain-globe wording at the corridor view is as §4.3.
- K21 Regional picture failure: lines, labels, scale bar and polygons still shown; the line says unavailable and gives no date. A successful picture is never called unavailable.
- K22 **Phone, geometry held:** press the switch on; the globe is in view **before** the answer is released; scroll away to another card; release the answer; **the page is where the visitor left it** (scroll position unchanged), the polygons are drawn, and focus is unchanged. The same with the card's Retry after a failure, with a geometry failure released instead of a success, and with a held picture released after scrolling away. Reduced motion: the reveal is a jump. No scroll at page load, on switch-off, on a list retry, or from an unavailable control. No camera movement at load.
- K23 Layout at 360, 390, 720, 900, 1100, 1280, 1470 px, **with the corridor alone and with a journey also shown (replay bar present)**: nothing overflows; legend and notice do not cover the globe on narrow screens; switch and buttons at least 44 px.
- K24 Keyboard and announcements as §6.4.
- K25 No globe (library failure) and lost context, **each with the corridor alone and with a journey also selected**: both cards, the legend text, the omission notice and the text alternative remain; nothing is drawn into a lost context.
- K26 Scale bar: where shown, its stated length is within 3% of the surface distance between the two globe points under its ends; it is hidden in each invalid case of §6.3 (an end off the globe; the 5% rule at a far view); **it is hidden during a camera movement and during a resize, checked while the movement is in progress, not only after it**; the labelled lines are at the stated quarter degrees within one pixel.
- K27 The drawing figures of §6.5 are produced by the suite and printed; the Mac figures are taken by hand and stated as such.
- K28 The combined page suite with all its breaks and the census suite still pass; Earth now files equal the baseline as before.
- K29 Private-preview wording as on the other cards.

## 9. Decisions for Chad (after GPT clears the proposal)

**The build go must say, in Chad's own words, that he knows the built corridor files will sit on a public branch.** Suggested: "Go: corridor Stage 4 on animals-tab-rc, C-D0 yes, A, A, A, A, A. I know the derived corridor files committed to the public branch will be publicly downloadable, though not on the live site."

GPT's recommendations are in brackets; they are not Chad's decisions and not a build go.
- **C-D0** The rule covers a published, dated corridor product (§2). Recommended: yes. [GPT: yes]
- **C-D1 The switch.** A (recommended): independent of the journeys' group, with the shared-globe rules of §6.1. B: one thing on the globe at a time. [GPT: A]
- **C-D2 Layers.** A (recommended, and what the go says): corridors, Medium and High only. Stopovers, winter range and routes are not part of this proposal; adding any would need a new one. [GPT: A]
- **C-D3 Geometry.** A (recommended): **no simplification; all source vertices are retained before rounding. Geometry and rendering are validated separately** (§5, §6.5). About 244 KB (32 KB gzipped) on the trial. B: simplify to a stated tolerance with the audit's validation list; only if A misses the drawing budget. [GPT: A, subject to the checks and measured performance]
- **C-D4 Reference context.** A (recommended, conditional): the regional picture of §6.2 with labelled lines and a scale bar; **if the proof in §7 fails, B (lines and scale only) is built and that is reported.** C: also a state line and place names from Natural Earth (new files, a register entry, its own small audit). [GPT: A with tested fallback B]
- **C-D5 Where.** A (recommended): a fourth stage on `animals-tab-rc`, candidate back to GPT. B: its own branch. [GPT: A]

## 10. "Private preview": what it does and does not mean

GPT asked that this be established, not assumed.
- **The repository is public.** A file on any branch can be downloaded by anyone who knows or finds its address. Checked 21 Nov: a data file on `animals-tab-rc` answers HTTP 200 from GitHub's raw-file address without signing in.
- **GitHub Pages serves `main` only**, so nothing on `animals-tab-rc` is on the live site, linked from it, or indexed as part of it.
- So "private preview" here means **not on the live site and not announced**. It is **not access control**. A built corridor display file on the branch would be publicly downloadable, as the four journey files and the census file already are.
- An unlinked branch is not guaranteed to stay unindexed by search engines or code search.
- **So GPT's earlier finding ("no additional enquiry … for a genuinely local/private preview") does not by itself clear putting derived corridor files on this public branch.** GPT's rev 2 review: before a build writes and pushes display files there, **Chad's own go must explicitly cover that known exposure** of this published aggregate product. It can be part of the ordinary build go; no email and no separate approval step. Suggested words for that go are in §9. Release on the live page stays separate, with his sensitivity decision.

## 11. Not done, not claimed

- Nothing built. No output file exists; the trial encoding was removed with its script.
- The report PDF: not read by Claude. Its East Walker section was read by GPT. GPT's method correction rests on the pinned XML, which Claude has now also read [X].
- Ring validity, hole assignment, the Medium and High relation, rounding displacement: not measured.
- The regional picture, its native resolution, the close view, drawing speed: not tried.
- The local datum offset and absolute positional accuracy: not established, and the card says so.
- Sources page, REGISTER (including the regional request pattern), sensitivity decision, public release: Chad's, later.

## 12. GPT's review of rev 1, and what rev 2 changed

| GPT's point | Rev 2 |
|---|---|
| Hold 1: the method sentence confused the corridor with population-averaged maps | §3.1 sets out the four steps from the XML [X]; §4.4 uses GPT's plain sentence; the layer's own thresholds are kept; "not the whole herd", "modelled use, not observations" added; K13 forbids the old description |
| Hold 2: "nothing can vanish or change shape" is false | Withdrawn. C-D3 A now reads as GPT worded it |
| Hold 2: validity beyond crossings | §5.2 checks 6 to 12 on the source and again on the output (17): finite, distinct non-collinear vertices, non-zero area, orientation kept, simple rings, hole assignment, disjoint holes, disjoint outers, an explicit touching policy; stop and report, no repair |
| Hold 2: numeric rounding limits | 0.75 m displacement per vertex; per-ring area change within 0.75 m × perimeter; per-class 0.05%; expected areas within 0.001 km² |
| Hold 2: independent projection evidence | K3: a different formulation, checked against the metadata's values, a printed reference example and GPT's values before it is compared with the builder; round-trip agreement no longer offered as independent |
| Hold 2: cross-class relation | §5.4: measured in source and output; mixed or changed relation stops the build. (Rev 2's vertex-only definition and its "noise" wording were wrong; replaced in rev 2.1, §13) |
| Hold 2: K4 | Rewritten: decode all geometries, exactly the intended rings, no Low record or array; shared numbers are not leakage |
| Hold 2: K9 holes | Per class: a class does not fill its own holes; High may occupy a Medium hole |
| Hold 3: shared globe | §6.1: ownership of objects, camera and backdrop text; one cancellable move per action (the phone reveal corrected in rev 2.1, §13); off cancels and removes only corridor resources; late answers draw, announce, write and move nothing; declared shared-code changes rerun the whole suite. K10 and K19 scoped to corridor-owned objects; K15 to K20 |
| Datum | GPT's sentence used word for word (§4.4, §5.3); "order of a metre" removed; no alignment promise (§4.5) |
| Regional GIBS | §6.2: exact layer, endpoint, version, CRS and axis order, box, size, date rule, limits, cap, caching; requested against native resolution; cloud never called unavailable; context only |
| Audit refinements | First accepted. Second reworded: the visual inference is withdrawn and nothing is concluded about origin; the source's grid-to-polygon step is quoted |
| Wording | "Not a navigation, hunting, access or boundary product"; no inference from the backdrop (§4.4, §4.5) |
| K5 tolerance, scale-bar validity, performance | §5.3 and K5; §6.3 and K26; §6.5 and K27 with a declared budget |
| K20 and K22 with both active | K23 and K25 |
| Coastline fallback at close zoom | §4.3 last point; K20 |
| Sensitivity and "private" | §10; stopovers, winter range and routes excluded from this proposal (§4.5, C-D2) |

## 13. GPT's review of rev 2, and what rev 2.1 changed

GPT closed hold 1 and accepted the rest of rev 2's answers, noting that the displacement and area limits are declared acceptance limits, not guarantees the source will pass: everything still has to be measured, and a failed limit is reported, never repaired or loosened.

| GPT's point | Rev 2.1 |
|---|---|
| Remaining hold 2: "bands" ignored the crossing count; a vertex-only test misses real overlap (the crossing rectangles) | (Replaced again in rev 2.2, §14: rev 2.1's one-point-per-component test was still unsound.) §5.4 rewritten: exact proper-crossing tests and component containment with holes respected decide the relation together; bands means disjoint filled interiors; any proper crossing is mixed; partial containment is mixed. The counterexample and four more relation cases are in K1 |
| The 0.01 m and 1.5 m distances are not proof of noise | Near-boundary cases are reported separately and decide nothing (now §5.4 (27)); any source-to-output difference stops for review; nothing is discarded. (Rev 2.1's "unresolved component" rule went with its test; see §14) |
| Remaining hold 3: the phone reveal was timed by the response | §6.1: the reveal is at the press of the switch or Retry, as the journeys'; no answer scrolls the page; no scroll on off, load, list retries or unavailable controls. Camera movement is separate; "late" is defined as stale or superseded; a picture answer owns no camera move or scroll. K17 and K22 (held geometry, scroll away, release; Retry; failure; reduced motion) |
| Scale during motion | §6.3 and K26: hidden when movement or resize begins, tested during movement |
| K5 area scope | §5.1 (5) and K5: 0.001 km² is for source areas against §3.2; rounded areas use their own bounds; both recorded |
| Image cap | §6.2: three in total including the first; an aborted automatic request has used its attempt; "Try the regional picture again" works without toggling anything; K16 |
| Geometry against image failure | §6.2: independent loading and errors; a geometry failure removes the picture; K16 |
| View status | §6.1: says what the go-to did, removed on a gesture, no claim about visibility; K18 |
| K3 fixture provenance | K3: no GPT point fixtures exist today and none is attributed; the printed example and the full-data calculation must be real and cited at candidate review |
| Private-preview disclosure | §10 and §9: Chad's build go must acknowledge the public branch in his own words; an unlinked branch is not guaranteed unindexed |

## 14. GPT's review of rev 2.1, and what rev 2.2 changed

GPT closed the phone-reveal hold and accepted the clarifications. One correction remained, in §5.4: **one inside point per component cannot establish that two filled areas are disjoint, or that one contains the other.** Its two counterexamples both passed rev 2.1's test wrongly: two rectangles sharing edges with 40,000 m² of overlap would have been called bands, and a High square covering a hole in Medium would have been called nested.

| GPT's point | Rev 2.2 |
|---|---|
| Define the relation over the complete filled areas | §5.4 (21, 22): three exact areas, A(M), A(H) and the shared area I; bands is I = 0, nested is I = A(H), everything else is mixed |
| A representative point only after proving the region cannot change membership; holes and all contacts in that proof | §5.4 (19, 20): boundaries of both classes, holes included, are split at every crossing, vertex-on-segment contact, shared vertex and coincident stretch; a point test is used only per face, and a face has no boundary through it; a face-area sum check guards completeness |
| Shared edges, endpoint contacts, coincident boundaries: classify with complete evidence or stop | §5.4 (23, 24): contacts are recorded by kind and do not decide the relation; the areas do; evidence that contradicts itself, an arrangement that cannot be completed, or a disagreeing second calculation stops as unresolved |
| Carry the source and output rule over the complete evidence | §5.4 (26): relation and the kind of each piece of evidence must match; any difference stops |
| Both counterexamples in K1 | K1, with their exact shared areas; neither may pass as bands or nested |
| Not asked for: a library, a new audit, a redesign | None added. Standard library, exact arithmetic. K1b adds a second, different calculation of the areas as the check on the first |

The proximity distances of rev 2.1 are kept only as a report (27). The "unresolved inside point" rule of rev 2.1 is removed with the test it belonged to.
