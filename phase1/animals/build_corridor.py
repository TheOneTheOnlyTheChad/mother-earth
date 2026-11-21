#!/usr/bin/env python3
"""Mother Earth - builder for a published corridor module on the Animals page (animals-tab-rc, stage 4 MVP).
Design: docs/concepts/ANIMALS-CORRIDOR-PROPOSAL.md rev 2.2 (branch animals-expansion-proposal), section 5. Standard library only.

It reads four pinned files INSIDE the pinned zip (never unpacked), checks them, converts the two shown classes from the source's
Albers projection to latitude and longitude, rounds, checks again, and writes three files: a display file, a manifest and the
corridor list. It NEVER repairs, reorders or drops a part: any failed check stops the build with nothing written.
No Low record, ring, polygon or coordinate array is written to any output; Low is read only to check counts and area.

MVP narrowing against section 5.4, stated in the manifest and the packet: the relation between the two classes is decided exactly
when their boundaries do not meet anywhere (then every ring lies wholly inside or outside every other ring, which is what makes one
exact point test per ring valid). If the two classes' boundaries meet at all (cross, touch or run together), this builder does NOT
classify the case: it stops as UNRESOLVED.

Usage: build_corridor.py --config <json> --source <zip> [--out-dir assets/animals] [--check]
Exit: 0 written, or --check found the same; 3 --check found a difference; 2 stopped by a rule (message on stderr)."""
import argparse, hashlib, html, json, math, os, re, struct, sys, zipfile
from fractions import Fraction
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import corridor_geom as G

class Stop(Exception): pass
def stop(n, msg): raise Stop(f'rule {n}: {msg}')
sha = lambda b: hashlib.sha256(b).hexdigest()

# ---------- projection (Snyder's ellipsoidal Albers; inverse by iteration)
class Albers:
    def __init__(s, p):
        s.a = p['a']; f = 1 / p['inv_f']; s.e2 = 2 * f - f * f; s.e = math.sqrt(s.e2); R = math.radians
        p1, p2, p0 = R(p['sp1']), R(p['sp2']), R(p['lat0']); s.l0 = R(p['lon0']); s.fe, s.fn = p['fe'], p['fn']
        s.n = (s.m(p1) ** 2 - s.m(p2) ** 2) / (s.q(p2) - s.q(p1)); s.C = s.m(p1) ** 2 + s.n * s.q(p1); s.r0 = s.a * math.sqrt(s.C - s.n * s.q(p0)) / s.n
    def q(s, p): t = math.sin(p); return (1 - s.e2) * (t / (1 - s.e2 * t * t) - (1 / (2 * s.e)) * math.log((1 - s.e * t) / (1 + s.e * t)))
    def m(s, p): return math.cos(p) / math.sqrt(1 - s.e2 * math.sin(p) ** 2)
    def inv(s, x, y):
        x -= s.fe; y -= s.fn; rho = math.hypot(x, s.r0 - y); th = math.atan2(x, s.r0 - y); qq = (s.C - rho * rho * s.n * s.n / (s.a * s.a)) / s.n; p = math.asin(qq / 2)
        for _ in range(25):
            t = math.sin(p); d = (1 - s.e2 * t * t) ** 2 / (2 * math.cos(p)) * (qq / (1 - s.e2) - t / (1 - s.e2 * t * t) + (1 / (2 * s.e)) * math.log((1 - s.e * t) / (1 + s.e * t))); p += d
            if abs(d) < 1e-13: break                                       # 1e-13 rad is under a micrometre on the ground
        else: raise Stop('rule 13: the inverse projection did not settle')
        return math.degrees(s.l0 + th / s.n), math.degrees(p)
    def fwd(s, lon, lat):
        p = math.radians(lat); rho = s.a * math.sqrt(s.C - s.n * s.q(p)) / s.n; th = s.n * (math.radians(lon) - s.l0); return s.fe + rho * math.sin(th), s.fn + s.r0 - rho * math.cos(th)

