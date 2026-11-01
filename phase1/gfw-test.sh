#!/bin/bash
# Mother Earth — GFW key test: which Origin does the key accept, and does a 4° cell query answer?
API="https://data-api.globalforestwatch.org"
KEY=$(grep -m1 '^| GFW_API_KEY' "$HOME/mother-earth/KEYS.md" | awk -F'|' '{gsub(/ /,"",$3); print $3}')
[ -z "$KEY" ] && { echo "no GFW_API_KEY in KEYS.md"; exit 1; }
echo "key length ${#KEY}"
SINCE=$(date -u -v-7d +%Y-%m-%d)
BODY="{\"sql\":\"SELECT gfw_integrated_alerts__confidence, COUNT(*) AS n FROM results WHERE gfw_integrated_alerts__date >= '$SINCE' GROUP BY gfw_integrated_alerts__confidence\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[-64,-8],[-60,-8],[-60,-4],[-64,-4],[-64,-8]]]}}"
for ORIGIN in "https://theonetheonlythechad.github.io" "https://mother-earth.chadoberholzer.workers.dev" "none"; do
  OUT="$HOME/mother-earth/state/gfw-sample-$(echo "$ORIGIN" | tr -dc 'a-z').json"
  START=$(date +%s)
  if [ "$ORIGIN" = "none" ]; then
    HTTP=$(curl -sS -L -m 170 -o "$OUT" -w '%{http_code}' -X POST "$API/dataset/gfw_integrated_alerts/latest/query/json" -H "x-api-key: $KEY" -H "Content-Type: application/json" -d "$BODY")
  else
    HTTP=$(curl -sS -L -m 170 -o "$OUT" -w '%{http_code}' -X POST "$API/dataset/gfw_integrated_alerts/latest/query/json" -H "x-api-key: $KEY" -H "Origin: $ORIGIN" -H "Content-Type: application/json" -d "$BODY")
  fi
  echo "--- origin=$ORIGIN http=$HTTP seconds=$(( $(date +%s) - START )) bytes=$(wc -c < "$OUT" | tr -d ' ')"
  head -c 400 "$OUT"; echo
  [ "$HTTP" = "200" ] && break
done
