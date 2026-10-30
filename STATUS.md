# Mother Earth — status (30 Oct 2026, end of day one)

**Public URL:** https://theonetheonlythechad.github.io/mother-earth/
**Hub:** https://mother-earth.chadoberholzer.workers.dev (`/status`, `/cells/<layer>`, `/snapshot/<layer>`)
**Repo:** https://github.com/TheOneTheOnlyTheChad/mother-earth (push to `main`; no branches unless a change could break the running collector)

## Running
| Layer | Source | Cadence | Plan | Measured |
|---|---|---|---|---|
| Earthquakes | USGS 2.5_day | 5 min | Free | <1 ms CPU |
| Kp | NOAA SWPC | 5 min (→ hourly queued: NWS asks for cadence matched to the 3-hourly refresh) | Free | <1 ms; feed is now an array of objects (fixed 0.1.1) |
| Fires | NASA FIRMS VIIRS NOAA-20, world, 24 h | 15 min | Free | 15 ms CPU at 1.3 MB / 16k rows (soft 10 ms limit); file grew to ~31k rows by afternoon — decision on Workers Paid ($5/mo) vs regional vs external parse after a week of `raw_bytes` logs |
| CO₂ (carbon) | NOAA GML Mauna Loa daily + weekly CSV | hourly (:07) | Free | collector 0.1.3 deployed 16:33 (0.1.2 parsed the whole 433 KB daily file: 113 ms CPU P99 measured; 0.1.3 parses the tail only, CPU to be read at the next :07); index tile on page with NOAA's own 1 y / 10 y comparison (the only comparison shown; it is theirs, not ours); `co2_daily` table in D1 |
| Hourly aggregation → D1 | — | :07 | Free | first batch ran 12:07; runs after CO₂ in the same job |
| Page | GitHub Pages | reads `latest` only | Free | imagery 2048×1024 ≈ 2.4 s |

## Parked
- **Aircraft (OpenSky):** credentials valid; Cloudflare egress blocked (522); OpenSky reply (Ticket#837506): hobbyist use OK within credits, **public site requires being a feeder**, no cloud whitelisting. → Needs a home ADS-B receiver (Pi + RTL-SDR + 1090 MHz antenna; estimate ~R2,500–4,000 once, basket not yet priced). The same Pi hosts the home collector. Lightning (Blitzortung) is SEPARATE hardware (own board, antennas, GPS timing, ~€250) — not solved by the Pi. Site: 5th-floor flat in Kenilworth, open view toward CPT (~12.5 km, bearing ~80°), elevation 58 m ASL — promising, reception unmeasured until installed. Optional purchase, not a blocker. Page says "not shown" with the reason.

## Decisions (v0.4 diff, to be written)
D1 one Worker · D2 hourly aggregation · D3 row records · D4 aircraft quantity = mean/max unique per snapshot · D5 USGS M4.5+ as comparison-eligible · D6 zeros are not rows · D7 CPU is the binding Free-tier constraint · D8 D1 writes ≈40–70k/day · D9 receipt history = evidence of prior successful sampling only (NOT receiver coverage; never licenses reading an empty cell as absence) — aircraft cells stay `partial` in phase 1; code change pending when aircraft is enabled · D10 USGS/FIRMS partial in phase 1 · **D11** hub + external collectors via authenticated `/ingest` (approved by GPT & Gemini; collector sends parsed envelope) · **D12** raw R2 retention 48 h (not 90 days); D1 hourly aggregates kept as a deliberate phase-3 investment (~1,500 rows/hour, cost kept visible) · **D13** page promise shows comparison as "not yet" until phase 3 · **D14** FIRMS guard labelled "raw archived; processing skipped: resource guard", not "down"

## Next
1. `/ingest/<layer>` endpoint + Mac collector script — test first with a mock feed (auth, idempotent snapshot id, three timestamps, validate before publishing `latest`). Ships need a runtime that can hold a WebSocket; whether it must be residential is aisstream's policy, to be measured.
2. Register (`REGISTER.md`): USGS ✅ SWPC ✅ NOAA GML ✅ (30 Oct) · FIRMS, GIBS pending (Chad reads and dates the licence pages).
3. ~~carbon~~ done (index only; CAMS/GEOS CO₂ maps are model tier, not for phase 1). Next layer requested: **polar caps** (NSIDC Sea Ice Index + GIBS sea-ice imagery).
4. ADS-B receiver decision (unlocks aircraft; optional; price a real basket first).
5. Week-one review: FIRMS CPU/raw_bytes logs → Paid vs regional; D1 daily writes vs 100k.

## Keys
`~/Documents/Mother Earth/KEYS.md` (gitignored). Secrets are write-only in Cloudflare; the file is the record.
