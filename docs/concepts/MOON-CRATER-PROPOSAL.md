# Moon item 5 — CRaTER (LRO's radiation telescope): assessment and proposal

Rev 1 · 27 Nov 2026, written from 10:15 UTC / 12:15 SAST (clock reading) · Claude · **docs only: no page build, bulk acquisition, merge or deployment** · for GPT's review, then Chad's decisions.

**Chad's go (27 Nov 2026):** "Go with Moon item 5: CRaTER. Assess one manageable archived radiation product or short dated interval, then return a docs-only proposal for GPT review. Establish the exact quantity, units, detector/channel meaning, calibration and quality rules, dates, spacecraft location, rights and data size. Keep spacecraft radiation measurements distinct from lunar surface conditions; assess any trajectory pairing before proposing it. Start with documentation and bounded samples, checkpoint each acquisition before proceeding, and return a feasibility conclusion. No page build, bulk acquisition, merge or deployment. Keep the remaining Moon checklist intact."

Checklist: `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` item 5 (and item 9, pairing, only as it serves item 5). Evidence: `docs/research/moon-crater/` (scripts, outputs, `checkpoints.jsonl`). Retained source files: Mac `~/Documents/Mother Earth/_source-data/moon-lro-science-crater/`.

## 0. Bottom line (feasibility conclusion)

1. **Feasible, in one honest form: a dated record of what CRaTER counted inside the instrument on LRO on 10 June 2026, the same day as the dated path the Moon tab already shows.** The archived product is the CRaTER Level 2 secondary-science table (one record per second). Its quantity is a **count of particle events per one-second readout**, measured at the spacecraft. It is not a dose, not a flux and not a lunar-surface condition.
2. **Trajectory pairing with the existing dated path is verified, not assumed.** The same records carry LRO's position in the Moon-fixed MOON_ME frame, from the definitive ephemeris. At 1,440 of the page's 1,441 minute marks, CRaTER's positions agree with the page's path to a median of 0.023–0.034 km and a maximum of 0.064–0.081 km (§7). That is within the 0.05 km rounding of the archived values plus a 0.18–0.20 s clock-tag offset that the comparison found and corrected. The remaining minute is the first one (00:00:00), which has no earlier CRaTER record to interpolate from.
3. **The signal is nearly flat over the day, and the display must say so.** On 10 June about 30 events a second were counted (mean 29.78). Per-minute variation is only 1.35 times the counting noise. There is no meaningful relation with altitude (r = 0.066; the highest and lowest altitude fifths differ by 0.87%) (§9). So **colouring the path by count rate is not recommended**: it would draw counting noise along the orbit and invite it to be read as a map of lunar radiation.
4. **No archived dose or dose rate exists for this interval.**
   - PDS holds counts, deposited energies and LET, not dose.
   - The team's legacy dose-rate table ends on 31 Dec 2012.
   - The team's current site offers dose plots for 2009–2026 from a plot generator. I found no downloadable values on the page I opened and no stated terms.
   - A dose computed by Mother Earth from the 590 MB-a-day event files would be **our** calculation. It would need detector masses from a paper not yet read, a bulk acquisition, and the flag question in point 5 resolved first.
   - **A dose display is not proposed now** (option R3, §13).
5. **Two archive inconsistencies were found and are recorded, not resolved** (§5.4):
   - **The two per-detector flag columns in the Level 2 primary-science file behave the opposite way to their label descriptions.**
   - **The June 2026 Level 2 housekeeping folder serves Level 0 files.** As a result the off-Moon and eclipse flags are not available for this interval.
   - Neither affects the proposed display, which uses only the secondary-science counts and positions.
6. **Claude's recommendation:** proceed with **R1** (§13). R1 is a small, off-by-default chart in the existing dated-example drawing: CRaTER event rate in 10-minute bins for 10 June 2026, with its counting uncertainty, and a marker that follows the drawing's existing time control. It is about 3 KB of derived data (estimate), from one retained 16,761,600-byte file. There is no hub change.
   - **"Assessed, not shown"** is a legitimate outcome too. It would record CRaTER's quantity, the verified pairing and the reasons, and close item 5 without a page change.

## 1. Scope, and what this item leaves alone

