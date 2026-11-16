#!/bin/sh
# Builds the single-file probe Worker: the decoder plus the probe handler. Usage: build-probe.sh <NOT_AFTER ISO time>
set -eu
cd "$(dirname "$0")"
cat gribwind.mjs probe-handler.part.mjs | sed "s/__NOT_AFTER__/$1/" > probe-worker.mjs
node --input-type=module -e "await import('./probe-worker.mjs')"
sha256sum probe-worker.mjs
