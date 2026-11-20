# Earth from Space — Stage A approval package (for Chad)

20 November 2026. GPT passed probe revision 2 at `26ae2c8` (`reviews/2026-11-20-earth-from-space-probe-r2-gpt-review.md`). **Nothing here is approved or deployed. Stage A happens only on Chad's own Approve line, one of the two below, unchanged.**

## What Stage A is
A second, separate Worker, `mother-earth-evprobe`, with no access to the hub's storage and no address. For twelve hours it asks EUMETSAT's public map service for the newest picture every ten minutes (70 planned runs, at most 3 requests each), checks it the way the hub would, and logs what happened, including deliberately running short of memory in its last third. Then it is deleted. It establishes whether the picture check fits Cloudflare's memory and CPU limits and whether EUMETSAT confirms frame times to Cloudflare. It does not touch the live hub or the site.

## The two start times offered (both files built from commit `d15f192cefb9fcd74d307a85430ed9b0aab48435`)
Each file differs from the file GPT reviewed (`0da64400…`) by **one line only**, the start time. `--verify` passes for each. Slot tables beside them.

| | Option 1 | Option 2 |
|---|---|---|
| Start (UTC / SAST) | 20 Nov 13:00 / 15:00 | 21 Nov 05:00 / 07:00 |
| No request after (UTC / SAST) | 21 Nov 01:00 / 03:00 | 21 Nov 17:00 / 19:00 |
| Excluded slots (Dust RGB) | 18:00, 18:10 UTC | 06:00, 06:10 UTC |
| Runs | 70 | 70 |
| File | `reviews/evidence/2026-11-20-earth-from-space-probe/stage-a/evprobe-20261120T130000Z.js` | `…/stage-a/evprobe-20261121T050000Z.js` |
| sha256 | `a84cf8548ff86bb44a82860c2e63636f27148f8594d2ccc317201ca132488343` | `1b8e1e10702ce60c990fe98a9d1724b7c13f55ff37fbedf55a269a7df443c1cf` |
| Slot table | `…/stage-a/slot-table-20261120T130000Z.md` | `…/stage-a/slot-table-20261121T050000Z.md` |

Per size in both: 18 runs in phase 1, 5 in phase 2, 12 in phase 3 (each rung 16 to 96 MiB twice). Configuration: `phase1/evprobe.wrangler.jsonc`, sha256 `23d6e1d81c4999de2a9b9d8ee9aa059d9d651ac443010e0a5778c5015b67942b`, as GPT reviewed.

A tick that arrives before the Worker is deployed is simply a missed slot: it is never made up, and a size with missed slots comes back "incomplete", not passed. So the Worker should be in place before the start.

## The lines
Option 1:

`Approve: create Worker mother-earth-evprobe from earth-from-space-rc d15f192cefb9fcd74d307a85430ed9b0aab48435, file reviews/evidence/2026-11-20-earth-from-space-probe/stage-a/evprobe-20261120T130000Z.js sha256 a84cf8548ff86bb44a82860c2e63636f27148f8594d2ccc317201ca132488343, compatibility date 2026-10-30, no bindings, no routes, workers.dev off, version URLs off, CPU limit 10000 ms, Workers Logs on, cron */10 * * * *, start 2026-11-20T13:00:00Z, twelve hours, 70 planned runs, at most 3 requests to EUMETSAT per delivered run (210 if each scheduled time is delivered once; any duplicate delivery reported), no request after 2026-11-21T01:00:00Z, then delete the Worker`

Option 2:

`Approve: create Worker mother-earth-evprobe from earth-from-space-rc d15f192cefb9fcd74d307a85430ed9b0aab48435, file reviews/evidence/2026-11-20-earth-from-space-probe/stage-a/evprobe-20261121T050000Z.js sha256 1b8e1e10702ce60c990fe98a9d1724b7c13f55ff37fbedf55a269a7df443c1cf, compatibility date 2026-10-30, no bindings, no routes, workers.dev off, version URLs off, CPU limit 10000 ms, Workers Logs on, cron */10 * * * *, start 2026-11-21T05:00:00Z, twelve hours, 70 planned runs, at most 3 requests to EUMETSAT per delivered run (210 if each scheduled time is delivered once; any duplicate delivery reported), no request after 2026-11-21T17:00:00Z, then delete the Worker`

Sending either line is also Chad's answer that these requests to EUMETSAT's public service are allowed.

## What happens on the line
1. Claude creates the Worker in the Cloudflare dashboard (browser pane, Chad signed in). If the upload is refused, as on 15 Nov, Chad pastes the file and Claude checks the hash before and after.
2. **Read back before the start, recorded:** the deployed code's hash; compatibility date and flags; no bindings; `workers.dev` and version URLs off; no routes or domains; one cron trigger; CPU limit; Workers Logs on.
3. The probe runs by itself. Nobody is needed during the twelve hours.
4. After the end: Claude exports the probe's lines and Cloudflare's invocation records, runs `phase1/evprobe.report.mjs`, and reports each criterion per size as met, not met or incomplete. Refusals are diagnosed before anything is concluded. The window is not extended and no slot is rerun.
5. The Worker and its trigger are deleted, and that is confirmed. Until then it does nothing after its end.

## Cost and effect
Expected added cost US$0 (about 45,000 CPU-ms estimated; ceiling the limit permits 700,000; 30,000,000 included, 635,350 used on 20 Nov). Up to 24 runs in the last four hours are meant to run out of memory; they show in the probe's own metrics only. The hub, its storage and the site are not touched.

## What a pass would and would not mean
A size that qualifies may go on to Stage B (a test inside the hub that stores nothing), which is not built yet and needs its own review and lines. Stage A says nothing about spare memory in the hub.
