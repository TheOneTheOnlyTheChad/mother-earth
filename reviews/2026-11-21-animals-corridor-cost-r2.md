# Animals corridor cost: candidate r2, completion on evidence (answer to GPT's bounded hold on `62121d1`)

21 Nov 2026, "Animals after MVP" thread. Branch `animals-perf-rc`. **Not merged, nothing deployed, live page unchanged. The served-tree Mac confirmation GPT asked for is NOT done yet** (section 4): it needs Chad at the Mac to start a local server and keep the Mac awake. This packet is the correction and its tests; the confirmation result will be added before it goes back to GPT as complete.

GPT's review is filed beside this as `reviews/2026-11-21-animals-corridor-cost-gpt-review.md` (GPT's text, relayed by Chad). Work under Chad's go of 21 Nov for a focused fix on a review branch returned to GPT; relayed GPT text is not Chad's approval and none is claimed.

## 1. What GPT held, and what changed

GPT: the card said "shown" and announced completion with only Medium handed over; `both` meant data handed over, not meshes drawn; check 10a required that state. Correct on every point.

Changed in `animals-corridor.js` only (`animals-globe.js` and `animals.html` are as in `62121d1`):

- **`finish()` no longer says shown.** It hands over Medium, makes the one camera move of that press (as before, only if the press is still current) and starts a watcher. The card stays `loading`, busy, with the line "Drawing the published areas…"; the legend, "Go to the corridor area" and the scale bar stay hidden; nothing is announced beyond "loading".
- **Completion is read, not assumed.** `built(g, class)` counts the library's own polygon objects for that class (`__globeObjType === 'polygon'`, `__data.data.key`) whose fill mesh and outline both hold geometry, and requires the manifest's patch count (4 and 2). The watcher, once per animation frame:
  1. hands over High only when Medium is built (no fixed delay; each class is still built in a task of its own);
  2. when both are built, notes the renderer's frame counter (`renderer.info.render.frame`) and completes only on a later frame in which that counter has advanced, that is, after the renderer has drawn the scene with both in it. The counter is used rather than a per-mesh render hook so that a view turned away from the corridor is not a false stall.
- **`done()`** then applies the hit-test exclusion to the actual objects, sets `shown`, paints the legend and controls, works out the scale and announces "areas shown". No timer is treated as readiness anywhere; the two 20 ms timers are gone.
- **Bounded wait.** `DRAW_WAIT_MS` 10,000, counted only while animation frames run (each frame adds at most 100 ms), so a hidden tab is not a failure and resumes when visible. When it runs out: failure, "The areas could not be drawn in time, so nothing is drawn.", switch off, Medium removed, Retry offered.
- **Cancellation.** The watcher stops on the existing press token (`st.tok`), on `st.on` false and on any status other than `loading`: so off, a new press, a failure and a lost context all end it, and nothing completes afterwards. `clearOwned()` resets the stage. Leaving the page (`pagehide`) while drawing switches the corridor off, as it already did while loading.
- **Scrolling and camera.** The page is still scrolled only at the press. Neither the hand-over nor completion scrolls. The camera move is not deferred, so the existing cancellation by gesture, journey or "Go to" is unchanged.
- State for tests: `stage` 0 none, 1 Medium handed over, 2 both handed over, 3 complete. `both` is removed.

sha256 at code commit `15dc2a7`: `animals-corridor.js` `4754dbb6b83d7663e03724f4512a7c4606b6fc02f2534b507e2a859d55563527`; `animals-globe.js` `3a7ba3cb645030b4bc4ee79db16d860a9e698693962edc0a39852748e6bd9494`; `animals.html` `e8caad573138deffed04ad1e5e35815566a39012f73752969bc5d485eba71629`.

## 2. Tests (workspace, Claude's runs, on the corrected code)

`animals-corridor-ui` **73 of 73** (section 10 now twelve checks), `animals-tab-ui` **277 of 277**, `animals-census-ui` **71 of 71**.

Section 10 keeps "handed over", "built" and "drawn" apart. It holds things from inside the page:

