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

## Order of running (rev 2, 14:31 UTC: GPT's clarification, relayed by Chad)
1. **A** always.
2. **If A's two steps differ:** run **B** (reverse order). If the cf step fails in either A or B, run **C**.
3. **If both steps of A complete and match the browser hash:** skip B; run **D**, then **E**, to test whether the object check before the range matters.
4. If every probe request succeeds, the hub failure stays unexplained (the probe reads in chunks, the hub with `arrayBuffer()`); say so and stop.

**Cap: at most five keyed requests in all**, whatever the results. The Worker itself would accept more with the key until it expires, so the cap is kept by the person running it, and the Worker is deleted when the run ends. At most two upstream requests per keyed request, under 1 MB delivered each. A failing cf step takes the full 30 s. `WIND_ENABLED` stays unset; results go back to GPT before any hub change.

## What it cannot show
How many bytes Cloudflare pulled from NOAA upstream; only what reached the Worker. One location, one object, one afternoon.

## Result — run 16 Nov 2026, 14:32–14:35 UTC (written 14:35 UTC, clock reading)

Run on Chad's own line: "Approve: create temporary Worker mother-earth-wind-range-probe from commit b94c191 (docs/research/global-wind-range/range-probe-worker.mjs, sha256 51ccabd7…b7d1; no bindings, no schedule, no storage), run up to five keyed read-only sequences per its README rev 2, then delete the Worker".

**The cache setting is the cause. With `cf: { cacheTtl: 0 }` the range request gets its headers and then no body at all; without it, or with `cache: 'no-store'`, the same request completes in about 2.4 s with the right bytes. Order makes no difference.**

| Step | Time (UTC, clock) | Evidence |
|---|---|---|
| Source checked, Worker created | 14:32:39–14:32:42 | file fetched from GitHub at `b94c191`, 7,103 bytes, sha256 `51ccabd7…b7d1` matched; account held only `mother-earth` before; handlers `fetch` only; bindings none; schedules none; workers.dev address on, previews off |
| No key | 14:33:11 | 404 "not found" |
| Keyed 1: **A** | 14:33:11–14:33:43 | ray `a5b73596ddfcf732-JNB` |
| Keyed 2: **B** | 14:33:52–14:34:24 | ray `a5b7369658bff732-JNB` |
| Keyed 3: **C** | 14:34:24–14:34:27 | ray `a5b737618d06f732-JNB` |
| Worker deleted | 14:34:36 | delete answered success; account again holds only `mother-earth`; the address returns Cloudflare's own 404 (14:34:53) |

Every step: status 206, Content-Range, Content-Length and ETag exactly as pinned; hub's User-Agent; 30 s abort signal; all served from Johannesburg.

| Sequence | Step | Cache setting | cf-cache-status | Headers after | Bytes handed to the Worker | Outcome |
|---|---|---|---|---|---|---|
| A | 1 | `cf: { cacheTtl: 0 }` | REVALIDATED | 1,090 ms | **0** (no chunk) | **not finished: TimeoutError at 30,000 ms** |
| A | 2 | none | DYNAMIC | 1,142 ms | 959,100 in 247 chunks | complete at 2,480 ms; sha256 equals the browser read |
| B | 1 | none | DYNAMIC | 1,106 ms | 959,100 in 241 chunks | complete at 2,465 ms; sha256 equals the browser read |
| B | 2 | `cf: { cacheTtl: 0 }` | REVALIDATED | 1,114 ms | **0** (no chunk) | **not finished: TimeoutError at 30,000 ms** |
| C | 1 | `cache: 'no-store'` | DYNAMIC | 1,075 ms | 959,100 in 241 chunks | complete at 2,370 ms; sha256 equals the browser read |

**What this shows**
- The hub's failure is reproduced outside the hub, twice, in both orders, and removed by changing only the cache setting. User-Agent and the 30 s limit are ruled out (identical in every step).
- With the setting, the response goes through Cloudflare's cache path ("REVALIDATED") and not one byte of body reaches the Worker in 30 s. Without it the response is "DYNAMIC" (not cached) and streams at once.
- The chunked read here and the hub's `arrayBuffer()` fail the same way with the setting, so the reading method is not the cause.
- D and E were not run: the plan called for them only if the cf step had completed. **Three keyed requests used of five; six upstream requests; about 2.9 MB delivered.**

**Not shown**
- What Cloudflare was doing during the 30 s (for example fetching the whole 497 MB object to serve the slice). The probe sees only what reached the Worker.
- Whether the setting also harms the hub's index request and object check: on the hub both passed with it, twice. Those are a 32 kB file and a HEAD.
- Other runs, other locations, other days. One object, one afternoon, Johannesburg.
- The morning probe (§11 of the gate) sent no cache setting, which is why it passed.

**Candidate fixes for the hub (not made; for GPT):** on the wind requests, send `cache: 'no-store'` (Cloudflare's documented bypass; passed here) or no cache setting (passed here, and passed all six fields this morning). The suites' fake mirror cannot tell these apart, so the proof stays a live run.

The probe key was used for the three requests and has been deleted from Claude's workspace.