- **In scope:** assessing CRaTER's archived products and one dated interval; whether, and how, a CRaTER record could appear on the Moon tab.
- **Unchanged by this rev (docs only):** every page file, the dated LRO path and its drawing, the height, temperature and Apollo 11 layers, "Lit as now", the Sky view (10a), the Tides Moon (10b), the hub (0.6.25), R2 and collectors.
- **The remaining checklist is untouched:**
  - items 6, 7 and 8 stay "to assess";
  - 9 is taken up only here, as it serves item 5;
  - 11 is carried;
  - 12a–c stay options;
  - 13 stays outside scope.
  - No current LRO position is proposed.

## 2. What was read (all by Claude in the browser pane, 27 Nov 2026, 09:58–10:14 UTC; the workspace shell is refused by the proxy for PDS and UNH hosts)

| Source | What it settled |
|---|---|
| PDS PPI release listing `pds.nasa.gov/data/pds4/releases/ppi/`; `lro-crater-20260914/Readme_2.4.txt` | Bundle `urn:nasa:pds:lro.crater` v2.4 = **Release 67, coverage added 2026-04-01 to 2026-06-30**; the levels (CDR Level 1, DDR Level 2; EDR in PDS3); file naming. The Readme's modification dates for versions 2.2–2.4 read 2025 while the releases are 2026 (a typo in the Readme; the collection label says `2026-09-14`). |
| Collection inventories `collection_data-*.csv` (release 67) | Day files `crat_l1/l2_{pri,sec,hk}_2026161` and `_2026162` are listed; 6,181 days per collection (2009-180 to 2026-181) |
| `document/data-der-desc.txt` (34,286 B), full text | Instrument and data description, record contents, calibration, uncertainties, quality review, the D2/D6 singles caveat, limitations (§4–§5) |
| `document/errata.txt` (47,011 B) | Release 67: "No known errors or variances" for 2026-04-01 to 06-30. Release 66: 12 h power-off on 2026-062 (eclipse) and elevated/extreme modes on 2026-019/020. Section B: pointing-derived values use the original CK kernels; error "negligible in comparison to angular width of the instrument's particle acceptance cones" (2010-05-28 note) |
| Labels `CRAT_L2_SEC_2026161/162_V01.xml`, `CRAT_L2_PRI_2026161/162_V01.xml` | Field names, byte locations, units, formats; record counts; MD5 and size of each file |
| `miscellaneous/GAPS_SEC.TAB`, `GAPS_PRI.TAB`, `GAPS_HK.TAB`, `MODE_CHANGES.TAB` | No gap and no mode change listed in April–June 2026; the only 2026 gap is 2026-03-03 09:15–21:02 (eclipse power-off) |
| Directory listings `data-der-{sec,pri,hk}/2026/`, `data-raw-hk/2026/`, `data-cal-hk/2026/`, `data-der-hk/2025/` | Sizes; the misplaced 2026 Level 2 housekeeping (§5.4) |
| PPI Node FAQ `pds-ppi.igpp.ucla.edu/faq.jsp`, Citation Policy page | Reuse terms (§10) |
| UNH legacy products `crater-products.sr.unh.edu` and its L30 daily dose-rate table | The table runs 2009-06-26 to **2012-12-31**; units mGy(Si) per day; "as measured" and "corrected for lunar shadowing" columns |
| UNH current site `crater-web.sr.unh.edu`, `algorithms.html`, the Dose Rates product form | A plot generator (years 2009–2026); no data download on that page; the dose-rate method text sits in images; no reuse terms found; © 2013 UNH |
| NASA CCMC iSWA page on CRaTER (search-result text only, **discovery, not read in full**) | It says that the hourly dose rates offered there are converted from silicon to water (factor 1.333) and "altitude corrected to the lunar surface". This is not used in this proposal except to show that a surface-referred dose is a modelled quantity |

Not read: the VOLSIS SIS PDF (32-01211 Rev E) in full; Spence et al. (2010), *Space Sci. Rev.* 150, 243–284 (the instrument paper, which holds the detector masses and geometric factors). Both would be needed for R3, not for R1.

## 3. The product, and why this one

| Level 2 (derived) collection | Per day (June 2026) | What it holds | Use here |
|---|---|---|---|
| **Secondary science `CRAT_L2_SEC_yyyyddd_V01.TAB`** (DOI 10.17189/2c1t-ph72) | **86,400 records × 194 B = 16,761,600 B** | Per 1 s readout: instrument settings, status flags, singles per detector, Good/Reject/Total event counters, **LRO position (MOON_ME, km)** | **Proposed source (R1)** |
| Primary science `CRAT_L2_PRI_…` (DOI 10.17189/q8hp-4554) | 2,573,044 records × 240 B = 617,530,560 B (10 June) | One record per event: PHA amplitude, deposited energy (keV), LET (keV/µm) in each of six detectors, flags | Read in a 20,000-record slice only; context for R3 |
| Housekeeping `CRAT_L2_HK_…` | — | Voltages, temperatures, off-Moon and eclipse flags | **Not served for 2026** (§5.4) |

