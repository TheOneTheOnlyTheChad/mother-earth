# Follow the Dust — Orange River source packet (rev 2, 12 Nov 2026)

**For:** Chad's branch-build decision. GPT reviewed rev 1, and Chad relayed the review on 12 Nov. Docs and research only: nothing has been built, copied into the site, uploaded or deployed.
**Brief:** `docs/concepts/FOLLOW-THE-DUST-BRIEF.md` (Chad's spec v1, filed verbatim; attachment sha256 `1398c3f2…cbe6`).
**Companion:** `docs/concepts/FOLLOW-THE-DUST-PROPOSAL.md` rev 2.
**Mac packet:** `~/Documents/Mother Earth/research/follow-the-dust/2026-11-12-claude/`. It holds the callout draft image, LOG and hashes, and the **private working draft for a possible third callout**, which stays outside this repo and out of any generated manifest (D2).

**Revision history:**
- **Rev 1:** 12 Nov 2026, commit `2e9473b`.
- **Rev 2:** 12 Nov 2026, after GPT's review, relayed by Chad. Changes:
  - **Callouts:** two, worded by GPT.
    - Neither callout nor any legend implies that NASA selected or identified the marked feature.
    - Callout 3 is removed from this record and kept in the private working draft. **Rev 1, in git history, still contains callout 3's draft text and position.**
  - **Imagery:**
    - the diagonal edge is recorded as **unexplained**;
    - "one pass" becomes **"one published image" / "one dated view"**;
    - 12:25 UTC / 14:25 SAST is labelled the **source-reported** observation time;
    - the crop is recorded, with a link to the full original.
  - **Terms:** the SI-section reading is recorded as **our interpretation** (GPT reads it the same way). No NASA email for this scope.
  - **D5:** the original came across by browser download and matched the hash; the crop and both positions were rechecked on those bytes (§2a).

Evidence tags:
- **[pane]** = read by Claude in the browser pane, as page text or an in-tab `fetch` + SHA-256. Times come from the pane clock in the same call unless stated otherwise.
- **[fetch]** = Claude's web-fetch tool, which returns a model summary, not the page bytes. A lead, not a quotation.
- **[ours]** = Claude's own reading of the image, not NASA's statement.

---

## 1. The source article [pane, read 13:21 UTC 12 Nov 2026]

- **URL:** https://science.nasa.gov/earth/earth-observatory/dust-storm-in-southern-africa-145659/
- **Title:** "Dust Storm in Southern Africa". Image of the Day for 26 September 2019. Instrument tag: "Suomi NPP — VIIRS".
- **Page metadata:** `article:published_time` 2019-09-26T12:00:00-04:00; `article:modified_time` 2026-01-31T07:02:47-05:00. The page has been re-published since 2019.
- **Operative text (verbatim):**
  - "People in coastal towns along the west coast of southern Africa watched skies turn red on September 25, 2019. Fierce wind picked up and carried huge plumes of sand and dust westward toward the Atlantic Ocean."
  - "The plumes were observed that day at 2:25 p.m. South Africa Standard Time (12:25 Universal Time) with the Visible Infrared Imaging Radiometer Suite (VIIRS) on the NOAA-NASA Suomi NPP satellite. The event covered a wide area north and south of the Orange River, which forms part of the border between Namibia and South Africa."
  - The article also reports visibility, photographs from Alexander Bay and aircraft unable to land, citing News24 (25 Sep 2019). This is second-hand and stays out of the panel.
- **Image credit, as supplied (verbatim):** "NASA Earth Observatory image by Lauren Dauphin, using VIIRS data from NASA EOSDIS/LANCE and GIBS/Worldview, and the Suomi National Polar-orbiting Partnership." The article byline, "Story by Kathryn Hansen.", belongs to the text, not the image.
- **Observation time, source-reported:** 12:25 UTC (14:25 South Africa Standard Time), 25 September 2019. It is stated to the minute, and the image itself carries no timestamp.

**What the article does, and doesn't, say:**
- It describes the event as a whole: "huge plumes of sand and dust", "a wide area north and south of the Orange River".
- It does not single out any feature in the image.
- The callout-2 marker points to a feature **visible in the image**. That choice of feature is ours, and the callout says so (§5).

## 2. The exact image [pane: in-tab fetch, no-store, SHA-256 over the bytes, 13:21:42 UTC]

| File (NASA's link) | Bytes | Pixels | SHA-256 | Last-Modified |
|---|---|---|---|---|
| `saduststorm_virs_2019268_lrg.jpg` ("JPEG (3.20 MB)" download) | 3,360,267 | 3757 × 3131 | `eb7c02e98cb39777c7b5d0e56812c44767d31ec7cabb27d777245098a94bd2c7` | Wed, 27 Nov 2024 11:47:18 GMT |
| `saduststorm_virs_2019268.jpg` (on-page image) | 255,003 | 720 × 480 | `7bec681f16bd3be333aa95a16c704023f7a27fa7b074fba06e5494eb5d95fd9d` | Wed, 27 Nov 2024 11:47:27 GMT |
| `map_145659.png` (locator map) | 28,206 | 300 × 150 | `bfe48830925884018760c9b4126a9d7f9b96c522db401369c84829e48084f65e` | Wed, 15 Oct 2025 06:59:26 GMT |

- **Base URL:** `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/145000/145659/`
- **Source asset: the `_lrg` file.** It is the full published image. The on-page version is a narrower crop.
- **Pin it, don't hotlink it.** NASA re-uploaded these files on 27 Nov 2024, so we host our own copy pinned by SHA-256. The panel links NASA's article and **NASA's full original file**.
- `2019268` = day 268 of 2019 = 25 September.

### 2a. Bytes on the Mac (D5): done 12 Nov 2026
- **Download:** Chad downloaded NASA's full-size JPEG in his browser. The file was in `~/Downloads` at 13:41:59 (Mac file time).
- **Check (13:42:47 UTC, Mac clock):** 3,360,267 B, SHA-256 `eb7c02e98cb39777c7b5d0e56812c44767d31ec7cabb27d777245098a94bd2c7`. **That is exact** against the pane hash in §2.
- **Packet copy:** saved in the Mac packet as `originals/saduststorm_virs_2019268_lrg.jpg`, and the copy re-hashed identical. The copy in Downloads is left for Chad.
- **Rechecked on those bytes** (Python/PIL in the workspace, from a hash-checked staged copy; script `markup_rev2.py` in the packet asserts the hash and size):
  - **Callout 1 (1960, 1345):** a native-resolution ×3 view puts it at the coastal end of the border line, where the river meets the sea. **Confirmed.**
  - **Callout 2 (1450, 1650):** a native-resolution view puts it inside the pale tan feature offshore. **Confirmed.**
  - **Crop (650, 750)–(2550, 2250):**
    - it contains the mouth, the coastline either side and the offshore features;
    - the far-left diagonal edge is outside it, by about 435 px at the crop's bottom row: the largest brightness step there is at x = 215.
    - **Confirmed.**
  - **Positions as fractions of the crop** (what the manifest carries): callout 1 = 0.6895, 0.3967; callout 2 = 0.4211, 0.6000.

## 3. Reuse terms [pane, read between 13:24:19 and 13:26:46 UTC]

**This asset:** no third-party copyright marking. The image credit names only NASA, NOAA-NASA Suomi NPP and NASA systems.

**NASA Images and Media Usage Guidelines**, https://www.nasa.gov/nasa-brand-center/images-and-media/ (verbatim):
- "NASA content – images, audio, video, and media files used in the rendition of 3-dimensional models, such as texture maps and polygon data in any format – generally are not subject to copyright in the United States. You may use this material for educational or informational purposes, including photo collections, textbooks, public exhibits, computer graphical simulations and Internet Web pages."
- "NASA content used in a factual manner that does not imply endorsement may be used without needing explicit permission. NASA should be acknowledged as the source of the material."
- "NASA occasionally uses copyright-protected material of third parties with permission on its website. Those images will be marked identified as copyright protected with the name of the copyright holder."
- "The NASA Insignia, Logotype, identifiers, and imagery are not in the public domain. The use of the Insignia, Logotype and NASA identifiers is protected by law, and imagery is made available for use consistent with Media Usage Guidelines."
- Commercial: "NASA imagery can be generally used editorially within published works that are not promotional in nature." and "If the NASA material is to be used for commercial purposes, including advertisements, it must not explicitly or implicitly convey NASA's endorsement of commercial goods or services."

**The Earth Observatory's own policy page** (`earthobservatory.nasa.gov/ImageUse`) now redirects (302) to the Earth Observatory home [fetch]. Archived copies are history, not current terms. We rely only on the live NASA-wide guidelines above.

**Requirement vs interpretation vs project practice:**
- **Required by the guidelines:** acknowledge NASA as the source; imply no NASA endorsement; no NASA insignia or logotype (none is used).
- **Our interpretation, not NASA's statement:**
  - The same page has a section, "Super Intelligence (SI) Applications". It says "attribution of the information directly to NASA is not permitted" and "References like "according to NASA" or similar are prohibited in SI products."
  - We read it as governing SI models and their outputs. GPT reads it the same way.
  - The panel shows NASA's own published image with the credit as supplied, quotes the article's words in quotation marks with a link, discloses our crop and markers, and is human-approved.
  - The panel never paraphrases a claim as "according to NASA".
  - **No permission is inferred from this reading.** No NASA email for this scope (Chad's decision, D4).
- **Project practice:**
  - credit as supplied, verbatim;
  - "Cropped and resized by Mother Earth; numbered markers added by Mother Earth." under the image;
  - links to the article and the full original file.

**REGISTER:** a new entry, *NASA Earth Observatory — Image of the Day assets (Follow the Dust)*, with commercial use "with attribution; no endorsement; SI section read as not applying (our interpretation)". It is filed on Chad's line before the merge.

## 4. Map location, verified separately [pane, Wikidata API 13:24:19 UTC; fetch, Ramsar]

- **Wikidata Q181475 (Orange River),** P625 with qualifier P518 = river mouth (Q1233637): **−28.630833, 16.45** (precision 1″). Mouth of (P403): Q97, the Atlantic Ocean.
- **Ramsar site 526, "Orange River Mouth"** [fetch]: "28°35'59"S 16°28'28"E", i.e. −28.5997, 16.4744. This is a wetland site point about 4 km from the Wikidata point. It corroborates the area.
- **The image agrees:** the border line meets the coast at image pixel (1960, 1345) of 3757 × 3131 (§5; confirmed on the downloaded bytes, §2a).
- **Globe marker:** −28.631, 16.450.
  - It is a place reference, good to about 1 km, since a river mouth moves.
  - It makes no claim about where the dust came from.

## 5. Callouts: two, for release [positions ours, measured on the 3757 × 3131 original]

Text as GPT worded it (D2):

| # | x, y (fraction of original) | Pixel (original) | Text under the image |
|---|---|---|---|
| 1 | 0.522, 0.430 | 1960, 1345 | **Orange River mouth.** A place reference on the Namibia–South Africa border. |
| 2 | 0.386, 0.527 | 1450, 1650 | **Pale tan plume over the Atlantic.** This marker points to a feature visible in the image. The Earth Observatory article describes "huge plumes of sand and dust" moving west toward the Atlantic. |

- The article link and the image credit (as supplied) sit directly under the list.
- **Placement review:** the Mac packet has `FTD-callouts-draft-rev2.png`.
  - It is drawn from the verified original (§2a), cropped, with two markers.
  - The legend says the markers and crop are ours.
  - It is a placement draft, not the release image.
- **Not released:** any third marker. Its working draft is in the Mac packet only, with no text or position in this repo or in any generated manifest.

**What the panel tells the reader about the image** [ours, from inspection]:
- White areas are cloud. What lies under them is unknown.
- The thin white lines appear to be national borders drawn on the image by NASA. They are part of the source image.
- **The full original has a straight diagonal edge at the far left. It is unexplained:** NASA's article does not mention it, and we have not established what it is.
  - The release crop (proposal §4) leaves it out. The panel links the full original, so nothing is hidden.
- **What it is:** one published image, one dated view. **What it cannot show:**
  - how the plume moved over time;
  - ground-level concentration;
  - the full route or where the dust started.

## 6. Worldview / GIBS: lead only
- NASA's credit names "GIBS/Worldview"; the matching GIBS layer would be `VIIRS_SNPP_CorrectedReflectance_TrueColor` for 2019-09-25.
- A matching date and instrument is a lead, not verification. Nothing is painted onto the globe in the first release.

## 7. Next source reviews (first collection)
- **Namibia (11 July 2023)** and **the Saharan Atlantic plume (18 June 2020)**, each with a source packet like this one, then added as records and assets through the same viewer.
- **The first collection is finished when all three are published that way, subject to their source checks.**
