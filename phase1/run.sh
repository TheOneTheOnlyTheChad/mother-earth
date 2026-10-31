#!/bin/bash
# Mother Earth — run a Mac collector and log to logs/<layer>-<timestamp>.log (and logs/<layer>-latest.log).
# Usage: ./run.sh ships [--dry] [--window=60]      ./run.sh mock
# Keys are read from ../KEYS.md (INGEST_KEY, AISSTREAM_KEY rows) so nothing is typed in Terminal.
cd "$(dirname "$0")" || exit 2
LAYER="${1:-mock}"; shift
export INGEST_KEY="$(grep -m1 '^| INGEST_KEY' ../KEYS.md | awk -F'|' '{gsub(/ /,"",$3); print $3}')"
export AISSTREAM_KEY="$(grep -m1 '^| AISSTREAM_KEY' ../KEYS.md | awk -F'|' '{gsub(/ /,"",$3); print $3}')"
mkdir -p logs
TS="$(date -u +%Y-%m-%dT%H-%MZ)"; LOG="logs/${LAYER}-${TS}.log"
{ echo "== $TS $LAYER $* node $(node -v)"; node collector-mac.mjs "$LAYER" "$@" --quiet; echo "== exit $?"; } > "$LOG" 2>&1
cp "$LOG" "logs/${LAYER}-latest.log"
tail -n 4 "$LOG"
