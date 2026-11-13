# DRAFT — REGISTER entry for the Moon globe's map (not filed)

2026-11-13 · for Chad's Approve line and GPT's check · to be added to `REGISTER.md` on branch `moon-globe-rc`, reaching main with the page push.

---

## NASA Scientific Visualization Studio — "CGI Moon Kit" colour map `lroc_color_2k.jpg` — **shown as the Moon globe on `moon.html` once released**
- **Filed:** <date and time> on Chad's line "<Approve line>".
- **Source:** NASA's Scientific Visualization Studio, "CGI Moon Kit", https://svs.gsfc.nasa.gov/4720 (released 6 Sep 2019; page last updated 9 Jan 2026). File `https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg` — the 2025 version of the colour map, 2048 × 1024, 457,942 bytes, sha256 `f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170`, source Last-Modified 3 Dec 2025. Fetched once, 13 Nov 2026 17:26:55 UTC, by Claude through the browser pane.
- **What it is (the page's own description, read 13 Nov 2026 by Claude):** a colour map of the Moon made from Lunar Reconnaissance Orbiter camera data, in a longitude-latitude layout centred on 0° longitude. The camera data cover 70°N to 70°S; higher latitudes are filled from a lower-resolution laser-altimeter map. The page says its colour maps are tuned for appearance rather than science and points science users to the source mosaic.
- **Request method:** none at run time. Our own copy is served from this site (`assets/moon/lroc_color_2k.jpg`, record in `assets/moon/SOURCE.json`). The page never calls NASA. Not hot-linked. No schedule.
- **Reuse terms:** the SVS page states no licence of its own. NASA's "Images and Media Usage Guidelines" (https://www.nasa.gov/nasa-brand-center/images-and-media/, read directly in the browser pane 13 Nov 2026 19:17 UTC by Claude): NASA content, including "texture maps and polygon data in any format", "generally are not subject to copyright in the United States"; it may be used "for educational or informational purposes, including … Internet Web pages"; "NASA should be acknowledged as the source of the material"; use must not imply endorsement. That the guidelines cover this SVS file is **our reading**; no third-party copyright mark was seen on the SVS page.
- **Credit asked by the source page:** "NASA's Scientific Visualization Studio". Shown on `moon.html` (under the globe and in Sources and method) and in `sources.html`.
- **Our modifications:** none to the file. It is wrapped on a sphere and evenly lit, which is stated beside the globe ("not how the Moon is lit today"); no sunlight, phase, spacecraft or time is drawn on it.
- **Orientation check (ours):** east to the right, north up, verified against seven feature centres from the USGS/IAU Gazetteer of Planetary Nomenclature read 13 Nov 2026 (Tsiolkovskiy, Mare Orientale, Mare Moscoviense, Mare Crisium, Mare Imbrium, Tycho, Mare Nubium); test `phase1/moon-globe.test.cjs`.
- **Not used:** the kit's elevation map; the larger colour files.
- **No endorsement implied.** No NASA logo or insignia is shown.
- **Commercial use:** the guidelines allow commercial use that does not imply endorsement, subject to their conditions; that is a reading of general guidelines, not a grant for this file. Mother Earth makes none.

---

Alongside it, on the same branch (page change, reaches the site with the push): a "Moon globe" paragraph in `sources.html` giving the source, the credit, "served unchanged from this site", and the looks-not-measurement caveat.
