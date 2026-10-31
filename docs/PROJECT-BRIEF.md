# MOTHER EARTH — project brief and standing context

*Paste this whole block into the project's instructions / knowledge. Written 30 Oct 2026. Owner: Chad.*

---

## 1. What this is

**Mother Earth** (working name was "Earth Ops Room") is a single globe in a browser that shows the latest available observations of the planet from open live data sources, how each differs from its own comparison period, and where coverage is missing or stale.

The promise, in one sentence, which nothing on screen may exceed:

> **See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.**

## 2. Intentions

Why Chad is doing this, in his words and ours from the thread:

- The world has dozens of brilliant single-layer live sites (planes, ships, quakes, fires, weather, lightning, Wikipedia edits). Nobody puts them on one surface. Chad's instinct: "bring all this information together in real time as a view of the earth so people can see what is really happening." That instinct survived review with one correction: it shows what was *observed*, and is honest about what wasn't.
- The real value is not the dots but the comparison: the globe should be calm until something differs from its own baseline, and it must never imply a cause. "Nothing is faked, nothing is implied."
- It is an **open project**. Chad is not trying to hide anything. Credentials and keys may sit in this project's knowledge for working convenience. (Keep them out of the *public GitHub repo*, because scrapers burn free-tier quotas; the project is the sandbox, the repo is the showroom.)
- Cost target: $0/month on free tiers, every non-zero line item named.
- It's a personal instrument and a public demonstration first. Whether it becomes more than that is a hypothesis v1 tests.
- Chad's role: delivery lead and owner of all accounts, keys and manual steps. He reads code but does not write it; Claude writes the code and the click-by-click guides. Baby steps, checked at each stage.

## 3. Where things are

**On Chad's Mac:** `~/Documents/Mother Earth/`
- `SPEC-v0.3.md` — **current build spec.** Everything else defers to it.
- `SPEC-v0.2.md`, `SPEC.md` (v0.1) — history; v0.3 §0 explains what changed and why.
- `index.html` — working local prototype (v0.1 architecture: globe, quakes, Kp, Wikipedia, planes anonymous; later wired to a relay). Opens in Chrome from disk. Proof of concept, 15 minutes' work.
- `worker.js` + `SETUP.md` — the v0.1 Cloudflare relay and its guide. **Superseded** by v0.3's collector architecture. Do not deploy. Kept for reference.
- `PROJECT-BRIEF.md` — this file.
- `reviews/` — the five review documents from GPT and the other Claude thread, verbatim.

**GitHub:** github.com/TheOneTheOnlyTheChad — repo not yet created. Planned name: `mother-earth` (or `earth-ops`). GitHub Pages will host `index.html`.

**Cloudflare:** Chad has an account (used for crypto and other things). Nothing deployed for this project yet.

**Accounts/keys Chad already holds:** NASA FIRMS map key, OpenSky Network account (needs an API client created for client ID + secret), aisstream.io key (GitHub sign-in), Cloudflare, GitHub. *(Values go in a separate `KEYS.md` in the project if Chad wants them to hand; never in the repo.)*

## 4. Current state (30 Oct 2026)

- **Phase 0 done:** local prototype works. Seen running: NASA imagery skin, 41 quakes live, Kp gauge, 725 Wikipedia edits counted, ticker. Planes blocked on anonymous OpenSky (expected). Fires needed a key.
- **Spec at v0.3** after two review rounds (five reviews total). Reviewers converged; diminishing returns. **Decision rule agreed:** if the next round returns fewer than five material points, v0.3 is the build spec and phase 1 starts.
- **Nothing deployed.** No repo, no Worker, no R2, no D1.

## 5. Architecture (v0.3 summary; full detail in the spec)

```
viewer ──▶ GitHub Pages (index.html) ──GET──▶ Worker /snapshot/<layer> ──read──▶ R2 (latest + 90-day archive)
viewer ──direct──▶ NASA GIBS imagery tiles only (everything else goes through collectors)
Collector Workers (cron, per layer) ──▶ USGS, NOAA SWPC, OpenSky, FIRMS, Wikimedia … ──▶ R2 snapshots + coverage records
Ships collector (Durable Object | external free process | cron sampler — decided by a measured test) ──WSS──▶ aisstream
Nightly batch (02:00 UTC) ── reads 24 h of R2 ──▶ D1 hourly cell aggregates (zeros preserved via coverage records)
```

