# Review packet — Sky zoom-out view, branch `sky-zoom-rc` (candidate)

- **Written:** 10 Nov 2026, from 13:10 UTC (clock reading).
- **Basis:** `docs/concepts/SKY-ZOOM-OUT-PROPOSAL.md` rev 2.2; source pass `docs/research/SKY-ZOOM-OUT-SOURCE-CHECK.md` rev 1.1.
- **Chad's go (10 Nov):** "we have already been given the go ahead to show this stuff". Taken as the go for the REGISTER update (main `71fb5d9`) and this **branch-only** build.
- **Branch only:** no merge, R2 write, hub deploy or page change. Each of those needs its own Approve line.
- **For GPT's review.**

## 1. What is on the branch
| Part | File(s) | sha256 (prefix) / size |
|---|---|---|
| Earth orientation, transcribed from ERFA `1a8044c` (IAU 2006 bias-precession + GMST 2006), with the complete file-level notice of all ten ported files, verbatim | `phase1/sky/earth_orient.py` | `50d89822`, 7,703 B |
| ERFA LICENSE, verbatim | `phase1/sky/ERFA-LICENSE.txt` | `b1858f9a` |
| Scene generator (pairs with R1; refuses an unpaired build) | `phase1/sky/build_scene.py`, manifest `phase1/sky/revisions/sky-scene-2026-11-R1.json` | `60f2791e` |
| **Scene file** `sky-scene-2026-11-R1` | `phase1/sky/catalogue/sky-scene-2026-11-R1.json` (+ `BUILD-scene.json`) | **`d4605c3d4abc2c022aef6d5df4d2e92f7c29a01c583b43fa7efdbbaf9901ae29`, 67,778 B** (25,734 B gzip) |
| **Hub 0.6.6:** one new `SKY_REVISIONS` pin; index lists `catalogues.sky.scene`; no route or validation code change | `phase1/worker.js` | `4231114d…`, 283,352 B |
| Page view | `skyscene.js` (new page file) + `index.html`, `sky.js` (pin exposed in `ME.skyState().sha`; header wording), `style.css`, `sources.html` (`#sky-scene`; Two Clocks wording) | skyscene `b1449044`, index `5193cb51`, sky `2056da8d`, style `fad92f02`, sources `fb682867` |
| Assets | `?v=202611241000` on index.html and sources.html. timeline.html unchanged (`202611221000`), as at the Sky release | — |
| REGISTER | ERFA entry: **ten** files (the six named, plus the four helpers they call: `ir`, `rz`, `rx`, `anp`), incorporated on the branch | — |

**Served-hash checks after a release would cover nine page files** (adds `skyscene.js`).

## 2. Test results
- **Scene generator** — `python3 -I phase1/sky-scene-build.test.py` (needs pyerfa): **14/14**.
  - Check 1: scene vs ERFA `c2t06a`, measured max **0.00251°** (≤ 0.004). Plain-Python method vs ERFA `pmat06`/`gmst06` ≤ 0.0001° (matrices bit-identical on spot dates).
  - Checks 4 and 20 also covered.
  - Breaks that fail: `no-precession`, `era-only`, `wrong-day` (computed), `rounded-range`, `coverage-drift`, and three unpaired-refresh fixtures (export changed, wrong pin, different generator run).
- **References** — `node phase1/sky-scene-ref.test.mjs`: **7/7**.
  - Check 2 vs astronomy-engine: max **0.00272°** (≤ 0.005).
  - Check 3 Sun vs `ME.subsolar`: max **0.01149°** (≤ 0.02).
  - Breaks: `wrong-day`, `antipode`, `mirror-lng`, plus two **simulated** (labelled as such): swap-axes in the file, and era-only as an offset.
- **Hub** — `node --no-warnings phase1/sky-scene-hub.test.mjs`: **7/7**, with the actual scene and R1 bytes. Breaks `serve-on-fail` and `no-envelope-check` each fail.
  - `sky-hub` 46/46; its 7 breaks still fail.
  - The test pin of the "one revision" table was loosened to "R1 unchanged + scene".
