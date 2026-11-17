#!/bin/bash
# Aircraft schedule — runner suite (GPT review of aircraft-counts-rc, 17 Nov 2026). Drives the REAL phase1/run.sh in a scratch
# folder with a stub in place of node, so no network is used and nothing is uploaded. Ships must keep priority.
# Run: bash phase1/aircraft-schedule.test.sh        BREAK=<name> weakens the copied run.sh; each must fail:
#   aircraft-first (the ddf109b ordering: aircraft before ships, no guard)  no-guard  no-kill  no-budget  dry-free  no-switch
#   stale-clock  manual-no-guard  ledger-unchecked  once-ignored   (the three cases GPT reproduced on 059c531, and the one-off pull)
#   no-probe  manual-no-probe  portal-ok  probe-no-kill  probe-no-backoff   (the home-network check)
#   probe-ignore-exit  probe-ignore-http  probe-two-words  probe-any-json   (GPT's false positives on f9791f7)
# Written for macOS /bin/bash 3.2 as well as Linux bash: no python, no GNU-only flags.
set -u
SRC="$(cd "$(dirname "$0")" && pwd)"; T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
REAL_NODE="$(command -v node 2>/dev/null)"; for c in /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.nvm/versions/node/"*/bin/node; do [ -z "$REAL_NODE" ] && [ -x "$c" ] && REAL_NODE="$c"; done
[ -x "${REAL_NODE:-}" ] || { echo "FAIL  node not found (the runner's JSON check needs it)"; exit 1; }
pass=0; fail=0; ok() { if [ "$2" = "1" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL  $1${3:+
      got: $3}"; fi; }
BREAK="${BREAK:-}"
setup() {   # fresh folder each case
  rm -rf "$T/w"; mkdir -p "$T/w/bin" "$T/w/state" "$T/w/logs"; cp "$SRC/run.sh" "$T/w/run.sh"
  case "$BREAK" in
    aircraft-first)   # the ddf109b ordering: the aircraft block before the ships block, and no guard (with the guard the order alone changes nothing)
      perl -0777 -i.bak -pe 's/(    if \[ -f state\/aircraft\.on \]; then\n.*?\n    fi\n)(    exit 0 ;;)/$2/s and $blk = $1; s/(    if \[ \$\(\(now - last\)\) -ge \$INTERVAL_S \]; then\n      stamp=)/$blk$1/s' "$T/w/run.sh"
      sed -i.bak 's/if \[ \$((INTERVAL_S - (now - last))) -le \$AIRCRAFT_GUARD_S \]; then log/if false; then log/' "$T/w/run.sh" ;;
    no-guard) sed -i.bak 's/if \[ \$((INTERVAL_S - (now - last))) -le \$AIRCRAFT_GUARD_S \]; then log/if false; then log/' "$T/w/run.sh" ;;
    stale-clock) perl -0777 -i.bak -pe 's/(seen in this tick \(GPT review of 059c531\)\.\n)    now=\$\(date \+%s\); last=\$\(ships_last\)\n/$1    :\n/' "$T/w/run.sh" ;;   # 059c531: the clock is not read again after the retry
    manual-no-guard) sed -i.bak 's/if \[ \$((INTERVAL_S - (now - last))) -le \$AIRCRAFT_GUARD_S \]; then echo/if false; then echo/' "$T/w/run.sh" ;;   # 059c531: manual runs ignore ships
    ledger-unchecked) sed -i.bak 's/|| return 2$/|| true/; s/then return 2; fi   # present/then true; fi   # present/' "$T/w/run.sh" ;;        # 059c531: a ledger that cannot be saved does not stop the request
    no-probe) sed -i.bak 's/        elif ! home_probe; then/        elif false; then/' "$T/w/run.sh" ;;                                         # 239e685: the scheduled path asks OpenSky from any network
    manual-no-probe) sed -i.bak 's/    if ! home_probe; then echo/    if false; then echo/' "$T/w/run.sh" ;;                                    # manual and dry runs ask from any network
    portal-ok) perl -0777 -i.bak -pe 's/(perl -e .alarm shift; exec \@ARGV. 5 "\$NODE" -e ).*?( state\/aircraft_probe\.tmp >\/dev\/null 2>&1 && ok=0)/$1"process.exit(0)"$2/s' "$T/w/run.sh" ;;       # any 2xx answer at all counts as home
    probe-ignore-exit) sed -i.bak 's/  if \[ "\$rc" = 0 \]; then$/  if true; then/' "$T/w/run.sh" ;;                                         # f9791f7: curl exit status ignored
    probe-ignore-http) sed -i.bak 's/      2\[0-9\]\[0-9\])$/      *)/' "$T/w/run.sh" ;;                                                    # any HTTP status accepted
    probe-two-words) perl -0777 -i.bak -pe 's/(perl -e .alarm shift; exec \@ARGV. 5 "\$NODE" -e ).*?( state\/aircraft_probe\.tmp >\/dev\/null 2>&1 && ok=0)/$1\x27const t = require("fs").readFileSync(process.argv[1], "utf8").slice(0, 512); process.exit(t.includes("\\"now\\"") && t.includes("\\"aircraft\\"") ? 0 : 1);\x27$2/s' "$T/w/run.sh" ;;   # f9791f7: two key names searched for in the first 512 bytes
    probe-any-json) perl -0777 -i.bak -pe 's/ && typeof j\.now === "number" && Number\.isFinite\(j\.now\) && Array\.isArray\(j\.aircraft\)//' "$T/w/run.sh" ;;   # valid JSON object of any shape accepted
    probe-no-kill) sed -i.bak "s/  code=\$(perl -e 'alarm shift; exec @ARGV' \"\$((AIRCRAFT_PROBE_TIMEOUT_S + 2))\" curl/  code=\$(curl/" "$T/w/run.sh" ;;   # a probe that hangs is not cut off
    probe-no-backoff) sed -i.bak 's/-lt \$AIRCRAFT_PROBE_RETRY_S \]; then :/-lt 0 ]; then :/' "$T/w/run.sh" ;;                               # a failed probe is repeated every tick
    once-ignored) sed -i.bak 's/if \[ -n "\$once" \] \&\& /if false \&\& /' "$T/w/run.sh" ;;                                          # the one-off pull is not counted
    no-kill) sed -i.bak 's/if \[ "\$waited" -ge "\$limit" \]; then/if false; then/' "$T/w/run.sh" ;;
    no-budget) sed -i.bak 's/\[ "\$n" -ge "\$AIRCRAFT_MAX_PER_DAY" \] \&\& return 1/false \&\& return 1/' "$T/w/run.sh" ;;
    dry-free) sed -i.bak 's/    if \[ "\$ab" = 1 \]; then echo "refused/    if false; then echo "refused/; s/    if \[ "\$ab" != 0 \]; then echo "refused/    if false; then echo "refused/' "$T/w/run.sh" ;;
    no-switch) sed -i.bak 's/    if \[ -f state\/aircraft.on \]; then/    if true; then/' "$T/w/run.sh" ;;
    '') ;;
    *) echo "FAIL  unknown break $BREAK"; exit 1 ;;
  esac
  if [ -n "$BREAK" ] && cmp -s "$SRC/run.sh" "$T/w/run.sh"; then echo "FAIL  break did not apply: $BREAK"; exit 1; fi
  printf '| INGEST_KEY | test-ingest | x |\n| AISSTREAM_KEY | test-ais | x |\n| OPENSKY_CLIENT_ID | test-id | x |\n| OPENSKY_CLIENT_SECRET | test-secret | x |\n' > "$T/w/KEYS.md"
  # the stub "node": records start and end of every collector call; opensky sleeps and exits as told
  cat > "$T/w/bin/node" <<'N'
