# Timeline — build proposal for one entry (Pliny, Letters 6.16) — rev 2, 9 Nov 2026

**Status: proposal only. Nothing built, no branch, no page or hub change.** Rev 1 written 9 Nov from 14:29 UTC; **rev 2 from 14:43 UTC** (clock readings), after GPT's review of rev 1 (relayed by Chad).
**Basis:** `docs/concepts/TIMELINE-PAGE-UX-PROPOSAL.md` rev 2 (accepted design direction, with its two carry-forward points); Test B (closed: 4 supported + 1 absence finding; stays closed).
**Approvals:** the branch build and the live page/navigation release are **separate Approve lines** (§11). The opening-page / Met placement audit stays on its own track. Existing approvals carry forward; completed research stays closed.

**Rev 2 changes (GPT's four points):**
1. **Back and focus** rewritten (§5): one shareable fragment `#e-pliny-ep-6-16`; the shortcut's expander in history state; direct-link and explicit-Close rules; Back to a real previous page; the 721–1100 px layout and the phone sheet's keyboard/focus behaviour specified (§6).
2. **Date and attribution** (§3): the conversion counts 1 September as day one; Misenum attributed to Pliny, Bay of Naples labelled our present-day reference; seasonal-hour explanation labelled our model, clock time unset; §22 caveat kept; S3 authors and DOI named.
3. **Source link and no-JS** (§4): Book 6 page, with Letter 6.16 and §§4–5, 22 beside the link; no jump promised unless a working fragment is verified; retrieval date, hash, conversion and debate all in static HTML; hash = the copy we checked.
4. **Release gate** (§8): EGU licence recorded as reported by OpenAlex, publisher verification a release condition; a non-public preview of the pinned candidate; the actual header diff in the pre-release review.
Also: T1 page-only with the exception reviewed before a second entry or an axis; T2 English only; T3 search omitted; T4 limited to four named entities; release = page and tabs together (the rev 1 B1/B2 split is withdrawn).

## 0. Evidence this build pins (read 9 Nov 14:28 UTC from the Mac packet `research/timeline-test-b/2026-11-09-claude/`)
- Packet check: CLAIMS, REPORT, S1-LATIN, S3-DATE-CHECK match `.hashes`; `LOG.md` differs only by the appended closure line (its first 1,897 bytes hash to the recorded `dfbc80db…37af`).
- **S1 (the only source linked as evidence):** The Latin Library, `https://www.thelatinlibrary.com/pliny.ep6.html` — **the whole of Book 6 on one page**. Retrieved **9 Nov 2026 14:00:36 UTC**, HTTP 200, 58,933 B, `Last-Modified` 6 Mar 2017, **page sha256 `b59e819a2793d7e8a7ddfeb5ce716619acbb88390615ba2530e28d3aafcfe281`**. Edition **not stated by the host**. No terms seen on the page. Letter 6.16 sits under its own heading, sections 1–22 numbered on the page. **Whether the page has a working anchor for letter 16 was not checked** (the packet keeps no page HTML).
- **S3 (scholarly note, attributed):** D'Auria, De Micco & Di Pasquale, "The enigma on the date of the 79 AD Vesuvius eruption: lesson from grape archaeobotanical remains", EGU General Assembly 2021 conference abstract, **doi `10.5194/egusphere-egu21-16222`**. Licence **CC BY as reported by OpenAlex; the publisher's licence statement is not yet verified** (§8 R1). Read via OpenAlex's stored abstract 9 Nov 14:03:45 UTC, not the publisher page; GPT confirmed the wording on an author-hosted copy.
- **Perseus** (`Perseus:text:1999.02.0139`, CC BY-SA 3.0 US) was a pinning check only; **not linked** in this build.
- Nothing from the packet is copied into the repo except identifiers, hashes, times and our paraphrases.

## 1. What gets built (scope)
| Piece | What | New / changed |
|---|---|---|
| `timeline.html` | the Timeline page: header with tabs, intro line, "Dates without a year" shelf with the one card, empty "Dated entries (0)" section, and the **entry pre-rendered in full** (works with JavaScript off, §4.3) | new |
| `timeline.js` | enhancement only: card/shelf layout, detail panel or sheet (§6), shortcuts, expanders, history and focus (§5) | new |
| `style.css` | Timeline styles + header tabs | changed (appended rules; existing rules untouched) |
| `index.html`, `sources.html` | header tabs **Earth now · Timeline** and a Timeline item in Menu | changed **on the branch**; public only with release B (§11) |
| `phase1/timeline/entry-pliny-ep-6-16.json` | the entry as data: every field with its basis (§3) | new |
| `phase1/timeline/build_timeline.py` | generator: entry JSON → the pre-rendered entry block in `timeline.html`; deterministic; `--check` fails if the HTML differs from its output | new |
| `phase1/timeline-ui.test.cjs` | browser tests (§7) | new |
| `REGISTER.md` | two rows (§8) | changed |

**Not built:** hub endpoint, R2 object, D1, cron; any globe-page change beyond its header; search (T3); drawing of the dated axis (the section exists, empty, with its rule stated); translation; **inline Latin** (outside this build).

## 2. Hub or page (T1)
**Page-only for this one entry** (GPT's and Claude's recommendation). The entry JSON lives in the repo; the generator writes it into `timeline.html`; `timeline.js` enhances the pre-rendered DOM and makes **no fetch**. Cost $0.
- This is a **bounded, dated exception** to "the hub is the product; the page is a client", recorded in START-HERE beside the constitution.
- **The exception is reviewed before a second entry or an axis is added**; either one needs its own proposal that decides the hub route.
- The globe page loads nothing new.

## 3. The entry as data (every field traces)
`phase1/timeline/entry-pliny-ep-6-16.json`, id `e-pliny-ep-6-16`. Each field = `{text, basis, ref}`; basis ∈ `passage` (S1 §n, Pliny's statement, in our English paraphrase) · `conversion` (ours, T3) · `model` (our explanatory model) · `reference` (our present-day reference) · `gap` (stated absence) · `attributed` (S3).

| Field | Text shown (our words) | Basis |
|---|---|---|
| title | Cloud reported over the Bay of Naples, noticed at Misenum | passage §4 + reference |
| shelf date line | **24 August (Julian) · year unstated** (verbatim) — on the **Dates without a year** shelf only, **no axis placement** | conversion + gap |
| when — source | Pliny, *Letters* 6.16 §4, gives a Roman calendar date and "about the seventh hour" | passage §4 |
| when — our conversion | **24 August, Julian calendar — our conversion of the checked page's reading.** The ninth day before the Kalends of September, counted inclusively with **1 September as day one** → 24 August. No Gregorian or proleptic date given. English only; no Latin wording (T2) | conversion |
| hour | "about the seventh hour", as Pliny gives it. **Our model:** Roman hours divide daylight into twelve seasonal hours, so the seventh begins at local midday. **Modern clock time: unset** (daylight at Misenum on that date was not established) | passage §4 + model + gap |
| year | not stated by this source (whole letter checked, §1–22) | gap |
| place | **Misenum — as Pliny states (§4).** **Bay of Naples — our present-day reference.** | passage + reference |
| what Pliny reports | Pliny reports that his mother pointed out the cloud to his uncle, who commanded the fleet at Misenum (§4); he writes that it was learned later that the cloud came from Vesuvius (§5) | passage |
| caveat (§22) | Pliny says he set down what he witnessed and what he heard soon afterwards, **without saying which details are which** | passage §22 |
| uncertain | written after his uncle's death; how long after is not stated (§1) | passage + gap |
| scholarly note on the date (separate section) | **D'Auria, De Micco & Di Pasquale (EGU General Assembly 2021, conference abstract, doi 10.5194/egusphere-egu21-16222)** report that the classical reading gives 24 August, that some scholars propose 24 October, and that the discrepancy is probably a medieval copying error. **Not adjudicated by Mother Earth.** | attributed (S3) |
| evidence | **One historical account** (Pliny, *Letters* 6.16) · later recollection · no independent corroboration · Latin only — no translation reached. The scholarly note is **not** counted as evidence for the entry. | — |

**Shared keys (T4, if approved):** Wikidata IDs for **exactly four entities**: Misenum, Mount Vesuvius, Pliny the Younger, and Pliny's *Letters*. Read-only pane requests, one at a time, with the agreed User-Agent. Each match is checked by label and description; **any unresolved or ambiguous ID is recorded as unresolved** in the JSON, never guessed. No other lookups.

## 4. Source link and static content
**4.1 "Read the passage".** A link straight to `https://www.thelatinlibrary.com/pliny.ep6.html`, opening in a new tab (`rel="noopener"`, marked ↗). Beside it:
> The Latin Library — *Letters*, **Book 6** (one page). Find **Letter 6.16, §§4–5 and §22**. Edition not stated by the host.
> **We checked a copy of this page on 9 Nov 2026 at 14:00 UTC; its sha256 is `b59e819a…e281`** (full value in Evidence). The hash identifies the copy we checked. **The live page can change**, and what it shows now is not necessarily what we checked.

- **No jump to the letter is promised.** The link is to the page, not a fragment. A fragment link is added only if a working anchor for letter 16 is verified on the host (a single read-only check during the build, recorded with time and result, under approval A); if unverified or absent, the page link stays as written.
- Our page makes no request to the host.

**4.2 No inline Latin.** Outside this build. Our paraphrase, conversion and model are always in our own words.

**4.3 Static HTML (JavaScript off).** `timeline.html` carries all of these in the pre-rendered entry, with no content behind script:
- the shelf card and date line;
- the source link with Book 6, Letter 6.16, §§4–5 and §22, the **retrieval date and time**, the **full checked-copy hash**, and the "hash identifies the copy we checked; the live page can change" sentence;
- **How we converted** (plain section, in-page anchor);
- **Scholarly note on the date** (plain section, authors and DOI, in-page anchor);
- the hour model, the year gap and the §22 caveat.
Each entry heading carries the anchor `#e-pliny-ep-6-16`. Script only changes the layout and adds the panel/sheet.

## 5. History, Back and focus
**One shareable fragment: `#e-pliny-ep-6-16`.** It works with JavaScript off (the anchor scrolls to the pre-rendered entry). Shortcuts do **not** create other fragments: the expander choice is stored in **history state**.

| Event | URL / history | Panel | Focus |
|---|---|---|---|
| **Open from the title** | `pushState({entry:'e-pliny-ep-6-16', x:null, opener:'title'}, '', '#e-pliny-ep-6-16')` | open, no expander | panel heading |
| **Open from "(Julian)"** | same, `x:'conv', opener:'julian'` | open, **How we converted** expanded | panel heading |
| **Open from "⚑ Date debated"** | same, `x:'debate', opener:'debated'` | open, **Scholarly note** expanded | panel heading |
| **Close (✕ / Esc / sheet handle) after opening from a card** | `history.back()` (keeps Back/Forward consistent) | closed | **the exact opener** (title or that shortcut) |
| **Browser Back** after opening from a card | popstate to the pre-open entry | closed | **the exact opener** |
| **Browser Forward** after that Back | popstate with the stored state | reopened with the **stored expander** | panel heading |
| **Direct link** (page loaded at `#e-pliny-ep-6-16`, no state) | `replaceState({entry, x:null, opener:null, direct:true})` | open on load | **the detail heading** |
| **Explicit Close after a direct link** | `replaceState(null, '', location.pathname)` — **clears the fragment** | closed | **the shelf card's title**; the page `<h1>` if the card is not rendered |
| **Browser Back after a direct link** | browser default | — | **returns to the previous page** if there is one |

The opener is remembered per history entry in page memory; after a reload (no memory), closing falls back to the card title.

## 6. Layout and keyboard by width
| Width | Detail surface | Behaviour |
|---|---|---|
| **≥ 1101 px** | right-hand **panel**, non-modal (`role="region"`, `aria-labelledby` its heading); shelf and axis stay visible and usable | no focus trap; Tab moves out of the panel normally; Esc closes when focus is inside the panel |
| **721–1100 px** (tablet, matching the globe page's existing band) | right-hand **panel**, width `min(420px, 50vw)`, non-modal, same rules as desktop; the shelf reflows to one column beside it; header tabs inline in the header when they fit, otherwise the segmented row below it | measured at 721, 800, 1024 and 1100 px: no page overflow, panel and card both fully visible |
| **≤ 720 px** (phone) | **bottom sheet**, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` its heading; opens at full height | see below |

**Phone sheet, keyboard and focus:**
- On open: focus to the sheet heading; the rest of the page gets `inert` (not reachable by Tab or screen reader); page scroll locked; the sheet's content scrolls.
- **Focus trapped** inside the sheet while open: Tab and Shift+Tab cycle ✕, the drag handle, the three items, the source link.
- The drag handle is a real `<button>` ("Close"), so it works by keyboard, switch and screen reader, not only by dragging.
- Esc, ✕, the handle and the system back gesture all close it; focus then follows §5.
- On close: `inert` and the scroll lock are removed before focus moves.

## 7. Tests (container, Playwright; same pattern as arts-ui)
`phase1/timeline-ui.test.cjs`:
1. **No-JS** (`javaScriptEnabled:false`): heading; shelf count (1); date line verbatim; entry anchor; source link href = the Book 6 page with Letter 6.16 and §§4–5, 22 beside it; retrieval date and full hash present; "How we converted" and "Scholarly note" anchors resolve to plain sections with the authors and DOI; no inline Latin anywhere.
2. **Openers × widths:** title, "(Julian)" and "⚑ Date debated", each at **1280, 900 and 390 px**: the right surface opens with the right expander; each of the three items is one action; `aria-expanded` toggles.
3. **Close paths × openers × widths:** ✕, Esc, Back → focus on **the exact opener**; then **Forward** → reopened with the stored expander, focus on the panel heading.
4. **Direct link:** load `timeline.html#e-pliny-ep-6-16` → open, focus on the detail heading; Close → fragment cleared (`location.hash === ''`), focus on the card title; variant with the card not rendered → `<h1>`.
5. **Back to a real previous page:** load `index.html`, navigate to `timeline.html#e-pliny-ep-6-16`, press Back → `index.html` is shown (a genuine prior history entry, not a simulated one).
6. **Phone sheet:** `aria-modal`, background `inert`, Tab and Shift+Tab stay inside, the handle closes by keyboard, scroll lock removed after close.
7. **No axis placement:** "Dated entries (0)"; the entry is only on the shelf; "79" appears only inside the attributed scholarly note.
8. **Attribution text:** "Misenum — as Pliny states", "Bay of Naples — our present-day reference", "Our model", "Modern clock time: unset", the §22 caveat and "One historical account" present verbatim.
9. **Requests:** no request to thelatinlibrary.com, doi.org or the hub from `timeline.html`; the globe page's request list unchanged.
10. **Layout:** no horizontal page scroll at 360 / 390 / 430 / 721 / 800 / 1024 / 1100 / 1280.
11. **Generator:** `build_timeline.py --check` passes; a hand-edited HTML fails it.
12. **Accessibility tree:** card name, roles, expanded states, dialog/region names, shelf heading with count (names, roles and states only — not screen-reader announcements).

**Breaks that must each fail the suite:** focus not returned to the opener; Close leaving the fragment; shortcut writing its own fragment; no `inert` behind the sheet; entry placed on the axis at 79; passage rendered inline; entry moved into script-only markup; `aria-current` dropped; whole card made the click target.
Regressions: all existing suites; **`desktop-overflow` and `mobile-pass` rerun with the new header.**
**Not covered:** real phone / Safari, VoiceOver (Chad, optional), served transfer size.

## 8. REGISTER and release conditions
| Source | Use on the page | Terms as observed | Commercial standing |
|---|---|---|---|
| The Latin Library, `pliny.ep6.html` | **linked only**, nothing reproduced; our paraphrase and conversion | no terms seen on the page (9 Nov 2026) | not applicable while linked only; quoting needs a separate clearance |
| EGU21-16222 abstract (D'Auria, De Micco, Di Pasquale) | attributed paraphrase + DOI link | **CC BY as reported by OpenAlex (9 Nov 2026); publisher's licence statement not yet verified** | with attribution, **pending publisher verification** |

**Release conditions (all before release B):**
- **R1.** The publisher's licence statement for the EGU21-16222 abstract is read and filed verbatim in REGISTER (START-HERE §7: Chad pastes the operative sentence; or GPT extracts it on his behalf, labelled so). If it is not CC BY or cannot be found, the note becomes a citation with no paraphrase of the abstract beyond the date question, or is withdrawn — a revision for review, not a silent change.
- **R2.** A **non-public preview of the pinned candidate**: in a fresh browser-pane tab on a plain github.io text file, the candidate's files are fetched from raw.githubusercontent.com **at the pinned commit**, sha256-checked, and injected as blob URLs (START-HERE §5a). Nothing is served on the public site; the live page is never overwritten. (The branch is visible in the public repository; "non-public" means not served as the site.) Checks at 1280, 900 and 390 px, with screenshots.
- **R3.** The pre-release review includes **the actual header diff**: `git diff main..<candidate> -- index.html sources.html` pasted in full, plus the candidate hashes of all **seven** page files (index.html, sources.html, timeline.html, app.js, arts.js, timeline.js, style.css), which the served-hash check after release must match.
- **R4.** GPT's review of the candidate (code, tests, preview evidence) before Chad's release line.

## 9. Cost and performance
$0 (GitHub Pages static files; no hub, R2 or D1). Text only, no images, no third-party fetches. `timeline.js` target < 8 KB.

## 10. Rollback
Branch build: nothing public. After release: revert the merge commit on main (own Approve line); an open tab keeps the old page until reloaded.

## 11. Decisions and Approve lines
| | Decision | Recommended (GPT and Claude) |
|---|---|---|
| T1 | Hub or page | page-only; exception reviewed before a second entry or an axis |
| T2 | Conversion rule wording | English only |
| T3 | Search box | omitted |
| T4 | Wikidata IDs | the four named entities only; unresolved recorded (Chad's call) |
| T5 | Release | page and tabs **together**, after candidate review (R1–R4) |

**A. Branch build:**
`Approve: Timeline entry build per TIMELINE-ENTRY-BUILD-PROPOSAL rev 2 — T1 page-only, T2 English only, T3 omit, T4 four entities only; build timeline-rc on a branch only — no merge, no nav change on main, no hub, R2 or D1 change.`
(Drop "T4 four entities only" and write "T4 no" to skip the Wikidata lookup.)

**B. Live page and navigation release (after R1–R4):**
`Approve: push timeline-rc to main (page change: Timeline page + Earth now · Timeline header tabs).`

*This proposal authorises nothing beyond its own writing.*
