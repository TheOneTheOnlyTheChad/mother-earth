# Animals journey context, C1a (zebra): candidate for GPT's review

**Branch:** `animals-journey-context-proposal`. Candidate commit: `a83b04f3` for the page and the controls, plus this record's commit.
**State:** private branch candidate. Not released, not merged, not deployed. The corridor (C1b) stays parked. Animals never touches the hub.
**Written:** 25 Nov 2026, 06:00 UTC (clock reading).
**Chad's go (25 Nov):** "Go for C1a: the reviewed zebra extraction, the six previously accepted Hansen downloads, then the private branch build … Build only after the real extraction passes its verifier … Bring the candidate to GPT before release. No merge or deployment; corridor stays parked."

## 1. What ran, in order

1. **FIRMS extraction.** Chad ran it in Terminal at 05:03 UTC using the reviewed extractor (`62e29621…a752`).
   - Result: COMPLETE. 73 windows, 81 requests, 21,771 rows.
   - Key status: 36 used before, 765 used at the end. About 729 transactions in all (roughly 10 per request), against 5,000 per 10 minutes.
   - Private folder on the Mac: `research/animals-journey-context/20261125T050326Z-firms-zebra/`.
   - The verifier (`4bdaf0a7…ab00`) returned no problems. The builder calls it first and refuses on any problem.
2. **Hansen downloads.** Chad ran them in Terminal using `journey_context_hansen_fetch.py` (`1c5c63d1…99ad`).
   - Result: COMPLETE. Six whole files, 976.6 MB.
   - Each file was checked against its published length and MD5, with no retries.
   - Private folder on the Mac: `research/animals-journey-context/hansen-GFC-2025-v1.13/`.
