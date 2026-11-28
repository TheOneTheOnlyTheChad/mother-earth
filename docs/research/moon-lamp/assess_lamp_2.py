#!/usr/bin/env python3
"""Moon item 7 (LAMP), rev 2 evidence (28 Nov 2026): numeric format, support states, outliers and
grid origin, answering GPT's R3 and R4 on proposal rev 1.

Reads the three retained south-polar cumulative maps (hash-checked), applies reading B, and measures:
- R4 grid: what cropping 2501 -> 2500 drops inside the 80 S circle; the padded 2504 alternative; the
  reduced-grid origin and the pole's fractional index; the no-source wedges between the square's edge
  and the 80 S circle;
- R3 states: every 960 m cell classified by its support (inside-cap source pixels, qualifying pixels);
- R3 numeric: a uint16 plane of the mean in integer thousandths (half away from zero, from the float64
  mean) checked against Python Decimal ROUND_HALF_UP for every shown cell; the 8-bit colour route of
  rev 1 compared; measured sizes;
- R3 outliers: quality-0 finite native values above 0.2 and above 1, their SNR and their distance to the
  nearest documented sunlit-peak code (4 or 6); 960 m means above 0.08 and above 1; what a plausibility
  mask would change (counted, not adopted).

Usage: python3 -I assess_lamp_2.py <dir with the retained files>
Docs only. Nothing here is drawn on any page. Needs numpy.
"""
import gzip, hashlib, json, sys
from decimal import Decimal, ROUND_HALF_UP
import numpy as np

D = sys.argv[1]
FILES = {
    'albed': ('LAMP_80s_240mpp_lya_albed_01.img', '896aa35d377c46b68cc774047638b28451106e28e8a6aa67eb4aeca0358af2e2'),
    'dqual': ('LAMP_80s_240mpp_lya_dqual_01.img', '3f071a9e8afbddc399b2523d6f3995994c9f7f26e27d0e5771de42e1a6ff2754'),
    'error': ('LAMP_80s_240mpp_lya_error_01.img', '8300ecb4262ee3c747524b629c1fff2d1e0bbb94fef25bd0adace1250d415141'),
}
M = {}
for k, (f, h) in FILES.items():
    raw = open(D + '/' + f, 'rb').read()
    assert hashlib.sha256(raw).hexdigest() == h, f
    M[k] = np.frombuffer(raw, '<f4').reshape(2501, 2501).astype(np.float64)
A, Q, E = M['albed'], M['dqual'], M['error']
N, S, R, F = 2501, 240.0, 1737400.0, 4
out = {}

# ---- geometry (reading B; 1-based I = column + 1, J = stored row + 1) ----
I = np.arange(1, N + 1)
X = (I - 1251) * S
XX, YY = np.meshgrid(X, X)
LAT = -90 + np.degrees(2 * np.arctan(0.5 * np.hypot(XX, YY) / R))
inside = LAT <= -80
qual = inside & np.isfinite(A) & (Q == 0)

# R4: crop versus pad
out['crop_2500_drops'] = {'last_row_and_col_pixels_inside_80S': int(inside[-1, :].sum() + inside[:, -1].sum() - inside[-1, -1]),
                          'of_which_qualifying': int(qual[-1, :].sum() + qual[:, -1].sum() - qual[-1, -1])}
P = 2504                              # pad to 626 x 4; padded pixels are "no source"
pad = lambda a, v: np.pad(a, ((0, P - N), (0, P - N)), constant_values=v)
Ap, qp, ip = pad(A, np.nan), pad(qual, False), pad(inside, False)
n = P // F
blk = lambda a: a.reshape(n, F, n, F)
nq = blk(qp).sum((1, 3))
nin = blk(ip).sum((1, 3))
with np.errstate(invalid='ignore', divide='ignore'):
    mean = np.where(blk(qp), blk(Ap), 0.0).sum((1, 3)) / nq
