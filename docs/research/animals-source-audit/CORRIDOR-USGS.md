# Animals: audit C, migration corridor (USGS volume 6)

20 Nov 2026 · **rev 1.1** (rev 1 accepted by GPT as source-feasibility work with corrections, `reviews/2026-11-20-animals-audits-c-d-gpt-review.md`; rev 1.1 carries them and adds the class definitions read from the metadata at 14:18 UTC) · read-only research under brief C (`docs/concepts/ANIMALS-EXPANSION-AUDIT-BRIEFS.md` rev 1.1), on Chad's go of 20 Nov. Nothing built, nothing sent, no account. Claude retained no raw working copies; the archive Chad downloaded remains in his Downloads.

**Results**
- **California mule deer, East Walker: usable as a source, at feasibility level. Chad chose it on 20 Nov.** Three released polygon layers, complete metadata, small geometry. Which classes are shown, and at what simplification, is not settled (§5a, §6).
- **Oregon and Nevada pronghorn, Sheldon-Hart Mountain: usable, with two conditions.** Its geometry is about twenty times larger, and its corridor layer has a class named "1 individual". **Correction (GPT): East Walker's "Low" class has the same definition under another name** (§5a). Rev 1 missed that.
- **Recommendation: East Walker for a first corridor module.** This reverses Claude's earlier lean towards Sheldon-Hart Mountain, which was made before the files were measured. The choice is Chad's.
- One wording point to disclose, not a blocker: the release is marked CC0 on its record, while each herd's metadata says the authors "retain ownership" and asks for credit (§3).

## 1. How this was done

- Record pages (ScienceBase) read in Chad's Chrome between the 13:39 and 13:51 UTC clock readings, 20 Nov 2026: the release's child-item list and two herd records.
- Chad downloaded `ungulate-migrations-volume-6.zip` himself. Claude read it in the Mac shell, from his Downloads, **inside the zip, without unpacking**, between 13:57:25 and 13:59:09 UTC (clock readings). The analysis scripts ran in the shell's scratch folder, which was then removed.
- Shapefiles were parsed directly (no GIS library): record headers, parts, points, ring direction; the `.dbf` attribute tables; the `.prj` files; and the FGDC metadata `.xml` as text.
- No PDF opened. The report (SIR 2026-5123) was not read.

## 2. The release

| | |
|---|---|
| Release | USGS, "Ungulate Migrations of the Western United States, Volume 6", doi `10.5066/P1ETBSYE`, publication date on the record 2026-03-24 |
| Archive | `ungulate-migrations-volume-6.zip`, **160,106,900 bytes**, sha256 `9bb5989ceab03235f42426ef51baafadd35eb6bf4ca9a4aaf19d17f6d39e4965` (the record page shows "152.69 MB") |
| Contents | 152 files, 213,446,350 bytes unpacked: 30 layers, each with `.shp`, `.shx`, `.dbf`, `.prj`, `.xml` |
| Licence on the record | "Creative Commons Zero v1.0 Universal (CC0-1.0) public domain dedication" |

**Herds released: 11** (the report covers 23; the record says not all underlying files are released).

| Herd | Corridors | Stopovers | Winter range | Routes |
|---|---|---|---|---|
| California mule deer, East Walker | yes | yes | yes | yes |
| California mule deer, West Walker | yes | yes | yes | yes |
| Nevada mule deer, Washoe | yes | yes | yes | yes |
| Nevada pronghorn, Central Washoe | yes | yes | yes | |
| Oregon pronghorn, Paulina | yes | yes | yes | |
| Oregon and Nevada pronghorn, Sheldon-Hart Mountain | yes | yes | yes | |
| Oregon, Nevada and California pronghorn, Surprise Valley | yes | yes | yes | |
| Wyoming mule deer, Upper Wind River | yes | yes | | |
| Wyoming pronghorn, Sublette | yes | yes | | |
| Wyoming mule deer, Uinta | | | | yes |
| Wyoming pronghorn, Gillette | | | | yes |

Route layers (per-animal lines) are not used and were not opened.

## 3. What the metadata says (both herds audited; the method text is the same in every layer)

