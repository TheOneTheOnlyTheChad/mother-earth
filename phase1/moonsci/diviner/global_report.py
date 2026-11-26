#!/usr/bin/env python3
"""Diviner GCP: independent reduction of all 18 retained extractions and the global report (MOON-DIVINER-PROPOSAL rev 2 §6.4).
Build tooling; not served. Needs numpy.

Usage: python3 -I global_report.py <extractions-dir> <checkpoints.jsonl> <planes-dir> [--json OUT.json]
 - re-hashes every retained extraction against its checkpoint (gzip and raw)
 - recomputes each band's noon/midnight planes from the extraction with vectorised integer arithmetic (code separate from
   gcp_stream.js) and compares the SHA-256 with the pane's recorded planes hash, and byte for byte with the copied planes file
 - assembles the 720 x 360 global grid (page order: row 0 = 89.75 N, column 0 = 0.25 E) and reports, per 10-degree band and
   globally, for noon (11:30-12:30) and midnight (23:30-00:30): cells, withheld, no valid data, the n histogram, value
   percentiles, range statistics and caps; the distributions inside the withheld latitudes too (computed without the mask);
   and candidate colour scales (1st/99th percentiles of valid displayed cells) with their clipped shares
Exits 1 on any hash or reduction mismatch."""
import sys
import os
import gzip
import json
import hashlib
import numpy as np

ext_dir, cp_path, pl_dir = sys.argv[1:4]
out_json = sys.argv[sys.argv.index('--json') + 1] if '--json' in sys.argv else None
SENT = -99980000          # values <= this are sentinels (-99990000 empty, -99980000 invalid)
NOON, MID = [46, 47, 48, 49], [94, 95, 0, 1]
MASK = {'noon': 7000, 'mid': 8000}
fails = []


def check(c, m):
    if not c:
        fails.append(m)
        print('  FAIL ' + m)
    return c


cps = [json.loads(l) for l in open(cp_path) if l.strip()]
by_band = {c['band']: c for c in cps}
BANDS = ['80n90n', '70n80n', '60n70n', '50n60n', '40n50n', '30n40n', '20n30n', '10n20n', '00n10n',
         '10s00s', '20s10s', '30s20s', '40s30s', '50s40s', '60s50s', '70s60s', '80s70s', '90s80s']
check(sorted(by_band) == sorted(BANDS) and len(cps) == 18, f'checkpoints cover the 18 bands ({len(cps)} lines)')


def lat0x100(b):
    a, h1, c, h2 = int(b[0:2]), b[2], int(b[3:5]), b[5]
    south = -a if h1 == 's' else a          # e.g. 10s00s: south edge -10; 00n10n: south edge 0
    return south * 100 + 25


