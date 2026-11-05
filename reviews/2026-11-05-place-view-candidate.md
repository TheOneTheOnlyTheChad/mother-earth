# Mother Earth — Place view v1 + history retention: candidate for review (5 Nov 2026)

Prepared by Claude for Chad and GPT (thread 14). **Branch `place-view` only.** Nothing has been deployed, merged, pushed to main, written to the live hub or its storage, or scheduled. Proposal: `reviews/2026-11-05-place-view-and-history.md` (rev 3, on the branch).

## 1. What is in the candidate
| Part | What it does | Live effect if deployed |
|---|---|---|
| **Hub 0.5.0 — `GET /place/g4/<row>_<col>`** | One envelope per cell: a section per layer, each from ONE collector run (records and counts compared on `retrieved_at`, re-read once, else **withheld** with the reason); optional layers only when named in `?layers=`; collection evidence from D1; cell bounds and area. Read-only: no writes, no upstream requests. | a new read endpoint |
| **Hub 0.5.0 — history** | Everything in proposal §5, behind **`HISTORY_ENABLED=1`** (unset = no-op; tested). | **none until Chad sets the variable** |
| **Hub fix (found by the new tests)** | FIRMS parser: a missing FRP becomes `null` ("not provided"), not `0`. JavaScript turns `+''` into 0; today's hub publishes a missing FRP as 0 MW. | affected fire records read "FRP not provided" instead of "0 MW" |
| **D1 schema** | 7 new tables (`phase1/schema.sql`, History section). | Chad/Claude run the `CREATE TABLE` statements in the D1 console (his go) before the variable |
| **Page** | Click **any** point on the globe, or "Everything we hold for this cell, all layers" in a cell's details → **Everything here** panel (inspector). Sources & Details `#place`. Assets `?v=202611091000`. | new panel; nothing else changes |

### The panel, row by row
- **Selected:** cell, its `g4:` reference, latitude/longitude bounds, area in km² (cells shrink toward the poles).
- **Read this first:** *"Listed together because they share this 4° cell. Nothing here states a connection between them."*
- One row per layer, each with its own retrieval time, coverage grade and stale flag:
  - **Earthquakes / Fires / Ships:** the count and up to 8 records, each with its own time.
  - **Forest:** pixels by confidence, or "not covered" outside the swept tropical cells, or "unknown — in the sweep, not answered yet".
  - **Drifting buoys / Microplastic samples:** if off, *"layer off · Load this layer's data for this place — fetches data for this panel only; the layer stays off on the globe"*. Every plastic sample is listed.
- **Nothing reached us** is never shown as zero:
  - quakes: "… not a statement that none occurred";
  - fires: "not 'no fires'";
  - ships: "not an empty sea";
  - buoys: "says nothing about the water";
  - plastic: "does not establish plastic-free water".
- **Collection · Earthquakes / Fires / Ships:**
  - "our collector produced a usable sample in X of Y aggregated hours" (all places at once);
  - "records for this cell reached us in N h";
  - "Retained since …" and "first retained report here: …";
  - "Neither is the source's geographic coverage."
  - With no aggregated hour on record: **"unknown"**, never "0 of 24 h".
- **Not place-based:** Kp, CO₂, sea ice, orbital, day/night, each with the reason (in the disclosure).

## 2. GPT's four build details — where each is implemented
| Detail | Implementation | Test |
|---|---|---|
| Data revisions vs processing/check changes vs repeat retrievals; no duplicate unchanged datasets; plastic verification revisions preserved | `versionParts()` splits each envelope into the source's data and our processing results (volatile fields stripped: retrieval/scheduling times, versions, the NSIDC access-date citation, fetch metadata). New object only when a hash changes, labelled `first`, `data`, `processing` or `data+processing`. A repeat updates `last_retrieved_at`, `retrievals` and `last_run_ref` only. | history-hub **D1–D3** |
| Drifters: suppress identical buoy + fix-time repeats, keep corrections under the same key | `drifter_fixes` primary key = buoy, fix time, lat, lng, SST (missing SST keyed `'na'` so it de-duplicates). `INSERT OR IGNORE`: an exact repeat writes nothing; a corrected position or SST is a new row with its own first-received time. | history-hub **E1** |
| Collector uptime vs hours records reached us for this cell; neither is coverage; retention start vs first report here | `/place` returns `collection_ran` (from `layer_hourly`) and `records_reached_us_here` (from `cell_hourly` for that cell) separately, plus `retention_start` and `first_report_retained`; the panel words them separately. | history-hub **G5**, place-ui **1**, place-rows |
| "cannot be rebuilt" → "we do not currently retain a lasting history of these records" | proposal rev 3 §2 | — |

