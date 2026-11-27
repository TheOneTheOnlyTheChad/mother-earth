# Moon item 10a — page preview `moon-sky-texture-ui`: the Moon's picture on the Sky zoom-out Moon

Packet rev 1 · 27 Nov 2026, 04:58 UTC (clock reading) · Claude · **branch only: not merged, not deployed; no hub change; no data downloaded** · for GPT's review.

**Chad's line (27 Nov 2026):** "Accept D1–D6 as recommended. Go for a page-only branch preview of Moon item 10a under proposal rev 1 with GPT's review notes. Preserve existing framing and controls; return the candidate and evidence for GPT review. No merge or deployment."

- **Decisions:**
  - D1 proceed.
  - D2 calculated orientation (two-direction fit).
  - D3 evenly lit, no phase.
  - D4 the map without a brightness multiplier.
  - D5 reuse unchanged `moonlight.js`.
  - D6 dispose on exit.
- **Inputs:**
  - Proposal `docs/concepts/MOON-SKY-TEXTURE-PROPOSAL.md` rev 1.
  - GPT's review, filed unchanged as `reviews/2026-11-27-moon-sky-texture-proposal-rev1-gpt-review.md` (sha256 `9ae199d3…f480`, PASS with notes 1–6).

## 1. Candidate

| | |
|---|---|
| Branch | `moon-sky-texture-ui` |
| Candidate head | **`c132f46`**, plus this packet's docs commit (see `git log`) |
| Built from | `45cc94d` (`moon-sky-texture-docs`: main `018102c` + the proposal + GPT's review; docs only) |
| Page payload | `a391ed8` (`skyscene.js`, `index.html`); `eaf7e81` (test aid, one redundant line removed, suite); `c132f46` (suite only) |
| Validated tree | detached worktree at `c132f46`, served on 8899; no checkout changed while suites ran |

**Changed page files (2):**

| File | sha256 at `c132f46` | Change |
|---|---|---|
| `skyscene.js` | `8a7e5e22…364e9f` | +130 / −9 lines: the Moon's picture block, entry/exit/rollover wiring, test aids |
| `index.html` | `125ebba7…6d86273` | `moonlight.js?v=202612071100` tag (the Moon page's key; file unchanged), `skyscene.js?v=202612271000`, one paragraph `#zoom-moonmap` in "How this is drawn" |

- **Unchanged:** `moonlight.js` (`f01b8e21…a08a`, same bytes as main), the map, the sunlight table, the scene file and its pin, framing, camera path, zoom, stops, Explore links, Back, layer hide-and-restore, the Sun mesh, `moon.html`, `tides.html`, `sources.html`, `style.css`, the hub, R2 and collectors.

## 2. What the page does now

- **On load:** nothing new.
- **On "Zoom out to the Moon and Sun":**
  - The scene file request goes out exactly as before.
  - In parallel, `assets/moon/lroc_color_2k.jpg?v=1` and `assets/moon/moon-light-2026-06-R1.json?v=1` are requested. Both are same-origin, with the default HTTP cache (shared with the Moon and Tides pages).
  - Each has its sha256 checked against its pin: the map's pin is in `skyscene.js`; the table's is `MoonLight.T.sha`.
  - The table is read by `MoonLight.read`. The map is decoded from the checked bytes through a blob URL, which is revoked after the texture is made.
- **The view never waits for the picture.** It opens, frames and runs with the grey Moon. When both files are ready and the current scene date has a sample, the Moon switches in place:
  - diffuse black, emissive map = the picture, emissive white: evenly lit, no phase;
  - colour space copied from the Earth picture's texture (`srgb`);
  - rotation from the guarded two-direction fit for the **current** scene row.
- **One limit, 10 s** (GPT note 1), covers everything from the requests to a texture ready to attach: fetch, bytes, hashes, JSON, decode, and the wait for a texture class from the Earth picture (the bundle has no three.js global).
  - A generation token and a final commit gate drop late work.
  - Back, a refused scene file, a date without a sample, a rollover to a date without a sample and a new entry all invalidate earlier work.
  - Aborting the shared controller stops the sibling download.
- **Any failure** (network, pin, table shape, decode, size, no texture class, orientation refused) leaves the grey Moon (`0x9a9a9a`, no map, no rotation). The paragraph then reads "The Moon's picture could not be loaded or placed, so the Moon is drawn plain." **No arbitrary pole or roll** (GPT note 2).
- **Guards in the fit** (GPT note 2): an exact table sample for the scene date, finite inputs, |p × q| ≥ 0.005 in both frames (the 579 real samples: 0.0200 at least), RᵀR = I within 1e-9, det R = +1 within 1e-9.
- **Rollover:** the orientation is recomputed in the same update that moves the bodies (`positionMeshes(); applyMap();`).
- **Back (D6):** the material goes back to grey, the texture is disposed, the image reference is dropped and any object URL is revoked. Re-entry fetches again; the HTTP cache may avoid a transfer.
- **Wording** (GPT note 3), in "How this is drawn": "The Moon carries the Moon page's map (NASA Scientific Visualization Studio, CGI Moon Kit): appearance only, evenly lit, not how it was lit at that instant. It is turned to an approximate calculated orientation for that instant. At the Earth-and-Moon stop it is only a few pixels across, so the map shows light and dark areas, not features." Loading and failure have their own one-line texts. **Sources and REGISTER are left for the release candidate** (GPT: release-stage items).

## 3. Results

### 3.1 Suite `phase1/sky-moon-texture-ui.test.cjs` (new): **96 passed, 0 failed** on `c132f46`

Real page files and the real map and table, served on 8899; real globe.gl 2.45.0 with SwiftShader; the hub routed to the committed scene and distances files; the Earth picture is a plain near-white PNG.

| § | What it holds | Result |
|---|---|---|
| 1 | No map or table request before entry; one each on entry; the view opens and frames while the picture is loading (grey); loading words; picture attached; emissive white with the map; orientation date = scene date; wording terms; object URL released; **mipmaps on, minFilter 1008 (trilinear)**; colour space copied | pass |
| 2 | **Orientation, four dates** (incl. 21 Feb 2027 at phase 1.1° and 24 Dec 2026 at 4.0°): table sub-Earth point faces Earth ≤ 0.01°, sub-solar point faces the Sun (true range) ≤ 0.3°, **agreement with astronomy-engine's IAU Moon orientation ≤ 0.3°** | pass (table below) |
| 3 | **On the picture, TEST-ONLY close views** (camera on a point's outward normal, controls held): Mare Crisium darker than the highlands at 100°E; Tycho brighter than Mare Nubium; Mare Orientale darker than its mirrored longitude; **rendered colour at 5°N 150°E equals the map's own pixels there within 12 levels** (measured: (205, 202, 200) against (205, 202, 200)) | pass |
| 4 | **Real crops at stop B**, 1280 × 900 DPR 1 and 390 × 844 DPR 2, map and grey; framing identical with and without the picture; draw calls per frame unchanged (3 and 3) | pass |
| 5 | Failures: map 404, map pin, table pin, map slower than the limit, decode slower than the limit, no Earth picture (no texture class) within the limit, table failing after the map succeeded: view open at once, grey, reason recorded, failure words; late answers discarded and object URLs balanced; stops still work; the sibling download is aborted when the other fails | pass |
| 6 | A crafted scene (the Sun straight behind the Moon): grey, "orientation", nothing kept; the guarded fit refuses non-finite input and a date before the table | pass |
| 7 | Rollover while open: scene date and orientation date change together; the new date's sub-Earth point faces Earth | pass |
| 8 | Back: grey, nothing kept; renderer texture count back to its value before entry (+1 while open); four more entries and exits: still at baseline, object URLs balanced, **JS heap after GC within 2 MB**; Back while loading, then the late answer: not kept; re-entry loads again and attaches once; refused scene file: optional load cancelled; no-position date: cancelled | pass |
| 9 | With a 6-s picture the view is open and framed within 4 s | pass |

**How §2 and §3 fit together:**
- §3 places the camera on the mesh's own world direction of each point, using the suite's mesh-local convention (X, Z, −Y) with the page's quaternion. It therefore holds that **this convention and three.js's sphere UVs put the map's features at their coordinates**, whatever the rotation.
- §2 holds that **the page's rotation, read through the same convention, points the table's sub-Earth and sub-solar points where the files and astronomy-engine say**.
- Together they cover the chain from map pixels to world directions. That is why the rotation breaks fail §2 and §7 but not §3.

**Orientation (§2), from the page's mesh:**

| Date | Phase | Sub-Earth | Sub-solar | vs astronomy-engine |
|---|---|---|---|---|
| 2026-11-27 | 33.58° | 2.5e-14° | 0.0059° | 0.0054° |
| 2026-12-24 | 4.03° | 3.7e-15° | 0.0014° | 0.0819° |
| 2027-02-21 | 1.14° | 1.0e-14° | 0.0018° | 0.2882° |
| 2027-07-10 | 99.59° | 1.9e-14° | 0.0055° | 0.0029° |

- **astronomy-engine** 2.1.19: file `astronomy.js` sha256 `729c0ce3…185a`, resolved through `require.resolve` (no absolute import; GPT note 5).
- **What the reference is:** agreement with a reference, not accuracy. The sub-solar residual is the fit's roll residual plus the aberration the table applies and the scene does not (about 0.006°).

**Measured** (GPT note 6; SwiftShader in a container, so not a phone or a GPU):
- Texture upload (`initTexture`): 31–34 ms.
- Ready (fetch to texture-ready, incl. a 1,500 ms routed delay): about 1,600 ms; without the delay 140 ms (§8).
- JS heap after GC: before the first entry 7,275,256 B; after 5 entries and exits 8,376,416 B (+1.1 MB; the earlier run gave +0.8 MB). **This is script heap only**: it does not measure GPU memory or the browser's decoded-image cache. The renderer's texture count does return to baseline.
- The GPU allocation (2048 × 1024 RGBA8 with mipmaps ≈ 10.7 MiB while open) remains an **estimate**.

**Rendered brightness** (GPT note 4; real canvas crops at stop B, pixels above luminance 40, the same pixel count in both crops):

| | Grey (today) | Map | Change |
|---|---|---|---|
| 1280 × 900, DPR 1 (radius 3.4 px) | 134.5 | 159.8 | +19% |
| 390 × 844, DPR 2 (radius 2.57 CSS px) | 137.8 | 166.3 | +21% |

These **replace the offline estimate** in the proposal §3.3. Under D4(a) no multiplier is applied.

### 3.2 Deliberate breaks: **13 of 13 caught on `c132f46`**, each logged "BREAK … applied (pattern found)"

| Break | What it weakens | Failed checks |
|---|---|---|
| `no-pin` | no hash check on either file | 4: §5 map pin and table pin |
| `no-rotation` | production rotation dropped | 13: 2b, 2c, 2d, 7b |
| `swap-fit` | fit directions swapped | 13: 2b, 2c, 2d, 7b |
| `mirror-lng` | scene longitude mirrored in the fit | 13: 2b, 2c, 2d, 7b |
| `no-rollover-orient` | orientation not updated on rollover | 2: 7a, 7b |
| `emissive-grey` | emissive stays grey with the map | 2: 1f, 3d |
| `blocking-entry` | entry waits for the picture | 6: 1b, 1d, 5, 9a |
| `invented-orientation` | texture attached when the fit is refused | 1: 6a |
| `no-dispose` | texture kept after Back | 4: 8a, 8b, 8c, 8e |
| `no-timeout` | no limit | 10: 5 |
| `late-keep` | final commit gate removed | 1: 5 |
| `no-colorspace` | colour space not set | 2: 1k, 3d |
| `cancel-on-scene-fail-off` | optional load not cancelled when the scene file is refused | 1: 8h |

(Failed-check counts from each log's summary line; section numbers as in §3.1; full names in `break-<name>.log`.)

- **Audit note:** on the first suite revision (`eaf7e81`), `late-keep` was **not** caught. The texture-class wait was the only path it opened, and the late-answer check covered only the two "slower" cases. The check was extended to the no-texture-class case (`c132f46`), and all 13 breaks and the clean suite were rerun on `c132f46`. Round 1 logs are kept with the evidence.
- **Dropped break (lesson 8):** a sibling-abort line was redundant, because `cancelMap` aborts the shared controller. A break removing it could not change any path, so the line was removed (`eaf7e81`) and no break is counted for it. The behaviour itself is checked in §5 (the sibling request is aborted).
- **Not counted as fault detection** (GPT note 5): the assessment's "no-spin" variant, which altered the reference rather than the page.

### 3.3 Regressions (frozen `c132f46` tree; logs `reg-*.log`, `animals.log`)

| Suite | Result | Notes |
|---|---|---|
| `sky-zoom-ui` | 351 / 0 | the zoom view's own suite (framing, stops, zoom, resize, explanation open, Back) on the changed `skyscene.js` |
| `sky-ui` | 79 / 0 | |
| `skycraft-ui` | 77 / 0 | Explore links and Back from the Moon/Sun pages |
| `mobile-pass` | 131 / 0 | orbital fixture built with `phase1/orbital-fixture.build.mjs` |
| `desktop-overflow` | 286 / 0 | real fonts |
| `smoke-fixes` | 113 / 0 | **first run was a set-up error:** served by a plain server, it timed out in its harness (7 s, fire-cell checks). Its documented server is `phase1/serve-core-on.py`; rerun on that, it passed. |
| `animals-tab-ui` | 294 / **2** | **13b** (`index.html` is held to the Tides baseline) and **13c** (`skyscene.js` is in the "same as main" list). Both are the expected pin consequences of this change, for the narrow pin-maintenance commit at the release candidate. No other Animals check moved. |

- **Run order:** `sky-zoom-ui` to `desktop-overflow` ran in sequence after the break runs. `animals-tab-ui` ran (own server) while the break runs were going; it is not load-sensitive in the records. The Moon-tab suites were not rerun, because no Moon-tab file changed.

## 4. GPT's notes 1–6: where each is met

| Note | Where |
|---|---|
| 1 Bound the whole load; token and commit gate; invalidation; disposal of late work; sibling cancel; slow decode and preparation; failure after success; Back and re-entry races | `loadMap`, `cancelMap`, `releaseMap`; suite §5, §8, §9 |
| 2 Date and orientation atomic; guards; no arbitrary fallback | `applyMap` uses `st.rows`; rollover line; `moonRotation` guards; suite §2, §6, §7 |
| 3 Qualified wording | `#zoom-moonmap` text; Sources at the release candidate |
| 4 Rendered brightness, not byte averages; colour space checked against a rendered reference | suite §3d (rendered colour equals the map's pixels), §4 crops |
| 5 Reproducible, behavioural validation; version and hash; assertions exit nonzero; close views documented as test-only | suite header, §2, `require.resolve`, exit codes |
| 6 Mipmaps, upload timing, draw counts, repeated entry and exit; scope of memory claims | suite §1j, §4c, §8; this packet §3.1 |

## 5. Limits

- **Not verified:** a real phone, Safari, a screen reader or a hardware renderer.
- **GPU memory** is an estimate. The JS heap measures script heap only.
- **Free-orbit Moon sizes** were not measured.
- **Close views are test-only.** The page never shows the Moon at that size.
- **"How this is drawn"** grows by one paragraph. Opening it already re-frames or scrolls the strip (existing behaviour, held by `sky-zoom-ui`).
- **At release:**
  - the Sources `#sky-scene` text;
  - the two REGISTER extension lines (each on Chad's own line);
  - narrow Animals pins (`skyscene.js` is in the Animals "same" list; `index.html` is pinned);
  - a new reviewed served manifest adding `assets/moon/moon-light-2026-06-R1.json`.

## 6. Evidence

On the Mac: `_review/moon-sky-texture-ui/`, with checksums. It holds:
- the clean log;
- the 13 break logs and `breaks-summary.txt`;
- the round 1 logs;
- the crops (`crop-B-*`, `crops-panel.png`) and `results.json`;
- the regression logs;
- this packet;
- the diff.
