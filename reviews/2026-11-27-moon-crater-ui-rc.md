# Moon item 5 (CRaTER) — page-only branch preview: packet for GPT's review

27 Nov 2026, written from 11:52 UTC / 13:52 SAST (clock reading) · Claude · **branch `moon-crater-ui` only: not merged, not deployed; no hub, R2 or collector change; no new acquisition.**

**Chad's go (27 Nov 2026, his own line, confirmed in chat):** "Accept D1–D5 and D7 as recommended. Go for a page-only CRaTER branch preview under proposal rev 2 with GPT's build notes. Use the retained sources, preserve the existing dated path and controls, and return the candidate and evidence for GPT review. No new bulk acquisition, merge or deployment."
- He confirmed it was his go when asked: GPT's recheck carried the same line as a suggestion.

**GPT's rev 2 recheck:** filed unchanged as `reviews/2026-11-27-moon-crater-proposal-rev2-gpt-recheck.md` (sha256 `699d934a…5d99`). It is a PASS at proposal stage, with build notes 1–4.

## 0. The candidate

| | |
|---|---|
| Branch | `moon-crater-ui`, from main `d702860` |
| **Tested commit (frozen worktree)** | **`d6f9a0f`** (the packet commit after it adds records only) |
| Page files | `moon.html` (changed), `mooncrater.js` (new, 10,913 B, sha256 `6bf7ce28…`), `mooncrater.css` (new, 1,670 B, `ca995950…`) |
| Data | `assets/moon/crater/crater-good-2026-06-10-R1.json`, 3,908 B (1,710 B gzipped), sha256 **`50ef3c0cfd64879f429093e60bcd02ee1511480250f3615225ed12a0bbf19a5c`** (pinned in `mooncrater.js`) |
| Builder | `phase1/moonsci/build_crater.py`; fault tests `phase1/moonsci/crater/test_build_crater.py` |
| Page suite | `phase1/moon-crater-ui.test.cjs` |
| Unchanged | `craft.js`, `moonglobe.js`, `moonlight.js`, `moonsci.js`, `moonlroc.js`, every other page, the dated path files, `sources.html`, REGISTER, the hub |

## 1. What the page does
- **Off by default.** Below the drawing's readout on `moon.html` there is a new button, "Show CRaTER's event counts (dated record)". Nothing is requested until it is pressed.
- **On opening**, one same-origin request fetches the pinned file. The page then checks the sha256, parses the file and validates the whole payload before drawing anything.
- **The chart:** 145 ten-minute groups, by UTC record time, of events a second. Each group has a line and approximate counting-benchmark bars.
  - The y axis starts at 0 (ticks 0–40), so the 12:40–13:10 rise is not exaggerated. This is Claude's choice for GPT's note 4.
  - A withheld group is drawn as a hatched gap.
  - The selected group is highlighted.
- **Readout** (`aria-live="polite"`), for example: "10 June 2026, 12:00–12:10 UTC (grouped by record time): **28.96** events a second, ±0.22 approximate counting benchmark (17,378 events in 600 s). Instrument counts on LRO, not a dose or a surface value."
  - The extra group reads "11 June 2026, 00:00–00:10 UTC (the extra group)".
  - A withheld group reads "no value", with its reason and record counts.
- **Selection:** `craft.js` already sends `me:craft-select` with the drawing's selection; the chart listens and does not change `craft.js`.
  - Group index = floor((t − 10 June 00:00 UTC) ÷ 600 s), only when the selection is the dated example `craft-moon-2026-06-R1`.
  - Anything else selects no group, and the readout says so in words.
  - The chart draws no position, path or footprint.
- **Text alternative:** the chart is labelled (`role="img"`, title plus a one-line description). A collapsed table lists all 145 groups: events, events a second and the benchmark.
- **Wording:** the explanation is GPT's suggested text, as adopted in proposal rev 2 §11. It also has the bars note, the coverage note and the source with its DOI.
  - The heading badge reads "Observed", as on the Apollo 11 panel. GPT may prefer another label.
  - `moon.html`'s "Sources and method" list gains one line for CRaTER. The `sources.html` section and REGISTER wait for the release candidate.

## 2. GPT's build notes and where each is met

