# Mother Earth — handover to thread 12 (4 Nov 2026, end of thread 11)

Read `START-HERE.md` (§2 constitution · §4 deploy · §5a testing), then this file, then `STATUS.md` (newest first). Not a fresh sandbox.

**Access (Chad, 4 Nov):** Claude has full access to everything — GitHub (push), Cloudflare, Space-Track, the Mac's Mother Earth folder and `~/mother-earth`, the browser pane. Chad opens the browser pane as soon as the thread kicks off. He enters secrets himself; Claude never creates accounts.

## 0. State at the end of thread 11 (4 Nov ~06:00 UTC) — LIVE
- **Page:** main `ab8abb8`, assets `?v=202611050900` — UX round 1 public (compact cards, Observed/Computed labels, Optional layers group, credits bar below the globe, inspector source links, "What Mother Earth keeps"). Details and evidence: STATUS top section.
- **Hub 0.3.5** unchanged (sha256 `68fca7b4…`). Bindings, crons, retention unchanged.
- **Ships:** Mac primary (launchd), cloud fallback on. Last checked Mac sample 18:22 UTC 3 Nov (3,437 vessels).
- Branch `ux-round-1` = main (merged, can be deleted when convenient).

## 1. Next (Chad's calls first)
0. **UX round 1 is CLOSED.** GPT reviewed the live site 4 Nov: no new blocking issue (verified globe room, Optional layers off in one group, drifters 1,302 → off without the warning, Explore contents, FIRMS inspector layout, `#kept` wording). He did not rerun suites or recheck mobile. His brief's stale sections (orbital unreleased, CelesTrak toggle live, hub 0.3.0) were reconciled in thread 11.
1. **NSIDC citation in the hub** — `worker.js` carries the older form; NSIDC's required 2025 form is in REGISTER verbatim. One-line hub change + content-only deploy: Chad's go.
2. **Ocean plastic research:** NCEI Global Marine Microplastics DB — inspect ONE measured surface-water export first: age, methods, units, reuse standing (licence fields were blank on the archive page), coverage. Dated samples labelled not live; buoy drift stays separate from any modelled transport; own toggle off on load.
3. **Mobile pass** (agreed later): legend + imagery chip still cover the top of the globe on phones; real-phone check (Galaxy) still pending.
4. Open decisions: attribution placement (REGISTER top note); sea-ice history table (none kept today); GFW human-readable source page (link is the Data API JSON record).
5. Backlog unchanged: aircraft (522 + OpenSky feeder), FIRMS CPU attribution, CO₂ truncated-200 guard, physical long-sleep test, probe endpoints removal, Possible futures (research only — first subject to be chosen by Chad).

## 2. Measured / learned in thread 11
| | |
|---|---|
| D1 size / rows | 2.6 MB; see STATUS 4 Nov for per-table first dates and counts |
| Pane injection of a branch build | fetch `index.html`, `style.css`, `app.js` from `raw.githubusercontent.com/…/<commit>/`, swap the css/js links for blob URLs, add `<base href=".../mother-earth/">`, `document.write` it into a github.io tab — live hub data, branch layout, nothing published |
| Source links checked in the pane | aisstream /documentation ✓ · USGS /earthquakes/feed/v1.0/ ✓ (geojson.php is the format doc) · FIRMS ✓ · OSMC per-buoy htmlTable query ✓ · GFW data-api dataset = JSON ✓ |
| `.ovl[hidden]` | does NOT hide (class display:flex wins) — use `display:none` or a `[hidden]{display:none}` rule if ever needed |

## 3. Where things are
| | |
|---|---|
| Page | main `ab8abb8`, `?v=202611050900` |
| Hub | 0.3.5 |
| New tests | `phase1/ux-round1.test.cjs` (34; hub routed to 404; structure only) · drifters-ui +1 (off ≠ withheld) · terminator-ui relocation assertion |
| Screenshots | before/after sets were sent in thread 11 chat (container `/home/claude/ux/`, gone with the container) |
| Test setup in a new container | as thread 10 (`/home/claude/spike` npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs astronomy-engine; `node phase1/orbital-fixture.build.mjs`); start the local server with the Bash tool's **run_in_background** (a `nohup … &` server dies between turns) |
