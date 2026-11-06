#!/usr/bin/env bash
# FIRMS v2 bench matrix (run from the bench dir: miniflare 4.20260730.0, data/, schema.sql, bench-v2.mjs, worker copies).
# worker-v2.js         = branch worker.js without the test-only export line (production guard 8 MiB)
# worker-v2-fetch5s.js = the same with the download timeout at 5 s — BENCH ONLY, for the stalled-download case
# worker-v2-guard1g.js = the same with FIRMS_MAX_PARSE_BYTES = 1 GiB — BENCH ONLY, for files above 8 MiB
# Output: one JSON line per run in $OUT. Two runs in parallel (2 cores).
set -u
OUT=${OUT:-results-v2.jsonl}; RUNS=${RUNS:-3}; CAPS=${CAPS:-"48 64 80 128"}
SCEN="collect checkpoint overlap stress-2-collects injected-reset injected-truncated-row"
jobs() {
  for r in $(seq 1 $RUNS); do for cap in $CAPS; do
    for f in real 8mib dense-8mib; do for s in $SCEN; do echo "$cap worker-v2.js data/$f.csv $s"; done; done
    for f in 16mib 32mib 64mib; do for s in $SCEN; do echo "$cap worker-v2-guard1g.js data/$f.csv $s"; done; done
    echo "$cap worker-v2.js data/real.csv legacy-transition"
    echo "$cap worker-v2-fetch5s.js data/real.csv injected-reset-cl"   # bench copy: download timeout 5 s instead of 180 s
  done; done
}
jobs | xargs -P 2 -L 1 bash -c 'MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=$0" WORKER_FILE=./$1 timeout 600 node bench-v2.mjs $2 $3 2>/dev/null | grep "^{" | tail -1 || echo "{\"file\":\"$2\",\"scenario\":\"$3\",\"verdict\":\"FAIL\",\"fail\":[\"no result line (timeout or crash)\"],\"tested\":{\"v8_flags\":\"--max-heap-size=$0\",\"worker_file\":\"$1\"}}"' >> "$OUT"
