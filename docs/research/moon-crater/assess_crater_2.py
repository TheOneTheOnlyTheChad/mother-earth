"""Moon item 5 (CRaTER) follow-up checks, 27 Nov 2026 (after assess_crater.py).

(a) What the two per-detector flag columns of L2 PRI actually track in the slice.
(b) Whether the 0.32 km CRaTER-vs-page position difference is the 0.18 s time-tag offset.
(c) The documented sporadic D2 singles elevation, per hour, on both days.
Usage: python3 -I assess_crater_2.py <acquisitions dir> <repo root>
"""
import sys, json
import numpy as np

SRC, REPO = sys.argv[1], sys.argv[2]

# ---------------------------------------------------------------- (a) flags
raw = open(f'{SRC}/CRAT_L2_PRI_2026161_V01_bytes0-4799999.TAB', 'rb').read()
rows = [raw[i:i + 240][:-2].decode('ascii').split(',') for i in range(0, len(raw), 240)]
AM = np.array([[int(x) for x in r[4:10]] for r in rows])
F216 = np.array([[int(x) for x in r[23:29]] for r in rows])  # label: MAXSIGFLAGS (near saturation)
F228 = np.array([[int(x) for x in r[29:35]] for r in rows])  # label: GTLLDFLAGS (exceeds LLD)
print('== (a) flag columns vs AMPL (20,000 events)')
sat = 0.95 * 4095
for k in range(6):
    a = AM[:, k]
    print(f'D{k+1}: col@216=1 -> AMPL min {a[F216[:, k] == 1].min() if (F216[:, k] == 1).any() else None}, '
          f'col@216=0 -> AMPL max {a[F216[:, k] == 0].max() if (F216[:, k] == 0).any() else None}; '
          f'col@228 == (AMPL > {sat:.2f}) for every event: {bool(np.all(F228[:, k] == (a > sat)))}; '
          f'col@216 == (AMPL > 0): {bool(np.all(F216[:, k] == (a > 0)))}')
nz_thin = (AM[:, [0, 2, 4]] > 0).mean(axis=0)
print('thin detectors share of events with AMPL > 0:', np.round(nz_thin, 4).tolist())

# ---------------------------------------------------------------- (b) time offset
def sec_xyz(fn):
    raw = open(f'{SRC}/{fn}', 'rb').read()
    rr = [raw[i:i + 194][:-2].decode('ascii').split(',') for i in range(0, len(raw), 194)]
    t = np.array([int(r[0]) + int(r[1]) / 100 for r in rr])
    xyz = np.array([[float(r[29]), float(r[30]), float(r[31])] for r in rr])
    return t, xyz

t10, x10 = sec_xyz('CRAT_L2_SEC_2026161_V01.TAB')
t11, x11 = sec_xyz('CRAT_L2_SEC_2026162_V01.TAB')
t = np.concatenate([t10, t11]); x = np.concatenate([x10, x11])
p = json.load(open(f'{REPO}/assets/moon/craft-moon-me-2026-06-R1.json'))
P = np.array(p['xyz_km'], dtype=float).reshape(-1, 3)
T0 = 802742400.0  # 2026-06-10T00:00:00 UTC in CRaTER SECONDS (whole UTC second of the first record)
tp = T0 + 60.0 * np.arange(len(P))
print('\n== (b) position vs the page path')
print('first record SECONDS.FRACT', t10[0], '| T0', T0)
for label, shift in [('as tagged (whole UTC second)', 0.0)] + [(f'CRaTER interpolated to page time, tag offset {o:.2f} s', o) for o in (0.18, 0.19, 0.20)]:
    if shift == 0.0:
        q = x[np.searchsorted(t, tp + 0.18)]  # the record of that UTC second
    else:
        # the record's position belongs at SECONDS.FRACT (hypothesis); interpolate linearly to page time tp
        # hypothesis: each record's position belongs at (its whole UTC second + shift); interpolate to tp
        q = np.stack([np.interp(tp, t + (shift - 0.18), x[:, k]) for k in range(3)], 1)
    d = np.linalg.norm(q - P, axis=1)
    print(f'  {label}: median {np.median(d):.4f} p95 {np.percentile(d, 95):.4f} max {d.max():.4f} km')
# best offset by scan (positions assumed valid at SECONDS + FRACT/100 + eps)
best = []
for eps in np.arange(-0.10, 0.101, 0.01):
    q = np.stack([np.interp(tp, t + eps, x[:, k]) for k in range(3)], 1)
    best.append((float(np.median(np.linalg.norm(q - P, axis=1))), round(float(eps), 2)))
best.sort()
print('  scan: interpolating with the position at SECONDS+FRACT+eps, best three (median km, eps s):', best[:3])

# ---------------------------------------------------------------- (c) D2 elevation
print('\n== (c) singles per hour (mean counts per 1 s record)')
for fn, day in [('CRAT_L2_SEC_2026161_V01.TAB', '10 Jun'), ('CRAT_L2_SEC_2026162_V01.TAB', '11 Jun')]:
    raw = open(f'{SRC}/{fn}', 'rb').read()
    rr = [raw[i:i + 194][:-2].decode('ascii').split(',') for i in range(0, len(raw), 194)]
    S = np.array([[int(r[k]) for k in range(20, 26)] for r in rr]).reshape(24, 3600, 6).mean(axis=1)
    R = np.array([int(r[27]) for r in rr]).reshape(24, 3600).mean(axis=1)
    hot = [h for h in range(24) if S[h, 1] > 2 * S[h, 3]]
    print(f'{day}: hours with D2 singles > 2x D4 singles: {hot}')
    for h in hot[:6]:
        print(f'   hour {h:02d}: S2 {S[h,1]:.2f} S4 {S[h,3]:.2f} S6 {S[h,5]:.2f} REJECT {R[h]:.2f}')
