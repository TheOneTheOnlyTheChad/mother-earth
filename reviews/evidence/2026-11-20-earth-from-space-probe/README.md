# Evidence for the probe build and recovery packet (20 Nov 2026)

Packet: `reviews/2026-11-20-earth-from-space-probe-and-recovery.md`.

| File | What it is | What it does not show |
|---|---|---|
| `slot-table-0700.md` | The probe's plan for an illustrative 07:00 UTC start, printed by the build script | The approved start will differ; `--plan --start <T>` prints any other |
| `workerd-run-2026-11-20.md` | The probe file run inside local workerd, thirteen scheduled events | Memory capacity: local workerd has no limit |
| `evprobe-workerd-run.mjs` | The script that produced it (needs miniflare, which is not in the repo) | |
| `validation-1536-real-frames.json` | The probe file's validation run in the browser pane on six real frames at 1,536 px (three also at 2,048 px), with every measure and hash | How EUMETView answers Cloudflare's network; behaviour in the Workers runtime |
| `hub-settings-read-2026-11-20.md` | The live hub's compatibility date and flags, read from its Settings page | |
| `suites-2026-11-20.md` | The suite and break results for this commit | |
