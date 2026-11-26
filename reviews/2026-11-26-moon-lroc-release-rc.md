# Moon LROC detailed site (item 4): release candidate for GPT's release review

26 Nov 2026 · Claude · **branch `moon-lroc-ui` only: not merged, not deployed; no hub, R2, D1 or collector change; no new data fetch** · under proposal rev 2.1, GPT's preview review and rev 3 recheck (`reviews/2026-11-26-moon-lroc-ui-gpt-review.md`, `reviews/2026-11-26-moon-lroc-ui-rev3-gpt-recheck.md`, both on main)

**Chad's go (26 Nov):** "Go for the LROC release candidate. Move the existing detail toggle outside the hidden globe-control block and add GPT's focused failure/close tests. Include Sources, REGISTER, served-file manifest, narrow Animals pins and final validation. Return the exact final commit and evidence for GPT release review. No merge or deployment."

## 1. Commits

| Commit | What |
|---|---|
| `1b1d30d` | fresh main `d73a639` merged into the branch (clean) |
| **`998df30`** | **release payload** (`LR_MAIN`), on top of `1b1d30d` (§2) |
| `9436b8e` | Animals suite pins only (`LR_MAIN` `998df30`, `LR_PARENT` `d73a639`) |
| the next commit | this packet (the branch head) |

**Final commit for review: the branch head, the commit that adds this packet.** It differs from the validated tree **`9436b8e`** only by this file.

- `d73a639..998df30` changes exactly 16 paths: the preview's files plus `sources.html`, `REGISTER.md`, `phase1/moonsci/served_manifest.mjs`, the new manifest, and `phase1/moon-diviner-ui.test.cjs`.
- **Page files changed since GPT's rev 3 recheck (`ef479e4`):** `moon.html` and `sources.html` only. `moonlroc.js`, `moonlroc.css` and the four assets are byte-identical to the reviewed preview.
- **Rebuilt before pushing (disclosed):** the payload was first committed as `f721e0a`, then `eb8e6fb`, then `998df30`; none was pushed. The rebuilds added the Diviner suite maintenance (§4) and removed a break that tested nothing (§5). The served files are the same in all three.

## 2. What the release payload changes

