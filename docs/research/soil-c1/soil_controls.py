#!/usr/bin/env python3
"""Focused controls for soil_build.py and the 4-degree soil table (GPT soil C1 review, 25 Nov: H1, H2, G3, fixtures).
Usage: soil_controls.py <g4-soil table.json> <dir of the 24 Nov per-map outputs>
Groups: A weights; B synthetic end-to-end geometry, conservation and no-data; C fail-closed input checks; D every cell of the real table
against the 24 Nov per-map outputs; E named regressions and fixtures; F reference display text (soil_reference.py; the page must
reproduce it); G table validation before the sparse rule (GPT R2-1); H layer classes (rev 3 §1b)."""
import sys, os, json, math, tempfile, inspect, hashlib, copy
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import soil_build as B

ok = fail = 0
def check(name, cond, detail=''):
    global ok, fail
    if cond: ok += 1
    else: fail += 1; print('FAIL', name, detail)

from soil_reference import fmt, display, validate_table, load_table, layer_class, BINS

# ---------- A. weights ----------
W = B.weights(np.array([0., 1, 2, 3]), np.array([0., 1.5, 3])).toarray()
check('A1 split overlap', np.allclose(W, [[1, 0], [.5, .5], [0, 1]]))
W = B.weights(np.array([-3., -1, 1]), np.array([-2., 0, 2])).toarray()
check('A2 negative coordinates', np.allclose(W, [[.5, 0], [.5, .5]]), W)
W = B.weights(np.array([0., 1, 2]), np.array([1., 2])).toarray()
check('A3 touching edge gives no weight', np.allclose(W, [[0], [1]]))
W = B.weights(np.array([0., 1, 2]), np.array([-1e12, 0, 2, 1e12])).toarray()
check('A4 aligned intervals', np.allclose(W, [[0, 1, 0], [0, 1, 0]]))
W = B.weights(np.array([0., 4]), np.array([1., 2, 3])).toarray()
check('A5 clipped coverage', np.allclose(W, [[.25, .25]]))
W = B.weights(np.array([0., 10]), np.array([-1e12, 0, 10, 1e12])).toarray()
check('A6 rows sum to 1 with outside bins', np.allclose(W.sum(1), 1))

# ---------- B. synthetic end-to-end (real pyproj, scipy and matrix products) ----------
from pyproj import Transformer, CRS
crs = CRS.from_proj4('+proj=cea +lat_ts=30 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs')
y2 = Transformer.from_crs('EPSG:4326', crs, always_xy=True).transform(0, 2)[1]      # parallel 2 N: border of rows 22 and 23
T = (1000.0, 0.0, -1500.0, 0.0, -1000.0, y2 + 1500.0)                                 # 3 x 3 km straddling lon 0 and lat 2 N
Wx, Wy = B.grid_weights(T, 3, 3, crs)
dr = np.array([[1., 2, 4], [8, np.nan, 16], [0, 32, 64]])
bu = np.array([[0., 0, 0], [0, np.nan, 1], [0, 0, 0]])
ex = np.array([[100., 50, 0], [0, 100, 0], [0, 0, 20]])
acc, raw = B.aggregate(lambda r0, r1: dict(drained=dr[r0:r1].copy(), burned=bu[r0:r1].copy(), extent=ex[r0:r1].copy()), 3, Wx, Wy, 1.0, strip=2)
# bins (R = r + 1, C = c + 1): north-west r23 c44, north-east r23 c45, south-west r22 c44, south-east r22 c45
NW, NE, SW, SE = (24, 45), (24, 46), (23, 45), (23, 46)
D = acc['drained_Mg']
exp = {NW: 1 + 2 * .5 + 8 * .5, NE: 2 * .5 + 4 + 16 * .5, SW: 8 * .5 + 0 + 32 * .5, SE: 16 * .5 + 32 * .5 + 64}
for k, v in exp.items():
    check(f'B1 drained bin {k}', abs(D[k] - v) < 1e-9, (D[k], v))
check('B2 conservation (NaN excluded)', abs(D.sum() - np.nansum(dr)) < 1e-9 and abs(raw['drained'] - np.nansum(dr)) < 1e-9)
check('B3 incomplete footprint: the NaN cell splits 0.25 km2 into each bin',
      all(abs(acc['nan_km2'][k] - .25) < 1e-9 for k in exp) and abs(acc['nan_km2'].sum() - 1) < 1e-9)