# cell (c, r) centre in projected metres, before the reading-B sign on y:
#   x = (4c + 1 + 1.5 - 1251) * 240 = (4c + 1.5 - 1250) * 240 ; y_stored = (4r + 1.5 - 1250) * 240
out['grid'] = {
    'padded_size': P, 'cells': n, 'block': F, 'cell_m': S * F,
    'cell_centre_x_m(c)': '(4*c + 1.5 - 1250) * 240, c = 0..625 (0-based); y_stored(r) the same with r',
    'pole_fractional_cell_index': (1251 - 1 - 1.5) / F,  # centre-based: cell c has centre pixel index 4c+1.5 (0-based)
    'pole_offset_from_nearest_cell_centre_m': [round(((1250 - 1.5) - 4 * 312) * S, 1)] * 2,
    'padded_pixels_are_no_source': True,
}
# no-source wedges: points inside the 80 S circle that fall outside the 2501 x 2501 square
r80 = 2 * R * np.tan(np.radians(10) / 2)            # projected radius of 80 S
half = (N / 2) * S                                   # square half-width to the outer pixel edges
out['no_source_wedges'] = {'r_80S_m': round(float(r80), 1), 'square_half_width_m': half,
                           'exists': bool(r80 > half),
                           'max_depth_m_at_cardinal_longitudes': round(float(r80 - half), 1),
                           'wedge_area_km2_total': round(float(4 * (r80 ** 2 * np.arccos(half / r80) - half * np.sqrt(r80 ** 2 - half ** 2)) / 1e6), 1)}

# R3: states per cell (only cells with at least one inside-cap source pixel are considered)
consider = nin > 0
shown = consider & (nq >= 8)
edge = consider & ~shown & (nin < 8)
none_q = consider & ~shown & ~edge & (nq == 0)
low = consider & ~shown & ~edge & (nq > 0)
out['states_960m'] = {'considered (>=1 inside-cap source pixel)': int(consider.sum()), 'shown (>=8 of 16 qualify)': int(shown.sum()),
                      'edge (<8 inside-cap source pixels)': int(edge.sum()),
                      'no usable value (>=8 inside, 0 qualify)': int(none_q.sum()),
                      'too few usable (>=8 inside, 1-7 qualify)': int(low.sum()),
                      'shown_with_16_of_16': int((shown & (nq == 16)).sum())}

# R3: numeric plane, integer thousandths, half away from zero, from the float64 mean
mv = mean[shown]
assert (mv >= 0).all(), 'a shown mean is negative'
thou = np.floor(mv * 1000 + 0.5).astype(np.int64)     # non-negative values only, so half-up = half away from zero
ok = all(Decimal(f'{t // 1000}.{t % 1000:03d}') == Decimal(repr(float(v))).quantize(Decimal('0.001'), ROUND_HALF_UP)
         for t, v in zip(thou.tolist(), mv.tolist()))
# exact ties at the 4th decimal can make floor(v*1000+0.5) differ from Decimal of the float; counted above via ok
out['numeric_uint16_thousandths'] = {'max_value': float(mv.max()), 'max_thousandths': int(thou.max()), 'fits_uint16_below_65535': bool(thou.max() < 65535),
                                     'all_shown_cells_equal_Decimal_half_up_of_float64_mean': bool(ok),
                                     'valid_zero_cells': int((thou == 0).sum())}
plane = np.full((n, n), 65535, np.uint16); plane[shown] = thou
qplane = nq.astype(np.uint8); nplane = nin.astype(np.uint8)
hi = np.zeros((n, n), bool)
hi_native = qp & (Ap > 1)
hi = blk(hi_native).any((1, 3))
qplane_flag = qplane | (hi.astype(np.uint8) << 7)
raw = plane.astype('<u2').tobytes() + qplane_flag.tobytes() + nplane.tobytes()
out['numeric_format_sizes'] = {'uint16_value_plane_bytes': plane.nbytes, 'plus_two_uint8_planes_bytes': len(raw),
                               'gzip9_all_three_planes': len(gzip.compress(raw, 9, mtime=0)),
                               'gzip9_value_plane_only': len(gzip.compress(plane.astype('<u2').tobytes(), 9, mtime=0))}
