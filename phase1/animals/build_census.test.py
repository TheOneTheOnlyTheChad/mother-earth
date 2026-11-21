"""Mother Earth — tests for the colony-census build (animals-tab-rc, stage 3; ANIMALS-PENGUIN-CHART-PROPOSAL rev 1.1: P1 to P7, P19).
Part 1 (always): made-up zips. Each one is RE-PINNED in a copy of the config (zip and inner CSV checksums and sizes), so the
  parser rule under test is reached and is the rule that stops the build; 1a shows an un-pinned change stops at the checksum.
Part 2 (always): the committed display file, manifest and list agree with each other, with the audit's per-colony table (typed
  here from docs/research/animals-source-audit/PENGUIN-COUNTS.md rev 2.1 §5) and with a second, independent derivation of the
  later-file difference counts from that audit's §6 list.
Part 3 (only with the real input): set ME_PENGUIN_ZIP to the pinned zip. Then a fresh build gives the committed bytes, and an
  independent re-read of the CSV gives the same 902 cell states. Without it Part 3 prints NOT RUN. The zip is not in the repository.
Run: python3 -I phase1/animals/build_census.test.py"""
import copy, csv, hashlib, io, json, os, subprocess, sys, tempfile, zipfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, HERE)
import build_census as b
A = os.path.join(ROOT, 'assets', 'animals'); sha = lambda x: hashlib.sha256(x).hexdigest()
npass = nfail = 0
def ok(name, cond, got=None):
    global npass, nfail
    if cond: npass += 1
    else: nfail += 1; print('FAIL  ' + name + ('' if got is None else '\n      got: ' + repr(got)[:700]))

CFG = json.load(open(os.path.join(HERE, 'african-penguin-census.json'), encoding='utf-8'))
# ---------- Part 1: a made-up census of three colonies, 2001 to 2006
COLS = ['Alpha', 'Beta', 'Gamma']
BASE_ROWS = [  # year, Alpha, Beta, Gamma
    ['2001', '0.1', '50', 'NA'],
    ['2002', 'NA', '60', '7'],
    ['2003', '5', 'NA', 'NA'],
    ['2004', '9', '', '7'],
    ['2005', '12', '80', '3'],
    ['2006', '11', '80', 'NA']]
def cfg0():
    c = copy.deepcopy(CFG); c['colonies'] = COLS; c['years'] = {'first': 2001, 'last': 2006}; c['markers'] = [['Alpha', 2001]]
    c['countries'] = [{'name': 'North', 'first': 'Alpha', 'count': 2}, {'name': 'South', 'first': 'Gamma', 'count': 1}]
    c['expect'] = {'counts': 11, 'no_count': 6, 'markers': 1, 'empty_cells': 1}
    c['later_file']['differing_cells'] = [['Beta', 2005], ['Beta', 2006], ['Gamma', 2002]]; c['later_file']['expect_total'] = 3
    return c
def mkzip(rows=None, header=None, files=None, name='Afr_penguin.csv'):
    text = '\r\n'.join(','.join(r) for r in [header or ['Year'] + COLS] + (rows if rows is not None else BASE_ROWS))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w') as z:
        z.writestr(name, text)
        for n, t in (files or []): z.writestr(n, t)
    return buf.getvalue(), text.encode()
def run(rows=None, header=None, edit=None, pin=True, pin_csv=True, files=None, name='Afr_penguin.csv'):
    zraw, craw = mkzip(rows, header, files, name); c = cfg0()
    if pin: c['source_zip'].update(bytes=len(zraw), sha256=sha(zraw))
    if pin_csv: c['source_file'].update(bytes=len(craw), sha256=sha(craw))
    if edit: edit(c)
    outs = b.build(c, zraw); return json.loads(outs[0][1]), json.loads(outs[1][1]), json.loads(outs[2][1]), outs
def stops(**kw):
    try: run(**kw); return None
    except b.BuildError as e: return str(e)
def alt(i, j, v): r = [list(x) for x in BASE_ROWS]; r[i][j] = v; return r

