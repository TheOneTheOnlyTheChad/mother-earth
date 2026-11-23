#!/bin/bash
# Earth from Space, hub 0.6.22: ONE call to the hub's Earth from Space admin routes, under a step id from the runbook.
#
#   ./earthview-admin.sh <step id> <command> [plan id]
#
#   Read-only commands (GET; write nothing on the hub; may be repeated; each answer is saved under the next free number):
#     status | recover-plan | sweep-plan | release-plan
#       e.g.  ./earthview-admin.sh C1 status
#             ./earthview-admin.sh C3 recover-plan
#   Commands that can change something (POST). Each needs a step id that NAMES it, and each step id can be used ONCE:
#     hold            step id <letter><digits>-hold[-<n>]        e.g.  ./earthview-admin.sh C2-hold hold
#     recover-apply   step id ...-recover[-<n>]  + plan id       e.g.  ./earthview-admin.sh C4-recover recover-apply 0123456789abcdef
#     sweep-apply     step id ...-sweep[-<n>]    + plan id
#     release-apply   step id ...-release[-<n>]                  e.g.  ./earthview-admin.sh C5-release release-apply
#     run             step id C7-run-1 or C7-run-2 ONLY          e.g.  ./earthview-admin.sh C7-run-1 run
#
# THE ONE-CALL CONTRACT (as for the Stage B caller)
# - A step that can change something is CLAIMED before the call: the claim is a directory made with mkdir, which either makes it
#   or fails, so of two launches at the same moment exactly one goes on. The claim is never removed by this script: not after a
#   failure, a timeout or an interruption. A claimed step is never called again. A lost answer is RECONCILED, not repeated.
# - curl is started with -q FIRST and with an emptied environment, with retries, redirects and protocols fixed on its own command
#   line. Nothing inherited can add a second request.
# - The admin key is read from KEYS.md by this script and handed to curl on its standard input as an Authorization header: never
#   typed, never printed, never in a file this script writes, never on a command line, and NEVER in a URL. This script cannot build
#   a URL that contains it.
# - The manual run exists only as C7-run-1 and C7-run-2 (Stage C). C7-run-2 is refused unless C7-run-1 was called between 10 and 40
#   minutes ago and its saved answer does not say "published". Whether the other conditions for a second run hold (a positively
#   identified source failure, storage reconciled, hub healthy) is for the people running the stage: this script cannot know.
# Order: arguments, then the key (a missing key stops here and claims nothing), then the claim, then the call.
# Files in <out>: <step id>.claim/ (mutating steps), <step id>.json or <step id>.<n>.json (the hub's answer as received), and .meta.txt beside it.
# Exit: 0 answer saved with HTTP 200 · 2 usage · 3 cannot write · 4 already claimed · 5 second run not permitted now
#       6 key unreadable · 7 no usable answer (RECONCILE; do not repeat) · 8 answer saved but not HTTP 200 · 9 interrupted
set -u
STEP="${1:-}"; CMD="${2:-}"; PLAN="${3:-}"
HUB='https://mother-earth.chadoberholzer.workers.dev'; MAXTIME=300
# For this script's own test suite only (a local stand-in for the hub). Never set these for a real call.
if [ -n "${EV_ADMIN_TEST_HUB:-}" ]; then HUB="$EV_ADMIN_TEST_HUB"; MAXTIME="${EV_ADMIN_TEST_MAX_TIME:-300}"; fi
OUT="${OUT:-$HOME/Documents/Mother Earth/_review/earth-from-space-stage-c/results}"
KEYS_FILE="${KEYS_FILE:-$([ -f "$HOME/mother-earth/KEYS.md" ] && echo "$HOME/mother-earth/KEYS.md" || echo "$HOME/Documents/Mother Earth/KEYS.md")}"
usage() { echo "usage: $0 <step id> <status|recover-plan|sweep-plan|release-plan|hold|recover-apply <plan>|sweep-apply <plan>|release-apply|run> (see the head of this file)" >&2; exit 2; }
case "$STEP" in ''|*[!A-Za-z0-9-]*|-*|*-) usage;; esac
case "$STEP" in [A-Z]*) ;; *) usage;; esac
[ "${#STEP}" -le 40 ] || usage
[ "$#" -le 3 ] || usage
MUT=no; METHOD=GET; URLPATH=''; WORD=''
case "$CMD" in
  status)        URLPATH='/admin/earthview/status';;
  recover-plan)  URLPATH='/admin/earthview/recover';;
  sweep-plan)    URLPATH='/admin/earthview/sweep';;
  release-plan)  URLPATH='/admin/earthview/release';;
  hold)          MUT=yes; METHOD=POST; WORD=hold;    URLPATH='/admin/earthview/hold?apply=1';;
  recover-apply) MUT=yes; METHOD=POST; WORD=recover; URLPATH='/admin/earthview/recover?apply=1&plan=';;
  sweep-apply)   MUT=yes; METHOD=POST; WORD=sweep;   URLPATH='/admin/earthview/sweep?apply=1&plan=';;
  release-apply) MUT=yes; METHOD=POST; WORD=release; URLPATH='/admin/earthview/release?apply=1';;
  run)           MUT=yes; METHOD=POST; WORD=run;     URLPATH='/admin/run/earthview';;
  *) usage;;
