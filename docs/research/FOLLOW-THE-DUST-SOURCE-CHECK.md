# Follow the Dust — Orange River source packet (rev 1, 12 Nov 2026)

**For:** GPT's source and design review, then Chad's decision. Docs and research only: nothing has been built, copied into the site, uploaded or deployed.
**Brief:** `docs/concepts/FOLLOW-THE-DUST-BRIEF.md` (Chad's spec v1, filed verbatim; attachment sha256 `1398c3f2…cbe6`).
**Companion:** `docs/concepts/FOLLOW-THE-DUST-PROPOSAL.md` (where it sits on the globe, and the build plan).
**Mac packet:** `~/Documents/Mother Earth/research/follow-the-dust/2026-11-12-claude/` (callout draft image, LOG, hashes).

Evidence tags:
- **[pane]** = read by Claude in the browser pane, page text or in-tab `fetch` + SHA-256. Times are the pane clock (`new Date().toISOString()` in the same call) unless stated otherwise.
- **[fetch]** = Claude's web-fetch tool, which returns a model summary rather than the page bytes. Treat it as a lead, not a quotation.
- **[ours]** = Claude's own reading of the image. Nothing NASA says.

---

## 1. The source page [pane, read 13:21 UTC 12 Nov 2026]

- **URL:** https://science.nasa.gov/earth/earth-observatory/dust-storm-in-southern-africa-145659/
- **Title:** "Dust Storm in Southern Africa". Image of the Day for 26 September 2019. Instrument tag: "Suomi NPP — VIIRS". Topics: Droughts, Dust Storms.
- **Page metadata:** `article:published_time` 2019-09-26T12:00:00-04:00; `article:modified_time` 2026-01-31T07:02:47-05:00. The page has been re-published since 2019, most likely in the move from earthobservatory.nasa.gov to science.nasa.gov; see §2's Last-Modified dates.
- **Operative text (verbatim):**
  - "People in coastal towns along the west coast of southern Africa watched skies turn red on September 25, 2019. Fierce wind picked up and carried huge plumes of sand and dust westward toward the Atlantic Ocean."
  - "The plumes were observed that day at 2:25 p.m. South Africa Standard Time (12:25 Universal Time) with the Visible Infrared Imaging Radiometer Suite (VIIRS) on the NOAA-NASA Suomi NPP satellite. The event covered a wide area north and south of the Orange River, which forms part of the border between Namibia and South Africa."
  - The page also reports visibility from the South African Weather Service, photographs from Alexander Bay, and aircraft unable to land. These come from News24 (25 Sep 2019), which NASA cites. **They are second-hand. Do not put them in a callout.**
- **Credit (verbatim):** "NASA Earth Observatory image by Lauren Dauphin, using VIIRS data from NASA EOSDIS/LANCE and GIBS/Worldview, and the Suomi National Polar-orbiting Partnership. Story by Kathryn Hansen."
- **Image caption on the page:** "September 25, 2019" (date only).

**What NASA identifies, and what it does not:** NASA calls the plumes "plumes of sand and dust", in the plural. It does not single out any one plume in the image. Whichever plume a callout points at, **that choice is ours**, and the callout must say so (§5).

## 2. The exact image [pane: in-tab fetch, no-store, SHA-256 over the bytes, 13:21:42 UTC]

| File (NASA's download link) | Bytes | Pixels | SHA-256 | Last-Modified |
|---|---|---|---|---|
| `saduststorm_virs_2019268_lrg.jpg` (the "JPEG (3.20 MB)" download) | 3,360,267 | 3757 × 3131 | `eb7c02e98cb39777c7b5d0e56812c44767d31ec7cabb27d777245098a94bd2c7` | Wed, 27 Nov 2024 11:47:18 GMT |
| `saduststorm_virs_2019268.jpg` (the on-page image) | 255,003 | 720 × 480 | `7bec681f16bd3be333aa95a16c704023f7a27fa7b074fba06e5494eb5d95fd9d` | Wed, 27 Nov 2024 11:47:27 GMT |
| `map_145659.png` (locator map) | 28,206 | 300 × 150 | `bfe48830925884018760c9b4126a9d7f9b96c522db401369c84829e48084f65e` | Wed, 15 Oct 2025 06:59:26 GMT |

- **Base URL:** `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/145000/145659/`. Served as `image/jpeg` / `image/png`, with no ETag.
- **Proposed source asset: the `_lrg` file.** It is the full scene (3757 × 3131, aspect 1.2). The on-page 720 × 480 version is a narrower crop at aspect 1.5.
- **Pin it. Do not hotlink it.** NASA re-uploaded these files on 27 Nov 2024 (Last-Modified), so the bytes at this URL can change. The release would carry our own copy, pinned by SHA-256, with the NASA URL kept beside it.
- **Not yet copied onto the Mac or into the workspace.** Both shells are refused at the proxy (403 on CONNECT) for `assets.science.nasa.gov`, and the pane cannot save files without a download. Before any build, the original comes across once (proposal §6, step 0) and its hash must match the hash above.
- `2019268` in the file name is year + day of year: day 268 of 2019 = 25 September. That agrees with the page.

## 3. Reuse terms [pane, read between 13:24:19 and 13:26:46 UTC]

**Exact asset:** the image itself carries no third-party copyright notice. The credit line names only NASA, NOAA-NASA Suomi NPP and NASA systems.

**NASA Images and Media Usage Guidelines**, https://www.nasa.gov/nasa-brand-center/images-and-media/ (verbatim):
- "NASA content – images, audio, video, and media files used in the rendition of 3-dimensional models, such as texture maps and polygon data in any format – generally are not subject to copyright in the United States. You may use this material for educational or informational purposes, including photo collections, textbooks, public exhibits, computer graphical simulations and Internet Web pages."
- "NASA content used in a factual manner that does not imply endorsement may be used without needing explicit permission. NASA should be acknowledged as the source of the material."
- "NASA occasionally uses copyright-protected material of third parties with permission on its website. Those images will be marked identified as copyright protected with the name of the copyright holder."
- "The NASA Insignia, Logotype, identifiers, and imagery are not in the public domain. The use of the Insignia, Logotype and NASA identifiers is protected by law, and imagery is made available for use consistent with Media Usage Guidelines."
- Commercial: "NASA imagery can be generally used editorially within published works that are not promotional in nature." and "If the NASA material is to be used for commercial purposes, including advertisements, it must not explicitly or implicitly convey NASA's endorsement of commercial goods or services."

**The Earth Observatory's own policy page is gone.** `earthobservatory.nasa.gov/ImageUse` now redirects (302) to the Earth Observatory home on science.nasa.gov [fetch]. Archived copies exist, e.g. the UNT web archive, 2017 capture. Those archives are history, not current terms. We rely only on the live NASA-wide guidelines above.

**Requirement vs uncertainty vs project practice** (kept separate, per Chad's rule of 2 Nov):
- **Required by the guidelines:** acknowledge NASA as the source; imply no NASA endorsement; no NASA insignia or logotype (we use none).
- **Uncertain, flagged for Chad and GPT:** the same page now has a section headed **"Super Intelligence (SI) Applications"** (it cites a 29 Sep 2026 Executive Order). It says, verbatim:
  - "attribution of the information directly to NASA is not permitted";
  - "All outputs from the SI model should be attributed to the SI product itself, not NASA. References like "according to NASA" or similar are prohibited in SI products."
  - **Our reading:** the section governs SI products and model outputs. Mother Earth is a website that shows NASA's own image and quotes NASA's own published words, with the credit NASA supplies, reviewed and approved by a person. On that reading it is not an SI product.
  - **Two things argue the other way:** Claude drafts the callout text, and the brief asks us to "attribute the dust identification to NASA". The wording cuts directly across that ask.
  - **Proposal to stay clear of it:** callouts quote NASA's words in quotation marks with the page link ("NASA's Earth Observatory caption: '…'"), and never paraphrase a claim as "according to NASA". Our own descriptive sentences stay ours and say so.
  - **No permission is inferred either way.** Whether to ask NASA is Chad's decision. Nothing has been sent.
- **Project practice (recommended, not required):**
  - keep the full credit line verbatim;
  - add "Cropped and resized by Mother Earth; numbered callouts added by Mother Earth" under the image;
  - link the original page and the original file.

**REGISTER:** a new entry, *NASA Earth Observatory — Image of the Day assets (Follow the Dust)*, with commercial use "with attribution; no endorsement; SI section open". **It is filed only on Chad's line**, as with earlier sources.

## 4. Map location, verified separately [pane, Wikidata API 13:24:19 UTC; fetch, Ramsar]

- **Wikidata Q181475 (Orange River)**, P625 with qualifier P518 = river mouth (Q1233637): **−28.630833, 16.45** (precision 1″). Mouth of (P403): Q97, the Atlantic Ocean. The other P625 statement (source, −28.8966, 29.0179) is not used.
- **Ramsar site 526, "Orange River Mouth"** (South African side) [fetch]: site coordinates "28°35'59"S 16°28'28"E", i.e. −28.5997, 16.4744. This is a wetland site point about 4 km from the Wikidata mouth point. It corroborates the area, not the exact mouth.
- **The image agrees:** the border line in NASA's image meets the coast at image pixel (1960, 1345) of 3757 × 3131. That is where the river mouth sits on the image (§5, callout 1).
- **Proposed globe marker:** −28.631, 16.450 (Wikidata), shown to 2 decimals.
  - A river mouth with a sandbar moves. Treat the marker as a place reference good to about 1 km.
  - It carries **no claim** about where the dust came from. That is the brief's rule, and the label says so.

## 5. Proposed callouts [ours; positions measured on the 3757 × 3131 original in the pane]

Draft image: Mac packet `FTD-callouts-draft-full.png`.
- It is drawn on an 800 px **screen render** of the original, not on the original bytes (§2), so it is for placement review only.
- It also shows the proposed crop (proposal §4).
- Positions are fractions of the full original image, then re-expressed against the crop by the build.

| # | x, y (fraction of original) | Pixel (original) | Draft text (under the image) |
|---|---|---|---|
| 1 | 0.522, 0.430 | 1960, 1345 | **Orange River mouth.** The Orange River "forms part of the border between Namibia and South Africa" (NASA's caption). Shown as a place reference only; it does not mark where the dust came from. |
| 2 | 0.386, 0.527 | 1450, 1650 | **Pale tan plume over the Atlantic.** NASA's caption describes "huge plumes of sand and dust" carried "westward toward the Atlantic Ocean". This number marks the broadest pale area offshore at the time of the pass; which plume to number is our choice, not NASA's. |
| 3 *(optional)* | 0.399, 0.383 | 1500, 1200 | **Streaks north of the river mouth.** NASA's caption: "The event covered a wide area north and south of the Orange River." |

- **Callout 3 is optional.** The brief allows a third only if it "clearly identifies a second plume". NASA's text supports *an area north and south*, but not a separately identified second plume.
  - **My recommendation: release with 1 and 2.** Keep 3 in the manifest as a draft, unpublished, for Chad and GPT to decide.
- **Wording rule:** NASA's words in quotation marks; our descriptions plain and owned. No arrows, no motion, no direction beyond NASA's "westward".

**Things in the image a reader needs told** [ours, from inspection]:
- **White areas are cloud.** What lies under them is unknown. There is a large bank at top centre and a strip at far left.
- **The thin white lines appear to be national borders drawn on the image by NASA.** They are part of the source image, not our annotation.
- **The far left of the full image has a straight diagonal edge.** It looks like a join between two satellite swaths, which would mean the left strip comes from a different pass and time.
  - This is not confirmed. NASA gives a single time (12:25 UTC).
  - **The proposed crop leaves that strip out**, so the panel shows only the area NASA's single time covers. The edge is at about x ≤ 300 px at the crop's lowest row.
- **The image cannot show:** ground-level concentration, the full route, where the dust started, or what happened before or after the pass. The panel says so in one line.

## 6. Worldview / GIBS: lead only

- NASA's credit names "GIBS/Worldview". The matching GIBS layer would be `VIIRS_SNPP_CorrectedReflectance_TrueColor` for 2019-09-25.
- Per the brief, a matching date and instrument are **leads, not verification**. Nothing is painted onto the globe in the first release.
- Context: Suomi NPP stopped delivering new data on 2 Nov 2026 (REGISTER, GIBS entry). The 2019 archive is unaffected as far as we know. This has not been checked.

## 7. Open questions for GPT and Chad

1. **The SI section (§3):** is the quote-in-marks approach enough, or does Chad want to email NASA? Sending grants nothing, as with the earlier enquiries.
2. **Callout 3:** publish, or keep as a draft?
3. **Crop (proposal §4):** accept the crop that drops the far-left strip?
4. **Getting the original across (proposal §6, step 0):** Chad downloads it once in his browser, or Claude saves it from the pane to `~/Downloads` with his permission.
