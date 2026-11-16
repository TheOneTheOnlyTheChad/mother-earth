# Wind range-request probe — plan (written 16 Nov 2026 14:29 UTC, clock reading)

**Question:** why did hub 0.6.16 twice fail to finish reading the first wind field of run 2026111606 (STATUS, 16 Nov 14:21 and 14:23 UTC)? Suspected, not proven: the `cf: { cacheTtl: 0 }` setting on the request. GPT's review (relayed by Chad, 16 Nov) asked for the probe first, with the object and range pinned, one Worker for all requests, the same User-Agent and 30-second limit, and only the cache setting changed.

**Control, already taken (read-only, from the browser pane, 14:27:34 UTC):** the same range of the same object read straight from the mirror: 206, headers after 309 ms, all 959,100 bytes after 1,528 ms, sha256 `83eb6f5e…1386`, starts "GRIB". So the mirror serves this range normally to a browser.

**Pinned in the file:** object `gfs.20261116/06/atmos/gfs.t06z.pgrb2.0p25.f000` (497,550,596 bytes, ETag `"9db02525a99a3da5703e33e26f82a9d0"`, last modified 09:32:57 UTC); index line 585 (UGRD, 10 m above ground, anl); bytes 410321002–411280101 (959,100 bytes). Index sha256 `d9678a48…98a1` (696 lines, 31,809 bytes).

## Files
- `range-probe.src.mjs` — source. `build.sh` fills in the expiry and the key's hash. `range-probe-worker.mjs` — the built Worker (the file to deploy). `local-test.mjs` — local test against a fake mirror (19 checks pass).
- Access: GET `/` only, header `x-probe-key` (only its SHA-256 is in the file; the key is in Claude's workspace, not in the repo), header `x-probe-sequence` one letter. Anything else: 404 or 400 and **no upstream request**. Expires 17 Nov 12:00 UTC. No bindings, no schedule, no storage.

## Sequences (each step: hub's User-Agent, hub's 30 s abort signal, the pinned range)
| Letter | Steps | Why |
|---|---|---|
| A | range with `cf: { cacheTtl: 0 }`, then range with no cache setting | the hub's request, then the one change |
| B | the same two, reversed | order effect |
| C | range with `cache: 'no-store'` | Cloudflare's documented bypass, as a candidate fix |
| D | HEAD with the cf setting, then range with the cf setting | the hub's own order (object check first) |
| E | HEAD with the cf setting, then range with no cache setting | does the object check alone spoil the next request |

Each range step records: time to headers, the headers, time to first and last chunk, bytes received, and either the hash of the complete body or the error. The probe reads in chunks to count bytes; the hub reads with `arrayBuffer()`. The request is the same.

## Order of running
1. **A.** 2. **B** if A's two steps differ (GPT's order check). 3. **C** if the cf step fails in either. 4. **D, then E,** only if the cf range step completes in A and B, so the cause lies elsewhere.
At most five keyed requests, at most two upstream requests each, under 1 MB delivered each. A failing cf step takes the full 30 s.

## What it cannot show
How many bytes Cloudflare pulled from NOAA upstream; only what reached the Worker. One location, one object, one afternoon.
