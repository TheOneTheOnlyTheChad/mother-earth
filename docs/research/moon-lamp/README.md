# Moon item 7 (LAMP) — assessment evidence

Docs only. Nothing here is served or drawn. Proposal: `docs/concepts/MOON-LAMP-PROPOSAL.md`.

- `checkpoints.jsonl`: copy of the Mac checkpoint file (`~/Documents/Mother Earth/_source-data/moon-lro-science-lamp/checkpoints.jsonl`, sha256 `1f17e6efd6b167d9366cb5158c7e9706a9f74c9b0db6df49743f3e679db452c3`). There is one line per acquisition, each written before the next acquisition started. There are four lines.
- `assess_lamp_1.py`: reads the image layout from each map's own PDS3 label (inside the retained documents JSON), so no sizes are hand-typed. It checks each map's MD5 against the archive's own `LROLAM_2001_md5.txt`. It then covers:
  - the projection extents;
  - the data-quality values against NaN and against the "error" map;
  - coverage by 1° latitude ring;
  - the albedo distribution by quality class;
  - five crater discs against same-latitude controls (descriptive only);
  - payload sizes for downsampled 8-bit grids.

  Output: `outputs/assess_lamp_1.out.json`.
- `check_lamp_frame.py`: an independent orientation test. It compares the "possible sunlit peak" flags with the repository's released LOLA height grid (`assets/moon/lola/ldem4-m-R1.i16.gz`) under eight readings of the file. It exits 1 unless reading B ranks first by at least 500 m. Output: `outputs/check_lamp_frame.out.json` (reading B first; margin 1,244.8 m).

**Documents JSON.** `lamp-docs-labels-2026-11-28.json` keeps each fetched file's exact bytes as base64, next to its URL, HTTP status, server last-modified time and sha256. There is no text decoding, so the LEND rev 1 latin-1/Windows-1252 question does not arise. Text views of the two Word documents (`DPSIS.DOC`, `ARCHSIS.DOC`) were made in the cloud workspace with LibreOffice for reading. They are not retained and not quoted beyond short phrases.

Run (each script checks the retained files' sha256 first; both need numpy):

```
python3 -I assess_lamp_1.py <dir>
python3 -I check_lamp_frame.py <dir> <repo root>
```

where `<dir>` holds:
- `lamp-docs-labels-2026-11-28.json` (`ac21b553…4708b1`)
- `LAMP_80s_240mpp_lya_albed_01.img` (`896aa35d…8af2e2`)
- `LAMP_80s_240mpp_lya_dqual_01.img` (`3f071a9e…ff2754`)
- `LAMP_80s_240mpp_lya_error_01.img` (`8300ecb4…415141`)

Retained originals: `~/Documents/Mother Earth/_source-data/moon-lro-science-lamp/`.
