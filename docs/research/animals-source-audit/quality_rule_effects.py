"""Mother Earth — research script (read-only): what each CANDIDATE quality rule would do to the two pinned source files.
Nothing here is a chosen rule. It exists so the quality-rule proposals can state effects as counted numbers, not estimates.

Inputs (not in the repo; the script refuses any other bytes):
  fkw    atn_98364_false-killer-whale_trajectory_20131023-20140223.nc  sha256 9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6
  sharks south_african_white_shark_ARGOS_tracks.csv                    sha256 156b1ee2d72b20244ad378020abd7da30e8c006fc58c7e72e6864f1f23a0029d
Run:  python3 -I quality_rule_effects.py <fkw.nc> <sharks.csv> [out.json]

Common definitions
  distance   WGS84 geodesic (GeographicLib), metres.   time   whole seconds.   speed   distance / seconds, m/s.
  rows       one animal at a time, in time order (ties keep file order).
  A step between two rows at the same second is treated as infinitely fast if they are in different places, and as zero if identical.

Candidate rejection algorithms (each fully specified; V is the speed limit in m/s)
  A  "forward"   Walk the rows in time order. The first row is kept. Each later row is compared with the LAST KEPT row:
                 if the speed from it exceeds V the row is rejected, otherwise it is kept and becomes the last kept row.
                 One pass, no iteration. The first row is never tested (nothing precedes it); the last row is tested like any other.
                 Known weakness: if a kept row is itself wrong, correct rows after it are rejected until time dilutes the speed.
  B  "spike"     A row is a spike when BOTH the step from its previous kept row and the step to its next kept row exceed V
                 (a jump out and back). Repeat: find all spikes among the currently kept rows; if there are none, stop;
                 otherwise reject the ONE spike with the largest smaller-of-its-two speeds (ties: the earliest) and recompute.
                 The first and last rows have one neighbour and are never rejected by B. Fast steps that are not part of a
                 spike are LEFT IN and reported: B does not guess which row of a lone fast pair is wrong.
  C  "anchored"  Rows of the better Argos classes (the anchor classes, stated per run) are considered first; other rows are kept
                 only if they agree with what is already kept on both sides.
                 Step 1: take the anchor-class rows alone, in time order, and apply A to them. The survivors are the anchors.
                 Step 2: walk the remaining rows in time order. For each, PREV is the nearest earlier kept row (an anchor or a
                 row already kept in this step) and NEXT is the nearest later ANCHOR. The row is kept if the speed from PREV
                 does not exceed V and the speed to NEXT does not exceed V. A side that does not exist (before the first
                 anchor, after the last) is not tested. With no anchor at all, C is A.
                 One pass, no iteration. After C no step between kept neighbours exceeds V.
                 Known weakness, shared with A and B: a speed test has no power across a long silence. A wrong row that
                 follows or precedes a gap of many days passes. The "cannot be checked" counts report this.
  The step counts reported after each algorithm are between kept neighbours, with the same V.
Gap figures are between kept neighbours, for a list of candidate join limits; none is chosen here."""
import csv, hashlib, io, json, sys, calendar, importlib.metadata as md
from collections import Counter, defaultdict
import numpy as np, netCDF4
from geographiclib.geodesic import Geodesic
PIN = {'fkw': '9896550eeeff21ff6fed461d0d13d0f6f2b759e5cca726e58d7308b254c4d3f6', 'sharks': '156b1ee2d72b20244ad378020abd7da30e8c006fc58c7e72e6864f1f23a0029d'}
CLASS_ORDER = ['3', '2', '1', '0', 'A', 'B', 'Z']
def pinned(path, key):
    raw = open(path, 'rb').read(); sha = hashlib.sha256(raw).hexdigest()
    if sha != PIN[key]: sys.exit(f'STOPPED: {key} input sha256 {sha} is not the pinned file')
    return raw
def speed(a, b):
    """a, b = (t, lat, lon, ...) -> (m/s, seconds, metres)"""
    dt = b[0] - a[0]; d = Geodesic.WGS84.Inverse(a[1], a[2], b[1], b[2])['s12']
    return (d / dt if dt > 0 else (float('inf') if d > 0 else 0.0)), dt, d
def forward(rows, V):
    keep = [0]
    for i in range(1, len(rows)):
        if speed(rows[keep[-1]], rows[i])[0] <= V: keep.append(i)
    return keep
