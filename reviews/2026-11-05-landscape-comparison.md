# Mother Earth — comparison with similar sites (5 Nov 2026)

Prepared by Claude for Chad (thread 14). Sources: each site's own pages, docs or launch posts, read 5 Nov 2026 (links at the end). **I did not open and use every live site.** Where a site's page did not say something (licence, cadence, funding), it is marked *not stated*, not guessed.

## 1. Bottom line

- **Nothing out there is doing what Mother Earth does.** Plenty of sites put live feeds on a globe, and some carry far more feeds than we do. None of the ones read states, per cell, how sure it is and what it could not see. None treats "we did not hear anything" as different from "nothing is there."
- The field splits into three families:
  - **A. Live "everything" globes and intelligence dashboards.** These are the closest in look. They aim for attention or *situational awareness*, and several are openly geopolitical or commercial.
  - **B. Earth-science visualisers.** These are mostly **models and forecasts** rendered beautifully, or science communication from the agencies.
  - **C. Thematic accountability platforms** covering forests, fishing, emissions, energy and waste. Their data is often excellent, but each is built to drive a specific action.
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
| **earth.nullschool.net** | Animated wind, temperature, humidity, CAPE and pressure; ocean currents, SST + anomaly, waves, coral bleaching alert; aerosols and chemistry (CO, CO₂, SO₂, NO₂, dust, PM2.5/PM10); aurora; UV; active fires. | GFS (3-hourly) · OSCAR + CMEMS (daily) · OI SST / OSTIA / RTGSST · WAVEWATCH III · NOAA Coral Reef Watch · GEOS-5 + CAMS · OVATION · CPC UVI · FIRMS VIIRS. | Show the planet's systems in motion. **Almost everything is modelled**; the site says so ("generated from numerical models") and gives no accuracy guarantee. It admits a **+32 ppmv CO₂ offset it added "for illustration… not scientifically valid"** before 2017. Fires are the only clearly observed layer. |
| **Zoom Earth** | Live geostationary imagery, NASA HD imagery twice daily, radar, wind/temperature/rain forecasts, tropical storm tracks, fires and heat spots (daily). | GOES, Meteosat, Himawari, NASA Aqua/Terra via GIBS · ICON + GFS models · NHC, JTWC, NRL, IBTrACS · NIFC, CIFFC, CEMS, EFFIS, GDACS, FIRMS. | A consumer weather and storm map with a free app. |
| **NASA Eyes on the Earth** (JPL) | NASA's Earth satellites in 3D, eight "vital signs" (CO₂, CO, sea level, soil moisture…), event snapshots. | NASA missions (OCO-2, Aqua, Landsat, SWOT, NISAR…). OCO-2 data is reprocessed for months before it appears. | Science communication: get to know the planet and NASA's missions. |
| **Copernicus Climate Pulse** (C3S/ECMWF) | Daily global surface-air and sea-surface temperature and anomalies, maps back to 1979, series back to 1940. | **ERA5 reanalysis** (a model constrained by observations), ~2 days behind; anomalies vs 1991–2020. | Make the climate's state readable at a glance; data downloadable. |
| **Destination Earth** (EU: ECMWF, ESA, EUMETSAT) | Digital twins of the Earth system: weather extremes and climate "what if" scenarios decades ahead. | Their own high-resolution simulations. | Inform adaptation policy. **Access is for selected user groups for now**; public access "progressively". This is the space our future *Possible futures* view would draw on. |

### C. Thematic accountability platforms

| Site | What it shows | Where the data comes from | What it seems to be after |
|---|---|---|---|
| **Global Forest Watch / Resource Watch** (WRI) | GFW: deforestation alerts and tree-cover change. RW: "hundreds of datasets" across climate, water, food, cities, instability, some near-real-time. | Satellite alerts (GLAD, RADD — **we already use GFW integrated alerts, CC BY 4.0**) plus partner data. | Sustainability decisions; layering datasets "so users can see how issues connect". The nearest in spirit to Chad's *bridge across fields*, but curated toward WRI's goals. |
| **Global Fishing Watch** | Apparent fishing activity, dark-vessel radar detections, vessel identity, encounters/transshipment, risk insights. | Public AIS + government VMS (via partnerships) + satellite radar. | Monitor human impact on the ocean; enforcement and research. **APIs are non-commercial only.** |
| **Climate TRACE** | GHG and pollutant estimates for 745 M+ sources (asset level for sectors covering ~75 % of emissions), monthly, ~2-month lag. | 300+ satellites, 11,000+ sensors, ML. Current figures are **estimates**; the observed vs modelled split is not stated per figure. | "Make climate action faster and easier." Founded by Al Gore's coalition (press). Licence not stated on the About page. |
| **Global Energy Monitor** | Trackers for coal/gas/oil plants and extraction, **coal mines, iron-ore mines**, **solar, wind**, hydro, nuclear, steel, cement, ownership and finance. | Researcher-compiled and verified (desk research and partners), **not direct observation**. | An "open access" registry for a sustainable energy future. Licence and commercial terms not on the About page. |
| **Global Plastic Watch** (Minderoo + Earthrise) | Land-based plastic waste sites, initially 25 countries (SE Asia, Australia, high-emission countries). | ESA satellite imagery + ML. | Find undocumented dumps, guide waste investment, keep plastic out of rivers and oceans. "Largest open-source dataset of plastic waste"; licence not stated in the release. |
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
| **Fishing activity / dark vessels** | Global Fishing Watch | GFW API | **Non-commercial only.** Under our rule (commercial standing recorded before go-live) it can be listed but would conflict with the $1/year plan. Needs Chad's call. |
| **Plastic waste on land** | Global Plastic Watch | GPW dataset | Satellite + ML detection. Pairs with our ocean samples (land source vs sea samples). Licence first. |
| **Biodiversity sightings** | overwatch.earth | iNaturalist, eBird, GBIF | Observed by people, so coverage follows where people are. Every cell would need a heavy honesty line. |
| **Fireballs / meteors** | overwatch.earth | NASA CNEOS | Small, observed, fun. |
| **Internet outages, submarine cables** | overwatch.earth, World Monitor, Worldview | IODA, Cloudflare Radar; TeleGeography | Cables were already queued (CC BY-SA decision). Outages are "Digital", a different field from the planet. |

