# Timeline, "Humans and human relatives": rehearsal rev 2, for GPT's recheck

24 Nov 2026 · Claude · Timeline thread · branch **`timeline-finds-rc`**, head **`5cb9f1f`** (page commit **H2 = `624545e`**; main merged in at `9312029`, documents only).
**Chad's "go" (24 Nov 2026), after GPT's review** `reviews/2026-11-24-timeline-finds-rc-gpt-review.md` (of `db8e40e`): revise on the same branch, then recheck.
**Still a rehearsal. Nothing uploaded, pinned or released.** The live page serves `tl-2026-11-R3`; R3 regenerates byte-identical; hub 0.6.24 and `phase1/worker.js` untouched; the Animals pin is not moved; no email sent.

Rev 1 packet: `reviews/2026-11-24-timeline-finds-rc.md`. This packet covers only what changed and the new evidence.

## 1. What changed, item by item from GPT's review

| GPT item | Done | Checked by |
|---|---|---|
| Q2: above 2 Ma, a compact lane, not shifted or clipped marks | A window **wider than 2 Ma** shows the lane's heading and sentence, then one line: *"Not resolved at this scale. These finds are drawn, one row each, in a window of 2 million years or less."*, a **"Show the last 400,000 years"** button and one link per find. At exactly 2 Ma and below the rows are drawn as before. No mark is drawn or moved above 2 Ma | ui Z (landing), J (2.2 compact / 2.0 rows), M (three finds); breaks `coarse-off`, `coarse-at-2` |
| Q2: focus when a control disappears; Back/Forward; selection | The button moves focus to the first find's own link. A find with focus keeps it across the threshold: a wheel step out moves focus to that find's compact link, a step in moves it back to its row link. Opening a find from the compact lane brings its finite reference into a drawn view (the recent view if it is inside, else its own extent); Back restores the view it was opened from and the link that opened it; Forward reopens it drawn | ui Z, W; breaks `compact-focus`, `compact-backtarget` |
| Q2: data not hidden | Entry ids, no-JavaScript cards and entries, change-record links and direct links unchanged; the compact lane never says there are no finds | ui G, K, Z |
| Q3: cut first tick label | End labels are aligned by measurement (start at the tick, or end at it) and inset 4 px; the tick line keeps its coordinate | ui T, 7 windows × 2 widths; break `tick-centred` |
| Q1/Q4: visible keyboard focus | Explicit 2 px accent outline on find links, the compact button and links, and "Bring into view". The suite reaches each by Tab and checks the browser's own `:focus-visible` state, outline style, width and colour, that the outline lies inside the explorer and viewport, and that the link itself is the topmost element at the outline's pixels. At 400,000 years (Omo's chevron row, La Ferrassie's 14 px mark), at 50,000 years (La Ferrassie's 6.4 px range on a phone), and in the compact lane, at 1280 and 390 | ui V; break `focus-none`; screens `…/screens/focus/` (26 crops) |
| Q5: mixed calibrated endpoints, GPT's reproduction | Each find's axis claim names **one selected result** (`C1.r1`, `C2.r1`, `C3.r1`, `C7.r1`), listed in source check rev 1.3 §"One selected result per find" with its exact published notation. Generator and page now require the stored numbers to be **the notation's own numbers, at its precision**, and the claim's words (and, in the page, its date line) to give the same numbers. The generator also requires the result id to be listed once in the evidence record, with that exact notation. GPT's change (younger end 40.827) is refused by both | build C (8 new refusals, GPT's first); ui H (7 new, GPT's first); breaks `notation-unchecked`, `words-unchecked`, `record-unchecked` |
| Device-clock test at two clocks | Generator run with the clock faked to 1990 and to 2090: byte-identical catalogues and pages. Page opened with the browser clock fixed at 1990 and at 2090: every find's drawn ends, tick, chevron, caption, spoken name, the window sentence and the entries' text identical, at 400,000 and 50,000 years, both widths | build D; ui L; breaks `clock-in-catalogue`, `clock-datum` |
| No "exactly four" product rule | Counts come from the data. A rehearsal with three finds draws "(3 finds)", three rows, three compact links; generator builds with three and with one. At most four stays (B4's row rule) | ui M; build D |
| Q4: La Ferrassie | Corrected (§3) | build B; panel screen |
| Change-record wording, final count, lane status | Not changed: still rehearsal wording, for review with the release data | — |

**Served file changes since rev 1:** `timeline.js` (+37 / −7, build key `202612250700`), `style.css` (+12, appended `body.tl` rules), `timeline.html` (the three `?v=` strings). Generator +34 / −1. Rehearsal `finds.json` +9 / −7.

## 2. File identities at `5cb9f1f`

| File | SHA256 | Bytes |
|---|---|---:|
| `timeline.html` | `c97da485d3cb31361864893d12b391c674d1d5d2e6cd19cd9d0a442021820ae3` | 49,998 |
| `timeline.js` | `67c38ca668c03a99ffaa6572bb8ce2d96c12d4f8113be7c3ad92daea8dd71c5c` | 75,840 |
| `style.css` | `31d1f22d50ef1d243556f3e26381f10e5bce8de22a47e00f624711a47d6eae5c` | 87,377 |
| `phase1/timeline/build_timeline.py` | `7d025eaea978147230c6eaa51ee3971b0afd6b40e743442f43b6ee86db34c643` | 65,536 |
| `phase1/timeline/rehearsal-finds/finds.json` | `1bf0cc218f54d57fd6c8a1f6c4d3d212b67da9abcc546b5f30167e7dace1406c` | 11,275 |
| `phase1/timeline-finds-ui.test.mjs` | `d8b9ebabdcbdb7a406af7f968be121413734d1c737601455bcfa658652f6016e` | 54,388 |
| `phase1/timeline-finds-build.test.mjs` | `ea7c38e228c4890385ec5195b8a6108e33309f44b66edfb747581cdef3cd9918` | 22,201 |
| `docs/research/TIMELINE-HUMAN-RELATIVES-SOURCE-CHECK.md` (rev 1.3) | `407bd83f164a081626a186cc6f4c10b93e3a7743b9ec3145090f9d80d68a0610` | 17,636 |

Unchanged: `preview.mjs`, rehearsal `BUILD.json` and `changes.json`, R3 (`f1a5fab2…0993`), `phase1/worker.js` (`db4f9cdf…1aa5`).
Rehearsal catalogue `tl-2026-11-T2` (built outside the repository, never committed): 48,118 B, sha256 `0afd1910ba01ee30e3e03513032f8f252578466bc4da2e734bdd3fab658bdf9b`.

## 3. La Ferrassie, corrected

**My rev 1 packet §8 was wrong.** I read the 2023 abstract's 44.9–44.1 ka as the modelled age of the La Ferrassie 8 child. GPT read the full text: it is where the 95 % intervals of three individuals overlap. Corrected in source check rev 1.3 and in the entry.

**Who read what.** GPT read the passages in the publisher's PDF (locators pp. 99, 106, 115, 116). I could not retrieve the PDF: the proxy refused it from both the cloud workspace and the Mac shell, and the journal's article page still did not load in the browser pane (24 Nov, 10:58 UTC). The fetch tool returned a model summary of the full text that agrees with GPT on every point below. That is a summary, not my own passage read. DataCite lists the DOI as findable with no related correction; Crossref holds no record of it.

**The entry now says:**
- Attribution: *"Attributed to Neandertal by its mitochondrial DNA. The 2020 authors judge the fragment most likely part of the La Ferrassie 8 child's skeleton. A 2023 study says that has not been demonstrated."*
- The axis claim is unchanged: the fragment's own direct date, 41,700 to 40,800 calibrated years before 1950 (95.4 %), result `C7.r1`.
- A new context line, citing Guérin et al. 2023: *"A later study models the age of the La Ferrassie 8 child at 44,900 to 39,900 years ago, at 95 % credibility. It keeps this fragment's date as an alternative for the child, if the fragment belongs to it, and says that has not been demonstrated. That model is for the individual, not a date on this fragment."*
- The three-individual overlap is not shown anywhere. No mark for the child or for contemporaneity.

The 2023 paper's licence is recorded as not confirmed (the PDF is reported to say all rights reserved; HAL says CC BY-NC-SA); we paraphrase and cite only. Enquiry E4 is rewritten as an optional wording check (enquiry drafts rev 3), unsent. **This wording needs review before any freeze.**

## 4. Results

Claude, cloud workspace, Playwright Chromium 1.63, each suite alone on tree `5cb9f1f`, 24 Nov 2026 11:27–11:42 UTC. Logs: `reviews/evidence/2026-11-24-timeline-finds-rc-rev2/`.

| Suite | Result |
|---|---|
| **`timeline-finds-ui`** (1280 and 390) | **252 / 0** (rev 1: 171) |
| **`timeline-finds-build`** | **74 / 0** (rev 1: 62) |
| `timeline-ui` | 594 / 0 |
| `timeline-travel-ui` | 209 / 0 |
| `timeline-changes-ui` | 173 / 0 |
| `timeline-story-ui` (fixture images, as before) | 127 / 0 |
| `timeline-axis` | 97 / 0 |
| `timeline-mixed-assets` | 18 / 0 |
| `timeline-story-build` | 98 / 0 |
| `timeline-changes-build` | 49 / 0 |
| `timeline-catalogue-hub` | 74 / 0 |
| `hub-alignment` | 6 / 0 (worker.js = deployed hub 0.6.24) |
| `animals-tab-ui`, pin as on main (`fbad1b6`) | 277 / 3: exactly 13g, 13h, 13i (the three Timeline files are this change) |
| `animals-tab-ui`, `TL_MAIN=624545e` (H2) from the environment | **280 / 0** |

The ten older Timeline suites pass unedited. New sections of `timeline-finds-ui`: Z compact lane (14 checks), T ticks (28), V focus (6), W threshold crossing (12), L clocks (2), M three finds (6), and seven new page refusals in H.

## 5. Breaks and the old-code control

Every break fails a named check. Browser breaks ran on H2's code in three parallel lanes, each on its own ports (the first three started a minute before the H2 commit, on the same tree with the previous build key); `values-unchecked` reran on `5cb9f1f` (below). Logs: `…/breaks/`.

| Browser break | Fails | First named check that fails |
|---|---:|---|
| *rev 2* `coarse-off` (rows drawn above 2 Ma) | 2 | Z the landing lane is compact |
| *rev 2* `coarse-at-2` (compact at exactly 2 Ma) | 2 | J at a 2 Ma window the lane is drawn row by row |
| *rev 2* `tick-centred` | 14 | T end labels inside the explorer by 3 px |
| *rev 2* `focus-none` (outlines removed) | 6 | V each find's link shows a solid accent outline |
| *rev 2* `notation-unchecked` (page) | 3 | H refused: a bracket whose notation has a third number. GPT's reproduction is still refused here, by the words check |
| *rev 2* `words-unchecked` (page) | 1 | H refused: notation, values and date line changed together, the claim's own words not |
| *rev 2* `clock-datum` (calibrated range shifted by today's year minus 1950) | 3 | E La Ferrassie drawn at its true ends; L at both widths |
| *rev 2* `compact-focus` | 2 | Z the button moves focus to the first find's link |
| *rev 2* `compact-backtarget` | 6 | W one wheel step out: focus moves to Omo I's compact link |
| `values-unchecked` | 1 | H refused: stored ages that are not the source values, with the words and date line following them. **First run on H2: missed** (exit 0): the new words check also caught the old fixture, so this check was no longer the only line. New fixture added in `5cb9f1f`; rerun fails as named. The old fixture stays |
| `join-bar` | 4 | B one row per find and nothing else |
| `limit-as-point` | 16 | C drawn to scale |
| `limit-as-bar` | 2 | D Omo I drawn as a limit |
| `pm-dropped` | 2 | D the caption gives 233,000 ± 22,000 (2σ) |
| `open-side-fit` | 4 | D "Bring into view" frames the finite ± only |
| `chevron-scales` | 3 | D the chevron is on the older side and ends in nothing |
| `datum-unchecked` | 1 | H refused: counted from another year |
| `midpoint-as-age` | 4 | B no midpoint is printed |
| `finds-clustered` | 16 | A the extinctions lane counts its own five |
| `no-finds-validate` | 29 | H refused: a limit pointing the other way |
| `min-span` | 4 | E Zoom in unavailable at the limit |
| `ka-always` | 6 | J a 2.2 Ma window is ticked in Ma |
| `coarse-ticks` | 4 | E ticks finer than 100,000 years |
| `offscreen-text` | 2 | D never "not in this range" |
| `no-bring` | 2 | D "Bring into view" |
| `hit-area` | 2 | C every link at least 44 px wide |
| `row-order` | 18 | Z compact links in row order |
| **`OLD=1`** (main's `timeline.js`) | 43 | A the explorer draws from the rehearsal catalogue |

| Build break | Fails | First named check |
|---|---:|---|
| *rev 2* `notation-unchecked` | 2 | C refused: GPT's reproduction (41,700 to 40,827) |
| *rev 2* `words-unchecked` | 1 | C refused: notation and values changed together, the claim's own words not |
| *rev 2* `record-unchecked` | 3 | C refused: notation, values and words all changed to a mixed result, not the result the evidence record lists |
| *rev 2* `clock-in-catalogue` | 1 | D the device clock at 1990 and 2090 gives byte-identical catalogues and pages |
| `no-find-checks` | 43 | C refused: a fifth find |
| `ban-sources` | 44 | B the rehearsal source builds |
| `midpoint` | 2 | B each axis claim reads as its source states it |
| `pm-dropped` | 1 | B the same |
| `fifth-allowed` | 1 | C refused: a fifth find |
| `finds-at-schema-3` | 2 | A a finds file beside schema-3 sources changes nothing |

**What the result-identity check can and cannot do.** It refuses stored numbers that are not the selected result's own (GPT's case), words that disagree with the numbers, and a notation that is not the one the public evidence record lists for that result id. It cannot tell whether the evidence record matches the paper; that is source review.

## 6. Measurements

Rendered widths of the drawn finds are unchanged from rev 1 §6 (same at 2, 1, 0.4 and 0.05 Ma, both widths). `…/measure.json`.
Lane height (heading, sentence and content): landing view **134 px at 1280, 252 px at 390** (rev 1: 281 and 427, with four cut marks). Drawn views 281 / 427 px; 313 / 475 px at 50,000 years, where two rows carry "Bring into view".

## 7. Not proved, and not approved

- Focus was checked by computed style, `:focus-visible` and hit-testing, plus screenshots; not on a real phone, Safari, a screen reader or true 200 % zoom.
- Seen while writing the W checks, not traced: with the wheel turned on and a find's link focused, the first wheel step zoomed (0.4 to 0.646 Ma) and further steps did nothing. I have not checked whether main behaves the same with an extinction mark focused, or why. The W checks therefore cross 2 Ma in one step. Worth a look before a release candidate.
- The rehearsal change record, final entry count and lane wording still need review with the release data.
- Not a release candidate: no freeze record, REGISTER rows, Animals `TL_MAIN` maintenance, hub pin or upload. `BASE_MAIN` untouched. Nature context's `NC_MAIN` work is on its own branch and was not touched.

## 8. Questions for GPT

1. Do the compact lane's wording and behaviour meet Q2?
2. Does the result-identity design close Q5, with the boundary stated in §5?
3. Is the La Ferrassie wording in §3 acceptable for the rehearsal, before a freeze review?
4. Anything else before Chad's go for a release candidate?
