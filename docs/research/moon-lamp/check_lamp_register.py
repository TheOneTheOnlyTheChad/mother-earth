#!/usr/bin/env python3
"""Moon item 7 (LAMP), D6: finer registration check of the GDR south map against LOLA LDEM_75S_240M.

Chad's go (28 Nov 2026): bounded D6 assessment. Docs only; nothing drawn on a page.

Inputs (hash-pinned): the retained LAMP maps (albedo, quality) and LOLA LDEM_75S_240M V2.0
(3812 x 3812 LSB int16, 0.5 m per DN, 240 m polar stereographic, centred on 90 S).

Geometry. Both products are polar stereographic on a 1,737.4 km sphere at 240 m per pixel. For a
square grid of N pixels, 1-based sample I and line J (J = 1 is the first stored record):
    Px = (I - N/2 - 0.5) * 240,   Py = -(J - N/2 - 0.5) * 240,   LON = atan2(Px, Py)
This is LOLA's own DSMAP_POLAR.CAT (2022 revision) forward equation for the south (NS = -1), and it
is reading B for LAMP (N = 2501). LAMP's pole is a pixel centre (I = J = 1251); the DEM's pole is a
pixel corner (I = J = 1906.5). LAMP pixel (I, J) therefore lies at DEM fractional pixel
(I + 655.5, J + 655.5): the 120 m offset is grid registration (expected), handled here by bilinear
sampling of the DEM at LAMP pixel centres. It is not a measured displacement.

Step 0, DEM landmark check (the DEM transform is anchored, not assumed): under the documented reading
and seven wrong readings, the five IAU crater centres used in the LEND/LAMP assessments must sit in
depressions (ring 25-35 km mean height minus disc <= 8 km mean height).

Step 1, tiles (declared before scoring): 250 x 250 LAMP pixels (60 km), on a regular grid; a tile is
eligible if its centre lies between 80.5 S and 89 S, it lies wholly inside the array, and at least 90%
of its pixels are inside 80 S.

Step 2, features and scores over integer shifts (dx, dy) in -4..+4 pixels, comparing LAMP at (i, j)
with the DEM-derived field at (i + dx, j + dy) (positive dx = towards larger sample, dy = larger line):
  F1  mean DEM local relief (height minus its 41 x 41 pixel box mean, about 9.8 km) at pixels flagged
      as possible sunlit peaks (documented codes 4 and 6 only);
  F2  normalised cross-correlation of high-passed LAMP albedo (quality-0 finite pixels, minus their
      41 x 41 box mean) with high-passed DEM slope magnitude; the sign used is fixed in advance as the
      sign of the whole-cap zero-shift correlation.
Usability (declared): F1 needs >= 30 flagged pixels in the tile; F2 needs >= 80% valid albedo pixels.
A tile/feature result is USABLE only if (a) the best score is not on the window edge, (b) its
prominence z = (best - median) / (1.4826 * MAD) >= 4 over the 81 shifts, and (c) no other shift at
least 2 pixels away scores within 25% of (best - median) of the best (otherwise AMBIGUOUS).
Sub-pixel: a 3-point parabola on each axis through the integer peak, only for usable results.
Residual = the recovered (dx, dy) in metres (x 240); 0 means the documented transform aligns.

Outcome rules (from proposal rev 2 §5.4, fixed before running):
  PASS: for at least one feature, >= 5 usable tiles spanning >= 3 longitude quadrants, median residual
        <= 240 m and no usable tile beyond 480 m; where both features are usable on one tile they are
        reported side by side (agreement within 1 pixel is reported, not required for PASS).
  OFFSET FOUND: usable tiles agree on a consistent non-zero shift beyond 240 m.
  INCONCLUSIVE: otherwise.

Controls (the same pipeline): LAMP fields reflected (reading A: lines reversed), rotated 90 and 180
degrees about the pole, shifted by known amounts (+2,-3) and (+3,+1) pixels (expected recovery is
the negative of the applied shift... see 'expected' in the output), and shuffled tile pairings.

Post-hoc diagnostic (added after the declared run came out INCONCLUSIVE; reported separately and never
used for the outcome): with a wider +-6 pixel window, the per-tile peak positions (mode and counts) and
a pooled cap-wide score surface for F1 and F2, for the main reading and every control. It shows whether
any clustering of peaks moves with the known applied shifts (i.e. is tied to the ground) or not.

Usage: python3 -I check_lamp_register.py <dir with the retained files>
Needs numpy. Writes JSON to stdout. Exit 0 always (the outcome is in the JSON).
"""
import hashlib, json, math, sys
import numpy as np

