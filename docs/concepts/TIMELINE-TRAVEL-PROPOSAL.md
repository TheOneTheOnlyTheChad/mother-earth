# Timeline — travelling through time: Claude's reading of GPT's spec and a staged proposal

**Rev 2.1, 23 Nov 2026 (docs only): DECIDED by Chad in his own message, after rev 2:** "i agree on all 6 you can go". T1 three stages, stage 1 first · T2 layout A on desktop, B kept as the fallback · T3 all four lanes stay shown · T4 unpopulated presets shown as plain labels · T5 narrowest window 1 Ma, provisional · T6 after stage 1, the source refresh and then a bounded Human relatives proposal. **His go covers the stage 1 branch build only**: no merge, no hub change, nothing live. Build record: `reviews/2026-11-23-timeline-travel-rc.md`.

**Rev 2, 23 Nov 2026 06:55 UTC (clock reading). Docs only.** GPT reviewed rev 1 from the Mac copy (sha256 `71d37b5d…989ac`; review relayed by Chad, filed unchanged as the Project doc `claude/reviews/2026-11-23-timeline-travel-proposal-gpt-review.md`). Verdict: staged direction sound; revise before the build brief is treated as settled; no build or release clearance. Its answers and amendments are applied below and marked (GPT). GPT's review was a concept and code-reference read, not a test run. **Relayed GPT text is not Chad's approval. Chad's T1–T6 decisions and his own branch-build go are still open. Nothing is built or branched.**

**Rev 1, 23 Nov 2026 06:19 UTC (clock reading).** Written by Claude (Timeline feature thread) against GPT's "Timeline — travelling through time, concept specification rev 1" (23 Nov; Project doc `claude/concepts/TIMELINE-TRAVEL-SPEC-GPT-rev1.md`).

## 1. Baseline (measured by Claude in the cloud workspace, 23 Nov, 06:11–06:18 UTC)
- `main` = `a44e31d` (still so at 06:55 UTC). Catalogue `tl-2026-11-R2`, schema 2, sha256 `2f39aa30…0356`; `build_timeline.py --check` passes.
- Suites on main, each run alone: `timeline-changes-build` 45 passed; `timeline-catalogue-hub` 73 passed; `timeline-ui` 594 passed; `timeline-axis` 96 passed; `timeline-changes-ui` 173 passed. No failures. Deliberate breaks not rerun. Not run: `desktop-overflow`, `mobile-pass`, any real browser, the live page.
- `timeline.js` is 29,113 bytes, no library. `worker.js` on main says hub 0.6.19; STATUS records the live hub as 0.6.22 from another thread's branch.
- What the catalogue holds: five entries (16 claims, six cited sources by DOI), one shelf entry (Pliny), 12 period bands (Cambrian onward only), a window edge (538.8 Ma) and an overview edge (4567 Ma), four lanes. It holds no summaries, no causes, no "why included" text, no review-due dates, no bands older than the Cambrian.

## 2. Three stages, each with its own go
**Stage 1 — the explorer, presentation only.** Pan, zoom, presets, the larger readable region, the story panel regrouped, on the existing catalogue bytes. It tests exploration and presentation of the existing evidence. It does not yet prove the richer narrative experience (GPT).
**Stage 2 — evidence and schema.** A scope grouping, not one release (GPT): summaries with their evidence checks, "why included", review-due and overdue, source-check failure, older chart bands, the ICS release comparison, a first new content slice. Each is its own reviewable slice. Any changed catalogue bytes mean a new revision id, a Worker pin and a hub deploy.
**Stage 3 — keeping it current.** The scan and its mechanism. Its own proposal.

Stage 1 fits the Timeline's existing exception (a fixed, versioned catalogue). It adds no feed, no source request, no storage and no scheduled task.

