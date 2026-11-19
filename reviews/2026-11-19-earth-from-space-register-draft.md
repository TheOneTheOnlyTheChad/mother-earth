# REGISTER draft — Earth from Space (NOT FILED)

Draft for GPT's review. To be filed only on Chad's line, and only if the feature is released. Wording follows the existing Dust RGB entry.

## EUMETSAT — "GeoColour RGB - MTG - 0 degree" (collection `EO:EUM:DAT:0913`), pictures from the EUMETView map service, layer `mtg_fd:rgb_geocolour` — Earth from Space page — **not collecting; not on the site** (release candidate on branch `earth-from-space-rc`)
- **Source:** EUMETSAT. Catalogue entry https://user.eumetsat.int/catalogue/EO:EUM:DAT:0913 (read in the browser pane, 19 Nov 2026). EUMETView WMS `https://view.eumetsat.int/geoserver/ows`, layer `mtg_fd:rgb_geocolour`.
- **Licence (catalogue entry, verbatim):** "Free and unrestricted - CC-BY-4.0". Licence text: https://creativecommons.org/licenses/by/4.0/
- **Credit shown:** "Contains modified EUMETSAT Meteosat data <year>", the product name linked to the catalogue entry, "CC BY 4.0" linked to the licence, and "Night-time background within the product: NASA Black Marble". The catalogue entry asks that EUMETSAT and NASA be credited. No endorsement by either is stated or implied.
- **What is requested:** WMS 1.3.0 GetMap, `crs=EPSG:900003` (EUMETView's viewer configuration: "GEOS: MSG FES, MTG FD", `+proj=geos +h=35785831.0 +lon_0=0`), `bbox=-5500000,-5500000,5500000,5500000`, 2,048 × 2,048 `image/jpeg` with `bgcolor=0x0B1016`, and a 256 × 256 transparent `image/png` of the same view, both with an explicit `time`. One capabilities read and at most two pictures every ten minutes.
- **Our changes:** the request parameters above. The delivered JPEG is served unchanged. The check image is used for validation only and is not stored.
- **Frame time:** the time EUMETView names in its `Warning` header for the response. A frame is published only when that time equals the time requested, on both responses. Shown as "Source frame time". Scan start and end: not held, not shown.
- **Kept:** the current and previous picture, and others for 24 hours after leaving those roles; deleted only in a run that has just published a newer verified frame.
- **Not read by Claude or Chad:** the EUMETSAT Data Policy PDF (see the Dust RGB entry for GPT's reading of it, recorded as GPT's). **Not established:** what instant of the scan the frame time marks; whether EUMETView states service limits beyond its response headers (20 per context, 8 concurrent, read 19 Nov 2026).
- **Third-party code carried by the hub:** jpeg-js 0.4.4, `lib/decoder.js`, the `JpegImage` class, unmodified. That file's notice: Copyright 2011 notmasteryet, Apache License 2.0. The package's own licence file is BSD-3-Clause. The Apache notice is kept in `worker.js` beside the code.
