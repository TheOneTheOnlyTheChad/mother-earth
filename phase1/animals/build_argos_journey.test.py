"""Mother Earth — tests for the Argos journey build (animals-journeys-preview-rc, 19 Nov 2026).
Part 1 (always): a made-up source file and a made-up land file (one square island), pinned in a copy of the shark config. Proves the
  stages run in order and are counted; a fix on land is left out; a step whose drawn line crosses the island is not joined although
  it is within the time limit; a step clear of land is joined; and the build STOPS on a wrong source file, a wrong land file, rows
  out of time order and an unknown class.
Part 2 (always): the committed display files, manifests and journey list agree with each other and with the rule (no kept step over
  the limit, no join over the time limit, classes and counts as the manifest says), and both page scripts pin the journey list.
Part 3 (only with the real inputs): set ME_SHARK_SRC, ME_FKW_SRC and ME_LAND to the pinned files. Then: a fresh build gives the
  committed bytes; no fix shown is on land; no joined step's drawn line touches land; every refused step does touch land.
  Without them Part 3 prints NOT RUN and the summary says so. The inputs are not in the repo.
Run: python3 -I phase1/animals/build_argos_journey.test.py"""
import copy, hashlib, json, os, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import build_argos_journey as b, argos_rules as ar
A = os.path.join(ROOT, 'assets', 'animals'); sha = lambda x: hashlib.sha256(x).hexdigest()
npass = nfail = 0
def ok(name, cond, got=None):
    global npass, nfail
    if cond: npass += 1
    else: nfail += 1; print('FAIL  ' + name + ('' if got is None else '\n      got: ' + repr(got)[:500]))

# ---------- Part 1: made-up inputs. Sea everywhere except an island 0.2..0.4 E, -0.1..0.1 N. Limit 3 m/s, join 12 h.
CFG = json.load(open(os.path.join(HERE, 'white-shark-sa.json'), encoding='utf-8'))
HEAD = '"DeployID","SPOT","date","type","quality","latitude","longitude","area_tagged","sex","TL","maturity"'
def row(day, hh, lat, lon, q, tag='118845'): return f'"Name",{tag},2012-05-{day:02d} {hh:02d}:00:00,"Argos","{q}",{lat},{lon},"X","F",300,"Adult"'
ISLAND = json.dumps({'type': 'FeatureCollection', 'features': [{'type': 'Feature', 'properties': {}, 'geometry': {'type': 'Polygon', 'coordinates': [[[0.2, -0.1], [0.4, -0.1], [0.4, 0.1], [0.2, 0.1], [0.2, -0.1]]]}}]}).encode()
def run(lines, land=ISLAND, pin_source=True, pin_land=True):
    raw = ('\n'.join([HEAD] + lines) + '\n').encode(); cfg = copy.deepcopy(CFG)
    if pin_source: cfg['source_file']['sha256'] = sha(raw)
    if pin_land: cfg['land_data']['sha256'] = sha(land)
    with tempfile.TemporaryDirectory() as tmp:
        sp, lp = os.path.join(tmp, 's.csv'), os.path.join(tmp, 'l.geojson'); open(sp, 'wb').write(raw); open(lp, 'wb').write(land)
        dn, db, mn, mb = b.build(cfg, sp, lp)
    return json.loads(db), json.loads(mb), db
GOOD = [row(1, 0, 0.0, 0.0, '3'), row(1, 3, 0.0, 0.10, '2'),          # 11 km in 3 h: kept, joined
        row(1, 6, 0.0, 0.30, 'B'),                                      # on the island: left out by the land stage
        row(1, 9, 0.0, 0.50, '1'),                                      # at sea east of the island; the line from 0.10 E crosses the island: 6 h apart, refused
        row(1, 14, 0.3, 0.55, '2'),                                     # clear of the island, 5 h later: joined
        row(1, 15, 5.0, 5.00, 'B'),                                     # 700 km in 1 h: left out by the speed rule
        row(2, 6, 0.3, 0.60, '3'),                                      # 16 h after the previous kept fix: not joined (time)
        row(9, 0, 0.3, 0.70, 'A'),                                      # 7 days from anything: temporally isolated, left out
        row(1, 4, 9.0, 9.00, '3', tag='999999')]                        # another tag: ignored