def codes(win, latx, masked):
    """win: int64 array [720 lon, 20 lat, 4 bins]; returns value u16, n u8, range u8 arrays [720, 20], integer rules of rev 2 §6.2."""
    valid = win > SENT
    n = valid.sum(axis=2)
    s = np.where(valid, win, 0).sum(axis=2)
    mx = np.where(valid, win, -2 ** 40).max(axis=2)
    mn = np.where(valid, win, 2 ** 40).min(axis=2)
    value = np.zeros(n.shape, np.int64)
    pos = n > 0
    value[pos] = (s[pos] + n[pos] * 500) // (n[pos] * 1000)
    rng = np.full(n.shape, 255, np.int64)
    two = n >= 2
    d = mx - mn
    rng[two] = np.where(d[two] >= 2535000, 254, (d[two] + 5000) // 10000)
    if masked is not None:
        w = np.abs(latx)[None, :] > masked
        w = np.broadcast_to(w, n.shape)
        value = np.where(w, 1, value); n = np.where(w, 0, n); rng = np.where(w, 255, rng)
    return value, n, rng


G = {m: {'value': np.zeros((360, 720), np.int64), 'n': np.zeros((360, 720), np.int64), 'range': np.zeros((360, 720), np.int64),
         'value_nomask': np.zeros((360, 720), np.int64), 'n_nomask': np.zeros((360, 720), np.int64), 'range_nomask': np.zeros((360, 720), np.int64)}
     for m in ('noon', 'mid')}
LATS = 89.75 - 0.5 * np.arange(360)

print('== R1 retained extractions and independent reduction (18 bands)')
for b in BANDS:
    cp = by_band[b]
    ex = cp['outputs']['extraction']
    p = os.path.join(ext_dir, ex['file'])
    gzb = open(p, 'rb').read()
    raw = gzip.decompress(gzb)
    ok = check(hashlib.sha256(gzb).hexdigest() == ex['gz_sha256'] and hashlib.sha256(raw).hexdigest() == ex['raw_sha256'] and len(raw) == 5529600,
               f'{b}: extraction hashes')
    e = np.frombuffer(raw, '<i4').astype(np.int64).reshape(720, 20, 96)
    lat0 = lat0x100(b)
    latx = lat0 + 50 * np.arange(20)
    cells = {}
    for m, bins in (('noon', NOON), ('mid', MID)):
        cells[m] = codes(e[:, :, bins], latx, MASK[m])
        cells[m + '_nomask'] = codes(e[:, :, bins], latx, None)
    # band planes in page order: rows north to south (lat index 19 .. 0), columns (lonIdx + 360) % 720
    order_cols = (np.arange(720) + 360) % 720
    def page(a):
        o = np.zeros((20, 720), np.int64)
        o[:, order_cols] = a.T[::-1, :]
        return o
    vN, nN, rN = (page(x) for x in cells['noon'])
    vM, nM, rM = (page(x) for x in cells['mid'])
    planes = (vN.astype('<u2').tobytes() + vM.astype('<u2').tobytes() + nN.astype('u1').tobytes() + nM.astype('u1').tobytes()
              + rN.astype('u1').tobytes() + rM.astype('u1').tobytes())
    sha = hashlib.sha256(planes).hexdigest()
    rec = cp['outputs']['band_planes']['sha256']
    copied = open(os.path.join(pl_dir, cp['outputs']['band_planes']['file']), 'rb').read()
    ok2 = check(sha == rec and copied == planes, f'{b}: independent planes equal the pane planes (sha {sha[:12]})')
    # sentinel and value checks from the extraction itself
    valid = e > SENT
    bad = ~valid & (e != -99990000) & (e != -99980000)
    check(not bad.any() and (e[valid] > 10000).all() and (e[valid] < 4500000).all(), f'{b}: extraction values valid or exact sentinels')
    check(int((e == -99990000).sum()) == cp['sentinels']['empty_-9999'] and int((e == -99980000).sum()) == cp['sentinels']['invalid_-9998'], f'{b}: sentinel counts equal the checkpoint')
    r0 = int(round((89.75 - (lat0 / 100 + 9.5)) / 0.5))
    for m, (v, n_, r) in (('noon', (vN, nN, rN)), ('mid', (vM, nM, rM))):
        G[m]['value'][r0:r0 + 20] = v; G[m]['n'][r0:r0 + 20] = n_; G[m]['range'][r0:r0 + 20] = r
        vv, nn, rr = (page(x) for x in cells[m + '_nomask'])
        G[m]['value_nomask'][r0:r0 + 20] = vv; G[m]['n_nomask'][r0:r0 + 20] = nn; G[m]['range_nomask'][r0:r0 + 20] = rr
    print(f'  {b}: extraction {"OK" if ok else "FAIL"}; planes {"OK" if ok2 else "FAIL"}; empty {cp["sentinels"]["empty_-9999"]}, invalid {cp["sentinels"]["invalid_-9998"]}, tbol {cp["tbol_min_K"]}-{cp["tbol_max_K"]} K')

# index anchors on the assembled grid (rev 2 §8 item 3a)
print('\n== R2 index anchors on the assembled grid')
check(abs(LATS[0] - 89.75) < 1e-9 and abs(LATS[-1] + 89.75) < 1e-9, 'row 0 = 89.75 N, row 359 = 89.75 S')
e1 = np.frombuffer(gzip.decompress(open(os.path.join(ext_dir, by_band['00n10n']['outputs']['extraction']['file']), 'rb').read()), '<i4').astype(np.int64).reshape(720, 20, 96)
v, n_, r = codes(e1[0:1, 0:1, NOON], np.array([25]), 7000)
check(G['noon']['value'][179, 360] == v[0, 0] and G['noon']['n'][179, 360] == n_[0, 0], 'first source record (-179.75, 0.25 N) -> grid row 179, column 360')
v, n_, r = codes(e1[360:361, 0:1, NOON], np.array([25]), 7000)
check(G['noon']['value'][179, 0] == v[0, 0], '0.25 E, 0.25 N -> grid row 179, column 0')
v, n_, r = codes(e1[719:720, 19:20, NOON], np.array([975]), 7000)
check(G['noon']['value'][160, 359] == v[0, 0], '+179.75, 9.75 N -> grid row 160, column 359')
print('  anchors checked' if not fails else '  see failures')

print('\n== R3 global report (720 x 360 cells of 0.5 deg; masks: noon withheld poleward of 70, midnight poleward of 80)')
summary = {}
for m, name in (('noon', 'noon 11:30-12:30'), ('mid', 'midnight 23:30-00:30')):
    v, n_, r = G[m]['value'], G[m]['n'], G[m]['range']
    shown = v != 1
    valid = v >= 2
    tot = v.size
    print(f'\n  {name}: cells {tot}; withheld {int((v == 1).sum())} ({(v == 1).mean() * 100:.2f}%); '
          f'no valid data {int((v == 0).sum())} ({(v == 0).sum() / shown.sum() * 100:.3f}% of shown cells); valid {int(valid.sum())}')
    print(f'    n histogram over shown cells (0..4): {np.bincount(n_[shown].ravel(), minlength=5).tolist()}')
    vals = v[valid] / 10
    p1, p50, p99 = np.percentile(vals, [1, 50, 99])
    lo, hi = np.floor(p1), np.ceil(p99)
    clip_lo, clip_hi = (vals < lo).mean() * 100, (vals > hi).mean() * 100
    rr = r[valid & (n_ >= 2)]
    print(f'    values (valid shown): min {vals.min():.1f}, 1st pct {p1:.1f}, median {p50:.1f}, 99th pct {p99:.1f}, max {vals.max():.1f} K')
    print(f'    candidate colour scale {lo:.0f}-{hi:.0f} K (1st/99th pct, rounded outward): {clip_lo:.2f}% of valid cells below, {clip_hi:.2f}% above (clipped in colour, exact in readout)')
    print(f'    range for n>=2 ({rr.size} cells): median {np.median(rr):.0f} K, 90th pct {np.percentile(rr, 90):.0f}, 99th pct {np.percentile(rr, 99):.0f}, max {rr.max()} K, capped (>=253.5 K) {int((rr == 254).sum())}')
    print('    by 10-degree band (north to south): band | no valid % of shown | n=0..4 % of shown | median value K | range median / p90 / p99 / max K (n>=2) | withheld')
    rows = []
    for k in range(18):
        sl = slice(20 * k, 20 * k + 20)
        vb, nb, rb = v[sl], n_[sl], r[sl]
        shb = vb != 1
        b = BANDS[k]
        if shb.sum() == 0:
            # fully withheld band: report what the mask hides
            vu, nu, ru = G[m]['value_nomask'][sl], G[m]['n_nomask'][sl], G[m]['range_nomask'][sl]
            rv = ru[(vu >= 2) & (nu >= 2)]
            line = (f'      {b}: withheld (display policy). Without the mask: no valid {(vu == 0).mean() * 100:.2f}%, n=0..4 {"/".join(f"{x:.1f}" for x in np.bincount(nu.ravel(), minlength=5) / nu.size * 100)}%, '
                    f'median {np.median(vu[vu >= 2]) / 10:.1f} K, range median {np.median(rv):.0f} / p90 {np.percentile(rv, 90):.0f} / p99 {np.percentile(rv, 99):.0f} / max {rv.max()} K')
            rows.append({'band': b, 'withheld': True, 'nomask_no_valid_pct': round(float((vu == 0).mean() * 100), 3), 'nomask_range_median': float(np.median(rv)), 'nomask_range_p90': float(np.percentile(rv, 90)), 'nomask_range_p99': float(np.percentile(rv, 99))})
        else:
            vv = vb[vb >= 2]
            rv = rb[(vb >= 2) & (nb >= 2)]
            line = (f'      {b}: {(vb == 0).sum() / shb.sum() * 100:.2f} | {"/".join(f"{x:.1f}" for x in np.bincount(nb[shb], minlength=5) / shb.sum() * 100)} | {np.median(vv) / 10:.1f} | '
                    f'{np.median(rv):.0f} / {np.percentile(rv, 90):.0f} / {np.percentile(rv, 99):.0f} / {rv.max()} | {int((vb == 1).sum())}')
            rows.append({'band': b, 'withheld': False, 'no_valid_pct': round(float((vb == 0).sum() / shb.sum() * 100), 3), 'n_pct': [round(float(x), 2) for x in np.bincount(nb[shb], minlength=5) / shb.sum() * 100],
                         'median_K': float(np.median(vv) / 10), 'range_median': float(np.median(rv)), 'range_p90': float(np.percentile(rv, 90)), 'range_p99': float(np.percentile(rv, 99)), 'range_max': int(rv.max())})
        print(line)
    summary[m] = {'withheld': int((v == 1).sum()), 'no_valid': int((v == 0).sum()), 'shown': int(shown.sum()), 'valid': int(valid.sum()),
                  'n_hist_shown': np.bincount(n_[shown].ravel(), minlength=5).tolist(), 'p1': float(p1), 'p50': float(p50), 'p99': float(p99),
                  'scale': [float(lo), float(hi)], 'clip_below_pct': float(clip_lo), 'clip_above_pct': float(clip_hi),
                  'range_median': float(np.median(rr)), 'range_p90': float(np.percentile(rr, 90)), 'range_p99': float(np.percentile(rr, 99)), 'range_max': int(rr.max()), 'capped': int((rr == 254).sum()), 'bands': rows}

# effect of the masks: the latitude rows just inside and outside each limit
print('\n== R4 around the mask limits (rows of 0.5 deg; computed without the mask)')
for m, lim in (('noon', 70), ('mid', 80)):
    vu, nu, ru = G[m]['value_nomask'], G[m]['n_nomask'], G[m]['range_nomask']
    for hemi, sign in (('N', 1), ('S', -1)):
        parts = []
        for edge in (lim - 10, lim - 5, lim, lim + 5):
            sel = (np.abs(LATS) >= edge) & (np.abs(LATS) < edge + 5) & (np.sign(LATS) == sign)
            if not sel.any():
                continue
            vv, nn, rr = vu[sel], nu[sel], ru[sel]
            r2 = rr[(vv >= 2) & (nn >= 2)]
            parts.append(f'{edge}-{edge + 5}{hemi}: range median {np.median(r2):.0f} / p90 {np.percentile(r2, 90):.0f} K, no valid {(vv == 0).mean() * 100:.2f}%')
        print(f'  {m} (limit {lim}): ' + '; '.join(parts))

# a digest of the assembled grids (evidence only; not a page file)
dig = hashlib.sha256(b''.join(G[m][k].astype('<i4').tobytes() for m in ('noon', 'mid') for k in ('value', 'n', 'range'))).hexdigest()
print(f'\nassembled grid digest (int32 noon value, n, range, then midnight; evidence only): {dig}')
summary['grid_digest'] = dig
if out_json:
    json.dump(summary, open(out_json, 'w'), indent=1)
print('\nRESULT: ' + ('PASS' if not fails else 'FAIL: ' + '; '.join(fails)))
sys.exit(1 if fails else 0)
