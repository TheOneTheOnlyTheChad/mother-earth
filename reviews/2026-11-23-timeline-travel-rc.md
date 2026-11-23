# Timeline explorer, stage 1 — branch build record (for GPT's review)

**Rev 4, 23 Nov 2026 09:40 UTC (clock reading): Claude's real-browser recheck of rev 3 found two more faults; both fixed (section 9). GPT was sent rev 3 at `861b0f5` before this: the tree it is reading differs from this commit in `timeline.js`, `timeline.html` (the two cache keys only), two test files and this record. The Mac copy GPT is reading was left untouched; rev 4 is beside it in `_review/timeline-travel-rc/rev4/`.** **Current bytes: `timeline.js` 53,436 B `f25a0a8b0750…`, `timeline.html` `f34d00fd2cf3…`, `style.css` `28759e4663a6…` (unchanged since rev 2); build and both keys `202612250400`.** Still branch only.

**Rev 3, 23 Nov 2026 09:18 UTC (clock reading): GPT's review of rev 2 (focused hold; relayed by Chad; filed unchanged as `reviews/2026-11-23-timeline-travel-rc-gpt-review.md`) answered in section 8.** H1, H2 and H3 fixed, wheel release defined and tested, the history paths GPT listed added to the suite. `timeline-travel-ui` is now 207 checks with 20 breaks. **Current bytes: `timeline.js` 53,230 B `42fe23bcc9…`, `timeline.html` `87535def04…`, `style.css` `28759e4663…`; `timeline.js?v=`, `const BUILD` and the Timeline page's `style.css?v=` are all `202612250300`.** Section 1's file line and section 3's table describe rev 1 and are kept as the record of that round; section 8 has the current results. Still branch only: no merge, release or Worker clearance asked.

**Rev 2, 23 Nov 2026 08:28 UTC (clock reading): a real-browser pass by Claude (section 7), one cosmetic fix from it, stylesheet key moved to `202612250200` on the Timeline page.** Code otherwise as rev 1. After the fix: generator `--check` passes; `timeline-changes-build` 45, `timeline-axis` 96, `timeline-travel-ui` 162, `timeline-mixed-assets` 18, `timeline-ui` 594, `timeline-changes-ui` 173 passed (each alone, 08:23–08:27 UTC). The deliberate breaks were not rerun after this one-line stylesheet change.

**Rev 1, 23 Nov 2026 08:15 UTC (clock reading).** Branch `timeline-travel-rc`, from main `a44e31d`. Built by Claude (Timeline feature thread) on Chad's own line of 23 Nov, "i agree on all 6 you can go" (T1–T6 in `docs/concepts/TIMELINE-TRAVEL-PROPOSAL.md` rev 2.1). **Branch only. Not merged, nothing live, no Worker or R2 change, no source request. No release clearance is asked for here.** Every figure below was produced by Claude in the cloud workspace (Chromium under Playwright, 2 CPU cores, software rendering) unless it says otherwise.

## 1. What was built
- **Explorer** in `timeline.js`: one linear scale per window; Older, Newer, Zoom in, Zoom out, Whole Earth, Complex life, Reset view, List; drag to pan; arrow keys and + / − on the focused explorer; wheel zoom only after a click on the timeline or Enter on it, released by Esc or by leaving it. Widest window 4567–0 Ma, narrowest 1 Ma (provisional interface limit).
- **Bands, ticks, marks, clusters** are redrawn from the same window and the same measured width. Titles sit under their marks on up to three rows with a plain leader; if every full title cannot be placed the view uses the short codes, and hover or focus shows the full title. A mark never moves.
- **Extents to scale:** an approximate interval, a modelled range and a stated ± margin are each drawn at their true ends once 4 px wide, in three different styles, clipped at the window edge with ‹ or › and "Continues beyond this view …" in the label.
- **Clusters:** marks closer than 16 px share a control with a list; a run is cut into controls at most 32 px wide (new, so a dense view is many short lists). "Zoom to these" appears only when it can separate the members.
- **History:** pan and zoom write the window into the current entry's state and add no entry. Opening a story saves the window in both entries; Back, Close, Forward and reload restore each entry's own window. Stored windows are validated.
- **Story panel:** existing claims regrouped by the generator under "How we know", "Context and limits", "Chart reference", "Review and changes"; "Older entry / Newer entry" (accessible names "Older / Newer plotted entry on this view"), with "Look in the whole timeline" as a separate action.
- **Catalogue unchanged:** `tl-2026-11-R2`, sha256 `2f39aa30…0356`; `build_timeline.py --check` passes. One catalogue request at load, as before.

