# Mother Earth — handover to thread 6 (2 Nov 2026)

Read `START-HERE.md` (§2 is the constitution; §5a testing; §5b the ships duration contract), then `STATUS.md`. This file is the index: what is deployed, what is finished, what is genuinely unverified, and what Chad might build next.

---

## 1. State

| | |
|---|---|
| Repo | `github.com/TheOneTheOnlyTheChad/mother-earth`, `main` at **`310c13d`**. Commit straight to main, no branches. AGPL-3.0. |
| Hub (Cloudflare Worker) | **collector `0.2.1`** · `https://mother-earth.chadoberholzer.workers.dev` · `/`, `/status`, `/cells/<layer>`, `/snapshot/<layer>`, `POST /ingest/<layer>`, `POST /admin/reaggregate/ships`, `GET /admin/run/<job>` |
| Page (GitHub Pages) | `https://theonetheonlythechad.github.io/mother-earth/` · assets at `?v=202611021100` — **bump on every page change, in `index.html` and `sources.html`** |
| Mac collector | **`mac-0.3.2`**, launchd `earth.mother.ships` runs `~/mother-earth/run.sh tick` every minute, samples when 30 min are due |
| Cron triggers | `:07` hourly · `*/5` · `*/15` firms · `11,41` forest |
| Layers live | quakes, fires, ships, forest, Kp, CO₂, sea ice. Aircraft parked (OpenSky correspondence governs — public site must feed the network). |

**Authoritative paths and sync.** The repo clone is the working copy. Three copies must stay in step:

| What | Repo | Mac |
|---|---|---|
| Hub | `phase1/worker.js` | `~/Documents/Mother Earth/phase1/worker.js` |
| Mac collector | `phase1/collector-mac.mjs`, `run.sh`, `sleeptest.sh`, `duration-contract.test.mjs` | same under `~/Documents/Mother Earth/phase1/` **plus the runtime copy in `~/mother-earth/`** — macOS denies launchd access to `~/Documents`, so the scheduler runs from `~/mother-earth` and any change must be copied there too |
| Page | `index.html`, `sources.html`, `app.js`, `style.css` | same names in `~/Documents/Mother Earth/` |
| Docs | `STATUS.md`, `START-HERE.md`, `HANDOVER.md`, `REGISTER.md` | same, **and** `Projects.project_write` to `claude/<name>.md` |
| Keys | never in the repo (gitignored) | `~/Documents/Mother Earth/KEYS.md` and `~/mother-earth/KEYS.md` |

Procedure: edit in the clone → commit with the attribution trailer → `git push origin main` → `device_commit_files` to both Mac paths → `project_write` for the docs. Hub deploys go through the Cloudflare editor (START-HERE §4; two `type` calls for a file over ~50 KB). GitHub Pages locks the next push for ~30 min after a successful deploy.

---

## 2. Completed and verified

