#!/usr/bin/env python3
"""FIRMS extraction for Animals journey context, zebra Z3866 only (stage C1a). Run once by Chad in Terminal.

Budget and rules: docs/concepts/ANIMALS-JOURNEY-CONTEXT-EVIDENCE.md section 4b. Standard library only.

What it does, in order, one request at a time, 3 s apart, 60 s timeout each, NO retries:
  0  the provider's missing-data list (keyless; provenance for the builder)
  1  key status (must be readable and well formed, or the run stops)
  2  MODIS_SP data availability (must cover the whole interval, or the run stops)
  3..75  73 area requests: 25 Oct 2007 to 22 Oct 2008 in 5-day windows (the last one 4 days),
         box 20,-22,28,-18, MODIS_SP; a key-status read after every 15th window and after the last
Planned: 81 HTTP requests (80 to the keyed API, 1 keyless).

Safety rules (GPT's review of 25 Nov 2026, corrections 1 to 5):
  1. Any key-status read that is not HTTP 200 JSON with transaction_limit 5000, a non-negative integer
     current_transactions and transaction_interval "10 minutes" stops the run. So does 2,000 or more used.
     A drop in current_transactions between readings is recorded as an accounting-window reset; no negative
     figure is ever computed.
  2. Bytes are counted while reading: one response may not pass RESPONSE_CAP, an error body ERROR_CAP, and all
     responses together CACHE_CAP. Data goes to a .part file renamed only after every check passes.
  3. Every area response must be strict UTF-8 CSV with the frozen MODIS header, and every row is parsed:
     coordinates, date inside the window, HHMM time (unpadded accepted, invalid rejected), satellite, instrument,
     confidence, version text, type, day/night and the numeric fields. Header-only is a valid zero; anything else
     (HTML, a plausible prefix, a bad row) stops the run.
  4. What is hashed is exactly what is stored. If a response that would be stored contains the key, nothing of it
     is stored and the run stops with a redacted failure record. Key-status bodies are never stored: only their
     parsed allowance and usage numbers are kept.
  5. The manifest is written on every exit with state "complete", "stopped" or "invalid". Only "complete", after
     the final status read and a check that every window file is present and matches its hash, exits 0.
The key is read from KEYS.md by this script and is never printed, logged or written.
"""
import csv, hashlib, io, json, os, re, sys, time, urllib.error, urllib.request
from datetime import date, datetime, timedelta, timezone

TEST_HOST = os.environ.get('ME_PILOT_TEST_HOST')             # offline tests only; caps below may be lowered only with it
HOST = TEST_HOST or 'https://firms.modaps.eosdis.nasa.gov'
ROOT = os.path.expanduser('~/Documents/Mother Earth')
KEYS = os.path.join(ROOT, 'KEYS.md')
AREA = '20,-22,28,-18'                                       # west,south,east,north = cells 17_50 and 17_51
BOX = (20.0, -22.0, 28.0, -18.0)
SOURCE = 'MODIS_SP'
FIRST, LAST = date(2007, 10, 25), date(2008, 10, 22)         # whole UTC days covering the retained fixes
WINDOW = 5
STATUS_EVERY = 15
STOP_AT_USED = 2000
SPACING = 0.0 if TEST_HOST else 3.0
TIMEOUT = 60
RESPONSE_CAP = int(os.environ.get('ME_TEST_RESPONSE_CAP', 0)) if TEST_HOST and os.environ.get('ME_TEST_RESPONSE_CAP') else 2_000_000
CACHE_CAP = int(os.environ.get('ME_TEST_CACHE_CAP', 0)) if TEST_HOST and os.environ.get('ME_TEST_CACHE_CAP') else 20_000_000
ERROR_CAP = 65_536
HEADER = ['latitude', 'longitude', 'brightness', 'scan', 'track', 'acq_date', 'acq_time', 'satellite', 'instrument',
          'confidence', 'version', 'bright_t31', 'frp', 'daynight', 'type']
AVAIL_HEADER = 'data_id,min_date,max_date'
UA = 'MotherEarth-AnimalsContext/1 (https://github.com/TheOneTheOnlyTheChad/mother-earth)'

def windows():
    out, d = [], FIRST
    while d <= LAST:
        days = min(WINDOW, (LAST - d).days + 1)
        out.append((d, days)); d += timedelta(days=days)
    return out

WINDOWS = windows()
PLANNED_STATUS_AFTER = sorted({i for i in range(STATUS_EVERY, len(WINDOWS) + 1, STATUS_EVERY)} | {len(WINDOWS)})
PLANNED_HTTP = 1 + 1 + 1 + len(WINDOWS) + len(PLANNED_STATUS_AFTER)

