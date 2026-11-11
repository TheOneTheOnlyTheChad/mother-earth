# Fires card wording for the daily FIRMS reset — candidate (branch `fires-wording-rc`)

11 Nov 2026. Branch only, on Chad's go. Not merged; no hub, R2 or D1 change. Tests run 17:24–17:34 UTC (workspace clock).

## 1. What changes
- **One file: `index.html`** (two edits, 8 lines added, 1 replaced). `app.js`, `sources.html`, `style.css` and `worker.js` are unchanged, so no `?v=` bump.
- When the hub's fires status is `down` **and** its note starts `no detections processed yet for today (UTC)` (the header-only file early in the UTC day, `collectFirms` in `worker.js`), the Fires card's source line ends with **"Today’s detections aren’t available yet."** instead of "collector reported down: no detections processed yet for today (UTC): FIRMS day_range=1 resets … (header only, 122 bytes)". The state word's tooltip carries the same sentence.
- **Unchanged in that state:** state word UNKNOWN, count "–", the "Records withheld: …" line, nothing drawn on the globe.
- **Every other down note keeps the existing wording** ("collector reported down: <note>"): malformed or truncated rows, the resource guard, a fetch failure, an empty file later in the day ("empty response (header only, …) … not a validated zero"), a down run with no note, and "no snapshot from the hub".

## 2. Scope kept to the card
`ME.freshness('firms')` is untouched, so these still show the hub's full reason: the summary report, the cell inspector's Collector row, search notes, and Sources & Details. Changing those would be a separate decision.

## 3. Tests
New suite `phase1/fires-wording-ui.test.cjs` — **35 passed, 0 failed**. The down notes are read from `worker.js` itself, so the page's pattern is tied to what the hub publishes.
- **A, header-only:** new sentence on the card and tooltip; no "collector reported down", day_range, NRT or byte count on the card; UNKNOWN; "–"; records withheld and said so; no fire record drawn; `ME.freshness` and the report unchanged; the earthquake card untouched.
- **B1–B5, genuine failures:** malformed row, resource guard, fetch failure, empty file later in the day, down with no note — each keeps the existing wording, the new sentence absent, UNKNOWN, "–", records withheld.
- **C:** no snapshot from the hub → existing wording.
- **D:** the day's first rows arrive → current, count shown, sentence gone.
- **E:** inside one open page through the page's own scheduled refresh: ok → header-only → ok (the tooltip does not stick).

**Breaks (each must fail):**

| Break | What it does | Result |
|---|---|---|
| `match-all` | every down run gets the new sentence | 10 failed |
| `never-match` | the change removed (main's behaviour) | 4 failed |
| `loose-prefix` | pattern loosened to "header only" | 2 failed (the later-in-the-day empty file) |

**Regression on the branch, all green:** kp-degraded 29, smoke-fixes 52, kept-ui 21, ux-round1 34, search-ui 104, place-ui 30, backdrop-layer 27, cell-perf-ui 43, desktop-overflow 112, mobile-pass 131, drifters-ui 25, plastic-ui 29, terminator-ui (exit 0). Not rerun: hub-only suites (no hub change), sky, sky-zoom, oceanheat, arts, timeline and orbital-browser suites.

## 4. Not checked
- The live page: the header-only state only occurs from 00:00 UTC until FIRMS processes the day's first passes (first rows 02:16–04:15 UTC over 4–9 Nov), so the real state can first be seen after a merge, on the next morning.
- A real phone.

## 5. For review
1. The state tooltip is changed along with the card line (it sits on the card). Say if it should keep the full hub reason.
2. In this state the card still shows "Records withheld: records are from the HH:MM run and the counts are from HH:MM — not combined" under the new sentence. Left as is.
3. The page matches the hub's note by its opening words. If that sentence in `worker.js` is ever reworded, the card falls back to the existing "collector reported down" wording, and the suite's first checks fail.

Merge line when wanted: `Approve: merge fires-wording-rc to main (page change: Fires card wording for the daily FIRMS reset)`.
