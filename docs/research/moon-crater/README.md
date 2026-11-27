# Moon item 5 (CRaTER): assessment evidence, 27 Nov 2026

For `docs/concepts/MOON-CRATER-PROPOSAL.md` rev 1. Docs and assessment tooling only; nothing here is served.

- `checkpoints.jsonl`: one line per acquisition, written on the Mac before the next fetch. The retained files are in Mac `~/Documents/Mother Earth/_source-data/moon-lro-science-crater/`, not in the repo.
- `assess_crater.py` → `assess_crater_output-2026-11-27.txt`: integrity against the checkpoints; L2 SEC statistics for both days; position comparison as tagged; L2 PRI slice checks.
  - **Superseded line:** "GTLLD flag share" and "summed ENERGY over flagged entries" use the column the label calls `GTLLDFLAGS`. `assess_crater_2` (a) shows that column behaves as the near-saturation flag, so that sum is not meaningful (proposal §5.4.1).
- `assess_crater_2.py` → `_2_output`: (a) what the two flag columns track; (b) the time-tag offset in the position comparison; (c) the D2 singles elevation per hour.
- `assess_crater_3.py` → `_3_output`: the maximum of the offset-corrected comparison is minute 0 (an interpolation edge); the statistics without it.
- `assess_crater_4.py` → `_4_output`: per-minute and per-10-minute `GOOD` variation against Poisson; relation with altitude.

- **Rev 2 (27 Nov 2026, after GPT's rev 1 review):**
  - `bins_preview.py` → `bins-preview-2026-11-27.json` and `bins_preview_output-2026-11-27.txt`: the R1 chart's bins under proposal rev 2 §7.2–§7.3 and §12 (UTC record-timestamp bins, complete-and-nominal rule, √N/T benchmark), the seven tamper cases, and GOOD/REJECT/D2 singles on 11 June 18:00–21:00. Usage `python3 -I bins_preview.py <acquisitions dir> <out json> [--tamper NAME]`.
  - `assess_crater_5.py` → `_5_output`: counters, altitude and latitude per 10 minutes, 10 June 11:00–14:20 (the 12:40–13:10 rise).
  - In rev 1's `assess_crater_2` (b) and `_3`, shifting by `FRACT` and the fitted 0.02 s is a **diagnostic hypothesis**, not a correction (proposal rev 2 §7.1).

Run: `python3 -I <script> <acquisitions dir> <repo root>` (`_4` takes only the acquisitions dir). Run in the workspace via Claude Science's compute tools, 27 Nov 2026, 10:10–10:13 UTC.