ok('1a P19 a change that is NOT re-pinned stops at the checksum, before any parsing', 'not the pinned file' in (stops(rows=alt(4, 1, '13'), pin=False) or ''))
ok('1b P1 a zip whose CSV is not the pinned CSV stops the build (zip pinned, CSV not)', 'CSV inside the zip is not the pinned file' in (stops(rows=alt(4, 1, '13'), pin_csv=False) or ''))
ok('1c P1 an extra file in the zip stops the build', 'exactly one file' in (stops(files=[('README.txt', 'x')]) or ''))
ok('1d P1 a differently named file in the zip stops the build', 'exactly one file' in (stops(name='other.csv') or ''))
d, m, cat, outs = run()
ok('1e the three states are kept apart: a count is an integer, no count is null, the marker is "m" and never a number', d['colonies'][0]['v'] == ['m', None, 5, 9, 12, 11] and d['colonies'][1]['v'] == [50, 60, None, None, 80, 80] and d['colonies'][2]['v'] == [None, 7, None, 7, 3, None] and b'0.1' not in outs[0][1], d)
ok('1f an empty cell is read as no count and is counted as an empty cell', m['totals'] == {'counts': 11, 'no_count': 6, 'markers': 1, 'empty_cells': 1, 'cells': 18, 'colonies': 3} and 'empty' in m['empty_cell_note'], m['totals'])
S = {c['name']: c for c in m['colonies']}
ok('1g summaries are computed: years counted, first, last, lowest, gaps inside, pairs of consecutive counted years, marker years', (S['Alpha']['counted_years'], S['Alpha']['first_year'], S['Alpha']['first_value'], S['Alpha']['last_year'], S['Alpha']['last_value'], S['Alpha']['lowest_value'], S['Alpha']['gaps_inside'], S['Alpha']['joined_pairs'], S['Alpha']['marker_years']) == (4, 2003, 5, 2006, 11, 5, 0, 3, [2001]) and
   (S['Beta']['gaps_inside'], S['Beta']['joined_pairs'], S['Gamma']['counted_years'], S['Gamma']['gaps_inside'], S['Gamma']['joined_pairs'], S['Gamma']['first_year'], S['Gamma']['last_year']) == (2, 2, 3, 1, 1, 2002, 2005), S)