- **Page.** World View layout (map layers left, globe centre, indices right), Sources & Details, card hierarchy (value → observation time → source/retrieval → quiet caveat), plain-language WebGL fallback with technical detail in a collapsed Diagnostics block, record inspector for individual records as well as coverage cells with focus restore, and user-triggered snapshot navigation ("highest magnitude in this feed", "highest FRP in this snapshot") with ties, exclusions and the FRP caveat. No ticker, no automatic selection, no automatic camera movement, no danger ranking.
- **Limited search (2 Nov, thread 5).** One collapsible **Explore** panel, closed on load, replacing the Find card and holding the search plus the two unchanged snapshot-jump buttons. Searches only loaded records: USGS descriptions, vessel names and MMSIs, and latitude/longitude typed in that order. Fires and forest publish no text and are never text-searched (fires do join a coordinate search). A coordinate always offers "Go to", then records within 250 km nearest first, 12 max with the true total; the radius is stated as a choice for this box, never as a coverage boundary. Results are revalidated per layer against run identity, visibility, freshness and the pairing rule, and refused with the reason rather than opened. Ships' observation time, receipt time and sample end are kept distinct. Full detail in STATUS "Done 2 Nov (thread 5)".
- **Atomic cells/records pairing.** `refreshPair()` commits counts and records together; `usable(layer)` re-checks `pmeta.id === snapId(state[layer])` at every read — points **and rings**, inspector, navigation, card note. Proven with a harness that reproduced the bug on the previous build (render passes mixing RUN2 cells with RUN1 points/rings) and shows 0 mixed passes now.
- **Missing is not zero.** `ME.fmt()` renders an absent value "not provided" and a source-reported zero as "0 … (source-reported zero)". Verified against a live FIRMS snapshot containing two genuine FRP zeros.
- **Ships aggregation.** Four outcomes kept apart — `absent` (nothing received), `down` (every received attempt reported source failure), `degraded` (received, none usable or fewer than expected), `ok`. Verified in production on live degraded data.
- **Hours 12/13 UTC repaired** (1 Nov): `absent 0/2` → `degraded 0/2`, cell rows 0 → 0, evidence cross-checked against `collector_runs` before writing, idempotent on re-run, scope confirmed in D1. Those hours remain excluded from comparisons.
- **Mac runner.** Shared `mkdir` lock with pid-liveness (a lock is stale only when old **and** its owner is gone); bounded local storage (one pending envelope, 5 MB cap, 2 h expiry; rotated logs ~5 MB); upload retries with backoff; **completion-based scheduling** — the 30 min interval runs from when the previous attempt finished, so an overrun cannot shorten the next gap.
- **Duration contract** (START-HERE §5b, authoritative in code): intended sample **60 s**; elapsed **> 75 s** → `degraded`, `overlong_sample`, never usable; **120 s** hard stop → socket closed and later messages rejected before mutation. Thresholds are multiples of the window. The 180 s window in the 2 Nov physical test was a one-off override for that run only.
- **Sleep detector retired.** Verified against `pmset -g log` (written by macOS, not by us): three overnight samples sat inside Maintenance Sleep of 946/921/682 s against gaps of 948/923/686 s and it reported `slept=false` every time. `wall_s`/`mono_s` stay as raw measurements; **neither is evidence about sleep**.
- **Deterministic duration tests pass on both the container and the Mac** — see §4.

---

## 3. Remaining checks — each with its decisive next step

| # | Open item | Decisive next check | Blocks feature work? |
|---|---|---|---|
| 1 | **Physical long-sleep / resumption — UNVERIFIED on hardware** | A suspend that actually lasts past the hard deadline. The 2 Nov attempt under-ran: macOS recorded `Software Sleep pid=410` then DarkWaked 27 s later on `wifibt`, so the sample was still inside its window. Need a method that keeps the host down (method not yet agreed; **no power-setting changes**). | **No** |
| 2 | **Forest 24 h usage** | Read Worker Metrics ~24 h after a forest run and compare against the expectation (+48 invocations/day, ~290 outbound requests, negligible CPU). Watch for GFW 504 clustering. | No |
| 3 | **FIRMS CPU profiling and attribution** | Aggregate CPU is P50 2.95 / P90 46.09 / P99 81.17 / P999 90.15 ms with 0 CPU-limit errors, rising with file size through the UTC day (~310 ms at 16:00, input 2.4 MB / 28,924 records). **This does not establish that FIRMS routinely consumes 5–8× its allowance** — the Free-plan event log has no per-invocation CPU field. Next: check Cloudflare's production CPU profiler and whether our plan has it. Do **not** add `Date.now`/`performance.now` timers — deployed Worker clocks freeze between I/O. | No, but decide before adding another heavy parse |
| 4 | **GML retrieval integrity** | gml.noaa.gov subrequests failed at 13% over 24 h. Confirm a failed retrieval preserves the previous value with its original observation and retrieval times and an honest failure status. A subrequest failure rate alone does not establish corrupted published CO₂. | No |
| 5 | **Physical mobile testing** | The Galaxy as an always-on collector: Termux + Node, battery optimisation off, 48 h screen-off logging expected vs successful collections, then a Wi-Fi interruption and a reboot recovery test. Second candidate: Xiaomi Mi TV Stick. **No hardware purchase.** | No |

Nothing in this list blocks starting a feature. Items 1 and 5 are about collection reliability; 2–4 are measurement and integrity.

**Synthetic ≠ hardware.** The duration-contract tests prove the guard's logic. They do not verify behaviour on a real suspend, and item 1 stays open regardless of them.

---

## 4. Test commands and evidence locations

