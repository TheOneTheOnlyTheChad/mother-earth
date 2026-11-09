# Timeline — build proposal for one entry (Pliny, Letters 6.16) — rev 1, 9 Nov 2026

**Status: proposal only. Nothing built, no branch, no page or hub change.** Written 9 Nov 2026 from 14:29 UTC (clock reading).
**Basis:** `docs/concepts/TIMELINE-PAGE-UX-PROPOSAL.md` rev 2 (accepted as design direction by GPT and Chad), including its two carry-forward points; Test B (closed: 4 supported + 1 absence finding).
**Approvals:** implementation (branch only) and the live navigation change are **separate Approve lines** (§10). The opening-page / Met audit stays on its own track and is not touched here.

## 0. Evidence this build pins (read 9 Nov 14:28 UTC from the Mac packet `research/timeline-test-b/2026-11-09-claude/`)
- Packet check: CLAIMS, REPORT, S1-LATIN, S3-DATE-CHECK match `.hashes`; `LOG.md` differs only by the appended closure line (its first 1,897 bytes hash to the recorded `dfbc80db…37af`).
- **S1 (the only source linked as evidence):** The Latin Library, `https://www.thelatinlibrary.com/pliny.ep6.html` (Book 6, one page). Retrieved **9 Nov 2026 14:00:36 UTC**, HTTP 200, 58,933 B, `Last-Modified` 6 Mar 2017, **page sha256 `b59e819a2793d7e8a7ddfeb5ce716619acbb88390615ba2530e28d3aafcfe281`**. Edition **not stated by the host**. No terms seen on the page.
- **S3 (scholarly note, attributed):** D'Auria, De Micco & Di Pasquale, EGU General Assembly 2021 conference abstract, doi `10.5194/egusphere-egu21-16222`, CC BY (per OpenAlex). Read via **OpenAlex's stored abstract** 9 Nov 14:03:45 UTC, not the publisher page; GPT confirmed the wording on an author-hosted copy.
- **Perseus** (`Perseus:text:1999.02.0139`, CC BY-SA 3.0 US) was a pinning check only; **not linked** in this build (not independently verified by GPT).
- Nothing from the packet is copied into the repo except the identifiers, hashes, times and paraphrases above.

## 1. What gets built (scope)
| Piece | What | New / changed |
|---|---|---|
| `timeline.html` | the Timeline page: header with tabs, intro line, filter line, "Dates without a year" shelf with the one card, empty "Dated entries (0)" section, and the **entry pre-rendered in full** (U8: works with JavaScript off) | new |
| `timeline.js` | enhancement only: shelf/card layout, right panel (≥ 1101 px) / bottom sheet (≤ 720 px), shortcuts, expanders, `#e-…` handling, Back and focus rules (§4) | new |
| `style.css` | Timeline styles + the header tabs | changed (append; existing rules untouched) |
| `index.html`, `sources.html` | **header tabs "Earth now · Timeline"** (U1) and a Timeline item in Menu | changed **only in the nav-release step** (§10 B) |
| `phase1/timeline/entry-pliny-ep-6-16.json` | the entry as data: every field with its basis (§3) | new |
| `phase1/timeline/build_timeline.py` | generator: entry JSON → the pre-rendered entry block in `timeline.html`; deterministic; `--check` fails if the HTML differs from the generator's output | new |
| `phase1/timeline-ui.test.cjs` | browser tests (§6) | new |
| `REGISTER.md` | two rows: Latin Library (linked, nothing reproduced), EGU abstract (CC BY, paraphrased with attribution) | changed (§7) |

**Not built:** hub endpoint, R2 object, D1, cron, any change to the globe page beyond its header, search box (**omitted** until there are entries to search; T3), the dated axis's drawing (the section exists, empty, with its rule stated), translation, inline Latin.

## 2. Hub or page? (decision T1 — constitution point, Chad's call)
The constitution says "the hub is the product; the page is a client" and the UX doc says the Timeline will *later* read its entries from the hub. U8 requires the entry to be **in the HTML** anyway (no-JS).
- **(a) Recommended for this one entry: page-only.** Entry JSON lives in the repo, the generator writes it into `timeline.html`; `timeline.js` reads the pre-rendered DOM, **no fetch**. Cost $0, one release step, nothing on the hub. Recorded as a **bounded, dated deviation** from "the page is a client", to be closed when a hub route exists (a second entry or an axis is the natural trigger).
- **(b) Arts pattern:** a fixed catalogue route `/snapshot/timeline` on the hub (R2 `ref/`, file hash validated), page pre-render generated from the same file. Three extra Approve lines (R2 upload, hub deploy, then page), and the no-JS HTML still has to carry the content.
Under (a), "data loads only on the Timeline page" is trivially true: the globe page loads nothing new.

