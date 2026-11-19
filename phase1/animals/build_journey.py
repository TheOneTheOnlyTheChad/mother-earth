#!/usr/bin/env python3
"""Mother Earth — build one animal's journey display file from a Movebank Data Repository tracking CSV.

    python3 -I phase1/animals/build_journey.py --config phase1/animals/zebra-botswana.json --animal Z3866 \
        --source <path to the source CSV, or to the single-animal extract> [--out-dir assets/animals] [--check]

What it guarantees (ANIMALS-PROPOSAL rev 2.2, J1, J2, J2a):
  - The input is the pinned file: its sha256 must equal the config's source_file.sha256 (the whole repository file) or the
    pinned extract for this animal (header + that animal's source lines, bytes unchanged). Anything else stops the build.
  - Times are the source's own, to the second. The timestamp is parsed from its stated form "yyyy-MM-dd HH:mm:ss.SSS" as UTC,
    explicitly, with no use of the machine's time zone. A fractional second other than .000 stops the build (the display file
    carries whole seconds, so nothing may be rounded).
  - Coordinates are written with the source's own digits. A missing, non-finite or out-of-range coordinate on a usable row
    stops the build. Rows the source marks not visible / outlier, and rows without a position, are counted and not written.
  - Fixes must be in strictly increasing time order. Out-of-order rows or two usable fixes with the same time stop the build.
  - Nothing is thinned, smoothed, interpolated or reordered.
Outputs: <study>-<animal>-<rev>.json (display file) and <study>-<rev>.manifest.json. --check rebuilds in memory and compares.
The source CSV is never written to the repository."""
import argparse, calendar, csv, hashlib, io, json, math, os, re, sys

TS = re.compile(r'^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})$')
NUM = re.compile(r'^-?\d+(\.\d+)?$')

class BuildError(Exception):
    pass

def parse_time(s, where):
    m = TS.match(s)
    if not m:
        raise BuildError(f'{where}: timestamp {s!r} is not in the source form yyyy-MM-dd HH:mm:ss.SSS')
    y, mo, d, h, mi, se, ms = (int(x) for x in m.groups())
    if ms != 0:
        raise BuildError(f'{where}: timestamp {s!r} has a fractional second; the display file carries whole seconds only')
    if not (1 <= mo <= 12 and 1 <= d <= calendar.monthrange(y, mo)[1] and h < 24 and mi < 60 and se < 60):
        raise BuildError(f'{where}: timestamp {s!r} is not a real calendar time')
    return calendar.timegm((y, mo, d, h, mi, se, 0, 0, 0))     # UTC by construction; the machine's zone is never consulted

def iso(t):
    import time
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(t))