| Change | Detail |
|---|---|
| **Toggle outside the globe controls (GPT's required follow-through)** | The existing button `#mg-lroc` moves out of `#mg-ctl` into its own row, `<div id="mg-lroc-ctl" class="mgctl">`, after the LRO readout and before the locator line. Same button, handler, state and focus target. `moonglobe.js` is unchanged: on a globe failure it still hides `#mg-ctl`, which no longer holds the toggle. |
| **Details link** | The panel caption's last line ends with "Details", linking to `sources.html#moonlroc`. |
| **Sources and method on `moon.html`** | One line, "Detailed site (optional)": products, observation, public domain (LROC's terms), credit, what is shown, the stretch caveat, and the ring as the published position, not the footprint. |
| **`sources.html#moonlroc`** | One section, after Moon temperature and before the Sun globe, and one shortcut, "Moon detailed site", between Moon temperature's and Tides'. It covers: what it is (observed, not live; the globe stays at about 5 km a pixel; the panel works without the globe); source (product IDs, data set, volume, Imaging Node; Robinson et al. 2010 and Henriksen et al. 2017 with DOIs, both checked on 26 Nov; LROC's terms); frame (SIS v1.6 §5.5); landmark agreement 0.56 m / 0.95 m, stated as one landmark only; the ring; how the pictures are made (crops, 2 × 2 rule, 30,589 no-data pixels, dropped column, stretch 144–239, JPEG differences 2.69 / 5.46); the label conflicts; fetch, sizes and run-time behaviour; credit. |
| **Carried wording correction (GPT, Diviner release review)** | The height and temperature sections no longer say switching off "brings sunlight back". They now say: "puts back the lighting you had before: if 'Lit as now' was on, it returns for the current minute." The code is unchanged. |
| **`REGISTER.md`** | A new entry, "NASA PDS — LROC NAC orthophotos of the Apollo 11 landing site (M150368601)…", marked release candidate, not yet live. It records the source, the retained inputs, frame and geometry, label conflicts, derived files and hashes, request method, reuse terms, limits, version check and commercial use. |
| **Served-file manifest** | `phase1/moonsci/served_manifest.mjs` now writes `reviews/evidence/2026-11-26-moon-lroc-manifest.json`: **50 files** (37 root page files + 13 assets), sha256 `cdd304f5…`. Against the Diviner release's 44-file manifest, it adds `moonlroc.js`, `moonlroc.css` and the four `assets/moon/lroc/*` files, and changes only `moon.html` and `sources.html`. The Diviner, height and Tides manifests stay as their own records. |
| **Suites** | `moon-lroc-ui`: J1a–e, J2a–e, J3 and break `inctl` (78 checks). `moon-diviner-ui` H: narrow maintenance (§4). |

**Animals pins (`9436b8e`, this suite only):**
- `LR_MAIN` `998df30`, `LR_PARENT` `d73a639`; literal `LR_FILES` = the 16 paths.
- `LR_ADD` now names six `moon.html` additions: the toggle row replaces the old button line, and the Sources-and-method line is new.
- **13e sources.html** is held to `LR_MAIN`. Setting aside the detailed-site section and shortcut, and putting back the two old lighting sentences, gives `DV_MAIN`'s file, and the temperature and height checks continue from there. The other sources.html check (Nature context and Animals) now sets the LROC section aside first, because the temperature section's pattern runs up to the Sun globe section.
- 13v allows `sources.html` and `REGISTER.md`, as the Diviner release candidate did.

## 3. The focused failure and close tests (GPT's required checks)

| GPT's required check | Tests |
|---|---|
| Globe fails **before** opening: the control stays visible and keyboard-operable; detail opens with the locator unavailable, then closes without a reload | **H7a** (the globe controls hide as before, the detail stays off, nothing polls), **J1a** (the toggle is visible and reached by Tab), **J1b** (Enter opens it at once with the locator "unavailable", no wait, no turn), **J1c** (area, then site view, shown), **J1d** (Enter closes it: panel and locator line gone, `aria-pressed` false, focus on the toggle), **J1e** (no page errors) |
| Globe fails **after** opening: pictures, radios and Retry stay usable; the visible toggle closes the panel, clears pending work and the locator, and receives focus | **J2a** (picture failure plus globe failure: the globe controls hide; toggle and Retry visible), **J2b** (Retry works), **J2c** (radios work), **J2d** (the toggle closes the panel; locator, wait and picture source cleared; focus on the toggle), **J2e** (no page errors); H7 and H8 as before |
| Off during the readiness wait still prevents any later camera move or locator; image late-answer safeguards hold | H5, H6, H9, H10; D1, D2 (unchanged, passing) |
| Normal opening, styling and narrow layout, existing state and visibility | A1–A4, **J3** (the toggle is outside `#mg-ctl`, in its own row after the LRO readout and before the locator line, and visible), B1–B8, the G keyboard and narrow-layout checks, `desktop-overflow` 286/0, `mobile-pass` 131/0 |

**Screenshots** (Mac copy, `evidence/`): `rc-normal-1000.png`, `rc-globe-failed-1000.png`, `rc-globe-failed-360.png`. With the globe failed, "Hide the detailed site" sits under the globe's failure message, with the locator line and the working picture below it.

## 4. Final validation

**Tree:** detached worktree `/tmp/wt-lroc`, served by its own server on port 8899. No checkout or edit touched it while suites ran. Main `d73a639` was served from its own worktree for the baselines. Headless Chromium with SwiftShader. Times are log-file clock readings (UTC).

- **Full sweep on `5eae783`, 19:44:50–20:08:26.** 31 suites, four at a time. `5eae783` differs from the final `9436b8e` in two test files only: the Animals pin hash, and one break line removed from the LROC suite (§5).
- **On the final tree `9436b8e`:** every suite that reads either of those files was rerun (`moon-lroc-ui`, `animals-tab-ui`, `tides-ui`, `animals-census-ui`; 20:27–20:32), then all 20 breaks (20:32–20:55) and both pin controls. No other suite reads either file: checked by search.

| Suite | Result |
|---|---|
| `moon-lroc-ui` | **78 / 0** on `9436b8e` (and on `5eae783`) |
| `animals-tab-ui` | **296 / 0** on `9436b8e` (13e moon.html and sources.html, 13v, 13w) |
| `animals-census-ui` | 71 / 0 on `9436b8e` |
| `moon-diviner-ui` | **178 / 0** |
| `moon-height-ui` | 110 / 0 (with `LOLA_SRC`) |
| `moon-globe` / `moon-lro-path` / `moon-light` / `moon-lit` | 67 / 68 / 27 / 138, 0 failed |
| `sun-globe` / `skycraft-ui` / `tides-nav` | 103 / 77 / 2,882, 0 failed |
| `desktop-overflow` / `mobile-pass` | 286 / 131, 0 failed |
| `timeline-ui` / `timeline-changes-build` | 594 / 49, 0 failed |
| `freshness-wording-ui` / `optional-layers-status-ui` / `quakes-ships-status-ui` / `ships-retain-ui` | 156 / 230 / 124 / 42, 0 failed |
| `nature-context-ui` / `soil-ui` / `night-lights-ui` / `dustrgb-ui` / `backdrop-layer` | 78 / 47 / 152 / 67 / 27, 0 failed |
| `smoke-fixes` / `kept-ui` / `ux-round1` | 113 / 21 / 34, 0 failed (each carried pre-existing failures at the Diviner release candidate; clean today) |
| `fire-status-ui` | 276 / 3 in the parallel run; **279 / 0 run alone** on the same tree (§4.2) |
| `build_lroc.py --check` | PASS, 0 failures (pinned encoder environment) |
| `served_manifest.mjs --check` | 50 files match the tree |

**Exceptions, each compared with main `d73a639` line by line:**

| Suite | RC tree | Main | Verdict |
|---|---|---|---|
| `tides-ui` | 59 / 1: **T1a**, the Tides branch's own scope check, lists `phase1/moon-diviner-ui.test.cjs` and `phase1/moonsci/served_manifest.mjs` | 60 / 0 (the branch diff is empty there) | branch-specific by design, as at the Diviner release candidate |
| `timeline-mixed-assets` | 16 / 2: `animals.html` against the old stylesheet, 205 elements differ at both widths | 16 / 2, the same | pre-existing; this branch touches neither file. The only other difference is element counts (sources.html 1,367 vs 1,344; moon.html 209 vs 169), with 0 elements differing |
| `osmc-reliability-ui` | 40 / 1: "old page: no page errors" | 40 / 1, the same line | pre-existing |

### 4.1 Setup failures and harness events (counted apart from behaviour)

- **`mobile-pass`, first sweep:** setup failure. The fixture `/home/claude/fixtures/orbital.csv` is not in a fresh container. It was rebuilt with the repo's seeded builder `phase1/orbital-fixture.build.mjs`; the run on `5eae783` passed 131 / 0.
- **`moon-lro-path`:** slow under four-way load (its pixel comparisons). In the first, abandoned sweep it was still at its landmark checks after 20 minutes. On `5eae783` it finished in 16 minutes, 68 / 0.
- **`moon-height-ui`, abandoned first sweep on `b574a63`:** one draw-count check failed under load (104 off, 368 on). On `5eae783` it passed 110 / 0.
- **The abandoned first sweep (`b574a63`):** stopped part way when `moon-diviner-ui` H showed a real expectation change (§4.3). Its logs are kept apart and are not counted.

### 4.2 `fire-status-ui`

In the parallel run, three checks failed: "rows · S stale counts, mismatched records: card line / tooltip / Find carries the reason". These are staleness checks that depend on the clock and timing. Run alone on the same tree: 279 / 0. The same suite passed 279 / 0 on `b574a63` in the abandoned sweep. **Disclosed:** the parallel run's log was overwritten by the rerun; the three failure lines above were captured from it before that.

### 4.3 `moon-diviner-ui` H: narrow maintenance

Its Sources check required the temperature shortcut to be followed directly by Tides', and its section pattern ran up to the Sun globe section, so it would also have taken in the new LROC section. Now:
- the section ends at the next section (detailed site or Sun globe)
- the order is moon height < temperature < detailed site < Sun globe
- the shortcut order is Moon height, Moon temperature, Moon detailed site, Tides

This is in the payload (`998df30`), test only.

## 5. Deliberate breaks: 20 of 20 caught on `9436b8e`, every one logged "BREAK applied (pattern found)"; setup failures 0

| Break | Result | Failing checks |
|---|---|---|
| **`inctl`** (new: serves `moon.html` with the toggle back inside `#mg-ctl`) | 71 / 7 | J3, J1a, J1b, J1c, J1d, J2a, J2d |
| `noready` | 76 / 2 | H3, H6 |
| `nodeadline` | 73 / 5 | J1b, J2a, H7, H9, H10 |
| `latestart` | 74 / 4 | J1b, H7, H9, H10 |
| `offwait` | 77 / 1 | H5 |
| `turn` | 74 / 4 | B1, H3, H6, F8 |
| `stale` | 76 / 2 | B8a, B8b |
| `late` | 76 / 2 | D1, D3 |
| `offlate` | 77 / 1 | D2 |
| `pe` | 76 / 2 | B3, F10 |
| `novis` | 74 / 4 | B8b, F1, F3, F5 |
| `earthloc` | 77 / 1 | F5 |
| `fp` | 77 / 1 | C3 |
| `ptr` | 77 / 1 | C11 |
| `bar` | 75 / 3 | C5, C7, C12 |
| `nd` | 76 / 2 | C4, C10 |
| `retry` | 73 / 5 | J2a, J2b, D3, D4, D5 |
| `offcam` | 77 / 1 | E1 |
| `eager` | 76 / 2 | B5, C8 |
| `size` | 77 / 1 | D6 |

- **Tried and not counted: `nofocus`** (remove `btn.focus()` from switch-off) gave 78 / 0 on `5eae783`. That is not a test gap. The toggle is the only off control, and activating it, by click or Enter, already focuses it, so the line changes no user path. It was removed from the suite rather than listed as a break that must fail. J1d and J2d check where focus is after closing.
- `stale` no longer fails the timing-dependent B7 on this run; the deterministic B8a and B8b catch it, as designed.

**Animals pin controls (scratch worktrees at `9436b8e`, one edit each, removed after):**
- N1, toggle put back inside `#mg-ctl`: 294 / 2, both 13e moon.html checks.
- N2, the old temperature lighting sentence put back: 295 / 1, 13e sources.html.

## 6. Unchanged from the reviewed preview, and accepted

- HTML locator with live-camera geometric visibility (camera · site > R²). Not WebGL depth-tested; terrain relief is not taken into account. Accepted by GPT and Chad.
- Area JPEG tolerance ≤ 6 grey levels (measured 5.46), site ≤ 3 (2.69). Accepted.
- WebGL draw calls per frame are 1 on and 1 off. **CPU and layout cost not measured:** unchanged draw calls do not mean unchanged HTML layout work.
- Byte-identical rebuild only in the pinned encoder environment. Another encoder version prints a NOTE and skips the byte comparison.
- `moonlroc.js` keeps its cache key `?v=202612261700`. It has never been served from the live site, so there is no stale copy to bust.

## 7. Not done, and limits

- **Not verified:** real phone, Safari, screen reader, hardware renderer.
- **Release steps, only on Chad's own Approve line naming the final commit:**
  1. Merge the branch head into main.
  2. Fetch every path in the reviewed manifest from the live site, with the list built from `reviews/evidence/2026-11-26-moon-lroc-manifest.json` (`served_manifest.mjs --pane`), and compare bytes and sha256.
  3. Live check: open the detail, check the ring and turn, both views, close; then globe-failure behaviour if it can be reproduced safely in the pane.
  4. Mark REGISTER live; write the records; delete the merged branch.

## 8. For GPT

Release review of the branch head (validated tree `9436b8e`). The Mac copy is in `_review/moon-lroc-rc/` (SHA256SUMS.txt). Points for your view:
- the toggle move and the J checks (§3)
- the Sources section and the corrected lighting sentences (§2)
- the REGISTER entry and the 50-file manifest
- the pins and their controls (§2, §5)
- the exceptions and setup events (§4)
