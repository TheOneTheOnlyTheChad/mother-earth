# Ocean Heat — source-file check record (rev 2: C0–C5)

**Go (Chad, 10 Nov 2026):** "Go: Ocean Heat source-file check C0–C1 per OCEAN-HEAT-PROPOSAL rev 3 — route probes and listings, bounded reads capped at 64 KiB, no full download."
**Packet (Mac, not in the repo):** `research/ocean-heat/2026-11-10-claude/`
- PROTOCOL.md sha256 `dfdf1ae5…9027`, fixed 16:43:27Z before any request.
- LOG.md: append-only.
- REPORT-C0-C1.md.

**Run:** 16:43:31Z–16:45:36Z (UTC). 16 requests against a cap of 30. No full file fetched and nothing decoded.

## C0 — Route
| Route | Result |
|---|---|
| Workspace shell | Refused at the proxy |
| Mac shell | Refused at the proxy |
| Browser pane | **Works** (site access granted by Chad, scope site). Listings 200; `Range` honoured with 206. |

## C1 — Inputs for **2026-11-09** (the latest date where SST and SSTA both exist)

| # | File | Bytes |
|---|---|---|
| 1 | `v3.1_op/nc/v1.0/daily/sst/2026/coraltemp_v3.1_20261109.nc` | 11,418,321 |
| 2 | `v3.1-clim19912020-v1/nc/v1.0/daily/ssta/2026/ct5km_ssta_v3.1-clim19912020-v1_20261109.nc` | 10,399,448 |
| 3 | `v3.1-clim19912020-v1/climatology/nc/ct5km_v3.1_clim-sst-mean-daily-window-01day-01grid-source19912020_day1109.nc` | 6,349,472 |

- Paths are under `https://www.star.nesdis.noaa.gov/pub/socd/mecb/crw/data/5km/`.
- Sizes are from `Content-Range` totals; the three total 28,167,241 B.
- Files 1 and 2 each have an `.nc.md5` sidecar in the listing.
- Each file starts with the HDF5 signature, consistent with NetCDF4.

## Dispositions
- **Established:**
  - the pane is the only working route;
  - byte ranges are honoured;
  - the three inputs exist with the sizes above.
- **File names only, not yet metadata:** the climatology is named `source19912020`, consistent with the "2000" on NOAA's page being a typo. C2 confirms or refutes it.
- **Download route, for Chad's line:** (D1) Chad downloads the three files and two md5 sidecars himself into the Mac packet's `inputs/` folder (lean); or (D2) decode inside the pane (adds a dependency).
- (C0–C1 dispositions as above.)

---

## C2–C5 (rev 2)

**Line (Chad, 10 Nov 2026):** "Approve: Ocean Heat C2–C5 on the three 9 Nov files I downloaded (…) — hash and md5-check them, read headers and arrays, masks and consistency; no other download, no build."

**Inputs.** Chad downloaded the files himself; they were copied unchanged into the Mac packet's `inputs/`. Report: `REPORT-C2-C5.md` (packet).

| File | sha256 |
|---|---|
| CoralTemp | `57de86e9…5b92` |
| SSTA | `7b97760a…1033` |
| Climatology day1109 | `1495ac58…592e` |

- Each file's first 4,096 B matches the C1 bounded read.
- **The md5 sidecar check is pending:** the sidecars were not downloaded, and no other download was made.

**C2 — Headers.**
- NetCDF4; 3600 × 7200 grid centres at 0.05°.
- int16 SST and anomaly, scale 0.01 °C, fill −32768.
- SSTA and climatology carry `mask` (0 valid-water, 1 land, 2 missing, 4 ice); CoralTemp has `sea_ice_fraction` and no mask.
- The baseline is **1991–2020** in the file metadata (the page's "2000" is a typo).
- There is no per-cell gap-fill flag.

**C3 — Arrays.**
- SST / SSTA reference time 2026-11-09T12:00Z, coverage 9 Nov 00–24 UTC; the climatology = calendar day 9 Nov.
- **CoralTemp rows are south-first; SSTA and climatology are north-first.** The grids are bitwise identical after flipping CoralTemp.
- Edges fall on 0.05° multiples from −180°.
- The first C3–C5 script compared unflipped rows; its output is kept and marked void, and rev 2 flips first.

**C4 — Masks.**
- Valid anomaly ⇔ mask 0 ⇔ valid SST ⇔ valid climatology (12,833,780 cells).
- Land (mask 1, 8,722,205) ⇔ SST fill.
- Unavailable ocean is two separable states:
  - **ice now** (mask 4, 3,372,458; ice fraction > 0);
  - **no 1991–2020 normal** (mask 2, 991,557; climatology masked as ice; SST valid).
- **Land vs unavailable ocean: reliably separable (no stop).**
- Valid anomaly with missing SST: **0 cells** (fixture-only).

**C5 — Consistency.** Stored SST − anomaly − climatology = **0 exactly in all 12,833,780 valid cells** (packing tolerance ±0.01 °C).

**Cape Point.**
- At 0.25° its block is 25/25 water: the tip is water in NOAA's 5 km mask.
- At 0.5°: 91 water + 9 land; P2 texels give 4 mixed, 21 block colour.

**Terms (unresolved, for GPT and Chad).**
- CoralTemp's licence attribute has three parts:
  - **OSTIA 1985–2002:** academic research only, no commercial use, Met Office terms;
  - **GHRSST 2002–present:** free and open;
  - **Coral Reef Watch:** use without restriction, with credit and DOI.
- The SSTA and climatology files carry only the Coral Reef Watch statement.
- Whether the OSTIA restriction reaches the 1991–2020 climatology (built partly from 1991–2002) is not stated in any text read.

**For proposal rev 4:**
- flip with an assertion;
- name the two unavailable states;
- a fixture for missing SST;
- assert a residual of exactly 0;
- the data-date wording;
- the coastline note;
- the terms question in the REGISTER draft.

**Not approved:** C6 / REGISTER filing, O7 build.
