#!/usr/bin/env python3
"""Diviner bounded-sample assessment (docs only; Mother Earth, 26 Nov 2026).

Usage: python3 -I assess_diviner.py <samples-dir>

Reads the bounded Diviner samples listed in SAMPLES.md §6 (not committed:
research stays text only) and prints every sample-derived number used in
docs/concepts/MOON-DIVINER-PROPOSAL.md. Needs numpy only.

Products:
  GCP   LRO-L-DLRE-5-GCP-V1.0, global_cumul_avg_cyl_<band>_002.tab
        ASCII, 113-byte lines; longitude slowest, then latitude, then local
        time (96 bins of 0.25 h, centres 0.12 ... 23.88); -9999 empty bin,
        -9998 invalid.
  GDR   LRO-L-DLRE-5-GDR-V1.0 Level 3 TBOL and Level 2 LTIM, one 27-day
        mapping cycle, 4 ppd, 1440 x 720 int16 LE, first line +90,
        first sample 0 deg E, missing -32768.
        TBOL K = DN * 0.02. LTIM h = DN * 0.0833333333 + 2730.00273000273.
  GHRM  urn:nasa:pds:lro_diviner_derived1:data_derived_ghrm:
        dghrm_tbol_m_70s70n_img (tbol at midnight), float32 LE,
        17920 lines x 46080 samples, 128 ppd, line 0 starts at 70 N,
        sample 0 at 0 E; missing NaN. Samples are 128-pixel row pieces
        fetched by multi-range request (see SAMPLES.md §6.3).
"""
import os
import sys
import hashlib
import gzip
import warnings
import numpy as np

warnings.simplefilter('ignore', RuntimeWarning)

D = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/samples'
P = lambda f: os.path.join(D, f)

EXPECTED = {
    'gcp_00n10n_rows0-19199.tab': 'b1f930da3d4a8de1e136ac71c90947e1d7dc3e82d54114f6b722eaa68802ba97',
    'gcp_80n90n_rows0-19199.tab': '9c1de7250ce3f24e6520623916dd910efd4ec2ba620aa20395e7df886c7f6264',
    'gcp_00n10n_lon000-009.tab': 'c6389c550489f179f069c8f3a6d3485b71f291be5cf6239712105379bbccb54f',
    'gcp_40s30s_lon000-009.tab': 'c3311ad6ac46488368d53e272b6f48907864e652364c68f525a65950682a91ee',
    'gcp_90s80s_lon000-009.tab': '2f99420f0e55deb9b346896df0c4eb9ed04f2e85baefc585c5499e105c0ef809',
    'gcp_70s60s_lon000-009.tab': '4a10075ea1c24afbad41c7af7d32a8ac30b5c951906e536238b5f8c43909dd15',
    'gcp_70n80n_lon000-009.tab': 'c3e132596cf3cc85830e14a39bd4432f3d475761d75f81bb8e6ff4190b8db26c',
    'dgdr_tbol_avg_cyl_20160111d_004_img.img': '86679c0cc6814e76df106039f4c207e86736a3298bc8942cb76ac3397c9783b2',
    'dgdr_ltim_avg_cyl_20160111d_004_img.img': 'b267a8b70d361a0ae58a8408b011354d8902b71911993e3607419caff46ae49d',
    'dgdr_tbol_avg_cyl_20160125n_004_img.img': '5a769d456eedd1e65a91d704b3c75e75a1d5bbcc9261cd0f573bfe299873fd00',
    'dgdr_ltim_avg_cyl_20160125n_004_img.img': '81d47f9dba9eb4bdca7b1ecd0b27a9e9970b8c518ef40a7a7a1b5b88ca605a69',
    'ghrm_n128_eq_0E.f32': 'e3478099f146618a8c219bc39ef90b0329bf428cf7ec69a61d4d34425e529549',
    'ghrm_n128_eq_180E.f32': 'e1f909ab0de6a25048d46ba6e2829e604d90f9d00095551cb557a601cfae2fbc',
    'ghrm_n128_45S_300E.f32': '2d9216d605fb2e02f1b65c16cad8b513ec1015e29628b814c6713217457f387d',
}


def sha(f):
    return hashlib.sha256(open(P(f), 'rb').read()).hexdigest()


print('== D0 hashes')
for f, h in EXPECTED.items():
    got = sha(f)
    print(f'  {f}: {"OK" if got == h else "MISMATCH " + got}')


# ---------------------------------------------------------------- GCP
def gcp(f):
    a = np.loadtxt(P(f), delimiter=',')
    assert a.shape[1] == 11
    n = a.shape[0] // 1920
    a = a.reshape(n, 20, 96, 11)       # lon, lat, local time, field
    return a


