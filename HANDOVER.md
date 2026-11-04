# Mother Earth — handover to thread 13 (4 Nov 2026, end of thread 12)

Read `START-HERE.md` (§2 constitution · §4 deploy · §5a testing), then this file, then `STATUS.md` (newest first). Not a fresh sandbox.

**Access (Chad, 4 Nov):** Claude has full access — GitHub (push), Cloudflare (dashboard session in the browser pane), Space-Track, the Mac's Mother Earth folder and `~/mother-earth`, the browser pane. Chad enters secrets himself; Claude never creates accounts. Every deploy, schedule change and push to main that changes the public page needs his explicit go. **Tell Chad up front whenever his screen must be on the Claude app** (standing preference, 4 Nov).

## 0. State at the end of thread 12 (4 Nov ~12:45 UTC) — LIVE
- **Page:** main `e49c8a2`, assets `?v=202611061400`. New since thread 11: NSIDC 2025 citation form; **Microplastic samples — dated** optional layer (public 12:28 UTC; badge "loaded" since ~12:40).
- **Hub 0.4.0** (`7ef3747`, worker.js sha256 `f8335c3b…`). Bindings 16 incl. `PLASTIC_ENABLED=1`. Plastic job on the hourly tick when the last success is > 20 h old (≈ daily); first run 4 Nov 12:16 UTC: 1,145 rows, 647 reproduced / 11 possible date conflict / 1 not reproduced / 486 no original; 40 ms CPU, 8.4 s wall. Pinned Oceaneye original in R2 `ref/oceaneye-seanoe-94022.zip` (96,249 B, sha256 `89f1018b…`).
- **NSIDC:** hub citation = NSIDC 2025 form, access date = actual fetch date; verified on the 09:07 run.
- Ships: Mac primary + cloud fallback, unchanged. Retention unchanged.
- Leftover remote branches `nsidc-page`, `plastic-rc`, `plastic-loaded` are merged; the session proxy refuses branch deletes — delete when convenient.

## 1. Next (Chad's calls first)
1. **NCEI v2.2 check** (accession 0276422 page returned 503 on 4 Nov): GPT reports v2.2 published 4 Dec 2025 with methods (net 0.6 × 0.15 m, GPS before 2015 then flowmeter, 5 mm / 1 mm / 300 µm sieving). Read it; if it documents the 343 post-2021 rows or the size classes, update the Sources `#plastic` text and REGISTER.
2. **Mobile pass** (agreed): legend + imagery chip cover the top of the globe on phones — now worse while plastic is on (its legend line is long). Real-phone check (Galaxy) still pending.
3. Plastic follow-ups (research, no build without Chad): Law 2010 stays a reference candidate (6,135 vs paper's 6,136; pieces/km² conversion unestablished); 72-hour hypothetical drift experiment (OpenDrift/PlasticParcels + Copernicus currents) — needs Python + runtime measurement, not the Worker; AOMI / The Ocean Cleanup ADIS as later sources (AOMI asks to be contacted before publication).
4. Open decisions unchanged: attribution placement (REGISTER top note); sea-ice history table; GFW human-readable source page.
5. Backlog unchanged: aircraft (OpenSky feeder), FIRMS CPU attribution, CO₂ truncated-200 guard, physical long-sleep test, probe endpoints removal, Possible futures (research only).

## 2. Learned in thread 12
| | |
|---|---|
| Settings form after a code deploy | a Variables form opened BEFORE a code deploy saves onto the OLD code (version 44 rolled 0.4.0 → 0.3.6). Reload Settings first; check `/` after any settings change |
| `node --check` | missed a duplicate function declaration in the ES module; load it: `node --input-type=module -e "await import('./phase1/worker.js')"` |
| Session safety check | blocked one content-only deploy despite Chad's go; went through after his explicit re-confirmation. Don't route around it |
| ArcGIS paging | `Ocean_Surface_Microplastics_(PS)` maxRecordCount 1,000 (`Marine_Microplastics_WGS84` 2,000); dates stored as US local midnight (05:00/06:00 UTC) |
| Mac folder writes | `mv` replace = delete (blocked). Sync with `curl -fsS raw…/<commit>/<file> -o $HOME/me.tmp && cat $HOME/me.tmp > <file>` via device_bash (the Mac VM reaches raw.githubusercontent.com) |
| KEYS.md | line 8 = ADMIN_KEY (format `| ADMIN_KEY | <key> | …`) |
| Pane fetches | ArcGIS REST and the NERC vocab server are CORS-open; NCEI pages slow/503 during migration; seanoe.org and ncei.noaa.gov granted in the pane |
| Shallow clone refspec | was main-only (hook couldn't see branches) — set `+refs/heads/*:refs/remotes/origin/*` |

## 3. Where things are
| | |
|---|---|
| Plastic research | `reviews/2026-11-04-ocean-plastic-export.md` (§1–10), `reviews/2026-11-04-plastic-experience-proposal.md` |
| Plastic tests | `node phase1/plastic-hub.test.mjs` (11) · `node phase1/plastic-ui.test.cjs` (29; needs the 8899 server + /home/claude/spike globe.gl 2.45.0) |
| Test setup, new container | `/home/claude/spike`: `npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs astronomy-engine`; `mkdir -p /home/claude/fixtures && node phase1/orbital-fixture.build.mjs`; server via Bash `run_in_background` |
