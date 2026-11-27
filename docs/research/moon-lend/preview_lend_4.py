#!/usr/bin/env python3
"""Moon item 6 (LEND), rev 2 focused evidence (GPT rev 1 review R2, R3).

Same retained file and display operation as preview_lend_3.py, with:
  * geometry stated: centre-in-disc selection on a sphere of R = 1737.4 km,
    disc RADIUS 30 km (DIAMETER 60 km), great-circle distance from 3-D unit
    vectors (so longitude wrap at 0/360 is handled with no special case);
  * two error figures for p = 100 * (m / r - 1):
      - "benchmark": 100 * sqrt(Var(m)) / r        (rev 1: reference fixed)
      - "propagated": 100 * sqrt(Var(m)/r^2 + m^2 Var(r)/r^4 - 2 m Cov(m,r)/r^3)
    both CONDITIONAL on the archive's CSETN_ERR being the standard deviation
    of independent cell values (an assumption, not established here), with
    Var(m) = 1/W_D, Var(r) = 1/W_B, Cov(m, r) = W_{D and B} / (W_D W_B),
    where W is the sum of 1/ERR^2 over usable cells in the disc D, the
    reference band B, and their overlap;
  * support classes for each disc: complete (no archive-missing cell inside
    and the disc stays poleward of the product's 80 S edge), edge-truncated
    (the disc crosses 80 S, so part of it lies outside this product),
    missing-affected (contains archive-missing cells), or both;
  * display states counted per 0.5-degree cell.

Here m and r are inverse-variance-weighted means of sampled cell values of the
archived CSETN_RATE field (not equal-area spatial averages). Nothing here
interprets the field's units, normalisation or background, or converts it to
hydrogen. Nothing is drawn.

Usage: python3 -I preview_lend_4.py <dir> [radius_km] [cutoff_pp]
"""
import hashlib, json, sys
import numpy as np

D = sys.argv[1]
RADIUS = float(sys.argv[2]) if len(sys.argv) > 2 else 30.0
CUT = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
raw = open(D + '/lend_rdr_alds_20111211.dat', 'rb').read()
assert hashlib.sha256(raw).hexdigest() == 'e6b1c2d54e3e00d649a1229b08507dd10c859039ae2df8e34cdf1480bb0031ef'
R = 1737.4
EDGE = -80.0  # product's equatorward edge (label: 0.5 deg cells above 80 S)

rec = np.frombuffer(raw, dtype=np.uint8).reshape(14400, 310)
f = lambda loc: rec[:, loc - 1:loc + 3].copy().view('>f4').ravel().astype(np.float64)
lat, lon, exp, rate, err = f(47), f(51), f(107), f(111), f(115)
usable = (rate != -1.0) & (exp > 0) & (err > 0) & np.isfinite(rate) & np.isfinite(err)
missing = ~usable

def unit(la, lo):
    la, lo = np.radians(la), np.radians(lo)
    return np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], -1)

xyz_all = unit(lat, lon)
w = np.where(usable, 1 / np.where(usable, err, 1) ** 2, 0.0)
x = np.where(usable, rate, 0.0)
band = usable & (lat >= -84.75 - 1e-3) & (lat <= -80.25 + 1e-3)
W_B = w[band].sum()
r = (w[band] * x[band]).sum() / W_B
var_r = 1 / W_B
cosr = np.cos(RADIUS / R)
edge_reach = EDGE - np.degrees(RADIUS / R)  # a centre at or north of this latitude has a disc crossing 80 S

