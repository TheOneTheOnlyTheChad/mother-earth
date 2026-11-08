# Inspiration — Chad's original 50-site list

**What this is:** the list of sites Chad started from when imagining the wider Mother Earth website, kept as inspiration. **It is not the research backlog and it queues no work.** Nothing here starts research, a first gate, a build or a production change. Every existing approval and accepted review stands unchanged.

Written 8 Nov 2026 from existing records only (no new research). The list was first triaged on 1 Nov with Gemini's spec and our judgement applied (`docs/STATUS-ARCHIVE.md`, "Done 1 Nov … triage"). Where that triage is cited below, it is a record of what was said on 1 Nov, not a current classification.

## How to read the status column
| Status | Meaning |
|---|---|
| **Live** | Something on the public page today does a related job, and a release record supports it. Named with the record. The site in the list itself is not a source. |
| **Parked** | A decision on record stops the work, research included where stated. |
| **Researched, not adopted** | A gate or review exists, but nothing is selected or built. |
| **Inspiration only** | No gate, no review, no decision beyond the 1 Nov triage note (if any). Not queued. |

## The six domains
Planet · Life · People · History · Arts · Science (7 Nov) is an **organisational idea** for the wider site, worked with GPT and Claude. It is **not** six selected or approved builds. Planet = today's observation globe. Phase 0 found: Arts (the Met) cleared for a limited metadata feasibility gate only, recommended but **not selected**; Life stopped (blocked for the scoped proof of concept); People, History and Science have no gates. Domain selection and any Phase A need Chad's separate decision. The domain names in the table are where an item would naturally sit, not assignments.

## Shared keys
Wikidata IDs are the project's **shared-key direction** (constitution, 1 Nov). Wikipedia has **not** been adopted as a general source.

