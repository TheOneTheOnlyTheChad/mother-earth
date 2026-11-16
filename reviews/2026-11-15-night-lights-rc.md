# Night lights — release candidate for GPT review (rev 4)

15 Nov 2026, rev 4 on 16 Nov 2026 · branch `night-lights-rc` · code head `88979a223a5fe73ae8e12e94ba20314b40e87ac9` (commit time 16 Nov 01:47:42 UTC), from main `3f87d36`
**Rev 4:** GPT's round 3 held `7457568` for one comparison retry bug. The fix is in §12, which governs where it differs from §1–§11.
**Rev 3:** round 3, the release work, is in §11, which governs where it differs from §1–§10. Earlier code heads: `69a2489` (rev 1), `e2d419b` (rev 2).
**Rev 2:** GPT's round 1 held `8b833ed` for one fix. It is in §10, which governs where it differs from §1–§9. Rev 1's code head was `69a2489`; §1–§9 describe it and are left as written.
**Preview. Page only. Not merged, nothing deployed, no hub change, no REGISTER filing.**
Built on Chad's line: "Go: build night-lights-rc on a branch per NIGHT-LIGHTS-PROPOSAL rev 2 (§9 governing; page only; no merge)".
Governing text: `docs/concepts/NIGHT-LIGHTS-PROPOSAL.md` rev 2 §9, plus GPT's two build details relayed by Chad with the Go (§2 below).

## 1. What changed

| File | Change | sha256 at the code head |
|---|---|---|
| `nightlights.js` | new, 351 lines: the layer, the comparison and their logic | `14baa91b…c805` |
| `index.html` | the Night lights card in Optional layers, one legend line, one script tag, one line in the Key count and its definition, stylesheet key | `22441c0a…4eef` |
| `style.css` | 35 lines for the card, swatches and comparison | `0a03038d…16f4` |
| `sources.html` | stylesheet key only (`202612091000`), as the house rule asks | `df126bc7…e2cf` |
| `phase1/night-lights.test.mjs` | new logic suite | |
| `phase1/night-lights-ui.test.cjs` | new page suite | |
| `phase1/night-lights/recorded-gibs-2026-11-15.json` | NASA GIBS responses recorded 15 Nov 15:52 UTC, as text (each with its sha256) | |

Not changed: `app.js`, the hub, every other page and script. Cache keys: `style.css?v=202612091000` in `index.html` and `sources.html`; `nightlights.js?v=202612091000`. `sun.html` and `timeline.html` still link `style.css?v=202612071000`.

**Differs from the proposal's file list:** the proposal named `index.html`, `app.js`, `style.css`. `app.js` was not needed. `sources.html` changed by one cache key. There is one new page file, so a release would add it to the served-hash checks.

## 2. GPT's two build details, and where each is

| Detail (GPT, relayed by Chad) | In the code | Checked by |
|---|---|---|
| One missing date is enough for "No data", on both panels. Both radiance values present but either confidence missing or under 0.95: "No reliable comparison". Fixture: a valid dark pixel on one date, transparent on the other. | `classify()`: one state per pixel from both dates; both panels are drawn from that one array | logic C (5 checks); page L "GPT fixture"; break `panel-own-state`, break `one-missing-ok` |
| Partial data is not a failed request. "Still arriving" only for a decoded frame that fails the coverage check; a GIBS failure or a blocked pixel read gets its own message. The preview must demonstrate pixel access and a working comparison from its own address. | `pickDate()` stops at the first failed or blocked request and reports it; `failText()`; `getImage()` tells "blocked" from "no answer" | logic E (8 checks); page F, G; breaks `failed-as-arriving`, `fail-as-arriving`; **live check §5** |

No fallback past a failure: if the newest date's request fails, the layer reports the failure and draws nothing. It does not quietly show an older night.

## 3. What the page does