m = np.full(14400, np.nan); bench = np.full(14400, np.nan); prop = np.full(14400, np.nan)
novl = np.zeros(14400, int); ncell = np.zeros(14400, int); nmiss = np.zeros(14400, int); exp_sum = np.zeros(14400)
for i0 in range(0, 14400, 800):
    M = (xyz_all[i0:i0 + 800] @ xyz_all.T) >= cosr          # centre-in-disc, all grid cells
    Mu = M & usable
    WD = Mu @ w
    WDB = (Mu & band) @ w
    mm = (Mu @ (w * x)) / np.where(WD > 0, WD, np.nan)
    vm = 1 / np.where(WD > 0, WD, np.nan)
    cov = WDB / (np.where(WD > 0, WD, np.nan) * W_B)
    m[i0:i0 + 800] = mm
    bench[i0:i0 + 800] = 100 * np.sqrt(vm) / r
    prop[i0:i0 + 800] = 100 * np.sqrt(vm / r ** 2 + mm ** 2 * var_r / r ** 4 - 2 * mm * cov / r ** 3)
    ncell[i0:i0 + 800] = Mu.sum(1)
    novl[i0:i0 + 800] = (Mu & band).sum(1)
    nmiss[i0:i0 + 800] = (M & missing).sum(1)
    exp_sum[i0:i0 + 800] = Mu @ np.where(usable, exp, 0)

p = 100 * (m / r - 1)
truncated = lat >= edge_reach - 1e-9
miss_aff = nmiss > 0
own = usable  # a cell can only show a value if the archive has it
show_b = own & (bench <= CUT)
show_p = own & (prop <= CUT)

def q(a, pp):
    return round(float(np.percentile(a, pp)), 4) if a.size else None

support = {}
for name, sel in {'complete': ~truncated & ~miss_aff, 'edge_truncated_only': truncated & ~miss_aff,
                  'missing_affected_only': ~truncated & miss_aff, 'both': truncated & miss_aff}.items():
    s = own & sel
    support[name] = {'cells': int(s.sum()), 'shown_benchmark': int((s & show_b).sum()),
                     'disc_cells_median': int(np.median(ncell[s])) if s.any() else None}

out = {
    'geometry': {'sphere_radius_km': R, 'disc_radius_km': RADIUS, 'disc_diameter_km': 2 * RADIUS,
                 'selection': 'cell centre within great-circle distance <= radius of the cell centre',
                 'discs_cross_80S_when_centre_lat_ge': round(float(edge_reach), 4)},
    'reference': {'band': '80.25-84.75 S cell centres, usable cells', 'cells': int(band.sum()),
                  'iv_mean': round(float(r), 10), 'formal_err': round(float(np.sqrt(var_r)), 10),
                  'formal_rel_err_pp': round(float(100 * np.sqrt(var_r) / r), 4),
                  'cos_lat_weighted_mean_for_comparison': round(float((np.cos(np.radians(lat[band])) * x[band]).sum() / np.cos(np.radians(lat[band])).sum()), 6)},
    'cells': {'grid': 14400, 'archive_usable': int(usable.sum()), 'archive_missing': int(missing.sum())},
    'states_benchmark_cutoff': {'valid_displayed': int(show_b.sum()), 'withheld_by_rule': int((own & ~show_b).sum()),
                                'archive_missing': int(missing.sum()),
                                'note': 'outside this product (north of 80 S) is not a cell of this file'},
    'states_propagated_cutoff': {'valid_displayed': int(show_p.sum()), 'withheld_by_rule': int((own & ~show_p).sum())},
    'benchmark_vs_propagated': {
        'cells_whose_state_differs': int((show_b != show_p).sum()),
        'prop_minus_bench_pp': {'min': q((prop - bench)[own], 0), 'p50': q((prop - bench)[own], 50), 'max': q((prop - bench)[own], 100)},
        'cells_whose_disc_shares_cells_with_reference_band': int((own & (novl > 0)).sum())},
    'shown_benchmark': {'p_min': q(p[show_b], 0), 'p50': q(p[show_b], 50), 'p_max': q(p[show_b], 100),
                        'bench_p50': q(bench[show_b], 50), 'disc_cells': {'min': int(ncell[show_b].min()), 'p50': int(np.median(ncell[show_b])), 'max': int(ncell[show_b].max())},
                        'support_exposure_sum_s_p50': q(exp_sum[show_b], 50)},
    'support_classes': support,
    'native_cell_exposure_s_p50': q(exp[usable], 50),
}
print(json.dumps(out, indent=1))
