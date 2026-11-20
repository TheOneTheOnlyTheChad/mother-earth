# Decoder memory and CPU, corrected (rev 2, 20 Nov 2026; two statements revised the same day after GPT's review of `b588071`, marked below)

Replaces the memory figures of `decoder-measurements-rev1-superseded.jsonl` and of packet rev 1 §4. Raw output: `decoder-measurements-rev2.jsonl` (nine runs: three real frames × three modes). Script: `phase1/earthview-decoder-measure.mjs`. Node v22, 2 vCPU cloud workspace. **None of this is a measurement inside a Cloudflare Worker.**

## What was wrong in rev 1 (GPT, review of `ef33a18`)
1. The script added `heapUsed + arrayBuffers + external`. Node's `external` already includes `arrayBuffers`, so array storage was counted twice. The "80.7 MB" was about 60 MB of counters plus about 31 MB counted a second time, less the baseline.
2. That figure was read once, when the decode returned. It was not a peak, and it was called one.
3. Rev 1 said an overrun "would kill that run only". That is not established and is withdrawn (see "Shared isolate" below).

## Counters, as Node reports them (MB of 1,048,576 bytes)
`js` = `heapUsed + external`. `arrayBuffers` is shown and is part of `external`; it is not added.

| Frame | Mode | Before: js / rss | When decode returns: heapUsed / external (of which arrayBuffers) / js | After a forced collection, result still held: js (over before) | Peak reading: heapUsed / external / js (over before) | Process maxRSS before → after |
|---|---|---|---|---|---|---|
| day | plain | 8.67 / 51.55 | 27.06 / 32.94 (31.05) / 60.00 | 15.75 (+7.08) | not measured in this mode | 52.4 → 130.8 |
| day | sampled | 8.67 / 51.41 | 29.38 / 32.94 (31.05) / 62.32 | 15.76 (+7.09) | 29.38 / 32.94 / **62.32 (+53.65)** | 52.3 → 136.2 |
| day | live | 8.67 / 51.43 | 6.80 / 8.94 (7.05) / 15.74 | 15.75 (+7.08) | 25.11 / 32.91 / **58.02 (+49.35)** | 52.3 → 132.9 |
| night | plain | 8.53 / 51.68 | 26.47 / 32.80 (30.91) / 59.27 | 15.61 (+7.08) | not measured | 52.6 → 130.2 |
| night | sampled | 8.53 / 51.06 | 29.82 / 32.80 (30.91) / 62.62 | 15.62 (+7.09) | 29.81 / 32.80 / **62.61 (+54.08)** | 52.0 → 140.4 |
| night | live | 8.53 / 51.08 | 6.80 / 8.80 (6.91) / 15.60 | 15.61 (+7.08) | 25.10 / 32.77 / **57.87 (+49.34)** | 52.0 → 132.8 |
| dusk | plain | 8.64 / 51.46 | 26.48 / 32.92 (31.03) / 59.40 | 15.72 (+7.08) | not measured | 52.4 → 138.5 |
| dusk | sampled | 8.64 / 51.52 | 28.89 / 32.92 (31.03) / 61.80 | 15.73 (+7.09) | 28.89 / 32.92 / **61.80 (+53.16)** | 52.4 → 137.5 |
| dusk | live | 8.64 / 51.31 | 6.80 / 8.92 (7.03) / 15.71 | 15.73 (+7.09) | 25.11 / 32.89 / **57.99 (+49.35)** | 52.2 → 132.3 |

## Three different things, kept apart
- **Returned footprint: about 7.1 MB over the baseline.** What stays in memory after the decode while its result (the three planes) is held, once garbage is collected. All three frames agree.
- **Peak of JavaScript-accounted memory during the decode: about 49 MB over the baseline with collections forced ("live"), about 54 MB as the run happens ("sampled").** 402 readings per run: every 256th of the decoder's 102,431 typed-array allocations and around each allocation of 1 MB or more. The decoder allocates 30 MB of typed arrays in total. A reading can miss a higher instant between two readings, which is why this is a sampled peak and not a guaranteed maximum. "Sampled" includes garbage a collector under pressure would reclaim; "live" is closer to what cannot be reclaimed.
- **Process resident memory (RSS): rises by about 78 to 88 MB**, to 130 to 140 MB. RSS is the whole Node process as the operating system sees it: allocator overhead, freed memory not yet returned, the JIT, Node itself. It is not a JavaScript memory figure and is larger than one.

## Against the Worker limit
- Cloudflare's limits page: 128 MB per isolate, "including the JavaScript heap and WebAssembly allocations"; per isolate, not per invocation; one isolate can handle many concurrent requests. Its changelog of 30 Jun 2026 describes the dashboard's Memory usage figure as the V8 isolate memory at the time of each invocation, under that limit.
- **The live hub today** (dashboard, last 24 hours, read 20 Nov 04:51 UTC; `cloudflare-dashboard-read-2026-11-20.json`): memory usage P50 2.69 MB, P90 3.24 MB, P99 and P99.9 16.86 MB; "Exceeded Memory" 0 in 3,090 invocations.
- **Revised (GPT, review of `b588071`).** The dashboard's 16.86 MB is a reported P99 and P99.9 over 24 hours. It is not the highest memory the hub used and not a maximum; the page gives no maximum. An earlier version of this file added it to the sampled readings and called the sum a figure against the limit: **that sum is withdrawn.** The two numbers come from different runtimes and different kinds of reading, and no combined maximum or available headroom has been measured.
- **Revised (GPT).** The rise in Node's process RSS (about 78 to 88 MB) is an observation of another runtime's whole process. An earlier version called it a "pessimistic bound" for a Worker: **withdrawn.** Nothing here bounds a Worker's memory from above or below.
- The readings taken with a forced collection before each one ("live") are sampled observations under collection behaviour altered by the forcing. They are not how the code runs, in Node or in a Worker.
- The dashboard figure is taken "at the time of each invocation", so it may not show a peak inside one. A production trial would have to be judged by "Exceeded Memory" counts and by the run's own outcome, not by that chart alone.

## Shared isolate (caveat retained)
The limit is on the isolate. The same isolate may be serving page requests (`/snapshot/…`, `/cells/…`, `/place/…`) and running other scheduled work while a collection decodes. Cloudflare's page says that when an isolate exceeds the limit the runtime lets in-flight requests finish and creates a new isolate, and that under very high load some incoming requests may be cancelled. So an overrun **cannot be described as affecting only the collecting run**: other work in that isolate at that moment could be affected, and Cloudflare returns error 1102 for an invocation that exceeds memory. The collection itself rides the five-minute trigger after the earthquake collector has finished; that orders the two jobs, it does not isolate them from other requests.

## CPU (uninstrumented "plain" runs)
Whole validation 348 to 375 ms: structure walk about 1 ms, JPEG decode about 330 to 350 ms, comparison about 10 to 20 ms. The live hub's CPU time today: P50 3.55 ms, P99 244 ms.

## What this does and does not support
- It supports: in Node, the largest sampled reading of JavaScript-accounted memory during the decode is about 49 to 55 MB over baseline at 2,048 px, not 80 MB. GPT's own run of the day frame on the Mac (Node v24.14.1, GPT's figures): 55.23 MiB sampled increase over 402 readings, 7.15 MiB retained.
- It does not support choosing a decoder option or a production trial by itself: no number here was measured in a Worker. Worker memory, CPU, the effect of concurrent requests in the isolate, and the served-time header for this layer and projection all remain unverified. A smaller picture, a modified decoder and a WebAssembly decoder remain unmeasured.
