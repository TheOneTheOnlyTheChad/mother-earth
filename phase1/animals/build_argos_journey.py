"""Mother Earth — build one Argos journey display file and its manifest (animals-journeys-preview-rc, 19 Nov 2026).
PRIVATE PREVIEW. The settings are the ones in docs/concepts/ANIMALS-QUALITY-RULE-*.md rev 2 (branch animals-proposal) that GPT
passed as provisional private-preview proposals and Chad chose on 19 Nov 2026. They are experimental display choices, not a
reconstruction of the animal's route.

  python3 -I phase1/animals/build_argos_journey.py --config phase1/animals/<study>.json --source <file> --land <ne_10m_land.geojson>
          [--out-dir assets/animals] [--check]

The build refuses: a source or land file whose sha256 is not the one pinned in the config; rows out of time order; a class it does
not know; a coordinate out of range. Nothing is thinned, smoothed, interpolated or modelled. Coordinates are written as read.

Stages, in this order (each counted in the manifest):
  1. candidate rows        shark: every row of the chosen tag.  whale: Argos rows whose roll-up flag is PASS, minus Argos class Z;
                           the tagging row (type "User") is not part of the track.
  2. speed consistency     argos_rules.anchored (experimental), with the config's limit and anchor classes.
  3. temporal isolation    fixes whose every kept neighbour is more than `isolation_hours` away are left out (computed once).
  4. land                  fixes inside a land polygon of the pinned Natural Earth 1:10m file are left out.
  5. joining               consecutive fixes are joined when they are no more than `join_hours` apart AND the line the page draws
                           between them does not touch land in that file. The drawn line is a straight chord through the globe;
                           its path over the surface is tested as argos_rules.chord_points (points no more than 1 km apart).
The land promise is limited to what that file detects at that scale and to that sampling."""
import argparse, calendar, csv, hashlib, io, json, os, sys
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import argos_rules as ar
CLASSES = ['3', '2', '1', '0', 'A', 'B']
class BuildError(Exception): pass
def sha(b): return hashlib.sha256(b).hexdigest()
def iso(ts): import time; return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(ts))
def num(x):
    """a coordinate as the page will read it: the shortest decimal that gives back the same number"""
    return repr(float(x))

def read_sharks(raw, cfg):
    rows = []
    for r in csv.DictReader(io.StringIO(raw.decode('utf-8'))):
        if r['SPOT'] != cfg['animal']: continue
        d = r['date']
        if len(d) != 19 or d[4] != '-' or d[10] != ' ': raise BuildError(f'time {d!r} is not yyyy-mm-dd hh:mm:ss')
        if r['type'] != 'Argos': raise BuildError(f'row type {r["type"]!r}: this study is Argos only')
        rows.append((calendar.timegm((int(d[0:4]), int(d[5:7]), int(d[8:10]), int(d[11:13]), int(d[14:16]), int(d[17:19]), 0, 0, 0)), float(r['latitude']), float(r['longitude']), r['quality']))
    stages = [{'stage': f'rows for tag {cfg["animal"]} in the source file', 'rows_out': len(rows)}]
    return rows, stages, {}
def read_whale(path, cfg):
    import netCDF4
    ds = netCDF4.Dataset(path); ds.set_auto_mask(False); tv = ds.variables['time']
    dates = netCDF4.num2date(tv[:], tv.units, only_use_cftime_datetimes=False, only_use_python_datetimes=True)
    def s(v): return [''.join(c.decode() if isinstance(c, bytes) else str(c) for c in r).strip() if hasattr(r, '__iter__') and not isinstance(r, str) else str(r).strip() for r in ds.variables[v][:]]
    typ = s('type'); lc = s('location_class'); roll = ds.variables['qartod_rollup_flag'][:].astype(int); lat = ds.variables['lat'][:]; lon = ds.variables['lon'][:]
    allr = [(int(calendar.timegm(dates[i].timetuple())), float(lat[i]), float(lon[i]), lc[i], typ[i], int(roll[i])) for i in range(len(dates))]
    argos = [r for r in allr if r[4] == 'Argos']; ok = [r for r in argos if r[5] == 1]; base = [r for r in ok if r[3] != 'Z']
    stages = [{'stage': 'rows in the source file', 'rows_out': len(allr)}, {'stage': 'tagging row (type "User") left out', 'rows_in': len(allr), 'removed': len(allr) - len(argos), 'rows_out': len(argos)},
              {'stage': "rows that did not pass the data centre's time, location and speed checks", 'rows_in': len(argos), 'removed': len(argos) - len(ok), 'rows_out': len(ok)},
              {'stage': 'Argos class Z (marked invalid by the satellite system)', 'rows_in': len(ok), 'removed': len(ok) - len(base), 'rows_out': len(base)}]
    return [r[:4] for r in base], stages, {'citation_as_given': ds.getncattr('citation'), 'licence_text_in_file': ds.getncattr('license'), 'deployment_start_in_file': ds.getncattr('deployment_start_datetime')}

