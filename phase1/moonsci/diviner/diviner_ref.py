#!/usr/bin/env python3
"""Independent Python reference for the Diviner GCP reduction (MOON-DIVINER-PROPOSAL rev 2 §6; build tooling, not served).

Usage: python3 -I diviner_ref.py <file.tab> <lat0x100> <lonStart> <nLon> [--header] [--extract OUT.i32]
Prints JSON: one entry per cell {lonx100, latx100, noon: {value, n, range}, mid: {...}} plus record and sentinel counts.
Written separately from gcp_stream.js (Decimal text parsing, Python integers) so the two can be compared cell for cell.
Exits 1 on any structural or value failure."""
import sys
import json
from decimal import Decimal

NOON = (46, 47, 48, 49)
MID = (94, 95, 0, 1)


def fail(msg):
    print('FAIL ' + msg)
    sys.exit(1)


def main():
    a = sys.argv[1:]
    path, lat0, lon_start, n_lon = a[0], int(a[1]), int(a[2]), int(a[3])
    header = '--header' in a
    out = a[a.index('--extract') + 1] if '--extract' in a else None
    raw = open(path, 'rb').read()
    if header:
        raw = raw[113:]
    if len(raw) % 113:
        fail('length not a multiple of 113')
    n = len(raw) // 113
    if n != n_lon * 1920:
        fail(f'records {n} where {n_lon * 1920} expected')
    ext = bytearray()
    acc = {}
    sent = {'empty': 0, 'invalid': 0}
    for r in range(n):
        rec = raw[r * 113:(r + 1) * 113]
        if rec[111:] != b'\r\n':
            fail(f'record {r}: no CRLF')
        f = rec[:111].decode('ascii').split(',')
        if len(f) != 11:
            fail(f'record {r}: fields')
        li, lj, k = r // 1920, (r // 96) % 20, r % 96
        lon, lat, lt = (int(Decimal(x.strip()) * 100) for x in f[:3])
        if lon != -17975 + 50 * (lon_start + li) or lat != lat0 + 50 * lj or lt not in (25 * k + 12, 25 * k + 13):
            fail(f'record {r}: coordinates')
        t = f[10].strip()
        if t == '-9999':
            v = -99990000; sent['empty'] += 1
        elif t == '-9998':
            v = -99980000; sent['invalid'] += 1
        else:
            d = Decimal(t)
            if d.as_tuple().exponent < -4:
                fail(f'record {r}: more than 4 decimals')
            v = int(d * 10000)
            if not (10000 < v < 4500000):
                fail(f'record {r}: tbol out of bounds')
            for name, bins in (('noon', NOON), ('mid', MID)):
                if k in bins:
                    acc.setdefault((li, lj, name), []).append(v)
        ext += v.to_bytes(4, 'little', signed=True)
    cells = []
    for li in range(n_lon):
        for lj in range(20):
            latx = lat0 + 50 * lj
            e = {'lonx100': -17975 + 50 * (lon_start + li), 'latx100': latx}
            for name, mask in (('noon', 7000), ('mid', 8000)):
                vals = acc.get((li, lj, name), [])
                if abs(latx) > mask:
                    e[name] = {'value': 1, 'n': 0, 'range': 255}
                elif not vals:
                    e[name] = {'value': 0, 'n': 0, 'range': 255}
                else:
                    m = len(vals)
                    value = (sum(vals) + m * 500) // (m * 1000)
                    rng = 255
                    if m >= 2:
                        dd = max(vals) - min(vals)
                        rng = 254 if dd >= 2535000 else (dd + 5000) // 10000
                    e[name] = {'value': value, 'n': m, 'range': rng}
            cells.append(e)
    if out:
        open(out, 'wb').write(bytes(ext))
    print(json.dumps({'records': n, 'sentinels': sent, 'cells': cells}))


main()
