# Follow the Dust — entry point and first-release plan (rev 1, 12 Nov 2026, docs only)

**For:** GPT's design review, then Chad's decisions (§8).
**Brief:** `docs/concepts/FOLLOW-THE-DUST-BRIEF.md` (Chad's spec v1, verbatim).
**Sources:** `docs/research/FOLLOW-THE-DUST-SOURCE-CHECK.md` rev 1.
**Approved so far:** source and design review only. No branch, build, asset copy into the repo, REGISTER filing or page change is approved.

## 1. Shape in one paragraph
- **Where it starts:** a small "Follow the Dust" block in the globe page's Optional layers group lists dated events. One event to start.
- **What opening an event does:**
  - sets a stable link (`index.html#dust=orange-river-2019-09-25`);
  - flies the globe to the Orange River mouth and the nearby Atlantic;
  - drops one place-reference marker;
  - opens an image panel.
- **The panel:** shows NASA's image without our marks. "Explain what I'm seeing" adds the numbered callouts and their matching text.
- **Closing:** returns the camera, rotation and focus to where they were.
- **Hosting and cost:** everything is static files on GitHub Pages. No hub, R2, D1 or cron. **$0 in new cost.**

## 2. Entry point on the globe (proposed)
- **Where:** a new block `#card-dust` inside the existing **Optional layers** group (`#card-optional`, right column; on phones, the Readings sheet), after Ocean heat.
  - It is the same family: dated, observed, off until asked for.
  - It is not a layer, so it gets **no switch**: it holds a list of event links.
  - Heading: "Follow the Dust" with the evidence tag **Observed**, plus a one-line note: "Dated satellite images, one pass each. Not live."
  - Each event is one link: "West Coast dust storm · 25 Sep 2019".
- **Why there and not elsewhere:**
  - Explore is for searching loaded records.
  - A globe marker shown on load would clutter the globe that opens uncluttered (Chad, 3 Nov), and on its own it would not be keyboard-reachable.
  - The marker therefore appears **only while the event is open**.
- **The link:** the fragment `#dust=<event-id>`.
  - It needs no server, never reaches GitHub Pages, and does not reload the page.
  - The globe page uses no fragment today, so nothing collides.
  - Event IDs are permanent once released. A withdrawn event keeps its ID and shows a withdrawal note, as in the Timeline.
- **Opening view:** centre about −29.2, 15.4; globe.gl altitude about 0.45. These are tuned in the build so the river mouth and the offshore area both fit at the opening zoom, on desktop and at 390 px. The values tested go in the review packet.
- **Marker:** −28.631, 16.450 (source packet §4), labelled "Orange River mouth — place reference". It makes no claim about origin.

## 3. The panel
- **Desktop:** a non-modal panel over the centre column (globe visible beside it).
- **Phone (≤ 720 px):** a full-height sheet above the globe.
- **Order:**
  1. title;
  2. the observation line: "Observed 25 Sep 2019 · 12:25 UTC (14:25 South African time) · Suomi NPP / VIIRS";
  3. the image;
  4. the **Explain what I'm seeing** button (`aria-expanded`);
  5. the numbered callout list;
  6. "What this image can't show": one pass; no ground-level concentration, route, origin, or before and after; cloud and gaps unknown;
  7. credit, verbatim;
  8. "Cropped and resized by Mother Earth; numbered marks added by Mother Earth";
  9. links to NASA's page and NASA's original file;
  10. Close.
- **Callouts stay aligned on resize:**
  - the image sits in a box with the image's own `aspect-ratio`;
  - markers are positioned in **percent** of that box, from the manifest;
  - they move with the image at any width, with no JavaScript layout.
- **Marker style:** a number in a white disc with a dark outline, the same in both themes.
  - The text list carries the meaning, so nothing relies on colour or pointer position.
  - Markers are `aria-hidden`.
  - Hovering or focusing a list item outlines its marker. That is an extra, not the explanation.
- **Keyboard:**
  - the event link opens with Enter;
  - focus moves to the panel heading;
  - Tab order is the reading order;
  - Esc or Close shuts the panel and returns focus to the link that opened it.
  - **On a cold link,** focus goes to the heading. On close, it goes to the Follow the Dust heading.
- **History:**
  - opening from the card pushes the fragment, so Back closes the panel;
  - Close after a push = `history.back()`;
  - a cold-link close replaces the fragment with none and keeps the default view.
- **Fallbacks:**
  - **No WebGL:** the panel and text work and the globe step is skipped. The panel says the globe isn't available.
  - **Image missing, wrong hash or undecodable:** the panel keeps all the text and shows "Image not available — open NASA's image" with the direct link.
  - **Manifest missing or wrong hash:** event list items show "not available" with the NASA link. Nothing is drawn from unverified data.

## 4. Imagery (first release)
- **Source:** NASA's `_lrg` file (3757 × 3131, sha256 `eb7c02e9…d2c7`).
- **Crop:** x 650–2550, y 750–2250 (1900 × 1500).
  - It keeps the mouth, the plumes north and south, and coastline either side.
  - It drops the far-left strip that looks like a second swath (source packet §5).
  - Callout fractions are re-expressed against the crop by the generator.
- **Two derivatives,** `srcset` + `sizes`:
  - 1600 px wide, for desktop;
  - 960 px wide, for phones.
  - **JPEG quality is chosen by test:** the lowest quality at which the plume edges and the thin streaks north of the mouth still read on a 390 px screen, judged side by side with the original at the same scale. Bytes and quality are reported in the packet; a phone target of about 150–250 KB is expected, not assumed.
- **Not hotlinked.** Our copies are pinned by SHA-256 in the manifest, and the page pins the manifest's SHA-256. Every transformation (crop box, sizes, quality, tool and version) is recorded in the manifest.
- **Load only when the event opens:** no `<img>` is in the page on load; the browser fetches nothing from `dust/` until an event opens.
- **Nothing is painted on the globe.** Georeferencing is not verified (brief §2).

## 5. Data model (build once, add events as data)
Source of truth: `phase1/dust/events.json`. The generator `phase1/dust/build_dust.py` (pattern of the Timeline generator):
- **writes** `dust/manifest-<rev>.json` and the event list into `index.html` between `<!-- DUST:BEGIN/END -->`, so the card needs no request on load;
- **pins** the manifest's SHA-256 and revision in `dust.js`;
- **refuses:**
  - an event without ID, title, place, opening view or at least one observation;
  - an observation without a timestamp at the source's precision (stored as `"2019-09-25T12:25Z"` with `"precision": "minute"`), instrument, credit, source URL, original-file URL + SHA-256, crop, derivatives with SHA-256 and caption;
  - a callout outside the crop;
  - a callout without text;
  - a reused or changed released ID;
  - any private path.

**Event (illustrative):**
```json
{ "id": "orange-river-2019-09-25", "title": "West Coast dust storm · 25 September 2019",
  "place": { "label": "Orange River mouth — place reference", "lat": -28.631, "lng": 16.45, "basis": "Wikidata Q181475 P625 (mouth)" },
  "view": { "lat": -29.2, "lng": 15.4, "altitude": 0.45 },
  "observations": [ { "time": "2019-09-25T12:25Z", "precision": "minute", "local": "14:25 South African time",
      "instrument": "Suomi NPP / VIIRS", "credit": "NASA Earth Observatory image by Lauren Dauphin, using VIIRS data from NASA EOSDIS/LANCE and GIBS/Worldview, and the Suomi National Polar-orbiting Partnership.",
      "source": "https://science.nasa.gov/earth/earth-observatory/dust-storm-in-southern-africa-145659/",
      "original": { "url": "…/saduststorm_virs_2019268_lrg.jpg", "sha256": "eb7c02e9…", "px": [3757, 3131] },
      "crop": [650, 750, 2550, 2250], "images": [ { "w": 1600, "file": "…", "sha256": "…" }, { "w": 960, "file": "…", "sha256": "…" } ],
      "callouts": [ { "n": 1, "x": 1960, "y": 1345, "text": "…" }, { "n": 2, "x": 1450, "y": 1650, "text": "…" } ] } ] }
```
- Adding Namibia (11 Jul 2023) or the Saharan plume (18 Jun 2020) later = a source packet, then records + images. **No viewer change.**
- A before/during/after comparison later uses the same `observations` list.

## 6. Implementation plan (first release)
**Step 0 — the original comes across once** (Chad's choice, §8 D5). Hash check against `eb7c02e9…d2c7` before anything else.

**Step 1 — branch `dust-rc`.** One release branch, because a push to `main` publishes. New or changed files:
- `dust.js` (new page file, so served-hash checks cover **eleven** page files);
- `index.html` (block + panel shell, `?v=` bumps);
- `style.css` (scoped `.dust-*`);
- `phase1/dust/{events.json, build_dust.py}`;
- `dust/manifest-r1.json`;
- `dust/img/*.jpg`;
- `sources.html` (Follow the Dust section, with credits and terms);
- tests.

`app.js` is untouched unless the camera helpers need exporting. No `worker.js` change.

**Step 2 — tests:**
- `node phase1/dust-build.test.mjs`: generator refusals, re-expressed callout fractions, deterministic bytes, `--check`.
- `phase1/dust-ui.test.cjs` (Playwright, local server, globe.gl double where needed), checking:
  - normal load makes **no request under `dust/`**;
  - card → fragment → camera within tolerance → panel;
  - image hash verified;
  - Explain toggles 2 markers + list;
  - marker centres match the expected fractions to ±1 px at 360 / 390 / 768 / 1280 / 1600 widths;
  - keyboard order, Esc and focus return;
  - close restores point of view and auto-rotate;
  - cold link;
  - Back closes;
  - no-WebGL;
  - image blocked or tampered → fallback + NASA link;
  - manifest tampered → refused.
- **Breaks** (each must fail the suite): `eager-image`, `no-pin`, `px-markers`, `no-restore`, `no-focus-return`, `colour-only`, `hotlink`.
- Then the full regression.

**Step 3 — packet:**
- `reviews/<date>-dust-rc.md`;
- a hash-checked `_review/dust-rc/` copy on the Mac for GPT (served locally as before);
- screenshots at desktop and 390 px;
- chosen JPEG quality and bytes.

**Step 4 — real devices before merge:**
- desktop Chrome;
- **Chad's iPhone (Safari)**: the first real-phone check the brief asks for;
- VoiceOver if he's willing, since a screen reader is still untested on earlier releases.
- Chad is needed at the screen for this one.

**Step 5 — release:** `Approve: merge dust-rc to main (page change: Follow the Dust, Orange River)`, then served-hash checks on the eleven page files + manifest + images, then a live read. Rollback = revert the merge.

**REGISTER:** filed on its own line before the merge (source packet §3).

## 7. What counts as finished (from the brief, made testable)
- **Cold reader:** the panel answers where (title + marker + callout 1), when (observation line), which part NASA identifies as dust (callout 2, quoting NASA), and that it is one pass (the "can't show" line).
- **Measured:** desktop + real phone legibility; alignment at five widths; keyboard; source link reachable in two Tab stops from the image; fallbacks; zero `dust/` requests on normal load.

## 8. Decisions for Chad (after GPT)
- **D1 Entry point:** the Optional layers block (recommended), or elsewhere.
- **D2 Callout 3** (north of the mouth): keep as an unpublished draft (recommended) or publish.
- **D3 Crop:** the crop proposed in §4, which drops the far-left strip.
- **D4 NASA's "SI Applications" section** (source packet §3): accept the quote-in-marks approach, or email NASA first. Sending grants nothing.
- **D5 Getting the original across:** you download it once from NASA's page ("JPEG (3.20 MB)") into `~/Downloads`, or Claude saves it from the pane with your permission.
- **D6 Link form:** `#dust=<event-id>`.
