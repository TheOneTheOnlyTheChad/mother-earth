#!/usr/bin/env python3
"""Tests for build_corridor.py and corridor_geom.py (docs/concepts/ANIMALS-CORRIDOR-PROPOSAL.md rev 2.2, K1 to K7). Standard library only.
Part 1: made-up shapes (no source needed). Part 2: the committed output files. Part 3: the pinned zip (set ME_CORRIDOR_ZIP), else NOT RUN.
Run: python3 -I phase1/animals/build_corridor.test.py"""
import copy, hashlib, io, json, math, os, re, struct, subprocess, sys, zipfile
from fractions import Fraction
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import build_corridor as B, corridor_geom as G
CFG = json.load(open(os.path.join(HERE, 'mule-deer-east-walker-corridor.json'), encoding='utf-8')); A = os.path.join(ROOT, 'assets', 'animals')
P = F = 0
def ok(name, cond, got=None):
    global P, F
    if cond: P += 1
    else: F += 1; print('FAIL  ' + name + ('' if got is None else '\n      got: ' + str(got)[:600]))
sha = lambda b: hashlib.sha256(b).hexdigest()
def rect(x0, x1, y0, y1, hole=False):
    r = [(x0, y0), (x0, y1), (x1, y1), (x1, y0), (x0, y0)]            # clockwise = outer
    return r[::-1] if hole else r
def stops(fn, rule):
    try: fn()
    except B.Stop as e: return str(e).startswith(f'rule {rule}:'), str(e)
    return False, 'no stop'

# ---------- a second, different calculation of the three areas (K1b): horizontal strips, exact
def strips(M, H):
    """twice the areas (A(M), A(H), shared) by cutting the plane into horizontal strips between successive vertex heights.
    Valid when no two boundaries cross between vertex heights; it checks that and raises if they do."""
    E = []
    for cls, rings in ((0, M), (1, H)):
        for r in rings:
            for a, b in G.segments(r):
                if a[1] != b[1]: lo, hi = (a, b) if a[1] < b[1] else (b, a); E.append((Fraction(lo[1]), Fraction(hi[1]), Fraction(lo[0]), Fraction(hi[0]), cls))
    ys = sorted({e[0] for e in E} | {e[1] for e in E}); E.sort(key=lambda e: e[0]); tot = [0, 0, 0]; act = []; k = 0
    for i in range(len(ys) - 1):
        y0, y1 = ys[i], ys[i + 1]
        while k < len(E) and E[k][0] <= y0: act.append(E[k]); k += 1
        act = [e for e in act if e[1] > y0]; row = []
        for e in act:
            t0 = (y0 - e[0]) / (e[1] - e[0]); t1 = (y1 - e[0]) / (e[1] - e[0]); row.append((e[2] + (e[3] - e[2]) * t0, e[2] + (e[3] - e[2]) * t1, e[4]))
        row.sort(key=lambda v: (v[0] + v[1], v[0]))
        for j in range(len(row) - 1):
            if row[j][0] > row[j + 1][0] or row[j][1] > row[j + 1][1]: raise ValueError('boundaries cross inside a strip')
        inm = inh = False
        for j in range(len(row) - 1):
            if row[j][2] == 0: inm = not inm
            else: inh = not inh
            a2 = ((row[j + 1][0] - row[j][0]) + (row[j + 1][1] - row[j][1])) * (y1 - y0)       # twice the trapezoid's area
            if inm: tot[0] += a2
            if inh: tot[1] += a2
            if inm and inh: tot[2] += a2
    return tot