# rev 1 route: 8-bit colour code 0..254 over 0-0.08, decoded back; count readout disagreements
code = np.round(np.clip(mv / 0.08, 0, 1) * 254)
dec = code / 254 * 0.08
unclipped = mv < 0.08
txt_true = np.floor(mv * 1000 + 0.5); txt_dec = np.floor(dec * 1000 + 0.5)
out['rev1_8bit_route'] = {'shown_unclipped_cells': int(unclipped.sum()),
                          'three_decimal_readout_differs': int((unclipped & (txt_true != txt_dec)).sum()),
                          'max_abs_quantisation_error': round(float(np.abs(dec - mv)[unclipped].max()), 6),
                          'cells_at_or_above_0.08_sharing_top_code': int((~unclipped).sum())}

# R3: outliers
qn = qual
out['native_quality0_finite_inside_80S'] = {'above_0.08': int((qn & (A > 0.08)).sum()), 'above_0.2': int((qn & (A > 0.2)).sum()),
                                            'above_1': int((qn & (A > 1)).sum()), 'max': float(A[qn].max())}
peaks = np.isin(Q, (4, 6))
from math import inf
py, px = np.nonzero(peaks)
def nearest_peak_km(j, i):
    d2 = (py - j) ** 2 + (px - i) ** 2
    return float(np.sqrt(d2.min()) * S / 1000)
oy, ox = np.nonzero(qn & (A > 0.2))
dists = [nearest_peak_km(j, i) for j, i in zip(oy, ox)]
snr = E[qn & (A > 0.2)]
out['native_above_0.2_context'] = {'n': len(dists), 'within_1km_of_code4or6': sum(d <= 1 for d in dists),
                                   'within_3km': sum(d <= 3 for d in dists), 'median_km': round(float(np.median(dists)), 2),
                                   'snr_min_median_max': [round(float(snr.min()), 2), round(float(np.median(snr)), 2), round(float(snr.max()), 2)]}
out['means_960m'] = {'above_0.08': int((mv > 0.08).sum()), 'at_or_above_0.08': int((mv >= 0.08).sum()), 'above_1': int((mv > 1).sum()),
                     'max': round(float(mv.max()), 4), 'cells_with_a_native_value_above_1': int((hi & shown).sum())}
# a plausibility mask (NOT adopted): drop native quality-0 values above 1 before averaging; what changes
q2 = qp & ~(Ap > 1)
nq2 = blk(q2).sum((1, 3))
with np.errstate(invalid='ignore', divide='ignore'):
    mean2 = np.where(blk(q2), blk(Ap), 0.0).sum((1, 3)) / nq2
shown2 = consider & (nq2 >= 8)
out['if_mask_native_above_1'] = {'cells_changing_state': int((shown != shown2).sum()),
                                 'shown_cells_changing_value': int((shown & shown2 & (np.floor(mean * 1000 + .5) != np.floor(mean2 * 1000 + .5))).sum()),
                                 'remaining_means_above_0.08': int((shown2 & (mean2 > 0.08)).sum()),
                                 'remaining_max': round(float(mean2[shown2].max()), 4)}

# texture context: LEND's generated globe texture
TW, TH = 2880, 1440
out['globe_texture'] = {'size': [TW, TH], 'px_per_deg': TW / 360, 'rows_80_90S': int(TH / 180 * 10),
                        'km_per_row': round(2 * np.pi * R / 1000 / TW, 2),
                        'km_per_column_at_85S': round(2 * np.pi * R / 1000 / TW * np.cos(np.radians(85)), 3)}
print(json.dumps(out, indent=1))
