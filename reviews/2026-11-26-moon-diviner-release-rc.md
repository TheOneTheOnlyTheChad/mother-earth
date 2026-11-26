# moon-diviner-ui — Moon temperature release candidate, for GPT's release review

26 Nov 2026 · Claude · branch `moon-diviner-ui` · **release candidate: not merged, nothing deployed, no hub, R2, D1 or collector change**

- **Preview recheck:** GPT, PASS for preview rev 2 at `34368ee`, with R1 closed (`reviews/2026-11-26-moon-diviner-ui-rev2-gpt-recheck.md`, filed unchanged from the Mac's `ChatGPT/Mother Earth/MOON-DIVINER-UI-REV2-RECHECK-2026-11-26.md`, sha256 `544184b2…4c92`).
- **Chad's own line (26 Nov):** "Go for the Moon Diviner release candidate: Sources, REGISTER, served-file manifest, narrow Animals pins and final validation under the reviewed preview and GPT's notes. Return the exact final commit and evidence for GPT review. No merge or deployment."
- **Commits since the preview (`34368ee`):**
  - `a752e13`: a merge of fresh main `5efe200` (docs only: the Diviner records, the height erratum, the GPT reviews)
  - `cc75407`: release payload (`DV_MAIN`)
  - `8b233d9`: Animals pins
  - this packet (the final commit is given in the message; it adds only this file)
- The preview packets (`reviews/2026-11-26-moon-diviner-ui-rc.md` with errata, and `…-rc-rev2.md`) stay as the preview records.

## 0. Bottom line

- **The release** is `moon.html` with the optional "Show temperature (Diviner)" layer, as reviewed, plus:
  - its records: `sources.html#moontemp` and REGISTER
  - one page link to them
  - a refreshed served-file manifest
  - the Animals pins

  Page code, data file, masks and scales are unchanged from GPT's PASS at `34368ee`.
- **Validation** ran from a separate, read-only worktree detached at `8b233d9`, with its own static server. No checkout or edit touched that tree during the runs. Results are in §4.
- **Merge plan** (Chad's own Approve line naming the final commit): merge `moon-diviner-ui` into main, page only. Then verify every path in the manifest on the live site with `node phase1/moonsci/served_manifest.mjs --pane`.

## 1. What changed since the preview, by GPT's release scope

| GPT's release scope | Done |
|---|---|
| `sources.html#moontemp` | one new section after Moon height and before the Sun globe; one shortcut between "Moon height" and "Tides". The section covers: what the quantity is (equivalent blackbody, effective radiative temperature, not the physical temperature of any one surface); local time, not the Sun now; not live, 2009–2015, evenly lit; the source with the DOI citation, Williams 2017, Powell §2.5, and public domain; **our** statistic with bin count, range as spread, rounding and the cap wording; cell size; no-data shares; masks as **our display policy**, with spread tails up to 140 K; both scales (rounded outward), the same-colour warning, clipped shares of grid cells, not surface area; the GHRM comparison in GPT's words (causes not isolated, not an accuracy estimate, selected sites not a random sample, orientation supported, no value corrected); how it is fetched and checked; credit, with no endorsement implied |
| REGISTER | a new entry after the LOLA entry, covering: source and fetch, with all 18 archive MD5s; the checkpoint file and the accepted deviation; the label and SIS meaning; Powell's general meaning; our statistic; the retained extraction (on the Mac, not committed); the derived file and the builder; the frozen display policy; the checks (both independent reductions, the page's own checks, GHRM); request method; reuse terms; page limits; version check (last checked 26 Nov 2026, every six months); commercial use. Marked "release candidate (not live)". The status line changes at release |
| Final provenance and links | `moon.html`'s Sources line gains "Details" → `sources.html#moontemp`, as height has. `SOURCE.json` gains `review` (cadence, last checked, records); the page file is unchanged; `build_diviner.py --check` is byte-identical |
| Refreshed served-file manifest | `phase1/moonsci/served_manifest.mjs` now writes `reviews/evidence/2026-11-26-moon-diviner-manifest.json`: **44 files** (the 35 root page files, plus the Tides pictures and record, the Moon picture, the three Moon height files and the **two Moon temperature files**). `--check` matches the tree. The height and Tides manifests stay unchanged as their own records |
| Narrow Animals pins | `8b233d9` changes only `phase1/animals-tab-ui.test.cjs`. `DV_MAIN` = `cc75407`, `DV_PARENT` = fresh main `5efe200`, literal `DV_FILES` = the 36 paths of §2. **13e sources.html** is held to `DV_MAIN` and, with the temperature section and shortcut set aside, is the Moon height baseline `MH_MAIN`'s file, with its height checks. The Nature-context sources check sets aside both sections. **13t** allows `sources.html` and `REGISTER.md` (still not `index.html`, `animals.html`, `tides.html`, `style.css`, `app.js`, `moonglobe.js`, the animals scripts or the hub). **13u**: the maintenance is the first suite change after `DV_MAIN` and touches only the suite. `MH_MAIN` and every older baseline are unchanged |
| A stable, identified final tree | §0, §4 |
| Setup failures counted apart from behavioural failures | §4: every break run's log is checked for "BREAK applied (pattern found)" |
| Exceptions carried with evidence | §4 |

## 2. Files in the release (fresh main `5efe200` .. payload `cc75407`, 36 paths)

**Served (page and assets):** `assets/moon/diviner/SOURCE.json`, `assets/moon/diviner/gcp-tbol-nm-R1.bin.gz`, `moon.html`, `moonsci.css`, `moonsci.js`, `sources.html`.

**Records:** `REGISTER.md`, `docs/research/moon-lro-science/SAMPLES.md`, `docs/research/moon-lro-science/diviner-acq/EXTRACTION-SCHEMA.md`, `docs/research/moon-lro-science/diviner-acq/TOOLING.md`, `docs/research/moon-lro-science/diviner-acq/checkpoints.jsonl`, `docs/research/moon-lro-science/diviner-acq/global_report_output-2026-11-26.txt`, `docs/research/moon-lro-science/diviner-acq/trial_compare_output-00n10n.txt`, `docs/research/moon-lro-science/diviner-ghrm/ghrm_compare_output-2026-11-26.txt`, `docs/research/moon-lro-science/diviner-ghrm/sites.json`, `reviews/2026-11-26-moon-diviner-first-band-trial.md`, `reviews/2026-11-26-moon-diviner-global-report.md`, `reviews/2026-11-26-moon-diviner-ui-rc-rev2.md`, `reviews/2026-11-26-moon-diviner-ui-rc.md`, `reviews/2026-11-26-moon-diviner-ui-rev2-gpt-recheck.md`, `reviews/evidence/2026-11-26-moon-diviner-manifest.json`.

**Build tools and tests (not served as pages):** `phase1/animals-tab-ui.test.cjs`, `phase1/moon-diviner-ui.test.cjs`, `phase1/moon-height-ui.test.cjs`, `phase1/moonsci/build_diviner.py`, `phase1/moonsci/diviner/diviner_ref.py`, `phase1/moonsci/diviner/gcp_stream.js`, `phase1/moonsci/diviner/ghrm_compare.py`, `phase1/moonsci/diviner/global_report.py`, `phase1/moonsci/diviner/mehash.js`, `phase1/moonsci/diviner/pane_job.js`, `phase1/moonsci/diviner/test_gcp_stream.cjs`, `phase1/moonsci/diviner/test_mehash.cjs`, `phase1/moonsci/diviner/test_pane_job.cjs`, `phase1/moonsci/diviner/trial_compare.py`, `phase1/moonsci/served_manifest.mjs`.

6 + 15 + 15 = 36 paths. `moonglobe.js`, `index.html`, `style.css`, `tides.*`, `craft.js`, `sunglobe.js`, `skyscene.js`, the hub, and the Moon and Tides pictures are not touched. Main's own records (STATUS, HANDOVER, the checklist) are not in the set: the merge brought them in unchanged.

## 3. What is unchanged from the reviewed preview

- `moonsci.js` and `moonsci.css` are byte-identical to `1a842f9`/`34368ee`.
- The page file `assets/moon/diviner/gcp-tbol-nm-R1.bin.gz` is unchanged: 720,037 B, sha256 `1d81cb86…11d0`; raw `cfaaabd8…ff92`.
- `moon.html` differs from `34368ee` by one link only (`<a href="sources.html#moontemp">Details</a>.`).
- Masks 70°/80°, scales 281–395 K / 70–105 K, product, extraction and controller are all unchanged.

## 4. Validation on the frozen tree `8b233d9`

**Setup.**
- Worktree `/tmp/rcwt` detached at `8b233d9`, served by its own static server (port 8899).
- Every suite and break ran from that tree. Four ran at a time, 13:20–14:36 UTC; the two alone re-runs finished at 14:41 UTC (log-file clock readings).
- My own checkout was used only for writing this packet, and no checkout or edit touched `/tmp/rcwt`.
- Headless Chromium 158, SwiftShader.
- Logs: `/tmp/rc/*.log` in the workspace (not committed); a summary follows.

**Suites on the frozen tree:**

| Suite | Result |
|---|---|
| `moon-diviner-ui` | **178 passed, 0 failed** (A–H, including G1–G4 and the new H Sources checks) |
| `moon-height-ui` | **110 passed, 0 failed** |
| `animals-tab-ui` | **294 passed, 0 failed** (13e moon.html and sources.html with the temperature additions set aside, 13t, 13u) |
| `moon-globe` / `moon-lro-path` / `moon-light` | 67 / 68 / 27 passed, 0 failed |
| `moon-lit` | 137 passed, 1 failed under parallel load (F8a, a minute-boundary timing check). **Run alone on the same tree: 138 passed, 0 failed.** |
| `sun-globe` / `skycraft-ui` | 103 / 77 passed, 0 failed |
| `tides-nav` | 2,882 passed, 0 failed |
| `desktop-overflow` / `mobile-pass` | 286 / 131 passed, 0 failed |
| `timeline-ui` / `timeline-changes-build` | 594 / 49 passed, 0 failed |
| `fire-status-ui` / `freshness-wording-ui` / `optional-layers-status-ui` / `quakes-ships-status-ui` / `ships-retain-ui` | 279 / 156 / 230 / 124 / 42 passed, 0 failed |
| `nature-context-ui` / `soil-ui` / `night-lights-ui` / `dustrgb-ui` / `backdrop-layer` | 78 / 47 / 152 / 67 / 27 passed, 0 failed |
| `build_diviner.py --check` | byte-identical; `served_manifest.mjs --check`: 44 files match |

**Exceptions, each with its baseline evidence.** Main is `5efe200`, the branch's merged parent, served from its own worktree on another port and run on the same machine. Each case was compared failure line by failure line.

| Suite | On the RC tree | On main | Verdict |
|---|---|---|---|
| `tides-ui` | 59 passed, 1 failed: **T1a**, the Tides branch's own scope check (`origin/main...HEAD` may change only its navigation files). It lists this branch's intended `moonsci.css`, `moonsci.js`, `phase1/moon-height-ui.test.cjs` and `phase1/moonsci/served_manifest.mjs` | passes (the branch diff is empty there) | branch-specific by design; not a regression |
| `smoke-fixes` | 11 failed (Earth now's fire-cell record checks, which read live hub data) | **the same 11 lines** | pre-existing |
| `kept-ui` | 18 passed, 3 failed (World View history wording) | **the same 3 lines** | pre-existing |
| `ux-round1` | 33 passed, 1 failed ("core layers still on by default") | **the same line** | pre-existing |
| `timeline-mixed-assets` | 16 passed, 2 failed (`animals.html` against the old stylesheet: 205 elements differ) | **the same** | pre-existing; this branch touches neither `animals.html` nor `style.css` |
| `osmc-reliability-ui` | under load, 39 passed, 2 failed; **run alone, 40 passed, 1 failed** ("old page: no page errors") | **40 passed, 1 failed, the same line** | pre-existing. The second failure under load was a 30 s timer check, which passes alone |

My first `osmc` baseline crashed because I served main on port 8897, which is that suite's own fixture-hub port. I re-ran it on 8893; the result above is that run.

**Deliberate breaks on the frozen tree: 31 of 31 caught.** Every run logged "BREAK applied (pattern found)": its mutation was applied to real code. So every failure counted below is a behavioural assertion. **Setup failures (pattern missing): 0.**

| Suite | Breaks (failed assertions) |
|---|---|
| `moon-diviner-ui` (19) | `row` 12, `col` 32, `flip` 7, `shift` 6, `tex180` 9, `nosave` 8, `norestore` 4, `late` 5, `noleavecancel` 2, `radio` 2, `nopin` 1, `nocell` 9, `nomask` 73, `cap` 1, `n1` 2, `leak` 4, `celsius` 3, `deadline` 12, `deadlinetimer` 7 |
| `moon-height-ui` (12) | `be` 31, `late` 1, `nolock` 3, `norestore` 3, `early` 15, `nocache` 3, `row` 10, `col` 24, `noraw` 4, `nofirst` 1, `norevoke` 4, `nopin` 2 |

**Not run:** the suites that touch none of this release's files and read neither `sources.html` nor `REGISTER.md` (for example `orbital-*`, the hub suites and `timeline-ui`'s siblings beyond those listed). The two `.mjs` Moon unit suites in `phase1/moonsci/` have nothing to do with this layer, apart from `build_diviner`, which is listed above.

## 5. Not verified (carried, not relabelled)

- A real phone, Safari, a screen reader, a verified hardware renderer, energy or CPU. All browser runs are headless Chromium 158 with SwiftShader (software rendering). Draw counts are only counts.
- The causes of the GHRM high-contrast differences: not isolated, and stated as such on the page.
- The live site: checked only after the merge, with the manifest's `--pane` script.

## 6. Release and rollback

- **Merge:** `moon-diviner-ui` at the final commit into main, page only. No hub deploy, no R2, D1 or collector change. After the merge, REGISTER's status line becomes "live on `moon.html` since …", with the merge commit, in the release record.
- **Verify:** after GitHub Pages builds, run the `--pane` script in the browser pane on the live site. All 44 paths must match bytes and sha256. Then do a live smoke of the temperature layer (noon → midnight → height → off; "Lit as now" restored).
- **Rollback:** `git revert -m 1 <merge commit>` (page only), on Chad's own Approve line.
- **Suggested line for Chad** (after GPT's PASS): "Approve: release Moon temperature from `moon-diviner-ui` at `<final commit>` to main, page only; no hub deployment."
