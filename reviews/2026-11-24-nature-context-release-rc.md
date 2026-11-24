# Nature context release — combined candidate (`nature-context-release`), packet rev 1

**24 Nov 2026 (12:27 UTC clock reading). Prepared, not released.** Nothing is on main; no publication push, deploy, R2 or hub change. Chad, in his own message of 24 Nov: own the combined Nature context release, using the Animals owner's patch unchanged; neither change lands separately; after GPT passes the patch, prepare both together on fresh main with the dated REGISTER correction and run every affected suite, Animals included, on the exact combined tree; report before asking for his Approve line.

**GPT's review of the Animals patch (`animals-nc-pin-rc` at `4ed4ca6`) was still pending when this was built.** This tree was prepared ahead of that review so the checks are ready. If GPT asks for any change to the patch, this candidate is rebuilt and rerun before anything is offered for approval.

## 1. The tested tree

**Tested tree: `f75c16709ac6ad4c37cdf5595a2f61ae818f12c4`** on branch `nature-context-release`. It consists of:

| Commit | What |
|---|---|
| `7e0379319778277e40bdec88507b5d5b97653f5d` | fresh main when the branch was cut |
| `27146c6ed7ac6e75d27f4843e386a21148c46009` | `--no-ff` merge of `nature-context-rc` at `29492a9`. It keeps the reviewed page commit H `90eb52203c23b26a7fe00382f30cf3453b00a583` in history, so the Animals suite's `NC_MAIN` stays reachable. |
| `d3fa37e4683755116ce05c7cc9e7f6f366465444` | `--no-ff` merge of `animals-nc-pin-rc` at `4ed4ca6`, the Animals owner's patch, **unchanged**. The suite at the combined tree is byte-identical to `4ed4ca6`'s (sha256 `2921d437ee6121af5d3836ef96aace33cabbbe765db89c47e16efb781af4cc38`). |
| `f75c16709ac6ad4c37cdf5595a2f61ae818f12c4` | the dated REGISTER correction: one line appended under the GFW integrated alerts entry; the original "Consequences for the page" line and the 1 Nov sample are kept |

The commit after `f75c167` adds this packet and its evidence only (`reviews/`).

**Production files at the tested tree**

| File | sha256 | Note |
|---|---|---|
| `app.js` | `a48769068c1a3fa1a2440f57e21610bd5d8f8195ce1e516cc79bfaaba9bd0e5a` | equals H, GPT-passed |
| `index.html` | `70b43b3e14198c9159204a1fa9bd1d5deff6031aca344c9329a9e9f4979d1b40` | equals H |
| `sources.html` | `d6ca4fae29e269adb093a311cd6bf9bd66b27cae7031521d3546b276e12cc70a` | equals H |
| `REGISTER.md` | `916809555a1f580a47012a27a20458f4376ceee6f3a1def6cc240e71047f5c7c` | |

**`git diff --name-only 7e03793 f75c167` outside `reviews/`:** `REGISTER.md`, `app.js`, `index.html`, `sources.html`, `phase1/animals-tab-ui.test.cjs`, `phase1/nature-context-ui.test.cjs`, `phase1/place-rows.test.mjs`, `phase1/place-ui.test.cjs`. None of these is touched: `style.css`, `phase1/worker.js` (main stays equal to the deployed hub 0.6.24), any Timeline or Animals page file.

**Main since the cut:** 4 commits, documents only (`STATUS.md`, two Timeline research files, one Timeline review; `41b0c00` at 12:27 UTC). No page, test or hub file. At release, latest main is merged in first, every non-document file is checked byte-equal to `f75c167`, and the two release-critical suites are rerun on that final tree before the push (§4).

## 2. Results on the exact tree `f75c167`

Cloud workspace, Chromium via Playwright 1.63, SwiftShader; the older page suites ran against `phase1/serve-core-on.py`. **Every suite that reads `index.html`, `app.js` or `sources.html` (52), plus `hub-alignment` and `history-hub`, was run on the combined tree. All 54 were also run on main `7e03793` for comparison.** Logs: `evidence/2026-11-24-nature-context-release/`.

- **Release-critical:**
  - `nature-context-ui` 78/0;
  - **`animals-tab-ui` 282/0**: the three expected failures 13b/13c/13e are gone, now that the Animals owner's pin is present;
  - `hub-alignment` 6/0 (worker.js = deployed hub 0.6.24);
  - `history-hub` 33/0.
