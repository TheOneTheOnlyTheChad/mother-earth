# Mother Earth — Place view and what we keep from now on (proposal rev 3, 5 Nov 2026)

Prepared by Claude for Chad and GPT (thread 14). **A proposal for decision. Nothing here is built, deployed or scheduled.** Every decision in §7 is Chad's.

**Rev 3 (5 Nov, GPT's go to build on a branch):** four wording details adopted (§10), and the build's deviations from rev 2 recorded (§11). Candidate results: `reviews/2026-11-05-place-view-candidate.md`.

**Rev 2** takes GPT's six corrections (5 Nov), all adopted. Changes are listed in §9. The biggest: the archive promise is now what the implementation actually delivers, defined per layer. Collection evidence is kept apart from coverage. The grid is a reference, not the definition of a place. The place view goes first, on data we already hold. Cost is stated as meters to measure, not a conclusion.

Context: GPT's direction (5 Nov) is to make *"understand what is changing here"* the central experience. Chad (5 Nov): *happy to start collecting data now*; this is a big architectural decision.

## 1. The decisions in one line each
1. **Grid as permanent reference.** The 4° grid ID (`g4:<row>_<col>`) is kept on every record as a stable reference. Wherever we keep individual observations, we also keep their **original coordinates and source record IDs**, so named places can later use their own boundaries. Where we keep only cell totals, the page says finer geographic answers cannot be recovered.
2. **History with a precise promise.** Per layer we keep (a) defined measurements, (b) a labelled daily checkpoint or every distinct version, whichever that layer needs, and (c) collection evidence. Every row carries its source run and processing version. **Not "everything the page published".**
3. **Place view first.** It runs on what we already hold, says when each record starts, and is built before the new storage.

## 2. What exists today (code and STATUS, 4–5 Nov)
| Kept now | Where | Since | Notes |
|---|---|---|---|
| Fires, quakes, ships: counts per cell per hour | D1 `cell_hourly` | firms 30 Oct 05h · usgs 30 Oct 07h · ships 1 Nov 03h | coverage grade + observed fraction per row |
| Collection per layer per hour (expected vs ok samples; ok/degraded/down/absent) | D1 `layer_hourly` | firms/usgs 30 Oct 11h · ships 31 Oct 13h | **evidence that our collection ran, not of geographic coverage** |
| Kp, CO₂ daily, forest per cell per query | D1 `kp_index`, `co2_daily`, `forest_daily` | 30 Oct · 29 Oct · 1 Nov | |
| Every collector run | D1 `collector_runs` | 30 Oct 12:00 | |
| First/last receipt per cell | D1 `cell_receipts` | — | aircraft only (D9); empty while aircraft is parked |
| Raw files, every snapshot, every cell file | R2 `raw/` `snapshots/` `cells/` | — | deleted after 48 h |
| Sea ice, drifters, orbital, individual quakes, plastic revisions | `latest/` only | — | no history |

D1 was 2.6 MB on 4 Nov; writes measured ~10k/day on 1 Nov. **We do not currently retain a lasting history of these records** (individual quakes, buoy positions, the orbital population, our own sea-ice series).

## 3. Three things kept apart (GPT #3)
Each answers a different question, and none stands in for another:
| | Question | Evidence we hold | Never read as |
|---|---|---|---|
| **Collection ran** (collector uptime — all places at once) | Did our sample/request run, and for how long? | `layer_hourly`, `collector_runs`, sample windows | coverage; records reaching us for a particular cell |
| **Records received here** | In which hours did at least one record for *this cell* reach us? | `cell_hourly` rows for the cell | collector uptime; first/last *coverage* of the cell |
| **Source coverage** | Where could the source's network observe at all? | only what the source documents (e.g. "terrestrial AIS", GFW's 30°N–30°S, FIRMS swath/clouds) | something our own logs establish |

**Two different start dates, kept apart:** *retention start* = the first hour we retain for that layer at all; *first retained report here* = the first retained hour with a record for this cell. A late first report here may only mean nothing reached us from this cell earlier.

