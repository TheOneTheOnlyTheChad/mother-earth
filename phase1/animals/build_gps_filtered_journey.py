#!/usr/bin/env python3
"""Mother Earth — build one bird's display file from a Movebank GPS tracking CSV and its reference-data CSV, withholding the
fixes near the tagging site (animals-tab-rc, stage 2; docs/concepts/ANIMALS-BIRD-BUILD-PROPOSAL.md rev 3.1, Part B and §11a).

    python3 -I phase1/animals/build_gps_filtered_journey.py --config phase1/animals/waved-albatross-galapagos.json \
        --animal 3275-30662 --source <tracking CSV> --reference <reference-data CSV> [--out-dir assets/animals] [--check]

A separate builder from build_journey.py (the zebra's), which is left untouched so that journey still rebuilds byte for byte.

What it guarantees. Each condition stops the build ("BUILD STOPPED", exit 2); nothing is written when it stops.
  1. Both inputs are the pinned files: each sha256 must equal the config's. The reference row for the animal must agree with the
     data rows about to be used: animal id, tag id, and the deployment date against the first row's UTC date.
  2. A manually-marked-outlier column: where the config says it is absent, it must be absent. Every row must be `visible` true
     (this builder has no rule for a hidden row, so one stops the build).
  3. Status and coordinates on EVERY row of the animal, before any filter: status A with fix type 3 needs both coordinates, valid;
     status D with fix type 0 needs both absent; anything else stops the build.
  4. Times: the stated form yyyy-MM-dd HH:mm:ss.SSS, read as UTC without the machine's zone, as integer epoch milliseconds.
     Rounded to the nearest second in integers ((ms + 500) // 1000). A row further than the allowance from a whole second stops
     the build. Applied to every row, positioned or not, BEFORE any omission. After rounding, two rows on the same second, or a
     row not later than the one before, stop the build.
  5. Withholding: every positioned fix within the radius of the reference file's deployment point (great-circle, haversine) is
     left out of the display file. The centre is read from the reference file, never typed into the config. At exactly the radius
     the fix is withheld.
  6. One pass writes, from the same rows: the retained fixes (t, lat, lon, acc with the source's own digits), a join flag per
     step (1 only when within the time rule AND no withheld fix lies between), the withheld periods as [first time, last time,
     count] (times and counts only: no coordinate, distance or bearing), and the times of failed attempts outside those periods.
  7. Counts are cross-checked (rows = positioned + failed; positioned = retained + withheld; periods; joined steps), and, when
     the config carries an `expect` block, compared with it.
Nothing is thinned, smoothed, interpolated or reordered. No coordinate of a retained fix is rounded or moved.
Outputs: <study>-<animal>-<rev>.json and <study>-<rev>.manifest.json. --check rebuilds in memory and compares: exit 0 only when
both files are present and identical, 3 when one is missing or different. No source file is ever written to the repository."""
import argparse, calendar, csv, hashlib, io, json, math, os, re, sys, time

TS = re.compile(r'^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})$')
NUM = re.compile(r'^-?\d+(\.\d+)?$')
POS = re.compile(r'^\d+(\.\d+)?$')

class BuildError(Exception):
    pass

def epoch_ms(s, where):
    """the complete timestamp as integer epoch milliseconds (UTC by construction; the machine's zone is never consulted)"""
    m = TS.match(s)
    if not m:
        raise BuildError(f'{where}: timestamp {s!r} is not in the source form yyyy-MM-dd HH:mm:ss.SSS')
    y, mo, d, h, mi, se, ms = (int(x) for x in m.groups())
    if not (1 <= mo <= 12 and 1 <= d <= calendar.monthrange(y, mo)[1] and h < 24 and mi < 60 and se < 60):
        raise BuildError(f'{where}: timestamp {s!r} is not a real calendar time')
    return calendar.timegm((y, mo, d, h, mi, se, 0, 0, 0)) * 1000 + ms

def round_seconds(ms):
    """nearest whole second, half up, in integers: no floating point"""
    return (ms + 500) // 1000

def ms_from_whole_second(ms):
    r = ms % 1000
    return min(r, 1000 - r)

def to_seconds(ms, allowance_ms, where, shown):
    d = ms_from_whole_second(ms)
    if d > allowance_ms:
        raise BuildError(f'{where}: timestamp {shown!r} is {d} ms from a whole second; the allowance for this study is {allowance_ms} ms')
    return round_seconds(ms), d

