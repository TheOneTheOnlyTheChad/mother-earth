# Earth Ops Room — Specification v0.3

**Status:** revised after second review round (27 Oct 2026) · **Owner:** Chad
**Supersedes:** v0.2. Reviews: R1b (GPT), R2b (Claude, separate thread), R3 (third reviewer). Changes marked **[v0.3]**.

---

## 0. What changed and why

The second round agreed v0.2 had the right spine and attacked the places where it was still able to lie. Five structural changes:

1. **Activity and coverage are now two independent properties, not one three-state cell.** v0.2 let a cell with one received observation during a mostly-interrupted window count as "Observed" and permitted a downward comparison on it (R1b). Now every cell carries a count *and* a coverage grade with evidence. "Confirmed zero" is gone; it is "zero detections in an adequately observed window", with *adequate* defined per source.
2. **Freshness is three separate checks, not one.** Source observation time, collector retrieval time, and coverage are checked independently. An endpoint returning HTTP 200 with the same old positions must still expire them (R1b). Events (a quake that happened 20 hours ago is still a valid event in a 24-hour window) are distinguished from positions (a ship position from 20 hours ago is not a current position).
3. **Collectors produce the canonical dataset for every layer that enters comparisons.** v0.2 said "viewers never collect" and then had the browser call USGS, SWPC and Wikimedia directly (R1b). Browsers now read snapshots for every comparison layer so that what is displayed and what is stored in history come from the same processing. Only imagery tiles stay direct.
4. **Poisson is a candidate, not the rule.** All three reviewers pushed here from different sides. Descriptive comparisons ship first; any probabilistic highlight has to pass a held-out validation with a measured map-wide false-highlight rate before it renders. Persistence is per layer. The expected value shown in the sentence is the same quantity used in the calculation.
5. **History is the asset; aggregates are derived.** Raw timestamped snapshots *and* coverage records are retained in R2 with a retention policy, and a nightly batch computes hourly cell aggregates into D1. Zeros are preserved because the coverage record says whether a missing row means zero or unknown (R1b, R2b, R3 all converged on nightly batching).

Smaller but binding: the register's "Verified" column is split into separately dated checks that can each fail; Durable Objects are treated as unverified for the free tier (reviewers disagree on whether they're free; outbound WebSockets don't hibernate either way, so duration cost must be tested); the promise gains one word, "its own comparison period"; the Choices panel ships read-only in phase 1; the day-old imagery is labelled on the globe itself.

Where reviewers disagreed, the calls:
- **`stale_after` user-adjustable?** R2b yes, R3 no. **No.** The rule: viewer-adjustable settings may make the globe quieter or louder, never less honest. Lowering a staleness threshold manufactures false currency.
- **Minimum expected count user-adjustable?** R2b yes, R1b no. **No**, same rule. Comparison window length, p-value cutoff, cell size (from a fixed set), lookback mode and tier visibility: yes.
- **Ships collector runtime.** R3: DOs cost $5/month, use a free external process. R2b: free-tier DOs may exist, verify. R1b: test cost and lifecycle regardless. **Decision:** phase 2 starts with a test of the DO on the current free tier; if it fails on cost or continuity, the fallback is a tiny external process (Render/Fly free tier) that holds the socket and posts snapshots to the Worker, or a cron sampler labelled "sampled, not continuous". No promise until measured.
- **IODA vs Radar.** R3 and R2b prefer IODA; R1b says don't decide until endpoints, redistribution terms and granularity are compared. **Decision:** IODA is the candidate for the observation tier, Radar for corroboration, and the register row stays unverified until the comparison is done.

---

## 1. Purpose

### 1.1 Promise **[v0.3]**
"See what was observed, what differs from **its own** comparison period, and what remains unknown — including unknown coverage."

"Its own" closes the door on cross-layer inference (ships down *and* planes down *therefore*…), which is exactly the inference a stranger will make and the one §6 forbids.