check('B4 organic area', abs(acc['organic_km2'][NW] - (1 + .5 * .5 + .25)) < 1e-9 and abs(acc['organic_km2'].sum() - 2.7) < 1e-9)
check('B5 burned sum and positive footprint', abs(acc['burned_Mg'][NE] - .5) < 1e-9 and abs(acc['burned_pos_km2'].sum() - 1) < 1e-9)
check('B6 total area 9 km2, nothing outside', abs(acc['total_km2'].sum() - 9) < 1e-9 and acc['total_km2'][[0, -1], :].sum() == 0)
check('B7 sig() keeps tiny positives', B.sig(1e-30) > 0 and B.sig(0.0444444) == 0.0444444 and B.sig(0) == 0)

# ---------- C. fail-closed input checks ----------
def raises(fn):
    try: fn(); return False
    except B.InputError: return True
def _err(fn):
    try: fn(); return None
    except B.InputError as e: return e
run = lambda d, b, e: B.aggregate(lambda r0, r1: dict(drained=d, burned=b, extent=e), 3, Wx, Wy, 1.0, strip=3)
good = lambda: (dr.copy(), bu.copy(), ex.copy())
d, b, e = good(); d[0, 0] = np.inf
check('C1 infinite emissions refused', raises(lambda: run(d, b, e)))
d, b, e = good(); b[0, 0] = -1
check('C2 negative emissions refused', raises(lambda: run(d, b, e)))
d, b, e = good(); e[0, 0] = np.nan
check('C3 NaN extent refused', raises(lambda: run(d, b, e)))
d, b, e = good(); e[0, 0] = 101
check('C4 extent above 100 refused', raises(lambda: run(d, b, e)))
d, b, e = good(); b[1, 1] = 0
check('C5 differing drained/burned NaN masks refused', raises(lambda: run(d, b, e)))
check('C6 good synthetic input accepted', not raises(lambda: run(*good())))
try:
    import rasterio
    from rasterio.transform import Affine
    with tempfile.TemporaryDirectory() as td:
        def tif(name, w, h, tr, tags):
            p = os.path.join(td, name)
            with rasterio.open(p, 'w', driver='GTiff', width=w, height=h, count=1, dtype='float32', crs=crs, transform=Affine(*tr)) as o:
                o.write(np.zeros((1, h, w), 'float32')); o.update_tags(**tags)
            return p
        tg = dict(release='v1.0.1', units=B.EMIS_UNITS, missing_data=B.EMIS_MISSING, period='2021_2024')
        check('C7 size guard reached', (lambda: (lambda e: 'size' in str(e))(_err(lambda: B.open_checked(tif('a.tif', 4, 4, B.GRID['transform'], tg), 'emissions', '2021_2024'))))())
except ImportError:
    check('C7 rasterio available', False)

# C8 (GPT R2-2): an otherwise-valid header mock reaches the tag guard; the units guard alone refuses it; without that guard it passes.
class FakeDS:
    def __init__(self, tags): self._t = tags; self.count, self.dtypes = 1, ('float32',); self.width, self.height = B.GRID['width'], B.GRID['height']; self.transform, self.crs = B.GRID['transform'], crs
    def tags(self): return dict(self._t)
import rasterio as _rio
_open = _rio.open
def with_fake(tags, fn):
    _rio.open = lambda path, *a, **k: FakeDS(tags)
    try: return fn()
    finally: _rio.open = _open
tg = dict(release='v1.0.1', units=B.EMIS_UNITS, missing_data=B.EMIS_MISSING, period='2021_2024')
check('C8a valid header mock accepted (reaches every guard)', not raises(lambda: with_fake(tg, lambda: B.open_checked('x.tif', 'emissions', '2021_2024'))))
e = _err(lambda: with_fake(dict(tg, units='Mg ha-1 yr-1'), lambda: B.open_checked('x.tif', 'emissions', '2021_2024')))
check('C8b wrong units refused by the tag guard, not the size guard', e is not None and 'tags' in str(e) and 'size' not in str(e), e)
src = inspect.getsource(B.open_checked).replace("t.get('units') == EMIS_UNITS and ", '')
ns = dict(vars(B)); exec(compile(src, 'mutant', 'exec'), ns)
check('C8c mutation: without the units guard the wrong-units mock passes, so C8b depends on that guard',
      not raises(lambda: with_fake(dict(tg, units='Mg ha-1 yr-1'), lambda: ns['open_checked']('x.tif', 'emissions', '2021_2024'))))
