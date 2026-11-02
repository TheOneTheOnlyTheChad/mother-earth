# Mother Earth — handover to thread 6 (2 Nov 2026)

Read `START-HERE.md` (§2 is the constitution; §5a testing; §5b the ships duration contract), then `STATUS.md`. This file is the index: what is deployed, what is finished, what is genuinely unverified, and what Chad might build next.

---

## 1. State

| | |
|---|---|
| Repo | `github.com/TheOneTheOnlyTheChad/mother-earth`, `main` at **`9e690be`**. Commit straight to main, no branches. AGPL-3.0. |
| Hub (Cloudflare Worker) | **collector `0.2.1`** · `https://mother-earth.chadoberholzer.workers.dev` · `/`, `/status`, `/cells/<layer>`, `/snapshot/<layer>`, `POST /ingest/<layer>`, `POST /admin/reaggregate/ships`, `GET /admin/run/<job>` |
| Page (GitHub Pages) | `https://theonetheonlythechad.github.io/mother-earth/` · assets at `?v=202611021500` — **bump on every page change, in `index.html` and `sources.html`** |
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
- **Day/night overlay (2 Nov, thread 5).** The first **computed** (non-observed) thing on the page. Optional switch at the end of Explore, off on load, "Day/night now — computed", with the UTC calculation time in the panel and the legend. Geometric boundary only; twilight deferred. Never touches `state`/`points`/`pmeta`/`usable()` or globe.gl's data channels, and runs on its own one-minute timer rather than the network poll. Subsolar point from the Astronomical Almanac / USNO low-precision coordinates (a US Government work; **no runtime dependency**). **Dependency on globe.gl internals is deliberate and recorded**: no global `THREE`, so constructors are harvested lazily off live objects, the version is **pinned at 2.45.0** and both suites assert the page and the test agree on it; a missing constructor makes the overlay **refuse** (toggle reset, plain explanation, globe untouched). Render channel chosen by spike — see `phase1/SPIKE-terminator.md`, which also records that globe.gl rotates its globe mesh by −π/2 and that omitting it put the shading 90° out.
  **Three limits kept apart:** solar maths ≤0.0124°, texture quantisation ~0.35°, one-minute staleness up to 0.25° — so the *drawn* boundary can sit ~0.6° from the instantaneous geometric one, and that is itself ~0.83° from observed sunrise. Reference agreement is not a statement about what is drawn.
- **Limited search (2 Nov, thread 5).** One collapsible **Explore** panel, closed on load, replacing the Find card and holding the search plus the two unchanged snapshot-jump buttons. Searches only loaded records: USGS descriptions, vessel names and MMSIs, and latitude/longitude typed in that order. Fires and forest publish no text and are never text-searched (fires do join a coordinate search). A coordinate always offers "Go to", then records within 250 km nearest first, 12 max with the true total; the radius is stated as a choice for this box, never as a coverage boundary. Results are revalidated per layer against run identity, visibility, freshness and the pairing rule, and refused with the reason rather than opened. Ships' observation time, receipt time and sample end are kept distinct. Coordinate tokens are validated whole — a number that cannot be read is refused by name, never repaired — and with no WebGL the Go-to row says the globe is unavailable instead of claiming a movement. Full detail in STATUS "Done 2 Nov (thread 5)".
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
| 2 | ~~Forest 24 h usage~~ **CLOSED 2 Nov** | Measured: **48 invocations/day** ✓, **575 outbound subrequests** (287 2xx + 288 3xx — every GFW query is a redirect plus a response, so the recorded ~290 expectation was out by 2×), **0 GFW 4xx/5xx**, 0 worker errors. Sweep 293/559, pending 0, err 0. **Initial 24-hour usage check COMPLETE**; window ≈1 Nov 08:00 → 2 Nov 08:00 UTC (first full day), workload 48 invocations / 288 cell queries / 575 subrequests. Not a steady-state figure; first full sweep not yet complete. | — |
| 3 | **FIRMS CPU profiling and attribution** — *2 Nov: still not attributable.* | Aggregate CPU is P50 2.95 / P90 46.09 / P99 81.17 / P999 90.15 ms with 0 CPU-limit errors, rising with file size through the UTC day (~310 ms at 16:00, input 2.4 MB / 28,924 records). **This does not establish that FIRMS routinely consumes 5–8× its allowance** — the Free-plan event log has no per-invocation CPU field. **2 Nov: checked. Observability IS enabled (Free, 200K events/day), but an event's `$workers` block carries no `cpuTimeMs`/`wallTimeMs`, so per-invocation CPU is not exposed to us.** Re-measured aggregate: P50 3.67 / P90 57.63 / P99 93.08 / P999 103 ms, 0 CPU-limit errors; **The earlier "FIRMS is 2%, so it is the P98+ tail" reasoning is withdrawn as wrong**: share of invocations says nothing about position in the duration distribution, and at ~4,710/day the P90 band is the slowest ~471 invocations while FIRMS supplies at most 96 — so **FIRMS alone cannot explain the elevated P90**. No CPU is attributed to any job. **Traces checked 2 Nov: available on Free, simply Disabled ("Enable Traces" button).** Settings → Observability offers **"Include Invocation logs"** and **"Persist traces"**, each with a sampling %; there is no dedicated CPU profiler. Next: enable invocation logs and/or traces and read whether the invocation record carries CPU time — **both are Chad's settings changes** and both draw on the 200K events/day budget. **Disabling the `*/15` FIRMS trigger to compare percentiles is ruled out** (Chad, 2 Nov): a real data gap is too high a price for an inference. Do **not** add `Date.now`/`performance.now` timers — deployed Worker clocks freeze between I/O. | No, but decide before adding another heavy parse |
| 4 | ~~GML retrieval integrity~~ **CLOSED 2 Nov, one residual risk named** | gml.noaa.gov subrequests failed at 13% over 24 h. Confirm a failed retrieval preserves the previous value with its original observation and retrieval times and an honest failure status. **2 Nov measured: 58/58 CO₂ runs `ok` since 31 Oct; 46 × 2xx and no 4xx/5xx from gml.noaa.gov in 24 h (the 13% has not recurred); `writeDown()` provably leaves `latest/co2.json` untouched so the previous value keeps its original observation and retrieval times and the page shows 'unknown — collector reported down'. For 2026-10-30 there is **no valid value in our parsed source series**, which is otherwise contiguous across 366 days; whether the row is omitted at source, present but flagged (−999.99), or dropped by our parsing is **not yet distinguished — raw-source inspection still needed**.** Residual risk still open: a **truncated 200** would be parsed to the last complete row and published honestly but with an older date, masking the truncation — verify Workers' behaviour on a cut body, or add a row-count/content-length sanity check. | No |
| 5 | **Physical mobile testing** | The Galaxy as an always-on collector: Termux + Node, battery optimisation off, 48 h screen-off logging expected vs successful collections, then a Wi-Fi interruption and a reboot recovery test. Second candidate: Xiaomi Mi TV Stick. **No hardware purchase.** | No |

