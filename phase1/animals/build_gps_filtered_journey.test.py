"""Mother Earth — tests for the withheld-fix GPS journey build (animals-tab-rc, stage 2; proposal rev 3.1 Part B, B1 to B11, B17, §11a).
Part 1 (always): made-up tracking and reference files, pinned in a copy of the albatross config (its `expect` block removed).
  The reference point is the real config's form: a two-decimal deployment point, read from the made-up reference file.
Part 2 (always): the committed display file, manifest and journey list agree with each other and with the rules.
Part 3 (only with the real inputs): set ME_ALBATROSS_SRC and ME_ALBATROSS_REF to the two pinned files. Then: a fresh build gives the
  committed bytes; the counts are the proposal's; an independent re-read of the source (its own distance code) gives the same
  retained rows, values and periods; no withheld coordinate string is in any tracked file; no raw source file is tracked.
  Without them Part 3 prints NOT RUN and the summary says so. The inputs are not in the repository.
Run: python3 -I phase1/animals/build_gps_filtered_journey.test.py"""
import copy, csv, hashlib, io, json, math, os, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import build_gps_filtered_journey as b
A = os.path.join(ROOT, 'assets', 'animals'); sha = lambda x: hashlib.sha256(x).hexdigest()
npass = nfail = 0
def ok(name, cond, got=None):
    global npass, nfail
    if cond: npass += 1
    else: nfail += 1; print('FAIL  ' + name + ('' if got is None else '\n      got: ' + repr(got)[:600]))

CFG = json.load(open(os.path.join(HERE, 'waved-albatross-galapagos.json'), encoding='utf-8'))
ANIMAL = 'T-1'
HEAD = 'event-id,timestamp,location-long,location-lat,eobs:horizontal-accuracy-estimate,eobs:status,eobs:type-of-fix,visible,sensor-type,tag-local-identifier,individual-local-identifier'
RHEAD = 'tag-id,animal-id,animal-taxon,deploy-on-date,deploy-on-latitude,deploy-on-longitude,study-site,animal-comments,animal-life-stage,deployment-comments'
CLAT, CLON = -1.39, -89.62
KM_PER_DEG = 6371.0088 * math.pi / 180
def south(km): return '%.7f' % (CLAT - km / KM_PER_DEG)          # a latitude `km` due south of the reference point
def ts(minutes, ms=0, day=1):                                     # minutes after 2008-07-01 00:00:00 UTC
    h, m = divmod(minutes, 60); d, h = divmod(h, 24); return '2008-07-%02d %02d:%02d:00.%03d' % (day + d, h, m, ms)
_ev = [0]
def fix(minutes, km, acc='5.5', ms=0, animal=ANIMAL, tag='9', lon=None, status='A', ftype='3', visible='true', lat=None):
    _ev[0] += 1; return f'{_ev[0]},{ts(minutes, ms)},{CLON if lon is None else lon},{south(km) if lat is None else lat},{acc},"{status}",{ftype},{visible},"gps","{tag}","{animal}"'
def failed(minutes, ms=0, animal=ANIMAL, tag='9'):
    _ev[0] += 1; return f'{_ev[0]},{ts(minutes, ms)},,,,"D",0,true,"gps","{tag}","{animal}"'
def refrow(animal=ANIMAL, tag='9', date='2008-07-01', lat='-1.39', lon='-89.62'): return f'{tag},{animal},Phoebastria irrorata,{date},{lat},{lon},Test Site,Nest stage: egg,adult,used in analysis'
def run(lines, ref=None, pin=True, pin_ref=True, cfg_edit=None, head=HEAD):
    raw = ('\n'.join([head] + lines) + '\n').encode(); rraw = ('\r'.join([RHEAD] + (ref if ref is not None else [refrow(), refrow('OTHER', '8')])) + '\r').encode()
    cfg = copy.deepcopy(CFG); cfg.pop('expect', None)
    if pin: cfg['source_file']['sha256'] = sha(raw)
    if pin_ref: cfg['reference_file']['sha256'] = sha(rraw)
    if cfg_edit: cfg_edit(cfg)
    dn, db, mn, mb = b.build(cfg, ANIMAL, raw, rraw)
    return json.loads(db), json.loads(mb)['journeys'][0], json.loads(mb), db, mb