d, m, raw = run(GOOD); j = m['journeys'][0]; st = {s['stage'].split(' (')[0].split(' in the')[0]: s for s in m['stages']}
ok('P1 stages in order with counts: 8 rows for the tag, 1 by speed, 1 isolated, 1 on land, 5 shown', [s.get('removed') for s in m['stages']] == [None, 1, 1, 1] and [s['rows_out'] for s in m['stages']] == [8, 7, 6, 5] and d['n'] == 5, m['stages'])
ok('P2 the fix on the island is not in the file; the class string and fixes are the kept rows in order', d['lon'] == [0.0, 0.1, 0.5, 0.55, 0.6] and d['lc'] == '32123' and m['stages'][-1]['removed_by_class'] == {'B': 1}, (d['lon'], d['lc']))
ok('P3 joins: first step joined; the step whose line crosses the island refused though within 12 h; the next joined; the 16-hour step not joined', d['j'] == [0, 1, 0, 1, 0] and j['steps_within_join_limit'] == 3 and j['steps_refused_for_land'] == 1 and j['steps_joined'] == 2, (d['j'], j))
ok('P4 the manifest pins the display file and carries the filled sentences', j['sha256'] == sha(raw) and j['bytes'] == len(raw) and '8 recorded fixes for this tag' in m['card']['done'] and 'left out 1 under its own speed-consistency rule' in m['card']['done'] and '1 pairs whose joining line would cross land' in m['card']['done'] and m['gap_rule']['max_join_seconds'] == 43200, m['card']['done'])
ok('P5 the same inputs give the same bytes', run(GOOD)[2] == raw)
def stops(name, needle, *a, **k):
    try: run(*a, **k); ok(name, False, 'built')
    except b.BuildError as e: ok(name, needle in str(e), str(e))
stops('P6 a source file that is not the pinned one', 'is not the pinned source file', GOOD, pin_source=False)
stops('P7 a land file that is not the pinned one', 'is not the pinned land file', GOOD, pin_land=False)
stops('P8 rows out of time order', 'out of time order', [GOOD[1], GOOD[0]])
stops('P9 an unknown class', 'unknown Argos class', GOOD[:2] + [row(1, 5, 0.0, 0.6, 'Q')])
stops('P10 a coordinate out of range', 'out of range', GOOD[:2] + [row(1, 5, 95.0, 0.6, '3')])

# ---------- Part 2: the committed files
cat_raw = open(os.path.join(A, 'journeys-R1.catalog.json'), 'rb').read(); cat = json.loads(cat_raw)
ok('C1 the journey list names three journeys and pins each manifest', [e['id'] for e in cat['journeys']] == ['zebra-botswana-Z3866', 'white-shark-sa-118845', 'false-killer-whale-hawaii-98364'] and all(sha(open(os.path.join(A, e['manifest']), 'rb').read()) == e['manifest_sha256'] for e in cat['journeys']))
ok('C2 both page scripts pin this journey list', all(sha(cat_raw) in open(os.path.join(ROOT, f), encoding='utf-8').read() for f in ('animals-journey.js', 'animals.js')))
EXPECT = {'white-shark-sa-118845': (755, 754, 616, 2, [1004, 796, 795, 755]), 'false-killer-whale-hawaii-98364': (661, 660, 554, 0, [824, 823, 694, 693, 663, 661, 661])}
for e in cat['journeys'][1:]:
    m = json.load(open(os.path.join(A, e['manifest']), encoding='utf-8')); j = m['journeys'][0]; raw = open(os.path.join(A, j['file']), 'rb').read(); d = json.loads(raw); n = d['n']; R = m['rule']; lim = m['gap_rule']['max_join_seconds']
    rows = [(d['t'][i], d['lat'][i], d['lon'][i], d['lc'][i]) for i in range(n)]; x = EXPECT[e['id']]
    ok(f"C3 {e['id']}: display file is the one the manifest pins; counts are the ones GPT reviewed", sha(raw) == j['sha256'] and len(raw) == j['bytes'] and (n, j['steps'], j['steps_joined'], j['steps_refused_for_land']) == x[:4] and [s['rows_out'] for s in m['stages']] == x[4], ((n, j['steps'], j['steps_joined'], j['steps_refused_for_land']), [s['rows_out'] for s in m['stages']]))
    ok(f"C4 {e['id']}: times strictly increasing whole seconds; classes only 3 2 1 0 A B and counted as the manifest says; first, last and box as stated", all(isinstance(t, int) for t in d['t']) and all(q > p for p, q in zip(d['t'], d['t'][1:])) and set(d['lc']) <= set('3210AB') and {c: d['lc'].count(c) for c in '3210AB'} == j['classes'] and d['t'][0] == j['first_fix_s'] and d['t'][-1] == j['last_fix_s'] and min(d['lat']) == j['bbox']['south'] and max(d['lon']) == j['bbox']['east'])
    ok(f"C5 {e['id']}: no step between shown fixes exceeds the limit ({R['speed_limit_label']}); the rule's own stages leave the shown set unchanged when run again", all(ar.speed(p, q)[0] <= R['speed_limit_m_per_s'] for p, q in zip(rows, rows[1:])) and ar.anchored(rows, R['speed_limit_m_per_s'], R['anchor_classes']) == list(range(n)) and ar.isolated(rows, list(range(n)), R['isolation_hours']) == [])
    ok(f"C6 {e['id']}: join flags: none on the first fix, none across more than {R['join_hours']} hours, total as the manifest says", d['j'][0] == 0 and len(d['j']) == n and all(f in (0, 1) for f in d['j']) and all(d['t'][i] - d['t'][i - 1] <= lim for i in range(1, n) if d['j'][i]) and sum(d['j']) == j['steps_joined'] and sum(1 for i in range(1, n) if d['t'][i] - d['t'][i - 1] <= lim) == j['steps_within_join_limit'])
    ok(f"C7 {e['id']}: the sentences on the card carry the manifest's own numbers", f"{n:,}" in m['card']['shown'] and f"{j['steps_joined']:,} of {j['steps']:,} steps" in m['card']['line'] and 'experimental' in m['card']['done'] and 'not guaranteed limits' in m['accuracy_note'])