# ---------- reading
def read_shp(b):
    if len(b) < 100 or struct.unpack('>i', b[:4])[0] != 9994 or struct.unpack('<i', b[32:36])[0] != 5: stop(3, 'not a polygon shapefile')
    o = 100; recs = []
    while o < len(b):
        if o + 8 > len(b): stop(3, 'shapefile cut short')
        _, cl = struct.unpack('>ii', b[o:o + 8]); c = b[o + 8:o + 8 + cl * 2]; o += 8 + cl * 2
        if len(c) != cl * 2 or struct.unpack('<i', c[:4])[0] != 5: stop(3, 'a record is not a polygon')
        npart, npt = struct.unpack('<ii', c[36:44])
        if 44 + 4 * npart + 16 * npt != len(c): stop(3, 'a record has the wrong length')
        parts = list(struct.unpack('<%di' % npart, c[44:44 + 4 * npart])) + [npt]; pts = struct.unpack('<%dd' % (2 * npt), c[44 + 4 * npart:])
        if parts[0] != 0 or any(parts[k] >= parts[k + 1] for k in range(npart)): stop(3, 'a record has bad part offsets')
        recs.append([[(pts[2 * j], pts[2 * j + 1]) for j in range(parts[k], parts[k + 1])] for k in range(npart)])
    return recs
def read_dbf(b):
    n, hl, rl = struct.unpack('<IHH', b[4:12]); f = []; o = 32
    while b[o] != 0x0D: f.append((b[o:o + 11].split(b'\0')[0].decode('ascii'), b[o + 16])); o += 32
    rows = []
    for i in range(n):
        r = b[hl + i * rl:hl + (i + 1) * rl]; p = 1; row = []
        for _, l in f: row.append(r[p:p + l].decode('latin1').strip()); p += l
        rows.append(row)
    return [x[0] for x in f], rows

# ---------- validity of one class (rules 6 to 12, and 17 when run on the rounded rings)
def validate(rings, cell, n0, what):
    for ri, r in enumerate(rings):
        for p in r:
            if not (isinstance(p[0], int) or (math.isfinite(p[0]) and math.isfinite(p[1]))): stop(n0, f'{what} ring {ri}: a coordinate is not finite')
        if len(r) < 4 or r[0] != r[-1]: stop(n0 + 1, f'{what} ring {ri}: not closed, or fewer than three sides')
        if any(r[i] == r[i + 1] for i in range(len(r) - 1)): stop(n0 + 1, f'{what} ring {ri}: two successive vertices are equal')
        if G.area2(r) == 0: stop(n0 + 1, f'{what} ring {ri}: zero area (its vertices are on one line)')
    segs = []; owner = []
    for ri, r in enumerate(rings):
        for si, s in enumerate(G.segments(r)): segs.append(s); owner.append((ri, si, len(r) - 1))
    for i, j in G.grid_pairs(segs, None, cell):
        k = G.contact(*segs[i], *segs[j])
        if k is None: continue
        (ri, si, ni), (rj, sj, _) = owner[i], owner[j]
        if ri == rj and (abs(si - sj) == 1 or abs(si - sj) == ni - 1) and k == 'touch': continue      # neighbours share their vertex
        if ri == rj: stop(n0 + 3, f'{what} ring {ri} is not simple: sides {si} and {sj} {k}')
        stop(n0 + 6, f'{what} rings {ri} and {rj} meet ({k}) at sides {si} and {sj}: not accepted silently; reported, not repaired')
    # no two rings meet, so each ring lies wholly inside or outside every other: one exact point test per pair is valid
    cw = [G.area2(r) < 0 for r in rings]; inside = [[j for j, q in enumerate(rings) if j != i and G.in_ring(r[0], q) > 0] for i, r in enumerate(rings)]
    parent = []
    for i in range(len(rings)):
        depth = len(inside[i])
        if cw[i] != (depth % 2 == 0): stop(n0 + 2, f'{what} ring {i}: orientation does not fit its nesting (clockwise {cw[i]}, depth {depth})')
        par = [j for j in inside[i] if len(inside[j]) == depth - 1]
        if depth and len(par) != 1: stop(n0 + 4, f'{what} ring {i}: no single enclosing ring')
        if depth % 2 == 1 and not cw[par[0]]: stop(n0 + 4, f'{what} hole {i}: its enclosing ring is not an outer ring')
        parent.append(par[0] if depth else None)
    return {'outer': [i for i in range(len(rings)) if cw[i]], 'holes': [i for i in range(len(rings)) if not cw[i]], 'parent': parent, 'depth': [len(x) for x in inside]}

