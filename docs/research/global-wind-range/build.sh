#!/bin/sh
# Builds the probe Worker from its source. Usage: build.sh <NOT_AFTER ISO time> <SHA-256 hex of the probe key>   (the key never goes in the repo)
set -eu
cd "$(dirname "$0")"
sed -e "s/__NOT_AFTER__/$1/" -e "s/__KEY_SHA256__/$2/" range-probe.src.mjs > range-probe-worker.mjs
node --input-type=module -e "await import('./range-probe-worker.mjs')"
sha256sum range-probe-worker.mjs
