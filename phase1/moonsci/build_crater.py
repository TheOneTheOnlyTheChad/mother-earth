"""Build the Moon tab's CRaTER good-event bins (assets/moon/crater/). MOON-CRATER-PROPOSAL rev 2 §7, §8, §12, with GPT's rev 2 build notes 1-2.
Chad's go, 27 Nov 2026: page-only branch preview from the retained sources; no new acquisition.

Inputs: the two retained L2 secondary-science day files (NASA PDS PPI, LRO CRaTER bundle v2.4, release 67), pinned below by the
archive label MD5 and our sha256. Both are checked BEFORE any parsing; a mismatch stops the build.
Parsing: fixed field locations and lengths from the PDS4 label (1-based field_location), separators checked at every boundary,
types and ranges checked per field, the TIME string validated as a UTC whole second on the file's own day, strictly increasing.
Any failure stops the build (exit 1) — there is no partial output.
Bins (rev 2 §7.2-§7.3): records grouped by TIME into [start, start + 600 s); 144 bins on 10 June plus 11 June 00:00-00:10.
A bin is shown only with exactly 600 records, one per whole UTC second, all nominal; then N (integer GOOD sum) and T = 600 s are
written, and nothing else numeric (the page derives the rate N/T and the counting benchmark sqrt(N)/T). Any other bin is written as
withheld with its reason and record counts, never a zero. Assertions: the selected records (all of 10 June plus 11 June records
before 00:10:00) total 87,000; the GOOD sum over all bins equals the GOOD sum over those selected records; shown bins have 600
unique seconds.
Usage: python3 -I phase1/moonsci/build_crater.py --src <retained dir> [--out <json>] [--check]
  --check: build in memory and compare with the committed file byte for byte (exit 1 on any difference).
Fault tests live in phase1/moonsci/crater/test_build_crater.py, which imports this module; the builder itself has no fault switches. """
import argparse, hashlib, json, math, os, re, sys
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'moon', 'crater', 'crater-good-2026-06-10-R1.json')
REVISION = 'crater-good-2026-06-10-R1'
FILES = [  # name, UTC day, archive label MD5, our sha256 (checkpoints.jsonl lines 1-2), records in the label
    ('CRAT_L2_SEC_2026161_V01.TAB', '2026-06-10', 'd0b470e61745fbc88542043c8f3a4812',
     'f6d2c5373b4c72d341375bff438cd346b0abeb6c55be0bff3d80f4d294c35e25', 86400),
    ('CRAT_L2_SEC_2026162_V01.TAB', '2026-06-11', 'febb2bf5aa67f9192ac046239ec258f2',
     '81a547a42571f6b6b691d18642ae5ba0b4057d112ee059a5cf2469b25b270049', 86400),
]
REC = 194
# PDS4 label CRAT_L2_SEC_2026161_V01.xml: (name, field_location (1-based), field_length, kind). TIME's location is inside its quotes.
FIELDS = [('SECONDS', 1, 9, 'int'), ('FRACT', 11, 2, 'int'), ('TIME', 15, 19, 'time'),
          ('BIASCNTRL', 36, 1, 'int'), ('BIASCMD', 38, 1, 'int'), ('CALLOW', 40, 1, 'int'), ('CALHIGH', 42, 1, 'int'), ('CALRATE', 44, 1, 'int'),
          ('PROCDFLAG1', 46, 1, 'int'), ('PROCDFLAG2', 48, 1, 'int'), ('PROCDFLAG3', 50, 1, 'int'), ('PROCDFLAG4', 52, 1, 'int'),
          ('PROCDFLAG5', 54, 1, 'int'), ('PROCDFLAG6', 56, 1, 'int'), ('LASTCMD', 58, 5, 'int'), ('LASTVALUE', 64, 5, 'int'),
          ('DISCTHIN', 70, 5, 'int'), ('DISCTHICK', 76, 5, 'int'), ('MASK1', 82, 10, 'int'), ('MASK2', 93, 10, 'int'),
          ('SINGLE1', 104, 5, 'int'), ('SINGLE2', 110, 5, 'int'), ('SINGLE3', 116, 5, 'int'), ('SINGLE4', 122, 5, 'int'),
          ('SINGLE5', 128, 5, 'int'), ('SINGLE6', 134, 5, 'int'), ('GOOD', 140, 5, 'int'), ('REJECT', 146, 5, 'int'), ('TOTAL', 152, 5, 'int'),
          ('MOONVEC1', 158, 11, 'real'), ('MOONVEC2', 170, 11, 'real'), ('MOONVEC3', 182, 11, 'real')]
FLAGS = {'BIASCNTRL', 'BIASCMD', 'CALLOW', 'CALHIGH', 'CALRATE', 'PROCDFLAG1', 'PROCDFLAG2', 'PROCDFLAG3', 'PROCDFLAG4', 'PROCDFLAG5', 'PROCDFLAG6'}
NOMINAL = {'BIASCNTRL': 1, 'BIASCMD': 1, 'CALLOW': 0, 'CALHIGH': 0, 'PROCDFLAG1': 1, 'PROCDFLAG2': 1, 'PROCDFLAG3': 1,
           'PROCDFLAG4': 1, 'PROCDFLAG5': 1, 'PROCDFLAG6': 1, 'DISCTHIN': 71, 'DISCTHICK': 71, 'MASK1': 4294967295, 'MASK2': 4294967295}
