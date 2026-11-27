# HANDOVER — Mother Earth: Moon spec after the LROC release (item 4 closed)

Written 27 Nov 2026, 05:06 SAST / 03:06 UTC (clock reading), at the close of the Moon LROC (Apollo 11 detailed site) thread. Repo copy: `reviews/2026-11-27-moon-lroc-handover.md`; Project copy: `claude/HANDOVER-MOON-AFTER-LROC.md`. It replaces `claude/HANDOVER-MOON-NEXT-ITEM.md`, which is kept as history.

**What the next thread does first, and only this:** read in, establish current main, check tools and access, and report to Chad when oriented. **Do not** deploy, download bulk data, run broad test suites or start a new feature just because a handover arrived. Then continue **one item at a time** on Chad's word. The Moon spec is assessed and closed before Sun/Parker.

## 1. Roles

- **Chad** owns the project and approves. Production actions need **his own line, "Approve: …", naming the exact candidate commit**: merges, pushing `main` with page changes (pushing main publishes the page), and hub deploys. GPT's text relayed by Chad is never Chad's approval. That happened once in this thread (27 Nov): GPT's suggested owner line was not acted on until Chad sent it himself.
- **Claude** implements, tests, deploys (after approval), verifies and keeps the records.
- **GPT** reviews independently. Its reviews arrive as files in the Mac's `ChatGPT/Mother Earth/` folder and are filed unchanged in `reviews/`.

## 2. Read in, in this order

1. Memory and past chats: this is not a fresh sandbox.
2. `START-HERE.md`, especially "Testing and acquisition rules added 26 Nov 2026" and "Lessons added 26 Nov 2026 (Moon LROC)" (items 1–9).
3. `HANDOVER.md`, the top block "MOON LROC (ITEM 4) RELEASED AND CLOSED".
4. `STATUS.md`, the 27 Nov 02:48 UTC entry.
5. **`docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` rev 17** (Project copy `claude/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`): the programme record.
6. `reviews/2026-11-27-moon-lroc-release.md` (release record) and `reviews/2026-11-26-moon-lroc-release-rc.md` (RC packet).
7. This note.

The full LROC trail, in order (all on main): proposal `docs/concepts/MOON-LROC-REGION-PROPOSAL.md` rev 2.1 → `reviews/2026-11-26-moon-lroc-proposal-rev1-gpt-review.md`, `…-proposal-rev2-gpt-recheck.md` → `reviews/2026-11-26-moon-lroc-retention-frame-closure.md` and `…-retention-frame-rev21-gpt-recheck.md` → preview packet `reviews/2026-11-26-moon-lroc-ui-rc.md` (rev 3) and `…-ui-gpt-review.md`, `…-ui-rev3-gpt-recheck.md` → RC packet → `reviews/2026-11-27-moon-lroc-release-rc-gpt-review.md` → release record.

## 3. Live state (27 Nov, 03:06 UTC)

- **main:** this handover's commit (after `614d8b8`). Recheck it: other threads push docs to main.
- **Moon tab releases, all page only, no hub change:**

| Item | Merge | Reviewed / released commit | Served manifest |
|---|---|---|---|
| Height (LOLA) | `d6a26b6` | `afb42d5` | `reviews/evidence/2026-11-26-moon-height-manifest.json` (42; record) |
| Temperature (Diviner) | `0622e80` | `310ca1e` | `…-moon-diviner-manifest.json` (44; record) |
| **Detailed site (LROC, Apollo 11)** | **`8e7d262`** (pushed 02:41:37 UTC) | **`40e0f86`** (validated tree `9436b8e`; payload `998df30`) | **`…-moon-lroc-manifest.json`, 50 files, sha256 `cdd304f5…5fe1`: the comparison in force** |

