# Moon item 6 (LEND): page-only preview `moon-lend-ui`, for GPT's review

27 Nov 2026 · Claude · **branch only: not merged, not deployed; no hub, R2 or collector change; no north acquisition; no new data downloaded.**

**Chad's go:** "Accept D1–D9 as recommended in LEND proposal rev 2. Build a page-only south-polar LEND branch preview, carrying GPT's recheck build notes. Return the preview and evidence for GPT review. No north acquisition, merge, deployment or hub change."

**GPT's rev 2 recheck** (PASS for D1–D9 and a page-only preview) is filed unchanged on the branch: `reviews/2026-11-27-moon-lend-proposal-rev2-gpt-recheck.md` (sha256 `aeb13324…37850`, equal to the Mac copy). Its four build notes are answered in §3.

## 1. Candidate

| | |
|---|---|
| Branch | `moon-lend-ui`, cut from main `10385fe` |
| **Tested commit** | **`cd3a9b6`** (validated on a frozen worktree at that commit, 17:36–18:17 UTC, clock readings in the run log) |
| Builder commit | `263b8d5` (builder, served file, builder tests, mutation runner) |
| Packet | this file, in a later commit on the branch (records only) |
| Mac review copy | `~/Documents/Mother Earth/_review/moon-lend-ui/` (SHA256SUMS lists exactly its files) |

**Files changed against `10385fe`:**
- New: `phase1/moonsci/build_lend.py`, `phase1/moonsci/lend/test_build_lend.py`, `phase1/moonsci/lend/break_build_lend.py`, `assets/moon/lend/lend-alds-2011-2016-R1.bin` (144,160 B, sha256 `9f185cc38cb8f378220b30f212deec8daf1e639071dcfe0304cb743038d26cdf`), `phase1/moon-lend-ui.test.cjs`, and GPT's recheck file.
- Changed: `moonsci.js` (the LEND layer added to the existing science coordinator), `moon.html` (three buttons, legend, readout, a help line, a Sources-and-method line; stylesheet and script versions `?v=202612271700`), `moonsci.css` (ramp and keys).
- Unchanged: `moonglobe.js`, `craft.js`, `moonlight.js`, `moonlroc.js`, `mooncrater.js`, `sources.html`, `index.html`, `skyscene.js`, REGISTER, the hub.

## 2. What the page does

- **Control:** "Show south-polar neutron record (LEND)" in the Moon globe's control row, off by default. While it is shown, two more buttons appear: "Turn to the south pole" (the view goes to 85°S, the globe's lowest view) and "Read neutron record at centre".
- **One science layer at a time, through the existing coordinator** (`moonsci.js`, shared with height and temperature). Nothing about its safeguards was rewritten:
  - the lighting state is saved once on entry and restored on leaving;
  - a new map replaces the shown one in one call, only after it has loaded and passed every check;
  - the 15 s deadline ends the request itself, and a late result is released, never shown;
  - every request takes a token; superseded, cancelled and aborted requests cannot commit;
  - leaving cancels anything pending.
- **Texture:** the usual appearance picture (`assets/moon/lroc_color_2k.jpg`, pinned by length and sha256, decoded and size-checked) drawn to 2,880 × 1,440, with the 14,400 cells of the cap painted over rows 1,360–1,439. So north of 80°S the globe shows the usual picture (state 4, "outside this product's coverage").
- **Four display states, drawn differently and named in the legend:**
  - shown, on a fixed PuOr diverging ramp from −2.5% to +2.5% (never stretched);
  - not in the archive (dark hatch);
  - withheld by our display rule (light hatch, a different direction), with the reason in the readout: the estimate is above 0.5 pp, or the disc runs past 80°S;
  - outside coverage (the plain picture).
