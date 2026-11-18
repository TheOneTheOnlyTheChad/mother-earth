# Mother Earth — Animal journeys, populations and conservation

17 November 2026 · Concept spec rev 1 · For review

## 1. Goal

Show how animals move across land, sea and sky, alongside evidence about how their populations are changing.

A visitor should be able to follow a recorded journey, explore a migration corridor, and understand the conservation status of the species or population concerned.

Include declining populations, recovering populations, stable populations and those whose direction remains uncertain.

Start with a private preview using published research data. Public release requires Chad’s separate production approval.

Cloudflare is already paid for. The former $0/month constraint is removed. Estimate incremental storage, requests, processing and any provider fees before proposing expenditure.

## 2. The questions the feature should answer

- Where did these tracked animals travel?
- When were the observations collected?
- How many animals were sampled, and how representative is the study?
- Which seasonal habitats or migration corridors did they use?
- What does a population survey or assessment say about their numbers?
- Is the population increasing, decreasing, stable or uncertain over the stated period?
- What is the assessed extinction risk, and when was it assessed?
- Which threats or conservation measures are supported by the sources?

Every answer should carry its source, geographic scope and relevant dates.

## 3. Evidence presented

### A. Recorded animal journeys

Timestamped observations from tagged animals.

Show the species, study, tracking method, observation period, sampled animals and location uncertainty where supplied.

A replay follows the study’s historical dates. Its clock remains visible throughout playback.

### B. Migration corridors and seasonal distribution

Published corridors, seasonal ranges or modelled distribution surfaces.

Identify whether the product comes from tracking observations, surveys, expert interpretation or a statistical model.

A migration corridor describes use across a study period. Its display should state that period and the source’s method.

### C. Population change

Published counts, abundance estimates, breeding-pair counts or relative abundance indices.

Every chart identifies the population, region, measurement unit, survey method, observation years and uncertainty where available.

Use the source’s trend classification where provided. A new trend calculation requires a documented method and review.

### D. Extinction risk

Dated assessments such as IUCN categories, with the assessment’s global or regional scope.

Display the population trend and extinction-risk category as separate fields.

A recovering population can still have a high extinction risk. A widespread species can contain a severely declining regional population.

## 4. Recommended first experience

Add an Animals entry that opens a dedicated explorer, with an optional globe layer.

The globe starts with the Animals layer off, consistent with Bare Earth.

The explorer offers Land, Sea and Air filters, a species or study selector, and a visible date range.

Selecting a journey shows:

- The recorded track and observation points.
- A timeline with play, pause and scrub.
- The selected animal’s last observation at the replay time.
- The study’s sampling period and number of tracked animals.
- A compact study and conservation card.
- Source, licence, citation and any display restrictions.

Start with one selected study. Add several animals from that study only when the display remains readable.

Population charts open from the same card. The chart identifies whether its population and period match the tracking study.

## 5. Sources and suitability

| Source | What it contributes | Proposed use | Access work required |
| --- | --- | --- | --- |
| Movebank Data Repository | Published animal tracking studies, metadata and DOIs | First land and marine journey replays | Inspect each dataset’s licence, files, quality flags and location sensitivity |
| Movebank active studies | Public or permissioned updates from ongoing projects | Later delayed tracking feed | Confirm download access, update frequency, external display rights and restrictions |
| NOAA Animal Telemetry Network | Marine telemetry and associated environmental observations | Whales, turtles, seals and other marine study candidates | Check the chosen dataset’s export, attribution and reuse conditions |
| Ocean Tracking Network | Aquatic telemetry, including acoustic detections and public data products | Fish and shark movement studies | Distinguish release records, receiver detections and interpreted tracks; check each product |
| SAIAB Acoustic Tracking Array Platform | South African coastal fish, shark and ray telemetry | Regional partnership candidate | Request an appropriate historical or generalised public dataset |
| CMS / Global Initiative on Ungulate Migration | Published land-mammal migration corridors and factsheets | Wildebeest, zebra, elephant and other corridor stories | Confirm reuse rights for each selected map or geometry |
| IUCN Red List | Extinction-risk assessments and population-trend fields | Conservation cards | Confirm public display, caching, attribution and account/API conditions |
| Living Planet Database | Monitored vertebrate population time series | Increasing, declining and stable population charts | Review the current data-use agreement and redistribution terms |
| International Whaling Commission | Accepted whale abundance estimates and status summaries | Population context for whale journeys | Preserve survey scope, estimate year, confidence intervals and source credit |
| DFFE / SAEON / SAPRI | South African marine and seabird monitoring reports and datasets | African penguins, seals, whales and Marion Island wildlife | Inspect individual records and underlying series; obtain clarification where needed |
| eBird Status and Trends | Modelled weekly distribution and relative abundance | Later seasonal bird movement surfaces | Review product-specific terms, permitted hosting and attribution |
| Motus | Radio detections of birds and other small animals | Later receiver-based movement examples | Confirm public export rights, filtering and interpretation of receiver detections |
| OBIS / OBIS-SEAMAP | Marine occurrence, survey and some tracking datasets | Discovery and contextual observations | Identify record type, sampling effort, uncertainty and dataset-specific licence |

