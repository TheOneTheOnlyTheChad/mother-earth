# Mother Earth — handover to thread 11 (3 Nov 2026, end of thread 10)

Read `START-HERE.md` (§2 constitution · §4 deploy · §4a measuring CPU · §5a testing), then this file, then `STATUS.md` (newest first). Not a fresh sandbox: nothing below needs re-investigating.

## 0. State at the end of thread 10 (3 Nov ~18:30 UTC) — everything below is LIVE
- **Page:** main `047d733`, assets `?v=202611041900`. Public layers added this thread: **Drifting buoys** (own card, left column, off on load, zero requests until on). Orbital GEO line now a plain count ("N above geostationary height (35,786 km)"). Ships card labels any sample the cloud hub took.
- **Hub 0.3.5** (worker.js sha256 `68fca7b4…`, commit `047d733`). Bindings 15: plain `DRIFTERS_ENABLED=1`, `ORBITAL_ENABLED=1`, `SATELLITES_ENABLED=0`, `SHIPS_FALLBACK=1`; secrets ADMIN_KEY, AISSTREAM_KEY (new, Chad pasted), FIRMS_MAP_KEY, GFW_API_KEY, INGEST_KEY, OPENSKY ×2, SPACETRACK ×2; D1 + R2. Crons unchanged (`11,41`, `*/15`, `*/5`, `7 * * * *`).
- **Drifters:** NOAA OSMC ERDDAP `OSMC_flattened` (GTS reports, **CC0**), one ~100 KB request on the hourly :07 job, latest fix per buoy in 24 h; ~1,300 buoys; future-stamped fixes refused (~10/run); one current snapshot only (latest/ + latest-cells/, no history). First scheduled run 18:08 UTC ok (1,297 buoys). 21 ms CPU.
- **Ships:** Mac stays primary. **Cloud fallback** on the */15 tick: samples only if the latest ships sample is > 40 min old and no attempt in 25 min; Mac-shaped envelope, `collected_by: cloud hub…`; a Mac sample landing meanwhile wins. ~92 ms CPU per sample. **Measured twice: the cloud connection hears 43–55 % of the vessels the Mac hears** (1,873 vs 3,408; 1,471 vs 3,437 back-to-back 18:21/18:22). Cause NOT established. The card states it.
- **Ships rollup fix (0.3.1):** batch re-aggregates the previous 6 h when a sample file arrived after its hour was written. 2 Nov hour 22 repaired (`absent` → `down`, evidence 1 object = 1 attempt).
- **CelesTrak satellites job stopped** (`SATELLITES_ENABLED=0`); its last file and `/snapshot/satellites` remain but nothing reads them.
- **Forest `highest: 0` watch closed:** full sweep 558 cells; 32 cells report highest, 51,497 pixels.

## 1. Next (Chad's calls first)
1. **Storage wording (Chad's direction 3 Nov):** "we are and will slowly start collecting data now" — Mother Earth is the baseline for his larger purpose. Keep the D1 hourly aggregates running (not stopping them). Fix Sources & Details so it says plainly what is kept (hourly counts per layer/cell since 30 Oct, raw snapshots 48 h) and that the page shows none of it yet. Any *more* history: size and cost it first, his go.
2. **Optional-layers group:** Drifters (left) and Orbital (right) are both off-by-default but sit apart — one "Optional layers" group, each toggle still independent. Branch, screenshots, his go.
3. **Compact desktop layout** so the globe has room (mobile is not his priority now). Keep observation window, freshness, coverage, computed-vs-observed visible. Branch + screenshots first.
4. **Inspector source links** (only quakes have one).
5. **Ocean plastic:** NCEI Global Marine Microplastics DB (1972–present, dated samples, licence fields blank on the archive page). Chad: break the "now" rule for this one, labelled as dated samples, not live; say no one tracks it continuously. Find NCEI's data route (portal export / feature service), record the blank licence in REGISTER, own toggle off on load. Must say: drifter tracks do not show plastic.
6. Backlog: aircraft (blocked twice: Cloudflare 522 + OpenSky requires a feeder; other open ADS-B networks e.g. adsb.lol untested), CelesTrak payload status (Chad: leave Payloads mixed), Galaxy phone test, remove probe endpoints when convenient.
- **Context (Chad, 3 Nov):** GPT compared Mother Earth to "Overwatch". Chad: his vision has nothing to do with it; he dislikes it, chiefly because it runs video surveillance. Take presentation lessons only; no surveillance, no cameras, no targeting people — ever.

## 2. Measured in thread 10
| | value |
|---|---|
| OSMC drifters, latest-per-buoy request | 102 KB, ~4.4 s, 1,306 rows, 10 future-stamped, 42 SST NaN, quoted country fields ("KOREA, REPUBLIC OF") |
| Worker → OSMC | reachable (unlike OpenSky/CelesTrak) |
| Worker → aisstream | WebSocket 101 in ~2 s; **frames arrive as Blob** (0.3.3 threw on every frame; fixed 0.3.4) |
| aisstream | 3 subscribed connections per account (KEYS.md line 16) |
| Cloudflare Paid limits (docs) | cron CPU 30 s (< 1 h interval) / 15 min (≥ 1 h); cron wall 15 min; 6 simultaneous outbound connections per invocation |

## 3. Watch items
- Drifters: count stable ~1,300; refusals ~10/run (future stamps). A collapse below 50 % of the previous count is refused by design — check if the card goes Unknown.
- Ships fallback: first real fallback sample will happen the first time the Mac is off > 40 min; open a record on the live page then and read the label.
- `/admin/probe/ships`, `/admin/probe/spacetrack`, `/admin/probe/orbital-build` still deployed (admin-key only, harmless).
- Shallow clone quirk: `git fetch --depth=1 origin <branch>` can cut parent links → "unrelated histories" / no ff. Fix: `git fetch --deepen=5 origin main <branch>`. Remote refspec set to `+refs/heads/*:refs/remotes/origin/*`.

## 4. Where things are
| | |
|---|---|
| Page | main `047d733`, `?v=202611041900` |
| Hub | 0.3.5, sha256 `68fca7b4…` |
| Branches | `aircraft-rc` (pre-orbital base; regenerate on main if ever used) · `bench-orbital` · `orbital-rc` · `geo-wording` · `drifters-rc` · `ships-fallback` (all merged except aircraft/bench) |
| New tests | `drifters-hub.test.mjs` 12 · `drifters-ui.test.cjs` 24 · `ships-late.test.mjs` 7 · `ships-probe.test.mjs` 11 · `ships-fallback.test.mjs` 7 (real 60 s listens, ~3 min) |
| Admin key | KEYS.md line 8 on the Mac |
| Test setup in a new container | `cd /home/claude/spike && npm i globe.gl@2.45.0 satellite.js@6.0.2 pngjs astronomy-engine`; `mkdir -p /home/claude/fixtures && node phase1/orbital-fixture.build.mjs`; `python3 -m http.server 8899 --bind 127.0.0.1` in the clone; `NODE_PATH=/home/claude/spike/node_modules:$(npm root -g)` for the .cjs suites |
