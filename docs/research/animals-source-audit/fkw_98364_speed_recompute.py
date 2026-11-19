"""Mother Earth — research script (read-only): recompute ATN's speed test for false killer whale ptt 98364 with the
ACTUAL implementation (ioos_qc.argo.speed_test) and compare with the flags stored in the source file.

Input: the source netCDF, not in the repo.
  atn_98364_false-killer-whale_trajectory_20131023-20140223.nc
  sha256 9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6  (the script refuses any other file)
Run:  python3 -I fkw_98364_speed_recompute.py <file.nc> [out.json]
Prints and writes a summary: package versions, agreement counts, every mismatching row with its inputs and the
full-precision speed, a threshold sensitivity table, and gaps/speeds among retained rows.
It proves what THIS version of ioos_qc gives on this file. It does not identify the version ATN ran in 2022 or 2025."""
import hashlib, json, sys, importlib.metadata as md
import numpy as np, netCDF4
from ioos_qc import argo
from geographiclib.geodesic import Geodesic
PIN = '9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6'
SUSPECT, FAIL = 8.0, 10.0          # ATN "Quality Control Protocols" page, read 19 Nov 2026 (no version or revision date on the page)
path = sys.argv[1]; raw = open(path, 'rb').read(); sha = hashlib.sha256(raw).hexdigest()
if sha != PIN: sys.exit(f'STOPPED: input sha256 {sha} is not the pinned file')
ds = netCDF4.Dataset(path); ds.set_auto_mask(False)
tv = ds.variables['time']; t_raw = tv[:]; lat = ds.variables['lat'][:]; lon = ds.variables['lon'][:]
file_speed = ds.variables['qartod_speed_flag'][:].astype(int); roll = ds.variables['qartod_rollup_flag'][:].astype(int)
n = len(t_raw)
# times exactly as stored (seconds since the file's epoch) turned into datetime64 the way the file states them
times = netCDF4.num2date(t_raw, tv.units, only_use_cftime_datetimes=False, only_use_python_datetimes=True)
t64 = np.array([np.datetime64(x.replace(tzinfo=None), 'ns') for x in times])
mine = np.asarray(argo.speed_test(lon=lon, lat=lat, tinp=t64, suspect_threshold=SUSPECT, fail_threshold=FAIL)).astype(int)
# full-precision speed per row, the same arithmetic as the package: WGS84 geodesic distance / whole seconds
def step(i, j):
    d = Geodesic.WGS84.Inverse(float(lat[i]), float(lon[i]), float(lat[j]), float(lon[j]))['s12']
    dt = float((t64[j] - t64[i]).astype('timedelta64[s]').astype(float)); return d, dt, (d / dt if dt else (float('inf') if d else float('nan')))
rows = [None] + [step(i - 1, i) for i in range(1, n)]
out = {'input': {'bytes': len(raw), 'sha256': sha, 'rows': n, 'time_units': tv.units, 'time_dtype': str(t_raw.dtype), 'lat_dtype': str(lat.dtype), 'lon_dtype': str(lon.dtype)},
       'versions': {p: md.version(p) for p in ('ioos_qc', 'geographiclib', 'numpy', 'netCDF4')}, 'python': sys.version.split()[0],
       'thresholds_m_per_s': {'suspect_over': SUSPECT, 'fail_over': FAIL},
       'file_speed_flag_counts': {str(k): int((file_speed == k).sum()) for k in (1, 2, 3, 4, 9)},
       'recomputed_flag_counts': {str(k): int((mine == k).sum()) for k in (1, 2, 3, 4, 9)},
       'rows_equal': int((mine == file_speed).sum()), 'rows_different': int((mine != file_speed).sum()), 'mismatches': []}
