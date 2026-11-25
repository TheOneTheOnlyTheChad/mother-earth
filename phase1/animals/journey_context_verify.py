#!/usr/bin/env python3
"""Check a FIRMS extraction folder before anything is built from it. No network call. The builder calls verify() first.

H2 (GPT's targeted review, 25 Nov 2026): the folder must be the planned zebra extraction, not just an intact one.
It is refused unless all of these hold:
- the manifest is a JSON object of the expected shape, state "complete";
- it names exactly the fixed product, region and interval held HERE (not read from the extractor module), and the
  approved extractor's sha256 (APPROVED_EXTRACTOR_SHA256, moved only together with a reviewed extractor);
- its windows are exactly the planned indices, start dates, durations and file names, each file inside the folder,
  present, matching its hash, and still passing the extractor's row checks with the recorded row count;
- 81 requests, all HTTP 200, and six key-status readings in the planned order, each below the stop threshold,
  the last one after window 73;
- the saved availability and missing-data files match their hashes AND, re-parsed with the extractor's own pure
  parsers, give exactly the summaries the manifest claims (a changed summary is caught even with an unchanged file);
- no partial files are left.
It establishes reproducible provenance, not scientific correctness: the builder still parses every CSV, clips to the
half-open union, deduplicates and checks its aggregates. It is not a defence against rewriting every input and the code.
"""
import hashlib, json, os, sys
from datetime import date, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import journey_context_firms_fetch as fetch

APPROVED_EXTRACTOR_SHA256 = '62e29621bdb2637a7c60a5de6955f316931f9710a18ef48fccb716b6a5b4a752'          # set to the reviewed extractor's sha256; the suite checks it matches the file
EXPECT = {'source': 'MODIS_SP', 'area': '20,-22,28,-18', 'first_day': '2007-10-25', 'last_day': '2008-10-22'}
WINDOW, STATUS_AFTER, STOP_AT_USED, HTTP = 5, [15, 30, 45, 60, 73], 2000, 81

def plan():
    out, d, last = [], date(2007, 10, 25), date(2008, 10, 22)
    while d <= last:
        n = min(WINDOW, (last - d).days + 1); out.append((d.isoformat(), n)); d += timedelta(days=n)
    return out

def _sha(p):
    with open(p, 'rb') as f: return hashlib.sha256(f.read()).hexdigest()

def _inside(folder, name):
    if not isinstance(name, str) or not name or os.path.basename(name) != name or name in ('.', '..'): return None
    p = os.path.realpath(os.path.join(folder, name))
    return p if os.path.dirname(p) == os.path.realpath(folder) else None

def _check(folder):
    P = []
    try:
        with open(os.path.join(folder, 'manifest.json'), encoding='utf-8') as f: m = json.load(f)
    except Exception:
        return ['manifest.json is missing or not readable JSON']
    if not isinstance(m, dict): return ['the manifest is not a JSON object']
    if m.get('state') != 'complete': P.append(f"state is {m.get('state')!r}, not 'complete'")
    for k, v in EXPECT.items():
        if m.get(k) != v: P.append(f'{k} is {m.get(k)!r}, expected {v!r}')
    if m.get('script_sha256') != APPROVED_EXTRACTOR_SHA256: P.append('the extractor identity is missing or not the approved one')
    want = plan()
    if m.get('windows_planned') != len(want): P.append('windows_planned is not 73')
    if m.get('http_planned') != HTTP or m.get('http_made') != HTTP: P.append(f'requests planned/made are not {HTTP}')
    ws = m.get('windows')
    if not isinstance(ws, list) or not all(isinstance(w, dict) for w in ws): P.append('windows is not a list of records'); ws = []
    if [(w.get('i'), w.get('start'), w.get('days'), w.get('file')) for w in ws] != [(i, s, n, f'area-{s}-{n}d.csv') for i, (s, n) in enumerate(want, 1)]:
        P.append(f'windows do not match the plan ({len(ws)} stored, {len(want)} planned)')
    for w in ws:
        p = _inside(folder, w.get('file'))
        if not p: P.append(f"{w.get('file')!r} is not a plain file name inside the folder"); continue
        if not os.path.isfile(p): P.append(f"{w.get('file')} is missing"); continue
        if _sha(p) != w.get('sha256'): P.append(f"{w.get('file')} does not match its recorded sha256"); continue
        try:
            rows = fetch.validate_area(open(p, 'rb').read(), date.fromisoformat(w['start']), w['days'])
            if rows != w.get('rows'): P.append(f"{w['file']}: {rows} rows, the manifest says {w.get('rows')}")
        except fetch.Stop as e: P.append(f"{w['file']} fails the row checks: {e.reason}")
    reqs = m.get('requests')
    if not isinstance(reqs, list) or len(reqs) != HTTP or not all(isinstance(r, dict) and r.get('status') == 200 for r in reqs):
        P.append(f'the request record is not {HTTP} successful requests')
    sr = m.get('status_readings')
    order = ['before'] + [f'after window {i}' for i in STATUS_AFTER]
    if not isinstance(sr, list) or not all(isinstance(r, dict) for r in sr) or [r.get('when') for r in sr] != order:
        P.append('the key-status readings are not the six planned ones in order')
    else:
        for r in sr:
            if not (type(r.get('used')) is int and 0 <= r['used'] < STOP_AT_USED and r.get('limit') == 5000 and r.get('interval') == '10 minutes'):
                P.append(f"key-status reading {r.get('when')!r} is not a valid reading below {STOP_AT_USED}")
    for k, name, parse in (('availability', 'availability-MODIS_SP.csv', fetch.parse_availability), ('gap_list', 'missing-data.json', fetch.parse_gap_list)):
        rec = m.get(k)
        if not isinstance(rec, dict) or not rec.get('sha256'): P.append(f'no {k} record'); continue
        p = _inside(folder, name)
        if not os.path.isfile(p): P.append(f'{name} is missing'); continue
        raw = open(p, 'rb').read()
        if hashlib.sha256(raw).hexdigest() != rec['sha256']: P.append(f'{name} does not match its recorded sha256'); continue
        try: summary = parse(raw)
        except Exception as e: P.append(f'{name} no longer parses: {e}'); continue
        if {kk: rec.get(kk) for kk in summary} != summary or set(rec) - set(summary) - {'sha256'}:
            P.append(f'the manifest\'s {k} summary does not match the saved file')
    if [f for f in os.listdir(folder) if f.endswith('.part') or f.endswith('.incomplete')]: P.append('partial files are present')
    return P

def verify(folder):
    try: return _check(folder)
    except Exception as e: return [f'could not check the folder: {type(e).__name__}: {e}']

if __name__ == '__main__':
    p = verify(sys.argv[1])
    print('USABLE' if not p else 'NOT USABLE:\n- ' + '\n- '.join(p)); sys.exit(0 if not p else 1)
