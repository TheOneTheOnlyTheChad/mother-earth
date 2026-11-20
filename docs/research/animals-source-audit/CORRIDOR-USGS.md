# Animals: audit C, migration corridor (USGS volume 6)

20 Nov 2026 · rev 1 · for GPT · read-only research under brief C (`docs/concepts/ANIMALS-EXPANSION-AUDIT-BRIEFS.md` rev 1.1), on Chad's go of 20 Nov. Nothing built, nothing sent, no account. Claude retained no raw working copies; the archive Chad downloaded remains in his Downloads.

**Results**
- **California mule deer, East Walker: usable.** Three released polygon layers, complete metadata, small geometry.
- **Oregon and Nevada pronghorn, Sheldon-Hart Mountain: usable, with two conditions.** Its geometry is about twenty times larger, and its corridor layer has a class named "1 individual" that should not be shown.
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
- **Stopovers:** "the highest 10 percent of use" of the mean population-level surface.
- **Winter range:** the core range by the 50% isopleth of winter use.
- **Status and updating:** progress "Complete"; maintenance "As needed". Nothing says a herd's polygons are refreshed on a schedule. **Shown as a fixed, dated product.**
- **Constraints.** Access: "None." Use: "Dataset authors will retain ownership of the data provided", fitness for use is the user's burden, and for publication or dissemination "citations, or credit should be given to the authors/originators listed herein".
  - This sits beside the CC0 mark on the record. The card credits the originators and the USGS release in any case. Whether "retain ownership" narrows the CC0 dedication is not for Claude to decide; it is recorded for the release review.
- **Sensitivity:** the metadata of the layers audited contains no sensitivity statement and no mention of withheld data for these herds.
- **Coordinate system (all layers):** `NAD_1983_NSRS2007_Contiguous_USA_Albers`, a projected system in metres on GRS 1980. Axis order x (easting), y (northing). The metadata also gives each layer's bounds in degrees. A display needs a stated reprojection to longitude and latitude; none was done here.

## 4. East Walker (California mule deer)

- Corridors: "267 migration sequences collected from a sample size of 91 animals", GPS fixes every 1 to 24 hours. Years 2017 to 2024. Place keyword: Bridgeport, California.

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
- **The "1 individual" class** is the footprint used by at least one tracked animal. It is the widest class and the closest to individual animals' paths. Proposed: not shown; only the population classes (Low and above).
- Bounds (metadata): 120.34°W to 118.35°W, 40.93°N to 43.60°N for the corridors.

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
- At 200 m many small stopover patches vanish (51 of 102 for East Walker). **50 m keeps the features; 200 m changes what is shown.** The tolerance is a design decision for the build proposal, with the dropped features stated.
- East Walker, all three layers at 50 m: about 2,950 points. Sheldon-Hart, all three: about 30,900.

## 7. Interpretation, for the card

- "Migration corridor: the area the tracked animals' migrations used, in classes from low to high use, estimated from GPS-collared animals over [years]."
- "Stopover: the 10% of the corridor used most."
- "Winter range: the core area used in winter (50% of winter use)."
- With the counts the metadata gives (sequences, animals, fix interval), the method named as the source names it, the release date, and "a published summary of many animals, not the path of any one, and not where animals are now".
- Considerations, not conclusions: these are hunted species, and stopovers and winter ranges show where animals concentrate. The layers are published by state wildlife agencies and the USGS for conservation planning. No finding is made that display is risk-free.

## 8. Not done, not claimed

- The report PDF, the route layers and the other nine herds: not opened.
- No reprojection, no output file, no measured display size, no topology check after simplification.
- No judgement on the "retain ownership" wording against CC0.
- No refresh cadence for any herd.
- No polygon drawing work, no build.