## 3. The entry as data (every field traces)
`phase1/timeline/entry-pliny-ep-6-16.json`, id `e-pliny-ep-6-16`. Each field = `{text, basis, ref}` where basis ∈ `passage` (S1 §n) · `conversion` (ours, T3) · `gap` (stated absence) · `attributed` (S3).

| Field | Text shown (our words) | Basis |
|---|---|---|
| title | Cloud reported over the Bay of Naples, noticed at Misenum | passage §4 |
| date line | **24 August (Julian) · year unstated** (verbatim, U3) | conversion + gap |
| when — source | Pliny, *Letters* 6.16 §4: a Roman calendar date and "about the seventh hour" | passage §4 (English paraphrase) |
| conversion | the ninth day before the Kalends of September, counted inclusively (Kalends = day 1) → 24 August, Julian; no Gregorian or proleptic date given; **ours** | conversion |
| hour | "about the seventh hour", as written; the hour beginning at local midday; clock time not given | passage §4 + gap |
| year | not stated by this source (whole letter checked, §1–22) | gap |
| place | Misenum · Bay of Naples (present-day reference) | passage §4 |
| what Pliny reports | mother pointed out the cloud to his uncle, commander of the fleet at Misenum (§4); learned later it came from Vesuvius (§5); he set down what he witnessed and what he heard soon after without marking which is which (§22) | passage |
| uncertain | written after his uncle's death; how long after not stated (§1) | passage + gap |
| scholarly note | a 2021 conference abstract reports the classical reading gives 24 August, some scholars propose 24 October, probably a medieval copying error; **not adjudicated by Mother Earth** | attributed (S3) |
| evidence | One historical account · later recollection · no independent corroboration · Latin only — no translation reached | — |

**Shared keys (constitution):** Wikidata IDs for Misenum, Vesuvius, Pliny the Younger and the *Letters* are looked up during the build (pane, read-only, one request at a time, the agreed User-Agent) and stored in the JSON; any not found is recorded as not found, not guessed.

**Conversion rule wording (decision T2):** the UX doc shows the Latin date expression inside "How we converted". **Recommended: English only** ("the ninth day before the Kalends of September") until REGISTER clearance, so the build quotes no host text at all. Alternative: show the three-word Roman date expression as our transcription of the calendar form.

## 4. Carry-forward points, specified
**4.1 "Read the passage" goes straight to the source** (no inline Latin). The control is a link to S1, opening the host page, with this text beside it:
> Latin Library, *Letters* Book 6, letter 16, §4–5 and §22 · edition not stated by the host · **we checked this page on 9 Nov 2026 14:00 UTC (sha256 `b59e819a…e281`)**. The live page may have changed since; what it shows now is not necessarily what we checked.

The full hash sits in the panel's Evidence section (wrapping, selectable) and in the entry JSON; no Sources-page change in this build. The link carries `rel="noopener"`, opens in a new tab, and is marked ↗. No request to the host is made by our page.

**4.2 Back and focus, both ways:**
| Path | Open | Close (✕ / Esc / sheet handle) | Back button |
|---|---|---|---|
| **From a card** (title or shortcut) | `pushState` to `#e-pliny-ep-6-16` (+ `?x=conv` / `?x=debate` encoded in the hash for shortcuts) | `history.back()`; focus → **the exact control that opened it** | closes the panel first (popstate); focus → that control |
| **Direct entry link** (page loaded at `#e-…`) | panel opens on load, no pushState; **focus → panel heading** | `replaceState` to the bare page URL; focus → **the entry's card title on the shelf** (page `<h1>` if the card is not rendered) | browser default: leaves for the previous site/page (the panel is the landing state, not a pushed one) |
| JavaScript off | the anchor scrolls to the pre-rendered entry | — | browser default |

Both rows are tested at 1280 and 390 px (§6).