ok('1h the highest value takes its earliest year when it occurs twice', (S['Beta']['highest_value'], S['Beta']['highest_year'], S['Gamma']['highest_value'], S['Gamma']['highest_year']) == (80, 2005, 7, 2002), S['Beta'])
ok('1i countries follow the file\'s own column order; the later-file counts are per colony', [c['country'] for c in m['colonies']] == ['North', 'North', 'South'] and [c['later_file_differing_years'] for c in m['colonies']] == [0, 2, 1] and m['later_file']['total_differing_cells'] == 3)
ok('1j the list pins the manifest and the manifest pins the display file; no sum across colonies is anywhere in the outputs', cat['populations'][0]['manifest_sha256'] == sha(outs[1][1]) and m['display']['sha256'] == sha(outs[0][1]) and m['display']['bytes'] == len(outs[0][1]) and not any(k in json.dumps(m) for k in ('"total_count"', '"sum"', '"trend"')))
# P3 each parser rule, on a re-pinned copy
ok('1k P3 a changed header name stops the build', 'header is not Year followed by' in (stops(header=['Year', 'Alpha', 'Betta', 'Gamma']) or ''))
ok('1l P3 a missing year stops the build', 'rows are not the years' in (stops(rows=BASE_ROWS[:3] + BASE_ROWS[4:]) or ''))
ok('1m P3 a repeated year stops the build', 'rows are not the years' in (stops(rows=BASE_ROWS[:4] + [BASE_ROWS[3]] + BASE_ROWS[5:]) or ''))
ok('1n P3 years out of order stop the build', 'rows are not the years' in (stops(rows=[BASE_ROWS[1], BASE_ROWS[0]] + BASE_ROWS[2:]) or ''))
bad = {'a decimal other than 0.1': '12.5', 'zero': '0', 'a negative': '-4', 'text': 'few', 'a leading space': ' 12', 'a leading zero': '012', 'an exponent': '1e3', 'lower-case na': 'na', '0.10': '0.10'}
res = {k: stops(rows=alt(4, 1, v)) for k, v in bad.items()}
ok('1o P3 each of these in a cell stops the build at the cell rule: ' + ', '.join(bad), all(r and 'is not a whole number of 1 or more' in r for r in res.values()), res)
ok('1p a row with a missing cell stops the build', 'cells, expected' in (stops(rows=BASE_ROWS[:5] + [['2006', '11', '80']]) or ''))
# P4 markers
ok('1q P4 a 0.1 marker in a cell the config does not list stops the build', 'a 0.1 marker in a cell the config does not list' in (stops(rows=alt(2, 3, '0.1')) or ''))
ok('1r P4 a count where the marker is expected stops the build', 'a count where the config expects' in (stops(rows=alt(0, 1, '4')) or ''))
ok('1s P4 no entry where the marker is expected stops the build', 'no entry where the config expects' in (stops(rows=alt(0, 1, 'NA')) or ''))
ok('1t expected totals that differ stop the build', 'the config expects' in (stops(edit=lambda c: c['expect'].__setitem__('counts', 12)) or ''))
ok('1u country groups that do not match the columns stop the build', 'first colony is not' in (stops(edit=lambda c: c['countries'][1].__setitem__('first', 'Beta')) or '') and 'do not cover every colony' in (stops(edit=lambda c: c['countries'].pop()) or ''))
ok('1v the later-file list: an unknown colony, a year out of range, a repeated cell or a wrong total each stop the build', 'unknown cell' in (stops(edit=lambda c: c['later_file']['differing_cells'].__setitem__(0, ['Delta', 2005])) or '') and 'unknown cell' in (stops(edit=lambda c: c['later_file']['differing_cells'].__setitem__(0, ['Beta', 2010])) or '') and
   'repeats a cell' in (stops(edit=lambda c: c['later_file']['differing_cells'].__setitem__(0, ['Beta', 2006])) or '') and 'expects 3' in (stops(edit=lambda c: c['later_file']['differing_cells'].pop()) or ''))
ok('1w a colony with no count at all stops the build', 'no count at all' in (stops(rows=[[r[0], r[1], r[2], 'NA'] for r in BASE_ROWS], edit=lambda c: c.pop('expect')) or ''))
# P2 --check and what is written
with tempfile.TemporaryDirectory() as tmp:
    zraw, craw = mkzip(); c = cfg0(); c['source_zip'].update(bytes=len(zraw), sha256=sha(zraw)); c['source_file'].update(bytes=len(craw), sha256=sha(craw))
    zp, cp, out = (os.path.join(tmp, x) for x in ('s.zip', 'c.json', 'out')); open(zp, 'wb').write(zraw); json.dump(c, open(cp, 'w'))
    args = ['--config', cp, '--source', zp, '--out-dir', out]
    def quiet(a):
        o = sys.stdout; sys.stdout = io.StringIO()
        try: return b.main(a)
        finally: sys.stdout = o
    r1 = quiet(args + ['--check']); made = os.path.exists(out) and os.listdir(out); r2 = quiet(args); files = sorted(os.listdir(out)); r3 = quiet(args + ['--check'])
    p = os.path.join(out, files[0]); x = bytearray(open(p, 'rb').read()); x[-4] ^= 1; open(p, 'wb').write(bytes(x)); r4 = quiet(args + ['--check'])
    open(zp, 'ab').write(b'x'); r5 = quiet(args + ['--check'])
    c2 = cfg0(); c2['record'] = {'TO_BE_READ_FROM_THE_RECORD': True}; json.dump(c2, open(cp, 'w')); r6 = quiet(args)
    ok('1x P2 --check: 3 when outputs are missing (writing nothing); 0 when identical; 3 when one byte differs; 2 when the build stops; a config whose record block is not filled in stops the build', (r1, bool(made), r2, r3, r4, r5, r6) == (3, False, 0, 0, 3, 2, 2), [r1, made, r2, r3, r4, r5, r6])
    ok('1y P2 the build writes the display file, the manifest and the list only: no source file', files == ['african-penguin-census-R1.json', 'african-penguin-census-R1.manifest.json', 'populations-R1.catalog.json'], files)

