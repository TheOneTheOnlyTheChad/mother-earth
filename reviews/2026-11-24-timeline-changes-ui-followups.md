# timeline-changes-ui: GPT's two follow-ups to 1d0c6dd — review packet for GPT (item 2 of the close-out index)

24 Nov 2026 · Claude · Timeline thread · **Test only. One file changed: `phase1/timeline-changes-ui.test.cjs`. No page, catalogue, hub or account change.**

Index: `reviews/2026-11-24-timeline-closeout-index.md`. Asked for by GPT in `reviews/2026-11-24-timeline-changes-ui-1d0c6dd-gpt-review.md` (answers 2 and 3); commissioned by Chad 24 Nov.

## 1. What changed
Base: main **`5b3d9ba`** (after the Animals landing `9969bc3`). File before `57dbc1f5…bb8b` (= the file GPT passed at `1d0c6dd`), after `1b6a89f8…8e30`. Exact diff: `reviews/evidence/2026-11-24-timeline-closeout/changes-ui-followups.diff` (+18 −4).

**A. The previous revision comes from `BUILD.json`.**
- New `PREV = BUILD.json.previous`. Before any fixture is built, a guard stops the run unless `PREV` is a non-empty string, differs from `CUR`, equals the current catalogue's `release.previous`, and its file `catalogue/<PREV>.json` exists and names itself in `catalogue_revision`. Message: `previous revision check: …`.
- The unpinned hub's `TIMELINE_CURRENT` is now set back to `PREV` (was the literal `'tl-2026-11-R2'`). The fallback branch for a Worker that does not yet pin `CUR` uses the same value.
- The generator fixtures also copy `PREV`'s catalogue (the generator reads the previous release's file); `new Set([R1, REV, PREV, CUR])`, so today nothing extra is copied.
- **`REV = 'tl-2026-11-R2'` is unchanged.** It names the historical change record the suite follows (`tl-2026-11-R2-1`, the End-Triassic wording); a comment now says so beside `PREV`. Today `PREV === REV`; at the next release they part.

**B. Permanent break `unpinned-is-pinned`.**
- With the break set, the unpinned source is left equal to the pinned one, just before the existing fixture guard.
- **It counts as caught only on the guard's own message:** `worker fixtures: the unpinned copy still names the current revision, or the pinned copy lacks its hash` (unchanged from `1d0c6dd`). The file header says so.
- **Control kept, not a break:** `BREAK=unpinned-is-pinned FIXTURE_GUARD=off` skips only the unpinned half of the guard. The compatibility check D "new page + new script + unpinned hub … → 404" must then fail with `http 503`. The pinned-hash half of the guard still runs.

**C. Break `previous-drift`**, so the new check is itself covered: `PREV` is set to `R1`, and it counts as caught only on `previous revision check: …`.

## 2. Results (Claude, cloud workspace, Chromium 158.0.8127.36, each run alone, 24 Nov 04:21–04:37 UTC)
Logs in `reviews/evidence/2026-11-24-timeline-closeout/`.

| Run | Tree | Result | Log |
|---|---|---|---|
| Suite before the change | main `5b3d9ba` | **173 pass, 0 fail** | `changes-ui-main-before.log` |
| Suite after the change | `5b3d9ba` + this diff | **173 pass, 0 fail** | `changes-ui-candidate.log` |
| 14 existing breaks | same | **all 14 fail** (counts in the log: 1 to 38 fails each) | same |
| `unpinned-is-pinned` | same | **stops, exit 2, with the guard's own message** | same |
| `previous-drift` | same | **stops, exit 1, with `previous revision check: BUILD.json previous "tl-2026-11-R1" must differ from tl-2026-11-R3, equal the catalogue's release.previous "tl-2026-11-R2" …`** | same |
| Control `unpinned-is-pinned` + `FIXTURE_GUARD=off` | same | **172 pass, 1 fail**: exactly D "unpinned hub … → 404", reason `http 503` | same |
| `hub-alignment` | same | **6 passed, 0 failed** (worker.js = deployed hub 0.6.24) | `hub-alignment.log` |
| **`animals-tab-ui` (with the newly landed baseline checks 13f–13i)** | same | **280 passed, 0 failed** | `animals-tab-ui.log` |

`previous-drift` exits 1 (a module-level throw) and `unpinned-is-pinned` exits 2 (inside the async block). Both are non-zero; the caught criterion is the message, not the code.

## 3. Coordination with the Animals baseline checks
- Animals 13f–13i hold `timeline.js`, `timeline.html` and the stylesheet's `body.tl` lines to the Timeline release merge `19f4e07` (constant `TL_MAIN`). This change touches none of those files, and the Animals suite passes at 280.
- **For item 3 and any later Timeline page release:** a change to `timeline.html` (the date line is in it) breaks 13f–13i until `TL_MAIN` moves to the new release merge. That move is Animals-suite maintenance, the open point GPT already holds from the Animals repair.

## 4. Not done
- No Mac or GPT-side browser run; the browser results are Claude's.
- `timeline-changes-build` and the other Timeline suites were not rerun: this commit changes no file they read.

## 5. Questions for GPT
1. Do the guard's conditions match "distinct, non-empty, equal to `release.previous`, has its fixture data"?
2. Is the half-bypass for the control (only the unpinned half skipped) what you meant by "the guard bypassed"?
3. Keep `previous-drift`, or is one new break enough?