def spike(rows, V):
    keep = list(range(len(rows))); passes = 0
    while True:
        best = None
        for k in range(1, len(keep) - 1):
            vin = speed(rows[keep[k - 1]], rows[keep[k]])[0]; vout = speed(rows[keep[k]], rows[keep[k + 1]])[0]
            if vin > V and vout > V:
                m = min(vin, vout)
                if best is None or m > best[0]: best = (m, k)
        if best is None: return keep, passes
        del keep[best[1]]; passes += 1
def anchored(rows, V, classes):
    anc = [i for i, r in enumerate(rows) if r[3] in classes]
    if not anc: return forward(rows, V)
    ka = [anc[j] for j in forward([rows[i] for i in anc], V)]; kept = set(ka); order = sorted(ka)
    import bisect
    for i, r in enumerate(rows):
        if i in kept or r[3] in classes: continue
        j = bisect.bisect_left(order, i); prev = order[j - 1] if j else None
        k = bisect.bisect_right(ka, i); nxt = ka[k] if k < len(ka) else None
        if (prev is None or speed(rows[prev], r)[0] <= V) and (nxt is None or speed(r, rows[nxt])[0] <= V): kept.add(i); bisect.insort(order, i)
    return order
def uncheckable(rows, keep, hours):
    """kept rows whose kept neighbours on BOTH existing sides are more than `hours` away: a speed test says nothing about them"""
    n = 0
    for a in range(len(keep)):
        left = rows[keep[a]][0] - rows[keep[a - 1]][0] if a else None; right = rows[keep[a + 1]][0] - rows[keep[a]][0] if a + 1 < len(keep) else None
        if all(x is None or x > hours * 3600 for x in (left, right)): n += 1
    return n
def longest_run_rejected(n, keep):
    ks = set(keep); run = best = 0
    for i in range(n):
        run = 0 if i in ks else run + 1; best = max(best, run)
    return best
GAPS_H = [3, 6, 10, 12, 24, 72, 240]
def describe(rows, keep, V):
    """effects of a kept set: steps over V, gaps, classes, extent"""
    k = [rows[i] for i in keep]; st = [speed(a, b) for a, b in zip(k[:-1], k[1:])]
    v = np.array([s[0] for s in st]) if st else np.array([]); g = np.array([s[1] for s in st]) if st else np.array([])
    fin = v[np.isfinite(v)]
    span = k[-1][0] - k[0][0] if len(k) > 1 else 0
    out = {'rows_kept': len(k), 'rows_rejected': len(rows) - len(k), 'longest_run_of_rejected_rows': longest_run_rejected(len(rows), keep),
           'steps': len(st), 'steps_over_limit': int((v > V).sum()) if len(v) else 0, 'fastest_step_m_per_s': (round(float(fin.max()), 3) if len(fin) else None), 'steps_infinite': int(np.isinf(v).sum()) if len(v) else 0,
           'classes_kept': {c: n for c, n in sorted(Counter(r[3] for r in k).items(), key=lambda x: CLASS_ORDER.index(x[0]) if x[0] in CLASS_ORDER else 9)},
           'first_kept': k[0][4] if k else None, 'last_kept': k[-1][4] if k else None, 'span_days': round(span / 86400, 1),
           'extent': {'south': min(r[1] for r in k), 'north': max(r[1] for r in k), 'west': min(r[2] for r in k), 'east': max(r[2] for r in k)} if k else None,
           'gap_median_h': round(float(np.median(g)) / 3600, 2) if len(g) else None, 'gap_longest_h': round(float(g.max()) / 3600, 1) if len(g) else None, 'joins': {}}
    for h in GAPS_H:
        joined = g <= h * 3600 if len(g) else np.array([], bool)
        out['joins'][f'{h}h'] = {'steps_joined': int(joined.sum()), 'steps_not_joined': int((~joined).sum()), 'share_of_track_time_inside_joined_steps': round(float(g[joined].sum()) / span, 3) if span else None}
    return out
def run_rules(rows, limits):
    res = {}
    for name, V in limits.items():
        a = forward(rows, V); b, passes = spike(rows, V)
        res[name] = {'limit_m_per_s': round(V, 4), 'no_rejection': describe(rows, list(range(len(rows))), V), 'A_forward': describe(rows, a, V), 'B_spike': {**describe(rows, b, V), 'iterations': passes},
                     'rows_rejected_by_A_only': len(set(b) - set(a)), 'rows_rejected_by_B_only': len(set(a) - set(b)), 'rows_rejected_by_both': len(rows) - len(set(a) | set(b))}
    return res
out = {'versions': {p: md.version(p) for p in ('geographiclib', 'numpy', 'netCDF4')}, 'python': sys.version.split()[0], 'candidate_join_limits_hours': GAPS_H}

