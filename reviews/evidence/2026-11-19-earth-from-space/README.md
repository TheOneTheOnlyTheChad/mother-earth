# Earth from Space: stage 1 and stage 2 evidence (19 Nov 2026)

All read-only. Nothing here was produced by a production deployment, storage write, gate or schedule of this feature.

| File | What it is |
|---|---|
| `decoder-measurements.jsonl` | `node --expose-gc phase1/earthview-decoder-measure.mjs <frame>`, one process per real frame (Node 22, 2 vCPU cloud workspace). CPU per step, JavaScript memory held when the decode returns, process peak. |
| `damaged-input.md` | What each damaged picture does at each check, from `phase1/earthview-hub.test.mjs` section G and the calibration run. |
| `validation-calibration.md` | The comparison measures on the three real frames, matched and deliberately mismatched, and the limits chosen from them. |
| `served-time-production-read.json` | A read of the PUBLIC production route `/snapshot/dustrgb/meta` at 18:33 UTC: whether EUMETView's served-time header reached the production hub for today's two Dust RGB runs (same service, another layer). |
| `request-box.md` | The request box and where the Earth's edge falls in it. |
| `timing-night.json` | The night listing-delay sample, 17:33 to 20:33 UTC: 176 reads, 18 new frames, listed 19.9 to 24.7 minutes after their frame time. Morning and afternoon samples not yet run. |

Fixtures: `phase1/earthview-fixtures/` (three real frames, with their request and hashes in `SOURCE.md`).