- **Layer.** Off on load, and no NASA night-light request until it is switched on. On: NASA's key, then one small whole-globe frame (512 × 256) per candidate date, newest first, until one passes the rule (no more than 1% no data in 30°S–30°N) or a request fails; then the 2048 × 1024 frame for the chosen date. That frame replaces the true-colour picture. Every no-data pixel is painted with a checker pattern before it goes on the globe.
- **Date.** Pinned: the same UTC date is in the request, on the card, in the legend and in the imagery line on the globe. Dates that failed the rule are named: "15 Nov 2026 is still arriving. Showing 14 Nov 2026."
- **Off.** The true-colour picture and the imagery line return exactly as they were.
- **Comparison.** In the card, under "Compare two nights for one place": latitude, longitude, box size, two UTC dates. It works with the layer off and without WebGL. Four pictures (light and clear-sky for each night) on one box and one grid. Three states per pixel, three printed shares "of the area in view", a tap or arrow-key readout. No radiance total, no percentage, no difference picture, no "less light" sentence.
- **Values** come from the pictures' colours through NASA's two published keys, held as whole numbers (light in tenths, confidence in hundredths) so 0.95 is an exact test. A colour the key does not hold stops the frame: "the picture did not match NASA's published key".
- **Wording.** The words outage, blackout and power do not appear. The as-measured line, the preview-threshold label and NASA's local-scale caveat are on the card and with every result.

## 4. Tests (container, Node 22.23.4, Chromium with SwiftShader, globe.gl 2.45.0)

| Suite | Result at the code head |
|---|---|
| `phase1/night-lights.test.mjs` | 49 passed, 0 failed |
| its 8 breaks (`one-date-shares`, `missing-zero`, `low-usable`, `one-missing-ok`, `failed-as-arriving`, `arriving-as-ok`, `float-threshold`, `bbox-order`) | each fails the suite (2 to 5 checks) |
| `phase1/night-lights-ui.test.cjs` | 85 passed, 0 failed |
| its 10 breaks (`eager`, `date-mismatch`, `no-restore`, `nodata-dark`, `panel-own-state`, `value-when-withheld`, `fail-as-arriving`, `stale-kept`, `power-word`, `total-shown`) | each fails the suite (1 to 7 checks; `eager` also stops it) |

**§9.5 checks, by name in the page suite:** three states and pattern shapes (L); shares equal counts and usable-on-both is the smallest (J, L); 15 April all "No reliable comparison" with no value readable (K); a frame that has not arrived (B, D, E); latest-date rule and the pinned date (B, C, D, E); a failed request against partial data (F); blocked pixel read (G, N); axis order and same box and grid for all four requests (J, logic D); top of the scale reads "38.2 or more" (J); the recorded fixture (J, logic D); one night fails and nothing stale stays (M); dates out of range refused before any request (O); without WebGL (P); 390 px (Q).

**Regression on the branch (existing suites, same container):**

| Result | Suites |
|---|---|
| Pass | arts-ui 90 · backdrop-layer 27 · buoy-temp-ui 33 · cell-perf-ui 43 · desktop-overflow 258 · drifters-ui 25 · dustrgb-ui 67 · fire-status-ui 279 · fires-wording-ui 35 · freshness-wording-ui 156 · kept-ui 21 · legend-active-ui 548 · mobile-pass 131 · moon-globe 67 · moon-lit 138 · moon-lro-path 68 · optional-layers-status-ui 230 · orbital-browser 113 · place-ui 35 · plastic-ui 29 · quakes-ships-status-ui 124 · search-ui 104 · sky-ui 79 · sky-zoom-ui 351 · skycraft-ui 77 · status-notes-ui 17 · sun-globe 103 · terminator-behaviour 47 · terminator-ui 19 · timeline-axis 96 · timeline-changes-ui 173 · timeline-ui 591 · ux-round1 34 |
| Fails the same way on main | `osmc-reliability-ui` 40 of 41 ("old page: no page errors"; the known one). `smoke-fixes` 51 of 52: "Sources 360: no page-level horizontal overflow" (page 367 px wide at 360) — run against untouched main `3f87d36` in the same container: the same 51 of 52. Not caused by this branch; not on record before. |
| Not run | `oceanheat-ui` (needs the ocean heat snapshot folder, which is not in this container). |

