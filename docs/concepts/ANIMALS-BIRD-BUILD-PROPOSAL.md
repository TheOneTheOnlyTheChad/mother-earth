# Animals: bird journey build proposal (waved albatross, Galápagos)

20 Nov 2026 · rev 1 · for GPT · **docs only.** On Chad's go of 20 Nov ("Go on the docs-only bird build proposal for GPT … This authorises the bird proposal only. No implementation or deployment yet."). Nothing built, no branch cut for code, nothing sent. The Earth from Space probe and its files are untouched.

**What this proposes:** add one recorded bird to the parked Animals journey replay, as a private preview first: waved albatross `3275-30662`, 23 June to 15 September 2008, 1,326 recorded GPS fixes. It reuses the replay GPT passed at `f00a330`. It needs four small, stated changes to the builder and three decisions from Chad (§6).

**Source basis:** audit D, `docs/research/animals-source-audit/BIRD-JOURNEY.md` rev 1.2, closed by GPT (`reviews/2026-11-20-animals-audits-c-d-closure-gpt-review.md`). Label accepted by GPT: "Recorded movements of one breeding adult, 23 June to 15 September 2008".

## 1. Source, pinned

| | |
|---|---|
| Package | Movebank Data Repository, doi `10.5441/001/1.3hp3s250` (Cruz, Proaño, Anderson, Huyvaert, Wikelski 2013) |
| Paper | Dodge and co-authors 2013, *Movement Ecology* 1:3, doi `10.1186/2051-3933-1-3` |
| Licence | CC0 1.0; cited in any case (project requirement) |
| Data file | `Galapagos Albatrosses.csv`, 4,913,156 bytes, sha256 `1b62b43cfce5067193cde0fc1c5b6144eff193bd7c995160961479921fd4a8e6` |
| Reference file | `Galapagos Albatrosses-reference-data.csv`, 6,066 bytes, sha256 `1d7b24cf119f65ba7c90358b52ed5d29ec07b1b87c61ca6960b4bfad108061ad` |
| Where the bytes are | Chad's Mac, `~/Documents/Mother Earth/_source-data/animals-expansion/` (moved from Downloads 20 Nov 14:36 UTC, hash-checked). Never in Git, never in a served folder |
| Bird | `3275-30662`, tag 132; adult; deployed 2008-06-23 at Punta Cevallos; nest stage "egg"; manipulation none; "used in analysis and shown in Figs 7-8" |

## 2. What the bird's record contains (measured 20 Nov 14:37 UTC from the pinned file)

- 1,338 source rows: **1,326 positioned fixes** (status A, 3D fix) and **12 rows with no position** (status D, fix type 0). All rows `visible` true. The file has **no `manually-marked-outlier` column**.
- First fix 2008-06-23 17:58:44 UTC, last 2008-09-15 13:30:17.999 UTC. Strictly increasing in time; no repeated time.
- **Timestamps carry milliseconds:** `.000` on 362 fixes; the rest a few milliseconds either side of a whole second (for example `.001`, `.998`, `.999`).
- **Steps between positioned fixes:** 1,311 are one 90-minute interval; 12 are two intervals (each spans one of the 12 no-position rows); 1 is about 9 hours (32,414 s); 1 is 195 s. 1,250 of 1,325 steps are within a minute of a multiple of 90 minutes.
- **The tag's own horizontal accuracy estimate:** every positioned fix has one. 1.79 m at best, median 4.35 m, 95% under 17.41 m, worst 70.4 m; 34 fixes over 25 m, 5 over 50 m. This is the tag maker's estimate, not a measured error.
- Extent: 12.79°S to 0.42°S, 90.95°W to 77.52°W. No date-line crossing; nowhere near a pole.
- **Colony side:** 327 fixes are within 1 km of the first fix, 345 within 5 km, 389 within 20 km. About a quarter of the record is at or beside the nest site.
- Coordinates are given to 4 to 7 decimals as the source wrote them.
- Not counted, not shown: a number of trips (GPT: none is assigned).

## 3. What changes, and what does not

