# DRAFT — REGISTER entry for the Sun globe's picture (not filed)

2026-11-14 · for GPT's check and Chad's Approve line · to be added to `REGISTER.md` on branch `sunglobe-rc`, reaching main with the page push.

---

## NASA Solar Dynamics Observatory — HMI continuum "latest" browse image `latest_1024_HMIIC.jpg` — **hourly hub collection enabled 14 Nov 2026; shown as the Sun globe on `sun.html` once released**
- **Filed:** <date and time> on Chad's line "<Approve line>".
- **Source:** NASA Solar Dynamics Observatory, https://sdo.gsfc.nasa.gov/data/ . File `https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIIC.jpg` — Helioseismic and Magnetic Imager continuum intensity, colourised by SDO, 1024 × 1024 JPEG, about 200 KB. SDO's "Best Practice" page (read 13 Nov 2026 by Claude through the page-fetch tool, a summary not a byte copy) says the latest images are "updated every 15 minutes" and gives that address pattern.
- **Request method:** **scheduled** — the hub (Cloudflare Worker) makes one request an hour, with no retry, when `SUNFACE_ENABLED=1` (set 14 Nov 2026 06:44:21 UTC; first manual run 06:38 UTC; first scheduled run 07:07 UTC). User-Agent sent: `mother-earth-collector/<version> (+https://github.com/TheOneTheOnlyTheChad/mother-earth; contact: issues at that address)`; whether SDO's server received it is not verified. The page never calls SDO. SDO's own example fetches every 15 minutes; we ask a quarter as often. No stated limit on automated access was found on the pages read.
- **Reuse terms (SDO "Data Rules" page, read 13 Nov 2026 by Claude through the page-fetch tool):** SDO images are not copyrighted unless a specific item says otherwise; use for non-commercial purposes and public education and information efforts is encouraged and needs no express permission; credit is requested. NASA's general "Images and Media Usage Guidelines" (read directly in the browser pane 13 Nov 2026) add that NASA should be acknowledged as the source and that use must not imply endorsement. Mother Earth is a non-commercial public-information page. **Both SDO pages were read as summaries; the operative sentences should be re-read directly before or soon after filing.**
- **Credit asked, and shown:** "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams." — on `sun.html` (Sources and method) and in `sources.html`.
- **What we keep and show:** the bytes unchanged in our storage (`sunface/images/<id>/sun.jpg`), the current and previous picture served. Three times kept apart: the file's Last-Modified ("File updated at …", shown), the hub's retrieval time (shown), and the observation time (**not known; never shown**). A picture is displayed for at most three hours after its file-updated time.
- **Our modifications (display only):** wrapped on a sphere by orthographic projection from the disc centre and radius measured in the picture and the solar tilt B0 computed for the date (Meeus); the limb band beyond 0.97 of the radius, the sky and SDO's printed caption are not drawn; the rest of the sphere is drawn plain and labelled "outside this image's view".
- **Placement check (ours, once):** 14 Nov 2026, picture `20261114T070005Z-4bc25d7a146de6fd` against NOAA SWPC Solar Region Summary No. 318 (positions valid 13 Nov 24:00 UTC): six regions matched within about 1° of latitude and 4° of longitude after allowing for rotation; solar north is up in SDO's browse image. A one-off manual read of an SWPC text product already registered; not a run-time source.
- **Not used:** SDO's other channels and sizes; the dated browse files; the synoptic maps.
- **No endorsement implied.** No NASA or SDO logo is shown; SDO's printed caption is masked.
- **Commercial use:** SDO's page speaks of non-commercial and public-information use; commercial use is not addressed there. Mother Earth makes none.

---
