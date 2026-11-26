# moon-diviner-ui rev 2 — Moon temperature preview, for GPT's recheck

26 Nov 2026 · Claude · branch `moon-diviner-ui` · **preview only: not merged, nothing deployed, no hub, R2, D1 or collector change**

- **Go:** Chad (26 Nov): "Please address GPT's timeout finding and the scientific/wording corrections, then return the revised preview and focused test evidence for recheck. Keep the frozen masks and scales. No merge or deployment."
- **Review answered:** `reviews/2026-11-26-moon-diviner-ui-gpt-review.md`, filed unchanged (sha256 `746b89dd…ba81`). GPT's global-report review is filed unchanged too, as `reviews/2026-11-26-moon-diviner-global-report-gpt-review.md` (`743606dd…f89`).
- **Commits after rev 1 (`cdc9aed`):**
  - `ea63b07`: both GPT reviews, filed
  - `7a3aeb0`: payload rev 2 (R1 fix, focused tests, wording)
  - `f018d99`: pins
  - `1a842f9`: payload rev 2b (a regression from the first R1 attempt, fixed; below)
  - `3261682`: pins
  - then this packet and the errata (see the message for the exact head)
- **Unchanged:** the page file (`1d81cb86…11d0`, raw `cfaaabd8…ff92`), the frozen masks and scales, the product, the extraction.

## 1. R1: the deadline now ends the request

**Before:** the 15 s timer only aborted the fetches. A stage that cannot be aborted (the canvas PNG callback, the height picture decode) could finish after the deadline and commit.

**Now** (`moonsci.js`, `request()`):
- **At the deadline,** if that request is still the pending one, the timer cancels it. It takes a new token, aborts, clears the pending request and puts the radio buttons back to the mode shown. The timer then shows "… could not be loaded: it took too long. The globe is unchanged." (or "The map shown is unchanged.").
- **A late result arriving afterwards** fails the token check and is released (`res.drop()`): it is never cached and never shown, and it shows no stale error.
- **A result from a request whose signal is aborted is never committed.** It is released and reported.
- **Correction made during rev 2:**
  - My first version (`7a3aeb0`) put the aborted check in the general gate. That also silenced ordinary failures, because the height loader aborts its sibling fetch on the first failure. The full height suite caught it: 11 failure-message tests failed.
  - `1a842f9` applies the check to results only, and the height suite is back to 110/0.

**Focused tests:** `phase1/moon-diviner-ui.test.cjs`, section G. Each case holds a stage that cannot be aborted past the real 15 s deadline, then releases it.

