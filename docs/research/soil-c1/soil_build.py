#!/usr/bin/env python3
"""Build Mother Earth's 4-degree soil table from Glen et al. (2026) model outputs v1.0.1 (Zenodo 22137130). Replaces cells4.py + the
unsaved assembly step of the 24 Nov assessment (GPT soil C1 review, 25 Nov, H1/H2).

One pass per reporting period reads the drained raster, the burned raster and the static organic-soil extent together, so that:
  * every value is weighted by exact equal-area overlap (CEA metres: dx linear in longitude, dy from pyproj at each 4-degree parallel),
    treating each 1 km cell total as uniform within that cell (no second percentage multiplication, no second annualisation);
  * NaN is never summed; its overlap area is the footprint of source raster cells with incomplete estimates (not the organic-soil area
    lacking estimates);
  * the drained and burned NaN masks are compared cell for cell; any difference stops the build;
  * state flags are derived from unrounded sums BEFORE any rounding; stored numbers are rounded to 6 significant figures, which can
    never turn a positive into zero.

Fail-closed input checks: zip and extent SHA-256 against the record's manifest; each extracted GeoTIFF's CRC-32 and size against the
zip directory; exact CRS, transform (1000 m, north-up), size, dtype, band count, tags (release, period, units, missing-data rule);
values finite or NaN only (emissions), no negatives; extent finite, no NaN, 0..100.

Usage: soil_build.py <zip> <extent.tif> <dir of extracted tifs> <out.json>
"""
import sys, os, json, time, hashlib, zipfile, zlib, resource, platform
import numpy as np

ZIP_SHA = '5c08288497265b761421d898819f11824000c1b06b4455052e0e1849d82a1473'
EXT_SHA = '7b35b59ab8d9944e9d0fa64c2ec903cdc0eaf131f4d462ec6304ddb740d15e0e'
PERIODS = ['2001_2005', '2006_2010', '2011_2015', '2016_2020', '2021_2024']
COMPONENTS = ['drained', 'burned']
GRID = dict(width=34736, height=14686, transform=(1000.0, 0.0, -17368000.0, 0.0, -1000.0, 7343000.0))
CRS_KEYS = {'proj': 'cea', 'lat_ts': 30, 'lon_0': 0, 'x_0': 0, 'y_0': 0, 'ellps': 'WGS84', 'units': 'm'}
EMIS_UNITS = 'Mg CO2e cell-1 yr-1'
EMIS_MISSING = 'NaN where any organic soil source area lacks emissions; zero where no organic soil is mapped'
EXT_UNITS = 'percent of full 1 km cell'
NR, NC = 45, 90                      # g4 domain: id r_c, south = -90 + 4r, west = -180 + 4c


class InputError(Exception):
    pass


def need(cond, msg):
    if not cond:
        raise InputError(msg)


def sig(x, n=6):
    """Round to n significant figures; 0 stays 0 and a positive never becomes 0."""
    x = float(x)
    return 0.0 if x == 0 else float(f'{x:.{n - 1}e}')


def weights(edges_src, edges_dst):
    """Overlap fractions of each ascending source interval in each ascending destination interval (scipy CSR, n_src x n_dst)."""
    from scipy import sparse
    n, m = len(edges_src) - 1, len(edges_dst) - 1
    rows, cols, vals = [], [], []
    j = 0
    for i in range(n):
        a, b = edges_src[i], edges_src[i + 1]
        while j < m and edges_dst[j + 1] <= a:
            j += 1
        k = j
        while k < m and edges_dst[k] < b:
            lo, hi = max(a, edges_dst[k]), min(b, edges_dst[k + 1])
            if hi > lo:
                rows.append(i); cols.append(k); vals.append((hi - lo) / (b - a))
            k += 1
    return sparse.csr_matrix((vals, (rows, cols)), shape=(n, m))


