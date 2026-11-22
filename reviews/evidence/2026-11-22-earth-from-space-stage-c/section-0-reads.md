# Stage C section 0 reads (22 Nov 2026, dashboard tab unless said)
0.1 07:30:14Z code 17798a44…a080 540,792 B; hub / 0.6.22; 24 bindings (13 plain, 9 secret, D1, R2); crons */5, */15, 11,41, :07; no EARTHVIEW_* variable.
0.2 07:30:14Z earthview/ empty (also 07:29:48Z before the upload).
0.3 07:32:57Z lifecycle: Default Multipart Abort Rule (7 d, no prefix), cells-48h cells/, raw-48h raw/, snapshots-48h snapshots/. None matches earthview/.
0.4 REGISTER GeoColour entry filed, main 418e9fa.
0.5 07:31:02Z eight /health URLs 200. /status non-ok rows: opensky-bbox down (started 2026-10-31T14:14:37Z), firms:recovery down (2026-11-22T02:45:40Z), ships degraded (2026-11-22T07:12:03Z): all started before the 07:29:51Z deploy. Invocations 07:20–07:30Z all outcome ok.
0.6 07:32:57Z workersInvocationsAdaptive, status success. Hour 06:00Z: 118 requests, 0 errors, CPU us P50 2221 P90 9863 P99 83284 P999 103576 max 103576; memory bytes P50 2901260 P90 3425552 P99 13186380 P999 13382988. Hour 07:00Z (partial, to 07:32Z): 79 requests, 0 errors, CPU P50 2142 P90 8630 P99 110761 P999 110761; memory P50 3163408 P90 3441936 P99 14089970 P999 14089970. (Dimension read: datetimeHour and status only; not split by eventType.)
0.7 07:33:24Z billable-usage page, period 30 Oct–30 Nov: Workers requests 86.11k of 10M; Workers CPU ms 770.23k of 30M; R2 storage 0.53 GB-months of 10; R2 Class A 58.8k of 1M; Class B 92.08k of 10M; D1 rows read 6.04M of 25 bn, written 1.27M of 50M, storage 0.03 of 5 GB-mo; usage cost $0.00. Workers Observability (logs) volume: NOT on that page, NOT read = missing.
