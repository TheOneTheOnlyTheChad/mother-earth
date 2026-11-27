"""Fault and agreement tests for phase1/moonsci/build_crater.py (GPT's rev 2 build note 1: fault modes kept out of the builder).
Imports the builder and feeds it altered copies of the retained bytes; never writes the committed asset.
Usage: python3 -I phase1/moonsci/crater/test_build_crater.py <retained dir>
Exit 1 if any check fails. Each case prints PASS/FAIL with what it expected."""
import sys, os, json, hashlib, tempfile, shutil, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.dirname(HERE))
import build_crater as B  # noqa: E402

SRC = sys.argv[1]
RAW = {n: open(os.path.join(SRC, n), 'rb').read() for n, *_ in B.FILES}
F1, F2 = B.FILES
passed = failed = 0


def ok(name, cond, info=''):
    global passed, failed
    if cond:
        passed += 1; print('PASS', name)
    else:
        failed += 1; print('FAIL', name, info)


def expect_error(name, fn, needle):
    try:
        fn()
    except B.BuildError as e:
        ok(name, needle in str(e), f'error was: {e}')
        return
    ok(name, False, 'no BuildError raised')


def rec(raw, k):
    return bytearray(raw[k * B.REC:(k + 1) * B.REC])


def with_record(raw, k, new):
    return raw[:k * B.REC] + bytes(new) + raw[(k + 1) * B.REC:]


def bins_from(raw1, n1=86400):
    recs = B.parse(raw1, F1[0], F1[1], n1) + B.parse(RAW[F2[0]], F2[0], F2[1], F2[4])
    return B.make_bins(recs)


# ---- 1. the committed asset equals a fresh build, and agrees with the research preview (a different, comma-split parser)
b, doc, good_sel = B.build(SRC)
committed = open(B.OUT, 'rb').read()
ok('A1 fresh build equals the committed asset byte for byte', b == committed)
ok('A2 145 rows, all shown; 10 June total 2,573,044; extra bin 17,787',
   len(doc['rows']) == 145 and all(r[0] is not None for r in doc['rows']) and sum(r[0] for r in doc['rows'][:144]) == 2573044 and doc['rows'][144][0] == 17787)
pv = json.load(open(os.path.join(ROOT, 'docs/research/moon-crater/bins-preview-2026-11-27.json')))['bins']
ok('A3 every bin N equals the research preview', all(r[0] == p['good_events'] and r[1] == p['exposure_s'] == 600 for r, p in zip(doc['rows'], pv)) and len(pv) == 145)
ok('A4 GOOD over selected records = 10 June + extra bin', good_sel == 2573044 + 17787)

# ---- 2. integrity before parsing
d = tempfile.mkdtemp()
try:
    for n, *_ in B.FILES:
        shutil.copy(os.path.join(SRC, n), d)
    p = os.path.join(d, F1[0]); x = bytearray(open(p, 'rb').read()); x[150] = ord('9') if x[150] != ord('9') else ord('8'); open(p, 'wb').write(x)
    expect_error('B1 one changed byte: stopped by the hash check before parsing', lambda: B.build(d), 'MD5 differs')
    r = subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'phase1/moonsci/build_crater.py'), '--src', d, '--check'], capture_output=True, text=True)
    ok('B2 command line: changed input exits 1 with BUILD FAIL, even with --check', r.returncode == 1 and 'BUILD FAIL' in r.stdout, r.stdout)
    r = subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'phase1/moonsci/build_crater.py'), '--src', SRC, '--tamper', 'drop'], capture_output=True, text=True)
    ok('B3 an unknown argument is refused (exit 2), no build', r.returncode == 2 and 'unrecognized arguments' in r.stderr, r.stderr)
    alt = os.path.join(d, 'committed.json'); open(alt, 'wb').write(committed.replace(b'"release":67', b'"release":68'))
    r = subprocess.run([sys.executable, '-I', os.path.join(ROOT, 'phase1/moonsci/build_crater.py'), '--src', SRC, '--out', alt, '--check'], capture_output=True, text=True)
    ok('B4 --check against an altered committed file fails', r.returncode == 1 and 'CHECK FAIL' in r.stdout, r.stdout)
finally:
    shutil.rmtree(d)

