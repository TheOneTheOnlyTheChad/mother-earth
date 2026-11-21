"""Mother Earth — made-up tracks that pin down what the candidate algorithms in phase1/animals/argos_rules.py do, INCLUDING their
weaknesses. A passing test here means "the algorithm behaves as its description says", not "the algorithm is right".
Positions lie along the equator; 0.01 degree of longitude is about 1.113 km. V = 3 m/s throughout (10.8 km per hour).
Run: python3 -I phase1/animals/argos_rules.test.py   (the B candidate is not used by the build and is not in argos_rules.py)"""
import importlib.util, os, random, sys
spec = importlib.util.spec_from_file_location('q', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'argos_rules.py')); q = importlib.util.module_from_spec(spec); spec.loader.exec_module(q)
V = 3.0; H = 3600
def R(hours, km_east, cls): return (int(hours * H), 0.0, km_east / 111.319, cls, f'h{hours}')     # (time, lat, lon, class, label)
ok_n = bad_n = 0
def ok(name, cond, got=None):
    global ok_n, bad_n
    if cond: ok_n += 1
    else: bad_n += 1; print('FAIL  ' + name + ('' if got is None else '\n      got: ' + repr(got)[:400]))
def labels(rows, keep): return [rows[i][4] for i in keep]
def no_fast_step(rows, keep): return all(q.speed(rows[a], rows[b])[0] <= V for a, b in zip(keep[:-1], keep[1:]))

# ---- A "forward"
t = [R(0, 0, 'B'), R(1, 5, 'B'), R(2, 400, '3'), R(3, 12, 'B'), R(4, 18, 'B')]
ok('A1 a far row is rejected and the track continues from the last kept row', labels(t, q.forward(t, V)) == ['h0', 'h1', 'h3', 'h4'], labels(t, q.forward(t, V)))
t = [R(0, 400, 'B'), R(1, 0, '3'), R(2, 5, '3'), R(3, 9, '3'), R(40, 20, '3')]
ok('A2 WEAKNESS a wrong first row is never tested and correct rows after it are rejected until time allows (cascade)', labels(t, q.forward(t, V)) == ['h0', 'h40'], labels(t, q.forward(t, V)))
ok('A3 an empty track and a single row', q.forward([], V) == [] and q.forward([R(0, 0, 'B')], V) == [0])

