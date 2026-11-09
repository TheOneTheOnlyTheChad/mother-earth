# Timeline candidate `timeline-rc` — review packet for GPT — **rev 2 (9 Nov 2026, 16:01 UTC clock reading)**

## Rev 2 — GPT's two smoke findings fixed, phone header reworked (read this first)
**Candidate: branch `timeline-rc` @ `c3498bc`** (fix commit `9949177` + asset-version bump `c3498bc`). The packet below is rev 1 (`31fab7d`), kept for the record; where they differ, rev 2 governs. Production unchanged. R2 (non-public preview) and the release approval stay separate.

**1. Switching title/shortcut while the entry is open (GPT finding 1).** At 1280 px, title → (Julian) used to push a second history entry, so one Back only collapsed the conversion. Now a title or shortcut used while the entry is open **updates the open history entry** (`replaceState`, same key, same direct flag); no entry is added. Rule for focus: Close, Esc or Back returns focus to **the most recently used card control**. After a direct link with no card control used, focus still goes to the card title.
- New tests (1280 and 900 px; title→(Julian), (Julian)→⚑, ⚑→title, title→⚑; each via Back and via Close): history length unchanged by the switch; state and expander updated; **one Back closes the panel** and focus lands on the last-used control; **Forward** reopens with the last expander and focuses the heading; Close after Forward → focus on the last-used control, fragment cleared; the next Back leaves for the real previous page (index.html).
- **Direct link then a shortcut** ((Julian)/⚑; Close, Esc, Back): no new entry; state stays direct with the new expander; Close/Esc clears the fragment and focuses that shortcut; Back returns to the previous page.
- New break `switch-pushes` (the old push behaviour) → **102 fail**.

**2. Timeline CSS leaking into Readings (GPT finding 2).** Confirmed before the fix: `#card-usgs` = `12px 14px` with the strong border on the branch vs `8px 10px` / `rgba(140,170,200,.16)` on main. **Every Timeline rule is now scoped under `body.tl`** (cards, entry, expanders, panel/sheet). New test: on index.html `#card-usgs` keeps `8px 10px` and its own border, and no globe card picks up the Timeline style. New break `unscoped-card` → **2 fail**.

**3. Phone header (390 × 844 overlay check).** Rebuilt as a fixed two-row grid: title · clock · Menu, then the two tabs. Rows 44 + 44 px (all touch targets 44 px), 2 px row gap, 2 px top/bottom padding → **header 94 px** (rev 1: 104 px; main without tabs: 56 px).
- **Found on the way:** in rev 1 the wrapping row split into three lines at 390 px with fallback fonts and pushed the title 7 px above the header. The grid fixes it: title, Menu and tabs all inside the header at 360/390/430.
- **Measured (mobile-pass harness, everything on, Readings open):**

| Viewport | main (no tabs) | rev 1 (104 px) | **rev 2 (94 px)** | target |
|---|---|---|---|---|
| 390 × 844 | 5.4% | 8.3% ✗ | **7.2% ✓** | ≤ 8% |
| 430 × 932 | — | 3.6% | **3.5%** | ≤ 8% |
| 360 × 780 | — | 12.3% | **11.9%** | report only |
| 360 × 640 | — | 26.8% | **24.6%** | report only |

  **mobile-pass 131/0.** The phone globe still has less room than on main (7.2% vs 5.4% at 390); that is the cost of the U1 tab row.

**4. Smaller changes:** expander buttons 40 → 44 px; the `shortcut-fragment` break's anchor was stale after the refactor (it had stopped with "break anchor missing" rather than testing) — fixed, now 38 fail; asset version `?v=202611181000` so a browser that loaded the first preview cannot reuse its cached CSS/JS. `timeline.js` 9,814 B (over the 8 KB target).

**Tests on `c3498bc`:** timeline-ui **578/0**; **11 breaks each fail** (switch-pushes 102 · unscoped-card 2 · no-focus-return 68 · close-keeps-fragment 10 · shortcut-fragment 38 · no-inert 3 · axis-79 2 · inline-passage 1 · script-only 15 then exit 2 · no-aria-current 1 · whole-card 1). **All 35 regression suites pass**, incl. desktop-overflow 112/0 and mobile-pass 131/0; `orbital.test.mjs` is a data probe needing a `gp.csv` (same on main).

