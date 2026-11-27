#!/usr/bin/env python3
"""Moon item 6 (LEND), rev 2: focused checks of the geometry and error formula
used by preview_lend_4.py (GPT rev 1 review R2, R3). Exits 1 on any failure.

1. Seam: a disc centred at 0.25 E includes cells at 359.75 E at the same latitude.
2. Radius boundary: every included cell centre is <= 30 km away; the nearest
   excluded one is > 30 km away.
3. Error formula: with synthetic values drawn independently from
   N(archived value, archived ERR) (the stated model, not a claim about the
   archive), the sample standard deviation of p over 4,000 draws matches the
   propagated formula within 5% for three cells (one whose disc shares cells
   with the reference band, one far from it, one at the 80 S edge), and the
   fixed-reference benchmark is shown beside it.

Usage: python3 -I check_lend_4.py <dir>
"""
import hashlib, json, sys
import numpy as np

D = sys.argv[1]
raw = open(D + '/lend_rdr_alds_20111211.dat', 'rb').read()
assert hashlib.sha256(raw).hexdigest() == 'e6b1c2d54e3e00d649a1229b08507dd10c859039ae2df8e34cdf1480bb0031ef'
R, RAD = 1737.4, 30.0
rec = np.frombuffer(raw, dtype=np.uint8).reshape(14400, 310)
f = lambda loc: rec[:, loc - 1:loc + 3].copy().view('>f4').ravel().astype(np.float64)
lat, lon, exp, rate, err = f(47), f(51), f(107), f(111), f(115)
ok = (rate != -1.0) & (exp > 0) & (err > 0)
la, lo = np.radians(lat), np.radians(lon)
xyz = np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], 1)
band = ok & (lat >= -84.75 - 1e-3) & (lat <= -80.25 + 1e-3)
fails = []
out = {}

def idx(a, b):
    return int(np.where(np.isclose(lat, a) & np.isclose(lon, b))[0][0])

def dist(i):
    return R * np.arccos(np.clip(xyz @ xyz[i], -1, 1))

# 1. seam
i = idx(-85.25, 0.25)
d = dist(i)
inc = d <= RAD
seam = bool(inc[idx(-85.25, 359.75)])
out['seam_359.75_included_from_0.25'] = seam
if not seam:
    fails.append('seam')

# 2. boundary
out['boundary'] = {'max_included_km': round(float(d[inc].max()), 4), 'min_excluded_km': round(float(d[~inc].min()), 4)}
if not (d[inc].max() <= RAD < d[~inc].min()):
    fails.append('boundary')

# 3. Monte Carlo of the error formula
rng = np.random.default_rng(20261127)
w = 1 / np.where(ok, err, 1) ** 2
cases = {'shares_band': (-82.25, 100.25), 'far_from_band': (-87.25, 200.25), 'edge_80S': (-80.25, 300.25)}
N = 4000
sims = rng.normal(np.where(ok, rate, 0)[None, :], np.where(ok, err, 1)[None, :], size=(N, 14400))
rb = (sims[:, band] * w[band]).sum(1) / w[band].sum()
r0 = (rate[band] * w[band]).sum() / w[band].sum()
WB = w[band].sum()
mc = {}
for name, (a, b) in cases.items():
    c = idx(a, b)
    Dm = ok & (dist(c) <= RAD)
    WD = w[Dm].sum(); WDB = w[Dm & band].sum()
    m0 = (rate[Dm] * w[Dm]).sum() / WD
    ms = (sims[:, Dm] * w[Dm]).sum(1) / WD
    p = 100 * (ms / rb - 1)
    prop = 100 * np.sqrt(1 / WD / r0 ** 2 + m0 ** 2 / WB / r0 ** 4 - 2 * m0 * (WDB / (WD * WB)) / r0 ** 3)
    bench = 100 * np.sqrt(1 / WD) / r0
    sd = float(p.std(ddof=1))
    mc[name] = {'disc_cells': int(Dm.sum()), 'shared_with_band': int((Dm & band).sum()),
                'sim_sd_pp': round(sd, 4), 'propagated_pp': round(float(prop), 4), 'benchmark_pp': round(float(bench), 4),
                'sim_over_propagated': round(sd / float(prop), 3)}
    if abs(sd / prop - 1) > 0.05:
        fails.append('mc_' + name)
out['monte_carlo_4000'] = mc
out['result'] = 'PASS' if not fails else 'FAIL ' + ','.join(fails)
print(json.dumps(out, indent=1))
sys.exit(1 if fails else 0)