INT_RE, REAL_RE = re.compile(r'^ *[0-9]+$'), re.compile(r'^ ?-?[0-9]\.[0-9]{4}e[+-][0-9]{2}$')
TIME_RE = re.compile(r'^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$')
T0 = datetime(2026, 6, 10, tzinfo=timezone.utc)
BIN_S, N_BINS = 600, 145
END = T0 + timedelta(seconds=BIN_S * N_BINS)


class BuildError(Exception):
    pass


def check_hashes(raw, name, md5, sha):
    if hashlib.md5(raw).hexdigest() != md5:
        raise BuildError(f'{name}: MD5 differs from the archive label')
    if hashlib.sha256(raw).hexdigest() != sha:
        raise BuildError(f'{name}: sha256 differs from the checkpoint')


def parse(raw, name, day, n_expected):
    """Strict fixed-field parse of one day file. Returns a list of (utc datetime, dict of fields)."""
    if len(raw) != REC * n_expected:
        raise BuildError(f'{name}: {len(raw)} bytes, expected {REC * n_expected}')
    out, prev = [], None
    for k in range(n_expected):
        r = raw[k * REC:(k + 1) * REC]
        if r[-2:] != b'\r\n':
            raise BuildError(f'{name} record {k + 1}: no CRLF')
        try:
            s = r[:-2].decode('ascii')
        except UnicodeDecodeError:
            raise BuildError(f'{name} record {k + 1}: not ASCII')
        f = {}
        for i, (fname, loc, ln, kind) in enumerate(FIELDS):
            a = loc - 1
            if kind == 'time':
                if s[a - 1] != '"' or s[a + ln] != '"':
                    raise BuildError(f'{name} record {k + 1}: TIME not quoted at its label location')
                end = a + ln + 1
            else:
                end = a + ln
            v = s[a:a + ln]
            if i + 1 < len(FIELDS):
                if s[end] != ',':
                    raise BuildError(f'{name} record {k + 1}: no separator after {fname}')
            elif end != REC - 2:
                raise BuildError(f'{name} record {k + 1}: last field does not end the record')
            if kind == 'int':
                if not INT_RE.match(v):
                    raise BuildError(f'{name} record {k + 1}: {fname} {v!r} is not a non-negative integer')
                f[fname] = int(v)
                if fname in FLAGS and f[fname] not in (0, 1):
                    raise BuildError(f'{name} record {k + 1}: flag {fname} = {f[fname]}')
            elif kind == 'real':
                if not REAL_RE.match(v):
                    raise BuildError(f'{name} record {k + 1}: {fname} {v!r} is not in %11.4e form')
                x = float(v)
                if not math.isfinite(x):
                    raise BuildError(f'{name} record {k + 1}: {fname} not finite')
                f[fname] = x
            else:
                if not TIME_RE.match(v):
                    raise BuildError(f'{name} record {k + 1}: TIME {v!r} not YYYY-MM-DDThh:mm:ss')
                try:
                    t = datetime.strptime(v, '%Y-%m-%dT%H:%M:%S').replace(tzinfo=timezone.utc)
                except ValueError:
                    raise BuildError(f'{name} record {k + 1}: TIME {v} is not a valid UTC time')
                if v[:10] != day:
                    raise BuildError(f'{name} record {k + 1}: TIME {v} outside the file day {day}')
                if prev is not None and t <= prev:
                    raise BuildError(f'{name} record {k + 1}: TIME {v} not strictly increasing')
                prev = t
                f['_t'] = t
        if f['TOTAL'] != f['GOOD'] + f['REJECT']:
            raise BuildError(f'{name} record {k + 1}: TOTAL != GOOD + REJECT')
        if f['FRACT'] > 99:
            raise BuildError(f'{name} record {k + 1}: FRACT out of range')
        out.append((f['_t'], f))
    return out


def nominal(f):
    return all(f[k] == v for k, v in NOMINAL.items())


def make_bins(records):
    """records: (utc, fields) of both days in time order. Returns (bins, selected count, selected GOOD sum)."""
    sel = [(t, f) for t, f in records if T0 <= t < END]
    bins = []
    for k in range(N_BINS):
        s = T0 + timedelta(seconds=BIN_S * k)
        e = s + timedelta(seconds=BIN_S)
        inb = [(t, f) for t, f in sel if s <= t < e]
        secs = {t for t, _ in inb}
        n_nom = sum(1 for _, f in inb if nominal(f))
        if len(inb) != BIN_S or len(secs) != BIN_S:
            bins.append({'withheld': 'incomplete', 'records': len(inb), 'nominal': n_nom})
        elif n_nom != BIN_S:
            bins.append({'withheld': 'non-nominal setting', 'records': len(inb), 'nominal': n_nom})
        else:
            bins.append({'N': sum(f['GOOD'] for _, f in inb), 'T': BIN_S})
    return bins, len(sel), sum(f['GOOD'] for _, f in sel)


