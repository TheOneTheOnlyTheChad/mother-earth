# Mother Earth — research backlog

Research-only items. An entry here authorises **no** implementation, collector, schedule, deployment, page change, purchase or third-party contact. Each item moves forward only on Chad's explicit go, one gate at a time.

**Priorities are GPT's recommendations, not implementation approvals.** Source notes in R1–R10 are **GPT's source checks** (relayed by Chad, 5 Nov 2026), not integrations Claude has verified.

### First gate for every candidate
Retrieve a representative numerical sample; verify units, timestamps, missing values, quality/processing flags and reuse terms; measure payload and processing requirements before choosing infrastructure.
- Prefer existing **source baselines** where suitable. "How unusual is it?" stays optional until a defensible reference and comparison method exist.
- Free source data does not establish zero processing cost; effort and additional running costs stay unmeasured until measured.

### Index
Tiers are GPT's recommended order (5 Nov 2026), not approvals. "Gate" = the first gate above.

| ID | Candidate | Source | Tier | Gate status (5 Nov) | Next step |
|---|---|---|---|---|---|
| R2 | Reported fireballs | NASA/JPL CNEOS | **1 — first** | **Partly through** — GPT retrieved the full catalogue (1,074 events, 94.6 KB), units + reuse read; `vel` field discrepancy open | Claude re-checks independently; lightcurve sample; revision matching |
| R3 | Earth rotation / polar motion | USNO / IERS | **1 — first** | Not started | Sample `finals2000A`; flags, blanks, uncertainties |
| R4 | Argo ocean profiles | Argo GDAC | **1 — first** | Not started | One profile sample; T/S + QC flags; payload |
| R5 | Coral heat stress (DHW) | NOAA Coral Reef Watch | 2 — next | Not started | Product + derived-label check |
| R6 | Seasonal ozone | NASA Ozone Watch | 2 — next | Not started | Exact product, instrument history, gaps |
| R7 | Water level vs predicted tide | NOAA CO-OPS | 2 — next | Not started | Pick pilot stations; datum + preliminary/verified |
| R10 | Solar flares / X-ray | NOAA SWPC (+ DONKI, NCEI) | 2 — next *(Claude's placement; GPT gave no tier)* | **Partly** — GPT confirmed a numerical event feed (one C2.2 record) | Retain event + flux samples; thresholds, revisions, satellite switches |
| R1 | Schumann resonance / ELF | BGS Eskdalemuir (+ others) | 3 — later | Not started — no recent numerical sample; access/redistribution unresolved | One recent BGS sample + terms |
| R8 | Ionospheric TEC | NOAA GloTEC | 3 — later | Not started | Model label; obs counts + quality |
| R9 | Neutron monitors | NMDB | 3 — later | Blocked — account required, real-time files unavailable | Recheck service status + reuse |

---|---|
| First priorities | R2 fireballs · R3 Earth rotation / polar motion · R4 Argo profiles |
| Next candidates | R5 coral heat stress · R6 ozone · R7 coastal water level vs predicted tide |
| Later feasibility | R8 ionospheric TEC (GloTEC) · R9 neutron monitors (NMDB) |
| Added later | R10 solar flares / X-ray (5 Nov) |
| Added earlier | R1 Schumann resonance / ELF (5 Nov) |

---

## R1. Schumann resonance / ELF station observations

**Added:** 5 Nov 2026 (thread 15), on Chad's instruction.
**Status:** research only. No implementation, collectors, schedules, deployments or third-party contact.
**Source check:** by GPT (5 Nov 2026), relayed by Chad. **Not yet re-verified by Claude**; every claim below is GPT's reading until checked against the primary page.

### Candidate sources (as GPT found them)
| Source | What GPT found | Open |
|---|---|---|
| **BGS Eskdalemuir** (first lead) | Calibrated MFS05 induction coils installed Aug 2024; sampling raised to 128 samples/s. Previous-day spectrograms and annual numerical archives exist. 2025 archive covers Jan–May and Oct–Dec. [Station documentation](https://geomag.bgs.ac.uk/research/inductioncoils.html) · [2025 archive metadata](https://www.data.gov.uk/dataset/69eaf88b-b75d-471b-8bde-b4e77fdeca6a/2025-high-frequency-magnetic-field-induction-coil-data-from-eskdalemuir-observatory-uk) | No recent numerical sample retrieved; no unattended feed verified; automated access and permission to publish data or derived summaries unresolved. |
| **UNAM Coeneo** | Records since 2014, by request. Magnetic and electric components; ~360 MB/day raw. [Station](https://areas.geofisica.unam.mx/schumann/) | No automated current feed verified. |
| **Drozdovo** | Historical 2024 CSV, ~454 KB, processed frequencies and amplitudes for three modes. [Dataset](https://zenodo.org/records/15225820) | Authors explicitly require permission for use/publication. |
| **Sierra Nevada** | Methodology reference: ten-minute resonance estimates, 2013–2017. Processing code GPL-3.0; processed-data archive CC BY-NC-ND 3.0. [Code](https://github.com/asalinas62/Sierra_Nevada_SR) · [Dataset rights](https://digibug.ugr.es/handle/10481/71563?show=full) | The code licence does **not** extend to the dataset; do not assume our intended reuse is permitted. |

### Next research gate (when Chad gives the go)
1. Obtain **one recent BGS numerical sample**; record units, component, calibration, timestamps and missing-data conventions.
2. Find the applicable **automated-access and redistribution terms** (data and derived summaries) — what the source requires, kept apart from what is uncertain and from what we would recommend.
3. Measure **actual delay** (observation → availability) and **payload size**.
4. **Prefer source-supplied processed summaries.** If only raw data exists, benchmark raw processing before choosing any infrastructure.

### Presentation constraints (agreed now, for any later build)
- **Station markers only** — never a worldwide interpolated "energy" field.
- Keep apart: **measured signals vs fitted resonance parameters**; **frequency vs strength**; **sampling rate vs resonance frequency**.
- Show **quality limits and fitting uncertainty** where the source supplies them.
- Treat the **Aug 2024 instrument change** at Eskdalemuir as a possible baseline break.
- **No health or spiritual interpretations**, and no unsupported connections to other layers (constitution: we force no view; a bridge carries its evidence grade).

---

## R2. Reported fireball detections — NASA/JPL CNEOS  *(first priority — first feasibility study)*
**Added:** 5 Nov 2026. **Merged with** the earlier mention in `reviews/2026-11-05-landscape-comparison.md` §3 ("Fireballs / meteors", NASA CNEOS, also shown on overwatch.earth).
**Status:** research only — no implementation, collector, schedule, deployment or third-party contact.
**Sources:** [Fireball API](https://ssd-api.jpl.nasa.gov/doc/fireball.html) · [API fair-use policy](https://ssd-api.jpl.nasa.gov/doc/) · [SSD reuse statement](https://ssd.jpl.nasa.gov/faq.html) · [CNEOS catalogue and limitations](https://cneos.jpl.nasa.gov/fireballs/) · [Energy definitions](https://cneos.jpl.nasa.gov/fireballs/intro.html) · [Velocity operational notes](https://cneos.jpl.nasa.gov/fireballs/notes.html) · [Lightcurve collection](https://cneos.jpl.nasa.gov/fireballs/lc/)

### A. Independently checked by GPT — full catalogue retrieved 5 Nov 2026, 11:33 UTC
Public API, `vel-comp=true`. Response **94,649 bytes**, API version **1.2**, **1,074 events**, **15 Apr 1988 – 4 Oct 2026**. GPT's research note and the raw response are on Chad's Mac: `~/Documents/ChatGPT/Mother Earth/research/fireballs-2026-11-05/` (`RESEARCH.md`, `nasa-fireballs.json`). *Not yet re-checked by Claude.*

| Fields present | Records |
|---|---:|
| Peak-brightness date/time, radiated energy, estimated impact energy | 1,074 |
| Latitude and longitude | 888 (186 unlocated) |
| Altitude | 602 |
| All three entry-velocity components | 363 |

- Read positions from the response's `fields` array. Values arrive as **strings**; missing values are **null** (never 0). Coordinate signs come separately as N/S and E/W.
- `energy` = approximate **optical radiated** energy, in **10¹⁰ J**. `impact-e` = empirically **estimated total impact energy**, kt TNT — not measured ground damage. Keep the two apart.
- Location and altitude are at **peak brightness** — not a landing site or trajectory. Altitude is km above the reference geoid.
- `vx`, `vy`, `vz` = entry-velocity components, km/s, geocentric Earth-fixed frame.
- Example (latest): 4 Oct 2026 03:14:45 UT · 41.8° S, 173.1° W · 26.9 km · radiated ≈ 5.4 × 10¹⁰ J · impact ≈ 0.18 kt.

**Open issue — velocity discrepancy (keep explicit).** The response carries an **undocumented `vel` field**. Latest event: `vel = 13.8`; components 14.8, 2.9, 2.2 km/s → magnitude ≈ **15.24 km/s**. Don't assume `vel` is the magnitude or silently choose between them. CNEOS's June 2025 notes say "Total Velocity" was removed and speed can be calculated from the components. For any later build: use the documented components; label any magnitude **"calculated from supplied components"**. Cause unverified.

**Reuse and access (published terms, as GPT read them).** SSD FAQ: data public domain, no permission needed; CNEOS supplies these records for public release. Attribute **NASA/JPL CNEOS and the underlying U.S. Government sensor reports**, record retrieval dates, identify transformations, imply no endorsement. Does not clear unrelated images or logos. API conditions: cache, reasonable frequency, **one request at a time**, back off on errors, application-specific User-Agent with product/version/contact, check the response version. **Direct embedding in websites is prohibited** (stated CORS policy) → a future hub collector serving a cached file is the proposed approach. **No schedule approved or being created.**

**Reliability and presentation limits.**
- Incomplete, delayed and revisable; CNEOS does not independently verify or reanalyse the reports.
- Newest event ≈ 32 days before retrieval — **not a measured publication delay**. No first-publication time, stable event ID, revision number or per-record uncertainty in this response. **Revision matching needs research before any build.**
- Candidate layer: **"Reported fireballs"** — dated markers, energy, altitude, calculated speed where available; an accessible list for the unlocated records.
- Never: empty cells as zero events, landing locations, historical reports shown as live falling objects, catalogue counts as true event rates, every event as an explosion or ground impact.

### B. Outstanding — lightcurves (offering verified, no file retrieved or validated)
CNEOS advertises raw numerical `.txt` lightcurves for most events. Next gate:
1. Retrieve one example: columns, units, time reference, sampling.
2. Calibration, uncertainty and missing-data conventions.
3. Coverage, file sizes, reliable links to catalogue events.
4. Reuse/access terms for these files.
5. Version differences — CNEOS warns lightcurve reports can carry revisions not yet in the main catalogue.

**GLM bolides** (GOES Geostationary Lightning Mapper) are a separate potential source: own assessment, including overlap and duplicate handling.

## R3. Earth rotation and polar motion — USNO / IERS  *(first priority)*
**Sources:** [Daily products](https://maia.usno.navy.mil/products/daily.htm) · [File format](https://maia.usno.navy.mil/ser7/readme.finals2000A)
- **Compact global readings** (index-style, like Kp/CO₂), not per-cell measurements.
- Preserve **observation vs prediction flags** and **uncertainties**.
- Length-of-day fields can be **blank — never convert blanks to zero** (thread-14 rule: `+''` is 0).

## R4. Argo ocean profiles  *(first priority — more processing work)*
**Sources:** [Data access](https://www.argodatamgt.org/DataAccess.html) · [BGC quality guidance](https://biogeochemical-argo.org/data-management.php)
- Start with **temperature / salinity** and their documented **quality flags**.
- Show **each profile's own position and time** — never an invented "current" float position.
- **Biogeochemical variables need separate checks:** real-time values can require adjustment before meaningful scientific use.

## R5. Coral heat stress — NOAA Coral Reef Watch  *(next candidate)*
**Source:** [Methodology](https://coralreefwatch.noaa.gov/product/5km/methodology.php)
- Degree Heating Weeks accumulate heat stress over the **preceding 12 weeks**.
- Label as a **derived heat-stress product** — not observed bleaching, not coral mortality.

## R6. Seasonal ozone observations — NASA Ozone Watch  *(next candidate)*
**Sources:** [Portal](https://ozonewatch.gsfc.nasa.gov/) · [Annual records](https://ozonewatch.gsfc.nasa.gov/statistics/annual_data.html)
- Identify the **exact product**, **instrument history** and **missing periods**.
- The annual-record table holds **yearly extremes**, not the daily seasonal series, and has **no 1995 data**.
- Use appropriate **seasonal** comparisons.

## R7. Coastal water level vs predicted tide — NOAA CO-OPS  *(next candidate — regional station pilot)*
**Source:** [API documentation](https://api.tidesandcurrents.noaa.gov/api/dev)
- Observation minus astronomical-tide prediction is a **computed residual** (labelled Computed, ours).
- Match **timestamps, units and vertical datum**; distinguish **preliminary vs verified** observations.
- Do **not** automatically call the residual storm surge or sea-level rise.

## R8. Ionospheric total electron content — NOAA GloTEC  *(later feasibility)*
**Source:** [Product documentation](https://www.spaceweather.gov/products/glotec)
- Explicitly a **data-assimilative model** — never labelled Observed.
- Preserve **observation counts** and **quality information**; unsampled regions revert toward the background model.
- Its anomaly uses a **30-day median** (the source's comparison, labelled as theirs).

## R9. Cosmic-ray neutron-monitor readings — NMDB  *(later feasibility)*
**Source:** [Access and reuse notice](https://nmdb.eu/)
- **Station observations**, compared only with compatible station history.
- Inspected temporary-service notice: **an account is required** and **real-time files are unavailable**.
- Data are **provider-owned**; non-commercial access is subject to individual restrictions.
- **Recheck service status and intended reuse** before going further (no account creation, no contact without Chad's go).

## R10. Solar flares / solar X-ray observations  *(candidate — added 5 Nov 2026)*
**Status:** research only — no implementation, collector, schedule, deployment or third-party contact. GPT checked the primary sources and one actual NOAA event feed: numerical availability confirmed; feasibility and reuse checks outstanding. *Not yet re-checked by Claude.* Related: NOAA SWPC is already a registered source (Kp).

**Sources**
1. **NOAA GOES / SWPC X-ray observations** — [product](https://www.spaceweather.gov/products/goes-x-ray-flux); first lead. Two wavelength bands; published plots use one-minute averages. **[Recent-flare JSON](https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json)**: start, peak, end, class, peak flux, integrated flux, observing satellite; some fields nullable. Verified example: **C2.2, 4 Nov 2026, 17:23 / 17:34 / 17:38 UTC, GOES-18** — confirms accessible numerical records, not continuous availability or a measured delay.
2. **NASA CCMC DONKI** — [tool](https://ccmc.gsfc.nasa.gov/tools/DONKI/); catalogued flares, analyses, links to other space-weather events. Context only; don't assume it lists every detected flare. Migrated Sep 2026 — use current documentation and endpoints, not old `kauai` URLs.
3. **NOAA NCEI solar-flare archives** — [legacy data](https://www.ncei.noaa.gov/products/space-weather/legacy-data/solar-flares-events); historical, for possible long-term comparison. Coverage and documentation vary; never treat historical and current as one series without a compatibility check.

**Possible presentation:** a solar-activity panel or timeline — measured X-ray flux beside identified flare events, with source, satellite, observation time, retrieval time and quality information. **Not on the globe's cells:** a flare's solar location is not an Earth location. Any Earth-effects view needs its own supported observations or clearly labelled modelling. A flare alone does not establish that an Earth-directed CME or a geomagnetic storm will follow.

Keep explicit: continuous measurements vs detected/catalogued events · observations vs forecasts/modelled effects · flare class vs peak flux vs integrated flux vs total emitted energy (class = peak soft X-ray flux in a band, **not** total energy) · flares vs CMEs vs particle events vs geomagnetic storms.

**Outstanding checks**
- Retain representative event and X-ray samples; schemas, units, wavelength bands, timestamp conventions.
- Detection thresholds, catalogue inclusion rules, provisional/final status, revisions, identifier stability.
- Missing values, quality flags, eclipse periods, instrument issues, incomplete events.
- Measured freshness, publication delay, payload sizes, rolling-feed coverage (not inferred from filenames).
- Automated-access and numerical redistribution terms, separately for NOAA and NASA: attribution, caching, request limits.
- Primary/secondary satellite selection and transitions — no duplicates or silent changes on a switch.
- Historical coverage, calibration changes, compatibility before any baseline or trend.
- DONKI links: observed associations vs analysis, forecasts, model output.
- Collection and retention cost before any schedule (project target: no new running cost; Workers Paid $5/month since 3 Nov).

**Research order:** NOAA recent-event feed + matching X-ray measurements → DONKI context → historical comparisons once measurement definitions and continuity are understood.
