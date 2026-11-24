# Nature context, Workstream C (recorded journey context): handed to the Animals thread

**24 Nov 2026 (14:09 UTC clock reading). From the Nature context thread, on Chad's instruction (his own message, 24 Nov): the Animals thread takes over Workstream C and completes it there.** Docs only. Nothing is selected, built or cleared by this note. The Animals thread runs it the usual way: a proposal, then GPT, then Chad's go, then a branch, then a review, then Chad's lines.

## 1. What the spec asks (GPT, rev 1, 23 Nov; `docs/concepts/NATURE-CONTEXT-SPEC-GPT-rev1.md` §7, §9 stage 3, acceptance criterion 7)

The aim is landscape context beside a recorded animal journey, with the periods kept apart. For example: "Recorded journey: 2007–08. Forest observations: November 2026. These describe different periods."

- **Labelling:** never label present-day alerts as something the animal encountered.
- **Period matching:** use information only where the product actually covers the journey's dates and geography. Say so when no historical context is available.
- **Geometry:** an exact route intersection or distance-to-alert claim needs suitable source geometry, justified spatial accuracy and a reviewed method. A route buffer must not imply habitat use or a home range.
- **Inferences:** none about distress, population, mortality, habitat suitability or causal impact.
- **Sensitivity and reuse:** animal-location sensitivity and reuse stay under the existing Animals decisions.
- **Order:** this is a separate proposal, written after the place preview. The place preview is now live (below).

## 2. What exists now (Nature context release, live page main `782da28`, 24 Nov 2026)

**Forest disturbance (GNW integrated alerts):**
- Counts per 4° cell. For each cell the count covers pixels **first detected on or after the cell's own `since` date**, as held in the dataset version named, at that cell's query time.
- The counts are regional context only. They are not alert locations and not history.
- Wording, freshness and count rules are in `app.js` (`ME.forest*`) and in proposal rev 2, `docs/concepts/NATURE-CONTEXT-PROPOSAL.md` §3.
- **Retained history:** D1 `forest_daily` keeps one snapshot per cell per UTC day, and only from 2 Nov 2026. So nothing on our side covers a 2007–08 journey.

**Fires:** FIRMS. The panel shows today's detections for the cell, with the FIRMS caveats.

**The "Everything here" panel** (`/place/g4/<cell>`, `ME.placeRows`) lists layers that share a 4° cell, and says that nothing there states a connection between them. Journey context would be a different surface: beside a journey, not in the cell panel.

## 3. Leads for the Animals thread's own source check (none of these is checked or cleared)

- **Historical alerts:** the GFW Data API's `gfw_integrated_alerts` version records give a content date range from 2014-12-31. But the integrated layer's own description says GLAD-L's reprocessed collection starts 1 Jan 2021, and RADD and GLAD-S2 start in 2019 or 2020. Whether any alert product covers a given journey's dates and region has to be established per journey.
- **Annual tree-cover loss** (UMD/Hansen) is the product GNW itself recommends for change over time. It wasn't assessed in this thread.
- **Soil carbon C1** (Glen et al. 2026, Zenodo 22137130) has period averages for 2001–05, 2006–10, 2011–15, 2016–20 and 2021–24. A journey could sit inside one of those periods. That is still **modelled organic-soil emissions**, not anything the animal met. It is uncleared, and is under assessment in the Nature context thread now (§4).

## 4. Boundaries between the threads

- The Nature context thread keeps soil carbon (Workstream B), the global integrated disturbance-alert measurement and the hub's forest `quantity` wording. If a journey surface later wants soil or forest values, it uses whatever those workstreams release; it does not start its own collector.
- The Animals thread owns `animals*`, its suite and its pins (including `NC_MAIN`, which only a Nature context page release moves).
