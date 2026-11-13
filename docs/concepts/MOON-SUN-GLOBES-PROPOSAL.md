# Moon and Sun as real, spinnable globes — source check and proposal

Rev 2.3 · 2026-11-13 · written by Claude · rev 1 reviewed by GPT (changes listed in section 8) · docs only, nothing built

## 1. What Chad asked for

1. Two header tabs, Moon and Sun. (Separate small change: branch `nav-tabs-rc`, own packet.)
2. The Moon and the Sun shown as real-looking 3-D globes you can spin, like the Earth on the main page.
   "Keep them small like we did mother earth, they don't need to be full scale, just true views."
3. The Sky distance-zoom view to be fixed too, later. Not in this proposal.

Today `moon.html` and `sun.html` draw a flat diagram: a plain disc and the spacecraft path. That stays
(section 5); this proposal adds a globe above it.

## 2. Sources read on 2026-11-13 (UTC)

All figures below were read from the pages or from response headers in the browser pane, not estimated.

### 2.1 Moon — NASA Scientific Visualization Studio, "CGI Moon Kit" (svs.gsfc.nasa.gov/4720)

- Released 6 Sep 2019; page last updated 9 Jan 2026.
- Colour map from the LRO camera, global longitude-latitude layout, centred on 0° longitude.
  Source data covers 70°N–70°S; higher latitudes are filled from a lower-resolution laser-altimeter map.
- Files checked (HEAD, 200):
  - `lroc_color_2k.jpg` 2048×1024, 457,942 bytes, last modified 3 Dec 2025 (2025 version)
  - `lroc_color_poles_1k.jpg` 1024×512, 139,068 bytes (2019 version)
  - `ldem_3_8bit.jpg` 1024×512 elevation map, 111,552 bytes
- Credit asked: NASA's Scientific Visualization Studio.
- The page's own caveat: the colour maps are tuned for appearance, not for science; science users are
  pointed to the source mosaic. We must say so on the page.
- Not stated on the page: east/west direction of longitude. To check when building (a known crater's
  position settles it).

### 2.2 Sun — NASA Solar Dynamics Observatory (sdo.gsfc.nasa.gov)

- "Latest" images, updated every 15 minutes, fixed addresses:
  `…/assets/img/latest/latest_[512|1024|2048|4096]_[code].jpg`.
- Codes: 0094 0131 0171 0193 0211 0304 0335 1600 1700 (AIA wavelengths) and HMI products
  (hmii, hmiic, hmiif, hmib, hmibc, hmid).
- Files checked (HEAD, 200, all last modified 11:00–11:04 UTC today):
  - `latest_1024_HMIIC.jpg` 201,755 bytes (HMI continuum, colourised: the visible-light look, sunspots)
  - `latest_2048_HMIIC.jpg` 852,118 bytes
  - `latest_1024_0171.jpg` 191,385 bytes · `latest_1024_0304.jpg` 209,214 bytes
  - `latest_1024_HMIIF.jpg` 333,309 bytes
- Data rules page: images are not copyrighted unless marked; non-commercial and public-information use
  is encouraged without asking; credit line "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams."
- Best-practice page: suggests fetching at most every 15 minutes; no stated limits on automated use.
- **Each image is one view from near Earth. Half the Sun is not in it.**
- Synoptic (whole-Sun) maps were checked and are **not usable as "now"**: three extreme-ultraviolet
  channels only; newest is Carrington rotation 2311, files last modified 25 Jun 2026; 1140×540 PNG.
  The directory itself answers 403.

### 2.3 Not yet verified

- NASA's general media guidelines: read only as a search excerpt (the page would not load through the
  fetch tool). To be read directly before any REGISTER line.
- Whether the Worker can fetch `sdo.gsfc.nasa.gov` and `svs.gsfc.nasa.gov`. Only the pane was tested.
- The true observation time of a "latest" image. The Last-Modified header is when the file was written,
  not when the Sun was observed. The time is printed in the image; a machine-readable source is not found yet.
- The Sun's disc size and centre in the browse images (needed to wrap the picture on a sphere).
- The Moon-fixed version of the LRO example path (the catalogue holds it in J2000; see 3.1).

## 3. Proposal

### 3.1 Moon globe

- Same globe engine the Earth page already loads (globe.gl 2.45.0), same size and framing as the Earth.
- Texture: `lroc_color_2k.jpg`, with the elevation map as surface relief. We keep our own copy
  (hash pinned, served from the repo or R2). No hot-linking.