# ================= Part 1: made-up shapes
med_hole = [rect(0, 1000, 0, 1000), rect(400, 600, 400, 600, hole=True)]
cases = [   # name, Medium rings, High rings, expected relation, expected twice-shared (None when unresolved)
 ('GPT crossing rectangles (10,000 m2 shared): never bands', [rect(-200, 200, -50, 50)], [rect(-50, 50, -200, 200)], 'unresolved', None),
 ('GPT shared-edge rectangles (40,000 m2 shared): never bands', [rect(0, 400, 0, 200)], [rect(200, 600, 0, 200)], 'unresolved', None),
 ('GPT High covering a Medium hole (120,000 m2 shared of 160,000): never nested', med_hole, [rect(300, 700, 300, 700)], 'mixed', 240000),
 ('one High component inside Medium, one outside', [rect(0, 1000, 0, 1000)], [rect(100, 200, 100, 200), rect(2000, 2100, 0, 100)], 'mixed', 20000),
 ('a Medium component inside High', [rect(100, 200, 100, 200)], [rect(0, 1000, 0, 1000)], 'mixed', 20000),
 ('High strictly inside a hole of Medium', med_hole, [rect(450, 550, 450, 550)], 'bands', 0),
 ('High wholly inside Medium\'s fill', med_hole, [rect(100, 300, 100, 300)], 'nested', 80000),
 ('High exactly filling a Medium hole (boundaries coincide)', med_hole, [rect(400, 600, 400, 600)], 'unresolved', None),
 ('two shapes meeting only at a corner', [rect(0, 100, 0, 100)], [rect(100, 200, 100, 200)], 'unresolved', None),
 ('High inside Medium touching its boundary at one vertex', [rect(0, 1000, 0, 1000)], [[(0, 500), (200, 600), (200, 400), (0, 500)]], 'unresolved', None),
 ('far apart', [rect(0, 100, 0, 100)], [rect(500, 600, 0, 100)], 'bands', 0),
]
for name, M, H, want, shared in cases:
    r = B.relation(M, H, 50); good = r['relation'] == want and (shared is None or r['twice_area_shared'] == shared)
    if shared is not None:
        s = strips(M, H); good = good and s[2] == shared and s[0] == r['twice_area_medium'] and s[1] == r['twice_area_high']
    ok(f'1a K1, K1b relation "{name}" is {want}' + ('' if shared is None else f', shared area exactly {shared // 2} by the builder and by the strip calculation'), good, r)
ok('1b K1 the two GPT cases with boundary contact never pass as bands or nested, and the covered hole never passes as nested', all(B.relation(M, H, 50)['relation'] not in (('bands', 'nested') if i < 2 else ('nested',)) for i, (_, M, H, _, _) in enumerate(cases[:3])))
fl = lambda rs: [[(float(x), float(y)) for x, y in r] for r in rs]
ok('1c the same relations come out with floating-point input (the source\'s kind of number) as with whole numbers', all(B.relation(fl(M), fl(H), 50.0)['relation'] == want for _, M, H, want, _ in cases))
V = lambda rings, rule: stops(lambda: B.validate(rings, 50, 6, 'made-up'), rule)
bad = {
 'a hole outside every outer ring (orientation does not fit nesting)': ([rect(0, 100, 0, 100), rect(500, 600, 0, 100, hole=True)], 8),
 'an outer ring inside another outer ring': ([rect(0, 1000, 0, 1000), rect(100, 200, 100, 200)], 8),
 'two outer rings that overlap (their sides cross)': ([rect(0, 100, 0, 100), rect(50, 150, 50, 150)], 12),
 'two rings touching along a side': ([rect(0, 100, 0, 100), rect(100, 200, 0, 100)], 12),
 'a ring that crosses itself (a bow tie)': ([[(0, 0), (100, 100), (100, 0), (0, 60), (0, 0)]], 9),
 'a ring that touches itself at a vertex': ([[(0, 0), (0, 100), (50, 50), (100, 100), (100, 0), (50, 50), (0, 0)]], 9),
 'a ring whose vertices are all on one line': ([[(0, 0), (50, 0), (100, 0), (0, 0)]], 7),
 'a ring with two equal successive vertices': ([[(0, 0), (0, 100), (0, 100), (100, 100), (100, 0), (0, 0)]], 7),
 'a ring that is not closed': ([[(0, 0), (0, 100), (100, 100), (100, 0)]], 7),
 'a coordinate that is not finite': ([[(0.0, 0.0), (0.0, float('nan')), (100.0, 100.0), (100.0, 0.0), (0.0, 0.0)]], 6),
 'a hole inside a hole': ([rect(0, 1000, 0, 1000), rect(100, 900, 100, 900, hole=True), rect(200, 300, 200, 300, hole=True)], 8),
}
res = {k: V(r, n) for k, (r, n) in bad.items()}
ok('1d K1 validity: each made-up fault stops at its rule (' + '; '.join(bad) + ')', all(v[0] for v in res.values()), {k: v[1] for k, v in res.items() if not v[0]})
st = B.validate([rect(0, 1000, 0, 1000), rect(100, 400, 100, 400, hole=True), rect(200, 300, 200, 300), rect(2000, 2100, 0, 100)], 50, 6, 'made-up')
ok('1e a valid class is accepted with its nesting recorded: an island inside a hole is an outer ring; the hole\'s parent is the outer ring around it', st['outer'] == [0, 2, 3] and st['holes'] == [1] and st['parent'] == [None, 0, 1, None], st)
ok('1f contact kinds are exact: crossing, touching at an end, running together, apart', [G.contact((0, 0), (10, 10), (0, 10), (10, 0)), G.contact((0, 0), (10, 0), (5, 0), (5, 9)), G.contact((0, 0), (10, 0), (5, 0), (20, 0)), G.contact((0, 0), (10, 0), (0, 1), (10, 1)), G.contact((0, 0), (10, 0), (10, 0), (20, 0)), G.contact((0.1, 0.1), (0.3, 0.3), (0.2, 0.2), (0.4, 0.4))] == ['cross', 'touch', 'overlap', None, 'touch', 'overlap'])