## 5. Navigation change (the separately approved step)
- Header gains **Earth now · Timeline** tabs on all three pages (`aria-current="page"` on the current one); Menu keeps World View · Timeline · Sources & Details.
- Phone ≤ 720 px: a slim segmented control under the header.
- Known risk: the header's width at 1101–1190 px (5 Nov overflow bug). The nav step reruns `desktop-overflow` (real and fallback fonts) and `mobile-pass`, and the promise must still clamp to two lines without an ellipsis.
- Before the nav step, `timeline.html` exists only on the branch.

## 6. Tests (container, Playwright; same pattern as arts-ui)
`phase1/timeline-ui.test.cjs`:
1. **No-JS** (`javaScriptEnabled:false`): heading, shelf count (1), date line verbatim, entry anchor, S1 link href, "How we converted" and "Scholarly note" anchors resolve to plain sections, no inline Latin anywhere.
2. **Card → panel** (1280) and **card → sheet** (390): title opens; each of the three items is one action; `aria-expanded` toggles; shortcuts open with the right expander open.
3. **Focus return** to the title, and to each shortcut, after ✕, Esc, and Back.
4. **Direct link** `timeline.html#e-pliny-ep-6-16`: panel open on load, focus on panel heading; close → focus on card title; card-not-rendered variant → `<h1>`.
5. **No axis placement:** no element on the dated axis; "Dated entries (0)"; no "79" anywhere in the entry's position or card (79 appears only inside the attributed note as S3's statement — test allows it there only).
6. **Requests:** no request to thelatinlibrary.com, doi.org or the hub from `timeline.html`; the globe page's request list unchanged.
7. **Layout:** no horizontal page scroll at 360 / 390 / 430 / 1101 / 1280; sheet content scrolls, page does not.
8. **Generator:** `build_timeline.py --check` passes; a hand-edited HTML fails it.
9. **Accessibility tree:** card name, button roles, expanded states, shelf heading with count (names/roles/states only — not screen-reader announcements).

**Breaks that must each fail the suite:** remove focus return; place the entry on the axis at 79; render the passage inline; move the entry into script-only markup; drop `aria-current`; make the whole card the click target.
Regressions: all existing suites; `desktop-overflow` and `mobile-pass` with the nav step.
**Not covered by tests:** real phone / Safari, VoiceOver (both Chad, optional), served transfer size.

## 7. REGISTER (filed with the build, on the build approval)
| Source | Use on the page | Terms as observed | Commercial standing |
|---|---|---|---|
| The Latin Library, `pliny.ep6.html` | **linked only**, nothing reproduced; our paraphrase and conversion | no terms seen on the page (9 Nov 2026) | not applicable while linked only; quoting needs a separate clearance |
| EGU21-16222 abstract (D'Auria, De Micco, Di Pasquale) | attributed paraphrase + DOI link | CC BY per OpenAlex; licence page not read by us | with attribution (to confirm on the publisher's licence statement before release — Chad pastes it, per §7 of START-HERE) |

## 8. Cost and performance
$0 (GitHub Pages static files; no hub, R2 or D1 under T1 (a)). Text only, no images, no third-party fetches. `timeline.js` target < 8 KB.

## 9. Rollback
Branch build: nothing public. After the release: revert the merge commit on main (own Approve line); an open tab keeps the old page until reloaded.

## 10. Decisions and Approve lines
| | Decision | Recommended |
|---|---|---|
| T1 | Hub or page for this entry | (a) page-only, recorded as a bounded deviation |
| T2 | Latin date expression in the conversion rule | English only until cleared |
| T3 | Search box | omitted until there are entries |
| T4 | Wikidata IDs looked up during the build | yes (read-only, pane) |
| T5 | Release order | build on branch → GPT review → live RC in a clean pane tab → one release step that adds the nav tabs and merges |

**A. Implementation (branch only):**
`Approve: Timeline entry build per TIMELINE-ENTRY-BUILD-PROPOSAL rev 1 — T1 (a), T2 English only, T3 omit, T4 yes; build timeline-rc on a branch only — no merge, no nav change on main, no hub, R2 or D1 change.`

**B. Live navigation change + page release (later, after review and the live RC):**
`Approve: push timeline-rc to main (page change: Timeline page + Earth now · Timeline header tabs).`

If Chad prefers the page public before the tabs, B splits into B1 (publish `timeline.html` unlinked) and B2 (tabs).

*This proposal authorises nothing beyond its own writing.*