Five suites failed on a first pass for reasons in the container, not the page: missing font files (`backdrop-layer`), a missing scratch folder (`buoy-temp-ui`), a missing orbital fixture (`mobile-pass`), and a shallow clone without the old commits that `status-notes-ui` and `osmc-reliability-ui` compare against. The table shows the reruns after those were supplied. Both new suites were run once more at the end, on the code head: 49 and 85, no failures.

## 5. Live check: the real GIBS path, from the site's own address

Method (START-HERE §5a, "Live RC check in a clean session"): a pane tab on `https://theonetheonlythechad.github.io/mother-earth/app.js?clean-nl1`; `index.html`, `style.css` and `nightlights.js` fetched from `raw.githubusercontent.com` at the code head, each sha256 equal to §1; written into the tab. The page then runs at the address a release would have. All other scripts are main's, which the branch does not change. Desktop app's browser pane on Chad's Mac, 588 px wide (phone layout), a real GPU. 15 Nov 2026, 16:16–16:17 UTC.

| Check | Result |
|---|---|
| Pixel access from `theonetheonlythechad.github.io` | Works. GIBS answers with `access-control-allow-origin: *`; no frame was blocked. |
| Comparison, 19 March and 20 April 2026, box 14.85–15.35° N, 145.45–145.95° E, 120 × 120 | Both nights loaded in 0.8 s; four pictures, 12,379 bytes in all |
| Shares on the page | "Readable on 19 Mar 2026: 57% · Readable on 20 Apr 2026: 92% · Usable on both: 50% — of the area in view" (8,273, 13,208 and 7,258 of 14,400; no pixel without data) |
| Live values against the recorded fixture | Identical: Saipan 2,854.1 and 769.9; Tinian 183.0 and 137.8 (harness arithmetic on what the page decoded; not shown on the page) |
| Layer on | Chose **14 Nov 2026**; 15 Nov 56.6% missing in 30°S–30°N ("still arriving"); 14 Nov 0.30% missing. Ready in 5.1 s. Full frame 918,414 bytes. |
| Requests for the layer | NASA's key, two 512 × 256 frames, one 2048 × 1024 frame |
| On the globe | Night lights drawn (city lights across South and East Asia visible in the pane); 17.4% of the picture is the no-data pattern; a point at 85° S is the pattern, a mid-Pacific point is NASA's darkest grey |
| Card, legend, imagery line, Key | "Showing 14 Nov 2026 (UTC) … 15 Nov 2026 is still arriving. Showing 14 Nov 2026."; Key count included night lights |
| Layer off | Backdrop URL, imagery line and Key count all back to what they were |

One night, one place, one browser. Request volume and GIBS's published limits were not measured or read.

## 6. A correction to the test record, found while building the fixture

The test record gave the Saipan box as 1,950 pixels and its totals as 2,854 and 770, and Tinian as 1,080 pixels with 183 and 138. **Those totals were taken over each box with its edges rounded outward to whole pixels (2,028 and 1,175 pixels), not over the 1,950 and 1,080 pixels whose centres lie inside the boxes.** The pixel counts and the totals came from two different rules. The data has not changed.

| Box rule | Saipan, 19 March → 20 April | Tinian |
|---|---|---|
| Edges rounded outward (the published totals) | 2,854.1 → 769.9 (2,028 pixels) | 183.0 → 137.8 (1,175 pixels) |
| Pixel centres inside the box | 2,853.2 → 760.9 (1,950 pixels) | 181.8 → 130.2 (1,080 pixels) |

- The share of pixels at or above 0.95 clear-sky confidence is 85% and 95% (Saipan) by the outward rule, as published, and 86% and 95% by pixel centres.
- The fixture keeps `2,854 → 770` exactly as GPT asked, by the rule that produced it, and checks the pixel-centre figures beside it.
- The record and both proposal revisions state the totals correctly and the pixel counts wrongly. The record is corrected on main (`docs/research/NIGHT-LIGHTS-GIBS-DATA-PATH-TEST-2026-11-15.md`, erratum).
- **A second slip in the same record.** Its clear-sky shares for 18 and 19 April (0% and 47% of Saipan) and the first table Chad was shown counted only pixels ABOVE 0.95: the in-browser count held the values as 32-bit numbers, in which 0.95 is stored slightly low and fails "0.95 or more". Re-read 15 Nov 16:58 UTC with whole numbers, pixel centres: **18 April 5.3%, 19 April 66.8%**, 19 March 86.3%, 20 April 95.1% (Tinian 9.4%, 18.9%, 85.6%, 95.0%). 20 April is still the clearest of the three. The build compares whole hundredths for this reason (break `float-threshold`). Corrected in the record's erratum.