| Note | Where |
|---|---|
| **1** fixed field locations and lengths; types and ranges; timestamps; assert source equality and coverage on the selected records (10 June + 600 records of 11 June); hashes before processing; fault modes outside the builder; unknown arguments do not bypass integrity | `build_crater.py`: the label's 32 field locations and lengths, a separator check at every boundary, TIME quoted at its label place, ints and %11.4e reals by pattern, flags 0/1, FRACT ≤ 99. MD5 and sha256 are checked before `parse()`. It asserts 87,000 selected records and that GOOD over the bins equals GOOD over the selection. Argparse with `allow_abbrev=False`, so an unknown argument exits 2. No fault switches: the faults live in `test_build_crater.py`. |
| **2** integer N and nominal T authoritative; rate and benchmark derived; rounding stated; withheld with reason and no zero; legend says benchmark; one-sigma and exclusions in the explanation and Sources | The file holds only `[N, T]`, or `[null, null, reason, records, nominal]`. The page derives N/T and √N/T to 2 decimals, and the file states that rounding. Withheld reasons are limited to `incomplete` and `non-nominal setting`. The legend says "approximate counting benchmark". The file's `derived_on_page` text and the caption carry the qualifications; the full one-sigma sentence goes into `sources.html` at the release candidate. |
| **3** concrete deadline and schema; bounded load with generation checks; late answers cannot reopen or replace; fallback, retry, edge selection, extra-bin label; errors leave the drawing usable | One 10 s deadline covers the fetch, bytes, hash, parse, checks and preparation. A generation token is checked after each await and before committing, and close or reopen aborts the fetch. Retry appears on failure. The schema is fixed in `check()` (§3). Tests in sections C, E and F. |
| **4** no colouring, dose, flux, hazard or origin; truncated axis made obvious; benchmark not shown as a confidence interval; the slider is a group selector | No map or path colouring, the axis starts at 0, and the bars are described as a benchmark that does not cover the observed scatter. The coverage note says "The time chosen in the drawing selects a group; it does not place an event on the path." Test B7 checks the wording and forbidden words. |

## 3. Schema (`crater-good-bins-1`) and what the page checks
- **Fixed checks:**
  - `schema`, `revision` (`crater-good-2026-06-10-R1`);
  - `source.doi` `10.17189/2c1t-ph72`, `source.release` 67;
  - `binning.start` `2026-06-10T00:00:00Z`, `bin_s` 600, `n` 145;
  - `live_time_correction` false, `timing_offset_applied` false;
  - exactly 145 rows.
- **Rows:**
  - A shown row is `[N, 600]`: an integer ≥ 0, at most 600 × 1,200 (the reporting ceiling of about 1,200 events a second).
  - A withheld row is `[null, null, 'incomplete' | 'non-nominal setting', records 0–600, nominal ≤ records]`.
  - Any other shape fails the whole load ("the file is not in the expected form").
- The file also carries provenance (product, DOI, bundle DOI, release, archive, author, both source files with MD5 and sha256), the binning text, the nominal settings and the two derivation definitions.
- **Build note for GPT:** with these pinned inputs an incomplete group cannot occur. The label's record count plus strictly increasing seconds within a UTC day means every second is present. If records were ever missing, the builder stops on the 87,000 coverage assertion (test D2). The withheld-incomplete path is exercised in `make_bins` (test D1) and in the page (D section, via a served variant). Non-nominal withholding is the path real data could take.

## 4. Evidence

All of this ran on the frozen worktree at `d6f9a0f`, served by `python3 -m http.server 8899` from that tree, 11:15–11:49 UTC. Headless Chrome with SwiftShader, globe.gl 2.45.0, and `craft.js` with the dated example served as the hub would.

