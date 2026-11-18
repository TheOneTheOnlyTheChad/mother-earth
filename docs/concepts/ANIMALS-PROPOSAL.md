# Animals — animal journeys, populations and conservation

18 Nov 2026 · proposal rev 2 · for GPT review · no build, no production change

Revises concept spec rev 1 (17 Nov 2026) on Chad's six points of 18 Nov, using the source audit in `docs/research/animals-source-audit/README.md`. Where rev 1 is not mentioned here it stands (questions the feature answers, movement and population interpretation rules, sensitive-location rules, cost and approval rules).

**Authorised so far (Chad, 18 Nov):** a bounded source audit and this revised proposal. Not authorised: any build, provider message, spending, merge or deploy.

## 1. What changed from rev 1

| # | Chad's point | Where |
|---|---|---|
| 1 | A dedicated Animals navigation tab | §3 |
| 2 | Standard labelled globe switches, off by default, in Layers and the drawn Key; switching off stops playback and clears the drawing | §4 |
| 3 | Separate acceptance criteria for journey preview, conservation assessment and population chart | §8 |
| 4 | Observation-based playback: last recorded fix, visible fix time and age, explicit connecting lines, study-specific gaps | §5 |
| 5 | Historical replay time kept apart from current environmental layers | §6 |
| 6 | A decision point on archived studies versus regularly updated feeds before public release | §9 |

Also changed, from the audit:
- The first study is chosen: **Botswana zebra, animal `Z3866`** (§2).
- The blue-whale package holds Argos locations that are not a cleaned track. It moves to a later preview with its own quality-rule proposal (§2).
- The conservation card and the population chart have **no audited source yet**. They are specified as "not available" states, not as content (§7).

## 2. First study (from the audit)

| | Botswana zebra | Eastern North Pacific blue whales |
|---|---|---|
| Dataset | Movebank Data Repository `10.5441/001/1.f3550b4f` | Movebank Data Repository `10.5441/001/1.5ph88fk2` |
| Licence on the record | CC0 1.0 | CC0 1.0 |
| Method | GPS collars, hourly or 15-minute fixes | Argos Doppler satellite tags |
| Observed | 25 Oct 2007 to 1 Jun 2009 | 28 Aug 1993 to 10 Apr 2009 |
| Usable | 7 animals, 53,776 fixes | 143 animals, 15,778 visible rows; 56 animals with 100 or more |
| Source's quality fields | outlier flag only (1 row); no per-fix accuracy | location class per fix; 471 rows flagged; implausible steps remain in 115 animals |
| Updated since publication | no (2013 archive) | no (2019 archive) |
| Role | **first private journey preview** | later marine preview, after a quality-rule proposal |

- First animal: `Z3866`. One year (25 Oct 2007 to 22 Oct 2008), 13,045 fixes, a complete journey out to the Makgadikgadi grasslands and back to the Okavango Delta, no gap over 3 hours, no flagged row.
- Second animal, only if the display stays readable (rev 1 §4): `Z3743`, the other complete out-and-back.
- The study has seven animals. The preview says so and says how many are shown.

## 3. Navigation: a dedicated Animals tab

- Header tabs become **Earth now · Timeline · Moon · Sun · Animals** on every page, and the Menu gains the same entry.
- The tab opens a new page, `animals.html`: the explorer.
  - Study list (one study in the first preview) with species, place, method, observation period, animals sampled and animals shown.
  - The study card: source, DOI, licence, citation, what the dataset does and does not supply (for the zebra study: "Location uncertainty: not supplied by the dataset").
  - The conservation card and the population chart, each in its honest current state (§7).
  - "Show this journey on the globe": a link to Earth now that selects the study there. It does not switch anything on (decision N1, §10).
- The journey itself is drawn on the Earth globe, under the switch in §4. The Animals page holds the evidence and the words; the globe holds the drawing. One globe, one Layers panel, one Key.
- The header already carries four tabs at phone width in a two-row grid. A fifth tab must be measured at 360, 390 and 430 px before it is accepted (`desktop-overflow`, `mobile-pass`, and the header rules in START-HERE §4x). If five do not fit, that is reported back before any layout change.