## 3. Stage 1 in detail
**Files touched:** `timeline.js`; the `body.tl` block in `style.css`; the page template inside `phase1/timeline/build_timeline.py`; `timeline.html` (generated); the `timeline.js?v=` key with `const BUILD`; a Timeline-only `style.css?v=` key that no page has used; the three browser suites; one new suite `timeline-travel-ui`.
**Not touched:** `worker.js`, R2, `BUILD.json`, `big5.json`, `changes.json`, the catalogue file. **Stage 1 needs no Worker change and no hub deploy.** Check: the catalogue sha256 is still `2f39aa30…0356` and the generator's `--check` passes. A page release merges current main into the branch and never deploys main's older `worker.js` over the live hub (GPT).
**Shared stylesheet (GPT):** a new query key does not keep an old copy of `style.css` for other pages. Every new rule stays under `body.tl`; representative other pages are compared before and after (element boxes, as in START-HERE's stylesheet method); Timeline is checked with new HTML against the old stylesheet and the reverse; the build-id fallback stays. No all-page restyle.

**Interaction rules**
1. **Scale.** One linear scale per window: position = (window start − age) ÷ window length. Units and both edges are always printed. Bands, ticks, marks and clusters are all recomputed from the same bounded window, including after a resize (GPT). A resize changes pixel positions and never the saved age window (GPT).
2. **Window limits.** Widest 4567–0 Ma. Narrowest 1 Ma, **a provisional interface choice, not a figure derived from scientific precision** (GPT). Correction to rev 1: the ±0.024 Ma I cited is the ICS chart boundary margin carried in the catalogue's chart reference, not a source claim in `big5.json`; the plotted onset is ±0.037 Ma; neither sets a useful zoom limit. Never inverted, never past either edge.
3. **Presets.** Whole Earth and Complex life (the landing view, today's 538.8–0 window). Human relatives and Human history appear as plain labelled coverage plans, "No reviewed entries yet": not buttons, not styled as navigation, no Tab stop (GPT).
4. **Whole Earth** shows the 12 bands the catalogue has and says the older part has no bands in this release. No band or earlier story is drawn from memory.
5. **Marks and clusters.** Marks keep their true positions. The existing cluster rule (16 px) and true-width rule (4 px) are re-evaluated on every window change. **Every cluster keeps its entry list at every zoom, including the narrowest** (GPT). "Zoom to these" sets the window to the members' extent plus 15 % padding each side, clamped to the limits; if the members coincide (zero span) or would still cluster at the narrowest window, the action is not offered and the list is the control. It can never loop or be the only control and do nothing.
6. **Intervals at the edges (GPT).** An interval that intersects the window is drawn even when its plotted midpoint is outside: the drawn extent is clipped, an edge marker shows it continues, and its text keeps the real endpoints. Modelled and uncertainty extents keep their own distinct styles and labels and are never drawn as event duration.
7. **Pointer (GPT).** A press that moves more than 5 px is a drag: it pans and its release never opens a story. `pointercancel` and leaving the region end the drag cleanly. Hover and focus show a title and never select or open.
8. **Keys (GPT).** Marks stay links and buttons stay buttons, each with its native Enter and Space behaviour; no blanket key handler. When a redraw replaces the focused mark (it joined a cluster or left the window), focus goes to the cluster control that now holds it, or to the explorer region with the entry named in its status line.
9. **Wheel.** Wheel zooms only after the explorer is activated; a visible line says so ("Click or press Enter to zoom with the wheel. Esc releases."). Escape with wheel zoom active releases it and does nothing else; a second Escape acts as today (closes an open story). Leaving the explorer releases it. The page scrolls normally otherwise.
10. **History (GPT's rules).**
    - Pan and zoom never add a history entry. The window is merged into the current entry's state with `swap()`: `k`, `p`, `oid`, `from`, the entry, shortcut and direct-link fields are never dropped.
    - Opening a story saves the base window in the entry being left, then `put()`s. Close and Back restore that window; Forward restores the story's own saved window.
    - Switching entries while a panel is open still updates that history entry and adds none.
    - A direct link with no valid stored window uses a stated default: the landing window if the mark is inside it, otherwise the narrowest preset that contains it. Pliny leaves the explorer at its default (no axis age).
    - Reload restores a stored window only after validation: finite numbers, start older than end, within the limits, at least the narrowest span. Anything else falls back to the default.
    - A fragment link shares the entry, never the panned range. No window in the URL in stage 1.
11. **Story panel (GPT).** Every claim keeps its scope, qualifier, source link, locator and context exactly as in the catalogue. "How we know" holds the dated claims from sources; the ICS chart boundary sits under its own "Chart reference" label, apart from the evidence for the event. "What is uncertain" lists only fields the catalogue states (stated margin, bound, modelled range, approximate, "uncertainty not stated") in the catalogue's own labels; nothing is paraphrased into a new assertion. A heading with nothing under it is omitted. "Sources and changes" holds citations, status lines and change records. No new sentence is written.
12. **Previous and next (GPT).** Labelled "Previous / next entry on this view". Order is plotted age, ties broken by entry id; scope is the current window and lane. At the end it says "No more entries in this view" and offers a separate "Look in the whole timeline" action. Modelled positions keep their label and range. The order is navigation and never claims a proven before/after.
13. The generated no-JavaScript page and List mode keep every claim and link. If the hub's catalogue is refused, the explorer stays off as today.
14. Reduced motion: no transitions. No autoplay. No images.

**Two layouts** (GPT recommends A on desktop, with B kept as the alternative if A feels cramped)
- **A, side by side (desktop ≥ 1100 px):** controls row; overview strip; explorer about 60 % of the viewport height at full width; an opened story takes the right 40 % and the explorer narrows and redraws to the same window. Phone: story in a sheet over the lower 70 %. To be measured: the real plotting width with the story open, and short or narrow screens with the sheet up.
- **B, stacked:** explorer keeps full width at about 45 % of the viewport height; the story opens below in its own scrolling area with the selected mark kept in view. Phone: the explorer collapses to a 96 px strip while a story is open.

**Acceptance for stage 1**
New behaviour gets targeted breaks on its meaningful invariants and an old-code control where the behaviour is new; unchanged baseline checks only need to keep passing (GPT).
- position against an independent computation at five windows, after pan, zoom, resize and preset change; interval clipping with real endpoints in text;
- zoom anchored at the pointer; clamps at both limits; a **seeded** run of 200 random operations with no inverted, empty or out-of-range window, plus named edge cases: both limits, zero-span cluster, cluster at the narrowest window, interval across each edge;
- history: open, close, Back, Forward, reload, direct links including Pliny; the full entry → What changed → entry → Back/Forward path; entry switching with a panel open; stored state that is missing, non-finite, inverted or out of range; the two existing breaks on `put()` and `swap()` still catch;
- no story opens from hover, focus, passing or the end of a drag; cancelled and leaving pointers;
- **requests:** after the initial load has settled, pan, zoom and selection cause zero further application or source requests (request log). The initial catalogue read and page start-up assets are not counted. Catalogue refusal and the static fallback stay tested;
- dense and empty cases from generator fixtures (`--src`): 200 entries; an empty window shows "No reviewed entries in this range" with a working "nearest entries" control;
- keyboard and focus with a story open and closed; 200 % text; increased text spacing; 360, 390 px and intermediate widths; reduced motion;
- touch: dispatched touch events (handler paths only) and one pass in a touch-enabled browser context. Neither is a real device and neither is reported as one;
- other pages unchanged, and mixed old/new Timeline assets, as under "Shared stylesheet";
- existing withdrawal and "What changed" checks still pass.

**Performance: proposed targets, to be measured and then accepted or not by Chad** (GPT: define before measuring)
- Operation: one zoom step and one 100 px pan step, applied by script. Setting: workspace Chromium, 1280 × 800 and 390 × 844, layout A with the story closed and open. 20 warm-up operations discarded, 200 samples, three runs.
- Two figures reported separately: script and redraw work (start of the handler to the end of the redraw function), and visual response (start of the handler to the second following animation frame). A timer around scheduling a frame is not used as a rendering time.
- Reported: median, 95th percentile and the maximum observed in each run, for five entries and for the 200-entry fixture.
- Targets: script and redraw 16 ms median with five entries and 33 ms median with 200; visual response 50 ms at the 95th percentile with five. `timeline.js` under 60,000 bytes; no library.
- These say nothing about Chad's Mac or phone until measured there.

**Before any stage 1 release (not before the branch prototype):** each of the six cited sources' publisher landing pages is read again, by Claude in the browser pane or Chrome, with the date and what was read recorded. A page that cannot be read is named as an open check and taken to Chad for the assisted route or a decision; an old read is never called fresh, and missing metadata proves nothing (GPT; START-HERE 4k).

## 4. Where the spec and the project's rules or code disagree (GPT's replies in brackets)
1. **Story account and "why included" against "existing claims unchanged".** Stage 1 writes no new sentence. Later, "why included" is the inclusion criterion, not significance. [Agreed. A factual sourced account remains possible later.]
2. **Review-due, failure and overdue states** need schema 3: stage 2. [Agreed; the spec's combined acceptance list is to be corrected.]
3. **Empty lanes.** Chad's 10 Nov decision (show all four) stands unless he changes it. [Agreed: retain for the first prototype, then judge the real layout. Their presence must not imply reviewed content.]
4. **Whole Earth bands** older than the Cambrian need a catalogue change: stage 2. [Agreed.]
5. **ICS chart.** Tags `v2026-06.6` to `.9` exist (Claude, repository tags, 23 Nov); `chart.ttl` between `.5` and `.9` differs by 3,088 added and 3,252 removed lines, including changed namespaces. No scientific value compared. [Agreed: schema, translation, packaging and substantive changes are to be compared separately before the pin moves.]
6. **Upkeep.** A thread is not a service; the project rule is hub-first. [Agreed with a qualification: stage 3 compares hub DOI/status collection with bounded research by Claude on Chad's go or a designed scheduler. A literature review is not a deterministic collector. Both need scope, completion and failure records; neither publishes. Nothing is authorised.]
7. **Stable public identifiers** in the later schema. [Agreed. A DOI identifies a work, not the event, species or place. No guessed matches. Not retrofitted in stage 1.]
8. **Human-scale units and calendars** belong to that slice. [Agreed. Original values kept, conversions marked, none guessed.]
9. **Access.** Rev 1 said I had no record of a plan to close access. GPT reports that Chad told it, in their conversation, that Mother Earth is open while features are built and he intends to restrict access afterwards. Recorded here as **Chad's intent as relayed by GPT**: not an access plan, not proof of privacy, and no action follows from it. On record from Chad directly in this project: Mother Earth is his control tower, not for the masses.
10. **Source checks. Rev 1's last sentence was wrong** (GPT): a presentation-only release still republishes attributed sources, so the publisher-page reads are a pre-release requirement even with unchanged catalogue bytes. Now in section 3. It does not block the branch prototype.

## 5. Decisions for Chad (GPT's recommendation beside each; none of them is decided)
- **T1** Three stages, stage 1 first. *Claude and GPT: yes.*
- **T2** Layout A or B. *Claude and GPT: A on desktop, B kept as the fallback.*
- **T3** Empty lanes: keep all four shown or hide by default. *Claude and GPT: keep.*
- **T4** Unpopulated presets: plain labelled coverage plans, clearly unavailable, or left out. *Claude and GPT: shown as plain labels.*
- **T5** Narrowest window 1 Ma, provisional. *Claude and GPT: yes.*
- **T6** After stage 1: source refresh, then a bounded Human relatives proposal. *GPT: yes, per the roadmap; Chad may choose another slice.*

## 6. Next
Chad's T1–T6 and his own go for a stage 1 branch build. Then: branch from current main, build, suites, review copy on the Mac, GPT. No fresh literature research is needed to draw the branch prototype (GPT).
