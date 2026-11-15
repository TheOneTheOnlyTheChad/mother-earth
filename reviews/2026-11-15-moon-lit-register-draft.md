# DRAFT — REGISTER entries for "Lit as now" on the Moon globe (not filed)

2026-11-15 · for Chad's Approve line · to be added to `REGISTER.md` on branch `moon-lit-rc`, reaching main with the page merge.
Nothing below is in `REGISTER.md` yet. Entries 1–3 extend entries filed on 14 Nov; entry 4 is new (GPT, round 1: file it, because the repo keeps the SVS extract and the public method text cites its results; label it test-only, never loaded by the page); entry 5 is the new table.

---

## 1. NAIF generic kernels — planetary ephemeris `de440s.bsp` and a wider range of `moon_pa_de440_200625.bpc` (extension of the NAIF generic kernels entry) — **used offline to make the sunlight table; not fetched by the page or the hub**
- **Filed:** <date and time> on Chad's line "<Approve line>".
- **Files (fetched by Claude in the browser pane, 15 Nov 2026 03:14 UTC, from `naif.jpl.nasa.gov/pub/naif/generic_kernels/`):**
  - `spk/planets/de440s.bsp` — 32,726,016 B, sha256 `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`, Last-Modified Mon, 21 Dec 2020. JPL DE440, 1849–2150. The whole file was read once in the pane to hash it. **Nine verbatim byte ranges are kept in the repo** (184 KB): the DAF header and summaries; the type-2 records of the Sun (10), the Earth–Moon barycentre (3), the Moon (301) and the Earth (399) that cover 31 May 2026 – 2 Jan 2028 TDB; the four segment trailers.
  - `pck/moon_pa_de440_200625.bpc` — as filed 14 Nov. Records 21750–21823 (18,944 B, sha256 `7430467e…9797`) replace the three-record range for this build; the earlier range is byte-identical inside it.
- **Public release, acknowledgement, software, commercial use:** as the NAIF generic kernels entry.
- **Attribution (our display):** "Sun, Earth and Moon positions and Moon orientation: JPL DE440 via NAIF" in the lighting readout; kernel names in `sources.html#moonlight`.

## 2. NASA/JPL Solar System Dynamics — DE440 ASCII ephemeris, records 873–891 of `ascp01950.440` (extension of the DE440 ASCII entry) — **independent check only; not displayed**
- **Filed:** <date and time> on Chad's line (as above).
- **File (Claude, browser pane, 15 Nov 2026 03:15:09 UTC):** `ssd.jpl.nasa.gov/ftp/eph/planets/ascii/de440/ascp01950.440`, 30,629,582 B, sha256 `e24f6356225f7d912e35af2ebc5f9bcf6fb0425c53aa92b5d7243cb063477286`, Last-Modified Tue, 22 Dec 2020. The whole file was read once in the pane to hash it. Bytes 23,387,912–23,897,510 kept = records 873–891, JED 2461168.5 – 2461776.5 (509,599 B, sha256 `922de55b…08e1`). Record 874 is byte-identical to the one filed 14 Nov.
- **Use:** the Earth–Moon barycentre, geocentric Moon, Sun and libration coefficients are evaluated by our own code to recompute the Sun and Earth directions over the Moon without SPICE. Results in `phase1/skycraft/checks/moonlight-checks.json`. Nothing from this file is shown on the page.
- **Reuse terms:** as the DE440 ASCII entry.

## 3. NASA/JPL Horizons — Moon from the Earth's centre: illuminated fraction, sub-observer and sub-solar points (extension of the Horizons entry) — **independent check only; not displayed**
- **Filed:** <date and time> on Chad's line (as above).
- **Request (Claude, browser pane, one request, no retry, 15 Nov 2026 03:15:23 UTC):** target 301, `CENTER='500@399'`, OBSERVER, quantities 10, 14, 15, 20, 21, every 5 days from 1 Jun 2026 to 1 Jan 2028 (116 rows). Raw answer kept: `phase1/skycraft/raw/horizons-moon-geocentre-q10-14-15-20260601-20280101.txt`.
- **Answer header used:** "Target pole/equ : MOON_ME {East-longitude positive}"; target radii 1737.4 × 3; target and centre source DE441; geocentric.
- **Reuse terms, request rules:** as the Horizons entries above.

## 4. NASA Scientific Visualization Studio — "Moon Phase and Libration, 2026" hourly table `mooninfo_2026.json` — **test-only corroboration; never loaded by the page; not displayed**
- **Filed:** <date and time> on Chad's line (as above).
- **Source:** https://svs.gsfc.nasa.gov/5587/ ; file `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/mooninfo_2026.json`, 2,094,339 B, sha256 `098ec6434ba4fecb84e66485385816d465b7969f142864bcfc9ffc68311b4a86`, Last-Modified Thu, 30 Oct 2025. Fetched once by Claude in the browser pane, 15 Nov 2026 03:15:53 UTC.
- **Kept in the repo:** an extract only — 1,128 hourly rows, 15 Nov 2026 00:00 UT to 31 Dec 2026 23:00 UT, six columns (time, phase, sub-solar longitude and latitude, sub-Earth longitude and latitude), values as published (`phase1/skycraft/raw/svs-mooninfo-2026-nov15-dec31.csv`, 61,074 B).
- **What the page says (read by Claude, 15 Nov 2026):** geocentric phase, libration, position angle and apparent diameter at hourly intervals; data sets listed include "DE421 (JPL DE421)". No light-time or aberration convention is stated.
- **Use:** our table's directions are compared with these rows; offsets are reported as found (at most 0.0009° and 0.005 of a percentage point), with no ceiling. Named in `sources.html#moonlight` as corroboration.
- **Reuse terms:** as the SVS "CGI Moon Kit" entry (NASA Images and Media Usage Guidelines; that they cover this file is our reading).

## 5. Mother Earth — sunlight table `moon-light-2026-06-R1` — **read by `moon.html` when "Lit as now" is on, once released**
- **Filed:** <date and time> on Chad's line (as above).
- **What it is:** our own calculation. Sub-solar and sub-Earth points on the Moon every six hours, 1 Jun 2026 00:00 UTC to 1 Jan 2028 00:00 UTC (2,317 samples), in `MOON_ME_DE440_ME421`, rounded to 0.00001°. Sun: the light arriving at the Moon's centre (light time and stellar aberration). Earth: geometric, to the Earth's centre. 82,330 B, sha256 `a78c2f4b10e3d9fa27153401531852f4eb53117562703d10243d7cf1f253b462`. Served unchanged from this site (`assets/moon/`); the page pins the hash.
- **Generator and evidence:** `phase1/skycraft/build_moonlight.py` (rebuilds byte for byte: `--check`); `BUILD-moonlight.json`; `checks/moonlight-checks.json`; break tests `test_moonlight_breaks.py`; page arithmetic `moonlight.js` with `phase1/moon-light.test.mjs`.
- **Computed, not observed.** Shown with the Computed label, the device-clock time used, and its limits (sphere, point Sun, no relief shadows, no earthshine, no eclipses).
- **Attribution (our display):** "Sun, Earth and Moon positions and Moon orientation: JPL DE440 via NAIF".
- **Ends 1 January 2028.** Outside its span the globe stays evenly lit. Renewal (a rebuild with wider ranges, or another route) is to be decided before then.

---