#!/bin/bash
if [ "$1" = "-e" ]; then exec "$REAL_NODE" "$@"; fi      # the runner's JSON check uses the real node
layer="$2"; echo "$(date +%s) start $layer $*" >> "$STUB_LOG"
if [ "$layer" = "retry" ]; then sleep "${STUB_RETRY_SLEEP:-0}"; echo "$(date +%s) end retry" >> "$STUB_LOG"; exit 0; fi
if [ "$layer" = "opensky" ]; then sleep "${STUB_OPENSKY_SLEEP:-0}"; echo "$(date +%s) end opensky" >> "$STUB_LOG"; exit "${STUB_OPENSKY_RC:-0}"; fi
sleep "${STUB_SHIPS_SLEEP:-0}"; echo "$(date +%s) end $layer" >> "$STUB_LOG"; exit 0
N
  chmod +x "$T/w/bin/node"; export STUB_LOG="$T/w/stub.log"; : > "$STUB_LOG"
  # the stub "curl" stands in for the probe of our receiver. $T/w/probe says what the network looks like: home | away | hang | portal
  cat > "$T/w/bin/curl" <<'N'
#!/bin/bash
# Stand-in for curl. With -o FILE the body goes to the file, otherwise to stdout; the HTTP status is printed only when -w is given.
out=""; w=0; while [ $# -gt 0 ]; do case "$1" in -o) out="$2"; shift ;; -w) w=1; shift ;; esac; shift; done
mode="$(cat "$PROBE_FILE")"; echo "$(date +%s) probe $mode" >> "$STUB_LOG"
GOOD='{ "now" : 1794907029.5,
  "messages" : 5742535,
  "aircraft" : [
    {"hex":"000000","seen":0.1}
  ]
}'
body=""; code=200; rc=0
case "$mode" in
  home) body="$GOOD" ;;
  empty-array) body='{"now":1794907029,"messages":1,"aircraft":[]}' ;;
  portal) body='<html><body>Welcome to Cafe WiFi. Please sign in.</body></html>' ;;
  partial) body='{ "now" : 1794907029.5,
  "messages" : 5742535,
  "aircraft" : [
    {"hex":"0000'; rc=28 ;;                                  # body cut off, curl reports a timeout
  partial-ok-exit) body='{ "now" : 1794907029.5, "aircraft" : [ {"hex":"0000' ;;      # cut-off body but exit 0: must fail as JSON
  complete-but-exit28) body="$GOOD"; rc=28 ;;                                          # a full, valid body but curl failed: still not home
  html-keys) body='<html><body>Our "now" playing list and "aircraft" spotting club. Sign in to continue.</body></html>' ;;
  wrong-types) body='{"now":"1794907029","messages":1,"aircraft":null}' ;;
  now-null) body='{"now":null,"aircraft":[]}' ;;
  aircraft-object) body='{"now":1794907029,"aircraft":{"hex":"000000"}}' ;;
  top-array) body='[{"now":1794907029,"aircraft":[]}]' ;;
  http500) body="$GOOD"; code=500 ;;
  http302) body="$GOOD"; code=302 ;;
  http404) body='{"now":1,"aircraft":[]}'; code=404 ;;
  hang) exec sleep 30 ;;
  *) code=000; rc=6 ;;
