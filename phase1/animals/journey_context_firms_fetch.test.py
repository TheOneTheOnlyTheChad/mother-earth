#!/usr/bin/env python3
"""Offline controls for journey_context_firms_fetch.py and journey_context_verify.py (no network; a local stand-in server).

Run: python3 -I phase1/animals/journey_context_firms_fetch.test.py   (each case runs the real extractor as a child process
with HOME pointed at a temporary folder holding a fake KEYS.md; the stand-in server's behaviour is set per case).
Every case also checks that the fake key appears in nothing printed or written.
"""
import http.server, json, os, shutil, socket, subprocess, sys, tempfile, threading
from datetime import date, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
FETCH = os.path.join(HERE, 'journey_context_firms_fetch.py')
sys.path.insert(0, HERE)
KEY = '0123456789abcdef0123456789abcdef'
HEADER = 'latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type'
GAPS = {'success': True, 'html': '<tr><td>2022-10-22</td><td>Terra (MODIS)</td><td>2024-03-06</td><td>NOAA-21 (VIIRS)</td></tr>\n<tr><td>2008-03-01</td><td>Aqua (MODIS)</td><td></td><td></td></tr>'}

class Server:
    def __init__(self, mode):
        self.mode, self.status_n, self.area_n, self.log = mode, 0, 0, []
        s = socket.socket(); s.bind(('127.0.0.1', 0)); self.port = s.getsockname()[1]; s.close()
        srv = self
        class H(http.server.BaseHTTPRequestHandler):
            def log_message(self, *a): pass
            def send(self, code, body, ct='text/csv'):
                b = body if isinstance(body, bytes) else body.encode()
                self.send_response(code); self.send_header('Content-Type', ct); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
            def do_GET(self):
                srv.log.append(self.path); m = srv.mode
                if 'missing_data' in self.path:
                    if m == 'gap_bad': return self.send(200, json.dumps({'success': True, 'html': 'oops'}), 'application/json')
                    if m == 'gap_no_rows': return self.send(200, json.dumps({'success': True, 'html': '<tr><td></td><td></td><td>2024-03-06</td><td>NOAA-21 (VIIRS)</td></tr>'}), 'application/json')
                    return self.send(200, json.dumps(GAPS), 'application/json')
                if 'mapkey_status' in self.path:
                    srv.status_n += 1; n = srv.status_n
                    if m == 'status_500' and n == 1: return self.send(500, 'error')
                    if m == 'status_bad_json' and n == 1: return self.send(200, '<html>not json</html>', 'text/html')
                    if m == 'status_missing_field' and n == 1: return self.send(200, json.dumps({'current_transactions': 3}), 'application/json')
                    if m == 'status_wrong_limit' and n == 1: return self.send(200, json.dumps({'transaction_limit': 9999, 'current_transactions': 3, 'transaction_interval': '10 minutes'}), 'application/json')
                    if m == 'status_float' and n == 1: return self.send(200, json.dumps({'transaction_limit': 5000, 'current_transactions': 3.5, 'transaction_interval': '10 minutes'}), 'application/json')
                    if m == 'status_final_bad' and n == 6: return self.send(200, '{', 'application/json')
                    used = 2000 if m == 'status_busy' else (5 if (m == 'status_reset' and n >= 3) else 10 * n)
                    return self.send(200, json.dumps({'map_key': KEY, 'transaction_limit': 5000, 'current_transactions': used, 'transaction_interval': '10 minutes'}), 'application/json')
                if 'data_availability' in self.path:
                    mx = '2008-01-01' if m == 'avail_short' else '2026-08-31'
                    return self.send(200, f'data_id,min_date,max_date\nMODIS_SP,2000-11-01,{mx}')
                if '/api/area/' in self.path:
                    srv.area_n += 1; a = srv.area_n
                    parts = self.path.rstrip('/').split('/'); days, start = int(parts[-2]), date.fromisoformat(parts[-1])
                    row = lambda d, t='919', extra='': f'-19.1{extra},23.5,320.1,1.0,1.0,{d.isoformat()},{t},Terra,MODIS,80,6.03,300.0,10.2,D,0'
                    body = HEADER + ('' if m == 'header_only' else '\n' + row(start) + '\n' + row(start + timedelta(days=days - 1), '2353', '2'))
                    if a == 3:
                        if m == 'area_html': body = 'latitude,longitude <html><body>Service unavailable</body></html>'
                        if m == 'area_bad_time': body = HEADER + '\n' + row(start, '2460')
                        if m == 'area_wrong_header': body = HEADER.replace(',type', '') + '\n' + row(start)[:-2]
                        if m == 'area_outside_date': body = HEADER + '\n' + row(start + timedelta(days=days))
                        if m == 'area_key_echo': body = HEADER + '\n' + row(start) + '\n#' + KEY
                        if m == 'area_bad_sat': body = HEADER + '\n' + row(start).replace('Terra', 'Landsat')
                        if m == 'area_outside_box': body = HEADER + '\n' + row(start).replace('23.5', '28.5')
                        if m == 'area_short_row': body = HEADER + '\n' + row(start).rsplit(',', 1)[0]
                        if m == 'area_oversize': body = HEADER + ('\n' + row(start)) * 2000
                        if m == 'area_500': return self.send(500, 'server error')
                        if m == 'area_500_big': return self.send(500, 'x' * 200000)
                        if m == 'area_drop': self.connection.close(); return
                    return self.send(200, body)
                self.send(404, 'no')
        self.httpd = http.server.ThreadingHTTPServer(('127.0.0.1', self.port), H)
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
    def close(self): self.httpd.shutdown()

