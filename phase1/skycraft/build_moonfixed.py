#!/usr/bin/env python3
"""Mother Earth — LRO's dated path on the Moon globe: the Moon-fixed catalogue (MOON-LRO-DATED-PATH-PROPOSAL rev 2).

  craft-moon-me-2026-06-R1  The same 1,441 native LRO states as craft-moon-2026-06-R1 (10 June 2026 00:00 – 11 June 00:00 UTC,
                            PDS definitive SPK, segment 894101–904203), each rotated ONCE, at its own SPK epoch (TDB), from J2000
                            into MOON_ME_DE440_ME421 with NAIF SPICE pxform. Centre and radius kept. No interpolation.

Three checks run on every build and are written to checks/moonfixed-checks.json:
  1. INDEPENDENT ROTATION — JPL's DE440 lunar libration angles evaluated here from the public ASCII Chebyshev coefficients
     (own evaluator, own rotation maths, no SPICE), then NAIF's fixed PA → ME offset. Ceilings: 0.001° between matrices,
     0.05 km per transformed position.
  2. EXTERNAL — NASA/JPL Horizons, target 301 seen from 500@-85, observer quantity 14 (header must say MOON_ME, east-positive),
     five epochs. Horizons applies down-leg light time (Moon at t − lt, solar-system-barycentric); the same correction is applied
     to our states before comparing directions. Ceiling 0.01°. The geometric (uncorrected) residuals are recorded too.
  3. CHORDS — every straight segment between consecutive native samples, endpoints rotated at their own epochs, clears the
     1,737.4 km sphere; the minimum is recorded.

Inputs (raw/, hash-pinned below):
  - the LRO segment already pinned for R1;
  - NAIF moon_de440_250416.tf and naif0012.tls (whole files);
  - NAIF moon_pa_de440_200625.bpc as three verbatim byte ranges (DAF header + summaries; type-2 records 21751–21753, which
    cover 2026-06-02 to 2026-06-26 TDB; the segment trailer). The full file (12,863,488 B, sha256 60cd55aa…783f) was hashed
    when the ranges were cut. The build reassembles a same-length file with every other byte 0xFF, so any read outside the
    ranges gives NaN and fails the build;
  - JPL DE440 ASCII header.440 and record 874 of ascp01950.440 (JED 2461200.5 – 2461232.5);
  - the two Horizons responses (text API, version 1.2).

  python3 phase1/skycraft/build_moonfixed.py          write assets/moon/craft-moon-me-2026-06-R1.json, checks/, BUILD-moonfixed.json
  python3 phase1/skycraft/build_moonfixed.py --check  rebuild in memory and compare with the files on disk
Needs spiceypy 8.0.0 (CSPICE N0067); the independent check uses the standard library only.
"""
import hashlib, json, math, os, re, struct, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
RAW = os.path.join(HERE, 'raw')
OUT_CAT = os.path.join(ROOT, 'assets', 'moon', 'craft-moon-me-2026-06-R1.json')
OUT_CHK = os.path.join(HERE, 'checks', 'moonfixed-checks.json')
OUT_BUILD = os.path.join(HERE, 'BUILD-moonfixed.json')