## 4. Globe switches

One switch in the first preview, built like every other map-layer switch (Bare Earth stage B):

- **"Animal journey — show on the globe"**, in Optional layers. `role="switch"`, `aria-checked`, described by the card's evidence line. Off on every load. Nothing is requested while it is off.
- **Layers panel:** it has a row there like every other layer, and "Layers · N on" counts it when on.
- **Key:** one entry, "Animal journey: recorded fixes and the line joining them", shown and counted in "Key · N layers" only while the journey is actually drawn (its own `drawn()`, a line in `SHEET_DRAWN`, and `ME.paintKeyExternal` from its `paint()`). Loading, failed with nothing drawn, or off: not in the Key.
- **Switching on:** loads the display file, draws the track up to the replay time, shows the replay bar (§5) paused at the first fix. Playback starts only when the visitor presses play.
- **Switching off:**
  - stops playback and its timer;
  - cancels a load still in flight, and a load that completes afterwards draws nothing (generation token, as Ocean Heat and Night lights);
  - removes every object it added to the globe and releases them;
  - hides the replay bar and the replay-time line (§6);
  - removes its Key entry and repaints the count.
- **Sky zoom-out view:** the journey is hidden there, like the other optional layers.
- **Search:** not covered in the first preview. The journey's fixes are not added to search.
- Later studies each get their own switch, or one switch with a study selector. That is decided when a second study exists (decision N2).

## 5. Playback is observation-based

The replay shows what was recorded and says so.

- **The marker sits on the last recorded fix at or before the replay time.** It does not glide between fixes. When the next fix's time is reached, it moves there.
- **Fix time and age are always visible** in the replay bar while the switch is on:
  "Replay time 14 Nov 2007 06:40 UTC · Last recorded fix 06:00 UTC, 40 min earlier".
- **Connecting lines are explicit.** A straight line joins consecutive recorded fixes. The Key entry and the study card both say: "The line joins recorded fixes. The path between fixes was not recorded."
- **Fixes are drawn as points**, distinguishable from the line at close zoom.
- **Gaps are study-specific.** Each study's manifest carries its own gap rule and the reason for it.
  - Zebra: fixes are hourly or every 15 minutes. Proposed rule: **no line across a gap longer than 3 hours.** In the whole study that is 93 gaps in 53,776 fixes, 88 of them in one animal (`Z6402`); `Z3866` has none.
  - At a gap the line stops, the next fix starts a new line, and while the replay time is inside the gap the bar reads "No fix recorded for 38 h (from 7 Mar 2009 11:00 UTC)".
  - The whale study needs a different rule (median 9.9 hours between locations) and a quality rule. Both belong to its own proposal.
- **Rows the source flagged or left empty are counted, not drawn.** The card states: "1 fix flagged as an outlier by the source and 17 fix attempts without a position are not drawn" (study totals; per animal on its card).
- **First and last points** read "First recorded fix" and "Last recorded fix: tracking record ends here". Nothing is said about why a record ends. Mortality is never implied (rev 1 §7).
- **Speed control** changes how fast replay time advances, never what is drawn.
- **Nothing is interpolated, smoothed or modelled** in the first preview. If thinning is needed for phones, it keeps recorded fixes only (for example one fix an hour), the manifest states the rule, and the card states the count shown against the count recorded.
- **Uncertainty:** the zebra dataset supplies none per fix. The card says so. No accuracy figure is invented from the collar model.
- One open point from the audit for the build: `Z6405`'s first fix is 15.1 km from its second, an hour apart. Whether the first fix predates the collar being fitted is not stated by the source. `Z6405` is not in the first preview.

## 6. Replay time is not the globe's time

The journey is from 2007–2008. Everything else on the globe is current: imagery, day and night, fires, wind, ships, buoys.

- While the switch is on, a persistent line sits with the replay bar:
  "**Replay: recorded 25 Oct 2007 to 22 Oct 2008.** Other layers on the globe show current data, not conditions during this journey."
