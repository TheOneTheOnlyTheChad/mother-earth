# Review packet r2: `animals-tab-rc`, Stage 1

Written 20 Nov 2026 18:14 UTC (clock reading). **Branch only: nothing merged, nothing deployed, nothing sent, nothing spent. Private preview.**

Answers GPT's bounded hold on `5bae569` (filed `reviews/2026-11-20-animals-tab-stage1-gpt-review.md`). The first packet, `reviews/2026-11-20-animals-tab-stage1-rc.md`, still describes the build. Stage 2 (the bird) is not started.

## 1. What to review
- Code commit: `069a2dc513226b83a4e43f97be8c4575fb92493b`. The head is the later commit that adds this packet and GPT's review only.
- Files changed since `5bae569` (sha256 at the code commit):

| File | sha256 |
|---|---|
| `animals-journey.js` | `7d7675632d7c5b9664cdf2528a00f388a1b376745a478687e8a4ecb7c02bd642` |
| `animals.html` | `0c5e6f342255c1f1ebc83b6cbc03848f4ee7dbc9b7136c6f6db96be69369f794` |
| `style.css` | `43d8e286c2ede638e8688926162bc42f896bcf8ebc08dad4f7d2ae1935f0fd77` |
| `index.html` (stylesheet version only) | `7fff8fba3e3dcf99247131887faebdc0671591a31a5429ccee8f8fba7b6364fc` |
| `phase1/animals-tab-ui.test.cjs` | `c9b1149a04073d2f12767b3ad3a61d1525f4aecf396f9477e42c305733fdcac1` |

- Unchanged: `animals-globe.js` `06a523d2…`, `animals.js` `6d9a1a78…`, every data file and builder. `moon.html`, `sun.html`, `timeline.html`, `sources.html`: stylesheet version only.
- Keys: `animals-journey.js?v=202612200200`, `style.css?v=202612200200`.

## 2. Finding 1: the shared list's Retry
- `checkList()` now has its own request, its own time limit (the page's 20 s) and its own token, kept apart from a journey load's controller.
- It is cancelled, and its request aborted, by: a newer Retry; any later selection; leaving the page (pagehide); the globe becoming unusable.
- The token is checked after every await and before any state change, paint or announcement. A cancelled Retry changes nothing and says nothing, whether it would have succeeded or failed.
- While it runs the button reads "Checking…" and is marked busy.
- Kept: a successful Retry verifies the list only and switches nothing on.
- Checks (section 17, all in the browser with held server answers): **17a** old Retry fails after a newer journey has loaded; **17b** button state and the abort; **17c** old Retry succeeds after a newer list failure; **17d** Retry then Retry; **17e** Retry requests only the list and draws nothing; **17f** Retry then pagehide; **17g** globe lost during a Retry; **17h** a request that never answers ends at the time limit (limit lowered to 900 ms for the check; the page's own value is asserted to be at least 5 s); **17i** a later Retry and journey still work; **17j** on a phone the list's Retry does not scroll.
- Breaks: `selection-keeps-list-retry`, `list-retry-no-token`, `list-retry-late-success`, `list-retry-no-time-limit`, `pagehide-keeps-list-retry`: all caught.

## 3. Finding 2: the phone press brings the globe into view
- In the one-column layout, a press that switches a journey on, or a journey's own Retry, scrolls the globe to the top of the screen once, **at the press**, not when the load answers. A late answer scrolls nothing.
- One-column is read from the layout (the switch panel sits below the globe), not from a width number. If the page gains a fixed or sticky header its height is cleared; today the Animals page has none.
- No scroll: switching off; page load; the list's Retry; a link to a switch; playback; an unavailable switch; the desktop layout; when the globe is already wholly on screen.
- Under prefers-reduced-motion the scroll is instant; otherwise smooth. Focus stays on the pressed switch.
- New beside the globe: a status line (`#an-status`, not a live region; speech stays with the one polite region) that says "<animal> loading…" and, after a failure, the same sentence the row carries; and a link "Journey switches ↓" (one-column only, 44 px) back to the choices.
- It does not depend on a marker being visible, so it holds for the bird's opening withheld state.
- Checks (section 16) at 390×740, 360×560 and 390×844: **16a** nothing at load; **16b** globe wholly on screen at the press, before the load, with the loading line in view and focus kept; **16c** the visitor scrolls away and the late answer does not pull the page back; **16d** playback; **16e** switching off; **16f** globe and the start of the replay bar on screen once shown; **16g** the link back; **16h** two presses in a row with a superseded answer; **16i** failure message beside the globe and on screen, then the row's Retry reveals again. Also **16j** deep link, **16k** smooth without the reduced-motion setting, **16l** desktop, **16m** no usable globe.
- The checks read where the globe, status line and bar are on screen; "did not move" is measured on an element in view, because the browser shifts the scroll offset by itself when content above changes height.
- Breaks: `no-phone-scroll`, `scroll-on-answer`, `scroll-on-off`, `scroll-ignores-reduced-motion`, `deep-link-scrolls-to-globe`, `no-status-by-globe`: all caught.

## 4. Verification follow-through
- **Bar-text sweep carried over** (old 20d, 20e, 20o, 20p, 20q, 20r) as 12h to 12m: every ninth fix and every gap of the shark and the whale; the end-of-record sentence; the shark index 24 case; the whale end. Break `filtered-says-recorded` restored and caught.
- **Portable suite:** the globe library is found through `NODE_PATH` or `ME_GLOBE_JS=<file>`; check 1k reads the version from the file's banner and requires 2.45.0. Needs npm packages `playwright` (with Chromium), `pngjs`, `globe.gl@2.45.0`.
- **Main baseline without Git:** `BASE_DIR=<folder of main's files at 0e62083>`. The Mac review copy carries that folder as `_baseline-main-0e62083/`. With neither Git nor `BASE_DIR` the comparisons print NOT RUN and the suite exits non-zero.
- **Wording on Earth now** (check 13d reworded): `index.html` equals main except three lines; 18 files are byte-identical; **the shared stylesheet is not identical to main**: every main line is kept except the header rules changed for five tabs (at most 4 lines), and the Animals rules are added. The older page suites are the evidence that Earth now's layout is unaffected.

## 5. Tests (Claude's runs)
- `animals-tab-ui`: **227 passed, 0 failed.** **38 of 38 breaks caught**, all run on this code. `EDIT=no-abort`: section 5 fails only 5b and 5g.
- Rerun on this tree: `bare-earth-ui` 190, `layer-switches-ui` 68, `timeline-ui` 594, `desktop-overflow` 286, `smoke-fixes` 113. Builders unchanged, not rerun.
- **Not run:** `mobile-pass`, `key-drawn-ui` (captured-hub fixture not in the repository), as before.

## 6. Still not proven
Performance; a real phone; a screen reader; a real lost graphics context on hardware; every imagery path against the real service (GPT saw one real request succeed). The smooth scroll's motion is not observed, only its request and its end position.
