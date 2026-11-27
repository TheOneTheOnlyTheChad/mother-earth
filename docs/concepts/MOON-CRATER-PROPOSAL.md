# Moon item 5 — CRaTER (LRO's radiation telescope): assessment and proposal

Rev 2 · 27 Nov 2026, written from 10:32 UTC / 12:32 SAST (clock reading; rev 1 10:15 UTC) · Claude · **docs only: no page build, bulk acquisition, merge or deployment** · for GPT's recheck, then Chad's decisions.

**Chad's go (27 Nov 2026), rev 1:** "Go with Moon item 5: CRaTER. Assess one manageable archived radiation product or short dated interval, then return a docs-only proposal for GPT review. Establish the exact quantity, units, detector/channel meaning, calibration and quality rules, dates, spacecraft location, rights and data size. Keep spacecraft radiation measurements distinct from lunar surface conditions; assess any trajectory pairing before proposing it. Start with documentation and bounded samples, checkpoint each acquisition before proceeding, and return a feasibility conclusion. No page build, bulk acquisition, merge or deployment. Keep the remaining Moon checklist intact."

**Chad (27 Nov 2026), rev 2:** "Please prepare docs-only rev 2 addressing GPT's R1–R3. Keep the historical GOOD-event chart as the proposed form. No page build, bulk acquisition, merge or deployment."

**GPT's rev 1 review:** `reviews/2026-11-27-moon-crater-proposal-rev1-gpt-review.md` (filed unchanged; sha256 `24b623c5…f276`). **REVISE BEFORE BUILD**, R1–R3. It supports the 10-minute historical chart and the decisions D2–D5. It independently reproduced the counts and the position comparison. §0a maps each point to this rev.

Checklist: `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` item 5 (item 9, pairing, only as it serves item 5). Evidence: `docs/research/moon-crater/`. Retained source files: Mac `~/Documents/Mother Earth/_source-data/moon-lro-science-crater/` (unchanged since rev 1; no new acquisition in rev 2).

## 0. Bottom line (feasibility conclusion)

1. **Feasible, in one form: a historical chart of CRaTER's archived good-event counts on 10 June 2026**, the day of the dated LRO path the Moon tab already shows, plus one extra bin labelled "11 June 00:00–00:10 UTC" for the drawing's last minute.
   - The quantity is the instrument's `GOOD` counter: events counted per readout record inside the instrument.
   - It is not a dose, a particle flux or a condition at any place on the Moon.