def build(cfg, animal, raw):
    sha = hashlib.sha256(raw).hexdigest()
    ext = cfg.get('extracts', {}).get(animal)
    if sha == cfg['source_file']['sha256']:
        source_kind = 'full source file'
    elif ext and sha == ext['sha256']:
        source_kind = 'pinned single-animal extract'
    else:
        raise BuildError(f'input sha256 {sha} is neither the pinned source file nor the pinned extract for {animal}')
    text = raw.decode('utf-8')
    rows = list(csv.reader(io.StringIO(text, newline='')))
    head = rows[0]
    need = ['visible', 'timestamp', 'location-long', 'location-lat', 'manually-marked-outlier', 'sensor-type', 'individual-local-identifier']
    for n in need:
        if n not in head:
            raise BuildError(f'source column {n!r} is missing')
    ix = {n: head.index(n) for n in need}
    t, lat, lon = [], [], []
    n_rows = no_pos = flagged = 0
    for k, r in enumerate(rows[1:], start=2):
        if len(r) != len(head):
            raise BuildError(f'line {k}: {len(r)} fields, expected {len(head)}')
        if r[ix['individual-local-identifier']] != animal:
            continue
        n_rows += 1
        where = f'line {k}'
        vis = r[ix['visible']].lower()
        if vis not in ('true', 'false'):
            raise BuildError(f'{where}: visible is {r[ix["visible"]]!r}')
        if vis == 'false' or r[ix['manually-marked-outlier']].lower() == 'true':
            flagged += 1
            continue
        la, lo = r[ix['location-lat']], r[ix['location-long']]
        if la == '' and lo == '':
            no_pos += 1
            continue
        if not (NUM.match(la) and NUM.match(lo)):
            raise BuildError(f'{where}: coordinate {lo!r}, {la!r} is not a plain decimal number')
        fla, flo = float(la), float(lo)
        if not (math.isfinite(fla) and math.isfinite(flo) and -90 <= fla <= 90 and -180 <= flo <= 180):
            raise BuildError(f'{where}: coordinate {lo}, {la} is out of range')
        if r[ix['sensor-type']].lower() != 'gps':
            raise BuildError(f'{where}: sensor-type {r[ix["sensor-type"]]!r}; this study is GPS only')
        ts = parse_time(r[ix['timestamp']], where)
        if t and ts == t[-1]:
            raise BuildError(f'{where}: two usable fixes share the time {r[ix["timestamp"]]}')
        if t and ts < t[-1]:
            raise BuildError(f'{where}: fix at {r[ix["timestamp"]]} is earlier than the fix before it')
        t.append(ts); lat.append(la); lon.append(lo)
    if not t:
        raise BuildError(f'no usable fix for {animal}')
    rule = cfg['gap_rule']['max_join_seconds']
    gaps = [b - a for a, b in zip(t, t[1:])]
    over = [(g, i) for i, g in enumerate(gaps) if g > rule]
    rev = cfg['revision']
    did = f"{cfg['study']}-{animal}-{rev}"
    # the display file: times as whole UTC seconds, coordinates with the source's own digits
    display = ('{"schema":1,"id":"%s","study":"%s","animal":"%s","n":%d,\n"t":[%s],\n"lat":[%s],\n"lon":[%s]}\n'
               % (did, cfg['study'], animal, len(t), ','.join(map(str, t)), ','.join(lat), ','.join(lon))).encode('utf-8')
    json.loads(display)                                         # it must be valid JSON
    fl, fo = [float(x) for x in lat], [float(x) for x in lon]
    manifest = {
        'schema': 1, 'id': f"{cfg['study']}-{rev}", 'study': cfg['study'], 'revision': rev,
        'title': cfg['title'], 'place': cfg['place'], 'common_name': cfg['common_name'],
        'species_as_recorded': cfg['species_as_recorded'], 'taxon_detail_as_recorded': cfg['taxon_detail_as_recorded'],
        'dataset_doi': cfg['dataset_doi'], 'dataset_url': cfg['dataset_url'], 'repository': cfg['repository'], 'movebank_study_id': cfg['movebank_study_id'],
        'licence': cfg['licence'], 'licence_url': cfg['licence_url'],
        'citation_as_given': cfg['citation_as_given'], 'paper_citation_as_given': cfg['paper_citation_as_given'],
        'method': cfg['method'], 'time_convention': cfg['time_convention'], 'location_uncertainty': cfg['location_uncertainty'],
        'animals_sampled': cfg['animals_sampled'], 'animals_shown': 1, 'study_totals': cfg['study_totals'],
        'source_file': cfg['source_file'], 'built_from': source_kind,
        'gap_rule': cfg['gap_rule'], 'simplification': cfg['simplification'], 'sensitivity': cfg['sensitivity'],
        'journeys': [{
            'animal': animal, 'file': did + '.json', 'bytes': len(display), 'sha256': hashlib.sha256(display).hexdigest(),
            'fixes': len(t), 'source_rows': n_rows, 'rows_without_position': no_pos, 'rows_flagged_by_source': flagged,
            'first_fix': iso(t[0]), 'last_fix': iso(t[-1]), 'first_fix_s': t[0], 'last_fix_s': t[-1],
            'gaps_over_rule': len(over), 'longest_gap_s': max(gaps) if gaps else 0,
            'bbox': {'south': min(fl), 'north': max(fl), 'west': min(fo), 'east': max(fo)},
        }],
    }
    if ext and source_kind == 'full source file' and n_rows != ext['rows']:
        raise BuildError(f"{animal}: {n_rows} source rows, the pinned extract records {ext['rows']}")
    man = (json.dumps(manifest, indent=1, ensure_ascii=False) + '\n').encode('utf-8')
    return did + '.json', display, f"{cfg['study']}-{rev}.manifest.json", man

def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', required=True); ap.add_argument('--animal', required=True); ap.add_argument('--source', required=True)
    ap.add_argument('--out-dir', default='assets/animals'); ap.add_argument('--check', action='store_true')
    a = ap.parse_args(argv)
    cfg = json.load(open(a.config, encoding='utf-8'))
    try:
        dname, display, mname, man = build(cfg, a.animal, open(a.source, 'rb').read())
    except BuildError as e:
        print('BUILD STOPPED: ' + str(e)); return 2
    if a.check:
        ok = True
        for name, b in ((dname, display), (mname, man)):
            p = os.path.join(a.out_dir, name)
            same = os.path.exists(p) and open(p, 'rb').read() == b
            print(('same  ' if same else 'DIFFERS  ') + p); ok = ok and same
        return 0 if ok else 1
    os.makedirs(a.out_dir, exist_ok=True)
    for name, b in ((dname, display), (mname, man)):
        open(os.path.join(a.out_dir, name), 'wb').write(b)
        print(f'{name}  {len(b)} bytes  sha256 {hashlib.sha256(b).hexdigest()}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
