# HANDOVER — Mother Earth: Moon spec after item 10a (Sky zoom-out Moon picture released and closed)

Written 27 Nov 2026, 11:47 SAST / 09:47 UTC (clock reading), at the close of the Moon item 10a thread.
- Repo copy: `reviews/2026-11-27-moon-sky-texture-handover.md`.
- Project copy: `claude/HANDOVER-MOON-AFTER-SKY-TEXTURE.md`.
- It supersedes `reviews/2026-11-27-moon-lroc-handover.md` (Project `claude/HANDOVER-MOON-AFTER-LROC.md`), which is kept as history.

**What the next thread does first, and only this:** read in, establish current main and a clean tree, check tools and access, and report to Chad when oriented.
- **Do not** deploy, download bulk data, run broad test suites or start a feature just because a handover arrived.
- Then continue **one Moon item at a time** on Chad's word.
- Sun/Parker waits until every Moon item has a recorded outcome and Chad accepts the Moon close-out.

## 1. Roles

- **Chad** owns the project and approves. Production actions need **his own line, "Approve: …", naming the exact candidate commit**: merges, pushing `main` with page changes (pushing main publishes the page), and hub deploys. GPT's text relayed by Chad, including its "suggested owner line", is never Chad's approval.
- **Claude** implements, tests, deploys (after approval), verifies and keeps the records.
- **GPT** reviews independently. Its reviews arrive as files in the Mac's `ChatGPT/Mother Earth/` folder and are filed unchanged in `reviews/`.

## 2. Read in, in this order

1. Memory and past chats: this is not a fresh sandbox.
2. `START-HERE.md`, especially:
   - "Testing and acquisition rules added 26 Nov 2026";
   - "Lessons added 26 Nov 2026 (Moon LROC)" (1–9);
   - **"Lessons added 27 Nov 2026 (Moon item 10a)" (1–7)**.
3. `HANDOVER.md`, the top block "MOON ITEM 10a RELEASED AND CLOSED".
4. `STATUS.md`, the 27 Nov entries from 09:47 UTC back to 03:25 UTC.
5. **`docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` rev 23** (Project copy `claude/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`): the programme record.
6. `reviews/2026-11-27-moon-sky-texture-release.md` (release record) and `reviews/2026-11-27-moon-sky-texture-release-rc.md` (RC packet).
7. This note.

**The 10a trail, in order (all on main):**
1. Proposal `docs/concepts/MOON-SKY-TEXTURE-PROPOSAL.md` rev 1, with evidence in `docs/research/moon-sky-texture/`.
2. `reviews/2026-11-27-moon-sky-texture-proposal-rev1-gpt-review.md` (PASS with notes 1–6).
3. Preview packet `reviews/2026-11-27-moon-sky-texture-ui-rc.md` (rev 2; §0 is the R1 fix).
4. `reviews/2026-11-27-moon-sky-texture-ui-gpt-review.md` (HOLD, R1) and `reviews/2026-11-27-moon-sky-texture-ui-r1-gpt-recheck.md` (PASS).
5. RC packet, then `reviews/2026-11-27-moon-sky-texture-release-rc-gpt-review.md` (PASS).
6. Release record.

## 3. Live state (27 Nov, 09:47 UTC)

