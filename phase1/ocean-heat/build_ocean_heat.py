#!/usr/bin/env python3
"""Ocean Heat snapshot generator (OCEAN-HEAT-PROPOSAL rev 4.2, §5). Branch-only proof of concept.

Reads the three pinned NOAA Coral Reef Watch inputs for 2026-11-09 and writes a fixed, versioned snapshot:
  manifest.json      — identity, provenance, grids, encodings, file hashes (the page pins this file's sha256)
  mask.bin.z         — NOAA's own mask, one 2-bit code per native 0.05° cell (0 water, 1 land, 2 no 1991–2020 normal, 3 sea ice)
  v025.bin.z         — 0.25° block values (720 × 1440)
  v050.bin.z         — 0.5° block values (360 × 720)
Every grid is north-first: row 0 starts at 90° N, column 0 starts at 180° W. Cell edges, not centres.

Hard stops (each exits non-zero, nothing is written):
  - input sha256 ≠ the pinned value
  - CoralTemp latitude not ascending (we flip it to north-first), or any lat/lon array not bitwise identical after the flip
  - time coverage not the pinned day; climatology title not naming that calendar day and 1991-2020
  - mask values ⊄ {0,1,2,4}; mask 0 ⇎ anomaly ≠ fill ⇎ climatology ≠ fill; mask 0 ⇏ valid SST; mask 1 ⇏ SST = fill (literal)
  - per-mask counts ≠ the pinned counts (incl. 4,655 ice cells carrying the SST fill)
  - stored SST − anomaly − climatology ≠ 0 in any mask-0 cell (exact, no tolerance)
  - per block: Σ SST − Σ anomaly − Σ climatology ≠ 0 over the contributing cells (checked on integer sums before dividing)
Land is taken from mask 1 only — never from the SST fill.

Usage:  python3 build_ocean_heat.py --inputs DIR --out DIR [--check]
  --check   rebuild in memory and compare byte-for-byte with what is in --out (exit 1 on any difference)
Breaks (test only; each must make the build stop): BREAK=no-flip | shift-one | land-from-fill | loose-identity | wrong-hash
"""
import argparse, hashlib, json, os, sys, zlib
import numpy as np
import netCDF4

REVISION = 'oh-2026-11-09-R1'
DAY = '2026-11-09'
BASE = 'https://www.star.nesdis.noaa.gov/pub/socd/mecb/crw/data/5km/'
INPUTS = {
    'sst':  dict(name='coraltemp_v3.1_20261109.nc', bytes=11418321,
                 sha256='57de86e9ae545ce109ece2212d799e745eacca1a7e94e6658880ca8240665b92',
                 url=BASE + 'v3.1_op/nc/v1.0/daily/sst/2026/coraltemp_v3.1_20261109.nc'),
    'ssta': dict(name='ct5km_ssta_v3.1-clim19912020-v1_20261109.nc', bytes=10399448,
                 sha256='7b97760aabbc01cc8c247fbc317ff1edce0b90aaefffe465d2c18d7a4eef1033',
                 url=BASE + 'v3.1-clim19912020-v1/nc/v1.0/daily/ssta/2026/ct5km_ssta_v3.1-clim19912020-v1_20261109.nc'),
    'clim': dict(name='ct5km_v3.1_clim-sst-mean-daily-window-01day-01grid-source19912020_day1109.nc', bytes=6349472,
                 sha256='1495ac580c53122dd815b43e595c5404abf95b46c7bd671fb4f394f721ed592e',
                 url=BASE + 'v3.1-clim19912020-v1/climatology/nc/ct5km_v3.1_clim-sst-mean-daily-window-01day-01grid-source19912020_day1109.nc'),
}
# Pinned counts from the source-file check (C4 + correction 1); any change stops the build.
EXPECT = {'mask0': 12833780, 'mask1': 8722205, 'mask2': 991557, 'mask4': 3372458, 'ice_with_sst_fill': 4655}
FILL = -32768
NONE16 = -32768          # block value sentinel: no contributing cell / unavailable
BREAK = os.environ.get('BREAK', '')


def stop(msg):
    print('STOP: ' + msg, file=sys.stderr)
    sys.exit(3)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for ch in iter(lambda: f.read(1 << 20), b''):
            h.update(ch)
    return h.hexdigest()


def round_half_away(num, den):
    """Nearest integer of num/den, ties away from zero, for integer arrays (den > 0). Exact, no floats."""
    q, r = np.divmod(np.abs(num), den)
    q = q + (2 * r >= den)
    return np.sign(num) * q


