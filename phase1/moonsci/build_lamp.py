#!/usr/bin/env python3
"""Builder for the Moon LAMP layer (moon.html; MOON-LAMP-PROPOSAL rev 2 §7-§8, Chad's D1-D8, GPT's rev 2 recheck notes 1-5,
Chad's D6 decision: reading B retained, no shift applied).

Inputs, ONLY the retained files, each checked against its pinned sha256 before anything is parsed:
  LAMP_80s_240mpp_lya_albed_01.img   LAMP GDR V1.0 south-polar cumulative Lyman-alpha albedo (float32 LE, 2501 x 2501)
  LAMP_80s_240mpp_lya_dqual_01.img   its data-quality map (float32 LE codes)
  lamp-docs-labels-2026-11-28.json   the retained documents; the two maps' PDS3 labels are read from it for the layout
Output: assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin.gz (gzip -9, mtime 0; Python zlib, version printed).

Geometry (proposal rev 2 §5.1, §7). Stored line J (1 = first record) and sample I, 1-based:
  x = (I - 1251) * 240 m,  y = (J - 1251) * 240 m,  LON = atan2(x, -y) (reading B),  LAT = -90 + 2 atan(r / (2 * 1737400 m)).
The 2501 x 2501 source is padded to 2504 x 2504 with "no source" after the last record and sample, then cut into 626 x 626 cells of
4 x 4 pixels (960 m). Cell (c, r), 0-based, has its centre at x = (4c + 1.5 - 1250) * 240, y = (4r + 1.5 - 1250) * 240; the pole is
at fractional cell index 312.125 on each axis (not re-centred).

Per cell: n_in = source pixels whose centre is inside 80 S (0..16; padded pixels are not source); n_q = those that are finite and have
quality code 0 (codes 1, 2, 4, 5, 6 and any other code do not qualify); the value is the arithmetic mean of the n_q float32 values in
float64, stored as integer thousandths rounded half away from zero, only where n_q >= 8 (else the sentinel 65535). A shown mean is
never negative (the builder asserts it); a value at or above 65535 stops the build. Bit 7 of the n_q byte is set where any qualifying
pixel in the cell exceeds 1 (retained and disclosed, D8 P1).

File layout (little-endian; header 160 bytes, then three planes in row-major cell order, row r = stored-line block, column c =
sample block):
  0  8s magic b'MELAMPR1'        8 u16 version 1             10 u16 header bytes 160      12 u16 cells per side 626
  14 u16 block 4                 16 u16 native size 2501      18 u16 padded size 2504      20 u32 cell size 960 m
  24 u32 sphere radius 1737400 m 28 u16 pole pixel 1251 (1-based)  30 u16 cell-centre offset 15 (tenths of a pixel)
  32 u16 orientation 2 (reading B: LON = atan2(x, -y))      34 u16 value scale 1000 (thousandths)    36 u16 sentinel 65535
  38 u16 colour end 80 (thousandths)   40 u16 support threshold 8     42 u16 cap latitude 80 (degrees south)
  44 u32 period start 20090901   48 u32 period stop 20101001   52..63 zero
  64 32s albedo source sha256     96 32s quality source sha256     128 32s payload sha256 (of the plane bytes)
  plane 1: u16 value per cell (626 * 626 * 2 bytes); plane 2: u8 n_q | (bit 7: a qualifying pixel above 1); plane 3: u8 n_in.

Usage: python3 -I phase1/moonsci/build_lamp.py --src <dir with the three retained files> [--out <file>] [--check]
"""
import argparse, base64, gzip, hashlib, json, os, re, struct, sys, zlib

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT_DEFAULT = os.path.join(ROOT, 'assets/moon/lamp/lamp-lya-albedo-s-2009-2010-R1.bin.gz')
SRC = {
    'albed': ('LAMP_80s_240mpp_lya_albed_01.img', '896aa35d377c46b68cc774047638b28451106e28e8a6aa67eb4aeca0358af2e2'),
    'dqual': ('LAMP_80s_240mpp_lya_dqual_01.img', '3f071a9e8afbddc399b2523d6f3995994c9f7f26e27d0e5771de42e1a6ff2754'),
    'docs': ('lamp-docs-labels-2026-11-28.json', 'ac21b5530c3f63e462c3510a57ee55ec1dbe5b7082dde714810a84634d4708b1'),
}
N, P, F, C = 2501, 2504, 4, 626
S, R = 240.0, 1737400.0
HDR = 160
MAGIC = b'MELAMPR1'
SENT, SCALE, CEND, NMIN, CAPLAT = 65535, 1000, 80, 8, 80


def sha(b):
    return hashlib.sha256(b).hexdigest()


def label(docs, name):
    """Layout keywords of one PDS3 label from the retained documents JSON (exact bytes)."""
    for it in docs['items']:
        if it['url'].endswith('/' + name):
            t = base64.b64decode(it['b64']).decode('ascii')
            g = lambda k: re.search(r'^\s*' + k + r'\s*=\s*"?([^"\r\n<]+?)"?\s*(<[^>]*>)?\s*$', t, re.M).group(1).strip()
            return {k: g(k) for k in ('LINES', 'LINE_SAMPLES', 'SAMPLE_TYPE', 'SAMPLE_BITS', 'SCALING_FACTOR', 'OFFSET', 'MAP_SCALE',
                                        'A_AXIS_RADIUS', 'CENTER_LATITUDE', 'START_TIME', 'STOP_TIME')}
    raise SystemExit('label not in the retained documents: ' + name)


