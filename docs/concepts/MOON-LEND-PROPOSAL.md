# Moon item 6 — LEND (LRO's neutron detector): assessment and proposal

Rev 2 · 27 Nov 2026, written from 16:34 UTC / 18:34 SAST (clock reading; rev 1 16:18 UTC) · Claude · **docs and focused evidence only: no new acquisition, page build, merge or deployment** · for GPT's recheck, then Chad's decisions.

**Chad's go, rev 1 (27 Nov 2026):** "Continue with Moon item 6: LEND, using the bounded assessment instructions already agreed. Start with archive documentation while folder access is being connected. Return a docs-only feasibility assessment and proposal for GPT review. Keep neutron measurements distinct from inferred hydrogen and accessible water ice. No page build, bulk acquisition, merge or deployment."

**Chad, rev 2 (27 Nov 2026):** "Please read GPT's saved LEND rev 1 review and address R1–R3 in proposal rev 2. Docs and focused evidence only; no new acquisition, build, merge or deployment. Return for GPT's recheck before my decisions and build go."

**GPT's rev 1 review:** `reviews/2026-11-27-moon-lend-proposal-rev1-gpt-review.md` (filed unchanged; sha256 `1859291c…3506c`, equal to the Mac copy). **REVISE BEFORE BUILD**: feasibility supported; R1 (name the stored quantity without resolving the contradiction), R2 (formal error benchmark versus established uncertainty; withdraw "real signal"), R3 (radius versus diameter; freeze geometry, states, schema and tests). It independently reproduced the reference mean (4.9413873895), its formal error (0.0022184209), the cell counts and representative disc means.

Checklist: `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` item 6. Evidence: `docs/research/moon-lend/`. Retained source files: Mac `~/Documents/Mother Earth/_source-data/moon-lro-science-lend/` (unchanged since rev 1; nothing new acquired).

## 0. Bottom line (feasibility conclusion)

1. **Three things, kept apart throughout:**
   - **What LEND archived:** values of the `CSETN_RATE` field for LEND's collimated epithermal neutron sensors, averaged by the team onto 0.5° cells over 2011-12-11 to 2016-09-14. This field is the only thing proposed for display.
   - **Inferred hydrogen:** published, model-dependent estimates made from neutron data by several teams. The PDS LEND bundle archives no hydrogen product. Not proposed.
   - **Water ice, and accessible water ice:** not measured by LEND. Never claimed.
2. **What the field means is unresolved, and rev 2 does not resolve it (R1).** Archive documents call it a unitless normalised ratio, a relative count rate and an average count rate in counts per second, and they disagree about background subtraction. Rev 2 takes GPT's second route: the display shows only **relative differences in the archived `CSETN_RATE` field**, says on the feature that the field's normalisation and background treatment are unresolved, shows no raw value or unit, subtracts nothing and converts nothing.
3. **Feasible, in one bounded form (L1):** an optional, off-by-default south-polar map of the percent difference of the archived field from the 80.25–84.75°S reference band. Values are inverse-variance-weighted means of the sampled cell values within a **30 km radius (60 km diameter)** disc on the sphere. Cells are withheld by a stated Mother Earth display rule, and four display states are kept distinct (§8.1).
4. **What the comparisons show, and no more (R2):**
   - The differences in stored values are reproducible: GPT recomputed them independently.
   - Near Cabeus, Shoemaker and Faustini the 60 km-diameter disc means lie 0.8–1.0% below discs at the same latitude. These are **descriptive comparisons**. Overlapping controls, our choice of craters and unknown systematics mean they do not establish a detection or its significance.
   - The ± figure is a **formal counting-error estimate**, conditional on the archive's `CSETN_ERR` being the standard deviation of independent cell values. It is not the full uncertainty. Rev 2 propagates the reference and its covariance with the local mean (§6.4). It changes the figure by at most 0.005 percentage points, and 10 of 13,413 cells change state.
5. **Spatial resolution is disputed in published work** (§5). The display's 60 km-diameter disc is our smoothing choice. It is different from the 30 km footprint diameter used in one paper, and it is evidence for neither side.
6. **Recommendation:** L1, south pole only, with the propagated formal estimate, a 0.5 percentage-point display cut-off, and withholding where the disc crosses the product's 80°S edge (D4–D6). L0 ("assessed, not shown") and L2 (a readout table, which needs the same quantity and error care) remain legitimate.

