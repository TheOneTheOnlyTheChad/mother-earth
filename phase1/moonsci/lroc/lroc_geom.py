"""LROC Apollo 11 orthophoto geometry checks (Moon item 4, proposal rev 2 R1). Build tooling; never served.

Closure (26 Nov 2026): the k = 1 convention tested below is DEFINED by the attached PDS3 headers' NOTE and the volume
RDR SIS v1.6 §6.4 (LROC, adopted Nov 2011: the centre of the upper-left pixel is (1.0, 1.0); offsets run from it to the
projection origin, positive right/below). The bounds test below is a consistency check, not the basis.

Independent of the pane script: constants are transcribed from the PDS4 labels and the attached PDS3
headers (read 26 Nov 2026; GPT independently confirmed the 0.5 m label's values), and anchors come from
outside this code: the producer's bounding coordinates in the same labels, and LROC's published LM/PSE
positions (2016 list). Exits 1 on any failure, including the negative controls.
Run: python3 -I phase1/moonsci/lroc/lroc_geom.py
"""
import math, sys

R = 1737400.0                  # A/B/C_AXIS_RADIUS 1737.4 km (labels; DSMAP.CAT's "1734.4 km" text is not used)
LATP, LONP = 1.0, 180.0         # CENTER_LATITUDE, CENTER_LONGITUDE (both products)
BOUNDS = dict(w=23.37231647, e=23.51150435, s=0.31464201, n=1.23650584)   # label bounding coordinates
P = {  # product: scale (m), LINE/SAMPLE_PROJECTION_OFFSET, lines, samples
    '50CM': dict(s=0.49999999999999, L0=74989.5, S0=9497505.5, NL=55908, NS=8440),
    '2M':   dict(s=2.0000000000006,  L0=18747.5, S0=2374376.5, NL=13978, NS=2111),
}
LM = (0.67416, 23.47314); PSE = (0.67322, 23.47315)     # LROC 2016 list, ME frame
c = math.cos(math.radians(LATP))
fails = []
def check(name, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + name + (('  ' + info) if info else ''))
    if not ok: fails.append(name)

# Candidate conventions, k = where the offsets put integer (1-based) pixel coordinates:
#   line = L0 - y/s + k, sample = S0 + x/s + k.  k = 1 is DSMAP.CAT's "+1" form with the labels' sign of
#   L0 (positive = y of the upper-left divided by the scale). Integer coordinates are pixel CENTRES, so the
#   array's outer edges are at 0.5 and N + 0.5. The label bounds are the DTM extents (README "DTM extents",
#   identical in both labels), so they need not fall exactly on either product's edges: the test is that
#   one convention is best in both products and within 0.75 px of the edges.
def fwd(p, lat, lon, k):   # -> (line, sample), 1-based, CENTRE convention k: offset added
    x = R * c * math.radians(lon - LONP); y = R * math.radians(lat)
    return (p['L0'] - y / p['s'] + k, p['S0'] + x / p['s'] + k)
def inv(p, line, samp, k):
    y = (p['L0'] - line + k) * p['s']; x = (samp - p['S0'] - k) * p['s']
    return (math.degrees(y / R), LONP + math.degrees(x / (R * c)))

for name, p in P.items():
    res = {}
    for k in (0.0, 0.5, 1.0):   # candidate: where the 1-based pixel CENTRE sits relative to the offset
        l_n, s_w = fwd(p, BOUNDS['n'], BOUNDS['w'], k); l_s, s_e = fwd(p, BOUNDS['s'], BOUNDS['e'], k)
        # outer EDGES of the array in pixel-centre coordinates are 0.5 and N+0.5
        err = max(abs(l_n - 0.5), abs(s_w - 0.5), abs(l_s - (p['NL'] + 0.5)), abs(s_e - (p['NS'] + 0.5)))
        res[k] = (err, l_n, s_w, l_s, s_e)
    best = min(res, key=lambda k: res[k][0])
    for k in res: print(f'  {name} k={k}: worst edge error {res[k][0]:.3f} px  (N edge line {res[k][1]:.3f}, W edge sample {res[k][2]:.3f}, S edge line {res[k][3]:.3f}, E edge sample {res[k][4]:.3f})')
    check(f'{name}: label bounds within 0.75 px of the array edges for the best convention', res[best][0] <= 0.75, f'best k={best}, worst {res[best][0]:.3f} px')
    P[name]['sep'] = sorted(r[0] for r in res.values())[1] - res[best][0]
    print(f'  {name}: separation from the next-best convention {P[name]["sep"]:.3f} px')
    P[name]['k'] = best; P[name]['edge_err'] = res[best][0]

kk = {P[n]['k'] for n in P}
check('both products are best fitted by the same convention, k = 1 (DSMAP.CAT "+1" form)', kk == {1.0}, str(kk))
check('at least one product separates k = 1 from its neighbours by >= 0.25 px', max(P[n]['sep'] for n in P) >= 0.25,
      ', '.join(f'{n} {P[n]["sep"]:.3f} px' for n in P) + '  (the 0.5 m bounds alone do not separate k = 1 from k = 0.5: half a pixel, 0.25 m)')
k = kk.pop() if len(kk) == 1 else 1.0

