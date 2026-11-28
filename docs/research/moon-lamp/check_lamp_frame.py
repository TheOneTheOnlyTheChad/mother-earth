#!/usr/bin/env python3
"""Moon item 7 (LAMP): independent orientation check of the GDR south map.

The GDR's data-quality map flags "possible sunlit peak" pixels (value 4,
also 5 and 6). Sunlit peaks are high ground, so under the right reading of
the file the flagged pixels should sit higher than other pixels at the same
latitude in an independent height product. Eight readings are tested: the
one printed in the archive (DSMAP_POLAR.CAT: Y = (J - N/2 - 0.5) * scale,
LON = ATAN2(X, Y), with line J counted from the file's first record, as the
label's LINE_DISPLAY_DIRECTION = UP implies), and its mirrors and rotations.
Result recorded 28 Nov 2026: the printed reading fails; reading B (the file's
first record nearest longitude 0, i.e. lines counted top to bottom, longitude 0
up, 90 E to the right) ranks first by a wide margin.

Height reference: the repository's own released LOLA grid
assets/moon/lola/ldem4-m-R1.i16.gz (LDEM_4_FLOAT V3.0, whole metres,
0.25 deg cells). It is coarse at the pole (a 0.25 deg row is about 7.6 km),
so the test is restricted to 80-88 S and is a registration check of large
features only, not a check at the GDR's 240 m scale.

Usage: python3 -I check_lamp_frame.py <dir with the retained LAMP files> <repo root>
Docs only. Needs numpy. Exits 1 unless reading B ranks first by at least 500 m.
"""
import gzip, hashlib, json, sys
import numpy as np

D, REPO = sys.argv[1], sys.argv[2]
def sha(b): return hashlib.sha256(b).hexdigest()
qraw = open(D + '/LAMP_80s_240mpp_lya_dqual_01.img', 'rb').read()
assert sha(qraw) == '3f071a9e8afbddc399b2523d6f3995994c9f7f26e27d0e5771de42e1a6ff2754'
lraw = open(REPO + '/assets/moon/lola/ldem4-m-R1.i16.gz', 'rb').read()
assert sha(lraw) == 'af4450019840918da4a62812f4969ad07a0c77bf3f878ef59ca7e8961cc7d43d'
H = np.frombuffer(gzip.decompress(lraw), '<i2').reshape(720, 1440).astype(float)

N, S, R = 2501, 240.0, 1737400.0
Q = np.frombuffer(qraw, '<f4').reshape(N, N)   # array row k = line J = k+1
X = (np.arange(1, N + 1) - N / 2 - 0.5) * S
XX, YY = np.meshgrid(X, X)                     # XX from sample I, YY from line J
RR = np.hypot(XX, YY)
LAT = -90 + np.degrees(2 * np.arctan(0.5 * RR / R))
band = (LAT <= -80) & (LAT >= -88)
peak = band & np.isin(Q, (4, 5, 6))
other = band & (Q == 0)

def height(lat, lon):
    r = np.clip(((90 - lat) / 0.25).astype(int), 0, 719)
    c = np.clip((lon % 360 / 0.25).astype(int), 0, 1439)
    return H[r, c]

def score(lonfun):
    lon = lonfun(XX, YY) % 360
    h = height(LAT, lon)
    # height above the mean of quality-0 pixels in the same 0.25 deg latitude row
    rowk = ((90 - LAT) / 0.25).astype(int)
    out = []
    for k in np.unique(rowk[peak]):
        m0 = other & (rowk == k); m1 = peak & (rowk == k)
        if m0.sum() > 100 and m1.sum() > 0:
            out.append((h[m1] - h[m0].mean()).mean() * m1.sum())
    n = int(peak.sum())
    return round(float(sum(out) / n), 1)

cands = {
    'A as printed: lon=atan2(X,Y), first record at lon 180': lambda x, y: np.degrees(np.arctan2(x, y)),
    'A mirrored E-W: lon=atan2(-X,Y)': lambda x, y: np.degrees(np.arctan2(-x, y)),
    'B: lon=atan2(X,-Y), first record at lon 0 (lines top to bottom)': lambda x, y: np.degrees(np.arctan2(x, -y)),
    'B mirrored E-W (= A rotated 180)': lambda x, y: np.degrees(np.arctan2(-x, -y)),
    'rotate +90': lambda x, y: np.degrees(np.arctan2(x, y)) + 90,
    'rotate -90': lambda x, y: np.degrees(np.arctan2(x, y)) - 90,
    'transpose': lambda x, y: np.degrees(np.arctan2(y, x)),
    'anti-transpose': lambda x, y: np.degrees(np.arctan2(-y, -x)),
}
res = {k: score(f) for k, f in cands.items()}
best = max(res, key=res.get)
out = {'flagged_peak_pixels_80_88S': int(peak.sum()),
       'mean_height_above_same_row_quality0_m': res, 'best': best,
       'margin_to_second_m': round(sorted(res.values())[-1] - sorted(res.values())[-2], 1)}
print(json.dumps(out, indent=1))
sys.exit(0 if best.startswith('B:') and out['margin_to_second_m'] >= 500 else 1)
