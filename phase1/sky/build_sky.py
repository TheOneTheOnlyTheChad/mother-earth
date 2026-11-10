#!/usr/bin/env python3
"""Sky on Two Clocks — catalogue generator (SKY-TWO-CLOCKS-PROPOSAL rev 3 §3, §5; source record SKY-SOURCE-CHECK rev 2).

Reads the raw NASA/JPL Horizons text exports (GET API, VECTORS, labelled text, TIME_TYPE='UT') for the Moon and the
Sun, plus the route-1 cross-check (File API, our own TDB epochs), validates every fact the proposal requires, and
writes one catalogue JSON. Nothing is fetched here: the exports are taken by hand (proposal §5.1).

Usage:
  python3 phase1/sky/build_sky.py                 # regenerate catalogue/<rev>.json and BUILD.json
  python3 phase1/sky/build_sky.py --check         # regenerate in memory and compare byte for byte with the committed files
  --generated-at 2026-11-10T09:00:00Z             # pins the bytes (default: the value already in BUILD.json)

Any failed check raises SkyError and writes nothing.
"""
import argparse, datetime as dt, hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REV = 'sky-2026-11-R1'
START, END = dt.date(2026, 6, 1), dt.date(2027, 12, 31)
N = (END - START).days + 1                     # 579
PINS = {'get': 'API VERSION: 1.2', 'file': 'API VERSION: 1.0'}   # rev 3 §3.3 — separate pins
RAW = {
    'moon': ('raw/hz-moon-ut-20261110.txt', '301', 'Moon (301)'),
    'sun': ('raw/hz-sun-ut-20261110.txt', '10', 'Sun (10)'),
}
CROSS = 'raw/hz-moon-tdb-crosscheck-20261110.txt'
CROSS_EPOCHS = 'raw/crosscheck-epochs.json'
CROSS_MAX_M = 1.0          # route-1 vs route-2 range agreement tolerance (first export: 0.166 m)
RETRIEVED = {'moon': '2026-11-10T08:41:13.097Z', 'sun': '2026-11-10T08:41:36.425Z', 'cross': '2026-11-10T08:41:50.780Z'}
URL = ("https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='{c}'&OBJ_DATA='NO'&MAKE_EPHEM='YES'&EPHEM_TYPE='VECTORS'"
       "&CENTER='500%40399'&REF_PLANE='FRAME'&REF_SYSTEM='ICRF'&VEC_TABLE='3'&VEC_CORR='NONE'&OUT_UNITS='KM-S'&CSV_FORMAT='NO'"
       "&TIME_TYPE='UT'&START_TIME='2026-06-01'&STOP_TIME='2027-12-31'&STEP_SIZE='1%20d'")
ROW = re.compile(r'(\d+\.\d+) = A\.D\. (\d{4}-\w{3}-\d{2}) (\d\d:\d\d:\d\d\.\d+) (\S+)\s*\n'
                 r'\s*X =.*\n\s*VX=.*\n\s*LT=\s*(\S+)\s+RG=\s*(\S+)\s+RR=\s*(\S+)')


class SkyError(Exception):
    pass


def need(cond, msg):
    if not cond:
        raise SkyError(msg)


def header(t, key):
    m = re.search(r'^' + re.escape(key) + r'\s*:\s*(.*)$', t, re.M)
    need(m, f'header line missing: {key}')
    return m.group(1).strip()


