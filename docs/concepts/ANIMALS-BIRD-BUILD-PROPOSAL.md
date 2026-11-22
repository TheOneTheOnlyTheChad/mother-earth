# Animals: the Animals tab with its own globe and journey toggles, and the bird journey (waved albatross, Galápagos)

20 Nov 2026 · **rev 3.1** (rev 3 PASSED by GPT at design and proposal level, `reviews/2026-11-20-animals-tab-proposal-rev3-gpt-review.md`; rev 3.1 adds §A7, GPT's clarifications, which correct T2, T4, T6, T8, T13, T15 and T16, and changes nothing else) · **docs only.** Rev 3 adds Part A on Chad's design instruction of 20 Nov (his own messages): the journey globe, the journey toggles and the replay move to the Animals tab, and the journey controls leave Earth now. He stated: "This is a docs-only design instruction, not a build or deployment go." Part B is rev 2.1 of the bird proposal (rev 2 PASSED by GPT at proposal level, `reviews/2026-11-20-animals-bird-build-proposal-rev2-gpt-review.md`), changed only where the page design touches it; those places are marked "rev 3". Nothing built, no code branch cut, nothing sent. The Earth from Space probe and its files are untouched.

Rev 2 replaces rev 1 in full. GPT held rev 1 (`reviews/2026-11-20-animals-bird-build-proposal-gpt-review.md`) on two design points, both right: **the 5 ms timestamp rule fails on the pinned file**, and **omitting colony-area fixes by deletion alone would make the replay say false things**. §12 lists what rev 1 got wrong.

**What this proposes:** add one recorded bird to the parked Animals journey replay, as a private preview first: waved albatross `3275-30662`. Label (accepted by GPT): "Recorded movements of one breeding adult, 23 June to 15 September 2008."

**Source basis:** audit D, `docs/research/animals-source-audit/BIRD-JOURNEY.md` rev 1.2, closed by GPT.

# PART A — THE ANIMALS TAB (rev 3; applies to every journey, not only the bird)

## A1. Chad's instruction (20 Nov, his own words, in two messages)

- "one Animals header tab alongside Sun/Moon, with labelled animal toggles like the Mother Earth front-page layer switches."
- "Only one animal journey is active at a time. Switching another on switches the previous one off. Use these toggles instead of the journey dropdown chooser."
- "put the animal globe, journey toggles and replay on the Animals tab."
- "Keep Earth now focused on its existing observations; remove the Animals journey controls from it in this proposed design."
- "The Animals page should contain its globe, cards grouped Land/Sea/Air, and labelled toggles."
- "Keep everything in the same Animals feature."

## A2. What the parked build does today (read from `animals-journeys-preview-rc`, code `f00a330`)

- The header already has one Animals tab: Earth now · Timeline · Moon · Sun · Animals. **No tab is added or removed by this design.**
- The Animals page (`animals.html`) is a page of study cards with **no globe**. Each card links to `index.html#journey=<id>`.
- The replay lives on **Earth now**: one card "Animal journey" with a single switch (`#tgl-journey`), a **dropdown** (`#journey-choose`) to pick the animal, the replay bar, a row in the Layers panel, an entry in the Key, and the script `animals-journey.js`. It draws on the Earth now globe, over that page's daily satellite picture, beside the live layers.
- GPT's pass of the private preview was of that arrangement.

## A3. The design

**Header.** Unchanged: one Animals tab beside Moon and Sun.

**The Animals page holds everything.**
- **Its own globe**, the same globe library and pinned version as Earth now. No live layer, no day/night line, no search, no zoom-out sky view, no Layers panel. It exists to show one recorded journey.
- **Journey toggles grouped Land · Sea · Air.** One labelled switch per animal, the same component as the front-page layer switches (a button with `role="switch"`, `aria-checked`, a visible label, described by its card's evidence line). Labels as the catalogue gives them, with the years: "Plains zebra, animal Z3866 (2007–2008)", "White shark, tag 118845 (2012–2013)", "False killer whale, tag 98364 (2013–2014)", and with Part B "Waved albatross, animal 3275-30662 (2008)".
- **Cards**: each animal's card carries its toggle, its state line (off · loading · shown · could not be verified · failed, with Retry), its evidence type and its study facts. The existing "Studies, credit, licences and what was left out" content stays on the page.
- **The replay bar** (play, pause, speed, slider, "go to the journey area", the always-visible replay line) sits with the globe and appears only while a journey is shown.
- **No dropdown.** `#journey-choose` and the single `#tgl-journey` are removed.

**One journey at a time.**
- All off is a valid state and is the state at load: nothing is switched on, nothing is fetched beyond the page itself.
- Switching animal B on while A is on: A is switched off first (its load aborted if still loading, its marker, line and fix marks removed from the scene, its replay stopped and the bar hidden), A's switch reads off, then B loads. The same rule the aircraft counts and positions switches follow on Earth now.
- A late response for A that arrives after B was chosen draws nothing (the existing generation check).
- Switching the shown journey off returns to all off.
- One polite announcement per change, for example "Plains zebra switched off. Waved albatross loading." No announcement on every animation frame.
- The group has a visible heading that says so: "Animal journeys — one at a time".

**Links.** `animals.html#journey=<id>` scrolls to and focuses that animal's toggle and switches nothing on. `index.html#journey=…` is retired; no public page has ever carried it.

**Earth now.** The journey card, its switch, the dropdown, the replay bar, the Layers row, the Key entry, the journey's part in the zoom-out view and the `animals-journey.js` script tag are removed. **Target, checked by test: after this change every Earth now file equals current main's, except for the Animals link in the header and menu.** The suites whose expectations the parked branch changed for the journey switch (switch counts, Layers rows, widths) go back to main's.

**Backdrop of the Animals globe (decision A-D1).**
- A (recommended): the same daily NASA satellite picture Earth now uses (a source already in the register), with a visible line: "Backdrop: satellite picture of [date]. It is not from the journey's dates." This is what the passed preview showed, and an inland journey (the zebra) needs land to be read against.
- B: a plain dark globe with the Natural Earth coastline already in the repo. No current-day picture under a past journey, but the zebra's journey would have nothing around it.
- No new source is introduced by either.

**Phones and narrow widths.** Globe first, then the replay bar, then the toggles and cards, in that order; the toggles stay reachable without covering the globe. Real phone and screen reader remain unverified, as for the whole site.

## A4. What this does to the earlier review

- **Data is untouched.** The three existing display files, manifests and builders stay byte for byte.
- **Page code is not.** The replay moves pages and gains a toggle group; Earth now loses its journey code. GPT's pass of `f00a330` covered the old arrangement, so **the candidate review covers the whole Animals page afresh**, including every J-criterion of the earlier journey review that still applies (verification failures, late loads, replay controls, fix and gap wording, performance at desktop and 390 px).
- The journey script's dependencies on Earth now (the shared globe handle, the Key repaint, the Layers panel, the zoom-out class) are replaced by the Animals page's own; none may remain as a silent no-op.

## A5. Build order proposed (decision A-D2)

One branch, two reviewed stages, so a page-move defect is never confused with a bird defect:
1. **Stage 1: move.** The Animals tab gets its globe, toggles and replay with the **three existing journeys only**; Earth now returns to main. Candidate and tests to GPT.
2. **Stage 2: bird.** Part B added on top (Air group, new file fields, withholding). Candidate and tests to GPT.

Alternative: both in one candidate. Faster, larger review.

## A6. Interaction checks for the Animals tab (T-criteria; all run in a browser against the built page)

- T1. Header: exactly one Animals tab, beside Moon and Sun, on all five pages; it is marked current on the Animals page.
- T2. At load: every journey switch reads off; nothing is drawn; no journey file has been requested; the replay bar is hidden.
- T3. Each switch has a visible label naming the animal and years, `role="switch"`, a correct `aria-checked`, and is described by its card's evidence line. Groups are headed Land, Sea, Air; an empty group is not shown.
- T4. Switching one on: its state goes loading then shown; marker, line and fix marks appear; the replay bar appears; the globe moves to the journey.
- T5. **Exclusivity:** with A shown, switching B on leaves exactly one switch on (B), removes every A object from the scene (counted), stops A's replay and shows B. Tested for every ordered pair of journeys.
- T6. **Rapid switching:** A on, B on, C on within one second, on a slowed network: only C is ever drawn; A's and B's late responses draw nothing; exactly one switch is on at every moment after each click.
- T7. Switching the shown journey off: nothing drawn, bar hidden, all switches off, replay time not carried into the next journey.
- T8. Failure: a changed journey file, manifest or catalogue gives "could not be verified, nothing is drawn" on that card only, its switch returns to off or shows the failed state consistently, Retry works, and another journey can still be switched on.
- T9. Keyboard: every switch is reachable by Tab, operable by Space and Enter, focus stays on the switch after it changes state, focus is never lost when A is switched off by B.
- T10. Announcements: one polite message per change naming what went off and what is loading or shown; none per frame.
- T11. Deep link `animals.html#journey=<id>`: that toggle is scrolled to and focused; nothing is switched on; an unknown id does nothing.
- T12. No dropdown: no `select` for journeys exists on any page.
- T13. **Earth now is clean:** no journey card, switch, replay bar, Layers row or Key entry; `animals-journey.js` is not loaded; the Earth now files equal main's except the Animals links; the suites the parked branch altered pass with main's expectations.
- T14. Leaving and returning: navigating away and back (including the browser's back-forward cache) leaves no journey on and no animation running.
- T15. The Animals globe shows no live layer and makes no request to the hub; under A-D1 option A its only outside request is the backdrop picture, and the backdrop's date line is shown and correct.
- T16. Widths 360, 390, 720, 1100, 1280 and 1470 px: no overflow; the switches, the bar and the cards do not cover the globe beyond the agreed share; every switch stays operable.
- T17. No WebGL: the page says the journey needs the 3-D globe; switches do not pretend to work; the cards and study content remain readable.
- T18. The replay line, gap wording and marker behaviour of the three existing journeys are unchanged from the passed preview (the earlier J-criteria, rerun on the new page).

## A7. Clarifications from GPT's pass of rev 3 (rev 3.1; binding on the build, checked at candidate review; where they differ from A3 or A6, these govern)

**Controls**
- Labelled switches are accepted (GPT's design judgement; not something the W3C patterns prescribe). The group is labelled, with the visible guidance "Animal journeys — one at a time" associated with the controls.
- Each switch's accessible label stays the same; state text changes separately. Tab reaches each switch; Space and Enter operate it. No radio-group role and no arrow-key behaviour.
- Focus stays on the activated switch, including while its load completes or fails.
- **Loading counts as selected:** when B is pressed, B reads on while loading, and A is unchecked and cancelled at once.
- **Failure policy:** if B fails, B returns to off and the error and Retry stay on B's card. Retry selects B through the same exclusive path, cancelling whatever else is selected. A is never restored automatically.
- Announce the user's change and the meaningful completion or failure, once each; nothing per frame.

**Backdrop (A-D1 option A, with a fallback)**
- The same imagery selection and date logic as Earth now, through a small shared or isolated imagery component. The Earth now application and its collectors are not loaded to get a texture.
- It is dated NASA GIBS VIIRS imagery chosen from a UTC date offset, not a guaranteed live or complete picture. Line on the page: "Backdrop: NASA satellite imagery for [date], not the journey dates." The existing caveat about dark or missing areas is kept.
- **If the imagery request fails:** a plain globe with the coastline, the words "satellite backdrop unavailable", and journeys still usable. The date line is never left claiming imagery that is not shown.
- Neither backdrop shows ground conditions at the journey's dates. No background layer suggests dates matched to the animal.

**Build order (A-D2)**
- Two reviewed stages on one branch, each kept as a named commit so the two can be compared. A passed stage is still a private candidate. The parked branch is not retired because the new build has started.
- Stage 1's "builders unchanged" applies to the move. Stage 2 changes the GPS builder as Part B proposes.

**Corrections to the T-criteria**
- **T2 and T15, network.** "Nothing fetched beyond the page itself" was wrong. Allowed at load: the page's own assets, the pinned renderer from its CDN, the imagery, and the catalogue and manifests the cards need. **No journey coordinate file is requested before its switch is switched on.** Allowed library and imagery origins are listed in the packet. No request to the hub for any live layer.
- **T4 and T18, shown is not the same as marker visible.** At Stage 2 the bird opens inside its first withheld span: switch on, replay bar visible, marker and accuracy hidden, the withheld message shown. T4 does not demand a marker at once. T18 keeps the old journeys' observable fix and gap behaviour; it does not keep Earth now scaffolding.
- **T6, races.** "Only C is drawn" means no superseded response draws. A journey that finished loading before the next click is not a failure. Also tested: on then off while loading; A, B, A; Retry on one animal while another is selected; switch-off before a late response. Every object type, the playback timer and any stale camera callback are checked, not only the marker.
- **T8, failure scope.** A bad manifest or display file affects that journey only; another verified journey stays usable. **A bad shared catalogue is global:** no journey from it can be trusted. All cards stay readable under one integrity error, and a valid retry recovers. The catalogue check is never bypassed to keep an error "on that card only".
- **T13, Earth now comparison.** The baseline is the exact main commit merged into the branch, named in the packet, not "today's main". The packet lists the entry files and shared dependencies compared, and checks shared CSS and helpers for effects on Earth now and the other pages. The journey catalogue and data files stay in the project for the Animals page; that is not Earth now integration.
- **T14, lifecycle.** Also: playback pauses when the tab is hidden; resize and orientation change leave the controls usable and the globe correct.
- **T16, layout.** On narrow screens the controls and cards sit below the globe and may cover none of it. The Stage 1 packet states the actual desktop and mobile overlap targets. Checked: the page scrolls to every switch; controls stay usable when the canvas changes size; reduced-motion is respected; no auto-play and no needless continuous camera motion on entry.
- **T17, no globe.** Also a failed renderer or library load, and a lost graphics context after load. Cards, source facts and an explanation of the selected state remain.

**Links.** Existing links target the animal's switch on the Animals page without switching it on. The old private `index.html#journey=` link is simply retired.

**Part B.** The bird's timestamp, spatial filter, source pins, accuracy, join and withheld-period rules stay passed; no new source audit. §11a still applies.

# PART B — THE BIRD (rev 2.1, PASSED by GPT at proposal level; rev 3 changes marked)

## 1. Source, pinned (both files are build inputs)

| | |
|---|---|
| Package | Movebank Data Repository, doi `10.5441/001/1.3hp3s250` (Cruz, Proaño, Anderson, Huyvaert, Wikelski 2013) |
| Paper | Dodge and co-authors 2013, *Movement Ecology* 1:3, doi `10.1186/2051-3933-1-3` |
| Licence | CC0 1.0; cited in any case (project requirement) |
| Data file | `Galapagos Albatrosses.csv`, 4,913,156 bytes, sha256 `1b62b43cfce5067193cde0fc1c5b6144eff193bd7c995160961479921fd4a8e6` |
| Reference file | `Galapagos Albatrosses-reference-data.csv`, 6,066 bytes, sha256 `1d7b24cf119f65ba7c90358b52ed5d29ec07b1b87c61ca6960b4bfad108061ad` |
| Where the bytes are | Chad's Mac, `~/Documents/Mother Earth/_source-data/animals-expansion/`. Not in Git, not in any served folder |
| Bird | animal `3275-30662`, tag `132`; adult; deployed 2008-06-23; study site "Punta Cevallos"; nest stage comment "egg"; manipulation "none"; "used in analysis and shown in Figs 7-8" |
| Tagging-site reference point | the reference file's deployment coordinates for this bird, given to two decimals: −1.39, −89.62 |

The builder checks both hashes, and that the reference row's animal id, tag id and deployment date agree with the data rows it is about to use.

## 2. The bird's record (measured 20 Nov, 14:37 and 15:01 UTC, from the pinned files)

**Source rows: 1,338.**
- 1,326 positioned fixes (status `A`, fix type `3`, both coordinates present).
- 12 failed attempts (status `D`, fix type `0`, both coordinates absent). No row has one coordinate without the other.
- All rows `visible` true. **The file supplies no manual-outlier field.** That is an absent field, not a statement that the source checked and found none.
- Recording period: first row 2008-06-23 17:58:44 UTC, last row 2008-09-15 13:30:18 UTC (after the rounding in §3). Strictly increasing in time.

**Timestamps.** Every row carries milliseconds. Distance from the nearest whole second, all 1,338 rows:

| Distance | 0 ms | 1 ms | 2 ms | 19 ms | 21 ms |
|---|---|---|---|---|---|
| Rows | 372 | 641 | 323 | 1 | 1 |

The two outliers are positioned fixes: event `28279234` (2008-08-25 19:30:26.019) and event `28208092` (2008-07-19 01:30:13.979). GPT found them; Claude confirmed them.

**Steps between positioned fixes, before any omission:** 1,311 of one 90-minute interval; 12 of two intervals (each spans one failed attempt); 1 of 32,414 s (about 9 hours, with no row of any kind inside it); 1 of 195 s. 13 steps exceed 95 minutes; 1 exceeds 3 h 15 min.

**Tag's own horizontal accuracy estimate** (the tag maker's estimate, not a measured error):

| Population | Fixes | Min | Median | 95% under | Max | Over 25 m | Over 50 m |
|---|---|---|---|---|---|---|---|
| All positioned source fixes | 1,326 | 1.79 m | 4.35 m | 17.41 m | 70.4 m | 34 | 5 |
| Retained fixes (§5) | 981 | 2.05 m | 4.35 m | 17.92 m | 65.28 m | 28 | 4 |

**Extent of retained fixes:** 12.79°S to 0.42°S, 90.95°W to 77.52°W. No date-line crossing; nowhere near a pole.

## 3. Timestamp rule (corrected)

- **Round to the nearest whole second**, in integer milliseconds: `seconds = (ms + 500) div 1000`. No floating point.
- **Per-study allowance: 25 ms.** A row further than 25 ms from a whole second stops the build. Measured maximum for this bird: 21 ms.
- Applied to **every** source row of the bird (positioned and failed), **before** any omission, so a source-validation failure can never be hidden by filtering first.
- After rounding: any two rows on the same second stop the build; any row not later than the one before stops the build. Measured: no collision, order kept.
- The manifest records the rule, the allowance and the measured maximum.
- This is a deliberate display conversion. It is not a claim that the fractional values are an export error, and the README's note about GPS time is a separate matter that neither justifies nor corrects it.
- Other studies keep their existing rule (a fractional second stops the build) unless their own config sets an allowance.
- Not chosen: carrying milliseconds. The reader requires whole seconds, so that would need a schema and reader migration for no visible gain in a replay of 90-minute fixes.

## 4. Gap rule (D1)

- **A (recommended; GPT agrees): no join over 3 hours 15 minutes (11,700 s).** That is two nominal 90-minute intervals plus 15 minutes' tolerance; it is not "exactly two intervals".
- A join across a failed attempt is an illustrative connector between two recorded fixes. The page says the path between fixes was not observed (the existing line text), and the marker stays on a recorded fix.
- B: no join over 95 minutes (every failed attempt breaks the line). Valid if Chad prefers it; it needs the same omission rule below.
- **Separate rule, in both options: a step is never joined if any withheld source fix lies between its two fixes, whatever the elapsed time.**
- It is Mother Earth's display rule, stated as such. It validates no flight route and supplies no missing fix.

## 5. Colony-area fixes (D2): the rule and the replay contract

### 5.1 The rule
- **Withhold every positioned fix within 5.000 km of the tagging-site reference point** (−1.39, −89.62, as the reference file gives it).
- Distance: great-circle on a sphere of radius 6,371.0088 km (haversine). A fix at exactly 5.000 km or less is withheld. The retained or withheld fix nearest the boundary is 181 m from it, so this bird has no boundary case; the build tests one with altered copies.
- **Result: 345 withheld, 981 retained.** Using the first positioned fix as the centre instead gives the same counts (it is 117 m from the reference point), but the reference point is the named, source-given anchor and is used.
- 5 km is a project display choice. It is not a scientifically established protection distance and is not inherited from the grey-headed study.
- The reference point is a tagging-site reference, not a nest position. The page does not say "at the colony" or "at the nest" of anything inside the disk.
- **The archived source stays intact.** The display is explicitly filtered and its times are rounded; the page says so.
- Alternatives remain for Chad: show every fix; or show colony-area fixes at two decimals, marked generalised. No option is described as harmless, in a private preview or otherwise.

### 5.2 What the filtered record looks like

| | |
|---|---|
| Withheld periods | **14** (a period = consecutive withheld fixes with no retained fix between them). None is a single fix. Longest: 144 hours |
| First period | **the record starts in one:** 86 fixes, 23 June 17:58:44 to 29 June 00:01:14 |
| First retained fix | 2008-06-29 01:30:54 UTC |
| Last retained fix | 2008-09-15 13:30:18 UTC, which is also the last source row (no trailing withheld period) |
| Consecutive retained pairs | 980 |
| … joined under D1-A | **966**, of which **10** span one failed attempt |
| … separated by a withheld period | 13 (never joined) |
| … separated by time alone | 1 (the 9-hour step) |
| Failed attempts | 12: 10 inside joined steps; 1 inside a withheld period; 1 in a step that is not joined |

For this bird every pair separated by a withheld period is also further apart than 3 h 15 min. That is a coincidence of this file and proves nothing about the rule: the build tests a short withheld step with an altered copy (B-criteria).

### 5.3 What the display file carries
- `t`, `lat`, `lon`, `acc`: the 981 retained fixes only.
- `j`: a join flag per step, written by the builder: 1 only when the step is within the time rule **and** no withheld fix lies between. The reader joins only where `j` is 1 and the time rule also holds.
- `withheld`: the 14 periods as `[first withheld time, last withheld time, count]`. **Times and counts only. No coordinate, no distance, no bearing.**
- `failed_t`: the times of failed attempts that fall outside withheld periods (11), so the bar can name them. The one inside a withheld period is counted in the manifest only.
- The manifest: the recording period (first and last source row), the first and last retained fix, every count in §5.2, the rule in §5.1, the timestamp rule and the gap rule.
- **No withheld coordinate appears in any served file:** not in the display file, the manifest, the catalogue, a bounding box, a test fixture or a comment. The bounding box is computed from retained fixes only.

### 5.4 Replay behaviour
- **The replay covers the whole recording period**, 23 June 17:58:44 to 15 September 13:30:18, so the label and the controls agree. It opens in the first withheld period, with no marker.
- **Four states, each with its own wording** (final wording at build, reviewed by GPT):

| Replay time is… | Marker and accuracy | Bar says (shape) |
|---|---|---|
| on or after a retained fix, before the next event | marker on that fix; its accuracy shown with the fix's time and age | "Last displayed fix … · Tag's accuracy estimate N m" |
| inside a joined step that spans a failed attempt | marker stays on the earlier retained fix, named as the last displayed fix | adds "The tag tried for a position at HH:MM and got none" |
| inside the 9-hour step | marker stays on the earlier retained fix, named as such | "No position and no attempt is in the source for 9 h after it" |
| **from the first withheld fix of a period until the next retained fix** | **marker hidden; no accuracy shown; no line drawn into or out of the period** | "Colony-area fixes withheld: N fixes between [time] and [time], within 5 km of the tagging-site reference point, are not shown" |

- Between a retained fix and the first withheld fix after it (normally one interval), the marker stays where it is, named as the last displayed fix with its age. The bar never says the bird stayed inside or outside the radius between recorded events.
- The slider's stops are the retained fixes and the start of each withheld period, in time order.
- The existing "filtered journey" wording path (displayed fixes, not recorded fixes) is used; "No fix was recorded" is never shown for this journey.

### 5.5 Reader changes this needs (page code; GPT reviews the candidate)
- Join flags are today validated only together with Argos quality classes. They are decoupled: a GPS file may carry `j` without `lc`. Existing Argos files must verify exactly as before.
- `acc`: must have `n` entries, each finite and not negative; anything else is "could not be verified, nothing is drawn".
- `withheld`: periods in time order, not overlapping, counts positive whole numbers summing to the manifest's withheld count; no retained fix time inside a period; every step that straddles a period has `j` 0. Any failure: nothing is drawn.
- `failed_t`: increasing whole seconds, none equal to a retained fix time, none inside a withheld period.
- Files without these fields (the three existing journeys) behave exactly as now.

## 6. Accuracy (D3)

- Recommended yes; GPT agrees. Shown only for an actual displayed fix, beside that fix's time and age.
- The marker's size and the line say nothing about accuracy, and the existing note that mark size does not show uncertainty stays.
- No fix is dropped for a poor estimate: there is no source rule to drop by.
- Card line: "Each displayed fix carries the tag's own accuracy estimate (median 4 m, largest 65 m among the 981 displayed). It is the tag's estimate, not a measured error." Figures are for the retained fixes and are recomputed by the builder.

## 7. Builder changes (each stops the build when its condition fails; each recorded in the manifest)

1. Two pinned inputs (§1), with the reference-row identity check.
2. Manual-outlier column optional by config; where the config says absent, the column must be absent. `visible` still enforced.
3. Status and coordinates, validated on every row **before** any spatial filter: `A`/`3` needs both coordinates valid; `D`/`0` needs both absent; a partial coordinate or any other combination stops the build.
4. Timestamp rule (§3), before omission.
5. Withholding rule (§5.1), with the anchor read from the reference file, not typed into the config.
6. Join flags, `withheld`, `failed_t` and `acc` written in one pass from the same rows.
7. Counts cross-checked: source rows = positioned + failed; positioned = retained + withheld; joined steps counted after filtering.

Nothing is thinned, smoothed, interpolated or reordered. No coordinate of a retained fix is rounded or moved.

## 8. Wording

- **Title:** "Waved albatross, animal 3275-30662".
- **Label:** "Recorded movements of one breeding adult, 23 June to 15 September 2008."
- **Beside it:** *Phoebastria irrorata*; tagged at Punta Cevallos (the source's site name); nest stage at tagging "egg" (the source's comment); a GPS fix attempted every 90 minutes; package and paper cited; "one of 28 birds tagged; nine were used in the paper's analysis"; evidence type **filtered recorded fixes (ours)**.
- **Filter statement on the card:** "981 of 1,326 recorded fixes are shown. 345 fixes within 5 km of the tagging-site reference point are withheld by Mother Earth. Times are rounded to the nearest second. The line never crosses a withheld period. 10 joins span a time when the tag tried and got no position." Every number comes from the manifest, none is typed into the page.
- **Not said:** migration; "a foraging trip"; a number of trips; that the bird was incubating throughout; "at the colony" or "at the nest"; where the species is now; any conservation category.
- The paper's own description may be quoted as the paper's, briefly, with the citation.
- Times in UTC, with the README's note about GPS time.

## 9. Size (preliminary)

- Trial of the rev 2 display file, built in memory from the pinned source with the rules above: `t`, `lat`, `lon`, `acc` for 981 fixes, 14 withheld periods, failed-attempt times: **38,801 bytes (15,340 gzip)**. It did not include the join-flag array (about 2 KB). Remeasured at build.
- No hub, storage, schedule, key or charge.

## 10. Decisions for Chad

| | Options | Claude and GPT recommend |
|---|---|---|
| D1 gap rule | A: no join over 3 h 15 min · B: no join over 95 min | A |
| D2 colony-area fixes | A: withhold within 5 km of the tagging-site reference point, with the replay contract in §5 · B: show all · C: generalise | A |
| D3 accuracy per displayed fix | yes · no | yes |
| D4 base | own branch from `animals-journeys-preview-rc` with current main merged, private preview, then a candidate review | yes |
| A-D1 backdrop of the Animals globe (rev 3) | A: the daily satellite picture Earth now uses, with its date stated · B: plain globe with coastline | A, with the plain-globe fallback of §A7 (Claude and GPT) |
| A-D2 build order (rev 3) | two reviewed stages: move the three journeys, then add the bird · or one candidate | two stages (Claude and GPT) |

Already decided by Chad (20 Nov): the globe, toggles and replay live on the Animals tab; toggles replace the dropdown; one journey at a time; the journey controls leave Earth now.

GPT's choices are recommendations, not Chad's approval. A build starts only on Chad's own go.

## 11. Acceptance criteria for the build

**Inputs and validation**
- B1. Both pinned inputs are required by hash; anything else is refused. The reference row's animal id, tag id and deployment date must match.
- B2. `--check` reproduces the display file and manifest byte for byte; no source file is written to the repo.
- B3. Status and coordinate combinations as §7.3, checked before filtering. Tested with altered copies: a partial coordinate; `A` with fix type 0; `D` with a position.
- B4. Timestamps: the two real rows at 19 ms and 21 ms pass; an altered row at 26 ms stops the build; a rounding-boundary case (…​.500) rounds as specified; a collision and an out-of-order row each stop the build. Checked before omission.

**Withholding**
- B5. Boundary: altered copies with a fix just inside, exactly on, and just outside 5.000 km behave as §5.1.
- B6. No withheld coordinate in any served file: the test searches every file under the served tree for each withheld latitude and longitude string, and checks the bounding box against retained fixes only.
- B7. A short withheld step: an altered copy where one withheld fix lies between two retained fixes 3 hours apart produces `j` 0 and no line.
- B8. Leading and trailing withheld periods: this bird's leading period, and an altered copy with a trailing one, replay correctly (no marker; correct wording; controls reach both ends).
- B9. During any withheld period the marker and the accuracy text are absent from the page, checked in the browser, including after a seek, a speed change and a pause.

**Counts**
- B10. Manifest counts equal §2 and §5.2: 1,338 rows; 1,326 positioned; 12 failed; 981 retained; 345 withheld in 14 periods; 966 joined steps, 10 of them spanning a failed attempt. The page reads its numbers from the manifest.

**Accuracy**
- B11. Builder: `acc` has `n` entries, each equal to its row's source value (independent re-read). Reader: rejects a missing entry, a negative, a non-number, a wrong length. Files without `acc` still load.

**Page**
- B12. The three wordings (failed attempt, long gap, withheld) each appear only in their own state; "No fix was recorded" never appears for this journey; the label is exactly the accepted wording; none of the "not said" items appears.
- B13. (rev 3) The Air group and the bird's toggle and card on the Animals tab: every T-criterion of Part A, with the bird as one of the journeys in T5 and T6.
- B14. Failure paths: a changed display file, manifest or catalogue is refused with nothing drawn; a late-arriving load after switching journeys draws nothing; switching between all four journeys leaves no marker or line behind.
- B15. (rev 3) Existing journeys: display files and manifests byte-identical; their suites, rewritten for the Animals tab, and the full older-suite set rerun on the actual merged tree. Every unavoidable change is listed (catalogue, its pinned hash, the script pins, the toggle group, the page move, suite expectations).
- B16. The view fits the retained journey at desktop and 390 px.
- B17. Source guard: `_source-data/` is added to `.gitignore`, and the test run checks that no tracked file sits under it and that no source file name appears in the served tree. This reduces accidental additions; it does not make committing impossible.
- Real phone and screen reader: unverified, as for the rest.

## 11a. Implementation clarifications from GPT's pass (rev 2.1; binding on the build, checked at candidate review)

**Timestamps**
- `ms` is the complete timestamp in integer epoch milliseconds.
- A `.500` timestamp is outside the 25 ms allowance and must stop the integrated builder. Half-up rounding is shown by a unit test of the rounding helper alone. (This corrects B4's ".500 rounds as specified".)
- Tests include: 25 ms passes; 26 ms stops; a `.999` value carries into the next second.

**Hidden span**
- Half-open: from the first withheld time **inclusive** to the next retained time **exclusive**. At that retained event the marker and its accuracy may reappear.
- A trailing period stays hidden through the end of the recording, inclusive, and the controls still reach that end.
- The replay opens with no marker and no accuracy.
- "No line into or out of a period" means no connector bridges it. Track already drawn before the period may stay visible.
- "Longest 144 hours" is rounded; GPT measures about 144.016 hours.

**Failed attempts**
- All 11 `failed_t` entries are kept. "Outside withheld periods" means outside the stored first-to-last tuples only: one of the 11 lies after a period's last withheld fix and before the next retained fix, so it is inside the hidden span.
- **Withholding takes precedence over failed-attempt wording throughout the hidden span.** That entry never restores a marker or accuracy and never turns the screen into an ordinary failed-fix state.
- In a visible joined step, "tried … and got none" appears only once replay time reaches the failed event, never before it.
- The absence of an attempt row is not proof the tag made no attempt; the wording stays limited to what is in the source.

**The centre**
- The manifest may state the reference file's two-decimal point, its provenance, the radius, the distance formula and the boundary rule. Exact withheld fixes and the first-fix-derived centre stay out of every served file. The 5 km rule is a project omission rule, not a guarantee of safety.

**Structure checks**
- `j`: `n` entries, first is 0, only integers 0 or 1, total equals the manifest's joined count, never 1 over the time rule or across a withheld event.
- Periods: integer endpoints inside the recording bounds; first ≤ last; ordered and disjoint; counts and totals agree.
- `failed_t`: integers, inside the recording bounds, unique, count agrees with the manifest.
- **The new bird's manifest requires the new fields.** A missing `acc`, `j`, `withheld` or `failed_t` is a verification failure, never a silent fall back to legacy behaviour. The three existing journeys still load without them.

**Tests**
- The hidden state is tested at its start, just before the next retained event, exactly at that event, at a trailing recording end, and at the failed event that lies inside a hidden span.
- B6's string scan is a supplementary leak check, not proof. Also verified: the structured output holds only retained source rows, and no raw input or extract can be served. (Reformatted numbers could defeat a string match.)
- B17 means no raw source **file** is in the served tree. A provenance manifest may name the source CSV. (This corrects B17's "no source file name appears in the served tree".)

## 12. What rev 1 got wrong

- A 5 ms timestamp allowance. Two positioned rows are 19 ms and 21 ms from a whole second. Claude had counted the millisecond values but looked only at the commonest ones.
- "12 joins span a failed attempt" on the card. That is the count before omission; 10 after.
- Omission by deletion, with a promise of an "at the colony" message the file could not support, and no rule that a withheld fix breaks the line.
- "At the colony" and "about a quarter of the record is at or beside the nest site": distance from a reference point does not identify a nest.
- "The source is not altered" for a filtered, rounded display; and "for a private preview B is harmless".
- The first fix as the anchor without calling it a proxy.
- "11,700 s" described as two intervals.
- "0 flagged" where the file has no outlier field.
- "Can never be committed from any clone" for a `.gitignore` line.

## 13. Not done, not claimed

- Nothing built; no code branch; no page file changed; nothing deployed.
- Trips not counted or segmented. No quality rule of our own. No tag-effect or data-quality finding.
- (rev 3) The parked page was read for where the replay lives and what it depends on (the Earth now globe handle, Key, Layers panel, zoom-out class); it was not audited end to end, and no layout was drawn or measured. The share of the globe the controls may cover at each width is set at build and reviewed.
- No sensitivity conclusion: D2 is Chad's decision, and no option is claimed risk-free.
- Final bar wording: shapes only here.
