#!/usr/bin/env python3
"""Synthetic Ocean Heat snapshots for the browser tests (never shipped as data). Same format as build_ocean_heat.py.
  seam:  land everywhere except four water strips between 30°S and 30°N, each 0.5° wide (10 native columns):
         −180…−179.5 → −2.50 °C (class 2, blue)   ·  179.5…180 → +2.50 °C (class 8, orange)   [the 180° seam]
         −0.5…0      → 0.00 °C (near normal, pale) ·  0…0.5     → +2.50 °C (orange)          [the P1 two-tile join at 0°]
         The join is deliberately NOT a copy of the seam: a mirrored mesh (seam ↔ join, order reversed) or a π-rotated
         mesh (seam ↔ join) then shows pale or orange where blue belongs, so the rendered check must fail.
         SST 20.00 °C in every water cell. Valid for both value grids (0.25° and 0.5°).
Usage: python3 build_fixture.py OUTDIR [--date YYYY-MM-DD] [--rows-v050 N]   (the last two make deliberately wrong manifests)
Prints the manifest sha256, which the harness pins in the served oceanheat.js."""
import sys, json, zlib, hashlib, numpy as np
out = sys.argv[1]; date = '2026-11-09'; rows050 = 360
a = sys.argv[2:]
if '--date' in a: date = a[a.index('--date') + 1]
if '--rows-v050' in a: rows050 = int(a[a.index('--rows-v050') + 1])
code = np.ones((3600, 7200), np.uint8)
STRIPS = [(0, 10, -250), (7190, 7200, 250), (3590, 3600, 0), (3600, 3610, 250)]
for c0, c1, _ in STRIPS: code[1200:2400, c0:c1] = 0
code[1200:2400, 3601] = 1   # one land column inside the orange join strip: a one-texel tile shift shows land where col 3600's water belongs
ANOM = np.zeros((3600, 7200), np.int32)
for c0, c1, v in STRIPS: ANOM[1200:2400, c0:c1] = v
flat = code.reshape(-1); packed = (flat[0::4] | (flat[1::4] << 2) | (flat[2::4] << 4) | (flat[3::4] << 6)).astype(np.uint8).tobytes()
def values(res):   # block values computed from the native code/anomaly arrays (n and land counted, not assumed)
    k = round(res / 0.05); R, C = 3600 // k, 7200 // k
    w = (code == 0).reshape(R, k, C, k); n = w.sum(axis=(1, 3)); land = (code == 1).reshape(R, k, C, k).sum(axis=(1, 3))
    asum = np.where(w, ANOM.reshape(R, k, C, k), 0).sum(axis=(1, 3)).astype(np.int64)
    anom = np.where(n > 0, asum // np.maximum(n, 1), 0).astype(np.int32)       # strips are uniform, so the mean is exact
    sst = np.where(n > 0, 2000, 0).astype(np.int32); ok = (n > 0).astype(np.uint8)
    def ds(x):
        d = np.diff(x, axis=1, prepend=0); b = d.astype('<i2').view(np.uint8).reshape(-1); return b[0::2].tobytes() + b[1::2].tobytes()
    raw = ds(anom) + ds(sst) + n.astype(np.uint8).tobytes() + land.astype(np.uint8).tobytes() + ok.tobytes()
    return raw, dict(res=res, rows=R if not (res == 0.5) else rows050, cols=C, cells_per_block=k * k)
import os; os.makedirs(out, exist_ok=True)
files = {}
z = zlib.compress(packed, 9); open(os.path.join(out, 'mask.bin.z'), 'wb').write(z)
files['mask.bin.z'] = dict(sha256=hashlib.sha256(z).hexdigest(), bytes=len(z), raw_bytes=len(packed), role='mask', rows=3600, cols=7200, res=0.05)
for res, nm in ((0.25, 'v025.bin.z'), (0.5, 'v050.bin.z')):
    raw, meta = values(res); z = zlib.compress(raw, 9); open(os.path.join(out, nm), 'wb').write(z)
    files[nm] = dict(sha256=hashlib.sha256(z).hexdigest(), bytes=len(z), raw_bytes=len(raw), role='values', **meta)
man = {'kind': 'Mother Earth Ocean Heat snapshot (TEST FIXTURE: seam)', 'revision': 'oh-2026-11-09-R1', 'data_date': date, 'files': files}
mb = (json.dumps(man, indent=1, sort_keys=True) + '\n').encode(); open(os.path.join(out, 'manifest.json'), 'wb').write(mb)
print(hashlib.sha256(mb).hexdigest())
