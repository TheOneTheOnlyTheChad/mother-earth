#!/usr/bin/env python3
"""Mother Earth — Moon and Sun spacecraft: the two DATED EXAMPLE catalogues (MOON-AND-SUN-BUILD-PROPOSAL rev 2.1).

  craft-moon-2026-06-R1  Lunar Reconnaissance Orbiter, 10 June 2026 00:00 – 11 June 00:00 UTC, the kernel's own 60 s states
                         (PDS definitive SPK lrorg_2026074_2026166_v01.bsp, segment 894101–904203; no interpolation).
  craft-sun-2024-12-R1   Parker Solar Probe, 22 Dec 2024 00:00 – 27 Dec 00:00 UTC, every 10 minutes (NASA/JPL Horizons).

Inputs are the archived source bytes in raw/ (hash-pinned below). Output is deterministic: no clock, no network.
  python3 phase1/skycraft/build_examples.py            write catalogue/*.json and BUILD.json
  python3 phase1/skycraft/build_examples.py --check    rebuild in memory and compare with the files on disk
Standard library only.
"""
import hashlib, json, math, os, struct, sys
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw')
OUT = os.path.join(HERE, 'catalogue')

PINS = {
    'lrorg_2026074_2026166_v01.seg-894101-904203.bin': '7fb04d7e131e1c8c4b3fbe2d1b8fc36cb535ac262824aa700bdf6a5009b693f9',
    'horizons-lro-check-20260610.json': '742815ba63bc661d05f313e8be87da244bf9ff73b67ba8373c215944aa7e56aa',
    'horizons-psp-20241222-20241227-10m.json': '41eb0494899db4720a6d88a94fd14c0c3dbbf40bb444f48f3be3d9bd7a797748',
    'spdf-psp-helio1hr-20241224T10-14.csv': '2b5fc56ba303ee399bd702144d344ea49bcb23cf1e267ee0a656e14818749404',
    'spdf-psp-helio1hr-20241222-20241226-edges.csv': '5c10532a2db1af84a42171148b5e150676a0b1f94f528a1ffaef12f7368d449c',
}
LRO_KERNEL = {'file': 'lrorg_2026074_2026166_v01.bsp', 'bytes': 7557120,
              'sha256': '5e17414e03c794e9dc29e4f4fde64d1d2d9fd106d87f26404188888495de28b1',
              'url': 'https://naif.jpl.nasa.gov/pub/naif/pds/data/lro-l-spice-6-v1.0/lrosp_1000/data/spk/lrorg_2026074_2026166_v01.bsp',
              'segment': {'index': 88, 'of': 92, 'type': 13, 'target': -85, 'center': 301, 'frame': 1, 'first_word': 894101, 'last_word': 904203}}
