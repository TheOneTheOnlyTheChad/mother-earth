# Moon item 5 released: CRaTER event-count chart

27 Nov 2026 · Claude · release record · **page only; no hub deployment** · item 5 **closed**.

**Chad's line:** "Approve: release the CRaTER event-count chart from moon-crater-ui at 6ed18c3 to main, page only; no hub deployment."
**GPT:** release review PASS (`reviews/2026-11-27-moon-crater-release-rc-gpt-review.md`, filed unchanged, sha256 `06d6d955…97e3`).

## Release

- **Before:** main `05dc479`, holding three docs-only commits after the candidate's merge base `67a615c` (`b97c320`, `06642e2`, `05dc479`: checklist, STATUS, HANDOVER). So the release was a merge, not a fast-forward.
- **Merge:** `ba41c8a` merges the named candidate `6ed18c3` into `05dc479` (commit time 14:44:27 UTC; pushed `05dc479..ba41c8a`).
  - The merge's tree equals `6ed18c3` except for the three records files from main.
  - `node phase1/moonsci/served_manifest.mjs --check` on the merge: 54 files match the reviewed manifest.
- **Tested tree:** `6ed18c3`, as validated in the release-candidate packet. No later feature payload was substituted.
- **Records after the release:** a records-only merge of the branch head `cffec00` (its only change after `6ed18c3` is the packet `reviews/2026-11-27-moon-crater-release-rc.md`), then this record. Served bytes are unchanged by both.

## Served verification (14:46:44 UTC, browser pane, `cache: 'no-store'`)

- **Result: 54 of 54 match, 0 differ.**
- **Method:** every path was fetched from `https://theonetheonlythechad.github.io/mother-earth/` and compared on status, byte length and sha256.
- **The expected list was built directly from the reviewed manifest file**, `reviews/evidence/2026-11-27-moon-crater-manifest.json`, sha256 `85cca2ad13d5ae8aab6582dfa1677d3089f0a8c68198020561999b05d839cbaf`. That hash was checked equal in the working tree and at `ba41c8a` before use. The list was not taken from the helper's `--pane` output or regenerated from a later tree.
- **Publication:** `moon.html` with `mooncrater.js` was first seen live at 14:45:34 UTC. Pages reported `last-modified` 14:45:27 UTC.

## Live check (14:47–14:48 UTC, browser pane; one bounded run)

- **Off by default:** panel hidden, toggle `aria-pressed="false"`, state `off`, and no request for the chart file.
- **Opening:** state `shown`, 145 groups, exactly one request for `crater-good-2026-06-10-R1.json`.
- **Default time (12:00 UTC):** selects group 72. The readout gives 28.96 events a second, ±0.22 approximate counting benchmark, 17,378 events in 600 s. This equals the served row (17,378 / 600).
- **Final slider time (1440):** selects group 144, labelled "11 June 2026, 00:00–00:10 UTC (the extra group)".
- **Back to 12:00:** group 72; the dated drawing follows (`craftState().i` 720).
- **Close and reopen:** close hides the panel. Reopening shows group 72 again with no second request (still one in total). The drawing stays `ready` throughout.
- **Details:** the panel's link `sources.html#mooncrater` reaches the section "Moon event counts — CRaTER on LRO, 10 June 2026 (archived instrument counts; optional chart on the Moon page)" at the top of the view.
  - **Observation:** the first Details click opened a stale Sources page without the section. This pane had loaded `sources.html` at 14:45, a few seconds before Pages published it at 14:45:27, and Pages serves `max-age=600`. After the pane's copy was refreshed, the click reached the section.
  - So a visitor who loaded Sources within ten minutes before publication could see the old page until their copy expires. Nothing on the site was changed for this.
- **Not checked live:** the failure paths (covered by the suite), a real phone, Safari, a screen reader and a hardware renderer. Timings from this run are not performance claims.

## Records correction (GPT's release-review note)

- The REGISTER entry's bundle identifier now reads `urn:nasa:pds:lro-crater` (hyphen). That is the `logical_identifier` of the retained authoritative bundle XML (`_source-data/moon-lro-science-crater/crater-docs-labels-2026-11-27.json`, rechecked on the Mac: `urn:nasa:pds:lro-crater`, version 2.4). The Readme's `lro.crater` spelling is noted beside it.
- The same correction is in checklist §5.
- Proposal rev 2 (§2 table) is kept as written, with the Readme spelling.
- No served file carries the bundle identifier. The collection identifier `urn:nasa:pds:lro-crater:data-der-sec` and both DOIs were already correct. No served file or manifest changes.

## Recorded exceptions (carried from the release candidate)

- `timeline-mixed-assets` 16/2, `kept-ui` 18/3, `ux-round1` 33/1 and `osmc-reliability-ui` 40/1 fail identically on main `67a615c`. They are baseline exceptions, not passing tests.
- `tides-ui` T1a fails on every feature branch by design.
- `night-lights-ui` passed 152/0 alone after one loading timeout in the serial run.
- `smoke-fixes` was not run for this candidate. It remains an unresolved baseline exception on main.

## Close-out

- **Checklist:** rev 28, item 5 closed.
- **Records:** REGISTER marked live, with the identifier correction; STATUS and HANDOVER updated; the Project checklist copy updated.
- **Branch:** `moon-crater-ui` is fully contained in main after the records merge, and is deleted after verification.
- **Kept:** the raw sources and provenance (`_source-data/moon-lro-science-crater/`, `docs/research/moon-crater/`).
- **Mac:** the review copies (`moon-crater-rev1`, `-rev2`, `-ui`, `-release-rc`) were cleared from `_review/`. Their run logs and screenshots are kept in the repo as `reviews/evidence/2026-11-27-moon-crater-review-logs.tgz` (266,615 B, sha256 `a8e92867b0be859d161ddf9fb6725a0c6cfd646c03ee469e9997289eca7af4da`; 83 entries, checked against both folders' SHA256SUMS).
- **Close-out recheck (15:47:47 UTC):** 54/54 live files still match the reviewed manifest, with main at `af00389` (records only after `ba41c8a`).
- **Retained sources rechecked at close-out:** the four files in `_source-data/moon-lro-science-crater/` match `docs/research/moon-crater/checkpoints.jsonl` by sha256. The Downloads copies matched them and are staged for the Trash.
- **Rollback:** `git revert -m 1 ba41c8a`.
- **Remaining Moon items, one at a time:** 6 LEND, 7 LAMP, 8 Mini-RF; 9 only inside the item it serves; 12a–c options for Chad to classify; 11 carried. Sun and Parker wait for the Moon close-out.
