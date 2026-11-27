"""Moon item 5 (CRaTER), proposal rev 2: reproducible preview of the R1 chart's bins (assessment tooling, not served).

Rules (proposal rev 2 §7.2-§7.4):
- Source: L2 SEC day files 2026-161 and 2026-162, pinned by archive MD5 and our sha256.
- Strict fixed-field parse: 194-byte CRLF records, 32 fields, finite values, non-negative integer counters,
  TOTAL == GOOD + REJECT, TIME a valid "YYYY-MM-DDThh:mm:ss" UTC string on the file's own day,
  TIME strictly increasing with no duplicates. Any failure stops the build (exit 1).
- A record is NOMINAL when BIASCNTRL=1, BIASCMD=1, CALLOW=0, CALHIGH=0, PROCDFLAG 1-6 = 1,
  DISCTHIN=71, DISCTHICK=71, MASK 1 = MASK 2 = 4294967295 (the values of every record on 10-11 June).
- Binning by UTC record timestamps: a record belongs to bin k when start_k <= TIME < start_k + 600 s
  (left edge included, right edge excluded). Bins: 144 on 10 June (00:00 ... 23:50) plus 11 June 00:00-00:10.
- A bin is SHOWN only when it holds exactly 600 records, one per whole UTC second, all NOMINAL.
  Otherwise it is WITHHELD with its reason and record counts; never zero-filled, never interpolated.
- Rate = N / T with N = sum of GOOD over the bin's records, T = 600 s nominal (one second per readout record;
  no live-time or dead-time correction). Bar = sqrt(N) / T: an approximate 1-sigma Poisson counting
  benchmark, conditional on independent events, computed by Mother Earth (not an archive field).
Usage: python3 -I bins_preview.py <acquisitions dir> <out json> [--tamper NAME]
Tamper cases (each must change the outcome as stated): drop, dup, order, setting, neg, total, badtime.
"""
import sys, json, hashlib, math, re
from datetime import datetime, timedelta, timezone

SRC, OUT = sys.argv[1], sys.argv[2]
TAMPER = sys.argv[4] if len(sys.argv) > 4 and sys.argv[3] == '--tamper' else None
FILES = [
    ('CRAT_L2_SEC_2026161_V01.TAB', '2026-06-10', 'd0b470e61745fbc88542043c8f3a4812',
     'f6d2c5373b4c72d341375bff438cd346b0abeb6c55be0bff3d80f4d294c35e25'),
    ('CRAT_L2_SEC_2026162_V01.TAB', '2026-06-11', 'febb2bf5aa67f9192ac046239ec258f2',
     '81a547a42571f6b6b691d18642ae5ba0b4057d112ee059a5cf2469b25b270049'),
]
NOMINAL = {3: 1, 4: 1, 5: 0, 6: 0, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 16: 71, 17: 71,
           18: 4294967295, 19: 4294967295}  # 0-based field index -> required value
TRE = re.compile(r'^"(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)"$')

def fail(msg):
    print('BUILD FAIL:', msg); sys.exit(1)

recs = []  # (utc datetime, good, nominal)
for fn, day, md5, sha in FILES:
    raw = open(f'{SRC}/{fn}', 'rb').read()
    if TAMPER is None:
        if hashlib.md5(raw).hexdigest() != md5 or hashlib.sha256(raw).hexdigest() != sha:
            fail(f'{fn} hash mismatch')
    if len(raw) % 194:
        fail(f'{fn} length not a multiple of 194')
    lines = [raw[i:i + 194] for i in range(0, len(raw), 194)]
    if fn.endswith('161_V01.TAB') and TAMPER:
        L = lines
        if TAMPER == 'drop': del L[3605]                      # one record missing in bin 6 (01:00-01:10)
        if TAMPER == 'dup': L.insert(3606, L[3605])             # duplicate timestamp
        if TAMPER == 'order': L[3605], L[3606] = L[3606], L[3605]
        if TAMPER == 'setting': L[7300] = L[7300][:39] + b'1' + L[7300][40:]   # CALLOW=1 at 02:01:40
        if TAMPER == 'neg': L[100] = L[100][:139] + b'   -1' + L[100][144:]  # GOOD = -1
        if TAMPER == 'total': L[100] = L[100][:151] + b'99999' + L[100][156:]  # TOTAL != GOOD + REJECT
        if TAMPER == 'badtime': L[100] = L[100][:13] + b'"2026-06-10T00:01:61"' + L[100][34:]  # quoted TIME is bytes 13-33
    prev = None
    for r in lines:
        if not r.endswith(b'\r\n'):
            fail('record without CRLF')
        f = r[:-2].decode('ascii').split(',')
        if len(f) != 32:
            fail('field count')
        m = TRE.match(f[2].strip())
        if not m:
            fail(f'TIME not a quoted YMD time: {f[2]!r}')
        try:
            t = datetime.strptime(m.group(1), '%Y-%m-%dT%H:%M:%S').replace(tzinfo=timezone.utc)
        except ValueError:
            fail(f'TIME not a valid UTC time: {m.group(1)}')
        if m.group(1)[:10] != day:
            fail(f'TIME {m.group(1)} outside the file day {day}')
        if prev is not None and t <= prev:
            fail(f'TIME not strictly increasing at {m.group(1)}')
        prev = t
        ints = [int(f[i]) for i in range(32) if i not in (2, 29, 30, 31)]
        if any(v < 0 for v in ints):
            fail(f'negative integer field at {m.group(1)}')
        vec = [float(f[i]) for i in (29, 30, 31)]
        if not all(math.isfinite(v) for v in vec):
            fail('non-finite MOONVEC')
        good, rej, tot = int(f[26]), int(f[27]), int(f[28])
        if tot != good + rej:
            fail(f'TOTAL != GOOD + REJECT at {m.group(1)}')
        nominal = all(int(f[i]) == v for i, v in NOMINAL.items())
        recs.append((t, good, nominal))