- The header clock stays the current UTC clock. The replay clock is a separate element in the replay bar, labelled "Replay time (recorded)", with its year always shown.
- The day and night shading, the imagery date and every other layer keep their own times. Scrubbing the replay never moves them.
- The first preview pairs the journey with **no** environmental layer. No rainfall, vegetation, fire or wind is presented as the conditions the animal met.
- Rev 1 §11 (journeys alongside environmental layers) stays a later step, and only with products matched to the journey's dates. Where no dated product exists, the page says so. Any statement about why an animal moved needs the paper, cited.
- Acceptance includes a check that no current-layer wording changes while a replay runs (§8 J9).

## 7. Conservation assessment and population chart: current state

**No source for either has been audited.** Rev 1 §16 lists the open terms questions (IUCN display, caching and account conditions; the Living Planet data agreement). Chad's instruction: keep unavailable evidence visibly unavailable, and do not substitute occurrence counts or tag counts for population trends.

So in the first preview the Animals page shows both cards in a stated empty state:

- **Conservation assessment:** "Not available yet. No assessment source has been reviewed for display on Mother Earth." No category, no trend arrow, no colour.
- **Population:** "Not available yet. No population series has been reviewed." No chart axes, no placeholder line.
- **Never shown as a stand-in:** the number of tagged animals, the number of fixes, occurrence or sighting counts, or the number of studies. Where such a number appears it is labelled as what it is: "7 animals were tracked in this study. This is a sample size, not a population estimate."

Each becomes content only after its own source audit (identity, terms, display and caching rights, attribution, costs, update cadence), GPT review and Chad's go. Candidates named in rev 1 §5 remain candidates.

## 8. Acceptance criteria (three separate sets)

### J. Journey preview (private)
- J1. One real study, the zebra package at its DOI, pinned by the sha256 of the source file and of the prepared display file. The manifest carries the fields in rev 1 §10 plus the gap rule and counts not drawn.
- J2. `Z3866` replays from its first to its last recorded fix with dates correct to the minute against the source file (checked on a sample of fixes, including the first, the last and both sides of a UTC midnight).
- J3. The marker is only ever on a recorded fix. A test steps the replay time between two fixes and finds the marker on the earlier one.
- J4. Fix time and age are visible at every replay time, and match the fix under the marker.
- J5. No line crosses a gap longer than the study's rule. Tested on `Z3866` (no gaps) and on a fixture cut from an animal with gaps.
- J6. The flagged outlier and the rows without a position are not drawn, and the counts are stated.
- J7. First and last points use observation wording.
- J8. The switch is off on load and requests nothing; on, it appears in Layers and, once drawn, in the Key; off, playback stops, the drawing and the replay bar are gone, the Key count drops, and a late load draws nothing.
- J9. With a replay running, the header clock, imagery date, day and night shading and every other layer's wording and data are unchanged. The replay-time line is present whenever the journey is drawn.
- J10. The Animals tab is on every page; the header passes the overflow suites at 360, 390, 430, tablet and desktop widths.
- J11. Animals sampled (7) and animals shown are both stated. Source, DOI, licence and citation are one action away.
- J12. Frame time with the journey drawn is no worse than without it by the regression gate used for Ocean Heat, on desktop and at phone width.
- J13. Existing suites pass; the new suite has breaks that fail for the right reason.

### C. Conservation assessment
- C1. A source audit has been reviewed and its terms allow the intended display (and caching, if cached).
- C2. The card shows the category, the assessment date, the scope (global or regional) and the assessed taxon or population, each from the source.
- C3. Population trend, where the source gives one, is a separate field from the risk category, with the period it describes.
- C4. Where the assessed unit differs from the tracked animals (species-wide assessment, one study herd), the card says so in words.
- C5. If the source is unreachable or its terms change, the card returns to "Not available", never to a stale value presented as current.
- C6. Until C1 is met the card reads as in §7.

