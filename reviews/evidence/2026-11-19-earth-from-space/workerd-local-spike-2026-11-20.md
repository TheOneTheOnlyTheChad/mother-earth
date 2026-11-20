# Local Workers-runtime spike (20 Nov 2026)

**What:** the branch's own `phase1/worker.js` (`9f350bc`, sha256 `ae355386…`) imported as a module by a small test Worker and run inside **workerd 1.20260730.1** (Cloudflare's open-source Workers runtime; via miniflare 4.20260730.0) in the cloud workspace. The test Worker fetched the real fixtures from a local stand-in that sends the `Warning` header, then ran `evFetch`, `evJpegScans`, `evPng`, `evDecode`, `evCompare`. Nothing left the machine. The spike files are not in the repo.

| Run | Outcome | Validation, wall ms (each) | workerd process RSS after, MB |
|---|---|---|---|
| start | | | 61.7 |
| 1 × day | ok, header read and equal | 741 (first call, includes start-up) | 151.5 |
| 1 × night | ok | 449 | 222.7 |
| 1 × dusk | ok | 354 | 225.7 |
| 6 in one invocation | all ok | 442, 359, 386, 310, 446, 323 | 258.8 |
| 12 in one invocation | all ok | 258 to 383 | 296.9 |
| 100 MB of ballast kept, then 1 | ok | 372 | 396.1 |
| 300 MB kept, then 1 | ok | 285 | 579.2 |
| 700 MB kept, then 1 | ok | 253 | 979.0 |
| 1,500 MB kept, then 1 | ok | 271 | 1,780.4 |

## What this establishes
- The validation code runs unchanged in the Workers runtime: its typed arrays, `DecompressionStream`, `crypto.subtle`, streams and header handling behave as in Node. Results (scans, agreement, served time) are identical to the Node suite's.
- Wall time for the validation in workerd on this machine is about 0.25 to 0.45 s after the first call.

## What it does NOT establish, and why a local test cannot
- **Local workerd enforces no 128 MB isolate limit.** It kept 1,500 MB of ballast and still decoded. So no local run can show whether production would refuse the decode.
- **Its memory did not fall between runs** (RSS rose from 152 to 297 MB over 21 decodes with nothing kept): with no limit there is no collection pressure. Production's collector under a 128 MB ceiling will behave differently, in a direction not measurable here.
- CPU here is this machine's, not Cloudflare's. Production reports CPU per invocation; a Worker cannot time its own synchronous work (its clock does not advance during it).
- The served-time header from EUMETSAT to a Cloudflare address is a property of the network path, not of the runtime.

Conclusion: an isolated **local** test is representative for "does the code run in this runtime" (yes) and not for capacity. Capacity and the header need Cloudflare's hosted runtime.