# ================= Part 2: the committed files
cat_b = open(os.path.join(A, 'corridors-R1.catalog.json'), 'rb').read(); cat = json.loads(cat_b); ce = cat['corridors'][0]
man_b = open(os.path.join(A, ce['manifest']), 'rb').read(); man = json.loads(man_b); dis_b = open(os.path.join(A, man['display']['file']), 'rb').read(); dis = json.loads(dis_b)
js = open(os.path.join(ROOT, 'animals-corridor.js'), encoding='utf-8').read()
ok('2a the chain of checksums holds: the page script pins the list, the list pins the manifest, the manifest pins the display file', sha(cat_b) in js and ce['manifest_sha256'] == sha(man_b) and man['display']['sha256'] == sha(dis_b) and man['display']['bytes'] == len(dis_b))
S = dis['units_per_degree']
def dec(a):
    r = []; x = y = 0
    for i in range(0, len(a), 2): x += a[i]; y += a[i + 1]; r.append((x, y))
    return r + [r[0]]
D = {c['key']: [[dec(p['outer'])] + [dec(h) for h in p['holes']] for p in c['polygons']] for c in dis['classes']}
allr = {k: [r for pg in v for r in pg] for k, v in D.items()}
ok('2b K4 the display file holds exactly two classes, medium then high, with 6 and 3 rings and the manifest\'s point counts; each polygon has only "outer" and "holes"', [c['key'] for c in dis['classes']] == ['medium', 'high'] and len(allr['medium']) == 6 and len(allr['high']) == 3 and all(sum(len(r) for r in allr[k]) == man['facts'][k]['points'] for k in allr) and all(sorted(p) == ['holes', 'outer'] for c in dis['classes'] for p in c['polygons']) and sorted(dis) == ['classes', 'id', 'revision', 'ring_encoding', 'schema', 'units_per_degree'])
def numarrays(o, path=''):
    if isinstance(o, list):
        if len(o) > 8 and all(isinstance(v, (int, float)) for v in o): yield path
        for i, v in enumerate(o): yield from numarrays(v, f'{path}[{i}]')
    elif isinstance(o, dict):
        for k, v in o.items(): yield from numarrays(v, f'{path}.{k}')
