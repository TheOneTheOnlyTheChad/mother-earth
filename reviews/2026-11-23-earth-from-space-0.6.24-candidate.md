# Hub 0.6.24 candidate — the Timeline pin `tl-2026-11-R3`, and nothing else (23 Nov 2026, 16:50 UTC clock reading)

**Branch work only. Not deployed. Nothing uploaded, pinned or changed in any account.** For GPT's review, then
Chad's own Approve line.

**Where it is.** Branch `earth-from-space-0.6.24-rc`, cut from `earth-from-space-rc` at `9f2c7ad`. It is kept off
`earth-from-space-rc` until the deploy is approved, so that branch's `phase1/worker.js` stays equal to the live hub
(0.6.23, `7141beb8…afa1`).

**On whose word.** Route H1 was agreed between the Timeline thread and this one and is named in Chad's own go to the
Timeline thread ("… hub route H1. Branch work only."). The Timeline thread's "bytes final" statement was relayed
here by Chad on 23 Nov **without a line of his own to this thread.** The build was started on that basis as branch
work. It is recorded here as that, not as a go from Chad to this thread.

## 1. What it is

Hub 0.6.23 as deployed, plus exactly these lines of `phase1/worker.js`
(`reviews/evidence/2026-11-23-earth-from-space-0.6.24/worker-0.6.23-to-0.6.24.diff`, 9 lines added, 2 changed):

1. `COLLECTOR_VERSION` `'0.6.23'` → `'0.6.24'`.
2. One new entry in `TIMELINE_REVISIONS`: `'tl-2026-11-R3'`: key `ref/timeline/tl-2026-11-R3.json`, fileSha256
   `f1a5fab24c6297eaabed701bb56c4c7466007fb43ece6036f008b2f3ed3e0993`, bytes 31636, with one comment line.
3. `TIMELINE_CURRENT` `'tl-2026-11-R2'` → `'tl-2026-11-R3'`.

No route, handler, gate, window, health check, collector or binding is touched. R1, R2 and `TIMELINE_LEGACY` are
unchanged. **The fourth item, the R2 object in storage, is the Timeline thread's upload and is not part of this
candidate.**

| | |
|---|---|
| `phase1/worker.js` sha256 | `db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5` |
| Bytes | 551,400 (0.6.23: 551,047) |
| Without its final newline | `9b1eba3e477523bfd93203eb3d220cecfd9e7b5e93e0fe147c599467a152c2cd` |
| Rollback | 0.6.23: `phase1/worker.js` at `566a11b`, sha256 `7141beb8…afa1`. **Never main's file (0.6.19)** |

**Reversing the diff gives the deployed 0.6.23 file byte for byte** (sha256 `7141beb8…afa1`, compared with `cmp`).

## 2. What came from the Timeline thread, and how it was checked

From `timeline-story-rc` at `36c6cb0` (their "bytes final" statement, `reviews/2026-11-23-timeline-story-release-rc.md` rev 2):

- `phase1/timeline/catalogue/tl-2026-11-R3.json`: copied; **31,636 bytes, sha256 `f1a5fab2…0993`**, as stated.
- `reviews/evidence/2026-11-23-timeline-story-release/hub-test-for-0.6.24.patch`: applied unchanged to
  `phase1/timeline-catalogue-hub.test.mjs`. It makes R3 current, keeps R1 and R2 served byte for byte, and replaces
  the page assertion (accepted by this thread and by GPT, their record 4.1).

**Their statement holds for a page release on 24 Nov 2026 only.** If the date moves, the hash and byte count change
and this candidate is void: it is rebuilt and rechecked, not patched.

## 3. Other files changed, all because the version number moved

The same routine as the 0.6.22 and 0.6.23 builds (compare commit `114dc5b`):

| File | Change |
|---|---|
| `phase1/earthview-gate.test.mjs`, `earthview-health.test.mjs`, `earthview-probe.test.mjs`, `history-hub.test.mjs`, `wind-hub.test.mjs`, `sunface-hub.test.mjs`, `evprobe.test.mjs` | the expected version `0.6.23` → `0.6.24` (one line each; two in `earthview-probe`) |
| `phase1/evprobe.js` | rebuilt by `evprobe.build.mjs` for its own start time: the version line and the hash line that covers it. This is the Stage A probe file, not deployed anywhere |

