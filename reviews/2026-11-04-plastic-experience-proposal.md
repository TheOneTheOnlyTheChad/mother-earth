# Ocean plastic — dated-samples experience, proposal v1 (4 Nov 2026)

For Chad and GPT to react to. Nothing built. Evidence: `reviews/2026-11-04-ocean-plastic-export.md` (§8–9 Oceaneye).
Already decided (Chad, 3 Nov): plastic may be shown as **dated samples, stated honestly**, on the globe, **own toggle, off on load**.

## What a viewer gets
**One toggle** in the Optional layers group: **"Microplastic samples — dated"**. Off on load; zero requests until switched on (same pattern as drifters).

**On:** one point per net tow, at the tow's start position. No cells, no shading between points, no averages, no trend line.
- One neutral colour for every point (not the warning palette; no red). Value is read in the inspector, not from colour.
- A **genuine reported zero** draws as a hollow ring — "sampled, none counted" — distinct from no point ("not sampled").
- Legend line while on: `Microplastic samples · dated 2011–2024 · not current positions`.

**Card (Optional layers):**
> **Microplastic samples — dated** · Observed
> 1,145 surface net tows by Oceaneye volunteers, 2011–2024 (newest 23 Oct 2024).
> Each point is one sample on its own date — not where plastic is now. Water without a point was not sampled; it is unknown, not clean.
> Details → method, size range, how the number is made.

**Inspector (one tow):**
| Row | Example |
|---|---|
| Sampled | 31 Aug 2011 (date of the tow) |
| Where | 42.75 °N, 4.13 °E (tow start) |
| Concentration | 0.50 pieces/m³ — *computed by NOAA:* pieces counted ÷ water volume (tow length × 0.6 m × 0.15 m net mouth) |
| Pieces counted | 419 (when the raw count is available — 2011–2020 rows only) |
| Size range | smaller than 5 mm, retained by a 0.33 mm net; lower bound recorded as 1 mm or 0.3 mm per sample |
| Method | manta net, surface 0–0.15 m; distance by flowmeter / GPS (per sample, when known) |
| Zero | "0 — source-reported zero: none counted in this tow" |
| Source | Oceaneye Association via NOAA NCEI Marine Microplastics (Accession 0276422, ID 0276422-0000001) |
| Behind "Method and full explanation" | NOAA's comparability warning; why points are not current; why a missing point is unknown; GPS-vs-flowmeter note; the 343 later rows note (if included) |
Not shown: NOAA's "Very Low…High" classes — they are relative to NOAA's own database and shift as records are added; on a globe they would read as danger levels.

**Evidence labels:** `Observed` for the tow (place, date, count); the concentration row says *computed by NOAA* in words. `Projected` is never used here.

**Sources & Details:** a Plastic section — what it is and is not, the conversion, size range, coverage ("one programme's routes, mostly Atlantic and Mediterranean; not global coverage"), citations (NCEI collection + paper, NCEI accession 0276422, SEANOE CC BY 4.0), and `ME.KEPT` wording.

## Behind it (hub)
- One collector job, rare cadence (source updates quarterly): page the NOAA layer at 1,000 rows, require **retrieved = expected count**, unique IDs, valid dates/positions, units = pieces/m³; publish one trimmed snapshot (~1,145 rows, est. ~100 KB — to be measured); any failure keeps the last good file with its original times. Raw counts from the SEANOE file joined where reproduced (645 rows), else "not available".
- Register row before go-live: CC0 for NOAA's compiled values; SEANOE CC BY 4.0; archive licence unstated; commercial use: yes for the CC0 compiled product.
- Tests in the usual pattern (off ≠ withheld; zero ≠ missing; no requests while off; count check fails closed) plus a release candidate shown to you before any merge.

## Out of scope for v1
Law 2010 (kept as a reference candidate) · other studies or mixing gears · lakes and rivers · any drift / movement · search over samples · NOAA concentration classes.

## Your calls
1. **Which rows:** **(A)** the 802 archived rows to Oct 2021 — fully documented, conversion reproduced; or **(B)** all 1,145 to Oct 2024 — includes 343 later rows NOAA publishes under the same accession, with no method or licence documentation found; their inspector would say so. *Claude leans B*: they are NOAA's published CC0 values, newer by three years, and the gap can be stated per point — but A is the cleaner first release.
2. **Point size:** uniform (recommended — value read in the inspector), or scaled by concentration.
3. **Wording:** the card and legend lines above — keep, change, or cut.
