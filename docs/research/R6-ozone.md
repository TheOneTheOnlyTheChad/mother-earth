# R6 — Antarctic ozone (NASA Ozone Watch) — first research gate

**Gate:** first gate only, daily **ozone-hole area** and **Southern Hemisphere minimum ozone**. Numerical map products are a separate later step. **Research only** — no implementation, collector, schedule, deployment, page change, purchase or third-party contact. Written 6 Nov 2026 for Chad's review; **Claude's results only, not independently reproduced.**
**Status: numerical feasibility verified for the two daily series; reuse/access terms partly explicit (credit line) and otherwise unresolved — not integration clearance.**
**Labels:** **Verified** = checked against the retrieved bytes or a named primary page · **Interpretation** = Claude's reading · **Open** = not yet checked.

---

## 1. Samples retrieved

| | Ozone-hole area | SH minimum ozone |
|---|---|---|
| File | `to3areas_2026_toms+omi+omps.txt` | `to3mins_2026_toms+omi+omps.txt` |
| URL | `https://ozonewatch.gsfc.nasa.gov/meteorology/figures/ozone/to3areas_2026_toms+omi+omps.txt` | `…/to3mins_2026_toms+omi+omps.txt` |
| Retrieved (UTC) | 2026-11-06 13:54:45.456 – 13:54:46.881 | 13:54:46.883 – 13:54:47.549 (re-fetched 13:56:07, identical) |
| HTTP `Last-Modified` | 5 Nov 2026 21:51:52 GMT | 5 Nov 2026 21:51:38 GMT |
| Bytes | **29,024** | **29,012** |
| sha256 | `41fcc653bc65c6de5758abe405c388b05375a9dbdd00d08209ca1cc3b33d5d84` | `ab532c29f2d1899d61e5d5f0fc1d9511b0e9672d548908957ba93e2d63f8b68c` |

Kept on the Mac: `~/Documents/Mother Earth/research/R6/2026-11-06/` with `PROVENANCE.md`; hashes identical to the in-page hash. **Not committed to the repo.**

## 2. Format (verified)

