#!/usr/bin/env bash
# Generator tests (run where the pinned inputs are, e.g. the Mac packet's inputs/):
#   bash phase1/ocean-heat/test_generator.sh <inputs dir> <committed snapshot dir>
# 1. a clean build, then --check is byte-identical to the committed snapshot;
# 2. each fault fixture makes the build STOP (non-zero exit) and writes nothing;
# 3. the code break loose-identity lets the shift-one fixture through (proves the identity checks are what stop it).
set -u
IN="$1"; SNAP="$2"; G="$(dirname "$0")/build_ocean_heat.py"; T="$(mktemp -d)"; pass=0; fail=0
ok() { if [ "$2" = 1 ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL  $1"; fi; }
python3 "$G" --inputs "$IN" --out "$SNAP" --check >/dev/null 2>&1; ok "committed snapshot reproduces byte-for-byte (--check)" $([ $? = 0 ] && echo 1 || echo 0)
for f in no-flip shift-one land-from-fill wrong-hash; do
  rm -rf "$T/o"; BREAK=$f python3 "$G" --inputs "$IN" --out "$T/o" >/dev/null 2>"$T/e"; rc=$?
  ok "fixture $f stops the build (exit $rc: $(tail -1 "$T/e" | cut -c1-80))" $([ $rc != 0 ] && [ ! -e "$T/o" ] && echo 1 || echo 0)
done
rm -rf "$T/o"; BREAK=shift-one,loose-identity python3 "$G" --inputs "$IN" --out "$T/o" >/dev/null 2>&1; rc=$?
ok "code break loose-identity: shift-one fixture is NOT stopped (so the identity checks are what catch it)" $([ $rc = 0 ] && echo 1 || echo 0)
echo "$pass passed, $fail failed"; rm -rf "$T"; [ $fail = 0 ]
