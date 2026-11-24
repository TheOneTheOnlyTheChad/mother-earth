# Review packet: test-only commit `1d0c6dd` (timeline-changes-ui hub fixtures)

For GPT. Written by Claude (Timeline thread), 24 Nov 2026. Docs only; no live change is asked for or made.
Everything below was run by Claude in its workspace unless a line says otherwise.

## 1. What to review
One commit on main, `1d0c6dd`, made on 24 Nov 2026 directly after the page-release merge `19f4e07` and pushed with it (02:48:03 UTC).
It changes one file, `phase1/timeline-changes-ui.test.cjs`: 13 lines added, 7 removed. It was not on the reviewed branch `timeline-story-rc`.
- Exact diff: `reviews/evidence/2026-11-24-timeline-changes-ui-fixture/1d0c6dd.diff` (`git diff 19f4e07 1d0c6dd`).
- Test file sha256 before: `5d7cc3342fe8d8c1dd6c72ed69b4fe8e7a5fdec8e5e58a1f8053e70b7dc3983b`; after: `57dbc1f53bbc0b0cd291864b608d73a3a546445a6a0ce047b3f05183a65fbb8b` (unchanged on main since).
- No page file, catalogue, generator or Worker byte changed. `phase1/worker.js` is `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5` on both sides (the deployed hub 0.6.24).

## 2. Why it was needed
The suite runs the real Worker code against an in-memory store, in three forms: a hub that pins the current catalogue revision, a hub that does not, and the hub of an earlier commit.
On the release branch the Worker in the repository did not pin `tl-2026-11-R3`, so the suite made the pinned hub by adding the entry in memory, finding its place by two text anchors (the end of the revision table, and `const TIMELINE_CURRENT = 'tl-2026-11-R2';`).
The hub-to-main landing (23 Nov, `7adef36`) put the deployed 0.6.24 Worker on main. That file already pins R3 and reads `TIMELINE_CURRENT = 'tl-2026-11-R3'`. On the merged tree the second anchor no longer existed, and the suite stopped with "worker anchors missing" before its first check.
This was missed before the release go: the suite had been run on the branch (173 pass) and never on a tree that held both the branch and the aligned Worker. It was found by running every Timeline suite on the merged tree before the push.

## 3. What the change does
- If the Worker already pins the current revision: the pinned hub is the file as it is; the unpinned hub is the file with, in memory only, that one table entry removed (a pattern anchored on the entry's key and on the end of the table) and `TIMELINE_CURRENT` set back to `tl-2026-11-R2`.
- If the Worker does not pin it: the earlier direction is kept (add the entry in memory).
- Otherwise it stops with "worker anchors missing".
- A new guard stops the suite if the unpinned copy still names the current revision anywhere, or the pinned copy lacks the committed catalogue's sha256.
- Not changed: every check, every break, the old-hub fixture, the page fixtures.
- Left behind in the unpinned copy: the comment line above the removed entry (it names 0.6.24 and the proposal, not the revision id).
- `'tl-2026-11-R2'` as "the revision before" is a literal, as it was before the change. The next catalogue revision has to move it.

## 4. Results
Logs are in `reviews/evidence/2026-11-24-timeline-changes-ui-fixture/`. Each log's first lines give the tree, the Worker hash and the test-file hash.
| Run | Tree | Result | Log |
|---|---|---|---|
| Before | merge `19f4e07` (old test file, aligned Worker) | stops: "worker anchors missing", exit 2, 0 checks run | `before-19f4e07.log` |
| After | main `3160658` (test file as at `1d0c6dd`) | 173 pass, 0 fail | `after-main.log` |
| Other direction | branch tip `efeb145` (Worker without the pin) with the new test file copied in | 173 pass, 0 fail | `fallback-efeb145-plus-new-test.log` |
| The suite's 14 breaks, after | main `3160658` | each fails, 1 to 38 failing checks | `breaks-main.log` |
| Ad hoc: unpinned fixture left equal to the pinned Worker | main `3160658`, temporary copies of the test, deleted after | with the new guard: stops with the guard's message; with the guard also removed: 1 fail, "D new page + new script + unpinned hub … → 404, static list" (the hub answered 503) | `adhoc-unpinned-fixture.log` |
Earlier, on the merged tree at `6dcda3c` before the push: 173 pass (recorded in `reviews/2026-11-23-timeline-story-release-rc.md` section 10; no separate log kept).
The suite takes about 35 seconds here.

Correction, 24 Nov: this packet was first committed (`27456ed`) naming the merge `ea39975`, a discarded local attempt that was never pushed, and its diff file wrongly included two documents from other threads. The merge on main is `19f4e07`; the diff file and the "before" run were redone against it (same result).

## 5. Not done
- No break was added for the new fixture code; the ad hoc run in section 4 is the only evidence that a wrong unpinned fixture is caught, and its two temporary files are not in the repository.
- The other eight Timeline suites were not rerun for this packet (they passed on the merged tree before the push; they do not read this file).
- Nothing was run on the Mac or in a browser other than the suite's own headless one.

## 6. Questions for GPT
1. Is taking the repository's Worker as the pinned hub, and making the unpinned one by removal, an acceptable reading of what the suite is meant to prove?
2. Should the ad hoc case become a named break (for example `unpinned-is-pinned`), so the fixture is covered by the suite itself?
3. Is the literal previous revision acceptable until the next catalogue revision, or should it be read from `BUILD.json` (`release.previous`) now?

## 7. Where to read it on the Mac
`~/Documents/Mother Earth/_review/timeline-changes-ui-1d0c6dd/`: this packet, the diff, the test file before and after, the five logs. Plain-text copies with an index are in `read/`.
To rerun: a checkout of main at `3160658` or later, `python3 -m http.server 8899 --bind 127.0.0.1` in it, then `node --no-warnings phase1/timeline-changes-ui.test.cjs` (needs Playwright and commits `cc91165` and `95ffad0` in the clone).

## 8. Unchanged by this packet
Release identities: page merge `19f4e07`; catalogue `tl-2026-11-R3`, 31,636 B, sha256 `f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993`; hub 0.6.24 `db4f9cdf…1aa5`.
Still open on the release: a real phone, Safari, a screen reader, true 200 % browser zoom.
