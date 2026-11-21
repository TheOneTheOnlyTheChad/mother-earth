"""Mother Earth - exact planar geometry for the corridor builder (standard library only).

Decisions (do two boundaries meet? is a point inside a ring? which of two areas is larger?) are made in EXACT arithmetic:
whole numbers as they are, floating-point source numbers through fractions.Fraction (a float is an exact rational).
A floating-point filter is used only to skip the exact step when the answer is far from zero; it never decides a close case.
Nothing here repairs, moves or drops a point."""
from fractions import Fraction
import math

def _exact(v): return v if isinstance(v, int) else Fraction(v)

def orient(a, b, c):
    """sign of the cross product (b-a) x (c-a): +1 left turn, -1 right turn, 0 exactly collinear"""
    if isinstance(a[0], int) and isinstance(b[0], int) and isinstance(c[0], int) and isinstance(a[1], int) and isinstance(b[1], int) and isinstance(c[1], int):
        d = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); return (d > 0) - (d < 0)
    l = (b[0] - a[0]) * (c[1] - a[1]); r = (b[1] - a[1]) * (c[0] - a[0]); d = l - r
    if abs(d) > 1e-9 * (abs(l) + abs(r)) + 1e-300: return (d > 0) - (d < 0)          # far from zero: the float sign is right
    ax, ay, bx, by, cx, cy = map(_exact, (a[0], a[1], b[0], b[1], c[0], c[1]))
    d = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); return (d > 0) - (d < 0)

def _between(a, b, c):
    """c is collinear with a-b: is it on the closed segment?"""
    return min(a[0], b[0]) <= c[0] <= max(a[0], b[0]) and min(a[1], b[1]) <= c[1] <= max(a[1], b[1])

def contact(p1, p2, q1, q2):
    """How two segments meet: None, 'cross' (one point, inside both), 'touch' (one point, an end of at least one),
    'overlap' (they run along each other for a length). Exact."""
    if max(p1[0], p2[0]) < min(q1[0], q2[0]) or max(q1[0], q2[0]) < min(p1[0], p2[0]) or max(p1[1], p2[1]) < min(q1[1], q2[1]) or max(q1[1], q2[1]) < min(p1[1], p2[1]): return None
    o1, o2, o3, o4 = orient(p1, p2, q1), orient(p1, p2, q2), orient(q1, q2, p1), orient(q1, q2, p2)
    if o1 == 0 and o2 == 0 and o3 == 0 and o4 == 0:                                   # all on one line
        pts = sorted([p1, p2, q1, q2]); lo = max(min(p1, p2), min(q1, q2)); hi = min(max(p1, p2), max(q1, q2))
        if lo > hi: return None
        return 'overlap' if lo != hi else 'touch'
    if o1 * o2 < 0 and o3 * o4 < 0: return 'cross'
    if (o1 == 0 and _between(p1, p2, q1)) or (o2 == 0 and _between(p1, p2, q2)) or (o3 == 0 and _between(q1, q2, p1)) or (o4 == 0 and _between(q1, q2, p2)): return 'touch'
    return None

def segments(ring): return [(ring[i], ring[i + 1]) for i in range(len(ring) - 1)]

def grid_pairs(segs_a, segs_b, cell):
    """candidate pairs (i, j) of segments whose bounding boxes share a grid cell; segs_b None means pairs within segs_a (i < j)"""
    def cells(s):
        x0 = math.floor(min(s[0][0], s[1][0]) / cell); x1 = math.floor(max(s[0][0], s[1][0]) / cell)
        y0 = math.floor(min(s[0][1], s[1][1]) / cell); y1 = math.floor(max(s[0][1], s[1][1]) / cell)
        return [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]
    g = {}
    for i, s in enumerate(segs_a):
        for c in cells(s): g.setdefault(c, []).append(i)
    seen = set()
    if segs_b is None:
        for lst in g.values():
            for u in range(len(lst)):
                for v in range(u + 1, len(lst)):
                    k = (lst[u], lst[v])
                    if k not in seen: seen.add(k); yield k
    else:
        for j, s in enumerate(segs_b):
            for c in cells(s):
                for i in g.get(c, ()):
                    k = (i, j)
                    if k not in seen: seen.add(k); yield k

def in_ring(pt, ring):
    """+1 strictly inside, 0 on the boundary, -1 outside. Exact (crossing number with exact side tests)."""
    inside = False
    for a, b in segments(ring):
        if orient(a, b, pt) == 0 and _between(a, b, pt): return 0
        if (a[1] > pt[1]) != (b[1] > pt[1]):
            lo, hi = (a, b) if a[1] < b[1] else (b, a)
            if orient(lo, hi, pt) > 0: inside = not inside                           # pt is left of the upward edge
    return 1 if inside else -1

def area2(ring):
    """twice the signed area, exact (positive = anticlockwise)"""
    s = 0
    for a, b in segments(ring): s += _exact(a[0]) * _exact(b[1]) - _exact(b[0]) * _exact(a[1])
    return s
