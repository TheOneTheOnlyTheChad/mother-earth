# Moon item 7 (LAMP): page-only preview `moon-lamp-ui`, for GPT's review

28 Nov 2026, 11:25 UTC (clock reading) · Claude · **branch only: not merged, not deployed; no hub, R2 or collector change; no new acquisition.**

**Chad's go (28 Nov):** "Accept D6 as assessed but inconclusive for fine positional accuracy, with reading B retained and no shift applied. Correct the unsupported 240–480 m bound in the records, then build the page-only LAMP preview under proposal rev 2 and GPT's review notes. Return the exact candidate and evidence for GPT review. No new acquisition, merge, deployment or hub change."

The records correction is on main (`6a33d1e`): the 240–480 m bound is struck in the D6 report, checklist, STATUS and HANDOVER, and replaced by the agreed registration statement.

## 1. Candidate

| | |
|---|---|
| Branch | `moon-lamp-ui`, cut from main `6a33d1e` |
| **Candidate commit** | **`7e98a563cbfe3ff6fe6d7ec95849d2fbf972d691`** (`7e98a56`), pushed |
| Validated | on a frozen worktree at `7e98a56` (builder `--check`, builder tests, page suite), 28 Nov ~11:15–11:24 UTC |
| Packet and records | this file and checklist rev 41 on main (records only, not part of the candidate) |
| Mac review copy | `~/Documents/Mother Earth/_review/moon-lamp-ui/` (SHA256SUMS lists its files) |

**Files changed against `6a33d1e` (8 files):**
- New:
  - `phase1/moonsci/build_lamp.py`
  - `phase1/moonsci/lamp/test_build_lamp.py`
  - `phase1/moonsci/lamp/break_build_lamp.py`
  - `assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin.gz`: gzip 233,357 B, sha256 `a97907724322d96a23afde4f128169f1cc020d93593689cec52af72888801cbe`; raw 1,567,664 B, sha256 `81b5a50ad378bbbc119e8621439a9c6e5341a8dd289a4065620469f6aef755b9`
  - `phase1/moon-lamp-ui.test.cjs`
- Changed:
  - `moonsci.js`: the LAMP layer added to the existing science coordinator, sha256 `b27eb49f…60f64`
  - `moon.html`: three buttons, legend, readout, a help line and a Sources entry, sha256 `cc40bca7…751b0`
  - `moonsci.css`: ramp, top key, hidden buttons, sha256 `53a7850d…cc3c`
- Unchanged: `moonglobe.js`, `craft.js`, `sources.html`, REGISTER, the manifest, the hub, every other page.
  - The Sources/Details page entry, REGISTER, manifest, cache-busting versions and Animals pins come with a release candidate, not with this preview.

## 2. What the page does

- **Control:** "Show south-polar far-UV albedo (LAMP)" in the Moon globe's control row, off by default.
  - While it is shown, two more buttons appear: "Turn to the south pole" (view to 85°S) and "Read far-UV albedo at centre".
- **One science layer at a time, through the existing coordinator** (shared with height, temperature and LEND), with no change to its safeguards:
  - lighting saved once on entry and restored on leaving;
  - atomic texture replacement only after every check passes;
  - the 15 s deadline ends the request, and late results are released;
  - token gate; leave cancels anything pending.
- **Load and check (`parseLamp`):**
  - gzip pin (length and sha256), then the raw pin (also covering a server that strips the gzip layer);
  - an explicit raw length check;
  - every header field (magic, version, 626, 4, 2501, 2504, 960, 1737400, pole pixel 1251, centre offset 15, orientation 2 = reading B, scale 1000, sentinel 65535, colour end 80, threshold 8, cap 80, period 20090901–20101001);
  - reserved bytes 52–63 zero; both source sha256s; the payload sha256.
  - **Every cell** (GPT recheck note 3): bits 5–6 zero; 0 ≤ n_q ≤ n_in ≤ 16; bit 7 only with n_q ≥ 1; a value exactly when n_q ≥ 8 (else the sentinel).
- **Texture:**
  - the pinned appearance picture drawn at 2,880 × 1,440; rows 1,360–1,439 (south of 80°S) are repainted;
  - each pixel takes its centre's latitude and longitude, the reading-B inverse and the **nearest 960 m cell, with no interpolation** (proposal §6);
  - shown cells: one-hue ColorBrewer Blues ramp, 0.000 to 0.079 from the stored integer; stored ≥ 80: one distinct orange;
  - S1/S2: the dark hatch; S3 and S5: the light hatch;
  - north of 80°S: the usual picture (S4).
- **Readout (click or centre button), per proposal §8.2 and §8.4:**
  - S0: "Lyman-α albedo estimate 0.036 · Mother Earth's 960 m average of n of n_in archive pixels; LAMP night side, Sept 2009 – Sept 2010; measured far-UV brightness ÷ modelled night-time illumination · 960 m cell centred …".
    - It is written as a string from the integer (three decimals) and ends with "The third decimal is our rounding, not the estimate's accuracy." (note 5).
  - Stored ≥ 80 adds "at or above the top of the colour scale: displayed estimate 0.080 or higher after rounding" (note 1).
  - Bit-7 cells add the P1 sentence: "This average includes archive values above 1; they are shown as archived, and their cause has not been assessed here."
  - S1, S2, S3, S4 and S5 use the proposal's sentences.
    - Draft change: S1 says "n of this cell's n_in archive pixels" instead of "of 16", because a shown or S1 cell near the edge can have n_in below 16.
  - No ± is given (no SNR error bar).
