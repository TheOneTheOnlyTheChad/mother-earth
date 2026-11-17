#!/bin/bash
# Aircraft schedule — runner suite (GPT review of aircraft-counts-rc, 17 Nov 2026). Drives the REAL phase1/run.sh in a scratch
# folder with a stub in place of node, so no network is used and nothing is uploaded. Ships must keep priority.
# Run: bash phase1/aircraft-schedule.test.sh        BREAK=<name> weakens the copied run.sh; each must fail:
#   aircraft-first (the ddf109b ordering: aircraft before ships, no guard)  no-guard  no-kill  no-budget  dry-free  no-switch
#   stale-clock  manual-no-guard  ledger-unchecked  once-ignored   (the three cases GPT reproduced on 059c531, and the one-off pull)
# Written for macOS /bin/bash 3.2 as well as Linux bash: no python, no GNU-only flags.
set -u
SRC="$(cd "$(dirname "$0")" && pwd)"; T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
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
layer="$2"; echo "$(date +%s) start $layer $*" >> "$STUB_LOG"
if [ "$layer" = "retry" ]; then sleep "${STUB_RETRY_SLEEP:-0}"; echo "$(date +%s) end retry" >> "$STUB_LOG"; exit 0; fi
if [ "$layer" = "opensky" ]; then sleep "${STUB_OPENSKY_SLEEP:-0}"; echo "$(date +%s) end opensky" >> "$STUB_LOG"; exit "${STUB_OPENSKY_RC:-0}"; fi
sleep "${STUB_SHIPS_SLEEP:-0}"; echo "$(date +%s) end $layer" >> "$STUB_LOG"; exit 0
N
  chmod +x "$T/w/bin/node"; export STUB_LOG="$T/w/stub.log"; : > "$STUB_LOG"
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

echo; echo "aircraft-schedule${BREAK:+ (BREAK=$BREAK)}: $pass passed, $fail failed  [bash $BASH_VERSION, $(uname -s)]"; [ "$fail" = 0 ]
