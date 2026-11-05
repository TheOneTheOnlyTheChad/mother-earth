# Mother Earth — Place view and what we keep from now on (proposal, 5 Nov 2026)

Prepared by Claude for Chad and GPT (thread 14). **A proposal for decision. Nothing here is built, deployed or scheduled.** Every decision in §6 is Chad's.

Context: GPT's direction (5 Nov): make *"understand what is changing here"* the central experience. Claude's response: start with a **place view** built from data we already hold, and start **keeping history deliberately now**. Change from our own record cannot be shown until the record is long enough, so the clock has to start early. Chad (5 Nov): *happy to start collecting data now*; this is a big architectural decision.

## 1. The two decisions in one line each
1. **Place key.** The 4° grid cell becomes the project's permanent place identifier (versioned), and every layer that has a location is kept against it. Named places (Wikidata) come later as *sets of cells*, never by re-keying history.
2. **What we keep.** From day one we keep a private, compact, permanent record of **everything the page published**, plus **how completely we collected it**, so that later we can separate a change in the world from a change in what we could observe.

## 2. What exists today (read from the code and STATUS, 4–5 Nov)
| Kept now | Where | Since | Notes |
|---|---|---|---|
| Fires, quakes, ships — counts per cell per hour | D1 `cell_hourly` | firms 30 Oct · usgs 30 Oct · ships 1 Nov | coverage grade + observed fraction per row |
| Collection completeness per layer per hour (expected vs ok samples, status ok/degraded/down/absent) | D1 `layer_hourly` | 30–31 Oct | **this is already the "change in observation" evidence for the hourly layers** |
| Kp, CO₂ daily, forest per cell per day | D1 `kp_index`, `co2_daily`, `forest_daily` | 30 Oct · 29 Oct · 1 Nov | |
| Every collector run | D1 `collector_runs` | 30 Oct | |
| First/last time a cell ever reported | D1 `cell_receipts` | — | **aircraft only, by design (D9); empty because aircraft is parked** |
| Raw files, every snapshot, every cell file | R2 `raw/` `snapshots/` `cells/` | — | **deleted after 48 h** (lifecycle rules) |
| Sea ice, drifters, orbital, individual quake records, plastic | only `latest/` | — | **no history** (plastic is a pinned, dated dataset — nothing to accumulate) |

D1 was 2.6 MB on 4 Nov; writes measured ~10k/day on 1 Nov.