- **Wording on the feature:**
  - not a photograph; light our eyes cannot see; modelled night-time illumination, a model-dependent estimate;
  - the layer does not identify ice, frost or water; no cause for darker or brighter areas;
  - values above 1 kept and disclosed; the rounding is not the accuracy;
  - **rendering honesty (note 4):** "the graphics card may blend neighbouring pixels on screen; the readout reads the 960 m cell itself";
  - the registration sentence.
  - The Sources entry carries the agreed replacement statement verbatim, with the product, the quality rule, the 8-of-16 threshold and the method reference (Gladstone et al. 2012, doi:10.1029/2011JE003913).

## 3. GPT's notes and where they are answered

| Note | Answer | Evidence |
|---|---|---|
| R1 top bin wording and boundaries | legend and readout say "displayed estimate 0.080 or higher after rounding"; colour from the integer (≥ 80) | builder R: 0.0795 → 80, 0.07949 → 79, exact binary ties half up; page A: 79 on the ramp and no top-bin text, 80 and 31069 top colour, 56 cells in the top bin |
| R2 P1 with range checks | values kept as archived; bit 7 drives the sentence; overflow and negative values stop the build; unknown bits refused | page A: all 9 flagged cells carry the sentence and 300 unflagged cells do not; E: reserved bit 5, a flag without a qualifying pixel |
| R3 exact header, support, sentinel, precedence, fixtures, independent cells | §2 checks; S4 before S5 before the cell | E: 16 crafted files plus the two pins; builder I: independent pure-Python recomputation of 3,778 cells (seeded random 2,000, plus every edge cell with 1–15 source pixels, every flagged cell and the 25 cells around the pole), exact |
| R4 resampling honesty | nearest cell into the texture, tested exactly; on-screen blending disclosed, not hidden | page B: **all 230,400 texture pixels south of 80°S equal this test's own nearest-cell colour or hatch, exactly**, with every state present |
| R5 precision wording | readout and legend notes; no ± | page A |
| D6 transforms | reading B everywhere; no shift | builder K and page K: pole cell (312, 312); mid-edges at 0/90/180/270°E in cells (312,0), (625,312), (312,625), (0,312); five crater centres; 0/360 seam; wedges just beyond each mid-edge (S5); just north of 80°S (S4); edge, too-few and no-usable cells. Reading A, rotated and one-cell-shifted controls give other cells; the page BREAKs `reflect`, `rotate` and `shift` fail 15–16 checks each |

## 4. Test results (clean, at `7e98a56`)

| Suite | Result |
|---|---|
| `build_lamp.py --check` | committed file equals the rebuild byte for byte (zlib 1.3) |
| `test_build_lamp.py` | **24 passed, 0 failed** |
| `break_build_lamp.py` | **9 of 9 mutants caught**: threshold 7, code 4 qualifies, floor rounding, no flag bit, flipped, transposed, no cap mask, padding at the front, mean over 16 |
| `moon-lamp-ui.test.cjs` | **100 passed, 0 failed** (also 100/100 from the frozen worktree) |
| page BREAKs (26) | **every one fails**: reflect, rotate, shift, outside, wedge, nopin, nogzpin, nosize, nocell, nopayload, noreserved, nohibit, top, thresh, edge, interp, thou, nohi, noprecision, late, leak, nosave, norestore, noleavecancel, deadline, noice |
| `moon-lend-ui` | 89 passed, 0 failed |
| `moon-diviner-ui` | 178 passed, 0 failed |
| `moon-globe` | 67 passed, 0 failed |
| `moon-height-ui` | 101 passed, 1 failed: the prerequisite "source float file present (LOLA_SRC)". The retained LOLA 4 ppd source is not in this container. It is unrelated to this change; every page check passed |

**Corrections during the build (disclosed):**
- My first builder-test control used a one-*pixel* shift, which usually stays in the same 4-pixel cell, so it could not differ. It is now a one-*cell* (4-pixel) shift.
- Three page BREAKs were at first not caught, because the tests were too weak. Each was strengthened and now fails as it should:
  - `wedge`: the wedge points were too far out, so wedge points 1.5 pixels beyond each mid-edge were added;
  - `nopin`: a self-consistent changed file is now served without pin injection;
  - `nogzpin`: the break was rewritten, and a recompressed gzip of the same raw bytes is now refused.
- The short-file case first exposed that the page relied on the pin alone for length, so an explicit length check was added.

## 5. Observation for GPT and Chad (not changed: it is a D-decision)

- **Low contrast on the globe.** The approved fixed scale is 0.000–0.080 (proposal §8.4).
- Shown cells' percentiles in thousandths:

| Percentile | 1% | 5% | 25% | 50% | 75% | 95% | 99% |
|---|---|---|---|---|---|---|---|
| Value | 26 | 30 | 34 | 37 | 40 | 45 | 51 |

- So 90% of cells fall in about 19% of the ramp, and at globe zoom the cap reads as a near-uniform mid-blue with faint structure (screenshots in the Mac review folder).
- Options:
  - (a) keep, as approved;
  - (b) a narrower fixed scale (for example 0.020–0.060, with top and bottom keys);
  - (c) a fixed scale set from these published-percentile ends.
- No change is made without Chad's decision after GPT's view.

## 6. Not done here
- No merge, deployment or hub change.
- No acquisition: the build used only the retained, hash-pinned files.
- No Sources/Details page entry, REGISTER or manifest yet (release stage).
- No broad regression sweep: only the focused Moon suites above.
