#!/usr/bin/env python3
"""Sky zoom-out — scene file generator (SKY-ZOOM-OUT-PROPOSAL rev 2.2 §3.4, §7).

Builds the scene file sky-scene-<…> from the SAME raw Horizons exports as its paired Two Clocks catalogue. It first
regenerates the paired catalogue in memory with build_sky.build() and refuses to continue unless that reproduces the
pinned catalogue byte for byte (acceptance check 20: a card/scene pair from different exports or generator runs is refused).
Per body and date it rotates the export's ICRF X/Y/Z to Earth-fixed axes (earth_orient.icrf_to_earth_fixed) and writes the
calculated point beneath the body (4 dp) with the range copied unchanged from the paired catalogue row.

Usage:
  python3 phase1/sky/build_scene.py            # write catalogue/<scene rev>.json and BUILD-scene.json
  python3 phase1/sky/build_scene.py --check    # regenerate in memory and compare byte for byte
Any failed check raises SkyError and writes nothing. No network access.
"""
import argparse, hashlib, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_sky as S          # noqa: E402
import earth_orient as E       # noqa: E402

DEFAULT_MANIFEST = 'revisions/sky-scene-2026-11-R1.json'
VEC = re.compile(r'(\d+\.\d+) = A\.D\. (\d{4}-\w{3}-\d{2}) 00:00:00\.0000 (?:UTC|UT~)\s*\n\s*X =\s*(\S+) Y =\s*(\S+) Z =\s*(\S+)')
ASSUMPTIONS = ['no nutation', 'polar motion 0', 'UT1 = UTC', 'TT = UTC + 69.184 s (TAI-UTC 37 s)',
               'Earth-centred ICRF axes of the exports taken as aligned with the GCRS input']


def build(man, base=HERE):
    need = S.need
    rev = man['revision']
    need(re.fullmatch(r'sky-scene-\d{4}-\d\d-[RT]\d+', rev or ''), 'bad scene revision id')
    pman = json.load(open(os.path.join(base, man['pairs_with_manifest'])))
    pbuild = json.load(open(os.path.join(base, 'BUILD.json')))
    need(pbuild['revision'] == pman['revision'], 'BUILD.json is not the paired revision')
    pcat, pdata, prev, _ = S.build(pbuild['generated_at'], pman, base)
    psha = hashlib.sha256(pdata).hexdigest()
    need(psha == man['pairs_with_sha256'] == pbuild['file_sha256'], 'paired catalogue does not reproduce its pin (unpaired refresh)')
    bodies = {}
    for b in ('moon', 'sun'):
        raw = open(os.path.join(base, pman['raw'][b]), 'rb').read().decode('utf-8')
        need(hashlib.sha256(raw.encode()).hexdigest() == pbuild['raw'][pman['raw'][b]], f'{b}: raw export differs from the pair')
        vec = {m.group(2): (float(m.group(1)), [float(m.group(i)) for i in (3, 4, 5)]) for m in VEC.finditer(raw)}
        rows = []
        for date, rg, rr, flag in pcat['bodies'][b]['rows']:
            key = S.dt.date.fromisoformat(date).strftime('%Y-%b-%d')
            need(key in vec, f'{b}: no vector for {date}')
            jd, v = vec[key]
            r = sum(x * x for x in v) ** 0.5
            need(abs(r - rg) < 1e-3 * max(1.0, rg * 1e-9) + 0.01, f'{b} {date}: |XYZ| does not reproduce RG')
            lat, lng = E.beneath(E.icrf_to_earth_fixed(v, jd))
            rows.append([date, round(lat, 4), round(lng, 4), rg, flag])
        bodies[b] = {'target': pcat['bodies'][b]['target'], 'name': pcat['bodies'][b]['name'], 'rows': rows}
    cat = {
        'catalogue': 'sky',
        'catalogue_revision': rev,
        'content': 'scene',
        'schema': 1,
        'generated_at': pcat['generated_at'],
        'pairs_with': {'catalogue_revision': prev, 'fileSha256': psha},
        'kind': 'calculated',
        'attribution': 'Calculated positions · NASA/JPL Horizons; Earth orientation by our transform (code derived from ERFA)',
        'quantity': 'calculated point directly beneath the body (geocentric latitude, longitude; deg, 4 dp) at 00:00 UTC; distance from the centre of the Earth (km, as in the paired catalogue)',
        'sample_time': pcat['sample_time'],
        'coverage': pcat['coverage'],
        'time': pcat['time'],
        'transform': {'name': 'IAU 2006 bias-precession + GMST 2006 (transcribed from ERFA 1a8044c)', 'assumptions': ASSUMPTIONS,
                      'agreement_tested_by': 'phase1/sky-scene-build.test.mjs (tolerances: 0.004 deg vs ERFA c2t06a; 0.005 deg vs astronomy-engine; 0.02 deg Sun vs the page day/night formula)',
                      'earth_orientation_note': man['earth_orientation_note']},
        'radii_km': man['radii_km'],
        'radii_sources': man['radii_sources'],
        'fields': ['date', 'lat', 'lng', 'range_km', 'time_flag'],
        'bodies': bodies,
        'sources': {'raw_sha256': {pman['raw'][b]: pbuild['raw'][pman['raw'][b]] for b in ('moon', 'sun')},
                    'register': 'REGISTER.md — NASA/JPL Horizons entry; ERFA entry', 'research_record': man['source_record'],
                    'citation': pcat['provenance']['citation']},
    }
    data = (json.dumps(cat, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8')
    return cat, data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--manifest', default=DEFAULT_MANIFEST)
    ap.add_argument('--base', default=HERE)
    ap.add_argument('--out-dir', default=HERE)
    a = ap.parse_args()
    man = json.load(open(os.path.join(a.base, a.manifest)))
    try:
        cat, data = build(man, a.base)
    except S.SkyError as e:
        print('REJECTED:', e, file=sys.stderr)
        sys.exit(2)
    rev = man['revision']; fsha = hashlib.sha256(data).hexdigest()
    bj = (json.dumps({'revision': rev, 'file': f'catalogue/{rev}.json', 'bytes': len(data), 'file_sha256': fsha,
                      'pairs_with': cat['pairs_with']}, indent=1) + '\n').encode()
    cpath = os.path.join(a.out_dir, 'catalogue', f'{rev}.json'); bpath = os.path.join(a.out_dir, 'BUILD-scene.json')
    if a.check:
        ok = os.path.exists(cpath) and open(cpath, 'rb').read() == data and open(bpath, 'rb').read() == bj
        print('check', 'OK' if ok else 'MISMATCH', fsha, len(data)); sys.exit(0 if ok else 1)
    open(cpath, 'wb').write(data); open(bpath, 'wb').write(bj)
    print(rev, len(data), fsha)


if __name__ == '__main__':
    main()
