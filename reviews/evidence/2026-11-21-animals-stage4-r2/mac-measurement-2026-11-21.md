# Mac measurement, Animals Stage 4 r2 (code `4aa5c00`)

Taken 21 Nov 2026, 15:39:04 to 15:41:06 UTC (the page's own clock), by Claude through the Chrome extension in its own tab, on Chad's Mac. Page served by Chad from `_review/animals-tab-stage4-r2-4aa5c00/` with `python3 -m http.server 8911 --bind 127.0.0.1`. Script: `mac-measure.js` in this folder (its header says exactly what each figure is timed from and to). The tool returned the result in compact form; the figures below are every figure it returned. The full per-pixel arrays were not saved.

- Chrome 157, macOS; GPU string "ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)"; window 1470 × 801 CSS px, device pixel ratio 2, drawing buffer 1454 × 862; tab visible and focused at start and end.
- Page identity: list pin read from the page `80799f4b…` (the r2 list).
- First switch-on including fetch, checksum and decode (information, not the metric): 802 ms.

## A. Verified display data in memory → first frame showing both classes (limit 1,500 ms)

| Run | First frame, ms | Next frame callback, ms | Longest task, ms | Longest animation frame, ms | Tasks ≥ 50 ms |
|---|---|---|---|---|---|
| 1 | 648.3 | 659.9 | 592 | 676 | 2 |
| 2 | 583.7 | 601.6 | 525 | 597 | 2 |
| 3 | 636.2 | 652.7 | 593 | 674 | 2 |
| 4 | 707.8 | 718.8 | 635 | 705 | 2 |
| 5 | 594.2 | 606.1 | 554 | 625 | 2 |
| 6 | 733.2 | 754.7 | 689 | 767 | 2 |
| 7 | 511.7 | 530.6 | 474 | 535 | 2 |

**Median 636 ms, worst 733 ms: within the 1,500 ms limit.** In every run both polygon objects had filled geometry in that frame (83,898 and 61,869 mesh vertices) and the pixels read in it differed as expected: High against Medium-only by 104, Medium-only against ground by 48, High against ground by 142 (distance in 0–255 RGB, means of 4 points each; identical in all 7 runs).

## B. Longest main-thread task over that draw (limit 500 ms)

**474 to 689 ms; over the limit in 6 of 7 runs. NOT MET.** The limit is not loosened. What the task consists of was not profiled.

## C. Frame intervals over a five-second orbit

| State | Orbit | Frames | Median, ms | 95th pct, ms | Worst, ms | Over 33.4 ms | Over 50 ms |
|---|---|---|---|---|---|---|---|
| nothing on | close over the corridor | 296 | 16.7 | 17.1 | 66.6 | 2 | 1 |
| nothing on | whole globe, one turn | 300 | 16.7 | 17.3 | 33.4 | 1 | 0 |
| corridor | close over the corridor | 115 | 49.9 | 67.0 | 83.3 | 78 | 44 |
| corridor | whole globe, one turn | 301 | 16.7 | 17.0 | 19.2 | 0 | 0 |
| corridor and zebra journey | close over the corridor | 113 | 50.0 | 66.7 | 66.8 | 80 | 35 |
| corridor and zebra journey | whole globe, one turn | 301 | 16.7 | 16.8 | 17.9 | 0 | 0 |

**Close over the corridor, with it on, the Mac draws about 20 frames a second (median 50 ms) against 60 with nothing on. Whole-globe orbit is unaffected. The journey adds nothing measurable.** No frame-interval limit was agreed; this is reported as measured. Cause not profiled. The camera was moved by script every frame, not dragged by hand.

## D. The following page load, on the Mac (one reading each)

| Before the reload | DOM ready, ms | load, ms |
|---|---|---|
| corridor and zebra journey shown, 2 s, reload | 184 | 252 |
| nothing on, reload (control) | 96 | 248 |

Nothing like the 31 to 36 s seen on the software-renderer test machine. One reading each; "globe ready" was not timed on the Mac.

## Not measured
A real drag by hand; a phone; Safari; battery or low-power mode; other Macs; what the long task and the close-orbit frames are made of.