D = sys.argv[1]
PIN = {
    'LAMP_80s_240mpp_lya_albed_01.img': '896aa35d377c46b68cc774047638b28451106e28e8a6aa67eb4aeca0358af2e2',
    'LAMP_80s_240mpp_lya_dqual_01.img': '3f071a9e8afbddc399b2523d6f3995994c9f7f26e27d0e5771de42e1a6ff2754',
    'ldem_75s_240m.img': 'd031efe2611b17dfbf3c158f5e15dc04cd5719349dcbf6384bb21fd97697c490',
}
RAW = {}
for f, h in PIN.items():
    b = open(D + '/' + f, 'rb').read()
    assert hashlib.sha256(b).hexdigest() == h, f
    RAW[f] = b
N, ND, S, R = 2501, 3812, 240.0, 1737400.0
A = np.frombuffer(RAW['LAMP_80s_240mpp_lya_albed_01.img'], '<f4').reshape(N, N).astype(np.float64)
Q = np.frombuffer(RAW['LAMP_80s_240mpp_lya_dqual_01.img'], '<f4').reshape(N, N)
assert len(RAW['ldem_75s_240m.img']) == ND * ND * 2
H = np.frombuffer(RAW['ldem_75s_240m.img'], '<i2').reshape(ND, ND).astype(np.float64) * 0.5
out = {'inputs': PIN}

def lat_of(px, py):
    return -90 + np.degrees(2 * np.arctan(0.5 * np.hypot(px, py) / R))

# ---------- Step 0: DEM landmark check ----------
FEAT = {'Cabeus': (-85.33, 317.87), 'Shoemaker': (-88.14, 45.91), 'Haworth': (-87.45, 354.83),
        'Faustini': (-87.18, 84.31), 'Amundsen': (-84.44, 83.07)}
def proj(lat, lon):  # documented south forward, inverted: geographic -> (Px, Py)
    r = 2 * R * math.tan(math.radians(90 + lat) / 2)
    return r * math.sin(math.radians(lon)), r * math.cos(math.radians(lon))
ID = np.arange(1, ND + 1)
gx = (ID - ND / 2 - 0.5) * S
GX, GY = np.meshgrid(gx, -gx)          # GX from sample I, GY = -(J - N/2 - 0.5)*S from line J (documented)
readings = {  # each maps a geographic (Px, Py) to the DEM's documented (Px, Py) plane under a reading
    'documented (LOLA DSMAP 2022, NS=-1)': lambda x, y: (x, y),
    'mirror lines (NS=+1, the 2011-style algebra)': lambda x, y: (x, -y),
    'mirror samples': lambda x, y: (-x, y),
    'rotate 180': lambda x, y: (-x, -y),
    'rotate +90': lambda x, y: (y, -x),
    'rotate -90': lambda x, y: (-y, x),
    'transpose': lambda x, y: (y, x),
    'anti-transpose': lambda x, y: (-y, -x),
}
def dem_at(px, py):
    i = px / S + ND / 2 + 0.5 - 1   # 0-based fractional sample
    j = -py / S + ND / 2 + 0.5 - 1  # 0-based fractional line
    return i, j
