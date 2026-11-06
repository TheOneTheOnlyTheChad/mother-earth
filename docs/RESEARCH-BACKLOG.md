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
| R2 | Reported fireballs | NASA/JPL CNEOS | **1 — first** | **Parked 5 Nov** — research handover = matching proposal rev 3 (GPT accepted its reasoning) + evidence folder. Catalogue and `vel` arithmetic confirmed by GPT and Claude; archived-index counts, pairings and the lightcurve sample are Claude's only | Resume only on Chad's go: two open design notes (count disclosure, negative-coordinate treatment) + open acceptance rules, thresholds, review authority, lightcurve reuse/timing, `vel` cause |
| R3 | Earth rotation / polar motion | USNO / IERS | **1 — first** | **First gate: numerical feasibility verified; reuse/access checks unresolved** (rev 2, 6 Nov; sample checks independently verified by GPT, Bulletin B comparison Claude's only) — [`research/R3-earth-rotation.md`](research/R3-earth-rotation.md); sample = IERS copy of `finals2000A.daily` | Separate go each: consecutive-release comparisons, extended history, error-field meaning, remaining terms checks |
| R4 | Argo ocean profiles | Argo GDAC | **1 — first** | Not started | One profile sample; T/S + QC flags; payload |
| R5 | Coral heat stress (DHW) | NOAA Coral Reef Watch | 2 — next | Not started | Product + derived-label check |
| R6 | Seasonal ozone | NASA Ozone Watch | 2 — next | Not started | Exact product, instrument history, gaps |
| R7 | Water level vs predicted tide | NOAA CO-OPS | 2 — next | Not started | Pick pilot stations; datum + preliminary/verified |
| R10 | Solar flares / X-ray | NOAA SWPC (+ DONKI, NCEI) | 2 — next *(Claude's placement; GPT gave no tier)* | **Partly** — GPT confirmed a numerical event feed (one C2.2 record) | Retain event + flux samples; thresholds, revisions, satellite switches |
| R1 | Schumann resonance / ELF | BGS Eskdalemuir (+ others) | 3 — later | Not started — no recent numerical sample; access/redistribution unresolved | One recent BGS sample + terms |
| R8 | Ionospheric TEC | NOAA GloTEC | 3 — later | Not started | Model label; obs counts + quality |
| R9 | Neutron monitors | NMDB | 3 — later | Blocked — account required, real-time files unavailable | Recheck service status + reuse |
| R11 | FIRMS: previous-day observations arriving after midnight | NASA FIRMS (existing layer) | — internal data-quality item *(not a new source; no tier)* | Not started — one data point only (5 Nov latest observation 21:36 UTC) | Measure across several days; compare `day_range=2` with an explicit previous-date query (payload, cost) |

---|---|
| First priorities | R2 fireballs · R3 Earth rotation / polar motion · R4 Argo profiles |
| Next candidates | R5 coral heat stress · R6 ozone · R7 coastal water level vs predicted tide |
| Later feasibility | R8 ionospheric TEC (GloTEC) · R9 neutron monitors (NMDB) |
| Added later | R10 solar flares / X-ray (5 Nov) · R11 FIRMS previous-day arrivals after midnight (6 Nov) |
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

### A. Catalogue — retrieved by GPT 5 Nov 2026, 11:33 UTC; re-checked independently by Claude (§C)
Public API, `vel-comp=true`. Response **94,649 bytes**, API version **1.2**, **1,074 events**, **15 Apr 1988 – 4 Oct 2026**. GPT's research note and the raw response are on Chad's Mac: `~/Documents/ChatGPT/Mother Earth/research/fireballs-2026-11-05/` (`RESEARCH.md`, `nasa-fireballs.json`). **Claude's two retrievals (~13:11 and ~13:15 UTC) are byte-identical** (sha256 `8b1561636e1e3c59519d9e60d737a7d146ee52632f79253c6c801ee567759bbd`); the counts below are confirmed by both.

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

**Velocity discrepancy (keep explicit; quantified in §C.2).** The response carries an **undocumented `vel` field**. Latest event: `vel = 13.8`; components 14.8, 2.9, 2.2 km/s → magnitude ≈ **15.24 km/s**. Don't assume `vel` is the magnitude or silently choose between them. CNEOS's June 2025 notes say "Total Velocity" was removed and speed can be calculated from the components. For any later build: use the documented components; label any magnitude **"calculated from supplied components"**. Cause unverified.

**Reuse and access (published terms, as GPT read them; Claude re-read the SSD FAQ 5 Nov).** SSD FAQ: data on that site public domain, no permission needed — **this statement is on ssd.jpl.nasa.gov and is not extended to the separate CNEOS lightcurve files (§C.5)**; CNEOS supplies these records for public release. Attribute **NASA/JPL CNEOS and the underlying U.S. Government sensor reports**, record retrieval dates, identify transformations, imply no endorsement. Does not clear unrelated images or logos. API conditions: cache, reasonable frequency, **one request at a time**, back off on errors, application-specific User-Agent with product/version/contact, check the response version. **Direct embedding in websites is prohibited** (stated CORS policy) → a future hub collector serving a cached file is the proposed approach. **No schedule approved or being created.**

**Reliability and presentation limits.**
- Incomplete, delayed and revisable; CNEOS does not independently verify or reanalyse the reports.
- Newest event ≈ 32 days before retrieval — **not a measured publication delay**. No first-publication time, stable event ID, revision number or per-record uncertainty in this response. **Revision matching needs research before any build.**
- Candidate layer: **"Reported fireballs"** — dated markers, energy, altitude, calculated speed where available; an accessible list for the unlocated records.
- Never: empty cells as zero events, landing locations, historical reports shown as live falling objects, catalogue counts as true event rates, every event as an explosion or ground impact.

### B. Lightcurves — see §C.3–C.5. **Further lightcurve work parked** pending the open checks (reuse, time reference, report contents).

### C. Independent re-check — 5 Nov 2026 (research only; read-only)
Attribution: **C.1–C.2 confirmed by both GPT and Claude**; **C.3–C.4 are Claude's results only, not yet independently reproduced.**
**Evidence (kept apart from production; provenance + hashes in its README):** `~/Documents/Mother Earth/research/fireballs/2026-11-05-claude/` — catalogue response, today's lightcurve index, one lightcurve `.txt`, the Internet Archive's 2024 copy of the index, four scripts and their CSV outputs. Not in the public repo (lightcurve reuse unresolved).

| Object | URL | Retrieved (UTC) | sha256 |
|---|---|---|---|
| Catalogue | `https://ssd-api.jpl.nasa.gov/fireball.api?vel-comp=true` | 11:33 (GPT) · ~13:11, ~13:15 (Claude) — identical | `8b1561636e1e3c59519d9e60d737a7d146ee52632f79253c6c801ee567759bbd` |
| Lightcurve index | `https://cneos.jpl.nasa.gov/fireballs/lc/lc_files.json` | ~13:11 (Claude, browser) · 13:38:00 (Chad's Terminal) — identical | `b4b13ceb3f2088d05a812085226f87f6cade9560d161370cfcf3eaeaaa168263` |
| Lightcurve sample | `https://cneos.jpl.nasa.gov/fireballs/lc/2023.172.193912.txt` | ~13:13 · 13:38 — identical | `c319a0db17c8e76443272d0de821df2c482d0943f38fbaed789769c340145643` |
| Index, archived | `https://web.archive.org/web/20240612235733id_/https://cneos.jpl.nasa.gov/fireballs/lc/lc_files.json` (capture 2024-06-12T23:57:33Z; original Last-Modified 2024-04-01) | 13:38 · browser read — identical | `76e227ec2d364a05208a429f88405d3eb56c7f80252614deec0f1ad56e9fdb2c` |

**C.1 Catalogue — GPT's findings confirmed.** Version 1.2 (= doc); `count` arrives as the string `"1074"`; sorted newest first; no duplicate timestamps; all timestamps `YYYY-MM-DD hh:mm:ss`. Field counts identical to §A. Location fields are all four or none (0 partial); `vel` and the three components are all present or all null (363). Values are strings or null, no empty strings; genuine zeros exist (lat `0.0` once, vx once, vz once) and stay zeros. Field order in the response differs from the doc's sample — read positions from `fields`. Component precision varies by era (`18`, `6.30`, `14.8`). No `Last-Modified` or `Cache-Control` on the response.

**C.2 `vel` vs components — corrected (GPT's independent recalculation; reproduced by Claude with `vel_check.py`, full 363-row table in `vel-comparison-363.csv`).**
- **352** of 363 have |`vel` − component magnitude| ≤ 0.05 km/s; **11** exceed it. *(Claude's earlier "354 / 9" was wrong: the code tested 0.15 km/s while the note said 0.05. Its "all lower" was also wrong — one is higher.)*
- **Rounding-compatibility bounds** — the range each printed value could have before rounding to its digits (±½ of the last digit, per component and for `vel`). These are **not measurement uncertainties**. **3 of the 11 are compatible with rounding; 8 remain unexplained.**

| Peak time (UT) | `vel` | vx, vy, vz | magnitude | vel − mag | magnitude interval | rounding-compatible |
|---|---:|---|---:|---:|---|---|
| 2026-10-04 03:14:45 | 13.8 | 14.8, 2.9, 2.2 | 15.241 | −1.441 | 15.176–15.306 | no |
| 2026-08-14 07:48:36 | 12.2 | 5.2, 22.3, 0.2 | 22.899 | −10.699 | 22.839–22.960 | no |
| 2023-06-21 19:39:12 | 16.5 | 7.3, −2.0, −16.4 | 18.062 | −1.562 | 17.991–18.134 | no |
| 2020-12-22 23:23:28 | 13.6 | −2.6, 5.9, −12.1 | 13.711 | −0.111 | 13.636–13.786 | **yes** |
| 2018-12-18 23:48:18 | 13.6 | 6.30, −3.00, −31.20 | 31.971 | −18.371 | 31.964–31.977 | no |
| 2014-08-23 06:29:41 | 16.2 | −2.3, 5.7, 16.5 | 17.608 | −1.408 | 17.538–17.677 | no |
| 2014-06-28 02:40:05 | 12.4 | 12.0, 3.5, −10.5 | 16.325 | −3.925 | 16.245–16.404 | no |
| 2014-05-16 20:06:26 | 18.0 | 2.9, 13.4, −12.5 | 18.553 | −0.553 | 18.476–18.631 | no |
| 2010-12-25 23:24:13 | 18.1 | 18, −2, −4 | 18.547 | −0.447 | 17.909–19.203 | **yes** |
| 2009-11-21 20:53:29 | 32.1 | 3, −17, 27 | 32.047 | +0.053 | 31.317–32.783 | **yes** |
| 2009-10-08 02:57:14 | 19.2 | 14, −16, −6 | 22.091 | −2.891 | 21.278–22.907 | no |

- 8 Oct 2009 is **not** explainable by rounding: integer components allow ±0.5 each, giving ≈ 21.28–22.91 km/s against `vel` 19.2.
- Observation, not a cause: of the 8 unexplained, 3 are time-shift candidates between the 2024 archived lightcurve index and today's (2018-12-18, 2014-06-28, 2014-05-16 — inferred pairs, Claude only), 1 was unchanged, 4 were not in that index. **"Stale stored value" remains a hypothesis only** — nothing here establishes it.
- **Display rule (unchanged):** do not use the undocumented `vel`; any magnitude is labelled **"calculated from supplied components"**, carrying the components' printed precision.

**C.3 Lightcurve index (Claude only).** 969 entries · 969 PDFs · 818 `.txt` (first `.txt` 22 Mar 1998) · newest 3 Jun 2024; 78 catalogue events after that have no entry, 27 earlier events have none. Today's file names equal `YYYY.DOY.hhmmss` of the index's own peak time (969/969). All 969 index rows match a catalogue event by exact peak time, with **0 differences in the index's columns** (impact energy, location, altitude).
- **What that does and does not show:** the index's columns are **taken from the catalogue** (CNEOS says so), so agreement here is expected and verifies the join only. It does **not** verify the contents of the linked reports — CNEOS warns those reports can carry revisions not yet incorporated in the catalogue (the index comparison in §E is consistent with that for timestamps: 127 of 133 candidate pairs had the later time in the 2024 file name).

**C.4 One lightcurve read — `2023.172.193912.txt` (Claude only).** 32,088 B, `text/plain`.
- Prose header (location to 0.1°, peak intensity 4.77e+10 W/sr, total radiated energy 5.47e+11 J under a 6000 K blackbody model), then a Python-style list of `(time, intensity)`; stated columns time, intensity (W/sr). Not CSV.
- 957 points, t = −0.999 to 2.498 s; peak at t = 0.891 s, so t = 0 is not peak brightness. The header time is whole seconds. **Time reference not stated in the file — open.**
- Sampling irregular (3 ms ×550, 4 ms ×326, 6–7 ms ×77, 10 ms ×2); final row duplicated.
- **Negative values present (230 of 957); processing explanation not yet verified. Preserve them** — no clipping, no treating them as missing.
- Header degree sign is a non-UTF-8 byte (shows as �); encoding unverified.
- No velocity, altitude, uncertainty, calibration or sensor ID in the file.
- **Consistency check under an isotropic-emission assumption:** 4π × ∫I dt = 5.42e+11 J vs the stated 5.47e+11 J and catalogue `energy` 54.7 × 10¹⁰ J. This is **not** an independent validation of calibration or timing.

**C.5 Reuse — unresolved for lightcurve files.** The SSD FAQ's public-domain statement is about **ssd.jpl.nasa.gov**. The lightcurve files are on **cneos.jpl.nasa.gov**; **no CNEOS-specific reuse statement found** (not searched exhaustively). That statement is **not** extended to them. The lightcurve page itself says the data come from U.S. Government sensors, are provided for public release, are not verified or reanalysed by CNEOS, and are revised when updates arrive.
- Access note: the API answered a request made from the `cneos.jpl.nasa.gov` origin but not from a third-party page — consistent with the stated no-embedding policy.

### D. Still open (research only)
- **Reuse:** CNEOS wording for the lightcurve files.
- **Timing:** lightcurve time reference; publication delay (no first-publication time anywhere).
- **Interpretation:** the 8 unexplained `vel` cases (cause — only CNEOS could say; **contact needs Chad's go**); negative lightcurve values; report contents vs catalogue values.
- Archived **API** responses: the Archive's capture index for `fireball.api` returned an error (503) on 5 Nov — retry before concluding none exist.

### E. **Parked 5 Nov 2026** — revision matching, proposal rev 3 (research only, no code; accepted by GPT as a research proposal at rev 2, not a build specification)
[`docs/research/R2-revision-matching.md`](research/R2-revision-matching.md) — validate structure **and values** before classifying (all-or-none location, ranges, hemisphere letters, finite numbers, genuine zeros kept); compare against the **last successfully validated** response, shown with its retrieval time and any newer failed or held fetch; candidates (same-time and time-shift) acquire no identity or combined history until accepted; unresolved pairs never inflate counts; acceptance rules, thresholds and window listed as **open decisions**; separate representation changes from record changes; time-shift matches stay **review candidates** with both records kept; absent records labelled "not present in the source response retrieved on [date]". Evidence is **lightcurve-index only** (Archive capture 12 Jun 2024 vs today, 853 events): 503 unchanged, 217 differ at the same time, 133 time-shift candidates (1–9 s, inferred pairs), 64 newly listed reports. **Claude's counts; GPT reviewed the reasoning, not reproduced the counts.** Open design notes on parking (count disclosure; negative-coordinate treatment and partial acceptance) are at the top of the proposal.

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

---

## R11. FIRMS — previous-day observations arriving after midnight

**Added:** 6 Nov 2026 (thread 17), from GPT's review of the 5 Nov fires recovery, on Chad's instruction.
**Status:** research only. **No collector, schedule, query or deploy change.** An entry here authorises nothing.

**What is known (one data point):** the hub fetches FIRMS with `day_range=1`, which returns the current UTC date only (6 Nov's files hold only 6 Nov acquisition dates — checked on `raw/firms/2026-11-06T06-00Z.csv`, 396 rows). On 5 Nov the latest observation in the day's last file (23:45 retrieval) was **21:36 UTC**. That is one file on one day. It does **not** establish a fixed end-of-day gap for every day; how late each day's observations end, and how many arrive only after midnight, is unmeasured.

**Questions:**
1. Across several days, how many detections with acquisition date D first appear in files retrieved after 00:00 UTC on D+1, and until when do they keep arriving?
2. Options to investigate, each with payload size and cost measured before any choice:
   - `day_range=2` fetched once after midnight (returns D and D+1; larger payload, overlaps the next day's own fetch);
   - an **explicit previous-date query** (the API's date parameter for D, `day_range=1`) fetched after midnight — previous day only, no overlap.
3. How the daily checkpoint should word a day's end: `last_observation_at` (0.5.2) already records it per day; whether `input_status` ("current", which measures retrieval) needs a companion statement about observations.

**First gate:** from retained raw files and read-only fetches, measure late arrivals for ≥ 3 days; payload of each option; Worker CPU/memory implications against the 8 MiB guard. Report before any design.