e = _err(lambda: with_fake(dict(tg, period='2016_2020'), lambda: B.open_checked('x.tif', 'emissions', '2021_2024')))
check('C8d wrong period tag refused', e is not None and 'tags' in str(e))
e = _err(lambda: with_fake(dict(tg, units='percent'), lambda: B.open_checked('x.tif', 'extent')))
check('C8e wrong extent units refused', e is not None and 'units' in str(e))

# ---------- D. every cell of the real table against the 24 Nov per-map outputs ----------
tab = json.load(open(sys.argv[1])); old_dir = sys.argv[2]
cells = tab['cells']
old = {(c, p): json.load(open(os.path.join(old_dir, f'{c}_{p}.json'))) for c in B.COMPONENTS for p in B.PERIODS}
old_ids = set().union(*[{k for k, v in o['cells'].items() if v['sum_Mg'] or v['nan_km2'] or v['organic_km2']} for o in old.values()])
extra = set(cells) - old_ids
check('D1 every per-map cell with a non-zero field is listed; any extra cell is one whose organic area was below the per-map 0.0005 rounding',
      old_ids <= set(cells) and all(0 < cells[c]['organic_km2'] < 5e-4 for c in extra), sorted(extra))
print('cells rescued from the per-map 3-decimal rounding:', {c: cells[c]['organic_km2'] for c in sorted(extra)})
bad = []
for cid, rec in cells.items():
    if rec['has_mapped_organic_soil'] != (rec['organic_km2'] > 0): bad.append(('flag', cid))
    if rec['has_mapped_organic_soil'] and fmt(rec['organic_km2'], 'km²').startswith('0 '): bad.append(('area shows 0', cid))
    for p in B.PERIODS:
        q = rec['periods'][p]
        o = old[('drained', p)]['cells'].get(cid)
        if o and abs(o['organic_km2'] - rec['organic_km2']) > 6e-4 + 1e-5 * rec['organic_km2']: bad.append(('organic vs per-map', cid))
        for c in B.COMPONENTS:
            oc = old[(c, p)]['cells'].get(cid, dict(sum_Mg=0, nan_km2=0))
            if abs(oc['sum_Mg'] - q[c]['Mg']) > 6e-4 + 1e-5 * abs(oc['sum_Mg']): bad.append(('Mg vs per-map', cid, p, c))
            if (q[c]['state'] == 'positive') != (q[c]['Mg'] > 0): bad.append(('state', cid, p, c))
            if q[c]['state'] == 'positive' and fmt(q[c]['Mg'], 't').startswith('0 '): bad.append(('positive shows 0', cid, p, c))
            if abs(oc['nan_km2'] - q['incomplete_source_footprint_km2']) > 6e-4: bad.append(('footprint vs per-map', cid, p, c))
        if (q['coverage'] == 'incomplete') != (q['incomplete_source_footprint_km2'] > 0): bad.append(('coverage', cid, p))
check('D2 per-cell: flags from unrounded values, no positive shown as 0, agreement with per-map outputs', not bad, bad[:10])
small = [cid for cid, r in cells.items() if 0 < r['organic_km2'] < 0.05]
check('D3 the small-area cells that the 24 Nov one-decimal table turned to 0.0 keep their flag', len(small) >= 30 and all(cells[c]['has_mapped_organic_soil'] for c in small), len(small))
for p in B.PERIODS:
    for c in B.COMPONENTS:
        s = sum(r['periods'][p][c]['Mg'] for r in cells.values())
        check(f'D4 {p} {c} table sum = raster sum', abs(s - tab['meta']['totals'][p][c + '_Mg']) < 1e-5 * tab['meta']['totals'][p][c + '_Mg']
              and abs(tab['meta']['totals'][p][c + '_Mg'] - old[(c, p)]['global_sum_Mg']) < 1e-3)
check('D5 masks verified and no unknown cells', tab['meta']['masks'].startswith('drained and burned NaN masks verified') and tab['meta']['checks']['unknown_cells'] == [])

