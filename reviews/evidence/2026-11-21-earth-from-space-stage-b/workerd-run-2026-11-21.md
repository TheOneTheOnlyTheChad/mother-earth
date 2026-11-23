# Stage B candidate in workerd (Miniflare), rerun with the corrected calling script, 21 Nov 2026 05:40 UTC

`node stage-b-workerd-run.mjs <miniflare>` (miniflare 4.20260730.0, workerd 1.20260730.1). The whole hub file (sha256 7cbc8cc4…dc853, unchanged) with real local R2 and D1 bindings; EUMETView replaced by the fixtures; the route called by `phase1/earthview-stage-b-call.sh` (sha256 ccdb764dcefdf731…). Local workerd enforces no 128 MB limit: this says nothing about memory.

worker.js: 532193 bytes; 6 test-only export lines removed for the local runtime

| Case | Result |
|---|---|
| the calling script, window open now | exit 0; answer saved: outcome "validated", 3 requests, frame 2026-11-19T11:00:00Z, header_ok true, validation ok true, hub 0.6.21, isolate requests_served 1 |
| upstream requests as the stub saw them | 3; Authorization forwarded on 0; User-Agent mother-earth-collector/0.6.21 (open project; github.com/TheOneTheOnlyTheChad) |
| after it: storage | bucket 0 objects, database 0 tables |
| the key in what the script printed, in the saved answer, in the meta file, in the runtime's output | absent, absent, absent, absent |
| probe log lines in the runtime's output | "ev":"start" "ev":"fetched" "ev":"validate-begin" "ev":"validated" "ev":"done" |
| the script started again for the same observation | exit 4: Observation 1 is already claimed (<out>/observation-1.clai; upstream requests now 3 |
| the script started an hour after its window | exit 5: result: NOT RUN (started at 2026-11-21T05:39:52Z, after the window closed). Not moved.; upstream requests now 3 |
| GET with the right header | HTTP 405 {"layer":"earthview","probe":"stage-b","error":"POST only"}; upstream requests now 3 |
| POST with the key in the URL | HTTP 400 {"layer":"earthview","probe":"stage-b","error":"no query string is accepted"}; upstream requests now 3 |
| POST with a wrong key | HTTP 403 {"layer":"earthview","probe":"stage-b","error":"forbidden"}; upstream requests now 3 |
| GET /admin/run/earthview with the admin key (manual collector, gate unset) | HTTP 200 {"job":"earthview","result":"earthview:not run (EARTHVIEW_ENABLED unset)","wall_; upstream requests now 3 |
| after all of it: storage | bucket 0 objects, database 0 tables |
| gate ON (EARTHVIEW_ENABLED=1): POST with the right key | HTTP 409 {"layer":"earthview","probe":"stage-b","error":"collection is on (EARTHVIEW_ENABLED is set; upstream requests 0; bucket 0 objects, database 0 tables |
