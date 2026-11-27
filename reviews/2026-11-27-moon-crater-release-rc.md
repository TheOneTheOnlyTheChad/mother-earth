# Moon item 5 (CRaTER) — release candidate: packet for GPT's release review

27 Nov 2026, written from 14:30 UTC / 16:30 SAST (clock reading) · Claude · **branch `moon-crater-ui` only: not merged, not deployed; no hub, R2 or collector change; no new acquisition.**

**Chad's go (27 Nov 2026, his message):** "Go for the CRaTER release candidate, carrying GPT's passed preview and release notes. Include Sources, REGISTER, narrow Animals pins, the served-file manifest and final affected validation. Update the Project checklist copy and return the exact candidate for GPT release review. Page only; no merge, deployment or new bulk acquisition."
- That line was also GPT's suggested owner line. Chad sent it as his message, as he did for the preview go, which he confirmed in chat.

**GPT's preview review:** filed unchanged as `reviews/2026-11-27-moon-crater-ui-gpt-review.md` (sha256 `925a91c6…75da`). PASS at preview stage.

## 0. The candidate

| | |
|---|---|
| **Candidate commit (frozen, validated)** | **`6ed18c3`** (the packet commit after it adds this file only) |
| Payload (`CR_MAIN`) | `4927a02`: Sources, REGISTER, Details links, the bound comment, the manifest, the suite additions, and the `moon-diviner-ui` H maintenance |
| Animals pins | `6ed18c3`: parent `4927a02`, this suite only |
| Fresh main merged | `b5f46f3` merges main `67a615c` (main had docs only since the preview) |
| Preview tested tree | `d6f9a0f` (GPT's PASS) |
| Served manifest | `reviews/evidence/2026-11-27-moon-crater-manifest.json`: **54 files**, sha256 `85cca2ad…`. These are the 51 files of 10a's manifest plus `mooncrater.js`, `mooncrater.css` and `assets/moon/crater/crater-good-2026-06-10-R1.json`; `moon.html` and `sources.html` changed; nothing removed. 10a's manifest and the earlier ones stay as records. |

**Release payload, 15 paths (`67a615c..4927a02`, literal in Animals 13aa):**
- **Page files:** `moon.html`, `mooncrater.js`, `mooncrater.css`, `sources.html`.
- **Data:** `assets/moon/crater/crater-good-2026-06-10-R1.json`.
- **Records:** `REGISTER.md`, the manifest, the three review files and the preview packet.
- **Tooling and tests:** `build_crater.py`, `test_build_crater.py`, `moon-crater-ui.test.cjs`, `moon-diviner-ui.test.cjs`, `served_manifest.mjs`.
- **Not touched:** `craft.js`, `moonglobe.js`, `index.html`, `style.css`, the hub.

**Page-file hashes at `6ed18c3`:**

| File | Bytes | sha256 |
|---|---|---|
| `moon.html` | 23,114 | `4cf1459c…` |
| `mooncrater.js` | 10,970 | `c6328588…` |
| `mooncrater.css` | 1,670 | `ca995950…` |
| `sources.html` | 121,615 | `404c07b7…` |
| `assets/moon/crater/crater-good-2026-06-10-R1.json` | 3,908 | `50ef3c0c…` (unchanged since the preview; pinned in the script) |

## 1. GPT's preview-review notes carried
- **Full benchmark wording in Sources, with a Details link from the panel:**
  - `sources.html#mooncrater` says the bars are "an approximate one-standard-deviation Poisson counting benchmark", assuming independent events and the nominal 600 s exposure.
  - It says they are "not an error value from the archive and not a total uncertainty", leave out timing, dead time, configuration and other systematic effects, and real variation, and are "not a 95% interval".
  - It says the scatter between groups is about 2.9 times the benchmark.
  - The panel caption and the Sources-and-method line link to it ("Details"), and the Sources contents list has a "Moon event counts" shortcut.
  - The bars are not turned into intervals.
- **The ~1,200 a second bound:** the `mooncrater.js` comment now reads "a validation bound chosen for this release (counts here are far below it), not a property of the counter". This is a comment only, with no change in behaviour; the release records say the same.
- **Narrow Animals pins:** §3.
- **Served-file manifest:** it includes the new JS, CSS and data asset; prior manifests are kept.
- **Main reconciled explicitly:** `67a615c` was merged before the payload.
- **Project checklist copy:** brought current with these records (rev 27), with the sync recorded in STATUS.
- **Full mutation logs:** every break run's full log is in the Mac review folder this time (`logs/break-*.log`).

## 2. What else changed since the preview
- **`sources.html`:** one section, `#mooncrater`, placed before the Sun globe section. It covers what the number is and is not, the source and DOIs, how we group it, the bars, time and position, what is not established, how we use it, and the credit. Plus one contents shortcut after Moon detailed site's.
- **`REGISTER.md`:** one entry (filed with the release candidate; reaches main only with the release).
- **`moon-crater-ui`:** two new checks.
  - B8: the panel links to `sources.html#mooncrater`.
  - B9: the Sources section holds the qualification, the not-dose wording and the DOI, and is linked from the contents.
  - Now 51 checks.
- **`moon-diviner-ui` H, narrow maintenance:** that check's literal Sources shortcut chain now includes "Moon event counts" between Moon detailed site and Tides. This section and its order are otherwise unchanged; the LROC release did the same.
  - **How it was found:** the first validation run, at a pin commit `bf89b75` that was never pushed, failed H. The payload and pin commits were rebuilt with the fix (unpushed history only), and everything was run again on the final tree.

## 3. Animals narrow pin maintenance (`6ed18c3`, this suite only, parent `4927a02`)
- **New constants:**
  - `CR_MAIN` `4927a02`, `CR_PARENT` `67a615c`;
  - `CR_FILES`: the 15 literal paths;
  - `CR_ADD`: the four `moon.html` additions (stylesheet link, control row plus panel, Sources line, script tag);
  - the Sources section and shortcut patterns.
- **13e moon.html:**
  - New check "13e moon.html (CRaTER)": the file equals `CR_MAIN`'s and holds each addition exactly once.
  - The existing LROC → temperature → height chain then runs on the file with those additions set aside, which must equal `LR_MAIN`'s. Checked as well: it also equals main's.
  - The "equals main's except the Animals links" loop sets them aside too.
- **13e sources.html:**
  - New check "13e sources.html (CRaTER)": the file equals `CR_MAIN`'s, with one section with the key wording and one shortcut.
  - The Sky check and the older chain then run with that section and shortcut set aside, which must equal `SK_MAIN`'s.
  - The Nature-context and organic-soil check sets them aside too.
- **New scope checks:**
  - **13aa:** `CR_PARENT..CR_MAIN` changes exactly `CR_FILES`, and not `craft.js`, `moonglobe.js`, `index.html`, `style.css` or the hub.
  - **13ab:** the pin commit is the first to touch this suite after `CR_MAIN`, its parent is `CR_MAIN`, and it changes only this suite.
- **Tamper breaks (added):** `cr-moon-panel-edited` (expects 13e moon.html (CRaTER)) and `cr-sources-edited` (expects 13e sources.html (CRaTER)).
- `SK_MAIN`, `LR_MAIN` and the baselines behind them do not move.

## 4. Final affected validation (frozen worktree `6ed18c3`, served by `python3 -m http.server 8899` from that tree, 12:56–14:14 UTC; exceptions compared with main `67a615c`, 14:15–14:30 UTC)

| Check | Result |
|---|---|
| `build_crater.py --check` | CHECK OK |
| `test_build_crater.py` | 28/0 |
| `served_manifest.mjs --check` | 54 files (39 root page files + 15 assets) match |
| **`moon-crater-ui`** | **51/0**; breaks **11 of 11** caught (eager 7, nopin 1, edge 5, late 1, nodeadline 3, zero 1, shape 1, bench 2, rev 1, retry 13, extra 2 FAIL lines), each "pattern found", 0 setup |
| **`animals-tab-ui`** | **304/0** (300 + 13e moon.html (CRaTER), 13e sources.html (CRaTER), 13aa, 13ab); tamper breaks caught: `cr-moon-panel-edited` at 13e moon.html (CRaTER), `cr-sources-edited` at 13e sources.html (CRaTER), `sk-sources-edited` at 13e sources.html (Sky), `moon-page-edited` at 13e moon.html |
| Moon and craft | moon-globe 67, moon-lit 138, moon-lro-path 68, moon-diviner-ui 178, moon-lroc-ui 78, moon-height-ui 110, skycraft-ui 77, sun-globe 103: all 0 failed |
| Suites reading `sources.html` | timeline-ui 594, tides-nav 2,882, timeline-changes-build 49, backdrop-layer 27, dustrgb-ui 67, nature-context-ui 78, quakes-ships-status-ui 124, ships-retain-ui 42, soil-ui 47, fire-status-ui 279, freshness-wording-ui 156, optional-layers-status-ui 230: all 0 failed |
| `night-lights-ui` | crashed once in the long serial run (a 20 s page wait); **152/0 alone** on the same tree; 152/0 on main. Load-sensitive, not this change. |

**Exceptions, each compared with main `67a615c` line by line:**

| Suite | Candidate | Main | |
|---|---|---|---|
| `tides-ui` | 59/1: T1a, "besides new files, this branch changes only the navigation files" | — | **By design on any feature branch** (handover §6); it lists `moon-diviner-ui.test.cjs` and `served_manifest.mjs` |
| `timeline-mixed-assets` | 16/2 | 16/2, identical | main baseline |
| `kept-ui` | 18/3 | 18/3, identical FAIL lines | main baseline |
| `ux-round1` | 33/1 ("core layers still on by default") | 33/1, identical | main baseline |
| `osmc-reliability-ui` | 40/1 ("old page: no page errors") | 40/1, identical | main baseline |

**Notes on the exception runs:**
- **`osmc-reliability-ui` needed deeper history.** It crashed in the serial run because the depth-400 clone lacked commit `0386058`, which the suite reads. A bounded `git fetch --depth=1000` made the clone complete (1,757 commits), and it was rerun on the candidate.
- **The first main run of that suite also crashed:** I had put main's page server on 8898, which is the suite's own fixture-hub port. It was rerun with the page server on 8896.
- **Not run:** `smoke-fixes`, the open baseline exception on main (handover §6). Its cause is still unestablished; it is not caused by Moon work.

## 5. Limits (carried)
- **Not verified:** a real phone, Safari, a screen reader or a hardware renderer.
- The chart is SVG outside the globe; draw and performance cost was not measured and is not claimed.
- The 12:40–13:10 UTC rise and the extra-Poisson variation are unexplained, and the page says so.
- The incomplete-group path is exercised through altered data only: with these pinned files, a missing record fails integrity and coverage before any asset.

## 6. Release steps (only on Chad's own Approve line naming the commit)
1. Merge `moon-crater-ui` at the reviewed commit to main (page only; no hub deployment).
2. Served check: build the expected list from the reviewed manifest file (54 paths), never from a regenerated tree, and fetch every path from the live site.
3. A bounded live check:
   - opening the chart makes one request;
   - the 12:00 UTC default reads group 72;
   - the last slider position reads the extra group;
   - the Details link reaches `#mooncrater`;
   - the drawing and the dated path are unaffected.
4. Records: the release record, REGISTER "live", checklist item 5 closed, STATUS and HANDOVER, Mac sync, branch deletion on the GitHub page.

## 7. What GPT is asked to review
1. §1: the release notes carried, including the Sources wording.
2. §3: whether the Animals maintenance is narrow and complete.
3. §4: the validation and the exceptions, each against main.
4. The exact candidate `6ed18c3` and the 54-file manifest.