class Stop(Exception):
    def __init__(self, state, reason): super().__init__(reason); self.state, self.reason = state, reason

def read_key():
    try:
        with open(KEYS, encoding='utf-8') as f:
            for line in f:
                cells = [c.strip().strip('`').strip() for c in line.split('|')]
                if 'FIRMS_MAP_KEY' in cells:
                    for c in cells[cells.index('FIRMS_MAP_KEY') + 1:]:
                        if re.fullmatch(r'[0-9a-fA-F]{32}', c): return c
    except OSError: pass
    return None

class Run:
    def __init__(self, key, out):
        self.key, self.out = key, out
        self.m = {'what': 'Animals journey context: FIRMS extraction for zebra Z3866 (MODIS_SP, cells 17_50 and 17_51)',
                  'script_sha256': hashlib.sha256(open(__file__, 'rb').read()).hexdigest(), 'run_utc': os.path.basename(out).split('-')[0],
                  'area': AREA, 'source': SOURCE, 'first_day': FIRST.isoformat(), 'last_day': LAST.isoformat(),
                  'windows_planned': len(WINDOWS), 'http_planned': PLANNED_HTTP, 'status_after_windows': PLANNED_STATUS_AFTER,
                  'caps_bytes': {'response': RESPONSE_CAP, 'error_body': ERROR_CAP, 'cache': CACHE_CAP}, 'stop_at_used': STOP_AT_USED,
                  'state': 'running', 'requests': [], 'status_readings': [], 'windows': [], 'cache_bytes': 0}
        self.n = 0

    def redact(self, s): return s.replace(self.key, '[KEY]') if self.key and isinstance(s, str) else s

    def fetch(self, label, path, keyed=True, stored=True):
        """One GET with bytes counted while reading. Returns (status, body bytes) or raises Stop."""
        if self.n >= PLANNED_HTTP: raise Stop('invalid', 'request count would pass the planned total')
        self.n += 1
        url = HOST + (path.replace('{KEY}', self.key) if keyed else path)
        rec = {'n': self.n, 'label': label, 'asked': path.replace('{KEY}', '[KEY]'), 'started_utc': datetime.now(timezone.utc).isoformat(timespec='seconds')}
        self.m['requests'].append(rec)
        t0 = time.monotonic(); body = bytearray(); status = None
        try:
            try:
                resp = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=TIMEOUT); cap = RESPONSE_CAP
            except urllib.error.HTTPError as e:
                resp = e; cap = ERROR_CAP
            status = resp.status if hasattr(resp, 'status') else resp.code
            rec['status'] = status; rec['content_type'] = resp.headers.get('Content-Type')
            while True:
                chunk = resp.read(65536)
                if not chunk: break
                body += chunk
                if len(body) > cap:
                    rec['bytes_read_before_stop'] = len(body)
                    raise Stop('stopped', f'request {self.n} passed its byte cap ({cap}) while reading')
                if self.m['cache_bytes'] + len(body) > CACHE_CAP:
                    rec['bytes_read_before_stop'] = len(body)
                    raise Stop('stopped', f'the run passed the cache cap ({CACHE_CAP} bytes) while reading request {self.n}')
        except Stop: raise
        except Exception as e:
            rec['error'] = self.redact(type(e).__name__ + ': ' + str(e))[:300]
            raise Stop('stopped', f'request {self.n} failed: {rec["error"]}')
        finally:
            rec['seconds'] = round(time.monotonic() - t0, 2)
            time.sleep(SPACING)
        body = bytes(body); rec['bytes'] = len(body); rec['sha256'] = hashlib.sha256(body).hexdigest()
        if self.key and self.key.encode() in body:
            rec['sha256'] = None
            if stored:
                rec['note'] = 'the response contained the key; nothing of it was stored'
                raise Stop('invalid', f'request {self.n} contained the key; nothing of it was stored')
            rec['note'] = 'the response contained the key; only its parsed fields are kept (status bodies are never stored)'
        if status != 200: raise Stop('stopped', f'request {self.n} returned HTTP {status}')
        self.m['cache_bytes'] += len(body)
        return body

    def store(self, name, body):
        p = os.path.join(self.out, name); part = p + '.part'
        with open(part, 'wb') as f: f.write(body)
        os.rename(part, p)
        return hashlib.sha256(open(p, 'rb').read()).hexdigest()

    def status(self, when):
        body = self.fetch(f'key status {when}', '/mapserver/mapkey_status/?MAP_KEY={KEY}', stored=False)
        try: d = json.loads(body.decode('utf-8'))
        except Exception: raise Stop('stopped', 'key status was not readable JSON')
        if not isinstance(d, dict): raise Stop('stopped', 'key status was not a JSON object')
        lim, used, interval = d.get('transaction_limit'), d.get('current_transactions'), d.get('transaction_interval')
        if not (type(lim) is int and lim == 5000 and type(used) is int and used >= 0 and interval == '10 minutes'):
            raise Stop('stopped', 'key status did not have the expected allowance and usage fields')
        prev = self.m['status_readings'][-1]['used'] if self.m['status_readings'] else None
        reading = {'when': when, 'used': used, 'limit': lim, 'interval': interval, 'at_utc': datetime.now(timezone.utc).isoformat(timespec='seconds')}
        if prev is not None:
            if used >= prev: reading['increase_since_previous'] = used - prev
            else: reading['window_reset_observed'] = True
        self.m['status_readings'].append(reading)
        if used >= STOP_AT_USED: raise Stop('stopped', f'{used} transactions already used in the current window (stops at {STOP_AT_USED})')

    def availability(self):
        body = self.fetch('MODIS_SP data availability', '/api/data_availability/csv/{KEY}/MODIS_SP')
        try: text = body.decode('utf-8')
        except UnicodeDecodeError: raise Stop('invalid', 'availability was not UTF-8')
        lines = [l for l in text.splitlines() if l.strip()]
        if not lines or lines[0].strip() != AVAIL_HEADER: raise Stop('invalid', 'availability did not have the expected header')
        rows = [l.split(',') for l in lines[1:]]
        mine = [r for r in rows if len(r) == 3 and r[0] == SOURCE]
        try:
            ok = len(mine) == 1 and date.fromisoformat(mine[0][1]) <= FIRST and date.fromisoformat(mine[0][2]) >= LAST
        except ValueError: ok = False
        if not ok: raise Stop('invalid', 'availability does not cover the whole interval for MODIS_SP')
        self.m['availability'] = {'min_date': mine[0][1], 'max_date': mine[0][2], 'sha256': self.store('availability-MODIS_SP.csv', body)}

    def gap_list(self):
        body = self.fetch('missing-data list (keyless)', '/api/missing_data/?action=fetch_data', keyed=False)
        try:
            d = json.loads(body.decode('utf-8')); html = d['html']
            if d.get('success') is not True or not isinstance(html, str): raise ValueError
        except Exception: raise Stop('invalid', 'the missing-data list was not the expected JSON')
        trs = re.findall(r'<tr>(.*?)</tr>', html, re.S)
        rows = [re.findall(r'<td>\s*([^<]*?)\s*</td>', tr) for tr in trs]
        if not rows or any(len(r) != 4 for r in rows):
            raise Stop('invalid', 'the missing-data list did not have table rows of four cells each (an unreadable list is never an empty one)')
        sp = [(r[0], r[1]) for r in rows if r[0]]
        if not sp: raise Stop('invalid', 'the missing-data list had no standard-data rows (an unreadable list is never an empty one)')
        for dd, sat in sp:
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', dd): raise Stop('invalid', 'the missing-data list had a malformed date')
        modis = sorted(dd for dd, sat in sp if sat in ('Terra (MODIS)', 'Aqua (MODIS)') and FIRST.isoformat() <= dd <= LAST.isoformat())
        self.m['gap_list'] = {'sha256': self.store('missing-data.json', body), 'standard_rows': len(sp),
                              'modis_days_listed_in_interval': modis, 'meaning': "dates listed in the provider's missing-data table for Terra or Aqua MODIS standard data; not a statement about cloud or local observation"}

    def area(self, i, start, days):
        body = self.fetch(f'area {start.isoformat()}, {days} days', f'/api/area/csv/{{KEY}}/{SOURCE}/{AREA}/{days}/{start.isoformat()}')
        rows = validate_area(body, start, days)
        name = f'area-{start.isoformat()}-{days}d.csv'
        sha = self.store(name, body)
        self.m['windows'].append({'i': i, 'start': start.isoformat(), 'days': days, 'file': name, 'sha256': sha, 'rows': rows})

