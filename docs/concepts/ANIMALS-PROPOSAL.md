# Animals — animal journeys, populations and conservation

18 Nov 2026 · proposal rev 2.1 · for GPT re-check and Chad · no build, no production change

Revises concept spec rev 1 (17 Nov 2026) on Chad's six points of 18 Nov, using the source audit in `docs/research/animals-source-audit/README.md`. Where rev 1 is not mentioned here it stands (questions the feature answers, movement and population interpretation rules, sensitive-location rules, cost and approval rules).

**Rev 2.1 (18 Nov, later):** GPT reviewed rev 2 at `435c897` (relayed by Chad): source choice and design direction accepted, with five clarifications and rulings on N1–N6 and C5. All are folded in below and listed in §1a. Chad also asked for more animals ("dolphins, sharks etc"): §13 is new. GPT's review implies no build or production authorisation, and none is assumed.

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

## 1a. What rev 2.1 changes (GPT's review of rev 2)

| GPT's point | Change | Where |
|---|---|---|
| 1. Exact observation times | Source timestamps kept and tested to the second; the source's time convention stated, never the visitor's time zone; input validation; tests at, before and after a fix, scrubbing backwards, both ends | §5, J2–J4 |
| 2. Gap behaviour | "Over 3 hours" is our provisional display rule, not the researchers'; time since the last fix and the whole gap are shown as two different things; tests at exactly 3 hours and just over; nothing from the future is drawn | §5, J5 |
| 3. Current layers | J9 rewritten as independence, not frozen values; wording changed to "retain their own dates and times; they are not matched to this journey" | §6, J9 |
| 4. Sensitivity | Full precision accepted for the private zebra preview only, on a bounded rationale; public release needs a recorded, dataset-specific decision | §6a |
| 5. Testable acceptance | J12 has a protocol and a tolerance; new items for a bad display file, failed load and retry, rapid switching, other layers preserved, keyboard playback, Sky view and navigation | §8 |
| N1 | Link reads "Choose this journey on Earth now"; selects and reveals the switch, switches nothing on | §3, §10 |
| N3, N4, N5, N6 | Accepted as ruled | §10 |
| N2 | GPT: defer. Chad has since asked for more animals, so a selector design is proposed for review, built only after the first replay | §13 |
| C5 | A retrieval failure does not erase a permitted, dated assessment | §8 C5 |
| Citation | The repository's own citation wording is shown as given | §3 |

Also changed in rev 2, from the audit:
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
  - The study card: source, DOI, licence, the repository's citation as the repository gives it (not reworded; for the zebra package: "Bartlam-Brooks HLA, Harris S. 2013. Data from: In search of greener pastures: using satellite images to predict the effects of environmental change on zebra migration. Movebank Data Repository. https://doi.org/10.5441/001/1.f3550b4f"), the paper's citation, and what the dataset does and does not supply (for the zebra study: "Location uncertainty: not supplied by the dataset").
  - The conservation card and the population chart, each in its honest current state (§7).
  - **"Choose this journey on Earth now"**: a link to Earth now that selects the study there and reveals its switch in the Layers panel. It switches nothing on (N1, accepted by GPT).
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
- **Sky zoom-out view:** entering it pauses playback and hides the journey, the replay bar and the replay-time line; the switch stays on and the Key entry goes (nothing is drawn). Leaving it restores the journey at the same replay time, still paused. It never resumes playing by itself.
- **Leaving the page and coming back** (another tab, Back, the Animals page): the page starts bare as always. The switch is off, no replay position is remembered, and nothing is requested until it is switched on again.
- **A hidden browser tab:** playback pauses when the tab is hidden and stays paused when it is shown again.
- **Other layers:** switching the journey on or off changes no other switch, no other layer's drawing and no selection or open panel elsewhere.
- **Keyboard:** play and pause is a button; the scrubber is a native range control (arrow keys step, Home and End go to the first and last fix); every control has a visible focus and an accessible name; the fix time and age are announced politely, not on every frame.
- **A display file that cannot be trusted:** if the file fails its pinned sha256, does not parse, or does not match its manifest (counts, first and last time), nothing is drawn, the card says "Journey file could not be verified. Nothing is drawn.", and the Key is unchanged. **A failed load** says so and offers Retry; a retry that succeeds draws normally.
- **Rapid switching** (on, off, on within the load time): exactly one journey is drawn at the end, from the last switch-on; no second timer, no leftover objects.
- **Search:** not covered in the first preview. The journey's fixes are not added to search.
- Later studies each get their own switch, or one switch with a study selector. That is decided when a second study exists (decision N2).

