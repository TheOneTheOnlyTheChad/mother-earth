# Hub 0.6.22 in workerd: the Stage C runbook and the admission window, run locally (22 Nov 2026)

Run: `node reviews/evidence/2026-11-22-earth-from-space-0.6.22/stage-c-workerd-run.mjs <miniflare>/dist/src/index.js` (Miniflare 4.20260730.0), 2026-11-22T06:03:20Z clock reading, in Claude's workspace. Local runtime, local R2 and D1 kept on disk between restarts, EUMETView replaced by fixtures, a made-up key. Nothing reached the network or the live hub. It shows the sequence working in Cloudflare's runtime through HTTP; it shows nothing about memory or CPU limits.

worker.js: 540223 bytes; 6 test-only export lines removed for the local runtime

| Step | Result |
|---|---|
| C1 status (gate unset) | exit 0; pointer missing, list missing, 0 picture(s), hold no, guards "storage is not set up: no pointer and no list" |
| the same with the key in the URL instead (by hand, a made-up key) | HTTP 400 {"layer":"earthview","error":"the key is not accepted in the URL; send it in the Authorization heade |
| a manual run attempted while the gate is unset (step C7-run-1 is spent on this in the local run only) | exit 0; {"job":"earthview","result":"earthview:not run (EARTHVIEW_ENABLED unset)","wall_ms":0}; requests to the stubbed source so far 0 |
| C2-hold | exit 0; applied true; held |
| C3 recover-plan | exit 0; mode "first start"; plan id given |
| C4-recover | exit 0; recovered |
| C5 sweep-plan | exit 0; would add 0 |
| C5 release-plan | exit 0; remove the hold |
| C5-release | exit 0; released |
| status after release | exit 0; pointer present, list present, 0 picture(s), hold no, guards "pass" |
| objects under earthview/ | earthview/current.json, earthview/epochs/<epoch>.json, earthview/held.json |
| C2-hold started a second time | exit 4: Step C2-hold is already claimed (<tmp>/results/C2-hold.claim). It  |
| gate "manual": a five-minute trigger fired by the runtime | outcome ok; requests to the stubbed source 0; run lines 0 |
| C7-run-1 (gate "manual") | exit 0; "earthview:published 2026-11-19T11:00:00Z"; requests to the stubbed source 3; Authorization forwarded upstream on 0 |
| the run's two log lines | run-start exec same trigger manual scheduled_before 1 fetches_before 0 crons_before {"*/5 * * * *":1} · run-end exec same trigger manual validations_before 0 validated true |
| objects under earthview/ | earthview/current.json, earthview/epochs/<epoch>.json, earthview/frames/<epoch>/<id>/picture.jpg, earthview/held.json, earthview/state.json |
| public read-back | frame 2026-11-19T11:00:00Z; picture HTTP 200, 676253 bytes, sha256 equals the record's; cache-control "public, max-age=86400, immutable" |
| status after the run | exit 0; pointer present, list present, 1 picture(s), hold no, guards "pass"; current 2026-11-19T11:00:00Z |
| C7-run-2 started straight away | exit 5: C7-run-2 is refused: C7-run-1's answer says a frame was published. |
| gate "1", window 19 Nov 12:00 to 21 Nov 12:00: trigger scheduled 11:50:08 (before FROM) | outcome ok; requests to the stubbed source 0; run lines 0 |
| trigger scheduled 12:00:08 (first slot), a newer frame listed | outcome ok; requests to the stubbed source 3; run lines 2 |
| trigger scheduled 12:05:08 (inside, off the cadence) | outcome ok; requests to the stubbed source 0; run lines 0 |
| trigger scheduled 12:10:08, nothing newer listed | outcome ok; requests to the stubbed source 1; run lines 2 |
| the SAME scheduled time 12:10:08 delivered again | outcome ok; requests to the stubbed source 1; run lines 2 |
| trigger scheduled 21 Nov 11:50:08 (last slot) | outcome ok; requests to the stubbed source 1; run lines 2 |
| trigger scheduled 21 Nov 12:00:08 (at UNTIL) | outcome ok; requests to the stubbed source 0; run lines 0 |
| run-start lines: scheduled_time, exec distinct, scheduled_before, crons_before | 2026-11-19T12:00:08.000Z sb=1 {"*/5 * * * *":1} · 2026-11-19T12:10:08.000Z sb=3 {"*/5 * * * *":3} · 2026-11-19T12:10:08.000Z sb=4 {"*/5 * * * *":4} · 2026-11-21T11:50:08.000Z sb=5 {"*/5 * * * *":5} · distinct exec ids 4 for 4 runs |
| run-end results | earthview:published 2026-11-19T11:40:00Z (validations_before 0) · earthview:nothing newer 2026-11-19T11:40:00Z (validations_before null) · earthview:nothing newer 2026-11-19T11:40:00Z (validations_before null) · earthview:nothing newer 2026-11-19T11:40:00Z (validations_before null) |
| objects under earthview/ | earthview/current.json, earthview/epochs/<epoch>.json, earthview/frames/<epoch>/<id>/picture.jpg, earthview/frames/<epoch>/<id>/picture.jpg, earthview/held.json, earthview/state.json |
| gate "1" with NO window set: trigger scheduled 12:20:08 | outcome ok; requests to the stubbed source 0; run lines 0 |
| the key in every answer the script saved and in everything it printed | absent |