def stops(lines, **kw):
    try: run(lines, **kw); return None
    except b.BuildError as e: return str(e)

# ---------- Part 1
# the rounding helper alone (§11a): half up, in integers
ok('1a round_seconds: .499 down, .500 up, .999 carries into the next second, .000 unchanged', [b.round_seconds(x) for x in (1499, 1500, 1999, 2000, 59999)] == [1, 2, 2, 2, 60])
ok('1b distance from a whole second', [b.ms_from_whole_second(x) for x in (0, 1, 25, 26, 500, 974, 975, 999)] == [0, 1, 25, 26, 500, 26, 25, 1])

# a base record: W W | R R (failed) R | W (failed in period) W (failed after the period) | R R | 9 h | R
BASE = [fix(0, 0.1), fix(90, 2.0),                                   # leading withheld period: 2 fixes
        fix(180, 50, '4.1'), fix(270, 60, '7.25'), failed(360), fix(450, 70, '3'),   # retained; the step 270→450 spans a failed attempt (3 h: joined)
        fix(540, 3.0), failed(600), fix(630, 1.0), failed(700),      # a withheld period with a failed attempt inside it, and one after its last fix
        fix(720, 80, '65.28'), fix(810, 90, '2.05'),                 # retained (the step 450→720 crosses the period: never joined)
        fix(810 + 541, 100, '9')]                                    # 9 h 1 min later, nothing between: not joined (time)
d, jr, man, db, mb = run(BASE)
T = lambda m: b.round_seconds(b.epoch_ms(ts(m), 'x'))
ok('1c retained fixes only, in order, with the source\'s own digits', d['n'] == 6 and d['t'] == [T(180), T(270), T(450), T(720), T(810), T(1351)] and d['lat'] == [float(south(k)) for k in (50, 60, 70, 80, 90, 100)] and all(x == CLON for x in d['lon']), d)
ok('1d B11 accuracy: one entry per retained fix, equal to its row\'s source value', d['acc'] == [4.1, 7.25, 3, 65.28, 2.05, 9] and b'"acc":[4.1,7.25,3,65.28,2.05,9]' in db, d['acc'])
ok('1e join flags: first 0; joined within the rule; a step across a withheld period is 0; the 9 h step is 0', d['j'] == [0, 1, 1, 0, 1, 0], d['j'])
ok('1f withheld periods are times and counts only: [first, last, count]', d['withheld'] == [[T(0), T(90), 2], [T(540), T(630), 2]] and all(len(p) == 3 for p in d['withheld']), d['withheld'])
ok('1g failed_t keeps attempts outside the stored periods (including the one after a period\'s last withheld fix); the one inside a period is counted only', d['failed_t'] == [T(360), T(700)] and jr['failed_inside_withheld_period'] == 1 and jr['failed_attempts'] == 3 and jr['failed_listed'] == 2, [d['failed_t'], jr])
ok('1h counts: rows = positioned + failed; positioned = retained + withheld; steps add up', jr['source_rows'] == 13 and jr['positioned'] == 10 and jr['fixes'] == 6 and jr['fixes_withheld'] == 4 and jr['withheld_periods'] == 2 and jr['steps_joined'] == 3 and jr['joined_spanning_failed'] == 1 and jr['steps_separated_by_withholding'] == 1 and jr['steps_separated_by_time'] == 1 and jr['steps'] == 5, jr)
ok('1i the recording period is the first and last SOURCE row; the first and last displayed fix are stated apart', jr['record_first_s'] == T(0) and jr['record_last_s'] == T(1351) and jr['first_fix_s'] == T(180) and jr['last_fix_s'] == T(1351), jr)
leak = [s for k in (0.1, 2.0, 3.0, 1.0) for s in [south(k)] if s.encode() in db or s.encode() in mb]
ok('1j B6 no withheld coordinate in the display file or the manifest; the bounding box is the retained fixes\' only', not leak and jr['bbox'] == {'south': float(south(100)), 'north': float(south(50)), 'west': CLON, 'east': CLON}, [leak, jr['bbox']])
ok('1k the manifest carries the reference point as the reference file gives it, the radius, the formula and the boundary rule, and nothing else about the centre', man['withholding']['centre'] == {'lat': '-1.39', 'lon': '-89.62'} and man['withholding']['radius_km'] == 5.0 and 'haversine' in man['withholding']['formula'] and 'exactly' in man['withholding']['boundary'], man['withholding'])
ok('1l the manifest records the timestamp rule, its allowance and the measured maximum', man['timestamp_rule']['allowance_ms'] == 25 and man['timestamp_rule']['measured_max_ms'] == 0 and 'before any omission' in man['timestamp_rule']['applied'], man['timestamp_rule'])
ok('1m the card sentences take their numbers from the build', man['card']['shown'].startswith('6 of 10 recorded fixes are shown. 4 fixes within 5 km') and '1 joins span' in man['card']['done'] and '3 of 5 steps' in man['card']['line'], man['card'])