T0 = datetime(2026, 6, 10, tzinfo=timezone.utc)
bins = []
for k in range(145):
    s, e = T0 + timedelta(seconds=600 * k), T0 + timedelta(seconds=600 * (k + 1))
    inb = [r for r in recs if s <= r[0] < e]
    secs = {r[0] for r in inb}
    n_nom = sum(1 for r in inb if r[2])
    complete = len(inb) == 600 and len(secs) == 600 and n_nom == 600
    b = {'start': s.strftime('%Y-%m-%dT%H:%M:%SZ'), 'end': e.strftime('%Y-%m-%dT%H:%M:%SZ'),
         'records': len(inb), 'nominal_records': n_nom}
    if complete:
        N = sum(r[1] for r in inb)
        b.update({'good_events': N, 'exposure_s': 600, 'rate_per_s': round(N / 600, 3),
                  'poisson_benchmark_per_s': round(math.sqrt(N) / 600, 3)})
    else:
        b.update({'withheld': 'incomplete' if len(inb) != 600 or len(secs) != 600 else 'non-nominal setting'})
    bins.append(b)

out = {
    'schema': 'crater-good-bins-preview-1', 'kind': 'dated example (archived record, not live)',
    'source': {'product': 'LRO CRaTER L2 secondary science (DDR), collection urn:nasa:pds:lro-crater:data-der-sec v2.4',
               'doi': '10.17189/2c1t-ph72', 'release': 67,
               'files': [{'name': f[0], 'md5': f[2], 'sha256': f[3]} for f in FILES], 'field': 'GOOD (Good Events Counter)'},
    'binning': 'by UTC record timestamp (TIME field, whole seconds); bin = [start, end), 600 s; one record per readout (~1 s, tagged at the readout); no live-time correction',
    'shown_rule': 'exactly 600 records, one per whole UTC second, all nominal; otherwise withheld',
    'bar': 'sqrt(N)/T: approximate 1-sigma Poisson counting benchmark, conditional on independent events; computed by Mother Earth; excludes timing, dead time, configuration and physical variability',
    'units': {'rate_per_s': 'events per second', 'poisson_benchmark_per_s': 'events per second'},
    'bins': bins}
js = json.dumps(out, separators=(',', ':'), ensure_ascii=False)
open(OUT, 'w').write(js)
shown = [b for b in bins if 'rate_per_s' in b]
print('tamper:', TAMPER, '| bins', len(bins), '| shown', len(shown), '| withheld', len(bins) - len(shown),
      [(b['start'], b['withheld'], b['records'], b['nominal_records']) for b in bins if 'withheld' in b][:3])
print('JSON bytes', len(js.encode()), 'sha256', hashlib.sha256(js.encode()).hexdigest())
if shown:
    r = [b['rate_per_s'] for b in shown]
    print('rate per s: min %.3f max %.3f | first bin %s %.3f +- %.3f | last bin %s %.3f +- %.3f' % (
        min(r), max(r), shown[0]['start'], shown[0]['rate_per_s'], shown[0]['poisson_benchmark_per_s'],
        bins[-1]['start'], bins[-1].get('rate_per_s', float('nan')), bins[-1].get('poisson_benchmark_per_s', float('nan'))))
    print('sum of GOOD over the 144 bins of 10 June:', sum(b['good_events'] for b in bins[:144] if 'good_events' in b))
    print('example bins:', json.dumps([bins[i] for i in (0, 62, 143, 144)], ensure_ascii=False))
