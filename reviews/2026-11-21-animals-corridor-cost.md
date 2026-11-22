# Animals corridor: what the switch-on costs, and a candidate change (for GPT)

21 Nov 2026, "Animals after MVP" thread. Branch `animals-perf-rc` (from main `8bf9d29`). **Not merged, nothing deployed, live page unchanged.** Chad's go (his own message, 21 Nov): get a clean corridor switch-on measurement and a bounded profiler trace with a nothing-on control; identify the cost before choosing a fix; if needed a focused fix on a review branch, published geometry and all vertices unchanged, no new features or paid dependencies; return the evidence and any candidate to GPT; no merge or deployment.

This answers item A of the recorded performance exception (Stage 4 r2, `reviews/evidence/2026-11-21-animals-stage4-r2/mac-measurement-2026-11-21.md`). All figures below are Claude's readings unless marked. Evidence folder: `reviews/evidence/2026-11-21-animals-corridor-cost/`.

## 1. Findings

1. **The 500 ms overrun is real, not made by the 21 Nov measuring script.** Clean measurement on Chad's Mac, live page (main `4c233e2` code), nothing added to the drawing: the longest main-thread task at switch-on was **664, 592, 616, 569 and 317 ms** in the five runs the browser returned records for (two further runs returned no records at all; see section 5). Nothing-on control, 2.5 s: **no task of 50 ms or more.**
2. **What that task is.** The browser's own long-animation-frame record attributes it to one timer callback in the globe library (`globe.gl.min.js`): the library building the polygon meshes from the data the page hands it. It is followed by a 54 to 70 ms drawing callback and by an 89 to 90 ms timer callback in `animals-corridor.js` (the scale bar, which asks the library six times where a screen point meets the globe).
3. **What the build is made of** (experiment on the Mac, same data, library options varied, pointer hit-testing off; longest task, three repetitions each): as drawn 638, 606, 577 ms; without the outline 450, 461, 463; without side walls 510, 460, 464; without both 324 (one record). So on this Mac about **130 ms is side walls** that the page draws fully transparent, about **150 ms the outline**, about **320 ms the filled tops**. In the workspace profile the same build is `ConicPolygonGeometry` 147 ms and the outline's `GeoJsonGeometry` 49 ms of a 202 ms task.
4. **The 20 frames a second close over the corridor is not drawing. It is the library's pointer hit test.** The library tests what lies under the pointer every 50 ms, against every triangle of the corridor meshes when the view is close (from far away the test misses their bounding sphere, which is why the whole-globe orbit was unaffected). Mac, 3 s orbit close over the corridor: nothing on, median frame 16.7 ms; corridor on, **66.1 ms with 41 long tasks**; corridor on with the library's pointer hit-testing switched off, **16.7 ms with none**; switched back on, 66.6 ms. One such test measured directly: 19 to 20 ms with nothing on, **75 to 165 ms with the corridor on**. The Animals page uses no hover or click on the globe (no label, hover or click handler in any of its five scripts).
5. **The Mac ran slowly throughout.** A fixed arithmetic loop took 1,852 to 2,008 ms on the Mac and 794 to 803 ms on the workspace machine. Why is not known from inside the page (Low Power Mode, battery, or the unattended state are possibilities; Chad was on his phone). The 21 Nov figures taken with Chad present were in the same range, so this may be the Mac's normal state. It matters for how much margin the limit has.
6. **Not examined:** the 31 to 36 s following-page load on the test machine (item A3 of the exception). Unchanged and still open.

## 2. Candidate change (branch head `db75087`; three page files and one suite)

- `animals-globe.js`: the Animals globe is created with the library's pointer hit-testing off (`enablePointerInteraction(false)`). Dragging and zooming are a separate mechanism and are unchanged.
- `animals-corridor.js`:
  - no side walls (`polygonSideColor(() => null)`; they were fully transparent);
  - the two classes are handed to the library in two steps, **Medium first and High 20 ms later**, so the library builds each in a task of its own;
  - once built, the corridor's own shapes are left out of the library's screen-point test (used by the scale bar).
- `animals.html`: version stamps of the two scripts.
- Unchanged: the display file, manifest, list and their pins; every vertex of the published geometry; wording; the journeys' and census scripts. In the candidate each patch's filled mesh has exactly as many vertices as its outline (27,063 and 20,242 for the two largest; before, 81,189 and 60,726 with the walls).

**A point for GPT's judgement: the two-step hand-over shows Medium without High for a short time** (the time High takes to build: 129 to 244 ms on this Mac). The card already reads "shown" and the legend lists both. Medium is drawn first because the source's Medium geometry contains High, so nothing drawn in that moment is outside the published Medium class. Without the two steps the candidate does not reliably meet the limit on this Mac (next section). `ME.corridor.state().both` says when both have been handed over.

## 3. Candidate measured

Mac, same clean script, candidate scripts at the stated commit (how they were loaded: section 5).

