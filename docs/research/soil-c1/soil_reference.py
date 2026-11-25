#!/usr/bin/env python3
"""Reference contract for reading the 4-degree organic-soil table (GPT rev 2 recheck, R2-1). The page's code must reproduce it.

load_table(raw_bytes, expected_sha256) -> (table, None) or (None, why): the pinned content identity, then JSON, then validate_table.
validate_table(table) -> (True, None) or (False, why): the whole table is checked once; any failure makes it unavailable everywhere.
display(table, cell_id, period) -> text. The cell id and the period are checked BEFORE the sparse rule is applied, and an absent cell
means "no organic soil mapped" only in a table that passed validate_table. Everything else is unknown, never zero."""
import hashlib, json, math, re

PERIODS = ['2001_2005', '2006_2010', '2011_2015', '2016_2020', '2021_2024']
COMPONENTS = ['drained', 'burned']
COVERAGE = ('complete', 'incomplete', 'none')
STATES = ('positive', 'zero', 'unknown')
CELL_ID = re.compile(r'^(\d{1,2})_(\d{1,2})$')
NR, NC = 45, 90


def fmt(x, unit):
    """Two significant figures for display; a positive never shows as 0."""
    if x == 0: return f'0 {unit}'
    if x < 0.01: return f'<0.01 {unit}'
    v = float(f'{x:.1e}')
    d = max(0, 1 - int(math.floor(math.log10(v))))
    if v >= 10: v = int(v)
    return (f'{v:,}' if isinstance(v, int) else f'{v:,.{d}f}') + f' {unit}'


def cell_in_domain(cid):
    m = CELL_ID.match(cid) if isinstance(cid, str) else None
    return bool(m) and int(m.group(1)) < NR and int(m.group(2)) < NC and cid == f'{int(m.group(1))}_{int(m.group(2))}'


def _num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) and x >= 0


def validate_table(t):
    if not isinstance(t, dict) or not isinstance(t.get('meta'), dict) or not isinstance(t.get('cells'), dict):
        return False, 'not a soil table'
    m = t['meta']
    if m.get('version') != '1.0.1' or m.get('doi') != '10.5281/zenodo.22137130':
        return False, 'unexpected product version'
    g = m.get('grid')
    if not isinstance(g, dict) or (g.get('id'), g.get('rows'), g.get('cols')) != ('g4', NR, NC):
        return False, 'unexpected grid'
    if not isinstance(m.get('totals'), dict) or sorted(m['totals']) != PERIODS:
        return False, 'unexpected reporting periods'
    if not isinstance(m.get('sparse_rule'), str) or 'not listed has no mapped organic soil' not in m['sparse_rule']:
        return False, 'sparse rule missing'
    if not t['cells']:
        return False, 'no cells'
    for cid, r in t['cells'].items():
        bad = lambda why: (False, f'malformed record {cid}: {why}')
        if not cell_in_domain(cid): return bad('id outside the 45 x 90 domain')
        if not isinstance(r, dict) or not isinstance(r.get('has_mapped_organic_soil'), bool) or not _num(r.get('organic_km2')):
            return bad('organic-soil fields')
        if r['has_mapped_organic_soil'] != (r['organic_km2'] > 0): return bad('flag disagrees with area')
        ps = r.get('periods')
        if not isinstance(ps, dict) or sorted(ps) != PERIODS: return bad('periods')
        for p in PERIODS:
            q = ps[p]
            if not isinstance(q, dict) or q.get('coverage') not in COVERAGE or not _num(q.get('incomplete_source_footprint_km2')):
                return bad(f'{p} coverage')
            if (q['coverage'] == 'complete') != (q['incomplete_source_footprint_km2'] == 0): return bad(f'{p} coverage and footprint disagree')
            for c in COMPONENTS:
                s = q.get(c)
                if not isinstance(s, dict) or s.get('state') not in STATES: return bad(f'{p} {c} state')
                st, mg = s['state'], s.get('Mg')
                if st == 'unknown':
                    if mg is not None or q['coverage'] != 'none': return bad(f'{p} {c} unknown state')
                elif q['coverage'] == 'none' or not _num(mg) or (st == 'positive') != (mg > 0):
                    return bad(f'{p} {c} value and state disagree')
    return True, None


def load_table(raw, expected_sha256):
    if not isinstance(raw, (bytes, bytearray)) or hashlib.sha256(raw).hexdigest() != expected_sha256:
        return None, 'the soil table is not the pinned version'
    try:
        t = json.loads(raw)
    except ValueError:
        return None, 'the soil table is not readable'
    ok, why = validate_table(t)
    return (t, None) if ok else (None, why)


def display(table, cid, period='2021_2024'):
    ok, why = validate_table(table)
    if not ok:
        return 'unknown: the soil table is not available'
    if not cell_in_domain(cid):
        return 'unknown: not a 4-degree cell'
    if period not in PERIODS:
        return 'unknown: no such reporting period in this product'
    rec = table['cells'].get(cid)
    if rec is None:
        return 'no organic soil mapped in this cell by this model'
    p = rec['periods'][period]
    if p['coverage'] == 'none':
        return 'unknown: the model has no estimate for any part of this cell in this period'
    parts = []
    for c in COMPONENTS:
        s = p[c]
        parts.append(f'{c} ≈ {fmt(s["Mg"], "t CO₂e per year")}' if s['state'] == 'positive'
                     else f'{c}: 0 assigned by this model in this period; this does not establish zero real-world emissions')
    parts.append(f'mapped organic soil ≈ {fmt(rec["organic_km2"], "km²")}' if rec['has_mapped_organic_soil'] else 'no organic soil mapped')
    if p['coverage'] == 'incomplete':
        parts.append(f'incomplete model coverage: source raster cells covering about {fmt(p["incomplete_source_footprint_km2"], "km²")} '
                     'within this 4° cell have missing estimates. Values sum the available raster cells')
    return ' · '.join(parts)


# Layer classes for the proposed optional globe layer (rev 3 §1b). Bounds are t CO2e per year per WHOLE 4-degree cell.
BINS = [(0, 1e3), (1e3, 1e4), (1e4, 1e5), (1e5, 1e6), (1e6, 1e7), (1e7, math.inf)]


def layer_class(table, cid, component, period='2021_2024'):
    """'unavailable' | 'no-soil' | 'unknown' | ('zero', incomplete) | ('bin', i, incomplete).
    Coverage is kept for zeros as for values (GPT preview review H1, 25 Nov): a 0 summed over part of a cell is incomplete too."""
    if not validate_table(table)[0] or component not in COMPONENTS or period not in PERIODS or not cell_in_domain(cid):
        return 'unavailable'
    rec = table['cells'].get(cid)
    if rec is None:
        return 'no-soil'
    p = rec['periods'][period]
    s = p[component]
    if not rec['has_mapped_organic_soil'] and s['state'] == 'zero':
        return 'no-soil'
    if s['state'] == 'unknown': return 'unknown'
    if s['state'] == 'zero': return ('zero', p['coverage'] == 'incomplete')
    i = next(k for k, (lo, hi) in enumerate(BINS) if lo <= s['Mg'] < hi)
    return ('bin', i, p['coverage'] == 'incomplete')
