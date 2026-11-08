#!/usr/bin/env bash
# runs 2 and 3 on the final worker, production-relevant files, caps 80 and 128 (+ one 64 MiB row at 128)
OUT=results-v2-runs23.jsonl
jobs() { for r in 2 3; do for cap in 80 128; do
  for f in real 8mib dense-8mib; do for s in collect checkpoint overlap stress-2-collects injected-reset injected-truncated-row; do echo "$cap worker-v2.js data/$f.csv $s"; done; done
  echo "$cap worker-v2.js data/real.csv legacy-transition"; echo "$cap worker-v2-fetch5s.js data/real.csv injected-reset-cl"
done; echo "128 worker-v2-guard1g.js data/64mib.csv overlap"; done; }
jobs | xargs -P 2 -L 1 bash -c 'MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=$0" WORKER_FILE=./$1 timeout 600 node bench-v2.mjs $2 $3 2>/dev/null | grep "^{" | tail -1 || echo "{\"file\":\"$2\",\"scenario\":\"$3\",\"verdict\":\"FAIL\",\"fail\":[\"no result line\"],\"tested\":{\"v8_flags\":\"--max-heap-size=$0\",\"worker_file\":\"$1\"}}"' >> "$OUT"