"Fewer ships here" can be qualified by the first two: we sampled less, or nothing reached us. It **cannot** be settled as a world change or a receiver change by our records alone. The place view and any comparison say exactly that.

## 4. Proposal A — Place view v1 (on existing data, first)
**What the visitor gets.**
- **Select any area**, including one with no visible records. A click anywhere on the globe resolves to its cell; empty places are often the ones most worth inspecting.
- An **"Everything here"** panel lists every layer in its own row, with its own date, evidence label, coverage statement and limits, and **since when we hold any record** for that layer.

| Row | Shows | Never shows |
|---|---|---|
| Earthquakes | events in the feed window here, or "none in the feed window — not a statement that none occurred" | |
| Fires | detections today (UTC) | "no fires" |
| Ships | vessels heard in the latest sample (count) + the coverage statement | "empty sea" |
| Forest disturbance | 7-day alert pixels by confidence, or "outside 30°N–30°S: not covered" | |
| Drifting buoys | buoys whose latest fix is here, each with its fix time | |
| Microplastic samples | dated samples here (years) | anything implying current water |
| Collection here | hours sampled out of the last 24 h / 7 days for the hourly layers, and since when; labelled *"our collection ran — not source coverage"* | |
| Not place-based | Kp, CO₂, sea ice, orbital, day/night — and why | |