def assemble(bins, n_sel, good_sel):
    if n_sel != 86400 + 600:
        raise BuildError(f'selected records {n_sel}, expected 87,000')
    shown = [b for b in bins if 'N' in b]
    if len(bins) != N_BINS:
        raise BuildError('bin count')
    if len(shown) == N_BINS and sum(b['N'] for b in shown) != good_sel:
        raise BuildError('GOOD over the bins differs from GOOD over the selected records')
    if len(shown) < N_BINS:
        # with withheld bins the totals cannot match; the build still requires every selected record to be accounted for
        if sum(b.get('records', BIN_S) for b in bins) != n_sel:
            raise BuildError('records over the bins differ from the selected records')
    rows = [[b['N'], b['T']] if 'N' in b else [None, None, b['withheld'], b['records'], b['nominal']] for b in bins]
    return {
        'schema': 'crater-good-bins-1',
        'revision': REVISION,
        'kind': 'dated example (archived record, not live)',
        'quantity': 'GOOD, the instrument\'s "Good Events Counter": events counted inside CRaTER on LRO per readout record',
        'not': 'not a radiation dose, a particle flux or a condition at any place on the Moon',
        'source': {'product': 'LRO CRaTER Level 2 secondary science (derived), urn:nasa:pds:lro-crater:data-der-sec v2.4',
                   'doi': '10.17189/2c1t-ph72', 'bundle_doi': '10.17189/jr9s-6678', 'release': 67, 'archive': 'NASA PDS, Planetary Plasma Interactions Node',
                   'author': 'Spence, H.E. (2026)', 'files': [{'name': n, 'md5': m, 'sha256': h} for n, _, m, h, _ in FILES]},
        'binning': {'by': 'UTC record timestamp (the TIME field, whole seconds); one record per readout of about a second, tagged at the readout; not the arrival time of each event',
                    'start': T0.strftime('%Y-%m-%dT%H:%M:%SZ'), 'bin_s': BIN_S, 'n': N_BINS, 'edges': '[start, end): left edge included, right edge excluded',
                    'extra_bin': 'the last bin is 2026-06-11 00:00-00:10 UTC, for the drawing\'s final minute',
                    'shown_rule': 'exactly 600 records, one per whole UTC second, all nominal; otherwise withheld (no zero, no partial exposure)',
                    'nominal': NOMINAL, 'live_time_correction': False, 'timing_offset_applied': False},
        'derived_on_page': {'rate': 'N / T, events per second, shown to 2 decimals',
                            'benchmark': 'sqrt(N) / T, events per second, shown to 2 decimals: an approximate one-standard-deviation Poisson counting benchmark, conditional on independent events, calculated by Mother Earth; not an archive error field and not a total uncertainty'},
        'row': '[N, T] for a shown bin (N integer GOOD events, T seconds); [null, null, reason, records, nominal_records] for a withheld bin',
        'rows': rows,
    }


def build(src):
    records = []
    for name, day, md5, sha, n in FILES:
        p = os.path.join(src, name)
        raw = open(p, 'rb').read()
        check_hashes(raw, name, md5, sha)          # before any parsing
        records += parse(raw, name, day, n)
    for (a, _), (b, _) in zip(records, records[1:]):
        if b <= a:
            raise BuildError('records of the two days are not in time order')
    bins, n_sel, good_sel = make_bins(records)
    doc = assemble(bins, n_sel, good_sel)
    return (json.dumps(doc, ensure_ascii=False, separators=(',', ':'), sort_keys=False) + '\n').encode('utf-8'), doc, good_sel


def main(argv=None):
    ap = argparse.ArgumentParser(description='Build the Moon tab CRaTER good-event bins.', allow_abbrev=False)
    ap.add_argument('--src', required=True, help='folder holding the two retained CRAT_L2_SEC day files')
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--check', action='store_true', help='compare with the committed file instead of writing')
    a = ap.parse_args(argv)                         # unknown arguments are an error (argparse exits 2)
    try:
        b, doc, good_sel = build(a.src)
    except BuildError as e:
        print('BUILD FAIL:', e)
        return 1
    shown = sum(1 for r in doc['rows'] if r[0] is not None)
    print(f'bins {len(doc["rows"])}, shown {shown}, withheld {len(doc["rows"]) - shown}; GOOD over selected records {good_sel}; '
          f'{len(b)} B, sha256 {hashlib.sha256(b).hexdigest()}')
    if a.check:
        cur = open(a.out, 'rb').read() if os.path.exists(a.out) else b''
        if cur != b:
            print('CHECK FAIL: committed file differs from the build')
            return 1
        print('CHECK OK: committed file equals the build')
        return 0
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, 'wb').write(b)
    print('wrote', os.path.relpath(a.out, ROOT))
    return 0


if __name__ == '__main__':
    sys.exit(main())