# ---- C "anchored"
t = [R(0, 0, '1'), R(1, 300, '3'), R(2, 5, '2')]
ok('C1 WEAKNESS within the anchor classes the choice is chronological: an earlier class-1 row rejects a later class-3 row', labels(t, q.anchored(t, V, '321')) == ['h0', 'h2'], labels(t, q.anchored(t, V, '321')))
t = [R(0, 0, '1'), R(1, 300, '3'), R(1.5, 302, 'B'), R(2, 304, 'B'), R(30, 5, '2')]
k = labels(t, q.anchored(t, V, '321'))
ok('C2 an anchor-class row rejected in step 1 is never reconsidered, even when later rows agree with it', 'h1' not in k and k == ['h0', 'h30'], k)
t = [R(0, 0, '3'), R(1, 9, 'B'), R(2, -5, '0'), R(40, 0, '3')]
k = labels(t, q.anchored(t, V, '321'))
ok('C3 WEAKNESS among non-anchors the choice is chronological: an earlier class-B row, once kept, rejects a later class-0 row that agrees with both anchors', k == ['h0', 'h1', 'h40'] and q.speed(t[0], t[2])[0] <= V and q.speed(t[2], t[3])[0] <= V, k)
t = [R(0, 400, '2'), R(1, 0, '3'), R(2, 5, '3'), R(3, 9, '3'), R(3.5, 10, 'B'), R(40, 20, '3')]
k = labels(t, q.anchored(t, V, '321'))
ok("C4 WEAKNESS inherits A's first-anchor problem: a wrong first anchor rejects correct class-3 rows after it, and the B row near them too", k == ['h0', 'h40'], k)
t = [R(0, 400, 'B'), R(1, 0, '3'), R(2, 5, '3')]
ok('C5 a non-anchor row before the first anchor is tested against the next anchor only, and rejected if too far', labels(t, q.anchored(t, V, '321')) == ['h1', 'h2'])
t = [R(0, 0, '3'), R(1, 5, '3'), R(2, 400, 'B')]
ok('C6 a non-anchor row after the last anchor is tested against the previous kept row only', labels(t, q.anchored(t, V, '321')) == ['h0', 'h1'])
t = [R(0, 0, 'B'), R(1, 5, 'A'), R(2, 400, '0'), R(3, 12, 'B')]
ok('C7 with no anchor-class row C is exactly A', q.anchored(t, V, '321') == q.forward(t, V))
t = [R(0, 0, '3'), R(500, 4000, 'A'), R(1000, 0, '3')]
k = q.anchored(t, V, '321')
ok('C8 LIMIT a row 4,000 km away is kept when the gaps on both sides are long enough: consistent with its neighbours, not shown to be accurate', labels(t, k) == ['h0', 'h500', 'h1000'] and no_fast_step(t, k))
rnd = random.Random(20261119); worst = 0
for trial in range(300):
    n = rnd.randint(2, 60); tt = 0; rows = []
    for i in range(n):
        tt += rnd.choice([0.02, 0.2, 1, 3, 12, 80]) * rnd.random() + 0.001
        rows.append(R(round(tt, 4), rnd.choice([0, 0, 0, 5, 30, 800]) * rnd.uniform(-1, 1) + i, rnd.choice('321' + '0AB' * 3)))
    rows = [(int(r[0]) + i, *r[1:]) for i, r in enumerate(rows)]                                 # strictly increasing whole seconds
    for cls in ('32', '321'):
        k = q.anchored(rows, V, cls)
        if not no_fast_step(rows, k): worst += 1
        if k != sorted(set(k)): worst += 1
    if not no_fast_step(rows, q.forward(rows, V)): worst += 1
ok('C9 invariant on 300 random tracks: after C (and after A) no step between kept neighbours exceeds V, and the kept list is in order without repeats', worst == 0, worst)

# ---- temporal isolation
t = [R(0, 0, 'B'), R(1, 1, 'B'), R(100, 2, 'B'), R(200, 3, 'B'), R(201, 4, 'B'), R(400, 5, 'B')]
keep = list(range(len(t)))
ok('I1 isolated = every existing kept neighbour more than H hours away; a row at either end has one neighbour', [t[keep[a]][4] for a in q.isolated(t, keep, 72)] == ['h100', 'h400'], [t[keep[a]][4] for a in q.isolated(t, keep, 72)])
ok('I2 exactly H hours is not isolated (strictly more than)', q.isolated([R(0, 0, 'B'), R(72, 1, 'B')], [0, 1], 72) == [] and q.isolated([R(0, 0, 'B'), R(72.001, 1, 'B')], [0, 1], 72) == [0, 1])
ok('I3 a single row has no neighbour and is not called isolated', q.isolated([R(0, 0, 'B')], [0], 72) == [])
# ---- the drawn chord
pts = q.chord_points(-34.0, 18.0, -34.0, 28.0)
import math
ok('G1 chord points start and end on the fixes, are no more than 1 km apart, and bow towards the pole between equal latitudes (a great-circle arc, not a parallel)', abs(pts[0][0] - 18) < 1e-9 and abs(pts[-1][0] - 28) < 1e-9 and abs(pts[0][1] + 34) < 1e-9 and min(p[1] for p in pts) < -34.05 and max(q.Geodesic.WGS84.Inverse(a[1], a[0], b[1], b[0])['s12'] for a, b in zip(pts[:-1], pts[1:])) <= 1010, (pts[0], pts[-1], min(p[1] for p in pts)))
ok('G2 a zero-length step gives its one point twice', q.chord_points(1, 2, 1, 2) == [(2.0, 1.0), (2.0, 1.0)] or all(abs(a - b) < 1e-9 for p in q.chord_points(1, 2, 1, 2) for a, b in zip(p, (2.0, 1.0))))
print(('FAILED' if bad_n else 'PASSED') + f'  {ok_n} passed, {bad_n} failed'); sys.exit(1 if bad_n else 0)