- Drag to spin, same controls as the Earth. Opens **evenly lit, on the familiar near side**.
- **Texture orientation is verified before release** against named landmarks with published coordinates
  (for example Tycho, Copernicus, Mare Crisium, and one far-side feature such as Tsiolkovskiy): each must
  appear at its latitude and longitude on the globe. This also settles the east/west direction the page
  does not state. The check is an automated test with a break.
- **"Lit as now" is not in the first Moon release.** It needs the Sun direction and the Earth-facing
  direction turned into the same Moon-fixed frame as the texture. Before it is added, a short addendum
  must state: the source of both directions, the rotation model used (IAU Moon rotation or Horizons
  sub-solar and sub-Earth longitude/latitude), and a cross-check against Horizons values for dated
  instants (illuminated fraction and sub-solar point), with a tolerance.
- **LRO stays in the existing diagram below the globe.** No orbit ring on the globe: a ring over
  recognisable terrain would imply a ground track. The path moves onto the globe only after the example
  (stored in J2000) has been turned into the Moon-fixed frame and that transform has passed a cross-check
  (IAU formula in the generator against a Horizons Moon-fixed request). That is a later change with its
  own catalogue revision.
- One sentence states the globe and the diagram are separate views.
- Words on the page: "Appearance map from NASA's Scientific Visualization Studio, tuned for looks, not
  measurement."
- No hub work. Page only.

### 3.2 Sun globe (first release: one channel)

**Collection (hub first)**
- One image per hour: `latest_1024_HMIIC.jpg` (HMI continuum). Nothing else. Gate `SUNFACE_ENABLED`.
  Page reads the hub, never SDO. A channel picker is out of the first release; it would need its own
  collection and per-channel timestamps.
- The hub record keeps three times apart and never merges them:
  1. **observation time** — unknown until a machine-readable source is verified; stored as null;
  2. **file updated** — the Last-Modified header SDO sent;
  3. **hub retrieved** — when the Worker fetched it.
  Plus address, bytes, sha256.
- **Age limit: three hours** (Chad/GPT, 13 Nov 2026). It is an age limit on the picture, not a count of
  fetches: three hourly fetches can all succeed and still return the same old picture.
  - The age is measured from the **verified observation time**. Until observation time is verified it is
    measured from the source's **file-updated time**, and the page labels it "File updated at …".
  - The age is evaluated **by the page at the moment it displays the image**, against the reader's clock,
    so the limit holds even if collection has stopped.
  - At three hours or more the image is not shown: "No recent picture" and the plain sphere.
  - When a fetch returns the same bytes (same sha256), the record **keeps the original timestamp**; only a
    separate "last checked" time moves. Identical bytes cannot extend a picture's life.
  - **The limit also runs in an open tab.** At three hours the page switches to "No recent picture" by its
    own timer, even if the tab was never reloaded and the hub has stopped answering; it rechecks when the
    tab is resumed. Tested just before the cutoff and exactly at it.
  - **A bad replacement does not displace a good image.** If a newly fetched image lacks a trustworthy
    timestamp, the hub rejects it and keeps the current one, which then expires on its original clock.
  - **"No recent picture" appears only when no valid picture remains.** A fetched image with no
    trustworthy timestamp (file-updated time missing, unparsable, or later than the hub's own retrieval
    time, and no verified observation time) is never published. If a still-valid picture is on screen it
    stays, and expires on its original clock; if there is none, the page shows "No recent picture".
- Kept: current and previous image only.

**Projection**
- The image is an orthographic view of the disc from near Earth. For each point on the visible
  hemisphere the texture pixel is found from the disc centre (cx, cy), the disc radius R in pixels, and
  the image's orientation. Needed and to be verified before release:
  - cx, cy, R: measured from the image (limb fit) and compared with the Sun's apparent radius for that
    date; whether the browse images hold the disc at a fixed size or let it change through the year is
    not known yet. If it varies, the hub measures it per image and stores it in the record.
  - orientation: whether "up" in the browse image is solar north (to be confirmed from SDO's own
    documentation, not assumed), and the tilt of the Sun's axis toward Earth (B0) for the date.
- **Mask:** pixels outside the limb are never drawn on the sphere. A narrow band inside the limb (width
  to be set from the measured limb-fit error) is also masked, because there one pixel covers a long strip
  of surface. Printed text and logos in the image corners fall outside the disc and are masked with it.