Nothing in this list blocks starting a feature. Items 1 and 5 are about collection reliability; 2–4 are measurement and integrity.

**Synthetic ≠ hardware.** The duration-contract tests prove the guard's logic. They do not verify behaviour on a real suspend, and item 1 stays open regardless of them.

---

## 4. Test commands and evidence locations

```
node phase1/duration-contract.test.mjs      # hard-boundary logic; stubbed socket + clock, no network, nothing uploaded
node phase1/search.test.mjs                 # 111 — search helpers: coordinate parser (incl. leading decimals
                                            #       and malformed-token refusals), distance, escaping, matcher
node phase1/search.realdata.test.mjs        # 50 — the same helpers over REAL hub records captured 2 Nov
node phase1/search-ui.test.cjs              # 104 — Playwright; needs: python3 -m http.server 8899 --bind 127.0.0.1 in the clone
node phase1/solar.test.mjs                  # 26 — subsolar vs astronomy-engine, poles, date line, stated assumptions
node phase1/terminator-ui.test.cjs          # 19 — day/night ACCEPTANCE gate: one page load, 6-min watchdog
node phase1/terminator-behaviour.test.cjs   # 42 — day/night behaviour: cadence, toggling, rotating globe,
                                            #      no-WebGL, failed harvest, phone. ~22s, 6-min watchdog.
~/mother-earth/run.sh status                # scheduler state, pending upload, lock
~/mother-earth/sleeptest.sh                 # physical sleep test; captures pmset -g log alongside the sample
```
The browser suites drive the page's own timers with Playwright's clock, so the stale-result and recompute paths
run through production code and not a test hook. **Both terminator suites carry a hard watchdog that FAILS rather
than hangs** — an indefinite test is a defect in itself. Use `page.clock.fastForward()`, never `runFor()`:
`runFor` fires every intermediate animation frame, so with globe.gl's render loop a two-minute jump makes the
software renderer draw thousands of globes (measured: >900 s versus 22 s for the identical assertions). globe.gl and the test-only `astronomy-engine` and `pngjs`
are served from `/home/claude/spike/node_modules` because the container cannot reach unpkg; set up with
`cd /home/claude/spike && npm i globe.gl@2.45.0 astronomy-engine pngjs`. Pixel cases emulate reduced motion so the
globe does not rotate between the before and after frames; behaviour while it *is* rotating is covered separately
in the behaviour suite, asserting on state rather than pixels. `ME.pairState(layer)` and `ME.searchState()` are the read-only
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
