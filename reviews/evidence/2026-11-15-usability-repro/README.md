# Usability reproduction, 15 Nov 2026 (main 1f6af0e)

Reproduction only; nothing here changes the page. Brief: `docs/concepts/CONTROL-CENTRE-USABILITY-BRIEF.md`.

- `fire-states.cjs` → `fire-states.json`: six hub states for fires (A missing daily feed, B failed refresh, C valid zero, D run mismatch, E records unreadable, F all good), read on the card, find note, search notes, summary report and place view. `/place` is answered by the real `phase1/worker.js` (fresh import per state; the module caches the records file).
- `widths.cjs` → `widths.json`: the legend line with layers on, off and down; header and control probe at 721–1280 px with the real fonts.
- `tablet.cjs` → `tablet.txt`: where the globe, legend, credits and layer switches sit at nine viewport sizes.

Run (kit as START-HERE §4z): static server on the repo root at 127.0.0.1:8899, then
`NODE_PATH=/home/claude/spike/node_modules node --no-warnings <script>` from a folder whose `node_modules/playwright` is the google-chrome shim.
Paths inside the scripts point at `/home/claude/mother-earth` and `/home/claude/repro`.

Limits: legacy `rows` records file (production serves `lines/1`); software rendering, so the globe itself did not draw; fixtures, not live data.