- Everything not covered by the masked disc is drawn plain and labelled **"Outside this image's view"**.
  (The wording "Not seen from Earth now" waits until observation time is verified.)
- Alignment check before release: a sunspot group's position on the globe against a published
  heliographic position for the same time, with a tolerance.
- The globe opens on the observed face.

**Words on the page until observation time is verified**
- "File updated at …" and "Retrieved by our hub at …". No "observed at", no "now".

**Ultraviolet channels (171 Å, 304 Å): not on the globe.** Their light comes partly from above the limb,
so wrapping them on the surface would put features in the wrong place. If added later they are shown as
flat, dated disc images beside the globe, each with its own collection and times.

**Parker** stays in the existing true-scale diagram below the globe; at closest approach it is about 10
Sun-radii from the centre (6.1 million km above a surface 0.7 million km from the centre), which a
globe-filling view cannot hold. One sentence says the two panels have different scales.

### 3.3 Scale statement (both pages)

"The Moon, the Sun and the Earth are each drawn to fill the view. Sizes are not comparable between pages."

## 4. Decisions

Settled by GPT's review of rev 1 unless Chad says otherwise:
- Moon opens evenly lit on the near side; "Lit as now" later, after its addendum.
- Sun: HMI continuum only, hourly, unseen side plain.
- LRO and Parker stay in their existing diagrams.

Settled 13 Nov 2026: the Sun picture's age limit is three hours, as written in 3.2.

## 5. What does not change

`craft.js` diagrams, the skycraft hub job, catalogues, Sky links. The globe is an added panel.

## 6. Stages (each needs its own Go / Approve line)

0. This document → GPT review → Chad's Go.
1. Moon globe on a branch (page only), with the landmark orientation test. Review.
2. **REGISTER: NASA SVS CGI Moon Kit** (Approve line) — before the Moon page is released.
3. Approve line to push the Moon globe.
4. Sun: `/admin/probe/sunface` (one request, stores nothing) on a hub build with the gate off. Approve: deploy.
   The probe also reports what is needed for the projection (image size, Last-Modified).
5. Sun hub job run once by hand, then schedule on. Approve lines as for skycraft.
6. Sun globe page on a branch, with the projection, mask and alignment checks. Review.
7. **REGISTER: SDO latest image (HMI continuum)** with the credit SDO asks for — "Courtesy of NASA/SDO
   and the AIA, EVE, and HMI science teams" (Approve line) — before the Sun page is released.
8. Approve line to push the Sun globe.

NASA's general media guidelines are read directly (not as a search excerpt) before step 2.

## 7. Risks and open points

- Wrapping a flat disc on a sphere stretches the edge (limb). Expected and stated; the edge is where the
  Sun turns out of view anyway.
- The Sun's tilt toward Earth (up to about 7°) and the image's north-up convention must be handled or the
  wrap is slightly wrong. To be checked against a known sunspot position before release.
- Storage: one ~200 KB image kept as "current" plus the previous; older ones not kept (unlike skycraft).
- Phone performance: two more globe pages. Use the Earth page's performance budget and tests.
- SDO outages: see the stop rule in 3.2.

## 8. Changes from rev 1 (GPT's review, 13 Nov 2026)

1. Moon: opens evenly lit on the near side; "Lit as now" removed from the first release until the frame
   transform is specified and cross-checked; landmark orientation test added.
2. Moon: no LRO orbit ring on the globe; the dated path stays in the diagram until its Moon-fixed
   transform passes a cross-check.
3. Sun: HMI continuum only; channel picker removed; ultraviolet channels, if ever added, as flat dated
   disc images, not wrapped.
4. Sun: projection specified by disc centre, radius and orientation; limb and off-disc pixels masked.
5. Three times kept apart; wording "File updated at …" and "Outside this image's view" until observation
   time is verified; stop rule defined; identical bytes cannot extend an image's life.
6. Each source's REGISTER entry moved ahead of its page release.

Still to verify during implementation (GPT's list, unchanged): globe alignment, image timestamps, Worker
reachability.

Rev 2.1: age limit set to three hours and written as an age limit (3.2); T1 closed.

Rev 2.2 (GPT's review of rev 2.1): the age limit also runs in an open tab and on tab resume; a
replacement without a trustworthy timestamp is rejected and the last good image expires on its own clock.

Rev 2.3 (GPT): one rule instead of two for a bad replacement — a valid picture stays; "No recent
picture" only when none remains.
