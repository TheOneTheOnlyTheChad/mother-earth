"""Mother Earth — tests for the animal-journey generator (animals-zebra-preview-rc, 19 Nov 2026).
Small made-up source files in the real file's layout, each pinned in a copy of the real config the way the real extract is.
Proves: a good file builds, with the source's own digits and UTC seconds; rows without a position and rows the source flags
are left out and counted; and the build STOPS (nothing written) on: an input that is not the pinned file, a missing column,
a short line, a duplicate time, an out-of-order time, a time with a fraction of a second, a time not in the source layout,
a coordinate out of range or not a plain number, a non-GPS row, an unknown 'visible' value, and no usable fix.
Also checks the committed display file against the committed manifest (bytes, sha256, count, first/last, order, box).
Does NOT prove the committed files match the 15.7 MB source file: that check needs the source file, which is not in the repo.
Run: python3 -I phase1/animals/build_journey.test.py      Break: BREAK=allow-duplicate|allow-backwards|skip-pin (each must fail)"""
import copy, hashlib, importlib.util, json, os, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
src = open(os.path.join(HERE, 'build_journey.py'), encoding='utf-8').read()
BREAK = os.environ.get('BREAK', '')
BREAKS = {'allow-duplicate': ("if t and ts == t[-1]:", "if False:"), 'allow-backwards': ("if t and ts < t[-1]:", "if False:"),
          'skip-pin': ("raise BuildError(f'input sha256 {sha} is neither the pinned source file nor the pinned extract for {animal}')", "source_kind = 'unpinned'")}
if BREAK:
    a, b = BREAKS[BREAK]; assert src.count(a) == 1, 'break did not apply'; src = src.replace(a, b)
mod = {'__name__': 'build_journey_under_test', '__file__': os.path.join(HERE, 'build_journey.py')}; exec(compile(src, 'build_journey.py', 'exec'), mod)
CFG = json.load(open(os.path.join(HERE, 'zebra-botswana.json'), encoding='utf-8'))
HEAD = 'event-id,visible,timestamp,location-long,location-lat,manually-marked-outlier,sensor-type,individual-taxon-canonical-name,tag-local-identifier,individual-local-identifier,study-name'
def row(ts, lon, lat, animal='Z3866', vis='true', out='', sensor='gps'): return f'1,{vis},{ts},{lon},{lat},{out},{sensor},Equus burchellii,1,{animal},x'
GOOD = [row('2007-10-25 08:01:53.000', '23.5174979', '-19.3851630'), row('2007-10-25 09:00:45.000', '23.5200000', '-19.3900000'),
        row('2007-10-25 09:30:00.000', '', ''), row('2007-10-25 10:00:00.000', '23.6', '-19.4', out='true'),
        row('2007-10-25 10:30:00.000', '24.0', '-19.5', animal='Z6402'), row('2007-10-25 11:00:10.000', '23.5300000', '-19.4000000')]
def run(lines, head=HEAD, pin=True, animal='Z3866'):
    raw = ('\n'.join([head] + lines) + '\n').encode(); cfg = copy.deepcopy(CFG)
    if pin: cfg['extracts'][animal] = {'sha256': hashlib.sha256(raw).hexdigest(), 'rows': len(lines), 'bytes': len(raw)}
    return mod['build'](cfg, animal, raw)
npass = nfail = 0
def ok(name, cond, got=None):
    global npass, nfail
    if cond: npass += 1
    else: nfail += 1; print('FAIL  ' + name + ('' if got is None else '\n      got: ' + repr(got)[:500]))
def stops(name, needle, *a, **k):
    try: r = run(*a, **k); ok(name, False, 'built: ' + repr(r)[:200])
    except mod['BuildError'] as e: ok(name, needle in str(e), str(e))
