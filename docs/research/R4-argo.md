# R4 — Argo ocean profiles (temperature, salinity, pressure) — first research gate

**Gate:** first gate only. **Research only** — no implementation, collector, schedule, deployment, page change, purchase or third-party contact. Written 6 Nov 2026 for Chad's review.
**Status: numerical feasibility verified for core T/S/P; reuse terms explicit; automated-access terms unresolved — not integration clearance.**
**Labels:** **Verified** = checked by Claude against the retrieved bytes or a named primary page · **Interpretation** = Claude's reading, open to challenge · **Open** = not yet checked. Nothing here is independently reproduced yet.
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
| `JULD`, `JULD_LOCATION` | days since 1950-01-01 00:00 UTC | 999999.0 | 1 s |
| `LATITUDE`/`LONGITUDE` | degrees N / E | 99999.0 | — |
| QC flags, mode letters | one character | `' '` (space) | — |

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
- **Verified:** in D 259 the flag-4 levels keep their **raw** value (e.g. PRES 2003.36, PSAL 35.54 at level 90) while the **adjusted** value is fill — exactly the manual's rule. So "raw with QC 4" and "adjusted missing" describe the same level.
- R 297: primary profile all flags 1; the **secondary** profile has **37 pressure levels flagged 4** (PROFILE_PRES_QC `B`).
- **Profile-level grade** (`PROFILE_<PARAM>_QC`, table 2a): A = 100 % good levels … F = 0 %; computed from the adjusted flags when present. R 297 primary A/A/A; D 259 primary B/B/B (one bad level each). It summarises a profile; it is not a per-value flag.

**Supplied error (`<PARAM>_ADJUSTED_ERROR`) — verified values, meaning partly open:**
- D 259: PRES **2.40 dbar**, TEMP **0.00224 °C**, PSAL **0.010** (0.0108 on some levels) — **one constant value per parameter**, on every adjusted level. R 297: none (no adjustment).
- Manual wording: "the delayed mode adjustment uncertainty". The Coriolis readme: users "should include the supplied error estimates" for delayed-mode salinity.
- *Interpretation:* these are **adjustment uncertainties set during delayed-mode review**, not per-measurement noise and not a stated confidence interval. **Open:** the confidence level (1σ or otherwise) — not found stated; don't present as intervals until verified.

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
- **Identity** = `PLATFORM_NUMBER` + `CYCLE_NUMBER` + `DIRECTION` (+ which `N_PROF` profile). Both files carry this inside; it matches the filename here, but the file name is not the record.

## 5. Revisions and replacement (verified behaviour, one float)

- When the delayed-mode file for a cycle exists, the **real-time file for that cycle is gone**: `R1902040_259.nc` → **404**, `D1902040_259.nc` → 200; `R1902040_260.nc` → 200, `D…_260` → 404 (HEAD requests, 6 Nov 12:08 UTC). The float's folder holds 253 D files (up to cycle 259) and 38 R files (cycles 260–297).
- **Timing for this float:** cycle 259 observed 20 Oct 2025 → file created 19 Nov 2025 → DMQC 30 Jan 2026 20:31 UTC (file history) → GDAC `Last-Modified` 23:47 UTC. About **3.4 months** to delayed mode — faster than the "usually 1–2 years" on the Argo "How to use" page and the FAQ's "about 1 year" for salinity. One float, one cycle — not a rule.
- **Files are rewritten without a new observation:** `R1902040_260.nc` (an Oct–Nov 2025 cycle) has `Last-Modified` 19 Dec 2025; R 296 (observed 22 Oct 2026) shows 1 Nov 2026 in the folder listing, the same day as R 297. The FAQ says D files may also be modified after creation and the data set "is always changing".
- **Directory listing times are server-local** (listing shows 14:40 for a file whose HTTP `Last-Modified` is 13:40 GMT).
- *Interpretation:* an observation's identity is (float, cycle, direction, profile index); its **freshness is `JULD`**, not the file's modification time or the download time. A revision is detected by `DATA_MODE`, `DATE_UPDATE`, the `HISTORY_*` records or a content hash — **not** by filename. **Open:** how removals/greylisting are signalled (manual ch. 7 lists a removal file and greylist without detail), and whether the GDAC index `date_update` column always tracks `DATE_UPDATE`.

## 6. Pressure is not depth