These sources are candidates for different parts of the feature. Availability on a public website alone does not settle our right to download, transform and host the underlying data.

## 6. First study candidates

### A. Botswana zebra migration — preferred land preview

Published study covering movement between the Okavango Delta and Makgadikgadi grasslands.

Movebank’s account describes seven GPS-collared adult zebras and provides a published dataset DOI.

The story connects recorded movement with rainfall, vegetation and access to seasonal habitat.

Dataset DOI
https://doi.org/10.5441/001/1.f3550b4f

Before selection, verify the downloadable files, licence, observation dates, usable animals and whether the available data reproduce the journey described.

### B. Eastern North Pacific blue whales — preferred marine candidate

A published study identifies archived Argos tracking data collected during 1993–2008 and reports its availability through Movebank under CC0.

This offers an ocean journey with clear historical dates and published scientific interpretation.

Inspect the original repository record and location-quality fields before choosing a subset.

### C. Southern African sharks and rays — preferred regional partnership

ATAP and collaborators conduct acoustic tracking along the South African coast, including work in False Bay.

An acoustic detection places an animal within a receiver’s detection area. Draw detections with that interpretation and show gaps between receivers.

Ask whether a completed study or generalised historical product can be supplied for public educational display.

### D. African penguins — preferred local conservation story

Combine a dated population series with a separate, permissioned foraging study if suitable data can be obtained.

SAEON identifies the species’ move to Critically Endangered in 2024. The initial task is to locate a usable population series with methods, units and geographic scope.

Show breeding pairs, breeding adults or total abundance according to the source’s actual measurement.

### E. Recovery example — selected whale population

Use an IWC-assessed population with evidence of increasing abundance.

Choose a specific population and assessment period. Explain remaining uncertainty and threats.

Select the example from the evidence, without requiring every species card to carry a positive or negative storyline.

## 7. Movement interpretation

- Keep observed fixes distinguishable from connecting segments.
- State that a line joins recorded locations.
- Break tracks at long gaps using a threshold chosen for the study and sampling method.
- Preserve supplied quality flags and uncertainty.
- Handle duplicate times, out-of-order records, invalid coordinates and the date line.
- Use a study-specific animal key, since identifiers may repeat across studies.
- Label first and last points as first and last observations received.
- A stopped transmitter shows “last observation” or “tracking ended”.
- Mortality requires a supported source statement.
- Label modelled routes, estimated positions and interpolated playback explicitly.
- Preserve the identity of each study when combining datasets.

## 8. Population interpretation

Show the latest available published evidence, with its observation year and publication or assessment date.

For every series, record:

- Species and taxonomic identifier.
- Population or stock name.
- Geographic scope.
- Unit and counting method.
- Survey years and effort where available.
- Estimates and confidence intervals.
- Method changes and missing years.
- Published trend and the period it describes.
- Source citation and licence.

An occurrence record documents an observation. Population trend charts require suitable counts, survey estimates or a documented abundance model.

The number of tags, detections, uploaded sightings or records in a database must be labelled with its actual meaning.

Avoid extinction countdowns. Include a projected future outcome only when a cited model supports it, with its assumptions and uncertainty.

## 9. Sensitive locations

Assess sensitivity for each selected dataset before public hosting.

Consider nesting sites, dens, breeding beaches, haul-outs, threatened terrestrial mammals and animals exposed to collection or persecution.

Choose an appropriate public representation with the data owner’s guidance where needed:

- A completed historical track.
- A delayed track.
- A generalised route or region.
- A seasonal corridor.
- Aggregated observations.
- An omitted sensitive section.

A universal rounding distance or delay will not suit every species.

Apply any required generalisation before public upload. Check downloadable files and API responses as well as the map.

Use neutral display identifiers. Publish researcher-provided animal names only where the dataset and its permissions support that use.

## 10. Architecture

### First preview

Use a small, pinned subset of one published study.

Prepare it locally, save the original source citation and checksum, and generate a compact display file.

The preview reads the prepared file locally. Synthetic fixtures support development and remain clearly labelled.

### Public release

Serve reviewed display files through the existing Mother Earth infrastructure.

Keep upstream credentials on the collector or hub.

Load the selected study on demand. Bound points and geometry so playback remains responsive on phones.

Use a versioned manifest carrying:

- Study identifier and dataset DOI.
- Source revision and retrieval time.
- Observation start and end.
- Species and sampled-animal count.
- Tracking method.
- Licence and required citations.
- Location precision and sensitivity treatment.
- Simplification method and gap rule.
- Point count, file size and checksum.

A historical archive needs no recurring retrieval unless its publisher releases a revision.

