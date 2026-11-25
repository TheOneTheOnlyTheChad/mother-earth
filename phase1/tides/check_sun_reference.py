"""Tides: frame-specific checks of the pinned Sun reference (proposal rev 2, T2; GPT's first-build review R4.2).

  python3 -I phase1/tides/check_sun_reference.py            print the evidence as JSON
  python3 -I phase1/tides/check_sun_reference.py --check    exit 1 unless the stored evidence file matches and every limit holds

Two checks, both on the HELD files, no network:
 1. ORIENTATION. Dark spots are found in the original SDO picture (luminance below 0.85 of a 31-pixel median), and each spot's
    centre is turned into heliographic latitude and longitude with the SAME disc fit and B0 the page used (SOURCE.json),
    assuming solar north up and west to the right. They are compared with NOAA SWPC Solar Region Summary 329 (issued 25 Nov
    2026 00:30 UTC, positions valid 24 Nov 24:00 UTC), moved forward 14 h to the picture's file-updated time with the
    Snodgrass-Ulrich differential rotation rate. A mirrored or upside-down picture would put the regions in other quadrants.
    Limit: the picture's observation time is not known (only SDO's file-updated time); 1 h earlier moves the prediction by
    about 0.55 degrees of longitude.
 2. MASK EDGE. The wrapped texture is projected again here, independently of sunglobe.js, and compared texel by texel with the
    held JPEG: where the picture is used, no source pixel beyond 0.97 of the radius is sampled; elsewhere the texture is the
    plain colour and stripes, apart from JPEG spill along the edge.
Needs numpy, scipy, Pillow."""
import json, math, sys, hashlib, pathlib, re
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = json.loads((ROOT / 'assets/tides/SOURCE.json').read_text())
sun = next(i for i in SRC['images'] if i['body'] == 'Sun')
fit, b0 = sun['transform']['disc_fit'], math.radians(sun['transform']['b0_deg'])
cx, cy, R = fit['cx'], fit['cy'], fit['R']
EVID = ROOT / 'docs/research/tides/sun-reference-check-2026-11-25.json'
SRS = ROOT / 'docs/research/tides/swpc-srs-329-2026-11-25.txt'
LIM = {'lat_deg': 1.5, 'lon_deg': 3.0}

def hg(px, py):
    x = (px - cx) / R; y = (cy - py) / R; z = math.sqrt(max(0.0, 1 - x * x - y * y))
    return math.degrees(math.asin(y * math.cos(b0) + z * math.sin(b0))), math.degrees(math.atan2(x, z * math.cos(b0) - y * math.sin(b0)))

def rate(lat):   # synodic degrees a day: Snodgrass & Ulrich (1990) sidereal rate minus Earth's orbital motion
    s = math.sin(math.radians(lat)) ** 2
    return 14.71 - 2.39 * s - 1.78 * s * s - 0.9856