**Unchanged:** the replay, its controls, the Animals tab, the gap-break drawing, the catalogue-and-manifest checks, and "nothing thinned, smoothed, interpolated or reordered". The display file keeps the existing shape (`schema`, `id`, `study`, `animal`, `n`, `t`, `lat`, `lon`), so the page's reader needs no change for the basic replay.

**Builder changes (each stops the build if its condition is not met; each recorded in the manifest):**

1. **Outlier column optional.** Where a study's file has no `manually-marked-outlier` column, the config says so (`"outlier_column": "absent"`), and the builder then requires it to be absent. `visible` is still required and enforced.
2. **Quality fields required for this study.** A usable fix must have status `A` and fix type `3`; a row with status `D` must have no position. Any other combination stops the build. Rows without a position are counted and never written, never zero, never interpolated.
3. **Millisecond rule.** The existing builder stops on any fractional second. Proposed for this study: round to the nearest whole second, allowed only when the source value is within 5 ms of a whole second; anything else stops the build; two fixes landing on the same second stops the build. The manifest states the rule and the largest change made. (The README already says times may be GPS time, a few leap seconds from UTC, so a 2 ms rounding claims no precision the source lacks.) Alternative: carry milliseconds in the file, which changes the display schema and the page reader.
4. **Optional accuracy array.** `"acc"`: the tag's estimate for each fix, same order and count as `t`, digits as the source wrote them. The builder writes all four arrays from the same row in one pass, so an accuracy value cannot separate from its fix.

**Page changes (small; any change to page code needs GPT again):**

- A third group, **Air**, in the journey chooser. To verify at build: whether the chooser already takes any group name from the catalogue.
- When a display file has `acc`, the fix line adds "Tag's accuracy estimate: N m" for the fix under the marker, and the note says what that is and is not.
- The card's evidence type: **recorded fixes**.