2. **Time link, not position claim.**
   - Records are grouped by their **UTC record timestamps** (the archive's `TIME` field) into 10-minute bins.
   - The drawing's existing slider selects a bin. The dated path stays the only source of the spacecraft marker.
   - The 0.18–0.20 s offset found in rev 1 is kept as a **comparison diagnostic and timing hypothesis**, not a correction. Nothing is shifted (§7).
3. **What the chart shows, measured with the proposed rules** (`bins_preview.py`, §8):
   - all 145 bins are complete and nominal;
   - rates run from 28.860 to 32.788 events a second;
   - the approximate Poisson counting benchmark is about ±0.22 a second per bin.
   - One stretch, 12:40–13:10 UTC, sits 8–10% above the rest of the day. Its cause has not been determined (§9).
4. **Bars are an approximate Poisson counting benchmark, not total uncertainty.** They are √N ÷ T, Mother Earth's calculation, conditional on independent events. The 10-minute scatter on 10 June is 2.89 times that benchmark, and the chart says so (§8.3).
5. **No orbit colouring** (R2 in the options), **no dose, no flux, no surface value, no source attribution.** Rev 1's "quiet day", "no solar particle event" and "galactic cosmic rays" claims are withdrawn (§0a, R2).
6. **Recommendation:** R1 as below. R0 ("assessed, not shown") remains Chad's legitimate alternative.

## 0a. GPT's R1–R3 and what rev 2 does

| GPT | Rev 2 |
|---|---|
| **R1.1** timing convention documented, or kept as a hypothesis; no fitted correction applied | Kept as a labelled hypothesis and diagnostic (§7.1). No timing document was read for rev 2: the SIS PDF is still unread, and the bounded rule below does not need it. Nothing is shifted. |
| **R1.2** bin by the archive's UTC record timestamps; slider selects a bin; path the only marker; no per-particle position or footprint | §7.2, §7.4 |
| **R1.3** explicit bin edges and membership; no claim of exact arrival times | §7.2: left edge in, right edge out, on `TIME`; the readout/end-time limit stated |
| **R1.4** denominator; no silent zero; no full exposure for incomplete bins | §7.3: T = 600 s for exactly 600 nominal records; any other bin withheld; no live-time correction |
| **R1.5** label the 11 June bin; resolve rev 1's contradiction; minute 0 unavailable for interpolation | §7.4, §11 title; §7.1 table |
| **R1** (frame) MOON_ME is a general designation; same realisation not established | §7.1: "compatible", not "identical" |
| **R2** remove the origin/absence claims; narrow altitude, noise, flags, dose, housekeeping wording | §5.4, §9, §10, §11 |
| **R3** bar definition; builder contract; failure rules; schema; browser validation; tests | §8, §12, §13; preview builder and seven tamper cases run (§8.4) |

## 1. Scope, and what this item leaves alone

- **In scope:** CRaTER's archived products and one dated interval; whether, and how, a CRaTER record could appear on the Moon tab.
- **Unchanged (docs only):** every page file, the dated LRO path and its drawing, height, temperature, Apollo 11, "Lit as now", the Sky view (10a), the Tides Moon (10b), the hub (0.6.25), R2 and collectors.
- **The remaining checklist is untouched:**
  - 6, 7 and 8 stay "to assess";
  - 9 only here, as it serves item 5;
  - 11 is carried;
  - 12a–c are options;
  - 13 stays outside scope.
  - No current LRO position is proposed.

## 2. What was read

All of this was read by Claude in the browser pane, 27 Nov 2026, 09:58–10:14 UTC. The workspace shell is refused by the proxy for the PDS and UNH hosts.

| Source | What it settled |
|---|---|
| PDS PPI release listing; `lro-crater-20260914/Readme_2.4.txt` | Bundle `urn:nasa:pds:lro.crater` v2.4 = **Release 67, coverage added 2026-04-01 to 2026-06-30**; levels; file naming. The Readme dates versions 2.2–2.4 in 2025, while the collection label says `2026-09-14` (a Readme typo). |
| Collection inventories (release 67) | Day files `…_2026161` and `_2026162` listed; 6,181 days per collection |
| `document/data-der-desc.txt` (34,286 B), full text | Instrument and data description, record contents, calibration, uncertainties, quality review, the thick-detector singles caveat, limitations |
| `document/errata.txt` (47,011 B) | Release 67: "No known errors or variances". Release 66: power-off 2026-062; elevated/extreme modes 2026-019/020. Pointing-derived values use the original CK kernels |
| Labels `CRAT_L2_SEC_2026161/162_V01.xml`, `CRAT_L2_PRI_2026161/162_V01.xml` | Fields, byte locations, units, formats; record counts; MD5 and size |
| `GAPS_SEC/PRI/HK.TAB`, `MODE_CHANGES.TAB` | No gap and no mode-change entry in April–June 2026. These are instrument operation logs, not a catalogue of solar events |
| Directory listings `data-der-{sec,pri,hk}/2026/` and others | Sizes; the 2026 housekeeping holding issue (§5.4) |
| PPI Node FAQ and Citation Policy | Reuse terms (§10). GPT opened the FAQ independently |
| UNH legacy products, L30 daily dose-rate table | Runs 2009-06-26 to **2012-12-31**; mGy(Si) per day; "as measured" and "corrected for lunar shadowing" |
| UNH current site, Dose Rates form | A plot generator (2009–2026); no data download on the page opened; method text in images; no reuse terms found |
| NASA CCMC iSWA CRaTER page (**search-result text only, discovery**) | Says that its hourly dose rates are converted to water and "altitude corrected to the lunar surface". Used only to show that surface-referred values are modelled |

**Not read:** the VOLSIS SIS PDF (32-01211 Rev E); Spence et al. (2010), *Space Sci. Rev.* 150, 243–284. Neither is needed for R1.

## 3. The product

| Level 2 (derived) collection | Per day (June 2026) | Holds | Use |
|---|---|---|---|
| **Secondary science `CRAT_L2_SEC_yyyyddd_V01.TAB`** (DOI 10.17189/2c1t-ph72) | **86,400 records × 194 B = 16,761,600 B** | Per readout record: settings, status flags, singles, Good/Reject/Total counters, LRO position (MOON_ME, km) | **R1 source** |
| Primary science `CRAT_L2_PRI_…` (DOI 10.17189/q8hp-4554) | 2,573,044 records, 617,530,560 B (10 June) | One record per event: amplitudes, deposited energy (keV), LET (keV/µm), flags | 20,000-record slice only |
| Housekeeping `CRAT_L2_HK_…` | — | Voltages, temperatures, off-Moon and eclipse flags | Not found where expected for 2026 (§5.4) |

## 4. Quantity, units, detectors

- **Instrument** (`data-der-desc.txt`): six silicon detectors in three thin/thick pairs, D1/D2, D3/D4 and D5/D6. Thin detectors are 148–149 µm and thick ones 1,000 µm, derived as energy ÷ LET in the slice. The primary goal is LET spectra.
- **An "event"** is a signal pattern above the lower-level discriminators (LLDs) in a combination of detectors allowed by the coincidence mask. Only those are telemetered. GPT notes, and rev 2 adopts, that **"event" does not mean one identified incident particle.**
- **R1 quantity: `GOOD`, "Good Events Counter"** (label field 27): the count per readout record. The label gives no unit.
  - In the 674 complete seconds of the slice, the primary-science record count equals `GOOD` in every second (GPT reproduced this).
  - The rate depends on the instrument's thresholds, coincidence selection and operating state.
  - It is **not** a dose, a dose equivalent, a flux or a surface value, and is not convertible to flux without the instrument's geometric factors and efficiencies. Those are not used and not claimed.
- **Settings on 10–11 June, constant in all 172,800 records:**
  - bias on;
  - calibration pulser off;
  - all six detectors processing;
  - `DISCTHIN` 71 and `DISCTHICK` 71 (no unit given);
  - the mask 4,294,967,295 in both 32-bit halves.
  - Rev 2's wording on the mask, after GPT: all 64 mask bits are set, so **every documented coincidence pattern is permitted**. That says nothing about efficiency or about accepting every physical particle.

## 5. Calibration and quality

### 5.1 Calibration (from the team's description)
- Ei [keV] = Gi·Ci + Oi, with V1.0 constants (Spence et al. 2010, table 6).
- "The uncertainty in the Gi and Ci values awaits further analysis"; total uncertainty for energy and LET also "awaits further analysis".
- Configuration and housekeeping values carry "no statement of uncertainty".
- **Slice checks:** energies match Gi·AMPL+Oi within 0.53%. **At amplitude 0 the energy field equals the offset Oi, not 0**, on all six detectors.
- R1 uses no energy field.

### 5.2 Quality rules the archive states
- Bad or duplicate packets are discarded, and gaps are recorded.
- Calibration and special periods are inside the data. Users detect them from `CALLOW`, `CALHIGH`, `DISCTHIN` and `DISCTHICK`. **R1's nominal rule (§7.3) excludes any record that differs.**
- **Thick-detector singles caveat:** sporadic elevations, mostly in D2, have an undetermined cause. **"During these periods increases may occur in both the 'reject' and 'good' event rates."** So choosing `GOOD` does not make the chart immune.
  - **Seen, 11 June 19:10–19:40 UTC:** D2 singles 22.8–65.8 a second and REJECT 1.4–5.6 a second, against a usual 10.7 and 0.5. GOOD meanwhile was 29.17–29.79, within its range for that day (`bins_preview_output`).
  - That describes this one episode only. It is outside the chart's interval except as a check day.
- **Errata, release 67:** "No known errors or variances."

### 5.3 Time fields as documented
- `SECONDS`: "Spacecraft Time (elapsed seconds from epoch 2001-01-01T00:00:00.000 UTC). Derived from spacecraft clock time."
- `FRACT`: hundredths of a second, also from the spacecraft clock.
- `TIME`: "Spacecraft Time--UTC (yyyy-mm-ddThh:mm:ss)", a whole-second string.
- The description says primary-event times are the time "at the end of the measurement interval (receipt of spacecraft timing pulse)". Events within a readout share that time; order is kept, exact times are not.
- **Observed:** `SECONDS` of the first 10 June record is 802,742,400, which equals the UTC seconds from 2001-01-01 to 2026-06-10. Records step exactly 1 s; `FRACT` is 18 on both days. These are observations; they do not establish an exact UTC epoch for the counters or the vector (§7.1).

### 5.4 Archive observations (recorded; neither used nor corrected)
1. **A suspected label/column inconsistency in the L2 primary-science flags,** observed in one 11-minute slice.
   - The column at byte 228 (labelled `GTLLDFLAGS`, "exceeds LLD") equals "amplitude > 95% of 4,095" on every event: the description's near-saturation definition.
   - The column at byte 216 (labelled `MAXSIGFLAGS`) is set on thick detectors from about 6–7 ADU, and on every thin-detector event, including amplitude 0. That thin-detector behaviour is unexplained.
   - **Not confirmed as a swap.** Not checked against the SIS or other days. The retained data are not relabelled.
   - Rev 1's script line that summed energy by the labelled column is marked superseded.
2. **2026 housekeeping holding issue.**
   - `data-der-hk/2026/` lists 182 entries (the first is day 2026-091), all Level 0 `CRAT_L0_HK_…_V02.DAT` files and labels: the kind of file `data-raw-hk/2026/` holds (362 entries).
   - The collection inventory lists `crat_l2_hk_2026161`, and `data-der-hk/2025/` holds Level 2 normally. GPT did not inspect the listing itself.
   - **Effect:** no off-Moon or eclipse flags were available to this assessment for June 2026. That limits physical interpretation of the counts (boresight, eclipse), although the uninterpreted counter chart does not use those flags.

## 6. Dates and coverage

- **Release 67**, published 15 Sep 2026, covers 2026-04-01 to 06-30.
- Release 68 (July–September) would be due about mid-December 2026 by the quarterly pattern. This is an estimate.
- **Interval:** 10 June 2026 (DOY 161), with 11 June (DOY 162) as a check day and the source of the one extra bin.
- **Files:** server times 12 Jun 2026 10:14:27 GMT (161) and 16 Jun 2026 10:02:59 GMT (162); labels 14 Sep 2026; V01.

## 7. Time and position

### 7.1 The comparison with the page's path: compatibility, not a correction
- **What the record carries:** `MOONVEC 1–3`, the "Moon-to-Spacecraft Vector (MOON_ME)", km, `%11.4e` (worst-case rounding 0.05 km). The description says it comes from definitive SPK/CK kernels via NAIF routines.
  - It is not a footprint or a pointing direction.
  - **MOON_ME is the general frame designation.** The page's path uses the specific realisation `MOON_ME_DE440_ME421`. That the two use the same kernels or frame realisation is **not established**; the comparison shows them compatible at this level.
- **On 10 June:** 64.81–115.17 km above the 1,737.4 km sphere; latitude −84.09° to +84.09°.

| Comparison with `assets/moon/craft-moon-me-2026-06-R1.json` | n | Median km | Max km |
|---|---|---|---|
| CRaTER record of the same whole UTC second (`TIME`), as archived | 1,441 | 0.3226 | 0.3810 |
| Hypothesis: the vector belongs at `SECONDS` + `FRACT`/100; interpolated to page times | 1,440 | 0.0339 | 0.0814 |
| Same + a further 0.02 s fitted to this path (diagnostic only) | 1,440 | 0.0231 | 0.0640 |
| Minute 0 (10 June 00:00:00) | — | unavailable: earlier than the first CRaTER tag, so no interpolation | — |

(Sources: `assess_crater_output`, `_2_output` (b), `_3_output`; GPT reproduced the 1,440-point medians and maxima.)

- **Reading:** the as-archived difference is consistent with a sub-second time-tag difference at LRO's speed (median 1.6387 km/s). Under the hypothesis, the residual falls to the level of the archive's rounding.
- **This supports time and frame compatibility for a coarse chart. It does not validate a clock conversion:** the 0.02 s was fitted against the same path. **No offset is applied to anything the chart shows.**

### 7.2 Binning by UTC record timestamps (the chart's rule)
- Each record is placed by its archive `TIME` string, read as UTC whole seconds and validated (§12).
- **Bin k covers [start_k, start_k + 600 s): the left edge is included, the right edge excluded.**
  - 144 bins on 10 June: 00:00, 00:10 … 23:50.
  - One bin 2026-06-11 00:00–00:10.
- **Stated limit:** each record is one readout (about a second), tagged at its readout. A bin is a group of records by timestamp. It is **not** exact knowledge of when every event inside it happened. The chart and Sources say "grouped by UTC record time".

### 7.3 Denominator, completeness and nominal records
- **Nominal record:**
  - `BIASCNTRL` 1, `BIASCMD` 1;
  - `CALLOW` 0, `CALHIGH` 0;
  - `PROCDFLAG 1–6` all 1;
  - `DISCTHIN` 71, `DISCTHICK` 71;
  - `MASK 1` = `MASK 2` = 4,294,967,295.
  - These are the values in every record of both days.
- **A bin is shown only when it holds exactly 600 records, one for each whole UTC second, all nominal.** Then T = 600 s (one second per readout record).
  - **No live-time or dead-time correction is applied**, and the chart says so.
- **Any other bin is withheld**, with its reason and its record counts:
  - never zero-filled, interpolated or smoothed;
  - never divided by a nominal 600 s when incomplete.
- (Withholding rather than a partial-bin rate is Claude's pick, D7.)
- On 10 June and in the extra bin, all 145 bins are complete and nominal.

### 7.4 Link with the drawing
- The existing slider (`craft-range`, 1,441 one-minute positions, 10 June 00:00 to 11 June 00:00 UTC) selects **the bin that contains its time**.
- Slider 00:00 selects 00:00–00:10; slider 00:10 selects 00:10–00:20.
- The final position, 11 June 00:00, selects the bin labelled **"11 June 00:00–00:10 UTC"**, and the readout names it.
- The path marker stays where the path puts it. The chart draws no position of its own, no footprint and no per-event location.

## 8. The chart's numbers (measured with the rules above)

### 8.1 Preview builder
- `docs/research/moon-crater/bins_preview.py` applies §7.2–§7.3 and §12's parse rules to the retained files and writes `bins-preview-2026-11-27.json`.
  - The output is 28,242 B, sha256 `4c3a1d57…d2df`, in a verbose preview schema.
  - A served file would use a compact form, measured on a branch.
- **Result:** 145 bins, all shown, none withheld.
- The 10 June bins sum to **2,573,044**, equal to the day's `GOOD` total (GPT's figure).

### 8.2 Examples

| Bin (UTC) | GOOD events | Rate, events/s | Counting benchmark, ± events/s |
|---|---|---|---|
| 10 Jun 00:00–00:10 | 17,845 | 29.742 | 0.223 |
| 10 Jun 10:20–10:30 | 17,992 | 29.987 | 0.224 |
| 10 Jun 12:50–13:00 (highest) | 19,673 | 32.788 | 0.234 |
| 10 Jun 06:10–06:20 (lowest) | 17,316 | 28.860 | 0.219 |
| 10 Jun 23:50–24:00 | 17,849 | 29.748 | 0.223 |
| 11 Jun 00:00–00:10 (extra bin) | 17,787 | 29.645 | 0.222 |

All values are read from `bins-preview-2026-11-27.json`.

### 8.3 Bars
- **Rate = N ÷ T.**
- **Bar = √N ÷ T:** an **approximate one-standard-deviation Poisson counting benchmark**, conditional on independent events and the stated convention (T = 600 s per complete bin). It is **Mother Earth's calculation, not an archive error field.**
- It excludes timing, dead time, configuration and systematic effects, and physical variability. It is **not** a 95% interval or a total uncertainty.
- The 10-minute scatter on 10 June is 2.89 times this benchmark (2.89 = SD ÷ benchmark; GPT reproduced 2.8861), so the bars **do not** contain the observed variation. The chart says so.

### 8.4 Failure cases run on the preview builder (`bins_preview_output`)

| Tamper | Outcome |
|---|---|
| one record removed (01:00:05) | bin 01:00–01:10 withheld, "incomplete", 599 records; the other 144 shown |
| duplicated record | build stops: TIME not strictly increasing |
| two records swapped | build stops: TIME not strictly increasing |
| `CALLOW` = 1 at 02:01:40 | bin 02:00–02:10 withheld, "non-nominal setting" (599 of 600 nominal) |
| `GOOD` = −1 | build stops: negative integer field |
| `TOTAL` ≠ `GOOD` + `REJECT` | build stops |
| `TIME` 00:01:61 | build stops: not a valid UTC time |

One correction during the run: the first version of the time-tamper case wrote at the wrong byte offset and stopped on "field count" instead. It was fixed and rerun.

## 9. What the record shows, and what is not established

- **Per-minute and 10-minute variation** (`assess_crater_4_output`; GPT reproduced the ratios). Per-minute SD ÷ Poisson benchmark is 1.346 (10 June) and 1.172 (11 June); at 10 minutes, 2.886 and 1.991. So there is variation beyond the counting benchmark at the 10-minute scale. **Its causes have not been determined here.**
  - Rev 1's "mostly counting noise" was an interpretation and is withdrawn.
  - Serial dependence was not analysed.
- **Altitude:** in this series the association with altitude is small (Pearson r 0.066 and −0.043 for per-minute sums; highest and lowest altitude fifths differ by 0.87% and 0.02%). **This is not evidence that there is no physical altitude dependence.** No causal reading is made.
- **10 June 12:40–13:10 UTC** (`assess_crater_5_output`):
  - GOOD 32.0–32.8 a second, against a 29.78 day mean.
  - In the same bins the three thick detectors' singles are up together (S2 12.0–12.4, S4 11.4–11.8, S6 11.9–12.5, against day means 11.7, 10.6 and 11.1). REJECT (0.46–0.52) and the thin detectors are not up.
  - LRO was moving from about 8°N to 82°S and from 75 to 109 km.
  - The previous orbit's pass over similar latitudes (11:00–11:30) shows no such rise.
  - **The cause has not been determined.** Neither a space-environment change nor an instrument or attitude effect is claimed. The chart shows the bump as recorded.
- **Withdrawn from rev 1:** "a quiet day", "no solar particle event in the interval", "most particles … are galactic cosmic rays".
  - The mode-change and gap tables are instrument operation logs, not a solar-event catalogue.
  - Nothing in this assessment identifies what produced the counted events on this day.

## 10. Rights, dose products, attribution

- **PPI Node FAQ** (read by Claude and independently by GPT, 27 Nov 2026): "Data sets archived in the PDS are in the public domain"; when used, "they should be cited appropriately".
- **Citation:** Spence, H.E. (2026), "LRO CRaTER Lunar Derived Energy Data Secondary Science Data Collection", NASA Planetary Data System, `urn:nasa:pds:lro-crater:data-der-sec` v2.4, DOI 10.17189/2c1t-ph72. Bundle DOI 10.17189/jr9s-6678. Instrument paper Spence et al. 2010, doi:10.1007/s11214-009-9584-8.
- **No endorsement by NASA or UNH is implied.** Mother Earth makes no commercial use.
- **Dose:** **no suitable dose product was identified among the holdings inspected for this interval** (PDS CRaTER release 67; the UNH legacy table to 2012; the UNH plot generator without data download or terms; iSWA from search text only). R3 stays outside this proposal. A future revisit starts with fresh product discovery and validation, not an assumed derivation from event files.

## 11. Proposed form (R1) and wording (drafts for GPT; final text goes into a branch)

**R1:** an off-by-default chart inside the dated-example drawing on `moon.html`.
- One rate per complete 10-minute bin, with benchmark bars.
- Withheld bins are drawn as gaps with their reason.
- The bin selected by the drawing's slider is highlighted, with a text readout and a text alternative.
- Data come from one small pinned file in `assets/moon/`, fetched only on opening.
- No hub, R2 or collector change.

- **Button:** "Show CRaTER's event counts (dated record)".
- **Title:** "CRaTER good-event counts on LRO, 10 June 2026 (UTC), plus 11 June 00:00–00:10".
- **Readout (format; the numbers are the preview's):** "10:20–10:30 UTC (grouped by record time): 29.99 events a second, ±0.22 counting benchmark. Instrument counts on LRO, not a dose or a surface value."
- **Explanation (GPT's suggested text, adopted):** "Archived good-event counts recorded by CRaTER on LRO. The rate depends on the instrument's detector thresholds, coincidence selection and operating state. These are instrument event counts, not a radiation dose, a particle flux or conditions at a place on the Moon's surface. This record stays near 30 events per second; the causes of its variation have not been determined here."
- **Bars note:** "Bars are an approximate counting benchmark (√N ÷ 600 s) calculated by Mother Earth. They leave out timing, dead time, instrument effects and real variation, and they do not cover the scatter seen between bins."
- **Coverage note:** "10-minute groups by UTC record time; a group is shown only when all 600 one-second records are present and the instrument settings are nominal. No live-time correction. Archived record (NASA PDS release 67), not a live reading."
- **Sources entry:** product, DOI, release, field, binning and completeness rules, bar definition, the §7.1 comparison as a diagnostic, and the two §5.4 observations as observations.
- **Avoid:** "radiation level", "dose", "exposure", "safe/unsafe", "radiation on the Moon", "cosmic rays" (as identification), "quiet", "live", "now", and "particles" for events.

## 12. Build contract (for a branch, after Chad's go)

- **Inputs:** the two retained SEC files, pinned by archive MD5 and sha256 (`checkpoints.jsonl` lines 1–2). A mismatch stops the build.
- **Strict parse:**
  - 194-byte CRLF records with 32 fields;
  - `TIME` a quoted `YYYY-MM-DDThh:mm:ss`, valid as UTC and on the file's day;
  - `TIME` strictly increasing with no duplicates;
  - integer counters non-negative; MOONVEC finite;
  - `TOTAL` = `GOOD` + `REJECT`.
  - Any failure stops the build.
- **Per bin:** §7.2–§7.3. An incomplete or non-nominal bin is withheld with its reason and counts. The build asserts the bin sums against the source total.
- **Output schema (compact form of the preview):**
  - schema id and kind ("dated example");
  - provenance (product, DOI, release, files with hashes, field);
  - the binning convention text, completeness rule, bar definition and units;
  - per bin: start/end (UTC, `[start, end)`), records, nominal records, then either `good_events`, `exposure_s`, `rate_per_s`, `benchmark_per_s`, or `withheld` with its reason.
- **Browser:**
  - fetch only on opening, with sha256 against the pin and whole-payload shape and value checks before drawing;
  - one request at a time, with a deadline, and stale answers discarded;
  - a retry only on the user's next opening;
  - any failure shows "CRaTER chart unavailable" and leaves the drawing, slider, path and globe working.

## 13. Tests planned for a branch (none run beyond §8.4)

- **Build:** hashes; the seven tamper cases of §8.4 (outcomes as tabled); bin sums equal the source total; first, last and exact-edge membership (a record at 00:10:00 is in the second bin, not the first); a zero-count bin shown as zero, distinct from a withheld bin.
- **Page:**
  - off by default, with no request before opening;
  - the slider selects the right bin at 00:00, 00:09, 00:10, 23:59 and 11 June 00:00 (the extra bin's label);
  - a withheld bin shows a gap and a reason, not zero;
  - hash failure, malformed payload, slow and late answers;
  - a failure leaves the drawing working;
  - keyboard access and text alternative; narrow widths.
- **Regression:** Animals pins and the Moon suites touched by the change, as the 26–27 Nov rules require.

## 14. Options

| | What | Recommendation |
|---|---|---|
| **R1** | The chart in §11 | **Recommended** (GPT supports it) |
| R1b | 1-minute bins | Not recommended at this resolution of evidence (§9) |
| R2 | Colour the path by count rate | **Not recommended:** places counts geographically and invites a "radiation map" reading |
| R3 | A dose rate | Outside this proposal (§10) |
| R0 | Assessed, not shown | Legitimate owner choice |

## 15. Decisions for Chad

- **D1:** R1 (recommended) or R0.
- **D2:** `GOOD` (recommended; GPT supports).
- **D3:** time chart, not path colour (recommended; GPT supports).
- **D4:** 10-minute bins grouped by UTC record time (recommended; GPT supports).
- **D5:** 10 June plus the labelled 11 June 00:00–00:10 bin (recommended; GPT supports).
- **D6 (optional, not a blocker):** a note to the PPI Node about §5.4. Drafted only if Chad asks; never sent automatically.
- **D7 (new):** incomplete or non-nominal bins are **withheld** (Claude's pick), rather than shown with a reduced exposure. On these days none are affected.

## 16. What GPT is asked to recheck

1. §7.1–§7.4: whether the timing is now described at the right strength, and the bin and slider rules.
2. §7.3 and §8.3: the denominator, completeness and bar definition.
3. §9 and §11: the narrowed claims and the wording, including the 12:40–13:10 description.
4. §12–§13: whether the build and browser contract and the tests are sufficient.

## 16a. Files changed in rev 2

- **Proposal:** this file.
- **Review filed:** `reviews/2026-11-27-moon-crater-proposal-rev1-gpt-review.md`.
- **New evidence:** `docs/research/moon-crater/bins_preview.py`, `bins-preview-2026-11-27.json`, `bins_preview_output-2026-11-27.txt`, `assess_crater_5.py`, `assess_crater_5_output-2026-11-27.txt`, plus the README update.
- Retained acquisitions and checkpoints unchanged.

## 17. Evidence and limits

- **Scripts and outputs:** `docs/research/moon-crater/` (README lists each). Run in Claude Science's compute tools in the workspace on the retained files.
- **Limits:**
  - one 11-minute event slice;
  - two days of secondary data;
  - the SIS PDF and the instrument paper not read;
  - boresight and eclipse state not available for June 2026;
  - extra-Poisson variation and the 12:40–13:10 rise not explained;
  - serial dependence not analysed;
  - nothing tested on a page;
  - iSWA from search text only.

## Change log
- Rev 1 (27 Nov 2026, 10:15 UTC onwards): first assessment and proposal.
- Rev 2 (27 Nov 2026, 10:32 UTC onwards): answers GPT's R1–R3.
  - Timing kept as a hypothesis, with no correction.
  - Binning by UTC record timestamps; denominator and completeness rules; extra bin labelled.
  - Origin, absence and noise claims withdrawn; flags described as a suspected inconsistency; dose wording narrowed; housekeeping described as a holding issue.
  - Bar definition; build and browser contract; preview builder and seven tamper cases.
  - The 12:40–13:10 rise described; D7 added.
