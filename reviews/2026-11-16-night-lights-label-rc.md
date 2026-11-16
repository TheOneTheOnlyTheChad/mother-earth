# Night lights — the imagery label follows the picture drawn (candidate for GPT review, rev 3)

16 Nov 2026 · branch `night-lights-label-rc` · code head `41c1186377d435410ce49171ebe1dc11537d6905` (commit time 05:16:26 UTC), from main `f60fca0`
**Rev 3:** GPT held `4759af1` for two more cases. The fix is in §9, which governs where it differs from §1–§8. **§8.2's mechanism (waiting, polling and re-giving the picture) is replaced, not extended.** Rev 2's code head was `9cd3ec3`.
**Rev 2:** GPT held `2dac540` for one race condition. The fix is in §8, which governs where it differs from §1–§7. Rev 1's code head was `bcc4432`.
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

## 4b. Live check at the site's own address (pane, 03:41 UTC; `index.html` and `nightlights.js` fetched at `bcc4432` and hash-checked; everything else is main's)

The page was sampled every 10 ms for whether the imagery line names night lights and whether the globe carries the night picture.

| Step | Result |
|---|---|
| Switch on | ready in 5.6 s, 14 Nov 2026; at ready the globe carried the night picture |
| Switch off | at that instant: layer off, line still night lights, night picture still drawn. The true-colour picture took **1.9 s** to come back; the line went back with it |
| Off, then straight into the Sky view (GPT's case) | 176 samples of the Sky label over 3.5 s: it named night lights for as long as the night picture was drawn and changed when the true-colour picture arrived at 3.5 s. No sample disagreed |
| Whole run | 1,772 samples, **7 disagreed**, all at the moment of a swap: the page looks for the swap every 30 ms, so the wording can trail the picture by up to that long |

The 30 ms trail is in the candidate as built. One night, one browser.

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

## 8. Round 2 — GPT's hold (relayed by Chad, 16 Nov)

### 8.1 The finding

GPT, with controlled texture loads: Night lights off; the daylight load held; Night lights on again; once the night picture is visible and the layer says Ready, the old daylight load finishes. It replaces the night picture while Earth and Sky keep their Night lights labels. The globe library applies each picture when its load finishes, whatever was asked for since. GPT reproduced it in a harness; Claude did not reproduce it separately before the fix. The new break `no-reissue` shows it in the suite.

### 8.2 The fix (`nightlights.js` only; `index.html` unchanged from rev 1)

- **One rule for the wording.** The imagery line, its full form and the Sky label say night lights exactly while the globe carries one of this layer's night pictures, and the earlier wording while it carries anything else. One function reads what is drawn and writes that, every 30 ms while the layer has anything on the globe or on its way.
- **One load at a time.** A new address is not given to the globe while an earlier one of ours is still loading. Switched on again while the daylight picture is on its way back, the layer stays "loading" until that picture has landed, then gives the night picture. Switched off while the night picture is still landing, the daylight address is given once it has. Each wait is bounded by the 20-second limit.
- **If an earlier load lands over the night picture all the same** (the wait ran out first): the wording follows it to the daylight wording, and the night picture is given to the globe again under a new address. When it lands the wording is night lights again.
- While the layer is off and settled, nothing is watched or re-given.

### 8.3 The test GPT asked for: section S3, six checks

Every picture the globe takes is logged as it lands, with the layer's state at that moment.

| Check | Pass |
|---|---|
| (a) Off, daylight held, on again; 1.5 s later | the layer is still loading; nothing new has landed; picture and all three wordings are still night lights |
| (a) Daylight released | the daylight picture lands first (while loading), then the night picture; at ready everything says night lights |
| (b) GPT's case: wait limit 0.7 s, daylight held past it | the layer reaches ready with the night picture drawn and named; the daylight load has not landed |
| (b) Daylight released | **the held daylight load lands on the globe while the layer reads ready** (this is the proof it completed after Ready) |
| (b) After that | the night picture is put back; the picture, the Sky label and both imagery lines say night lights |
| Off | the true-colour picture and the line it started with |

Breaks: `no-reissue` (the night picture is not given again) fails 2 and stops the suite; `no-serialize` (no wait for the pending load) fails 3.

### 8.4 Results at `9cd3ec3`

| Suite | Result |
|---|---|
| `night-lights-ui.test.cjs` | **144 passed, 0 failed** (138 + 6) |
| its 21 breaks | each fails the suite |
| `night-lights.test.mjs` | 49 passed, 0 failed |
| `sky-zoom-ui` 351 · `sky-ui` 79 · `backdrop-layer` 27 · `legend-active-ui` 548 · `mobile-pass` 131 · `desktop-overflow` 258 | pass |
| `smoke-fixes` | 51 of 52, as on main |
| others | not rerun |

### 8.5 Live check at the site's own address (pane, 04:49–04:52 UTC, files fetched at `9cd3ec3` and hash-checked)

| Step | Result |
|---|---|
| On, off | ready in 6.7 s; off restored the daylight picture and line (22 ms this time: the browser had the picture) |
| Off and on again at once | the daylight picture landed first, then the night picture, both before ready |
| **GPT's case**, daylight load held 30 s by the harness, default 20-second limit | ready at 29.8 s with the night picture drawn and named. The daylight load landed at 32.8 s, **while ready**. The night picture was back at 33.8 s. Wording followed the picture both ways |
| Sampling every 10 ms, both runs | 13 of 4,179 and 4 of 2,267 samples disagreed, all within a swap |

**In GPT's case the daylight picture was on the globe for about one second before the night picture came back.** The pane was hidden, and a hidden page's timers run about once a second; the 30 ms step applies to a page in view. For that second the imagery wording said daylight (true), while the card still said "Showing 14 Nov 2026".

A first live attempt set the wait limit to 0.7 s, which also cut off the real NASA requests; that run proved nothing and was redone as above.

### 8.6 Open

- The wording can trail the picture by up to 30 ms at a swap (page in view).
- In the pathological case (a daylight load outlasting the 20-second wait and then landing), the daylight picture shows for a moment under daylight wording while the card says the layer is on. Not reported as a failure state.
- While the layer is on, any other picture put on the globe is replaced by the night picture. Nothing else in the page changes the globe's picture after it opens, as far as the suites show; not separately tested.
- A night picture still landing when the layer is switched off, and taking longer than the wait limit, could still land late. It is a local picture; not seen.

### 8.7 Files at `9cd3ec3`

| File | sha256 |
|---|---|
| `nightlights.js` | `e2eca6275f29daccbfa93192e9e184a509e92ebd212e5646e984ab5dd038994a` |
| `index.html` | `01dd287743fe70e3d2af7ee9f472346f8f2d68d2d7f5f2bb78f358957119f2d4` |
| `phase1/night-lights-ui.test.cjs` | `e0fd31f9069137c2981ea1b3d91246d4fc587af0170a43fadd284f064a44fa5e` |

### 8.8 Line needed from Chad (not given)

`Approve: merge night-lights-label-rc at <reviewed head> to main (page change: Night lights imagery label follows the picture drawn)`

## 9. Round 3 — GPT's second hold (relayed by Chad, 16 Nov)

### 9.1 The two cases (GPT, controlled harness)

1. **New night, old date.** Daylight restoration held past the timeout; switched on again with a newer night available: the new picture is shown and marked Ready while Earth and Sky keep the previous night's date.
2. **Late night load after switch-off.** A pending night picture finishes after the daylight restore has settled: it replaces the daylight picture and stays, while the layer says Off and the labels name daylight imagery.

GPT asked: tie the date to the specific texture on screen, and prevent superseded loads from replacing it in either direction. Claude did not reproduce either before the fix; breaks `date-stale` and `no-gate` show them in the suite.

**Why round 2 let these through.** Round 2 watched the globe every 30 ms and reacted. Its wording had two states, "night" or "not night", so a second night picture changed nothing. And it stopped watching once the layer was off and settled, so a late night picture landed unseen.

### 9.2 The fix (`nightlights.js` only)

- **A gate on the globe's own picture.** The first time the layer is switched on, the globe material's picture slot is given a gate. Every picture the globe library tries to put there passes through it. While this layer has asked for a picture, no other picture is let on. A night picture of ours that is no longer the one asked for is never let on, however late its load finishes, including after the layer is off and settled. The gate stays for the life of the page; with the layer off and settled it lets every other picture through.
- **After a refusal the picture in place is drawn again.** The library releases the current picture just before it hands over a new one; the gate marks the current one to be drawn again. Checked on rendered pixels (§9.3, section V).
- **The wording is written at the moment a picture is let through, from that picture.** Each night picture is recorded with its own UTC date; when it goes on the globe, the imagery line, its full form and the Sky label take that date. When the earlier picture goes back on, they take the wording saved before.
- **No waiting on other loads, no polling of the globe, no re-giving.** Round 2's 30 ms step, its wait for a pending restore and its "give the night picture again" are removed. Switch-on still reads ready only once its own night picture is on the globe.
- `state()` gains `pending` ("night", "earlier" or null) and `gate` (what was let through and what was refused, last 40 of each), for tests and review.

### 9.3 Tests

Section S3, ten checks (replaces round 2's S3):

| Case | Checks |
|---|---|
| (a) Round 2's finding: off, daylight held, on again, Ready, then the daylight load finishes | ready with the night picture drawn and named while the daylight load is out; the daylight load **finishes after Ready and is refused**; picture, Sky label and both lines still agree; off restores the true-colour picture and line |
| (b) **Case 1, new night, old date:** 14 Nov shown; off with daylight held; 15 Nov becomes available; on again | set-up: the 14 Nov picture is still drawn and named 14 Nov; then the 15 Nov picture is on the globe and the Sky label, both imagery lines and the card all say **15 Nov**; the held daylight load, finishing after that, is refused and everything still says 15 Nov |
| (c) **Case 2, late night load after switch-off:** the night picture's load is held at its last step; switched off while it is loading | set-up: the daylight picture has settled, layer off, nothing of ours left, nothing yet refused; then the night load **finishes after the daylight picture settled and is refused**: the globe still carries daylight, the layer says off, the labels name daylight; the layer still switches on normally afterwards |

In (c) the night picture is fetched and decoded on time and its "loaded" notice to the globe library is delivered 2.5 s late. Delaying its address instead lets the page's own clean-up cancel the load, which proves nothing (the first version of the test did that and never saw a refusal).

Section V, four checks, pixels read from the globe's canvas: the rendered globe differs between the two pictures; after a late daylight load is refused the globe still renders the night picture; off renders the true-colour picture again; no page errors.

Breaks: `no-gate` (nothing is refused) stops the suite at the first refusal it waits for; `date-stale` (a second night picture does not rewrite the wording) fails the two 15 Nov checks. `no-reissue` and `no-serialize` are gone with the code they broke.

### 9.4 Results at `41c1186`

| Suite | Result |
|---|---|
| `night-lights-ui.test.cjs` | **152 passed, 0 failed** |
| its 21 breaks | each fails the suite |
| `night-lights.test.mjs` | 49 passed, 0 failed |
| `sky-zoom-ui` · `sky-ui` · `backdrop-layer` · `legend-active-ui` · `mobile-pass` · `desktop-overflow` | 351 · 79 · 27 · 548 · 131 · 258, all pass |
| `smoke-fixes` | 51 of 52, as on main |
| others | not rerun |

### 9.5 Live check at the site's own address (pane, 05:18 UTC, files fetched at `41c1186` and hash-checked). GPT asked for no live retest; this is Claude's own.

| Step | Result |
|---|---|
| On, off | ready in 5.0 s, 14 Nov; off restored the daylight picture and line |
| Round 2's case, daylight load held 8 s by the harness | on again: ready at 5.0 s with the night picture drawn and named; the daylight load finished at 8.5 s and was refused; night picture and wording unchanged |
| Case 2, night load held at its last step, switched off while loading | **not exercised live:** the daylight picture settled in about 25 ms and the page's clean-up cancelled the night load before it finished, so nothing arrived to refuse. End state correct (daylight, off). The suite's (c) is the evidence for this case |
| Case 1 (a newer night arriving between two switch-ons) | not possible to stage live |
| Sampling every 10 ms across the run | **0 of 2,360 samples** had the wording and the picture disagreeing |

### 9.6 Open

- The gate replaces a property of the globe library's material object. It depends on that library (three-globe, bundled in globe.gl 2.45.0, which the page pins) assigning the picture to `material.map` when a load finishes. A different library version could change that; the suites would show it.
- While the layer is on, any other code that changes the globe's picture is refused until the layer is off. Nothing else in the page does so after opening, as far as the suites show.
- If the earlier picture never loads after switch-off, the night picture stays on the globe, named as night lights, with the layer off (as §3).
- The card's "Showing …" line and the state change at ready up to 30 ms after the picture and its wording.

### 9.7 Files at `41c1186`

| File | sha256 |
|---|---|
| `nightlights.js` | `a664f28d62845ae9f44800a438789651a4991b2a0a905a4661b9bc152afa677f` |
| `index.html` | `01dd287743fe70e3d2af7ee9f472346f8f2d68d2d7f5f2bb78f358957119f2d4` (unchanged since rev 1) |
| `phase1/night-lights-ui.test.cjs` | `1bd20eb7c05bd13cc63d5dcea052258eb4c8f2b9c2bb07c38819910466121091` |

### 9.8 Line needed from Chad (not given)

`Approve: merge night-lights-label-rc at <reviewed head> to main (page change: Night lights imagery label follows the picture drawn)`
