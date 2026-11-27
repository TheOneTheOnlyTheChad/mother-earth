#!/usr/bin/env python3
"""Moon item 6 (LEND), bounded assessment step 1.

Reads the retained ALD south-polar product (lend_rdr_alds_20111211.dat) using
the field layout taken from its own PDS4 label inside the retained documents
JSON (no hand-typed offsets), and reports what the file holds.

Usage: python3 -I assess_lend_1.py <dir with the two retained files>
Docs only. Nothing here is drawn on any page.
"""
import hashlib, json, math, re, struct, sys
from collections import Counter

D = sys.argv[1]
DAT = D + '/lend_rdr_alds_20111211.dat'
DOC = D + '/lend-docs-labels-2026-11-27.json'
EXPECT_DAT = 'e6b1c2d54e3e00d649a1229b08507dd10c859039ae2df8e34cdf1480bb0031ef'
EXPECT_DOC = '7283e751f81ad0f69cd1553c9b1d6eaed314b19391d8ffc0a556cdec8cff34ab'

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

assert sha(DAT) == EXPECT_DAT, 'data file hash differs from checkpoint 1'
assert sha(DOC) == EXPECT_DOC, 'documents file hash differs from checkpoint 2'

docs = {d['path']: d for d in json.load(open(DOC))['docs']}
xml = docs['data/2011/20111211/lend_rdr_alds_20111211.xml']['text']
records = int(re.search(r'<Table_Binary>.*?<records>(\d+)</records>', xml, re.S).group(1))
reclen = int(re.search(r'<record_length unit="byte">(\d+)</record_length>', xml).group(1))
t0 = re.search(r'<start_date_time>([^<]+)', xml).group(1)
t1 = re.search(r'<stop_date_time>([^<]+)', xml).group(1)

# Scalar fields (outside groups)
rb = re.search(r'<Record_Binary>(.*?)<Group_Field_Binary>', xml, re.S).group(1)
fields = []
for m in re.finditer(r'<Field_Binary>(.*?)</Field_Binary>', rb, re.S):
    f = m.group(1)
    name = re.search(r'<name>([^<]+)', f).group(1)
    loc = int(re.search(r'<field_location unit="byte">(\d+)', f).group(1))
    typ = re.search(r'<data_type>([^<]+)', f).group(1)
    ln = int(re.search(r'<field_length unit="byte">(\d+)', f).group(1))
    fields.append((name, loc, typ, ln))

raw = open(DAT, 'rb').read()
assert len(raw) == records * reclen, (len(raw), records, reclen)

def val(rec, f):
    name, loc, typ, ln = f
    b = rec[loc - 1: loc - 1 + ln]
    if typ == 'ASCII_String':
        return b.decode('ascii').strip()
    assert typ == 'IEEE754MSBSingle'
    return struct.unpack('>f', b)[0]

rows = []
for i in range(records):
    rec = raw[i * reclen:(i + 1) * reclen]
    rows.append({f[0]: val(rec, f) for f in fields})

out = {'label': {'records': records, 'record_bytes': reclen, 'start': t0, 'stop': t1,
                 'scalar_fields': [f[0] for f in fields]}}

lats = sorted({round(r['LUNARCENTRIC_LATITUDE'], 3) for r in rows})
lons = sorted({round(r['LUNARCENTIC_EAST_LONGITUDE'], 3) for r in rows})
out['grid'] = {'n_lat': len(lats), 'lat_min': lats[0], 'lat_max': lats[-1],
               'n_lon': len(lons), 'lon_min': lons[0], 'lon_max': lons[-1],
               'row0': [rows[0]['LUNARCENTRIC_LATITUDE'], rows[0]['LUNARCENTIC_EAST_LONGITUDE']],
               'row720': [rows[720]['LUNARCENTRIC_LATITUDE'], rows[720]['LUNARCENTIC_EAST_LONGITUDE']]}
out['times'] = {'start_utc_values': Counter(r['START_UTC_TIME'] for r in rows).most_common(3),
                'stop_utc_values': Counter(r['STOP_UTC_TIME'] for r in rows).most_common(3)}

