#!/usr/bin/env python3
"""Tests for phase1/moonsci/build_lend.py (GPT's LEND rev 2 recheck build notes 1-3). Exits 1 on any failure.

A. state counts equal GPT's independent standard-library reduction (11,656 / 1,440 / 317 / 987)
B. an INDEPENDENT reduction written here (pure Python, haversine distances from latitude/longitude, no numpy, no unit vectors)
   reproduces p, the formal estimate and the state of a spread sample of cells at full precision, and their served quantised fields
C. geometry by behaviour, with controlled synthetic fixtures (their own test hashes): a change at one cell must reach a cell across the
   0/360 seam, must reach a cell 15.2 km away on the meridian and must NOT reach one 30.3 km away (fails if the radius were a diameter
   or the seam not wrapped); orientation: row 0 is 89.75 S (all archive-missing), the edge rule falls on rows 18-19 only
D. covariance: a disc entirely inside the reference band and one with no overlap, against the formula evaluated here
E. malformed input (synthetic fixtures with matching test hashes, so the parser's own rules are what reject them): NaN rate, infinite
   error, inconsistent sentinel, zero error, negative rate, fractional exposure, swapped records, wrong period, short file; and the
   hash gate on the real path
F. precision: a cell whose estimate is above the cut-off but rounds to it stays withheld; valid zero rates are not missing
G. the committed asset equals a rebuild byte for byte; header fields
Usage: python3 -I phase1/moonsci/lend/test_build_lend.py <dir with the retained file>
"""
import hashlib, importlib.util, math, os, struct, sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('build_lend', os.environ.get('LEND_BUILDER') or os.path.join(HERE, '..', 'build_lend.py'))   # LEND_BUILDER: mutant runs only
B = importlib.util.module_from_spec(spec); spec.loader.exec_module(B)
SRC = sys.argv[1]
RAW = open(os.path.join(SRC, B.SRC_NAME), 'rb').read()
ASSET = os.path.join(HERE, '..', '..', '..', 'assets', 'moon', 'lend', 'lend-alds-2011-2016-R1.bin')
passed = failed = 0


def ok(name, cond, info=''):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print('FAIL', name, info)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def put(raw, i, loc, v):
    b = bytearray(raw)
    b[i * 310 + loc - 1:i * 310 + loc + 3] = struct.pack('>f', v)
    return bytes(b)


def build_raw(raw):
    cells = B.parse(raw, expect_sha=sha(raw))
    res, ref, ref_err = B.reduce(cells)
    return res, ref, ref_err, B.pack(res, ref, ref_err, src_sha=sha(raw))


def refuses(name, raw, word):
    try:
        B.parse(raw, expect_sha=sha(raw))
        ok('E ' + name + ' refused', False, 'accepted')
    except B.BuildError as e:
        ok('E ' + name + ' refused for the right reason', word in str(e), str(e))


idx = lambda r, c: r * 720 + c
res, ref, ref_err, out = build_raw(RAW)

# ---- A
cnt = {s: sum(1 for k in res if k['state'] == s) for s in range(4)}
ok('A counts equal GPT independent', cnt == {0: 11656, 1: 987, 2: 317, 3: 1440}, cnt)

# ---- B independent reduction (haversine on lat/lon in degrees; candidate rows within 3; pure Python)
recs = []
for i in range(14400):
    r = RAW[i * 310:(i + 1) * 310]
    g = lambda loc: struct.unpack('>f', r[loc - 1:loc + 3])[0]
    recs.append((g(47), g(51), g(107), g(111), g(115)))
RK, RAD = 1737.4, 30.0


def hav(a1, o1, a2, o2):
    a1, o1, a2, o2 = map(math.radians, (a1, o1, a2, o2))
    h = math.sin((a2 - a1) / 2) ** 2 + math.cos(a1) * math.cos(a2) * math.sin((o2 - o1) / 2) ** 2
    return 2 * RK * math.asin(min(1.0, math.sqrt(h)))


usable = lambda t: t[3] != -1.0
band = [j for j, t in enumerate(recs) if usable(t) and -84.75 - 1e-6 <= t[0] <= -80.25 + 1e-6]
WB = sum(1 / recs[j][4] ** 2 for j in band)
r_ind = sum(recs[j][3] / recs[j][4] ** 2 for j in band) / WB
bandset = set(band)
ok('B reference mean independent', abs(r_ind - ref) < 1e-12, (r_ind, ref))