# ---------- false killer whale 98364
raw = pinned(sys.argv[1], 'fkw'); ds = netCDF4.Dataset(sys.argv[1]); ds.set_auto_mask(False)
tv = ds.variables['time']; t = tv[:]; lat = ds.variables['lat'][:]; lon = ds.variables['lon'][:]
dates = netCDF4.num2date(t, tv.units, only_use_cftime_datetimes=False, only_use_python_datetimes=True)
def s(v):
    x = ds.variables[v][:]
    return [(''.join(c.decode() if isinstance(c, bytes) else str(c) for c in r).strip() if hasattr(r, '__iter__') and not isinstance(r, str) else str(r).strip()) for r in x]
typ = s('type'); lc = s('location_class'); roll = ds.variables['qartod_rollup_flag'][:].astype(int)
allrows = [(int(calendar.timegm(dates[i].timetuple())), float(lat[i]), float(lon[i]), lc[i] or '-', dates[i].strftime('%Y-%m-%dT%H:%M:%SZ'), typ[i], int(roll[i])) for i in range(len(t))]
argos = [r for r in allrows if r[5] == 'Argos']; passed = [r for r in argos if r[6] == 1]
FK = {'source_fail_10_m_per_s': 10.0, 'source_suspect_8_m_per_s': 8.0, 'cascadia_20_km_per_h': 20 / 3.6}
out['fkw_98364'] = {'input_sha256': PIN['fkw'], 'rows': len(allrows), 'argos_rows': len(argos), 'user_rows': len(allrows) - len(argos), 'rollup_pass_argos_rows': len(passed),
    'on_rollup_pass_rows': run_rules(passed, FK), 'on_all_argos_rows': run_rules(argos, FK)}
# class-restricted views of the PASS rows (no further rejection), for the "show class" question
out['fkw_98364']['rollup_pass_by_class_subset'] = {name: describe(sub, list(range(len(sub))), 10.0) for name, sub in (('classes_3_2_1', [r for r in passed if r[3] in '321']), ('classes_3_2_1_0', [r for r in passed if r[3] in '3210']))}

# ---------- white sharks
raw = pinned(sys.argv[2], 'sharks'); rd = csv.DictReader(io.StringIO(raw.decode('utf-8')))
by = defaultdict(list)
for r in rd:
    d = r['date']; ts = calendar.timegm((int(d[0:4]), int(d[5:7]), int(d[8:10]), int(d[11:13]), int(d[14:16]), int(d[17:19]), 0, 0, 0))
    by[r['SPOT']].append((ts, float(r['latitude']), float(r['longitude']), r['quality'], d.replace(' ', 'T') + 'Z', r['type']))
SH = {'authors_3_m_per_s': 3.0}
per = {}; tot = defaultdict(lambda: defaultdict(int))
for tag, rows in sorted(by.items()):
    rows.sort(key=lambda x: x[0]); res = run_rules(rows, SH)['authors_3_m_per_s']; per[tag] = {'rows': len(rows), **res}
    for alg in ('no_rejection', 'A_forward', 'B_spike'):
        for k in ('rows_kept', 'rows_rejected', 'steps', 'steps_over_limit'): tot[alg][k] += res[alg][k]
        for h in ('24h', '72h', '240h'): tot[alg]['not_joined_' + h] += res[alg]['joins'][h]['steps_not_joined']
        tot[alg]['max_longest_run_of_rejected_rows'] = max(tot[alg]['max_longest_run_of_rejected_rows'], res[alg]['longest_run_of_rejected_rows'])
def ext(alg):
    e = [per[tg][alg]['extent'] for tg in per]; return {'south': min(x['south'] for x in e), 'north': max(x['north'] for x in e), 'west': min(x['west'] for x in e), 'east': max(x['east'] for x in e)}
out['white_sharks'] = {'input_sha256': PIN['sharks'], 'sharks': len(per), 'rows': sum(len(v) for v in by.values()), 'limit_m_per_s': 3.0,
    'totals': {alg: {**dict(v), 'extent_all_sharks': ext(alg), 'sharks_with_fewer_than_25_rows_kept': sum(1 for tg in per if per[tg][alg]['rows_kept'] < 25), 'sharks_with_steps_over_limit_remaining': sum(1 for tg in per if per[tg][alg]['steps_over_limit'] > 0)} for alg, v in tot.items()},
    'per_shark_by_tag_number': per}
