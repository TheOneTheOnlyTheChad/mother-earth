# Sky zoom-out — source pass record (rev 1.1)

- **Run:** 10 Nov 2026, 11:42:31–11:50:48 UTC (Mac clock: protocol hash to the LOG entry closing request #5; see §0 for the two protocol readings), on Chad's line: "Go: Sky zoom-out source pass — text only via the pane, no export (Horizons manual frame wording, Moon/Sun radii from Horizons body data, IERS UT1−UTC bound, polar-motion size)".
- **Written:** rev 1 from 11:51 UTC (clock reading); **rev 1.1 at 12:00 UTC** (clock reading) after GPT's review (relayed by Chad, 10 Nov).
- **GPT's review:** the pass supports the frame, the radii and the build-time transform. No repeat export needed. GPT checked:
  - the protocol, source and result hashes, and found the repo record byte-identical to the corrected packet result;
  - all 365 Bulletin A prediction rows, reproducing 0.26843 s (2027-06-02) and the joint 0.50474″ (2027-06-01).
  GPT could not rerun the ERFA sensitivity script.
- **Rev 1.1 corrections:** protocol timestamps (§0); UT1−UTC scenario wording (§3); polar-motion input wording (§4); reuse notes (§6). §5 lists the rev 2.2 changes.
- **Proposal:** `docs/concepts/SKY-ZOOM-OUT-PROPOSAL.md` rev 2.1 (main `17162bf`), §13 step 2.
- **For GPT's review.** Nothing is filed, built, uploaded or deployed; REGISTER and the proposal are unchanged. Proposal changes are **listed in §5, not applied**.

## 0. Packet and method
- **Mac packet:** `research/sky-zoom-out/2026-11-10-claude/`
  - `PROTOCOL.md` (sha256 `c7acba0c…e1c8`). **Two clock readings (rev 1.1):** 11:42:31 is the Mac `date -u` printed by the same command that wrote and hashed the file. 11:42:37 is the LOG's first entry, written in the next command. The first request is logged at 11:42:38. Either way, the protocol was fixed before any request.
  - `LOG.md` (append-only, Mac clock)
  - five source files, with their hashes in `.hashes`
  - `RESULT.md`
- **Requests: 5 (protocol cap 6), one at a time, from the Claude desktop browser pane, default pane User-Agent.**
  - No ephemeris export: both Horizons requests used `MAKE_EPHEM='NO'`, which returns the body data sheet only.
  - The "I Accept" control on ssd-api was not clicked.
  - No PDF was fetched or opened. No fallback URL was used.
- **Bytes:**
  - #2 and #3 are the exact API response text (sha256 checked in the pane and on the Mac).
  - #1, #4 and #5 are the **rendered text** (`innerText`) of the loaded page; for #1, only the Reference Frames section. The server's raw bytes were not saved for those three, as recorded in the LOG.

| # | Source | Mac file | Bytes | sha256 |
|---|---|---|---|---|
| 1 | Horizons manual `ssd.jpl.nasa.gov/horizons/manual.html` (`document.lastModified` 11/05/2026 23:02:55), Reference Frames section | `01-horizons-manual-reference-frames.txt` | 8,284 | `0315d3ba…1d54` |
| 2 | Horizons API, body data Moon (301), `OBJ_DATA='YES'&MAKE_EPHEM='NO'`; HTTP 200, server Date 11:44:40 GMT; "API VERSION: 1.2" | `02-horizons-bodydata-301.txt` | 1,670 | `b7f82d98…eff0` |
| 3 | Horizons API, body data Sun (10), same parameters; HTTP 200, 11:45:00 GMT; "API VERSION: 1.2" | `03-horizons-bodydata-10.txt` | 1,554 | `0aaea58c…63a1` |
| 4 | IERS Bulletin C 72 (Paris, 06 July 2026), `hpiers.obspm.fr/iers/bul/bulc/bulletinc.dat` | `04-iers-bulletin-c.txt` | 1,528 | `310e172e…52f0` |
| 5 | IERS Bulletin A, 5 November 2026, Vol. XXXIX No. 045, `datacenter.iers.org/data/latestVersion/bulletinA.txt` | `05-iers-bulletin-a.txt` | 43,449 | `b103f1eb…0925` |

## 1. Frame wording — Horizons manual (#1)
Verbatim:
- "The primary reference frame is the ICRF. It is based on thousands of remote extragalactic radio sources (mostly quasars) to specify three fixed reference directions: the ICRF pole direction (+Z) and right ascension origin (+X), along with the orthogonal +Y direction."
- "The JPL planetary ephemeris solution (currently DE440/441) is closely aligned with the ICRF-3 realization, and is thought to differ by at most 0.0002 arcseconds, while the ICRF is thought to differ from the previous FK5/J2000 dynamical system by at most 0.02 arcseconds."
- "All underlying calculations in Horizons are done in the reference frame of the planetary ephemeris (DE440/441), taken to be indistinguishable from the ICRF using currently available measurements. They are then transformed to other frames if necessary for final output."
- On Horizons' own Earth-fixed route (which **we do not use**): "Horizons currently uses the IAU76/80 precession-nutation theory, corrected daily by GPS measurements over the modern era, to transform from ICRF to the 'true-of-date' reference frame. Due to different adopted ecliptics, the origin of RA (x-axis) in this intermediate reference frame differs by about -53 mas from the IAU2006/00A of-date system." And ITRF93 "is produced from the Earth TOD frame with additional small GPS-derived polar motion corrections."

**What this supports:**
- The exported vectors (`REF_SYSTEM='ICRF'`, `REF_PLANE='FRAME'`) are in the ICRF axes, with the DE441 frame "taken to be indistinguishable".
- ICRF vs FK5/J2000 is at most 0.02″ (~0.000006°), far below every tolerance in the proposal.

**What it does not state:** that the axes of an Earth-centred vector table coincide with the GCRS. That reading comes from IERS via ERFA (`c2t06a.c`: "[CRS] is a vector in the Geocentric Celestial Reference System"; GCRS axes are aligned with ICRS) and stays a **labelled reading**.

The manual's −53 mas note concerns Horizons' own intermediate frame (IAU76/80). Our transform is IAU 2006 (proposal §3.4), so it does not apply to us.

## 2. Radii — Horizons body data (#2, #3)
Verbatim lines:
- **Moon (301)**, "GEOPHYSICAL DATA (updated 2018-Aug-15)": "Vol. mean radius, km = 1737.53+-0.03", "Radius (gravity), km = 1738.0", "Radius (IAU), km = 1737.4".
- **Sun (10)**, "PHYSICAL PROPERTIES (updated 2024-Oct-30)": "Vol. mean radius, km = 695700", "Solar radius (IAU2015)= 695700 km", "Radius (photosphere) = 696500 km".

**What this supports:** the proposal's Moon 1,737.4 km and Sun 695,700 km, now sourced. Recommended: use the **IAU values** for both (Moon "Radius (IAU)" 1737.4; Sun "Solar radius (IAU2015)" 695700), labelled as such in Sources.
- Using the Moon's volumetric mean (1737.53) instead changes the drawn Moon by 0.007%: no visible effect.
- The drawn-Sun radius at 200 R⊕ stays 0.915–0.946 R⊕.

## 3. UT1 − UTC (#4, #5)
**Finding: Bulletin C 72 does not state the |UT1 − UTC| < 0.9 s bound.** (Rev 1.1: GPT cites the IERS glossary as stating the 0.9 s convention. That page was not read in this pass, so the figure stays attributed to GPT's citation.) Its operative text: "NO leap second will be introduced at the end of December 2026." / "from 2017 January 1, 0h UTC, until further notice : UTC-TAI = -37 s" / "Leap seconds can be introduced in UTC at the end of the months of December or June, depending on the evolution of UT1-TAI." The 0.9 s figure therefore **stays [GK]**.

The proposal doesn't need it: **Bulletin A gives the actual values.**
- Header: "DUT1= (UT1-UTC) transmitted with time signals = -0.1 seconds beginning 29 October 2026 at 0000 UTC".
- Observed combined values (IERS Rapid Service rows): UT1−UTC −0.053243 s (2026-10-30) to −0.059553 s (2026-11-05).
- Predictions (365 rows, 2026-11-06 → 2027-11-05): max |UT1 − UTC| **0.26843 s on 2027-06-02** (parsed independently in the pane and on the Mac; the two agree).
- Bulletin A's own extension formula ("may be used to extend the predictions beyond the end of this table"): UT1−UTC = −0.1139 − 0.00044 (MJD − 61356) − (UT2−UT1). At 2027-12-31 (MJD 61770) our arithmetic gives −0.2961 s without the seasonal term. **Rev 1.1, with the bulletin's seasonal UT2−UT1 term, gives −0.2909 s** (UT2−UT1 = −0.00514 s at Besselian year 2027.9978; GPT's ~−0.291 s, reproduced).
- **These are estimates** (a prediction and an extrapolation), not measurements. The −0.30 s sensitivity case below is a **rounded scenario**.
- Bulletin A also states the prediction accuracy: "UT1-UTC 0.0014 0.0024 0.0032 0.0040" at 10/20/30/40 d, with S t = 0.00025 (MJD−61349)^0.75.

**Effect on the scene** [desk, `docs/concepts/sky-zoom-out-desk-check/sensitivity.py` → `sensitivity.json`; full ERFA chain, committed exports]:

| UT1 − UTC | Max shift, Sun | Max shift, Moon |
|---|---|---|
| −0.26843 s | 0.00112° | 0.00112° |
| −0.30 s | 0.00125° | 0.00125° |

The same order as the precession-only approximation (≤ 0.0025°), and below the 0.004° / 0.005° check tolerances (those are measured with UT1 = UTC on both sides, so they test the code, not this assumption).

**Leap second:** Bulletin C 72 rules one out only for the end of December 2026. The end of June 2027 is open until Bulletin C 73 [GK: expected around January 2027]. A leap second would step UTC by 1 s [GK]. The refresh procedure's step 0 (Bulletin C check) already covers it.

## 4. Polar motion (#5)
- Observed combined x, y (IERS Rapid Service rows, 2026-10-30 → 11-05): x 0.14139″ → 0.13290″, y 0.31798″ → 0.31858″.
- Predictions to 2027-11-05: max |x| 0.2676″ (2027-08-07), max |y| 0.4699″ (2027-05-01), max pole offset √(x²+y²) **0.5047″ (2027-06-01)**.
- **Effect on the scene** [desk, `sensitivity.py`]: Sun ≤ 0.000093°, Moon ≤ 0.00015°. Negligible. On the ground that is ~16 m [our arithmetic, GK 30.9 m per arcsec].
- **Rev 1.1:** the script's input (x, y) = (0.2676″, 0.4699″) **combines the largest x and the largest y from different dates**. That is a deliberately conservative input, magnitude 0.5408″, above the largest predicted joint offset of 0.5047″. So ~0.00015° is a **sensitivity estimate**, not a bound.
- The prediction table ends 2027-11-05. Neither it nor the desk run establishes a measured bound for the whole catalogue window (to 2027-12-31).

**What this supports:** "polar motion 0" (proposal §3.4) has a sensitivity estimate of ~0.00015° for a conservative input drawn from the bulletin's predictions to 2027-11-05, from a cited bulletin rather than [GK].

## 5. Proposal changes this supports (listed, **not applied**; for rev 2.2 after GPT)
1. §3.2: add the Horizons manual frame quotes (§1 above). The GCRS-axes reading stays labelled.
2. §3.4: replace "[GK < 0.9 s]" with the Bulletin A values: max predicted |UT1 − UTC| 0.268 s to 2027-11-05, and ~−0.291 s at 2027-12-31 by the bulletin's formula with its seasonal term. Both are **estimates**. The −0.30 s case is a rounded **scenario**, with sensitivity ≤ 0.00125°. If the 0.9 s figure is kept, it is attributed to the IERS glossary convention (GPT's citation), never to Bulletin C.
3. §3.4: polar motion: max predicted joint offset 0.505″ to 2027-11-05. Sensitivity estimate ~0.00015° from a conservative combined input (0.541″). No measured bound for the full window.
4. §4: radii sourced. Use IAU values (Moon 1737.4 km "Radius (IAU)", Sun 695700 km "Solar radius (IAU2015)"); [GK] removed.
5. §0: add this record's evidence tag.
6. Refresh procedure: at each refresh, re-read Bulletin A for the UT1 − UTC and polar-motion sizes over the new coverage, beside the existing Bulletin C step 0.

## 6. Reuse notes (for GPT; nothing filed)
- **Horizons:** the body data sheet is SSD data; the existing Horizons REGISTER reading applies (GPT: consistent). Rev 1.1: the REGISTER entry records the two body sheets (#2, #3) as **sources for the radius inputs**. The radii would appear only as inputs and in Sources text.
- **Frame assumption (rev 1.1, GPT):** treating the Earth-centred ICRF axes as aligned with the transform's GCRS input is stated as an **explicit implementation assumption**.
- **IERS Bulletin A** carries "Distribution statement A: Approved for public release: distribution unlimited." GPT: this supports citing **summary figures** in the docs and Sources, with no IERS time series shipped to the page. The bulletin is produced by the IERS Rapid Service/Prediction Centre (USNO); the pending R3 enquiry stays **separate**.
- **Bulletin C:** read for facts only, as in the Two Clocks refresh step 0.

## 7. Not approved
REGISTER changes, proposal rev 2.2, any build, R2 write, hub deploy or page change.