| Check | Result |
|---|---|
| `build_crater.py --check` | CHECK OK: the committed file equals a fresh build |
| `test_build_crater.py` | **28/0**: A1–A4 (asset = fresh build; every bin N equals the research preview from a different parser; totals 2,573,044 and 17,787); B1–B4 (one changed byte stops at the hash check before parsing; also with `--check`; an unknown argument exits 2; `--check` against an altered committed file fails); C1–C13 (each strict-parse fault); D1–D7 (withheld incomplete or non-nominal, not zero; GOOD 0 stays a value; the 00:10:00 record belongs to the second group; the selection ends at 11 June 00:09:59) |
| **`moon-crater-ui`** | **49/0** |
| Breaks | **11 of 11 caught, each "BREAK applied (pattern found)", 0 setup failures**: `eager` (7 FAIL), `nopin` (1), `edge` (5), `late` (1), `nodeadline` (3), `zero` (1), `shape` (1), `bench` (2), `rev` (1), `retry` (13), `extra` (2) |
| `moon-globe` | 67/0 |
| `moon-lit` | 138/0 |
| `moon-lro-path` | 68/0 |
| `moon-diviner-ui` | 178/0 |
| `moon-lroc-ui` | 78/0 |
| `moon-height-ui` | 110/0 (`LOLA_SRC` = the retained `ldem_4_float.img`) |
| `skycraft-ui` | 77/0 |
| `tides-ui` | 60/0 |
| `timeline-ui` | 594/0 |
| `tides-nav` | 2,882/0 |
| `timeline-mixed-assets` | 16/2: **the main baseline**, identical to the documented 16/2 on main; not this change |
| `animals-tab-ui` | **298/2: both 13e** (`moon.html` pinned to its released bytes). **Expected for any `moon.html` change.** Moved by a narrow pin commit at the release candidate, as for items 2–4 |

- **Suite coverage, `moon-crater-ui`:**
  - **A:** no request before opening; no hub request added.
  - **B:** the table equals the file (N, N/T, √N/T at 2 dp); labels; the readout at the default time; 145 lines with the highest at 12:50; the zero-based axis; the wording.
  - **C:** minutes 0, 9, 10, 769, 1,439 and 1,440 select groups 0, 0, 1, 76, 143 and 144; the Earlier button; the highlight; a non-example selection and a cleared selection.
  - **D:** a withheld group shows "no value", reason and counts, one hatched gap and no line.
  - **E:** 404 with Retry recovery; integrity; unreadable; seven wrong-form variants; timeout. Each shows its reason and Retry, draws nothing, and leaves the drawing and slider working.
  - **F:** closed while loading; reopened with an older pending answer; an answer after the deadline; reopened from memory without a second request.
  - **G:** the drawing's selection unchanged by opening or closing; the globe's dated-path toggle still works.
  - **H:** Enter and Space on the toggle; focus kept; the text alternative.
  - **I:** 360, 390 and 721 px: no overflow; chart drawn at its own width; axis text ≥ 10 px.
  - **J:** a page opened at a time outside the dated example.
  - **K:** no page errors.
- **Breaks:** each removes one specific protection.
  - `late` removes every late-answer protection together: the aborts on close and reopen, the in-flight token checks and the final check. Removing any one alone changes no user path, because the others still drop the answer. That was tried and not counted (lesson 8 of 26 Nov).
- **Harness corrections during the work:**
  - The Retry click now records a FAIL instead of stopping the suite when Retry is hidden. Before this, `retry` and `eager` were caught but stopped early without printing their pattern line.
  - The builder test's repo-root path was one level short on its first run.
  - Both were fixed and everything was rerun.
- **Screenshots:** 1100 px and 390 px of the open chart are in the Mac review folder only (images are not committed).

## 5. Limits and open points
- **Not verified:** a real phone, Safari, a screen reader, or a hardware renderer.
- Draw cost was not measured: the chart is SVG outside the globe and adds no WebGL draws by design.
- The y axis from 0 is Claude's presentation choice. With it, the benchmark bars are about a pixel tall, which the legend says. A zoomed axis would show them, but it exaggerates the rise.
- "Observed" badge: a wording point for GPT.
- The extra-Poisson variation and the 12:40–13:10 rise stay unexplained; the page says the causes are not determined.
- **Release-candidate steps not done here:**
  - the `sources.html#mooncrater` section (with the full one-sigma and exclusions sentence);
  - the REGISTER entry;
  - narrow Animals pins for `moon.html`;
  - a served-file manifest including the three new files;
  - final validation, then Chad's own Approve line naming the commit.

## 6. What GPT is asked to review
1. §2: whether each build note is met.
2. §3: the schema and page checks, and the incomplete-group note.
3. The wording and presentation: badge, zero-based axis, legend, coverage note, readout.
4. The breaks and failure cases (§4): whether any important path is untested.