### 1.2 Problem, thesis, audience, non-goals
Unchanged from v0.2 §1.2–1.6, with one correction: a deployed prototype tests usefulness. It does not test the claim that no competing composite view exists; that stays a hypothesis.

### 1.3 Success criteria
- v1: public URL; three layers (earthquakes, aircraft, fires) passing every check in §10; status sentence, legend, freshness and coverage visible without clicking; read-only Choices panel; cold load measured on a mid-range Android on 4G.
- v2: ships collector verified with dated evidence of continuity and cost.
- v3: at least one layer with a validated probabilistic comparison whose false-highlight rate has been measured; "insufficient history" and "coverage inadequate" states demonstrably in use.
- Cost: zero or near it, with every non-zero line item named.

---

## 2. Source register **[v0.3 — verification split]**

"Verified" was one date implying everything had been tested. It is now five checks, each dated or blank, each able to fail:

| Check | What it proves | Evidence kept |
|---|---|---|
| **Endpoint** | the URL answers with the expected shape | date, sample response saved |
| **Access** | key/auth works from the collector | date |
| **Terms** | licence read; permitted use, attribution, retention, redistribution recorded | date, URL, quoted clause |
| **Sample** | a real response parsed into the data model without loss | date, sample file |
| **Coverage** | what the source itself says about its spatial/temporal coverage and gaps | date, URL |

A source enters the UI only when all five are dated. A source enters comparisons only when, additionally, its adequacy rule (§3.2) is written and tested.

| Layer | Source | Tier | Endpoint | Access | Terms | Sample | Coverage | Source-health signal (§3.3) |
|---|---|---|---|---|---|---|---|---|
| Earthquakes | USGS 2.5_day GeoJSON | observation | 27 Oct (page only) | n/a | – | – | – | feed `metadata.generated` |
| Geomagnetic Kp | NOAA SWPC | observation (index, not map) | 27 Oct (page only) | n/a | – | – | – | last row `time_tag` |
| Imagery | NASA GIBS | imagery (dated) | 27 Oct (page only) | n/a | – | – | – | WMS `TIME` honoured |
| Fires | NASA FIRMS VIIRS NOAA-20 NRT | observation (per pass) | – | – | – | – | – | pass schedule + `acq_time` |
| Aircraft | OpenSky | observation | – | – | – | – | – | HTTP 200 + `time` field advancing |
| Ships | aisstream.io, Class A + B | observation | – | – | – | – | – | socket up + message rate + per-cell receipt history |
| Wikipedia place activity | EventStreams + article coords | observation (activity about a place) | – | – | – | – | – | stream heartbeat |
| Aurora oval | NOAA SWPC Ovation | model | – | – | – | – | – | file timestamp |
| Air quality | OpenAQ v3 | observation (uneven stations) | – | – | – | – | – | per-station last update |
| Cyclones | NOAA NHC / JTWC | observation + model cone | – | – | – | – | – | advisory time |
| Satellites | CelesTrak + satellite.js | model | – | – | – | – | – | TLE epoch |
| Internet connectivity | IODA (candidate); Radar (corroboration) | observation | – | – | – | – | – | TBC |
| Lightning | Blitzortung | locked | – | – | – | – | – | – |
| Reporting | GDELT | reporting (out of v1) | – | – | – | – | – | – |

"27 Oct (page only)" means a page was read, nothing more. Those rows are not yet verified under this definition.

---

## 3. Activity, coverage and freshness **[v0.3 — rewritten]**

### 3.1 Two properties per cell
```
activity:  { count: int, measures: {...} }                       // what was detected
coverage:  { grade: 'adequate' | 'partial' | 'unknown',
             evidence: string,                                   // machine-readable code, see §3.2
             observed_fraction: 0..1 }                           // share of the window the cell was observable
```
Rendering: activity draws points/counts; coverage draws the cell's hatching. Comparisons (§6) run only on cells whose coverage is `adequate` for the whole window. A cell with `count: 0` and `coverage: adequate` is a true zero. A cell with `count: 0` and `coverage: partial|unknown` is not a zero and is excluded.