def parse_export(text, target_name, pin, scale_word):
    """Validate one raw Horizons vector export and return [(date, rg, rr, flag_or_scale)]."""
    need(text.split('\n', 1)[0].strip() == pin, f'API version is not "{pin}"')
    need(header(text, 'Target body name').startswith(target_name) and '{source: DE441}' in header(text, 'Target body name'), 'wrong target or ephemeris')
    need(header(text, 'Center body name').startswith('Earth (399)'), 'wrong centre body')
    need(header(text, 'Center-site name') == 'BODY CENTER', 'centre is not the body centre')
    need(header(text, 'Output type') == 'GEOMETRIC cartesian states', 'not geometric states')
    need(header(text, 'Output format').startswith('3 '), 'not vector table 3')
    need(header(text, 'Output units') == 'KM-S', 'units are not KM-S')
    need(header(text, 'Reference frame') == 'ICRF', 'frame is not ICRF')
    need(header(text, 'Start time').endswith(scale_word) and header(text, 'Stop  time').endswith(scale_word), f'time scale is not {scale_word}')
    need('$$SOE' in text and '$$EOE' in text, 'no ephemeris block')
    body = text[text.index('$$SOE') + 5:text.index('$$EOE')]
    rows = []
    for m in ROW.finditer(body):
        rows.append((dt.datetime.strptime(m.group(2), '%Y-%b-%d').date(), m.group(3), m.group(4), float(m.group(6)), float(m.group(7)), m.group(1)))
    blocks = body.count(' = A.D. ')
    need(blocks == len(rows), f'{blocks - len(rows)} record(s) without RG/RR fields')
    return rows


