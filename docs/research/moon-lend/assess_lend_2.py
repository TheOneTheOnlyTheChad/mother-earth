#!/usr/bin/env python3
"""Moon item 6 (LEND), bounded assessment step 2.

Does the retained south-polar ALD file (CSETN, 2011-12-11 to 2016-09-14) show
structure above counting noise once cells are combined over a disc of a given
radius? Exposure-weighted means of CSETN_RATE inside discs around named
features (positions from the IAU Gazetteer as cited in the proposal) are
compared with the 80.25-84.75 S ring mean, with the combined counting error.

Here "rate" is the archived CSETN_RATE field as stored. Its unit/normalisation
is an open question recorded in the proposal; nothing here converts it into
hydrogen or water.

Usage: python3 -I assess_lend_2.py <dir with the retained files>
"""
import hashlib, json, math, struct, sys

D = sys.argv[1]
DAT = D + '/lend_rdr_alds_20111211.dat'
assert hashlib.sha256(open(DAT, 'rb').read()).hexdigest() == \
    'e6b1c2d54e3e00d649a1229b08507dd10c859039ae2df8e34cdf1480bb0031ef'
raw = open(DAT, 'rb').read()
R_MOON = 1737.4  # km, IAU mean radius (used only for distances between cell centres)

cells = []
for i in range(14400):
    rec = raw[i * 310:(i + 1) * 310]
    f = lambda loc: struct.unpack('>f', rec[loc - 1:loc + 3])[0]
    lat, lon = f(47), f(51)
    exp, rate, err = f(107), f(111), f(115)  # CSETN_EXPOSURE / _RATE / _ERR (label locations)
    if rate == -1.0 or exp <= 0:
        continue
    cells.append((lat, lon, exp, rate, err))

def dist(a, b, c, d):
    a, b, c, d = map(math.radians, (a, b, c, d))
    x = math.sin(a) * math.sin(c) + math.cos(a) * math.cos(c) * math.cos(b - d)
    return R_MOON * math.acos(max(-1, min(1, x)))

def disc(lat0, lon0, rkm):
    sel = [c for c in cells if dist(lat0, lon0, c[0], c[1]) <= rkm]
    if not sel:
        return None
    # inverse-variance weighting, as the processing document describes for averaging
    w = [1 / c[4] ** 2 for c in sel if c[4] > 0]
    m = sum(wi * c[3] for wi, c in zip(w, sel)) / sum(w)
    e = 1 / math.sqrt(sum(w))
    return {'cells': len(sel), 'exposure_s': round(sum(c[2] for c in sel)), 'mean': round(m, 4), 'err': round(e, 4)}

ref_sel = [c for c in cells if -84.75 - 1e-3 <= c[0] <= -80.25 + 1e-3]
w = [1 / c[4] ** 2 for c in ref_sel]
ref = sum(wi * c[3] for wi, c in zip(w, ref_sel)) / sum(w)
ref_e = 1 / math.sqrt(sum(w))
# The reference band's own spread at 30 km: scatter of disc means at random-ish centres along 82.5 S
band = [disc(-82.5, lon, 30) for lon in range(0, 360, 15)]
bm = [b['mean'] for b in band]
bmean = sum(bm) / len(bm)
bsd = math.sqrt(sum((x - bmean) ** 2 for x in bm) / (len(bm) - 1))

FEATURES = {  # name: (lat, east lon); IAU Gazetteer of Planetary Nomenclature, read 27 Nov 2026
    # (centre lat/lon as listed, +East -180..180 converted to 0..360; feature IDs in the proposal)
    'Cabeus': (-85.33, 360 - 42.13),
    'Shoemaker': (-88.14, 45.91),
    'Haworth': (-87.45, 360 - 5.17),
    'Faustini': (-87.18, 84.31),
    'Amundsen': (-84.44, 83.07),
}
out = {'reference_band_80.25_84.75S': {'cells': len(ref_sel), 'mean': round(ref, 4), 'err': round(ref_e, 5)},
       'band_82.5S_30km_discs': {'n': len(bm), 'mean_of_means': round(bmean, 4), 'sd': round(bsd, 4),
                                 'median_err': sorted(b['err'] for b in band)[len(band) // 2]},
       'features': {}}
for name, (la, lo) in FEATURES.items():
    out['features'][name] = {}
    for r in (15, 30, 60):
        d = disc(la, lo, r)
        if d:
            d['diff_from_ref'] = round(d['mean'] - ref, 4)
            d['diff_over_err'] = round((d['mean'] - ref) / math.hypot(d['err'], ref_e), 2)
            d['pct_of_ref'] = round(100 * (d['mean'] / ref - 1), 2)
        out['features'][name][f'{r}km'] = d

# Same-latitude control (added after the first run showed a poleward decline in ring medians and
# a 30 km disc scatter of about 1.5x the counting error in the reference band): for each feature,
# 30 km discs centred every 15 degrees of longitude on the feature's own latitude, excluding any
# disc whose centre lies within 90 km of the feature.
for name, (la, lo) in FEATURES.items():
    ctrl = [disc(la, L, 30) for L in range(0, 360, 15) if dist(la, lo, la, L) > 90]
    ctrl = [c for c in ctrl if c]
    cm = [c['mean'] for c in ctrl]
    mu = sum(cm) / len(cm)
    sd = math.sqrt(sum((x - mu) ** 2 for x in cm) / (len(cm) - 1))
    f30 = out['features'][name]['30km']
    out['features'][name]['same_lat_control_30km'] = {
        'n_discs': len(cm), 'mean': round(mu, 4), 'sd': round(sd, 4),
        'median_counting_err': sorted(c['err'] for c in ctrl)[len(ctrl) // 2],
        'feature_minus_control': round(f30['mean'] - mu, 4),
        'in_control_sd': round((f30['mean'] - mu) / sd, 2),
        'pct': round(100 * (f30['mean'] / mu - 1), 2),
        'n_control_discs_at_or_below_feature': sum(1 for x in cm if x <= f30['mean'])}
print(json.dumps(out, indent=1))