# ---- 3. strict parse (the hash check is bypassed here by calling parse() directly on altered bytes)
R1 = RAW[F1[0]]
k = 3605  # 2026-06-10T01:00:05
expect_error('C1 one record removed: wrong length for the label count', lambda: B.parse(R1[:k * B.REC] + R1[(k + 1) * B.REC:], F1[0], F1[1], F1[4]), 'bytes, expected')
dup = R1[:(k + 1) * B.REC] + R1[k * B.REC:(k + 1) * B.REC] + R1[(k + 1) * B.REC:-B.REC]
expect_error('C2 duplicated record', lambda: B.parse(dup, F1[0], F1[1], F1[4]), 'not strictly increasing')
sw = R1[:k * B.REC] + R1[(k + 1) * B.REC:(k + 2) * B.REC] + R1[k * B.REC:(k + 1) * B.REC] + R1[(k + 2) * B.REC:]
expect_error('C3 two records swapped', lambda: B.parse(sw, F1[0], F1[1], F1[4]), 'not strictly increasing')
r = rec(R1, 100); r[139:144] = b'   -1'
expect_error('C4 negative GOOD', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'not a non-negative integer')
r = rec(R1, 100); r[151:156] = b'99999'
expect_error('C5 TOTAL != GOOD + REJECT', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'TOTAL != GOOD + REJECT')
r = rec(R1, 100); r[14:33] = b'2026-06-10T00:01:61'
expect_error('C6 invalid UTC time', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'not a valid UTC time')
r = rec(R1, 100); r[14:33] = b'2026-06-11T00:01:40'
expect_error('C7 time outside the file day', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'outside the file day')
r = rec(R1, 100); r[34] = ord(';')
expect_error('C8 separator missing at a label boundary', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'no separator after TIME')
r = rec(R1, 100); r[13] = ord(' ')
expect_error('C9 TIME not quoted at its label location', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'TIME not quoted')
r = rec(R1, 100); r[39] = ord('2')
expect_error('C10 flag outside 0/1', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'flag CALLOW = 2')
r = rec(R1, 100); r[157:168] = b'-1.70e+03  '
expect_error('C11 MOONVEC not in %11.4e form', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'not in %11.4e form')
r = rec(R1, 100); r[192:194] = b'\n\n'
expect_error('C12 record without CRLF', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'no CRLF')
r = rec(R1, 100); r[120] = 0xC3
expect_error('C13 non-ASCII byte', lambda: B.parse(with_record(R1, 100, r), F1[0], F1[1], F1[4]), 'not ASCII')

# ---- 4. bins: withheld, never zero, never a partial exposure; edges
short = R1[:k * B.REC] + R1[(k + 1) * B.REC:]
bins, n_sel, good = bins_from(short, 86399)
ok('D1 one record missing: only bin 01:00-01:10 withheld as incomplete (599 records), no zero, no 599 s exposure',
   bins[6] == {'withheld': 'incomplete', 'records': 599, 'nominal': 599} and all('N' in x for i, x in enumerate(bins) if i != 6))
expect_error('D2 the build refuses when records are missing from the selection (87,000 expected)', lambda: B.assemble(bins, n_sel, good), 'selected records')
r = rec(R1, 7300); r[39] = ord('1')  # CALLOW = 1 at 02:01:40
bins, n_sel, good = bins_from(with_record(R1, 7300, r))
ok('D3 one non-nominal record: bin 02:00-02:10 withheld as non-nominal (600 records, 599 nominal)', bins[12] == {'withheld': 'non-nominal setting', 'records': 600, 'nominal': 599})
doc2 = B.assemble(bins, n_sel, good)
ok('D4 a withheld bin is written as [null, null, reason, records, nominal], not a number', doc2['rows'][12] == [None, None, 'non-nominal setting', 600, 599])
r = rec(R1, 600); r[139:144] = b'    0'; r[151:156] = (str(int(r[145:150])).rjust(5)).encode()  # GOOD 0, TOTAL = REJECT
recs = B.parse(with_record(R1, 600, r), F1[0], F1[1], F1[4]) + B.parse(RAW[F2[0]], F2[0], F2[1], F2[4])
bins, *_ = B.make_bins(recs)
ok('D5 a record with GOOD 0 stays shown (zero is a value, not missing)', 'N' in bins[1] and bins[1]['N'] == doc['rows'][1][0] - int(rec(R1, 600)[139:144]))
recs = B.parse(R1, F1[0], F1[1], F1[4]) + B.parse(RAW[F2[0]], F2[0], F2[1], F2[4])
first10 = [t for t, _ in recs if t.strftime('%H:%M:%S') == '00:10:00' and t.day == 10][0]
inb0 = [t for t, _ in recs if B.T0 <= t < B.T0 + B.timedelta(seconds=600)]
ok('D6 edges: the record at 00:10:00 is in the second bin; the first bin ends at 00:09:59', first10 not in inb0 and max(inb0).strftime('%H:%M:%S') == '00:09:59' and len(inb0) == 600)
last = [t for t, _ in recs if B.T0 <= t < B.END][-1]
ok('D7 the selection ends at 2026-06-11 00:09:59 (the extra bin) and nothing later of 11 June is used', last.strftime('%Y-%m-%dT%H:%M:%S') == '2026-06-11T00:09:59')

print(f'test_build_crater: {passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