# algorithm C
def c_block(rows, V, classes):
    keep = anchored(rows, V, classes); d = describe(rows, keep, V)
    d['anchor_classes'] = classes; d['rows_that_cannot_be_checked'] = {f'{h}h': uncheckable(rows, keep, h) for h in (24, 72, 240)}
    d['first_kept_row_km_from_median_of_next_10'] = round(Geodesic.WGS84.Inverse(rows[keep[0]][1], rows[keep[0]][2], float(np.median([rows[i][1] for i in keep[1:11]])), float(np.median([rows[i][2] for i in keep[1:11]])))['s12'] / 1000) if len(keep) > 3 else None
    return d, keep
out['fkw_98364']['C_anchored_on_rollup_pass_rows'] = {f'{lim}__anchors_{cl}': c_block(passed, V, cl)[0] for lim, V in FK.items() for cl in ('32', '321')}
cs = {}; ct = defaultdict(int); far_c = []; firsts = []
for tag, rows in sorted(by.items()):
    rows = sorted(rows, key=lambda x: x[0]); d, keep = c_block(rows, 3.0, '321'); cs[tag] = d
    for k in ('rows_kept', 'rows_rejected', 'steps', 'steps_over_limit'): ct[k] += d[k]
    for h in ('24h', '72h', '240h'): ct['not_joined_' + h] += d['joins'][h]['steps_not_joined']; ct['cannot_be_checked_' + h] += d['rows_that_cannot_be_checked'][h]
    ct['max_longest_run_of_rejected_rows'] = max(ct['max_longest_run_of_rejected_rows'], d['longest_run_of_rejected_rows']); ct['sharks_with_fewer_than_25_rows_kept'] += d['rows_kept'] < 25
    ct['sharks_with_no_anchor_class_row'] += not any(r[3] in '321' for r in rows)
    far_c += [(tag, rows[i]) for i in keep if rows[i][2] < 10 or rows[i][2] > 60]; firsts.append((tag, d['first_kept_row_km_from_median_of_next_10'], rows[keep[0]][4], rows[keep[0]][3]))
out['white_sharks']['C_anchored_3_m_per_s_anchors_3_2_1'] = {'totals': dict(ct), 'kept_outside_10E_to_60E': {'rows': len(far_c), 'sharks': len(set(t for t, _ in far_c)), 'by_class': dict(Counter(r[3] for _, r in far_c)), 'west': min([r[2] for _, r in far_c], default=None), 'east': max([r[2] for _, r in far_c], default=None)},
    'first_kept_row_more_than_500_km_from_the_next_ten': [{'tag': t, 'km': k, 'time': tm, 'class': c} for t, k, tm, c in firsts if k and k > 500], 'per_shark_by_tag_number': cs}
# the same rules on class subsets, and where the far-flung kept rows sit (a speed rule cannot test a row that follows a long gap)
def totals_for(classes):
    t = defaultdict(lambda: defaultdict(int)); west = []; east = []
    for tag, rows in sorted(by.items()):
        sub = [r for r in sorted(rows, key=lambda x: x[0]) if r[3] in classes]
        if len(sub) < 2: t['sharks_with_fewer_than_2_rows']['n'] += 1; continue
        res = run_rules(sub, SH)['authors_3_m_per_s']
        for alg in ('no_rejection', 'A_forward', 'B_spike'):
            for k in ('rows_kept', 'rows_rejected', 'steps', 'steps_over_limit'): t[alg][k] += res[alg][k]
            for h in ('24h', '72h', '240h'): t[alg]['not_joined_' + h] += res[alg]['joins'][h]['steps_not_joined']
            t[alg]['max_longest_run_of_rejected_rows'] = max(t[alg]['max_longest_run_of_rejected_rows'], res[alg]['longest_run_of_rejected_rows'])
            t[alg]['sharks_with_fewer_than_25_rows_kept'] += res[alg]['rows_kept'] < 25
            e = res[alg]['extent']; t[alg]['west'] = min(t[alg].get('west', 999), e['west']); t[alg]['east'] = max(t[alg].get('east', -999), e['east'])
    return {k: dict(v) for k, v in t.items()}
out['white_sharks']['class_subsets'] = {'classes_3_2_1': totals_for('321'), 'classes_3_2_1_0_A': totals_for('3210A')}
far = []
for tag, rows in sorted(by.items()):
    rows = sorted(rows, key=lambda x: x[0]); keep = forward(rows, 3.0)
    for n, i in enumerate(keep):
        r = rows[i]
        if r[2] < 10 or r[2] > 60:
            pv = rows[keep[n - 1]] if n else None; nx = rows[keep[n + 1]] if n + 1 < len(keep) else None
            far.append({'tag': tag, 'time': r[4], 'lat': r[1], 'lon': r[2], 'class': r[3], 'hours_since_previous_kept': round((r[0] - pv[0]) / 3600, 1) if pv else None, 'km_from_previous_kept': round(speed(pv, r)[2] / 1000) if pv else None,
                        'hours_to_next_kept': round((nx[0] - r[0]) / 3600, 1) if nx else None, 'km_to_next_kept': round(speed(r, nx)[2] / 1000) if nx else None})
