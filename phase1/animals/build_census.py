#!/usr/bin/env python3
"""Mother Earth — build the African penguin colony-census display file from the pinned Dryad zip
(animals-tab-rc, stage 3; docs/concepts/ANIMALS-PENGUIN-CHART-PROPOSAL.md rev 1.1, section 5; criteria P1 to P7, P19).

    python3 -I phase1/animals/build_census.py --config phase1/animals/african-penguin-census.json --source <the zip> [--out-dir assets/animals] [--check]

Each condition below stops the build ("BUILD STOPPED", exit 2); nothing is written when it stops.
  1. The zip is the pinned zip (sha256 and size) and holds exactly one file, the pinned CSV (name, size, sha256).
  2. The header is exactly `Year` followed by the config's colony names, in order.
  3. The rows are the config's years, consecutive, once each, in order; every row has one cell per column.
  4. Every data cell is one of: a whole number of 1 or more written in plain digits (a count); `NA` or an empty cell (no count);
     `0.1` (the authors' model marker). Anything else stops the build: a zero, a negative, another decimal, text, spaces.
  5. The markers are exactly the cells the config lists, no more and no fewer.
  6. Totals equal the config's expected counts (counts, no count, markers, empty cells).
  7. The later-file difference list names only known colonies and years in range, has no repeated cell, and totals what the
     config expects. (Those counts are audit metadata typed into the config; this builder cannot recompute them.)
Three states are kept apart in the output: a count (an integer), no count (null), marker ("m"). The marker is never a number.
Per-colony summaries are computed here, never typed. Nothing is summed across colonies, smoothed, filled or reordered.
Outputs: <study>-<rev>.json, <study>-<rev>.manifest.json and populations-<rev>.catalog.json (the list that pins the manifest).
--check rebuilds in memory and compares: exit 0 only when all three are present and identical, 3 when one is missing or
different. No source file is ever written to the repository."""
import argparse, csv, hashlib, io, json, os, re, sys, zipfile

COUNT = re.compile(r'^[1-9][0-9]*$')
sha = lambda b: hashlib.sha256(b).hexdigest()

class BuildError(Exception):
    pass

def read_csv_from_zip(cfg, zraw):
    z, f = cfg['source_zip'], cfg['source_file']
    if len(zraw) != z['bytes'] or sha(zraw) != z['sha256']:
        raise BuildError(f'the zip is not the pinned file: {len(zraw)} bytes, sha256 {sha(zraw)}; pinned {z["bytes"]} bytes, {z["sha256"]}')
    try:
        zf = zipfile.ZipFile(io.BytesIO(zraw))
    except zipfile.BadZipFile:
        raise BuildError('the source is not a zip file')
    names = zf.namelist()
    if names != [f['name']]:
        raise BuildError(f'the zip must hold exactly one file, {f["name"]!r}; it holds {names!r}')
    raw = zf.read(f['name'])
    if len(raw) != f['bytes'] or sha(raw) != f['sha256']:
        raise BuildError(f'the CSV inside the zip is not the pinned file: {len(raw)} bytes, sha256 {sha(raw)}')
    return raw

