#!/usr/bin/env python3
"""Moon item 7 (LAMP), bounded assessment step 1.

Reads the three retained south-polar cumulative LAMP GDR maps
(Lyman-alpha albedo, its data-quality map and its "error" map) using the
layout taken from their own PDS3 labels inside the retained documents JSON
(no hand-typed sizes), and reports what the files hold.

Usage: python3 -I assess_lamp_1.py <dir with the four retained files>
Docs only. Nothing here is drawn on any page. Needs numpy.
"""
import base64, gzip, hashlib, json, math, re, sys, zlib
import numpy as np

D = sys.argv[1]
FILES = {
    'docs': ('lamp-docs-labels-2026-11-28.json', 'ac21b5530c3f63e462c3510a57ee55ec1dbe5b7082dde714810a84634d4708b1'),
    'albed': ('LAMP_80s_240mpp_lya_albed_01.img', '896aa35d377c46b68cc774047638b28451106e28e8a6aa67eb4aeca0358af2e2'),
    'dqual': ('LAMP_80s_240mpp_lya_dqual_01.img', '3f071a9e8afbddc399b2523d6f3995994c9f7f26e27d0e5771de42e1a6ff2754'),
    'error': ('LAMP_80s_240mpp_lya_error_01.img', '8300ecb4262ee3c747524b629c1fff2d1e0bbb94fef25bd0adace1250d415141'),
}
for k, (f, h) in FILES.items():
    assert hashlib.sha256(open(D + '/' + f, 'rb').read()).hexdigest() == h, f + ': hash differs from its checkpoint'

docs = {i['url'].rsplit('/', 1)[1]: base64.b64decode(i['b64']) for i in json.load(open(D + '/' + FILES['docs'][0]))['items']}
md5list = docs['LROLAM_2001_md5.txt'].decode('ascii')

def label(img):
    t = docs[img.replace('.img', '.lbl')].decode('ascii')
    g = lambda k: re.search(r'^\s*' + k + r'\s*=\s*"?([^"\r\n]+?)"?\s*(<[^>]*>)?\s*$', t, re.M).group(1).strip()
    desc = re.search(r'DESCRIPTION\s*=\s*"(.*?)"', t, re.S).group(1)
    return dict(lines=int(g('LINES')), samples=int(g('LINE_SAMPLES')), bits=int(g('SAMPLE_BITS')),
                type=g('SAMPLE_TYPE'), scale=float(g('SCALING_FACTOR')), offset=float(g('OFFSET')),
                map_scale=float(g('MAP_SCALE')), lproj=float(g('LINE_PROJECTION_OFFSET')),
                sproj=float(g('SAMPLE_PROJECTION_OFFSET')), radius_km=float(g('A_AXIS_RADIUS')),
                centre_lat=float(g('CENTER_LATITUDE')), start=g('START_TIME'), stop=g('STOP_TIME'),
                wmin=g('MINIMUM_WAVELENGTH'), wmax=g('MAXIMUM_WAVELENGTH'),
                description=' '.join(desc.split()), frame=g('COORDINATE_SYSTEM_NAME'))

out = {'inputs': {k: v[1] for k, v in FILES.items()}}
maps, labs = {}, {}
for k in ('albed', 'dqual', 'error'):
    L = label(FILES[k][0]); labs[k] = L
    assert L['type'] == 'PC_REAL' and L['bits'] == 32 and L['scale'] == 1.0 and L['offset'] == 0.0
    raw = open(D + '/' + FILES[k][0], 'rb').read()
    assert len(raw) == L['lines'] * L['samples'] * 4
    md5 = hashlib.md5(raw).hexdigest()
    assert ('%s  ./DATA/' % md5) in md5list and FILES[k][0] in md5list.split(md5)[1].split('\n')[0], k + ': md5 not in archive list'
    maps[k] = np.frombuffer(raw, '<f4').reshape(L['lines'], L['samples'])  # row j-1 = line J (first line first)
out['labels'] = labs
N = labs['albed']['lines']; S = labs['albed']['map_scale']; R = labs['albed']['radius_km'] * 1000