The secondary-science file is the smallest record that gives both "what was counted" and "where LRO was", second by second, in one table from the instrument team. Level 1 (calibrated) has no position. Level 0 is binary telemetry.

## 4. Quantity, units, detectors

**The instrument** (`data-der-desc.txt`): a stacked detector-absorber telescope with six silicon detectors in three pairs. Each pair is a thin and a thick detector, D1/D2, D3/D4 and D5/D6. Its goal is to measure lineal energy transfer (LET) spectra "caused by space radiation penetrating and interacting with shielding material". The thin detectors are 148–149 µm and the thick ones 1,000 µm, derived as deposited energy ÷ LET in the slice (`assess_crater_output`, "ENERGY/LET").

**An "event"** is a particle or photon whose signals exceed the lower-level discriminators (LLDs) in a combination of detectors accepted by the coincidence mask. Only valid events are telemetered (desc. "Data").

**The quantity proposed for R1: `GOOD`, "Good Events Counter"** (label field 27). It is the number of events in the ~1 s between two spacecraft timing pulses.
- The label gives no unit. It is a count per record, and each record is one second (§6).
- **Checked:** in the 674 complete seconds of the slice, the number of primary-science event records equals `GOOD` in every second (`assess_crater_output`, "seconds where PRI record count == SEC GOOD: 674 of 674"). So `GOOD` is the count of events reported in the primary-science table.
- **Rate limit:** primary science can report about 1,200 events a second; the true number is in the secondary record (desc. "Limitations"). On 10–11 June, `GOOD` never exceeded 70 (`assess_crater_output`).

**Other counters in the same record:** `SINGLE 1–6` (per-detector singles), `REJECT`, `TOTAL`. `TOTAL` = `GOOD` + `REJECT` in all 172,800 records of both days.

**What these counts are:** the number of particle interactions registered inside the instrument's telescope, behind its own shielding, at LRO's position. The count depends on the instrument's thresholds, mask and geometry. **They are not:**
- a dose;
- a dose equivalent;
- a flux per cm² sr;
- a value at the lunar surface;
- a value anywhere other than the instrument.

**Settings on 10–11 June (constant across all 172,800 records; `assess_crater_output`):**
- detector bias on (`BIASCMD` 1, `BIASCNTRL` 1);
- calibration pulser off (`CALLOW` and `CALHIGH` 0);
- all six detectors processing;
- LLD settings `DISCTHIN` 71 and `DISCTHICK` 71 (label gives no unit);
- coincidence mask 4,294,967,295 in both 32-bit halves, i.e. all 64 bits set. Claude's reading: every coincidence combination accepted. **This is an interpretation, for GPT to check.**
- The description warns that rate comparisons are valid only while LLD settings do not change. They do not change in this interval.

## 5. Calibration and quality

### 5.1 Calibration (from `data-der-desc.txt`, as written by the team)
- Energy is converted as Ei [keV] = Gi·Ci + Oi, with the V1.0 gains and offsets (Spence et al. 2010, table 6):
  - gains Gi, keV/ADU: D1 76.3, D2 21.8, D3 78.6, D4 21.6, D5 76.3, D6 21.9;
  - offsets Oi, keV: D1 105.1, D2 50.0, D3 152.8, D4 74.7, D5 119.1, D6 46.6.
- "The uncertainty in the Gi and Ci values awaits further analysis"; total uncertainty for deposited energy and LET "awaits further analysis".
- PHA linearity: RMS residuals < 0.1%. Gain variation with temperature: ±0.1% (D2, D4, D6) and ±0.5% (D1, D3, D5).
- Configuration and housekeeping values carry "no statement of uncertainty".
- **Checked in the slice:** the archived energies match Gi·AMPL+Oi with the table's values to within 0.53% (D1, largest), as expected from rounded published constants. **Where a detector's amplitude is 0, its energy field is not 0: it equals the offset Oi exactly** (all six detectors). So the energy fields cannot be summed without first selecting the detectors that registered (relevant to R3 only).

