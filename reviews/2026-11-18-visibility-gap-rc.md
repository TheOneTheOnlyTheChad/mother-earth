# visibility-gap-rc — a minimum gap between hub requests made on return to view — review packet

**Rev 1, 18 Nov 2026 03:00 UTC (clock reading). Branch only: nothing merged or deployed.**
Branch `visibility-gap-rc`, from main `ccd26e2`. The head is in the message that accompanies this packet.

## 1. Why
18 Nov 2026, 01:35 UTC, in the Mac's Browser pane while it was hidden: the page was reported visible for about 11 ms every 2 s. With aircraft positions on, each return to view made a request to `/snapshot/opensky`: 47 in about 95 s. `aircraft.js` asked again on every `visibilitychange` to visible, with no minimum gap, for counts and for positions. An ordinary browser tab does not flip like that, but nothing in the page prevented it. GPT (relayed by Chad): own small branch; apply the gap to visibility-triggered fetches; keep the age check immediate.

## 2. What changed (`aircraft.js` only, plus `aircraft.js?v=` in `index.html`)
- `AC.VIS_GAP_MS = 60e3`.
- Counts and positions each record when their last ask began (`lastAsk`, set at the start of `load` / `dotsLoad`, so it covers every ask: switch-on, the ten-minute timer, return to view).
- `onVisible()` / `dotsOnVisible()`: if the page is visible and the layer is on, run the age check at once; then ask the hub only if at least a minute has passed since the last ask began; otherwise count a skip (`visSkips`, in the read-only aids).
- Switching a layer on, and the ten-minute timer, are unchanged.

## 3. Orbital is not changed, and why
My note on 18 Nov said Orbital refreshes on return to view "the same way". That was wrong. `index.html` `orbRequest(true)` on return to view posts a message to the page's own Web Worker to recompute positions from elements already loaded; it makes no hub request. The hub is asked for Orbital only at switch-on and by the 30-minute timer (`orbRecheck`), which does nothing while the page is hidden. A forced recompute every 2 s equals the layer's normal 2 s cadence. So there is no visibility-triggered Orbital fetch to gap. Night (`paintNight`) on return to view is local too.

## 4. Checks
- `phase1/aircraft-dots-page.test.cjs`: **45 passed** (8 new): switching on asks once; 30 returns to view at 2 s spacing make no further ask (30 skips); a return a minute after the last ask does ask; nothing while hidden; dots that pass three hours are cleared on return to view although no ask is made; the same two checks for counts; the handler is the registered listener.
- Breaks: `no-gap` 4 failed, `no-gap-counts` 2 failed, `gap-blocks-age` 2 failed. Earlier breaks still bite (`both-on` 5, `no-clear` 3).
- `aircraft-counts.test.mjs` 75; `bare-earth-ui` 128; `layer-switches-ui` 68; `search-ui` 117; `smoke-fixes` 51 passed, 1 failed (the same check as on main).
- **Live:** branch `aircraft.js` on the live page in the pane, 02:55 UTC: positions on for 30 s, 1 request, 8,676 dots. The pane was displayed at the time, so it did not flip and the burst itself was not reproduced live. The full browser suites were not rerun for this change.

## 5. Question
Is one minute the right gap? The data changes about every 144 minutes and the timer asks every ten minutes while visible.