def indep(i):
    la, lo = recs[i][0], recs[i][1]
    rw = i // 720
    WD = S = WDB = 0.0
    n = 0
    near = False
    for rr in range(max(0, rw - 3), min(20, rw + 4)):
        for cc in range(720):
            j = rr * 720 + cc
            if hav(la, lo, recs[j][0], recs[j][1]) <= RAD:
                if not usable(recs[j]):
                    near = True
                    continue
                w = 1 / recs[j][4] ** 2
                WD += w; S += w * recs[j][3]; n += 1
                if j in bandset:
                    WDB += w
    m = S / WD
    p = 100 * (m / r_ind - 1)
    e = 100 * math.sqrt(1 / WD / r_ind ** 2 + m ** 2 / WB / r_ind ** 4 - 2 * m * (WDB / (WD * WB)) / r_ind ** 3)
    st = 3 if la + math.degrees(RAD / RK) > -80 else (2 if e > 0.5 else 0)
    return p, e, st, n, near


sample = sorted(set(list(range(720, 14400, 97)) + [idx(18, 5), idx(19, 300), idx(1, 0), idx(2, 719), idx(17, 360)]))
sample = [i for i in sample if usable(recs[i])]
worst = 0.0
for i in sample:
    p, e, st, n, near = indep(i)
    k = res[i]
    worst = max(worst, abs(p - k['p']), abs(e - k['e']))
    ok('B state %d' % i, st == k['state'], (st, k['state']))
    ok('B support %d' % i, n == k['n'] and int(near) == k['near'], (n, k['n'], near, k['near']))
    rec = struct.unpack_from('<BBhHHH', out, 160 + 10 * i)
    if st == 0:
        ok('B served %d' % i, rec[2] == B.q100(p) and rec[3] == B.q100(e), (rec, p, e))
ok('B full-precision agreement < 1e-9', worst < 1e-9, worst)
print('B sample cells', len(sample), 'worst difference', worst)

# ---- C geometry by behaviour (synthetic fixtures)
def p_at(raw, i):
    return build_raw(raw)[0][i]['p']