- **Page** — `node phase1/sky-zoom-ui.test.cjs`: **320/320** (real globe.gl 2.45.0, SwiftShader). It covers checks 5–17, 19, 21 and 22:
  - Framing (checks 14, 15) on 390×844, 360×640 and 1280×900, on 8 dates: 10 Nov, 2027-02-21 (near-opposite), 2026-09-11 and 2027-12-28 (near-conjunction), and the desk worst dates.
  - Signed 3D direction (check 6) vs astronomy-engine on 4 dates.
  - Full wheel and pinch sequences, A→C→A (check 22).
  - Free orbit with Re-frame.
  - Occlusion detector fixture (check 21).
  - 5 entry/exit cycles, including day/night switched on mid-way (check 9).
  - Rollover across midnight UTC (check 17).
  - **Breaks:** 25 (listed in the file). Results in §3.
- **Full regression:** §3.

## 3. Break and regression results (10 Nov, 13:48–14:55 UTC clock readings)
**Page-suite breaks (25), run against the final code** (`8a9d132`/`96bcc5e` page; parallel batches of 6):
- **22 fail the suite cleanly** (failed checks in brackets): no-pin-check (1), schema-off (2), no-pair-check (1), antipode (9), swap-axes (9), mirror-lng (9), nearest-day (1), eager (2), no-restore-layers (1), no-restore-near (6), no-restore-focus (5), no-scale-label (26), stale-text (fails), tags-same-side (1), sun-400-full-labels (5; the view refuses "too small to frame"), strip-over-scene (43), near-by-distance (1), split-update (1), no-occlusion-check (1), endpoint-only (2), pinch-off (1).
- **animate-always and fixed-distance** first failed with a crash in the test (a missing tag read as `undefined`) after recording real failures. The test was hardened (a missing body or tag fails each framing check). Rerun: animate-always 223 failed, fixed-distance 192 failed.
- **near-default** at first PASSED. That was a real gap: `ME.zoomState().last.near` reported the near value the rule computed, not the camera's. It now reports the camera's actual `near`, and the computed value moves to `nearRule`. Rerun: near-default 3 failed. Clean suite 321/321.
- **fixed-direction PASSES. Recorded, not "fixed": for GPT.** A single view direction for all dates (camera distance still searched) satisfies every agreed framing check on all 8 dates and 3 canvases; only the bodies come out smaller. The rev 2.1 rule set has no minimum disc size (GPT: deliberately), so this is not a defect under the agreed acceptance. The swing between stops is a size and readability choice (`framing-joint.json`: a fixed direction needs up to 715 R⊕ on a phone). GPT to say whether that warrants a check.
- First-round findings that led to test fixes (before the final run): the fixed-direction break was originally mis-specified (camera distance still searched); the tag-collision rule had never been exercised (now a forced 30-px fixture); the near plane was asserted as a bound, not the rule.

**Full regression (44 suite files):**
- All pass. The new ones: sky-scene-build.py 14, sky-scene-ref 7, sky-scene-hub 7. Unchanged counts: sky-ui 79, sky-hub 46, sky-build 35, desktop-overflow 112, mobile-pass 131, orbital-browser 113, timeline-ui (pass), arts-ui 90, and so on.
- Environment notes for this fresh container:
  - backdrop-layer and desktop-overflow first stopped on missing dev fonts (`@fontsource/*`; installed).
  - mobile-pass and orbital-browser needed the synthetic fixture from `phase1/orbital-fixture.build.mjs` (regenerated; seeded).
  - `orbital.test.mjs` is a manual tool (needs a GP CSV argument), not a regression suite.
- **orbital-browser 112/113 under load**, while six break runs shared the machine: one marker was ~0.2 units (~1.6 s of motion) from its reference. **On a quiet machine the branch passes 113/113 twice**, the same as main `71fb5d9` on the same machine. This is a timing artefact of load, not the change.

## 4. Deviations and findings from the build (for GPT)
1. **globe.gl resets the orbit target to Earth's centre on every camera change** (its own `change` handler: "Keep orbit target on center").
   - The view registers a second handler, which runs after globe.gl's and puts its framing target back. OrbitControls has already aimed the camera at the right target before the event fires.
   - Without this, stop B framed with the Moon off-screen.