No cell ever displays "Coverage: full" unless the provider supplies evidence for that claim (R1b). The UI word for adequate is "observed throughout the window".

### 3.2 Adequacy rules, per source
| Source | Adequate means | Partial | Unknown |
|---|---|---|---|
| USGS | feed generated within 10 min and the network catalogue covers the region at M2.5 (it does not everywhere; USGS documents M4.5 global completeness) | region below completeness threshold | feed stale |
| OpenSky | collector run succeeded with advancing `time`, and the cell is inside OpenSky's receiver coverage map | cell outside receiver coverage (oceans, parts of Africa) — *this is most of the world's cells* | run failed |
| FIRMS | at least one satellite pass over the cell inside the window (pass schedule known) | cloud-obscured pass (not detectable from CSV; treat passes as adequate but say "cloud may hide detections") | no pass in window |
| aisstream | socket up for ≥ 90% of the window *and* the cell has a history of receipt (terrestrial AIS doesn't cover open ocean) | socket up but cell historically silent | socket down for > 10% of window |
| Wikipedia | stream heartbeat continuous | – | stream down |

The honest consequence: for aircraft and ships, most ocean cells are *partial* at best. Less-than-expected highlights will therefore mostly be possible near coasts and over land. That is correct and will be visible as hatching.

### 3.3 Three freshness checks, separately
| Check | Field | Rule |
|---|---|---|
| Source observation time | `observed_at` per record | positions older than `position_ttl` expire from display even if re-delivered; events stay for their window |
| Collector freshness | `retrieved_at` per snapshot | snapshot older than `stale_after` → layer Unknown |
| Coverage | §3.1 | independent of the two above |

Position layers (aircraft, ships): `position_ttl` 5 min / 15 min. Event layers (quakes, fires): window-based, 24 h, age shown but not expiring inside the window. Acceptance test §10.1 covers the 200-with-stale-data case.

### 3.4 Source-health signal
Per layer, the specific field the collector reads to decide "reporting normally" (column in §2). Without this, adequate collapses into unknown and less-than-expected never fires (R2b).

---

## 4. Architecture **[v0.3]**

### 4.1 Shape
```
viewer ──GET──▶ GitHub Pages (index.html) ──GET──▶ Worker /snapshot/<layer>  ──read──▶ R2 (latest + archive)
viewer ──direct──▶ NASA GIBS imagery tiles only
                                                  Collector Worker (cron, per layer) ──▶ USGS, SWPC, OpenSky, FIRMS, Wikimedia, …
                                                        └── writes snapshot + coverage record to R2 (timestamped, retained)
                                                  Ships collector (DO | external free process | cron sampler — decided by test) ──WSS──▶ aisstream
                                                  Nightly batch Worker (02:00 UTC) ── reads 24 h of R2 ──▶ D1 hourly cell aggregates + coverage
```

### 4.2 Principles
- **Canonical data comes from collectors, for every comparison layer.** The browser calls no data API directly. Only imagery is direct. Displayed records and stored history share one code path. (Open sources without keys are still collected server-side; it costs nothing and buys consistency.)
- **Viewers only read.** Upstream load is a function of the schedule, never the audience.
- **Raw snapshots are retained.** `/snapshots/<layer>/<ISO-minute>.json` plus `/coverage/<layer>/<ISO-minute>.json`, retention 90 days raw, then thinned to hourly. Overwriting "latest" is not history. This is what lets cell size, dedup rules and statistical method be changed later and recomputed.
- **Aggregates are derived nightly.** One batch computes hour-of-week buckets per cell per layer from the retained snapshots and writes only changed buckets to D1. Zeros survive because the coverage records say which absent rows were adequately observed.
- **Storage is budgeted in operations.** D1 free: 100k row writes/day, including index maintenance. Nightly batch at 4° cells × 4 layers × 24 h ≈ 15k rows/day: fits. 2° would be ~60k: fits but tight; stay at 4° until needed. KV is not used for anything written often (1,000 writes/day).
- **Abuse controls** on `/snapshot/*`: Cloudflare rate-limit rule per IP; fixed response sizes; no viewer parameter changes upstream cost.
- **Envelope versioning:** every snapshot carries `schema_version` and `collector_version` (R2b).

### 4.3 Collector budgets
| Source | Schedule | Budget rule |
|---|---|---|
| OpenSky | world pull every 5 min (288 × 4 = 1,152 credits) + one bbox of interest at 60 s | bbox cost is measured on first run and recorded; collector tracks daily spend in D1 and **automatically** lengthens the bbox cadence when spend passes 80% of 4,000 (R2b: no human reading a budget); hard stop at 95%; backoff on 429 |
| FIRMS | every 15 min | trivially within 5,000/10 min |
| USGS, SWPC, Wikimedia | USGS and SWPC every 5 min; Wikimedia stream sampled by the ships-style collector or a 30 s cron window labelled "sampled" | none |
| Ships | continuous if the runtime test passes; otherwise sampled and labelled | 3 connections per key |
| Nightly batch | 02:00 UTC | D1 ≤ 100k writes/day |

### 4.4 Ships collector — test plan before any commitment **[v0.3]**
1. Deploy a DO on the current free plan holding the aisstream socket. Outbound WebSockets do not hibernate, so the DO is billed for wall-clock duration while connected (R1b). Measure: 24 h continuity, reconnects, restart recovery, duration consumed against the free allowance, projected monthly cost.
2. If cost > $0 or continuity < 99%: fallback A, an external free-tier process (Render/Fly) holding the socket and POSTing a snapshot to the Worker every 30 s with a shared secret. Fallback B, a cron Worker that samples aisstream for its full invocation window, labelled "sampled, not continuous" in the rail, excluded from comparisons.
3. Ships enter comparisons only after enough *usable* ship history has accumulated under whichever runtime won — not six weeks after the project started (R1b).

---

## 5. Data model **[v0.3]**

```
record = {
  layer, id, lat, lng,
  observed_at, retrieved_at,
  kind: 'observation' | 'model' | 'reporting',
  measures:   { [name]: { value: number, unit: string } },     // numeric only
  attributes: { [name]: string },                             // categorical: ais_class 'A'|'B', confidence 'h'|'n'|'l', mag_type 'mb'|'ml'|'mw'|…
  label, title: plain text,
  src: url
}

snapshot = {
  schema_version, collector_version,
  layer, window_start, window_end, retrieved_at,
  source_status: 'ok' | 'degraded' | 'down',
  interruptions: [ {from, to} ],
  cells: { [cell_id]: { count, coverage: {grade, evidence, observed_fraction} } },   // machine-readable, drives hatching
  records: [ record, … ]
}
```
- Earthquake magnitude keeps its type (`mag_type` attribute); the UI shows "M4.8 (mb)", never a blanket "Mw" (R1b).
- Aircraft quantity is "unique aircraft observed per cell per interval", named exactly that. "Occupancy" would require integrating repeated samples over time; it is not computed in v1 (R1b).
- `coverage_note` free text is gone; cell coverage is structured.

---

## 6. Comparisons **[v0.3 — rewritten]**

### 6.1 Order of operations
1. **Descriptive first.** The inspector and Changes panel show the current count and the same hour-of-week in previous weeks as numbers: "12 ships; the last 6 Tuesdays at this hour: 9, 14, 11, 10, 13, 12". No glow. This ships in phase 3 as soon as history exists.
2. **Probabilistic highlight only after validation.** A candidate model (Poisson first; negative-binomial with empirical-Bayes shrinkage toward neighbours and layer mean as the likely successor, because ship and aircraft counts cluster and over-disperse) is fitted on retained history, tested on held-out weeks, and its **map-wide false-highlight rate** is measured. Thousands of cells × 168 buckets create many chance extremes; the cutoff is chosen against that, not per cell. No highlight renders until this has been done for that layer and the result recorded in the Choices panel.

### 6.2 Rules binding any method
- Quantity defined and deduplicated before any statistic (unique id per layer; a re-fetched 24-hour list never double-counts).
- Comparison runs only on cells with `coverage.grade = adequate` across the whole window; partial/unknown cells are excluded, never zeroed.
- Tail probability (P[X ≤ k] or P[X ≥ k]), not P[X = k] (R1b).
- The expected value displayed in the sentence is the same quantity used in the calculation (if the model uses a fitted rate, the sentence shows the fitted rate, not a median) (R1b).
- Floor: no less-than-expected highlight when the expected count is below 0.5 (R3).
- No smoothing across land/sea boundaries or across cells that share no route structure (R1b); neighbour shrinkage, when introduced, is restricted to same-class cells.
- Persistence per layer: aircraft 1 interval (an airspace closure shows within one 5-minute interval and matters immediately), ships 2 intervals, fires 1 pass, quakes n/a (events, not rates) (R2b).
- Six weeks of history is six examples of each hour-of-week bucket, not validation. Minimum history before any probabilistic highlight: per layer, set after the held-out test, never less than 8 weeks.
- **Nothing is implied.** A highlight renders only with its sentence, source and basis. The sentence is generated from a template that cannot emit a cause.

### 6.3 Sentence template
`<count> <quantity> observed in this cell during <window>. Expected for this hour-of-week: <expected> (<method>, <n> weeks). Coverage: <grade>.`
Nothing else. No verbs of consequence.

---

## 7. UX **[v0.3]**

### 7.1 Ten-second legibility (unchanged from v0.2) plus:
- **Imagery date on the globe itself**, as a small permanent label in the corner of the skin: "Imagery: 26 Oct 2026 (NASA GIBS)". The skin is the one thing a stranger reads as live (R2b).
- Hatching legend always visible: "hatched = not observed throughout the window".

### 7.2 Changes panel (quiet, collapsed) — unchanged.

### 7.3 Choices panel **[v0.3 — constrained]**
Ships **read-only in phase 1** (R1b): every active feed, tier, threshold, window, cell size and stale rule, with its value.

Adjustable from phase 3, each shown with its default beside it and a one-click reset (R1b, R2b):
- which layers and which tiers (observation / model / reporting) are visible
- comparison lookback: "last N weeks, same hour-of-week" with N from a fixed set, or "same month previous year" when ≥ 1 year of history exists (R3)
- highlight cutoff (p-value) within a bounded range
- cell size from a fixed set

Never adjustable, because changing them makes the view less honest rather than quieter or louder:
- `stale_after` and `position_ttl`
- minimum expected count and minimum history
- coverage handling and Unknown exclusion
- deduplication rules
- the sentence template
- which tier a source belongs to
- source timestamps

Customised values are marked as customised in the panel and in the status sentence.

---

## 8. Legal and ethical
Unchanged from v0.2 §8, plus: terms evidence is a quoted clause with URL and date in the register, not a tick.

---

## 9. Risks and open items **[v0.3]**
1. Ships collector runtime and cost — unresolved until the §4.4 test.
2. OpenSky bbox credit cost — measured on first run; cadence auto-degrades.
3. OpenSky coverage map — needed for §3.2 adequacy; obtain or derive from receipt history.
4. FIRMS cloud obscuration is invisible in the CSV; the adequacy rule over-states coverage under cloud and must say so.
5. D1 daily operation budget at 4° — calculated (~15k rows), to be confirmed against actual index cost on first nightly run.
6. Statistical method — descriptive only until validated; validation plan is itself unwritten.
7. Internet connectivity source — endpoint/terms/granularity comparison pending.
8. Wikipedia coordinates lookup rate and cache.
9. Phone cold-load unmeasured.
10. Lightning locked.

---

## 10. Acceptance checks **[v0.3]**

### 10.1 Trust
- Upstream outage → layer Unknown, cells hatched, zero highlights. Never a less-than-expected highlight.
- Upstream returns HTTP 200 with unchanged, expired positions → those positions expire on `position_ttl` regardless of retrieval success.
- Event older than its window drops; event inside its window stays with age shown.
- A cell with one observation in a window whose coverage was partial renders as partial and is excluded from comparison.

### 10.2 Collection
- 20 open tabs do not change collector upstream calls (Cloudflare logs).
- OpenSky daily spend stays under 95% across a full day; bbox cadence visibly lengthens past 80%; backoff observed on a forced 429.
- Nightly batch completes within D1 write budget; zeros for adequately-observed cells are present in D1.

### 10.3 Legibility
- Inspector shows observation, observed_at, retrieved_at, coverage grade with evidence, source link, and comparison with basis or "insufficient history" / "coverage inadequate".
- Status sentence, legend, hatching legend, imagery date and freshness badges visible on a 390 px phone without scrolling.
- Cold load ≤ 5 s to interactive globe on a mid-range Android on 4G; large layers load progressively and are marked.

### 10.4 Honesty
- Every rendered comparison is produced by the template; the template cannot emit a cause (unit test over the template).
- Choices panel lists every active feed, tier, threshold, window, cell size and stale rule; non-adjustable items are shown as non-adjustable.
- Register: all five checks dated for every source in the UI.

---

## 11. Roadmap **[v0.3]**

| Phase | Scope | Chad's manual work |
|---|---|---|
| **0 — done** | Local prototype | — |
| **1 — prove three** | Collector Workers for USGS, SWPC, OpenSky, FIRMS writing timestamped snapshots + coverage records to R2. Nightly batch to D1 running from day one (descriptive only). Worker `/snapshot/*` with rate limits. Page on GitHub Pages reading snapshots; activity/coverage rendering; three freshness checks; status sentence; legend; imagery date; read-only Choices panel. Register: all five checks for USGS, SWPC, GIBS, OpenSky, FIRMS. All §10 checks run and recorded. | Cloudflare: Worker, R2 bucket, D1 database, cron triggers; **three secrets** (OpenSky ID, OpenSky secret, FIRMS key). GitHub: repo + Pages. Read and date five licence pages. |
| **2 — ships** | §4.4 runtime test; chosen runtime deployed; Class A + B; interruption log; register row completed. | aisstream secret; possibly a Render/Fly account |
| **3 — descriptive comparisons** | Inspector and Changes panel show numeric history per cell; Choices panel adjustable; cell size and lookback options. No highlights. | — |
| **4 — validated highlights** | Held-out validation of candidate model per layer; false-highlight rate measured; highlights enabled per layer only on pass. | — |
| **5 — breadth** | Wikipedia place activity, aurora (model), OpenAQ, IODA, cyclones, satellites (model) — each via a fully-dated register row. | OpenAQ key |
| **6 — optional** | Blitzortung receiver; domain; flat-map polish. | kit, domain |

---

## 12. Questions for the next round (fewer, narrower)
1. §3.2: for OpenSky and aisstream, is "receipt history per cell" an acceptable proxy for receiver coverage, or is there a published coverage map we should use instead?
2. §6.1: what is a minimal, defensible held-out validation protocol for the first highlight — weeks held out, metric, acceptable map-wide false-highlight rate?
3. §4.4: anyone with current evidence on free-tier Durable Object duration limits with a non-hibernating outbound WebSocket?
4. §7.3: is the adjustable/non-adjustable split right, and is "quieter or louder, never less honest" the right test for it?
5. Anything in v0.3 that still lets the display say more than was observed?
