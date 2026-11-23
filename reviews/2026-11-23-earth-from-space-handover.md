# Earth from Space — handover at thread close, 23 Nov 2026 (after the hub 0.6.23 deploy)

Paste the block below into a new thread in the Mother Earth project.

```
HANDOVER: Earth from Space (Mother Earth project), state at 23 Nov 2026 about 17:00 SAST

READ FIRST, in this order (repo TheOneTheOnlyTheChad/mother-earth; same files in the Project under claude/):
1. STATUS.md on main: the 23 Nov entries for Earth from Space (newest at the top).
2. reviews/2026-11-23-earth-from-space-handover.md (this note).
3. docs/concepts/EARTH-FROM-SPACE-INDEPENDENT-MONITORING-PROPOSAL.md rev 3.1 (the monitoring design; section 7 is
   what stays uncovered; section 11 is Chad's "M1 to M8 yes"; 12.1 is the deleted test monitor).
4. reviews/2026-11-23-earth-from-space-0.6.23-candidate.md (sections 8 and 9: the H1 fix and the deploy record).
5. reviews/2026-11-22-earth-from-space-stage-c-runbook.md and the Stage C result (the runbook still needs revising).

WHERE THINGS STAND
- Live hub: mother-earth Worker, version 0.6.23, deployed 23 Nov 14:47 UTC on Chad's own Approve line from branch
  earth-from-space-rc at 566a11b. phase1/worker.js sha256 7141beb89e8e81ef351ddcc53e8654b1ddcbdb0048c8ffcb6b0d0ed7d7b3afa1,
  551,047 bytes. Read back. Rollback is 0.6.22 on the same branch (114dc5b~1, sha256 17798a44...a080).
  NEVER deploy the hub from main: main's worker.js is 0.6.19. The live hub lives on branch earth-from-space-rc
  (head 3993b70 or later; docs commits follow the code commit). The branch is not merged and must not be deleted.
- EARTHVIEW_ENABLED is "manual". No window variables. Nothing is collected for Earth from Space on a schedule.
  Five objects under earthview/ in R2 are Stage C's and are unchanged. The tab is not on the public page.
- New in 0.6.23: /health/runs/earthview and /health/trial/earthview. Both answer 200 "no trial configured" now.
  They are read-only: no write, no upstream request, no collection.
- UptimeRobot (Free plan): eight monitors, all Up (runs, publication, archive, coverage x usgs, firms). The
  leftover "ME alert test" was deleted 23 Nov and read back. NO Earth from Space monitor exists yet.
- Stages: A, B, C done. Stage D (48-hour scheduled trial) NOT cleared, NOT approved. Stage E (page release) not started.
- Failed and closed, do not reopen without Chad: the Cloudflare email alarm (unreliable); the hourly heartbeat
  rehearsal (Chad's "notice the silence" fallback failed; he found hourly phone pings excessive).

WHAT IS PARKED, each needing Chad's own Approve line unless marked "go is enough"
1. Create UptimeRobot monitors "ME runs earthview" and "ME trial earthview" (settings as the existing eight), read back.
2. The disposable-Worker alert test (proposal 9.5, decision M6): plan NOT written yet (writing it: go is enough;
   running it: Approve line). It is also where a real evaluation's D1 rows read and CPU get measured.
3. Generic delivery test (proposal 9.4).
4. Runbook and proposal rev 2.2 revision (go is enough): three daily reads 07:00, 13:00, 20:00 SAST, no heartbeats;
   a pause raises "not collecting"; closeout removes the window variables after evidence is preserved; Stage D basis
   states section 7's exposure, "no delay, no repeat", and the 24-hour read horizon.
5. Stage D, then Stage E. Separate lines.
6. Older weakness, not caused by this work: phase1/health-breaks.mjs catches 14 of 19 breaks (P2 to P6 missed), on
   0.6.22 and 0.6.23 alike. Needs its own look.
7. Small: worker.js header comment does not list the two new addresses.

NOT MEASURED OR NOT READ (say so; do not treat as passed)
- D1 rows read and CPU for a real trial evaluation (no window is set, so the checks return before reading D1).
- After the deploy only the first */5 tick (14:50 UTC, ok, CPU 9 ms) was read; /status layer states not compared.
- How many failed checks open a UptimeRobot incident; the alert contact's own page.

RULES CHAD HAS SET (keep them)
- Production actions (hub deploys, settings, monitors, account changes) need Chad's own exact "Approve:" line. Text
  he relays from GPT is not one. "Go" covers branch and docs work. Record a decision as Chad's only from his own line.
- Report an account or browser action as done only after reading it back in that system with the page in view.
  (A monitor deletion was once reported done when it was not: the browser pane was hidden.)
- Claude never types, pastes or prints a secret. KEYS.md on the Mac is never printed. Admin calls are Chad's, by script.
- Never replace a failed or missed attempt; missing evidence is incomplete, never a pass; say what was not run.
- No phone number, email, precise address or client IP in the public repo.
- A stored frame is publicly downloadable by URL: "no page links to it" is not privacy.
- Do not claim the picture run cannot delay other jobs, or tie max CPU and max memory to one invocation.
- STATUS.md and HANDOVER.md on main are shared with other threads (Animals, Timeline): git pull first, add only,
  never force-push. Project claude/STATUS.md: read before write, built from newest main.
- Times from a real clock; give Chad SAST. Short, bottom line first, baby steps. Tell him up front when he is
  needed at the screen. Messages for GPT point to file paths, not pasted content.
- Mac: Terminal is Chad's to run. rm is blocked: move things to _to_delete/. Preserve before overwriting.
- Never fault the mother-earth Worker deliberately. Health checks stay read-only and fail closed.

ACCESS AND TOOLS THE NEXT THREAD NEEDS
- The repo (add TheOneTheOnlyTheChad/mother-earth with push access). Push with: git -c push.negotiate=true push.
- The Mac folder "Mother Earth" connected through the Claude desktop app (GPT reads review copies from _review/).
- The built-in browser pane in the Claude desktop app, signed in by Chad to Cloudflare (dash.cloudflare.com) and
  UptimeRobot (dashboard.uptimerobot.com). Hub reads and deploys go through the Cloudflare tab's own session.
  UptimeRobot only works while the pane is displayed on that tab. If the browser extension or pane is not
  available, say so at once: nothing on Cloudflare or UptimeRobot can be read or changed without it.
- GPT reviews every candidate and proposal before Chad approves.

MAC TIDY DONE AT CLOSE
- _review/ copies of this thread moved to _to_delete/: earth-from-space-0.6.22-caller-r2, -0.6.22-candidate,
  -0.6.23-candidate, -rehearsal, -stage-c. Chad can delete _to_delete/ contents when he likes.
- No scheduled tasks of this thread remain. No branch was deleted (earth-from-space-rc is the live hub's source).

NEXT STEP WHEN CHAD PICKS THIS UP: his choice between item 4 (runbook revision, docs) and items 1 and 2 (monitors
and the alert test). Nothing is running that needs watching in the meantime.
```