def parse(cfg, raw):
    """the CSV's cells as three states; returns (years, {colony: [state]}, empty_cells)"""
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError:
        raise BuildError('the CSV is not UTF-8 text')
    rows = [r for r in csv.reader(io.StringIO(text, newline=''))]
    while rows and rows[-1] == []:
        rows.pop()
    cols = cfg['colonies']
    if not rows or rows[0] != ['Year'] + cols:
        raise BuildError(f'the header is not Year followed by the {len(cols)} expected colony names in order; found {rows[0] if rows else None!r}')
    y0, y1 = cfg['years']['first'], cfg['years']['last']
    want_years = list(range(y0, y1 + 1))
    body = rows[1:]
    if [r[0] if r else None for r in body] != [str(y) for y in want_years]:
        raise BuildError(f'the rows are not the years {y0} to {y1}, consecutive, once each, in order')
    markers = {(c, int(y)) for c, y in cfg['markers']}
    states = {c: [] for c in cols}; empty = 0; seen_markers = set()
    for r, year in zip(body, want_years):
        if len(r) != len(cols) + 1:
            raise BuildError(f'year {year}: {len(r)} cells, expected {len(cols) + 1}')
        for c, v in zip(cols, r[1:]):
            if COUNT.match(v):
                if (c, year) in markers:
                    raise BuildError(f'{c} {year}: a count where the config expects the authors\' marker')
                states[c].append(int(v))
            elif v == 'NA' or v == '':
                if (c, year) in markers:
                    raise BuildError(f'{c} {year}: no entry where the config expects the authors\' marker')
                empty += v == ''
                states[c].append(None)
            elif v == '0.1':
                if (c, year) not in markers:
                    raise BuildError(f'{c} {year}: a 0.1 marker in a cell the config does not list')
                seen_markers.add((c, year)); states[c].append('m')
            else:
                raise BuildError(f'{c} {year}: cell {v!r} is not a whole number of 1 or more, NA, an empty cell, or the 0.1 marker')
    if seen_markers != markers:
        raise BuildError(f'markers found {sorted(seen_markers)} are not the listed {sorted(markers)}')
    return want_years, states, empty

def summary(years, st):
    """one colony's figures, computed from its states"""
    cs = [(y, v) for y, v in zip(years, st) if isinstance(v, int)]
    if not cs:
        raise BuildError('a colony has no count at all')
    hi = max(cs, key=lambda x: (x[1], -x[0]))                 # the highest value; its earliest year if it occurs twice
    inside = sum(1 for y, v in zip(years, st) if v is None and cs[0][0] < y < cs[-1][0])
    joined = sum(1 for (a, _), (b, _) in zip(cs, cs[1:]) if b - a == 1)
    return {'counted_years': len(cs), 'first_year': cs[0][0], 'first_value': cs[0][1], 'last_year': cs[-1][0], 'last_value': cs[-1][1],
            'highest_value': hi[1], 'highest_year': hi[0], 'lowest_value': min(v for _, v in cs), 'gaps_inside': inside,
            'joined_pairs': joined, 'marker_years': [y for y, v in zip(years, st) if v == 'm']}

