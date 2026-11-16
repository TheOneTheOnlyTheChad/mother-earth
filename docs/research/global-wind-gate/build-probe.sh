#!/bin/sh
# Builds the single-file probe Worker: the decoder plus the probe handler.
# Usage: build-probe.sh <NOT_AFTER ISO time> <SHA-256 hex of the probe key>   (the key itself never goes in the repo)
set -eu
cd "$(dirname "$0")"
cat gribwind.mjs probe-handler.part.mjs | sed -e "s/__NOT_AFTER__/$1/" -e "s/__KEY_SHA256__/$2/" > probe-worker.mjs
node --input-type=module -e "await import('./probe-worker.mjs')"
sha256sum probe-worker.mjs
