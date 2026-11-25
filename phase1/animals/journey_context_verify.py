#!/usr/bin/env python3
"""Check a FIRMS extraction folder before anything is built from it (the builder calls verify(); it makes no network call).

Refuses: a manifest that is missing, unreadable or not state "complete"; a window missing, extra or out of order against
the extractor's own plan; any stored file absent or not matching its recorded sha256; a missing availability record;
a missing gap list or gap-list hash; any leftover partial file. Returns a list of problems (empty means usable).
"""
import hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import journey_context_firms_fetch as fetch

def _sha(p):
    with open(p, 'rb') as f: return hashlib.sha256(f.read()).hexdigest()

def verify(folder):
    problems = []
    mp = os.path.join(folder, 'manifest.json')
    try:
        with open(mp, encoding='utf-8') as f: m = json.load(f)
    except Exception:
        return ['manifest.json is missing or unreadable']
    if m.get('state') != 'complete': problems.append(f"state is {m.get('state')!r}, not 'complete'")
    plan = [(s.isoformat(), d) for s, d in fetch.WINDOWS]
    got = [(w.get('start'), w.get('days')) for w in m.get('windows', [])]
    if got != plan: problems.append(f'windows do not match the plan ({len(got)} stored, {len(plan)} planned)')
    for w in m.get('windows', []):
        p = os.path.join(folder, w.get('file', ''))
        if not os.path.isfile(p): problems.append(f"{w.get('file')} is missing")
        elif _sha(p) != w.get('sha256'): problems.append(f"{w.get('file')} does not match its recorded sha256")
    for k, name in (('availability', 'availability-MODIS_SP.csv'), ('gap_list', 'missing-data.json')):
        rec = m.get(k)
        if not rec or not rec.get('sha256'): problems.append(f'no {k} record')
        elif not os.path.isfile(os.path.join(folder, name)): problems.append(f'{name} is missing')
        elif _sha(os.path.join(folder, name)) != rec['sha256']: problems.append(f'{name} does not match its recorded sha256')
    if [f for f in os.listdir(folder) if f.endswith('.part') or f.endswith('.incomplete')]: problems.append('partial files are present')
    if m.get('http_made') != fetch.PLANNED_HTTP: problems.append(f"{m.get('http_made')} requests made, {fetch.PLANNED_HTTP} planned")
    return problems

if __name__ == '__main__':
    p = verify(sys.argv[1])
    print('USABLE' if not p else 'NOT USABLE:\n- ' + '\n- '.join(p)); sys.exit(0 if not p else 1)
