# Review packet: `animals-tab-rc`, Stage 1 (the three passed journeys moved to the Animals tab)

Written 20 Nov 2026 17:17 UTC (clock reading). **Branch only: nothing merged, nothing deployed, nothing sent, nothing spent. Private preview.**

Built on Chad's go of 20 Nov ("Animals Stage 1 and Stage 2 on one private branch… D1 A, D2 A, D3 yes, D4 yes. Backdrop: dated satellite picture with its date shown and a plain-globe coastline fallback. Complete Stage 1 and obtain GPT's candidate pass before starting Stage 2"). Design: `docs/concepts/ANIMALS-BIRD-BUILD-PROPOSAL.md` rev 3.1, Part A (on branch `animals-expansion-proposal`, `d97880e`), criteria T1 to T18 with the §A7 clarifications. **Stage 2 (the bird) is not started.**

## 1. What to review
- Branch `animals-tab-rc`, cut from the parked `animals-journeys-preview-rc` (`74941ff`, left intact), with main `0e62083` merged in (merge `cf5346e`; main brought documents only, no conflicts).
- Code commit: `5bae569edb1bc3ad367d05b37dbc7f4b98ea7730`. The head is the later commit that adds this packet only.
- Files (sha256 at the code commit):

| File | sha256 | What |
|---|---|---|
| `animals-globe.js` (new) | `06a523d2989436da7d069d4eec97e644c70a8b23e183c378748fa1d2333481b4` | the Animals page's own globe, backdrop and fallback |
| `animals-journey.js` | `c0cfa4dcc22b35febac9a725753a36e0239efe08db751d7631425b624a8a2147` | switches, one at a time, failure handling; verification, drawing and replay logic kept from the passed file |
| `animals.html` | `16db2fa48b49a01c319992cc37cee454644db2f7593ed3008d56436a64c3092a` | globe, replay bar, switch panel, cards |
| `animals.js` | `6d9a1a78081c705e28506e20e4f7299ecbaa560d9779cfd1223d32468b50410a` | header comment only |
| `style.css` | `3ec6dc5119eab585f9660d18edb8697010e786702259940076c7b4faaa473c26` | Animals layout; replay bar in the page flow |
| `index.html` | `678922b5b32637523214efa5137b61436788a0cd7abd2e239c489574bd99ffe5` | main's, plus the Animals tab link, the Animals menu link and the stylesheet version (3 lines) |
| `layers.js` | `1e65fe5da59d9e7f89e0e76126a824af9b47e80fc2469e186af14f801682afe6` | byte-identical to main |
| `phase1/animals-tab-ui.test.cjs` (new) | `8e345ca04835b4be1bf55b998208890721c2ba881513b5daea4ab4686d75105e` | the suite |
| `phase1/bare-earth-ui.test.cjs` | `62b46c4b8f118160d90777dc4e1a2b10141c02f478c3963437d02e9261e9b2d2` | byte-identical to main (16 switches again) |

- `phase1/animals-journey-ui.test.cjs` is removed: it tested the replay on Earth now, which no longer exists on this branch. Its journey checks are carried into the new suite (section 5 of this packet says which were not).
- **No data file and no builder changed.** `assets/animals/` and `phase1/animals/` are byte-identical to the parked branch.
- `moon.html`, `sun.html`, `timeline.html`, `sources.html`: stylesheet version only, on top of the parked branch's Animals links.
- Key: `?v=202612200100`.

## 2. What the page does now
- **Earth now** is main's page again. No journey card, switch, chooser, replay bar, Key entry or Layers row; no Animals script is loaded there; `index.html#journey=…` opens nothing.
- **Animals** has its own globe (same pinned globe.gl 2.45.0), still, whole Earth at load, no current observations on it.
- **Switches:** one `role="switch"` button per animal, grouped Land and Sea, inside one group headed "Animal journeys — one at a time". Nothing is on at load. Switching one on switches the other off first. While a journey loads its switch reads on and busy. No chooser, no radio behaviour.
- **Failure:** a journey that fails returns to off with its message and a Retry on its own row; the earlier journey is not brought back. A journey list that does not verify is one error for the whole group, with its own Retry that checks the list alone.
- **Network:** no journey display file is requested until its switch is on. At load the page requests its own files, the globe library, fonts, one backdrop picture, the journey list and the three manifests (for the cards).
- **Backdrop:** one NASA GIBS picture chosen by Earth now's rule (36 hours back, VIIRS NOAA-21 true colour). The line under the globe gives the picture's own date and says it is not the journey dates. If the picture fails or is not a picture: plain globe with the Natural Earth coastline outline, and the line says the satellite backdrop is unavailable with no date. The coastline file is requested only then.
- **Replay bar** is under the globe, in the page flow. It covers none of the globe at any width.
- **Links:** `animals.html#journey=<id>` and each card's link move focus to that switch and switch nothing on.
- **No usable globe** (no WebGL, library failed, graphics context lost): said in the globe box or under it, switches marked unavailable with the reason, cards and sources still readable. A lost context switches the shown journey off.
- **Leaving and returning:** pagehide and a restored page come back with nothing on; a hidden tab pauses playback.

