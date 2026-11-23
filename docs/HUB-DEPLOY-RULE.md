# Deploying the hub: the standing rule (from the hub-to-main alignment, 23 Nov 2026)

**This replaces "never deploy the hub from main".** That warning existed because main's `phase1/worker.js` was
several versions behind the live hub from 21 to 23 Nov 2026. From the commit that adds this file, main's
`phase1/worker.js` is the deployed hub byte for byte (`phase1/DEPLOYED-HUB.json`; checked by
`phase1/hub-alignment.test.mjs`).

**Main is a source baseline. It is not permission to deploy.** Nothing here authorises a deploy, a landing, a
settings change or a deletion: each needs Chad's own Approve line at the time.

## A hub deploy happens only when all of these hold and are recorded

1. **A named candidate.** A branch cut from current main at a recorded commit. Its commit, its `phase1/worker.js`
   sha256 and byte count, and the complete diff from the deployed file. GPT reviewed that exact commit.
   `phase1/DEPLOYED-HUB.json` on the branch carries a `candidate` entry naming it and the deployed hash it is
   built on.
2. **Chad's own Approve line** quoting that commit and hash, and saying what changes besides code and what does not.
3. **Main has not drifted.** At deploy time, main's `phase1/worker.js` is still the file the candidate was built
   on. If main has moved in any file the candidate touches, the candidate is rebuilt on the new main and the
   affected checks repeated. Main is never overwritten and never force-pushed.
4. **Live has not drifted.** Immediately before the upload, the deployed code is read back from Cloudflare and
   equals the recorded deployed hash; reversing the candidate's diff gives that file byte for byte. This is
   necessary and not sufficient.
5. **Settings and data, stated in the packet:** bindings by name and type, variables, crons, the compatibility
   date, the D1 schema, and the form of every stored object the new code reads or writes. Anything that must
   change is its own approved step, with its order relative to the code.
6. **Rollback, written before the deploy:** the previous file and its hash; the conditions that trigger a
   rollback; what a code rollback does not undo (settings, stored data, a page already released against the new
   hub); who does it.
7. **Verification, listed beforehand and recorded afterwards:** code hash, bindings, variables, crons; the health
   addresses; the first scheduled runs; the change's own live checks. What was not read is said.
8. **Main follows, through a reviewed landing.** After the deploy, the deployed commit is landed on main and
   `phase1/DEPLOYED-HUB.json` is updated to the read-back (the `candidate` entry becomes `deployed`). The landing
   is a fast-forward only when main has not moved; otherwise the intervening change is reconciled and the exact
   landing delta reviewed. **A landing that fails after a successful deploy is a recorded divergence to resolve
   at once. This rule does not prevent it, and `hub-alignment` does not detect it.** That check compares two files
   in the repository. While main still holds the old hub file and the old record, it passes, whatever Cloudflare
   is running. The divergence is known only from the deploy's own record and from reading the deployed code back
   from Cloudflare.
9. **Not inside an Earth from Space trial window,** from its start change to its closeout.

## Landing hub code on main without deploying (as on 23 Nov 2026)

The same identity checks apply with no upload: the deployed code is read back, the landing commit's file equals
it, and main's file as served by GitHub equals it afterwards. The changed-path set of the landing equals a
reviewed manifest, path by path and hash by hash.

## What this rule does not do

- It does not watch Cloudflare. `phase1/DEPLOYED-HUB.json` is a record of a reading, updated by hand.
  `hub-alignment` catches the hub file changing in the repository without the record. **It cannot catch the hub
  changing at Cloudflare while the repository stays as it was:** if the hub is deployed and main is not updated,
  nothing in the repository notices. Only a read-back from the account shows it.
- It does not cover the Mac collector, the page, or any account setting.
- Helper scripts in `phase1/` (probe, admin and caller scripts) are source files. Having them on main gives no
  permission to run them.