lm = {}
for name, f in readings.items():
    depths = {}
    for c, (la, lo) in FEAT.items():
        x, y = f(*proj(la, lo))
        i0, j0 = dem_at(x, y)
        ii, jj = np.meshgrid(np.arange(int(i0) - 160, int(i0) + 161), np.arange(int(j0) - 160, int(j0) + 161))
        ok = (ii >= 0) & (ii < ND) & (jj >= 0) & (jj < ND)
        d = np.hypot(ii - i0, jj - j0) * S / 1000
        hv = np.where(ok, H[np.clip(jj, 0, ND - 1), np.clip(ii, 0, ND - 1)], np.nan)
        depths[c] = round(float(np.nanmean(hv[(d >= 25) & (d <= 35)]) - np.nanmean(hv[d <= 8])), 1)
    lm[name] = {'depths_m': depths, 'mean_m': round(float(np.mean(list(depths.values()))), 1),
                'craters_depressed': int(sum(v > 0 for v in depths.values()))}
out['step0_dem_landmarks (ring 25-35 km minus disc 8 km)'] = lm
out['step0_best'] = max(lm, key=lambda k: lm[k]['mean_m'])
# the printed 2022 inverse for the south (R signed negative), checked against the forward at one point
la, lo = -85.0, 90.0
rs = 2 * R * math.tan(math.radians(90 - abs(la)) / 2) * -1
I_inv = rs * math.sin(math.radians(lo)) / S + ND / 2 + 0.5
x, y = proj(la, lo)
I_fwd = x / S + ND / 2 + 0.5
out['printed_inverse_check_at_85S_90E'] = {'I_from_printed_inverse': round(I_inv, 2), 'I_from_forward': round(I_fwd, 2),
                                          'consistent': abs(I_inv - I_fwd) < 1}

# ---------- DEM resampled at LAMP pixel centres (documented geometry, bilinear) ----------
off = (ND - N) / 2.0   # 655.5: LAMP 1-based I maps to DEM 1-based I + 655.5
lam = np.arange(N, dtype=np.float64)
dem0 = lam + off        # 0-based DEM fractional index of LAMP 0-based index
i0 = np.floor(dem0).astype(int); fr = dem0 - i0
Hx = H[:, i0] * (1 - fr) + H[:, i0 + 1] * fr
Hg = Hx[i0, :] * (1 - fr)[:, None] + Hx[i0 + 1, :] * fr[:, None]   # (N, N) DEM heights at LAMP pixel centres
out['dem_resample'] = {'offset_pixels': off, 'fraction': float(fr[0]), 'note': 'bilinear; half-pixel registration'}

def boxmean(a, w, r):
    a2 = np.where(w, a, 0.0); ww = w.astype(np.float64)
    def cs(z):
        c = np.cumsum(np.cumsum(np.pad(z, ((1, 0), (1, 0))), 0), 1)
        k = 2 * r + 1
        p = np.pad(c, ((r, r), (r, r)), mode='edge')
        return p[k:, k:] - p[:-k, k:] - p[k:, :-k] + p[:-k, :-k]
    s, n = cs(a2), cs(ww)
    with np.errstate(invalid='ignore', divide='ignore'):
        return s / n, n
allw = np.ones((N, N), bool)
relief = Hg - boxmean(Hg, allw, 20)[0]
gy_, gx_ = np.gradient(Hg, S)
slope = np.hypot(gx_, gy_)
slope_hp = slope - boxmean(slope, allw, 20)[0]
X1 = (np.arange(1, N + 1) - 1251) * S
XX, YY = np.meshgrid(X1, -X1)
LAT = lat_of(XX, YY); LON = np.degrees(np.arctan2(XX, YY)) % 360
inside = LAT <= -80

def lamp_fields(Aa, Qa):
    peak = np.isin(Qa, (4, 6))
    qual = np.isfinite(Aa) & (Qa == 0)
    m, _ = boxmean(np.where(qual, Aa, 0), qual, 20)
    hp = np.where(qual, Aa - m, np.nan)
    return peak, qual, hp

