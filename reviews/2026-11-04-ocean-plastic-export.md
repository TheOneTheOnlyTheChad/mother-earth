# Ocean plastic — first export inspection (4 Nov 2026, thread 12)

Read-only. Nothing built, stored, scheduled or deployed. All queries made from the browser pane (github.io origin) between ~09:35 and ~10:15 UTC, 4 Nov 2026.

## 1. Which service — GPT's service is not the current one
NOAA GeoPlatform (ArcGIS org `C8EMgrsFcRFL6LrL`, item metadata "NOAA National Centers for Environmental Information (NCEI)") publishes several microplastics services. Measured 4 Nov:

| Service | Rows | Sample dates | Data last edited | Page size |
|---|---|---|---|---|
| `Marine_Microplastics_WGS84` (GPT's find) | 22,530 (ocean water 15,534 · beach 671 · Nurdle Patrol 5,817 · sediment 508) | 1972-04-20 → **2022-11-30** (ocean water) | 2026-06-09 | 2,000 |
| `Hub_Microplastics_Replace` — item title "Global Marine Microplastics Observations" | **29,076** | 1972-04-20 → 2026-04-28 **(all media; 2026-04-28 is Nurdle Patrol — ocean water ends 2024-10-23, see §7)** | **2026-10-15** | — |
| `Ocean_Surface_Microplastics_(PS)` — professional science | 14,580 | 1972-04-20 → 2024-10-23 | 2026-10-15 | **1,000** |
| `Ocean_Surface_Microplastics_(CS)` — citizen science | 1,603 | 2013-07-01 → 2021-05-23 | 2026-10-15 | — |
| `Ocean_Subsurface_Microplastics_(PS)` | 805 | 2013-01-06 → 2019-10-21 | 2026-10-15 | — |

- The portal's app item "Microplastics Hub Web App CURRENT" was modified 2 Oct 2026; the hub web map 15 Oct 2026. The end date 2026-04-28 equals the temporal end in the data.gov record for the **Harmonized Database, NCEI Accession 0306475** (issued 22 Jul 2025, quarterly updates). That is evidence, not proof, that `Hub_Microplastics_Replace` + the split layers are the current harmonized product. Which layers the CURRENT app actually reads was not opened.
- **Recommendation (portal link verified in §7):** use the current split layer `Ocean_Surface_Microplastics_(PS)` (and `Hub_Microplastics_Replace` for discovery), not `Marine_Microplastics_WGS84`. The current layers carry **`UniqueID`** = NCEI accession + sequence (e.g. `0211007-0000201`) and **`Study_Type`**; the older service has only OBJECTID/GlobalID.

## 2. The export inspected — one study, one method
**Filter:** `NCEI_Accession_No = 211007` on `Ocean_Surface_Microplastics_(PS)` (also pulled from the older service for comparison).
**Study:** Law et al. 2010, *Science* 329:1185 — Sea Education Association, SSV Corwith Cramer, western North Atlantic and Caribbean. NCEI archive title: "Plastic collected from SSV Corwith Cramer in North Atlantic Subtropical Gyre from 1986-10-15 to 2008-12-20 (NCEI Accession 0211007)".

| | measured |
|---|---|
| Rows | **6,135 expected (count query) = 6,135 retrieved**, 7 pages of 1,000; `exceededTransferLimit` true on pages 1–6, false on 7 |
| Size | 8.09 MB as ArcGIS JSON (`outFields=*`, no geometry) — most of it repeated reference text |
| Identity | 6,135 unique `UniqueID` |
| Sample dates | **1986-10-15 → 2008-12-20**; by year 20 (1986) … peak 517 (1992) … 157 (2008); **no 1988 rows**. Newest sample is ~18 years old |
| Time of day | none in the source. Dates are stored as US local midnight (05:00/06:00 UTC) — an encoding artefact; read as a date only |
| Area | 10.32–47.58 °N, 86.72–51.32 °W — **identical to the bounding box in NCEI's archive metadata for 0211007** |
| Coordinates | 2 decimals (~1 km) |
| Medium / depth | all `Ocean water`, `Water_Sample_Depth__m_` = 0 |
| Method / mesh | all `Neuston net`, 0.335 mm |
| Unit | all `pieces/m3` (harmonized — see §3) |
| Concentration | 2,323 zeros (genuine reported zeros; no negatives, no blanks); median 0.00432; P90 0.0583; P99 0.327; max 2.309 pieces/m³ |
| Classes | Very Low 2,323 (= the zeros) · Low 1,053 · Medium 2,748 · High 11. **Database-relative**: per the database paper, class ranges come from the database's own statistics and shift as records are added — not hazard levels |
| Blank fields | Country, State, beach/sediment/nurdle fields, bottom depth, collecting time: blank on all rows; Location_Regions blank on 4,307 |
| Repeats | 1,120 coordinate pairs occur more than once: 1,050 of them on the same date (several tows at one station at 2-dp resolution), 70 on different dates. **306 same-place same-date groups also share the same value** — could be genuine repeat tows or duplicates; not established |
| Stability | all 6,135 (lat, lon, date, value) tuples are identical between the June-2026 service and the October-2026 layer |

**Representative records** (current layer values identical):

| UniqueID / OBJECTID | date | lat, lon | value pieces/m³ | class |
|---|---|---|---|---|
| OID 1 | 1989-07-13 | 45.28, −60.29 | 0 | Very Low |
| OID 530 | 1992-12-17 | 11.30, −66.55 (Caribbean) | 0.00432 | Low |
| OID 934 | 1995-05-20 | 30.55, −67.18 | 0.32716 | Medium |
| OID 3857 | 1997-05-23 | 24.58, −74.03 | 2.308856 (max) | High |
| OID 6135 | 2008-12-20 | 24.01, −82.20 | 0.007132 | Medium |
| `0211007-0000201` | 1991-10-17 | 35.88, −58.98 | 0.073436 | Medium |

## 3. Units — the number shown is NOAA's conversion, not the study's
- Data.gov record for 0306475: water and beach in pieces/m³, sediment pieces/kg dry weight, Nurdle Patrol pieces per 10 min.
- Database paper (Nyadjro et al. 2023, *Sci Data*): area-based values (pieces/km²) were converted to pieces/m³ using information from each study, such as instrument dimensions; where owners reported both, NCEI did not convert; net volumes can be misestimated when waves keep a net from being fully submerged. **The paper does not say what depth was used for Law 2010.**
- NCEI's archive metadata for 0211007 gives no units, no instrument dimensions, no use constraints; the files were not listed. **Original units and the conversion for this study: not established.** The smallest non-zero value (0.00432) recurs and is likely one counted piece divided by the assumed tow volume — inference, not checked.

## 4. Reuse
- Product page: "All data in the NCEI Marine Microplastics database is free to access and use." Reviewing archive metadata is advised. Recommended data citation: Nyadjro et al. (2018), *The NOAA NCEI Global Marine Microplastics Data Collection (1972-present)*, accession NCEI-Marine-Microplastics, [subset], accessed [date]; paper: Nyadjro et al. (2023) doi:10.1038/s41597-023-02632-y.
- Data.gov record for the Harmonized Database (0306475): licence field = CC0 1.0. The same record lists rights "otherRestrictions" with no text and access level "non-public" while publishing public download links — inconsistent metadata, recorded as found.
- Database paper: NCEI applies CC0 to the compiled database; it does not assign licences to original data — the owner's licence travels in each dataset's metadata (CC0 and/or CC BY 4.0 or equivalent), with users asked to cite the original source.
- 0211007 archive metadata: use and access constraints **blank**. Its own citation: Lavender Law, K., Morét-Ferguson, S., Maximenko, N., Proskurowski, G., Peacock, E., Hafner, J., Reddy, C. (2020). Plastic collected from SSV Corwith Cramer in North Atlantic Subtropical Gyre from 1986-10-15 to 2008-12-20 (NCEI Accession 0211007). NOAA NCEI. https://www.ncei.noaa.gov/archive/accession/0211007.
- ArcGIS item licence text: a distribution-liability disclaimer only (no warranty).
- **Standing for REGISTER:** compiled product CC0 (NCEI), per-study owner licence not stated for 0211007 → commercial use: "yes for NCEI's compiled product (CC0); original study licence not stated — cite NCEI + Law et al." Do not label the Law values CC BY or CC0 on our own authority.
- Not read: the full database paper (nature.com and PMC were not reachable from this session; read via a fetch summary of nature.com), the 0211007 accession files themselves (ncei.noaa.gov needs a pane approval).

## 5. What this export honestly supports
- **Dated measured samples**, not current plastic: 1986–2008, one ship programme, one gear, one mesh, western North Atlantic + Caribbean only. Silence outside that box is unsampled water, not clean water.
- Showable as optional points: value with unit **as converted by NOAA**, the study's own date, method, mesh, depth 0, reference + DOI, NCEI accession, and that the class label is database-relative.
- Not supported: interpolated colouring, averages, trends across studies, "now" positions, any link to drifting buoys.
- Mixing studies is not justified yet: even within surface water, the ocean-water set contains 0.335 mm nets beside 0.00045 mm grab samples (1,389 Adventure Scientist rows) — different detection ranges under the same unit.

## 6. Open, in order
1. Original units + conversion for 0211007 — needs the accession files (ncei.noaa.gov approval in the pane, or Chad opens it).
2. Confirm which layers the "CURRENT" portal app reads.
3. Product decision (Chad): dated samples in the Now globe (own toggle, off on load) vs a separate reference view.
4. If built: the hub would store one validated copy of the chosen subset (~8 MB raw JSON → far smaller trimmed), refreshed rarely (quarterly source updates); size and cadence to be measured first.

Sources: ncei.noaa.gov/products/microplastics · catalog.data.gov (Harmonized Database, NCEI Accession 0306475) · nature.com/articles/s41597-023-02632-y · ncei.noaa.gov geoportal metadata gov.noaa.nodc:0211007 · services2.arcgis.com/C8EMgrsFcRFL6LrL (REST, read 4 Nov 2026) · arcgis.com sharing search (orgid C8EMgrsFcRFL6LrL).

## 7. Corrections and additions after GPT's review (4 Nov, ~10:40 UTC)
1. **Dataset dates, by setting** (`Hub_Microplastics_Replace`, grouped by Medium): ocean water 16,988 rows, 1972-04-20 → **2024-10-23** · Nurdle Patrol 10,615, 2018-11-07 → **2026-04-28** · beach 893, 2015-06-04 → 2023-02-12 · ocean sediment 580, 2017-03-21 → 2022-07-11. **The newest surface-water observation is 23 Oct 2024**, not April 2026. Newest professional surface-water studies (rows dated 2022+): Oceaneye 0276422 (340, to 2024-10-23), Russell & Webster 2021 (52, to 2022-11-30), Kalangutkar et al. (bucket samples, to 2023-12-08), Arteaga et al. 2024 (bongo, 2022-07-11).
2. **Portal link verified.** Item `fb22ec5ed745408c8b0278829842b12d` "Microplastics Hub Web App CURRENT" (https://experience.arcgis.com/experience/fb22ec5ed745408c8b0278829842b12d, modified 2026-10-02) references two web maps:
   - `b22fab7929ac4504b6ed7bcf7fb14be6` "Microplastics Hub Map" (modified 2026-10-15) — layers: Ocean Surface (CS), Nurdle Patrol (CS), **Ocean Surface (PS)** `…/Ocean_Surface_Microplastics_(PS)/FeatureServer/0`, Ocean Subsurface (PS), Ocean Sediment (PS), Beach (PS), and "Entire Microplastics Collection" `…/Hub_Microplastics_Replace/FeatureServer/0`.
   - `e9e277106c1b40808911a5cf9af49a7d` "Clustering Microplastics" (modified 2025-05-23) — single layer `…/Marine_Microplastics_WGS84/FeatureServer/0` (GPT's service; older content, see §1).
   Read from the items' `/data` JSON (arcgis.com sharing API). So the current app does read the split layers; the older service is still referenced by a clustering map last changed May 2025. "Authoritative" stays NCEI's archive; the layers are NCEI's published view of it.
3. **6,135 vs 6,136.** The service count = retrieved count establishes **retrieval completeness for that selection only**. GPT reports Law et al. 2010 describes 6,136 tows; the layer holds 6,135. One-record discrepancy recorded; cause not investigated (needs the 0211007 archive files). No row assumed missing or corrupt.
4. **Units.** GPT read Law et al. 2010: concentrations published in **pieces/km²** (recorded on GPT's reading; Claude has not read the paper). The conversion to NOAA's pieces/m³ remains **unestablished**; `Water_Sample_Depth__m_ = 0` is the sampling position, **not** the effective sampled thickness a conversion would need — no depth will be back-calculated from the values. **Size range:** the paper discusses pieces larger than 5 mm; whether NOAA's values count only < 5 mm is not established, so these values are not labelled "microplastics < 5 mm" until checked.
5. **Reuse, precisely.** NCEI applies CC0 to its **compiled database product**; that supports using the compiled values under CC0. It does **not** license the original paper, its figures, or the raw archive files. The 0211007 archive licence is **unstated** and stays recorded as unstated. Citation is courtesy and provenance, not a substitute for permission where permission is needed.
6. **Movement.** Law et al. used historical drifter statistics and a transport model to study accumulation pathways — a research lead for Chad's movement goal, filed separately. It does not justify moving these sample points along today's buoy tracks.

### Oceaneye (NCEI 0276422) — profiled from `Ocean_Surface_Microplastics_(PS)`
- **1,145 rows** (unique UniqueID), **2011-08-31 → 2024-10-23** — the archive abstract's "802 samples ending in 2021" (GPT) is outdated relative to the layer. By year: 15 (2011) … 142 (2018) … 135 (2022), 112 (2023), 93 (2024).
- All Manta net, mesh 0.33 mm, depth 0, pieces/m³ (same NOAA conversion question as Law), Study_Type "Professional Science".
- Global: Atlantic 896 (Mediterranean 434), Pacific 141, Arctic 71, Indian 37; 55.8 °S → 79.0 °N.
- 75 zeros, 0 nulls; median 0.116, P90 0.91, max 51.8 pieces/m³.
- References: "Unpublished" 1,107, Faure et al. 2015 38.
- Next: inspect its archive (original units, size classes, licence, the 802 vs 1,145 versions) — needs ncei.noaa.gov approval in the pane.

## 8. Oceaneye archive inspection (4 Nov, ~11:00 UTC)
Read: NCEI accession page 0276422 and its OAS details record (via fetch; the archive page itself timed out in the pane during NCEI's cloud migration), SEANOE dataset 10.17882/86630 (Oceaneye's own publication). Files were not downloaded.

**802 vs 1,145 — explained by the IDs.** The archived version (NCEI title: "…collected by the Oceaneye Association from 2011-08-31 to 2021-10-05"; abstract: 802 sampling efforts; received 2023-01-06, OAS edit 2023-01-26, metadata v10, page last modified 2023-07-09, no revision notes) matches the portal exactly: UniqueIDs `0276422-0000001…0000802` are the 802 rows dated ≤ 2021-10-05. UniqueIDs `…0000803…0001145` are **343 rows, 2021-12-12 → 2024-10-23**, all "Unpublished", added later under the same accession. **No archive metadata reachable here describes those 343 rows** (version, method notes, licence). GPT saw a revised title to 2024-09-01 elsewhere; not seen in these two records. 673 portal rows fall within SEANOE's 2011-08-31 → 2020-11-26.

**Units.** NCEI lists the archived parameter in **pieces/m³** as submitted. SEANOE documents a manta net 0.6 m × 0.15 m, mesh 0.33 mm, with a **Hydrobios flowmeter** — i.e. a measured filtered volume, so per-m³ values plausibly come from Oceaneye, not from an NCEI area→volume conversion. Stated as plausible, not established: SEANOE's page gives no units and the files were not opened.

**Size range.** NCEI: plastics "less than 5 mm". SEANOE: "micro- and mesolitter" with 0.33 mm as the lower limit, upper bound not stated. Whether the NCEI values are the < 5 mm fraction only of a micro+meso count is not established.

**Method / quality.** Manta net, trained volunteer groups and citizen scientists (NCEI abstract). The portal layer labels every row Study_Type "Professional Science" — **inconsistent with NCEI's own abstract**; recorded, not resolved. SEANOE marks its file "quality controlled data" with data-quality estimates; no flags in the portal layer.

**Reuse, per material:**
| Material | Terms found |
|---|---|
| NCEI compiled database values (what the portal serves) | CC0 (database paper: NCEI applies CC0 to the compiled product) |
| NCEI archive 0276422 | use/access constraints **blank — unstated** |
| SEANOE 10.17882/86630 (2011–2020 original) | **CC BY 4.0**; citation: Hagmann, P., Potter, G. (2022). Oceaneye's microlitter data 2011-2020. SEANOE. https://doi.org/10.17882/86630. Oceaneye asks to be co-author on *articles* based on unpublished data |
| 343 post-2021 rows | no licence text found anywhere |
Safest consistent practice if we publish NCEI-harmonized values: CC0 basis, cite NCEI (collection + paper), the NCEI accession citation (Faure, Saini, Potter, Galgani, de Alencastro, Hagmann 2023, NCEI Accession 0276422) and SEANOE; label post-2021 rows as NCEI-held additions without documented licence. Commercial use: yes for the compiled CC0 product; source-level terms recorded, not assumed.

**Still open:** opening the archive spreadsheet / SEANOE ODV file (a download — Chad's yes first) to confirm units, size classes and per-sample quality; documentation for the 343 later rows (possibly a question to NCEI or Oceaneye — Chad's call, not required to proceed).

## 9. Oceaneye raw file — NOAA's pieces/m³ reproduced (4 Nov, ~11:30 UTC; download approved by Chad)
File: SEANOE 10.17882/86630, `94022.zip` (96,249 B), 30 SeaDataNet ODV text files (one per vessel × region), generated 2022-05-06. Unzipped in the browser pane; nothing stored. Header: volunteers on sailing expeditions collected, Oceaneye staff analysed all samples; manta net, mesh 330 µm; method document: oceaneye.ch/wp-content/uploads/methodology_data_oceaneye_final.pdf (not read).
- **760 samples**: 659 sea + 101 lakes/rivers (`*_Lakes`, `*_Rivers` — not ocean; NOAA's ocean layer correctly omits them). Fields per sample: start and end time/position, **tow distance (km)**, **net opening 60 cm**, **observation depth 0–0.15 m**, count per size class, dry weight (g), Beaufort, wind speed, protocol, SeaDataNet quality flag (QV) on every value.
- **Size classes (NERC vocabulary H03, read 4 Nov):** H0300008 "1 to 5 millimetres" (deprecated 20 Mar 2026 → H0300021), H0300009 "5 to 25 millimetres", H0300010 "300 micrometres to 5 millimetres", H0300011 "100 to 500 micrometres" (one sample, TMF_2019_10). Each sea sample has exactly one micro class: **497 coded 1–5 mm, 162 coded 0.3–5 mm**, never both; 658 also carry a 5–25 mm count.
- **Conversion reproduced:** 648 of 659 sea samples match one portal row (same date, position within 0.01°); for **645 of 648**, NOAA's value = (count in class 08 or 10) ÷ (tow distance × 0.60 m × 0.15 m), within 0.5 %. So NOAA's pieces/m³ is a **volume derived from tow length × net mouth area**, counting **< 5 mm only (5–25 mm excluded)**. Three matched samples and eleven unmatched ones not yet explained.
- **Distance method (protocol field, value rows):** flowmeter 1,044 · GPS 450 (128 + 322) · blank 32. GPS distance is over ground, not water through the net — a known source of volume error. Per-sample method can be carried.
- **Quality flags:** QV 0 (no QC performed, SeaDataNet L20) on 24,382 values; QV 9 (missing value) on 34, all in the protocol field. No value flagged good or bad — "quality controlled" on SEANOE's file table is not reflected per value.
- **Comparability inside Oceaneye:** two size-class labels (1–5 mm vs 0.3–5 mm) under one 0.33 mm mesh. Whether that is a coding choice or a real 1 mm lower bound for 497 samples is not established (needs the methodology PDF). Until then the honest label is "pieces < 5 mm retained by a 0.33 mm net; lower size bound recorded as 1 mm or 0.3 mm per sample".
- **For the post-2021 343 rows:** not in this file; same conversion cannot be checked.

## 10. Corrections after GPT's second review (4 Nov, ~12:00 UTC)
1. **NCEI archive version.** GPT reports the accession page now lists **v2.2, published 4 Dec 2025**, with a revision entry and methods: net opening 0.6 × 0.15 m, GPS distance before 2015 and flowmeter after, sieving at 5 mm / 1 mm / 300 µm. **Not verified by Claude:** at ~12:00 UTC the landing page and download returned **503**, the geoportal item 404 (NCEI cloud migration). §8's "no documentation for the 343 later rows" is withdrawn as a conclusion and becomes: *documentation not reached; GPT reports v2.2 describes general methods.* General methods still do not establish each row's protocol. Re-check when NCEI answers.
2. **Conversion — bounded.** Join SEANOE → portal (same date, position within 0.01°): 648 of 659 sea samples matched; 645 reproduce within 0.5 % as (count in class 08 or 10) ÷ (tow distance [km] × 1,000 m/km × 0.60 m × 0.15 m). This covers **645 rows, not the 802 archived and not the 1,145 published**. Matching arithmetic does not establish who performed the calculation; the value is described as **"published by NOAA NCEI"**. The three disagreements, kept as they are:
   - `0276422-0000300` (BON_26, 2017-04-09): published 0.049438 = **exactly half** of 24 ÷ (2,697 m × 0.09 m²) = 0.098875.
   - `0276422-0000274` (MAU_14, 2017-08-13): published 0.058471 = **exactly half** of 14 ÷ (1,330.2 m × 0.09 m²) = 0.116941.
   - `0276422-0000560` (TMF_2019_11, 2019-08-01): SEANOE tow distance **0 km**, 4 pieces; published 0.022234 (implies ~2.0 km). Not reconstructable from this file.
   Cause of the halves not established (a second tow, a different distance or a different area are all possible).
3. **The eleven "unmatched" are date disagreements.** Each has an identical position and identical concentration in both sources but a **different date**:
   | SEANOE ID | SEANOE date | NOAA date | NOAA UniqueID |
   |---|---|---|---|
   | OE_108 | 2013-04-06 | 2014-04-06 | 0276422-0000099 |
   | OE_109 | 2013-04-06 | 2014-04-06 | 0276422-0000100 |
   | OE_78 | 2013-09-19 | 2013-09-18 | 0276422-0000070 |
   | OE_146 | 2014-08-14 | 2014-08-04 | 0276422-0000137 |
   | PAC_195 | 2019-03-22 | 2019-04-22 | 0276422-0000496 |
   | PAC_196 | 2019-03-24 | 2019-04-24 | 0276422-0000497 |
   | MAU_39 | 2019-08-18 | 2018-08-18 | 0276422-0000511 |
   | PAC_50 | 2016-05-15 | 2016-04-15 | 0276422-0000194 |
   | PAC_51 | 2016-05-16 | 2016-04-16 | 0276422-0000195 |
   | PAC_107 | 2017-09-21 | 2017-09-20 | 0276422-0000376 |
   | SE_8 | 2018-05-17 | 2018-07-17 | 0276422-0000347 |
   Which source is right is not established (OE_78 differs by one day — possibly a time-zone or end-time effect; the others by a month or a year look like transcription). For a layer whose point is the date, these 11 get a visible note.
4. **QC wording.** SEANOE files encode QV 0 on 24,382 values and QV 9 (missing value) on 34 (protocol field). In the SeaDataNet scheme 0 means no quality control was recorded **in that flag**; it does not establish that no laboratory or other checks took place. SEANOE's page describes the file as quality-controlled data; Oceaneye states its staff analysed all samples.
5. **Coverage wording.** A missing marker means only that this selection shows no sample there; a tow covers a route and the marker is its start.
