# Mother Earth

**See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.**

One globe in a browser showing the latest observations of the planet from open live data sources (earthquakes, aircraft, fires, geomagnetic activity; ships and more to follow), how each differs from its own baseline, and where coverage is missing or stale. Nothing is faked, nothing is implied.

Open project. Owner: Chad. Code written with Claude.

## Layout

- `phase1/worker.js` — Cloudflare Worker: scheduled collectors → R2 snapshots; hourly aggregation → D1; `/snapshot/*`, `/cells/*`, `/status`.
- `phase1/schema.sql` — D1 (SQLite) schema.
- `phase1/GUIDE-step1.md` — click-by-click deployment guide and the list of deviations from the spec.
- `phase1/wrangler.toml` — reference configuration.

The build spec (v0.3) and project brief live in the project folder; the repo is the showroom, keys never enter it.

## Status

Phase 1, step 1 (collectors) — code complete, not yet deployed. See the guide.

## Licence

AGPL-3.0 (from 1 Nov 2026; commits before that date were published under MIT). Data sources carry their own terms and commercial standing; see REGISTER.md.

## Documents
- `docs/SPEC-v0.3.md` — the build spec (deviations D1–D14 logged in `STATUS.md`)
- `docs/PROJECT-BRIEF.md` — the brief
- `REGISTER.md` — every source's terms, verbatim and dated
- `reviews/` — every external review round and our questions