def validate_area(body, start, days):
    try: text = body.decode('utf-8')
    except UnicodeDecodeError: raise Stop('invalid', f'window {start} was not UTF-8')
    reader = csv.reader(io.StringIO(text))
    try: header = next(reader)
    except StopIteration: raise Stop('invalid', f'window {start} was empty, not even a header')
    if header != HEADER: raise Stop('invalid', f'window {start} did not have the frozen MODIS header')
    end = start + timedelta(days=days - 1); n = 0
    for k, r in enumerate(reader, start=2):
        if not r: continue
        why = bad_row(r, start, end)
        if why: raise Stop('invalid', f'window {start}, line {k}: {why}')
        n += 1
    return n

def bad_row(r, start, end):
    if len(r) != len(HEADER): return f'{len(r)} fields, expected {len(HEADER)}'
    v = dict(zip(HEADER, r))
    try:
        lat, lon = float(v['latitude']), float(v['longitude'])
        for f in ('brightness', 'scan', 'track', 'bright_t31', 'frp'): float(v[f])
    except ValueError: return 'a numeric field did not parse'
    if not (BOX[1] <= lat <= BOX[3] and BOX[0] <= lon <= BOX[2]): return 'coordinates outside the requested box'
    try: d = date.fromisoformat(v['acq_date']) if re.fullmatch(r'\d{4}-\d{2}-\d{2}', v['acq_date']) else None
    except ValueError: d = None
    if d is None: return 'acq_date is not a real YYYY-MM-DD date'
    if not (start <= d <= end): return 'acq_date outside the requested window'
    if not re.fullmatch(r'\d{1,4}', v['acq_time']): return 'acq_time is not 1 to 4 digits'
    t = v['acq_time'].zfill(4)
    if int(t[:2]) > 23 or int(t[2:]) > 59: return 'acq_time is not a valid HHMM'
    if v['satellite'] not in ('Terra', 'Aqua'): return 'satellite is not Terra or Aqua'
    if v['instrument'] != 'MODIS': return 'instrument is not MODIS'
    if not re.fullmatch(r'\d{1,3}', v['confidence']) or int(v['confidence']) > 100: return 'confidence is not 0 to 100'
    if not re.fullmatch(r'\d+(\.\d+)*[A-Za-z]*', v['version']): return 'version is not a version label'
    if v['type'] not in ('0', '1', '2', '3'): return 'type is not 0, 1, 2 or 3'
    if v['daynight'] not in ('D', 'N'): return 'daynight is not D or N'
    return None

