# Mother Earth — comparison with similar sites (5 Nov 2026)

Prepared by Claude for Chad (thread 14). Sources: each site's own pages, docs or launch posts, read 5 Nov 2026 (links at the end). **I did not open and use every live site.** Where a site's page did not say something (licence, cadence, funding), it is marked *not stated*, not guessed.

**Revision 2 (5 Nov, after GPT's review):** §1 and §5 claims narrowed to what the evidence supports; licence findings for Climate TRACE, Global Plastic Watch, Global Fishing Watch and Destination Earth corrected from their primary pages; model/analysis/forecast distinguished per product; §3c split into "not on the current globe" vs "conflicts with the constitution"; replay limited to what is actually retained. This is a set of references and possibilities, not a checklist or a definition of what the project becomes. Changes are listed in §7.

## 1. Bottom line

- **Mother Earth makes coverage, missing information, timestamps and evidence type explicit parts of the current experience.** We have not established whether another platform combines those practices the same way; this was not an exhaustive market search. Plenty of sites put live feeds on a globe, and some carry far more feeds than we do. Others also disclose limits in their own ways (e.g. JRC's surface-water explorer documents valid-observation counts; the IPCC Atlas shows robustness/uncertainty).
- The sites read split into three families:
  - **A. Live "everything" globes and intelligence dashboards.** These are the closest in look. Their stated aims are "watch live" or *situational awareness*, and several are openly geopolitical or commercial.
  - **B. Earth-science visualisers.** These are mostly **models and forecasts** rendered beautifully, or science communication from the agencies.
  - **C. Thematic accountability platforms** covering forests, fishing, emissions, energy and waste. Their data is often excellent, and each states a specific goal. A stated goal does not by itself settle whether a dataset is usable; each dataset is judged on its own method and checkability.
- **Closest in features: overwatch.earth** (GPT's comparison). Same family of open feeds, about 34 layers, plus webcams and comments.
- **Closest as a business: World Monitor.** Same AGPL-3.0 licence, free view, paid Pro and API, "hub is the product". The opposite stance on editorial: it publishes AI risk scores, country instability indices and forecasts, and conflict and markets are core.

## 2. The sites

### A. Live globes / intelligence dashboards

| Site | What it shows | Where the data comes from | What it seems to be after |
|---|---|---|---|
| **overwatch.earth** (Tuxxin) | ~34 feeds on one globe, grouped Transit 6 · Environmental 14 · Digital 5 · Curiosity 9. Layers drop off when their source goes quiet. 24-h replay on moving layers. Per-feed pages, comments on every map. | Aircraft adsb.fi · military aircraft adsb.lol · ships AIS (provider not named) · quakes USGS + EMSC · fires FIRMS · lightning Blitzortung · aurora NOAA · buoys NOAA NDBC · air quality OpenAQ · NWS alerts · volcanoes Smithsonian · GDACS · NASA EONET · cables TeleGeography · outages Cloudflare Radar + IODA · PeeringDB · BGP (their own WorldIP) · satellites/ISS CelesTrak · Starlink · launches Launch Library 2 · NASA DSN · Wikipedia edits · **webcams ("tens of thousands", source not named)** · iNaturalist · eBird · fireballs NASA CNEOS · Amtrak, Transitland, OurAirports | "Watch the planet live, on one globe." Free, no login; business model not stated. Next stated step: **a multi-tenant system so people build their own globes from their own data**. Engagement through comments and discussions. |
| **World Monitor** (worldmonitor.app, koala73) | Geopolitical, market, energy, shipping, infrastructure, cyber and hazard signals on one map, flagged "when they converge". Layers include conflicts, protests, military bases, nuclear facilities, critical minerals, pipelines, cables, AI datacentres, ships with chokepoints, quakes, fires, weather alerts, day/night, **live webcams**, **Country Instability Index** and **Country Resilience Index**, AI forecasts. | 38 APIs + ~150 RSS news domains. ACLED, UCDP, GDELT (conflict) · OpenSky, Wingbits (paid), FAA (aviation) · custom AIS relay, NGA MSI (maritime) · USGS, FIRMS, NOAA, NWS · Finnhub, Yahoo, CoinGecko, FRED, Polymarket (markets) · Feodo, URLhaus, AlienVault, AbuseIPDB (cyber) · Cloudflare Radar Enterprise · UNHCR, HDX, WorldPop, World Bank · EIA · LLMs via Groq/OpenRouter. | Mission: make "credible, real-time global intelligence" available to anyone, not only governments, funds and newsrooms. Claims 2 M+ users. **Free dashboard; Pro from $39.99/month**, Pro Business, API plans with redistribution rights, Enterprise (SSO, white-label, air-gapped). **AGPL-3.0**, trademark-protected name. AI briefs, risk scores and probabilistic forecasts with a public accuracy scorecard. |
| **Worldview** (rblaschke-lab, GitHub Pages) | Conflict zones and war fronts, ISS/AIS/Starlink/launches, regime-type and bloc maps, cables, datacentres, nuclear plants **and arsenals**, fires, volcanoes, quakes, radiation, internet outages, solar activity. AI anomaly alerts every 5 min. Scenario presets ("Taiwan Escalation", "Red Sea Crisis", "Global Nuclear Risk"). | ACLED, UN OCHA, NATO SITREP, NASA GIBS + FIRMS, AIS, CelesTrak, Launch Library 2, Freedom House, SIPRI, TeleGeography, IAEA PRIS, WNA, Smithsonian GVP, USGS, Safecast, OpenSky; Esri tiles. | A free "passion project" giving "real-time intelligence" to anyone. Crisis-framed. |
| **Planet Pulse** (dacrab, MIT) | One event feed: USGS quakes, r/worldnews, ISS, Open-Meteo for 4 cities, top-20 crypto, soccer. "Correlations" such as quakes near monitored cities. | As listed. | A developer showcase / personal dashboard. |
| *Also surfaced, not opened:* Shadowbroker, OSIRIS ("open-source Palantir"), Argus, GeoPulse, Earth Pulse Now, SpaceSphere | — | — | The same OSINT-dashboard genre. Several brand themselves openly as intelligence tools. |

### B. Earth-science visualisers

| Site | What it shows | Where the data comes from | What it seems to be after |
|---|---|---|---|
| **earth.nullschool.net** | Animated wind, temperature, humidity, CAPE and pressure; ocean currents, SST + anomaly, waves, coral bleaching alert; aerosols and chemistry (CO, CO₂, SO₂, NO₂, dust, PM2.5/PM10); aurora; UV; active fires. | GFS (3-hourly) · OSCAR + CMEMS (daily) · OI SST / OSTIA / RTGSST · WAVEWATCH III · NOAA Coral Reef Watch · GEOS-5 + CAMS · OVATION · CPC UVI · FIRMS VIIRS. | Show the planet's systems in motion. **Mixed product families, to be classified per product:** GFS and WAVEWATCH III = forecast model; CMEMS = analysis + forecast; GEOS-5 / CAMS = model forecast/analysis; OSCAR = observation-derived current estimates; OISST / OSTIA = observation-based analyses; FIRMS = observed. The site says weather and ocean data "are generated from numerical models" and gives no accuracy guarantee. It admits a **+32 ppmv CO₂ offset it added "for illustration… not scientifically valid"** before 2017. Fires are the only clearly observed layer. |
| **Zoom Earth** | Live geostationary imagery, NASA HD imagery twice daily, radar, wind/temperature/rain forecasts, tropical storm tracks, fires and heat spots (daily). | GOES, Meteosat, Himawari, NASA Aqua/Terra via GIBS · ICON + GFS models · NHC, JTWC, NRL, IBTrACS · NIFC, CIFFC, CEMS, EFFIS, GDACS, FIRMS. | A consumer weather and storm map with a free app. |
| **NASA Eyes on the Earth** (JPL) | NASA's Earth satellites in 3D, eight "vital signs" (CO₂, CO, sea level, soil moisture…), event snapshots. | NASA missions (OCO-2, Aqua, Landsat, SWOT, NISAR…). OCO-2 data is reprocessed for months before it appears. | Science communication: get to know the planet and NASA's missions. |
| **Copernicus Climate Pulse** (C3S/ECMWF) | Daily global surface-air and sea-surface temperature and anomalies, maps back to 1979, series back to 1940. | **ERA5 reanalysis** (a model constrained by observations), ~2 days behind; anomalies vs 1991–2020. | Make the climate's state readable at a glance; data downloadable. |
| **Destination Earth** (EU: ECMWF, ESA, EUMETSAT) | Digital twins of the Earth system: weather extremes and climate "what if" scenarios decades ahead. | Their own high-resolution simulations. | Inform adaptation policy. ESA (Feb 2026): "DestinE is a tool that can be used by all" — **general-public registration for selected services**; GPT reports advanced access carries additional conditions (DestinE access-policy page, not reachable from this session). Not established that every digital-twin product is open. This is the space our future *Possible futures* view would draw on. |

### C. Thematic accountability platforms

| Site | What it shows | Where the data comes from | What it seems to be after |
|---|---|---|---|
| **Global Forest Watch / Resource Watch** (WRI) | GFW: deforestation alerts and tree-cover change. RW: "hundreds of datasets" across climate, water, food, cities, instability, some near-real-time. | Satellite alerts (GLAD, RADD — **we already use GFW integrated alerts, CC BY 4.0**) plus partner data. | Sustainability decisions; layering datasets "so users can see how issues connect". The nearest in spirit to Chad's *bridge across fields*, but curated toward WRI's goals. |
| **Global Fishing Watch** | Apparent fishing activity, dark-vessel radar detections, vessel identity, encounters/transshipment, risk insights. | Public AIS + government VMS (via partnerships) + satellite radar. | Monitor human impact on the ocean; enforcement and research. **Standard API licence is non-commercial**; FAQ: commercial terms are not public, but "GFW may be open to creation of custom licenses in clearly mission-aligned circumstances." |
| **Climate TRACE** | GHG and pollutant estimates for 745 M+ sources (asset level for sectors covering ~75 % of emissions), monthly, ~2-month lag. | 300+ satellites, 11,000+ sensors, ML. Current figures are **estimates**; the observed vs modelled split is not stated per figure. | "Make climate action faster and easier." Founded by Al Gore's coalition (press). **Terms: emissions data and metadata CC BY 4.0 (commercial use allowed with attribution and noting changes), except listed external datasets (EDGAR, FAOSTAT, E-PRTR, US EPA FLIGHT/LMOP, Canada GHGRP, Israel PRTR, ownership data) which keep their own terms.** |
| **Global Energy Monitor** | Trackers for coal/gas/oil plants and extraction, **coal mines, iron-ore mines**, **solar, wind**, hydro, nuclear, steel, cement, ownership and finance. | Researcher-compiled and verified (desk research and partners), **not direct observation**. | An "open access" registry for a sustainable energy future. Licence and commercial terms not on the About page. |
| **Global Plastic Watch** (Minderoo + Earthrise) | Land-based plastic waste sites, initially 25 countries (SE Asia, Australia, high-emission countries). | ESA satellite imagery + ML. | Find undocumented dumps, guide waste investment, keep plastic out of rivers and oceans. Methodology page: **"Data is made accessible through an API endpoint under CC BY-NC 2.0 Licence"** (non-commercial); the API was described as forthcoming. |
| *Orbital-only viewers* (satellitemap.space, LeoLabs, Stuff in Space) | Satellites and debris on a globe. | CelesTrak / Space-Track / LeoLabs' own radar. | Space-awareness, and LeoLabs' commercial radar. *Not opened this round.* |

## 3. What they have that we don't

Sorted by how it sits with the constitution (observed data only, no forced view, biased sources removed, commercial standing in the register).

### 3a. Observed, plausibly fits — candidates for later (each needs the usual register, licence and coverage work)
| Gap | Who has it | Source to check | Note |
|---|---|---|---|
| **Lightning** | overwatch.earth | Blitzortung (community network); NOAA GOES GLM | Already parked. Blitzortung's terms restrict use; check before anything else. |
| **Aircraft** | overwatch.earth, World Monitor, Worldview | adsb.fi / adsb.lol / OpenSky / ADS-B Exchange | Parked on the OpenSky feeder condition. adsb.fi/adsb.lol are community feeds, so their terms need reading. |
| **Moored ocean buoys** | overwatch.earth | NOAA NDBC | Complements our drifting buoys (we show drifters only). |
| **Air quality (ground stations)** | overwatch.earth, nullschool (modelled) | OpenAQ | Observed, but coverage is very uneven. A strong case for our "unknown coverage" honesty. |
| **Volcanoes** | overwatch.earth, Worldview | Smithsonian GVP weekly report | A weekly report, so "dated", like plastic. |
| **Sea-surface temperature** | nullschool, Climate Pulse | NOAA OISST, OSTIA (analyses, not raw) | An analysis product, so it would carry an analysis label, not Observed. |
| **Global temperature anomaly** | Climate Pulse | ERA5 (reanalysis) | Same: a reanalysis, so it would be labelled as such. |
| **Fishing activity / dark vessels** | Global Fishing Watch | GFW API | **Standard licence non-commercial**; custom licence possible if mission-aligned. Would need that conversation before any use alongside the $1/year plan. Chad's call. |
| **Plastic waste on land** | Global Plastic Watch | GPW dataset | Satellite + ML detection. Pairs with our ocean samples (land source vs sea samples). **API data CC BY-NC 2.0** (non-commercial); intended use to be checked against it. GPT adds EMODnet, LITTERBASE and Plastic Adrift as further plastic references (samples, biology, modelled transport). |
| **Biodiversity sightings** | overwatch.earth | iNaturalist, eBird, GBIF | Observed by people, so coverage follows where people are. Every cell would need a heavy honesty line. |
| **Fireballs / meteors** | overwatch.earth | NASA CNEOS | Small, observed, fun. |
| **Internet outages, submarine cables** | overwatch.earth, World Monitor, Worldview | IODA, Cloudflare Radar; TeleGeography | Cables were already queued (CC BY-SA decision). Outages are "Digital", a different field from the planet. |

### 3b. Not direct observation — shown only with the specific product's own class (forecast, analysis, reanalysis, observation-derived estimate), never as Observed
- **Wind, weather, ocean currents, waves, aerosols** (nullschool, Zoom Earth). Beautiful and popular. The class depends on the exact product (see the nullschool row: GFS forecast, CMEMS analysis/forecast, OSCAR observation-derived, OISST analysis). Each would be labelled per product, not per provider. Parked, as decided in the 1 Nov triage.
- **Aurora oval** (overwatch.earth, nullschool). OVATION is a 30-min forecast model. Our Kp is the observed index.
- **Facility emissions** (Climate TRACE). Estimates. Useful as "what the source estimates", labelled as theirs.
- **Possible futures** (Destination Earth). Not publicly open yet. CMIP6 / AR6 sea level remain the planned public sources.

### 3c. Not on the current observation globe (some may belong on a later page)
Two different reasons, kept apart:

**Conflicts with a standing line Chad set (applies to every page unless he changes it):**
- **Webcams and live video** (overwatch.earth, World Monitor). Chad's no-surveillance line.
- **Our own verdicts:** AI risk scores, instability indices, our own forecasts, "convergence" alerts (World Monitor, Worldview). The constitution says the site shows and does not tell. *Distinction (GPT):* exposing **someone else's** published interpretation as a labelled, sourced record is different from producing our own; whether later pages carry such records is Chad's call.

**Out of scope for this globe, not ruled out for the wider project:**
- **News** (World Monitor, Planet Pulse). Chad's wider vision includes news and other fields; a news page later is not excluded by this comparison.
- **Conflict, military, regime types, blocs, scenario presets** (World Monitor, Worldview). Not observations of the physical planet, and the classifications are contested; any later treatment would need its own evidence rules.
- **Markets, crypto, prediction markets.** Not observations of the planet.
- **Comment threads on the map** (overwatch.earth). Not an observation; a community feature, if ever, belongs off the globe.

### 3d. Views and features we don't have
- **Replay / time slider** (overwatch.earth: 24 h on moving layers; Climate Pulse: decades). **Bounded by what we retain:** D1 hourly cell counts (fires, quakes, ships), Kp, CO₂ daily and forest daily could support historical *activity* views; raw files and snapshots expire after 48 h, so **individual ship tracks, drifter tracks and orbital playback cannot be reconstructed** from what is kept. Anything more needs a retention decision first (cost named).
- **Per-feed explainer pages** (overwatch.earth). Our Sources & Details covers this on one page. Per-layer pages would also give each layer a shareable URL.
- **Public API** (World Monitor, GFW, Climate TRACE). Ours exists (the hub) but is undocumented and unpromised. It matches "the hub is the product".
- **Build-your-own globe** (overwatch.earth's next step). The multi-tenant idea.
- **Anomaly vs baseline maps** (nullschool SSTA, Climate Pulse). Our phase-3 comparisons will do this from our own history.
- **Animated flow fields** (nullschool). Visual delight we don't have; only honest with a model label.

## 4. What they say they're trying to achieve, and what their design does (pattern)
Motives are not established; these are stated aims plus observable design.
1. **"Watch it live"** (overwatch.earth, Planet Pulse, Zoom Earth): stated aim is live viewing; design favours many layers and motion. overwatch.earth drops a layer when its source goes quiet.
2. **Situational awareness / intelligence** (World Monitor, Worldview, the OSINT clones): stated aims are intelligence for anyone; World Monitor monetises through Pro tiers and APIs. Design is heavy on interpretation (scores, forecasts, alerts).
3. **Science communication** (NASA Eyes, Climate Pulse, nullschool): explain systems; often modelled; honest about it to varying degrees.
4. **Accountability / stated goals** (GFW, Climate TRACE, GEM, Global Plastic Watch, WRI): data assembled with a stated goal (forests, fishing, emissions, energy transition, waste). The goal does not settle usability: each **dataset** is judged on its own method and checkability; any framing stays with the source.

## 5. What Mother Earth currently does (not a claim of uniqueness)
- **Coverage and absence are part of the page.** Each cell carries a coverage grade **under our stated rules** — an evidence/coverage statement about what we received, *not* a measure of how certain the underlying science is. "No record" is never painted as "nothing there". overwatch.earth's launch post describes the opposite choice (layers drop off when the source goes quiet).
- **Observed vs Computed labels on the page** (Projected reserved), with measured caveats (sea-ice imagery "not shown", NASA's local-scale line, ships hearing only part of the sea). nullschool documents its sources and model status on its About page.
- **No editorial, scores, alerts or AI summaries of our own.** World Monitor and the OSINT dashboards publish these.
- **Integrity practices we can show:** records/counts pairing, validation before publish, last good snapshot with original times, register with verbatim licence lines. Others' public pages not describing such safeguards does **not** establish that they lack them.
- **A small layer count** (11 + aircraft parked) against 30–40 elsewhere.

**Carrying this forward (GPT's framing, adopted):** keep three questions apart — (1) what improves the current globe; (2) what deserves a later page with its own explanation and evidence; (3) what the shared hub must make possible (stable identifiers, provenance, timestamps, evidence classes, links across pages). This comparison does not define Mother Earth's final differentiation, and it should not narrow the wider project into a better live-globe dashboard.

## 6. Limits of this comparison
- Built from each site's own description, not from using every site or inspecting its network calls. Not an exhaustive market search. Claims are theirs, not verified (e.g. World Monitor's 2 M users, Climate TRACE's 745 M sources).
- GEM's licence and commercial terms are still unread. DestinE's access-policy page could not be fetched from this session (GPT read it).
- GPT's parallel review covers further references not repeated here: NASA Worldview, JRC Global Surface Water, IPCC Interactive Atlas, EMODnet, LITTERBASE, Plastic Adrift, and biodiversity/restoration/water/energy sources.
- Windy, NASA Worldview, Earth Engine timelapse and the orbital-only viewers are named but not reviewed.

## 7. Revision 2 changes (5 Nov, from GPT's review — each checked)
| Item | Before | After | Checked against |
|---|---|---|---|
| Headline claim | "Nothing out there is doing what Mother Earth does" | explicit practices stated; uniqueness not established | — (claim narrowed) |
| Cell grades | "how sure it is" | coverage/evidence under our rules, not scientific certainty | our own definition |
| nullschool | "GFS/CMEMS/GEOS-5 output is a forecast" | classified per product (forecast / analysis / observation-derived / observed) | nullschool About |
| Climate TRACE licence | not stated | CC BY 4.0, external-dataset exceptions | climatetrace.org/terms (read) |
| Global Plastic Watch | licence not stated | API data CC BY-NC 2.0 | globalplasticwatch.org/methodology (read) |
| Global Fishing Watch | non-commercial only | non-commercial standard; custom licence possible if mission-aligned | GFW FAQ (read) |
| Destination Earth | selected groups only | public registration for selected services; advanced access conditional | ESA Feb 2026 (read); access-policy page not reachable here |
| §3c | "out by the constitution" | split: Chad's standing lines vs out of scope for this globe | — |
| Motives | "attention", "drama" | stated aims + observable design | — |
| Replay | "product decision" | bounded by retention; no tracks or orbital playback from what is kept | our D1/R2 retention (STATUS 4 Nov) |

## Sources
- overwatch.earth launch post — https://tuxxin.com/blog/introducing-overwatch-earth-live-planet-globe
- overwatch.earth rebuild post — https://tuxxin.com/blog/overwatch-earth-rebuild-discussions-passwordless-comments
- World Monitor about — https://www.worldmonitor.app/docs/about · features — https://www.worldmonitor.app/docs/features · data sources — https://www.mintlify.com/koala73/worldmonitor/api/data-sources/overview
- Worldview (rblaschke-lab) — https://rblaschke-lab.github.io/worldview/about.html
- Planet Pulse — https://awesome.ecosyste.ms/projects/github.com%2Fdacrab%2Fplanet-pulse
- earth.nullschool.net about — https://earth.nullschool.net/about
- Zoom Earth — https://zoom.earth/
- NASA Eyes on the Earth — https://www.nasa.gov/earth-and-climate/nasas-eyes-on-the-earth-puts-the-world-at-your-fingertips
- Copernicus Climate Pulse — https://climate.copernicus.eu/climate-pulse-c3ss-new-tool-monitor-state-our-climate-glance
- Destination Earth (ESA) — https://www.esa.int/Applications/Observing_the_Earth/A_milestone_in_digital_Earth_modelling
- Resource Watch launch (WRI) — https://www.wri.org/news/release-introducing-resource-watch-new-data-platform-monitor-planets-pulse
- Global Fishing Watch API — https://api-doc.globalfishingwatch.org/
- Climate TRACE about — https://www.climatetrace.org/about
- Global Energy Monitor about — https://globalenergymonitor.org/about/
- Global Plastic Watch launch — https://www.businesswire.com/news/home/20220508005107/en
- Climate TRACE terms — https://www.climatetrace.org/terms
- Global Plastic Watch methodology — https://globalplasticwatch.org/methodology
- Global Fishing Watch commercial-use FAQ — https://globalfishingwatch.org/faqs/can-i-use-global-fishing-watch-apis-for-commercial-purposes/
- ESA, Europe's digital Earth gets ready to grow user community (Feb 2026) — https://www.esa.int/Applications/Observing_the_Earth/Europe_s_digital_Earth_gets_ready_to_grow_user_community
- (via GPT) DestinE access policy — https://platform.destine.eu/faqcat/access-policy/ · JRC Global Surface Water FAQ — https://global-surface-water.appspot.com/faq · IPCC Interactive Atlas guidance — https://interactive-atlas.ipcc.ch/regional-information/guidance
