# Animals satellite picture: the one follow-up session after GPT's hold (gates 1 and 2)

22 Nov 2026 · branch `animals-satellite-rc` · by Claude · **branch only; B is live; nothing merged; REGISTER not touched.**

Answers `reviews/2026-11-22-animals-satellite-rc-gpt-review.md` (GPT's hold on the gates, filed unchanged). One session, as GPT set it: 13:02 to 13:06 UTC, Chad's Mac, Chad at the machine, Chrome 157, Apple M3. Not repeated. Every result is below, and the complete raw results are in `reviews/evidence/2026-11-22-animals-satellite-rc/session-2/`, saved byte for byte by the review server (`serve-and-save.py`) and copied into the branch unchanged.

## 0. What was served

`http://127.0.0.1:8913/animals.html` from the Mac folder `_review/animals-satellite-rc-r2`, a copy of the branch at `e50855f`: the candidate GPT reviewed (`f186ac2`) with current main merged in and the follow-up tools added. **No page, asset or test file differs from `3721316`/`f186ac2`** (`animals.html` `9ad790e6…`, `animals-corridor.js` `79eca28b…`, `style.css` `d9a5a62a…`, the list `c9dcf4e7…`; hash-checked in the tab before the run, with both scripts). On the merged tree in the workspace: corridor suite 98 of 98, tab suite 277 of 277, census 71 of 71, builder 29 of 29 without the archive part.

## 1. Gate 2: drawing cost. `session-2/mac-picture-20261122130251.json` (7,677 bytes, sha256 `c2d166dd…6fa7`)

Script: `mac-confirm-picture.js` version 2 (sha256 `45da9960…5b82`). New in version 2: the frame in which the page first reports the picture attached, and the hand-over of the full result. Limits: longest task 500 ms; switch-on to areas shown 1,500 ms. Capture health valid in every timed window; visibility "visible" and focus true at start and end; whole-globe backdrop loaded.

**Machine state: slow, as in the first session.** The fixed loop read 1,765 and 1,703 ms four seconds after the page loaded and 1,777 ms at the end. The script's own two opening loops read 251 and 233 ms; in the earlier watch the first loop after a command reached the tab was often fast like this, so I do not read them as a fast state. Cause not established.

| Part | Longest task (7 switch-ons) | To areas shown | Picture attached | Picture shown |
|---|---|---|---|---|
| A. Picture refused | 275, 242, 286, 230, 229, 231, 277 ms | 306 to 374 ms | n/a | n/a |
| C. Picture in memory | 294, 250, 238, 264, 232, 259, 282 ms | 307 to 384 ms | 307 to 384 ms (same frame as "areas shown") | 324 to 417 ms |

- **All 14 switch-ons within both limits.** With the picture: 232 to 294 ms. Without: 229 to 286 ms.
- **Where the picture's work falls.** In every C run the long task starts 2 to 13 ms after the press and ends before the picture is attached (run 1: task from 13 to 307 ms, attached at 384 ms). The attach itself took 1.4 to 4.7 ms and the frame after it 20 to 33 ms. A second task of 91 to 118 ms follows at about 0.5 s in both parts, with and without the picture.
- **B. First real arrival (one sample):** fetch 906 ms, decode 23 ms, attach 8.1 ms, 47 ms to the frame; **no long task**; one long animation frame of 59 ms. Areas stayed shown.
- **Orbits, 5 s each, median 16.7 ms in all five.** Worst frame: nothing on 17.6; corridor without picture 17.6; corridor and zebra without picture **133.3** (four frames over 50 ms, long tasks of 140, 55, 116 and 100 ms); corridor with picture 17.8; corridor, picture and zebra 17.7.
- Requests: 2 used at the end (one refused by the script, one real). No request from the seven re-enables.

**What this does and does not settle.** It is a valid run with no miss. It does not erase the 562 ms of the first session, and its cause is still not established. What the first session's record shows about that miss: its task ran from 8 to 570 ms after the press, and the page reported the areas shown at 660.5 ms and the picture shown at 677.6 ms. The first session did not record the attach moment, so "the task ended before the picture was attached" is an inference there from the order the code runs in (the picture is attached only once the status is "shown"), and a measurement only in this session. **It stays a deviation for Chad to accept, or to answer with B or a focused fix.**

## 2. Gate 1: continuous motion. `session-2/look-motion-1470px-…json` and `look-motion-390px-…json`

Script: `look-motion.js` (sha256 `a9e8e3a2…d0c2`). **It uses a test picture, not NASA's:** the regional request is answered in the tab with four flat colours, one per quarter of the box, over the page's real whole-globe backdrop. The camera moves on every frame and five fixed places in the box are read from the drawing buffer after each frame; a frame in which the picture is hidden, torn, behind the globe or the wrong way round reads as a wrong colour. Workspace check that it can fail: with the picture deliberately upside down every read was wrong, the still frame included.

| | Frames | Probe reads | Wrong | Too small to judge |
|---|---|---|---|---|
| Desktop, 1,470 px window | 1,593 | 6,870 | **0** | 1,095 |
| 390 px wide (frame of 390 by 780 in the same tab) | 1,614 | 6,880 | **0** | 1,190 |

Per phase, both widths, wrong reads 0 throughout: close drag-like wobble at the corridor view height (239 frames each); zoom out from the corridor view to altitude 1.5 and back (694 and 720 frames); altitude 0.06 (180); pulled back at 0.12 (239 and 241) and 0.25 (241 and 234). "Too small to judge" is the far part of the zoom, where a tenth of a degree covers under 4 device pixels; it is not counted as a pass. The still frame before the motion read 5 of 5 right at both widths.

**By eye, with NASA's picture:**
- 390 px, clear example: `session-2/390px-corridor-view-clear-12-nov-test-date.jpg`. **Test only: the date was swapped to 12 Nov in my tab for that one request; the page's own line named its rule date.**
- 390 px, a real pointer drag and three wheel ticks, then a still: `session-2/390px-after-real-pointer-drag-and-wheel-zoom-test-date.jpg`. Picture, lines, labels and areas in place after the move.

**Limits.** The motion check is of drawing with a test picture. The camera was moved by the script, plus one real drag and one wheel zoom at 390 px. I looked at stills; **no person has watched the real picture in continuous motion.** Chad has been asked to drag and zoom the served page himself and say what he sees; his answer, if he gives one, is his observation, to be recorded as such.

## 3. Also done since the candidate packet

- GPT's review filed unchanged: `reviews/2026-11-22-animals-satellite-rc-gpt-review.md`.
- REGISTER draft rev 2 with GPT's two edits ("a valid picture"; no comparison with the bulk-tile guidance; three requests per page load, aggregate traffic unmeasured). Still a draft; not filed.
- Current main merged into the candidate (`c9c0242`; docs and the other thread's REGISTER entry; no page file).

## 4. Where this leaves the decision

Gate 1: stills at both widths with cloud and clear examples, and an instrumented motion check with no wrong frame at both widths; no human observation of continuous motion yet. Gate 2: one valid follow-up run inside both limits; the earlier 562 ms stands as recorded. B stays live and A unmerged until GPT has read this and Chad has decided on the deviation.
