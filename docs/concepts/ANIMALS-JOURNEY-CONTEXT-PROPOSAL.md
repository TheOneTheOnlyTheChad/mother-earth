# Animals: landscape context beside a recorded journey (Nature context Workstream C)

24 Nov 2026 14:14 UTC (clock reading) · rev 1 · Animals thread · for GPT, then Chad · **proposal only: nothing is built, fetched, downloaded, cleared or deployed by it**

Workstream C came to the Animals thread on Chad's instruction (24 Nov 2026), via `docs/concepts/NATURE-CONTEXT-JOURNEY-HANDOFF.md` (main `a501352`). The rules it must meet are GPT's spec `docs/concepts/NATURE-CONTEXT-SPEC-GPT-rev1.md` §7, §9 stage 3 and acceptance criterion 7. Soil carbon, the global disturbance alerts and the hub's forest wording stay with the Nature context thread; this proposal starts no collector of its own.

**The question this answers:** "What do we know about the land around this journey, *for the time it was recorded*?" The answer is a short block of dated words and numbers beside the journey card. It is regional context. It never says what the animal met, used, avoided or suffered.

## 1. The journeys, as they are on the live page

Dates are the first and last displayed fix (from the shipped files). Cells are the 4° cells of the hub's own grid (`cellBounds` in `phase1/worker.js`, row from 90° S, column from 180° W) that the displayed track touches.

| Journey | Displayed period | Where | Land or sea | 4° cells touched |
|---|---|---|---|---|
| Zebra Z3866 | 25 Oct 2007 – 22 Oct 2008 | Okavango Delta to Makgadikgadi, Botswana | **land** | `17_50`, `17_51` |
| East Walker mule deer corridor (published use areas, not a track) | data 2017 – 2024 | eastern Sierra Nevada, California | **land** | `32_15` |
| White shark 118845 | 9 May 2012 – 29 Sep 2013 | South African coast to southern Mozambique | sea | 9 cells |
| False killer whale 98364 | 23 Oct 2013 – 12 Feb 2014 | Hawaiian Islands and the North Pacific | sea | 12 cells |
| Waved albatross 3275-30662 | the page's label: 23 Jun – 15 Sep 2008 (displayed fixes 29 Jun – 15 Sep; fixes near the tagging site withheld) | Galápagos and the eastern Pacific towards Peru | sea (colony fixes withheld) | 8 cells |

The African penguin census has no positions on the page and is out of scope.

## 2. What could cover these periods (Claude's reading on 24 Nov; to be confirmed by the evidence step, §7)

| Product | What it is | Covers zebra 2007–08? | Covers corridor 2017–24? | Notes |
|---|---|---|---|---|
| **FIRMS standard-processing archive** (`MODIS_SP`; `VIIRS_SNPP_SP` from 2012) | Active-fire detections, the same family as the live Fires layer, served by date through the same FIRMS area API (`/api/area/csv/<key>/<source>/<area>/<days>/<date>`, up to 10 days a request) | MODIS: yes, on the record | MODIS and VIIRS: yes, on the record | FIRMS publishes a missing-data list per satellite and date; gaps are stated, never counted as zero |
| **Hansen / UMD Global Forest Change** (annual `lossyear`, `treecover2000`) | Stand-replacing tree cover loss by year, 30 m, from Landsat; GNW recommends it for change over time | yes (2007, 2008) | yes (2017–2024) | v1.12 covers 2000–2024 in the Earth Engine catalogue; a v1.13 entry also appears. Licence CC BY 4.0 on the catalogue. "Tree cover" means vegetation taller than 5 m at a canopy threshold we must state |
| GNW / GFW integrated disturbance alerts | Recent alerts | **no** (component products start 2014 at the earliest, mostly 2019–21) | partly, per product | Not proposed: coverage differs by component and year |
| Our own retained `forest_daily` | Hub snapshots | **no** (from 2 Nov 2026 only) | **no** | Not usable for any journey |
| Soil carbon C1 (Glen et al. 2026) | Modelled organic-soil emissions, period averages | 2006–10 period | 2016–20 and 2021–24 periods | Uncleared; owned by Workstream B. Not proposed here; a later addition only if B releases it |

Nothing in this table is cleared. It decides what the evidence step reads.

**For the three sea journeys none of these applies.** They are forest and land-fire products. The proposal says so on those cards and adds nothing else (§3.3).

## 3. Proposed design (stage C1, a private preview on a branch)

### 3.1 Where and what

On the **zebra** and **East Walker** cards only, a block headed **"The land around it, at the time"**. Words and numbers only: nothing drawn on the globe, no points, no fire or loss positions.

Example for the zebra, with illustrative numbers `n`:

> **Recorded journey:** 25 October 2007 to 22 October 2008.
> **Fires seen from space in the same months and area:** `n` MODIS active-fire detections, October 2007 to October 2008, in the two 4° cells the track crosses (about 180,000 km², far larger than the area the zebra used). By month: …
> **Tree cover loss in 2007 and 2008, same area:** `n` ha (Hansen/UMD, trees taller than 5 m at ≥ X % canopy).
> These are regional observations for the same period. They do not show where the zebra went, what it encountered or how it was affected.

For the corridor, the period is the data years, 2017 to 2024, by year, and the wording says "the cell that contains the published corridor".

### 3.2 Rules the block follows (spec §7 and criterion 7)