esac
case "$CMD" in
  recover-apply|sweep-apply) case "$PLAN" in ????????????????) ;; *) echo "this command needs the 16-character plan id from its dry run" >&2; exit 2;; esac
                             case "$PLAN" in *[!0-9a-f]*) echo "a plan id is 16 characters, 0-9 and a-f" >&2; exit 2;; esac
                             URLPATH="$URLPATH$PLAN";;
  *) [ -z "$PLAN" ] || { echo "this command takes no plan id" >&2; exit 2; };;
esac
if [ "$MUT" = yes ]; then
  if [ "$WORD" = run ]; then case "$STEP" in C7-run-1|C7-run-2) ;; *) echo "the manual run exists only as step C7-run-1 or C7-run-2" >&2; exit 2;; esac
  else
    REST="${STEP#[A-Z]}"; DIG="${REST%%-*}"; TAIL="${REST#*-}"
    case "$REST" in *-*) ;; *) echo "step id '$STEP' does not name the command '$CMD' (expected like C2-$WORD)" >&2; exit 2;; esac
    case "$DIG" in ''|*[!0-9]*) echo "step id '$STEP' does not name the command '$CMD' (expected like C2-$WORD)" >&2; exit 2;; esac
    case "$TAIL" in "$WORD") ;; "$WORD"-*) N="${TAIL#"$WORD"-}"; case "$N" in ''|*[!0-9]*) echo "step id '$STEP' does not name the command '$CMD'" >&2; exit 2;; esac;;
      *) echo "step id '$STEP' does not name the command '$CMD' (expected like C2-$WORD)" >&2; exit 2;; esac
  fi
else
  case "$STEP" in *-hold|*-hold-*|*-recover|*-recover-*|*-sweep|*-sweep-*|*-release|*-release-*|*-run|*-run-*) echo "step id '$STEP' names a step that changes something; '$CMD' is read-only. Use the read-only step's own id (like C1 or C3)." >&2; exit 2;; esac
fi
case "$HUB" in https://*) PROTO='=https';; http://127.0.0.1:*) PROTO='=http';; *) echo "refusing this hub address" >&2; exit 2;; esac
utc() { date -u +%Y-%m-%dT%H:%M:%SZ; }
epoch() { date -u -j -f "%Y-%m-%dT%H:%M:%SZ" "$1" +%s 2>/dev/null || date -u -d "$1" +%s 2>/dev/null; }
mkdir -p "$OUT" || exit 3
keyval() { grep -m1 "^| $1" "$KEYS_FILE" 2>/dev/null | awk -F'|' '{gsub(/ /,"",$3); print $3}'; }
KEY="$(keyval ADMIN_KEY)"
if [ -z "$KEY" ]; then echo "ADMIN_KEY unreadable from $KEYS_FILE; nothing claimed, nothing called" >&2; exit 6; fi
# ---- the second manual run: only 10 to 40 minutes after the first was called, and never after a published first run
if [ "$STEP" = C7-run-2 ]; then
  M1="$OUT/C7-run-1.meta.txt"; B1="$OUT/C7-run-1.json"
  if [ ! -d "$OUT/C7-run-1.claim" ] || [ ! -s "$M1" ]; then unset KEY; echo "C7-run-2 is refused: C7-run-1 has not been run from this results folder." >&2; exit 5; fi
  C1=$(sed -n 's/^called_at: //p' "$M1" | head -1); S1=$(epoch "$C1"); NOW=$(date -u +%s)
  case "$S1" in ''|*[!0-9]*) unset KEY; echo "C7-run-2 is refused: C7-run-1 has no recorded call time (it was not called, or was interrupted). Reconcile; a second run is not permitted." >&2; exit 5;; esac
  if [ -s "$B1" ] && grep -q 'published' "$B1"; then unset KEY; echo "C7-run-2 is refused: C7-run-1's answer says a frame was published." >&2; exit 5; fi
  if [ ! -s "$B1" ]; then unset KEY; echo "C7-run-2 is refused: C7-run-1 has no saved answer (a lost answer is reconciled, not repeated)." >&2; exit 5; fi
  AGE=$((NOW - S1))
  if [ "$AGE" -lt 600 ]; then unset KEY; echo "C7-run-2 is refused: only $AGE s since C7-run-1 was called; not sooner than 10 minutes." >&2; exit 5; fi
  if [ "$AGE" -gt 2400 ]; then unset KEY; echo "C7-run-2 is refused: $AGE s since C7-run-1 was called; not later than 40 minutes. Stage C ends here." >&2; exit 5; fi
