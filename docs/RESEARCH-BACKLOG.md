# Mother Earth — research backlog

Research-only items. An entry here authorises **no** implementation, collector, schedule, deployment, page change, purchase or third-party contact. Each item moves forward only on Chad's explicit go, one gate at a time.

**Priorities are GPT's recommendations, not implementation approvals.** Source notes in R1–R9 are **GPT's source checks** (relayed by Chad, 5 Nov 2026), not integrations Claude has verified.

### First gate for every candidate
Retrieve a representative numerical sample; verify units, timestamps, missing values, quality/processing flags and reuse terms; measure payload and processing requirements before choosing infrastructure.
- Prefer existing **source baselines** where suitable. "How unusual is it?" stays optional until a defensible reference and comparison method exist.
- Free source data does not establish zero processing cost; effort and additional running costs stay unmeasured until measured.

### Order (GPT's recommendation)
| Tier | Items |
|---|---|
| First priorities | R2 fireballs · R3 Earth rotation / polar motion · R4 Argo profiles |
| Next candidates | R5 coral heat stress · R6 ozone · R7 coastal water level vs predicted tide |
| Later feasibility | R8 ionospheric TEC (GloTEC) · R9 neutron monitors (NMDB) |
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
**Sources:** [Data and limitations](https://cneos.jpl.nasa.gov/fireballs/) · [API](https://ssd-api.jpl.nasa.gov/doc/fireball.html)
- Do **not** describe every event as an explosion or a ground impact.
- Reports are **incomplete, delayed and revisable**; **locations may be missing** (no location → no marker, stated as such).
- Keep **approximate radiated energy** separate from **calculated impact energy**.

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
