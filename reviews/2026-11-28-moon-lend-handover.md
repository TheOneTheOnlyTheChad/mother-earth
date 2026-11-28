# HANDOVER — Mother Earth: Moon spec after item 6 (LEND south-polar record and readout-rounding fix released and closed)

Written 28 Nov 2026, 07:19 SAST / 05:19 UTC (clock reading), at the close of the Moon item 6 (LEND) thread.
- Repo copy: `reviews/2026-11-28-moon-lend-handover.md`.
- Project copy: `claude/HANDOVER-MOON-AFTER-LEND.md`.
- It supersedes `reviews/2026-11-27-moon-crater-handover.md` (Project `claude/HANDOVER-MOON-AFTER-CRATER.md`), which is kept as history together with the earlier Moon handovers.

**What the next thread does first, and only this:** read in, establish current main and a clean tree, check tools and access, and report to Chad when oriented.
- **Do not** deploy, download bulk data, run broad test suites or start a feature just because a handover arrived.
- Then continue **one Moon item at a time**, on Chad's word, to finish assessing and closing the Moon spec.
- Sun and Parker work waits until every Moon item has a recorded outcome and Chad accepts the Moon close-out.

## 1. Roles

- **Chad** owns the project and approves. Production actions need **his own line, "Approve: …", naming the exact candidate commit**.
  - Production actions are merges, pushing `main` with page changes (pushing main publishes the page) and hub deploys.
  - GPT's text relayed by Chad, including its "suggested owner line", is never Chad's approval. When in doubt, ask him whether it is his own go. (A relayed message that Chad sends himself with a "Go:" line is his go; on 28 Nov he relayed GPT's rounding recommendation and sent the "Go:" line himself.)
- **Claude** implements, tests, deploys (after approval), verifies and keeps the records.
- **GPT** reviews independently.
  - Its reviews arrive as files in the Mac's `~/Documents/ChatGPT/Mother Earth/` folder and are filed unchanged in `reviews/` (check the sha256 against the Mac copy).
  - Messages to GPT give paths and commits, not pasted content.

## 2. Read in, in this order

1. Memory and past chats: this is not a fresh sandbox.
2. `START-HERE.md`, especially:
   - the top "Live page" line (LEND and the rounding fix);
   - "Testing and acquisition rules added 26 Nov 2026";
   - the lessons blocks for Moon LROC, Moon item 10a, Moon item 5 (CRaTER) and **Moon item 6, LEND (1–9)**.
3. `HANDOVER.md`, the top block "MOON ITEM 6 (LEND) … CLOSED".
4. `STATUS.md`: the 28 Nov and 27 Nov entries, newest first, down to 27 Nov 16:21 UTC (LEND assessed).
5. **`docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` rev 36** (Project copy `claude/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`): the programme record.
6. `reviews/2026-11-28-moon-lend-release.md` and `reviews/2026-11-28-moon-lend-rounding-release.md` (release records).
7. This note.

**The LEND trail, in order (all on main):**
1. Proposal `docs/concepts/MOON-LEND-PROPOSAL.md` rev 2 (D1–D9); evidence in `docs/research/moon-lend/` (scripts `assess_lend_1.py`, `assess_lend_2.py`, `preview_lend_3.py`, `preview_lend_4.py`, `check_lend_4.py`, outputs, `checkpoints.jsonl`, README).
2. `reviews/2026-11-27-moon-lend-proposal-rev1-gpt-review.md` (REVISE BEFORE BUILD, R1–R3).
3. `reviews/2026-11-27-moon-lend-proposal-rev2-gpt-recheck.md` (PASS, build notes 1–4).
4. Preview packet `reviews/2026-11-27-moon-lend-ui-rc.md` (with a §4 erratum), then `reviews/2026-11-27-moon-lend-ui-gpt-review.md` (PASS; finite-header fix required).
5. RC packet `reviews/2026-11-27-moon-lend-release-rc.md`, then `reviews/2026-11-28-moon-lend-release-rc-gpt-review.md` (PASS).
6. Release record `reviews/2026-11-28-moon-lend-release.md` (with the rounding observation).
7. Rounding fix: packet `reviews/2026-11-28-moon-lend-rounding-rc.md`, then `reviews/2026-11-28-moon-lend-rounding-gpt-review.md` (PASS), then release record `reviews/2026-11-28-moon-lend-rounding-release.md`.
8. Run logs: `reviews/evidence/2026-11-28-moon-lend-review-logs.tgz` and `reviews/evidence/2026-11-28-moon-lend-rounding-review-logs.tgz`.

## 3. Live state (28 Nov, 05:19 UTC)

- **main: `560ca8c`** (rounding close-out records), then the close-out commit that carries this note. Recheck with `git ls-remote origin main`, because other threads push docs to main.
- **Item 6 release (LEND south-polar record):**

| | |
|---|---|
| Reviewed and approved commit | **`5ed9d70`** (Chad: "Approve: release the Moon south-polar LEND record from moon-lend-ui at 5ed9d70 to main, page only; no hub deployment or north acquisition.") |
| Merged / deployed | merge **`25993bf`** (01:44:38 UTC commit time) of `5ed9d70` into main `90c457e`; GitHub Pages run completed 01:45:43 UTC |
| Served check | 55/55 against `reviews/evidence/2026-11-27-moon-lend-manifest.json` (`4764f405…`) at 01:47:03 UTC |
| Live check | 01:47–01:48 UTC: off by default; one file request; pole and centre; all five readout states; layer switch and re-entry; lighting restored; Details |
| Records after it | `a46d218` (records-only merge of branch head `7f851cc`), `542b689` (release records) |
| Rollback | `git revert -m 1 25993bf` |

- **Item 6 follow-up release (readout rounding):**

| | |
|---|---|
| Reviewed and approved commit | **`f0c7625`** (Chad: "Approve: release the LEND readout-rounding fix from `moon-lend-rounding` at `f0c7625` to main, page only; no hub or data change.") |
| Merged / deployed | merge **`4b646ea`** (04:33:34 UTC commit time) of `f0c7625` into main `a4a4953`; GitHub Pages run completed 04:34:37 UTC |
| Served manifest (the comparison in force) | **`reviews/evidence/2026-11-28-moon-lend-rounding-manifest.json`, 55 files, sha256 `943d243b…20b1`** |
| Served check | 55/55 at 04:35:48 UTC, and again at close-out at **05:12:32 UTC**, the expected list read directly from the reviewed manifest file fetched from GitHub at `4b646ea` (its hash checked equal to the reviewed one first) |
| Live check | 04:35–04:36 UTC: cell 1604 (88.75°S, 82.25°E) reads −0.8% ± 0.4 pp; the −0.85 tie (cell 1601) reads −0.9%; −0.04 reads "−0.0%", 0 reads "0.0%"; toggle, layer, single request and lighting restore unchanged |
| Records after it | `ab08c32` (records-only merge of `cbb62ca`), `d6af47a` (review, record, logs), `560ca8c` (checklist, STATUS, HANDOVER) |
| Rollback | `git revert -m 1 4b646ea` (restores the released formatter; data unaffected) |
| Hub | untouched (0.6.25); no Moon work has touched it |

- **Earlier Moon releases** (all page only; their manifests are kept as records): height `d6a26b6`; temperature `0622e80`; LROC `8e7d262`; Sky zoom-out picture `1280c0d`; CRaTER `ba41c8a`.
- **Animals suite pins** (`phase1/animals-tab-ui.test.cjs`, 311 checks):
  - `RD_MAIN` `065b8b5` / `RD_PARENT` `542b689` hold `moon.html` (13e "LEND rounding", 13ae, 13af).
  - `LE_MAIN` `0db9f9f` / `LE_PARENT` `b67358d` hold `moon.html` (with the rounding key put back) and `sources.html` (13e "LEND", 13ac, 13ad).
  - `CR_MAIN`, `SK_MAIN`, `LR_MAIN`, `DV_MAIN`, `MH_MAIN` and earlier are the baselines behind them.
  - **Any later edit to `index.html`, `skyscene.js`, `sources.html`, `moon.html`, `moonglobe.js` or `craft.js` needs a narrow pin-maintenance commit and an Animals rerun.** The maintenance commit's parent is the payload commit, and it touches this suite only. Take full hashes from `git rev-parse`, never from memory (§6).
  - `moon-diviner-ui` H holds the literal Sources shortcut chain (now including "Moon neutron record"): maintain it when a shortcut is added.

## 4. Moon checklist status (rev 36)

| # | Item | Status |
|---|---|---|
| 1 | Existing appearance, orientation, polar disclosure, lighting, dated LRO path | **done: preserved** |
| 2 | LOLA height | **done: released and closed** |
| 3 | Diviner temperature | **done: released and closed** |
| 4 | LROC regional imagery (Apollo 11) | **done: released and closed**; other sites only if Chad asks |
| 5 | CRaTER radiation | **done: released and closed** (merge `ba41c8a`) |
| **6** | **LEND neutron / hydrogen** | **done: released and closed** (merge `25993bf`; rounding fix `4b646ea`) |
| 7 | LAMP far-ultraviolet | **to assess** |
| 8 | Mini-RF radar | **to assess** |
| 9 | Science/trajectory pairing, footprints | only inside the item it serves (CRaTER pairing assessed; LEND not paired; nothing drawn) |
| 10a | Sky zoom-out Moon picture | **done: released and closed** |
| 10b | Tides Moon | closed decision: unchanged |
| 11 | Verification limits | open record, carried with every item |
| 12a–c | Higher-resolution LOLA, individual LOLA returns, terrain displacement | options for Chad to classify ("assess" or "not pursued", with a reason) |
| 13 | Current LRO prediction or position | outside scope |

**To close the Moon spec:**
- 7 and 8 each need an outcome: released, or parked or not pursued with a reason and a revisit condition.
- Chad classifies 12a–c.
- 11 is summarised at close-out.
- Chad accepts the close-out.

Claude's suggested order (a suggestion only): LAMP (7), Mini-RF (8), then 12a–c, then the Moon close-out record.

**Every item goes through these steps:**
1. Bounded assessment and proposal, docs only, with a checkpoint per acquired file.
2. GPT review (and a recheck after a revision).
3. Chad's go.
4. Branch build (page preview).
5. GPT review.
6. Release candidate (Sources, REGISTER, narrow Animals pins, served manifest, final affected validation, exceptions compared with main on the same evening).
7. GPT release review, then Chad's own Approve line naming the commit.
8. Merge, served check from the reviewed manifest, live check.
9. Records, cleanup and checklist.

**Rules:** "Not yet assessed" is never "infeasible". An item is parked only with a reason and a revisit condition. A bulk acquisition needs its own go.

## 5. Decisions already made (item 6)

- **D1–D9 accepted by Chad** (proposal rev 2):
  - shown quantity: the relative difference in the archived `CSETN_RATE` field, p = 100(m/r − 1), from the ALD south-polar product `lend_rdr_alds_20111211` (2011-12-11 to 2016-09-14), 0.5° cells, 80–90°S;
  - m: inverse-variance-weighted mean over a 30 km great-circle radius (60 km diameter disc), centre-in-disc, sphere 1,737.4 km; r: the same over the 80.25–84.75°S band (7,200 cells);
  - ±: a first-order formal counting-error estimate propagated with the disc–band covariance, conditional on independent archive errors (not established);
  - withheld above 0.5 pp and wherever the disc crosses 80°S; states: 11,656 shown / 987 not in the archive / 317 withheld by error / 1,440 withheld at the edge (GPT reproduced all 14,400 records);
  - no raw value, unit, flux, hydrogen or ice amount; the archive's conflicting field definitions stated, not resolved; spatial response disputed and the disc is a display choice; no trajectory pairing; north pole not acquired (D9).
- **Readout rounding (Chad's go, GPT PASS):** stored integer hundredths shown as tenths rounded half away from zero (both values); the sign is the stored value's ("−0.0%" for −0.04; GPT: keep as written).
- **Not pursued now, with revisit conditions:** north pole (one more bounded file, on Chad's go); a newer map from the DLD daily data (a bulk acquisition); a hydrogen or WEH map (L3, not proposed).

## 6. Unresolved findings and testing limits (carried)

- **Not verified, for any Moon feature:** a real phone, Safari, a screen reader, a hardware renderer, device performance. For LEND, no layer performance measurement is claimed; "no second request on re-entry" is for the LEND file only.
- **Archive observations recorded, not resolved:** what `CSETN_RATE` is (unitless normalized ratio / relative count rate / counts per second) and whether a spacecraft background is subtracted.
- **Baseline exceptions on main** (each run on the LEND candidate, the rounding candidate and main on the same evening, assertion lines identical; not caused by Moon work):
  - `timeline-mixed-assets` 16/2; `kept-ui` 18/3; `ux-round1` 33/1;
  - `osmc-reliability-ui`: **an incomplete test**: it crashes at `git show 0386058` (that commit is missing from the clone's history); not a pass;
  - `smoke-fixes`: an open baseline exception (fire-record failures and a wait timeout), not a passed smoke test.
- **`tides-ui` T1a** fails on any feature branch by design (branch-scope check) and passes on main.
- **Load-sensitive suites:** `night-lights-ui`, `fire-status-ui`, `moon-height-ui` draw count, `moon-lro-path`, one `moon-lit` timing check.
- **Suite sizes now:** `moon-lend-ui` 89 (19 breaks), `test_build_lend.py` 436, `break_build_lend.py` 9 mutants; `animals-tab-ui` 311; `moon-crater-ui` 51; `moon-diviner-ui` 178; `moon-lroc-ui` 78; `moon-height-ui` 110; `sky-moon-texture-ui` 197; `tides-nav` 2,882; `timeline-ui` 594.

## 7. Access, tools and surfaces

**Chad's authorization (28 Nov, carry it forward):** "You have my explicit authorization to use the Mac files and folders, Chrome extension, browser pane, GitHub and Cloudflare as needed for this project, including creating, editing and deleting within the agreed scope."
- It does **not** authorize an unapproved production release or unrelated changes.
- Production still needs his Approve line naming the exact candidate commit.

**Discover before assuming access is missing.** At the start, check the tool list (including deferred tools, via ToolSearch) and the browser surfaces. GitHub and Cloudflare are usually already signed in, in the browser pane.

| Surface | How | Notes |
|---|---|---|
| Repo (push) | `add_repo` (owner TheOneTheOnlyTheChad, repo mother-earth, access push), clone to `/home/claude/mother-earth`, `register_repo_root` | Pushing commits works. **Fetch with `--depth=400` or more** (`osmc-reliability-ui` needs about 1000). `git push --delete` and GitHub API writes do not work through the proxy: delete branches on the GitHub branches page in the browser pane (scroll the narrow table right; click the row's bin icon). `gh run list` works and shows the Pages run for a commit. |
| Mac folders | device bridge: `~/Documents/Mother Earth` → `$HOME/mnt/Documents--Mother Earth`; `~/Documents/ChatGPT/Mother Earth` → `$HOME/mnt/ChatGPT--Mother Earth`; `~/Downloads` → `$HOME/mnt/Downloads` | They may not be connected at the start of a new session: ask once with `device_request_folder_access` (Chad approves the prompt). The Mac folder is a plain mirror, not git. `rm` is blocked: move to `_to_delete/`. Use `tar --overwrite`. Send binaries as tars and verify the hashes on the Mac. Preserve existing copies in `_sync-preserved/<date>-<name>/` before overwriting. |
| Browser pane (preferred browser) | `mcp__remote-devices__Claude_Browser__*` | Signed in to GitHub and Cloudflare. Reaches the live site, GitHub, raw.githubusercontent.com and PDS (the container cannot reach PDS). Run the served check from a tab on the live site; front the tab for anything drawn per frame. |
| Chrome extension | `mcp__claude-in-chrome__*` | Was connected earlier; not needed this thread. |
| Cloudflare | browser pane (signed in); read-only connector (Worker `mother-earth`, hub 0.6.25) | Not used this thread. |
| Computer use (Finder) | `computer_resolve_access` / `computer_request_access` (Finder granted again on 28 Nov, background mode) | The only route to the Mac's recoverable Trash. **Blocked while Chad is in a full-screen Space**: "Move to Bin" is disabled and the window cannot be brought over (again at this close-out). Clicking an already-selected Finder row can open rename: press Escape. |
| Claude Science | `mcp__plugin_claude-science_code__submit` | Available for analysis runs. |
| Project | `Projects` tool | The repo is authoritative. `project_write` with `local_path` accepts files under the repo folder (not `/tmp`); it needs the current Project text seen in the chat (a `project_read` or an earlier write) before replacing a doc. |

- **Session-specific items to renew in a new thread:** the repo attachment (`add_repo` with push), the three Mac folder connections, and the Finder grant if the Trash is needed.
- **Secrets** live in `KEYS.md`: never type, print or paste them.
- **Actual blockers:** none for docs-only assessment. The Trash step needs Chad on a normal desktop Space, or Chad moving the folders himself.
- **Container restarts:** the cloud environment restarted twice during one validation run on 28 Nov. Files survived; running commands did not. Keep long runs in short foreground chunks or log resume points.

## 8. Cleanup state at handover

- **Branches:**
  - Deleted on GitHub and locally, after verification that each was fully contained in main: `moon-lend-ui` (head `7f851cc`) and `moon-lend-rounding` (head `cbb62ca`).
  - **Left on GitHub: 7 branches from other workstreams**, each with commits main does not contain: `animals-assessment-rc` (22 ahead), `cape-town-public-proposal` (1), `cape-town-station-rc` (10), `earth-from-space-fixtures-rc` (7), `earth-from-space-rc` (73), `earth-from-space-stage-d-docs-r2` (1), `widths-preview-rc` (3).
  - Local: `main` only; worktrees removed.
- **Mac mirror:** every file main changed during item 6 was synced preserve-first (latest preserved copies in `_sync-preserved/2026-11-28-lend-rounding-release/`, with earlier ones in `…-lend-release/`, `…-lend-rounding/`, `…-lend-rc/`, `…-lend-ui/`). The close-out commit's files are synced the same way.
- **Retained, verified at close-out:** `_source-data/moon-lro-science-lend/` (`lend_rdr_alds_20111211.dat` `e6b1c2d5…`, `lend-docs-labels-2026-11-27.json` `7283e751…`, `checkpoints.jsonl` `7520b760…`, all equal to the repo checkpoints). Earlier Moon sources as recorded. The run logs are in the repo (two tars, §2).
- **Staged for the Trash** (Finder was blocked by the full-screen Space; **Chad moves these to the Trash himself** and empties it when he chooses):
  - `~/Documents/Mother Earth/_to_delete/moon-programme-to-trash-20261128/` (14 MB): the LEND Mac review copies and transfer tars, with a README naming the retained originals.
  - `~/Documents/Mother Earth/_to_delete/moon-programme-to-trash-20261127/` (from the CRaTER close-out, still there).
  - `~/Downloads/_to_delete-moon-20261127/` (185 MB): the Downloads copies of the LEND, CRaTER, Diviner and LROC sources, each hash-matched to its retained original; plus `mcclanahan-2303.03911v5.pdf` (a downloaded paper; research stays text only; on arXiv).
- **Other workstreams' items in `_to_delete/`** (Animals, Earth from Space, Timeline and others) were left as found.
- **Container:** transfer tars, temporary logs and worktrees removed. `/home/claude/spike`, `/home/claude/lenddata` and `/home/claude/lolasrc` are disposable copies.

## 9. Test setup in a fresh container (only when a task needs it)

- `/home/claude/spike`: `npm i globe.gl@2.45.0 playwright-core pngjs @fontsource/ibm-plex-mono@5 @fontsource/barlow-condensed@5 astronomy-engine satellite.js@6.0.2`.
- Playwright shim at `/home/claude/node_modules/playwright/index.js` (launches `/usr/bin/google-chrome`).
- `NODE_PATH=/home/claude/node_modules:/home/claude/spike/node_modules`.
- Page server `python3 -m http.server 8899` run from a frozen worktree of the tree under test (most suites are hard-wired to 8899). `osmc-reliability-ui` uses 8898/8897.
- Suite requirements: `moon-height-ui` needs `LOLA_SRC`; `animals-tab-ui` needs deep history; LEND builder checks need the retained `.dat` (`--src <dir>`); `mobile-pass` needs `/home/claude/fixtures/orbital.csv`.
- Breaks: `BREAK=<name>` (each suite lists its own; a missing pattern stops the suite). Capture exit codes with `rc=$?` straight after the command (§START-HERE LEND lesson 2).

## 10. Next agreed action and its boundaries

1. Read in (section 2).
2. Attach the repo with push, clone, `git fetch --depth=400`, and confirm main and a clean tree.
3. Run `node phase1/moonsci/served_manifest.mjs --check` (quick and local; expect **55 files**, "moon lend rounding manifest").
4. Check tools and access (section 7) and connect the Mac folders.
5. Report to Chad that you are oriented, with current main.
6. Wait for Chad to name the next Moon item (7 LAMP or 8 Mini-RF) or to classify 12a–c. For that one item: a bounded assessment and proposal, docs only, for GPT's review.
7. No build, bulk download, merge or deployment until Chad's go, and later his own Approve line naming the exact commit.

## 11. Talking to Chad

- SAST times, call him "bro", bottom line first, no apologies.
- Say up front when he's needed at the screen (for example the Mac folder prompt, or a normal desktop Space for Finder).
- Times in records come from a real clock or are labelled "commit time". Double-check SAST conversions in chat (a "06:15–06:09" slip was caught by GPT on 28 Nov).
