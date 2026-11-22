# Stage B: Cloudflare's CPU and memory percentiles for the observation hours (read 22 Nov 2026)

**Why this file exists.** Proposal rev 2.1 section 4 lists "the dashboard's memory and CPU percentiles for the hour, as
percentiles" among the health reads. The Stage B result of 21 Nov (`fabf81c`) did not contain them and did not say why.
GPT's review of 22 Nov found the gap. They were **not captured on the day**: an omission, not an unavailability. They
are historical figures Cloudflare keeps, so they were read afterwards, at **2026-11-22T03:46:59Z and 03:47:27Z** (pane
clock), read-only, with no call to the hub.

**Source.** Cloudflare's GraphQL Analytics API, dataset `workersInvocationsAdaptive`, script `mother-earth`, from the
signed-in dashboard tab (`POST /api/v4/graphql`). This is the dataset behind the Workers Metrics tab's CPU and Memory
usage charts (Cloudflare's metrics documentation and its changelog entry of 30 Jun 2026 name the dataset and the
`quantiles.memoryUsageBytesP50` to `P999` fields). The dashboard charts themselves were not looked at on screen.

**Files.**
- `dashboard-percentiles-hourly.txt`: hourly rows for 21 Nov 10:00 to 21:59 UTC, the same hours of 20 Nov (hub 0.6.19,
  before the probe route existed) for comparison, and the five-minute buckets that cover each assessment interval.
  Transcribed from the pane's output. The pane-side sha256 of the raw API answers was
  `abe304adcd4781e95002d57e4b364cb4f1ad7096365885444ac2de3e2a13415a` (23,882 bytes); the raw answers could not be
  exported, so that hash cannot be recomputed from this repo and is recorded only as a note. One row (12:25) was
  damaged by a display filter in that read and is taken from the second read instead.
- `dashboard-percentiles-by-event-type.txt`: per-minute rows around each call and the three observation hours, split by
  event type (`fetch` or `cron`). sha256 `9d52aa9063ef2260cef1688c88dd6abaae92abe2215f777e71130e39a8e75cab`, computed in
  the pane and recomputed on the copy here: equal. Columns: bucket; status; event type; requests; errors; full GC count;
  max CPU (us); max memory (bytes); max Wasm memory; max GC time (us); CPU P50, P90, P99, P999 (us); memory P25, P50,
  P90, P99, P999 (bytes).

## The observation hours (21 Nov, all invocations of the hub)

| Hour UTC | Invocations | Errors | Status values | CPU P50 | CPU P90 | CPU P99 | CPU P999 | Memory P50 | Memory P90 | Memory P99 | Memory P999 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 12 (obs 1) | 125 | 0 | success only | 3.7 ms | 11.3 ms | 185 ms | 827 ms | 3.16 MB | 3.43 MB | 16.2 MB | 54.8 MB |
| 16 (obs 2) | 118 | 0 | success only | 3.8 ms | 11.4 ms | 588 ms | 814 ms | 3.16 MB | 3.43 MB | 34.8 MB | 54.8 MB |
| 20 (obs 3) | 136 | 0 | success only | 3.8 ms | 10.4 ms | 535 ms | 821 ms | 3.16 MB | 3.43 MB | 31.3 MB | 54.4 MB |

MB here is bytes / 1,000,000. Cloudflare's limit is 128 MB per isolate.

## The minute of each call (by event type)

| Call | Minute UTC | Event type | Invocations | Max CPU | Max memory | Full GCs |
|---|---|---|---|---|---|---|
| obs 1 | 12:21 | fetch | 3 | 827,130 us | 54,827,181 bytes | 1 |
| obs 2 | 16:07 | fetch | 3 | 587,889 us | 54,818,477 bytes | 1 |
| obs 2's minute, the hourly job | 16:07 | cron | 1 | 814,174 us | 34,791,643 bytes | 4 |
| obs 3 | 20:21 | fetch | 2 | 820,742 us | 54,423,159 bytes | 1 |

The max CPU figures equal the CPU on each probe's invocation record (827, 587, 820 ms) and on the 16:07:58 hourly job
(814 ms), so the highest-memory row in each of those minutes is taken to be the same invocation. That is an inference
from equal figures in a bucket of two or three invocations: the dataset does not name the invocation.

## What it shows

1. **No invocation of the hub in any of these hours had a status other than `success`**, and the error count is 0 in
   every bucket. This agrees with the invocation records already in the observation files.
2. **The probe's isolate held about 54.4 to 54.8 MB at the probe's invocation**, in all three runs. That is the highest
   memory figure of the whole day's hours read here, and about 43% of the 128 MB limit.
3. **Other work reaches similar order.** Hours without a probe peak at about 47.5 MB (11, 13, 15, 19, 21 UTC on 21 Nov;
   the same on 20 Nov under hub 0.6.19), and the heavy hourly job at 16:07 on 21 Nov shows 34.8 MB.
4. Wasm memory is 0 throughout.

## What it does not show

- Cloudflare describes the figure as the V8 isolate's memory "at the time of each invocation" and the percentiles as
  reservoir-sampled. It is **one reading per invocation, not a peak inside the invocation**. Decoding could have
  touched more than 54.8 MB for a moment and this figure would not show it.
- The three probes ran in isolates that had run no scheduled job (0 scheduled runs each). The figures therefore say
  nothing direct about a probe and a heavy job **in one isolate**. Adding 54.8 MB and 34.8 MB gives about 90 MB, under
  the limit, but memory does not have to add like that and this is arithmetic, not an observation.
- Three readings are still three readings.

## Effect on the Stage B verdict

The health read that section 4 asked for is now on file, late. It contains no not-met condition (no `exceededMemory`,
no `exceededCpu`, no non-success status). The verdict stays as written, **met by the letter**, with the limits already
stated; the memory limit is now better described: "a reading of about 55 MB per probe invocation, no peak figure, no
shared-isolate figure" in place of "nothing known".
