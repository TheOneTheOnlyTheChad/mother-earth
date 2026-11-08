#!/usr/bin/env bash
# Re-bench after the GPT-review fixes (checkpoint hashing + sidecar validation/rebuild, publication checks, writer cleanup, health).
OUT=results-v2-fix.jsonl
jobs() {
  for cap in 48 64 80 128; do
    for f in real 8mib dense-8mib; do for s in collect checkpoint checkpoint-rebuild overlap stress-2-collects injected-truncated-row; do echo "$cap worker-v2.js data/$f.csv $s"; done; done
    for s in collect checkpoint checkpoint-rebuild overlap stress-2-collects injected-truncated-row; do echo "$cap worker-v2-guard1g.js data/64mib.csv $s"; done
    echo "$cap worker-v2.js data/real.csv legacy-transition"; echo "$cap worker-v2-fetch5s.js data/real.csv injected-reset-cl"
  done
  for r in 2 3; do for cap in 80 128; do for f in real 8mib dense-8mib; do for s in checkpoint checkpoint-rebuild overlap; do echo "$cap worker-v2.js data/$f.csv $s"; done; done; echo "$cap worker-v2.js data/real.csv legacy-transition"; done; done
}
jobs | xargs -P 2 -L 1 bash -c 'MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=$0" WORKER_FILE=./$1 timeout 900 node bench-v2.mjs $2 $3 2>/dev/null | grep "^{" | tail -1 || echo "{\"file\":\"$2\",\"scenario\":\"$3\",\"verdict\":\"FAIL\",\"fail\":[\"no result line\"],\"tested\":{\"v8_flags\":\"--max-heap-size=$0\",\"worker_file\":\"$1\"}}"' >> "$OUT"
NC=results-v2-fix-negative.jsonl
for v in "nc-commit-fenced collect" "nc-by-hour-wrong collect" "nc-records-truncated collect" "nc-sidecar-count-wrong checkpoint" "nc-rebuild-wrong checkpoint-rebuild" "nc-place-scan-throws overlap" "nc-no-legacy-checkpoint legacy-transition"; do
  set -- $v; MINIFLARE_WORKERD_V8_FLAGS="--max-heap-size=128" WORKER_FILE=./$1.js timeout 600 node bench-v2.mjs data/real.csv $2 2>/dev/null | grep "^{" | tail -1 | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); d['negative_control']='$1'; print(json.dumps(d))" >> "$NC"
done
echo FIX-BENCH-DONE
