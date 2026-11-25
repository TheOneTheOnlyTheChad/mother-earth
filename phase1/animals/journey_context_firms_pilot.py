#!/usr/bin/env python3
"""FIRMS pilot for Animals journey context (zebra Z3866 only). Run once by Chad in Terminal.

Predeclared in docs/concepts/ANIMALS-JOURNEY-CONTEXT-EVIDENCE.md section 4 (budget). Standard library only.
- Reads the FIRMS map key itself from KEYS.md (the row labelled FIRMS_MAP_KEY). The key is never printed,
  logged or written: every text written passes through redact(), and the run stops if the key is malformed.
- At most SIX HTTP requests, one at a time, 3 s apart, 60 s timeout each, NO retries:
    1 key status before · 2 MODIS_SP data availability · 3 area 2007-10-25 (5 days) · 4 area 2007-10-30 (5 days)
    5 area 2007-10-25 again (same request, to see if the answer is repeatable) · 6 key status after
- Stopping rules: stops before any area request if the status shows 1,000 or more transactions already used
  in the current window (to leave the live hub's allowance alone); stops at the first area request that fails
  or does not return CSV with the MODIS header. A failed request is recorded, never retried.
- Writes only to the private Mac folder research/animals-journey-context/<UTC stamp>-firms-pilot/ (never the repo):
  the raw CSVs, and manifest.json (per request: what was asked, without the key; status; bytes; sha256; rows; time).
"""
import hashlib, json, os, re, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

ROOT = os.path.expanduser('~/Documents/Mother Earth')
KEYS = os.path.join(ROOT, 'KEYS.md')
AREA = '20,-22,28,-18'          # west,south,east,north: the union of 4-degree cells 17_50 and 17_51 (exact, no margin)
SOURCE = 'MODIS_SP'
HOST = os.environ.get('ME_PILOT_TEST_HOST') or 'https://firms.modaps.eosdis.nasa.gov'   # the override is for the offline test only
STAMP = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
OUT = os.path.join(ROOT, 'research', 'animals-journey-context', STAMP + '-firms-pilot')
MODIS_HEADER = 'latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight'

def read_key():
    with open(KEYS, encoding='utf-8') as f:
        for line in f:
            cells = [c.strip().strip('`').strip() for c in line.split('|')]
            if 'FIRMS_MAP_KEY' in cells:
                i = cells.index('FIRMS_MAP_KEY')
                for c in cells[i + 1:]:
                    if re.fullmatch(r'[0-9a-fA-F]{32}', c):
                        return c
    sys.exit('Stopped: no FIRMS_MAP_KEY row with a 32-character key was found in KEYS.md (nothing printed, nothing requested).')

KEY = read_key()
def redact(s): return s.replace(KEY, '[KEY]') if isinstance(s, str) else s

def get(label, path):
    url = HOST + path.replace('{KEY}', KEY)
    rec = {'n': len(manifest['requests']) + 1, 'label': label, 'asked': path.replace('{KEY}', '[KEY]'), 'started_utc': datetime.now(timezone.utc).isoformat(timespec='seconds')}
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'MotherEarth-AnimalsPilot/1 (https://github.com/TheOneTheOnlyTheChad/mother-earth)'}), timeout=60) as r:
            body = r.read(); rec['status'] = r.status; rec['content_type'] = r.headers.get('Content-Type')
    except urllib.error.HTTPError as e:
        body = e.read(); rec['status'] = e.code; rec['content_type'] = e.headers.get('Content-Type')
    except Exception as e:
        body = b''; rec['status'] = None; rec['error'] = redact(type(e).__name__ + ': ' + str(e))[:300]
    rec['seconds'] = round(time.monotonic() - t0, 2); rec['bytes'] = len(body); rec['sha256'] = hashlib.sha256(body).hexdigest()
    text = redact(body.decode('utf-8', 'replace'))
    if KEY in body.decode('utf-8', 'replace'): rec['note'] = 'the response contained the key; it was redacted in what was kept'
    manifest['requests'].append(rec)
    print(f"{rec['n']}. {label}: status {rec['status']}, {rec['bytes']} bytes, {rec['seconds']} s")
    time.sleep(3)
    return rec, text

manifest = {'what': 'Animals journey context: FIRMS pilot for zebra Z3866 (MODIS_SP, cells 17_50 and 17_51)', 'run_utc': STAMP, 'area': AREA, 'source': SOURCE, 'requests': []}
os.makedirs(OUT, exist_ok=False)
def save(name, text):
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f: f.write(text)

rec, text = get('key status before', '/mapserver/mapkey_status/?MAP_KEY={KEY}')
save('01-status-before.json', text)
try: used = int(json.loads(text).get('current_transactions'))
except Exception: used = None
rec['current_transactions'] = used
if used is not None and used >= 1000:
    manifest['stopped'] = f'{used} transactions already used in the current window (limit for this pilot: under 1,000); no area request made'
else:
    rec, text = get('MODIS_SP data availability', '/api/data_availability/csv/{KEY}/MODIS_SP'); save('02-availability-MODIS_SP.csv', text)
    for i, (label, date) in enumerate([('area 2007-10-25, 5 days', '2007-10-25'), ('area 2007-10-30, 5 days', '2007-10-30'), ('area 2007-10-25 again', '2007-10-25')], start=3):
        rec, text = get(label, f'/api/area/csv/{{KEY}}/{SOURCE}/{AREA}/5/{date}')
        lines = text.splitlines(); rec['header'] = lines[0] if lines else ''; rec['rows'] = max(0, len(lines) - 1)
        if lines:
            dates = sorted({l.split(',')[5] for l in lines[1:] if l.count(',') >= 13}); rec['acq_dates'] = dates
            rec['satellites'] = sorted({l.split(',')[7] for l in lines[1:] if l.count(',') >= 13}); rec['versions'] = sorted({l.split(',')[10] for l in lines[1:] if l.count(',') >= 13})
        save(f'0{i}-area-{date}.csv', text)
        if rec['status'] != 200 or not text.startswith('latitude,longitude'):
            manifest['stopped'] = f"request {rec['n']} did not return MODIS CSV (status {rec['status']}); no further area request made"
            break
    rec, text = get('key status after', '/mapserver/mapkey_status/?MAP_KEY={KEY}')
    save('06-status-after.json', text)
    try: rec['current_transactions'] = int(json.loads(text).get('current_transactions'))
    except Exception: pass
r = manifest['requests']
if len(r) >= 2 and r[0].get('current_transactions') is not None and r[-1].get('current_transactions') is not None:
    manifest['transactions_used_by_pilot_upper_bound'] = r[-1]['current_transactions'] - r[0]['current_transactions']
    manifest['transactions_note'] = 'difference of the two status readings; other use of the same key in between (the live hub) would be included'
a = [x for x in r if x['label'].startswith('area 2007-10-25')]
if len(a) == 2: manifest['repeat_identical'] = a[0]['sha256'] == a[1]['sha256']
save('manifest.json', redact(json.dumps(manifest, indent=1)))
print('Done. Written to', OUT.replace(os.path.expanduser('~'), '~'), '- nothing else was written, and the key was not printed.')
