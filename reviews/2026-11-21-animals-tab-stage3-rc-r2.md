# Review packet: `animals-tab-rc`, Stage 3 r2 (African penguin colony census): GPT's hold closed

Written 21 Nov 2026 07:02 UTC (clock reading). **Branch only: nothing merged, nothing deployed. Private preview.**

GPT's review of `6c301c5` (bounded hold, one required fix) is filed beside this as `reviews/2026-11-21-animals-tab-stage3-gpt-review.md`. This packet covers that fix only; packet r1 (`reviews/2026-11-21-animals-tab-stage3-rc.md`) still describes everything else.

## 1. What to review
- Code commit: `a23dda8be938b3c47a73e38712c90865096fb672`. The head adds this packet and GPT's review only. Comparison point: `6c301c5`.
- Changed files (sha256 at the code commit):

| File | sha256 | Change |
|---|---|---|
| `animals-census.js` | `5b7dddd50304ed6cff7d9dfa1fae93aae6ac5fcdb9761839d6c3e98addf4bbf2` | the open chart follows its box |
| `phase1/animals-census-ui.test.cjs` | `43b67a00ed059b8ccd81bd3ec3267bd9e5c0353fb0c12499a7737a2e3be347e2` | checks 9d to 9f, five breaks |
| `animals.html` | `f1505889ac91015c2768f00a743bc7d74bfb04cdc30ac741e2bb3267f994ab0a` | the census script's `?v=` only |

- **Identical to `6c301c5`:** the three census data files, the builder, its config and its test, `style.css`, `index.html`, `phase1/animals-tab-ui.test.cjs`, all journey scripts and files. No data rebuild.

## 2. The fix
- `openDetail` keeps a function that draws this colony's larger chart at either layout, and which layout is showing.
- `fitDetail` runs when the detail box changes size (a `ResizeObserver` on the box; a window `resize` listener where that is missing). If the box has crossed the narrow width (`C.NARROW_PX`, 560 px, the same threshold as before) it replaces **the chart's SVG element only**. It does not announce, focus or scroll, and it does not touch the heading, the notes, the scale line or the table.
- The drawing after a resize is the same function with the same arguments as a fresh open, so the scale top and every dot are the same by construction; the test checks the result is identical to a fresh open at that width.
- Closing, a reload or a failed state drops the kept function.

## 3. Tests (Claude's runs, all on the final files)
- **Census page suite: 71 passed, 0 failed** (64 before, plus 7). New, with the chart for Dassen Island left open, the table box focused and scrolled:
  - 9d reference: fresh opens at 1280, 390 and 360 px give the wide (720-unit) and narrow (360-unit) drawings, text at least 9 px as drawn.
  - 9d wide first, 1280 → 390 → 360 → 1280: at every width one larger chart, identical to the fresh open's at that width, smallest text at least 9 px as drawn, nothing overflowing.
  - 9e the same steps: selection, expanded button, scale, the same table element, the same year at the table box's top edge, and focus on the table box all kept; the live region unchanged; no call to `focus`, `scrollIntoView`, `scrollTo`, `scrollBy` or `scroll`. Then Escape closes and returns focus to the button.
  - 9f narrow first, 390 → 360 → 1280 → 390: the same three checks.
- **Breaks: 24 of 24 caught** (the 19 earlier ones rerun on the final file, plus five): no observer; refit only when narrowing; refit that announces; refit that reopens the whole detail; refit that scrolls.
- `EDIT=no-abort`: still only 5b and 5d fail.
- **Combined page suite `animals-tab-ui`: 277 passed, 0 failed.**
- Builder test without the zip: 38 passed (the builder and data are unchanged; the 41 with the zip is r1's run and GPT's own).
- Not rerun: the older page suites (none of their files changed since r1). Not run: `mobile-pass`, `key-drawn-ui`.

## 4. To say plainly
- **Table position is checked by the row in view, not by the raw scroll offset.** When the box narrows, the table's caption wraps onto more lines, so the same row sits at a different scroll offset; Chromium keeps the row in place. The check is "the same year at the box's top edge, within 2 px". A browser without scroll anchoring would keep the raw offset instead and the rows could shift by the caption's change in height (a few lines). Tested in Chromium only.
- The 2 px allowance is for sub-pixel rounding; the first run showed 1 px differences.
- GPT accepted, in its review: the marker explanation, the licence wording, rounded scales, the methods summary, the later-file difference counts; and that P-D0 needs no restatement for this feature.

## 5. Not proven, not done
As packet r1 §7: a real phone, a screen reader, performance, print; Sources page, REGISTER, public release.