def haversine_km(lat1, lon1, lat2, lon2, R):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * R * math.asin(min(1.0, math.sqrt(a)))

def iso(t):
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(t))

def day(t):
    g = time.gmtime(t)
    return f"{g.tm_mday} {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][g.tm_mon - 1]} {g.tm_year}"

def n(x):
    return f'{x:,}'

def table(raw, what):
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError:
        raise BuildError(f'{what} is not UTF-8 text')
    rows = [r for r in csv.reader(io.StringIO(text, newline='')) if r]
    if len(rows) < 2:
        raise BuildError(f'{what} has no data rows')
    return rows[0], rows[1:]

def build(cfg, animal, raw, ref_raw):
    for what, b, pin in (('tracking file', raw, cfg['source_file']), ('reference file', ref_raw, cfg['reference_file'])):
        sha = hashlib.sha256(b).hexdigest()
        if sha != pin['sha256']:
            raise BuildError(f'the {what} is not the pinned file: sha256 {sha}, pinned {pin["sha256"]}')
    # ---- the reference row
    rhead, rrows = table(ref_raw, 'the reference file')
    for c in ('tag-id', 'animal-id', 'deploy-on-date', 'deploy-on-latitude', 'deploy-on-longitude'):
        if c not in rhead:
            raise BuildError(f'reference column {c!r} is missing')
    rx = {c: i for i, c in enumerate(rhead)}
    mine = [r for r in rrows if len(r) == len(rhead) and r[rx['animal-id']] == animal]
    if len(mine) != 1:
        raise BuildError(f'the reference file has {len(mine)} rows for animal {animal}; exactly one is required')
    ref = mine[0]
    ref_tag, ref_date, clat_s, clon_s = ref[rx['tag-id']], ref[rx['deploy-on-date']], ref[rx['deploy-on-latitude']], ref[rx['deploy-on-longitude']]
    if not (NUM.match(clat_s) and NUM.match(clon_s)):
        raise BuildError(f'the reference deployment point {clat_s!r}, {clon_s!r} is not a plain decimal pair')
    clat, clon = float(clat_s), float(clon_s)
    if not (-90 <= clat <= 90 and -180 <= clon <= 180):
        raise BuildError('the reference deployment point is out of range')
    # ---- the tracking rows
    head, rows = table(raw, 'the tracking file')
    need = ['event-id', 'timestamp', 'location-long', 'location-lat', 'eobs:horizontal-accuracy-estimate', 'eobs:status', 'eobs:type-of-fix',
            'visible', 'sensor-type', 'tag-local-identifier', 'individual-local-identifier']
    for c in need:
        if c not in head:
            raise BuildError(f'source column {c!r} is missing')
    outlier = cfg.get('columns', {}).get('manually_marked_outlier', 'absent')
    if outlier == 'absent' and 'manually-marked-outlier' in head:
        raise BuildError('the config says the source has no manually-marked-outlier column, but it has one')
    if outlier != 'absent':
        raise BuildError('this builder has no rule for a manually-marked-outlier column')
    ix = {c: head.index(c) for c in need}
    allow = cfg['timestamp_rule']['allowance_ms']
    if not (isinstance(allow, int) and 0 <= allow < 500):
        raise BuildError('the timestamp allowance must be a whole number of milliseconds under 500')
    W = cfg['withholding']; radius, R = float(W['radius_km']), float(W['sphere_radius_km'])
    rule = cfg['gap_rule']['max_join_seconds']
    ev = []                       # every row of the animal, in file order: (seconds, kind, lat, lon, acc) with kind 'fix' or 'failed'
    max_ms = 0; prev = None
    for k, r in enumerate(rows, start=2):
        if len(r) != len(head):
            raise BuildError(f'line {k}: {len(r)} fields, expected {len(head)}')
        if r[ix['individual-local-identifier']] != animal:
            continue
        where = f'line {k} (event {r[ix["event-id"]]})'
        if r[ix['tag-local-identifier']] != ref_tag:
            raise BuildError(f'{where}: tag {r[ix["tag-local-identifier"]]!r}, the reference file gives {ref_tag!r} for this animal')
        if r[ix['visible']].lower() != 'true':
            raise BuildError(f'{where}: visible is {r[ix["visible"]]!r}; this builder has no rule for a row that is not visible')
        if r[ix['sensor-type']].lower() != 'gps':
            raise BuildError(f'{where}: sensor-type {r[ix["sensor-type"]]!r}; this study is GPS only')
        status, fixtype, la, lo, ac = r[ix['eobs:status']], r[ix['eobs:type-of-fix']], r[ix['location-lat']], r[ix['location-long']], r[ix['eobs:horizontal-accuracy-estimate']]
        if status == 'A' and fixtype == '3':
            if la == '' or lo == '':
                raise BuildError(f'{where}: a positioned row (status A, fix type 3) lacks a coordinate')
            if not (NUM.match(la) and NUM.match(lo)):
                raise BuildError(f'{where}: coordinate {lo!r}, {la!r} is not a plain decimal number')
            fla, flo = float(la), float(lo)
            if not (math.isfinite(fla) and math.isfinite(flo) and -90 <= fla <= 90 and -180 <= flo <= 180):
                raise BuildError(f'{where}: coordinate {lo}, {la} is out of range')
            if not POS.match(ac) or not math.isfinite(float(ac)):
                raise BuildError(f'{where}: accuracy estimate {ac!r} is not a plain non-negative number')
            kind = 'fix'
        elif status == 'D' and fixtype == '0':
            if la != '' or lo != '':
                raise BuildError(f'{where}: a failed attempt (status D, fix type 0) carries a coordinate')
            kind = 'failed'
        else:
            raise BuildError(f'{where}: status {status!r} with fix type {fixtype!r} is not a combination this builder accepts')
        # the time rule is applied to every row, before any omission
        ms = epoch_ms(r[ix['timestamp']], where)
        s, dms = to_seconds(ms, allow, where, r[ix['timestamp']])
        max_ms = max(max_ms, dms)
        if prev is not None and s == prev:
            raise BuildError(f'{where}: after rounding, two rows share the second {iso(s)}')
        if prev is not None and s < prev:
            raise BuildError(f'{where}: the row at {r[ix["timestamp"]]} is not later than the row before it')
        prev = s
        ev.append((s, kind, la, lo, ac))
    if not ev:
        raise BuildError(f'no source row for {animal}')
    if time.strftime('%Y-%m-%d', time.gmtime(ev[0][0])) != ref_date:
        raise BuildError(f'the first row is dated {time.strftime("%Y-%m-%d", time.gmtime(ev[0][0]))} UTC; the reference file gives deployment on {ref_date!r}')
    # ---- one pass: retained fixes, join flags, withheld periods, failed attempts
    t, lat, lon, acc, j = [], [], [], [], []
    periods = []                  # [first, last, count]
    open_period = None            # a period still running (no retained fix since)
    withheld_since_retained = 0   # withheld fixes since the last retained fix
    failed_since_retained = []    # failed attempts since the last retained fix
    failed_all, joined_failed = [], 0
    sep_withheld = sep_time = 0
    for s, kind, la, lo, ac in ev:
        if kind == 'failed':
            failed_all.append(s); failed_since_retained.append(s); continue
        if haversine_km(clat, clon, float(la), float(lo), R) <= radius:
            if open_period is None:
                open_period = [s, s, 1]; periods.append(open_period)
            else:
                open_period[1] = s; open_period[2] += 1
            withheld_since_retained += 1
            continue
        if t:
            within = s - t[-1] <= rule
            flag = 1 if (within and withheld_since_retained == 0) else 0
            j.append(flag)
            if flag and failed_since_retained:
                joined_failed += 1
            if withheld_since_retained:
                sep_withheld += 1
            elif not within:
                sep_time += 1
        else:
            j.append(0)
        t.append(s); lat.append(la); lon.append(lo); acc.append(ac)
        open_period = None; withheld_since_retained = 0; failed_since_retained = []
    if not t:
        raise BuildError(f'every positioned fix of {animal} is within the withholding radius; nothing would be shown')
    inside = lambda s: any(a <= s <= b for a, b, _ in periods)
    failed_t = [s for s in failed_all if not inside(s)]
    failed_in_period = len(failed_all) - len(failed_t)
    positioned = sum(1 for e in ev if e[1] == 'fix'); withheld = sum(p[2] for p in periods)
    # ---- cross-checks
    if len(ev) != positioned + len(failed_all): raise BuildError('count check: rows != positioned + failed')
    if positioned != len(t) + withheld: raise BuildError('count check: positioned != retained + withheld')
    if sum(j) + sep_withheld + sep_time != len(t) - 1: raise BuildError('count check: steps do not add up')
    for a, b, c in periods:
        if any(a <= x <= b for x in t): raise BuildError('a retained fix lies inside a withheld period')
    counts = {'source_rows': len(ev), 'positioned': positioned, 'failed_attempts': len(failed_all), 'fixes': len(t), 'fixes_withheld': withheld,
              'withheld_periods': len(periods), 'steps_joined': sum(j), 'joined_spanning_failed': joined_failed,
              'steps_separated_by_withholding': sep_withheld, 'steps_separated_by_time': sep_time, 'failed_listed': len(failed_t)}
    for key, want in cfg.get('expect', {}).items():
        if counts.get(key) != want:
            raise BuildError(f'count {key} is {counts.get(key)}; the config expects {want}')
    rev = cfg['revision']; did = f"{cfg['study']}-{animal}-{rev}"
    display = ('{"schema":3,"id":"%s","study":"%s","animal":"%s","n":%d,\n"t":[%s],\n"lat":[%s],\n"lon":[%s],\n"acc":[%s],\n"j":[%s],\n"withheld":[%s],\n"failed_t":[%s]}\n'
               % (did, cfg['study'], animal, len(t), ','.join(map(str, t)), ','.join(lat), ','.join(lon), ','.join(acc), ','.join(map(str, j)),
                  ','.join('[%d,%d,%d]' % tuple(p) for p in periods), ','.join(map(str, failed_t)))).encode('utf-8')
    json.loads(display)
    fl, fo, fa = [float(x) for x in lat], [float(x) for x in lon], sorted(float(x) for x in acc)
    med = fa[len(fa) // 2] if len(fa) % 2 else (fa[len(fa) // 2 - 1] + fa[len(fa) // 2]) / 2
    p95 = fa[max(0, math.ceil(0.95 * len(fa)) - 1)]
    longest = max((b - a for a, b, _ in periods), default=0)
    rec0, rec1 = ev[0][0], ev[-1][0]
    km = ('%g' % radius)
    card = {
        'note': cfg['label_line'] + ' A dated replay, not current. Private preview.',
        'shown': f"{n(len(t))} of {n(positioned)} recorded fixes are shown. {n(withheld)} fixes within {km} km of the tagging-site reference point are withheld by Mother Earth.",
        'done': f"Times are rounded to the nearest second. The line never crosses a withheld period. {n(joined_failed)} joins span a time when the tag tried and got no position. "
                f"{n(len(failed_all))} attempts got no position and are not drawn.",
        'line': f"The line joins displayed fixes no more than 3 hours 15 minutes apart with no withheld fix between them: {n(sum(j))} of {n(len(t) - 1)} steps.",
        'not_route': "The path between fixes was not observed. The line is not the bird's flight path.",
        'changes': "Changes made to the dataset (CC0 1.0): one bird selected; fixes near the tagging site withheld; times rounded to the nearest second; nothing moved, smoothed or interpolated. The archived source is unchanged.",
        'accuracy': f"Each displayed fix carries the tag's own accuracy estimate (median {round(med):,} m, largest {round(fa[-1]):,} m among the {n(len(t))} displayed). It is the tag's estimate, not a measured error.",
        'tagging': None,
    }
    notes = cfg.get('reference_notes', {})
    g = lambda f: (ref[rx[notes[f]]] if notes.get(f) in rx else '')
    card['tagging'] = '; '.join(x for x in (
        f"Tagged {day(calendar.timegm(time.strptime(ref_date, '%Y-%m-%d')))} at {g('site_field')} (the source's site name)" if g('site_field') else '',
        f"life stage as recorded: {g('life_stage_field')}" if g('life_stage_field') else '',
        f"the source's comment: “{g('comments_field')}”" if g('comments_field') else '',
        f"deployment comment: “{g('deployment_comments_field')}”" if g('deployment_comments_field') else '') if x) + '.'
    manifest = {
        'schema': 3, 'kind': cfg['kind'], 'id': f"{cfg['study']}-{rev}", 'study': cfg['study'], 'revision': rev, 'animal': animal,
        'label': cfg['label'], 'label_line': cfg['label_line'], 'title': cfg['title'], 'place': cfg['place'], 'common_name': cfg['common_name'],
        'species_as_recorded': cfg['species_as_recorded'], 'method': cfg['method'],
        'animals_sampled': cfg['animals_sampled'], 'animals_used_in_paper': cfg['animals_used_in_paper'], 'animals_shown': 1, 'sample_sentence': cfg['sample_sentence'],
        'time_convention': cfg['time_convention'],
        'location_uncertainty': "the tag's own horizontal accuracy estimate per fix (the tag maker's estimate, not a measured error)",
        'accuracy_note': card['accuracy'],
        'dataset_doi': cfg['dataset_doi'], 'dataset_url': cfg['dataset_url'], 'repository': cfg['repository'],
        'licence': cfg['licence'], 'licence_url': cfg['licence_url'],
        'citation_as_given': cfg['citation_as_given'], 'paper_citation_as_given': cfg['paper_citation_as_given'],
        'source_file': cfg['source_file'], 'reference_file': cfg['reference_file'], 'built_from': 'the two pinned source files',
        'outlier_field': 'the source file has no manually-marked-outlier column; that is an absent field, not a statement that the source checked and found none',
        'timestamp_rule': dict(cfg['timestamp_rule'], measured_max_ms=max_ms, applied='to every source row of the animal, positioned or not, before any omission'),
        'gap_rule': cfg['gap_rule'],
        'withholding': dict(W, centre={'lat': clat_s, 'lon': clon_s},
                            statement=f"Mother Earth withholds every fix within {km} km of the tagging-site reference point. That point is the reference file's deployment location, given to two decimals; it is a tagging-site reference, not a nest position."),
        'simplification': 'filtered, not thinned or smoothed: fixes near the tagging site are withheld; every other recorded fix is in the display file',
        'sensitivity': cfg['sensitivity'],
        'journeys': [dict({
            'animal': animal, 'file': did + '.json', 'bytes': len(display), 'sha256': hashlib.sha256(display).hexdigest(),
            'first_fix': iso(t[0]), 'last_fix': iso(t[-1]), 'first_fix_s': t[0], 'last_fix_s': t[-1],
            'record_first': iso(rec0), 'record_last': iso(rec1), 'record_first_s': rec0, 'record_last_s': rec1,
            'steps': len(t) - 1, 'failed_inside_withheld_period': failed_in_period, 'longest_withheld_period_s': longest,
            'accuracy_m': {'min': fa[0], 'median': med, 'p95': p95, 'max': fa[-1], 'over_25': sum(1 for x in fa if x > 25), 'over_50': sum(1 for x in fa if x > 50)},
            'bbox': {'south': min(fl), 'north': max(fl), 'west': min(fo), 'east': max(fo)},
        }, **counts)],
        'card': card,
    }
    man = (json.dumps(manifest, indent=1, ensure_ascii=False) + '\n').encode('utf-8')
    return did + '.json', display, f"{cfg['study']}-{rev}.manifest.json", man

def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', required=True); ap.add_argument('--animal', required=True)
    ap.add_argument('--source', required=True); ap.add_argument('--reference', required=True)
    ap.add_argument('--out-dir', default='assets/animals'); ap.add_argument('--check', action='store_true')
    a = ap.parse_args(argv)
    cfg = json.load(open(a.config, encoding='utf-8'))
    try:
        dname, display, mname, man = build(cfg, a.animal, open(a.source, 'rb').read(), open(a.reference, 'rb').read())
    except BuildError as e:
        print('BUILD STOPPED: ' + str(e)); return 2
    if a.check:
        ok = True
        for name, b in ((dname, display), (mname, man)):
            p = os.path.join(a.out_dir, name)
            if not os.path.exists(p): print('MISSING    ' + p); ok = False
            elif open(p, 'rb').read() != b: print('DIFFERENT  ' + p); ok = False
            else: print('same       ' + p)
        if not ok: print('CHECK FAILED')
        return 0 if ok else 3
    os.makedirs(a.out_dir, exist_ok=True)
    for name, b in ((dname, display), (mname, man)):
        open(os.path.join(a.out_dir, name), 'wb').write(b)
        print(f'{name}  {len(b)} bytes  sha256 {hashlib.sha256(b).hexdigest()}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
