# Review packet r2: `animals-journeys-preview-rc` (three recorded journeys)

Written 19 Nov 2026 13:39 UTC (clock reading). **Branch only: nothing merged, nothing deployed, nothing sent, nothing spent.**

Answers GPT's review of `817a13f` (relayed by Chad, 19 Nov: on hold, two repairs, one note, performance unverified). The first packet, `reviews/2026-11-19-animals-journeys-preview-rc.md`, still describes the build.

## 1. What to review
- Code commit: `f00a33083502fac52d8775a1ec3b6245190e67e9`. The head is the later commit that adds this packet only. A complete tree at the head is on the Mac (GPT block).
- Files changed since `185dcff` (sha256 at the code commit):

| File | sha256 |
|---|---|
| `animals-journey.js` | `9763a7cc1e3f54edf3d46cb620af9b19cd007b86e9c7d91e26c47c65fa1bccc8` |
| `animals.html` | `c5787348d16bc3908a46af59be5e5c98578de2df2fbba637f2d0c879fa140ae6` |
| `index.html` | `e66cf13584ae786ed28eb6e32cd62d7c75cddab32b9028679602fa3fe6f2f87b` |
| `phase1/animals-journey-ui.test.cjs` | `8fe7c7c452451f83e78ad33d7e23cc0fc75ae982cfc5b6314c1ec573f1ae0815` |
| `phase1/animals/build_argos_journey.py` | `553d219e828b73e6318476a2d8c794b983cf21b3c0e70904433eb6d1201cd079` |
| `phase1/animals/build_argos_journey.test.py` | `a1a67b4861f75e1df117c8f69ed2690beaa40d435f381ec1934e37c9204e0e7a` |

- **No data file changed.** The journey list, the three manifests and the three display files are byte-identical to `817a13f`.
- Key: `animals-journey.js?v=202612190300`.

## 2. GPT's points
1. **Source observations and displayed fixes are now distinguished.** For a filtered journey (the shark and the whale) the replay bar speaks only of displayed fixes:
   - "First displayed fix …", "Last displayed fix …", "No fix is displayed for 18 h 43 min 44 s after it", "Last displayed fix: displayed record ends here, 12 Feb 2014 14:51:34 UTC".
   - The zebra, which is not filtered, keeps its wording ("Last recorded fix", "No fix was recorded for …", "tracking record ends here").
   - The card's details and the Animals page now say that where no fix is displayed the source may still hold fixes that were left out.
   - Regression checks: **20q** is GPT's shark case (index 24, 17 May 2012 08:09:01 to 18 May 02:52:45: exact bar text); **20r** is the whale's 12 Feb endpoint; **20o** samples every ninth fix and every gap of both journeys and fails if the bar says "was recorded", "recorded fix" or "tracking record"; **20p** checks the end-of-record sentence for both. Break `filtered-says-recorded` is caught by 20o.
   - Not done: the manifests do not carry a count of gaps that contain left-out fixes (GPT counted 53 and 22). That would need a rebuild from the source files; say if it is wanted on the card.
2. **`build_argos_journey.py --check` now exits 3** when either output differs from a fresh build or is missing (0 only when both are present and identical; 2 when the build stops), and prints MISSING, DIFFERENT and CHECK FAILED. Checks K1 to K6 in `build_argos_journey.test.py` cover missing, written, matching, one byte changed, missing plus changed, and a stopped build; --check is shown to write nothing.
3. **Enlarged marks:** the card (when on), the card's details and the Animals page now say the fix marks are drawn large so they can be seen and that their size does not show uncertainty. Check 20c asserts the card sentence.

## 3. Tests
- `phase1/animals-journey-ui.test.cjs`: **314 passed, 0 failed.** 38 breaks: 37 of 37 caught on `185dcff`, plus the new `filtered-says-recorded`, caught here. The other 37 were not rerun on this commit; the code they target is unchanged except the bar-text lines.
- `phase1/animals/build_argos_journey.test.py`: **28 passed** (parts 1 and 2 with the new K checks). **Part 3 was not rerun on this commit** (the real inputs were deleted after the first packet); the builder's stage code is unchanged, and GPT's own real-input rebuild of `817a13f` passed.
- `argos_rules.test.py` 17, `build_journey.test.py` 22.
- Rerun on this commit: `key-drawn-ui` 70 of 70, `bare-earth-ui` 190 of 190, `layer-switches-ui` 68 of 68, `desktop-overflow` 286 of 286, `mobile-pass` passes.

## 4. Still open
- **Performance on this branch: not measured.** It needs foreground desktop Chrome on a served copy of the tree. Claude cannot start a server on the Mac (Terminal is click-only, and the Mac-side shell has no address Chrome can reach), so this needs Chad for one command, or GPT's own run as before.
- Real phone, screen reader, real imagery behind the journeys.
- Sources page, REGISTER, sensitivity and public-release decisions; the two unsent enquiries.
