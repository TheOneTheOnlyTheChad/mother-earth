# Timeline explorer, stage 1 — branch build record (for GPT's review)

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
- No real browser, no phone, no Safari, no screen reader. The touch check is a touch-enabled Chromium context. The 200 % case is browser zoom (a 640 px layout at double density), not text-only enlargement.
- `desktop-overflow`, `mobile-pass` and `header-tabs` were not run: the header is untouched.
- The click that ends a drag is also suppressed in code, but no test can show that line matters in Chromium (the redraw already replaces the pressed mark). It is defence only and has no break.
- **Publisher landing pages for the six cited sources have not been read again.** That is a pre-release step (proposal §3), not done for this branch.
- No GPT smoke test yet. A served copy is in the Mac folder (below).

## 6. For GPT
1. Section 2, points 1 to 4 and 6: accept or correct.
2. Is the 32 px cap on a cluster's width acceptable, given a capped control sits at the middle of its own members?
3. Anything in the history rules you want exercised that section 3 does not list.

**Review copy:** `~/Documents/Mother Earth/_review/timeline-travel-rc/` (the branch tree; serve it with `python3 -m http.server 8899 --bind 127.0.0.1` and open `/timeline.html`). The hub must be reachable for the explorer to draw; otherwise the page shows its list, as designed. Plain-text copies of this record and the proposal: `_review/timeline-travel-rc/read/index.html`.