# ---------- Part 2: the committed files
cat_raw = open(os.path.join(A, 'populations-R1.catalog.json'), 'rb').read(); CAT = json.loads(cat_raw); ce = CAT['populations'][0]
mraw = open(os.path.join(A, ce['manifest']), 'rb').read(); M = json.loads(mraw); draw = open(os.path.join(A, M['display']['file']), 'rb').read(); D = json.loads(draw)
ok('2a the list pins the manifest, the manifest pins the display file, and the page script pins the list', sha(mraw) == ce['manifest_sha256'] and sha(draw) == M['display']['sha256'] and len(draw) == M['display']['bytes'] and sha(cat_raw) in open(os.path.join(ROOT, 'animals-census.js'), encoding='utf-8').read())
ok('2b P5 totals: 902 cells = 600 counts + 298 without a count + 4 markers; one empty cell; 22 colonies; 1979 to 2019', M['totals'] == {'counts': 600, 'no_count': 298, 'markers': 4, 'empty_cells': 1, 'cells': 902, 'colonies': 22} and M['period'] == {'first_year': 1979, 'last_year': 2019, 'years': 41} and D['years'] == list(range(1979, 2020)), M['totals'])
# the audit's table (PENGUIN-COUNTS.md rev 2.1 §5): colony, counts, first, last, gaps inside, marker year, lowest, highest, last count
AUDIT = [('Lamberts Bay', 19, 1979, 2005, 8, 2019, 9, 50, 10), ('Malgas Island', 33, 1979, 2019, 8, None, 5, 1022, 6), ('Marcus Island', 27, 1979, 2018, 13, None, 4, 1243, 4), ('Jutten Island', 30, 1979, 2019, 11, None, 67, 2878, 138),
    ('Vondeling Island', 32, 1979, 2019, 9, None, 82, 649, 112), ('Dassen Island', 31, 1979, 2019, 10, None, 1862, 24901, 1912), ('Robben Island', 37, 1983, 2019, 0, 1979, 9, 7798, 1190), ('Simonstown', 34, 1985, 2019, 1, 1979, 2, 1227, 932),
    ('Seal Island False Bay', 18, 1979, 2019, 23, None, 31, 95, 44), ('Stony Point', 31, 1982, 2019, 7, 1979, 1, 2533, 1705), ('Dyer Island', 32, 1979, 2019, 9, None, 951, 22655, 1071), ('Geyser Island', 16, 1979, 2012, 18, None, 1, 328, 2),
    ('Jahleel Island', 21, 1981, 2019, 18, None, 50, 578, 55), ('Brenton Island', 20, 1986, 2019, 14, None, 3, 38, 10), ('St Croix Island', 23, 1979, 2019, 18, None, 3638, 19478, 3638), ('Seal Island Algoa Bay', 20, 1990, 2019, 10, None, 78, 510, 95),
    ('Stag Island', 20, 1990, 2017, 8, None, 1, 50, 2), ('Bird Island', 26, 1981, 2019, 13, None, 572, 5376, 2378), ('Mercury', 33, 1985, 2019, 2, None, 1126, 3666, 2221), ('Ichaboe', 32, 1985, 2019, 3, None, 242, 3343, 242),
    ('Halifax', 32, 1981, 2019, 7, None, 259, 2224, 825), ('Possession', 33, 1985, 2019, 2, None, 327, 1205, 657)]
