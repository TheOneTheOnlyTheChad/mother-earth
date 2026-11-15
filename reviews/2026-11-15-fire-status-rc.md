# fire-status-rc — review packet (round 1)

15 Nov 2026 · branch `fire-status-rc` from main `2b6400d` · page only · not merged · for GPT
Brief: `docs/concepts/CONTROL-CENTRE-USABILITY-BRIEF.md` rev 1.1. Chad's go: "Go: build fire-status-rc on a branch with A1–A5 and GPT's three clarifications. Use the FIRMS-only Place fix and include the production lines/1 cases. Keep legend, freshness badges, layout and Sun picture cleanup for their own passes. Page only, no merge. Bring the candidate back for GPT review."

## 1. What changed

| File | Change |
|---|---|
| `app.js` | New `ME.downWhy(layer, s)` with the daily-reset pattern and sentence (moved from `index.html`). `ME.freshness` uses it for a down layer. `ME.placeRows` reads a fires section whose `source_status` is `down` as "unknown — <reason>". |
| `index.html` | The "Records withheld" line for fires is gated on `cardCount.firms`, the value the card just rendered; a hidden line is emptied. "Highest FRP" with zero records says there are no detections. The card takes its sentence from `app.js`. `app.js?v=202611301000`. |
| `sources.html` | `app.js?v=202611301000` only. |
| `phase1/fire-status-ui.test.cjs` | New suite (below). |
| `phase1/fires-wording-ui.test.cjs` | Three assertions and the three breaks updated from the 11 Nov card-only scope to the new one. |

No hub file, schedule, REGISTER entry or new request. `style.css` unchanged.

## 2. How each item is met

- **A1.** `pairNote('firms')` hides the line when `cardCount.firms === null`. `cardCount.firms` is set in `cards()` on the same statement that writes the count, so the line and the count cannot disagree. Other layers are untouched.
- **A2.** FIRMS only. The rule reads the place section's own `source_status` and `note`. A mismatch with a valid count still reads "withheld —".
- **A3.** One sentence, "Today's detections aren't available yet", on the card, tooltip, Find, search note, page report, place row and the Sources page. A failed fetch reads "collector reported down: <note>" on all of them.
- **A4.** Find with zero records: "No fire detections in this snapshot, so there is no highest FRP. Not "no fires": satellite passes, cloud and processing decide what can be detected."
- **A5.** One table; each row's signature (state, count, line, reason) is asserted distinct.
- **Clarification 1.** Rows added: stale counts with mismatched records (card unknown, dash, no line) and a valid zero with matched records (current, 0, no line, searched). A header-only file published as ok is a separate row and reads unknown.
- **Clarification 2.** Part 2 of the suite writes the files with the hub's own v2 pipeline (`worker.scheduled`, stubbed FIRMS source, SQLite D1, in-memory R2) and answers every page request with the real `worker.js`: daily reset, failed fetch, run mismatch with a valid count, stale mismatch, matched. Each must read the same as its legacy row. Withholding is asserted in every row (points drawn, `usable`). The raw `/status` response is not touched.
- **Clarification 3.** Cache key bumped in `index.html` and `sources.html`, the only two pages that load `app.js`; the suite checks they match.

## 3. Tests (workspace, software rendering, 15 Nov)

| Suite | Result |
|---|---|
| `fire-status-ui` (new) | 279 passed, 0 failed |
| its breaks | all five fail as they should: `no-gate` 25 failures, `no-place-rule` 4, `no-shared-reason` 28, `no-zero-note` 1, `no-clear` 1 |
| `fires-wording-ui` | 35 passed; breaks `match-all` 10, `never-match` 6, `loose-prefix` 2 failures |
| `place-ui` 30 · `place-rows` 7 · `search-ui` 104 · `kept-ui` 21 · `drifters-ui` 25 · `plastic-ui` 29 · `buoy-temp-ui` 33 · `desktop-overflow` 258 · `mobile-pass` 131 · `cell-perf-ui` 43 · `ux-round1` 34 | all pass |
| `osmc-reliability-ui` | 40 passed, 1 failed: "old page: no page errors". **Same failure on main** (the 11 Nov page loaded with today's shared scripts). |
| `smoke-fixes` | 51 passed, 1 failed: "Sources 360: no page-level horizontal overflow". **Same failure on main.** |
| `status-notes-ui` | 14 passed, 2 failed: both checks pin `app.js` to release `143f531`. They pass on main and fail here because this branch changes `app.js`. |

Not run: the Moon, Sun, Sky, Timeline, Arts, Dust RGB, Ocean heat, orbital and terminator suites (their files are unchanged).

## 4. New facts from the build

- **The place finding holds in the production format.** With `lines/1` files written by the hub itself, the hub still answers a down fires run as "withheld — … not from the same collector run"; break `no-place-rule` fails on those rows. This closes the limit stated in the brief.
- **The hub's stale limit for fires is 40 minutes**, not 30 (`STALE_AFTER_S.firms = 2400`).

## 5. Seen, not changed (outside the go)

- The same line can appear beside a dash on the **Earthquakes and Ships** cards when those layers are down (shared code; read, not reproduced). This branch gates fires only.
- A header-only file published as **ok** still gets the page's own older reason, and its place row would read "no detection reached us". The hub does not publish that state (both collectors record it as down).
- Find with zero **earthquake** records has the same wording slip as A4.
- The hub's `placeSection` down test (root cause of F2) still needs its own hub change.

## 6. Not tested

Real phone, Safari, screen reader, real GPU. The live page (nothing is deployed). The daily reset on production: the next one runs 00:00 to about 03:45 UTC.

## 7. Release steps, if GPT passes (each on Chad's own line)

1. Merge `fire-status-rc` to main (page change).
2. Served-hash check of `index.html`, `app.js`, `sources.html` from the pane; live read of the Fires card.

Rollback: revert the merge commit.