- **Method.** Migration sequences are picked out per animal and year from GPS tracks. Utilisation distributions are estimated for each sequence (the metadata names the Brownian bridge movement model, or a Fixed Motion Variance method), averaged per animal, then across animals, to give a population-level surface. Corridor classes are cut from that surface.
- **Stopovers:** "the highest 10 percent of use" of the mean population-level surface (attribute definition); the method text says the top 10% "of the area of use" of the population-averaged values. Either way it is a share of modelled use, **not 10% of the corridor's land area** (GPT; rev 1's card wording said otherwise).
- **Small patches are already removed by the source:** isolated polygons under 20,000 m² are dropped when the grids are converted to polygons.
- The method text is shared by every layer and describes three corridor levels in general terms (at least one individual; at least 10%; at least 20% of individuals). Each layer's own attribute definitions are the ones to use (§5a). Some corridors in the series were made by a line-buffer method instead; which method each audited herd used is not stated in the text read.
- **Winter range:** the core range by the 50% isopleth of winter use.
- **Status and updating:** progress "Complete"; maintenance "As needed". Nothing says a herd's polygons are refreshed on a schedule. **Shown as a fixed, dated product.**
- **Constraints.** Access: "None." Use: "Dataset authors will retain ownership of the data provided", fitness for use is the user's burden, and for publication or dissemination "citations, or credit should be given to the authors/originators listed herein".
  - This sits beside the CC0 mark on the record. The card credits the originators and the USGS release in any case. Whether "retain ownership" narrows the CC0 dedication is not for Claude to decide; it is recorded for the release review.
- **Sensitivity:** the metadata of the layers audited contains no sensitivity statement and no mention of withheld data for these herds.
- **Coordinate system (all layers):** `NAD_1983_NSRS2007_Contiguous_USA_Albers`, a projected system in metres on GRS 1980. Axis order x (easting), y (northing). The metadata also gives each layer's bounds in degrees. A display needs a stated reprojection to longitude and latitude; none was done here.

## 4. East Walker (California mule deer)

- Corridors and stopovers: "267 migration sequences collected from a sample size of 91 animals", GPS fixes every 1 to 24 hours. **Winter range has its own sample: 190 winter sequences from 94 animals** (GPT; confirmed in the metadata). Years 2017 to 2024. Place keyword: Bridgeport, California.

| Layer | `.shp` bytes | Features | Classes (`Contour`) | Rings | Outer / holes | Points | Area km² |
|---|---|---|---|---|---|---|---|
| Corridors | 2,131,084 | 3 | Low · Medium · High | 14 · 6 · 3 | 1/13 · 4/2 · 2/1 | 133,171 | 1,431 · 280 · 159 |
| Stopovers | 788,000 | 1 | 10 | 102 | 100/2 | 49,215 | 133 |
| Winter range | 610,700 | 1 | 50 | 25 | 21/4 | 38,153 | 293 |

- Every ring is closed. Outer rings run clockwise and holes anticlockwise, as the shapefile format expects. All three layers have multipart features with holes.
- Bounds (metadata): 119.89°W to 118.82°W, 37.96°N to 38.61°N for the corridors.

## 5. Sheldon-Hart Mountain (Oregon and Nevada pronghorn)

- Corridors and stopovers: "236 migration sequences collected from a sample size of 75 animals", GPS fixes every 2 to 17 hours. Winter range: 272 winter sequences from 80 animals. Years 2011 to 2023. Place keywords include Sheldon National Wildlife Refuge.

| Layer | `.shp` bytes | Features | Classes (`Contour`) | Rings | Points | Area km² |
|---|---|---|---|---|---|---|
| Corridors | 43,517,900 | 5 | 1 individual · Low · Medium · High · Very high | 264 · 198 · 198 · 108 · 37 | 2,719,645 | 6,429 · 3,377 · 1,579 · 487 · 40 |
| Stopovers | 9,148,212 | 1 | 10 | 507 | 571,627 | 711 |
| Winter range | 12,105,972 | 1 | 50 | 411 | 756,511 | 2,751 |

- Every ring is closed; holes and multipart features throughout (the "1 individual" feature alone has 258 holes).
- **The "1 individual" class** is the footprint used by at least one tracked animal. It is the widest class. See §5a for the definitions and the corrected proposal.
- Bounds (metadata): 120.34°W to 118.35°W, 40.93°N to 43.60°N for the corridors.

## 5a. Corridor class definitions (read from each layer's metadata, 14:18 UTC; rev 1.1)

The class names are not a common scale. The definitions, as each layer's metadata gives them:

| Class name | East Walker | Sheldon-Hart Mountain |
|---|---|---|
| 1 individual | (no such class) | footprint used by at least one individual |
| Low | **footprint used by at least one individual** | at least two individuals, up to 5% of the population |
| Medium | 10–20% of the sampled population | 5–10% of the sampled population |
| High | greater than 20% of the sampled population | 10–20% |
| Very high | (no such class) | greater than 20% |