def build(generated_at):
    out = {}
    raws = {}
    for body, (path, cmd, name) in RAW.items():
        b = open(os.path.join(HERE, path), 'rb').read()
        raws[body] = (path, b)
        rows = parse_export(b.decode('utf-8'), name, PINS['get'], 'UT')
        rows = [r for r in rows if r[0] != dt.date(2028, 1, 1)]          # endpoint rule (none in the first export)
        need(len(rows) == N, f'{body}: {len(rows)} rows, expected {N}')
        need([r[0] for r in rows] == [START + dt.timedelta(i) for i in range(N)], f'{body}: dates not continuous {START}..{END}')
        need(all(r[1] == '00:00:00.0000' for r in rows), f'{body}: a row is not at 00:00:00')
        need(all(r[2] in ('UTC', 'UT~') for r in rows), f'{body}: unexpected time flag')
        out[body] = rows

    # route-1 cross-check (File API, our TDB epochs) — rev 3 §3.2
    cb = open(os.path.join(HERE, CROSS), 'rb').read()
    crows = parse_export(cb.decode('utf-8'), 'Moon (301)', PINS['file'], 'TDB')
    ep = json.load(open(os.path.join(HERE, CROSS_EPOCHS)))
    need(len(crows) == N and len(ep) == N, 'cross-check: row count')
    need(all(crows[i][5] == ep[i]['jd_tdb'] for i in range(N)), 'cross-check: an epoch was not echoed exactly')
    need(all(ep[i]['utc_date'] == out['moon'][i][0].isoformat() for i in range(N)), 'cross-check: epoch dates do not match')
    diffs = [abs(crows[i][3] - out['moon'][i][3]) * 1000 for i in range(N)]
    need(max(diffs) <= CROSS_MAX_M, f'cross-check: range differs by {max(diffs):.3f} m')

    flags = {b: {f: sum(r[2] == f for r in out[b]) for f in ('UTC', 'UT~')} for b in out}
    first_tilde = {b: next(r[0].isoformat() for r in out[b] if r[2] == 'UT~') for b in out}
    sha = lambda x: hashlib.sha256(x).hexdigest()
    cat = {
        'catalogue': 'sky',
        'catalogue_revision': REV,
        'generated_at': generated_at,
        'question': 'How far away are the Moon and Sun, and how does that change depending on the timescale?',
        'kind': 'calculated',
        'attribution': 'Calculated orbital distances · NASA/JPL Horizons',
        'quantity': 'geometric distance from the centre of the Earth to the centre of the body (km); range rate (km/s), positive = moving away',
        'sample_time': '00:00:00 UTC daily',
        'coverage': {'start': START.isoformat(), 'end': END.isoformat(), 'samples_per_body': N, 'refresh_by': '2027-06-01'},
        'direction_method': 'range_rate',
        'time': {
            'export_time_type': 'UT',
            'flags': {'UTC': 'Horizons labels the time UTC', 'UT~': 'Horizons holds the last known leap second constant (future leap seconds not yet known)'},
            'horizons_ut_tilde_from': first_tilde['moon'],
            'leap_second_source': 'IERS Bulletin C 72 (Paris, 06 July 2026): no leap second at the end of December 2026; UTC-TAI = -37 s',
            'utc_established_through': '2027-06-30',
            'first_date_affected_by_unresolved_leap_second': '2027-07-01',
        },
        'bodies': {
            b: {'target': RAW[b][1], 'name': RAW[b][2].split(' (')[0], 'fields': ['date', 'range_km', 'range_rate_kms', 'time_flag'],
                'rows': [[r[0].isoformat(), r[3], r[4], r[2]] for r in out[b]]}
            for b in ('moon', 'sun')
        },
        'provenance': {
            'source': 'NASA/JPL Horizons (Solar System Dynamics)',
            'ephemeris': 'DE441', 'centre': 'Earth (399), BODY CENTER', 'correction': 'NONE (geometric)', 'table': 'VECTORS table 3',
            'units': 'KM-S', 'frame': 'ICRF', 'api_version': PINS['get'],
            'request_method': "operator-triggered browser requests from the Claude desktop browser pane, default User-Agent (recorded in the research packet)",
            'exports': [{'body': b, 'url': URL.format(c=RAW[b][1]), 'retrieved': RETRIEVED[b], 'raw_file': RAW[b][0], 'raw_sha256': sha(raws[b][1]),
                         'rows': N, 'first': out[b][0][0].isoformat(), 'last': out[b][-1][0].isoformat(), 'flags': flags[b]} for b in ('moon', 'sun')],
            'crosscheck': {'route': 'File API, TIME_TYPE TDB, TLIST of our UTC->TDB epochs (one per line), CSV off', 'api_version': PINS['file'],
                           'raw_file': CROSS, 'raw_sha256': sha(cb), 'retrieved': RETRIEVED['cross'], 'epochs_echoed': N,
                           'max_range_diff_m': round(max(diffs), 3),
                           'note': 'agreement under the shared leap-second assumption; no timing bound claimed'},
            'citation': 'NASA/JPL Solar System Dynamics. Data retrieved on 2026 November 10. Horizons System (API). https://ssd.jpl.nasa.gov',
            'modifications': 'daily 00:00 UTC samples selected; range and range rate kept as exported; values rounded for display only',
            'register': 'REGISTER.md — NASA/JPL Horizons entry (filed 10 Nov 2026)',
            'research_record': 'docs/research/SKY-SOURCE-CHECK.md rev 2',
        },
    }
    data = (json.dumps(cat, ensure_ascii=False, indent=None, separators=(',', ':')) + '\n').encode('utf-8')
    return cat, data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--generated-at')
    a = ap.parse_args()
    bpath = os.path.join(HERE, 'BUILD.json')
    prev = json.load(open(bpath)) if os.path.exists(bpath) else {}
    gen = a.generated_at or prev.get('generated_at') or dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try:
        cat, data = build(gen)
    except SkyError as e:
        print('REJECTED:', e, file=sys.stderr)
        sys.exit(2)
    fsha = hashlib.sha256(data).hexdigest()
    build_json = (json.dumps({'revision': REV, 'generated_at': gen, 'file': f'catalogue/{REV}.json', 'bytes': len(data), 'file_sha256': fsha,
                              'raw': {e['raw_file']: e['raw_sha256'] for e in cat['provenance']['exports']} | {CROSS: cat['provenance']['crosscheck']['raw_sha256']}},
                             indent=1) + '\n').encode()
    cpath = os.path.join(HERE, 'catalogue', f'{REV}.json')
    if a.check:
        ok = open(cpath, 'rb').read() == data and open(bpath, 'rb').read() == build_json
        print('check', 'OK' if ok else 'MISMATCH', fsha, len(data))
        sys.exit(0 if ok else 1)
    open(cpath, 'wb').write(data)
    open(bpath, 'wb').write(build_json)
    print(REV, len(data), fsha)


if __name__ == '__main__':
    main()
