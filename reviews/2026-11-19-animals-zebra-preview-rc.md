# Review packet: `animals-zebra-preview-rc` (private zebra journey preview, Z3866)

Written 19 Nov 2026 05:40 UTC (clock reading). **Branch only: nothing merged, nothing deployed, nothing sent, nothing spent.** Hub untouched (0.6.19). No provider contacted.

**Chad's line (19 Nov):** "Go: private zebra preview build (Z3866) on a branch per ANIMALS-PROPOSAL rev 2.2; no merge, no deploy".

Built against `docs/concepts/ANIMALS-PROPOSAL.md` rev 2.2 (branch `animals-proposal`, GPT's pass for the private preview relayed 19 Nov). This branch is cut from main `ad5a03a` and does not contain the proposal or audit documents; they stay on `animals-proposal`.

## 1. What to review
- Code commit: `01a4690d6af7e94fb97414a75ecef182bf08748d`. The branch head is the later commit that adds this packet and changes no other file.
- Files that differ from main (sha256 at the code commit):

| File | Change | sha256 |
|---|---|---|
| `animals-journey.js` | new: the layer | `bda4f458d6e516ce9b7d4d43fe306f6594e2a62c3d939e5749360677f5a4ea70` |
| `animals.html` | new: Animals page | `b8d297b79d1055b0c5e3b786770a8255c314f76b063f9a249ba026d06e8d3f15` |
| `animals.js` | new: Animals page script | `8b7c57fba11569f0d1cac7dd23ef1fd4b782b04072e071bfc2fc2971b0687ada` |
| `assets/animals/zebra-botswana-R1.manifest.json` | new: manifest (pinned in both scripts) | `780f2ec42fc990b27d71b354779b6cf1b4737f35fd0d61561ba72694a684398a` |
| `assets/animals/zebra-botswana-Z3866-R1.json` | new: display file, 13,045 fixes | `8d00aa32dc728dee09f7136835b5b1d32e3cc19469250ad29bf73506a1141bb6` |
| `index.html` | card and switch, replay bar, Key entry, Key tally row, script tags, fifth tab, Menu entry, keys | `03071b6144593e3812a4b4df49ed25f37e6fb1595c6d511e99b965353f80c29d` |
| `layers.js` | one row added | `8e4f462895fd540e0e2c3d5c3ea70f3ea56709baad1c86a3dc6d1db8d5f2a33b` |
| `moon.html` | fifth tab, Menu entry, stylesheet key | `9961e5a45e2c325df2aa2b86719663aeb17a626b601fcab0fc158fe15bc002fb` |
| `phase1/animals-journey-ui.test.cjs` | new: browser suite, 26 breaks | `cae1abefad4d7c91699d5bd5c8a714233138803b847523c8cbae23eed136ccb6` |
| `phase1/animals/build_journey.py` | new: generator | `76995b6e861b895607a77fd7105cb79e6fa708ea2d5a5370544331de9246ed24` |
| `phase1/animals/build_journey.test.py` | new: generator tests, 3 breaks | `390bbac13e102984fda4dd120e98af755239a464f29b857f38a15e2acb65aea0` |
| `phase1/animals/zebra-botswana.json` | new: study config and pins | `d8ff3cf683b1249f2321869d96452931603a1f21975d653ef7c3e2c32cf2129a` |
| `phase1/bare-earth-ui.test.cjs` | expects 17 switches (was 16) | `27beb7e2d8b482a833d6b1dd37029e9523a947813c77a0723ba22ef62b7dd1b0` |
| `phase1/desktop-overflow.test.cjs` | promise line 1200 px (was 1140), widths added | `c0545e555a42bdd983d8815de7fb204c0e5454ea4e2f3ce8bc2c1fe287f76f5b` |
| `phase1/timeline-ui.test.cjs` | expects five tabs and the Animals Menu entry; Animals page added | `d5391fdb0b42938fbb587cbf9117f9c0f4d814bffc2bf2dd5d502c323ef5f77c` |
| `sources.html` | fifth tab, Menu entry, stylesheet key | `872bcae3204116ce659f551867b1936619dd0a2b9eeef612d224004ca3a09978` |
| `style.css` | replay bar, Animals page, header rules for five tabs | `185cfaa081a6ac5538b0e46e8b3d02e6e041972f60ca0923cd4071c1f3841b2d` |
| `sun.html` | fifth tab, Menu entry, stylesheet key | `437a5fb825f67e5c6cdf1e076b5b04f96041cf72c94b482c999be67b6b145dfa` |
| `timeline.html` | fifth tab, Menu entry, stylesheet key | `ef2364041c9d0853bb9b8a3191a10e60bfad99687701cdd115a269cfc3481168` |

- Stylesheet key `202612181300` → `202612190100` on the five existing pages; `layers.js` key → `202612190100`; new `animals-journey.js?v=202612190100` and `animals.js?v=202612190100`. None of these keys was used before.
- No hub file, no collector file, no change to any other layer's script.

## 2. What it is
One optional layer, **Animal journey**, off when the page opens: the recorded GPS fixes of one plains zebra (study animal Z3866; Movebank Data Repository, doi:10.5441/001/1.f3550b4f, CC0 1.0), replayed against the dates they were recorded, 25 Oct 2007 to 22 Oct 2008. A new **Animals** page and a fifth header tab.

- **Data in the repo:** the display file `assets/animals/zebra-botswana-Z3866-R1.json` (13,045 fixes: UTC second, latitude, longitude with the source's own digits; 440,782 bytes) and its manifest. The raw source file is not in the repo and not on the Mac.
- **Generator:** `phase1/animals/build_journey.py` with `phase1/animals/zebra-botswana.json`. It accepts only the pinned source file or the pinned single-animal extract (sha256), reads times explicitly as UTC, and stops the build on a duplicate or out-of-order time, a fractional second, a bad coordinate, a non-GPS row, a missing column or a short line. No thinning, smoothing or interpolation.
- **On the globe:** a marker on the last recorded fix at or before the replay time; a small mark at every recorded fix up to that time; a line joining consecutive fixes no more than 3 hours apart (exactly 3 h is joined). Nothing later than the replay time is drawn.
- **Replay bar** (shown only while the journey is drawn): Play/Pause, a slider over the fixes (arrow keys step fix to fix, Home/End), speed (1 h, 6 h, 1 day, 1 week of replay per second), "Journey area" (moves the camera there; the camera is never moved for the visitor otherwise), the replay line, and two fixed lines.
- **Words on screen** (exact):
  - `Replay time (recorded) 10 Jan 2008 21:20:00 UTC · Last recorded fix 10 Jan 2008 21:00:47 UTC, 19 min 13 s earlier`
  - at the end: `… · Last recorded fix: tracking record ends here, 22 Oct 2008 23:00:45 UTC`
  - `Replay: recorded 25 Oct 2007 to 22 Oct 2008. Other layers on the globe retain their own dates and times; they are not matched to this journey.`
  - `The line joins recorded fixes. The path between fixes was not recorded. Mother Earth does not join fixes more than 3 hours apart. This is a display rule, not part of the study.`
  - bad file: `Journey file could not be verified. Nothing is drawn.` · failed load: `The journey file could not be loaded. Nothing is drawn.` with **Retry**
  - Key entry: `Animal journey: recorded fixes and the line joining them — a dated replay, not current`
- **Verification before drawing:** the manifest must match the sha256 pinned in `animals-journey.js`; the display file must match the manifest's byte count and sha256; then count, first and last time, strictly increasing whole seconds and every coordinate inside the manifest's box. Any failure draws nothing.
- **Off** stops playback, cancels a load in flight, removes and disposes the three scene objects, hides the bar and leaves the Key. **Sky zoom-out view** pauses and hides it and restores it paused at the same replay time. **A hidden tab** pauses and keeps the replay. **A new page load** starts bare.
- **Animals page:** the study card is filled from the same manifest after the same checksum test (if that fails: "Study details could not be verified. No figure is shown."). Conservation: "Not available yet. No assessment source has been reviewed for display on Mother Earth." Population: "Not available yet. No population series has been reviewed." And: "7 animals were tracked in this study. This is a sample size, not a population estimate." The link "Choose this journey on Earth now" opens the globe with Layers open and the journey's row focused; it switches nothing on.

## 3. Decisions made in the build that the proposal did not fix (for GPT and Chad to accept or change)
1. **Header with five tabs.** The fifth tab did not fit in three places, measured: 430 px (25 px page overflow), 721 px (2 px overflow), and with stand-in fonts the header promise was cut at 1140–1280 px. Smallest changes made, all in `style.css`:
   - compact tab size now runs to 480 px (was 420 px);
   - tab padding 4 px at 721–760 px;
   - the header promise is hidden below 1200 px (was 1140 px);
   - compact tabs also at 1280–1365 px.
   These touch the header on **every** page. `desktop-overflow` was updated to the new 1200 px line and five widths were added; `timeline-ui` and `bare-earth-ui` expectations were updated to five tabs and seventeen switches. If a different header treatment is preferred, this is the place to say so.
2. **Replay bar position.** It takes the slot the first-view line uses (that line is hidden whenever a layer is on): top of the globe on desktop, a row under the globe at 721–1100 px, above the sheet on a phone. On a phone the bar is 153 px high over a 360 px globe box; "Journey area" centres the journey in the part the bar leaves free.
3. **Phone slider.** About 110–140 px wide for 13,045 fixes, so dragging is coarse (roughly 100 fixes per pixel). Play/Pause and speed are the practical phone controls; arrow keys are exact on a keyboard. Step buttons were not added.
4. **Speeds** and the default (1 day a second) are my choice.
5. **Marker and marks:** marker scales with camera distance to stay about the same size on screen; fix marks are fixed-size triangles about 750 m across on the ground, so at whole-globe zoom the journey is a small smudge until "Journey area" is pressed.
6. **Time label.** The bar says "UTC". The study's README allows that times may be GPS time (a few leap seconds from UTC); that caveat is on the card and the Animals page, not in the bar.
7. **Deep link** uses `index.html#journey=zebra-botswana-Z3866`.

## 4. Tests
- `phase1/animals-journey-ui.test.cjs`: **233 passed, 0 failed** (real page files in Chromium; expected fixes and joins worked out in the suite from the display file, apart from the page's code).
- 26 breaks, each tied to the check that must catch it: **26 of 26 caught by their own check**.
- `phase1/animals/build_journey.test.py`: **22 passed, 0 failed**; 3 breaks, each failed.
- Every other browser suite in `phase1/` on this branch: 43 suites run. 39 passed in the run. `terminator-ui` failed once while other suites were running beside it and passed alone (19 of 19). Three fail for reasons outside this branch: `osmc-reliability-ui` (1 of 41: its "old page" check; the same failure on main, checked), `oceanheat-ui` (needs `OH_SNAPSHOT_DIR`, not set here), `buoy-temp-ui` (stops writing a picture to a folder from an earlier session; not checked on main).

## 5. Not measured, not done
- **Performance (J12): not measured.** The proposal's tolerance needs foreground Chrome on a real machine; the container renders in software. The line is 13,044 segments in one draw call and the marks 13,045 triangles in another.
- **No real phone, no screen reader, no real imagery behind the journey** (the suites use a flat backdrop).
- **The full-source build check was not rerun here.** The committed display file was built from the pinned Z3866 extract and `--check` passed at build time; the working copy of the extract was lost in a container restart. The generator tests check the committed files against each other, not against the 15.7 MB source file.
- **Sky view** is entered in the suite by setting the page's own body class, not through the Sky controls.
- **Sources & Details page and REGISTER are not updated** (private preview). The Key definition text is unchanged.
- **Sensitivity:** full-precision completed historical track; the proposal allows that for a private preview only. Public release needs the recorded, dataset-specific decision.
- Decision §9 of the proposal (archived studies versus regularly updated feeds) is still open and is not decided by this build.
- `bare-earth-ui`'s own breaks were not rerun after its expectation changed from 16 to 17 switches.

## 6. How to look at it
Nothing is deployed. To see it: check out the branch and serve the folder (`python3 -m http.server`), open `index.html`, Layers → "Animal journey — dated replay", then "Journey area". Or `animals.html` → "Choose this journey on Earth now".
