# moon-height-rc — release candidate for GPT's review

26 Nov 2026 · Claude · branch `moon-height-rc` · **release candidate: not merged, nothing deployed, no hub change**

- **Preview review:** GPT, PASS for the branch preview at `2ac103e` (`reviews/2026-11-26-moon-height-rc-gpt-review.md`, filed unchanged from the Mac's `ChatGPT/Mother Earth/MOON-HEIGHT-RC-REVIEW-2026-11-26.md`, sha256 `f04ddb7b…8661`).
- **Chad's own line (26 Nov):** "I accept the preview, the 2,578,646-byte optional download and extra polar-cap draw. Prepare the release candidate, including GPT’s resource-cleanup fix and focused tests, Sources and REGISTER records, narrow Animals pins and refreshed served-file manifest. Return the exact final commit for GPT review. No merge or deployment yet."
- **Commits since the preview (`2ac103e`):** release payload `83f7c32`; Animals pins moved to it `bb001b9`; Animals check wording fix `b468034`; this packet and the records (final commit given in the message). The preview packet `reviews/2026-11-26-moon-height-rc.md` stays as the preview record.

## 1. What changed since the preview

| GPT's request | Done |
|---|---|
| **Resource cleanup**: revoke a texture object URL made by a cancelled or failed attempt; abort the sibling load when one fails; keep the committed URL | `moonsci.js` `turnOn()`: both loads share one `AbortController`; the first failure aborts the other (`first()`), and its reason is the one shown. `Promise.allSettled` waits for both outcomes, so the attempt's texture URL is either committed as the cache or revoked (`drop()`). A late answer after switching off is revoked too. The cached URL is never revoked |
| **Focused tests** | new in `phase1/moon-height-ui.test.cjs`: texture 404, texture bad hash, texture timeout, texture decode failure, texture-ok/grid-404 (texture made then dropped); each leaves nothing changed, gives the reason and leaves **no object URL**. Cancellation after the texture arrived leaves no URL; a later success keeps exactly one; later toggles make none; a grid failure while the texture is still loading **aborts the texture request** (`net::ERR_ABORTED` seen) and shows the grid's reason. New breaks `nofirst` (no sibling abort) and `norevoke` (no revoke) are both caught |
| **Test claims at their real scope** | the colour check is now named for what it is: the screen colour at the click is within 36 per channel of the saved texture's colour at the clicked point, as visual registration evidence at that scope, **not** proof of unfiltered per-cell rendering. The numerical claims rest on the source-value tests (all 1,036,800 values). No synthetic known-cell colour control was added in this round |
| **Keyboard claims** | the packet and page claim only the "Read height at centre" button with the existing turn controls. No arbitrary-cell keyboard selection is claimed, and the north cap cannot be reached by keyboard (the view buttons stop at 85°) |
| **Sources and REGISTER** | `sources.html`: new section `#moonheight` just before the Sun globe section (Measured tag; what the quantity is and is not; cell values without interpolation; rounding is not accuracy; source, period, DOI citation, public-domain note; grid and observation-count caveat; the withheld wording; how we use it; credit) and one shortcut before Tides'. `REGISTER.md`: entry for LOLA `LDEM_4_FLOAT` V3.0 and our two derived files (source, label, checks, withheld rows, files, request method, terms, limits, version check, commercial use). `moon.html` Sources and method links to `sources.html#moonheight` |
| **Narrow Animals pins** | `bb001b9`: `MH_MAIN` = `83f7c32`; `MH_FILES` is the literal path set of `97815dd..83f7c32` (18 paths, including the preview's records and its own pin maintenance); new check **13e sources.html (height)**: the file equals `MH_MAIN`'s and holds the section and shortcut exactly once; the existing 13e sources.html check now compares the file **with exactly those two additions set aside** against the Tides baseline and the chain behind it. Two new breaks (`mh-sources-section-edited`, `mh-sources-shortcut-gone`) are caught. 13r now allows `sources.html`; `index.html`, `animals.html`, `tides.html`, `style.css`, `app.js`, the animals scripts and the hub stay forbidden |
| **Refreshed served manifest, history kept** | `phase1/moonsci/served_manifest.mjs` writes `reviews/evidence/2026-11-26-moon-height-manifest.json`: **42 files** (35 root page files, now including `moonsci.js` and `moonsci.css`, plus the Tides pictures and record, the Moon picture and the three Moon height files). `--check` passes on this tree; `--pane` prints the after-release served check. The Tides release and dedication manifests are unchanged |

## 2. Files in the release (main `97815dd` .. payload `83f7c32`)

Page and served: `moon.html`, `moonglobe.js`, `moonsci.js`, `moonsci.css`, `sources.html`, `assets/moon/lola/ldem4-m-R1.i16.gz` (1,776,231 B, `af445001…`), `assets/moon/lola/ldem4-colour-R1.png` (802,415 B, `e9281ca2…`), `assets/moon/lola/SOURCE.json`. Records and tools: `REGISTER.md`, `phase1/moonsci/build_lola.py`, `phase1/moonsci/served_manifest.mjs`, `phase1/moon-height-ui.test.cjs`, `phase1/animals-tab-ui.test.cjs` (pins), `reviews/…`, `reviews/evidence/2026-11-26-moon-height-manifest.json`, `STATUS.md`, `HANDOVER.md`. Not touched: `index.html`, `animals.html`, `tides.*`, `style.css`, `app.js`, `craft.js`, `sunglobe.js`, `skyscene.js`, `lroc_color_2k.jpg`, the hub. No stylesheet key changes on any other page.

## 3. Tests on the final tree

Page tree = payload `83f7c32` (no page or asset file changes after it). Run 07:11–07:49 UTC (clock readings) at `bb001b9`, then the Animals suite again at `b468034` after a one-line fix to its own new check (the Sources sentence continues with a colon, not a full stop).

| Check | Result |
|---|---|
| `build_lola.py --check` | OK, both files byte-identical |
| `served_manifest.mjs --check` | 42 files (35 root page files + 7 assets) match this tree |
| `moon-height-ui` | **110 passed, 0 failed** (22 more than the preview: texture failures, cleanup, sibling abort). Breaks caught: the preview's ten, plus `nofirst` (1 fail) and `norevoke` (4 fails) |
| `animals-tab-ui` | **292 passed, 0 failed** at `b468034` (at `bb001b9` the new Sources check failed on the colon; fixed in the suite only). Breaks `mh-sources-section-edited` and `mh-sources-shortcut-gone`: both BREAK CAUGHT at 13e sources.html |
| `moon-globe` | 67 passed, 0 failed |
| `moon-lit` | 138 passed, 0 failed |
| `moon-lro-path` | 68 passed, 0 failed |
| `moon-light` | 27 passed, 0 failed |
| `skycraft-ui` | 77 passed, 0 failed |
| `smoke-fixes` (Sources text at seven widths) | 113 passed, 0 failed |
| `desktop-overflow` | 286 pass, 0 fail |
| `tides-nav` | 2,882 passed, 0 failed |

Idle draw calls per 5 s in this run: height off 239, on 484 (accepted extra cap draw). The full 100-suite regression was not run; the suites above are the ones that load `moon.html`, `moonglobe.js`, `sources.html` or the header.

## 4. Evidence limits (carried from GPT's preview review)

- All browser checks are headless Chrome with software WebGL on the workspace machine. **Not checked:** a real phone, Safari, a screen reader, real graphics hardware.
- Draw-call counts are not a measure of energy, CPU cost or perceived performance.
- The colour-at-click check is visual registration at its stated scope, not proof of exact per-cell rendering (GPU filtering affects cell boundaries). The values themselves are proven by the source-value tests.
- The keyboard route is "Read height at centre" with the existing turn buttons; the north cap is not reachable by keyboard.
- No post-deploy claim: the served-file check runs only after a merge, on Chad's Approve line.

## 5. After GPT's review

If GPT passes it: Chad's own Approve line naming the final commit; `git merge --no-ff` to main (page only, no hub deploy); the 42-file served check in the browser pane (`node phase1/moonsci/served_manifest.mjs --pane`); release records (START-HERE live line, STATUS, HANDOVER, REGISTER status line); close-out.

## Erratum (12:31 UTC 26 Nov 2026, clock reading; found by Claude while moving this suite onto the shared Moon science coordinator, accepted in GPT's review `reviews/2026-11-26-moon-diviner-ui-gpt-review.md`)

The text above is left as it was. Two of `phase1/moon-height-ui.test.cjs`'s deliberate breaks, `late` (removes the token check) and `nocache` (removes the caches), replace exact strings in `moonsci.js`. Those strings exist in the preview payload `f884b7c`, where both breaks were caught. They do **not** exist in the release payload `83f7c32`: the release candidate rewrote those lines (cleanup and sibling abort), and both breaks then changed nothing. The release candidate's "the preview's ten" breaks therefore were not all re-established against the released code: `late` and `nocache` are unsupported as release evidence. The behaviour itself was tested by assertions (the late-answer tests, with the abort disabled too; the no-request-on-later-toggles test). What was not shown at release is that those tests catch a removed token check or cache. Corrected on branch `moon-diviner-ui`: every break must find its pattern or the suite stops, and `late` and `nocache` target the current code and are caught (`reviews/2026-11-26-moon-diviner-ui-rc.md` §6 and `reviews/2026-11-26-moon-diviner-ui-rc-rev2.md`).