def main():
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    out = os.path.join(ROOT, 'research', 'animals-journey-context', stamp + '-firms-zebra')
    key = read_key()
    if not key:
        print('STOPPED: no FIRMS_MAP_KEY row with a 32-character key was found in KEYS.md. Nothing requested, nothing written.'); return 2
    os.makedirs(out, exist_ok=False)
    run = Run(key, out)
    try:
        run.gap_list()
        run.status('before')
        run.availability()
        for i, (start, days) in enumerate(WINDOWS, start=1):
            run.area(i, start, days)
            print(f'window {i}/{len(WINDOWS)} ok', flush=True)
            if i in PLANNED_STATUS_AFTER: run.status(f'after window {i}')
        # completeness: every planned window stored, every file matches its hash, request count as planned
        got = [w['start'] for w in run.m['windows']]
        if got != [s.isoformat() for s, _ in WINDOWS]: raise Stop('invalid', 'the stored windows do not match the plan')
        for w in run.m['windows']:
            if hashlib.sha256(open(os.path.join(out, w['file']), 'rb').read()).hexdigest() != w['sha256']: raise Stop('invalid', f"{w['file']} no longer matches its hash")
        if run.n != PLANNED_HTTP: raise Stop('invalid', f'{run.n} requests made, {PLANNED_HTTP} planned')
        run.m['state'] = 'complete'; run.m['reason'] = 'all windows stored and checked; final key status read'
    except Stop as s:
        run.m['state'], run.m['reason'] = s.state, run.redact(s.reason)
    except Exception as e:
        run.m['state'], run.m['reason'] = 'invalid', run.redact('unexpected error: ' + type(e).__name__ + ': ' + str(e))[:300]
    finally:
        run.m['http_made'] = run.n; run.m['windows_stored'] = len(run.m['windows'])
        run.m['rows_total'] = sum(w['rows'] for w in run.m['windows'])
        for f in os.listdir(out):
            if f.endswith('.part'): os.rename(os.path.join(out, f), os.path.join(out, f + '.incomplete'))
        text = run.redact(json.dumps(run.m, indent=1))
        with open(os.path.join(out, 'manifest.json'), 'w', encoding='utf-8') as f: f.write(text)
    where = out.replace(os.path.expanduser('~'), '~')
    if run.m['state'] == 'complete':
        print(f"COMPLETE: {len(WINDOWS)} windows, {run.m['rows_total']} rows, {run.n} requests. Written to {where}. The key was not printed."); return 0
    print(f"{run.m['state'].upper()}: {run.m['reason']} ({run.m['windows_stored']} of {len(WINDOWS)} windows stored, {run.n} requests). Manifest written to {where}. Nothing here is complete; do not build from it.")
    return 1

if __name__ == '__main__':
    sys.exit(main())