PINS = {
    'lrorg_2026074_2026166_v01.seg-894101-904203.bin': '7fb04d7e131e1c8c4b3fbe2d1b8fc36cb535ac262824aa700bdf6a5009b693f9',
    'moon_de440_250416.tf': 'a47c71e9c9f33796bdafb2c9d69a7ee447b6016ecad80f71cd6f3e479f9cf768',
    'naif0012.tls': '678e32bdb5a744117a467cd9601cd6b373f0e9bc9bbde1371d5eee39600a039b',
    'moon_pa_de440_200625.bpc.head.bin': 'e9965ec81153d6fa9cfcc0f2c56ef0f5f2798dc097de2e4ed4ac6c378f9ea33b',
    'moon_pa_de440_200625.bpc.rec21751-21753.bin': '10f4ed582cfed7c26bb66fb6e893b51ea253d0b0437dfad63429104385f8ff84',
    'moon_pa_de440_200625.bpc.seg1-trailer.bin': 'cbd56ca0e9d46fb392345be7fc27dee2501d04211a612c3e6a3c82f4d126c707',
    'de440-header.440': '0f4636b663e6f00af9efa2b605ef23635489f56b23dd1a5e3821d3acc6ac3359',
    'de440-ascp01950-rec874.txt': 'fbd042854aef66eb7d676cbeec8162fed207880d293a34f23c15f83979bbc75a',
    'horizons-moon-from-lro-q14-20260610.txt': '5a4d595977c7db426810a610da1a4c408916f3c59e39601dfbfe9e2810e08434',
    'horizons-moon-ssb-vectors-20260610.txt': '229f4008ce207342f86a85c3b6b28e1153537e62d30fdf9c9439fd37c933ecf9',
}
BPC = {'file': 'moon_pa_de440_200625.bpc', 'bytes': 12863488, 'sha256': '60cd55aa401ea2ea97360636f567554bfe4e37bb829f901b4460a455dfaf783f',
       'url': 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de440_200625.bpc', 'last_modified': 'Sat, 26 Jun 2021 01:49:57 GMT',
       'ranges': [['moon_pa_de440_200625.bpc.head.bin', 0], ['moon_pa_de440_200625.bpc.rec21751-21753.bin', 5573376],
                  ['moon_pa_de440_200625.bpc.seg1-trailer.bin', 10245120]],
       'segment1': {'first_word': 641, 'last_word': 1280644, 'init_tdb_s': -14200747200.0, 'intlen_s': 691200.0, 'rsize': 32, 'n': 40000},
       'records_held': [21751, 21753]}
