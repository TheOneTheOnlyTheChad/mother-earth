#!/usr/bin/env python3
"""Compare the first-band trial outputs with the committed-hash samples (MOON-DIVINER-PROPOSAL rev 2 §7.5). Build tooling.

Usage: python3 -I trial_compare.py <samples-dir> <extraction.i32.gz> <band-planes.bin>
 - checks the two outputs' SHA-256 against the trial's recorded values
 - extraction: longitudes 0-9 and 360-369 of the band must equal, byte for byte, diviner_ref.py's extraction of the two sample patches
 - band planes (20 rows x 720 columns, page order): the 2 x 200 cells of the sample patches must equal diviner_ref.py's codes
 - reports the band's own distribution of n, no-valid-data share and range (measured on this band only)
Exits 1 on any mismatch."""
import sys
import os
import json
import gzip
import hashlib
import subprocess
import numpy as np

samples, extp, plp = sys.argv[1:4]
HERE = os.path.dirname(os.path.abspath(__file__))
EXT_GZ = '6ad7aac03c37fa36f835ad42c9c76ba7b8f1bd5d0aaf52c9bb5f3fc85deb1a40'
EXT_RAW = '6f0f2287c1d8e6bb22ad8ba4b250bb5f076c83e8f5d47f0b2e2a3504a917f495'
PLANES = '0189d956e94b9204d5f8762acfb764a171e6fc9d5845d6b682c0fbb2d54a6c79'
fails = []


def check(c, m):
    print(('  OK   ' if c else '  FAIL ') + m)
    if not c:
        fails.append(m)


def find(f):
    for d in (samples, os.path.join(samples, 'diviner')):
        p = os.path.join(d, f)
        if os.path.isfile(p):
            return p
    sys.exit('missing ' + f)


gzb = open(extp, 'rb').read()
raw = gzip.decompress(gzb)
pl = open(plp, 'rb').read()
print('== T1 output hashes')
check(hashlib.sha256(gzb).hexdigest() == EXT_GZ, f'extraction gzip sha256 ({len(gzb)} B)')
check(hashlib.sha256(raw).hexdigest() == EXT_RAW and len(raw) == 5529600, f'extraction raw sha256 ({len(raw)} B)')
check(hashlib.sha256(pl).hexdigest() == PLANES and len(pl) == 115200, f'band planes sha256 ({len(pl)} B)')

ext = np.frombuffer(raw, '<i4').reshape(720, 20, 96)
cells = 14400
vN = np.frombuffer(pl[0:2 * cells], '<u2').reshape(20, 720)
vM = np.frombuffer(pl[2 * cells:4 * cells], '<u2').reshape(20, 720)
nN = np.frombuffer(pl[4 * cells:5 * cells], 'u1').reshape(20, 720)
nM = np.frombuffer(pl[5 * cells:6 * cells], 'u1').reshape(20, 720)
rN = np.frombuffer(pl[6 * cells:7 * cells], 'u1').reshape(20, 720)
rM = np.frombuffer(pl[7 * cells:8 * cells], 'u1').reshape(20, 720)

print('\n== T2 the two sample patches inside this band against the independent reference')
for f, lon_start in [('gcp_00n10n_rows0-19199.tab', 0), ('gcp_00n10n_lon000-009.tab', 360)]:
    tmp = '/tmp/trial-ref-' + f + '.i32'
    ref = json.loads(subprocess.check_output(['python3', '-I', os.path.join(HERE, 'diviner_ref.py'), find(f), '25', str(lon_start), '10', '--extract', tmp]))
    refx = np.frombuffer(open(tmp, 'rb').read(), '<i4').reshape(10, 20, 96)
    os.unlink(tmp)
    check(np.array_equal(ext[lon_start:lon_start + 10], refx), f'{f}: extraction of longitudes {lon_start}-{lon_start + 9} identical ({refx.size} values)')
    bad = 0
    for c in ref['cells']:
        lon_idx = (c['lonx100'] + 17975) // 50
        col = (lon_idx + 360) % 720
        row = 19 - (c['latx100'] - 25) // 50
        got_n = {'value': int(vN[row, col]), 'n': int(nN[row, col]), 'range': int(rN[row, col])}
        got_m = {'value': int(vM[row, col]), 'n': int(nM[row, col]), 'range': int(rM[row, col])}
        if got_n != c['noon'] or got_m != c['mid']:
            bad += 1
    check(bad == 0 and len(ref['cells']) == 200, f'{f}: 200 cells x 2 windows identical to the reference ({bad} differ)')

# Index anchors (rev 2 §8 item 3a) are exercised by T2: each reference cell is located at page column (lonIdx + 360) % 720
# (-179.75 -> column 360, i.e. 180.25 E; +0.25 E -> column 0) and row 19 - (lat - 0.25) / 0.5 (row 0 = 9.75 N, row 19 = 0.25 N).
# A wrong column or row mapping makes T2 fail; no separate check is printed here.

print('\n== T3 this band (00N-10N, 14,400 cells), measured')
valid = ext > -99980000
print(f'  tbol values {ext.size}: empty {int((ext == -99990000).sum())}, invalid {int((ext == -99980000).sum())}, '
      f'valid {int(valid.sum())}; min {ext[valid].min() / 1e4:.4f} K, max {ext[valid].max() / 1e4:.4f} K')
for name, v, n, r in [('noon', vN, nN, rN), ('midnight', vM, nM, rM)]:
    hist = np.bincount(n.ravel(), minlength=5).tolist()
    nodata = int((v == 0).sum())
    rr = r[(n >= 2)]
    vv = v[v >= 2] / 10
    print(f'  {name}: n histogram {hist}; no valid data {nodata} ({nodata / cells * 100:.2f}%); withheld {int((v == 1).sum())}; '
          f'value {vv.min():.1f}-{vv.max():.1f} K (1st/99th pct {np.percentile(vv, 1):.1f}/{np.percentile(vv, 99):.1f}); '
          f'range (n>=2) median {np.median(rr):.0f} K, 99th pct {np.percentile(rr, 99):.0f} K, max {rr.max()} K, capped {int((rr == 254).sum())}')
    rows = []
    for row in range(20):
        lat = 9.75 - 0.5 * row
        rows.append(f'{lat:.2f}:{int((v[row] == 0).sum())}')
    print(f'    no-valid-data cells by latitude row: ' + ', '.join(rows))
# consistency rules of rev 2 §6.3 on this band
for name, v, n, r in [('noon', vN, nN, rN), ('midnight', vM, nM, rM)]:
    ok = ((v == 0) == (n == 0)).all() and ((v >= 2) == ((n >= 1) & (n <= 4))).all() and ((r == 255) == (n <= 1)).all() and (v <= 4500).all() and not (v == 1).any()
    check(bool(ok), f'{name}: §6.3 cell consistency rules hold on all 14,400 cells')

print('\nRESULT: ' + ('PASS' if not fails else 'FAIL: ' + '; '.join(fails)))
sys.exit(1 if fails else 0)
