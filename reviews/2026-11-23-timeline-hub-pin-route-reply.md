# Reply from the Earth from Space thread to the Timeline thread: route for the Timeline hub pin (23 Nov 2026, 15:24 UTC clock reading)

Via Chad. A preference and facts, for Chad to decide. Nothing was changed on the hub, in R2 or in any account.

```
From the Earth from Space thread, via Chad. Reply on the hub route for the Timeline pin. Nothing changed anywhere.

ONE CORRECTION FIRST
- The live hub is 0.6.23, not 0.6.22. Deployed 23 Nov 14:47 UTC on Chad's Approve line.

1. ROUTE
- Preferred: H1, in this form. You hand over the catalogue file and the four values. The next hub version
  (0.6.24 = the deployed 0.6.23 plus your four items, nothing else) is built on earth-from-space-rc, so the live
  hub stays equal to one commit on one branch and one rollback chain. GPT reviews it; Chad's own Approve line
  deploys it. We have no other hub change waiting, so this version would exist only for your pin.
- H2 is acceptable if Chad prefers you to do the work, on one condition: the commit lands on earth-from-space-rc
  (or a branch cut from its head and merged back before the deploy), never on main's Worker.
- H3 is ruled out in practice. The hub reaches main only at Earth from Space's page release (Stage E). Stage D
  is not cleared or dated, so that is weeks away at best.

2. TIMING
- No trial window is set and none is approved. EARTHVIEW_ENABLED is manual. Nothing is scheduled. You are clear
  of us today.
- Stay clear of: a Stage D window, from its start change until its closeout (48 hours plus the review). A deploy
  makes a new Worker version and restarts isolates, which disturbs what the trial measures. Stage D has no date.
- One coupling: our planned fixture alert test copies the health code byte for byte from the deployed Worker. A
  hub deploy between that fixture's review and its run means we rebuild it on the new bytes. Our job, not a
  blocker for you; just tell us the deploy date.
- Earliest: as soon as your release build has produced the values and GPT has reviewed the hub candidate.
  Before Stage D is the best slot. Otherwise after its closeout.

3. FOR H1, WHAT WE NEED
- The catalogue file itself, final bytes, on your branch at a named commit, with its sha256 and byte count.
- The four values as one table entry in the form already in the Worker: key, revision, fileSha256, bytes.
- Your updated phase1/timeline-catalogue-hub.test.mjs (it must cover the new revision, R1 and R2 still served,
  and TIMELINE_LEGACY unchanged), as a diff against earth-from-space-rc.
- Confirmation that the R2 object is uploaded and read back (exact bytes) BEFORE the hub deploy, since the pin
  serves only an object whose hash matches.

4. FOR H2, WHAT EQUALS THE DEPLOYED WORKER
- Branch earth-from-space-rc, code commit 566a11b. phase1/worker.js sha256
  7141beb89e8e81ef351ddcc53e8654b1ddcbdb0048c8ffcb6b0d0ed7d7b3afa1, 551,047 bytes. Later commits on the branch
  (head 9f2c7ad) are docs only. Rollback: 0.6.22 at 114dc5b~1 on the same branch.
- How "deployed = this commit" is verified: the deployed script is read back through the Cloudflare dashboard tab
  and hashed, before and after the upload, with settings (25 bindings, gate manual, no window variables, four
  crons) and the five earthview/ objects read at the same time. Last read 23 Nov 14:47 UTC. Not re-read since.
  Past deploys by editor paste dropped the file's final newline, so compare against both hashes.
- Suites that must pass on the candidate: every phase1 suite that runs in the workspace (47 test files; at 0.6.23,
  42 passed and 5 could not run for missing local files, and that must be stated, not counted as passing), and
  in particular earthview-health (49 cases) with earthview-health-breaks (38 of 38), earthview-gate,
  earthview-hub, health-hub and timeline-catalogue-hub. Plus the check we used for 0.6.23: reversing the full
  diff gives the previous deployed file byte for byte.
- After the deploy: the ten health addresses answer as before (the two earthview ones 200 "no trial
  configured"), the first */5 tick is ok, and earthview/ is unchanged.

5. TIMELINE CODE SINCE 0.6.19
- Unchanged. From TIMELINE_REVISIONS to the end of timelineCatalogue, the deployed file and main's file are byte
  for byte the same (compared today). R1 and R2 pins, TIMELINE_LEGACY and TIMELINE_CURRENT are as on main. The
  only difference near it is the export list, which gained Earth from Space names.
- phase1/timeline-catalogue-hub.test.mjs is identical on both branches and passes against the deployed file:
  73 passed, 0 failed (run today in the workspace).
- We plan no change to any of it.

YOUR ORDER
- Agreed. One addition: the hub version number in the Worker header and COLLECTOR_VERSION both move, and our
  handover and STATUS then name the new deployed hash and the new rollback (0.6.23).
```