### 3b. Modelled — only under a Computed/Projected label, never as observation
- **Wind, weather, ocean currents, waves, aerosols** (nullschool, Zoom Earth). Beautiful and popular, but GFS/CMEMS/GEOS-5 output is a forecast. Our tier rule says such a layer must say *model*. Parked, as decided in the 1 Nov triage.
- **Aurora oval** (overwatch.earth, nullschool). OVATION is a 30-min forecast model. Our Kp is the observed index.
- **Facility emissions** (Climate TRACE). Estimates. Useful as "what the source estimates", labelled as theirs.
- **Possible futures** (Destination Earth). Not publicly open yet. CMIP6 / AR6 sea level remain the planned public sources.

### 3c. Out by the constitution — what we deliberately don't do
- **Webcams and live video** (overwatch.earth, World Monitor). Surveillance; Chad's line.
- **Conflict, protests, military bases, nuclear arsenals, regime types, NATO/BRICS blocs, "scenario presets"** (World Monitor, Worldview). Politics and drama, and the classifications themselves are contested.
- **News feeds, markets, crypto, prediction markets** (World Monitor, Planet Pulse). Not observations of the planet.
- **AI risk scores, instability indices, AI forecasts, "convergence" alerts** (World Monitor, Worldview). Telling, not showing. Each carries a hidden method and a view.
- **Comment threads on the map** (overwatch.earth). Not an observation. If a community layer ever comes, it belongs off the globe.

### 3d. Views and features we don't have
- **Replay / time slider** (overwatch.earth: 24 h on moving layers; Climate Pulse: decades). We keep history privately (D1 hourly aggregates), so a replay is possible later. A product decision, not a technical one.
- **Per-feed explainer pages** (overwatch.earth). Our Sources & Details covers this on one page. Per-layer pages would also give each layer a shareable URL.
- **Public API** (World Monitor, GFW, Climate TRACE). Ours exists (the hub) but is undocumented and unpromised. It matches "the hub is the product".
- **Build-your-own globe** (overwatch.earth's next step). The multi-tenant idea.
- **Anomaly vs baseline maps** (nullschool SSTA, Climate Pulse). Our phase-3 comparisons will do this from our own history.
- **Animated flow fields** (nullschool). Visual delight we don't have; only honest with a model label.

## 4. What they're trying to achieve (pattern)
1. **Attention / "watch it live"** (overwatch.earth, Planet Pulse, Zoom Earth): the more layers and motion, the better. Silence is hidden (quiet layers drop off).
2. **Intelligence / advantage** (World Monitor, Worldview, the OSINT clones): decision-makers' situational awareness, monetised through Pro tiers and APIs. Heavy on interpretation (scores, forecasts, alerts).
3. **Science communication** (NASA Eyes, Climate Pulse, nullschool): explain systems; often modelled; honest about it to varying degrees.
4. **Accountability / advocacy** (GFW, Climate TRACE, GEM, Global Plastic Watch, WRI): excellent data assembled to push a specific outcome (stop deforestation, illegal fishing, emissions, coal). Under our "bias is chucked" rule the **framing** stays out, and each **dataset** is judged on its own method and checkability.

## 5. Where Mother Earth is different
- **Coverage and absence are shown.** Every cell carries an evidence grade, and "no record" is never painted as "nothing there". overwatch.earth does the opposite: layers vanish when the source goes quiet. No site read states it.
- **Observed vs Computed vs Projected labels on the page**, with the measured caveat (sea-ice imagery "not shown", NASA's local-scale line, ships hearing only part of the sea). nullschool comes closest in honesty, on its About page only.
- **No editorial, no scores, no alerts, no AI summaries.** World Monitor and the OSINT dashboards are built on exactly these.
- **Data integrity is engineered in.** Records/counts pairing, validation before publish, last good snapshot with original times, register with verbatim licence lines. Not visible on any of the others' public pages.
- **A small layer count** (11 + aircraft parked) against 30–40 elsewhere. That is the cost of the above, not a defect. The 3a list is the honest backlog.

## 6. Limits of this comparison
- Built from each site's own description, not from using every site or inspecting its network calls. Claims are theirs, not verified (e.g. World Monitor's 2 M users, Climate TRACE's 745 M sources).
- Licences for Climate TRACE, GEM and Global Plastic Watch were not on the pages read; they must be read before any of them is considered.
- Windy, NASA Worldview, Earth Engine timelapse and the orbital-only viewers are named but not reviewed.

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
