# Animals: regional satellite picture under the East Walker corridor. Candidate packet for GPT

22 Nov 2026 · branch `animals-satellite-rc` · built by Claude ("Animals satellite picture" thread) · **branch only: nothing merged, nothing live changed, REGISTER not touched.**

Authority: Chad's own line of 22 Nov, "Go: satellite picture build on a branch per ANIMALS-SATELLITE-PROPOSAL rev 1.1. S-D1 A; S-D2 B; S-D3 B; S-D4 A; S-D5 A. Branch only, no merge." Governing text: `docs/concepts/ANIMALS-CORRIDOR-PROPOSAL.md` rev 2.2 (§4.3, §6.1 to §6.5, §7) and `docs/concepts/ANIMALS-SATELLITE-PROPOSAL.md` rev 1.1 with your clarifications (§7 there). Your review of the proposal: `reviews/2026-11-22-animals-satellite-proposal-gpt-review.md` (on branch `animals-satellite-proposal`).

Everything below was run or read by Claude unless it says otherwise. Mac figures were taken in Chad's Chrome on his Mac with Chad at the machine.

## 1. What is asked of you

1. The code and tests: does the candidate do what §6.2 and your clarifications fix?
2. **The two first-build gates (§3 and §4 here). Gate 1 I read as met within what was looked at. Gate 2 is not clean: one switch-on of fourteen with the picture exceeded the 500 ms task limit (562 ms), in a session where the Mac's speed changed mid-run, and the Mac never returned to this morning's fast state.** I need your judgement on whether that is enough, needs a repeat, or sends the build back to B.
3. The REGISTER line draft: `reviews/2026-11-22-animals-satellite-register-draft.md`.

## 2. What was built

Base: main at `34bb752`. Main has since moved (docs and the Earth from Space REGISTER entry only; no page file); the branch needs main merged in before any release.