Load-bearing rules:
1. **Viewers never collect.** Upstream load is set by the schedule, not the audience.
2. **Activity and coverage are separate properties** per cell. Count + coverage grade (adequate / partial / unknown) with evidence. Comparisons run only on cells observed throughout the window.
3. **Three freshness checks**, independent: source observation time, collector retrieval time, coverage. HTTP 200 with stale positions still expires them. Events (quakes) and positions (ships) are treated differently.
4. **Descriptive comparisons first.** Probabilistic highlights only after a held-out validation with a measured map-wide false-highlight rate. Poisson is a candidate, not the rule.
5. **Nothing is implied.** A highlight renders only with its sentence, source and basis. The sentence template cannot emit a cause.
6. **Choices are visible.** A panel lists every feed, tier, threshold, window, cell size and stale rule. Viewers may make the globe quieter or louder, never less honest: staleness thresholds, minimum counts, dedup, coverage handling and the template are not adjustable.
7. **Raw snapshots are the asset.** Retained in R2; aggregates are derived and re-derivable.

## 6. Roadmap and Chad's manual work

| Phase | Scope | Chad does |
|---|---|---|
| 1 — prove three | Collectors for USGS, SWPC, OpenSky, FIRMS → R2; nightly batch → D1 from day one; `/snapshot/*` Worker; page on Pages reading snapshots; activity/coverage rendering; status sentence; legend; imagery date on globe; read-only Choices panel; source register fully dated for five sources; all acceptance checks run | Cloudflare: Worker, R2 bucket, D1 database, cron triggers, 3 secrets (OpenSky ID, OpenSky secret, FIRMS key). GitHub: repo + Pages. Read and date five licence pages. |
| 2 — ships | Runtime test (DO cost/continuity) → chosen runtime; Class A+B; interruption log | aisstream secret; maybe a Render/Fly account |
| 3 — descriptive comparisons | Numeric history per cell in inspector + Changes panel; Choices adjustable | — |
| 4 — validated highlights | Held-out validation per layer; enable only on pass | — |
| 5 — breadth | Wikipedia place activity (article coords), aurora (model), OpenAQ, IODA, cyclones, satellites (model) | OpenAQ key |
| 6 — optional | Blitzortung receiver (~€250, Cape Town is a network gap), custom domain, flat-map polish | kit, domain |

## 7. Data sources

### 7.1 Feeds we will plot (with endpoints)
| Layer | Source | Access | Notes |
|---|---|---|---|
| Earthquakes | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson` | open, no key, CORS | health: `metadata.generated`. Keep magnitude type (mb/ml/mw). |
| Geomagnetic Kp | `https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json` | open | first row is a header. Index, not a map layer. |
| Aurora oval | `https://services.swpc.noaa.gov/json/ovation_aurora_latest.json` | open | **model** tier |
| Imagery skin | NASA GIBS WMS `VIIRS_NOAA20_CorrectedReflectance_TrueColor` (use previous day) | open | Suomi NPP ended 2 Nov 2026; NOAA-20/21 continue. Date stamped on the globe. |
| Fires | `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/VIIRS_NOAA20_NRT/world/1` | free key | thermal detections per satellite pass, not a fire census; cloud hides detections. 5,000 req/10 min. |
| Aircraft | OpenSky `https://opensky-network.org/api/states/all` (+ bbox); OAuth2 at `https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token` | free account | 4,000 credits/day; world pull = 4 credits; bbox cost varies with area. Research/non-commercial terms. Collector auto-degrades cadence at 80%. |
| Ships | aisstream.io `wss://stream.aisstream.io/v0/stream` | free key (GitHub login) | browsers can't connect; 3 connections/key; Class A and B position reports; terrestrial AIS doesn't cover open ocean. |
| Wikipedia place activity | `https://stream.wikimedia.org/v2/stream/recentchange` (SSE) + `prop=coordinates` on edited articles | open | measures "editing activity about this place". IP geolocation is dead (Wikimedia temporary accounts hide IPs). |
| Air quality | OpenAQ v3 | free key | uneven station coverage |
| Internet connectivity | IODA (candidate, observation tier); Cloudflare Radar (corroboration) | open / keyed | endpoint, terms, granularity comparison pending |
| Cyclones | NOAA NHC / JTWC GeoJSON | open | position = observation; cone = model |
| Satellites | CelesTrak TLEs + satellite.js | open | **model** tier; satellitemap.space is the reference UI; stuffin.space is dead (code open-source: github.com/jeyoder/StuffInSpace) |
| Lightning | Blitzortung | **locked** | raw data only for receiver operators; LightningMaps.org is the public face |
| Reporting | GDELT GEO 2.0 | out of v1 | news mentions, not observations; separate tier if ever |

### 7.2 Explicitly not scraped
nullschool (wants licensing), Flightradar24, MarineTraffic, Blitzortung, radio.garden (unofficial API only). "Locked means locked."

### 7.3 The original 50 sites (liveness checked 27 Oct 2026)
All alive. Moved/changed: globalforestwatch.org → **globalnaturewatch.org** (WRI rebrand 21 Sep 2026); eyes.nasa.gov → science.nasa.gov/eyes; apod.nasa.gov → science.nasa.gov/apod; radiooooo.com → app.radiooooo.com; observablehq.com classic notebooks → old.observablehq.com. Stale: internetlivestats.com (2014 content), virtualvacation.us (no activity since 2021). Notes: gutenberg.org ~79,700 books; davidrumsey.com 151k+ maps; wikiart.org homepage glitchy; data.worldbank.org migrating to Data360.