| Test | What it shows |
|---|---|
| G1 temperature entry, PNG callback held | At the deadline the request has settled: nothing pending, no commit, saved lighting null, "Lit as now" still on and not locked, the picture still shown, button off, reason shown. A retry is started, the stale PNG is released during it, the retry commits, and no stale error appears. Exactly one live URL remains (the retry's); the late one was made and revoked, never shown. |
| G2 noon → midnight, PNG held | Noon stays, the radio is back on noon, saved lighting unchanged, "The map shown is unchanged." After the late PNG arrives: still noon, nothing cached for midnight, only the noon texture alive. A midnight retry succeeds. |
| G3 height entry, picture decode held | Settled with nothing changed and the reason shown. After the late picture arrives: nothing cached, no live URL. A retry succeeds. |
| G4 temperature → height, decode held | Temperature stays shown, saved unchanged, the reason in the height line. After the late picture arrives: temperature stays and only its texture is alive. A retry succeeds. |

**Results:**

| Run | Result |
|---|---|
| Fix (`ONLY=G`) | **16 passed, 0 failed** |
| `BREAK=deadline` (restores the reviewed code: timer aborts only, no result check) | **10 failed** |
| `BREAK=deadlinetimer` (keeps the result check, removes the request-ending timer: the pending request never settles) | **6 failed** |

Each break run logs "BREAK applied (pattern found)", so every failure is a behavioural assertion. None comes from a setup error.

## 2. Wording (page, Sources line, SOURCE.json)

| GPT point | Now |
|---|---|
| Explainer | "Bolometric brightness temperature is an equivalent blackbody temperature: it represents the thermal radiation Diviner measured, summed over wavelength. It is an effective radiative temperature. Where rock and soil, or sunlit and shaded slopes, share a cell, it is not the physical temperature of any one surface. …" |
| Page-level caveat (legend) | "Differently processed Diviner maps can give different values, especially at sharp warm features. See Sources for our comparison." (a link to the page's Sources section) |
| Sources line: the comparison | GPT's caveat, as given: ten selected high-contrast sites −1.9 to +16.7 K (median +8.7 K); ten background sites < 1 K; different processing, sampling and periods; causes not isolated; not an accuracy estimate. The same text is in `SOURCE.json` `comparison_ghrm`, with the selection bias and the limits of the registration control stated. No correction is applied to any value. |
| Scales | "the 1st and 99th percentiles of the shown grid cells, rounded outward to whole kelvin; shares are of 0.5° grid cells, not of surface area" (Sources line); the legend's clipping sentence also says grid cells, not surface area; `SOURCE.json` `scales.shares_are_of` |
| "About 5 km to a pixel" | now "The appearance picture holds about 5 km to a pixel …", plus "The temperature map's cells are 0.5° (about 15 km north–south and at the equator, narrower east–west towards the poles)." |
| `ghrm_compare.py` | the mirror controls are labelled `local3x3mirror…`. Its output states that they reverse each site's own patch, not the global grid, and that passing supports the orientation without excluding local pointing or effective-footprint differences. It states that the T⁴ column is an idealised proxy that does not establish how much of the difference averaging explains. It states the selection bias. The result line now reads "without attributing causes". All numbers are unchanged. |

**Errata appended to the earlier records** (each left as sent, with the correction dated below it):
- **Preview packet §4:** site 0 is 33.75°N 335.75°E; Giordano Bruno is site 2. The T⁴ proxy, local reflections, selection and causes are reworded as above.
- **Global report:** "most shown cells have modest spread, with substantial tails" (noon maximum 140 K; 60–70° p99 31–38 K); shares are of grid cells, not surface area; the checkpoint deviation is stated as accepted, not compliant.
- **Height release records on main** (`6d355d2`): at the release code `83f7c32`, breaks `late` and `nocache` matched nothing. They were caught at the preview `f884b7c`, but not re-established at release: 10 of 12. The same note is in checklist §2.

## 3. The two height breaks, and `nomask`

`late` and `nocache` now target the current code, and both are caught (`late` 1, `nocache` 2, in rev 1's run). A missing pattern now stops the suite as a setup error, and an applied break says so in its log.

`nomask` used to crash the suite. It now counts as assertion failures: a failed switch-on skips the dependent block and counts one failure. Result: see §4.

## 4. Test evidence for this round (headless Chromium 158, SwiftShader)

| Suite | Result | Code |
|---|---|---|
| `moon-diviner-ui` (full) | **175 passed, 0 failed** (157 at rev 1; +16 for G1–G4, +2 wording checks) | rev 2b `1a842f9` |
| `moon-diviner-ui` G only | **16 passed, 0 failed**; `BREAK=deadline` **10 failed**; `BREAK=deadlinetimer` **6 failed** | rev 2b |
| `moon-diviner-ui` `BREAK=nomask` | **73 failed** (57 passed), counted assertions, no crash | rev 2b |
| `moon-height-ui` | **110 passed, 0 failed** | rev 2b |
| `animals-tab-ui` | **294 passed, 0 failed** (13e with the rev 2 additions set aside, 13t, 13u) | pins `3261682` |
| `moon-globe` | 67 passed, 0 failed | rev 2b |
| `desktop-overflow` | 286 pass, 0 fail | rev 2 `7a3aeb0` (same `moon.html`; `moonsci.js` differs only in where the aborted check sits) |
| `mobile-pass` | 131 passed, 0 failed | rev 2 `7a3aeb0` (as above) |
| `build_diviner.py --check` | committed files equal a fresh build (`SOURCE.json` gains `comparison_ghrm` and `scales.shares_are_of`; page file unchanged) | rev 2 |
| `ghrm_compare.py` | PASS; numbers identical to rev 1, labels and limits reworded | rev 2 |

**Not re-run this round** (GPT: no broad sweep until the fix was ready; none reads the changed lines): the other 16 `moon-diviner-ui` breaks and the 12 height breaks (their patterns are unchanged and were caught at rev 1), `moon-lit`, `moon-lro-path`, `moon-light`, `tides-*`, `skycraft-ui`, `smoke-fixes`. They are to be re-run in full at the release candidate.

**One run was discarded:** while it was running, I briefly checked out main in the same tree to write the height errata. Its files changed underneath it, so I stopped it and re-ran it cleanly; the results above are the clean runs. The checkpoint rule is unaffected, as this is test-running only.

## 5. Asked of GPT

1. R1: the deadline behaviour and tests G1–G4, and the rev 2b correction.
2. The wording in §2, and whether the Sources caveat is right for the release candidate.
3. Anything left before Chad's go for the release candidate (`sources.html#moontemp`, REGISTER, served manifest, final Animals pins).

Merging and deploying need Chad's own Approve line naming the commit.
