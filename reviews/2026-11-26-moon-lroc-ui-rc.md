# Moon LROC regional detail (item 4): page preview `moon-lroc-ui` for GPT's review (rev 3: startup readiness)

26 Nov 2026 · Claude · **branch only: not merged, not deployed; no hub, R2, D1 or collector change** · under proposal rev 2.1 (`docs/concepts/MOON-LROC-REGION-PROPOSAL.md`) and GPT's closure notes (`reviews/2026-11-26-moon-lroc-retention-frame-rev21-gpt-recheck.md`)

**Chad's go (26 Nov):** "Go for the page-only `moon-lroc-ui` branch preview under proposal rev 2.1 and GPT's closure notes. Use the retained inputs and corrected 8,444-byte 2 m offset, preserve the existing Moon features, and return the exact preview commit and evidence for GPT review. No merge or deployment." The wording is GPT's suggested owner line; Chad sent it as his go.

## 1. Commits (branch `moon-lroc-ui`, from main `d2ef9a0`)

| Commit | What |
|---|---|
| `ffa593b` | `phase1/moonsci/build_lroc.py` and the four assets in `assets/moon/lroc/` |
| `c99da22` | **payload**: `moonlroc.js`, `moonlroc.css`, the `moon.html` hooks, the `moon-lroc-ui` suite (`LR_MAIN`) |
| `ba9785c` | Animals suite pins only (`LR_MAIN` `c99da22`, `LR_PARENT` `d2ef9a0`; 13e, 13v, 13w) |
| `d669eb6`, `b87db76`, `c94b43a` | `moon-lroc-ui` suite only: test fixes found by the breaks (§5) |
| `6191193` | first version of this packet (superseded) |
| **`3ed8f82`** | **page fix in `moonlroc.js`** (locator visibility from the live camera; §3, §6) with suite test B7 and break `stale` |
| `1dc62c1` | suite test B8 (test only) |
| `a35a25b` | packet rev 2, the head GPT reviewed (`reviews/2026-11-26-moon-lroc-ui-gpt-review.md` on main) |
| **`f4599d6`** | **page fix in `moonlroc.js`: startup readiness (GPT's R1; §7)** with suite tests H1–H10, H7a and four breaks |
| `02d2f4a` | suite only: the `eager` break pattern follows the `setOn` change; `offguard` replaced by `offwait` (§5) |
| the next commit | this packet, rev 3 (the branch head) |

**Preview commit for review: the branch head, the commit that adds this rev 3 packet.** It differs from the validated tree `02d2f4a` only by this file. **Page files: `c99da22`, plus `moonlroc.js` changed in `3ed8f82` and in `f4599d6`.** `moon.html` is unchanged since `c99da22`, so the Animals pins stand (296 / 0 rerun at `02d2f4a`).

*(Rev 2 said the head differed from "the validated tree `3ed8f82`"; GPT noted the tree actually validated was `1dc62c1`. Corrected here.)*

## 2. Build (retained inputs only)

`python3 -I phase1/moonsci/build_lroc.py --src <Mac _source-data/moon-lro-science-lroc>`, with `--check` rebuilding byte-identical files: PASS, 0 failures (Pillow 12.3.0, libjpeg 6.2, zlib-ng 1.3.1).

**Limit of the byte-identical claim (GPT):** it holds only in that pinned encoder environment. `--check` compares rebuilt bytes with the committed files only when the encoder versions recorded in `SOURCE.json` match. With other versions it prints a NOTE that byte equality is not expected and skips that comparison. The rest still runs: the window hashes, the histogram, the mask rule, and the freshly encoded pictures against the source tolerances, plus the file records and the builder hash. It does not then re-verify the committed JPEGs' own pixels.

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
  - **If the globe is not ready yet (rev 3, §7):** the panel opens at once. Under the globe it says "Waiting for the globe to start; it will turn to the Apollo 11 site and mark it when ready." The turn and the locator happen together, once, when the globe is ready. The wait is bounded at 20 s. If the globe fails or misses that deadline, it says "Locator unavailable: the globe did not start. The detailed picture below does not need it." and stops checking.
- **Locator:** a 14 px ring placed by the globe library's HTML layer (`htmlElementsData`).
  - It is hidden past the limb by the library's own behind-the-globe test, and in the Earth view.
  - It has `pointer-events: none` and is labelled under the globe as a locator, "not the image’s footprint".
  - **Change from rev 2.1 §6 (accepted by GPT and Chad):** the proposal said "drawn in WebGL, depth-tested". The locator is instead an **HTML element with geometric visibility**: fixed on-screen size, a geometric behind-the-globe test (camera · site > R²), no WebGL draw. It is **not WebGL depth-tested**. On the globe's sphere the two give the same answer; terrain relief is not taken into account.
  - The library's renderer rewrites `display` on every frame, so hiding uses `visibility`.
  - **Visibility is worked out from the live camera** each time the library asks (visible when camera · site > R²), the same geometry `moonglobe.js` uses for the LRO marker. The library's own cached behind-the-globe answer was not reliable when the locator is first placed (§6).
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

**Page files at the reviewed head:** `c99da22`, plus `moonlroc.js` from `f4599d6`. **Rev 3 reruns (focused, as GPT allowed):** the `moon-lroc-ui` suite and all 19 breaks on a detached frozen worktree (`f4599d6`, then `02d2f4a` for the test-only change), served from its own server; `animals-tab-ui` at `02d2f4a`. The other Moon suites below are from rev 2 at `3ed8f82` and were not rerun; the rev 3 change touches only `moonlroc.js`, and with the detail off (their state) the new code does not run.

| Suite | Result |
|---|---|
| `moon-lroc-ui` (new) | **67 / 0** at `f4599d6` and at `02d2f4a` (56 checks before, plus H1–H10 and H7a) |
| `moon-diviner-ui` | 178 / 0 |
| `moon-height-ui` | 110 / 0 (with `LOLA_SRC` pointing at the retained LOLA float file; without it the suite reports 101 / 1 for the missing input only) |
| `moon-globe` | 67 / 0 |
| `moon-lro-path` | 68 / 0 |
| `moon-light` | 27 / 0 |
| `moon-lit` | 138 / 0 |
| `animals-tab-ui` | 296 / 0 (294 + 13v + 13w), rerun at `02d2f4a` |
| `build_lroc.py --check` | PASS, 0 failures |
| `lroc_source_check.py` | PASS, 0 failures |
| `lroc_geom.py` | PASS, 0 failures |

**Measured:** WebGL draw calls per rendered frame are **1 with the detail on and 1 with it off** (`renderer.info.render.calls`). The locator is HTML, so it adds no WebGL draw. **Not measured (GPT):** CPU and layout cost. The library repositions the HTML layer every frame, so unchanged draw calls do not mean unchanged CPU or layout work.

**Served comparison:** `served_manifest.mjs --check` against main's Moon temperature manifest reports `moon.html`, `moonlroc.css` and `moonlroc.js` as different or new, as expected for a branch. A new manifest belongs to the release candidate.

## 5. Deliberate breaks (19; each logged "BREAK applied (pattern found)")

Rev 3 runs on the frozen tree `f4599d6`; `eager`, `offwait` and the baseline again on `02d2f4a`. Log: `breaks-f4599d6.log` on the Mac copy.

| Break | What it does | Suite result | Failing checks |
|---|---|---|---|
| **`noready`** (new) | the pre-fix behaviour: turn tried at switch-on, not when ready | 65/2 | H3, H6 |
| **`nodeadline`** (new) | no deadline and no failure check: the wait never settles | 64/3 | H7, H9, H10 |
| **`latestart`** (new) | the failure branch keeps polling | 64/3 | H7, H9, H10 |
| **`offwait`** (new) | switching off does not end the wait (both protections removed) | 66/1 | H5 |
| `turn` | no turn to the site | 63/4 | B1, H3, H6, F8 |
| `stale` | trusts the library's cached behind-the-globe answer | 64/3 | B7, B8a, B8b |
| `late` | a late picture shown after a view switch | 66/1 | D1 |
| `offlate` | a late picture shown after switch-off | 66/1 | D2 |
| `pe` | the locator takes pointer events | 65/2 | B3, F10 |
| `novis` | the locator is never hidden | 63/4 | B8b, F1, F3, F5 |
| `earthloc` | the Earth view is ignored | 66/1 | F5 |
| `fp` | the footprint box is shifted | 66/1 | C3 |
| `ptr` | the pointer is misplaced | 66/1 | C11 |
| `bar` | the scale bar has a fixed width | 64/3 | C5, C7, C12 |
| `nd` | the hatch is shown in the wrong view | 65/2 | C4, C10 |
| `retry` | Retry is never shown | 64/3 | D3, D4, D5 |
| `offcam` | switch-off moves the camera | 66/1 | E1 |
| `eager` | both pictures load at once | 65/2 | B5, C8 |
| `size` | the picture size check is removed | 66/1 | D6 |

**Rev 3 setup and harness events, counted apart from behaviour (disclosed):**
- **`eager`** first reported a setup failure, "pattern missing": the `setOn` change removed the line it patched. The pattern was updated (`02d2f4a`, test only), then the break was caught as above.
- **`offguard`** (removing only the token guard in the wait) gave 67/0. That is not a test gap: switching off also stops the wait directly, so either protection alone is enough. It was replaced by `offwait`, which removes both and is caught by H5.
- **`ptr`** stalled once in the batch run, with no output for more than 8 minutes, and the batch reached its time limit. Run alone it completed normally (66/1, C11). This was a harness hang, not a behaviour result.

**Test faults the breaks exposed, all fixed in test files only (disclosed):**
- **`offlate`** was not caught at first. D2 ran on a page that had already loaded the site picture, so the browser's image cache answered before the switch-off. D2 now uses a fresh page and asserts "still loading at the click" (`d669eb6`).
- **`retry`** at first hung on the hidden button. D4 now records the failure, and the browser closes on any early stop (`b87db76`).
- **`size`** at first stopped the suite instead of failing D6. D6 now waits for any settled state, then asserts (`c94b43a`).
- **`stale`** was not caught by the timing-dependent B7 under parallel load. B8 checks the rule deterministically (`1dc62c1`).

## 6. A page fault found after the first packet, and fixed

**How it was found:** a screenshot run for this packet, against the earlier head `6191193`, showed the locator **hidden** right after switching on.
- It needed reduced motion and no pause between the globe becoming ready and the click.
- A reproducer confirmed it: hidden for 2 s, until any camera move.

**Cause:** the library's behind-the-globe answer at the moment the locator is first placed can describe the camera from before the turn. Earlier code hid by `display`, which the library's renderer overwrote every frame, so the fault was masked. Switching to `visibility` exposed it.

**Fix (`3ed8f82`, `moonlroc.js` only):** the locator's visibility comes from the live camera each time the library asks: camera · site > R², the geometry `moonglobe.js` uses for the LRO marker. The reproducer now shows the locator straight away in all four cases (with and without reduced motion and pause).

**New tests:** B7 (end to end, timing-dependent) and B8 (deterministic, both directions). Break `stale` checks them.

**Superseded:** the first packet (`6191193`), which predates the fix.

## 7. Rev 3: startup readiness (GPT's R1)

**The finding (GPT, reproduced):** switching the detail on before the globe was ready lost the turn to the site. A later retry placed the ring but never moved the camera, and could poll forever if the globe never started. The suite had always waited for the globe to be ready, so it could not see this.

**Fix (`f4599d6`, `moonlroc.js` only):**
- Switching on starts a token-guarded wait. It checks every 200 ms and is bounded by `GLOBE_WAIT_MS` (20 s).
- When the globe is ready: turn to the site, then place the locator, together and once (`turns` counts the turns, for the tests).
- When the globe fails (the page hides `mg-globe`), or the deadline passes: the state becomes "unavailable", it says so under the globe, and the wait stops. A globe that starts after the deadline is not turned.
- Switching off changes the token and stops the wait. A later ready globe is not turned and gets no locator.
- The picture panel loads straight away and does not depend on the globe.
- `MoonLroc.state()` also reports `loc` (off, waiting, placed, unavailable), `waiting` and `turns`.

**New tests:** the globe library is delayed, made to fail (404), or the deadline is shortened. The page is driven before it is ready.

| Check | Case |
|---|---|
| H1, H2 | on before ready: waiting, said so, no turn yet; the picture loads while the globe starts |
| H3, H4 | when ready: one turn to the site, locator placed and visible, wait stopped; no page errors |
| H5 | off before ready: no later turn (view stays at the default), no locator, panel closed, wait stopped |
| H6 | on, off, on before ready: exactly one turn, one locator |
| H7a | library fails before the detail is asked for: the page hides its controls as before, the detail stays off, nothing polls |
| H7, H8 | library fails after the detail was asked for: unavailable, said so, wait stopped, no turn; the picture still works |
| H9, H10 | deadline passes first: unavailable, wait stopped; a globe that starts later is not turned and gets no locator |

**Rechecked unchanged:** the normal opening (A, B1–B6) and the live-camera visibility tests (B7, B8) pass at `f4599d6` and `02d2f4a`.

**One behaviour for GPT's view (found by H7a, H7–H8):** when the globe library fails, the existing page (`moonglobe.js`, unchanged) hides the whole control block, which includes the LROC button.
- If it fails before the button is pressed, the detail simply cannot be opened, as with every other globe control.
- If it fails after the detail was opened, the picture panel stays usable, but the button to close it is hidden, so only a reload closes it.
- I left `moonglobe.js` untouched. The alternative is to switch the detail off when the globe fails, which loses a working picture. Or move the button outside the control block, which is a `moon.html` change and would re-pin the Animals suite. Your call.

## 8. Not done, and limits

- **Not verified:** real phone, Safari, screen reader, hardware renderer (headless Chrome with SwiftShader; narrow 360, 390 and 721 px tested).
- **Visual checks were by screenshot in that renderer only.** The ring's on-screen position equals the library's own projection of the site to within 2 px (B2). That is not a check of the globe picture's local registration, which is about 5 km a pixel.
- **Not measured:** CPU and layout cost of the HTML locator (§4).
- **Release work, later:** Sources section (`sources.html#moonlroc`), REGISTER entry, served-file manifest, and release pins.

## 9. For GPT

Review the branch head (validated tree `02d2f4a`); the Mac copy is in `_review/moon-lroc-ui/`. Points for your view:
- the R1 fix and its tests (§7), including the meaningful readiness mutation `noready`
- the button hidden after a globe failure (end of §7)
- the qualifications you asked for: HTML locator with geometric visibility (§3), CPU and layout cost unmeasured (§4), byte identity only in the pinned encoder environment (§2)