SOURCES = {
    'moon_de440_250416.tf': {'url': 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_de440_250416.tf', 'last_modified': 'Wed, 16 Apr 2025 12:47:17 GMT'},
    'naif0012.tls': {'url': 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls', 'last_modified': 'Fri, 15 Jul 2016 00:00:37 GMT'},
    'de440-header.440': {'url': 'https://ssd.jpl.nasa.gov/ftp/eph/planets/ascii/de440/header.440'},
    'de440-ascp01950-rec874.txt': {'url': 'https://ssd.jpl.nasa.gov/ftp/eph/planets/ascii/de440/ascp01950.440', 'byte_range': [23414733, 23441553], 'file_bytes': 30629582},
}
RETRIEVED = {'naif_tf_tls_arrived': '2026-11-14T16:09Z', 'naif_bpc_ranges_arrived': '2026-11-14T16:11Z', 'horizons_q14': '2026-11-14T16:11:55Z', 'horizons_vectors': '2026-11-14T16:13:19Z',
             'de440_header': '2026-11-14T16:14:45Z', 'de440_record': '2026-11-14T16:15:08Z'}
FRAME = 'MOON_ME_DE440_ME421'
MOON_R_KM, C_KMS = 1737.4, 299792.458
CEIL = {'rotation_deg': 0.001, 'position_km': 0.05, 'norm_km': 1e-6, 'horizons_deg': 0.01}
R1_PIN = {'revision': 'craft-moon-2026-06-R1', 'sha256': 'e747aa7a58a71a5e2a11253b2d063fcfc80809d8d86291ce6dce8220d1d05ebb'}


def raw(name, mode='rb'):
    b = open(os.path.join(RAW, name), 'rb').read()
    got = hashlib.sha256(b).hexdigest()
    if got != PINS[name]: raise SystemExit(f'raw/{name}: sha256 {got} is not the pinned {PINS[name]}')
    return b if mode == 'rb' else b.decode('utf-8')

# ---------- small vector maths (lists; no numpy, so the independent check shares no library with SPICE)
def mm(a, b): return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
def mv(a, v): return [sum(a[i][k] * v[k] for k in range(3)) for i in range(3)]
def tr(a): return [[a[j][i] for j in range(3)] for i in range(3)]
def dot(a, b): return sum(x * y for x, y in zip(a, b))
def norm(v): return math.sqrt(dot(v, v))
def sub(a, b): return [x - y for x, y in zip(a, b)]
def cross(a, b): return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
def ang(a, b): return math.degrees(math.atan2(norm(cross(a, b)), dot(a, b)))
def rot_angle(a, b):
    """Angle of the rotation a·bᵀ, in degrees."""
    m = mm(a, tr(b)); c = max(-1.0, min(1.0, (m[0][0] + m[1][1] + m[2][2] - 1) / 2)); return math.degrees(math.acos(c))
def frot(axis, t):
    """Frame rotation by angle t about axis 1, 2 or 3 (rotates the frame; vectors transform by this matrix)."""
    c, s = math.cos(t), math.sin(t)
    if axis == 1: return [[1, 0, 0], [0, c, s], [0, -s, c]]
    if axis == 2: return [[c, 0, -s], [0, 1, 0], [s, 0, c]]
    return [[c, s, 0], [-s, c, 0], [0, 0, 1]]
def latlon(q):
    return math.degrees(math.atan2(q[2], math.hypot(q[0], q[1]))), (math.degrees(math.atan2(q[1], q[0])) + 180) % 360 - 180

# ---------- inputs
def lro_states():
    b = raw('lrorg_2026074_2026166_v01.seg-894101-904203.bin')
    d = struct.unpack('>%dd' % (len(b) // 8), b); n = int(d[-1])
    if n != 1441 or len(d) != 6 * n + n + (n - 1) // 100 + 2: raise SystemExit('LRO segment: unexpected type 13 layout')
    return [([d[6 * i], d[6 * i + 1], d[6 * i + 2]], [d[6 * i + 3], d[6 * i + 4], d[6 * i + 5]], d[6 * n + i]) for i in range(n)]

def spice_rotations(states):
    import spiceypy as sp
    if sp.__version__ != '8.0.0' or sp.tkvrsn('TOOLKIT') != 'CSPICE_N0067':
        raise SystemExit(f'needs spiceypy 8.0.0 / CSPICE_N0067, found {sp.__version__} / {sp.tkvrsn("TOOLKIT")}')
    buf = bytearray(b'\xff' * BPC['bytes'])
    for name, off in BPC['ranges']: piece = raw(name); buf[off:off + len(piece)] = piece
    s1 = BPC['segment1']
    with tempfile.TemporaryDirectory() as tmp:
        paths = []
        for name, data in (('moon_pa_de440_200625.bpc', bytes(buf)), ('moon_de440_250416.tf', raw('moon_de440_250416.tf')), ('naif0012.tls', raw('naif0012.tls'))):
            p = os.path.join(tmp, name); open(p, 'wb').write(data); paths.append(p)
        sp.kclear()
        for p in paths: sp.furnsh(p)
        out = []
        for r, v, et in states:
            k = int((et - s1['init_tdb_s']) // s1['intlen_s'])
            if not BPC['records_held'][0] <= k <= BPC['records_held'][1]: raise SystemExit(f'epoch {et}: PCK record {k} is not among the held ranges')
            m = [list(row) for row in sp.pxform('J2000', FRAME, et)]
            if not all(math.isfinite(c) for row in m for c in row): raise SystemExit(f'epoch {et}: rotation is not finite (read outside the held ranges)')
            out.append(m)
        utc0 = sp.et2utc(states[0][2], 'ISOC', 3); utc1 = sp.et2utc(states[-1][2], 'ISOC', 3)
        tk = sp.tkvrsn('TOOLKIT'); sp.kclear()
    if (utc0, utc1) != ('2026-06-10T00:00:00.000', '2026-06-11T00:00:00.000'): raise SystemExit(f'epoch check: first/last state at {utc0} / {utc1} UTC')
    return out, tk, [utc0, utc1]

# ---------- check 1: independent DE440 libration evaluation (no SPICE)
def de440_librations():
    hdr = raw('de440-header.440', 'txt')
    if 'KSIZE= 2036    NCOEFF= 1018' not in hdr or 'JPL Planetary Ephemeris DE440/LE440' not in hdr: raise SystemExit('header.440: unexpected')
    g = hdr[hdr.index('GROUP   1050'):].split('\n')
    start, ncf, nsub = (list(map(int, g[k].split())) for k in (2, 3, 4))
    lib = (start[12], ncf[12], nsub[12])          # 13th quantity: lunar libration angles (phi, theta, psi), radians
    if lib != (899, 10, 4): raise SystemExit(f'header.440: libration pointer {lib}')
    rec = raw('de440-ascp01950-rec874.txt', 'txt').split()
    if rec[:2] != ['874', '1018']: raise SystemExit('DE440 record: unexpected header')
    c = [float(x.replace('D', 'E')) for x in rec[2:]]
    if len(c) != 1018 or c[0] != 2461200.5 or c[1] != 2461232.5: raise SystemExit('DE440 record: unexpected span')
    def angles(jd_tdb):
        span = (c[1] - c[0]) / lib[2]; k = min(lib[2] - 1, int((jd_tdb - c[0]) // span))
        x = 2 * (jd_tdb - (c[0] + k * span)) / span - 1
        out = []
        for comp in range(3):
            o = lib[0] - 1 + (k * 3 + comp) * lib[1]; coef = c[o:o + lib[1]]
            t0, t1, s = 1.0, x, coef[0] + coef[1] * x
            for a in coef[2:]: t0, t1 = t1, 2 * x * t1 - t0; s += a * t1
            out.append(s)
        return out
    return angles

def tk_angles():
    t = raw('moon_de440_250416.tf', 'txt')
    m = re.search(r"TKFRAME_31009_ANGLES\s*=\s*\(\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\)", t)
    ax = re.search(r"TKFRAME_31009_AXES\s*=\s*\(\s*(\d),\s*(\d),\s*(\d)\s*\)", t)
    if not m or not ax or "TKFRAME_31009_UNITS           = 'ARCSECONDS'" not in t: raise SystemExit('frame kernel: 31009 angles not found')
    return [float(v) for v in m.groups()], [int(v) for v in ax.groups()]

def independent(et, angles, offs):
    phi, theta, psi = angles(2451545.0 + et / 86400.0)
    icrf_to_pa = mm(frot(3, psi), mm(frot(1, theta), frot(3, phi)))          # DE libration Euler angles, 3-1-3
    (a1, a2, a3), (x1, x2, x3) = offs
    k = math.pi / 180 / 3600
    # SPICE frames convention for TKFRAME ANGLES: M = [a3]x3 [a2]x2 [a1]x1 maps vectors from the defined frame (ME) to the
    # relative frame (PA); PA → ME is its transpose. The opposite reading misses by about 0.058° and fails both checks.
    me_to_pa = mm(frot(x3, a3 * k), mm(frot(x2, a2 * k), frot(x1, a1 * k)))
    return mm(tr(me_to_pa), icrf_to_pa)

# ---------- check 2: Horizons
def horizons_rows():
    t = raw('horizons-moon-from-lro-q14-20260610.txt', 'txt')
    for need in ('API VERSION: 1.2', 'Target body name: Moon (301)', 'Center body name: LRO (spacecraft) (-85)', 'Target pole/equ : MOON_ME                         {East-longitude positive}',
                 'Target radii    : 1737.4, 1737.4, 1737.4 km'):
        if need not in t: raise SystemExit(f'Horizons q14: header lacks "{need}"')
    rows = re.findall(r'^ 2026-Jun-(\d\d) (\d\d):00:00\.000\s+([\d.]+)\s+([-\d.]+)\s', t[t.index('$$SOE'):t.index('$$EOE')], re.M)
    rows = [((int(d) - 10) * 1440 + int(h) * 60, float(lo), float(la)) for d, h, lo, la in rows]
    v = raw('horizons-moon-ssb-vectors-20260610.txt', 'txt')
    for need in ('API VERSION: 1.2', 'Target body name: Moon (301)', 'Center body name: Solar System Barycenter (0)', 'Reference frame : ICRF'):
        if need not in v: raise SystemExit(f'Horizons vectors: header lacks "{need}"')
    vel = [[float(a), float(b), float(c)] for a, b, c in re.findall(r'VX=\s*(\S+)\s+VY=\s*(\S+)\s+VZ=\s*(\S+)', v[v.index('$$SOE'):v.index('$$EOE')])]
    if [r[0] for r in rows] != [0, 360, 720, 1080, 1440] or len(vel) != 5: raise SystemExit('Horizons: expected five epochs')
    src = re.search(r'Target body name: Moon \(301\)\s+\{source: (\w+)\}', t).group(1)
    return rows, vel, src

def dump(o): return (json.dumps(o, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')
def r3(v, nd=3): return [round(c, nd) for c in v]

def build():
    states = lro_states(); n = len(states)
    mats, toolkit, utc_span = spice_rotations(states)
    me = [mv(m, r) for m, (r, v, et) in zip(mats, states)]
    worst_norm = max(abs(norm(q) - norm(r)) for q, (r, _, _) in zip(me, states))
    if worst_norm > CEIL['norm_km']: raise SystemExit(f'radius not preserved: {worst_norm} km')
    ll = [latlon(q) for q in me]
    # samples for the independent check: the proposal's five times, the polar passes and the seam crossings nearest them
    pick = [0, 360, 720, 1080, 1440]
    north = max(range(n), key=lambda i: ll[i][0]); south = min(range(n), key=lambda i: ll[i][0])
    seam = [i for i in range(1, n) if abs(ll[i][1] - ll[i - 1][1]) > 180]
    pick = sorted(set(pick + [north, south] + seam[:2]))
    angles = de440_librations(); offs = tk_angles()
    ind = []
    for i in pick:
        r, _, et = states[i]; mi = independent(et, angles, offs); qi = mv(mi, r)
        ind.append({'sample': i, 'utc_minute': i, 'tdb_s': et, 'spice': [[round(c, 15) for c in row] for row in mats[i]], 'independent': [[round(c, 15) for c in row] for row in mi],
                    'rotation_angle_deg': rot_angle(mats[i], mi), 'position_diff_km': norm(sub(me[i], qi)),
                    'why': 'proposal epoch' if i in (0, 360, 720, 1080, 1440) else 'northernmost' if i == north else 'southernmost' if i == south else 'longitude seam crossing'})
    worst_rot = max(x['rotation_angle_deg'] for x in ind); worst_pos = max(x['position_diff_km'] for x in ind)
    if worst_rot > CEIL['rotation_deg'] or worst_pos > CEIL['position_km']: raise SystemExit(f'independent rotation check failed: {worst_rot}° / {worst_pos} km')
    # Horizons
    rows, vel, hz_src = horizons_rows(); hz = []
    for (i, lo, la), vm in zip(rows, vel):
        r, vl, et = states[i]
        lt = norm(r) / C_KMS
        geo = [-c for c in r]
        ltc = [a - b * lt for a, b in zip(geo, vm)]          # Moon at t − lt, both bodies referenced to the solar-system barycentre
        import spiceypy as sp                                   # rotation at t − lt from the same pinned kernels
        m_lt = spice_rotation_at(et - lt)
        sub_geo = mv(mats[i], r); sub_lt = mv(m_lt, [-c for c in ltc])
        u = [math.cos(math.radians(la)) * math.cos(math.radians(lo)), math.cos(math.radians(la)) * math.sin(math.radians(lo)), math.sin(math.radians(la))]
        hz.append({'utc_minute': i, 'horizons_lon_deg': lo, 'horizons_lat_deg': la, 'light_time_s': lt,
                   'ours_lon_lat_deg_light_time': [round(latlon(sub_lt)[1] % 360, 6), round(latlon(sub_lt)[0], 6)],
                   'separation_deg_light_time': ang(sub_lt, u), 'separation_deg_geometric': ang(sub_geo, u)})
    worst_hz = max(x['separation_deg_light_time'] for x in hz)
    if worst_hz > CEIL['horizons_deg']: raise SystemExit(f'Horizons check failed: {worst_hz}°')
    # chords
    def seg_min(a, b):
        d = sub(b, a); t = max(0.0, min(1.0, -dot(a, d) / dot(d, d))); return norm([x + t * y for x, y in zip(a, d)])
    chord = min(seg_min(me[i], me[i + 1]) for i in range(n - 1)) - MOON_R_KM
    sample_alt = min(norm(q) for q in me) - MOON_R_KM
    if chord <= 0: raise SystemExit('a chord dips below the sphere')
    xyz = [c for q in me for c in r3(q)]
    alts = [norm(q) - MOON_R_KM for q in me]
    cat = {
        'schema': 1, 'catalogue': 'skycraft-moonfixed', 'catalogue_revision': 'craft-moon-me-2026-06-R1', 'kind': 'dated example', 'body': 'moon',
        'derived_from': R1_PIN, 'mission': {'id': 'lro', 'name': 'Lunar Reconnaissance Orbiter', 'naif_id': -85},
        'time': {'standard': 'UTC', 'start': '2026-06-10T00:00:00Z', 'end': '2026-06-11T00:00:00Z', 'step_s': 60, 'n': n, 'default': '2026-06-10T12:00:00Z',
                 'note': 'The same native states and times as craft-moon-2026-06-R1. Each state is rotated at its own SPK epoch (TDB).'},
        'frame': {'name': FRAME, 'alias': 'MOON_ME', 'centre': 'Moon (301)', 'units': 'km',
                  'description': 'Lunar mean Earth / polar axis frame realised from DE440, closely aligned with the DE421 mean Earth frame (NAIF moon_de440_250416.tf). +z mean rotation axis (north), x toward the mean Earth direction (0° longitude), longitude east-positive.',
                  'from': 'J2000 (SPICE frame 1), as in the source segment', 'method': 'NAIF SPICE pxform, one rotation per state; centre and radius unchanged'},
        'body_radius_km': MOON_R_KM, 'altitude_reference': 'above a sphere of radius 1,737.4 km (not terrain)',
        'summary': {'altitude_km': {'min': round(min(alts), 3), 'max': round(max(alts), 3)}, 'min_chord_altitude_km': round(chord, 3)},
        'credit': 'Calculated position · NASA/GSFC FDF definitive trajectory (NASA PDS) · Moon orientation: JPL DE440 via NAIF',
        'modifications': 'Rotated into the Moon-fixed frame; positions rounded to 0.001 km. Velocities not carried.',
        'xyz_km': xyz,
    }
    cat_bytes = dump(cat)
    checks = {
        'what': 'Checks run by build_moonfixed.py for craft-moon-me-2026-06-R1 (MOON-LRO-DATED-PATH-PROPOSAL rev 2, "Evidence before release").',
        'ceilings': CEIL, 'toolkit': toolkit, 'spiceypy': '8.0.0', 'first_last_state_utc': utc_span,
        'radius_preserved_worst_km': worst_norm,
        'independent_rotation': {'method': 'DE440 lunar libration Euler angles (3-1-3: phi, theta, psi) evaluated from ascp01950.440 record 874 by this script\'s own Chebyshev evaluator; rotation built with its own matrices; then the fixed PA → ME offset from moon_de440_250416.tf (frame 31009, angles in arcseconds, axes 3-2-1). No SPICE call.',
                                 'offset_angles_arcsec': offs[0], 'offset_axes': offs[1], 'worst_rotation_deg': worst_rot, 'worst_position_km': worst_pos, 'samples': ind},
        'horizons': {'request': 'target 301, CENTER 500@-85, EPHEM_TYPE OBSERVER, QUANTITIES 14,20, five UTC times; and target 301 vectors from 500@0 (ICRF, geometric) for the Moon\'s barycentric velocity',
                     'header': 'Target pole/equ : MOON_ME {East-longitude positive}; target radii 1737.4 × 3 (a sphere, so planetodetic = planetocentric)',
                     'target_source': hz_src, 'correction': 'Horizons gives apparent sub-observer points with down-leg light time. Ours: Moon centre at t − lt (barycentric), orientation at t − lt. Without it the residual is 0.004–0.0055°; with it, the figures below.',
                     'worst_separation_deg': worst_hz, 'rows': hz},
        'chords': {'min_sample_altitude_km': sample_alt, 'min_chord_altitude_km': chord, 'segments': n - 1},
    }
    chk_bytes = (json.dumps(checks, indent=1) + '\n').encode()
    record = {'generator': 'phase1/skycraft/build_moonfixed.py', 'raw': PINS, 'bpc': BPC, 'sources': SOURCES, 'retrieved': RETRIEVED,
              'toolkit': {'spiceypy': '8.0.0', 'cspice': toolkit}, 'frame': FRAME,
              'outputs': {'catalogue': {'file': 'assets/moon/craft-moon-me-2026-06-R1.json', 'bytes': len(cat_bytes), 'sha256': hashlib.sha256(cat_bytes).hexdigest()},
                          'checks': {'file': 'phase1/skycraft/checks/moonfixed-checks.json', 'bytes': len(chk_bytes), 'sha256': hashlib.sha256(chk_bytes).hexdigest()}}}
    return {OUT_CAT: cat_bytes, OUT_CHK: chk_bytes, OUT_BUILD: (json.dumps(record, indent=1) + '\n').encode()}, checks

_SP = {}
def spice_rotation_at(et):
    """One more pxform at an arbitrary epoch inside the held records (Horizons comparison at t − lt)."""
    import spiceypy as sp
    buf = bytearray(b'\xff' * BPC['bytes'])
    for name, off in BPC['ranges']: piece = raw(name); buf[off:off + len(piece)] = piece
    with tempfile.TemporaryDirectory() as tmp:
        for name, data in (('moon_pa_de440_200625.bpc', bytes(buf)), ('moon_de440_250416.tf', raw('moon_de440_250416.tf'))):
            p = os.path.join(tmp, name); open(p, 'wb').write(data); sp.furnsh(p)
        m = [list(row) for row in sp.pxform('J2000', FRAME, et)]; sp.kclear()
    if not all(math.isfinite(c) for row in m for c in row): raise SystemExit('rotation at t − lt is not finite')
    return m

def main():
    files, checks = build()
    if '--check' in sys.argv:
        bad = [p for p, v in files.items() if not os.path.exists(p) or open(p, 'rb').read() != v]
        if bad: raise SystemExit('differs from a fresh build: ' + ', '.join(os.path.relpath(p, ROOT) for p in bad))
        print('check ok'); return
    for p, v in files.items(): os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(v)
    print('independent: worst %.2e° / %.2e km' % (checks['independent_rotation']['worst_rotation_deg'], checks['independent_rotation']['worst_position_km']))
    print('horizons: worst %.2e° (geometric %.4f°)' % (checks['horizons']['worst_separation_deg'], max(r['separation_deg_geometric'] for r in checks['horizons']['rows'])))
    print('chords: min %.3f km (samples %.3f km)' % (checks['chords']['min_chord_altitude_km'], checks['chords']['min_sample_altitude_km']))
    for p, v in files.items(): print(os.path.relpath(p, ROOT), len(v), hashlib.sha256(v).hexdigest())

if __name__ == '__main__': main()