esac
if [ -n "$out" ]; then printf '%s' "$body" > "$out"; else printf '%s' "$body"; fi
[ "$w" = 1 ] && printf '%s' "$code"
exit $rc
N
  chmod +x "$T/w/bin/curl"; export PROBE_FILE="$T/w/probe"; echo home > "$PROBE_FILE"; export REAL_NODE
}
tick() { (cd "$T/w" && PATH="$T/w/bin:$PATH" "$@" ./run.sh tick >/dev/null 2>&1); }
run() { (cd "$T/w" && PATH="$T/w/bin:$PATH" env "$@" >/dev/null 2>&1); }
sched() { printf '{"last_run":"x","mode":"tick","result":0,"last_sample":"x","last_sample_epoch":%s}\n' "$1" > "$T/w/state/scheduler.json"; }
now() { date +%s; }
n() { grep -c "start $1" "$STUB_LOG"; }

# A. both due in the same tick: ships runs, aircraft does not; aircraft runs in a later tick where ships is not due
setup; touch "$T/w/state/aircraft.on"; sched 0
run env STUB_OPENSKY_SLEEP=5 ./run.sh tick
ok 'A1 both due: ships runs in that tick' "$([ "$(n ships)" = 1 ] && echo 1)" "$(cat "$STUB_LOG")"
ok 'A2 both due: aircraft does not run in that tick' "$([ "$(n opensky)" = 0 ] && echo 1)" "$(cat "$STUB_LOG")"
ok 'A3 ships is the first collector call' "$(head -1 "$STUB_LOG" | grep -q 'start ships' && echo 1)" "$(head -1 "$STUB_LOG")"
run env ./run.sh tick
ok 'A4 next tick (ships not due): aircraft runs once' "$([ "$(n opensky)" = 1 ] && [ "$(n ships)" = 1 ] && echo 1)" "$(cat "$STUB_LOG")"
ok 'A5 the request is entered in the ledger' "$([ "$(grep -c . "$T/w/state/aircraft_requests")" = 1 ] && echo 1)"
run env ./run.sh tick
ok 'A6 a further tick inside the interval makes no request' "$([ "$(n opensky)" = 1 ] && echo 1)"

