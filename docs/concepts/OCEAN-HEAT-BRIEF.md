# Mother Earth — Ocean Heat

**Status** — Proposed proof of concept  
**Scope** — One dated, global view of sea surface temperature anomalies on the existing Mother Earth globe  
**Constraints** — $0/month, no new backend service, no automatic ingestion and no production deployment

Start with a docs-only proposal for GPT review. Call out anything that needs a source-file check and what that check would establish. Bring the proposal back before starting the build.

## 1. What are we trying to show?

**Where is the ocean warmer or colder than it usually is for this time of year?**

A surface temperature of 18 °C tells you how warm the water was. An anomaly of +1.4 °C tells you how that compares with what’s usual for that place and season. The anomaly is what we colour on the globe. A tap shows both values where available.

The first interaction should be simple. Turn on **Ocean Heat**, spin the globe, tap the water and see what the colour means.

**The first preview must be global.** Cape Point is our first coastline test. A visitor should be able to spin from the Cape to the Pacific or the Northern Hemisphere and explore the same dated snapshot wherever NOAA has valid data.

## 2. What the visitor sees

- Add an **Ocean Heat** toggle to the existing globe. It starts off and loads the snapshot on first enable.
- Use a diverging colour scale centred on **0 °C**. Blue means colder than usual, neutral means near normal, and orange means warmer than usual. Label the legend **“Difference from normal for this time of year (°C).”** NOAA’s roughly ±0.2 °C near-normal band is a starting point. State the proposed cutoffs in the build proposal.
- Show the actual data date beside **“Dated snapshot · NOAA Coral Reef Watch.”** Keep the date visible while the layer is on.
- Use the existing inspector where practical. For a valid water cell, show **sea surface temperature**, **difference from normal**, and **data date**. Use plain wording such as **“Surface temperature 18.0 °C”** and **“+1.4 °C warmer than usual.”** Use a minus sign for cooler water.
- Explain “normal” briefly in the inspector. Suggested wording is **“Compared with NOAA’s usual surface temperature for this location and time of year.”** Put the exact reference period and methodology in Sources.
- Make **land**, **near-normal water** and **unavailable ocean data** distinguishable. For unavailable ocean data, show **“No data for this location.”** If the anomaly is valid and its matching SST value is missing, keep the anomaly and mark the surface temperature unavailable. Missing values must never become zero.

Turning the layer off removes the overlay and its legend. If the snapshot is still loading when someone switches it off, the completed load must respect that choice.

## 3. Source and interpretation

Use NOAA Coral Reef Watch’s **v3.1 daily global 5 km** products. Use the published **Sea Surface Temperature Anomaly (SSTA)** for the map and matching **CoralTemp Sea Surface Temperature (SST)** for the inspector. Pick one day for which both files are available. Verify the data date, grid and units from the files, and record the product versions, source URLs, coverage and file hashes.

Use the anomaly NOAA publishes. For this product, NOAA derives a daily reference from monthly climatology for each location. The underlying climatology uses 1985–2012 data and is adjusted to represent **1985–1990 plus 1993**. Record that distinction in Sources and confirm it against the exact product selected.

Describe SST as a **satellite-derived estimate of the ocean surface**. It represents a grid cell and can differ from a nearby beach or buoy reading. It gives no temperature for the water below the surface. A single warm snapshot is insufficient to identify a marine heatwave or coral bleaching.

[NOAA Coral Reef Watch product suite and downloads](https://coralreefwatch.noaa.gov/product/5km/) · [NOAA methodology](https://coralreefwatch.noaa.gov/product/5km/methodology.php) · [NOAA climatology definition](https://coralreefwatch.noaa.gov/product/5km/description_climatology.php)

## 4. Small first build

1. **Prepare one lightweight static global snapshot.** Bundle it with the frontend. Propose a display resolution and report the transfer size. No Worker, cron, upstream calls from the browser or historical store.
2. **Keep the colour and the inspector tied to the same cell.** Use one snapshot identity and one coordinate mapping for both. A tap resolves to the displayed cell, including at the 180° longitude seam. It must never jump to the nearest valid patch of water. Reject a mismatched date or grid before drawing the overlay.
3. **Preserve the coastline and data gaps.** If native resolution is too heavy, propose a coarser **global** display. Explain what each display cell represents and disclose the display resolution in the UI. Preserve land and missing-data masks through preparation and rendering. Avoid smoothing across land or filling gaps with neighbouring values. Show what the chosen approach does off Cape Point.
4. **Reuse the existing globe and inspector where practical.** Verify that the default-off layer makes no snapshot request, that enabling it loads the bundled data, and that switching it off clears the overlay and legend.

## 5. What counts as done

Test on desktop and a phone-sized viewport. Record whether the phone test was on a physical device or in emulation. Report first-enable payload size, time to show the layer, and how rotation and tapping behave with the layer on.

Give GPT a preview and a short table of test coordinates, NOAA source values and expected inspector results. Include:

- Water off Cape Point and nearby land.
- Open ocean in the Pacific and a Northern Hemisphere coastline.
- Water on both sides of the 180° longitude seam.
- Near-normal water, unavailable ocean data, and a valid anomaly with missing SST. Use a fixture where needed.
- A mismatched date or grid fixture that the layer rejects.

The proof of concept is ready for review when someone can open the preview, spin to the Cape or another ocean basin, tap the water and answer **How warm was it? Was that warmer or colder than usual? What date is it from?** Where data is missing, that should be clear too.

Bring back the preview, snapshot provenance and mobile performance findings before proposing automatic updates. If the layer earns its place, the next step can be a latest-snapshot refresh with freshness handling. Keep **Follow the Swell** on the backlog as a separate offshore forecast.