# ---------- E. named regressions and fixtures ----------
for cid, area in (('31_78', 0.044), ('17_89', 0.012), ('35_61', 0.024)):
    r = cells.get(cid)
    check(f'E1 {cid} keeps mapped organic soil', r and r['has_mapped_organic_soil'] and abs(r['organic_km2'] - area) < 6e-4, r and r['organic_km2'])
check('E2 31_78 latest drained positive', cells['31_78']['periods']['2021_2024']['drained']['state'] == 'positive')
check('E3 35_61 2011-15 burned positive', cells['35_61']['periods']['2011_2015']['burned']['state'] == 'positive')
big = max(cells, key=lambda k: cells[k]['periods']['2021_2024']['drained']['Mg'])
check('E4 22_70 is the largest drained cell', big == '22_70', big)
i = cells['38_39']['periods']
check('E5 38_39 incomplete only in 2011-15 and 2016-20', [p for p in B.PERIODS if i[p]['coverage'] == 'incomplete'] == ['2011_2015', '2016_2020'])
check('E6 38_39 burned is a partial zero there', i['2011_2015']['burned']['state'] == 'zero' and i['2011_2015']['coverage'] == 'incomplete')
z = cells['13_27']['periods']['2021_2024']
check('E7 13_27 mapped soil with model zeros', cells['13_27']['has_mapped_organic_soil'] and z['drained']['state'] == z['burned']['state'] == 'zero')
check('E8 14_49 omitted under the sparse rule', '14_49' not in cells and 'not listed has no mapped organic soil' in tab['meta']['sparse_rule'])

# ---------- F. reference display text ----------
t = display(tab, '31_78')
check('F1 31_78 small area shown as a positive', 'mapped organic soil ≈ 0.044 km²' in t, t)
t = display(tab, '13_27')
check('F2 neutral model-zero sentence', 'does not establish zero real-world emissions' in t and 'no disturbance' not in t, t)
t = display(tab, '38_39', '2011_2015')
check('F3 incomplete wording (footprint, sum of available cells)', 'source raster cells covering about' in t and 'Values sum the available raster cells' in t, t)
check('F4 omitted cell', display(tab, '14_49') == 'no organic soil mapped in this cell by this model')
check('F5 table unavailable is unknown, never 0', display(None, '22_70').startswith('unknown'))
check('F6 missing period is unknown', display(tab, '22_70', '1999_2000').startswith('unknown'))
mal = dict(tab, cells={'22_70': {'has_mapped_organic_soil': True, 'organic_km2': 5, 'periods': {'2021_2024': {'coverage': 'complete'}}}})
check('F7 malformed record is unknown', display(mal, '22_70').startswith('unknown'))
check('F8 id outside the domain is unknown', display(tab, '45_0').startswith('unknown') and display(tab, 'x').startswith('unknown'))
nonecov = copy.deepcopy(tab); nonecov['cells']['22_70']['periods']['2021_2024'].update(coverage='none', incomplete_source_footprint_km2=169000.0,
    drained={'Mg': None, 'state': 'unknown'}, burned={'Mg': None, 'state': 'unknown'})
check('F9a the coverage-none fixture is itself a valid table', validate_table(nonecov) == (True, None))
check('F9 fully missing coverage is unknown, never 0', display(nonecov, '22_70') == 'unknown: the model has no estimate for any part of this cell in this period')
check('F10 two significant figures', fmt(305074153, 't') == '310,000,000 t' and fmt(34909, 't') == '35,000 t' and fmt(3.14, 't') == '3.1 t'
      and fmt(0.044, 'km²') == '0.044 km²' and fmt(9.94, 'km²') == '9.9 km²' and fmt(9.952, 'km²') == '10 km²' and fmt(0.004, 'km²') == '<0.01 km²', (fmt(305074153, 't'), fmt(34909, 't')))

# ---------- G. table validation before the sparse rule (GPT R2-1) ----------
check('G1 empty meta and cells is unavailable, not "no soil"', display({'meta': {}, 'cells': {}}, '22_70').startswith('unknown'))
check('G2 unsupported period on an absent cell is unknown', display(tab, '14_49', '1999_2000').startswith('unknown'))
neg = copy.deepcopy(tab); neg['cells']['22_70']['periods']['2021_2024']['drained']['Mg'] = -1
check('G3 positive state with a negative value makes the table unavailable', display(neg, '22_70').startswith('unknown') and display(neg, '14_49').startswith('unknown'))
def mutate(f):
    t = copy.deepcopy(tab); f(t); return validate_table(t)[0]