def build(cfg, zraw):
    raw = read_csv_from_zip(cfg, zraw)
    years, states, empty = parse(cfg, raw)
    cols = cfg['colonies']
    flat = [v for c in cols for v in states[c]]
    totals = {'counts': sum(isinstance(v, int) for v in flat), 'no_count': sum(v is None for v in flat), 'markers': sum(v == 'm' for v in flat), 'empty_cells': empty}
    if totals['counts'] + totals['no_count'] + totals['markers'] != len(cols) * len(years):
        raise BuildError('count check: the three states do not add up to every cell')
    for k, want in cfg.get('expect', {}).items():
        if totals.get(k) != want:
            raise BuildError(f'total {k} is {totals.get(k)}; the config expects {want}')
    # countries: consecutive runs of the file's own column order
    country_of = {}; i = 0
    for g in cfg['countries']:
        if i >= len(cols) or cols[i] != g['first']:
            raise BuildError(f'country {g["name"]}: its first colony is not {g["first"]!r} at position {i}')
        for c in cols[i:i + g['count']]:
            country_of[c] = g['name']
        i += g['count']
    if i != len(cols):
        raise BuildError('the country groups do not cover every colony exactly once')
    # the later-file difference list (audit metadata)
    L = cfg['later_file']; cells = [(c, int(y)) for c, y in L['differing_cells']]
    if len(set(cells)) != len(cells):
        raise BuildError('the later-file difference list repeats a cell')
    for c, y in cells:
        if c not in states or not (years[0] <= y <= years[-1]):
            raise BuildError(f'the later-file difference list names an unknown cell: {c} {y}')
    if len(cells) != L['expect_total']:
        raise BuildError(f'the later-file difference list has {len(cells)} cells; the config expects {L["expect_total"]}')
    diff_n = {c: sum(1 for cc, _ in cells if cc == c) for c in cols}
    rev = cfg['revision']; did = f"{cfg['study']}-{rev}"
    enc = lambda v: 'null' if v is None else ('"m"' if v == 'm' else str(v))
    display = ('{"schema":1,"kind":"colony-census","id":"%s","years":[%s],\n"colonies":[\n%s\n]}\n' % (
        did, ','.join(map(str, years)), ',\n'.join('{"name":%s,"v":[%s]}' % (json.dumps(c), ','.join(enc(v) for v in states[c])) for c in cols))).encode('utf-8')
    json.loads(display)
    W = cfg['wording']
    manifest = {
        'schema': 1, 'kind': cfg['kind'], 'id': did, 'study': cfg['study'], 'revision': rev, 'group': cfg['group'], 'label': cfg['label'],
        'evidence_type': 'census counts', 'common_name': cfg['common_name'], 'species_as_recorded': cfg['species_as_recorded'],
        'period': {'first_year': years[0], 'last_year': years[-1], 'years': len(years)},
        'dataset_doi': cfg['dataset_doi'], 'dataset_url': cfg['dataset_url'], 'repository': cfg['repository'], 'deposit_version': cfg['deposit_version'],
        'record': cfg['record'],
        'source_zip': cfg['source_zip'], 'source_file': cfg['source_file'],
        'cell_rules': 'a whole number of 1 or more is a count; NA or an empty cell is no count; 0.1 is the authors\' model marker and is never a value',
        'totals': dict(totals, cells=len(flat), colonies=len(cols)),
        'empty_cell_note': 'One cell is empty instead of NA in the source (Seal Island Algoa Bay, 2003); it is read as no count.' if empty == 1 else f'{empty} cells are empty instead of NA in the source; each is read as no count.',
        'wording': W,
        'later_file': {k: L[k] for k in ('what', 'commit', 'sha256', 'source_of_these_counts', 'sentence', 'not_counted')} | {'total_differing_cells': len(cells)},
        'simplification': 'none: every cell of the deposit is in the display file as one of three states; nothing is summed, smoothed, filled or reordered',
        'sensitivity': cfg['sensitivity'],
        'display': {'file': did + '.json', 'bytes': len(display), 'sha256': sha(display)},
        'colonies': [dict({'name': c, 'country': country_of[c], 'later_file_differing_years': diff_n[c]}, **summary(years, states[c])) for c in cols],
    }
    man = (json.dumps(manifest, indent=1, ensure_ascii=False) + '\n').encode('utf-8')
    catalog = {'schema': 1, 'revision': rev, 'note': 'Population evidence for the Animals page. Separate from the journey list. A page draws nothing from a manifest whose checksum differs from the one here.',
               'populations': [{'id': cfg['study'], 'label': cfg['label'], 'group': cfg['group'], 'kind': cfg['kind'], 'manifest': did + '.manifest.json', 'manifest_sha256': sha(man)}]}
    cat = (json.dumps(catalog, indent=1, ensure_ascii=False) + '\n').encode('utf-8')
    return [(did + '.json', display), (did + '.manifest.json', man), (f'populations-{rev}.catalog.json', cat)]

def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--config', required=True); ap.add_argument('--source', required=True)
    ap.add_argument('--out-dir', default='assets/animals'); ap.add_argument('--check', action='store_true')
    a = ap.parse_args(argv)
    cfg = json.load(open(a.config, encoding='utf-8'))
    try:
        if cfg.get('record', {}).get('TO_BE_READ_FROM_THE_RECORD'):
            raise BuildError('the config\'s record block (citations and licence wording as given on the Dryad record) has not been filled in')
        outs = build(cfg, open(a.source, 'rb').read())
    except BuildError as e:
        print('BUILD STOPPED: ' + str(e)); return 2
    if a.check:
        ok = True
        for name, b in outs:
            p = os.path.join(a.out_dir, name)
            if not os.path.exists(p): print('MISSING    ' + p); ok = False
            elif open(p, 'rb').read() != b: print('DIFFERENT  ' + p); ok = False
            else: print('same       ' + p)
        if not ok: print('CHECK FAILED')
        return 0 if ok else 3
    os.makedirs(a.out_dir, exist_ok=True)
    for name, b in outs:
        open(os.path.join(a.out_dir, name), 'wb').write(b)
        print(f'{name}  {len(b)} bytes  sha256 {sha(b)}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
