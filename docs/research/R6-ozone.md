# R6 — Antarctic ozone (NASA Ozone Watch) — first research gate

**Gate:** first gate only, daily **ozone-hole area** and **Southern Hemisphere minimum ozone**. Numerical map products are a separate later step. **Research only** — no implementation, collector, schedule, deployment, page change, purchase or third-party contact. Written 6 Nov 2026 for Chad's review.
**PARKED 6 Nov 2026 (Chad, after GPT's review) — first-gate handover, rev 2.** Any next gate needs Chad's separate go; no implementation clearance.
**Status: numerical feasibility verified for the two daily series; reuse/access terms partly explicit (credit line) and otherwise unresolved — not integration clearance.**
**Rev 5 (8 Nov 2026, GPT wording corrections): terms/access review §9 — P1–P5 read by GPT on Chad's behalf; credit request established; commercial reuse UNRESOLVED (no applicable grant found; not prohibited); research-only REGISTER draft for review, NOT filed; still parked for building.**
**Independent check:** GPT independently checked both preserved files — full sha256 and byte sizes match; 365 calendar rows each; area 301 supplied values, minimum 300; area 139 source-reported zero days; nine area and ten minimum dates missing through 6 Nov; latest values 18.75 million km² and 143 DU on 3 Nov; area maximum 27.06 on 18 Sep.
**Rev 2 corrections (GPT review, adopted):** tied minimum (114 DU on 4 and 8 Oct); minimum described as the lowest among available retrievals; zero wording; format and missing-value categories (§2, §3).
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

- Plain text, ASCII. A five-line header — `Name`, `Units`, `Source: toms+omi+omps`, `Missing: -9999.0`, `Climatology: 1979 to 2025` — then a column line and **365 rows, one per calendar day of 2026** (1 Jan – 31 Dec), every data row 78 characters, whitespace-separated: **one date plus eight numeric fields**, two decimals.
- Columns: `Date` (YYYY-MM-DD) · **`Data`** (this year's value) · `Minimum` · `10%` · `30%` · `Mean` · `70%` · `90%` · `Maximum`.
- **Units:** area "Million km!U2!N" — the `!U…!N` is plotting markup for a superscript, i.e. **million km²**; minimum in **Dobson Units (DU)**.
- **Missing = `-9999.0` in `Data`, three different situations kept apart (as retrieved 6 Nov):**
  | | Area | Minimum |
  |---|---|---|
  | Supplied values | 301 | 300 |
  | **Historical missing** (date before the latest supplied value) | 6: 11–16 Jul | 7: 28 Apr, 11–16 Jul |
  | **Not yet supplied** through retrieval day (after the latest value, up to 6 Nov) | 3: 4–6 Nov | 3: 4–6 Nov |
  | **Future placeholders** (7 Nov – 31 Dec; climatology filled, `Data` −9999.0) | 55 | 55 |
- **Zeros:** on **139 days** the source reports **0.00 million km² at the file's precision** (e.g. January) — kept as reported values, not missing. This does not establish that no ozone below 220 DU existed anywhere south of 40° S on those days.
- *Interpretation:* the seven climatology columns are **the source's own day-of-year statistics over 1979–2025** (a source-provided baseline). Exact definition (e.g. whether "Minimum" is the lowest year for that date, smoothing, gaps in the 1979–2025 record such as 1995) is **Open**.

### What the 2026 files contain (verified, as of retrieval)
| | Area (million km²) | Minimum ozone (DU) |
|---|---|---|
| Latest value | **18.75** on 3 Nov | **143** on 3 Nov |
| 2026 extreme so far | maximum **27.06** on 18 Sep | lowest **114**, **tied on 4 and 8 Oct** |
| Missing through 6 Nov | 9 (6 historical + 3 not yet supplied) | 10 (7 historical + 3 not yet supplied) |
- **Latest data 3 Nov** in a file modified 5 Nov 21:51 UTC and read 6 Nov 13:55 UTC. One retrieval — **not a measured publication delay.**

## 3. Observation vs assimilated gap-filling — kept apart (verified on the source's pages)

| | Ozone-hole area | Minimum ozone |
|---|---|---|
| Definition (SH methodology page) | region with total ozone **below 220 DU south of 40° S** | lowest total ozone **among the available satellite retrievals** south of 40° S |
| Gaps (bad orbits, polar night) | **filled with assimilated ozone data** — MERRA (1979–Jun 2016), MERRA-2 (Jul 2016–Aug 2017), **GEOS FP** (from Sep 2017) | **no interpolation**: "determined only from data actually contained in the processed satellite data" |
| Disclaimers page | interpolated values "are only used for visualization and for calculating the ozone hole area" | interpolated values "are never used in quantities such as minimum ozone" |
- **Satellite sources by period:** TOMS (Nimbus-7 1979–92, Meteor-3 1993–94, Earth Probe 1996–Oct 2004), OMI on Aura (Nov 2004–Jun 2016), **OMPS on Suomi NPP from Jul 2016**.
- **Coverage limit of the minimum:** it is the minimum among the retrievals that exist; areas without data (bad orbits, polar night) may hold lower ozone, so the reported minimum **can be too high** (NASA's caution — **verified by GPT against NASA's SH methodology page**; Claude did not re-check it in the rev-2 pass). It does **not** imply complete coverage south of 40° S.
- *Interpretation:* **minimum ozone is satellite-derived only** (an observed statistic over available retrievals, with gaps left as missing); **area is a statistic computed from satellite data with assimilated gap-filling** — partly model-informed, so it must not be labelled purely Observed. The daily files do not say how much of a given day's area came from gap-filling (**Open**).
- **Inconsistency to flag:** the SH page title reads "2026 Antarctic OMPS and MERRA-2 Ozone" while the methodology names GEOS FP for gap-filling since Sep 2017. **Open** which is current for 2026.
- **Instrument history** spans five instruments and a 1995 gap (none listed between Meteor-3 1994 and Earth Probe 1996) — any long comparison crosses instrument changes.

## 4. Revisions and freshness

- **Disclaimers page (verified):** all data "are subject to being updated at any point"; data or algorithms may change; the site does **not** keep a historical archive of data versions. *Interpretation:* a value read today may differ tomorrow with no version label — retrieval time and file hash are the only provenance.
- Freshness is the **last non-missing `Data` date** (3 Nov here), not `Last-Modified` and not the page's "Last Updated" stamp (6 Nov 11:48:06Z).

## 5. Payload and processing (measured)

- Two files, **~29 KB each** for a full year; parsing = split lines, one date plus eight numeric fields, map −9999.0 to missing. Trivial per file. Update cadence observed once (daily-looking); **Open**.

## 6. Reuse and access (primary sources)

- **Explicit:** every Ozone Watch page footer: "Please credit all material to 'NASA Ozone Watch' unless otherwise noted."
- **Explicit:** the disclaimers on updates, missing data and experimental forecasts (§3, §4); forecasts are "for research purposes only" (not in scope here).
- *Historical (6 Nov); superseded by §9 (8 Nov):* the licence, automated-access and NASA-wide questions, and the earlier assumption about reuse with credit, are answered by §9 — credit request established; commercial reuse unresolved (no applicable grant established); no numerical limit found in the named pages.

## 7. What Mother Earth could honestly show (research direction, not a UI design)

- **Two global/regional index readings** (like Kp/CO₂), each with its own date:
  - **Antarctic ozone-hole area**, million km² — labelled **computed from satellite data with assimilated gap-filling** (not "Observed").
  - **Lowest ozone among available satellite retrievals south of 40° S**, DU — labelled **satellite-derived, coverage-limited** (may be too high where data are missing); missing days shown as missing.
- The source's **1979–2025 climatology columns** could give a source-provided comparison ("within the source's 10–90 % range for this date"), labelled as the source's — once its definition is confirmed.
- **Not supported:** per-cell ozone values from these files; any reading of a day as "recovering" or "worse" from one value; linking ozone to other layers; forecasts.

## 8. Open questions (parked; each needs Chad's separate go)
1. Definition of the climatology columns (and gaps in 1979–2025, e.g. 1995).
2. Which assimilation (MERRA-2 vs GEOS FP) fills 2026 gaps; share of each day's area that is gap-filled.
3. Publication delay and update time (one retrieval).
4. Licence / automated-access terms beyond the credit line.
5. Current OMPS platform for 2026 (Suomi NPP vs NOAA-20/21) — the page lists Suomi NPP from Jul 2016.
6. Numerical map products (separate gate).

## 9. Terms and access review (rev 5, 8 Nov 2026; Chad's go: bounded, read-only, R6 only) — for GPT
**Scope:** only the recorded terms/access question (§6 "Not found", §8 item 4) for the two daily files (`to3areas_…`, `to3mins_…`). **No data fetched or sampled, no provider contact, no route selection, no implementation, resources, schedules, deploy or page change.** GIBS and other gates untouched. **Terms clarification alone does not clear R6 for building**; §8 items 1–3, 5–6 and all accepted technical findings are unchanged.
**Rev 5 (8 Nov 2026):** GPT's two wording corrections (§9.1 evidence gap, §9.4 applicability not established) carried into the table and the REGISTER draft; §6's older assumption replaced by a cross-reference to §9.
**Rev 4 (8 Nov 2026):** required extraction complete. P1–P5 were read by **GPT on Chad's behalf** (GPT is the reader; these are not Chad's personal pastes). §9.4's "reuse with credit… is supported" and its authorship inference are corrected; the evidence table is complete.
**Evidence status labels:** *Claude (6 Nov)* = read in the rev-1 pass (§6) · *Claude (fetch summary)* = read 8 Nov with Claude's web-fetch tool (summary with quotations) · *GPT (read, 8 Nov)* = GPT inspected the page on Chad's behalf.

### 9.1 What the product is (for terms purposes)
- The two files are **Ozone Watch's own derived daily statistics** (area, minimum), computed from OMPS (Suomi NPP) retrievals, with the area's gaps filled from assimilated data (GMAO; MERRA-2 vs GEOS FP open, §3). Published on Ozone Watch's NASA Goddard site; the inspected evidence does not establish that these two files are distributed through ESDIS or covered by its data-use guidance.
- Product rights, website/service conditions and upstream inputs are kept separate. **Upstream terms are not permission for Ozone Watch's derived files.**

### 9.2 Evidence table
**A. Reuse / commercial terms**
| # | Finding | Page | Applies to | Status |
|---|---|---|---|---|
| A1 | No explicit commercial-reuse grant (and no numerical polling limit). Data and processing/rendering methods may change; previous versions are not all archived. | [Ozone Watch Disclaimers](https://ozonewatch.gsfc.nasa.gov/disclaimers.html) (P1) | Ozone Watch data | GPT (read in full, 8 Nov) · Claude (6 Nov, updates) |
| A2 | Old footer "Privacy Policy & Important Notices" URL (`nasa.gov/about/highlights/HP_Privacy.html`) **redirects to** <https://www.nasa.gov/privacy/> — a privacy/security notice; **no applicable data-reuse grant**. Recorded as a redirect, **not licence evidence**. | P2 | NASA websites (privacy/security) | GPT (read, 8 Nov) · Claude (fetch summary) |
| A3 | GMAO homepage, reanalysis and weather-analysis/prediction pages: **no applicable reuse grant**. The GMAO products URL redirected to a login page — an access limitation **for that page only**, not evidence that Ozone Watch's public files need authentication. | GMAO pages (P5, conditional check applicable because Ozone Watch links GMAO) | Upstream assimilation inputs | GPT (read, 8 Nov) |
| A4 | NASA ESDIS: NASA-mission data CC0 unless marked; non-NASA data follow the sponsor's licence. | [NASA Earthdata guidance](https://www.earthdata.nasa.gov/earth-observation-data/data-use-policy) | ESDIS-distributed data; **applicability to the R6 files not established** | Claude (fetch summary) |
| A5 | OMPS L2 input (GES DISC, DOI 10.5067/0WF4HAAZ0VHK): "openly shared, without restriction" under the EOSDIS guidance | [Earthdata record](https://www.earthdata.nasa.gov/data/catalog/ges-disc-omps-npp-nmto3-l2-2) | **Input dataset only**; not permission for the derived files | Claude (fetch summary) |
| A6 | NASA media (images, audio, video, 3-D media) "generally are not subject to copyright in the United States"; no implied endorsement; credit NASA; third-party and insignia exceptions | [NASA media guidelines](https://nasa.gov/nasa-brand-center/images-and-media) | Media types listed; **applicability to these two derived files not established** | Claude (fetch summary) |

**B. Attribution**
- **Verified (P3):** homepage footer: "Please credit all material to "NASA Ozone Watch" unless otherwise noted." (<https://ozonewatch.gsfc.nasa.gov/>; GPT read, 8 Nov; also Claude, 6 + 8 Nov.) This establishes the **requested credit**. **A request for attribution does not itself establish permission for commercial redistribution** of the two derived files.
- Context: A4/A6 ask that NASA be acknowledged; A5's input has a citation (McPeters 2017).

**C. Other conditions on the data (P1, GPT read in full)**
- Interpolation fills gaps for visualisation and ozone-hole **area** calculations; it is not rigorously evaluated for scientific use and is **never used for minimum ozone** (consistent with §3).
- The experimental / research-only caution concerns the **GMAO GEOS forecasts** described on that page. **It is not extended to Ozone Watch's historical statistics** (corrects any broader reading).

**D. Automated-access guidance**
- Files described as plain-text ASCII "suitable for input into any program" (Claude, fetch summary). **Machine-readable formatting does not establish a polling allowance.**
- No scripted-download or automated-access rule found on the pages inspected (P1–P5, and §6 pages).

**E. Numerical limits**
- **No numerical rate, cadence or load limit found** in these pages, inspected 6–8 Nov 2026: Ozone Watch homepage, Disclaimers, Contacts, SH meteorology / methodology, meteorology page; nasa.gov privacy notice; GMAO homepage, reanalysis and weather-analysis/prediction pages; NASA Earthdata guidance; Earthdata OMPS record; NASA media guidelines. **Not evidence of unlimited access.**

**F. Contacts and authorship (P4, GPT read, 8 Nov)**
- [Contacts](https://ozonewatch.gsfc.nasa.gov/contacts.html) / homepage: Paul Newman listed with UMBC, Leslie Lait with NASA. The older Disclaimers footer gives different role/affiliation information.
- **Contact listings and affiliations do not establish authorship or copyright status** of the two files.

### 9.3 Extraction record
P1–P5 completed 8 Nov 2026 by GPT on Chad's behalf (P1 → A1, C; P2 → A2; P3 → B; P4 → F; P5 → A3).

### 9.4 Interpretation (open to challenge; corrected in rev 4)
- **Attribution:** the requested credit is established (B). It does **not** by itself establish permission for commercial redistribution.
- **Commercial reuse: UNRESOLVED — no applicable grant established in the inspected sources.** Applicability of the ESDIS guidance and NASA media guidelines to these two derived files has not been established; the input dataset's terms do not by themselves establish permission for the derived files; the privacy notice supplies no applicable reuse grant. **Not a finding that reuse is prohibited.**
- **Federal-work reasoning:** that the files carry no U.S. copyright as NASA work remains **explicitly unverified**. Rev 3's suggestion that a university-affiliated contact implies non-federal authorship is **withdrawn**: affiliations establish neither authorship nor copyright status in either direction.
- **Upstream vs product:** GMAO and OMPS input terms are separate from permission for Ozone Watch's derived files.

### 9.4a Provider enquiry (reported by Chad 9 Nov 2026)
- Chad emailed NASA Ozone Watch about reuse of the two daily files (area, minimum), public/API redistribution, commercial use, attribution and once-daily retrieval. **Reply pending. No permission is inferred from sending or from silence**; the position in §9.4 stands. Record: `docs/research/ENQUIRIES-2026-11.md`.

### 9.5 Unanswered questions
1. Licence / commercial-reuse position for the two derived files (no applicable grant found).
2. Authorship and copyright status of the files (unverified; not inferable from contacts).
3. Any polling allowance or numerical limit — none found in the named pages on the named dates; not unlimited.

### 9.6 Proposed REGISTER entry — research-only DRAFT (NOT filed, not cleared)
GPT (8 Nov 2026, rev 5 wording): technically acceptable as an unresolved evidence record. **Not authorised for filing**; clears neither commercial reuse, access cadence, integration nor building.
```
## NASA Ozone Watch — daily Antarctic ozone-hole area + SH minimum ozone (to3areas_/to3mins_YYYY_toms+omi+omps.txt) — research only, not on the page
- **Read:** 6 Nov 2026 by Claude (SH meteorology/methodology, Disclaimers, data files); 8 Nov 2026 by GPT on Chad's behalf (P1 Disclaimers in full; P2 footer notice redirect; P3 homepage; P4 Contacts; P5 GMAO homepage, reanalysis, weather-analysis/prediction pages); 8 Nov 2026 by Claude (fetch summaries: NASA Earthdata guidance, OMPS record, NASA media guidelines). Research record: docs/research/R6-ozone.md §6, §9.
- **Credit (verbatim, Ozone Watch footer):** "Please credit all material to "NASA Ozone Watch" unless otherwise noted." — requested credit; not itself a reuse permission.
- **Disclaimers (summary, GPT):** data and methods may change, earlier versions not all archived; interpolation fills gaps for visualisation and area only, never for minimum ozone; the research-only caution applies to GMAO GEOS forecasts, not to these statistics.
- **Website notice:** footer link redirects to https://www.nasa.gov/privacy/ (privacy/security notice; not licence evidence).
- **Upstream and NASA-wide guidance (kept separate):** OMPS L2 input openly shared under EOSDIS guidance — the input's terms do not by themselves establish permission for the derived files; GMAO pages show no applicable grant. Applicability of the ESDIS data-use guidance and NASA media guidelines to these two files has not been established; the inspected evidence does not establish that the files are distributed through ESDIS.
- **Automated use:** plain-text files described as suitable for program input; no scripted-download rule and no numerical rate/cadence/load limit found in the pages inspected (6–8 Nov 2026) — not unlimited; machine-readable format is not a polling allowance.
- **Coverage statement:** none filed (R6 technical gates open: climatology definition, gap-fill share, publication timing, OMPS platform).
- **Status:** ⛔ research only; not cleared for building.
- **Commercial use:** UNRESOLVED — no applicable grant established in the inspected sources (ESDIS guidance and NASA media guidelines: applicability not established; input terms: not by themselves permission; privacy notice: no applicable grant); federal-work status unverified. Not a finding that reuse is prohibited.
```

## Sources
- Terms pass, 8 Nov 2026 (Claude fetch summaries): [Ozone Watch meteorology](https://ozonewatch.gsfc.nasa.gov/meteorology/) · [NASA Earthdata guidance](https://www.earthdata.nasa.gov/earth-observation-data/data-use-policy) · [OMPS-NPP L2 record](https://www.earthdata.nasa.gov/data/catalog/ges-disc-omps-npp-nmto3-l2-2) · [NASA media guidelines](https://nasa.gov/nasa-brand-center/images-and-media) · [nasa.gov privacy](https://www.nasa.gov/privacy/)
- Read by GPT on Chad's behalf, 8 Nov 2026: [Ozone Watch homepage](https://ozonewatch.gsfc.nasa.gov/) · [Disclaimers](https://ozonewatch.gsfc.nasa.gov/disclaimers.html) · [Contacts](https://ozonewatch.gsfc.nasa.gov/contacts.html) · footer notice redirect → [nasa.gov/privacy](https://www.nasa.gov/privacy/) · GMAO homepage, reanalysis and weather-analysis/prediction pages
- [NASA Ozone Watch — SH meteorology / methodology](https://ozonewatch.gsfc.nasa.gov/meteorology/SH.html) · [Disclaimers](https://ozonewatch.gsfc.nasa.gov/disclaimers.html) — read 6 Nov 2026 (WebFetch + browser pane)
- Data files as in §1.