def summ(xs):
    xs = sorted(xs)
    n = len(xs)
    if not n:
        return {'n': 0}
    q = lambda p: xs[min(n - 1, int(p * (n - 1) + 0.5))]
    return {'n': n, 'min': xs[0], 'p01': q(.01), 'p50': q(.5), 'p99': q(.99), 'max': xs[-1]}

per = {}
for det in ['CSETN', 'SETN', 'STN1', 'STN2', 'STN3']:
    e = [r[det + '_EXPOSURE'] for r in rows]
    v = [r[det + '_RATE'] for r in rows]
    s = [r[det + '_ERR'] for r in rows]
    neg1 = sum(1 for x in v if x == -1.0)
    zero_exp = sum(1 for x in e if x <= 0)
    nonfinite = sum(1 for x in v + e + s if not math.isfinite(x))
    good = [(ee, vv, ss) for ee, vv, ss in zip(e, v, s) if vv != -1.0 and ee > 0 and math.isfinite(vv)]
    per[det] = {'rate_minus1': neg1, 'exposure_le0': zero_exp, 'nonfinite': nonfinite,
                'usable_cells': len(good),
                'exposure_s': summ([g[0] for g in good]),
                'rate': summ([g[1] for g in good]),
                'err': summ([g[2] for g in good]),
                'err_over_rate': summ([g[2] / g[1] for g in good if g[1] > 0])}
out['detectors'] = per

# CSETN by latitude ring: median rate, median relative error, median exposure
ring = {}
for r in rows:
    if r['CSETN_RATE'] == -1.0 or r['CSETN_EXPOSURE'] <= 0:
        continue
    k = round(r['LUNARCENTRIC_LATITUDE'], 2)
    ring.setdefault(k, []).append((r['CSETN_RATE'], r['CSETN_ERR'], r['CSETN_EXPOSURE']))
med = lambda a: sorted(a)[len(a) // 2]
out['csetn_by_ring'] = [{'lat': k, 'n': len(a), 'rate_med': round(med([x[0] for x in a]), 4),
                         'err_med': round(med([x[1] for x in a]), 4),
                         'exp_med_s': round(med([x[2] for x in a]), 1)} for k, a in sorted(ring.items())]

# Lowest CSETN cells (suppressed epithermal rate) and their errors: what a map would emphasise
cs = [r for r in rows if r['CSETN_RATE'] != -1.0 and r['CSETN_EXPOSURE'] > 0]
cs.sort(key=lambda r: r['CSETN_RATE'])
out['csetn_lowest10'] = [{'lat': r['LUNARCENTRIC_LATITUDE'], 'lon': r['LUNARCENTIC_EAST_LONGITUDE'],
                          'rate': round(r['CSETN_RATE'], 4), 'err': round(r['CSETN_ERR'], 4),
                          'exp_s': round(r['CSETN_EXPOSURE'], 1)} for r in cs[:10]]
# Neighbour-to-neighbour scatter vs stated error (one ring, 85.25S): is cell-scale structure above counting noise?
k = min(ring, key=lambda x: abs(x + 85.25))
a = [r for r in rows if abs(r['LUNARCENTRIC_LATITUDE'] - k) < 1e-3]
a.sort(key=lambda r: r['LUNARCENTIC_EAST_LONGITUDE'])
d = [a[i + 1]['CSETN_RATE'] - a[i]['CSETN_RATE'] for i in range(len(a) - 1)
     if a[i]['CSETN_RATE'] != -1 and a[i + 1]['CSETN_RATE'] != -1]
se = [math.hypot(a[i + 1]['CSETN_ERR'], a[i]['CSETN_ERR']) for i in range(len(a) - 1)
      if a[i]['CSETN_RATE'] != -1 and a[i + 1]['CSETN_RATE'] != -1]
rms = lambda xs: math.sqrt(sum(x * x for x in xs) / len(xs))
out['csetn_neighbour_check'] = {'ring_lat': k, 'pairs': len(d), 'rms_diff': round(rms(d), 5),
                                'rms_expected_from_err': round(rms(se), 5),
                                'ratio': round(rms(d) / rms(se), 3)}

print(json.dumps(out, indent=1, default=str))
