# J12 performance measurements: `animals-journeys-preview-rc` at `ea5414d`

Measured 19 Nov 2026, 13:53 to 14:08 UTC (page clock), by Claude through Claude in Chrome in Chad's foreground Chrome, on the Mac review tree `_review/animals-journeys-preview-ea5414d-full/` served with `python3 -m http.server 8765` (started by Chad).

## Set-up
- Chrome 157, MacBook (Apple M3, ANGLE Metal), viewport 1470 x 745, device pixel ratio 2, drawing buffer 1804 x 1116. Tab visible and focused in every window.
- Harness: `reviews/evidence/2026-11-11-globe-perf-stage0/harness.js`, fetched from the served tree, sha256 `002d3848badb7dbe21e9e89e59e9c856523f2059374f435ed1806c743c0d3483` (equal to the repo's). `S.win`: 2 s warm-up, then a 10 s rotation sweep at 36 degrees a second.
- `animals-journey.js` as served: sha256 `9763a7cc1e3f54edf3d46cb620af9b19cd007b86e9c7d91e26c47c65fa1bccc8`.
- Page as loaded: no other layer switched on (27 scene objects, 2 draw calls with the journey off).
- Three rounds. Each round: journey off; then for zebra (Z), shark (S) and whale (W): drawn and paused at the last fix (pa), then playing (pl). The journey was chosen and switched with the page's own chooser and switch. Playing: 1 day a second, started 14 days before the last fix, so nearly the whole line is drawn and playback lasts the whole window (`playing_at_end` = 1 in every playing row).
- Frame state: every window ran at the display's 60 Hz (median 16.7 ms), so all runs are the same state.

## Files
- `desktop-1470x745.csv`: 21 windows, 14:03:58 to 14:08:31 UTC.
- `narrow-390x740-iframe.csv`: 21 windows, 13:58:59 to 14:03:32 UTC.

## Result against the tolerance (ANIMALS-PROPOSAL section 8, J12)
Median no more than 10% or 2 ms above the same round's journey-off window, and p95 no more than 20% above it.
- Desktop: every journey window passes in all three rounds. Off p95 17.2, 17.7, 17.6 ms; journey p95 16.8 to 17.7 ms; every median 16.7 ms.
- Narrow: every journey window passes in all three rounds. Off p95 17.6, 17.5, 33.3 ms; journey p95 16.8 to 17.6 ms; every median 16.7 ms.
- Render time on the main thread (median): 0.3 to 0.4 ms off; 0.6 to 1.0 ms with a journey. Draw calls 2 off, 8 on. Triangles 15,840 off; 42,266 zebra; 17,686 shark; 17,498 whale.

## Limits, stated plainly
- **The narrow run is not DevTools device emulation.** The extension could not resize the window (it stayed 1470 wide) and Claude cannot open DevTools. The page was loaded in a same-origin iframe 390 px wide and 740 px high (the viewport is 745 high, so not 844) and the harness ran inside it. The page's narrow layout applied (`max-width: 480px` matched; drawing buffer 780 x 620).
- **Every window is capped by the display at 60 Hz.** The test shows the journeys do not push frames past one refresh on this machine. It cannot show how much headroom is left beyond what the render times above say.
- Single long frames occur in off and on windows alike (max up to 234 ms off, 184 ms on, narrow run); they do not move the median or p95.
- **An earlier desktop pass (13:53:33 to 13:58 UTC) was lost before it was saved in full**: Claude navigated the tab away. What was read from it: all 21 windows median 16.7 ms, p95 17.3 to 17.6 ms. One window in it (round 2, shark playing) had one 500 ms frame and 550 frames instead of about 600; one (round 3, whale playing) carried the harness flag. The saved desktop file is the full rerun.
- Rows were read out of the page as text in batches and typed into these files by Claude; the page's own objects were not saved.
- Not covered: a real phone, other layers switched on together with a journey, a slower machine.