for i in np.where(mine != file_speed)[0]:
    d, dt, v = rows[i]
    out['mismatches'].append({'row_index_0_based': int(i), 'file_flag': int(file_speed[i]), 'recomputed_flag': int(mine[i]),
        'prev': {'time': str(t64[i - 1]), 'time_raw': repr(float(t_raw[i - 1])), 'lat': repr(float(lat[i - 1])), 'lon': repr(float(lon[i - 1]))},
        'this': {'time': str(t64[i]), 'time_raw': repr(float(t_raw[i])), 'lat': repr(float(lat[i])), 'lon': repr(float(lon[i]))},
        'geodesic_distance_m': repr(d), 'whole_seconds': dt, 'raw_seconds_difference': repr(float(t_raw[i]) - float(t_raw[i - 1])), 'speed_m_per_s': repr(v),
        'speed_if_spherical_6371km': repr(float(2 * 6371000.0 * np.arcsin(np.sqrt(np.sin(np.radians(lat[i] - lat[i - 1]) / 2) ** 2 + np.cos(np.radians(lat[i - 1])) * np.cos(np.radians(lat[i])) * np.sin(np.radians(lon[i] - lon[i - 1]) / 2) ** 2))) / dt)})
# rows where a spherical-earth distance (radius 6,371,008.8 m, used in our first, hand-written recomputation) would give a different flag
def sph(i, j, R=6371008.8):
    p1, p2 = np.radians(float(lat[i])), np.radians(float(lat[j])); dl = np.radians(float(lon[j]) - float(lon[i]))
    return 2 * R * np.arcsin(min(1.0, np.sqrt(np.sin((p2 - p1) / 2) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dl / 2) ** 2)))
out['rows_where_a_spherical_distance_changes_the_flag'] = []
for i in range(1, n):
    d, dt, v = rows[i]
    if not dt: continue
    vs = sph(i - 1, i) / dt; f = lambda x: 4 if x > FAIL else 3 if x > SUSPECT else 1
    if f(vs) != f(v): out['rows_where_a_spherical_distance_changes_the_flag'].append({'row_index_0_based': i, 'file_flag': int(file_speed[i]),
        'prev': {'time': str(t64[i - 1]), 'lat': repr(float(lat[i - 1])), 'lon': repr(float(lon[i - 1]))}, 'this': {'time': str(t64[i]), 'lat': repr(float(lat[i])), 'lon': repr(float(lon[i]))},
        'whole_seconds': dt, 'wgs84_geodesic_distance_m': repr(d), 'wgs84_speed_m_per_s': repr(v), 'wgs84_flag': f(v), 'spherical_distance_m': repr(float(sph(i - 1, i))), 'spherical_speed_m_per_s': repr(float(vs)), 'spherical_flag': f(vs)})
# rows nearest each threshold, so the margin of every decision is visible
v_all = np.array([np.nan] + [r[2] for r in rows[1:]])
for name, thr in (('suspect', SUSPECT), ('fail', FAIL)):
    order = np.argsort(np.abs(np.where(np.isfinite(v_all), v_all, 1e9) - thr))[:4]
    out[f'rows_nearest_{name}_threshold'] = [{'row': int(i), 'speed_m_per_s': repr(float(v_all[i])), 'file_flag': int(file_speed[i]), 'recomputed_flag': int(mine[i])} for i in order]
out['same_time_as_previous_row'] = {'rows': int(sum(1 for r in rows[1:] if r[1] == 0)), 'of_which_file_flag_fail': int(sum(1 for i in range(1, n) if rows[i][1] == 0 and file_speed[i] == 4))}
# retained rows (roll-up PASS): steps between retained neighbours, and gaps
keep = np.where(roll == 1)[0]; ks = [step(a, b) for a, b in zip(keep[:-1], keep[1:])]; kv = np.array([s[2] for s in ks]); kg = np.array([s[1] for s in ks])
out['rollup_pass_rows'] = {'rows': int(len(keep)), 'steps': int(len(ks)), 'steps_over_8': int((kv > 8).sum()), 'steps_over_10': int((kv > 10).sum()), 'fastest_m_per_s': repr(float(kv.max())),
    'gap_median_h': round(float(np.median(kg)) / 3600, 2), 'gaps_over_10h': int((kg > 36000).sum()), 'gaps_over_24h': int((kg > 86400).sum()), 'gaps_over_72h': int((kg > 259200).sum()), 'longest_gap_h': round(float(kg.max()) / 3600, 1)}
txt = json.dumps(out, indent=1); print(txt)
if len(sys.argv) > 2: open(sys.argv[2], 'w').write(txt + '\n')
