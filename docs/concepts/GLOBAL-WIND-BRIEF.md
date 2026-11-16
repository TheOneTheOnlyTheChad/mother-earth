# Mother Earth — Global Wind by Height

Status: Proposed · Scope: Global from the first release

## 1. What are we trying to show?

How is the air moving here, and how does that change with height?

Add an optional Wind layer to the existing Mother Earth globe. A visitor can rotate anywhere on Earth and switch between three levels while keeping the same camera, zoom, selected point and model time. The first release covers land, oceans and both polar regions. Cape Town is one test location within global coverage.

## 2. Globe experience

Wind is off by default. Turning it on opens Near ground.

| Label | GFS level | How to read it |
| --- | --- | --- |
| Near ground | 10 m above the model’s local land or water surface | Regional near-surface wind. The display grid cannot resolve street, building or local terrain effects. |
| Jet-stream height | 250 hPa, roughly 10–11 km | Winds at a pressure level where jet streams are often visible. |
| Stratosphere | 10 hPa, roughly 30 km | High-altitude circulation, including winds around polar vortices. |

The upper levels are pressure surfaces. Their actual heights vary. Give the pressure level in the inspector and use approximate altitude for orientation.

Use one fixed km/h colour scale across all three levels. Choose the scale from real cycles so weaker near-ground winds remain distinguishable and strong upper-level winds have room on the legend. Use moving particles or static arrows for flow direction. Default to static arrows for reduced motion and provide a manual animation toggle.

The particles illustrate horizontal airflow in one frozen model snapshot. They do not advance model time, forecast future movement or show where a particular air parcel will travel.

Tap or click a valid point to inspect wind speed, the direction it comes from, the selected level and the valid time. Example: “From west (270°), 35 km/h.” An arrow points where the wind is going. Use an explicit display threshold for calm or very light wind, proposed at under 1 km/h, and omit its bearing. Show missing values separately. At the exact geographic poles, show a valid speed if available and omit the compass bearing and any arrow whose direction is undefined.

When switching levels, update the field, label and inspector together. If the requested level fails to load, keep the previous valid field under its own label and identify which level failed.

## 3. Source and freshness

Use NOAA’s Global Forecast System analysis at forecast hour zero (`f000`). GFS runs at 00:00, 06:00, 12:00 and 18:00 UTC. Files arrive after the named cycle time.

Start with NOAA’s published 1° global product because the first display grid is also 1°. The inventory contains all six required messages: the U and V wind components at 10 m above ground, 250 hPa and 10 hPa. The feed listing and inventory were checked. Downloading and decoding a complete recent cycle is the first test. Try NOAA’s 0.25° product if the 1° path fails or if finer inputs give a visibly better result after resampling to 1°. Use one source grid for all three levels in a revision.

Show “Modelled wind · NOAA GFS · Valid at [date and time UTC]” while the layer is visible. The source panel explains that observations inform the model and that global coverage does not imply a direct measurement everywhere. Record source resolution, display resolution, model cycle, valid time, retrieval time and publication time separately.

| Age from valid time | Behaviour |
| --- | --- |
| Under 12 hours | Show the latest complete analysis. |
| 12 to under 24 hours | Keep the field visible with a persistent Stale label and its valid time. |
| 24 hours or more, or no usable revision | Hide the field and inspector values. Show Unavailable and the reason when known. |
| No valid vector at the selected location | Show “No model value here.” |

Apply the age thresholds while the page is open and recheck them when the tab returns to the foreground. Retrieval and publication times cannot extend freshness.

## 4. Data pipeline and performance

1. Prove one complete global cycle. Retrieve just the six required GRIB messages. Prefer indexed HTTP byte ranges where supported. The NOMADS filter can also select the variables and levels with regional subsetting off. Decode locally with ecCodes or wgrib2. Check that each message is present exactly once and that cycle, valid time, grid, units, scan order and component orientation agree. Preserve missing values.

2. Prepare three compact display grids. Normalize vectors to eastward and northward components in m/s. If resampling is needed, resample the components before computing speed or direction. Handle longitude wrap and the polar coordinate singularity explicitly. Use the same sampling rules for colour, flow and the inspector. An example encoding uses two signed 16-bit values per cell, a scale of 0.1 m/s and a reserved missing code. A 360 × 181 grid takes 260,640 bytes per level before the header. Target no more than 300 KB per level before HTTP compression.

3. Publish all three levels as one revision. Write the immutable grids to R2 before switching the hub manifest. Include schema version, revision, cycle and valid time, grid metadata, file lengths and hashes. Reject incomplete, corrupt or out-of-order imports. Make retries safe and prevent a late import from replacing a newer cycle. Keep the previous complete revision briefly for clients holding its manifest, subject to the same freshness rules.

4. Load on demand. Fetch no wind data while Wind is off. On activation, fetch the manifest and selected grid only. Cache verified grids by revision and level. Keep the same revision as the visitor switches heights, even if a new cycle has arrived. Refresh to a new revision with its field and timestamp together. Ignore late responses for superseded selections, pause animation in background tabs and release animation resources when Wind is disabled.

5. Automate before release. Use a private preview to measure decoder runtime, memory, network transfer, R2 writes and storage, request volume and mobile rendering. Reuse the existing paid Cloudflare setup and evaluate incremental cost. Prove unattended acquisition, publication and recovery through a missed or failed cycle before public release. Browsers read from Mother Earth without making per-visitor calls to NOAA.

## 5. Acceptance

- Global coverage. Check Cape Town, an open-ocean location, both sides of the Pacific date line and both polar regions. All three levels should be selectable across the globe. Check for seams, false polar spikes and visibly distinct calm and missing states.
- Scientific correctness. Compare output against a real source cycle at independently checked locations in both hemispheres. An eastward vector draws east and reads from west. A northward vector draws north and reads from south. Check missing components, interpolation across missing data and the exact-pole behaviour.
- Consistent comparison. Switching heights preserves the camera, selected point and valid time. The field, card, legend and inspector identify the same revision and level.
- Resilience. Simulate a missing message, corrupt grid, failed upstream request, overlapping imports and rapid switching on a slow connection. Verify both age thresholds, including after resuming an open tab.
- Mobile and accessibility. Check legibility, keyboard controls, reduced motion, static arrows and responsive rotation on an agreed representative phone. Confirm zero wind requests before activation.

Delivery order: verify the six fields from one recent global cycle, then test the globe privately. Review the data path, rendering and operating cost before deciding on public release. If neither NOAA route produces a credible three-level global preview, stop there.

Forecast playback, seasonal comparisons, gusts, public history and finer regional zoom are follow-ons.

## Sources

- NOAA 1° NOMADS feed: https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl
- NOAA 1° f000 field inventory: https://www.nco.ncep.noaa.gov/pmb/products/gfs/gfs.t00z.pgrb2.1p00.f000.shtml
- NOAA 0.25° NOMADS feed: https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl
- NOAA NOMADS access guidance: https://nomads.ncep.noaa.gov/info.php?page=gribfilter
- NOAA GFS open-data mirror: https://registry.opendata.aws/noaa-gfs-bdp-pds/