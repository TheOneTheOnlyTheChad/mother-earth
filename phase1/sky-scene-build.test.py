#!/usr/bin/env python3
"""Mother Earth — Sky zoom-out scene generator (SKY-ZOOM-OUT-PROPOSAL rev 2.2 §11 checks 1, 4, 20).
Needs pyerfa (test-only dependency; pip install pyerfa). Run:  python3 -I phase1/sky-scene-build.test.py
Each check is also run against a deliberately broken variant ("break"), which must fail it.
"""
import json, os, re, sys, math, shutil, subprocess, tempfile
import numpy as np, erfa
HERE = os.path.dirname(os.path.abspath(__file__)); SKY = os.path.join(HERE, 'sky')
sys.path.insert(0, SKY)
import earth_orient as E
P = F = 0
def ok(name, cond, got=None):
    global P, F
    if cond: P += 1
    else: F += 1; print(f'FAIL  {name}' + (f'\n      got: {got}' if got is not None else ''))

scene = json.load(open(os.path.join(SKY, 'catalogue/sky-scene-2026-11-R1.json')))
r1 = json.load(open(os.path.join(SKY, 'catalogue/sky-2026-11-R1.json')))
man = json.load(open(os.path.join(SKY, 'revisions/sky-2026-11-R1.json')))
VEC = re.compile(r'(\d+\.\d+) = A\.D\. (\d{4}-\w{3}-\d{2}) 00:00:00\.0000 \S+\s*\n\s*X =\s*(\S+) Y =\s*(\S+) Z =\s*(\S+)')
vecs = {b: [(float(m.group(1)), np.array([float(m.group(i)) for i in (3, 4, 5)])) for m in VEC.finditer(open(os.path.join(SKY, man['raw'][b])).read())] for b in ('moon', 'sun')}

def unit(lat, lng):
    a, b = math.radians(lat), math.radians(lng); return np.array([math.cos(a) * math.cos(b), math.cos(a) * math.sin(b), math.sin(a)])
def sep(a, b): return math.degrees(math.atan2(np.linalg.norm(np.cross(a, b)), a @ b))
def full_chain(b):
    out = []
    for jd, v in vecs[b]:
        t1, t2 = erfa.taitt(*erfa.utctai(jd, 0.0)); out.append(erfa.c2t06a(t1, t2, jd, 0.0, 0.0, 0.0) @ v)
    return out
FULL = {b: full_chain(b) for b in vecs}

# ---- check 1: generator vs full ERFA chain <= 0.004 deg, both bodies, every date
def check1(rows_by_body):
    return max(sep(unit(r[1], r[2]), FULL[b][i] / np.linalg.norm(FULL[b][i])) for b in ('moon', 'sun') for i, r in enumerate(rows_by_body[b]))
real = {b: scene['bodies'][b]['rows'] for b in ('moon', 'sun')}
m1 = check1(real)
ok('check 1: scene vs ERFA c2t06a <= 0.004 deg, both bodies, all 579 dates', m1 <= 0.004 and len(real['sun']) == 579 == len(real['moon']), m1)
print(f'  check 1 measured max: {m1:.5f} deg')
# plain-Python transcription vs ERFA's own method functions <= 0.0001 deg (and the matrices bit-for-bit, here)
worst = 0
for b in ('moon', 'sun'):
    for jd, v in vecs[b]:
        tt = E.TT_MINUS_UTC_S / 86400; ref = np.array([[math.cos(erfa.gmst06(jd, 0, jd, tt)), math.sin(erfa.gmst06(jd, 0, jd, tt)), 0], [-math.sin(erfa.gmst06(jd, 0, jd, tt)), math.cos(erfa.gmst06(jd, 0, jd, tt)), 0], [0, 0, 1]]) @ erfa.pmat06(jd, tt) @ v
        worst = max(worst, sep(np.array(E.icrf_to_earth_fixed(list(v), jd)), ref))
ok('check 1: plain-Python method vs ERFA pmat06/gmst06 <= 0.0001 deg', worst <= 1e-4, worst)
# break no-precession: GMST straight on the ICRF vector -> must fail check 1
def variant(f):
    out = {}
    for b in ('moon', 'sun'):
        out[b] = []
        for jd, v in vecs[b]:
            g = f(jd, v); out[b].append([None, *E.beneath(g)])
    return out