# B1 inputs
ok('1n B1 a tracking file that is not the pinned file stops the build', 'not the pinned file' in (stops(BASE, pin=False) or ''))
ok('1o B1 a reference file that is not the pinned file stops the build', 'not the pinned file' in (stops(BASE, pin_ref=False) or ''))
ok('1p B1 a reference row whose tag differs from the data rows stops the build', 'reference file gives' in (stops(BASE, ref=[refrow(tag='7')]) or ''))
ok('1q B1 a deployment date that is not the first row\'s date stops the build', 'deployment on' in (stops(BASE, ref=[refrow(date='2008-07-02')]) or ''))
ok('1r B1 no reference row, or two, for the animal stops the build', 'exactly one' in (stops(BASE, ref=[refrow('OTHER')]) or '') and 'exactly one' in (stops(BASE, ref=[refrow(), refrow()]) or ''))
ok('1s the centre is read from the reference file: moving the reference point changes what is withheld', run(BASE, ref=[refrow(lat=south(50)[:8])])[1]['fixes_withheld'] != 4)
ok('1t a manually-marked-outlier column where the config says none stops the build', 'manually-marked-outlier' in (stops([l + ',' for l in BASE], head=HEAD + ',manually-marked-outlier') or ''))

# B3 status and coordinates, on every row before filtering (the altered row is one that would be withheld)
def alt(i, new): x = list(BASE); x[i] = new; return x
ok('1u B3 a partial coordinate stops the build', 'lacks a coordinate' in (stops(alt(1, fix(90, 2.0, lat=''))) or ''))
ok('1v B3 status A with fix type 0 stops the build', 'not a combination' in (stops(alt(1, fix(90, 2.0, ftype='0'))) or ''))
ok('1w B3 status D with a position stops the build', 'not a combination' in (stops(alt(1, fix(90, 2.0, status='D'))) or '') and 'carries a coordinate' in (stops(alt(1, fix(90, 2.0, status='D', ftype='0'))) or ''))
ok('1x a row that is not visible stops the build', 'not visible' in (stops(alt(1, fix(90, 2.0, visible='false'))) or ''))
ok('1y a malformed accuracy estimate on a positioned row stops the build', 'accuracy estimate' in (stops(alt(2, fix(180, 50, acc='-1'))) or '') and 'accuracy estimate' in (stops(alt(2, fix(180, 50, acc=''))) or ''))

