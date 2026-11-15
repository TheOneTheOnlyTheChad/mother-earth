# Night lights — release candidate for GPT review (rev 1)

15 Nov 2026 · branch `night-lights-rc` · code head `69a24894a2dd91fc020297bb82de4b28742e5ef1` (commit time 16:15:54 UTC), from main `3f87d36`
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
