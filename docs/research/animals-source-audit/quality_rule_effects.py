"""Mother Earth — research script (read-only), rev 2: what each CANDIDATE quality rule, and each COMPLETE proposed pipeline,
would do to the two pinned source files. Nothing here is a chosen rule. Counts only; no file is written except the summary.

Inputs (not in the repo; the script refuses any other bytes):
  fkw     atn_98364_false-killer-whale_trajectory_20131023-20140223.nc  sha256 9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6
  sharks  south_african_white_shark_ARGOS_tracks.csv                    sha256 156b1ee2d72b20244ad378020abd7da30e8c006fc58c7e72e6864f1f23a0029d
  land    Natural Earth 1:10m land polygons, ne_10m_land.geojson         sha256 1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416
          (github.com/nvkelso/natural-earth-vector, branch master at commit ca96624a56bd078437bca8184e78163e5039ad19, VERSION 5.2.0-pre)
Run:   python3 -I quality_rule_effects.py <fkw.nc> <sharks.csv> <ne_10m_land.geojson> [out.json]
Tests: python3 -I quality_rule_effects.test.py   (made-up tracks that pin down each algorithm's behaviour, including its weaknesses)

Common definitions
  distance  WGS84 geodesic (GeographicLib), metres.   time  whole seconds.   speed  distance / seconds, m/s.
  rows      one animal at a time, in time order (ties keep file order). A row is (time, lat, lon, Argos class, ...).
  Two rows at the same second: infinitely fast if in different places, zero if identical.

Candidate rejection algorithms (V = speed limit, m/s). All three are Mother Earth's own; none is a published filter.
  A  "forward"        Walk the rows in time order. The first row is kept. Each later row is compared with the LAST KEPT row: if
                      the speed from it exceeds V the row is rejected, otherwise it is kept and becomes the last kept row.
                      One pass. The first row is never tested. Weakness: a wrong kept row (including a wrong first row) makes
                      correct rows after it fail until enough time has passed (a cascade).
  B  "two fast legs"  A row qualifies when BOTH the step from its previous kept row and the step to its next kept row exceed V.
                      Repeat: find all qualifying rows among those currently kept; if none, stop; otherwise reject the ONE with
                      the largest smaller-of-its-two speeds (ties: the earliest) and recompute. The first and last rows have one
                      neighbour and are never rejected. B does NOT test whether the row's neighbours are close to each other, so
                      it also removes the middle row of sustained fast movement in one direction, not only an out-and-back jump.
                      Fast steps where only one leg is fast are left in and reported.
  C  "anchored"       An experimental Mother Earth heuristic. It gives the better Argos classes precedence over the others; it
                      does NOT guarantee that the better-rated row of any conflicting pair is the one kept.
                      Step 1: take the anchor-class rows alone, in time order, and apply A to them. Survivors are the anchors.
                              Within the anchor classes the choice is chronological, not by class: an earlier class-1 anchor can
                              reject a later class-3 row. Step 1 inherits A's weaknesses (wrong first anchor, cascade).
                              Anchor-class rows rejected here are final: step 2 never reconsiders them.
                      Step 2: walk the remaining (non-anchor) rows in time order. PREV is the nearest earlier kept row (an anchor
                              or a non-anchor row already kept in this step); NEXT is the nearest later ANCHOR. The row is kept if
                              speed(PREV, row) <= V and speed(row, NEXT) <= V. A side that does not exist is not tested.
                              Among non-anchors the choice is again chronological: an earlier class-B row, once kept, can cause a
                              later class-0 row to be rejected.
                      With no anchor-class row at all, C is A. One pass, no iteration.
                      Invariant (checked by the tests): after C no step between kept neighbours exceeds V. That is a statement
                      about consistency between kept rows. It says nothing about whether any kept position is accurate.
Temporal isolation (a Mother Earth policy, H hours)
  A kept row is "temporally isolated" when every kept neighbour it has (one at each end of the track, otherwise two) is more than
  H hours away. The speed test still limits how far such a row can be from its neighbours, but over a long gap that limit is very
  wide, so the test does little to support the position. Isolation is computed ONCE on the set it is applied to; rows that become
  isolated only because an isolated neighbour was removed are counted and reported, not removed.
Land (provisional; depends entirely on the land data named above)
  on land     the fix lies inside a Natural Earth 1:10m land polygon (shapely contains). Distance inland = geodesic distance to
              the nearest point of that polygon set's boundary.
  crossing    a step's line is the WGS84 geodesic between the two fixes, sampled at points no more than 1 km apart and tested as
              a polyline against the same polygons (shapely intersects). A step with an end on land always counts as crossing.
  This detects land in that dataset at that resolution. Small islands, reefs and coastline detail it lacks are not detected."""