## 0a. GPT's R1–R3 and what rev 2 does

| GPT | Rev 2 |
|---|---|
| **R1** name the stored quantity; don't resolve the contradiction by inference; no raw number as events/s; no "measured flux suppression"; a short explanation on the feature, the detailed conflict on Sources; no guessed background, no hydrogen conversion | §4.3 (contradiction stated; one published total count rate noted and expressly not used to resolve it); §8.1 quantity, wording and readout; D2 |
| **R1** hydrogen context only from a primary source read; drop "roughly the top metre" unless supported for this product; no unique-cause claim | McClanahan et al. 2024, abstract and §1–1.3, read in full text (§2, §5); the depth phrase removed; lower values attributed to no single cause (§8.1 wording) |
| **R1** balanced, versioned resolution sources | §5: McClanahan et al. cited as PSJ 5:217 (2024) / arXiv 2303.03911v5 (15 Jan 2025); the quoted "unresolved debate" sentence checked in its full text; both positions given |
| **R2** formal benchmark versus uncertainty; propagate the reference and covariance, or label the benchmark's conditions; the cut-off is a display rule | §6.4: both computed; the propagated formula recommended (D5) with its conditions stated; Monte Carlo check of the formula (`check_lend_4.py`, PASS); the 0.5 pp cut-off called a display rule throughout |
| **R2** withdraw "real signal"; descriptive controls; "in control sd" descriptive; restrict the native-cell conclusion; name the mean; define exposure | §0, §6.2, §6.3, §8.1 readout |
| **R3** radius versus diameter everywhere; the 15 km run was a radius too | §0, §6, §8, §10 all say "30 km radius (60 km diameter)"; rev 1's 15 km figure was a 15 km radius (30 km diameter) |
| **R3** geometry contract, edges, missing cells, four states, notation, readout, schema and validation | §8.1 (contract), §6.4 (edge and missing-support counts), D6 (edge rule) |
| **R3** focused future build and test plan | §8.2 |
| Delivery note: SHA256SUMS listed two files absent from the review folder | The rev 2 review folder carries a SHA256SUMS of its own files only (§12) |
| Delivery note: the documents JSON says "latin1" but the text is Windows-1252 decoding | Recorded in §3 and the evidence README; the retained file is not rewritten |

## 1. Scope, and what this item leaves alone

- **In scope:** the LEND archive, the one retained sample, the published interpretation limits, and how a LEND record could appear on the Moon tab.
- **Unchanged (docs only):** every page file; the Moon globe and its layers (height, temperature); the dated LRO path and the CRaTER chart; the Apollo 11 detail; "Lit as now"; the Sky view (10a); the Tides Moon (10b); the hub (0.6.25); R2 and collectors.
- **Rest of the checklist untouched:** 7 and 8 stay "to assess"; 9 only where it serves an item; 11 carried; 12a–c options; 13 outside scope.

## 2. What was read

All of this was read by Claude on 27 Nov 2026. The PDS host is reachable only from the browser pane: the workspace and Mac shells get HTTP 403 from the proxy.