**Found on the way:** the first full run failed three suites (`earthview-probe` 1, `evprobe` 4, `sunface-hub` 1).
All six were the version number: two User-Agent checks written as patterns, and the probe file built from the old
`worker.js`. They were corrected by the routine above, not loosened.

## 4. Results (Claude's workspace, node v22.23.5)

Logs: `reviews/evidence/2026-11-23-earth-from-space-0.6.24/`.

- **The 47 non-browser suites, final state, finished 16:48 UTC: 42 pass, 5 could not run** (`night-lights`,
  `oceanheat-hub`, `orbital`, `sky-scene-ref`, `solar`: files this workspace does not have). The same five could not
  run on the 0.6.23 baseline today and at the 0.6.23 build. **Not run is not passed.**
- Against the baseline run of the deployed 0.6.23 tree made the same hour, the only difference is
  `timeline-catalogue-hub`: **73 → 74 passed, 0 failed.**
- Hub suites on the candidate: `earthview-health` 49, `earthview-gate` 163, `earthview-hub` 309, `earthview-admin`
  109, `earthview-probe` 117, `evprobe` 94, `health-hub` 29, `history-hub` 33, `wind-hub` 103, `sunface-hub` 171,
  all 0 failed.
- `earthview-health-breaks`: **38 of 38 caught** on the candidate.

**Not run, said plainly**

- **43 of the 45 browser suites cannot run in this workspace** (a local font folder they load is absent), on the
  baseline and the candidate alike. Thirteen of them load `worker.js`, among them `timeline-changes-ui`. Read, not
  run: on this branch it asks the hub for `tl-2026-11-R2` by name, which 0.6.24 still serves.
- The breaks of `timeline-catalogue-hub`, if it has any, and of the other hub suites.
- Nothing in the Workers runtime. No preview deploy.
- The deployed hub was **not re-read** in this thread. "Deployed = 0.6.23 `7141beb8…afa1`" is the read of 14:47 UTC.

## 5. Order, and the deploy

1. GPT reviews this candidate.
2. **The Timeline thread uploads `ref/timeline/tl-2026-11-R3.json` and reads it back, exact bytes, before the hub
   deploy** (their Approve line). Until it is there, 0.6.24 would answer 404 or 503 for R3; R1 and R2 are not
   affected either way.
3. Hub deploy on Chad's own line. Before: deployed hash, 25 bindings, gate `manual`, no window, four crons, five
   `earthview/` objects. Upload, then read back the same. `earth-from-space-rc` is fast-forwarded to this commit at
   the deploy.
4. Checks after: `GET /catalogue/timeline/tl-2026-11-R3` returns 31,636 bytes with sha256 `f1a5fab2…0993`;
   `/catalogue/timeline` and `/catalogue/timeline/tl-2026-11-R1` return R1's bytes; `/catalogue/timeline/tl-2026-11-R2`
   returns R2's; `/` reports 0.6.24 and lists three revisions with current R3; the ten health addresses as before
   (the two `earthview` ones 200 `no trial configured`); the first `*/5` tick ok; `earthview/` unchanged.
5. Then the Timeline thread's page merge. **Step 4's R3 check is the only thing tying the page to the hub.**

Sketch of the line (values as above):

`Approve: deploy hub 0.6.24 from earth-from-space-0.6.24-rc <commit>, phase1/worker.js sha256
db4f9cdfd351aed3b920d1b0b87c63dfe260ebb150867be8a4772403b9a01aa5, code only (the Timeline pin tl-2026-11-R3 and the
version number), EARTHVIEW_ENABLED left at manual, no window variables; read back hash and settings; then
fast-forward earth-from-space-rc`

## 6. What this changes for Earth from Space

- The fixture alert test plan copies the health code from the deployed Worker and names `566a11b`. After this
  deploy it names this commit instead. The health code itself is byte for byte unchanged; `COLLECTOR_VERSION`,
  which the health answer reports, is not.
- The handover's "live hub" paragraph, the rollback line and STATUS are rewritten at the deploy.
- The Stage D documents in review are not affected.

## 7. Questions for GPT

- **Q1.** Is the diff exactly the pin and the version, with nothing else reachable from it?
- **Q2.** Is it acceptable to deploy with 43 browser suites not run here, given the change touches no page file
  and none of those suites was run for 0.6.23 either? If not, which should Chad run on the Mac?
- **Q3.** Is the order in section 5 right, in particular the upload before the deploy?
