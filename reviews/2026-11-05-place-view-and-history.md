# Mother Earth — Place view and what we keep from now on (proposal rev 5, 5 Nov 2026)

Prepared by Claude for Chad and GPT (thread 14). **A proposal for decision. Nothing here is built, deployed or scheduled.** Every decision in §7 is Chad's.

**Rev 5 (5 Nov):** checkpoint design made stateless after GPT's re-check of `482ffb0` (four probes); history reported as two facts (collecting now / retained); public wording split accordingly — candidate report §8. **Rev 4 (5 Nov):** §5 reconciled with the implemented behaviour after GPT's independent review of the branch (three defects fixed — see the candidate report §7). **Rev 3 (5 Nov, GPT's go to build on a branch):** four wording details adopted (§10), and the build's deviations from rev 2 recorded (§11). Candidate results: `reviews/2026-11-05-place-view-candidate.md`.

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

**Archive promise, stated per layer — reconciled with the implementation (rev 4–5, 5 Nov; `phase1/worker.js` 0.5.1 on `place-view`, tables in `phase1/schema.sql`).** Nothing below runs unless `HISTORY_ENABLED=1`.
| Layer | Kept (definition) | Where | Not recoverable from it |
|---|---|---|---|
| **Earthquakes** | **Every distinct revision** of every event we received: USGS id, USGS `updated`, our received time, run ref, collector version; origin time, lat/lng, depth, magnitude, mag type, place text, status. Append-only: a new row only when USGS `updated` changes. **Plus** a daily checkpoint (below). | D1 `quake_revisions`; R2 `archive/checkpoints/usgs/<day>.json.gz` | events outside the M2.5+ day feed |
| **Fires** | **Per cell per UTC day, as of our last successful pull of that day** (cutoff = that pull's retrieved_at): detections; FRP sum and max **over only the detections that carry a valid FRP** (`frp_n` of them; **null when none do**, never 0; a reported 0 stays 0); day/night counts. Detections FIRMS processes for that day after our last pull are **not** included. **Plus** that last published file as a daily checkpoint. *Option F2 (a late-processed figure from one extra pull on D+1) is not built — measure first.* | D1 `fires_daily`; R2 `archive/checkpoints/firms/<day>.json.gz` | intermediate 15-min versions; later-processed detections |
| **Daily checkpoints (fires, earthquakes) — how** | **No mutable state.** Each run with history on records an idempotent fact `history_activity(layer, day)`. A day is **due** when history ran on it, it is **closed** (end of day + 30 min grace, so in-flight runs of that day have published), and it has neither a completion marker (`archive_checkpoints`) nor a recorded gap (`archive_gaps`). The input is chosen afresh at every attempt: the retained `snapshots/<layer>/` object (kept 2 days) with the **latest full `retrieved_at`** on that day — so a failed write, a late run with an earlier timestamp, or an overlapping run cannot point it at the wrong file. Overlapping attempts choose the same input and write the same bytes/rows (idempotent). The marker is checked **first** and written **last**. A due day with no retained snapshot is recorded as a gap with the reason (expired, or none published). Pending days, gaps, last completed and recent history failures are reported in **`/status` → `archive_health`**. | D1 `history_activity`, `archive_checkpoints`, `archive_gaps`; failures in `collector_runs` (`history:<step>`) | a closed day not completed within ~2 days (recorded as a gap with the reason; retention of inputs not extended — Chad's call) |
| **Ships** | **Aggregates only** (existing `cell_hourly`, `layer_hourly`). Nothing new. No vessel position is retained beyond the 2-day storage rule. | — | any vessel's position or track; any finer-than-cell answer |
| **Forest** | existing `forest_daily` (every query per cell, with GFW version). Nothing new. | — | pixel locations within a cell |
| **Drifting buoys** | **Sampled track:** the latest fix per buoy as returned by each hourly OSMC query. Identical repeats (same buoy + fix time + position + SST; a missing SST keyed `na`) are not stored again; a **correction** (same buoy + fix time, different position or SST) is kept as its own row with the time we first received it. *Not* every fix the buoy reported. | D1 `drifter_fixes` | fixes between our hourly samples |
| **Sea ice** | each distinct value per hemisphere per data date (a revised value is a new row), with NSIDC's 1981–2010 average for that day, run ref. **Plus** versions (below). | D1 `seaice_daily` | — (NSIDC holds the full series) |
| **Kp** | existing `kp_index`. Nothing new (not versioned). | — | — |
| **CO₂** | existing `co2_daily`, **plus** versions (below). | — | — |
| **Orbital** | the **population in our catalogue query** (Space-Track GP: not decayed, epoch within 10 days) per published element file: counts by class, row count, query, filter, file sha256. Changes can come from filtering, classification or element freshness as well as launches and reentries. (Stale and beyond-GEO counts are computed on the page, not in the hub, and are **not** kept.) **Plus** versions of the meta file. | D1 `orbital_population` | positions; objects outside the query |
| **Versions (CO₂, sea ice, orbital meta, microplastic samples)** | The full published envelope, stored **only when the source's data or our processing/check results changed** (`first`, `data`, `processing`, `data+processing`). A repeat retrieval stores nothing new: it only advances that version's retrieval count, last retrieval time and last run ref. For plastic, a revised check result is a `processing` version. | R2 `archive/versions/<layer>/…json.gz`; D1 `archive_versions` | — |
| **Public wording** | The hub reports two facts on `GET /` and `/status`: `history.collecting` (new history being collected now) and `history.retained` (what exists, per layer first/last; `exists: null` = unreadable). The base lines state only what is always true; a history line follows the report: *collecting (retained since …)* · *retained for … to …; collection is off now — retained history is not deleted* · *no further history collected* · *could not be read just now* (never "none" when unknown). Sources & Details lists history rows while collecting or retained, with their range. | — | — |
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
