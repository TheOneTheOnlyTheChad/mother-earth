# Night lights — the imagery label follows the picture drawn (candidate for GPT review)

16 Nov 2026 · branch `night-lights-label-rc` · code head `bcc44322b83b5b924ff38df02546a947d9eaed69` (commit time 03:32:29 UTC), from main `f60fca0`
**Page only. Not merged, nothing deployed, no hub change.** Built on Chad's "go" (16 Nov), after GPT's live desktop smoke.

## 1. The issue (GPT's live smoke, relayed by Chad)

After Night lights was switched off and the Sky view re-entered at once, the label named the daytime imagery before the daytime picture appeared. The picture caught up on its own.

**Cause, from the code:** on switch-off the page gave the globe the earlier picture's address and rewrote the imagery line and the Sky label in the same step. The globe (three-globe) swaps its picture only when the new one has loaded. Until then the night picture was still drawn under a daytime label. It was not specific to the Sky view.

**Not reproduced live by Claude before the fix.** The new check S2 fails against the old behaviour (break `label-early`).

## 2. A second, smaller case found while writing the test

Switch-on had the same gap in the other direction: the layer read "ready" and the label said night lights as soon as the night picture's address was handed over, a moment before the globe drew it. The picture is a local blob, so the gap is short; GPT did not see it. The first version of the new test caught it (the globe was still carrying the daytime picture at "ready"). Fixed in the same change.

## 3. The fix (`nightlights.js`)

- "What is drawn" is read from the globe's own material (the address of the picture it carries), never from the address given to the globe.
- **Switch-off:** the layer reads off at once (state, card, legend, Key count). The imagery line, its full form in the Key, and the Sky label keep the night-lights wording until the globe carries the earlier picture; then all three go back together. If that picture never loads, the night picture stays on the globe and the wording keeps naming it.
- **Switch-on:** "ready", the card's "Showing …", the legend and the imagery line appear only once the night picture is the one drawn. If it is not drawn within the wait limit: "Night lights could not be drawn in this browser. Nothing is drawn."
- **Off, then on again before the earlier picture has come back:** the line saved before the first switch-on is kept, so a later switch-off restores the true-colour line, not a night-lights one.
- `state()` gains `restoring`; `backdrop` reads "night lights" until the earlier picture is drawn.
- `index.html`: `nightlights.js?v=202612111000` (the file is live, so its key changes). No other page file changes.

## 4. Checks

Page suite section S2, six checks:

| Check | Pass |
|---|---|
| At the moment the layer reads ready | the globe already carries the night picture |
| Switched off, the true-colour picture held back | the night picture is still on the globe; the Sky label and both imagery lines still name night lights |
| Same moment | the layer itself reads off: state, card, legend hidden |
| The true-colour picture arrives | the label and lines go back to it; the globe carries it |
| Off, then on again before the earlier picture arrived | night lights drawn and named |
| Off after that | the true-colour line it started with |

The fixture holds the true-colour picture back. The browser would otherwise reuse its earlier copy without asking the fixture, so in S2 the test makes each address given back to the globe new. That is test scaffolding; the page code is not changed for it.

Breaks: `label-early` (the label changes without waiting) fails 1 check; `ready-early` (ready without waiting) fails 2.

| Suite | Result at `bcc4432` |
|---|---|
| `night-lights-ui.test.cjs` | **138 passed, 0 failed** (132 + 6) |
| its 19 breaks | each fails the suite (run before the cache-key change to `index.html`; the suite was rerun after it: 138) |
| `night-lights.test.mjs` | 49 passed, 0 failed (breaks not rerun; file unchanged) |
| `sky-zoom-ui` 351 · `sky-ui` 79 · `backdrop-layer` 27 · `legend-active-ui` 548 · `mobile-pass` 131 · `desktop-overflow` 258 | pass |
| `smoke-fixes` | 51 of 52: "Sources 360", as on main |
| other existing suites | not rerun; only `nightlights.js` and one cache key in `index.html` changed |

A first run of the six existing suites failed because the container's local server had stopped; rerun after restarting it.

## 5. Files

| File | sha256 |
|---|---|
| `nightlights.js` | `ea1289c08408c42649a49fa44b07ada74f5cd822dea630385b412573256b2ef6` |
| `index.html` | `01dd287743fe70e3d2af7ee9f472346f8f2d68d2d7f5f2bb78f358957119f2d4` |
| `phase1/night-lights-ui.test.cjs` | `d14e6f43616d11222fb7695b2b2487b3a379b2ab89a5aa43ec7ac9db3a108f43` |

## 6. Not done or open

- A real phone, Safari and a screen reader (Chad, 16 Nov: after the features are done; desktop first).
- The switch-on wait adds the time the globe takes to draw the blob to "ready"; not measured in the suite.
- The label-follows-picture rule now holds for Night lights. The true-colour picture's own first load on opening the page is `app.js` and is not touched.

## 7. Line needed from Chad (not given)

`Approve: merge night-lights-label-rc at <reviewed head> to main (page change: Night lights imagery label follows the picture drawn)`
