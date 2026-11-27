#!/usr/bin/env python3
"""Moon item 6 (LEND), bounded assessment step 3: numeric preview of a candidate
display (proposal option L1), from the one retained file. Nothing is drawn.

For every 0.5-degree cell of the south-polar ALD file (CSETN, 2011-12-11 to
2016-09-14): inverse-variance mean of CSETN_RATE over all usable cells whose
centres lie within RADIUS km (display smoothing, a choice of ours, NOT the
instrument's resolution), its combined counting error, and the percent
difference from the 80.25-84.75 S band mean. Then: how many cells a rule
"withhold if counting error of the percent value > MAXERR_PCT" would withhold,
and the distribution of shown values.

Usage: python3 -I preview_lend_3.py <dir> [radius_km] [maxerr_pct]
"""
import hashlib, json, struct, sys
import numpy as np

D = sys.argv[1]
RADIUS = float(sys.argv[2]) if len(sys.argv) > 2 else 30.0
MAXERR = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
DAT = D + '/lend_rdr_alds_20111211.dat'
raw = open(DAT, 'rb').read()
assert hashlib.sha256(raw).hexdigest() == 'e6b1c2d54e3e00d649a1229b08507dd10c859039ae2df8e34cdf1480bb0031ef'
R = 1737.4

rec = np.frombuffer(raw, dtype=np.uint8).reshape(14400, 310)
f = lambda loc: rec[:, loc - 1:loc + 3].copy().view('>f4').ravel().astype(np.float64)
lat, lon, exp, rate, err = f(47), f(51), f(107), f(111), f(115)
ok = (rate != -1.0) & (exp > 0) & (err > 0)
la, lo, ra, er = np.radians(lat[ok]), np.radians(lon[ok]), rate[ok], err[ok]
w = 1 / er ** 2
xyz = np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], 1)
cosr = np.cos(RADIUS / R)

band = (lat[ok] >= -84.75 - 1e-3) & (lat[ok] <= -80.25 + 1e-3)
ref = np.sum(w[band] * ra[band]) / np.sum(w[band])

mean = np.empty(len(ra)); e = np.empty(len(ra)); n = np.empty(len(ra), int)
for i0 in range(0, len(ra), 1000):
    m = (xyz[i0:i0 + 1000] @ xyz.T) >= cosr
    sw = m @ w
    mean[i0:i0 + 1000] = (m @ (w * ra)) / sw
    e[i0:i0 + 1000] = 1 / np.sqrt(sw)
    n[i0:i0 + 1000] = m.sum(1)
pct = 100 * (mean / ref - 1)
pct_err = 100 * e / ref
shown = pct_err <= MAXERR
q = lambda a, p: float(np.percentile(a, p)) if len(a) else None
rings = {}
for L in np.unique(np.round(lat[ok], 2)):
    s = np.round(lat[ok], 2) == L
    rings[float(L)] = {'cells': int(s.sum()), 'shown': int((s & shown).sum()),
                       'pct_med': round(float(np.median(pct[s])), 3),
                       'pct_err_med': round(float(np.median(pct_err[s])), 3)}
out = {'radius_km': RADIUS, 'withhold_if_pct_err_gt': MAXERR, 'reference_band_mean': round(float(ref), 4),
       'usable_cells': int(ok.sum()), 'archive_missing_cells': int((~ok).sum()),
       'shown': int(shown.sum()), 'withheld_by_rule': int((~shown).sum()),
       'cells_per_disc': {'min': int(n.min()), 'p50': int(np.median(n)), 'max': int(n.max())},
       'pct_shown': {'min': q(pct[shown], 0), 'p01': q(pct[shown], 1), 'p50': q(pct[shown], 50),
                     'p99': q(pct[shown], 99), 'max': q(pct[shown], 100)},
       'pct_err_shown': {'p50': q(pct_err[shown], 50), 'max': q(pct_err[shown], 100)},
       'lowest_shown': [{'lat': round(float(lat[ok][i]), 2), 'lon': round(float(lon[ok][i]), 2),
                         'pct': round(float(pct[i]), 2), 'pct_err': round(float(pct_err[i]), 2)}
                        for i in np.argsort(np.where(shown, pct, np.inf))[:5]],
       'rings': rings}
print(json.dumps(out, indent=1))