def grid_weights(transform, width, height, crs):
    """Column and row weight matrices into the g4 grid plus one 'outside' bin on every side: Wx (W, 92), Wy (H, 47, rows top-down)."""
    from pyproj import Transformer
    a, _, c, _, e, f = transform
    tr = Transformer.from_crs('EPSG:4326', crs, always_xy=True)
    lon_e = np.arange(-180, 181, 4.0); lat_e = np.arange(-90, 91, 4.0)
    xb = np.array(tr.transform(lon_e, np.zeros_like(lon_e))[0])
    yb = np.array(tr.transform(np.zeros_like(lat_e), lat_e)[1])
    xb_ext = np.concatenate([[-1e12], xb, [1e12]]); yb_ext = np.concatenate([[-1e12], yb, [1e12]])
    Wx = weights(c + a * np.arange(width + 1), xb_ext)
    Wy = weights((f + e * np.arange(height + 1))[::-1], yb_ext)[::-1]
    return Wx, Wy


def check_values(v, name, allow_nan):
    need(not np.isinf(v).any(), f'{name}: infinite values')
    if not allow_nan:
        need(not np.isnan(v).any(), f'{name}: NaN not allowed')
    need(not (v < 0).any(), f'{name}: negative values')


def aggregate(read_strip, height, Wx, Wy, cell_km2, strip=512):
    """read_strip(r0, r1) -> dict(drained=..., burned=..., extent=...) float64 arrays. Returns per-bin sums (47 x 92 arrays)."""
    z = lambda: np.zeros((Wy.shape[1], Wx.shape[1]))
    acc = dict(total_km2=z(), organic_km2=z())
    for comp in COMPONENTS:
        acc[comp + '_Mg'] = z(); acc[comp + '_pos_km2'] = z()
    acc['nan_km2'] = z()
    raw = dict(drained=0.0, burned=0.0, nan_px=0, pos_px=dict(drained=0, burned=0))
    for r0 in range(0, height, strip):
        r1 = min(height, r0 + strip)
        s = read_strip(r0, r1)
        wy = Wy[r0:r1].T
        project = lambda arr: wy @ (arr @ Wx)
        check_values(s['extent'], 'extent', allow_nan=False)
        need((s['extent'] <= 100).all(), 'extent: values above 100 percent')
        masks = {}
        for comp in COMPONENTS:
            v = s[comp]
            check_values(v, comp, allow_nan=True)
            masks[comp] = np.isnan(v)
        need(np.array_equal(masks['drained'], masks['burned']),
             f'drained and burned NaN masks differ in rows {r0}-{r1}: cannot share one incomplete-footprint value')
        nanm = masks['drained']
        acc['nan_km2'] += project(nanm.astype(np.float64)) * cell_km2
        acc['total_km2'] += project(np.ones_like(s['extent'])) * cell_km2
        acc['organic_km2'] += project(s['extent'] / 100.0) * cell_km2
        raw['nan_px'] += int(nanm.sum())
        for comp in COMPONENTS:
            vz = np.where(nanm, 0.0, s[comp])
            acc[comp + '_Mg'] += project(vz)
            acc[comp + '_pos_km2'] += project((vz > 0).astype(np.float64)) * cell_km2
            raw[comp] += float(vz.sum())
            raw['pos_px'][comp] += int((vz > 0).sum())
    return acc, raw