- **10a** at the press only Medium is handed over; state `loading`, "Drawing…", busy, no legend, no go-to, no scale, no completion announcement; High handed over later; shown and its announcement only at the end with all six patches built. Sampled every frame: nothing "ready" appears early.
- **10h** the renderer is held (its render call replaced by nothing): both classes handed over and built, yet the card stays drawing and unannounced; released, it completes.
- **10i** High is handed over but its shapes never exist (the suite passes the library an empty High): the card stays drawing with Medium alone, never shown; at the end of the bounded wait it fails with the "in time" line, reads off, Medium removed, Retry offered; Retry completes.
- **10j** switched off while built and waiting for a frame: off at once; the frame arriving and the wait running out change nothing afterwards.
- **10k** page left while drawing: off, nothing completes. **10l** graphics context lost while drawing: "globe stopped", never shown.
- **10d** on and off at once; **10e** on, off, on; **10b** no side walls, fill vertices equal outline vertices; **10c** pointer hit-testing off; **10f** at completion every shape of both classes is excluded from the screen-point test and the scale bar is shown.

Deliberate breaks, **33 run on the corrected code, 33 "BREAK CAUGHT"**: ten for section 10 (`premature-shown`, `no-frame-wait`, `handed-counts-as-built`, `no-draw-timeout`, `stale-completes`, `one-stage`, `high-first`, `sides-back`, `pointer-on`, `no-quiet`) and every earlier break in the suite except `late-answer-draws-token-only` (which is defined to expect no failure), plus a new `scroll-on-completion`.

Two things that went wrong on the way, both corrected: `high-first` was first reported MISSED because the section's warm-up timed out instead of failing a check (the warm-up now tolerates failure so the checks fail on their own evidence); the old `scroll-on-answer` break no longer applied to the rewritten line and was rewritten.

Not rerun: the five older page suites (no file they load changed); `mobile-pass`, `key-drawn-ui` (fixtures absent). The suites' existing pointer-drag, go-to and replay checks pass. Neither suite has a wheel-zoom check; drag and wheel zoom with real pointer events are in the Mac confirmation plan.

## 3. GPT's wording corrections, adopted

- The 130 / 150 / 320 ms split is approximate experimental differences on one Mac, not exact, additive or universal.
- "The dominant tested close-view cost is pointer hit-testing", not "drawing costs nothing".
- The arithmetic loop shows only that that loop ran slower on the Mac. It diagnoses nothing about the machine.
- The Mac readings in the first packet are Claude's reported records; raw per-run Mac JSON was not retained. The confirmation run retains it.

## 4. Served-tree Mac confirmation: plan, NOT YET RUN

Script `reviews/evidence/2026-11-21-animals-corridor-cost/mac-confirm.js` (tried in the workspace only: seven valid runs, no error). It adds nothing to the drawing and changes no library option (the earlier script's diagnostic part that switched pointer hit-testing back on is not in it).

1. Chad serves the review copy from Terminal (`python3 -m http.server <port> --bind 127.0.0.1`), Mac awake, Chrome in front. Claude opens its own tab on that address, records the hashes of the served page files against the branch, browser, GPU, viewport, DPR, backdrop, visibility and focus.
2. **Capture health before every timed window:** a deliberate 80 ms busy loop must come back as a long-task record and frames must run, or the run is marked invalid and kept. Missing is never a pass.
3. Nothing-on control, 2.5 s. Then seven redraws with the display data in memory: longest task (limit 500 ms) and **press to the first frame in which the page reports shown** (limit 1,500 ms). After this correction "shown" is only reported once both complete classes are built and a frame has been drawn since, which is what 10a, 10h and 10i test, so that time is the first frame containing both classes.
4. Five-second close-view frame intervals: nothing on, corridor, corridor and the zebra journey. Median, worst, long tasks. No new threshold.
5. By hand or through the browser tool's real pointer events: drag, wheel zoom, replay and go-to, off/on, off during drawing, scale hidden during motion and correct after it.
6. The whole result JSON is saved into the evidence folder, invalid runs included.

## 5. Where

- Branch `animals-perf-rc`: code `15dc2a7`; this packet and the confirm script in the commit that carries them (see `git log -1`).
- Mac review copy: `_review/animals-perf-rc-r2/` (complete tree; `read/01-PACKET-r2.md.txt` first). The earlier `_review/animals-perf-rc-62121d1/` is superseded.
- Still open and not touched: the 31 to 36 s following-page load; phone, Safari, screen reader; the performance exception stays recorded as it is until the confirmation is reviewed.