- **East Walker "Low" is defined the same way as Sheldon-Hart "1 individual".** Thresholds are not carried from one herd to the other, and the two "Low" classes are not equivalent.
- "Used by at least one" is a union of individual footprints (each the 99% isopleth of that animal's averaged surface). It does not mean each place was used by exactly one animal.
- **Corrected proposal, one rule for any herd: the footprint defined as "used by at least one individual" is not shown.** For East Walker that leaves Medium and High. Omitting it is a conservative display choice, not a licence restriction, and it does not show that the remaining classes, the stopovers or the winter range are free of sensitivity; those need their own judgement at the build proposal.
- The legend and methods state the source's sampled-animal definitions for the chosen herd, not a generic low-to-high scale.
- **Still to read before class wording is fixed (GPT): the East Walker section of the report.** The report is a PDF; Claude opens no PDFs. For GPT, or for Claude if a web-text version exists.

## 6. Trial simplification (an audit measurement, not page work)

Douglas-Peucker on each ring, in the layer's own projected coordinates, tolerance in metres. Rings left with fewer than four points are dropped and counted. Classes kept separate. **Topology was not validated afterwards** (rings could touch or cross after simplification; a build must check). No reprojection, so **no output file was produced and no bytes were measured**: the last column is an estimate at 20 bytes a point, stated as an estimate.

| Herd and layer | Points, full | At 50 m | Rings dropped | At 200 m | Rings dropped | Estimated bytes at 50 m |
|---|---|---|---|---|---|---|
| East Walker corridors | 133,171 | 1,276 | 0 | 480 | 5 | 25,520 |
| East Walker stopovers | 49,215 | 1,079 | 1 | 359 | 51 | 21,580 |
| East Walker winter range | 38,153 | 593 | 1 | 232 | 9 | 11,860 |
| Sheldon-Hart corridors (all five classes) | 2,719,645 | 16,892 | 1 | 7,426 | 228 | 337,840 |
| Sheldon-Hart stopovers | 571,627 | 6,405 | 0 | 2,457 | 187 | 128,100 |
| Sheldon-Hart winter range | 756,511 | 7,647 | 0 | 3,009 | 138 | 152,940 |

- The original outlines follow a fine raster, which is why a 50 m tolerance removes about 99% of the points.
- **Corrected (GPT): 50 m greatly reduces vertex count, but some rings collapse; spatial and topological preservation has not been established.** Rev 1 said "50 m keeps the features", which its own table contradicts (rings are dropped at 50 m). A feature keeping its attribute row does not mean every patch or hole survives.
- At 200 m many small stopover patches vanish (51 of 102 for East Walker).
- **GPT's independent trial (GPT's figures, an ordinary segment-distance Douglas-Peucker, not a reproduction of Claude's removed script):** at 50 m, 1,268 / 1,071 / 591 points for East Walker corridors / stopovers / winter range, with one outer ring collapsing in each of stopovers and winter range, each about 5,980 m². Claude's counts were 1,276 / 1,079 / 593; the two implementations differ slightly.
- **Before a build fixes a tolerance (GPT):** state the algorithm and the dropped-component policy; keep holes with their parent polygons; validate self-intersections, hole containment and the relationships among class layers; show original against derived; report component and area changes as well as vertex counts. Simplifying rings independently can change topology even when no ring disappears.
- The 20-bytes-a-point column is an assumption, not a measured payload and not a cost estimate.
- East Walker, all three layers at 50 m: about 2,950 points. Sheldon-Hart, all three: about 30,900.

## 7. Interpretation, for the card

- "Migration corridor: areas used during migration by stated shares of the collared animals sampled, over [years]", with the source's definition of each class shown (§5a).
- "High-use stopover areas derived from the population-level movement model" (GPT's wording), with the source's precise definition in the methods note. Not "10% of the corridor".
- "Winter range: the core area used in winter (the 50% isopleth of winter use)", **with the winter layer's own sample**, not the migration sample.
- With the counts the metadata gives (sequences, animals, fix interval), the method named as the source names it, the release date, and "a published summary of many animals, not the path of any one, and not where animals are now".
- Considerations, not conclusions: these are hunted species, and stopovers and winter ranges show where animals concentrate. The layers are published by state wildlife agencies and the USGS for conservation planning. No finding is made that display is risk-free.

## 8. Not done, not claimed

- The report PDF, the route layers and the other nine herds: not opened.
- No reprojection, no output file, no measured display size, no topology check after simplification.
- The "retain ownership" wording: **GPT judged it a disclosure point, not a permission blocker** (GPT's reading of the release description and the CC0 deed). The card keeps the source and version, the exact metadata wording, credit to USGS and the originators, and says the simplified geometry is our processing. Credit is the project's requirement and good practice, not a condition invented for CC0; no endorsement is implied. No USGS enquiry is needed for this.
- The East Walker section of the report: unread (PDF).
- No refresh cadence for any herd.
- No polygon drawing work, no build.
