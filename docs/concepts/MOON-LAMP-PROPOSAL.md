# Moon item 7 — LAMP (LRO's far-ultraviolet spectrograph): assessment and proposal

Rev 1 · 28 Nov 2026, written from 05:55 UTC / 07:55 SAST (clock reading) · Claude · **docs and a bounded sample only: no page build, bulk acquisition, merge, deployment or hub change** · for GPT's review, then Chad's decisions.

**Chad's go (28 Nov 2026):** "Continue with Moon item 7: LAMP. Start with archive documentation, then assess one suitable product and a small, bounded sample. Record wavelength bands, quantity and units, observation period, coverage, projection/frame, missing-data rules, processing, rights and size. Keep far-ultraviolet measurements distinct from visible photography and inferred frost or water. Checkpoint and retain each acquired file before proceeding. Return a docs-only feasibility assessment and proposal for GPT review. No page build, bulk acquisition, merge, deployment or hub change."

- **Checklist:** `docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`, item 7.
- **Evidence:** `docs/research/moon-lamp/`.
- **Retained source files:** Mac `~/Documents/Mother Earth/_source-data/moon-lro-science-lamp/` (four files plus `checkpoints.jsonl`).

## 0. Bottom line (feasibility conclusion)

**Feasible, with one frame correction that the build must carry.**

- **The product:** the archived LAMP Gridded Data Record (GDR) V1.0 has a south-polar, night-side, cumulative **Lyman-α albedo** map. It is:
  - a dimensionless fraction;
  - 240 m per pixel, polar stereographic, 80–90°S;
  - from LRO's first mission year (September 2009 to September 2010);
  - published with its own quality mask and signal-to-noise map.
- **It is a usable, well-bounded product for one optional, off-by-default Moon layer.** Inside 80°S, 98.9% of pixels are finite and flagged good (4,966,208 of 5,023,277).
- **Three things must be stated, not smoothed over:**
  1. **The archive's printed orientation is wrong for this file.** Read as printed, the map comes out mirrored top to bottom, a reflection that also swaps east and west sides. An independent test against the repository's own LOLA heights settles the orientation (§5).
  2. **The archive's documents disagree with each other** in five places: the Lyman-α band edges, the units of the "error" maps, the meaning of quality flag 1, an undocumented flag value 5, and the dates. The data settle two of them; the rest are recorded unresolved (§4.4).
  3. **This albedo is a ratio of measured brightness to *modelled* night-side illumination** (§4.3). The model itself is not described in the archive beyond one sentence.
- **Kept separate on the page and in every sentence:**
  - far-ultraviolet light is not visible light, and this is not a photograph;
  - the brightness measured is starlight and sky glow reflected on the night side and in permanently shadowed ground;
  - low albedo is not shown as frost, ice or water. The archive's own "H2O absorption feature depth" ratio maps are **not proposed** (§9).

## 1. Scope, and what this item leaves alone

- In scope: one product assessment and the proposal for one optional layer on `moon.html`.
- Left alone:
  - the existing Moon appearance, lighting, "Lit as now" and the dated LRO path;
  - the height, temperature, LROC, CRaTER and LEND layers;
  - the Sky and Tides Moons;
  - the hub, R2 and every other page.
- Not used:
  - no trajectory pairing (item 9): these are year-long cumulative maps, not passes;
  - no current LRO position (item 13).

## 2. What was read

