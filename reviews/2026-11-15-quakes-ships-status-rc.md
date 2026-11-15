# quakes-ships-status-rc — review packet (round 1)

15 Nov 2026 · branch `quakes-ships-status-rc` from main `29c2fea` · page only · not merged · for GPT
Proposal: `docs/concepts/WITHHELD-LINE-QUAKES-SHIPS-PROPOSAL.md` rev 2 (§6 governs). Chad's go: "Go: build quakes-ships-status-rc on a branch per WITHHELD-LINE-QUAKES-SHIPS-PROPOSAL rev 2 (§6 governing; page only; no merge)".

## 1. What changed

| File | Change |
|---|---|
| `app.js` | `ME.readings`: a ships envelope whose `source_status` is `down` is not read as a sample. `lastSample`, `sampleEnd`, the sample description, the window text and the unit's window length come only from a real sample. New field `down`. |
| `index.html` | `cardCount` now also records the Earthquakes and Ships readings' `value`; `pairNote` hides the line for any of the three when that value is `null`. Ships card: with a down run the description reads "no sample from the latest run". `app.js?v=202612011000`. |
| `sources.html` | `app.js?v=202612011000` only. |
| `phase1/quakes-ships-status-ui.test.cjs` | New suite. |

No hub file, schedule or REGISTER change. `style.css` unchanged.

## 2. Rules as built (§6)

- **Gate:** the "Records withheld … counts shown alone" line for Earthquakes and Ships shows only while the displayed reading's `value !== null`. A valid zero and a displayed degraded count keep it. A dash and ships' "Last sample: N" do not show it.
- **Ships down:** "–", no "Last sample" label, description "no sample from the latest run", and the report says "ships: unknown — collector reported down: …" with no sample claim.
- **Ships stale:** "Last sample: N" with its end time and class counts, a genuine zero included; the report keeps "last sample N vessels ending HH:MM UTC".
- Buoys and microplastic are untouched.

## 3. Tests (workspace, software rendering, 15 Nov)

`quakes-ships-status-ui`: **124 passed, 0 failed.**

| Case | Card | Line |
|---|---|---|
| Earthquakes down, last good records | unknown · – | hidden, empty |
| Earthquakes stale, mismatched | unknown · – | hidden, empty |
| Earthquakes mismatch, valid count | current · 1 | shown |
| Earthquakes valid zero, mismatched | current · 0 | shown |
| Earthquakes matched | current · 1 | hidden |
| Ships down, last good records | unknown · – · no label · "no sample from the latest run" | hidden, empty |
| Ships stale, mismatched | unknown · Last sample: 2 | hidden |
| Ships stale, matched | unknown · Last sample: 2 | hidden |
| Ships mismatch, valid count | current · 2 | shown |
| Ships degraded count displayed, mismatched | degraded · 2 | shown |
| Ships genuine zero sample, usable | current · 0 | hidden |
| Ships genuine zero sample, stale | unknown · Last sample: 0 | hidden |
| Ships matched | current · 2 | hidden |

Also checked: nothing prints "undefined" or "NaN" on either card or in the report in any case; the report's ships sentence per state; a one-session transition current → down → current; the Sources page with ships down; the cache key matches on both pages.

Breaks, each fails as it should: `no-gate` 9 failures · `down-as-sample` (main's total of the empty envelope) 6 · `keep-description` 3.

Regression, all pass: `fire-status-ui` 279 · `legend-active-ui` 548 · `fires-wording-ui` 35 · `mobile-pass` 131 · `drifters-ui` 25 · `plastic-ui` 29 · `place-ui` 30 · `search-ui` 104 · `kept-ui` 21 · `buoy-temp-ui` 33 · `desktop-overflow` 258 · `cell-perf-ui` 43 · `ux-round1` 34 · `status-notes-ui` 17 · `terminator-ui` 19 · `dustrgb-ui` 67 · `backdrop-layer` 27 · `orbital-browser` 113 · `arts-ui` 90 · `sky-ui` 79.

Still failing, same as on main: `osmc-reliability-ui` "old page: no page errors"; `smoke-fixes` "Sources 360" overflow. Not run: `sky-zoom-ui`, `terminator-behaviour`, `oceanheat-ui` (no snapshot folder here).

## 4. Fixed on the way (same fault, same line of code)

On main a down ships run also printed "sample ended –; undefined Class A + undefined Class B; socket connected – s of undefined s" as the card's description and "last sample 0 vessels ending –" in the report (both reproduced with break `down-as-sample`). The unit line read `${s.window_s}` off the same envelope, which gives "undefined s" (from the code; not separately reproduced). All three came from reading sample fields off the down envelope and are gone with W3.

## 5. Not tested

Real phone, Safari, screen reader, real GPU, the live page. A down ships run on production (8 since 8 Nov; none during this build).

## 6. Release steps, if GPT passes (on Chad's own line)

1. Merge `quakes-ships-status-rc` to main (page change).
2. Served-hash check of `index.html`, `app.js`, `sources.html`; live read of the Earthquakes and Ships cards.

Rollback: revert the merge commit.