- **Periods kept apart.** Every number carries its own period; the journey's period is stated first. A product that does not cover the period is not shown. Where it covers part of it, the block says which months.
- **Regional, not route.** The spatial unit is the 4° cells the displayed track touches, the same grid as the live "Everything here" panel. No buffer around the track (a width would imply habitat use or a home range), no distance-to-fire, no intersection with the line.
- **Counts are counts.** A count of detections is not a count of fires and not burned area. A day with missing satellite data is listed as missing, never counted as zero. Zero loss is reported only as zero *within the product's definition of tree cover*.
- **No inference.** Never "threat", "exposed", "encountered", "affected", "habitat", "impact", "risk", "safe". The closing sentence above is fixed text.
- **Present day kept separate.** Option J-D5: one line, "Today's observations for this area are on Earth now (Everything here). They describe November 2026, not this journey", with a link to the cell's panel, or nothing.

### 3.3 The sea journeys

The shark, false killer whale and albatross cards get one sentence: "No land or forest context is shown: this journey was recorded at sea." Marine context for those periods (for example the CoralTemp sea-surface temperature already used for buoys, which runs from 1985) would be a separate proposal and is not part of Workstream C as handed over.

### 3.4 Sensitivity

The cells touched add nothing beyond the track and corridor already public. For the corridor, the count is for the whole cell `32_15`, never per use class, so no Low-class geometry is used or implied. The albatross's withheld colony fixes are not used.

## 4. How it would be built (no hub route, no collector, no schedule)

Journey context is a property of a dated archive. So it follows the journey-file pattern, not the live-feed pattern:

- A builder (`phase1/animals/build_journey_context.py`) runs **once per journey and revision** and writes `assets/animals/<journey>-context-R1.json`. The page pins the file by sha256, as it does the journey files, and the builder has a `--check` that fails on any difference.
- **Fires:** the builder reads FIRMS standard-processing CSV for the cells' bounding box and period, ten days a request. Zebra: about 37 requests (one sensor). Corridor: about 292 a sensor. FIRMS allows 5,000 a key per 10 minutes. It keeps only counts per month or year and per sensor; no detection row is committed or served. It uses the existing FIRMS map key, read by a script from `KEYS.md` and never printed. Where it runs is decided at the evidence step: the workspace cannot reach FIRMS, but the browser pane can.
- **Tree cover loss:** counts from the Hansen 10° `lossyear` and `treecover2000` tiles that cover the cells (zebra 2–4 tiles, corridor 1). They are downloaded once by the route the evidence step finds, kept on the Mac, and never committed (raw source data is never committed or served).
- Wording lives in the Animals page script, with the rules of §3.2 as tests.

## 5. What it does not do

No route intersection or distance claim; no buffer. No inference about distress, population, mortality, habitat or cause. No current alerts beside a journey as if contemporary. No new live feed, hub route, D1 table or schedule. No change to the journey files, the corridor or the census. No soil carbon (Workstream B). No marine context. No change to IUCN R1 or the parked assessment card.

## 6. Decisions for Chad (Claude's recommendation first)

| | Question | Options | Recommendation |
|---|---|---|---|
| J-D1 | Is dated context beside a journey part of the journey archive exception (recorded journeys are the one archive feature)? | A yes, as fixed dated files beside the journeys only · B no | **A**, because the context is about the journey's own period, so a live feed cannot supply it |
| J-D2 | Which | A zebra and corridor, sea cards get the one sentence · B zebra only · C zebra, corridor, and no sentence on the sea cards | **A** |
| J-D3 | Products | A fires and tree cover loss · B fires only · C tree cover loss only | **A**, subject to the evidence step. Integrated alerts and soil carbon are not used |
| J-D4 | Spatial unit | A the 4° cells touched · B the track's bounding box | **A**: the same grid as the place panel, so it can't be read as tighter than it is |
| J-D5 | Present-day line | A one separated line linking to the cell's panel · B none | **A** |
| J-D6 | Fire sensor | A MODIS for both (one record from 2000, 1 km) · B MODIS for the zebra, VIIRS S-NPP (375 m, from 2012) for the corridor | **A**, for one consistent product across both cards. B is finer for the corridor but means two products |

## 7. Next steps, in order

1. **GPT reviews this proposal.**
2. **Chad's go** for an evidence step (docs only), with his J-D1 to J-D6 choices.
3. **Evidence step:** read the FIRMS terms, citation, `data_availability` and `missing_data` for the periods; read the Hansen user notes, version and licence, and find the tile route; one dry-run count for the zebra's cells. Output: an evidence record and a build brief.
4. **GPT, then Chad's go** for a branch build (C1, private preview), then candidate review, then Chad's lines.

## 8. Acceptance for a C1 candidate (from spec criterion 7 and §7, made testable)

- Every number shows its product, period, area and unit; the journey's period comes first.
- A product that does not cover the period shows nothing, and the block says so. Missing satellite days are named.
- None of the forbidden words in §3.2 appears in the block (checked by the suite); the closing sentence is present.
- Nothing new is drawn on the globe; no coordinate below cell level is committed or served.
- Context files are pinned; the builder's `--check` fails on any difference; a changed file without a changed pin is refused by the page.
- The Animals suites (`animals-tab-ui`, `animals-corridor-ui` and the rest) pass on the integrated tree, with new breaks for the rules above.
- Phone, Safari and screen-reader checks stay unverified until actually performed.