ok('2c K4 no coordinate array exists outside the two shown classes: none in the manifest, none in the list; the manifest names Low only as not shown, with its checked counts and its definition', list(numarrays(man)) == [] and list(numarrays(cat)) == [] and man['class_not_shown'] == 'low' and sorted(man['facts']) == ['high', 'medium'] and sorted(man['low_checked']) == ['points', 'rings', 'source_net_area_km2'])
ok('2d the manifest records the relation as nested with exact evidence in source and output, no contact of any kind, and the Medium-only band', man['relation']['result'] == 'nested' and all(man['relation'][t][k] == 0 for t in ('source', 'rounded') for k in ('proper_crossings', 'point_contacts', 'coincident_stretches')) and man['relation']['source']['shared_equals_high_exactly'] and man['relation']['rounded']['shared_equals_high_exactly'] and abs(man['medium_only_band_km2'] - (279.95576 - 159.08099)) < 1e-4)
s2 = strips(allr['medium'], allr['high']); R = man['relation']['rounded']
ok('2e K1b the strip calculation on the committed display file gives exactly the manifest\'s three whole-number areas, and shared equals High', s2 == [R['twice_area_medium_units2'], R['twice_area_high_units2'], R['twice_area_shared_units2']] and s2[2] == s2[1] and s2[1] < s2[0], s2)
for k in ('medium', 'high'):
    stv = B.validate(allr[k], 30, 6, k)
    ok(f'2f the committed {k} rings pass the validity rules again here, and the display file groups each hole under its enclosing outer ring', all(G.in_ring(h[0], pg[0]) > 0 for pg in D[k] for h in pg[1:]) and len(stv['outer']) == man['facts'][k]['patches'] and len(stv['holes']) == man['facts'][k]['holes'])
L = man['limits']; pr = [p for k in ('medium', 'high') for p in man['facts'][k]['per_ring']]
ok('2g K5 every ring\'s recorded displacement is within 0.75 m and its area change within 0.75 m times its perimeter; each class\'s rounded area is within 0.05% of its source area', all(p['max_displacement_m'] <= 0.75 and abs(p['area_change_m2']) <= 0.75 * p['perimeter_m'] + 0.1 for p in pr) and all(abs(man['facts'][k]['rounded_net_area_km2'] - man['facts'][k]['source_net_area_km2']) <= 0.0005 * man['facts'][k]['source_net_area_km2'] for k in ('medium', 'high')), max(p['max_displacement_m'] for p in pr))
W = man['wording']
ok('2h wording: GPT\'s method sentence and datum sentence word for word; the omission notice; no "averaged across animals"; thresholds are the layer\'s own', W['method_plain'] == 'The source models a migration-use footprint for each sampled animal, combines the footprints, and classifies areas by the share of sampled animals represented there.' and 'displayed on a WGS84 reference globe without a datum transformation. The local datum offset and absolute positional accuracy have not been established.' in W['geometry'] and W['omission'] == 'Selected higher-use migration areas. The broader Low-use footprint is omitted.' and 'averaged across animals' not in json.dumps(W) and '10–20% of the sampled population' in man['definitions_as_in_metadata']['medium'] and 'greater than 20%' in man['definitions_as_in_metadata']['high'])
ok('2h2 GPT Stage 4 hold, point 1: the Medium legend line is neutral (a published source class that includes High, no number); High keeps its threshold as the source\'s; the nested notes say Medium contains High despite the 10 to 20% text and claim no share for the band; the full Medium area and the Medium-minus-High difference carry different labels and different values',
   W['legend_medium'] == 'Medium use: published source class (includes High).' and not re.search(r'\d', W['legend_medium']) and W['legend_high'].endswith('as the source defines it.') and 'contain the High polygons' in W['nested_note'] and 'No share of animals has been established' in W['nested_note'] and 'no share has been established' in W['legend_nested']
   and 'Medium polygons contain its High polygons' in W['definitions_note'] and W['area_medium_label'] != W['area_band_label'] and 'not a class in the source' in W['area_band_label'] and abs(man['facts']['medium']['source_net_area_km2'] - 279.95576) < 1e-5 and abs(man['medium_only_band_km2'] - 120.87477) < 1e-5
   and not any(re.search(r'10\s*(–|-|to)\s*20\s*%', W[k]) for k in W if k not in ('nested_note', 'legend_nested', 'definitions_note')) and '10% or more' not in json.dumps(W, ensure_ascii=False))