# B4 timestamps, before omission (rows 0 and 1 are withheld rows; row 4 is a failed attempt)
ok('1z B4 25 ms from a whole second passes, on either side, and rounds to the nearest second', run(alt(2, fix(180, 50, ms=25)))[0]['t'][0] == T(180) and run(alt(2, fix(179, 50, ms=0).replace(':00.000', ':59.975')))[0]['t'][0] == T(180))
ok('1A B4 26 ms stops the build, also on a row that would be withheld and on a failed attempt', all('26 ms from a whole second' in (stops(x) or '') for x in (alt(2, fix(180, 50, ms=26)), alt(1, fix(90, 2.0, ms=26)), alt(4, failed(360, ms=26)))))
ok('1B §11a a .500 timestamp is outside the allowance and stops the integrated build', '500 ms from a whole second' in (stops(alt(2, fix(180, 50, ms=500))) or ''))
ok('1C §11a a .999 value carries into the next second', run(alt(2, fix(180, 50).replace(':00.000', ':59.999').replace(ts(180)[:16], ts(179)[:16])))[0]['t'][0] == T(180))
ok('1D B4 two rows on the same second after rounding stop the build', 'share the second' in (stops(alt(3, fix(180, 60, ms=1))) or ''))
ok('1E B4 a row not later than the one before stops the build', 'not later' in (stops(alt(3, fix(170, 60))) or ''))
ok('1F the measured maximum distance is recorded', run(alt(2, fix(180, 50, ms=21)))[2]['timestamp_rule']['measured_max_ms'] == 21)

# B5 the boundary
inside_, outside_ = run(alt(2, fix(180, 4.999)))[1], run(alt(2, fix(180, 5.001)))[1]
ok('1G B5 a fix just inside 5.000 km is withheld; just outside is retained', inside_['fixes_withheld'] == 5 and inside_['fixes'] == 5 and outside_['fixes_withheld'] == 4 and outside_['fixes'] == 6, [inside_, outside_])
exact = b.haversine_km(CLAT, CLON, float(south(50)), CLON, 6371.0088)
on, just = run(BASE, cfg_edit=lambda c: c['withholding'].__setitem__('radius_km', exact))[1], run(BASE, cfg_edit=lambda c: c['withholding'].__setitem__('radius_km', math.nextafter(exact, 0)))[1]
ok('1H B5 a fix at exactly the radius is withheld (radius set to that fix\'s own computed distance); a radius one step smaller retains it', on['fixes_withheld'] == 5 and just['fixes_withheld'] == 4, [exact, on['fixes_withheld'], just['fixes_withheld']])

# B7 a short withheld step
short = [fix(0, 50), fix(90, 1.0), fix(180, 60)]
ok('1I B7 one withheld fix between two retained fixes 3 hours apart: no join, though the time rule alone would allow it', run(short)[0]['j'] == [0, 0] and run([fix(0, 50), failed(90), fix(180, 60)])[0]['j'] == [0, 1], run(short)[0])
# B8 leading and trailing periods
trail = [fix(0, 50), fix(90, 60), fix(180, 1.0), fix(270, 2.0), failed(300)]
dt, jt = run(trail)[:2]
ok('1J B8 a trailing withheld period: the recording runs past the last displayed fix to the last source row', dt['withheld'] == [[T(180), T(270), 2]] and jt['last_fix_s'] == T(90) and jt['record_last_s'] == T(300) and dt['failed_t'] == [T(300)], [dt['withheld'], jt])
ok('1K a record with every positioned fix inside the radius stops the build', 'nothing would be shown' in (stops([fix(0, 1.0), fix(90, 2.0)]) or ''))
ok('1L rows of other animals are not used', run(BASE + [fix(2000, 55, animal='OTHER', tag='8')])[1]['source_rows'] == 13)
ok('1M the config\'s expect block stops a build whose counts differ', 'the config expects' in (stops(BASE, cfg_edit=lambda c: c.__setitem__('expect', {'fixes': 7})) or ''))

