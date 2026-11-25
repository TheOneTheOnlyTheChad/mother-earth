# Animals journey context, C1a (zebra): close-out

**Written:** 25 Nov 2026, 07:06 UTC (clock reading). Animals thread "journey context".

**Chad, 25 Nov:**
> "File GPT's smoke report unchanged and complete the agreed zebra close-out and handover. Keep real phone, Safari, screen reader, print and 200% zoom recorded as open. Preserve the private inputs; corridor and reply-dependent work stay parked. Touch no other thread's branches."

## 1. Result

**C1a, the zebra's historical regional land context, is released and passed GPT's independent live smoke.** No rollback is recommended.
- Release: merge `64e9cf59` (25 Nov 2026, 06:54:07 UTC).
- GPT's smoke report is filed unchanged at `reviews/2026-11-25-animals-journey-context-c1a-gpt-live-smoke.md`, sha256 `d2802bbb11cc3b8919fedaacccd136907aca9b76f74d1b32231e358bfe162b1a`.
- Approval chain:
  - Chad's Approve line (in STATUS and the release record);
  - GPT's candidate review (PASS, four release items);
  - GPT's release recheck (PASS);
  - GPT's live smoke (PASS).

**Live identities.** GPT's independent downloads match the reviewed hashes:

| File | sha256 |
|---|---|
| `animals.html` | `4e75d051…c0ed` |
| `animals-context.js` | `a12594c1…55cc` |
| `style.css` | `3f8515c2…1c4d` |
| `assets/animals/zebra-botswana-Z3866-context-R1.json` | `6b67818b…a21e` |
| `sources.html` | `99931b2a…5128` |
| `REGISTER.md` after the filing commit | `3f6b1832…bbbb` |

The REGISTER copy differs from the reviewed one by the four completed lines only (GPT's comparison).

**What the block shows:**
- 21,744 presumed vegetation-fire detections (NASA FIRMS, MODIS Collection 6 standard processing, file version 6.03) between 25 Oct 2007 08:01 and 22 Oct 2008 23:00 UTC, in the two 4° cells 20–28° E, 18–22° S.
- About 245.0 ha of mapped tree-cover loss (Hansen v1.13, 2007: 145.1 ha, 2008: 99.9 ha, tree cover in 2000 at least 30 %), with the calendar-year mismatch beside it.
- A 13-row monthly table and a "How these figures were made" disclosure, both closed by default.
- Credits, and the closing limitation.

## 2. Still open (recorded, not tested)

- **Not tested:** a real phone, Safari, a screen reader, print, and true 200 % browser zoom. A 390 px desktop viewport does not close any of these. Open for the whole Animals page, as before.
- **Live failure states not forced:** wrong pin and network failure were checked on the candidate (GPT and the UI suite), not on the live site.
- **Request count and trigger distance:** GPT's live run saw the deferred loading but could not count requests. "Exactly one request" and the 200 px trigger rest on the code, the suite and Claude's live measurement.
- **`kept-ui`:** three World View checks fail on main with or without this work (`c1a-release-kept-ui-main.log`). They are not Animals failures and are not fixed here.
- **One rebuild:** the raster figures (145.1, 99.9, 245.0 ha) come from Claude's build, reproduced byte for byte with `--check` on the Mac VM. GPT checked the code, inputs and hashes but did not recount the raster.

## 3. Private inputs, kept

They are on the Mac in `research/animals-journey-context/` and are never committed:
- `20261125T035048Z-firms-pilot/` — the pilot, 6 responses;
- `20261125T050326Z-firms-zebra/` — 81 responses plus the fetch manifest `b1d97b55…482d`, about 2.0 MB;
- `hansen-GFC-2025-v1.13/` — six tiles, 976.6 MB, length and MD5 checked; full sha256 pinned in `phase1/animals/build_journey_context.py`;
- `build-b948956/` — the first built output;
- copies of the scripts.

To rebuild or check later: `python3 -I phase1/animals/build_journey_context.py --firms <…firms-zebra> --hansen <…hansen-GFC-2025-v1.13> --journey assets/animals/zebra-botswana-Z3866-R1.json --out <file> --check`. It needs numpy, tifffile and imagecodecs; the venv was at `/tmp/anvenv` on the Mac VM and must be recreated in a new session. No extraction or download is needed for that.

## 4. Parked

- **C1b, the East Walker corridor (cell 32_15, data years 2017–2024).** Parked, not in progress.
  - The design and budget are recorded: build brief §1, 585 FIRMS requests and about 708 MB of tiles; evidence §7.
  - It starts only on Chad's own go for that budget. Then it gets its own extraction run by Chad, a build, a candidate, GPT and Chad's lines.
  - The C1a tools were written for the zebra. The corridor needs its own windows, cell and years. The verifier's fixed expectations are zebra-only by design.
- **Reply-dependent Animals work:** unchanged.
  - IUCN (R1) for the assessment card, branch `animals-assessment-rc` `ab1a223`, unmerged.
  - Cape Vidal call.
  - NOAA (Jenny Litz's first reply, 24 Nov; answering is Chad's).
  - ATAP/SAIAB, penguins (Sherley), IWC.
  - All enquiries were sent by Chad. None is unsent, and there are no follow-ups.

## 5. Housekeeping done

- **GitHub:** `animals-journey-context-proposal` was deleted after it was confirmed fully merged into main. The git proxy refused the delete with a 403, so it was done on GitHub's branches page in the browser pane.
- **No other branch touched.** `animals-assessment-rc` is kept (unmerged). Other threads' branches were left alone.
- **Mac review copies moved to `_to_delete/`, stamp `20261125T070538Z`:**
  - from `_review/`: `animals-journey-context-evidence`, `animals-journey-context-extractor-h1h2`, `animals-journey-context-proposal`, `animals-nc-pin-rc`;
  - from `ChatGPT/Mother Earth/`: `animals-journey-context-c1a`, moved to that folder's `_to_delete/`.
  - GPT's own review files stay where GPT wrote them.
- **Mac main sync:** see STATUS for this close-out.
- **Note for the assessment branch.** `animals.html` on main now uses `style.css?v=202612250100` and `animals-context.js?v=202612250100`. That is the same stylesheet key `animals-assessment-rc` holds. When that branch is released (its checklist step 3), give `animals.html` a stylesheet key that no page on main has used.
