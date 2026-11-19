# Earth from Space — private branch, local-fixture preview (packet for GPT)

Branch `earth-from-space-rc`, from `main`. Proposal: `docs/concepts/EARTH-FROM-SPACE-PROPOSAL.md` rev 2 on branch `earth-from-space-proposal` (`7e3ea60`), with Chad's decisions of 19 Nov: tab "Earth from Space", second; ten-minute collection; 24-hour deletion grace protecting current and previous; three three-hour timing samples.

**Asked of this review:** the local-fixture preview and the code behind it. **Not asked and not authorised:** any production step. Nothing in production was changed: no deployment, no storage write, no gate, no schedule, no probe, no merge, no provider contact, no spending. The hub in production is still 0.6.19.

**Two things Chad asked to be brought back with evidence are in sections 3 and 4:** whether a Worker can confirm served times, and whether the decoder fits comfortably. The first has supporting production evidence. **The second does not fit comfortably** and comes with options.

## 1. What was built

| Part | Files |
|---|---|
| Hub collector, routes, gate, manual run | `phase1/worker.js` (section "Earth from Space"; hub version 0.6.20 on this branch) |
| Carried JPEG decoder | in `worker.js`: jpeg-js 0.4.4 `lib/decoder.js`, the `JpegImage` class, unmodified, 38.6 KB, with its Apache-2.0 notice |
| Page | `space.html`, `space.js`, styles at the end of `style.css` |
| Tab and Menu entry on every page | `index.html`, `timeline.html` (regenerated), `moon.html`, `sun.html`, `sources.html`, `space.html` |
| Header for five and six tabs | `style.css` (tab row, promise line), three scripts (keep the current tab in view) |
| Sources text | `sources.html#earthview` |
| REGISTER draft, **not filed** | `reviews/2026-11-19-earth-from-space-register-draft.md` |
| Real fixtures | `phase1/earthview-fixtures/` (three frames of 19 Nov 2026 with request and hashes) |
| Suites | `phase1/earthview-hub.test.mjs`, `phase1/earthview-ui.test.cjs`, `phase1/header-tabs.test.cjs` |
| Preview | `phase1/earthview-preview.mjs` (needs Node), `phase1/earthview-static-preview.mjs` (builds a copy any file server can serve) |
| Evidence | `reviews/evidence/2026-11-19-earth-from-space/` |

### 1.1 The collector, step by step
1. **Source check.** One capabilities read. The newest listed time of `mtg_fd:rgb_geocolour` is taken from that layer's own element and must sit on the ten-minute grid. A failure here is recorded as a failed *check* with no "newest frame" claimed.
2. **Nothing newer:** no picture request; the frame record is not touched; the state says "nothing newer".
3. **Two requests for exactly that time:** the 2,048 px JPEG and a 256 px transparent PNG of the same view (`EPSG:900003`, box ±5,500,000 m, `bgcolor=0x0B1016` on the JPEG). The request is pinned in one constant and recorded whole in every frame record.
4. **Served time, strict.** Both responses must carry a `Warning` header that names a time, and both times must equal the time asked for. Header absent, header naming no time, or a different time on either response: nothing published, pointer untouched, and the requested time is written nowhere as a frame time.
5. **The delivered JPEG itself:** content type; size limits; a walk of every segment to the last byte (end marker present, nothing after it); 2,048 × 2,048, three components; **every coefficient of every component delivered at full precision** across the scans (a progressive file cut after an early scan is valid syntax and decodes; this is what refuses it); then a **full strict decode**.
6. **Comparison with the check image of the same run** (the PNG is fully decoded: chunk checksums, inflate to the exact size, unfilter): where the check image is clear, the picture must be the colour that was asked for; the disk must not touch the frame edge; the disk must not be flat; block brightness must agree. No disk fraction is hard-coded: the check image of that run says where the disk is.
7. **Store once, read back, then publish.** Key names the time and the content hash; create-only; a different object already at that key is never overwritten. The held list learns of the picture before the pointer can name it. The pointer moves by compare-and-swap, and only forward in frame time.
8. **Cleanup happens only here,** in a run that has just published a newer verified frame: a picture is deleted when it is neither current nor previous and left that role at least 24 hours ago. A failed or idle run deletes nothing, however long the outage.

