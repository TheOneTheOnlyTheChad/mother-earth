#!/bin/bash
# Mother Earth — Mac collector runner. One shared lock for manual and scheduled runs; bounded logs; real exit status.
#
#   ./run.sh ships [--dry] [--window=60]   collect one sample now (manual)
#   ./run.sh mock                          synthetic sample (proves the path)
#   ./run.sh tick                          scheduler entry point (launchd, every minute): samples when ~30 min are due; retries a pending upload
#   ./run.sh status                        what the scheduler has been doing
#
# Keys come from ./KEYS.md (runtime copy) or ../KEYS.md (project record); nothing is typed in Terminal and nothing secret is ever logged.
# RUNTIME LOCATION (measured 1 Nov 2026): macOS denies launchd jobs access to ~/Documents ("Operation not permitted"), so the scheduled copy
# lives in ~/mother-earth/ (run.sh, collector-mac.mjs, KEYS.md, state/, logs/). The project folder keeps the source of truth; sync both.
# Files it keeps (all under phase1/, nothing else, no archive of samples):
#   state/scheduler.json   one small JSON: last sample time and result            (< 1 KB)
#   state/pending.json     at most ONE envelope awaiting upload, 2 h expiry        (≤ 5 MB, usually absent)
#   state/lock/            lock directory while a run is in progress               (0 bytes)
#   logs/collector.log     rotated: 1 MB × 4 files max                             (≤ 4 MB)
#   logs/launchd.log       scheduler stdout/stderr, rotated at 512 KB × 2           (≤ 1 MB)
# Maximum retained footprint: ~10 MB. Runtime (Node) is separate.
# Exit codes pass straight through from collector-mac.mjs: 0 uploaded · 3 source-down report uploaded · 1 upload failed (pending kept) · 2 config · 4 nothing pending · 5 lock held · 6 keys unreadable

set -u
cd "$(dirname "$0")" || exit 2
MODE="${1:-ships}"; shift || true
INTERVAL_S=1800                       # sample roughly every 30 min while the Mac is awake; no catch-up bursts
mkdir -p state logs

# ---- bounded logging
rotate() { local f="$1" max="$2" keep="$3"; [ -f "$f" ] && [ "$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")" -gt "$max" ] || return 0
  local i=$keep; while [ $i -gt 1 ]; do [ -f "$f.$((i-1))" ] && mv -f "$f.$((i-1))" "$f.$i"; i=$((i-1)); done; mv -f "$f" "$f.1"; }
rotate logs/collector.log 1048576 4
rotate logs/launchd.log 524288 2
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) [$MODE] $*" >> logs/collector.log; }

# ---- node: launchd has a minimal PATH, so resolve the absolute binary once and record it
NODE="$(command -v node 2>/dev/null)"
for c in /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.nvm/versions/node/"*/bin/node; do [ -z "$NODE" ] && [ -x "$c" ] && NODE="$c"; done
[ -x "${NODE:-}" ] || { log "node not found (PATH=$PATH)"; echo "node not found" >&2; exit 2; }

# ---- status: no lock needed
if [ "$MODE" = "status" ]; then
  echo "node: $NODE ($("$NODE" -v))"; echo "state: $(cat state/scheduler.json 2>/dev/null || echo none)"
  echo "pending: $([ -f state/pending.json ] && stat -f%z state/pending.json || echo none) bytes"; echo "lock: $([ -d state/lock ] && echo HELD || echo free)"
  echo "logs: $(du -sh logs 2>/dev/null | cut -f1)"; tail -n 5 logs/collector.log 2>/dev/null; exit 0
fi

# ---- keys (never echoed)
KEYS_FILE="${KEYS_FILE:-$([ -f ./KEYS.md ] && echo ./KEYS.md || echo ../KEYS.md)}"   # runtime copy next to the script (~/mother-earth) or the project record (../KEYS.md)
keyval() { grep -m1 "^| $1" "$KEYS_FILE" 2>/dev/null | awk -F'|' '{gsub(/ /,"",$3); print $3}'; }
INGEST_KEY="$(keyval INGEST_KEY)"; AISSTREAM_KEY="$(keyval AISSTREAM_KEY)"
if [ -z "$INGEST_KEY" ] || [ -z "$AISSTREAM_KEY" ]; then log "keys unreadable from $KEYS_FILE (background access to ~/Documents denied? ingest=${#INGEST_KEY} ais=${#AISSTREAM_KEY} chars)"; echo "keys unreadable" >&2; exit 6; fi
export INGEST_KEY AISSTREAM_KEY

# ---- one shared lock (mkdir is atomic); a lock older than 10 min is from a crashed run
if ! mkdir state/lock 2>/dev/null; then
  if [ -n "$(find state/lock -maxdepth 0 -mmin +10 2>/dev/null)" ]; then log "stale lock removed"; rmdir state/lock 2>/dev/null; mkdir state/lock 2>/dev/null || exit 5
  else [ "$MODE" = "tick" ] || echo "another run is in progress (state/lock); try again in a minute" >&2; exit 5; fi
fi
trap 'rmdir state/lock 2>/dev/null' EXIT

run_collector() {   # $1 = layer/mode, rest = flags
  "$NODE" collector-mac.mjs "$@" --quiet --state=state >> logs/collector.log 2>&1; return $?
}
record() { printf '{"last_run":"%s","mode":"%s","result":%s,"last_sample":"%s","last_sample_epoch":%s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" "$3" "$4" > state/scheduler.json; }

case "$MODE" in
  tick)
    touch state/last_tick            # heartbeat: mtime only, nothing grows
    now=$(date +%s)
    last=$(grep -o '"last_sample_epoch":[0-9]*' state/scheduler.json 2>/dev/null | grep -o '[0-9]*$'); last=${last:-0}
    if [ -f state/pending.json ]; then log "pending upload found; retrying"; run_collector retry; rc=$?; log "retry exit=$rc"; fi
    if [ $((now - last)) -ge $INTERVAL_S ]; then
      stamp=$(date -u +%Y-%m-%dT%H:%M:%SZ); log "sample due (last $((now - last)) s ago)"
      run_collector ships; rc=$?; log "ships exit=$rc"
      record tick "$rc" "$stamp" "$now"   # the attempt counts as the sample time either way: no catch-up burst after failures or sleep
      exit $rc
    fi
    exit 0 ;;
  ships|mock)
    stamp=$(date -u +%Y-%m-%dT%H:%M:%SZ); log "manual $MODE $*"
    run_collector "$MODE" "$@"; rc=$?; log "$MODE exit=$rc"
    case "$*" in *--dry*) ;; *) record manual "$rc" "$stamp" "$(date +%s)" ;; esac
    tail -n 3 logs/collector.log; exit $rc ;;
  retry) run_collector retry; exit $? ;;
  *) echo "usage: run.sh ships|mock|tick|retry|status" >&2; exit 2 ;;
esac
