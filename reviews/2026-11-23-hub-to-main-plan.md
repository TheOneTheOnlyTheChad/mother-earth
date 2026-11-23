# Bringing main level with the deployed hub: plan rev 1 (23 Nov 2026, 17:47 UTC clock reading)

Asked for by Chad through the Timeline thread. **Docs only. Nothing is merged, deleted or changed.** For GPT's
review, then Chad's own Approve line.

## 0. In short

- **Not a merge of `earth-from-space-rc`.** That branch also carries the Earth from Space tab and page
  (`space.html`, `space.js`, and edits to `index.html`, `style.css`, `sources.html`, `moon.html`, `sun.html`,
  `timeline.html`, `timeline.js`, `craft.js`). Merging it would publish the tab. That is Stage E, and Stage D is
  not cleared.
- **Instead: one commit on main that copies the hub files, and only those, from the branch.** No page file is
  touched, so the served site does not change.
- Afterwards main's `phase1/worker.js` is the deployed file byte for byte, and the rule "never deploy from main"
  can be retired.

## 1. Where things stand (read 23 Nov, about 17:45 UTC)

| | |
|---|---|
| Live hub | 0.6.24, `phase1/worker.js` sha256 `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5`, 551,400 bytes (read back from Cloudflare 17:18:57 UTC) |
| `earth-from-space-rc` | head `e9242a4`; its `phase1/worker.js` is that file |
| main | `phase1/worker.js` is 0.6.19 (`eb5b1de9…`). **Main has not changed that file since the branch left it** (21 Nov, `7cc18c8`), so replacing it loses nothing |
| Distance | the branch is 73 commits ahead of main and 239 behind |
| `phase1/schema.sql` | not changed by the branch. No database change is involved |

## 2. What the commit carries

**From `earth-from-space-rc`, copied as they are:**

| Group | Files | Why |
|---|---|---|
| The hub | `phase1/worker.js` | the point |
| Hub suites the hub file needs | `phase1/earthview-hub`, `-gate`, `-health`, `-probe`, `-admin`, `-stage-b-call` test files; `earthview-health-breaks.mjs`; `evprobe.test.mjs` | without them main would hold hub code with no tests |
| What those suites load | `phase1/earthview-fixtures/` (3.8 MB of test pictures and their source note), `evprobe.js`, `evprobe.build.mjs`, `evprobe.driver.js`, `evprobe.report.mjs`, `evprobe.wrangler.jsonc`, `earthview-admin.sh`, `earthview-stage-b-call.sh`, `earthview-decoder-measure.mjs` | |
| Existing hub suites that name the version or the health list | `phase1/health-hub`, `history-hub`, `sunface-hub`, `wind-hub` test files. Main has not changed any of them since 21 Nov | they would fail against 0.6.24 otherwise |
| Timeline hub test | `phase1/timeline-catalogue-hub.test.mjs` in its 0.6.24 form (the Timeline thread's own patch) | main's copy after the Timeline merge expects a Worker without the R3 pin |
| Records | every file under `docs/` and `reviews/` that the branch added (about 146, all new paths), and the two that exist only on `earth-from-space-proposal` (`docs/concepts/EARTH-FROM-SPACE-PROPOSAL.md`, `reviews/evidence/2026-11-19-earth-from-space/source-check.json`) | so the history of the deployed code is on main, and the old branches can go |

`phase1/timeline/catalogue/tl-2026-11-R3.json` arrives with the Timeline merge. It is checked to be the same bytes
(`f1a5fab2…0993`) and not copied again.

**Left on the branch, on purpose (the unreleased page):** `space.html`, `space.js`; the branch's edits to
`index.html`, `style.css`, `sources.html`, `moon.html`, `sun.html`, `timeline.html`, `timeline.js`, `craft.js`;
`phase1/earthview-ui.test.cjs`, `earthview-preview.mjs`, `earthview-static-preview.mjs`; the branch's edits to
`phase1/header-tabs.test.cjs`, `desktop-overflow.test.cjs` and `timeline-ui.test.cjs` (they test the tab);
`phase1/alarmtest/worker.js`.

**Not touched on main:** `STATUS.md`, `HANDOVER.md`, `START-HERE.md`, `REGISTER.md` (add-only entries apart),
every page file, every other suite.

## 3. Steps

1. **After the Timeline page merge of 24 Nov**, from a fresh pull of main: branch `hub-to-main`.
2. Copy the files of section 2 from `earth-from-space-rc` by an explicit list (the list goes in the candidate
   record, file by file with hashes). One commit.
3. Checks on that commit (section 4). Record and review copy to GPT.
4. On Chad's own line: main is fast-forwarded to that commit. **Nothing is deployed: the hub already runs this
   file.**
5. Read back (section 4).
6. Docs: HANDOVER and START-HERE lose the "never deploy from main" warning and gain the new rule (section 5).

**If the hub is deployed again before step 4,** the commit is rebuilt from the new deployed file and rechecked.

## 4. How it is shown

**That main's hub file is the deployed file, byte for byte.** Three readings in the same hour, all of which must be
sha256 `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5` and 551,400 bytes:

1. the code Cloudflare is running, read back through the dashboard tab;
2. `phase1/worker.js` at the `hub-to-main` commit;
3. after the landing: `phase1/worker.js` as GitHub serves it from main at the new commit.

And `git diff earth-from-space-rc main -- phase1/worker.js` is empty.

**That the site did not change.** The commit's file list contains no page file: shown by the list itself and by a
check that fails on any path outside `phase1/`, `docs/` and `reviews/`. Served-hash check of every page file before
and after the landing: identical.

**That main still works with the newer hub file.**
- The 47 non-browser suites on the commit, with the count that could not run stated.
- **Main's browser suites: 13 of them load `worker.js`** (counted on the branch's copy of the suites; recounted on main at step 1) and would now run against 0.6.24 where they ran against
  0.6.19. They did not run in Claude's workspace today, on any tree. **Someone must run them on the Mac before the
  line is asked for** (Chad in Terminal, or GPT). This is the one real gap in this plan.
