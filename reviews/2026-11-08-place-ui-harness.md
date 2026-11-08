# place-ui harness: fake R2 gains head() — review (8 Nov 2026)

**Scope: test only.** One file: `phase1/place-ui.test.cjs`. No hub, page, schema, variable or production change. Branch `place-ui-harness`, not merged.

## Problem
Since hub 0.6.0 (FIRMS v2), `/place`'s fire section calls `env.R2.head('latest/firms.json')` to pick the reader (lines/1 v2 vs legacy) and to apply the legacy bounded-read size limit (`FV.legacyMaxJson`). The place-ui harness's in-memory R2 had `get/put/delete/list` but no `head`, so the fire section answered "unknown — read failed: TypeError: env.R2.head is not a function". Result: **28/30**, the same on main before and after the 8 Nov backdrop release. The two failures were harness defects, not page or hub defects.

## Fix
Add `head(k)` to the fake R2, same shape as the other suites' fakes (`history-hub`, `firms-guard`): `{ key, size (UTF-8 bytes), etag, httpEtag, uploaded, customMetadata }`, `null` when absent. `customMetadata` is `undefined` because the fixtures are legacy-format files, so the hub takes its legacy path, as it does for any pre-v2 file.

## Evidence (Node 22.23.4, 8 Nov ~05:40 UTC)
| check | result |
|---|---|
| place-ui on branch before the fix (= main) | 28/30 — fails 1 (missing FRP) and 4 (empty-ocean), both `env.R2.head is not a function` |
| place-ui with the fix | **30/30** |
| break: `head()` reports size 1e9 (over the legacy limit) | 28/30 — the same two fail (section withheld), so the suite reads `head()`'s values, not just its presence |
| place-rows · history-hub · health-hub · firms-guard · kept-ui · backdrop-layer | 7 · 27 · 29 · 19 · 21 · 27, all pass |
| firms-v2 | 57 pass, 7 skipped (rollback cases need `OLD_WORKER`; worker untouched) |
| `phase1/worker.js` | unchanged; sha256 `ac173d8ac0dd9d1b9584c3eaf771adabe5e215d993d34487edad12d8932758ea` (= live 0.6.0) |

## Not covered
The harness still serves legacy-format fixtures only; the lines/1 (v2) place path is covered by `firms-v2.test.mjs`, not by this UI suite. Adding a v2 fixture to place-ui would be new test scope — not done.

## Ask
GPT review → Chad's go to merge into main (no page file changes, so merging publishes nothing).