got = [(c['name'], c['counted_years'], c['first_year'], c['last_year'], c['gaps_inside'], (c['marker_years'] or [None])[0], c['lowest_value'], c['highest_value'], c['last_value']) for c in M['colonies']]
ok('2c P5 each colony\'s summary equals the audit\'s table, all 22 rows, in the file\'s order', got == AUDIT, [x for x, y in zip(got, AUDIT) if x != y][:3])
ok('2d the first 18 colonies are South Africa and the last 4 Namibia, as the record\'s methods say', [c['country'] for c in M['colonies']] == ['South Africa'] * 18 + ['Namibia'] * 4)
ok('2e display structure: 22 colonies of 41 entries, each a whole number of 1 or more, null or "m"; markers only at the four stated cells; no 0.1 and no zero anywhere', len(D['colonies']) == 22 and all(len(c['v']) == 41 and all(v is None or v == 'm' or (isinstance(v, int) and not isinstance(v, bool) and v >= 1) for v in c['v']) for c in D['colonies']) and
   sorted((c['name'], D['years'][i]) for c in D['colonies'] for i, v in enumerate(c['v']) if v == 'm') == [('Lamberts Bay', 2019), ('Robben Island', 1979), ('Simonstown', 1979), ('Stony Point', 1979)] and b'0.1' not in draw)
# a second, independent derivation of the later-file difference counts, from the audit's §6 list grouped by kind
SIX = {'value differs': ['Vondeling Island 2018', 'Mercury 2019', 'Ichaboe 2017', 'Ichaboe 2018', 'Ichaboe 2019', 'Halifax 1986', 'Halifax 2016', 'Halifax 2017', 'Halifax 2018', 'Possession 1985', 'Possession 2018', 'Possession 2019'],
       'count here, none later': ['Vondeling Island 2019', 'Mercury 2018', 'Possession 2016'],
       'none here, count later': ['Stony Point 1987', 'Seal Island Algoa Bay 1979', 'Stag Island 1981', 'Bird Island 1979', 'Bird Island 2002', 'Ichaboe 1979', 'Ichaboe 2016'],
       'marker here, no entry later': ['Lamberts Bay 2019']}
ok('2f the audit\'s kinds add up: 12 + 3 + 7 + 1 = 23 (the 24th, an empty cell against NA, is the same state)', [len(v) for v in SIX.values()] == [12, 3, 7, 1])
per = {}
for cells in SIX.values():
    for s in cells: per[s.rsplit(' ', 1)[0]] = per.get(s.rsplit(' ', 1)[0], 0) + 1
ok('2g P13 the per-colony later-file counts in the manifest equal this independent derivation: ten colonies, 23 cells; the other twelve are 0', {c['name']: c['later_file_differing_years'] for c in M['colonies'] if c['later_file_differing_years']} == per and len(per) == 10 and sum(per.values()) == 23 == M['later_file']['total_differing_cells'] and
   per == {'Ichaboe': 5, 'Halifax': 4, 'Possession': 4, 'Vondeling Island': 2, 'Mercury': 2, 'Bird Island': 2, 'Stony Point': 1, 'Seal Island Algoa Bay': 1, 'Stag Island': 1, 'Lamberts Bay': 1}, per)
def state(c, y): return D['colonies'][[x['name'] for x in D['colonies']].index(c)]['v'][y - 1979]
kinds_ok = all(isinstance(state(*s.rsplit(' ', 1)[:1], int(s.rsplit(' ', 1)[1])), int) for k in ('value differs', 'count here, none later') for s in SIX[k]) and all(state(s.rsplit(' ', 1)[0], int(s.rsplit(' ', 1)[1])) is None for s in SIX['none here, count later']) and state('Lamberts Bay', 2019) == 'm'
ok('2h each listed cell has, in this file, the state the audit\'s kind says (a count, no count, or the marker)', kinds_ok)
W = M['wording']
ok('2i P14 the agreed sentences are in the manifest word for word (unit, version note, no total, no count)', W['unit'] == 'Annual colony census: occupied nest sites (used as a breeding-pair proxy).' and W['version_note'] == "Historical census data from the 2021 deposit, ending in 2019. The authors' later analysis file extends to 2023 and differs in some overlapping entries. This chart uses the earlier deposit throughout." and
   W['no_total'] == 'No total is shown because the colonies counted vary between years; adding the available entries would not compare the same coverage or establish a complete population total.' and W['no_count'] == 'No count in this file' and 'highest count available' in W['unit_detail'] and 'not a count of individual birds' in W['unit_detail'])
