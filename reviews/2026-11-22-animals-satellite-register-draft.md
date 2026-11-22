# REGISTER draft: regional request under the Animals corridor (NASA GIBS). NOT FILED

22 Nov 2026 · draft rev 1 · branch `animals-satellite-rc`. For GPT's review. Filed only on Chad's own Approve line, with or before the merge. Nothing here is in `REGISTER.md` yet.

**Where it goes:** one more bullet under the existing entry "NASA GIBS — WMS imagery (VIIRS NOAA-20 true colour)", after the Night lights bullet. No new source, layer, terms or credit.

**Proposed text:**

- **Regional picture under the Animals corridor, added [date of filing] (filed on Chad's Approve line; draft `reviews/2026-11-22-animals-satellite-register-draft.md`, reviewed by GPT):** the same layer as the page backdrop, `VIIRS_NOAA21_CorrectedReflectance_TrueColor`, for the same date (the UTC date 36 hours before the page opened), asked for one fixed box instead of the whole globe. Same terms and the same single LANCE acknowledgment already in the footer.
  - **Access:** WMS 1.3.0 GetMap, `CRS=EPSG:4326`, `BBOX=37.8,-119.8,38.8,-118.6` (south, west, north, east), 960 × 800, JPEG, from the reader's browser only. Nothing when the page opens. **One automatic attempt** the first time the reader switches the East Walker corridor on; a picture that arrives is kept in the page's memory and reused for every later switch-on; any further attempt is made only when the reader presses "Try the regional picture again". **Maximum by the code: three attempts per page load**, a stopped one included. No request on pan, zoom, resize or animation frame.
  - **Limits:** 20 seconds to answer, 5 seconds to decode; an answer that is not an image of exactly 960 × 800 is refused (GIBS can answer HTTP 200 with an XML error page: seen 22 Nov 2026 on the whole-globe request, cause not established).
  - **Grid (read 22 Nov 2026 in GIBS's WMTS capabilities by Claude; GPT read NASA's GIBS API documentation, "Tiled Access Resolutions", independently):** the layer is in the `250m` tile matrix set, nine levels, finest spacing 0.002197265625° a pixel. The 960 × 800 request (0.00125° a pixel) enlarges that grid about 1.76 times and adds no detail. Grid spacing is not instrument detail or positional accuracy.
  - **What the page says:** "Regional backdrop: NASA satellite imagery for [date]. It may contain cloud, gaps or visible edges between satellite passes. It is not from the study's years and shows nothing about the animals or their habitat then." and "GIBS image grid about 250 m per pixel, enlarged for display." A failed or refused answer is said as "Regional satellite picture unavailable." The page does not judge cloud.
  - **Volume:** interactive use, at most three small requests per page load, far below the bulk-download guidance already recorded in this entry. The site's total traffic to GIBS is not measured.
  - **No enquiry sent.**
  - **Status:** cleared with the entry's existing terms. **Commercial use:** as the entry.
