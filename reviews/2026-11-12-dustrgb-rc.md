# dustrgb-rc — Dust RGB imagery (EUMETSAT Meteosat, hub-collected twice daily) — candidate review packet

Built on Chad's line: "Go: build dustrgb-rc on a branch per DUST-RGB-LAYER-PROPOSAL rev 5 (hub job and page layer; no merge, no hub deploy)". **Branch only. Nothing merged, uploaded or deployed. No REGISTER entry filed.** Live unchanged: hub 0.6.10 `784939f8…a0da`, page `12ff4ff`. Lockdown parked.

Proposal: `docs/concepts/DUST-RGB-LAYER-PROPOSAL.md` rev 5. Branch base: main `cf8119c`. Times below are UTC; SAST = UTC + 2.

## 1. What the candidate is

One optional layer, off on load. Twice a day the hub asks EUMETSAT's EUMETView map service for the latest Dust RGB frame in its published list, validates and stores one picture and one footprint mask, and the page paints that pair on the globe when the visitor switches the layer on. The page never contacts EUMETSAT.

Files changed against main (`git diff --stat main`):

| File | Change |
|---|---|
| `phase1/worker.js` | hub 0.6.11: job `dustrgb`, routes `/snapshot/dustrgb/*`, `guarded()` branch, schedule line, endpoints list, test exports |
| `dustrgb.js` | new page file (the layer) |
| `index.html` | card `#card-dustrgb`, script tag, footer credit, `style.css?v=` bump |
| `sources.html` | section `#dustrgb`, `style.css?v=` bump |
| `style.css` | `.opt-dustrgb` rules |
| `timeline.html` | `style.css?v=` bump only |
| `phase1/dustrgb-hub.test.mjs`, `phase1/dustrgb-ui.test.cjs`, `phase1/dustrgb-fixtures/` | new suites and two small picture fixtures |

Sizes and fingerprints of the two code files are in §7.

## 2. Hub (0.6.11)