### 5.2 Quality rules the archive states
- Packets with bad headers are discarded, and duplicates are removed.
- Gaps are recorded in the gap files. The gap thresholds are 2 s for science and 20 s for housekeeping.
- The archive includes calibration and special-configuration periods. Users detect them from `CALLOW`, `CALHIGH`, `DISCTHIN` and `DISCTHICK`. A display must exclude any record where these differ from the nominal values. On 10 June none differ.
- **Sporadic elevation of thick-detector singles** (mostly D2, sometimes D6) has been seen in all mission phases, by a factor of 20 or more, with episodes lasting 3–5 weeks. "Despite intensive analysis, the cause … has not yet been determined". Users are urged to plot singles and Good/Reject rates first.
  - **Seen in this sample:** 11 June, 19:00–20:00 UTC. D2 singles averaged 33.69 per second against D4 10.65 and D6 11.12, and `REJECT` averaged 2.45 (`assess_crater_2_output` (c)). 10 June has no such hour.
  - This is why R1 shows `GOOD`, not singles. `GOOD` hourly means stayed between 29.00 and 30.52 on both days.
- **Errata, release 67:** "No known errors or variances."

### 5.3 Time base
- `SECONDS` is elapsed seconds from 2001-01-01T00:00:00 UTC, and `FRACT` is hundredths of a second, both derived from the spacecraft clock. `TIME` is UTC to the whole second.
- **Checked:** the first record of 10 June has `SECONDS` 802,742,400, exactly the UTC seconds from 2001-01-01 to 2026-06-10 (9,291 days). The record steps are exactly 1 s, with 86,400 records a day and no gaps. `FRACT` is 18 throughout 10 June. So each record is tagged 0.18 s after its UTC whole second. The label's start time says `.19`.
- Within a readout, event order is preserved but event times are not: every event shares the readout's time (desc. "Limitations").

### 5.4 Archive inconsistencies found (recorded for the record; proposed for neither use nor correction here)
1. **The Level 2 primary-science flag columns are swapped relative to their labels** (20,000-event slice of 10 June; `assess_crater_2_output` (a)).
   - The label puts `MAXSIGFLAGS` ("signal near saturation") at byte 216 and `GTLLDFLAGS` ("signal exceeds LLD threshold") at byte 228.
   - In the data, the column at byte 228 equals "amplitude > 95% of 4,095 ADU (> 3,890.25)" for **every** event on all six detectors. That matches the description's own definition of the saturation flag.
   - The column at byte 216 is set on the thick detectors from an amplitude of about 6–7 ADU upwards, and on the thin detectors on every event, including amplitude 0.
   - So 216 behaves like a threshold flag and 228 like the saturation flag. The thin-detector behaviour of 216 is unexplained.
   - **Status: observed in one 11-minute slice; not checked against the SIS PDF or other days; not reported to PPI.**
   - R1 does not use either column. The first assessment script's "summed ENERGY over flagged entries" line used the labelled column and is superseded by this finding (see `docs/research/moon-crater/README.md`).
2. **No Level 2 housekeeping is served for 2026.**
   - `data-der-hk/2026/` lists 182 entries (the first is day 2026-091), all Level 0 `CRAT_L0_HK_…_V02.DAT` files and their labels: the kind of file `data-raw-hk/2026/` holds (362 entries there).
   - The release-67 collection inventory lists `crat_l2_hk_2026161`.
   - `data-der-hk/2025/` holds Level 2 files normally.
   - Effect: CRaTER's own off-Moon and in-eclipse flags are not available for June 2026. R1 does not need them.

## 6. Dates and coverage

- **Archive:** Release 67, published 15 Sep 2026, covers 2026-04-01 to 2026-06-30. Releases are quarterly. By that pattern, Release 68 (July–September 2026) would be due about mid-December 2026. This is an estimate from the release history only.
- **Interval assessed:** 10 June 2026 (DOY 161) and 11 June 2026 (DOY 162), UTC days. These are the days of the page's dated path, which runs 10 June 00:00 to 11 June 00:00 UTC.
- **Server times of the files:**
  - SEC 161: 12 Jun 2026 10:14:27 GMT;
  - SEC 162: 16 Jun 2026 10:02:59 GMT;
  - the labels: 14 Sep 2026.
- Version V01 for each.

## 7. Spacecraft location and the trajectory pairing (item 9, for item 5)