fi
# ---- where the answer goes; a step that changes something is claimed first, atomically, and the claim is kept
if [ "$MUT" = yes ]; then
  CLAIM="$OUT/$STEP.claim"; BASE="$OUT/$STEP"
  if ! mkdir "$CLAIM" 2>/dev/null; then unset KEY
    echo "Step $STEP is already claimed ($CLAIM). It is not called again, whatever its result was. If its answer was lost: reconcile, do not repeat." >&2; [ -s "$BASE.meta.txt" ] && sed 's/^/  /' "$BASE.meta.txt" >&2; exit 4; fi
  { echo "claimed_at: $(utc)"; echo "pid: $$"; echo "command: $CMD"; } > "$CLAIM/claim.txt"
else
  K=1; while ! ( set -o noclobber; : > "$OUT/$STEP.$K.meta.txt" ) 2>/dev/null; do K=$((K + 1)); [ "$K" -le 500 ] || { unset KEY; echo "cannot find a free answer number" >&2; exit 3; }; done
  BASE="$OUT/$STEP.$K"
fi
BODY="$BASE.json"; META="$BASE.meta.txt"
note() { { echo "step: $STEP"; echo "command: $CMD"; printf 'request: %s %s%s\n' "$METHOD" "$HUB" "$URLPATH"; cat; } > "$META"; }
CALLED=no; DONE=no
trap 'unset KEY; if [ "$DONE" = no ]; then printf "result: INTERRUPTED at %s (%s). Not repeated: reconcile.\n" "$(utc)" "$([ "$CALLED" = yes ] && echo "after the call was started" || echo "before any call")" | note; fi; rm -f "$META.err"; exit 9' INT TERM HUP
T0=$(utc); CALLED=yes
[ "$MUT" = yes ] && echo "Calling the hub once at $T0 for step $STEP ($CMD). Do not start it again."
# ONE request. -q must be curl's first argument. The key reaches curl on standard input only, as a header.
HTTP=$(printf 'header = "Authorization: Bearer %s"\n' "$KEY" | env -i PATH="$PATH" HOME="$HOME" curl -q --config - --proto "$PROTO" --max-redirs 0 --retry 0 --noproxy '*' \
  --silent --show-error --request "$METHOD" --max-time "$MAXTIME" --output "$BODY.part" --write-out '%{http_code}' "$HUB$URLPATH" 2>"$META.err"); RC=$?
unset KEY
T1=$(utc)
[ -e "$BODY.part" ] && mv "$BODY.part" "$BODY"
{ echo "called_at: $T0"; echo "answered_at: $T1"; echo "curl_exit: $RC"; echo "http_status: $HTTP"
  echo "answer_file: $( [ -s "$BODY" ] && echo "$(basename "$BODY") ($(wc -c < "$BODY" | tr -d ' ') bytes)" || echo none )"; echo "curl_message: $(head -c 300 "$META.err" 2>/dev/null | tr '\n' ' ')"; } | note
DONE=yes; rm -f "$META.err"
if [ "$RC" -ne 0 ] || [ ! -s "$BODY" ]; then
  if [ "$MUT" = yes ]; then echo "No usable answer (curl exit $RC, HTTP $HTTP). The call may still have taken effect on the hub. Do NOT repeat it: tell Claude, and reconcile. Recorded in $META"
  else echo "No usable answer (curl exit $RC, HTTP $HTTP). Nothing was changed by this read-only call. Recorded in $META"; fi
  exit 7; fi
if [ "$HTTP" != 200 ]; then echo "The hub answered HTTP $HTTP, saved as received in $BODY. Tell Claude before doing anything else."; exit 8; fi
echo "Done: HTTP 200. Saved $BODY"; echo "Tell Claude that step $STEP has run."
