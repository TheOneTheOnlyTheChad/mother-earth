# Mother Earth — status (31 Oct 2026 — thread 2, 09:00 SAST)

**Deployed on Cloudflare: collector 0.1.5 (deployed 31 Oct 06:37 UTC; repo `main` matches). `/ingest` live and proven with the Mac mock feed.** Read `START-HERE.md` first.

**Public URL:** https://theonetheonlythechad.github.io/mother-earth/
**Hub:** https://mother-earth.chadoberholzer.workers.dev (`/status`, `/cells/<layer>`, `/snapshot/<layer>`)
**Repo:** https://github.com/TheOneTheOnlyTheChad/mother-earth (push to `main`; no branches unless a change could break the running collector)

## Running
| Layer | Source | Cadence | Plan | Measured |
|---|---|---|---|---|
| Earthquakes | USGS 2.5_day | 5 min | Free | <1 ms CPU |
| Kp | NOAA SWPC | 5 min on 0.1.4; hourly from 0.1.5 (NWS: match cadence to the 3-hourly refresh) | Free | <1 ms; feed is now an array of objects (fixed 0.1.1) |
| Fires | NASA FIRMS VIIRS NOAA-20, world, 24 h | 15 min | Free | 15 ms CPU at 1.3 MB / 16k rows (soft 10 ms limit); file grew to ~31k rows by afternoon — decision on Workers Paid ($5/mo) vs regional vs external parse after a week of `raw_bytes` logs |
| CO₂ (carbon) | NOAA GML Mauna Loa daily + weekly CSV | hourly (:07) | Free | collector 0.1.3 deployed 16:33 (0.1.2 parsed the whole 433 KB daily file: 113 ms CPU P99 measured; 0.1.3 parses the tail only, CPU to be read at the next :07); index tile on page with NOAA's own 1 y / 10 y comparison (the only comparison shown; it is theirs, not ours); `co2_daily` table in D1 |
| Sea ice (polar caps) | NSIDC Sea Ice Index v4, N+S daily extent + 1981–2010 climatology (NOAA mirror, no login) | 03/09/15/21 UTC on the hourly job | Free | collector 0.1.4 deployed 17:30; tile on page with NSIDC baseline + percentile position (subtraction is ours, labelled); **no cap imagery** — VIIRS sea-ice paints 0.76 % (polar night), AMSR2 ended Sep 2025, GHRSST MUR is an analysis (decision pending) |
| Hourly aggregation → D1 | — | :07 | Free | first batch ran 12:07; runs after CO₂ in the same job |
| **mock** (test layer, not on page) | Mac `collector-mac.mjs` → `POST /ingest/mock` (D11) | manual | Free | 31 Oct 06:52 UTC: 200, 12 records / 5 cells / 2,020 bytes; Mac→hub 435 ms (retrieved_at→received_at); auth measured: no key 403, wrong key 403, empty body 422 with reason |
| Page | GitHub Pages | reads `latest` only | Free | imagery 2048×1024 ≈ 2.4 s |

## Parked
- **Aircraft (OpenSky):** credentials valid; Cloudflare egress blocked (522); OpenSky reply (Ticket#837506): hobbyist use OK within credits, **public site requires being a feeder**, no cloud whitelisting. → Needs a home ADS-B receiver (Pi + RTL-SDR + 1090 MHz antenna; estimate ~R2,500–4,000 once, basket not yet priced). The same Pi hosts the home collector. Lightning (Blitzortung) is SEPARATE hardware (own board, antennas, GPS timing, ~€250) — not solved by the Pi. Site: 5th-floor flat in Kenilworth, open view toward CPT (~12.5 km, bearing ~80°), elevation 58 m ASL — promising, reception unmeasured until installed. Optional purchase, not a blocker. Page says "not shown" with the reason.

## Decisions (v0.4 diff, to be written)
D1 one Worker · D2 hourly aggregation · D3 row records · D4 aircraft quantity = mean/max unique per snapshot · D5 USGS M4.5+ as comparison-eligible · D6 zeros are not rows · D7 CPU is the binding Free-tier constraint · D8 D1 writes ≈40–70k/day · D9 receipt history = evidence of prior successful sampling only (NOT receiver coverage; never licenses reading an empty cell as absence) — aircraft cells stay `partial` in phase 1; code change pending when aircraft is enabled · D10 USGS/FIRMS partial in phase 1 · **D11** hub + external collectors via authenticated `/ingest` (approved by GPT & Gemini; collector sends parsed envelope) · **D12** raw R2 retention 48 h (not 90 days); D1 hourly aggregates kept as a deliberate phase-3 investment (~1,500 rows/hour, cost kept visible) · **D13** page promise shows comparison as "not yet" until phase 3 · **D14** FIRMS guard labelled "raw archived; processing skipped: resource guard", not "down"

## Next (in order)
1. **Ships via the Mac collector** — add an `aisstream` feed to `phase1/collector-mac.mjs` (FEEDS map): WebSocket to aisstream.io with the key, hold it for a fixed window (say 60 s), bucket PositionReports into 4° cells, POST the envelope to `/ingest/ships`. First run `--dry`, measure messages/min and bytes before choosing the window. Needs the aisstream key in KEYS.md (check it is there; it is not a Cloudflare secret). Whether aisstream's terms allow this use → REGISTER.md first, operative sentence pasted by Chad.
2. Page: show the `ships` layer once a real envelope exists (mock stays hidden). Sentence template unchanged.
3. R2 48 h retention job (D12) — a small daily cleanup of `snapshots/` and `cells/` older than 48 h; measure object counts first (R2 free tier: 10 GB, 1M class A ops/month).
4. Register (`REGISTER.md`): NSIDC **Citation** tab text from https://nsidc.org/data/g02135 still to paste; aisstream terms (item 1).
5. Open decision (Chad's): polar-cap imagery — (a) none, numbers only [Claude's lean]; (b) GHRSST MUR as a toggle labelled "analysis, not observation"; (c) phase 2: NSIDC daily extent GeoTIFF reprojected by the Mac collector.
6. ADS-B receiver decision (unlocks aircraft; optional; price a real basket first). OpenSky world/bbox still 522 from Cloudflare (measured again 31 Oct 06:38) — expected, parked.
7. Week-one review (from 6 Nov): FIRMS CPU/raw_bytes logs → Paid vs regional; D1 daily writes vs 100k.

## Done this thread (31 Oct, thread 2)
- 0.1.5 deployed via the editor typing flow (53.7 KB typed; the `type` tool call reports a 30 s timeout but the keystrokes keep arriving — wait ~2 min, then check the line count). Verified `/` → 0.1.5; manual `five` + `hourly` runs ok on all five layers; Kp now hourly.
- `INGEST_KEY` generated by Claude → KEYS.md → pasted by Chad into Variables and Secrets (Claude opened and pre-filled the form) → deployed.
- Mock ingest proven (table above). Mock is the standing test layer; the page does not show it.

## Keys
`~/Documents/Mother Earth/KEYS.md` (gitignored). Secrets are write-only in Cloudflare; the file is the record.
