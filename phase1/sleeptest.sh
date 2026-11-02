#!/bin/bash
# Mother Earth — sleep-mid-sample acceptance test (STATUS Next 0).
#
# Runs ONE sample with a 180 s window, waits for you to put the Mac to sleep during it, and on wake captures both
# sides of the question: what the collector recorded about itself, and what macOS independently recorded about
# sleeping and waking. The second is the point — the sleep detector has only ever been checked against its own
# output, so this test judges it against pmset's log, which the collector has no part in writing.
#
# Does NOT prevent sleep, change cadence, or touch the schedule. Run it, sleep the Mac, wake it, done.
set -u
cd "$HOME/mother-earth" || { echo "no ~/mother-earth"; exit 1; }
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
R="logs/sleeptest-$STAMP.txt"
HUB="https://mother-earth.chadoberholzer.workers.dev"
exec > >(tee "$R") 2>&1

echo "=== MOTHER EARTH — sleep-mid-sample test $STAMP ==="
echo "start_utc:   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "start_local: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "collector:   $(grep -m1 COLLECTOR_VERSION collector-mac.mjs | cut -d\' -f2)"
echo "lock before: $([ -d state/lock ] && echo HELD || echo free)"
echo "scheduler before: $(cat state/scheduler.json 2>/dev/null)"
T0=$(date +%s)

echo
echo "--- starting a 180 s sample in the background ---"
./run.sh ships --window=180 > "logs/sleeptest-run-$STAMP.out" 2>&1 &
RUN_PID=$!
sleep 2
echo
echo "########################################################"
echo "#  PUT THE MAC TO SLEEP NOW:  Apple menu  >  Sleep     #"
echo "#  Leave it asleep AT LEAST 8 MINUTES, then wake it.   #"
echo "#  Leave this window open — it finishes by itself.     #"
echo "########################################################"
echo
wait $RUN_PID; RC=$?
T1=$(date +%s)

echo "--- back ---"
echo "end_utc:     $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "end_local:   $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "run_exit_code: $RC   (0 uploaded · 3 source-down report uploaded · 1 upload failed, pending kept · 5 lock held)"
echo "elapsed_total_s: $((T1 - T0))"
echo "lock after:  $([ -d state/lock ] && echo HELD || echo free)   pid file: $(cat state/lock/pid 2>/dev/null || echo none)"
echo "scheduler after: $(cat state/scheduler.json 2>/dev/null)"
echo "pending upload:  $([ -f state/pending.json ] && echo "YES $(wc -c < state/pending.json) bytes" || echo none)"

echo
echo "=== INDEPENDENT macOS RECORD (pmset -g log; timestamps are LOCAL) ==="
echo "--- sleep/wake events, last 40 ---"
pmset -g log 2>/dev/null | grep -E "Entering Sleep|Wake from|DarkWake|Wake Requests" | tail -40
echo "--- assertions that may hold sleep off ---"
pmset -g assertions 2>/dev/null | sed -n '1,12p'

echo
echo "=== WHAT THE COLLECTOR RECORDED ABOUT ITSELF ==="
echo "--- this run's stdout ---"
cat "logs/sleeptest-run-$STAMP.out" 2>/dev/null
echo "--- last sample line ---"
grep -h "^ships:" logs/collector.log | tail -1
echo "--- last tick lines ---"
grep -hE "\[tick\]|\[manual\]|manual ships" logs/collector.log | tail -8

echo
echo "=== WHAT THE HUB RECEIVED ==="
curl -s --max-time 20 "$HUB/cells/ships" -o "logs/sleeptest-hub-cells-$STAMP.json"
curl -s --max-time 20 "$HUB/status"      -o "logs/sleeptest-hub-status-$STAMP.json"
echo "saved: logs/sleeptest-hub-cells-$STAMP.json ($(wc -c < "logs/sleeptest-hub-cells-$STAMP.json" 2>/dev/null) bytes)"
echo "saved: logs/sleeptest-hub-status-$STAMP.json ($(wc -c < "logs/sleeptest-hub-status-$STAMP.json" 2>/dev/null) bytes)"

echo
echo "=== DONE ==="
echo "Report: ~/mother-earth/$R"
echo "Now leave the Mac awake and idle for ~30 min so the next scheduled attempt can be checked for a catch-up burst."