# --- projection (DSMAP_POLAR.CAT). Its line/sample -> lat/lon equations; its inverse as printed
#     omits R in X = SIN(LON), Y = COS(LON) (should be R*SIN, R*COS) - checked here, not assumed.
I = np.arange(1, N + 1)
X = (I - N / 2 - 0.5) * S
XX, YY = np.meshgrid(X, X)            # XX varies with sample I, YY with line J (J = array row + 1)
RR = np.hypot(XX, YY)
LAT = -90 + np.degrees(2 * np.arctan(0.5 * RR / R))
# Orientation: reading B from check_lamp_frame.py (the printed reading A fails an independent
# height test). B: LON = ATAN2(X, -Y), i.e. the file's first record lies towards longitude 0.
LON = np.degrees(np.arctan2(XX, -YY)) % 360
LON_A = np.degrees(np.arctan2(XX, YY)) % 360   # as printed, kept only for the comparison below
def inv(lat, lon):                      # inverse for reading B, R included
    r = 2 * R * math.tan(math.radians(90 + lat) / 2)
    i = r * math.sin(math.radians(lon)) / S + N / 2 + 0.5
    j = -r * math.cos(math.radians(lon)) / S + N / 2 + 0.5
    return int(round(i)), int(round(j))
centre = inv(-90, 0)
rt = [(la, lo, inv(la, lo)) for la, lo in ((-85, 0), (-85, 90), (-88.14, 45.91), (-80.5, 200))]
rt_err = max(abs(LAT[j - 1, i - 1] - la) for la, lo, (i, j) in rt)
out['projection'] = {
    'centre_pixel_for_pole (I,J)': centre,
    'label_projection_offsets': [labs['albed']['sproj'], labs['albed']['lproj']],
    'edge_mid_lat': round(float(LAT[0, N // 2]), 3), 'corner_lat': round(float(LAT[0, 0]), 3),
    'dsmap_states': 'edges 80.13, corners 76.08',
    'roundtrip_max_lat_error_deg': round(float(rt_err), 4),
    'roundtrip_lon_check': [(la, lo, round(float(LON[j - 1, i - 1]), 3)) for la, lo, (i, j) in rt],
    'note': 'printed inverse X=SIN(LON) lacks R; with R the forward and inverse agree. Pixel (1251,1251) is the pole '
            '(X=(I-N/2-0.5)*S is 0 at I=1251 with real division, N=2501). Longitude uses reading B (check_lamp_frame.py).',
}

A, Q, E = maps['albed'], maps['dqual'], maps['error']
fin = np.isfinite(A)
qv, qc = np.unique(Q[np.isfinite(Q)], return_counts=True)
out['dqual_values'] = {str(float(v)): int(c) for v, c in zip(qv, qc)}
out['dqual_nan'] = int(np.isnan(Q).sum())
out['albed'] = {'finite': int(fin.sum()), 'nan': int((~fin).sum()), 'negative': int((A[fin] < 0).sum()),
                'min': float(A[fin].min()), 'max': float(A[fin].max())}
out['error'] = {'finite': int(np.isfinite(E).sum()), 'nan': int(np.isnan(E).sum()),
                'min': float(np.nanmin(E)), 'max': float(np.nanmax(E)),
                'pct_1_50_99': [float(x) for x in np.nanpercentile(E, [1, 50, 99])]}
# flag 1 = NaN: does it match albedo NaN?
out['flag1_vs_albedo_nan'] = {'q1': int((Q == 1).sum()), 'albedo_nan': int((~fin).sum()),
                              'q1_and_nan': int(((Q == 1) & ~fin).sum())}
# flag 2 = SNR < 3: if the "error" map is SNR as its label says, (Q has bit 2) should equal (E < 3)
bit2 = np.isin(Q, (2, 6)); lt3 = np.isfinite(E) & (E < 3)
out['flag2_vs_error_lt3'] = {'bit2': int(bit2.sum()), 'error_lt3': int(lt3.sum()), 'both': int((bit2 & lt3).sum()),
                             'bit2_only': int((bit2 & ~lt3).sum()), 'lt3_only': int((lt3 & ~bit2).sum())}
# if instead error were a noise amplitude in albedo units, A/E would be the SNR; test that reading too
with np.errstate(divide='ignore', invalid='ignore'):
    snr_alt = A / E
alt = np.isfinite(snr_alt) & (snr_alt < 3)
out['flag2_vs_albedo_over_error_lt3'] = {'albedo/error<3': int(alt.sum()), 'both': int((bit2 & alt).sum())}

# coverage by latitude ring inside the 80-90 S circle
rings = {}
for a in range(80, 90):
    m = (LAT <= -a) & (LAT > -(a + 1))
    good = m & (Q == 0)
    rings['%d-%dS' % (a, a + 1)] = {'pixels': int(m.sum()), 'finite': round(float((m & fin).sum() / m.sum()), 4),
                                   'flag0': round(float(good.sum() / m.sum()), 4)}
out['rings'] = rings
inside = LAT <= -80
out['inside_80S'] = {'pixels': int(inside.sum()), 'outside_circle_pixels': int((~inside).sum()),
                     'outside_finite': int((~inside & fin).sum())}

# albedo distribution by quality class (inside 80 S)
def pct(m):
    v = A[m & fin]
    return {'n': int(v.size), 'p01_p50_p99': [round(float(x), 5) for x in np.percentile(v, [1, 50, 99])] if v.size else None,
            'above_0.2': int((v > 0.2).sum()), 'negative': int((v < 0).sum())}
out['albedo_by_flag_inside_80S'] = {str(int(f)): pct(inside & (Q == f)) for f in (0, 2, 4, 6)}

# five craters, IAU Gazetteer centres as recorded in the LEND assessment (read 27 Nov 2026); descriptive only
FEAT = {'Cabeus': (-85.33, 317.87), 'Shoemaker': (-88.14, 45.91), 'Haworth': (-87.45, 354.83),
        'Faustini': (-87.18, 84.31), 'Amundsen': (-84.44, 83.07)}
def gc_km(la1, lo1, la2, lo2):
    la1, lo1, la2, lo2 = map(np.radians, (la1, lo1, la2, lo2))
    c = np.sin(la1) * np.sin(la2) + np.cos(la1) * np.cos(la2) * np.cos(lo1 - lo2)
    return R / 1000 * np.arccos(np.clip(c, -1, 1))
def disc_median(la, lo, rk, L=None):
    L = LON if L is None else L
    d = gc_km(LAT, L, la, lo) <= rk
    m = d & (Q == 0) & fin
    return (float(np.median(A[m])) if m.sum() else None), int(m.sum()), int(d.sum())
feats = {}
for name, (la, lo) in FEAT.items():
    med, n, tot = disc_median(la, lo, 10)
    ctl = []
    for k in range(24):
        clo = (lo + 15 * k) % 360
        if gc_km(la, lo, la, clo) < 40: continue
        cm, cn, _ = disc_median(la, clo, 10)
        if cm is not None and cn > 0.5 * tot: ctl.append(cm)
    feats[name] = {'centre': [la, lo], 'disc_10km_median_flag0': round(med, 5) if med else None,
                   'flag0_pixels': n, 'disc_pixels': tot, 'controls_n': len(ctl),
                   'control_median_of_medians': round(float(np.median(ctl)), 5) if ctl else None,
                   'controls_at_or_below': int(sum(c <= med for c in ctl)) if med and ctl else None}
    # the same disc read with the printed orientation A (wrong by check_lamp_frame.py), for comparison only
    mm, mn, _ = disc_median(la, lo, 10, LON_A)
    feats[name]['disc_median_if_read_as_printed_A'] = round(mm, 5) if mm else None
out['craters_10km'] = feats

# payload sizes for display options (quantised to 8 bits on a fixed scale; 255 = not shown)
def q8(arr, ok, lo_v, hi_v):
    b = np.full(arr.shape, 255, np.uint8)
    v = np.clip((arr - lo_v) / (hi_v - lo_v), 0, 1)
    b[ok] = np.round(v[ok] * 254).astype(np.uint8)
    return b
ok = inside & (Q == 0) & fin
sizes = {}
for f in (1, 2, 4, 8):
    n = N // f
    a = A[:n * f, :n * f].reshape(n, f, n, f)
    okb = ok[:n * f, :n * f].reshape(n, f, n, f)
    with np.errstate(invalid='ignore'):
        mean = np.where(okb, a, 0).sum((1, 3)) / np.maximum(okb.sum((1, 3)), 1)
    keep = okb.sum((1, 3)) >= (f * f + 1) // 2
    b = q8(mean, keep, 0.0, 0.08)
    cap = LAT[:n * f, :n * f].reshape(n, f, n, f).mean((1, 3)) <= -80
    sizes['%dm' % (240 * f)] = {'grid': n, 'raw_bytes': int(b.size), 'gzip9': len(gzip.compress(b.tobytes(), 9, mtime=0)),
                               'zlib9': len(zlib.compress(b.tobytes(), 9)),
                               'cells_centred_inside_80S': int(cap.sum()), 'shown_inside_80S': int((cap & keep).sum()),
                               'rule': 'mean of quality-0 finite pixels; shown if at least half of the %d pixels qualify' % (f * f)}
out['payload_8bit_0_to_0.08'] = sizes
negm = fin & (A < 0)
out['negatives_by_flag'] = {str(float(v)): int(c) for v, c in zip(*np.unique(Q[negm], return_counts=True))}
badm = inside & (Q != 0)
out['flagged_inside_80S_by_30deg_lon'] = np.histogram(LON[badm], bins=12, range=(0, 360))[0].tolist()
out['shown_240m_inside_80S'] = {'quality0_finite': int(ok.sum()), 'of': int(inside.sum())}
out['totals'] = {'map_bytes': N * N * 4, 'volume_maps': 694, 'volume_bytes_maps': 694 * N * N * 4}
print(json.dumps(out, indent=1))
