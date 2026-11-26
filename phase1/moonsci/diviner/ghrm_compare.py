#!/usr/bin/env python3
"""Diviner temperature layer: GHRM midnight comparison and registration controls (MOON-DIVINER-PROPOSAL rev 2 §8 item 3c, 3b).
Build tooling; not served. Needs numpy.

  python3 -I ghrm_compare.py select <page file .bin.gz> > sites.json
      20 sites, each a 3 x 3 block of 0.5-degree cells inside 70 S - 70 N:
        10 high-contrast sites: the strongest midnight local maxima in the page file (value minus the mean of its 8 neighbours,
           all 9 cells with n >= 3), at least 5 degrees apart. These are where a registration error would show.
        10 background sites on a fixed spread of latitudes (-59.75 .. 59.75) and longitudes.
      For each site, the byte ranges of the GHRM midnight tbol mosaic (dghrm_tbol_m_70s70n_img.img: float32 LE,
      17920 lines x 46080 samples, 128 ppd, line 0 at 70 N, sample 0 at 0 E, NaN missing) covering the 3 x 3 block:
      192 rows x 192 samples (768 B per row), sent as two multi-range requests of 96 ranges.
  python3 -I ghrm_compare.py compare <page file .bin.gz> sites.json <ghrm-sites-20-R1.f32: the 20 blocks of 192 x 192 float32 LE, in site order>
      For every cell: GHRM 64 x 64 block mean (NaN ignored) against our GCP midnight window value. Reports differences by site type,
      with no pass tolerance (proposal §8: the products differ in period, method and sampling). Registration controls: the same
      GHRM blocks scored against our grid shifted by one cell N, S, E, W, by 180 degrees in longitude, and mirrored E-W and N-S about
      each site. At the high-contrast sites the true alignment must give the smallest mean |difference| of all controls; it exits 1 if not."""
import sys
import gzip
import json
import hashlib
import numpy as np

W, H = 46080, 17920


def load(path):
    raw = gzip.decompress(open(path, 'rb').read())
    assert raw[:8] == b'MEDIVNR1' and len(raw) == 2073664 and hashlib.sha256(raw[64:]).digest() == raw[32:64]
    val = np.frombuffer(raw, '<u2', 259200, 64 + 518400).reshape(360, 720).astype(np.int64)   # P2 midnight value
    n = np.frombuffer(raw, 'u1', 259200, 64 + 1296000).reshape(360, 720).astype(np.int64)      # P4 midnight n
    return val, n


lat_of = lambda r: 89.75 - 0.5 * r
lon_of = lambda c: 0.25 + 0.5 * c          # east, 0..360


def ranges(r, c):
    """GHRM byte ranges for the 3 x 3 block centred on page cell (r, c): rows top to bottom, 192 samples each."""
    lat_top = lat_of(r - 1) + 0.25
    row0 = int(round((70 - lat_top) * 128))
    col0 = int(round((lon_of(c - 1) - 0.25) * 128)) % W
    assert col0 + 192 <= W, 'block crosses 0/360 E: not used'
    return [[(row0 + k) * W * 4 + col0 * 4, 192 * 4] for k in range(192)], row0, col0


mode = sys.argv[1]
val, n = load(sys.argv[2])
if mode == 'select':
    sites = []
    v = np.where(val >= 2, val / 10, np.nan)
    ok3 = (n >= 3)
    rows = [r for r in range(360) if abs(lat_of(r)) < 69.0 and abs(lat_of(r - 1)) < 70 and abs(lat_of(r + 1)) < 70]
    cand = []
    for r in rows:
        for c in range(1, 719):
            blk = v[r - 1:r + 2, c - 1:c + 2]
            if not ok3[r - 1:r + 2, c - 1:c + 2].all() or np.isnan(blk).any():
                continue
            cand.append((float(v[r, c] - (blk.sum() - v[r, c]) / 8), r, c))
    cand.sort(reverse=True)
    for d, r, c in cand:
        if all(abs(lat_of(r) - s['lat']) > 5 or abs(((lon_of(c) - s['lon'] + 180) % 360) - 180) > 5 for s in sites):
            sites.append({'kind': 'high-contrast', 'lat': lat_of(r), 'lon': lon_of(c), 'row': r, 'col': c, 'contrast_K': round(d, 2)})
        if len(sites) == 10:
            break
    for lat, lon in [(-59.75, 45.25), (-29.75, 135.25), (0.25, 225.25), (29.75, 315.25), (59.75, 25.25),
                     (-59.75, 225.25), (-29.75, 315.25), (0.25, 45.25), (29.75, 135.25), (59.75, 205.25)]:
        r, c = int(round((89.75 - lat) / 0.5)), int(round((lon - 0.25) / 0.5))
        sites.append({'kind': 'background', 'lat': lat, 'lon': lon, 'row': r, 'col': c})
    for s in sites:
        rg, s['ghrm_row0'], s['ghrm_col0'] = ranges(s['row'], s['col'])
    json.dump(sites, sys.stdout, indent=1)
    sys.exit(0)

