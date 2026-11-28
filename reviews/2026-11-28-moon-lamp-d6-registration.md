# Moon item 7 (LAMP), D6: finer registration check against LOLA LDEM_75S_240M — evidence for GPT

28 Nov 2026, written from 09:59 UTC / 11:59 SAST (clock reading) · Claude · **docs only: no page build, bulk acquisition, merge, deployment or hub change.**

- **Chad's go:** "Accept D1–D8 as recommended, with GPT's recheck notes. Go for the bounded D6 finer-registration assessment: acquire and retain the specified DEM and label, verify and checkpoint them, run the checks and controls, then return the evidence to GPT. No page build, bulk acquisition, merge, deployment or hub change."
- **GPT's rev 2 recheck:** `reviews/2026-11-28-moon-lamp-proposal-rev2-gpt-recheck.md` (PASS; D6 safeguards).
- **Script:** `docs/research/moon-lamp/check_lamp_register.py`.
- **Output:** `docs/research/moon-lamp/outputs/check_lamp_register.out.json` (sha256 `9e75a6c2…6254e30a0`).

## 0. Bottom line

1. **The DEM's own transform is verified by landmarks.**
   - LOLA's `DSMAP_POLAR.CAT` (2022 revision) gives the south forward equations with NS = −1. These are exactly reading B.
   - Under that reading the five crater centres sit in depressions averaging **2,127 m** (5 of 5), ahead of all seven wrong readings (next best 1,519 m).
   - The archive's printed south inverse is numerically inconsistent with its forward: at 85°S, 90°E it gives sample 1274.4 against the forward's 2538.6.
2. **The declared registration test is INCONCLUSIVE.** No tile met the declared prominence rule on either feature, so the outcome is not a pass. The controls were equally empty, so at those settings the test did not discriminate. This is partly my design error: a MAD-based z over 81 shifts of a smooth, broad score surface stays small even when the peak is real (§4). The declared outcome stands as INCONCLUSIVE.
3. **A labelled post-hoc diagnostic (not used for the outcome) shows a ground-tied alignment within about one LAMP pixel:**
   - on the albedo-vs-slope feature, **37 of 67 tiles** peak at the same shift, (−1, +1) pixels (about 340 m);
   - that cluster **moves exactly with known artificial shifts**: applied (+2, −3) gives (−3, +4), and applied (+3, +1) gives (−4, 0);
   - with the reflected (reading A), rotated 90° and 180°, and shuffled controls it **vanishes**.
4. **The cause of the 1-pixel residual is not established.** It could be a real sub-kilometre misregistration, or the two different quantities (far-UV albedo, slope magnitude) simply not peaking at the same place. The sunlit-peak feature's pooled peak is (+1, +1), disagreeing in the east–west sign. **No shift is proposed or applied.**
5. **What this means for L1 (my reading, for GPT and Chad):**
   - the adopted transform is registered to the DEM's landmark-verified frame within about **1–2 LAMP pixels (240–480 m)** on a ground-tied diagnostic;
   - that is below L1's 960 m cells (4 pixels) and far below the globe texture's about 3.8 km rows;
   - it is not a 240 m accuracy claim. A bounded alternative is offered in §6.

## 1. Acquisitions (checkpoints 5–6; nothing else acquired)