## The list
| # | Site | Experience it suggests | Evidenced connection to the current build | Status |
|---|---|---|---|---|
| 1 | zoom.earth | The planet as seen from orbit | Globe backdrop = NASA GIBS imagery, **dated, not live** (NOAA-21 since 8 Nov 05:07:54 UTC, `3375e91`). 1 Nov triage: skip zoom.earth itself (proprietary wrapper). | **Live** (related: dated backdrop). GIBS selection rule: bench closed, nothing further authorised. |
| 2 | flightradar24 | Every plane in the sky | Aircraft layer: OpenSky reply (30 Oct ticket) requires a feeder for a public site; branch `aircraft-rc` parked, never deploy as-is. 1 Nov triage: skip FR24 (commercial). | **Parked, research included.** |
| 3 | marinetraffic | Every ship at sea | Ships layer from aisstream via the Mac collector (live since 31 Oct) + cloud fallback (3 Nov), honest about hearing ~half the vessels. 1 Nov triage: skip MarineTraffic itself. | **Live** (related: ships). |
| 4 | windy | Winds and storms in motion | 1 Nov triage: GFS wind parked ("wind is a model" — said of GFS only). Wind/storm products may hold observations, forecasts or model output; **no product-specific review exists, so no classification is made here.** | **Inspiration only.** |
| 5 | lightningmaps | Lightning strikes as they happen | 1 Nov triage: Blitzortung or NOAA GOES GLM named as candidates; parked (GLM needs a NOAA bucket pipeline). Terms/access never checked. | **Inspiration only.** |
| 6 | USGS earthquakes | Recent quakes, live | USGS feed is a core layer since 30 Oct; latest independent sighting in GPT's 8 Nov smoke tests; monitored by UptimeRobot. | **Live.** |
| 7 | submarinecablemap | The internet's physical cables | 1 Nov triage: TeleGeography GeoJSON, CC BY-SA — share-alike needs a decision first. No later decision found in STATUS/HANDOVER. | **Inspiration only** (decision pending if ever raised). |
| 8 | Global Forest Watch | Forest loss seen from space | Forest disturbance layer (GFW integrated alerts, CC BY 4.0) **on the page since 1 Nov 08:40 UTC** (STATUS-ARCHIVE); partial coverage disclosed in GPT's 8 Nov 05:14–05:20 smoke test. | **Live.** |
| 9 | worldometers | The world counted second by second | 1 Nov triage: skip — extrapolated counters, not observations. Any underlying official figures would need their own review; none done. | **Inspiration only.** |
| 10 | internetlivestats | The internet's activity right now | 1 Nov triage: skip — extrapolated counters. | **Inspiration only.** |
| 11 | thetruesize | Countries at their real size | 1 Nov triage: reference only. | **Inspiration only.** |
| 12 | oldmapsonline | The world as mapped centuries ago | 1 Nov triage: reference only. Would sit in History. | **Inspiration only.** |
| 13 | davidrumsey | A large historical map archive | 1 Nov triage: reference only. Would sit in History. | **Inspiration only.** |
| 14 | openstreetmap | A world map drawn by volunteers | 1 Nov triage: reference/context only (e.g. a base map); attribution and tile terms unchecked. | **Inspiration only.** |
| 15 | window-swap | Looking out of a stranger's window | None. Voluntarily published views are not inherently surveillance; consent, content and intended use would need assessing. None assessed. | **Inspiration only.** |
| 16 | virtualvacation | Walking through a city from home | None. Same as #15: consent, content and use not assessed. | **Inspiration only.** |
| 17 | mapcrunch | Dropped at a random spot on Earth | None. Same as #15. | **Inspiration only.** |
| 18 | atlasobscura | The world's strangest places | None. Editorial presentation does not by itself disqualify underlying evidence; nothing reviewed. | **Inspiration only.** |
| 19 | neal.fun | Playful interactive knowledge | None. A bar for how exploring should feel. | **Inspiration only.** |
| 20 | Scale of the Universe | Zooming from atom to cosmos | None. | **Inspiration only.** |
| 21 | NASA Eyes | The solar system in 3D | No evidenced connection. (Earth-orbit population is live as the orbital layers, but that was not built from this item.) Would sit in Science. | **Inspiration only.** |
| 22 | stellarium-web | The real sky overhead | 1 Nov triage: reference only. The day/night terminator is **calculated illumination**, not sky-event coverage. | **Inspiration only.** |
| 23 | APOD | A daily astronomy picture | 1 Nov triage: reference only. | **Inspiration only.** |
| 24 | NASA images | NASA's visual archive | 1 Nov triage: reference only. | **Inspiration only.** |
| 25 | pudding.cool | Stories told through data | None. Editorial; underlying evidence not reviewed. | **Inspiration only.** |
| 26 | Our World in Data | The state of the world in data | 1 Nov triage: reference only. Would sit in People. Not reviewed. | **Inspiration only.** |
| 27 | gapminder | Correcting what we think we know | None. | **Inspiration only.** |
| 28 | informationisbeautiful | Complex data made visual | None. Editorial; underlying evidence not reviewed. | **Inspiration only.** |
| 29 | World Bank data | Open development statistics | 1 Nov triage: reference only. Official statistics are not automatically suitable; nothing reviewed. | **Inspiration only.** |
| 30 | TÜİK (Turkey) | One country's official statistics | None. | **Inspiration only.** |
| 31 | archive.org | Books, films and software, preserved | None. Would sit in History/Arts. | **Inspiration only.** |
| 32 | Project Gutenberg | Free books past copyright | None. | **Inspiration only.** |
| 33 | Open Library | A record of every book | None. | **Inspiration only.** |
| 34 | Library of Congress | A national digital archive | None. | **Inspiration only.** |
| 35 | Europeana | Europe's cultural heritage | None. | **Inspiration only.** |
| 36 | DPLA | America's digital library | None. | **Inspiration only.** |
| 37 | Google Arts & Culture | Museums from home | None. | **Inspiration only.** |
| 38 | Rijksmuseum | Artworks in high resolution | None. | **Inspiration only.** |
| 39 | WikiArt | A large artwork archive | None. | **Inspiration only.** |
| 40 | Public Domain Review | Forgotten visual history | None. | **Inspiration only.** |
| 41 | Open Culture | Free culture and education | None. | **Inspiration only.** |
| 42 | The Met | An open museum collection | Phase 0 Arts gate (7 Nov): **cleared for the accepted metadata feasibility scope only** — catalogued places of making mapped to present-day countries, 479 objects / 25 countries, media excluded. Not the whole collection, not images. Recommended as first domain, **not selected**. | **Researched, not adopted.** |
| 43 | musicmap | The family tree of music | None. | **Inspiration only.** |
| 44 | radiooooo | A country and decade, by ear | None. | **Inspiration only.** |
| 45 | listen.hatnote | Wikipedia's edits as sound | None. | **Inspiration only.** |
| 46 | Wikipedia | A random knowledge well | Wikidata IDs are the shared-key direction (constitution, 1 Nov). Wikipedia not adopted as a source. | **Inspiration only** (Wikidata = direction). |
| 47 | timeanddate | Time, sunrise and sky events | Day/night terminator: **calculated illumination**, labelled computed, off on load (live since 2 Nov). Not sunrise tables or sky-event coverage. | **Live** (related: computed day/night only). |
| 48 | ScienceDaily | A stream of science news | None. | **Inspiration only.** |
| 49 | arXiv | Science before publication | 1 Nov triage: reference only. Would sit in Science. | **Inspiration only.** |
| 50 | Observable | Data explored with live code | None. A tool, not a source. | **Inspiration only.** |

## Authorised or approval-ready work (checked 8 Nov from HANDOVER, BACKLOG-VIEW, GIBS proposal and GitHub branches)
- **Fully reviewed and authorised for implementation: none.**
- **Completed candidate ready for production approval: none.** GitHub has `main` and the parked `aircraft-rc` only.
- Nearest items, none of them authorised: R2 rev 2 awaits GPT's review (filing would need Chad's separate authorisation); R3 and R6 are unresolved research-only records, not filed; the GIBS bench is closed with nothing further authorised; the Phase 0 recommendation awaits Chad's domain decision; `aircraft-rc` is parked and never deployed as-is.