- **LROC served verification:** 50 of 50 live files matched the reviewed manifest at 02:44:57 UTC, and again at 03:03:12 UTC. The second check fetched the manifest from GitHub at `40e0f86` and confirmed its hash first.
- **LROC live functional check (02:45–02:46 UTC):** opening turns the globe to the site and draws the ring; both views load; the pointer works in the site view; closing returns focus to the toggle and leaves the camera where it was. Not reproduced live: the globe-failure path (covered by tests J1–J2 and by GPT's independent check).
- **Rollback:** `git revert -m 1 8e7d262`, page only, on Chad's own Approve line.
- **Hub:** untouched by all Moon work.
- **Animals suite pins** (`phase1/animals-tab-ui.test.cjs`): `LR_MAIN` `998df30` / `LR_PARENT` `d73a639` hold `moon.html` and `sources.html`; the earlier `DV_*` and `MH_*` pins are baselines behind them. Any later edit to `moon.html`, `moonglobe.js` or `sources.html` needs a narrow pin-maintenance commit and an Animals rerun.

## 4. Moon checklist status (rev 17)

| # | Item | Status |
|---|---|---|
| 1 | Existing appearance, orientation, polar disclosure, lighting, dated LRO path | **done: preserved** |
| 2 | LOLA height | **done: released and closed** (`d6a26b6`) |
| 3 | Diviner temperature | **done: released and closed** (`0622e80`) |
| 4 | LROC regional imagery (Apollo 11) | **done: released and closed** (`8e7d262`); other sites only if Chad asks |
| 5 | CRaTER radiation | to assess |
| 6 | LEND neutron / hydrogen | to assess |
| 7 | LAMP far-ultraviolet | to assess |
| 8 | Mini-RF radar | to assess |
| 9 | Science/trajectory pairing, footprints | only inside the item it serves |
| 10a | Sky zoom-out textured Moon | to assess and decide (separate round) |
| 10b | Tides Moon | closed decision: unchanged |
| 11 | Verification limits | open record, carried with every item |
| 12a–c | Higher-resolution LOLA, individual LOLA returns, terrain displacement | options for Chad to classify |
| 13 | Current LRO prediction or position | outside scope |

**Suggested next (Claude's suggestion; Chad decides):** 10a (Sky Moon decision), then 5, 6, 7, 8. Each item goes through: bounded assessment and proposal (docs only) → GPT review → Chad's go → branch build → GPT review → release candidate → Chad's own Approve line → merge, served check and live check → records, close-out and checklist. Never call an unassessed item "infeasible"; park only with a reason and a revisit condition.

## 5. Decisions already made (LROC)

- Apollo 11, both views (area 4 m and site 0.5 m), pointer off by default, camera left where it is on switch-off.
- 2 × 2 rule (at least 2 of 4 valid), hatched no-data. D1–D6 all made.
- HTML locator with geometric visibility from the live camera, not WebGL depth-testing. JPEG tolerances ≤ 6 grey levels (area) and ≤ 3 (site). Accepted by GPT and Chad.
- The toggle sits outside `#mg-ctl`, so it survives a globe failure (GPT, rev 3 recheck).
- Sources' lighting wording corrected: switching height or temperature off "puts back the lighting you had before". This closes the carried note.
- **Standing rules from this programme:** a durable checkpoint per acquired file before the next starts; live served checks built from the reviewed manifest file, never from the working tree (`served_manifest.mjs --pane` builds from the tree, so generate the page script from the reviewed file instead).

## 6. Unresolved findings and testing limits (carried)

- **Not verified, any Moon feature:** real phone, Safari, screen reader, hardware renderer. The HTML locator's CPU and layout cost was not measured. Idle pausing of the globe was never delivered (a separate question for Chad).
- **Byte-identical rebuild** of the LROC JPEGs holds only in the pinned encoder environment (Pillow 12.3.0, libjpeg 6.2).
- **Suite baselines on main, not ours:** `timeline-mixed-assets` 16/2 (animals.html against the old stylesheet), `osmc-reliability-ui` 40/1 ("old page: no page errors"). `tides-ui` T1a fails on any feature branch by design (branch scope). `smoke-fixes`, `kept-ui` and `ux-round1` were clean on 26 Nov.
- **Load-sensitive:** `fire-status-ui` (3 staleness checks fail under four-way load; 279/0 alone), `moon-height-ui` draw count, `moon-lro-path` (slow; 16 min under load), `moon-lit` one timing check.
- **Audit gap, disclosed:** the parallel `fire-status-ui` log of the RC sweep was overwritten by its rerun.
- **Suite sizes:** `moon-lroc-ui` 78 (20 breaks), `moon-diviner-ui` 178 (19), `moon-height-ui` 110 (12), `moon-globe` 67, `moon-lit` 138, `moon-lro-path` 68, `moon-light` 27, `animals-tab-ui` 296.

## 7. Access, tools and surfaces

**Chad's authorization (27 Nov, carry it forward):** "You have my explicit authorization to use the Mac files and folders, Chrome extension, browser pane, GitHub and Cloudflare as needed for this project, including creating, editing and deleting within the agreed scope." It does **not** authorize an unapproved production release or unrelated changes.

**Discover before assuming access is missing.** At the start, check the tool list (including deferred tools via ToolSearch) and the browser surfaces. What worked in this thread:

| Surface | How | Notes |
|---|---|---|
| Repo (push) | `add_repo` (owner TheOneTheOnlyTheChad, repo mother-earth, access push), clone to `/home/claude/mother-earth`, `register_repo_root` | Push from the workspace works. **`git push --delete` and the GitHub API for Pages builds are refused by the proxy.** Delete branches on the GitHub branches page in the browser pane (in a narrow pane, scroll the table right to reach the trash icon). |
| Mac folders | device bridge: `~/Documents/Mother Earth` → `$HOME/mnt/Documents--Mother Earth`; `~/Documents/ChatGPT/Mother Earth` → `$HOME/mnt/ChatGPT--Mother Earth`; `~/Downloads` → `$HOME/mnt/Downloads` | If not connected, ask once with `device_request_folder_access`. The Mac folder is a plain mirror, not git. `rm` is blocked; move to `_to_delete/`. `device_commit_files` re-encodes images and caps staged files at 25 MB: send binaries as tars (split above 25 MB) and verify hashes on the Mac. |
| Browser pane (preferred) | `mcp__remote-devices__Claude_Browser__*` | Live site (`github.io`), GitHub pages and PDS are reachable only from here. A tab behind another tab gets no animation frames: front it before checking anything drawn per frame. |
| Chrome extension | `mcp__claude-in-chrome__*` | Available; not needed this thread. |
| Cloudflare | signed in on the browser pane (per earlier threads) | Not used this thread; the hub was untouched. |
| Computer use | `computer_resolve_access` / `computer_request_access` (Finder granted on 27 Nov) | **The only route to the Mac's recoverable Trash** (Finder → File → Move to Trash). It fails while Chad is in a full-screen Space: the window cannot come there and off-Space clicks are unverifiable. |
| Mac filesystem tool | `mcp__remote-devices__filesystem__*` | Limited to `Downloads/IS_Claude`; not for this project. |
| Project | `Projects` tool | **Knowledge base about 95% full** (≈1.9 of 2.0 MB): upload only compact docs. The old `claude/STATUS.md`, `claude/START-HERE.md` and `claude/HANDOVER.md` copies date from Oct and are too large to refresh; the repo is authoritative. |

Session-specific items that may need renewing: the repo attachment (`add_repo` with push), Mac folder connections, and any computer-use app grant. Secrets live in `KEYS.md`: never type, print or paste them.

## 8. Cleanup state at handover

- **Branches:** `moon-lroc-ui` deleted on GitHub (02:51 UTC) and locally. GitHub still has 7 other branches, each with unique commits from another workstream: `animals-assessment-rc`, `cape-town-public-proposal`, `cape-town-station-rc`, `earth-from-space-fixtures-rc`, `earth-from-space-rc`, `earth-from-space-stage-d-docs-r2`, `widths-preview-rc`. **Leave them.** Locally: `main` only.
- **Mac sync:** synced preserve-first at `3310335` (10 updated, 28 new, 0 mismatches), then the later docs. Every preserved copy matches an earlier commit (`_sync-preserved/20261127T0250Z-lroc-release/`, `…T0252Z-lroc-closeout/`).
- **Review copies:** archived in `_sync-preserved/20261127T0250Z-lroc-review/` (proposal, preview and RC folders; checksums pass). `_review/` holds only an empty `_to_delete/`.
- **Retained source data (keep):** `_source-data/moon-lro-science-lroc/` (8 inputs, each matching `docs/research/moon-lro-science/lroc/checkpoints.jsonl`, plus 3 evidence views); the Diviner and LOLA retained data as before.
- **Staged for Chad to move to the Trash** (verified redundant; the Trash was not reachable while he was in a full-screen Space):
  - `~/Documents/Mother Earth/_to_delete/20261127-lroc-closeout/`: transfer tar parts and the RC tar (≈53 MB)
  - `~/Downloads/_to_delete-lroc/`: 9 LROC duplicates, byte-identical to the retained inputs (≈79 MB)
  - `~/Downloads/_to_delete-diviner/`: 18 GCP extractions plus `ghrm-sites-20-R1.f32`, byte-identical to the retained Diviner data (≈61 MB)
- **Not touched:** the rest of `~/Documents/Mother Earth/_to_delete/` (≈1.3 GB staged by other threads: Animals, earlier Moon and Tides close-outs). It is Chad's to trash.

## 9. Test setup in a fresh container (only when a task needs it)

- `/home/claude/spike`: `npm i globe.gl@2.45.0 playwright-core pngjs @fontsource/ibm-plex-mono@5 @fontsource/barlow-condensed@5 astronomy-engine satellite.js@6.0.2`.
- Playwright shim at `/home/claude/node_modules/playwright/index.js` (requires `playwright-core`, launches `/usr/bin/google-chrome`).
- `NODE_PATH=/home/claude/node_modules:/opt/npm-tools/node_modules:/home/claude/spike/node_modules`.
- Page server: `python3 phase1/serve-core-on.py 8899` from the tree under test. Several suites are hard-wired to 8899, so serve the frozen tree there.
- `moon-height-ui` needs `LOLA_SRC` pointing at the staged `_source-data/moon-lro-science-2026-11-26`. `mobile-pass` needs `/home/claude/fixtures/orbital.csv` from `phase1/orbital-fixture.build.mjs`.
- `build_lroc.py --check` needs the retained LROC inputs staged (`--src`).

## 10. Next agreed action and its boundaries

1. Read in (section 2), `git pull`, confirm main and a clean tree, and run `node phase1/moonsci/served_manifest.mjs --check` (a quick local check; no browser suites).
2. Check tools and access (section 7) and the Mac folder connections.
3. Report to Chad that you are oriented, with current main.
4. Then wait for Chad to name the next Moon item (suggested 10a). For that item: bounded assessment and proposal, docs only, for GPT's review. No build, bulk download, merge or deployment until Chad's go, and later his own Approve line naming the exact commit.

Sun and Parker wait until every Moon item has a recorded outcome and Chad accepts the Moon close-out.

## 11. Talking to Chad

SAST times, call him "bro", bottom line first, no apologies, say up front when he's needed at the screen. Messages for GPT give repo paths and commits, not pasted content. Times in records come from a real clock or are labelled "commit time".