muts = {
    'wrong version': lambda t: t['meta'].__setitem__('version', '1.0.2'),
    'wrong grid': lambda t: t['meta']['grid'].__setitem__('rows', 46),
    'period missing from meta': lambda t: t['meta']['totals'].pop('2021_2024'),
    'sparse rule missing': lambda t: t['meta'].pop('sparse_rule'),
    'cell id outside domain': lambda t: t['cells'].__setitem__('45_0', t['cells']['22_70']),
    'non-canonical cell id': lambda t: t['cells'].__setitem__('022_70', t['cells'].pop('22_70')),
    'flag disagrees with area': lambda t: t['cells']['31_78'].__setitem__('organic_km2', 0),
    'area NaN': lambda t: t['cells']['31_78'].__setitem__('organic_km2', float('nan')),
    'boolean as number': lambda t: t['cells']['31_78'].__setitem__('organic_km2', True),
    'period missing in a record': lambda t: t['cells']['22_70']['periods'].pop('2001_2005'),
    'zero state with a value': lambda t: t['cells']['13_27']['periods']['2021_2024']['drained'].__setitem__('Mg', 5),
    'positive state with 0': lambda t: t['cells']['22_70']['periods']['2021_2024']['burned'].__setitem__('Mg', 0),
    'Mg as string': lambda t: t['cells']['22_70']['periods']['2021_2024']['burned'].__setitem__('Mg', '5'),
    'unknown state under complete coverage': lambda t: t['cells']['22_70']['periods']['2021_2024']['burned'].update(state='unknown', Mg=None),
    'complete coverage with a footprint': lambda t: t['cells']['22_70']['periods']['2021_2024'].__setitem__('incomplete_source_footprint_km2', 1),
    'incomplete coverage without a footprint': lambda t: t['cells']['38_39']['periods']['2011_2015'].__setitem__('incomplete_source_footprint_km2', 0),
    'unknown coverage value': lambda t: t['cells']['22_70']['periods']['2021_2024'].__setitem__('coverage', 'partial'),
}
bad = [k for k, f in muts.items() if mutate(f)]
check(f'G4 {len(muts)} malformed-table mutations each make the table unavailable', not bad, bad)
check('G5 the real table validates', validate_table(tab) == (True, None))
raw = open(sys.argv[1], 'rb').read(); sha = hashlib.sha256(raw).hexdigest()
check('G6 pinned identity: exact bytes load; a truncated or different file does not',
      load_table(raw, sha)[0] is not None and load_table(raw[:-10], sha)[0] is None and load_table(raw, '0' * 64)[0] is None)

# ---------- H. layer classes (rev 3 §1b) ----------
check('H1 22_70 drained in the top class', layer_class(tab, '22_70', 'drained') == ('bin', 5, False))
check('H2 13_27 is a model zero over complete coverage, not no-soil or unknown', layer_class(tab, '13_27', 'drained') == ('zero', False))
check('H3 14_49 is no-soil', layer_class(tab, '14_49', 'burned') == 'no-soil')
check('H4 38_39 2011-15: the burned zero keeps its incomplete coverage, like the drained value (GPT preview review H1)', layer_class(tab, '38_39', 'burned', '2011_2015') == ('zero', True) and layer_class(tab, '38_39', 'drained', '2011_2015')[2] is True)
check('H5 invalid table, component or period is unavailable', layer_class({'meta': {}, 'cells': {}}, '22_70', 'drained') == 'unavailable'
      and layer_class(tab, '22_70', 'total') == 'unavailable' and layer_class(tab, '22_70', 'drained', '1999_2000') == 'unavailable')
check('H6 coverage none is unknown, never zero', layer_class(nonecov, '22_70', 'drained') == 'unknown' and layer_class(nonecov, '22_70', 'burned') == 'unknown')
print('22_70:', display(tab, '22_70')); print('38_39 2011-15:', display(tab, '38_39', '2011_2015'))
print(f'{ok} passed, {fail} failed'); sys.exit(1 if fail else 0)