out['white_sharks']['kept_by_A_outside_10E_to_60E'] = {'rows': len(far), 'by_class': dict(Counter(f['class'] for f in far)), 'sharks': len(set(f['tag'] for f in far)), 'first_row_of_its_track': sum(1 for f in far if f['hours_since_previous_kept'] is None), 'examples_most_westerly_and_easterly': sorted(far, key=lambda f: f['lon'])[:4] + sorted(far, key=lambda f: -f['lon'])[:4]}
txt = json.dumps(out, indent=1)
if len(sys.argv) > 3: open(sys.argv[3], 'w').write(txt + '\n')
f = out['fkw_98364']; print('FKW rows', f['rows'], 'argos', f['argos_rows'], 'pass', f['rollup_pass_argos_rows'])
for base in ('on_rollup_pass_rows', 'on_all_argos_rows'):
    for lim, r in f[base].items():
        for alg in ('no_rejection', 'A_forward', 'B_spike'):
            x = r[alg]; print(f"  {base:20s} {lim:26s} {alg:13s} kept {x['rows_kept']:4d} rej {x['rows_rejected']:4d} run {x['longest_run_of_rejected_rows']:3d} over {x['steps_over_limit']:4d} fastest {x['fastest_step_m_per_s']} gaps>10h {x['joins']['10h']['steps_not_joined']} >24h {x['joins']['24h']['steps_not_joined']} >72h {x['joins']['72h']['steps_not_joined']} cover24h {x['joins']['24h']['share_of_track_time_inside_joined_steps']} classes {x['classes_kept']}")
for k, v in f['rollup_pass_by_class_subset'].items(): print('  PASS', k, v['rows_kept'], 'over10', v['steps_over_limit'], 'gaps>24h', v['joins']['24h']['steps_not_joined'], 'longest', v['gap_longest_h'])
w = out['white_sharks']; print('SHARKS', w['sharks'], w['rows'])
for alg, v in w['totals'].items(): print('  ', alg, v)
for tg in ('118852', '118845'):
    for alg in ('no_rejection', 'A_forward', 'B_spike'):
        x = per[tg][alg]; print(f"  tag {tg} {alg:13s} kept {x['rows_kept']} rej {x['rows_rejected']} run {x['longest_run_of_rejected_rows']} over {x['steps_over_limit']} fastest {x['fastest_step_m_per_s']} >24h {x['joins']['24h']['steps_not_joined']} >72h {x['joins']['72h']['steps_not_joined']} >240h {x['joins']['240h']['steps_not_joined']} cover72h {x['joins']['72h']['share_of_track_time_inside_joined_steps']} classes {x['classes_kept']} extent {x['extent']}")
for k, v in out['white_sharks']['class_subsets'].items():
    for alg, x in v.items(): print('  subset', k, alg, x)
print('  far', json.dumps(out['white_sharks']['kept_by_A_outside_10E_to_60E'])[:1800])
for k, v in out['fkw_98364']['C_anchored_on_rollup_pass_rows'].items(): print('  FKW C', k, 'kept', v['rows_kept'], 'rej', v['rows_rejected'], 'run', v['longest_run_of_rejected_rows'], 'over', v['steps_over_limit'], 'fastest', v['fastest_step_m_per_s'], 'classes', v['classes_kept'], 'uncheck', v['rows_that_cannot_be_checked'], '>24h', v['joins']['24h']['steps_not_joined'])
c = out['white_sharks']['C_anchored_3_m_per_s_anchors_3_2_1']; print('  SHARK C', c['totals'], c['kept_outside_10E_to_60E'], c['first_kept_row_more_than_500_km_from_the_next_ten'])
for tg in ('118852', '118845', '118861'):
    x = c['per_shark_by_tag_number'][tg]; print('  C tag', tg, 'kept', x['rows_kept'], 'rej', x['rows_rejected'], 'run', x['longest_run_of_rejected_rows'], 'classes', x['classes_kept'], 'extent', x['extent'], 'first', x['first_kept'], 'last', x['last_kept'], 'uncheck', x['rows_that_cannot_be_checked'], '>72h', x['joins']['72h'], 'firstkm', x['first_kept_row_km_from_median_of_next_10'])