RETRIEVED = {'lro_kernel': '2026-11-13T07:11:37Z', 'horizons_lro': '2026-11-13T07:12:13Z', 'horizons_psp': '2026-11-13T07:12:15Z', 'spdf': '2026-11-13T07:13:03Z'}
MOON_R_KM, SUN_R_KM, AU_KM = 1737.4, 695700.0, 149597870.7
J2000 = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
MON = {m: i + 1 for i, m in enumerate('Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split())}

def raw(name):
    b = open(os.path.join(RAW, name), 'rb').read()
    got = hashlib.sha256(b).hexdigest()
    if got != PINS[name]: raise SystemExit(f'raw/{name}: sha256 {got} is not the pinned {PINS[name]}')
    return b
def iso(dt): return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
def unit(v): n = math.sqrt(sum(c * c for c in v)); return [c / n for c in v]
def cross(a, b): return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
def dot(a, b): return sum(x * y for x, y in zip(a, b))
def radec(ra, dec): ra, dec = math.radians(ra), math.radians(dec); return [math.cos(dec) * math.cos(ra), math.cos(dec) * math.sin(ra), math.sin(dec)]
def r12(m): return [[round(c, 12) for c in row] for row in m]

def tdb_minus_utc(dt, leap=37):
    """TDB − UTC in seconds: leap seconds + 32.184 + the main periodic terms (enough to check the kernel's epochs to 0.1 ms)."""
    d = (dt - J2000).total_seconds() / 86400.0
    g = math.radians(357.53 + 0.9856003 * d)
    return leap + 32.184 + 0.001657 * math.sin(g) + 0.000014 * math.sin(2 * g)

def horizons(name):
    """Parse a Horizons JSON vector response: API version, target source tag, data-sheet statement, trajectory table, rows."""
    j = json.loads(raw(name)); t = j['result']
    if j['signature']['version'] != '1.2': raise SystemExit('Horizons API version is not 1.2: ' + j['signature']['version'])
    for need in ('Reference frame : ICRF', 'Output units    : KM-S', 'Output type     : GEOMETRIC cartesian states'):
        if need not in t: raise SystemExit(f'{name}: header lacks "{need}"')
    body = t[t.index('$$SOE') + 5:t.index('$$EOE')].strip().split('\n')
    rows = []
    for i in range(0, len(body), 3):
        d = body[i].split('A.D. ')[1].split()   # 2024-Dec-22 00:00:00.0000 UTC
        y, mo, da = d[0].split('-'); hh, mm, ss = d[1].split(':')
        if d[2] != 'UTC' or float(ss) != 0: raise SystemExit('unexpected epoch line: ' + body[i])
        when = datetime(int(y), MON[mo], int(da), int(hh), int(mm), tzinfo=timezone.utc)
        num = lambda line: [float(x) for x in line.replace('VX=', ' ').replace('VY=', ' ').replace('VZ=', ' ').replace('X =', ' ').replace('Y =', ' ').replace('Z =', ' ').split()]
        rows.append((when, num(body[i + 1]), num(body[i + 2])))
    tgt = [l for l in t.split('\n') if l.startswith('Target body name:')][0]
    ctr = [l for l in t.split('\n') if l.startswith('Center body name:')][0]
    revised = [l for l in t.split('\n') if l.strip().startswith('Revised:')][0].strip()
    k = t.index('SPACECRAFT TRAJECTORY'); sheet = t[k:t.index('*****', k)].rstrip()
    return {'version': j['signature']['version'], 'target': ' '.join(tgt.split()), 'center': ' '.join(ctr.split()), 'revised': ' '.join(revised.split()), 'trajectory_block': sheet, 'rows': rows}

def build_moon():
    b = raw('lrorg_2026074_2026166_v01.seg-894101-904203.bin')
    d = struct.unpack('>%dd' % (len(b) // 8), b)
    n = int(d[-1])
    if n != 1441 or len(d) != 6 * n + n + (n - 1) // 100 + 2: raise SystemExit('LRO segment: unexpected type 13 layout')
    start = datetime(2026, 6, 10, tzinfo=timezone.utc)
    xyz, worst = [], 0.0
    for i in range(n):
        when = start + timedelta(seconds=60 * i)
        et = (when - J2000).total_seconds() + tdb_minus_utc(when)
        off = d[6 * n + i] - et; worst = max(worst, abs(off))
        if abs(off) > 1e-4: raise SystemExit(f'LRO state {i}: kernel epoch is {off:+.6f} s from the UTC minute')
        xyz.append([d[6 * i], d[6 * i + 1], d[6 * i + 2]])
    vel = [[d[6 * i + 3], d[6 * i + 4], d[6 * i + 5]] for i in range(n)]
    # view: face-on to the orbit plane (toward the viewer = mean orbit normal r × v over the day); lunar north up
    nsum = [0, 0, 0]
    for r, v in zip(xyz, vel):
        h = unit(cross(r, v)); nsum = [a + c for a, c in zip(nsum, h)]
    depth = unit(nsum)
    pole = radec(269.9949, 66.5392)   # IAU mean lunar pole at J2000 (time-dependent terms omitted)
    up = unit([p - dot(pole, depth) * dz for p, dz in zip(pole, depth)])
    right = cross(up, depth)
    tilt = max(math.degrees(math.acos(max(-1, min(1, dot(unit(cross(r, v)), depth))))) for r, v in zip(xyz, vel))
    # three-point check against a fresh Horizons evaluation (rev 1: 11:45, 12:00, 12:15 UTC)
    hz = horizons('horizons-lro-check-20260610.json'); checks = []
    for when, p, v in hz['rows']:
        i = int((when - start).total_seconds() // 60)
        dp = [a - c for a, c in zip(xyz[i], p)]
        checks.append({'utc': iso(when), 'kernel_km': [round(c, 6) for c in xyz[i]], 'horizons_km': p, 'difference_m': round(1000 * math.sqrt(dot(dp, dp)), 3)})
    radii = [math.sqrt(dot(r, r)) for r in xyz]
    cat = {
        'schema': 1, 'catalogue': 'skycraft', 'catalogue_revision': 'craft-moon-2026-06-R1', 'kind': 'dated example', 'body': 'moon',
        'mission': {'id': 'lro', 'name': 'Lunar Reconnaissance Orbiter', 'naif_id': -85},
        'time': {'standard': 'UTC', 'start': iso(start), 'end': iso(start + timedelta(days=1)), 'step_s': 60, 'n': n, 'default': '2026-06-10T12:00:00Z',
                 'note': 'Sample times are the kernel\'s own state epochs. Each is within 0.1 ms of the UTC minute shown (largest offset %.6f s, using 37 leap seconds and the main periodic terms of TDB − TT).' % worst},
        'frame': {'native': 'J2000 (SPICE frame 1), Moon-centred, geometric states', 'units': 'km',
                  'view': {'rows': r12([right, up, depth]), 'row_meaning': ['screen right', 'screen up', 'toward the viewer'],
                           'description': 'Viewed face-on to LRO\'s orbit plane on this day; lunar north is up.',
                           'derivation': 'Toward the viewer = mean of r × v over the 1,441 states (largest angle between any single state\'s orbit normal and it: %.3f°). Up = the IAU mean lunar pole at J2000 (RA 269.9949°, Dec 66.5392°; time-dependent terms omitted) with its component along the viewing axis removed.' % tilt}},
        'body_radius_km': MOON_R_KM, 'body_radius_source': 'NASA/JPL Horizons Moon data sheet: "Radius (IAU), km = 1737.4"',
        'classification': {'label': 'Definitive trajectory', 'provider_words': 'Merged SPICE SPK file containing Regular Definitive LRO Spacecraft trajectory.', 'product_version_type': 'ACTUAL', 'source': 'PDS label lrorg_2026074_2026166_v01.lbl'},
        'source': {'provider': 'NASA/GSFC Flight Dynamics Facility', 'archive': 'NASA PDS, data set LRO-L-SPICE-6-V1.0 (NAIF)', 'product': LRO_KERNEL['file'], 'revision': 'v01',
                   'product_creation_time': '2026-09-03T13:42:31', 'label_span': ['2026-03-15T00:00:00', '2026-06-15T00:00:00'], 'url': LRO_KERNEL['url'],
                   'file_bytes': LRO_KERNEL['bytes'], 'file_sha256': LRO_KERNEL['sha256'], 'segment': LRO_KERNEL['segment'],
                   'segment_bytes': len(b), 'segment_sha256': PINS['lrorg_2026074_2026166_v01.seg-894101-904203.bin'], 'retrieved_at': RETRIEVED['lro_kernel'],
                   'dependencies': 'None for these values: the segment\'s stored states are used as written (SPK type 13, read directly; no interpolation, no other kernel).'},
        'credit': 'Calculated position · NASA/GSFC FDF definitive trajectory (NASA PDS)',
        'checks': {'what': 'Kernel states compared with a fresh NASA/JPL Horizons evaluation (target source tag: %s) at three times.' % hz['target'].split('{')[1].rstrip('}'),
                   'horizons_retrieved_at': RETRIEVED['horizons_lro'], 'horizons_response_sha256': PINS['horizons-lro-check-20260610.json'], 'points': checks},
        'summary': {'centre_distance_km': {'min': round(min(radii), 3), 'max': round(max(radii), 3)}, 'altitude_km': {'min': round(min(radii) - MOON_R_KM, 3), 'max': round(max(radii) - MOON_R_KM, 3)}},
        'modifications': 'Positions rounded to 0.001 km. Velocities not carried.',
        'xyz_km': [round(c, 3) for r in xyz for c in r],
    }
    return cat

def build_sun():
    hz = horizons('horizons-psp-20241222-20241227-10m.json'); rows = hz['rows']
    start = datetime(2024, 12, 22, tzinfo=timezone.utc)
    if len(rows) != 721: raise SystemExit('Parker example: expected 721 rows')
    for i, (when, _, _) in enumerate(rows):
        if when != start + timedelta(minutes=10 * i): raise SystemExit(f'Parker row {i}: epoch {when} is not on the 10-minute grid')
    xyz = [p for _, p, _ in rows]
    # view: looking down on the Sun's equator from its north pole; screen right = ascending node of the solar equator on the J2000 ecliptic
    z = radec(286.13, 63.87)                                   # IAU solar north pole
    eps = math.radians(23.4392911); ecl = [0.0, -math.sin(eps), math.cos(eps)]   # J2000 ecliptic north pole in ICRF axes
    x = unit(cross(ecl, z)); y = cross(z, x)
    radii = [math.sqrt(dot(r, r)) for r in xyz]; k = min(range(len(radii)), key=lambda i: radii[i])
    # cross-product check against the SPDF hourly product at 11:00, 12:00, 13:00 UTC on 24 Dec 2024 (same frame, same units)
    spdf = {}
    for name in ('spdf-psp-helio1hr-20241224T10-14.csv', 'spdf-psp-helio1hr-20241222-20241226-edges.csv'):
        for line in raw(name).decode().split('\r\n'):
            if line: f = line.split(','); spdf[f[0][:19] + 'Z'] = {'rad_au': float(f[1]), 'hgi_lat': float(f[6]), 'hgi_lon': float(f[7])}
    checks = []
    for da, hh in ((24, 11), (24, 12), (24, 13), (22, 0), (22, 1), (22, 2), (26, 21), (26, 22), (26, 23)):
        when = datetime(2024, 12, da, hh, tzinfo=timezone.utc); i = int((when - start).total_seconds() // 600); r = xyz[i]
        lat = math.degrees(math.asin(dot(r, z) / radii[i])); lon = math.degrees(math.atan2(dot(r, y), dot(r, x))) % 360; s = spdf[iso(when)]
        checks.append({'utc': iso(when), 'horizons': {'rad_au': round(radii[i] / AU_KM, 6), 'hgi_lat_deg': round(lat, 4), 'hgi_lon_deg': round(lon, 4)},
                       'spdf': s, 'difference': {'rad_au': round(radii[i] / AU_KM - s['rad_au'], 6), 'hgi_lat_deg': round(lat - s['hgi_lat'], 4), 'hgi_lon_deg': round(lon - s['hgi_lon'], 4)}})
    cat = {
        'schema': 1, 'catalogue': 'skycraft', 'catalogue_revision': 'craft-sun-2024-12-R1', 'kind': 'dated example', 'body': 'sun',
        'mission': {'id': 'psp', 'name': 'Parker Solar Probe', 'naif_id': -96},
        'time': {'standard': 'UTC', 'start': iso(start), 'end': iso(start + timedelta(days=5)), 'step_s': 600, 'n': 721, 'default': '2024-12-24T12:00:00Z',
                 'note': 'Sampled every 10 minutes; times as requested from Horizons (TIME_TYPE UT) and checked row by row.'},
        'frame': {'native': 'ICRF, Sun-centred, geometric states (NASA/JPL Horizons)', 'units': 'km',
                  'view': {'rows': r12([x, y, z]), 'row_meaning': ['screen right', 'screen up', 'toward the viewer'],
                           'description': 'Viewed from above the Sun\'s north pole, looking down on its equator.',
                           'derivation': 'Our rotation from ICRF: toward the viewer = the IAU solar north pole (RA 286.13°, Dec 63.87°); screen right = the ascending node of the solar equator on the J2000 ecliptic (obliquity 23.4392911°). These are Heliographic Inertial axes as we compute them.'}},
        'body_radius_km': SUN_R_KM, 'body_radius_source': 'NASA/JPL Horizons Sun data sheet: "Solar radius (IAU2015)= 695700 km"',
        'classification': {'label': 'Within the tracking-data fit', 'provider_words': 'Fit to post-launch tracking data through 2026-Sep-29. Reference planning trajectory for subsequent times.',
                           'segment': 'spp_nom_20180812_20251001_v041_RO8', 'source': 'NASA/JPL Horizons data sheet for -96 (%s), same response as the vectors' % hz['revised']},
        'source': {'provider': 'NASA/JPL Solar System Dynamics (Horizons)', 'api_version': hz['version'], 'target': hz['target'], 'center': hz['center'],
                   'data_sheet': hz['revised'], 'trajectory_block': hz['trajectory_block'], 'response_bytes': len(raw('horizons-psp-20241222-20241227-10m.json')),
                   'response_sha256': PINS['horizons-psp-20241222-20241227-10m.json'], 'retrieved_at': RETRIEVED['horizons_psp'], 'url': 'https://ssd.jpl.nasa.gov/horizons/',
                   'request': "COMMAND='-96' CENTER='500@10' EPHEM_TYPE='VECTORS' REF_PLANE='FRAME' REF_SYSTEM='ICRF' VEC_CORR='NONE' TIME_TYPE='UT' OUT_UNITS='KM-S' START_TIME='2024-12-22 00:00' STOP_TIME='2024-12-27 00:00' STEP_SIZE='10 m' OBJ_DATA='YES'"},
        'credit': 'Calculated position · NASA/JPL Horizons',
        'closest_sample': {'utc': iso(rows[k][0]), 'centre_distance_km': round(radii[k]), 'above_nominal_surface_km': round(radii[k] - SUN_R_KM),
                           'note': 'The closest of this snapshot\'s 10-minute samples. A sampled series cannot give the exact time or distance of the minimum.'},
        'reported_closest_approach': {'text': 'about 3.8 million miles (6.1 million km) above the Sun\'s surface on 24 December 2024', 'attributed_to': 'NASA',
                                      'url': 'https://science.nasa.gov/science-research/heliophysics/nasas-parker-solar-probe-makes-history-with-closest-pass-to-sun/'},
        'checks': {'what': 'Cross-product check: Horizons vectors, rotated by us to Heliographic Inertial axes, compared with the NASA/GSFC SPDF hourly product PSP_HELIO1HR_POSITION (DOI 10.48322/ecnj-rx61). Not an independent check: whether the two share an upstream trajectory solution is not known.',
                   'finding': 'Centre distance agrees within the SPDF rounding at the three named hours. Heliographic Inertial longitude differs by about 0.85° near closest approach and about 0.08° two days either side; latitude by up to 0.03°. The pattern is what a timing difference of roughly 8 to 10 minutes along the path plus a small constant axis difference would give. Cause not established; the two products are not assumed to share a trajectory solution.',
                   'spdf_precision': 'RAD_AU to 0.0001 au (about 15,000 km); angles to 0.001°', 'spdf_retrieved_at': RETRIEVED['spdf'], 'spdf_rows_sha256': [PINS['spdf-psp-helio1hr-20241224T10-14.csv'], PINS['spdf-psp-helio1hr-20241222-20241226-edges.csv']], 'points': checks},
        'summary': {'centre_distance_km': {'min': round(min(radii)), 'max': round(max(radii))}},
        'modifications': 'Positions rounded to 1 km. Velocities not carried.',
        'xyz_km': [round(c) for r in xyz for c in r],
    }
    return cat

def dump(o): return (json.dumps(o, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')

def main():
    built = {c['catalogue_revision']: dump(c) for c in (build_moon(), build_sun())}
    record = {'generator': 'phase1/skycraft/build_examples.py', 'raw': PINS, 'catalogues': {k: {'file': f'catalogue/{k}.json', 'bytes': len(v), 'sha256': hashlib.sha256(v).hexdigest()} for k, v in built.items()}}
    rec = (json.dumps(record, indent=1) + '\n').encode()
    files = {os.path.join(OUT, k + '.json'): v for k, v in built.items()}; files[os.path.join(HERE, 'BUILD.json')] = rec
    if '--check' in sys.argv:
        bad = [p for p, v in files.items() if not os.path.exists(p) or open(p, 'rb').read() != v]
        if bad: raise SystemExit('differs from a fresh build: ' + ', '.join(os.path.relpath(p, HERE) for p in bad))
        print('check ok:', ', '.join(f"{k} {r['sha256'][:12]}… {r['bytes']} B" for k, r in record['catalogues'].items())); return
    os.makedirs(OUT, exist_ok=True)
    for p, v in files.items(): open(p, 'wb').write(v)
    for k, r in record['catalogues'].items(): print(k, r['bytes'], r['sha256'])

if __name__ == '__main__': main()
