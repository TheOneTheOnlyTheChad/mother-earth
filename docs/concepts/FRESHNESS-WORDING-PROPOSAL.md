# Freshness wording — proposal for GPT review (rev 1)

15 Nov 2026 · docs only · nothing built · page only · main `42a56d1`
Fourth item from `docs/concepts/CONTROL-CENTRE-USABILITY-BRIEF.md` (T1, T2). GPT's D4 on the brief: "Change CURRENT to FRESH COPY for dated indices in the freshness pass. Keep the observation date and retrieval time visible."

## 1. What main does (live page, 15 Nov 05:00 UTC)

| Card | Badge | Value is for | Our copy |
|---|---|---|---|
| CO₂ | CURRENT | daily mean for 2026-11-13 | retrieved 52 min ago |
| Sea ice | CURRENT | daily extent for 2026-11-13 | retrieved 1.9 h ago |
| Kp | CURRENT | interval 00:00–03:00 UTC, began 5.0 h ago | retrieved 52 min ago |
| Microplastic | LOADED (since 4 Nov, for this reason) | samples 2011–2024 | — |
| Ships | CURRENT | sample ended 04:28 UTC | **no retrieval time on the card** (tooltip only) |
| Forest | PARTIAL | — | "last run 18 min ago" |

The badge reports that our copy was refreshed within its limit. Beside a value dated two days earlier it reads as if the value were today's. The same word appears in the summary report's states and on the Sources page.

## 2. Proposed rules

- **F1. CO₂ and Sea ice: the adequate badge reads "fresh copy"** (one change in `ME.stateWord`, so the card, the report's state and the Sources page agree). Degraded and unknown wording is unchanged.
- **F2. The tooltip says both times:** "Our copy was retrieved N ago; the value is for <date>." The card keeps its existing observation line and "retrieved N ago" line.
- **F3. Ships card shows its retrieval time** on the source line ("· received N ago"), as the other cards do.
- **F4. No change** to earthquakes, fires, forest or buoys, to age formats ("68 s", "1.9 h"), or to any unknown or degraded reason.

Files: `app.js` and `index.html`; the `app.js` cache key is bumped on both pages. `style.css` only if the longer badge does not fit (checked at 1101 px, 721 px and 390 px in the build).

## 3. Acceptance checks

| Rule | Check |
|---|---|
| F1 | Adequate CO₂ and Sea ice: badge "fresh copy", same colour class as before; report state starts "fresh copy —"; Sources page row agrees. Earthquakes, fires, ships adequate: still "current". Degraded or unknown CO₂: wording unchanged. Break: revert the word, must fail. |
| F2 | Tooltip contains both "retrieved" and the value's date; the card still shows the observation date and "retrieved N ago". |
| F3 | Ships adequate: source line includes "received N ago"; unknown: existing "current positions unknown — …" kept. |
| Layout | Badge does not wrap or overlap the card title at 1101 px, 721 px and 390 px (measured). |
| Regression | `fire-status-ui`, `legend-active-ui`, `mobile-pass`, `kept-ui`, `ux-round1`, `status-notes-ui`; suites that assert "current" for CO₂ or sea ice are updated and listed. |

## 4. Decisions

- **F-D1. Kp.** Its value is the latest published three-hour interval, hours old but not days. "fresh copy" like the other indices, or keep "current" (recommended: keep "current"; the card already states the interval)?
- **F-D2. Microplastic** says "loaded". Change to "fresh copy" for one word across dated layers, or leave (recommended: leave; GPT chose "loaded" on 4 Nov)?
- **F-D3.** Exact tooltip sentence.

## 5. Order and out of scope

Build after the Earthquakes and Ships branch, because both change `app.js` and its cache key. Out of scope: layout at intermediate widths, the hub place fix, age formats.