# B. aircraft due, ships due within the guard: aircraft waits
setup; touch "$T/w/state/aircraft.on"; sched $(( $(now) - 1800 + 120 ))
run env ./run.sh tick
ok 'B1 ships due in 120 s: aircraft does not start' "$([ "$(n opensky)" = 0 ] && echo 1)" "$(cat "$STUB_LOG")"
ok 'B2 and says why' "$(grep -q 'aircraft due but ships is due within' "$T/w/logs/collector.log" && echo 1)"
ok 'B3 no request was entered in the ledger' "$([ ! -s "$T/w/state/aircraft_requests" ] && echo 1)"

# C. a slow, failing OpenSky run while ships comes due: killed at the limit, lock released, ships starts on its own tick
setup; touch "$T/w/state/aircraft.on"; t0=$(now); sched $(( t0 - 1800 + 8 ))    # ships due 8 s from now
run env STUB_OPENSKY_SLEEP=300 STUB_OPENSKY_RC=1 AIRCRAFT_MAX_S=3 AIRCRAFT_GUARD_S=5 ./run.sh tick
t1=$(now)
ok 'C1 the slow aircraft run is ended at its limit' "$([ $((t1 - t0)) -le 7 ] && echo 1)" "$((t1 - t0)) s"
ok 'C2 it was started and killed, and the log says so' "$([ "$(n opensky)" = 1 ] && grep -q 'collector killed at the 3 s limit' "$T/w/logs/collector.log" && echo 1)" "$(cat "$T/w/logs/collector.log")"
ok 'C3 the lock is released' "$([ ! -d "$T/w/state/lock" ] && echo 1)"
ok 'C4 no stub process is left running' "$(! pgrep -f "$T/w/bin/node" >/dev/null && echo 1)"
sleep $(( 9 - ($(now) - t0) > 0 ? 9 - ($(now) - t0) : 0 ))
run env AIRCRAFT_MAX_S=3 AIRCRAFT_GUARD_S=5 ./run.sh tick
due=$(( t0 + 8 )); started=$(grep 'start ships' "$STUB_LOG" | head -1 | cut -d' ' -f1)
ok 'C5 ships starts on the first tick after it is due (not delayed by the failed aircraft run)' "$([ -n "$started" ] && [ $((started - due)) -le 3 ] && echo 1)" "started ${started:-never}, due $due"
run env AIRCRAFT_MAX_S=3 AIRCRAFT_GUARD_S=5 ./run.sh tick
ok 'C6 the failed aircraft run is not retried early' "$([ "$(n opensky)" = 1 ] && echo 1)"

