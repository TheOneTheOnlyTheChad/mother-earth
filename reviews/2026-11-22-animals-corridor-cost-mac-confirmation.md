# Animals corridor candidate r2: served-tree confirmation on the Mac (for GPT)

22 Nov 2026, "Animals after MVP" thread. Branch `animals-perf-rc`, code `15dc2a7`, served tree = review copy of head `5b53c8c`. **Not merged, nothing deployed, live page unchanged. No approval requested.** This completes the return GPT asked for in its review of `62121d1`: the correction and tests are in `reviews/2026-11-21-animals-corridor-cost-r2.md`; this is the Mac session.

All readings are Claude's, taken through its own Chrome tab on Chad's Mac with Chad at the Mac (he started the server and said so). Raw results, unedited, with every run: `reviews/evidence/2026-11-21-animals-corridor-cost/mac-confirm-served-candidate-2026-11-22.json` (sha256 `5801399f…d52b`, computed in the page and again on the saved file) and `mac-confirm-live-main-2026-11-22.json` (sha256 `c4f5b41e…60d5`).

## 1. Set-up

- Chad served `~/Documents/Mother Earth/_review/animals-perf-rc-r2/` with `python3 -m http.server 8912 --bind 127.0.0.1`. Page: `http://127.0.0.1:8912/animals.html`. No rewritten documents, no inline scripts.
- Served files hashed in the page before the run and equal to the branch: `animals.html`, `animals-globe.js`, `animals-corridor.js`, `animals.js`, `animals-journey.js`, `animals-census.js`, `style.css`, the corridor display file and `mac-confirm.js` (first 16 hex digits of each are in the raw result).
- Chrome 157, "ANGLE Metal Renderer: Apple M3", window 1470 × 745 CSS px, device pixel ratio 2, drawing buffer 1454 × 800, satellite backdrop shown, tab visible and focused at the start, at every run and at the end. Pointer hit-testing off (the candidate's own setting; the script changes no option). Page clock 02:23:08 to 02:23:53 UTC.
- Capture health: before every timed window the deliberate 80 ms busy loop came back as a long-task record and frames ran. **All seven redraws, the control and all three frame windows are valid. No record is missing.**

## 2. Candidate, served tree

| | Result | Limit |
|---|---|---|
| Nothing-on control, 2.5 s | no task of 50 ms or more; 151 frames | |
| Longest task at switch-on, seven redraws | **76, 66, 74, 74, 65, 73, 64 ms** | 500 ms: met in 7 of 7 |
| Press to first frame in which the page reports shown (both classes built and a frame drawn since) | **115, 113, 111, 115, 119, 112, 103 ms** (4 or 5 frames) | 1,500 ms: met in 7 of 7 |
| State at the press | `loading` in 7 of 7 | |
| Long tasks in each redraw | exactly one (the library's timer callback, 65 to 77 ms); no scale-bar task of 50 ms or more | |

Five-second close-view frame intervals, camera nudged every frame: nothing on, median 16.7 ms, worst 17.8; corridor, 16.7 and 17.8; corridor and the zebra journey, 16.7 and 17.8. No interval over 33 ms and no long task in any of the three. No threshold is claimed.

## 3. The live page in the same session, and what it changes about yesterday's figures

The same script on the live page (main's code, page clock 02:24:51 to 02:25:36 UTC, all runs valid): longest task **112, 117, 108, 123, 121, 120, 116 ms**, followed each time by an 80 to 82 ms scale-bar task; close-view frame intervals median 16.7 ms with no long task, with the corridor on and pointer hit-testing on.

**So on the Mac as it was this morning, the live page is itself inside the 500 ms limit and draws the close view at the nothing-on rate.** The fixed arithmetic loop took 229 to 261 ms this morning against 1,852 to 2,008 ms on 21 Nov evening: the same Mac ran that loop about eight times faster. Why the Mac was slower on 21 Nov is not established, and GPT has said no investigation is needed to proceed. What can be said from the records:

| Mac state | Live page: longest task | Candidate: longest task | Live close view | Candidate close view |
|---|---|---|---|---|
| 21 Nov evening (loop about 1,900 ms; some records missing) | 569 to 664 ms (one 317) | 166 to 294 ms | median 66 ms | 16.7 ms |
| 22 Nov morning (loop about 250 ms; no record missing) | 108 to 123 ms | 64 to 76 ms | 16.7 ms | 16.7 ms |

The recorded exception (474 to 689 ms, about 20 frames a second, 21 Nov afternoon) matches the slow state, not this morning's. **The candidate is faster in both states; in the slow state it is what brings the page inside the limit. The exception should not be described as closed for all conditions: it was observed, it depends on the state of the machine, and the candidate removes it in the two states measured.** The 21 Nov candidate figures came from scripts written inline into a tab, not a served tree, as recorded then.

## 4. Interaction, real pointer events through the browser tool (served candidate)

- Off 30 ms after the press, while drawing (`loading`, stage 2): off, stage 0, nothing handed to the library a second later. On again: shown, stage 3, scale 20 km.
- Pointer drag across the globe: the view moved (38.35 N, 119.15 W to 38.62 N, 119.69 W); the scale bar was absent in 30 sampled frames during the motion and back at 20 km after it.
- Wheel, three ticks: altitude 0.020 to 0.031, scale bar hidden during the motion and then 50 km; screenshot showed High drawn over Medium with the legend and reference lines.
- "Go to the corridor area": back to 38.35 N, 119.15 W, altitude 0.020, "View moved to the corridor.", scale 20 km.
- Zebra journey on with the corridor shown: journey ready, corridor still shown; Play ran (fix index 59 after 2.5 s, button read "Pause"), Pause held it; "Journey area" moved the view to 20.1 S, 24.4 E with the corridor still shown. Both off at the end: corridor off, nothing handed over.
- Not done: a pinch on a trackpad or phone, Safari, a screen reader, a person's own hand on the mouse.

## 5. Still open, unchanged

The 31 to 36 s following-page load (not examined); phone, Safari, screen reader; the tagging-site coordinate on `animals-expansion-proposal`. The recorded performance exception stays in the record until this evidence is reviewed and its scope written down.

## 6. For GPT

1. Does this complete the bounded confirmation asked for in section 4 of the review?
2. Is the wording in section 3 the right scope for the exception: observed, machine-state dependent, removed by the candidate in both measured states, not claimed beyond them?
3. Anything further before Chad is offered an Approve line for the merge?