T, M = 250, 4
tiles = []
for tj in range(0, N - T + 1, T):
    for ti in range(0, N - T + 1, T):
        cj, ci = tj + T // 2, ti + T // 2
        la_c = LAT[cj, ci]
        if -89 <= la_c <= -80.5 and inside[tj:tj + T, ti:ti + T].mean() >= 0.9:
            tiles.append((tj, ti, round(float(la_c), 2), round(float(LON[cj, ci]), 1)))
out['tiles_eligible'] = len(tiles)

def score_maps(peak, qual, hp, sign, tj, ti, dj_t=0, di_t=0):
    """Scores over shifts for one LAMP tile (tj, ti) against the DEM tile offset by (dj_t, di_t)."""
    sl = (slice(tj + M, tj + T - M), slice(ti + M, ti + T - M))
    pk = peak[sl]; q = qual[sl]; h = hp[sl]
    f1 = np.full((9, 9), np.nan); f2 = np.full((9, 9), np.nan)
    n1 = int(pk.sum()); v2 = float(q.mean())
    for a, dy in enumerate(range(-4, 5)):
        for b, dx in enumerate(range(-4, 5)):
            ds = (slice(tj + dj_t + M + dy, tj + dj_t + T - M + dy), slice(ti + di_t + M + dx, ti + di_t + T - M + dx))
            rl = relief[ds]; sp = slope_hp[ds]
            if rl.shape != pk.shape:
                continue
            if n1:
                f1[a, b] = rl[pk].mean()
            if q.sum() > 100:
                x = h[q]; y = sp[q]
                x = x - x.mean(); y = y - y.mean()
                den = math.sqrt((x * x).sum() * (y * y).sum())
                f2[a, b] = sign * (x * y).sum() / den if den else np.nan
    return f1, f2, n1, v2

def judge(sc):
    if np.isnan(sc).any():
        return {'usable': False, 'why': 'incomplete window'}
    a, b = np.unravel_index(np.argmax(sc), sc.shape)
    best = sc[a, b]; med = np.median(sc); mad = 1.4826 * np.median(np.abs(sc - med))
    z = (best - med) / mad if mad > 0 else float('inf')
    res = {'peak_shift_px': [int(b - 4), int(a - 4)], 'z': round(float(z), 2)}
    if a in (0, 8) or b in (0, 8):
        res.update(usable=False, why='peak on window edge'); return res
    if z < 4:
        res.update(usable=False, why='low prominence'); return res
    yy, xx = np.mgrid[0:9, 0:9]
    far = np.hypot(yy - a, xx - b) >= 2
    if (sc[far] >= best - 0.25 * (best - med)).any():
        res.update(usable=False, why='ambiguous'); return res
    def para(m1, c0, p1):
        d = m1 - 2 * c0 + p1
        return 0.0 if d >= 0 else 0.5 * (m1 - p1) / d
    sx = (b - 4) + para(sc[a, b - 1], best, sc[a, b + 1])
    sy = (a - 4) + para(sc[a - 1, b], best, sc[a + 1, b])
    res.update(usable=True, shift_px=[round(float(sx), 3), round(float(sy), 3)],
               residual_m=round(float(math.hypot(sx, sy) * S), 1))
    return res

