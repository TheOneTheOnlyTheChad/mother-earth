#!/usr/bin/env python3
"""Builder for the Moon LEND layer (moon.html; MOON-LEND-PROPOSAL rev 2 §8.1, Chad's D1-D9, GPT's rev 2 recheck build notes 1-3).

Input: ONLY the retained archive file lend_rdr_alds_20111211.dat (LEND ALD south polar, 2011-12-11 to 2016-09-14), checked against
its pinned sha256 before anything is parsed. Output: assets/moon/lend/lend-alds-2011-2016-R1.bin.

What is computed (no unit, background or hydrogen interpretation of the field; see the proposal §4.3):
  * usable cell: CSETN_EXPOSURE > 0 (a whole number of seconds), CSETN_ERR > 0, CSETN_RATE >= 0, all finite;
    archive-missing cell: exactly RATE = -1, EXPOSURE = 0, ERR = -1. Anything else is malformed and stops the build (note 2).
  * disc: every grid cell whose centre lies within RADIUS_KM great-circle distance of the cell's centre on a sphere of SPHERE_KM
    (centre-in-disc; distances from unit vectors, so the 0/360 seam needs no special case). Only usable cells contribute.
  * m = sum(w x) / sum(w) over the disc, w = 1 / ERR^2; r = the same over the reference band (cell centres 80.25-84.75 S).
  * p = 100 (m / r - 1) percent; formal counting-error estimate (percentage points), first order, CONDITIONAL on ERR being the
    standard deviation of independent cell values: 100 sqrt(Var(m)/r^2 + m^2 Var(r)/r^4 - 2 m Cov(m, r)/r^3),
    Var(m) = 1/W_D, Var(r) = 1/W_B, Cov = W_{D and B} / (W_D W_B).
  * state, decided at FULL precision before anything is rounded (note 1), precedence: 1 archive missing; 3 disc crosses the
    product's 80 S edge; 2 formal estimate > CUTOFF_PP; else 0 shown.
  * quantisation: p and the estimate x100, rounded half away from zero; exposure is the native cell's own (a whole number).

File layout (little-endian; header 160 bytes, then 14,400 records of 10 bytes in archive order: row 0 = 89.75 S, column 0 = 0.25 E,
longitude increasing eastward; record index = 720 * row + column):
  0  8s  magic b'MELENDR1'          8  u16 version 1           10 u16 header bytes 160      12 u16 rows 20      14 u16 cols 720
  16 u16 record bytes 10            18 i16 lat0 -8975 (centideg) 20 u16 dlat 50           22 u16 lon0 25      24 u16 dlon 50
  26 u16 cutoff 50 (centi-pp)       28 u32 radius 30000 m       32 u32 sphere 1737400 m    36 i16 band lo -8475 38 i16 band hi -8025
  40 i16 edge -8000                 42 u16 0                    44 u32 period start 20111211  48 u32 period stop 20160914
  52 f64 reference mean            60 f64 reference formal error 68..95 zero
  96 32s source sha256             128 32s payload sha256 (of the 144,000 record bytes)
Record: u8 state; u8 near-missing (disc contains archive-missing cells); i16 p x100; u16 estimate x100; u16 usable cells in the
disc; u16 native-cell exposure (s). For state 1 every other field is 0. For states 2 and 3, p and the estimate are 0.

Usage: python3 -I phase1/moonsci/build_lend.py --src <dir with the retained file> [--out <file>] [--check]
"""
import argparse, hashlib, math, os, struct, sys

import numpy as np