| Source | What it gave |
|---|---|
| ODE help pages for LAMP (Washington University, Lunar ODE): the instrument page and the GDR page | the products, the archive location (PDS Imaging Node), the DOI `10.17189/1520244` |
| PDS Imaging Node directory listings, `https://planetarydata.jpl.nasa.gov/img/data/lro/lamp/` | the only map volume is `gdr/LROLAM_2001/` (2011), with no later map volume. The 2024 PDS4 bundle `urn:nasa:pds:lro_lamp` holds raw and calibrated data only, from 2024-06-15 (its `bundle.xml`, retained) |
| `AAREADME.TXT`, `ERRATA.TXT`, `VOLDESC.CAT` | volume contents; errata "None"; "Day side maps are planned for a future release" (none archived) |
| `DOCUMENT/DPSIS.DOC`: the GDR Data Product SIS, 11239-GDRDP_SIS-01 Rev 0, March 2011, read in full | products, bands, processing steps 1–11, grid, frame, byte order, naming |
| `DOCUMENT/ARCHSIS.DOC`: the GDR Archive SIS | searched for missing data, versions and rights (nothing further on either) |
| `CATALOG/LAMP_GDR_DS.CAT` (data-set description, read in full), `DSMAP_POLAR.CAT` (projection, read in full), `REF.CAT`, `INSTHOST.CAT`, `LAMP_INST.CAT`, `LRO_MISSION.CAT` (held, not read in full) | units, NaN rule, citation, projection equations |
| 13 south-polar cumulative labels (albedo in four bands, ratio, brightness, data quality, error in two bands, exposure, illumination, photons, one monthly albedo) | per-file layout, units, flag codes, times |
| `LROLAM_2001_md5.txt` (the archive's own checksum list, 1,437 lines) | MD5 for every file; all 20 checked documents and labels and all 3 maps match |
| Search results only, full text **not** read: an APS 2013 meeting abstract (Rojas et al.) and the 2022 and 2023 JGR abstracts by Magaña et al. | named only (§4.5). No number from them is proposed for the page |

The instrument summary PDF (`LAMP_INSTRUMENT_SUM.PDF`) was not fetched: research stays text only. Its label is held.

## 3. Acquisitions (each checkpointed and re-hashed on the Mac before the next began)

| # | File | Bytes | sha256 | Checks |
|---|---|---|---|---|
| 1 | `lamp-docs-labels-2026-11-28.json` (37 documents, catalog and index files, labels, the MD5 list and the PDS4 `bundle.xml`, each as exact base64 bytes with URL, status, last-modified and sha256) | 1,839,519 | `ac21b553…4708b1` | pane hash = Mac hash; all 37 HTTP 200 (28 after retries following HTTP 503 rate limiting); all 37 inner hashes reproduce |
| 2 | `LAMP_80s_240mpp_lya_albed_01.img`: Lyman-α albedo, south, cumulative | 25,020,004 | `896aa35d…8af2e2` | pane = Mac; MD5 `597527c8…14b666e` = archive list; = 2501 × 10004 B per label |
| 3 | `LAMP_80s_240mpp_lya_dqual_01.img`: its data-quality map | 25,020,004 | `3f071a9e…ff2754` | the same three checks (MD5 `894a4ef3…d4bf98`) |
| 4 | `LAMP_80s_240mpp_lya_error_01.img`: its "error" map (signal-to-noise, §4.4) | 25,020,004 | `8300ecb4…415141` | the same three checks (MD5 `71799b94…f2795`) |

- **Totals:** 76,899,531 B (four files) acquired and retained. The full map volume is 694 maps × 25,020,004 B = 17.36 GB. None of it beyond these three maps is proposed for acquisition.
- **Checkpoints:** `docs/research/moon-lamp/checkpoints.jsonl` (sha256 `1f17e6ef…db452c3`), four lines.
- **Not acquired:** north-polar maps, the other bands, ratio, brightness, exposure, illumination, photon and count maps, monthly maps, RDR/EDR files, and the SPICE kernels in `GEOMETRY/`.

## 4. The product

### 4.1 LAMP and the GDR (archive documents)

- **Instrument:** an ultraviolet spectrograph with a passband of 57.5–196.5 nm and a 1024 × 32 pixel detector (SIS §4.1).
- **Observing:** on the night side and in permanently shadowed regions, with the aperture door open. The light measured is far-UV starlight and Lyman-α sky glow reflected from the surface (SIS §4.2, ODE).
- **What the GDR holds:** CODMAC Level 5 maps built from the RDR calibrated photon events (SIS §4.3.1). There are nine map types:
  - brightness;
  - albedo;
  - an off-band/on-band "ratio";
  - raw counts;
  - calibrated photons;
  - exposure;
  - illumination;
  - "error";
  - data quality.
- **Bands:** four, Lyman-α, full stellar, on-band and off-band. The band edges are given in §4.4.
- **Maps:** one cumulative map per band and pole for the nominal mission, plus 13 monthly maps for most types.
- **Producer:** D. E. Kaufmann, Southwest Research Institute; software LAMP-MAPTOOLEXEC 0.1. The cumulative maps were created 15 Feb 2011, and the data set was released 15 Mar 2011.

### 4.2 The sample: south-polar cumulative Lyman-α albedo

- **Quantity:** "albedo as a dimensionless fraction" (label).
- **Format:** IEEE float32, little-endian (`PC_REAL`), 2501 × 2501, no header, scale 1, offset 0.
- **Period:**
  - the label gives START_TIME 2009-09-01T00:00:00 and STOP_TIME 2010-10-01T00:00:00;
  - the data-set catalog gives 2009-09-16 to 2010-09-14 (§4.4).
- **Grid:** polar stereographic on a 1,737.4 km sphere, 240 m per pixel "true at the pole", centred on 90°S. Its coverage reaches 80.13°S at the edge midpoints and 76.08°S at the corners (DSMAP, reproduced by `assess_lamp_1.py`: −80.131 and −76.078).
- **Frame:** "MEAN EARTH/POLAR AXIS OF DE421", planetocentric, east-positive. This is the same frame as the released LOLA layer.
- **Values inside 80°S (`assess_lamp_1.py`):**
  - 4,966,208 of 5,023,277 pixels are finite and flagged 0 (good);
  - the good pixels run from 0.0198 (1st percentile) through 0.0364 (median) to 0.0618 (99th percentile);
  - 39 good pixels exceed 0.2 (the largest finite value in the file is 187.1);
  - no good pixel is negative: all 141 negative values carry flag 2 or 6.
- **Coverage by 1° ring (flag 0):** 98.2% (80–81°S) to 99.7% (87–88°S); 98.3% at 89–90°S. There is no polar hole.
- **Appearance (my own look at a render, not quantified):** radial streaks follow the orbit tracks at full resolution, most visible away from the pole. Measured: the flagged pixels inside 80°S cluster between 60°E and 120°E (38,846 of 54,869), mostly near the 80°S edge.

### 4.3 What the stored number is

- **Brightness:** calibrated photons minus a modelled background, divided by exposure. The background is detector dark plus stray light, at 10⁻³ counts/s per grid cell times a wavelength scale factor (SIS steps 4–7). The background step applies to cumulative products only, so monthly maps were processed differently (another reason to use the cumulative map).
- **Albedo:** that brightness divided by an **integrated illumination map** built from "FUV illumination models" of the incident night-side and shadowed-region flux (SIS §4.3 and steps 8–10; catalog "ANCILLARY DATA").
- **What follows:** the albedo depends on that model. The archive does not describe the model's inputs or uncertainty. The page says "derived from measured brightness and a modelled illumination", and never "measured reflectance" alone.

### 4.4 Disagreements in the archive (recorded; two settled by the data)

| # | Point | Sources | Outcome |
|---|---|---|---|
| a | Lyman-α band | SIS text and data-set catalog: 119.57–123.57 nm. **Every label** (`MINIMUM/MAXIMUM_WAVELENGTH`): 119.57–125.57 nm | **unresolved.** The page would say "Lyman-α (about 121.6 nm)" and give both archived edges in Details |
| b | "Error" maps | catalog: "statistical errors (noise) – units are photons/cm2". Labels: "the signal-to-noise (SNR) ratio" | **settled by data:** quality flag 2 ("SNR < 3") is set on exactly the pixels where the error map is below 3 (53,013 of 53,013, none either way), so the map is a signal-to-noise ratio. Its values run 0 to 41.7 (median 7.2). Read as noise in albedo units, albedo ÷ error would be below 3 for every pixel |
| c | Quality flag 1 | label: "1 = NaN" | **contradicted by data:** the albedo has 7,838 NaN pixels, but flag 1 is set on only one of them. The rest carry 4 (4,957), 0 (2,257), 5 (448), 2 (170) or 6 (5). **Rule:** finiteness is checked separately; flag 0 alone does not mean a value exists |
| d | Quality value 5 | label lists 0, 1, 2, 4, 6 | **undocumented:** 449 pixels carry 5 (448 of them NaN). It is treated as not shown, and its meaning is not guessed (perhaps 1 + 4, unconfirmed) |
| e | Monthly quality and error maps | SIS: none. Catalog: all types except ratio | **settled by the listing:** there are none (16 quality and 20 error files, cumulative only) |
| f | Period | labels: 2009-09-01 to 2010-10-01. Catalog: 2009-09-16 to 2010-09-14 | **unresolved:** the page says "September 2009 to September 2010 (LRO's first mission year)" and gives both in Details |
| g | Projection inverse | DSMAP prints `X = SIN(LON)`, `Y = COS(LON)` for latitude/longitude → pixel, without the radius | **typo:** with `R·SIN`, `R·COS` the forward and inverse agree (round trip within 0.004°) |
| h | Orientation | DSMAP equations with the label's `LINE_DISPLAY_DIRECTION = UP` | **wrong for this file:** §5 |

### 4.5 What the literature says (named only, from search results; full texts not read)

- An APS 2013 abstract (Rojas et al.) reports that the coldest permanently shadowed regions have **lower Lyman-α albedo** than their surroundings, and offers high surface porosity as the best explanation, possibly tied to volatile frost.
- The Magaña et al. 2022 and 2023 JGR abstracts use **later, longer LAMP data (2009–2016)** and **different off-band and on-band edges** (on-band 148–162 nm, off-band 175–190 nm) together with Diviner temperatures to discuss condensed water and other volatiles.
- **Consequences for this proposal:**
  - the archived GDR (2009–2010 bands) is not the dataset of those later water studies;
  - the darkness of shadowed craters is an observation the page may show, but **its cause is not stated** on the page;
  - no water, frost or abundance appears anywhere.

## 5. Orientation: an independent check (`check_lamp_frame.py`)

- **Method:**
  - the quality map flags "possible sunlit peak" pixels (values 4, 5 and 6), and sunlit peaks are high ground;
  - I placed the 8,313 flagged pixels between 80°S and 88°S on the repository's released LOLA heights (`assets/moon/lola/ldem4-m-R1.i16.gz`, 0.25° cells);
  - I measured how far above the mean of good pixels in the same 0.25° latitude row they sit, under eight readings of the file (the printed one, and its mirrors and rotations).
- **Result:**

| Reading | Flagged peaks above same-row mean |
|---|---|
| **B: the file's first record lies towards longitude 0** (lines counted top to bottom; longitude 0 up, 90°E right) | **+2,088.8 m** |
| rotate −90° | +844.0 m |
| transpose | +421.4 m |
| B mirrored east–west (= A rotated 180°) | +216.8 m |
| **A: as printed** (`Y = (J − N/2 − 0.5)·scale`, `LON = ATAN2(X, Y)`, line J counted from the first record, as `LINE_DISPLAY_DIRECTION = UP` implies) | −74.0 m |
| anti-transpose | −358.5 m |
| rotate +90° | −518.1 m |
| A mirrored east–west | −653.9 m |

- **Reading:** B ranks first by 1,244.8 m, and the printed reading A ranks fifth.
- **Corroboration (descriptive, not independent of the science):**
  - read with B, the 10 km discs at the IAU Gazetteer centres of Shoemaker, Faustini, Haworth and Cabeus are darker than same-latitude controls. The medians of good pixels are 0.0267, 0.0249, 0.0283 and 0.0337, against control medians of 0.0354, 0.0350, 0.0350 and 0.0361. Controls as dark or darker: 0 of 19, 0 of 21, 1 of 21 and 3 of 21;
  - Amundsen, whose floor is partly sunlit, is brighter (22 of 23 controls at or below);
  - read as printed (A), the four discs are not consistently darker;
  - this matches the published direction in §4.5.
- **Limits of the check:**
  - LOLA's 0.25° rows are about 7.6 km apart, so this confirms the registration of large features, not alignment at 240 m;
  - it is restricted to 80–88°S;
  - it is one statistical test on one quality class.
- **Proposal:**
  - the build reads the file with B, and its tests repeat this check (B first by at least 500 m) on the shipped grid;
  - a finer check against an independent 240 m polar height product (for example LOLA's 80°S polar stereographic DEM) would need one more bounded file and Chad's go. I recommend it before release (§10, D6).

## 6. Display options

What the Moon globe can carry:
- LEND paints its 0.5° south-polar cells into the globe's 2048 × 1024 equirectangular texture.
- In that texture, 80–90°S is about 57 rows, about 5.3 km per row.
- A LAMP layer painted the same way would show crater-scale structure (Shoemaker, Haworth and Faustini each span several rows) but none of the 240 m detail.

| Option | What it shows | Payload (8-bit, fixed scale 0–0.08, 255 = not shown; measured) | New code |
|---|---|---|---|
| **L1** globe layer (like LEND) | the albedo painted into the globe texture south of 80°S from a 960 m grid; a readout at the centre of view reads the 960 m cell | 960 m grid 625², gzip 243,585 B | low: reuses the coordinator, lighting save and restore, and the readout pattern |
| **L2** 2D polar panel (like the LROC detail panel) | the map in its own polar stereographic view at 480 m, with a north arrow, 0°/90°E labels and a scale bar; no reprojection | 480 m grid 1250², gzip 1,025,199 B | medium: a new panel, pan and zoom, and a locator on the globe |
| L1 + L2 | both | both files | both |
| (not proposed) 240 m | full detail | gzip 4,309,766 B | heavy: a polar mesh or tiles |

- **Grid rules for both options (measured):**
  - each coarser cell is the mean of good, finite 240 m pixels;
  - a cell is shown only if at least half its pixels qualify;
  - inside 80°S this shows 311,757 of 313,900 cells at 960 m and 1,246,641 at 480 m.
- **Recommendation: L1 only, for this item.** It is consistent with the other Moon layers, the cost is small, and the shadowed craters are visible at globe scale. L2 is an option if Chad wants the detail; it is the honest way to show it.

## 7. Rights and citation

- PDS public domain: "Data sets archived in the PDS are in the public domain". This was read on the PDS Geosciences FAQ on 27 Nov for LEND, and the same sentence appears on the PPI FAQ (seen in search results). It is the same basis as the LOLA, Diviner and LEND entries.
- data.gov lists this data set as public with licence "us-pd" (seen in search results).
- No separate LAMP or SwRI restriction appears in the archive documents read.
- Cite: Kaufmann, D.E., *LRO L LAMP Gridded Data Record V1.0*, LRO-L-LAMP-5-GDR-V1.0, NASA Planetary Data System, 2011 (`LAMP_GDR_DS.CAT` CITATION_DESC). DOI `10.17189/1520244` (ODE). Product `LAMP_80s_240mpp_lya_albed_01.img`.
- No endorsement by NASA or SwRI is implied. No images from papers are used.

## 8. Proposed contract for L1 (if chosen; frozen at GPT's acceptance)

- **Toggle:** "Show south-polar far-UV albedo (LAMP)". Off by default. It is one coordinator layer, mutually exclusive with height, temperature and LEND, with lighting saved and restored as for LEND.
- **File:** `assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin`, about 244 kB, fetched only when switched on.
  - **Header:** a magic, the grid size, cell size, scale, the reading-B orientation constant and the source sha256.
  - **Grid:** 625² uint8, 255 = not shown.
  - **Builder:** `phase1/moonsci/build_lamp.py --check` rebuilds the grid byte-for-byte from the retained source.
  - **Pins:** the page checks the length and sha256 before use.
- **Colour:** a fixed, one-hue grey-violet ramp, 0 to 0.08. Values above 0.08 show the top colour, and the readout says "above 0.08". Not-shown cells are hatched as in LEND, and north of 80°S keeps the usual picture.
- **Readout (centre of view, 960 m cell):**
  - shown: "Lyman-α albedo 0.036 (night side, Sept 2009 – Sept 2010; from measured far-UV brightness and modelled illumination)";
  - not shown: "no value: fewer than half of this cell's 240 m pixels pass the archive's quality flags";
  - outside: "LAMP's map covers 80–90°S; north of that the usual picture is shown".
  - Three decimals; rounding as in LEND (integers, half away from zero).
- **Wording rules (Chad's brief):**
  - "far-ultraviolet (Lyman-α, about 121.6 nm): light our eyes cannot see. Not a photograph";
  - "the light measured is starlight and sky glow reflected on the night side";
  - "darker areas reflect less of this light. This map does not show ice, frost or water".
  - No cause for the darkness is stated.
- **Details (Sources `#moonlamp`):** product, DOI, both archived band edges and both periods, the quality rule, the reading-B orientation and its check, the 960 m averaging, and the modelled-illumination dependence.
- **REGISTER:** a new LAMP entry (public domain, citation, version check yearly and at each build: PDS errata and the Imaging Node listing).

### 8.1 Focused tests (for the later branch preview)

- Build: hash-pinned source; layout from the label; reading B; byte-identical rebuild; the frame check (B first by at least 500 m) on the shipped grid; tamper breaks on the header, sha and orientation constant.
- Page: off by default; one request; layer exclusivity; lighting restore; readout states; finite and flag rule; the colour clamp; plus the existing Moon suites and narrow Animals pins as before.

## 9. Not proposed, with revisit conditions

| Not proposed | Why | Revisit if |
|---|---|---|
| The archive's off/on "ratio" ("H2O absorption feature depth") maps | the archive's own name is an interpretation. Later work uses different bands, longer data and temperature context (§4.5) | Chad asks for it, with its own assessment |
| North pole | one more bounded file | Chad's go (same rules) |
| Other bands (on, off, full stellar), brightness, monthly maps | one quantity is enough for one layer; monthly maps were processed differently (§4.3) | Chad asks |
| 240 m detail on the globe | heavy; L2 covers detail | after L2, if wanted |
| Later LAMP maps (2009–2016, new bands) | not in the PDS map archive (the only map volume is 2011) | a published, citable map release appears |
| Day-side maps | "planned" in 2011 errata; none archived | they are archived |

## 10. Decisions for Chad (after GPT's review)

- **D1** Product: south-polar cumulative Lyman-α albedo, GDR V1.0 (recommended).
- **D2** Form: L1 globe layer (recommended), L2 polar panel, or both.
- **D3** Grid: 960 m means of quality-0 finite pixels, shown if at least half qualify (L1); 480 m for L2.
- **D4** Scale and colour: fixed 0–0.08, one hue, clamp shown in the readout.
- **D5** Wording: §8 rules, including no cause for the darkness and no ice, frost or water.
- **D6** Orientation: build with reading B. Allow one bounded independent 240 m height file for a finer frame check before release (recommended), or accept the coarse check with its limit stated.
- **D7** North pole: not now (recommended), or one more bounded file.

## 11. Verification limits (item 11)

- **Sample:** the frame check is coarse (§5). The crater comparison is descriptive. The illumination model is not assessed.
- **Counts:** they come from three maps of one pole and one band; nothing is inferred about the others.
- **For any later build:** the same four untested areas as every Moon release (real phone, Safari, screen reader, hardware renderer) unless they are actually done.

## 12. Records and delivery

- This proposal: `docs/concepts/MOON-LAMP-PROPOSAL.md`.
- Evidence: `docs/research/moon-lamp/` (README, two scripts, two outputs, checkpoints).
- Checklist: rev 37.
- STATUS and HANDOVER: new entries.
- Mac mirror: synced preserve-first.
- For GPT: paths and commit only.

## Change log

- Rev 1 (28 Nov 2026, 05:55 UTC): assessment, bounded sample (four files), orientation finding, options and decisions. For GPT's review.