def run(mode, env_extra=None, keys=True):
    home = tempfile.mkdtemp(); root = os.path.join(home, 'Documents', 'Mother Earth'); os.makedirs(root)
    if keys:
        with open(os.path.join(root, 'KEYS.md'), 'w') as f: f.write(f'| Name | Value |\n|---|---|\n| FIRMS_MAP_KEY | `{KEY}` | note |\n')
    srv = Server(mode)
    env = dict(os.environ, HOME=home, ME_PILOT_TEST_HOST=f'http://127.0.0.1:{srv.port}', **(env_extra or {}))
    p = subprocess.run([sys.executable, '-I', FETCH], env=env, capture_output=True, text=True, timeout=120)
    srv.close()
    base = os.path.join(root, 'research', 'animals-journey-context')
    out = os.path.join(base, os.listdir(base)[0]) if os.path.isdir(base) and os.listdir(base) else None
    m = json.load(open(os.path.join(out, 'manifest.json'))) if out and os.path.exists(os.path.join(out, 'manifest.json')) else None
    leak = KEY in p.stdout or KEY in p.stderr
    if out:
        for f in os.listdir(out):
            if KEY in open(os.path.join(out, f), 'rb').read().decode('utf-8', 'replace'): leak = True
    return p, out, m, srv, leak, home

passed = failed = 0
def check(name, cond, detail=''):
    global passed, failed
    if cond: passed += 1; print('PASS', name)
    else: failed += 1; print('FAIL', name, detail)