def run():
    srs_text = SRS.read_text()
    regions = [(m.group(1), (1 if m.group(2) == 'N' else -1) * int(m.group(3)), (1 if m.group(4) == 'W' else -1) * int(m.group(5)))
               for m in re.finditer(r'^(\d{4}) ([NS])(\d\d)([EW])(\d\d)\s', srs_text, re.M)]
    orig = ROOT / sun['original']['path']
    L = np.asarray(Image.open(orig).convert('RGB')).astype(float).max(axis=2)
    H, W = L.shape; yy, xx = np.mgrid[0:H, 0:W]; rho = np.hypot(xx - cx, yy - cy) / R
    rel = np.where(rho < 0.95, L / np.maximum(ndimage.median_filter(L, size=31), 1), 1.0)
    lab, n = ndimage.label(rel < 0.85); spots = []
    for k in range(1, n + 1):
        m = lab == k
        if m.sum() < 3: continue
        py, px = np.array(np.nonzero(m)).mean(axis=1); la, lo = hg(px, py)
        spots.append({'pixels': int(m.sum()), 'x': round(float(px), 1), 'y': round(float(py), 1), 'lat': round(la, 2), 'lon_west': round(lo, 2)})
    hours = (14 + 0 / 60)   # 24 Nov 24:00 UTC to the file-updated time 25 Nov 14:00:06 UTC
    match = []
    for num, lat, lon in regions:
        pl = lon + rate(lat) * hours / 24
        best = min(spots, key=lambda s: math.hypot(s['lat'] - lat, s['lon_west'] - pl)) if spots else None
        match.append({'region': num, 'srs_lat': lat, 'srs_lon_west': lon, 'predicted_lon_west': round(pl, 2),
                      'found': best, 'd_lat': round(best['lat'] - lat, 2) if best else None, 'd_lon': round(best['lon_west'] - pl, 2) if best else None})
    # mask edge
    tex = np.asarray(Image.open(ROOT / sun['path']).convert('RGB')).astype(float); src = np.asarray(Image.open(orig).convert('RGB')).astype(float)
    TH, TW = tex.shape[:2]; j, i = np.mgrid[0:TH, 0:TW]
    lat = np.radians(90 - (j + .5) / TH * 180); lon = np.radians((i + .5) / TW * 360 - 180)
    cl, sl = np.cos(lat), np.sin(lat); cb, sb = math.cos(b0), math.sin(b0)
    z = sl * sb + cl * np.cos(lon) * cb; x = cl * np.sin(lon); y = sl * cb - cl * np.cos(lon) * sb
    seen = (z > 0) & (x * x + y * y <= 0.97 ** 2)
    px = np.round(cx + R * x).astype(int); py = np.round(cy - R * y).astype(int); okp = seen & (px >= 0) & (py >= 0) & (px < src.shape[1]) & (py < src.shape[0])
    exp = np.zeros_like(tex); exp[...] = [38, 43, 51]; exp[(((i + j * 2) & 31) < 3) & ~seen] = [58, 64, 74]; exp[okp] = src[py[okp], px[okp]]
    d = np.abs(tex - exp).mean(axis=2); bright = (~seen) & (tex.max(axis=2) > 110); near = ndimage.binary_dilation(seen, iterations=4)   # stripes are (58, 64, 74); JPEG error reaches about 91 on them; near = ndimage.binary_dilation(seen, iterations=4)
    mask = {'max_radius_sampled': round(float(np.hypot(x[okp], y[okp]).max()), 5), 'mean_abs_diff_used': round(float(d[seen].mean()), 2),
            'mean_abs_diff_plain': round(float(d[~seen].mean()), 2), 'bright_plain_texels': int(bright.sum()), 'bright_plain_texels_beyond_4_of_edge': int((bright & ~near).sum())}
    return {'checked': 'held files only, no network', 'original_sha256': hashlib.sha256(orig.read_bytes()).hexdigest(),
            'texture_sha256': hashlib.sha256((ROOT / sun['path']).read_bytes()).hexdigest(), 'srs_sha256': hashlib.sha256(SRS.read_bytes()).hexdigest(),
            'srs': 'NOAA SWPC Solar Region Summary 329, issued 2026-11-25 00:30 UTC, locations valid 2026-11-24 24:00 UTC (services.swpc.noaa.gov/text/srs.txt, read 2026-11-25 15:12 UTC)',
            'advance_hours': hours, 'limits_deg': LIM, 'spots_found': spots, 'regions': match, 'mask': mask}

def verdict(r):
    bad = []
    for m in r['regions']:
        if not m['found'] or abs(m['d_lat']) > LIM['lat_deg'] or abs(m['d_lon']) > LIM['lon_deg']: bad.append('region ' + m['region'] + ' not matched within the limits')
    k = r['mask']
    if k['max_radius_sampled'] > 0.97 + 1e-9: bad.append('a source pixel beyond 0.97 of the radius is used')
    if k['bright_plain_texels_beyond_4_of_edge'] > 0: bad.append('bright texels in the plain part away from the edge')
    if k['mean_abs_diff_used'] > 3 or k['mean_abs_diff_plain'] > 3: bad.append('texture differs from the independent projection')
    return bad

r = run(); bad = verdict(r)
if '--check' in sys.argv:
    stored = json.loads(EVID.read_text()) if EVID.exists() else None
    if stored != json.loads(json.dumps(r)): bad.append('stored evidence differs from a fresh run: ' + str(EVID.relative_to(ROOT)))
    for b in bad: print('DIFFERENT  ' + b)
    print('sun reference: ' + ('FAIL' if bad else 'orientation and mask checks pass; stored evidence matches')); sys.exit(1 if bad else 0)
r['verdict'] = 'pass' if not bad else bad
print(json.dumps(r, indent=1))