# PDS4 upperleft_corner_x conflict: label says +4748752.75 (0.5 m). PDS3 offsets imply the upper-left EDGE x:
p = P['50CM']
x_ul_edge = (0.5 - p['S0'] - k) * p['s']; y_ul_edge = (p['L0'] - 0.5 + k) * p['s']
print(f'  0.5 m upper-left edge from PDS3: x {x_ul_edge:.3f} m, y {y_ul_edge:.3f} m (PDS4 label: x +4748752.75, y 37494.75)')
x_c11 = (1 - p['S0'] - k) * p['s']; y_c11 = (p['L0'] - 1 + k) * p['s']
print(f'  centre of pixel (1,1) from PDS3: x {x_c11:.3f} m, y {y_c11:.3f} m')
check('PDS4 upperleft_corner_y equals the centre of pixel (1,1) (to 1 mm)', abs(y_c11 - 37494.75) < 1e-3)
check('PDS4 upperleft_corner_x has the magnitude of that centre but the opposite sign', abs(abs(x_c11) - 4748752.75) < 1e-3 and x_c11 < 0)

# Round trips and landmark positions
for name, p in P.items():
    for lab, (la, lo) in (('LM', LM), ('PSE', PSE), ('NW', (BOUNDS['n'], BOUNDS['w']))):
        L, S = fwd(p, la, lo, k); la2, lo2 = inv(p, L, S, k)
        check(f'{name} {lab}: forward/inverse round trip < 1e-9 deg', abs(la2 - la) < 1e-9 and abs(lo2 - lo) < 1e-9, f'line {L:.3f} sample {S:.3f}')
    p['LM'] = fwd(p, *LM, k)

# Cross-product: the LM's metre position must be the same whichever product's pixel grid is used
L5, S5 = P['50CM']['LM']; L2, S2 = P['2M']['LM']
m5 = inv(P['50CM'], L5, S5, k); m2 = inv(P['2M'], L2, S2, k)
check('LM ground position identical through both grids', abs(m5[0] - m2[0]) < 1e-9 and abs(m5[1] - m2[1]) < 1e-9)

# Negative controls: each wrong variant must miss the bounds by more than 1 px in at least one product
def edge_err(p, sgn_x=1, swap=False, shift=0.0):
    def f(lat, lon):
        x = sgn_x * R * c * math.radians(lon - LONP); y = R * math.radians(lat)
        if swap: x, y = y, x
        return (p['L0'] - y / p['s'] + k + shift, p['S0'] + x / p['s'] + k)
    l_n, s_w = f(BOUNDS['n'], BOUNDS['w']); l_s, s_e = f(BOUNDS['s'], BOUNDS['e'])
    return max(abs(l_n - 0.5), abs(s_w - 0.5), abs(l_s - (p['NL'] + 0.5)), abs(s_e - (p['NS'] + 0.5)))
for lab, kw in (('x sign flipped', dict(sgn_x=-1)), ('axes swapped', dict(swap=True)), ('one-line shift', dict(shift=1.0))):
    errs = {n: edge_err(p, **kw) for n, p in P.items()}
    check(f'negative control "{lab}" is worse than the adopted convention by >= 0.5 px in both products', all(errs[n] - P[n]['edge_err'] >= 0.5 for n in P), ', '.join(f'{n} {e:.2f} px' for n, e in errs.items()))

# Crops proposed in rev 2 (1-based inclusive), and their ground bounds
p = P['50CM']; L, S = p['LM']
r0 = round(L) - 512; c0 = round(S) - 512          # site: 1024 x 1024 with the LM pixel at index 512 (0-based)
site = dict(lines=(r0, r0 + 1023), samples=(c0, c0 + 1023))
off = ((L - round(L)) * p['s'], (S - round(S)) * p['s'])
print(f'  site crop lines {site["lines"]}, samples {site["samples"]}; LM is {off[0]:+.3f} m (south +) and {off[1]:+.3f} m (east +) from its pixel centre at crop (512,512) 0-based')
check('site crop rows lie inside the checkpoint 1 range (full-width lines 33593-34616)', site['lines'] == (33593, 34616) and 1 <= site['samples'][0] and site['samples'][1] <= p['NS'])
q = P['2M']; L2r = round(q['LM'][0])
area = dict(lines=(L2r - 1000, L2r + 999), samples=(1, 2110), dropped_sample=2111)
print(f'  area source lines {area["lines"]}, samples {area["samples"]} (sample 2111 dropped) -> 1055 x 1000 output at 4 m')
w_edge = inv(q, area['lines'][0] - 0.5, 0.5, k); e_edge = inv(q, area['lines'][1] + 0.5, 2110.5, k)
print(f'  area ground bounds: N {w_edge[0]:.8f}, W {w_edge[1]:.8f}, S {e_edge[0]:.8f}, E {e_edge[1]:.8f}; width {2110*q["s"]:.1f} m, height {2000*q["s"]:.1f} m')
check('area width is 4,220 m and height 4,000 m', abs(2110 * q['s'] - 4220) < 1e-6 and abs(2000 * q['s'] - 4000) < 1e-6)
s_n = inv(p, site['lines'][0] - 0.5, site['samples'][0] - 0.5, k); s_s = inv(p, site['lines'][1] + 0.5, site['samples'][1] + 0.5, k)
fr = fwd(q, s_n[0], s_n[1], k), fwd(q, s_s[0], s_s[1], k)
print(f'  site footprint in the area output (4 m px, 0-based, x right, y down): x {(fr[0][1]-0.5)/2:.3f}..{(fr[1][1]-0.5)/2:.3f}, y {(fr[0][0]-0.5-(area["lines"][0]-1))/2:.3f}..{(fr[1][0]-0.5-(area["lines"][0]-1))/2:.3f}')
print('RESULT', 'FAIL' if fails else 'PASS', len(fails), 'failures')
sys.exit(1 if fails else 0)