def build(cfg, source_path, land_path):
    import shapely, shapely.prepared, shapely.geometry as sg
    raw = open(source_path, 'rb').read()
    if sha(raw) != cfg['source_file']['sha256']: raise BuildError(f'source sha256 {sha(raw)} is not the pinned source file')
    lraw = open(land_path, 'rb').read()
    if sha(lraw) != cfg['land_data']['sha256']: raise BuildError(f'land sha256 {sha(lraw)} is not the pinned land file')
    rows, stages, extra = read_sharks(raw, cfg) if cfg['reader'] == 'zenodo-white-sharks-csv' else read_whale(source_path, cfg)
    for a, b in zip(rows[:-1], rows[1:]):
        if b[0] < a[0]: raise BuildError(f'rows out of time order at {iso(b[0])}')
    for r in rows:
        if r[3] not in CLASSES + ['Z']: raise BuildError(f'unknown Argos class {r[3]!r}')
        if not (-90 <= r[1] <= 90 and -180 <= r[2] <= 180): raise BuildError(f'coordinate out of range at {iso(r[0])}')
    R = cfg['rule']; V = R['speed_limit_m_per_s']
    c = ar.anchored(rows, V, R['anchor_classes']); stages.append({'stage': f"speed consistency (experimental rule; limit {R['speed_limit_label']}; classes {' '.join(R['anchor_classes'])} first)", 'rows_in': len(rows), 'removed': len(rows) - len(c), 'rows_out': len(c)})
    isol = set(ar.isolated(rows, c, R['isolation_hours'])); k = [i for a, i in enumerate(c) if a not in isol]
    stages.append({'stage': f"more than {R['isolation_hours']} hours from any other kept fix", 'rows_in': len(c), 'removed': len(isol), 'rows_out': len(k)})
    kept = [rows[i] for i in k]; pad = 3.0
    box = sg.box(min(r[2] for r in kept) - pad, min(r[1] for r in kept) - pad, max(r[2] for r in kept) + pad, max(r[1] for r in kept) + pad)
    parts = [g.intersection(box) for g in (sg.shape(f['geometry']) for f in json.loads(lraw)['features']) if g.intersects(box)]
    land = shapely.unary_union(parts) if parts else sg.GeometryCollection(); prep = shapely.prepared.prep(land)
    on = [(not land.is_empty) and prep.contains(sg.Point(r[2], r[1])) for r in kept]; final = [r for r, f in zip(kept, on) if not f]
    stages.append({'stage': 'on land in the pinned Natural Earth 1:10m land file', 'rows_in': len(kept), 'removed': sum(on), 'rows_out': len(final), 'removed_by_class': dict(Counter(r[3] for r, f in zip(kept, on) if f))})
    if any(r[3] not in CLASSES for r in final): raise BuildError('a class outside 3 2 1 0 A B survived the stages')
    for a, b in zip(final[:-1], final[1:]):
        if b[0] <= a[0]: raise BuildError(f'two kept fixes share the time {iso(b[0])}')
        if ar.speed(a, b)[0] > V: raise BuildError(f'a kept step exceeds the limit at {iso(b[0])}')
    newly = len(ar.isolated(final, list(range(len(final))), R['isolation_hours']))
    J = [0]; within = crossing = 0; lim = R['join_hours'] * 3600
    for a, b in zip(final[:-1], final[1:]):
        if b[0] - a[0] > lim: J.append(0); continue
        within += 1
        pts = ar.chord_points(a[1], a[2], b[1], b[2], 1.0)
        hit = (not land.is_empty) and prep.intersects(sg.LineString(pts) if pts[0] != pts[-1] else sg.Point(pts[0]))
        crossing += hit; J.append(0 if hit else 1)
    n = len(final); gaps = [b[0] - a[0] for a, b in zip(final[:-1], final[1:])]
    ident = f"{cfg['study']}-{cfg['animal']}-{cfg['revision']}"
    display = ('{"schema":2,"id":"%s","study":"%s","animal":"%s","n":%d,\n"t":[%s],\n"lat":[%s],\n"lon":[%s],\n"lc":"%s",\n"j":[%s]}\n' % (
        ident, cfg['study'], cfg['animal'], n, ','.join(str(r[0]) for r in final), ','.join(num(r[1]) for r in final), ','.join(num(r[2]) for r in final), ''.join(r[3] for r in final), ','.join(map(str, J)))).encode()
    back = json.loads(display)
    if back['t'] != [r[0] for r in final] or back['lat'] != [r[1] for r in final] or back['lon'] != [r[2] for r in final]: raise BuildError('the display file does not read back as the kept fixes')
    cls = Counter(r[3] for r in final); weak = sum(cls[x] for x in R['weak_classes'])
    removed = {s['stage']: s.get('removed') for s in stages}
    fname = f'{ident}.json'
    man = {k_: v for k_, v in cfg.items() if k_ not in ('reader', 'rule', 'card_text')}
    man.update(extra if cfg['reader'] != 'zenodo-white-sharks-csv' else {})
    man.update({'kind': 'argos', 'schema': 2, 'animals_shown': 1, 'built_from': 'full source file', 'rule': R, 'stages': stages,
        'gap_rule': {'max_join_seconds': lim, 'statement': f"Mother Earth does not join fixes more than {R['join_hours']} hours apart, or where the line would cross land in its land map. These are display rules of Mother Earth's, not part of the study."},
        'journeys': [{'animal': cfg['animal'], 'file': fname, 'bytes': len(display), 'sha256': sha(display), 'fixes': n, 'first_fix': iso(final[0][0]), 'last_fix': iso(final[-1][0]), 'first_fix_s': final[0][0], 'last_fix_s': final[-1][0],
            'bbox': {'south': min(r[1] for r in final), 'north': max(r[1] for r in final), 'west': min(r[2] for r in final), 'east': max(r[2] for r in final)},
            'steps': n - 1, 'steps_within_join_limit': within, 'steps_refused_for_land': int(crossing), 'steps_joined': sum(J), 'classes': {c_: cls.get(c_, 0) for c_ in CLASSES}, 'weak_class_share_percent': round(100 * weak / n),
            'gaps_over_rule': sum(g > lim for g in gaps), 'longest_gap_s': max(gaps), 'newly_isolated_after_all_stages_not_removed': newly}]})
    t = cfg['card_text']; f = {'n': f'{n:,}', 'weak': round(100 * weak / n), 'join': R['join_hours'], 'iso': R['isolation_hours'], 'limit': R['speed_limit_label'], 'land': stages[-1]['removed'], 'isolated': len(isol), 'speed': len(rows) - len(c),
                               'refused': int(crossing), 'candidates': f'{len(rows):,}', 'joined': f'{sum(J):,}', 'steps': f'{n - 1:,}', 'first': iso(final[0][0]), 'last': iso(final[-1][0])}
    man['card'] = {k_: v.format(**f) for k_, v in t.items()}
    return fname, display, f"{cfg['study']}-{cfg['revision']}.manifest.json", (json.dumps(man, indent=1, ensure_ascii=False) + '\n').encode()
def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument('--config', required=True); ap.add_argument('--source', required=True); ap.add_argument('--land', required=True); ap.add_argument('--out-dir', default='assets/animals'); ap.add_argument('--check', action='store_true')
    a = ap.parse_args(argv); cfg = json.load(open(a.config, encoding='utf-8'))
    try: dn, db, mn, mb = build(cfg, a.source, a.land)
    except BuildError as e: print(f'BUILD STOPPED: {e}'); return 2
    for name, data in ((dn, db), (mn, mb)):
        p = os.path.join(a.out_dir, name)
        if a.check: print(('same  ' if os.path.exists(p) and open(p, 'rb').read() == data else 'DIFFERENT  ') + p)
        else: open(p, 'wb').write(data); print(f'{name}  {len(data)} bytes  sha256 {sha(data)}')
    m = json.loads(mb); print(json.dumps(m['stages'], ensure_ascii=False)); print(json.dumps(m['journeys'][0])); return 0
if __name__ == '__main__': sys.exit(main())
