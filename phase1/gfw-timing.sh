#!/bin/bash
# Mother Earth — GFW timing: does query time scale with cell size / alert density?
# Measured 1 Nov 2026 (cold → warm): amazon4 25 s → 2 s; amazon2 6 s; congo4/sahara4/borneo4 504 at 30 s → 2/7/11 s on the re-ask (GFW caches).
API="https://data-api.globalforestwatch.org"
KEY=$(grep -m1 '^| GFW_API_KEY' "$HOME/mother-earth/KEYS.md" | awk -F'|' '{gsub(/ /,"",$3); print $3}')
SINCE=$(date -u -v-7d +%Y-%m-%d)
q() { # name west south east north
  BODY="{\"sql\":\"SELECT gfw_integrated_alerts__confidence, COUNT(*) AS n FROM results WHERE gfw_integrated_alerts__date >= '$SINCE' GROUP BY gfw_integrated_alerts__confidence\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[$2,$3],[$4,$3],[$4,$5],[$2,$5],[$2,$3]]]}}"
  OUT="$HOME/mother-earth/state/gfw-timing-$1.json"; START=$(date +%s)
  HTTP=$(curl -sS -L -m 170 -o "$OUT" -w '%{http_code}' -X POST "$API/dataset/gfw_integrated_alerts/latest/query/json" -H "x-api-key: $KEY" -H "Origin: https://theonetheonlythechad.github.io" -H "Content-Type: application/json" -d "$BODY")
  echo "$1 http=$HTTP seconds=$(( $(date +%s) - START )) $(head -c 300 "$OUT")"
}
q amazon4_again -64 -8 -60 -4
q amazon2 -64 -8 -62 -6
q congo4 16 -4 20 0
q sahara4 8 20 12 24
q borneo4 112 -4 116 0
