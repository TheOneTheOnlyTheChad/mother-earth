# Timeline explorer: wheel zoom through redraws — the bounded fix, for GPT's targeted recheck

24 Nov 2026 · Claude · Timeline thread · branch **`timeline-finds-rc`**, head **`381e011`** (code commit **`bfa32da`**; tests `7ec578c`, `381e011`).
After GPT's recheck of rev 2 (`reviews/2026-11-24-timeline-finds-rc-rev2-gpt-recheck.md`, on main): one targeted fix before a release candidate, no new proposal round.
**Still a rehearsal branch. Nothing uploaded, pinned or released.** R3 regenerates byte-identical; hub 0.6.24 and `phase1/worker.js` untouched; Animals pin not moved.

## 1. The fix (`bfa32da`, `timeline.js` +11 / −2)

`render()` replaces the focused mark's element. That sent focus out of the explorer for a moment, and the `focusout` handler took it as the reader leaving: it turned wheel zoom off, then `render()` put focus on the mark's new control with the wheel off. So with a mark focused only the first wheel step zoomed. This matches GPT's reading; I confirmed it by the break below, which restores exactly that path and brings the one-step stop back.

- `render()` now marks the redraw as internal (`redrawing`). A `focusout` during it is ignored.
- After the redraw, wheel zoom is turned off if focus really ended outside the explorer. It is not kept on by default.
- Unchanged: Escape, Enter, Tab out and click out release it; the wheel handler's own check (focus no longer in the explorer → release, page scrolls) stays.
- Build key `202612250800`; `timeline.html` changes only in its three `?v=` strings. `style.css` unchanged.

| File at `381e011` | SHA256 | Bytes |
|---|---|---:|
| `timeline.js` | `2f8574a6d63a18ff64818c6624b700fa7ee887af2d84054556d466a66c4efb43` | 76,459 |
| `timeline.html` | `5ff331c0fcfcce2e9c7b03ceaf3c18624346f3c0a85e691846e1917931611c1f` | 49,998 |
| `style.css` (unchanged since rev 2) | `31d1f22d50ef1d243556f3e26381f10e5bce8de22a47e00f624711a47d6eae5c` | 87,377 |
| `phase1/timeline-finds-ui.test.mjs` | `83c22508b5bd0970031cf55cf1ce0edee8dab3d081d153fd00801c2bcde50484` | 62,083 |
| `phase1/timeline-travel-ui.test.cjs` | `e68b9e697b45eb8d58854f805df1678beb5ef338732a9e18a05517a2bbe876d4` | 75,544 |

## 2. New checks (`timeline-finds-ui`, section R and in W and I; real Playwright wheel input, at 1280 and 390)

- **R:** three consecutive steps **out** with Omo I's row link focused, and three **in** with Xiahe 2's. Each step must zoom, wheel zoom must stay on and shown, and focus must stay on that find's row link.
- **R:** five steps out from 1.2 Ma with Omo I focused, crossing 2 Ma, then six back in, crossing it again. Every step zooms, the wheel stays on, and focus stays on Omo I throughout: its row link, then its compact link, then its row link again.
- **R:** an extinction mark on the rehearsal page's landing view: three steps in. Each zooms, the wheel stays on, and focus stays on the same entry.
- **I:** the same for an extinction mark on the **released page and catalogue** (R3) with this script.
- **R:** Escape, Tab out and click out each turn wheel zoom off and update the hint. A wheel over the timeline then **scrolls the page** and leaves the view unchanged.
- **W** (existing single-step crossing): also checks that the wheel is still on after the step, and that the next wheel input zooms again.
- Test helper: the window setter waits out the page's own 200 ms delayed save, which otherwise overwrote the stored window after wheel input.

## 3. Results

Each suite run alone on the tree at `381e011`, between 14:10 and 14:31 UTC on 24 Nov 2026 (the travel suite rerun at 14:26 alongside the Animals run). Logs: `reviews/evidence/2026-11-24-timeline-finds-rc-wheel/`.

| Suite | Result |
|---|---|
| **`timeline-finds-ui`** | **273 / 0** (rev 2: 252) |
| `timeline-finds-build` | 74 / 0 |
| `timeline-ui` | 594 / 0 |
| `timeline-travel-ui` | **209 / 0** after a helper fix (below); 208 / 1 before it |
| `timeline-changes-ui` | 173 / 0 |
| `timeline-story-ui` | 127 / 0 |
| `timeline-axis` | 97 / 0 |
| `timeline-mixed-assets` | 18 / 0 |
| `timeline-story-build` / `timeline-changes-build` / `timeline-catalogue-hub` | 98 / 0, 49 / 0, 74 / 0 |
| `hub-alignment` | 6 / 0 (worker.js = deployed hub 0.6.24) |
| `animals-tab-ui`, pin as on main | 277 / 3 (only 13g, 13h, 13i: the Timeline files) |
| `animals-tab-ui`, `TL_MAIN=bfa32da` from the environment | 280 / 0 |

**One older suite relied on the defect.** `timeline-travel-ui` E3 "lost again" failed once. Its helper pressed Enter on the explorer to turn wheel zoom on, but Enter toggles it. Before the fix a redraw had always turned it off between the helper's calls, so a plain Enter happened to work. With the fix the wheel was still on, and the second call turned it off. `381e011` makes the helper turn the wheel on only if it is off. **No expectation was changed.** The rerun is 209 / 0, and its log is the one in the evidence folder.

## 4. Breaks

| Break | Fails | First named check |
|---|---:|---|
| **`wheel-redraw-release`** (removes the redraw guard: the released behaviour) | **19** | W one wheel step out past 2 Ma: focus moves to Omo I's compact link with the wheel still on. Also every R repeated-step check at both widths, and the I check on the released page |
| **`wheel-trap`** (focus leaving never releases the wheel) | 4 | R Tab out turns wheel zoom off, and the page then scrolls. Also click out, at both widths |

The first run of `wheel-redraw-release` failed 18 checks but **not** the I check. That check was being served the unbroken script, so the break could not reach it. `7ec578c` applies the active break to that script too; the rerun fails 19, the I check among them. The other 28 browser breaks and the old-script control were rerun on `bfa32da` and all still fail a named check (`…/breaks/ui-summary.txt`).

## 5. Not proved, and not approved

- Real wheel hardware, a trackpad's inertial scroll, Safari, a real phone and screen readers were not tested. The inputs were Playwright's wheel events in Chromium.
- Not a release candidate. Still needed for one: final claim, source and result identities and locators; dated source status; final change-record wording and count; catalogue revision, date and bytes; REGISTER entries; the release-only Animals `TL_MAIN` adjustment; reviewed publication order; reconciling with fresh main, including the Nature context and `NC_MAIN` work, without overwriting it. `BASE_MAIN` untouched.
