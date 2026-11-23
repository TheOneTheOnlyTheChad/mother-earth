# Hub-to-main: the landing candidate (23 Nov 2026) — NOT LANDED

**Rev 2 of this record, 23 Nov 2026 19:25 UTC (clock reading).** After GPT's review of the candidate, as relayed by
Chad in his own message: GPT accepts the paired workspace evidence and the integration content; one documentation
correction first; then manifest update, rebase onto current main, scope and identity checks rerun, and the exact
final commit presented for Chad's landing approval. Chad: the three existing Animals failures and the known buoy
failure stay outside this landing; no blanket browser rerun is needed for the wording correction.

- **The correction.** `docs/HUB-DEPLOY-RULE.md` said that a deploy not followed by a landing is "made visible"
  because `hub-alignment` "then fails on main". **That was wrong.** The check compares two files in the repository.
  If Cloudflare moves on while main's hub file and the record both stay old, it passes. The rule now says so, in
  condition 8 and under "What this rule does not do". Section 5 below is corrected the same way.
- **Rebased.** The same 126 paths, rebuilt on main `f835415` (main had gained `STATUS.md` and GPT's two reviews
  since `fb30ee9`: three documents, none among the 126).
- **Complete scope of the landing: 135 changed paths. 126 integration paths, plus the nine evidence files of this
  record.** Nothing else.

**Preparation only. Nothing is landed, deployed, deleted or changed in any account.** For GPT's review; Chad's
landing line is asked for only after that.

Owner: the Earth from Space thread, through close-out, on Chad's instruction of 23 Nov ("Please take ownership of
the hub-to-main integration through close-out"). His order: the candidate is prepared from fresh current main
**before** the Timeline page merge; all released page files are preserved.