## 7. Not done, not seen, or open

- **`sky-zoom-ui`** did not finish inside the first run's 7-minute limit; rerun with a longer limit it passes, 351 of 351 (about 12 minutes). It does not switch Night lights on.
- **Sky zoom-out view with Night lights on:** not tested. That view prints the Earth imagery date from the same line this layer rewrites, so it should name night lights; unverified.
- **The status report and Sources & Details still describe the true-colour picture** while Night lights is on (`app.js` is unchanged). There is no Night lights section on Sources & Details; the card links to NASA GIBS. Both are release work, with the REGISTER lines.
- **Mask alignment** is checked at the request (one box, one grid for all four pictures) and by the lit pixels falling inside the island boxes. A coast falling on the same pixels in both layers could not be checked: neither layer draws a coast.
- **Box sizes of 5° and 10°** are drawn at 480 × 480, coarser than the layer's own detail. The result states the pixel grid but not that it is coarser.
- **In the comparison, a date that is still arriving** shows as "No data" pixels; the words "still arriving" are used only by the layer.
- **Clear-sky no data** (for example half of 90–60° S on 14 Nov) reads as "No reliable comparison", by the rule.
- **Not measured or read:** moonlit frames; when a UTC date finishes filling; GIBS request limits.
- **Not tested:** a real phone, Safari, a screen reader. Edge states (failed request, blocked read, no complete frame, one night failing) have been seen only in the suites.
- The live 14 Nov frame had 0.30% missing in the band, against the 1% line.

## 8. For GPT's local preview

Mac: `~/Documents/Mother Earth/_review/night-lights-rc/` (the branch at the code head). Serve that folder and open `index.html`; the page asks the live hub and live GIBS as the public site does.
- Visual acceptance (GPT): Optional layers → Night lights → "Compare two nights for one place": latitude 15.10, longitude 145.70, box 0.5°, 19 March 2026 and 20 April 2026.
- Stop condition (GPT, §9.5): if the light change and the missing coverage are not visually distinct, the feature stops here.
- Pictures from the page suite can be regenerated with `SHOTS=<dir>`; none are in the repo (text only).

## 9. Decisions still Chad's

