#!/usr/bin/env bash
# (1) negative controls — each deliberately broken copy must make its scenario FAIL; (2) legacy pipeline at the same low caps,
# for contrast (old bench.mjs on the main-branch worker = live 0.5.3 without the export line); (3) the R2 probe route in workerd.
set -u
NC=${NC:-results-v2-negative.jsonl}; LG=${LG:-results-legacy-lowcap.jsonl}
for v in "nc-commit-fenced collect" "nc-by-hour-wrong collect" "nc-records-truncated collect" "nc-sidecar-count-wrong checkpoint" "nc-place-scan-throws overlap" "nc-no-legacy-checkpoint legacy-transition"; do
  set -- $v; MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=128" WORKER_FILE=./$1.js timeout 600 node bench-v2.mjs data/real.csv $2 2>/dev/null | grep "^{" | tail -1 | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); d['negative_control']='$1'; print(json.dumps(d))" >> "$NC"
done
for r in 1 2; do for cap in 48 64; do for f in real 8mib; do for s in collect collect+checkpoint-overlap stress-2-collects; do
  MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=$cap" WORKER_FILE=./worker-legacy.js timeout 600 node bench-legacy.mjs data/$f.csv $s 2>/dev/null | grep "^{" | tail -1 >> "$LG"
done; done; done; done
