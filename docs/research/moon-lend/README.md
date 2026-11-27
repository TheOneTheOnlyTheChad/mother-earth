# Moon item 6 (LEND) — assessment evidence

Docs only. Nothing here is served or drawn. Proposal: `docs/concepts/MOON-LEND-PROPOSAL.md`.

- `checkpoints.jsonl` — copy of the Mac checkpoint file (`~/Documents/Mother Earth/_source-data/moon-lro-science-lend/checkpoints.jsonl`, sha256 `7520b76095917ebdabd581c48bf62c38da037a46a4ffb22950afdf13d55ebbaa`). One line per acquisition, written before the next; line `2-correction` corrects an estimated fetch time in line 2.
- `assess_lend_1.py` — layout from the file's own PDS4 label (in the retained documents JSON); grid, coverage, detector fields, cell-scale noise. Output `outputs/assess_lend_1.out.json`.
- `assess_lend_2.py` — 30 km discs around five named craters (IAU Gazetteer centres) against same-latitude controls. Output `outputs/assess_lend_2.out.json`.
- `preview_lend_3.py` (rev 1) — numeric preview of option L1. The figures are for a disc **radius** of 30 km (60 km diameter) and 15 km (30 km diameter). Outputs `outputs/preview_lend_3.r30.out.json`, `outputs/preview_lend_3.r15.out.json`.
- `preview_lend_4.py` (rev 2) — the same display operation with the geometry stated, the fixed-reference benchmark beside the propagated formal error (reference and covariance), support classes (complete, edge-truncated, missing-affected) and display-state counts. Output `outputs/preview_lend_4.r30.out.json`.
- `check_lend_4.py` (rev 2) — seam, radius boundary and a 4,000-draw Monte Carlo check of the propagated error formula under its own independence model; exits 1 on failure. Output `outputs/check_lend_4.out.json` (PASS).

**Note on the documents JSON:** its `note` field says "latin1-decoded". The browser's `TextDecoder('latin1')` follows the WHATWG Encoding Standard, which maps that label to Windows-1252. Re-encoding with Windows-1252 (with 0x81, 0x8D, 0x8F, 0x90, 0x9D passed through) reproduces all 19 recorded hashes. The retained file is not rewritten.

Run (each checks the retained files' sha256 first):

```
python3 -I assess_lend_1.py <dir>
python3 -I assess_lend_2.py <dir>
python3 -I preview_lend_3.py <dir> 30 0.5
python3 -I preview_lend_4.py <dir> 30 0.5
python3 -I check_lend_4.py <dir>
```

where `<dir>` holds `lend_rdr_alds_20111211.dat` (`e6b1c2d5…0031ef`) and `lend-docs-labels-2026-11-27.json` (`7283e751…ff34ab`). `preview_lend_3.py`, `preview_lend_4.py` and `check_lend_4.py` need numpy.