- **Fixed line, always shown:** *"Listed together because they share this 4° cell. Nothing here states a connection between them."*
- No summary sentence, score or ranking.
- **Off layers (GPT #5).** An off optional layer is listed as "off". Its place data loads only when the visitor presses **"Load this layer's data for this place"**, with the note *"This fetches data for this panel only; the layer stays off on the globe."* Opening the panel never enables globe markers and makes no request for an off layer without that press. The existing rule that "off" means no requests stays true by default.

**Hub endpoint.** `GET /place/g4/<row>_<col>` returns one envelope with a section per layer. Each section carries its own `retrieved_at`, run ID, evidence tier and coverage statement, and **its records and counts come from the same run**. The endpoint reads the pair, compares run IDs, re-reads once on a mismatch, then marks the section withheld with the reason, the same rule as the page. Per-cell slices for plastic and drifters are written when those jobs run, so the page never downloads the 470 KB plastic file to answer one cell. Off-layer sections are returned only when requested by name (`?layers=`).

**Tests before release.**
- Sections are independent: a down layer leaves the others intact.
- A run mismatch during a request leads to a withheld section, not a mixed one (inject a collector write mid-request).
- Unknown is never shown as zero; the fixed line is always present.
- An empty-ocean cell and an Arctic cell can be selected and read correctly.
- Off layers: zero requests until the press; the globe stays unchanged after it.
- Keyboard and phone (inside the inspector sheet).

## 5. Proposal B — what we keep, defined per layer (GPT #2, #4)
**Rules for every retained row or file:** source run reference (`<layer>@<retrieved_at>`), collector/processing version, source time(s) and our received time. Append, never overwrite, wherever the source revises.

**Three kinds of change, kept apart (GPT, rev 3):** a **data revision** (the source's values changed), a **processing change** (our check/derived results changed — e.g. a plastic verification result — with the same source data), and a **repeat retrieval** (nothing changed but the retrieval time). A new version is stored only for the first two, labelled `data`, `processing` or `data+processing`; a repeat retrieval stores nothing new and only advances that version's retrieval count, last retrieval time and last run reference — so provenance is complete without duplicating unchanged datasets.

**Archive promise, stated per layer** (replaces "everything published"):
| Layer | Measurement kept (definition) | Archive kind | Not recoverable from it |
|---|---|---|---|
| **Earthquakes** | **Every distinct revision** of every event we received: USGS id + USGS `updated` time + our received time + run ID; lat/lng, depth, magnitude, mag type, place text, status. Append-only; a new row only when USGS `updated` changes. | revisions table (D1) | events outside the 2.5_day feed or below M2.5 |
| **Fires** | **Daily per cell: detections as of our last successful pull of UTC day D**, with that pull's time. FIRMS `day_range=1` resets at 00:00 UTC, so detections processed for D after our last pull are **not** in it; the row says so. *Option F2 (measure first):* one `day_range=2` pull at ~06:00 UTC on D+1 to record the late-processed total for D as a second, labelled figure. FRP sum/max, day/night split. | daily row (D1) + **daily checkpoint** of the last file of D (R2, labelled with its cutoff) | intermediate 15-min versions; detections FIRMS publishes later |
| **Ships** | **Aggregates only** (existing `cell_hourly`, `layer_hourly`, sample windows, A/B class counts). No positions are retained beyond 48 h. | none beyond aggregates | any vessel's position or track; any finer-than-cell answer |
| **Forest** | existing `forest_daily` (per cell per query, with GFW version) | as is | pixel locations within a cell |
| **Drifting buoys** | **Sampled track:** the latest fix per buoy as returned by each hourly OSMC query. Identical repeats (same buoy + fix time + position + SST) are suppressed; a **correction** — same buoy + fix time with a different position or SST — is kept as its own row with the time we first received it. *Not* every fix the buoy reported. | D1 `drifter_fixes` (see §11) | fixes between our hourly samples |
| **Sea ice** | every distinct daily value (data date) for N and S, with NSIDC's climatology value for that day, run ID | D1 | — (NSIDC holds the full series; ours records what we published) |
| **Kp, CO₂** | existing tables + run ID going forward | as is | — |
| **Orbital** | **population in our selected catalogue query** (Space-Track GP: not decayed, epoch within 10 days), by object type, plus stale and beyond-GEO counts, the query string and file sha. Changes can come from filtering, classification or element freshness as well as launches and reentries; the row says so. | D1 daily row | positions; objects outside the query |
| **Microplastic samples** | **every distinct version** of the NOAA dataset (by content hash) with NOAA's last-edit date, plus our check results for that version | R2 on change only | — |
| **Small published files** (Kp, CO₂, sea ice, orbital meta, plastic meta) | every distinct version (content hash) | R2 on change only | — |
| **Large published files** (fires, forest cells, drifters, quakes snapshot) | **daily checkpoint**, labelled with its actual cutoff and source times | R2 | the day's intermediate versions |

## 6. Cost: meters to measure, not conclusions (GPT #6)
Unit prices on Workers Paid, read 5 Nov from Cloudflare's pages:
- **D1:** 50 M rows written/month included (then $1.00/M); 25 bn rows read/month (then $0.001/M); 5 GB storage (then $0.75/GB-month); 10 GB per database.
- **R2:** 10 GB-month free (then $0.015/GB-month); Class A 1 M/month free (then $4.50/M); Class B 10 M/month free (then $0.36/M); egress free.

**Every meter that this changes, with its status:**
| Meter | Driven by | Status |
|---|---|---|
| D1 rows written | new tables (quake revisions, daily rows) | to measure (trial, then a full day) |
| D1 rows read | **place-view requests — scales with visitors** | to measure per request; then multiply by traffic |
| D1 storage | retained rows | to measure growth per day |
| R2 storage | checkpoints, drifter files, plastic versions | to measure bytes per object |
| R2 Class A / B | archive writes / place-view slice reads (**scales with visitors**) | to measure |
| Worker requests + CPU | place endpoint per visitor; archive step per day | to measure |

No figure is promised until measured. The earlier line "the only recurring line that ever becomes non-zero is R2 storage" is **withdrawn**: reads, operations and Worker usage scale with implementation and traffic.

**Measurement gate:** representative files measured offline → trial run of each new step writing to a private prefix (Chad's go) → numbers recorded → deploy (Chad's go) → one full scheduled UTC day verified → STATUS.

## 7. Rules for "change"
1. **Source baselines first**, labelled as theirs (NOAA CO₂, NSIDC climatology on the page now; FIRMS archive and GFW alert history are candidates, research only).
2. **A defined difference between two adequately sampled periods can be described early**, with its method: the periods, the cells, what counts as comparable, and the collection evidence for both periods. No minimum-record rule is needed for that.
3. **Calling a difference unusual, seasonal or a trend needs a reference record suitable for that specific claim** (a source climatology, or a record of ours long and consistent enough for it). One year does not automatically qualify.
4. **No cause.** A comparison shows a difference and its evidence, never why.
5. **Loss and recovery each where measured; never netted without a method; any imbalance in available evidence is shown, not padded.**

## 8. Decisions for Chad
| # | Decision | Claude's recommendation |
|---|---|---|
| D-A | Keep `g4:<row>_<col>` as a permanent **reference** on every record; keep original coordinates and source IDs wherever individual records are kept; named places get their own boundaries later | **Yes** |
| D-B | Build Place view v1 now on existing data (branch → tests → live RC → his go) | **Yes, first** |
| D-C | Adopt the per-layer retention in §5 | **Yes**, through the §6 measurement gate |
| D-D | Ships aggregates only | **Yes** (no-surveillance line; GPT agrees) |
| D-E | Fires option F2 (a late-processed figure for D from one extra pull on D+1) | measure first, then decide |
| D-F | Change rules in §7 | **Yes** |

## 9. Rev 2 changes (from GPT's review, 5 Nov — all adopted)
| # | Rev 1 | Rev 2 |
|---|---|---|
| 1 | the 4° cell as the permanent *place key*; named places as sets of cells | the grid is a permanent *reference*; coordinates and source IDs kept where records are kept; named places get their own boundaries; cell-only layers disclose their limit |
| 2 | "keep everything the page published" via one 23:07 daily copy | the promise is defined per layer: measurements + daily checkpoint (labelled cutoff) or every distinct version; plastic revisions kept |
| 3 | collection history "answers fewer ships or fewer receivers" | collection ran / records received / source coverage kept apart (§3); **rev 1 contradicted our own D9** |
| 4 | tables named, not defined | each retained quantity defined (§5): quake revisions append-only; fires "as of last pull of D" with the late-detection gap stated; drifters = sampled track; orbital = population of our catalogue query; run ID + version on every row |
| 5 | place view after storage; select only where records exist | place view first on existing data with start dates; any cell selectable; off layers load only on an explicit press, never enabling markers; per-layer run-consistent sections |
| 6 | "only R2 storage ever non-zero"; one annual cycle before any comparison | every meter listed as to-measure, with a gate; a defined difference between two adequately sampled periods allowed early; "unusual/seasonal/trend" needs a suitable reference record |

## Sources (read 5 Nov 2026)
- Cloudflare D1 pricing — https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare D1 limits — https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare R2 pricing — https://developers.cloudflare.com/r2/pricing/
- Current tables: `phase1/schema.sql`; retention: STATUS 4 Nov; D9: STATUS Decisions

## 10. Rev 3 wording changes (GPT, 5 Nov)
| # | Change |
|---|---|
| 1 | data revision vs processing/check change vs repeat retrieval defined (§5); unchanged datasets are not duplicated; revised plastic verification results are preserved |
| 2 | drifters: identical buoy + fix-time repeats suppressed; corrections under the same key preserved (§5) |
| 3 | collector uptime kept apart from hours when records reached us for a particular cell; retention start kept apart from first report for that cell (§3) |
| 4 | "cannot be rebuilt for any date before this lands" → "we do not currently retain a lasting history of these records" (§2) |

## 11. Where the build differs from rev 2 (and why)
| Rev 2 said | Built | Why |
|---|---|---|
| per-cell slices for plastic/drifters written when those jobs run | an in-memory per-cell index inside the hub, rebuilt only when the file changes | zero extra writes; measured cost in the candidate report |
| drifter fixes as a daily R2 file | D1 table `drifter_fixes` | de-duplication and correction semantics are enforced by the table's key; size measured before any go |
| orbital row with stale and beyond-GEO counts | counts by class, row count, query, filter, file sha | stale/beyond-GEO are computed on the page at view time; the hub does not propagate |
| B7: extend `cell_receipts` to ships | nothing new | "records reached us here" and "first report here" come from the existing `cell_hourly` |
| forest daily checkpoint | none | `forest_daily` already keeps every query per cell with its dataset version |
| — | **FIRMS parser fix**: a missing FRP is now null ("not provided"), not 0 | found by the new tests; today's hub turns an empty FRP into 0 MW |