LT = (np.arange(96) + 0.5) * 0.25      # bin centres
WIN = {
    'noon 11:30-12:30': [46, 47, 48, 49],
    'midnight 23:30-00:30': [94, 95, 0, 1],
    'dawn 05:30-06:30': [22, 23, 24, 25],
    'dusk 17:30-18:30': [70, 71, 72, 73],
    'noon 2 h 11:00-13:00': list(range(44, 52)),
    'midnight 2 h 23:00-01:00': [92, 93, 94, 95, 0, 1, 2, 3],
}

PATCHES = [
    ('gcp_00n10n_rows0-19199.tab', '0-10N, 179.75W-175.25W (far side)'),
    ('gcp_80n90n_rows0-19199.tab', '80-90N, 179.75W-175.25W (far side, north polar)'),
    ('gcp_00n10n_lon000-009.tab', '0-10N, 0.25E-4.75E (near side)'),
    ('gcp_40s30s_lon000-009.tab', '30-40S, 0.25E-4.75E (near side, mid-latitude)'),
    ('gcp_90s80s_lon000-009.tab', '80-90S, 0.25E-4.75E (near side, south polar)'),
    ('gcp_70s60s_lon000-009.tab', '60-70S, 0.25E-4.75E (near side)'),
    ('gcp_70n80n_lon000-009.tab', '70-80N, 0.25E-4.75E (near side)'),
]

print('\n== G1 GCP patches: layout, missing share, values')
G = {}
for f, desc in PATCHES:
    a = gcp(f)
    G[f] = a
    lon = a[:, 0, 0, 0]
    lat = a[0, :, 0, 1]
    lt = a[0, 0, :, 2]
    tb = a[..., 10]
    miss = tb == -9999
    inval = tb == -9998
    ok = ~(miss | inval)
    lt_ok = np.allclose(lt, np.round(LT, 2), atol=0.006)
    print(f'  {desc}: lon {lon.min():.2f}..{lon.max():.2f}, lat {lat.min():.2f}..{lat.max():.2f}, '
          f'local-time centres match 0.125+0.25k: {lt_ok}')
    print(f'    tbol bins {tb.size}: empty (-9999) {miss.mean()*100:.1f}%, invalid (-9998) {inval.sum()}, '
          f'range {tb[ok].min():.1f}..{tb[ok].max():.1f} K, negative tbol {(tb[ok] < 0).sum()}')
    ch = a[..., 3:10]
    chok = (ch != -9999) & (ch != -9998)
    print(f'    channel t3-t9 values below 0 K: {(ch[chok] < 0).sum()} of {chok.sum()}')
    # tbol present but some channel missing, or the reverse
    anych = chok.any(axis=-1)
    print(f'    bins with tbol but no channel value: {(ok & ~anych).sum()}; channel values but no tbol: {(~ok & anych).sum()}')

print('\n== G2 single 15-minute bins: cells with a value, per bin (min / median / max over the 96 bins)')
for f, desc in PATCHES:
    tb = G[f][..., 10]
    has = (tb > -9998)
    per_bin = has.reshape(-1, 96).mean(axis=0) * 100
    zero_bins = int((per_bin == 0).sum())
    print(f'  {desc}: {per_bin.min():.0f}% / {np.median(per_bin):.0f}% / {per_bin.max():.0f}%; bins with no value in any cell: {zero_bins} of 96')

print('\n== G3 windows: per-cell count of contributing bins, cells with none, unweighted mean, within-window spread')
for f, desc in PATCHES:
    tb = G[f][..., 10]
    print(f'  {desc}:')
    for name, idx in WIN.items():
        w = tb[:, :, idx]
        has = w > -9998
        cnt = has.sum(axis=-1)
        cells = cnt.size
        none = int((cnt == 0).sum())
        wm = np.where(has, w, np.nan)
        with np.errstate(all='ignore'):
            mean = np.nanmean(wm, axis=-1)
            spread = np.nanmax(wm, axis=-1) - np.nanmin(wm, axis=-1)
        hist = np.bincount(cnt.ravel(), minlength=len(idx) + 1)
        print(f'    {name}: cells {cells}, none {none} ({none/cells*100:.1f}%), bins per cell histogram {hist.tolist()}, '
              f'mean of cell means {np.nanmean(mean):.1f} K, spread mean {np.nanmean(spread):.2f} K, max {np.nanmax(spread):.2f} K')

