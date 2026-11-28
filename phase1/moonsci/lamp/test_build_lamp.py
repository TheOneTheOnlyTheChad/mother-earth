#!/usr/bin/env python3
"""Tests for the LAMP page file (phase1/moonsci/build_lamp.py output), independent of the builder's NumPy path.

  H  header: every constant, reserved zeros, source hashes, payload hash; gzip and raw sizes
  P  planes: n_q <= n_in <= 16; bits 5-6 of the n_q byte zero; bit 7 only with n_q >= 1; value != sentinel iff n_q >= 8; totals
     (311,803 shown; 314,883 considered; 9 flagged cells; 56 at or above 80; max 31,069)
  I  independent recomputation (pure Python, array module, per pixel) of a seeded random 2,000 shown-or-not cells plus every
     edge, pole and flagged cell: n_in, n_q, the float64 mean and Decimal ROUND_HALF_UP thousandths, the flag bit
  K  known points under reading B: the pole lies in cell (312, 312); the four mid-edges of the source map (first record, last sample,
     last record, first sample) are longitudes 0, 90, 180 and 270 E and fall in cells (312, 0), (625, 312), (312, 625), (0, 312);
     five IAU crater centres map to cells whose stored value equals an independent recomputation; reflected (reading A), rotated and
     one-cell-shifted (4 pixels) index functions give different cells for those centres (the check is not vacuous)
  R  rounding boundary cases: 0.0795 -> 80 (top bin), 0.07949... -> 79, exact .xxx5 ties half up
Usage: python3 -I phase1/moonsci/lamp/test_build_lamp.py --src <dir with the retained files> [--file <page file .bin.gz>]
"""
import argparse, array, gzip, hashlib, math, os, random, struct, sys
from decimal import Decimal, ROUND_HALF_UP

ap = argparse.ArgumentParser(); ap.add_argument('--src', required=True)
ap.add_argument('--file', default=os.path.join(os.path.dirname(__file__), '..', '..', '..', 'assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin.gz'))
a = ap.parse_args()
npass = nfail = 0
def ok(name, cond, info=''):
    global npass, nfail
    if cond: npass += 1
    else: nfail += 1; print('FAIL', name, str(info)[:300])

ASHA = '896aa35d377c46b68cc774047638b28451106e28e8a6aa67eb4aeca0358af2e2'
QSHA = '3f071a9e8afbddc399b2523d6f3995994c9f7f26e27d0e5771de42e1a6ff2754'
gz = open(a.file, 'rb').read(); raw = gzip.decompress(gz)
N, P, F, C, S, R = 2501, 2504, 4, 626, 240.0, 1737400.0
ok('H raw size', len(raw) == 160 + C * C * 4, len(raw))
hd = struct.unpack_from('<8sHHHHHHIIHHHHHHHHII', raw, 0)
ok('H header constants', hd == (b'MELAMPR1', 1, 160, 626, 4, 2501, 2504, 960, 1737400, 1251, 15, 2, 1000, 65535, 80, 8, 80, 20090901, 20101001), hd)
ok('H reserved zero', raw[52:64] == bytes(12))
ok('H source hashes', raw[64:96].hex() == ASHA and raw[96:128].hex() == QSHA)
ok('H payload hash', hashlib.sha256(raw[160:]).digest() == raw[128:160])
val = array.array('H'); val.frombytes(raw[160:160 + 2 * C * C])
if sys.byteorder != 'little': val.byteswap()
qb = raw[160 + 2 * C * C:160 + 3 * C * C]; nb = raw[160 + 3 * C * C:]
bad = 0; shown = cons = flag = top = 0; mx = 0
for i in range(C * C):
    nq, hi, n_in, v = qb[i] & 31, qb[i] >> 7, nb[i], val[i]
    if (qb[i] & 0x60) or nq > n_in or n_in > 16 or (hi and nq == 0) or ((v != 65535) != (nq >= 8)) or (n_in == 0 and nq):
        bad += 1
    if n_in: cons += 1
    if nq >= 8: shown += 1; top += v >= 80; mx = max(mx, v); flag += hi
ok('P every cell consistent', bad == 0, bad)
ok('P totals', (shown, cons, flag, top, mx) == (311803, 314883, 9, 56, 31069), (shown, cons, flag, top, mx))

# independent source reading
def load(name, h):
    b = open(os.path.join(a.src, name), 'rb').read()
    assert hashlib.sha256(b).hexdigest() == h, name
    x = array.array('f'); x.frombytes(b)
    if sys.byteorder != 'little': x.byteswap()
    return x
Aa = load('LAMP_80s_240mpp_lya_albed_01.img', ASHA); Qa = load('LAMP_80s_240mpp_lya_dqual_01.img', QSHA)
def lat_of(I, J):   # 1-based sample I, line J
    r = math.hypot((I - 1251) * S, (J - 1251) * S)
    return -90 + math.degrees(2 * math.atan(r / (2 * R)))