import journey_context_firms_fetch as F
import journey_context_verify as V
check('plan: 73 windows (72 of five days, one of four), 25 Oct 2007 to 22 Oct 2008', len(F.WINDOWS) == 73 and F.WINDOWS[0] == (date(2007, 10, 25), 5) and F.WINDOWS[-1] == (date(2008, 10, 19), 4) and sum(d for _, d in F.WINDOWS) == 364)
check('plan: status reads after windows 15, 30, 45, 60 and 73; 81 HTTP requests (80 keyed + 1 keyless)', F.PLANNED_STATUS_AFTER == [15, 30, 45, 60, 73] and F.PLANNED_HTTP == 81)
check('test-only caps cannot be set without the test host', F.RESPONSE_CAP == 2_000_000 and F.CACHE_CAP == 20_000_000 and F.HOST.startswith('https://firms.modaps.eosdis.nasa.gov') or bool(os.environ.get('ME_PILOT_TEST_HOST')))
p = subprocess.run([sys.executable, '-I', '-c', 'import sys; sys.path.insert(0, sys.argv[1]); import journey_context_firms_fetch as F; print(F.RESPONSE_CAP, F.CACHE_CAP, F.SPACING)', HERE], env=dict(os.environ, ME_TEST_RESPONSE_CAP='10', ME_TEST_CACHE_CAP='10'), capture_output=True, text=True)
check('without the test host, ME_TEST_* caps are ignored and spacing stays 3 s', p.stdout.split() == ['2000000', '20000000', '3.0'], p.stdout + p.stderr)

def expect(mode, state, code, why_has='', windows=None, env=None, extra=None):
    p, out, m, srv, leak, home = run(mode, env)
    ok = m is not None and m['state'] == state and p.returncode == code and why_has in (m.get('reason') or '') and not leak
    if windows is not None: ok = ok and m['windows_stored'] == windows
    if extra: ok = ok and extra(p, out, m, srv)
    check(f'{mode}: state {state}, exit {code}' + (f', "{why_has}"' if why_has else '') + (f', {windows} windows' if windows is not None else '') + ', key absent', ok,
          f"got state={m and m['state']} exit={p.returncode} reason={m and m.get('reason')} windows={m and m['windows_stored']} leak={leak} out={p.stdout[-300:]} err={p.stderr[-300:]}")
    shutil.rmtree(home, ignore_errors=True)
    return m

# the full run
def ok_extra(p, out, m, srv):
    return (m['http_made'] == 81 and len(srv.log) == 81 and V.verify(out) == [] and m['rows_total'] == 146 and p.stdout.strip().splitlines()[-1].startswith('COMPLETE')
            and m['gap_list']['modis_days_listed_in_interval'] == ['2008-03-01'] and all(r.get('note') != 'the response contained the key; nothing of it was stored' for r in m['requests'])
            and any('only its parsed fields' in (r.get('note') or '') for r in m['requests']))
expect('ok', 'complete', 0, windows=73, extra=ok_extra)
expect('header_only', 'complete', 0, windows=73, extra=lambda p, o, m, s: m['rows_total'] == 0 and V.verify(o) == [])
expect('status_reset', 'complete', 0, windows=73, extra=lambda p, o, m, s: any(r.get('window_reset_observed') for r in m['status_readings']) and all(r.get('increase_since_previous', 0) >= 0 for r in m['status_readings']))
# correction 1: key status must be readable and well formed; availability must cover the interval
for mode, why in [('status_500', 'HTTP 500'), ('status_bad_json', 'not readable JSON'), ('status_missing_field', 'expected allowance'), ('status_wrong_limit', 'expected allowance'), ('status_float', 'expected allowance'), ('status_busy', 'already used')]:
    expect(mode, 'stopped', 1, why, windows=0, extra=lambda p, o, m, s: not any('/api/area/' in x or 'data_availability' in x for x in s.log))
expect('avail_short', 'invalid', 1, 'does not cover', windows=0, extra=lambda p, o, m, s: not any('/api/area/' in x for x in s.log))
expect('status_final_bad', 'stopped', 1, 'not readable JSON', windows=73, extra=lambda p, o, m, s: V.verify(o) != [] and not p.stdout.strip().splitlines()[-1].startswith('COMPLETE'))
expect('gap_bad', 'invalid', 1, 'never an empty one', windows=0, extra=lambda p, o, m, s: len(s.log) == 1)
expect('gap_no_rows', 'invalid', 1, 'never an empty one', windows=0, extra=lambda p, o, m, s: len(s.log) == 1)
# correction 3: strict CSV
for mode, why in [('area_html', 'frozen MODIS header'), ('area_bad_time', 'valid HHMM'), ('area_wrong_header', 'frozen MODIS header'), ('area_outside_date', 'outside the requested window'), ('area_bad_sat', 'Terra or Aqua'), ('area_outside_box', 'outside the requested box'), ('area_short_row', 'fields, expected')]:
    expect(mode, 'invalid', 1, why, windows=2, extra=lambda p, o, m, s: not os.path.exists(os.path.join(o, 'area-2007-11-04-5d.csv')) and V.verify(o) != [])
