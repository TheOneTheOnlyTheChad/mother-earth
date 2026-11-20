# Animals: bird journey build proposal (waved albatross, Galápagos)

20 Nov 2026 · **rev 2.1** (rev 2 PASSED by GPT at proposal level, `reviews/2026-11-20-animals-bird-build-proposal-rev2-gpt-review.md`; rev 2.1 adds §11a, GPT's implementation clarifications, and changes nothing else) · **docs only.** On Chad's go of 20 Nov for the docs-only proposal ("This authorises the bird proposal only. No implementation or deployment yet."). Nothing built, no code branch cut, nothing sent. The Earth from Space probe and its files are untouched.

Rev 2 replaces rev 1 in full. GPT held rev 1 (`reviews/2026-11-20-animals-bird-build-proposal-gpt-review.md`) on two design points, both right: **the 5 ms timestamp rule fails on the pinned file**, and **omitting colony-area fixes by deletion alone would make the replay say false things**. §12 lists what rev 1 got wrong.

**What this proposes:** add one recorded bird to the parked Animals journey replay, as a private preview first: waved albatross `3275-30662`. Label (accepted by GPT): "Recorded movements of one breeding adult, 23 June to 15 September 2008."

**Source basis:** audit D, `docs/research/animals-source-audit/BIRD-JOURNEY.md` rev 1.2, closed by GPT.

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
- B13. The Air group: chooser behaviour, the new card, keyboard and focus as for the existing groups.
- B14. Failure paths: a changed display file, manifest or catalogue is refused with nothing drawn; a late-arriving load after switching journeys draws nothing; switching between all four journeys leaves no marker or line behind.
- B15. Existing journeys: display files and manifests byte-identical; their suites and the full older-suite set rerun on the actual merged tree. Every unavoidable change is listed (catalogue, its pinned hash, the two script pins, the chooser, suite expectations).
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
- Whether the chooser accepts a new group without a code change: not checked. The reader was read for its validation, join and wording paths, not audited end to end.
- No sensitivity conclusion: D2 is Chad's decision, and no option is claimed risk-free.
- Final bar wording: shapes only here.
