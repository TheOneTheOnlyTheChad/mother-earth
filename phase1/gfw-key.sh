#!/bin/bash
# Mother Earth — Global Forest Watch Data API: create an API key and measure one cell query.
# Run from the Mac Terminal:  ~/mother-earth/gfw-key.sh
# Prerequisite: a GFW account created with email + password (NOT Google/Facebook sign-in)
#   at https://www.globalforestwatch.org/my-gfw/ — confirm the email first.
# What it does:
#   1. asks for the account email and password (password is not echoed, not logged, not saved)
#   2. gets a short-lived access token
#   3. creates an API key (expires after 1 year; domains allowlisted so it gets a higher rate tier)
#   4. appends the key to KEYS.md (runtime copy and project record)
#   5. runs ONE measurement query: alerts in the last 7 days inside a 4° cell over the Amazon
#      (lon -64..-60, lat -8..-4), with timing and response size — the register "Sample" check
# Nothing secret is printed except the key itself, once, so you can see it was created.
set -u
API="https://data-api.globalforestwatch.org"
ORIGIN="https://theonetheonlythechad.github.io"
RUNTIME_KEYS="$HOME/mother-earth/KEYS.md"
PROJECT_KEYS="$HOME/Documents/Mother Earth/KEYS.md"
TODAY=$(date -u +%Y-%m-%d)

read -r -p "GFW account email: " EMAIL
read -r -s -p "GFW password (hidden): " PASSWORD; echo

echo "1/4 token…"
TOKEN=$(curl -sS -m 30 -X POST "$API/auth/token" \
  --data-urlencode "username=$EMAIL" --data-urlencode "password=$PASSWORD" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token") or d.get("access_token") or "")')
unset PASSWORD
if [ -z "$TOKEN" ]; then echo "token failed — wrong email/password, or the account was created with Google/Facebook (needs a password)"; exit 1; fi

echo "2/4 api key…"
KEY_JSON=$(curl -sS -m 30 -X POST "$API/auth/apikey" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"alias\":\"mother-earth\",\"email\":\"$EMAIL\",\"organization\":\"Mother Earth (personal, open project)\",\"domains\":[\"theonetheonlythechad.github.io\",\"mother-earth.chadoberholzer.workers.dev\"]}")
KEY=$(printf '%s' "$KEY_JSON" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("api_key") or d.get("api_key") or "")' 2>/dev/null)
if [ -z "$KEY" ]; then echo "key creation failed:"; echo "$KEY_JSON"; exit 2; fi
echo "key: $KEY"

echo "3/4 KEYS.md…"
ROW="| GFW_API_KEY | $KEY | data-api.globalforestwatch.org/auth/apikey (alias mother-earth; domains github.io + workers.dev; expires 1 year from creation; collector must send Origin: $ORIGIN) | $TODAY |"
for f in "$RUNTIME_KEYS" "$PROJECT_KEYS"; do
  if [ -f "$f" ]; then
    grep -q '^| GFW_API_KEY' "$f" && echo "  $f already has a GFW_API_KEY row — not changed" || { printf '%s\n' "$ROW" >> "$f"; echo "  added to $f"; }
  else echo "  $f not found — row NOT written"; fi
done

echo "4/4 measurement query (one 4° Amazon cell, last 7 days)…"
SINCE=$(date -u -v-7d +%Y-%m-%d 2>/dev/null || date -u -d '7 days ago' +%Y-%m-%d)
BODY=$(cat <<EOF
{"sql":"SELECT gfw_integrated_alerts__confidence, COUNT(*) AS n FROM results WHERE gfw_integrated_alerts__date >= '$SINCE' GROUP BY gfw_integrated_alerts__confidence",
 "geometry":{"type":"Polygon","coordinates":[[[-64,-8],[-60,-8],[-60,-4],[-64,-4],[-64,-8]]]}}
EOF
)
OUT="$HOME/mother-earth/state/gfw-sample.json"
mkdir -p "$(dirname "$OUT")"
START=$(date +%s)
HTTP=$(curl -sS -L -m 170 -o "$OUT" -w '%{http_code}' -X POST "$API/dataset/gfw_integrated_alerts/latest/query/json" \
  -H "x-api-key: $KEY" -H "Origin: $ORIGIN" -H "Content-Type: application/json" -d "$BODY")
END=$(date +%s)
echo "http=$HTTP seconds=$((END-START)) bytes=$(wc -c < "$OUT" | tr -d ' ')"
echo "response (first 1500 chars):"; head -c 1500 "$OUT"; echo
echo "saved to $OUT — tell Claude the http code, seconds and bytes."