2. **Damping is switched off in the view** (globe.gl sets it on, factor 0.1) and restored on exit. Leftover momentum would move the camera after a stop is placed, and would read as free orbit.
3. **Framing rules added beyond rev 2.2 §4.3, both found in the rendered viewport:**
   - **(a) Depth ratio ≤ 1.5.** No body more than 1.5× nearer the camera than another. Without it, perspective drew the true-scale Moon **larger than Earth** (19 px vs 10 px radius on a 390-px phone). With it, Earth/Moon apparent size ≈ 3.8 (true ratio 3.67). Cost: the camera sits farther out; at stop B on a phone the Moon is ~3 px across, inside a 10-px marker ring.
   - **(b) The strip is framed at its largest** (stop-C wording, Sun line present). Measured before its text was written, it hid the Moon (stop B) and the Sun (stop C) on a phone.
   - **(c) Non-monotone search.** "Fits" is not monotone in distance (very far, the markers merge below 24 px), so the search scans outward on a log grid, then bisects. The rev 2.1 desk model bisected from a far fit; that refused every phone.
4. **The strip carries the Earth-imagery date** ("Imagery: <date>"). The strip covers the usual `#imgdate` line, which is hidden in the view. Strip text is compacted under 420 px (the 360×640 phone did not frame otherwise; the strip measured 197 px → 105 px).
5. **Scene file size:** 67,778 B (25,734 B gzip) vs the proposal's 35–45 KB estimate. The ranges keep full precision so check 4 (exact match with R1) holds.
6. **Meshes are flat:** Phong material with black diffuse, black specular and an emissive colour, because the page has no MeshBasicMaterial constructor. No light from the Sun, so no implied phase.
7. **Lines, rings and tags are an SVG overlay** from globe.gl's own `getScreenCoords`, not three.js lines (the page has no Line constructors).
8. The view **waits up to 5 s for the globe mesh** on entry: on a fresh phone load the Sky card can be used before globe.gl has finished building.
9. **Not done here:**
   - a hardware depth measurement (GPT: waits for the rendered candidate);
   - a real phone / Safari run (deferred by Chad);
   - a screen-reader pass.

## 5. Next (each its own Approve line)
1. GPT reviews this packet and smoke-tests the hash-checked Mac copy `_review/sky-zoom-rc/` (Chad serves it in Terminal: `python3 -m http.server 8899 --bind 127.0.0.1`).
2. `Approve: upload ref/sky/sky-scene-2026-11-R1.json (complete-file sha256 d4605c3d…ae29, 67,778 B) to R2`
3. `Approve: deploy hub 0.6.6 from <commit> (content only)`
4. Live RC from the Pages origin.
5. `Approve: merge sky-zoom-rc to main (page change: Sky zoom-out view)`

## 6. GPT smoke test finding and fix (10 Nov, after `0ce5415`)
- **GPT (port 8899 preview, relayed by Chad):** "The wheel pull-back still loses Earth before the Moon comes into frame. Four sampled positions showed neither body." The stop buttons and Back to Earth worked.
- **Cause:** between stops the orbit target moved toward the next stop's framing centre in step with s, while the camera distance grows geometrically in s. Early in the pull-back the target was far from Earth with the camera still close, and Earth left the frame. Check 22 had only required a tag on every body *in* frame, not that Earth *stays* in frame.
- **Fix (`skyscene.js` `at()` / `earthSafe()`):**
  - (1) the target and the swing follow the distance actually covered, not s;
  - (2) **containment:** at every intermediate position, if Earth's centre (or, when Earth is small on screen, its ring and tag) would leave the safe area, the target is slid back toward Earth just enough (binary search on the target's scale; at 0 Earth is on the view axis, so a solution always exists). The stops themselves are unchanged.
- **New regression check, intermediate frames:** 201 positions per run (A→C→A in steps of 0.02, the same code path as the wheel), on 390×844, 360×640 and 1280×900, on 4 dates (10 Nov, near-opposite 2027-02-21, near-conjunctions 2026-09-11 and 2027-12-28). Earth's centre must be in frame and never under the strip or stop bar at every position.
- **Breaks:**
  - `target-by-s` (the old behaviour): 11 checks fail;
  - `no-containment` (distance-tying alone): 3 fail; distance-tying alone still lost Earth on 2027-02-21 and 2026-09-11 (phone) and 2027-12-28 (desktop);
  - clean suite **333/333**.
- **Restore exactness:** check 9 found the orbit target drifting ~2.6e-14 units per entry/exit cycle (OrbitControls, after the restore; ~1e-13 km). The exit now updates the controls with damping still off and re-copies the saved target. The check compares the target within 1e-9 units (every other field exactly). Break `no-restore-layers` still fails.
