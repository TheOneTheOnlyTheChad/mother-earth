# Ocean Heat — source-file check record (rev 1: C0–C1)

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
- **Not approved:** download, C2–C7, O7.
