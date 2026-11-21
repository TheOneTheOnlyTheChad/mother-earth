# Hub 0.6.21 deployed for Stage B: read-back, 21 Nov 2026

On Chad's own Approve line of 21 Nov ("Approve: deploy hub 0.6.21 from earth-from-space-rc 559f2e4, phase1/worker.js sha256
7cbc8cc4…dc853, code only, EARTHVIEW_ENABLED left unset, no variable, binding, cron or setting changed; read back the deployed
hash and settings; stop and report if any earthview/ object exists in storage").

## How

- 06:05:26 UTC: the raw file `raw.githubusercontent.com/…/559f2e4/phase1/worker.js` as shown in the pane: 532,762 bytes,
  sha256 `7cbc8cc4966ef3d2c512e9eaad279690259e76c9de4626a5ea1fa0da720dc853`, version 0.6.21.
- Chad copied it and pasted it over the code in the Cloudflare editor. Seen before the click: last line 6317 and
  `export default {` at line 6184, both as in the reviewed file. The editor's own checker showed 82 marks (12 on the old
  file); it is a type checker for the editor and not part of deployment.
- Chad: "check and then you can click deploy". Claude clicked Deploy.
- **Deployed 2026-11-21T06:08:56Z**, deployment `f66d7e4f-16c5-48f1-a081-4f9466b260a1`, version `030f8d76-f40e-4301-a21f-f69ada9d6a3a`.
  Previous: version `674cdc95-edaf-4918-a120-7d8844046885`, deployed 18 Nov 15:46 UTC (0.6.19).

## ONE DIFFERENCE, REPORTED: the final newline

The deployed module is **532,761 bytes, sha256 `2028e2daec92591d781e4f6289224c5e7c74fd16addfada62f6b6fc7359301c3`**.
That is not the reviewed file's hash. It is exactly the reviewed file **without its last byte, the final newline**:
`head -c -1 phase1/worker.js | sha256sum` at `559f2e4` gives `2028e2da…01c3`. The copy from the pane's page did not carry
the trailing newline. Every other byte is the reviewed file. A newline after the closing `};` has no effect on the program.
(0.6.19 as it was live carried its final newline: 426,559 bytes, equal to main's file.)

Not corrected: correcting it would be a second deployment, which needs its own line. Reported to Chad and for GPT.

## Read back (read-only), 06:09 to 06:19 UTC

| Check | Found |
|---|---|
| `/` on the hub | version 0.6.21 |
| Bindings | 24, the same names and kinds as before the deploy |
| `EARTHVIEW_ENABLED` | not present |
| Compatibility date, flags | 2026-10-30, none |
| Cron triggers | the same four |
| Workers Logs | on, invocation logs on, sampling 1 |
| Storage, prefix `earthview/` | **no object** |
| `GET /snapshot/earthview/meta` | 200, `frame: null`, `previous: null`, no source check, no collection |
| `GET /admin/probe/earthview` | 405 "POST only" |
| `GET /admin/run/earthview` without a key | 403 |
| Invocations on the new version, 06:08:56 to 06:18:32 | 20 fetch and 4 scheduled, every outcome `ok`, no exception |
| Scheduled runs on the new version | 06:10:07 five-minute (CPU 11 ms, wall 2.6 s); 06:11:37 forest (27 ms, 44 s); 06:15:07 five-minute (15 ms, 2.5 s); 06:15:40 quarter-hour (68 ms, 9.6 s) |
| The five-minute job's own line | `usgs:ran; opensky:parked; earthview:not scheduled (EARTHVIEW_ENABLED unset)` |
| `/status` at 06:18:42 | every layer `ok` except three rows that started BEFORE the deploy: `opensky-bbox` down (31 Oct, parked), `firms:recovery` down (03:00 UTC today), `ships` degraded (05:51 UTC today) |
| Layers run after the deploy | forest 06:11:37 ok, usgs 06:15:07 ok, firms 06:15:40 ok |

The public Earth from Space route answers with an empty record rather than the word "unavailable" used in the approval
package; nothing is stored and nothing is served.

Before the deploy, 05:56 UTC: live code 426,559 bytes, sha256 `eb5b1de9…c4fa` (0.6.19, equal to main's `phase1/worker.js`,
the rollback file); no `EARTHVIEW_ENABLED`; no `earthview/` object.

## Also on record

Chad started the calling script for observation 1 at 06:01:33 UTC, before the deploy and before sending the observation line:
it claimed observation 1 and is waiting for its window (12:21:30 UTC). Chad sent the observation Approve line (option A)
with his "pasted" message, before the deploy was clicked. No call had been made at the time of this read-back.
