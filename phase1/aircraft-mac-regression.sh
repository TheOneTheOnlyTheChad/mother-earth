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
  for b in aircraft-first no-guard no-kill no-budget dry-free no-switch stale-clock manual-no-guard ledger-unchecked once-ignored no-probe manual-no-probe portal-ok probe-no-kill probe-no-backoff; do
    echo "--- BREAK=$b (must fail)"; BREAK=$b /bin/bash aircraft-schedule.test.sh 2>&1 | grep -E '^FAIL|passed|did not apply|unknown break' | cut -c1-120
  done
  echo "--- live home-network probe (the REAL curl against our receiver; read-only; shows where this Mac is right now)"
  t0=$(date +%s); out=$(perl -e 'alarm shift; exec @ARGV' 6 /usr/bin/curl -fsS -m 4 http://adsb-feeder.local:8080/data/aircraft.json 2>&1 | head -c 512); rc=$?
  case "$out" in *'"now"'*'"aircraft"'*) echo "  receiver answered with aircraft JSON in $(( $(date +%s) - t0 )) s: HOME (first bytes: $(printf '%s' "$out" | tr -d '\n' | cut -c1-40))" ;; *) echo "  receiver did not answer with aircraft JSON in $(( $(date +%s) - t0 )) s: NOT HOME (curl said: $(printf '%s' "$out" | tr -d '\n' | cut -c1-80))" ;; esac
  echo "  curl: $(command -v curl)  perl: $(command -v perl)"
  echo "--- collector suite"; "$NODE" aircraft-counts.test.mjs 2>&1 | tail -n 12
  echo "--- ships duration contract"; "$NODE" duration-contract.test.mjs 2>&1 | tail -n 1
  echo "finished $(date -u +%Y-%m-%dT%H:%M:%SZ)"
} > "$OUT" 2>&1
tail -n 3 "$OUT"; echo "results written to $(pwd)/$OUT"