| # | File | Bytes | sha256 | Checks |
|---|---|---|---|---|
| 5 | `lola-ldem75s240m-docs-2026-11-28.json`: `ldem_75s_240m.lbl` and `.xml`, `catalog/dsmap_polar.cat`, `errata.txt`, `aareadme.txt`, `readme.txt`, `bundle_lola_rdr.xml` (exact base64 bytes, URL, status, last-modified, sha256 each) | 207,401 | `989d0ef6…c96cc` | pane = Mac; all 7 HTTP 200; inner hashes reproduce and equal two later independent reads (pane, Chad's Chrome) |
| 6 | `ldem_75s_240m.img` | 29,062,688 | `d031efe2…97c490` | no archive checksum is published (the PDS4 xml has none); two independent pane reads identical; pane = Mac; = 3812 × 7624 B per label; MD5 `a25251d4…44b7e` recorded |

- **Retained:** Mac `_source-data/moon-lro-science-lamp/`. `checkpoints.jsonl` is now 6 lines (sha256 `b62419dc…784c4`).
- **Incident:** downloads from the pane and then from Chad's Chrome did not land between 06:45 and 07:05 UTC. A native save dialog was waiting on the Mac. Once Chad confirmed it (09:52 UTC), the first package landed: the pane's first build, `989d0ef6…`, whose hash the pane recorded at the time. The two later packages (`4b5dc5df…`, `4c1b9000…`) never landed. Checkpoint 5 was written only after the file arrived.

## 2. Product facts (from the retained label and catalog)

- **Product:** `LDEM_75S_240M` V2.0, LRO-L-LOLA-4-GDR-V1.0, created 2017-06-15, LOLA data 2009-07-13 to 2017-02-02.
- **Format:** 3812 × 3812 LSB int16; height = DN × 0.5 m relative to 1,737.4 km.
- **Projection:** polar stereographic centred on 90°S, 240 m per pixel, projection offsets 1905.5; frame Mean Earth/Polar Axis of DE421.
- **`DSMAP_POLAR.CAT` revision notes:** "2021-09-15 … revised transformation equation for longitude", and "2022-01-15 … corrected transformation and inverse for both hemispheres using factors for sign and absolute value of latitude".
  - The forward equation is `X = (I − N/2 − 0.5)·scale`, `Y = (J − N/2 − 0.5)·scale·NS`, `LON = ATAN2(X, Y)`, with NS = −1 in the south.
  - The LAMP volume's 2011 projection text has the same structure without NS. That is consistent with the LAMP archive copying the earlier, uncorrected form. This is an inference about provenance, not established.

## 3. Step 0: the DEM transform, anchored by landmarks

Measured as the ring 25–35 km mean height minus the disc ≤ 8 km mean height, at the five IAU Gazetteer centres used in the LEND and LAMP assessments.

| DEM reading | Cabeus | Shoemaker | Haworth | Faustini | Amundsen | Mean | Depressed |
|---|---|---|---|---|---|---|---|
| **documented (NS = −1)** | 776.0 | 3,286.9 | 3,390.9 | 2,486.8 | 693.3 | **2,126.8** | 5/5 |
| transpose | 622.2 | 3,227.8 | 177.7 | 1,695.1 | 1,873.2 | 1,519.2 | 5/5 |
| mirror samples | 911.9 | 331.2 | 2,446.1 | 177.7 | 1,241.3 | 1,021.6 | 5/5 |
| rotate +90 | 2,119.9 | −168.0 | 2,095.9 | 1,059.9 | −1,644.2 | 692.7 | 3/5 |
| anti-transpose | 1,095.9 | 1,309.5 | −413.4 | 900.7 | 277.2 | 634.0 | 4/5 |
| mirror lines (2011-style, NS = +1) | 650.4 | 45.1 | 241.6 | 215.9 | 1,246.8 | 480.0 | 5/5 |
| rotate −90 | 854.3 | 319.9 | −1,566.2 | 2,988.2 | −505.1 | 418.2 | 3/5 |
| rotate 180 | 363.1 | 1,162.2 | 498.2 | −1,049.3 | 152.4 | 225.3 | 4/5 |

- **Result:** the documented reading ranks first (by 607.6 m). The three large shadowed craters (Shoemaker, Haworth, Faustini) are each about 2.5–3.4 km deep only under it.
- **The landscape is dense:** many readings put most centres in some depression. The criterion is the consistent depth at all five, not the count.
- **Bilinear resampling:** LAMP pixel (I, J) maps to DEM pixel (I + 655.5, J + 655.5) in the same projected plane, sampled bilinearly. The 120 m offset is grid registration (pixel-centre against pixel-corner pole), not a displacement.

## 4. Declared test (fixed before scoring): INCONCLUSIVE

- **Tiles:** 68 eligible (250 × 250 pixels, 60 km; centre 80.5–89°S; at least 90% inside 80°S).
- **Shifts:** −4..+4 pixels on each axis.
- **Features:**
  - **F1:** mean DEM local relief (height minus its 41 × 41 box mean) at documented sunlit-peak pixels (codes 4 and 6).
  - **F2:** NCC of high-passed quality-0 albedo with high-passed slope magnitude; sign fixed in advance from the whole cap (positive).
- **Usability rule:** peak not on the window edge; z = (best − median) / (1.4826·MAD) ≥ 4; no rival within 25% at least 2 pixels away.

| Feature | Usable tiles | Unusable, by reason | Outcome |
|---|---|---|---|
| F1 | 0 | low prominence 29, under 30 flagged pixels 23, peak on edge 16 | INCONCLUSIVE |
| F2 | 0 | low prominence 66, peak on edge 1, under 80% valid 1 | INCONCLUSIVE |

- **Controls** (reflected/reading A, rotated 90°, rotated 180°, the two known shifts, shuffled): 0 usable tiles in every case, so INCONCLUSIVE throughout.
- **Why (my design error, disclosed):** the score surfaces over 81 shifts are smooth and broad. Median per-tile z is 1.1 (F1) and 1.6 (F2); the maximum is 3.2 and 2.8. A MAD-based z rule cannot pass a broad true peak, so the declared rule could not discriminate.
- **Not done:** the threshold is not relaxed after the fact, and INCONCLUSIVE is not converted into a pass.

## 5. Post-hoc diagnostic (added after §4; reported separately; not used for any outcome)

- **Method:** the same features with a ±6 pixel window. For each run it reports the most common per-tile peak positions and the pooled cap-wide peak.

| Run | F2: top per-tile peaks (count of 67) | F2 pooled peak | F1: top per-tile peaks (of 45) | F1 pooled peak |
|---|---|---|---|---|
| **main (reading B)** | **(−1, +1) 37**; (−1, +2) 8; (−2, +1) 6 | **(−1, +1)** | (6, 6) 3; (1, 0) 3; (−6, −6) 3 | (1, 1) |
| LAMP moved (+2, −3); expected cluster (−1−2, +1+3) = (−3, +4) | **(−3, +4) 35**; (−3, +5) 9; (−4, +4) 6 | **(−3, +4)** | (0, 3) 4; … | (−2, 4) |
| LAMP moved (+3, +1); expected (−4, 0) | **(−4, 0) 38**; (−4, +1) 9; (−5, 0) 5 | **(−4, 0)** | (−1, −1) 4; … | (−2, 0) |
| reflected (reading A) | (−6, −6) 7; (6, −6) 5; (−6, 6) 4 (window corners) | (5, −6) | corners | (−6, −6) |
| rotated 90° | (−6, 6) 4; (6, 6) 3; (1, −4) 3 | (6, 3) | corners | (−6, −6) |
| rotated 180° | (−6, −6) 4; (6, −6) 3; (−6, 5) 3 | (−3, 5) | corners | (6, 5) |
| shuffled pairings | (−6, −6) 5; (6, −6) 3; (−6, −5) 3 | (−4, 1) | corners | (1, 6) |

- **Reading:**
  - F2's cluster exists only under reading B, sits within about one pixel of zero, and moves exactly by the applied shift. It is therefore tied to the ground, and it independently corroborates B at 60 km tile scale.
  - Its position, (−1, +1) pixels (≈240 m each way, ≈340 m diagonal), means LAMP at (i, j) best matches the DEM slope field at (i − 1, j + 1).
  - F1 is weak (few flagged pixels per tile) and its pooled peak, (+1, +1), disagrees in the east–west sign.
- **Context check:** across the cap, high-passed albedo correlates weakly with slope magnitude (r = 0.0064), and hardly at all with the signed slope components (+x: 0.0021; later records: −0.0005). Pooled cap-wide correlations this small neither confirm nor exclude a directional relation within tiles.
- **Cause not established:** a one-pixel offset between two different quantities' best match is not a measured displacement. No shift is applied.

## 6. What this supports, and the options

**Supported:**
- the DEM's documented transform (landmarks);
- reading B for LAMP, now also at 60 km tile scale, by a ground-tied cluster absent under every wrong symmetry;
- registration to within about 1–2 LAMP pixels (240–480 m) on the albedo-vs-slope diagnostic.

**Not supported:**
- 240 m registration;
- the cause or reality of the (−1, +1) pixel residual;
- any absolute accuracy claim.

**Options for GPT's view and Chad's decision:**
- **(a) Accept for L1 (my recommendation):**
  - record "registered within about 1–2 LAMP pixels to LOLA's landmark-verified frame (post-hoc diagnostic); sub-pixel offset unresolved; no shift applied";
  - the build's frame guard repeats the landmark check, and the tile-cluster diagnostic on the shipped grid's source as a regression guard, not a release criterion;
  - L1 cells are 4 pixels and the texture rows are about 16 pixels.
- **(b) One bounded re-run with a new criterion declared now, before running:**
  - prominence measured by a block-bootstrap over tiles of the pooled peak position (95% interval);
  - pass if the interval lies within ±1 pixel and the controls' intervals do not;
  - the same inputs; no new acquisition.
- **(c) Park the registration question as "within 2 pixels, unresolved below" with no further work**, and state it in Details.

**Not proposed:** applying a (−1, +1) shift, or fetching a finer DEM.

## 7. Limits

- One DEM, one band and one pole.
- The tiles share terrain and are not independent observations (68 tiles; 45 and 67 usable for the diagnostic).
- The post-hoc analysis was chosen after seeing the declared result, and is labelled as such.
- The crater centres come from the IAU Gazetteer as recorded on 27 Nov.
- The illumination model is unassessed.
- No browser or rendering claim is made.