import bisect, calendar, csv, hashlib, io, json, sys, importlib.metadata as md
from collections import Counter, defaultdict
import numpy as np
from geographiclib.geodesic import Geodesic
PIN = {'fkw': '9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6', 'sharks': '156b1ee2d72b20244ad378020abd7da30e8c006fc58c7e72e6864f1f23a0029d', 'land': '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416'}
CLASS_ORDER = ['3', '2', '1', '0', 'A', 'B', 'Z']
GAPS_H = [3, 6, 10, 12, 24, 72, 240]
def speed(a, b):
    dt = b[0] - a[0]; d = Geodesic.WGS84.Inverse(a[1], a[2], b[1], b[2])['s12']
    return (d / dt if dt > 0 else (float('inf') if d > 0 else 0.0)), dt, d
def forward(rows, V):
    keep = [0] if rows else []
    for i in range(1, len(rows)):
        if speed(rows[keep[-1]], rows[i])[0] <= V: keep.append(i)
    return keep
def two_fast_legs(rows, V):
    keep = list(range(len(rows))); passes = 0
    while True:
        best = None
        for k in range(1, len(keep) - 1):
            vin = speed(rows[keep[k - 1]], rows[keep[k]])[0]; vout = speed(rows[keep[k]], rows[keep[k + 1]])[0]
            if vin > V and vout > V and (best is None or min(vin, vout) > best[0]): best = (min(vin, vout), k)
        if best is None: return keep, passes
        del keep[best[1]]; passes += 1
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
    """indices (into keep) of kept rows whose every existing kept neighbour is more than `hours` away"""
    out = []
    for a in range(len(keep)):
        left = rows[keep[a]][0] - rows[keep[a - 1]][0] if a else None; right = rows[keep[a + 1]][0] - rows[keep[a]][0] if a + 1 < len(keep) else None
        sides = [x for x in (left, right) if x is not None]
        if sides and all(x > hours * 3600 for x in sides): out.append(a)
    return out
def longest_run_rejected(n, keep):
    ks = set(keep); run = best = 0
    for i in range(n):
        run = 0 if i in ks else run + 1; best = max(best, run)
    return best
def describe(rows, keep, V):
    k = [rows[i] for i in keep]; st = [speed(a, b) for a, b in zip(k[:-1], k[1:])]
    v = np.array([s[0] for s in st]) if st else np.array([]); g = np.array([s[1] for s in st]) if st else np.array([])
    fin = v[np.isfinite(v)]; span = k[-1][0] - k[0][0] if len(k) > 1 else 0
    out = {'rows_kept': len(k), 'rows_rejected': len(rows) - len(k), 'longest_run_of_rejected_rows': longest_run_rejected(len(rows), keep),
           'steps': len(st), 'steps_over_limit': int((v > V).sum()) if len(v) else 0, 'fastest_step_m_per_s': (round(float(fin.max()), 3) if len(fin) else None),
           'classes_kept': {c: n for c, n in sorted(Counter(r[3] for r in k).items(), key=lambda x: CLASS_ORDER.index(x[0]) if x[0] in CLASS_ORDER else 9)},
           'first_kept': k[0][4] if k else None, 'last_kept': k[-1][4] if k else None, 'span_days': round(span / 86400, 1),
           'extent': {'south': min(r[1] for r in k), 'north': max(r[1] for r in k), 'west': min(r[2] for r in k), 'east': max(r[2] for r in k)} if k else None,
           'gap_median_h': round(float(np.median(g)) / 3600, 2) if len(g) else None, 'gap_longest_h': round(float(g.max()) / 3600, 1) if len(g) else None, 'joins': {},
           'temporally_isolated_rows': {f'{h}h': len(isolated(rows, keep, h)) for h in (24, 72, 240)}}
    for h in GAPS_H:
        joined = g <= h * 3600 if len(g) else np.array([], bool)
        out['joins'][f'{h}h'] = {'steps_joined': int(joined.sum()), 'steps_not_joined': int((~joined).sum()), 'share_of_first_to_last_time_inside_joined_steps': round(float(g[joined].sum()) / span, 3) if span else None}
    return out