**Files:** `timeline.js` (50,155 B; `5608960436…`), `style.css` (`118f3363a6…`), `timeline.html` (generated; `dcc3380ec3…`), `phase1/timeline/build_timeline.py` (`ep_article` only), four existing suites, two new suites. `timeline.js?v=` and `const BUILD` = `202612250100`; `style.css?v=202612250100` on the Timeline page only.

## 2. Where the build differs from proposal rev 2.1 (each is a point for review)
1. **No "What is uncertain" heading.** In schema 2 every uncertainty statement is inside its claim's own value text ("± 0.037 Ma (uncertainty as stated by the source)", "uncertainty not stated"). A separate block could only repeat them, so it is omitted, as GPT's review allowed. The existing `context` claims sit under "Context and limits".
2. **Last heading is "Review and changes"**, not "Sources and changes": each citation stays beside its own claim, so that group holds the review date, earlier datings and change links only.
3. **Coverage plans use the catalogue's lane wording** ("Human relatives (no entries yet) · Human history (no dated entries on the axis yet)"), not "No reviewed entries yet": Pliny is a reviewed Human history entry on the shelf, so that sentence would be wrong for that lane.
4. **Phone:** the existing full-height modal sheet is kept. A 70 % sheet was not built: with the page behind it inert and unpinned, the part left showing is the page header, not the explorer. Layout B was not built.
5. **Explorer height** is `clamp(240px, 42vh, 440px)` (230 px minimum on a phone), not 60 % of the viewport: at 60 % the toolbar and window line fell below the fold at 1280 × 860.
6. **Stylesheet key on the Timeline page only**, as proposed. This needed one change to an existing check: `timeline-changes-build` required the key to be equal on timeline, index and sources. It now requires index = sources, and the Timeline key not older than theirs or than the build. **Please confirm or reject this change to an existing check.** The alternative is to move the key on the five pages that share it.
7. **Earlier page and script with this stylesheet.** The released axis rules are kept unchanged and the explorer's rules are scoped to `.xpl`, because a browser can hold the earlier HTML for some minutes after a release and would fetch this file. Measured: earlier page + earlier script + this stylesheet draws without overflow at 1280 and 390.
8. **New guard:** if the stylesheet in force is not this build's (a rule only it has is absent), the explorer stays off with reason `stylesheet` and the list is the only view. Without it, this page with the earlier stylesheet overflowed at 390 px.
9. **Pinch zoom and Safari gesture events are not built.** Touch has drag to pan and the buttons.
10. **Direct link to an entry outside the landing window** (rule: whole span) is written but cannot be exercised: the catalogue validation refuses any entry older than the landing window.

## 3. Checks (run log: `reviews/evidence/2026-11-23-timeline-travel/run.log`, 07:56–08:12 UTC, each suite alone)
| Suite | Result |
|---|---|
| `build_timeline.py --check` | passes |
| `timeline-changes-build` | 45 passed |
| `timeline-catalogue-hub` | 73 passed |
| `timeline-ui` | 594 pass |
| `timeline-axis` | 96 pass |
| `timeline-changes-ui` | 173 pass |
| **`timeline-travel-ui` (new)** | 162 pass |
| **`timeline-mixed-assets` (new)** | 18 pass |

- **`timeline-travel-ui` breaks: 15 of 15 caught** (`nonlinear`, `no-clamp`, `pan-pushes`, `state-clobber`, `no-restore`, `wheel-always`, `zoom-always`, `no-clip`, `requests`, `resize-moves-window`, `bad-state-accepted`, `nav-pushes`, `plans-focusable`, `new-sentence`, `chart-under-how`). Control: against the page files of commit `a44e31d` the suite fails at its first section (0 pass).
- **`timeline-mixed-assets` break:** `no-style-guard` caught (2 fail).
- **Existing breaks rerun after their anchors moved** (earlier in the session, 07:2x–07:4x UTC, before the stylesheet scoping and the guard; not in the run log): `timeline-ui` `close-keeps-fragment`, `shortcut-fragment`, `switch-pushes`, `no-focus-return`; `timeline-changes-ui` `back-loses-entry`, `no-return-target`, `stale-js-version`; `timeline-axis` `focusable-empties`, `hover-only-periods`, `no-hash-check`. All caught. The other existing breaks were not rerun.
- **What `timeline-travel-ui` checks, in brief.** Positions against ages computed in the test from the catalogue, at five windows, after a resize, with a story open, and for a 200-entry fixture. Both limits and a seeded run of 200 operations. Wheel before and after activation. A drag from a mark, a 3 px press, a cancelled pointer, hover and focus. History length, state contents, window on Back, Forward, reload, the "Changed in" path, nine kinds of bad stored window. Coincident and near-coincident clusters down to the narrowest window. An interval across each edge. An empty window. Zero requests after load. Every claim's id, label, value, text and source link with JavaScript off. Widths 360 to 1280, 1280 at 200 % zoom, a 500 px tall window, WCAG text spacing, reduced motion, a touch-enabled context.
- **Changes to existing suites:** `timeline-axis`: window-line wording, Tab order (toolbar, List, explorer, marks, period list), the compact-interval case moved to 800 px (at 1280 the 2 Myr interval is now 4.6 px and is drawn to scale), `h5` for claim headings. `timeline-ui`, `timeline-changes-ui`: break anchors and the script key. `timeline-changes-build`: point 6 above.
- **Other pages:** index, sources, moon, sun, animals at 1280 and 390: every element's box, colours, font size and display identical under the `a44e31d` stylesheet and this one (0 differences; a repeat with the same stylesheet also gave 0).