- **What the record carries:** `MOONVEC 1–3`, the "Moon-to-Spacecraft Vector (MOON_ME)", in km, format `%11.4e`. Per the description it is derived from definitive SPK and CK kernels with NAIF routines. It is LRO's position relative to the Moon's centre, in the Moon-fixed mean-Earth frame. It is not a footprint, not a nadir point and not a pointing direction.
- **Rounding:** four decimals of mantissa give 0.1 km steps for components of 1,000 km or more (41.5% of components on 10 June) and 0.01 km below 1,000 km. The worst-case rounding is 0.05 km per component.
- **Range on 10 June:** radius 1,802.21–1,852.57 km, i.e. **64.81–115.17 km above the 1,737.4 km sphere**; latitude −84.09° to +84.09°. No fill values (−1).
- **Comparison with the page's path** (`assets/moon/craft-moon-me-2026-06-R1.json`): 1,441 one-minute states, definitive FDF trajectory rotated into `MOON_ME_DE440_ME421`, rounded to 1 m.

| Comparison (1,441 minute marks) | Median km | p95 km | Max km |
|---|---|---|---|
| CRaTER record of the same UTC second, as tagged | 0.3226 | 0.3480 | 0.3810 |
| CRaTER interpolated to the page time, position taken at its tag (SECONDS + 0.18 s) | 0.0339 | 0.0572 | 0.3170 |
| Same at tag + 0.02 s (best of a ±0.10 s scan in 0.01 s steps) | 0.0231 | 0.0450 | 0.3170 |
| Same, minute 0 excluded (1,440 points), at tag / tag + 0.02 s | 0.0339 / 0.0231 | 0.0571 / 0.0450 | **0.0814 / 0.0640** |

(Sources: `assess_crater_output`, `assess_crater_2_output` (b), `assess_crater_3_output`.)

- **Reading:**
  - The as-tagged 0.32 km is the 0.18 s tag offset at LRO's speed (median 1.6387 km/s; 0.19 s × that = 0.311 km).
  - Allowing for it, the two independent products agree to within their rounding.
  - The 0.317 km maximum is minute 0 (10 June 00:00:00). That page time is earlier than the first CRaTER tag, so interpolation clamps there.
  - **The pairing therefore uses the same trajectory, in a compatible frame, with an understood timing.** The label does not state the instant the vector refers to. The data are consistent with the record's full spacecraft time, within 0.02 s.
- **Proposed pairing rule (R1):**
  - CRaTER values are tied to the page's **time**, not drawn at a CRaTER-computed position.
  - The dated path stays the page's single source of position.
  - The 10-minute bins are aligned to UTC (00:00–00:10 …). The readout names the bin.
  - Nothing is shown for any time outside 10 June 00:00 – 11 June 00:10 UTC.

## 8. Spacecraft environment versus lunar-surface conditions

- **What CRaTER measured here:** particle events inside a shielded telescope on LRO, 65–115 km above the Moon, pointing as LRO pointed. Nominally it is nadir-pointing, but its boresight on this day is **not verified**, because the housekeeping flags are missing (§5.4).
- **What it is not:** the radiation at the lunar surface or at any place on the Moon. Not a dose to a person. Not comparable with Earth figures without a dosimetric conversion. Not a "radiation level" for a location on the globe.
- **Why surface-referred numbers are models:** at the surface the Moon blocks about half the sky, and its soil adds secondary "albedo" particles. Going from an orbital measurement to the surface needs a model. iSWA's surface-corrected dose rates and the team's "corrected for lunar shadowing" columns are examples of such models.
- **This proposal shows none of them.** If one is ever added, it is labelled as modelled, with its method and source (standing rule of 24 Nov 2026).
- **Dated, not live:** this is a 2026 archive record, five months old. It must never be described as current conditions.

## 9. Is there anything to see? (signal and noise)

Per-minute sums of `GOOD`, from `assess_crater_4_output`:

| Day | Mean per minute | SD | Poisson SD | SD ÷ Poisson | r with altitude | Highest vs lowest altitude fifth |
|---|---|---|---|---|---|---|
| 10 June | 1,786.8 | 56.9 | 42.3 | 1.346 | 0.066 | +0.87% |
| 11 June | 1,765.1 | 49.2 | 42.0 | 1.172 | −0.043 | +0.02% |