Merge and release are not asked for. Before any release: the route (N1: direct GIBS, or the hub applying the date rule on its schedule, per Chad's "no manual jobs"), the REGISTER lines for the two GIBS layers, the Sources & Details section, and the status report wording.

## 10. Round 2 — GPT's round 1 (relayed by Chad, 15 Nov)

**GPT:** hold `8b833ed` for one fix. The Saipan and Tinian comparison passes: rendered from the recorded frames with the candidate's renderer, Saipan's lights are visibly dimmer on the second date in the pixels usable on both nights, and the hatched areas are easy to tell from dark measured pixels; 57%, 92% and 50% reproduced; all four file hashes matched; logic suite 49 of 49 and all eight breaks failing as expected. GPT did not rerun the browser suite or the live globe.

**The finding.** The globe could show a frame that fails the agreed rule. The 1% limit was applied to the 512 × 256 probe; the 2048 × 1024 frame was measured again but not held to the limit. GPT reproduced a probe with 0% missing followed by a full frame with 50% missing in 30°S–30°N, which the layer marked ready and drew (`nightlights.js` lines 195–207 at `69a2489`).

**Confirmed here before the fix:** the new checks below, run against `nightlights.js` from `69a2489`, fail 6 of 9.

**The fix (`nightlights.js` only; code head `e2d419b`, sha256 `a77edadc…8ae7`; `index.html`, `style.css` and `sources.html` unchanged from §1):**
- For each candidate date, newest first: the probe; if the probe passes, the full frame; **the same 1% rule on the full frame.** A full frame that fails it makes that date "still arriving", exactly as a failing probe does, and the next date is tried, inside the existing limit of four dates.
- The picture that goes on the globe is always one that passed the rule itself. `state().missing` is that picture's share; each date's record keeps both shares (`probe`, `full`).
- A request that fails or is blocked, probe or full frame, still stops the search with its own message. No older date is tried after a failure.
- If no date's full frame passes: "No complete night frame yet: … are still arriving. Nothing is drawn."

**Checks added (page suite section R, 9 checks):**

| Check | Pass |
|---|---|
| Probe passes, full frame fails (15 Nov) | 15 Nov is not shown; 14 Nov is; 15 Nov named as still arriving |
| The record | 15 Nov probe 0, full frame 0.5; 14 Nov full frame 0; the shown picture's share 0 |
| Requests, in order | key; 15 Nov probe; 15 Nov full; 14 Nov probe; 14 Nov full |
| The picture on the globe | the half that had not arrived on 15 Nov is measured light, not the pattern |
| Every probe passes, every full frame fails | nothing drawn; all four named; eight frames asked for |
| Probe passes, full-frame request answers 503 | the failure message for that date, not "arriving"; no older date tried |
| Probe passes, full-frame read is blocked | the blocked message; nothing drawn |

New break `full-unchecked` (the old behaviour): fails 6 checks.

**Results at `e2d419b`:**

| Suite | Result |
|---|---|
| `phase1/night-lights-ui.test.cjs` | 94 passed, 0 failed |
| its 11 breaks | each fails the suite (1 to 9 checks; `eager` also stops it) |
| `phase1/night-lights.test.mjs` | 49 passed, 0 failed (file unchanged; its 8 breaks not rerun) |
| `mobile-pass` 131 · `legend-active-ui` 548 · `desktop-overflow` 258 · `dustrgb-ui` 67 | pass |

The other existing suites were not rerun: the only page file that changed since §4 is `nightlights.js`, inside the switch-on path.

**Live re-check, 17:29 UTC (same method as §5, files hash-checked against `e2d419b`):** the layer chose 14 Nov; 15 Nov's probe 56.6% missing, so its full frame was not asked for; 14 Nov probe 0.295%, full frame 0.302%. Measured separately on the picture taken back off the globe: 0.302% of the 30°S–30°N band is the no-data pattern. Ready in 5.6 s; 918,414 bytes; off restored the backdrop and the imagery line. The comparison was not rerun live (its code is unchanged).

**Cost of the fix:** when a probe passes and its full frame fails, about 0.9 MB is fetched and discarded before the next date is tried. Not seen live.

**Still as §7**, with one addition: a probe and a full frame disagreeing has been seen only in the suite's fixture and in GPT's reproduction.

## 11. Round 3 — release work (Chad's Go, 15 Nov)

Chad: "Go: build night-lights-rc round 3 per NIGHT-LIGHTS-RELEASE-PROPOSAL rev 2 (§8 governing; RL1 direct GIBS, RL2 deferred, RL3 with round 3, RL4 together; branch only; no merge)". **Not merged. REGISTER not filed. Nothing deployed.**

### 11.1 Files at the code head `7457568`

| File | Change this round | sha256 |
|---|---|---|
| `nightlights.js` | bounded waits, retry wording, the Sky label call, "No data for this date", the coarse-box note (391 lines) | `fefe6dea…01ff` |
| `skyscene.js` | the Earth-imagery label is one function, also callable as `ME.zoomImgLabel` (7 lines) | `18e41b2d…89e5` |
| `index.html` | the card's link goes to `sources.html#nightlights`; keys `nightlights.js?v=202612101000`, `skyscene.js?v=202612101000` | `cc89f5b7…8ba6` |
| `sources.html` | a Night lights section; one paragraph under "Imagery source and date" | `88cdd78f…3df8` |
| `style.css` | unchanged since round 1 | `0a03038d…16f4` |
| `phase1/night-lights-ui.test.cjs` | sections T, S, U, W; five more breaks | |
| `reviews/2026-11-15-night-lights-register-draft.md` | the REGISTER text, **not filed** | |

`app.js`, the hub and `phase1/night-lights.test.mjs` are unchanged. A release would make **fifteen** page files for the served-hash check (`nightlights.js` is the new one).

### 11.2 The release proposal's items, and what was done

| Item (proposal §4, §8.2) | Done as |
|---|---|
| §4.1 Sources & Details section; card link | Done. Section `#nightlights`: what is measured, both layers, how it reaches the page, the date rule on the displayed picture, no fallback after a failure, no data and the seasonal gap, the three states, the threshold label, our changes, credit and NASA's local-scale line. |
| §4.2 the status report says which picture is on the globe | **Done differently, and `app.js` is not changed.** The report and the imagery rule are shown only on the Sources page, which cannot know what another tab shows (GPT's detail 1). So the Sources page now describes both pictures and says so in one paragraph. On World View, every statement about the imagery already follows the picture: the line on the globe, the full line in the Key, the legend, and now the Sky view's label. |
| §4.3 5° and 10° boxes say they are coarser | Done: "drawn coarser than the layer's own detail: about 1.2 km a pixel" (5°), computed from the box and grid. |
| §4.4 REGISTER lines | Drafted, not filed: `reviews/2026-11-15-night-lights-register-draft.md`. |
| §4.5 / R3-1 Sky zoom-out view | The layer stays on in the view; the view's imagery label is rewritten whenever this layer puts its picture on the globe or takes it off, and whenever the view writes its own strip. Checked for: entering with the layer on; leaving; switching it off inside the view; switching it on inside the view (label unchanged while loading, changed when ready, without leaving); entering while it is loading. |
| R3-2 bounded waits | Every GIBS request (both keys, every picture) has one 20-second limit covering headers and body. Past it: "NASA GIBS did not answer within 20 seconds", the layer is unavailable and "Switch it on again to retry"; in the comparison "Press Compare to try again". A hang is never worded as "arriving" or "blocked", and no older date is tried after it. |
| R3-2 blank comparison frame | A date whose light picture comes back with nothing in it reads "No data for this date." under that date, and nothing more specific. |
| R3-3 NASA's guidance | In the REGISTER draft and proposal §8.3. |
| §4.6 served-hash count | Fifteen (above). |
| §4.7 suites; §4.8 keys | Below; keys in §11.1. |

**The 20-second limit is a choice, not a NASA figure.** Basis: the slowest single request seen was the 2048 × 1024 frame at 2.3 s; a whole switch-on took 4.1 to 5.6 s in the pane. GPT and Chad may prefer another number; it is one constant (`WAIT_MS`).

### 11.3 A fault found and fixed inside this round

The first version of the Sources section **widened the Sources page at 360 px from 367 px to 463 px**: the two NASA layer names did not wrap. The full regression run showed it (`smoke-fixes`, "Sources 360", a check that already fails on main at 367 px, so the pass count did not move; the number did). Fixed with break points after the underscores (`7457568`); the page is back to 367 px. A width check for the new section is in the page suite and fails against the unwrapped version. The 367 px on main is older than this branch; its cause is not established.

### 11.4 Results

| Suite | Result |
|---|---|
| `phase1/night-lights-ui.test.cjs` | **128 passed, 0 failed** at `7457568` |
| its 16 breaks (run at `74c7d64`, before the wrap fix; that fix changed `sources.html` and added one check) | each fails the suite: the five new ones are `no-sky-hook` 4 checks, `no-timeout` (stops the suite on a 30 s wait), `hang-as-arriving` 4, `blank-silent` 1, `coarse-silent` 1 |
| `phase1/night-lights.test.mjs` | 49 passed, 0 failed; its 8 breaks each fail |
| Full existing set at `74c7d64` | 33 suites pass, including `sky-zoom-ui` 351, `sky-ui` 79, `mobile-pass` 131, `desktop-overflow` 258, `legend-active-ui` 548, `backdrop-layer` 27 |
| Fail as on main | `osmc-reliability-ui` 40 of 41 (the known one); `smoke-fixes` 51 of 52 ("Sources 360", 367 px, as on main after the fix in §11.3) |
| Rerun at `7457568` after the wrap fix | `desktop-overflow` 258, `mobile-pass` 131, `backdrop-layer` 27, `smoke-fixes` 51 of 52 at 367 px |
| Not run | `oceanheat-ui` (its snapshot folder is not in this container) |

Narrow layout and keyboard (RL2): section Q at 390 px, the arrow-key readout in J, and the 360 px width check in W. No real phone, no Safari, no screen reader.

### 11.5 Live check at the site's own address (pane, 18:31 UTC, files hash-checked against `74c7d64`; `sources.html` hashed but not run)

| Check | Result |
|---|---|
| Layer on | 14 Nov chosen (15 Nov probe 49.5% missing; 14 Nov full frame 0.302%); ready in 4.1 s |
| Enter the Sky view with the layer on | The view's label read "Imagery: night lights 14 Nov 2026"; the globe carried the night picture |
| Switch off inside the view | Label "Imagery: 14 Nov 2026" (the true-colour picture, whose date that day was also 14 Nov); true-colour picture |
| Switch on inside the view | While loading: true-colour label and picture. When ready: night-lights label and picture, without leaving |
| Leave the view; switch off | World View showed and named night lights; off restored the true-colour line |
| Saipan and Tinian, 19 March and 20 April | 57%, 92%, 50%; Saipan 2,854.1 and 769.9, as recorded; 0.9 s |
| A 5° box about the same point | "480 × 480 pixels · drawn coarser than the layer's own detail: about 1.2 km a pixel"; 1.1 s; 432,729 bytes for the four pictures |
| A date after today | Refused with the range, no request |
| Today's date (15 Nov) for that box | "15 Nov 2026 (UTC) No data for this date."; 0% readable on it; 0% usable on both |

Not seen live: a request that hangs or fails, a blocked read, a probe and a full frame disagreeing. Those are from the suites only.

### 11.6 Open, for GPT and Chad

- The threshold label still reads "Chosen for this preview; not a NASA standard" on a page that would be released. The wording is the one agreed for the preview; whether "preview" stays is a wording decision.
- "No complete night frame yet …" carries no retry sentence (it is not a failure); nor does the blocked-read message (a retry would not help).
- The Sources page's menu line of section links does not list Night lights; the card links to the section.
- Everything in §7 that this round did not close: a real phone, Safari, a screen reader; moonlit frames; when a UTC date finishes filling.

### 11.7 For GPT's local preview and Chad's look

Mac: `~/Documents/Mother Earth/_review/night-lights-rc/` (branch head with this packet). Acceptance case as §8. For Chad's look, Claude can open this candidate in the app's browser pane at the site's own address, as in §11.5.

### 11.8 Lines still needed from Chad (none given)

- `Approve: file the two GIBS Night lights layer lines in REGISTER (draft reviews/2026-11-15-night-lights-register-draft.md rev 1)`
- `Approve: merge night-lights-rc at <reviewed head> to main (page change: Night lights layer and two-night comparison)`

## 12. Round 4 — GPT's round 3 (relayed by Chad, 16 Nov)

GPT held round 3 at `7457568` for one bug, asked for two changes to the REGISTER draft, and answered the wording question. **Not merged. REGISTER not filed. Nothing deployed.**

### 12.1 The bug, as GPT reported it

When NASA's light key timed out, `runCompare` cleared the busy mark, then asked for the same key again before showing the failure. A second Compare started during that wait was written over: the first one erased its loading message and showed its own failure while the second was still running. GPT reproduced it; Claude did not reproduce it separately before fixing, and the new break below shows the same behaviour in the suite.

### 12.2 The fix (`nightlights.js`)

- `frame()` returns the key it decoded with (`key`) in every result that loaded.
- `runCompare` takes the legend key from a frame that loaded. It makes no request and waits for nothing after `compare()` returns. A failure is shown as it came back. The busy mark is cleared after the result is on the page.
- A Compare that has been overtaken still returns before writing anything, as before. With no wait after that test, it cannot write later.
- `setOn` takes the legend key from the frame it drew, the same way. (That path asked for a key that was already loaded, so it did not wait; changed so that no code asks for the key twice.)

### 12.3 The test GPT asked for: section K2, four checks, and break `cmp-key-refetch`

The key request hangs; the wait limit is 0.7 s. Compare is pressed; the page is read at 1.0 s.

1. The failure is on the page, the busy mark is clear, the loading message is gone, the key was asked for **once**, and no picture was asked for.
2. Compare is pressed again with the key answering and the pictures held. 1.2 s later (past the time a second key request by the first Compare would have ended) the second Compare still shows its own loading message and busy mark, and no result is drawn.
3. The pictures are released: the second Compare ends with its own shares.
4. No page errors.

Break `cmp-key-refetch` puts the old lines back: checks 1 and 2 fail, and the suite then stops at check 3 because the second Compare never shows its shares. Break `stale-kept` also fails check 2.
**Not separately tested:** the order "result on the page, then busy mark cleared" has no wait between the two steps, so no check can tell it from the reverse order. It is in the code as GPT asked.

### 12.4 Wording (GPT's answer to §11.6)

The threshold line on the card's result and in Sources & Details now reads: **"Mother Earth uses a clear-sky confidence threshold of 0.95 for this comparison, on both nights; not a NASA standard."** The words "on both nights" and "not a NASA standard" are kept from the old line; GPT's sentence did not include them. The word "preview" is gone from the page. The 20-second limit is unchanged and is still Claude's number.

### 12.5 REGISTER draft, rev 2 (not filed)

- Request counts are split: the code's maximum for one switch-on (four dates, so at most four 512 × 256 frames and four 2048 × 1024 frames) and what was observed on 15 Nov (one or two 512 × 256 frames and one 2048 × 1024 frame).
- "far below that definition" is removed. The line now says the use is interactive and that the site's total traffic to GIBS was not measured.
- "our preview threshold" is now "our threshold".

### 12.6 Files at the code head `88979a2`

| File | Change this round | sha256 |
|---|---|---|
| `nightlights.js` | §12.2; the threshold line | `c69703f58bba430bf4bcda6c35d307e1ee36f106f0c41c0cf666be93dfa7f3fc` |
| `sources.html` | the threshold line | `2bff4383613d911d3a68577f56cfb6ae3bae6d6a91404e389c32d52a0977933a` |
| `phase1/night-lights-ui.test.cjs` | section K2, break `cmp-key-refetch`, the new wording | `b3e8a6962455b84e58aeba501ec5d7210715fa573c193eb9d37367c389306eca` |
| `phase1/night-lights.test.mjs` | the new wording | `4b7aad7d90eb2c267b94b7b426ad59de0cf79b066d628ea7449093d1bee0f2f6` |
| `index.html`, `skyscene.js`, `style.css` | unchanged since round 3 | `cc89f5b7…8ba6`, `18e41b2d…89e5`, `0a03038d…16f4` |

`index.html` still loads `nightlights.js?v=202612101000`. That key has never been served from main, so it was not changed.

### 12.7 Results (container, 16 Nov)

| Suite | Result |
|---|---|
| `night-lights-ui.test.cjs` | **132 passed, 0 failed** (128 + 4) |
| its 17 breaks | each fails the suite |
| `night-lights.test.mjs` | **49 passed, 0 failed** (its 8 breaks were not rerun; the only change to that suite is the wording pattern) |
| `smoke-fixes.test.cjs` | 51 passed, 1 failed: "Sources 360", as on main and in round 3 |
| `sky-zoom-ui.test.cjs` | 351 passed, 0 failed |
| the other existing suites | **not rerun** this round; `skyscene.js`, `index.html`, `style.css` and `app.js` are unchanged since round 3 |

**No live check this round.** The live check in §11.5 was made on `74c7d64`. The fix is in a failure path that was only ever seen in the suites.

### 12.8 Lines still needed from Chad (none given)

- `Approve: file the two GIBS Night lights layer lines in REGISTER (draft reviews/2026-11-15-night-lights-register-draft.md rev 2)`
- `Approve: merge night-lights-rc at <reviewed head> to main (page change: Night lights layer and two-night comparison)`
