# Moon item 6 — LEND (LRO's neutron detector): assessment and proposal

Rev 1 · 27 Nov 2026, written from 16:18 UTC / 18:18 SAST (clock reading) · Claude · **docs only: no page build, bulk acquisition, merge or deployment** · for GPT's review, then Chad's decisions.

**Chad's go (27 Nov 2026):** "Continue with Moon item 6: LEND, using the bounded assessment instructions already agreed. Start with archive documentation while folder access is being connected. Return a docs-only feasibility assessment and proposal for GPT review. Keep neutron measurements distinct from inferred hydrogen and accessible water ice. No page build, bulk acquisition, merge or deployment."

**Bounded instructions (checklist item 6):** identify the LEND products (count-rate maps and any derived hydrogen maps), read their labels and method notes, fetch one bounded sample; record the resolution and the published interpretation limits, including any published scientific debate about the instrument's spatial resolution, cited from sources.

Checklist: `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` item 6. Evidence: `docs/research/moon-lend/` (scripts, outputs, `checkpoints.jsonl`). Retained source files: Mac `~/Documents/Mother Earth/_source-data/moon-lro-science-lend/`.

## 0. Bottom line (feasibility conclusion)

1. **Three different things, kept apart throughout:**
   - **Neutron measurement** — what LEND archived: counts of neutrons at the spacecraft, corrected and averaged onto a map grid. This is what the archive holds and the only thing proposed for display.
   - **Inferred hydrogen** — a model-dependent conversion of a reduced epithermal-neutron rate into "water-equivalent hydrogen" in roughly the top metre of regolith. It exists only in publications by several teams using different methods. **No hydrogen product is archived in the PDS LEND bundle.** Not proposed.
   - **Water ice, and accessible water ice** — LEND does not measure either. A hydrogen inference says nothing by itself about the hydrogen's chemical form, whether it is ice, its depth distribution below the sensed layer, or whether anyone could reach or extract it. Never claimed.
2. **Feasible, in one bounded form: an optional polar map of LEND's archived collimated epithermal count rate (`CSETN`), averaged over 2011-12-11 to 2016-09-14**, shown as the percent difference from the 80–85° band of the same pole, smoothed over a stated 30 km display disc, with uncertain cells withheld (option L1, §8).
   - The archived signal is real but small. Near Cabeus, Shoemaker and Faustini the 30 km means are 0.8–1.0% below discs at the same latitude (2.0–3.4 times the control scatter; §6.3). Single 0.5° cells are dominated by counting noise (§6.2).
   - The instrument's effective spatial resolution is **disputed in published work**, from about 5–10 km (team documents) through a 30 km footprint to "at least" that of an uncollimated detector at 50 km (§5). The page must say so and must not imply crater-scale resolution.
3. **Archive state:** the averaged map products (`ALD`) were last updated in PDS Release 29 (2017-03-15). Every later release, 30 through 67 (2026-09-15), says ALD is not included (all 38 checked in the retained release notes). The time series (`DLD`) continues to 2026-03-14. A newer map would mean building one from about 5,500 daily files, a bulk acquisition and our own processing: not proposed (§9).
4. **Two document inconsistencies, recorded, not resolved (§4.3):** what the stored `CSETN_RATE` number is (the catalog says a unitless normalised ratio; the stored values are about 4.9, the magnitude of counts per second), and whether a spacecraft background has been subtracted. The proposed percent display does not depend on a constant scale factor, but an unsubtracted additive background would dilute the contrast. So the page would say "difference in the archived count rate", never "difference in neutron flux".
5. **Recommendation:** L1 for the south pole (sample in hand), plus the north pole if Chad approves one more bounded file (D2). **L0 ("assessed, not shown") is a legitimate alternative**, given the small signal and the disputed resolution. L2 (a short crater readout instead of a map) is the middle way.

## 1. Scope, and what this item leaves alone

