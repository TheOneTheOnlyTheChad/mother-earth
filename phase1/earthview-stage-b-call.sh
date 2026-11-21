#!/bin/bash
# Earth from Space, Stage B: ONE observation. Makes at most one POST to the hub's /admin/probe/earthview and saves the answer.
#
#   ./earthview-stage-b-call.sh <n> <window start, UTC> [window seconds]
#   e.g.  ./earthview-stage-b-call.sh 1 2026-11-25T07:21:30Z 60
#
# THE ONE-CALL CONTRACT
# - An observation number is CLAIMED before anything else happens to it: the claim is a directory made with mkdir, which either
#   makes it or fails, so of two launches at the same moment exactly one goes on. The claim is never removed by this script:
#   not after a failure, a timeout, a missed window or an interruption. A claimed observation is never called again.
# - curl is started with -q FIRST (no ~/.curlrc, no CURL_HOME file) and with an emptied environment (no proxy or curl variables),
#   with retries, redirects and protocols fixed on its own command line. Nothing inherited can add a second request.
# - One attempt. It waits up to 180 s for the answer (the hub's own deadline is 150 s).
# - Started early, it waits until the window opens. If the window has closed, it does NOT call: "not run", and not moved.
# - The admin key is read from KEYS.md by this script and handed to curl on its standard input: never typed, never printed,
#   never in a file this script writes, never on a command line.
# Order: arguments, then the key (a missing key stops here and claims nothing), then the claim, then the wait, then the call.
# Files in <out>: observation-<n>.claim/ (the claim), observation-<n>.json (the hub's answer as received), observation-<n>.meta.txt.
# Exit: 0 answer saved with HTTP 200 · 2 usage · 3 cannot write · 4 already claimed · 5 window missed · 6 key unreadable
#       7 no usable answer · 8 answer saved but not HTTP 200 · 9 interrupted
set -u
N="${1:-}"; START="${2:-}"; WIN="${3:-60}"
HUB='https://mother-earth.chadoberholzer.workers.dev'; MAXTIME=180
# For the caller's own test suite only (a local stand-in for the hub). Never set these for a real observation.
if [ -n "${STAGE_B_TEST_HUB:-}" ]; then HUB="$STAGE_B_TEST_HUB"; MAXTIME="${STAGE_B_TEST_MAX_TIME:-180}"; fi
OUT="${OUT:-$HOME/Documents/Mother Earth/_review/earth-from-space-stage-b/results}"
KEYS_FILE="${KEYS_FILE:-$([ -f "$HOME/mother-earth/KEYS.md" ] && echo "$HOME/mother-earth/KEYS.md" || echo "$HOME/Documents/Mother Earth/KEYS.md")}"
case "$N" in 1|2|3) ;; *) echo "usage: $0 <1|2|3> <window start like 2026-11-25T07:21:30Z> [window seconds, default 60]" >&2; exit 2;; esac
case "$START" in ????-??-??T??:??:??Z) ;; *) echo "window start must look like 2026-11-25T07:21:30Z (UTC)" >&2; exit 2;; esac
case "$WIN" in ''|*[!0-9]*) echo "window seconds must be a whole number" >&2; exit 2;; esac
case "$HUB" in https://*) PROTO='=https';; http://127.0.0.1:*) PROTO='=http';; *) echo "refusing this hub address" >&2; exit 2;; esac
epoch() { date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$1" +%s 2>/dev/null || date -u -d "$1" +%s 2>/dev/null; }
utc() { date -u +%Y-%m-%dT%H:%M:%SZ; }
S=$(epoch "$START"); case "$S" in ''|*[!0-9]*) echo "cannot read the window start" >&2; exit 2;; esac
E=$((S + WIN))
mkdir -p "$OUT" || exit 3
BODY="$OUT/observation-$N.json"; META="$OUT/observation-$N.meta.txt"; CLAIM="$OUT/observation-$N.claim"
keyval() { grep -m1 "^| $1" "$KEYS_FILE" 2>/dev/null | awk -F'|' '{gsub(/ /,"",$3); print $3}'; }
KEY="$(keyval ADMIN_KEY)"
if [ -z "$KEY" ]; then echo "ADMIN_KEY unreadable from $KEYS_FILE; nothing claimed, nothing called" >&2; exit 6; fi
# ---- the claim: atomic, and kept whatever happens next
if ! mkdir "$CLAIM" 2>/dev/null; then unset KEY
  echo "Observation $N is already claimed ($CLAIM). It is not called again, whatever its result was." >&2; [ -s "$META" ] && sed 's/^/  /' "$META" >&2; exit 4; fi
{ echo "claimed_at: $(utc)"; echo "pid: $$"; echo "window: $START + ${WIN}s"; } > "$CLAIM/claim.txt"
note() { { echo "observation: $N"; echo "window: $START + ${WIN}s"; echo "hub: $HUB/admin/probe/earthview"; cat; } > "$META"; }
CALLED=no
trap 'unset KEY; if [ ! -e "$META" ]; then printf "result: INTERRUPTED at %s (%s). Not repeated.\n" "$(utc)" "$([ "$CALLED" = yes ] && echo "after the call was started: INCOMPLETE" || echo "before any call: NOT RUN")" | note; fi; rm -f "$META.err"; exit 9' INT TERM HUP
NOW=$(date -u +%s)
if [ "$NOW" -ge "$E" ]; then unset KEY; echo "result: NOT RUN (started at $(utc), after the window closed). Not moved." | note
  echo "The window has closed. Observation $N was NOT run and is not moved. Recorded in $META"; exit 5; fi