res = run(GOOD); display, manifest = res[1], json.loads(res[3])
d = json.loads(display); j = manifest['journeys'][0]
ok('1 a good file builds: three usable fixes, times as UTC seconds', d['n'] == 3 and d['t'] == [1193299313, 1193302845, 1193310010], d['t'])
ok('2 coordinates keep the source digits', b'"lat":[-19.3851630,-19.3900000,-19.4000000]' in display and b'"lon":[23.5174979,23.5200000,23.5300000]' in display, display[:300])
ok('3 the row without a position and the flagged row are left out and counted; another animal is ignored', j['source_rows'] == 5 and j['rows_without_position'] == 1 and j['rows_flagged_by_source'] == 1 and j['fixes'] == 3, j)
ok('4 the manifest pins the display file and records first, last and the box', j['sha256'] == hashlib.sha256(display).hexdigest() and j['bytes'] == len(display) and j['first_fix'] == '2007-10-25T08:01:53Z' and j['last_fix'] == '2007-10-25T11:00:10Z' and j['bbox']['south'] == -19.4 and j['bbox']['east'] == 23.53, j)
ok('5 the same input gives the same bytes', run(GOOD) == res)
stops('6 an input that is not the pinned file', 'neither the pinned source file nor the pinned extract', GOOD, pin=False)
stops('7 a missing column', "source column 'manually-marked-outlier' is missing", [l.replace(',,gps', ',gps').replace(',true,gps', ',gps') for l in GOOD[:2]], head=HEAD.replace('manually-marked-outlier,', ''))
stops('8 a short line', 'fields, expected', GOOD + ['1,true,2007-10-25 12:00:00.000,23.5'])
stops('9 two fixes at the same time', 'two usable fixes share the time', GOOD + [row('2007-10-25 11:00:10.000', '23.54', '-19.41')])
stops('10 a fix earlier than the one before it', 'is earlier than the fix before it', GOOD + [row('2007-10-25 10:59:00.000', '23.54', '-19.41')])
stops('11 a time with a fraction of a second', 'line 8', GOOD + [row('2007-10-25 12:00:00.500', '23.54', '-19.41')])
stops('12 a time not in the source layout', 'line 8', GOOD + [row('25/10/2007 12:00', '23.54', '-19.41')])
stops('13 a latitude out of range', 'is out of range', GOOD + [row('2007-10-25 12:00:00.000', '23.54', '-91.0')])
stops('14 a coordinate that is not a plain number', 'is not a plain decimal number', GOOD + [row('2007-10-25 12:00:00.000', '2.354e1', '-19.41')])
stops('15 a row from another kind of sensor', 'this study is GPS only', GOOD + [row('2007-10-25 12:00:00.000', '23.54', '-19.41', sensor='argos-doppler-shift')])
stops('16 an unknown value in "visible"', 'visible is', GOOD + [row('2007-10-25 12:00:00.000', '23.54', '-19.41', vis='maybe')])
stops('17 no usable fix', 'no usable fix', [GOOD[2], GOOD[3]])
# the command line writes nothing when the build stops
with tempfile.TemporaryDirectory() as tmp:
    bad = os.path.join(tmp, 'bad.csv'); open(bad, 'w').write(HEAD + '\n' + GOOD[0] + '\n'); out = os.path.join(tmp, 'out'); os.mkdir(out)
    import contextlib, io
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf): rc = mod['main'](['--config', os.path.join(HERE, 'zebra-botswana.json'), '--animal', 'Z3866', '--source', bad, '--out-dir', out])
    ok('18 the command stops with exit 2, says BUILD STOPPED, and writes no file', rc == 2 and 'BUILD STOPPED: ' in buf.getvalue() and os.listdir(out) == [], [rc, buf.getvalue()[:200], os.listdir(out)])
# the committed files agree with each other
mb = open(os.path.join(ROOT, 'assets/animals/zebra-botswana-R1.manifest.json'), 'rb').read(); m = json.loads(mb); cj = m['journeys'][0]
db = open(os.path.join(ROOT, 'assets/animals', cj['file']), 'rb').read(); cd = json.loads(db)
ok('19 committed display file: bytes and sha256 as the manifest says', len(db) == cj['bytes'] and hashlib.sha256(db).hexdigest() == cj['sha256'])
ok('20 committed display file: count, first and last fix, strictly increasing whole seconds, inside the box', cd['n'] == cj['fixes'] == len(cd['t']) == len(cd['lat']) == len(cd['lon']) and cd['t'][0] == cj['first_fix_s'] and cd['t'][-1] == cj['last_fix_s']
   and all(isinstance(x, int) for x in cd['t']) and all(b > a for a, b in zip(cd['t'], cd['t'][1:])) and min(cd['lat']) == cj['bbox']['south'] and max(cd['lat']) == cj['bbox']['north'] and min(cd['lon']) == cj['bbox']['west'] and max(cd['lon']) == cj['bbox']['east'])
gaps = [b - a for a, b in zip(cd['t'], cd['t'][1:])]
ok('21 committed manifest: gaps over the rule and the longest gap are what the file holds', cj['gaps_over_rule'] == sum(g > m['gap_rule']['max_join_seconds'] for g in gaps) and cj['longest_gap_s'] == max(gaps), [max(gaps)])
cat = open(os.path.join(ROOT, 'assets/animals/journeys-R1.catalog.json'), 'rb').read(); ce = [e for e in json.loads(cat)['journeys'] if e['id'] == 'zebra-botswana-Z3866']
pins = [f for f in ('animals-journey.js', 'animals.js') if hashlib.sha256(cat).hexdigest() in open(os.path.join(ROOT, f), encoding='utf-8').read()]
ok('22 the journey list pins this manifest and both page scripts pin the journey list', len(ce) == 1 and ce[0]['manifest_sha256'] == hashlib.sha256(mb).hexdigest() and pins == ['animals-journey.js', 'animals.js'], (ce, pins))
print(('FAILED' if nfail else 'PASSED') + f'  {npass} passed, {nfail} failed' + (f'  (BREAK={BREAK})' if BREAK else '')); sys.exit(1 if nfail else 0)