Three records, kept apart: `earthview/current.json` (frame, previous), `earthview/state.json` (last source check; last collection outcome), `earthview/held.json` (every stored picture and when it left its role). `/snapshot/earthview/meta` serves the first two side by side with the hub's clock.

Gate: `EARTHVIEW_ENABLED=1` puts it on the existing five-minute trigger, every other tick, after earthquakes. Unset: no request, nothing written. `/admin/run/earthview` runs it once.

### 1.2 The page
- The picture, never stretched, on its own dark surround; alternative text gives product and source frame time.
- **"Source frame time"** with date, and its age counted from the hub's clock.
- State lines, each tied to its evidence (proposal §7): current / waiting / nothing newer than HH:MM / could not check the source (never worded as a delay) / newer frame listed but collection failed / no verified picture / hub unreachable / last check older than 25 minutes.
- **A newer verified frame is offered in one line and shown only on request.** Everything else on the page keeps describing the displayed picture.
- Zoom in, zoom out, whole picture; drag; plus, minus, 0 and arrow keys; stops at one picture pixel per screen pixel. Nothing animates.
- "How this image is made", closed by default. Credits. The city-lights caution is always visible, not inside the disclosure.
- The page reads only the hub. It never contacts EUMETSAT (asserted in the suite).

### 1.3 Header
- Tab "Earth from Space" second on every page; shown as "From Space" below 900 px; its accessible name is always "Earth from Space".
- With the real fonts, five tabs and six tabs fit at every width tested from 320 to 1920 px. With fallback fonts they can be wider than their place, so the tab row now scrolls inside itself and the page scripts keep the current tab in view; the page itself never scrolls sideways.
- World View's promise line: shown whole (two lines at most) or not at all, decided by its own available width (a container query at 63 characters), so it holds for five tabs, six tabs and either font. Below 1140 px it stays hidden, as today.
- **Changed for existing pages:** `craft.js`, `timeline.js` (one block each, the tab scroll), `timeline.html` regenerated for the new asset version, `index.html` promise wrapped in a span.

