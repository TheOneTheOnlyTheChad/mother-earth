# Moon item 6 (LEND) — assessment evidence

Docs only. Nothing here is served or drawn. Proposal: `docs/concepts/MOON-LEND-PROPOSAL.md`.

- `checkpoints.jsonl` — copy of the Mac checkpoint file (`~/Documents/Mother Earth/_source-data/moon-lro-science-lend/checkpoints.jsonl`, sha256 `7520b76095917ebdabd581c48bf62c38da037a46a4ffb22950afdf13d55ebbaa`). One line per acquisition, written before the next; line `2-correction` corrects an estimated fetch time in line 2.
- `assess_lend_1.py` — layout from the file's own PDS4 label (in the retained documents JSON); grid, coverage, detector fields, cell-scale noise. Output `outputs/assess_lend_1.out.json`.
- `assess_lend_2.py` — 30 km discs around five named craters (IAU Gazetteer centres) against same-latitude controls. Output `outputs/assess_lend_2.out.json`.
- `preview_lend_3.py` — numeric preview of option L1 (display smoothing and withholding), radius 30 and 15 km. Outputs `outputs/preview_lend_3.r30.out.json`, `outputs/preview_lend_3.r15.out.json`.

Run (each checks the retained files' sha256 first):

```
python3 -I assess_lend_1.py <dir>
python3 -I assess_lend_2.py <dir>
python3 -I preview_lend_3.py <dir> 30 0.5
```

where `<dir>` holds `lend_rdr_alds_20111211.dat` (`e6b1c2d5…0031ef`) and `lend-docs-labels-2026-11-27.json` (`7283e751…ff34ab`). `preview_lend_3.py` needs numpy.