ring = 9   # 85.25 S
base = {i: res[i]['p'] for i in (idx(ring, 0), idx(ring, 360), idx(ring, 100))}
seam = put(RAW, idx(ring, 719), 111, 9.0)          # a large change at 359.75 E
rs = build_raw(seam)[0]
ok('C seam reaches 0.25 E', abs(rs[idx(ring, 0)]['p'] - base[idx(ring, 0)]) > 0.01)
ok('C seam does not reach 180.25 E', abs(rs[idx(ring, 360)]['p'] - base[idx(ring, 360)]) < 1e-12)
ok('C orientation: meridian distances', abs(hav(-85.25, 100.25, -86.25, 100.25) - 30.32) < 0.01 and abs(hav(-85.25, 100.25, -85.75, 100.25) - 15.16) < 0.01)
# radius test on the 87.25 S ring (row 5): both meridian neighbours lie outside the reference band, so a change there cannot reach the
# result through the reference mean (a first version of this test used 84.75/84.25 S, inside the band, and so tested nothing)
rr = 5
b5 = res[idx(rr, 100)]['p']
near_ = build_raw(put(RAW, idx(rr - 1, 100), 111, 9.0))[0]   # row 4 = 87.75 S, 15.16 km away on the meridian
far_ = build_raw(put(RAW, idx(rr - 2, 100), 111, 9.0))[0]    # row 3 = 88.25 S, 30.32 km away
ok('C radius cells outside the band', all(not (-84.75 - 1e-6 <= recs[idx(q, 100)][0] <= -80.25 + 1e-6) for q in (3, 4, 5)))
ok('C 15.2 km cell is inside the 30 km radius', abs(near_[idx(rr, 100)]['p'] - b5) > 0.01)
ok('C 30.3 km cell is outside the 30 km radius (it would be inside if the radius were 60 km)', abs(far_[idx(rr, 100)]['p'] - b5) < 1e-12)
row0 = [res[idx(0, c)]['state'] for c in range(720)]
ok('C row 0 (89.75 S) all archive-missing', all(s == 1 for s in row0))
edge_rows = sorted({i // 720 for i, k in enumerate(res) if k['state'] == 3})
ok('C edge rule on rows 18-19 only (80.75 and 80.25 S)', edge_rows == [18, 19], edge_rows)
ok('C record 0 is 89.75 S 0.25 E', recs[0][0] == B.f32(-89.75) and recs[0][1] == B.f32(0.25))

# ---- D covariance cases
for name, i, overlap in (('inside band', idx(15, 200), True), ('no overlap', idx(4, 200), False)):
    p, e, st, n, near = indep(i)
    k = res[i]
    la = recs[i][0]
    shares = any(j in bandset for j in range(14400) if usable(recs[j]) and abs(recs[j][0] - la) < 1.1 and hav(la, recs[i][1], recs[j][0], recs[j][1]) <= RAD)
    ok('D %s overlap as expected' % name, shares == overlap)
    ok('D %s estimate equals the formula here' % name, abs(e - k['e']) < 1e-9, (e, k['e']))

# ---- E malformed fixtures
i0 = idx(10, 10)
refuses('NaN rate', put(RAW, i0, 111, float('nan')), 'not finite')
refuses('infinite error', put(RAW, i0, 115, float('inf')), 'not finite')
refuses('inconsistent sentinel (rate -1, exposure 5)', put(RAW, i0, 111, -1.0), 'inconsistent')
refuses('zero error', put(RAW, i0, 115, 0.0), 'inconsistent')
refuses('negative rate', put(RAW, i0, 111, -0.5), 'inconsistent')
refuses('fractional exposure', put(RAW, i0, 107, 12.5), 'inconsistent')
sw = bytearray(RAW); a, b = idx(10, 10), idx(10, 11)
sw[a * 310:(a + 1) * 310], sw[b * 310:(b + 1) * 310] = RAW[b * 310:(b + 1) * 310], RAW[a * 310:(a + 1) * 310]
refuses('swapped records', bytes(sw), 'coordinates')
pr = bytearray(RAW); pr[i0 * 310:i0 * 310 + 23] = b'2011-12-12T00:00:00.000'
refuses('wrong period', bytes(pr), 'period')
refuses('short file', RAW[:-310], 'length')
try:
    B.parse(put(RAW, i0, 111, 4.5))   # a changed source with the REAL pin: the hash gate (not a parser rule) refuses it
    ok('E hash gate', False)
except B.BuildError as e:
    ok('E hash gate refuses a changed source', 'sha256' in str(e), str(e))

# ---- F precision and valid zero
cands = [k for k in res if k['state'] in (0, 2) and 0.49 < k['e'] < 0.5]
k0 = max(cands, key=lambda k: k['e'])
i_k = res.index(k0)
saved = B.CUTOFF_PP
try:
    B.CUTOFF_PP = k0['e'] - 1e-7          # the estimate is above the cut-off at full precision but rounds to the same 0.01
    r2 = B.reduce(B.parse(RAW))[0]
    ok('F rounding cannot show a withheld cell', r2[i_k]['state'] == 2 and B.q100(k0['e']) == B.q100(B.CUTOFF_PP), (r2[i_k]['state'], k0['e']))
finally:
    B.CUTOFF_PP = saved
zeros = [i for i, t in enumerate(recs) if t[3] == 0.0]
ok('F six valid zero rates exist', len(zeros) == 6, len(zeros))
ok('F valid zero is never archive-missing', all(res[i]['state'] != 1 and res[i]['exp'] > 0 for i in zeros))

# ---- G asset and header
asset = open(ASSET, 'rb').read()
ok('G committed asset equals rebuild', asset == out)
h = struct.unpack_from('<8sHHHHHhHHHHIIhhhHIIdd', asset, 0)
ok('G header', h[:20] == (b'MELENDR1', 1, 160, 20, 720, 10, -8975, 50, 25, 50, 50, 30000, 1737400, -8475, -8025, -8000, 0, 20111211, 20160914, ref), h[:20])
ok('G source and payload hashes', asset[96:128].hex() == B.SRC_SHA and asset[128:160] == hashlib.sha256(asset[160:]).digest())
ok('G zero padding 68-95', asset[68:96] == b'\0' * 28)

print('test_build_lend: %d passed, %d failed' % (passed, failed))
sys.exit(1 if failed else 0)
