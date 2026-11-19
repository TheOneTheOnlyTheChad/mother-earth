"""Mother Earth — the rules applied to Argos journeys (animals-journeys-preview-rc, 19 Nov 2026).
The same code as docs/research/animals-source-audit/quality_rule_effects.py rev 2 on branch animals-proposal (functions speed,
forward, anchored, isolated), which GPT reviewed with docs/concepts/ANIMALS-QUALITY-RULE-*.md rev 2. Read those for the reasoning.

speed      WGS84 geodesic distance (GeographicLib) / whole seconds, m/s. Rows are (time s, lat, lon, Argos class, ...), in time order.
forward    "A": the first row is kept; each later row is rejected if the speed from the LAST KEPT row exceeds V.
anchored   "C", an EXPERIMENTAL Mother Earth heuristic. Step 1: A on the anchor-class rows alone (chronological; rows rejected here
           are final). Step 2: every other row, in time order, is kept if within V of the nearest earlier kept row and of the nearest
           later anchor (a missing side is not tested). After it no step between kept neighbours exceeds V. That is consistency
           between kept fixes, not accuracy; it can remove a correct fix; it does not always keep the better-rated fix of a pair.
isolated   kept rows whose every existing kept neighbour is MORE than H hours away (Mother Earth's temporal-isolation policy).
chord      the line the page draws between two fixes is a straight chord through the globe between their positions on a sphere.
           Seen from above, that chord lies over the spherical great-circle arc between the two (lat, lon) points. chord_points
           returns points on that arc no more than `step_km` apart (the chord sampled evenly and pushed back to the surface)."""
import bisect, math
from geographiclib.geodesic import Geodesic
def speed(a, b):
    dt = b[0] - a[0]; d = Geodesic.WGS84.Inverse(a[1], a[2], b[1], b[2])['s12']
    return (d / dt if dt > 0 else (float('inf') if d > 0 else 0.0)), dt, d
def forward(rows, V):
    keep = [0] if rows else []
    for i in range(1, len(rows)):
        if speed(rows[keep[-1]], rows[i])[0] <= V: keep.append(i)
    return keep
def anchored(rows, V, classes):
    anc = [i for i, r in enumerate(rows) if r[3] in classes]
    if not anc: return forward(rows, V)
    ka = [anc[j] for j in forward([rows[i] for i in anc], V)]; kept = set(ka); order = sorted(ka)
    for i, r in enumerate(rows):
        if r[3] in classes: continue                      # anchor-class rows were decided in step 1 and are never reconsidered
        j = bisect.bisect_left(order, i); prev = order[j - 1] if j else None
        k = bisect.bisect_right(ka, i); nxt = ka[k] if k < len(ka) else None
        if (prev is None or speed(rows[prev], r)[0] <= V) and (nxt is None or speed(r, rows[nxt])[0] <= V): kept.add(i); bisect.insort(order, i)
    return order
def isolated(rows, keep, hours):
    out = []
    for a in range(len(keep)):
        left = rows[keep[a]][0] - rows[keep[a - 1]][0] if a else None; right = rows[keep[a + 1]][0] - rows[keep[a]][0] if a + 1 < len(keep) else None
        sides = [x for x in (left, right) if x is not None]
        if sides and all(x > hours * 3600 for x in sides): out.append(a)
    return out
def _unit(lat, lon):
    p, l = math.radians(lat), math.radians(lon); return (math.cos(p) * math.cos(l), math.cos(p) * math.sin(l), math.sin(p))
def chord_points(lat1, lon1, lat2, lon2, step_km=1.0, radius_km=6371.0088):
    a, b = _unit(lat1, lon1), _unit(lat2, lon2); dot = max(-1.0, min(1.0, sum(x * y for x, y in zip(a, b))))
    n = max(1, math.ceil(math.acos(dot) * radius_km / step_km)); pts = []
    for i in range(n + 1):
        f = i / n; v = [x + (y - x) * f for x, y in zip(a, b)]; m = math.sqrt(sum(x * x for x in v)) or 1.0
        pts.append((math.degrees(math.atan2(v[1], v[0])), math.degrees(math.asin(max(-1.0, min(1.0, v[2] / m))))))     # (lon, lat)
    return pts
