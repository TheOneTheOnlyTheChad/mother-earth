# Review packet: `animals-tab-rc`, Stage 2 (the waved albatross)

Written 20 Nov 2026 19:24 UTC (clock reading). **Branch only: nothing merged, nothing deployed, nothing sent, nothing spent. Private preview.**

Built under Chad's go of 20 Nov (D1 A, D2 A, D3 yes, D4 yes) after GPT's pass of Stage 1 r2 (`reviews/2026-11-20-animals-tab-stage1-r2-gpt-review.md`). Design: `docs/concepts/ANIMALS-BIRD-BUILD-PROPOSAL.md` rev 3.1 Part B, criteria B1 to B17 and §11a (branch `animals-expansion-proposal`, `d97880e`).

## 1. What to review
- Code commit: `ec199058bd53eef9ff300488bc19909166bfce43`. The head is the later commit that adds this packet only. Comparison point: Stage 1 r2, `069a2dc`.
- Files (sha256 at the code commit):

| File | sha256 | What |
|---|---|---|
| `phase1/animals/build_gps_filtered_journey.py` (new) | `7a9b24d6beb563a009af8c4d3beafdfaa24a6e602bb01d172cf0a21f551f95ad` | the bird's builder |
| `phase1/animals/waved-albatross-galapagos.json` (new) | `0c50a1e79a995e961fd6e53d321b7319223a82fc6c3041cf426b66e280f9b122` | its config: pins, rules, expected counts |
| `phase1/animals/build_gps_filtered_journey.test.py` (new) | `312fb3282b47c640e9df83797b595bc1e75ee118559cbca4ec1d1d124eaadc3d` | builder tests |
| `assets/animals/waved-albatross-galapagos-3275-30662-R1.json` (new) | `4261103073f5f66c9c59c6ea0251993d745c7aad6523bd393235d2e811b62375` | display file, 40,759 bytes (15,459 gzip) |
| `assets/animals/waved-albatross-galapagos-R1.manifest.json` (new) | `b9d0b021b1143c6b25efe60d638e09fb5486005ef719404bbc66b48ef9ca5555` | manifest |
| `assets/animals/journeys-R1.catalog.json` | `1386e4cc4fbc8c1c294ce867f42702c3c838fbde3c41fd9ce788fc275a77fafe` | fourth entry added (Air) |
| `animals-journey.js` | `86e0eecbe85a5145945d0cddf4257ca678fdab956451338ab3ed8cafdfce6b5b` | reader: new fields, withheld spans, recording-period replay |
| `animals.js` | `f4d2bf1d87c2fc3bef22ef0ded4e2cdbba24734ec5b37f14e8264dff566d4618` | card: recording period, withholding statement, no land row |
| `animals.html` | `af9ea68b3d35fef727264711e0519e704d5ad77834f54db6b2a72dc11d0c1498` | Air switch and card |
| `phase1/animals-tab-ui.test.cjs` | `6136f60b84b0edff16cde4072b7e3290c4ffde63aada993bd1ffa504dc89f1fc` | four journeys; sections 18 and 19 |
| `phase1/animals/build_argos_journey.test.py` | `384d3de5950773c1c27051ec2604918900c305ebf5be4b01d7deeea9b30be2c4` | list check now expects four entries |
| `.gitignore` | `a8f40f6d2a4d5fdf2bc09bfa618c8bff9c6e1e3a71fd603c1db88d29e2e7e590` | `_source-data/` |

- **B15, unchanged:** the three existing display files and manifests, both older builders, `animals-globe.js`, `style.css`, `index.html` and every other page. Unavoidable changes: the journey list (one entry added), its pinned checksum in both scripts (`a25cdce3…` to `1386e4cc…`), the script version keys (`?v=202612200300`), the switch group and cards, suite expectations.
- **Source files:** the two pinned CSVs stayed on Chad's Mac in `_source-data/animals-expansion/`. They were staged into the build workspace outside the repository, hash-checked there (`1b62b43c…`, `1d7b24cf…`), and are not in Git.

## 2. Deviations and choices to check
1. **A separate builder file,** not edits to `build_journey.py`. The zebra's builder is untouched so that journey still rebuilds byte for byte. Proposal §7 spoke of "builder changes"; every rule in §7 is in the new file.
2. **Bar wording for the withheld state** (final wording was left to the build): "Fixes near the tagging site are withheld: N fixes between [time] and [time], within 5 km of the tagging-site reference point, are not shown. No marker is shown · Next displayed fix [time]". I did not use the proposal's "Colony-area fixes", because §5.1 says the page does not say "at the colony" of anything inside the disk.
3. **"Next displayed fix [time]"** is shown during a withheld span. It is a retained fix's time, nothing about a withheld one. Say if you would rather it were not there.
4. **In the step that leads into a withheld period** (a displayed fix, then withheld fixes) the bar adds no gap sentence, so it says nothing about where the bird was between recorded events.
5. **A step over the rule with a failed attempt and no withheld fix** would read "No position is in the source for … after it" (no such step exists for this bird; the 9-hour step has no row of any kind and reads "No position and no attempt is in the source for 9 h 0 min 14 s after it").
6. **Fix marks** use the larger size the Argos journeys use, because the journey spans about 12° by 13°; the existing sentence that mark size does not show uncertainty is on the row.
7. **A row not marked visible stops the build** (the builder has no rule for one; this bird has none).
8. **The config carries the expected counts** (`expect`): a build whose counts differ from the proposal's stops.
9. **The slider** has 995 stops: 981 displayed fixes and the 14 period starts (the first is the start of the recording). Its hidden label changes to say so for this journey.
10. **Inherent in option D2-A:** displayed fixes approach to just outside 5 km of the reference point from several directions, and the manifest states the two-decimal reference point (§11a allows it). The disc's position is therefore inferable to about that scale. The rule is an omission rule, not a guarantee of safety; the manifest says so.