# B2 --check and the written files
with tempfile.TemporaryDirectory() as tmp:
    raw = ('\n'.join([HEAD] + BASE) + '\n').encode(); rraw = ('\r'.join([RHEAD, refrow()]) + '\r').encode(); cfg = copy.deepcopy(CFG); cfg.pop('expect'); cfg['source_file']['sha256'] = sha(raw); cfg['reference_file']['sha256'] = sha(rraw)
    sp, rp, cp, out = (os.path.join(tmp, x) for x in ('s.csv', 'r.csv', 'c.json', 'out')); open(sp, 'wb').write(raw); open(rp, 'wb').write(rraw); json.dump(cfg, open(cp, 'w'))
    args = ['--config', cp, '--animal', ANIMAL, '--source', sp, '--reference', rp, '--out-dir', out]
    quiet = lambda a: (lambda o: (sys.stdout.flush(), setattr(sys, 'stdout', io.StringIO()), [b.main(a)], setattr(sys, 'stdout', o))[2][0])(sys.stdout)
    r1 = quiet(args + ['--check']); made = os.path.exists(out) and os.listdir(out)
    r2 = quiet(args); files = sorted(os.listdir(out)); r3 = quiet(args + ['--check'])
    p = os.path.join(out, files[0]); x = bytearray(open(p, 'rb').read()); x[-3] ^= 1; open(p, 'wb').write(bytes(x)); r4 = quiet(args + ['--check'])
    open(sp, 'ab').write(b'x'); r5 = quiet(args + ['--check'])
    ok('1N B2 --check: 3 when the outputs are missing (and it writes nothing); 0 when written and identical; 3 when one byte differs; 2 when the build stops', r1 == 3 and not made and r2 == 0 and r3 == 0 and r4 == 3 and r5 == 2, [r1, made, r2, r3, r4, r5])
    ok('1O B2 the build writes the display file and the manifest only: no source file', files == ['waved-albatross-galapagos-R1.manifest.json', 'waved-albatross-galapagos-T-1-R1.json'], files)

# ---------- Part 2: the committed files
cat_raw = open(os.path.join(A, 'journeys-R1.catalog.json'), 'rb').read(); cat = json.loads(cat_raw)
ce = [e for e in cat['journeys'] if e['id'] == 'waved-albatross-galapagos-3275-30662']
ok('2a the journey list has the bird, in the Air group', len(ce) == 1 and ce[0]['group'] == 'Air' and ce[0]['label'] == CFG['label'], ce)
mraw = open(os.path.join(A, ce[0]['manifest']), 'rb').read(); M = json.loads(mraw); J = M['journeys'][0]; draw = open(os.path.join(A, J['file']), 'rb').read(); D = json.loads(draw)
ok('2b the list pins the manifest and the manifest pins the display file', sha(mraw) == ce[0]['manifest_sha256'] and sha(draw) == J['sha256'] and len(draw) == J['bytes'])
ok('2c both page scripts pin this journey list', all(sha(cat_raw) in open(os.path.join(ROOT, f), encoding='utf-8').read() for f in ('animals-journey.js', 'animals.js')))
E = CFG['expect']
ok('2d B10 the manifest counts are the proposal\'s: 1,338 rows; 1,326 positioned; 12 failed; 981 retained; 345 withheld in 14 periods; 966 joined, 10 spanning a failed attempt', all(J[k] == v for k, v in E.items()) and E == {'source_rows': 1338, 'positioned': 1326, 'failed_attempts': 12, 'fixes': 981, 'fixes_withheld': 345, 'withheld_periods': 14, 'steps_joined': 966, 'joined_spanning_failed': 10, 'steps_separated_by_withholding': 13, 'steps_separated_by_time': 1, 'failed_listed': 11}, {k: J[k] for k in E})
n_ = D['n']; rule = M['gap_rule']['max_join_seconds']
ok('2e display structure: n entries in t, lat, lon, acc and j; times strictly increasing whole seconds', n_ == 981 and all(len(D[k]) == n_ for k in ('t', 'lat', 'lon', 'acc', 'j')) and all(isinstance(x, int) for x in D['t']) and all(a < c for a, c in zip(D['t'], D['t'][1:])))
ok('2f §11a join flags: first 0, only 0 or 1, total = the manifest\'s, never 1 over the time rule', D['j'][0] == 0 and set(D['j']) <= {0, 1} and sum(D['j']) == J['steps_joined'] and all(not (D['j'][i] and D['t'][i] - D['t'][i - 1] > rule) for i in range(1, n_)) and rule == 11700)
P = D['withheld']
ok('2g §11a periods: integer endpoints inside the recording, first <= last, ordered and disjoint, counts and totals agree; none is a single fix; the record starts in one', all(isinstance(v, int) for p in P for v in p) and all(J['record_first_s'] <= p[0] <= p[1] <= J['record_last_s'] for p in P) and all(P[i][0] > P[i - 1][1] for i in range(1, len(P))) and sum(p[2] for p in P) == 345 and len(P) == 14 and min(p[2] for p in P) > 1 and P[0] == [J['record_first_s'], 1214697674, 86], P[:2])
ok('2h no displayed fix lies inside a period, and no step across a period is joined', all(not any(p[0] <= t <= p[1] for t in D['t']) for p in P) and all(D['j'][i] == 0 for i in range(1, n_) if any(D['t'][i - 1] < p[0] < D['t'][i] for p in P)))
F = D['failed_t']
ok('2i §11a failed_t: 11 integers inside the recording, unique and increasing, none at a fix, none inside a stored period; exactly one lies in a hidden span (after a period\'s last fix, before the next displayed fix)', len(F) == 11 and all(isinstance(x, int) for x in F) and all(a < c for a, c in zip(F, F[1:])) and not set(F) & set(D['t']) and not any(p[0] <= x <= p[1] for x in F for p in P) and
   sum(1 for x in F if any(p[1] < x < min([t for t in D['t'] if t > p[1]], default=float('inf')) for p in P)) == 1, F)
