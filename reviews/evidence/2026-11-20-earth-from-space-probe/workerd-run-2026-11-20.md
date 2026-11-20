# The probe file run inside workerd (local), 20 Nov 2026

`node evprobe-workerd-run.mjs <miniflare>` with miniflare 4.20260730.0 / workerd 1.20260730.1 on the cloud workspace. EUMETView replaced by the fixtures (2048 px: the real day frame; 1536 px: that frame resized). **Shows that phase1/evprobe.js loads and runs as a Worker with no bindings, makes three requests a run, and cannot be called over HTTP. Shows nothing about memory capacity: local workerd enforces no limit, which is why the 96 MiB runs complete here.** The wall times are local and are not CPU measurements.

```
HTTP request to the Worker -> 500 Error: Handler does not export a fetch() function. at async Object.fetch (file:///home/claude/wd/node_modules/minifl
| Slot | Phase | Size | Ballast MiB | Requests | Lines | Outcome | Validation wall ms | Memory intact |
|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 2048 |  | 3 | start fetched validate-begin validated done | validated | 392 |  |
| 1 | 1 | 1536 |  | 3 | start fetched validate-begin validated done | validated | 275 |  |
| 36 | 2 | 2048 |  | 3 | start fetched validate-begin validated validate-begin validated validate-begin validated validate-begin validated validate-begin validated validate-begin validated done | validated | 314, 383, 292, 300, 325, 328 |  |
| 37 | 2 | 1536 |  | 3 | start fetched validate-begin validated validate-begin validated validate-begin validated validate-begin validated validate-begin validated validate-begin validated done | validated | 226, 219, 173, 176, 168, 176 |  |
| 46 | 3 | 2048 | 16 | 3 | start ballast fetched validate-begin validated done | validated | 382 | true |
| 47 | 3 | 1536 | 16 | 3 | start ballast fetched validate-begin validated done | validated | 194 | true |
| 50 | 3 | 2048 | 48 | 3 | start ballast fetched validate-begin validated done | validated | 312 | true |
| 51 | 3 | 1536 | 48 | 3 | start ballast fetched validate-begin validated done | validated | 190 | true |
| 56 | 3 | 2048 | 96 | 3 | start ballast fetched validate-begin validated done | validated | 272 | true |
| 57 | 3 | 1536 | 96 | 3 | start ballast fetched validate-begin validated done | validated | 221 | true |
| 66 | — | — |  | 0 | excluded | excluded |  |  |
| -3 | — | — |  | 0 | not started | not started |  |  |
| 75 | — | — |  | 0 | expired | expired |  |  |
other output: [{"stderr":"Received a FetchEvent but we lack a handler for FetchEvents. Did you remember to export a fetch() function?"}]
```