# D. the daily budget holds on every path, dry runs included
setup; touch "$T/w/state/aircraft.on"; sched $(now); t=$(now); for i in 1 2 3 4 5 6 7 8 9 10; do echo $((t - i * 60)); done > "$T/w/state/aircraft_requests"
run env ./run.sh tick
ok 'D1 scheduled: the 11th request in 24 h is not made' "$([ "$(n opensky)" = 0 ] && echo 1)"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft >/dev/null 2>&1); rc=$?
ok 'D2 manual: refused with exit 7' "$([ "$rc" = 7 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'D3 manual --dry: also refused (a dry run still asks OpenSky)' "$([ "$rc" = 7 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"
echo $((t - 90000)) > "$T/w/state/aircraft_requests"; for i in 1 2 3 4 5 6 7 8 9; do echo $((t - i * 60)) >> "$T/w/state/aircraft_requests"; done
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'D4 an entry older than 24 h no longer counts: the request is made and entered' "$([ "$rc" = 0 ] && [ "$(n opensky)" = 1 ] && [ "$(grep -c . "$T/w/state/aircraft_requests")" = 10 ] && echo 1)" "rc=$rc $(grep -c . "$T/w/state/aircraft_requests")"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft >/dev/null 2>&1); rc=$?
ok 'D5 back-to-back manual runs stop at the cap' "$([ "$rc" = 7 ] && [ "$(n opensky)" = 1 ] && echo 1)" "rc=$rc"

# E. without the switch file the schedule never asks OpenSky
setup; sched $(now)
run env ./run.sh tick
ok 'E1 no switch file: no request' "$([ "$(n opensky)" = 0 ] && [ ! -e "$T/w/state/aircraft_requests" ] && echo 1)"

# F. ships alone is unchanged: due -> one ships call, state recorded
setup; sched 0
run env ./run.sh tick
ok 'F1 ships-only tick still samples and records' "$([ "$(n ships)" = 1 ] && grep -q '"mode":"tick"' "$T/w/state/scheduler.json" && echo 1)"

# G. a pending ships upload retry that runs past the ships due time: ships must be seen as due in the SAME tick
setup; touch "$T/w/state/aircraft.on"; echo '{}' > "$T/w/state/pending.json"; t0=$(now); sched $(( t0 - 1800 + 3 ))    # ships due 3 s from now
run env STUB_RETRY_SLEEP=5 AIRCRAFT_GUARD_S=1 AIRCRAFT_MAX_S=3 ./run.sh tick
ok 'G1 retry crossed the due time: ships runs in that same tick' "$([ "$(n ships)" = 1 ] && echo 1)" "$(cat "$STUB_LOG")"
ok 'G2 and aircraft does not run in that tick' "$([ "$(n opensky)" = 0 ] && echo 1)" "$(cat "$STUB_LOG")"
ok 'G3 order: retry, then ships' "$(sed -n 1p "$STUB_LOG" | grep -q 'start retry' && grep 'start' "$STUB_LOG" | sed -n 2p | grep -q 'start ships' && echo 1)" "$(grep start "$STUB_LOG")"

# H. a manual aircraft run five seconds before ships is due (and when ships is overdue): refused, dry runs included
setup; sched $(( $(now) - 1800 + 5 ))
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft >/dev/null 2>&1); rc=$?
ok 'H1 manual, ships due in 5 s: refused with exit 8, no request' "$([ "$rc" = 8 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'H2 manual --dry, ships due in 5 s: refused with exit 8, no request' "$([ "$rc" = 8 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"
ok 'H3 a refused manual run enters nothing in the ledger' "$([ ! -e "$T/w/state/aircraft_requests" ] && echo 1)"
sched 0
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'H4 manual with ships overdue: refused with exit 8' "$([ "$rc" = 8 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"
sched $(( $(now) - 1800 + 400 ))
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'H5 manual with ships 400 s away: allowed' "$([ "$rc" = 0 ] && [ "$(n opensky)" = 1 ] && echo 1)" "rc=$rc"

# I. a ledger that cannot be saved: no OpenSky request on any path
setup; touch "$T/w/state/aircraft.on"; sched $(now); mkdir "$T/w/state/aircraft_requests"     # a directory where the file should be
run env ./run.sh tick
ok 'I1 scheduled, ledger not a file: no request' "$([ "$(n opensky)" = 0 ] && echo 1)" "$(cat "$STUB_LOG")"
ok 'I2 and the log says the ledger could not be saved' "$(grep -q 'request ledger could not be saved' "$T/w/logs/collector.log" && echo 1)" "$(cat "$T/w/logs/collector.log")"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'I3 manual, ledger not a file: refused with exit 9, no request' "$([ "$rc" = 9 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"
setup; touch "$T/w/state/aircraft.on"; sched $(now); ln -s /nonexistent-dir/ledger "$T/w/state/aircraft_requests.tmp"   # the temporary file cannot be written
run env ./run.sh tick
ok 'I4 scheduled, ledger entry cannot be written: no request' "$([ "$(n opensky)" = 0 ] && echo 1)" "$(cat "$STUB_LOG")"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft >/dev/null 2>&1); rc=$?
ok 'I5 manual, ledger entry cannot be written: refused with exit 9' "$([ "$rc" = 9 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"

# J. the one-off private pull (state/opensky-once.json) counts toward the cap while it is inside the 24 h window
setup; sched $(now); t=$(now); for i in 1 2 3 4 5 6 7 8 9; do echo $((t - i * 60)); done > "$T/w/state/aircraft_requests"
printf '{\n "pull": {\n  "source_time": %s,\n  "source_time_iso": "x"\n }\n}\n' $((t - 3600)) > "$T/w/state/opensky-once.json"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'J1 nine ledger entries + the one-off pull one hour ago: the next request is refused' "$([ "$rc" = 7 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"
printf '{\n "pull": {\n  "source_time": %s\n }\n}\n' $((t - 90000)) > "$T/w/state/opensky-once.json"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'J2 the one-off pull older than 24 h no longer counts' "$([ "$rc" = 0 ] && [ "$(n opensky)" = 1 ] && echo 1)" "rc=$rc"

# K. the home-network check: our receiver must answer on the local network before any OpenSky request
np() { grep -c ' probe ' "$STUB_LOG"; }
setup; touch "$T/w/state/aircraft.on"; sched $(now)
run env ./run.sh tick
ok 'K1 at home: the receiver is probed, then the one request is made' "$([ "$(np)" = 1 ] && [ "$(n opensky)" = 1 ] && grep -n . "$STUB_LOG" | head -1 | grep -q probe && echo 1)" "$(cat "$STUB_LOG")"
setup; touch "$T/w/state/aircraft.on"; sched $(now); echo away > "$PROBE_FILE"
run env AIRCRAFT_PROBE_RETRY_S=3 ./run.sh tick
ok 'K2 away: no OpenSky request' "$([ "$(n opensky)" = 0 ] && [ "$(np)" = 1 ] && echo 1)" "$(cat "$STUB_LOG")"
ok 'K3 away: the ledger is untouched and the run is not marked as taken' "$([ ! -e "$T/w/state/aircraft_requests" ] && [ ! -e "$T/w/state/aircraft_last" ] && echo 1)" "$(ls "$T/w/state")"
ok 'K4 away: the reason is logged' "$(grep -q 'our receiver did not answer on the local network' "$T/w/logs/collector.log" && echo 1)" "$(cat "$T/w/logs/collector.log")"
ok 'K5 away: nothing was uploaded (no collector call at all), lock free' "$([ "$(grep -c ' start ' "$STUB_LOG")" = 0 ] && [ ! -d "$T/w/state/lock" ] && echo 1)" "$(cat "$STUB_LOG")"
run env AIRCRAFT_PROBE_RETRY_S=3 ./run.sh tick
ok 'K6 away, next tick: the probe is not repeated straight away' "$([ "$(np)" = 1 ] && [ "$(n opensky)" = 0 ] && echo 1)" "$(cat "$STUB_LOG")"
echo home > "$PROBE_FILE"; sleep 4
run env AIRCRAFT_PROBE_RETRY_S=3 ./run.sh tick
ok 'K7 back home: the next tick after the wait probes again and makes the request' "$([ "$(np)" = 2 ] && [ "$(n opensky)" = 1 ] && [ "$(grep -c . "$T/w/state/aircraft_requests")" = 1 ] && [ ! -e "$T/w/state/aircraft_probe_failed" ] && echo 1)" "$(cat "$STUB_LOG"; ls "$T/w/state")"
setup; sched $(now); echo away > "$PROBE_FILE"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft >/dev/null 2>&1); rc=$?
ok 'K8 away, manual: refused with exit 10, no request, no ledger entry' "$([ "$rc" = 10 ] && [ "$(n opensky)" = 0 ] && [ ! -e "$T/w/state/aircraft_requests" ] && echo 1)" "rc=$rc"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'K9 away, manual --dry: refused with exit 10, no request' "$([ "$rc" = 10 ] && [ "$(n opensky)" = 0 ] && echo 1)" "rc=$rc"
echo home > "$PROBE_FILE"
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); rc=$?
ok 'K10 home, manual --dry: allowed' "$([ "$rc" = 0 ] && [ "$(n opensky)" = 1 ] && echo 1)" "rc=$rc"
setup; touch "$T/w/state/aircraft.on"; sched $(now); echo portal > "$PROBE_FILE"
run env ./run.sh tick
(cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft >/dev/null 2>&1); rc=$?
ok 'K11 a sign-in page that answers for any address is not home (scheduled and manual)' "$([ "$(n opensky)" = 0 ] && [ "$rc" = 10 ] && [ ! -e "$T/w/state/aircraft_requests" ] && echo 1)" "rc=$rc $(cat "$STUB_LOG")"
# a probe that hangs, with ships coming due: cut off at its limit, no request, ships on time
setup; touch "$T/w/state/aircraft.on"; echo hang > "$PROBE_FILE"; t0=$(now); sched $(( t0 - 1800 + 12 ))    # ships due 12 s from now
run env AIRCRAFT_GUARD_S=2 AIRCRAFT_PROBE_TIMEOUT_S=2 ./run.sh tick
t1=$(now)
ok 'K12 a hanging probe is cut off at its limit (2 s + 2 s)' "$([ $((t1 - t0)) -le 6 ] && echo 1)" "$((t1 - t0)) s"
ok 'K13 after a hanging probe: no request, ledger untouched, lock free, no probe left running' "$([ "$(n opensky)" = 0 ] && [ ! -e "$T/w/state/aircraft_requests" ] && [ ! -d "$T/w/state/lock" ] && ! pgrep -f "$T/w/bin/curl" >/dev/null && echo 1)" "$(cat "$STUB_LOG")"
sleep $(( 13 - ($(now) - t0) > 0 ? 13 - ($(now) - t0) : 0 ))
run env AIRCRAFT_GUARD_S=2 AIRCRAFT_PROBE_TIMEOUT_S=2 ./run.sh tick
due=$(( t0 + 12 )); started=$(grep 'start ships' "$STUB_LOG" | head -1 | cut -d' ' -f1)
ok 'K14 ships starts on the first tick after it is due' "$([ -n "$started" ] && [ $((started - due)) -le 3 ] && echo 1)" "started ${started:-never}, due $due"
# ships priority: when ships is due the receiver is not even probed in that tick
setup; touch "$T/w/state/aircraft.on"; sched 0
run env ./run.sh tick
ok 'K15 ships due: ships runs and the receiver is not probed in that tick' "$([ "$(n ships)" = 1 ] && [ "$(np)" = 0 ] && [ "$(n opensky)" = 0 ] && echo 1)" "$(cat "$STUB_LOG")"
setup; touch "$T/w/state/aircraft.on"; sched $(( $(now) - 1800 + 120 )); echo home > "$PROBE_FILE"
run env ./run.sh tick
ok 'K16 ships due within the guard: no probe and no request' "$([ "$(np)" = 0 ] && [ "$(n opensky)" = 0 ] && echo 1)" "$(cat "$STUB_LOG")"
# a full ledger while away: still nothing asked, ledger unchanged
setup; touch "$T/w/state/aircraft.on"; sched $(now); echo away > "$PROBE_FILE"; t=$(now); for i in 1 2 3 4 5 6 7 8 9 10; do echo $((t - i * 60)); done > "$T/w/state/aircraft_requests"; cp "$T/w/state/aircraft_requests" "$T/w/before"
run env ./run.sh tick
ok 'K17 away with a full ledger: no request and the ledger is byte-for-byte unchanged' "$([ "$(n opensky)" = 0 ] && cmp -s "$T/w/before" "$T/w/state/aircraft_requests" && echo 1)"