- `PRES` is sea pressure in **decibar**, 0 at sea level. 1 dbar ≈ 1 m only roughly.
- **Proposed conversion (not adopted):** UNESCO 1983 / Fofonoff & Millard depth formula, needing latitude; TEOS-10 `gsw.z_from_p` is the modern equivalent. At the R 297 latitude (33.8° S): 500 dbar ≈ **495.8 m**, 1000 dbar ≈ **990.5 m**, 2003.9 dbar ≈ **1980.1 m** (Claude's arithmetic). Assumptions: standard ocean, no dynamic-height correction. Any display would label values "pressure (dbar)" or "approx. depth (m), computed".

## 7. Payload and processing (measured)

- **Per profile file:** 107–151 KB raw NetCDF-3; gzip 24.1 KB (D) / 22.8 KB (R) (`CompressionStream`, in-page).
- **Compact extraction** (primary profile, best-available values per `DATA_MODE`, pressure/temperature/salinity + 3 flags per level, JSON): **29.5–29.6 KB, ~8 KB gzipped** (1007–1008 levels). Done with `scipy.io.netcdf_file` on the Mac in under a second.
- **Finding profiles:** GDAC index files — weekly `ar_index_this_week_prof.txt` **931 KB** (10,268 profiles this week); global `ar_index_global_prof.txt.gz` **56 MB** (304 MB unzipped). Columns: file, date, latitude, longitude, ocean, profiler type, institution, date_update.
- *Interpretation:* processing needs a NetCDF-3 reader, profile selection by sampling scheme, fill/flag handling and mode-dependent field choice — modest per file; the volume (~13,000 profiles/month per argo.ucsd.edu) is what would need measuring. **No infrastructure choice made.**

## 8. Reuse, attribution, access (primary sources)

**Explicit:**
- argo.ucsd.edu "About": "all data are freely and openly available".
- "Acknowledging Argo": "Argo data are freely available without restriction"; asks users to acknowledge Argo in a publication or product with the standard sentence (crediting the International Argo Program, its national programs and the Global Ocean Observing System) **plus an Argo DOI** — general `https://doi.org/10.17882/42182`, or the monthly-snapshot DOI matching when the data were obtained.
- Coriolis GDAC `readme_before_using_the_data.txt` (2017): same acknowledgment and DOI rule; "proper and appropriate use is the responsibility of the user"; real-time data get only coarse automated QC.
- "How to use": for sensitive work use delayed-mode data with QC 1 and small errors; R files not recommended for sensitive work.

**Not found (Open):**
- No **automated-access or rate-limit policy** for the GDAC HTTPS server; the FAQ mentions mirrors and points to index files, the Argovis API and the Euro-Argo selection tool, but sets no limits.
- No explicit statement on **redistributing derived products** beyond the acknowledgment request ("without restriction" is positive evidence, not a full licence text).

**Project practice (recommended, not required by any source):** carry the acknowledgment sentence + monthly DOI, the float WMO, cycle, `DATA_MODE` and retrieval time with any shown profile.

## 9. What Mother Earth could honestly show (research direction, not a UI design)

- **A dated profile marker** at the surfacing position, labelled with its profile time and mode (`real-time` / `delayed-mode`), opening temperature and salinity against **pressure** (or computed depth, labelled) through the water column, with flagged levels marked or excluded.
- **Real-time values** labelled as automated-QC only; **delayed-mode values** as reviewed, with the supplied adjustment uncertainty once its meaning is confirmed.

**Unsupported / not to be shown:**
- The float's **current** position, or a continuous track between surfacings.
- Any **cell-wide** ocean condition from one or a few profiles; empty cells are "no profile", not "no ocean data".
- "How unusual" comparisons — no compatible climatology chosen.
- BGC variables (separate gate).

## 10. Open questions (each needs a separate go)
1. Confidence level of `_ADJUSTED_ERROR`; whether QC 2/3 levels should be shown.
2. Revision detection in practice: track `DATA_MODE`/`DATE_UPDATE`/hash across several days for a set of floats; removal/greylist handling.
3. Automated-access terms for the GDAC servers (and whether to use the DOI monthly snapshots instead).
4. Real-time → delayed-mode lag distribution across many floats (one float measured).
5. Volume: profiles per day, index-diff size, processing per profile at scale.
6. A compatible baseline before any comparison.
7. Independent reproduction of the checks in §2–§7.

## Sources
- [Argo — About](https://argo.ucsd.edu/about/) · [How to use Argo files](https://argo.ucsd.edu/data/how-to-use-argo-files/) · [Data FAQ](https://argo.ucsd.edu/data/data-faq/) · [Acknowledging Argo](https://argo.ucsd.edu/data/acknowledging-argo/)
- [Argo user manual — reference tables](https://oneargo.github.io/argo-format-user-manual/chapter3.html) · [Data access / file naming](https://oneargo.github.io/argo-format-user-manual/chapter4.html) · [DAC–GDAC data management](https://oneargo.github.io/argo-format-user-manual/chapter6.html)
- Coriolis GDAC (browser pane, 6 Nov 2026 11:45–12:09 UTC): [readme_before_using_the_data.txt](https://data-argo.ifremer.fr/readme_before_using_the_data.txt) · [ar_index_this_week_prof.txt](https://data-argo.ifremer.fr/ar_index_this_week_prof.txt) · [float 1902040](https://data-argo.ifremer.fr/dac/aoml/1902040/)
