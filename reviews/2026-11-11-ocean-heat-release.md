# Ocean Heat — release build packet (`ocean-heat-release`)

**Lines (Chad, 11 Nov 2026):**
- "Go: read the NOAA STAR disclaimer for Ocean Heat — text only via the pane, no download."
- "Approve: file the Ocean Heat REGISTER entry (C6) as recorded in OCEAN-HEAT-PROPOSAL §9a."
- "Approve: build ocean-heat-release on a branch only — hub 0.6.7 Ocean Heat route, page BASE and cache changes per OCEAN-HEAT-RELEASE-PROPOSAL rev 2; data/ocean-heat removed from the branch; no merge, R2, hub or page change."

**Candidate:** branch `ocean-heat-release` @ **`d4272a8`** (code). It was branched from `ocean-heat-rc` (preview rev 2, code `3915348`) with main `50e9419` merged in. This packet is committed after it.
**Not done (each its own line):** the R2 upload, the hub 0.6.7 deploy, the merge. Main, the public page, the live hub (0.6.6), D1 and R2 are unchanged.

## 1. STAR disclaimer and REGISTER (done on main, `50e9419`)

- **STAR disclaimer:** read 11 Nov about 04:25 UTC in the pane, text only. Recorded in `docs/research/OCEAN-HEAT-SOURCE-CHECK.md` rev 2.2.
  - It applies because the three input files came from STAR's server.
  - **It requires a credit:** "Users are free to use the images or information hosted on this site as they wish, as long as credit is given to the NOAA / NESDIS Center for Satellite Applications and Research."
  - It also describes data hosted on STAR's webservers as experimental, not official NOAA operational products, liable to change without notice.
- **REGISTER entry filed** (`REGISTER.md`, last entry) on Chad's line, per §9a:
  - the three statements (anomaly and climatology files, CoralTemp with OSTIA 1985–2002 and GHRSST, STAR);
  - the OSTIA distinction and GPT's withdrawal of the hold;
  - attribution, now **including STAR**;
  - the methods-article DOI, with no dataset DOI;
  - data status; commercial use "with attribution".
- **Consequence for the build (for GPT to check):** the page now names STAR alongside Coral Reef Watch (§2, page). This wording is the build's, added because the disclaimer requires it; the release proposal did not specify it.

## 2. What changed

