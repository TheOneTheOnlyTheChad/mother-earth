# HANDOVER — Mother Earth: Moon spec after item 5 (CRaTER event-count chart released and closed)

Written 27 Nov 2026, 17:55 SAST / 15:55 UTC (clock reading), at the close of the Moon item 5 (CRaTER) thread.
- Repo copy: `reviews/2026-11-27-moon-crater-handover.md`.
- Project copy: `claude/HANDOVER-MOON-AFTER-CRATER.md`.
- It supersedes `reviews/2026-11-27-moon-sky-texture-handover.md` (Project `claude/HANDOVER-MOON-AFTER-SKY-TEXTURE.md`). That note and the LROC handover are kept as history.

**What the next thread does first, and only this:** read in, establish current main and a clean tree, check tools and access, and report to Chad when oriented.
- **Do not** deploy, download bulk data, run broad test suites or start a feature just because a handover arrived.
- Then continue **one Moon item at a time**, on Chad's word, to finish assessing and closing the Moon spec.
- Sun and Parker work waits until every Moon item has a recorded outcome and Chad accepts the Moon close-out.

## 1. Roles

- **Chad** owns the project and approves. Production actions need **his own line, "Approve: …", naming the exact candidate commit**.
  - Production actions are merges, pushing `main` with page changes (pushing main publishes the page) and hub deploys.
  - GPT's text relayed by Chad, including its "suggested owner line", is never Chad's approval. When in doubt, ask him whether it is his own go.
- **Claude** implements, tests, deploys (after approval), verifies and keeps the records.
- **GPT** reviews independently.
  - Its reviews arrive as files in the Mac's `~/Documents/ChatGPT/Mother Earth/` folder and are filed unchanged in `reviews/` (check the sha256).
  - Messages to GPT give paths and commits, not pasted content.

## 2. Read in, in this order

1. Memory and past chats: this is not a fresh sandbox.
2. `START-HERE.md`, especially:
   - the top "Live page" line (CRaTER);
   - "Testing and acquisition rules added 26 Nov 2026";
   - the lessons blocks for Moon LROC (1–9), Moon item 10a (1–7) and **Moon item 5, CRaTER (1–8)**.
3. `HANDOVER.md`, the top block "MOON ITEM 5 (CRaTER) … CLOSED".
4. `STATUS.md`: the 27 Nov entries, newest first, down to 10:18 UTC.
5. **`docs/concepts/MOON-LRO-SCIENCE-CHECKLIST.md` rev 28** (Project copy `claude/concepts/MOON-LRO-SCIENCE-CHECKLIST.md`): the programme record.
6. `reviews/2026-11-27-moon-crater-release.md` (release record) and `reviews/2026-11-27-moon-crater-release-rc.md` (RC packet).
7. This note.

**The CRaTER trail, in order (all on main):**
1. Proposal `docs/concepts/MOON-CRATER-PROPOSAL.md` rev 2; evidence in `docs/research/moon-crater/` (scripts, outputs, `checkpoints.jsonl`, `bins_preview.py`).
2. `reviews/2026-11-27-moon-crater-proposal-rev1-gpt-review.md` (REVISE BEFORE BUILD, R1–R3).
3. `reviews/2026-11-27-moon-crater-proposal-rev2-gpt-recheck.md` (PASS, build notes 1–4).
4. Preview packet `reviews/2026-11-27-moon-crater-ui-rc.md`, then `reviews/2026-11-27-moon-crater-ui-gpt-review.md` (PASS).
5. RC packet `reviews/2026-11-27-moon-crater-release-rc.md`, then `reviews/2026-11-27-moon-crater-release-rc-gpt-review.md` (PASS).
6. Release record `reviews/2026-11-27-moon-crater-release.md`.
7. Run logs and screenshots: `reviews/evidence/2026-11-27-moon-crater-review-logs.tgz`.

## 3. Live state (27 Nov, 15:55 UTC)

- **main: `af00389`** (release records), then the close-out commit that carries this note. Recheck with `git ls-remote origin main`, because other threads push docs to main.
- **Item 5 release:**