- **In scope:** the LEND archive, one bounded sample, the published interpretation limits, and whether and how a LEND record could appear on the Moon tab.
- **Unchanged (docs only):** every page file, the Moon globe and its layers (height, temperature), the dated LRO path and the CRaTER chart, Apollo 11 detail, "Lit as now", the Sky view (10a), the Tides Moon (10b), the hub (0.6.25), R2 and collectors.
- **The rest of the checklist is untouched:** 7 and 8 stay "to assess"; 9 only where it serves an item (nothing here pairs with the path); 11 carried; 12a–c options; 13 outside scope.

## 2. What was read (by Claude, browser pane, 27 Nov 2026, from about 16:05 UTC)

The workspace and the Mac shell are both refused by the proxy for the PDS host (HTTP 403 on CONNECT), so everything came through the browser pane. Each document's bytes and sha256 are retained (§3, file 2).

| Source | What it settled |
|---|---|
| PDS Geosciences Node LEND page (`missions/lro/lend.htm`, last updated 29 Sep 2026) | Release 67 (15 Sep 2026): EDR/RDR to 14 Jun 2026; DLD/DLX 15 Dec 2025–14 Mar 2026. Producer: LEND Science Team, University of Arizona. One bundle. |
| `bundle_lend.xml` | `urn:nasa:pds:lro_lend` v2.0, "Lunar Reconnaissance Orbiter LEND Data Bundle", Mitrofanov, I. (2022), DOI 10.17189/p89b-8w72 |
| `data/` collections and inventories | Collections: raw and reduced science and housekeeping, derived (DLD 5,511 products, DLX 5,510; the inventory's last entries are DLX for 2026-03-13 and 2026-03-14), **averaged (ALD), 6 products**. No hydrogen or water product. |
| `collection_data_science_averaged.xml` | "LRO LEND Averaged Science Data Collection", Mitrofanov, I. (2023); 2009-09-15 to 2016-09-14; processing level Derived |
| ALD labels (PDS4 `.xml` and PDS3 `.lbl`) for `alds`, `aldn`, `alde` | Grids, periods, fields (§4) |
| `catalog/rdr_ds.cat` (RDR data set description) | Processing summary, ALD normalisation statement, coordinate system (mean Earth/polar axis, east-positive 0–360) |
| `catalog/inst.cat`, RDR SIS (`lend_rdr_sis.htm`, 10 Jun 2016) §2.1, §2.3.2, §3.4 | Instrument; the "5 km at 50 km" statement; ALD binning equations (counts/s per cell); −1 conventions |
| `lend_data_processing.htm` (Boynton et al., the PDS processing document) | SPE exclusion, outlier limit, off-nadir limit (1.9°), warm-up and cosmic-ray corrections, uncertainty weighting |
| `errata.txt` (through Release 52) and `lend_release_notes.txt` (through Release 67) | ALD last updated Release 29; "DLD and ALD detector values of -1 should be ignored and not used in mapping"; ALD not included in every later release |
| PDS Geosciences Node FAQ (page last modified 12 Oct 2026) | "Data sets archived in the PDS are in the public domain." |
| IAU Gazetteer of Planetary Nomenclature (crater search, read in the pane) | Centres of Cabeus, Shoemaker, Haworth, Faustini, Amundsen (§6.3) |
| arXiv abstract pages, read in full: Eke et al. 2012 (1108.2048), Teodoro et al. 2014 (1304.8123), Su et al. 2021 (2104.03451), McClanahan et al. 2023 (2303.03911) | The resolution debate (§5) |
| Search results only (discovery level, full text **not** read): Sanin et al. 2017 (Icarus 283, 20–30); Livengood et al. 2018 (NTRS 20180004020); NASA science nugget on Sanin et al. 2017; Mitrofanov et al. 2010 and the 2011 technical comment and response | Named only as examples of published hydrogen inference and of the debate. **No number from them is proposed for the page.** If any is ever quoted, its methods must be read in full first. |

## 3. Acquisitions (checkpoint per file, before the next)

| # | File | Bytes | sha256 | Checks |
|---|---|---|---|---|
| 1 | `lend_rdr_alds_20111211.dat` (ALD south pole, 2011-12-11 to 2016-09-14) | 4,464,000 | `e6b1c2d5…0031ef` | two pane reads identical; = 14,400 rows × 310 B per label; the archive publishes no checksum for it; server last-modified 21 Feb 2017 |
| 2 | `lend-docs-labels-2026-11-27.json` (19 documents and labels as served, each with its own sha256) | 1,095,765 | `7283e751…ff34ab` | pane hash = Mac hash; all 19 HTTP 200; all 19 inner hashes reproduce from the stored text |

- Total 5,559,765 B. Checkpoints in `docs/research/moon-lend/checkpoints.jsonl` (copy of the Mac file, sha256 `7520b760…ebbaa`). Entry 2 carries a correction line: its "fetched 16:14Z" was an estimate and is wrong (it was fetched between 16:13:03Z and 16:13:29Z). The hashes are unaffected.
- **Not acquired:** the north-polar (`aldn`, 4,464,000 B) and equatorial (`alde`, 17,856,000 B) files, the 2009–2011 period, any DLD/DLX. These are left for Chad's decisions (D1, D2).

## 4. The product

### 4.1 What LEND is (archive documents)

- Eight ³He neutron counters plus a stilbene scintillator (SHEN). Four of the ³He counters, **CSETN1–4, sit inside a collimator** (polyethylene and ¹⁰B, with Cd shields absorbing neutrons below about 0.4 eV), so they count epithermal neutrons. The other four (SETN, STN1–3) are uncollimated.
- LEND counts every ~1 s. Times are UTC at mid-interval; positions use the mean Earth/polar axis frame, east-positive longitude 0–360.

### 4.2 ALD south polar product (the sample)

- **Grid:** 0.5° × 0.5°, 80–90°S: 20 latitude bands × 720 longitude cells = 14,400 rows, from 89.75°S at 0.25°E, longitude increasing eastward (checked in the file: row 0 at −89.75/0.25, row 720 at −89.25/0.25).
- **Period:** every row carries start 2011-12-11T00:00:00.000 and stop 2016-09-14T00:00:00.000. One average over the whole period, not a time series. (The data-set catalog's "synodic period" temporal binning does not describe these files; the SIS change log records "ALD format changed to 3 maps NP, SP, equatorial", and the errata call them "3 yearly maps". Recorded as a document inconsistency, not used.)
- **Fields:** per detector group (STN1, SETN, STN2, STN3, CSETN): `_EXPOSURE` (s), `_RATE` ("relative count rate"), `_ERR` ("statistical error"); plus 16-element SHEN groups.
- **In this file only CSETN and STN1 hold data.** SETN, STN2 and STN3 are −1 with zero exposure in all 14,400 rows.
- **CSETN coverage:** 13,413 usable cells; 987 are −1 with zero exposure (all 720 cells at 89.75°S, 231 at 89.25°S, 36 at 88.75°S). Per the errata, −1 values "should be ignored and not used in mapping". Missing is never zero.
- **CSETN values (usable cells):** exposure median 384 s (1 to 1,036 s); stored rate median 4.926 (1st–99th percentile 3.999–5.771); stated error median 0.191; relative error median 3.8%.
  - Low-exposure cells near the pole include rates of exactly 0 at 1–2 s exposure. These are counting outcomes, not "no neutrons". A display must withhold by uncertainty, not by value.

### 4.3 Recorded inconsistencies (archive not rewritten)

1. **What the stored number is.** The data-set catalog says the ALD rates are normalised by a reference region's average and "are unitless". The label calls them "relative count rate". The SIS §2.3.2.2 equations define the cell value as an average counting rate in counts per second. The stored values (median 4.93) have the size of the summed four-sensor count rate in the processing document (about 1.25 counts/s per sensor), not of a ratio near 1.
2. **Background.** The catalog and SIS say the ALD uses background-subtracted counts. The SIS says DLD carries no spacecraft background subtraction. Teodoro et al. (2014), summarising Eke et al. (2012), say more than half of the CSETN count rate comes from cosmic rays striking the spacecraft (search-result text of the paper, not its abstract). A stored value of about 4.9 is hard to reconcile with a large subtracted background, but the documents read do not settle it.
- **Consequence for display:** a percent difference within the same file is insensitive to a constant scale factor (point 1), but an unsubtracted additive background would make the percent contrast smaller than the lunar neutrons' own contrast (point 2). So the proposed wording is "percent difference in the archived count rate", never "in neutron flux" and never a hydrogen amount.

## 5. Spatial resolution: a published, unresolved dispute

| Source | Statement (paraphrased unless quoted) |
|---|---|
| LEND instrument catalog and RDR SIS §2.1 | The collimation provides mapping of epithermal neutrons "with the horizontal resolution of 5 km for LRO at an altitude of 50 km". |
| Su et al. 2021 (arXiv 2104.03451; this statement is from search-result text, not the abstract read in full) | CSETN's nominal resolution is described as a 10 km diameter. |
| McClanahan et al. 2023 (arXiv 2303.03911, abstract) | Uses a "fixed 30 km diameter footprint" for CSETN, removes the uncollimated part with a bandpass filter, and states that claims for CSETN's high resolution have been the subject of "vigorous and still unresolved debate". |
| Eke et al. 2012 (ApJ 747, 6; abstract) | At least 90% of the lunar part of the CSETN rate comes from neutrons passing through the collimator walls; the effective FWHM is comparable with the uncollimated Lunar Prospector spectrometer. |
| Teodoro et al. 2014 (arXiv 1304.8123, abstract) | From autocorrelation and power spectra, CSETN's footprint is at least as big as expected for an omnidirectional detector at 50 km; the collimated flux is negligible. |

- **Mother Earth takes no side.** The page would state that the resolution is disputed, name both positions with their sources, and say that the 30 km display smoothing is our choice (§8). It is not the instrument's resolution, and it is not evidence for either position.
- **What the sample itself says (§6):** at 0.5° (about 15 km in latitude) neighbouring cells differ by what counting noise predicts. Structure appears only after averaging over tens of km. That fits every position in the table; it does not test them.

## 6. Measurements on the sample (`docs/research/moon-lend/`)

### 6.1 `assess_lend_1.py` (layout from the file's own label, hashes checked first)

Grid, coverage, field statistics and missing cells as in §4.2. Output: `outputs/assess_lend_1.out.json`.

### 6.2 Cell-scale noise

- Along the 85.25°S ring, 719 neighbour pairs: rms difference 0.2585 against 0.2551 expected from the stated errors (ratio 1.013).
- So a map of native 0.5° cells would mostly show counting noise.

### 6.3 Named craters against same-latitude controls (`assess_lend_2.py`)

- Inverse-variance means of CSETN in 30 km discs around crater centres from the IAU Gazetteer, compared with 30 km discs every 15° of longitude at the same latitude (centres within 90 km of the crater excluded).
- The poleward decline (ring medians about 4.96 at 80°S, 4.88 near 88°S) and a disc-to-disc scatter of about 1.5 times the counting error mean a fixed 80–85° reference would overstate significance, so the same-latitude control is the honest comparison.

| Crater (Gazetteer centre) | 30 km mean | Same-latitude control (n, sd) | Difference | In control sd | Controls at or below |
|---|---|---|---|---|---|
| Cabeus (85.33°S, 317.87°E) | 4.882 | 4.933 (19, 0.017) | −1.04% | −2.96 | 0 of 19 |
| Shoemaker (88.14°S, 45.91°E) | 4.862 | 4.903 (10, 0.012) | −0.83% | −3.38 | 0 of 10 |
| Faustini (87.18°S, 84.31°E) | 4.872 | 4.914 (16, 0.021) | −0.87% | −2.01 | 0 of 16 |
| Haworth (87.45°S, 354.83°E) | 4.884 | 4.912 (14, 0.025) | −0.58% | −1.14 | 2 of 14 |
| Amundsen (84.44°S, 83.07°E) | 4.928 | 4.927 (20, 0.025) | +0.03% | +0.07 | 8 of 20 |

- Limits: near 88°S the control ring is short (about 350 km round), so its discs overlap and are not independent. Crater choice is ours (well-known south-polar craters, Amundsen as a sunlit comparison). This is a feasibility check, not a scientific result, and none of it would be shown as a finding.
- The first run used crater coordinates typed from memory; four of five were wrong and were corrected from the Gazetteer before the run recorded here.

### 6.4 Display preview (`preview_lend_3.py`, numbers only; nothing drawn)

| Display disc | Shown | Withheld by rule (counting error of the % value > 0.5) | Range of shown values | Median counting error |
|---|---|---|---|---|
| 30 km | 12,340 | 1,073 (plus 987 missing in the archive) | −1.86% to +2.16% | 0.36 |
| 15 km | 489 | 12,924 | −1.65% to +0.94% | 0.48 |

- Reference: the 80.25–84.75°S band (7,200 cells, inverse-variance mean 4.9414). The lowest 30 km values lie near Cabeus (84.75°S, 315–318°E) and near Shoemaker (88.25°S, 53.75°E).
- 30 km is the smallest disc that leaves most of the cap shown under a 0.5-point rule. At 15 km almost everything is withheld.

## 7. Rights and citation

- **Terms:** PDS Geosciences Node FAQ: "Data sets archived in the PDS are in the public domain" (read 27 Nov 2026). The same basis is used in REGISTER for LOLA and Diviner. Cite the bundle and collection: Mitrofanov, I. (2022), LRO LEND Data Bundle, DOI 10.17189/p89b-8w72; collection `urn:nasa:pds:lro_lend:data_science_averaged` (Mitrofanov, I., 2023); product LIDVID `urn:nasa:pds:lro_lend:data_science_averaged:lend_rdr_alds_20111211::1.0`.
- No endorsement by NASA, the University of Arizona or IKI implied. No images from papers are used.

## 8. Options

| Option | What | For | Against |
|---|---|---|---|
| **L0** | Assessed, not shown | No risk of over-reading a 1% signal or a disputed resolution | The Moon tab loses LEND's one archived map product |
| **L1 (recommended)** | Optional, off-by-default polar layer on the Moon globe: percent difference of the archived CSETN rate from the same pole's 80–85° band, 30 km display smoothing, withheld cells hatched as no-data | Shows the archived measurement as it is, with its uncertainty | Needs careful wording; the visual stretch must not exaggerate (§8.1) |
| **L2** | No map: a short readout in the Moon panel giving the §6.3-style comparison for a few named craters, with errors | Smallest, most explicit | Crater choice is ours; less to explore |
| L3 (not proposed) | A hydrogen or water-equivalent-hydrogen map | — | No archived product; model-dependent; crosses from measurement into inference; any paper figure has its own rights. Revisit only if an archived, documented hydrogen product with stated terms appears, and then as its own item. |

### 8.1 L1 in detail (for the build, if chosen)

- **Data:** the archived ALD file(s), parsed by a builder from the retained file only (hash first, layout from the label, whole-file checks), into one small served file for the cap (20 × 720 values, int16 percent ×100 plus an error or withheld flag; well under 100 KB). Fetched only when the layer is switched on, sha256-pinned, with a deadline. The same pattern as height, temperature and CRaTER.
- **Quantity shown:** percent difference of the 30 km inverse-variance mean of `CSETN_RATE` from the same pole's 80.25–84.75° band mean. **Withheld** where the archive has −1 or zero exposure, or where the counting error of the percent value exceeds 0.5 points (D4).
- **Scale:** fixed and symmetric (−2.5% to +2.5%), one diverging ramp. No stretch to the data's extremes. The legend says these are percent differences of a few percent, with the counting error of a typical cell.
- **Readout (click):** latitude and longitude of the cell; "archived CSETN count rate, 30 km average: −1.0% ± 0.3% relative to 80–85°S"; exposure in seconds; the period.
- **Coexistence:** one Moon science layer at a time, as height and temperature behave now (to be confirmed at the build). Lighting, the dated path and the CRaTER chart unchanged.
- **Wording (draft, for D6):**
  - Title: "Neutron counts near the south pole — LEND, 2011–2016 average (archived)".
  - Line 1: "Epithermal neutrons counted by LRO's LEND collimated sensors, compared with the 80–85°S band. Lower counts are consistent with more hydrogen in roughly the top metre of soil."
  - Line 2: "This is not a measurement of hydrogen or of water ice, and says nothing about whether any ice could be reached. Converting it to hydrogen needs a model; published conversions differ."
  - Line 3: "How sharply LEND resolves the surface is disputed: estimates range from about 5–10 km to the much wider footprint of an uncollimated detector. Values here are averaged over 30 km for display; that choice is ours."
  - Sources page: the product, DOI, the two document inconsistencies (§4.3), the debate with citations (§5), the withholding rule, and "dated archive record, not live; last archive update of this product 2017".

## 9. Not proposed, with revisit conditions

- **A newer or time-resolved map from DLD:** about 5,500 daily files to 2026-03-14 (each about 15 MB in 2011), plus our own gridding, background and SPE handling. Revisit only on Chad's explicit go for a bulk acquisition and its own assessment.
- **Hydrogen or water-equivalent hydrogen:** see L3.
- **Pairing with the dated LRO path (item 9):** the ALD is a multi-year average with no per-pass content. Nothing to pair.
- **The equatorial file:** the processing document builds its orbital averages only from data poleward of 60°, to avoid maria-related variations at lower latitudes. A low-latitude neutron map would need its own interpretation and is not proposed.
- **Thermal-neutron (STN1) or SHEN maps:** held in the file but not assessed for meaning here.

## 10. Decisions for Chad (after GPT's review)

| # | Decision | Claude's recommendation |
|---|---|---|
| **D1** | Product and period | ALD, 2011-12-11 to 2016-09-14 (the later, longer average). The 2009–2011 file is not added. |
| **D2** | Poles | South (in hand). North on one more bounded acquisition, `lend_rdr_aldn_20111211.dat` (4,464,000 B, checkpointed), if Chad wants both. |
| **D3** | Form | L1. L0 and L2 are legitimate. |
| **D4** | Display smoothing and withholding | 30 km disc, inverse-variance; withhold if counting error of the percent value > 0.5 points, and every −1/zero-exposure cell |
| **D5** | Quantity and reference | Percent difference from the same pole's 80.25–84.75° band; fixed ±2.5% scale |
| **D6** | Wording | §8.1 draft: neutron measurement stated; hydrogen only as "consistent with", with the model caveat; water ice and accessibility explicitly not claimed; resolution dispute stated with sources |
| **D7** | Hydrogen and water numbers | None on the page. Published papers cited on Sources by reference only, with no numbers quoted unless their methods are read in full first. |

## 11. Verification limits (item 11)

- Nothing has been built or drawn; all numbers are from the one retained file and the documents read.
- The §4.3 inconsistencies are not resolved, and the team was not contacted.
- The published hydrogen papers (Sanin et al. 2017, Livengood et al. 2018) were seen only as search results.
- Crater comparisons are a feasibility check with overlapping, non-independent controls near 88°S.
- No real phone, Safari, screen reader or hardware renderer (applies to any later build).

## Change log

- **Rev 1 (27 Nov 2026, 16:18 UTC onwards, clock reading):** first assessment and proposal, for GPT's review.