| File | Change | sha256 at `d4272a8` |
|---|---|---|
| `phase1/worker.js` | **Hub 0.6.7.** `OCEANHEAT_REVISIONS` (frozen; 4 files: key, sha256, bytes, type). Route `GET /catalogue/oceanheat/<revision>/<file>`: raw-path match, exact keys, else 404 `no-store` with no R2 read. Serves only when length and sha256 match, as `Content-Type` per pin, **no `Content-Encoding`**, `Cache-Control: public, max-age=86400, immutable`, `ETag` = sha256, CORS. Failures are 503 `missing` / `unreadable` / `size` / `integrity` with `no-store`. Discovery: endpoint plus `catalogues.oceanheat`. Outside LAYERS, cron, D1, `/status`, `/health` and history. | `84b770b6…298c9f` |
| `oceanheat.js` | `OH.BASE` → `https://mother-earth.chadoberholzer.workers.dev/catalogue/oceanheat/oh-2026-11-09-R1/`. `fetch(OH.BASE + name)` with **no cache option** (was `{ cache: 'no-cache' }`). Inspector credit row names STAR: "NOAA Coral Reef Watch (files from the NOAA / NESDIS Center for Satellite Applications and Research)". Header comment. Revision, manifest pin and all checks unchanged. | `a45097ba…a55eb3` |
| `index.html` | Footer credit adds "files from the NOAA / NESDIS Center for Satellite Applications and Research" (linked). `?v=` → `202611281000`. | `75420aa2…0389d5` |
| `sources.html` | Heading "(analysed, optional layer)" (was "preview"). "grey checked fill" (was "dark", matching rev 2's lighter checker). Checks paragraph: served by the hub from a fixed, immutable copy that checks size and fingerprint; off at load. Credit paragraph: STAR, with links to STAR and its disclaimer; data described by the server as experimental, not official operational products. `?v=` bump. | `fd08b599…adbb7b3` |
| `data/ocean-heat/` | **Removed** (D2). It stays in the `ocean-heat-rc` history. | — |
| `phase1/ocean-heat/check_release_pins.mjs` | **New:** build-time consistency check (Q2). | `02d0bd81…33783a` |
| `phase1/oceanheat-hub.test.mjs` | **New:** Worker suite (45). | `3963945e…a71657d` |
| `phase1/oceanheat-ui.test.cjs` | Browser suite on `OH_SNAPSHOT_DIR` at the hub path; section G added (109). | `08f88e40…599723b` |
| `phase1/sky-scene-hub.test.mjs` | Its `version === '0.6.6'` check made numeric (≥ 0.6.6), so it passes on 0.6.7. | — |

Unchanged: `app.js` (`161b53cc…`), `style.css`, `arts.js`, `sky.js`, `skyscene.js`, `timeline.html`, `timeline.js`. On merge, the served-hash check covers ten page files (`oceanheat.js` added) plus the four hub responses.

**The four files** (R2 keys `ref/oceanheat/oh-2026-11-09-R1/…`; not uploaded):

| File | Bytes | sha256 | Type |
|---|---|---|---|
| `manifest.json` | 4,585 | `dcc3467428e38e76966508d10078d322b8d724ed784de3266ae0b62354f5af1b` | `application/json` |
| `mask.bin.z` | 137,652 | `349fc0237d35443864ce58bebc221d19672440d14604e24a86df595ced10bb9c` | `application/octet-stream` |
| `v025.bin.z` | 1,081,272 | `3e66d63c816b01c561a038f757fdc5628ec1be96857232f8ed62b8dac2be1ae0` | `application/octet-stream` |
| `v050.bin.z` | 323,176 | `be418c11f7f7903c11bdd7e33454502fa95c5a58a564d606f8f4fdfbcc00c725` | `application/octet-stream` |

The explicit local folder for the tests: `/home/claude/oh-snapshot/oh-2026-11-09-R1` here; the same bytes are in the Mac packet `research/ocean-heat/2026-11-10-claude/snapshot-oh-2026-11-09-R1/` and in `ocean-heat-rc` history.

## 3. Tests at `d4272a8`

All suites take `OH_SNAPSHOT_DIR` and refuse to run if it is unset, a file is missing, or a length or sha256 differs from the Worker pins. Each also asserts that the branch has no `data/ocean-heat/`: with an empty `data/ocean-heat/` folder created by hand, the hub suite fails that check.

- **Build-time check** `check_release_pins.mjs`: **CONSISTENT, 0 mismatches.** It checks:
  - one frozen revision with four frozen files, keys under `ref/oceanheat/<rev>/`, types as above;
  - each local file's length and sha256 = its pin;
  - manifest `revision` = route revision;
  - manifest file entries (sha256, bytes) = Worker pins;
  - page `OH.REV` = revision; `OH.BASE` = the hub route; `OH.MANIFEST_SHA256` = Worker pin = local sha;
  - no `cache: 'no-cache'` in the page.

  Unset folder → exit 2. **Breaks** (exit 1): `manifest-revision` 1 mismatch, `pin-mismatch` 2, `page-pin-mismatch` 1.
- **Worker suite** `phase1/oceanheat-hub.test.mjs`: **45 passed, 0 failed.**
  - **Files:** each of the four through the real `fetch` export → 200 with exact bytes, exactly one R2 read of its key, pinned type, no `Content-Encoding`, the immutable 24 h `Cache-Control`, `ETag`, exposed headers, CORS.
  - **17 malformed or unknown paths** → 404 `no-store`, zero R2 reads (bare, trailing slash, extra segment, `//`, unknown revision or file, `%2F`, `..%2F`, `%`, `current`, `constructor`, `__proto__`).
  - **Failures:** one flipped byte → 503 `integrity`; truncated, or one byte extra → 503 `size`; missing → 503 `missing`; **`R2.get` throws → 503 `unreadable`; `arrayBuffer()` throws → 503 `unreadable`**; another file under the key → 503, never served. All `no-store`.
  - **Other:** POST → 405; OPTIONS preflight; discovery lists the endpoint and `catalogues.oceanheat`; not in LAYERS; the Sky route untouched.
  - **Breaks** (exit 1): `no-hash-check` 1 failed; `no-size-check` 2; `loose-route` 2; `wrong-type` 3; `content-encoding` 4; `cache-on-error` 5.
- **Browser suite** `phase1/oceanheat-ui.test.cjs`: **109 passed, 0 failed** (was 101). Real globe.gl 2.45.0 in headless Chromium (SwiftShader). The four files are answered at `https://mother-earth.chadoberholzer.workers.dev/catalogue/oceanheat/oh-2026-11-09-R1/…` from `OH_SNAPSHOT_DIR`, with the Worker's headers.
  - **S:** setup checks (files = pins; no copy in the branch).
  - **A–F:** as rev 2, plus **A2: every snapshot request goes to the hub route**.
  - **G1:** the page's three pinned fetches carry no cache override.
  - **G2:** a hub 503 on `v025.bin.z` → "Ocean heat unavailable — v025.bin.z: HTTP 503. Nothing is drawn.", toggle off, no mesh.
  - **G3:** in a context **with no request routing** (Playwright routing disables the HTTP cache), the **real Worker** in node with a mock R2 behind a local HTTP server. `v025.bin.z` → 200, `public, max-age=86400, immutable`, no `Content-Encoding`, bytes = pin. **A second fetch is answered by Chromium's cache and never reaches the server.** A 404 is `no-store`.
  - **Breaks** (14, each must fail): all 14 fail the suite (exit 1).

    | Break | Failed |
    |---|---|
    | `no-wrap` | 2 |
    | `linear` | 1 |
    | `nearest-water` | 2 |
    | `paint-noncontrib` | 2 |
    | `p2-any-water` | 3 |
    | `tile-shift` | 2 |
    | `no-hash` | 2 |
    | `no-gen` | 1 |
    | `same-unavailable-text` | 3 |
    | `round-lookup` | 13 |
    | `phone-p1` | 3 |
    | `small-limit` | 2 |
    | `p2-tile-x0` | 4 |
    | **`no-cache-kept`** (new) | 1, at G1 |

    The local test server stopped at its 2-hour limit during the first pass. The five breaks it interrupted (`round-lookup`, `phone-p1`, `small-limit`, `p2-tile-x0`, `no-cache-kept`) were rerun after a restart; the figures above are from the reruns.
- **Hub regression** (node, real `worker.js` at 0.6.7):

  | Suite | Result |
  |---|---|
  | sky-hub | 46 |
  | sky-scene-hub | 7 (after the numeric version check) |
  | arts-hub | 54 |
  | timeline-catalogue-hub | 66 |
  | health-hub | 29 |
  | history-hub | 27 |
  | drifters-hub | 12 |
  | plastic-hub | 11 |
  | orbital-hub | 13 |
  | satellites-hub | 12 |
  | firms-v2 | 57 (7 skipped, as before) |
  | firms-guard | 19 |
  | kp-degraded | 29 |
  | ships-fallback | 7 |
  | ships-late | 7 |
  | place-rows | 7 |
  | duration-contract | all checks passed |

  All passing.
- **Page regression:** mobile-pass 131, desktop-overflow 112, sky-zoom-ui 333, sky-ui 79, arts-ui 90, smoke-fixes 52, terminator-ui 19, all passing.

## 4. Not yet verified (the live release candidate, after lines 5 and 6)

- The real hub serving from real R2: headers as tested, and whether Cloudflare adds compression in transit.
- The browser's cache over the real hub.
- First-enable time through the hub on both paths.
- Taps through the hub.
- The regression-gate timing pair on the release candidate.

Proposal §4 sets the procedure. It uses the candidate's actual `BASE`, with no rewrite.

## 5. For GPT

1. **STAR credit wording** (§1, §2): inspector "NOAA Coral Reef Watch (files from the NOAA / NESDIS Center for Satellite Applications and Research)"; footer and Sources as in §2. Enough, or should the card's date line name STAR too?
2. **Sources sentence on data status:** "describes the data it hosts as experimental, not official NOAA operational products". Accurate to the disclaimer, but OSPO's view of the Coral Reef Watch products was not checked. Keep it, or drop it?
3. Anything missing before the R2 upload and hub deploy lines.

## 6. After GPT's review (11 Nov, 09:14–09:24 UTC)

**R2 upload (Chad: "Approve: upload the four ref/oceanheat/oh-2026-11-09-R1/ objects to R2 (exact bytes, hashes as pinned in OCEAN-HEAT-RELEASE-PROPOSAL rev 2 §1).")** Dashboard API from Chad's signed-in pane tab. Destination empty at 09:15:52Z (nothing under `ref/oceanheat/`), re-checked just before writing. Sources from raw.githubusercontent at `db5eedd` (ocean-heat-rc), each length and sha256 checked against the pin before any write.

| Key (under ref/oceanheat/oh-2026-11-09-R1/) | PUT start → response (UTC) | Uploaded | etag | Read-back |
|---|---|---|---|---|
| manifest.json (application/json) | 09:16:20.815 → 09:16:21.579 | 09:16:21.680Z | 331ad345d168c570a51500a7bf8cdeba | 4,585 B, sha256 exact |
| mask.bin.z (application/octet-stream) | 09:16:21.579 → 09:16:22.508 | 09:16:22.599Z | ae9fe10b25b7f81f252f2e8c54693a08 | 137,652 B, exact |
| v025.bin.z (application/octet-stream) | 09:16:22.508 → 09:16:25.652 | 09:16:25.700Z | ff5b3592e9e069eb1e2dcbf7a25969f7 | 1,081,272 B, exact |
| v050.bin.z (application/octet-stream) | 09:16:25.652 → 09:16:27.567 | 09:16:27.463Z | 06c1dac239b2a419355f0c8342d53f75 | 323,176 B, exact |

Listing afterwards: exactly these four objects, sizes and content types as pinned. Not served: live hub 0.6.6 has no Ocean Heat route.

**Hub deploy: NOT done.** Chad's line names `d4272a8`; GPT's route finding (below) changes worker.js, so the deploy needs a new line naming `1b975a0`.

**GPT's points, applied at `1b975a0`:**
1. STAR credit: kept as built (inspector, footer, Sources). No change.
2. Sources: the experimental-status clause removed; the STAR notice link and credit stay. The full hosting notice stays in the research record (OCEAN-HEAT-SOURCE-CHECK rev 2.2).
3. Route: segments are matched **literally** against the pin keys, no percent-decoding. `/%6danifest.json` (and `mask%2Ebin.z`, `oh%2D2026-11-09-R1`) now return 404 no-store with zero R2 reads. New break `decoded-segments` (the old decoding) fails 3.

**Tests at `1b975a0`:** hub suite 48/48 (was 45; +3 encoded spellings); breaks 7/7 fail (no-hash-check 1, no-size-check 2, loose-route 2, wrong-type 3, content-encoding 4, cache-on-error 5, decoded-segments 3). Pin check CONSISTENT, 0 mismatches. Browser suite 109/109. All 28 `phase1/*.test.mjs` suites exit 0.

**Hashes at `1b975a0`:** worker.js `53ede31ebb976c1010c1a08a61889499563d719169f5b406544a302505fb9e43`; sources.html `50fa74e90f87c81829c879f933abf3c5171ef7063087407847cd193ece1ab4c3`; oceanheat.js and index.html unchanged (`a45097ba…`, `75420aa2…`).

## 7. Hub deploy (Chad: "Approve: deploy hub 0.6.7 from 1b975a0 (content only: Ocean Heat route).")

- **Before (09:36:28Z):** live script 0.6.6, 283,352 B, sha256 `4231114d…f078` = origin/main's `phase1/worker.js`; 19 bindings.
- **Source:** raw.githubusercontent at `1b975a0`, 287,973 B, sha256 `53ede31e…fb9e43` (exact).
- **Deploy:** content-only PUT `/workers/scripts/mother-earth/content` 09:36:47.156Z → 200 at 09:36:49.878Z, modified `2026-11-11T09:36:49.705612Z`. Read-back (`content/v2`) sha256 exact; 19 bindings, unchanged. Previous version stays in Cloudflare's history.
- **Live smoke check from the Pages origin (09:37:08Z, `no-store` requests):** `/` reports 0.6.7 with `catalogues.oceanheat` (current `oh-2026-11-09-R1`). All four files 200, byte-identical to their pins, `Cache-Control: public, max-age=86400, immutable`, types as pinned. `/%6danifest.json`, the trailing-slash path, an unknown revision and `current/` → 404 `no-store`. `/status` 200.
- **Seen in transit:** the manifest's ETag arrives weak (`W/"dcc34674…"`). Cloudflare's edge compressed the JSON response on the way out, and that weakens the Worker's strong ETag. Decoded bytes are exact (4,585 B, pinned sha256). The three `.bin.z` files keep strong ETags (not compressed). Content-Encoding can't be read cross-origin (not an exposed header). The live RC checks the browser cache with this in place.
- **Not done:** the live RC (§4 of the proposal) and the merge.

## 8. Live release candidate (Pages origin → deployed hub 0.6.7; Chad's Chrome, 11 Nov 09:42–09:48 UTC)

**Setup:**
- Chad's own Chrome 156 through Claude in Chrome, one new tab, window in front and focused (`visibilityState` visible and `hasFocus` true throughout). ANGLE Metal, Apple M3, `MAX_TEXTURE_SIZE` 16384. Viewport 1470 × 801 CSS px at DPR 2.
- Clean tab on `…/mother-earth/sources.html`; its timers were cleared, then the seven branch page files were fetched by commit `1b975a0` from raw.githubusercontent. All seven were hash-exact (index `75420aa2`, oceanheat `a45097ba`; app, style, arts, sky and skyscene equal to main), then blob-injected (09:42:15Z).
- **No BASE rewrite:** the injected `OH.BASE` is the page's own, `https://mother-earth.chadoberholzer.workers.dev/catalogue/oceanheat/oh-2026-11-09-R1/`.
- A fetch wrapper logged each `/catalogue/oceanheat/` request (status, headers, bytes, sha256 against the pins, the page's own init). Its clone-and-hash adds time to each logged request, so the load times below are upper bounds.
- **Before the toggle:** layer off, zero requests to `/catalogue/oceanheat/` (wrapper log and resource timing both empty).

**Requests (all `init` null, i.e. no cache override; all from the hub host; all 200; every sha256 = pin):**

| Enable | Path | Requests | Browser timing (resource duration) | Ready | Taps |
|---|---|---|---|---|---|
| 1st, cold (09:42:56Z) | P1, 0.25°, 1 tile, 7200 × 3600 | manifest 4,585 B + mask 137,652 B + v025 1,081,272 B | 374 / 637 / 805 ms | 2,301 ms (load 1,944, paint 164) | 12/12 |
| 2nd | P1 | same three | 14 / 17 / 11 ms (**cache**) | 3,161 ms (load 1,812, paint 798) | 12/12 |
| 3rd, `forcePhone` | P2, 0.5°, 1 tile, 3600 × 1800 | manifest + mask + v050 323,176 B | 10 / 9 ms (**cache**) / 346 ms (cold) | 2,493 ms (load 1,800, paint 292) | 12/12 |
| 4th | P2 | same three | 3 / 3 / 3 ms (**cache**) | 1,652 ms (load 1,045, paint 175) | 12/12 |

- **Headers on every response:**
  - `Cache-Control: public, max-age=86400, immutable`;
  - Content-Type `application/json` (manifest) or `application/octet-stream` (the three binaries);
  - `Content-Encoding` reads null to the page (not an exposed header cross-origin);
  - ETags: strong on the three binaries; **weak on the manifest** (edge compression of JSON, §7).
- **Cache reuse with the weak manifest ETag:** confirmed. Repeat fetches finished in ≤ 17 ms by the browser's own timing (cold: 346–805 ms). `immutable` with max-age means no revalidation, so the ETag form does not matter.
- **Taps:** `expected-taps.json` was fetched at `1b975a0` (sha256 `4b1cfd73…931e`, exact) and checked with the suite's `expectText` rule against `rowsAt`: **12/12 on P1 (0.25°) and 12/12 on P2 (0.5°)**, on both the first and the repeat enable.
- Load times are wall-clock on the page's own path (fetch, inflate, hash checks, texture build) plus the wrapper's overhead. The cached repeats show that most of the remaining time is local work, not the network.

**Regression gate (adopted D1): layer-off vs layer-on, foreground, 5 s scripted rotation each, order off / on / off / on per path (09:45:05–09:46:08Z):**

| Path | off | on | off | on |
|---|---|---|---|---|
| P1 median / p95 (ms) | 150.0 / 183.4 | 149.9 / 184.3 | 166.7 / 200.0 | 150.0 / 199.5 |
| P2 (`forcePhone`) median / p95 (ms) | 166.6 / 183.3 | 199.9 / 266.1 | 183.4 / 250.0 | 150.0 / 217.0 |

**Forced synchronous renders (60 × `render` + 1-pixel readback, globe paused, 09:46–09:47Z):**
- P1: off 43.0, on 43.2, off 99.1, on 42.7 ms.
- P2: off 180.2, on 45.2, off 44.5, on 56.2 ms.
- Chrome's own frame rate with the globe paused was 16.7 ms (60 Hz), so the browser was not throttled. The scene held 3,289 objects (2,379 this morning).

**Reading:**
- No repeatable slowdown from the layer on either path.
- P1 on equals or beats both off runs.
- P2's first on run (199.9 ms) was slower than its first off run, but the second on (150.0) was faster than both off runs.
- The largest render times (99 and 180 ms) were layer-off.
- Renders on vs off agree within ~1 ms on P1 and are within the off range on P2.
- The whole page ran slower than this morning (150–200 ms frames, against 100–117), layer on and off alike; the scene has grown by about 900 objects since then.
- **The regression gate is met on this run, at its resolution.** The absolute targets are still missed by the page itself (§10 of the rc review; the coverage polygons are the lead).

**Off at the end:**
- status off, 0 meshes, no ≥ 3600-wide texture in the scene;
- `rowsAt` null, legend hidden, no further requests.

No console errors in the tab. Tab closed.

**Limits:**
- P2 was exercised through `forcePhone` on the desktop viewport, not a phone-sized window or a physical phone.
- The browser was driven through the extension.
- The timing-run code was too long for one call and first ran once untracked (its results were lost); the recorded run is the second, repeated in full.

**Side note:** before the injection I opened `…/mother-earth/LICENSE` as a would-be blank page. Chrome likely treated it as a file download (the tab reverted). The Pages 404 page was tried next; it blocks outside fetches, so the Sources page was used, as in the preview run.

**Remaining:** the merge line, then the served-hash check after Pages publishes. That check covers ten page files with `oceanheat.js` added, plus the four hub responses.