- At 10-minute bins the SD is 2.9 times Poisson on 10 June and 2.0 times on 11 June. So there is variation beyond counting noise at that scale. **Its cause has not been examined.** It may come from attitude, the instrument or space conditions. The proposal would show it, but not explain it.
- **Consequence:** an honest chart of 10 June is close to flat, at about 29–31 events a second. That flatness is itself the finding: galactic cosmic rays on a quiet day. **No solar particle event is in the interval**: release 67's errata lists no elevated mode for April–June 2026, and the mode-change table has no entry. A colour scale along the path would stretch noise into apparent structure. Hence R2 is not recommended.

## 10. Rights and attribution

- **PPI Node FAQ (read by Claude, 27 Nov 2026):** "Data sets archived in the PDS are in the public domain." PDS data "may be exported outside the United States as public open literature". When used in published literature or other applications, "they should be cited appropriately".
- **Citation to use:** Spence, H.E. (2026), "LRO CRaTER Lunar Derived Energy Data Secondary Science Data Collection", NASA Planetary Data System, `urn:nasa:pds:lro-crater:data-der-sec` v2.4, DOI 10.17189/2c1t-ph72. Bundle DOI 10.17189/jr9s-6678. Instrument paper: Spence et al. 2010, doi:10.1007/s11214-009-9584-8.
- **No endorsement by NASA or UNH is implied.** Mother Earth makes no commercial use.
- The UNH team products (§2) state no reuse terms on the pages read. **None is proposed.**

## 11. Data size (measured, then estimated)

- **Measured:**
  - SEC day file: 16,761,600 B (both days).
  - PRI day file: 617,530,560 B (10 June); the PRI directory lists 582–603 MB for nearby days.
  - L1 HK: on the server (size not read).
  - Retained on the Mac for this assessment: **38,695,835 B** in four files (§12).
