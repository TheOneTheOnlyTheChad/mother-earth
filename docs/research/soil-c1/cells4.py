#!/usr/bin/env python3
"""Sum Glen et al. (2026) 1 km per-cell emissions (Mg CO2e cell-1 yr-1, WGS84 CEA lat_ts=30) into Mother Earth's 4-degree cells.
Exact area weighting: in an equal-area projection the area of the part of a 1 km cell inside a 4-degree cell is (dx overlap)*(dy overlap),
with dx linear in longitude and dy linear in the projected y of the boundary latitude. NaN cells are never summed: their overlap area is
tracked as missing. Zero cells and the organic-soil extent are tracked separately. Usage: cells4.py <raster> [<extent raster>] <out.json>"""
import sys, json, time, resource, math
import numpy as np, rasterio
from pyproj import Transformer
from scipy import sparse

def weights(edges_src, edges_dst):
    """Overlap fractions of each source interval [edges_src[i], edges_src[i+1]] (ascending) in each destination interval."""
    n, m = len(edges_src) - 1, len(edges_dst) - 1
    rows, cols, vals = [], [], []
    j = 0
    for i in range(n):
        a, b = edges_src[i], edges_src[i + 1]
        while j < m and edges_dst[j + 1] <= a: j += 1
        k = j
        while k < m and edges_dst[k] < b:
            lo, hi = max(a, edges_dst[k]), min(b, edges_dst[k + 1])
            if hi > lo: rows.append(i); cols.append(k); vals.append((hi - lo) / (b - a))
            k += 1
    return sparse.csr_matrix((vals, (rows, cols)), shape=(n, m))

def main():
    src, out = sys.argv[1], sys.argv[-1]
    ext = sys.argv[2] if len(sys.argv) == 4 else None
    t0 = time.time()
    with rasterio.open(src) as d:
        T, W, H, crs = d.transform, d.width, d.height, d.crs
        tr = Transformer.from_crs('EPSG:4326', crs, always_xy=True)
        lon_e = np.arange(-180, 181, 4.0); lat_e = np.arange(-90, 91, 4.0)
        xb = np.array(tr.transform(lon_e, np.zeros_like(lon_e))[0])           # x of the 4-degree meridians
        yb = np.array(tr.transform(np.zeros_like(lat_e), lat_e)[1])           # y of the 4-degree parallels (ascending)
        x_src = T.c + T.a * np.arange(W + 1)                                   # column edges, ascending
        y_src_desc = T.f + T.e * np.arange(H + 1)                              # row edges, descending (row 0 at top)
        # outside the world (beyond +-180 or the poles) goes to an extra "outside" bin
        xb_ext = np.concatenate([[-1e12], xb, [1e12]]); yb_ext = np.concatenate([[-1e12], yb, [1e12]])
        Wx = weights(x_src, xb_ext)                                            # (W, 92): bin 0 west of -180, bin 91 east of 180
        y_src_asc = y_src_desc[::-1]
        Wy_asc = weights(y_src_asc, yb_ext)                                    # (H, 47) for rows bottom-up
        Wy = Wy_asc[::-1]                                                      # rows top-down
        S = np.zeros((47, 92)); A_nan = np.zeros((47, 92)); A_zero = np.zeros((47, 92)); A_pos = np.zeros((47, 92)); A_neg = np.zeros((47, 92))
        Ext = np.zeros((47, 92))
        stats = dict(nan=0, zero=0, pos=0, neg=0, total=0.0, maxv=0.0)
        de = rasterio.open(ext) if ext else None
        STRIP = 512
        for r0 in range(0, H, STRIP):
            r1 = min(H, r0 + STRIP)
            v = d.read(1, window=((r0, r1), (0, W))).astype(np.float64)
            nanm = np.isnan(v); vz = np.where(nanm, 0.0, v)
            stats['nan'] += int(nanm.sum()); stats['zero'] += int((v == 0).sum()); stats['pos'] += int((v > 0).sum()); stats['neg'] += int((v < 0).sum())
            stats['total'] += float(vz.sum()); stats['maxv'] = max(stats['maxv'], float(np.nanmax(v)) if (~nanm).any() else 0.0)
            wy = Wy[r0:r1].T                                                    # (47, strip)
            S += wy @ (Wx.T @ vz.T).T if False else (wy @ (vz @ Wx))           # area-weighted sum
            A_nan += wy @ (nanm.astype(np.float64) @ Wx)                        # km2 of NaN 1 km cells (each cell = 1 km2)
            A_zero += wy @ ((v == 0).astype(np.float64) @ Wx)
            A_pos += wy @ ((v > 0).astype(np.float64) @ Wx)
            A_neg += wy @ ((v < 0).astype(np.float64) @ Wx)
            if de is not None:
                e = de.read(1, window=((r0, r1), (0, W))).astype(np.float64)
                Ext += wy @ (np.where(np.isnan(e), 0.0, e / 100.0) @ Wx)       # km2 of mapped organic soil
        if de is not None: de.close()
    tags = rasterio.open(src).tags()
    inside = S[1:46, 1:91]
    res = dict(source=src, tags=tags, grid=dict(width=W, height=H, transform=list(T)[:6], crs=crs.to_proj4()),
               counts=stats, global_sum_Mg=stats['total'], cells_sum_Mg=float(inside.sum()), outside_sum_Mg=float(S.sum() - inside.sum()),
               conservation_rel_err=abs(S.sum() - stats['total']) / max(1.0, abs(stats['total'])),
               outside_area_km2=float((A_nan + A_zero + A_pos + A_neg).sum() - (A_nan + A_zero + A_pos + A_neg)[1:46, 1:91].sum()),
               seconds=round(time.time() - t0, 1), peak_rss_MB=round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024, 1),
               cells={})
    for r in range(45):
        for c in range(90):
            R, C = r + 1, c + 1
            if A_pos[R, C] or A_nan[R, C] or A_neg[R, C] or (ext and Ext[R, C]):
                res['cells'][f'{r}_{c}'] = dict(sum_Mg=round(float(S[R, C]), 3), pos_km2=round(float(A_pos[R, C]), 3), nan_km2=round(float(A_nan[R, C]), 3),
                                                zero_km2=round(float(A_zero[R, C]), 3), neg_km2=round(float(A_neg[R, C]), 3),
                                                organic_km2=round(float(Ext[R, C]), 3) if ext else None)
    json.dump(res, open(out, 'w'), indent=0)
    print(json.dumps({k: res[k] for k in ('global_sum_Mg', 'cells_sum_Mg', 'outside_sum_Mg', 'conservation_rel_err', 'outside_area_km2', 'seconds', 'peak_rss_MB', 'counts')}))

if __name__ == '__main__':
    main()