| Source | What it settled |
|---|---|
| PDS Geosciences Node LEND page (`missions/lro/lend.htm`, last updated 29 Sep 2026) | Release 67 (15 Sep 2026). Producer: LEND Science Team, University of Arizona. One bundle. |
| `bundle_lend.xml` | `urn:nasa:pds:lro_lend` v2.0, "Lunar Reconnaissance Orbiter LEND Data Bundle", Mitrofanov, I. (2022), DOI 10.17189/p89b-8w72 |
| `data/` collections and inventories | raw and reduced science and housekeeping; derived (DLD 5,511, DLX 5,510; the last inventory entries are DLX for 2026-03-13 and -14); **averaged (ALD), 6 products**; no hydrogen or water product |
| `collection_data_science_averaged.xml` | "LRO LEND Averaged Science Data Collection", Mitrofanov, I. (2023); 2009-09-15 to 2016-09-14 |
| ALD labels (PDS4 `.xml`, PDS3 `.lbl`) for `alds`, `aldn`, `alde` | grids, periods, fields (§4) |
| `catalog/rdr_ds.cat` (Claude); the NASA PDS data-set description page was opened by GPT, not by Claude | the "normalized … unitless" statement; coordinate system |
| `catalog/inst.cat`, RDR SIS (`lend_rdr_sis.htm`, 10 Jun 2016) §2.1, §2.3.2, §3.4 | instrument; "5 km at 50 km"; the ALD binning equations (counts/s per cell); −1 conventions |
| `lend_data_processing.htm` (the PDS processing document) | SPE, outlier and off-nadir exclusions; warm-up and cosmic-ray corrections; uncertainty weighting of individual records |
| `errata.txt` (to Release 52), `lend_release_notes.txt` (to Release 67) | ALD last updated Release 29 (2017-03-15); not included in releases 30–67 (all 38 checked); "-1 should be ignored and not used in mapping" |
| PDS Geosciences Node FAQ (last modified 12 Oct 2026) | "Data sets archived in the PDS are in the public domain." |
| IAU Gazetteer of Planetary Nomenclature | crater centres (§6.3) |
| **McClanahan et al. 2024, Planet. Sci. J. 5:217 (published 2 Oct 2024, doi:10.3847/PSJ/ad5b55, CC BY 4.0), as posted at arXiv 2303.03911v5 (15 Jan 2025): abstract, §1, §1.1–1.3 and the opening of §2.1 read in full text** (PDF fetched in the workspace, 5,307,734 B, sha256 `7d547ab1…12e6f4c`, the same bytes as a pane read; not retained or committed) | the neutron–hydrogen method in general terms; dependence on burial and layering; the published footprint figures; the "unresolved debate" sentence; one published total CSETN count rate (§4.3, §5) |
| arXiv abstract pages read in full: Eke et al. 2012 (1108.2048), Teodoro et al. 2014 (1304.8123), Su et al. 2021 (2104.03451) | the other side of the resolution dispute (§5) |
| Search results only, full text **not** read: Sanin et al. 2017 (Icarus 283, 20–30); Livengood et al. 2018; a NASA science nugget; Mitrofanov et al. 2010 with the 2011 technical comment and response | named only; no number from them is proposed for the page |

## 3. Acquisitions (rev 1; nothing new in rev 2)

| # | File | Bytes | sha256 | Checks |
|---|---|---|---|---|
| 1 | `lend_rdr_alds_20111211.dat` (ALD south pole, 2011-12-11 to 2016-09-14) | 4,464,000 | `e6b1c2d5…0031ef` | two pane reads identical; = 14,400 rows × 310 B; no archive checksum is published |
| 2 | `lend-docs-labels-2026-11-27.json` (19 documents and labels as served, each with its own sha256) | 1,095,765 | `7283e751…ff34ab` | pane hash = Mac hash; all 19 inner hashes reproduce |

- Checkpoints: `docs/research/moon-lend/checkpoints.jsonl` (sha256 `7520b760…ebbaa`), with one correction line (an estimated fetch time).
- **Correction to file 2's own description (GPT):** its `note` says the texts are "latin1-decoded". They were decoded by the browser's `TextDecoder('latin1')`, which follows the WHATWG Encoding Standard and maps that label to Windows-1252. Re-encoding as Windows-1252 (bytes 0x81, 0x8D, 0x8F, 0x90 and 0x9D pass through) reproduces all 19 recorded hashes; strict ISO-8859-1 does not. The retained file is not rewritten.
- **Not acquired:** north (`aldn`), equatorial (`alde`), the 2009–2011 period, any DLD/DLX.

## 4. The product

### 4.1 LEND (archive documents)

- Eight ³He counters plus a stilbene scintillator. **CSETN1–4 sit inside a collimator** (polyethylene and ¹⁰B, with Cd shields absorbing neutrons below about 0.4 eV). SETN and STN1–3 are uncollimated.
- Records about every second. Times are UTC at mid-interval; mean Earth/polar axis frame, east-positive longitude 0–360.

### 4.2 ALD south polar product (the sample)