def nopre(jd, v):
    g = E.gmst06(jd, 0, jd, E.TT_MINUS_UTC_S / 86400); c, s = math.cos(g), math.sin(g); return [c * v[0] + s * v[1], -s * v[0] + c * v[1], v[2]]
ok('break no-precession fails check 1', check1(variant(nopre)) > 0.004, check1(variant(nopre)))
def eraonly(jd, v):
    g = E.era00(jd, 0); c, s = math.cos(g), math.sin(g); return [c * v[0] + s * v[1], -s * v[0] + c * v[1], v[2]]
ok('break era-only fails check 1', check1(variant(eraonly)) > 0.004, check1(variant(eraonly)))
wrong_day = {b: real[b][1:] + real[b][:1] for b in real}
ok('break wrong-day (rows shifted one date) fails check 1', check1(wrong_day) > 0.004)

# ---- check 4: scene range_km == R1 range_km exactly; coverage/time identical
def check4(sc):
    same_rows = all(sc['bodies'][b]['rows'][i][0] == r1['bodies'][b]['rows'][i][0] and sc['bodies'][b]['rows'][i][3] == r1['bodies'][b]['rows'][i][1] for b in ('moon', 'sun') for i in range(579))
    return same_rows and sc['coverage'] == r1['coverage'] and sc['time'] == r1['time']
ok('check 4: ranges, coverage and time identical to R1', check4(scene))
import copy
br = copy.deepcopy(scene); br['bodies']['sun']['rows'][10][3] = round(br['bodies']['sun']['rows'][10][3], 1)
ok('break rounded-range fails check 4', not check4(br))
br = copy.deepcopy(scene); br['coverage']['end'] = '2027-12-30'
ok('break coverage-drift fails check 4', not check4(br))
ok('pairs_with names R1 and its pinned sha256', scene['pairs_with'] == {'catalogue_revision': 'sky-2026-11-R1', 'fileSha256': 'f851f16438415bc1e05b392e3e1616052b6347c637ee5ea98df307052058368a'})
ok('envelope the Worker checks: catalogue sky, revision, coverage, non-empty bodies', scene['catalogue'] == 'sky' and scene['catalogue_revision'] == 'sky-scene-2026-11-R1' and scene['coverage'] and scene['bodies']['moon']['rows'] and scene['bodies']['sun']['rows'])

# ---- check 20: build refuses an unpaired refresh; --check reproduces the bytes
r = subprocess.run([sys.executable, os.path.join(SKY, 'build_scene.py'), '--check'], capture_output=True, text=True)
ok('build_scene --check reproduces the committed scene file', r.returncode == 0 and 'check OK' in r.stdout, r.stdout + r.stderr)
def in_copy(mut):
    d = tempfile.mkdtemp(); shutil.copytree(SKY, os.path.join(d, 'sky')); mut(os.path.join(d, 'sky'))
    return subprocess.run([sys.executable, os.path.join(d, 'sky', 'build_scene.py'), '--check'], capture_output=True, text=True)
def edit(p, f):
    t = open(p).read(); n = f(t); assert n != t, 'fixture did not change ' + p; open(p, 'w').write(n)
r = in_copy(lambda d: edit(os.path.join(d, 'raw/hz-sun-ut-20261110.txt'), lambda t: t.replace('RG= 1.481737131467997E+08', 'RG= 1.481737131467998E+08')))
ok('unpaired-refresh (sun export changed) is REJECTED', r.returncode == 2 and 'REJECTED' in r.stderr, r.stderr)
r = in_copy(lambda d: edit(os.path.join(d, 'revisions/sky-scene-2026-11-R1.json'), lambda t: t.replace('f851f164', 'f851f165')))
ok('unpaired-refresh (wrong pairs_with pin) is REJECTED', r.returncode == 2 and 'unpaired' in r.stderr, r.stderr)
r = in_copy(lambda d: edit(os.path.join(d, 'BUILD.json'), lambda t: t.replace('2026-11-10T09:00:00Z', '2026-11-10T09:00:01Z')))
ok('unpaired-refresh (different generator run) is REJECTED', r.returncode == 2 and 'unpaired' in r.stderr, r.stderr)
print(f'\n{P} passed, {F} failed'); sys.exit(1 if F else 0)
