# Nature context release — final prepared candidate, for Chad's Approve line

**24 Nov 2026 (13:47 UTC clock reading). Prepared, not published.** Main does not have this; no push to main, no deploy.

This follows GPT's combined review, filed unchanged as `reviews/2026-11-24-animals-nc-pin-and-nature-context-release-gpt-review.md` (9,557 B, sha256 `0c14820b27d0c515a016353fb05d47b52b65294cb2b772eb1e130aafa7578949`). The review gives two verdicts:
- **A:** PASS for the Animals owner's patch `animals-nc-pin-rc` at `4ed4ca6`, unchanged.
- **B:** the combined tested bytes at `f75c167` accepted, with the disclosed test limits, and a corrected order: reconcile with fresh main and run the four final checks **before** asking for the Approve line.

This document does that. It **supersedes §4 of `reviews/2026-11-24-nature-context-release-rc.md`**, which put those steps after the Approve line and said "two release-critical suites" where it meant four. The rev 1 packet is left unchanged, as GPT accepted it by hash.

## 1. Reconciliation with fresh main

- Fresh main at reconciliation: **`bd7dd16ebbbd4287c55aea1bb099e461014033e5`**. Since the cut at `7e03793` it changed documents only: `STATUS.md`, `docs/research/TIMELINE-HUMAN-RELATIVES-ENQUIRY-DRAFTS.md`, `docs/research/TIMELINE-HUMAN-RELATIVES-SOURCE-CHECK.md` and `reviews/2026-11-24-timeline-finds-rc-gpt-review.md`. These were inspected: Timeline thread records and this thread's own STATUS entry; no page, test or hub file.
- **Merge commit `3064f3734612aa2575eae40813c2e2cec82e705a`** (tree `c03b0d2a…`): a `--no-ff` merge of `bd7dd16` into `nature-context-release` at `9824c7e`. Clean, no conflicts.
- **Against the tested tree `f75c167`, no file outside `reviews/`, `docs/`, `STATUS.md` changed.** Every page, test, hub and stylesheet file is byte-identical (list in `evidence/…/diff-names-vs-tested-tree.txt`).
- H `90eb52203c23b26a7fe00382f30cf3453b00a583` is an ancestor of `3064f37`, so the Animals suite's `NC_MAIN` is reachable. Fresh main `bd7dd16` is also an ancestor of `3064f37`, so publishing is a fast-forward of main.

## 2. Files at the final tree (`3064f37`), all equal to the accepted tested tree

| File | sha256 |
|---|---|
| `app.js` | `a48769068c1a3fa1a2440f57e21610bd5d8f8195ce1e516cc79bfaaba9bd0e5a` |
| `index.html` | `70b43b3e14198c9159204a1fa9bd1d5deff6031aca344c9329a9e9f4979d1b40` |
| `sources.html` | `d6ca4fae29e269adb093a311cd6bf9bd66b27cae7031521d3546b276e12cc70a` |
| `REGISTER.md` | `916809555a1f580a47012a27a20458f4376ceee6f3a1def6cc240e71047f5c7c` |
| `phase1/animals-tab-ui.test.cjs` | `2921d437ee6121af5d3836ef96aace33cabbbe765db89c47e16efb781af4cc38` (= `4ed4ca6`) |
| `phase1/nature-context-ui.test.cjs` | `92acf1f5a2629509a371aee0b31bca0199ed902c9dbda8160153ce3fc9ad2a7b` |
| `phase1/worker.js` | `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5` (unchanged; = deployed hub 0.6.24) |
| `style.css` | `6b6115b2eaeef6d2e882dee888372d10e660fa48bb9ae267dea83688eff12956` (unchanged) |

## 3. The four final checks on the exact tree `3064f37` (13:40–13:46 UTC)

| Suite | Result |
|---|---|
| `nature-context-ui` | 78 passed, 0 failed |
| `animals-tab-ui` | 282 passed, 0 failed |
| `hub-alignment` | 6 passed, 0 failed (worker.js = deployed hub 0.6.24) |
| `place-ui` | 35 passed, 0 failed |

Logs: `evidence/2026-11-24-nature-context-release-final/`.

**Carried over unchanged from the tested tree** (byte-identical production and test files):
- 47 further suites pass.
- `osmc-reliability-ui` fails one check (40/1) on main as well: the same old-page `TypeError`. It is not a pass.
- Five suites were not run on either tree, for missing orbital and ocean-heat fixtures: `key-drawn-ui`, `mobile-pass`, `orbital-browser`, `status-notes-ui`, `oceanheat-ui`. They are unverified.
- Real phone, Safari, screen reader and live data: not checked.
- The hub's own "published" string stays in `worker.js`, unprinted for forest; no hub deploy.

## 4. What publication means (only on Chad's own Approve line)

The commit to publish is this branch's head after the records commit that adds this document and its evidence. That commit is `3064f37` plus `reviews/` files only; its id is given in the reply to Chad.

1. **Immediately before the push:**
   - re-fetch main and confirm the branch head still contains it (fast-forward);
   - if main has moved, merge it in and check again that only documents changed;
   - rerun the four checks if anything but documents changed, and in that case stop and report.
2. Fast-forward main to the approved commit and push. Pushing main publishes the site.
3. In the browser pane:
   - read the served `app.js`, `index.html` and `sources.html` (`cache: 'no-store'`) and compare their sha256 with §2;
   - read the live forest card, one place panel and Sources.
4. Update STATUS, HANDOVER and START-HERE.
5. Delete `nature-context-rc`, `animals-nc-pin-rc` and `nature-context-release` on GitHub only after the release is verified, and read the deletion back with `git ls-remote`. Rollback, if needed, is a revert of the merge on main on Chad's line.
