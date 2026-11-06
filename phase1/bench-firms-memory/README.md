# FIRMS memory bench (6 Nov 2026) — the evidence behind `FIRMS_MAX_PARSE_BYTES = 8 MiB`

Runs the hub's real `worker.js` in **workerd** (the open-source Workers runtime) through Miniflare **4.20260730.0** (workerd build 2026-07-30), local R2 + D1, FIRMS served from a file. **No forced GC.** One scenario per process, because a failure kills the runtime.

## Setup (container)
```
mkdir wbench && cd wbench && npm init -y && npm i miniflare@4.20260730.0
cp <repo>/phase1/schema.sql .
# worker.js with the named `export { … }` line removed (test-only exports; see "Runtime differences")
python3 -c "import re;s=open('<repo>/phase1/worker.js').read();open('worker.js','w').write(re.sub(r'^export \{[^\n]*\};?\s*$','',s,flags=re.M))"
cp <repo>/phase1/bench-firms-memory/bench.mjs .
MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=128" node bench.mjs data/real.csv realistic-overlap
```

## Inputs
| file | bytes | rows | what |
|---|---|---|---|
| `real.csv` | 5,311,642 | 63,614 | **the actual 5 Nov payload**: R2 `raw/firms/2026-11-05T23-45Z.csv`, sha256 `c3487dcc3e063db3…` (via Chad's Downloads, hash checked) |
| `8mb.csv` | 8,388,543 | 100,484 | the real file's own rows repeated in order, cut at a row boundary (≤ 8 MiB) |
| `10mb.csv` | 10,485,749 | 125,593 | same method |
| `12mib.csv` | 12,582,836 | 150,757 | same method (≤ 12 MiB) |
Not committed (data). Rebuild the scale-ups from the real file with the method above.

## Scenarios (`bench.mjs <csv> <scenario>`)
| scenario | what runs concurrently in one isolate |
|---|---|
| `collect` | one firms collect: fetch → parse → envelope → snapshot / latest / cells writes |
| `checkpoint` | a **down** firms run that checkpoints a closed day (snapshot read → JSON.parse → gzip → firesDaily → D1 → coverage) |
| `backfill` | coverage assessed later: gunzip the stored checkpoint, re-read its records |
| `realistic-overlap` | a visitor's **resident `/place` index** (placeCache) + one collect + `/place` + `/snapshot/firms` + a usgs run |
| `collect+checkpoint-overlap` | resident `/place` index + a collect that also checkpoints a closed day + usgs + `/place` |
| `stress-2-collects` | resident `/place` index + **two** overlapping collects (scheduled + manual) + `/place` + `/snapshot` |

## The cap
`MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=<MB>"` caps V8's **total** heap; the isolate dies with "JavaScript heap out of memory" past it (checked: 100 MB held passes, 140 MB fails at a 128 cap). An earlier sweep used `--max-old-space-size` — that caps only the old generation (young generation on top), so its passes were optimistic; it is kept as `results-old-space-only-…` and **not** used for the decision.

## Result — total-heap cap, 2 runs per cell (`results-total-heap-2026-11-06.jsonl`)
Smallest cap at which a scenario passed 2/2 (caps tried 64 · 80 · 96 · 112 · 128 MB):
| scenario | real 5.3 MB | 8 MiB | 10 MB | 12 MiB |
|---|---|---|---|---|
| collect | 64 | 64 | 64 | 64 |
| checkpoint | 64 | 64 | 64 | 96 |
| backfill | 64 | 64 | 64 | 96 |
| realistic-overlap | 64 | 64 | 80 | 96 |
| collect+checkpoint-overlap | 64 | **80** | 96 | 112 |
| stress-2-collects | 64 | 64 | 80 | **fails at 128 (1 of 2)** |
→ **8 MiB: every scenario passes 2/2 at an 80 MB cap — 48 MB below Cloudflare's 128 MB.** 12 MiB is not supported.

## What this is and is not
- **Local Workers-runtime evidence**, not production. Production differences: compatibility date (bench 2026-07-30 vs the hub's 2026-10-01 — workerd refuses dates newer than its build); real R2/D1 latency; isolate placement (production may spread cron and request invocations over isolates — the bench forces them into one); the 128 MB in production covers the whole isolate footprint, the bench caps the V8 heap.
- **Heap samples are lower bounds**: the inspector cannot answer while the isolate runs synchronous JS (some "collect" samples read ~1 MB). Pass/fail under the cap is the verdict; sampled peaks are context only.
- **Node measurements** (earlier, `reviews/…firms-guard.md` §3) used forced GC and report *retained* memory; they are superseded for the limit decision. Transient allocations are real memory: before a collection runs they count against the limit as much as retained objects do.
- **Real-platform figures** so far: Worker Metrics memory P999 17.41 MB over 24 h on files ≤ 3.8 MB (6 Nov). After a deploy, the Memory chart and "Exceeded Memory" count **confirm** the limit; they are not the first validation.

## Runtime differences found
workerd 2026-07-30 refuses to start a module with a named export that is not a function or handler (`Incorrect type for map entry 'HIST_GRACE_MS'`) — **the live main (0.5.1) fails the same way locally**, and has run in production since 5 Nov. So the bench strips the test-only `export { … }` line; production behaviour is unchanged by it.