# correction 4: a response holding the key is never stored
expect('area_key_echo', 'invalid', 1, 'contained the key', windows=2, extra=lambda p, o, m, s: not any(f.startswith('area-2007-11-04') for f in os.listdir(o)) and m['requests'][-1]['sha256'] is None)
# correction 2: bytes bounded while reading
expect('area_oversize', 'stopped', 1, 'byte cap', windows=2, env={'ME_TEST_RESPONSE_CAP': '50000'},
       extra=lambda p, o, m, s: m['requests'][-1].get('bytes_read_before_stop', 10**9) <= 50000 + 65536 and not any(f.startswith('area-2007-11-04') for f in os.listdir(o)))
expect('ok', 'stopped', 1, 'cache cap', env={'ME_TEST_CACHE_CAP': '20000'}, extra=lambda p, o, m, s: m['cache_bytes'] <= 20000 and V.verify(o) != [])
expect('area_500', 'stopped', 1, 'HTTP 500', windows=2)
expect('area_500_big', 'stopped', 1, 'byte cap (65536)', windows=2, extra=lambda p, o, m, s: m['requests'][-1].get('bytes_read_before_stop', 10**9) <= 65536 + 65536)
expect('area_drop', 'stopped', 1, 'failed', windows=2)
# no key file
p, out, m, srv, leak, home = run('ok', keys=False)
check('no KEYS.md row: stops before any request, writes nothing', p.returncode == 2 and srv.log == [] and out is None and 'STOPPED' in p.stdout); shutil.rmtree(home, ignore_errors=True)

# correction 5: the verifier refuses anything incomplete or altered
p, out, m, srv, leak, home = run('ok')
check('verifier: a complete run is usable', V.verify(out) == [])
w = os.path.join(out, m['windows'][10]['file']); data = open(w, 'rb').read()
open(w, 'ab').write(b'\n'); check('verifier: an altered window file is refused', any('does not match' in x for x in V.verify(out))); open(w, 'wb').write(data)
os.rename(w, w + '.x'); check('verifier: a missing window file is refused', any('is missing' in x for x in V.verify(out))); os.rename(w + '.x', w)
g = os.path.join(out, 'missing-data.json'); os.rename(g, g + '.x'); check('verifier: a missing gap list is refused', any('missing-data.json is missing' in x for x in V.verify(out))); os.rename(g + '.x', g)
mp = os.path.join(out, 'manifest.json'); mm = json.load(open(mp)); keep = json.dumps(mm)
mm['state'] = 'stopped'; json.dump(mm, open(mp, 'w')); check('verifier: a manifest not marked complete is refused', any("not 'complete'" in x for x in V.verify(out)))
mm = json.loads(keep); del mm['gap_list']; json.dump(mm, open(mp, 'w')); check('verifier: a manifest without gap-list provenance is refused', any('no gap_list record' in x for x in V.verify(out)))
mm = json.loads(keep); mm['windows'] = mm['windows'][:-1]; json.dump(mm, open(mp, 'w')); check('verifier: a missing window in the manifest is refused', any('do not match the plan' in x for x in V.verify(out)))
open(mp, 'w').write(keep); open(os.path.join(out, 'x.part'), 'w').write('x'); check('verifier: a leftover partial file is refused', any('partial' in x for x in V.verify(out)))
shutil.rmtree(home, ignore_errors=True)

print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