**New files at build:** `phase1/animals/waved-albatross-galapagos.json` (config); `assets/animals/waved-albatross-galapagos-3275-30662-R1.json`; `assets/animals/waved-albatross-galapagos-R1.manifest.json`; one more entry in the catalogue (which changes the catalogue's hash and the two script pins, as GPT noted for the parked branch).

## 4. Wording

- **Title:** "Waved albatross, animal 3275-30662" (the id shown as the source gives it; no given name exists).
- **Label:** "Recorded movements of one breeding adult, 23 June to 15 September 2008."
- **Context beside it:** *Phoebastria irrorata*; tagged at Punta Cevallos (the source's site name); nest stage at tagging "egg" (the source's comment); a GPS fix attempted every 90 minutes; the package and paper cited; "one of 28 birds tagged; nine were used in the paper's analysis".
- **Not said:** migration; "a foraging trip"; a number of trips; that the bird was incubating throughout; anything about where the species is now; any conservation category on this card (the assessment card is a separate module).
- **The paper's own description** ("long-range trips" to foraging areas off Peru, outbound into headwinds and back with tailwinds) may be quoted as the paper's, briefly, with the citation.
- **Time:** shown in UTC like the other journeys, with the README's note about GPS time.
- **Location uncertainty line:** "Each fix carries the tag's own accuracy estimate (median 4 m, largest 70 m for this bird). It is the tag's estimate, not a measured error."

## 5. Size

| Encoding | Bytes | Compressed (gzip -9) |
|---|---|---|
| Existing shape, all 1,326 fixes, source digits | 44,980 | 17,083 |
| The same with the `acc` array | 51,624 | 19,088 |

Measured by building the file in memory from the pinned source, before the millisecond rule (whole seconds taken by truncation for the measurement only). The manifest is about 3.5 KB as for the zebra. No hub, storage, schedule, key or charge. If the colony-side option in §6 is chosen the file is smaller; it is remeasured at build.

## 6. Decisions for Chad (GPT's view asked on each)

**D1. Gap rule.** The zebra's rule (no join over 3 hours) does not fit: the 12 two-interval steps sit right at 3 hours, so some would join and some would not, by a few seconds.
- **A (recommended): join up to two scheduled intervals** (no join over 3 h 15 min, 11,700 s). The 12 steps that span a failed fix are joined and the card says so ("12 joins span a time when the tag tried and got no position"). The 9-hour step is a break.
- B: join only consecutive scheduled fixes (no join over 95 minutes). 13 breaks. Stricter, and shows every failed fix as a gap.
- Either way it is Mother Earth's display rule, stated as such, set from this study's schedule.

**D2. Colony-side fixes.** The file places the bird at its nest site to a few metres, 327 times. The species breeds almost only on one island; the site is named in the source; the data have been public under CC0 since 2013 and are from 2008. The reference file itself gives the site to two decimals (about 1 km).
- **A (recommended for the first public-facing design): do not show fixes within 5 km of the first fix.** 345 fixes omitted, 981 shown; the replay says "At the colony: positions within 5 km are not shown" for those times, and the card states the count. The same distance the grey-headed study's authors removed. It is our omission, stated; the source is not altered.
- B: show every fix as recorded.
- C: show colony-side fixes at the reference file's two-decimal precision, marked as generalised by us.
- This is a display choice, not a licence requirement, and no option proves the display risk-free. For a private preview B is harmless; the decision matters for any public release, and building A first avoids a second build.

**D3. Accuracy shown per fix?** Recommended yes (the `acc` array, +6.6 KB). No fix is dropped for a poor estimate: there is no source rule to drop by, and a rule of ours would need its own proposal.

**D4. Base.** The build would start from `animals-journeys-preview-rc` (code `f00a330`) with current main merged in first, on its own branch, as a **private preview**. Public release stays a separate proposal with the three parked animals' release work.

## 7. Acceptance criteria for the build (proposed)

- B1. The builder accepts only the pinned source bytes (sha256 above) and refuses anything else.
- B2. `--check` reproduces the display file and manifest byte for byte; the source file is never written to the repo.
- B3. Counts in the manifest equal this proposal's: 1,338 rows, 1,326 positioned, 12 without position, 0 flagged; or, under D2-A, the stated shown and omitted counts, which sum to 1,326.
- B4. Every fix written has status A and fix type 3; the build stops on any other combination. Tested with altered copies.
- B5. Millisecond rule: stops when a value is more than 5 ms from a whole second, and when two fixes collide. Tested with altered copies. The manifest records the largest change.
- B6. `acc` has `n` entries and each equals its row's source value. Tested by an independent re-read of the source.
- B7. The gap rule is this study's (D1); the line never joins across a longer step; the count of joins that span a failed fix is on the card.
- B8. No coordinate is rounded, moved or invented. Under D2-A the omitted fixes are absent, not replaced.
- B9. Wording as §4; none of the "not said" items appears. The label is exactly GPT's accepted wording.
- B10. Existing journeys are unchanged: their display files, manifests and tests are byte-identical, and the full older-suite set is rerun on the merged tree.
- B11. The view fits the journey (about 12° of latitude by 13° of longitude) at desktop and 390 px.
- B12. Keyboard, focus and the replay line work for the new group as for the existing ones. Real phone and screen reader stay unverified, as for the rest.

## 8. Dependencies and risks

- The journeys branch is parked with release corrections outstanding (GPT's resume list). This build adds to it; it does not release it.
- A fourth journey and a third group change the catalogue, the script pins and some suite expectations. Earth from Space also touches the header and switch suites: whichever merges second merges main first and reruns them.
- The date-line tests of the expansion proposal §10 are not needed for this bird and are not weakened by it; the grey-headed file remains the test case when a crossing journey is proposed.
- Proposed guard, at build: add `_source-data/` to `.gitignore` so the local source folder can never be committed from any clone.

## 9. Not done, not claimed

- Nothing built; no code branch; no page file changed; nothing deployed.
- Trips not counted or segmented. No quality rule of our own. No tag-effect or data-quality finding.
- Whether the chooser accepts a new group without a code change: not checked.
- No sensitivity conclusion: D2 is a decision, recorded when Chad makes it.
- Real phone and screen reader: unverified.