ok('2j the first displayed fix is 29 Jun 2008 01:30:54 UTC, the last is the last source row, and the recording starts 23 Jun 17:58:44', J['first_fix'] == '2008-06-29T01:30:54Z' and J['last_fix'] == '2008-09-15T13:30:18Z' and J['record_first'] == '2008-06-23T17:58:44Z' and J['record_last'] == J['last_fix'], J)
ok('2k accuracy of the displayed fixes as measured: min 2.05, median 4.35, largest 65.28 m; all finite and not negative', J['accuracy_m']['min'] == 2.05 and J['accuracy_m']['median'] == 4.35 and J['accuracy_m']['max'] == 65.28 and min(D['acc']) == 2.05 and max(D['acc']) == 65.28 and all(isinstance(x, (int, float)) and x >= 0 for x in D['acc']), J['accuracy_m'])
ok('2l the bounding box is the displayed fixes\' own', J['bbox'] == {'south': min(D['lat']), 'north': max(D['lat']), 'west': min(D['lon']), 'east': max(D['lon'])}, J['bbox'])
ok('2m the measured timestamp maximum is 21 ms under an allowance of 25', M['timestamp_rule']['measured_max_ms'] == 21 and M['timestamp_rule']['allowance_ms'] == 25)
# every displayed fix is OUTSIDE the stated radius of the stated point, by this test's own distance code (spherical law of cosines)
def cosdist(la1, lo1, la2, lo2, R=6371.0088):
    a, c = math.radians(la1), math.radians(la2); return R * math.acos(max(-1.0, min(1.0, math.sin(a) * math.sin(c) + math.cos(a) * math.cos(c) * math.cos(math.radians(lo2 - lo1)))))