## 2. Stage 1 measurements (read-only)
| Item | Result |
|---|---|
| Request box | ±5,500,000 m in `EPSG:900003`; the disk fills 0.9866 of the frame width; about 14 px of 2,048 clear on each side; no opaque pixel on any edge in three frames (`request-box.md`) |
| Fixtures | three real frames, 00:00, 11:00, 16:50 UTC on 19 Nov; every response carried the header naming the requested time (browser pane) |
| Listing-delay sample, night | 17:33 to 20:33 UTC, 176 reads a minute apart, none failed. 18 new frames: listed **19.9 to 24.7 minutes after their frame time, median 22.5** (each figure up to about a minute late). One frame (18:20) was never the newest listed: the list went from 18:10 to 18:30. With collection every ten minutes, a picture would reach the page roughly 20 to 35 minutes after its frame time on this evidence (`timing-night.json`). One evening; not a bound |
| Listing-delay samples, morning and afternoon | **not yet run** (need the Mac's browser pane open for three hours each) |
| Cloudflare account usage (requests, CPU, R2 operations) | **not read** (dashboard; needs Chad signed in). Prices in section 5 are from Cloudflare's published pages |
| What instant the frame time marks | **not established**; no EUMETSAT statement found. The page says so |

## 3. Can a Worker confirm served times? Evidence: yes, so far
- The Dust RGB collector, live in production since 13 Nov, asks the same EUMETView service and records whether the header arrived. Read today from the **public** route `/snapshot/dustrgb/meta` at 18:33 UTC: both of today's runs (05:40 and 17:40 frames) have `warning_header_present: true` on picture and mask and `served_time` equal to the requested time, source "server Warning header". STATUS, 13 Nov: the header reached the production Worker on the first run too.
- **Limits of that evidence:** another layer (`rgb_dust`) and another projection (`EPSG:4326`); three runs read, not the full log; GPT's Workers Playground probes on 12 Nov did not receive the header. GeoColour in `EPSG:900003` from a Worker is untested.
- **If the header does not arrive in production, the feature publishes nothing.** That is the strict rule working, and the page would say "No verified picture is available" with the reason. Confirming it needs one manual run in production, which is not authorised.

## 4. Does the decoder fit? Not comfortably. Evidence and options
Measured on the three real frames, Node 22, one process each (`decoder-measurements.jsonl`):

| | day | night | dusk |
|---|---|---|---|
| CPU, whole validation | 416 ms | 423 ms | 431 ms |
| of which JPEG decode | 366 ms | 369 ms | 379 ms |
| JavaScript memory in use when the decode returns | 80.7 MB | 81.7 MB | 80.7 MB |
| Process peak (started at about 45 MB) | 131 MB | 132 MB | 138 MB |

- **CPU is comfortable.** About 0.4 s against a 30 s limit per run; a Worker may be several times slower and still be far inside it.
- **Memory is not.** A Worker isolate is limited to 128 MB. The decode holds about 80 MB at its peak here (the decoder keeps every coefficient as a 32-bit number, about 25 MB, plus one small array per 8 × 8 block, then the planes). The run still completes with the V8 heap capped at 32 MB, so most of it is array storage that cannot be squeezed. **That is roughly 63% of the limit before counting the rest of the hub in the same isolate, measured on Node and not on Cloudflare.** An overrun would kill that run only: nothing published, last good picture kept. It would not be a wrong picture. But it could mean the feature never publishes.
- The decoder's own memory cap is set to 96 MB; above that it refuses and the run fails cleanly.

**Options:**

| | Option | Effect | Cost |
|---|---|---|---|
| A | Keep as built; settle it with one manual production run | Real answer in one run. If it fits, done | Needs Chad's Approve line; a failed run publishes nothing |
| B | Ask for a smaller picture, 1,536 px | Memory scales with pixel count: about 45 MB expected (not measured: needs new fixtures) | Less detail at full zoom (7.2 km per pixel instead of 5.4) |
| C | Change the carried decoder to store coefficients as 16-bit in one shared buffer | About 35 to 40 MB less (estimate) at full size | We would be modifying third-party code: more to review and to keep |
| D | Hub does the structure and completeness checks; the full decode moves to the page, which refuses a picture that does not decode | Hub memory trivial | Weaker than GPT's rev 1 requirement that the hub validate the delivered JPEG; a damaged scan would be stored and refused per visitor |
| E | A WebAssembly decoder | Lower memory, faster | The hub is deployed as one pasted file; this needs a different deployment method |

**Claude's recommendation: A first, with B as the fallback already agreed.** A costs one approved run and replaces an estimate with a fact; B is a one-line change plus new fixtures and keeps the hub's full decode.

**What the decode does not catch** (`damaged-input.md`): damage inside a late refinement scan that still decodes (64 flipped bytes, or 4 KB zeroed, mid-file) changes a small area faintly, agrees with the check image at 0.936, and **would be published**. A JPEG has no checksum and the service sends none. Every cut, incomplete, replaced, blank, wrong-size, wrong-frame or non-picture case tested is refused.

## 5. Cost
Nothing new is paid for. Expected additional recurring charge: **under US$1 a month; cents at most.**
- CPU: 144 runs a day at about 0.4 to 1.5 s when a new frame is listed is roughly 2 to 6.5 million CPU-ms a month. The Workers Paid plan includes 30 million; beyond that US$0.02 per million, so at most about US$0.13 if none of the allowance were left. **How much of the allowance the account already uses was not read.**
- R2 writes: about 6 per published frame plus one state write per idle run, roughly 30,000 a month against 1 million free. Storage: about 146 pictures at 0.5 to 0.7 MB, about 100 MB, against 10 GB free. Deletes are free.
- R2 reads and Worker requests grow with visitors: an open page reads the record once a minute (two R2 reads) and one picture per frame shown. 10 million reads and 10 million requests a month are included.
- Outbound requests to EUMETSAT: 144 list reads and up to 288 pictures a day. No charge; the service's own rate headers allow 20 per context and 8 at once.

## 6. Tests
| Suite | Result | Breaks, each must fail |
|---|---|---|
| `earthview-hub.test.mjs` | **108 passed, 0 failed** | 19 of 19 fail: gate-ignored, no-header-ok, mismatch-ok, check-header-skipped, scans-any, trailing-ok, decode-error-ignored, no-compare, pointer-on-fail, no-grace, delete-idle, no-cas, overwrite, no-readback, serve-any, generic-down, delay-on-failed-check, older-over-newer, type-any |
| `earthview-ui.test.cjs` (real hub code, real frames, real browser) | **72 passed, 0 failed** | 11 of 11 fail: auto-swap, requested-time, delay-wording, current-on-failed-check, stale-ignored, step-back, zoom-unbounded, pan-unbounded, offer-hidden, keep-on-error, contacts-source |
| `header-tabs.test.cjs` (6 pages × five and six tabs × real and fallback fonts × up to 20 widths) | **3,218 passed, 0 failed** | 5 of 5 fail: no-scroll, no-short, no-fit, no-current, no-name |
| `desktop-overflow.test.cjs` (promise expectation updated, see 1.3) | **267 pass, 0 fail** | |
| `dustrgb-hub.test.mjs` | 174 passed, 0 failed | |
| Other hub suites | all pass; three had the hub version pinned (history-hub, sunface-hub, wind-hub) and were updated to 0.6.20 | |
| Existing page suites | see the table below | |

**Existing page suites on the branch** (cloud workspace, headless Chromium, run one after another):

- **Pass:** aircraft-dots-page 45 · arts-ui 90 · backdrop-layer 27 · bare-earth-ui 190 · buoy-temp-ui 33 · cell-perf-ui 43 · dustrgb-ui 67 · fire-status-ui 279 · fires-wording-ui 35 · freshness-wording-ui 156 · key-drawn-ui 70 · layer-switches-ui 68 · legend-active-ui 548 · mobile-pass 131 · moon-globe 67 · moon-lit 138 · moon-lro-path 68 · night-lights-ui 152 · oceanheat-ui 109 · optional-layers-status-ui 230 · orbital-browser 113 · plastic-ui 29 · quakes-ships-status-ui 124 · ships-retain-ui 42 · sky-ui 79 · sky-zoom-ui 351 · skycraft-ui 77 · status-notes-ui 17 · sun-globe 103 · terminator-behaviour 47 · timeline-axis 96 · timeline-changes-ui 173 · wind-ui 92.
- **timeline-ui 594 pass, 0 fail** after two changes to it: its tab and Menu expectations now name five tabs and six Menu entries, and `space.html` is added to the pages it checks (591 on main).
- **Fail in this workspace on `main` and on the branch with the same result** (so not caused by this branch; the cause was not investigated, and these same suites are recorded as passing at earlier releases): ux-round1 33 passed, 1 failed · search-ui 113 passed, 4 failed · osmc-reliability-ui 40 passed, 1 failed · drifters-ui 24 passed, 1 failed · kept-ui 18 passed, 3 failed · terminator-ui 18 passed, 1 failed · place-ui stops at "cell inspector offers Everything here" (click timeout) · smoke-fixes stops at "fire cell opens (click path)" (timeout).
- A first pass of the whole list had more failures; those were this workspace missing test modules and fixtures (pngjs, the orbital fixture, the Ocean Heat snapshot, a scratch folder), and they passed once the workspace was set up as START-HERE describes.

Notes on the suites: two breaks (pointer-on-fail, no-grace) fail by stopping the suite on an error, not by a counted assertion. One break first written (tolerant decoding) did not fail and was replaced, because the decoder's tolerant mode only matters for a case the structure walk already refuses.

## 7. Not done, not known
- Morning and afternoon listing-delay samples.
- Cloudflare account usage.
- Any run inside a Cloudflare Worker: memory, CPU, and the header for this layer and projection.
- Validation limits rest on three frames from one day.
- Real phone, real screen reader, Safari. The suites run in headless Chromium only.
- The Animals branch also edits the tab row and header styles. Whichever merges second must merge main first and rerun `header-tabs` and `desktop-overflow`.
- REGISTER entry and Sources text are drafts until release.

## 8. Preview
Static copy for a plain file server (no Node needed), in the Mac review folder:

    cd "<Mac review folder>" && python3 -m http.server 8899 --bind 127.0.0.1
    http://127.0.0.1:8899/space-preview.html

`PREVIEW-README.md` there lists the ten scenes, what is real and what is stand-in, and the three lines of `space.js` that differ in the preview copy. With Node: `node phase1/earthview-preview.mjs` and open `/__preview`.

## 9. Questions for GPT
1. Section 4: A, B, C, D or E?
2. Is the Dust RGB production evidence enough to proceed to a manual production run when Chad chooses, given that a missing header publishes nothing?
3. The state wording in 1.2, and "Showing an earlier frame" with "Waiting for the next frame." beneath it when the reader is on an older frame.
4. The limit left open in section 4 (faint local damage in a late scan): acceptable if stated in Sources, as drafted?
5. The promise line by container query, and the tab row scrolling under fallback fonts.
