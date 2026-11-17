#!/bin/bash
# Mother Earth — Mac collector runner. One shared lock for manual and scheduled runs; bounded logs; real exit status.
#
#   ./run.sh ships [--dry] [--window=60]   collect one sample now (manual)
#   ./run.sh mock                          synthetic sample (proves the path)
#   ./run.sh aircraft [--dry]              one OpenSky counts request now (refused: 7 budget used · 8 ships due soon · 9 ledger not saved · 10 not on the home network)
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
#   logs/collector.log     rotated at 1 MB, 3 archived copies: live + 3 ≈ 4 MB worst case (rotation runs before each write, so the live file can overshoot by one run's output, ~1 KB)
#   logs/launchd.log       scheduler stdout/stderr, rotated at 512 KB, 1 archived copy ≈ 1 MB
# Maximum retained footprint: logs ≈ 5 MB + one pending envelope ≤ 5 MB + state < 1 KB ≈ 10 MB. Runtime (Node) is separate.
# Exit codes pass straight through from collector-mac.mjs: 0 uploaded · 3 source-down report uploaded · 1 upload failed (pending kept) · 2 config · 4 nothing pending · 5 lock held · 6 keys unreadable

set -u
cd "$(dirname "$0")" || exit 2
MODE="${1:-ships}"; shift || true
INTERVAL_S=1800                       # sample roughly every 30 min while the Mac is awake; no catch-up bursts
mkdir -p state logs

# ---- bounded logging
rotate() { local f="$1" max="$2" keep="$3"; [ -f "$f" ] && [ "$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")" -gt "$max" ] || return 0
  local i=$keep; while [ $i -gt 1 ]; do [ -f "$f.$((i-1))" ] && mv -f "$f.$((i-1))" "$f.$i"; i=$((i-1)); done; mv -f "$f" "$f.1"; }