pins = {'journeys-R1.catalog.json': '1386e4cc4fbc8c1c294ce867f42702c3c838fbde3c41fd9ce788fc275a77fafe', 'populations-R1.catalog.json': '5c49f68f6d1ae076b0b2b357637a9dd93602b19d14d8214ada272b3e55d848eb'}
ok('2i K6 the journey list and the population list are byte-identical to Stage 3', all(sha(open(os.path.join(A, n), 'rb').read()) == h for n, h in pins.items()))
tracked = subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True, text=True)
if tracked.returncode == 0: ok('2j K7 no source file is tracked in the repository (no .shp, .dbf, .prj, .zip)', not [f for f in tracked.stdout.split('\n') if f.lower().endswith(('.shp', '.dbf', '.prj', '.shx', '.zip'))])
else: print('NOT RUN  2j as a tracked-file check: this copy has no Git metadata')

# ================= Part 3: the pinned zip
Z = os.environ.get('ME_CORRIDOR_ZIP')
if not Z or not os.path.exists(Z): print('NOT RUN  part 3: set ME_CORRIDOR_ZIP to the pinned zip')
else:
    zb = open(Z, 'rb').read(); cfg = copy.deepcopy(CFG); cfg['_path'] = 'mule-deer-east-walker-corridor.json'; files, _ = B.build(cfg, zb)
    ok('3a K2 the three outputs rebuild byte-identically from the pinned zip', all(open(os.path.join(A, n), 'rb').read() == b for n, b in files.items()) and len(files) == 3, list(files))
    z = zipfile.ZipFile(io.BytesIO(zb)); inner = {k: z.read(CFG['inner_dir'] + f['name']) for k, f in CFG['inner'].items()}
    def repin(change, unpinned=False):
        f2 = dict(inner); change(f2); buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as o:
            for k, f in CFG['inner'].items(): o.writestr(CFG['inner_dir'] + f['name'], f2[k])
        nb = buf.getvalue(); c = copy.deepcopy(CFG); c['_path'] = 'x.json'
        if not unpinned:
            c['source_zip'] = {'name': 'made-up.zip', 'bytes': len(nb), 'sha256': sha(nb)}
            for k in c['inner']: c['inner'][k] = dict(c['inner'][k], bytes=len(f2[k]), sha256=sha(f2[k]))
            if f2['prj'] != inner['prj']: c['prj_text'] = f2['prj'].decode('ascii')
        return lambda: B.build(c, nb)
    def swap_rows(f):
        b = bytearray(f['dbf']); n, hl, rl = struct.unpack('<IHH', bytes(b[4:12])); r1 = bytes(b[hl + rl:hl + 2 * rl]); b[hl + rl:hl + 2 * rl] = b[hl + 2 * rl:hl + 3 * rl]; b[hl + 2 * rl:hl + 3 * rl] = r1; f['dbf'] = bytes(b)
    def fold_vertex(f, rec=2, idx=3000):
        b = bytearray(f['shp']); o = 100
        for r in range(rec + 1):
            _, cl = struct.unpack('>ii', bytes(b[o:o + 8])); c0 = o + 8
            if r == rec:
                npart = struct.unpack('<i', bytes(b[c0 + 36:c0 + 40]))[0]; p = c0 + 44 + 4 * npart + 16 * idx; b[p:p + 16] = b[p + 32:p + 48]          # vertex idx takes the place of vertex idx + 2
            o += 8 + cl * 2
        f['shp'] = bytes(b)
    def move_vertex(f, rec=1, idx=5000, dx=0.0, dy=20000.0):
        b = bytearray(f['shp']); o = 100
        for r in range(rec + 1):
            _, cl = struct.unpack('>ii', bytes(b[o:o + 8])); c0 = o + 8
            if r == rec:
                npart = struct.unpack('<i', bytes(b[c0 + 36:c0 + 40]))[0]; p = c0 + 44 + 4 * npart + 16 * idx; x, y = struct.unpack('<2d', bytes(b[p:p + 16])); b[p:p + 16] = struct.pack('<2d', x + dx, y + dy)
            o += 8 + cl * 2
        f['shp'] = bytes(b)
    made = {
     'a changed byte without re-pinning stops at the checksum (rule 1)': (repin(lambda f: f.__setitem__('xml', f['xml'] + b' '), unpinned=True), 1),
     're-pinned: the central meridian in the projection text changed (rule 2)': (repin(lambda f: f.__setitem__('prj', f['prj'].replace(b'-96.0', b'-95.0'))), 2),
     're-pinned: Medium and High rows swapped in the attribute table (rule 3)': (repin(swap_rows), 3),
     're-pinned: the High definition reworded in the metadata (rule 4)': (repin(lambda f: f.__setitem__('xml', f['xml'].replace(b'greater than 20%', b'greater than 25%'))), 4),
     're-pinned: one Medium vertex moved 20 km, changing the area (rule 5)': (repin(move_vertex), 5),
     're-pinned: one High vertex placed on the vertex two further on, so the outline touches itself; area inside tolerance (rule 9, not simple)': (repin(fold_vertex), 9),
    }
    rs = {k: stops(fn, n) for k, (fn, n) in made.items()}
    ok('3b K1 made-up archives stop the build at the named rule: ' + '; '.join(made), all(v[0] for v in rs.values()), {k: v[1][:160] for k, v in rs.items() if not v[0]})
    # GPT's Stage 4 hold, point 1: the Medium wording is written for a nested source, so any other relation must stop the build rather than ship that wording
    _rel = B.relation
    try:
        B.relation = lambda M, H, cell: dict(_rel(M, H, cell), relation='bands', twice_area_shared=0)
        r27 = stops(lambda: B.build(copy.deepcopy(cfg), zb), 27)
    finally: B.relation = _rel
    ok('3b2 if the two classes were found not nested, the build stops (rule 27) instead of publishing wording that says Medium includes High', r27[0], r27[1][:200])
    # ---- an independent reading and an independent inverse projection (K3): the authalic-latitude series, not the builder's iteration
    def shp_rings(b):
        o = 100; out = []
        while o < len(b):
            cl = struct.unpack('>i', b[o + 4:o + 8])[0]; c = b[o + 8:o + 8 + 2 * cl]; o += 8 + 2 * cl; npart, npt = struct.unpack('<2i', c[36:44]); parts = list(struct.unpack(f'<{npart}i', c[44:44 + 4 * npart])) + [npt]; xy = struct.unpack(f'<{2 * npt}d', c[44 + 4 * npart:])
            out.append([[(xy[2 * j], xy[2 * j + 1]) for j in range(parts[k], parts[k + 1])] for k in range(npart)])
        return out
    a = 6378137.0; f = 1 / 298.257222101; e2 = 2 * f - f * f; e = math.sqrt(e2); rad = math.radians
    q = lambda p: (1 - e2) * (math.sin(p) / (1 - e2 * math.sin(p) ** 2) - (1 / (2 * e)) * math.log((1 - e * math.sin(p)) / (1 + e * math.sin(p))))
    m = lambda p: math.cos(p) / math.sqrt(1 - e2 * math.sin(p) ** 2)
    n = (m(rad(29.5)) ** 2 - m(rad(45.5)) ** 2) / (q(rad(45.5)) - q(rad(29.5))); Cc = m(rad(29.5)) ** 2 + n * q(rad(29.5)); r0 = a * math.sqrt(Cc - n * q(rad(23.0))) / n; qp = q(math.pi / 2)
    def inv(x, y):
        rho = math.hypot(x, r0 - y); th = math.atan2(x, r0 - y); be = math.asin((Cc - rho * rho * n * n / (a * a)) / n / qp)
        ph = be + (e2 / 3 + 31 * e2 ** 2 / 180 + 517 * e2 ** 3 / 5040) * math.sin(2 * be) + (23 * e2 ** 2 / 360 + 251 * e2 ** 3 / 3780) * math.sin(4 * be) + (761 * e2 ** 3 / 45360) * math.sin(6 * be)
        return math.degrees(rad(-96.0) + th / n), math.degrees(ph)
    bb = struct.unpack('<4d', inner['shp'][36:68]); cs = [inv(bb[0], bb[1]), inv(bb[0], bb[3]), inv(bb[2], bb[1]), inv(bb[2], bb[3])]; mb = CFG['metadata_bounds']
    ok('3c K3 fixture from the source\'s own software: this test\'s separate inverse (series form) turns the projected box\'s corners into the metadata\'s four bounding values to four decimals', [round(min(c[0] for c in cs), 4), round(max(c[0] for c in cs), 4), round(min(c[1] for c in cs), 4), round(max(c[1] for c in cs), 4)] == [mb['west'], mb['east'], mb['south'], mb['north']])
    recs = shp_rings(inner['shp']); worst = 0.0; cnt = 0; same = True
    for key, ri in (('medium', 1), ('high', 2)):
        src = recs[ri]; st0 = B.validate(src, 25.0, 6, key); order = [[oi] + [h for h in st0['holes'] if st0['parent'][h] == oi] for oi in st0['outer']]; flat = [src[i] for grp in order for i in grp]
        same = same and len(flat) == len(allr[key])
        for sr, dr in zip(flat, allr[key]):
            same = same and len(sr) == len(dr)
            for (x, y), (ux, uy) in zip(sr, dr):
                lo, la = inv(x, y); worst = max(worst, abs(lo * S - ux), abs(la * S - uy)); cnt += 1
    ok(f'3d K3 every vertex of both classes ({cnt}), converted by this test\'s own reader and series inverse, lies within half a rounding unit (plus 0.01 unit for the series\' truncation) of the display file\'s value', same and cnt == 27966 + 20623 and worst <= 0.51, worst)
    print('NOT DONE  K3 fixture (b): the printed worked example in Snyder (USGS Professional Paper 1395) has not been copied from the text; no number from it is used here')
    low = {tuple((round(inv(x, y)[0] * S), round(inv(x, y)[1] * S)) for x, y in r[:40]) for r in recs[0]}; shown = {tuple(r[:40]) for k in allr for r in allr[k]}
    ok('3e K4 no ring in the display file starts like any of Low\'s 14 rings (first 40 vertices compared), and the display file\'s 9 rings are exactly Medium\'s 6 and High\'s 3 as checked in 3d', len(low) == 14 and not (low & shown) and len(shown) == 9)
    sM, sH = recs[1], recs[2]; t = strips(sM, sH); r0_ = B.relation(sM, sH, 25.0)
    ok('3f K1b on the real source, the strip calculation gives exactly the builder\'s three areas (as exact fractions), and shared equals High exactly: nested', t == [r0_['twice_area_medium'], r0_['twice_area_high'], r0_['twice_area_shared']] and t[2] == t[1] and float(Fraction(t[2]) / 2) == man['relation']['source']['area_shared_m2'], [float(v) / 2e6 for v in t])
    chk = subprocess.run([sys.executable, '-I', os.path.join(HERE, 'build_corridor.py'), '--config', os.path.join(HERE, 'mule-deer-east-walker-corridor.json'), '--source', Z, '--out-dir', A, '--check'], capture_output=True, text=True)
    ok('3g --check exits 0 and reports "same" for the three files', chk.returncode == 0 and chk.stdout.count('same') == 3, chk.stdout + chk.stderr)
print(('PASSED' if not F else 'FAILED') + f'  {P} passed, {F} failed; part 3 (real input): ' + ('run' if Z and os.path.exists(Z) else 'NOT RUN'))
sys.exit(1 if F else 0)