**Consequence (GPT's replay point):** today we could show hourly *activity counts* back to ~30 Oct, but no per-object history (no quake list, no buoy positions, no orbital population over time, no sea-ice series of our own).

## 3. Proposal A — the Place view (v1: one grid cell, everything we hold)
**What the visitor gets.** Clicking a cell (today that opens one layer's inspector) gains **"Everything here"**: one panel listing **every layer**, each in its own row with its own date, evidence label, coverage grade and limits:

| Row | Shows | Never shows |
|---|---|---|
| Earthquakes | events in the feed window in this cell, or "none in the feed window — not a statement that none occurred" | — |
| Fires | detections today (UTC) | "no fires" |
| Ships | vessels heard in the latest sample + "heard only where a receiver is in range" | "empty sea" |
| Forest disturbance | 7-day alert pixels by confidence, or "outside 30°N–30°S: not covered" | |
| Drifting buoys | buoys whose latest fix is in this cell, each with its own fix time | |
| Microplastic samples | dated samples in this cell (year range) | anything implying current water |
| Collection here | for the hourly layers: how many of the last 24 hours / 7 days we actually sampled, and since when we have any record for this cell | |
| Not place-based | Kp, CO₂, sea ice, orbital, day/night — listed with why they have no per-cell value | |

- **One fixed line, always shown:** *"Listed together because they share this 4° cell. Nothing here states a connection between them."*
- No summary sentence, no score, no ranking across layers.
- Optional layers that are **off** are still listed (the place view is about the place, not the toggles), each marked "layer off — data shown here only".

**Where the work happens: the hub.** New endpoint `GET /place/g4/<row>_<col>` returns one envelope with a section per layer, each carrying its own `retrieved_at`, collector run id, evidence tier and coverage, plus the completeness block from D1. Reasons: the page should not download the 470 KB plastic file or the drifters file to answer one cell ("the hub is the product; the page is a client"); and later pages, the API and any future paid features read the same endpoint. Per-cell slices for plastic and drifters are precomputed when those jobs run (small files under `latest/place/`), so a request is a handful of small reads plus one D1 query.

**Guards carried over.** Each section is judged on its own layer (the per-layer pairing/`usable()` rule); a missing or failed section says so and never becomes zero; a section from an older run than the visible layer says which run it is.

**Tests (before any release).** Endpoint against fixtures (sections independent; a down layer leaves the others intact; unknown never zero; the fixed line present); page: open/close, keyboard, phone (inside the inspector sheet), and a cell where every row is "unknown/not covered" (e.g. mid-Pacific, or the Arctic for forest).

**Size.** One endpoint, two small precompute steps, one panel. No new source, no new schedule.

## 4. Proposal B — what we keep, starting now
Principle: **keep what we published, compactly, privately, permanently; keep how completely we collected it; never keep per-individual movement of people's vessels or aircraft.**

| # | Keep | Store | Size estimate | Enables |
|---|---|---|---|---|
| B1 | **Daily archive of what the page showed:** at 23:5x UTC, copy each `latest/<layer>.json` + `latest-cells/<layer>.json` to `archive/<layer>/<YYYY-MM-DD>.json.gz` | R2, no expiry | ~5–15 MB/day compressed (estimate; to measure on day 1) → ~2–5 GB/year | "what did Mother Earth say on date X", reproducibility, rebuilding any aggregate later with a better method |
| B2 | **Quake events** (USGS id, time, lat/lng, depth, magnitude, mag type, place text, our first-seen time) | D1 `quake_events` | ~50–150 rows/day | per-place quake history; revisions visible (USGS updates events) |
| B3 | **Sea ice daily** (N/S extent + NSIDC climatology value for the day) | D1 `seaice_daily` | 2 rows/day | our own series alongside NSIDC's (theirs remains the reference) |
| B4 | **Drifter fixes** (buoy id, fix time, lat/lng, SST if given), de-duplicated on buoy+time | R2 `history/drifters/<date>.ndjson.gz` | ~0.5–1.5 MB/day (estimate) | buoy tracks — instruments, not people |
| B5 | **Orbital population daily** (counts by class, beyond-GEO, stale) | D1 `orbital_daily` | ~5 rows/day | how the population changes |
| B5b | *(optional)* one orbital elements file per day | R2 | ~6 MB/day raw, less gzipped → ~1–2 GB/year | orbital replay later; Space-Track redistribution terms to re-read before any public use |
| B6 | **Fires: per cell per day** — detections, FRP sum and max, day/night split | D1 (`extra` of a daily row) | ~1k rows/day | FIRMS keeps its own archive; ours records what we published |
| B7 | **Ships coverage history:** extend `cell_receipts` (first/last heard per cell) to ships; keep A/B class counts per cell-hour | D1 | small | answers "fewer ships, or fewer receivers/samples?" |
| B8 | **Collection completeness** — already kept (`layer_hourly`, `collector_runs`); keep forever, never thin | D1 | small | the core of "change in the world vs change in what we observed" |
| — | **NOT kept:** per-vessel tracks (ships), and per-aircraft tracks if aircraft ever runs | — | — | **Chad's no-surveillance line.** The 48 h raw window stays as is. B1 keeps the published snapshot (one sample's positions per day) — Chad to confirm that is acceptable, or B1 for ships keeps cells only |

**What stays as it is:** the 48 h lifecycle on `raw/`, `snapshots/`, `cells/` (B1 replaces the need to keep them); all current D1 tables.

### Cost (prices read 5 Nov from Cloudflare's pricing pages; account is on Workers Paid)
| Resource | Included on Workers Paid | Our use after B1–B8 (estimate) | Line item |
|---|---|---|---|
| D1 rows written | 50 M / month (then $1.00 per M) | ~0.5 M / month | $0 |
| D1 storage | 5 GB (then $0.75 / GB-month); max 10 GB per database | ~0.2–0.5 GB / year | $0 for years |
| R2 storage | 10 GB-month free (then $0.015 / GB-month) | ~3–7 GB / year (B1 + B4, + B5b if chosen) | $0 in year 1; ≈ $0.05–0.15 / month in year 2–3 |
| R2 Class A (writes) | 1 M / month free (then $4.50 / M) | ~1–2 k / month | $0 |
| Egress | free | — | $0 |

The only recurring line that ever becomes non-zero is R2 storage beyond 10 GB, in cents per month. Every size above is an **estimate to be replaced by a measured day** before the schedule is called settled (Chad's rule: measure, don't assume).

## 5. Rules for "change" (so the record is used honestly later)
1. **Source baselines first, labelled as theirs** — NOAA's CO₂ comparison and NSIDC's climatology are on the page already; FIRMS's archive and GFW's alert history are candidates (research only).
2. **Our own comparisons only after a stated minimum record per layer** — e.g. at least one full annual cycle for anything seasonal (fires, sea ice, forest); written down per layer before the first comparison ships. Until then: "none of ours yet" (D13).
3. **Every comparison names its method:** which periods, which cells, what counts as comparable, and the collection completeness in both periods. A period we sampled poorly is shown as such, not compared.
4. **No cause.** A comparison shows a difference and its evidence; it never says why.
5. **Loss and recovery each where measured; never netted without a method; the imbalance in available evidence is shown, not padded.**

## 6. Decisions for Chad
| # | Decision | Claude's recommendation |
|---|---|---|
| D-A | Adopt the 4° cell (`g4:<row>_<col>`) as the permanent place key; finer grids and named places added as extra keys later | **Yes** |
| D-B | Build the Place view v1 (hub endpoint + panel), branch first, his go to publish | **Yes, after D-C is running** (so the completeness block has substance) |
| D-C | Start keeping history: B1–B8 | **Yes — B1, B2, B3, B4, B5, B6, B7, B8 now; B5b later** |
| D-D | Ships in the daily archive (B1): full published snapshot (one day's sample of positions) or cells only | **Cells only** — consistent with no surveillance; counts per cell carry the science |
| D-E | Minimum record before our own comparisons, per layer | set per layer when the first comparison is proposed; default one annual cycle |
| D-F | Measurement gate: deploy B-jobs, measure one full day (bytes, writes, CPU), then confirm | **Yes** |

## 7. Order of work if approved
1. Hub: B2, B3, B5, B6, B7 (D1 tables + inserts in existing jobs) and B1/B4 (one daily archive step on the existing :07 tick at 23:07 UTC). One deploy, Chad's go. No new cron.
2. Measure one full UTC day: bytes per archive object, D1 rows written, CPU of the archive step. Record in STATUS.
3. Place view: hub endpoint + precompute → page panel on a branch → tests → live RC check → Chad's go.
4. Sources & Details: update "What Mother Earth keeps" (`ME.KEPT` + `#kept`) the same day retention changes — wording describes what is kept, not why (Chad, 3 Nov).

## Sources (pricing and limits, read 5 Nov 2026)
- Cloudflare D1 pricing — https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare D1 limits — https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare R2 pricing — https://developers.cloudflare.com/r2/pricing/
- Current tables: `phase1/schema.sql`; current retention: STATUS 4 Nov (thread 11 storage facts)