# ---------- relation between the two classes over their complete filled areas (rules 19 to 26, with the MVP narrowing)
def relation(M, H, cell):
    sm = [s for r in M for s in G.segments(r)]; sh = [s for r in H for s in G.segments(r)]; kinds = {'cross': 0, 'touch': 0, 'overlap': 0}
    for i, j in G.grid_pairs(sm, sh, cell):
        k = G.contact(*sm[i], *sh[j])
        if k: kinds[k] += 1
    ev = {'proper_crossings': kinds['cross'], 'point_contacts': kinds['touch'], 'coincident_stretches': kinds['overlap']}
    if any(kinds.values()): return dict(ev, relation='unresolved', why='the two classes\' boundaries meet; this builder classifies only when they do not')
    def signed(rs): return [(r, abs(G.area2(r)), 1 if G.area2(r) < 0 else -1) for r in rs]
    m, h = signed(M), signed(H); AM = sum(s * a for _, a, s in m); AH = sum(s * a for _, a, s in h); I = 0
    for r, a, s in m:
        for q, b, t in h:
            if G.in_ring(q[0], r) > 0: I += s * t * b            # q wholly inside r
            elif G.in_ring(r[0], q) > 0: I += s * t * a          # r wholly inside q
    rel = 'bands' if I == 0 else 'nested' if (I == AH and AH < AM) else 'mixed'
    return dict(ev, relation=rel, twice_area_medium=AM, twice_area_high=AH, twice_area_shared=I)