def run(Aa, Qa, label, shuffle=False):
    peak, qual, hp = lamp_fields(Aa, Qa)
    # fixed sign for F2 from the whole cap at zero shift
    m = qual & inside & np.isfinite(slope_hp)
    x = hp[m] - hp[m].mean(); y = slope_hp[m] - slope_hp[m].mean()
    sign = 1.0 if (x * y).sum() >= 0 else -1.0
    rows = []
    rng = np.random.default_rng(7)
    perm = rng.permutation(len(tiles)) if shuffle else np.arange(len(tiles))
    for k, (tj, ti, la_c, lo_c) in enumerate(tiles):
        oj, oi = tiles[perm[k]][0] - tj, tiles[perm[k]][1] - ti
        f1, f2, n1, v2 = score_maps(peak, qual, hp, sign, tj, ti, oj, oi)
        r = {'tile': [tj, ti], 'lat': la_c, 'lon': lo_c, 'quadrant': int(lo_c // 90), 'f1_flagged': n1, 'f2_valid': round(v2, 3)}
        r['F1'] = judge(f1) if n1 >= 30 else {'usable': False, 'why': 'fewer than 30 flagged pixels'}
        r['F2'] = judge(f2) if v2 >= 0.8 else {'usable': False, 'why': 'under 80% valid'}
        rows.append(r)
    summ = {'f2_sign': sign}
    for F in ('F1', 'F2'):
        us = [r for r in rows if r[F].get('usable')]
        quads = sorted({r['quadrant'] for r in us})
        res = [r[F]['residual_m'] for r in us]
        shifts = np.array([r[F]['shift_px'] for r in us]) if us else np.zeros((0, 2))
        s = {'usable_tiles': len(us), 'quadrants': quads,
             'median_residual_m': round(float(np.median(res)), 1) if res else None,
             'max_residual_m': round(float(max(res)), 1) if res else None,
             'median_shift_px': [round(float(v), 3) for v in np.median(shifts, axis=0)] if len(us) else None,
             'reasons_unusable': {}}
        for r in rows:
            if not r[F].get('usable'):
                s['reasons_unusable'][r[F]['why']] = s['reasons_unusable'].get(r[F]['why'], 0) + 1
        if len(us) >= 5 and len(quads) >= 3 and s['median_residual_m'] <= 240 and s['max_residual_m'] <= 480:
            s['outcome'] = 'PASS'
        elif len(us) >= 5 and len(quads) >= 3 and s['median_residual_m'] > 240:
            s['outcome'] = 'OFFSET FOUND?' if np.all(np.abs(shifts - np.median(shifts, 0)).max(1) <= 1) else 'INCONCLUSIVE (inconsistent shifts)'
        else:
            s['outcome'] = 'INCONCLUSIVE'
        summ[F] = s
    both = [r for r in rows if r['F1'].get('usable') and r['F2'].get('usable')]
    summ['both_usable_tiles'] = len(both)
    summ['both_agree_within_1px'] = int(sum(math.hypot(r['F1']['shift_px'][0] - r['F2']['shift_px'][0],
                                                      r['F1']['shift_px'][1] - r['F2']['shift_px'][1]) <= 1 for r in both))
    return {'label': label, 'summary': summ, 'tiles': rows}

main = run(A, Q, 'reading B (documented)')
out['main'] = main
def shifted(a, dx, dy, fill):
    b = np.full_like(a, fill)
    ys = slice(max(dy, 0), N + min(dy, 0)); yd = slice(max(-dy, 0), N + min(-dy, 0))
    xs = slice(max(dx, 0), N + min(dx, 0)); xd = slice(max(-dx, 0), N + min(-dx, 0))
    b[ys, xs] = a[yd, xd]
    return b
ctrls = {
    'reflected (reading A: lines reversed)': (A[::-1, :], Q[::-1, :]),
    'rotated 90': (np.rot90(A), np.rot90(Q)),
    'rotated 180': (np.rot90(A, 2), np.rot90(Q, 2)),
    'LAMP moved +2 samples, -3 lines (expect recovered shift (-2, +3))': (shifted(A, 2, -3, np.nan), shifted(Q, 2, -3, 1.0)),
    'LAMP moved +3 samples, +1 line (expect recovered shift (-3, -1))': (shifted(A, 3, 1, np.nan), shifted(Q, 3, 1, 1.0)),
}
out['controls'] = {}
for k, (Aa, Qa) in ctrls.items():
    r = run(np.ascontiguousarray(Aa), np.ascontiguousarray(Qa), k)
    out['controls'][k] = r['summary']
r = run(A, Q, 'shuffled tile pairings', shuffle=True)
out['controls']['shuffled tile pairings'] = r['summary']

# ---------- post-hoc diagnostic (not used for the outcome) ----------
W = 6
def diag(Aa, Qa, shuffle=False):
    peak, qual, hp = lamp_fields(Aa, Qa)
    rng = np.random.default_rng(7)
    perm = rng.permutation(len(tiles)) if shuffle else np.arange(len(tiles))
    modes = {'F1': [], 'F2': []}
    pool1 = np.zeros((2 * W + 1, 2 * W + 1)); n1t = 0
    pool2 = np.zeros((2 * W + 1, 2 * W + 1)); n2t = 0
    for k, (tj, ti, la_c, lo_c) in enumerate(tiles):
        oj, oi = tiles[perm[k]][0] - tj, tiles[perm[k]][1] - ti
        sl = (slice(tj + W, tj + T - W), slice(ti + W, ti + T - W))
        pk = peak[sl]; q = qual[sl]; h = hp[sl]
        s1 = np.full((2 * W + 1, 2 * W + 1), np.nan); s2 = s1.copy()
        for a, dy in enumerate(range(-W, W + 1)):
            for b, dx in enumerate(range(-W, W + 1)):
                ds = (slice(tj + oj + W + dy, tj + oj + T - W + dy), slice(ti + oi + W + dx, ti + oi + T - W + dx))
                rl = relief[ds]; sp = slope_hp[ds]
                if rl.shape != pk.shape: continue
                if pk.sum() >= 30: s1[a, b] = rl[pk].sum()
                if q.mean() >= 0.8:
                    x = h[q] - h[q].mean(); y = sp[q] - sp[q].mean()
                    s2[a, b] = (x * y).sum() / math.sqrt((x * x).sum() * (y * y).sum())
        for F, sc in (('F1', s1), ('F2', s2)):
            if not np.isnan(sc).any():
                a, b = np.unravel_index(np.argmax(sc), sc.shape)
                modes[F].append((int(b - W), int(a - W)))
        if not np.isnan(s1).any(): pool1 += s1; n1t += 1
        if not np.isnan(s2).any(): pool2 += s2; n2t += 1
    res = {}
    for F, pool, n in (('F1', pool1, n1t), ('F2', pool2, n2t)):
        from collections import Counter
        c = Counter(modes[F]).most_common(3)
        a, b = np.unravel_index(np.argmax(pool), pool.shape)
        res[F] = {'tiles': len(modes[F]), 'top_tile_peaks': [[list(k), v] for k, v in c],
                  'pooled_peak_px': [int(b - W), int(a - W)], 'pooled_tiles': n}
    return res
out['posthoc_diagnostic_window_6'] = {'main': diag(A, Q)}
# context (post hoc): zero-shift correlation of high-passed albedo with the two signed slope components
pk_, ql_, hp_ = lamp_fields(A, Q)
mm = ql_ & inside
def corr(u, v):
    u = u - u.mean(); v = v - v.mean(); return round(float((u * v).sum() / math.sqrt((u * u).sum() * (v * v).sum())), 4)
gxh = gx_ - boxmean(gx_, allw, 20)[0]; gyh = gy_ - boxmean(gy_, allw, 20)[0]
out['posthoc_albedo_vs_slope_components_zero_shift'] = {
    'with_slope_magnitude': corr(hp_[mm], slope_hp[mm]),
    'with_dH_dsample (towards +x)': corr(hp_[mm], gxh[mm]),
    'with_dH_dline (towards later records)': corr(hp_[mm], gyh[mm]),
    'note': 'a directional (signed-slope) relation can move a magnitude-correlation peak without any misregistration'}
for k, (Aa, Qa) in ctrls.items():
    out['posthoc_diagnostic_window_6'][k] = diag(np.ascontiguousarray(Aa), np.ascontiguousarray(Qa))
out['posthoc_diagnostic_window_6']['shuffled tile pairings'] = diag(A, Q, shuffle=True)
print(json.dumps(out, indent=1))
