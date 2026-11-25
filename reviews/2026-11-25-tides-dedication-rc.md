# Tides — dedication line (follow-up release candidate)

Branch `tides-dedication-rc`, from main `c8313b4` (Tides live as merge `54642c5`). Not merged, nothing live, no hub change.

## Chad's request (25 Nov 2026)
A small note at the bottom of the Tides page: "Dedicated to my friend Mark Tobias". Chad: "do the dedication fix now only" — GPT's wording narrowing ("nothing is fetched" → "no tide observations or live feeds are fetched") is **not** in this candidate; it follows separately.

## Change
- `tides.html` only: one paragraph `<p class="dim">Dedicated to my friend Mark Tobias</p>` as the last element of `<main>`, after the "Sources and method" panel. Uses the page's existing muted-text class (`body.tides .dim`, 15 px, `--dim` colour). No CSS, script, Sources, REGISTER or asset change; no cache key change needed (HTML is not keyed).
- `tides.html`: 22,774 → 22,831 B; sha256 `1ac52e79…2b03` → `77dd7829…a746`.
- Served-file list for this follow-up: `reviews/evidence/2026-11-25-tides-dedication-manifest.json` — the same 37 paths as the release manifest; 36 unchanged, `tides.html` new. The release manifest `reviews/evidence/2026-11-25-tides-release-manifest.json` is left as the release record (so `release_manifest.mjs --check` now reports `tides.html` DIFFERENT on this branch, by design).

## Checks (this branch)
- `build_tides.mjs --check`: cross-section and 3 image records agree.
- `tides-model` 42 passed; `tides-ui` 60 passed; `tides-nav` 2,882 passed; Animals suite section 13 (Tides pins 13o/13p) 18 passed.
- Layout: at 390 and 1280 px the line is the last element of `<main>`, one line, no horizontal overflow (scrollWidth = viewport).

## After Chad's Approve line
Merge (page only), then run the served check in the browser pane against the dedication manifest (37 of 37), and confirm the line shows on the live Tides page.