3. **Build.** Run offline on the Mac shell, with no provider call.
   - Run at `b948956`, then again with this candidate's builder (`73d7a19d…391c`) using `--check`. Result: `CHECK OK: identical`.
   - Output sha256 `6b67818b4fb2c334bce958f1b50a3a8d3e66fd69269357dee35650ffe922a21e`, 7,879 bytes.
   - Resources: 6.5 s at `b948956` and 17.0 s on the re-check (Mac load varies); peak resident memory as printed, "105 MB", both times.
   - **Correction (25 Nov, release preparation, GPT's candidate review item 1):** "105 MB" was mislabelled. The "Mac shell" is a Linux VM on Chad's Mac (Linux 6.8 aarch64), where `ru_maxrss` is in KiB, so the old `/1024` gave MiB, not MB, and was not a macOS figure. The builder now labels the value by platform and keeps the raw value. Re-measured on the release builder: 104.7 MiB (`ru_maxrss` 107,208 KiB; `/usr/bin/time -v` maximum resident set 107,208 kbytes), 18.2 s wall clock. See `reviews/2026-11-25-animals-journey-context-c1a-release-rc.md`.
   - A tampered copy of the output fails `--check`.

## 2. The figures (from the committed context file)

**Region:** cells `17_50` and `17_51`, 20–28° E, 18–22° S. The hub grid's sphere gives 371,722 km².

**Fires:** 21,744 presumed vegetation-fire detections (type 0) between 25 Oct 2007 08:01 and 22 Oct 2008 23:00 UTC.
- Satellites: Aqua 13,240; Terra 8,504.
- Cells: 15,520 in 20–24° E; 6,224 in 24–28° E.
- By month, Oct 2007 to Oct 2008: 13, 360, 35, 3, 14, 13, 26, 119, 316, 591, 2,689, 11,141, 6,424. They sum to the total.
- Left out:
  - 3 detections of type 2;
  - 22 outside the period;
  - 2 outside the cells;
  - 0 identical rows.
- Missing data: no dates in the provider's missing-data table for the period. The file version is 6.03 only.

**Tree-cover loss** (Hansen v1.13, tree cover in 2000 at least 30 %):
- 145.1 ha in 2007 and 99.9 ha in 2008, so about 245.0 ha.
- Land 370,207.3 km²; water 434.7 km²; no data 0.
- Tree cover in 2000 at least 30 % on 493.6 km².
- Pixels mapped with loss in 2007 or 2008 but not counted, because tree cover was under 30 % or the pixel was not land: 10,374 in 17_50 and 78,528 in 17_51. The block states these figures.

**Two area bases, both disclosed on the page:**
- Loss areas use the WGS84 ellipsoid: each cell is 185,321.0 km².
- The area line uses the hub grid's sphere: 185,861 km² per cell.
- The ellipsoid formula reproduces the Earth's surface, 510,065,621.7 km². Mask conservation holds within about 5e-12.

**Decoder note:** an imagecodecs raw LZW decode returned 40,003 bytes for one row (treecover 10S, row 35047). The builder now decodes through tifffile's own strip decoder and requires exactly 40,000 values per row. The first 40,000 bytes were identical either way.

## 3. The page

**Files changed:**

| File | Change |
|---|---|
| `animals.html` | The zebra card gains one block. The stylesheet key moves to `202612250100`, and one script tag is added. |
| `animals-context.js` (new) | sha256 `a12594c1…55cc` |
| `style.css` | Eight added lines (`.an-ctx…`). No line is removed or edited. |
| `assets/animals/zebra-botswana-Z3866-context-R1.json` | New file. |

**How the script behaves:**
- **Loading.** It fetches the context file only when the block comes within 200 px of the screen. Without IntersectionObserver, it fetches at load.
- **Checks before anything is shown:**
  - the sha256 pin;
  - UTF-8 and JSON;
  - every field it uses;
  - the fire interval equals the journey rounded down to whole minutes;
  - the part-months are the first and last rows;
  - monthly, per-cell and per-satellite counts sum to the total;
  - per-cell loss adds up to the total within 0.1 ha;
  - the closing sentence and the calendar-year wording are exactly as required;
  - the Hansen credit and licence are present.
- **On any failure:** the block shows "could not be verified" (or "could not be loaded") and no figure. Everything is written as text, never as markup.
- **The brief says "when the zebra card opens".** Study cards on this page are always open, so "on screen" is the nearest equivalent. Flagged for GPT.
- **Sources line in the block:**
  - the LANCE acknowledgement, verbatim from REGISTER;
  - "NASA FIRMS (MODIS)";
  - the Hansen credit, with CC BY 4.0 linked;
  - the local-scale caveat.
  - The Animals page has no footer, so the acknowledgement sits in the block. The evidence record assumed a footer.
- Screenshots (desktop and 390 px, disclosures closed and open) are in the Mac review folder `ChatGPT/Mother Earth/animals-journey-context-c1a/`.

## 4. Tests

**New suite, `phase1/animals-context-ui.test.cjs` (sha256 `1e1b8c9d…dfce`):** 30 passed, 0 failed. All 12 breaks were caught.

| Break | Caught at |
|---|---|
| no-pin-check | 2a |
| no-sum-check | 2c |
| no-closing-check | 2d |
| no-interval-check | 2k |
| unknown-as-no-gaps | 2f |
| incomplete-shows-total | 2g |
| zero-as-number | 2h |
| months-open | 1d |
| eager-load | 1a |
| mismatch-dropped | 1f |
| nodata-hidden | 2j |
| gaps-not-marked | 2i |

**How the suite tests its fixtures:**
- A changed context file is served with the script's pin replaced (harness substitution), so the structure checks are what refuse it.
- The wrong-pin fixture (2a) is served without the substitution, so there the pin is what refuses it.

**Builder controls, `phase1/animals/build_journey_context.test.py` (`26c004a3…2306`):** 16 passed, in the workspace and on the Mac. They cover:
- endpoint minutes, with unpadded and padded times;
- 13 month rows with part-months at both ends;
- sums;
- edges: 24° E counts once in the eastern cell; 28° E and 18° S are outside; 22° S is inside;
- a duplicate counts once; a conflict stops the build;
- type 2 and type 3 detections are counted apart;
- a valid zero;
- an invalid time and an out-of-window row stop the build;
- the WGS84 reference;
- the ellipsoid cell area;
- the Hansen rows and columns fall inside the union without overlap;
- refusal of an unverified FIRMS folder.

The fire counting was moved into a pure function, `count_fires`, so these controls need no provider file. `--check` on the Mac shows the output is unchanged.

**GPT's case list against the evidence:**

| Case | Covered by |
|---|---|
| Unpadded time, and a CSV with no final newline | extractor controls (72) and builder control 1 |
| Endpoint minutes | builder control 1 |
| Part-months | builder controls; UI 1d and 2m |
| Calendar-year mismatch next to the value | UI 1f and 2e |
| Shared edge | builder |
| Duplicate and conflict | builder |
| Monthly sum | builder; UI 1e and 2c |
| Unknown gaps | UI 2f |
| Incomplete | UI 2g. The builder refuses any extraction that is not complete. |
| Valid zero vs no data | UI 2h and 2j |
| Changed source, version or tile hash | builder pins and `--check`; extractor and verifier pins |
| Wrong pin | UI 2a |
| Closing sentence and period labels | UI 1c, 1d, 1g and 2d |

**Regression on fresh main** (`f05c69b` merged; every pin unchanged):
- `animals-tab-ui` 282/0; `animals-census-ui` 71/0; `animals-corridor-ui` 102/0.
- `hub-alignment` 6/0 (deployed hub 0.6.25).
- Extractor controls 72/0; Hansen download controls 5/0.
- Pins as they stand: `BASE_MAIN` 0e62083, `TL_MAIN` 643bb9a, `NC_MAIN` 90eb522, `NC_PARENT` 6bebff1. None moved.

The logs are in `reviews/evidence/2026-11-25-animals-journey-context/c1a-*.log`.

**Not proven:**
- a real phone;
- a screen reader (roles and names are read from the page, not heard);
- print.

The extraction was run once, so its repeatability on a second run is not shown.

## 5. Drafts for release (not applied)

**REGISTER, new entry (draft):**

> **NASA FIRMS — MODIS standard processing (`MODIS_SP`) area archive, cells 17_50 and 17_51, 25 Oct 2007 to 22 Oct 2008 — dated archive; aggregated counts on the Animals page once released.**
> - Read: 25 Nov 2026, area API and availability.
> - Terms and acknowledgement: as for the FIRMS NRT entry (the LANCE sentence and the local-scale caveat). The acknowledgement sits in the block because the Animals page has no footer.
> - Stored: aggregates only. The raw CSVs stay private on the Mac.

**REGISTER, second new entry (draft):**

> **Hansen/UMD/Google/USGS/NASA Global Forest Change 2000–2025, v1.13, tiles 10S_020E and 20S_020E.**
> - Licence: CC BY 4.0.
> - Credit: "Source: Hansen/UMD/Google/USGS/NASA".
> - Six files, with hashes as pinned in the builder. Aggregates only.
> - The authors warn against definitive area estimates from pixel counts.
> - Years before 2011 are not reprocessed.

**Sources page (draft):** one line under Animals naming both sources, for the release commit.

## 6. Open for GPT

1. Loading on screen instead of on "opening" (§3).
2. The acknowledgement placed in the block (§3).
3. "about 245.0 ha" shows one decimal place beside the "about". Is that acceptable, or should it be whole hectares?
4. The two area bases (sphere for the region line, ellipsoid for loss) are disclosed in "How these figures were made". Is that enough?
5. Anything in the wording against the brief's §3.

## 7. Next

GPT reviews this candidate. Then Chad's lines decide on release. No merge and no deployment before that. C1b stays parked until it gets its own go.
