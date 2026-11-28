#!/usr/bin/env python3
"""Moon item 7 (LAMP): coarse orientation diagnostic of the GDR south map. Rev 2 (28 Nov 2026).

Rev 2 answers GPT's R2 on proposal rev 1:
- only the documented "possible sunlit peak" codes 4 and 6 are used (5 is undocumented);
- two baselines are reported: (a) the mean height of quality-0 map pixels in the same 0.25 deg
  LOLA row (rev 1's baseline) and (b) the mean of the whole 0.25 deg LOLA row over all longitudes
  (GPT's independent check), both restricted to 80-88 S;
- the dependence is stated: many 240 m map pixels share one coarse LOLA cell, so the number of
  distinct LOLA cells behind the flagged pixels is reported. They are not independent measurements;
- all eight symmetric readings are kept.

Readings (array row k = stored line J = k+1, counted from the file's first record; sample I = column+1):
  X = (I - 1251) * 240 m,  Y = (J - 1251) * 240 m   [= DSMAP's (I - N/2 - 0.5)*scale with N = 2501]
  A (printed algebra):  LON = ATAN2(X, Y)    -> longitude 0 lies towards the LAST stored record
  B (adopted):          LON = ATAN2(X, -Y)   -> longitude 0 towards the FIRST stored record; with the
                                                first record displayed at the top this is DSMAP's prose:
                                                "Longitude 0 extends straight up ... 90 East ... to the right"
The other six are reflections and rotations of these.

This is a coarse terrain diagnostic of the stored-array-to-longitude relation. It does not test
translation, sub-pixel offsets, arbitrary rotation, scale or registration at 240 m.

Height reference: the repository's released LOLA grid assets/moon/lola/ldem4-m-R1.i16.gz
(LDEM_4_FLOAT V3.0, whole metres, 0.25 deg cells; a row is about 7.6 km).

Usage: python3 -I check_lamp_frame.py <dir with the retained LAMP files> <repo root>
Docs only. Needs numpy. Exits 1 unless reading B ranks first on both baselines by at least 500 m.
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
Q = np.frombuffer(qraw, '<f4').reshape(N, N)
X = (np.arange(1, N + 1) - 1251) * S
XX, YY = np.meshgrid(X, X)          # XX from sample I (columns), YY from line J (rows)
LAT = -90 + np.degrees(2 * np.arctan(0.5 * np.hypot(XX, YY) / R))
band = (LAT <= -80) & (LAT >= -88)
peak = band & np.isin(Q, (4, 6))    # documented codes only
good = band & (Q == 0)
rowk = np.clip(((90 - LAT) / 0.25).astype(int), 0, 719)
rowmean_full = H.mean(axis=1)        # baseline (b): whole LOLA row, all longitudes

def lookup(lon):
    c = np.clip((lon % 360 / 0.25).astype(int), 0, 1439)
    return H[rowk, c], c

def score(lonfun):
    lon = lonfun(XX, YY) % 360
    h, c = lookup(lon)
    tot_a = 0.0
    n = 0
    for k in np.unique(rowk[peak]):
        m1 = peak & (rowk == k); m0 = good & (rowk == k)
        if m0.sum() > 100:
            tot_a += (h[m1] - h[m0].mean()).sum(); n += int(m1.sum())
    hb = h[peak] - rowmean_full[rowk[peak]]
    cells = len(set(zip(rowk[peak].tolist(), c[peak].tolist())))
    return round(float(tot_a / n), 1), round(float(hb.mean()), 1), cells

cands = {
    'A as printed: LON=atan2(X,Y)': lambda x, y: np.degrees(np.arctan2(x, y)),
    'A mirrored E-W: LON=atan2(-X,Y)': lambda x, y: np.degrees(np.arctan2(-x, y)),
    'B adopted: LON=atan2(X,-Y)': lambda x, y: np.degrees(np.arctan2(x, -y)),
    'B mirrored E-W (= A rotated 180)': lambda x, y: np.degrees(np.arctan2(-x, -y)),
    'A rotated +90': lambda x, y: np.degrees(np.arctan2(x, y)) + 90,
    'A rotated -90': lambda x, y: np.degrees(np.arctan2(x, y)) - 90,
    'transpose: LON=atan2(Y,X)': lambda x, y: np.degrees(np.arctan2(y, x)),
    'anti-transpose: LON=atan2(-Y,-X)': lambda x, y: np.degrees(np.arctan2(-y, -x)),
}
res = {k: dict(zip(('above_same_row_quality0_m', 'above_full_lola_row_m', 'distinct_lola_cells'), score(f)))
       for k, f in cands.items()}
out = {'flagged_peak_pixels_codes_4_6_80_88S': int(peak.sum()), 'readings': res}
for base in ('above_same_row_quality0_m', 'above_full_lola_row_m'):
    order = sorted(res, key=lambda k: res[k][base], reverse=True)
    out['rank_' + base] = order
    out['margin_' + base] = round(res[order[0]][base] - res[order[1]][base], 1)
lonB = lambda i, j: round(float(np.degrees(np.arctan2((i - 1251) * S, -(j - 1251) * S)) % 360), 1)
out['reading_B_cardinals (I,J 1-based)'] = {'(1251,1) first record centre': lonB(1251, 1),
                                           '(2501,1251) last sample': lonB(2501, 1251),
                                           '(1251,2501) last record': lonB(1251, 2501),
                                           '(1,1251) first sample': lonB(1, 1251)}
print(json.dumps(out, indent=1))
ok = all(out['rank_' + b][0].startswith('B adopted') and out['margin_' + b] >= 500
         for b in ('above_same_row_quality0_m', 'above_full_lola_row_m'))
sys.exit(0 if ok else 1)