R = M['record']
ok('2j the record block carries the citations and licence as read on the record, with the check date', R['dataset_citation_as_given'].startswith('Sherley, Richard; Crawford, Robert; de Blocq, Andrew et al. (2021). Data from:') and R['dataset_citation_as_given'].endswith('[Dataset]. Dryad. https://doi.org/10.5061/dryad.vx0k6djp7') and 'Ecology and Evolution' in R['paper_citation_as_given'] and R['licence_as_given'] == 'Public domain' and R['licence_url'] == 'https://creativecommons.org/publicdomain/zero/1.0/' and R['checked'] == '21 Nov 2026')
txt = json.dumps(M, ensure_ascii=False).lower()
ok('2k the manifest calls the differences nothing but differences, shows no later-file value, and carries no total, trend or category', 'correct' not in txt and not any(k in M for k in ('total', 'trend', 'category', 'status')) and 'endangered' not in txt)
jl = open(os.path.join(A, 'journeys-R1.catalog.json'), 'rb').read()
ok('2l P26 the journey list is byte-identical to Stage 2\'s (sha256 1386e4cc…), so every journey manifest and display file it pins is unchanged; the census is not in it', sha(jl) == '1386e4cc4fbc8c1c294ce867f42702c3c838fbde3c41fd9ce788fc275a77fafe' and b'penguin' not in jl and all(sha(open(os.path.join(A, e['manifest']), 'rb').read()) == e['manifest_sha256'] for e in json.loads(jl)['journeys']))
tracked = None
try: tracked = subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.splitlines()
except Exception: pass
if tracked is None: print('NOT RUN  2m as a tracked-file check: this copy has no Git metadata; the folder tree is scanned instead'); tracked = [os.path.relpath(os.path.join(dp, f), ROOT) for dp, dn, fn in os.walk(ROOT) for f in fn if '.git' + os.sep not in dp and 'node_modules' not in dp and '_baseline-main' not in dp]
SH = {CFG['source_zip']['sha256'], CFG['source_file']['sha256']}; NAMES = {CFG['source_zip']['name'], CFG['source_file']['name']}
badf = [f for f in tracked if os.path.basename(f) in NAMES or (f.lower().endswith(('.zip', '.csv')) and os.path.isfile(os.path.join(ROOT, f)) and sha(open(os.path.join(ROOT, f), 'rb').read()) in SH)]
ok('2m P7 the raw zip and CSV are not in the tree, by name or by checksum; _source-data/ is ignored', not badf and '_source-data/' in open(os.path.join(ROOT, '.gitignore'), encoding='utf-8').read().splitlines(), badf)

# ---------- Part 3: the real input
ZIP = os.environ.get('ME_PENGUIN_ZIP'); part3 = 'NOT RUN (set ME_PENGUIN_ZIP to the pinned zip)'
if ZIP:
    zraw = open(ZIP, 'rb').read(); outs = b.build(CFG, zraw)
    ok('3a P2 a fresh build from the pinned zip gives the committed display file, manifest and list, byte for byte', outs[0][1] == draw and outs[1][1] == mraw and outs[2][1] == cat_raw)
    rows = list(csv.DictReader(io.StringIO(zipfile.ZipFile(io.BytesIO(zraw)).read('Afr_penguin.csv').decode('utf-8'), newline='')))
    mine = {c['name']: [(None if r[c['name']] in ('NA', '') else 'm' if r[c['name']] == '0.1' else int(r[c['name']])) for r in rows] for c in D['colonies']}
    ok('3b P6 an independent re-read of the CSV gives the same 902 states as the display file', all(mine[c['name']] == c['v'] for c in D['colonies']) and [int(r['Year']) for r in rows] == D['years'] and sum(len(v) for v in mine.values()) == 902)
    ok('3c the source holds no zero and no decimal other than the four 0.1 markers', sorted({r[c] for r in rows for c in r if c != 'Year' and not r[c].isdigit()}) == ['', '0.1', 'NA'] and not any(r[c] == '0' for r in rows for c in r))
    part3 = 'run'
print(('PASSED' if not nfail else 'FAILED') + f'  {npass} passed, {nfail} failed; part 3 (real input): {part3}')
sys.exit(1 if nfail else 0)