# L. answers that are NOT our receiver's aircraft JSON (GPT's false positives on f9791f7, and neighbours): on the scheduled path
#    and the manual path alike, the collector is never started and the ledger is left untouched.
not_home() {   # $1 = probe mode, $2 = label
  setup; touch "$T/w/state/aircraft.on"; sched $(now); echo "$1" > "$PROBE_FILE"; t=$(now); for i in 1 2 3; do echo $((t - i * 60)); done > "$T/w/state/aircraft_requests"; cp "$T/w/state/aircraft_requests" "$T/w/before"
  run env ./run.sh tick
  local a="$(grep -c ' start ' "$STUB_LOG")" l="$(cmp -s "$T/w/before" "$T/w/state/aircraft_requests" && echo same || echo changed)" lg="$(grep -c 'our receiver did not answer on the local network' "$T/w/logs/collector.log")"
  (cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft >/dev/null 2>&1); local rc=$?
  (cd "$T/w" && PATH="$T/w/bin:$PATH" ./run.sh aircraft --dry >/dev/null 2>&1); local rc2=$?
  local b="$(grep -c ' start ' "$STUB_LOG")" l2="$(cmp -s "$T/w/before" "$T/w/state/aircraft_requests" && echo same || echo changed)"
  ok "$2: scheduled: collector never started, ledger untouched, reason logged" "$([ "$a" = 0 ] && [ "$l" = same ] && [ "$lg" = 1 ] && [ ! -e "$T/w/state/aircraft_last" ] && echo 1)" "starts=$a ledger=$l logged=$lg"
  ok "$2: manual and --dry: refused with exit 10, collector never started, ledger untouched" "$([ "$rc" = 10 ] && [ "$rc2" = 10 ] && [ "$b" = 0 ] && [ "$l2" = same ] && echo 1)" "rc=$rc rc2=$rc2 starts=$b ledger=$l2"
  ok "$2: no scratch file or lock left behind" "$([ ! -e "$T/w/state/aircraft_probe.tmp" ] && [ ! -d "$T/w/state/lock" ] && echo 1)" "$(ls "$T/w/state")"
}
not_home partial 'L1 timeout after a partial body (curl exit 28)'
not_home html-keys 'L2 HTML page containing both key names'
not_home wrong-types 'L3 JSON with now as a string and aircraft null'
not_home complete-but-exit28 'L4 full valid body but curl failed (exit 28)'
not_home partial-ok-exit 'L5 cut-off body with curl exit 0'
not_home now-null 'L6 JSON with now null'
not_home aircraft-object 'L7 JSON with aircraft as an object'
not_home top-array 'L8 JSON whose top level is an array'
not_home http500 'L9 valid body with HTTP 500'
not_home http302 'L10 valid body with HTTP 302 (redirect not followed)'
not_home http404 'L11 valid body with HTTP 404'
setup; touch "$T/w/state/aircraft.on"; sched $(now); echo empty-array > "$PROBE_FILE"
run env ./run.sh tick
ok 'L12 an empty aircraft array is valid: home, the request is made' "$([ "$(n opensky)" = 1 ] && [ "$(grep -c . "$T/w/state/aircraft_requests")" = 1 ] && echo 1)" "$(cat "$STUB_LOG")"

echo; echo "aircraft-schedule${BREAK:+ (BREAK=$BREAK)}: $pass passed, $fail failed  [bash $BASH_VERSION, $(uname -s)]"; [ "$fail" = 0 ]