def cell_records(per_period, organic, total_km2):
    """Builds the sparse cell table from unrounded per-bin sums. States are decided here, before rounding."""
    cells, summary = {}, dict(organic_cells=0, emitting_without_organic=[], unknown=[])
    for r in range(NR):
        for c in range(NC):
            R, C = r + 1, c + 1
            org = float(organic[R, C])
            periods, keep = {}, org > 0
            for p in PERIODS:
                a = per_period[p]
                nan_km2 = float(a['nan_km2'][R, C]); avail_km2 = float(total_km2[R, C]) - nan_km2
                coverage = 'complete' if nan_km2 == 0 else ('none' if avail_km2 <= 1e-9 else 'incomplete')
                rec = dict(coverage=coverage, incomplete_source_footprint_km2=sig(nan_km2))
                for comp in COMPONENTS:
                    v = float(a[comp + '_Mg'][R, C])
                    state = 'unknown' if coverage == 'none' else ('positive' if v > 0 else 'zero')
                    rec[comp] = dict(Mg=sig(v) if state != 'unknown' else None, state=state)
                    keep = keep or v > 0
                    if state == 'positive' and org == 0:
                        summary['emitting_without_organic'].append(f'{r}_{c}/{p}/{comp}')
                keep = keep or nan_km2 > 0
                if coverage == 'none':
                    summary['unknown'].append(f'{r}_{c}/{p}')
                periods[p] = rec
            if keep:
                cells[f'{r}_{c}'] = dict(has_mapped_organic_soil=org > 0, organic_km2=sig(org), periods=periods)
                summary['organic_cells'] += org > 0
    return cells, summary


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as fh:
        for b in iter(lambda: fh.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def crc32(path):
    c = 0
    with open(path, 'rb') as fh:
        for b in iter(lambda: fh.read(1 << 20), b''):
            c = zlib.crc32(b, c)
    return c & 0xFFFFFFFF


def open_checked(path, kind, period=None):
    import rasterio
    from pyproj import CRS
    d = rasterio.open(path)
    need(d.count == 1 and d.dtypes[0] == 'float32', f'{path}: expected one float32 band')
    need((d.width, d.height) == (GRID['width'], GRID['height']), f'{path}: size {d.width}x{d.height}')
    need(tuple(d.transform)[:6] == GRID['transform'], f'{path}: transform {tuple(d.transform)[:6]}')
    p = CRS.from_user_input(d.crs).to_dict()
    need(all(str(p.get(k)) == str(v) for k, v in CRS_KEYS.items()), f'{path}: CRS {p}')
    t = d.tags()
    need(t.get('release') == 'v1.0.1', f'{path}: release tag {t.get("release")}')
    if kind == 'extent':
        need(t.get('units') == EXT_UNITS, f'{path}: units {t.get("units")}')
    else:
        need(t.get('units') == EMIS_UNITS and t.get('missing_data') == EMIS_MISSING and t.get('period') == period,
             f'{path}: tags {t}')
    return d


def main():
    zpath, epath, tdir, out = sys.argv[1:5]
    t0 = time.time()
    need(sha256(zpath) == ZIP_SHA, 'zip SHA-256 differs from the release manifest')
    need(sha256(epath) == EXT_SHA, 'extent SHA-256 differs from the release manifest')
    zinfo = {os.path.basename(i.filename): i for i in zipfile.ZipFile(zpath).infolist()}
    names = {(comp, p): f'{comp}_emissions_Mg_CO2e_cell_yr_1km_{p}.tif' for comp in COMPONENTS for p in PERIODS}
    need(set(names.values()) == {n for n in zinfo if n.endswith('.tif')}, 'zip members differ from the expected ten GeoTIFFs')
    tif_sha = {}
    for n in names.values():
        path = os.path.join(tdir, n)
        need(os.path.getsize(path) == zinfo[n].file_size and crc32(path) == zinfo[n].CRC, f'{n}: differs from the zip directory')
        tif_sha[n] = sha256(path)
    de = open_checked(epath, 'extent')
    Wx, Wy = grid_weights(GRID['transform'], GRID['width'], GRID['height'], de.crs)
    per_period, raw_all = {}, {}
    for p in PERIODS:
        dd = open_checked(os.path.join(tdir, names[('drained', p)]), 'emissions', p)
        db = open_checked(os.path.join(tdir, names[('burned', p)]), 'emissions', p)
        win = lambda r0, r1: ((r0, r1), (0, GRID['width']))
        rs = lambda r0, r1: dict(drained=dd.read(1, window=win(r0, r1)).astype(np.float64),
                                 burned=db.read(1, window=win(r0, r1)).astype(np.float64),
                                 extent=de.read(1, window=win(r0, r1)).astype(np.float64))
        acc, raw = aggregate(rs, GRID['height'], Wx, Wy, cell_km2=1.0)
        for comp in COMPONENTS:
            binned = acc[comp + '_Mg'].sum()
            need(abs(binned - raw[comp]) <= 1e-9 * max(1.0, raw[comp]), f'{p} {comp}: conservation failed')
            need(acc[comp + '_Mg'][[0, -1], :].sum() + acc[comp + '_Mg'][:, [0, -1]].sum() == 0, f'{p} {comp}: emissions outside the world')
        per_period[p], raw_all[p] = acc, raw
        dd.close(); db.close()
        print(p, json.dumps(raw), round(time.time() - t0, 1), 's', flush=True)
    organic = per_period[PERIODS[0]]['organic_km2']; total_km2 = per_period[PERIODS[0]]['total_km2']
    cells, summary = cell_records(per_period, organic, total_km2)
    inside = lambda a: float(a[1:NR + 1, 1:NC + 1].sum())
    meta = dict(
        product='Global organic soil disturbance and greenhouse gas emissions, 2001 to 2024: model outputs (Glen et al. 2026)',
        version='1.0.1', doi='10.5281/zenodo.22137130', licence='CC BY 4.0 (data); see license_and_attribution.md in the record',
        source_checked='see the version-check record in the assessment notes; never relabel an old check as current',
        inputs=dict(zip_sha256=ZIP_SHA, extent_sha256=EXT_SHA, tif_sha256=tif_sha),
        grid=dict(id='g4', rows=NR, cols=NC, cell_id='r_c', south='-90 + 4*r', west='-180 + 4*c'),
        sparse_rule=('A g4 cell is listed when it has mapped organic soil, any positive value, or any incomplete source footprint in any '
                     'period. A cell in the 45 x 90 domain that is not listed has no mapped organic soil, exactly zero for both components '
                     'in every period, and complete coverage. A missing table, period or malformed record is unavailable, never zero.'),
        units=dict(Mg='Mg CO2e per year, period average, summed over the whole 4-degree cell (not per area, not a point value)',
                   km2='km2 within the 4-degree cell'),
        method=('Exact equal-area overlap of each 1 km source cell (CEA lat_ts=30, 1000 m) with each 4-degree cell, treating each source '
                'cell total as uniform within it; no second percentage multiplication, no second annualisation.'),
        fields=dict(has_mapped_organic_soil='true when the unrounded mapped organic-soil area is above 0',
                    organic_km2='mapped organic-soil area (extent percent x overlap area), 6 significant figures',
                    coverage='complete | incomplete (some source raster cells NaN) | none (all source raster cells NaN: unknown)',
                    incomplete_source_footprint_km2=('overlap area of source raster cells flagged NaN (any organic-soil source area lacking '
                                                     'emissions); a raster footprint, not the measured organic-soil area lacking estimates'),
                    state='positive | zero (assigned 0 by the model, summed over available raster cells) | unknown',
                    Mg='6 significant figures; null when state is unknown'),
        rounding='Stored values: 6 significant figures; states decided before rounding. Display rounding belongs to the page.',
        masks='drained and burned NaN masks verified identical in every period',
        totals={p: dict(drained_Mg=raw_all[p]['drained'], burned_Mg=raw_all[p]['burned'], nan_source_cells=raw_all[p]['nan_px'],
                        positive_source_cells=raw_all[p]['pos_px']) for p in PERIODS},
        organic_km2_total=inside(organic), outside_world_km2=float(total_km2.sum()) - inside(total_km2),
        checks=dict(listed_cells=len(cells), cells_with_mapped_organic_soil=summary['organic_cells'],
                    positive_without_mapped_organic_soil=summary['emitting_without_organic'], unknown_cells=summary['unknown']),
        build=dict(seconds=round(time.time() - t0, 1), peak_rss_MiB_linux=round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024, 1),
                   platform=platform.platform(), python=platform.python_version()))
    json.dump(dict(meta=meta, cells=cells), open(out, 'w'), separators=(',', ':'), sort_keys=True)
    print(json.dumps(meta['checks'])[:2000]); print(json.dumps(meta['build']))


if __name__ == '__main__':
    try:
        main()
    except InputError as e:
        sys.exit(f'INPUT CHECK FAILED: {e}')