### Rev 2 page-file hashes (`c3498bc`)
| File | sha256 | bytes | |
|---|---|---|---|
| `index.html` | `d826964ae3131e97ffae7862805bceb1b39666b70d6bdfe15a77b6531c30856b` | 110,786 | changed since rev 1 (`6a7cd23a…`) |
| `sources.html` | `8fbadc9048b3ee9f5c4486cde2ef1ed614be7b308e74df19e83f9fc90d7e585e` | 43,647 | changed since rev 1 (`13ba4176…`) |
| `timeline.html` | `27829c71bba69c5945fea18a66c0d23934697dd89b5fb12a933ab77b7e52e378` | 8,724 | changed since rev 1 (`75dba225…`) |
| `app.js` | `e3f4a38541132b289663945f74612db80e12d35f906a0ecc778d7a39b8391680` | 81,781 | same as rev 1 |
| `arts.js` | `58773cef35e6e947960100cedd59c8bff349a16333a89f3c4ae7abda5595928d` | 5,759 | same as rev 1 |
| `timeline.js` | `66b5e0320e835cfda4c4568703d2b44dfdb10b6130b8ec779e89eb20352eced6` | 9,814 | changed since rev 1 (`c0464935…`) |
| `style.css` | `20a8bce94adaeaed230ce14d32105682621fd87d272fd0a6a6f84122fdd86f47` | 34,470 | changed since rev 1 (`c6b6c71e…`) |

### Rev 2 header diff vs main (R3, actual)
```diff
diff --git a/index.html b/index.html
index 7ab5ba5..7b56282 100644
--- a/index.html
+++ b/index.html
@@ -6,17 +6,22 @@
 <title>Mother Earth</title>
 <meta name="description" content="See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.">
 <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
-<link rel="stylesheet" href="style.css?v=202611161000">
+<link rel="stylesheet" href="style.css?v=202611181000">
 </head>
 <body class="world">
 <header class="top">
   <h1>Mother Earth</h1>
   <div class="promise">See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.</div>
+  <nav class="tabs" aria-label="Views">
+    <a href="index.html" data-view="earth" aria-current="page">Earth now</a>
+    <a href="timeline.html" data-view="timeline">Timeline</a>
+  </nav>
   <div class="clock" id="clock">--:--:--<span>UTC</span></div>
   <nav class="menu" aria-label="Pages">
     <button id="menu-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-list">Menu</button>
     <ul id="menu-list" role="menu">
       <li role="none"><a role="menuitem" href="index.html" data-page="world">World View</a></li>
+      <li role="none"><a role="menuitem" href="timeline.html" data-page="timeline">Timeline</a></li>
       <li role="none"><a role="menuitem" href="sources.html" data-page="sources">Sources &amp; Details</a></li>
     </ul>
   </nav>
@@ -262,8 +267,8 @@
 </div>
 
 <script src="https://unpkg.com/globe.gl@2.45.0/dist/globe.gl.min.js"></script>
-<script src="app.js?v=202611161000"></script>
-<script src="arts.js?v=202611161000"></script>
+<script src="app.js?v=202611181000"></script>
+<script src="arts.js?v=202611181000"></script>
 <script>
 (() => {
 const { $, esc, ago, hhmm, when, state, LABEL, SOURCE, MAP_LAYERS, IMG_DAY, IMG_LABEL, IMG_LAYER, fmt, has, snapId, samePair, MISSING } = ME;
diff --git a/sources.html b/sources.html
index d93f820..5102791 100644
--- a/sources.html
+++ b/sources.html
@@ -6,17 +6,22 @@
 <title>Mother Earth — Sources &amp; Details</title>
 <meta name="description" content="Sources, attribution, what each layer measures, observation windows, coverage grades, comparison methods and limitations for Mother Earth.">
 <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
-<link rel="stylesheet" href="style.css?v=202611161000">
+<link rel="stylesheet" href="style.css?v=202611181000">
 </head>
 <body class="doc">
 <header class="top">
   <h1>Mother Earth</h1>
   <div class="promise">Sources &amp; Details</div>
+  <nav class="tabs" aria-label="Views">
+    <a href="index.html" data-view="earth">Earth now</a>
+    <a href="timeline.html" data-view="timeline">Timeline</a>
+  </nav>
   <div class="clock" id="clock">--:--:--<span>UTC</span></div>
   <nav class="menu" aria-label="Pages">
     <button id="menu-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-list">Menu</button>
     <ul id="menu-list" role="menu">
       <li role="none"><a role="menuitem" href="index.html" data-page="world">World View</a></li>
+      <li role="none"><a role="menuitem" href="timeline.html" data-page="timeline">Timeline</a></li>
       <li role="none"><a role="menuitem" href="sources.html" data-page="sources">Sources &amp; Details</a></li>
     </ul>
   </nav>
@@ -169,7 +174,7 @@
 
   <p class="back"><a href="index.html">← Back to World View</a></p>
 </main>
-<script src="app.js?v=202611161000"></script>
+<script src="app.js?v=202611181000"></script>
 <script>
 (() => {
 const { $, esc, ago, hhmm, state, LABEL, LAYERS, SOURCE, TIER } = ME;
```
The header CSS (tabs; 721–1200 px spacing; the phone grid) is the first block of the `style.css` diff: `git diff origin/main..c3498bc -- style.css`.