rotate logs/collector.log 1048576 3
rotate logs/launchd.log 524288 1
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
# Aircraft counts (OpenSky): optional. Keys are read the same way; the schedule runs only while state/aircraft.on exists.
OPENSKY_CLIENT_ID="$(keyval OPENSKY_CLIENT_ID)"; OPENSKY_CLIENT_SECRET="$(keyval OPENSKY_CLIENT_SECRET)"; export OPENSKY_CLIENT_ID OPENSKY_CLIENT_SECRET
AIRCRAFT_INTERVAL_S=${AIRCRAFT_INTERVAL_S:-8640}   # 144 min between scheduled attempts
AIRCRAFT_MAX_PER_DAY=10                            # hard cap on OpenSky requests in any 24 h, all paths (not overridable from the environment)
AIRCRAFT_MAX_S=${AIRCRAFT_MAX_S:-90}               # a run is killed at this many seconds
AIRCRAFT_GUARD_S=${AIRCRAFT_GUARD_S:-180}          # no aircraft run starts when a ships sample is due within this many seconds
# Home-network check (GPT review, 17 Nov 2026). The arrangement with OpenSky is requests from Chad's own home connection, and this
# Mac roams. Before ANY OpenSky request (scheduled, manual, dry) the runner reads our own receiver's local aircraft JSON, which
# answers only on the home network. No answer, a failed transfer, a non-2xx status, or a body that is not that JSON means no request.
# Limit, stated plainly: this shows the Mac can reach the Pi. With a VPN that sends internet traffic elsewhere, the Pi can still
# answer while the OpenSky request leaves by another route; the check cannot see that.
AIRCRAFT_HOME_PROBE_URL=${AIRCRAFT_HOME_PROBE_URL:-http://adsb-feeder.local:8080/data/aircraft.json}
AIRCRAFT_PROBE_TIMEOUT_S=${AIRCRAFT_PROBE_TIMEOUT_S:-4}     # curl's own limit; the probe is killed outright 2 s after it
AIRCRAFT_PROBE_RETRY_S=${AIRCRAFT_PROBE_RETRY_S:-300}       # after a failed scheduled probe, do not probe again for this long

# ---- one shared lock (mkdir is atomic). Age alone does NOT make a lock stale (1 Nov 2026): a sample that was running
# when the host suspended is older than the timeout but still alive, and reclaiming it would start a second sample
# alongside it on wake. A lock is stale only when it is old AND its owning process is gone.
if ! mkdir state/lock 2>/dev/null; then
  lockpid=$(cat state/lock/pid 2>/dev/null)
  if [ -n "$lockpid" ] && kill -0 "$lockpid" 2>/dev/null; then
    [ "$MODE" = "tick" ] || echo "another run is in progress (pid $lockpid); try again in a minute" >&2
    log "lock held by live pid $lockpid; not reclaimed"; exit 5
  elif [ -n "$(find state/lock -maxdepth 0 -mmin +10 2>/dev/null)" ]; then
    log "stale lock removed (owner ${lockpid:-unknown} is gone)"; rm -f state/lock/pid 2>/dev/null; rmdir state/lock 2>/dev/null; mkdir state/lock 2>/dev/null || exit 5
  else
    [ "$MODE" = "tick" ] || echo "another run is in progress (state/lock); try again in a minute" >&2; exit 5
  fi
fi
echo $$ > state/lock/pid 2>/dev/null
trap 'rm -f state/lock/pid 2>/dev/null; rmdir state/lock 2>/dev/null' EXIT

run_collector() {   # $1 = layer/mode, rest = flags
  "$NODE" collector-mac.mjs "$@" --quiet --state=state >> logs/collector.log 2>&1; return $?
}
ships_last() { local l; l=$(grep -o '"last_sample_epoch":[0-9]*' state/scheduler.json 2>/dev/null | grep -o '[0-9]*$'); echo "${l:-0}"; }
# Aircraft: every OpenSky request (scheduled, manual, dry) is entered in state/aircraft_requests BEFORE it is made.
# Returns 0 = entry saved, the request may be made · 1 = AIRCRAFT_MAX_PER_DAY requests already fall inside the last 24 h
# · 2 = the entry could not be saved and read back, so NO request may be made (an unrecorded request would break the cap).
# The one-off private pull of 17 Nov 2026 (state/opensky-once.json, made outside this ledger) is counted while it is inside the window.
aircraft_budget() {
  local t cut n=0 keep="" e once; t=$(date +%s); cut=$((t - 86400))
  if [ -e state/aircraft_requests ] && { [ ! -f state/aircraft_requests ] || [ ! -r state/aircraft_requests ]; }; then return 2; fi   # present but not a readable file: its entries cannot be counted
  if [ -f state/aircraft_requests ]; then while read -r e; do case "$e" in ''|*[!0-9]*) continue ;; esac; [ "$e" -gt "$cut" ] && { keep="$keep$e
"; n=$((n + 1)); }; done < state/aircraft_requests; fi
  once=$(grep -o '"source_time": *[0-9]*' state/opensky-once.json 2>/dev/null | grep -o '[0-9]*$' | head -n 1)
  if [ -n "$once" ] && [ "$once" -gt "$cut" ]; then n=$((n + 1)); fi
  [ "$n" -ge "$AIRCRAFT_MAX_PER_DAY" ] && return 1
  printf '%s%s\n' "$keep" "$t" > state/aircraft_requests.tmp 2>/dev/null || return 2
  mv -f state/aircraft_requests.tmp state/aircraft_requests 2>/dev/null || return 2
  [ -f state/aircraft_requests ] && [ "$(tail -n 1 state/aircraft_requests 2>/dev/null)" = "$t" ] || return 2
  return 0
}
# Is this Mac on the home network? Read-only: one GET of our receiver's local aircraft JSON. Returns 0 ONLY when all of these hold
# (GPT review of f9791f7, 17 Nov 2026: a partial body, an HTML page naming both keys, and JSON of the wrong types each passed the
# earlier two-word search):
#   1. curl itself succeeded (exit 0: a timeout after a partial body is exit 28, and is not home);
#   2. the HTTP status is 2xx (redirects are not followed);
#   3. the whole body is valid JSON: an object whose "now" is a finite number and whose "aircraft" is an array (empty is fine).
# Anything else returns 1. The body is held in a scratch file only for the check and removed. Both steps have hard time limits.
home_probe() {
  local code rc ok=1
  rm -f state/aircraft_probe.tmp 2>/dev/null
  code=$(perl -e 'alarm shift; exec @ARGV' "$((AIRCRAFT_PROBE_TIMEOUT_S + 2))" curl -sS -m "$AIRCRAFT_PROBE_TIMEOUT_S" --max-filesize 8000000 -o state/aircraft_probe.tmp -w '%{http_code}' "$AIRCRAFT_HOME_PROBE_URL" 2>/dev/null); rc=$?
  if [ "$rc" = 0 ]; then
    case "$code" in
      2[0-9][0-9])
        perl -e 'alarm shift; exec @ARGV' 5 "$NODE" -e 'let j; try { j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); } catch (e) { process.exit(1); } process.exit(j !== null && typeof j === "object" && !Array.isArray(j) && typeof j.now === "number" && Number.isFinite(j.now) && Array.isArray(j.aircraft) ? 0 : 1);' state/aircraft_probe.tmp >/dev/null 2>&1 && ok=0 ;;
    esac
  fi
  rm -f state/aircraft_probe.tmp 2>/dev/null
  return $ok
}
# Run the collector with a hard time limit: $1 seconds, then the rest as collector arguments. Killed at the limit (exit 124).
run_bounded() {
  local limit="$1"; shift
  "$NODE" collector-mac.mjs "$@" >> logs/collector.log 2>&1 & local pid=$! waited=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$waited" -ge "$limit" ]; then kill "$pid" 2>/dev/null; sleep 1; kill -9 "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; log "collector killed at the ${limit} s limit ($1)"; return 124; fi
    sleep 1; waited=$((waited + 1))
  done
  wait "$pid"; return $?
}
record() { printf '{"last_run":"%s","mode":"%s","result":%s,"last_sample":"%s","last_sample_epoch":%s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" "$3" "$4" > state/scheduler.json; }

case "$MODE" in
  tick)
    touch state/last_tick            # heartbeat: mtime only, nothing grows
    now=$(date +%s)
    last=$(ships_last)
    if [ -f state/pending.json ]; then log "pending upload found; retrying"; run_collector retry; rc=$?; log "retry exit=$rc"; fi
    # The retry above can take minutes (timeouts and backoff). Read the clock and the last ships sample AGAIN before deciding which
    # collector runs, so a ships sample that came due during the retry is seen in this tick (GPT review of 059c531).
    now=$(date +%s); last=$(ships_last)
    if [ $((now - last)) -ge $INTERVAL_S ]; then
      stamp=$(date -u +%Y-%m-%dT%H:%M:%SZ); log "sample due (last $((now - last)) s ago)"
      run_collector ships; rc=$?; log "ships exit=$rc"
      # The interval runs from COMPLETION, not from the start of the attempt (1 Nov 2026). Measuring from the start meant an
      # overlong sample shortened the next gap — a quiet catch-up. The attempt counts either way: no burst after a failure.
      record tick "$rc" "$stamp" "$(date +%s)"
      exit $rc
    fi
    # Aircraft counts (OpenSky). SHIPS HAS PRIORITY (GPT review, 17 Nov 2026): this block is reached only in a tick where no ships
    # sample was due, it does not start when ships will be due within AIRCRAFT_GUARD_S, and the run is killed at AIRCRAFT_MAX_S,
    # so the shared lock is free again before the next ships sample. The interval runs from the attempt: a failure is not retried early.
    if [ -f state/aircraft.on ]; then
      alast=$(cat state/aircraft_last 2>/dev/null); alast=${alast:-0}
      if [ $((now - alast)) -ge $AIRCRAFT_INTERVAL_S ]; then
        if [ $((INTERVAL_S - (now - last))) -le $AIRCRAFT_GUARD_S ]; then log "aircraft due but ships is due within ${AIRCRAFT_GUARD_S} s; waiting"
        elif [ $((now - $(cat state/aircraft_probe_failed 2>/dev/null || echo 0))) -lt $AIRCRAFT_PROBE_RETRY_S ]; then :   # a probe failed recently: not probing again yet
        elif ! home_probe; then
          # Not on the home network: no OpenSky request, no ledger entry, nothing uploaded (the hub keeps its last good count), and
          # aircraft_last is left alone so the count is taken soon after the Mac is home again.
          date +%s > state/aircraft_probe_failed; log "aircraft due but our receiver did not answer on the local network (not at home?); no OpenSky request made"
        else
          rm -f state/aircraft_probe_failed 2>/dev/null
          aircraft_budget; ab=$?
          if [ "$ab" = 1 ]; then log "aircraft due but the daily request budget ($AIRCRAFT_MAX_PER_DAY in 24 h) is used; skipped"; echo "$now" > state/aircraft_last
          elif [ "$ab" != 0 ]; then log "aircraft due but the request ledger could not be saved; no request made"
          else
            echo "$now" > state/aircraft_last; log "aircraft due (last $((now - alast)) s ago)"
            run_bounded "$AIRCRAFT_MAX_S" opensky --quiet --state=state; arc=$?; log "aircraft exit=$arc"
          fi
        fi
      fi
    fi
    exit 0 ;;
  ships|mock)
    stamp=$(date -u +%Y-%m-%dT%H:%M:%SZ); log "manual $MODE $*"
    run_collector "$MODE" "$@"; rc=$?; log "$MODE exit=$rc"
    case "$*" in *--dry*) ;; *) record manual "$rc" "$stamp" "$(date +%s)" ;; esac
    tail -n 3 logs/collector.log; exit $rc ;;
  aircraft)   # manual: one OpenSky request now. '--dry' prints the envelope and uploads nothing, but it STILL asks OpenSky, so it
    # obeys the same rules as a scheduled run: the ships guard, the home-network check, the daily budget, and a saved ledger entry.
    now=$(date +%s); last=$(ships_last)
    if [ $((INTERVAL_S - (now - last))) -le $AIRCRAFT_GUARD_S ]; then echo "refused: a ships sample is due within ${AIRCRAFT_GUARD_S} s (or overdue); try again after it has run" >&2; log "manual aircraft refused: ships due within ${AIRCRAFT_GUARD_S} s"; exit 8; fi
    if ! home_probe; then echo "refused: our receiver did not answer on the local network, so this Mac does not appear to be on the home network; no OpenSky request made" >&2; log "manual aircraft refused: receiver not reachable on the local network"; exit 10; fi
    aircraft_budget; ab=$?
    if [ "$ab" = 1 ]; then echo "refused: $AIRCRAFT_MAX_PER_DAY OpenSky requests already made in the last 24 h (state/aircraft_requests, plus the one-off pull if recent)" >&2; log "manual aircraft refused: budget used"; exit 7; fi
    if [ "$ab" != 0 ]; then echo "refused: the request ledger (state/aircraft_requests) could not be saved, so no request was made" >&2; log "manual aircraft refused: ledger not saved"; exit 9; fi
    log "manual aircraft $*"; case "$*" in *--dry*) ;; *) date +%s > state/aircraft_last ;; esac
    run_bounded "$AIRCRAFT_MAX_S" opensky "$@" --state=state; rc=$?; log "aircraft exit=$rc"; tail -n 6 logs/collector.log; exit $rc ;;
  retry) run_collector retry; exit $? ;;
  *) echo "usage: run.sh ships|mock|aircraft [--dry]|tick|retry|status" >&2; exit 2 ;;
esac
