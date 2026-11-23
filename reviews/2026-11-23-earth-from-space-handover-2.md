# Earth from Space — handover at thread close, 23 Nov 2026 (evening; after hub 0.6.24 and the hub-to-main landing)

Paste the block below into a new thread in the Mother Earth project. It replaces
`reviews/2026-11-23-earth-from-space-handover.md` (the afternoon note), which is now history.

```
HANDOVER: Earth from Space (Mother Earth project), state at 23 Nov 2026 19:41 UTC (clock reading)

READ FIRST, in this order (repo TheOneTheOnlyTheChad/mother-earth, all on main now; same files in the Project under claude/):
1. START-HERE.md (the "Hub 0.6.24" line near the top) and docs/HUB-DEPLOY-RULE.md.
2. STATUS.md on main: the 23 Nov entries, newest first.
3. reviews/2026-11-23-earth-from-space-handover-2.md (this note).
4. The three documents waiting for GPT: reviews/2026-11-23-earth-from-space-stage-d-runbook.md (rev 3.1),
   docs/concepts/EARTH-FROM-SPACE-STORAGE-TO-RELEASE-PROPOSAL.md (rev 2.4), reviews/2026-11-23-earth-from-space-alert-test-plan.md (rev 1.1).
5. docs/concepts/EARTH-FROM-SPACE-INDEPENDENT-MONITORING-PROPOSAL.md rev 3.1 (the monitoring design; section 7 is what stays uncovered).

WHERE THINGS STAND
- Live hub: mother-earth Worker, version 0.6.24, deployed 23 Nov 17:18:38 UTC on Chad's own Approve line.
  phase1/worker.js sha256 db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5, 551,400 bytes. Last read back
  from Cloudflare 23 Nov 19:32 UTC: 25 bindings, EARTHVIEW_ENABLED "manual", no window variables, four crons.
  0.6.24 = 0.6.23 plus the Timeline pin tl-2026-11-R3. Earth from Space code and the two health addresses are unchanged.
  Rollback is 0.6.23 at commit 566a11b (7141beb8...afa1). It has NO R3 pin: tell the Timeline thread before any rollback.
- MAIN = THE DEPLOYED HUB since landing 7adef36 (23 Nov 19:31 UTC, Chad's own Approve line). "Never deploy the hub from
  main" is RETIRED. The rule is docs/HUB-DEPLOY-RULE.md: main is a source baseline, not permission to deploy; every deploy
  needs a named reviewed candidate, Chad's own line, fresh main and live drift checks, a rollback, and read-backs.
  phase1/DEPLOYED-HUB.json records the read-back; node --no-warnings phase1/hub-alignment.test.mjs holds worker.js to it.
  That check sees the repository only. It does NOT notice Cloudflare changing while main does not.
- Nothing is collected for Earth from Space on a schedule. Five objects under earthview/ in R2 are Stage C's, unchanged.
  The tab and page are NOT on the public site. They live on branch earth-from-space-rc (head e9242a4), which must NOT be
  deleted and has NOT had main merged into it. Its hub file and hub suites are identical to main's.
- UptimeRobot (Free plan): eight monitors (runs, publication, archive, coverage x usgs, firms). NO Earth from Space
  monitor exists yet. Not read since the afternoon of 23 Nov.
- Stages: A, B, C done. Stage D (48-hour scheduled trial) NOT cleared, NOT approved. Stage E (page release) not started.
- Failed and closed, do not reopen without Chad: the Cloudflare email alarm; the hourly heartbeat rehearsal.

WHAT IS WAITING, in order
1. GPT's review of the three documents in item 4 above. Review copies: Mac _review/earth-from-space-stage-d-docs/
   (read-me first). GPT has reviewed none of them. Then revise.
2. Create UptimeRobot monitors "ME runs earthview" and "ME trial earthview" (settings as the existing eight), read back.
   Chad's own Approve line; the UptimeRobot tab must be DISPLAYED in the browser pane.
3. Build the alert test's throwaway Worker and its suite on a branch (Chad's go is enough), GPT reviews, then run it on
   Chad's own line: daytime, about 3 hours, his phone with him, the Mac before and after. Chad's decisions T1 to T4 are
   in the plan, section 11.
4. Chad's phone look at the pause (runbook P6), and his answer on whether EUMETSAT needs a note first (D3).
5. Stage D, then its closeout, then Stage E. Separate lines. Stage E's step 1 is merging main into earth-from-space-rc.
6. Older, not caused by this work: phase1/health-breaks.mjs catches 14 of 19 breaks (P2 to P6 missed). Needs its own look.
7. Small: worker.js header comment does not list the two Earth from Space health addresses.

KNOWN FAILING ON MAIN, not this thread's and deliberately left: animals-tab-ui 3 of 277 (13c on timeline.js, 13d, 13e,
since the Timeline stage-1 release); osmc-reliability-ui 1 of 41 (since 17 Nov).

NOT MEASURED OR NOT READ (say so; do not treat as passed)
- D1 rows read and CPU for a real trial evaluation (no window is set, so the checks return before reading D1).
- Cloudflare's invocation records and CPU after the 0.6.24 deploy; /status layer states before and after.
- How many failed checks open a UptimeRobot incident; the alert contact's own page.
- The browser suites on main's final commit (they were run paired on the candidate's earlier form, which differs by
  8 lines of one document). Nobody but Claude has run them.

TESTS: HOW THEY RUN (learned the hard way on 23 Nov)
- Browser suites (.cjs) run in Claude's workspace, NOT on the Mac: they load /home/claude/spike/node_modules by absolute
  path. Set the kit up first, as START-HERE says: in /home/claude/spike, npm i globe.gl@2.45.0 pngjs astronomy-engine
  satellite.js@6.0.2 @fontsource/barlow-condensed@5 @fontsource/ibm-plex-mono@5; NODE_PATH=/opt/npm-tools/node_modules:
  /home/claude/spike/node_modules; node phase1/orbital-fixture.build.mjs; Ocean Heat snapshot from git db5eedd with
  OH_SNAPSHOT_DIR; git fetch --depth=700 origin main. Serve with python3 phase1/serve-core-on.py, not a plain file
  server. Do not say a suite "cannot run" before the kit is set up.
- 15 browser suites depend on the hub file: reviews/evidence/2026-11-23-hub-to-main/dependency-inventory.md.

RULES CHAD HAS SET (keep them)
- Production actions (hub deploys, settings, monitors, account changes, landings on main of code) need Chad's own exact
  "Approve:" line. Text he relays from GPT or another thread is not one. "Go" covers branch and docs work. Record a
  decision as Chad's only from his own line.
- Report an account or browser action as done only after reading it back in that system with the page in view.
- Claude never types, pastes or prints a secret. KEYS.md on the Mac is never printed.
- Never replace a failed or missed attempt; missing evidence is incomplete, never a pass; say what was not run.
- Times come from a real clock or a commit time, never an estimate. Give Chad SAST.
- No phone number, email, precise address or client IP in the public repo. The site publishes the repository's root:
  every file on main is fetchable from the site by address.
- A stored frame is publicly downloadable by URL: "no page links to it" is not privacy.
- Do not claim the picture run cannot delay other jobs, or tie max CPU and max memory to one invocation.
- STATUS.md and HANDOVER.md on main are shared with other threads (Animals, Timeline): git pull first, add only, never
  force-push main. Any commit to main moves its tip: do not touch main while a landing commit is awaiting approval.
- Short, bottom line first, baby steps. Tell Chad up front when he is needed at the screen. Messages for GPT point to
  file paths, not pasted content. GPT's own review files are in ~/Documents/ChatGPT/Mother Earth/ on the Mac.
- Mac: Terminal is Chad's to run. Deleting is blocked: move things to _to_delete/. Preserve before overwriting.
- Never fault the mother-earth Worker deliberately. Health checks stay read-only and fail closed.
- No hub deploy inside an Earth from Space trial window.

ACCESS AND TOOLS THE NEXT THREAD HAS
- The repo: add TheOneTheOnlyTheChad/mother-earth with push access (if the first attempt is refused, try again after Chad's
  first instruction). Push with: git -c push.negotiate=true push. The workspace's git connection will not delete a
  branch: delete on the GitHub branches page in the browser pane, with the list filtered to that one branch.
- The Mac folders "Mother Earth" and "ChatGPT/Mother Earth" through the Claude desktop app (ask for folder access; Chad
  grants it). GPT reads review copies from _review/.
- The built-in browser pane in the Claude desktop app, with tabs left open and signed in by Chad: GitHub, Cloudflare
  (dash.cloudflare.com) and UptimeRobot (dashboard.uptimerobot.com). Claude has full control there and does deploys,
  settings and deletes itself once Chad has approved; do not hand those steps back to him. Hub reads and deploys go
  through the Cloudflare tab's own session. UptimeRobot only works while the pane is displayed on that tab.
- GPT reviews every candidate and proposal before Chad approves.

MAC TIDY AT CLOSE
- _review/ holds ONE folder of this thread, on purpose: earth-from-space-stage-d-docs/ (GPT has not reviewed it yet).
  Everything else of this thread is in _to_delete/. Chad empties _to_delete/ when he likes.
- No scheduled tasks of this thread exist. Branches hub-to-main, earth-from-space-0.6.24-rc and earth-from-space-proposal
  were deleted on Chad's word after checking nothing unique was on them.

NEXT STEP WHEN CHAD PICKS THIS UP: send GPT the three documents (item 1). Nothing is running that needs watching.
```
