# Ocean plastic — first export inspection (4 Nov 2026, thread 12)

Read-only. Nothing built, stored, scheduled or deployed. All queries made from the browser pane (github.io origin) between ~09:35 and ~10:15 UTC, 4 Nov 2026.

## 1. Which service — GPT's service is not the current one
NOAA GeoPlatform (ArcGIS org `C8EMgrsFcRFL6LrL`, item metadata "NOAA National Centers for Environmental Information (NCEI)") publishes several microplastics services. Measured 4 Nov:

| Service | Rows | Sample dates | Data last edited | Page size |
|---|---|---|---|---|
| `Marine_Microplastics_WGS84` (GPT's find) | 22,530 (ocean water 15,534 · beach 671 · Nurdle Patrol 5,817 · sediment 508) | 1972-04-20 → **2022-11-30** (ocean water) | 2026-06-09 | 2,000 |
| `Hub_Microplastics_Replace` — item title "Global Marine Microplastics Observations" | **29,076** | 1972-04-20 → **2026-04-28** | **2026-10-15** | — |
| `Ocean_Surface_Microplastics_(PS)` — professional science | 14,580 | 1972-04-20 → 2024-10-23 | 2026-10-15 | **1,000** |
| `Ocean_Surface_Microplastics_(CS)` — citizen science | 1,603 | 2013-07-01 → 2021-05-23 | 2026-10-15 | — |
| `Ocean_Subsurface_Microplastics_(PS)` | 805 | 2013-01-06 → 2019-10-21 | 2026-10-15 | — |

- The portal's app item "Microplastics Hub Web App CURRENT" was modified 2 Oct 2026; the hub web map 15 Oct 2026. The end date 2026-04-28 equals the temporal end in the data.gov record for the **Harmonized Database, NCEI Accession 0306475** (issued 22 Jul 2025, quarterly updates). That is evidence, not proof, that `Hub_Microplastics_Replace` + the split layers are the current harmonized product. Which layers the CURRENT app actually reads was not opened.
- **Recommendation:** use the current split layer `Ocean_Surface_Microplastics_(PS)` (and `Hub_Microplastics_Replace` for discovery), not `Marine_Microplastics_WGS84`. The current layers carry **`UniqueID`** = NCEI accession + sequence (e.g. `0211007-0000201`) and **`Study_Type`**; the older service has only OBJECTID/GlobalID.

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