- **Grid:** 0.5° × 0.5°, 80–90°S, 20 × 720 = 14,400 rows from 89.75°S, 0.25°E, eastward (checked in the file).
- **Period:** every row 2011-12-11T00:00:00.000 to 2016-09-14T00:00:00.000: one average, not a time series. The catalog's "synodic period" binning does not describe these files; the SIS change log says "3 maps NP, SP, equatorial", and the errata call them "3 yearly maps". Recorded, not used.
- **Fields:** per group (STN1, SETN, STN2, STN3, CSETN): `_EXPOSURE` (s), `_RATE` ("relative count rate"), `_ERR` ("statistical error"), plus SHEN groups. Only CSETN and STN1 hold data in this file. SETN, STN2 and STN3 are −1 with zero exposure in every row.
- **CSETN:** 13,413 usable cells. 987 are −1 with zero exposure: all 720 at 89.75°S, 231 at 89.25°S and 36 at 88.75°S. Six usable cells have a stored value of exactly 0 (at 1–2 s exposure); no usable cell has a zero error. Median stored value 4.926 (1st–99th percentile 3.999–5.771); median stated error 0.191; median ratio of error to value 3.8%; median native-cell exposure 384 s.

### 4.3 What the stored number is: unresolved, and left unresolved (R1)

- **The archive disagrees with itself:**
  - The data-set catalog says (GPT found the same on the NASA PDS data-set page) the ALD rates are normalised by a reference region's average and "are unitless".
  - The sample's label calls the field a "relative count rate".
  - The SIS §2.3.2.2 equations define a cell value as an average counting rate in counts per second.
  - The catalog and SIS say the averages use background-subtracted counts, while the SIS says DLD carries no spacecraft background subtraction.
- **What is not inferred:** the stored values' size (median about 4.9) cannot settle the units, whether a background was subtracted, or which description applies. McClanahan et al. (2024, §2.1) report that Sanin et al. (2017) break down "CSETN's 5.1 counts s−1 total count rate" (first year of operations) into cosmic-ray, collimated and uncollimated parts. That published figure is a different quantity from this archived average field, and it is **not** used here to decide what the field is.
- **Consequence:** a percent difference within the file is free of a constant scale factor. It is not shown, and not assumed, to be free of a spatially varying normalisation or background. So the display names only "relative difference in the archived `CSETN_RATE` field". It shows no raw value or unit, subtracts no guessed background, converts nothing to hydrogen, and never calls the percentage a measured or calibrated change in lunar neutron flux.

## 5. Spatial resolution: a published, unresolved dispute

| Source (as read) | Statement |
|---|---|
| LEND instrument catalog and RDR SIS §2.1 | collimation provides epithermal mapping "with the horizontal resolution of 5 km for LRO at an altitude of 50 km" |
| McClanahan et al. 2024 (PSJ 5:217, doi:10.3847/PSJ/ad5b55; arXiv v5, 15 Jan 2025): §1.2 read in full text; the "30 km diameter" wording in §3 located by text search | Mitrofanov et al. modelled the field of view at 50 km as FWHM 10 km, ±3σ footprint 25.8 km; the authors' own GEANT4 modelling gives FWHM 11.8 km and a ±3σ footprint of 30.6 km diameter. Elsewhere they use a "30 km diameter" collimated footprint. They also state that claims for CSETN's high spatial resolution "have been the subject of vigorous and still unresolved debate", listing studies on both sides. |
| Eke et al. 2012 (ApJ 747, 6; abstract) | at least 90% of the lunar part of the CSETN rate comes from neutrons through the collimator walls; effective FWHM comparable with the uncollimated Lunar Prospector spectrometer |
| Teodoro et al. 2014 (arXiv 1304.8123; abstract) | the footprint is at least as big as an omnidirectional detector's at 50 km; the collimated flux is negligible |
| Su et al. 2021 (arXiv 2104.03451; search-result text, not the abstract) | a nominal 10 km diameter |

- Mother Earth takes no side. The feature says the resolution is disputed; Sources names both positions with versioned citations.
- **Our display disc is a 30 km radius (60 km diameter).** That is a smoothing choice for display. It is not any paper's footprint, and it is evidence for neither position.

## 6. Measurements on the sample (`docs/research/moon-lend/`)

All scripts check the retained files' sha256 first and reproduce their recorded outputs byte for byte. `assess_lend_1.py` derives the field layout from the file's own PDS4 label; the other scripts use the same byte offsets (CSETN at bytes 107/111/115, latitude 47, longitude 51), which that label gives. GPT reproduced `assess_lend_2.py` byte for byte, and the reference figures independently.

