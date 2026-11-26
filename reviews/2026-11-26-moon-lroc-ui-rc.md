# Moon LROC regional detail (item 4): page preview `moon-lroc-ui` for GPT's review

26 Nov 2026 · Claude · **branch only: not merged, not deployed; no hub, R2, D1 or collector change** · under proposal rev 2.1 (`docs/concepts/MOON-LROC-REGION-PROPOSAL.md`) and GPT's closure notes (`reviews/2026-11-26-moon-lroc-retention-frame-rev21-gpt-recheck.md`)

**Chad's go (26 Nov):** "Go for the page-only `moon-lroc-ui` branch preview under proposal rev 2.1 and GPT's closure notes. Use the retained inputs and corrected 8,444-byte 2 m offset, preserve the existing Moon features, and return the exact preview commit and evidence for GPT review. No merge or deployment." The wording is GPT's suggested owner line; Chad sent it as his go.

## 1. Commits (branch `moon-lroc-ui`, from main `d2ef9a0`)

| Commit | What |
|---|---|
| `ffa593b` | `phase1/moonsci/build_lroc.py` and the four assets in `assets/moon/lroc/` |
| `c99da22` | **payload**: `moonlroc.js`, `moonlroc.css`, the `moon.html` hooks, the `moon-lroc-ui` suite (`LR_MAIN`) |
| `ba9785c` | Animals suite pins only (`LR_MAIN` `c99da22`, `LR_PARENT` `d2ef9a0`; 13e, 13v, 13w) |
| `d669eb6`, `b87db76`, `c94b43a` | `moon-lroc-ui` suite only: test fixes found by the breaks (§5) |
| the next commit | this packet (the branch head) |

**Preview commit for review: the branch head (the commit that adds this packet; it differs from the validated tree `c94b43a` only by this file).** The page files are identical from `c99da22` onwards; later commits change tests and records only.

## 2. Build (retained inputs only)

`python3 -I phase1/moonsci/build_lroc.py --src <Mac _source-data/moon-lro-science-lroc>`, with `--check` rebuilding byte-identical files: PASS, 0 failures (Pillow 12.3.0, libjpeg 6.2, zlib-ng 1.3.1).

- **Inputs:** the five retained files are checked by size and SHA-256 against retention lines 1–5; the 2 m file's MD5 is also checked against its label. No archive fetch.
- **Layout from the attached PDS3 headers:** RECORD_BYTES, LABEL_RECORDS and ^IMAGE give image offsets of 16,880 B (0.5 m) and **8,444 B (2 m)**.
  - The 2 m file length must reconcile exactly with its header.
  - The 0.5 m range must start on a line boundary at line 33,593 and hold 1,024 whole lines.
  - Decoding is explicit little-endian (`'<i2'`).
  - The PDS4 conflicts (2 m offset 4,222; upper-left x sign) are recorded in `SOURCE.json`; archive metadata is never rewritten.
- **Windows:** both windows must equal the reviewed int16 hashes: site `18a0603b…`, area `4cd6d42d…`.
  - Any saturation code in either window stops the build.
  - The 2 × 2 histogram must equal 30,579 / 10 / 1,999 / 10 / 1,022,402.
- **Outputs:**

| File | Bytes | SHA-256 |
|---|---|---|
| `a11-site-0p5m.jpg` (1,024², 0.5 m) | 223,227 | `e8989c1c…4643` |
| `a11-area-4m.jpg` (1,055 × 1,000, 4 m) | 359,687 | `930d9ad8…8946` |
| `a11-area-4m-mask.png` (RGBA, alpha 255 = no data) | 6,002 | `ad59003d…f4cd` |
| `SOURCE.json` | 5,641 | provenance, conflicts, geometry, builder hash `c8afc31e…` |

- **Encoded-image checks** (all PASS):
  - **orientation:** correlation with the stretched source 0.9967 (site) and 0.9844 (area, valid pixels); north–south and east–west flipped controls 0.11 / −0.03 and 0.08 / −0.03
  - **mask:** equals the valid-count rule exactly
  - **feature:** a white blob covers the predicted LM pixel
  - **source landmarks, recomputed on unstretched DN:** 0.5 m local maximum 446 at (−0.326 E, +0.46 N) m; 2 m local maximum 268 at (+0.924 E, +0.21 N) m