def build(src):
    raw = {}
    for k, (f, h) in SRC.items():
        b = open(os.path.join(src, f), 'rb').read()
        if sha(b) != h:
            raise SystemExit(f'{f}: sha256 differs from its pin')
        raw[k] = b
    docs = json.loads(raw['docs'])
    for k in ('albed', 'dqual'):
        L = label(docs, SRC[k][0].replace('.img', '.lbl'))
        want = {'LINES': '2501', 'LINE_SAMPLES': '2501', 'SAMPLE_TYPE': 'PC_REAL', 'SAMPLE_BITS': '32', 'MAP_SCALE': '240',
                'A_AXIS_RADIUS': '1737.4', 'CENTER_LATITUDE': '-90.0'}
        for kk, v in want.items():
            if L[kk] != v and not (kk in ('MAP_SCALE', 'A_AXIS_RADIUS', 'CENTER_LATITUDE') and float(L[kk]) == float(v)):
                raise SystemExit(f'{k} label {kk} = {L[kk]}, expected {v}')
        if float(L['SCALING_FACTOR']) != 1.0 or float(L['OFFSET']) != 0.0:
            raise SystemExit(f'{k} label scaling/offset unexpected')
        if not (L['START_TIME'].startswith('2009-09-01') and L['STOP_TIME'].startswith('2010-10-01')):
            raise SystemExit(f'{k} label period unexpected')
        if len(raw[k]) != int(L['LINES']) * int(L['LINE_SAMPLES']) * 4:
            raise SystemExit(f'{k}: size does not match its label')
    A = np.frombuffer(raw['albed'], '<f4').reshape(N, N).astype(np.float64)
    Q = np.frombuffer(raw['dqual'], '<f4').reshape(N, N)

    x = (np.arange(1, N + 1) - 1251) * S
    XX, YY = np.meshgrid(x, x)                       # XX from sample I, YY from line J
    LAT = -90 + np.degrees(2 * np.arctan(0.5 * np.hypot(XX, YY) / R))
    inside = LAT <= -CAPLAT
    qual = inside & np.isfinite(A) & (Q == 0)

    pad = lambda a, v: np.pad(a, ((0, P - N), (0, P - N)), constant_values=v)
    Ap, qp, ip = pad(A, np.nan), pad(qual, False), pad(inside, False)
    blk = lambda a: a.reshape(C, F, C, F)
    nq = blk(qp).sum((1, 3))
    nin = blk(ip).sum((1, 3))
    assert (nq <= nin).all() and (nin <= 16).all()
    with np.errstate(invalid='ignore', divide='ignore'):
        mean = np.where(blk(qp), blk(Ap), 0.0).sum((1, 3)) / nq
    shown = nq >= NMIN
    mv = mean[shown]
    if not (mv >= 0).all():
        raise SystemExit('a shown mean is negative')
    thou = np.floor(mv * 1000 + 0.5).astype(np.int64)  # non-negative, so half-up is half away from zero
    if thou.max() >= SENT:
        raise SystemExit('a shown value would reach the sentinel')
    val = np.full((C, C), SENT, np.uint16)
    val[shown] = thou
    hi = blk(qp & (Ap > 1)).any((1, 3))
    qb = (nq.astype(np.uint8) | (hi.astype(np.uint8) << 7)).astype(np.uint8)
    payload = val.astype('<u2').tobytes() + qb.tobytes() + nin.astype(np.uint8).tobytes()

    h = bytearray(HDR)
    struct.pack_into('<8sHHHHHHIIHHHHHHHHII', h, 0, MAGIC, 1, HDR, C, F, N, P, int(S * F), int(R), 1251, 15, 2, SCALE, SENT, CEND,
                     NMIN, CAPLAT, 20090901, 20101001)
    h[64:96] = bytes.fromhex(SRC['albed'][1])
    h[96:128] = bytes.fromhex(SRC['dqual'][1])
    h[128:160] = hashlib.sha256(payload).digest()
    rawfile = bytes(h) + payload
    gz = gzip.compress(rawfile, 9, mtime=0)
    stats = {'shown': int(shown.sum()), 'considered': int((nin > 0).sum()), 'hi_cells_shown': int((hi & shown).sum()),
             'top_bin_ge80': int((thou >= CEND).sum()), 'max_thousandths': int(thou.max())}
    return rawfile, gz, stats


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', required=True)
    ap.add_argument('--out', default=OUT_DEFAULT)
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    rawfile, gz, st = build(a.src)
    print(f'MELAMPR1: raw {len(rawfile)} B sha256 {sha(rawfile)}; gzip {len(gz)} B sha256 {sha(gz)}; zlib {zlib.ZLIB_VERSION}; {json.dumps(st)}')
    if a.check:
        old = open(a.out, 'rb').read() if os.path.exists(a.out) else b''
        if old != gz:
            print('CHECK FAILED: the committed file differs from a rebuild')
            sys.exit(1)
        print('check: committed file equals the rebuild byte for byte')
    else:
        os.makedirs(os.path.dirname(a.out), exist_ok=True)
        open(a.out, 'wb').write(gz)


if __name__ == '__main__':
    main()