- **Animals section 13 and the pin's breaks, rerun on the combined tree:** section 13 alone 14/0. Each of the eight `nc-*` breaks is caught at its named check: `nc-app-edited` 13k; `nc-index-edited`, `-tab-gone`, `-menu-gone` 13b; `nc-sources-edited`, `-tab-gone`, `-id-gone`, `-shortcut-gone` 13e. So is `earth-script-edited`, at 13c.
- **Passing (pass counts, 0 failed):**

| Suite | Passed |
|---|---:|
| animals-census-ui | 71 |
| animals-corridor-ui | 102 |
| arts-ui | 90 |
| backdrop-layer | 27 |
| bare-earth-ui | 190 |
| buoy-temp-ui | 33 |
| buoy-temp | 37 |
| cell-perf-ui | 43 |
| desktop-overflow | 286 |
| drifters-ui | 25 |
| dustrgb-ui | 67 |
| fire-status-ui | 279 |
| fires-wording-ui | 35 |
| freshness-wording-ui | 156 |
| kept-ui | 21 |
| kp-degraded | 29 |
| layer-switches-ui | 68 |
| legend-active-ui | 548 |
| moon-globe | 67 |
| night-lights-ui | 152 |
| optional-layers-status-ui | 230 |
| orbital-ui | 38 |
| place-rows | 7 |
| place-ui | 35 |
| plastic-ui | 29 |
| quakes-ships-status-ui | 124 |
| search-ui | 117 |
| search (real data) | 50 |
| search | 111 |
| ships-retain-ui | 42 |
| sky-scene-ref | 7 |
| sky-ui | 79 |
| sky-zoom-ui | 351 |
| skycraft-ui | 77 |
| smoke-fixes | 113 |
| solar | 26 |
| sun-globe | 103 |
| terminator-behaviour | pass |
| terminator-ui | pass |
| timeline-changes-build | 49 |
| timeline-mixed-assets | 18 |
| timeline-ui | 594 |
| ux-round1 | 34 |
| wind-ui | 92 |

- **Reruns after libraries were installed.** `sky-scene-ref`, `sky-zoom-ui` and `solar` first stopped for want of `astronomy-engine`, so it and `satellite.js@6.0.2` were installed into the workspace's library folder. `buoy-temp-ui` first stopped because it writes a screenshot to a fixed scratch path; the folder was created. All four were then rerun on the same tree and pass (main: the same).
- **Same on both trees (not caused by this release):**
  - `osmc-reliability-ui` 40/1 on both. The one failure is its "old page" check, which loads an older page version from history and gets a `TypeError` there.
  - **Not run on either tree, for missing local fixtures:** `key-drawn-ui`, `mobile-pass`, `orbital-browser` and `status-notes-ui` need `/home/claude/fixtures/orbital.csv`; `oceanheat-ui` needs `OH_SNAPSHOT_DIR`. Neither fixture is in the repository or this workspace. **These five suites are unverified here.**
- **Main for comparison:** `animals-tab-ui` 280/0 (its own suite, without the pin checks); `nature-context-ui` does not exist on main; every other suite as on the combined tree.

**Network:** the page suites route provider requests. During the runs the workspace proxy refused 10 connections to the hub host (HTTP 403). No suite needs the live hub, and none passed or failed on it.

## 3. Not checked

- Real phone, Safari, screen reader: not checked.
- Live data: not used.
- The five fixture-less suites above.
- The hub's own "published" wording is still in `phase1/worker.js`. No page surface prints it for forest. It is left for the hub owner; there is no hub deploy in this release.

## 4. What happens on Chad's Approve line (nothing before it)

1. Confirm GPT has passed `animals-nc-pin-rc` at `4ed4ca6` unchanged. If it hasn't, stop.
2. Fetch fresh main and merge it into `nature-context-release` (`--no-ff`). Check that every non-document file equals `f75c167` (`git diff --name-only f75c167 HEAD` lists documents only). Rerun `nature-context-ui`, `animals-tab-ui`, `hub-alignment` and `place-ui` on that exact tree.
3. Fast-forward main to that commit and push. This is the publication step. Take the merge number from `git log`.
4. In the browser pane, read the served `app.js`, `index.html`, `sources.html` with `cache: 'no-store'` and check their sha256 against §1. Read the live forest card, one place panel and Sources.
5. Update STATUS, HANDOVER and START-HERE. Delete `nature-context-rc`, `animals-nc-pin-rc` and `nature-context-release` on GitHub, and read the deletion back with `git ls-remote`.