def run_rules(rows, V, anchor_sets=('32', '321')):
    a = forward(rows, V); b, passes = two_fast_legs(rows, V)
    res = {'limit_m_per_s': round(V, 4), 'no_rejection': describe(rows, list(range(len(rows))), V), 'A_forward': describe(rows, a, V), 'B_two_fast_legs': {**describe(rows, b, V), 'iterations': passes}}
    for cl in anchor_sets: res['C_anchored_' + '_'.join(cl)] = describe(rows, anchored(rows, V, cl), V)
    return res

# ---------- land
class Land:
    def __init__(self, path):
        import shapely, shapely.geometry as sg
        raw = open(path, 'rb').read(); sha = hashlib.sha256(raw).hexdigest()
        if sha != PIN['land']: sys.exit(f'STOPPED: land input sha256 {sha} is not the pinned file')
        self.sg = sg; self.shapely = shapely; self.geoms = [sg.shape(f['geometry']) for f in json.loads(raw)['features']]; self.clip = {}
    def near(self, rows, pad=3.0):
        key = (round(min(r[1] for r in rows) - pad, 3), round(max(r[1] for r in rows) + pad, 3), round(min(r[2] for r in rows) - pad, 3), round(max(r[2] for r in rows) + pad, 3))
        if key not in self.clip:
            box = self.sg.box(key[2], key[0], key[3], key[1]); parts = [g.intersection(box) for g in self.geoms if g.intersects(box)]
            u = self.shapely.unary_union(parts) if parts else self.sg.GeometryCollection(); self.clip[key] = (u, self.shapely.prepared.prep(u), box)
        return self.clip[key]
    def assess(self, rows, keep, join_hours):
        """fixes on land (by class, distance inland) and joined steps whose geodesic crosses land"""
        from shapely.ops import nearest_points
        k = [rows[i] for i in keep]
        if not k: return {}
        u, prep, box = self.near(k); on = []
        coast = u.boundary.difference(box.boundary.buffer(1e-9)) if not u.is_empty else None       # the clip box edge is not a coast
        for r in k:
            p = self.sg.Point(r[2], r[1]); inside = (not u.is_empty) and prep.contains(p); km = None
            if inside and coast is not None and not coast.is_empty: q = nearest_points(coast, p)[0]; km = Geodesic.WGS84.Inverse(r[1], r[2], q.y, q.x)['s12'] / 1000
            on.append((inside, km))
        land_rows = [(r, km) for r, (ins, km) in zip(k, on) if ins]
        steps = joined = cross_sea_ends = cross_land_end = 0
        for (a, la), (b, lb) in zip(zip(k[:-1], on[:-1]), zip(k[1:], on[1:])):
            steps += 1
            if b[0] - a[0] > join_hours * 3600: continue
            joined += 1
            if la[0] or lb[0]: cross_land_end += 1; continue
            if u.is_empty: continue
            line = Geodesic.WGS84.InverseLine(a[1], a[2], b[1], b[2]); n = max(1, int(np.ceil(line.s13 / 1000)))
            pts = [(line.Position(line.s13 * i / n)['lon2'], line.Position(line.s13 * i / n)['lat2']) for i in range(n + 1)]
            if line.s13 > 0 and prep.intersects(self.sg.LineString(pts)): cross_sea_ends += 1
        kms = sorted(km for _, km in land_rows if km is not None)
        return {'fixes': len(k), 'fixes_on_land': len(land_rows), 'fixes_on_land_by_class': {c: n for c, n in sorted(Counter(r[3] for r, _ in land_rows).items(), key=lambda x: CLASS_ORDER.index(x[0]))},
                'distance_inland_km': {'median': round(kms[len(kms) // 2], 1), 'max': round(kms[-1], 1), 'over_1_km': sum(x > 1 for x in kms), 'over_5_km': sum(x > 5 for x in kms), 'over_20_km': sum(x > 20 for x in kms)} if kms else None,
                'join_limit_h': join_hours, 'steps': steps, 'steps_within_join_limit': joined, 'joined_steps_with_an_end_on_land': cross_land_end, 'joined_steps_crossing_land_with_both_ends_at_sea': cross_sea_ends,
                'joined_steps_clear_of_land': joined - cross_land_end - cross_sea_ends, 'on_land_flags': [bool(x[0]) for x in on]}

def pipeline(rows, stages, V, join_h, iso_h, land=None, anchors='321'):
    """C -> temporal-isolation exclusion (once) -> recount everything; land figures are provisional and reported separately"""
    c = anchored(rows, V, anchors); iso = isolated(rows, c, iso_h); final = [i for a, i in enumerate(c) if a not in set(iso)]
    d = describe(rows, final, V); out = {'stages': stages + [{'stage': f'C anchored on classes {" ".join(anchors)} at {round(V, 4)} m/s', 'rows_in': len(rows), 'rows_removed': len(rows) - len(c), 'rows_out': len(c), 'longest_run_removed': longest_run_rejected(len(rows), c)},
            {'stage': f'temporally isolated under the {iso_h}-hour policy (computed once)', 'rows_in': len(c), 'rows_removed': len(iso), 'rows_out': len(final)}],
           'after_all_non_land_stages': {**d, 'join_limit_h': join_h, 'steps_joined': d['joins'][f'{join_h}h']['steps_joined'], 'steps_not_joined': d['joins'][f'{join_h}h']['steps_not_joined'],
                                         'share_of_first_to_last_time_inside_joined_steps': d['joins'][f'{join_h}h']['share_of_first_to_last_time_inside_joined_steps'],
                                         'rows_newly_isolated_after_the_exclusion_not_removed': len(isolated(rows, final, iso_h))}}
    if land:
        la = land.assess(rows, final, join_h); flags = la.pop('on_land_flags'); out['land_PROVISIONAL'] = la
        sea = [i for i, f in zip(final, flags) if not f]; d2 = describe(rows, sea, V)
        la2 = land.assess(rows, sea, join_h); la2.pop('on_land_flags')
        out['land_PROVISIONAL']['if_fixes_on_land_were_not_drawn'] = {'fixes': len(sea), 'steps': d2['steps'], 'steps_within_join_limit': la2['steps_within_join_limit'], 'joined_steps_crossing_land': la2['joined_steps_crossing_land_with_both_ends_at_sea'],
            'steps_joined_after_refusing_crossings': la2['joined_steps_clear_of_land'], 'first': d2['first_kept'], 'last': d2['last_kept'], 'extent': d2['extent'], 'classes': d2['classes_kept'], 'steps_over_limit': d2['steps_over_limit'],
            'temporally_isolated_rows_after_this_removal_not_removed': len(isolated(rows, sea, iso_h))}
    return out

def main(argv):
    import netCDF4
    def pinned(path, key):
        raw = open(path, 'rb').read(); sha = hashlib.sha256(raw).hexdigest()
        if sha != PIN[key]: sys.exit(f'STOPPED: {key} input sha256 {sha} is not the pinned file')
        return raw
    land = Land(argv[3])
    out = {'script_rev': 2, 'versions': {p: md.version(p) for p in ('geographiclib', 'numpy', 'netCDF4', 'shapely')}, 'python': sys.version.split()[0], 'candidate_join_limits_hours': GAPS_H,
           'land_data': {'file': 'ne_10m_land.geojson', 'sha256': PIN['land'], 'source': 'github.com/nvkelso/natural-earth-vector master @ ca96624a56bd078437bca8184e78163e5039ad19 (VERSION 5.2.0-pre)', 'scale': '1:10m'}}
    # ----- false killer whale 98364
    pinned(argv[1], 'fkw'); ds = netCDF4.Dataset(argv[1]); ds.set_auto_mask(False)
    tv = ds.variables['time']; t = tv[:]; lat = ds.variables['lat'][:]; lon = ds.variables['lon'][:]
    dates = netCDF4.num2date(t, tv.units, only_use_cftime_datetimes=False, only_use_python_datetimes=True)
    def s(v): return [(''.join(c.decode() if isinstance(c, bytes) else str(c) for c in r).strip() if hasattr(r, '__iter__') and not isinstance(r, str) else str(r).strip()) for r in ds.variables[v][:]]
    typ = s('type'); lc = s('location_class'); roll = ds.variables['qartod_rollup_flag'][:].astype(int)
    allrows = [(int(calendar.timegm(dates[i].timetuple())), float(lat[i]), float(lon[i]), lc[i] or '-', dates[i].strftime('%Y-%m-%dT%H:%M:%SZ'), typ[i], int(roll[i])) for i in range(len(t))]
    argos = [r for r in allrows if r[5] == 'Argos']; passed = [r for r in argos if r[6] == 1]; base = [r for r in passed if r[3] != 'Z']
    st = [{'stage': 'all rows in the file', 'rows_out': len(allrows)}, {'stage': 'tagging row (type User) left out', 'rows_in': len(allrows), 'rows_removed': len(allrows) - len(argos), 'rows_out': len(argos)},
          {'stage': "rows not passing the source's time, location and speed checks (roll-up not PASS)", 'rows_in': len(argos), 'rows_removed': len(argos) - len(passed), 'rows_out': len(passed)},
          {'stage': 'Argos class Z (invalid fix)', 'rows_in': len(passed), 'rows_removed': len(passed) - len(base), 'rows_out': len(base)}]
    FK = {'cascadia_20_km_per_h': 20 / 3.6, 'source_fail_10_m_per_s': 10.0, 'source_suspect_8_m_per_s': 8.0}
    out['fkw_98364'] = {'input_sha256': PIN['fkw'], 'base_set_rows_PASS_non_Z': len(base),
        'candidates_on_base_set': {k: run_rules(base, V) for k, V in FK.items()},
        'pipelines': {f'{k}__anchors_{a}__join_{j}h__isolation_72h': pipeline(base, st, V, j, 72, land, a) for k, V in FK.items() if k != 'source_suspect_8_m_per_s' for a in ('32',) for j in (3, 6, 10)},
        'pipeline_without_isolation_exclusion__20kmh_anchors_32': describe(base, anchored(base, 20 / 3.6, '32'), 20 / 3.6)}
    # ----- white sharks
    raw = pinned(argv[2], 'sharks'); by = defaultdict(list)
    for r in csv.DictReader(io.StringIO(raw.decode('utf-8'))):
        d = r['date']; ts = calendar.timegm((int(d[0:4]), int(d[5:7]), int(d[8:10]), int(d[11:13]), int(d[14:16]), int(d[17:19]), 0, 0, 0))
        by[r['SPOT']].append((ts, float(r['latitude']), float(r['longitude']), r['quality'], d.replace(' ', 'T') + 'Z', r['type']))
    per = {}; tot = defaultdict(lambda: defaultdict(int)); pt = defaultdict(int); far = []
    for tag, rows in sorted(by.items()):
        rows.sort(key=lambda x: x[0]); res = run_rules(rows, 3.0, ('321',)); per[tag] = {'rows': len(rows), **res}
        for alg in ('no_rejection', 'A_forward', 'B_two_fast_legs', 'C_anchored_3_2_1'):
            for k in ('rows_kept', 'rows_rejected', 'steps', 'steps_over_limit'): tot[alg][k] += res[alg][k]
            tot[alg]['temporally_isolated_72h'] += res[alg]['temporally_isolated_rows']['72h']
            tot[alg]['max_longest_run_of_rejected_rows'] = max(tot[alg]['max_longest_run_of_rejected_rows'], res[alg]['longest_run_of_rejected_rows']); tot[alg]['sharks_under_25_rows'] += res[alg]['rows_kept'] < 25
        p = pipeline(rows, [{'stage': 'all rows for this tag', 'rows_out': len(rows)}], 3.0, 12, 72); per[tag]['pipeline_C_then_isolation_72h_join_12h'] = p; f = p['after_all_non_land_stages']
        for k in ('rows_kept', 'steps', 'steps_joined', 'steps_not_joined', 'rows_newly_isolated_after_the_exclusion_not_removed'): pt[k] += f[k]
        pt['removed_by_C'] += p['stages'][1]['rows_removed']; pt['removed_as_isolated'] += p['stages'][2]['rows_removed']; pt['sharks_under_25_rows'] += f['rows_kept'] < 25
        e = f['extent']; pt['west'] = min(pt.get('west', 999), e['west']); pt['east'] = max(pt.get('east', -999), e['east']); far.append((tag, e['west'], e['east'], f['rows_kept']))
    out['white_sharks'] = {'input_sha256': PIN['sharks'], 'sharks': len(per), 'rows': sum(len(v) for v in by.values()), 'limit_m_per_s': 3.0,
        'candidates_totals_all_sharks': {k: dict(v) for k, v in tot.items()}, 'pipeline_totals_all_sharks_no_land_stage': dict(pt),
        'pipeline_sharks_with_500_or_more_fixes_inside_10E_to_45E': sorted(t for t, w, e, n in far if w >= 10 and e <= 45 and n >= 500),
        'tag_118845': {jn: pipeline(sorted(by['118845'], key=lambda x: x[0]), [{'stage': 'all rows for tag 118845', 'rows_out': len(by['118845'])}], 3.0, j, 72, land) for jn, j in (('join_6h', 6), ('join_12h', 12), ('join_24h', 24))},
        'per_shark_by_tag_number': per}
    txt = json.dumps(out, indent=1)
    if len(argv) > 4: open(argv[4], 'w').write(txt + '\n')
    return out
if __name__ == '__main__':
    o = main(sys.argv); f = o['fkw_98364']; print('FKW base', f['base_set_rows_PASS_non_Z'])
    for k, r in f['candidates_on_base_set'].items():
        for alg, x in r.items():
            if isinstance(x, dict): print(f"  {k:26s} {alg:22s} kept {x['rows_kept']} rej {x['rows_rejected']} run {x['longest_run_of_rejected_rows']} over {x['steps_over_limit']} fastest {x['fastest_step_m_per_s']} iso72 {x['temporally_isolated_rows']['72h']} {x['classes_kept']}")
    for k, p in f['pipelines'].items(): print(' PIPE', k, json.dumps(p['stages'][3:]), json.dumps({a: b for a, b in p['after_all_non_land_stages'].items() if a not in ('joins',)}), json.dumps(p['land_PROVISIONAL']))
    w = o['white_sharks']; print('SHARKS', w['candidates_totals_all_sharks']); print(' pipe totals', w['pipeline_totals_all_sharks_no_land_stage'], w['pipeline_sharks_with_500_or_more_fixes_inside_10E_to_45E'])
    for k, p in w['tag_118845'].items(): print(' 118845', k, json.dumps(p['stages']), json.dumps({a: b for a, b in p['after_all_non_land_stages'].items() if a not in ('joins',)}), json.dumps(p['land_PROVISIONAL']))