Full list: zoom.earth, flightradar24.com, marinetraffic.com, windy.com, lightningmaps.org, earthquake.usgs.gov, submarinecablemap.com, globalforestwatch.org, worldometers.info, internetlivestats.com, thetruesize.com, oldmapsonline.org, davidrumsey.com, openstreetmap.org, window-swap.com, virtualvacation.us, mapcrunch.com, atlasobscura.com, neal.fun, htwins.net/scale2, eyes.nasa.gov, stellarium-web.org, apod.nasa.gov, images.nasa.gov, pudding.cool, ourworldindata.org, gapminder.org, informationisbeautiful.net, data.worldbank.org, data.tuik.gov.tr, archive.org, gutenberg.org, openlibrary.org, loc.gov, europeana.eu, dp.la, artsandculture.google.com, rijksmuseum.nl, wikiart.org, publicdomainreview.org, openculture.com, metmuseum.org, musicmap.info, radiooooo.com, listen.hatnote.com, wikipedia.org, timeanddate.com, sciencedaily.com, arxiv.org, observablehq.com.

These are **drill-down / link-out** sources in the product, not plotted layers.

### 7.4 The 26 extras (checked 27 Oct 2026)
Alive: globe.adsbexchange.com (community/paid API), opensky-network.org, spaceweather.com, swpc.noaa.gov (+ services.swpc.noaa.gov JSON), satellitemap.space, earth.nullschool.net, blitzortung.org, cameronsworld.net, radio.garden, rcmap.hatnote.com, worldview.earthdata.nasa.gov (GIBS WMTS/WMS), firms.modaps.eosdis.nasa.gov, globalfiredata.org, fred.stlouisfed.org, obis.org (api.obis.org), gbif.org (api.gbif.org), datasetsearch.research.google.com, theuselessweb.com (original; ignore the .online clone), wiby.me (JSON at /json), lowbackgroundsteel.ai, aisstream.io, tidesandcurrents.noaa.gov.
Dead: **stuffin.space** (down since ~May 2026, domain for sale).
Moved: marginalia.nu → **marginalia-search.com**; webbtelescope.org / hubblesite.org → use science.nasa.gov galleries.

## 8. Review history (all five in `reviews/`)

- **Round 1 on v0.1** (GPT + Claude thread): overstated promise; missing data could look like absence; Cache API doesn't coalesce misses so viewers were triggering collection; one anomaly formula was wrong; Wikipedia IP geolocation is dead; ticker vs status sentence; GDELT conflicts with "not a news aggregator"; KV write limits; start baselines day one; "Choices are visible" panel (adopted whole).
- **Round 2 on v0.2** (GPT + Claude thread + a third): activity and coverage must be separate; 200-with-stale-data must expire; "viewers never collect" contradicted direct browser calls; Poisson is a candidate not a rule; preserve zeros via coverage records; DO cost/continuity must be tested (outbound WebSockets don't hibernate); register verification split into five checks; per-layer persistence; imagery date on the globe; Choices read-only in phase 1; categorical vs numeric fields; magnitude type.
- **Calls made where reviewers disagreed:** no scrolling ticker but one generated status sentence; GDELT out; staleness and minimum counts not user-adjustable ("quieter or louder, never less honest"); DO unverified for free tier, phase 2 opens with a measurement; IODA candidate, Radar corroboration, decision deferred until terms compared.

## 9. Operating rules for this project

- v0.3 is the spec. Propose changes as a v0.4 diff with reasons, don't drift.
- Every source enters the UI only with all five register checks dated (endpoint, access, terms, sample, coverage).
- Code is written by Claude; every deploy step comes with a click-by-click guide for the Cloudflare and GitHub dashboards, no terminal required.
- Open project: keys may live in project knowledge; never in the public repo.
- Prefer measuring over assuming (bbox credit cost, DO duration, phone cold load).
- When something can't be verified from inside a sandbox (network allowlists block most hosts), say so and give Chad the exact URL to check in a browser.

## 10. Immediate next steps

1. Chad creates the Claude project "Mother Earth", pastes this brief, attaches `SPEC-v0.3.md` and the `reviews/` files.
2. Optional: one more review round on v0.3. If < 5 material points come back, build.
3. Phase 1, step 1: Claude writes the collector Worker (USGS + SWPC + OpenSky + FIRMS → R2) and the nightly batch, with the dashboard guide. Chad creates the R2 bucket, D1 database and three secrets.
4. Phase 1, step 2: page rewritten to read `/snapshot/*`, with activity/coverage rendering and the three freshness checks.
5. Repo + Pages. First public URL.