Basis: `reviews/2026-11-23-hub-to-main-plan.md` rev 2; GPT's two reviews, read in full on the Mac
(`HUB-TO-MAIN-PLAN-REV1-REVIEW-2026-11-23.md` and `HUB-TO-MAIN-REV2-COORDINATION-REVIEW-2026-11-23.md` in GPT's own
folder; rev 1's review had earlier been filed here only as Chad relayed it). Section 9 maps their points.

## 1. The candidate, exactly

| | |
|---|---|
| Branch | `hub-to-main` |
| Content commit (the 126 integration paths) | `bd335df79348921d5da69fc473e1ce77d2c1f1b4` |
| **Final commit, the one a landing line names** | the head of the branch: the content commit plus one commit adding the nine evidence files (this record among them, which is why it cannot print its own id). Named in the review copy's read-me, in `STATUS.md` and in the landing line |
| Built on main | `f8354155b34780f9230c13b85b215a8cd93e6d38` (main's tip, read 23 Nov 19:20 UTC) |
| Earlier form, reviewed by GPT and tested | head `8cddc0f`, content `6d2781c`, on main `fb30ee9`. The final content differs from it by 8 lines of `docs/HUB-DEPLOY-RULE.md` and nothing else |
| Sources | `earth-from-space-rc` `e9242a4aa881`; `earth-from-space-proposal` `7e3ea60cb173`; the branch left main at `7cc18c8` |
| `phase1/worker.js` | sha256 `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5`, 551,400 bytes: the deployed hub 0.6.24 |

**This is a selective copy. `earth-from-space-rc` is not merged and its history is not joined to main.** That branch
keeps the unreleased Earth from Space tab and page.

## 2. What changes on main: 126 integration paths and nine evidence files; 135 in all, and nothing else

`reviews/evidence/2026-11-23-hub-to-main/manifest-final.txt`: 187 rows, each with action, **destination** sha256,
bytes, source sha256 and source.

| Action | Paths | |
|---|---|---|
| add | 117 | new on main |
| replace | 7 | main had the file; the branch's copy is taken whole |
| edit | 2 | changed in the candidate itself |
| identical | 60 | already on main byte for byte. **Not changed** |
| keep-main | 1 | differs on the branch; main's copy kept. **Not changed** |

**The 9 existing files that change**

| Path | Change |
|---|---|
| `phase1/worker.js` | 0.6.19 → the deployed 0.6.24. Main had not touched it since the branch left. Full diff: `reviews/evidence/2026-11-23-hub-to-main/worker-0.6.19-to-0.6.24.diff` (1,937 lines added, 10 removed) |
| `phase1/health-hub.test.mjs`, `history-hub.test.mjs`, `sunface-hub.test.mjs`, `wind-hub.test.mjs` | the branch's copies: the expected version, and the two Earth from Space health addresses in the list of checks. Main had not touched them |
| `phase1/timeline-catalogue-hub.test.mjs` | the branch's copy, which is the Timeline thread's own patch for 0.6.24: R3 current, R1 and R2 still served, and the page assertion that lets the page name another revision than the hub's current one |
| `reviews/2026-11-22-earth-from-space-stage-c-runbook.md` | the branch's copy: main's plus the five-line note of 23 Nov |
| `phase1/animals-tab-ui.test.cjs` | **edited here.** Section 4 |
| `START-HERE.md` | **edited here:** one line added. Section 5 |

**The 117 new files, by kind**

| Kind | Count | |
|---|---|---|
| Hub suites and what they load | 16 | `earthview-hub`, `-gate`, `-health`, `-probe`, `-admin`, `-stage-b-call` and `evprobe` suites; `earthview-health-breaks.mjs`; the two caller scripts; the Stage A probe's five files; `earthview-decoder-measure.mjs` |
| Test pictures and their note | 11 | `phase1/earthview-fixtures/`, 3.8 MB. `SOURCE.md` has one sentence corrected (section 6) |
| The reviewed Timeline catalogue | 1 | `phase1/timeline/catalogue/tl-2026-11-R3.json`, 31,636 bytes, sha256 `f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993`. **An explicit publication component of this candidate** (GPT). The patched hub test reads it. The page is not changed and still names R2 |
| Made in the candidate | 3 | `phase1/hub-alignment.test.mjs`, `phase1/DEPLOYED-HUB.json`, `docs/HUB-DEPLOY-RULE.md` |
| Records | 86 | 4 under `docs/concepts/`, 14 under `reviews/`, 68 under `reviews/evidence/`. Two of them come from `earth-from-space-proposal` and exist nowhere else |

**Left on `earth-from-space-rc`, on purpose (17 paths):** `space.html`, `space.js`; that branch's edits to
`index.html`, `style.css`, `sources.html`, `moon.html`, `sun.html`, `timeline.html`, `timeline.js`, `craft.js`;
`earthview-ui.test.cjs`, `earthview-preview.mjs`, `earthview-static-preview.mjs`; its edits to the `header-tabs`,
`desktop-overflow` and `timeline-ui` suites; `phase1/alarmtest/worker.js`.

**How the commit is held to the manifest.** `reviews/evidence/2026-11-23-hub-to-main/check-manifest.mjs`, run as
`node reviews/evidence/2026-11-23-hub-to-main/check-manifest.mjs f835415` on the candidate: **14 passed, 0 failed on the content commit `bd335df`**, and run again on the final commit after this record was added (result in the review copy's read-me and in `STATUS.md`). It
passes only if the changed-path set equals the manifest's 126 paths plus this record's nine named files; every
one has the manifest's destination hash and size; the 61 unchanged paths are main's byte for byte; nothing is
deleted or renamed; no root file other than `START-HERE.md`, no `.html` or `.css`, no asset, no data file,
`phase1/schema.sql` and the Mac collector are untouched; `phase1/worker.js` is the recorded deployed hub; and the
R3 catalogue is the reviewed file. It is a scope check by exact path and content, not by directory.

## 3. Identity of the hub file

| Reading | When (UTC) | sha256, bytes |
|---|---|---|
| Deployed code, read back from Cloudflare through the dashboard tab | 23 Nov 18:40:59, and again 19:21:16 | `db4f9cdf…1aa5`, 551,400; reports 0.6.24 |
| Settings at that read | | 25 bindings (14 plain, 9 secret, D1, R2); `EARTHVIEW_ENABLED` = `manual`, no window variables; four crons; compatibility date 2026-10-30. Unchanged since the deploy |
| `phase1/worker.js` at the content commit | | `db4f9cdf…1aa5`, 551,400 |
| `earth-from-space-rc` `e9242a4` | | the same file |

**This is preparation evidence. It is read again immediately before the landing, with main's tip**, and the
landing does not proceed on this table.

## 4. The Animals check (decision G-a)

`animals-tab-ui` check 13c compared a list of files, the hub among them, with a pinned earlier main (`0e62083`).

- **Changed:** `'phase1/worker.js'` is removed from that one list, with a dated comment; the check's title no longer
  says "the hub" and points to the new check. **Nothing else in the suite is touched:** every other file in the
  list, and checks 13a, 13b, 13d and 13e, are as they were.
- **What replaces it:** `phase1/hub-alignment.test.mjs` holds `phase1/worker.js` to the hash, byte count and version
  recorded in `phase1/DEPLOYED-HUB.json`. Six checks; five deliberate breaks, each caught. A page branch that changes
  the hub by accident fails it. A hub candidate branch declares itself in the record and is reported as
  "CANDIDATE, NOT deployed". **It reads two local files and contacts nothing: it does not watch Cloudflare.** The
  record is updated by hand at each deploy, from the read-back.
- **The suite is not green, and was not before.** On the baseline it fails three checks, and on the candidate the
  same three:
  - 13c, on `timeline.js` only (the Timeline release changed it);
  - 13d, the stylesheet (the Timeline release again);
  - 13e, `timeline.html`.
  With the unedited check, 13c on the candidate would have listed `phase1/worker.js` as well: the candidate's hub
  file differs from the pinned baseline's, and main's does not (both compared directly). **The three baseline
  failures belong to the Animals and Timeline threads and are not touched here.** They are reported, not fixed.

## 5. Current-state guidance in the candidate

- `docs/HUB-DEPLOY-RULE.md` (new): the rule that replaces "never deploy the hub from main", in nine conditions, and
  the case of landing hub code without deploying. It says main follows a deploy **through a reviewed landing**,
  never by force-push and never as an automatic fast-forward over an intervening change, and that a failed landing
  after a successful deploy is a divergence to resolve. **The alignment check does not detect that case** (rev 2 of
  this record): it sees the repository only. A read-back from Cloudflare is what shows it.
- `START-HERE.md`: one line added above the 0.6.19 line, naming the live hub, the alignment check and the rule.
  The 0.6.19 line stays as history.
- **Not in the candidate:** `STATUS.md` and `HANDOVER.md`. They are shared and move constantly; their entries are
  added at the landing, add-only, as usual.

## 6. Publication

`reviews/evidence/2026-11-23-hub-to-main/publication-review.md`. In short:

- **The site publishes the repository's root** (confirmed by fetching existing `phase1/` and `reviews/` files from
  the site, 18:40 UTC). So landing makes the 117 new files fetchable from the site by address, the test pictures
  included. **The existing page files are unchanged; the repository and the site gain the listed files.**
- Pattern search of every text file in the manifest, and a reading of the account and operational records:
  nothing found that should stay private. What it found is listed there, with the limits of the method.
- The nine picture files match the sha256 values in their `SOURCE.md`. Its sentence "the site does not serve them"
  is corrected.
- The Mac user folder name stays in three historical records, on Chad's decision.
- The copied caller, probe and admin scripts were not run, installed or scheduled.

## 7. Tests

All in Claude's workspace, 23 Nov. **Chad asked for one command to launch on the Mac. That is not what was done,
and the reason is in 7.3. GPT has since accepted the paired workspace evidence** (relayed by Chad).

**What was tested, exactly:** the suites below ran on content commit `6d2781c` built on main `fb30ee9`. The final
content commit `bd335df` differs from that by 8 lines of one document, and its base by three documents. No suite
reads any of those files. Rerun on the final commit: `check-manifest`, `hub-alignment` with its five breaks, and
the eight hub suites that only the candidate has, plus `timeline-catalogue-hub`, `health-hub`, `history-hub`,
`sunface-hub` and `wind-hub` (section 7.5). The browser suites were not rerun, on Chad's word.

### 7.1 Browser suites, paired

`reviews/evidence/2026-11-23-hub-to-main/dependency-inventory.md` names the 15 suites that depend on the hub file
(directly, through a helper, through the hub-built orbital fixture, or as a guard) and the one excluded.
Baseline = main `fb30ee9`; candidate = `6d2781c`. Same machine, same kit, same local server, one after the other.
Results: `suites-browser-paired.txt`; every suite's full log: `browser-logs.tar.gz`.

| Suite | Baseline | Candidate |
|---|---|---|
| `fire-status-ui` | 279 passed, 0 failed | 279 passed, 0 failed |
| `fires-wording-ui` | 35 passed, 0 failed | 35 passed, 0 failed |
| `legend-active-ui` | 548 passed, 0 failed | 548 passed, 0 failed |
| `oceanheat-ui` | 109 passed, 0 failed | 109 passed, 0 failed |
| `place-ui` | 35 passed, 0 failed | 35 passed, 0 failed |
| `quakes-ships-status-ui` | 124 passed, 0 failed | 124 passed, 0 failed |
| `ships-retain-ui` | 42 passed, 0 failed | 42 passed, 0 failed |
| `status-notes-ui` | 17 passed, 0 failed | 17 passed, 0 failed |
| `timeline-changes-ui` | 173 passed, 0 failed | 173 passed, 0 failed |
| `osmc-reliability-ui` | 40 passed, 1 failed | 40 passed, 1 failed |
| `skycraft-ui` | 77 passed, 0 failed | 77 passed, 0 failed |
| `key-drawn-ui` | 70 passed, 0 failed | 70 passed, 0 failed |
| `mobile-pass` | 131 passed, 0 failed | 131 passed, 0 failed |
| `orbital-browser` | 113 passed, 0 failed | 113 passed, 0 failed |
| `animals-tab-ui` | 274 passed, 3 failed | 274 passed, 3 failed |

**No suite differs between the two trees.** Two fail on both:
- `osmc-reliability-ui`, 1 of 41: "old page: no page errors". Known and recorded on main since 17 Nov (the old page
  taken from git throws). Not caused by this candidate; not fixed here.
- `animals-tab-ui`, 3 of 277: section 4.

During these runs the pages tried to reach the live hub's address 12 times and the workspace refused the
connection, on both trees alike; the suites answer the page from local stand-ins.

### 7.2 Non-browser suites

`suites-non-browser.txt`. Baseline main: 40 files: 39 pass; the other is `orbital.test.mjs`, a manual tool that needs a file argument, not a suite. Candidate: 48 files: 47 pass; the same one.
The 40 files both trees have give the same result line on each, except `timeline-catalogue-hub`: 73 → 74 passed (the
patched test). The 8 only on the candidate all pass: `earthview-admin` 109, `earthview-gate` 163, `earthview-health` 49,
`earthview-hub` 309, `earthview-probe` 117, `earthview-stage-b-call` 48, `evprobe` 94, `hub-alignment` 6. (Earlier
today five non-browser suites could not run in this workspace; with the kit and the Ocean Heat snapshot in place
they run and pass on both trees.)

`hub-alignment`: 6 passed; its 5 breaks each fail. `earthview-health-breaks`: 38 of 38 breaks caught on the candidate.

### 7.3 Why not the Mac

The browser suites are written for Claude's workspace. They load `/home/claude/spike/node_modules/…` by absolute
path (globe.gl, fonts), take Playwright from `/opt/npm-tools/node_modules`, and read the orbital fixture from
`/home/claude/fixtures`. `START-HERE.md` documents the kit for a fresh workspace. **On the Mac they stop on the
first of those paths.** A Mac command would have needed either new folders at the Mac's root or edits to 15 suites,
and GPT's review says preparation must not install packages there.

**Claude's earlier statement that these suites "do not run in the workspace" was wrong.** They had not run because
the kit was not set up in this session; with the kit set up as `START-HERE.md` describes, they run. So the paired
run was made here: baseline and candidate, same environment, complete logs.

**What that leaves open, for GPT and Chad to weigh:** the results are Claude's only. Nobody else has run them. If
an independent run is wanted, the workable route is for the suites to be made portable first (their own reviewed
change), not a one-off Mac command.

### 7.4 Not run, said plainly

- The other 29 browser suites, and `wind-ui` (reason in the inventory).
- Any suite on the Mac, on a phone, or by GPT.
- The deliberate breaks of the hub suites other than `earthview-health` and `hub-alignment`.
- Nothing in the Workers runtime. Nothing was deployed, so there is nothing new to read in production.

### 7.5 Rerun on the final commit (23 Nov, after the rebase)

On content commit `bd335df`, Claude's workspace, about 19:27 UTC. Full lines: `suites-non-browser.txt`, last section.

- `check-manifest` against main `f835415`: 14 passed, 0 failed; 126 changed paths, all in the manifest; 61 left as on main.
- `hub-alignment`: 6 passed; its five breaks each fail.
- The thirteen hub suites, all 0 failed: `earthview-admin` 109, `earthview-gate` 163, `earthview-health` 49, `earthview-hub` 309,
  `earthview-probe` 117, `earthview-stage-b-call` 48, `evprobe` 94, `timeline-catalogue-hub` 74, `health-hub` 29,
  `history-hub` 33, `sunface-hub` 171, `wind-hub` 103, and `hub-alignment` itself.
- The deployed hub read back at 19:21:16 UTC: `db4f9cdf…1aa5`, 551,400 bytes, 0.6.24; 25 bindings; `EARTHVIEW_ENABLED` = `manual`,
  no window variables; four crons; compatibility date 2026-10-30.
- **Not rerun:** the 15 browser suites and the other 35 non-browser suites (Chad: no blanket rerun for the wording correction).

## 8. The landing, when it is asked for

In order:

1. GPT reviewed the candidate (accepted, as relayed by Chad). Done.
2. **Immediately before the push:** main's tip is read. If it is still `f835415`, the final commit is pushed as it
   is. If main has only gained documents that touch none of the 135 paths, the candidate is rebased onto it (no
   content change; `check-manifest` rerun against the new base) **and the new final commit is reported before
   anything is pushed.** **If main has changed any of the 126 paths, or any page file the suites depend on, the candidate is
   rebuilt and the affected checks repeated.** The deployed hub is read back again and must still be
   `db4f9cdf…1aa5`.
3. On Chad's own line: main is fast-forwarded to the candidate's head. No force-push. **Nothing is deployed.** A
   push to main triggers a site build; no page file is in it.
4. Read back: main's `phase1/worker.js` as GitHub serves it, the deployed code, and the commit's file, all one
   hash. Served-hash check of every page file against the hashes taken before: identical. One new file fetched
   from the site to confirm it is served.
5. `STATUS.md` and `HANDOVER.md` entries; the Timeline thread is told main's new tip so it can integrate before its
   own release.
6. Afterwards, each on its own word: `earth-from-space-proposal` and `hub-to-main` deleted; main merged into
   `earth-from-space-rc` as reviewed branch work.

The line (the final commit's id is in the review copy's read-me and in Claude's message to Chad):

`Approve: land hub-to-main <final commit> on main by fast-forward: 135 changed paths, being the 126 integration
paths of manifest-final.txt and the nine evidence files; phase1/worker.js sha256
db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5 (the deployed hub 0.6.24); no page file; nothing
deployed; read back the three hashes and the served page hashes`

## 9. GPT's points and where they went

| Point | Where |
|---|---|
| Rev 1 review, Q1: source commit, destination base, each path's source and hash, add or replace; provenance note; one exact reviewed commit | Sections 1 and 2; the manifest |
| Q1: recheck deployed and main drift immediately before landing; never overwrite or force-push; rebuild if main advanced | Section 8 steps 2 and 3 |
| Q1: keep `earth-from-space-rc`; later merge of main into it favours released behaviour | Section 8 step 6; not part of this candidate |
| Q2: do not pre-certify the records; review the explicit list | `publication-review.md`; section 6 |
| Q2: the directory guard is insufficient; changed-path set must equal the manifest; compare bytes | `check-manifest.mjs`; section 2 |
| Q2: fixtures with provenance; verify against its hashes | Section 6: nine of nine match |
| Q2: do not claim the site cannot change; say what is unchanged and what is gained; inspect the publishing | Section 6; `publication-review.md` (the site serves the repository root, confirmed by fetch) |
| Q2: preserve main's `header-tabs`, `desktop-overflow`, `timeline-ui`; do not import the page to make a test pass | Section 2, "left on the branch". No copied suite needed the page: all pass without it |
| Q2: `schema.sql` unchanged; R3 exact; main changes not lost; helpers copied, not run | `check-manifest.mjs`; section 2 (main had not touched the replaced files); section 6 |
| Q3: named dependency inventory with transitive loads and guards, on the actual base | `dependency-inventory.md`: 15 run, 1 excluded |
| Q3: a prebuilt fixture may need regenerating | The orbital fixture was rebuilt in each tree; identical output; `orbital-browser` added to the run |
| Q3: `timeline-changes-ui` in its final form on the chosen base | Run as main has it (it asks for R2 by name): 173 pass on both trees |
| Q3: a historical baseline assertion may legitimately fail; do not delete or rebase blindly; focused, reviewed migration | Section 4 |
| Q3: matched baseline; diagnose baseline failures; not a pass | Section 7.1 |
| Q3: keep the non-browser comparison with not-run counts | Section 7.2 |
| Q3: Mac execution is a pre-approval requirement; establish the runner's capability first | **Not met as written.** Section 7.3 says why and what was done instead. GPT's and Chad's call |
| Q4: the replacement rule | `docs/HUB-DEPLOY-RULE.md`; section 5 |
| Q4: keep the old warning until live and landed main agree; put the rule in the candidate | The rule and the `START-HERE.md` line are in the candidate and take effect only when it lands |
| Branch deletion is a separate explicit action | Section 8 step 6. One branch was deleted earlier on Chad's own word (plan rev 2, section 8) |
| Rev 2 review: build before the Timeline merge, from current main; include R3 as an explicit component | Done: sections 1 and 2 |
| Rev 2: final destination hashes; represent keep-main, the SOURCE.md edit and the Animals edit accurately; list current-state doc edits | The manifest's actions and notes; section 2 |
| Rev 2: review operational records beyond the pattern scan | `publication-review.md`, "read" table |
| Rev 2: "main follows at once" must not force-push or fast-forward unreviewed changes; a failed landing is a divergence | `docs/HUB-DEPLOY-RULE.md` condition 8 |
| Rev 2: record the approval and action boundaries | Top of this file; section 8 |
| Rev 2: the runner must not install packages, deploy, contact providers or run collectors | Nothing was installed on the Mac. In the workspace the documented test kit was installed (npm packages in a scratch folder); nothing was deployed and no provider or collector was contacted |

## 10. Decided (rev 2)

| # | Question | Outcome |
|---|---|---|
| L1 | Accept the paired browser run made in Claude's workspace in place of a Mac run (7.3)? | **Accepted by GPT, relayed by Chad, 23 Nov** |
| L2 | The three Animals checks that fail on main today (13c on `timeline.js`, 13d, 13e), and the known buoy-reliability failure | **Chad, 23 Nov: outside this landing.** They stay as they are |