## 4. Timings (proposed targets; Chad accepts or not)
Method: the page's own Zoom in, Older, Zoom out, Newer buttons in turn; 20 warm-up steps discarded, 200 samples, three runs; workspace Chromium, software rendering, 2 cores. "Script and redraw" = the click handler, which redraws synchronously. "To second frame" = the same start to the second animation frame after it. File: `reviews/evidence/2026-11-23-timeline-travel/perf.log`.
| Case | Script and redraw, median / 95th / max (ms), worst of three runs | To second frame, median / 95th / max (ms) |
|---|---|---|
| Five entries, 1280 × 860, story closed | 1.8 / 2.8 / 12.1 | 33.3 / 33.6 / 36.1 |
| Five entries, 1280 × 860, story open | 1.8 / 3.0 / 4.6 | 33.3 / 33.6 / 38.1 |
| Five entries, 390 × 844 | 2.0 / 3.4 / 11.7 | 33.3 / 33.5 / 37.1 |
| 200-entry fixture, 1280 × 860 | 4.1 / 6.6 / 14.9 | 33.3 / 33.7 / 37.6 |

Run at 08:14 UTC; each cell is the largest of the three runs' values. Against the targets: script and redraw 16 ms median with five entries and 33 ms with 200 are met here. "To second frame" cannot be less than two frames (33.3 ms at 60 Hz), so the 50 ms target says only that no frame was missed at the 95th percentile. These figures say nothing about Chad's Mac or phone.

## 5. Not done, and not claimed
- No phone, no Safari, no screen reader, and no pass in Chad's own Chrome (the real-browser pass in section 7 is the Claude desktop app's browser pane). The touch check is a touch-enabled Chromium context. The 200 % case is browser zoom (a 640 px layout at double density), not text-only enlargement.
- `desktop-overflow`, `mobile-pass` and `header-tabs` were not run: the header is untouched.
- The click that ends a drag is also suppressed in code, but no test can show that line matters in Chromium (the redraw already replaces the pressed mark). It is defence only and has no break.
- **Publisher landing pages for the six cited sources have not been read again.** That is a pre-release step (proposal §3), not done for this branch.
- No GPT smoke test yet. A served copy is in the Mac folder (below).

## 7. Real-browser pass (Claude, browser pane of the Claude desktop app on Chad's Mac, 23 Nov 08:20–08:25 UTC)
The pane is Chromium 156 with the Mac's own graphics. Page: the Mac review copy at commit `98d1418`, served by Chad's local server on 127.0.0.1:8899; `timeline.js`, `timeline.html` and `style.css` hashed in the tab and equal to the branch's. **The catalogue came from the live hub** (not a test double): the explorer went on, so the hub's bytes matched the page's pinned sha256.
- At the pane's own width (588 px): explorer on, five marks with short codes, 12 bands, no page overflow. Zoom in and Older gave 471.45–202.05 Ma, saved in the state, history length unchanged. Whole Earth: the no-bands statement shown, one cluster of four with "Zoom to these". Reset returned to 538.8–0.
- At an emulated 1280 × 860, with real mouse input:
  - a 160 px drag on the timeline moved the window to 607.99–69.19 Ma, exactly 160 px of time; no entry added; nothing opened;
  - the same drag started ON the end-Permian mark gave the same window and opened nothing;
  - a click on a mark straight after that drag opened its story (a drag does not block the next click);
  - a click on the end-Permian mark opened its story beside the explorer: heading focused, mark selected and 0 px from its computed position on the narrowed 734 px track, panel 512 px, headings "How we know", "Chart reference", "Review and changes", no overflow;
  - Older entry switched to Frasnian–Famennian in the same history entry; Zoom in with the story open added no entry;
  - browser Back closed the story, restored 538.8–0 (the window it was opened from) and put focus on the mark of the entry last shown;
  - the wheel before activation scrolled the page 200 px and left the window alone; after a click on the timeline it zoomed (538.8 → 361.2 Ma span), the age under the pointer stayed 435.45 Ma, the page did not scroll; Esc released it.