**Gate.** `DUSTRGB_ENABLED` must be exactly `1`. Absent or anything else: the scheduled job reports "not scheduled" and makes no request. The variable is not in `wrangler.toml`; it would be set in the dashboard at deploy time (Chad's click).

**Schedule.** Inside the existing hourly job (minute :07), only when the UTC hour is 06 or 18 (08:07 and 20:07 SAST). A manual `/admin/run/dustrgb` runs it directly.

**One run** (`collectDustRgb`):

1. GET the `mtg_fd` namespace capabilities (about 35 KB). Not HTTP 200 → fail "frame list http error". No readable time for `rgb_dust` on the 10-minute grid → fail "frame list unreadable".
2. If the advertised latest time equals the frame already held → log "unchanged", **no image request**.
3. GET the picture: JPEG 2048 × 2048, box 80°S–80°N, 80°W–80°E, `time=` the advertised time. Then GET the mask: transparent PNG 160 × 160, same box and time. Each request has a 90-second limit.
4. Validate each: HTTP 200; content type exactly `image/jpeg` / `image/png` (EUMETView answers a bad time with HTTP 200 and XML); size within 4 MiB / 512 KiB; JPEG signature, frame dimensions and end marker; PNG signature, dimensions, an alpha-capable colour type and a final IEND.
5. If a `Warning` header ever names a served time and it differs from the time asked for → fail "… served time differs". (GPT's probes found the header absent from Workers in all four modes; the code records presence/absence in the run note.)
6. Write both files under `dustrgb/frames/<id>/`, read each back and compare size and SHA-256. Only then write the pointer `dustrgb/current.json` with the new frame, the old frame as `previous`, `last_attempt: null`.
7. Delete everything under the prefix except the current and previous pairs (orphans of failed runs included).

**Failure** (`dustFail`): the pointer keeps its frame untouched and gains `last_attempt {run, failed_at, status, http, reason, consecutive_failures}`. `reason` is one of a fixed set of phrases; raw detail (exception text, content type seen) goes only to the D1 run note. An uncaught exception goes through `guarded()` to `dustFail(… 'internal error')`, never the generic `writeDown` envelope.

**Frame time.** `served_time` is `null` and `time_basis` reads "requested time only: the server can substitute the nearest frame and did not say which frame it served" unless both files carried a header naming the same time.

**Routes.**
- `GET /snapshot/dustrgb/meta` — the pointer with storage keys removed, plus `now`; `no-store`.
- `GET /snapshot/dustrgb/<id>/picture.jpg|mask.png` — only for the current or previous frame; stored bytes are re-checked against the pointer's size and SHA-256 on every request (mismatch → 503 "integrity"); `Cache-Control: public, max-age=86400, immutable`; ETag = the SHA-256.

No D1 schema change. No change to any other collector, route or the cron expression.

## 3. Page

- Card "Dust RGB imagery · Observed", a switch, off on load. Off: no request to the hub for this layer.
- On: one pointer request, then one picture and one mask. Both files are checked against the pointer's size and SHA-256 **in the page** before anything is decoded or drawn.
- The picture is cut to the mask's footprint on a canvas; a thin white outline follows the footprint edge; outside it the texture is transparent. It is wrapped on a partial sphere just above the surface (the Ocean heat method), opacity 0.82, never a pick target. Desktop texture 2048 px, phone width 1024 px.
- Label: **"Frame requested: 12 Nov, 18:00 UTC · 5 h old"** ("Frame:" only if the hub recorded a served time). Second line: "Meteosat (MTG) at 0° · Updated twice daily." plus, when they apply, "Latest update failed at HH:MM UTC." (the hub's own failed run) and "Refresh unavailable." (the page could not refresh).
- Age states: current to 14 h, stale to 24 h, then **cleared**: nothing drawn, state "unknown". A frame already older than 24 h is never fetched.
- Refresh: the pointer is re-read every 30 minutes while the tab is visible; never while hidden. A frame already shown is not fetched again. A newer frame replaces the old one in one step (mesh, time and label together) only after both files are verified and decoded.
- Failed first load: nothing drawn, the reason shown with "Nothing is drawn." Failed refresh: the frame stays with its original time, marked "Refresh unavailable."
- Switching off while files are in flight: a late response never paints.
- **Added during the build (not in rev 5):** the layer waits up to 60 s for the globe's own backdrop picture before drawing, because it borrows the globe's drawing classes from it. Without this, switching on during a slow backdrop load (we saw about 30 s in Chad's Chrome check of the earlier candidate) would have failed after 5 s. If the backdrop never arrives the card says so and nothing is drawn. Ocean heat has the same dependency with no wait; not changed here.
- Details text, Sources section and footer credit use GPT's wording from the rev 4/5 reviews. Credit: "Contains modified EUMETSAT Meteosat data 2026 (Dust RGB - MTG - 0 degree, CC BY 4.0)".

## 4. Tests

### 4.1 `phase1/dustrgb-hub.test.mjs` — real `worker.js`, fake R2 / D1 / EUMETView

**101 passed, 0 failed.** Covers: gate off and on; schedule hours (06, 07, 18); request URLs; unchanged frame → no image request; publish → pointer shape, read-back, previous pair kept one run and still served, oldest deleted; every failure in §2 (frame list 500 / unreadable; picture XML, 503, wrong size, truncated; mask not PNG, no alpha, wrong size, truncated, XML; served-time mismatch on either file; partial write; read-back mismatch on either file; uncaught throw; **picture or mask request timing out**) each leaving the frame and files unchanged with the fixed public reason and the detail kept out of the pointer; first-ever run failing; routes (meta strips keys; unknown id 404; tampered stored bytes 503).

Breaks (`BREAK=<name>`, weakened copy must fail) — all 12 fail: `gate-ignored no-type-check no-readback no-mismatch keep-all move-on-fail any-frame mask-any generic-down refetch-same pointer-early no-timeout`.

### 4.2 `phase1/dustrgb-ui.test.cjs` — the real page files in Chromium, hub answered by a fixture

**53 passed, 0 failed.**

| Group | What is checked |
|---|---|
| A | Off on load: no hub request for the layer, none to EUMETSAT; card, details wording, footer credit |
| B | On: exactly pointer + picture + mask; label and second line exact; one mesh; texture pixels: picture inside, transparent outside, outline at the edge; mesh spans the box only |
| B2 | "Frame:" when a served time is recorded |
| C, C2 | minutes under an hour; current at 13.9 h; stale at 14.5 h; cleared past 24 h; a frame already older than 24 h is never fetched |
| D | Six failed first loads (pointer 500, no frame yet, picture 404, picture tampered, mask tampered, mask not an image): nothing drawn |
| E | Same frame not refetched; newer frame held mid-load → old frame, time and texture all still shown; then all change together; exactly one mesh |
| F | Refresh fails (hub unreachable; new picture tampered) → frame and original time kept, "Refresh unavailable."; cleared by a later good refresh; hub's failed run shown as "Latest update failed at 18:07 UTC." with no raw reason; retained frame cleared at 24 h |
| G | Off while the picture is in flight → the late response never paints; refresh while off makes no request; on again works |
| H | Reader across the hub's swap: pointer read for frame A, hub publishes B, the page still gets A's matching pair |
| I | Timer checks while visible; none while hidden; none after off |
| M | Backdrop late → still "loading", then painted; backdrop never → plain message, nothing drawn |
| J, K, L | Phone width uses the 1024 texture; no WebGL → message, no request; Sources section content |

Breaks — all 14 fail: `eager refresh-when-off no-verify swap-early late-paint keep-forever refetch-same clear-on-fail hidden-refresh frame-word no-mask no-outline fetch-when-old no-wait`.

One test correction worth knowing: the hidden-tab check first used fixed waits and failed once when five browsers ran at the same time on the build machine. It now waits for three timer checks however long they take, then watches the hidden tab for twice that long.

### 4.3 Full regression

See §8 (filled in from the run on the final files).

## 5. Check against the real service (20:42 SAST / 18:42 UTC, 12 Nov, in the browser pane signed in by Chad)

The hub's own `dustLatest`, `jpegSize` and `pngInfo` functions, copied verbatim, were run on live responses fetched with the hub's exact URLs. Nothing was downloaded to disk.

| | Result |
|---|---|
| Capabilities | HTTP 200, 34,860 characters; latest time read: `2026-11-12T18:20:00Z` (22 min before the request) |
| Picture | HTTP 200, `image/jpeg`, 672,352 B, 2048 × 2048, end marker present; 19.3 s |
| Mask | HTTP 200, `image/png`, 65,156 B, 160 × 160, colour type 6 (RGBA), complete; 3.1 s |
| Mask alpha | 22,300 opaque, 3,300 transparent, **0 partly transparent**; corners transparent; no transparent pixel within 60 px of the centre; equator row opaque from column 1 to 158, top rows narrower |

So the validators accept a real pair, and the real mask is a clean two-valued footprint. **This was a browser, not the Worker**: the hub job itself has not run against EUMETSAT. The first real run is the deploy-time check (§6).

## 6. What this candidate has not shown

1. **No real hub run.** The job has only run against a fake EUMETView. GPT's earlier Playground test showed a Worker can reach the service; this code has not.
2. **No real picture on the real globe.** The rendered check used a synthetic gridded picture: 0° longitude, the equator and a marker at Cape Town landed where expected relative to each other. Alignment against real coastlines, the 0.82 opacity, and legibility over southern Africa (proposal D5) need Chad's eyes on a real frame.
3. **Colour key (D4)** is still general guidance; Sources says it has not been checked against an EUMETSAT key for this instrument.
4. **Stale/unknown thresholds (14 h / 24 h)** are provisional, as in the proposal.
5. **Picture fetch time.** 10–37 s seen in the pane across the day; limit set to 90 s. A run that times out keeps the previous frame and tries again 12 hours later (no retry inside a run).
6. **iPhone / Safari / VoiceOver** not checked (also open from earlier releases).
7. The overnight availability log in the browser pane is still running (16 rows at 18:42 UTC); it is background evidence and no longer gates this build.

## 7. Fingerprints (SHA-256)

| File | Bytes | SHA-256 |
|---|---|---|
| `phase1/worker.js` (0.6.11) | 307,660 | `a8e3b51ae0f43aae3fe59d70dd797a1980c2854e2ae8b3970da7cac99f21f6eb` |
| `dustrgb.js` | 13,251 | `224e0221e99fdedb6ad5733b3b3308b2c0384ac96c5117d98b1521763f6bfca4` |
| `index.html` | | `da296ca23eba191f991cd97fc347c489fabe08989a5e410eba55daa60b0668d9` |
| `sources.html` | | `a21a3423a71afa8774f99d50ba78aaa611c41036aa9ee21e613de1b37454077e` |
| `style.css` | | `4b1e2e184d929ece0b9c49d7c6682a504bdbba4eda7f12c3dc54a80dc7254aa7` |
| `timeline.html` | | `0ab9f666f4cc3a3e0e4daf6f58603b7f63f0c81f0d6ece8f53b9b82d8b8c7df6` |

`worker.js` and `dustrgb.js` were byte-identical before and after the regression run (checked with `sha256sum -c`).

## 8. Regression result

Full run 18:41:49–19:08:26 UTC on the final `worker.js` and `dustrgb.js`: 59 suite files, 4 skipped as always (live-network probes), **52 passed, 3 failed on first run**. Each of the three, in full:

1. `timeline-changes-build` — "style.css ?v= bumped on all three pages together" required the stylesheet version to **equal** that release's build id. This candidate bumps the stylesheet again. **Assertion loosened**: same version on all three pages and not older than that build. Now 45/45.
2. `status-notes-ui` — "page file index.html unchanged from main 143f531" pinned the page to the 0.6.10 release, whose premise was "no page change". This candidate adds a card to `index.html`. **Assertion loosened**: `index.html` must still load the same `app.js` build as `143f531`; `app.js` itself stays pinned byte-for-byte. Now 16/16.
3. `terminator-ui` — "rendered shading matches the computed day/night at the date line" failed once in the full run. **No change made.** Rerun alone three times: 19/19 each time. I have not found the cause; the layer under review is off in that suite and makes no request. Treat as an unexplained one-off until it recurs. While it ran, another suite and browser work were running on the same machine.

Both loosened assertions are of the kind GPT accepted on the previous candidate (pinned to "the previous release is the latest"); they are for GPT to accept or reject here.

## 9. Decisions for Chad (implemented per GPT's recommendations, not yet confirmed by Chad)

- D2: two runs a day at 06:07 and 18:07 UTC (08:07 / 20:07 SAST).
- D7: times on the card in UTC; "Updated twice daily".
- D9: the wording "Frame requested".
- New: the 60-second wait for the globe's backdrop (§3).

## 10. What would follow, each on its own line from Chad

1. Deploy hub 0.6.11 (content only) and set `DUSTRGB_ENABLED=1` (Chad's click in the dashboard). Then one manual run and a read of `/snapshot/dustrgb/meta`.
2. REGISTER entry for EUMETSAT.
3. Merge the page to main (publishes the site).

Rollback: hub → 0.6.10 `784939f8…a0da`; or simply remove `DUSTRGB_ENABLED` (the job then makes no request and the page shows whatever frame is held until it passes 24 h, then nothing).