# latitude dependence of the within-window spread in the high-latitude patches
print('\n== G4 high-latitude patches: within-window spread by latitude row (mean over the 10 longitudes) / mean bins per cell')
for name in ['noon 11:30-12:30', 'midnight 23:30-00:30']:
    print(f'  window {name}')
    for f in ['gcp_70s60s_lon000-009.tab', 'gcp_70n80n_lon000-009.tab', 'gcp_80n90n_rows0-19199.tab', 'gcp_90s80s_lon000-009.tab']:
        a = G[f]
        tb = a[..., 10][:, :, WIN[name]]
        wm = np.where(tb > -9998, tb, np.nan)
        with np.errstate(all='ignore'):
            sp = np.nanmax(wm, axis=-1) - np.nanmin(wm, axis=-1)
            row = np.nanmean(sp, axis=0)
            cnt = (tb > -9998).sum(axis=-1).mean(axis=0)
        lats = a[0, :, 0, 1]
        print(f'    {f}: ' + ', '.join(f'{la:+.2f}:{s_:.1f}K/{c:.1f}' for la, s_, c in zip(lats, row, cnt)))

# ---------------------------------------------------------------- GDR cycle maps
def i16(f):
    return np.fromfile(P(f), '<i2').reshape(720, 1440)


def tbol_map(f):
    a = i16(f)
    return np.where(a == -32768, np.nan, a * 0.02)


def ltim_map(f):
    a = i16(f)
    return np.where(a == -32768, np.nan, a * 0.0833333333 + 2730.00273000273)


LATC = 90 - (np.arange(720) + 0.5) / 4
LONC = (np.arange(1440) + 0.5) / 4
print('\n== C1 one mapping cycle at 4 ppd (Level 3 TBOL + Level 2 LTIM)')
CY = {}
for tag, tf, lf in [('20160111d', 'dgdr_tbol_avg_cyl_20160111d_004_img.img', 'dgdr_ltim_avg_cyl_20160111d_004_img.img'),
                    ('20160125n', 'dgdr_tbol_avg_cyl_20160125n_004_img.img', 'dgdr_ltim_avg_cyl_20160125n_004_img.img')]:
    t = tbol_map(tf)
    l = ltim_map(lf)
    CY[tag] = (t, l)
    v = ~np.isnan(t)
    vl = ~np.isnan(l)
    print(f'  {tag}: tbol cells {v.sum()} of {v.size} ({v.mean()*100:.1f}%), range {np.nanmin(t):.2f}..{np.nanmax(t):.2f} K; '
          f'ltim cells {vl.sum()}, range {np.nanmin(l):.3f}..{np.nanmax(l):.3f} h; tbol without ltim {(v & ~vl).sum()}, ltim without tbol {(vl & ~v).sum()}')
    band = [(90, 60), (60, 30), (30, 0), (0, -30), (-30, -60), (-60, -90)]
    s = []
    for a_, b_ in band:
        m = (LATC <= a_) & (LATC > b_)
        s.append(f'{a_}..{b_}: {v[m].mean()*100:.1f}%')
    print('    coverage by latitude band: ' + '; '.join(s))
    # rows with any value
    print(f'    latitude rows with any value: {int(v.any(axis=1).sum())} of 720; '
          f'longitude columns with any value: {int(v.any(axis=0).sum())} of 1440')
    # local time against longitude: median per 30-degree longitude band (equatorial rows)
    eq = (np.abs(LATC) < 30)
    meds = []
    for k in range(12):
        m = (LONC >= k * 30) & (LONC < (k + 1) * 30)
        sub = l[np.ix_(eq, m)]
        meds.append(np.nanmedian(sub) if np.isfinite(sub).any() else np.nan)
    print('    median local time by 30-degree longitude band (|lat|<30): ' + ', '.join(f'{k*30}E:{m:.2f}' for k, m in enumerate(meds)))
    # spread of local time inside one latitude row
    with np.errstate(all='ignore'):
        rs = np.nanmax(l, axis=1) - np.nanmin(l, axis=1)
    print(f'    local-time span inside a latitude row: median {np.nanmedian(rs):.2f} h, max {np.nanmax(rs):.2f} h')
    # quantisation
    dl = np.unique(np.round(np.diff(np.unique(l[vl])), 6))
    print(f'    ltim steps present (h): {dl[:4].tolist()} ...; tbol step 0.02 K')

# ---------------------------------------------------------------- cross-checks
print('\n== X1 GCP against the 2016 day cycle at the same place and local time')


def gcp_lookup(a, lon_e, lat, lt):
    """Return GCP tbol for the 0.5 deg cell containing (lon_e in -180..180, lat) at local time lt, or nan."""
    lons = a[:, 0, 0, 0]
    lats = a[0, :, 0, 1]
    i = np.where(np.abs(lons - lon_e) <= 0.25)[0]
    j = np.where(np.abs(lats - lat) <= 0.25)[0]
    if len(i) == 0 or len(j) == 0:
        return np.nan
    k = int(np.floor((lt % 24) / 0.25))
    v = a[i[0], j[0], k, 10]
    return np.nan if v <= -9998 else v


