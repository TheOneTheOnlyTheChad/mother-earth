#!/bin/bash
# Aircraft counts — the whole regression on the Mac itself, under macOS's own /bin/bash (3.2) and the Mac's node.
# No network is used and nothing is uploaded: the runner suite drives run.sh with a stub in place of node, and the collector
# suites are pure. Run from Terminal:  /bin/bash aircraft-mac-regression.sh     Results: results.txt next to this script.
cd "$(dirname "$0")" || exit 2
OUT=results.txt
NODE="$(command -v node 2>/dev/null)"; for c in /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.nvm/versions/node/"*/bin/node; do [ -z "$NODE" ] && [ -x "$c" ] && NODE="$c"; done
{
  echo "aircraft regression on $(uname -s) $(uname -r), /bin/bash $(/bin/bash -c 'echo $BASH_VERSION'), node $("$NODE" -v 2>/dev/null || echo none), started $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "sha256 of the files under test:"; for f in run.sh collector-mac.mjs aircraft-schedule.test.sh aircraft-counts.test.mjs duration-contract.test.mjs worker.js; do printf '  %s  %s\n' "$(shasum -a 256 "$f" 2>/dev/null | cut -d' ' -f1)" "$f"; done
  echo "--- runner suite, no break"; /bin/bash aircraft-schedule.test.sh 2>&1 | tail -n 40
  for b in aircraft-first no-guard no-kill no-budget dry-free no-switch stale-clock manual-no-guard ledger-unchecked once-ignored; do
    echo "--- BREAK=$b (must fail)"; BREAK=$b /bin/bash aircraft-schedule.test.sh 2>&1 | grep -E '^FAIL|passed|did not apply|unknown break' | cut -c1-120
  done
  echo "--- collector suite"; "$NODE" aircraft-counts.test.mjs 2>&1 | tail -n 12
  echo "--- ships duration contract"; "$NODE" duration-contract.test.mjs 2>&1 | tail -n 1
  echo "finished $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$OUT" 2>&1
tail -n 3 "$OUT"; echo "results written to $(pwd)/$OUT"