SRC_NAME = 'lend_rdr_alds_20111211.dat'
SRC_SHA = 'e6b1c2d54e3e00d649a1229b08507dd10c859039ae2df8e34cdf1480bb0031ef'
ROWS, COLS, REC = 20, 720, 310
START, STOP = b'2011-12-11T00:00:00.000', b'2016-09-14T00:00:00.000'
RADIUS_KM, SPHERE_KM, CUTOFF_PP, EDGE_DEG = 30.0, 1737.4, 0.5, -80.0
BAND = (-84.75, -80.25)
HEADER_BYTES, RECORD_BYTES = 160, 10
OUT_DEFAULT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'moon', 'lend', 'lend-alds-2011-2016-R1.bin')
# label field locations (1-based byte, IEEE754MSBSingle): latitude 47, longitude 51, CSETN exposure 107, rate 111, error 115
F_LAT, F_LON, F_EXP, F_RATE, F_ERR = 47, 51, 107, 111, 115


class BuildError(Exception):
    pass


def f32(x):
    return struct.unpack('>f', struct.pack('>f', x))[0]


def parse(raw, expect_sha=SRC_SHA):
    """Strict parse. Returns a list of 14,400 dicts {row, col, lat, lon, state: 'usable'|'missing', exp, rate, err}."""
    if hashlib.sha256(raw).hexdigest() != expect_sha:
        raise BuildError('source sha256 differs from the pinned value')
    if len(raw) != ROWS * COLS * REC:
        raise BuildError('source length %d is not %d' % (len(raw), ROWS * COLS * REC))
    out = []
    for i in range(ROWS * COLS):
        rec = raw[i * REC:(i + 1) * REC]
        r, c = divmod(i, COLS)
        if rec[0:23] != START or rec[23:46] != STOP:
            raise BuildError('record %d: period strings are not %s / %s' % (i, START.decode(), STOP.decode()))
        g = lambda loc: struct.unpack('>f', rec[loc - 1:loc + 3])[0]
        lat, lon, exp, rate, err = g(F_LAT), g(F_LON), g(F_EXP), g(F_RATE), g(F_ERR)
        for name, v in (('latitude', lat), ('longitude', lon), ('exposure', exp), ('rate', rate), ('error', err)):
            if not math.isfinite(v):
                raise BuildError('record %d: %s is not finite' % (i, name))
        if lat != f32(-89.75 + 0.5 * r) or lon != f32(0.25 + 0.5 * c):
            raise BuildError('record %d: coordinates (%r, %r) are not the expected cell centre (row %d, column %d)' % (i, lat, lon, r, c))
        if rate == -1.0 and exp == 0.0 and err == -1.0:
            out.append({'row': r, 'col': c, 'lat': lat, 'lon': lon, 'state': 'missing'})
            continue
        if exp > 0 and exp == int(exp) and exp <= 65535 and err > 0 and rate >= 0:
            out.append({'row': r, 'col': c, 'lat': lat, 'lon': lon, 'state': 'usable', 'exp': int(exp), 'rate': rate, 'err': err})
            continue
        raise BuildError('record %d: inconsistent values (exposure %r, rate %r, error %r): neither usable nor the archive-missing sentinel' % (i, exp, rate, err))
    return out


def reduce(cells):
    """Full-precision reduction. Returns (per-cell list of dicts, reference mean, reference formal error)."""
    lat = np.array([c['lat'] for c in cells], dtype=np.float64)
    lon = np.array([c['lon'] for c in cells], dtype=np.float64)
    use = np.array([c['state'] == 'usable' for c in cells])
    miss = ~use
    x = np.array([c['rate'] if c['state'] == 'usable' else 0.0 for c in cells], dtype=np.float64)
    w = np.array([1.0 / (c['err'] ** 2) if c['state'] == 'usable' else 0.0 for c in cells], dtype=np.float64)
    la, lo = np.radians(lat), np.radians(lon)
    xyz = np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], 1)
    band = use & (lat >= BAND[0] - 1e-6) & (lat <= BAND[1] + 1e-6)
    WB = float(w[band].sum())
    r = float((w[band] * x[band]).sum()) / WB
    var_r = 1.0 / WB
    cosr = math.cos(RADIUS_KM / SPHERE_KM)
    reach = math.degrees(RADIUS_KM / SPHERE_KM)
    res = []
    for i in range(len(cells)):
        if miss[i]:
            res.append({'state': 1, 'near': 0, 'p': 0.0, 'e': 0.0, 'n': 0, 'exp': 0})
            continue
        d = (xyz @ xyz[i]) >= cosr
        du = d & use
        WD = float(w[du].sum())
        WDB = float(w[du & band].sum())
        m = float((w[du] * x[du]).sum()) / WD
        cov = WDB / (WD * WB)
        p = 100.0 * (m / r - 1.0)
        e = 100.0 * math.sqrt(1.0 / WD / r ** 2 + m ** 2 * var_r / r ** 4 - 2.0 * m * cov / r ** 3)
        near = int(bool((d & miss).any()))
        if lat[i] + reach > EDGE_DEG:
            st = 3
        elif e > CUTOFF_PP:
            st = 2
        else:
            st = 0
        res.append({'state': st, 'near': near, 'p': p, 'e': e, 'n': int(du.sum()), 'exp': cells[i]['exp'], 'm': m})
    return res, r, math.sqrt(var_r)


