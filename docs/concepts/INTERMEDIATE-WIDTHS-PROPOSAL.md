# Layout at intermediate widths — proposal (rev 2: GPT review recorded; §6 governs)

15 Nov 2026 · docs only · nothing built · page only · main `9bc05bb`
Last item from `CONTROL-CENTRE-USABILITY-BRIEF.md` (W1, W2). This one needs a layout decision before any build, so it sets out options with the measurements.

## 1. What main does (measured 15 Nov, real fonts; `reviews/evidence/2026-11-15-usability-repro/tablet.txt`)

**W1. 721–1100 px (one column: globe, legend, credits, then cards).**

| Viewport | Globe ends at | First layer switch at | Buoys / microplastic switches at | Switches on screen with the globe |
|---|---|---|---|---|
| 768 × 1024 | 629 | 1015 | 1913 / 2104 | 0 of 6 |
| 820 × 1180 | 717 | 1087 | 1955 / 2132 | 2 of 6, at the bottom edge |
| 1024 × 768 | 486 | 811 | 1599 / 1776 | 0 of 6 |
| 1100 × 800 | 504 | 829 | 1617 / 1794 | 0 of 6 |

Changing a layer means scrolling the globe off screen, then scrolling back to see the result.

**W2. 1101–1279 px (three columns).** The credits block under the globe is 160–219 px tall (219 of 800 at 1101 px) and the legend covers 10–12% of the globe box.

Clean at every width tested: no sideways scroll, no clipped or overlapping header item.

## 2. Options

**For W1**

| | Change | Effect | Cost |
|---|---|---|---|
| **A. Globe stays in view** | At 721–1100 px the globe box is sticky under the header; cards scroll beneath it | Every switch can be used with the globe visible | CSS only. At 1024 × 768 the globe keeps 430 px, leaving about 280 px for the cards |
| **B. Switch strip** | A one-line strip of the six layer switches directly under the globe, mirroring the card switches | Switches are next to the globe without scrolling; cards stay where they are | New markup and script; two controls for one state must stay in step |
| **C. Two columns from 900 px** | Cards beside the globe from 900 px up; one column only at 721–899 | Fixes 900–1100; 721–899 unchanged | CSS; the globe narrows to about 55% of the width |

**For W2**

| | Change | Effect | Cost |
|---|---|---|---|
| **D. Credits move** | At 1101–1279 px the credits go to the foot of the right-hand column | The globe gains 160–219 px of height | CSS; credits stay fully visible, lower on the page |
| **E. Legend below the globe** | At 1101–1279 px the legend sits under the globe, not over it | Nothing covers the globe; the globe loses the legend's height | CSS |

**Not offered:** hiding the credits behind a disclosure. Several sources require visible credit; that would need a REGISTER check per source first.

## 3. Recommendation

A for W1 and D for W2: both are CSS only, keep every control and credit visible, and can be judged from before-and-after screenshots at the four W1 sizes and three W2 sizes. B is the fallback if A leaves too little room for the cards on a 768-px-tall screen.

## 4. Acceptance checks (for whichever options are chosen)

- At 768 × 1024, 820 × 1180, 1024 × 768 and 1100 × 800: after scrolling to each of the six switches, at least 300 px of the globe's height is still on screen (A), or all six switches are on screen with the globe at scroll 0 (B, C).
- At 1101 × 800, 1180 × 820 and 1279 × 720: globe height grows by at least 150 px (D); legend overlap with the globe box is 0 (E).
- Credits text is fully visible and unchanged at every width.
- No sideways scroll, no header overlap, at 721, 768, 900, 901, 1100, 1101, 1139, 1140, 1279, 1280 px (`desktop-overflow`).
- Phone (≤ 720 px) and ≥ 1280 px are pixel-for-pixel unchanged in layout measurements (`mobile-pass`, `desktop-overflow`).
- Before-and-after screenshots attached for GPT and Chad to judge by eye. **This item needs Chad's eye on a real screen before release**; measurements cannot say whether it looks right.

## 5. Decisions

- **L-D1.** W1: A, B or C.
- **L-D2.** W2: D, E, both, or leave.
- **L-D3.** Whether W2 is worth doing at all: it is a comfort issue, not a fault.

## 6. GPT review of rev 1 (relayed by Chad, 15 Nov) — governs where it differs from §3–§5

**L-D1 decided: A** (globe stays in view at 721–1100 px), with these conditions:
- The sticky globe is sized by viewport height, so a short landscape screen (1024 × 768, 1100 × 800) still leaves usable room for the cards. The share is set in the preview and reported with the measurements.
- Preview check, per size: scroll to each of the six switches, activate it, and confirm the result is visible on the globe without scrolling back.
- Keyboard: tabbing through the cards never leaves the focused control hidden under the sticky globe.
- Touch: a swipe that starts on the cards scrolls the page; the sticky globe cannot trap it. (A swipe on the globe turns the globe, as now; reported, not changed.)

**L-D2 / L-D3 decided: preview D alone** at 1101–1279 px; E is not built. D is kept only if it gives back the proposed globe height without making the credits hard to find; Chad judges the before-and-after on his own screen.
- The footer sits inside the centre column today, so a small markup change is allowed if CSS alone cannot put it in the right-hand column's scroll flow.
- Exactly one visible credits block at every width; text unchanged.

**This is a preview build.** A and D go on a branch with before-and-after screenshots and measurements; nothing is released until Chad has looked at it on a real screen. D can be dropped from the branch without touching A.

Added acceptance checks:

| | Check |
|---|---|
| A | At the four W1 sizes: each switch activated at its own scroll position changes what is drawn while at least 300 px of globe is on screen; cards area height reported per size. |
| A | Focus walk through every focusable control in the cards: focused element's box never overlaps the sticky globe's box. |
| A | Touch-emulated swipe on the cards changes page scroll at each W1 size. |
| D | One credits block visible at 721, 1100, 1101, 1279, 1280 px; its text equals main's; globe height gain reported at the three W2 sizes. |

Status: ready to build as a preview on Chad's own Go line. Page only.