| File | Change |
|---|---|
| `animals-corridor.js` | The picture: request, limits, cap, cache, two meshes of its own, own status line and button. New list pin. Header comment brought up to date (the stale "PRIVATE PREVIEW" words in this file's header are gone with it). |
| `animals.html` | One element under the legend (`#cor-pic` with its text and button). Version stamps for the corridor script and the stylesheet. |
| `style.css` | **Shared file.** Five added rules, all under `.cor-pic`, `#cor-pic-retry` or `.cor-pic-on .cor-tick`. No existing rule changed. |
| `phase1/animals/mule-deer-east-walker-corridor.json`, `build_corridor.py` | A `picture` block and seven wording entries; the builder checks them (new stop rule 28) and carries them into the manifest. |
| `assets/animals/…corridor-R1.manifest.json`, `corridors-R1.catalog.json` | Rebuilt from the pinned archive on Chad's Mac and re-pinned. **The display file `…corridor-R1.json` is byte for byte unchanged** (compared before and after the rebuild; `--check` passes). |
| `phase1/animals-corridor-ui.test.cjs`, `build_corridor.test.py` | Section 11 (25 checks) and 18 breaks; builder checks 2j and 3b3. |

Not changed: `animals-globe.js`, the journey and census scripts and assets, Earth now, the hub. The request reuses the page's own backdrop URL (`ME.animalsGlobe.IMG_URL`) with only WIDTH, HEIGHT and BBOX replaced, so the endpoint, layer and date constants stay single.

**How it behaves**

- **Requests.** Nothing at page load. One automatic attempt the first time the corridor is switched on. A valid picture is kept in memory (the decoded bitmap) and reused. Further attempts only from "Try the regional picture again". Three attempts per page load, a stopped one included; the count is never reset by a toggle. Nothing on pan, zoom, resize or frame.
- **Validity.** 20 s to answer (body included), 5 s to decode, content type must be an image, size exactly 960 by 800. An HTTP 200 XML error page is a failed picture.
- **Independence.** `finish()`, `watch()`, `built()`, `done()` and `draw()` are untouched. The picture is reconciled from `paint()`: asked for once, drawn only when the corridor's status is "shown", removed and its request stopped when the corridor is not on. A picture that arrives first waits. Its own "shown" is set only after it is attached and the renderer's frame count has advanced.
- **Off, failure, lost context.** Both meshes, both materials and the texture are removed and disposed; the bitmap stays. A late answer after a stop draws nothing and closes its bitmap.
- **Drawing.** Two meshes added beside the globe mesh: the picture (24 by 20 cells, corners from the library's `getCoords`, unlit) and the S-D2 dark edge (thin strips under each reference line, 0.004° half-width, from the manifest). Both have `raycast` off, write no depth, and are ordered by draw order (globe, picture, edge, then the library's polygons and lines as before). The library's three layers are not touched, so `built()` counts and the scale bar's raycasts are as before. Labels get a stronger outline by a class on the globe box while the picture is shown.
- **Wording** (all from the manifest): the §4.3 sentence with S-D3 B, then "GIBS image grid about 250 m per pixel, enlarged for display." The card's details add a method note saying grid spacing is not instrument detail or positional accuracy. No instrument-band figure anywhere. With the picture shown the legend drops the sentence about the whole-globe blur.
- **Announcements.** Automatic results change the visible line only. A result of the button is announced. The pressed button keeps the focus and stays in place, inactive, until focus leaves it.

**One thing to know about the texture.** The globe library does not hand out its texture class. The script takes it from the globe's own image when there is one, otherwise from the render target of the library's post-processing composer. If neither exists the picture is reported unavailable with no request counted as a retry path. Section 11 runs with the plain globe (NASA refused), so the second route is the one the suite exercises; the Mac runs exercised the first.

## 3. Gate 1: the picture against the whole-globe satellite backdrop

Served review copy on Chad's Mac (`http://127.0.0.1:8913/animals.html`, five page files hash-checked in the tab against commit `3721316`), Chrome 157, whole-globe backdrop loaded ("imagery"), 22 Nov about 11:49 to 11:51 UTC. Screenshots in `reviews/evidence/2026-11-22-animals-satellite-rc/`.

| View | What I saw |
|---|---|
| Desktop 1,470 px, corridor view, rule date 20 Nov (bright cloud) | Picture sits inside the blurred whole-globe picture as a hard rectangle. Lines read clearly (dark edge with the pale line inside); labels crisp; both classes on top; scale bar worked out. Lower edge of the picture runs past the bottom of the globe frame. |
| Desktop, corridor view, 12 Nov (clear) | Same placement; terrain, snow and lakes as in the proof; the diagonal pass edge is in the picture. **The date was swapped by a wrapper in my tab for this one request, as a test; the page's line still said 20 Nov. Not something the page can do.** |
| Desktop, pulled back (altitude 0.07 and 0.5) | Picture stays in place and shrinks to a few pixels; no stripes or holes in the stills. |
| 390 px wide (an iframe 390 by 780 in the same tab), corridor view, rule date | Fits; no sideways overflow (measured 0); lines and labels readable. |

No rotation or mirroring (also pinned by check 11c with a four-colour test picture). No displacement against the labelled grid by construction: the mesh corners come from the same box the request names.

**Limits of this gate as run:** stills only. I did not watch continuous motion, so "no flicker" rests on six stills and on the draw-order design, not on a watched orbit. No clear example at 390 px. No georeference check against a reference dataset; the NAD83(NSRS2007) disclosure and the absence of an established absolute offset stand unchanged.

## 4. Gate 2: drawing cost on the Mac

Script: `reviews/evidence/2026-11-22-animals-satellite-rc/mac-confirm-picture.js` (built on the previous thread's `mac-confirm.js`; same capture-health rule; fetched at the commit and hash-checked before it ran). It wraps `window.fetch` for the regional request only, so part A can run with the picture refused. Results: `mac-results-2026-11-22.json` (summaries; the two full result objects were read in the session and their sha256 recorded, not saved byte for byte). Every timed window reported valid capture health. Limits: longest task 500 ms; switch-on to areas shown 1,500 ms.

**The Mac was in its slow state.** The fixed arithmetic loop read 249 and 236 ms at the start of run 1 and 1,934 ms at its end, then about 1.9 s for the next nine minutes (this morning: 229 to 261 ms). Cause not established, as on 21 Nov. Chad was at the Mac; the tab reported visible and focused.

| | Longest task, 7 redraws | To areas shown | To picture shown |
|---|---|---|---|
| **Run 1** (speed changed mid-run), picture refused | 196 to 295 ms | 297 to 385 ms | n/a |
| Run 1, picture in memory | **562**, 334, 281, 269, 255, 277, 290 ms | 343 to 661 ms | 360 to 678 ms |
| **Live main, no picture code** (previous thread's script, same slow state, between the runs) | 280 to 308 ms | 358 to 395 ms | n/a |
| **Run 2** (slow throughout), picture refused | 247 to 289 ms | 332 to 374 ms | n/a |
| Run 2, picture in memory | 252 to 288 ms | 326 to 369 ms | 343 to 419 ms |

- **Arrival (the real request, through the page's button, areas already shown), one sample per run.** Run 1: fetch 666 ms, decode 22 ms, attach 5.3 ms, then **one 438 ms task** before the first frame with the picture. Run 2: fetch 817 ms, decode 10 ms, attach 4.6 ms, 28 ms to the frame, **no long task**. I have not established why the first was large; a first-use shader build is a guess, not a finding.
- **Re-enable with the picture in memory:** attach 1.5 to 14.1 ms, 19 to 37 ms to the frame, no further request (count stayed 2).
- **Five-second orbits, median frame interval 16.7 ms in every state in both runs.** Worst frame: nothing on 17.7 and 18.8; corridor without picture 49.9 and 18.8; corridor with picture 17.7 and 33.3; corridor and zebra without picture 134.1 and 66.2; corridor, picture and zebra 34.3 and 18.7.

**Against the limits, stated plainly:** to-shown met in all 28 redraws. The task limit was met in 27 of 28 and **exceeded once (562 ms)**, on the first re-enable with the picture in run 1. In run 2, one state throughout, the picture added nothing measurable (252 to 288 ms with, 247 to 289 ms without) and the live page without any picture code measured 280 to 308 ms in the same state. **Not measured: the fast state.** I do not claim the limit is met "in both states", and I do not claim the 562 ms was caused by the Mac's change of speed; it happened in the run where the speed changed.

## 5. Tests (workspace, software renderer, NASA never asked)

| Suite | Result |
|---|---|
| `animals-corridor-ui` (sections 1 to 11; 25 new checks in 11) | 98 of 98 |
| `animals-tab-ui` (section 13 against main at `0e62083`) | 277 of 277 |
| `animals-census-ui` | 71 of 71 |
| `build_corridor.test.py` with the real archive (`ME_CORRIDOR_ZIP`) | 38 of 38, part 3 run; the Snyder printed example still NOT DONE, as before |
| Deliberate breaks, corridor suite | 51 of 51 caught (33 earlier ones, 18 new for the picture); `late-answer-draws-token-only` gave no failure, as it is defined to |

All five rows were run on the code of commit `3721316` (the tab and census suites were rerun on it after the dark edge was thinned).

Breaks, said straight: on the first pass ten of the eighteen new breaks came back MISSED, because I ran four at once on two processors and waits timed out before the checks ran. I made every wait in section 11 tolerant and reran. On the final code five section 3 breaks again came back MISSED when run two at a time (suite error from load, no check had failed); each was CAUGHT when run alone. The 51 above are the final results, the last five from single runs.

Section 11 covers: nothing asked at load; the exact request; both meshes and their properties; orientation by pixel; no request on drag, wheel, resize or frames; off and on with no second request; picture first and areas first; attached but no frame; XML 200, wrong size, HTTP 500, undecodable body, refused connection; the cap; stop on off with a late answer; fetch and decode limits; areas failing to draw with the picture in memory; lost context; 390 px; no page errors.

**Not covered:** Safari, a real phone, a screen reader (parked by Chad). The `mobile-pass` and `key-drawn-ui` suites (fixtures not in the repository). A wheel-zoom check exists only inside 11m. The texture-class route through the composer was exercised only on the software renderer.

## 6. Open points for you and Chad

1. Gate 2 as it stands (§4).
2. The 438 ms task at the first arrival in run 1: under the limit, not reproduced, cause not established.
3. Stills only for gate 1.
4. The picture's lower edge leaves the globe frame at the corridor view on a desktop window; S-D4 A accepts the hard rectangle, and nothing about the view was changed.
5. The branch must take main in before a merge; the REGISTER line would then be added under the GIBS entry on Chad's own filing line.
