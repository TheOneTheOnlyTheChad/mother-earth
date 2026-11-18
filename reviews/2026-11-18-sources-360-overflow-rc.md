# Review packet: `sources-360-overflow-rc` (Sources page 360 px overflow)

Written 18 Nov 2026 16:30 UTC (clock reading). Branch only: nothing merged, nothing deployed. Hub untouched (0.6.19).

**Chad's line (18 Nov):** "Go: fix the known Sources page horizontal overflow at 360 px on a separate branch, page/CSS only; no merge or deploy. Confirm the cause, make the smallest fix, and check 360, 390, 430 px plus tablet and desktop widths for overflow and readable content. Send GPT the review packet, head and hashes. If it needs a broader layout change, stop and explain before expanding scope."

## 1. What to review
- Code commit: `389b1843d4a0163888e2395ae92fa27e5ecdec82` (from main `094706e`). The branch head is the later commit that adds this packet and changes no other file.
- Seven files differ from main:

| File | Change | sha256 on the branch |
|---|---|---|
| `style.css` | one rule and its comment added (5 lines) | `510130083a7ae638c8a3f7a1f0584c0f7b88c80f14059ccb8a6c0372151008b8` |
| `index.html` | stylesheet key only | `0800e7459c688f3b790117ba0847ab4212360e9babf1e7b0e24bcfb15fbf444c` |
| `sources.html` | stylesheet key only | `158039cb1db811f8cab188792057ac948d4a3b44457d466f06515e639158063a` |
| `timeline.html` | stylesheet key only | `94c410e8620e3deb26365b1056ce64e6994b249e2effc4a2487c3bdeb1fa8d84` |
| `moon.html` | stylesheet key only | `fc90b97384b1b25e5357f46d3e9094e2988e3727863a3a863863ee85a81befe6` |
| `sun.html` | stylesheet key only | `99ab66e89675e1efe12c1e8758f823cfb203655ceed1ca57719c98626d8a900d` |
| `phase1/smoke-fixes.test.cjs` | Sources checks at seven widths, three new checks per width | `f8f1851c7d60ce7fbbbf0af490be4b547215f1a53d691fbfecf535c40278e371` |

- Stylesheet key: `style.css?v=202612181000` → `202612181300` on all five pages (one line each; no page had used the new key).
- No script, no hub file, no page wording changed.

## 2. Cause (confirmed on the live page and in the container)
- Live page, real fonts, 360 px wide, read 18 Nov 16:23 UTC: page 366 px wide (6 px over).
- One line is responsible. In the Moon section's paragraph "The sunlight table and its checks", the run `(phase1/skycraft/build_moonlight.py,` has no place a browser may break it: the file name is one unbroken string inside `<code>`, and the bracket before it and the comma after it stay attached. The run is 346.7 px wide; the text column at 360 px is 320 px (20 px padding each side), starting at 20 px, so the comma ends at 366.7 px.
- The `<code>` box itself ends at 357 px, inside the page, which is why a check of element boxes alone finds nothing. The text that crosses the edge is the comma after it.
- Found by hiding elements level by level until the page width returned to 360 px (`main` → that `p` → that `code`), and by reading the layout box of every text node.
- At 390 px and wider the run fits (350 px column or more), so only the narrowest width overflowed.
- In the container (stand-in fonts) the same line gives 367 px, the figure in earlier STATUS entries.
- The 6 Nov fix covered table cells only (`.doc td, .doc th { overflow-wrap: anywhere }`). This paragraph was added later (Moon "Lit as now", 15 Nov) and is running text, outside that rule. `moon.html` and `sun.html` already have the same allowance for all their code (`body.craft code`).

## 3. The fix
```css
.doc p code,.doc li code{overflow-wrap:anywhere}
```
- A file name or path in a paragraph or list item may break, only where it would otherwise overflow its line. Nothing is clipped, hidden, scrolled or resized. The text in the page is unchanged (the string is still one string for copy and search).
- Table cells keep their own rule; the label column's rule below 720 px is not touched.
- Considered and not done: break hints (`<wbr>`) in this one file name. It fixes this line only; the next long file name in a paragraph would overflow again.
- No broader layout change was needed.

## 4. Checks on the real page (browser pane, real fonts, 18 Nov 16:24–16:28 UTC)
Method: the branch's `style.css` was fetched from raw.githubusercontent at `389b184` and its sha256 checked in the tab. The live Sources page was loaded in a frame of each width, and its stylesheet switched live → branch → live inside the same loaded document, so the page's data is identical for both. The position and size of all 1,265 elements in `main` were recorded each time. Switching back to live reproduced the first reading exactly at every width (0 elements differ), so nothing else moved during the comparison.

| Width | Live: page width | Branch: page width | Text past the edge (live → branch) | Elements whose size changed | Elements that moved |
|---|---|---|---|---|---|
| 360 | 366 | **360** | 1 → 0 | 2 (that paragraph: one more line, +26.9 px; that file name: now on two lines) | 405 (everything below, down 26.9 px) |
| 390 | 390 | 390 | 0 → 0 | 0 | 0 |
| 430 | 430 | 430 | 0 → 0 | 0 | 0 |
| 768 | 768 | 768 | 0 → 0 | 0 | 0 |
| 1024 | 1024 | 1024 | 0 → 0 | 0 | 0 |
| 1280 | 1280 | 1280 | 0 → 0 | 0 | 0 |
| 1440 | 1440 | 1440 | 0 → 0 | 0 | 0 |

- At 360 px the file name reads `(phase1/skycraft/build_moonlight.` then `py, NAIF SPICE N0067): …` on the next line. Smallest text on the page is 13 px before and after. Widest table 340 px at 360 px, unchanged.
- Other pages that share the stylesheet, same method, 360 and 1280 px: `timeline.html`, `moon.html`, `sun.html`: 0 elements changed size, 0 moved, page width equal to the window. `index.html` is not a `.doc` page, so the rule cannot apply to it.
- These frames are emulated widths on a Mac, not a phone. Real phone and screen reader remain untested, as before.

## 5. Suites (container, stand-in fonts)
- `smoke-fixes` on main before this branch: 51 pass, 1 fail ("Sources 360: no page-level horizontal overflow", 367 against 360).
- `smoke-fixes` on the branch: **113 pass, 0 fail.** The Sources block now runs at 360, 390, 430, 768, 1024, 1280 and 1440 px with three new checks per width: no text in the page body is laid out past the page edge; every file name in running text is inside the page width and not clipped; the long file name is still one unchanged string in the page text.
- The branch's test file against main's `style.css`: 111 pass, 2 fail (the overflow check and the new text-edge check, both at 360). The new check sees the defect.
- Also on the branch: `desktop-overflow` 258 pass, `mobile-pass` 131 pass, `timeline-ui` 591 pass, `skycraft-ui` 77 pass.
- Not run: the rest of the regression (no script or hub file changed). `osmc-reliability-ui` and `terminator-ui` keep their known states on main.
- Run: `python3 phase1/serve-core-on.py` in the repo root, then `NODE_PATH=/opt/npm-tools/node_modules node --no-warnings phase1/smoke-fixes.test.cjs`.

## 6. Limits
- The rule lets a file name break at any character, so the break can fall mid-word (here before "py"). It is the same behaviour the table cells and the Moon and Sun pages already have.
- It covers `code` in paragraphs and list items. A long unbroken string in running text outside `code` (a bare URL, for example) is not covered; none overflows today at the seven widths.

## 7. Release (not requested; for Chad's own line later)
Page only. Merge to main, served-hash check of 21 page files, live read at 360 px. Rollback: revert the merge.
