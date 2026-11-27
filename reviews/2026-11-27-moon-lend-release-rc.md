# Moon item 6 (LEND) — release candidate: packet for GPT's release review

27 Nov 2026 · Claude · **branch `moon-lend-ui` only: not merged, not deployed; no hub, R2 or collector change; no north file or other acquisition.**

**Chad's go (27 Nov 2026, his message):** "Go: build the page-only LEND release candidate, including GPT's header-validation fix and RC notes, Sources, REGISTER, narrow Animals pins, served manifest and final validation. Return the exact commit for GPT release review. No merge, deployment, north acquisition or hub change."

**GPT's preview review:** filed unchanged as `reviews/2026-11-27-moon-lend-ui-gpt-review.md` (sha256 `d1085fe8…1ffc`, equal to the Mac copy). PASS for proceeding to a release candidate, with one required fix (non-finite header values) and RC notes 1–6.

## 0. The candidate

| | |
|---|---|
| **Candidate commit (frozen, validated)** | **`5ed9d7041445aa557e326f5c8f583957526bc641`** (`5ed9d70`; the records commit after it adds this packet and the preview-packet erratum only) |
| Payload (`LE_MAIN`) | `0db9f9f`: Sources, REGISTER, Details link, `moonsci.js` key, manifest, `moon-diviner-ui` H maintenance |
| Finite-header fix | `f8ef429` (`moonsci.js`, `moon-lend-ui.test.cjs`) |
| GPT's preview review filed | `99e1c20` |
| Main merged | `dabb825` merges main `b67358d` (main had only the preview's records commit since the branch was cut) |
| Animals pins | `5ed9d70`: parent `0db9f9f`, this suite only |
| Preview tested tree | `cd3a9b6` (GPT's PASS) |
| Served manifest | `reviews/evidence/2026-11-27-moon-lend-manifest.json`: **55 files**, sha256 `4764f405…`. The 54 files of the CRaTER manifest plus `assets/moon/lend/lend-alds-2011-2016-R1.bin`; `moon.html`, `moonsci.js`, `moonsci.css` and `sources.html` changed; nothing removed. The CRaTER manifest and the earlier ones stay as their records. |

**Release payload, 16 paths (`b67358d..0db9f9f`, literal in Animals 13ac):**
- **Page files:** `moon.html`, `moonsci.js`, `moonsci.css`, `sources.html`.
- **Data:** `assets/moon/lend/lend-alds-2011-2016-R1.bin`.
- **Records:** `REGISTER.md`, the manifest, the two GPT review files, the preview packet.
- **Tooling and tests:** `build_lend.py`, `lend/test_build_lend.py`, `lend/break_build_lend.py`, `moon-lend-ui.test.cjs`, `moon-diviner-ui.test.cjs`, `served_manifest.mjs`.
- **Not touched:** `craft.js`, `moonglobe.js`, `moonlroc.js`, `mooncrater.js`, `index.html`, `style.css`, the hub (13ac checks this).

**Page-file hashes at `5ed9d70`:**

| File | Bytes | sha256 |
|---|---|---|
| `moon.html` | 27,526 | `430986c6…` |
| `moonsci.js` | 39,647 | `fb52a5d0…` (preview `c2962bb6…`; changed by the fix and its comment) |
| `moonsci.css` | 2,837 | `c2e6531e…` (unchanged since the preview) |
| `sources.html` | 128,735 | `532062e3…` |
| `assets/moon/lend/lend-alds-2011-2016-R1.bin` | 144,160 | `9f185cc3…` (unchanged since the preview; GPT reproduced all 14,400 records) |

## 1. GPT's required fix: non-finite reference values (`f8ef429`)

- **The gap (GPT):** `Math.abs(value - expected) > 1e-9` is false for NaN, so a crafted file with NaN at byte 52 (reference mean) or 60 (reference error) passed the header check once its outer pin was replaced.
- **Fix:** both float64 fields are read once; `refOk` requires `Number.isFinite` on each **before** the tolerance test (`<= 1e-9`). The outer pin, length, other header fields, payload hash and per-record checks are unchanged.
- **Tests (in `moon-lend-ui` E, each crafted file served with its own outer pin injected, so the header validator decides):** NaN mean, NaN error, +Infinity mean, −Infinity error: each refused with "the neutron record file header is not the expected one", nothing shown. A NaN-mean file requested **while height is shown**: refused with that message; height stays active and the globe texture URL is unchanged.
- **Break `nofinite`** restores the preview's comparison: **4 checks fail** (NaN mean, NaN error, and the two height-retention checks). This reproduces GPT's finding in the browser. **Disclosed:** the two infinity cases are also refused by the old comparison (∞ − x = ∞ > 1e-9), so they guard the new code, not the reported gap.
- The asset is unchanged and finite; this is defence in depth, as GPT said.

## 2. GPT's other notes carried

| Note | Done |
|---|---|
| `moonsci.js` opening comment ("both", the active-state list, transitions) to include LEND | Now "All three optional… only one is shown at a time"; active states list `lend`; the saved lighting is kept across any switch, the neutron record included. |
| Qualify preview packet §4's untested-suite wording | Erratum added under that line in `reviews/2026-11-27-moon-lend-ui-rc.md` (records commit after the candidate): not running a suite did not establish its exceptions were unchanged, and other suites read `moon.html`. This time every exception was run on the candidate **and on main** today (§4). |
| Fix exit capture in the runner | The preview runner read `$?` after a `$(date)` substitution, so every break logged `exit=0`. The RC runner (Mac review folder, `run.sh`) stores `rc=$?` straight after each command; all 17 LEND breaks now log `exit=1`. **Disclosed:** my one-off main-comparison loop for §4 repeated the slip (it printed `exit=0` for main); the comparison below uses the logs' assertion lines, not those exit codes. |
| Keep the four disclosed test corrections and their controls | Kept unchanged (radius stimulus at 87.25°S, `nocell` on the LEND validator, `noAbort` token case, `leak` waits for the late texture). |
| Do not broaden "no new requests on re-entry" | Stated only for the LEND file and picture in D; no total-network claim anywhere. |
| Sources and REGISTER caveats: display-policy cut-off; palette and ± not a detection or accuracy; missing-affected support; disputed spatial response; same-period reference; no trajectory pairing | All in `sources.html#moonlend` and the REGISTER entry (§3). |
| Reconcile main; frozen tree; new manifest; Animals pins narrow with tamper proof | §0, §3, §4. |

## 3. What else changed since the preview

- **`sources.html#moonlend`** (after Moon event counts, before Sun globe; shortcut "Moon neutron record" after "Moon event counts"). It covers:
  - what it is (dated archive record 2011-12-11 to 2016-09-14, not live, not paired with LRO's dated path);
  - the exact source: product LIDVID `urn:nasa:pds:lro_lend:data_science_averaged:lend_rdr_alds_20111211::1.0`, collection, bundle v2.0, DOI 10.17189/p89b-8w72; last updated in release 29 (2017); PDS public domain;
  - the four conflicting archive statements about the field, stated and **not resolved**; no raw value or unit; not a calibrated flux, hydrogen or water ice; the hydrogen inference is model-dependent and published LEND estimates differ (McClanahan et al. 2024, §1–1.3); lower values attributed to no single cause;
  - the disputed spatial response, each figure attributed as recorded in proposal §5 (McClanahan §1.2: team 10 km FWHM at 50 km; their own 11.8 km FWHM, ±3σ 30.6 km; Eke et al. 2012 ≥90% through the walls; Teodoro et al. 2014 at least an omnidirectional footprint); the 60 km disc is a display choice; radial wedges are not resolved structure;
  - the method: 30 km great-circle radius on 1,737.4 km, weights 1/`CSETN_ERR`², same-product, same-period 80.25–84.75°S reference (7,200 cells), weighted means not equal-area, the propagated formal estimate **conditional on independent archive errors (not established)** and what it leaves out;
  - withholding: 987 not in the archive, 317 by the 0.5 pp rule, 1,440 at the 80°S edge, 11,656 shown; the rule, the colour scale and the ± establish no detection or physical accuracy; **1,102 shown cells and all 317 error-withheld cells have missing-affected discs** (flagged in the readout); exposure is a sum of accumulation times;
  - how we use it: the retained source hash `e6b1c2d5…0031ef` (no archive checksum published), the builder, the served file hash `9f185cc3…6cdf`, the page's checks (finite reference values included);
  - credit (LEND team, data bundle by I. Mitrofanov; PDS Geosciences Node). I did not add an institution or PI claim I have not read in the archive.
- **`moon.html`:** "Details" link to `sources.html#moonlend` at the end of the Sources-and-method line; `moonsci.js` key `202612271700` → `202612272000` (the file changed after the preview). `moonsci.css` key unchanged from the preview.
- **`REGISTER.md`:** one entry, marked **RELEASE CANDIDATE, not live** (marked live only at release).
- **`moon-diviner-ui` H, narrow maintenance:** its literal Sources shortcut chain now includes "Moon neutron record" between Moon event counts and Tides (as the LROC and CRaTER releases did). Nothing else in that suite changed.
- **`served_manifest.mjs`:** writes the new LEND manifest; the CRaTER manifest is kept unchanged.

## 4. Animals narrow pin maintenance (`5ed9d70`, this suite only, parent `0db9f9f`)

- **New constants:** `LE_MAIN` `0db9f9f`, `LE_PARENT` `b67358d`; `LE_FILES` (16 literal paths); `LE_ADD` (three buttons; legend plus readout; help-line span; Sources line) and `LE_KEYS` (the `moonsci.css` and `moonsci.js` keys, put back to `CR_MAIN`'s when set aside); the Sources section and shortcut patterns, with nine required phrases including both hashes.
- **13e moon.html:** new "13e moon.html (LEND)": equal to `LE_MAIN`'s, each addition once, both new keys, the Details link. Then "13e moon.html (CRaTER)" runs on the file with the LEND additions set aside and the old keys back, which must equal `CR_MAIN`'s; the chain behind it is unchanged.
- **13e sources.html:** new "13e sources.html (LEND)": equal to `LE_MAIN`'s, one section after Moon event counts and before Sun globe, one shortcut in place. The CRaTER, Sky and older chains run with it set aside.
- **13ac:** `LE_PARENT..LE_MAIN` changes exactly `LE_FILES`, and none of `craft.js`, `moonglobe.js`, `moonlroc.js`, `mooncrater.js`, `index.html`, `style.css` or the hub. **13ad:** the pin commit is the first to touch this suite after `LE_MAIN`, its parent is `LE_MAIN`, and it changes only this suite.
- **Tamper breaks (new):** `le-moon-legend-edited`, `le-moon-key-old` (the preview's `moonsci.js` key put back), `le-sources-edited`, `le-sources-shortcut-moved`. `CR_MAIN`, `SK_MAIN`, `LR_MAIN` and the baselines behind them do not move.

## 5. Final validation (frozen worktree `5ed9d70`, served by `python3 -m http.server 8899` from that tree; 19:05:57–20:53:26 UTC = 21:05–22:53 SAST, clock readings from the run log; exceptions then run on main `b67358d` from its own worktree on the same port, 20:55–21:00 UTC)

| Check | Result |
|---|---|
| `build_lend.py --check` | CHECK OK (144,160 B, `9f185cc3…`; 11,656 / 987 / 317 / 1,440) |
| `test_build_lend.py` | 436/0 |
| `break_build_lend.py` | 9 of 9 mutants caught |
| `served_manifest.mjs --check` | 55 files match this tree |
| **`moon-lend-ui`** | **83/0** (77 at the preview + 4 non-finite rejections + 2 height-retention checks) |
| LEND breaks | **17 of 17 caught**, each `exit=1` with its pattern applied: row 2, col 4, flip 7, outside 1, nocell 5, nopayload 2, nopin 1, missval 1, late 2, leak 2, nosave 2, norestore 1, noleavecancel 1, deadline 4, noerrtext 1, nocaveat 1, **nofinite 4** (assertion failures) |
| **`animals-tab-ui`** | **308/0** (304 + 13e moon.html (LEND), 13e sources.html (LEND), 13ac, 13ad) |
| Animals tamper breaks | caught at the expected check: `le-moon-legend-edited`, `le-moon-key-old` (13e moon.html (LEND)); `le-sources-edited`, `le-sources-shortcut-moved` (13e sources.html (LEND)); controls `cr-moon-panel-edited`, `cr-sources-edited`, `sk-sources-edited`, `moon-page-edited`, `mh-sources-shortcut-gone` at theirs |
| Moon, Sky, craft, Sun | moon-globe 67, moon-lit 138, moon-lro-path 68, moon-light 27, moon-height-ui 110, moon-diviner-ui 178, moon-lroc-ui 78, moon-crater-ui 51, skycraft-ui 77, sky-moon-texture-ui 197, sun-globe 103: all 0 failed |
| Suites reading `sources.html` or the shared pages | timeline-ui 594, tides-nav 2,882, timeline-changes-build 49, backdrop-layer 27, dustrgb-ui 67, nature-context-ui 78, quakes-ships-status-ui 124, ships-retain-ui 42, soil-ui 47, fire-status-ui 279, freshness-wording-ui 156, optional-layers-status-ui 230, night-lights-ui 152: all 0 failed |

**Exceptions, each run on the candidate and on main `b67358d` today (27 Nov, 20:50–21:00 UTC), assertion lines compared:**

| Suite | Candidate | Main `b67358d` | |
|---|---|---|---|
| timeline-mixed-assets | 16 pass, 2 fail | 16 pass, 2 fail | identical lines |
| kept-ui | 18/3 (three World View lines) | 18/3 | identical lines |
| ux-round1 | 33/1 ("core layers still on by default") | 33/1 | identical lines |
| osmc-reliability-ui | crashes at `git show 0386058:phase1/worker.js` (commit absent from this clone) | same crash | identical lines |
| smoke-fixes | stops at a 5 s page wait after three fire-row lines | same | identical lines |
| tides-ui | 59/1: T1a, the branch-scope check, lists this branch's non-navigation files | 60/0 | by design: T1a fails on any feature branch and passes on main |

These are today's comparisons, not carried claims. Evidence logs for both runs are in the Mac review folder.

## 6. Not verified (item 11)

Real phone, Safari, a screen reader and a verified hardware renderer: not done. Used instead: headless Chrome with SwiftShader (desktop and 360 px, keyboard path). No performance measurement is claimed for the LEND layer beyond the suite's checks. GPT's independent checks were numerical, code and fixture checks, not a real browser.

## 7. Evidence (Mac `~/Documents/Mother Earth/_review/moon-lend-rc/`, with SHA256SUMS)

- `run.sh` (the RC runner), `summary.txt`, every suite and break log for the candidate, and the six main-comparison logs (`base/`).
- The changed page files and the manifest at `5ed9d70`.

## 8. For GPT's release review

- Candidate **`5ed9d70`**; payload `0db9f9f`; manifest `reviews/evidence/2026-11-27-moon-lend-manifest.json` (55 files).
- Please check: the finite-header fix and its tests (§1); the Sources and REGISTER wording against the frozen contract and your caveats (§3); the Animals pins (§4); the exceptions (§5).
- After a PASS, release needs Chad's own Approve line naming `5ed9d70`. The live check must take its expected list from the reviewed manifest file itself.
