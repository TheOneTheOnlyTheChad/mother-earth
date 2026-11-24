# Timeline explorer: travel record §9, the two fixes — review packet for GPT (item 1 of the close-out index)

24 Nov 2026 · Claude · Timeline thread · **Docs and test runs only. No page, catalogue, hub or account change. Nothing here is a release.**

Index: `reviews/2026-11-24-timeline-closeout-index.md`. Record under review: `reviews/2026-11-23-timeline-travel-rc.md` §9 (rev 4).

## 1. What GPT is asked to look at
Section 9 of the stage-1 build record reported two faults found in the real-browser recheck of rev 3, both fixed in one commit before the stage-1 release. GPT reviewed rev 2 and rechecked rev 3; **it has not reviewed §9's two fixes.** This packet gives the exact change, where the code is now, and fresh runs on current main.

## 2. The commit
- **`4913d18`** (23 Nov 2026 09:39:19 UTC commit time), on the branch `timeline-travel-rc`, released in page merge **`03aff0a`** (23 Nov 10:05:11 UTC) and still present in page merge **`19f4e07`** (24 Nov). Both ancestries checked with `git merge-base --is-ancestor`.
- Files: `timeline.js` (7 lines), `phase1/timeline-travel-ui.test.cjs` (25 lines), and build key bumps in `timeline.html` and `phase1/timeline-changes-ui.test.cjs`. Exact diff of the two relevant files: `reviews/evidence/2026-11-24-timeline-closeout/4913d18-travel-s9.diff` (128 lines).
- **Unchanged since:** `git diff 4913d18 5b3d9ba -- timeline.js` (87 changed lines, all from the R3 story work) touches none of the lines below.

## 3. Fault A: a mark's pixel position was written into the history state
**Cause.** On entry links `data-x` already means "which section to expand" (`conv`, `debate`). The explorer also stored each mark's x position in `data-x`, so opening a story from a mark saved `x: "1015.25"` in `history.state`. Nothing visible followed (no section has that id), but the state was wrong.

**Change (4913d18).** The mark's position moved to `data-px`. The click handler that reads `data-x` was not changed: for a mark it now reads nothing, so `x` is `null`.

| Where, at main `5b3d9ba` (`timeline.js` sha256 `55043697…7524`) | Line |
|---|---|
| `render()`: mark writes ``data-px="${g.x.toFixed(2)}"`` | 580 |
| `layoutLabels()`: reads `parseFloat(el.dataset.px)` | 647 |
| card/mark click: `x = a.dataset.x \|\| null` (section to expand; untouched) | 167 |

**Check:** `timeline-travel-ui` E, "opening a story adds one entry whose state has the entry, its keys and the window" now also requires `s.s.x === null`. **Break `mark-x-in-state`** puts both `data-x` and `dataset.x` back.

## 4. Fault B: wheel zoom stayed on after focus left, when no `focusout` was delivered
**Cause.** Wheel zoom was released only by `focusout`. In a background window Chromium moves focus without sending `focusout` (seen in the desktop app's pane), so the wheel still zoomed.

**Change (4913d18).** One line at the top of the wheel handler, after the "not on" return: if focus is not inside the explorer, turn wheel zoom off and return without `preventDefault`, so the page scrolls.

| Where, at main `5b3d9ba` | Line |
|---|---|
| click on the explorer arms the wheel (`setWheel(true)`) | 717 |
| **wheel handler: `if (!xpl.contains(document.activeElement)) { setWheel(false); return; }`** | 721 |
| Esc releases; Enter toggles | 728, 731 |
| `focusout` release (unchanged, still the normal path) | 736 |

**Checks (C section):** (1) focus moved with `focusout` suppressed in the capture phase, then a wheel → no zoom, not prevented, wheel zoom off. **Break `no-focus-guard`** deletes the line. (2) The check that separates it from `wheel-always`: a mark has keyboard focus, wheel zoom was never turned on, and the wheel must still scroll the page. Without it, `wheel-always` stopped being caught once the guard existed (the two conditions overlapped). Tests that zoom by wheel now focus the explorer first (`x.focus(); x.click()`), since a click in a headless page does not always move focus.

## 5. Results on current main (Claude, cloud workspace, Playwright Chromium 158.0.8127.36, each run alone)
Tree: main **`5b3d9ba`** (includes the Animals landing `9969bc3`); page files unchanged from `19f4e07`. Log: `reviews/evidence/2026-11-24-timeline-closeout/travel-main.log`.

| Run | Result |
|---|---|
| Whole suite | **209 pass, 0 fail** (04:37 UTC) |
| All **22** breaks, including `no-focus-guard`, `mark-x-in-state`, `wheel-always` | **all 22 fail** (04:38–05:01 UTC) |
| Control `OLD=1` (page files of `a44e31d`, before stage 1) | **fails: 0 pass, 1 fail (threw)** (05:02 UTC) |

This closes the gap §9 itself recorded: "the other 17 travel breaks were last run at rev 3 and not again."

### 5a. Run outcome
Fail counts per break, at main `5b3d9ba`:
`bad-state-accepted` 8 · `chart-under-how` 1 · **`mark-x-in-state` 2** · `nav-pushes` 5 · `new-sentence` 1 · `no-clamp` 2 · `no-clip` 4 · **`no-focus-guard` 1** · `no-restore` 10 (threw) · `no-unload-save` 1 · `no-win-memory` 1 · `nonlinear` 17 · `pan-pushes` 16 (threw) · `plans-focusable` 1 · `requests` 1 · `resize-moves-window` 21 · `restore-reveals` 6 · `stale-status` 1 · `state-clobber` 10 · **`wheel-always` 1** · `zoom-always` 3 · `zoom-outer-only` 2.

`no-restore` and `pan-pushes` stop part-way (the suite throws after a failed check); both still exit 1 with failures counted, the same shape the earlier records show.

## 6. Failure controls, stated plainly
- **Each fix has its own break**, applied to the served script only, and each is caught (§5a).
- **`wheel-always` is caught at this code**: that is the evidence the two overlapping guards are separated.
- **`OLD=1`** fails on the page before stage 1, as it did in the 23 Nov runs. **It is a weak control:** it fails by throwing at the first explorer lookup (the old page has no explorer), not on a named check. It shows the suite does not pass on the old page, nothing more.
- **Not shown by any run here:** the background-window focus behaviour itself. The suite simulates it by suppressing `focusout`; the real case was seen only in the desktop app's pane on 23 Nov (§9). A real phone, Safari and a screen reader were never run.

## 7. Questions for GPT
1. Is reading `data-x` for "section to expand" and `data-px` for "mark position" a sufficient split, or should the click handler ignore `data-x` on marks explicitly (`opener === 'mark'`)?
2. Is checking `document.activeElement` in the wheel handler an acceptable release rule, given it also turns wheel zoom off silently when focus has gone to a child of the page outside the explorer?
3. Is suppressing `focusout` in the capture phase an adequate stand-in for the background-window case?