### Where to smoke test rev 2
The shared copy `~/Documents/Mother Earth/_review/timeline-rc/` now holds **`c3498bc`** with a new `SHA256SUMS` (rev 1's copy is kept at `_review/timeline-rc-31fab7d/`). Chad restarts the server from that folder (Ctrl+C, then the same command):
`cd ~/Documents/"Mother Earth"/_review/timeline-rc && python3 -m http.server 8899 --bind 127.0.0.1` → `http://127.0.0.1:8899/timeline.html`. A hard reload is still wise.
**Suggested re-checks:** finding 1's sequence (title → (Julian) → Back / Close / Forward, and `timeline.html#e-pliny-ep-6-16` → shortcut → Close / Back); `#card-usgs` on index at 1280; the phone header at 360/390/430 and the 390 × 844 overlay case; plus the rev 1 checklist (§7) for anything not yet covered.

---

## Rev 1 (31fab7d, kept for the record)

**Written 15:19 UTC (clock reading).** Branch `timeline-rc` on GitHub; **candidate = the commit that adds this file** (`git log -1 -- reviews/2026-11-09-timeline-rc.md` on the branch; the sha is in STATUS on main). Built on Chad's Approve line A (9 Nov): *"Timeline entry build per TIMELINE-ENTRY-BUILD-PROPOSAL rev 2 — T1 page-only, T2 English only, T3 omit, T4 four entities only; build timeline-rc on a branch only — no merge, no nav change on main, no hub, R2 or D1 change."*
**Not merged, not served, no hub/R2/D1 change. Production unchanged** (hub 0.6.2, page `6d5ca55`).
Spec: `docs/concepts/TIMELINE-ENTRY-BUILD-PROPOSAL.md` rev 2 (on main). This packet is GPT's R4 review; R1 (EGU licence) and R2 (non-public preview by Claude, Chad present) are still to do; R3 (header diff) is §5 below.

## 1. What is on the branch
| File | What |
|---|---|
| `timeline.html` (new) | Timeline page; the entry **pre-rendered** between `<!-- TIMELINE:BEGIN/END -->` (works with JavaScript off) |
| `timeline.js` (new, 9,021 B) | enhancement only: panel (> 720 px, non-modal) / sheet (≤ 720 px, modal), shortcuts, expanders, history and focus. No fetch. **Over the proposal's < 8 KB target** (not trimmed) |
| `style.css` | appended Timeline + tab rules; one rule for 721–1200 px tightens header gaps (§4 finding 1) |
| `index.html`, `sources.html` | **header tabs Earth now · Timeline** + a Timeline item in Menu; asset `?v=202611171000` |
| `phase1/timeline/entry-pliny-ep-6-16.json` | the entry as data: every field with its basis; Wikidata IDs; source pin and fragment check |
| `phase1/timeline/build_timeline.py` | generator; `--check` (and `--check --page <file>`) |
| `phase1/timeline-ui.test.cjs` | 426 checks; `BREAK=` nine breaks |
| `REGISTER.md` | two rows: Latin Library (linked only), EGU21-16222 (**licence as reported by OpenAlex; publisher not verified — R1**) |

## 2. New evidence gathered during the build (Claude, browser pane, read-only)
- **Wikidata (T4), 14:47:26–14:47:28 UTC**, `wbsearchentities`, one request at a time, agreed User-Agent:
  - Misenum → **Q19900818** "harbour city in Italy in Roman period" (not chosen: Q401231 Miseno (modern frazione), Q1765171 titular see, Q929659 Cape Miseno);
  - Mount Vesuvius → **Q524**;
  - Pliny the Younger → **Q168707**;
  - *Letters* → **Q2099521** "Epistulae by Pliny the Younger".
  All four resolved by exact label + description; none unresolved. Matching judgement is Claude's.
- **Latin Library fragment check, 14:47:44 UTC:** `pliny.ep6.html` HTTP 200, 58,933 B, **sha256 `b59e819a…e281` = the Test B copy**; **0 elements with an id or name** → no working fragment → the link opens the page and says it does not jump to the letter. (The fetched page text stayed in the workspace tool output; nothing from it is in the repo.)

## 3. Tests (container, Playwright Chromium, local static server; hub/fonts/unpkg/GIBS aborted unless noted)
**`timeline-ui` 426/0.** Covers: JS-off content (link, Letter 6.16 and §§4–5, 22, date, full hash, "identifies the copy we checked … live page can change", conversion with 1 September as day one, authors + DOI, licence wording, no inline Latin); tabs + `aria-current` on all three pages; **title, (Julian) and ⚑ Date debated × 1280/900/390 × Close/Esc/Back**: one fragment, expander in history state, focus on the detail heading, focus back on the **exact opener**, fragment cleared, **Forward** reopens with the stored expander and a later close still returns focus to the opener; phone sheet `aria-modal`, background `inert`, scroll lock, Tab/Shift+Tab trapped, handle closes by keyboard; direct link (focus on heading; Close clears fragment → card title; card hidden → page heading; `#…-debate` folds into the one fragment); **Back with a real prior history entry** (index.html → timeline.html#… → Back = index.html; card-opened: first Back closes, second leaves); no axis placement and no "79" outside the attributed note; attribution wording; only same-site requests; globe page requests nothing from the Timeline; no page overflow at 360–1280 closed and open; panel and card side by side > 720 px; sheet full height ≤ 720 px; tablet panel width = min(420 px, 50vw); generator check + hand-edited copy fails; accessibility tree (names, roles, states only).
**Breaks, each fails:** no-focus-return (38 fail) · close-keeps-fragment (4) · shortcut-fragment (18) · no-inert (3) · axis-79 (2) · inline-passage (1) · script-only (15, then the run stops, exit 2) · no-aria-current (1) · whole-card (1).
**Regressions on the branch** (all 36 suites): every suite passes **except**:
- **mobile-pass 130/1** — see §4 finding 2 (real, not loosened);
- `orbital.test.mjs` not run: needs a `gp.csv` argument (same on main; it is a data probe, not a regression suite).
desktop-overflow **112/0** after finding 1; arts-ui 90, backdrop-layer 27, drifters-ui 25, kept-ui 21, timeline-ui 426 re-run after that CSS change, all pass.

## 4. Findings for review
1. **Fixed:** with fallback fonts (Google Fonts blocked) at 1101 px the tabs pushed the globe page's promise onto a third line (clipped). A 721–1200 px rule tightens header gaps and tab padding; desktop-overflow 112/0 (real and fallback fonts, 1101–1920).
2. **OPEN — phone globe space (decision for Chad, after GPT):** on phones the tabs are a second header row (U1), so the header grows **56 → 104 px**. mobile-pass "everything on, Readings open, covers ≤ 8% of the disc" at **390 × 844: 8.3% on the branch vs 5.4% on main** (measured both, same harness). Other sizes, branch: 360×640 26.8% · 360×780 12.3% (both report-only, as on main) · 430×932 3.6%. Options: (a) accept and record 8.3% (the test target is Chad's, 4 Nov); (b) a slimmer tab row on phones (e.g. 32 px, below the 44 px touch target); (c) on the globe page only, reach the Timeline from Menu on phones and keep the tabs on desktop/tablet (departs from U1). **Not changed in this candidate.**
3. Fixed during the build: a `.sheet` class clash with the globe page's readings sheet (renamed `tlsheet`/`tlpanel`); direct-link focus lost to the browser's own fragment handling (focus re-applied after load); a fragment followed while already on the page was ignored (now handled).
4. Shortcuts are **links** (they work without script, landing on the plain section), not buttons as the UX doc's wording had it; with script they open the entry with that expander. Named "24 August (Julian): how we converted" and "Date debated: see the scholarly note".
5. `timeline.js` is 9.0 KB (target < 8 KB).

## 5. Header diff vs main (R3, actual)
```diff
diff --git a/index.html b/index.html
index 7ab5ba5..4af348e 100644
--- a/index.html
+++ b/index.html
@@ -6,17 +6,22 @@
 <title>Mother Earth</title>
 <meta name="description" content="See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.">
 <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
-<link rel="stylesheet" href="style.css?v=202611161000">
+<link rel="stylesheet" href="style.css?v=202611171000">
 </head>
 <body class="world">
 <header class="top">
   <h1>Mother Earth</h1>
   <div class="promise">See what was observed, what differs from its own comparison period, and what remains unknown — including unknown coverage.</div>
+  <nav class="tabs" aria-label="Views">
+    <a href="index.html" data-view="earth" aria-current="page">Earth now</a>
+    <a href="timeline.html" data-view="timeline">Timeline</a>
+  </nav>
   <div class="clock" id="clock">--:--:--<span>UTC</span></div>
   <nav class="menu" aria-label="Pages">
     <button id="menu-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-list">Menu</button>
     <ul id="menu-list" role="menu">
       <li role="none"><a role="menuitem" href="index.html" data-page="world">World View</a></li>
+      <li role="none"><a role="menuitem" href="timeline.html" data-page="timeline">Timeline</a></li>
       <li role="none"><a role="menuitem" href="sources.html" data-page="sources">Sources &amp; Details</a></li>
     </ul>
   </nav>
@@ -262,8 +267,8 @@
 </div>
 
 <script src="https://unpkg.com/globe.gl@2.45.0/dist/globe.gl.min.js"></script>
-<script src="app.js?v=202611161000"></script>
-<script src="arts.js?v=202611161000"></script>
+<script src="app.js?v=202611171000"></script>
+<script src="arts.js?v=202611171000"></script>
 <script>
 (() => {
 const { $, esc, ago, hhmm, when, state, LABEL, SOURCE, MAP_LAYERS, IMG_DAY, IMG_LABEL, IMG_LAYER, fmt, has, snapId, samePair, MISSING } = ME;
diff --git a/sources.html b/sources.html
index d93f820..0335dc1 100644
--- a/sources.html
+++ b/sources.html
@@ -6,17 +6,22 @@
 <title>Mother Earth — Sources &amp; Details</title>
 <meta name="description" content="Sources, attribution, what each layer measures, observation windows, coverage grades, comparison methods and limitations for Mother Earth.">
 <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
-<link rel="stylesheet" href="style.css?v=202611161000">
+<link rel="stylesheet" href="style.css?v=202611171000">
 </head>
 <body class="doc">
 <header class="top">
   <h1>Mother Earth</h1>
   <div class="promise">Sources &amp; Details</div>
+  <nav class="tabs" aria-label="Views">
+    <a href="index.html" data-view="earth">Earth now</a>
+    <a href="timeline.html" data-view="timeline">Timeline</a>
+  </nav>
   <div class="clock" id="clock">--:--:--<span>UTC</span></div>
   <nav class="menu" aria-label="Pages">
     <button id="menu-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-list">Menu</button>
     <ul id="menu-list" role="menu">
       <li role="none"><a role="menuitem" href="index.html" data-page="world">World View</a></li>
+      <li role="none"><a role="menuitem" href="timeline.html" data-page="timeline">Timeline</a></li>
       <li role="none"><a role="menuitem" href="sources.html" data-page="sources">Sources &amp; Details</a></li>
     </ul>
   </nav>
@@ -169,7 +174,7 @@
 
   <p class="back"><a href="index.html">← Back to World View</a></p>
 </main>
-<script src="app.js?v=202611161000"></script>
+<script src="app.js?v=202611171000"></script>
 <script>
 (() => {
 const { $, esc, ago, hhmm, state, LABEL, LAYERS, SOURCE, TIER } = ME;
```

## 6. Page-file hashes (candidate)
| File | sha256 | bytes | |
|---|---|---|---|
| `index.html` | `6a7cd23a15a41ac7c6a711192927d2995c0a7f41391da87210634dbddf051646` | 110,786 | changed |
| `sources.html` | `13ba41766a21732599e1678db77acc18370ec505dec096e2422d7791fcd2ebfe` | 43,647 | changed |
| `timeline.html` | `75dba2250538d3446402a4baa71cc939328bc69d107ca36b1076bfd5d54aeaf4` | 8,724 | new |
| `app.js` | `e3f4a38541132b289663945f74612db80e12d35f906a0ecc778d7a39b8391680` | 81,781 | unchanged |
| `arts.js` | `58773cef35e6e947960100cedd59c8bff349a16333a89f3c4ae7abda5595928d` | 5,759 | unchanged |
| `timeline.js` | `c0464935d6bc7b8828c8a4d1998a4d2c87eda6fbbcc5d5eb5bfffa33c177b977` | 9,021 | new |
| `style.css` | `c6b6c71e416b2a3912b9d501229d4a61b8354a47d24533b4aaf3b6ceed8ca299` | 33,497 | changed |

## 7. Where GPT can smoke test
**A. A copy in the shared Mac folder (simplest):** `~/Documents/Mother Earth/_review/timeline-rc/` holds the branch's page files at this candidate plus `SHA256SUMS` (same values as §6). From that folder run `python3 -m http.server 8899`, then open `http://127.0.0.1:8899/timeline.html` (and `index.html`, `sources.html` for the tabs). Serve it rather than opening `file://`, so history and fragments behave as on the site. The globe page there will show live data only if your environment reaches the hub; the Timeline needs nothing external.
**B. Your own checkout:** `git fetch origin timeline-rc` (or clone the branch), check the hashes in §6, serve the repo root as above. Tests: `node phase1/timeline-ui.test.cjs` (Playwright; `BREAK=<name>` for the breaks); `python3 phase1/timeline/build_timeline.py --check`; `node phase1/desktop-overflow.test.cjs` and `node phase1/mobile-pass.test.cjs` need the `@fontsource` faces in `/home/claude/spike` (START-HERE §4) or will report fallback-font results.
**C. Not for this review:** the public site does not have it; the non-public preview against the live hub (R2) is Claude's pre-release step with Chad.

**Suggested smoke checks** (the ones tests cannot settle):
1. Read the open entry top to bottom at 1280 and 390: does every line say whose it is (Pliny's statement, our conversion, our model, our present-day reference, a gap, the attributed note)?
2. The source link wording: Book 6 page, Letter 6.16 and §§4–5, 22, "does not jump", checked date and hash, "live page can change". Open the link: does it land on the Book 6 page?
3. Title, (Julian), ⚑ Date debated: open, then close each way (✕, Esc, Back) — does focus land where you started? Then Forward.
4. Paste `timeline.html#e-pliny-ep-6-16` into a fresh tab after another page: open on arrival, ✕ clears the address, Back leaves.
5. Phone width (390): sheet covers the page, background not reachable by Tab, handle closes it.
6. Tablet widths (721, 900, 1100): panel beside the shelf, nothing clipped.
7. JavaScript off: everything still readable, links work.
8. Header tabs on index and sources at 360/390/1101/1280; finding 2 at 390.
9. Anything that reads as a claim the evidence does not support.

**Not approved:** merge, page release, navigation change on the public site, R1 filing (Chad's paste), any production action.