- What changed in the hub between 0.6.19 and 0.6.24, for the reviewer: the Earth from Space collector, gate, window,
  admin routes and probe; the two health addresses; the Timeline R3 pin. The full diff goes in the record.

## 5. After it lands

- **New rule, replacing "never deploy from main":** a hub change is built on a branch cut from main, and is deployed
  only if reversing its diff gives the currently deployed file byte for byte.
- `earth-from-space-rc` is **kept**: it holds the unreleased tab and page for Stage E. Main is merged into it as
  separate branch work (conflicts are expected in the page files, as Stage E's step 1 already says). Its hub file
  and main's are then the same file.
- The Stage D documents and the fixture alert test plan are not affected.

## 6. Branches

| Branch | State | Proposal |
|---|---|---|
| `earth-from-space-0.6.24-rc` | fully contained in `earth-from-space-rc` (checked 23 Nov) | **can be deleted now.** Claude's attempt on 23 Nov was refused by a permission check on Claude's side; nothing was deleted. Chad deletes it, or allows it |
| `earth-from-space-proposal` (19 Nov) | holds two files found nowhere else (section 2) | delete **after** the landing has put those two files on main |
| `hub-to-main` | does not exist yet | delete after the landing |
| `earth-from-space-rc` | the unreleased page | **keep** until Stage E |

## 7. Sketch of the line (not a request)

`Approve: land the hub-to-main commit <commit> on main: phase1/worker.js sha256
db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5 (the deployed hub 0.6.24), its hub suites and the
Earth from Space records, no page file; nothing deployed; read back the three hashes and the served page hashes`

## 8. Questions for GPT

- **Q1.** Is copying the hub files in one commit, in place of a merge, acceptable given that it leaves the two
  histories unjoined until Stage E?
- **Q2.** Is the file split in section 2 right? In particular: the 3.8 MB of test pictures onto main, and leaving
  the three tab-testing suites' edits behind.
- **Q3.** Which browser suites must pass on the Mac before the landing: the 13 that load `worker.js`, or all 45?
- **Q4.** Is the new rule in section 5 enough to retire the old one?

## 9. Not checked while writing this

- Whether the Timeline merge will touch any file in section 2's list other than the two named. Checked at step 1.
- The deployed hub was last read at 17:18:57 UTC; not re-read for this plan.
- Whether any hub suite in the list reads a page file that exists only on the branch. A search of the non-browser
  suites for `space.html` and `space.js` found none; the run at step 3 is the proof.