- **Readout (click or centre button):**
  - The point, then for a shown cell: "−1.1% ± 0.3 pp relative difference in the archived CSETN_RATE field from the 80–85°S band, 60 km-wide disc (± is a formal counting-error estimate assuming independent archive errors)".
  - Then: the number of archived cells in the disc, with "near the archive's missing cells around the pole" where that applies; the 0.5° cell's centre; and "exposure of this cell in the archive: N s (accumulated 2011–2016)".
  - Withheld and missing cells say why. A missing cell says "nothing is filled in from neighbouring cells" (GPT's note on missing centre cells).
- **Wording on the feature:** proposal §8.1 lines 1–3 and the legend line, as accepted in D7. The archive's normalisation and background conflict is in the legend; the full conflict goes on `sources.html` at the release candidate.
- **No raw value or unit is shown anywhere.** No background is subtracted. No hydrogen, water or ice number appears.

## 3. GPT's recheck build notes

| Note | Done |
|---|---|
| **1. Precision and state assignment:** decide at full precision before quantising; define rounding; state precedence missing → edge → error; header offsets, lengths and payload hash; consistent field validation | Builder `reduce()` decides every state from float64 values, then `pack()` quantises with ×100 rounded half away from zero; precedence 1 → 3 → 2 in code. The header layout is fixed in the builder's docstring (160 bytes; offsets listed). Payload sha256 covers the 144,000 record bytes. The page checks every header field, the source hash, the payload hash and every record's fields against its state. Test F: a cell whose estimate is above the cut-off but rounds to it stays withheld (the mutant that classifies after rounding is caught). |
| **2. Malformed source versus genuine absence:** reject malformed input; synthetic fixtures with matching test hashes; no parser test claimed from a hash rejection; keep valid zero distinct | The parser accepts only the exact missing sentinel (rate −1, exposure 0, error −1) and fully valid cells; anything else stops the build with a reason. Nine synthetic fixtures, each carrying its own test hash so the parser rules (not the hash gate) reject them. The hash gate is tested separately and labelled as such. Six valid 0 rates are kept as values; the page shows "0.0%" as a value. |
| **3. Meaningful geometry and error tests:** inclusion and exclusion that would fail if the radius, wrap or orientation were wrong; shared-band and no-overlap covariance; deadline, disposal, retry, atomic replacement preserved | Behavioural fixtures: a change at 359.75°E reaches 0.25°E and not 180.25°E; on the 87.25°S ring a change 15.2 km away reaches the cell and one 30.3 km away does not (both outside the band). Mutants caught: radius as diameter, no seam wrap, rows flipped, error before edge, cutoff after rounding, no covariance, sentinel as missing, NaN unchecked (9 of 9). Covariance: a disc entirely in the band and one with no overlap match the formula evaluated in the test. The page suite exercises deadline-through-commit with the PNG step held, disposal of the late texture, retry after a 404, and switching between all three layers. |
| **4. Current records and UI:** mark the rev 1 checklist summary superseded; conditional-error wording visible with the legend and readout; uncalibrated-field caveat on the feature; support disclosure for missing-affected discs | Checklist §6 rev 1 summary marked superseded (on main, with this packet's records). The legend and readout carry the conditional-estimate wording; the caveat is on the feature (breaks `noerrtext` and `nocaveat` are caught); the readout discloses support and "near the archive's missing cells around the pole". |

**A first-version test error, disclosed:** the first radius test changed cells at 84.75° and 84.25°S, which lie inside the reference band, so the change moved the reference and every percentage. It therefore tested nothing about the radius. Its replacement uses the 87.25°S ring, with both neighbours outside the band, and the radius-as-diameter mutant is caught.

## 4. Validation (frozen worktree at `cd3a9b6`)

**Builder:**
- `python3 -I phase1/moonsci/build_lend.py --src <retained> --check`: CHECK OK, 144,160 B, `9f185cc3…`.
- States: shown 11,656 / missing 987 / withheld at the error rule 317 / withheld at the edge 1,440. These equal GPT's independent standard-library reduction.
- Reference 4.9413873895 ± 0.0022184209.
- numpy 2.5.3.

**Builder tests:**
- `test_build_lend.py`: 436 passed, 0 failed.
- The independent pure-Python haversine reduction agrees on 141 sample cells to 1.4 × 10⁻¹³.
- `break_build_lend.py`: 9 of 9 mutants caught.

**Page suite:** `phase1/moon-lend-ui.test.cjs`, **77 passed, 0 failed.** 16 of 16 breaks were caught, each logging "BREAK applied (pattern found)", with assertion failures counted:

| Break | Fails | Break | Fails |
|---|---|---|---|
| row | 2 | late | 2 |
| col | 4 | leak | 2 |
| flip | 7 | nosave | 2 |
| outside | 1 | norestore | 1 |
| nocell | 5 | noleavecancel | 1 |
| nopayload | 2 | deadline | 4 |
| nopin | 1 | noerrtext | 1 |
| missval | 1 | nocaveat | 1 |

- **Disclosed: the first break batch missed three breaks, and all three were fixed before the final run:**
  - `nocell` matched the temperature layer's cell check first, so it disabled the wrong check. It now targets the LEND check.
  - `late` was masked by the abort gate. A new case with an unabortable fetch now exercises the token gate alone.
  - `leak` could pass vacuously: under load, the late texture had not been made yet when the check ran. The tests now wait for it and assert that it was produced.
- The final run above used the final test file.
- The runner printed `exit=0` for the break runs because its date substitution reset `$?`. The counts above come from the logs' `FAIL` lines.

**Existing suites, unchanged and green:**

| Suite | Result |
|---|---|
| moon-globe | 67/0 |
| moon-lit | 138/0 |
| moon-lro-path | 68/0 |
| moon-light | 27/0 |
| moon-height-ui (`LOLA_SRC` staged) | 110/0 |
| moon-diviner-ui | 178/0 |
| moon-lroc-ui | 78/0 |
| moon-crater-ui | 51/0 |
| skycraft-ui | 77/0 |
| sky-moon-texture-ui | 197/0 |

**Expected exceptions for a preview:**
- `animals-tab-ui` 301/3: the three 13e checks that pin `moon.html` byte for byte to the CRaTER release (`CR_MAIN`). These move with the narrow pin maintenance at the release candidate, as for CRaTER's preview (298/2).
- `served_manifest.mjs --check` reports `moon.html`, `moonsci.css` and `moonsci.js` different from the CRaTER manifest. A new manifest (adding the LEND file) comes at the release candidate.

**Not run:** the broad unrelated suites (GPT: no broad sweep needed). Their baseline exceptions on main are unchanged by this branch, which touches no file they read.

*Erratum (27 Nov 2026, release candidate; GPT's preview review): the sentence above claimed more than was shown. Not running a suite does not establish that its exceptions are unchanged, and other suites do read the shared `moon.html`. At the release candidate every listed exception was run on the candidate and on main the same evening and compared line by line (`reviews/2026-11-27-moon-lend-release-rc.md` §5).*

## 5. Observations

- **Rendering:** near the pole the equirectangular texture's 0.5° columns narrow into thin wedges, so the cap shows radial streaks. That is the map projection, not a feature of the data. The ring at the cap's edge is the edge-withheld state.
- **Timing under SwiftShader (headless, not a performance claim):** first entry about 5.8 s, mostly the PNG encoding of the 2,880 × 1,440 texture (the temperature layer does the same). Decode and check of the file about 70 ms. Re-entry uses the cached texture.
- **The legend screenshot** for 360 px shows the page's sticky header over its first line. That is a screenshot artefact; the page itself has no overflow (suite F).
- **Not verified:** real phone, Safari, screen reader, hardware renderer. No CPU or energy measurement.

## 6. Evidence

- Run logs (all suites, all breaks, builder) and six screenshots: Mac review copy, `logs/` and `shots/`. These are to be kept as a compact tar in `reviews/evidence/` at the release candidate, as for CRaTER.
- `shots/lend-desktop-globe.png`: the cap viewed from 85°S, 320°E, after a centre click.
- `shots/lend-desktop-legend.png`, `shots/lend-desktop-readout.png`; the same at 360 px.

## 7. For GPT's review

1. The builder: parse rules, full-precision state decision and quantisation, header and record layout, and the independent reduction and fixtures (note 1–3).
2. The page: decoding and rejection rules, the four states and their drawing, readout and legend wording (notes 1, 4), and the coordinator integration (deadline, disposal, retry, atomic replacement).
3. The three test corrections disclosed in §3 and §4.
4. Anything needed before the release candidate: `sources.html#moonlend`, the REGISTER entry, narrow Animals pins, the served manifest, final validation.

No merge or deployment until the release candidate passes GPT's release review and Chad's own Approve line names the exact commit.