for tag in ['20160111d', '20160125n']:
    t, l = CY[tag]
    diffs = []
    for f in [p[0] for p in PATCHES]:
        a = G[f]
        lons = a[:, 0, 0, 0]
        lats = a[0, :, 0, 1]
        for r in range(720):
            la = LATC[r]
            if la < lats.min() - 0.25 or la > lats.max() + 0.25:
                continue
            for c in range(1440):
                if np.isnan(t[r, c]) or np.isnan(l[r, c]):
                    continue
                lo = LONC[c]
                lo_e = lo - 360 if lo > 180 else lo
                if lo_e < lons.min() - 0.25 or lo_e > lons.max() + 0.25:
                    continue
                g = gcp_lookup(a, lo_e, la, l[r, c])
                if np.isfinite(g):
                    diffs.append((f, la, lo, l[r, c], t[r, c], g))
    if diffs:
        d = np.array([x[4] - x[5] for x in diffs])
        print(f'  {tag}: matched cells {len(d)}; cycle minus GCP: median {np.median(d):+.2f} K, '
              f'mean |diff| {np.mean(np.abs(d)):.2f} K, 90th percentile |diff| {np.percentile(np.abs(d), 90):.2f} K')
        for x in diffs[:3]:
            print(f'    e.g. {x[0]} lat {x[1]:+.3f} lon {x[2]:.3f}E lt {x[3]:.2f} h: cycle {x[4]:.2f} K, GCP {x[5]:.2f} K')
    else:
        print(f'  {tag}: no cell of this cycle falls inside the sampled GCP patches at a filled GCP bin')

print('\n== X2 GHRM tbol at midnight (multi-range patches): values and comparison with the GCP midnight window')
ROWS = 128
for f, row0, col0, lat0 in [('ghrm_n128_eq_0E.f32', 8960 - 64, 0, None), ('ghrm_n128_eq_180E.f32', 8960 - 64, 180 * 128, None),
                            ('ghrm_n128_45S_300E.f32', round((70 + 45) * 128) - 64, 300 * 128, None)]:
    a = np.fromfile(P(f), '<f4').reshape(ROWS, 128)
    lat_c = 70 - (np.arange(row0, row0 + ROWS) + 0.5) / 128
    lon_c = (np.arange(col0, col0 + 128) + 0.5) / 128
    nan = np.isnan(a)
    print(f'  {f}: lat {lat_c.max():+.3f}..{lat_c.min():+.3f}, lon {lon_c.min():.3f}..{lon_c.max():.3f}E; '
          f'NaN {nan.mean()*100:.1f}%, range {np.nanmin(a):.2f}..{np.nanmax(a):.2f} K, mean {np.nanmean(a):.2f} K, sd {np.nanstd(a):.2f} K')
    # compare 0.5 x 0.5 deg block means with the GCP midnight window, where the patch overlaps a GCP sample
    for gf in ['gcp_00n10n_lon000-009.tab', 'gcp_00n10n_rows0-19199.tab']:
        g = G[gf]
        lons = g[:, 0, 0, 0]
        lats = g[0, :, 0, 1]
        for gi, glo in enumerate(lons):
            glo360 = glo % 360
            for gj, gla in enumerate(lats):
                mr = (lat_c > gla - 0.25) & (lat_c <= gla + 0.25)
                mc = (lon_c > glo360 - 0.25) & (lon_c <= glo360 + 0.25)
                if mr.sum() < 64 or mc.sum() < 64:
                    continue
                blk = a[np.ix_(mr, mc)]
                w = g[gi, gj, WIN['midnight 23:30-00:30'], 10]
                w = w[w > -9998]
                if len(w) == 0:
                    continue
                print(f'    0.5-deg cell lat {gla:+.2f} lon {glo360:.2f}E: GHRM block mean {np.nanmean(blk):.2f} K '
                      f'(n={np.isfinite(blk).sum()}); GCP midnight window unweighted mean {w.mean():.2f} K from {len(w)} bins')

# ---------------------------------------------------------------- page-size measurements on real samples
print('\n== S1 page-file sizes measured on the real 4 ppd cycle maps (int16 LE, gzip -9, zero mtime)')
for tag, tf in [('20160111d', 'dgdr_tbol_avg_cyl_20160111d_004_img.img'), ('20160125n', 'dgdr_tbol_avg_cyl_20160125n_004_img.img')]:
    raw = open(P(tf), 'rb').read()
    z = gzip.compress(raw, 9, mtime=0)
    t = tbol_map(tf)
    # 0.1 K steps in a uint16 with 0 = missing
    q = np.where(np.isnan(t), 0, np.round(t * 10)).astype('<u2')
    zq = gzip.compress(q.tobytes(), 9, mtime=0)
    print(f'  {tag}: source int16 {len(raw)} B -> gzip {len(z)} B; re-quantised 0.1 K uint16 -> gzip {len(zq)} B')

print('\nDone.')