def build(inputs_dir):
    # ---------- inputs: exact bytes
    for k, v in INPUTS.items():
        p = os.path.join(inputs_dir, v['name'])
        if not os.path.isfile(p):
            stop(f'missing input {v["name"]}')
        want = v['sha256'] if not (BREAK == 'wrong-hash' and k == 'clim') else '0' * 64
        got = sha256(p)
        if got != want:
            stop(f'{v["name"]} sha256 {got} ≠ pinned {want}')
        if os.path.getsize(p) != v['bytes']:
            stop(f'{v["name"]} size changed')
    ds = {k: netCDF4.Dataset(os.path.join(inputs_dir, v['name'])) for k, v in INPUTS.items()}
    for d in ds.values():
        d.set_auto_maskandscale(False)

    # ---------- time and identity attributes
    for k in ('sst', 'ssta'):
        if ds[k].getncattr('time_coverage_start') != '20261109T000000Z' or ds[k].getncattr('time_coverage_end') != '20261110T000000Z':
            stop(f'{k} time coverage is not {DAY}')
    t = ds['clim'].getncattr('title')
    if 'November 09' not in t or '1991-2020' not in t:
        stop('climatology title does not name November 09 and 1991-2020')
    if '1991-2020' not in ds['ssta'].getncattr('title'):
        stop('anomaly title does not name the 1991-2020 baseline')

    # ---------- grid: CoralTemp is south-first; flip to north-first, then demand bitwise identity
    lat_sst = np.array(ds['sst']['lat'][:])
    if not lat_sst[0] < lat_sst[-1]:
        stop('CoralTemp latitude is no longer ascending — the flip rule no longer applies')
    flip = BREAK != 'no-flip'
    lat_sst_nf = lat_sst[::-1] if flip else lat_sst
    for k in ('ssta', 'clim'):
        if not (np.array_equal(lat_sst_nf, ds[k]['lat'][:]) and np.array_equal(ds['sst']['lon'][:], ds[k]['lon'][:])):
            stop(f'grids differ: CoralTemp (after flip) vs {k}')
    lat = np.array(ds['ssta']['lat'][:], dtype=np.float64)
    lon = np.array(ds['ssta']['lon'][:], dtype=np.float64)
    if lat.shape != (3600,) or lon.shape != (7200,) or not (lat[0] > 89.97 and lon[0] < -179.97):
        stop('unexpected grid shape or origin')
    if np.max(np.abs(lon - (-179.975 + 0.05 * np.arange(7200)))) > 1e-4 or np.max(np.abs(lat - (89.975 - 0.05 * np.arange(3600)))) > 1e-4:
        stop('grid is not the 0.05° centre grid')

    # ---------- arrays (packed integers)
    sst = np.array(ds['sst']['analysed_sst'][0])
    sst = sst[::-1] if flip else sst
    ssta = np.array(ds['ssta']['sea_surface_temperature_anomaly'][0]).astype(np.int32)
    clim = np.array(ds['clim']['analysed_sst'][:]).astype(np.int32)
    mask = np.array(ds['ssta']['mask'][0])
    if BREAK == 'shift-one':
        i, j = np.argwhere(mask == 0)[len(np.argwhere(mask == 0)) // 2]
        ssta[i, j] += 1
    sst32 = sst.astype(np.int32)

    # ---------- mask invariants against literal sentinels
    if not set(np.unique(mask).tolist()) <= {0, 1, 2, 4}:
        stop('mask has values outside {0,1,2,4}')
    w = mask == 0
    if not (np.array_equal(w, ssta != FILL) and np.array_equal(w, clim != FILL)):
        stop('mask 0 ⇎ valid anomaly ⇎ valid climatology')
    if not np.all((sst[w] != FILL) & (sst[w] >= -200) & (sst[w] <= 5000)):
        stop('mask 0 cell without a valid SST')
    land = (sst == FILL) if BREAK == 'land-from-fill' else (mask == 1)
    if not np.all(sst[mask == 1] == FILL):
        stop('a land (mask 1) cell has an SST value')
    counts = {'mask0': int(w.sum()), 'mask1': int(land.sum()), 'mask2': int((mask == 2).sum()), 'mask4': int((mask == 4).sum()),
              'ice_with_sst_fill': int(((mask == 4) & (sst == FILL)).sum())}
    if counts != EXPECT:
        stop(f'counts {counts} ≠ pinned {EXPECT}')

    # ---------- exact identity on stored values
    resid = (sst32 - ssta - clim)[w]
    tol = 1 if BREAK == 'loose-identity' else 0
    if np.any(np.abs(resid) > tol):
        stop(f'SST − anomaly − climatology ≠ 0 in {int(np.count_nonzero(resid))} water cells')

    # ---------- mask plane: 2-bit codes, 4 cells per byte, cell i in bits 2*(i%4)
    code = np.zeros(mask.shape, dtype=np.uint8)
    code[land] = 1
    code[mask == 2] = 2
    code[mask == 4] = 3
    flat = code.reshape(-1)
    packed = (flat[0::4] | (flat[1::4] << 2) | (flat[2::4] << 4) | (flat[3::4] << 6)).astype(np.uint8)

    # ---------- block values
    def blocks(res):
        k = int(round(res / 0.05))
        R, C = 3600 // k, 7200 // k
        wb = w.reshape(R, k, C, k)
        n = wb.sum(axis=(1, 3)).astype(np.int64)
        def bsum(a):
            return np.where(wb, a.reshape(R, k, C, k), 0).astype(np.int64).sum(axis=(1, 3))
        s_s, a_s, c_s = bsum(sst32), bsum(ssta), bsum(clim)
        if np.any((s_s - a_s - c_s)[n > 0] != 0):
            stop(f'block identity Σ SST − Σ anomaly − Σ climatology ≠ 0 at {res}°')
        # SST only if every contributing cell has a valid SST (always true here: mask 0 ⇒ valid SST — kept as the rule)
        sst_ok = (np.where(wb, ~((sst.reshape(R, k, C, k) != FILL)), False).sum(axis=(1, 3)) == 0)
        den = np.maximum(n, 1)
        anom = np.where(n > 0, round_half_away(a_s, den), NONE16).astype('<i2')
        sstm = np.where((n > 0) & sst_ok, round_half_away(s_s, den), NONE16).astype('<i2')
        landc = land.reshape(R, k, C, k).sum(axis=(1, 3)).astype(np.uint8)
        nn = n.astype(np.uint8)
        raw = anom.tobytes() + sstm.tobytes() + nn.tobytes() + landc.tobytes()
        return raw, dict(res=res, rows=R, cols=C, cells_per_block=k * k,
                         planes=[{'name': 'anomaly_c100', 'type': 'int16le', 'none': NONE16},
                                 {'name': 'sst_c100', 'type': 'int16le', 'none': NONE16},
                                 {'name': 'n_contributing', 'type': 'uint8'},
                                 {'name': 'n_land', 'type': 'uint8'}],
                         rounding='nearest 0.01 °C of the exact integer mean, ties away from zero')

    files = {}
    raw_mask = packed.tobytes()
    files['mask.bin.z'] = (zlib.compress(raw_mask, 9), len(raw_mask), dict(role='mask', rows=3600, cols=7200, res=0.05,
        encoding='2-bit codes, 4 cells per byte, cell i at bits 2*(i%4), row-major', codes={'0': 'water', '1': 'land', '2': 'no 1991-2020 normal', '3': 'sea ice'}))
    for res, nm in ((0.25, 'v025.bin.z'), (0.5, 'v050.bin.z')):
        raw, meta = blocks(res)
        files[nm] = (zlib.compress(raw, 9), len(raw), dict(role='values', **meta))

    manifest = {
        'kind': 'Mother Earth Ocean Heat snapshot', 'revision': REVISION, 'data_date': DAY,
        'time_coverage': {'start': '2026-11-09T00:00:00Z', 'end': '2026-11-10T00:00:00Z', 'reference_time': '2026-11-09T12:00:00Z'},
        'baseline': '1991-2020 daily climatology (NOAA Coral Reef Watch)',
        'grid': {'origin': 'row 0 starts at 90°N, column 0 starts at 180°W; cell edges', 'native_res_deg': 0.05, 'rows': 3600, 'cols': 7200,
                 'lookup': 'col = floor((((lng + 180) mod 360 + 360) mod 360) / res), row = min(floor((90 − lat) / res), rows − 1)'},
        'inputs': [dict(role=k, **v) for k, v in INPUTS.items()],
        'counts': EXPECT,
        'files': {nm: dict(sha256=hashlib.sha256(z).hexdigest(), bytes=len(z), raw_bytes=rawn, compression='zlib (DecompressionStream "deflate")', **meta)
                  for nm, (z, rawn, meta) in files.items()},
        'credit': {'text': 'NOAA Coral Reef Watch',
                   'products': ['https://coralreefwatch.noaa.gov/product/5km/index_5km_sst.php',
                                'https://coralreefwatch.noaa.gov/product/5km/index_5km_ssta_clim19912020.php'],
                   'methods_article_doi': '10.3390/rs12233856', 'dataset_doi': None,
                   'licence': 'NOAA Coral Reef Watch: available for use without restriction, with credit (anomaly and climatology file attributes)'},
        'generator': 'phase1/ocean-heat/build_ocean_heat.py',
    }
    mbytes = (json.dumps(manifest, indent=1, sort_keys=True, ensure_ascii=False) + '\n').encode('utf-8')
    out = {nm: z for nm, (z, _, _) in files.items()}
    out['manifest.json'] = mbytes
    return out, counts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--inputs', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    out, counts = build(a.inputs)
    if a.check:
        bad = []
        for nm, b in out.items():
            p = os.path.join(a.out, nm)
            if not os.path.isfile(p) or open(p, 'rb').read() != b:
                bad.append(nm)
        if bad:
            print('CHECK FAILED: ' + ', '.join(bad)); sys.exit(1)
        print('check OK: ' + ', '.join(f'{nm} {hashlib.sha256(b).hexdigest()[:16]}' for nm, b in sorted(out.items())))
        return
    os.makedirs(a.out, exist_ok=True)
    for nm, b in out.items():
        with open(os.path.join(a.out, nm), 'wb') as f:
            f.write(b)
    print(json.dumps({'counts': counts, 'files': {nm: {'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()} for nm, b in sorted(out.items())}}, indent=1))


if __name__ == '__main__':
    main()
