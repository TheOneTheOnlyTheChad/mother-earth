# Moon item 7 (LAMP) — assessment evidence

Docs only. Nothing here is served or drawn. Proposal: `docs/concepts/MOON-LAMP-PROPOSAL.md`.

- `checkpoints.jsonl`: copy of the Mac checkpoint file (`~/Documents/Mother Earth/_source-data/moon-lro-science-lamp/checkpoints.jsonl`, sha256 `1f17e6efd6b167d9366cb5158c7e9706a9f74c9b0db6df49743f3e679db452c3`). There is one line per acquisition, each written before the next acquisition started. There were four lines at rev 1; six since D6 (`b62419dc…784c4`).
- `assess_lamp_1.py`: reads the image layout from each map's own PDS3 label (inside the retained documents JSON), so no sizes are hand-typed. It checks each map's MD5 against the archive's own `LROLAM_2001_md5.txt`. It then covers:
  - the projection extents;
  - the data-quality values against NaN and against the "error" map;
  - coverage by 1° latitude ring;
  - the albedo distribution by quality class;
  - five crater discs against same-latitude controls (descriptive only);
  - payload sizes for downsampled 8-bit grids.

  Output: `outputs/assess_lamp_1.out.json`.
- `check_lamp_frame.py` (rev 2, 28 Nov 2026): a coarse orientation diagnostic.
  - It places the documented sunlit-peak codes 4 and 6 (value 5 excluded) on the repository's released LOLA grid (`assets/moon/lola/ldem4-m-R1.i16.gz`) under eight readings of the file, against two baselines (same-row good pixels; the whole LOLA row).
  - It reports the number of distinct LOLA cells involved (1,574) and the cardinal longitudes of reading B.
  - It exits 1 unless reading B ranks first on both baselines by at least 500 m.
  - Output: `outputs/check_lamp_frame.out.json`: B first by 1,255.7 m and 1,248.2 m.
  - It does not test translation or 240 m registration.
- `assess_lamp_2.py` (rev 2): R3/R4 evidence. It covers:
  - what a 2500 crop drops versus the padded 2504 grid, and the cell-centre origin (pole at fractional index 312.125);
  - the no-source wedges;
  - the S0–S3 cell states;
  - the uint16 thousandths plane checked against `Decimal` ROUND_HALF_UP for every shown cell, and the measured sizes;
  - the rev 1 8-bit route's readout loss;
  - the outlier counts, their SNR and distance to peak flags, and what a plausibility mask would change;
  - the globe texture geometry.

  Output: `outputs/assess_lamp_2.out.json`.
- Note: `assess_lamp_1.py`'s payload section measures the rev 1 8-bit route, which rev 2 withdraws. Its other results stand.

- `check_lamp_register.py` (D6, 28 Nov 2026): the finer registration check against LOLA `LDEM_75S_240M`.
  - **DEM landmark check:** the documented transform puts the five crater centres in depressions averaging 2,126.8 m, ahead of seven wrong readings.
  - **Declared tile test:** INCONCLUSIVE (no usable tiles; the controls are also empty).
  - **Labelled post-hoc diagnostic** (±6 pixel window): the albedo-vs-slope cluster at (−1, +1) pixels moves with known shifts and vanishes under wrong symmetries.

  Output: `outputs/check_lamp_register.out.json`. Report: `reviews/2026-11-28-moon-lamp-d6-registration.md`.
- `checkpoints.jsonl` now has 6 lines (`b62419dc…784c4`); lines 5–6 are the LOLA documents JSON and `ldem_75s_240m.img`.

**Documents JSON.** `lamp-docs-labels-2026-11-28.json` keeps each fetched file's exact bytes as base64, next to its URL, HTTP status, server last-modified time and sha256. There is no text decoding, so the LEND rev 1 latin-1/Windows-1252 question does not arise. Text views of the two Word documents (`DPSIS.DOC`, `ARCHSIS.DOC`) were made in the cloud workspace with LibreOffice for reading. They are not retained and not quoted beyond short phrases.

Run (each script checks the retained files' sha256 first; both need numpy):

```
python3 -I assess_lamp_1.py <dir>
python3 -I check_lamp_frame.py <dir> <repo root>
python3 -I assess_lamp_2.py <dir>
python3 -I check_lamp_register.py <dir>   # also needs ldem_75s_240m.img (d031efe2…97c490)
```

where `<dir>` holds:
- `lamp-docs-labels-2026-11-28.json` (`ac21b553…4708b1`)
- `LAMP_80s_240mpp_lya_albed_01.img` (`896aa35d…8af2e2`)
- `LAMP_80s_240mpp_lya_dqual_01.img` (`3f071a9e…ff2754`)
- `LAMP_80s_240mpp_lya_error_01.img` (`8300ecb4…415141`)

Retained originals: `~/Documents/Mother Earth/_source-data/moon-lro-science-lamp/`.
