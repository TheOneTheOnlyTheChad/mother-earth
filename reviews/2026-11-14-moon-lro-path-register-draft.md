# DRAFT — REGISTER entries for LRO's dated path on the Moon globe (not filed)

2026-11-14 · for Chad's Approve line · to be added to `REGISTER.md` on branch `moon-lro-path-rc`, reaching main with the page merge.
The proposal (rev 2) asks that the catalogue, the NAIF kernels and the DE440 coefficient source are filed **before page release**.
Nothing below is in `REGISTER.md` yet.

---

## NAIF generic kernels — lunar frame kernel `moon_de440_250416.tf`, lunar orientation PCK `moon_pa_de440_200625.bpc`, leap seconds `naif0012.tls` — **used offline to make the Moon-fixed LRO catalogue; not fetched by the page or the hub**
- **Filed:** <date and time> on Chad's line "<Approve line>".
- **Files (fetched by Claude in the browser pane on 14 Nov 2026 — arrival in the workspace, file times: the frame kernel and leap-seconds file 16:09 UTC, the PCK ranges 16:11 UTC — from `naif.jpl.nasa.gov/pub/naif/generic_kernels/`):**
  - `fk/satellites/moon_de440_250416.tf` — 19,478 B, sha256 `a47c71e9…f768`, Last-Modified Wed, 16 Apr 2025. Defines `MOON_ME_DE440_ME421` (frame 31009) as a fixed offset from `MOON_PA_DE440`. Whole file kept in the repo.
  - `pck/moon_pa_de440_200625.bpc` — 12,863,488 B, sha256 `60cd55aa…783f`, Last-Modified Sat, 26 Jun 2021. DE440 lunar orientation, 1549–2650. **Only three verbatim byte ranges are kept in the repo** (DAF header and summaries, 5,120 B; type-2 records 21751–21753, 768 B, covering 2 – 26 June 2026 TDB; the segment trailer, 32 B), each hashed in the pane from the full file and again on arrival. The build reassembles a same-length file with every other byte 0xFF, so a read outside the ranges gives NaN and stops the build.
  - `lsk/naif0012.tls` — 5,257 B, sha256 `678e32bd…039b`. Used only to read the first and last state epochs back as UTC (a check); the rotation takes TDB from the LRO segment directly.
- **Public release (read by Claude, 13 Nov 2026, `naif.jpl.nasa.gov/pub/naif/AA_CLEARANCE_STATEMENT.TXT`; already filed under the LRO PDS entry):** "All of the folders and associated data files appearing on this page and lower-level pages have been cleared for public release: JPL Clearance Number CL#05-2438. …" `generic_kernels/` is below that page.
- **Acknowledgement (NAIF "Rules Regarding Use of SPICE", read by Claude 13 Nov 2026):** acknowledgement of SPICE / NAIF resources "is encouraged". No reuse or commercial-use sentence for generic kernels was found on the pages read (not the same as unrestricted).
- **Software:** SpiceyPy 8.0.0 (PyPI), CSPICE N0067, run in Claude's workspace for the build only. Not shipped to the page.
- **Attribution (our display):** "Moon orientation: JPL DE440 via NAIF" beside the overlay; kernel names and the toolkit in `sources.html#moonglobe` and `moon.html` Sources.
- **Commercial use:** not addressed on the pages read. Mother Earth makes none.

## NASA/JPL Solar System Dynamics — DE440 ASCII ephemeris `header.440` and one record of `ascp01950.440` — **independent check only; not displayed**
- **Filed:** <date and time> on Chad's line (as above).
- **Files (Claude, browser pane, 14 Nov 2026):** `ssd.jpl.nasa.gov/ftp/eph/planets/ascii/de440/header.440` (22,802 B, sha256 `0f4636b6…3359`, 16:14:45 UTC); `ascp01950.440` bytes 23,414,733–23,441,553 = record 874, JED 2461200.5 – 2461232.5 (26,821 B, sha256 `fbd04285…bc75a`, 16:15:08 UTC; the full file is 30,629,582 B and was not downloaded).
- **Use:** the lunar libration angles (13th quantity, 10 coefficients × 4 subintervals × 3 angles) are evaluated by our own code to recompute the J2000 → Moon rotation without SPICE. Results are in `phase1/skycraft/checks/moonfixed-checks.json`. Nothing from this file is shown on the page.
- **Reuse terms:** as the Horizons entry above (SSD FAQ: "No permissions are needed. The data provided on this site are considered public domain."). That the FAQ covers the ephemeris FTP area is our reading.

## NASA/JPL Horizons — Moon sub-observer point seen from LRO and the Moon's barycentric velocity (extension of the Horizons entry) — **independent check only; not displayed**
- **Filed:** <date and time> on Chad's line (as above).
- **Requests (Claude, browser pane, one at a time, no retry):** 14 Nov 2026 16:11:55 UTC — target 301, `CENTER='500@-85'`, OBSERVER, quantities 14 and 20, five UTC times on 10–11 June 2026; 16:13:19 UTC — target 301 vectors from 500@0 (ICRF, geometric), same times. Raw answers kept: `phase1/skycraft/raw/horizons-moon-from-lro-q14-20260610.txt`, `…-ssb-vectors-20260610.txt`.
- **Answer header used:** "Target pole/equ : MOON_ME {East-longitude positive}"; target radii 1737.4 × 3; target source DE441; centre source LRO_MERGED.
- **Reuse terms, request rules:** as the Horizons entries above.

## Mother Earth — Moon-fixed LRO catalogue `craft-moon-me-2026-06-R1` (derived from `craft-moon-2026-06-R1`) — **shown on `moon.html` when "Show LRO's dated path" is on, once released**
- **Filed:** <date and time> on Chad's line (as above).
- **What it is:** the same 1,441 NASA/GSFC FDF definitive states (see the LRO PDS entry), each rotated once from J2000 into `MOON_ME_DE440_ME421` at its own SPK epoch; positions rounded to 1 m; velocities not carried. 39,267 B, sha256 `d62fb271…afb9`. Served unchanged from this site (`assets/moon/`); the page pins the hash.
- **Generator and evidence:** `phase1/skycraft/build_moonfixed.py` (rebuilds byte for byte from the pinned inputs: `--check`); `phase1/skycraft/BUILD-moonfixed.json`; `phase1/skycraft/checks/moonfixed-checks.json`; break tests `phase1/skycraft/test_moonfixed_breaks.py`.
- **Attribution (our display):** "Calculated from NASA/GSFC's definitive trajectory" with the time, and "Moon orientation: JPL DE440 via NAIF".

---