- Plain text, ASCII. A five-line header — `Name`, `Units`, `Source: toms+omi+omps`, `Missing: -9999.0`, `Climatology: 1979 to 2025` — then a column line and **365 rows, one per calendar day of 2026** (1 Jan – 31 Dec), every data row 78 characters, whitespace-separated, 9 columns, two decimals.
- Columns: `Date` (YYYY-MM-DD) · **`Data`** (this year's value) · `Minimum` · `10%` · `30%` · `Mean` · `70%` · `90%` · `Maximum`.
- **Units:** area "Million km!U2!N" — the `!U…!N` is plotting markup for a superscript, i.e. **million km²**; minimum in **Dobson Units (DU)**.
- **Missing = `-9999.0`.** Future days already carry the climatology columns with `Data` = −9999.0.
- **Genuine zeros:** the area series has **139 days with `Data` = 0.00** (no area below 220 DU, e.g. January) — real zeros, kept as zeros, not missing.
- *Interpretation:* the seven climatology columns are **the source's own day-of-year statistics over 1979–2025** (a source-provided baseline). Exact definition (e.g. whether "Minimum" is the lowest year for that date, smoothing, gaps in the 1979–2025 record such as 1995) is **Open**.

### What the 2026 files contain (verified, as of retrieval)
| | Area (million km²) | Minimum ozone (DU) |
|---|---|---|
| Latest value | **18.75** on 3 Nov | **143** on 3 Nov |
| 2026 extreme so far | maximum **27.06** on 18 Sep | lowest **114** on 4 Oct |
| Missing past days | 9: 11–16 Jul, 4–6 Nov | 10: 28 Apr, 11–16 Jul, 4–6 Nov |
- **Latest data 3 Nov** in a file modified 5 Nov 21:51 UTC and read 6 Nov 13:55 UTC. One retrieval — **not a measured publication delay.**

## 3. Observation vs assimilated gap-filling — kept apart (verified on the source's pages)

| | Ozone-hole area | Minimum ozone |
|---|---|---|
| Definition (SH methodology page) | region with total ozone **below 220 DU south of 40° S** | lowest total ozone **south of 40° S** |
| Gaps (bad orbits, polar night) | **filled with assimilated ozone data** — MERRA (1979–Jun 2016), MERRA-2 (Jul 2016–Aug 2017), **GEOS FP** (from Sep 2017) | **no interpolation**: "determined only from data actually contained in the processed satellite data" |
| Disclaimers page | interpolated values "are only used for visualization and for calculating the ozone hole area" | interpolated values "are never used in quantities such as minimum ozone" |
- **Satellite sources by period:** TOMS (Nimbus-7 1979–92, Meteor-3 1993–94, Earth Probe 1996–Oct 2004), OMI on Aura (Nov 2004–Jun 2016), **OMPS on Suomi NPP from Jul 2016**.
- *Interpretation:* **minimum ozone is satellite-derived only** (an observed statistic, with gaps left as missing); **area is a statistic computed from satellite data with assimilated gap-filling** — partly model-informed, so it must not be labelled purely Observed. The daily files do not say how much of a given day's area came from gap-filling (**Open**).
- **Inconsistency to flag:** the SH page title reads "2026 Antarctic OMPS and MERRA-2 Ozone" while the methodology names GEOS FP for gap-filling since Sep 2017. **Open** which is current for 2026.
- **Instrument history** spans five instruments and a 1995 gap (none listed between Meteor-3 1994 and Earth Probe 1996) — any long comparison crosses instrument changes.

## 4. Revisions and freshness

- **Disclaimers page (verified):** all data "are subject to being updated at any point"; data or algorithms may change; the site does **not** keep a historical archive of data versions. *Interpretation:* a value read today may differ tomorrow with no version label — retrieval time and file hash are the only provenance.
- Freshness is the **last non-missing `Data` date** (3 Nov here), not `Last-Modified` and not the page's "Last Updated" stamp (6 Nov 11:48:06Z).

## 5. Payload and processing (measured)

- Two files, **~29 KB each** for a full year; parsing = split lines, 9 numeric columns, map −9999.0 to missing. Trivial per file. Update cadence observed once (daily-looking); **Open**.

## 6. Reuse and access (primary sources)

- **Explicit:** every Ozone Watch page footer: "Please credit all material to 'NASA Ozone Watch' unless otherwise noted."
- **Explicit:** the disclaimers on updates, missing data and experimental forecasts (§3, §4); forecasts are "for research purposes only" (not in scope here).
- **Not found (Open):** a licence statement, an automated-access or rate policy, or a NASA-wide data-use statement applied to these files. *Assumption, not a permission:* as NASA Goddard products they are likely free to reuse with credit — **not verified**.

## 7. What Mother Earth could honestly show (research direction, not a UI design)

- **Two global/regional index readings** (like Kp/CO₂), each with its own date:
  - **Antarctic ozone-hole area**, million km² — labelled **computed from satellite data with assimilated gap-filling** (not "Observed").
  - **Lowest ozone south of 40° S**, DU — labelled **satellite-derived**, missing days shown as missing.
- The source's **1979–2025 climatology columns** could give a source-provided comparison ("within the source's 10–90 % range for this date"), labelled as the source's — once its definition is confirmed.
- **Not supported:** per-cell ozone values from these files; any reading of a day as "recovering" or "worse" from one value; linking ozone to other layers; forecasts.

## 8. Open questions (each needs Chad's separate go)
1. Definition of the climatology columns (and gaps in 1979–2025, e.g. 1995).
2. Which assimilation (MERRA-2 vs GEOS FP) fills 2026 gaps; share of each day's area that is gap-filled.
3. Publication delay and update time (one retrieval).
4. Licence / automated-access terms beyond the credit line.
5. Current OMPS platform for 2026 (Suomi NPP vs NOAA-20/21) — the page lists Suomi NPP from Jul 2016.
6. Numerical map products (separate gate).
7. Independent reproduction of the checks above.

## Sources
- [NASA Ozone Watch — SH meteorology / methodology](https://ozonewatch.gsfc.nasa.gov/meteorology/SH.html) · [Disclaimers](https://ozonewatch.gsfc.nasa.gov/disclaimers.html) — read 6 Nov 2026 (WebFetch + browser pane)
- Data files as in §1.