## 3. Tests
- `phase1/animals-tab-ui.test.cjs`: **169 passed, 0 failed.** **26 of 26 breaks caught**, all rerun on the final file. One further run, `EDIT=no-abort`, removes request aborting: section 5 then fails only the two checks that the request itself was aborted (5b, 5g), which shows the generation check alone refuses a superseded answer.
- Coverage by criterion: section 1 = T1, T2, T3, T12, T15 at load; 2 and 4 = T4, T7; 3 = T5 (all six ordered pairs); 5 = T6 (late answer, on then off while loading, A-B-A, three in a row on a held network); 6 = T8 (local failure, Retry, changed display file, changed manifest, out-of-order content, shared list error and its Retry); 7 = T9, T10; 8 = T11; 9 = T14; 10 = T15; 11 = T17; 12 = T18; 13 = T13; 14 = T16 (360, 390, 720, 900, 1100, 1280, 1470 px); 15 = the cards.
- T13 baseline is the merged main commit `0e62083`: `index.html` equals it except the three stated lines; 18 files (Earth now's scripts, `layers.js`, the hub Worker source, the collector, the Bare Earth suite) are byte-identical.
- Rerun on this tree: `bare-earth-ui` 190 of 190, `layer-switches-ui` 68 of 68, `timeline-ui` 594 of 594, `desktop-overflow` 286 of 286, `smoke-fixes` 113 of 113. Builders: `build_journey.test.py` 22, `argos_rules.test.py` 17, `build_argos_journey.test.py` 28 (part 3, real inputs, not run: the inputs are not in the repository).
- **Not run: `mobile-pass` and `key-drawn-ui`.** Both need a captured-hub fixture (`orbital.csv`) that was in an earlier session's workspace and is not in the repository. They test Earth now, whose files check 13c shows are byte-identical to main.

## 4. Things I would like GPT to look at
1. **Phone order.** At 900 px and under the order is globe, replay bar, switches. Pressing a switch on a phone leaves the reader below the globe: the journey draws above the fold and only the announcement and the row text say so. The proposal fixed this order; I have not added an automatic scroll. Options: leave, add a "Show globe" link on the row, or scroll the globe into view on "shown".
2. **Imagery rule is duplicated,** not shared: `animals-globe.js` carries its own copy of the 36-hour offset, layer and address, and check 1i fails if they differ from `app.js` and `index.html`. Sharing one file would have meant editing Earth now's scripts, which T13 forbids.
3. **Retry on the shared list** re-checks the list only and switches nothing on. The reader then presses a switch again.
4. **Cards still load at page open** (journey list and three manifests), as on the passed branch. §A7 allows it; stated here so the network contract is read with it.

## 5. Not proven, and what was not carried over
- Performance; a real phone; a screen reader (roles, names, states and focus are read from the page, not heard); real NASA imagery (a small stand-in picture is served); a real lost graphics context on real hardware (the browser's lose-context extension is used).
- From the old suite, not carried: the Earth-now couplings that no longer exist (Key entry, Layers row, sky-zoom, chooser, card details), and the full sampled bar-text sweep (old 20o: every ninth fix and every gap). The new suite checks bar wording at the points in sections 2 and 12 only. The bar-text code is unchanged from the passed file.
- The source-file build checks, as before.

## 6. Still open
- Stage 2 (bird) waits for GPT's pass of this candidate.
- Sources page, REGISTER, sensitivity and public-release decisions. Enquiries: all sent by Chad; no reply reported.