```
node phase1/duration-contract.test.mjs      # hard-boundary logic; stubbed socket + clock, no network, nothing uploaded
node phase1/search.test.mjs                 # 70 — search helpers: coordinate parser, distance, escaping, matcher
node phase1/search.realdata.test.mjs        # 50 — the same helpers over REAL hub records captured 2 Nov
node phase1/search-ui.test.cjs              # 85 — Playwright; needs: python3 -m http.server 8899 --bind 127.0.0.1 in the clone
~/mother-earth/run.sh status                # scheduler state, pending upload, lock
~/mother-earth/sleeptest.sh                 # physical sleep test; captures pmset -g log alongside the sample
```
The browser suite drives the page's own 5-minute refresh with Playwright's clock, so the stale-result path runs
through production code and not a test hook. `ME.pairState(layer)` and `ME.searchState()` are the read-only
diagnostics it hangs on; both are reachable from the console on the live page.

| Evidence | Where |
|---|---|
| Sleep test report, hub snapshots at the time | `~/mother-earth/logs/sleeptest-20261102T035620Z.*` |
| Collector log (rotated, ~5 MB cap) | `~/mother-earth/logs/collector.log` |
| Hours 12/13 before/after, idempotency, scope | STATUS "Done 1 Nov (thread 4, 19:05 SAST)" |
| FIRMS CPU figures and their stated limitation | STATUS "Done 1 Nov (thread 4, 18:15 SAST)" |
| pmset ↔ collector gap correspondence | STATUS "Done 2 Nov" |
| Real hub records behind the search tests | `phase1/realdata/live-sample.json` (captured 2 Nov via the browser pane) |
| Reviews | `reviews/` |
| Source register | `REGISTER.md` |

Re-run of a repair: `POST /admin/reaggregate/ships?hour=YYYY-MM-DDTHH&key=<ADMIN_KEY>` previews; add `&apply=1` to write. Refuses with 409 when retained objects do not account for every logged attempt.

---

## 5. Product direction — a queue for Chad to choose from

Chad wants to add features one at a time. ~~Limited search~~ **shipped 2 Nov (thread 5)** — see §2. He has said the **solar terminator can follow**; it is the next pick unless he changes it. Nothing else below is started.

1. **Solar terminator** — computed client-side, labelled computed, not observed. No network cost. *Chad's stated next pick.*
2. **Satellites from CelesTrak TLEs** — MODEL tier, labelled "propagated from TLEs, not observed positions"; 12–24 h TLE fetch, browser-side SGP4, few hundred objects on phones. Register row first.
3. **Submarine cables** (TeleGeography) — needs a CC BY-SA share-alike decision before anything is committed.
4. **Chad's own asks** — plastic in the oceans, mining, solar farms. Each needs the observed-vs-modelled question answered per source before any build.

Deferred *inside* the shipped search, by design: country-boundary and place search (needs a geographic dataset specified first) and any coverage-cell result for a coordinate.

Parked with reasons recorded: aircraft (OpenSky correspondence), GFS wind (a model), GOES GLM lightning (needs a NOAA bucket pipeline), polar-cap imagery (measured blind in polar night).

---

## 6. Standing rules that outlast this thread

- **The promise, verbatim on the page:** "See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage."
- **The constitution** (START-HERE §2): live data and real things only; force no view; no politics, no drama; biased data chucked outright with the reason dated in REGISTER; a bridge carries its evidence grade; stable public IDs for things; the hub is the product and the page is a client; no fear or shock as a means.
- **Observations, analyses and models stay distinguishable.** Anything computed or propagated says so. Coverage is never inferred from collector uptime — `observed_fraction` is about sampling, not geography, and a silent cell is not an empty one.
- **No inferred causes, no invented zeros.** A value the source did not supply is "not provided"; a zero it did report says so. An hour nobody sampled is `absent` and nothing else may be written as `absent`.
- **Every source's commercial standing is in REGISTER before it goes live.** Attribution forms required by sources stay on the page.
- **$0/month target**, every non-zero line item named before it is incurred. Triggers: D1 at 80k writes/day (80% of the free allowance; measured usage ~10k/day), Workers requests at 70k/day. Bounded Mac storage.
- **No power-setting changes, no sleep prevention, no hardware purchases assumed.**
- **Measure, don't assume.** Every limit or cost claim gets measured on the real platform with the number and date written down. Baby steps, one key at a time; Chad pastes secrets himself.