## 3. Tests (container: Chromium + SwiftShader, real globe.gl 2.45.0; D1 = real SQLite via `node:sqlite` loaded with `schema.sql`)
| Suite | Result | Shown to fail on |
|---|---|---|
| **history-hub** (new) | **16/16** | 7 deliberate breaks, each caught: gate always on (A1) · volatile fields kept (D3) · drifter repeats duplicated (E1) · checkpoint takes the new snapshot (C1) · place pairing check removed (G1) · off layers read anyway (G3) · history error propagates (F1) |
| **place-ui** (new; page's `/place` answered by the real `worker.js` over seeded stores) | **30/30** | 5 deliberate breaks, each caught: off layers requested anyway · Load also switches the layer on · late response repaints after close · empty cell shown as zero · missing FRP shown as 0 |
| **place-rows** (new, pure wording) | **7/7** | — |
| Hub regressions | drifters-hub 12 · plastic-hub 11 · orbital-hub 13 · satellites-hub 12 · ships-fallback 7 · ships-late 7 · ships-probe 11 · spacetrack-probe 11 · duration contract — pass | |
| Page regressions | desktop-overflow 112 · ux-round1 34 · mobile-pass 131 · plastic-ui 29 · drifters-ui 25 · search-ui 104 · terminator-ui 19 · terminator-behaviour 47 · orbital-ui 38 · search 111 · real-data 50 · solar 26 — pass | |
| orbital-browser | 103/105 — **the same 2 fail on main** (stale/beyond-GEO reference, likely a time-dependent fixture); separate test item, already in HANDOVER | |

**Fixed on the way:**
- **plastic-hub only passed on 4 Nov.** The hub stamps times with `new Date()`, and the test faked only `Date.now`, so it compared against the real clock. The test now fakes both.
- **A collision:** the new Load button first used `data-layer`, the attribute the page's layer toggles use. Renamed to `data-place-layer`.

**Real data, read-only (pane, 06:13–06:20 UTC):** the branch's own `worker.js` and `app.js` (sha256 `f3c73447c5b6` / `cdda62e17f58`, matching commit `dd1ec31`) ran in the browser. The hub's storage reads went to the public `/cells` and `/snapshot` files, and the database was stubbed. Six cells:
- busiest fire cell 21_32: fires 341;
- busiest ship cell 35_46: ships 900, fires 31;
- plastic cell 33_46: plastic 100, ships 60, fires 4;
- one quake cell;
- forest 22_46;
- open Pacific 20_0.

**Every count equals the hub's published cell count, and records were paired with counts for every live layer.** This run found the two wording faults fixed in `3867ef9`:
- an absent collection record was printed as "0 of 24 h" (now "unknown");
- the forest source's zero now says "source-reported zero".

**Not yet done:** a visual live check of the panel on the globe (needs Chad at the screen), and the collection block against the live D1 (needs the deploy).

## 4. Measurements (offline / read-only; nothing written)
### 4a. Bytes, from today's real published files (gzipped in the browser exactly as the hub would)
| Layer | Raw | gzip | Records | What is kept | Per day (est.) |
|---|---|---|---|---|---|
| firms | 328 KB | 55 KB | 4,873 (06:00 UTC, partial day) | daily checkpoint (last file of the day) | ~11.4 B/record gz → a 30–40k-record day ≈ **0.34–0.45 MB** |
| usgs | 12 KB | 2.7 KB | 32 | daily checkpoint | **~3 KB** |
| plastic | 481 KB | 68 KB | 1,145 | version on change only | **68 KB per version** (expected rare) |
| seaice | 11 KB | 3.9 KB | 330 | version (data date changes daily) | **~4 KB** |
| co2 | 11 KB | 3.3 KB | 366 | version | **~3–7 KB** |
| orbital meta | 2.3 KB | 1.2 KB | — | version (new file every 2 h) | **~15 KB** (12 files) |
| drifters | 221 KB | 27 KB | 1,302 | D1 rows (not R2) | see 4b |

**R2 total ≈ 0.4–0.5 MB/day ≈ 150–180 MB/year**, about 1.5–2 % of the 10 GB-month free allowance after a year. Rev 1 estimated 2–5 GB/year, before the archive promise was narrowed.

### 4b. D1 rows (written)
| Table | Rows/day | Basis |
|---|---|---|
| quake_revisions | DRIFT_Q | QUAKE_BASIS |
| fires_daily | ~1,000–2,800 | one per cell with detections at the day's last pull. 170 cells at 06:00 UTC (partial day); a uniform synthetic full day gives 2,790 (upper bound) |
| drifter_fixes | DRIFT_ROWS | DRIFT_BASIS |
| seaice_daily | 2–8 | 2 hemispheres × distinct values (4 runs/day) |
| orbital_population | 12 | one per published element file |
| archive_versions / checkpoints | ~15 + 2 | plus retrieval-count updates on repeats |

### 4c. CPU proxies (container Node 22, not the Worker; for order of magnitude)
| Step | When | Measured |
|---|---|---|
| place index for a full-day fires file (35k records, 2 MB) | once per file change per isolate (≤ every 15 min) | parse 20–29 ms + index 33–55 ms |
| daily checkpoint: gzip 2 MB | once a day | 37–76 ms |
| fires_daily from the same file | once a day | 10–50 ms |
| version hash of a layer | per run of small layers | ≤ 23 ms (plastic-size) |
| `/place` D1 reads | per visitor request | 16 statements, **every one an index search** (SQLite query plans checked); window sums read ≤ 168 rows per layer, start dates one row each |

### 4d. Meters that scale with visitors (cannot be measured before traffic exists)
- Worker requests: one per place view.
- Rows read: ≤ ~600 per place view by construction.
- R2 Class B reads: up to 8 small reads per place view, more when the cached index is cold.

Workers Paid includes 25 bn rows read/month and 10 M Class B/month free. These are stated as **to be measured** on the trial day; the trial will read the Worker invocation log and the D1/R2 dashboards.

## 5. What a go would mean, step by step (each its own go)
1. **D1:** run the 7 `CREATE TABLE` statements in the D1 console. Additive; existing tables untouched.
2. **Deploy hub 0.5.0** (content-only API, file from GitHub at the branch commit, sha checked) with `HISTORY_ENABLED` **unset**. Effects:
   - `/place` becomes available;
   - FIRMS missing-FRP fix;
   - no history written.
   - Check `/`, `/status` and one `/place` call; read CPU from the invocation log.
3. **Trial:** set `HISTORY_ENABLED=1`. Watch the next runs of usgs (5 min), firms (15 min) and the hourly job (drifters, CO₂, sea ice). Read the rows written, the R2 objects and CPU. Turning it off is one variable.
4. **One full UTC day** with history on: measure the day-change checkpoint, fires_daily and drifter rows. Record everything in STATUS.
5. **Page:** live RC check of the panel in a clean session (Chad at the screen), then merge `place-view` → main (publishes).
6. Sources & Details "What Mother Earth keeps" (`ME.KEPT` + `#kept`) updated the same day history goes on.

## 6. Open points for Chad / GPT
- **Drifters in D1 rather than an R2 file** (rev 3 §11): the key does the de-duplication and correction work. Cost per §4b.
- **The FIRMS FRP fix changes published data** (a missing value stops being 0). Correct by our rules; flagged because it is a hub data change.
- **"Load this layer's data for this place"** is per panel: reopening the panel asks again. GPT's condition was that it be deliberate; it is.
- `orbital-browser` 2 known failures stay a separate item.