if [ "$NOW" -lt "$S" ]; then echo "Waiting $((S - NOW)) s for the window to open at $START. Leave this window open."; sleep $((S - NOW)) & wait $!; fi
NOW=$(date -u +%s)
if [ "$NOW" -ge "$E" ]; then unset KEY; echo "result: NOT RUN (woke at $(utc), after the window closed; did the Mac sleep?). Not moved." | note
  echo "Woke after the window closed. Observation $N was NOT run. Recorded in $META"; exit 5; fi
T0=$(utc); CALLED=yes
echo "Calling the hub once at $T0. This can take up to three minutes. Do not start it again."
# ONE request. -q must be curl's first argument. The header reaches curl on standard input only.
HTTP=$(printf 'header = "Authorization: Bearer %s"\n' "$KEY" | env -i PATH="$PATH" HOME="$HOME" curl -q --config - --proto "$PROTO" --max-redirs 0 --retry 0 --noproxy '*' \
  --silent --show-error --request POST --max-time "$MAXTIME" --output "$BODY.part" --write-out '%{http_code}' "$HUB/admin/probe/earthview" 2>"$META.err"); RC=$?
unset KEY
T1=$(utc)
[ -e "$BODY.part" ] && mv "$BODY.part" "$BODY"
{ echo "called_at: $T0"; echo "answered_at: $T1"; echo "curl_exit: $RC"; echo "http_status: $HTTP"
  echo "answer_file: $( [ -s "$BODY" ] && echo "observation-$N.json ($(wc -c < "$BODY" | tr -d ' ') bytes)" || echo none )"; echo "curl_message: $(head -c 300 "$META.err" 2>/dev/null | tr '\n' ' ')"; } | note
rm -f "$META.err"
if [ "$RC" -ne 0 ] || [ ! -s "$BODY" ]; then echo "No usable answer (curl exit $RC, HTTP $HTTP). This observation is INCOMPLETE and is not repeated. Recorded in $META"; exit 7; fi
if [ "$HTTP" != 200 ]; then echo "The hub answered HTTP $HTTP, saved as received. This is not a completed observation and it is not repeated. Recorded in $META"; exit 8; fi
echo "Done: HTTP 200. Saved $BODY"; echo "Nothing more to do here. Tell Claude that observation $N has run."