| | |
|---|---|
| Reviewed and approved commit | **`6ed18c3`** (Chad: "Approve: release the CRaTER event-count chart from moon-crater-ui at 6ed18c3 to main, page only; no hub deployment.") |
| Merged / deployed | merge **`ba41c8a`** (14:44:27 UTC commit time) of `6ed18c3` into main `05dc479`, a merge rather than a fast-forward because main held three docs-only commits; GitHub Pages published it at 14:45:27 UTC (`last-modified`) |
| Merge check | tree = `6ed18c3` plus main's three records files; `served_manifest.mjs --check` 54 match |
| Records after it | `f553e99` (records-only merge of branch head `cffec00`: the RC packet), `af00389` (release records) |
| Payload baseline (Animals) | `CR_MAIN` `4927a02`; `CR_PARENT` `67a615c` |
| Served manifest (the comparison in force) | `reviews/evidence/2026-11-27-moon-crater-manifest.json`, **54 files, sha256 `85cca2ad…9cbaf`** |
| Served check | 54/54 at 14:46:44 UTC and again at close-out at 15:47:47 UTC; the expected list was built from the reviewed manifest file |
| Live check (14:47–14:48 UTC) | off by default, with no request; opening fetches the one file; 12:00 selects group 72 (28.96 events a second, equal to the served row); the final slider time selects the labelled extra 11 June group; close and reopen with no second request; the drawing stays usable; Details reaches `sources.html#mooncrater` (the first click showed the pane's cached pre-release copy, `max-age=600`) |
| Rollback | `git revert -m 1 ba41c8a`, on Chad's own Approve line |
| Hub | untouched (0.6.25); no Moon work has touched it |

- **Earlier Moon releases** (all page only; their manifests are kept as records):
  - height `d6a26b6` / `afb42d5`;
  - temperature `0622e80` / `310ca1e`;
  - LROC `8e7d262` / `40e0f86`;
  - Sky zoom-out picture `1280c0d`.
- **Animals suite pins** (`phase1/animals-tab-ui.test.cjs`, 304 checks):
  - `CR_MAIN` holds `moon.html` and `sources.html` (13e, 13aa, 13ab).
  - `SK_MAIN`, `LR_MAIN`, `DV_MAIN`, `MH_MAIN` and earlier are the baselines behind it.
  - **Any later edit to `index.html`, `skyscene.js`, `sources.html`, `moon.html`, `moonglobe.js` or `craft.js` needs a narrow pin-maintenance commit and an Animals rerun.** The maintenance commit's parent is the payload commit, and it touches this suite only.
  - `moon-diviner-ui` H holds the literal Sources shortcut chain: maintain it too when a shortcut is added.

## 4. Moon checklist status (rev 28)

| # | Item | Status |
|---|---|---|
| 1 | Existing appearance, orientation, polar disclosure, lighting, dated LRO path | **done: preserved** |
| 2 | LOLA height | **done: released and closed** |
| 3 | Diviner temperature | **done: released and closed** |
| 4 | LROC regional imagery (Apollo 11) | **done: released and closed**; other sites only if Chad asks |
| **5** | **CRaTER radiation** | **done: released and closed** (merge `ba41c8a`) |
| 6 | LEND neutron / hydrogen | **to assess** |
| 7 | LAMP far-ultraviolet | **to assess** |
| 8 | Mini-RF radar | **to assess** |
| 9 | Science/trajectory pairing, footprints | only inside the item it serves (CRaTER pairing assessed; nothing drawn) |
| 10a | Sky zoom-out Moon picture | **done: released and closed** |
| 10b | Tides Moon | closed decision: unchanged |
| 11 | Verification limits | open record, carried with every item |
| 12a–c | Higher-resolution LOLA, individual LOLA returns, terrain displacement | options for Chad to classify ("assess" or "not pursued", with a reason) |
| 13 | Current LRO prediction or position | outside scope |

**To close the Moon spec:**
- 6, 7 and 8 each need an outcome: released, or parked or not pursued with a reason and a revisit condition.
- Chad classifies 12a–c.
- 11 is summarised at close-out.
- Chad accepts the close-out.

Claude's suggested order (a suggestion only): LEND (6), LAMP (7), Mini-RF (8), then 12a–c, then the Moon close-out record.

**Every item goes through these steps:**
1. Bounded assessment and proposal, docs only, with a checkpoint per acquired file.
2. GPT review.
3. Chad's go.
4. Branch build.
5. GPT review.
6. Release candidate (Sources, REGISTER, narrow Animals pins, served manifest, final affected validation).
7. Chad's own Approve line.
8. Merge, served check from the reviewed manifest, live check.
9. Records, cleanup and checklist.

**Rules:**
- "Not yet assessed" is never "infeasible".
- An item is parked only with a reason and a revisit condition.
- A bulk acquisition needs its own go.

## 5. Decisions already made (item 5)

- **D1–D5 and D7 accepted by Chad** (proposal rev 2):
  - the historical chart, R1: `GOOD` counts for 10 June 2026 in 10-minute groups by UTC record time `[start, end)`, plus the labelled extra 11 June 00:00–00:10 group (145 groups);
  - the rate is N/600 s with no live-time correction;
  - a group is shown only with 600 nominal records, otherwise withheld (D7);
  - bars are an approximate one-sigma Poisson counting benchmark √N/T, not a total uncertainty;
  - off by default, inside the dated-example drawing, following its slider (only for the `craft-moon-2026-06-R1` example);
  - the data file is sha256-pinned and validated whole, with a 10 s deadline and late answers dropped.
- **Not shown, with revisit conditions:**
  - a computed dose (R3): needs its own reading, resolution of the flag question and a bulk acquisition;
  - path colouring: the per-minute variation is near counting noise;
  - the 0.18–0.20 s tag offset: a diagnostic hypothesis only, never applied.
- **Archive observations recorded, not resolved:**
  - a suspected flag label/column inconsistency in L2 PRI (not confirmed);
  - no L2 housekeeping found where listed for 2026.
- **Records correction:** the bundle identifier is `urn:nasa:pds:lro-crater` (bundle XML), not the Readme's `lro.crater`.

## 6. Unresolved findings and testing limits (carried)

- **Not verified, for any Moon feature:** a real phone, Safari, a screen reader, a hardware renderer. For CRaTER, no chart performance measurement was made or claimed. Failure paths are covered by the suite only.
- **Cause not determined:** the 10 June 12:40–13:10 UTC rise of 8–10% in counts.
- **Baseline exceptions on main** (identical on main at `67a615c`; not caused by Moon work):
  - `timeline-mixed-assets` 16/2;
  - `kept-ui` 18/3;
  - `ux-round1` 33/1;
  - `osmc-reliability-ui` 40/1;
  - `smoke-fixes`, unresolved and not run for the CRaTER candidate.
- **`tides-ui` T1a** fails on any feature branch by design.
- **Load-sensitive suites:**
  - `night-lights-ui` (one load timeout in a serial run; 152/0 alone);
  - `fire-status-ui`;
  - `moon-height-ui` draw count;
  - `moon-lro-path`;
  - one `moon-lit` timing check.
- **Suite sizes:**
  - `moon-crater-ui` 51 (11 breaks), builder tests 28;
  - `animals-tab-ui` 304;
  - `moon-diviner-ui` 178, `moon-lroc-ui` 78, `moon-height-ui` 110;
  - `sky-moon-texture-ui` 197;
  - `tides-nav` 2,882.

## 7. Access, tools and surfaces

**Chad's authorization (27 Nov, carry it forward):** "You have my explicit authorization to use the Mac files and folders, Chrome extension, browser pane, GitHub and Cloudflare as needed for this project, including creating, editing and deleting within the agreed scope."
- It does **not** authorize an unapproved production release or unrelated changes.
- Production still needs his Approve line naming the exact candidate commit.

**Discover before assuming access is missing.** At the start, check the tool list (including deferred tools, via ToolSearch) and the browser surfaces. GitHub and Cloudflare are usually already signed in, in the browser pane.

| Surface | How | Notes |
|---|---|---|
| Repo (push) | `add_repo` (owner TheOneTheOnlyTheChad, repo mother-earth, access push), clone to `/home/claude/mother-earth`, `register_repo_root` | Pushing commits works. **Fetch with `--depth=400` or more** (a shallow fetch breaks the Animals checks; `osmc-reliability-ui` needs about 1000). **`git push --delete` and GitHub API writes do not work through the proxy:** delete branches on the GitHub branches page in the browser pane (the row's "Delete branch" button). |
| Mac folders | device bridge: `~/Documents/Mother Earth` → `$HOME/mnt/Documents--Mother Earth`; `~/Documents/ChatGPT/Mother Earth` → `$HOME/mnt/ChatGPT--Mother Earth`; `~/Downloads` → `$HOME/mnt/Downloads` | They may not be connected at the start of a new session: ask once with `device_request_folder_access` (Chad approves the prompt). The Mac folder is a plain mirror, not git. `rm` is blocked: move to `_to_delete/`. Use `tar --overwrite` to replace files. Send binaries as tars and verify the hashes on the Mac. |
| Browser pane (preferred browser) | `mcp__remote-devices__Claude_Browser__*` | Signed in to GitHub and Cloudflare. Reaches the live site, GitHub and PDS (the container cannot reach PDS or UNH). Run the served check from a tab on the live site, and front the tab before checking anything drawn per frame. |
| Chrome extension | `mcp__claude-in-chrome__*` | Was connected ("Browser 1", macOS); not needed this thread. |
| Cloudflare | browser pane (signed in); read-only connector `Cloudflare_Developer_Platform` (Worker `mother-earth`, hub 0.6.25) | Not used this thread. |
| Computer use | `computer_resolve_access` / `computer_request_access` (Finder granted on 27 Nov) | The only route to the Mac's recoverable Trash. **Blocked while Chad is in a full-screen Space** (it was again at close-out). |
| Claude Science | `mcp__plugin_claude-science_code__submit` | Used for analysis runs (bash kernel). |
| Project | `Projects` tool | The knowledge base is nearly full: upload compact docs only. The repo is authoritative. Large docs go as `content`, followed by a `project_read` check. |

- **Session-specific items to renew in a new thread:** the repo attachment (`add_repo` with push), the three Mac folder connections, and the Finder grant if the Trash is needed.
- **Secrets** live in `KEYS.md`: never type, print or paste them.
- **Actual blockers:** none for docs-only assessment. The Trash step needs Chad on a normal desktop Space, or Chad moving the folders himself.

## 8. Cleanup state at handover

- **Branches:**
  - Deleted on GitHub and locally: `moon-crater-ui`, after verification, when it was fully contained in main.
  - **Left on GitHub: 7 branches from other workstreams**, each with unique commits (counts are commits ahead of main): `animals-assessment-rc` (22), `cape-town-public-proposal` (1), `cape-town-station-rc` (10), `earth-from-space-fixtures-rc` (7), `earth-from-space-rc` (73), `earth-from-space-stage-d-docs-r2` (1), `widths-preview-rc` (3).
  - Local: `main` only; worktrees removed.
- **Mac mirror:** main's 22 changed files were synced preserve-first after the release. 9 existing copies are in `_sync-preserved/2026-11-27-crater-release/`, with earlier ones in `…-crater-rc/`. The close-out commit's files are synced the same way.
- **Retained, verified at close-out:** `_source-data/moon-lro-science-crater/` (four files that match the repo checkpoints by sha256, plus `checkpoints.jsonl`). The LROC, Diviner and LOLA source data are as recorded. The run logs are in the repo (`reviews/evidence/2026-11-27-moon-crater-review-logs.tgz`).
- **Staged for the Trash** (Finder was blocked by the full-screen Space; Chad moves these to the Trash himself and empties it when he chooses):
  - `~/Documents/Mother Earth/_to_delete/moon-programme-to-trash-20261127/` (196 MB): the CRaTER review copies and transfer tars, plus the Moon programme's earlier staged close-out folders (10a, LROC, Diviner, height).
  - `~/Downloads/_to_delete-moon-20261127/` (175 MB): the Downloads copies of the CRaTER, Diviner and LROC sources. Each was hash-matched to its retained original; the one extra, `RDRSIS-second-save-1602.PDF`, is byte-identical to the retained `RDRSIS.PDF`.
- **Other workstreams' items in `_to_delete/`** (Animals, Earth from Space, Timeline and others) were left as found.
- **Container:** transfer tars, temporary logs and worktrees removed. `/home/claude/spike` (test set-up) is disposable.

## 9. Test setup in a fresh container (only when a task needs it)

- `/home/claude/spike`: `npm i globe.gl@2.45.0 playwright-core pngjs @fontsource/ibm-plex-mono@5 @fontsource/barlow-condensed@5 astronomy-engine satellite.js@6.0.2`.
- Playwright shim at `/home/claude/node_modules/playwright/index.js` (launches `/usr/bin/google-chrome`).
- `NODE_PATH=/home/claude/node_modules:/home/claude/spike/node_modules`.
- Page server `python3 -m http.server 8899 --bind 127.0.0.1`, run from a frozen worktree of the tree under test. `osmc-reliability-ui` uses its own ports 8898/8897, so put a main comparison's page server on 8896.
- Suite requirements:
  - `moon-height-ui` needs `LOLA_SRC` (staged LOLA sources).
  - `animals-tab-ui` needs deep history.
  - `mobile-pass` needs `/home/claude/fixtures/orbital.csv`.
- Breaks: `BREAK=<name>` (each suite lists its own; a missing pattern stops the suite).

## 10. Next agreed action and its boundaries

1. Read in (section 2).
2. Attach the repo with push, clone, `git fetch --depth=400`, and confirm main and a clean tree.
3. Run `node phase1/moonsci/served_manifest.mjs --check` (quick and local; expect **54 files**).
4. Check tools and access (section 7) and connect the Mac folders.
5. Report to Chad that you are oriented, with current main.
6. Wait for Chad to name the next Moon item (6 LEND, 7 LAMP or 8 Mini-RF) or to classify 12a–c. For that one item: a bounded assessment and proposal, docs only, for GPT's review.
7. No build, bulk download, merge or deployment until Chad's go, and later his own Approve line naming the exact commit.

## 11. Talking to Chad

- SAST times, call him "bro", bottom line first, no apologies.
- Say up front when he's needed at the screen (for example the Mac folder prompt, or a normal desktop Space for Finder).
- Times in records come from a real clock or are labelled "commit time".
