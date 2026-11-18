# bare-search-rc — search reaches switched-off layers; phone first-view line below the globe — review packet

**Rev 1, 18 Nov 2026 02:00 UTC (clock reading). Branch only: nothing merged or deployed.**
Branch `bare-search-rc`, built on `bare-earth-rc`. It carries the whole Bare Earth stage A release: merging this one branch ships both. The head is in the message that accompanies this packet. Earlier packet: `reviews/2026-11-17-bare-earth-rc.md` (rev 1, head `fcd61ee`).

## 1. What was asked
GPT, review of `bare-earth-rc fcd61ee`, relayed by Chad on 18 Nov 2026:
- Keep the mirrored, non-modal panel and keep the switches on the reading cards.
- First view: at phone widths move the line below the globe and use the existing Layers button as the single way in.
- Search: build it on the next small branch and ship it with Bare Earth. On a fresh visit a valid query finds eligible results from hidden layers; choosing a result switches its layer on and says so; freshness, coverage and withholding checks stay.
- `serve-core-on.py` and `coreOn()` are acceptable; the Bare Earth suite keeps exercising the real default.

## 2. What changed since `fcd61ee`
**Commit `f412d88` (on `bare-earth-rc`): phone first-view line.**
- `style.css`, up to 720 px: `#bare-hint` sits at the bottom of the globe box, below the sphere, in the strip the persistent notes use once layers are on (the line shows only while nothing is on, so the two are never shown together). Its own "Layers" button is not displayed there; the Layers button under the Key button is the single way in. Above 720 px nothing changed.
- `bare-earth-ui`: on phones the line must lie in the lowest 18% of the globe box (the sphere spans about 59% of the box height at the phone camera distance) and have no button; the panel is opened from the Layers button. New break `phone-hint`.

**Commit `9cce0f0` (`bare-search-rc`): search.**
- `index.html` `searchPools()`: the `on[l]` condition is removed. A record layer is searched when its records are usable (paired with their counts) and its freshness is not unknown, whether or not it is drawn. The core layers are fetched at load whatever the switches say, so their records are already in the browser; nothing extra is fetched for a search.
- `liveness()`: "layer hidden" is no longer a reason to refuse a result. The other three reasons are unchanged: freshness unknown, records withheld by the pairing rule, run replaced.
- A result row from a layer that is off carries one extra line: "layer off — choosing this switches Earthquakes on" (accent colour, not the warning colour). It is recomputed whenever a switch changes.
- Choosing such a row clicks the layer's own switch (`#tgl-<layer>`), so state, card, Layers panel, Layers count and Key change through the one existing path; then the view moves and the record opens as before. The status line reads "Switched Earthquakes on to show this result. The record is open."
- Searching alone switches nothing on. "Go to" for a coordinate moves the view and switches nothing on.
- The notes no longer list a layer as "not searched — layer hidden". Unknown and withheld layers are still listed with their reason, and fire detections and forest still say they publish no text.
- Wording updated to match in the Explore scope text (`index.html`) and the Sources method text (`app.js`).
- `app.js?v=` and `style.css?v=` bumped on the five pages.

Optional record layers (drifting buoys, microplastic samples) are not in the search and were not before; they are fetched only while on. Unchanged.

## 3. Checks run (Linux container, Playwright Chromium)
- `phase1/search-ui.test.cjs`: **117 passed.** Section 5 rewritten (a layer switched off after a search: rows stay usable, say the layer is off, choosing one switches it on through its switch, moves the view once, opens the record, says so). New section 5b on `index.html` as it is on disk (bare): text query finds the earthquake with its layer off; notes do not say "layer hidden"; searching switches nothing on and draws nothing; choosing switches on Earthquakes and nothing else, Layers reads 1 on, the first-view line goes; coordinate query lists hidden-layer records; "Go to" switches nothing on.
- Breaks (bare sections): `pools-on` (old filter back) stops the suite at the first bare search; `no-switch` 5 failed; `search-switches` (searching switches layers on) 7 failed; `no-off-note` 2 failed.
- `phase1/search.test.mjs`: 111 passed (pure functions, unchanged).
- `phase1/bare-earth-ui.test.cjs`: **128 passed**; `phone-hint` break 2 failed.
- All 41 browser page suites on the branch: results in §5.
- **On live data** (branch page at `9cce0f0` in a clean github.io tab in the Mac's pane, 01:34 UTC 18 Nov; `index.html` `e074e579`, `style.css` `c7e147ef`, `app.js` `87a302db`, `layers.js` `1e65fe5d` checked): at load "Layers · none on", four core switches off. Search "km": "47 matches in 2,886 loaded records · searched: earthquakes, ships"; first row ends "layer off — choosing this switches Earthquakes on"; switches still all off. Choosing it: Earthquakes on only, "Switched Earthquakes on to show this result. The record is open.", "Layers · 1 on", record open. Pane width 588 px (phone layout): the line sits below the sphere at y 409–440 in a globe box of y 94–449.

## 4. Not done / open
- Real phone and screen reader: untested.
- "Key · 0 layers" wording unchanged.
- Fire detections were "unknown" on the live hub at 01:34 UTC ("Today's detections aren't available yet"), so they were not in the live search; that is the existing rule.

## 5. Full suite run
See the accompanying message for the counts (run finished after this packet was written; STATUS on main carries them).

## 6. Questions
1. Is the row wording right: "layer off — choosing this switches Earthquakes on", and the status "Switched Earthquakes on to show this result. The record is open."?
2. After a layer is switched off again, its open results stay usable and say "layer off" (they used to be refused). Agreed?