# ---------- Part 3: against the real inputs
src = {'white-shark-sa.json': os.environ.get('ME_SHARK_SRC'), 'false-killer-whale-hawaii.json': os.environ.get('ME_FKW_SRC')}; land_path = os.environ.get('ME_LAND'); part3 = 'NOT RUN (set ME_SHARK_SRC, ME_FKW_SRC and ME_LAND to the pinned inputs)'
if land_path and all(src.values()):
    import shapely, shapely.prepared, shapely.geometry as sg
    feats = [sg.shape(f['geometry']) for f in json.load(open(land_path))['features']]
    for cfgname, sp in src.items():
        cfg = json.load(open(os.path.join(HERE, cfgname), encoding='utf-8')); dn, db, mn, mb = b.build(cfg, sp, land_path)
        ok(f'R1 {cfgname}: a fresh build from the pinned inputs gives the committed display file and manifest, byte for byte', open(os.path.join(A, dn), 'rb').read() == db and open(os.path.join(A, mn), 'rb').read() == mb)
        d = json.loads(db); box = sg.box(min(d['lon']) - 3, min(d['lat']) - 3, max(d['lon']) + 3, max(d['lat']) + 3); land = shapely.unary_union([g.intersection(box) for g in feats if g.intersects(box)]); prep = shapely.prepared.prep(land)
        ok(f'R2 {cfgname}: no fix shown lies on land in the pinned map', not any(prep.contains(sg.Point(x, y)) for x, y in zip(d['lon'], d['lat'])))
        lim = json.loads(mb)['gap_rule']['max_join_seconds']; touch = clear_refused = 0
        for i in range(1, d['n']):
            if d['t'][i] - d['t'][i - 1] > lim: continue
            # the drawn line at a finer sampling than the build used (250 m), as an independent check of the build's 1 km sampling
            pts = ar.chord_points(d['lat'][i - 1], d['lon'][i - 1], d['lat'][i], d['lon'][i], 0.25); hit = prep.intersects(sg.LineString(pts) if pts[0] != pts[-1] else sg.Point(pts[0]))
            if d['j'][i] and hit: touch += 1
            if not d['j'][i] and not hit: clear_refused += 1
        ok(f'R3 {cfgname}: no joined step\'s drawn line touches land in the pinned map, sampled every 250 m', touch == 0, touch)
        ok(f'R4 {cfgname}: every step refused within the time limit does touch land', clear_refused == 0, clear_refused)
    part3 = 'run'
else: print('Part 3 ' + part3)
print(('FAILED' if nfail else 'PASSED') + f'  {npass} passed, {nfail} failed; part 3 (real inputs): {part3}'); sys.exit(1 if nfail else 0)
