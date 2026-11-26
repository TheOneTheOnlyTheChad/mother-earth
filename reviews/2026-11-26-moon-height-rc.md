# moon-height-rc — Moon height layer, branch preview for GPT's review

26 Nov 2026 · Claude · branch `moon-height-rc` · **preview only: not merged, nothing deployed, no hub change**

- **Go:** Chad's own line (26 Nov, in the thread): "I accept D1–D4. Go ahead with the `moon-height-rc` branch preview under rev 2.1, incorporating GPT’s notes. Page only; return the candidate for GPT review. No merge or deployment." (GPT's drafted line had been relayed first; Claude asked for Chad's own line before building.)
- **Proposal:** `docs/concepts/MOON-LRO-SCIENCE-PROPOSAL.md` rev 2.1 (rev 2 passed by GPT's recheck, `reviews/2026-11-26-moon-lro-proposal-rev2-gpt-recheck.md`).
- **Commits:** payload `f884b7c` (parent: main `97815dd`), then the Animals-suite pin maintenance `5e835de`, then this packet (see the message for the exact final commit).

## 1. What the candidate does

On `moon.html`, a new button **"Show height (LOLA)"** (off by default) replaces the Moon picture with a colour map of LOLA `LDEM_4_FLOAT` V3.0: height relative to the 1,737.4 km reference sphere, one colour per 0.25° cell, from laser data taken 2009–2016. It has a legend (one-hue blue ramp, dark = low, light = high, −9 to +11 km; "Measured" tag; what the quantity is and is not; rounding is not accuracy; not live), a click readout giving the containing cell's value (no interpolation), and a keyboard button **"Read height at centre"**. North of 89.5°N is withheld: grey on the globe, a legend swatch, and the readout sentence "Values north of 89.5°N are withheld because inconsistencies were found in the source products." Sources and method gains one line with the product, LIDVID, DOI and the public-domain note.

Nothing else on the page changes while height is off (the four existing Moon suites pass unchanged).

## 2. Files (payload `97815dd..f884b7c`, exactly these nine)

| File | Change |
|---|---|
| `assets/moon/lola/ldem4-m-R1.i16.gz` | new · 1,776,231 B · sha256 `af445001…7d43d` (the file GPT verified at rev 2) · decompressed 2,073,600 B, sha256 `392bceff…c155` |
| `assets/moon/lola/ldem4-colour-R1.png` | new · 802,415 B · sha256 `e9281ca2…3a58` · 2048 × 1024 indexed PNG, 0° at the centre, one colour per cell (254 ramp colours, about 79 m a step), cap grey `#8c8c8c` |
| `assets/moon/lola/SOURCE.json` | new · source, comparison product, withheld rule, build, files, cadence, last checked 26 Nov 2026 |
| `phase1/moonsci/build_lola.py` | new · refuses any source but the pinned PDS file; `--check` rebuilds both files in memory: **byte-identical** |
| `moonsci.js` | new page file · button, loading, two-pin integrity, explicit little-endian decode, legend, readout, state contract |
| `moonsci.css` | new · legend and readout styles, and a visible disabled style for the lighting buttons while height is shown; linked from `moon.html` only; **`style.css` unchanged** |
| `moonglobe.js` | edit · a small `height` hook (texture swap, lighting lock, restore through the existing "Lit as now" path, clicks from `toGlobeCoords`, the grey cap polygon); the "Lit as now" button now goes through `litTo()` (same behaviour) |
| `moon.html` | edit · button pair, legend block and readout, one scale line, one Sources line, `moonsci.css` link, `moonsci.js` tag, `moonglobe.js` version key |
| `phase1/moon-height-ui.test.cjs` | new suite |

Then `5e835de` changes only `phase1/animals-tab-ui.test.cjs` (§5). Not touched: `lroc_color_2k.jpg`, `tides.*`, `craft.js`, `sunglobe.js`, `index.html`, `sources.html`, `skyscene.js`, `style.css`, `REGISTER.md`, the hub.

## 3. GPT's implementation notes (rev 2 recheck), and where they are

| GPT note | In the candidate |
|---|---|
| Decode little-endian explicitly | `DataView.getInt16(2 * i, true)` into an `Int16Array`; BREAK `be` (big-endian read) fails 31 checks |
| Cancellation and rapid toggles | each load carries a token and an `AbortController`; switching off during loading increments the token and aborts. Tested with the abort working **and** with the abort disabled (answer arrives anyway): the token alone keeps height off. BREAK `late` (token check removed) is caught by the second test |
| Evidence comparisons as failing assertions | suite A: every one of the 1,036,800 decoded values equals the build file; withheld marker exactly on rows 0–1; every kept cell within 0.5 m of the PDS float; named cells; 50 spread cells. The build's `--check` exits non-zero on any byte difference |
| Narrow §11 | done in proposal rev 2.1 |
| Compressed and decompressed paths independently checked | a gzip answer must match the compressed pin **and** the decompressed pin; an already-decompressed answer must match the decompressed pin. BREAK `nopin` (decompressed pin skipped) and `noraw` (raw path refused) are caught |

## 4. Two findings while building (changed from rev 2.1, for review)

1. **Clicks.** globe.gl's `onGlobeClick` reports the point under the pointer as of the last animation frame. A click that arrives straight after the pointer moves (a tap on a phone, or an automated click) got the *previous* position, and the very first click got none. The hook now works the point out from the click event itself (`globe.toGlobeCoords` at the pointer), and ignores a press that moved more than 6 px (a drag). Suite B checks that each click registers at once and lands within 0.25° of the aim.
2. **The withheld cap.** In the texture the cap is three pixel rows. At the pole the graphics card blurs them into the blue (measured on screen: a blue-grey smudge, about (103, 116, 147)). So the cap is also drawn on top as **one grey polygon** (top only, no sides or outline). It reads as neutral grey (140, 140, 140) on screen and costs **about one small extra draw per frame** while height is shown (§6). The legend swatch is plain grey to match (rev 2.1 said diagonal stripes).

Smaller differences from the proposal's wording: the colour texture is an indexed PNG (802 KB) rather than JPEG/WebP, so colours are exact and the colour-under-the-click test needs no lossy tolerance. Keyboard reading uses "Read height at centre" with the existing turn buttons, rather than a separate arrow-key selection point.

## 5. Animals-suite pins (narrow, the Animals owner's pattern)

`phase1/animals-tab-ui.test.cjs` pins `moon.html` and `moonglobe.js` byte-for-byte. Maintenance commit `5e835de`, which changes only that suite:
- `MH_MAIN` = `f884b7c`, `MH_PARENT` = `97815dd`, literal `MH_FILES` (the nine files above);
- `moonglobe.js` leaves the 13c list (12 files remain) and is held to `MH_MAIN` by new **13q**;
- **13e moon.html** is held to `MH_MAIN` (each height addition present exactly once) and, with exactly those additions set aside, still to its old baseline;
- **13r**: `MH_PARENT..MH_MAIN` changes exactly `MH_FILES` (no `index.html`, `sources.html`, `style.css`, `app.js`, animals scripts or hub);
- **13s**: the maintenance after `MH_MAIN` changes only this suite.
No other baseline moves. Result at the final commit: **291 passed, 0 failed** (13q, 13r and 13s included).

## 6. Measurements (26 Nov, headless Chrome, SwiftShader, workspace machine)

| | Value |
|---|---|
| First switch-on download | 1,776,231 + 802,415 = **2,578,646 B** (proposal estimate was 1.95–2.05 MB with a lossy texture; the lossless indexed PNG is larger) |
| Later toggles | no requests (tested) |
| While height is off | no height requests (tested) |
| Grid decode | fetch about 50 ms, decompress about 20 ms (local server; rev 2 measurement) |
| Idle draw calls per 5 s, height off / on (suite D) | **223 / 478** in the final run (earlier runs 256 / 538 and 242 / 518; 265 / 1,290 before the cap was reduced to its top only). The texture swap adds nothing; the grey cap adds about one draw per frame. The globe already redraws continuously (rev 2 §5); this layer does not change that |

## 7. Tests

| Suite | Result |
|---|---|
| `phase1/moon-height-ui.test.cjs` (new) | **88 passed, 0 failed** at the final commit. Breaks, each caught: `be` 31 fails, `late` 1, `nolock` 2, `norestore` 2, `early` 9, `nocache` 1, `row` 10, `col` 24, `noraw` 2, `nopin` 1 (run on the payload before the final CSS line) |
| `phase1/moonsci/build_lola.py --check` | OK, both files byte-identical (final commit) |
| `moon-globe` | 67 passed, 0 failed |
| `moon-lit` | 138 passed, 0 failed |
| `moon-lro-path` | 68 passed, 0 failed |
| `moon-light` | 27 passed, 0 failed |
| `animals-tab-ui` (with the new pins) | 291 passed, 0 failed (final commit) |
| `skycraft-ui` | 77 passed, 0 failed |
| `smoke-fixes` | 113 passed, 0 failed |
| `desktop-overflow` | 286 pass, 0 fail |
| `tides-nav` | 2,882 passed, 0 failed |

The four existing Moon suites, `skycraft-ui`, `smoke-fixes`, `desktop-overflow` and `tides-nav` ran on the payload before its last two changes: the suite's own late-answer and tolerance edits, and the one-line disabled-button style in `moonsci.css`. Neither change touches what those suites check. The new suite, the build check and the Animals suite were rerun at the final commit. The full 100-suite regression was not run; the suites above are the ones that load `moon.html`, `moonglobe.js` or the header.

The suite needs `LOLA_SRC=<dir with ldem_4_float.img>` for the checks against the PDS float. The file is on Chad's Mac in `_source-data/moon-lro-science-2026-11-26/`. Without it, that check fails loudly rather than skipping.

**Not checked:** real phone, Safari, screen reader, real graphics hardware. The state contract was tested under software WebGL only.

## 7b. Preview

Screenshots (headless Chrome, software WebGL) on Chad's Mac in `_review/moon-height-rc/screenshots/`: picture before, height near side with a click readout, far side, north pole with the withheld cap and its readout, phone width 390 px. A copy of the branch tree is in `_review/moon-height-rc/tree/`. To look in a real browser, serve that folder (for example `python3 -m http.server 8899` in it) and open `moon.html`.

## 8. Asked of GPT

Review the candidate at the commit given in the message: the two findings in §4 (the click route and the grey polygon cap with its one extra draw per frame); the legend and readout wording; the state contract as built; the Animals pins (§5); and the larger first download (§6). No merge or deployment before Chad's own Approve line naming the final commit. The release round (REGISTER entry, Sources section with its Animals pin, new served-file manifest) comes after this review.
