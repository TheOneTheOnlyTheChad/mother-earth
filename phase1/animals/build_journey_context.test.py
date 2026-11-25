#!/usr/bin/env python3
"""Offline controls for build_journey_context.py (no network, no provider file). Run: python3 -I phase1/animals/build_journey_context.test.py"""
import os, sys, tempfile, json
from datetime import date, datetime, timezone
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import build_journey_context as B

H = 'latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type'
def row(lat=-19.0, lon=23.0, d='2008-01-10', t='1200', sat='Terra', typ='0', frp='10.0'):
    return f'{lat},{lon},320.0,1.0,1.0,{d},{t},{sat},MODIS,80,6.03,300.0,{frp},D,{typ}'
FIRST = datetime(2007, 10, 25, 8, 1, 53, tzinfo=timezone.utc); LAST = datetime(2008, 10, 22, 23, 0, 45, tzinfo=timezone.utc)
def count(*windows): return B.count_fires([(date.fromisoformat(s), n, H + '\n' + '\n'.join(rows)) for s, n, rows in windows], FIRST, LAST)

passed = failed = 0
def check(name, cond, detail=''):
    global passed, failed
    if cond: passed += 1; print('PASS', name)
    else: failed += 1; print('FAIL', name, detail)
def refused(f):
    try: f(); return False
    except B.Refuse: return True

c = count(('2007-10-25', 5, [row(d='2007-10-25', t='800'), row(d='2007-10-25', t='801', lon=23.1), row(d='2007-10-25', t='0801', lon=23.2, sat='Aqua')]),
          ('2008-10-19', 4, [row(d='2008-10-22', t='2300'), row(d='2008-10-22', t='2301', lon=23.1)]))
check('endpoint minutes: 08:00 on 25 Oct out, 08:01 in (unpadded "801" and padded "0801"), 23:00 on 22 Oct in, 23:01 out', c['total'] == 3 and c['outside_t'] == 2, c)
m = c['months']
check('13 month rows; the first is "25–31 Oct 2007" and the last "1–22 Oct 2008", both part-months; the eleven between are whole',
      len(m) == 13 and m[0]['label'] == '25–31 Oct 2007' and m[-1]['label'] == '1–22 Oct 2008' and m[0]['part_month'] and m[-1]['part_month'] and not any(x['part_month'] for x in m[1:-1]), [x['label'] for x in m])
check('the part-month ends use the minute-rounded fixes', m[0]['from_utc'] == '2007-10-25T08:01Z' and m[-1]['to_utc'] == '2008-10-22T23:00Z')
check('monthly rows sum to the total', sum(x['count'] for x in m) == c['total'])
c = count(('2008-01-08', 5, [row(lon=24.0), row(lon=28.0, t='1201'), row(lat=-18.0, t='1202'), row(lat=-22.0, t='1203')]))
check('a row outside the requested box stops the build (the extractor\'s own row check)', refused(lambda: count(('2008-01-08', 5, [row(lon=19.9999)]))))
check('edges: 24° E (shared) counts once, in 17_51; 28° E and 18° S (outer north/east) are outside; 22° S (outer south) is inside 17_50',
      c['total'] == 2 and c['by_cell'] == {'17_50': 1, '17_51': 1} and c['outside_u'] == 2, c)
c = count(('2008-01-08', 5, [row()]), ('2008-01-08', 5, [row()]))
check('an identical row in two responses counts once and is recorded as dropped', c['total'] == 1 and c['dup'] == 1)
check('two rows with the same identity but different values stop the build', refused(lambda: count(('2008-01-08', 5, [row(), row(frp='99.0')]))))
c = count(('2008-01-08', 5, [row(typ='2'), row(typ='3', t='1300'), row(t='1400')]))
check('type 2 and 3 are counted apart and never in the shown count', c['total'] == 1 and c['other_types'] == {'2': 1, '3': 1})
c = count(('2008-01-08', 5, []))
check('a header-only response is a valid zero: total 0, every month 0', c['total'] == 0 and all(x['count'] == 0 for x in c['months']))
check('a row with time 2460 stops the build', refused(lambda: count(('2008-01-08', 5, [row(t='2460')]))))
check('a row outside its window stops the build', refused(lambda: count(('2008-01-08', 5, [row(d='2008-02-01')]))))
check('the WGS84 area formula reproduces the Earth\'s surface, 510,065,621.7 km²', B.area_reference()['ok'])
check('one 4° zebra cell is 185,321.0 km² on the ellipsoid (the hub grid\'s sphere gives 185,861)', round(B.zone_area_m2(-22, -18, 4) / 1e6, 1) == 185321.0)
rows10 = [(-10 - (r + 0.5) * B.PIX) for r in (32000, 39999)]; rows20 = [(-20 - (r + 0.5) * B.PIX) for r in (0, 7999)]; cols = [20 + (c + 0.5) * B.PIX for c in (0, 15999, 16000, 31999)]
check('Hansen rows and columns used: every pixel centre inside the half-open union, none on a line, the two tiles meeting at 20° S without overlap',
      all(-22 <= x < -18 for x in rows10 + rows20) and rows10[1] > -20 > rows20[0] and all(20 <= x < 28 for x in cols) and cols[1] < 24 < cols[2])
check('the builder refuses a FIRMS folder that does not pass the verifier', refused(lambda: B.fires(tempfile.mkdtemp(), FIRST, LAST)))
check('memory label: macOS ru_maxrss is bytes, Linux is KiB; both give MiB with the raw value and platform kept; other platforms are not converted',
      B.peak_memory(110100480, 'darwin') == 'peak resident memory 105.0 MiB (ru_maxrss raw 110100480 bytes, platform darwin)'
      and B.peak_memory(107520, 'linux') == 'peak resident memory 105.0 MiB (ru_maxrss raw 107520 KiB, platform linux)'
      and 'not converted' in B.peak_memory(5, 'win32'))
print(f'\n{passed} passed, {failed} failed'); sys.exit(1 if failed else 0)