### 6.1 `assess_lend_1.py`

Grid, coverage, field statistics, missing cells (§4.2). Output `outputs/assess_lend_1.out.json`.

### 6.2 One-ring neighbour check (restricted, R2)

- **What was tested:** one ring (85.25°S) and one statistic, the rms of differences between the 719 longitudinal neighbour pairs. Result: 0.2585 against 0.2551 expected from the stated errors (ratio 1.013).
- **What it supports:** on that ring, neighbour-to-neighbour differences of native cells are of the size the archive's stated errors predict.
- **What it does not support:** a statement about all rings, about structure at other scales, or about whether the stated errors are complete.

### 6.3 Named craters against same-latitude controls (`assess_lend_2.py`): descriptive only

- **Method:** inverse-variance-weighted means of sampled cell values within a **30 km radius (60 km diameter)** of IAU Gazetteer crater centres, compared with discs of the same radius every 15° of longitude at the same latitude. Control centres within 90 km of the crater are excluded.
- **Why same-latitude controls:** ring medians decline poleward, and 60 km-diameter disc means along 82.5°S scatter about 1.5 times their formal errors. A fixed reference band would overstate the comparison.

| Crater (Gazetteer centre) | Disc mean | Same-latitude control: n, mean, sd | Difference | Difference ÷ control sd (descriptive) | Controls at or below |
|---|---|---|---|---|---|
| Cabeus (85.33°S, 317.87°E) | 4.882 | 19, 4.933, 0.017 | −1.04% | −2.96 | 0 of 19 |
| Shoemaker (88.14°S, 45.91°E) | 4.862 | 10, 4.903, 0.012 | −0.83% | −3.38 | 0 of 10 |
| Faustini (87.18°S, 84.31°E) | 4.872 | 16, 4.914, 0.021 | −0.87% | −2.01 | 0 of 16 |
| Haworth (87.45°S, 354.83°E) | 4.884 | 14, 4.912, 0.025 | −0.58% | −1.14 | 2 of 14 |
| Amundsen (84.44°S, 83.07°E) | 4.928 | 20, 4.927, 0.025 | +0.03% | +0.07 | 8 of 20 |

- **What this is:** reproducible differences in stored values, compared descriptively. "Difference ÷ control sd" is not a sigma detection.
- **Limits:** the controls overlap (severely near 88°S, where the ring is about 350 km round); the craters are our choice; the systematics are unknown. It establishes neither a detection nor its significance, and nothing from it would be shown as a finding.
- The first run used remembered coordinates, four of five wrong; corrected from the Gazetteer before the recorded run.

### 6.4 Display preview and error figures (`preview_lend_4.py`, `check_lend_4.py`)

**Geometry (as coded):**
- A cell is in the disc when its centre lies within 30 km great-circle distance of the centre cell's centre, on a sphere of R = 1737.4 km (centre-in-disc).
- Distances come from 3-D unit vectors, so the 0°/360° seam needs no special case (checked: from 85.25°S, 0.25°E the disc includes 359.75°E).
- Radius boundary checked: the farthest included centre is 29.279 km, the nearest excluded 30.078 km.

**Quantities:**
- m = Σwx / Σw over the disc's usable cells; r = the same over the reference band's usable cells (7,200 cells; 4.9413873895).
- w = 1/`CSETN_ERR`²; p = 100(m/r − 1), in percent.
- These are inverse-variance-weighted means of sampled cell values, **not equal-area averages**. Cells shrink toward the pole, so a disc near the pole holds many more cells (up to 531, against 117 typically). For comparison, a cos-latitude-weighted mean of the reference band is 4.943801.

**Two error figures (percentage points), both conditional on `CSETN_ERR` being the standard deviation of independent cell values, an assumption not established here:**
- benchmark (rev 1): 100·√Var(m) / r, with the reference fixed;
- propagated: 100·√(Var(m)/r² + m²Var(r)/r⁴ − 2m·Cov(m,r)/r³), with Var(m) = 1/W_D, Var(r) = 1/W_B and Cov(m,r) = W_{D∩B}/(W_D W_B), where W sums w over the disc, the band and their shared cells. 7,920 cells have discs that share cells with the band, so the covariance is not zero there.

