# Earth from Space: stage 1 and stage 2 evidence (19 Nov 2026)

All read-only. Nothing here was produced by a production deployment, storage write, gate or schedule of this feature.

| File | What it is |
|---|---|
| `decoder-memory-rev2.md` | **Corrected** decoder memory and CPU (20 Nov): raw Node counters, returned footprint, sampled peak and RSS kept apart; the live hub's own memory figures; the shared-isolate caveat. Raw runs: `decoder-measurements-rev2.jsonl`. |
| `decoder-measurements-rev1-superseded.jsonl` | The first measurement. **Superseded: it double-counted array storage and its "memory held" figure was not a peak.** Kept for the record. |
| `cloudflare-dashboard-read-2026-11-20.json` | Read-only dashboard text: the live hub's memory, CPU and error counts over 24 hours; Observability usage for the billing cycle. |
| `damaged-input.md` | What each damaged picture does at each check, from `phase1/earthview-hub.test.mjs` section G and the calibration run. |
| `validation-calibration.md` | The comparison measures on the three real frames, matched and deliberately mismatched, and the limits chosen from them. |
| `served-time-production-read.json` | A read of the PUBLIC production route `/snapshot/dustrgb/meta` at 18:33 UTC: whether EUMETView's served-time header reached the production hub for today's two Dust RGB runs (same service, another layer). |
| `request-box.md` | The request box and where the Earth's edge falls in it. |
| `timing-night.json` | The night listing-delay sample, 17:33 to 20:33 UTC: 176 reads, 18 new frames, listed 19.9 to 24.7 minutes after their frame time. Morning and afternoon samples not yet run. |

Fixtures: `phase1/earthview-fixtures/` (three real frames, with their request and hashes in `SOURCE.md`).

Added 20 Nov for the release-readiness proposal (`docs/concepts/EARTH-FROM-SPACE-RELEASE-READINESS-PROPOSAL.md`): `workerd-local-spike-2026-11-20.md` (the validation run inside the Workers runtime locally; what that can and cannot show), `eight-page-suites-2026-11-20.md` (cause of the eight failures: the wrong local server), `cloudflare-billable-usage-read-2026-11-20.json` (account-wide usage, read-only).
