# Follow the Dust — entry point and first-release plan (rev 2, 12 Nov 2026, docs only)

**For:** Chad's branch-build line. GPT reviewed rev 1 and Chad relayed the review on 12 Nov. D1–D6 are decided (§8).
**Brief:** `docs/concepts/FOLLOW-THE-DUST-BRIEF.md` (Chad's spec v1, verbatim).
**Sources:** `docs/research/FOLLOW-THE-DUST-SOURCE-CHECK.md` rev 2.
**Approved so far:** source and design review. **Not approved:** branch, build, asset copy into the repo, REGISTER filing, page change.

**Revision history:**
- **Rev 1:** 12 Nov 2026, commit `2e9473b`.
- **Rev 2:** 12 Nov 2026, after GPT's review.
  - **Decisions D1–D6** are recorded (§8).
  - **Card copy:** "Dated satellite observations".
  - **Callouts:** two, worded by GPT; nothing implies NASA selected the marked feature.
  - **Wording:** "one pass" is replaced by "one published image / one dated view" throughout.
  - **§4 image loading:** the panel now verifies the bytes it displays (no `srcset`).
  - **§6 added browser checks:** Back and Forward, cold-link close, unknown event ID, and focus kept inside the phone sheet.
  - **§7:** the acceptance criteria are reworded.
  - **§9:** the first-collection finish line is three events.
  - **Brief deviation (agreed):** the brief says "one visible offshore plume NASA identifies as dust". Per GPT, the panel instead says the marker points to a feature visible in the image, and quotes the article's description of the event.

## 1. Shape in one paragraph
- **Where it lives:** a "Follow the Dust" block in the globe page's Optional layers group lists dated events as links. It has no switch. One event to start.
- **What opening an event does:**
  - sets the link `index.html#dust=orange-river-2019-09-25`;
  - flies the globe to the Orange River mouth and the nearby Atlantic;
  - drops one place-reference marker;
  - opens an image panel.
- **The panel:** shows NASA's image without our marks. "Explain what I'm seeing" adds two numbered markers and their matching text.
- **Closing:** returns the camera, rotation and focus to where they were.
- **Hosting and cost:** static files on GitHub Pages. No hub, R2, D1 or cron. **$0 in new cost.**

## 2. Entry point (D1, D6)
- **Placement:** block `#card-dust` inside **Optional layers** (`#card-optional`; right column, or the Readings sheet on phones), after Ocean heat.
  - Heading "Follow the Dust" with the evidence tag **Observed**.
  - Note: **"Dated satellite observations."**
  - Each event is a link: "West Coast dust storm · 25 Sep 2019".
- **No marker on load.** The globe opens uncluttered (Chad, 3 Nov). The place marker exists only while the event is open.
- **Link:** fragment `#dust=<event-id>`.
  - It needs no server and causes no reload, and the globe page uses no other fragment.
  - Released IDs are permanent. A withdrawn event keeps its ID and shows a withdrawal note.
  - **An unknown ID** (e.g. `#dust=nope`): no fly, no panel. A short note "That Follow the Dust event isn't in this list" appears in the card, the event list stays usable, and nothing breaks.
- **Opening view:** about −29.2, 15.4; globe.gl altitude about 0.45. It is tuned in the build so the mouth and the offshore area both fit, on desktop and at 390 px, and the tested values go in the packet.
- **Marker:** −28.631, 16.450, "Orange River mouth — place reference". It makes no claim about origin.

## 3. The panel
- **Desktop:** non-modal panel over the centre column, with the globe visible beside it.
- **Phone (≤ 720 px):** full-height **modal sheet**. While it is open:
  - keyboard focus stays inside it, wrapping at both ends;
  - the content behind it is `inert`;
  - on close, focus returns to the event link that opened it.
- **Order:**
  1. title;
  2. **"Observed 25 Sep 2019 · 12:25 UTC (14:25 SAST), as reported by the source · Suomi NPP / VIIRS"**;
  3. the image;
  4. **Explain what I'm seeing** (`aria-expanded`);
  5. the numbered list;
  6. the image credit as supplied, verbatim;
  7. "Cropped and resized by Mother Earth; numbered markers added by Mother Earth";
  8. links: the Earth Observatory article; NASA's full original image;
  9. "What this view can't show": **one published image, one dated view.** It cannot show:
     - how the plume moved over time;
     - ground-level concentration;
     - where the dust started.

     White areas are cloud, and what lies beneath them is unknown.
  10. Close.
- **Callout text (D2, GPT's wording):**
  1. "Orange River mouth. A place reference on the Namibia–South Africa border."
  2. "Pale tan plume over the Atlantic. This marker points to a feature visible in the image. The Earth Observatory article describes 'huge plumes of sand and dust' moving west toward the Atlantic."
- **Alignment:**
  - the image box has the crop's `aspect-ratio` (1900 / 1500);
  - markers are placed in **percent** from the manifest: callout 1 at 68.95 %, 39.67 %; callout 2 at 42.11 %, 60.00 %;
  - they move with the image at any width, with no layout script.
- **Marker style:**
  - a number in a white disc with a dark outline;
  - the text list carries the meaning, and markers are `aria-hidden`;
  - focusing or hovering a list item outlines its marker (an extra);
  - the disc for 1 sits on the mouth, so its size is reviewed at 390 px to keep the coastline either side readable.
- **Keyboard:**
  - Enter on an event link opens the panel, and focus moves to the panel heading;
  - Tab follows the reading order;
  - Esc or Close shuts the panel;
  - focus returns to the opening link, or to the Follow the Dust heading after a cold link.
- **History (D6):**
  - **Opening from the card** pushes the fragment.
  - **Back** closes the panel and restores the view.
  - **Forward** reopens the panel and flies again.
  - **Close after a push** = `history.back()`.
  - **Cold-link close** replaces the fragment with none, stays on the page, and keeps the default view.
  - **One state at a time:** a fragment change while the panel is open (e.g. Back then Forward) is handled once.

## 4. Imagery: crop (D3) and verified loading
- **Source:** NASA's `_lrg` file, verified on the Mac (sha256 `eb7c02e9…d2c7`, source packet §2a).
- **Crop (D3):** x 650–2550, y 750–2250 (1900 × 1500).
  - Recorded in the manifest and stated under the image; the full original is linked.
  - The far-left diagonal edge of the original is **unexplained** (source packet §5) and outside the crop.
- **Two derivatives:** 1600 px and 960 px wide, JPEG.
  - The quality is chosen by test: the lowest at which the plume edges and the thin streaks north of the mouth still read at 390 px, judged side by side with the original at the same scale.
  - Bytes and quality go in the packet.
- **Verified loading (no `srcset`):**
  1. When the event opens, `dust.js` **chooses one derivative**: 1600 if the image box width × `devicePixelRatio` exceeds 960, else 960. The rule is fixed and recorded.
  2. It **fetches that file**, computes **SHA-256 over the fetched bytes**, compares with the manifest, and on a match **displays those same bytes** (blob URL into the `<img>`).
  3. On a mismatch, failed fetch or failed decode, it shows nothing from those bytes: only the text and "Image not available — open NASA's full original image" with the direct link.
  4. The other derivative is **never fetched**. A later resize does not swap the image.
- **Manifest:** the page pins the manifest's SHA-256 and revision, and the manifest pins each derivative's SHA-256. A manifest mismatch → the event is listed as "not available" with the article link, and nothing is drawn.
- **Normal globe load fetches neither image, nor the manifest.** The card's event list is generated into `index.html`.
- **Not painted on the globe.** Georeferencing is not verified.

## 5. Data model (build once, add events as data)
Source of truth: `phase1/dust/events.json`. Generator: `phase1/dust/build_dust.py`, following the Timeline generator. It:
- **writes** `dust/manifest-r1.json`, the derivatives, and the card list in `index.html` between `<!-- DUST:BEGIN/END -->`;
- **pins** the manifest's SHA-256 and revision in `dust.js`;
- **refuses:**
  - an event missing its ID, title, place, opening view or observations;
  - an observation missing:
    - its source-reported time + precision (`"2019-09-25T12:25Z"`, `"minute"`);
    - the instrument;
    - the credit as supplied;
    - the article URL;
    - the original URL + SHA-256 (it also checks that hash against the local original);
    - the crop;
    - the derivatives + SHA-256;
    - the callouts;
  - a callout outside the crop;
  - a reused or changed released ID;
  - any private path;
  - **any callout not marked `release: true`** (the third-callout draft never enters the source file; this is a second guard).
- **Callouts** are stored in original-image pixels with the crop, and the generator writes the crop fractions. Re-measurement is then reproducible against the hashed original.
- **Adding events later:** Namibia (11 Jul 2023) or the Saharan plume (18 Jun 2020) = a source packet, then records + images. **No viewer change.**
- **Before / during / after** comparisons later use the same `observations` list.

## 6. Implementation plan (first release)
**Step 0 — done:** the original was verified on the Mac and the crop and positions rechecked (source packet §2a).

**Step 1 — branch `dust-rc`.** A push to `main` publishes, so the build goes on a branch. Files:
- `dust.js` (new page file, so served-hash checks cover **eleven** page files);
- `index.html` (block, panel shell, `?v=` bumps);
- `style.css` (scoped `.dust-*`);
- `phase1/dust/{events.json, build_dust.py}`;
- `dust/manifest-r1.json`;
- `dust/img/orange-river-2019-09-25-{1600,960}.jpg`;
- `sources.html` (Follow the Dust section);
- tests.

No `worker.js` or hub change.

**Step 2 — tests:**
- **`node phase1/dust-build.test.mjs`:** refusals (including an unreleased callout), crop fractions, deterministic bytes, `--check`.
- **`phase1/dust-ui.test.cjs`** (Playwright, local server, network log):
  - **normal load requests neither image nor the manifest**;
  - **opening fetches only the selected derivative** (at 1280 px, DPR 1, box wider than 960 → 1600 only; at 390 px, DPR 2, box about 358 × 2 = 716 → 960 only; the iPhone at DPR 3 gets 1600, which the real-phone check covers);
  - the displayed `<img>` source is a blob whose bytes hash to the manifest value;
  - a tampered image → fallback text + NASA link, with no image drawn from those bytes;
  - a tampered manifest → refused;
  - camera within tolerance; marker added and removed;
  - Explain → 2 markers + list; marker centres at the expected fractions ±1 px at 360 / 390 / 768 / 1280 / 1600 widths;
  - keyboard order; Esc; focus return;
  - **phone sheet: focus stays inside while open, background inert, focus returns to the event link on close**;
  - **Back closes, Forward reopens**;
  - **cold link → close → no fragment, default view**;
  - **unknown event ID → note, no panel, no errors**;
  - no-WebGL → panel and text work;
  - close restores point of view and auto-rotate.
- **Breaks** (each must fail the suite): `srcset-unverified`, `eager-image`, `fetch-both`, `no-pin`, `px-markers`, `no-restore`, `no-focus-return`, `no-focus-trap`, `forward-ignored`, `unknown-id-throws`, `colour-only`, `hotlink`.
- Then the full regression.

**Step 3 — packet:**
- `reviews/<date>-dust-rc.md`;
- `_review/dust-rc/` on the Mac, hash-checked, for GPT;
- screenshots at desktop and 390 px;
- the chosen JPEG quality and bytes.

**Step 4 — real devices before merge** (Chad at the screen):
- desktop Chrome;
- **Chad's iPhone (Safari)**;
- VoiceOver if he's willing.

**Step 5 — release:**
- REGISTER filing on its own line;
- then `Approve: merge dust-rc to main (page change: Follow the Dust, Orange River)`;
- served-hash checks on the eleven page files + manifest + both images;
- live read.

Rollback = revert the merge.

## 7. What counts as finished (first release)
- **A cold reader can tell:**
  - **where** it happened: title, place marker, callout 1;
  - **when** it was observed: the source-reported time;
  - **which visible feature the marker points to**, and what the Earth Observatory article says about the event as a whole: callout 2, which says the choice of feature is ours;
  - that this is **one published image, one dated view**, which cannot show how the plume moved over time.
- **Measured:**
  - legibility on desktop and a real phone;
  - marker alignment at five widths;
  - keyboard, including focus containment in the phone sheet;
  - Back, Forward, cold-link close and an unknown ID;
  - verified-bytes display and the image fallback;
  - zero image or manifest requests on a normal load;
  - one derivative fetched on open.

## 8. Decisions (recorded 12 Nov 2026, GPT's review relayed by Chad)
- **D1:** Optional layers; a list of event links, no switch; card copy "Dated satellite observations".
- **D2:** ship callouts 1 and 2 as worded in §3. The third stays in a working draft outside the public repo and outside the generated manifest.
- **D3:** the proposed crop, recorded and disclosed; the full original linked; the diagonal edge described as unexplained.
- **D4:** proceed with quoted source wording, the full image credit and crop disclosure. The SI-section reading is recorded as our interpretation; no NASA email for this scope.
- **D5:** browser download, verified against `eb7c02e9…d2c7` (done; source packet §2a).
- **D6:** `#dust=orange-river-2019-09-25`.

## 9. First collection
- **Orange River is the first release.**
- **Next, in this order:** Namibia (11 July 2023) and the Saharan Atlantic plume (18 June 2020). Each gets its own source review and is added as data.
- **The first collection is finished when all three are published through the same viewer, subject to their source checks.**
- The event list and every direct link are verified at each addition.