cl, co = float(M['withholding']['centre']['lat']), float(M['withholding']['centre']['lon']); near = min(cosdist(cl, co, la, lo) for la, lo in zip(D['lat'], D['lon']))
ok('2n every displayed fix is more than 5 km from the stated reference point (independent distance formula)', near > 5.0 and (cl, co) == (-1.39, -89.62), near)
words = json.dumps(M['card'], ensure_ascii=False) + M['label'] + M['label_line']
ok('2o B12 wording: the label is exactly the accepted one; none of the "not said" items is in the manifest\'s sentences', M['label_line'] == 'Recorded movements of one breeding adult, 23 June to 15 September 2008.' and M['label'] == 'Waved albatross, animal 3275-30662' and not any(w in words.lower() for w in ('migrat', 'foraging trip', 'incubat', 'at the colony', 'at the nest', 'endangered', 'critically')), words[:300])
ok('2p release (21 Nov 2026): the first three journeys keep their order in the list; their manifests are the release rebuilds (wording only: preview text removed, release decision recorded) and their display files are byte-identical to the parked branch', [(e['id'], e['manifest_sha256'][:8]) for e in cat['journeys'][:3]] == [('zebra-botswana-Z3866', 'ddb1cd5d'), ('white-shark-sa-118845', '0522ca17'), ('false-killer-whale-hawaii-98364', '705368a0')] and all(hashlib.sha256(open(os.path.join('assets/animals', n), 'rb').read()).hexdigest()[:8] == v for n, v in {'zebra-botswana-Z3866-R1.json': '8d00aa32', 'white-shark-sa-118845-R1.json': 'fb6d4079', 'false-killer-whale-hawaii-98364-R1.json': '7cb4bd44'}.items()))
# B17 the source guard
gi = open(os.path.join(ROOT, '.gitignore'), encoding='utf-8').read().splitlines()
tracked = None
try: tracked = subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.splitlines()
except Exception: pass
if tracked is None: print('NOT RUN  2q/2r tracked-file checks: this copy has no Git metadata; the folder tree is scanned instead'); tracked = [os.path.relpath(os.path.join(dp, f), ROOT) for dp, dn, fn in os.walk(ROOT) for f in fn if '.git' + os.sep not in dp and 'node_modules' not in dp and '_baseline-main' not in dp]
ok('2q B17 _source-data/ is ignored by Git and no tracked file sits under it', '_source-data/' in gi and not [f for f in tracked if f.startswith('_source-data/') or '/_source-data/' in f])
SRC_NAMES = {CFG['source_file']['name'], CFG['reference_file']['name']}; SRC_SHAS = {CFG['source_file']['sha256'], CFG['reference_file']['sha256']}
bad = [f for f in tracked if os.path.basename(f) in SRC_NAMES or (f.lower().endswith('.csv') and os.path.exists(os.path.join(ROOT, f)) and sha(open(os.path.join(ROOT, f), 'rb').read()) in SRC_SHAS)]
ok('2r B17 no raw source file is in the tree (by name or by checksum); a manifest may name the source file', not bad, bad)