- Leaving the page and coming back with the browser's Forward restored the stored window.
- **Found and fixed:** when the newest tick sat at the right edge its "Ma" dropped to a second line. Ticks no longer wrap (`style.css`, one rule).
- Not covered by this pass: keyboard-only use, the phone sheet, touch, clusters opened by real clicks, reduced motion. Those rest on the workspace suite. One early click in this pass landed on nothing because the tool's coordinate frame was stale after a navigation; it was repeated with a fresh frame.

## 8. GPT's review of rev 2: what was changed (rev 3)
GPT accepted section 2 points 1–4 and 6 and the 32 px cap, and held on four items. GPT's own runs (its statement): JavaScript syntax, `timeline-changes-build` 45 passed, generator `--check`, catalogue and Worker byte-identical to its local main; a Chrome smoke at desktop and phone widths against the live hub. It did not rerun the browser suites or breaks.

**H1 — Forward changed a saved window (reproduced by GPT in Chrome. Claude did not reproduce it by hand before fixing; the new check fails in the same way, 319.291–184.591 where 404.1–269.4 was saved (GPT saw 319.3–184.6), when break `restore-reveals` puts the old behaviour back).** Cause as GPT read it: `show()` always called `revealMark()`. Now `show(id, x, reveal)`: an explicit open (a mark, a card, the entry navigation, a direct link) reveals the mark; restoring a history entry (Back, Forward, reload, return from a change record) applies that entry's saved window and never re-centres. A restored entry with no valid saved window still reveals. Checks (section E2): GPT's exact steps (471.45–202.05 → open end-Permian → Zoom in → 404.1–269.4 → Back → Forward gives 404.1–269.4 → reload keeps it); an explicit open of an off-window entry still brings its mark in; the change-record round trip with a saved window that excludes the story's mark.

**H2 — "Zoom to these" asked only about the outermost separation (GPT, static).** Now the candidate target window is built first and the page's own clustering rule is run for that window (`groupsAt`, the same function that draws the screen). The action is offered only if every member stands alone there. Checks (F2): two entries at one age plus one 0.03 Ma away; two 0.0005 Ma apart plus one 0.03 Ma away (never offered at five zooms, list complete); three separable members (offered; afterwards three separate marks at their computed positions). Breaks `zoom-outer-only` (the rev 2 rule) and `zoom-always`.

**H3 — stale "outside this view" (GPT, observed).** The status line is now recomputed: it holds only while the entry it names is outside the window and focus is still on the explorer; it is cleared on every redraw that brings the mark back, when focus moves off the explorer, and when a story is opened or closed. Checks (E3): set when a focused mark leaves; empty after zooming back out by keyboard with focus still on the explorer; empty after Reset view; empty after opening another story and on its change record. Break `stale-status`.

**Wheel release.** Chosen meaning, and the instruction now says it: wheel zoom follows keyboard focus. "Wheel zoom is on while the pointer is over the timeline. Press Esc, or click or Tab somewhere else, to turn it off." A pointer that only moves away does not turn it off: over the rest of the page the wheel scrolls the page, and back over the timeline it zooms again. Checks (C): pointer off the timeline (page scrolls, window unchanged, still on); pointer back (zooms, no new click); a click elsewhere turns it off; Tab out turns it off; Esc.

**History coverage GPT asked for, now in E2:** saved window excluding the mark → reload directly; the same through a change record; resize 1280 → 390 on a change record and 390 → 1280 with a story open; plotted entry → Pliny → plotted entry in one history entry; the phone change-record chain with the window checked at each step (five checks).
**Back or reload inside the 200 ms deferred save: this was a real gap and is fixed.** Wheel and key input save 200 ms later. Before: a Back inside that interval dropped the last change for the entry left, and a reload dropped it too. Now every state the page writes carries a key, the newest window per key is also held in page memory and wins on return, and a waiting save is written on `beforeunload` and `pagehide`. Key input, which saved at once in rev 2, is now deferred like the wheel (a held key no longer writes the state 30 times a second). Breaks `no-win-memory`, `no-unload-save`. Limit, stated: if the user leaves an entry inside the interval and then reloads on a different entry, the first entry's last 200 ms of change is lost.
**A consequence to check:** the base entry's state now has a key (`k`) and the window, where it used to be `null`. The existing suites pass unchanged with this.
**Still unexercisable:** a direct link to an entry older than the landing window. The validator is not weakened; a fixture comes with a schema that allows such entries.

