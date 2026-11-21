#!/bin/bash
# Earth from Space, Stage B: ONE observation. Makes exactly one POST to the hub's /admin/probe/earthview and saves the answer.
#
#   ./earthview-stage-b-call.sh <n> <window start, UTC> [window seconds]
#   e.g.  ./earthview-stage-b-call.sh 1 2026-11-25T07:21:30Z 60
#
# - Started early, it waits (without printing the key) until the window opens, then calls once.
# - Started after the window has closed, it does NOT call: the observation is "not run" and is not moved.
# - One attempt. No retry, whatever happens. It waits up to 180 s for the answer (the hub's own deadline is 150 s).
# - The admin key is read from KEYS.md by this script and handed to curl on its standard input, so it is never typed, never
#   printed, never in a file this script writes and never on a command line (not visible in the process list).
# - It refuses to run a second time for the same observation number (the first result file is kept).
# Files written: <out>/observation-<n>.json (the hub's answer, as received) and observation-<n>.meta.txt (times, HTTP status).
set -u
N="${1:-}"; START="${2:-}"; WIN="${3:-60}"
HUB="${HUB:-https://mother-earth.chadoberholzer.workers.dev}"
OUT="${OUT:-$HOME/Documents/Mother Earth/_review/earth-from-space-stage-b/results}"
KEYS_FILE="${KEYS_FILE:-$([ -f "$HOME/mother-earth/KEYS.md" ] && echo "$HOME/mother-earth/KEYS.md" || echo "$HOME/Documents/Mother Earth/KEYS.md")}"
case "$N" in 1|2|3) ;; *) echo "usage: $0 <1|2|3> <window start like 2026-11-25T07:21:30Z> [window seconds, default 60]" >&2; exit 2;; esac
case "$START" in ????-??-??T??:??:??Z) ;; *) echo "window start must look like 2026-11-25T07:21:30Z (UTC)" >&2; exit 2;; esac
case "$WIN" in ''|*[!0-9]*) echo "window seconds must be a whole number" >&2; exit 2;; esac
epoch() { date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$1" +%s 2>/dev/null || date -u -d "$1" +%s; }
S=$(epoch "$START") || { echo "cannot read the window start" >&2; exit 2; }
E=$((S + WIN))
mkdir -p "$OUT" || exit 3
BODY="$OUT/observation-$N.json"; META="$OUT/observation-$N.meta.txt"
if [ -e "$BODY" ] || [ -e "$META" ]; then echo "observation $N already has a result in $OUT; not calling again" >&2; exit 4; fi
keyval() { grep -m1 "^| $1" "$KEYS_FILE" 2>/dev/null | awk -F'|' '{gsub(/ /,"",$3); print $3}'; }
KEY="$(keyval ADMIN_KEY)"
if [ -z "$KEY" ]; then echo "ADMIN_KEY unreadable from $KEYS_FILE; not calling" >&2; exit 6; fi
NOW=$(date -u +%s)
if [ "$NOW" -ge "$E" ]; then
  { echo "observation: $N"; echo "window: $START + ${WIN}s"; echo "result: NOT RUN (started at $(date -u +%Y-%m-%dT%H:%M:%SZ), after the window closed)"; } > "$META"
  echo "The window has closed. Observation $N was NOT run and is not moved. Recorded in $META"; exit 5
fi
if [ "$NOW" -lt "$S" ]; then echo "Waiting $((S - NOW)) s for the window to open at $START. Leave this window open."; sleep $((S - NOW)); fi
NOW=$(date -u +%s)
if [ "$NOW" -ge "$E" ]; then
  { echo "observation: $N"; echo "window: $START + ${WIN}s"; echo "result: NOT RUN (woke at $(date -u +%Y-%m-%dT%H:%M:%SZ), after the window closed)"; } > "$META"
  echo "Woke after the window closed (did the Mac sleep?). Observation $N was NOT run. Recorded in $META"; exit 5
fi
T0=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "Calling the hub once at $T0. This can take up to three minutes. Do not start it again."
# One request. --max-time 180, no --retry. The header reaches curl on standard input only.
HTTP=$(printf 'header = "Authorization: Bearer %s"\n' "$KEY" | curl --config - --silent --show-error --request POST --max-time 180 --output "$BODY.part" --write-out '%{http_code}' "$HUB/admin/probe/earthview" 2>"$META.err"); RC=$?
unset KEY
T1=$(date -u +%Y-%m-%dT%H:%M:%SZ)
[ -e "$BODY.part" ] && mv "$BODY.part" "$BODY"
{ echo "observation: $N"; echo "window: $START + ${WIN}s"; echo "hub: $HUB/admin/probe/earthview"; echo "called_at: $T0"; echo "answered_at: $T1"; echo "curl_exit: $RC"; echo "http_status: $HTTP"
  echo "answer_file: $( [ -s "$BODY" ] && echo "observation-$N.json ($(wc -c < "$BODY" | tr -d ' ') bytes)" || echo none )"; echo "curl_message: $(head -c 300 "$META.err" 2>/dev/null | tr '\n' ' ')"; } > "$META"
rm -f "$META.err"
if [ "$RC" -ne 0 ] || [ ! -s "$BODY" ]; then echo "No usable answer (curl exit $RC, HTTP $HTTP). This observation is INCOMPLETE and is not repeated. Recorded in $META"; exit 7; fi
echo "Done: HTTP $HTTP. Saved $BODY"; echo "Nothing more to do here. Tell Claude that observation $N has run."
