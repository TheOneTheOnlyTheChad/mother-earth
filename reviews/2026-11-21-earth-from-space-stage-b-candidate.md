# Earth from Space, Stage B: implementation candidate for GPT

21 November 2026. Branch `earth-from-space-rc`. Built on Chad's own go of 21 Nov ("Yes to all four, go … This authorizes
branch work only. No deployment or live observations yet."), under proposal rev 2
(`docs/concepts/EARTH-FROM-SPACE-STAGE-B-PROPOSAL.md`). **Nothing is deployed. No approval is requested by this packet.**

Chad's decisions, his own words, 21 Nov: D1 accept Stage A's evidence as sufficient to proceed, both formal verdicts kept
incomplete; D2 2,048 px; D3 quiet, busy, quiet, exact dates fixed after candidate review; D4 build on the branch and return
the candidate to GPT.

## 1. What to review

**The full merged Worker file: `phase1/worker.js`, sha256 `7cbc8cc4966ef3d2c512e9eaad279690259e76c9de4626a5ea1fa0da720dc853`, 532,762 bytes, version 0.6.21.**
Current main is merged into the branch (main carries documents only since the live page `8bb3139`; main's hub is the live 0.6.19).

Against the file GPT accepted for recovery (`3c7598b`, sha256 `e2b6fb6d…`) the hub changes in eleven places, 99 lines added, 6 changed:

| Where | Change |
|---|---|
| Header comment, two places | the new route and the gate now covering the manual job |
| `COLLECTOR_VERSION` | 0.6.20 to 0.6.21 |
| `evFetch` | an optional fourth argument, the time limit; default is the collector's own 90 s, so the collector's calls are unchanged |
| New block before the sunface probe | `EVB`, `evbSeen`, `evProbeValidate`, `evProbeOnce`, `evProbeRoute` (84 lines) |
| `JOBS.earthview` | refuses unless `EARTHVIEW_ENABLED` is `1`, before `runEarthView` and its run-log wrapper |
| `scheduled` and `fetch` handlers | one line each, `evbSeen(...)`, counting what the isolate has served |
| `fetch` handler | the route line, above the GET-only check |
| Test exports | five names added |

**Not edited:** everything from "Storage records, guards and recovery" up to `evRoute` (the collector `evCollect`, the guards,
the fence, cleanup, the admin actions). The probe suite checks that span's sha256 against `3c7598b`'s (case H6):
`cbe5dc6ff44b857151450c7bb4d07268f6b1f27c3a6aa23cec4b61a8267c1ef6`, 37,471 characters.

Other files: `phase1/earthview-probe.test.mjs` (new suite), `phase1/earthview-stage-b-call.sh` (the one-call script Chad
would start), `phase1/earthview-hub.test.mjs` (case A1b and one break added), `phase1/evprobe.js` regenerated (it cuts
`evFetch` and the version from `worker.js`; Stage A's deployed file under `stage-a/` is untouched), version strings in
three other suites.

## 2. Your seven points, as built

**1. Manual collector loophole.** `JOBS.earthview` now answers `earthview:not run (EARTHVIEW_ENABLED unset)` unless the gate
is `1`, ahead of the collector and of `guarded`. Tests F1 to F5 (probe suite) and A1b (hub suite): manual job and
`/admin/run/earthview`, with the probe idle and with a probe in flight: zero source requests, zero bucket and database calls,
no run-log row. The probe refuses unless the gate is **unset** (any value, not only `1`: F6, F7), so a half-set gate runs
neither. The latch is probe-only and per isolate; the file says so.
*Consequence to note:* `/admin/run/earthview` no longer ignores the gate. The release plan's "first manual stored run before
the gate" needs a different step; that is release-stage and not built.

**2. No-write proof.** The suite drives the **whole route through the hub's own `fetch` handler**. The bucket and the
database are spies that record **any** call (every method, including reads); the cache API and `ctx.waitUntil` are spied
too. Zero calls on: success (three frames), 25 failure outcomes (list, picture, check image, header, damaged pictures), the
comparison throwing (C27), an unexpected error inside the observation (C28: answers 500 and writes no failure record), four
deadline cases, busy, gate on, and eleven refused calls. Breaks `route-writes-bucket`, `route-writes-db`,
`error-path-writes` fail it. The static checks (H2 to H5: no `env`, no storage or run-log function, exactly three request
sites, no loop) are supplementary.

**3. Authentication.** `POST` only (405 otherwise); any query string 400; `Authorization: Bearer <ADMIN_KEY>` exactly (403
otherwise, including the bare key, the key in another header, in the body, and an unset admin key). Refusals make no request
and log nothing. Upstream requests carry only `User-Agent` (B3). No log line or answer contains the key (B9; break
`logs-key`). **Observed on the live hub, read-only:** its invocation records store the `Authorization` value of the Mac
collector's ingest calls as eight asterisks (`authorization-header-in-logs-2026-11-21.md`). Two records, not a documented
guarantee; to be re-read on the first Stage B record.

**4. Timing.** One deadline, 150 s from the start of the run; each request gets the smaller of its own limit and the time
left (D1, D6); past the deadline no further request starts and no validation starts (D2 to D4); a failure at the deadline
is reported as "deadline" (D5). A validation already running is not interrupted; if it ends after the deadline the answer says
`deadline_hit: true` and that observation is read as incomplete. The script waits 180 s, once, with no retry. Windows bound
the start of the call. Dates are not fixed here. Overlap is read afterwards from invocation records, not assumed.

**5. Health verdict.** As in proposal rev 2 section 4, unchanged by the build.

**6. Evidence.** Log lines `start`, `fetched`, `validate-begin`, `validated`, `done`, each with attempt, build
(`stage-b-1`) and isolate id; the answer carries the same attempt id, run start and end, and the validation's own start and
end. The hub's invocation records carry `requestId`, so lines and the CPU record of that request are tied by request.
Isolate report: id, start, age, requests served, scheduled runs, validations before, previous attempt (B11, B13).
`requests_made` is counted by the probe before each request; nine is the budget for three single attempts, kept by procedure.

**7. Deployment.** Nothing done. The proposal's read-back rule stands: unexpected `earthview/` objects mean stop and report.

## 3. Evidence

In `reviews/evidence/2026-11-21-earth-from-space-stage-b/`:

- `suites-2026-11-21.md`: probe suite 114 of 114, 24 of 24 breaks; hub suite 295 of 295, 53 of 53 breaks; every other suite
  that loads `worker.js` (30 files) passes. Page suites not run: no page file changes and Stage B deploys only the hub.
- `workerd-run-2026-11-21.md` and `stage-b-workerd-run.mjs`: the whole hub in workerd with real local R2 and D1; the calling
  script makes its one POST and saves a validated answer; three upstream requests, none with Authorization; bucket 0
  objects and database 0 tables afterwards; second start for the same observation refused; a start after the window "not
  run". For the local runtime only, the six test-only `export { … }` lines are removed (it refuses non-handler exports;
  production has always run with them).
- `authorization-header-in-logs-2026-11-21.md`, `hub-job-timing-2026-11-21.md`: read-only reads of the live hub's logs.

## 4. Known limits, stated

- Local runs say nothing about memory or CPU in Cloudflare. That is what Stage B is for.
- `evProbeValidate` repeats steps 4 and 5 of `evCollect` (structure, scans, check image, decode, compare) because the
  collector's own steps are inline in code that must not be edited. It calls the same functions with the same limits; it is
  not the same lines. The damaged-picture cases (C18 to C25) are the check that it refuses what the collector refuses.
- The key comparison is a plain string comparison, as on every existing admin route.
- The latch is per isolate.
- The calling script uses macOS `date -j`, with a GNU fallback that the local run exercised; the macOS branch has not been run.
- `/admin/run/earthview` changes behaviour (point 1).

## 5. Asked of GPT

1. Review of the full merged `phase1/worker.js` at the hash above for a Stage B deployment with the gate unset.
2. The three open points of proposal rev 2 section 9: the Authorization observation; 150 s and 180 s; the unrelated-failure rule.
3. Whether `deadline_hit` after a completed validation should read as incomplete (as written) or be judged on its figures.
4. Anything to change before Chad is given the two Approve lines (deploy; three observations) and the dates.