def cell_truth(c, r):
    n_in = n_q = 0; s = 0.0; vals = []; hi = 0
    for dj in range(4):
        for di in range(4):
            I, J = 4 * c + di + 1, 4 * r + dj + 1
            if I > N or J > N: continue
            if lat_of(I, J) > -80: continue
            n_in += 1
            v = Aa[(J - 1) * N + (I - 1)]; q = Qa[(J - 1) * N + (I - 1)]
            if math.isfinite(v) and q == 0:
                n_q += 1; vals.append(v); hi |= v > 1
    if n_q >= 8:
        m = math.fsum(vals) / n_q   # the builder sums in float64 in NumPy order; compare by Decimal rounding with a tie guard
        t = int(Decimal(repr(m)).quantize(Decimal('0.001'), ROUND_HALF_UP) * 1000)
        return n_in, n_q, t, int(hi), m
    return n_in, n_q, 65535, 0, None
rng = random.Random(20261128)
cells = set(rng.randrange(C * C) for _ in range(2000))
for i in range(C * C):
    if nb[i] and nb[i] < 16: cells.add(i)        # edge cells
    if qb[i] >> 7: cells.add(i)                   # flagged cells
for c in range(310, 315):
    for r in range(310, 315): cells.add(r * C + c)  # around the pole
mis = []; ties = 0
for i in sorted(cells):
    r, c = divmod(i, C)
    n_in, n_q, t, hi, m = cell_truth(c, r)
    got = (nb[i], qb[i] & 31, val[i], qb[i] >> 7)
    if got[:2] != (n_in, n_q) or got[3] != hi:
        mis.append((i, got, (n_in, n_q, t, hi))); continue
    if t != val[i]:
        # only a float summation-order difference at an exact thousandth tie would be tolerable: report it, never pass it silently
        if m is not None and abs(m * 1000 - round(m * 1000 - 0.5) - 0.5) < 1e-9: ties += 1
        else: mis.append((i, got, (n_in, n_q, t, hi)))
ok(f'I independent recomputation of {len(cells)} cells (random, edge, flagged, pole)', not mis and ties == 0, (len(mis), mis[:3], ties))

# K known points under reading B
def cell_of(lat, lon, variant='B'):
    r = 2 * R * math.tan(math.radians(90 + lat) / 2)
    x, y = r * math.sin(math.radians(lon)), -r * math.cos(math.radians(lon))      # reading B: y (stored-line direction) = -r cos(lon)
    if variant == 'A': y = -y
    if variant == 'rot90': x, y = -y, x
    if variant == 'rot180': x, y = -x, -y
    I = x / S + 1251 + (4 if variant == 'shift' else 0); J = y / S + 1251
    if not (0.5 <= I < N + 0.5 and 0.5 <= J < N + 0.5): return None
    return (math.floor((I - 0.5) / 4), math.floor((J - 0.5) / 4))
ok('K pole in cell (312, 312)', cell_of(-90, 0) == (312, 312), cell_of(-90, 0))
def lon_at(I, J): return math.degrees(math.atan2((I - 1251) * S, -(J - 1251) * S)) % 360
ok('K mid-edges are 0, 90, 180, 270 E', [round(lon_at(*p), 6) for p in ((1251, 1), (2501, 1251), (1251, 2501), (1, 1251))] == [0, 90, 180, 270])
ok('K mid-edge cells', [(math.floor((I - 1) / 4), math.floor((J - 1) / 4)) for I, J in ((1251, 1), (2501, 1251), (1251, 2501), (1, 1251))] == [(312, 0), (625, 312), (312, 625), (0, 312)])
FEAT = {'Cabeus': (-85.33, 317.87), 'Shoemaker': (-88.14, 45.91), 'Haworth': (-87.45, 354.83), 'Faustini': (-87.18, 84.31), 'Amundsen': (-84.44, 83.07)}
for nm, (la, lo) in FEAT.items():
    c, r = cell_of(la, lo)
    n_in, n_q, t, hi, m = cell_truth(c, r)
    ok(f'K {nm}: stored value at its reading-B cell equals the independent recomputation', val[r * C + c] == t, (val[r * C + c], t))
    others = [cell_of(la, lo, v) for v in ('A', 'rot90', 'rot180', 'shift')]
    ok(f'K {nm}: reflected, rotated and shifted readings give other cells', all(o != (c, r) for o in others), others)
# R rounding boundaries (the builder's rule: floor(m * 1000 + 0.5) for m >= 0)
rule = lambda m: math.floor(m * 1000 + 0.5)
ok('R 0.0795 rounds into the top bin', rule(0.0795) == 80 and int(Decimal('0.0795').quantize(Decimal('0.001'), ROUND_HALF_UP) * 1000) == 80)
ok('R 0.07949 stays below', rule(0.07949) == 79)
ok('R exact binary ties round half up (0.0625 -> 63; 0.03125 -> 31; 0.0078125 -> 8)', [rule(x) for x in (0.0625, 0.03125, 0.0078125)] == [63, 31, 8])
print(f'test_build_lamp: {npass} passed, {nfail} failed')
sys.exit(1 if nfail else 0)