- **Estimated (R1 served file, to be measured on a branch):**
  - 145 bins (144 for 10 June plus 11 June 00:00–00:10, for the drawing's final minute). Each bin holds a start time, an event sum, the number of seconds and a mean.
  - About 3–5 KB of JSON, served from `assets/moon/` and pinned by sha256 like the path file.
  - Fetched only when the chart is opened. No hub, R2 or collector change.
- **R3 (not proposed) would need:** the whole PRI day (617.5 MB), or more days.

## 12. Acquisitions (each checkpointed before the next; `checkpoints.jsonl`)

| # | File | Bytes | Integrity | Checkpoint (UTC) |
|---|---|---|---|---|
| 1 | `CRAT_L2_SEC_2026161_V01.TAB` | 16,761,600 | MD5 = label `d0b470e6…4812` (pane and Mac); sha256 `f6d2c537…5e25` | 10:05:35 |
| 2 | `CRAT_L2_SEC_2026162_V01.TAB` | 16,761,600 | MD5 = label `febb2bf5…58f2`; sha256 `81a547a4…0049` (pane = Mac) | 10:07:23 |
| 3 | `CRAT_L2_PRI_2026161_V01_bytes0-4799999.TAB` (records 1–20,000 of 2,573,044) | 4,800,000 | no label hash for a slice: two independent range reads, identical sha256 `1b775911…4069` | 10:08:05 |
| 4 | `crater-docs-labels-2026-11-27.json` (16 documents, labels and tables, each with its own sha256) | 372,635 | sha256 `b94590be…9071` (pane = Mac) | 10:08 (line 4) |

- **Route:** a browser-pane fetch, then MD5/SHA-256 in the page with the project's `mehash.js` (MD5 vector-checked: "abc" gives `90015098…7f72`), then a browser download to `~/Downloads`. Then a Mac re-hash, a copy to `_source-data/moon-lro-science-crater/` and a checkpoint line, all before the next fetch.
- The Downloads copies were moved to `~/Downloads/_to_delete-crater/` for Chad to trash.
- The workspace copies were re-hashed against the checkpoints before analysis (`assess_crater_output`, first block).

## 13. Options

| | What | Recommendation |
|---|---|---|
| **R1** | Off-by-default chart beside the dated example: CRaTER `GOOD` events per second, mean per 10-minute UTC bin, 10 June 2026, with ±√N/600 counting bars. A marker follows the drawing's existing time control (`craft-range`), and a readout names the bin, the value and the uncertainty. Text says where and what was measured, and what it is not. | **Recommended** |
| R1b | As R1 at 1-minute bins | Not recommended: mostly counting noise (§9) |
| R2 | Colour the dated path on the globe by count rate | **Not recommended**: draws noise geographically and invites a "radiation map" reading |
| R3 | A dose rate (mGy/day, silicon) computed by Mother Earth from event energies | **Not now.** Needs Spence et al. 2010 detector masses read in full, the flag inconsistency (§5.4.1) resolved, the offset-at-zero rule applied, and a 617.5 MB/day bulk acquisition under its own go. It would be our calculation and labelled as such. Revisit condition: Chad asks for dose |
| R0 | Assessed, not shown | Legitimate: closes item 5 with this record |

**Not proposed in any option:**
- a current or live value;
- a surface value;
- a map;
- the UNH or iSWA products;
- a second day shown (11 June is used only as a check day);
- any change to the path, the globe or other layers.

## 14. Wording drafts (for GPT; final text goes into a branch)

- **Button (off by default):** "Show what LRO's radiation telescope counted (CRaTER)".
- **Chart title:** "Particle events counted inside CRaTER on LRO, 10 June 2026 (UTC)".
- **Readout (format only; the numbers are illustrative, not computed for that bin):** "10:20–10:30 UTC: 29.8 events a second (± 0.2 from counting alone). Measured inside the instrument on LRO, 64–115 km above the Moon."
- **Under the chart:** "CRaTER counts charged particles and photons that pass its thresholds inside a shielded telescope on the spacecraft. These counts are not a radiation dose and not conditions on the Moon's surface. Most of the particles on a quiet day like this are galactic cosmic rays. The count stays near 30 a second all day. The bars show counting uncertainty only. Archived record (NASA PDS release 67), not a live reading."
- **Sources entry:** the product, the DOI, the release, the field (`GOOD`, "Good Events Counter"), the binning, and the pairing method and result (§7). Also the two archive notes from §5.4, phrased as observations.
- **Avoid:** "radiation level", "dose", "exposure", "safe/unsafe", "radiation on the Moon", "live", "now".

## 15. Tests planned for a branch (none run now)

- **Build:** re-hash the retained SEC files, rebuild the bins, assert them (145 bins, 600 s each, sums equal to the source), and pin the output.
- **Page:**
  - chart off by default, with no request before it is opened;
  - marker follows `craft-range` across all 1,441 positions;
  - readout at the first, last and bin-edge times;
  - nothing shown outside the interval;
  - a failed or mismatched file leaves the drawing and the path working;
  - narrow widths;
  - keyboard access and the text alternative.
- **Regression:** the Animals pins and the existing Moon suites, as the 26–27 Nov rules require.

## 16. Decisions for Chad

- **D1:** Proceed with R1 (recommended), or close item 5 as R0 ("assessed, not shown").
- **D2:** The quantity is `GOOD` events per second (recommended). Singles are excluded because of the D2 caveat.
- **D3:** The form is a chart in the dated-example drawing, following its time control (recommended). Not a path colour (R2).
- **D4:** The bin is 10 minutes, aligned to UTC (Claude's pick). 1 minute is R1b.
- **D5:** The interval is 10 June 2026 plus 11 June 00:00–00:10, to match the drawing's last minute (recommended).
- **D6 (optional, his to send):** a short note to the PPI Node about the two archive observations in §5.4. If he wants it, Claude drafts it as a copy-and-paste email that says Mother Earth is his personal control centre.

## 17. What GPT is asked to check

1. The meaning of `GOOD`, and the claim that it is a count per ~1 s readout inside the instrument. This includes the all-ones mask reading (§4).
2. Whether §8's environment/surface distinction and the wording in §14 are tight enough.
3. The pairing method and numbers (§7), including the time-tag interpretation.
4. Whether the flag observation (§5.4.1) is described with the right confidence.
5. The noise analysis (§9), and the recommendation against R1b and R2.
6. Rights wording (§10).

## 18. Evidence and limits

- **Scripts and outputs:** `docs/research/moon-crater/assess_crater.py` … `_4.py` with `_output-2026-11-27.txt`, run in Claude Science's compute tools in the workspace on the retained files; `checkpoints.jsonl`.
- **Limits:**
  - one 11-minute event slice;
  - two days of secondary data;
  - the SIS PDF and the instrument paper not read;
  - boresight not verified for June 2026;
  - the extra-Poisson variation at 10 minutes not explained;
  - nothing tested on a page;
  - the iSWA statement is from search-result text only.

## Change log
- Rev 1 (27 Nov 2026, 10:15 UTC onwards): first assessment and proposal.