### P. Population chart
- P1. A reviewed series of counts, abundance estimates or a documented abundance index. Occurrence counts, tag counts and detection counts never qualify.
- P2. The chart states the population or stock, region, unit, method, survey years and source.
- P3. Uncertainty is drawn where the source supplies it and stated as not supplied where it does not.
- P4. Missing years are gaps, not joined. Method changes are marked.
- P5. A trend word (increasing, decreasing, stable, uncertain) appears only when the source states it, with its period. No trend of our own without a documented, reviewed method.
- P6. The chart states whether its population and period match the tracked study.
- P7. Until P1 is met the card reads as in §7.

J can pass with C and P still at "Not available". That is the expected state of the first preview.

## 9. Decision point: archived studies or regularly updated feeds

Chad's feature rule (15 Nov): live or regularly updated feeds only. It dropped "The Ground Moved" and stopped "Follow the Dust". One exception exists: microplastic samples, shown as dated because nobody measures them continuously.

**Both audited studies are closed archives.** The zebra data ends in 2009 and was published in 2013; the whale data ends in 2009 and was published in 2019. Neither will update.

The private preview does not decide this. It proves the replay on real data, and a regularly updated feed would reuse the same switch, replay bar and rules.

**Before any public release, Chad decides one of:**

| Option | What the public sees | What it needs |
|---|---|---|
| A. Archived journeys are allowed on the Animals tab as dated replays | Zebra replay, clearly historical | An explicit exception to the rule, like microplastic, with the dates always on screen |
| B. Private until a regularly updated feed is cleared | Nothing public yet | A source audit of at least one ongoing study (access, update frequency, display rights, delay, sensitivity). Likely a provider message, which needs Chad's approval |
| C. Public only as a pair | An archived replay beside a regularly updated study | Both of the above |

No option is assumed. The proposal's later steps (public release, hub files, REGISTER entries) wait for this decision.

## 10. Other decisions for GPT and Chad

- **N1. The link from the Animals page to the globe.** Recommended: it opens Earth now with the study selected and the Layers panel on the journey's row, and switches nothing on, consistent with "start bare every time". Alternative: it switches the layer on and says so, as search does.
- **N2. Several studies:** one switch with a selector, or one switch per study. Deferred until a second study exists.
- **N3. Zebra gap rule:** 3 hours proposed (three missed hourly fixes). GPT to challenge.
- **N4. Thinning:** full resolution for one animal is about 66 KB gzipped (13,045 fixes). Proposed: no thinning in the first preview.
- **N5. Contacting the data authors.** The package recommends it and the licence does not require it. A courtesy note is Chad's to send or not; none is sent without his approval.
- **N6. The whale quality rule** (which location classes are drawn, how implausible steps are treated, which Argos solution): its own proposal before any whale build.

## 11. Architecture for the first preview (unchanged in kind from rev 1 §10)

- Local only. A branch, a prepared display file for `Z3866`, a manifest with source DOI, source sha256, display-file sha256, counts, gap rule and "location uncertainty not supplied".
- The display file is generated by a script from the repository file, which Chad or Claude fetches once for the build under a separate go. The raw file is not committed.
- Synthetic fixtures for tests are labelled synthetic.
- No hub route, no R2 object, no schedule, no new cost. Public serving (the fixed-catalogue pattern used for Arts, Sky and Ocean Heat) is part of the release proposal after §9 is decided.

## 12. Delivery order (revised)

1. Source audit of the two candidates. **Done, with this proposal.**
2. GPT review of the audit and this proposal.
3. Chad's go for a private journey preview branch (zebra `Z3866`), criteria J.
4. Decision §9.
5. In parallel when Chad chooses: a source audit for a conservation assessment, a population series, or a regularly updated feed. Each is its own bounded step.
6. Whale quality-rule proposal, then the marine preview.
7. Public release proposal: branch, REGISTER entries, credits, costs, release steps, each on Chad's own line.

## 13. Not done, not claimed

- Nothing is built. No file from either study is stored in the repository or on the Mac.
- No provider was contacted. Nothing was spent.
- The papers were read only as the abstracts carried on the repository records.
- No conservation category, population figure or trend for zebra or blue whale is stated anywhere in this proposal or the audit.
- Phone performance, hosting cost and the fifth header tab are unmeasured.