def build(cfg, zbytes):
    L = cfg['limits']
    if len(zbytes) != cfg['source_zip']['bytes'] or sha(zbytes) != cfg['source_zip']['sha256']: stop(1, 'the source zip is not the pinned file')
    import io; z = zipfile.ZipFile(io.BytesIO(zbytes)); raw = {}
    for k, f in cfg['inner'].items():
        try: b = z.read(cfg['inner_dir'] + f['name'])
        except KeyError: stop(1, f'{f["name"]} is not in the zip')
        if len(b) != f['bytes'] or sha(b) != f['sha256']: stop(1, f'{f["name"]} is not the pinned file')
        raw[k] = b
    if raw['prj'].decode('ascii') != cfg['prj_text']: stop(2, 'the projection text differs from the pinned text')
    P = cfg['projection']
    for key, val in (('False_Easting', P['fe']), ('False_Northing', P['fn']), ('Central_Meridian', P['lon0']), ('Standard_Parallel_1', P['sp1']), ('Standard_Parallel_2', P['sp2']), ('Latitude_Of_Origin', P['lat0'])):
        mm = re.search(r'PARAMETER\["%s",([-0-9.]+)\]' % key, cfg['prj_text'])
        if not mm or float(mm.group(1)) != val: stop(2, f'projection parameter {key} differs from the config')
    if 'SPHEROID["GRS_1980",%s,%s]' % (P['a'], P['inv_f']) not in cfg['prj_text'] or 'PROJECTION["Albers"]' not in cfg['prj_text'] or 'NAD_1983_NSRS2007' not in cfg['prj_text']: stop(2, 'spheroid, projection or datum differs from the config')
    recs = read_shp(raw['shp']); fields, rows = read_dbf(raw['dbf'])
    if len(recs) != 3 or fields != cfg['dbf_fields'] or rows != cfg['dbf_rows']: stop(3, 'records or attribute rows differ from the expected three (Low, Medium, High)')
    xml = html.unescape(raw['xml'].decode('utf-8'))
    for k, qv in cfg['quotes'].items():
        if qv not in xml: stop(4, f'the metadata no longer contains the quoted text "{k}"')
    cite = re.search(r'<citeinfo>(.*?)</citeinfo>', raw['xml'].decode('utf-8'), re.S).group(1); un = lambda t: [html.unescape(v) for v in re.findall(r'<%s>(.*?)</%s>' % (t, t), cite, re.S)]
    names = {r[4]: i for i, r in enumerate(rows)}; A = Albers(P); src = {}
    for name in ('Low', 'Medium', 'High'):
        rings = recs[names[name]]; E = cfg['expect'][name]; a2 = [G.area2(r) for r in rings] if name in cfg['shown'] else None
        fa = [sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1)) / 2 for r in rings]
        got = {'rings': len(rings), 'outer': sum(1 for v in fa if v < 0), 'holes': sum(1 for v in fa if v > 0), 'points': sum(len(r) for r in rings)}
        if any(got[k] != E[k] for k in got): stop(5, f'{name}: counts {got} differ from the expected {E}')
        net = -sum(fa) / 1e6
        if abs(net - E['area_km2']) > L['source_area_tolerance_km2']: stop(5, f'{name}: source net area {net:.5f} km2 differs from the expected {E["area_km2"]}')
        src[name] = {'rings': rings, 'net_km2': net, 'got': got}
    # rule 18: the corners of the projected bounding box against the metadata's four values (the source's own software)
    bb = struct.unpack('<4d', raw['shp'][36:68]); cs = [A.inv(bb[0], bb[1]), A.inv(bb[0], bb[3]), A.inv(bb[2], bb[1]), A.inv(bb[2], bb[3])]
    mb = cfg['metadata_bounds']; gotb = {'west': min(c[0] for c in cs), 'east': max(c[0] for c in cs), 'south': min(c[1] for c in cs), 'north': max(c[1] for c in cs)}
    for k in mb:
        if round(gotb[k], 4) != mb[k]: stop(18, f'bounding-box corner check: {k} is {gotb[k]:.4f}, the metadata says {mb[k]}')
    out = {}; S = round(1 / L['round_deg'])
    for name in cfg['shown']:
        rings = src[name]['rings']; st = validate(rings, L['grid_cell_source_m'], 6, name + ' (source)'); rr = []; per = []
        for ri, r in enumerate(rings):
            q = []; dmax = 0.0
            for x, y in r:
                lo, la = A.inv(x, y); p = (round(lo * S), round(la * S)); X, Y = A.fwd(p[0] / S, p[1] / S); d = math.hypot(X - x, Y - y); dmax = max(dmax, d); q.append(p)
            if dmax > L['max_displacement_m']: stop(15, f'{name} ring {ri}: a vertex moved {dmax:.3f} m on rounding (limit {L["max_displacement_m"]})')
            pr = [A.fwd(p[0] / S, p[1] / S) for p in q]; sa = lambda t: sum(t[i][0] * t[i + 1][1] - t[i + 1][0] * t[i][1] for i in range(len(t) - 1)) / 2
            a0, a1 = sa(r), sa(pr); perim = sum(math.hypot(r[i + 1][0] - r[i][0], r[i + 1][1] - r[i][1]) for i in range(len(r) - 1)); bound = L['ring_area_bound_m_per_perimeter_m'] * perim
            if abs(a1 - a0) > bound: stop(16, f'{name} ring {ri}: area changed by {abs(a1 - a0):.1f} m2 on rounding (bound {bound:.1f})')
            rr.append(q); per.append({'ring': ri, 'role': 'outer' if a0 < 0 else 'hole', 'points': len(r), 'perimeter_m': round(perim, 1), 'source_area_m2': round(abs(a0), 1), 'rounded_area_m2': round(abs(a1), 1), 'area_change_m2': round(abs(a1) - abs(a0), 1), 'area_change_bound_m2': round(bound, 1), 'max_displacement_m': round(dmax, 3)})
        netr = sum((1 if p['role'] == 'outer' else -1) * p['rounded_area_m2'] for p in per) / 1e6
        if abs(netr - src[name]['net_km2']) > L['class_area_fraction'] * src[name]['net_km2']: stop(16, f'{name}: class area changed by more than {L["class_area_fraction"] * 100}% on rounding')
        st2 = validate(rr, L['grid_cell_output_units'], 6, name + ' (rounded)')
        if st2 != st: stop(17, f'{name}: nesting or orientation changed on rounding')
        out[name] = {'rounded': rr, 'structure': st, 'per_ring': per, 'net_rounded_km2': netr}
    r0 = relation(src['Medium']['rings'], src['High']['rings'], L['grid_cell_source_m']); r1 = relation(out['Medium']['rounded'], out['High']['rounded'], L['grid_cell_output_units'])
    for tag, r in (('source', r0), ('rounded output', r1)):
        if r['relation'] == 'unresolved': stop(24, f'relation between Medium and High in the {tag} is UNRESOLVED: {r["why"]} ({r["proper_crossings"]} crossings, {r["point_contacts"]} point contacts, {r["coincident_stretches"]} coincident stretches)')
        if r['relation'] == 'mixed': stop(25, f'relation between Medium and High in the {tag} is MIXED (shared area is neither nothing nor all of High)')
    if r0['relation'] != r1['relation'] or any((r0[k] > 0) != (r1[k] > 0) for k in ('proper_crossings', 'point_contacts', 'coincident_stretches')): stop(26, 'the relation or its contact evidence differs between source and rounded output')
    rel = r0['relation']
    # ---------- outputs: exactly the shown classes
    def steps(q):
        q = q[:-1]; o = [q[0][0], q[0][1]]
        for i in range(1, len(q)): o += [q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]]
        return o
    classes = []; facts = {}
    for name in cfg['shown']:
        o = out[name]; st = o['structure']; polys = []
        for oi in st['outer']: polys.append({'outer': steps(o['rounded'][oi]), 'holes': [steps(o['rounded'][hi]) for hi in st['holes'] if st['parent'][hi] == oi]})
        classes.append({'key': name.lower(), 'polygons': polys}); pts = [p for r in o['rounded'] for p in r]
        facts[name.lower()] = {'patches': len(st['outer']), 'holes': len(st['holes']), 'points': src[name]['got']['points'], 'source_net_area_km2': round(src[name]['net_km2'], 5), 'rounded_net_area_km2': round(o['net_rounded_km2'], 5),
                               'extent_deg': {'west': min(p[0] for p in pts) / S, 'east': max(p[0] for p in pts) / S, 'south': min(p[1] for p in pts) / S, 'north': max(p[1] for p in pts) / S}, 'per_ring': o['per_ring']}
    display = {'schema': 1, 'id': cfg['id'], 'revision': cfg['revision'], 'units_per_degree': S, 'ring_encoding': 'first vertex as whole numbers (longitude, latitude, in units), then steps from the previous vertex; the closing vertex is not repeated', 'classes': classes}
    disp = (json.dumps(display, separators=(',', ':')) + '\n').encode('utf-8'); dfile = f'{cfg["id"]}-{cfg["revision"]}.json'
    W = dict(cfg['wording']); band = None
    if rel == 'nested': band = round(src['Medium']['net_km2'] - src['High']['net_km2'], 5)
    else: W.pop('nested_note')
    fr = lambda v: float(Fraction(v) / 2)
    manifest = {'schema': 1, 'id': cfg['id'], 'revision': cfg['revision'], 'kind': cfg['kind'], 'group': cfg['group'], 'label': cfg['label'], 'heading': cfg['heading'], 'evidence_type': cfg['evidence_type'],
        'display': {'file': dfile, 'bytes': len(disp), 'sha256': sha(disp)}, 'classes_shown': [n.lower() for n in cfg['shown']], 'class_not_shown': 'low',
        'low_note': 'The Low class was read only to check the file\'s record order, counts and net area. No Low record, ring, polygon or coordinate array is in the display file, this manifest or the list.',
        'low_checked': {'points': src['Low']['got']['points'], 'rings': src['Low']['got']['rings'], 'source_net_area_km2': round(src['Low']['net_km2'], 5)},
        'facts': facts, 'medium_only_band_km2': band,
        'relation': {'result': rel, 'method': 'exact; boundaries of the two classes do not meet, so each ring lies wholly inside or outside every other; shared area from exact ring areas (docs/concepts/ANIMALS-CORRIDOR-PROPOSAL.md section 5.4, MVP narrowing: any boundary contact between the classes stops the build as unresolved)',
            'source': {'proper_crossings': r0['proper_crossings'], 'point_contacts': r0['point_contacts'], 'coincident_stretches': r0['coincident_stretches'], 'area_medium_m2': fr(r0['twice_area_medium']), 'area_high_m2': fr(r0['twice_area_high']), 'area_shared_m2': fr(r0['twice_area_shared']), 'shared_equals_high_exactly': r0['twice_area_shared'] == r0['twice_area_high']},
            'rounded': {'proper_crossings': r1['proper_crossings'], 'point_contacts': r1['point_contacts'], 'coincident_stretches': r1['coincident_stretches'], 'twice_area_medium_units2': r1['twice_area_medium'], 'twice_area_high_units2': r1['twice_area_high'], 'twice_area_shared_units2': r1['twice_area_shared'], 'shared_equals_high_exactly': r1['twice_area_shared'] == r1['twice_area_high']}},
        'definitions_as_in_metadata': {'low': cfg['quotes']['def_low'], 'medium': cfg['quotes']['def_medium'], 'high': cfg['quotes']['def_high']},
        'metadata_quotes': {k: cfg['quotes'][k] for k in ('sample', 'use', 'process_footprint', 'process_stack', 'process_generic_thresholds', 'process_grid')},
        'projection': dict(P, conversion='inverse Albers for the ellipsoid; result is geographic on NAD83(NSRS2007); no datum transformation applied', rounding_deg=L['round_deg'], corner_check={'computed': {k: round(v, 4) for k, v in gotb.items()}, 'metadata': mb}),
        'limits': L, 'wording': W, 'view': cfg['view'], 'grid': cfg['grid'],
        'record': dict(cfg['record'], layer_title=un('title')[0], metadata_pubdate=un('pubdate')[0], publisher=(un('publish') or [''])[0], originators_as_listed=un('origin')),
        'source': {'zip': cfg['source_zip'], 'inner_dir': cfg['inner_dir'], 'files': cfg['inner']},
        'builder': 'phase1/animals/build_corridor.py', 'config': 'phase1/animals/' + os.path.basename(cfg.get('_path', '')),
        'sensitivity': 'No finding is made. Omitting Low is a display choice, not evidence that the shown classes are insensitive. Public release needs Chad\'s recorded decision.'}
    man = (json.dumps(manifest, indent=1, ensure_ascii=False) + '\n').encode('utf-8'); mfile = f'{cfg["id"]}-{cfg["revision"]}.manifest.json'
    catalog = {'schema': 1, 'revision': 'R1', 'note': 'Published corridor products for the Animals page. Separate from the journey list and the population list. A page draws nothing from a manifest whose checksum differs from the one here.',
        'corridors': [{'id': cfg['id'], 'label': cfg['label'], 'group': cfg['group'], 'kind': cfg['kind'], 'manifest': mfile, 'manifest_sha256': sha(man)}]}
    cat = (json.dumps(catalog, indent=1, ensure_ascii=False) + '\n').encode('utf-8')
    return {dfile: disp, mfile: man, 'corridors-R1.catalog.json': cat}, manifest

def main(argv=None):
    ap = argparse.ArgumentParser(); ap.add_argument('--config', required=True); ap.add_argument('--source', required=True)
    ap.add_argument('--out-dir', default='assets/animals'); ap.add_argument('--check', action='store_true'); a = ap.parse_args(argv)
    cfg = json.load(open(a.config, encoding='utf-8')); cfg['_path'] = a.config
    try: files, man = build(cfg, open(a.source, 'rb').read())
    except Stop as e: print('STOPPED  ' + str(e), file=sys.stderr); return 2
    diff = 0
    for name, b in files.items():
        p = os.path.join(a.out_dir, name)
        if a.check:
            same = os.path.exists(p) and open(p, 'rb').read() == b; diff += not same; print(('same      ' if same else 'DIFFERENT ') + p)
        else:
            open(p, 'wb').write(b); print(f'wrote {p}  {len(b)} bytes  {sha(b)}')
    if not a.check: print('relation:', man['relation']['result'], '| medium-only band km2:', man['medium_only_band_km2'])
    return 3 if diff else 0
if __name__ == '__main__': sys.exit(main())