def q100(v):
    """x100, rounded half away from zero."""
    s = v * 100.0
    return int(math.copysign(math.floor(abs(s) + 0.5), s))


def pack(res, ref, ref_err, src_sha=SRC_SHA):
    body = bytearray()
    for k in res:
        st = k['state']
        if st == 0:
            pq, eq = q100(k['p']), q100(k['e'])
            if not (-2000 <= pq <= 2000) or not (1 <= eq <= 50):
                raise BuildError('a shown cell quantised out of range (p %d, estimate %d)' % (pq, eq))
        else:
            pq, eq = 0, 0
        n = k['n'] if st != 1 else 0
        if not (0 <= n <= 65535):
            raise BuildError('support count out of range')
        body += struct.pack('<BBhHHH', st, k['near'], pq, eq, n, k['exp'])
    body = bytes(body)
    if len(body) != ROWS * COLS * RECORD_BYTES:
        raise BuildError('payload length')
    h = struct.pack('<8sHHHHHhHHHHIIhhhHIIdd', b'MELENDR1', 1, HEADER_BYTES, ROWS, COLS, RECORD_BYTES, -8975, 50, 25, 50,
                    round(CUTOFF_PP * 100), round(RADIUS_KM * 1000), round(SPHERE_KM * 1000), round(BAND[0] * 100), round(BAND[1] * 100),
                    round(EDGE_DEG * 100), 0, 20111211, 20160914, ref, ref_err)
    h = h + b'\0' * (96 - len(h)) + bytes.fromhex(src_sha) + hashlib.sha256(body).digest()
    if len(h) != HEADER_BYTES:
        raise BuildError('header length %d' % len(h))
    return h + body


def build(src_dir):
    raw = open(os.path.join(src_dir, SRC_NAME), 'rb').read()
    cells = parse(raw)
    res, ref, ref_err = reduce(cells)
    return pack(res, ref, ref_err), res, ref, ref_err


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--out', default=OUT_DEFAULT)
    ap.add_argument('--check', action='store_true', help='rebuild and compare bytes with --out; write nothing')
    a = ap.parse_args()
    try:
        out, res, ref, ref_err = build(a.src)
    except BuildError as e:
        print('BUILD REFUSED:', e)
        sys.exit(2)
    counts = {s: sum(1 for k in res if k['state'] == s) for s in (0, 1, 2, 3)}
    info = 'bytes %d sha256 %s states shown %d / missing %d / withheld-error %d / withheld-edge %d; reference %.10f +- %.10f; numpy %s' % (
        len(out), hashlib.sha256(out).hexdigest(), counts[0], counts[1], counts[2], counts[3], ref, ref_err, np.__version__)
    if a.check:
        cur = open(a.out, 'rb').read()
        print(('CHECK OK ' if cur == out else 'CHECK DIFFERS ') + info)
        sys.exit(0 if cur == out else 1)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    open(a.out, 'wb').write(out)
    print('WROTE', os.path.normpath(a.out), info)


if __name__ == '__main__':
    main()