| | Longest task at switch-on, ms | Close orbit, corridor on: median frame, long tasks | One screen-point test, corridor on |
|---|---|---|---|
| Live page (`4c233e2`) | 664, 592, 616, 569, 317 | 66.1 ms, 41 | 111 to 165 ms (centre), 75 to 80 (corner) |
| Candidate, two steps (`1fecdc9` = head `db75087`) | **294, 286, 166, 273, 287, 268** | **16.7 ms, 0** | 12 to 22 ms |
| Variant, one hand-over (`392f0ae`) | 468, 487, **521**, 459 | 16.7 ms, 0 | 18 to 24 ms |

Direct comparison in one tab (experiment, two repetitions): both classes at once 427, 476 ms; Medium alone 277, 274; High alone 244, 175; Medium then both 286 + 203, 272 + 129.

**Against the agreed limits, on this Mac:** the 500 ms task limit is met by the two-step candidate in all six recorded runs (worst 294 ms) and is not reliably met by the one-hand-over variant (one of four over). The close-view frame rate returns to the nothing-on figure. First-frame time (limit 1,500 ms) was not re-measured.

Workspace machine (software renderer, so drawing times mean nothing for a Mac; the JavaScript attribution does): longest task 733 to 784 ms before, 169 to 215 ms after; scale bar 111 ms before, 46 ms after; pointer hit tests gone.

## 4. Tests on the candidate (workspace, Claude's runs)

- `animals-corridor-ui`: **68 of 68** (61 before; new section 10, seven checks). `animals-tab-ui` **277 of 277**. `animals-census-ui` **71 of 71**. All three on tree `1fecdc9`, which is byte-identical to head `db75087`.
- Deliberate breaks, each "BREAK CAUGHT": new `one-stage`, `high-first`, `sides-back`, `pointer-on`, `stage-ignores-off`, `no-quiet` (rerun on the head); earlier `high-under-medium`, `off-keeps-layers`, `writes-backdrop-line`, `late-answer-draws`.
- A first version of the hit-test exclusion left High's patches in the test; the new check 10f failed on it and it was corrected.
- Not rerun: the other earlier corridor breaks; the five older page suites (no file they load was changed); `mobile-pass`, `key-drawn-ui` (fixtures absent, as before).

## 5. Method, limits and things that went wrong

- **Clean script** `mac-clean-measure.js` (sha256 `36169b57…f0df`), run from the committed file, checked by hash in the page before running. Parts 0 to 2 only press the page's switch and read the browser's `longtask` and `long-animation-frame` records. Parts 3 and 4, and `decompose.js`, are experiments and are labelled so.
- **Mac:** Chrome 157, "ANGLE Metal Renderer: Apple M3", window 1470 × 745 CSS px, device pixel ratio 2, drawing buffer 1454 × 800, tab visible and focused at start and end, satellite backdrop shown. Claude's own tab through the Chrome extension, closed afterwards. Chad was not at the Mac. Times (page clock, UTC, 21 Nov): live page 18:13:32 to 18:14:45; decomposition 18:16:03 to 18:17:37; candidate 18:45:46 to 18:46:58; one-hand-over variant 18:49:25 to 18:57:17; direct comparison 18:57:59.
- **Records missing.** In each Mac session some later repetitions returned no long-task records at all, including for periods when long tasks certainly occurred, and the 18:49 session stood still for minutes until the tab was next addressed. Cause not established (the unattended Mac is the likely area). **Missing records are reported as missing and are not counted as passes.** The figures above are every record returned.
- **How the candidate reached the Mac without a local server:** in a tab on the live site's own address, the candidate's `animals.html` was written into a blank document with its two changed scripts inline, each fetched from the branch commit and checked by sha256; every other file came from the live site (identical to the branch). This is not the same as serving the branch tree. **A confirming run from a served review copy, with Chad present, is still wanted before any release claim.**
- **The bounded profiler trace** is Chrome's sampling CPU profiler over the DevTools protocol in the workspace (`profile.cjs`, 200 µs interval, unminified library for names; one switch-on, with a 2.5 s nothing-on control). On the Mac the trace is the browser's long-animation-frame attribution, which names the script and the callback kind, not the function. A DevTools Performance recording on the Mac was not taken.
- **Claude's error, corrected:** candidate r2 (`392f0ae`) removed the two-step hand-over on an indirect reading that High's build took about 40 ms. Measured directly it takes 129 to 244 ms. The head restores the two steps (`db75087`, a revert of r2).
- Not measured: a hand drag, a phone, Safari, a screen reader, other Macs.

## 6. For GPT

1. Is the evidence sufficient to say what the long task and the close-view frame cost are?
2. Is the two-step hand-over acceptable given the brief Medium-only moment, or should the one-hand-over variant be preferred with the limit then not reliably met on this Mac?
3. Is switching off the library's pointer hit-testing on the Animals globe acceptable in the shared `animals-globe.js`?
4. What Mac confirmation is needed before this could go to Chad for an Approve line?

No approval is requested. A merge would be a live page change and needs Chad's own exact Approve line.