sites = json.load(open(sys.argv[3]))
blocks = np.fromfile(sys.argv[4], '<f4')
assert blocks.size == len(sites) * 192 * 192, 'block file size'
print('ghrm blocks sha256', hashlib.sha256(blocks.tobytes()).hexdigest())
v = np.where(val >= 2, val / 10, np.nan)
fails = []
print('== GHRM midnight (fitted at 00:00, 2009-2022, 128 ppd) against our GCP midnight window (mean of up to 4 bins 23:30-00:30, 2009-2015)')
res = {'high-contrast': [], 'background': []}
res4 = {'high-contrast': [], 'background': []}
ctrl = {k: {'high-contrast': [], 'background': []} for k in ('true', 'N', 'S', 'E', 'W', '180', 'local3x3mirrorEW', 'local3x3mirrorNS')}
for k, s in enumerate(sites):
    a = blocks[k * 36864:(k + 1) * 36864].reshape(192, 192).astype(np.float64)
    g = np.full((3, 3), np.nan)
    for i in range(3):
        for j in range(3):
            b = a[64 * i:64 * i + 64, 64 * j:64 * j + 64]
            if np.isfinite(b).sum() >= 2048:
                g[i, j] = np.nanmean(b)
    r, c = s['row'], s['col']
    ours = v[r - 1:r + 2, c - 1:c + 2]
    diff = ours - g
    res[s['kind']].append(diff[1, 1])
    for name, (dr, dc) in {'true': (0, 0), 'N': (-1, 0), 'S': (1, 0), 'E': (0, 1), 'W': (0, -1), '180': (0, 360)}.items():
        o = v[(np.arange(r - 1, r + 2) + dr)[:, None], (np.arange(c - 1, c + 2) + dc)[None, :] % 720]
        ctrl[name][s['kind']].append(np.nanmean(np.abs(o - g)))
    ctrl['local3x3mirrorEW'][s['kind']].append(np.nanmean(np.abs(ours[:, ::-1] - g)))
    ctrl['local3x3mirrorNS'][s['kind']].append(np.nanmean(np.abs(ours[::-1, :] - g)))
    cb = a[64:128, 64:128]
    t4 = float(np.nanmean(cb ** 4) ** 0.25)          # radiance-equivalent block value: a temperature of the mean T^4, not of the mean T
    res4[s['kind']].append(ours[1, 1] - t4)
    tag = f"contrast {s['contrast_K']:+.1f} K" if s['kind'] == 'high-contrast' else 'background'
    print(f"  site {k:2d} {s['lat']:+7.2f} {s['lon']:7.2f}E ({tag}): centre cell GHRM {g[1,1]:7.2f} K, ours {ours[1,1]:7.2f} K, diff {diff[1,1]:+6.2f} K; "
          f"GHRM (mean T^4)^1/4 {t4:7.2f} K, diff {ours[1,1] - t4:+6.2f} K; hottest GHRM pixel {np.nanmax(cb):6.1f} K; 3x3 mean |diff| {np.nanmean(np.abs(diff)):5.2f} K")
for kind in ('high-contrast', 'background'):
    d = np.array(res[kind])
    print(f'\n  {kind}: centre-cell difference (ours - GHRM): median {np.nanmedian(d):+.2f} K, mean |diff| {np.nanmean(np.abs(d)):.2f} K, '
          f'range {np.nanmin(d):+.2f} .. {np.nanmax(d):+.2f} K')
    d4 = np.array(res4[kind])
    print(f'  {kind}: against the GHRM radiance-equivalent (mean T^4)^1/4: median {np.nanmedian(d4):+.2f} K, range {np.nanmin(d4):+.2f} .. {np.nanmax(d4):+.2f} K')
print('\n== registration controls: mean |ours - GHRM| over each site\'s 3 x 3 block, averaged over sites')
print('   (the local3x3 mirrors reverse each site\'s own 3 x 3 patch, not the whole global grid; a passing result supports the orientation and does not exclude local pointing or effective-footprint differences)')
for kind in ('high-contrast', 'background'):
    line = ', '.join(f'{name} {np.mean(ctrl[name][kind]):.2f}' for name in ctrl)
    print(f'  {kind}: {line} K')
    if kind == 'high-contrast':
        t = np.mean(ctrl['true'][kind])
        worst_ok = all(np.mean(ctrl[nm][kind]) > t for nm in ctrl if nm != 'true')
        per_site = sum(all(ctrl['true'][kind][i] < ctrl[nm][kind][i] for nm in ctrl if nm != 'true') for i in range(len(ctrl['true'][kind])))
        print(f'  high-contrast: the true alignment scores best on average: {worst_ok}; best at {per_site} of {len(ctrl["true"][kind])} sites individually')
        if not worst_ok:
            fails.append('true alignment is not the best on average at the high-contrast sites')
print('\nThe (mean T^4)^1/4 column is an idealised blackbody spatial-aggregation proxy. It does not establish how much of the inter-product difference is due to')
print('averaging order: the products also differ in channel processing, period, local-time fitting, sampling and georeferencing. The high-contrast sites are')
print('maxima of our own grid (selection bias); they are not a random or independent validation sample.')
print('\nRESULT: ' + ('PASS (registration controls); differences reported without a tolerance and without attributing causes' if not fails else 'FAIL: ' + '; '.join(fails)))
sys.exit(1 if fails else 0)
