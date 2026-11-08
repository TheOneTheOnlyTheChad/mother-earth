# R4 — Argo ocean profiles (temperature, salinity, pressure) — first research gate

**Gate:** first gate only. **Research only** — no implementation, collector, schedule, deployment, page change, purchase or third-party contact. Written 6 Nov 2026 for Chad's review.
**Status: core T/S/P numerical feasibility verified; terms round closed (§12, REGISTER filed 8 Nov): CC BY 4.0 on the dataset's DOI record; synchronisation routes supported (rsync, AWS sync); no numerical cadence/load limit found (≠ unlimited) — not integration clearance; technical gates open.**
**Rev 8 (8 Nov 2026): terms/access review §12 — evidence packet R1 (required) + S1–S3: GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet. S4 Ifremer policy pending, not relied on. GPT accepted the scoped terms conclusion; REGISTER entry filed 8 Nov on Chad's authorisation. Terms only: still parked for building; technical gates open.**
**PARKED 6 Nov 2026 (Chad, after GPT's review) — first-gate handover, rev 2.** No implementation clearance; any next gate needs Chad's separate go.
**Independent check:** GPT independently inspected both preserved NetCDF files — sizes and full sha256 match, and the core numerical findings hold (including the corrected QC counts and error values in §3). **GPT has not reproduced** the compact payload sizes (§7), the pressure-to-depth calculation (§6) or the directory-history checks (§5); those are Claude's only.
**Rev 2 corrections (GPT review, adopted):** delayed-mode QC counts (§3); error fields described as source-supplied adjusted-value error estimates, not constant (§3); timestamp resolution per field and file (§2, §4); revision claims narrowed (§5); profile identity provisional + no silent fallback to raw (§4, §5); citation uses the general DOI (§8); volume figure dated 2024 (§7).
**Labels:** **Verified** = checked against the retrieved bytes or a named primary page · **Interpretation** = Claude's reading, open to challenge · **Open** = not yet checked.
**Out of scope:** oxygen, pH, chlorophyll and every other biogeochemical (BGC) variable — they live in separate `B…`/`S…` files and need their own calibration/adjustment assessment.

---

## 1. Samples retrieved (one float, two modes)

Float **WMO 1902040** (SOLO II, serial 8727, US Argo / Scripps; data centre AOML), chosen from the Coriolis GDAC "this week" index: a recent real-time cycle and its newest delayed-mode cycle, so both modes come from the same instrument.

| | Real-time | Delayed-mode |
|---|---|---|
| File | `R1902040_297.nc` | `D1902040_259.nc` |
| URL | `https://data-argo.ifremer.fr/dac/aoml/1902040/profiles/R1902040_297.nc` | `…/profiles/D1902040_259.nc` |
| Retrieved (UTC) | 2026-11-06 11:52:29.103 – 11:52:31.192 | 2026-11-06 11:52:31.195 – 11:52:31.715 (re-fetched twice, identical) |
| HTTP `Last-Modified` | 1 Nov 2026 13:40:15 GMT | 30 Jan 2026 23:47:33 GMT |
| Bytes | **151,076** | **107,656** |
| sha256 | `c67e5053a8c4382e2e117634814c547e08f90a41a8d468a0bf4357431eda62c0` | `3439c70201ef7478fd730c1b3ced0870f1dc8af28749e6e2a63014ee78592a32` |
| Format | NetCDF-3 classic (`CDF\x01`), Argo format 3.1 | NetCDF-3 classic, format 3.1 |

- Kept on the Mac: `~/Documents/Mother Earth/research/R4/2026-11-06/` with `PROVENANCE.md`; both files re-hashed there and identical to the in-page hash of the fetched bytes. **Not committed to the repo.**
- Source: the **Coriolis GDAC** (Ifremer), one of the two GDACs; the other is US GODAE. The Argo FAQ says they mirror the same data set.

**The two samples are different cycles** (259 vs 297, a year apart), not two versions of one profile. Cycle 259's real-time file no longer exists (§5), so a same-cycle R-vs-D comparison is not possible from the GDAC today.

## 2. File structure (verified, both files)

- **Dimensions:** `N_PROF` × `N_LEVELS` (1008 here). **One file = one cycle, but it can hold several profiles:**
  - R 297: **3 profiles** — primary (2 dbar bins, 1008 levels, 1.0–2003.9 dbar), near-surface (1 level, 0.52 dbar), secondary (1000 levels, 328–500 dbar). Each is described in `VERTICAL_SAMPLING_SCHEME`.
  - D 259: **2 profiles** — primary (1008 levels, 1.0–2003.4 dbar) and near-surface (690 levels, 0.44–200 dbar).
  - *Interpretation:* `N_PROF` and the sampling schemes vary cycle to cycle even on one float; any reader must pick the **primary** profile by its sampling scheme, not by assuming index 0 or a fixed count.
- **Per profile:** `PLATFORM_NUMBER` (WMO ID), `CYCLE_NUMBER`, `DIRECTION` (`A` ascending / `D` descending), `DATA_MODE`, `DATA_STATE_INDICATOR`, `JULD` + `JULD_QC`, `JULD_LOCATION`, `LATITUDE`/`LONGITUDE` + `POSITION_QC`, `POSITIONING_SYSTEM`, `PROFILE_<PARAM>_QC`.
- **Per level:** `PRES`, `TEMP`, `PSAL`, each with `_QC`, `_ADJUSTED`, `_ADJUSTED_QC`, `_ADJUSTED_ERROR`.
- **Provenance in the file:** `DATE_CREATION`, `DATE_UPDATE`, `HISTORY_*` (R: 2 records; D: 9), `SCIENTIFIC_CALIB_*`, global `history` and (D) the DMQC operator's ORCID.

### Units, fill values, resolution (from the variable attributes)
| Field | Unit | `_FillValue` | Resolution |
|---|---|---|---|
| `PRES` | **decibar** ("equals 0 at sea-level") | 99999.0 | 0.04 dbar |
| `TEMP` | °C, in-situ, **ITS-90** | 99999.0 | 0.001 °C |
| `PSAL` | **practical salinity** (unit string "psu") | 99999.0 | 0.0002 |
| `JULD` | days since 1950-01-01 00:00 UTC | 999999.0 | ≈ 1 s (1.1574e-05 d) in both files |
| `JULD_LOCATION` | days since 1950-01-01 00:00 UTC | 999999.0 | **60 s** (6.944e-04 d) in D 259; ≈ 1 s in R 297 |
| `LATITUDE`/`LONGITUDE` | degrees N / E | 99999.0 | — |
| QC flags, mode letters | one character | `' '` (space) | — |

- **Numerical representation ≠ documented resolution:** D 259's `JULD_LOCATION` decodes to 16:02:03, but its stated resolution is 60 s. Supplied timestamps are preserved as given; any display states the documented resolution, not the digits.
- **Missing values are the fill numbers, not blanks or zeros.** A reader must treat `99999.0` / `999999.0` as absent and a space as "no flag". Short profiles pad the remaining levels with fill (D near-surface: 318 padded levels).

## 3. Raw vs adjusted, modes, flags and errors — kept separate

**Data mode (`DATA_MODE`, per profile; verified in both files, rules from the Argo "How to use" page):**
- `R` = real time, **no adjusted values** → use `PARAM`. R 297: all three `_ADJUSTED` fields are entirely fill.
- `A` = real time **with** adjustment → use `PARAM_ADJUSTED`. (Not in our sample.)
- `D` = delayed mode → use `PARAM_ADJUSTED`. D 259: adjusted values present.
- The file prefix (`R`/`D`) follows `DATA_MODE` of the first profile (user manual §5.1.1); the mode is per profile, so a reader goes by `DATA_MODE`, not the filename.

**What adjusted means here (verified, D 259 primary profile):**
| | adjusted − raw (where both are good) |
|---|---|
| PRES | 0.000 on all 1007 levels |
| TEMP | 0.000 on all 1007 levels |
| PSAL | −0.0047 to +0.0093 (mean +0.0012) — the stated cell thermal-mass correction |
- Calibration comments (verbatim gist): pressure drift handled on board, "Additional correction was unnecessary"; "No significant temperature drift detected"; salinity: thermal-mass correction applied, "No significant salinity drift detected".
- *Interpretation:* "adjusted" means **reviewed and possibly corrected**, not necessarily different; delayed mode can confirm a value as well as change it.

**Per-value QC flags (reference table 2, user manual ch. 3):** 1 good · 2 probably good · 3 probably bad · 4 bad · 5 changed · 8 estimated · 9 missing · 0 no QC; real-time and delayed-mode meanings differ slightly (e.g. DM 4 = "Not adjustable. Adjusted data are replaced by FillValue").
- **Verified, D 259 primary profile (zero-based level indices):**
  | | valid adjusted levels | QC-4 levels | bad indices |
  |---|---:|---:|---|
  | PRES | 1,007 | 1 | 1007 |
  | TEMP | 1,007 | 1 | 1007 |
  | PSAL | 1,006 | 2 | 90, 1007 |
  The flag-4 levels keep their **raw** value (PRES 2003.36 at 1007; PSAL 35.540 at 90, 34.736 at 1007) while the **adjusted** value is fill — the manual's rule. So "raw with QC 4" and "adjusted missing" describe the same level.
- **No silent fallback:** where the mode calls for adjusted values (`A`, `D`) and an adjusted value is missing or rejected, the level is **absent** — a reader must never substitute the raw value.
- R 297: primary profile all flags 1; the **secondary** profile has **37 pressure levels flagged 4** (PROFILE_PRES_QC `B`).
- **Profile-level grade** (`PROFILE_<PARAM>_QC`, table 2a): A = 100 % good levels … F = 0 %; computed from the adjusted flags when present. R 297 primary A/A/A; D 259 primary B/B/B (pressure and temperature one QC-4 level each, salinity two). It summarises a profile; it is not a per-value flag.

**Supplied error (`<PARAM>_ADJUSTED_ERROR`) — source-supplied adjusted-value error estimates (verified values, D 259 primary):**
- PRES **2.40 dbar** on all 1,007 adjusted levels; TEMP **0.00224 °C** on all 1,007; PSAL **0.010 on 1,005 levels and 0.010835 on one** — salinity is **not constant**. R 297: none (no adjustment).
- The file's own calibration comments say what they include: pressure and temperature errors = **sensor accuracy + resolution**; salinity error = **max(0.01, OWC + thermal-mass correction + resolution)**; the thermal-mass coefficient line adds "error equal to the adjustment".
- *Interpretation:* these are error estimates for the **adjusted values** as supplied by the source — not uncertainty in the correction alone, and not per-measurement noise. **Open:** the confidence level (1σ or otherwise) is not stated; don't present them as confidence intervals until verified.

**State of processing (`DATA_STATE_INDICATOR`, table 6):** R 297 `2B` (automated QC at the national centre); D 259 `2C` ("reviewed by PIs").

## 4. Time, position, identity, direction (verified)

| | R 297 | D 259 |
|---|---|---|
| Profile time `JULD` (UTC) | 2026-11-01 11:37:34, `JULD_QC` 1 | 2025-10-20 15:57:39, QC 1 |
| Position time `JULD_LOCATION` | 11:43:00 | 16:02:03 |
| Position | 33.82696° S, 30.70324° E, `POSITION_QC` 1, GPS | 32.72392° S, 31.97556° E, QC 1, GPS |
| Direction | `A` (ascending) on all profiles | `A` |
| Cycle / mission | 297 / config mission 7 | 259 |

- **The profile time and the position time differ** (5–6 minutes here): the position is a GPS fix at the surface after the ascent. *Interpretation:* the position marks **where the float surfaced after the profile**, not where each depth was measured, and **not where the float is now** — it has since sunk and drifted (~10-day cycle, parking ~1 km, per argo.ucsd.edu).
- `POSITION_QC`/`JULD_QC` can be **8 = estimated** (e.g. under-ice profiles with interpolated positions, per the "How to use" page) — any later display must carry these flags.
- **Identity (provisional):** `PLATFORM_NUMBER` + `CYCLE_NUMBER` + `DIRECTION` are useful identity fields, carried inside the file; they match the filename here, but the file name is not the record. The `N_PROF` index and the sampling scheme are **selection evidence only** until their stability across revisions is checked (Open).

## 5. Revisions and replacement (verified behaviour, one float)

- **Snapshot, not an observed event:** `R1902040_259.nc` → **404**, `D1902040_259.nc` → 200; `R1902040_260.nc` → 200, `D…_260` → 404 (HEAD requests, 6 Nov 12:08 UTC). This **supports** the documented pattern that a D file replaces the R file for its cycle, but no replacement event was observed. The float's folder holds 253 D files (up to cycle 259) and 38 R files (cycles 260–297).
- **Timing for this float:** cycle 259 observed 20 Oct 2025 → file created 19 Nov 2025 → DMQC 30 Jan 2026 20:31 UTC (file history) → GDAC `Last-Modified` 23:47 UTC. About **3.4 months** to delayed mode — faster than the "usually 1–2 years" on the Argo "How to use" page and the FAQ's "about 1 year" for salinity. One float, one cycle — not a rule.
- **Later processing/publication, not proven rewriting:** `R1902040_260.nc` (an Oct–Nov 2025 cycle) has `Last-Modified` 19 Dec 2025; R 296 (observed 22 Oct 2026) shows 1 Nov 2026 in the folder listing, the same day as R 297. A modification date after the observation date establishes later processing or publication — **not** that values changed. Without an earlier copy, whether these files were rewritten or their values changed is **unresolved**. The FAQ says D files may be modified after creation and the data set "is always changing".
- **Directory listing times are server-local** (listing shows 14:40 for a file whose HTTP `Last-Modified` is 13:40 GMT).
- *Interpretation:* an observation's identity rests on (float, cycle, direction), with the profile index provisional (§4); its **freshness is `JULD`**, not the file's modification time or the download time. A revision is detected by `DATA_MODE`, `DATE_UPDATE`, the `HISTORY_*` records or a content hash — **not** by filename. **Open:** the revision pattern itself (needs repeated copies); how removals/greylisting are signalled (manual ch. 7 lists a removal file and greylist without detail), and whether the GDAC index `date_update` column always tracks `DATE_UPDATE`.

## 6. Pressure is not depth

- `PRES` is sea pressure in **decibar**, 0 at sea level. 1 dbar ≈ 1 m only roughly.
- **Proposed conversion (not adopted):** UNESCO 1983 / Fofonoff & Millard depth formula, needing latitude; TEOS-10 `gsw.z_from_p` is the modern equivalent. At the R 297 latitude (33.8° S): 500 dbar ≈ **495.8 m**, 1000 dbar ≈ **990.5 m**, 2003.9 dbar ≈ **1980.1 m** (Claude's arithmetic). Assumptions: standard ocean, no dynamic-height correction. Any display would label values "pressure (dbar)" or "approx. depth (m), computed".

## 7. Payload and processing (measured)

- **Per profile file:** 107–151 KB raw NetCDF-3; gzip 24.1 KB (D) / 22.8 KB (R) (`CompressionStream`, in-page).
- **Compact extraction** (primary profile, best-available values per `DATA_MODE`, pressure/temperature/salinity + 3 flags per level, JSON): **29.5–29.6 KB, ~8 KB gzipped** (1007–1008 levels). Done with `scipy.io.netcdf_file` on the Mac in under a second.
- **Finding profiles:** GDAC index files — weekly `ar_index_this_week_prof.txt` **931 KB** (10,268 profiles this week); global `ar_index_global_prof.txt.gz` **56 MB** (304 MB unzipped). Columns: file, date, latitude, longitude, ocean, profiler type, institution, date_update.
- *Interpretation:* processing needs a NetCDF-3 reader, profile selection by sampling scheme, fill/flag handling and mode-dependent field choice — modest per file; the volume is what would need measuring — argo.ucsd.edu gives ~13,000 profiles/month **as of 2024**; that is the source's 2024 figure, not measured 2026 throughput, and current collection volume is **unmeasured**. The 10,268 profiles in this week's index are one index snapshot, not a rate. **No infrastructure choice made.**

## 8. Reuse, attribution, access (primary sources)
> **Historical (6 Nov). The terms and access statements below are superseded by §12 (8 Nov); they are not additional open requirements.**

**Explicit:**
- argo.ucsd.edu "About": "all data are freely and openly available".
- "Acknowledging Argo": "Argo data are freely available without restriction"; the source **requests** acknowledgment in a publication or product with the standard sentence (crediting the International Argo Program, its national programs and the Global Ocean Observing System) plus an Argo DOI. This is the source's acknowledgment request — not presented here as a legal requirement.
- **DOI for this sample:** these are live GDAC downloads, so the **general Argo DOI** `https://doi.org/10.17882/42182` applies. A monthly-snapshot DOI is appropriate only when that specific archived snapshot was used or verified.
- Coriolis GDAC `readme_before_using_the_data.txt` (2017): same acknowledgment and DOI rule; "proper and appropriate use is the responsibility of the user"; real-time data get only coarse automated QC.
- "How to use": for sensitive work use delayed-mode data with QC 1 and small errors; R files not recommended for sensitive work.

**Not found (Open):**
- No **automated-access or rate-limit policy** for the GDAC HTTPS server; the FAQ mentions mirrors and points to index files, the Argovis API and the Euro-Argo selection tool, but sets no limits.
- No explicit statement on **redistributing derived products** beyond the acknowledgment request ("without restriction" is positive evidence, not a full licence text).

**Project practice (recommended, not required by any source):** carry the acknowledgment sentence + the general DOI (or a snapshot DOI only if a snapshot is used), the float WMO, cycle, `DATA_MODE` and retrieval time with any shown profile.

## 9. What Mother Earth could honestly show (research direction, not a UI design)

- **A dated profile marker** at the surfacing position, labelled with its profile time and mode (`real-time` / `delayed-mode`), opening temperature and salinity against **pressure** (or computed depth, labelled) through the water column, with flagged levels marked or excluded.
- **Real-time values** labelled as automated-QC only; **delayed-mode values** as reviewed, with the supplied adjustment uncertainty once its meaning is confirmed.

**Unsupported / not to be shown:**
- The float's **current** position, or a continuous track between surfacings.
- Any **cell-wide** ocean condition from one or a few profiles; empty cells are "no profile", not "no ocean data".
- "How unusual" comparisons — no compatible climatology chosen.
- BGC variables (separate gate).

## 10. Open questions (each needs Chad's separate go; no further fetching in the rev-2 pass)
1. ~~**Automated-access terms** for the GDAC servers (and whether to use the DOI monthly snapshots instead).~~ *Historical; superseded by §12 (8 Nov): synchronisation routes supported, no numerical limit found; no route selected.*
2. **Revisions:** keep repeated copies to see whether and how values change; `DATA_MODE`/`DATE_UPDATE`/hash tracking; removal/greylist handling.
3. **Identity stability:** whether `N_PROF` index and sampling scheme stay stable across revisions.
4. **Error interpretation:** confidence level of `_ADJUSTED_ERROR`; whether QC 2/3 levels should be shown.
5. **Scale:** current profiles per day, index-diff size, processing per profile; real-time → delayed-mode lag across many floats (one float seen).
6. A compatible baseline before any comparison.
7. Independent reproduction of the compact payload sizes, pressure-to-depth calculation and directory-history checks.

## 11. Follow-up investigation of the open questions (rev 3, 6 Nov 2026, Chad's go)
Research only; read-only fetches from the Coriolis GDAC and primary documents (13:45–13:56 UTC). **Rev 4 (6 Nov, GPT review):** labels corrected below. **GPT has not independently reproduced the global-index totals or the additional profile-file counts — those are Claude's only.**
**Evidence preservation (honest gap):** the global index (59,012,910 B, Last-Modified 13:25:00 GMT, header date 20261106132415), the weekly index and the ten extra profile files were **streamed and analysed in the browser and not saved; no hashes were recorded**. **These figures must not be used for infrastructure sizing** until they are recomputed from a preserved, hashed copy of the index with a saved script.

### 11.1 Access terms
> **Historical (6 Nov); superseded by §12 (8 Nov).**
- **Verified (Registry of Open Data on AWS, Euro-Argo managed):** the GDAC copy on S3 (`argo-gdac-sandbox`, eu-west-3, no sign-in) is listed as "Open data, there are no restrictions on the use of this data", licence **CC BY 4.0** (so its attribution condition applies to that copy), updated daily, with a citation including "accessed on DATE" and DOI `10.17882/42182`. **This applies to the AWS copy only; it establishes nothing about Coriolis's automated-access or request limits.**
- **Coriolis HTTPS server:** no terms page, rate limit or `robots.txt` (404) found; the 2017 readme carries only the acknowledgment request.
- *Interpretation:* reuse is supported by three separate statements (argo.ucsd.edu, the Coriolis readme, and — for the AWS copy — CC BY 4.0); each distribution's terms stay separate. **Still open:** an explicit automated-access/rate policy for `data-argo.ifremer.fr` and US GODAE; the SEANOE landing page could not be opened with my tools. Not integration clearance. *(Superseded 8 Nov by §12.)*

### 11.2 Error interpretation
- **Verified (Argo QC manual for CTD and trajectory data, v3.9, Feb 2025, doi 10.13155/33951):**
  - PRES: 2.4 dbar "is the recommended error to quote", the manufacturer's quoted sensor accuracy.
  - TEMP: can be the manufacturer's quoted accuracy at deployment, 0.002 °C.
  - PSAL: maximum of the combined adjustment uncertainties (root-sum-square of each adjustment's error) and **0.01**; if no adjustment, maximum of adjustment uncertainty and 0.01; the uncertainties listed include sensor-drift and thermal-mass adjustments.
- This matches the sample: PSAL 0.010 floor on 1,005 levels, 0.010835 where the combined term exceeds it.
- **Not found:** any stated confidence level or multiplier (1σ, 2σ) for the supplied errors. **Remains open** — do not present as confidence intervals.
- Timing in the same manual: drift-adjusted delayed-mode salinity is available "6+ months after a profile" (12-month default evaluation window); delayed-mode files "may be revised" when new data arrive, and changes "may be made … at any time".

### 11.3 Scale (Coriolis global profile index, retrieved 13:51:51–13:52:19 UTC)
| | |
|---|---|
| Index file | `ar_index_global_prof.txt.gz`, 59,012,910 B, Last-Modified 6 Nov 13:25:00 GMT, header "Date of update 20261106132415"; streamed and parsed in the browser in ~28 s |
| Profiles listed | **3,433,783** core profile files: **2,957,449 D** · **476,334 R**; 19,383 without an observation date |
| Profiles currently indexed per observation date, Oct 2026 | **458–527 per day** (≈ 14,900 for 1–31 Oct) — a count of **files indexed today** by observation date, **not a daily arrival rate**; recent dates are still filling (6 Nov: 181) |
| Files whose **latest** `date_update` is 7 October–6 November | **55,119** files (39,414 of them observed before Oct 2026) — **not a count of update events**: a file updated several times shows only its latest date, and earlier updates are invisible |
| Weekly index | 10,058 profiles at 13:24 UTC (10,268 at ~11:45) — a rolling window, not a fixed weekly count: 6,461 R · 3,597 D; 306 descending |
| Observation → latest indexed update, surviving R files in the weekly index, filtered to 0–10 days (n = 3,705) | median **2.9 h**, 10th pct 0.85 h, 90th pct 237 h — **not first-publication latency**: it measures to the latest update of files still present as R; **first availability remains unknown** |
- *Interpretation (narrowed):* roughly **500 profiles per observation day** are indexed for October, and **at least 55,119 files** had their latest update in the window 7 October–6 November, most of them older profiles. Actual arrival rates and update-event counts are **unmeasured**. An incremental reader would follow `date_update` in the index rather than file listings, but any sizing waits for preserved inputs (above).

### 11.4 Revisions and identity stability (float 1902040: 11 files requested, **10 read** — `D1902040_001.nc` returned 404; 6 D + 4 R; read in the browser with a minimal NetCDF-3 reader; files not preserved or hashed)
| Files | `N_PROF` | Profiles (by sampling scheme) | Config mission |
|---|---|---|---|
| D 050, 100, 150, 200, 258, 259 | 2 | Primary · Near-surface | 6 (≤ 200), 7 (258–259) |
| R 260 | 2 | Primary · Near-surface | 7 |
| R 280, 296, 297 | 3 | Primary · Near-surface · **Secondary** | 7 |
- The **primary profile was index 0 in every file read**, but the number of profiles changed (a secondary profile appears in recent R files, same config mission). *Interpretation:* select the primary profile by its sampling scheme; whether the secondary profile survives into the D files is **unknown** until one of these cycles reaches delayed mode.
- `N_LEVELS` varies by cycle (1007–1011).
- **File dates vs observation dates (in-file):** R 260 observed 30 Oct 2025, `DATE_CREATION` = `DATE_UPDATE` = 19 Dec 2025; R 280 observed 16 May 2026, created 27 May 2026; R 296 observed 22 Oct 2026, created 1 Nov 2026 13:21:53 (two seconds before R 297). Creation dates later than observation show later processing/publication; whether earlier versions existed or values changed is **unresolved without earlier copies**.
- **Baseline for a later revision check:** the preserved `R1902040_297.nc` (sha256 `c67e5053…`) is the reference; re-fetching it after it changes, or after it becomes `D1902040_297.nc`, would show real value changes. No schedule set up.

### 11.5 What stays open after this pass
1. ~~Explicit automated-access/rate terms for the GDAC servers.~~ *Historical; superseded by §12 (8 Nov).*
2. Confidence level of `_ADJUSTED_ERROR`.
3. Revision pattern in values (needs repeated copies; the R 297 baseline exists).
4. Whether recent R-file structure (3 profiles) carries into delayed mode.
5. Arrival rates, update events and longer-term volume — recompute from a preserved, hashed index with a saved script before any sizing.
6. Independent reproduction of §11.3–§11.4.

## 12. Terms and access review (rev 7, 8 Nov 2026; Chad's go: bounded, read-only, R4 only)
**Scope:** only the existing terms/access questions (§8 "Not found", §10.1, §11.1, §11.5.1). No new sampling, no data files fetched, no provider contact, no route selection, no implementation, resources or production change. R2, R3 and R6 not touched. **Terms clarification alone does not clear R4 for building.** The non-terms gates (§11.5.2–6, §10.6) and all parked/stopped decisions are unchanged.
**Rev 6 (GPT's review of rev 5 at `5b33a52`, adopted):** automated access is evidenced (rsync, AWS sync); only a numerical cadence/load limit is unfound (§12.2). Licence scope is reassessed through SEANOE's link to the GDAC; missing per-file wording is not a separate blocker (§12.3). Sextant fields corrected (§12.1 T2). Attribution follows CC BY 4.0 in full (§12.6). Evidence status per page now distinguishes GPT's reading from Chad's required confirmation (§12.1).
**Rev 7–8 (evidence packet, 8 Nov 2026):** R1 (required) and S1–S3 filed below exactly as given. GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet. Rev 8 corrects rev 7's attribution of the packet to Chad's own reading; **S4 (Ifremer policy) remains pending and unverified** (§12.4). Where the packet itself gave a summary, it is labelled as one.
**Evidence status labels:** *Claude (fetch summary)* = read with Claude's web-fetch tool, which returns a summary with quotations, not the raw page · *GPT (read)* = GPT independently inspected the official page, 8 Nov 2026 · *GPT extraction (packet)* = the operative text GPT independently read/extracted; Chad delegated extraction and relayed the packet (he did not personally inspect the pages). **REGISTER entry filed 8 Nov 2026 (§12.7).**

### 12.1 What was read (official pages)
| # | Page (owner) | What it says on terms/access | Applies to | Evidence status |
|---|---|---|---|---|
| T1 | SEANOE DOI landing page, [doi 10.17882/42182](https://seanoe.org/data/00311/42182) (SEANOE / Ifremer) | Licence section: the CC BY icon linking to `creativecommons.org/licenses/by/4.0/` (icon + link, no licence wording). Files "Open access". Acknowledgment requested "preferably with the DOI", standard sentence "These data were collected and made freely available by the international Argo project and the national programs that contribute to it." Citation form "Argo (2026). Argo float data and metadata from Global Data Assembly Centre (Argo GDAC). SEANOE." **Links `data-argo.ifremer.fr` as additional access to the dataset** (GPT; Claude's summary also lists a GDAC site among the access routes). No numerical rate or cadence limit. | The GDAC dataset, incl. the access routes it links (§12.3) | Claude (fetch summary) · GPT (read) · **GPT extraction (packet R1), 8 Nov** |
| T2 | Ifremer catalogue (Sextant) ISO record, [3df904de…](https://sextant.ifremer.fr/geonetwork/srv/api/records/3df904de-e47d-4bf9-85a0-7c0942aff8b6), revised 18 Dec 2025 | **Access constraints: "Other restrictions"** · **Other constraints: "No limitations on public access"** · **Use constraints: empty** (field pairing as rendered, resolved by GPT; rev 5 wrongly said access constraints were empty). **Use limitation (kept separately):** the acknowledgment sentence, and "A user of Argo data is expected to read and understand this manual" and the NetCDF attribute documentation "as these contain essential information about data quality and accuracy". Distribution links include GDAC `https://data-argo.ifremer.fr/`, `ftp://ftp.ifremer.fr/ifremer/argo/`, Ifremer ERDDAP, the DOI. | The GDAC dataset as catalogued by Ifremer | Claude (fetch summary) · GPT (read, field pairing) · **GPT extraction (packet S1), 8 Nov** (field values verbatim; use-limitation paragraph given as a summary) |
| T3 | Argo Data Management, [Data Access](https://www.argodatamgt.org/DataAccess.html) | **Explicitly offers Ifremer rsync and AWS synchronisation, with examples for floats and for index files** (GPT). No numerical rate or cadence limit found. | Access routes (programme guidance) | GPT (read) · **GPT extraction (packet S2), 8 Nov** · Claude could not open it (tool allowlist) |
| T4 | Argo, [Data from GDACs](https://argo.ucsd.edu/?p=1826) | "For users interested in using the official Argo NetCDF files, the GDACs should be the route to access Argo data." rsync server `vdmzrs.ifremer.fr`, module `argo/`, examples for one float and the whole `dac` folder. Terms text only "Please make sure to cite Argo data properly." | Access routes | Claude (fetch summary) |
| T5 | US GODAE Argo page and its linked [disclaimer](https://usgodae.org/disclaimer.html) | "All information on this site is public domain and may be distributed or copied unless otherwise specified." The following sentence requests appropriate credits (summary). **The exception "unless otherwise specified" is preserved: this general statement is not used to override dataset-specific terms** (T1, T2). No numerical rate or cadence limit reported. | The US GODAE site, within the disclaimer's own exception | GPT (read) · **GPT extraction (packet S3), 8 Nov** · Claude could not open it (tool allowlist) |
| T6 | Ifremer data-dissemination policy, ref. DG/2023.0550, 29 Dec 2023. **URL correction (GPT, 8 Nov):** the URL recorded in rev 5/6 returns 404; the file in Ifremer's directory <https://data-sismer.ifremer.fr/rda_wcs_coretrustseal/> is named `R2-D1-Instruction PDG 2023-0550 Politique de diffusion des données.pdf`. GPT's download stalled and the viewer exposed no readable text. (Claude's fetch tool returned a summary for the old URL on 8 Nov; its source copy is unknown, so it is not evidence of the live file.) | **Provisional wording:** access and reuse "libres et gratuits"; reuse "quelle que soit la finalité d'usage"; "une obligation de mention de la source et de la date de dernière mise à jour"; access "dans les limites des possibilités techniques de l'administration"; unvalidated / unprocessed data outside the open-data scope. | Ifremer public data generally; **application to Argo GDAC files, and to real-time files in particular, is open** (§12.4) | Claude (fetch summary) only. **Unverified — S4 pending.** Not to be filed as verified. |
| T7 | [Registry of Open Data on AWS](https://registry.opendata.aws/argo-gdac-marinedata/) | "Open data, there are no restrictions on the use of this data"; CC BY 4.0; updated daily; managed by Euro-Argo; bucket `argo-gdac-sandbox` (eu-west-3). | The AWS copy | Claude (fetch summary, 6 + 8 Nov) |
| T8 | [IOC Resolution XX-6](https://argo.ucsd.edu/wp-content/uploads/sites/361/2021/09/IOC-ASSEMBLY-RESOLUTION-XX-6.pdf), [EC-XLI.4](https://argo.ucsd.edu/wp-content/uploads/sites/361/2024/10/Resolution_EC-XLI_4-en.pdf) | Data "freely available in real-time and delayed mode" (XX-6); EEZ guideline with an exception for data of direct significance to resource exploration/exploitation (EC-XLI.4). | Obligations on implementers and states, not conditions on GDAC users (Interpretation) | Claude (fetch summary); context only |
| T9 | [Euro-Argo data selection website policies](https://euro-argo.eu/PoliciesEADS) | CC BY 4.0 and a personal-use right for that website's content. | The selection website only, not the GDAC; not a route considered | Claude (fetch summary); context only |

Previously read and unchanged: Coriolis `readme_before_using_the_data.txt` (2017) and argo.ucsd.edu "Acknowledging Argo" (§8).

### 12.2 Automated access
- **Supported automated access has evidence.** The programme's Data Access page offers Ifremer rsync and AWS synchronisation, with examples for floats and for index files (T3, GPT). argo.ucsd.edu repeats the rsync route and names the GDACs as the route for official files (T4).
- **Narrower open question:** **no numerical rate, cadence or load limit was found in the pages inspected** on 8 Nov 2026: SEANOE DOI landing (T1), Ifremer Sextant record (T2), Argo Data Management Data Access (T3; its words: "The synchronization service is available from Ifremer 'rsync' and from 'aws s3 sync'."), argo.ucsd.edu Data from GDACs (T4), US GODAE Argo page and disclaimer (T5), Ifremer policy DG/2023.0550 (T6, unverified; its provisional "technical capacity" line would not be a limit), AWS registry (T7). Earlier: Coriolis readme (2017) and the absent `robots.txt` (6 Nov, §11.1).
- Which limits apply depends on the route a later design proposes; **no route is selected here.** Any later proposal states its cadence and load, and records that no numerical limit was found in these pages on this date.

### 12.3 Licence scope
- **Assessment (Interpretation, open to challenge):** the CC BY 4.0 licence is attached to the **dataset** at its DOI record (T1). The same record links `data-argo.ifremer.fr` as additional access to that dataset, and Ifremer's catalogue record for the dataset lists the same server (T2). So the live GDAC files are a documented access route to the licensed dataset. **A licence need not be embedded in every NetCDF file, so missing per-file wording is not, by itself, a separate licensing blocker and does not call for switching routes.** (Rev 5's blocker 2 is withdrawn.)
- **Scope uncertainty that remains explicit:**
  - SEANOE's Licence section links to `https://creativecommons.org/licenses/by/4.0/` (R1a, confirmed). The page gives no licence wording beyond that link.
  - Real-time (R) files on the live server change daily. Whether the record's licence statement is meant to cover the live, changing collection as well as the DOI snapshots is **not stated in words**. The record's additional-access link to `https://data-argo.ifremer.fr/` (R1c, confirmed) is the evidence that it does. No statement read contradicts it.
  - The US GODAE disclaimer's general public-domain statement (T5) is **not** used to override the dataset's CC BY terms; its scope and exceptions are preserved separately.

### 12.4 Ifremer policy (T6): provisional
- **S4 pending.** The recorded URL is wrong (404; corrected filename in T6), and no readable text of the file has been obtained (GPT's download stalled). Its wording, and whether it applies to the Argo GDAC files, stay **provisional**; the French quotations in T6 are **not** filed as verified.
- **Real-time files:** Claude's unverified fetch summary alleged this exclusion. Its wording and applicability are unestablished; this review does not rely on it. (Automated QC alone would not settle what such a policy means by "unvalidated" either.) The licence evidence is T1.

### 12.5 Evidence packet (8 Nov 2026)
GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet.
**Required licence evidence:**
- **R1. SEANOE** <https://www.seanoe.org/data/00311/42182/>, checked 8 Nov 2026 (GPT):
  - (a) the Licence section links to `https://creativecommons.org/licenses/by/4.0/`;
  - (b) acknowledgment sentence: "These data were collected and made freely available by the international Argo project and the national programs that contribute to it.";
  - (c) the dataset record's additional-access section contains a GDAC link targeting `https://data-argo.ifremer.fr/`.

**Supplementary policy evidence:**
- **S1. Sextant** <https://sextant.ifremer.fr/geonetwork/srv/api/records/3df904de-e47d-4bf9-85a0-7c0942aff8b6>, independently inspected: Access constraints "Other restrictions"; Other constraints "No limitations on public access"; Use constraints empty. *Summary, not verbatim:* the separate use limitations request acknowledgment and require users to understand the manual and the NetCDF attribute documentation.
- **S2. Data Access** <https://www.argodatamgt.org/DataAccess.html>: "The synchronization service is available from Ifremer 'rsync' and from 'aws s3 sync'." The page supplies examples for individual floats and index files (summary).
- **S3. US GODAE disclaimer** <https://usgodae.org/disclaimer.html>: "All information on this site is public domain and may be distributed or copied unless otherwise specified." The following sentence requests appropriate credits (summary). The exception is preserved; not used to override dataset-specific terms.
- **S4. Ifremer policy DG/2023.0550: PENDING, unverified.** Corrected location in T6; no readable text obtained yet.

### 12.6 REGISTER entry (filed 8 Nov 2026 in `REGISTER.md`; S4 pending, not relied on)
```
## Argo GDAC — core profile files (T/S/P), Coriolis GDAC, dataset DOI 10.17882/42182 — research only, not on the page
- **Read:** 8 Nov 2026 — evidence R1, S1–S3: GPT independently read/extracted the evidence; Chad delegated extraction and relayed the packet. Claude: web-fetch summaries (supporting only). Pages: SEANOE DOI landing https://www.seanoe.org/data/00311/42182/; Ifremer Sextant ISO record 3df904de-e47d-4bf9-85a0-7c0942aff8b6; Argo Data Management Data Access https://www.argodatamgt.org/DataAccess.html; argo.ucsd.edu Data from GDACs; US GODAE disclaimer https://usgodae.org/disclaimer.html; AWS Registry. Ifremer policy DG/2023.0550: pending, unverified.
- **Licence (SEANOE DOI record):** the Licence section links to https://creativecommons.org/licenses/by/4.0/ (CC BY 4.0).
- **Licence scope (Interpretation, labelled):** the licence is on the dataset's DOI record, whose additional-access section links https://data-argo.ifremer.fr/ (the GDAC). Not embedded per file (not required). Whether it is meant for the live, changing collection as well as the DOI snapshots is not stated in words; the record's link to the live server is the evidence.
- **Access (Ifremer Sextant):** Access constraints "Other restrictions"; Other constraints "No limitations on public access"; Use constraints empty.
- **Use limitation (Ifremer Sextant, summary):** acknowledgment requested; users must understand the manual and the NetCDF attribute documentation.
- **Automated access (verbatim, Argo Data Management):** "The synchronization service is available from Ifremer 'rsync' and from 'aws s3 sync'." Examples for floats and index files. No numerical rate/cadence/load limit found in the pages inspected (SEANOE, Sextant, Data Access, Data from GDACs, US GODAE disclaimer, AWS Registry; 8 Nov 2026). Any collector states its own cadence and load. No route selected.
- **US GODAE (verbatim):** "All information on this site is public domain and may be distributed or copied unless otherwise specified." Credits requested. Exception preserved; not used to override the dataset's CC BY terms.
- **Ifremer policy DG/2023.0550:** PENDING — not verified; not relied on.
- **Attribution (CC BY 4.0 + the source's request), with any shown profile:**
  - credit (verbatim, SEANOE): "These data were collected and made freely available by the international Argo project and the national programs that contribute to it.";
  - licence: CC BY 4.0, linked to https://creativecommons.org/licenses/by/4.0/;
  - dataset: https://doi.org/10.17882/42182 (or the monthly snapshot DOI if a snapshot is used);
  - modifications, where applicable (e.g. "Primary profile selected and reformatted by Mother Earth; values not altered" — wording to match what is done);
  - per profile: float WMO, cycle, DATA_MODE, the file's DATE_UPDATE and retrieval time.
- **Coverage statement:** none filed (R4 non-terms gates open: revisions, identity, error confidence, scale, baseline).
- **Filed:** 8 Nov 2026 — GPT accepted the scoped terms conclusion (rev 7 review); Chad authorised filing ("Approve: make these documentation corrections and file the corrected Argo REGISTER entry"). Acceptance covers the terms conclusion only, not a route, collector or build.
- **Status:** ⛔ research only; terms clarified, NOT cleared for building. R4 technical gates open (revisions, identity, error confidence, scale, baseline). No numerical limit found ≠ unlimited access.
- **Commercial use:** with attribution — CC BY 4.0 on the dataset (DOI record), which links the GDAC server as an access route.
```

### 12.7 Review and filing
- **GPT (8 Nov 2026, rev 7 text):** accepted the dataset-level CC BY evidence and GDAC linkage, the supported synchronisation routes, the narrowly stated absence of a numerical limit, the attribution plan, and the preservation of all non-terms gates. S4 is supplementary and not needed while explicitly not relied on. Two corrections required and made in rev 8 (provenance wording; the unverified Ifremer exclusion).
- **Filed** in `REGISTER.md` on Chad's authorisation, 8 Nov 2026. This accepts the scoped research conclusion only, not a route, collector or build. R2, R3, R6 untouched.

## Sources
- [Argo — About](https://argo.ucsd.edu/about/) · [How to use Argo files](https://argo.ucsd.edu/data/how-to-use-argo-files/) · [Data FAQ](https://argo.ucsd.edu/data/data-faq/) · [Acknowledging Argo](https://argo.ucsd.edu/data/acknowledging-argo/)
- [Argo QC manual for CTD and trajectory data v3.9](https://doi.org/10.13155/33951) · [Registry of Open Data on AWS — Argo GDAC](https://registry.opendata.aws/argo-gdac-marinedata/)
- [Argo user manual — reference tables](https://oneargo.github.io/argo-format-user-manual/chapter3.html) · [Data access / file naming](https://oneargo.github.io/argo-format-user-manual/chapter4.html) · [DAC–GDAC data management](https://oneargo.github.io/argo-format-user-manual/chapter6.html)
- Terms pass, 8 Nov 2026: [SEANOE DOI 10.17882/42182](https://seanoe.org/data/00311/42182) · [Ifremer Sextant record](https://sextant.ifremer.fr/geonetwork/srv/api/records/3df904de-e47d-4bf9-85a0-7c0942aff8b6) · Ifremer DG/2023.0550 (pending; corrected filename `R2-D1-Instruction PDG 2023-0550 Politique de diffusion des données.pdf` in <https://data-sismer.ifremer.fr/rda_wcs_coretrustseal/>) · [Data from GDACs](https://argo.ucsd.edu/?p=1826) · [Data Access](https://www.argodatamgt.org/DataAccess.html) · [US GODAE disclaimer](https://usgodae.org/disclaimer.html) · [IOC XX-6](https://argo.ucsd.edu/wp-content/uploads/sites/361/2021/09/IOC-ASSEMBLY-RESOLUTION-XX-6.pdf) · [IOC EC-XLI.4](https://argo.ucsd.edu/wp-content/uploads/sites/361/2024/10/Resolution_EC-XLI_4-en.pdf) · [Euro-Argo selection policies](https://euro-argo.eu/PoliciesEADS)
- Coriolis GDAC (browser pane, 6 Nov 2026 11:45–12:09 UTC): [readme_before_using_the_data.txt](https://data-argo.ifremer.fr/readme_before_using_the_data.txt) · [ar_index_this_week_prof.txt](https://data-argo.ifremer.fr/ar_index_this_week_prof.txt) · [float 1902040](https://data-argo.ifremer.fr/dac/aoml/1902040/)
