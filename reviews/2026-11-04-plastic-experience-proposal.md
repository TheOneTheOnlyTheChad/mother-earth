# Ocean plastic — dated-samples experience, proposal v2 (4 Nov 2026)

v2 = GPT's second review applied (rows B, uniform markers, wording, per-record provenance). Changes from v1 are in the text; evidence in the research note §10.

For Chad and GPT to react to. Nothing built. Evidence: `reviews/2026-11-04-ocean-plastic-export.md` (§8–9 Oceaneye).
Already decided (Chad, 3 Nov): plastic may be shown as **dated samples, stated honestly**, on the globe, **own toggle, off on load**.

## What a viewer gets
**One toggle** in the Optional layers group: **"Microplastic samples — dated"**. Off on load; zero requests until switched on (same pattern as drifters).

**On:** one uniform marker per sample, at the tow-start location. No cells, no shading between points, no averages, no trend line, no size scaling.
- One neutral colour for every marker (not the warning palette; no red). The value is read in the inspector, not from colour or size.
- **Hollow ring = the source reports zero for this tow** — zero pieces in the sampled size range with this method; it says nothing about larger plastic or other water.
- Legend line while on: `Microplastic samples · 2011–2024 · tow-start locations · dated observations`.

**Card (Optional layers):**
> **Microplastic samples — dated** · Observed
> 1,145 Oceaneye surface-water samples published by NOAA NCEI, 2011–2024; newest 23 Oct 2024. Markers show tow-start locations on their sampling dates — not plastic's current position. No sample shown here does not mean plastic-free water.
> Details → method, size range, where the number comes from.

**Inspector — every sample:**
| Row | Example |
|---|---|
| Sampled | 31 Aug 2011 (NOAA NCEI date) |
| Where | 42.75 °N, 4.13 °E (tow start) |
| Concentration | 0.50 pieces/m³ — published by NOAA NCEI |
| Size range | smaller than 5 mm, manta net 0.33 mm mesh |
| Method | manta net, surface |
| Source | Oceaneye Association via NOAA NCEI Marine Microplastics, Accession 0276422, ID 0276422-0000001 |
| Original record | one of the statuses below |

**"Original record" status, per sample** (raw-derived rows carry their own source and version: SEANOE 10.17882/86630, file 94022.zip, 2022-05-06):
| Status | Rows | Extra rows shown |
|---|---|---|
| Reproduced | 645 | pieces counted (e.g. 419); tow distance and how measured (GPS / flowmeter); size class as recorded (1–5 mm or 0.3–5 mm); "419 ÷ (9,223 m × 0.60 m × 0.15 m) = 0.505 pieces/m³ — matches the published value" |
| Does not reproduce | 3 | the counted pieces and distance as recorded, and "the published value differs (×0.5 / tow distance recorded as 0); cause not established" |
| Date differs between sources | 11 | "Oceaneye's original file dates this tow 6 Apr 2013; NOAA NCEI 6 Apr 2014. Which is correct is not established." |
| No original record in the inspected file | 486 = 472 dated after SEANOE's last sample (2020-11-26), incl. the 343 later rows, + 14 within 2011–2020 that have no SEANOE counterpart | "Original count/method detail not available in the inspected source file." |
A single formula is never shown for a sample it was not checked against.

**Behind "Method and full explanation":** NOAA's comparability warning; tow-start vs route; why no marker is not plastic-free water; GPS vs flowmeter; the two size-class labels under one mesh; quality flags reported as encoded (SeaDataNet QV 0 on the original values) separately from the documented processing (Oceaneye staff analysed all samples).
Not shown: NOAA's "Very Low…High" classes — database-relative; on a globe they would read as danger levels.

**Evidence labels:** `Observed` (dated sample). The concentration says *published by NOAA NCEI*; the reconstruction appears only where checked. `Projected` is never used here.

**Sources & Details:** a Plastic section — what it is and is not, the conversion, size range, coverage ("one programme's routes, mostly Atlantic and Mediterranean; not global coverage"), citations (NCEI collection + paper, NCEI accession 0276422, SEANOE CC BY 4.0), and `ME.KEPT` wording.

## Behind it (hub)
- One collector job, rare cadence (source updates quarterly): page the NOAA layer at 1,000 rows, require **retrieved = expected count**, unique IDs, valid dates/positions, units = pieces/m³; publish one trimmed snapshot (~1,145 rows, est. ~100 KB — to be measured); any failure keeps the last good file with its original times.
- The SEANOE join is a fixed, versioned table (UniqueID → status + original fields), built once from the inspected file and committed with its source hash; re-built only if SEANOE publishes a new version. Not fetched by the hub on a schedule.
- Register row before go-live: CC0 for NOAA's compiled values; SEANOE CC BY 4.0; archive licence unstated; commercial use: yes for the CC0 compiled product.
- Tests in the usual pattern (off ≠ withheld; zero ≠ missing; no requests while off; count check fails closed) plus a release candidate shown to you before any merge.

## Out of scope for v1
Law 2010 (kept as a reference candidate) · other studies or mixing gears · lakes and rivers · any drift / movement · search over samples · NOAA concentration classes.

## Your calls
1. **Rows:** GPT recommends **B (all 1,145)** with per-record provenance as above; Claude agrees. Your call.
2. **Markers:** uniform (GPT and Claude agree).
3. **Wording:** GPT's card and legend lines are in above — keep, change or cut.
4. **Go to build** a release candidate on a branch (nothing public until you see it).

Pending, not blocking: verify NCEI v2.2 (site returning 503 today).