- **main:** `8d3a0af` (release records), then the close-out docs commits (`7e0ee79` and the one carrying this note's final text). Recheck with `git ls-remote origin main`: other threads push docs to main.
- **Item 10a release:**

| | |
|---|---|
| Reviewed and approved commit | **`1280c0d`** (Chad: "Approve: release the Sky zoom-out Moon picture from `moon-sky-texture-ui` at `1280c0d` to main, page only; no hub deployment.") |
| Merged / deployed | main fast-forwarded `018102c..1280c0d` at 09:31:52 UTC; GitHub Pages serves it |
| Frozen tested tree | `4c8aecd`; `1280c0d` adds records only |
| Payload baseline (Animals SK_MAIN) | `bc0afd0`; SK_PARENT `018102c` |
| Served manifest (the comparison in force) | `reviews/evidence/2026-11-27-moon-sky-texture-manifest.json`, **51 files, sha256 `15e96c52…de8a`** |
| Served check | 51/51 match at 09:33:15 UTC; the list was built from the reviewed file, not the tree |
| Live check (09:33 UTC) | no new request before entry; picture placed (orientation date 2026-11-27); wording as reviewed; stop B Moon radius 2.81 px; Back releases everything |
| Rollback | revert the release range on main (page only), on Chad's own Approve line |
| Hub | untouched (0.6.25); no Moon work has touched it |

- **Earlier Moon releases** (all page only), with manifests kept as records:
  - height `d6a26b6` / `afb42d5`;
  - temperature `0622e80` / `310ca1e`;
  - LROC `8e7d262` / `40e0f86` (50-file manifest).
- **Animals suite pins** (`phase1/animals-tab-ui.test.cjs`, 300 checks):
  - `SK_MAIN` holds `index.html` (13b), `skyscene.js` (13x) and `sources.html` (13e, Sky).
  - `LR_MAIN`, `DV_MAIN`, `MH_MAIN` and earlier are the baselines behind them; `moonlight.js` stays held to main by 13c.
  - **Any later edit to `index.html`, `skyscene.js`, `sources.html`, `moon.html` or `moonglobe.js` needs a narrow pin-maintenance commit (parent = the payload commit, this suite only) and an Animals rerun.**

## 4. Moon checklist status (rev 23)

| # | Item | Status |
|---|---|---|
| 1 | Existing appearance, orientation, polar disclosure, lighting, dated LRO path | **done: preserved** |
| 2 | LOLA height | **done: released and closed** |
| 3 | Diviner temperature | **done: released and closed** |
| 4 | LROC regional imagery (Apollo 11) | **done: released and closed**; other sites only if Chad asks |
| 5 | CRaTER radiation | **to assess** |
| 6 | LEND neutron / hydrogen | **to assess** |
| 7 | LAMP far-ultraviolet | **to assess** |
| 8 | Mini-RF radar | **to assess** |
| 9 | Science/trajectory pairing, footprints | only inside the item it serves |
| **10a** | **Sky zoom-out Moon picture** | **done: released and closed** (release commit `1280c0d`) |
| 10b | Tides Moon | closed decision: unchanged |
| 11 | Verification limits | open record, carried with every item |
| 12a–c | Higher-resolution LOLA, individual LOLA returns, terrain displacement | options for Chad to classify |
| 13 | Current LRO prediction or position | outside scope |

**Next:** Chad names one of 5, 6, 7 or 8 (or classifies 12a–c). Each item goes through these steps:
1. Bounded assessment and proposal, docs only.
2. GPT review.
3. Chad's go.
4. Branch build.
5. GPT review.
6. Release candidate.
7. Chad's own Approve line.
8. Merge, served check and live check.
9. Records, close-out and checklist.

**Rules:**
- Never call an unassessed item "infeasible"; park only with a reason and a revisit condition.
- Bulk acquisition needs its own go, with a durable checkpoint per file.

## 5. Decisions already made (item 10a)

- **D1:** proceed.
- **D2:** calculated orientation (two-direction fit, from the sunlight table and the Sky scene file; no invented roll).
- **D3:** evenly lit, no phase. A phased Moon and Earth would be a separate item.
- **D4:** the map as it is, with no brightness multiplier. Rendered about +19–21% over the old grey in the test environment (a sampled image statistic only).
- **D5:** reuse the unchanged `moonlight.js` (one script tag in `index.html`).
- **D6:** dispose the picture on exit.
- **R1 (GPT):** all placement errors are contained and end grey, with nothing kept. The texture is owned at construction; upload errors are never swallowed; one 10-second limit runs to a placed picture.
- **Standing rules carried:**
  - live served checks are built from the reviewed manifest file (never `--pane` from the tree);
  - a durable checkpoint per acquired file;
  - a break that cannot change any user path is not counted.

## 6. Unresolved findings and testing limits (carried)

- **Not verified, any Moon feature:** a real phone, Safari, a screen reader and a hardware renderer. 10a's GPU memory (≈10.7 MiB) is an estimate; heap figures are script heap only. Free-orbit Moon sizes on the Sky view were not measured.
- **`smoke-fixes`:** an unresolved baseline exception. It stops at its harness wait (line 109) with the same 11 FAIL lines on unchanged main `018102c` and on the 10a candidate. The cause is not established (possibly the time of day in its fire fixture); it was clean at about 05:00 UTC. It needs its own investigation when Chad chooses. It is not caused by Moon work.
- **Suite baselines on main, not ours:**
  - `timeline-mixed-assets` 16/2;
  - `osmc-reliability-ui` 40/1;
  - `tides-ui` T1a fails on any feature branch by design (branch scope).
- **Load-sensitive suites:** `fire-status-ui`, `moon-height-ui` draw count, `moon-lro-path`, and one `moon-lit` timing check.
- **Suite sizes:**
  - `sky-moon-texture-ui` 197 (17 breaks; old-code control for R1);
  - `sky-zoom-ui` 351, `sky-ui` 79, `skycraft-ui` 77;
  - `animals-tab-ui` 300 (plus 6 Sky tamper breaks);
  - `moon-diviner-ui` 178, `moon-lroc-ui` 78, `moon-height-ui` 110;
  - `tides-nav` 2,882, `desktop-overflow` 286, `night-lights-ui` 152.

## 7. Access, tools and surfaces

**Chad's authorization (27 Nov, carry it forward):** "You have my explicit authorization to use the Mac files and folders, Chrome extension, browser pane, GitHub and Cloudflare as needed for this project, including creating, editing and deleting within the agreed scope."
- It does **not** authorize an unapproved production release or unrelated changes.
- Production still needs his Approve line naming the exact commit.

**Discover before assuming access is missing.** At the start, check the tool list (including deferred tools via ToolSearch) and the browser surfaces.

| Surface | How | Notes |
|---|---|---|
| Repo (push) | `add_repo` (owner TheOneTheOnlyTheChad, repo mother-earth, access push), clone to `/home/claude/mother-earth`, `register_repo_root` | Push of commits works. **Fetch with `--depth=400` or more:** a shallow fetch re-shallows the clone and breaks the Animals checks. **`git push --delete` and GitHub API writes do not work through the proxy:** delete branches on the GitHub branches page in the browser pane (the row's trash button; a small script works in a narrow pane). |
| Mac folders | device bridge: `~/Documents/Mother Earth` → `$HOME/mnt/Documents--Mother Earth`; `~/Documents/ChatGPT/Mother Earth` → `$HOME/mnt/ChatGPT--Mother Earth`; `~/Downloads` → `$HOME/mnt/Downloads` | They are not connected at the start of a new session: ask once with `device_request_folder_access` (Chad approves the prompt). The Mac folder is a plain mirror, not git. `rm` is blocked: move to `_to_delete/`. Send binaries as tars (25 MB staging cap) and verify hashes on the Mac. |
| Browser pane (preferred) | `mcp__remote-devices__Claude_Browser__*` | Signed in to GitHub (tab `seed`) and Cloudflare (left on the live site after the check; navigate back to `dash.cloudflare.com` when needed). The live site, GitHub and PDS are reachable here. Front a tab before checking anything drawn per frame. |
| Chrome extension | `mcp__claude-in-chrome__*` | Connected ("Browser 1", macOS); not needed this thread. |
| Cloudflare | browser pane (signed in); read-only connector `Cloudflare_Developer_Platform` (Worker `mother-earth`, last modified 24 Nov 18:01:46 UTC = hub 0.6.25) | Not used this thread. |
| Computer use | `computer_request_access` (Finder) | The only route to the Mac's recoverable Trash. It fails while Chad is in a full-screen Space. Not used this thread. |
| Project | `Projects` tool | The knowledge base is about 95% full: upload compact docs only. The repo is authoritative. |

Session-specific items that need renewing in a new thread: the repo attachment (`add_repo` with push), the three Mac folder connections, and any computer-use app grant. Secrets live in `KEYS.md`: never type, print or paste them.

## 8. Cleanup state at handover

- **Branches:**
  - Deleted on GitHub (browser page) and locally: `moon-sky-texture-ui` and `moon-sky-texture-docs`. Both were fully contained in main.
  - **Left on GitHub: 7 other branches**, each with unique commits from another workstream: `animals-assessment-rc` (22), `cape-town-public-proposal` (1), `cape-town-station-rc` (10), `earth-from-space-fixtures-rc` (7), `earth-from-space-rc` (73), `earth-from-space-stage-d-docs-r2` (1), `widths-preview-rc` (3).
  - Locally: `main` only; the worktree was removed.
- **Mac sync:**
  - Main's changed files synced preserve-first after the release: 27 files; 9 existing copies preserved in `_sync-preserved/20261127-10a-release/` (none had local edits); 27/27 match main. The close-out records are synced the same way.
  - **Kept:** `_sync-preserved/` (provenance) and the GPT review files in `ChatGPT/Mother Earth/` (GPT's folder; copies filed in `reviews/`).
- **Review copies:** the four 10a folders (`moon-sky-texture-rev1`, `-ui`, `-ui-r1`, `-release-rc`) were moved from `_review/` to `_to_delete/`. Their contents are on main (packets, reviews, logs summarised; full logs in the folders).
- **Staged in `~/Documents/Mother Earth/_to_delete/` for Chad to move to the Trash** (his standing rule: he empties it himself):
  - the four 10a review folders;
  - `sync-10a-x/` (the transfer tar and its unpacked copy);
  - the 10a transfer tars.
- **Still staged from the LROC thread:** `_to_delete/20261127-lroc-closeout/`, `~/Downloads/_to_delete-lroc/` and `~/Downloads/_to_delete-diviner/`. Chad may already have trashed these.
- **No source data was acquired in 10a.** The retained LROC, Diviner and LOLA source data remain as recorded.
- **Container:** temporary evidence, transfer tars and the test worktree were removed at close-out. The Playwright and npm set-up in `/home/claude/spike` is disposable.

## 9. Test setup in a fresh container (only when a task needs it)

- `/home/claude/spike`: `npm i globe.gl@2.45.0 playwright-core pngjs @fontsource/ibm-plex-mono@5 @fontsource/barlow-condensed@5 astronomy-engine satellite.js@6.0.2`.
- Playwright shim at `/home/claude/node_modules/playwright/index.js` (requires `playwright-core`, launches `/usr/bin/google-chrome`).
- `NODE_PATH=/home/claude/node_modules:/home/claude/spike/node_modules:/opt/npm-tools/node_modules`.
- **Page servers on 8899, from a frozen worktree of the tree under test:**
  - `python3 -m http.server 8899 --bind 127.0.0.1` for the Sky and texture suites;
  - `python3 phase1/serve-core-on.py 8899` for the older suites (`smoke-fixes`).
  - Allow a few seconds between stopping one server and starting the next.
- `mobile-pass` needs `/home/claude/fixtures/orbital.csv` (`phase1/orbital-fixture.build.mjs`). `moon-height-ui` needs `LOLA_SRC`. `animals-tab-ui` needs deep history.
- **Breaks:** `BREAK=<name>` (each suite lists its own); `sky-moon-texture-ui` also takes `ONLY=<sections>` and `OLD=<skyscene.js path>`.

## 10. Next agreed action and its boundaries

1. Read in (section 2). Attach the repo with push, clone, `git fetch --depth=400`, and confirm main and a clean tree. Run `node phase1/moonsci/served_manifest.mjs --check` (quick and local; expect 51 files).
2. Check tools and access (section 7) and connect the Mac folders.
3. Report to Chad that you are oriented, with current main.
4. Wait for Chad to name the next Moon item (5 CRaTER, 6 LEND, 7 LAMP, 8 Mini-RF), or to classify 12a–c. For that one item: bounded assessment and proposal, docs only, for GPT's review.
5. No build, bulk download, merge or deployment until Chad's go, and later his own Approve line naming the exact commit.

## 11. Talking to Chad

- SAST times, call him "bro", bottom line first, no apologies.
- Say up front when he's needed at the screen (for example the Mac folder prompt).
- Messages for GPT give file paths and commits, not pasted content.
- Times in records come from a real clock or are labelled "commit time".