For an ongoing feed, choose collection cadence from the provider’s update frequency, permission and practical value. Record observation time, retrieval time and any intentional delay separately.

## 11. Environmental context

Later, allow selected journeys to be explored alongside Mother Earth’s environmental layers.

Potential combinations include:

- Zebra migration with rainfall and vegetation.
- Seabird movement with wind.
- Whale, seal or turtle movement with ocean conditions.
- Land movement with fires and habitat boundaries.

Match environmental observations to the journey’s historical dates.

Where matching historical products are unavailable, explain the time difference.

Any claim about causes, habitat preference, exposure or collision risk requires an appropriate study or analysis.

## 12. Refresh and availability states

Historical studies remain available as dated archives.

For ongoing studies, distinguish:

- A fresh observation.
- A deliberately delayed public observation.
- No new observation.
- An upstream retrieval failure.
- A completed deployment.
- Data temporarily withheld.
- Data unavailable under the current permissions.

On failure, retain the last good permitted file and its original observation dates.

Give a clear message when a filter returns no observations.

## 13. Acceptance for the first preview

- One real, licensed tracking study renders with correct dates.
- At least one animal has a coherent replay supported by its source.
- The number of animals and observation period are visible.
- Playback handles gaps and date-line crossings.
- The first and last points use observation wording.
- The public-file design respects the selected sensitivity treatment.
- Source, licence and citation are accessible.
- A conservation card states its assessment date and geographic scope.
- A population chart states its unit, region and survey period.
- The Animals layer starts off.
- Switching it off stops playback and releases its drawing resources.
- Desktop and narrow-screen behavior are checked before release.

## 14. Suggested delivery order

1. Source audit
   Inspect the Botswana zebra and archived blue-whale datasets. Return exact licences, files, dates, sample sizes and sensitivity decisions.

2. Private journey preview
   Build one study first, preferably the Botswana zebra migration if its files and terms check out.

3. Population and conservation card
   Add a verified assessment and a suitable population series. Clearly identify any difference in region or time from the tracked animals.

4. Marine preview
   Add one whale, turtle or seal study.

5. Regional partnership proposal
   Prepare an enquiry for a South African historical or generalised dataset, prioritising ATAP and penguin monitoring.

6. Public release proposal
   Bring back the reviewed branch, REGISTER entries, credits, costs and release steps for Chad’s approval.

7. Ongoing tracking
   Add a delayed or regularly updated feed once its access and publication arrangements are settled.

## 15. Cost and approval rules

Cloudflare is already paid for.

Record expected storage, requests, transfer and processing for the selected design, including any incremental charges.

State provider licence or subscription fees before making commitments.

Research, specifications and private previews follow Chad’s authorised scope. Production deployment, public publication, new spending and provider messages require his explicit approval.

## 16. Known gaps at this concept stage

- The original zebra dataset download and its exact licence have not been inspected.
- The original blue-whale repository files have not been inspected.
- No source dataset has been downloaded or tested in Mother Earth.
- ATAP public redistribution rights have not been established for a selected study.
- A population series has not yet been chosen.
- The Living Planet data-agreement PDF returned 404 during this research.
- IUCN hosting and caching arrangements require review for the intended implementation.
- Mobile performance and incremental infrastructure costs remain unmeasured.

## 17. References

Movebank repository
https://www.movebank.org/cms/movebank-content/data-repository

Movebank data policy
https://www.movebank.org/cms/movebank-content/data-policy

Movebank API documentation
https://github.com/movebank/movebank-api-doc

Botswana zebra study
https://www.movebank.org/cms/movebank-content/migratory-burchells-zebra-in-northern-botswana

Blue-whale study and data-availability statement
https://pmc.ncbi.nlm.nih.gov/articles/PMC6637557/

NOAA Animal Telemetry Network
https://oceanservice.noaa.gov/ocean/animal-telemetry.html

Ocean Tracking Network public products
https://members.oceantrack.org/data/discovery/bypublic.htm

SAIAB Acoustic Tracking Array Platform
https://saiab.ac.za/platforms/acoustic-tracking-array-platform/

False Bay tracking collaboration
https://www.aquarium.co.za/foundation/news/this-world-shark-day-a-collaborative-acoustic-tagging-project-is-shining-a-light-on-elasmobranch-movements

CMS Atlas of Ungulate Migration
https://www.cms.int/gium/migration-atlas

IUCN API and usage guidance
https://api.iucnredlist.org/

Living Planet population search
https://stats.livingplanetindex.org/search

IWC population estimates
https://iwc.int/about-whales/estimate

South African marine monitoring catalogue
https://odp.saeon.ac.za/mims/catalog/

eBird data products
https://science.ebird.org/en/use-ebird-data/download-ebird-data-products

Motus collaboration policy
https://motus.org/resources/policy/

OBIS data policy
https://portal.obis.org/data/datapolicy/