**Results:**
- The reference's own formal relative error is 0.0449 pp.
- Propagated minus benchmark: −0.0031 to +0.0048 pp (median −0.0010). Under a 0.5 pp cut-off, 10 cells change state: 12,340 shown with the benchmark, 12,344 propagated.
- **Monte Carlo check (`check_lend_4.py`, PASS):** synthetic values drawn independently from N(stored value, `CSETN_ERR`), 4,000 draws. The simulated standard deviation of p over the propagated figure is 0.976 for a disc sharing all 81 cells with the band, 1.004 for one far from it, and 0.988 at the 80°S edge. This verifies the formula under its own model; it says nothing about whether the model fits the archive.

**Support, for 30 km radius discs:**

| Support class | Cells | Shown at 0.5 pp (benchmark) | Median cells in disc |
|---|---|---|---|
| complete (no missing cell; disc poleward of 80°S) | 10,554 | 10,554 | 117 |
| edge-truncated (disc crosses the product's 80°S edge: centres at 80.25° and 80.75°S) | 1,440 | 681 | 55 |
| missing-affected (contains archive-missing cells near the pole) | 1,419 | 1,105 | 415 |
| both | 0 | 0 | — |

- At an edge-truncated cell, part of the disc lies outside this product, so the support is one-sided.
- Shown values (benchmark, 0.5 pp): −1.86% to +2.16%, median −0.36%; median formal error 0.36 pp.
- **Exposure:** the median native-cell exposure is 384 s. The median sum over a disc's support is 45,279 s, a sum of per-cell accumulation times and **not** a continuous observing duration.
- Rev 1's 15 km figures were for a **15 km radius (30 km diameter)**: 489 cells shown under the same rule.
- **Under the recommended rule (D5 propagated estimate, D6 with the edge rule):** 11,656 shown, 1,440 withheld at the product edge, 317 withheld by the 0.5 pp rule, 987 not in the archive (total 14,400).

## 7. Rights and citation

- PDS Geosciences Node FAQ: "Data sets archived in the PDS are in the public domain" (read 27 Nov 2026); the same basis as the LOLA and Diviner entries.
- Cite: Mitrofanov, I. (2022), LRO LEND Data Bundle, DOI 10.17189/p89b-8w72; collection `urn:nasa:pds:lro_lend:data_science_averaged` (Mitrofanov, I., 2023); product `urn:nasa:pds:lro_lend:data_science_averaged:lend_rdr_alds_20111211::1.0`.
- No endorsement by NASA, the University of Arizona or IKI implied. No images from papers.

## 8. Options

| Option | What | Note |
|---|---|---|
| **L0** | Assessed, not shown | legitimate owner choice |
| **L1 (recommended)** | Optional, off-by-default south-polar map of the relative difference in the archived field, under the §8.1 contract | needs the wording and states of §8.1 |
| **L2** | A small readout table (crater discs and controls) instead of a map | needs the same quantity, error and wording care as L1; crater choice is ours |
| L3 (not proposed) | Hydrogen or water-equivalent-hydrogen map | no archived product; model-dependent. Revisit only if an archived, documented hydrogen product with stated terms appears, as its own item. |

### 8.1 L1 contract (frozen here for the build, if chosen)

**Quantity:**
- p = 100(m/r − 1): the percent difference of the disc's inverse-variance-weighted mean of sampled cell values of the archived `CSETN_RATE` field from the 80.25–84.75°S band mean, over 2011-12-11 to 2016-09-14.
- No raw value or unit is shown. No background is subtracted. Nothing is converted.

**Geometry:**
- Centre-in-disc, 30 km radius (60 km diameter), sphere R = 1737.4 km, great-circle distance from unit vectors.
- Usable cells only (−1 or zero exposure excluded). Weights 1/`CSETN_ERR`².
- Reference band fixed at 80.25–84.75°S cell centres, all usable cells.

**Error:**
- The propagated formal estimate (§6.4), named "formal counting-error estimate (assumes independent archive errors; not the full uncertainty)".

**Display rule:**
- Withhold where that estimate exceeds **0.5 percentage points**, and (recommended, D6) where the disc crosses the product's 80°S edge.
- This is Mother Earth's display rule. It is not an accuracy guarantee or a significance threshold.

**Four display states, each drawn differently and named in the legend:**
1. **Value shown:** a colour on a fixed, symmetric −2.5% to +2.5% diverging scale, never stretched to the data. A valid 0.00% is a value, not missing.
2. **Not in the archive:** the archive has no value for this cell (−1 or zero exposure). Hatched.
3. **Withheld by our display rule:** the formal estimate is above 0.5 pp, or the disc crosses the product's edge. A different hatch, with the reason in the readout.
4. **Outside this product's coverage:** north of 80°S. The layer draws nothing; the globe's normal surface shows.

**Notation:**
- p in percent of the reference value (%); errors and the cut-off in percentage points (pp).
- Served p and error at 0.01 resolution; readout rounded to 0.1.

**Readout (click or keyboard):**
- Cell centre latitude and longitude.
- "Relative difference in the archived field, 60 km-diameter disc: −1.0% ± 0.3 pp (formal counting-error estimate)."
- Support: the number of sampled cells in the disc, flagged "near the archive's missing polar cells" where that applies.
- "Exposure of this 0.5° cell in the archive: 384 s (accumulated 2011–2016)". The support sum is never shown as a duration.
- The period, and a Details link to Sources.

**Wording on the feature (draft for D7):**
- Title: "Neutron detector record near the south pole — LEND, 2011–2016 average (archived)".
- Line 1 (GPT's suggested wording, adapted): "This map compares values in LEND's archived CSETN_RATE field (its collimated epithermal neutron sensors), averaged over 2011–2016. For display we average them over 60 km-wide discs and compare them with the 80–85°S band. Archive documents disagree about the field's normalization and background treatment, so these percentages are not a calibrated change in lunar neutron flux, nor a measurement of hydrogen or ice."
- Line 2: "Neutron measurements can be used with models to estimate hydrogen. Such estimates depend on assumptions, including how any hydrogen is buried or layered, and published LEND estimates differ. Lower values here are not attributed to any one cause."
- Line 3: "How sharply LEND's collimated sensors resolve the surface is disputed in published work. Our 60 km disc is a display choice."
- Legend: "± is a formal counting-error estimate that assumes the archive's errors are independent; it is not the full uncertainty."
- **Sources:** product and DOI; the four archive statements of §4.3 in full; the resolution dispute with versioned citations (§5); the geometry, reference, error formula and display rule; the support classes; "dated archive record, not live; this product last updated in the archive in 2017".

**Served file (schema frozen for the build):**
- One file, `assets/moon/lend/lend-alds-2011-2016-R1.bin`, little-endian, built only from the retained file by a builder that checks its sha256 first.
- **Header:**
  - magic, version;
  - source sha256 and LIDVID, period;
  - radius_km = 30, sphere_km = 1737.4;
  - reference band, reference mean and formal error;
  - cut-off 0.5;
  - cell order (row-major from 89.75°S, longitude 0.25°E eastward), 14,400 cells;
  - payload sha256.
- **Per cell (14,400 entries):**
  - state code (0 shown; 1 archive missing; 2 withheld by error rule; 3 withheld at product edge);
  - p × 100 (int16);
  - formal error × 100 (uint16);
  - support cell count (uint16);
  - near-missing flag (uint8);
  - native-cell exposure in seconds (uint16).
- **Page validation:**
  - pinned sha256, exact byte length, magic and version, header values equal to the pinned contract;
  - every state code in 0–3;
  - for state 0, finite p within ±20.00% and error in (0, 0.50];
  - for other states, p and error stored as 0 and never drawn.
- An invalid file draws nothing and shows "LEND layer unavailable"; it never shows partial data.

### 8.2 Focused build and test plan (for the later branch preview)

- **Builder:**
  - Independent source-to-output comparison: a second, separately written reduction reproduces every served p, error and state from the retained file.
  - `--check` byte identity.
  - Tamper cases: wrong source hash, truncated source, a flipped −1, a NaN.
- **Geometry and formula:**
  - Radius boundary (just inside and just outside 30 km).
  - Seam at 0°/360°.
  - Edge discs at 80.25° and 80.75°S.
  - Missing-affected discs near 89°S.
  - Reference construction.
  - Propagated against benchmark formula, and the Monte Carlo agreement (from `check_lend_4.py`).
- **States:** valid zero against missing; each of the four states drawn and named; the withheld reasons in the readout.
- **Served file:** malformed values, out-of-range p or error, bad state code, wrong length, wrong header contract, wrong hash. Each refuses the whole file.
- **Page:**
  - Lazy load only when switched on; timeout; late completion dropped; retry; cleanup on switch-off.
  - Atomic replacement in the existing science-layer controller (height and temperature), with the saved lighting and camera choices restored.
  - Keyboard readout; narrow layout; Sources link.
- **Existing suites and pins:** Moon suites (globe, lit, LRO path, light, height, temperature, LROC, CRaTER), Sky texture, Tides navigation, and Animals pin maintenance for `moon.html`, `moonglobe.js` and `sources.html`, as in previous Moon releases.
- **Not claimed:** real phone, Safari, screen reader, hardware renderer.

## 9. Not proposed, with revisit conditions

- **A newer or time-resolved map from DLD:** about 5,500 daily files to 2026-03-14, plus our own gridding, background and SPE handling. Only on Chad's explicit bulk go and its own assessment.
- **Hydrogen or water-equivalent hydrogen:** see L3.
- **Pairing with the dated path (item 9):** a multi-year average has no per-pass content.
- **Equatorial file:** the processing document forms its orbital averages only poleward of 60°, avoiding maria-related variations at lower latitudes. A low-latitude map needs its own interpretation.
- **STN1 and SHEN maps:** present in the file, not assessed for meaning.
- **North pole:** optional, one more bounded file on Chad's go; not needed for this review.

## 10. Decisions for Chad (after GPT's recheck)

| # | Decision | Claude's recommendation |
|---|---|---|
| D1 | Product and period | ALD south, 2011-12-11 to 2016-09-14 (GPT supports) |
| D2 | Quantity | The relative difference in the archived `CSETN_RATE` field, contradiction stated (R1 route 2); no raw value or unit |
| D3 | Form | L1; L0 and L2 legitimate |
| D4 | Display smoothing | 30 km radius (60 km diameter) centre-in-disc, inverse-variance-weighted, as coded |
| D5 | Error figure | The propagated formal estimate, labelled with its conditions (the benchmark is a legitimate alternative; they differ by at most 0.005 pp here) |
| D6 | Withholding | Above 0.5 pp of the formal estimate, **and** where the disc crosses the product's 80°S edge (1,440 cells at 80.25° and 80.75°S); missing-affected discs shown with their support disclosed. Result: 11,656 shown, 1,757 withheld, 987 not in the archive |
| D7 | Wording | §8.1 draft |
| D8 | Hydrogen and water numbers | None on the page; published papers cited by reference only (GPT supports) |
| D9 | North pole | Not now |

## 11. Verification limits (item 11)

- Nothing built or drawn; every number comes from the one retained file and the documents read.
- The field's definition, normalisation and background treatment are unresolved, and the team was not contacted (GPT: not required).
- The formal error estimate assumes independent archive errors; its fit to the archive is not established.
- Crater comparisons are descriptive, with overlapping controls.
- Sanin et al. 2017 and Livengood et al. 2018 seen only as search results; McClanahan et al. read in full text for the abstract, §1–1.3 and the opening of §2.1 only (the "30 km diameter" footprint wording was also located in §3 by text search).
- For any build: no real phone, Safari, screen reader or hardware renderer.

## 12. Records and delivery

- **Review folder for GPT:** `~/Documents/Mother Earth/_review/moon-lend-rev2/`, whose SHA256SUMS lists only the files in that folder (GPT's delivery note on rev 1).
- **New evidence in rev 2:**
  - `preview_lend_4.py` → `outputs/preview_lend_4.r30.out.json`;
  - `check_lend_4.py` → `outputs/check_lend_4.out.json`.
- Rev 1's `preview_lend_3.py` outputs are kept, read as radius figures.

## Change log

- **Rev 1 (27 Nov 2026, 16:18 UTC onwards):** first assessment and proposal.
- **Rev 2 (27 Nov 2026, 16:34 UTC onwards):**
  - answers GPT's R1–R3: the quantity named without resolving the archive's contradiction; "real signal" withdrawn; formal error propagated and checked; radius and diameter stated throughout; geometry, states, schema, readout and test plan frozen; hydrogen context from a primary source read; resolution sources versioned;
  - delivery notes fixed;
  - no new acquisition.