**Runs at rev 3 (09:50–10:17 SAST = 08:50–09:17 UTC, each alone; `reviews/evidence/2026-11-23-timeline-travel/run-rev3.log`):** generator `--check` passes; `timeline-changes-build` 45, `timeline-catalogue-hub` 73, `timeline-ui` 594, `timeline-axis` 96, `timeline-changes-ui` 173, `timeline-travel-ui` 207, `timeline-mixed-assets` 18 passed. `timeline-travel-ui` breaks: 20 of 20 caught; control against commit `a44e31d` fails (0 pass). `timeline-mixed-assets` `no-style-guard` caught. The existing suites' own breaks were not rerun at rev 3. Timings were not rerun.

## 9. Real-browser recheck of rev 3, and two faults it found (rev 4)
Claude, desktop app browser pane on Chad's Mac, review copy at `861b0f5` served on 127.0.0.1:8899, catalogue from the live hub, 11:19–11:21 SAST (09:19–09:21 UTC). The three page files hashed in the tab and equal to the branch's.
- **H1, GPT's steps, with the browser's own Back and Forward:** 471.45–202.05 → end-Permian opened → Zoom in → 404.1–269.4 (mark outside, story open, state holds that window) → Back: closed, 471.45–202.05 → **Forward: open, 404.1–269.4, saved window unchanged.**
- **H3:** a focused mark zoomed out of the window: focus on the explorer, status "End-Cretaceous mass extinction is outside this view."; after Reset view the status was empty.
- **Fault A (found here): a mark's pixel position was written into the history state.** The explorer stored each mark's x position in `data-x`. On entry links that attribute already means "which section to expand" (`conv`, `debate`), so opening a story from a mark saved `x: "1015.25"` in the state. Nothing visible followed from it (no section has that id), but the state was wrong. The explorer now uses `data-px`. Check: a story opened from a mark has `x: null`. Break `mark-x-in-state`.
- **Fault B (found here): wheel zoom stayed on after focus left, when no focus event was delivered.** The pane was in the background, where Chromium moves focus without sending `focusout`; the release depended on that event. The wheel handler now also checks where focus actually is: if it is not in the explorer, wheel zoom is turned off and the wheel is left to the page. Check: focus moved with `focusout` suppressed, then a wheel event → no zoom, not prevented, wheel zoom off. Break `no-focus-guard`.
- **A test weakness this exposed, fixed:** with the new check in place the older break `wheel-always` stopped being caught (the two conditions overlapped). A new check covers the case that separates them: a mark has keyboard focus, wheel zoom has not been turned on, and the wheel must still scroll the page. `wheel-always` is caught again.
- **Runs at rev 4 (11:26–11:39 SAST, each alone; `reviews/evidence/2026-11-23-timeline-travel/run-rev4.log`):** generator `--check` passes; `timeline-travel-ui` 209, `timeline-changes-build` 45, `timeline-catalogue-hub` 73, `timeline-axis` 96, `timeline-mixed-assets` 18, `timeline-changes-ui` 173, `timeline-ui` 594 passed. Breaks rerun at this code and caught: `no-focus-guard`, `mark-x-in-state`, `wheel-always`, `no-unload-save`, `restore-reveals`. **The other 17 travel breaks were last run at rev 3 and not again**; the suite has 22 breaks.
- The first six existing-suite runs in the log were made before the last check was added to `timeline-travel-ui`; that addition changed only that test file.

## 6. For GPT
1. Section 2, points 1 to 4 and 6: accept or correct.
2. Is the 32 px cap on a cluster's width acceptable, given a capped control sits at the middle of its own members?
3. Anything in the history rules you want exercised that section 3 does not list.

**Review copy:** `~/Documents/Mother Earth/_review/timeline-travel-rc/` (the branch tree; serve it with `python3 -m http.server 8899 --bind 127.0.0.1` and open `/timeline.html`). The hub must be reachable for the explorer to draw; otherwise the page shows its list, as designed. Plain-text copies of this record and the proposal: `_review/timeline-travel-rc/read/index.html`.