## 5. Playback is observation-based

The replay shows what was recorded and says so.

- **The marker sits on the last recorded fix at or before the replay time.** It does not glide between fixes. When the next fix's time is reached, it moves there.
- **Fix time and age are always visible** in the replay bar while the switch is on:
  "Replay time 14 Nov 2007 06:40:00 UTC · Last recorded fix 06:00:44 UTC, 39 min 16 s earlier" (an illustration of the wording, not a quoted fix; real times are the source's, to the second).
- **Times are the source's own.** Each timestamp is parsed explicitly from the source's stated form (`yyyy-MM-dd HH:mm:ss.SSS`) as UTC and carried to the second in the display file. The card states the source's own convention: "Times are as recorded by the study: UTC, or GPS time, which differs from UTC by a few leap seconds (source README)." The page never uses the visitor's time zone and never claims more certainty about UTC than the source gives.
- **The build validates before it draws:** every coordinate finite and inside valid ranges; fixes in time order per animal; two fixes with the same time are an error for this study (the audit found none) and stop the build rather than being silently merged.
- **Only the past is drawn.** At any replay time the globe shows fixes and lines up to that time and nothing later. Scrubbing backwards removes what is now in the future. At the last fix the replay stops; the replay time does not run on past it.
- **Connecting lines are explicit.** A straight line joins consecutive recorded fixes. The Key entry and the study card both say: "The line joins recorded fixes. The path between fixes was not recorded."
- **Fixes are drawn as points**, distinguishable from the line at close zoom.
- **Gaps are study-specific.** Each study's manifest carries its own gap rule and the reason for it.
  - Zebra: fixes are hourly or every 15 minutes. **Provisional display rule (ours, accepted by GPT as provisional): no line joins two fixes more than 3 hours apart.** It is a choice made for this display. The researchers did not supply it and it is not a scientific threshold; the card says so: "Mother Earth does not join fixes more than 3 hours apart. This is a display rule, not part of the study." Exactly 3 hours is joined; anything over is not.
  - In the whole study that is 93 gaps in 53,776 fixes, 88 of them in one animal (`Z6402`); `Z3866` has none.
  - At a gap the line stops and the next fix starts a new line when its time is reached. While the replay time is inside a gap the marker stays on the last recorded fix and the bar gives two separate figures: **time since the last recorded fix** (which grows as the replay runs) and **the whole gap between the two fixes** (fixed). Illustration, from the 38.4-hour gap in `Z6402`: "Last recorded fix 7 Mar 2009 11:00:06 UTC, 5 h 12 min earlier · No fix was recorded for 38 h 24 min after it".
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
  "**Replay: recorded 25 Oct 2007 to 22 Oct 2008.** Other layers on the globe retain their own dates and times; they are not matched to this journey."
- The header clock stays the current UTC clock. The replay clock is a separate element in the replay bar, labelled "Replay time (recorded)", with its year always shown.
- The current UTC clock keeps running, the layers' normal refreshes keep happening and day and night keeps moving, exactly as when no replay is on. Replay controls (play, pause, scrub, speed) never alter another layer's clock, date, data or selection.
- The first preview pairs the journey with **no** environmental layer. No rainfall, vegetation, fire or wind is presented as the conditions the animal met.
- Rev 1 §11 (journeys alongside environmental layers) stays a later step, and only with products matched to the journey's dates. Where no dated product exists, the page says so. Any statement about why an animal moved needs the paper, cited.
- Acceptance tests this as independence from the replay time, not as values that must stay frozen (§8 J9).

## 6a. Sensitivity (rev 2.1)

- **Private zebra preview: full precision, completed historical track, no generalisation.** Accepted by GPT for the private preview. The rationale is bounded: the preview is local and private; the tracks ended in 2008–2009; the same fixes have been public at full precision under CC0 since 2013; and the display adds no place or time the public file does not already give.
- That rationale is **not** a finding that the data expose no sensitive site, and it is not a clearance for public release. Age and public CC0 availability alone do not establish absence of risk.
- **Public release needs a recorded, dataset-specific sensitivity decision** for each study shown: what was considered (species, places, current threats, the data owner's guidance where sought), the treatment chosen from rev 1 §9, and who decided. It goes in the release proposal and REGISTER.
- The whale package's public treatment stays deferred with its quality-rule proposal.

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
- J2. **Times are the source's, to the second.** Every fix time in the display file equals the source file's timestamp to the second (all 13,045 for `Z3866`, checked by script against the pinned source file, not a sample). The parser reads the source's stated form as UTC explicitly; a test run with the browser set to another time zone (Africa/Johannesburg and one west of UTC) shows identical times. The card carries the source's "UTC or GPS time" statement.
- J2a. The build refuses a non-finite or out-of-range coordinate, out-of-order fixes and duplicate times, each tested with a broken fixture.
- J3. The marker is only ever on a recorded fix. Tests set the replay time one second before a fix, exactly at it and one second after it: the marker is on the earlier fix, then the fix, then still the fix.
- J3a. Scrubbing backwards across a fix returns the marker to the earlier fix and removes the later point and its line. Nothing with a time later than the replay time is ever on the globe.
- J3b. Both ends: at the first fix the marker is there with age zero and no line; playback reaching the last fix stops there, the replay time does not pass it, and the wording is "Last recorded fix: tracking record ends here".
- J4. Fix time and age are visible at every replay time, and match the fix under the marker to the second.
- J5. **Gap rule.** Fixes exactly 3 h 00 min 00 s apart are joined; fixes 3 h 00 min 01 s apart are not (fixture). Inside a gap the marker stays on the last fix, "time since the last recorded fix" increases with the replay time and "no fix was recorded for …" stays constant; the line to the next fix never appears before that fix's time. Tested on `Z3866` (no gaps) and on a fixture cut from `Z6402`. The card states that the rule is Mother Earth's display rule.
- J6. The flagged outlier and the rows without a position are not drawn, and the counts are stated.
- J7. First and last points use observation wording.
- J8. The switch is off on load and requests nothing; on, it appears in Layers and, once drawn, in the Key; off, playback stops, the drawing and the replay bar are gone, the Key count drops, and a late load draws nothing.
- J8a. **Rapid switching:** on, off, on inside the load time ends with exactly one journey drawn, one timer and no leftover scene objects (object count compared with a single switch-on).
- J8b. **Bad file:** a display file with a wrong sha256, one that does not parse, and one whose counts or end times disagree with its manifest each draw nothing, show the "could not be verified" wording and leave the Key unchanged.
- J8c. **Failed load and retry:** a failed request shows a failure line and a Retry control; a successful retry draws normally; a second failure leaves nothing drawn.
- J8d. **Other layers preserved:** with other layers on, switching the journey on and off leaves their switches, drawings, Key entries, open inspector and search state as they were.
- J8e. **Keyboard:** the whole replay can be run without a pointer (switch, play, pause, step by arrow keys, Home, End); focus is visible; the controls have accessible names.
- J8f. **Sky view and navigation:** entering the Sky view pauses and hides the journey and removes its Key entry; leaving restores it paused at the same replay time. Leaving the page and returning starts bare with the switch off. A hidden tab pauses playback.
- J9. **Independence from replay time.** With a replay playing and being scrubbed: the header UTC clock keeps advancing; a scheduled refresh of the core layers still happens and updates their data; the day and night line keeps its own current position; the imagery date is whatever the page would show without the replay. No replay control changes another layer's clock, date, data or selection. Tested by running the same scripted period with and without the replay and comparing the other layers' requests and state, and by scrubbing the replay across a year while checking that nothing else moves with it. The replay-time line is present whenever the journey is drawn.
- J10. The Animals tab is on every page; the header passes the overflow suites at 360, 390, 430, tablet and desktop widths.
- J11. Animals sampled (7) and animals shown are both stated. Source, DOI, licence and citation are one action away.
- J12. **Performance, with a protocol and a tolerance.** Protocol: the Ocean Heat release gate (`reviews/2026-11-10-ocean-heat-rc.md` §10; `docs/concepts/OCEAN-HEAT-RELEASE-PROPOSAL.md` D1) with the Stage 0 harness (`reviews/evidence/2026-11-11-globe-perf-stage0/harness.js`): foreground desktop Chrome on the final candidate, the same rotation sweep, three matched runs each of (a) journey off, (b) journey drawn and paused at the last fix, (c) journey playing; the frame state (fast or slow) recorded for every run and only like states compared; then the same three at 390 px emulated width. **Proposed tolerance, for GPT to agree:** against its own journey-off baseline, the median frame interval of (b) and of (c) is no more than 10% or 2 ms higher, whichever is larger, and p95 no more than 20% higher, in at least two of the three matched runs. A miss is reported, not averaged away. N4 (no thinning) holds only if this passes; if it fails, thinning to recorded fixes is the first remedy and is re-measured. A real phone stays unverified until one is tested.
- J13. Existing suites pass; the new suite has breaks that fail for the right reason.

### C. Conservation assessment
- C1. A source audit has been reviewed and its terms allow the intended display (and caching, if cached).
- C2. The card shows the category, the assessment date, the scope (global or regional) and the assessed taxon or population, each from the source.
- C3. Population trend, where the source gives one, is a separate field from the risk category, with the period it describes.
- C4. Where the assessed unit differs from the tracked animals (species-wide assessment, one study herd), the card says so in words.
- C5. (Later stage; GPT's clarification.) Two things are kept apart: whether the source can be reached now, and whether the assessment we hold may still be shown. A temporary retrieval failure does not erase a permitted, dated assessment: the card keeps it with its assessment date and the time it was last retrieved, and says the latest check failed. The card returns to "Not available" when the terms no longer allow display, when the source withdraws or replaces the assessment, or when no permitted copy is held. An assessment is never shown without its own date.
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

## 10. Decisions N1–N6 after GPT's review

- **N1. Accepted.** The link reads "Choose this journey on Earth now". It selects the study and reveals its switch; it switches nothing on.
- **N2. Several studies.** GPT: defer. Chad has since asked for more animals, so §13 proposes the selector for review now; it is built only after the first replay passes J.
- **N3. Accepted as provisional:** fixes more than 3 hours apart are not joined. Our display rule, stated as ours (§5).
- **N4. Accepted:** no thinning at first, subject to J12's measurement.
- **N5.** A courtesy note to the data authors is optional and is Chad's decision. It is not a permission gate. None is sent without his approval.
- **N6. Accepted:** the whale quality rule is its own proposal before any whale build. Raw Argos fixes stay distinct from the paper's modelled tracks.

## 11. Architecture for the first preview (unchanged in kind from rev 1 §10)

- Local only. A branch, a prepared display file for `Z3866`, a manifest with source DOI, source sha256, display-file sha256, counts, gap rule and "location uncertainty not supplied".
- The display file is generated by a script from the repository file, which Chad or Claude fetches once for the build under a separate go. The raw file is not committed.
- Synthetic fixtures for tests are labelled synthetic.
- No hub route, no R2 object, no schedule, no new cost. Public serving (the fixed-catalogue pattern used for Arts, Sky and Ocean Heat) is part of the release proposal after §9 is decided.

## 12. Delivery order (revised)

1. Source audit of the two candidates. **Done.**
2. GPT review of the audit and the proposal. **Done for rev 2; rev 2.1 answers it.**
3. Chad's go for a private journey preview branch (zebra `Z3866`), criteria J.
4. Decision §9.
5. In parallel when Chad chooses: source audits for more animals (§13), a conservation assessment, a population series, or a regularly updated feed. Each is its own bounded step.
6. Whale quality-rule proposal, then the marine preview.
7. Public release proposal: branch, REGISTER entries, credits, costs, release steps, each on Chad's own line.

## 13. More animals (Chad, 18 Nov: "more animals like dolphins, sharks etc")

Not part of GPT's review of rev 2. For GPT and Chad to look at now; nothing here is audited or authorised.

### What the same repository holds
A keyword search of the Movebank Data Repository's own index, 18 Nov 2026 17:23–17:24 UTC: 33 searches, record metadata only, no data file opened (`docs/research/animals-source-audit/repository-discovery-2026-11-18.json`). It returned 125 distinct data packages: 90 marked CC0 1.0, 18 CC BY 4.0, 17 CC BY-NC 4.0. A keyword search is not a complete catalogue.

- **Sharks: no record.** "shark", "elasmobranch" and four shark genus names each returned 0.
- **Dolphins: no record.** "dolphin", *Tursiops*, *Delphinus* and *Orcinus* each returned 0.
- **What is there** (a selection; figures are the repository's own, not counted by us):

| Animals | Dataset DOI | Licence on the record | Published | Animals | Locations | Method as recorded |
|---|---|---|---|---|---|---|
| Humpback whales, east Australia | `10.5441/001/1.294` | CC0 1.0 | 2023 | 50 | 30,029 | Argos Doppler Shift |
| Sperm whales, Gulf of Mexico (FastLoc GPS) | `10.5441/001/1.44cb3946` | CC0 1.0 | 2020 | 17 | 7,151 | GPS |
| Blue and fin whales, Southern California | `10.5441/001/1.98f5r6d0` | CC0 1.0 | 2020 | 13 | 4,277 | Argos Doppler Shift |
| Juvenile reef manta rays, Wayag lagoon, Raja Ampat | `10.5441/001/1.n95c7182` | CC0 1.0 | 2022 | 14 | 98,682 | GPS (the record's taxon field reads *Mobula hypostoma*; its title says *Mobula alfredi*) |
| Reef manta rays, satellite-tracked | `10.5441/001/1.626` | CC BY-NC 4.0 | 2025 | 25 | 3,224 | Argos Doppler Shift/GPS |
| Green and hawksbill turtles | `10.5441/001/1.r72ph75f` | CC0 1.0 | 2021 | 23 | 88,727 | GPS |
| Green turtles, Chagos Archipelago | `10.5441/001/1.313` | CC0 1.0 | 2024 | 33 | 55,411 | GPS/Argos Doppler Shift |
| Loggerhead turtles, North Pacific | `10.5441/001/1.m3c90703` | CC0 1.0 | 2022 | 12 | 17,248 | Argos Doppler Shift |
| Loggerhead turtles, Mediterranean | `10.5441/001/1.1f1h87r8` | CC0 1.0 | 2020 | 11 | 10,271 | Argos Doppler Shift |
| Grey seals | `10.5441/001/1.910p0c20` | CC0 1.0 | 2015 | 16 | 124,360 | GPS |
| Emperor penguins (juveniles) | `10.5441/001/1.sg2s0f7q` | CC0 1.0 | 2022 | 8 | 17,856 | Argos Doppler Shift |
| Grey-headed albatrosses | `10.5441/001/1.694p666h` | CC0 1.0 | 2017 | 24 | 93,474 | GPS |
| Waved albatrosses, Galápagos | `10.5441/001/1.3hp3s250` | CC0 1.0 | 2013 | 28 | 16,414 | GPS |
| White-bearded wildebeest, three populations | `10.5441/001/1.h0t27719` | CC0 1.0 | 2020 | 36 | 279,082 | Accessory Measurements (record's sensor field) |
| African elephants (temperature and movement) | `10.5441/001/1.403h24q5` | CC0 1.0 | 2019 | 14 | 283,688 | GPS |
| African elephants, Etosha | `10.5441/001/1.3nj3qj45_2` | CC BY-NC 4.0 | 2025 | 15 | 2,930,263 | GPS |
| Cheetah, Pilanesberg | `10.5441/001/1.k6b630mv` | CC0 1.0 | 2020 | 1 | 1,182 | GPS |

Every one of these is a closed archive, like the zebra and blue-whale studies. None is audited: the licence shown is the record's label, the counts are the record's, and files, dates, quality fields and sensitivity are unread. CC BY-NC packages add a non-commercial condition that needs Chad's decision against the project's plans.

### Sharks and dolphins need other sources
Rev 1 §5 already names them. None has been audited, and most need the provider's terms read or the provider asked:

| Wanted | Candidate sources (rev 1 §5) | What has to be established first |
|---|---|---|
| Sharks and rays | Ocean Tracking Network public products; SAIAB Acoustic Tracking Array Platform (South African coast); NOAA Animal Telemetry Network | Whether a satellite-tracked or acoustic dataset can be downloaded, transformed and shown; that acoustic detections are drawn as detections at receivers, not as tracks; update frequency; sensitivity. ATAP likely needs a request, which needs Chad's approval |
| Dolphins | NOAA Animal Telemetry Network; OBIS-SEAMAP | Whether any tagged-dolphin track exists under usable terms. Sightings and survey records are occurrences, not journeys, and must not be shown as one |

Some of these sources may update regularly (not checked). If one does, a shark or dolphin feed found there could be the "regularly updated" study that options B and C in §9 need.

### Proposed way to add animals without lowering the bar
1. **The first build stays one zebra replay.** It proves the switch, the replay bar, the gap rule and the wording. Every later study reuses them.
2. **Each added study gets the same short audit as the zebra** (identity, licence, files, dates, counts, method, quality fields, sensitivity, cost) and its own manifest: its own gap rule, its own quality rule, its own sensitivity decision. No study is added from its record label alone.
3. **Studies whose method is GPS and whose record is CC0 come first**, because they need no quality rule of ours: for example grey seals, the turtle and albatross packages, sperm whales (FastLoc GPS), wildebeest. Argos studies (humpback, emperor penguin, loggerhead) wait for the whale quality-rule proposal, which then covers all of them.
4. **Several studies on the page (N2):** the Animals page lists studies under Land, Sea and Air (rev 1 §4). The globe keeps **one** journey switch; the study chosen on the Animals page, or from a selector beside the switch, is the one it draws. One journey at a time at first, so the replay clock and the dates on screen stay unambiguous. Built after the first replay passes J.
5. **Sensitivity is decided per study** (§6a). Elephants, cheetah, nesting turtles and penguin colonies are the obvious cases for a recorded decision before anything public.

### What Chad would be choosing
- **Which animals next.** A bounded audit batch of three to five packages from the table is about the size of the zebra and whale audit. Suggested first batch: humpback whales, grey seals, one turtle package, one albatross package, wildebeest.
- **Whether to open the shark and dolphin source audit** (reading terms only at first; any provider message comes back for approval).

## 14. Not done, not claimed

- Nothing is built. No file from either study is stored in the repository or on the Mac.
- No provider was contacted. Nothing was spent.
- The papers were read only as the abstracts carried on the repository records.
- No conservation category, population figure or trend for zebra or blue whale is stated anywhere in this proposal or the audit.
- Phone performance, hosting cost and the fifth header tab are unmeasured.
- No package in §13 has been audited; no shark or dolphin source has been opened.