- **Tolerance fixed at build from measurement:** mean absolute JPEG difference is 2.69 grey levels (site) and **5.46 (area)**. The proposal's provisional "3 levels" holds for the site; for the area's 4 m texture at quality 80 the build holds ≤ 6. GPT is asked to accept this or ask for q90 (measured in rev 1's trial: about 502 KB, against 360 KB).
- **Negative and malformed-input controls** (all refused or detected):
  - the wrong 4,222-B offset reproduces the superseded area hash `a84a2c59…`, which the build would refuse
  - a truncated 2 m file
  - one flipped byte in the 0.5 m range
  - a header with LABEL_RECORDS 1
  - a saturation code in either window

## 3. What the page does (proposal rev 2.1 §6)

**New files:** `moonlroc.js`, `moonlroc.css` and the four assets.

**`moon.html` gets exactly five additions:**
- the stylesheet link
- one button after the temperature group
- the locator line and the panel after the LRO readout
- one scale sentence
- the script tag

`moonglobe.js`, `moonsci.js`, `moonlight.js`, `craft.js`, `sources.html` and `style.css` are untouched.

**Off by default:** "Show a detailed site: Apollo 11 (LROC)". Nothing is requested until it is switched on.

**On:**
- **Camera:** `MoonGlobe.point(0.67416, 23.47314)`, the existing view call. It leaves the Earth view like any view button, keeps "Lit as now", and keeps the height or temperature mode.
- **Locator:** a 14 px ring placed by the globe library's HTML layer (`htmlElementsData`).
  - It is hidden past the limb by the library's own behind-the-globe test, and in the Earth view.
  - It has `pointer-events: none` and is labelled under the globe as a locator, "not the image’s footprint".
  - **Change from rev 2.1 §6, for GPT:** the proposal said "drawn in WebGL, depth-tested". The library's HTML layer gives a fixed on-screen size, a geometric behind-the-globe test (camera cone to the limb) and no WebGL draw.
  - The library's renderer rewrites `display` on every frame, so hiding uses `visibility`.
- **Panel:** two views as radios; each picture loads when first chosen. Each view has:
  - a ground-distance scale bar (1 km or 100 m), sized from the picture's displayed width and resized with it
  - "North up, east right. Sun low in the west, so shadows point east."
  - the caption: image ID, date and times, "from the PDS", the averaging or native spacing, the screen caveat, "not a measured reflectance", and the credit
  - **area view:** a footprint box and a hatched no-data overlay masked by the lossless PNG
  - **site view:** an optional open-ring pointer to the descent stage (off by default), with its position from LROC's 2016 list
- **Loading:**
  - a request token: a late picture is dropped if the view was switched or the feature was switched off
  - a 20 s deadline
  - pictures of the wrong size are refused
  - a failure gives "Detailed image unavailable — …" and a Retry button, and the locator stays

**Off:** removes the panel and the locator, leaves the camera and zoom where they are, does not reopen the Earth view, and returns focus to the button.

## 4. Validation

Page files are identical from `c99da22` to the head; later commits change tests and records only. The breaks ran on a detached frozen worktree with its own server. The other suites ran on the branch checkout at `b87db76`, untouched while they ran. The final `moon-lroc-ui` run, the `size` break and `moon-height-ui` with its source ran at `c94b43a`.

| Suite | Result |
|---|---|
| `moon-lroc-ui` (new) | **53 / 0** (`b87db76` and `c94b43a`) |
| `moon-diviner-ui` | 178 / 0 |
| `moon-height-ui` | 110 / 0 (with `LOLA_SRC` pointing at the retained LOLA float file; without it the suite reports 101 / 1 for the missing input only) |
| `moon-globe` | 67 / 0 |
| `moon-lro-path` | 68 / 0 |
| `moon-light` | 27 / 0 |
| `moon-lit` | 138 / 0 |
| `animals-tab-ui` | 296 / 0 (294 + 13v + 13w) |
| `build_lroc.py --check` | PASS, 0 failures |
| `lroc_source_check.py` | PASS, 0 failures |
| `lroc_geom.py` | PASS, 0 failures |

**Measured:** WebGL draw calls per rendered frame are **1 with the detail on and 1 with it off** (`renderer.info.render.calls`). The locator is HTML, so it adds no WebGL draw. Its HTML-layer layout cost was not separately measured.

**Served comparison:** `served_manifest.mjs --check` against main's Moon temperature manifest reports the changed `moon.html` and the new files, as expected for a branch. A new manifest belongs to the release candidate.

## 5. Deliberate breaks (14; each logged "BREAK applied (pattern found)")

All ran on the frozen tree `b87db76` (`size` re-run at `c94b43a`):

| Break | What it does | Caught by |
|---|---|---|
| `turn` | no turn to the site | B1, F8 |
| `late` | a late picture shown after a view switch | D1 |
| `offlate` | a late picture shown after switch-off | D2 |
| `pe` | the locator takes pointer events | B3, F10 |
| `novis` | the locator is never hidden | F1, F3, F5 |
| `earthloc` | the Earth view is ignored | F5 |
| `fp` | the footprint box is shifted | C3 |
| `ptr` | the pointer is misplaced | C11 |
| `bar` | the scale bar has a fixed width | C5, C7, C12 |
| `nd` | the hatch is shown in the wrong view | C4, C10 (D3) |
| `retry` | Retry is never shown | D3, D4, D5 |
| `offcam` | switch-off moves the camera | E1 |
| `eager` | both pictures load at once | B5, C8 |
| `size` | the picture size check is removed | D6 |

**Test faults found by the breaks and fixed (test files only, disclosed):**
- **`offlate`** was not caught at first. D2 ran on a page that had already loaded the site picture, so the browser's image cache answered before the switch-off. D2 now uses a fresh page and asserts "still loading at the click" (`d669eb6`).
- **`retry`** at first hung on the hidden button instead of failing. D4 now records the failure, and the browser closes on any early stop (`b87db76`).
- **`size`** at first stopped the suite (a setup failure) instead of failing D6. D6 now waits for any settled state, then asserts (`c94b43a`).

The first nine breaks also ran once on the earlier test file (`c99da22`) with the same outcome, except `offlate`. The final record above is the `b87db76` run.

## 6. Not done, and limits

- **Not verified:** real phone, Safari, screen reader, hardware renderer (headless Chrome with SwiftShader; narrow 360, 390 and 721 px tested).
- **Visual checks were by screenshot in that renderer only.** The ring's on-screen position equals the library's own projection of the site to within 2 px. That is not a check of the globe picture's local registration, which is about 5 km a pixel.
- **Release work, later:** Sources section (`sources.html#moonlroc`), REGISTER entry, served-file manifest, and release pins.

## 7. For GPT

Review the branch head (validated tree `c94b43a`); Mac copy `_review/moon-lroc-ui/`. Points for your view:
- the locator implementation change (§3)
- the area JPEG tolerance (§2)
- the test fixes the breaks forced (§5)