# ---------- Part 3: the real inputs
SRC, REF = os.environ.get('ME_ALBATROSS_SRC'), os.environ.get('ME_ALBATROSS_REF'); part3 = 'NOT RUN (set ME_ALBATROSS_SRC and ME_ALBATROSS_REF to the pinned inputs)'
if SRC and REF:
    raw, rraw = open(SRC, 'rb').read(), open(REF, 'rb').read()
    dn, db2, mn, mb2 = b.build(CFG, '3275-30662', raw, rraw)
    ok('3a B2 a fresh build from the pinned inputs gives the committed display file and manifest, byte for byte', db2 == draw and mb2 == mraw and dn == J['file'])
    # an independent re-read: csv.DictReader, floats for time arithmetic kept out (integers only), its own distance code
    rows = [r for r in csv.DictReader(io.StringIO(raw.decode('utf-8'), newline='')) if r['individual-local-identifier'] == '3275-30662']
    import calendar, re
    def sec(s): y, mo, d_, h, mi, se, ms = map(int, re.match(r'(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)\.(\d+)', s).groups()); return (calendar.timegm((y, mo, d_, h, mi, se)) * 1000 + ms + 500) // 1000
    pos = [r for r in rows if r['location-lat'] != '']; kept = [r for r in pos if cosdist(cl, co, float(r['location-lat']), float(r['location-long'])) > 5.0]; held = [r for r in pos if r not in kept]
    ok('3b independent re-read: 1,338 rows, 1,326 positioned, 12 failed; 981 kept and 345 withheld by this test\'s own distance code', (len(rows), len(pos), len(rows) - len(pos), len(kept), len(held)) == (1338, 1326, 12, 981, 345))
    ok('3c B11 the display file is exactly the kept rows: time, latitude, longitude and accuracy each equal the source value', D['t'] == [sec(r['timestamp']) for r in kept] and D['lat'] == [float(r['location-lat']) for r in kept] and D['lon'] == [float(r['location-long']) for r in kept] and D['acc'] == [float(r['eobs:horizontal-accuracy-estimate']) for r in kept])
    ok('3d the source digits are written unchanged (as text) for coordinates and accuracy', (','.join(r['location-lat'] for r in kept)).encode() in draw and (','.join(r['location-long'] for r in kept)).encode() in draw and (','.join(r['eobs:horizontal-accuracy-estimate'] for r in kept)).encode() in draw)
    ht = [sec(r['timestamp']) for r in held]; kt = set(D['t'])
    ok('3e every withheld time lies inside a stored period, every period\'s ends are withheld times, and the counts per period are right', all(any(p[0] <= x <= p[1] for p in P) for x in ht) and all(p[0] in ht and p[1] in ht and sum(1 for x in ht if p[0] <= x <= p[1]) == p[2] for p in P))
    ft = [sec(r['timestamp']) for r in rows if r['location-lat'] == '']
    ok('3f the 12 failed attempts: 11 listed, 1 inside a stored period', sorted(F) == [x for x in ft if not any(p[0] <= x <= p[1] for p in P)] and len(ft) - len(F) == 1)
    dist = sorted(min((sec_ms % 1000), 1000 - (sec_ms % 1000)) for sec_ms in [int(re.match(r'.*\.(\d{3})$', r['timestamp']).group(1)) for r in rows])
    ok('3g timestamps: every row within 25 ms of a whole second; two rows at 19 and 21 ms', dist[-1] == 21 and dist[-2] == 19 and dist[-3] <= 2, dist[-4:])
    margin = sorted(abs(cosdist(cl, co, float(r['location-lat']), float(r['location-long'])) - 5.0) for r in pos)[0]
    ok('3h no fix of this bird is within 100 m of the boundary, so the two distance formulas cannot disagree about any fix', margin > 0.1, margin)
    # B6: no withheld coordinate string in any tracked file (a supplementary leak check, not proof: 3c is the structural one)
    strs = sorted({r['location-lat'] for r in held} | {r['location-long'] for r in held}); keptstr = {r['location-lat'] for r in kept} | {r['location-long'] for r in kept}
    strs = [s for s in strs if s not in keptstr]; hits = []
    for f in tracked:
        p_ = os.path.join(ROOT, f)
        if not os.path.isfile(p_) or os.path.getsize(p_) > 30e6: continue
        blob = open(p_, 'rb').read()
        for s in strs:
            if s.encode() in blob: hits.append((f, s)); break
    ok(f'3i B6 none of the {len(strs)} withheld latitude and longitude strings appears in any of the {len(tracked)} files of the tree', not hits and len(strs) > 500, hits[:5])
    ok('3j the reference row: tag 132, deployed 2008-06-23, Punta Cevallos, "Nest stage: egg", point -1.39, -89.62', 'Punta Cevallos' in M['card']['tagging'] and 'Nest stage: egg' in M['card']['tagging'] and '23 Jun 2008' in M['card']['tagging'])
    part3 = 'run'

print(('PASSED' if not nfail else 'FAILED') + f'  {npass} passed, {nfail} failed; part 3 (real inputs): {part3}')
sys.exit(1 if nfail else 0)