## 3. The build (measured from the pinned files; all equal the proposal)
- 1,338 source rows; 1,326 positioned; 12 failed attempts.
- 981 displayed; 345 withheld in 14 periods; first period 86 fixes, 23 Jun 17:58:44 to 29 Jun 00:01:14 UTC; longest 518,456 s (144.016 h).
- 980 steps: 966 joined (10 span a failed attempt); 13 separated by withholding; 1 by time (32,414 s).
- 11 failed-attempt times listed; 1 inside a stored period (counted only). One of the 11 lies in a hidden span.
- Timestamps: largest distance from a whole second 21 ms (allowance 25).
- Accuracy of displayed fixes: min 2.05, median 4.35, 95% under 17.92, max 65.28 m; 28 over 25 m, 4 over 50 m.
- Recording 23 Jun 2008 17:58:44 to 15 Sep 2008 13:30:18 UTC. First displayed fix 29 Jun 01:30:54.
- Nearest any fix comes to the 5 km boundary: more than 100 m (test 3h), so no boundary case exists in the real file.

## 4. Tests (Claude's runs)
- **Builder** `build_gps_filtered_journey.test.py`: **69 passed with the pinned inputs** (59 without; part 3 then prints NOT RUN).
  - Part 1, made-up files: rounding helper (.499, .500, .999); B1 pins and the reference-row identity; B2 `--check` exit codes (3 missing, 0 same, 3 one byte changed, 2 stopped) and that only two files are written; B3 status and coordinate combinations on a row that would be withheld; B4 25 ms passes, 26 ms stops (also on a withheld row and a failed attempt), .500 stops the integrated build, .999 carries, collision, out of order; B5 just inside, exactly on (radius set to a fix's own computed distance) and just outside; B7 short withheld step; B8 trailing period; failed attempts inside and after a period; no withheld coordinate in either output.
  - Part 2, committed files: B10 counts; §11a structure checks for `j`, periods and `failed_t`; every displayed fix more than 5 km from the stated point by a second distance formula; wording; B17.
  - Part 3, pinned inputs: byte-identical rebuild; an independent re-read (csv.DictReader, its own distance formula) gives the same 981 rows with equal time, latitude, longitude and accuracy; the source's digits are in the file as text; **B6:** none of the 564 distinct withheld latitude and longitude strings is in any of the 568 tracked files.
- **Page** `animals-tab-ui.test.cjs`: **277 passed, 0 failed. 51 of 51 breaks caught**, all run on this code (38 from Stage 1, two with updated targets, and 13 new).
  - Bird as one of the journeys in T5 (all 12 ordered pairs) and T6 (three in a row ending on the bird).
  - Section 18: opening state (18a); all 14 periods at start, last withheld time, one second before the next displayed fix, exactly at it, and one second before the period (18c); the failed attempt inside a hidden span (18d); a visible failed attempt before, at and after it (18e); the 9-hour step (18f); **every one of the 995 stops, every listed failed attempt, and one second after each: 2,011 times** (18g); B9 after seek, speed change, play and pause (18h); slider stops and keys (18i); end of record (18j); Play to the end and again (18k); B16 at desktop and 390 px (18l, 18p); card (18l2); trailing period fixture (18m); zebra unaffected afterwards (18n).
  - Section 19: each new field missing (19a); accuracy malformed four ways (19b); join flags four ways including a join across a period placed inside a within-rule step (19c); periods six ways including an extra value smuggled into a tuple (19d); failed attempts five ways (19e); recording period missing or too short (19f); older journeys refused as before (19g); unchanged re-pinned copies still load (19h); changed display file and manifest with the real pins (19i).
- `EDIT=no-abort`: section 5 fails only 5b and 5g, as before.
- Rerun on this tree: `bare-earth-ui` 190, `layer-switches-ui` 68, `timeline-ui` 594, `desktop-overflow` 286, `smoke-fixes` 113; `build_journey.test.py` 22, `argos_rules.test.py` 17, `build_argos_journey.test.py` 28 (real-input part not run).
- **Not run:** `mobile-pass`, `key-drawn-ui` (fixture not in the repository).

## 5. To rebuild and check from the review copy
```
S=~/Documents/"Mother Earth"/_source-data/animals-expansion
python3 -I phase1/animals/build_gps_filtered_journey.py --config phase1/animals/waved-albatross-galapagos.json --animal 3275-30662 \
  --source "$S/Galapagos Albatrosses.csv" --reference "$S/Galapagos Albatrosses-reference-data.csv" --check
ME_ALBATROSS_SRC="$S/Galapagos Albatrosses.csv" ME_ALBATROSS_REF="$S/Galapagos Albatrosses-reference-data.csv" \
  python3 -I phase1/animals/build_gps_filtered_journey.test.py
```
Both need only the Python standard library. `--check` writes nothing.

## 6. Not proven, not done
- Performance with four journeys; a real phone; a screen reader; real hardware context loss.
- The paper's own description is not quoted on the page. The card cites the paper and the package and gives the reference file's own words for site, life stage and comments.
- Sources page, REGISTER, sensitivity and public-release decisions. The READMEs recommend contacting the data creator when re-using the data; no message has been sent and none is drafted.
- Penguin and corridor proposals: not started.
